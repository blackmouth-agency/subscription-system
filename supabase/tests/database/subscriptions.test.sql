begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');
insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.clients (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme SAS');
insert into public.products (id, name, price) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hosting', 50000);

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.subscriptions (client_id, product_id, price)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 45000) $$,
  'un admin inserta una suscripción'
);
select is(
  (select row(status, commission, receiver, cycle_date)::text
   from public.subscriptions),
  row('pending', 0, 'agency', current_date)::text,
  'valores por defecto: pendiente, comisión 0, agencia, hoy'
);
select throws_ok(
  $$ insert into public.subscriptions (client_id, product_id, price)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0) $$,
  '23514', null, 'rechaza precio <= 0'
);
select throws_ok(
  $$ insert into public.subscriptions (client_id, product_id, price, commission)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000, 500) $$,
  '23514', null, 'rechaza comisión distinta de 0'
);
select throws_ok(
  $$ insert into public.subscriptions (client_id, product_id, price, status)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000, 'otro') $$,
  '23514', null, 'rechaza un estado inválido'
);
select throws_ok(
  $$ update public.subscriptions set price = 1 $$,
  '42501', null, 'nadie actualiza por la API'
);
select throws_ok(
  $$ delete from public.subscriptions $$,
  '42501', null, 'nadie borra por la API'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  'select * from public.subscriptions', 'una cuenta sin el rol no las ve'
);
select throws_ok(
  $$ insert into public.subscriptions (client_id, product_id, price)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000) $$,
  '42501', null, 'una cuenta sin el rol no inserta'
);
select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_name = 'subscriptions' and grantee = 'anon'),
  0, 'anon no tiene permisos'
);

select * from finish();
rollback;
