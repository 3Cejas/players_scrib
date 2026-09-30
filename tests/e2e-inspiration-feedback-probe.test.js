const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const {
  startInspirationFeedbackProbe,
  readInspirationFeedbackProbe,
  stopInspirationFeedbackProbe
} = require("../e2e/specs/inspiration-feedback-probe");

function createPage() {
  const root = {};
  let nodes = [];
  let observer;
  const context = vm.createContext({
    window: {},
    document: {
      querySelector: () => root,
      querySelectorAll: () => nodes
    },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observer = this; }
      observe(target, options) { this.target = target; this.options = options; }
      disconnect() { this.disconnected = true; }
    }
  });
  return {
    context,
    run(fn, argument) { return vm.runInContext(`(${fn.toString()})(${JSON.stringify(argument) ?? ""})`, context); },
    mutate(nextNodes) { nodes = nextNodes; observer.callback(); },
    get observer() { return observer; }
  };
}

function feedback(text, overrides = {}) {
  return {
    isConnected: true,
    textContent: text,
    className: "feedback-tiempo-float",
    getBoundingClientRect: () => ({ width: 80 }),
    ...overrides
  };
}

test("E2E feedback observation retains a real visible animation after removal", () => {
  const page = createPage();
  page.run(startInspirationFeedbackProbe, ".feedback-tiempo-float");
  assert.equal(page.run(readInspirationFeedbackProbe), false);
  page.mutate([feedback("+1 🎨")]);
  page.mutate([]);
  assert.equal(page.run(readInspirationFeedbackProbe).inspiration, "+1 🎨");
  assert.equal(page.observer.options.subtree, true);
});

test("E2E feedback observation cannot pass on hidden or disconnected nodes", () => {
  const page = createPage();
  page.run(startInspirationFeedbackProbe, ".feedback-tiempo-float");
  page.mutate([
    feedback("+1 🎨", { isConnected: false }),
    feedback("+1 🎨", { getBoundingClientRect: () => ({ width: 0 }) }),
    feedback("+5 puntos")
  ]);
  assert.equal(page.run(readInspirationFeedbackProbe), false);
});

test("E2E feedback observation accepts fractional points and rejects undefined", () => {
  const page = createPage();
  page.run(startInspirationFeedbackProbe, ".feedback-tiempo-float");
  page.mutate([feedback("+0,25 🎨")]);
  assert.equal(page.run(readInspirationFeedbackProbe).inspiration, "+0,25 🎨");
  page.mutate([feedback("undefined 🎨")]);
  assert.throws(() => page.run(readInspirationFeedbackProbe), /Invalid inspiration feedback/);
});

test("E2E feedback observation is bounded and cannot reuse the previous action", () => {
  const page = createPage();
  page.run(startInspirationFeedbackProbe, ".feedback-tiempo-float");
  const node = feedback("+1 🎨");
  page.mutate([node]);
  page.mutate([node]);
  assert.equal(page.context.window.__scribE2EInspirationFeedback.records.length, 1);
  for (let index = 0; index < 40; index += 1) page.mutate([feedback(`+${index} 🎨`)]);
  assert.equal(page.context.window.__scribE2EInspirationFeedback.records.length, 32);
  const previousObserver = page.observer;
  page.run(startInspirationFeedbackProbe, ".feedback-tiempo-float");
  assert.equal(previousObserver.disconnected, true);
  assert.equal(page.run(readInspirationFeedbackProbe), false);
  page.run(stopInspirationFeedbackProbe);
  assert.equal(page.observer.disconnected, true);
  assert.equal(page.context.window.__scribE2EInspirationFeedback, undefined);
});

test("E2E feedback observation fails explicitly if its root is missing", () => {
  const page = createPage();
  page.context.document.querySelector = () => null;
  assert.throws(() => page.run(startInspirationFeedbackProbe, ".feedback-tiempo-float"), /Missing inspiration feedback root/);
});
