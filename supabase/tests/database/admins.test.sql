begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');

insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

-- Ana es admin
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is(public.is_admin(), true, 'un admin pasa is_admin()');

select throws_ok(
  $$ insert into public.admins (user_id) values ('22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'un admin no puede dar el rol por la API'
);

select throws_ok(
  $$ delete from public.admins $$,
  '42501', null,
  'un admin no puede quitar el rol por la API'
);

-- Beto no es admin y no ve a nadie
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is(public.is_admin(), false, 'una cuenta sin el rol no pasa is_admin()');
select is_empty('select * from public.admins', 'una cuenta sin el rol no ve a los admins');

select throws_ok(
  $$ insert into public.admins (user_id) values ('22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'una cuenta no puede darse el rol por la API'
);

-- Quitar el rol aplica al instante
reset role;
delete from public.admins;
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is(public.is_admin(), false, 'al quitar el rol, is_admin() cambia al instante');

select * from finish();
rollback;
