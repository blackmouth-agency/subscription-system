-- Socio, comisión fija y duración en la suscripción; los admins ya pueden editarla.
alter table public.subscriptions
  add column partner_id uuid references public.partners (id),
  add column commission_type text not null default 'indefinite'
    check (commission_type in ('indefinite', 'months', 'once')),
  add column commission_months integer;

alter table public.subscriptions
  drop constraint subscriptions_commission_check,
  add constraint subscriptions_commission_check
    check (commission >= 0 and commission <= price),
  add constraint subscriptions_partner_required
    check (partner_id is not null or (commission = 0 and receiver = 'agency')),
  add constraint subscriptions_commission_months_check
    check (
      (commission_type = 'months' and coalesce(commission_months > 0, false))
      or (commission_type <> 'months' and commission_months is null)
    );

-- Solo se asigna un socio activo (409 en la API); desactivarlo después no
-- toca sus suscripciones (qa.md §3).
create function public.check_subscription_partner_active()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not (select is_active from public.partners where id = new.partner_id) then
    raise exception 'El socio está inactivo' using errcode = 'P0409';
  end if;
  return new;
end $$;

create trigger subscriptions_check_partner_active
  before insert or update of partner_id on public.subscriptions
  for each row when (new.partner_id is not null)
  execute function public.check_subscription_partner_active();

create policy "Los admins editan suscripciones"
  on public.subscriptions for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant update on public.subscriptions to authenticated;
