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

test("muse authorship accepts both server field names and normalizes hostile Unicode", () => {
  const inspiration = cargarDominioInspiracion();

  assert.deepEqual(
    Array.from(inspiration.extraerAutoresMusa({ nombre_musa: "  Lu\u200Bna  " })),
    ["LUNA"]
  );
  assert.deepEqual(
    Array.from(inspiration.extraerAutoresMusa({ musa_nombre: "Sol" })),
    ["SOL"]
  );
  assert.equal(
    inspiration.normalizarNombreAutorMusa("<img src=x onerror=alert(1)>", 24),
    "<IMG SRC=X ONERROR=ALERT"
  );
});

test("multiple muses are deduplicated and compacted without losing the full title", () => {
  const inspiration = cargarDominioInspiracion();
  const firma = inspiration.normalizarFirmaMusa({
    superbonus: {
      musas: ["Luna", " luna ", "Sol", "Mar"]
    }
  });

  assert.deepEqual(Array.from(firma.autores), ["LUNA", "SOL", "MAR"]);
  assert.equal(firma.texto, "LUNA +2");
  assert.equal(firma.completo, "LUNA + SOL + MAR");
  assert.deepEqual(
    Array.from(inspiration.extraerAutoresMusa({}, { fallback: false })),
    []
  );
});

test("tutorial and final renderers preserve authors and insert names as text nodes", () => {
  const writer = read("game/players/js/state.js");
  const spectator = read("game/spectator/js/state.js");
  const publicMuse = read("game/public/players/js/state.js");

  [writer, spectator, publicMuse].forEach((source) => {
    assert.match(source, /entrada\.musa_nombre \?\? entrada\.nombre_musa/);
    assert.match(source, /inspiration-author--final/);
    assert.match(source, /nombre\.textContent = firma\.texto/);
  });
  assert.match(writer, /palabraTexto\.textContent = entrada\.palabra/);
  assert.match(spectator, /palabraTexto\.textContent = entrada\.palabra/);
  assert.doesNotMatch(publicMuse, /calentamiento_final_musa\.innerHTML\s*=/);
});

test("main writer and spectator views escape HTML authors and show the compact signature", () => {
  const writerState = read("game/players/js/state.js");
  const writerEvents = read("game/players/js/socket-events.js");
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorEvents = read("game/spectator/js/socket-events.js");

  assert.match(writerState, /escapeHtml\(firma\.texto\)/);
  assert.match(spectatorState, /escapeHtml\(firma\.texto\)/);
  assert.match(writerEvents, /construirFirmaMusaHtmlEscritora\(data/);
  assert.match(spectatorEvents, /construirFirmaMusaHtmlEspectador\(data/);
  assert.doesNotMatch(writerEvents, /<span style='color: orange;'>\$\{musaLabel\}/);
  assert.doesNotMatch(spectatorEvents, /<span style="color:lime;">\$\{musaLabel\}/);
});

test("word clouds use signature-aware rectangular packing and retain unrendered state", () => {
  const spectator = read("game/spectator/js/state.js");
  const css = read("game/css/dashboard-players.css");

  assert.match(spectator, /const medirCajaNubeInspiracion/);
  assert.match(spectator, /Math\.abs\(ocupada\.cx - cx\)/);
  assert.match(spectator, /Math\.abs\(ocupada\.cy - cy\)/);
  assert.match(spectator, /if \(!pos\) return/);
  assert.match(spectator, /capacidadPorEquipo/);
  assert.doesNotMatch(spectator, /palabras_nube_inspiracion\.clear\(\)/);
  assert.match(css, /\.inspiration-author__name[\s\S]*text-overflow: ellipsis/);
  assert.match(css, /\.nube-inspiracion-palabra[\s\S]*max-width: var\(--nube-item-max-width/);
});

test("spectator reconnection snapshots rebuild queued authors from palabras_info", () => {
  const spectator = read("game/spectator/js/state.js");

  assert.match(
    spectator,
    /const sincronizarNubeDesdeSnapshot[\s\S]*equipoData\.palabras_info[\s\S]*actualizarMetadataPalabraNube/
  );
  assert.match(
    spectator,
    /const normalizarInfoPalabraNubeEspectador[\s\S]*valor\.musa_nombre \?\? valor\.nombre_musa/
  );
  assert.match(
    spectator,
    /registro\.musas = normalizarFirmaMusaEspectador/
  );
});

test("tutorial packing reserves highlighted scale and may skip a box instead of overlapping", () => {
  const writer = read("game/players/js/state.js");
  const spectator = read("game/spectator/js/state.js");

  [writer, spectator].forEach((source) => {
    assert.match(source, /factorReserva[\s\S]{0,180}1\.34/);
    assert.match(source, /if \(!posicion/);
    assert.match(source, /slice\(0, 80\)/);
  });
});
