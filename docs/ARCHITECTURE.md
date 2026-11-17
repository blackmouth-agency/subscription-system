# Arquitectura

Describe cómo está construido el sistema. Las reglas de negocio están en `BUSINESS_RULES.md`.

## 1. Componentes

```
Landing de marketing (GitHub Pages, estática)
Apps de cada proyecto (con backend mínimo)
Páginas públicas de usuarios (rutas en el servidor)
        │
        ▼
Supabase
  ├─ Auth: cuentas de usuario
  ├─ Postgres: proyectos, planes, suscripciones, entitlements, pagos, comisiones
  ├─ Edge Functions: checkout, webhooks, verificación de acceso, páginas públicas
  └─ RLS: seguridad por fila
        ▲
        │ webhooks
Pasarela de pagos (MercadoPago o ePayco, por confirmar)
```

## 2. Stack

- **Backend y base de datos:** Supabase (Postgres, Auth, Edge Functions).
- **Frontend:** HTML/JS o un framework ligero para las apps; GitHub Pages para la landing.
- **Pasarela:** MercadoPago o ePayco, con suscripciones recurrentes en COP. *(Por confirmar.)*
- **Correo transaccional:** Resend o Postmark.
- **Lenguaje:** TypeScript en las funciones.

## 3. Modelo de datos (resumen)

- `users`: gestionado por Supabase Auth.
- `projects`: una fila por aplicación o página.
- `plans`: planes por proyecto, con precio y periodicidad.
- `subscriptions`: usuario, plan, estado, ID externo en la pasarela y fin de periodo.
- `entitlements`: usuario, proyecto, acceso y fecha de vencimiento. Se actualiza desde `subscriptions`.
- `payments`: cada cobro, con monto final y snapshot de descuentos.
- `payment_events`: eventos recibidos de la pasarela, para auditoría e idempotencia.
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
1. La app envía el token de sesión a una función.
2. La función consulta `entitlements` y responde con el contenido o un error.
3. El frontend solo muestra lo que el servidor responde.

**Página pública**
1. La ruta `dominio/nombre` consulta `public_pages`.
2. Si `published = true`, muestra la página. Si no, muestra "no disponible".
3. Caché corta, y purga al cambiar el estado.

## 5. Seguridad

- Ningún número de tarjeta se guarda en el sistema; solo tokens de la pasarela.
- El estado de acceso solo lo cambian los webhooks o funciones del servidor, nunca el cliente.
- Las claves secretas viven en variables de entorno del servidor.
- RLS activado en todas las tablas.

## 6. Decisiones abiertas

- Pasarela definitiva (MercadoPago o ePayco).
- Si las páginas públicas llevan más contenido que enlaces y textos.
- Retención de datos (propuesta: 90 días tras suspensión).
