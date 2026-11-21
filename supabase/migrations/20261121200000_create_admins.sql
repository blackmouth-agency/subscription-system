-- Quién es admin. El rol vive aquí y no en el JWT: quitarlo aplica al instante.
-- Solo se asigna por SQL: nadie escribe por la API.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

create policy "Los admins ven su propia fila"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.admins to authenticated;

-- Sin security definer: la RLS de admins ya deja ver solo la propia fila.
create function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
