Original prompt: Arregla players_scrib, la versión para dos jugadores, en el rol de escritores, cuando voy a entrar se realentiza un montón y no termina de carga, puede que haya un bucle infinito o algo. Investiga y soluciona

- 2026-03-27: Inicio investigación sobre game/players (2 jugadores, rol escritor).
- Hipótesis iniciales: bucle de resize/layout, observadores sobre el editor o listeners duplicados en carga.
- 2026-03-27: Reproducido el cuelgue en Playwright al abrir `game/players/index.html?player=1`; `page.evaluate()` quedaba bloqueado tras `commit`.
- 2026-03-27: Aislado el problema a `observador_cursor_pluma_juego_escritora`; observar `#texto` en `class/style` reactivaba el propio sincronizador y generaba una tormenta de mutaciones.
- 2026-03-27: Corregido en `game/players/js/jugador-servidor.js` para observar solo `contenteditable` en `#texto`.
- 2026-03-27: Verificado con Playwright en `player=1` y `player=2`; `readyState` pasa a `complete` y las capturas muestran la pantalla de atributos cargada sin bloqueo.
- 2026-04-09: Ajuste en `game/css/dashboard-players.css` para la vista `game/spectator/`.
- Problema observado: el layout del espectador no aprovechaba la altura del viewport; la cabecera y los dos laterales quedaban comprimidos arriba y sobraba demasiado vacío abajo.
- Cambio aplicado: `#spectator_fit_root` pasa a grid de alto completo, `#contenedor_espectador` usa dos columnas reales sin márgenes heredados, cada jugadora se organiza en columna flexible y el bloque del marcador se empuja al fondo con `margin-top: auto`.
- 2026-04-09: Ajuste adicional en `game/spectator/js/jugador-servidor.js` para que el auto-fit mida el tamaño visible real de la vista y no el `scrollHeight` inflado; eso eliminó el escalado artificial que reducía toda la pantalla del espectador.
- 2026-04-09: Validado en local con Playwright usando `http://127.0.0.1:4173/game/spectator/`; el auto-fit queda en `scale(1)` y la vista ya llena el viewport sin errores nuevos de consola.
