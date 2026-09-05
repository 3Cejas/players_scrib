const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("Control hides Debug behind five logo clicks and distributes tools by context", () => {
  const html = read("game/control/index.html");
  assert.match(html, /id="control_debug_secret_trigger"/);
  assert.doesNotMatch(html, /data-control-tab="debug"/);
  assert.doesNotMatch(html, /id="modo_debug_toggle"/);
  assert.doesNotMatch(html, /id="control_panel_debug"/);
  assert.match(html, /id="control_panel_juego"[\s\S]*id="debug_tools_juego"[^>]*data-debug-tools[^>]*hidden[\s\S]*id="debug_siguiente_nivel"/);
  assert.match(html, /id="control_panel_deliberacion"[\s\S]*id="debug_tools_deliberacion"[^>]*data-debug-tools[^>]*hidden[\s\S]*id="debug_cargar_deliberacion"/);
  assert.match(html, /id="control_panel_final"[\s\S]*id="debug_tools_final"[^>]*data-debug-tools[^>]*hidden[\s\S]*id="debug_finalizar_partida"/);
  assert.doesNotMatch(html, /id="debug_control_tools"/);
});

test("Control requests authoritative Debug state and routes every test action through the server", () => {
  const actions = read("game/control/js/actions.js");
  const sockets = read("game/control/js/socket-events.js");
  assert.match(sockets, /socket\.emit\('pedir_modo_debug_estado'\)/);
  assert.match(sockets, /socket\.on\('modo_debug_estado'/);
  assert.match(actions, /socket\.emit\("modo_debug_establecer"/);
  assert.match(actions, /clicks_logo_debug_control \+= 1/);
  assert.match(actions, /clicks_logo_debug_control < 5/);
  assert.match(actions, /establecerModoDebug\(!modo_debug_control_activo\)/);
  assert.match(actions, /"cargar_datos_prueba_deliberacion"/);
  assert.match(actions, /"debug_siguiente_nivel"/);
  assert.match(actions, /"debug_finalizar_partida"/);
  assert.match(actions, /document\.querySelectorAll\("\[data-debug-tools\]"\)/);
  assert.match(actions, /grupo\.hidden = !modo_debug_control_activo/);
  assert.match(actions, /document\.querySelectorAll\("\[data-debug-action\]"\)/);
});

test("Debug contextual controls and secret feedback retain usable responsive layout", () => {
  const css = read("game/control/index.css");
  assert.match(css, /\.control-debug-secret-trigger\s*\{/);
  assert.match(css, /\.control-debug-secret-toast\s*\{/);
  assert.match(css, /\.debug-context-tools\s*\{[\s\S]*grid-template-columns: auto repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.debug-context-tools\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
});
