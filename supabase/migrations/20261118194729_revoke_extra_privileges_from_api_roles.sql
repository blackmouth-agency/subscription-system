-- Supabase les da REFERENCES, TRIGGER y TRUNCATE a anon y authenticated en cada
-- tabla nueva, aunque la exposición automática esté apagada. TRUNCATE ignora RLS.
-- Las tablas solo conservan los permisos que se conceden a propósito.
revoke all on public.projects, public.entitlements from anon, authenticated;
grant select on public.projects, public.entitlements to authenticated;
