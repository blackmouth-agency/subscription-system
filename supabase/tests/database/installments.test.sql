begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');
insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.clients (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme SAS');
insert into public.products (id, name, price) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hosting', 50000);

-- Una suscripción por caso; el estado por defecto es pending.
create function pg_temp.sub(p_id text, p_cycle date, p_status text default 'pending')
returns void language sql as $$
  insert into public.subscriptions (id, client_id, product_id, price,
                                    cycle_date, status)
  values (p_id::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 50000, p_cycle, p_status);
$$;
create function pg_temp.dues(p_id text) returns text language sql as $$
  select coalesce(
    string_agg(due_date::text || ':' || status, ',' order by due_date), '')
  from public.installments where subscription_id = p_id::uuid;
$$;

-- Primera mensualidad en cycle_date y nada antes; fecha futura no genera.
select pg_temp.sub('00000000-0000-0000-0000-000000000001', '2026-03-10');
select pg_temp.sub('00000000-0000-0000-0000-000000000002', '2026-06-10');
select public.generate_installments('2026-03-09');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000001'), '',
  'nada antes de cycle_date');
select public.generate_installments('2026-03-10');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000001'),
  '2026-03-10:to_activate', 'la primera nace en cycle_date');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000002'), '',
  'una cycle_date futura no genera nada');

-- Recupera varios meses y no duplica.
select public.generate_installments('2026-05-20');
select public.generate_installments('2026-05-20');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000001'),
  '2026-03-10:to_activate,2026-04-10:to_activate,2026-05-10:to_activate',
  'recupera los atrasados y correrla dos veces no duplica');

-- Active genera pending; suspended y cancelled se saltan.
select pg_temp.sub('00000000-0000-0000-0000-000000000003', '2026-05-01', 'active');
select pg_temp.sub('00000000-0000-0000-0000-000000000004', '2026-05-01', 'suspended');
select pg_temp.sub('00000000-0000-0000-0000-000000000005', '2026-05-01', 'cancelled');
select public.generate_installments('2026-05-20');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000003'),
  '2026-05-01:pending', 'una active genera pending');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000004')
  || pg_temp.dues('00000000-0000-0000-0000-000000000005'), '',
  'suspended y cancelled no generan');

-- Activar pasa las to_activate a pending.
update public.subscriptions set status = 'active'
  where id = '00000000-0000-0000-0000-000000000001';
select is(pg_temp.dues('00000000-0000-0000-0000-000000000001'),
  '2026-03-10:pending,2026-04-10:pending,2026-05-10:pending',
  'activar pasa las to_activate a pending');
select is((select resumed_on from public.subscriptions
  where id = '00000000-0000-0000-0000-000000000001'), null,
  'activar desde pending no guarda resumed_on');

-- Suspender, esperar meses y reactivar: sin hueco, conserva la deuda.
select pg_temp.sub('00000000-0000-0000-0000-000000000006', '2026-01-10', 'active');
select public.generate_installments('2026-03-10');
update public.subscriptions set status = 'suspended'
  where id = '00000000-0000-0000-0000-000000000006';
select public.generate_installments('2026-08-05');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000006'),
  '2026-01-10:pending,2026-02-10:pending,2026-03-10:pending',
  'suspendida no genera');
update public.subscriptions set status = 'active'
  where id = '00000000-0000-0000-0000-000000000006';
select is((select resumed_on from public.subscriptions
  where id = '00000000-0000-0000-0000-000000000006'),
  (now() at time zone 'America/Bogota')::date,
  'reactivar guarda resumed_on con el día de hoy en Bogotá');
-- Se fija un resumed_on conocido para no depender del reloj.
update public.subscriptions set resumed_on = '2026-08-15'
  where id = '00000000-0000-0000-0000-000000000006';
select public.generate_installments('2026-09-10');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000006'),
  '2026-01-10:pending,2026-02-10:pending,2026-03-10:pending,2026-09-10:pending',
  'sin hueco: conserva la deuda y la siguiente nace en septiembre');

-- El precio se copia y un cambio posterior no la altera.
update public.subscriptions set price = 60000
  where id = '00000000-0000-0000-0000-000000000003';
select is((select amount from public.installments
  where subscription_id = '00000000-0000-0000-0000-000000000003'
    and due_date = '2026-05-01'), 50000,
  'un cambio de precio no altera la mensualidad ya generada');

-- Fin de mes: 31 ene. → 28 feb. → 28 mar.; bisiesto 31 ene. → 29 feb.
select pg_temp.sub('00000000-0000-0000-0000-000000000007', '2027-01-31', 'active');
select pg_temp.sub('00000000-0000-0000-0000-000000000008', '2028-01-31', 'active');
select public.generate_installments('2027-03-31');
select is(pg_temp.dues('00000000-0000-0000-0000-000000000007'),
  '2027-01-31:pending,2027-02-28:pending,2027-03-28:pending',
  'fin de mes: 31 ene. → 28 feb. → 28 mar.');
select public.generate_installments('2028-03-31');
select is((select string_agg(due_date::text, ',' order by due_date)
  from public.installments
  where subscription_id = '00000000-0000-0000-0000-000000000008'),
  '2028-01-31,2028-02-29,2028-03-29', 'año bisiesto: 29 feb.');

-- Permisos y job.
select function_privs_are('public', 'generate_installments', array['date'],
  'authenticated', array[]::text[],
  'authenticated no puede ejecutar generate_installments');
select is((select count(*)::int from cron.job
  where jobname = 'generate-installments' and schedule = '0 5 * * *'), 1,
  'existe el job de pg_cron');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select is((select count(*)::int from public.installments), 0,
  'un no admin no ve mensualidades');

set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select cmp_ok((select count(*)::int from public.installments), '>', 0,
  'el admin lee las mensualidades');
select throws_ok(
  $$ insert into public.installments (subscription_id, due_date, amount, status)
     values ('00000000-0000-0000-0000-000000000003', '2030-01-01', 1, 'pending') $$,
  '42501', null, 'nadie inserta por la API');
select throws_ok(
  $$ update public.installments set amount = 1 $$,
  '42501', null, 'nadie actualiza por la API');
select throws_ok(
  $$ delete from public.installments $$,
  '42501', null, 'nadie borra por la API');

select * from finish();
rollback;
