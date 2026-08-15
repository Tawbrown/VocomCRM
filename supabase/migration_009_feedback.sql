-- Run in Supabase SQL Editor.
-- Internal feedback / feature-request tracker.

create type feedback_status as enum ('Open', 'In Progress', 'Resolved', 'Won''t Fix');

create table feedback (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  submitted_by_rep_id uuid references reps(id) on delete set null,
  status feedback_status not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table feedback enable row level security;
create policy "authenticated read/write" on feedback
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
