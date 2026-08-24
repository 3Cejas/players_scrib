const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const help = require("../game/public/players/js/musa-help.js");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("muse help normalizes the authoritative ticket and rejects closed or malformed tickets", () => {
  assert.deepEqual(help.normalizeTicket({
    ticket_id: "ticket-1",
    nombre_musa: " Luna ",
    equipo: 2,
    color: "#12ABEF",
    color_nombre: " celeste ",
    estado: "atendiendo",
    solicitado_ts: 12,
    atendido_ts: 20,
    conectada: true,
    diagnostico: { estado: "activo", expires_ts: 99 }
  }), {
    ticket_id: "ticket-1",
    nombre_musa: "Luna",
    equipo: 2,
    color: "#12abef",
    color_nombre: "CELESTE",
    estado: "atendiendo",
    solicitado_ts: 12,
    atendido_ts: 20,
    conectada: true,
    diagnostico: { estado: "activo", expires_ts: 99, ultimo_frame_ts: 0 }
  });

  assert.equal(help.normalizeTicket({ ticket_id: "ticket-2", estado: "resuelto" }), null);
  assert.equal(help.normalizeTicket({ estado: "pendiente" }), null);
  assert.equal(help.normalizeTicket(null), null);
});

test("muse help accepts only safe colors and known remote commands", () => {
  assert.equal(help.normalizeHex("#AbC"), "#aabbcc");
  assert.equal(help.normalizeHex("url(javascript:alert(1))"), "#ffd60a");
  assert.equal(help.foregroundForColor("#64D2FF"), "#071018");
  assert.equal(help.foregroundForColor("#BF5AF2"), "#ffffff");

  assert.deepEqual(help.normalizeCommand({
    tipo: "tap",
    command_id: "command-1",
    ticket_id: "ticket-1",
    session_id: "session-1",
    x: 0.25,
    y: 1
  }), {
    tipo: "tap",
    command_id: "command-1",
    ticket_id: "ticket-1",
    session_id: "session-1",
    x: 0.25,
    y: 1
  });

  assert.equal(help.normalizeCommand({
    tipo: "tap",
    command_id: "command-2",
    ticket_id: "ticket-1",
    session_id: "session-1",
    x: 12,
    y: 10
  }), null, "tap coordinates must be normalized");

  assert.deepEqual(help.normalizeCommand({
    tipo: "scroll",
    command_id: "command-3",
    ticket_id: "ticket-1",
    session_id: "session-1",
    delta_x: -5000,
    delta_y: 8000,
    selector: "#texto",
    text: "injected"
  }), {
    tipo: "scroll",
    command_id: "command-3",
    ticket_id: "ticket-1",
    session_id: "session-1",
    delta_x: -1200,
    delta_y: 1200
  });

  assert.equal(help.normalizeCommand({
    tipo: "type",
    command_id: "command-4",
    ticket_id: "ticket-1",
    session_id: "session-1",
    text: "not allowed"
  }), null);
});

test("remote tap never targets text-entry controls", () => {
  const input = {
    nodeType: 1,
    isContentEditable: false,
    matches(selector) {
      return selector.includes("input");
    },
    closest() {
      return null;
    }
  };
  assert.equal(help.getSafeTapTarget(input), null);

  const button = {
    nodeType: 1,
    isContentEditable: false,
    matches(selector) {
      return selector.includes(":disabled") ? false : selector.includes("button");
    },
    closest(selector) {
      if (selector.includes("contenteditable")) return null;
      if (selector.includes("button")) return this;
      return null;
    }
  };
  assert.equal(help.getSafeTapTarget(button), button);

  const link = {
    nodeType: 1,
    isContentEditable: false,
    matches(selector) {
      return selector === "a";
    },
    closest(selector) {
      if (selector.includes("contenteditable")) return null;
      if (selector === "a") return this;
      if (selector.includes("[role='button']")) return this;
      return null;
    }
  };
  assert.equal(help.getSafeTapTarget(link), null, "links cannot be activated remotely");
});

test("muse page keeps SOS above all overlays and explains scoped remote consent", () => {
  const html = read("game/public/players/index.html");
  const css = read("game/public/players/css/musa-help.css");
  const js = read("game/public/players/js/musa-help.js");

  assert.match(html, /musa-help\.css\?v=20260824f/);
  assert.match(html, /vendor\/html2canvas\/html2canvas\.min\.js\?v=1\.4\.1[\s\S]*musa-help\.js\?v=20260824f/);
  assert.match(css, /\.musa-help-fab\s*\{[\s\S]*position:\s*fixed;[\s\S]*z-index:\s*2147483630;/);
  assert.match(css, /\.musa-help-remote-indicator\s*\{[\s\S]*z-index:\s*2147483620;/);
  assert.match(js, /ver y manejar <strong>SOLO esta página<\/strong>/);
  assert.match(js, /AGITA ESTA BANDERA EN EL AIRE/);
  assert.match(js, /CANCELAR AYUDA/);
});

test("diagnostic stream is local, app-only, bounded and server-authoritative", () => {
  const js = read("game/public/players/js/musa-help.js");
  const events = read("game/public/players/js/socket-events.js");

  assert.match(js, /const INTERVALO_FRAME_MS = 1000/);
  assert.match(js, /const MAX_FRAME_BASE64 = 420000/);
  assert.match(js, /globalRef\.html2canvas/);
  assert.match(js, /return crearCanvasEstructural\(\)/, "native structural fallback remains available offline");
  assert.match(js, /dataUrl\.slice\(coma \+ 1\)/, "frames strip the data URL prefix");
  assert.match(js, /ticket_id:[\s\S]*session_id:[\s\S]*seq:[\s\S]*mime:[\s\S]*data:[\s\S]*width:[\s\S]*height:[\s\S]*ts: Date\.now\(\)/);
  assert.match(js, /TIPOS_COMANDO = new Set\(\["tap", "scroll", "back", "reconnect"\]\)/);
  assert.doesNotMatch(js, /history\.back\(/, "remote back never leaves SCRIB");
  assert.match(js, /No hay una ventana interna segura que cerrar/);
  assert.match(js, /"DIAGNOSTIC_NOT_ACTIVE", "STALE_DIAGNOSTIC", "TICKET_NOT_FOUND"/);
  assert.match(js, /ui\.bandera\.hidden = estadoLocal\.banderaMinimizada;/);
  assert.doesNotMatch(js, /getDisplayMedia|MediaRecorder|eval\(|new Function/);
  assert.match(events, /ScribMusaHelp\.createController\([\s\S]*html2canvas: window\.html2canvas/);
  assert.match(events, /if \(aplicada\)[\s\S]*ayuda_musa_controlador\.requestState\(\)/);
});

test("an attended muse can reopen the flag and revoke an active diagnostic", () => {
  const js = read("game/public/players/js/musa-help.js");
  assert.match(
    js,
    /function abrirConfirmacion\(\)[\s\S]*if \(estadoLocal\.ticket\) \{[\s\S]*estadoLocal\.banderaMinimizada = false;[\s\S]*renderizar\(\);/
  );
  assert.match(js, /ui\.bandera\.hidden = estadoLocal\.banderaMinimizada;/);
  assert.match(
    js,
    /function cancelarAyuda\(\)[\s\S]*detenerCaptura\(\{ revocar: true \}\);[\s\S]*EVENTOS\.cancelar/
  );
  assert.match(
    js,
    /if \(opts\.revocar && diagnostico && estadoLocal\.ticket\)[\s\S]*EVENTOS\.diagnosticoConsentir[\s\S]*aceptar: false/
  );
  assert.match(js, /NO SE PUDO CERRAR EL AVISO · ACCESO REMOTO REVOCADO/);
  assert.match(js, /Date\.now\(\) \+ MAX_DIAGNOSTICO_MS/);
});

test("authoritative attended tickets keep an accessible non-blocking screen halo", () => {
  const pending = help.normalizeTicket({
    ticket_id: "ticket-pending",
    estado: "pendiente",
    diagnostico: { estado: "inactivo" }
  });
  const attended = help.normalizeTicket({
    ticket_id: "ticket-attended",
    estado: "atendiendo",
    diagnostico: { estado: "inactivo" }
  });
  const diagnosing = help.normalizeTicket({
    ticket_id: "ticket-diagnostic",
    estado: "atendiendo",
    diagnostico: { estado: "activo" }
  });

  assert.deepEqual(help.getAttendingNotice(pending), { visible: false, diagnostico: false, texto: "" });
  assert.deepEqual(help.getAttendingNotice(attended), {
    visible: true,
    diagnostico: false,
    texto: "CONTROL TE ESTÁ ATENDIENDO"
  });
  assert.deepEqual(help.getAttendingNotice(diagnosing), {
    visible: true,
    diagnostico: true,
    texto: "CONTROL ESTÁ REVISANDO ESTA PÁGINA"
  });
  assert.deepEqual(help.getAttendingNotice(null), { visible: false, diagnostico: false, texto: "" });

  const js = read("game/public/players/js/musa-help.js");
  const css = read("game/public/players/css/musa-help.css");
  assert.match(js, /id = "musa_help_attending_indicator"/);
  assert.match(js, /setAttribute\("role", "status"\)/);
  assert.match(js, /setAttribute\("aria-live", "polite"\)/);
  assert.match(js, /ui\.attendingHalo\.hidden = !avisoAtencion\.visible/);
  assert.match(css, /\.musa-help-attending-halo\s*\{[\s\S]*position:\s*fixed;[\s\S]*z-index:\s*2147483590;[\s\S]*pointer-events:\s*none;/);
  assert.match(css, /bottom:\s*max\(14px, calc\(env\(safe-area-inset-bottom\) \+ 8px\)\)/);
  assert.match(css, /\.musa-help-fab\s*\{[\s\S]*z-index:\s*2147483630;/);
  assert.match(css, /\.musa-help-confirm,[\s\S]*\.musa-help-flag\s*\{[\s\S]*z-index:\s*2147483610;/);
});
