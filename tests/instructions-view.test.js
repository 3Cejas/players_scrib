const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("instructions view exposes the complete guided sequence", () => {
  const instructions = require("../game/js/domains/instructions.js");

  assert.equal(instructions.STEP_COUNT, 7);
  assert.equal(instructions.normalizeStep(-4), 0);
  assert.equal(instructions.normalizeStep(4.9), 4);
  assert.equal(instructions.normalizeStep(99), 6);
});

test("control, spectator and muse load the instructions experience", () => {
  const control = read("game/control/index.html");
  const spectator = read("game/spectator/index.html");
  const muse = read("game/public/players/index.html");
  const spectatorState = read("game/spectator/js/state.js");
  const museState = read("game/public/players/js/state.js");

  assert.match(control, /id="boton_vista_instrucciones"[^>]*>[^<]*INSTRUCCIONES/);
  assert.match(control, /id="instrucciones_nav_control"/);
  assert.match(spectator, /instructions\.css/);
  assert.match(spectator, /instructions\.js/);
  assert.match(muse, /instructions\.css/);
  assert.match(muse, /instructions\.js/);
  assert.match(spectatorState, /ScribInstructions\.create/);
  assert.match(museState, /ScribInstructions\.create/);
});

test("detonator presentation highlights only the active request and centers an idle muse flag", () => {
  const spectator = read("game/spectator/index.html");
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorCss = read("game/css/dashboard-players.css");
  const museState = read("game/public/players/js/state.js");
  const museCss = read("game/public/players/css/publico.css");

  assert.match(spectator, />DETONADORES</);
  assert.doesNotMatch(spectator, /DETONADOR ACTUAL/);
  assert.match(spectatorState, /classList\.toggle\([\s\S]*"is-active",[\s\S]*solicitud_calentamiento_espectador !== "ninguna"[\s\S]*entrada\.tipo === solicitud_calentamiento_espectador/);
  assert.match(spectatorCss, /\.detonador-historial-item\.is-active/);
  assert.match(museState, /musa-bandera-detonador-en-espera/);
  assert.match(museCss, /\.musa-bandera-detonador-en-espera[^}]+top: 50% !important;[^}]+left: 50% !important;/);
});
