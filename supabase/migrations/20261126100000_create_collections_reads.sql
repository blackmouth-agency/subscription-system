-- Lectura de cobros para el portal: la vista da a cada mensualidad su estado
-- visible y las RPC filtran, buscan, paginan y suman en la base.
create extension if not exists unaccent with schema extensions;

create index installments_due_date_idx on public.installments (due_date);
create index installments_payment_idx on public.installments (payment_id);

-- Estado visible: to_activate se muestra pending, `overdue` no se guarda
-- (pending con due_date + 3 días de gracia < hoy en Bogotá) y las canceladas
-- sin pagar no son cobros.
-- (La gracia pasa a `settings` en la migración siguiente.)
create view public.collections with (security_invoker = true) as
select i.id, i.subscription_id, s.client_id, c.name as client_name,
  s.product_id, p.name as product_name, i.due_date, i.amount,
  case
    when i.status = 'paid' then 'paid'
    when i.status = 'to_activate' then 'pending'
    when i.due_date + 3 < (now() at time zone 'America/Bogota')::date
      then 'overdue'
    else 'pending'
  end as status,
  pay.paid_at
from public.installments i
join public.subscriptions s on s.id = i.subscription_id
join public.clients c on c.id = s.client_id
join public.products p on p.id = s.product_id
left join public.payments pay on pay.id = i.payment_id
where i.status = 'paid' or s.status <> 'cancelled';

grant select on public.collections to authenticated;

-- Cobros que cumplen los filtros; la búsqueda ignora mayúsculas y acentos.
create function public.filter_collections(
  p_client_id uuid default null,
  p_product_id uuid default null,
  p_status text default null,
  p_q text default null,
  p_from date default null,
  p_to date default null
) returns setof public.collections
language sql stable set search_path = '' as $$
  select * from public.collections c
  where (p_client_id is null or c.client_id = p_client_id)
    and (p_product_id is null or c.product_id = p_product_id)
    and (p_status is null or c.status = p_status)
    and (p_from is null or c.due_date >= p_from)
    and (p_to is null or c.due_date <= p_to)
    and (nullif(trim(p_q), '') is null or strpos(
      lower(extensions.unaccent(c.client_name)),
      lower(extensions.unaccent(trim(p_q)))) > 0)
$$;

-- Cobrado · Pendiente · Vencido: monto, cantidad y porcentaje del monto.
create function public.summarize_collections(p_rows public.collections[])
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_agg(to_jsonb(t) - 'ord' order by ord)
  from (
    select status, ord, amount, n as count,
      coalesce(round(100.0 * amount / nullif(sum(amount) over (), 0)), 0)::int
        as percent
    from (
      select v.status, v.ord, coalesce(sum(r.amount), 0) as amount,
        count(r.id) as n
      from (values ('paid', 1), ('pending', 2), ('overdue', 3)) v(status, ord)
      left join unnest(coalesce(p_rows, '{}')) r on r.status = v.status
      group by v.status, v.ord
    ) g
  ) t
$$;

-- Una página de la lista, más reciente primero, con total y totales de todo
-- el filtro. `any` dice si existe algún cobro, con o sin filtros.
create function public.list_collections(
  p_client_id uuid default null,
  p_product_id uuid default null,
  p_status text default null,
  p_q text default null,
  p_from date default null,
  p_to date default null,
  p_limit integer default 10,
  p_offset integer default 0
) returns jsonb language sql stable set search_path = '' as $$
  with f as materialized (
    select * from public.filter_collections(
      p_client_id, p_product_id, p_status, p_q, p_from, p_to)
  )
  select jsonb_build_object(
    'any', exists (select 1 from public.collections),
    'total', (select count(*) from f),
    'totals', public.summarize_collections(
      (select array_agg(f::public.collections) from f)),
    'rows', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.due_date desc, r.id)
      from (
        select id, subscription_id, client_id, client_name, product_id,
          product_name, due_date, amount, status, paid_at
        from f order by due_date desc, id limit p_limit offset p_offset
      ) r), '[]'))
$$;

-- Mapa: una fila por suscripción con sus mensualidades de los últimos 12
-- meses (el mes en curso incluido), páginas por suscripción.
create function public.list_collections_map(
  p_client_id uuid default null,
  p_product_id uuid default null,
  p_status text default null,
  p_q text default null,
  p_limit integer default 10,
  p_offset integer default 0
) returns jsonb language sql stable set search_path = '' as $$
  with w as (
    select date_trunc('month', (now() at time zone 'America/Bogota'))::date
      as last_month
  ),
  f as materialized (
    select c.* from w, public.filter_collections(
      p_client_id, p_product_id, p_status, p_q,
      (w.last_month - interval '11 months')::date,
      (w.last_month + interval '1 month - 1 day')::date) c
  ),
  subs as (
    select distinct on (subscription_id)
      subscription_id, client_id, client_name, product_name
    from f order by subscription_id
  ),
  page as (
    select * from subs order by client_name, subscription_id
    limit p_limit offset p_offset
  )
  select jsonb_build_object(
    'any', exists (select 1 from public.collections),
    'months', (
      select jsonb_agg(to_char(d, 'YYYY-MM') order by d)
      from w, generate_series(
        w.last_month - interval '11 months', w.last_month, interval '1 month'
      ) d),
    'total', (select count(*) from subs),
    'totals', public.summarize_collections(
      (select array_agg(f::public.collections) from f)),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'subscription_id', p.subscription_id,
        'client_id', p.client_id,
        'client_name', p.client_name,
        'product_name', p.product_name,
        'months', (
          select jsonb_object_agg(to_char(f.due_date, 'YYYY-MM'),
            jsonb_build_object('id', f.id, 'status', f.status))
          from f where f.subscription_id = p.subscription_id)
      ) order by p.client_name, p.subscription_id)
      from page p), '[]'))
$$;

-- Suscripciones con deuda y sus mensualidades por pagar, de la más antigua a
-- la más nueva: el orden en que register_payment las cubre.
create function public.list_payable()
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'subscription_id', subscription_id,
    'client_name', client_name,
    'product_name', product_name,
    'installments', installments
  ) order by client_name, product_name, subscription_id), '[]')
  from (
    select subscription_id, client_name, product_name,
      jsonb_agg(jsonb_build_object('id', id, 'due_date', due_date,
        'amount', amount, 'status', status) order by due_date) as installments
    from public.collections
    where status <> 'paid'
    group by subscription_id, client_name, product_name
  ) d
$$;

-- Clientes y productos que tienen cobros: las opciones de los filtros.
create function public.list_collection_options()
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'clients', coalesce((
      select jsonb_agg(jsonb_build_object('id', client_id, 'name', client_name)
        order by client_name)
      from (select distinct client_id, client_name from public.collections) c
    ), '[]'),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object('id', product_id, 'name', product_name)
        order by product_name)
      from (select distinct product_id, product_name from public.collections) p
    ), '[]'))
$$;

revoke execute on function
  public.filter_collections(uuid, uuid, text, text, date, date),
  public.summarize_collections(public.collections[]),
  public.list_collections(uuid, uuid, text, text, date, date, integer, integer),
  public.list_collections_map(uuid, uuid, text, text, integer, integer),
  public.list_payable(),
  public.list_collection_options()
  from public, anon;
grant execute on function
  public.filter_collections(uuid, uuid, text, text, date, date),
  public.summarize_collections(public.collections[]),
  public.list_collections(uuid, uuid, text, text, date, date, integer, integer),
  public.list_collections_map(uuid, uuid, text, text, integer, integer),
  public.list_payable(),
  public.list_collection_options()
  to authenticated;
