const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const historySnapshots = require("../game/dramaturgia/js/history-snapshots.js");

const ROOT = path.resolve(__dirname, "..");
const CONTROLLER_SOURCE = fs.readFileSync(
  path.join(ROOT, "game/dramaturgia/js/history-controller.js"),
  "utf8"
);

function presenceEvent(id, seq = 1) {
  return {
    id,
    seq,
    ts: 1_000 + seq,
    checkpoint_id: `checkpoint:${id}`,
    tipo: "presencias",
    titulo: "Presencias actualizadas",
    espacio: "sistema",
    fase: "espera",
    modo: "",
    causa_ids: [],
    hechos: {}
  };
}

function presenceCheckpoint(sessionId, event) {
  return {
    id: event.checkpoint_id,
    sessionId,
    seq: event.seq,
    seqStart: event.seq,
    seqEnd: event.seq,
    ts: event.ts,
    capturedAt: event.ts,
    complete: true,
    eventIds: [event.id],
    events: [event],
    roles: { control: "presence-control-hash" }
  };
}

function createHarness({ persisted = [], runtimeEvents = [] } = {}) {
  const archiveStore = historySnapshots.createHistoryStore({ maxCheckpoints: 720 });
  persisted.forEach((checkpoint) => archiveStore.putCheckpoint(checkpoint));
  const blobs = new Map();

  const archive = {
    async listCheckpoints(sessionId) {
      return archiveStore.listCheckpoints(sessionId);
    },
    async putCheckpoint(checkpoint) {
      return archiveStore.putCheckpoint(checkpoint);
    },
    async getCheckpoint(checkpointId) {
      return archiveStore.getCheckpoint(checkpointId);
    },
    async putBlob(hash, html, meta) {
      const blob = { hash, html, meta };
      blobs.set(hash, blob);
      return blob;
    },
    async getBlob(hash) {
      return blobs.get(hash) || null;
    }
  };

  const snapshots = {
    ...historySnapshots,
    SCREEN_IDS: ["control"],
    serializeDocument(_document, options) {
      return `<html data-screen="${options.screenId}"></html>`;
    },
    async hashSnapshot() {
      return "baseline-control-hash";
    },
    async openArchive() {
      return archive;
    }
  };

  let nextTimerId = 1;
  const timers = new Map();
  const clearedTimers = [];
  const updates = [];
  const runtimeStore = {
    current: {},
    lastSeq: runtimeEvents.reduce((max, event) => Math.max(max, event.seq || 0), 0),
    events: [...runtimeEvents]
  };
  const controlScreen = {
    id: "control",
    label: "Control",
    width: 1600,
    height: 900,
    accent: "#ffd166"
  };
  const controlDocument = {
    documentElement: {},
    body: {},
    readyState: "complete",
    fonts: { ready: Promise.resolve() },
    baseURI: "https://example.test/scrib/game/control/"
  };
  const controlSource = {
    screen: controlScreen,
    frame: { contentDocument: controlDocument }
  };

  const window = {
    ScribDramaturgiaHistorySnapshots: snapshots,
    ScribDramaturgiaToolsModel: { SCREENS: [controlScreen] },
    ScribDramaturgiaRuntime: { store: runtimeStore },
    ScribDramaturgiaScreenPool: {
      ensure() {},
      getSource(screenId) {
        return screenId === "control" ? controlSource : null;
      }
    },
    ScribDramaturgiaModel: {
      SPACE_BY_ID: {},
      currentSummary() {
        return { phase: "espera", mode: "" };
      }
    },
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      clearedTimers.push(id);
      timers.delete(id);
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    dispatchEvent(event) {
      updates.push(event);
      return true;
    }
  };

  class FakeCustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const context = vm.createContext({
    window,
    CustomEvent: FakeCustomEvent,
    console
  });
  vm.runInContext(CONTROLLER_SOURCE, context, {
    filename: "game/dramaturgia/js/history-controller.js"
  });

  return {
    archiveStore,
    blobs,
    clearedTimers,
    controller: window.ScribDramaturgiaHistoryController,
    runtimeStore,
    timers,
    updates
  };
}

async function flushAsyncWork(turns = 8) {
  for (let index = 0; index < turns; index += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

test("presence checkpoints stay invisible and do not prevent the initial real baseline", async () => {
  const sessionId = "session-presence-only";
  const persistedEvent = presenceEvent("presence:persisted", 1);
  const liveEvent = presenceEvent("presence:live", 2);
  const harness = createHarness({
    persisted: [presenceCheckpoint(sessionId, persistedEvent)],
    runtimeEvents: [persistedEvent, liveEvent]
  });

  await harness.controller.syncSession(sessionId, [persistedEvent]);

  assert.deepEqual(harness.controller.getCheckpoints(), []);
  assert.equal(harness.controller.getStatus().count, 0);
  assert.equal(harness.controller.getStatus().missing, 0);
  assert.equal(harness.timers.size, 1, "presence-only persistence must still schedule a baseline");

  const [baselineTimerId, baselineTimer] = [...harness.timers.entries()][0];
  assert.equal(baselineTimer.delay, 900);

  harness.controller.receiveEvent(liveEvent);
  await harness.controller.receiveCheckpoint({
    id: liveEvent.checkpoint_id,
    session_id: sessionId,
    event_ids: [liveEvent.id]
  });

  assert.equal(harness.controller.getStatus().count, 0);
  assert.equal(harness.controller.getStatus().missing, 0);
  assert.equal(harness.timers.has(baselineTimerId), true, "presence must not cancel the baseline timer");
  assert.equal(harness.clearedTimers.includes(baselineTimerId), false);

  harness.timers.delete(baselineTimerId);
  baselineTimer.callback();
  await flushAsyncWork();

  const visible = harness.controller.getCheckpoints();
  assert.equal(visible.length, 1);
  assert.equal(visible[0].source, "client_baseline");
  assert.equal(visible[0].events[0].tipo, "archivo_visual");
  assert.equal(visible[0].complete, true);
  assert.equal(visible[0].roles.control, "baseline-control-hash");
  assert.equal(harness.blobs.size, 1);
  assert.equal(harness.controller.getStatus().count, 1);
  assert.equal(harness.controller.getStatus().missing, 0);

  const allPersisted = harness.archiveStore.listCheckpoints(sessionId);
  assert.equal(allPersisted.length, 2, "live presence must not create a third persisted checkpoint");
  assert.deepEqual(
    allPersisted.map((checkpoint) => checkpoint.events[0].tipo).sort(),
    ["archivo_visual", "presencias"]
  );
});
