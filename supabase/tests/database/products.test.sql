begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');
insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.products (name, price) values ('Hosting', 50000) $$,
  'un admin inserta un producto'
);
select is((select count(*)::int from public.products), 1, 'un admin lee el catálogo');

select throws_ok(
  $$ insert into public.products (name, price) values ('Gratis', 0) $$,
  '23514', null, 'rechaza precio <= 0'
);
select throws_ok(
  $$ insert into public.products (name, price) values (' Hosting', 1000) $$,
  '23514', null, 'rechaza nombre con espacios sobrantes'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty('select * from public.products', 'una cuenta sin el rol no ve productos');
select throws_ok(
  $$ insert into public.products (name, price) values ('Intruso', 1000) $$,
  '42501', null, 'una cuenta sin el rol no inserta'
);
select throws_ok(
  $$ delete from public.products $$,
  '42501', null, 'nadie borra productos por la API'
);

select * from finish();
rollback;
