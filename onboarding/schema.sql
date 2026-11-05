-- KGEN client onboarding submissions. Safe to run in the existing KGEN CRM Supabase project (prefix-free table, no clash with crm_*).
create table if not exists public.onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_ref text,
  business_name text,
  contact_name text,
  email text,
  status text not null default 'new' check (status in ('new','reviewed','onboarded','archived')),
  data jsonb not null default '{}'::jsonb,
  internal jsonb not null default '{}'::jsonb
);
create index if not exists onboarding_submissions_created_idx on public.onboarding_submissions (created_at desc);

alter table public.onboarding_submissions enable row level security;

-- Clients (anon) can ONLY insert. They can never read, edit or delete anything.
drop policy if exists "anon insert onboarding" on public.onboarding_submissions;
create policy "anon insert onboarding" on public.onboarding_submissions
  for insert to anon
  with check (status = 'new' and internal = '{}'::jsonb and octet_length(data::text) < 200000);

-- Logged-in team members: full access.
drop policy if exists "team all onboarding" on public.onboarding_submissions;
create policy "team all onboarding" on public.onboarding_submissions
  for all to authenticated using (true) with check (true);

grant insert on public.onboarding_submissions to anon;
grant select, insert, update, delete on public.onboarding_submissions to authenticated;
