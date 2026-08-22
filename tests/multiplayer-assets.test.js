const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ASSET_VERSION = "20260504e";
const CSS_VERSION = "20260505i";
const I18N_VERSION = "20260822a";
const PLAYER_ACTIONS_VERSION = "20260504f";
const PLAYER_STATE_VERSION = "20260505d";
const PLAYER_SOCKET_EVENTS_VERSION = "20260506e";
const SPECTATOR_STATE_VERSION = "20260517a";
const SPECTATOR_SOCKET_EVENTS_VERSION = "20260506a";
const JURY_CSS_VERSION = "20260506t";
const JURY_STATE_VERSION = "20260506g";
const JURY_SOCKET_EVENTS_VERSION = "20260506b";
const CONTROL_CSS_VERSION = "20260506c";
const CONTROL_ACTIONS_VERSION = "20260506d";
const CONTROL_STATE_VERSION = "20260506a";
const CONTROL_SOCKET_EVENTS_VERSION = "20260506b";
const PUBLIC_PLAYER_ACTIONS_VERSION = "20260504f";
const PUBLIC_PLAYER_STATE_VERSION = "20260822a";
const PUBLIC_PLAYER_SOCKET_EVENTS_VERSION = "20260822a";
const ACTOR_SELECTOR_VERSION = "20260505a";
const ACTOR_SOURCE_CSS_VERSION = "20260505f";
const ACTOR_SOURCE_ACTIONS_VERSION = "20260505c";
const ACTOR_SOURCE_ANNOTATIONS_VERSION = "20260505c";
const ACTOR_SOURCE_SOCKET_EVENTS_VERSION = "20260505c";

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function assertIncludesAsset(htmlRelPath, assetPath, version = ASSET_VERSION) {
  const html = read(htmlRelPath);
  assert.match(
    html,
    new RegExp(`${assetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?v=${version}`),
    `${htmlRelPath} should load ${assetPath} with current cache-busting version`
  );
}

test("multiplayer html references current changed shared assets", () => {
  [
    "game/index.html",
    "game/players/index.html",
    "game/spectator/index.html",
    "game/public/index.html",
    "game/actors/index.html"
  ].forEach((htmlRelPath) => {
    assertIncludesAsset(htmlRelPath, "dashboard-players.css", CSS_VERSION);
  });

  [
    "game/players/index.html",
    "game/spectator/index.html",
    "game/public/players/index.html",
    "game/control/index.html",
    "game/actors/source/index.html"
  ].forEach((htmlRelPath) => {
    assertIncludesAsset(htmlRelPath, "domains/inspiration.js");
    assertIncludesAsset(htmlRelPath, "js/i18n.js", I18N_VERSION);
  });

  assertIncludesAsset("game/players/index.html", "js/actions.js", PLAYER_ACTIONS_VERSION);
  assertIncludesAsset("game/players/index.html", "js/state.js", PLAYER_STATE_VERSION);
  assertIncludesAsset("game/players/index.html", "js/socket-events.js", PLAYER_SOCKET_EVENTS_VERSION);
  assertIncludesAsset("game/players/index.html", "domains/editor-deletion.js");

  assertIncludesAsset("game/spectator/index.html", "js/state.js", SPECTATOR_STATE_VERSION);
  assertIncludesAsset("game/spectator/index.html", "js/socket-events.js", SPECTATOR_SOCKET_EVENTS_VERSION);
  assertIncludesAsset("game/spectator/index.html", "domains/credits.js");

  assertIncludesAsset("game/jurado/index.html", "index.css", JURY_CSS_VERSION);
  assertIncludesAsset("game/jurado/index.html", "js/state.js", JURY_STATE_VERSION);
  assertIncludesAsset("game/jurado/index.html", "js/socket-events.js", JURY_SOCKET_EVENTS_VERSION);

  assertIncludesAsset("game/control/index.html", "index.css", CONTROL_CSS_VERSION);
  assertIncludesAsset("game/control/index.html", "js/actions.js", CONTROL_ACTIONS_VERSION);
  assertIncludesAsset("game/control/index.html", "js/state.js", CONTROL_STATE_VERSION);
  assertIncludesAsset("game/control/index.html", "js/socket-events.js", CONTROL_SOCKET_EVENTS_VERSION);
  assertIncludesAsset("game/control/index.html", "domains/credits.js");

  assertIncludesAsset("game/public/players/index.html", "js/actions.js", PUBLIC_PLAYER_ACTIONS_VERSION);
  assertIncludesAsset("game/public/players/index.html", "js/state.js", PUBLIC_PLAYER_STATE_VERSION);
  assertIncludesAsset("game/public/players/index.html", "js/socket-events.js", PUBLIC_PLAYER_SOCKET_EVENTS_VERSION);

  assertIncludesAsset("game/actors/index.html", "js/actor-selector.js", ACTOR_SELECTOR_VERSION);
  assertIncludesAsset("game/actors/source/index.html", "css/publico.css", ACTOR_SOURCE_CSS_VERSION);
  assertIncludesAsset("game/actors/source/index.html", "js/actions.js", ACTOR_SOURCE_ACTIONS_VERSION);
  assertIncludesAsset("game/actors/source/index.html", "js/annotations.js", ACTOR_SOURCE_ANNOTATIONS_VERSION);
  assertIncludesAsset("game/actors/source/index.html", "js/socket-events.js", ACTOR_SOURCE_SOCKET_EVENTS_VERSION);
});

test("muse tutorial localizes server-side offensive-language rejections", () => {
  const i18n = read("game/js/i18n.js");
  const state = read("game/public/players/js/state.js");
  const socketEvents = read("game/public/players/js/socket-events.js");

  assert.equal((i18n.match(/"warmup\.feedback\.inappropriate_language"/g) || []).length, 3);
  assert.match(state, /data && data\.codigo === "CONTENIDO_NO_PERMITIDO"/);
  assert.match(state, /warmup\.feedback\.inappropriate_language/);
  assert.match(state, /let timeoutRespuesta = null/);
  assert.match(state, /calentamiento_timeout_respuesta === timeoutRespuesta/);
  assert.match(state, /socket\.emit\("calentamiento_intento", \{ palabra: contenido \}, procesarRespuesta\)/);
  assert.match(state, /if \(!respuesta \|\| respuesta\.ok !== true\)/);
  assert.match(state, /if \(!respuesta \|\| respuesta\.ok !== true\)[\s\S]*return;[\s\S]*calentamiento_input\.value = ""/);
  assert.match(socketEvents, /mostrarFeedbackCalentamiento\(\s*mensajeErrorCalentamiento\(data\),\s*true\s*\)/);
});

test("writer role scripts are inside body before live-server injection point", () => {
  const html = read("game/players/index.html");
  const bodyCloseIndex = html.indexOf("</body>");
  const socketEventsIndex = html.indexOf("./js/socket-events.js");
  const indexModuleIndex = html.indexOf("./js/index.js");

  assert.ok(bodyCloseIndex > 0, "writer HTML should close body");
  assert.ok(socketEventsIndex > 0 && socketEventsIndex < bodyCloseIndex);
  assert.ok(indexModuleIndex > socketEventsIndex && indexModuleIndex < bodyCloseIndex);
});

test("jury role exposes read-only judging workflow", () => {
  const landingHtml = read("game/index.html");
  const html = read("game/jurado/index.html");
  const css = read("game/jurado/index.css");
  const state = read("game/jurado/js/state.js");
  const socketEvents = read("game/jurado/js/socket-events.js");
  const index = read("game/jurado/js/index.js");

  assert.match(landingHtml, /href="\.\/jurado\/index\.html"/);
  assert.match(html, /id="jurado_app"/);
  assert.match(html, /<link rel="icon" href="\.\.\/\.\.\/img\/logo\.png" type="image\/png" \/>/);
  assert.match(html, /class="jury-brand remote-brand-card"/);
  assert.match(html, /class="ascii control-brand"[\s\S]*<pre class="neon jury-brand__ascii"[\s\S]*\/ ____\|[\s\S]*&lt; &lt;[\s\S]*&gt; &gt;[\s\S]*\|____\/<\/pre>/);
  assert.match(html, /class="jury-header-title"[\s\S]*class="remote-brand-control-label">JURADO<\/span>[\s\S]*class="jury-header-subtitle">LECTURA EN DIRECTO &middot; CRITERIO VIVO<\/span>/);
  assert.match(html, /id="jurado_status_dot" class="conexion-dot conexion-dot--mini conexion-dot--off" data-status="off"/);
  assert.match(html, /id="jurado_status_text" class="remote-status-state is-off">DESCONECTADO<\/span>/);
  assert.doesNotMatch(html, /<span class="remote-status-role">JURADO<\/span>/);
  assert.doesNotMatch(html, /id="jurado_modo"|MODO: PARTIDA/);
  assert.doesNotMatch(html, /id="jurado_refresh_data"/);
  assert.doesNotMatch(html, /AZUL|ROJO|ROJA/);
  assert.doesNotMatch(html, /jurado_chars_|caracteres/);
  assert.match(html, /id="jurado_vida_1" class="jury-tiempo-vida"/);
  assert.match(html, /class="jury-writer-header-stats"/);
  assert.match(html, /class="jury-writer-text-shell jury-writer-text-shell--j1"/);
  assert.match(html, /writer-stat-icon"[^>]*>&#x1F58B;&#xFE0F;<\/span><span id="jurado_words_1"/);
  assert.match(html, /writer-stat-icon"[^>]*>&#x1F3A8;<\/span><span id="jurado_musas_1"/);
  assert.match(html, /data-jury-panel="textos"/);
  assert.match(html, /data-jury-panel="estadisticas"/);
  assert.match(html, /data-jury-panel="inspiracion"/);
  assert.match(html, /data-jury-panel="notas"/);
  assert.match(html, /data-jury-panel="evaluacion"/);
  assert.match(html, /data-jury-panel="textos"[\s\S]*class="jury-tab__icon"[\s\S]*&#x1F58B;&#xFE0F;/);
  assert.match(html, /data-jury-panel="estadisticas"[\s\S]*class="jury-tab__icon"[\s\S]*&#x1F4CA;/);
  assert.match(html, /data-jury-panel="inspiracion"[\s\S]*class="jury-tab__icon"[\s\S]*&#x2601;&#xFE0F;/);
  assert.match(html, /data-jury-panel="notas"[\s\S]*class="jury-tab__icon"[\s\S]*&#x1F4DD;/);
  assert.match(html, /data-jury-panel="evaluacion"[\s\S]*class="jury-tab__icon"[\s\S]*&#x1F3AF;/);
  assert.match(html, /id="jurado_texto_1"/);
  assert.match(html, /id="jurado_texto_2"/);
  assert.match(html, /id="jurado_nota_1"/);
  assert.match(html, /id="jurado_nota_2"/);
  assert.match(html, /data-eval-scope="writing"/);
  assert.match(html, /data-eval-scope="muses"/);
  assert.match(html, /id="jurado_eval_writing" class="criteria-list criteria-list--comparison" data-eval-scope="writing"/);
  assert.match(html, /id="jurado_eval_muses" class="criteria-list criteria-list--comparison" data-eval-scope="muses"/);
  assert.doesNotMatch(html, /jurado_eval_writing_1|jurado_eval_writing_2|jurado_eval_muses_1|jurado_eval_muses_2/);
  assert.doesNotMatch(html, /writer-board__kicker/);

  assert.match(css, /\.jury-tabs/);
  assert.match(css, /\.remote-brand-card \.control-brand\s*\{[\s\S]*width: clamp\(8\.55rem, 11\.1vw, 10\.7rem\);[\s\S]*height: clamp\(1\.38rem, 1\.92vw, 1\.78rem\);[\s\S]*overflow: hidden;/);
  assert.match(css, /\.jury-brand\.remote-brand-card\s*\{[\s\S]*border:\s*0;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/);
  assert.match(css, /\.jury-brand \.control-brand\s*\{[\s\S]*width:\s*auto;[\s\S]*height:\s*auto;[\s\S]*overflow:\s*visible;/);
  assert.match(css, /\.jury-brand \.control-brand \.neon\s*\{[\s\S]*font-size:\s*0\.56rem;[\s\S]*line-height:\s*1\.05;/);
  assert.match(css, /\.remote-brand-card \.control-brand \.neon\s*\{[\s\S]*animation: neonEffect 5s infinite;/);
  assert.match(css, /\.remote-brand-control-label\s*\{[\s\S]*font-family: "Retro-gaming", "Courier New", monospace;[\s\S]*font-size: clamp\(0\.94rem, 1\.18vw, 1\.38rem\);[\s\S]*text-shadow:/);
  assert.match(css, /\.jury-header\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\);/);
  assert.match(css, /\.jury-header-title\s*\{[\s\S]*justify-items:\s*center;[\s\S]*text-align:\s*center;/);
  assert.match(css, /\.jury-header-title \.remote-brand-control-label\s*\{[\s\S]*font-size:\s*clamp\(1\.1rem, 1\.65vw, 1\.85rem\);/);
  assert.match(css, /\.jury-header-subtitle\s*\{[\s\S]*color:\s*color-mix\(in srgb, var\(--jury-gold\), white 18%\);/);
  assert.match(css, /@keyframes neonEffect/);
  assert.match(css, /\.jury-tab\[data-jury-panel="estadisticas"\]\s*\{[\s\S]*--tab-accent:\s*var\(--jury-gold\)/);
  assert.match(css, /\.jury-tab\[data-jury-panel="inspiracion"\]\s*\{[\s\S]*--tab-accent:\s*var\(--jury-green\)/);
  assert.match(css, /\.jury-panel\[data-jury-panel-target="estadisticas"\]\s*\{[\s\S]*--panel-accent:\s*var\(--jury-gold\)/);
  assert.match(css, /\.jury-panel\[data-jury-panel-target="inspiracion"\]\s*\{[\s\S]*--panel-accent:\s*var\(--jury-green\)/);
  assert.match(css, /\.jury-panel\[data-jury-panel-target="notas"\]\s*\{[\s\S]*--panel-accent:\s*#ff84c7/);
  assert.match(css, /\.jury-panel\.is-active\s*\{[\s\S]*padding:\s*0;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/);
  assert.doesNotMatch(css, /\.jury-panel\.is-active::before/);
  assert.match(css, /\.jury-panel\.is-active \.jury-toolbar\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--panel-accent\)/);
  assert.doesNotMatch(css, /\.jury-panel\.is-active \.jury-toolbar\s*\{[^}]*border-left:/);
  assert.doesNotMatch(css, /writer-board__kicker/);
  assert.match(css, /\.writer-board__header h1\s*\{[\s\S]*margin:\s*0;/);
  assert.doesNotMatch(css, /\.jury-panel\.is-active \.writer-board\s*\{/);
  assert.match(css, /\.jury-tab__icon/);
  assert.match(css, /\.jury-tab:hover \.jury-tab__icon/);
  assert.match(css, /@keyframes juryTabIconPop/);
  assert.match(css, /font-family:\s*"Retro-gaming"/);
  assert.match(css, /url\("\.\.\/css\/fonts\/Retro%20Gaming\.ttf"\)/);
  assert.match(css, /url\("\.\.\/css\/fonts\/VT323-Regular\.ttf"\)/);
  assert.match(css, /\.writer-text/);
  assert.match(css, /content:\s*"Sin datos todavía\."/);
  assert.match(css, /\.writer-text:empty::before,[\s\S]*\.cloud-board:empty::before,[\s\S]*\.stats-grid:empty::before\s*\{[\s\S]*color:\s*color-mix\(in srgb, var\(--panel-accent\), white 34%\);/);
  assert.doesNotMatch(css, /Sin datos todavia/);
  assert.match(css, /\.writer-text\s*\{[\s\S]*font-family:\s*"VT323"/);
  assert.match(css, /\.jury-notes\s*\{[\s\S]*font-family:\s*"VT323"/);
  assert.match(css, /\.writer-board--text\s*\{[\s\S]*rgba\(3, 7, 14, 0\.86\)/);
  assert.match(css, /\.jury-writer-header-stats\s*\{[\s\S]*display:\s*inline-flex/);
  assert.match(css, /\.conexion-dot--ok\s*\{[\s\S]*#2cff6d/);
  assert.match(css, /\.conexion-dot--off\s*\{[\s\S]*#ff9d2e/);
  assert.match(css, /\.remote-status-state\.is-off\s*\{[\s\S]*#ffad42/);
  assert.match(css, /\.jury-tiempo-vida\s*\{[\s\S]*--vida-pct:\s*0%/);
  assert.match(css, /\.jury-compact-life\s*\{[\s\S]*width:\s*clamp\(7\.1rem, 10\.4vw, 9\.8rem\);/);
  assert.match(css, /\.jury-health-label\s*\{[\s\S]*font-size:\s*clamp\(0\.72rem, 0\.86vw, 1rem\);/);
  assert.match(css, /\.jury-tiempo-vida\s*\{[\s\S]*height:\s*0\.72rem;/);
  assert.match(css, /\.writer-stat-icon\s*\{[\s\S]*font-size:\s*clamp\(0\.92rem, 1\.08vw, 1\.24rem\);/);
  assert.match(css, /\.jury-writer-header-stats \.puntos,[\s\S]*\.jury-writer-header-stats \.musas-total\s*\{[\s\S]*font-size:\s*clamp\(0\.86rem, 1vw, 1\.15rem\);/);
  assert.match(css, /\.jury-writer-text-shell\s*\{[\s\S]*grid-template-columns:/);
  assert.match(css, /\.writer-board--one\s*\{[\s\S]*--writer-accent:\s*var\(--jury-blue\)/);
  assert.match(css, /\.writer-board--two\s*\{[\s\S]*--writer-accent:\s*var\(--jury-red\)/);
  assert.match(css, /\.cloud-board/);
  assert.match(css, /\.jury-evaluation-board/);
  assert.match(css, /\.jury-eval-scoreboard\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.criteria-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(10rem, 1fr\) minmax\(8\.5rem, 0\.52fr\) minmax\(10rem, 1fr\);/);
  assert.match(css, /\.criteria-section\s*\{[\s\S]*--criteria-section-accent:\s*var\(--panel-accent\);[\s\S]*border-left-width:\s*3px;[\s\S]*var\(--criteria-section-accent\)/);
  assert.match(css, /\.criteria-section\[data-eval-scope="writing"\]\s*\{[\s\S]*--criteria-section-accent:\s*#bda2ff;/);
  assert.match(css, /\.criteria-section\[data-eval-scope="muses"\]\s*\{[\s\S]*--criteria-section-accent:\s*var\(--jury-green\);/);
  assert.match(css, /\.criteria-row__label\s*\{[\s\S]*grid-column:\s*2;[\s\S]*text-align:\s*center;/);
  assert.match(css, /\.criteria-row__label\s*\{[\s\S]*color:\s*color-mix\(in srgb, var\(--criteria-section-accent\)/);
  assert.match(css, /\.criteria-control--1\s*\{[\s\S]*--writer-accent:\s*var\(--jury-blue\);[\s\S]*grid-column:\s*1;/);
  assert.match(css, /\.criteria-control--2\s*\{[\s\S]*--writer-accent:\s*var\(--jury-red\);[\s\S]*grid-column:\s*3;/);
  assert.match(css, /\.writer-board__score\s*\{[\s\S]*var\(--writer-accent\)/);
  assert.match(css, /\.criteria-title\s*\{[\s\S]*color:\s*color-mix\(in srgb, var\(--criteria-section-accent\)/);
  assert.match(css, /\.criteria-control input\[type="range"\]\s*\{[\s\S]*accent-color:\s*var\(--writer-accent\)/);
  assert.match(css, /\.mini-stats-card/);
  assert.match(css, /\.mini-stats-svg/);
  assert.match(css, /\.mini-key-fill/);
  assert.match(css, /\.stat-card\s*\{[\s\S]*--stat-accent:\s*var\(--panel-accent, var\(--jury-gold\)\);[\s\S]*border-left-color:\s*color-mix\(in srgb, var\(--stat-accent\)/);
  assert.match(css, /\.stat-card__label\s*\{[\s\S]*color:\s*color-mix\(in srgb, var\(--stat-accent\)/);
  assert.match(css, /\.stat-card__icon\s*\{[\s\S]*text-shadow:\s*0 0 0\.32rem color-mix\(in srgb, var\(--stat-accent\)/);
  assert.match(css, /\.jury-panel\[data-jury-panel-target="inspiracion"\]\.is-active \.cloud-word\s*\{[\s\S]*var\(--panel-accent\)/);
  assert.match(css, /\.jury-panel\[data-jury-panel-target="notas"\]\.is-active \.jury-notes\s*\{[\s\S]*color:\s*color-mix\(in srgb, var\(--panel-accent\)/);

  assert.match(state, /const socket = window\.io \? io\(serverUrl, \{ autoConnect: false \}\) : null;/);
  assert.match(state, /const JURADO_STORAGE_KEY = "scrib_jurado_eval_v1"/);
  assert.match(state, /window\.localStorage\.setItem\(JURADO_STORAGE_KEY/);
  assert.match(state, /JURADO_CRITERIOS_ESCRITURA/);
  assert.match(state, /JURADO_CRITERIOS_MUSAS/);
  assert.match(state, /function crearControlCriterioJurado\(id, scope, criterio, labelId\)/);
  assert.match(state, /function crearFilaCriterioJurado\(scope, criterio\)/);
  assert.match(state, /getEl\("jurado_eval_writing"\)/);
  assert.match(state, /getEl\("jurado_eval_muses"\)/);
  assert.doesNotMatch(state, /jurado_eval_writing_\$\{id\}|jurado_eval_muses_\$\{id\}/);
  assert.match(state, /function renderVidaJurado\(id\)/);
  assert.match(state, /dot\.classList\.remove\("conexion-dot--ok", "conexion-dot--warn", "conexion-dot--off", "conexion-dot--ping"\)/);
  assert.match(state, /dot\.classList\.add\(activo \? "conexion-dot--ok" : "conexion-dot--off"\)/);
  assert.match(state, /text\.textContent = activo \? "CONECTADO" : "DESCONECTADO"/);
  assert.doesNotMatch(state, /setTextoJurado\("jurado_modo"/);
  assert.match(state, /bar\.style\.setProperty\("--vida-pct"/);
  assert.match(state, /formatearCantidadJurado\(writer\.words, "palabra", "palabras"\)/);
  assert.match(state, /statsHistory:\s*\[\]/);
  assert.match(state, /function registrarMiniStatsJurado\(id, stats = \{\}\)/);
  assert.match(state, /function renderMiniGraficasStatsJurado\(id, stats = \{\}\)/);
  assert.match(state, /normalizarHeatmapJurado\(data\.heatmap, topTeclas\)/);
  assert.match(state, /palabras:\s*\{ icon: "\\u\{1F58B\}\\uFE0F", label: "Palabras" \}/);
  assert.match(state, /ritmo:\s*\{ icon: "\\u26A1", label: "Ritmo PPM" \}/);
  assert.match(state, /pulsaciones:\s*\{ icon: "\\u2328\\uFE0F", label: "Pulsaciones" \}/);
  assert.match(state, /vida:\s*\{ icon: "\\u2764\\uFE0F", label: "Vida" \}/);
  assert.match(state, /topTeclas:\s*\{ icon: "\\u\{1F51D\}", label: "Top teclas" \}/);
  assert.match(state, /class="stat-card__icon" aria-hidden="true"/);
  assert.match(state, /crearStatCardJurado\("pulsaciones"/);
  assert.doesNotMatch(state, /crearStatCardJurado\("\\u\{1F3A8\} Musas"/);
  assert.doesNotMatch(state, /crearStatCardJurado\("Caracteres"/);
  assert.match(state, /function copiarResumenJurado\(\)/);
  assert.match(state, /window\.scribJurado/);

  assert.match(socketEvents, /socket\.emit\("registrar_jurado"\)/);
  assert.match(socketEvents, /socket\.emit\("pedir_stats_live"\)/);
  assert.match(socketEvents, /socket\.emit\("pedir_nube_inspiracion"\)/);
  assert.match(socketEvents, /socket\.on\("texto1"/);
  assert.match(socketEvents, /socket\.on\("texto2"/);
  assert.match(socketEvents, /socket\.on\("stats_live_estado"/);
  assert.match(socketEvents, /socket\.on\("nube_inspiracion_estado"/);
  assert.match(socketEvents, /socket\.on\("recargar_rol_remoto"/);
  assert.doesNotMatch(socketEvents, /"ERROR"/);
  assert.doesNotMatch(socketEvents, /registrar_control|registrar_escritor|registrar_musa/);

  assert.match(index, /ScribRoleModules\.jurado/);
});

test("visible emoji effects use stable unicode escapes instead of mojibake", () => {
  const playerConfetti = read("game/players/js/socket-events.js");
  const spectatorConfetti = read("game/spectator/js/socket-events.js");
  const publicPlayerConfetti = read("game/public/players/js/socket-events.js");
  const playerState = read("game/players/js/state.js");
  const spectatorState = read("game/spectator/js/state.js");
  const publicPlayerActions = read("game/public/players/js/actions.js");
  const controlActions = read("game/control/js/actions.js");

  [playerConfetti, spectatorConfetti, publicPlayerConfetti].forEach((source) => {
    assert.match(source, /text:\s*["']\\u2B50["']/);
    assert.doesNotMatch(source, /text:\s*["'][\u00e2\u00f0]/);
  });

  [playerState, spectatorState].forEach((source) => {
    assert.match(source, /"\\u\{1F499\}"\s*:\s*"\\u2764\\uFE0F"/);
    assert.doesNotMatch(source, /corazon\.textContent\s*=\s*[^;]*["'][\u00e2\u00f0]/);
  });

  assert.match(publicPlayerActions, /boton\.textContent\s*=\s*"\\u2709\\uFE0F"/);
  assert.match(publicPlayerActions, /boton\.textContent\s*=\s*"\\u270F\\uFE0F"/);

  assert.match(controlActions, /value="\\u274C"/);
  assert.match(controlActions, /value="\\u270F\\uFE0F"/);
  assert.match(controlActions, /"\\u\{1F5F3\}\\uFE0F Puntuaci\\u00f3n del p\\u00fablico = "/);
  assert.match(controlActions, /r\.value\s*=\s*"\\u2705"/);
});

test("writer visible text fallbacks avoid mojibake sequences", () => {
  const playerSocketEvents = read("game/players/js/socket-events.js");
  const playerState = read("game/players/js/state.js");

  assert.match(playerSocketEvents, /Podr&iacute;as escribir la palabra &laquo;/);
  assert.match(playerSocketEvents, /&raquo;/);
  assert.match(playerSocketEvents, /Podr\\u00edas escribir esta palabra/);
  assert.doesNotMatch(playerSocketEvents, /PodrÃ|Podrias|Â«|Â»|Ã‚Â¡Tiempo|Â¡Tiempo|Â¡GRACIAS/);
  assert.match(playerSocketEvents, /"\\u00a1GRACIAS POR JUGAR!"/);
  assert.match(playerSocketEvents, /"\\u00f1"/);
  assert.match(playerSocketEvents, /\\u00c1\\u00c9\\u00cd\\u00d3\\u00da\\u00dc\\u00d1/);

  assert.doesNotMatch(playerState, /Ã‚Â¡Tiempo|Â¡Tiempo|Â¡TEXTO|Â¡PERDISTE|Ã/);
  assert.match(playerState, /"\\u00a1Tiempo!"/);
  assert.match(playerState, /"\\u00a1TEXTO TERMINADO!"/);
  assert.match(playerState, /"\\u00a1PERDISTE, NO ESCRIBISTE NADA!"/);
  assert.match(playerState, /\\\\u00c1\\\\u00c9\\\\u00cd\\\\u00d3\\\\u00da\\\\u00dc\\\\u00d1/);
});

test("letter muse inspirations can be cleared when the queue expires empty", () => {
  const playerSocketEvents = read("game/players/js/socket-events.js");
  const spectatorSocketEvents = read("game/spectator/js/socket-events.js");

  assert.match(playerSocketEvents, /function esPayloadLimpiezaInspiracion/);
  assert.match(playerSocketEvents, /limpiar_inspiracion/);
  assert.match(playerSocketEvents, /inspiracion_caducada/);
  assert.match(playerSocketEvents, /function limpiarInspiracionLetraMusa/);
  assert.match(playerSocketEvents, /modo_actual !== "letra bendita" && modo_actual !== "letra prohibida"/);
  assert.match(playerSocketEvents, /texto\.removeEventListener\("keyup", listener_modo1\)/);
  assert.match(playerSocketEvents, /definicion\.innerHTML = ""/);

  assert.match(spectatorSocketEvents, /function esPayloadLimpiezaInspiracionEspectador/);
  assert.match(spectatorSocketEvents, /limpiar_inspiracion/);
  assert.match(spectatorSocketEvents, /inspiracion_caducada/);
  assert.match(spectatorSocketEvents, /actualizarDefinicionConVisibilidad\(definicionElemento, "", false\)/);
  assert.match(spectatorSocketEvents, /renderInspiracionLetrasEspectador\(1, data, definicion2/);
  assert.match(spectatorSocketEvents, /renderInspiracionLetrasEspectador\(2, data, definicion3/);
});

test("writer client blocks stale duplicate writer sessions", () => {
  const js = read("game/players/js/socket-events.js");
  const state = read("game/players/js/state.js");

  assert.match(js, /socket\.on\("escritor_reemplazado"/);
  assert.match(js, /mostrarAvisoEscritoraReemplazada/);
  assert.match(js, /socket\.disconnect\(\)/);
  assert.match(state, /function obtenerClientIdSesionEscritora\(\)/);
  assert.match(state, /window\.sessionStorage\.getItem\(key\)/);
  assert.match(js, /socket\.emit\('registrar_escritor', \{\s*player,\s*client_id: obtenerClientIdSesionEscritora\(\)\s*\}\);/);
  assert.match(js, /Otra sesi\\u00f3n activa de este rol est\\u00e1 activa/);
});

test("control dashboard keeps remote bar and final phrase controls in the intended areas", () => {
  const html = read("game/control/index.html");
  const css = read("game/control/index.css");
  const actions = read("game/control/js/actions.js");
  const socketEvents = read("game/control/js/socket-events.js");
  const state = read("game/control/js/state.js");
  const i18n = read("game/js/i18n.js");
  const juegoStart = html.indexOf('data-control-section="juego"');
  const juegoEnd = html.indexOf('id="stats_nav_control"', juegoStart);
  assert.ok(juegoStart >= 0 && juegoEnd > juegoStart, "Juego section should exist");
  const juegoSection = html.slice(juegoStart, juegoEnd);

  assert.match(html, /class="remote-status-bar"/);
  assert.match(html, /class="remote-brand-card"/);
  assert.match(html, /<pre class="neon">[\s\S]*__\s+_____[\s\S]*\/ ____\|[\s\S]*&lt; &lt;[\s\S]*&gt; &gt;[\s\S]*\|____\/<\/pre>/);
  assert.match(html, /class="remote-brand-control-label">CONTROL<\/span>/);
  assert.doesNotMatch(html, /\/&lt;SCRI&gt;\\ B\s*\\_______\//);
  assert.doesNotMatch(html, /remote-brand-powered|remote-brand-sutura|powered by|Sutura Teatro/);
  assert.match(html, /id="estado_espectador"/);
  assert.match(html, /id="estado_actor_1"/);
  assert.match(html, /remote-status-role remote-status-role--blue">ACTORES AZULES<\/span>/);
  assert.match(html, /remote-status-role remote-status-role--red">ACTORES ROJOS<\/span>/);
  assert.match(html, /id="boton_reiniciar_escritxr_1"/);
  assert.match(html, /id="boton_reiniciar_espectador"[\s\S]*data-restart-role="espectador" disabled aria-disabled="true"/);
  assert.match(html, /id="boton_reiniciar_actorxs_1"[\s\S]*data-restart-role="actorxs1" disabled aria-disabled="true"/);
  assert.match(html, /id="boton_reiniciar_actorxs_2"[\s\S]*data-restart-role="actorxs2" disabled aria-disabled="true"/);
  assert.match(html, /id="boton_reiniciar_escritxr_1"[\s\S]*data-restart-role="escritxr1" disabled aria-disabled="true"/);
  assert.match(html, /id="boton_reiniciar_escritxr_2"[\s\S]*data-restart-role="escritxr2" disabled aria-disabled="true"/);
  assert.match(html, /id="control_title_representation"[\s\S]*REPRESENTACI&Oacute;N/);
  assert.doesNotMatch(html, /ACTORXS 1|ACTORXS 2/);
  assert.match(html, /id="estado_player_1" class="conexion-dot conexion-dot--writer conexion-dot--off"/);
  assert.match(html, /id="estado_player_2" class="conexion-dot conexion-dot--writer conexion-dot--off"/);
  assert.match(html, /class="writer-connection writer-connection--j1"[\s\S]*id="boton_reiniciar_escritxr_1"[\s\S]*id="estado_player_1_texto"/);
  assert.match(html, /class="writer-connection writer-connection--j2"[\s\S]*id="boton_reiniciar_escritxr_2"[\s\S]*id="estado_player_2_texto"/);
  assert.match(html, /id="estado_player_1_texto" class="remote-status-state writer-connection-state is-off"/);
  assert.match(html, /id="estado_player_2_texto" class="remote-status-state writer-connection-state is-off"/);
  assert.doesNotMatch(html, /class="writer-avatar/);
  assert.match(html, /id="metadatos_control_1" class="writer-header-stats[\s\S]*id="puntos"[\s\S]*id="musas"/);
  assert.match(html, /id="metadatos_control_2" class="writer-header-stats[\s\S]*id="puntos1"[\s\S]*id="musas1"/);
  assert.match(html, /id="metadatos_control_1" class="writer-header-stats[\s\S]*class="writer-compact-life writer-compact-life--j1"[\s\S]*id="tiempo"[\s\S]*id="puntos"/);
  assert.match(html, /id="metadatos_control_2" class="writer-header-stats[\s\S]*class="writer-compact-life writer-compact-life--j2"[\s\S]*id="tiempo1"[\s\S]*id="puntos1"/);
  assert.match(html, /id="puntos" class="puntos">0 palabras<\/span>/);
  assert.match(html, /id="musas" class="musas-total">0 musas<\/span>/);
  assert.match(html, /id="puntos1" class="puntos">0 palabras<\/span>/);
  assert.match(html, /id="musas1" class="musas-total">0 musas<\/span>/);
  assert.doesNotMatch(html, /class="writer-meta-row"/);
  assert.match(html, /id="boton_fin_j1" class='btn btn-fin btn-fin--j1'/);
  assert.match(html, /id="boton_fin_j2" class='btn btn-fin btn-fin--j2'/);
  assert.match(html, /<span class="writer-health-label">VIDA<\/span>/);
  assert.match(html, /<span class="writer-health-label writer-health-label--j2">VIDA<\/span>/);
  assert.doesNotMatch(html, /SALUD \/ TIEMPO/);
  assert.match(html, /id="boton_ver_logs"/);
  assert.match(html, /id="boton_skip_tertulia"/);
  assert.match(html, /id="stats_nav_prev"[^>]*class="btn stats-nav-button stats-nav-button--prev"[^>]*><\/button>/);
  assert.match(html, /id="stats_nav_next"[^>]*class="btn stats-nav-button stats-nav-button--next"[^>]*><\/button>/);
  assert.doesNotMatch(html, /id="stats_nav_prev"[^>]*>[\s\S]*?&#x2B05;|id="stats_nav_next"[^>]*>[\s\S]*?&#x27A1;/);
  assert.match(html, /id="line_numbers_j1"/);
  assert.match(html, /id="line_numbers_j2"/);
  assert.match(
    html,
    /<span data-mode="letra bendita">LB<\/span>\s*<span data-mode="letra prohibida">LP<\/span>\s*<span data-mode="tertulia">T<\/span>\s*<span data-mode="palabras bonus">PB<\/span>\s*<span data-mode="palabras prohibidas">PP<\/span>\s*<span data-mode="frase final">F<\/span>/
  );
  assert.match(html, /<span>TIEMPO RESTANTE<\/span>/);
  assert.doesNotMatch(html, /<span>DURACI&Oacute;N<\/span>/);
  assert.match(html, /id="level_status_witnesses" class="level-status-witnesses"[\s\S]*id="control_desventaja_activa"[\s\S]*id="control_desventaja_activa_icon"[\s\S]*id="control_desventaja_activa_time"[\s\S]*id="control_votacion_desventaja"[\s\S]*&#x1F5F3;&#xFE0F;[\s\S]*id="control_palabra_musa_j1"[\s\S]*id="control_palabra_musa_j1_word"[\s\S]*id="control_palabra_musa_j1_time"[\s\S]*id="control_palabra_musa_j1_queue"[\s\S]*id="control_palabra_musa_j2"[\s\S]*id="control_palabra_musa_j2_word"[\s\S]*id="control_palabra_musa_j2_time"[\s\S]*id="control_palabra_musa_j2_queue"/);
  assert.match(html, /id="control_palabra_musa_j1"[\s\S]*&#x1F3A8;[\s\S]*id="control_palabra_musa_j2"[\s\S]*&#x1F3A8;/);
  assert.doesNotMatch(html, />M1<|>M2</);
  assert.doesNotMatch(html, /id="control_desventaja_j1"|id="control_desventaja_j2"|D AZUL|D ROJO/);
  assert.doesNotMatch(html, /level-legend|LB: Letra Bendita|LP: Letra Prohibida/);
  assert.match(html, /<tbody id="panel_parametros" class="control-params-panel">/);
  assert.doesNotMatch(html, /id="panel_parametros" class="[^"]*control-collapsible/);
  assert.match(html, /id="parametros_modos_dropdown" class="parametros-modos-dropdown"/);
  assert.match(html, /id="boton_modos_dropdown"[\s\S]*aria-expanded="false"[\s\S]*aria-controls="parametros_modos_menu"/);
  assert.match(html, /id="resumen_modos_control" class="parametros-modos-summary"/);
  assert.match(html, /id="parametros_modos_menu" class="parametros-modos-menu" hidden/);
  assert.match(html, /id="parametros_modos_menu"[\s\S]*id="listaModosForm"[\s\S]*id="listaModos"/);
  assert.match(html, /class="parametros-bottom-actions"[\s\S]*id="parametros_modos_dropdown"[\s\S]*id="boton_borrar_texto_guardado"[\s\S]*class="btn parametros-delete-toggle"[\s\S]*aria-pressed="false"[\s\S]*>BORRAR TEXTO<\/button>/);
  assert.doesNotMatch(juegoSection, /id="boton_borrar_texto_guardado"|BORRAR TEXTO|&#x232B;/);
  assert.doesNotMatch(html, /&#x232B; BORRAR TEXTO/);
  assert.doesNotMatch(html, /BORRAR TEXTO: (?:ON|OFF)/);
  assert.match(html, /data-control-section="tutorial"/);
  assert.match(html, /data-control-section="juego"/);
  assert.match(html, /data-control-section="representacion"/);
  assert.match(html, /data-control-section="representacion"[\s\S]*id="boton_teleprompter"[\s\S]*id="panel_teleprompter_representacion"/);
  assert.match(html, /id="boton_volver_representacion_teleprompter"[\s\S]*onclick="volverMenuRepresentacionTeleprompter\(\)"/);
  assert.doesNotMatch(html, /calentamiento_solicitud_actual|DETONADOR ACTUAL/);
  assert.match(html, /id="boton_solicitud_lugares"[\s\S]*data-solicitud-calentamiento="lugares"/);
  assert.match(html, /id="boton_solicitud_acciones"[\s\S]*data-solicitud-calentamiento="acciones"/);
  assert.match(html, /id="boton_solicitud_frase_final"[\s\S]*data-solicitud-calentamiento="frase_final"/);
  assert.match(html, /id="control_title_representation"[\s\S]*REPRESENTACI&Oacute;N/);
  assert.doesNotMatch(html, /data-control-section="parametros"/);
  assert.equal((html.match(/class="[^"]*control-collapsible[^"]*is-collapsed/g) || []).length, 2);
  assert.match(html, /id="control_title_tutorial"[\s\S]*aria-expanded="false"[\s\S]*toggleSeccionControl\('tutorial'\)/);
  assert.match(html, /id="control_title_game"[\s\S]*aria-expanded="true"[\s\S]*toggleSeccionControl\('juego'\)/);
  assert.match(html, /id="control_title_parameters" class="control-group-title control-group-title--parametros"/);
  assert.match(html, /id="control_title_parameters_text" class="control-params-title-text"/);
  assert.match(html, /id="boton_colapsar_parametros"[\s\S]*onclick="togglePanelParametrosControl\(\)"[\s\S]*aria-expanded="true"[\s\S]*aria-controls="panel_parametros"/);
  assert.doesNotMatch(html, /id="control_title_parameters"[\s\S]*toggleSeccionControl\('parametros'\)/);

  assert.equal((html.match(/id="frase_final_j1"/g) || []).length, 1);
  assert.equal((html.match(/id="frase_final_j2"/g) || []).length, 1);
  assert.match(html, /<tbody id="panel_parametros"[\s\S]*id="frase_final_j1"[\s\S]*id="frase_final_j2"/);
  assert.match(html, /id="param_frase_final_j1" class="param-frase-final param-frase-final--j1"[\s\S]*id="frase_final_heading_j1"[\s\S]*id="frase_final_label_j1"[\s\S]*id="frase_final_estado_j1"/);
  assert.match(html, /id="param_frase_final_j2" class="param-frase-final param-frase-final--j2"[\s\S]*id="frase_final_heading_j2"[\s\S]*id="frase_final_label_j2"[\s\S]*id="frase_final_estado_j2"/);
  assert.doesNotMatch(html, /frase-final-apply|onclick="frase_final\(1\)"|onclick="frase_final\(2\)">APLICAR/);
  assert.doesNotMatch(html, /id="panel_parametros_extra"/);
  assert.doesNotMatch(html, /<tbody id="panel_parametros"[\s\S]*class="conexion-panel"/);
  assert.doesNotMatch(html, /05:00|5:00 MAX/);

  assert.match(css, /\.remote-status-bar/);
  assert.match(css, /Aplanado visual/);
  assert.match(css, /\.remote-status-bar\s*\{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(css, /\.control-collapsible-toggle\s*\{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(css, /\.level-card-current,[\s\S]*\.level-card-duration,[\s\S]*#panel_parametros > tr > td,[\s\S]*#listaModos td,[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(css, /Menus de accion como pestañas exclusivas y parametros siempre visibles/);
  assert.match(css, /table\.default\s*\{[\s\S]*grid-template-columns: minmax\(17rem, 0\.72fr\) minmax\(32rem, 1\.46fr\);/);
  assert.match(css, /#panel_controles \.control-group\s*\{[\s\S]*display: contents;/);
  assert.match(css, /#panel_controles \.control-group > :not\(\.control-collapsible-toggle\)\s*\{[\s\S]*display: none !important;/);
  assert.match(css, /#panel_controles \.control-group:not\(\.is-collapsed\) > \.control-group-buttons\s*\{[\s\S]*display: grid !important;/);
  assert.match(css, /Teleprompter integrado dentro de Representacion/);
  assert.match(css, /#panel_controles \.control-group--representacion\.is-teleprompter-open:not\(\.is-collapsed\) > \.control-group-buttons\s*\{[\s\S]*display: none !important;/);
  assert.match(css, /#panel_controles \.control-group--representacion\.is-teleprompter-open:not\(\.is-collapsed\) > \.teleprompter-host\s*\{[\s\S]*display: flex !important;/);
  assert.match(css, /\.teleprompter-host \.teleprompter-panel\s*\{[\s\S]*width: 100%;[\s\S]*height: 100%;/);
  assert.match(css, /#panel_parametros\s*\{[\s\S]*display: grid !important;[\s\S]*height: 100% !important;/);
  assert.match(css, /#panel_parametros > tr:not\(\.parametros-title-row\):not\(\.parametros-frase-row\):not\(\.parametros-modos-row\)\s*\{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
  assert.match(css, /Ajuste amplio de parametros y aire visual en cabeceras/);
  assert.match(css, /table\.default\s*\{[\s\S]*grid-template-columns: minmax\(18rem, 0\.62fr\) minmax\(38rem, 1\.58fr\);/);
  assert.match(css, /#panel_controles \.control-group > \.control-collapsible-toggle\s*\{[\s\S]*min-height: 1\.86rem;/);
  assert.match(css, /#panel_parametros\s*\{[\s\S]*padding: 0\.66rem 0\.82rem 0\.74rem;/);
  assert.match(css, /\.parametros-top-grid\s*\{[\s\S]*grid-template-columns: minmax\(12rem, 0\.52fr\) repeat\(2, minmax\(16rem, 1fr\)\);/);
  assert.match(css, /#listaModos\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(css, /Reorganizacion amplia de parametros en dos columnas/);
  assert.match(css, /#panel_parametros > tr:not\(\.parametros-title-row\):not\(\.parametros-frase-row\):not\(\.parametros-modos-row\)\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /#panel_parametros > tr:not\(\.parametros-title-row\):not\(\.parametros-frase-row\):not\(\.parametros-modos-row\) > td\.param-start\s*\{[\s\S]*grid-template-columns: minmax\(7rem, 1fr\) auto auto;/);
  assert.match(html, /<td class="param-start">[\s\S]*id="tiempo_minutos"[\s\S]*id="tiempo_segundos"/);
  assert.match(css, /\.level-card-duration\s*\{[\s\S]*border-top: 0 !important;[\s\S]*border-bottom: 0 !important;/);
  assert.match(css, /\.level-sequence\s*\{[\s\S]*gap: clamp\(0\.46rem, 0\.72vw, 0\.72rem\);/);
  assert.match(css, /--level-glow: rgba\(255, 214, 90, 0\.7\);/);
  assert.match(css, /\.level-sequence span\.is-active\s*\{[\s\S]*animation: levelChipPulseControl/);
  assert.match(css, /@keyframes levelChipPulseControl/);
  assert.match(css, /\.level-status-witnesses\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.level-status-witness--j1,[\s\S]*\.level-status-witness\[data-team="1"\]\s*\{[\s\S]*--witness-color: #46f0ff;/);
  assert.match(css, /\.level-status-witness--j2,[\s\S]*\.level-status-witness\[data-team="2"\]\s*\{[\s\S]*--witness-color: #ff5f67;/);
  assert.match(css, /\.level-status-witness__icon\s*\{[\s\S]*font-family: "Segoe UI Emoji"/);
  assert.match(css, /\.level-status-witness__icon--text\s*\{[\s\S]*font-family: "Retro-gaming"/);
  assert.match(css, /\.level-status-witness__label,[\s\S]*\.level-status-witness__word,[\s\S]*\.level-status-witness__time\s*\{[\s\S]*text-overflow: ellipsis;/);
  assert.match(css, /\.level-status-witness__word\s*\{[\s\S]*text-transform: uppercase;/);
  assert.match(css, /\.level-status-witness--muse-word \.level-status-witness__dot\s*\{[\s\S]*display: none;/);
  assert.match(css, /\.level-status-witness--muse-word \.level-status-witness__time\s*\{[\s\S]*font-variant-numeric: tabular-nums;/);
  assert.match(css, /\.level-status-witness__queue::before\s*\{[\s\S]*content: "Q";/);
  assert.match(css, /\.level-status-witness--muse-word\[data-queued="1"\]\s*\{[\s\S]*border-color:/);
  assert.match(css, /\.level-status-witness\[data-active="1"\]\s*\{[\s\S]*border-color: color-mix\(in srgb, var\(--witness-color\), transparent 12%\);/);
  assert.match(css, /@keyframes levelWitnessPulseControl/);
  assert.match(css, /#boton_skip_tertulia\s*\{[\s\S]*display: none/);
  assert.match(css, /#boton_skip_tertulia\.is-visible\s*\{[\s\S]*display: inline-flex/);
  assert.match(actions, /function prepararTeleprompterRepresentacionControl\(\)/);
  assert.match(actions, /activarSeccionControl\("representacion"\)/);
  assert.match(actions, /function volverMenuRepresentacionTeleprompter\(\)/);
  assert.match(actions, /window\.volverMenuRepresentacionTeleprompter = volverMenuRepresentacionTeleprompter/);
  assert.match(actions, /function reanudar_modo\(\)\{[\s\S]*if\(modo_actual !== "tertulia"\)\{[\s\S]*return false;/);
  assert.match(socketEvents, /TimeoutTiempoMuerto = setTimeout\(function\(\)\{[\s\S]*if \(modo_actual !== "tertulia" \|\| typeof reanudar_modo !== "function"\) \{[\s\S]*return;/);
  assert.match(css, /button\.btn\.stats-nav-button\s*\{[\s\S]*width: clamp\(2rem, 2\.6vw, 2\.55rem\);[\s\S]*font-size: 0;/);
  assert.match(css, /button\.btn\.stats-nav-button::before\s*\{[\s\S]*border-width: 0\.16rem 0\.16rem 0 0;/);
  assert.match(css, /button\.btn\.stats-nav-button--prev::before\s*\{[\s\S]*rotate\(-135deg\)/);
  assert.match(css, /button\.btn\.stats-nav-button--next::before\s*\{[\s\S]*rotate\(45deg\)/);
  assert.match(css, /\.writer-text-shell/);
  assert.match(css, /\.writer-text-shell\s*\{[\s\S]*border: 1px solid rgba\(70, 240, 255, 0\.46\);[\s\S]*box-shadow:/);
  assert.match(css, /\.writer-text-shell--j2\s*\{[\s\S]*border-color: rgba\(255, 95, 103, 0\.52\);[\s\S]*box-shadow:/);
  assert.match(css, /\.writer-text-shell--j1 \.writer-textarea\s*\{[\s\S]*scrollbar-color: rgba\(70, 240, 255, 0\.88\)/);
  assert.match(css, /\.writer-text-shell--j2 \.writer-textarea\s*\{[\s\S]*scrollbar-color: rgba\(255, 95, 103, 0\.9\)/);
  assert.match(css, /\.writer-text-shell--j1 \.writer-textarea::\-webkit-scrollbar-thumb\s*\{[\s\S]*background: linear-gradient\(180deg, #7bfbff, #15cfff\)/);
  assert.match(css, /\.writer-text-shell--j2 \.writer-textarea::\-webkit-scrollbar-thumb\s*\{[\s\S]*background: linear-gradient\(180deg, #ff9aa0, #ff4050\)/);
  assert.match(css, /\.writer-text-shell--j1 \.line-numbers,[\s\S]*\.writer-text-shell--j1 \.writer-textarea\s*\{[\s\S]*color: #8ff8ff/);
  assert.match(css, /\.writer-text-shell--j2 \.line-numbers,[\s\S]*\.writer-text-shell--j2 \.writer-textarea\s*\{[\s\S]*color: #ff9aa0/);
  assert.match(css, /\.line-numbers/);
  assert.match(css, /\.writer-header-stats/);
  assert.match(css, /\.writer-stat\s*\{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(css, /\.writer-header-stats \.puntos,[\s\S]*\.writer-header-stats \.musas-total\s*\{[\s\S]*text-transform: none;/);
  assert.match(css, /\.writer-meta-row\s*\{[\s\S]*display: none/);
  assert.match(css, /\.conexion-dot--off\s*\{[\s\S]*#ff9d2e/);
  assert.match(css, /\.remote-status-state\.is-off\s*\{[\s\S]*#ffad42/);
  assert.match(css, /\.conexion-dot--writer/);
  assert.match(css, /#tiempo\.tiempo-vida\s*\{[\s\S]*--vida-color: #46f0ff/);
  assert.match(css, /#tiempo1\.tiempo-vida\s*\{[\s\S]*--vida-color: #ff5f67/);
  assert.match(css, /\.writer-health \.tiempo-vida:not\(:empty\)\s*\{[\s\S]*justify-content: center/);
  assert.match(css, /Parametros ordenados sin cajas internas y vida compacta en cabeceras/);
  assert.match(css, /#panel_parametros > tr > td,[\s\S]*#panel_parametros #listaModos td,[\s\S]*\.control-language,[\s\S]*\.param-frase-final \.frase_final_editor\s*\{[\s\S]*border: 0 !important;[\s\S]*background: transparent !important;[\s\S]*box-shadow: none !important;/);
  assert.match(css, /\.writer-compact-life\s*\{[\s\S]*display: inline-flex;[\s\S]*align-items: center;/);
  assert.match(css, /\.writer-compact-life \.tiempo-vida\s*\{[\s\S]*display: flex !important;[\s\S]*width: clamp\(4\.9rem, 6\.8vw, 6\.35rem\);/);
  assert.match(css, /Ajuste final de densidad y estados de control/);
  assert.match(css, /\.remote-restart-btn:disabled,[\s\S]*\.remote-restart-btn\[aria-disabled="true"\]\s*\{[\s\S]*cursor: not-allowed;[\s\S]*pointer-events: none;/);
  assert.match(css, /#contenedor\s*\{[\s\S]*height: clamp\(13\.4rem, 34vh, 17\.2rem\);/);
  assert.match(css, /#panel_parametros > tr:not\(\.parametros-title-row\):not\(\.parametros-frase-row\):not\(\.parametros-modos-row\)\s*\{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
  assert.match(css, /#panel_controles \.control-group:not\(\.is-collapsed\) > \.control-collapsible-toggle\s*\{[\s\S]*filter: brightness\(1\.12\);[\s\S]*box-shadow:/);
  assert.match(css, /Los botones de la seccion activa consumen el espacio disponible del panel/);
  assert.match(css, /#panel_controles \.control-groups\s*\{[\s\S]*height: 100%;[\s\S]*grid-template-rows: auto minmax\(0, 1fr\);/);
  assert.match(css, /#panel_controles \.control-group:not\(\.is-collapsed\) > \.control-group-buttons\s*\{[\s\S]*grid-row: 2;[\s\S]*height: 100%;/);
  assert.match(css, /#panel_controles \.control-group:not\(\.is-collapsed\) > \.control-group-buttons--two\s*\{[\s\S]*grid-template-rows: repeat\(3, minmax\(2\.35rem, 1fr\)\);/);
  assert.match(css, /#panel_controles \.control-group:not\(\.is-collapsed\) > \.control-group-buttons #boton_skip_tertulia:not\(\.is-visible\)\s*\{[\s\S]*display: none !important;/);
  assert.match(css, /#panel_controles \.control-group:not\(\.is-collapsed\) > \.control-group-buttons #boton_skip_tertulia\.is-visible\s*\{[\s\S]*display: inline-flex !important;/);
  assert.match(css, /Cursor retro pixel para control, sin asset de pluma/);
  assert.match(css, /\.control-cursor-pluma\s*\{[\s\S]*width: 30px;[\s\S]*height: 34px;[\s\S]*transform: translate\(-2px, -2px\);/);
  assert.match(css, /\.control-cursor-pluma\.activa\s*\{[\s\S]*opacity: 0\.98 !important;/);
  assert.match(css, /\.control-cursor-pluma::before\s*\{[\s\S]*clip-path: polygon\(0 0, 0 78%, 23% 61%, 38% 100%, 57% 93%, 43% 56%, 76% 56%\);[\s\S]*linear-gradient\(135deg, #f8feff/);
  assert.match(css, /\.control-cursor-pluma::after\s*\{[\s\S]*clip-path: polygon\(0 0, 0 78%, 23% 61%, 38% 100%, 57% 93%, 43% 56%, 76% 56%\);[\s\S]*background: #ff5f67;/);
  assert.match(css, /@keyframes controlCursorRetroBlink/);
  assert.doesNotMatch(css, /pluma_azul\.png|controlCursorPlumaAzulGlow|controlCursorPanelGlow/);
  assert.doesNotMatch(css, /calentamiento-solicitud-estado/);
  assert.match(css, /\.btn-calentamiento-solicitud\[data-active="1"\],[\s\S]*\.btn-calentamiento-solicitud\.is-active\s*\{[\s\S]*border-color: rgba\(255, 209, 102, 0\.96\);[\s\S]*filter: brightness\(1\.16\);/);
  assert.match(css, /\.btn-calentamiento-solicitud\[data-active="1"\]::after,[\s\S]*\.btn-calentamiento-solicitud\.is-active::after\s*\{[\s\S]*background: #ffd166;/);
  assert.match(css, /Tutorial usa su propia altura: 4 botones en 2 filas y detonadores en 1 fila/);
  assert.match(css, /#panel_controles \.control-group--calentamiento:not\(\.is-collapsed\) > \.control-group-buttons--two\s*\{[\s\S]*grid-template-rows: repeat\(2, minmax\(2\.15rem, 1fr\)\) !important;/);
  assert.match(css, /#panel_controles \.control-group--calentamiento:not\(\.is-collapsed\) > \.control-group-buttons--solicitud\s*\{[\s\S]*grid-template-rows: minmax\(2\.15rem, 1fr\) !important;/);
  assert.match(css, /Juego: con cinco acciones, nube ocupa todo el ancho disponible/);
  assert.match(css, /#panel_controles \.control-group--juego:not\(\.is-collapsed\) #boton_vista_nube_inspiracion\s*\{[\s\S]*grid-column: 1 \/ -1;/);
  assert.match(css, /Juego: las acciones ocupan el alto disponible en filas equilibradas/);
  assert.match(css, /#panel_controles \.control-group--juego:not\(\.is-collapsed\) > \.control-group-buttons--two\s*\{[\s\S]*grid-template-rows: repeat\(3, minmax\(2\.15rem, 1fr\)\) !important;[\s\S]*align-content: stretch;/);
  assert.match(css, /#panel_controles \.control-group--juego:not\(\.is-collapsed\) #boton_vista_nube_inspiracion\s*\{[\s\S]*min-height: 0 !important;[\s\S]*height: auto;[\s\S]*align-self: stretch;/);
  assert.match(css, /Cabeceras de escritorxs y pestanas de acciones legibles en escritorio medio/);
  assert.match(css, /\.writer-card-header\s*\{[\s\S]*display: grid !important;[\s\S]*grid-template-columns: minmax\(10rem, 1fr\) minmax\(0, auto\);/);
  assert.match(css, /\.writer-connection-state\s*\{[\s\S]*max-width: none !important;[\s\S]*overflow: visible !important;[\s\S]*white-space: nowrap;/);
  assert.match(css, /#panel_controles \.control-groups\s*\{[\s\S]*grid-template-columns: minmax\(0, 0\.82fr\) minmax\(0, 0\.98fr\) minmax\(0, 1\.22fr\);/);
  assert.match(css, /#panel_controles \.control-group\[data-control-section="representacion"\] > \.control-collapsible-toggle\s*\{[\s\S]*font-size: clamp\(0\.42rem, 0\.56vw, 0\.6rem\);/);
  assert.match(css, /@media \(max-width: 1100px\)\s*\{[\s\S]*\.writer-card-header\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*\.writer-header-actions\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /\.writer-title-group,[\s\S]*\.writer-title-stack,[\s\S]*\.writer-name-row,[\s\S]*\.writer-name-row \.nombre\s*\{[\s\S]*width: 100%;/);
  assert.match(css, /Frase final: autosave visual y cajas por equipo/);
  assert.match(css, /\.parametros-top-grid\.frase-final-inactiva\s*\{[\s\S]*grid-template-columns: minmax\(13rem, 0\.36fr\) minmax\(0, 1fr\);/);
  assert.match(css, /\.param-frase-final\[hidden\]\s*\{[\s\S]*display: none !important;/);
  assert.match(css, /\.param-frase-final--j1 \.frase_final_editor\s*\{[\s\S]*border: 1px solid rgba\(70, 243, 255, 0\.72\) !important;/);
  assert.match(css, /\.param-frase-final--j2 \.frase_final_editor\s*\{[\s\S]*border: 1px solid rgba\(255, 95, 103, 0\.72\) !important;/);
  assert.match(css, /\.frase-final-save-state\.is-saved\s*\{[\s\S]*animation: fraseFinalTickControl 520ms ease;/);
  assert.match(css, /La columna de acciones se estira como parametros y reparte el alto util/);
  assert.match(css, /#panel_controles,[\s\S]*#panel_controles > tr,[\s\S]*#panel_controles > tr > td\s*\{[\s\S]*height: 100%;[\s\S]*align-self: stretch;/);
  assert.match(css, /#panel_controles \.control-group--juego:not\(\.is-collapsed\) > \.control-group-buttons,[\s\S]*#panel_controles \.control-group--representacion:not\(\.is-collapsed\) > \.control-group-buttons\s*\{[\s\S]*grid-row: 2 \/ -1;[\s\S]*height: 100%;/);
  assert.match(css, /Indicadores planos en cabecera: palabras, musas y vida sin recuadro/);
  assert.match(css, /\.writer-header-stats,[\s\S]*\.writer-compact-life,[\s\S]*\.writer-stat\s*\{[\s\S]*border: 0 !important;[\s\S]*background: transparent !important;[\s\S]*box-shadow: none !important;/);
  assert.match(css, /\.writer-compact-life \.tiempo-vida\s*\{[\s\S]*height: 0\.34rem;[\s\S]*border: 0 !important;[\s\S]*box-shadow: none !important;/);
  assert.match(css, /Parametros a ancho completo, sin linea divisoria y con unidades visibles/);
  assert.match(css, /\.parametros-title-row > td,[\s\S]*#control_title_parameters\s*\{[\s\S]*border-bottom: 0 !important;/);
  assert.match(css, /#panel_parametros span\.parametro,[\s\S]*#panel_parametros span\.parametro_inicial\s*\{[\s\S]*display: inline-flex !important;[\s\S]*text-transform: uppercase;/);
  assert.match(css, /#panel_parametros > tr:not\(\.parametros-title-row\):not\(\.parametros-frase-row\):not\(\.parametros-modos-row\) > td\.param-start\s*\{[\s\S]*grid-template-rows: auto auto;/);
  assert.match(css, /\.parametros-top-grid\s*\{[\s\S]*grid-template-columns: minmax\(18rem, 0\.64fr\) repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /Dropdown de modos del panel de parametros/);
  assert.match(css, /#panel_parametros\s*\{[\s\S]*overflow: visible;/);
  assert.match(css, /Borrar texto vive en parametros como toggle rojo\/verde/);
  assert.match(css, /\.parametros-bottom-actions\s*\{[\s\S]*grid-template-columns: minmax\(12rem, 0\.86fr\) minmax\(10rem, 0\.54fr\);/);
  assert.match(css, /\.parametros-delete-toggle\s*\{[\s\S]*border: 1px solid rgba\(255, 95, 103, 0\.68\) !important;[\s\S]*color: #ff9aa0 !important;/);
  assert.match(css, /\.parametros-delete-toggle\[data-active="1"\],[\s\S]*\.parametros-delete-toggle\.is-active\s*\{[\s\S]*border-color: rgba\(107, 255, 131, 0\.72\) !important;[\s\S]*color: #b9ffd0 !important;/);
  assert.match(css, /\.parametros-modos-dropdown\s*\{[\s\S]*position: relative;[\s\S]*width: min\(18\.5rem, 100%\);/);
  assert.match(css, /\.parametros-modos-menu\[hidden\]\s*\{[\s\S]*display: none !important;/);
  assert.match(css, /\.parametros-modos-menu\s*\{[\s\S]*bottom: calc\(100% \+ 0\.32rem\);/);
  assert.match(css, /\.parametros-modos-menu #listaModos\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /Ticks de niveles activos con el color de cada nivel/);
  assert.match(css, /#listaModos td:nth-child\(1\)\s*\{[\s\S]*--modo-color: #6bff83;/);
  assert.match(css, /#listaModos td:nth-child\(6\)\s*\{[\s\S]*--modo-color: #ffad42;/);
  assert.match(css, /#listaModos input\[type="checkbox"\]:checked::after\s*\{[\s\S]*color: var\(--modo-color, #6bff83\) !important;/);
  assert.match(css, /Parametros contraibles hacia la derecha para liberar la columna de acciones/);
  assert.match(css, /table\.default\.parametros-colapsados\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) clamp\(2\.55rem, 3\.3vw, 3\.05rem\) !important;/);
  assert.match(css, /#panel_parametros\.is-side-collapsed\s*\{[\s\S]*grid-template-rows: minmax\(0, 1fr\) !important;[\s\S]*align-items: stretch;/);
  assert.match(css, /#panel_parametros\.is-side-collapsed > tr:not\(\.parametros-title-row\)\s*\{[\s\S]*display: none !important;/);
  assert.match(css, /#panel_parametros\.is-side-collapsed \.control-params-title-text\s*\{[\s\S]*writing-mode: vertical-rl;/);
  assert.match(css, /\.control-params-collapse-btn\s*\{[\s\S]*width: clamp\(1\.78rem, 2\.12vw, 2\.08rem\);[\s\S]*height: clamp\(1\.42rem, 1\.7vw, 1\.72rem\);/);
  assert.match(css, /ASCII completo de marca en control, reducido para la barra superior/);
  assert.match(css, /\.remote-brand-card \.control-brand\s*\{[\s\S]*width: clamp\(8\.55rem, 11\.1vw, 10\.7rem\);[\s\S]*height: clamp\(1\.38rem, 1\.92vw, 1\.78rem\);[\s\S]*overflow: hidden;/);
  assert.match(css, /\.remote-brand-card \.control-brand \.neon\s*\{[\s\S]*font-family: "Courier New", "Consolas", monospace;[\s\S]*font-size: clamp\(0\.162rem, 0\.235vw, 0\.235rem\);/);
  assert.match(css, /\.remote-brand-control-label\s*\{[\s\S]*font-family: "Retro-gaming", "Courier New", monospace;[\s\S]*font-size: clamp\(0\.94rem, 1\.18vw, 1\.38rem\);[\s\S]*text-shadow:/);
  assert.match(css, /En parametros contraidos, toda la pestaña vertical es zona de expansion/);
  assert.match(css, /#panel_parametros\.is-side-collapsed #control_title_parameters\s*\{[\s\S]*position: relative;[\s\S]*cursor: pointer;/);
  assert.match(css, /Texto de parametros centrado en la pestaña contraida/);
  assert.match(css, /#panel_parametros\.is-side-collapsed #control_title_parameters\s*\{[\s\S]*place-items: center;/);
  assert.match(css, /#panel_parametros\.is-side-collapsed \.control-params-title-text\s*\{[\s\S]*position: absolute;[\s\S]*left: 50%;[\s\S]*top: 50%;[\s\S]*display: inline-flex;[\s\S]*align-items: center;[\s\S]*justify-content: center;[\s\S]*transform: translate\(-50%, -50%\) rotate\(180deg\);/);
  assert.match(css, /#panel_parametros\.is-side-collapsed \.control-params-collapse-btn\s*\{[\s\S]*position: absolute;[\s\S]*inset: 0;[\s\S]*width: 100%;[\s\S]*height: 100%;/);
  assert.match(css, /#panel_parametros\.is-side-collapsed \.control-params-collapse-btn::after\s*\{[\s\S]*content: "\\2039";[\s\S]*top: 0\.16rem;[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(css, /Animaciones de paneles de control, parametros, niveles activos e idioma/);
  assert.match(css, /@keyframes controlMenuExpand/);
  assert.match(css, /@keyframes controlMenuCollapse/);
  assert.match(css, /@keyframes controlDropdownExpand/);
  assert.match(css, /@keyframes controlDropdownCollapse/);
  assert.match(css, /@keyframes controlParamsSideExpand/);
  assert.match(css, /@keyframes controlParamsSideCollapse/);
  assert.match(css, /@keyframes controlLanguageChange/);
  assert.match(css, /#panel_controles \.control-group\.is-entering > \.control-group-buttons,[\s\S]*animation: controlMenuExpand 220ms/);
  assert.match(css, /#panel_controles \.control-group\.is-collapsed\.is-collapsing > \.control-group-buttons\s*\{[\s\S]*display: grid !important;[\s\S]*animation: controlMenuCollapse 180ms/);
  assert.match(css, /#panel_parametros\.is-side-animating\s*\{[\s\S]*animation: controlParamsSideExpand 220ms/);
  assert.match(css, /\.parametros-modos-dropdown\.is-opening \.parametros-modos-menu\s*\{[\s\S]*animation: controlDropdownExpand 190ms/);
  assert.match(css, /\.parametros-modos-dropdown\.is-closing \.parametros-modos-menu\s*\{[\s\S]*display: block !important;[\s\S]*animation: controlDropdownCollapse 170ms/);
  assert.match(css, /\.control-language\.is-changing \.control-language-current,[\s\S]*\.control-language\.is-changing \.control-language-option\.is-selected\s*\{[\s\S]*animation: controlLanguageChange 360ms/);
  assert.match(css, /Responsive para escritorio y tablets: sin overflow horizontal y con el area util repartida/);
  assert.match(css, /body > div\[align="center"\]\s*\{[\s\S]*margin-top: clamp\(0\.34rem, 0\.72vw, 0\.72rem\);/);
  assert.match(css, /table\.default\s*\{[\s\S]*gap: clamp\(0\.62rem, 1vw, 1rem\);/);
  assert.match(css, /@media \(min-width: 1101px\)\s*\{[\s\S]*body > div\[align="center"\]\s*\{[\s\S]*flex: 1 1 auto;[\s\S]*table\.default\s*\{[\s\S]*height: auto !important;/);
  assert.match(css, /@media \(max-width: 1500px\) and \(min-width: 1101px\)\s*\{[\s\S]*\.remote-status-bar\s*\{[\s\S]*grid-template-columns: minmax\(10rem, 1\.22fr\) repeat\(4, minmax\(7\.25rem, 1fr\)\);/);
  assert.match(css, /@media \(max-width: 1500px\) and \(min-width: 1101px\)\s*\{[\s\S]*#panel_controles \.control-group-buttons \.btn\s*\{[\s\S]*font-size: clamp\(0\.34rem, 0\.54vw, 0\.48rem\);[\s\S]*white-space: normal;[\s\S]*overflow-wrap: anywhere;/);
  assert.match(css, /@media \(max-width: 1100px\)\s*\{[\s\S]*\.remote-status-bar\s*\{[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\) !important;/);
  assert.match(css, /@media \(max-width: 1100px\)\s*\{[\s\S]*table\.default\s*\{[\s\S]*grid-template-columns: minmax\(12\.5rem, 0\.34fr\) minmax\(0, 1fr\) !important;/);
  assert.match(css, /En tablet, se reduce la fuente antes de forzar scroll horizontal/);
  assert.match(css, /@media \(max-width: 1100px\)\s*\{[\s\S]*#panel_controles \.control-group-buttons \.btn\s*\{[\s\S]*font-size: clamp\(0\.28rem, 0\.9vw, 0\.39rem\);[\s\S]*white-space: normal;[\s\S]*overflow-wrap: anywhere;/);
  assert.match(css, /@media \(max-width: 860px\)\s*\{[\s\S]*table\.default\s*\{[\s\S]*grid-template-columns: minmax\(11rem, 0\.31fr\) minmax\(0, 1fr\) !important;/);
  assert.match(css, /@media \(max-width: 900px\) and \(orientation: portrait\)\s*\{[\s\S]*table\.default\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important;[\s\S]*height: auto !important;/);
  assert.match(css, /@media \(max-width: 900px\) and \(orientation: portrait\)\s*\{[\s\S]*#panel_parametros > tr:not\(\.parametros-title-row\):not\(\.parametros-frase-row\):not\(\.parametros-modos-row\)\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important;/);
  assert.match(html, /data-i18n="control\.unit\.seconds_short">segs\.<\/span>/);
  assert.match(css, /Compactacion superior: escritorxs y nivel abrazan su contenido/);
  assert.match(css, /#contenedor\s*\{[\s\S]*height: auto;[\s\S]*gap: clamp\(0\.44rem, 0\.7vw, 0\.74rem\);/);
  assert.match(css, /Aire interno extra para que los chips de nivel no rocen el marco/);
  assert.match(css, /\.level-card\s*\{[\s\S]*padding: clamp\(0\.46rem, 0\.68vw, 0\.66rem\) clamp\(0\.72rem, 1vw, 0\.95rem\);/);
  assert.match(css, /#contenedor \.level-card\s*\{[\s\S]*padding: clamp\(0\.46rem, 0\.68vw, 0\.66rem\) clamp\(0\.72rem, 1vw, 0\.95rem\) !important;/);
  assert.match(css, /Nivel alineado en alto con las tarjetas de escritorxs/);
  assert.match(css, /#contenedor\s*\{[\s\S]*align-items: stretch;/);
  assert.match(css, /#contenedor > \.level-card\s*\{[\s\S]*align-self: stretch;[\s\S]*height: auto;[\s\S]*min-height: 100%;/);
  assert.match(css, /\.level-sequence\s*\{[\s\S]*padding-inline: clamp\(0\.08rem, 0\.22vw, 0\.22rem\);/);
  assert.match(css, /\.writer-card > div\[align="center"\] h1:empty,[\s\S]*\.writer-card > div\[align="center"\] h2:empty\s*\{[\s\S]*display: none;/);
  assert.match(css, /table\.default\s*\{[\s\S]*height: calc\(100vh - 2\.48rem - clamp\(12\.1rem, 28vh, 13\.6rem\) - 1\.85rem\);/);
  assert.match(css, /\.control-group\.control-collapsible\.is-collapsed > :not\(\.control-collapsible-toggle\)/);
  assert.match(css, /#panel_parametros\.control-collapsible\.is-collapsed > tr:not\(\.parametros-title-row\)/);
  assert.match(actions, /function actualizarNumerosLineaControl/);
  assert.match(actions, /function toggleLogsControl/);
  assert.match(actions, /DURACION_ANIMACION_MENU_CONTROL_MS = 220/);
  assert.match(actions, /DURACION_ANIMACION_DROPDOWN_CONTROL_MS = 190/);
  assert.match(actions, /DURACION_ANIMACION_IDIOMA_CONTROL_MS = 360/);
  assert.match(actions, /function marcarAnimacionSeccionControl\(panel, clase/);
  assert.match(actions, /function textoRepresentacionControl\(corto = false\)/);
  assert.match(actions, /function actualizarEtiquetaRepresentacionControl\(\)/);
  assert.match(actions, /"control\.title\.representation_short" : "control\.title\.representation"/);
  assert.match(actions, /boton\.scrollWidth > boton\.clientWidth \+ margen/);
  assert.match(actions, /function toggleSeccionControl\(seccion\)/);
  assert.match(actions, /marcarAnimacionSeccionControl\(panel, "is-entering"\)/);
  assert.match(actions, /marcarAnimacionSeccionControl\(panel, "is-collapsing"\)/);
  assert.match(actions, /function setPanelParametrosColapsadoControl\(colapsado\)/);
  assert.match(actions, /function togglePanelParametrosControl\(\)/);
  assert.match(actions, /"control_title_parameters_text", "control\.button\.parameters"/);
  assert.match(actions, /tabla\.classList\.toggle\("parametros-colapsados", parametros_colapsados_control\)/);
  assert.match(actions, /panel\.classList\.toggle\("is-side-collapsed", parametros_colapsados_control\)/);
  assert.match(actions, /panel\.classList\.add\("is-side-animating"\)/);
  assert.match(actions, /function actualizarResumenModosControl\(\)/);
  assert.match(actions, /actualizarOpcionesFraseFinalControl\(\);/);
  assert.match(actions, /function toggleDropdownModosControl\(\)/);
  assert.match(actions, /contenedor\.classList\.add\("is-open", "is-opening"\)/);
  assert.match(actions, /contenedor\.classList\.add\("is-closing"\)/);
  assert.match(actions, /function inicializarDropdownModosControl\(\)/);
  assert.match(actions, /boton\.setAttribute\("aria-pressed", activo \? "true" : "false"\);/);
  assert.doesNotMatch(actions, /calentamiento_solicitud_actual|control\.warmup\.current_trigger|DETONADOR ACTUAL/);
  assert.match(actions, /boton\.classList\.toggle\("is-active", activo\);[\s\S]*boton\.setAttribute\("aria-pressed", activo \? "true" : "false"\);/);
  assert.match(actions, /tipoSolicitado === solicitud_calentamiento_actual[\s\S]*\? SOLICITUD_CALENTAMIENTO_POR_DEFECTO[\s\S]*: tipoSolicitado;/);
  assert.match(actions, /function aplicarEstadoPersistenteControl\(payload = \{\}\)/);
  assert.match(actions, /socket\.emit\("control_estado_actualizar", obtenerEstadoPersistenteControl\(\)\);/);
  assert.match(actions, /function borrar_texto_guardado\(\)[\s\S]*emitirEstadoControlPersistente\(\{ inmediato: true \}\);/);
  assert.match(actions, /function guardarFraseFinalControl\(playerId, opciones = \{\}\)[\s\S]*emitirEstadoControlPersistente\(\);/);
  assert.match(actions, /function cambiarValor\(campoId, incremento\)[\s\S]*emitirEstadoControlPersistente\(\);/);
  assert.match(actions, /PARAMETROS_CONTROL_PERSISTENTES = \[[\s\S]*"tiempo_modos"[\s\S]*"escala_espectador"/);
  assert.match(actions, /boton\.textContent = tJuego2PControl\("control\.button\.delete_saved", \{\}, "BORRAR TEXTO"\);/);
  assert.doesNotMatch(actions, /BORRAR TEXTO: (?:ON|OFF)/);
  assert.doesNotMatch(actions, /\\u232B BORRAR TEXTO/);
  assert.match(i18n, /"control\.button\.delete_saved": "BORRAR TEXTO"/);
  assert.doesNotMatch(i18n, /BORRAR TEXTO: (?:ON|OFF)|CLEAR TEXT: (?:ON|OFF)|EFFACER TEXTE : (?:ON|OFF)/);
  assert.match(actions, /function actualizarOpcionesFraseFinalControl\(\)/);
  assert.match(actions, /function guardarFraseFinalControl\(playerId, opciones = \{\}\)/);
  assert.match(actions, /function inicializarFrasesFinalesControl\(\)/);
  assert.match(actions, /input\.addEventListener\("input", \(\) => guardarFraseFinalControl\(playerId, \{ normalizar: false \}\)\)/);
  assert.match(actions, /bloque\.hidden = !activo;/);
  assert.match(actions, /observer_modos_control = new MutationObserver\(actualizarResumenModosControl\)/);
  assert.match(actions, /resumen\.textContent = `\$\{activas\}\/\$\{total\} activos`;/);
  assert.match(actions, /SECCIONES_BOTONES_CONTROL/);
  assert.match(actions, /window\.addEventListener\("resize", actualizarEtiquetaRepresentacionControl\)/);
  assert.match(actions, /boton && boton\.disabled/);
  assert.match(actions, /rolRemotoConectadoControl/);
  assert.match(actions, /document\.querySelectorAll\("\[data-control-section\]"\)\.forEach/);
  assert.match(actions, /function actualizarNivelActivoControl\(modo = modo_control_activo\)/);
  assert.match(actions, /chip\.classList\.toggle\("is-active", activo\)/);
  assert.match(actions, /function calcularTiempoRestanteModoControl\(\{ segundos = 0, duracion = null, restante = null \} = \{\}\)/);
  assert.match(actions, /function iniciarCuentaAtrasModoControl\(\{ modo = modo_control_activo, duracion = null, restante = null \} = \{\}\)/);
  assert.match(actions, /tiempo\.textContent = formatearSegundosControl\(restanteNormalizado\);/);
  assert.match(actions, /function sincronizarDesventajaActivaControl\(payload = \{\}, opciones = \{\}\)/);
  assert.match(actions, /function obtenerEmojiDesventajaControl\(payload = \{\}\)/);
  assert.match(actions, /window\.ScribDisadvantages\.normalizar\(valor\)/);
  assert.match(actions, /player_testigo_desventaja_control = data\.player;/);
  assert.match(actions, /function sincronizarVotacionDesventajaControl\(payload = \{\}\)/);
  assert.match(actions, /function pausarTestigosDesventajaControl\(\)/);
  assert.match(actions, /function reanudarTestigosDesventajaControl\(\)/);
  assert.match(actions, /const estado_testigos_palabras_musas_control = \{ 1: null, 2: null \};/);
  assert.match(actions, /function sincronizarEstadoPalabrasMusasControl\(payload = \{\}\)/);
  assert.match(actions, /function formatearSegundosInspiracionMusaControl\(restanteMs\)/);
  assert.match(actions, /tiempoEl\.textContent = activo \? formatearSegundosInspiracionMusaControl\(restanteMs\) : "--";/);
  assert.match(actions, /control_palabra_musa_j\$\{id\}_word/);
  assert.match(actions, /palabraEl\.textContent = activo && palabraTexto \? palabraTexto : "-";/);
  assert.match(actions, /control_palabra_musa_j\$\{id\}_time/);
  assert.match(actions, /data\.cola_palabras_musas/);
  assert.match(actions, /window\.sincronizarEstadoPalabrasMusasControl = sincronizarEstadoPalabrasMusasControl;/);
  assert.match(actions, /"frase_final_heading_j1", "mode\.name\.frase_final", "FRASE FINAL"/);
  assert.doesNotMatch(actions, /FRASE FINAL ESCRITXR 1/);
  assert.match(socketEvents, /function escapeHtmlControl\(valor\)/);
  assert.match(socketEvents, /return escapeHtmlControl\(plano\)\.replace\(\/\\n\/g, "<br>"\);/);
  assert.doesNotMatch(socketEvents, /return escapeHtml\(plano\)/);
  assert.match(socketEvents, /socket\.emit\('pedir_estado_control'\);/);
  assert.match(socketEvents, /socket\.emit\('pedir_estado_palabras_musas_control'\);/);
  assert.match(socketEvents, /socket\.on\('control_estado', \(payload = \{\}\) => \{[\s\S]*aplicarEstadoPersistenteControl\(payload\);/);
  assert.match(socketEvents, /socket\.on\('estado_palabras_musas_control', \(payload = \{\}\) => \{[\s\S]*sincronizarEstadoPalabrasMusasControl\(payload\);/);
  assert.match(socketEvents, /socket\.on\('desventaja_activa_estado', \(payload = \{\}\) => \{[\s\S]*sincronizarDesventajaActivaControl\(payload\);/);
  assert.match(socketEvents, /socket\.on\('votacion_ventaja_estado', \(payload = \{\}\) => \{[\s\S]*sincronizarVotacionDesventajaControl\(payload\);/);
  assert.match(socketEvents, /socket\.on\('enviar_ventaja_j1', \(payload = \{\}\) => \{[\s\S]*sincronizarDesventajaActivaControl\(payload, \{ player: 1 \}\);/);
  assert.match(socketEvents, /socket\.on\('enviar_ventaja_j2', \(payload = \{\}\) => \{[\s\S]*sincronizarDesventajaActivaControl\(payload, \{ player: 2 \}\);/);
  assert.match(socketEvents, /duracion_modo_actual_control = Number\(data && data\.duracion_modo_segundos\)/);
  assert.match(socketEvents, /tiempo_restante_modo_actual_control = Number\(data && data\.tiempo_restante_modo_segundos\)/);
  assert.match(socketEvents, /window\.iniciarCuentaAtrasModoControl\(\{[\s\S]*modo: modo_actual,[\s\S]*duracion: duracion_modo_actual_control,[\s\S]*restante: tiempo_restante_modo_actual_control/);
  assert.doesNotMatch(socketEvents, /actualizarModoVistaEspectadorControl\(\{ modo: "partida" \}\)/);
  assert.doesNotMatch(socketEvents, /actualizarSolicitudCalentamientoControl\(\{ tipo: SOLICITUD_CALENTAMIENTO_POR_DEFECTO \}\)/);
  assert.doesNotMatch(socketEvents, /forzar_solicitud_calentamiento_default_pendiente = true/);
  assert.match(actions, /COLOR_BARRA_VIDA_CONTROL/);
  assert.match(actions, /BANDERAS_IDIOMA_CONTROL/);
  assert.match(actions, /es: "\\uD83C\\uDDEA\\uD83C\\uDDF8"/);
  assert.match(actions, /en: "\\uD83C\\uDDEC\\uD83C\\uDDE7"/);
  assert.match(actions, /fr: "\\uD83C\\uDDEB\\uD83C\\uDDF7"/);
  assert.match(actions, /function formatearIdiomaControl\(option\)/);
  assert.match(actions, /textoActual\.textContent = seleccionada \? formatearIdiomaControl\(seleccionada\) : "";/);
  assert.match(actions, /botonOpcion\.textContent = formatearIdiomaControl\(option\);/);
  assert.match(actions, /const animarCambioIdioma = \(\) =>/);
  assert.match(actions, /contenedor\.classList\.add\("is-changing"\)/);
  assert.doesNotMatch(actions, /hsl\(\$\{tono\}/);
  assert.match(state, /esMarcadorCompactoControl/);
  assert.match(state, /formatearPuntosMarcadorCompactoControl/);
  assert.match(state, /formatearMusasMarcadorCompactoControl/);
  assert.match(state, /estadoEspectadorDot/);
  assert.match(state, /conexiones\.spectator/);
  assert.match(state, /botonesReinicioRemotoControl/);
  assert.match(state, /setBotonReinicioRemoto\("escritxr1", j1\)/);
  assert.match(state, /setEstadoRolRemoto\(estadoActor1Dot, estadoActor1Texto, Boolean\(actors\[1\] && actors\[1\]\.connected\), "actorxs1"\)/);
  assert.match(state, /estado\.palabras_musas_control[\s\S]*window\.sincronizarEstadoPalabrasMusasControl/);
});

test("writer reconnect post-inicio enters match view without skill menu", () => {
  const js = read("game/players/js/socket-events.js");

  assert.match(js, /function asegurarVistaPartidaActivaEscritora\(\)/);
  assert.match(js, /if \(atributosEl\) atributosEl\.style\.display = "none";/);
  assert.match(js, /function post_inicio\(borrar_texto\)\{[\s\S]*asegurarVistaPartidaActivaEscritora\(\);/);
});

test("reconnected roles restore elapsed level progress", () => {
  const writerState = read("game/players/js/state.js");
  const writerSocket = read("game/players/js/socket-events.js");
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorSocket = read("game/spectator/js/socket-events.js");

  assert.match(writerState, /function sincronizarProgresoNivelBarraEscritora/);
  assert.match(writerSocket, /socket\.on\("temp_modos"[\s\S]*sincronizarProgresoNivelBarraEscritora\(data\);/);
  assert.match(spectatorState, /function sincronizarProgresoNivelBarraDesdeSegundos/);
  assert.match(spectatorSocket, /socket\.on\("temp_modos"[\s\S]*sincronizarProgresoNivelBarraDesdeSegundos\(data\);/);
});

test("long word definitions use bidirectional marquee in live roles", () => {
  const writerState = read("game/players/js/state.js");
  const writerSocket = read("game/players/js/socket-events.js");
  const spectatorState = read("game/spectator/js/state.js");
  const css = read("game/css/dashboard-players.css");

  assert.match(css, /@keyframes definicion-marquee[\s\S]*88%[\s\S]*--marquee-distance/);
  assert.match(writerState, /function renderObjetivoNivelEscritora[\s\S]*aplicarMarqueeSiOverflowEscritora\([\s\S]*\.objetivo-def/);
  assert.match(writerSocket, /socket\.on\(inspirar[\s\S]*aplicarMarqueeSiOverflowEscritora\(definicion\);/);
  assert.match(spectatorState, /function actualizarDefinicionConVisibilidad[\s\S]*aplicarMarqueeSiOverflow\(nodo\);/);
});

test("writer inverse disadvantage shows a clear active warning", () => {
  const writerSocket = read("game/players/js/socket-events.js");
  const css = read("game/css/dashboard-players.css");

  assert.match(writerSocket, /function mostrarAvisoInversoEscritora\(\)[\s\S]*ESCRIBE CADA PALABRA AL REV\\u00c9S/);
  assert.match(writerSocket, /function ocultarAvisoInversoEscritora\(\)[\s\S]*aviso\.remove\(\);/);
  assert.match(writerSocket, /\[PUTADA_INVERSO\]: function \(opciones = \{\}\) \{[\s\S]*mostrarAvisoInversoEscritora\(\);/);
  assert.match(writerSocket, /function finalizarDesventajaActivaEscritora\(tipo\) \{[\s\S]*if \(tipo === PUTADA_INVERSO\) \{[\s\S]*ocultarAvisoInversoEscritora\(\);/);
  assert.match(writerSocket, /function limpiarDesventajasActivasEscritora\(\) \{[\s\S]*ocultarAvisoInversoEscritora\(\);/);
  assert.match(css, /\.aviso-inverso-escritora \{/);
  assert.match(css, /\.aviso-inverso-escritora__texto/);
  assert.match(css, /body\.page-players\.aviso-inverso-escritora-activo #texto/);
  assert.match(css, /@keyframes avisoInversoEscritoraPulse/);
});

test("spectator viewport fit resets side veil before measuring natural size", () => {
  const js = read("game/spectator/js/state.js");
  const start = js.indexOf("const ajustarViewportEspectador = () => {");
  const end = js.indexOf("const programarAjusteViewportEspectador", start);
  assert.ok(start >= 0 && end > start, "spectator viewport fit function should exist");

  const body = js.slice(start, end);
  const resetCall = body.indexOf("prepararMedicionViewportEspectador();");
  const scrollRead = body.indexOf("spectator_fit_root.scrollWidth");
  assert.ok(resetCall >= 0, "viewport fit should reset transform and veil vars before measuring");
  assert.ok(scrollRead > resetCall, "viewport fit must measure after reset to avoid recursive shrink");

  const helper = js.slice(
    js.indexOf("const prepararMedicionViewportEspectador = () => {"),
    start
  );
  assert.match(helper, /--spectator-veil-left", "0px"/);
  assert.match(helper, /--spectator-veil-right", "0px"/);
  assert.match(helper, /--spectator-veil-width", "52vw"/);
});

test("spectator reconnect into active match keeps spectator branding visible", () => {
  const stateJs = read("game/spectator/js/state.js");
  const socketJs = read("game/spectator/js/socket-events.js");

  assert.match(stateJs, /function actualizarBrandingPartidaEspectador\(opciones = \{\}\)/);
  assert.doesNotMatch(stateJs, /ocultarBrandingPartida/);
  assert.match(stateJs, /cabecera\.style\.display = modoPartida \? \(cabecera_display_inicial \|\| ""\) : "none"/);
  assert.match(stateJs, /const displayBranding = modoPartida \? "" : "none"/);
  assert.match(stateJs, /logo\.style\.display = displayBranding/);
  assert.match(stateJs, /neon_espectador\.style\.display = displayBranding/);
  assert.match(stateJs, /actualizarBrandingPartidaEspectador\(\{ permitirIntro: true \}\);/);

  const postInicioStart = socketJs.indexOf("socket.on('post-inicio'");
  const limpiarStart = socketJs.indexOf("socket.on('limpiar'", postInicioStart);
  assert.ok(postInicioStart >= 0 && limpiarStart > postInicioStart, "post-inicio handler should exist");
  const postInicioBody = socketJs.slice(postInicioStart, limpiarStart);
  assert.match(postInicioBody, /partida_activa_espectador = true;[\s\S]*actualizarBrandingPartidaEspectador\(\);/);
  assert.doesNotMatch(postInicioBody, /logo\.style\.display = ""/);
  assert.doesNotMatch(postInicioBody, /neon\.style\.display = ""/);
});

test("spectator lightning disadvantage keeps its own timeout and repeats visibly", () => {
  const js = read("game/spectator/js/state.js");

  assert.match(js, /let tempo_rayo_espectador = null;/);
  assert.match(js, /function limpiarTimeoutRayoEspectador\(\)/);
  assert.match(js, /tempo_rayo_espectador = setTimeout/);
  assert.match(js, /lightning\.style\.animationDuration = "1\.15s"/);
  assert.match(js, /lightning\.style\.removeProperty\("animation-duration"\)/);

  const pauseStart = js.indexOf("function limpiarTemporizadoresEfectoPutadaEspectador");
  const pauseEnd = js.indexOf("function pausarDesventajasVisualesEspectador", pauseStart);
  const pauseBody = js.slice(pauseStart, pauseEnd);
  assert.match(pauseBody, /ocultarRayoEspectador\(\);/);
});

test("spectator countdown stays viewport anchored and width-capped", () => {
  const js = read("game/spectator/js/socket-events.js");
  const inicioStart = js.indexOf("socket.on('inicio'");
  const inicioEnd = js.indexOf("socket.on('post-inicio'");
  assert.ok(inicioStart >= 0 && inicioEnd > inicioStart, "spectator inicio handler should exist");

  const inicioBody = js.slice(inicioStart, inicioEnd);
  assert.match(js, /function calcularFontSizeCountdownEspectador\(texto, objetivoVw\)/);
  assert.match(js, /function medirTextoCountdownEspectador\(texto, fontSizePx\)/);
  assert.match(js, /getBoundingClientRect\(\)/);
  assert.match(js, /const maxWidthPx = viewportW \* 0\.72;/);
  assert.match(js, /const maxHeightPx = viewportH \* 0\.48;/);
  assert.match(js, /function crearCountdownEspectador\(texto\)/);
  assert.match(js, /\.appendTo\(\$\('body'\)\)/);
  assert.match(js, /function aplicarEstiloCountdownEspectador\(expandido = false\)/);
  assert.match(js, /'width': 'max-content'/);
  assert.match(js, /'max-width': 'none'/);
  assert.match(js, /'white-space': 'nowrap'/);
  assert.match(inicioBody, /crearCountdownEspectador\(tJuego2P\("countdown\.ready", \{\}, "\\u00bfPREPARADOS\?"\)\)/);
  assert.match(js, /function programarPasoCountdownEspectador\(paso, revisionCountdown, indiceAudio\)/);
  assert.match(js, /const pasoActual = Number\(paso\);/);
  assert.match(js, /crearCountdownEspectador\(pasoActual === 0 \? tJuego2P\("countdown\.write", \{\}, "\\u00a1ESCRIBE!"\) : pasoActual\)/);
  assert.match(inicioBody, /programarPasoCountdownEspectador\(3, revisionCountdown, 0\);/);
  assert.doesNotMatch(inicioBody, /setInterval\(/);
  assert.doesNotMatch(inicioBody, /appendTo\(\$\(\'\.container\'\)\)/);
  assert.doesNotMatch(inicioBody, /font-size': '40vw'/);
});

test("live role countdown labels are width-capped before scaling out", () => {
  const sharedCss = read("game/css/dashboard-players.css");
  assert.match(sharedCss, /body\.page-players #countdown \{[\s\S]*position: fixed;/);

  [
    {
      relPath: "game/players/js/socket-events.js",
      helper: "aplicarEstiloCountdownEscritora",
      sequencer: "programarPasoCountdownEscritora",
      inicio: 'socket.on("inicio"'
    },
    {
      relPath: "game/public/players/js/socket-events.js",
      helper: "aplicarEstiloCountdownMusa",
      sequencer: "programarPasoCountdownMusa",
      inicio: "socket.on('inicio'"
    },
    {
      relPath: "game/actors/source/js/socket-events.js",
      helper: "aplicarEstiloCountdownActor",
      sequencer: "programarPasoCountdownActor",
      inicio: "socket.on('inicio'"
    }
  ].forEach(({ relPath, helper, sequencer, inicio }) => {
    const js = read(relPath);
    const inicioStart = js.indexOf(inicio);
    assert.ok(inicioStart >= 0, `${relPath} should have an inicio handler`);
    const body = js.slice(inicioStart, inicioStart + 5000);
    assert.match(js, new RegExp(`function ${helper.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\(expandido = false\\)`));
    assert.match(js, new RegExp(`function ${sequencer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\(paso, `));
    assert.match(js, /const limitePorAncho = 88 \/ \(caracteres \* 0\.7\);/);
    assert.match(js, /const pasoActual = Number\(paso\);/);
    assert.match(js, /'max-width': '92vw'/);
    assert.match(js, /'white-space': 'nowrap'/);
    assert.match(body, /"\\u00bfPREPARADOS\?"/);
    assert.match(js, /"\\u00a1ESCRIBE!"/);
    assert.doesNotMatch(body, /setInterval\(/);
    assert.doesNotMatch(body, /font-size': '40vw'/);
    assert.doesNotMatch(body, /opacity': 50/);
  });
});

test("life bars animate from empty when they become visible", () => {
  [
    "game/players/js/state.js",
    "game/spectator/js/state.js",
    "game/public/players/js/state.js",
    "game/control/js/actions.js",
    "game/actors/source/js/socket-events.js"
  ].forEach((relPath) => {
    const js = read(relPath);
    assert.match(js, /function debeAnimarEntradaBarraVida\(elemento, opciones = \{\}\)/, relPath);
    assert.match(js, /elemento\.dataset\.vidaVisible !== "1"/, relPath);
    assert.match(js, /aplicarEstadoBarraVida\(elemento, 0\);/, relPath);
    assert.match(js, /if \(elemento\.dataset\) elemento\.dataset\.vidaVisible = "0";/, relPath);
    assert.match(js, /const animarEntrada = debeAnimarEntradaBarraVida\(elemento, opciones\);/, relPath);
    assert.match(js, /if \(elemento\.dataset\) elemento\.dataset\.vidaVisible = "1";/, relPath);
  });
});

test("life bar fill is rendered by an animatable pseudo element", () => {
  const css = read("game/css/dashboard-players.css");
  const fillStart = css.indexOf(".tiempo-vida::before");
  const sweepStart = css.indexOf(".tiempo-vida::after", fillStart);
  assert.ok(fillStart >= 0 && sweepStart > fillStart, "life bar fill pseudo-element should exist before the sweep layer");
  const fillRule = css.slice(fillStart, sweepStart);
  assert.match(fillRule, /width:\s*var\(--vida-pct\)/);
  assert.match(fillRule, /background:[\s\S]*var\(--vida-color\)/);
  assert.match(fillRule, /z-index:\s*0/);
  assert.doesNotMatch(fillRule, /z-index:\s*-\d/);

  const labelStart = css.indexOf(".tiempo-vida__label", sweepStart);
  assert.ok(labelStart > sweepStart, "life bar label should be layered above fill and sweep");
  const labelRule = css.slice(labelStart, css.indexOf("}", labelStart) + 1);
  assert.match(labelRule, /position:\s*relative/);
  assert.match(labelRule, /z-index:\s*2/);

  const baseStart = css.indexOf(".tiempo-vida {");
  const baseEnd = css.indexOf(".tiempo-vida::before", baseStart);
  const baseRule = css.slice(baseStart, baseEnd);
  assert.doesNotMatch(baseRule, /var\(--vida-pct\)[\s\S]*rgba\(8, 15, 28/);
});

test("control PDF generator uses selected language translations", () => {
  const js = read("game/control/js/socket-events.js");

  assert.match(js, /function tPdfControl/);
  [
    "pdf.match_report_title",
    "pdf.section.quick_summary",
    "pdf.section.heatmap",
    "pdf.muse_gift_title",
    "pdf.muse_team_writer_line",
    "pdf.muse_status_entered_by_rival"
  ].forEach((key) => {
    assert.match(js, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
  assert.doesNotMatch(js, /doc\.text\("REGALO DE MUSA"/);
  assert.doesNotMatch(js, /doc\.text\("PALABRAS ENVIADAS"/);
  assert.doesNotMatch(js, /\["Enviadas",/);
});

test("control parameters own spectator scale and removed inserted word goal", () => {
  const html = read("game/control/index.html");
  const css = read("game/control/index.css");
  const stateJs = read("game/control/js/state.js");
  const actionsJs = read("game/control/js/actions.js");
  const i18n = read("game/js/i18n.js");

  assert.match(html, /<td class="spectator-scale-param">[\s\S]*<input type="range" id="escala_espectador"[\s\S]*class="parametro spectator-scale-range"[\s\S]*min="82" max="128" step="1" value="100"/);
  assert.match(html, /id="escala_espectador_valor" class="spectator-scale-value">100%<\/span>/);
  assert.match(html, /data-i18n="control\.param\.spectator_scale"/);
  assert.doesNotMatch(html, /cambiarValor\('escala_espectador'|type="number" id="escala_espectador"/);
  assert.match(css, /Slider de tamaño de espectador en parametros/);
  assert.match(css, /td\.spectator-scale-param\s*\{[\s\S]*grid-template-columns: minmax\(4\.65rem, 0\.72fr\) minmax\(0, 1fr\);[\s\S]*overflow: hidden;/);
  assert.match(css, /\.spectator-scale-slider-control\s*\{[\s\S]*grid-template-columns: minmax\(3\.7rem, 1fr\) minmax\(2\.18rem, auto\);[\s\S]*max-width: 100%;[\s\S]*padding-right: 0\.24rem;/);
  assert.match(css, /#panel_parametros \.spectator-scale-range\s*\{[\s\S]*max-width: 100%;[\s\S]*box-sizing: border-box;/);
  assert.match(css, /#panel_parametros \.spectator-scale-range::-webkit-slider-thumb\s*\{[\s\S]*border-radius: 999px;[\s\S]*background: #6bff83;/);
  assert.match(css, /\.spectator-scale-value\s*\{[\s\S]*color: #6bff83;/);
  assert.doesNotMatch(html, /palabras_insertadas_meta/);
  assert.doesNotMatch(html, /control\.param\.inserted_goal/);

  assert.match(stateJs, /let ESCALA_UI_ESPECTADOR = obtenerEscalaUiEspectadorParametro\(\);/);
  assert.doesNotMatch(stateJs, /PALABRAS_INSERTADAS_META/);
  assert.doesNotMatch(stateJs, /palabras_insertadas_meta/);

  assert.match(actionsJs, /socket\.emit\("ajustar_escala_espectador", \{ valor: escalaEspectador \}\);/);
  assert.match(actionsJs, /ESCALA_UI_ESPECTADOR: escalaEspectador/);
  assert.match(actionsJs, /const valor = document\.getElementById\("escala_espectador_valor"\);/);
  assert.match(actionsJs, /valor\.textContent = `\$\{porcentaje\}%`;/);
  assert.doesNotMatch(actionsJs, /PALABRAS_INSERTADAS_META/);

  assert.match(i18n, /"control\.param\.spectator_scale"/);
  assert.doesNotMatch(i18n, /"control\.param\.inserted_goal"/);
});

test("control exposes targeted remote reload buttons and live roles reload on command", () => {
  const controlHtml = read("game/control/index.html");
  const controlActions = read("game/control/js/actions.js");
  const playerSocket = read("game/players/js/socket-events.js");
  const spectatorSocket = read("game/spectator/js/socket-events.js");
  const actorSocket = read("game/actors/source/js/socket-events.js");
  const jurySocket = read("game/jurado/js/socket-events.js");

  [
    "reiniciarRolRemoto('escritxr1')",
    "reiniciarRolRemoto('escritxr2')",
    "reiniciarRolRemoto('espectador')",
    "reiniciarRolRemoto('actorxs1')",
    "reiniciarRolRemoto('actorxs2')"
  ].forEach((handler) => {
    assert.match(controlHtml, new RegExp(handler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  assert.match(controlActions, /socket\.emit\("reiniciar_rol_remoto", \{ rol: destino \}\);/);
  [playerSocket, spectatorSocket, actorSocket, jurySocket].forEach((source) => {
    assert.match(source, /socket\.on\("recargar_rol_remoto"/);
    assert.match(source, /window\.location\.reload\(\)/);
  });
});

test("actor role supports local text annotations without emitting them to writers", () => {
  const html = read("game/actors/source/index.html");
  const css = read("game/actors/source/css/publico.css");
  const actions = read("game/actors/source/js/actions.js");
  const annotations = read("game/actors/source/js/annotations.js");
  const socket = read("game/actors/source/js/socket-events.js");

  assert.match(html, /id="actor_annotation_toolbar"/);
  assert.match(html, /id="actor_annotation_margin"/);
  assert.match(html, /id="actor_annotation_note_editor"/);
  assert.match(html, /id="actor_annotation_note_input"/);
  assert.match(html, /id="actor_annotation_note_save"/);
  assert.match(html, /id="actor_annotation_note_cancel"/);
  assert.match(html, /data-annotation-action="underline"/);
  assert.match(html, /data-underline-color="#ffe95c"/);
  assert.match(html, /data-underline-color="#6bff83"/);
  assert.match(html, /data-annotation-action="color"/);
  assert.doesNotMatch(html, /data-annotation-action="background"/);
  assert.doesNotMatch(html, /actor-annotation-swatch--background/);
  assert.match(html, /data-annotation-action="note"/);

  assert.match(css, /\.actor-annotation-toolbar/);
  assert.match(css, /\.actor-annotation-note-editor/);
  assert.match(css, /\.actor-annotation-note-input/);
  assert.match(css, /\.actor-annotation-note-editor__button--save/);
  assert.match(css, /\.actor-annotation-margin/);
  assert.match(css, /\.actor-annotation-mark--underline/);
  assert.match(css, /\.actor-annotation-underline-swatch--yellow/);
  assert.match(css, /\.actor-annotation-underline-swatch--green/);
  assert.match(css, /text-decoration-color:\s*var\(--annotation-underline-color, currentcolor\)/);
  assert.match(css, /\.actor-annotation-mark--note/);
  assert.match(css, /content:\s*attr\(data-annotation-index\)/);
  assert.match(css, /\.actor-annotation-mark\s*\{[\s\S]*padding:\s*0;/);
  assert.match(css, /\.actor-annotation-mark--note::after\s*\{[\s\S]*position:\s*absolute;[\s\S]*pointer-events:\s*none;/);
  const noteAfterStart = css.indexOf(".actor-annotation-mark--note::after");
  const noteAfterEnd = css.indexOf("}", noteAfterStart);
  const noteAfterRule = css.slice(noteAfterStart, noteAfterEnd);
  assert.doesNotMatch(noteAfterRule, /margin-left:/);

  assert.match(annotations, /window\.localStorage\.setItem\(getStorageKey\(\), json\)/);
  assert.match(annotations, /function openNoteEditor\(selectionInfo, options = \{\}\)/);
  assert.match(annotations, /function saveNoteEditor\(\)/);
  assert.match(annotations, /function handleNoteEditorKeydown\(event\)/);
  assert.match(annotations, /noteSaveEl\.addEventListener\("click", saveNoteEditor\)/);
  assert.match(annotations, /noteCancelEl\.addEventListener\("click", closeNoteEditor\)/);
  assert.match(annotations, /new BroadcastChannel\(`\$\{SYNC_CHANNEL_PREFIX\}\$\{getStorageKey\(\)\}`\)/);
  assert.match(annotations, /window\.addEventListener\("storage", handleStorageSync\)/);
  assert.match(annotations, /function applySyncedAnnotations\(raw\)/);
  assert.match(annotations, /syncChannel\.postMessage\(\{/);
  assert.match(annotations, /origin:\s*INSTANCE_ID/);
  assert.match(annotations, /if \(data\.origin === INSTANCE_ID \|\| data\.key !== getStorageKey\(\)\) return;/);
  assert.match(annotations, /document\.createTreeWalker\(container, NodeFilter\.SHOW_TEXT\)/);
  assert.match(annotations, /resolveAnnotationRange\(annotation, plainText\)/);
  assert.match(annotations, /function replaceColorInSelection\(selectionInfo\)/);
  assert.match(annotations, /cloneColorSegment\(annotation/);
  assert.match(annotations, /if \(patch\.color\) \{[\s\S]*replaceColorInSelection\(selectionInfo\);/);
  assert.match(annotations, /underlineColor:\s*escapeCssColor\(annotation\.underlineColor\)/);
  assert.match(annotations, /function replaceUnderlineInSelection\(selectionInfo\)/);
  assert.match(annotations, /cloneUnderlineSegment\(annotation/);
  assert.match(annotations, /if \(patch\.underline\) \{[\s\S]*replaceUnderlineInSelection\(selectionInfo\);/);
  assert.match(annotations, /button\.dataset\.underlineColor/);
  assert.match(annotations, /--annotation-underline-color/);
  assert.match(annotations, /function aplicarAnotacionesPorCapas\(activeAnnotations, noteIndexes\)/);
  assert.match(annotations, /\.filter\(\(annotation\) => !String\(annotation\.note \|\| ""\)\.trim\(\)\)[\s\S]*\.filter\(\(annotation\) => String\(annotation\.note \|\| ""\)\.trim\(\)\)/);
  assert.match(annotations, /span\.dataset\.annotationIndex/);
  assert.match(annotations, /window\.ScribActorAnnotations = \{/);
  assert.doesNotMatch(annotations, /DEFAULT_BACKGROUND_COLOR/);
  assert.doesNotMatch(annotations, /style\.backgroundColor/);
  assert.doesNotMatch(annotations, /action === "background"/);
  assert.doesNotMatch(annotations, /window\.prompt/);
  assert.doesNotMatch(annotations, /socket\.emit/);

  assert.match(socket, /pintarTextoActorLocal\(htmlLocal\);/);
  assert.match(socket, /ScribActorAnnotations\.setRemoteHtml\(contenido\)/);
  assert.match(socket, /limpiarAnotacionesLocalesActor\(\);/);
});

test("actor fullscreen is selected explicitly instead of toggled by page clicks", () => {
  const selectorHtml = read("game/actors/index.html");
  const selectorJs = read("game/actors/js/actor-selector.js");
  const sourceHtml = read("game/actors/source/index.html");
  const sourceCss = read("game/actors/source/css/publico.css");
  const actions = read("game/actors/source/js/actions.js");

  assert.match(selectorHtml, /data-actor-url="\.\/source\/index\.html\?player=1"/);
  assert.match(selectorHtml, /data-actor-url="\.\/source\/index\.html\?player=2"/);
  assert.doesNotMatch(selectorHtml, /onclick="window\.location\.href/);
  assert.match(selectorJs, /function solicitarPantallaCompletaSeleccionActor\(\)/);
  assert.match(selectorJs, /request\.call\(root\)/);
  assert.match(selectorJs, /window\.location\.href = destino;/);

  assert.match(sourceHtml, /id="actor_fullscreen_toggle"/);
  assert.match(sourceHtml, /&#x1F5A5;&#xFE0F; Pantalla completa/);
  assert.match(sourceCss, /\.actor-fullscreen-toggle/);
  assert.match(sourceCss, /min-width:\s*clamp\(148px, 17vw, 230px\)/);
  assert.match(sourceCss, /white-space:\s*nowrap/);
  assert.match(actions, /function alternarPantallaCompletaActor\(event\)/);
  assert.match(actions, /"\\u\{1F5A5\}\\uFE0F Pantalla completa"/);
  assert.match(actions, /"\\u274C Salir pantalla completa"/);
  assert.doesNotMatch(actions, /activo \? "ESC" : "FS"/);
  assert.match(actions, /boton\.addEventListener\("click", alternarPantallaCompletaActor\)/);
  assert.match(actions, /document\.addEventListener\("fullscreenchange", actualizarBotonPantallaCompletaActor\)/);
  assert.doesNotMatch(actions, /document\.addEventListener\('click', function\(event\)/);
});
