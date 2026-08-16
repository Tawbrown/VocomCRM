-- Run in Supabase SQL Editor.
-- Bell-icon notifications: new website leads, new Instantly replies, and rep assignments
-- (reusing the existing "Assigned Rep" dropdowns on leads/activity/deals). Shared across
-- everyone who logs in, same as the rest of the app — there's no per-user account model.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_read on notifications (read);
create index if not exists idx_notifications_created_at on notifications (created_at desc);

alter table notifications enable row level security;
create policy "authenticated read/write" on notifications
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
