const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("Control exposes exclusive deliberation, game result and jury result views", () => {
  const html = read("game/control/index.html");
  const actions = read("game/control/js/actions.js");
  const sockets = read("game/control/js/socket-events.js");
  const juego = html.slice(html.indexOf('id="control_panel_juego"'), html.indexOf('id="control_panel_representacion"'));
  const representacion = html.slice(html.indexOf('id="control_panel_representacion"'), html.indexOf('id="control_panel_deliberacion"'));
  const deliberacion = html.slice(html.indexOf('id="control_panel_deliberacion"'), html.indexOf('id="control_panel_final"'));

  assert.match(html, /data-control-tab="deliberacion"/);
  assert.match(html, /id="boton_vista_deliberacion"/);
  assert.match(html, /id="boton_resultado_videojuego"/);
  assert.match(juego, /id="resultado_videojuego_viewer_control"[\s\S]*id="boton_resultado_videojuego"[\s\S]*id="boton_descargar_textos"[\s\S]*id="puntuacion_nav_control"/);
  assert.doesNotMatch(representacion, /id="boton_descargar_textos"/);
  assert.doesNotMatch(deliberacion, /id="puntuacion_nav_control"/);
  assert.match(html, /id="boton_resultado_jurado"/);
  assert.match(html, /id="jurado_nav_control"/);
  assert.doesNotMatch(html, /id="jurado_nav_reset"/);
  assert.match(html, /id="jurado_nav_prev"[^>]*stats-nav-button--prev[^>]*aria-label="Resultado anterior"/);
  assert.match(html, /id="jurado_nav_next"[^>]*stats-nav-button--next[^>]*aria-label="Revelar siguiente resultado"/);
  assert.match(actions, /function mostrarVistaDeliberacion\(\)\s*\{\s*if \(vista_espectador_modo === "deliberacion"\)[\s\S]*return;[\s\S]*cambiar_vista_espectador\("deliberacion"\)/);
  assert.match(actions, /function mostrarResultadoVideojuego\(\)[\s\S]*mostrarPuntuacionFinal\(\)/);
  assert.match(actions, /function mostrarPuntuacionFinal\(\)[\s\S]*boton\.setAttribute\("aria-busy", "true"\)[\s\S]*socket\.emit\("mostrar_puntuacion_final"/);
  assert.match(actions, /function actualizarEstadoPuntuacionFinalControl\(payload = \{\}\)[\s\S]*actualizarBotonResultadoVideojuegoControl\(estado_puntuacion_final_control\?\.disponible === true\)/);
  assert.match(actions, /function mostrarResultadoJurado\(\)[\s\S]*mostrar_resultado_jurado/);
  assert.match(actions, /function navegarResultadoJurado\(direccion\)[\s\S]*jurado_resultado_(?:anterior|siguiente)/);
  assert.match(actions, /numeroSlide = puntuacion_slide_step_control \+ 1/);
  assert.match(actions, /totalSlides = PUNTUACION_PASO_MAX_CONTROL \+ 1/);
  assert.match(actions, /JURADO_TOTAL_SLIDES_CONTROL = JURADO_PASO_MAX_CONTROL \+ 2/);
  assert.match(actions, /etiqueta = "RESULTADO FINAL"[\s\S]*numeroSlide = JURADO_TOTAL_SLIDES_CONTROL/);
  assert.match(actions, /\$\{numeroSlide\}\/\$\{JURADO_TOTAL_SLIDES_CONTROL\}/);
  assert.match(actions, /vista_espectador_modo === "resultado_jurado" \|\| juradoEnResultadoFinal/);
  assert.match(actions, /jurado_slide_step_control >= JURADO_PASO_MAX_CONTROL[\s\S]*mostrar_resultado_final/);
  assert.match(actions, /function activar_temporizador_gigante\(\)[\s\S]*cambiar_vista_espectador_modo", \{ modo: "partida" \}/);
  assert.match(actions, /function mostrarCreditosEspectador\(\)[\s\S]*temporizador_gigante_detener/);
  assert.match(sockets, /socket\.on\('jurado_resultado_estado'/);
});

test("spectator and muses render both deliberation outcomes", () => {
  const spectatorHtml = read("game/spectator/index.html");
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorSockets = read("game/spectator/js/socket-events.js");
  const museHtml = read("game/public/players/index.html");
  const museState = read("game/public/players/js/state.js");
  const museSockets = read("game/public/players/js/socket-events.js");

  assert.match(spectatorHtml, /id="deliberacion_espectador"/);
  assert.match(spectatorHtml, /id="resultado_jurado_espectador"/);
  assert.match(spectatorHtml, /id="resultado_final_espectador"/);
  assert.match(spectatorHtml, /deliberacion-espectador__balanza"[^>]*>&#x2696;&#xFE0F;/);
  assert.doesNotMatch(spectatorHtml, /AN&Aacute;LISIS DE PARTIDA|PUNTUACI&Oacute;N OBJETIVA|INTRO &middot; 0\/7/);
  assert.match(spectatorState, /vista-deliberacion/);
  assert.match(spectatorState, /vista-resultado-jurado/);
  assert.match(spectatorState, /vista-resultado-final/);
  assert.doesNotMatch(spectatorState, /APARTADO \$\{paso\} DE \$\{estado\.criterios\.length\}/);
  assert.match(spectatorState, /resultado_jurado[\s\S]*pausarAudioDeliberacionEspectador\(deliberacion_audio_espectador, true\)[\s\S]*reproducirAudioDeliberacionSeguro\(deliberacion_latido_espectador, 1\)/);
  assert.match(spectatorState, /RESULTADO_FINAL_SUSPENSE_MS = 8000/);
  assert.match(spectatorState, /DELIBERACION_LATIDO_SUSPENSE = 1\.65/);
  assert.match(spectatorState, /siguiente === "resultado_final"[\s\S]*ajustarVelocidadLatidoDeliberacion\(DELIBERACION_LATIDO_SUSPENSE\)[\s\S]*reproducirAudioDeliberacionSeguro\(deliberacion_latido_espectador, 1\)/);
  assert.match(spectatorState, /!controlador_transicion_vista_espectador \|\| modo === "resultado_final"/);
  assert.match(spectatorState, /modo === "resultado_final"\) controlador_transicion_vista_espectador\?\.cancel\(\)/);
  assert.match(spectatorState, /confetti_aux\(\{ persistente: true, silencioso: true \}\)/);
  assert.match(spectatorState, /modoPrevio === "resultado_jurado" \|\| modoPrevio === "resultado_final"/);
  assert.match(spectatorSockets, /persistente \? 18/);
  assert.match(spectatorState, /DELIBERACION_VICTORIA_INICIO_SEGUNDOS = 22\.5/);
  assert.match(spectatorState, /firma === puntuacion_firma_render_espectador[\s\S]*return/);
  assert.match(spectatorSockets, /pedir_jurado_resultado/);
  assert.match(museHtml, /id="deliberacion_musa"/);
  assert.match(museHtml, /id="resultado_videojuego_musa"/);
  assert.match(museHtml, /id="resultado_jurado_musa"/);
  assert.match(museHtml, /id="resultado_final_musa"/);
  assert.match(museState, /function sincronizarVistaDeliberacionMusa\(opciones = \{\}\)/);
  assert.match(museState, /is-local-winner/);
  assert.match(museState, /is-local-loser/);
  assert.doesNotMatch(museState, /DECISI&Oacute;N REVELADA|<small>APARTADO \$\{paso\}<\/small>/);
  assert.match(museState, /confetti_aux\(\{ persistente: true \}\)/);
  assert.match(museState, /modoAnterior === "resultado_jurado" \|\| modoAnterior === "resultado_final"/);
  assert.match(museState, /resultado-musa__trofeo/);
  assert.match(spectatorState, /resultado-final-trofeo/);
  assert.match(spectatorState, /&#x1F3AE;<\/span> VIDEOJUEGO/);
  assert.match(spectatorState, /&#x2696;&#xFE0F;<\/span> JURADO/);
  assert.match(museSockets, /persistente \? 14/);
  assert.match(museState, /RESULTADO_FINAL_SUSPENSE_MUSA_MS = 8000/);
  assert.match(museState, /is-final-celebrating/);
  assert.match(museState, /vista_modo_remota_musa !== "resultado_final"\) \{\s*animarTransicionVistaMusa/);
  assert.match(museSockets, /puntuacion_final_estado/);
  assert.match(museSockets, /jurado_resultado_estado/);
  assert.match(museSockets, /resultado_final_estado/);
  assert.match(spectatorState, /puntuacion-desglose-puntos--azul"><b>[\s\S]*<small>PTS<\/small>/);
});

test("Jury controls the live two-bar reveal while spectator and muses mirror it", () => {
  const html = read("game/jurado/index.html");
  const state = read("game/jurado/js/state.js");
  const sockets = read("game/jurado/js/socket-events.js");
  const spectatorState = read("game/spectator/js/state.js");
  const museState = read("game/public/players/js/state.js");

  assert.match(html, /id="jurado_revelacion"/);
  assert.equal((html.match(/id="jurado_revelacion_valor_[12]"/g) || []).length, 2);
  assert.equal((html.match(/TU NOTA:/g) || []).length, 2);
  assert.match(html, /id="jurado_revelacion_confirmar"/);
  assert.equal((html.match(/jury-live-score__reference-lane/g) || []).length, 2);
  assert.doesNotMatch(html, /LAS BARRAS EMPIEZAN EN CERO/);
  assert.match(state, /jurado_revelacion_actualizar/);
  assert.match(state, /jurado_revelacion_confirmar/);
  assert.match(state, /indiceCrudo === null \|\| indiceCrudo === undefined/);
  assert.match(state, /criterio\.referencias/);
  assert.doesNotMatch(state, /MUEVE LAS BARRAS EN DIRECTO/);
  assert.match(sockets, /socket\.on\("vista_espectador_modo"/);
  assert.match(sockets, /socket\.on\("jurado_resultado_estado"/);
  assert.match(spectatorState, /resultado-jurado-score/);
  assert.match(spectatorState, /EL JURADO EST&Aacute; AJUSTANDO LAS PUNTUACIONES/);
  assert.match(museState, /resultado-musa__jury-score/);
  assert.match(museState, /EL JURADO EST&Aacute; PUNTUANDO/);
});

test("Jury summary stays neutral and uses value-aware x/10 score markers", () => {
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorCss = read("game/css/dashboard-players.css");
  const museState = read("game/public/players/js/state.js");
  const museCss = read("game/public/players/css/publico.css");
  const spectatorJury = spectatorState.slice(
    spectatorState.indexOf("const marcadorPuntuacionJuradoEspectador"),
    spectatorState.indexOf("const actualizarResultadoJuradoEspectador")
  );
  const museJuryCards = museState.slice(
    museState.indexOf("function marcadorPuntuacionJuradoMusa"),
    museState.indexOf("function tarjetaResultadoMusa")
  );
  const museJuryRender = museState.slice(
    museState.indexOf("function renderizarResultadoJuradoMusa"),
    museState.indexOf("function revelarResultadoFinalMusa")
  );
  const museJury = `${museJuryCards}\n${museJuryRender}`;

  assert.match(spectatorJury, /PUNTUACIONES DEL JURADO/);
  assert.match(spectatorJury, /PUNTUACI&Oacute;N MEDIA/);
  assert.match(spectatorJury, /<em>\/10<\/em>/);
  assert.match(spectatorJury, /if \(typeof stopConfetti === "function"\) stopConfetti\(\)/);
  assert.doesNotMatch(spectatorJury, /GANADOR|FINALISTA|is-winner|confetti_aux|SE LLEVA EL APARTADO/);
  assert.match(spectatorCss, /resultado-jurado-card--1 h3[\s\S]*#73efff/);
  assert.match(spectatorCss, /resultado-jurado-card--2 h3[\s\S]*#ff8396/);
  assert.match(spectatorCss, /resultado-jurado-score__track i[\s\S]*linear-gradient\(90deg, #ff4d64[\s\S]*#45e7cb/);

  assert.match(museJury, /PUNTUACIONES DEL JURADO/);
  assert.match(museJury, /PUNTUACI&Oacute;N MEDIA/);
  assert.match(museJury, /<em>\/10<\/em>/);
  assert.match(museJury, /aplicarGanadorLocalMusa\(resultado_jurado_musa, 0, firma\)/);
  assert.match(museJury, /if \(typeof stopConfetti === "function"\) stopConfetti\(\)/);
  assert.doesNotMatch(museJury, /GANADOR|FINALISTA|is-winner|confetti_aux/);
  assert.match(museCss, /resultado-musa__card--jurado-live\.resultado-musa__card--1 h3[\s\S]*#72efff/);
  assert.match(museCss, /resultado-musa__card--jurado-live\.resultado-musa__card--2 h3[\s\S]*#ff8397/);
  assert.match(museCss, /resultado-musa__jury-score-track i[\s\S]*linear-gradient\(90deg,#ff4d64[\s\S]*#45e7cb/);
});

test("Jury evaluates four criteria focused on the stage representation", () => {
  const html = read("game/jurado/index.html");
  const state = read("game/jurado/js/state.js");

  assert.match(state, /label: "Interpretación"/);
  assert.match(state, /label: "Puesta en escena"/);
  assert.match(state, /label: "Ritmo"/);
  assert.match(state, /label: "Integración del texto"/);
  assert.doesNotMatch(state, /presencia escénica|uso del espacio|progresión dramática|impacto final/i);
  assert.equal((state.match(/\{ id: "[^"]+", label:/g) || []).length, 4);
  assert.match(html, /Representaci&oacute;n esc&eacute;nica/);
  assert.doesNotMatch(state, /Idea y mundo|Inspiracion util|Cooperacion/);
});

test("credits use the real graphic marks and timer rings count down", () => {
  const spectatorState = read("game/spectator/js/state.js");
  const museState = read("game/public/players/js/state.js");

  assert.match(spectatorState, /src="\.\.\/media\/scrib-logo-mark\.png"/);
  assert.match(spectatorState, /src="\.\.\/img\/logo\.png"/);
  assert.match(spectatorState, /creditos-cierre__sutura-lockup/);
  assert.match(museState, /src="\.\.\/\.\.\/media\/scrib-logo-mark\.png"/);
  assert.match(museState, /src="\.\.\/\.\.\/img\/logo\.png"/);
  assert.match(museState, /creditos-musa__cierre-sutura-lockup/);
  assert.match(spectatorState, /temporizador_gigante_restante \/ duracion/);
  assert.match(museState, /temporizador_lectura_restante \/ duracion/);
});
