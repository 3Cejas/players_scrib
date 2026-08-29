const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function loadPersistentStateApplier() {
  const source = fs.readFileSync(path.join(ROOT, "game/control/js/actions.js"), "utf8");
  const start = source.indexOf("function aplicarEstadoPersistenteControl");
  const end = source.indexOf("window.aplicarEstadoPersistenteControl", start);
  assert.ok(start >= 0 && end > start);

  const nombre1 = { value: "ANA " };
  const nombre2 = { value: "ROSA" };
  const context = {
    aplicando_estado_control_persistente: false,
    borrar_texto_en_inicio_activo: false,
    PARAMETROS_CONTROL_PERSISTENTES: [],
    frase_final_j1: null,
    frase_final_j2: null,
    nombre1,
    nombre2,
    val_nombre1: "ANA ",
    val_nombre2: "ROSA",
    document: {
      activeElement: nombre1,
      getElementById: () => null,
      querySelectorAll: () => []
    },
    actualizarBotonBorrarTextoGuardadoControl() {}
  };
  vm.runInNewContext(`${source.slice(start, end)}\nthis.aplicar = aplicarEstadoPersistenteControl;`, context);
  return context;
}

test("control preserves a writer-name space while that field is being edited", () => {
  const context = loadPersistentStateApplier();

  context.aplicar({ nombres: { 1: "ANA", 2: "ROSA MARÍA" } });
  assert.equal(context.nombre1.value, "ANA ");
  assert.equal(context.nombre2.value, "ROSA MARÍA");

  context.document.activeElement = null;
  context.aplicar({ nombres: { 1: "ANA BUENO", 2: "ROSA MARÍA" } });
  assert.equal(context.nombre1.value, "ANA BUENO");
  assert.equal(context.val_nombre1, "ANA BUENO");
});
