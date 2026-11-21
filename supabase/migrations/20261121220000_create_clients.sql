-- Clientes de la agencia. Solo los admins los ven, crean y editan; sin delete.
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name <> '' and name = btrim(name)),
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy "Los admins ven los clientes"
  on public.clients for select to authenticated
  using ((select public.is_admin()));

create policy "Los admins crean clientes"
  on public.clients for insert to authenticated
  with check ((select public.is_admin()));

create policy "Los admins editan clientes"
  on public.clients for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update on public.clients to authenticated;
