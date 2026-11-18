create policy "Los usuarios con sesión ven los proyectos"
  on public.projects
  for select
  to authenticated
  using (true);
