const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function runConfig(url) {
  const location = new URL(url);
  const window = { location };
  vm.runInNewContext(read("game/config.js"), {
    window,
    URL,
    URLSearchParams,
    Set,
    String
  }, { filename: "game/config.js" });
  return window;
}

test("public SCRIB hosts connect Socket.IO to their own origin, never to the muse phone", () => {
  const production = runConfig("https://www.scribshow.es/game/public/players/index.html");
  assert.equal(production.isProduction, true);
  assert.equal(production.SERVER_URL_PROD, "https://www.scribshow.es");

  const canonical = runConfig("https://scribshow.es/game/public/players/index.html");
  assert.equal(canonical.isProduction, true);
  assert.equal(canonical.SERVER_URL_PROD, "https://scribshow.es");

  const development = runConfig("http://localhost:8080/game/public/players/index.html");
  assert.equal(development.isProduction, false);
  assert.equal(development.SERVER_URL_DEV, "http://localhost:3000");

  const state = read("game/public/players/js/state.js");
  assert.match(state, /isProduction[\s\S]*SERVER_URL_PROD[\s\S]*SERVER_URL_DEV/);
  assert.match(state, /io\(serverUrl, \{ autoConnect: false \}\)/);
});

test("muses get a gentle permission and reconnection notice instead of an empty screen", () => {
  const html = read("game/public/players/index.html");
  const css = read("game/public/players/css/publico.css");
  const events = read("game/public/players/js/socket-events.js");

  assert.match(html, /id="musa_connection_notice"[^>]*hidden[^>]*role="alertdialog"/);
  assert.match(html, /Si el navegador te pide permiso para usar esta p&aacute;gina, ac&eacute;ptalo/);
  assert.match(html, /id="musa_connection_retry"[^>]*>ACTIVAR Y REINTENTAR<\/button>/);
  assert.match(css, /\.musa-connection-notice\s*\{[\s\S]*position:\s*fixed;[\s\S]*place-items:\s*center;/);
  assert.match(css, /\.musa-connection-notice\[hidden\]\s*\{[\s\S]*display:\s*none !important;/);
  assert.match(events, /function programarAvisoConexionMusa\(/);
  assert.match(events, /socket\.on\('connect_error'[\s\S]*programarAvisoConexionMusa\(900\)/);
  assert.match(events, /musa_aviso_conexion_boton\.addEventListener\("click"[\s\S]*socket\.connect\(\)/);
});

test("muse registration gates help and refreshes tutorial, warmup and live counters immediately", () => {
  const museEvents = read("game/public/players/js/socket-events.js");
  const help = read("game/public/players/js/musa-help.js");
  const controlEvents = read("game/control/js/socket-events.js");

  assert.match(museEvents, /function registrarMusaEnServidor\(\)[\s\S]*socket\.emit\('registrar_musa'/);
  assert.match(museEvents, /ayuda_musa_controlador\.setRegistrationReady\(true\)[\s\S]*pedir_pre_show_estado[\s\S]*pedir_video_tutorial_estado/);
  assert.match(help, /if \(!socket\.connected \|\| !estadoLocal\.registroListo\)/);
  assert.match(controlEvents, /socket\.on\('actualizar_contador_musas'[\s\S]*actualizarMusasMarcadorControl\(1[\s\S]*actualizarMusasMarcadorControl\(2/);
});
