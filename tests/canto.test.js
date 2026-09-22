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
    assert.match(html, /domains\/canto\.js\?v=20260923b/);
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
  assert.equal(canto.DEFAULT_FADE_MS, 3600);
  assert.equal(canto.EXIT_AUDIO_FADE_MS, 1400);
  assert.match(read("game/js/domains/canto.js"), /Math\.cos\(Math\.PI \* progress\)/);
  assert.match(spectatorState, /Math\.cos\(Math\.PI \* progreso\)/);
  assert.match(read("game/js/domains/canto.js"), /dispatchAudioState\(false, fadeOutMs\)/);
});

test("canto audio keeps playing after the visual exit and pauses only when fade-out ends", () => {
  let clock = 0;
  let nextTimerId = 1;
  const timers = new Map();
  const setTimeoutFake = (callback, delay = 0) => {
    const id = nextTimerId++;
    timers.set(id, { callback, at: clock + Math.max(0, Number(delay) || 0) });
    return id;
  };
  const clearTimeoutFake = (id) => timers.delete(id);
  const advance = (milliseconds) => {
    const limit = clock + milliseconds;
    while (true) {
      const pending = [...timers.entries()]
        .filter(([, timer]) => timer.at <= limit)
        .sort((left, right) => left[1].at - right[1].at)[0];
      if (!pending) break;
      const [id, timer] = pending;
      timers.delete(id);
      clock = timer.at;
      timer.callback();
    }
    clock = limit;
  };
  const classList = () => {
    const values = new Set();
    return {
      add: (...names) => names.forEach((name) => values.add(name)),
      remove: (...names) => names.forEach((name) => values.delete(name)),
      contains: (name) => values.has(name)
    };
  };
  const audio = {
    currentTime: 0,
    duration: 32,
    loop: true,
    muted: false,
    pauseCalls: 0,
    paused: true,
    readyState: 1,
    src: "",
    volume: 0.86,
    load() {},
    play() {
      this.paused = false;
    },
    pause() {
      this.pauseCalls += 1;
      this.paused = true;
    }
  };
  const live = { textContent: "" };
  const overlay = {
    classList: classList(),
    hidden: true,
    offsetWidth: 1,
    innerHTML: "",
    setAttribute() {},
    remove() {},
    querySelector(selector) {
      if (selector === "[data-canto-audio]") return audio;
      if (selector === "[data-canto-live]") return live;
      return null;
    }
  };
  const documentRef = {
    body: { classList: classList(), appendChild() {} },
    createElement: () => overlay,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {}
  };
  const socketRef = { connected: false, on() {}, emit() {} };
  const windowRef = {
    CustomEvent: class CustomEvent {},
    clearTimeout: clearTimeoutFake,
    location: { href: "http://localhost/game/spectator/index.html", search: "" },
    setTimeout: setTimeoutFake
  };
  const controller = canto.createController({
    documentRef,
    now: () => clock,
    role: "spectator",
    socketRef,
    windowRef
  });

  controller.handleState({ activo: true, session_id: "canto_test", secuencia: 1 });
  advance(2000);
  assert.equal(audio.paused, false);
  assert.equal(audio.pauseCalls, 0);

  controller.handleState({ activo: false, session_id: "canto_test", secuencia: 2 });
  advance(1100);
  assert.equal(overlay.hidden, true);
  assert.equal(audio.paused, false);
  assert.equal(audio.pauseCalls, 0);
  assert.ok(audio.volume > 0);

  advance(300);
  assert.equal(audio.volume, 0);
  assert.equal(audio.paused, true);
  assert.equal(audio.pauseCalls, 1);
  assert.equal(audio.currentTime, 0);
});
