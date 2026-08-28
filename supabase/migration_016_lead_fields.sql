-- Run in Supabase SQL Editor.
-- Adds job title, phone, LinkedIn, and priority at the lead level, and a LinkedIn source
-- tag (for leads sourced from LinkedIn outreach, distinct from LinkedIn Activity tracking).
alter table website_leads
  add column job_title text,
  add column phone text,
  add column linkedin_url text,
  add column priority text;

alter type lead_source add value 'LinkedIn';

-- Was hardcoded to null for the website_leads branch since those columns didn't exist yet.
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
from imported_contacts;
