const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const assignment = require("../game/public/js/musa-assignment.js");
const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

class FakeSocket {
  constructor(connected = true) {
    this.connected = connected;
    this.handlers = new Map();
    this.emissions = [];
    this.connectCalls = 0;
  }

  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(handler);
  }

  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event, payload, ack) {
    this.emissions.push({ event, payload, ack });
  }

  connect() {
    this.connectCalls += 1;
  }

  trigger(event, payload) {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}

test("normalizes authoritative muse assignments and server aliases", () => {
  assert.deepEqual(
    assignment.normalizeAssignment({
      ok: true,
      equipo: 2,
      color: "rojo",
      nombre_equipo: "EQUIPO ROJO",
      nombre_escritxr: "Ada",
      reasignada: true,
      reconexion: false,
      ts: 42
    }),
    {
      ok: true,
      player: 2,
      equipo: 2,
      color: "rojo",
      teamName: "EQUIPO ROJO",
      writer: "Ada",
      reassigned: true,
      reconnection: false,
      clientId: "",
      timestamp: 42
    }
  );
  assert.equal(assignment.normalizeAssignment({ player: 1, escritxr: "Leo" }).writer, "Leo");
  assert.equal(assignment.normalizeAssignment({ player: 7 }), null);
  assert.deepEqual(
    assignment.normalizeAssignment({ ok: false, codigo: "SIN_EQUIPO", mensaje: "No disponible" }),
    { ok: false, code: "SIN_EQUIPO", message: "No disponible" }
  );
});

test("registration payload never lets the browser choose a team", () => {
  const payload = assignment.createRegistrationPayload({
    clientId: "musa_stable",
    name: "LUNA",
    requestId: "req_abc_123456",
    player: 2,
    equipo: 2,
    musa: 2
  });
  assert.deepEqual(payload, { client_id: "musa_stable", nombre: "LUNA", request_id: "req_abc_123456" });
  assert.equal(Object.hasOwn(payload, "player"), false);
  assert.equal(Object.hasOwn(payload, "equipo"), false);
  assert.equal(Object.hasOwn(payload, "musa"), false);
  assert.equal(assignment.normalizeRequestId("not a request"), "");
});

test("client id is scoped to session storage and uses a namespaced window.name fallback", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  };
  const options = { now: () => 1000, random: () => 0.25 };
  const first = assignment.getOrCreateClientId(storage, options);
  const second = assignment.getOrCreateClientId(storage, { now: () => 2000, random: () => 0.75 });
  assert.equal(first, second);
  assert.equal(values.get("scrib_musa_client_id"), first);

  const brokenStorage = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); }
  };
  const tabWindow = { name: "foreign-window-name" };
  const fallbackFirst = assignment.getOrCreateClientId(brokenStorage, { ...options, windowRef: tabWindow });
  const fallbackSecond = assignment.getOrCreateClientId(brokenStorage, { windowRef: tabWindow });
  assert.equal(fallbackFirst, fallbackSecond);
  assert.match(tabWindow.name, /^scrib:musa-client:musa_/);
  assert.notEqual(fallbackFirst, "foreign-window-name");

  const rotated = assignment.rotateClientId(brokenStorage, { ...options, windowRef: tabWindow });
  assert.notEqual(rotated, fallbackFirst);
  assert.equal(assignment.getOrCreateClientId(brokenStorage, { windowRef: tabWindow }), rotated);
  assert.equal(assignment.normalizeClientId("../../shared-id"), "");

  const assignmentValues = new Map([[assignment.ASSIGNMENT_SESSION_KEY, "cached"]]);
  assert.equal(assignment.clearAssignmentSession({
    removeItem: (key) => assignmentValues.delete(key)
  }), true);
  assert.equal(assignmentValues.has(assignment.ASSIGNMENT_SESSION_KEY), false);
});

test("game URL contains only the authoritative assignment and marks the reveal as completed", () => {
  const url = assignment.buildGameUrl(
    "./players/index.html",
    { player: 1, nombre_escritxr: "María" },
    "MUSA 7"
  );
  const parsed = new URL(url, "https://scrib.test/public/");
  assert.equal(parsed.searchParams.get("player"), "1");
  assert.equal(parsed.searchParams.get("name"), "MUSA 7");
  assert.equal(parsed.searchParams.get("escritxr"), "María");
  assert.equal(parsed.searchParams.get("assigned"), "1");

  const normalized = assignment.normalizeAssignment({
    player: 2,
    nombre_equipo: "EQUIPO ROJO",
    nombre_escritxr: "Berta"
  });
  const normalizedUrl = new URL(
    assignment.buildGameUrl("./players/index.html", normalized, "SOL"),
    "https://scrib.test/public/"
  );
  assert.equal(normalizedUrl.searchParams.get("player"), "2");
  assert.equal(normalizedUrl.searchParams.get("escritxr"), "Berta");

  const clientUrl = new URL(
    assignment.buildGameUrl("./players/index.html", { ...normalized, clientId: "musa_stable" }, "SOL"),
    "https://scrib.test/public/"
  );
  assert.equal(clientUrl.searchParams.has("client_id"), false);
});

test("coordinator accepts event or ACK, deduplicates identical data, and applies a rebalance update", () => {
  const socket = new FakeSocket(true);
  const received = [];
  const waiting = [];
  const coordinator = assignment.createCoordinator({
    socket,
    onWaiting: (state) => waiting.push(state),
    onAssigned: (value, meta) => received.push({ value, meta }),
    setTimer: () => 1,
    clearTimer: () => {}
  });

  coordinator.request({ clientId: "client-a", name: "NORA" });
  assert.equal(socket.emissions.length, 1);
  assert.equal(socket.emissions[0].event, "registrar_musa");
  assert.equal(socket.emissions[0].payload.client_id, "client-a");
  assert.equal(socket.emissions[0].payload.nombre, "NORA");
  assert.match(socket.emissions[0].payload.request_id, /^req_/);
  assert.deepEqual(waiting, ["assigning"]);

  const requestId = socket.emissions[0].payload.request_id;
  const blue = { ok: true, player: 1, nombre_equipo: "EQUIPO AZUL", escritxr: "Ada", request_id: requestId };
  socket.emissions[0].ack(blue);
  socket.trigger("musa_asignacion", blue);
  assert.equal(received.length, 1);
  assert.equal(received[0].meta.updated, false);

  socket.trigger("musa_asignacion", {
    ...blue,
    player: 2,
    request_id: "req_wrong_123456"
  });
  assert.equal(received.length, 1, "event with a foreign request_id must be ignored");

  socket.trigger("musa_asignacion", {
    ok: true,
    player: 2,
    nombre_equipo: "EQUIPO ROJO",
    escritxr: "Berta",
    reasignada: true,
    motivo: "reequilibrio"
  });
  assert.equal(received.length, 2);
  assert.equal(received[1].value.player, 2);
  assert.equal(received[1].meta.updated, true);
  coordinator.destroy();
});

test("coordinator retries a pending assignment after reconnecting", () => {
  const socket = new FakeSocket(false);
  const received = [];
  const coordinator = assignment.createCoordinator({
    socket,
    onAssigned: (value) => received.push(value),
    setTimer: () => 1,
    clearTimer: () => {}
  });

  assert.equal(coordinator.request({ clientId: "client-b", name: "SOL" }), false);
  assert.equal(socket.connectCalls, 1);
  assert.equal(socket.emissions.length, 0);
  socket.connected = true;
  socket.trigger("connect");
  assert.equal(socket.emissions.length, 1);
  socket.connected = false;
  socket.trigger("disconnect");
  socket.connected = true;
  socket.trigger("connect");
  assert.equal(socket.emissions.length, 2);
  socket.emissions[1].ack({
    ok: true,
    player: 2,
    nombre_escritxr: "Berta",
    request_id: socket.emissions[1].payload.request_id
  });
  assert.equal(received.length, 1);
  assert.equal(received[0].player, 2);
});

test("coordinator revalidates an existing assignment on reconnect and rejects stale ACKs", () => {
  const socket = new FakeSocket(true);
  const received = [];
  const waiting = [];
  const coordinator = assignment.createCoordinator({
    socket,
    onAssigned: (value, meta) => received.push({ value, meta }),
    onWaiting: (state, meta) => waiting.push({ state, meta }),
    now: () => 1000,
    random: () => 0.5,
    setTimer: () => 1,
    clearTimer: () => {}
  });
  coordinator.request({ clientId: "client-c", name: "MAR" });
  socket.emissions[0].ack({
    ok: true,
    player: 1,
    nombre_escritxr: "Ada",
    request_id: socket.emissions[0].payload.request_id
  });
  assert.equal(received.length, 1);

  socket.connected = false;
  socket.trigger("disconnect");
  assert.equal(coordinator.isAssigned(), false, "disconnect invalidates the pending reveal");
  assert.equal(waiting.at(-1).state, "revalidating");
  assert.equal(waiting.at(-1).meta.invalidated, true);
  socket.emissions[0].ack({
    ok: true,
    player: 2,
    nombre_escritxr: "Stale",
    request_id: socket.emissions[0].payload.request_id
  });
  assert.equal(received.length, 1, "ACK from before disconnect must be ignored");

  socket.connected = true;
  socket.trigger("connect");
  assert.equal(socket.emissions.length, 2, "reconnect must re-register even after assignment");
  assert.notEqual(socket.emissions[1].payload.request_id, socket.emissions[0].payload.request_id);
  socket.emissions[1].ack({
    ok: true,
    player: 1,
    nombre_escritxr: "Ada",
    request_id: socket.emissions[1].payload.request_id
  });
  assert.equal(received.length, 2, "revalidation produces a fresh authoritative reveal");

  coordinator.retry();
  assert.equal(socket.emissions.length, 3);
  socket.emissions[1].ack({
    ok: true,
    player: 2,
    nombre_escritxr: "Old",
    request_id: socket.emissions[1].payload.request_id
  });
  assert.equal(received.length, 2, "an ACK from an older request must be ignored");
  socket.emissions[2].ack({
    ok: true,
    player: 2,
    nombre_escritxr: "Berta",
    reasignada: true,
    request_id: socket.emissions[2].payload.request_id
  });
  assert.equal(received.length, 3);
  assert.equal(received[2].value.writer, "Berta");
});

test("landing exposes one assignment CTA and one accessible, motion-safe reveal", () => {
  const html = read("game/public/index.html");
  const selector = read("game/public/js/musa-selector.js");
  const i18n = read("game/js/i18n.js");

  assert.equal((html.match(/id="musa_assignment_start"/g) || []).length, 1);
  assert.doesNotMatch(html, /entrarComoMusa|onclick="[^"]*player|onclick="[^"]*Musa\([12]\)/);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /aria-hidden="true" tabindex="-1"/);
  assert.match(html, /aria-live="assertive" aria-atomic="true"/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /musa-assignment\.js\?v=20260822d/);
  assert.match(selector, /createCoordinator/);
  assert.match(selector, /musaAssignment\.buildGameUrl/);
  assert.match(selector, /ASSIGNMENT_SESSION_KEY/);
  assert.match(selector, /getOrCreateClientId\(window\.sessionStorage, \{ windowRef: window \}\)/);
  assert.doesNotMatch(selector, /window\.localStorage|client_id:/);
  assert.match(selector, /socket\.on\("musa_reemplazada", manejarMusaReemplazada\)/);
  assert.match(selector, /rotateClientId\(window\.sessionStorage/);
  assert.match(selector, /meta\.invalidated/);
  assert.match(selector, /overlay\.focus\(\{ preventScroll: true \}\)/);
  assert.match(selector, /flujoIntro\.inert = true/);
  assert.match(selector, /meta\.updated && estadoAsignacion === "assigned"/);
  assert.equal((i18n.match(/"muse\.assignment\.discover_button"/g) || []).length, 3);
  assert.equal((i18n.match(/"muse\.assignment\.reveal_copy"/g) || []).length, 3);
  assert.equal((i18n.match(/"muse\.assignment\.replaced_notice"/g) || []).length, 3);
});

test("game reconnects with identity only and never replays the reveal after assigned entry", () => {
  const html = read("game/public/players/index.html");
  const state = read("game/public/players/js/state.js");
  const events = read("game/public/players/js/socket-events.js");

  assert.match(html, /musa-assignment\.js\?v=20260822d/);
  assert.match(events, /socket\.on\("musa_asignacion", procesarAsignacionAutoritativaMusa\)/);
  assert.match(events, /createRegistrationPayload\(\{[\s\S]*clientId: musa_client_id,[\s\S]*requestId: musa_request_id_activo/);
  assert.match(events, /socket\.emit\('registrar_musa', payloadRegistroMusa/);
  assert.match(events, /socket\.on\("musa_reemplazada", manejarMusaReemplazadaEnJuego\)/);
  assert.match(events, /motivo[\s\S]*reequilibrio/);
  assert.doesNotMatch(events, /registrar_musa', \{ musa:/);
  assert.doesNotMatch(state, /getParameterByName\("client_id"\)|window\.localStorage/);
  assert.match(state, /getOrCreateClientId\(window\.sessionStorage/);
  assert.match(state, /getParameterByName\("assigned"\) === "1"/);
  assert.match(state, /if \(!asignacionMusaYaRevelada\) \{\s*reproducirEntradaMundoMusa\(\)/);
  assert.match(state, /window\.location\.replace\(destino\)/);
});
