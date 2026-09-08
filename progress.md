Original prompt: Arregla players_scrib, la versión para dos jugadores, en el rol de escritores, cuando voy a entrar se realentiza un montón y no termina de carga, puede que haya un bucle infinito o algo. Investiga y soluciona

- 2026-03-27: Inicio investigación sobre game/players (2 jugadores, rol escritor).
- Hipótesis iniciales: bucle de resize/layout, observadores sobre el editor o listeners duplicados en carga.
- 2026-03-27: Reproducido el cuelgue en Playwright al abrir `game/players/index.html?player=1`; `page.evaluate()` quedaba bloqueado tras `commit`.
- 2026-03-27: Aislado el problema a `observador_cursor_pluma_juego_escritora`; observar `#texto` en `class/style` reactivaba el propio sincronizador y generaba una tormenta de mutaciones.
- 2026-03-27: Corregido en `game/players/js/socket-events.js` para observar solo `contenteditable` en `#texto`.
- 2026-03-27: Verificado con Playwright en `player=1` y `player=2`; `readyState` pasa a `complete` y las capturas muestran la pantalla de atributos cargada sin bloqueo.

Current request (2026-09-08): añadir 30 segundos de calentamiento antes del primer nivel, reparar el logo del rol Control y suavizar en móvil las animaciones del onboarding y la elección de equipo.

- 2026-09-08: El servidor deja `modoActual` vacío durante la cuenta atrás y 30 segundos de escritura libre; nivel, competición y reloj arrancan al terminar el calentamiento.
- 2026-09-08: El logo de Control vuelve a mostrar la marca cuadrada completa, sin el escalado ni el recorte del contenedor anterior.
- 2026-09-08: El texto animado del onboarding usa `requestAnimationFrame`, cachea los caracteres y evita escrituras DOM cuando no cambia el fotograma visible.
- 2026-09-08: En dispositivos táctiles se eliminan filtros y sombras animadas de tarjetas completas, se suavizan los destellos por pasos y se promueven a composición los elementos animados.
- 2026-09-08: Pruebas de `players_scrib`: 236/236. Pruebas específicas de ciclo/simulador en `server_scrib`: 16/16. La suite global del servidor conserva 3 fallos previos y ajenos a este cambio en `deploy-keep-awake.test.js`, causados por `chmod --` en macOS.
- 2026-09-08: Playwright verificó Control a 1280×720 y el flujo de musas a 390×844 con tacto y CPU 4×; el muestreo mantuvo 73 frames en 1,2 s (media 16,52 ms, p95 16,8 ms). Los únicos errores de consola fueron rechazos de conexión esperados al servir el frontend sin Socket.IO.

Current request (2026-09-08): reparar la versión de un jugador publicada en scribshow.es.

- 2026-09-08: Reproducido en producción: el flujo llega al juego y carga al 100%, pero tras pulsar `ESCRIBIR` queda bloqueado en `¿PREPARADOS?` con el editor deshabilitado y sin errores de consola.
- 2026-09-08: El `match-runtime.js` publicado coincide byte a byte con el repo. La causa es que `inicio()` captura `revision_cuenta_atras_1p` antes de llamar a `limpieza()`; esta vuelve a incrementar la revisión y todos los callbacks de la cuenta atrás se descartan como obsoletos.
- 2026-09-08: Movida la captura de revisión inmediatamente después de `limpieza()` y actualizado el cache-buster de `match-runtime.js`; se añadió una regresión que fija ese orden.
- 2026-09-08: Verificado en navegador contra la versión local: desaparece la cuenta atrás, el editor pasa a `contenteditable=true`, arranca `LETRA BENDITA`, acepta `gato gris` y no aparecen errores de consola.
- 2026-09-08: Validación final local: 237/237 pruebas unitarias y E2E `one-player-start-and-write` superado.
- 2026-09-08: Netlify publicó el arreglo desde `master`. Repetido el flujo en `scribshow.es` con `match-runtime.js?v=20260908a`: cuenta atrás eliminada, editor editable, primer nivel activo y texto `un universo` aceptado sin errores de consola.
