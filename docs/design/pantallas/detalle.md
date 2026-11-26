# Pantalla: Detalle de suscripción

Artboards: `Detalle`, `DetalleClaro`, `MovilDetalle`, `EstadosDetalle`. Se llega desde Cobros, Suscripciones y el mapa. En la navegación queda activo «Suscripciones». Ver `LINKS.md`.

## Componentes
Template Admin · Insignia de estado · Trayecto (gráfica de 12 meses) · Tabla de mensualidades · Lista de datos · Historial · Modal/panel de pago y de cancelación.

## Estructura
- Enlace «Volver a suscripciones» (tenue). Título = nombre del cliente + insignia de estado. Línea: «<Producto>. Debe $ X de N mensualidades vencidas.» o «<Producto>. Al día.».
- Botones según estado (de izquierda a derecha, el destructivo aparte): activa → «Pausar»; pausada → «Reactivar»; no cancelada → «Cancelar suscripción» (peligro); con deuda → «Registrar pago manual» (primario).
- Cuerpo en dos columnas (la segunda de 320 px):
  - **Mensualidades**: resumen «N pagadas de M», trayecto de 12 meses (tres niveles: pagada, pendiente, vencida; línea que se vuelve óxido en el tramo vencido; mes actual marcado), y tabla con las últimas 7 (Vence · Pagada · Monto · Estado) y pie «7 de N mensualidades».
  - **Historial de cambios**: línea de tiempo con campo, antes (tachado) → ahora, y «fecha, hora por correo».
  - **Cliente**: Contacto, Correo, Teléfono + «Editar cliente».
  - **Condiciones**: Producto, Precio («$ X al mes»), Ciclo («Día N»), Aliado (o «Venta directa»), Comisión y Duración (si hay aliado), Recibe el pago + «Editar».

## Comportamiento
- Pausar/Reactivar cambian el estado y muestran aviso («Pausamos/Reactivamos la suscripción.»).
- Cancelar abre una confirmación: «Cancelar suscripción — <Cliente · Producto>. No se generan más mensualidades y no se puede reactivar.». Botón peligro «Cancelar suscripción» y «Volver». Hoy usa el panel lateral; ver pendiente en `DECISIONES.md`.
- Una suscripción cancelada no muestra acciones.

## Estados
datos · vacío (sin mensualidades: «Aún sin mensualidades») · carga (skeletons por tarjeta) · error («No pudimos cargar la suscripción»).

## Verificar
¿La acción destructiva está separada? ¿El botón repite el verbo en la confirmación? ¿El trayecto se entiende sin color? ¿El cuerpo de la confirmación dice solo lo que no se sabe?
