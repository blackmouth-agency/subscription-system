# Pantalla: Aliados

Artboards: `Aliados` (editar), `EstadosAliados`. Ver `LINKS.md`.

## Componentes
Template Admin · Tabla paginada · Insignia · Panel lateral (formulario) · Casilla.

## Estructura
- Título «Aliados»; línea «N activos. Sus comisiones en suscripciones activas suman $ X.»; botón primario «Nuevo aliado».
- Tabla (sin buscador ni filtros, de momento): Aliado (nombre + contacto) · Contacto (correo + teléfono) · Cuenta receptora · Comisión (suma + «N activas») · Estado (Activo/Inactivo) · Acciones («Editar»). Paginada.

## Formulario (panel lateral «Nuevo aliado» / «Editar aliado»)
Nombre o razón social · Contacto · Correo · Teléfono / WhatsApp · Cuenta receptora (ayuda «Banco, tipo y últimos dígitos.») · casilla «Activo: se puede asignar a suscripciones». Texto: «Vende contigo y recibe una comisión.». Botones «Crear aliado»/«Guardar aliado».

## Estados
datos · vacío («Todavía no hay aliados. Regístralos si venden contigo o si reciben el pago del cliente.») · carga · error («No pudimos cargar los aliados»).

## Verificar
¿Estado distinguible sin color? ¿La ayuda de la cuenta está siempre visible? ¿La casilla tiene label clicable?
