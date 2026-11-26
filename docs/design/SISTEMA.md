# Sistema visual

Cinco colores, dos letras y un nodo. Todo lo demás (texto tenue, líneas, realces, tintes) sale de mezclar esos cinco. Nada de valores sueltos: solo tokens.

## Colores (claro / oscuro)
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `fondo` | #f4f4f4 | #0a0a0a | Fondo de la app |
| `superficie` | #ffffff | #161616 | Tarjetas, inputs, modales |
| `tinta` | #0d0d0d | #f5f5f5 | Texto, botón primario, estado «pagada» |
| `azul` | #0a45e6 | #7aa5ff | Acento único: foco, activo, «pendiente», insignias |
| `oxido` | #b0380f | #ff9469 | Error, «vencida», acción destructiva |

Derivados (mezclas con `color-mix` o equivalentes en Tailwind con opacidad):
- `tenue` = tinta 68 % sobre superficie (texto secundario; mínimo 4.5:1).
- `borde` = #8a8a8a claro / #707070 oscuro (bordes de controles; mínimo 3:1).
- `linea` = tinta 10 % sobre superficie (divisores).
- `realce` = tinta 8 % sobre superficie (hover, chip inactivo, botón secundario).
- `azul-tinte`, `oxido-tinte` = acento 13 % sobre superficie (fondo de insignias y avisos).
- `hecho` = tinta 72 % sobre superficie (nodo pagado, barra de pagadas).
- Chip activo y paginación activa: tinta 14 % sobre superficie.

Modo claro/oscuro: mismo árbol, dos paletas (`data-tema` o clase `dark`). Hay botón «Modo claro/oscuro» en la barra lateral y arriba a la derecha en el login.

## Tipografía
- **Inter** 400, 500 y 600 (solo dos pesos en uso por pantalla: 400/500; 600 para títulos).
- **Geist Mono** para toda cifra (importes, fechas, conteos): clase `num`, 0.94 em, letter-spacing −0.02 em.
- Escala corta: título de pantalla 24/30 · 600 · −0.02 em; título de tarjeta 15/20 · 600; título de panel/modal 18/24 · 600; texto y celdas 14/20; pequeño 12–13 (mínimo 12). Cifra grande de totales 24/32 (la primera, 32/40). Login: título 48/52 (36/40 en móvil).

## Espaciado, radios, sombras
- Rejilla de 4; gaps habituales 4, 8, 12, 16, 20, 24. Contenido: máx. 1360 px, padding 28 (16 en móvil). Barra lateral 232 px. Panel lateral 384 px. Modal 480 px.
- Radios: tarjeta/modal 14 · botón/input 10 · botón chico 8 · chip 9 · insignia 7 · nodo 2.
- Sombra solo en modal: `0 16px 48px` negro 40 %. Menús desplegables: sombra suave. Fondo del modal: `fondo` 74 % de opacidad.

## Breakpoints (container queries sobre la app, no sobre la ventana)
- ≤ 1180 px: el panel lateral deja de acoplarse y pasa a ocupar el contenido.
- ≤ 860 px: barra superior con «Menú»; la lateral se oculta; controles de 44 px; inputs a 16 px.
- ≤ 640 px: totales apilados; historial en vertical.
- Tablas con contenedor ≤ 600 px pasan a tarjetas (cada fila = tarjeta con etiquetas por celda).

## Átomos
- **Botón**: variantes `primario` (fondo tinta, texto fondo), `secundario` (realce), `texto` (ghost), `peligro` (borde y texto óxido). Tamaño normal 38 px, `chico` 32 px; 44 px en móvil. Estados: hover, disabled, `aria-busy` (cuadrado que gira).
- **Enlace**: subrayado con `borde`, 500.
- **Input / select / textarea** (`entrada`): 40 px, borde `borde`, radio 10. `aria-invalid` → borde y 1 px interior óxido. Disabled: sin borde, fondo realce.
- **Casilla**: 18 px, `accent-color` tinta.
- **Insignia**: 24 px, ícono-forma + texto. activa/activo (relleno, azul), pendiente (borde, azul), vencida (relleno, óxido), pausada (dos barras), cancelada/inactivo (línea, tenue), pagada.
- **Nodo**: 10 px (14 en gráficas); `pagada` relleno hecho · `pendiente` borde azul y fondo superficie · `vencida` relleno óxido · `nada` punto de 4 px.
- **Hueso (skeleton)**: bloque realce de 14 px, radio 4, con brillo suave.
- **Aviso**: bloque realce (o óxido-tinte si es error), radio 10.

## Moléculas
- **Campo de formulario**: label arriba y fijo (500) + control + ayuda (13, tenue) o error (13, óxido), 6 px de gap. Validar al salir del campo.
- **Buscador**: input con lupa a la izquierda (tenue; azul al enfocar), borde azul al enfocar, botón de borrar (X) cuando hay texto. Ancho 360 px (100 % en móvil). Ignora acentos y mayúsculas.
- **Chip de filtro**: botón de 34 px con conteo mono; activo = fondo tinta 14 % + texto tinta 500 (no solo color).
- **Botón de filtros**: solo ícono de ajustes (sin texto), `aria-label` «Filtros, N aplicados»; insignia circular azul con el número en la esquina superior derecha cuando N > 0.
- **Recorrido**: 12 nodos en fila unidos por una línea.
- **Mensualidades que cubre**: lista de botones (`aria-pressed`) con nodo, mes y monto; elige de la más antigua a la más nueva.
- **Lista de datos** (`dl`): término tenue a la izquierda, dato a la derecha.
- **Paginación**: ver abajo.

## Organismos
- **Totales** (Cobrado · Pendiente · Vencido): tres columnas (1.25fr 1fr 1fr); cifra mono grande, texto «N mensualidades · P % del total» y barra fina proporcional (6 px) con el color del estado.
- **Barra de herramientas de tarjeta**: `[vista/chips]  …  [buscador][ícono filtros]` en una fila de mínimo 60 px.
- **Tabla**: columnas con identidad (enlace + subtítulo), recorrido, cifra (derecha, mono), texto, insignia, acciones (texto chico). Fila alta 54 px; hover y fila seleccionada con realce. Primera columna con padding 20.
- **Pie de paginación**: «Mostrando 1–10 de 24» (mono) · «Filas por página» con 10/25/50 (por defecto 10) · botones ««» «»», números y puntos suspensivos. Página actual con borde de 1.5 px en tinta. Flechas son íconos de doble chevrón con `aria-label` «Página anterior/siguiente»; deshabilitadas en los extremos. Si hay una sola página el pie igual se muestra. En móvil solo se ve la página actual entre las flechas. La página vuelve a 1 al buscar, filtrar o cambiar el tamaño.
- **Mapa de cobros**: tabla suscripción × 12 meses, cada celda es un botón con nodo y `aria-label` «Mes año: estado».
- **Trayecto** (detalle): gráfica de 12 meses con tres niveles (pagada/pendiente/vencida), línea que se vuelve óxido y más gruesa en el tramo vencido; marca el mes actual.
- **Historial**: línea de tiempo con campo, antes (tachado) → ahora, fecha y autor.
- **Estado vacío**: dibujo de malla de 240×96 con nodos huecos y una mira azul, título, explicación y una sola acción principal.
- **Estado de error**: mismo dibujo con la vía rota en óxido, título, «Revisa tu conexión. No se perdió ningún dato.» y botón de reintentar.
- **Panel lateral** (formularios de cliente, aliado, producto, suscripción): 384 px, acoplado a la derecha de la lista; en ≤ 1180 px ocupa el contenido.
- **Modal** (registrar pago, filtros): sobre un fondo oscurecido que cubre toda la app, 480 px, título verbo + sustantivo, X arriba a la derecha, cierra con X, clic en el fondo o Escape; botón principal a la derecha, «Cancelar»/«Quitar filtros» a la izquierda. No empuja ni oculta la pantalla de abajo.

## Templates
- **Admin con barra lateral**: marca BlackMouth + «Suscripciones», navegación (Cobros con alerta «N vencidas», Suscripciones, Clientes, Aliados, Productos), correo de quien entró, botones de tema y «Cerrar sesión». Contenido: título + acciones, aviso de resultado, cuerpo.
- **Login**: formulario centrado de 480 px sobre una malla decorativa.
- **Lista + panel**: tabla y panel lateral a la vez.

## Pantallas de lista (Cobros es la referencia)
Aplican a Cobros, Suscripciones, Clientes, Aliados y Productos.
- **Alineación con la barra lateral:** el título mide 32 px y el hueco es 12 px, igual que logo y nav. En escritorio la pantalla ocupa `100svh − 48` (el relleno de `.marco`); la tarjeta absorbe lo que sobra y la página no hace scroll. En móvil crece.
- **Orden:** título + acción primaria · aviso · totales (si hay) · tarjeta principal.
- **Totales:** tres tarjetas en fila, encima de la tabla (en móvil, apiladas). Cada una: anillo con el porcentaje (56 px), línea divisoria, nombre, importe y «N mensualidades». El color del anillo es el del estado.
- **Barra de la tarjeta:** buscador a la izquierda, botón de filtros con insignia y, a la derecha, el selector de vista.
- **Filas ajustadas:** `useFitRows` calcula cuántas filas caben y reparte la altura sobrante entre ellas (`--row-h`, aplicado con `[&_tr]:h-(--row-h)` en el `TableBody`), para que ninguna quede cortada ni sobre un hueco. El tamaño de página sale de ahí; en móvil se elige.
- **Pie:** paginación siempre visible, con la leyenda propia de la pantalla.

## Accesibilidad (obligatoria)
Texto ≥ 4.5:1 (también el tenue), bordes de controles ≥ 3:1, áreas táctiles ≥ 44 px en móvil, `button`/`a`/`input`+`label` reales, anillo de foco 2 px azul con offset 2, `aria-current` en navegación, estados nunca solo por color, `prefers-reduced-motion` sin animaciones. La trampa de foco y el retorno del foco en modales los da el Dialog de Radix.

## Implementación (shadcn/ui + Radix)
- Los átomos viven en `apps/portal/src/components/ui/` (código de shadcn/ui con primitivas de Radix, estilo `radix-nova` ajustado a este sistema). Se añaden con `npx shadcn@latest add <componente>` desde `apps/portal` y se adaptan después: nada de colores o radios sueltos.
- Los tokens de este documento siguen siendo la fuente. `design/design.css` los mapea a los nombres de shadcn: `background` = fondo, `card`/`popover` = superficie, `foreground`/`primary` = tinta, `ring` = azul, `destructive` = óxido, `muted`/`secondary` = realce, `muted-foreground` = tenue, `border` = línea, `input` = borde.
- `Select` es `NativeSelect` (select nativo): en móvil abre el selector del sistema y funciona con `register` de React Hook Form.
- `cn` (paquete `cn`) no conoce las clases de tamaño de texto propias (`text-minimo`, `text-pequeno`, `text-texto`): dentro de `cn()` junto a otra clase `text-*` las descarta. En `components/ui` usa `text-xs`, `text-sm` o `text-[13px]/5`.
- En `components/ui`, el móvil se resuelve con las variantes `movil:` (≤ 860 px) y `compacto:` (≤ 640 px) sobre la ventana, porque el Dialog va en un portal fuera del contenedor `@container/app`. Los organismos de `design/` siguen con container queries.
- Átomos propios sin equivalente en shadcn: `Node` y `Link` (`design/atoms/`).
