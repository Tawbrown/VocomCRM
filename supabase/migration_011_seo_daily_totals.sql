-- Run in Supabase SQL Editor.
-- Google Search Console anonymizes/omits rows for rare search terms once you break results
-- down by individual query (a privacy feature on Google's end, not a bug here) — querying
-- ['date','query','page'] for this site returns 4 total clicks for a window that actually
-- had 82, because most of those clicks belong to now-hidden low-volume queries. The
-- per-query table still needs that breakdown, but the trend chart needs real totals, so
-- this is a separate, undimensioned-by-query sync target.
create table seo_daily_totals (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric not null default 0,
  position numeric not null default 0,
  synced_at timestamptz not null default now()
);

alter table seo_daily_totals enable row level security;
create policy "authenticated read/write" on seo_daily_totals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
