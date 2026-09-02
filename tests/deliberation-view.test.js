const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("Control exposes exclusive deliberation, game result and jury result views", () => {
  const html = read("game/control/index.html");
  const actions = read("game/control/js/actions.js");
  const sockets = read("game/control/js/socket-events.js");

  assert.match(html, /data-control-tab="deliberacion"/);
  assert.match(html, /id="boton_vista_deliberacion"/);
  assert.match(html, /id="boton_resultado_videojuego"/);
  assert.match(html, /id="boton_resultado_jurado"/);
  assert.match(actions, /function mostrarVistaDeliberacion\(\)[\s\S]*cambiar_vista_espectador\("deliberacion"\)/);
  assert.match(actions, /function mostrarResultadoVideojuego\(\)[\s\S]*mostrarPuntuacionFinal\(\)/);
  assert.match(actions, /function mostrarResultadoJurado\(\)[\s\S]*mostrar_resultado_jurado/);
  assert.match(actions, /function activar_temporizador_gigante\(\)[\s\S]*cambiar_vista_espectador_modo", \{ modo: "partida" \}/);
  assert.match(actions, /function mostrarCreditosEspectador\(\)[\s\S]*temporizador_gigante_detener/);
  assert.match(sockets, /socket\.on\('jurado_resultado_estado'/);
});

test("spectator and muses render both deliberation outcomes", () => {
  const spectatorHtml = read("game/spectator/index.html");
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorSockets = read("game/spectator/js/socket-events.js");
  const museHtml = read("game/public/players/index.html");
  const museState = read("game/public/players/js/state.js");
  const museSockets = read("game/public/players/js/socket-events.js");

  assert.match(spectatorHtml, /id="deliberacion_espectador"/);
  assert.match(spectatorHtml, /id="resultado_jurado_espectador"/);
  assert.match(spectatorState, /vista-deliberacion/);
  assert.match(spectatorState, /vista-resultado-jurado/);
  assert.match(spectatorSockets, /pedir_jurado_resultado/);
  assert.match(museHtml, /id="deliberacion_musa"/);
  assert.match(museHtml, /id="resultado_videojuego_musa"/);
  assert.match(museHtml, /id="resultado_jurado_musa"/);
  assert.match(museState, /function sincronizarVistaDeliberacionMusa\(\)/);
  assert.match(museSockets, /puntuacion_final_estado/);
  assert.match(museSockets, /jurado_resultado_estado/);
});

test("credits use the real graphic marks and timer rings count down", () => {
  const spectatorState = read("game/spectator/js/state.js");
  const museState = read("game/public/players/js/state.js");

  assert.match(spectatorState, /src="\.\.\/media\/scrib-logo-mark\.png"/);
  assert.match(spectatorState, /src="\.\.\/img\/logo\.png"/);
  assert.match(spectatorState, /creditos-cierre__sutura-lockup/);
  assert.match(museState, /src="\.\.\/\.\.\/media\/scrib-logo-mark\.png"/);
  assert.match(museState, /src="\.\.\/\.\.\/img\/logo\.png"/);
  assert.match(museState, /creditos-musa__cierre-sutura-lockup/);
  assert.match(spectatorState, /temporizador_gigante_restante \/ duracion/);
  assert.match(museState, /temporizador_lectura_restante \/ duracion/);
});
