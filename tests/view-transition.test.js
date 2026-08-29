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

test("spectator wires the animated curtain into every resolved view change", () => {
  const html = fs.readFileSync(path.join(ROOT, "game/spectator/index.html"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "game/css/dashboard-players.css"), "utf8");
  const state = fs.readFileSync(path.join(ROOT, "game/spectator/js/state.js"), "utf8");

  assert.match(html, /id="spectator_view_transition"[\s\S]*data-view-transition-label/);
  assert.match(html, /domains\/view-transition\.js\?v=20260829a/);
  assert.match(css, /spectatorViewCoverBlue[\s\S]*spectatorViewRevealRed/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.spectator-view-transition/);
  assert.match(state, /controlador_transicion_vista_espectador\.transition\(\{[\s\S]*swap: \(\) => aplicarModoVistaEspectadorUi\(modo\)/);
});
