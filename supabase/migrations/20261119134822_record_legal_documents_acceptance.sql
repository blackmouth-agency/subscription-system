-- La versión vigente de cada documento legal. Publicar una versión nueva es cambiar su fila.
create table public.legal_documents (
  document text primary key,
  version text not null
);

alter table public.legal_documents enable row level security;

insert into public.legal_documents (document, version) values
  ('terminos', '2026-11-19'),
  ('politica-de-datos', '2026-11-19');

-- Qué versión de cada documento aceptó cada cuenta, y cuándo. Vive aparte de
-- user_metadata porque el usuario puede editar su metadata desde la API.
create table public.document_acceptances (
  user_id uuid not null references auth.users (id) on delete cascade,
  document text not null references public.legal_documents (document),
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, document, version)
);

alter table public.document_acceptances enable row level security;

-- Solo la clave secreta las lee. Nadie las escribe desde la API: la aceptación la llena el trigger.
grant select on public.legal_documents, public.document_acceptances to service_role;

-- Al crear una cuenta que aceptó los documentos, registra la versión vigente de cada uno.
-- Solo el registro del portal envía accepted_legal_documents: una cuenta creada con la clave
-- secreta no debe enviarlo, porque quedaría una aceptación que la persona nunca dio.
--
-- Por ahora solo registra y no rechaza. Las migraciones deben servir con la versión anterior
-- del código, y el portal anterior se registra sin la aceptación. Exigirla en el servidor va
-- en un cambio posterior, cuando este portal ya sea la versión anterior.
--
-- El trigger corre con el rol de Auth, que no tiene permisos sobre estas tablas; por eso la
-- función corre como su dueño (security definer).
create function public.record_legal_documents_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'accepted_legal_documents' = 'true' then
    insert into public.document_acceptances (user_id, document, version)
    select new.id, document, version
    from public.legal_documents;
  end if;
  return new;
end;
$$;

-- Postgres deja que PUBLIC ejecute toda función nueva. Esta solo la llama el trigger.
revoke execute on function public.record_legal_documents_acceptance() from public, anon, authenticated;

create trigger record_legal_documents_acceptance
  after insert on auth.users
  for each row execute function public.record_legal_documents_acceptance();
