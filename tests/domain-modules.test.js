const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function cargarDominio(relPath) {
  const window = {};
  const context = { window };
  context.window = window;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, relPath), "utf8"), context, {
    filename: relPath
  });
  return window;
}

function cargarI18n() {
  const window = {
    dispatchEvent() {}
  };
  const document = {
    readyState: "complete",
    documentElement: {
      setAttribute() {}
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {}
  };
  const context = {
    window,
    document,
    CustomEvent: function CustomEvent(type, init = {}) {
      return { type, ...init };
    },
    console
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "game/js/i18n.js"), "utf8"), context, {
    filename: "game/js/i18n.js"
  });
  return window;
}

function textoDom(texto) {
  return {
    nodeType: 3,
    data: texto,
    textContent: texto,
    parentNode: null
  };
}

function elementoDom(className = "", hijos = [], attrs = {}) {
  const node = {
    nodeType: 1,
    className,
    childNodes: hijos,
    parentNode: null,
    contentEditable: attrs.contenteditable || "",
    getAttribute(nombre) {
      if (nombre === "class") return this.className;
      if (nombre === "contenteditable") return attrs.contenteditable || null;
      return attrs[nombre] || null;
    },
    removeChild(child) {
      const index = this.childNodes.indexOf(child);
      if (index >= 0) {
        this.childNodes.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    }
  };
  hijos.forEach((child) => {
    child.parentNode = node;
  });
  return node;
}

test("ScribInspiration validates letter-mode inspiration and preserves ene", () => {
  const { ScribInspiration } = cargarDominio("game/js/domains/inspiration.js");

  assert.equal(ScribInspiration.normalizarTexto("cancion"), "cancion");
  assert.equal(ScribInspiration.normalizarTexto("ca\u00f1\u00f3n"), "ca\u00f1on");
  assert.equal(ScribInspiration.normalizarTexto("canci\u00f3n ping\u00fcino"), "cancion pinguino");
  assert.equal(ScribInspiration.tienePreviewTiempo(" palabras bonus "), true);
  assert.equal(ScribInspiration.tienePreviewTiempo("letra bendita"), false);
  assert.equal(
    ScribInspiration.calcularTiempoPalabra("dos palabras"),
    ScribInspiration.calcularTiempoPalabra("dospalabras")
  );
  const previewBonus = ScribInspiration.calcularPreviewTiempoPalabra({
    modo: "palabras bonus",
    texto: "cometa"
  });
  assert.equal(previewBonus.visible, true);
  assert.equal(previewBonus.signo, "+");
  assert.equal(previewBonus.delta, previewBonus.segundos);
  assert.equal(previewBonus.tipo, "suma");

  const previewProhibida = ScribInspiration.calcularPreviewTiempoPalabra({
    modo: "palabras prohibidas",
    texto: "tormenta"
  });
  assert.equal(previewProhibida.visible, true);
  assert.equal(previewProhibida.signo, "-");
  assert.equal(previewProhibida.delta, -previewProhibida.segundos);
  assert.equal(previewProhibida.tipo, "resta");
  assert.equal(ScribInspiration.calcularPreviewTiempoPalabra({
    modo: "palabras bonus",
    texto: "dos palabras"
  }).visible, false);
  assert.equal(ScribInspiration.calcularPreviewTiempoPalabra({
    modo: "letra bendita",
    texto: "cometa"
  }).visible, false);
  assert.equal(ScribInspiration.validarInspiracion({
    modo: "letra bendita",
    texto: "kilo",
    letra: "k"
  }).ok, true);
  assert.equal(ScribInspiration.validarInspiracion({
    modo: "letra prohibida",
    texto: "kilo",
    letra: "k"
  }).ok, false);
  assert.equal(ScribInspiration.validarInspiracion({
    modo: "palabras bonus",
    texto: "dos palabras",
    letra: ""
  }).motivo, "spaces");
  assert.equal(ScribInspiration.validarInspiracion({
    modo: "letra bendita",
    texto: "faro",
    letra: "z"
  }).motivo, "not-useful");
});

test("ScribInspiration resolves bonus-word time when reconnect payload omits seconds", () => {
  const { ScribInspiration } = cargarDominio("game/js/domains/inspiration.js");
  const expectedBonus = ScribInspiration.calcularTiempoPalabra("horizonte");
  const expectedProhibida = ScribInspiration.calcularTiempoPalabra("veneno");

  assert.equal(ScribInspiration.normalizarSegundosTiempo("+30 segs."), 30);
  assert.equal(ScribInspiration.normalizarSegundosTiempo("undefined"), null);
  assert.equal(ScribInspiration.resolverTiempoPalabraAsignada({
    modo_actual: "palabras bonus",
    palabras_var: "horizonte",
    tiempo_palabras_bonus: undefined
  }), expectedBonus);
  assert.equal(ScribInspiration.formatearTiempoPalabraAsignada({
    modo_actual: "palabras bonus",
    palabra_bonus: [["horizonte"], "musa"],
    tiempo_palabras_bonus: "undefined"
  }, { modo: "palabras bonus" }), `+${expectedBonus} segs.`);
  assert.equal(ScribInspiration.formatearTiempoPalabraAsignada({
    modo_actual: "palabras prohibidas",
    palabras_var: ["veneno"],
    tiempo_palabras_bonus: undefined
  }, { modo: "palabras prohibidas" }), `-${expectedProhibida} segs.`);
});

test("i18n normalizes mojibake blessed letters before rendering mode rules", () => {
  const window = cargarI18n();
  const mojibakeEnye = "\u00c3\u00b1";
  const doubleMojibakeEnye = "\u00c3\u0192\u00c2\u00b1";
  const doubleMojibakeUpperEnye = "\u00c3\u0192\u00c2\u2018";

  assert.equal(window.scribNormalizeModeLetter2P(mojibakeEnye), "\u00f1");
  assert.equal(window.scribNormalizeModeLetter2P(doubleMojibakeEnye), "\u00f1");
  assert.equal(window.scribNormalizeModeLetter2P(doubleMojibakeUpperEnye), "\u00f1");

  const rule = window.scribBuildModeRule2P("bendita", doubleMojibakeEnye);
  assert.match(rule, />\u00d1<\/span>/);
  assert.doesNotMatch(rule, /Ã|Â|ƒ|±/);
});

test("i18n localizes downloadable PDF labels", () => {
  const window = cargarI18n();

  assert.equal(window.scribT2P("pdf.match_report_title"), "INFORME DE PARTIDA");
  assert.equal(
    window.scribT2P("pdf.muse_team_writer_line", { team: "J1", writer: "Ada" }),
    "Equipo J1 - Ada"
  );

  window.scribSetLanguage2P("en");
  assert.equal(window.scribT2P("pdf.match_report_title"), "MATCH REPORT");
  assert.equal(window.scribT2P("pdf.muse_gift_title"), "MUSE GIFT");
  assert.equal(
    window.scribT2P("pdf.muse_team_writer_line", { team: "J1", writer: "Ada" }),
    "Team J1 - Ada"
  );
  assert.equal(window.scribT2P("pdf.muse_status_entered_by_rival"), "[ENTERED BY RIVAL]");

  window.scribSetLanguage2P("fr");
  assert.equal(window.scribT2P("pdf.match_report_title"), "RAPPORT DE PARTIE");
  assert.equal(window.scribT2P("pdf.muse_gift_title"), "CADEAU DE MUSE");
  assert.equal(
    window.scribT2P("pdf.muse_team_writer_line", { team: "J2", writer: "Bea" }),
    "Equipe J2 - Bea"
  );
  assert.equal(window.scribT2P("pdf.muse_status_pending"), "[EN FILE/NON UTILISEE]");
});

test("ScribEditorDeletion skips protected words and keeps deleting behind them", () => {
  const { ScribEditorDeletion } = cargarDominio("game/js/domains/editor-deletion.js");
  const antes = textoDom("abc");
  const protegidaTexto = textoDom("BONUS");
  const protegida = elementoDom("palabra-bendita", [protegidaTexto], { contenteditable: "false" });
  const despues = textoDom("xy");
  const raiz = elementoDom("", [antes, protegida, despues]);

  assert.equal(ScribEditorDeletion.borrarUltimoCaracterEditable(raiz).deleted, true);
  assert.equal(despues.data, "x");
  assert.equal(protegidaTexto.data, "BONUS");

  assert.equal(ScribEditorDeletion.borrarUltimoCaracterEditable(raiz).deleted, true);
  assert.equal(raiz.childNodes.includes(despues), false);
  assert.equal(protegidaTexto.data, "BONUS");

  assert.equal(ScribEditorDeletion.borrarUltimoCaracterEditable(raiz).deleted, true);
  assert.equal(antes.data, "ab");
  assert.equal(protegidaTexto.data, "BONUS");
});

test("ScribEditorDeletion deletes editable text beside protected words in one step", () => {
  const { ScribEditorDeletion } = cargarDominio("game/js/domains/editor-deletion.js");
  const antes = textoDom("abc");
  const protegidaTexto = textoDom("BONUS");
  const protegida = elementoDom("palabra-bendita", [protegidaTexto], { contenteditable: "false" });
  const despues = textoDom("xy");
  const raiz = elementoDom("", [antes, protegida, despues]);

  const atras = ScribEditorDeletion.borrarCaracterEditableJuntoAProtegido(raiz, protegida, "backward");
  assert.equal(atras.deleted, true);
  assert.equal(antes.data, "ab");
  assert.equal(despues.data, "xy");
  assert.equal(protegidaTexto.data, "BONUS");

  const delante = ScribEditorDeletion.borrarCaracterEditableJuntoAProtegido(raiz, protegida, "forward");
  assert.equal(delante.deleted, true);
  assert.equal(antes.data, "ab");
  assert.equal(despues.data, "y");
  assert.equal(protegidaTexto.data, "BONUS");
});

test("ScribEditorDeletion stops when only protected content remains", () => {
  const { ScribEditorDeletion } = cargarDominio("game/js/domains/editor-deletion.js");
  const protegidaTexto = textoDom("A");
  const raiz = elementoDom("", [
    elementoDom("letra-verde", [protegidaTexto], { contenteditable: "false" })
  ]);

  const resultado = ScribEditorDeletion.borrarUltimoCaracterEditable(raiz);
  assert.equal(resultado.deleted, false);
  assert.equal(protegidaTexto.data, "A");
  assert.equal(ScribEditorDeletion.borrarCaracterEditableJuntoAProtegido(
    raiz,
    raiz.childNodes[0],
    "backward"
  ).deleted, false);
});

test("ScribDisadvantages centralizes emojis and aliases", () => {
  const { ScribDisadvantages } = cargarDominio("game/js/domains/disadvantages.js");

  assert.equal(ScribDisadvantages.normalizar("tortuga"), ScribDisadvantages.EMOJIS.TORTUGA);
  assert.equal(ScribDisadvantages.normalizar("RAYO"), ScribDisadvantages.EMOJIS.RAYO);
  assert.equal(ScribDisadvantages.normalizar("\u{1F32A}"), ScribDisadvantages.EMOJIS.BRUMA);
  assert.equal(ScribDisadvantages.normalizar("borrado bloqueado"), ScribDisadvantages.EMOJIS.BLOQUEO);
  assert.equal(ScribDisadvantages.normalizar("sin alias"), "sin alias");
  assert.equal(ScribDisadvantages.opcionesVotacion().length, 5);
  assert.match(ScribDisadvantages.etiqueta(ScribDisadvantages.EMOJIS.RAYO), /BORRADO RAPIDO/);
});

test("ScribTeleprompter applies bounded state updates", () => {
  const { ScribTeleprompter } = cargarDominio("game/js/domains/teleprompter.js");
  const state = ScribTeleprompter.crearEstado();

  ScribTeleprompter.aplicarEstado(state, {
    visible: true,
    fontSize: 500,
    speed: -10,
    source: 9,
    loadId: 3,
    revision: 4
  }, {
    fontMin: 18,
    fontMax: 80,
    speedMin: 5,
    speedMax: 200
  });

  assert.equal(state.visible, true);
  assert.equal(state.fontSize, 80);
  assert.equal(state.speed, 5);
  assert.equal(state.source, 0);
  assert.equal(state.loadId, 3);
  assert.equal(state.revision, 4);
  assert.equal(ScribTeleprompter.normalizarRevision("7.9"), 7);
  assert.equal(ScribTeleprompter.normalizarRevision(-3), 0);
  assert.equal(ScribTeleprompter.normalizarRevision("nope"), null);
  assert.equal(ScribTeleprompter.esEstadoObsoleto({ revision: 2 }, 4), true);
  assert.equal(ScribTeleprompter.esEstadoObsoleto({ revision: "bad" }, 4), false);
});

test("ScribResurrection normalizes menu state", () => {
  const { ScribResurrection } = cargarDominio("game/js/domains/resurrection.js");
  const state = ScribResurrection.crearEstadoMenu("2", {
    visible: true,
    palabras: 3
  });

  assert.equal(state.player, 2);
  assert.equal(state.visible, true);
  assert.equal(state.palabras, 3);
  assert.equal(ScribResurrection.estaActiva(state), true);
  assert.equal(ScribResurrection.normalizarPlayer("bad"), null);
  assert.equal(ScribResurrection.crearEstadoMenu("bad").player, 1);
});

test("ScribCredits normalizes server-like payloads for spectator rendering", () => {
  const { ScribCredits } = cargarDominio("game/js/domains/credits.js");
  const longName = "A".repeat(120);
  const payload = ScribCredits.normalizarPayload({
    mostrar: 1,
    animacion_id: "3",
    ts: "42",
    creditos: {
      escritxr_rojo: `  ${longName}  `,
      programacion: "  PROGRAMACION TEST  ",
      agradecimientos: "  Sala A  \r\n\r\n  Sala B  ",
      musas: {
        azules: [" Luna ", "luna", "<Sol>"],
        rojas: [" Eva ", "", "Marta"]
      }
    }
  });

  assert.equal(payload.mostrar, true);
  assert.equal(payload.animacion_id, 3);
  assert.equal(payload.ts, 42);
  assert.equal(payload.creditos.escritxr_rojo.length, ScribCredits.TEXT_MAX);
  assert.equal(payload.creditos.programacion, "PROGRAMACION TEST");
  assert.equal(payload.creditos.agradecimientos, "Sala A\nSala B");
  assert.deepEqual(payload.creditos.musas.azules, ["Luna", "<Sol>"]);
  assert.deepEqual(payload.creditos.musas.rojas, ["Eva", "Marta"]);
});
