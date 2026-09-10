const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const competition = require("../game/js/domains/competition.js");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("la barra bilateral parte del centro y se desplaza hacia quien lidera", () => {
  assert.equal(competition.posicionMarcador(0, 0), 50);
  assert.ok(competition.posicionMarcador(10, 2) > 50);
  assert.ok(competition.posicionMarcador(2, 10) < 50);
  assert.ok(competition.posicionMarcador(9.95, 2) < competition.posicionMarcador(10, 2));
  assert.equal(competition.formatearTiempo(125), "02:05");
});

test("el HUD usa marcador numerico, reloj global y animaciones sin porcentajes", () => {
  const js = read("game/js/domains/competition.js");
  const writer = read("game/players/index.html");
  const control = read("game/control/index.html");
  const spectator = read("game/spectator/index.html");

  assert.match(js, /competicion_ronda_estado/);
  assert.match(js, /reloj_partida_estado/);
  assert.match(js, /¡CAMBIO DE VENTAJA!/);
  assert.match(js, /LA DESVENTAJA CAMBIA DE EQUIPO/);
  assert.match(js, /scrib-competition-change__route/);
  assert.match(js, /animation:scribLeaderChange 3\.4s/);
  assert.match(js, /scrib-competition-fly/);
  assert.match(js, /scrib-competition-burst/);
  assert.match(js, /scribCompetitionShift/);
  assert.match(js, /scribCompetitionCross/);
  assert.match(js, /numero\(payload\.delta\)} 🎨/);
  assert.match(js, /payload\.animar !== false/);
  assert.doesNotMatch(js, /ui\.scores\[[^\]]+\]\.textContent\s*=\s*[^;\n]*%/);
  [writer, control, spectator].forEach((html) => {
    assert.match(html, /domains\/competition\.js/);
  });
});

test("Espectador mantiene el marcador arriba y reserva sitio para ambos nombres", () => {
  const js = read("game/js/domains/competition.js");
  const html = read("game/spectator/index.html");
  const sockets = read("game/spectator/js/socket-events.js");

  assert.match(js, /data-role="spectator"\]\{top:clamp\(8px,1\.4vh,18px\)/);
  assert.match(js, /vista-partida #contenedor_espectador\{[^}]*padding-top:clamp\(94px,12vh,128px\)/);
  assert.match(js, /#contenedor_espectador \.nombre\{[^}]*visibility:visible/);
  assert.match(html, /value="ESCRITXR 1"[^>]*id="nombre"/);
  assert.match(html, /value="ESCRITXR 2"[^>]*id="nombre1"/);
  assert.match(sockets, /trim\(\) \|\| "ESCRITXR 1"/);
  assert.match(sockets, /trim\(\) \|\| "ESCRITXR 2"/);
});

test("Control integra un HUD compacto donde antes aparecía la duración de la desventaja", () => {
  const js = read("game/js/domains/competition.js");
  const html = read("game/control/index.html");
  const actions = read("game/control/js/actions.js");

  assert.match(html, /id="control_competition_slot"/);
  assert.match(html, /control_desventaja_activa_time_j1[^>]+hidden/);
  assert.match(html, /control_desventaja_activa_time_j2[^>]+hidden/);
  assert.match(js, /data-role="control"[^}]+position:relative/);
  assert.match(js, /data-role="control"[^}]+scrib-competition-scoreline[^}]+display:block/);
  assert.match(js, /control-competition-slot \+ \.level-status-witnesses \.level-status-witness--disadvantage\{display:none\}/);
  assert.match(js, /data-role="control"\] \.scrib-competition-streak\{display:none\}/);
  assert.match(js, /if \(!payload \|\| !ui \|\| rolActual === "control"\) return;/);
  assert.doesNotMatch(actions, /Desventaja \$\{equipo\}\$\{detalle\}: \$\{formatearTiempoTestigoControl/);
});

test("Espectador mantiene una sola desventaja visual y limpia el efecto anterior", () => {
  const state = read("game/spectator/js/state.js");
  const sockets = read("game/spectator/js/socket-events.js");

  assert.match(state, /function limpiarDesventajasVisualesEspectador\(\)[\s\S]*limpiarVisualPutadasEspectador\(\)/);
  assert.match(state, /const rival = id === 1 \? 2 : 1;[\s\S]*limpiarVisualPutadaEspectador\(rival, \{ limpiarEfecto: true \}\)/);
  assert.match(sockets, /socket\.on\("desventaja_ronda_limpiar", \(\) => \{\s*limpiarDesventajasVisualesEspectador\(\);/);
});

test("Escritxr ve el calentamiento previo dentro del HUD de partida", () => {
  const js = read("game/js/domains/competition.js");
  assert.match(js, /socket\.on\("calentamiento_previo_estado", actualizarCalentamiento\)/);
  assert.match(js, /data-role="writer"\]\[data-warmup="1"\][^}]+scrib-competition-warmup\{display:flex\}/);
  assert.match(js, /CALENTAMIENTO PREVIO · \$\{formatearTiempo\(restante\)\}/);
});

test("Escritxr oculta los rótulos del nivel, usa el emoji y centra las partículas en el destino real", () => {
  const js = read("game/js/domains/competition.js");
  const css = read("game/css/dashboard-players.css");
  const actions = read("game/players/js/actions.js");

  assert.match(js, /data-role="writer"\] \.scrib-competition-mode/);
  assert.match(js, /destino\.left \+ destino\.width \/ 2 - mitadTokenX/);
  assert.match(js, /spectator: player === 1 \? \["#texto1"/);
  assert.match(js, /requestAnimationFrame\(\(\) => token\.classList\.add\("is-flying"\)\)/);
  assert.match(css, /partida-intro-escritora #logo[\s\S]*display: none !important/);
  assert.match(css, /page-players\.partida-activa #contenedor[\s\S]*padding-top/);
  assert.match(css, /page-players\.partida-activa #nombre[\s\S]*text-shadow/);
  assert.match(js, /cambioFormateado[\s\S]*numero\(payload\.delta\)[\s\S]*🎨/);
  assert.match(js, /Number\(payload\.delta\) < 0 \? "#ff4d67" : "#62ff9d"/);
  assert.doesNotMatch(actions, /mostrarFeedbackTiempoEscritora\(tiempo_feed, "borrar"/);
  assert.doesNotMatch(actions, /-0\.05 insp\./);
});

test("Escritxr uses team-colored backgrounds and audible inspiration feedback", () => {
  const css = read("game/css/dashboard-players.css");
  const state = read("game/players/js/state.js");
  assert.match(css, /body\.page-players\.equipo-azul\s*\{[\s\S]*linear-gradient/);
  assert.match(css, /body\.page-players\.equipo-rojo\s*\{[\s\S]*linear-gradient/);
  assert.match(state, /GANAR 2 SEG\.mp3/);
  assert.match(state, /PERDER 2 SEG\.mp3/);
  assert.match(state, /opciones\.sonido !== false/);
});

test("Frase final keeps only the global clock and removes inspiration scoring", () => {
  const competition = read("game/js/domains/competition.js");
  const writerState = read("game/players/js/state.js");
  const writerEvents = read("game/players/js/socket-events.js");
  const museEvents = read("game/public/players/js/socket-events.js");

  assert.match(competition, /data-final="1"[^}]+scrib-competition-scoreline/);
  assert.match(competition, /data-role="control"\]\[data-final="1"\]\{display:none\}/);
  assert.match(writerState, /tipo === "frase-final"\s*\? null/);
  assert.match(writerEvents, /actualizarFraseFinalDesdePayloadEscritora\(data\)/);
  assert.doesNotMatch(museEvents, /modo_actual === "frase final"\s*\|\|/);
  assert.match(museEvents, /juego\.modo_actual === "frase final"/);
  assert.match(museEvents, /modo_actual = siguiente_modo;\s*window\.__scribModoActualMusaPreview = modo_actual;/);
});

test("Frase final highlights without mutating the contenteditable or stealing Enter", () => {
  const writerState = read("game/players/js/state.js");
  const writerEvents = read("game/players/js/socket-events.js");
  const css = read("game/css/dashboard-players.css");
  const inicioProgreso = writerState.indexOf("function actualizarProgresoFraseFinal()");
  const finProgreso = writerState.indexOf("const VIDA_MAX_SEGUNDOS", inicioProgreso);
  const actualizadorProgreso = writerState.slice(inicioProgreso, finProgreso);

  assert.match(actualizadorProgreso, /CSS\.highlights\.set\(HIGHLIGHT_PROGRESO_FRASE_FINAL, new Highlight\(rango\)\)/);
  assert.doesNotMatch(actualizadorProgreso, /rango\.surroundContents\(span\)/);
  assert.doesNotMatch(actualizadorProgreso, /rango\.extractContents\(\)/);
  assert.match(writerEvents, /texto\.addEventListener\("input", listener_modo\)/);
  assert.match(writerEvents, /detectarFraseFinalCompletada\(e\.target\.innerText, frase_final\)/);
  assert.match(css, /::highlight\(scrib-frase-final-progreso\)/);
  assert.match(css, /objetivo-chip--frase-final[\s\S]*--frase-final-progress/);
});
