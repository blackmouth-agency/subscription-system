# Pantalla: Inicio de sesión

Artboards: `LoginClaro`, `MovilLogin`, `EstadosLogin` (y el estado inicial de `Main`). Ver `LINKS.md`.

## Componentes
Template Login · Marca BlackMouth · Campo de formulario ×2 · Botón primario · Enlace · Aviso de error · Botón de tema.

## Contenido
- Marca «BlackMouth» arriba a la izquierda y botón «Modo claro/oscuro» arriba a la derecha.
- Título «Suscripciones y cobros» (48/52, 36/40 en móvil) y «Portal interno de BlackMouth. Solo administradores.».
- Tarjeta de 480 px: Correo, Contraseña, botón «Iniciar sesión», enlace «¿Olvidaste tu contraseña?».
- Fondo: malla en perspectiva con una ruta de nodos (decorativo, `aria-hidden`); la ruta tiene un nodo óxido (vencida) y termina en un nodo azul (hoy).

## Comportamiento
- «Iniciar sesión» → estado ocupado (~700 ms) → va a Cobros.
- Error de credenciales: aviso arriba del formulario «Correo o contraseña incorrectos.» (`role="alert"`) y los dos campos con `aria-invalid`.
- Carga: botón deshabilitado con `aria-busy`.
- Móvil: sin malla de fondo grande; formulario a ancho completo con padding 16.

## Estados
datos · carga · error (en `EstadosLogin`). No tiene vacío.

## Verificar (de `principios/`)
¿Label arriba y fijo? ¿Un solo botón primario? ¿El error dice qué pasó sin culpar? ¿Foco visible en los campos? ¿Contraste del texto tenue ≥ 4.5:1?
