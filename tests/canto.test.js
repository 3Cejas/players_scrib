const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const canto = require("../game/js/domains/canto.js");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("canto normalizes its authoritative loop, fade and complete MC text", () => {
  const state = canto.normalizeState({
    activo: true,
    session_id: "canto_1",
    secuencia: 4,
    posicion_segundos: 65.5,
    configuracion: {
      audio_url: "../media/musica-iliada.mp3",
      duracion_audio_segundos: 32,
      fade_ms: 1800,
      loop: true,
      texto: canto.DEFAULT_TEXT
    }
  });
  assert.equal(state.active, true);
  assert.equal(state.positionSeconds, 65.5);
  assert.equal(state.config.audioSeconds, 32);
  assert.equal(state.config.fadeMs, 1800);
  assert.equal(state.config.loop, true);
  assert.match(state.config.text, /Cántame a mí, Musa, la historia/);
  assert.match(state.config.text, /Junto con vuestra escritora, junto con vuestro equipo/);
});

test("spectator and muses load the canto scene while only spectator owns its audio", () => {
  const spectator = read("game/spectator/index.html");
  const muse = read("game/public/players/index.html");
  const source = read("game/js/domains/canto.js");
  const css = read("game/css/canto.css");
  const audioPath = path.join(ROOT, "game/media/musica-iliada.mp3");

  [spectator, muse].forEach((html) => {
    assert.match(html, /css\/canto\.css\?v=20260920a/);
    assert.match(html, /domains\/canto\.js\?v=20260922d/);
  });
  assert.match(source, /role === "spectator"[\s\S]*createSpectatorOverlay[\s\S]*createMuseOverlay/);
  assert.match(source, /<audio class="scrib-canto__audio"[^>]*loop/);
  assert.match(source, /scrib:canto-visibility/);
  assert.match(css, /cantoFlagUnfurl/);
  assert.match(css, /cantoFlagFold/);
  assert.match(css, /\.scrib-canto--muse\.is-leaving/);
  assert.equal(fs.existsSync(audioPath), true);
  assert.ok(fs.statSync(audioPath).size > 1_000_000);
});

test("Control exposes one stateful Canto button and authoritative socket actions", () => {
  const html = read("game/control/index.html");
  const controller = read("game/control/js/canto-control.js");
  const sockets = read("game/control/js/socket-events.js");

  assert.match(html, /id="boton_canto"[^>]*aria-pressed="false"[^>]*>[^<]*<span[^>]*>[^<]*<\/span> CANTO/);
  assert.match(html, /id="boton_canto" class="[^"]*btn-vista-espectador[^"]*"/);
  assert.match(controller, /canto_desactivar/);
  assert.match(controller, /canto_activar/);
  assert.match(controller, /emitted && activating && typeof global\.mostrar_vista_partida === "function"/);
  assert.match(controller, /global\.mostrar_vista_partida\(\)/);
  assert.match(controller, /data\.activo/);
  assert.doesNotMatch(controller, /\? "ACTIVO"/);
  assert.match(sockets, /pedir_canto_estado/);
  assert.match(sockets, /socket\.on\('canto_estado'/);
});

test("canto overlays keep only the requested spectator copy and omit the muse alliance", () => {
  const source = read("game/js/domains/canto.js");

  assert.match(source, /CÁNTAME A MÍ, MUSA,[\s\S]*LA HISTORIA/);
  assert.match(source, /AQUELLA QUE ESTÁ A PUNTO DE HACERSE REALIDAD/);
  assert.doesNotMatch(source, /EL CANTO DE LAS MUSAS/);
  assert.doesNotMatch(source, /scrib-canto__script/);
  assert.doesNotMatch(source, /scrib-canto__alliance/);
  assert.doesNotMatch(source, /CON TU ESCRITORA|CON TU EQUIPO/);
});

test("spectator crossfades existing music while canto enters and leaves", () => {
  const viewTransition = read("game/js/domains/view-transition.js");
  const spectatorState = read("game/spectator/js/state.js");
  assert.match(viewTransition, /onCantoVisibility[\s\S]*fadeMusic\(targetMusicVolume\(\), duration\)/);
  assert.match(viewTransition, /addEventListener\?\.\("scrib:canto-visibility", onCantoVisibility\)/);
  assert.match(spectatorState, /cruzarAudiosPartidaConCanto/);
  assert.match(spectatorState, /\[sonido, sonido_modo\]/);
  assert.match(spectatorState, /fundirAudioExternoCanto\(media, 0, duracion\)/);
  assert.equal(canto.EXIT_AUDIO_FADE_MULTIPLIER, 4);
  assert.match(read("game/js/domains/canto.js"), /Math\.cos\(Math\.PI \* progress\)/);
  assert.match(spectatorState, /Math\.cos\(Math\.PI \* progreso\)/);
  assert.match(read("game/js/domains/canto.js"), /dispatchAudioState\(false, fadeOutMs\)/);
});
