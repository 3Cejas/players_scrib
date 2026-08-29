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
  const representacion = html.match(/<div id="control_panel_representacion"[\s\S]*?<div id="control_panel_asistencia"/)?.[0] || "";

  assert.match(html, /id="control_tabs_viewport"[^>]*role="tablist"/);
  assert.equal((html.match(/data-control-tab="(?:tutorial|detonadores|juego|representacion|asistencia)"/g) || []).length, 5);
  assert.match(html, /id="control_tabs_prev"[^>]*hidden/);
  assert.match(html, /id="control_tabs_next"[^>]*hidden/);
  assert.match(html, /data-control-tab="juego"[^>]*aria-selected="true"[^>]*tabindex="0"/);
  assert.ok(
    html.indexOf('data-control-tab="asistencia"') < html.indexOf('data-control-tab="tutorial"'),
    "Assistance must be the first tab, immediately before Tutorial"
  );

  assert.match(tutorial, /id="videotutorial_control"/);
  assert.doesNotMatch(tutorial, /Puedes reproducirlo antes o durante el tutorial\.|VIDEOTUTORIAL PREVIO|INTERVALO AUTOM&Aacute;TICO/);
  assert.match(tutorial, /id="boton_vista_tutorial"[^>]*data-vista-principal="tutorial"[^>]*onclick="mostrar_vista_tutorial\(\)"[^>]*>[^<]*VISTA TUTORIAL/);
  assert.doesNotMatch(tutorial, /boton_banderas_musas|data-solicitud-calentamiento/);

  assert.match(detonadores, /id="boton_vista_calentamiento"[^>]*data-vista-principal="detonadores"[^>]*onclick="mostrar_vista_detonadores\(\)"[^>]*>[^<]*VISTA DETONADORES/);
  assert.match(detonadores, /id="boton_banderas_musas"/);
  assert.equal((detonadores.match(/data-solicitud-calentamiento=/g) || []).length, 3);
  assert.doesNotMatch(detonadores, /id="videotutorial_control"/);
  assert.match(html, /id="control_panel_juego"[\s\S]*id="boton_vista_partida"[^>]*data-vista-principal="partida"[^>]*onclick="mostrar_vista_partida\(\)"/);
  assert.match(html, /id="boton_vista_puntuacion" class="btn"/);
  assert.match(representacion, /id="boton_editar_creditos"[^>]*aria-expanded="false"[^>]*aria-controls="panel_creditos_representacion"[^>]*onclick="toggleCreditos\(\)"/);
  assert.match(representacion, /id="panel_creditos_representacion" class="creditos-host panel-oculto"[^>]*aria-hidden="true"/);
  assert.ok(
    html.indexOf("./js/muse-help-control.js?v=20260829c") < html.lastIndexOf("</body>"),
    "Control interaction modules must execute inside body"
  );

  assert.match(css, /\.control-tabs-viewport\s*\{[\s\S]*overflow-x: auto;[\s\S]*scroll-behavior: smooth;/);
  assert.match(css, /\.control-tabs-shell\s*\{[\s\S]*grid-template-columns:\s*2rem minmax\(0, 1fr\) 2rem;/);
  assert.match(css, /\.control-tabs-arrow\[hidden\]\s*\{[\s\S]*display: inline-grid !important;[\s\S]*visibility: hidden;/);
  assert.match(css, /\.control-tabs-shell::before,[\s\S]*\.control-tabs-shell::after[\s\S]*pointer-events: none;/);
  assert.match(css, /\.control-tabs-shell\[data-has-previous="true"\]::before,[\s\S]*\.control-tabs-shell\[data-has-next="true"\]::after[\s\S]*opacity: 1;/);
  assert.match(css, /#boton_vista_tutorial\[data-active="1"\][\s\S]*#boton_vista_calentamiento\[data-active="1"\][\s\S]*#boton_vista_partida\[data-active="1"\]/);
  assert.match(css, /#boton_vista_puntuacion,[\s\S]*border:\s*1px solid rgba\(69, 243, 255, 0\.56\);[\s\S]*rgba\(4, 11, 19, 0\.92\);/);
  assert.match(css, /control-group--representacion\.is-creditos-open[\s\S]*> \.creditos-host[\s\S]*overflow: auto;/);
  assert.match(css, /Separacion de capas: escritoras no invaden la navegacion ni Parametros/);
  assert.match(css, /#contenedor\s*\{[\s\S]*flex: 0 0 auto;[\s\S]*position: relative;[\s\S]*z-index: 1;/);
  assert.match(css, /table\.default\s*\{[\s\S]*position: relative;[\s\S]*z-index: 3;[\s\S]*isolation: isolate;/);
  assert.match(css, /> \.creditos-host\s*\{[\s\S]*max-height: 100%;[\s\S]*overscroll-behavior: contain;[\s\S]*contain: layout paint;/);
  assert.ok(
    html.indexOf('id="boton_colapsar_parametros"') < html.indexOf('id="control_title_parameters_text"'),
    "the Parameters collapse action must be the leftmost item in its header"
  );
  assert.match(css, /#control_title_parameters\s*\{[\s\S]*justify-content: flex-start;/);
  assert.match(css, /control-group--representacion #boton_editar_creditos[\s\S]*color: var\(--group-text\);[\s\S]*box-shadow: 0 0\.2em var\(--group-shadow\);/);

  assert.match(actions, /function actualizarFlechasPestanasControl\(\)/);
  assert.match(actions, /shell\.dataset\.hasPrevious = mostrarAnterior \? "true" : "false"/);
  assert.match(actions, /shell\.dataset\.hasNext = mostrarSiguiente \? "true" : "false"/);
  assert.match(actions, /viewport\.scrollTo\(\{ left: destino, behavior: "smooth" \}\)/);
  assert.match(actions, /boton\.setAttribute\("aria-selected", activa \? "true" : "false"\)/);
  assert.match(actions, /function mostrar_vista_tutorial\(\)\s*\{\s*aplicarVistaPrincipalControl\("tutorial"\);\s*\}/);
  assert.match(actions, /function mostrar_vista_detonadores\(\)\s*\{\s*aplicarVistaPrincipalControl\("detonadores"\);\s*\}/);
  assert.match(actions, /function mostrar_vista_partida\(\)\s*\{\s*aplicarVistaPrincipalControl\("partida"\);\s*\}/);
  assert.match(actions, /const modoEspectador = destino === "tutorial" \? "tutorial" : "partida"/);
  assert.match(actions, /vista_espectador_modo === "tutorial"/);
  assert.match(actions, /modoServidor === "calentamiento" \|\| vista_calentamiento/);
  assert.match(actions, /function actualizarBotonesVistaPrincipalControl\(\)[\s\S]*document\.querySelectorAll\("\[data-vista-principal\]"\)[\s\S]*aria-pressed/);
  assert.match(actions, /if \(seccion === "asistencia" && !parametros_colapsados_control\)\s*\{\s*setPanelParametrosColapsadoControl\(true\);/);
  assert.doesNotMatch(actions, /classList\.toggle\("asistencia-activa"/);
  assert.match(actions, /control\.button\.detonators_view[\s\S]*VISTA DETONADORES/);
  assert.match(actions, /function prepararCreditosRepresentacionControl\(\)/);
  assert.match(actions, /panelRepresentacion\.classList\.add\("is-creditos-open"\)/);
  assert.match(actions, /socket\.emit\("creditos_actualizar", \{ creditos/);
  assert.doesNotMatch(actions, /destino\.textContent\s*=\s*vista_calentamiento\s*\?/);
});
