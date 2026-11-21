# Historias de usuario del MVP

Historias pequeñas para implementar en orden a partir de `specs.md`. El login, el registro y el perfil ya están hechos.
Las marcadas con ⚠ dependen de una pregunta abierta de `qa.md`.

Supuestos: los montos son enteros en COP y "vencida" no se guarda, se calcula como fecha de la mensualidad + días de gracia < hoy.

1. **Rol admin:** `is_admin()` controla los permisos (RLS) de todo lo nuevo y una cuenta sin el rol ve "sin acceso". El rol se asigna por SQL.
   - El rol vive en la tabla `public.admins (user_id)`, no en el JWT: quitarlo aplica al instante. Con RLS y solo `select` de la propia fila; ni `authenticated` ni `service_role` escriben, así que nadie se da el rol por la API.
   - `is_admin()` es SQL `stable`, sin `security definer`. Toda policy de las historias 2 a 15 usa `(select public.is_admin())` en `using` y `with check`.
   - Portal: tras iniciar sesión llama `rpc("is_admin")`. Admin ve el área de administración; los demás ven "Sin acceso". Perfil, cambio de clave, eliminar cuenta y cerrar sesión siguen para todos.
   - Pruebas: pgTAP (`admins.test.sql`, más los permisos en `security.test.sql`) y Playwright (`admin.spec.ts`, que da el rol con conexión directa a `DB_URL`).
   - Fuera: varios roles, pantalla para asignarlos y registrar quién dio el rol.
2. **Catálogo:** crear y listar productos (nombre, descripción y precio entero en COP).
   - Tabla `public.products`: `id uuid pk`, `name text not null`, `description text not null default ''`, `price integer not null`, `is_active boolean not null default true` y `created_at`. Checks: `price > 0` y `name` sin espacios sobrantes ni vacío. El nombre puede repetirse.
   - RLS con `select` e `insert` y `(select public.is_admin())` en `using` y `with check`. GRANT solo `select, insert` a `authenticated`: sin `update` ni `delete` hasta que se editen y retiren productos.
   - API (`modules/products/`): `GET /api/products` (lista por nombre) y `POST /api/products`. `validate` con zod (`name` 1–100, `description` ≤ 500, `price` entero positivo). Sin rol admin responde 403 "Sin acceso". No lleva RPC porque no toca dinero.
   - Portal: página `/admin/products` en el área admin, con los organismos `ProductForm` (React Hook Form) y `ProductTable`, un template y la page con los datos vía axios. El precio se muestra en COP con `Intl.NumberFormat`.
   - Pruebas: pgTAP (`products.test.sql`: admin inserta y lee, no admin ni ve ni inserta, rechaza precio ≤ 0), Deno (validación y 403) y Playwright (`products.spec.ts`: el admin crea un producto y lo ve en la lista; un no admin ve "Sin acceso").
   - Fuera: editar, retirar, categorías, planes múltiples y paginación.
3. **Clientes:** crear, listar y editar.
4. **Socios:** crear, listar y editar, con un campo activo y una cuenta receptora en texto.
5. **Suscripción directa:** cliente y producto, con el precio de catálogo editable, la fecha del ciclo en hoy (editable), estado "pendiente", comisión $0 y la agencia como receptor. Se ve en el listado y en el cliente.
6. **Socio en la suscripción:** socio, comisión fija, duración (indefinida, N mensualidades o única) y receptor (agencia o socio).
7. **Estados:** activar, suspender y cancelar a mano.
8. **Historial:** un solo trigger guarda quién, cuándo, el valor anterior y el nuevo de precio, comisión, receptor y estado.
9. **Generar mensualidades:** una tarea diaria (pg_cron) crea una por periodo, sin duplicados gracias a una restricción única, y se salta las suscripciones suspendidas o canceladas. Lleva prueba de la regla de fin de mes ⚠.
10. **Ver las mensualidades** de una suscripción: pendiente, pagada o vencida (calculada).
11. **Pago manual:** cubre las mensualidades más antiguas, solo completas, y nunca paga dos veces la misma. Al confirmarse guarda el receptor y el reparto, que ya no cambian. Lleva pruebas, porque toca dinero.
12. **Listado de cobros:** filtros por cliente, producto, periodo y estado, más el receptor, el reparto, los totales y la leyenda "no es constancia de transferencia".
13. **Migrar un cliente actual:** las mensualidades ya comisionadas y la deuda inicial como mensualidades concretas.
14. **Prueba técnica con Wompi** en sandbox. Su resultado decide qué se construye para el pago por enlace, el webhook, la conciliación y el débito recurrente.
15. **Botón `wa.me`** con el aviso de cobro ya escrito.

## Pospuesto

- Editar y retirar productos del catálogo (MVP-CAT-01, CAT-02). Mientras tanto, un precio se corrige en la base de datos.
- Búsqueda de clientes, cuenta receptora de la agencia, descuentos ⚠, anticipos, reactivación automática ⚠, costo de pasarela y avisos por correo.
- Pago por enlace, webhook, conciliación y débito recurrente con Wompi, hasta tener el resultado de la historia 14.
