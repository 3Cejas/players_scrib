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

test("spectator restores current-level music after a refresh or autoplay interruption", () => {
  const state = read("game/spectator/js/state.js");
  const sockets = read("game/spectator/js/socket-events.js");

  assert.match(state, /function asegurarMusicaModoEspectador\(\)/);
  assert.match(state, /partida_activa_espectador[\s\S]*vista_espectador_modo_resuelta !== "partida"[\s\S]*canto_audio_activo_espectador/);
  assert.match(state, /\["pointerdown", "mousedown", "touchstart", "keydown", "click"\][\s\S]*capture: true[\s\S]*visibilitychange[\s\S]*pageshow[\s\S]*focus/);
  assert.match(state, /sonido_modo\.dataset\.scribModo = modoNormalizado/);
  assert.match(state, /if \(modo === "partida"\) asegurarMusicaModoEspectador\(\)/);
  assert.ok((sockets.match(/asegurarMusicaModoEspectador\(\);/g) || []).length >= 2);
});

test("spectator announces every level on an isolated, recoverable voice channel", () => {
  const state = read("game/spectator/js/state.js");
  const sockets = read("game/spectator/js/socket-events.js");
  const expected = [
    ["letra bendita", "10. LETRA BENDITA.mp3"],
    ["letra prohibida", "11. LETRA PROHIBIDA.mp3"],
    ["palabras bonus", "12. PALABRAS BENDITAS.mp3"],
    ["palabras prohibidas", "13. PALABRAS PROHIBIDAS.mp3"],
    ["tertulia", "14. TERTULIA.mp3"],
    ["frase final", "15. FRASE FINAL.mp3"]
  ];

  for (const [mode, filename] of expected) {
    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(state, new RegExp(`"${mode}": "\\.\\.\\/\\.\\.\\/game\\/audio\\/FX\\/${escapedFilename}"`));
    const audioPath = path.join(ROOT, "game", "audio", "FX", filename);
    assert.ok(fs.existsSync(audioPath), `missing level voice: ${filename}`);
    assert.ok(fs.statSync(audioPath).size > 50000, `level voice looks empty: ${filename}`);
  }

  assert.equal((state.match(/reproducirLocucionNivelEspectador\("/g) || []).length, 6);
  assert.match(state, /let sonido_locucion_nivel_espectador = null/);
  assert.match(state, /audio\.dataset\.scribLocucionModo = modoNormalizado/);
  assert.match(state, /audio\.onplaying = \(\) => \{[\s\S]*atenuarMusicaDuranteLocucionNivelEspectador/);
  assert.match(state, /function reiniciarLocucionesNivelEspectador\(\)[\s\S]*ultima_locucion_nivel_completada_espectador = ""/);
  assert.match(state, /function instalarRecuperacionMusicaModoEspectador\(\)[\s\S]*intentarReproducirLocucionNivelEspectador\(\)[\s\S]*\["pointerdown", "mousedown", "touchstart", "keydown", "click"\]/);
  assert.match(sockets, /socket\.on\('disconnect'[\s\S]*reiniciarLocucionesNivelEspectador\(\)/);
  assert.doesNotMatch(state, /reproducirSonido\("\.\.\/\.\.\/game\/audio\/FX\/(?:10|11|12|13|14|15)\./);
});

test("empty spectator inspiration cards stay hidden in letter levels", () => {
  const css = read("game/css/dashboard-players.css");
  const state = read("game/spectator/js/state.js");

  assert.match(css, /body\.page-spectator #palabra1:empty,[\s\S]*#palabra2:empty \{[\s\S]*display: none !important/);
  const bendita = state.slice(state.indexOf("'letra bendita': function"), state.indexOf("'psicod", state.indexOf("'letra bendita': function")));
  assert.ok(bendita.indexOf('aplicarEstiloPalabrasModoLetrasEspectador("bendita")') < bendita.indexOf('actualizarPalabraConVisibilidad(palabra2, "")'));
});

test("spectator removes a muse suggestion as soon as that word is used", () => {
  const state = read("game/spectator/js/state.js");

  assert.match(state, /function limpiarSugerenciaMusaModoLetrasEspectador[\s\S]*actualizarPalabraConVisibilidad\(nodoPalabra, ""\)/);
  assert.match(state, /function limpiarSugerenciaMusaModoLetrasEspectador[\s\S]*actualizarDefinicionConVisibilidad\(nodoDefinicion, "", false\)/);
  assert.match(state, /if \(usada && visible && !visible\.includes\(usada\)\) return/);
});

test("spectator plays the existing loss sound only when live text gets shorter", () => {
  const sockets = read("game/spectator/js/socket-events.js");

  assert.match(sockets, /function reproducirBorradoTextoEspectador\(textoAnterior, textoNuevo, longitudes = null\)/);
  assert.match(sockets, /vista_espectador_modo_resuelta !== "partida"/);
  assert.match(sockets, /longitudNueva >= longitudAnterior/);
  assert.match(sockets, /PERDER 2 seg\.mp3/);
  assert.equal((sockets.match(/reproducirBorradoTextoEspectador\(ultimo_texto[12], paquete\.text, planoNuevo/g) || []).length, 2);
});

test("parameter controls keep units adjacent and language clear of final phrases", () => {
  const css = read("game/control/index.css");

  assert.match(css, /#panel_parametros:not\(\.is-side-collapsed\) \.parametros-top-grid \{[\s\S]{0,180}grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /#panel_parametros:not\(\.is-side-collapsed\) \.control-language \{[\s\S]{0,180}grid-column: 1 \/ -1/);
  assert.match(css, /> td:not\(\.param-duration\) \{[\s\S]{0,240}grid-template-columns: max-content max-content/);
  assert.match(css, /> \.spinner-container,[\s\S]{0,300}width: auto !important/);
});
