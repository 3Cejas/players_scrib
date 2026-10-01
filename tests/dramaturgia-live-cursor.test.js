const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const model = require("../game/dramaturgia/js/model.js");

function node(dataset = {}) {
  const classes = new Set();
  const attributes = new Map();
  return {
    dataset,
    textContent: "",
    style: { setProperty() {} },
    classList: {
      toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    getAttribute(name) { return attributes.get(name); }
  };
}

test("cached map updates its live highlight without rebuilding archived role views", () => {
  const stages = [...model.SHOW_JOURNEY, ...model.CONTROL_SHOW_VIEWS];
  const milestones = stages.map(({ id }) => node({ milestoneId: id }));
  const cells = stages.flatMap(({ id }) => model.HISTORY_ROLE_ROWS.map(({ screenId }) => node({ milestoneId: id, screenId })));
  const phases = ["calentamiento", "juego", "representacion", "control"].map(phase => node({ phase }));
  const shell = node();
  const viewport = {
    clientWidth: 1600,
    querySelector: () => shell,
    querySelectorAll: (selector) => selector === ".show-score__phase" ? phases : [...milestones, ...cells]
  };
  const elements = new Map([
    ["dramaturgia_graph_viewport", viewport],
    ...["dramaturgia_map_live", "dramaturgia_map_live_label", "dramaturgia_map_live_signal"].map(id => [id, node()])
  ]);
  const context = vm.createContext({
    window: { ScribDramaturgiaModel: model, addEventListener() {}, requestAnimationFrame() {} },
    document: { getElementById: id => elements.get(id) || null },
    Date, Set, Map
  });
  vm.runInContext(fs.readFileSync(require.resolve("../game/dramaturgia/js/state.js"), "utf8"), context);
  vm.runInContext(`
    dramaturgiaUi.connected = true;
    dramaturgiaUi.graphRenderKey = "todas:1600:journey:";
    renderShowScore = () => { throw new Error("Live changes must not rebuild previews"); };
    dramaturgiaStore.current = { partida: { modo_actual: "palabras bonus" } };
    renderDramaturgiaGraph();
  `, context);
  const active = () => milestones.filter(n => n.classList.contains("is-current")).map(n => n.dataset.milestoneId);
  assert.deepEqual(active(), ["level-palabras-bonus"]);
  assert.equal(milestones.find(n => n.dataset.milestoneId === active()[0]).getAttribute("aria-current"), "step");

  vm.runInContext(`dramaturgiaStore.current.partida.modo_actual = "tertulia"; renderDramaturgiaGraph();`, context);
  assert.deepEqual(active(), ["level-tertulia"]);
  assert.equal(cells.filter(n => n.classList.contains("is-current")).length, 5);
  vm.runInContext(`dramaturgiaStore.current.espectador = { modo: "stats" }; renderDramaturgiaGraph();`, context);
  assert.deepEqual(active(), ["level-tertulia"]);
  assert.equal(cells.filter(n => n.classList.contains("is-current")).length, 3);
  assert.deepEqual(cells.filter(n => n.classList.contains("is-projected")).map(n => n.dataset.screenId), ["control", "spectator"]);
  assert.ok(milestones.find(n => n.dataset.milestoneId === "control-stats").classList.contains("is-projected"));
  assert.match(elements.get("dramaturgia_map_live_label").textContent, /Tertulia.*Proyección: Estadísticas/);
  vm.runInContext(`dramaturgiaStore.current.espectador.modo = "partida"; renderDramaturgiaGraph();`, context);
  assert.equal(cells.filter(n => n.classList.contains("is-current")).length, 5);
  assert.equal(cells.filter(n => n.classList.contains("is-projected")).length, 0);
  vm.runInContext(`dramaturgiaUi.connected = false; renderDramaturgiaGraph();`, context);
  assert.equal(shell.dataset.liveState, "frozen");
  assert.equal(elements.get("dramaturgia_map_live_signal").textContent, "ÚLTIMO ESTADO");
  assert.equal(milestones.find(n => n.dataset.milestoneId === "level-tertulia").getAttribute("aria-current"), undefined);

  vm.runInContext(`dramaturgiaUi.connected = true; dramaturgiaStore.current = {}; renderDramaturgiaGraph();`, context);
  assert.deepEqual(active(), []);
  vm.runInContext(`dramaturgiaStore.current.espectador = { modo: "tutorial" }; renderDramaturgiaGraph();`, context);
  assert.deepEqual(active(), ["control-tutorial"]);
  assert.deepEqual(cells.filter(n => n.classList.contains("is-current")).map(n => n.dataset.screenId), ["control", "spectator"]);
});
