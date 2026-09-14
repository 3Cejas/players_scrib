const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

test("spectator restores an authoritative mid-match snapshot after post-inicio cleanup", () => {
  const sockets = read("game/spectator/js/socket-events.js");

  assert.match(sockets, /const modoRestauradoConexion = data && data\.restaurando && ultimo_payload_modo_espectador/);
  assert.match(sockets, /aplicarModo\(modoPendienteInicio \|\| modoRestauradoConexion\)/);
});

test("spectator plays the existing loss sound only when live text gets shorter", () => {
  const sockets = read("game/spectator/js/socket-events.js");

  assert.match(sockets, /function reproducirBorradoTextoEspectador\(textoAnterior, textoNuevo\)/);
  assert.match(sockets, /vista_espectador_modo_resuelta !== "partida"/);
  assert.match(sockets, /longitudNueva >= longitudAnterior/);
  assert.match(sockets, /PERDER 2 seg\.mp3/);
  assert.equal((sockets.match(/reproducirBorradoTextoEspectador\(ultimo_texto[12], paquete\.text\)/g) || []).length, 2);
});

test("parameter controls keep units adjacent and language clear of final phrases", () => {
  const css = read("game/control/index.css");

  assert.match(css, /#panel_parametros:not\(\.is-side-collapsed\) \.parametros-top-grid \{[\s\S]{0,180}grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /#panel_parametros:not\(\.is-side-collapsed\) \.control-language \{[\s\S]{0,180}grid-column: 1 \/ -1/);
  assert.match(css, /> td:not\(\.param-duration\) \{[\s\S]{0,240}grid-template-columns: max-content max-content/);
  assert.match(css, /> \.spinner-container,[\s\S]{0,300}width: auto !important/);
});
