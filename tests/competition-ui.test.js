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
