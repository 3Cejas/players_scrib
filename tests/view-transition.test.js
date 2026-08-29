const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const transitions = require("../game/js/domains/view-transition.js");
const ROOT = path.resolve(__dirname, "..");

function fakeOverlay() {
  const classes = new Set();
  const label = { textContent: "" };
  return {
    hidden: true,
    dataset: {},
    offsetWidth: 1920,
    attributes: {},
    classList: {
      add(...values) { values.forEach((value) => classes.add(value)); },
      remove(...values) { values.forEach((value) => classes.delete(value)); },
      contains(value) { return classes.has(value); }
    },
    setAttribute(name, value) { this.attributes[name] = value; },
    querySelector(selector) { return selector === "[data-view-transition-label]" ? label : null; },
    label
  };
}

test("spectator view transition swaps scenes only after the curtain covers them", () => {
  const overlay = fakeOverlay();
  const timers = [];
  let swaps = 0;
  const controller = transitions.createController({
    overlay,
    setTimer(callback, delay) { timers.push({ callback, delay }); return timers.length; },
    clearTimer() {}
  });

  assert.equal(controller.transition({ from: "partida", to: "calentamiento", swap() { swaps += 1; } }), true);
  assert.equal(swaps, 0);
  assert.equal(overlay.hidden, false);
  assert.equal(overlay.classList.contains("is-covering"), true);
  assert.equal(overlay.label.textContent, "VISTA DETONADORES");
  assert.equal(timers[0].delay, transitions.COVER_MS);

  timers[0].callback();
  assert.equal(swaps, 1);
  assert.equal(overlay.classList.contains("is-revealing"), true);
  assert.equal(timers[1].delay, transitions.REVEAL_MS);

  timers[1].callback();
  assert.equal(overlay.hidden, true);
  assert.equal(controller.isRunningTo("calentamiento"), false);
});

test("same scene and reduced-motion users switch immediately", () => {
  const overlay = fakeOverlay();
  let swaps = 0;
  const controller = transitions.createController({ overlay, reducedMotion: () => true });
  assert.equal(controller.transition({ from: "partida", to: "stats", swap() { swaps += 1; } }), false);
  assert.equal(swaps, 1);
  assert.equal(overlay.hidden, true);

  const regular = transitions.createController({ overlay });
  assert.equal(regular.transition({ from: "partida", to: "partida", swap() { swaps += 1; } }), false);
  assert.equal(swaps, 2);
});

test("tutorial and detonator views share looped music with three-second fades and transition sound", () => {
  let clock = 0;
  const timers = [];
  const media = [];
  const documentListeners = new Map();
  const createAudio = (url) => {
    const audio = {
      url,
      volume: 1,
      currentTime: 0,
      loop: false,
      paused: true,
      playCalls: 0,
      pauseCalls: 0,
      setAttribute() {},
      play() { this.paused = false; this.playCalls += 1; },
      pause() { this.paused = true; this.pauseCalls += 1; }
    };
    media.push(audio);
    return audio;
  };
  const setTimer = (callback, delay) => {
    const timer = { callback, delay, cancelled: false };
    timers.push(timer);
    return timer;
  };
  const clearTimer = (timer) => { if (timer) timer.cancelled = true; };
  const drainTimers = () => {
    while (timers.length) {
      const timer = timers.shift();
      if (timer.cancelled) continue;
      clock += timer.delay;
      timer.callback();
    }
  };
  const controller = transitions.createAudioController({
    createAudio,
    documentRef: {
      addEventListener(name, listener) { documentListeners.set(name, listener); },
      removeEventListener(name) { documentListeners.delete(name); }
    },
    musicUrl: "menu.mp3",
    transitionUrl: "view.mp3",
    setTimer,
    clearTimer,
    now: () => clock,
    fadeDurationMs: 3000,
    musicVolume: 0.5
  });
  const music = media[0];
  const sound = media[1];

  controller.setMode("partida", { initial: true });
  assert.equal(sound.playCalls, 0);
  controller.setMode("tutorial");
  assert.equal(sound.playCalls, 1);
  assert.equal(music.loop, true);
  drainTimers();
  assert.equal(music.volume, 0.5);
  assert.equal(music.paused, false);

  controller.setMode("calentamiento");
  assert.equal(sound.playCalls, 2);
  assert.equal(music.volume, 0.5, "music continues between both musical views");

  controller.setMode("partida");
  assert.equal(sound.playCalls, 3);
  assert.equal(timers[0].delay, 50);
  drainTimers();
  assert.equal(music.volume, 0);
  assert.equal(music.paused, true);

  controller.setMode("tutorial");
  drainTimers();
  controller.setDucked(true);
  drainTimers();
  assert.equal(music.volume, 0, "the narrated tutorial ducks the separate background loop");
  documentListeners.get("scrib:video-tutorial-ending")();
  assert.equal(music.paused, false, "the menu loop starts before the tutorial overlay disappears");
  drainTimers();
  assert.equal(music.volume, 0.5);
  controller.destroy();
  assert.equal(documentListeners.has("scrib:video-tutorial-ending"), false);
});

test("spectator wires the animated curtain into every resolved view change", () => {
  const html = fs.readFileSync(path.join(ROOT, "game/spectator/index.html"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "game/css/dashboard-players.css"), "utf8");
  const state = fs.readFileSync(path.join(ROOT, "game/spectator/js/state.js"), "utf8");

  assert.match(html, /id="spectator_view_transition"[\s\S]*data-view-transition-label/);
  assert.match(html, /domains\/view-transition\.js\?v=20260829s/);
  assert.match(css, /spectatorViewCoverBlue[\s\S]*spectatorViewRevealRed/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.spectator-view-transition/);
  assert.match(state, /controlador_transicion_vista_espectador\.transition\(\{[\s\S]*swap: \(\) => aplicarModoVistaEspectadorUi\(modo\)/);
  assert.match(state, /musicUrl: "\.\.\/audio\/1\.%20MENU%20DE%20INICIO\.mp3"/);
  assert.match(state, /transitionUrl: "\.\.\/audio\/FX\/cambio-vista\.mp3"/);
  assert.match(state, /fadeDurationMs: 3000/);
  assert.ok(fs.statSync(path.join(ROOT, "game/audio/FX/cambio-vista.mp3")).size > 5_000);
  assert.equal(transitions.viewLabel("tutorial"), "VISTA TUTORIAL");
});

test("muses reuse the curtain for tutorial, detonators, game and result changes", () => {
  const html = fs.readFileSync(path.join(ROOT, "game/public/players/index.html"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "game/public/players/css/publico.css"), "utf8");
  const state = fs.readFileSync(path.join(ROOT, "game/public/players/js/state.js"), "utf8");
  const sockets = fs.readFileSync(path.join(ROOT, "game/public/players/js/socket-events.js"), "utf8");

  assert.match(html, /id="musa_view_transition"[\s\S]*data-view-transition-label/);
  assert.match(css, /musaViewCoverBlue[\s\S]*musaViewRevealRed/);
  assert.match(css, /body\.musa-vista-cambiando #contenedor[\s\S]*musaViewContentReveal/);
  assert.match(state, /function animarTransicionVistaMusa\(destino\)/);
  ["tutorial", "calentamiento", "partida", "resultado"].forEach((modo) => {
    assert.match(state, new RegExp(`animarTransicionVistaMusa\\("${modo}"\\)`));
  });
  assert.match(sockets, /socket\.on\("vista_espectador_modo"[\s\S]*actualizarModoVistaMusaRemoto/);
  assert.equal(transitions.viewLabel("resultado"), "FIN DE PARTIDA");
});
