-- Mensualidades: una por suscripción y periodo, generadas por pg_cron.
-- Solo las escribe generate_installments() y el trigger de activación.
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id),
  due_date date not null,
  -- Copia del precio al generarla: un cambio posterior no la altera.
  amount integer not null check (amount > 0),
  -- to_activate: la suscripción sigue pending, aún no se debe nada.
  status text not null check (status in ('to_activate', 'pending')),
  created_at timestamptz not null default now(),
  unique (subscription_id, due_date)
);

alter table public.installments enable row level security;

create policy "Los admins ven las mensualidades"
  on public.installments for select to authenticated
  using ((select public.is_admin()));

grant select on public.installments to authenticated;

-- Día en que una suspendida volvió a active; no se cobra el hueco anterior.
alter table public.subscriptions add column resumed_on date;

-- Al activar: las to_activate pasan a pending y, si venía de suspended,
-- se guarda resumed_on. Es la única vía que actualiza installments.
create function public.activate_installments()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.installments set status = 'pending'
  where subscription_id = new.id and status = 'to_activate';
  if old.status = 'suspended' then
    new.resumed_on := (now() at time zone 'America/Bogota')::date;
  end if;
  return new;
end $$;

create trigger subscriptions_activate_installments
  before update on public.subscriptions
  for each row
  when (new.status = 'active' and old.status <> 'active')
  execute function public.activate_installments();

revoke execute on function public.activate_installments()
  from public, anon, authenticated;

-- Crea las mensualidades vencidas hasta p_today. Salta suspended y
-- cancelled, y los periodos anteriores a resumed_on. Idempotente.
-- `+ interval '1 month'` recorta a fin de mes y arrastra el día
-- (31 ene. → 28 feb. → 28 mar.), como dice specs.md.
create function public.generate_installments(
  p_today date default (now() at time zone 'America/Bogota')::date
) returns void language plpgsql security definer set search_path = '' as $$
declare
  s record;
  d date;
begin
  for s in
    select id, price, status, cycle_date, resumed_on,
      (select max(i.due_date) from public.installments i
       where i.subscription_id = sub.id) as last_due
    from public.subscriptions sub
    where status in ('pending', 'active')
  loop
    d := coalesce((s.last_due + interval '1 month')::date, s.cycle_date);
    while s.resumed_on is not null and d < s.resumed_on loop
      d := (d + interval '1 month')::date;
    end loop;
    while d <= p_today loop
      insert into public.installments (subscription_id, due_date, amount, status)
      values (s.id, d, s.price,
              case s.status when 'active' then 'pending' else 'to_activate' end)
      on conflict (subscription_id, due_date) do nothing;
      d := (d + interval '1 month')::date;
    end loop;
  end loop;
end $$;

revoke execute on function public.generate_installments(date)
  from public, anon, authenticated;

-- 05:00 UTC = 00:00 en Bogotá. Si falla un día, el siguiente recupera.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('generate-installments', '0 5 * * *',
  $$select public.generate_installments()$$);
