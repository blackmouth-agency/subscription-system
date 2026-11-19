begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- Dos usuarios con acceso a un proyecto propio de esta prueba
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');

insert into public.projects (id, slug) values
  ('33333333-3333-3333-3333-333333333333', 'proyecto-rls'),
  ('44444444-4444-4444-4444-444444444444', 'proyecto-sin-acceso');

insert into public.entitlements (user_id, project_id) values
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- Beto aceptó los términos al registrarse
insert into public.document_acceptances (user_id, document, version) values
  ('22222222-2222-2222-2222-222222222222', 'terminos', '2026-11-19');

-- Ana consulta los accesos con su sesión
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select results_eq(
  'select user_id from public.entitlements',
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'un usuario solo ve sus propios accesos'
);

select throws_ok(
  $$ insert into public.entitlements (user_id, project_id) values
       ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444') $$,
  '42501', null,
  'un usuario no puede darse acceso a un proyecto'
);

select throws_ok(
  $$ update public.entitlements set project_id = '44444444-4444-4444-4444-444444444444'
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'un usuario no puede cambiar sus accesos'
);

select throws_ok(
  $$ delete from public.entitlements where user_id = '22222222-2222-2222-2222-222222222222' $$,
  '42501', null,
  'un usuario no puede borrar accesos'
);

-- Alguien sin sesión, con la clave publishable
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  'select 1 from public.entitlements',
  '42501', null,
  'anon no puede leer los accesos'
);

select throws_ok(
  'select 1 from public.projects',
  '42501', null,
  'anon no puede leer los proyectos'
);

-- Supresión de datos: se borra la cuenta de Beto
reset role;

select lives_ok(
  $$ delete from auth.users where id = '22222222-2222-2222-2222-222222222222' $$,
  'se puede borrar un usuario que tiene accesos'
);

select is_empty(
  $$ select 1 from public.entitlements where user_id = '22222222-2222-2222-2222-222222222222' $$,
  'borrar un usuario borra sus accesos'
);

select is_empty(
  $$ select 1 from public.document_acceptances where user_id = '22222222-2222-2222-2222-222222222222' $$,
  'borrar un usuario borra su constancia de los términos'
);

select * from finish();
rollback;
