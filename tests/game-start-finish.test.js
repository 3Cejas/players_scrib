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
  assert.match(state, /createController\(\{[\s\S]*durationMs: 5200,[\s\S]*reducedDurationMs: 3200/);
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

  assert.match(html, /id="partida_final_espectador"[\s\S]*FIN DE LA ESCRITURA[\s\S]*HISTORIAS[\s\S]*LISTAS[\s\S]*AHORA EMPIEZA LA REPRESENTACI/);
  assert.match(css, /\.partida-final-espectador\s*\{[\s\S]*position: fixed;[\s\S]*inset: 0;[\s\S]*overflow: hidden;/);
  assert.match(css, /@keyframes partidaFinalEntrada[\s\S]*@keyframes partidaFinalSpark/);
  assert.match(finish, /logo\.style\.display = "none";[\s\S]*neon\.style\.display = "none";[\s\S]*mostrarCierrePartidaEspectador\(\);/);
  assert.doesNotMatch(finish, /animateCSS\("\.cabecera", "backInLeft"\)/);
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
