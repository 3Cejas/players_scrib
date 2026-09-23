const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "game/js/domains/performance-protection.js"), "utf8");

function loadApi() {
  const window = {
    document: null,
    performance: {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  vm.runInNewContext(SOURCE, { window, globalThis: window }, { filename: "performance-protection.js" });
  return window.ScribPerformanceProtection;
}

test("browser policy distinguishes N1, N2 and sustained recovery", () => {
  const api = loadApi();
  const machine = api.crearMaquinaProteccion({
    warningSustainMs: 10,
    dangerSustainMs: 10,
    emergencySustainMs: 5,
    minimumLevelMs: 10,
    recoverySustainMs: 10
  });

  assert.equal(machine.evaluar({ lag_p95_ms: 100 }, 100).level, 0);
  assert.equal(machine.evaluar({ lag_p95_ms: 100 }, 111).level, 1);
  assert.equal(machine.evaluar({ lag_p95_ms: 200 }, 112).level, 1);
  assert.equal(machine.evaluar({ lag_p95_ms: 200 }, 123).level, 2);
  assert.equal(machine.evaluar({}, 124).level, 2);
  assert.equal(machine.evaluar({}, 135).level, 1);
  assert.equal(machine.evaluar({}, 136).level, 1);
  assert.equal(machine.evaluar({}, 147).level, 0);
});

test("browser policy ignores unavailable FPS and classifies emergency memory pressure", () => {
  const api = loadApi();
  assert.equal(api.analizarMetricas({ fps: 0, visible: true }).warning, false);
  const pressure = api.analizarMetricas({ heap_ratio: 0.92 });
  assert.equal(pressure.warning, true);
  assert.equal(pressure.danger, true);
  assert.equal(pressure.emergency, true);
});

test("demanding roles load protection assets and Control keeps compact per-role witnesses", () => {
  const pages = [
    "game/control/index.html",
    "game/players/index.html",
    "game/spectator/index.html",
    "game/actors/source/index.html"
  ];
  pages.forEach((relative) => {
    const html = fs.readFileSync(path.join(ROOT, relative), "utf8");
    assert.match(html, /performance-protection\.css\?v=20260923a/);
    assert.match(html, /performance-protection\.js\?v=20260923a/);
  });

  const control = fs.readFileSync(path.join(ROOT, "game/control/index.html"), "utf8");
  ["control", "espectador", "player_1", "player_2", "actor_1", "actor_2", "tecnica"].forEach((role) => {
    assert.match(control, new RegExp(`id="proteccion_${role}"`));
  });
  const css = fs.readFileSync(path.join(ROOT, "game/control/index.css"), "utf8");
  assert.match(css, /\.performance-protection-witness\[data-level="2"\]/);
  assert.doesNotMatch(
    fs.readFileSync(path.join(ROOT, "game/css/performance-protection.css"), "utf8"),
    /\*\s*\{[^}]*animation\s*:/,
    "protection must not disable every animation, because some are gameplay cues"
  );
});
