const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "game", "js", "text-stream.js"), "utf8");

function crearEntorno({ renderDelay = 0, fakeTimers = false } = {}) {
  const handlers = new Map();
  const emitidos = [];
  const frames = [];
  const timers = [];
  const socket = {
    connected: false,
    on(evento, handler) {
      if (!handlers.has(evento)) handlers.set(evento, []);
      handlers.get(evento).push(handler);
    },
    emit(evento, payload, callback) {
      emitidos.push({ evento, payload, callback });
      if (evento === "suscribir_textos" && typeof callback === "function") {
        callback({ ok: true, protocol: 2, deltas: true });
      }
    },
    trigger(evento, payload) {
      (handlers.get(evento) || []).forEach((handler) => handler(payload));
    }
  };
  const window = {
    setTimeout: fakeTimers
      ? (callback, delay) => {
          timers.push({ callback, delay });
          return timers.length;
        }
      : setTimeout,
    clearTimeout,
    ScribPerformanceProtection: renderDelay > 0
      ? { getRenderDelay: () => renderDelay }
      : null,
    requestAnimationFrame(callback) {
      frames.push(callback);
      return frames.length;
    }
  };
  vm.runInNewContext(SOURCE, { window, globalThis: window }, { filename: "text-stream.js" });
  return {
    api: window.ScribTextStream,
    emitidos,
    flushFrames() {
      while (frames.length) frames.shift()();
    },
    flushTimers() {
      while (timers.length) timers.shift().callback();
    },
    timers,
    socket
  };
}

test("text stream patches round-trip rich text", () => {
  const { api } = crearEntorno();
  const anterior = "<span>hola</span>";
  const siguiente = '<span class="palabra-bendita">hola mundo</span>';
  assert.equal(api.aplicarParcheTexto(anterior, api.crearParcheTexto(anterior, siguiente)), siguiente);
});

test("receiver batches visual text rendering for 150 ms in N2 without delaying state application", () => {
  const { api, socket, flushTimers, timers } = crearEntorno({ renderDelay: 150, fakeTimers: true });
  const renders = [];
  const receiver = api.crearReceptor({
    socket,
    players: [1],
    onText: (_player, payload) => renders.push(payload.text)
  });
  socket.trigger("texto_snapshot", { player: 1, revision: 0, text: "a", plain: "a", payload: { text: "a" } });
  socket.trigger("texto_delta", {
    player: 1,
    baseRevision: 0,
    revision: 1,
    htmlPatch: { start: 1, deleteCount: 0, insert: "b" },
    plainPatch: { start: 1, deleteCount: 0, insert: "b" }
  });

  assert.equal(receiver.getState(1).text, "ab", "network state remains current immediately");
  assert.deepEqual(renders, []);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 150);
  flushTimers();
  assert.deepEqual(renders, ["ab"]);
});

test("receiver applies ordered deltas and renders only the latest state in one frame", () => {
  const { api, socket, flushFrames } = crearEntorno();
  const renders = [];
  api.crearReceptor({
    socket,
    players: [1],
    onText: (_player, payload, detalle) => renders.push({ payload, origen: detalle.origen })
  });
  socket.trigger("connect");
  socket.trigger("texto_snapshot", {
    player: 1,
    revision: 0,
    text: "",
    plain: "",
    payload: { text: "", texto_guardado: "", points: 0 }
  });
  socket.trigger("texto_delta", {
    player: 1,
    baseRevision: 0,
    revision: 1,
    htmlPatch: { start: 0, deleteCount: 0, insert: "hola" },
    plainPatch: { start: 0, deleteCount: 0, insert: "hola" },
    meta: { points: 1 }
  });
  socket.trigger("texto_delta", {
    player: 1,
    baseRevision: 1,
    revision: 2,
    htmlPatch: { start: 4, deleteCount: 0, insert: " mundo" },
    plainPatch: { start: 4, deleteCount: 0, insert: " mundo" },
    meta: { points: 2 }
  });
  flushFrames();

  assert.equal(renders.length, 1);
  assert.equal(renders[0].payload.text, "hola mundo");
  assert.equal(renders[0].payload.texto_guardado, "hola mundo");
  assert.equal(renders[0].payload.revision, 2);
});

test("sender falls back to snapshots until protocol negotiation and then emits patches", () => {
  const { api, socket, emitidos } = crearEntorno();
  const sender = api.crearEmisor({ socket, player: 1 });
  sender.send({ text: "legacy", texto_guardado: "legacy", points: 1 });
  assert.equal(emitidos.at(-1).evento, "texto1");

  socket.trigger("connect");
  socket.trigger("texto_snapshot", { player: 1, revision: 0, text: "", plain: "", payload: "" });
  sender.send({ text: "hola", texto_guardado: "hola", points: 1 });
  const delta = emitidos.at(-1);
  assert.equal(delta.evento, "texto_delta_actualizar");
  assert.equal(delta.payload.baseRevision, 0);
  assert.deepEqual(
    JSON.parse(JSON.stringify(delta.payload.htmlPatch)),
    { start: 0, deleteCount: 0, insert: "hola" }
  );
});

test("sender coalesces fast local edits after a revision mismatch without losing text", async () => {
  const { api, socket, emitidos } = crearEntorno();
  const sender = api.crearEmisor({ socket, player: 1 });
  socket.trigger("connect");
  socket.trigger("texto_snapshot", { player: 1, revision: 4, text: "base", plain: "base", payload: "base" });

  sender.send({ text: "base uno", texto_guardado: "base uno", points: 2 });
  const primerDelta = emitidos.at(-1);
  sender.send({ text: "base uno dos", texto_guardado: "base uno dos", points: 3 });

  socket.trigger("texto_snapshot", { player: 1, revision: 0, text: "", plain: "", payload: "" });
  primerDelta.callback({ ok: false, code: "REVISION_MISMATCH", revision: 0 });
  await new Promise((resolve) => setTimeout(resolve, 50));

  const reintento = emitidos.at(-1);
  assert.equal(reintento.evento, "texto_delta_actualizar");
  assert.equal(reintento.payload.baseRevision, 0);
  assert.equal(api.aplicarParcheTexto("", reintento.payload.htmlPatch), "base uno dos");
  assert.equal(api.aplicarParcheTexto("", reintento.payload.plainPatch), "base uno dos");
});
