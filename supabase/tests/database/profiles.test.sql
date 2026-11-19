begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Ana y Beto tienen perfil; Carla todavía no
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'carla@test.local');

insert into public.profiles (user_id, full_name, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Ana', '3001234567'),
  ('22222222-2222-2222-2222-222222222222', 'Beto', '3107654321');

-- Ana consulta los perfiles con su sesión
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select results_eq(
  'select user_id from public.profiles',
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'un usuario solo ve su propio perfil'
);

select throws_ok(
  $$ insert into public.profiles (user_id, full_name, phone) values
       ('33333333-3333-3333-3333-333333333333', 'Carla', '3201234567') $$,
  '42501', null,
  'un usuario no puede crear el perfil de otro'
);

update public.profiles set full_name = 'Cambiado por Ana'
where user_id = '22222222-2222-2222-2222-222222222222';

reset role;

select is(
  (select full_name from public.profiles where user_id = '22222222-2222-2222-2222-222222222222'),
  'Beto',
  'un usuario no puede cambiar el perfil de otro'
);

-- El servidor valida el nombre, sin importar quién escriba
select throws_ok(
  $$ update public.profiles set full_name = null where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23502', null,
  'el servidor rechaza un perfil sin nombre'
);

select throws_ok(
  $$ update public.profiles set full_name = '' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'el servidor rechaza un nombre vacío'
);

select throws_ok(
  $$ update public.profiles set full_name = '   ' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'el servidor rechaza un nombre con solo espacios'
);

-- Y que el teléfono sea un celular colombiano: 10 dígitos que empiezan por 3
select throws_ok(
  $$ update public.profiles set phone = null where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23502', null,
  'el servidor rechaza un perfil sin teléfono'
);

select throws_ok(
  $$ update public.profiles set phone = '300123456' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'el servidor rechaza un teléfono de 9 dígitos'
);

select throws_ok(
  $$ update public.profiles set phone = '30012345678' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'el servidor rechaza un teléfono de 11 dígitos'
);

select throws_ok(
  $$ update public.profiles set phone = '2001234567' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'el servidor rechaza un teléfono que no empieza por 3'
);

select throws_ok(
  $$ update public.profiles set phone = '300abc4567' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'el servidor rechaza un teléfono con letras'
);

select throws_ok(
  $$ update public.profiles set phone = '300 123 4567' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'el servidor rechaza un teléfono con espacios'
);

-- Supresión de datos: se borra la cuenta de Beto
select lives_ok(
  $$ delete from auth.users where id = '22222222-2222-2222-2222-222222222222' $$,
  'se puede borrar un usuario que tiene perfil'
);

select is_empty(
  $$ select 1 from public.profiles where user_id = '22222222-2222-2222-2222-222222222222' $$,
  'borrar un usuario borra su perfil'
);

select * from finish();
rollback;
