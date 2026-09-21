const test = require("node:test");
const assert = require("node:assert/strict");

const screenAwake = require("../game/js/screen-awake.js");

function createHarness({ supported = true, initiallyVisible = true } = {}) {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const requests = [];
  const sentinels = [];

  const document = {
    visibilityState: initiallyVisible ? "visible" : "hidden",
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (documentListeners.get(type) === listener) documentListeners.delete(type);
    }
  };
  const navigator = {};
  if (supported) {
    navigator.wakeLock = {
      async request(type) {
        requests.push(type);
        const listeners = new Map();
        const sentinel = {
          released: false,
          addEventListener(event, listener) { listeners.set(event, listener); },
          removeEventListener(event, listener) {
            if (listeners.get(event) === listener) listeners.delete(event);
          },
          async release() {
            if (sentinel.released) return;
            sentinel.released = true;
            listeners.get("release")?.({ target: sentinel });
          }
        };
        sentinels.push(sentinel);
        return sentinel;
      }
    };
  }
  const globalObject = {
    document,
    navigator,
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (windowListeners.get(type) === listener) windowListeners.delete(type);
    }
  };
  return { globalObject, document, documentListeners, windowListeners, requests, sentinels };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("a visible SCRIB role keeps the screen awake and reacquires after visibility returns", async () => {
  const harness = createHarness();
  const controller = screenAwake.createController(harness.globalObject);

  assert.equal(controller.start(), true);
  await flush();
  assert.deepEqual(harness.requests, ["screen"]);
  assert.equal(controller.isHeld(), true);

  harness.document.visibilityState = "hidden";
  harness.documentListeners.get("visibilitychange")();
  await flush();
  assert.equal(harness.sentinels[0].released, true);
  assert.equal(controller.isHeld(), false);

  harness.document.visibilityState = "visible";
  harness.documentListeners.get("visibilitychange")();
  await flush();
  assert.deepEqual(harness.requests, ["screen", "screen"]);
  assert.equal(controller.isHeld(), true);

  controller.stop();
  await flush();
  assert.equal(harness.sentinels[1].released, true);
  assert.equal(harness.documentListeners.size, 0);
  assert.equal(harness.windowListeners.size, 0);
});

test("interaction retries a wake lock rejected or released by the browser", async () => {
  const harness = createHarness();
  const controller = screenAwake.createController(harness.globalObject);

  controller.start();
  await flush();
  await harness.sentinels[0].release();
  assert.equal(controller.isHeld(), false);

  harness.documentListeners.get("pointerdown")();
  await flush();
  assert.deepEqual(harness.requests, ["screen", "screen"]);
  assert.equal(controller.isHeld(), true);
});

test("unsupported browsers stay functional without requesting a lock", async () => {
  const harness = createHarness({ supported: false });
  const controller = screenAwake.createController(harness.globalObject);

  assert.equal(controller.start(), false);
  await flush();
  assert.equal(controller.isSupported(), false);
  assert.equal(controller.isHeld(), false);
  controller.stop();
  assert.equal(harness.documentListeners.size, 0);
});

test("the shared installer is idempotent", () => {
  const harness = createHarness({ supported: false });
  const first = screenAwake.install(harness.globalObject);
  const second = screenAwake.install(harness.globalObject);

  assert.ok(first);
  assert.equal(second, null);
  first.stop();
});
