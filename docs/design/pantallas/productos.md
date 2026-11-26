# Pantalla: Productos

Artboards: `Productos` (crear), `EstadosProductos`. Ver `LINKS.md`.

## Componentes
Template Admin · Tabla paginada · Panel lateral (formulario) · Campo numérico.

## Estructura
- Título «Productos»; línea «Precio de catálogo. Las suscripciones vigentes conservan el suyo.»; botón primario «Nuevo producto».
- Tabla: Producto (nombre + descripción) · Suscripciones activas (derecha, mono) · Precio mensual (derecha, mono). Sin acción de editar. Paginada.

## Formulario (panel lateral «Nuevo producto»)
Nombre · Descripción (área de texto) · Precio mensual (COP) (teclado numérico). Texto: «El precio aplica solo a suscripciones nuevas.». Botón «Crear producto». Errores: «Escribe el nombre.», «El precio debe ser mayor a 0.».

## Estados
datos · vacío («El catálogo está vacío. Crea un producto con su precio mensual para vender la primera suscripción.» → «Nuevo producto») · carga · error («No pudimos cargar los productos»).

## Verificar
¿El importe está alineado a la derecha y en mono? ¿Teclado numérico? ¿El texto avisa que el precio no cambia las suscripciones vigentes?
