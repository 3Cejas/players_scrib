const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizarFraseFinal,
  normalizarTextoCierreFraseFinal,
  detectarFraseFinalCompletada
} = require("../game/js/frase-final-utils.js");

test("normalizarFraseFinal trims surrounding guillemets and quotes", () => {
  assert.equal(normalizarFraseFinal('  \u00ab"Hola mundo"\u00bb  '), "Hola mundo");
  assert.equal(normalizarFraseFinal(' "Adios" '), "Adios");
});

test("normalizarTextoCierreFraseFinal lowercases normalized final phrases", () => {
  assert.equal(normalizarTextoCierreFraseFinal("  \u00abFrase Final\u00bb  "), "frase final");
  assert.equal(normalizarTextoCierreFraseFinal("\tCIERRE   FINAL\n"), "cierre   final");
});

test("detectarFraseFinalCompletada only matches when the target is at the end", () => {
  assert.equal(detectarFraseFinalCompletada("algo frase final", "frase final"), true);
  assert.equal(detectarFraseFinalCompletada('algo "frase final"', "\u00abfrase final\u00bb"), true);
  assert.equal(detectarFraseFinalCompletada("frase final algo", "frase final"), false);
  assert.equal(detectarFraseFinalCompletada("algo frase final.", "frase final"), false);
  assert.equal(detectarFraseFinalCompletada("cualquier texto", ""), false);
});
