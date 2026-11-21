-- Catálogo de productos. Solo los admins lo ven y lo crean; editar y retirar
-- vienen después (sin update ni delete por ahora).
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name <> '' and name = btrim(name)),
  description text not null default '',
  price integer not null check (price > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Los admins ven el catálogo"
  on public.products for select to authenticated
  using ((select public.is_admin()));

create policy "Los admins crean productos"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));

grant select, insert on public.products to authenticated;
