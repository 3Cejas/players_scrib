const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("Control separates Tutorial and Detonadores into accessible scrollable tabs", () => {
  const html = read("game/control/index.html");
  const css = read("game/control/index.css");
  const actions = read("game/control/js/actions.js");
  const tutorial = html.match(/<div id="control_panel_tutorial"[\s\S]*?<\/div>\s*<\/div>\s*<div id="control_panel_detonadores"/)?.[0] || "";
  const detonadores = html.match(/<div id="control_panel_detonadores"[\s\S]*?<\/div>\s*<div id="control_panel_juego"/)?.[0] || "";

  assert.match(html, /id="control_tabs_viewport"[^>]*role="tablist"/);
  assert.equal((html.match(/data-control-tab="(?:tutorial|detonadores|juego|representacion|asistencia)"/g) || []).length, 5);
  assert.match(html, /id="control_tabs_prev"[^>]*hidden/);
  assert.match(html, /id="control_tabs_next"[^>]*hidden/);
  assert.match(html, /data-control-tab="juego"[^>]*aria-selected="true"[^>]*tabindex="0"/);

  assert.match(tutorial, /id="videotutorial_control"/);
  assert.match(tutorial, /id="boton_vista_tutorial"[^>]*>[^<]*VISTA TUTORIAL/);
  assert.doesNotMatch(tutorial, /boton_banderas_musas|data-solicitud-calentamiento/);

  assert.match(detonadores, /id="boton_vista_calentamiento"[^>]*>[^<]*VISTA DETONADORES/);
  assert.match(detonadores, /id="boton_banderas_musas"/);
  assert.equal((detonadores.match(/data-solicitud-calentamiento=/g) || []).length, 3);
  assert.doesNotMatch(detonadores, /id="videotutorial_control"/);

  assert.match(css, /\.control-tabs-viewport\s*\{[\s\S]*overflow-x: auto;[\s\S]*scroll-behavior: smooth;/);
  assert.match(css, /\.control-tabs-arrow\[hidden\]\s*\{[\s\S]*display: none !important;/);
  assert.match(css, /table\.default\.asistencia-activa\s*\{[\s\S]*position: fixed;[\s\S]*inset:/);
  assert.match(css, /table\.default\.asistencia-activa[\s\S]*\.asistencia-control[\s\S]*height: 100%;/);

  assert.match(actions, /function actualizarFlechasPestanasControl\(\)/);
  assert.match(actions, /viewport\.scrollTo\(\{ left: destino, behavior: "smooth" \}\)/);
  assert.match(actions, /boton\.setAttribute\("aria-selected", activa \? "true" : "false"\)/);
  assert.match(actions, /function mostrar_vista_tutorial\(\)[\s\S]*cambiar_vista_calentamiento[\s\S]*cambiar_vista_espectador_modo/);
  assert.match(actions, /control\.button\.detonators_view[\s\S]*VISTA DETONADORES/);
});
