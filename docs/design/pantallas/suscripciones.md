# Pantalla: Suscripciones (lista) y Nueva suscripción

Artboards: `Suscripciones`, `SuscripcionesClaro`, `NuevaSuscripcion`, `MovilSuscripciones`, `EstadosSuscripciones`. Ver `LINKS.md`.

## Componentes
Template Admin · Buscador · Chips de estado con conteo · Tabla paginada · Recorrido · Insignia · Panel lateral (formulario).

## Estructura
- Título «Suscripciones»; línea «N activas suman $ X al mes.»; botón primario «Nueva suscripción».
- Tarjeta: barra con buscador (cliente, producto o aliado; ignora acentos) a la izquierda y chips a la derecha: Todas · Activas · Pausadas · Canceladas, cada uno con conteo.
- Tabla: Cliente (enlace al detalle + producto) · Últimos 12 meses (recorrido; con texto accesible «N pagadas, M vencidas»; se oculta cuando el panel lateral está abierto) · Próximo cobro (+ «debe $ X») · Precio · Aliado (nombre + «comisión · duración» o «Directa») · Estado. Paginada.
- Sin resultados: «Ninguna suscripción coincide» (menciona lo buscado si hay búsqueda).

## Nueva suscripción (panel lateral, 384 px)
Campos: Cliente, Producto (al elegirlo copia su precio), Precio mensual (COP), Día del ciclo, Aliado («Sin aliado (venta directa)» por defecto). Si hay aliado: Comisión (COP), Duración de la comisión, Quién recibe el pago. Botón «Crear suscripción»; «Cancelar». Texto de ayuda: «La primera mensualidad sale el día del ciclo.». Errores: Elige el cliente / el producto; El precio debe ser mayor a 0. Resultado: «Creamos la suscripción.».
Editar (desde el detalle): cliente, producto, precio y día quedan deshabilitados; texto «Cliente, producto y precio no cambian.»; botón «Guardar suscripción».

## Estados
datos · vacío («Todavía no hay suscripciones» → «Nueva suscripción») · carga · error.

## Verificar
¿Chip activo distinguible sin color? ¿Cada nodo del recorrido tiene alternativa textual? ¿Teclado numérico en precio y día? ¿Ayuda siempre visible bajo el campo?
