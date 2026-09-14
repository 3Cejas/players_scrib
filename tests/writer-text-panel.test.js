const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

test("writer editor uses the same framed team panel language as control and muse", () => {
  const html = read("game/players/index.html");
  const css = read("game/css/dashboard-players.css");
  const state = read("game/players/js/state.js");

  assert.match(html, /class="textarea-container escritxr-texto-panel"/);
  assert.match(html, /class="escritxr-texto-panel__label"[\s\S]*id="nombre"/);
  assert.doesNotMatch(html, /class="escritxr-texto-panel__label"[^>]*>[\s\S]{0,120}\bTEXTO\b/);
  assert.match(html, /class="escritxr-texto-panel__viewport"[\s\S]*id="escritxr_texto_lineas"[\s\S]*id="escritxr_texto_lineas_inner"[\s\S]*id="texto"[\s\S]*role="textbox"[\s\S]*aria-multiline="true"/);
  assert.match(html, /id="texto"[\s\S]*id="metadatos"[\s\S]*id="puntos"[\s\S]*id="musas"/);
  assert.match(css, /body\.page-players\.partida-activa \.escritxr-texto-panel \{[\s\S]*border:[\s\S]*border-radius:[\s\S]*background:[\s\S]*box-shadow:/);
  assert.match(css, /body\.page-players\.equipo-rojo \{[\s\S]*--escritxr-panel-accent:/);
  assert.match(css, /\.escritxr-texto-panel__label \{[\s\S]*border-left:[\s\S]*background:/);
  assert.match(css, /\.escritxr-texto-panel__viewport \{[\s\S]*grid-template-columns:/);
  assert.match(css, /\.escritxr-texto-lineas \{[\s\S]*border-right:/);
  assert.match(css, /body\.page-players\.partida-activa \.escritxr-texto-panel \.textarea \{[\s\S]*overflow-y: auto;[\s\S]*background:[\s\S]*color:/);
  assert.match(css, /\.escritxr-texto-panel:focus-within/);
  assert.match(state, /function sincronizarLineasTextoEscritora\(\)/);
  assert.match(state, /function medirAlturasLineasTextoEscritora\(lineas\)/);
  assert.match(state, /translate3d\(0, -\$\{Math\.max\(0, texto\.scrollTop\)\}px, 0\)/);
  assert.match(state, /window\.addEventListener\("resize", programarLineasTextoEscritora/);
  assert.match(state, /document\.addEventListener\("fullscreenchange"/);
  assert.match(state, /new ResizeObserver\(programarLineasTextoEscritora\)/);
  assert.match(state, /new MutationObserver\(programarLineasTextoEscritora\)/);
  assert.match(state, /caretFueraDelEditor[\s\S]*rect\.bottom < editorRect\.top[\s\S]*ocultarCaretNeonJuegoEscritora\(\)/);
});
