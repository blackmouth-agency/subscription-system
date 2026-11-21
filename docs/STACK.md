# Stack tecnológico

Decisión final del stack para el MVP de `specs.md` y `stories.md`. Versiones consultadas en el registro de npm el 2026-11-19.

Principio: el MVP es una herramienta administrativa con pocos usuarios y casi toda su lógica es sobre datos y dinero, así que la lógica vive en Postgres y el frontend solo muestra y envía datos.

## Frontend (`apps/portal`)

| Pieza | Versión | Estado |
|---|---|---|
| React + React DOM | 19.3.1 | En uso |
| TypeScript | 7.0.2 | En uso |
| Vite | 8.3.8 | En uso |
| `@vitejs/plugin-react` | 6.3.0 | En uso |
| `@supabase/supabase-js` | 2.119 (última: 2.119.2) | En uso |
| `oxlint` | 1.94.0 | En uso |
| `@stylistic/eslint-plugin` | 6.0.1 | En uso; regla `max-len` de 80 caracteres, cargada como JS plugin (alpha) de oxlint |
| CSS propio (`App.css`, `index.css`) | — | En uso |
| `react-router` | 8.5.2 | Se agrega en la historia 3, solo con rutas en el cliente |
| Tipos de la base (`supabase gen types typescript`) | CLI 3.2.0 | Se agregan con la primera tabla del MVP |
| `react-hook-form` | 7.92.0 | Se agrega con el primer formulario del MVP (historia 2); estado interno de los organismos |
| `@hookform/resolvers` + `zod` | 7.0.8 + 4.6.7 | Junto con `react-hook-form`; validación del formulario |
| Atomic Design (`atoms/`, `molecules/`, `organisms/`, `templates/`, `pages/`) | — | Estructura de `src/`; los datos y los `handleSubmit` viven en las pages |

## Hosting

| Pieza | Versión | Estado |
|---|---|---|
| Cloudflare Workers con assets estáticos (SPA) | — | En uso |
| Wrangler | 4.164 (última: 4.165.0) | En uso; entornos `portal-dev` y `portal` |

## Backend (Supabase)

| Pieza | Versión | Estado |
|---|---|---|
| Postgres | 17 | En uso |
| Supabase Auth | — | En uso: login, registro y recuperación de clave |
| RLS + GRANTs explícitos (`auto_expose_new_tables = false`) | — | En uso; `is_admin()` controla todo lo nuevo (historia 1) |
| Migraciones SQL (`supabase/migrations`) | — | En uso |
| Edge Functions en Deno | 2.x | En uso: `verify-access`, `delete-account` |
| Hono | 4.13.19 | Función `api` con módulos por dominio; se agrega con la historia 2 |
| `@hono/zod-validator` + `zod` | 0.9.1 + 4.6.7 | Primer middleware de cada ruta: valida header, query y body |
| Claves `sb_publishable_…` / `sb_secret_…` | — | En uso; nunca las legacy |
| Triggers de auditoría | — | Historia 8 |
| `pg_cron` | — | Historia 9; hay que habilitarlo en la nube |
| Vistas (estado "vencida", listado de cobros) | — | Historias 10 y 12 |
| Funciones `plpgsql` por RPC (pago manual, confirmar pago) | — | Historia 11 |

### Reglas del backend

- Cada ruta de `api` compone `validate` (zod) → `authorizeAndPay`/equivalente (consulta de permiso + acción, en `service.ts`) → `respond`. Imports bare por import map.
- Las operaciones con dinero reciben `Idempotency-Key` y la RPC guarda esa clave con restricción `unique`.

- Los montos son `bigint` en COP entero. El reparto se calcula y se congela en SQL al confirmar el pago, nunca en JS.
- El pago se confirma en una sola función `plpgsql`, en una transacción con `select … for update`. El pago manual y el webhook de Wompi la usan las dos.
- Las mensualidades llevan `unique (subscription_id, periodo)` contra duplicados.
- Cada mensualidad se calcula desde la anterior con `+ interval '1 month'`, que cumple MVP-SUS-06 (31 ene. → 28 feb. → 28 mar.).
- "Vencida" no se guarda: se calcula como fecha + días de gracia < `current_date`.

## Pagos y avisos

| Pieza | Estado |
|---|---|
| Wompi | Pendiente de la prueba en sandbox (historia 14) |
| Edge Function para el webhook de Wompi, con verificación de firma | Pendiente de la historia 14 |
| Enlaces `wa.me` para WhatsApp | Historia 15 |
| Correo transaccional | Pospuesto |

## Pruebas

| Pieza | Versión | Uso |
|---|---|---|
| pgTAP (`npx supabase test db`) | — | Reglas de datos y dinero |
| `deno test` | 2.x | Edge Functions |
| `pg` + `@types/pg` | 8.23.1 | Solo en `e2e/`: conexión directa con `DB_URL` para lo que la API no puede hacer (dar el rol de admin) |
| Playwright (`@playwright/test`) | 1.65.1 | End-to-end, en `e2e/` |

## Herramientas

| Pieza | Versión |
|---|---|
| Node | 24 |
| npm workspaces (`apps/*`, `e2e`) | — |
| Supabase CLI | 3.2.0 |
| Deno | 2.x |
| Git + GitHub (`blackmouth-agency`) | — |
| Conventional Commits en español con `/sncommit` | — |

## CI/CD (GitHub Actions)

| Workflow | Cuándo corre | Qué hace |
|---|---|---|
| `ci.yml` | En cada PR, y lo reutiliza el despliegue | Lint y build de la app; `deno check`, `lint` y `fmt` de las funciones; Supabase local con Mailpit; pgTAP, `deno test` y Playwright |
| `deploy.yml` | Push a `main` | Repite el CI y despliega en `development` y después en `production` |
| `deploy-env.yml` | Lo llaman el despliegue y la reversión | `supabase db push`, despliegue de funciones y `wrangler deploy` |
| `rollback.yml` | A mano | Vuelve a desplegar un commit de `main`, sin migraciones |

### Reglas del CI/CD

- Cada Edge Function nueva se agrega al `deno check` de `ci.yml` y al paso "Desplegar las funciones" de `deploy-env.yml`.
- La reversión no deshace migraciones, así que cada migración debe funcionar también con el código anterior: primero se agregan columnas o tablas, y se borran en un despliegue posterior.

## Descartado

| Opción | Motivo |
|---|---|
| ORM (Prisma, Drizzle) o backend en Node | Las migraciones SQL, RLS y RPC ya cubren ese papel |
| Next.js o SSR | No hay SEO ni páginas públicas |
| Redux, Zustand o TanStack Query | `supabase-js` directo alcanza para un panel con un administrador |
| Librería de componentes o Tailwind | Tablas y formularios nativos con el CSS actual; se reevalúa si la UI lo pide |
| API de WhatsApp | Un enlace `wa.me` cubre el aviso de cobro |
