const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const state = fs.readFileSync(path.join(root, "game/public/players/js/state.js"), "utf8");
const css = fs.readFileSync(path.join(root, "game/public/players/css/publico.css"), "utf8");

test("the first muse detonator gets a dedicated one-shot entrance", () => {
  assert.match(state, /const primerDetonador = Boolean\([\s\S]*solicitudActiva[\s\S]*solicitudAnterior === "ninguna"/);
  assert.match(state, /else if \(primerDetonador\) \{[\s\S]*animarPrimerDetonadorCalentamiento\(\)/);
  assert.match(state, /setTimeout\(\(\) => \{[\s\S]*classList\.remove\("calentamiento-primer-detonador"\)[\s\S]*1450/);
  assert.match(css, /calentamiento-primer-detonador::before[\s\S]*primerDetonadorAura/);
  assert.match(css, /calentamiento-primer-detonador::after[\s\S]*primerDetonadorOnda/);
  assert.match(css, /calentamiento-primer-detonador > \*[\s\S]*primerDetonadorContenido/);
});
