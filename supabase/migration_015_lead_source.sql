-- Run in Supabase SQL Editor.
-- "Website Leads" is being renamed to "Leads" in the app since it now holds leads from
-- offline events and research, not just the Framer contact form. This adds a source tag
-- so they stay distinguishable, and updates master_contacts so Contacts reflects the real
-- source instead of the old hardcoded "Website Lead" label.
create type lead_source as enum ('Website', 'Offline Event', 'Referral', 'Research', 'Other');

alter table website_leads add column source lead_source not null default 'Website';

-- Backfill the distributor-outreach batch imported earlier today.
update website_leads set source = 'Offline Event'
where notes ilike '%Distributor Outreach research doc — Confirmed Contacts%';

update website_leads set source = 'Research'
where notes ilike '%Distributor Outreach research doc — Expansion Targets%';

create or replace view master_contacts as
select id, 'website_leads' as origin, source::text as source, name, email, null::text as phone, company, null::text as job_title, null::text as linkedin_url, created_at as touched_at
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
