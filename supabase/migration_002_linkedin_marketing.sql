-- Run this once in Supabase SQL Editor, same way as the first schema file.
-- Adds storage for LinkedIn's own page-analytics exports (follower/visitor counts +
-- audience demographics) so they can be uploaded and charted instead of eyeballed.

create table linkedin_daily_stats (
  date date primary key,
  new_followers integer not null default 0,
  unique_visitors integer not null default 0,
  page_views integer not null default 0,
  updated_at timestamptz not null default now()
);

create table linkedin_audience_stats (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  category text not null,
  label text not null,
  value integer not null,
  uploaded_at timestamptz not null default now()
);

alter table linkedin_daily_stats enable row level security;
alter table linkedin_audience_stats enable row level security;

create policy "authenticated read/write" on linkedin_daily_stats
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on linkedin_audience_stats
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
