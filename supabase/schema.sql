-- Vocom CRM schema
-- Run this once in the Supabase project's SQL Editor (Dashboard > SQL Editor > New query > paste > Run).

create extension if not exists "pgcrypto";

-- Sales reps (Victor, Kevin, Cynthia, + anyone added later)
create table reps (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into reps (name) values ('Victor'), ('Kevin'), ('Cynthia');

create type lead_status as enum ('New', 'Contacted', 'Qualified', 'Won', 'Lost');
create type deal_status as enum ('Prospecting', 'Connected', 'Conversation', 'Meeting', 'Won', 'Lost');
create type linkedin_activity_type as enum ('Follow', 'Visit', 'Like');

-- Leads from the Framer website contact form
create table website_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text,
  company text,
  location text,
  assigned_rep_id uuid references reps(id) on delete set null,
  status lead_status not null default 'New',
  contacted_date date,
  notes text,
  raw_payload jsonb
);

-- Leads synced from Instantly campaigns
create table instantly_leads (
  id uuid primary key default gen_random_uuid(),
  synced_at timestamptz not null default now(),
  campaign text,
  name text,
  email text not null,
  company text,
  job_title text,
  phone text,
  linkedin_url text,
  interest_status text not null default 'Uncontacted',
  assigned_rep_id uuid references reps(id) on delete set null,
  sales_status lead_status not null default 'New',
  notes text,
  unique (email, campaign)
);

-- Manually logged LinkedIn activity (followers, visitors, connection tracking)
create table linkedin_activity (
  id uuid primary key default gen_random_uuid(),
  date_logged date not null default current_date,
  prospect text,
  company text,
  linkedin_url text,
  activity linkedin_activity_type,
  connection_sent boolean not null default false,
  connection_accepted boolean not null default false,
  deal_status deal_status not null default 'Prospecting',
  assigned_rep_id uuid references reps(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- Row Level Security: any logged-in user (Hash Brown + Vocom sales team, invited via
-- Supabase Auth) can read/write. There's no public anonymous access.
alter table reps enable row level security;
alter table website_leads enable row level security;
alter table instantly_leads enable row level security;
alter table linkedin_activity enable row level security;

create policy "authenticated read/write" on reps
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on website_leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on instantly_leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on linkedin_activity
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
