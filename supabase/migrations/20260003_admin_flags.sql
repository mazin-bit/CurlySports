-- Admin feature flags — single-row JSONB store
-- This replaces in-memory flags that reset on every deployment.

create table if not exists admin_flags (
  id int primary key default 1 check (id = 1),  -- single-row table
  flags jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seed with empty object; the app merges DEFAULT_FLAGS at read time
insert into admin_flags (id, flags)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- Only service_role should read/write admin flags
alter table admin_flags enable row level security;

-- No public access — all access goes through supabaseAdmin (service_role)
create policy "service_role_only"
  on admin_flags
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
