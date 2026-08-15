-- Run in Supabase SQL Editor, same as before.
-- Adds reply capture to Instantly leads: the actual reply text, any phone number found in
-- it (regex-extracted, so double-check against the full text), and a flag for the sales
-- team to chase up with a call.

alter table instantly_leads
  add column reply_text text,
  add column reply_phone text,
  add column needs_cold_call boolean not null default false,
  add column last_reply_at timestamptz;
