-- Lo que cree postgres en public ya no trae permisos para los roles de la API. Supabase les
-- daba REFERENCES, TRIGGER, TRUNCATE y MAINTAIN en cada tabla, y UPDATE en cada secuencia,
-- también a service_role. Cada migración concede a propósito los permisos que necesite.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

-- Las tablas que ya existen dejan solo lo que service_role recibió a propósito.
revoke all on public.projects, public.entitlements from service_role;
grant select, insert, update on public.projects to service_role;
grant insert on public.entitlements to service_role;
