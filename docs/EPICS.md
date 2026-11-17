# Épicas

Orden de ejecución por fases. Cada épica tiene un criterio de aceptación para saber cuándo está terminada.

## Fase 0: Fundamentos

### E0. Base técnica
- Proyecto en Supabase, entornos de desarrollo y producción, manejo de secretos y despliegue básico.
- **Aceptación:** se puede desplegar a producción y revertir sin tocar la base de datos.

## Fase 1: Núcleo (MVP)

### E1. Cuentas e identidad
- Registro, inicio de sesión, recuperación de contraseña, perfil y aceptación de términos.
- **Depende de:** E0.
- **Aceptación:** un usuario puede crear cuenta, iniciar sesión y recuperar su contraseña.

### E2. Catálogo de proyectos y planes
- Alta de proyectos, planes con precio y periodicidad, y asociación usuario ↔ proyecto.
- **Depende de:** E1.
- **Aceptación:** cada proyecto tiene planes y se puede consultar qué usuarios están asociados.

### E3. Suscripciones y entitlements
- Estados de la suscripción (activa, en gracia, suspendida, cancelada), reglas de acceso y endpoint de verificación.
- **Depende de:** E2.
- **Aceptación:** una app recibe permiso o rechazo según el estado de la suscripción.

### E4. Integración de pagos
- Checkout, suscripción recurrente, webhooks idempotentes y pruebas en sandbox.
- **Depende de:** E3.
- **Aceptación:** un pago de prueba activa la suscripción y un evento repetido no genera efectos dobles.

### E5. Ciclo de vida y notificaciones
- Periodo de gracia, reintentos, cancelación, reactivación y correos transaccionales.
- **Depende de:** E4.
- **Aceptación:** un pago fallido pone la cuenta en gracia, envía avisos y termina en suspensión si no se paga.

### E6. Páginas públicas
- Publicar y despublicar, ruta pública, purga de caché y plantilla básica.
- **Depende de:** E3.
- **Aceptación:** al suspender una suscripción, su página deja de verse en menos de un minuto.

### E7. Legal y cumplimiento
- Políticas de privacidad, términos, cancelación y reembolsos, y trámites con contador y abogado.
- **Puede correr en paralelo desde el inicio.**
- **Aceptación:** documentos publicados y trámites de DIAN y registro confirmados.

## Fase 2: Operación y crecimiento

### E8. Panel de administración
- Ver suscripciones, reembolsos manuales, logs de webhooks y soporte básico.
- **Depende de:** E4.
- **Aceptación:** se puede buscar un usuario y ver su historial de pagos y estados.

### E9. Motor de precios
- Cupones, descuentos, meses gratis y créditos, con snapshot del precio en cada cobro.
- **Depende de:** E4.
- **Aceptación:** un cupón se aplica en el checkout y queda registrado en el cobro.

### E10. Promotores y comisiones
- Códigos de referido, atribución de ventas, ledger de comisiones y pagos a promotores.
- **Depende de:** E4 y E9.
- **Aceptación:** una venta con código queda atribuida y genera una comisión pendiente.

## Fase 3: Lanzamiento

### E11. Piloto y migración
- Salida a producción con una app y con los promotores actuales como primeros usuarios.
- **Depende de:** E1 a E7.
- **Aceptación:** primeros cobros reales completados sin incidentes.
