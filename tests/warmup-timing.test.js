const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { crearReloj } = require("../game/js/domains/warmup-timing.js");

const SERVER_TS = 1900000000000;

test("detonator age ignores device clocks ahead/behind at connection and later clock corrections", () => {
  const source = fs.readFileSync(path.join(__dirname, "../game/js/domains/warmup-timing.js"), "utf8");
  for (const skew of [0, 60000, -60000, 86400000, -86400000, 31536000000, -31536000000]) {
    let monotonic = 500;
    let clockSkew = skew;
    let wallClockReads = 0;
    const window = { performance: { now: () => monotonic } };
    vm.runInNewContext(source, {
      window,
      Date: { now: () => { wallClockReads += 1; return SERVER_TS + clockSkew; } }
    });
    const clock = window.ScribWarmupTiming.crearReloj();
    clock.sincronizar({ server_ts: SERVER_TS });
    assert.equal(clock.edadMs(SERVER_TS - 1200), 1200);
    monotonic += 700;
    clockSkew = -skew + 999999999;
    assert.equal(clock.edadMs(SERVER_TS - 1200), 1900);
    clockSkew = skew - 999999999;
    assert.equal(clock.edadMs(SERVER_TS - 1200), 1900);
    assert.equal(wallClockReads, 0);
  }
});

test("a restored detonator retains its server age instead of restarting its lifetime", () => {
  let monotonic = 0;
  const clock = crearReloj(() => monotonic);
  clock.sincronizar({ server_ts: SERVER_TS + 6000 });
  assert.equal(clock.edadMs(SERVER_TS), 6000);
  monotonic = 750;
  assert.equal(clock.edadMs(SERVER_TS), 6750);
  clock.sincronizar({ server_ts: SERVER_TS + 7500 });
  assert.equal(clock.edadMs(SERVER_TS), 7500);
  monotonic += 2500;
  assert.equal(clock.edadMs(SERVER_TS), 10000);
});

test("highlight timestamps use the same server reference and reject invalid dates", () => {
  let monotonic = 30;
  const clock = crearReloj(() => monotonic);
  assert.equal(clock.edadMs(SERVER_TS), 0);
  clock.sincronizar({ server_ts: SERVER_TS });
  assert.equal(clock.edadMs(SERVER_TS - 300), 300);
  monotonic += 1200;
  assert.equal(clock.edadMs(SERVER_TS - 300), 1500);
  for (const invalid of [undefined, null, "invalid", Infinity, -1, 0]) {
    assert.equal(clock.edadMs(invalid), 0);
  }
  assert.equal(clock.edadMs(SERVER_TS + 5000), 0);
});

test("legacy snapshots remain visible without reading the local date or restarting decay on repaint", () => {
  let monotonic = 10;
  const clock = crearReloj(() => monotonic);
  const legacy = { equipos: { 1: { palabras: [{ ts: SERVER_TS, animOnTs: 0 }] }, 2: { palabras: [{ ts: SERVER_TS - 500 }] } } };
  clock.sincronizar(legacy);
  assert.equal(clock.edadMs(SERVER_TS), 0);
  assert.equal(clock.edadMs(SERVER_TS - 500), 500);
  monotonic += 800;
  clock.sincronizar(legacy);
  assert.equal(clock.edadMs(SERVER_TS), 800);
  clock.sincronizar({ equipos: { 1: { palabras: [{ ts: SERVER_TS + 1000 }] } } });
  assert.equal(clock.edadMs(SERVER_TS + 1000), 0);
  assert.equal(clock.edadMs(SERVER_TS), 1000);
});

test("writers and spectators load monotonic timing before state and use it for decay/highlights", () => {
  for (const role of ["players", "spectator"]) {
    const html = fs.readFileSync(path.join(__dirname, `../game/${role}/index.html`), "utf8");
    const state = fs.readFileSync(path.join(__dirname, `../game/${role}/js/state.js`), "utf8");
    const script = '../js/domains/warmup-timing.js?v=20261001a';
    assert.ok(html.includes(script));
    assert.ok(html.indexOf(script) < html.indexOf('./js/state.js?'));
    const renderName = role === "players" ? "renderizarPalabrasCalentamientoEscritor" : "renderizarPalabrasCalentamiento";
    const start = state.indexOf(`const ${renderName} =`);
    const render = state.slice(start, state.indexOf('\n};', start));
    assert.doesNotMatch(render, /Date\.now\(/);
    assert.match(render, /\.edadMs\(entrada\.ts\)/);
    assert.match(render, /\.edadMs\(entrada\.animOnTs\)/);
    assert.match(render, /\.edadMs\(entrada\.animOffTs\)/);
    assert.match(state, /reloj_calentamiento_\w+\.sincronizar\(data\)/);
  }
});
