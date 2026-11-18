begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select is_empty(
  $$ select c.relname::text
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p')
       and not c.relrowsecurity $$,
  'todas las tablas de public tienen RLS'
);

select table_privs_are('public', 'projects', 'anon', array[]::text[],
  'anon no tiene permisos sobre projects');
select table_privs_are('public', 'entitlements', 'anon', array[]::text[],
  'anon no tiene permisos sobre entitlements');
select table_privs_are('public', 'projects', 'authenticated', array['SELECT'],
  'authenticated solo puede leer projects');
select table_privs_are('public', 'entitlements', 'authenticated', array['SELECT'],
  'authenticated solo puede leer entitlements');

select * from finish();
rollback;
