const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createHarness({ confirm = true } = {}) {
  const emissions = [];
  const timers = new Map();
  let timerId = 0;
  const socket = {
    connected: true,
    emit(event, payload, ack) {
      emissions.push({ event, payload, ack });
    }
  };
  const window = {
    document: null,
    confirm: () => confirm,
    setTimeout(callback) {
      timerId += 1;
      timers.set(timerId, callback);
      return timerId;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    setInterval() {
      timerId += 1;
      return timerId;
    }
  };
  vm.runInNewContext(read("game/control/js/muse-help-control.js"), {
    window,
    socket,
    Date,
    Intl,
    console,
    Set,
    Map
  }, { filename: "game/control/js/muse-help-control.js" });
  return { api: window.ScribMuseHelpControl, emissions, timers };
}

test("help control normalizes active tickets and closed history without trusting visual data", () => {
  const { api } = createHarness();
  const normalized = plain(api.normalizarEstado({
    estado: {
      revision: 8,
      ts: 1_800_000_000,
      tickets: [{
        ticket_id: "ticket-active",
        nombre_musa: "  Luna\u0000 Azul  ",
        equipo: "azul",
        color: "#1ac",
        color_nombre: "cian",
        estado: "atendiendo",
        solicitado_ts: 1_800_000_001,
        conectada: true,
        diagnostico: {
          estado: "activo",
          session_id: "diag-1",
          ruta: "/game/public/players/index.html",
          viewport: { width: 390, height: 844 },
          online: true,
          socket_conectado: true
        }
      }],
      historial: [{
        ticket_id: "ticket-closed",
        nombre_musa: "Sol",
        equipo: 2,
        color: "javascript:alert(1)",
        estado: "resuelto"
      }]
    }
  }));

  assert.equal(normalized.revision, 8);
  assert.equal(normalized.ts, 1_800_000_000_000);
  assert.equal(normalized.tickets.length, 2);
  assert.deepEqual(normalized.tickets[0], {
    ticketId: "ticket-active",
    museName: "Luna Azul",
    team: { id: 1, label: "EQUIPO AZUL", className: "is-blue" },
    color: "#11AACC",
    colorName: "CIAN",
    status: "atendida",
    requestedTs: 1_800_000_001_000,
    updatedTs: 0,
    connected: true,
    diagnostic: {
      status: "activo",
      sessionId: "diag-1",
      expiresTs: 0,
      lastFrameTs: 0,
      path: "/game/public/players/index.html",
      viewport: { width: 390, height: 844 },
      online: true,
      socketConnected: true,
      lastError: ""
    }
  });
  assert.equal(normalized.tickets[1].status, "resuelta");
  assert.equal(normalized.tickets[1].color, "#FF4D67", "unsafe colors fall back to the team color");
  assert.equal(normalized.tickets[1].colorName, "#FF4D67");
});

test("diagnostic frames only accept bounded raster data for the exact ticket session", () => {
  const { api } = createHarness();
  api.marcarConexion(true);
  api.aplicarEstado({
    tickets: [{
      ticket_id: "help-1",
      nombre_musa: "Musa 1",
      equipo: 1,
      estado: "atendiendo",
      conectada: true,
      diagnostico: { estado: "activo", session_id: "session-1" }
    }]
  });

  const frame = {
    ticket_id: "help-1",
    session_id: "session-1",
    seq: 4,
    mime: "image/jpeg",
    data: "AQID",
    width: 390,
    height: 844,
    ts: 1_800_000_005_000
  };
  assert.equal(api.procesarFrame(frame), true);
  assert.equal(api.procesarFrame(frame), false, "duplicate sequences are rejected");
  assert.equal(api.procesarFrame({ ...frame, seq: 5, session_id: "other" }), false);
  assert.equal(api.procesarFrame({ ...frame, seq: 5, mime: "image/svg+xml" }), false);
  assert.equal(api.procesarFrame({ ...frame, seq: 5, data: "not base64!" }), false);

  const safe = plain(api.normalizarFrame(frame));
  assert.equal(safe.src, "data:image/jpeg;base64,AQID");
  assert.equal(safe.width, 390);
  assert.equal(safe.height, 844);
});

test("remote taps ignore object-fit bands and normalize against the real image content", () => {
  const { api } = createHarness();
  const portraitBox = { left: 100, top: 50, width: 200, height: 200 };
  assert.equal(api.calcularTapContenido({
    clientX: 110,
    clientY: 150,
    box: portraitBox,
    sourceWidth: 100,
    sourceHeight: 200
  }), null, "a tap in the left letterbox must not reach the muse");
  assert.deepEqual(plain(api.calcularTapContenido({
    clientX: 150,
    clientY: 50,
    box: portraitBox,
    sourceWidth: 100,
    sourceHeight: 200
  })), { x: 0, y: 0 });
  assert.deepEqual(plain(api.calcularTapContenido({
    clientX: 250,
    clientY: 250,
    box: portraitBox,
    sourceWidth: 100,
    sourceHeight: 200
  })), { x: 1, y: 1 });

  const landscapeBox = { left: 0, top: 0, width: 200, height: 200 };
  assert.equal(api.calcularTapContenido({
    clientX: 100,
    clientY: 10,
    box: landscapeBox,
    sourceWidth: 200,
    sourceHeight: 100
  }), null, "a tap in the upper pillar must not reach the muse");
});

test("individual actions use authoritative ticket IDs, explicit resolution and exact reload confirmation", () => {
  const { api, emissions } = createHarness({ confirm: true });
  api.marcarConexion(true);
  api.aplicarEstado({
    tickets: [{
      ticket_id: "help-2",
      nombre_musa: "Musa 2",
      equipo: 2,
      estado: "pendiente",
      conectada: true,
      diagnostico: { estado: "inactivo" }
    }]
  });

  assert.equal(api.atender(), true);
  assert.equal(emissions[0].event, "ayuda_musa_atender");
  assert.equal(emissions[0].payload.ticket_id, "help-2");
  assert.match(emissions[0].payload.request_id, /^control-help-/);
  emissions[0].ack({ ok: true });

  assert.equal(api.cancelar(), true);
  assert.equal(emissions[1].event, "ayuda_musa_resolver");
  assert.equal(emissions[1].payload.resolucion, "cancelada");
  emissions[1].ack({ ok: true });

  assert.equal(api.recargarMusa(), true);
  assert.equal(emissions[2].event, "ayuda_musa_recargar");
  assert.equal(emissions[2].payload.ticket_id, "help-2");
});

test("remote control is consent-bound and limited to normalized tap, scroll, back and reconnect commands", () => {
  const { api, emissions } = createHarness();
  api.marcarConexion(true);
  api.aplicarEstado({
    tickets: [{
      ticket_id: "help-live",
      nombre_musa: "Musa live",
      equipo: 1,
      estado: "atendiendo",
      conectada: true,
      diagnostico: { estado: "activo", session_id: "diag-live" }
    }]
  });

  assert.equal(api.enviarComandoRemoto("tap", { x: 4, y: -2 }), true);
  assert.equal(emissions[0].event, "ayuda_musa_comando_remoto");
  assert.deepEqual(
    { ...emissions[0].payload, request_id: "<dynamic>" },
    {
      ticket_id: "help-live",
      session_id: "diag-live",
      tipo: "tap",
      x: 1,
      y: 0,
      request_id: "<dynamic>"
    }
  );
  assert.equal(api.enviarComandoRemoto("script", { code: "alert(1)" }), false);
});

test("Control exposes an accessible responsive assistance tab and definitive Socket.IO wiring", () => {
  const html = read("game/control/index.html");
  const css = read("game/control/index.css");
  const actions = read("game/control/js/actions.js");
  const socketEvents = read("game/control/js/socket-events.js");
  const source = read("game/control/js/muse-help-control.js");
  const assistance = html.match(/<div class="control-group control-group--asistencia[\s\S]*?<\/section>\s*<\/div>\s*<\/div>/)?.[0] || "";

  assert.match(html, /data-control-section="asistencia"/);
  assert.match(html, /id="control_title_assistance"[\s\S]*aria-controls="asistencia_control"[\s\S]*toggleSeccionControl\('asistencia'\)/);
  assert.match(html, /id="asistencia_estado_global"[\s\S]*role="status"[\s\S]*aria-live="polite"/);
  assert.match(html, /id="asistencia_preview_shell"[\s\S]*role="application"/);
  assert.match(html, /ya autoriz&oacute; temporalmente esta p&aacute;gina al pedir ayuda[\s\S]*No permite escribir ni acceder a c&aacute;mara, micr&oacute;fono u otras aplicaciones/);
  assert.doesNotMatch(assistance, /<input|<textarea/);
  assert.match(html, /muse-help-control\.js\?v=20260824e/);

  assert.match(actions, /new Set\(\["tutorial", "juego", "representacion", "asistencia"\]\)/);
  assert.match(actions, /classList\.toggle\("asistencia-activa", seccion === "asistencia"\)/);
  assert.match(socketEvents, /socket\.emit\('pedir_ayuda_musas_estado'\)/);
  assert.match(socketEvents, /socket\.on\('ayuda_musas_estado'/);
  assert.match(socketEvents, /socket\.on\('ayuda_musa_diagnostico_frame'/);
  assert.match(socketEvents, /CONTROL_ACCESS_TOKEN_KEY = "scrib_roles_access_token"/);
  assert.match(socketEvents, /sessionStorage\.getItem\(CONTROL_ACCESS_TOKEN_KEY\)/);
  assert.match(socketEvents, /socket\.emit\('registrar_control', \{ access_token: accessToken \}, procesarRegistroControl\)/);
  assert.match(socketEvents, /socket\.on\('control_registro_estado'/);
  assert.match(socketEvents, /respuesta\.ok === true[\s\S]*sincronizarControlAutorizado\(\)/);
  assert.match(socketEvents, /function sincronizarControlAutorizado\(\)[\s\S]*socket\.emit\('pedir_ayuda_musas_estado'\)/);
  assert.match(socketEvents, /__SCRIB_DRAMATURGIA_MONITOR__\?\.active/);
  assert.match(socketEvents, /function sincronizarReplicaControlSoloLectura\(\)[\s\S]*ScribMuseHelpControl\.marcarConexion\(false\)/);
  assert.match(socketEvents, /function sincronizarReplicaControlSoloLectura\(\)[\s\S]*socket\.emit\('pedir_stats_live'\)/);
  const monitorSync = socketEvents.match(/function sincronizarReplicaControlSoloLectura\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  assert.doesNotMatch(monitorSync, /pedir_ayuda_musas_estado|iniciarStatsLiveControl/);
  assert.match(source, /"ayuda_musa_atender"/);
  assert.match(source, /"ayuda_musa_resolver"/);
  assert.match(source, /"ayuda_musa_recargar"/);
  assert.match(source, /"ayuda_musa_diagnostico_solicitar"/);
  assert.match(source, /"ayuda_musa_diagnostico_detener"/);
  assert.match(source, /new Set\(\["tap", "scroll", "back", "reconnect"\]\)/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.doesNotMatch(source, /eval\s*\(|new Function/);

  assert.match(css, /\.asistencia-control__workspace/);
  assert.match(css, /\.asistencia-preview\[data-state="live"\]/);
  assert.match(css, /table\.default\.asistencia-activa[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) !important/);
  assert.match(css, /@media \(max-width: 900px\) and \(orientation: portrait\)[\s\S]*\.control-group\[data-control-section="asistencia"\]/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.asistencia-tab-contador/);
});

test("dramaturgy Control replica synchronizes only allowlisted reads and keeps assistance disabled", () => {
  const source = read("game/control/js/socket-events.js");
  const start = source.indexOf("function sincronizarReplicaControlSoloLectura()");
  const end = source.indexOf("function procesarRegistroControl", start);
  assert.ok(start >= 0 && end > start, "monitor-only sync function should be extractable");
  const emitted = [];
  const connections = { help: null, video: null };
  let statusPingStarted = false;
  let liveStatsStarted = false;
  const context = {
    document: { body: { dataset: {} } },
    window: {
      ScribVideotutorialControl: { marcarConexion(value) { connections.video = value; } },
      ScribMuseHelpControl: { marcarConexion(value) { connections.help = value; } }
    },
    socket: { emit(event) { emitted.push(event); } },
    setEstadoServidor() {},
    iniciarStatusPing() { statusPingStarted = true; },
    iniciarStatsLiveControl() { liveStatsStarted = true; },
    registrarLogControl() {}
  };
  vm.runInNewContext(`${source.slice(start, end)}\nsincronizarReplicaControlSoloLectura();`, context);

  assert.equal(context.document.body.dataset.controlAccess, "monitor");
  assert.equal(connections.help, false);
  assert.equal(connections.video, false);
  assert.equal(statusPingStarted, true);
  assert.equal(liveStatsStarted, false);
  assert.ok(emitted.includes("pedir_estado_control"));
  assert.ok(emitted.includes("pedir_stats_live"));
  assert.ok(!emitted.includes("pedir_ayuda_musas_estado"));
  assert.ok(!emitted.some((event) => /actualizar|atender|resolver|recargar|comando/.test(event)));
});
