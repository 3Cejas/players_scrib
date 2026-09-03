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

  assert.match(html, /data-control-tab="deliberacion"/);
  assert.match(html, /id="boton_vista_deliberacion"/);
  assert.match(html, /id="boton_resultado_videojuego"/);
  assert.match(html, /id="boton_resultado_jurado"/);
  assert.match(html, /id="jurado_nav_control"/);
  assert.doesNotMatch(html, /id="jurado_nav_reset"/);
  assert.match(html, /id="jurado_nav_prev"[^>]*stats-nav-button--prev[^>]*aria-label="Resultado anterior"/);
  assert.match(html, /id="jurado_nav_next"[^>]*stats-nav-button--next[^>]*aria-label="Revelar siguiente resultado"/);
  assert.match(actions, /function mostrarVistaDeliberacion\(\)\s*\{\s*if \(vista_espectador_modo === "deliberacion"\)[\s\S]*return;[\s\S]*cambiar_vista_espectador\("deliberacion"\)/);
  assert.match(actions, /function mostrarResultadoVideojuego\(\)[\s\S]*mostrarPuntuacionFinal\(\)/);
  assert.match(actions, /function mostrarResultadoJurado\(\)[\s\S]*mostrar_resultado_jurado/);
  assert.match(actions, /function navegarResultadoJurado\(direccion\)[\s\S]*jurado_resultado_(?:anterior|siguiente)/);
  assert.match(actions, /numeroSlide = puntuacion_slide_step_control \+ 1/);
  assert.match(actions, /totalSlides = PUNTUACION_PASO_MAX_CONTROL \+ 1/);
  assert.match(actions, /jurado_slide_step_control \+ 1\}\/\$\{JURADO_PASO_MAX_CONTROL \+ 1\}/);
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
  assert.match(spectatorState, /resultado_jurado[\s\S]*pausarAudioDeliberacionEspectador\(deliberacion_audio_espectador, true\)[\s\S]*reproducirAudioDeliberacionSeguro\(deliberacion_latido_espectador/);
  assert.match(spectatorState, /RESULTADO_FINAL_SUSPENSE_MS = 3000/);
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
  assert.match(museState, /RESULTADO_FINAL_SUSPENSE_MUSA_MS = 3000/);
  assert.match(museState, /is-final-celebrating/);
  assert.match(museState, /vista_modo_remota_musa !== "resultado_final"\) \{\s*animarTransicionVistaMusa/);
  assert.match(museSockets, /puntuacion_final_estado/);
  assert.match(museSockets, /jurado_resultado_estado/);
  assert.match(museSockets, /resultado_final_estado/);
  assert.match(spectatorState, /puntuacion-desglose-puntos--azul"><b>[\s\S]*<small>PTS<\/small>/);
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
