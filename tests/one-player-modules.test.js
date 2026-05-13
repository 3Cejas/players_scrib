const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const NODE_TYPES = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3
};

function loadScript(relPath, extraContext = {}) {
  const context = {
    console,
    clearTimeout() {},
    setTimeout() {
      return 1;
    },
    Node: NODE_TYPES,
    ...extraContext
  };
  context.globalThis = context;
  if (!context.window) {
    context.window = {};
  }
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, relPath), "utf8"), context, {
    filename: relPath
  });
  return context;
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function textNode(text) {
  return {
    nodeType: NODE_TYPES.TEXT_NODE,
    textContent: text
  };
}

function elementNode(tagName, childNodes = []) {
  return {
    nodeType: NODE_TYPES.ELEMENT_NODE,
    tagName,
    childNodes
  };
}

test("1P numeric settings clamps step changes to input limits", () => {
  const inputs = {
    tiempo: { value: "7", min: "0", max: "10" },
    invalid: { value: "nope", min: "-5", max: "5" }
  };
  const context = loadScript("1p_scrib/game/js/numeric-settings.js", {
    document: {
      getElementById: (id) => inputs[id]
    }
  });

  context.cambiarValor("tiempo", 5);
  assert.equal(inputs.tiempo.value, 10);

  context.cambiarValor("tiempo", -30);
  assert.equal(inputs.tiempo.value, 0);

  context.cambiarValor("invalid", -8);
  assert.equal(inputs.invalid.value, -5);
});

test("1P gameplay state exposes shared constants and mutable timers", () => {
  const context = loadScript("1p_scrib/game/js/gameplay-state.js", {
    window: {
      scrib1pGameplayShared: { existing: true }
    }
  });

  const shared = context.window.scrib1pGameplayShared;
  assert.equal(shared.existing, true);
  assert.equal(shared.LIMITE_TOTAL, 10);
  assert.equal(shared.SECS_BASE, 2);

  shared.rapidez_borrado = 9000;
  shared.rapidez_inicio_borrado = 8000;
  shared.terminado = true;

  assert.equal(shared.rapidez_borrado, 9000);
  assert.equal(shared.rapidez_inicio_borrado, 8000);
  assert.equal(shared.terminado, true);
});

test("1P weighted Spanish letter picker favors opposite letters by mode", () => {
  const context = loadScript("1p_scrib/game/js/letter-frequency.js");
  const api = context.window.ScribLetterFrequency;

  assert.equal(api.ALFABETO_ES.length, 27);
  assert.equal(api.ALFABETO_ES.includes("\u00f1"), true);
  assert.ok(api.pesoLetraPorModo("e", "prohibida") > api.pesoLetraPorModo("w", "prohibida"));
  assert.ok(api.pesoLetraPorModo("w", "bendita") > api.pesoLetraPorModo("e", "bendita"));
  assert.equal(api.elegirLetraPonderada(["e", "w"], "prohibida", () => 0.5), "e");
  assert.equal(api.elegirLetraPonderada(["e", "w"], "bendita", () => 0.5), "w");
});

test("1P mode data uses the weighted full alphabet for letter levels", () => {
  const context = loadScript("1p_scrib/game/js/letter-frequency.js");
  const math = Object.create(Math);
  math.random = () => 0.5;
  context.Math = math;
  context.leerRapidezBorradoGameplay1P = () => 1000;
  context.leerRapidezInicioBorradoGameplay1P = () => 1000;
  context.document = {
    querySelector: () => ({})
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "1p_scrib/game/js/mode-data.js"), "utf8"), context, {
    filename: "1p_scrib/game/js/mode-data.js"
  });

  const snapshot = vm.runInNewContext(`({
    prohibidas: letras_prohibidas,
    benditas: letras_benditas_ponderadas,
    prohibida: elegir_letra_nivel_ponderada(["e", "w"], ["e", "w"], "prohibida").letra,
    bendita: elegir_letra_nivel_ponderada(["e", "w"], ["e", "w"], "bendita").letra
  })`, context);

  assert.equal(snapshot.prohibidas.length, 27);
  assert.deepEqual(snapshot.benditas, snapshot.prohibidas);
  assert.equal(snapshot.prohibida, "e");
  assert.equal(snapshot.bendita, "w");
});

test("1P confetti star effect uses a stable unicode escape", () => {
  const writerText = read("1p_scrib/game/js/writer-text.js");
  const html = read("1p_scrib/game/index.html");

  assert.match(writerText, /text:\s*'\\u2B50'/);
  assert.equal(writerText.includes(String.fromCodePoint(0x2B50)), false);
  assert.doesNotMatch(writerText, /text:\s*['"][\u00e2\u00f0]/);
  assert.match(html, /\.\/js\/writer-text\.js\?v=20260504a/);
});

test("1P life bar animates from empty when it becomes visible", () => {
  const runtime = read("1p_scrib/game/js/match-runtime.js");
  const html = read("1p_scrib/game/index.html");

  assert.match(runtime, /function debeAnimarEntradaBarraVida\(elemento, opciones = \{\}\)/);
  assert.match(runtime, /elemento\.dataset\.vidaVisible !== "1"/);
  assert.match(runtime, /aplicarEstadoBarraVida\(elemento, 0\);/);
  assert.match(runtime, /if \(elemento\.dataset\) elemento\.dataset\.vidaVisible = "0";/);
  assert.match(runtime, /const animarEntrada = debeAnimarEntradaBarraVida\(elemento, opciones\);/);
  assert.match(runtime, /if \(elemento\.dataset\) elemento\.dataset\.vidaVisible = "1";/);
  assert.match(html, /\.\/js\/match-runtime\.js\?v=20260504b/);
});

test("1P mode rules compute durations and cycle blessed letters", () => {
  const selectedLetters = [];
  const math = Object.create(Math);
  math.random = () => 0;
  const context = loadScript("1p_scrib/game/js/mode-rules.js", {
    Math: math,
    setTimeout: (_fn, ms) => ({ ms }),
    nueva_letra: (letter) => selectedLetters.push(letter),
    resumenPartida: {
      letrasBenditas: new Set(),
      letrasMalditas: new Set()
    }
  });

  context.modo_actual = "frase final";
  context.secondsRemaining = 2.2;
  assert.equal(context.obtenerDuracionModoActualSegundos(), 3);

  context.secondsRemaining = -1;
  assert.equal(context.obtenerDuracionModoActualSegundos(), 1);

  context.modo_actual = "palabras bonus";
  context.TIEMPO_CAMBIO_MODOS = 2500;
  assert.equal(context.obtenerDuracionModoActualSegundos(), 3);

  context.TIEMPO_CAMBIO_MODOS = 0;
  assert.equal(context.obtenerDuracionModoActualSegundos(), 1);

  context.letras_benditas = ["a", "b"];
  context.letras_benditas_restantes = ["a"];
  context.TIEMPO_CAMBIO_LETRA = 1500;
  context.nueva_letra_bendita();

  assert.deepEqual(selectedLetters, ["a"]);
  assert.deepEqual(Array.from(context.letras_benditas_restantes), ["a", "b"]);
  assert.equal(context.resumenPartida.letrasBenditas.has("A"), true);
});

test("1P stale async bonus words are ignored after mode changes", async () => {
  let resolveWord;
  const context = loadScript("1p_scrib/game/js/mode-lifecycle.js", {
    texto: {
      addEventListener() {},
      removeEventListener() {}
    },
    countChars() {},
    getRandomSpanishWord: () => new Promise((resolve) => {
      resolveWord = resolve;
    }),
    modo_actual: "palabras bonus",
    terminado: false
  });

  const revision = context.invalidarSolicitudesPalabraBonus1P();
  const pending = context.recibir_palabra(revision);
  context.modo_actual = "tertulia";
  context.invalidarSolicitudesPalabraBonus1P();
  resolveWord({ title: "tarde", definicion: "No debe pintarse" });
  await pending;

  assert.equal(context.palabra_actual, undefined);
});

test("1P blessed-letter delete penalty is applied once", () => {
  const penalties = [];
  const context = loadScript("1p_scrib/game/js/mode-rules.js", {
    window: {
      getSelection: () => ({
        rangeCount: 1,
        anchorNode: { nodeType: NODE_TYPES.TEXT_NODE, textContent: "" },
        focusOffset: 0
      })
    },
    obtenerNodoProtegidoAfectadoPorEdicion: () => ({
      classList: {
        contains: (className) => className === "letra-verde"
      }
    }),
    CLASE_LETRA_BENDITA_LOCAL: "letra-verde",
    addSeconds: (value) => penalties.push(value),
    mostrarFeedbackFlotanteEscritora() {},
    formatearTiempoSegundosI18n1P: (value, options = {}) => `${options.signo || ""}${value}`,
    color_negativo: "red"
  });
  const event = {
    defaultPrevented: false,
    inputType: "deleteContentBackward",
    preventDefault() {
      this.defaultPrevented = true;
    }
  };

  context.modo_letra_bendita(event);

  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(penalties, [-1]);
});

test("1P protected text helpers identify protected nodes and event characters", () => {
  const protectedNode = { id: "protected" };
  const parent = {
    closest: () => protectedNode
  };
  const context = loadScript("1p_scrib/game/js/protected-text.js", {
    window: {
      getSelection: () => ({
        rangeCount: 1,
        anchorNode: {
          nodeType: NODE_TYPES.TEXT_NODE,
          textContent: "abc"
        },
        focusOffset: 2
      })
    }
  });

  assert.equal(context.nodoEnPalabraBendita({
    nodeType: NODE_TYPES.ELEMENT_NODE,
    closest: () => protectedNode
  }), protectedNode);
  assert.equal(context.nodoEnPalabraBendita({
    nodeType: NODE_TYPES.TEXT_NODE,
    parentElement: parent
  }), protectedNode);
  assert.equal(context.obtenerCaracterEntradaEvento({ data: "x" }), "x");
  assert.equal(context.obtenerCaracterEntradaEvento({ key: "y" }), "y");
  assert.equal(context.obtenerCaracterEntradaEvento({}), "b");
  assert.equal(context.debeVigilarMutacionProtegida("deleteContentBackward"), true);
  assert.equal(context.debeVigilarMutacionProtegida("formatBold"), false);
});

test("1P final phrase helpers clamp styles and preserve plain-text line breaks", () => {
  const context = loadScript("1p_scrib/game/js/final-phrase.js");

  const emptyStyle = context.estiloProgresoFraseFinal(-1);
  assert.equal(emptyStyle.color, "hsl(32, 0%, 96%)");
  assert.equal(emptyStyle.textShadow, "0 0 0.08em rgba(255, 140, 0, 0.03)");

  const fullStyle = context.estiloProgresoFraseFinal(2);
  assert.equal(fullStyle.color, "hsl(32, 100%, 56%)");
  assert.equal(fullStyle.textShadow, "0 0 0.68em rgba(255, 140, 0, 0.63)");

  const root = elementNode("DIV", [
    textNode("uno"),
    elementNode("BR"),
    elementNode("P", [textNode("dos")]),
    elementNode("SPAN", [textNode("tres")])
  ]);

  assert.equal(context.obtenerTextoPlanoConSaltosFraseFinal(root), "uno\ndos\ntres");
});
