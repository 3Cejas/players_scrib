const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const competition = require("../game/js/domains/competition.js");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("la barra bilateral parte del centro y se desplaza hacia quien lidera", () => {
  assert.equal(competition.posicionMarcador(0, 0), 50);
  assert.ok(competition.posicionMarcador(10, 2) > 50);
  assert.ok(competition.posicionMarcador(2, 10) < 50);
  assert.ok(competition.posicionMarcador(9.95, 2) < competition.posicionMarcador(10, 2));
  assert.equal(competition.formatearTiempo(125), "02:05");
});

test("el HUD usa marcador numerico, reloj global y animaciones sin porcentajes", () => {
  const js = read("game/js/domains/competition.js");
  const writer = read("game/players/index.html");
  const control = read("game/control/index.html");
  const spectator = read("game/spectator/index.html");

  assert.match(js, /competicion_ronda_estado/);
  assert.match(js, /reloj_partida_estado/);
  assert.match(js, /CAMBIO DE VENTAJA/);
  assert.match(js, /¡LA DESVENTAJA CAMBIA!/);
  assert.match(js, /scrib-competition-change__route/);
  assert.match(js, /DURACION_AVISO_CAMBIO_MS = 5600/);
  assert.match(js, /animation:scribLeaderChange 5\.6s/);
  assert.match(js, /scrib-competition-change-active/);
  assert.match(js, /scrib-competition-fly/);
  assert.match(js, /scrib-competition-burst/);
  assert.match(js, /scribCompetitionShift/);
  assert.match(js, /scribCompetitionCross/);
  assert.match(js, /numero\(payload\.delta\)} 🎨/);
  assert.match(js, /payload\.animar !== false/);
  assert.match(js, /page-spectator:not\(\.vista-partida\)[^}]+display:none!important/);
  assert.match(js, /page-players:not\(\.partida-activa\)[^}]+display:none!important/);
  assert.match(js, /page-players\.ocultar-marcador-escritora[^}]+display:none!important/);
  assert.doesNotMatch(js, /ui\.scores\[[^\]]+\]\.textContent\s*=\s*[^;\n]*%/);
  [writer, control, spectator].forEach((html) => {
    assert.match(html, /domains\/competition\.js/);
  });
});

test("Espectador mantiene el marcador arriba y reserva sitio para ambos nombres", () => {
  const js = read("game/js/domains/competition.js");
  const html = read("game/spectator/index.html");
  const sockets = read("game/spectator/js/socket-events.js");

  assert.match(js, /data-role="spectator"\]\{top:clamp\(8px,1\.4vh,18px\)/);
  assert.match(js, /vista-partida #contenedor_espectador\{[^}]*padding-top:clamp\(174px,21vh,224px\)/);
  assert.match(js, /#contenedor_espectador \.nombre\{[^}]*visibility:visible/);
  assert.match(html, /value="ESCRITXR 1"[^>]*id="nombre"/);
  assert.match(html, /value="ESCRITXR 2"[^>]*id="nombre1"/);
  assert.match(sockets, /trim\(\) \|\| "ESCRITXR 1"/);
  assert.match(sockets, /trim\(\) \|\| "ESCRITXR 2"/);
});

test("la batalla se sustituye por el aviso de votacion y la escritura reproduce su FX", () => {
  const js = read("game/js/domains/competition.js");
  const css = read("game/css/dashboard-players.css");

  assert.match(js, /socket\.on\("votacion_ventaja_estado", actualizarVotacion\)/);
  assert.match(js, /data-voting="1"\] \.scrib-competition-scoreline/);
  assert.match(js, /data-battle="0"\] \.scrib-competition-scoreline/);
  assert.match(js, /estado\.fase === "batalla"/);
  assert.match(js, /estado\.batalla_activa !== false/);
  assert.match(js, /modo === "tertulia" \|\| modo === "frase final"/);
  assert.match(js, /ui\.root\.dataset\.battle = batallaActiva \? "1" : "0"/);
  assert.match(js, /LAS MUSAS DEL EQUIPO <strong>\$\{nombreEquipo\}<\/strong> EST&Aacute;N VOTANDO/);
  assert.match(js, /String\(equipoRaw \|\| ""\)\.trim\(\)\.toLowerCase\(\) === "j2"/);
  assert.match(js, /payload\.tipo !== "mini_inspiracion"/);
  assert.match(js, /rolActual !== "spectator"/);
  assert.match(js, /new Audio\("\.\.\/audio\/GANAR%202%20SEG\.mp3"\)/);
  assert.match(css, /#feedback_tiempo_flotante_root[^}]+z-index:\s*2147483300/);
});

test("Control integra un HUD compacto donde antes aparecía la duración de la desventaja", () => {
  const js = read("game/js/domains/competition.js");
  const html = read("game/control/index.html");
  const actions = read("game/control/js/actions.js");

  assert.match(html, /id="control_competition_slot"/);
  assert.match(html, /control_desventaja_activa_time_j1[^>]+hidden/);
  assert.match(html, /control_desventaja_activa_time_j2[^>]+hidden/);
  assert.match(js, /data-role="control"[^}]+position:relative/);
  assert.match(js, /data-role="control"[^}]+scrib-competition-scoreline[^}]+display:grid/);
  assert.match(js, /grid-template-columns:minmax\(58px,max-content\) minmax\(0,1fr\) minmax\(58px,max-content\)/);
  assert.match(js, /data-role="control"\] \.scrib-competition-curse\{display:none\}/);
  assert.match(js, /control-competition-slot \+ \.level-status-witnesses \.level-status-witness--disadvantage\{display:none\}/);
  assert.match(js, /data-role="control"\] \.scrib-competition-streak\{display:none\}/);
  assert.match(js, /if \(!payload \|\| !ui \|\| rolActual === "control" \|\| !esHudVisibleEnVistaActual\(\)\) return;/);
  assert.doesNotMatch(actions, /Desventaja \$\{equipo\}\$\{detalle\}: \$\{formatearTiempoTestigoControl/);
});

test("Control muestra en el HUD qué equipo vota y las cuentas atrás de voto y desventaja", () => {
  const html = read("game/control/index.html");
  const css = read("game/control/index.css");
  const actions = read("game/control/js/actions.js");
  const sockets = read("game/control/js/socket-events.js");

  assert.match(html, /id="control_palabra_musa_j1_time"[^>]*hidden/);
  assert.match(html, /id="control_palabra_musa_j2_time"[^>]*hidden/);
  assert.match(actions, /const tiempoVisible = document\.getElementById\(`control_palabra_musa_j\$\{player\}_time`\)/);
  assert.match(actions, /tiempoVisible\.textContent = activo \? formatearTiempoTestigoControl\(restanteMs\) : ""/);
  assert.match(actions, /etiquetaEl\.textContent = `VOTA EQUIPO \$\{nombreEquipo\}`/);
  assert.match(actions, /testigo\.dataset\.voting = "1"/);
  assert.match(actions, /--witness-text-shift/);
  assert.match(sockets, /socket\.on\('votacion_ventaja_estado'[^]*sincronizarVotacionDesventajaControl\(payload\)/);
  assert.match(css, /@keyframes levelWitnessTextSweepControl[^]*translateX\(var\(--witness-text-shift/);
  assert.match(css, /level-status-witness--disadvantage-slot\[data-voting="1"\]/);
});

test("Control coloca Nube junto a Vista partida y Skip tertulia junto a Stats", () => {
  const html = read("game/control/index.html");
  const css = read("game/control/index.css");
  const actions = read("game/control/js/actions.js");
  const panel = html.slice(html.indexOf('id="control_panel_juego"'), html.indexOf('id="control_panel_representacion"'));

  assert.ok(panel.indexOf('id="boton_vista_partida"') < panel.indexOf('id="boton_vista_nube_inspiracion"'));
  assert.ok(panel.indexOf('id="boton_vista_nube_inspiracion"') < panel.indexOf('id="boton_vista_stats"'));
  assert.ok(panel.indexOf('id="boton_vista_stats"') < panel.indexOf('id="boton_skip_tertulia"'));
  assert.match(html, /id="boton_fin_partida" class="btn btn-game-end"/);
  assert.match(css, /#boton_vista_nube_inspiracion,[^]*#boton_skip_tertulia\.is-visible\s*\{\s*grid-column: 2(?: !important)?;/);
  assert.match(css, /#boton_fin_partida\.btn-game-end[^]*font-family: "Retro-gaming"/);
  assert.match(html, /id="boton_skip_tertulia"[^>]*>[^<]*CONTINUAR PARTIDA/);
  assert.match(actions, /boton\.setAttribute\("aria-busy", "true"\)/);
});

test("Espectador mantiene una sola desventaja visual y limpia el efecto anterior", () => {
  const state = read("game/spectator/js/state.js");
  const sockets = read("game/spectator/js/socket-events.js");

  assert.match(state, /function limpiarDesventajasVisualesEspectador\(\)[\s\S]*limpiarVisualPutadasEspectador\(\)/);
  assert.match(state, /const rival = id === 1 \? 2 : 1;[\s\S]*limpiarVisualPutadaEspectador\(rival, \{ limpiarEfecto: true \}\)/);
  assert.match(sockets, /socket\.on\("desventaja_ronda_limpiar", \(\) => \{\s*limpiarDesventajasVisualesEspectador\(\);/);
});

test("Escritxr ve el calentamiento previo abajo como presentación de nivel y con progreso", () => {
  const js = read("game/js/domains/competition.js");
  assert.match(js, /socket\.on\("calentamiento_previo_estado", actualizarCalentamiento\)/);
  assert.match(js, /data-role="writer"\]\[data-warmup="1"\][^}]+scrib-competition-warmup\{display:flex\}/);
  assert.match(js, /data-role="writer"\]\[data-warmup="1"\]\{top:auto;bottom:/);
  assert.match(js, /scrib-competition-warmup__fill/);
  assert.match(js, /--warmup-progress/);
  assert.match(js, /\(\(duracionMs - restante \* 1000\) \/ duracionMs\) \* 100/);
  assert.match(js, /ui\.warmupTime\.textContent = formatearTiempo\(restante\)/);
});

test("Escritxr oculta los rótulos del nivel, usa el emoji y centra las partículas en el destino real", () => {
  const js = read("game/js/domains/competition.js");
  const css = read("game/css/dashboard-players.css");
  const actions = read("game/players/js/actions.js");

  assert.match(js, /data-role="writer"\] \.scrib-competition-mode/);
  assert.match(js, /destino\.left \+ destino\.width \/ 2 - mitadTokenX/);
  assert.match(js, /spectator: player === 1 \? \["#texto1"/);
  assert.match(js, /requestAnimationFrame\(\(\) => token\.classList\.add\("is-flying"\)\)/);
  assert.match(css, /partida-intro-escritora #logo[\s\S]*display: none !important/);
  assert.match(css, /page-players\.partida-activa #contenedor[\s\S]*padding-top/);
  assert.match(css, /page-players\.partida-activa #nombre[\s\S]*text-shadow/);
  assert.match(js, /cambioFormateado[\s\S]*numero\(payload\.delta\)[\s\S]*🎨/);
  assert.match(js, /Number\(payload\.delta\) < 0 \? "#ff4d67" : "#62ff9d"/);
  assert.doesNotMatch(actions, /mostrarFeedbackTiempoEscritora\(tiempo_feed, "borrar"/);
  assert.doesNotMatch(actions, /-0\.05 insp\./);
});

test("Escritxr uses team-colored backgrounds and game audio is spectator-only", () => {
  const css = read("game/css/dashboard-players.css");
  const state = read("game/players/js/state.js");
  const competition = read("game/js/domains/competition.js");
  assert.match(css, /body\.page-players\.equipo-azul\s*\{[\s\S]*linear-gradient/);
  assert.match(css, /body\.page-players\.equipo-rojo\s*\{[\s\S]*linear-gradient/);
  assert.doesNotMatch(state, /new Audio\(/);
  assert.doesNotMatch(state, /reproducirSonidoFeedbackInspiracionEscritora/);
  assert.match(competition, /if \(rolActual !== "spectator"\) return;/);
  assert.doesNotMatch(competition, /rolActual === "writer"[\s\S]{0,180}sonidoPunto/);
});

test("Frase final keeps only the global clock and removes inspiration scoring", () => {
  const competition = read("game/js/domains/competition.js");
  const writerState = read("game/players/js/state.js");
  const writerEvents = read("game/players/js/socket-events.js");
  const museEvents = read("game/public/players/js/socket-events.js");

  assert.match(competition, /data-final="1"[^}]+scrib-competition-scoreline/);
  assert.match(competition, /data-role="control"\]\[data-final="1"\]\{display:none\}/);
  assert.match(writerState, /tipo === "frase-final"\s*\? null/);
  assert.match(writerEvents, /actualizarFraseFinalDesdePayloadEscritora\(data\)/);
  assert.match(museEvents, /juego\.modo_actual === "frase final"/);
  assert.match(museEvents, /modo_actual = siguiente_modo;\s*window\.__scribModoActualMusaPreview = modo_actual;/);
});

test("Frase final highlights without mutating the contenteditable or stealing Enter", () => {
  const writerState = read("game/players/js/state.js");
  const writerEvents = read("game/players/js/socket-events.js");
  const css = read("game/css/dashboard-players.css");
  const inicioProgreso = writerState.indexOf("function actualizarProgresoFraseFinal()");
  const finProgreso = writerState.indexOf("const VIDA_MAX_SEGUNDOS", inicioProgreso);
  const actualizadorProgreso = writerState.slice(inicioProgreso, finProgreso);

  assert.match(actualizadorProgreso, /CSS\.highlights\.set\(HIGHLIGHT_PROGRESO_FRASE_FINAL, new Highlight\(rango\)\)/);
  assert.doesNotMatch(actualizadorProgreso, /rango\.surroundContents\(span\)/);
  assert.doesNotMatch(actualizadorProgreso, /rango\.extractContents\(\)/);
  assert.match(writerEvents, /texto\.addEventListener\("input", listener_modo\)/);
  assert.match(writerEvents, /detectarFraseFinalCompletada\(e\.target\.innerText, frase_final\)/);
  assert.match(css, /::highlight\(scrib-frase-final-progreso\)/);
  assert.match(css, /objetivo-chip--frase-final[\s\S]*--frase-final-progress/);
});
