const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const REFERENCE_SHOW_SOURCE = fs.readFileSync(
  path.join(ROOT, "game/dramaturgia/js/reference-show.js"),
  "utf8"
);
const MAX_CONCURRENT_PREVIEWS = 8;

class FakeStyle {
  constructor() {
    this.properties = new Map();
  }

  setProperty(name, value) {
    this.properties.set(name, String(value));
  }
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...classNames) {
    classNames.forEach((className) => this.values.add(className));
  }

  contains(className) {
    return this.values.has(className);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.className = "";
    this.classList = new FakeClassList();
    this.style = new FakeStyle();
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this.clientWidth = 160;
    this.clientHeight = 90;
    this._rootConnected = false;
    this.listeners = new Map();
  }

  get firstChild() {
    return this.children[0] || null;
  }

  get isConnected() {
    if (this.parentNode) return this.parentNode.isConnected;
    return this._rootConnected;
  }

  set isConnected(value) {
    this._rootConnected = Boolean(value);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  addEventListener(type, callback, options = {}) {
    const listeners = this.listeners.get(type) || [];
    listeners.push({ callback, once: Boolean(options && options.once) });
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, callback) {
    const listeners = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      listeners.filter((listener) => listener.callback !== callback)
    );
  }

  dispatch(type) {
    const listeners = [...(this.listeners.get(type) || [])];
    listeners.forEach((listener) => {
      listener.callback.call(this, { type, target: this });
      if (listener.once) this.removeEventListener(type, listener.callback);
    });
  }

  appendChild(child) {
    if (child.parentNode) child.remove();
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  insertBefore(child, before) {
    if (child.parentNode) child.remove();
    const index = before ? this.children.indexOf(before) : -1;
    if (index === -1) this.children.push(child);
    else this.children.splice(index, 0, child);
    child.parentNode = this;
    return child;
  }

  querySelector(selector) {
    if (!selector.startsWith(".")) return null;
    const className = selector.slice(1);
    const pending = [...this.children];
    while (pending.length) {
      const candidate = pending.shift();
      const classes = String(candidate.className).split(/\s+/).filter(Boolean);
      if (classes.includes(className) || candidate.classList.contains(className)) {
        return candidate;
      }
      pending.push(...candidate.children);
    }
    return null;
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index !== -1) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
  }
}

function createHarness() {
  const frames = [];
  const timers = new Map();
  let nextTimerId = 1;

  const screen = {
    id: "control",
    label: "Control",
    width: 1600,
    height: 900
  };
  const document = {
    baseURI: "https://example.test/scrib/game/dramaturgia/",
    readyState: "complete",
    documentElement: { dataset: {} },
    createElement(tagName) {
      const element = new FakeElement(tagName);
      if (element.tagName === "IFRAME") frames.push(element);
      return element;
    }
  };
  const window = {
    document,
    ScribDramaturgiaToolsModel: { SCREENS: [screen] },
    ScribDramaturgiaReferenceShowManifest: {
      id: "loader-regression",
      milestones: {
        moment: {
          checkpointId: "checkpoint:moment",
          roles: {
            control: "./reference-show/blobs/control.html"
          }
        }
      }
    },
    setTimeout(callback, delay = 0) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    dispatchEvent() {
      return true;
    }
  };

  class FakeCustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  vm.runInContext(
    REFERENCE_SHOW_SOURCE,
    vm.createContext({ window, CustomEvent: FakeCustomEvent, URL, console }),
    { filename: "game/dramaturgia/js/reference-show.js" }
  );

  function createHost() {
    const host = new FakeElement("button");
    host.isConnected = true;
    return host;
  }

  function mount(host) {
    assert.equal(
      window.ScribDramaturgiaReferenceShow.mountPreview(host, "moment", "control"),
      true
    );
  }

  function runZeroDelayTimers() {
    let runs = 0;
    while (true) {
      const due = [...timers.entries()].find(([, timer]) => timer.delay <= 0);
      if (!due) return;
      const [id, timer] = due;
      timers.delete(id);
      timer.callback();
      runs += 1;
      assert.ok(runs < 1_000, "zero-delay timer queue must settle");
    }
  }

  function frameFor(host) {
    const stage = host.querySelector(".history-view__stage");
    return stage && stage.children.find((child) => child.tagName === "IFRAME") || null;
  }

  return {
    api: window.ScribDramaturgiaReferenceShow,
    createHost,
    frameFor,
    frames,
    mount,
    runZeroDelayTimers
  };
}

function startFullBatch(harness) {
  const hosts = Array.from(
    { length: MAX_CONCURRENT_PREVIEWS },
    () => harness.createHost()
  );
  hosts.forEach(harness.mount);
  harness.runZeroDelayTimers();
  hosts.forEach((host) => {
    assert.equal(host.dataset.historyState, "loading");
    assert.ok(harness.frameFor(host));
  });
  return hosts;
}

test("disconnected in-flight previews release all concurrency slots", () => {
  const harness = createHarness();
  const abandoned = startFullBatch(harness);
  assert.equal(harness.frames.length, MAX_CONCURRENT_PREVIEWS);

  abandoned.forEach((host) => {
    host.isConnected = false;
  });

  const replacements = Array.from(
    { length: MAX_CONCURRENT_PREVIEWS },
    () => harness.createHost()
  );
  replacements.forEach(harness.mount);
  harness.runZeroDelayTimers();

  replacements.forEach((host) => {
    assert.equal(host.dataset.historyState, "loading");
    assert.ok(harness.frameFor(host), "replacement receives an iframe without waiting for a stale load event");
  });
  assert.equal(harness.frames.length, MAX_CONCURRENT_PREVIEWS * 2);
});

test("late load events from disconnected previews release no slot twice", () => {
  const harness = createHarness();
  const abandoned = startFullBatch(harness);
  const abandonedFrames = abandoned.map(harness.frameFor);
  abandoned.forEach((host) => {
    host.isConnected = false;
  });

  const replacements = Array.from(
    { length: MAX_CONCURRENT_PREVIEWS },
    () => harness.createHost()
  );
  replacements.forEach(harness.mount);
  harness.runZeroDelayTimers();
  const replacementFrames = replacements.map(harness.frameFor);
  replacementFrames.forEach((frame) => assert.ok(frame));
  assert.equal(harness.frames.length, MAX_CONCURRENT_PREVIEWS * 2);

  abandonedFrames.forEach((frame) => frame.dispatch("load"));

  const overflow = harness.createHost();
  harness.mount(overflow);
  harness.runZeroDelayTimers();
  assert.equal(overflow.dataset.historyState, "queued");
  assert.equal(harness.frameFor(overflow), null);
  assert.equal(
    harness.frames.length,
    MAX_CONCURRENT_PREVIEWS * 2,
    "stale completions cannot exceed the concurrency limit"
  );

  replacementFrames[0].dispatch("load");
  harness.runZeroDelayTimers();
  assert.equal(replacements[0].dataset.historyState, "ready");
  assert.equal(overflow.dataset.historyState, "loading");
  assert.ok(harness.frameFor(overflow));
  assert.equal(harness.frames.length, (MAX_CONCURRENT_PREVIEWS * 2) + 1);
});
