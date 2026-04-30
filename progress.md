Original prompt: Arregla players_scrib, la versión para dos jugadores, en el rol de escritores, cuando voy a entrar se realentiza un montón y no termina de carga, puede que haya un bucle infinito o algo. Investiga y soluciona

- 2026-03-27: Inicio investigación sobre game/players (2 jugadores, rol escritor).
- Hipótesis iniciales: bucle de resize/layout, observadores sobre el editor o listeners duplicados en carga.
- 2026-03-27: Reproducido el cuelgue en Playwright al abrir `game/players/index.html?player=1`; `page.evaluate()` quedaba bloqueado tras `commit`.
- 2026-03-27: Aislado el problema a `observador_cursor_pluma_juego_escritora`; observar `#texto` en `class/style` reactivaba el propio sincronizador y generaba una tormenta de mutaciones.
- 2026-03-27: Corregido en `game/players/js/socket-events.js` para observar solo `contenteditable` en `#texto`.
- 2026-03-27: Verificado con Playwright en `player=1` y `player=2`; `readyState` pasa a `complete` y las capturas muestran la pantalla de atributos cargada sin bloqueo.
