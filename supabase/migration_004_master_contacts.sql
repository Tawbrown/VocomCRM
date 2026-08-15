-- Run in Supabase SQL Editor, same as before.
-- Adds a place to import contact lists from anywhere (Hunter.io, LinkedIn Sales Navigator
-- exports, etc.) and a unified view of every contact this CRM has ever touched.

create table imported_contacts (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  name text,
  email text,
  phone text,
  company text,
  job_title text,
  linkedin_url text,
  raw jsonb,
  imported_at timestamptz not null default now()
);

alter table imported_contacts enable row level security;
create policy "authenticated read/write" on imported_contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Not deduplicated/merged across sources — just every contact, tagged by where it came
-- from, in one searchable list. Good enough to answer "have we ever had this person's
-- details anywhere," which is the actual ask.
create or replace view master_contacts as
select 'Website Lead' as source, name, email, null::text as phone, company, null::text as job_title, null::text as linkedin_url, created_at as touched_at
from website_leads
union all
select 'Instantly', name, email, phone, company, job_title, linkedin_url, synced_at
from instantly_leads
union all
select 'LinkedIn Activity', prospect, null, null, company, null, linkedin_url, date_logged::timestamptz
from linkedin_activity
union all
select source, name, email, phone, company, job_title, linkedin_url, imported_at
from imported_contacts;
