-- Historial de cambios de la suscripción: una fila por campo que cambia.
-- Solo lo escribe el trigger; los admins lo leen.
create table public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id),
  field text not null check (field in (
    'price', 'commission', 'receiver', 'status',
    'partner_id', 'commission_type', 'commission_months'
  )),
  old_value text not null,
  new_value text not null,
  -- Sin FK: borrar la cuenta no borra el historial.
  changed_by uuid,
  changed_by_email text not null default '',
  changed_at timestamptz not null default now()
);

create index subscription_history_subscription_idx
  on public.subscription_history (subscription_id, changed_at desc);

alter table public.subscription_history enable row level security;

create policy "Los admins ven el historial de suscripciones"
  on public.subscription_history for select to authenticated
  using ((select public.is_admin()));

grant select on public.subscription_history to authenticated;

-- `security definer`: es la única vía de escritura (nadie tiene insert).
-- Los valores van como texto; `partner_id` se guarda como nombre del socio.
create function public.record_subscription_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.subscription_history
    (subscription_id, field, old_value, new_value, changed_by,
     changed_by_email)
  select new.id, v.field, v.old_value, v.new_value, auth.uid(),
         coalesce(auth.jwt() ->> 'email', '')
  from (values
    ('price', old.price::text, new.price::text),
    ('commission', old.commission::text, new.commission::text),
    ('receiver', old.receiver, new.receiver),
    ('status', old.status, new.status),
    ('partner_id',
      coalesce((select name from public.partners where id = old.partner_id), ''),
      coalesce((select name from public.partners where id = new.partner_id), '')),
    ('commission_type', old.commission_type, new.commission_type),
    ('commission_months', coalesce(old.commission_months::text, ''),
      coalesce(new.commission_months::text, ''))
  ) as v (field, old_value, new_value)
  where v.old_value is distinct from v.new_value
    -- Dos socios con el mismo nombre también cuentan como cambio.
    or (v.field = 'partner_id' and old.partner_id is distinct from new.partner_id);
  return new;
end $$;

create trigger subscriptions_record_history
  after update on public.subscriptions
  for each row execute function public.record_subscription_history();

revoke execute on function public.record_subscription_history()
  from public, anon, authenticated;
