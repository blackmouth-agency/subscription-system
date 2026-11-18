# Arquitectura

Describe cómo está construido el sistema. Las reglas de negocio están en `BUSINESS_RULES.md`.

## 1. Componentes

```
Landing de marketing (GitHub Pages, estática)
Apps de cada proyecto (React con Vite, en Cloudflare)
Páginas públicas de usuarios (Cloudflare Workers con Hono, con caché)
        │
        ▼
Supabase
  ├─ Auth: una sola cuenta de usuario para todas las apps
  ├─ Postgres: proyectos, planes, suscripciones, entitlements, pagos, comisiones
  ├─ Edge Functions (@supabase/server): checkout, webhooks, verificación de acceso
  ├─ Cron (pg_cron): vencimiento de la gracia, suspensiones y cancelaciones
  └─ RLS: seguridad por fila
        ▲
        │ webhooks
Pasarela de pagos (MercadoPago o ePayco, por confirmar)
```

## 2. Stack

Sigue el documento «Stack tecnológico: full stack y DevOps», con una excepción explícita: Supabase.

**Por qué Supabase y no los valores por defecto del stack (Azure, Better Auth, Hono sobre Node):**
- Es PostgreSQL, la base por defecto del stack.
- Supabase Auth guarda los usuarios en la propia base y no cobra por usuario a esta escala, que es lo que se le pide a Better Auth.
- Una sola cuenta sirve para todas las apps, y las políticas RLS leen el usuario de la sesión con `auth.uid()`.
- Es un proyecto propio, así que prima la velocidad. En Azure habría que montar Container Apps, PostgreSQL Flexible Server y Entra, con más costo y más operación.

| Capa | Elección |
|---|---|
| Base de datos | Supabase Postgres |
| Región de Supabase | `us-east-1` (Virginia), por latencia desde Colombia |
| Autenticación | Supabase Auth |
| Backend | Supabase Edge Functions en TypeScript con `withSupabase` de `@supabase/server`, que valida la sesión, da el cliente con RLS y maneja CORS. Hono cuando una función tenga varias rutas. Validación con Zod |
| Tareas programadas | Supabase Cron (`pg_cron`), que llama a una Edge Function |
| Páginas públicas | Cloudflare Workers con Hono |
| Apps | React con Vite y TypeScript; shadcn/ui con Tailwind; TanStack Query; React Hook Form con Zod |
| Hosting de las apps | Cloudflare |
| Landing | Sitio estático en GitHub Pages |
| Pasarela | MercadoPago o ePayco, con suscripciones recurrentes en COP *(por confirmar)* |
| Correo | Resend o Postmark, también como SMTP de Supabase Auth |
| CI/CD | GitHub Actions |

Las páginas públicas no salen de Edge Functions: Supabase reescribe las respuestas HTML como `text/plain` si el proyecto no tiene dominio propio (plan Pro más un complemento pago), y recomienda las Edge Functions solo para APIs.

## 3. Modelo de datos (resumen)

- `users`: gestionado por Supabase Auth.
- `projects`: una fila por aplicación o página.
- `plans`: planes por proyecto, con precio y periodicidad.
- `subscriptions`: usuario, plan, estado, ID externo en la pasarela y fin de periodo.
- `entitlements`: usuario, proyecto, acceso y fecha de vencimiento. Se actualiza desde `subscriptions`.
- `payments`: cada cobro, con monto final y snapshot de descuentos.
- `payment_events`: eventos recibidos de la pasarela, con su estado de procesamiento, para auditoría e idempotencia.
- `promoters` y `referrals`: códigos de referido y atribución de ventas.
- `commissions`: comisiones pendientes o pagadas.
- `public_pages`: páginas públicas por usuario y proyecto, con bandera `published`.

## 4. Flujos clave

**Checkout**
1. El usuario elige un plan.
2. La función de checkout crea la suscripción en la pasarela y devuelve la URL de pago.
3. El usuario paga en la pasarela.

**Webhook**
1. La pasarela envía un evento a la función de webhooks.
2. Se valida la firma y se guarda en `payment_events`.
3. Si el evento ya se procesó, se ignora (idempotencia).
4. Se actualiza `subscriptions`, `entitlements` y, si aplica, `public_pages`.

**Verificación de acceso**
1. La app envía el token de sesión de Supabase Auth a una función.
2. La función valida el token, consulta `entitlements` y responde con el contenido o un error.
3. El frontend solo muestra lo que el servidor responde.

**Tareas programadas**
1. Supabase Cron llama cada hora a una función.
2. Las suscripciones en gracia con los 7 días vencidos pasan a Suspendida, y sus páginas se despublican.
3. Las suscripciones con 90 días en Suspendida pasan a Cancelada.
4. Cada cambio de estado actualiza `entitlements` y envía el correo que corresponda.
5. Los reintentos de cobro los hace la pasarela si lo soporta; si no, también los lanza esta tarea.

**Página pública**
1. Una petición a `dominio/nombre` llega al Worker de Cloudflare.
2. El Worker lee `public_pages` con la clave publishable de Supabase. RLS solo expone las páginas con `published = true`.
3. Si la página está publicada, la muestra. Si no, muestra "no disponible".
4. La respuesta queda en la caché de Cloudflare 60 segundos como máximo, así que una página despublicada deja de verse en menos de un minuto aunque falle la purga. Al cambiar `published`, la función que hizo el cambio purga esa URL.

## 5. Entornos y despliegue

- **Local:** CLI de Supabase (`supabase start`) sobre Docker, y Wrangler para el Worker.
- **Dos proyectos de Supabase:** desarrollo y producción. Durante el desarrollo, los dos viven en una organización en el plan Free. Antes del primer cobro real (E11), producción pasa a una organización propia en el plan Pro (USD 25 al mes), porque el plan Free pausa el proyecto tras una semana sin actividad y no tiene backups automáticos. El plan se cobra por organización, así que desarrollo se queda en la organización Free.
- **Migraciones:** en SQL dentro del repo (`supabase/migrations`), porque las políticas RLS, los triggers y las tareas de cron se escriben en SQL. Los tipos de TypeScript salen de `supabase gen types`. Drizzle es opcional para las consultas.
- **GitHub Actions:** en cada PR corren lint, tipos y pruebas. Al fusionar a `main`, aplica las migraciones y despliega las funciones, las apps y el Worker en desarrollo. Producción corre el mismo flujo con aprobación manual.
- **Revertir:** se despliega la versión anterior de las funciones, las apps y el Worker. Las migraciones son compatibles con la versión anterior del código, para poder revertir sin tocar la base. Una migración equivocada se corrige con otra nueva.
- **Secretos:** `supabase secrets` para las funciones, secretos de Wrangler para el Worker y secretos de GitHub Actions para el pipeline. Nunca en el repo.

## 6. Pruebas

- **RLS y funciones SQL:** pgTAP con `supabase test db`.
- **Edge Functions:** `deno test` contra el entorno local de Supabase, porque las funciones corren en Deno.
- **Webhooks:** el mismo evento enviado dos veces no produce efectos dobles.
- **Apps:** Vitest con Testing Library en los componentes con lógica.
- **End-to-end:** Playwright sobre el registro, el checkout en el sandbox de la pasarela y la verificación de acceso.

## 7. Seguridad

- Ningún número de tarjeta se guarda en el sistema; solo tokens de la pasarela.
- El estado de acceso solo lo cambian los webhooks o funciones del servidor, nunca el cliente.
- Solo se usan las claves nuevas de Supabase. Las legacy (`anon` y `service_role`) dejan de funcionar a inicios de 2027.
- La clave secreta (`sb_secret_…`) solo vive en las Edge Functions, que la reciben de Supabase. Las apps y el Worker usan la clave publishable (`sb_publishable_…`).
- Las claves secretas viven en variables de entorno del servidor.
- RLS activado en todas las tablas.
- Los correos de Auth salen por un SMTP propio (Resend o Postmark): el correo incluido en Supabase es solo para pruebas.

## 8. Observabilidad

- Logs de Supabase (funciones y base) y de Cloudflare.
- Una tarea de cron avisa por correo si hay eventos en `payment_events` que fallaron o llevan más de 15 minutos sin procesar.

## 9. Decisiones abiertas

- Pasarela definitiva (MercadoPago o ePayco). Define si la recurrencia la maneja la pasarela o la tarea programada.
- Dominio de las páginas públicas. conoce-mas ya publica sus páginas en `conoce-mas.link/<negocio>`, así que esas URLs no pueden romperse cuando E6 las pase al Worker.
- Si las páginas públicas llevan más contenido que enlaces y textos.
- Panel de administración: shadcn/ui como las apps, o MUI si las tablas se vuelven densas.
- Retención de datos (propuesta: 90 días tras suspensión).
