create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
);

alter table public.projects enable row level security;

create table public.entitlements (
  user_id uuid not null references auth.users (id),
  project_id uuid not null references public.projects (id),
  primary key (user_id, project_id)
);

alter table public.entitlements enable row level security;

create policy "Los usuarios ven sus propios accesos"
  on public.entitlements
  for select
  to authenticated
  using (user_id = (select auth.uid()));
