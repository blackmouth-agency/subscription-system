-- Los usuarios con sesión leen; las políticas RLS deciden qué filas ven.
grant select on public.projects to authenticated;
grant select on public.entitlements to authenticated;

-- La clave secreta crea proyectos y accesos.
grant select, insert, update on public.projects to service_role;
grant insert on public.entitlements to service_role;
