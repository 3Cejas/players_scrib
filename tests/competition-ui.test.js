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
  assert.match(js, /scrib-competition-fly/);
  assert.match(js, /scrib-competition-burst/);
  assert.match(js, /payload\.animar !== false/);
  assert.doesNotMatch(js, /ui\.scores\[[^\]]+\]\.textContent\s*=\s*[^;\n]*%/);
  [writer, control, spectator].forEach((html) => {
    assert.match(html, /domains\/competition\.js/);
  });
});

test("Control integra un HUD compacto donde antes aparecía la duración de la desventaja", () => {
  const js = read("game/js/domains/competition.js");
  const html = read("game/control/index.html");
  const actions = read("game/control/js/actions.js");

  assert.match(html, /id="control_competition_slot"/);
  assert.match(html, /control_desventaja_activa_time_j1[^>]+hidden/);
  assert.match(html, /control_desventaja_activa_time_j2[^>]+hidden/);
  assert.match(js, /data-role="control"[^}]+position:relative/);
  assert.match(js, /control-competition-slot \+ \.level-status-witnesses \.level-status-witness--disadvantage\{display:none\}/);
  assert.doesNotMatch(actions, /Desventaja \$\{equipo\}\$\{detalle\}: \$\{formatearTiempoTestigoControl/);
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
  assert.match(actions, /-0\.05 \\u26A1/);
  assert.doesNotMatch(actions, /-0\.05 insp\./);
});
