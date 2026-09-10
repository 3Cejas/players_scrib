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
  assert.ok(start.indexOf('actualizarModoVistaEspectadorUi("partida")') < start.indexOf('reproducirSonido("\.\.\/\.\.\/game\/audio\/5. PREPARADOS 1.mp3")'));
});

test("spectator countdown starts even after match branding has already been hidden", () => {
  const js = read("game/spectator/js/socket-events.js");
  const inicioStart = js.indexOf("socket.on('inicio'");
  const postInicioStart = js.indexOf("function aplicarPostInicioEspectador", inicioStart);
  const inicio = js.slice(inicioStart, postInicioStart);

  assert.doesNotMatch(inicio, /animateCSS\("\.cabecera",\s*"backOutLeft"\)\.then/);
  assert.match(inicio, /reproducirSonido\("\.\.\/\.\.\/game\/audio\/5\. PREPARADOS 1\.mp3"\)/);
  assert.match(inicio, /crearCountdownEspectador\(tJuego2P\("countdown\.ready"/);
  assert.match(inicio, /programarPasoCountdownEspectador\(3, revisionCountdown, 0\)/);
});

test("spectator presents an explicit pre-level warm-up with the first level music", () => {
  const state = read("game/spectator/js/state.js");
  const sockets = read("game/spectator/js/socket-events.js");
  const css = read("game/css/dashboard-players.css");

  assert.match(state, /function iniciarCalentamientoPrevioEspectador\(payload = \{\}\)/);
  assert.match(state, /palabra1\.textContent = "CALENTAMIENTO PREVIO"/);
  assert.match(state, /ESCRITURA LIBRE · PRIMER NIVEL EN/);
  assert.match(state, /reproducirMusicaModoEspectador\(modoSiguiente\)/);
  assert.match(state, /"letra bendita": "\.\.\/\.\.\/game\/audio\/5\. KEYGEN PRUEBA 1\.mp3"/);
  assert.match(sockets, /socket\.on\('calentamiento_previo_estado'/);
  assert.match(sockets, /calentamiento_previo_pendiente_espectador = payload/);
  assert.match(css, /barra-nivel--calentamiento-previo/);
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
