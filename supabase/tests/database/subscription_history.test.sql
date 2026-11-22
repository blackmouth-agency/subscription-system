begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');
insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.clients (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme SAS');
insert into public.products (id, name, price) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hosting', 50000);
insert into public.partners (id, name) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Socio'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Socio');
insert into public.subscriptions (id, client_id, product_id, price) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 50000);

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "email": "ana@test.local"}';

select is((select count(*)::int from public.subscription_history), 0,
  'crear la suscripción no deja historial');

update public.subscriptions set cycle_date = '2026-12-01';
select is((select count(*)::int from public.subscription_history), 0,
  'cambiar solo la fecha no deja historial');

update public.subscriptions set status = 'active';
select is(
  (select row(field, old_value, new_value, changed_by, changed_by_email)::text
   from public.subscription_history),
  row('status', 'pending', 'active',
      '11111111-1111-1111-1111-111111111111'::uuid, 'ana@test.local')::text,
  'el estado deja una fila con anterior, nuevo, quién y correo'
);

update public.subscriptions set price = 40000, receiver = 'agency';
select is(
  (select array_agg(field order by field) from public.subscription_history
   where field in ('price', 'receiver')),
  array['price'],
  'un update con dos campos solo registra el que cambió'
);

update public.subscriptions
  set partner_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc', commission = 5000,
      commission_type = 'months', commission_months = 3, receiver = 'partner';
select is(
  (select array_agg(field order by field) from public.subscription_history
   where field <> 'status' and field <> 'price'),
  array['commission', 'commission_months', 'commission_type', 'partner_id',
        'receiver'],
  'socio, comisión, duración y receptor dejan una fila cada uno'
);
select is(
  (select old_value || '>' || new_value from public.subscription_history
   where field = 'partner_id'),
  '>Socio', 'el socio se guarda por nombre; sin socio queda vacío'
);

update public.subscriptions set commission_type = 'once',
  commission_months = null;
select is(
  (select count(*)::int from public.subscription_history
   where field in ('commission_type', 'commission_months')),
  4, 'pasar a única registra el tipo y borra las mensualidades (2 filas más)'
);

update public.subscriptions
  set partner_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
select is(
  (select count(*)::int from public.subscription_history
   where field = 'partner_id'),
  2, 'cambiar a otro socio con el mismo nombre también se registra'
);

select is(
  (select count(distinct changed_at)::int from public.subscription_history
   where field in ('commission', 'partner_id', 'receiver')
     and old_value <> new_value and changed_at = (select min(changed_at)
       from public.subscription_history where field = 'commission')),
  1, 'los campos de un mismo update comparten fecha'
);

select throws_ok(
  $$ insert into public.subscription_history
       (subscription_id, field, old_value, new_value)
     values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'price', '1', '2') $$,
  '42501', null, 'nadie inserta por la API'
);
select throws_ok(
  $$ update public.subscription_history set new_value = 'x' $$,
  '42501', null, 'nadie actualiza'
);
select throws_ok(
  $$ delete from public.subscription_history $$,
  '42501', null, 'nadie borra'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select is((select count(*)::int from public.subscription_history), 0,
  'un no admin no ve el historial');

reset role;
set local request.jwt.claims = '';
update public.subscriptions set status = 'suspended';
select is(
  (select row(changed_by, changed_by_email)::text
   from public.subscription_history where new_value = 'suspended'),
  row(null::uuid, '')::text,
  'un cambio por SQL sin JWT queda sin autor'
);

select * from finish();
rollback;
