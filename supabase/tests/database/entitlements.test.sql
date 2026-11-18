begin;
create extension if not exists pgtap with schema extensions;
select plan(1);

-- Dos usuarios con acceso a un proyecto propio de esta prueba
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');

insert into public.projects (id, slug) values
  ('33333333-3333-3333-3333-333333333333', 'proyecto-rls');

insert into public.entitlements (user_id, project_id) values
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- Ana consulta los accesos con su sesión
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select results_eq(
  'select user_id from public.entitlements',
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'un usuario solo ve sus propios accesos'
);

select * from finish();
rollback;
