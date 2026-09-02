const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("credits are rendered and scored locally on spectator and muse screens", () => {
  const spectatorHtml = read("game/spectator/index.html");
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorCss = read("game/css/dashboard-players.css");
  const museHtml = read("game/public/players/index.html");
  const museState = read("game/public/players/js/state.js");
  const museCss = read("game/public/players/css/publico.css");
  const museSockets = read("game/public/players/js/socket-events.js");

  assert.match(spectatorHtml, /id="creditos_audio_espectador"[\s\S]*3\.%20CREDITOS\.mp3/);
  assert.match(spectatorState, /reproducirMusicaCreditosEspectador/);
  assert.match(spectatorState, /creditos-apertura__logo/);
  assert.match(museHtml, /id="creditos_musa"[\s\S]*id="creditos_musa_sociales"/);
  assert.doesNotMatch(museHtml, /id="creditos_audio_musa"/);
  assert.doesNotMatch(museState, /reproducirMusicaCreditosMusa|detenerMusicaCreditosMusa/);
  assert.match(museHtml, /domains\/credits\.js/);
  assert.match(museState, /function actualizarCreditosMusa/);
  assert.match(museState, /estado_creditos_musa\.mostrar[\s\S]*vista_modo_remota_musa === "creditos"/);
  assert.match(museState, /animarTransicionVistaMusa\("creditos"\)/);
  assert.match(museState, /animationName !== "creditosMusaRoll"[\s\S]*finalizarCreditosMusa/);
  assert.doesNotMatch(museState, /timeout_feedback_post_creditos_musa|CREDITOS_MUSA_SOCIALES_DURACION_MS/);
  assert.match(museState, /GRACIAS, \$\{nombreMusaCreditos\}, POR FORMAR PARTE DE <SCRI> B/);
  assert.match(museCss, /\.creditos-musa--finalizados \.creditos-musa__sociales/);
  assert.match(spectatorCss, /\.creditos-espectador\.creditos-finalizados \.creditos-sociales-final/);
  for (const html of [spectatorHtml, museHtml]) {
    assert.match(html, /https:\/\/www\.instagram\.com\/su\.tu\.ra\//);
    assert.match(html, /https:\/\/www\.instagram\.com\/scrib_show\//);
    assert.match(html, /https:\/\/es\.linkedin\.com\/company\/suturateatro/);
    assert.match(html, /GRACIAS POR FORMAR PARTE DE &lt;SCRI&gt; B/);
    assert.match(html, /creditos-social-card--feedback/);
    assert.doesNotMatch(html, /<strong>Instagram<\/strong>|<strong>LinkedIn<\/strong>/);
  }
  assert.match(museSockets, /socket\.on\('creditos_estado'/);
  assert.match(museSockets, /socket\.emit\('pedir_creditos_estado'\)/);
  assert.equal(fs.existsSync(path.join(root, "game/audio/3. CREDITOS.mp3")), true);
});

test("giant timer is a dedicated synced scene on spectator and muse screens", () => {
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorSockets = read("game/spectator/js/socket-events.js");
  const museHtml = read("game/public/players/index.html");
  const museState = read("game/public/players/js/state.js");
  const museSockets = read("game/public/players/js/socket-events.js");

  assert.match(spectatorState, /CUENTA ATR&Aacute;S PARA LA REPRESENTACI&Oacute;N/);
  assert.match(spectatorState, /Es hora de ver la representaci&oacute;n de los textos\./);
  assert.match(spectatorState, /function aplicarEstadoTemporizadorGigante/);
  assert.match(spectatorSockets, /temporizador_gigante_estado/);
  assert.match(museHtml, /id="temporizador_musa"/);
  assert.match(museHtml, /Es hora de ver la representaci&oacute;n de los textos\./);
  assert.match(museState, /function aplicarEstadoTemporizadorMusa/);
  assert.match(museState, /payload\.fin_ts/);
  assert.match(museState, /forzarRestante !== null[\s\S]*Number\.isFinite\(Number\(forzarRestante\)\)/);
  assert.match(museSockets, /socket\.emit\('pedir_temporizador_gigante_estado'\)/);
});

test("credits editor and result use the standard section button style", () => {
  const controlHtml = read("game/control/index.html");
  const controlCss = read("game/control/index.css");

  assert.match(controlHtml, /id="boton_vista_puntuacion" class="btn btn-estandar-seccion"/);
  assert.match(controlHtml, /id="boton_editar_creditos" class="btn btn-estandar-seccion"/);
  assert.match(controlCss, /#panel_controles #boton_vista_puntuacion\.btn-estandar-seccion/);
  assert.match(controlCss, /#panel_controles #boton_editar_creditos\.btn-estandar-seccion/);
});
