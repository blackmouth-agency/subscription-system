begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');
insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.clients (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme SAS');
insert into public.products (id, name, price) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hosting', 10000);
insert into public.partners (id, name) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Socio');

-- Una suscripción por caso (precio 10000); cada mensualidad se siembra directa.
insert into public.subscriptions
  (id, client_id, product_id, price, status, partner_id, commission,
   commission_type, commission_months, receiver) values
  ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000, 'pending', null, 0, 'indefinite', null, 'agency'),
  ('00000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000, 'cancelled', null, 0, 'indefinite', null, 'agency'),
  ('00000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000, 'suspended', null, 0, 'indefinite', null, 'agency'),
  ('00000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000, 'pending',
   'cccccccc-cccc-cccc-cccc-cccccccccccc', 3000, 'months', 2, 'partner'),
  ('00000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000, 'active',
   'cccccccc-cccc-cccc-cccc-cccccccccccc', 3000, 'once', null, 'agency'),
  ('00000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000, 'active',
   'cccccccc-cccc-cccc-cccc-cccccccccccc', 3000, 'indefinite', null, 'agency'),
  ('00000000-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000, 'active', null, 0, 'indefinite', null, 'agency');
insert into public.installments (subscription_id, due_date, amount, status) values
  ('00000000-0000-0000-0000-000000000001', '2026-01-10', 10000, 'to_activate'),
  ('00000000-0000-0000-0000-000000000001', '2026-02-10', 10000, 'to_activate'),
  ('00000000-0000-0000-0000-000000000001', '2026-03-10', 10000, 'to_activate'),
  ('00000000-0000-0000-0000-000000000002', '2026-01-10', 10000, 'pending'),
  ('00000000-0000-0000-0000-000000000003', '2026-01-10', 10000, 'pending'),
  ('00000000-0000-0000-0000-000000000004', '2026-01-10', 10000, 'to_activate'),
  ('00000000-0000-0000-0000-000000000004', '2026-02-10', 10000, 'to_activate'),
  ('00000000-0000-0000-0000-000000000004', '2026-03-10', 10000, 'to_activate'),
  ('00000000-0000-0000-0000-000000000005', '2026-01-10', 10000, 'pending'),
  ('00000000-0000-0000-0000-000000000005', '2026-02-10', 10000, 'pending'),
  ('00000000-0000-0000-0000-000000000006', '2026-01-10', 2000, 'pending'),
  ('00000000-0000-0000-0000-000000000006', '2026-02-10', 10000, 'pending'),
  ('00000000-0000-0000-0000-000000000007', '2026-01-10', 10000, 'pending');

select throws_ok(
  $$update public.installments set status = 'paid'
    where subscription_id = '00000000-0000-0000-0000-000000000007'$$,
  '23514', null, 'paid exige pago y reparto');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "email": "ana@test.local"}';

-- Pago de las dos más antiguas; el primer pago activa la suscripción.
select is((select amount from public.register_payment(
  '00000000-0000-0000-0000-000000000001', 20000, '2026-03-10', 'transfer',
  'ref-1', '10000000-0000-0000-0000-000000000001')), 20000,
  'paga las dos más antiguas');
select is((select string_agg(status, ',' order by due_date)
  from public.installments
  where subscription_id = '00000000-0000-0000-0000-000000000001'),
  'paid,paid,pending', 'la tercera queda pending (ya se activó)');
select is((select status from public.subscriptions
  where id = '00000000-0000-0000-0000-000000000001'), 'active',
  'el primer pago activa la suscripción');
select is((select count(*)::int from public.subscription_history
  where subscription_id = '00000000-0000-0000-0000-000000000001'
    and field = 'status' and changed_by_email = 'ana@test.local'), 1,
  'la activación deja entrada en el historial');

-- Repetir la clave devuelve el original.
select is((select id from public.register_payment(
  '00000000-0000-0000-0000-000000000001', 20000, '2026-03-10', 'transfer',
  'ref-1', '10000000-0000-0000-0000-000000000001')),
  (select id from public.payments
   where idempotency_key = '10000000-0000-0000-0000-000000000001'),
  'la misma clave devuelve el pago original');
select is((select count(*)::int from public.payments
  where subscription_id = '00000000-0000-0000-0000-000000000001'), 1,
  'repetir la clave no duplica');

-- Solo mensualidades completas.
select throws_ok($$select public.register_payment(
  '00000000-0000-0000-0000-000000000001', 15000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000002')$$, 'P0001',
  'El importe no corresponde a mensualidades completas',
  'rechaza una mensualidad a medias');
select throws_ok($$select public.register_payment(
  '00000000-0000-0000-0000-000000000001', 30000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000002')$$, 'P0001',
  'El importe no corresponde a mensualidades completas',
  'rechaza un importe mayor al adeudado');

-- Nunca paga dos veces la misma.
select lives_ok($$select public.register_payment(
  '00000000-0000-0000-0000-000000000001', 10000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000003')$$, 'paga la última');
select throws_ok($$select public.register_payment(
  '00000000-0000-0000-0000-000000000001', 10000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000004')$$, 'P0001',
  'No hay mensualidades por pagar', 'sin pendientes no vuelve a pagar');

-- Cancelada rechaza; suspendida acepta y sigue suspendida.
select throws_ok($$select public.register_payment(
  '00000000-0000-0000-0000-000000000002', 10000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000005')$$, 'P0001',
  'La suscripción está cancelada', 'una cancelada rechaza');
select lives_ok($$select public.register_payment(
  '00000000-0000-0000-0000-000000000003', 10000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000006')$$, 'una suspendida acepta');
select is((select status from public.subscriptions
  where id = '00000000-0000-0000-0000-000000000003'), 'suspended',
  'la suspendida sigue suspendida');
select throws_ok($$select public.register_payment(
  '99999999-9999-9999-9999-999999999999', 10000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000007')$$, 'P0002',
  'Suscripción no encontrada', 'suscripción inexistente');
select throws_ok($$select public.register_payment(
  '00000000-0000-0000-0000-000000000007', 10000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000001')$$, 'P0001',
  'La clave de idempotencia ya se usó', 'la clave no sirve en otra suscripción');

-- Reparto: months con N = 2 y un pago de 3 meses; el receptor queda copiado.
select public.register_payment(
  '00000000-0000-0000-0000-000000000004', 30000, '2026-03-10', 'transfer', '',
  '10000000-0000-0000-0000-000000000008');
select is((select string_agg(commission_amount::text, ',' order by due_date)
  from public.installments
  where subscription_id = '00000000-0000-0000-0000-000000000004'),
  '3000,3000,0', 'months: solo las N primeras llevan comisión');
select is((select string_agg(agency_amount::text, ',' order by due_date)
  from public.installments
  where subscription_id = '00000000-0000-0000-0000-000000000004'),
  '7000,7000,10000', 'la agencia recibe el resto');
select is((select row(receiver, partner_id)::text from public.payments
  where idempotency_key = '10000000-0000-0000-0000-000000000008'),
  row('partner', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid)::text,
  'el pago copia receptor y socio');
update public.subscriptions set commission = 5000
  where id = '00000000-0000-0000-0000-000000000004';
select is((select string_agg(commission_amount::text, ',' order by due_date)
  from public.installments
  where subscription_id = '00000000-0000-0000-0000-000000000004'),
  '3000,3000,0', 'un cambio posterior no altera lo pagado');

-- once: solo la primera; indefinite: comisión recortada al monto.
select public.register_payment(
  '00000000-0000-0000-0000-000000000005', 20000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000009');
select is((select string_agg(commission_amount::text, ',' order by due_date)
  from public.installments
  where subscription_id = '00000000-0000-0000-0000-000000000005'),
  '3000,0', 'once: solo la primera mensualidad');
select public.register_payment(
  '00000000-0000-0000-0000-000000000006', 12000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000010');
select is((select string_agg(commission_amount::text, ',' order by due_date)
  from public.installments
  where subscription_id = '00000000-0000-0000-0000-000000000006'),
  '2000,3000', 'indefinite: la comisión no supera la mensualidad');

-- No admin: no ejecuta ni ve; nadie escribe directo.
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select throws_ok($$select public.register_payment(
  '00000000-0000-0000-0000-000000000007', 10000, '2026-03-10', 'cash', '',
  '10000000-0000-0000-0000-000000000011')$$, '42501', 'Sin acceso',
  'un no admin no ejecuta la RPC');
select is((select count(*)::int from public.payments), 0, 'un no admin no ve pagos');

set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select throws_ok($$insert into public.payments (subscription_id, amount, paid_at,
  method, receiver, idempotency_key) values
  ('00000000-0000-0000-0000-000000000007', 10000, '2026-03-10', 'cash',
   'agency', gen_random_uuid())$$, '42501', null, 'nadie inserta pagos directo');
select throws_ok($$update public.installments set status = 'pending'$$,
  '42501', null, 'nadie actualiza mensualidades directo');
select throws_ok($$delete from public.payments$$, '42501', null,
  'nadie borra pagos');

select is(has_function_privilege('anon',
  'public.register_payment(uuid,integer,date,text,text,uuid)', 'execute'),
  false, 'anon no ejecuta la RPC');

select * from finish();
rollback;
