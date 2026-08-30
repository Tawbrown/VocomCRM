-- Run in Supabase SQL Editor.
-- Tracks how long a deal has sat in its current pipeline stage, so a deal stuck in
-- Proposal for 4 months doesn't look identical to one that just arrived there — matters
-- for fibre's 6-10 week build-to-order cycle, where a stalled deal is easy to miss
-- without this. The app updates this column to now() whenever status changes
-- (src/app/actions.ts: updateDeal, bulkUpdateDeals).
--
-- Backfill: no real stage-change history exists for current deals, so existing rows are
-- seeded from start_date as a best-effort proxy (assumes no status has changed since
-- creation — true for most, understates staleness for any that have actually moved
-- stages already). Going forward every real status change gets a real timestamp.

alter table deals add column stage_changed_at timestamptz;
update deals set stage_changed_at = start_date::timestamptz where stage_changed_at is null;
alter table deals alter column stage_changed_at set not null;
alter table deals alter column stage_changed_at set default now();
