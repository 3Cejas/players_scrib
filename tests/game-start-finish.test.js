const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("the spectator start is authoritative and silences previous scene audio before countdown", () => {
  const sockets = read("game/spectator/js/socket-events.js");
  const start = sockets.slice(sockets.indexOf("socket.on('inicio'"), sockets.indexOf("function aplicarPostInicioEspectador"));

  assert.match(start, /vista_calentamiento = false;/);
  assert.match(start, /vista_espectador_override = "partida";/);
  assert.match(start, /setMode\("partida", \{[\s\S]*force: true,[\s\S]*silentTransition: true,[\s\S]*stopTransition: true,[\s\S]*resetAudioOverrides: true,[\s\S]*fadeDurationMs: 220/);
  assert.ok(start.indexOf('actualizarModoVistaEspectadorUi("partida")') < start.indexOf('reproducirSonidoCountdownEspectador("../../game/audio/5. PREPARADOS 1.mp3")'));
});

test("spectator countdown starts even after match branding has already been hidden", () => {
  const js = read("game/spectator/js/socket-events.js");
  const inicioStart = js.indexOf("socket.on('inicio'");
  const postInicioStart = js.indexOf("function aplicarPostInicioEspectador", inicioStart);
  const inicio = js.slice(inicioStart, postInicioStart);

  assert.doesNotMatch(inicio, /animateCSS\("\.cabecera",\s*"backOutLeft"\)\.then/);
  assert.match(inicio, /reproducirSonidoCountdownEspectador\("\.\.\/\.\.\/game\/audio\/5\. PREPARADOS 1\.mp3"\)/);
  assert.match(inicio, /crearCountdownEspectador\(tJuego2P\("countdown\.ready"/);
  assert.match(inicio, /programarPasoCountdownEspectador\(3, revisionCountdown, 0\)/);
});

test("spectator presents an explicit pre-level warm-up with the first level music", () => {
  const state = read("game/spectator/js/state.js");
  const sockets = read("game/spectator/js/socket-events.js");
  const css = read("game/css/dashboard-players.css");

  assert.match(state, /function iniciarCalentamientoPrevioEspectador\(payload = \{\}\)/);
  assert.match(state, /palabra1\.textContent = "CALENTAMIENTO PREVIO"/);
  assert.doesNotMatch(state, /ESCRITURA LIBRE · PRIMER NIVEL EN/);
  assert.match(state, /explicacion\.textContent = ""/);
  assert.match(state, /reproducirMusicaModoEspectador\(modoSiguiente\)/);
  assert.match(state, /"letra bendita": "\.\.\/\.\.\/game\/audio\/5\. KEYGEN PRUEBA 1\.mp3"/);
  assert.match(sockets, /socket\.on\('calentamiento_previo_estado'/);
  assert.match(sockets, /calentamiento_previo_pendiente_espectador = payload/);
  assert.match(css, /barra-nivel--calentamiento-previo/);
});

test("countdown audio is exclusive, spans the server intro and reveals the HUD by stages", () => {
  const state = read("game/spectator/js/state.js");
  const sockets = read("game/spectator/js/socket-events.js");
  const actions = read("game/players/js/actions.js");
  const competition = read("game/js/domains/competition.js");

  assert.match(sockets, /function detenerSonidoCountdownEspectador\(\)[\s\S]*\.pause\(\)[\s\S]*currentTime = 0/);
  assert.match(sockets, /RETARDO_PRIMER_PASO_COUNTDOWN_ESPECTADOR_MS = 2400/);
  assert.match(sockets, /INTERVALO_PASOS_COUNTDOWN_ESPECTADOR_MS = 1150/);
  assert.match(sockets, /DURACION_ESCRIBE_COUNTDOWN_ESPECTADOR_MS = 1650/);
  assert.match(state, /document\.getElementById\("scrib_competition_hud"\)/);
  assert.match(state, /key: "jugadora1"[\s\S]*key: "jugadora2"[\s\S]*key: "nivel"/);
  assert.doesNotMatch(actions, /mostrarFeedbackTiempoEscritora\(tiempo_feed, "borrar"/);
  assert.doesNotMatch(actions, /socket\.emit\(feedback_de_j_x, \{ color, tiempo_feed, tipo: "borrar" \}\)/);
  assert.match(competition, /esCambioPorEscritura[\s\S]*`<b>\$\{cambioFormateado\}<\/b>`/);
});

test("the level introduction lasts long enough to read on the projector", () => {
  const state = read("game/spectator/js/state.js");
  assert.match(state, /createController\(\{[\s\S]*durationMs: 7000,[\s\S]*reducedDurationMs: 7000/);
});

test("HTML editor tags never become public competition labels", () => {
  const competition = read("game/js/domains/competition.js");
  assert.match(competition, /function etiquetaPublicaPunto/);
  assert.match(competition, /\^\(\?:div\|br\|p\|li\)\$/i);
  assert.match(competition, /mini\[\\s_-\]\*insp/i);
  assert.match(competition, /return Number\(payload\.delta\) < 0 \? "BORRADO" : "ESCRITURA"/);
});

test("the finished-writing scene fully replaces the old spectator HUD", () => {
  const html = read("game/spectator/index.html");
  const css = read("game/css/dashboard-players.css");
  const sockets = read("game/spectator/js/socket-events.js");
  const finish = sockets.slice(sockets.indexOf("function ejecutarCierrePartidaEspectador"), sockets.indexOf("function evaluarCierrePartidaEspectador"));

  assert.match(html, /id="partida_final_espectador"[\s\S]*FIN DE LA ESCRITURA[\s\S]*HISTORIAS[\s\S]*LISTAS[\s\S]*partida-final-espectador__versus[^>]*[\s\S]*VS\./);
  assert.doesNotMatch(html, /AHORA EMPIEZA LA REPRESENTACI/);
  assert.match(css, /\.partida-final-espectador\s*\{[\s\S]*position: fixed;[\s\S]*inset: 0;[\s\S]*overflow: hidden;/);
  assert.match(css, /@keyframes partidaFinalEntrada[\s\S]*@keyframes partidaFinalSpark/);
  assert.match(finish, /logo\.style\.display = "none";[\s\S]*neon\.style\.display = "none";[\s\S]*mostrarCierrePartidaEspectador\(\);/);
  assert.doesNotMatch(finish, /animateCSS\("\.cabecera", "backInLeft"\)/);
  assert.match(sockets, /function sincronizarCierrePartidaEspectadorConVista\(modo\)[\s\S]*vista === "partida" && confetti_cierre_partida_disparado[\s\S]*ocultarCierrePartidaEspectador\(\)/);
  assert.match(sockets, /function teleprompterActivoEspectador\(\)[\s\S]*teleprompter\.classList\.contains\("activo"\)/);
  assert.match(sockets, /function mostrarCierrePartidaEspectador\(\)[\s\S]*teleprompterActivoEspectador\(\)[\s\S]*ocultarCierrePartidaEspectador\(\)/);
  assert.match(sockets, /sincronizarCierrePartidaEspectadorConVista\(modo\)[\s\S]*!teleprompterActivoEspectador\(\)/);
  assert.match(read("game/spectator/js/state.js"), /sincronizarCierrePartidaEspectadorConVista\(modo\)/);
  assert.match(read("game/spectator/js/state.js"), /overlay\.classList\.toggle\("activo", teleprompter_estado\.visible\);[\s\S]*sincronizarCierrePartidaEspectadorConVista\(vista_espectador_modo_resuelta\)/);
});

test("the spectator header stays legible above the HUD and lets text cards yield first", () => {
  const css = read("game/css/dashboard-players.css");

  assert.match(css, /page-spectator\.vista-partida #spectator_fit_root > \.cabecera\s*\{[\s\S]*width:\s*min\(68vw, 920px\);[\s\S]*height:\s*clamp\(130px, 18\.5vh, 210px\);[\s\S]*overflow:\s*hidden;/);
  assert.match(css, /page-spectator\.vista-partida #spectator_fit_root > \.cabecera \.neon_espectador\s*\{[\s\S]*font-size:\s*clamp\(8px, \.78vw, 14px\);/);
  assert.match(css, /page-spectator\.vista-partida \.scrib-competition-hud\[data-role="spectator"\]\s*\{[\s\S]*top:\s*clamp\(142px, 20vh, 220px\);/);
  assert.match(css, /page-spectator\.vista-partida #contenedor_espectador\s*\{[\s\S]*padding-top:\s*clamp\(282px, 38vh, 400px\);/);
  assert.match(css, /grid-template-rows:\s*auto auto minmax\(56px, 1fr\) auto auto;/);
});

test("muses request and show the wrapped instead of the provisional finished-writing card", () => {
  const html = read("game/public/players/index.html");
  const css = read("game/public/players/css/publico.css");
  const state = read("game/public/players/js/state.js");
  const sockets = read("game/public/players/js/socket-events.js");

  assert.match(html, /id="musa_partida_final"[\s\S]*FIN DE LA ESCRITURA[\s\S]*HISTORIA[\s\S]*LISTA/);
  assert.match(css, /\.musa-partida-final\s*\{[\s\S]*position:\s*fixed;[\s\S]*inset:\s*0;[\s\S]*z-index:\s*190;/);
  assert.match(state, /function mostrarCierrePartidaMusa\(\)[\s\S]*musa_partida_final\.classList\.add\("is-visible"\)/);
  assert.match(state, /vistaFinalAlternativa[\s\S]*ocultarCierrePartidaMusa\(\)/);
  assert.match(sockets, /socket\.on\("fin"[\s\S]*setUiPartidaFinalizadaMusa\(true\)[\s\S]*ocultarCierrePartidaMusa\(\)[\s\S]*solicitarPostgameMusa\(\)/);
  assert.doesNotMatch(sockets, /postgameMostrado[\s\S]*mostrarCierrePartidaMusa\(\)/);
  assert.match(state, /if \(regalo_pdf_pendiente\)[\s\S]*intentarMostrarRegaloPdfPendiente\(\)/);
  assert.match(state, /function solicitarPostgameMusa\(\)[\s\S]*socket\.emit\("pedir_postgame_musas"/);
  assert.match(state, /function aplicarPostgameMusaDesdeServidor\(payload = \{\}\)[\s\S]*ocultarCierrePartidaMusa\(\)[\s\S]*mostrarPostgameMusa\(\)/);
  assert.match(state, /if \(regalo_postgame_data\) \{[\s\S]*ocultarRegaloPdf\(\);[\s\S]*mostrarPostgameMusa\(\);/);
  assert.match(state, /function iniciarTemporizadorLectura[\s\S]*ui_partida_finalizada_musa[\s\S]*mostrarPostgameMusa\(\)/);
});

test("the postgame wrapped stays pinned after leaving the videogame result", () => {
  const museState = read("game/public/players/js/state.js");
  const controlActions = read("game/control/js/actions.js");

  assert.match(museState, /postgame_resultado_videojuego_visto_musa/);
  assert.match(museState, /modoAnterior === "puntuacion"[\s\S]*postgame_wrapped_fijado_musa = true/);
  assert.match(museState, /ui_partida_finalizada_musa && postgame_wrapped_fijado_musa[\s\S]*mostrarPostgameMusa\(\)/);
  assert.match(controlActions, /function prepararVistaEspectadorParaTeleprompter\(\)[\s\S]*vista_espectador_modo = "partida"[\s\S]*cambiar_vista_espectador_modo/);
  assert.match(controlActions, /function toggleTeleprompter[\s\S]*prepararVistaEspectadorParaTeleprompter\(\)/);
  assert.match(controlActions, /function teleprompterCargarTexto[\s\S]*prepararVistaEspectadorParaTeleprompter\(\)/);
});

test("the finished writer layout reserves a separate row for its status badge", () => {
  const state = read("game/players/js/state.js");
  const css = read("game/css/dashboard-players.css");

  assert.match(state, /classList\.toggle\("partida-finalizada-escritora", Boolean\(visible\)\)/);
  assert.match(css, /page-players\.partida-activa\.partida-finalizada-escritora #contenedor[\s\S]*padding-top:/);
  assert.match(css, /page-players\.partida-finalizada-escritora \.info-total[\s\S]*margin-top:/);
  assert.match(css, /page-players\.partida-finalizada-escritora #metadatos\[data-ganador\]::after[\s\S]*escritorFinalBadgeEntrada/);
  assert.doesNotMatch(
    css.match(/page-players\.partida-finalizada-escritora #metadatos\[data-ganador\]::after \{[\s\S]*?\n\}/)?.[0] || "",
    /marcadorGanadorParpadeo/
  );
});
