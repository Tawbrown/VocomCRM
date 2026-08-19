-- Run in Supabase SQL Editor.
-- notifications.related_id lets a notification link straight to the specific record it's
-- about (a lead, a deal, etc.) instead of just the general page. instantly_leads.
-- alternative_email captures any other contact email a lead mentions in their reply text
-- (e.g. "reach my colleague at x@company.com instead").
alter table notifications add column related_id text;
alter table instantly_leads add column alternative_email text;
