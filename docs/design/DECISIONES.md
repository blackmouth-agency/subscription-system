# Decisiones de diseño

| Decisión | Por qué | Principio |
|---|---|---|
| Solo cinco colores; el azul es el único acento | Que el color signifique algo y el resto sea neutro | Color: un solo acento; base neutra |
| Cada estado cambia color, forma y texto (nodo, insignia) | Que se entienda en escala de grises y para daltonismo | Color: usar color solo cuando signifique; prueba en grises |
| Gris secundario mezclado para pasar 4.5:1; bordes de control ≥ 3:1 | Texto tenue legible | Color: contrastar el gris secundario |
| Inter + Geist Mono para toda cifra | Importes y fechas alineables y legibles | Tipografía: escala corta, dos pesos |
| Filtros de Cobros: de una fila de 4 campos (~100 px) a un botón de solo ícono + modal | La fila ocupaba demasiado espacio; se evaluaron 3 propuestas (A barra única, B totales como filtro, C botón y panel) y se eligió C con ajustes | Opciones y decisiones (Hick): reducir las opciones iniciales |
| Ícono de filtros sin texto y con insignia numérica | Ahorra espacio y avisa de que hay filtros activos | Iconos; Feedback del sistema |
| Se quitó la fila de chips de filtros aplicados bajo la barra | Pedido del usuario: ocupaba espacio y repetía el dato de la insignia | Jerarquía visual |
| Filtros en modal, no en panel acoplado | No interfiere con la tabla ni con otros componentes | Modales |
| Registrar pago manual también en modal | Misma razón; el panel lateral empujaba y ocultaba la lista | Modales: título verbo + sustantivo, primario a la derecha, X para salir |
| Buscador de clientes a la izquierda de los filtros, también en el mapa | Buscar por nombre es la tarea más frecuente | Buscadores: estado activo notorio, ignorar acentos |
| Filtro por producto («Tienda en línea», «Menú digital»…) | Pedido del usuario | — |
| En el mapa se ocultan Desde/Hasta | El mapa siempre muestra 12 meses; aplicar el rango de noviembre dejaría una sola columna. Los totales del mapa suman 12 meses | — |
| Totales en fila encima de la tabla, con anillo de porcentaje, importe y mensualidades | Pedido del usuario: la columna lateral quitaba ancho a la tabla; el anillo reemplaza al texto «% del total» y a la barra | Gráficas: dato arriba; no depender solo del color |
| Las filas de la tabla se reparten la altura disponible | Pedido del usuario: la última fila quedaba cortada o sobraba un hueco | Consistencia; sin scroll de página |
| Título alineado con la barra lateral y pantalla a `100svh − 48` | Mismo ritmo visual en todas las pantallas; ver «Pantallas de lista» en `SISTEMA.md` | Consistencia |
| Se quitó «N mensualidades vencidas suman $ X en este periodo» del encabezado | Pedido del usuario; ya está en los totales | Jerarquía visual |
| Tablas paginadas (10/25/50, por defecto 10) con flechas de doble chevrón | Las listas crecen; «Ver más» no deja saber dónde estás | — |
| Pie de paginación siempre visible | Consistencia entre todas las tablas | Consistencia: mismo componente para la misma acción |
| Tablas pasan a tarjetas en contenedores angostos | Legibilidad en móvil sin scroll horizontal | Tipografía: tamaño mínimo legible |
| Formularios de cliente/aliado/producto/suscripción en panel lateral | Se ve la lista mientras se edita | Formularios: una columna, label arriba, ayuda siempre visible |
| Pantallas de vacío, carga y error para cada módulo | Diseñar también cuando algo sale mal | Documentación: pantallas de error; Carga: skeleton del mismo tamaño |
| Estado vacío: una sola acción principal | Guiar al siguiente paso | Estados vacíos |
| Cancelar suscripción: botón en rojo, separado, al final | Acción destructiva aparte | Botones: aparta la acción destructiva |

## Pendientes y deuda conocida
- **Cancelar suscripción** usa el panel lateral; por consistencia con los modales de confirmación (`principios/modales.md`) debería ser modal.
- El **pie de paginación**, el **botón de filtros** y el **modal de filtros** no están todavía en el artboard «Sistema y componentes».
- La búsqueda del prototipo usa `onChange`; en código, aplicar **debounce** (`principios/buscadores.md`) y sugerencias si se quiere.
- «Quitar filtros» del modal no borra la búsqueda; solo lo hace el botón del resultado vacío. Decidir si debe borrarla.
- El historial de cambios solo está con datos en una suscripción de ejemplo.
- Se adoptó shadcn/ui con Radix (ver `SISTEMA.md`, «Implementación»): resuelve la trampa de foco y el retorno del foco, y «Cancelar» va antes que el botón principal en el DOM.
