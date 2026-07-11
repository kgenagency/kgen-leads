-- KGEN CRM schema (tables namespaced crm_* to avoid clashing with existing "leads" table)
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text,
  phone text,
  social text,
  heard_from text,
  source text,
  status text not null default 'new',
  note text
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  type text not null check (type in ('comment','status','fathom','screenshot')),
  author text not null,
  body text,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists crm_activities_lead_idx on public.crm_activities(lead_id, created_at);
create index if not exists crm_leads_created_idx on public.crm_leads(created_at desc);

alter table public.crm_leads enable row level security;
alter table public.crm_activities enable row level security;

drop policy if exists "crm team select" on public.crm_leads;
drop policy if exists "crm team insert" on public.crm_leads;
drop policy if exists "crm team update" on public.crm_leads;
drop policy if exists "crm team delete" on public.crm_leads;
create policy "crm team select" on public.crm_leads for select to authenticated using (true);
create policy "crm team insert" on public.crm_leads for insert to authenticated with check (true);
create policy "crm team update" on public.crm_leads for update to authenticated using (true);
create policy "crm team delete" on public.crm_leads for delete to authenticated using (true);

drop policy if exists "crm act select" on public.crm_activities;
drop policy if exists "crm act insert" on public.crm_activities;
drop policy if exists "crm act delete" on public.crm_activities;
create policy "crm act select" on public.crm_activities for select to authenticated using (true);
create policy "crm act insert" on public.crm_activities for insert to authenticated with check (true);
create policy "crm act delete" on public.crm_activities for delete to authenticated using (true);

-- storage bucket for chat screenshots
insert into storage.buckets (id, name, public)
values ('screenshots','screenshots', true)
on conflict (id) do nothing;

drop policy if exists "crm screenshots upload" on storage.objects;
create policy "crm screenshots upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'screenshots');
drop policy if exists "crm screenshots read" on storage.objects;
create policy "crm screenshots read" on storage.objects
  for select using (bucket_id = 'screenshots');
