const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const read = (relPath) => fs.readFileSync(path.join(ROOT, relPath), "utf8");

function cargarDominio() {
  const window = {};
  vm.runInNewContext(read("game/js/domains/pre-show.js"), {
    window,
    globalThis: window,
    Date,
    Math
  });
  return window.ScribPreShow;
}

test("pre-show normalizes an authoritative session and plain, unique messages", () => {
  const api = cargarDominio();
  const estado = api.normalizarEstado({
    activo: true,
    session_id: "show_2026-08-24:blue",
    phase_seq: 7,
    limite_texto: 180,
    cooldown_ms: 2500,
    mensajes: [
      { id: "m1", texto: "  Hola\n publico  ", nombre_musa: "  Luna ", equipo: 1, creado_en: 2 },
      { id: "m1", texto: "duplicado", nombre_musa: "EVA", equipo: 2 },
      { id: "m2", texto: "<img src=x onerror=alert(1)>", nombre_musa: "<SOL>", equipo: 2 }
    ]
  });

  assert.equal(estado.activo, true);
  assert.equal(estado.session_id, "show_2026-08-24:blue");
  assert.equal(estado.phase_seq, 7);
  assert.equal(api.tieneSesionSincronizada(estado), true);
  assert.equal(estado.mensajes.length, 2);
  assert.equal(estado.mensajes[0].texto, "Hola publico");
  assert.equal(estado.mensajes[1].texto, "<img src=x onerror=alert(1)>");
  assert.equal(estado.mensajes[1].nombre_musa, "<SOL>");

  const cerrado = api.normalizarEstado({ ...estado, activo: false });
  assert.deepEqual(Array.from(cerrado.mensajes), []);
});

test("pre-show rejects malformed session metadata and overlong input", () => {
  const api = cargarDominio();
  [
    { session_id: "", phase_seq: 1 },
    { session_id: "spaces are invalid", phase_seq: 1 },
    { session_id: "valid", phase_seq: "1" },
    { session_id: "valid", phase_seq: 0 },
    { session_id: "valid", phase_seq: 1.2 }
  ].forEach((metadata) => {
    assert.equal(api.tieneSesionSincronizada(api.normalizarEstado({ activo: true, ...metadata })), false);
  });

  assert.deepEqual(
    { ...api.validarTexto("   ", 180) },
    { ok: false, code: "INVALID_TEXT", texto: "", limite: 180 }
  );
  assert.equal(api.validarTexto("x".repeat(181), 180).code, "TEXT_TOO_LONG");
  assert.equal(api.validarTexto("🎭".repeat(180), 180).ok, true);
  assert.equal(api.validarTexto("🎭".repeat(181), 180).code, "TEXT_TOO_LONG");
  assert.deepEqual(
    { ...api.validarTexto(" hola\n\npublico ", 180) },
    { ok: true, code: "", texto: "hola publico", limite: 180 }
  );
});

test("a new authoritative session reopens in both event orders around cleanup", () => {
  const api = cargarDominio();
  const anterior = api.normalizarEstado({ activo: false, session_id: "show_old", phase_seq: 4 });
  const nueva = api.normalizarEstado({ activo: true, session_id: "show_new", phase_seq: 5 });

  assert.equal(api.debeReabrirNuevaSesion(anterior, nueva, { partidaActiva: false }), true);
  assert.equal(api.debeReabrirNuevaSesion(anterior, nueva, { partidaActiva: true }), false);
  assert.equal(api.puedeReanudarEnLobby(nueva, { partidaActiva: false }), true);
  assert.equal(api.puedeReanudarEnLobby(nueva, { partidaActiva: true }), false);
});

test("muse wiring is session-bound, IME-safe, acknowledged and tutorial-scoped", () => {
  const html = read("game/public/players/index.html");
  const state = read("game/public/players/js/state.js");
  const sockets = read("game/public/players/js/socket-events.js");

  assert.match(html, /id="pre_show_musa"[^>]*hidden[^>]*aria-labelledby/);
  assert.match(html, /id="pre_show_musa_feedback"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /domains\/pre-show\.js\?v=20260824b/);
  assert.match(state, /evt\.isComposing[\s\S]*pre_show_ime_activo_musa[\s\S]*evt\.keyCode === 229/);
  assert.match(state, /evt\.shiftKey/);
  assert.match(state, /pre_show_envio_pendiente_musa/);
  assert.match(state, /request_id: contexto\.requestId,[\s\S]*session_id: contexto\.sessionId,[\s\S]*phase_seq: contexto\.phaseSeq/);
  assert.match(state, /String\(respuesta\.session_id \|\| ""\) !== contexto\.sessionId/);
  assert.match(state, /nuevaSesion && siguiente\.activo && window\.ScribPreShow\.tieneSesionSincronizada/);
  assert.match(sockets, /socket\.on\("pre_show_estado"/);
  assert.match(sockets, /const aplicada = procesarAsignacionAutoritativaMusa[\s\S]*if \(aplicada\) \{[\s\S]*socket\.emit\('pedir_pre_show_estado'\)[\s\S]*socket\.emit\('pedir_video_tutorial_estado'\)[\s\S]*\}/);
  assert.match(sockets, /socket\.on\('inicio'[\s\S]*cerrarPreShowMusaPorTutorial\(\)/);
});

test("spectator renders only recent messages as text and yields to tutorial/teleprompter", () => {
  const html = read("game/spectator/index.html");
  const state = read("game/spectator/js/state.js");
  const sockets = read("game/spectator/js/socket-events.js");
  const css = read("game/css/dashboard-players.css");
  const renderer = state.slice(
    state.indexOf("function crearMensajePreShowEspectador"),
    state.indexOf("function renderizarPreShowEspectador")
  );

  assert.match(html, /id="pre_show_espectador"[^>]*hidden[^>]*aria-label/);
  assert.match(html, /id="pre_show_espectador_anuncio"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(state, /PRE_SHOW_MENSAJES_VISIBLES_ESPECTADOR = 8/);
  assert.match(state, /\.mensajes\.slice\(-PRE_SHOW_MENSAJES_VISIBLES_ESPECTADOR\)/);
  assert.match(renderer, /musa\.textContent = mensaje\.nombre_musa/);
  assert.match(renderer, /texto\.textContent = mensaje\.texto/);
  assert.doesNotMatch(renderer, /innerHTML/);
  assert.match(state, /teleprompter_estado && teleprompter_estado\.visible/);
  assert.match(state, /cerrarPreShowEspectadorPorTutorial/);
  assert.match(state, /vista_espectador_modo_resuelta === "tutorial"/);
  assert.match(sockets, /socket\.emit\('pedir_pre_show_estado'\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.pre-show-message/);
  assert.match(css, /@media \(max-width: 720px\), \(max-height: 620px\)/);
});

test("spectator pre-show keeps one motivating sentence and removes explanatory chrome", () => {
  const html = read("game/spectator/index.html");
  const state = read("game/spectator/js/state.js");
  const section = html.match(/<section id="pre_show_espectador"[\s\S]*?<\/section>/)?.[0] || "";

  assert.match(section, /preshow\.spectator\.waiting[^>]*>MUSAS, \u00a1HACEDLES ESCRIBIR!</);
  assert.doesNotMatch(section, /pre-show-espectador__(?:header|live|eyebrow|footer)/);
  assert.doesNotMatch(section, /EN DIRECTO|ANTES DEL TUTORIAL|LAS MUSAS TOMAN EL CANAL|Mensajes en directo|EL CANAL TERMINA/);
  assert.doesNotMatch(section, /pre-show-espectador__empty-icon/);
  assert.match(state, /"MUSAS, \\u00a1HACEDLES ESCRIBIR!"/);
});

test("all supported languages include the pre-show interface and feedback", () => {
  const i18n = read("game/js/i18n.js");
  [
    "preshow.live",
    "preshow.muse.title",
    "preshow.muse.feedback.offensive",
    "preshow.spectator.messages_aria",
    "preshow.spectator.waiting"
  ].forEach((key) => {
    assert.equal((i18n.match(new RegExp(`"${key.replace(/\./g, "\\.")}"`, "g")) || []).length, 3);
  });
});
