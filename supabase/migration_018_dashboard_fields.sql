-- Run in Supabase SQL Editor.
-- Adds three app-level-controlled picklist fields for the new Sales Dashboard page:
-- accounts.region, deals.division, deals.source. Plain nullable text, not a Postgres
-- enum, matching accounts.industry/company_size's existing convention — the allowed set
-- is enforced only in the app UI (StatusSelect + a TypeScript union in
-- src/lib/types.ts). No RLS changes needed: existing "authenticated read/write"
-- policies on accounts and deals already cover new columns.

-- accounts.region: 'US-East' | 'US-Central' | 'US-West' | 'Canada' | 'APAC' | 'EMEA' | 'Other'
alter table accounts add column region text;

-- deals.division: 'Vocom International' | 'Vocom AI'
alter table deals add column division text;

-- deals.source: reuses the existing LeadSource set already used on website_leads.source.
-- Null on all existing deals (no reliable backfill signal) — captured going forward only.
alter table deals add column source text;
