begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');
insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.clients (name) values ('Acme SAS') $$,
  'un admin inserta un cliente'
);
select is((select count(*)::int from public.clients), 1, 'un admin lee los clientes');
select lives_ok(
  $$ update public.clients set email = 'a@acme.co' $$,
  'un admin edita un cliente'
);
select is(
  (select email from public.clients), 'a@acme.co', 'el cambio queda guardado'
);
select throws_ok(
  $$ insert into public.clients (name) values ('') $$,
  '23514', null, 'rechaza nombre vacío'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty('select * from public.clients', 'una cuenta sin el rol no ve clientes');
select throws_ok(
  $$ insert into public.clients (name) values ('Intruso') $$,
  '42501', null, 'una cuenta sin el rol no inserta'
);
select throws_ok(
  $$ delete from public.clients $$,
  '42501', null, 'nadie borra clientes por la API'
);

select * from finish();
rollback;
