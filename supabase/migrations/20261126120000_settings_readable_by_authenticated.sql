-- La gracia la necesita cualquier cuenta que vea mensualidades, no solo los
-- admins. Sigue sin escritura por la API.
drop policy "Los admins ven la configuración" on public.settings;

create policy "Las cuentas autenticadas ven la configuración"
  on public.settings for select to authenticated
  using (true);
