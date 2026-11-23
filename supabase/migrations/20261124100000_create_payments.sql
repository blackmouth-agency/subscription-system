-- Pagos manuales: un pago cubre las mensualidades más antiguas, completas.
-- Solo los escribe register_payment(); los admins los leen.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id),
  amount integer not null check (amount > 0),
  paid_at date not null,
  method text not null check (method in ('transfer', 'cash', 'other')),
  reference text not null default '',
  -- Copia de la suscripción al pagar: no cambian aunque ella cambie.
  receiver text not null check (receiver in ('agency', 'partner')),
  partner_id uuid references public.partners (id),
  -- Repetir la clave devuelve el pago original en vez de crear otro.
  idempotency_key uuid not null unique,
  -- Sin FK: borrar la cuenta no borra el pago.
  created_by uuid,
  created_at timestamptz not null default now()
);

create index payments_subscription_idx on public.payments (subscription_id);

alter table public.payments enable row level security;

create policy "Los admins ven los pagos"
  on public.payments for select to authenticated
  using ((select public.is_admin()));

grant select on public.payments to authenticated;

alter table public.installments
  add column payment_id uuid references public.payments (id),
  add column commission_amount integer check (commission_amount >= 0),
  add column agency_amount integer check (agency_amount >= 0);

alter table public.installments drop constraint installments_status_check;
alter table public.installments add constraint installments_status_check
  check (status in ('to_activate', 'pending', 'paid'));

-- paid lleva pago y reparto completo; las demás no llevan nada.
alter table public.installments add constraint installments_paid_check check (
  (status = 'paid' and payment_id is not null
    and commission_amount is not null and agency_amount is not null
    and commission_amount + agency_amount = amount)
  or (status <> 'paid' and payment_id is null
    and commission_amount is null and agency_amount is null)
);

-- Paga las k mensualidades más antiguas (to_activate o pending) si p_amount
-- es exactamente su suma. Errores: 42501 sin acceso, P0002 no existe,
-- P0001 regla de negocio (la API los traduce a 403, 404 y 409).
create function public.register_payment(
  p_subscription_id uuid,
  p_amount integer,
  p_paid_at date,
  p_method text,
  p_reference text,
  p_idempotency_key uuid
) returns public.payments
language plpgsql security definer set search_path = '' as $$
declare
  s public.subscriptions;
  pay public.payments;
  ids uuid[] := '{}';
  amounts integer[] := '{}';
  total integer := 0;
  commissioned integer;
  c integer;
  i integer;
  r record;
begin
  if not (select public.is_admin()) then
    raise exception 'Sin acceso' using errcode = '42501';
  end if;

  -- Serializa los pagos de la misma suscripción.
  select * into s from public.subscriptions
    where id = p_subscription_id for update;
  if not found then
    raise exception 'Suscripción no encontrada' using errcode = 'P0002';
  end if;

  select * into pay from public.payments
    where idempotency_key = p_idempotency_key;
  if found then
    if pay.subscription_id <> s.id then
      raise exception 'La clave de idempotencia ya se usó';
    end if;
    return pay;
  end if;

  if s.status = 'cancelled' then
    raise exception 'La suscripción está cancelada';
  end if;

  for r in
    select id, amount from public.installments
    where subscription_id = s.id and status in ('to_activate', 'pending')
    order by due_date for update
  loop
    ids := ids || r.id;
    amounts := amounts || r.amount;
    total := total + r.amount;
    exit when total >= p_amount;
  end loop;
  if cardinality(ids) = 0 then
    raise exception 'No hay mensualidades por pagar';
  end if;
  if total <> p_amount then
    raise exception 'El importe no corresponde a mensualidades completas';
  end if;

  insert into public.payments (subscription_id, amount, paid_at, method,
    reference, receiver, partner_id, idempotency_key, created_by)
  values (s.id, p_amount, p_paid_at, p_method, coalesce(p_reference, ''),
    s.receiver, s.partner_id, p_idempotency_key, auth.uid())
  returning * into pay;

  -- La comisión se cuenta por mensualidad cubierta, con las condiciones de hoy.
  select count(*) into commissioned from public.installments
    where subscription_id = s.id and status = 'paid' and commission_amount > 0;
  for i in 1 .. cardinality(ids) loop
    c := 0;
    if s.partner_id is not null and s.commission > 0 and (
      s.commission_type = 'indefinite'
      or (s.commission_type = 'months' and commissioned < s.commission_months)
      or (s.commission_type = 'once' and commissioned = 0)
    ) then
      c := least(s.commission, amounts[i]);
      commissioned := commissioned + 1;
    end if;
    update public.installments
      set status = 'paid', payment_id = pay.id, commission_amount = c,
          agency_amount = amounts[i] - c
      where id = ids[i];
  end loop;

  -- El primer pago activa; el trigger pasa las to_activate restantes a pending.
  if s.status = 'pending' then
    update public.subscriptions set status = 'active' where id = s.id;
  end if;
  return pay;
end $$;

revoke execute on function
  public.register_payment(uuid, integer, date, text, text, uuid)
  from public, anon;
grant execute on function
  public.register_payment(uuid, integer, date, text, text, uuid)
  to authenticated;
