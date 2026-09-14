const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("the secret tutorial command opens a hidden animated presentation", () => {
  const main = read("js/main.js");
  const netlify = read("netlify.toml");
  const primaryCommands = main.match(/var primaryCommands = \[([\s\S]*?)\];/);

  assert.match(main, /case "tutorial":\s*location\.href = "\.\/tutorial\/";\s*return true;/);
  assert.match(netlify, /from = "\/tutorial"[\s\S]*to = "\/tutorial\/"/);
  assert.ok(primaryCommands, "the visible command list should exist");
  assert.doesNotMatch(primaryCommands[1], /tutorial/i);
  assert.doesNotMatch(main.match(/welcome: "([\s\S]*?)",/)[1], /tutorial/i);
});

test("the show guide is manual, animated, silent and fits in thirty minutes", () => {
  const html = read("tutorial/index.html");
  const css = read("tutorial/tutorial.css");
  const js = read("tutorial/tutorial.js");
  const slideMinutes = [...html.matchAll(/data-minutes="([\d.]+)"/g)].map((match) => Number(match[1]));

  assert.equal((html.match(/<section class="slide/g) || []).length, 19);
  assert.ok(slideMinutes.reduce((sum, value) => sum + value, 0) <= 30);
  assert.match(html, /id="prev"[\s\S]*id="next"/);
  assert.match(js, /ArrowRight[\s\S]*ArrowLeft/);
  assert.match(js, /touchstart[\s\S]*touchend/);
  assert.match(js, /resetSlideAnimations/);
  assert.match(css, /\.slide\.is-active/);
  assert.match(css, /\.slide\.is-exiting-right/);
  assert.match(css, /\.deck\{[^}]*overflow:clip/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /<audio|<video/i);
  assert.doesNotMatch(js, /speechSynthesis|new Audio/i);
});

test("the guide covers the complete live workflow with a visual tutorial sample", () => {
  const html = read("tutorial/index.html");

  [
    "Videotutorial del público",
    "Narración de apertura",
    "Presentación de equipos",
    "Escribir mantiene viva la obra",
    "Una idea utilizada vale más",
    "Batalla, voto y desventaja",
    "Los intérpretes observan y preparan",
    "PREPARAD LA ESCENA",
    "Representación sincronizada",
    "Lo que mide el videojuego",
    "Lo que valora el jurado",
    "GANADOR",
    "FOTO",
    "CRÉDITOS",
    "Preguntas"
  ].forEach((copy) => assert.match(html, new RegExp(copy, "i")));

  assert.match(html, /scribshow-musa-qr\.svg/);
  assert.match(html, /tutorial-scene--1[\s\S]*tutorial-scene--4/);
  assert.match(html, /Producción[\s\S]*Ritmo[\s\S]*Riqueza léxica[\s\S]*Inspiración[\s\S]*Precisión[\s\S]*Pulsaciones/);
  assert.match(html, /Idea y mundo · Voz · Estructura · Riesgo · Cierre/);
  assert.match(html, /Inspiración útil · Escucha · Ritmo · Cooperación/);
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
