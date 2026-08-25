const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function cargarAccionesEscritora(overrides = {}) {
  const feedback = [];
  const cambiosTiempo = [];
  const socketEvents = [];
  const window = {
    CLASE_PALABRA_BENDITA: "palabra-bendita",
    ScribRuntime: {
      animateCSS: () => Promise.resolve()
    },
    getSelection: () => ({
      rangeCount: 0,
      getRangeAt: () => null,
      removeAllRanges() {},
      addRange() {}
    })
  };
  const defaultDocument = {
    addEventListener() {},
    createTreeWalker: () => ({
      nextNode: () => false,
      currentNode: null
    })
  };
  const context = {
    console: { log() {} },
    window,
    document: overrides.document || defaultDocument,
    NodeFilter: { SHOW_TEXT: 4 },
    clearTimeout() {},
    setTimeout: () => 1,
    modo_actual: "palabras bonus",
    actualizarPuntosMarcador() {},
    mostrarFeedbackFlotanteEscritora(texto, opciones = {}) {
      feedback.push({ texto, opciones });
    },
    emitirCambioTiempoEscritora(secs) {
      cambiosTiempo.push(secs);
    },
    socket: {
      emit(evento, payload) {
        socketEvents.push({ evento, payload });
      }
    },
    feedback_de_j_x: "feedback_de_j1",
    player: "1"
  };
  context.globalThis = context;
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, "game/players/js/actions.js"), "utf8"),
    context,
    { filename: "game/players/js/actions.js" }
  );
  return { context, feedback, cambiosTiempo, socketEvents };
}

function escribirTresPalabras(context) {
  const editor = { innerText: "" };
  editor.innerText = "uno";
  context.window.countChars(editor);
  editor.innerText = "uno dos";
  context.window.countChars(editor);
  editor.innerText = "uno dos tres";
  context.window.countChars(editor);
}

test("writer typing grants a small numeric inspiration bonus after reconnect", () => {
  const { context, feedback, cambiosTiempo, socketEvents } = cargarAccionesEscritora();

  escribirTresPalabras(context);

  assert.equal(feedback.at(-1).texto, "+0.2 insp.");
  assert.deepEqual(cambiosTiempo, []);
  assert.equal(socketEvents.at(-1).payload.tiempo_feed, "+0.2 insp.");
  assert.equal(socketEvents.at(-1).payload.tipo, "mini_inspiracion");
});

test("writer strength increases mini inspiration without changing time", () => {
  const { context, feedback, cambiosTiempo } = cargarAccionesEscritora();

  context.aplicarAtributosEscritora({ fuerza: 10, agilidad: 0, destreza: 0 });
  escribirTresPalabras(context);

  assert.equal(feedback.at(-1).texto, "+0.8 insp.");
  assert.deepEqual(cambiosTiempo, []);
});

test("writer restored attributes update the hidden skill menu state", () => {
  const atributos = ["fuerza", "agilidad", "destreza"].map((key) => {
    const contador = { textContent: "" };
    const puntos = Array.from({ length: 10 }, () => ({
      filled: false,
      classList: {
        toggle(_className, active) {
          this.owner.filled = Boolean(active);
        },
        owner: null
      }
    }));
    puntos.forEach((punto) => {
      punto.classList.owner = punto;
    });
    return {
      dataset: { atributo: key },
      contador,
      puntos,
      querySelector(selector) {
        return selector === ".contador" ? contador : null;
      },
      querySelectorAll(selector) {
        return selector === ".punto" ? puntos : [];
      }
    };
  });
  const ids = {
    "total-usados": { textContent: "" },
    total: {
      tabIndex: -1,
      attrs: {},
      classList: {
        ready: false,
        toggle(_className, active) {
          this.ready = Boolean(active);
        }
      },
      setAttribute(name, value) {
        this.attrs[name] = value;
      }
    },
    btnInicio: { disabled: true }
  };
  const document = {
    addEventListener() {},
    createTreeWalker: () => ({ nextNode: () => false, currentNode: null }),
    querySelectorAll: (selector) => (selector === ".atributo" ? atributos : []),
    getElementById: (id) => ids[id] || null
  };
  const { context } = cargarAccionesEscritora({ document });

  context.aplicarAtributosEscritora({ fuerza: 3, agilidad: 2, destreza: 5 });

  assert.deepEqual(atributos.map((atributo) => atributo.contador.textContent), [3, 2, 5]);
  assert.equal(atributos[0].puntos.filter((punto) => punto.filled).length, 3);
  assert.equal(atributos[1].puntos.filter((punto) => punto.filled).length, 2);
  assert.equal(atributos[2].puntos.filter((punto) => punto.filled).length, 5);
  assert.equal(ids["total-usados"].textContent, 10);
  assert.equal(ids.total.classList.ready, true);
  assert.equal(ids.total.attrs["aria-disabled"], "false");
  assert.equal(ids.btnInicio.disabled, false);
});
