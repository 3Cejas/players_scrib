const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("instructions view exposes the complete guided sequence", () => {
  const instructions = require("../game/js/domains/instructions.js");

  assert.equal(instructions.STEP_COUNT, 7);
  assert.equal(instructions.normalizeStep(-4), 0);
  assert.equal(instructions.normalizeStep(4.9), 4);
  assert.equal(instructions.normalizeStep(99), 6);
});

test("instructions mirror the real writing, Muse and inspiration interfaces", () => {
  const instructions = require("../game/js/domains/instructions.js");
  const classes = new Set();
  const container = {
    hidden: true,
    dataset: {},
    innerHTML: "",
    offsetWidth: 0,
    setAttribute() {},
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name))
    }
  };
  const view = instructions.create({ container });

  view.setState({ visible: true, step: 3, perspective: "muse", team: 1 });
  assert.match(container.innerHTML, /<h2>OCUPAD VUESTRO<br>LUGAR<\/h2>/);
  assert.doesNotMatch(container.innerHTML, /AL OTRO LADO|DEL VELO/);

  view.setState({ step: 4 });
  assert.match(container.innerHTML, /data-full-text="La historia empieza a cobrar vida"/);
  assert.match(container.innerHTML, /ESCRIBIENDO ↑/);
  assert.match(container.innerHTML, /SIN ESCRIBIR ↓/);

  view.setState({ step: 5 });
  assert.match(container.innerHTML, /ENVÍA PALABRAS\.<br>INSPIRA A TU ESCRITORA\./);
  assert.doesNotMatch(container.innerHTML, /ENVÍA UNA LETRA/);
  assert.match(container.innerHTML, /id="scrib_instructions_word"[^>]*disabled/);
  assert.match(container.innerHTML, /<button type="button" disabled>INSPIRAR/);
  assert.doesNotMatch(container.innerHTML, /VOLCÁN|SE ACTIVARÁ DURANTE LA PARTIDA|TUS PALABRAS PUEDEN CAMBIAR LA PARTIDA/);
  assert.doesNotMatch(container.innerHTML, /scrib-instructions__idea-preview/);
  assert.doesNotMatch(container.innerHTML, /SLIDES? POR VER/);
  assert.doesNotMatch(container.innerHTML, /scrib-instructions__progress-dots/);

  view.setState({ step: 6 });
  assert.match(container.innerHTML, /scrib-instructions__score-segment--blue/);
  assert.match(container.innerHTML, /scrib-instructions__score-segment--red/);
  assert.match(container.innerHTML, /scrib-instructions__score-center/);
  assert.doesNotMatch(container.innerHTML, /LA VICTORIA ESTÁ EN VUESTRAS MANOS/);
  assert.doesNotMatch(container.innerHTML, /SLIDES? POR VER/);
  assert.doesNotMatch(container.innerHTML, /scrib-instructions__progress-dots/);

  const css = read("game/css/instructions.css");
  assert.match(css, /@keyframes instructions-score-blue[\s\S]*width:\s*72%/);
  assert.match(css, /@keyframes instructions-score-red[\s\S]*width:\s*64%/);
  assert.doesNotMatch(css, /instructions-word-to-writer/);
});

test("control, spectator and muse load the instructions experience", () => {
  const control = read("game/control/index.html");
  const controlActions = read("game/control/js/actions.js");
  const controlCss = read("game/control/index.css");
  const spectator = read("game/spectator/index.html");
  const muse = read("game/public/players/index.html");
  const spectatorState = read("game/spectator/js/state.js");
  const museState = read("game/public/players/js/state.js");

  assert.match(control, /id="boton_vista_instrucciones"[^>]*>[^<]*INSTRUCCIONES/);
  assert.match(control, /id="instrucciones_nav_control"/);
  assert.match(spectator, /instructions\.css/);
  assert.match(spectator, /instructions\.js/);
  assert.match(muse, /instructions\.css/);
  assert.match(muse, /instructions\.js/);
  assert.match(spectatorState, /ScribInstructions\.create/);
  assert.match(museState, /ScribInstructions\.create/);
  assert.match(spectatorState, /featureMusicUrl: "\.\.\/audio\/neosignal-planet-online\.mp3"/);
  assert.doesNotMatch(museState, /createAudioController/);
  assert.match(read("game/js/domains/instructions.js"), /scrib:view-feature-music/);
  assert.match(read("game/js/domains/instructions.js"), /state\.step === 1 \|\| state\.step === 2/);
  assert.match(control, /id="boton_vista_instrucciones"[^>]*>\s*&#x1F4D6; INSTRUCCIONES<\/button>/);
  assert.match(control, /id="instrucciones_nav_control"[^>]*data-visible="0"[^>]*aria-hidden="true"[^>]*inert/);
  assert.match(controlActions, /botonInstrucciones\.textContent = "\\u\{1F4D6\} INSTRUCCIONES"/);
  assert.match(controlActions, /instruccionesNav\.dataset\.visible = instruccionesActivas \? "1" : "0"/);
  assert.match(controlActions, /instruccionesNav\.inert = !instruccionesActivas/);
  assert.match(controlCss, /instrucciones-nav-control\[data-visible="0"\][\s\S]*opacity:\s*0;[\s\S]*visibility:\s*hidden/);
  assert.match(controlActions, /"OCUPAD VUESTRO LUGAR"/);
  assert.doesNotMatch(controlActions, /"ESCRITORAS AL OTRO LADO"/);
});

test("control keeps the detonator flag in Tutorial instead of Detonators", () => {
  const control = read("game/control/index.html");
  const tutorialStart = control.indexOf('id="control_panel_tutorial"');
  const detonatorsStart = control.indexOf('id="control_panel_detonadores"');
  const gameStart = control.indexOf('id="control_panel_juego"');
  const tutorialPanel = control.slice(tutorialStart, detonatorsStart);
  const detonatorsPanel = control.slice(detonatorsStart, gameStart);

  assert.match(tutorialPanel, /id="boton_banderas_musas"/);
  assert.doesNotMatch(detonatorsPanel, /id="boton_banderas_musas"/);
});

test("detonator presentation highlights only the active request and centers an idle muse flag", () => {
  const spectator = read("game/spectator/index.html");
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorCss = read("game/css/dashboard-players.css");
  const museState = read("game/public/players/js/state.js");
  const museCss = read("game/public/players/css/publico.css");

  assert.match(spectator, />DETONADORES</);
  assert.doesNotMatch(spectator, /DETONADOR ACTUAL/);
  assert.match(spectatorState, /classList\.toggle\([\s\S]*"is-active",[\s\S]*solicitud_calentamiento_espectador !== "ninguna"[\s\S]*entrada\.tipo === solicitud_calentamiento_espectador/);
  assert.match(spectatorCss, /\.detonador-historial-item\.is-active/);
  assert.match(museState, /musa-bandera-detonador-en-espera/);
  assert.match(museCss, /\.musa-bandera-detonador-en-espera[^}]+top: 50% !important;[^}]+left: 50% !important;/);
});
