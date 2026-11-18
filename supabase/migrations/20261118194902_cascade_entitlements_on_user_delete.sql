-- Al borrar una cuenta (por ejemplo, por una solicitud de supresión de datos)
-- se borran también sus accesos, en vez de impedir el borrado.
alter table public.entitlements
  drop constraint entitlements_user_id_fkey,
  add constraint entitlements_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;
