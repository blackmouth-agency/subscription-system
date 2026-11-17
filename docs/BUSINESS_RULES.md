# Reglas de negocio

Fuente de verdad sobre cómo funciona el producto. No incluye tecnología.

## 1. Glosario

- **Proyecto:** cada aplicación o landing que se cobra (por ejemplo, Linktree-like, app A, app B). Tiene sus propios planes.
- **Plan:** oferta de un proyecto con un precio y una periodicidad (mensual o anual).
- **Suscripción:** relación entre un usuario y un plan. Tiene un estado y fechas de periodo.
- **Entitlement (derecho de acceso):** permiso concreto de un usuario para usar un proyecto, derivado de su suscripción.
- **Descuento o cupón:** reduce el precio que paga el usuario.
- **Bono:** beneficio que extiende el acceso o da créditos sin cobro (por ejemplo, meses gratis).
- **Promotor:** persona que trae usuarios. Recibe una comisión por ventas atribuidas.
- **Comisión:** pago que el negocio hace al promotor. No es un descuento para el usuario.

## 2. Planes y precios

- Cada proyecto tiene sus propios planes. No hay paquetes combinados por ahora.
- Los precios están en COP.
- Cada cobro guarda el monto final y los descuentos o bonos aplicados (snapshot). Cambiar una regla después no altera el historial.

## 3. Estados de una suscripción

| Estado | Acceso | Descripción |
|---|---|---|
| **Activa** | Completo | Pago al día. |
| **En gracia** | Completo | Un cobro falló. Dura 7 días (propuesta). Se reintenta el cobro y se avisa por correo. |
| **Suspendida** | Ninguno | Gracia vencida sin pago. Las páginas públicas se despublican. Datos conservados 90 días (propuesta). |
| **Cancelada** | Ninguno | Cancelada por el usuario o tras 90 días suspendida. Datos archivados o eliminados según la política de retención. |

Transiciones:
- Activa → En gracia: falla un cobro.
- En gracia → Activa: se paga durante la gracia.
- En gracia → Suspendida: vence la gracia sin pago.
- Suspendida → Activa: se paga. Se reactiva de inmediato.
- Activa → Cancelada (por voluntad): mantiene acceso hasta el fin del periodo pagado.
- Suspendida → Cancelada: pasan 90 días sin pago.

## 4. Cancelación y reembolsos

- Cancelar no genera reembolso. El acceso sigue hasta el fin del periodo ya pagado.
- Los reembolsos se hacen de forma manual y bajo solicitud, según la política publicada. *(Por validar con abogado.)*
- Un pago fallido no cancela la suscripción; solo la pone en gracia.

## 5. Páginas públicas

- Una página pública se muestra solo si su dueño tiene una suscripción activa o en gracia.
- Al suspender la suscripción, la página se despublica. Al pagar, vuelve a publicarse.
- Los datos de la página se conservan mientras la cuenta no esté cancelada.

## 6. Promotores y comisiones

- Cada promotor tiene un código o enlace de referido.
- Una venta se atribuye al promotor cuyo código se usó en el checkout.
- La comisión se calcula sobre el monto cobrado (sin impuestos). *(Porcentaje por definir.)*
- Las comisiones se pagan de forma manual, mensual, por transferencia (Nequi o Bancolombia). *(Por validar con contador: retenciones.)*
- Las comisiones no son descuentos para el usuario.

## 7. Datos y cumplimiento

- Al crear la cuenta, el usuario acepta los términos y la política de tratamiento de datos.
- Política de cancelación y reembolsos visible antes del pago.
- *(Por validar: registro en RNBD, facturación electrónica y registro mercantil, con contador y abogado.)*
