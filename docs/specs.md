## 1. Propósito

Centralizar los clientes de Blackmouth, mantener sus acuerdos comerciales existentes, definir precios de catálogo estandarizados para nuevas ventas y gestionar las mensualidades mediante Wompi. La solución debe identificar quién recibe el pago completo y cómo se distribuye comercialmente entre la agencia y sus socios, sin encargarse de transferir dinero entre esas partes.

Este MVP es una herramienta de **administración comercial y de cobros**. No es un ERP, un sistema de contabilidad, una plataforma de reportes avanzados ni una herramienta para crear o editar los productos digitales vendidos.

## 2. Objetivos de lanzamiento

1. Contar con un registro centralizado de clientes y sus servicios contratados.
2. Administrar un catálogo de productos con precio oficial para las nuevas contrataciones.
3. Conservar por suscripción el precio y los acuerdos comerciales históricos de los clientes actuales.
4. Crear y controlar las mensualidades recurrentes, con confirmación y consulta de sus estados.
5. Permitir al cliente optar entre débito recurrente autorizado o pago manual por enlace, sujeto a las capacidades efectivamente disponibles en Wompi.
6. Registrar socios comerciales, comisiones fijas y la persona o entidad que recibe el pago completo.
7. Consultar cobros pagados, pendientes y vencidos, así como la distribución económica de cada pago.

## 3. Principios de alcance

- **La suscripción es la unidad comercial básica:** cada servicio contratado tiene condiciones independientes.
- **Precio de catálogo ≠ precio contratado:** un cambio en el catálogo no modifica contratos vigentes.
- **Recaudo ≠ participación económica:** el receptor del pago obtiene el valor total de la transacción; el sistema registra cuánto corresponde a cada parte.
- **Sin dispersión de comisiones:** no se ejecutan ni verifican las transferencias posteriores entre receptor y contraparte.
- **Trazabilidad mínima:** se conservan los pagos confirmados y los cambios relevantes de precio, comisión, receptor y estado.
- **Una única vista administrativa:** inicialmente no se requieren analítica avanzada ni herramientas de gestión operativa ajenas al cobro.

## 4. Actores

| Actor | Responsabilidad / alcance inicial |
|---|---|
| Administrador de Blackmouth | Registra clientes, productos, socios y suscripciones; configura condiciones; consulta cobros y estados. |
| Cliente | Contrata por medio de la agencia; autoriza cobro recurrente o recibe enlace para pagar. No necesita un portal integral en el MVP. |
| Socio comercial | Puede estar vinculado a suscripciones, recibir el pago íntegro o tener comisión; no accede al sistema. |
| Wompi | Proveedor de procesamiento de pagos seleccionado; las capacidades concretas de recurrencia y recepción por terceros quedan sujetas a validación. |

## 5. Funcionalidades incluidas

### 5.1 Clientes

**MVP-CLI-01.** Crear, consultar y actualizar el registro de clientes.  
**MVP-CLI-02.** Registrar nombre o razón social, un contacto principal, correo y teléfono/WhatsApp.  
**MVP-CLI-03.** Consultar las suscripciones y los cobros asociados a cada cliente.  
**MVP-CLI-04.** Admitir varios servicios para un cliente, sin fusionar sus suscripciones ni sus cobros.

### 5.2 Catálogo y precios

**MVP-CAT-01.** Crear, consultar y actualizar productos o servicios recurrentes con nombre, descripción breve y precio de catálogo mensual en COP.  
**MVP-CAT-02.** Identificar si un producto se ofrece para nuevas ventas o se ha retirado del catálogo; el retiro no cancela suscripciones existentes.  
**MVP-CAT-03.** Aplicar el precio oficial a nuevas contrataciones, con posibilidad de registrar el precio particular acordado con un cliente, especialmente en la migración de contratos actuales.  
**MVP-CAT-04.** Conservar el precio contratado de las suscripciones existentes cuando cambie el precio oficial.

> Los planes múltiples por producto y las categorías comerciales se reservan para evolución posterior; el MVP puede operar con productos a precio de catálogo único.

### 5.3 Socios y acuerdos comerciales

**MVP-SOC-01.** Registrar socios comerciales con identificación, contacto, estado (activo/inactivo) y referencia de una cuenta receptora.  
**MVP-SOC-02.** Asociar opcionalmente un socio comercial a una suscripción.  
**MVP-SOC-03.** Definir una **comisión fija en COP por mensualidad efectivamente pagada**; las ventas directas tienen comisión de $0.  
**MVP-SOC-04.** Registrar la duración del derecho a comisión: indefinida, temporal por número de mensualidades o única sobre el primer pago.  
**MVP-SOC-05.** Identificar el receptor del **pago completo**: Blackmouth o el socio asociado.  
**MVP-SOC-06.** Calcular para cada pago la atribución comercial: comisión del socio e ingreso de la agencia, contemplando descuentos y costos de la pasarela cuando corresponda.  
**MVP-SOC-07.** Permitir cambios administrativos de comisión y receptor para cobros no pagados y futuros, conservando las condiciones históricas de pagos confirmados.  
**MVP-SOC-08.** Mantener una única cuenta receptora activa de la agencia y una por socio, con posibilidad de actualizarla. Los cambios deberán aplicarse a los cobros pendientes y futuros cuando operativamente sea posible.

**Regla clave:** no se registra ni concilia la transferencia privada posterior entre la parte que recibió el pago y la parte que tiene derecho a una porción del ingreso. Por tanto, la atribución registrada **no equivale a constancia de transferencia efectiva**.

### 5.4 Suscripciones y mensualidades

**MVP-SUS-01.** Crear suscripciones exclusivamente por acción administrativa y asociarlas a cliente y producto.  
**MVP-SUS-02.** Registrar por suscripción precio contratado, descuento si aplica, fecha del ciclo, socio, comisión, receptor y modalidad de pago.  
**MVP-SUS-03.** Mantener duración indefinida con renovación mensual hasta su cancelación administrativa.  
**MVP-SUS-04.** Calcular y registrar cada mensualidad sin combinar cobros de distintas suscripciones del mismo cliente.  
**MVP-SUS-05.** Usar por defecto la fecha de contratación como referencia del ciclo, con posibilidad de modificarla administrativamente y sin prorratear por cambio de día.  
**MVP-SUS-06.** Para fechas inexistentes en un mes, mover el cobro al último día de ese mes **y conservar el nuevo día como fecha habitual** (p. ej., 31 ene. → 28 feb. → 28 mar.).  
**MVP-SUS-07.** Registrar estados esenciales de suscripción/servicio: pendiente de activación, activo, suspendido y cancelado, con control administrativo de habilitación/suspensión cuando esté disponible en el producto.  
**MVP-SUS-08.** Permitir incorporar clientes anteriores y sus condiciones vigentes sin forzar la reconstrucción de todos sus pagos históricos. Saldos pendientes o anticipos podrán registrarse como datos iniciales cuando existan.

### 5.5 Cobro y estado de pago

**MVP-PAG-01.** Utilizar Wompi como proveedor de pago elegido.  
**MVP-PAG-02.** Ofrecer al cliente, cuando el proveedor lo permita, elección entre (a) cargo mensual autorizado y (b) enlace de pago de cada mensualidad.  
**MVP-PAG-03.** Registrar estados de cobro, como pendiente, pagado, vencido y fallido cuando proceda, diferenciando el estado real del pago de la mera emisión de una solicitud.  
**MVP-PAG-04.** Evitar atribuir dos veces un mismo pago o duplicar la mensualidad cubierta.  
**MVP-PAG-05.** Al confirmar un pago, calcular y conservar: valor cobrado, receptor, comisión fija aplicable, importe atribuido a Blackmouth, descuentos y costo transaccional si se conoce.  
**MVP-PAG-06.** Los costos transaccionales y los descuentos comerciales son asumidos por la agencia; la comisión fija pactada con el socio se conserva.  
**MVP-PAG-07.** Mantener tres días calendario de gracia predeterminados por impago, modificables por suscripción; al vencimiento, la agencia decide manualmente la suspensión.  
**MVP-PAG-08.** Detener la generación de nuevas mensualidades mientras el servicio esté suspendido; conservar las obligaciones previas.  
**MVP-PAG-09.** Si se paga toda la deuda, permitir reactivar el servicio automáticamente, excepto ante bloqueo administrativo; el nuevo ciclo inicia en la fecha de reactivación.  
**MVP-PAG-10.** Permitir registrar manualmente pagos externos con fecha, importe, medio y receptor; el comprobante es opcional.  
**MVP-PAG-11.** Permitir el pago de mensualidades completas y anticipos de meses completos, pero no abonos parciales; cuando haya deuda acumulada, liquidar primero las mensualidades más antiguas.  
**MVP-PAG-12.** Contemplar avisos mínimos al cliente para cobro, pago recibido y fallo/impago mediante correo y WhatsApp; la automatización, frecuencia y alcance de notificaciones más elaboradas se priorizarán después del flujo principal de cobro.

### 5.6 Consulta administrativa mínima

**MVP-CON-01.** Mostrar listado de clientes, suscripciones y su estado.  
**MVP-CON-02.** Mostrar cobros por cobrar, vencidos y confirmados; permitir filtrar por cliente, producto y periodo.  
**MVP-CON-03.** Mostrar por pago el receptor del dinero y el reparto comercial atribuido.  
**MVP-CON-04.** Mostrar importes acumulados básicos de recaudo confirmado y comisiones registradas, sin construir informes personalizados, dashboards complejos ni proyecciones.  
**MVP-CON-05.** Conservar trazabilidad de modificaciones comerciales críticas; los pagos informados por Wompi no deben sobrescribirse como si hubieran ocurrido de otra manera.

## 6. Flujos principales

### Flujo A. Incorporar un cliente actual

1. La agencia registra el cliente y el producto contratado.
2. Ingresa el **precio histórico acordado**, incluso si difiere del precio actual de catálogo.
3. Registra el socio comercial, si aplica, su comisión fija y duración.
4. Indica quién recibe la mensualidad completa.
5. Registra fecha del próximo cobro y saldos iniciales conocidos, si corresponde.
6. El sistema continúa administrando las mensualidades desde ese estado inicial sin alterar los contratos previos.

### Flujo B. Dar de alta una venta nueva

1. La agencia registra o selecciona el cliente.
2. Elige un producto y propone su precio oficial vigente.
3. Confirma los términos concretos de la suscripción y si tiene socio comercial.
4. Define comisión y receptor de la totalidad del pago.
5. El cliente selecciona entre cobro recurrente autorizado o enlace de pago.
6. Se genera la primera obligación y se inicia el seguimiento de pagos.

### Flujo C. Cobrar una mensualidad

1. Se determina la obligación de la suscripción y su receptor.
2. Se solicita/ejecuta el pago por la modalidad elegida.
3. Al confirmarse el pago, se identifica qué mensualidad quedó cubierta.
4. Se registra el ingreso total recaudado **por el receptor**, y su atribución comercial a agencia y socio.
5. Se programa la siguiente obligación, respetando el ciclo y las condiciones de esa suscripción.

### Flujo D. Impago

1. El cobro queda pendiente o fallido y se informa al cliente.
2. Corren tres días calendario de gracia por defecto.
3. Vencido ese plazo, se avisa a la agencia para decidir si suspende.
4. Si suspende, no nacen nuevas mensualidades hasta la reactivación.
5. Al saldarse toda la deuda, el servicio puede reactivarse, salvo bloqueo administrativo.

## 7. Reglas de cálculo y ejemplos

Para una mensualidad pagada:

- **Total cobrado al cliente** = precio contratado − descuento aplicable (más impuestos cuando correspondan al importe final definido).
- **Comisión del socio** = importe fijo de la mensualidad, si el acuerdo continúa vigente y el pago es elegible.
- **Ingreso comercial de la agencia antes de pasarela** = total cobrado − comisión del socio.
- **Ingreso estimado de la agencia después de pasarela** = ingreso comercial de la agencia − costo de procesamiento atribuible a la agencia.

| Caso ilustrativo | Precio mensual | Comisión socio | Receptor del total | Atribución a agencia antes de pasarela |
|---|---:|---:|---|---:|
| Cliente histórico referido | $45.000 | $15.000 | Socio | $30.000 |
| Cliente nuevo directo | $60.000 | $0 | Agencia | $60.000 |

Los importes son ejemplos, no precios reales acordados por Blackmouth. Los cálculos del sistema son de **gestión comercial**, no un sustituto del tratamiento contable/tributario oficial. Si un descuento supera la parte comercial de la agencia, el sistema deberá advertir del resultado desfavorable, sin cambiar unilateralmente la comisión pactada.

## 8. Fuera del MVP

- Paneles analíticos y reportes financieros/comerciales detallados, proyecciones y exportaciones especializadas.
- Portal integral del cliente y cualquier portal para socios comerciales.
- Paquetes de productos, descuentos por paquete, múltiples planes y categorías avanzadas.
- Gestión de cobros extraordinarios independientes o asociados y sus planes de cuotas.
- Gestión exhaustiva de devoluciones, cambios de plan complejos, cancelaciones con casos especiales y saldos a favor.
- Historial extenso de comunicaciones, tareas administrativas y seguimiento operativo detallado.
- Facturación electrónica dentro del sistema y gestión tributaria integral.
- Configuración sofisticada de permisos, personalización de informes, adjuntos y documentación contractual.

Las decisiones previas sobre estas capacidades quedan como **visión futura**, no como compromisos del primer lanzamiento.

## 9. Condiciones de aceptación del MVP

El MVP estará funcionalmente listo para evaluar su lanzamiento cuando se pueda comprobar que:

1. Un mismo producto se vende a un nuevo cliente con precio oficial sin modificar el precio histórico de uno existente.
2. Dos suscripciones del mismo producto pueden tener precios, socios, comisiones y receptores distintos.
3. Una venta directa asigna $0 de comisión y la totalidad del ingreso comercial a Blackmouth.
4. Un pago confirmado se asocia una sola vez a su mensualidad y queda distinguido de uno pendiente/fallido.
5. Se puede ver **quién recibió** el pago completo y **qué parte corresponde** económicamente a cada participante.
6. La plataforma no declara que se haya transferido dinero entre socios y agencia cuando no ha gestionado esa transferencia.
7. El sistema conserva los acuerdos existentes al incorporar los clientes actuales.
8. Las suscripciones independientes de un cliente se pueden consultar sin consolidar artificialmente sus pagos.
9. Las condiciones de impago y la suspensión manual se respetan.
10. El flujo real de cobro elegido queda validado con Wompi antes de comprometer su uso comercial.

## 10. Validaciones de negocio pendientes antes del lanzamiento

Estas validaciones no agregan nuevas funcionalidades; son condiciones para que el alcance definido pueda operar de forma confiable:

- **Wompi y receptores distintos:** confirmar si el proveedor puede admitir que pagos de suscripciones diferentes se dirijan íntegramente a la cuenta de Blackmouth o de un socio; no asumir que registrar una cuenta bancaria basta para enrutar un cobro.
- **Recurrencia:** confirmar qué modalidades autorizadas y métodos de pago admite el proveedor y cuáles requieren nueva aprobación del cliente ante cambios de receptor o cuenta.
- **Responsable de facturar y tratamiento tributario:** definir con asesoría contable/contractual quién presta y factura cada operación, especialmente cuando el socio recibe el total del recaudo.
- **Consentimiento y datos personales:** fijar autorización de cobros, comunicaciones y tratamiento de datos de clientes.
- **Cuentas y migración:** revisar los acuerdos existentes con cada socio y los saldos iniciales de los clientes antes de activar nuevos cobros para evitar duplicidades.

**Criterio de cierre:** priorizar únicamente las capacidades que permiten facturar, cobrar y distinguir los ingresos comerciales con los acuerdos ya existentes. Cualquier necesidad adicional debe evaluarse como ampliación deliberada del alcance.
