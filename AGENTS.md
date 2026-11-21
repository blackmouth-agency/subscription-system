# subscription-system

## Backend (Hono en Edge Functions)
- Una sola función `supabase/functions/api` con `basePath("/api")`; un módulo por dominio en `modules/<domain>/` con `routes.ts`, `schemas.ts` y `service.ts`.
- Imports bare vía import map (`supabase/functions/api/deno.json`); nunca URLs `jsr:`/`npm:` en el código.
- Código, variables, tablas y RPC en inglés; solo lo que ve el cliente (mensajes de `HTTPException`, `raise exception` en SQL) va en español.
- Cada ruta compone middlewares en este orden y nada más:
  1. `validate`: `zValidator` con zod para header, query y body.
  2. `authorize` + `execute`: una función de `service.ts` que consulta si el usuario puede (cliente Supabase con su JWT, `is_admin()`, RLS) y ejecuta la acción.
  3. `respond`: arma la respuesta desde `c.var`.
- Los errores se lanzan como `HTTPException`; `app.onError` en `index.ts` los formatea.
- Las policies de las tablas del negocio usan `(select public.is_admin())` en `using` y `with check`. El rol vive en `public.admins` y solo se asigna por SQL.
- Dinero: la lógica va en una RPC `plpgsql` (transacción, `select … for update`), nunca en JS. Las operaciones con dinero reciben `Idempotency-Key` (uuid) y la RPC tiene restricción `unique` sobre esa clave: repetir devuelve el resultado original.
- Ejemplo de registro:
  ```ts
  payments.post("/manual", ...validate, authorizeAndPay, respond);
  ```

## Frontend (Atomic Design)
- Carpetas en `apps/portal/src/`: `atoms/`, `molecules/`, `organisms/`, `templates/`, `pages/`.
- Átomos: elementos primitivos (`input`, `label`, `span`, `div`, `button`). Sin lógica ni estado de negocio.
- Moléculas: 2 o 3 átomos (no es regla dura) con un solo propósito. Ej.: `FormField` = `label` + `input` + mensaje de error.
- Organismos: formularios, tarjetas, tablas. Pueden contener otros organismos y gestionar estado interno (ej. React Hook Form para el estado del formulario).
- Templates: solo componen organismos y definen dónde va cada uno. Sin datos ni lógica.
- Pages: importan un template y contienen la lógica de datos (qué se trae del backend y qué se envía). Los `handleSubmit` (y demás callbacks) se crean en la page y se pasan por props hasta el organismo.
- Un organismo no llama al backend ni a `supabase-js`; solo recibe datos y callbacks por props.
- Código en inglés; solo el texto visible al usuario va en español.

## Historias del MVP
- `docs/stories.md` lista las historias en orden; se implementa una a la vez, sin saltarse ninguna. Se apoya en `docs/specs.md` y `docs/qa.md`: las marcadas con ⚠ dependen de una pregunta abierta de `qa.md`.
