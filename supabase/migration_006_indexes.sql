-- Run in Supabase SQL Editor. Instantly Leads now filters/counts by these columns on
-- every page load — indexing keeps that fast as the table keeps growing (12,852+ rows
-- already).
create index if not exists idx_instantly_leads_interest_status on instantly_leads (interest_status);
create index if not exists idx_instantly_leads_needs_cold_call on instantly_leads (needs_cold_call) where needs_cold_call = true;
create index if not exists idx_instantly_leads_synced_at on instantly_leads (synced_at desc);
