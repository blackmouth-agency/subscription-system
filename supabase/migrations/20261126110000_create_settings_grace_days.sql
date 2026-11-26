-- Configuración global: una sola fila. Solo se cambia por SQL.
create table public.settings (
  id boolean primary key default true check (id),
  -- Días después de due_date en que una mensualidad sigue pendiente.
  grace_days integer not null default 3 check (grace_days >= 0)
);

insert into public.settings default values;

alter table public.settings enable row level security;

create policy "Los admins ven la configuración"
  on public.settings for select to authenticated
  using ((select public.is_admin()));

grant select on public.settings to authenticated;

-- Única fuente del estado visible: `overdue` no se guarda (pending con
-- due_date + gracia < hoy en Bogotá) y la cancelada sin pagar es `voided`.
create function public.installment_display_status(
  p_status text, p_due_date date, p_cancelled boolean
) returns text language sql stable set search_path = '' as $$
  select case
    when p_status = 'paid' then 'paid'
    when p_cancelled then 'voided'
    when p_status = 'pending'
      and p_due_date + (select grace_days from public.settings)
        < (now() at time zone 'America/Bogota')::date then 'overdue'
    else p_status
  end
$$;

revoke execute on function
  public.installment_display_status(text, date, boolean) from public, anon;
grant execute on function
  public.installment_display_status(text, date, boolean) to authenticated;

-- Cobros: to_activate se muestra pending; las canceladas sin pagar no entran.
create or replace view public.collections with (security_invoker = true) as
select i.id, i.subscription_id, s.client_id, c.name as client_name,
  s.product_id, p.name as product_name, i.due_date, i.amount,
  case i.status
    when 'to_activate' then 'pending'
    else public.installment_display_status(i.status, i.due_date, false)
  end as status,
  pay.paid_at
from public.installments i
join public.subscriptions s on s.id = i.subscription_id
join public.clients c on c.id = s.client_id
join public.products p on p.id = s.product_id
left join public.payments pay on pay.id = i.payment_id
where i.status = 'paid' or s.status <> 'cancelled';

-- Mensualidades de una suscripción con su estado visible (sin ocultar nada).
create function public.list_subscription_installments(p_subscription_id uuid)
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(
    to_jsonb(i) || jsonb_build_object('display_status',
      public.installment_display_status(
        i.status, i.due_date, s.status = 'cancelled'))
    order by i.due_date), '[]')
  from public.installments i
  join public.subscriptions s on s.id = i.subscription_id
  where i.subscription_id = p_subscription_id
$$;

revoke execute on function public.list_subscription_installments(uuid)
  from public, anon;
grant execute on function public.list_subscription_installments(uuid)
  to authenticated;
