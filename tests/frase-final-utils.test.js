const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizarFraseFinal,
  normalizarTextoCierreFraseFinal,
  detectarFraseFinalCompletada
} = require("../game/js/frase-final-utils.js");

test("normalizarFraseFinal trims surrounding guillemets and quotes", () => {
  assert.equal(normalizarFraseFinal('  «"Hola mundo"»  '), "Hola mundo");
  assert.equal(normalizarFraseFinal(' “Adios” '), "Adios");
});

test("normalizarTextoCierreFraseFinal lowercases normalized final phrases", () => {
  assert.equal(normalizarTextoCierreFraseFinal('  «Frase Final»  '), "frase final");
});

test("detectarFraseFinalCompletada only matches when the target is at the end", () => {
  assert.equal(detectarFraseFinalCompletada("algo frase final", "frase final"), true);
  assert.equal(detectarFraseFinalCompletada("frase final algo", "frase final"), false);
  assert.equal(detectarFraseFinalCompletada("cualquier texto", ""), false);
});
