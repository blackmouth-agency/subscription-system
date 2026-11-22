begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');
insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.clients (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme SAS');
insert into public.products (id, name, price) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hosting', 50000);
insert into public.partners (id, name, is_active) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Socio', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Inactivo', false);

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
select is(
  (select row(partner_id, commission_type, commission_months)::text
   from public.subscriptions),
  row(null, 'indefinite', null)::text,
  'por defecto: sin socio, duración indefinida'
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
  '23514', null, 'rechaza comisión sin socio'
);
select throws_ok(
  $$ insert into public.subscriptions
       (client_id, product_id, price, commission, partner_id)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000, 1001,
             'cccccccc-cccc-cccc-cccc-cccccccccccc') $$,
  '23514', null, 'rechaza comisión mayor al precio'
);
select throws_ok(
  $$ insert into public.subscriptions
       (client_id, product_id, price, receiver)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000, 'partner') $$,
  '23514', null, 'rechaza receptor socio sin socio'
);
select throws_ok(
  $$ insert into public.subscriptions
       (client_id, product_id, price, partner_id, commission_type)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000,
             'cccccccc-cccc-cccc-cccc-cccccccccccc', 'months') $$,
  '23514', null, 'rechaza months sin commission_months'
);
select throws_ok(
  $$ insert into public.subscriptions
       (client_id, product_id, price, partner_id, commission_months)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000,
             'cccccccc-cccc-cccc-cccc-cccccccccccc', 3) $$,
  '23514', null, 'rechaza commission_months con otra duración'
);
select throws_ok(
  $$ insert into public.subscriptions (client_id, product_id, price, partner_id)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000,
             'dddddddd-dddd-dddd-dddd-dddddddddddd') $$,
  'P0409', 'El socio está inactivo', 'rechaza un socio inactivo'
);
select throws_ok(
  $$ insert into public.subscriptions (client_id, product_id, price, status)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000, 'otro') $$,
  '23514', null, 'rechaza un estado inválido'
);
select lives_ok(
  $$ update public.subscriptions
     set partner_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc',
         commission = 5000, receiver = 'partner',
         commission_type = 'months', commission_months = 3 $$,
  'un admin asigna socio, comisión, duración y receptor'
);
select throws_ok(
  $$ delete from public.subscriptions $$,
  '42501', null, 'nadie borra por la API'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  'select * from public.subscriptions', 'una cuenta sin el rol no las ve'
);
select is_empty(
  $$ update public.subscriptions set price = 1 returning 1 $$,
  'una cuenta sin el rol no actualiza'
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
