# Pantalla: Clientes

Artboards: `Clientes` (editar), `ClientesClaro` (crear con errores), `MovilClientes`, `EstadosClientes`. Ver `LINKS.md`.

## Componentes
Template Admin · Buscador con contador · Tabla paginada · Insignia · Panel lateral (formulario) · Campo de formulario.

## Estructura
- Título «Clientes»; línea «N clientes, M con mensualidades vencidas.»; botón primario «Nuevo cliente».
- Tarjeta: buscador (nombre, contacto, correo o teléfono; ignora acentos) y a la derecha el contador «x de N».
- Tabla: Cliente (nombre + contacto) · Contacto (correo + teléfono, tenue) · Al mes (suma de sus activas + «N activas») · Pagos (insignia Vencida o «Al día») · Acciones («Editar»). Paginada. La fila en edición queda seleccionada.
- Sin coincidencias: «Ningún cliente coincide» + «No encontramos «x». Prueba con otro nombre, contacto o correo.».

## Formulario (panel lateral, título «Nuevo cliente» / «Editar cliente»)
Nombre o razón social · Contacto · Correo (tipo email) · Teléfono / WhatsApp (tipo tel). Texto: «Datos de contacto para cobros y avisos.». Botones «Crear cliente»/«Guardar cliente» y «Cancelar». Validar al salir del campo: «Escribe el nombre.», «El correo no es válido.». Resultado: «Creamos el cliente.» / «Guardamos los cambios.».

## Estados
datos · vacío («Todavía no hay clientes. Crea el primero para poder asignarle una suscripción.» → «Nuevo cliente») · carga · error («No pudimos cargar los clientes»).

## Verificar
¿Una sola columna en el formulario? ¿Label arriba y fijo? ¿El error aparece junto al campo y con `role="alert"`? ¿Campo activo marcado? ¿Dos apellidos/razón social caben (diseñar con texto real)?
