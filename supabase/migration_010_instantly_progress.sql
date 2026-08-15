-- Run in Supabase SQL Editor.
-- Instantly campaigns get paused/completed over time, and leads move through a
-- campaign's send sequence independently of whether they've replied. Without this,
-- "Contacted / No Reply Yet" leads from a campaign that finished six months ago look
-- identical to ones currently mid-sequence in an active campaign.
alter table instantly_leads
  add column campaign_status text,
  add column sequence_status text,
  add column last_contacted_at timestamptz;

create index if not exists idx_instantly_leads_campaign_status on instantly_leads (campaign_status);
create index if not exists idx_instantly_leads_sequence_status on instantly_leads (sequence_status);
