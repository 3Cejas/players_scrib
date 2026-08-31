const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { normalizeCommand } = require("../js/command-normalizer.js");

const ROOT = path.join(__dirname, "..");

test("every accented site command has the same key without accents", () => {
  const variants = [
    ["espectáculo", "espectaculo"],
    ["compañía", "compania"],
    ["artículos", "articulos"],
    ["clasificación", "clasificacion"],
    ["financiación", "financiacion"],
    ["ángela bueno", "angela bueno"],
    ["david viñas", "david vinas"],
    ["imágenes", "imagenes"],
    ["vídeos", "videos"]
  ];

  for (const [accented, plain] of variants) {
    assert.equal(normalizeCommand(accented), plain);
    assert.equal(normalizeCommand(accented), normalizeCommand(plain));
  }
});

test("site command keys ignore case, surrounding space and repeated whitespace", () => {
  assert.equal(normalizeCommand("  ÁNGELA    BUENO  "), "angela bueno");
  assert.equal(normalizeCommand("TEXTOS   DEL MES"), "textos del mes");
  assert.equal(normalizeCommand(null), "");
});

test("the public terminal normalizes typed, quick-link and history commands", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const source = fs.readFileSync(path.join(ROOT, "js/main.js"), "utf8");

  assert.match(html, /command-normalizer\.js\?n=1[\s\S]*main\.js\?n=67/);
  assert.match(source, /handleDirectNavigation = function \(command\)[\s\S]*var normalizedCommand = commandKey\(command\);/);
  assert.match(source, /executeTerminalCommand = function \(command, options\)[\s\S]*var normalizedCommand = commandKey\(command\);/);
  assert.match(source, /handleCmd = function \(\)[\s\S]*var cmdComponents = commandKey\(this\.cmdLine\.value\);/);
  assert.doesNotMatch(source, /normalizedCommand === "(?:imÃ¡genes|vÃ­deos)"/);
});
