# subscription-system

## Pruebas
- Supabase local: `npx supabase start`, luego `npx supabase status -o env > supabase/.env.test`.
- Base de datos: `npx supabase test db`.
- Funciones: `deno test --config supabase/functions/deno.json --allow-net --allow-env --env-file=supabase/.env.test supabase/functions/tests/`.
- End-to-end: `npx playwright test` desde `e2e/`.
- Cada prueba crea sus propios datos y no depende del orden ni de otras pruebas.

## Supabase
- Solo las claves nuevas (`sb_publishable_…`, `sb_secret_…`); nunca las legacy (anon, service_role).
- Toda tabla nueva lleva RLS y GRANTs explícitos: `auto_expose_new_tables = false`, igual que en la nube.
- La CLI 3 apunta a local por defecto: los comandos remotos usan `--remote=<ref>` y `--yes`.
- En Windows, el edge runtime usa `policy = "oneshot"`; una función nueva requiere `npx supabase stop` y `start`.

## Commits
- Conventional Commits en español, con `/sncommit`.
