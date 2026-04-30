const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function cargarDominio(relPath) {
  const window = {};
  const context = { window };
  context.window = window;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, relPath), "utf8"), context, {
    filename: relPath
  });
  return window;
}

test("ScribInspiration validates letter-mode inspiration and preserves ene", () => {
  const { ScribInspiration } = cargarDominio("game/js/domains/inspiration.js");

  assert.equal(ScribInspiration.normalizarTexto("cancion"), "cancion");
  assert.equal(ScribInspiration.normalizarTexto("cañon"), "cañon");
  assert.equal(ScribInspiration.validarInspiracion({
    modo: "letra bendita",
    texto: "kilo",
    letra: "k"
  }).ok, true);
  assert.equal(ScribInspiration.validarInspiracion({
    modo: "letra prohibida",
    texto: "kilo",
    letra: "k"
  }).ok, false);
  assert.equal(ScribInspiration.validarInspiracion({
    modo: "palabras bonus",
    texto: "dos palabras",
    letra: ""
  }).motivo, "spaces");
});

test("ScribDisadvantages centralizes emojis and aliases", () => {
  const { ScribDisadvantages } = cargarDominio("game/js/domains/disadvantages.js");

  assert.equal(ScribDisadvantages.normalizar("tortuga"), ScribDisadvantages.EMOJIS.TORTUGA);
  assert.equal(ScribDisadvantages.normalizar("borrado bloqueado"), ScribDisadvantages.EMOJIS.BLOQUEO);
  assert.equal(ScribDisadvantages.opcionesVotacion().length, 5);
  assert.match(ScribDisadvantages.etiqueta(ScribDisadvantages.EMOJIS.RAYO), /BORRADO RAPIDO/);
});

test("ScribTeleprompter applies bounded state updates", () => {
  const { ScribTeleprompter } = cargarDominio("game/js/domains/teleprompter.js");
  const state = ScribTeleprompter.crearEstado();

  ScribTeleprompter.aplicarEstado(state, {
    visible: true,
    fontSize: 500,
    speed: -10,
    source: 9,
    loadId: 3,
    revision: 4
  }, {
    fontMin: 18,
    fontMax: 80,
    speedMin: 5,
    speedMax: 200
  });

  assert.equal(state.visible, true);
  assert.equal(state.fontSize, 80);
  assert.equal(state.speed, 5);
  assert.equal(state.source, 0);
  assert.equal(state.loadId, 3);
  assert.equal(state.revision, 4);
  assert.equal(ScribTeleprompter.esEstadoObsoleto({ revision: 2 }, 4), true);
});

test("ScribResurrection normalizes menu state", () => {
  const { ScribResurrection } = cargarDominio("game/js/domains/resurrection.js");
  const state = ScribResurrection.crearEstadoMenu("2", {
    visible: true,
    palabras: 3
  });

  assert.equal(state.player, 2);
  assert.equal(state.visible, true);
  assert.equal(state.palabras, 3);
  assert.equal(ScribResurrection.estaActiva(state), true);
});
