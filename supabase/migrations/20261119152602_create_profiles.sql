-- El nombre y el teléfono de cada cuenta. Cada usuario los ve y los edita desde su perfil.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null constraint profiles_full_name_check check (btrim(full_name) <> ''),
  -- Celular colombiano: 10 dígitos que empiezan por 3, sin espacios ni +57.
  phone text not null constraint profiles_phone_check check (phone ~ '^3[0-9]{9}$')
);

alter table public.profiles enable row level security;

create policy "Los usuarios ven su propio perfil"
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Los usuarios crean su propio perfil"
  on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Los usuarios cambian su propio perfil"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Solo el propio usuario, con su sesión. No los borra: el perfil se va con la cuenta.
grant select, insert, update on public.profiles to authenticated;
