-- Socios comerciales. Solo los admins los ven, crean y editan; sin delete
-- (un socio se desactiva con is_active).
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name <> '' and name = btrim(name)),
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  receiving_account text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger partners_set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

alter table public.partners enable row level security;

create policy "Los admins ven los socios"
  on public.partners for select to authenticated
  using ((select public.is_admin()));

create policy "Los admins crean socios"
  on public.partners for insert to authenticated
  with check ((select public.is_admin()));

create policy "Los admins editan socios"
  on public.partners for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update on public.partners to authenticated;
