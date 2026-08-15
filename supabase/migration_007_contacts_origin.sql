-- Run in Supabase SQL Editor.
-- Adds id + origin table to master_contacts so imported (CSV) rows — which have no other
-- page to manage them from — can be deleted directly from the Contacts page.

create or replace view master_contacts as
select id, 'website_leads' as origin, 'Website Lead' as source, name, email, null::text as phone, company, null::text as job_title, null::text as linkedin_url, created_at as touched_at
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
