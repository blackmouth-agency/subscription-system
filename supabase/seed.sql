-- Solo local (`db reset`): cuenta admin de pruebas. Nunca se aplica a la nube.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
  'admin@gmail.com', crypt('admin123', gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at
) values (
  gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001', 'email',
  '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "admin@gmail.com", "email_verified": true}',
  now(), now()
);

insert into public.admins (user_id)
values ('a0000000-0000-0000-0000-000000000001');
