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
  assert.match(writer, /calentamiento-final-chip__choice/);
  assert.match(writer, /calentamiento_estado_escritor\.hidden = Boolean\(finalEquipo\)/);
  assert.doesNotMatch(writer, /`Palabra final fijada: \$\{finalEquipo\.palabra\}\.\`/);
  assert.match(spectator, /palabraTexto\.textContent = entrada\.palabra/);
  assert.doesNotMatch(publicMuse, /calentamiento_final_musa\.innerHTML\s*=/);
});

test("main writer and spectator views escape HTML authors and show unified muse feedback", () => {
  const writerState = read("game/players/js/state.js");
  const writerEvents = read("game/players/js/socket-events.js");
  const spectatorState = read("game/spectator/js/state.js");
  const spectatorEvents = read("game/spectator/js/socket-events.js");

  assert.match(writerState, /escapeHtml\(firma\.texto\)/);
  assert.match(spectatorState, /escapeHtml\(firma\.texto\)/);
  assert.match(writerEvents, /construirSugerenciaMusaHtmlEscritora\(data/);
  assert.match(spectatorEvents, /construirSugerenciaMusaHtmlEspectador\(data/);
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
  });
  assert.match(writer, /seleccionarDetonadoresParaEscritora[\s\S]*calentamiento_palabras_escritor,[\s\S]*equipoEscritor,[\s\S]*80/);
  assert.match(spectator, /slice\(0, 80\)/);
});

test("the live muse screen keeps writer identity visible and boxes the writer text", () => {
  const html = read("game/public/players/index.html");
  const css = read("game/public/players/css/publico.css");
  const state = read("game/public/players/js/state.js");
  const actions = read("game/public/players/js/actions.js");
  const events = read("game/public/players/js/socket-events.js");

  assert.match(html, /id="musa_texto_card"[\s\S]*id="musa_escritxr_card"[\s\S]*id="nombre"/);
  assert.doesNotMatch(html, />TU ESCRITXR</);
  assert.match(html, /id="musa_texto_card"[\s\S]*id="metadatos"[\s\S]*id="musa_texto_lineas"[\s\S]*id="texto"[\s\S]*id="mostrar_texto"[\s\S]*id="btn_bandera"/);
  assert.doesNotMatch(html, /🏳️‍🌈/u);
  assert.doesNotMatch(actions, /🏳️‍🌈 BANDERA/u);
  assert.ok(html.indexOf('id="metadatos"') < html.indexOf('id="texto"'), "writer identity and metrics should form the text header");
  assert.ok(html.indexOf('id="texto"') < html.indexOf('id="metadatos_acciones"'), "text actions should stay attached to the writer text");
  assert.match(css, /\.musa-escritxr-card\s*\{[\s\S]*border:[\s\S]*background:[\s\S]*box-shadow:/);
  assert.match(css, /\.musa-texto-card\s*\{[\s\S]*border:[\s\S]*border-radius:[\s\S]*box-shadow:/);
  assert.match(css, /\.textarea\s*\{[\s\S]*color: var\(--equipo-color/);
  assert.match(css, /\.musa-texto-toggle\s*\{/);
  assert.match(css, /\.musa-texto-card__header\s*\{[\s\S]*grid-template-columns:/);
  assert.match(css, /\.musa-texto-card__actions\s*\{[\s\S]*grid-template-columns:/);
  assert.match(css, /body\.equipo-azul\s*\{[\s\S]*background:/);
  assert.match(css, /body\.equipo-rojo\s*\{[\s\S]*background:/);
  assert.match(css, /\.musa-texto-card\.is-morphing/);
  assert.match(css, /body:not\(\.partida-activa\)[^\n]+#musa_escritxr_card/);
  assert.match(state, /function sincronizarLineasTextoMusa\(\)/);
  assert.match(state, /new MutationObserver\(programarLineasTextoMusa\)/);
  assert.match(actions, /musa_texto_card/);
  assert.match(actions, /aria-expanded/);
  assert.match(actions, /function animarMorfologiaTextoMusa\(/);
  assert.match(actions, /texto1\.scrollTop = 0;[\s\S]*actualizarEstadoTextoCompleto\(boton, true\)/);
  assert.match(css, /\.musa-texto-card\.is-expanded \.musa-texto-card__viewport,[\s\S]*max-height: none;[\s\S]*overflow: visible;/);
  assert.match(css, /body\.partida-activa \.niveles,[\s\S]*margin-top: clamp\(4px, 1vh, 10px\)/);
  assert.match(html, /class="musa-tiempo-legacy"\s+aria-hidden="true"/);
  assert.match(css, /body\.partida-activa \.musa-tiempo-legacy,[\s\S]*display:\s*none\s*!important/);
  assert.match(state, /function establecerNombreEscritxrMusa\([\s\S]*nombre1\.setAttribute\("value", nombreResuelto\)/);
  assert.match(events, /socket\.on\(nombre, data => \{\s*establecerNombreEscritxrMusa/);
  assert.equal((events.match(/socket\.on\(nombre/g) || []).length, 1);
  assert.doesNotMatch(html, /musa-texto-toggle__label/);
  assert.match(html, /id="mostrar_texto"[\s\S]*aria-label="Desplegar texto completo"[\s\S]*musa-texto-toggle__chevron/);
  assert.match(css, /\.musa-texto-card > #mostrar_texto\s*\{[\s\S]*justify-content: center;[\s\S]*width: 100%/);
  assert.match(css, /body\.musa-bandera-disponible #metadatos_acciones\.musa-bandera-fab-wrap[\s\S]*position: fixed !important;[\s\S]*left:/);
  assert.match(actions, /BANDERA_DISPONIBLE_SESION/);
  assert.match(actions, /recordarDisponibilidadBanderaMusa\(activa\)/);
  assert.match(actions, /function mostrarBanderaAnimada\(overlay\)/);
  assert.match(actions, /function ocultarBanderaAnimada\(overlay\)/);
  assert.match(actions, /overlay\.classList\.add\('bandera-overlay--entrando'\)/);
  assert.match(actions, /overlay\.classList\.add\('bandera-overlay--saliendo'\)/);
  assert.match(css, /@keyframes musaBanderaEntrada/);
  assert.match(css, /@keyframes musaBanderaSalida/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(events, /typeof data === "string" \? data : null/);
});

test("muse team chrome follows the assigned team and transitions stay GPU friendly", () => {
  const css = read("game/public/players/css/publico.css");
  const state = read("game/public/players/js/state.js");

  assert.match(css, /body\.equipo-rojo \.musa-world-entry\s*,[\s\S]*--world-entry-accent:\s*#ff6262/);
  assert.match(css, /body\.equipo-rojo \.musa-world-entry__bar-fill\s*,[\s\S]*#ef2447/);
  assert.match(css, /\.musa-texto-card #metadatos\s*\{[\s\S]*var\(--equipo-color/);
  assert.match(css, /\.notificacion\s*\{[\s\S]*var\(--equipo-color/);
  assert.match(css, /#mostrar_texto::before,[\s\S]*#mostrar_texto::after/);
  assert.match(state, /coverMs: duracion_cobertura_vista_musa,[\s\S]*revealMs: duracion_revelado_vista_musa/);
  assert.match(state, /transicion_vista_musa_movil[\s\S]*\? 140 : 260[\s\S]*\? 220 : 440/);
});

test("a muse joining mid-match requests the live snapshot after authoritative registration", () => {
  const events = read("game/public/players/js/socket-events.js");

  assert.match(events, /ayuda_musa_controlador\.setRegistrationReady\(true\);[\s\S]*sincronizarPartidaMusaTrasRegistro\(\)/);
  assert.match(events, /function sincronizarPartidaMusaTrasRegistro\(\)[\s\S]*socket\.off\(texto_x, handler_recibir_texto_x\)[\s\S]*socket\.on\(texto_x, handler_recibir_texto_x\)/);
  assert.match(events, /socket\.emit\('pedir_texto', \{ musa: equipoTexto \}\);[\s\S]*socket\.emit\('pedir_estado_musa'\)/);
  assert.match(events, /setTimeout\(pedirSnapshot, 180\)/);
});

test("the advantage-change overlay never appears in Control", () => {
  const competition = read("game/js/domains/competition.js");
  assert.match(competition, /function animarCambioLider\(payload\) \{\s*if \(rolActual === "control" \|\| !esHudVisibleEnVistaActual\(\)\) return;/);
});

test("muse and actor timelines wrap around the current centered level", () => {
  const museHtml = read("game/public/players/index.html");
  const actorHtml = read("game/actors/source/index.html");
  const museEvents = read("game/public/players/js/socket-events.js");
  const actorEvents = read("game/actors/source/js/socket-events.js");

  [museHtml, actorHtml].forEach((html) => {
    const blessedWords = html.indexOf('data-modo="palabras bonus"');
    const blessedLetter = html.indexOf('data-modo="letra bendita"');
    assert.ok(blessedWords >= 0 && blessedWords < blessedLetter);
  });
  [museEvents, actorEvents].forEach((source) => {
    const reorder = source.match(/function aplicarOrdenCircular[\s\S]*?\n\}/)?.[0] || "";
    assert.match(reorder, /data-circular-clone/);
    assert.match(reorder, /cloneNode\(true\)/);
    assert.match(reorder, /offset === 0/);
    assert.match(source, /centroItem - \(nivelesScroll\.clientWidth \/ 2\)/);
  });

  const museCss = read("game/public/players/css/publico.css");
  const actorCss = read("game/actors/source/css/publico.css");
  [museCss, actorCss].forEach((css) => {
    assert.match(css, /\.nivel-item\[data-circular-clone="true"\]/);
    assert.doesNotMatch(css, /\.nivel-item\[data-modo="palabras bonus"\]\s*\{\s*order:/);
  });
});

test("detonator view names itself correctly on the muse screen", () => {
  const html = read("game/public/players/index.html");
  assert.match(html, /id="calentamiento"[\s\S]*class="calentamiento-titulo">DETONADORES</);
});
