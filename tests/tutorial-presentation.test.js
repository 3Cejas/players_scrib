const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("public presentation bookmarks redirect into the authenticated library", () => {
  const netlify = read("netlify.toml");
  for (const deck of ["tutorial","charla"]) {
    assert.ok(!fs.existsSync(path.join(root, deck)), "presentation assets must no longer be public");
    for (const route of ["/"+deck,"/"+deck+"/*"]) {
      assert.ok(netlify.includes('from = "'+route+'"\n  to = "https://sutura-gateway.ddns.net/scrib/#material/'+deck+'"\n  status = 302\n  force = true'));
    }
  }
  assert.doesNotMatch(read("js/main.js"), /case "tutorial":/);
  assert.ok(fs.existsSync(path.join(root,"game/media/tutorial-scrib-audio.mp3")), "the game's public tutorial audio must stay available");
});

test("the muse dashboard nests its level route and strips the translated flag emoji", () => {
  const html = read("game/public/players/index.html");
  const css = read("game/public/players/css/publico.css");
  const actions = read("game/public/players/js/actions.js");
  const card = html.slice(html.indexOf('id="musa_texto_card"'), html.indexOf('id="metadatos_acciones"'));

  assert.match(card, /id="mostrar_texto"[\s\S]*musa-texto-card__niveles[\s\S]*data-modo="palabras bonus"/);
  assert.doesNotMatch(html, /🏳️‍🌈/u);
  assert.match(actions, /\.replace\(\/\^🏳️‍🌈\\s\*\/u, ""\)/u);
  assert.match(css, /musa-texto-card > #mostrar_texto[\s\S]*overflow: visible/);
});
