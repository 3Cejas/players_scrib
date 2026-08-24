const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function cargarDominioInspiracion() {
  const window = {};
  vm.runInNewContext(read("game/js/domains/inspiration.js"), { window }, {
    filename: "game/js/domains/inspiration.js"
  });
  return window.ScribInspiration;
}

test("F8 is the only discard shortcut and ignores unsafe keyboard states", () => {
  const inspiration = cargarDominioInspiracion();
  assert.equal(inspiration.esAtajoDescartarInspiracion({ key: "F8", code: "F8" }), true);
  assert.equal(inspiration.esAtajoDescartarInspiracion({ key: "a", code: "KeyA" }), false);

  [
    { repeat: true },
    { isComposing: true },
    { keyCode: 229 },
    { defaultPrevented: true },
    { altKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true }
  ].forEach((extra) => {
    assert.equal(
      inspiration.esAtajoDescartarInspiracion({ key: "F8", code: "F8", ...extra }),
      false
    );
  });
});

test("discard metadata exposes cumulative 75/50/25 percent penalties", () => {
  const inspiration = cargarDominioInspiracion();
  const expected = [
    { streak: 0, factor: 1, time: 100 },
    { streak: 1, factor: 0.75, time: 75 },
    { streak: 2, factor: 0.5, time: 50 },
    { streak: 3, factor: 0.25, time: 25 },
    { streak: 9, factor: 0.25, time: 25 }
  ];

  expected.forEach(({ streak, factor, time }) => {
    const meta = inspiration.normalizarMetaEntregaInspiracion({
      inspiracion_id: "delivery-1",
      descartes_consecutivos: streak
    });
    assert.equal(meta.inspiracion_id, "delivery-1");
    assert.equal(meta.factor_inspiracion, factor);
    assert.equal(meta.valor_inspiracion, factor);
    assert.equal(meta.porcentaje_tiempo, time);
  });

  const clamped = inspiration.normalizarMetaEntregaInspiracion({
    inspiracion_id: "delivery-2",
    descartes_consecutivos: 2,
    factor_inspiracion: 4,
    valor_inspiracion: -3
  });
  assert.equal(clamped.factor_inspiracion, 1);
  assert.equal(clamped.valor_inspiracion, 0);

  const nullsUseStreakFallback = inspiration.normalizarMetaEntregaInspiracion({
    inspiracion_id: "delivery-3",
    descartes_consecutivos: 1,
    factor_inspiracion: null,
    valor_inspiracion: null
  });
  assert.equal(nullsUseStreakFallback.factor_inspiracion, 0.75);
  assert.equal(nullsUseStreakFallback.valor_inspiracion, 0.75);
});

test("accepted inspiration uses only authoritative ACK value and awarded time", () => {
  const inspiration = cargarDominioInspiracion();
  assert.deepEqual(
    { ...inspiration.normalizarResultadoAprovechamiento({
      ok: true,
      valor_inspiracion: 0.5,
      tiempo_otorgado: 3
    }) },
    { valor_inspiracion: 0.5, tiempo_otorgado: 3 }
  );
  assert.deepEqual(
    { ...inspiration.normalizarResultadoAprovechamiento({
      ok: true,
      resultado: { valor_inspiracion: 0.75, tiempo_otorgado: -4 }
    }) },
    { valor_inspiracion: 0.75, tiempo_otorgado: -4 }
  );
  assert.equal(inspiration.normalizarResultadoAprovechamiento({ ok: true }), null);
  assert.equal(inspiration.normalizarResultadoAprovechamiento({
    ok: false,
    valor_inspiracion: 1,
    tiempo_otorgado: 8
  }), null);
});

test("writer discard UI is accessible and uses an acknowledged idempotent protocol", () => {
  const html = read("game/players/index.html");
  const socketEvents = read("game/players/js/socket-events.js");
  const state = read("game/players/js/state.js");

  assert.match(html, /id="inspiration_discard_button"/);
  assert.match(html, /<kbd>F8<\/kbd>/);
  assert.match(html, /id="inspiration_discard_status"[\s\S]*role="status"[\s\S]*aria-live="polite"/);
  assert.match(
    html,
    /id="inspiration_discard_effect"[\s\S]*<\/div>\s*<\/div>\s*<span\s+id="inspiration_discard_status"/,
    "the live region must remain outside the visually hidden discard container"
  );
  assert.match(socketEvents, /new Set\(\[[\s\S]*"palabras bonus"[\s\S]*"letra bendita"[\s\S]*"letra prohibida"[\s\S]*\]\)/);
  assert.doesNotMatch(
    socketEvents.match(/const MODOS_DESCARTE_INSPIRACION_ESCRITORA[\s\S]*?\]\);/)?.[0] || "",
    /palabras prohibidas/
  );
  assert.match(socketEvents, /document\.addEventListener\("keydown", manejarKeydownDescartarInspiracionEscritora, true\)/);
  assert.match(socketEvents, /document\.addEventListener\("keyup", manejarKeyupDescartarInspiracionEscritora, true\)/);
  assert.match(socketEvents, /socket\.emit\("descartar_inspiracion", payload, \(respuesta\) =>/);
  assert.match(socketEvents, /inspiracion_id: meta\.inspiracion_id,[\s\S]*modo_seq:[\s\S]*request_id: requestId/);
  assert.match(socketEvents, /accion: "solicitar", modo_seq: modo_seq_actual/);
  assert.doesNotMatch(socketEvents, /socket\.emit\("nueva_palabra_prohibida", player\)/);
  assert.match(socketEvents, /emitirAprovecharInspiracionEscritora\("nueva_palabra_prohibida"/);
  assert.match(socketEvents, /descarte_inspiracion_en_vuelo === null[\s\S]*aprovechamiento_inspiracion_en_vuelo === null/);
  assert.match(socketEvents, /accion: "aprovechar"[\s\S]*inspiracion_id: meta\.inspiracion_id,[\s\S]*request_id: requestId,[\s\S]*modo_seq: modoSeq/);
  assert.match(socketEvents, /respuesta\.ok === true/);
  assert.match(socketEvents, /valor_inspiracion: resultadoAck\.valor_inspiracion/g);
  assert.match(socketEvents, /tiempo_otorgado: resultadoAck\.tiempo_otorgado/g);
  assert.match(socketEvents, /meta_inspiracion_activa_escritora\?\.inspiracion_id === meta\.inspiracion_id/);
  assert.match(socketEvents, /return false;[\s\S]*resolverDescartePendientePorNuevaEntrega\(meta\)/);
  assert.doesNotMatch(socketEvents, /emitirCambioTiempoEscritora\(segundosBonus\)/);
  assert.match(state, /span\.dataset\.inspirationValue = String/);
  assert.match(state, /payload\.valor_inspiracion =/);
  assert.doesNotMatch(state, /metaActiva\.valor_inspiracion/);
});

test("spectator marker consumes only the server-authoritative fractional event", () => {
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorSocket = read("game/spectator/js/socket-events.js");
  assert.match(spectatorState, /payload\.autoritativa !== true/);
  assert.match(spectatorState, /increment\(equipo === 1 \? "blue" : "red", valorInspiracion\)/);
  assert.match(spectatorSocket, /socket\.on\('inspiracion_aprovechada'/);
  assert.doesNotMatch(spectatorSocket, /actualizarBarraInspiracionDesdeFeedbackEspectador/);
  assert.match(spectatorSocket, /function increment\(color, valor = 1\)/);
  assert.match(spectatorSocket, /blueCount \+= incremento/);
  assert.match(spectatorSocket, /redCount \+= incremento/);
});

test("discard UX has translations, responsive target and motion accessibility", () => {
  const i18n = read("game/js/i18n.js");
  const css = read("game/css/dashboard-players.css");
  const socketEvents = read("game/players/js/socket-events.js");
  const matches = i18n.match(/"writer\.inspiration\.discard":/g) || [];
  assert.equal(matches.length, 3);
  assert.equal((i18n.match(/"writer\.inspiration\.penalty_score":/g) || []).length, 3);
  assert.equal((i18n.match(/"writer\.inspiration\.penalty_time_final":/g) || []).length, 3);
  assert.doesNotMatch(i18n, /NEXT: TIME|PR\\u00d3XIMA: TIEMPO|SUIVANTE : TEMPS/);
  assert.match(socketEvents, /writer\.inspiration\.penalty_score/);
  assert.match(
    socketEvents,
    /const clavePenalizacion = esModoLetras[\s\S]*writer\.inspiration\.penalty_score[\s\S]*esMusa \? "writer\.inspiration\.penalty" : "writer\.inspiration\.penalty_time_final"/
  );
  assert.match(css, /\.inspiration-discard__button[\s\S]*min-height:/);
  assert.match(css, /@media \(pointer: coarse\)[\s\S]*min-height: 44px/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*inspiration-discard/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*inspiration-discard/);
  assert.match(css, /@keyframes inspirationDiscardOut/);
});

test("final score names weighted inspiration and explains discard reduction in every language", () => {
  const i18n = read("game/js/i18n.js");
  assert.equal((i18n.match(/"score\.category\.bonus\.label":/g) || []).length, 3);
  assert.equal((i18n.match(/"score\.category\.bonus\.explanation":/g) || []).length, 3);
  assert.equal((i18n.match(/"score\.unit\.bonus":/g) || []).length, 3);
  assert.match(i18n, /"score\.category\.bonus\.label": "INSPIRACI\\u00d3N"/);
  assert.match(i18n, /"score\.category\.bonus\.label": "INSPIRATION"/);
  assert.match(i18n, /reducido por los descartes/);
  assert.match(i18n, /reduced by discards/);
  assert.match(i18n, /points d'inspiration/);
  assert.doesNotMatch(i18n, /"score\.unit\.bonus": "bonus"/);
});
