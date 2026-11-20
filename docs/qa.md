# Preguntas abiertas: revisión de `specs.md`

Revisión del documento de especificación del MVP de administración comercial y cobros de Blackmouth.
Las preguntas están ordenadas por impacto: las del bloque 1 pueden cambiar la arquitectura; las últimas son detalles que se pueden resolver durante la construcción.

Cada pregunta indica el requisito relacionado (`MVP-XXX-NN`) para ubicarla en la especificación.

---

## 1. Bloqueantes: Wompi y enrutamiento del dinero

Son las preguntas de mayor riesgo. Si la respuesta no es la que asume la especificación, cambia el modelo de datos y la integración.

- [ ] **¿Cómo llega el dinero a la cuenta de un socio?** (MVP-SOC-05, §10)
  Hasta donde sé, Wompi trabaja con una cuenta de comercio por titular y no reparte un pago entre varias cuentas (split). Si eso se confirma, para que un socio "reciba el pago completo" él necesitaría **su propia cuenta de comercio en Wompi**, y el sistema tendría que operar con sus llaves de API.
  - ¿Cada socio receptor tendrá su propia cuenta de comercio en Wompi?
  - ¿El sistema guardará las llaves privadas y los secretos de eventos de terceros? ¿Quién responde si se filtran?
  - Si un socio no tiene cuenta Wompi, ¿solo puede ser receptor con pagos manuales (MVP-PAG-10)?

- [ ] **¿Qué es exactamente la "cuenta receptora"?** (MVP-SOC-01, MVP-SOC-08)
  ¿Es una cuenta bancaria (dato informativo) o una cuenta de comercio Wompi (dato operativo)? La especificación ya advierte que registrar una cuenta bancaria no basta para enrutar un cobro. Hay que decidir qué campo se guarda y para qué se usa.

- [ ] **¿Cómo funciona la recurrencia?** (MVP-PAG-02)
  Por lo que conozco, Wompi permite tokenizar un medio de pago (fuente de pago) y cobrarlo por API, pero no programa los cobros: el calendario, los reintentos y el control de duplicados los pone el sistema. Conviene verificarlo con Wompi.
  - ¿Qué medios admiten cobro recurrente (tarjeta, Nequi, otros)? ¿PSE queda solo para pago por enlace?
  - Si falla un cargo automático, ¿se reintenta? ¿Cuántas veces y con qué intervalo?
  - ¿Se envía enlace de pago como respaldo cuando falla el débito?

- [ ] **¿Qué pasa con la autorización de débito si cambia el receptor?** (MVP-SOC-07, MVP-SOC-08)
  Si el token pertenece a la cuenta de comercio de la agencia y el receptor pasa a ser un socio (o al revés), lo más probable es que el token no sirva en la otra cuenta y el cliente tenga que autorizar de nuevo. ¿Cómo se gestiona esa transición? ¿El cobro queda en estado "requiere nueva autorización"?

- [ ] **¿Se hará una prueba técnica con Wompi antes de construir?**
  El criterio de aceptación 10 exige validar el flujo con Wompi, pero sería mejor hacerlo **al principio** que al final: cuenta sandbox, un pago por enlace, un cargo recurrente con token, recepción de webhooks y un cobro hacia una segunda cuenta de comercio.

---

## 2. Reglas de dinero y cálculo

- [ ] **Impuestos:** ¿el precio de catálogo incluye IVA o se suma aparte? La fórmula del §7 dice "más impuestos cuando correspondan", lo que deja abierto si el cliente paga $45.000 o $53.550. ¿La comisión del socio se calcula sobre el valor con impuestos o sin ellos?
- [ ] **Retenciones:** si el cliente es persona jurídica y aplica retención en la fuente o de ICA, el valor recibido será menor que el cobrado. ¿Se registra? ¿Quién asume la diferencia?
- [ ] **Descuentos:** ¿son un valor fijo o un porcentaje? ¿Son permanentes o duran N mensualidades? ¿Puede haber más de uno por suscripción? (MVP-SUS-02)
- [ ] **Costo de pasarela cuando recibe el socio** (MVP-PAG-06): Wompi descuenta la comisión de la cuenta del socio, pero la regla dice que ese costo lo asume la agencia. Entonces, ¿el socio le debe a la agencia `ingreso de la agencia − costo de pasarela`? ¿El sistema muestra ese saldo esperado aunque no concilie la transferencia?
- [ ] **¿De dónde sale el costo transaccional?** (MVP-PAG-05): ¿se toma de la respuesta o el webhook de Wompi, se calcula con una tarifa configurada o se ingresa a mano? El texto dice "si se conoce".
- [ ] **Atribución negativa** (§7): si el descuento supera la parte de la agencia (por ejemplo, precio $45.000, comisión $15.000 y descuento $35.000), la agencia queda en −$5.000. ¿El sistema solo advierte o también bloquea la creación de la suscripción? ¿Ese saldo negativo se muestra como deuda de la agencia con el socio?
- [ ] **Redondeo y unidades:** Wompi trabaja en centavos (`amount_in_cents`). ¿Todos los montos se guardan como enteros en centavos? ¿Cómo se redondea si en el futuro hay porcentajes?
- [ ] **Cambio intencional del precio contratado:** el catálogo no altera contratos (MVP-CAT-04), pero ¿puede la agencia subir el precio de una suscripción existente (por ejemplo, ajuste anual por IPC)? ¿Desde cuándo aplica, desde el siguiente cobro no emitido? ¿Hay que avisar al cliente?

---

## 3. Comisiones de socios

- [ ] **¿Cuándo se cuenta una mensualidad para la comisión "temporal por N mensualidades"?** (MVP-SOC-04) ¿Por cada mensualidad cubierta o por cada pago? Un anticipo de 3 meses, ¿consume 3 de las N?
- [ ] **Clientes migrados:** para una comisión temporal o "única sobre el primer pago", ¿cuántas mensualidades ya se consumieron antes de la migración? Hace falta un campo de "mensualidades ya comisionadas" en los datos iniciales (MVP-SUS-08).
- [ ] **Socio inactivo:** si un socio pasa a inactivo, ¿sigue ganando comisión en las suscripciones vigentes? ¿Sigue siendo receptor? ¿Hay que reasignar el receptor a la fuerza?
- [ ] **¿Puede haber más de un socio por suscripción?** (por ejemplo, el que refirió y el que opera). La especificación asume uno; conviene confirmarlo de forma explícita.
- [ ] **Comisión con pago tardío:** si una mensualidad se paga después de terminado el derecho a comisión, ¿se usan las condiciones vigentes a la fecha de la mensualidad o a la fecha del pago?

---

## 4. Ciclo de facturación y fechas

- [ ] **Regla de fin de mes** (MVP-SUS-06): con "31 ene. → 28 feb. → 28 mar.", un cliente del día 31 pasa al día 28 de forma permanente después de febrero. ¿Es intencional? La alternativa habitual es conservar el día 31 y cobrar el último día de cada mes (31 ene. → 28 feb. → 31 mar.).
- [ ] **Cambio de fecha del ciclo sin prorrateo** (MVP-SUS-05): si se mueve el día 10 al 25, ¿el periodo actual se alarga 15 días gratis o se cobra el día 25 del mismo mes, de modo que el cliente paga dos veces en 15 días? Hay que definir cuál de los dos ocurre.
- [ ] **Reactivación** (MVP-PAG-09): "el nuevo ciclo inicia en la fecha de reactivación" cambia el día habitual de cobro. ¿Es intencional? ¿Se cobra de inmediato la primera mensualidad del nuevo ciclo?
- [ ] **¿Con cuánta anticipación se genera el cobro?** ¿El enlace se envía el mismo día del vencimiento o N días antes? ¿El débito automático se ejecuta el día exacto?
- [ ] **Zona horaria:** todas las fechas y procesos programados en America/Bogotá, ¿correcto? ¿A qué hora del día se ejecutan los cobros automáticos?
- [ ] **Primera mensualidad de una venta nueva** (Flujo B, paso 6): ¿se cobra al contratar o en la fecha del ciclo? ¿La suscripción está "pendiente de activación" hasta el primer pago?

---

## 5. Estados de cobro y suscripción

Hay dos máquinas de estados (cobro y suscripción) que no están definidas por completo.

- [ ] **Estados de cobro** (MVP-PAG-03): ¿cuál es la diferencia exacta entre *pendiente*, *vencido* y *fallido*? Propuesta para validar: `pendiente` (emitido, dentro del plazo) → `vencido` (pasaron los días de gracia) y `fallido` (Wompi rechazó un intento, pero el cobro sigue abierto). ¿Hace falta un estado `anulado` para los cobros de una suscripción cancelada?
- [ ] **¿Qué activa una suscripción "pendiente de activación"?** (MVP-SUS-07) ¿El primer pago, una acción del administrador o la entrega del producto?
- [ ] **Suspensión manual frente a bloqueo administrativo** (MVP-PAG-09): ¿son dos cosas diferentes? Si el administrador suspende por impago y el cliente paga, se reactiva sola; si la "bloquea", no. ¿Hace falta un indicador aparte de "no reactivar automáticamente"?
- [ ] **Días de gracia:** ¿se cuentan desde la fecha de vencimiento o desde el primer intento fallido? ¿Durante la gracia se sigue intentando el débito?
- [ ] **Pago que llega a una suscripción cancelada o suspendida** (por ejemplo, el cliente paga un enlace viejo): ¿se acepta, se marca para revisión o se reembolsa?
- [ ] **Cancelación:** ¿es inmediata o al final del periodo pagado? ¿Las deudas pendientes siguen siendo cobrables? ¿Se elimina el token de débito?
- [ ] **Intereses de mora o recargos:** ¿no existen? Conviene dejarlo escrito.
- [ ] **Suspensión del servicio real:** "cuando esté disponible en el producto" (MVP-SUS-07). En el MVP, ¿la suspensión es solo un estado en este sistema y alguien apaga el servicio a mano, o hay alguna integración con los productos?

---

## 6. Pagos, anticipos y conciliación

- [ ] **Sin abonos parciales** (MVP-PAG-11): un pago externo manual por un valor que no corresponde a mensualidades completas, ¿se rechaza o se registra como pendiente de aplicar? ¿Qué pasa con un saldo a favor? (Los saldos a favor están fuera del MVP, pero pueden ocurrir en la práctica.)
- [ ] **Anticipos:** ¿se generan cobros por adelantado para los meses pagados? Si cambia el precio contratado durante el periodo anticipado, ¿se respeta lo pagado?
- [ ] **Enlace de pago:** ¿uno por mensualidad o uno que cubre varias mensualidades vencidas? ¿Vence? Si se pagan los cobros más antiguos primero (MVP-PAG-11), ¿el enlace debe incluir todas las mensualidades pendientes?
- [ ] **Webhooks perdidos:** si Wompi no notifica o el servidor está caído, ¿hay una consulta periódica de transacciones para conciliar? (Relacionado con MVP-PAG-04: no duplicar pagos.)
- [ ] **Contracargos y reversiones de tarjeta:** las devoluciones están fuera del alcance, pero un contracargo puede llegar sin que la agencia lo inicie. ¿Qué estado toma el cobro? ¿Se revierte la comisión registrada?
- [ ] **Pago manual registrado y pago por Wompi de la misma mensualidad:** ¿cuál prevalece? ¿Se bloquea el enlace cuando se registra un pago manual?

---

## 7. Clientes, datos y cumplimiento

- [ ] **Identificación del cliente:** MVP-CLI-02 no pide número de documento (NIT o cédula) ni tipo de persona. Wompi exige documento para algunos medios (PSE) y la facturación lo necesita. ¿Se agrega?
- [ ] **Facturación electrónica:** queda fuera del sistema, pero en Colombia cada venta requiere factura electrónica DIAN. ¿Quién la emite y con qué herramienta? ¿El sistema debe registrar al menos el número de factura asociado a cada pago?
- [ ] **Quién factura cuando el socio recibe el total** (§10): esta decisión contable puede obligar a que el sistema registre en cada suscripción quién presta el servicio, además de quién recibe el pago.
- [ ] **Habeas data (Ley 1581):** ¿dónde y cómo se guarda la evidencia de la autorización de tratamiento de datos y de la autorización de débito recurrente (fecha, canal, texto aceptado)?
- [ ] **Datos de socios:** ¿se guardan datos bancarios? Si es así, ¿hay requisitos de cifrado o restricción de acceso?

---

## 8. Notificaciones

- [ ] **WhatsApp** (MVP-PAG-12): ¿API oficial de WhatsApp Business (con plantillas aprobadas por Meta y costo por mensaje, directo o con un proveedor como Twilio) o, para el MVP, un enlace `wa.me` con mensaje prellenado que el administrador envía a mano? Esta decisión cambia mucho el esfuerzo.
- [ ] **Correo:** ¿con qué proveedor y desde qué dominio? ¿Hay que configurar SPF y DKIM en el dominio de Blackmouth?
- [ ] **¿Quién aparece como remitente** cuando el receptor es un socio? ¿El cliente sabe que le paga a un tercero?
- [ ] **Aviso a la agencia al terminar la gracia** (Flujo D, paso 3): ¿por correo, por WhatsApp o solo dentro del panel?

---

## 9. Migración de clientes actuales

- [ ] **Volumen:** ¿cuántos clientes, suscripciones y socios hay hoy? Eso define si basta con carga manual o hace falta importación por CSV.
- [ ] **¿Cómo pagan hoy los clientes actuales?** Si pagan por transferencia, pasar a Wompi requiere comunicarles el cambio y pedirles nueva autorización.
- [ ] **Fecha de corte:** ¿hay un día único de migración o se migra cliente por cliente? ¿Qué pasa con los cobros que se emitan por el sistema anterior durante la transición? (§10 menciona el riesgo de duplicados.)
- [ ] **Saldos iniciales** (MVP-SUS-08): ¿una deuda inicial se registra como mensualidades concretas (con periodo) o como un monto global? Como no se admiten abonos parciales, un monto global que no equivale a meses completos no encajaría.

---

## 10. Aspectos no funcionales (no aparecen en la especificación)

- [ ] **Usuarios y acceso:** ¿cuántos administradores habrá? ¿Cómo inician sesión? La trazabilidad (MVP-CON-05) necesita saber **quién** hizo cada cambio, así que hace falta al menos un usuario por persona.
- [ ] **Tecnología y hospedaje:** ¿hay preferencias de lenguaje, framework o proveedor? ¿Cuál es el presupuesto mensual de infraestructura?
- [ ] **Procesos programados:** los cobros recurrentes, la expiración de la gracia y la generación de mensualidades necesitan tareas programadas confiables. ¿Dónde se ejecutan y qué pasa si una ejecución falla?
- [ ] **Respaldos:** es información financiera. ¿Con qué frecuencia se respalda y por cuánto tiempo se conserva?
- [ ] **Ambientes:** ¿habrá un ambiente de pruebas con Wompi sandbox separado de producción?
- [ ] **Mantenimiento:** ¿quién opera y mantiene el sistema después del lanzamiento?

---

## Observaciones menores sobre el documento

- Le faltan título, versión, fecha y responsable al inicio (empieza directamente en "## 1. Propósito").
- Un glosario corto ayudaría a fijar términos que se usan casi como sinónimos: *suscripción / servicio*, *mensualidad / cobro / obligación*, *receptor / cuenta receptora*, *fecha del ciclo / fecha del próximo cobro*.
- MVP-SUS-02 habla de "fecha del ciclo" y el Flujo A de "fecha del próximo cobro". ¿Son el mismo dato?
- MVP-PAG-09 dice "reactivar automáticamente" y el Flujo D, paso 5, dice "puede reactivarse". Hay que unificar.
- Un diagrama de estados (cobro y suscripción) con sus transiciones ayudaría a responder buena parte de las secciones 4 y 5.
