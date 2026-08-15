-- Run in Supabase SQL Editor, same as before.
-- Stores Search Console query performance, GA4 landing page traffic, and the AI-generated
-- monthly content report.

create table seo_search_queries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  query text not null,
  page text,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric not null default 0,
  position numeric not null default 0,
  synced_at timestamptz not null default now(),
  unique (date, query, page)
);

create table seo_landing_pages (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  page_path text not null,
  sessions integer not null default 0,
  active_users integer not null default 0,
  conversions integer not null default 0,
  synced_at timestamptz not null default now(),
  unique (date, page_path)
);

create table seo_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  month date not null unique, -- always the 1st of the month
  summary text not null,
  content_suggestions jsonb not null default '[]',
  stats jsonb not null default '{}',
  generated_at timestamptz not null default now()
);

alter table seo_search_queries enable row level security;
alter table seo_landing_pages enable row level security;
alter table seo_monthly_reports enable row level security;

create policy "authenticated read/write" on seo_search_queries
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on seo_landing_pages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on seo_monthly_reports
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
