const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("Control exposes an explicit Debug toggle and hides its tools by default", () => {
  const html = read("game/control/index.html");
  assert.match(html, /data-control-tab="debug"/);
  assert.match(html, /id="modo_debug_toggle"[^>]*role="switch"[^>]*disabled/);
  assert.match(html, /id="debug_control_tools"[^>]*hidden/);
  assert.match(html, /id="debug_cargar_deliberacion"/);
  assert.match(html, /id="debug_siguiente_nivel"/);
  assert.match(html, /id="debug_finalizar_partida"/);
});

test("Control requests authoritative Debug state and routes every test action through the server", () => {
  const actions = read("game/control/js/actions.js");
  const sockets = read("game/control/js/socket-events.js");
  assert.match(sockets, /socket\.emit\('pedir_modo_debug_estado'\)/);
  assert.match(sockets, /socket\.on\('modo_debug_estado'/);
  assert.match(actions, /socket\.emit\("modo_debug_establecer"/);
  assert.match(actions, /"cargar_datos_prueba_deliberacion"/);
  assert.match(actions, /"debug_siguiente_nivel"/);
  assert.match(actions, /"debug_finalizar_partida"/);
  assert.match(actions, /herramientas\.hidden = !modo_debug_control_activo/);
});

test("Debug controls retain usable responsive layout", () => {
  const css = read("game/control/index.css");
  assert.match(css, /\.control-group--debug:not\(\.is-collapsed\) > \.debug-control\s*\{[\s\S]*display: grid !important/);
  assert.match(css, /\.debug-control__tools\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.debug-control__tools\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
});
