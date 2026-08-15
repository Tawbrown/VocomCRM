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

interface InstantlyEmail {
  ue_type: number;
  lead?: string;
  timestamp_email: string;
  body?: { text?: string; html?: string };
}

async function syncReplies(supabase: ReturnType<typeof createAdminClient>, apiKey: string) {
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000; // only look back 3 days — this runs daily
  let startingAfter: string | null = null;
  let processed = 0;
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

      const replyText = email.body?.text?.trim() || (email.body?.html ? stripHtml(email.body.html) : '');
      if (!replyText) continue;
      const phone = extractPhone(replyText);

      await supabase
        .from('instantly_leads')
        .update({
          reply_text: replyText,
          reply_phone: phone,
          needs_cold_call: phone !== null,
          last_reply_at: email.timestamp_email
        })
        .eq('email', email.lead);
      processed++;
    }

    startingAfter = hitCutoff ? null : (page.next_starting_after ?? null);
    pages++;
  } while (startingAfter && pages < 10); // hard cap so a bad response can't loop forever

  return processed;
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

  let inserted = 0;
  const skippedCampaigns: string[] = [];

  for (const campaign of campaigns) {
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

        for (const lead of page.items ?? []) {
          if (!lead.email) continue;

          const { error } = await supabase.from('instantly_leads').insert({
            campaign: campaign.name,
            name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || null,
            email: lead.email,
            company: lead.company_name ?? null,
            job_title: lead.job_title ?? null,
            phone: lead.phone ?? null,
            linkedin_url: lead.payload?.linkedIn ?? null,
            interest_status: interestStatusLabel(lead.lt_interest_status)
          });

          // Unique violation (23505) means this lead's already synced — expected, not an error.
          // Skip so we never clobber a rep's assigned_rep/sales_status/notes edits.
          if (!error) inserted++;
          else if (error.code !== '23505') throw error;
        }

        startingAfter = page.next_starting_after ?? null;
      } while (startingAfter);
    } catch (err) {
      skippedCampaigns.push(campaign.name);
      console.error(`Skipped campaign "${campaign.name}" after repeated errors:`, err);
    }
  }

  let repliesProcessed = 0;
  try {
    repliesProcessed = await syncReplies(supabase, apiKey);
  } catch (err) {
    console.error('Reply sync failed:', err);
  }

  return NextResponse.json({ ok: true, inserted, skippedCampaigns, repliesProcessed });
}
