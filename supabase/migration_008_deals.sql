-- Run in Supabase SQL Editor.
-- Deal pipeline: customer info, value, PIC (point of contact), product/order, and a
-- start/expected-close date range for the Gantt view.

create type deal_pipeline_status as enum ('Prospecting', 'Proposal', 'Negotiation', 'Won', 'Lost');

create table deals (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  company text,
  pic text,
  product text,
  value numeric not null default 0,
  status deal_pipeline_status not null default 'Prospecting',
  start_date date not null default current_date,
  expected_close_date date,
  assigned_rep_id uuid references reps(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table deals enable row level security;
create policy "authenticated read/write" on deals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
