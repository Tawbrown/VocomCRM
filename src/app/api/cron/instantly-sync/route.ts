import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

const INTEREST_LABELS: Record<string, string> = {
  '0': 'Out of Office',
  '1': 'Interested',
  '2': 'Meeting Booked',
  '3': 'Meeting Completed',
  '4': 'Won',
  '-1': 'Not Interested',
  '-2': 'Wrong Person',
  '-3': 'Lost',
  '-4': 'No Show'
};

function interestStatusLabel(code: number | string | null | undefined): string {
  if (code === null || code === undefined) return 'Uncontacted';
  return INTEREST_LABELS[String(code)] ?? String(code);
}

interface InstantlyCampaign {
  id: string;
  name: string;
}

interface InstantlyLeadPayload {
  linkedIn?: string;
}

interface InstantlyLead {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  phone?: string;
  lt_interest_status?: number | string | null;
  payload?: InstantlyLeadPayload;
}

async function instantlyFetch(path: string, apiKey: string, init?: RequestInit) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`https://api.instantly.ai/api/v2${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${apiKey}`, ...(init?.headers ?? {}) }
    });
    if (res.status < 500) return res;
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1500 * attempt));
    else throw new Error(`Instantly API returned ${res.status} after ${maxAttempts} attempts`);
  }
  throw new Error('unreachable');
}

// Loose international phone matcher — heuristic, not a strict validator. Reps should
// glance at the full reply text rather than trust this blindly on edge cases.
const PHONE_REGEX =
  /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?(?:[-.\s]\d{2,4}){2,4}(?:\s?(?:ext|x)\.?\s?\d{1,5})?/gi;

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPhone(text: string): string | null {
  const matches = text.match(PHONE_REGEX) ?? [];
  const plausible = matches
    .map((m) => m.trim())
    .filter((m) => m.replace(/\D/g, '').length >= 7 && m.replace(/\D/g, '').length <= 15);
  return plausible[0] ?? null;
}

async function runInBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

// Supabase caps a query at 1000 rows unless you page through it with .range() — this
// table has 12,000+ rows, so an unpaginated select here would silently truncate and
// make already-synced leads look new on every future run.
async function fetchAllRows<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null }>
): Promise<T[]> {
  const pageSize = 1000;
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data } = await query(from, from + pageSize - 1);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function syncLeads(
  supabase: ReturnType<typeof createAdminClient>,
  apiKey: string,
  campaigns: InstantlyCampaign[]
) {
  const existingRows = await fetchAllRows<{ email: string; campaign: string | null }>((from, to) =>
    supabase.from('instantly_leads').select('email, campaign').range(from, to)
  );
  const existing = new Set(existingRows.map((r) => `${r.email}|||${r.campaign}`));

  let inserted = 0;
  const skippedCampaigns: string[] = [];

  // Campaigns are independent, so scan several at once — with 27+ campaigns and no way
  // to ask Instantly for "what's new since X" (checked, doesn't exist), sequential
  // scanning is what blew past Vercel's time limit in the first place.
  await runInBatches(campaigns, 6, async (campaign) => {
    try {
      let startingAfter: string | null = null;
      do {
        const body: Record<string, unknown> = { campaign: campaign.id, limit: 100 };
        if (startingAfter) body.starting_after = startingAfter;

        const pageRes = await instantlyFetch('/leads/list', apiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const page = (await pageRes.json()) as {
          items?: InstantlyLead[];
          next_starting_after?: string | null;
        };

        const newRows = (page.items ?? [])
          .filter((lead) => lead.email && !existing.has(`${lead.email}|||${campaign.name}`))
          .map((lead) => ({
            campaign: campaign.name,
            name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || null,
            email: lead.email,
            company: lead.company_name ?? null,
            job_title: lead.job_title ?? null,
            phone: lead.phone ?? null,
            linkedin_url: lead.payload?.linkedIn ?? null,
            interest_status: interestStatusLabel(lead.lt_interest_status)
          }));

        if (newRows.length > 0) {
          const { error } = await supabase.from('instantly_leads').insert(newRows);
          if (error && error.code !== '23505') throw error;
          newRows.forEach((r) => existing.add(`${r.email}|||${r.campaign}`));
          inserted += newRows.length;
        }

        startingAfter = page.next_starting_after ?? null;
      } while (startingAfter);
    } catch (err) {
      skippedCampaigns.push(campaign.name);
      console.error(`Skipped campaign "${campaign.name}" after repeated errors:`, err);
    }
  });

  return { inserted, skippedCampaigns };
}

interface InstantlyEmail {
  ue_type: number;
  lead?: string;
  timestamp_email: string;
  body?: { text?: string; html?: string };
}

async function syncReplies(supabase: ReturnType<typeof createAdminClient>, apiKey: string) {
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000; // only look back 3 days — this runs daily

  const { data: knownReplies } = await supabase
    .from('instantly_leads')
    .select('email, last_reply_at')
    .not('last_reply_at', 'is', null);
  const lastSeenByEmail = new Map((knownReplies ?? []).map((r) => [r.email, r.last_reply_at as string]));

  const updates: { email: string; reply_text: string; reply_phone: string | null; last_reply_at: string }[] = [];
  let startingAfter: string | null = null;
  let pages = 0;

  do {
    const qs = new URLSearchParams({ limit: '100' });
    if (startingAfter) qs.set('starting_after', startingAfter);
    const res = await instantlyFetch(`/emails?${qs}`, apiKey);
    const page = (await res.json()) as { items?: InstantlyEmail[]; next_starting_after?: string | null };
    const items = page.items ?? [];

    let hitCutoff = false;
    for (const email of items) {
      if (new Date(email.timestamp_email).getTime() < cutoff) {
        hitCutoff = true;
        break;
      }
      if (email.ue_type !== 2 || !email.lead) continue; // 2 = inbound reply from the lead

      const alreadySeen = lastSeenByEmail.get(email.lead);
      if (alreadySeen && new Date(alreadySeen).getTime() >= new Date(email.timestamp_email).getTime()) continue;

      const replyText = email.body?.text?.trim() || (email.body?.html ? stripHtml(email.body.html) : '');
      if (!replyText) continue;

      updates.push({
        email: email.lead,
        reply_text: replyText,
        reply_phone: extractPhone(replyText),
        last_reply_at: email.timestamp_email
      });
    }

    startingAfter = hitCutoff ? null : (page.next_starting_after ?? null);
    pages++;
  } while (startingAfter && pages < 10); // hard cap so a bad response can't loop forever

  await runInBatches(updates, 15, async (u) => {
    await supabase
      .from('instantly_leads')
      .update({
        reply_text: u.reply_text,
        reply_phone: u.reply_phone,
        needs_cold_call: u.reply_phone !== null,
        last_reply_at: u.last_reply_at
      })
      .eq('email', u.email);
  });

  return updates.length;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'INSTANTLY_API_KEY not set' }, { status: 500 });
  }

  const supabase = createAdminClient();
  const campaignsRes = await instantlyFetch('/campaigns?limit=100', apiKey);
  const { items: campaigns = [] } = (await campaignsRes.json()) as { items: InstantlyCampaign[] };

  const { inserted, skippedCampaigns } = await syncLeads(supabase, apiKey, campaigns);

  let repliesProcessed = 0;
  try {
    repliesProcessed = await syncReplies(supabase, apiKey);
  } catch (err) {
    console.error('Reply sync failed:', err);
  }

  return NextResponse.json({ ok: true, inserted, skippedCampaigns, repliesProcessed });
}
