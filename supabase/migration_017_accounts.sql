-- Run in Supabase SQL Editor.
-- Adds the missing "Account" layer above Deals/Leads: a company-level record with its
-- own contacts (POCs) and a home for Deals. Deals and Leads keep all their existing
-- fields — this migration only adds the linking columns (deals.account_id,
-- website_leads.deal_id) plus the two new tables. Existing data is left unlinked on
-- purpose; accounts start empty and get populated by manually linking Deals/Leads going
-- forward (or via the "create Account from this Deal" quick action in the UI).

create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hq text,
  website text,
  industry text,
  company_size text,
  notes text,
  assigned_rep_id uuid references reps(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table accounts enable row level security;
create policy "authenticated read/write" on accounts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create table account_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text,
  job_title text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

alter table account_contacts enable row level security;
create policy "authenticated read/write" on account_contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create index account_contacts_account_id_idx on account_contacts(account_id);

-- Deal -> Account (nullable, additive; a deal can exist unlinked, same as today)
alter table deals
  add column account_id uuid references accounts(id) on delete set null;

create index deals_account_id_idx on deals(account_id);

-- Lead -> Deal (nullable, additive; "the lead list associated with different
-- opportunities" — a lead can be tied to a specific deal without the deal needing an
-- account yet)
alter table website_leads
  add column deal_id uuid references deals(id) on delete set null;

create index website_leads_deal_id_idx on website_leads(deal_id);

-- master_contacts gains a 5th branch. Column order must match the existing view exactly:
-- id, origin, source, name, email, phone, company, job_title, linkedin_url, touched_at.
create or replace view master_contacts as
select id, 'website_leads' as origin, source::text as source, name, email, phone, company, job_title, linkedin_url, created_at as touched_at
from website_leads
union all
select id, 'instantly_leads', 'Instantly', name, email, phone, company, job_title, linkedin_url, synced_at
from instantly_leads
union all
select id, 'linkedin_activity', 'LinkedIn Activity', prospect, null, null, company, null, linkedin_url, date_logged::timestamptz
from linkedin_activity
union all
select id, 'imported_contacts', source, name, email, phone, company, job_title, linkedin_url, imported_at
from imported_contacts
union all
select ac.id, 'account_contacts', 'Account Contact', ac.name, ac.email, ac.phone, a.name, ac.job_title, null::text, ac.created_at
from account_contacts ac
join accounts a on a.id = ac.account_id;
