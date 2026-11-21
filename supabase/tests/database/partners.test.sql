begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local');
insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.partners (name) values ('Socio SAS') $$,
  'un admin inserta un socio'
);
select is((select count(*)::int from public.partners where name = 'Socio SAS'), 1,
  'un admin lee los socios');
select lives_ok(
  $$ update public.partners set is_active = false where name = 'Socio SAS' $$,
  'un admin edita un socio'
);
select is(
  (select is_active from public.partners where name = 'Socio SAS'), false, 'el cambio queda guardado'
);
select throws_ok(
  $$ insert into public.partners (name) values ('') $$,
  '23514', null, 'rechaza nombre vacío'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty('select * from public.partners', 'una cuenta sin el rol no ve socios');
select throws_ok(
  $$ insert into public.partners (name) values ('Intruso') $$,
  '42501', null, 'una cuenta sin el rol no inserta'
);
select throws_ok(
  $$ delete from public.partners $$,
  '42501', null, 'nadie borra socios por la API'
);

select * from finish();
rollback;
