# Testing en `players_scrib`

Este repo tiene dos capas de tests:

1. Unit tests de logica frontend compartida.
2. End-to-end multirol contra `server_scrib`.

La automatizacion E2E vive en `e2e/runner/index.js` y siempre sirve el frontend desde el checkout local actual de `players_scrib`. No se hace copia del cliente.

## Scripts

- `npm run test:unit`
  Ejecuta los unit tests de `tests/**/*.test.js`.
- `npm run test:e2e`
  Ejecuta la suite `full`.
- `npm run test:e2e:headed`
  Igual que la anterior, pero con navegador visible.
- `npm run test:e2e:smoke`
  Ejecuta solo la bateria rapida de humo.
- `npm run test:e2e:server-local`
  Ejecuta la suite `full` usando `../server_scrib` local en vez de una copia fresca remota.
- `npm run test:e2e:chaos`
  Ejecuta la suite de reconexiones y carreras contra servidor local.
- `npm run test:e2e:visual`
  Ejecuta la suite de regresion visual.
- `npm run test:e2e:visual:update`
  Regenera los baselines visuales de `e2e/visual-baselines`.

## Unit tests actuales

Archivo: `tests/frase-final-utils.test.js`

Cubre la utilidad compartida `game/js/frase-final-utils.js`:

- normalizacion de comillas y guillemets en la frase final
- normalizacion a minusculas del texto objetivo
- deteccion de frase final completada solo cuando aparece al final del texto

## End-to-end actuales

Los specs estan en `e2e/specs/index.js`.

### Suite `smoke`

Se usa para feedback rapido y no depende de hooks de test del servidor.

- `roles-connect`
  Abre `control`, `writer1`, `writer2`, `spectator`, `musa1`, `musa2`, `actor1` y `actor2`, y valida que cada rol arranca y conecta.
- `game-start-and-write`
  Arranca partida desde `control`, valida escritura en ambas escritoras y propagacion del texto a actores.

### Suite `full`

Actualmente ejecuta 21 specs: `2 smoke + 19 core`.

Es la suite por defecto.

- `mode-transitions-core`
  Cambios entre `letra bendita`, `letra prohibida`, `tertulia`, `palabras bonus`, `palabras prohibidas` y `frase final`.
- `musa-flow-core`
  Flujo musa -> servidor -> escritora y espectador en niveles de letras y palabras.
- `words-levels-queue-and-time-core`
  Cola, entrega y efecto de tiempo en `palabras bonus` y `palabras prohibidas`.
- `letters-protection-and-delivery-core`
  Entrega de musa en modos de letras, suma y resta de tiempo y bloqueo de letra prohibida.
- `spectator-inspiration-bar-core`
  Comprueba que la barra de inspiracion del espectador se mueve al usar palabras de musas y se resetea al 50 por ciento al cambiar de nivel.
- `final-phrase-core`
  Activacion y visibilidad de `frase final`.
- `tutorial-core`
  Vista tutorial, solicitudes de calentamiento, recepcion de palabras y seleccion por escritoras.
- `actors-see-text`
  Sincronizacion de texto y tira de modo en actores.
- `pause-and-tertulia-resume-core`
  Bloqueo de escritura en `tertulia`, `saltar_tertulia` desde control y resincronizacion con actores.
- `resurrection-core`
  Resurreccion basica de ambas escritoras, rechazo de resurreccion y reapertura tras cambio de modo.
- `vote-core`
  Apertura y cierre de votacion y bloqueo de voto duplicado.
- `disadvantages-application-core`
  Comprueba que cada desventaja se aplica a la escritora correcta y que el espectador refleja el efecto en el lado correcto.
- `flag-hearts-core`
  Banderas de musas y corazones en escritora y espectador.
- `teleprompter-core`
  Carga de texto, `ack`, play/pause, tamano, velocidad y scroll.
- `full-match-no-hooks`
  Flujo real corto sin forzar hooks para la progresion principal de modos.
- `reconnect-writer-mid-level`
  Desconexion y reconexion de escritora durante un nivel.
- `reconnect-spectator-recovers-state`
  Reconexion de espectador recuperando textos y modo.
- `resurrection-matrix`
  Casos `solo-j1`, `solo-j2`, `ambas` y `ninguna`.
- `vote-race-and-tie`
  Voto simultaneo de dos musas, empate y bloqueo de doble voto.

### Suite `visual`

No depende de hooks de test. Compara screenshots contra `e2e/visual-baselines`.

- `spectator-layout-visual`
  Layout principal del espectador.
- `teleprompter-visual`
  Overlay del teleprompter.

### Suite `chaos`

Depende de hooks de test del servidor y estresa reconexiones y cambios rapidos.

- `control-reconnect-chaos`
  Caida y vuelta de `control` durante partida.
- `musa-reconnect-mid-vote-chaos`
  Caida y vuelta de musa en mitad de una votacion.
- `musa-world-entry-start-chaos`
  Valida que la intro visual de `musa` se invalida al empezar la partida y no deja clases ni callbacks viejos.
- `musa-countdown-reset-chaos`
  Valida que el countdown local de `musa` no revive despues de un `reset`.
- `musa-disadvantage-mode-churn-chaos`
  Valida que una desventaja visual en `musa` no deja clases ni timeouts viejos al cambiar de modo.
- `musa-warmup-feedback-churn-chaos`
  Valida que el tutorial de `musa` limpia feedback, cooldown y animaciones pendientes al ocultarse.
- `spectator-disadvantage-mode-churn-chaos`
  Valida que una desventaja visual no deja timeouts viejos ni clases colgadas en espectador al cambiar de modo.
- `spectator-countdown-reset-chaos`
  Valida que el countdown local de `spectator` no revive despues de un `reset`.
- `actor-countdown-reset-chaos`
  Valida que el countdown local del actor no revive despues de un `reset`.
- `control-countdown-reset-chaos`
  Valida que el countdown local de `control` no revive despues de `limpiar`.
- `control-teleprompter-ack-cancel-chaos`
  Valida que cerrar el teleprompter antes del `ack timeout` limpia la espera y no deja mensajes de error viejos.
- `control-teleprompter-hold-close-chaos`
  Valida que los botones de `hold` del teleprompter se paran al cerrar el panel y que pueden reutilizarse al reabrir.
- `rapid-mode-churn-chaos`
  Secuencia rapida de cambios de modo y comprobacion de que actores y espectador siguen coherentes.

## Como se levanta `server_scrib` durante E2E

- Por defecto, el runner usa una copia fresca de `server_scrib` en `.e2e-cache/server_scrib-master`.
- En cada ejecucion hace `fetch` + `reset --hard` a `origin/master` en esa copia temporal.
- Si cambia `package-lock.json`, rehace `npm ci`.
- Si quieres probar contra tu checkout local de `server_scrib`, usa `npm run test:e2e:server-local`.

## Hooks de test y suites que los necesitan

- `smoke`: no necesita hooks.
- `visual`: no necesita hooks.
- `full`: si necesita hooks para casi todos los specs `core`.
- `chaos`: si necesita hooks.

Si `server_scrib/master` no expone `scrib_test:get_state`, la suite `full` remota falla en local y en CI se omite tras el `preflight`.

## Artifacts y ficheros utiles

- `.e2e-artifacts/latest-run-summary.json`
  Resumen del ultimo run E2E.
- `.e2e-artifacts/`
  Screenshots, logs y dumps de estado al fallar.
- `e2e/visual-baselines/`
  Baselines visuales versionados.

## CI actual

Workflows en `.github/workflows`:

- `e2e-smoke.yml`
  Corre en `push`, `pull_request` y manual. Ejecuta unit tests + `test:e2e:smoke`.
- `e2e-full.yml`
  Corre nightly, en ramas `release/**` y manual. Tiene:
  - `preflight` para comprobar si `server_scrib/master` expone hooks.
  - job `visual`.
  - job `full` solo si los hooks estan disponibles.
- `e2e-visual.yml`
  Workflow manual para lanzar solo la suite visual.

## Relacion con `server_scrib`

La documentacion del lado servidor esta en `../server_scrib/TESTING.md`.
