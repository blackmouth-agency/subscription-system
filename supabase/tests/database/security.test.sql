begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

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
select table_privs_are('public', 'legal_documents', 'anon', array[]::text[],
  'anon no tiene permisos sobre legal_documents');
select table_privs_are('public', 'document_acceptances', 'anon', array[]::text[],
  'anon no tiene permisos sobre document_acceptances');
select table_privs_are('public', 'profiles', 'anon', array[]::text[],
  'anon no tiene permisos sobre profiles');

select table_privs_are('public', 'admins', 'anon', array[]::text[],
  'anon no tiene permisos sobre admins');
select table_privs_are('public', 'admins', 'authenticated', array['SELECT'],
  'authenticated solo puede leer admins');
select table_privs_are('public', 'admins', 'service_role', array[]::text[],
  'service_role no tiene permisos sobre admins');

select table_privs_are('public', 'products', 'anon', array[]::text[],
  'anon no tiene permisos sobre products');
select table_privs_are('public', 'products', 'authenticated', array['SELECT', 'INSERT'],
  'authenticated solo lee y crea products');
select table_privs_are('public', 'products', 'service_role', array[]::text[],
  'service_role no tiene permisos sobre products');

select table_privs_are('public', 'projects', 'authenticated', array['SELECT'],
  'authenticated solo puede leer projects');
select table_privs_are('public', 'entitlements', 'authenticated', array['SELECT'],
  'authenticated solo puede leer entitlements');
select table_privs_are('public', 'legal_documents', 'authenticated', array[]::text[],
  'authenticated no tiene permisos sobre legal_documents');
select table_privs_are('public', 'document_acceptances', 'authenticated', array[]::text[],
  'authenticated no tiene permisos sobre document_acceptances');
select table_privs_are('public', 'profiles', 'authenticated', array['SELECT', 'INSERT', 'UPDATE'],
  'authenticated lee, crea y cambia profiles, pero no los borra');

select table_privs_are('public', 'projects', 'service_role', array['SELECT', 'INSERT', 'UPDATE'],
  'service_role lee, crea y cambia projects');
select table_privs_are('public', 'entitlements', 'service_role', array['INSERT'],
  'service_role solo crea entitlements');
select table_privs_are('public', 'legal_documents', 'service_role', array['SELECT'],
  'service_role solo puede leer legal_documents');
select table_privs_are('public', 'document_acceptances', 'service_role', array['SELECT'],
  'service_role solo puede leer document_acceptances');
select table_privs_are('public', 'profiles', 'service_role', array[]::text[],
  'service_role no tiene permisos sobre profiles');

-- Una función security definer corre con los permisos de su dueño: nadie de la API la ejecuta.
-- Excepción: register_payment, que la API llama con el JWT y exige is_admin() adentro.
select is_empty(
  $$ select p.proname::text
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prosecdef
       and p.proname <> 'register_payment'
       and (has_function_privilege('anon', p.oid, 'execute')
         or has_function_privilege('authenticated', p.oid, 'execute')) $$,
  'anon y authenticated no ejecutan funciones security definer de public'
);

-- Una tabla y una secuencia nuevas, creadas como en una migración, no traen permisos que
-- nadie concedió.
create table public.tabla_nueva_de_prueba (id int);
create sequence public.secuencia_nueva_de_prueba;

select table_privs_are('public', 'tabla_nueva_de_prueba', 'anon', array[]::text[],
  'una tabla nueva en public no le da permisos a anon');
select table_privs_are('public', 'tabla_nueva_de_prueba', 'authenticated', array[]::text[],
  'una tabla nueva en public no le da permisos a authenticated');
select table_privs_are('public', 'tabla_nueva_de_prueba', 'service_role', array[]::text[],
  'una tabla nueva en public no le da permisos a service_role');
select sequence_privs_are('public', 'secuencia_nueva_de_prueba', 'anon', array[]::text[],
  'una secuencia nueva en public no le da permisos a anon');
select sequence_privs_are('public', 'secuencia_nueva_de_prueba', 'authenticated', array[]::text[],
  'una secuencia nueva en public no le da permisos a authenticated');
select sequence_privs_are('public', 'secuencia_nueva_de_prueba', 'service_role', array[]::text[],
  'una secuencia nueva en public no le da permisos a service_role');

select * from finish();
rollback;
