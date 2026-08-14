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

  return NextResponse.json({ ok: true, inserted, skippedCampaigns });
}
