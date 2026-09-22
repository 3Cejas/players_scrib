const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SCRIPT = fs.readFileSync(
  path.resolve(__dirname, "../game/js/monitor-socket.js"),
  "utf8"
);

function createSocket() {
  const listeners = new Map();
  const sent = [];
  const socket = {
    connected: false,
    sent,
    on(eventName, handler) {
      const handlers = listeners.get(eventName) || [];
      handlers.push(handler);
      listeners.set(eventName, handlers);
      return socket;
    },
    emit(eventName, ...args) {
      sent.push({ eventName, args });
      if ([
        "connect",
        "connect_error",
        "connect_timeout",
        "connecting",
        "disconnect",
        "error",
        "reconnect",
        "reconnect_attempt",
        "reconnect_failed",
        "reconnect_error",
        "reconnecting",
        "ping",
        "pong"
      ].includes(eventName)) {
        (listeners.get(eventName) || []).slice().forEach((handler) => handler(...args));
      }
      return socket;
    }
  };
  return socket;
}

function loadMonitorBridge() {
  const socket = createSocket();
  const calls = [];
  const messages = [];
  const originalIo = (...args) => {
    calls.push(args);
    return socket;
  };
  originalIo.Manager = function Manager() {};

  class FakeMediaElement {
    constructor() {
      this.muted = false;
      this.volume = 1;
      this.playCalls = 0;
    }
    setAttribute() {}
    play() {
      this.playCalls += 1;
      return Promise.resolve("playing");
    }
  }
  class FakeAudioContext {
    constructor() {
      this.suspendCalls = 0;
      this.resumeCalls = 0;
    }
    suspend() {
      this.suspendCalls += 1;
      return Promise.resolve();
    }
    resume() {
      this.resumeCalls += 1;
      return Promise.resolve();
    }
  }

  const fakeWindow = {
    location: {
      search: "?player=1&dramaturgia_monitor=1&screen_id=writer1",
      pathname: "/scrib/game/players/index.html",
      origin: "https://sutura.example"
    },
    parent: {
      postMessage(payload, origin) {
        messages.push({ payload, origin });
      }
    },
    io: originalIo,
    HTMLMediaElement: FakeMediaElement,
    AudioContext: FakeAudioContext,
    setTimeout,
    clearTimeout
  };
  const fakeDocument = {
    readyState: "loading",
    addEventListener() {},
    querySelectorAll() {
      return [];
    }
  };
  const context = {
    window: fakeWindow,
    document: fakeDocument,
    URLSearchParams,
    console
  };
  vm.runInNewContext(SCRIPT, context, { filename: "monitor-socket.js" });
  return { calls, messages, socket, window: fakeWindow, FakeMediaElement, FakeAudioContext };
}

test("dramaturgy monitor keeps visual media running but forces every audio path silent", async () => {
  const { window, FakeMediaElement } = loadMonitorBridge();
  const media = new FakeMediaElement();

  await media.play();
  assert.equal(window.__SCRIB_AUDIO_DISABLED__, true);
  assert.equal(media.playCalls, 1);
  assert.equal(media.muted, true);
  assert.equal(media.volume, 0);

  const audioContext = new window.AudioContext();
  assert.equal(audioContext.suspendCalls >= 1, true);
  await audioContext.resume();
  assert.equal(audioContext.resumeCalls, 0);
  assert.equal(audioContext.suspendCalls >= 2, true);
});

test("monitor bridge preserves Socket.IO lifecycle and registers a read-only replica", () => {
  const { calls, messages, socket, window } = loadMonitorBridge();
  const wrapped = window.io("https://sutura.example", {
    transports: ["websocket"],
    query: { existing: "yes" }
  });

  assert.equal(wrapped, socket);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].query.existing, "yes");
  assert.equal(calls[0][1].query.dramaturgia_monitor, "1");
  assert.equal(calls[0][1].query.screen_id, "writer1");

  socket.emit("registrar_escritor", { player: 1 });
  assert.equal(socket.sent.some((entry) => entry.eventName === "registrar_escritor"), false);

  socket.connected = true;
  socket.emit("connect");
  assert.equal(socket.sent.some((entry) => entry.eventName === "connect"), true);
  const registration = socket.sent.find((entry) => entry.eventName === "registrar_monitor_pantalla");
  assert.deepEqual(JSON.parse(JSON.stringify(registration.args[0])), {
    rol: "escritor",
    player: 1,
    screen_id: "writer1"
  });
  assert.equal(messages.some((entry) => entry.payload.estado === "syncing"), true);
});

test("monitor bridge passes reads, blocks mutations and reports disconnects", () => {
  const { messages, socket, window } = loadMonitorBridge();
  window.io();
  socket.connected = true;
  socket.emit("connect");

  socket.emit("pedir_texto", { player: 1 });
  assert.equal(socket.sent.some((entry) => entry.eventName === "pedir_texto"), true);

  socket.emit("pedir_canto_estado");
  assert.equal(socket.sent.some((entry) => entry.eventName === "pedir_canto_estado"), true);

  let blockedAck = null;
  socket.emit("texto1", { text: "no debe salir" }, (payload) => {
    blockedAck = payload;
  });
  assert.equal(socket.sent.some((entry) => entry.eventName === "texto1"), false);
  assert.equal(blockedAck.solo_lectura, true);

  socket.emit("disconnect", "transport close");
  assert.equal(messages.some((entry) => entry.payload.estado === "offline"), true);
});
