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

  assert.match(html, /class="textarea-container escritxr-texto-panel"/);
  assert.match(html, /class="escritxr-texto-panel__label"[\s\S]*TEXTO/);
  assert.match(html, /id="texto"[\s\S]*role="textbox"[\s\S]*aria-multiline="true"/);
  assert.match(css, /body\.page-players\.partida-activa \.escritxr-texto-panel \{[\s\S]*border:[\s\S]*border-radius:[\s\S]*background:[\s\S]*box-shadow:/);
  assert.match(css, /body\.page-players\.equipo-rojo \{[\s\S]*--escritxr-panel-accent:/);
  assert.match(css, /\.escritxr-texto-panel__label \{[\s\S]*border-left:[\s\S]*background:/);
  assert.match(css, /body\.page-players\.partida-activa \.escritxr-texto-panel \.textarea \{[\s\S]*overflow-y: auto;[\s\S]*background:[\s\S]*color:/);
  assert.match(css, /\.escritxr-texto-panel:focus-within/);
});
