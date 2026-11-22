-- Suscripciones directas: cliente + producto, con el precio contratado.
-- Solo los admins las ven y crean; sin update ni delete hasta las historias 6-7.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  product_id uuid not null references public.products (id),
  price integer not null check (price > 0),
  commission integer not null default 0 check (commission = 0),
  receiver text not null default 'agency'
    check (receiver in ('agency', 'partner')),
  cycle_date date not null default current_date,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "Los admins ven las suscripciones"
  on public.subscriptions for select to authenticated
  using ((select public.is_admin()));

create policy "Los admins crean suscripciones"
  on public.subscriptions for insert to authenticated
  with check ((select public.is_admin()));

grant select, insert on public.subscriptions to authenticated;
