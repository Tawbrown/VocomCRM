-- Run in Supabase SQL Editor.
-- The Framer contact form never actually collected a geographic "location" — the old
-- form's single field was Company Size + Use Case concatenated together (e.g. "250-500
-- Fibre Optic"), and the current form sends them as two separate fields outright. This
-- adds proper columns for both and backfills the historical data by splitting the old
-- "location" string on its first space (size range first, use case after).
alter table website_leads
  add column company_size text,
  add column use_case text;

update website_leads
set
  company_size = split_part(location, ' ', 1),
  use_case = trim(substring(location from position(' ' in location))),
  location = null
where location is not null and position(' ' in location) > 0;
