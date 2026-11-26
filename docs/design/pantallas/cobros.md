# Pantalla: Cobros

Artboards: `Cobros`, `CobrosClaro`, `Mapa`, `Pago`, `MovilCobros`, `MovilPago`, `EstadosCobros`. Ver `LINKS.md`.

## Componentes
Template Admin · Totales · Barra de herramientas · Buscador · Botón de filtros + modal de filtros · Tabla paginada · Mapa de cobros · Modal «Registrar pago manual» · Estado vacío/error · Pie de paginación.

## Estructura (de arriba abajo)
1. **Título «Cobros»** y botón primario **«Registrar pago manual»** a la derecha. Sin línea descriptiva.
2. **Totales** (tres tarjetas en fila, encima de la tarjeta principal): Cobrado · Pendiente · Vencido. Cada una: anillo con el porcentaje del color del estado, importe mono y «N mensualidades». Reaccionan a la búsqueda y a los filtros.
3. **Tarjeta principal**
   - Barra: `[Lista | Mapa]` (chips) · en el mapa, la leyenda Pagada/Pendiente/Vencida · a la derecha `[buscador de clientes][ícono de filtros con insignia]`.
   - **Lista**: tabla Cliente (enlace + producto) · Vence (mono; «pagada <fecha>» debajo si aplica) · Monto · Estado (insignia) · Acciones («Registrar pago», oculto si ya está pagada). Orden: vencimiento descendente. Pie: paginación.
   - **Mapa**: filas = suscripciones (cliente + producto), columnas = 12 meses, cada celda un nodo-botón. Pendiente/vencida abre «Registrar pago»; las demás llevan al detalle. Con paginación de filas.

## Filtros (modal «Filtrar cobros»)
Campos: Estado (Todos, Pagada, Pendiente, Vencida) · Producto (catálogo) · Cliente · Desde · Hasta. En **Mapa** se ocultan Desde y Hasta.
- Por defecto Desde 1 nov 2026 y Hasta 30 nov 2026 (cuenta como 1 filtro).
- Insignia del botón = filtros aplicados (el rango de fechas cuenta como uno; la búsqueda no cuenta). `aria-label` «Filtros, N aplicados».
- Pie del modal: «Quitar filtros» (izquierda, deshabilitado si no hay) y botón principal «Ver N cobros» (derecha) que cierra. Se cierra con X, fondo o Escape.
- Los filtros se aplican al instante.

## Registrar pago manual (modal)
Campos: Suscripción (solo con deuda; fijo si se abrió desde una fila), Fecha del pago, Medio, Referencia (opcional), «Mensualidades que cubre» (selección de la más antigua en adelante) e «Importe recibido» calculado. Botón principal «Registrar pago» a la derecha, «Cancelar» a la izquierda. Resultado: aviso «Registramos el pago.».

## Estados
datos · vacío («Todavía no hay cobros» → «Ir a suscripciones») · carga (skeleton de totales y 6 filas) · error («No pudimos cargar los cobros»). Sin resultados por filtro: «Sin cobros con estos filtros» + botón «Quitar filtros» (limpia también la búsqueda).

## Móvil
Tabla → tarjetas. Búsqueda a ancho completo; el ícono de filtros mide 44 px; el modal se pega cerca del borde superior. Totales apilados con la cifra a la derecha.

## Verificar
¿Los filtros ocupan una sola fila? ¿La insignia dice cuántos hay? ¿El estado de cada mensualidad se entiende sin color? ¿El botón de pago dice qué pasa («Registrar pago»)? ¿El modal deja la tabla en su sitio? ¿La búsqueda ignora acentos? ¿La página vuelve a 1 al filtrar?
