const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const score = require("../game/js/domains/final-score.js");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const payloadCompleto = () => ({
    schema_version: 1,
    formula_version: "scrib-puntuacion-v1",
    disponible: true,
    datos_suficientes: true,
    calculado_en_ts: 123456,
    jugadores: {
        1: { id: 1, nombre: "EQUIPO AZUL", total: 56.25 },
        2: { id: 2, nombre: "EQUIPO ROJO", total: 43.75 }
    },
    categorias: [
        { id: "precision", peso: 20, unidad: "intentos", mejor: "menor", valores: { 1: 1, 2: 3 }, puntos: { 1: 13.33, 2: 6.67 }, ganador: 1, empate: false },
        { id: "bonus", peso: 20, unidad: "bonus", mejor: "mayor", valores: { 1: 4, 2: 2 }, puntos: { 1: 13.33, 2: 6.67 }, ganador: 1, empate: false },
        { id: "produccion", peso: 20, unidad: "palabras", mejor: "mayor", valores: { 1: 300, 2: 260 }, puntos: { 1: 10.71, 2: 9.29 }, ganador: 1, empate: false },
        { id: "pulsaciones", peso: 10, unidad: "pulsaciones", mejor: "mayor", valores: { 1: 4500, 2: 5500 }, puntos: { 1: 4.5, 2: 5.5 }, ganador: 2, empate: false },
        { id: "riqueza_lexica", peso: 15, unidad: "palabras unicas", mejor: "mayor", valores: { 1: 150, 2: 145 }, puntos: { 1: 7.63, 2: 7.37 }, ganador: 1, empate: false },
        { id: "ritmo", peso: 15, unidad: "ppm", mejor: "mayor", valores: { 1: 210, 2: 230 }, puntos: { 1: 7.16, 2: 7.84 }, ganador: 2, empate: false }
    ],
    ganador: 1,
    empate: false,
    diferencia: 12.5
});

test("final score normalizes the server contract into the fixed six-category order", () => {
    const estado = score.normalizarPayload(payloadCompleto());

    assert.equal(estado.disponible, true);
    assert.equal(estado.datosSuficientes, true);
    assert.deepEqual(estado.categorias.map((categoria) => categoria.id), score.CATEGORY_IDS);
    assert.equal(estado.jugadores[1].nombre, "EQUIPO AZUL");
    assert.equal(estado.jugadores[2].total, 43.75);
    assert.equal(estado.categorias[4].mejor, "menor");
    assert.equal(estado.ganador, 1);
    assert.equal(score.obtenerVista(estado, 0).tipo, "intro", "normalization should be idempotent for rendering");
});

test("final score exposes intro, six reveals and winner as steps 0..7", () => {
    const payload = payloadCompleto();

    assert.equal(score.MAX_STEP, 7);
    assert.equal(score.obtenerVista(payload, 0).tipo, "intro");
    for (let paso = 1; paso <= 6; paso += 1) {
        const vista = score.obtenerVista(payload, paso);
        assert.equal(vista.tipo, "categoria");
        assert.equal(vista.categoria.id, score.CATEGORY_IDS[paso - 1]);
    }
    assert.equal(score.obtenerVista(payload, 7).tipo, "final");
    assert.equal(score.obtenerVista(payload, 999).paso, 7);
    assert.equal(score.obtenerVista(payload, -20).paso, 0);
});

test("visual score signature ignores resync timestamps but changes with visible results", () => {
    const original = payloadCompleto();
    const resincronizado = { ...payloadCompleto(), calculado_en_ts: 999999 };
    const cambiado = payloadCompleto();
    cambiado.categorias[0].puntos = { 1: 9, 2: 11 };

    assert.equal(score.crearFirmaVista(original, 0), score.crearFirmaVista(resincronizado, 0));
    assert.notEqual(score.crearFirmaVista(original, 0), score.crearFirmaVista(cambiado, 0));
    assert.notEqual(score.crearFirmaVista(original, 0), score.crearFirmaVista(original, 1));
    assert.notEqual(score.crearFirmaVista(original, 1, 0), score.crearFirmaVista(original, 1, 1));
    assert.equal(score.normalizarFaseRevelado(-8), 0);
    assert.equal(score.normalizarFaseRevelado(99), 2);
});

test("final score differentiates a pending result from incomplete final telemetry", () => {
    const pendiente = score.obtenerVista({ disponible: false }, 0);
    const incompleto = score.obtenerVista({ ...payloadCompleto(), datos_suficientes: false }, 0);

    assert.equal(pendiente.tipo, "espera");
    assert.equal(incompleto.tipo, "insuficiente");
});

test("partial totals add only the categories already revealed", () => {
    const estado = score.normalizarPayload(payloadCompleto());

    assert.deepEqual(score.totalesParciales(estado, 0), { 1: 0, 2: 0 });
    assert.deepEqual(score.totalesParciales(estado, 1), { 1: 10.71, 2: 9.29 });
    assert.deepEqual(score.totalesParciales(estado, 2), { 1: 17.87, 2: 17.13 });
    assert.deepEqual(score.totalesParciales(estado, 99), { 1: 56.66, 2: 43.34 });
    assert.deepEqual(score.totalesDuranteRevelado(estado, 0, 0), { 1: 0, 2: 0 });
    assert.deepEqual(score.totalesDuranteRevelado(estado, 0, 1), { 1: 10.71, 2: 0 });
    assert.deepEqual(score.totalesDuranteRevelado(estado, 0, 2), { 1: 10.71, 2: 9.29 });
    assert.deepEqual(score.totalesDuranteRevelado(estado, 1, 1), { 1: 17.87, 2: 9.29 });
});

test("final comparison preserves and displays weighted inspiration decimals", () => {
    const payload = payloadCompleto();
    payload.formula_version = "scrib-puntuacion-v3";
    payload.categorias.find((categoria) => categoria.id === "bonus").valores = { 1: 1.75, 2: 0.5 };
    const vistaBonus = score.obtenerVista(payload, 4);
    const spectatorState = read("game/spectator/js/state.js");

    assert.equal(vistaBonus.categoria.id, "bonus");
    assert.deepEqual(vistaBonus.categoria.valores, { 1: 1.75, 2: 0.5 });
    assert.match(spectatorState, /formatearNumeroPuntuacionEspectador\(valor\)/);
    assert.match(spectatorState, /maximumFractionDigits:\s*Number\.isInteger\(seguro\) \? 0 : 2/);
});

test("control and spectator wire the final score protocol and accessible presentation", () => {
    const controlHtml = read("game/control/index.html");
    const controlCss = read("game/control/index.css");
    const controlActions = read("game/control/js/actions.js");
    const controlSockets = read("game/control/js/socket-events.js");
    const spectatorHtml = read("game/spectator/index.html");
    const spectatorState = read("game/spectator/js/state.js");
    const spectatorSockets = read("game/spectator/js/socket-events.js");
    const css = read("game/css/dashboard-players.css");
    const i18n = read("game/js/i18n.js");

    assert.doesNotMatch(controlHtml, /id="boton_vista_puntuacion"/);
    assert.match(controlHtml, /id="boton_resultado_videojuego"/);
    assert.match(controlHtml, /id="puntuacion_nav_prev"[^>]*stats-nav-button--prev/);
    assert.match(controlHtml, /id="puntuacion_nav_next"[^>]*stats-nav-button--next/);
    assert.doesNotMatch(controlHtml, /id="puntuacion_nav_(?:reset|hide)"/);
    assert.match(controlActions, /socket\.emit\("mostrar_puntuacion_final"/);
    assert.match(controlActions, /socket\.emit\("capturar_puntuacion_final"\)/);
    assert.match(controlActions, /if\s*\(terminado && terminado1\)/);
    assert.match(controlActions, /control\.score\.unavailable/);
    assert.match(controlSockets, /socket\.on\('puntuacion_final_estado'/);

    assert.match(spectatorHtml, /id="puntuacion_espectador"/);
    assert.match(spectatorHtml, /id="puntuacion_stage"[^>]*aria-live="polite"/);
    assert.match(spectatorHtml, /domains\/final-score\.js\?v=20260903e/);
    assert.match(spectatorSockets, /socket\.emit\('pedir_puntuacion_final'\)/);
    assert.match(spectatorSockets, /socket\.on\('puntuacion_final_estado'/);
    assert.match(spectatorState, /classList\.toggle\("vista-puntuacion", modo === "puntuacion"\)/);
    assert.match(spectatorState, /renderizarPuntuacionFinalEspectador\(\{ animar: true \}\)/);
    assert.doesNotMatch(spectatorState, /Mide rendimiento de juego; no valora la calidad literaria/);
    assert.match(spectatorState, /firma === puntuacion_firma_render_espectador[\s\S]*return/);
    assert.match(spectatorState, /const entrandoEnPuntuacion = modoPrevio !== "puntuacion"/);
    assert.match(spectatorState, /puntuacion_reveal_phase_remoto/);
    assert.doesNotMatch(spectatorState, /MARCADOR TOTAL/);
    assert.doesNotMatch(spectatorState, /MARCADOR PROVISIONAL/);
    assert.match(spectatorState, /class="puntuacion-categoria-misterio"[^>]*><strong>\?<\/strong>/);
    assert.match(spectatorState, /class="puntuacion-categoria-barra__puntos"/);
    assert.match(spectatorState, /transferirPuntosAlMarcadorEspectador/);
    assert.match(spectatorState, /data-total-player="1"/);
    assert.match(spectatorState, /data-total-player="2"/);
    assert.match(spectatorState, /data-total-player="1">[^<]+<\/span><small>PTS<\/small>/);
    assert.match(spectatorState, /vuelo\.textContent = `\+\$\{formatearNumeroPuntuacionEspectador\(puntos\)\} PTS`/);
    assert.doesNotMatch(spectatorState, /puntuacion-categoria-veredicto ganador-/);
    assert.match(spectatorState, /PUNTUACION_REVELADO_GANADOR_MS = 1540/);
    assert.match(spectatorState, /setTimeout\(\(\) => \{[\s\S]*mostrarGanadorCategoriaPuntuacionEspectador\(ganadorCategoria, true\)[\s\S]*PUNTUACION_REVELADO_GANADOR_MS/);
    assert.doesNotMatch(spectatorState, /fase >= 3/);
    assert.match(spectatorState, /reproducirVictoriaDeliberacionEspectador/);
    const renderPuntuacion = spectatorState.match(/const renderizarPuntuacionFinalEspectador[\s\S]*?\n};\n\nconst actualizarPuntuacionFinalEspectador/)?.[0] || "";
    assert.doesNotMatch(renderPuntuacion, /reproducirVictoriaDeliberacionEspectador/);
    assert.match(spectatorState, /DELIBERACION_VICTORIA_INICIO_SEGUNDOS = 22\.5/);
    assert.match(spectatorState, /deliberacion_victoria_espectador\.currentTime = DELIBERACION_VICTORIA_INICIO_SEGUNDOS/);
    assert.match(spectatorState, /reproducirVictoriaDeliberacionEspectador\(`final:/);
    assert.match(spectatorState, /totalesDuranteRevelado\(estado, vista\.indiceCategoria, fase\)/);
    assert.match(spectatorState, /if \(animar && cambioDeSlide\)/);
    assert.doesNotMatch(spectatorState, /puntuacion-categoria-equipo__numero|puntuacion-marcador-equipo__lado|GANA EL APARTADO/);
    assert.match(spectatorHtml, /deliberacion-syncopated-clock\.mp3\?v=20260903d/);
    assert.match(spectatorHtml, /deliberacion-latido\.wav/);
    assert.match(spectatorHtml, /deliberacion-victoria\.mp3/);
    const deliberacionAudio = fs.readFileSync(path.join(root, "game/audio/deliberacion-syncopated-clock.mp3"));
    assert.equal(deliberacionAudio.length, 700080);
    assert.equal(crypto.createHash("sha256").update(deliberacionAudio).digest("hex"), "07a0a03af709a017bcab09f9da36b4b356ae1f57c59069c98a55ac07673ddb19");

    assert.match(css, /body\.vista-puntuacion \.puntuacion-espectador/);
    assert.match(css, /@keyframes puntuacionPanelReveal/);
    assert.match(css, /\.puntuacion-categoria-barra\s*\{[\s\S]*align-items:\s*flex-end;[\s\S]*width:\s*clamp\(4\.8rem,/);
    assert.match(css, /\.puntuacion-categoria-barra__puntos\s*\{[\s\S]*transform:\s*translate\(-50%, 50%\);/);
    assert.match(css, /\.puntuacion-vs--categoria\s*\{[\s\S]*writing-mode:\s*horizontal-tb;/);
    assert.match(css, /@keyframes puntuacionBarraVerticalReveal[\s\S]*scaleY\(\.04\)[\s\S]*scaleY\(1\)/);
    assert.match(css, /@keyframes puntuacionPuntosVuelan/);
    assert.match(css, /\.puntuacion-total__azul[\s\S]*width:\s*var\(--puntuacion-balance/);
    assert.match(css, /\.puntuacion-espectador\.is-category-winner-1::after[\s\S]*border-color:\s*var\(--score-blue\)/);
    const museState = read("game/public/players/js/state.js");
    const museCss = read("game/public/players/css/publico.css");
    assert.match(museState, /totalesDuranteRevelado\(estado, vista\.indiceCategoria, fase\)/);
    assert.match(museState, /if \(cambioDeSlide\)/);
    assert.match(museState, /transferirPuntosAlMarcadorMusa/);
    assert.doesNotMatch(museState, /MARCADOR TOTAL/);
    assert.match(museState, /vuelo\.textContent = `\+\$\{Number\(puntos \|\| 0\)\.toFixed\(1\)\} PTS`/);
    assert.match(museState, /PUNTUACION_REVELADO_GANADOR_MUSA_MS = 1540/);
    assert.match(museCss, /\.resultado-musa__barra-vertical[\s\S]*align-items:\s*flex-end/);
    assert.match(museCss, /\.resultado-musa__barra-vertical b\s*\{[\s\S]*transform:\s*translate\(-50%,50%\);/);
    assert.match(
        controlCss,
        /\.control-group--deliberacion:not\(\.is-collapsed\)\s*>\s*\.deliberacion-nav-control:not\(\[hidden\]\)\s*\{[^}]*display:\s*grid\s*!important;/s
    );
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.puntuacion-espectador/);
    ["es", "en", "fr"].forEach((_idioma) => {
        assert.match(i18n, /"score\.final\.winner"/);
        assert.match(i18n, /"score\.disclaimer"/);
        assert.match(i18n, /"control\.score\.unavailable"/);
    });
});
