let tiempo_inicial = new Date();
let es_pausa = false;
let borrado_cambiado = false;
let duracion;
let texto_guardado = "";
let pararEscritura = false;
let LISTA_MODOS = ["palabras bonus", "letra bendita","letra prohibida", "palabras bonus", "palabras prohibidas", "frase final"];
let modos_restantes;

const getEl = (id) => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let texto = getEl("texto");
let puntos = getEl("puntos");
let feedback = getEl("feedback1");
let musas = getEl("musas");
  
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let explicación = getEl("explicación");
let metadatos = getEl("metadatos");
  
let tiempo = getEl("tiempo");
let temas = getEl("temas");
let lightning = getEl("lightning");
let neon = getEl("neon");

let btnFinal = getEl("btn_final");
let btnPantallaCompleta = getEl("btn_pantalla_completa");
let btnLimpiar = getEl("btn_limpiar");
let btnEscribir = getEl("btn_escribir");
let btnDescargarTexto = getEl("btn_descargar_texto");
let btnOpciones = getEl("btn_opciones");
let btnVolver = getEl("btn_volver");
let div_opciones = getEl("opciones");
let desventajaOverlay = getEl("desventajaOverlay");
let desventajaStatus = getEl("desventajaStatus");
let desventajaSlot = getEl("desventajaSlot");
let desventajaReel1 = getEl("desventajaReel1");
let desventajaReel2 = getEl("desventajaReel2");
let desventajaReel3 = getEl("desventajaReel3");
let desventajaChoices = getEl("desventajaChoices");
let desventajaLegend = getEl("desventajaLegend");
let desventajaChoiceTimer = getEl("desventajaChoiceTimer");
let desventajaChoiceTimerFill = getEl("desventajaChoiceTimerFill");

let tiempo_cambio_palabras_input = document.getElementById('tiempo_cambio_palabras');
let tiempo_cambio_letra_input = document.getElementById('tiempo_cambio_letra');
let tiempo_modos_input = document.getElementById('tiempo_modos');
let tiempo_inicial_input = document.getElementById('tiempo_inicial');

let soporte = document.getElementById('soporte');

// ---- Resumen y heatmap para PDF (1 jugador) ----
const HEATMAP_LAYOUT = [
    [
        { code: "Backquote", label: "º\nª" },
        { code: "Digit1", label: "1\n!" },
        { code: "Digit2", label: "2\n\"" },
        { code: "Digit3", label: "3\n#" },
        { code: "Digit4", label: "4\n$" },
        { code: "Digit5", label: "5\n%" },
        { code: "Digit6", label: "6\n&" },
        { code: "Digit7", label: "7\n/" },
        { code: "Digit8", label: "8\n(" },
        { code: "Digit9", label: "9\n)" },
        { code: "Digit0", label: "0\n=" },
        { code: "Minus", label: "¿\n?" },
        { code: "Equal", label: "¡\n!" },
        { code: "Backspace", label: "←", ancho: 2.4 }
    ],
    [
        { code: "Tab", label: "Tab", ancho: 1.6 },
        { code: "KeyQ", label: "Q" }, { code: "KeyW", label: "W" }, { code: "KeyE", label: "E" }, { code: "KeyR", label: "R" },
        { code: "KeyT", label: "T" }, { code: "KeyY", label: "Y" }, { code: "KeyU", label: "U" }, { code: "KeyI", label: "I" },
        { code: "KeyO", label: "O" }, { code: "KeyP", label: "P" },
        { code: "BracketLeft", label: "´\n+" }, { code: "BracketRight", label: "`\n^" },
        { code: "Backslash", label: "\\", ancho: 1.6 }
    ],
    [
        { code: "CapsLock", label: "Caps", ancho: 1.9 },
        { code: "KeyA", label: "A" }, { code: "KeyS", label: "S" }, { code: "KeyD", label: "D" }, { code: "KeyF", label: "F" },
        { code: "KeyG", label: "G" }, { code: "KeyH", label: "H" }, { code: "KeyJ", label: "J" }, { code: "KeyK", label: "K" },
        { code: "KeyL", label: "L" }, { code: "Semicolon", label: "Ñ" },
        { code: "Quote", label: "¨\n´" },
        { code: "Enter", label: "Enter", ancho: 2.5 }
    ],
    [
        { code: "ShiftLeft", label: "Shift", ancho: 2.6 },
        { code: "IntlBackslash", label: "<\n>" },
        { code: "KeyZ", label: "Z" }, { code: "KeyX", label: "X" }, { code: "KeyC", label: "C" }, { code: "KeyV", label: "V" },
        { code: "KeyB", label: "B" }, { code: "KeyN", label: "N" }, { code: "KeyM", label: "M" },
        { code: "Comma", label: ",\n;" }, { code: "Period", label: ".\n:" }, { code: "Slash", label: "¿\n?" },
        { code: "ShiftRight", label: "Shift", ancho: 3 }
    ],
    [
        { code: "ControlLeft", label: "Ctrl", ancho: 1.5 },
        { code: "MetaLeft", label: "Win", ancho: 1.5 },
        { code: "AltLeft", label: "Alt", ancho: 1.5 },
        { code: "Space", label: "Espacio", ancho: 6.4 },
        { code: "AltRight", label: "Alt", ancho: 1.5 },
        { code: "MetaRight", label: "Win", ancho: 1.5 },
        { code: "ContextMenu", label: "Menu", ancho: 1.5 },
        { code: "ControlRight", label: "Ctrl", ancho: 1.5 }
    ],
];

const heatmapConteos = {
    1: new Map()
};

const resumenPartida = {
    letrasBenditas: new Set(),
    letrasMalditas: new Set(),
    intentosLetraProhibida: { 1: 0 },
    intentosPalabraProhibida: { 1: 0 },
    letrasProhibidasUsadas: { 1: new Map() },
    palabrasProhibidasUsadas: { 1: new Map() },
    tiempos: { 1: [] },
    inicio: null,
    tiempoEscrituraMs: 0
};

function resetResumenPartida() {
    resumenPartida.letrasBenditas.clear();
    resumenPartida.letrasMalditas.clear();
    resumenPartida.intentosLetraProhibida[1] = 0;
    resumenPartida.intentosPalabraProhibida[1] = 0;
    resumenPartida.letrasProhibidasUsadas[1].clear();
    resumenPartida.palabrasProhibidasUsadas[1].clear();
    resumenPartida.tiempos[1] = [];
    resumenPartida.inicio = Date.now();
    resumenPartida.tiempoEscrituraMs = 0;
}

function cerrarResumenPartida() {
    if (resumenPartida.inicio !== null) {
        resumenPartida.tiempoEscrituraMs = Math.max(0, Date.now() - resumenPartida.inicio);
    }
}

function registrarTiempoControl(playerId, segundosRestantes) {
    if (!playerId || typeof segundosRestantes !== "number") return;
    if (!resumenPartida.inicio) {
        resumenPartida.inicio = Date.now();
    }
    const serie = resumenPartida.tiempos[playerId];
    if (!serie) return;
    const t = Date.now() - resumenPartida.inicio;
    const ultimo = serie[serie.length - 1];
    if (ultimo && ultimo.v === segundosRestantes && (t - ultimo.t) < 800) {
        return;
    }
    serie.push({ t, v: Math.max(0, segundosRestantes) });
}

function obtenerTiempoEscrituraMs() {
    if (resumenPartida.tiempoEscrituraMs) return resumenPartida.tiempoEscrituraMs;
    if (resumenPartida.inicio === null) return 0;
    return Math.max(0, Date.now() - resumenPartida.inicio);
}

function registrarIntentoLetraProhibida(letra) {
    if (!letra) return;
    resumenPartida.intentosLetraProhibida[1] += 1;
    const key = String(letra).toUpperCase();
    const mapa = resumenPartida.letrasProhibidasUsadas[1];
    mapa.set(key, (mapa.get(key) || 0) + 1);
}

function registrarIntentoPalabraProhibida(palabra) {
    if (!palabra) return;
    resumenPartida.intentosPalabraProhibida[1] += 1;
    const key = String(palabra).toUpperCase();
    const mapa = resumenPartida.palabrasProhibidasUsadas[1];
    mapa.set(key, (mapa.get(key) || 0) + 1);
}

function resetHeatmap() {
    heatmapConteos[1].clear();
}

function registrarPulsacionHeatmap(code) {
    if (!code) return;
    const conteo = (heatmapConteos[1].get(code) || 0) + 1;
    heatmapConteos[1].set(code, conteo);
}

document.addEventListener("keydown", (event) => {
    if (!texto || !texto.isContentEditable) return;
    if (typeof terminado !== "undefined" && terminado) return;
    registrarPulsacionHeatmap(event.code || event.key);
});

resetResumenPartida();
resetHeatmap();



let tempo_text_borroso;
let tempo_text_inverso;

let listener_cuenta_atras = null;
let listener_cambio_letra_palabra = null;
let timer = null;
let sub_timer = null;
let secondsRemaining = 0;
let secondsPassed = 0;
let desventajaEnCurso = false;
let timeout_bloqueo_putada = null;
let timeout_teclado_lento = null;
let teclado_lento_putada = false;
let bloquear_borrado_putada = false;
let desventajaSecuenciaId = 0;
let desventajaDecisionTimeout = null;
let desventajaDecisionInterval = null;

// Variables de los modos.
let modo_actual = "";
let modo_anterior = "";

let putada_actual = "";
let modo_texto_borroso = 0;
let desactivar_borrar = false;
const RETRASO_TECLADO_LENTO_MS = 500;
const RAYO_REDUCCION_K = 0.08;
const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";
const DURACION_ELECCION_DESVENTAJA_MS = 8000;
const DURACION_LECTURA_RESULTADO_TRAGAPERRAS_MS = 2400;
const INTERVALO_TRAGAPERRAS_MS = 80;
const TICKS_BASE_TRAGAPERRAS = 20;
const TICKS_EXTRA_POR_REEL = 9;
const RETRASO_FINAL_TRAGAPERRAS_MS = 320;
const DESVENTAJAS_BASE = [
    { emoji: "\uD83D\uDC22", dificultad: "facil", descripcion: "El teclado ira mas lento." },
    { emoji: "\u26A1", dificultad: "dificil", descripcion: "El juego borrara mas rapido tu texto." },
    { emoji: "\uD83C\uDF2A\uFE0F", dificultad: "facil", descripcion: "Una bruma dificultara la lectura del texto." },
    { emoji: "\uD83D\uDE43", dificultad: "media", descripcion: "El texto se invertira en espejo." },
    { emoji: "\uD83D\uDD8A\uFE0F", dificultad: "media", descripcion: "No podras borrar durante unos segundos." }
];
const MAPA_DESVENTAJAS = new Map(DESVENTAJAS_BASE.map((item) => [item.emoji, item]));

const AUDIO_BASE_PATH = "../../game/audio";
const AUDIO_CUENTA_ATRAS_INICIO = `${AUDIO_BASE_PATH}/5. PREPARADOS 1.mp3`;
const AUDIOS_CUENTA_ATRAS = [
    `${AUDIO_BASE_PATH}/5. PREPARADOS 2.mp3`,
    `${AUDIO_BASE_PATH}/5. PREPARADOS 3.mp3`,
    `${AUDIO_BASE_PATH}/5. PREPARADOS 4.mp3`,
    `${AUDIO_BASE_PATH}/5. PREPARADOS 5.mp3`
];
const AUDIO_FINAL_PARTIDA = `${AUDIO_BASE_PATH}/CELEBRACION con explosiones.mp3`;
const AUDIO_GANAR_TIEMPO = `${AUDIO_BASE_PATH}/GANAR 2 SEG.mp3`;
const AUDIO_PERDER_TIEMPO = `${AUDIO_BASE_PATH}/PERDER 2 SEG.mp3`;
const AUDIO_DESVENTAJA_TRUENO = `${AUDIO_BASE_PATH}/FX/6. TRUENO 1.mp3`;
const AUDIO_DESVENTAJA_INVERSO = `${AUDIO_BASE_PATH}/FX/8. INVERSO LOOP.mp3`;
const AUDIO_DESVENTAJA_BORROSO = `${AUDIO_BASE_PATH}/FX/7. REMOLINO PARA LOOP.mp3`;
const AUDIO_MODOS = {
    "palabras bonus": {
        musica: `${AUDIO_BASE_PATH}/5. KEYGEN PRUEBA 1.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/12. PALABRAS BONUS.mp3`
    },
    "letra prohibida": {
        musica: `${AUDIO_BASE_PATH}/6. KEYGEN PRUEBA 2.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/11. LETRA PROHIBIDA.mp3`
    },
    "letra bendita": {
        musica: `${AUDIO_BASE_PATH}/5. KEYGEN PRUEBA 1.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/10. LETRA BENDITA.mp3`
    },
    "palabras prohibidas": {
        musica: `${AUDIO_BASE_PATH}/6. KEYGEN PRUEBA 2.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/13. PALABRAS PROHIBIDAS.mp3`
    },
    "tertulia": {
        musica: `${AUDIO_BASE_PATH}/7. KEYGEN PRUEBA 3.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/14. TERTULIA.mp3`
    },
    "frase final": {
        musica: `${AUDIO_BASE_PATH}/5. KEYGEN PRUEBA 1.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/15. FRASE FINAL.mp3`
    }
};

let audio_musica_modo = null;
let audio_final_partida = null;
let audio_desventaja_inverso = null;
let audio_desventaja_borroso = null;
let intervalo_sonido_rayo_desventaja = null;
const audios_sfx_activos = new Set();

function crearAudio(rutaArchivo, loop = false, volume = 1) {
    if (!rutaArchivo) return null;
    const audio = new Audio(rutaArchivo);
    audio.loop = loop;
    audio.preload = "auto";
    audio.volume = Math.max(0, Math.min(1, Number(volume) || 1));
    audio.play().catch(() => {});
    return audio;
}

function detenerAudioActivo(audio, reiniciar = true) {
    if (!audio) return null;
    audio.pause();
    if (reiniciar) {
        try {
            audio.currentTime = 0;
        } catch (error) {}
    }
    return null;
}

function reproducirSfx(rutaArchivo, volume = 1) {
    const audio = crearAudio(rutaArchivo, false, volume);
    if (!audio) return null;
    audios_sfx_activos.add(audio);
    const limpiar = () => {
        audios_sfx_activos.delete(audio);
    };
    audio.addEventListener("ended", limpiar, { once: true });
    audio.addEventListener("error", limpiar, { once: true });
    return audio;
}

function detenerSfxActivos() {
    audios_sfx_activos.forEach((audio) => {
        detenerAudioActivo(audio);
    });
    audios_sfx_activos.clear();
}

function detenerMusicaModo() {
    audio_musica_modo = detenerAudioActivo(audio_musica_modo);
}

function reproducirAudioModo(modo) {
    const config = AUDIO_MODOS[modo];
    detenerMusicaModo();
    if (!config) return;
    if (config.musica) {
        audio_musica_modo = crearAudio(config.musica, true, 0.58);
    }
    if (config.sfx) {
        reproducirSfx(config.sfx, 1);
    }
}

function detenerAudioFinal() {
    audio_final_partida = detenerAudioActivo(audio_final_partida);
}

function detenerSonidoRayoDesventaja() {
    if (!intervalo_sonido_rayo_desventaja) return;
    clearInterval(intervalo_sonido_rayo_desventaja);
    intervalo_sonido_rayo_desventaja = null;
}

function reproducirSonidoRayoDesventaja() {
    reproducirSfx(AUDIO_DESVENTAJA_TRUENO, 0.95);
}

function detenerAudioInversoDesventaja() {
    audio_desventaja_inverso = detenerAudioActivo(audio_desventaja_inverso);
}

function detenerAudioBorrosoDesventaja() {
    audio_desventaja_borroso = detenerAudioActivo(audio_desventaja_borroso);
}

function detenerAudiosDesventaja() {
    detenerSonidoRayoDesventaja();
    detenerAudioInversoDesventaja();
    detenerAudioBorrosoDesventaja();
}

function reproducirAudioFinal() {
    detenerMusicaModo();
    detenerAudioFinal();
    audio_final_partida = crearAudio(AUDIO_FINAL_PARTIDA, false, 0.95);
}

function detenerTodoAudioJuego() {
    detenerAudiosDesventaja();
    detenerMusicaModo();
    detenerSfxActivos();
    detenerAudioFinal();
}

function limpiar_bloqueo_putada() {
    bloquear_borrado_putada = false;
    if (timeout_bloqueo_putada) {
        clearTimeout(timeout_bloqueo_putada);
        timeout_bloqueo_putada = null;
    }
    if (putada_actual === "🖊️") {
        putada_actual = "";
    }
}

function limpiar_teclado_lento() {
    teclado_lento_putada = false;
    if (timeout_teclado_lento) {
        clearTimeout(timeout_teclado_lento);
        timeout_teclado_lento = null;
    }
    if (putada_actual === "🐢") {
        putada_actual = "";
    }
}

function extraerSegundosTiempo(textoTiempo) {
    if (!textoTiempo || typeof textoTiempo !== "string" || textoTiempo.indexOf(":") === -1) {
        return null;
    }
    const partes = textoTiempo.split(":");
    if (partes.length < 2) {
        return null;
    }
    const minutos = parseInt(partes[0], 10);
    const segundos = parseInt(partes[1], 10);
    if (Number.isNaN(minutos) || Number.isNaN(segundos)) {
        return null;
    }
    return (minutos * 60) + segundos;
}

function actualizarBarraVida(elemento, textoTiempo) {
    if (!elemento) return;
    const total = extraerSegundosTiempo(textoTiempo);
    if (total === null) {
        elemento.style.setProperty("--vida-pct", "0%");
        elemento.style.setProperty("--vida-color", "#d94b4b");
        elemento.style.display = "none";
        return;
    }
    const limitado = Math.min(Math.max(total, 0), VIDA_MAX_SEGUNDOS);
    const porcentaje = (limitado / VIDA_MAX_SEGUNDOS) * 100;
    const tono = Math.max(0, Math.min(120, porcentaje * 1.2));
    elemento.style.display = DISPLAY_BARRA_VIDA;
    elemento.style.setProperty("--vida-pct", `${porcentaje.toFixed(1)}%`);
    elemento.style.setProperty("--vida-color", `hsl(${tono}, 85%, 55%)`);
}

function reduceLog(base, k = 1) {
    if (base <= 0) return 0;
    const lnBase = Math.log(base);
    const denom = 1 + k * lnBase;
    return Math.round(base / denom);
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function smoothstep01(value) {
    const t = clampNumber(value, 0, 1);
    return t * t * (3 - 2 * t);
}

function obtenerFactoresDesventajaPorVida(segundosVida) {
    const ratio = smoothstep01(clampNumber((Number(segundosVida) || 0) / VIDA_MAX_SEGUNDOS, 0, 1));
    return {
        facil: 1.95 - (1.95 - 0.52) * ratio,
        media: 1.1,
        dificil: 0.45 + (1.95 - 0.45) * ratio
    };
}

function obtenerPesoDesventaja(emoji, segundosVida) {
    const info = MAPA_DESVENTAJAS.get(emoji);
    const dificultad = info ? info.dificultad : "media";
    const factores = obtenerFactoresDesventajaPorVida(segundosVida);
    return Math.max(0.001, factores[dificultad] || factores.media);
}

function seleccionarPonderado(opciones, pesos) {
    if (!Array.isArray(opciones) || opciones.length === 0) return null;
    const total = pesos.reduce((acc, peso) => acc + Math.max(0, Number(peso) || 0), 0);
    if (total <= 0) {
        return opciones[Math.floor(Math.random() * opciones.length)];
    }
    let tirada = Math.random() * total;
    for (let i = 0; i < opciones.length; i++) {
        tirada -= Math.max(0, Number(pesos[i]) || 0);
        if (tirada <= 0) {
            return opciones[i];
        }
    }
    return opciones[opciones.length - 1];
}

function elegirDesventajaPonderada(opciones, segundosVida = secondsRemaining) {
    const lista = Array.isArray(opciones) ? opciones.slice() : [];
    if (!lista.length) return null;
    const pesos = lista.map((emoji) => obtenerPesoDesventaja(emoji, segundosVida));
    return seleccionarPonderado(lista, pesos);
}

function generarResultadoTragaperras() {
    const emojis = DESVENTAJAS_BASE.map((item) => item.emoji);
    const resultado = [
        elegirDesventajaPonderada(emojis),
        elegirDesventajaPonderada(emojis),
        elegirDesventajaPonderada(emojis)
    ];
    const conteo = new Map();
    resultado.forEach((emoji) => conteo.set(emoji, (conteo.get(emoji) || 0) + 1));
    for (const [emoji, cantidad] of conteo.entries()) {
        if (cantidad === 2) {
            return [emoji, emoji, emoji];
        }
    }
    return resultado;
}

function limpiarTimersDecisionDesventaja() {
    if (desventajaDecisionTimeout) {
        clearTimeout(desventajaDecisionTimeout);
        desventajaDecisionTimeout = null;
    }
    if (desventajaDecisionInterval) {
        clearInterval(desventajaDecisionInterval);
        desventajaDecisionInterval = null;
    }
}

function obtenerNodoEmojiReel(reel) {
    if (!reel) return null;
    let nodo = reel.querySelector(".desventaja-reel-emoji");
    if (!nodo) {
        const inicial = (reel.textContent || "").trim() || "?";
        reel.textContent = "";
        nodo = document.createElement("span");
        nodo.className = "desventaja-reel-emoji";
        nodo.textContent = inicial;
        reel.appendChild(nodo);
    }
    return nodo;
}

function setEmojiReel(reel, emoji) {
    if (!reel) return;
    const nodo = obtenerNodoEmojiReel(reel);
    const valor = String(emoji || "?");
    if (nodo) nodo.textContent = valor;
    reel.dataset.emoji = valor;
}

function getEmojiReel(reel) {
    if (!reel) return "";
    if (reel.dataset && reel.dataset.emoji) {
        return reel.dataset.emoji;
    }
    const nodo = reel.querySelector(".desventaja-reel-emoji");
    if (nodo) {
        return (nodo.textContent || "").trim();
    }
    return (reel.textContent || "").trim();
}

function limpiarReelsDesventaja() {
    const reels = [desventajaReel1, desventajaReel2, desventajaReel3];
    reels.forEach((reel) => {
        if (!reel) return;
        setEmojiReel(reel, "?");
        reel.classList.remove("frenada", "girando", "elegible", "seleccionado", "auto");
        reel.removeAttribute("data-emoji");
        reel.onclick = null;
    });
}

function ocultarOverlayDesventaja() {
    limpiarTimersDecisionDesventaja();
    limpiarReelsDesventaja();
    if (desventajaOverlay) desventajaOverlay.classList.remove("activa");
    if (desventajaSlot) desventajaSlot.classList.remove("fusionando");
    if (desventajaChoiceTimer) desventajaChoiceTimer.classList.remove("activa");
    if (desventajaChoices) desventajaChoices.innerHTML = "";
    if (desventajaLegend) desventajaLegend.innerHTML = "";
}

function cancelarSecuenciaDesventaja() {
    desventajaSecuenciaId += 1;
    desventajaEnCurso = false;
    ocultarOverlayDesventaja();
}

function mostrarOverlayDesventaja() {
    if (!desventajaOverlay) return;
    desventajaOverlay.classList.add("activa");
}

function setEstadoDesventaja(textoEstado) {
    if (!desventajaStatus) return;
    desventajaStatus.textContent = textoEstado || "";
}

function renderLeyendaDesventajas(opciones, activaEmoji = "") {
    if (!desventajaLegend) return;
    const lista = (opciones || []).map((emoji) => {
        const info = MAPA_DESVENTAJAS.get(emoji);
        const desc = info ? info.descripcion : "Desventaja";
        const activaClass = activaEmoji === emoji ? " activa" : "";
        return `<div class="desventaja-legend-item${activaClass}">${emoji} ${desc}</div>`;
    });
    desventajaLegend.innerHTML = lista.join("");
}

function animarTragaperras(resultado, tokenSecuencia) {
    const reels = [desventajaReel1, desventajaReel2, desventajaReel3];
    const emojis = DESVENTAJAS_BASE.map((item) => item.emoji);
    reels.forEach((reel) => {
        if (!reel) return;
        obtenerNodoEmojiReel(reel);
        reel.classList.remove("frenada", "girando", "elegible", "seleccionado", "auto");
        reel.onclick = null;
    });

    return new Promise((resolve) => {
        let pendientes = reels.length;
        reels.forEach((reel, index) => {
            if (!reel) {
                pendientes -= 1;
                if (pendientes <= 0) resolve();
                return;
            }
            let ticks = 0;
            const maxTicks = TICKS_BASE_TRAGAPERRAS + (index * TICKS_EXTRA_POR_REEL);
            reel.classList.add("girando");
            const interval = setInterval(() => {
                if (tokenSecuencia !== desventajaSecuenciaId) {
                    clearInterval(interval);
                    reel.classList.remove("girando");
                    pendientes -= 1;
                    if (pendientes <= 0) resolve();
                    return;
                }
                setEmojiReel(reel, emojis[Math.floor(Math.random() * emojis.length)]);
                ticks += 1;
                if (ticks >= maxTicks) {
                    clearInterval(interval);
                    reel.classList.remove("girando");
                    setEmojiReel(reel, resultado[index]);
                    reel.classList.add("frenada");
                    pendientes -= 1;
                    if (pendientes <= 0) {
                        setTimeout(resolve, RETRASO_FINAL_TRAGAPERRAS_MS);
                    }
                }
            }, INTERVALO_TRAGAPERRAS_MS);
        });
    });
}

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function iniciarCuentaEleccionDesventaja(opciones, tokenSecuencia, onSelect) {
    if (!desventajaChoiceTimer || !desventajaChoiceTimerFill) return;
    const inicio = Date.now();
    const total = DURACION_ELECCION_DESVENTAJA_MS;
    desventajaChoiceTimer.classList.add("activa");
    desventajaChoiceTimerFill.classList.remove("urgente");
    desventajaChoiceTimerFill.style.transform = "scaleX(1)";

    limpiarTimersDecisionDesventaja();
    desventajaDecisionInterval = setInterval(() => {
        if (tokenSecuencia !== desventajaSecuenciaId) {
            limpiarTimersDecisionDesventaja();
            return;
        }
        const transcurrido = Date.now() - inicio;
        const restante = Math.max(0, total - transcurrido);
        const ratio = restante / total;
        desventajaChoiceTimerFill.style.transform = `scaleX(${ratio})`;
        if (ratio <= 0.35) {
            desventajaChoiceTimerFill.classList.add("urgente");
        }
    }, 50);

    desventajaDecisionTimeout = setTimeout(() => {
        if (tokenSecuencia !== desventajaSecuenciaId) return;
        const autoEmoji = elegirDesventajaPonderada(opciones);
        onSelect(autoEmoji, true);
    }, total);
}

function mostrarEleccionDesventaja(opciones, tokenSecuencia) {
    return new Promise((resolve) => {
        const reels = [desventajaReel1, desventajaReel2, desventajaReel3];
        if (!reels.every((reel) => reel)) {
            resolve({ emoji: elegirDesventajaPonderada(opciones), auto: true });
            return;
        }
        let resuelto = false;
        const desactivarReels = () => {
            reels.forEach((reel) => {
                if (!reel) return;
                reel.classList.remove("elegible");
                reel.onclick = null;
            });
        };
        const resolver = (emoji, auto) => {
            if (resuelto || tokenSecuencia !== desventajaSecuenciaId) return;
            resuelto = true;
            limpiarTimersDecisionDesventaja();
            desactivarReels();
            let destacado = false;
            reels.forEach((reel) => {
                if (!reel) return;
                const coincide = !destacado && reel.dataset.emoji === emoji;
                if (coincide) destacado = true;
                reel.classList.toggle("seleccionado", coincide);
                reel.classList.toggle("auto", coincide && auto);
            });
            renderLeyendaDesventajas(opciones, emoji);
            resolve({ emoji, auto });
        };

        reels.forEach((reel, index) => {
            if (!reel) return;
            const emoji = opciones[index] || getEmojiReel(reel) || "";
            setEmojiReel(reel, emoji);
            reel.dataset.emoji = emoji;
            reel.classList.remove("seleccionado", "auto");
            reel.classList.add("elegible");
            reel.onclick = () => resolver(emoji, false);
        });
        if (desventajaChoices) desventajaChoices.innerHTML = "";
        renderLeyendaDesventajas(opciones);

        iniciarCuentaEleccionDesventaja(opciones, tokenSecuencia, resolver);
    });
}

function aplicarDesventajaSeleccionada(emoji) {
    if (!emoji) return;
    const activar = PUTADAS[emoji];
    if (typeof activar !== "function") return;
    putada_actual = emoji;
    activar();
}

function avanzarModoTrasDesventaja(emoji) {
    secondsPassed = 0;
    detenerMusicaModo();
    LIMPIEZAS[modo_actual]("");
    modo_anterior = modo_actual;
    modo_actual = modos_restantes[0];
    modos_restantes.splice(0, 1);
    if (!modo_actual) {
        final();
        return;
    }
    MODOS[modo_actual]("");
    if (!terminado) {
        texto.contentEditable = "true";
        texto.focus();
    }
    aplicarDesventajaSeleccionada(emoji);
}

function completarFaseDesventaja(emoji) {
    ocultarOverlayDesventaja();
    avanzarModoTrasDesventaja(emoji);
    desventajaEnCurso = false;
}

async function iniciarDesventajaEntreNiveles() {
    if (desventajaEnCurso || terminado) return;
    desventajaEnCurso = true;
    desventajaSecuenciaId += 1;
    const tokenSecuencia = desventajaSecuenciaId;

    texto.contentEditable = "false";
    mostrarOverlayDesventaja();
    setEstadoDesventaja("SE VA A ELEGIR UNA DESVENTAJA");
    if (desventajaChoiceTimer) desventajaChoiceTimer.classList.remove("activa");
    if (desventajaChoices) desventajaChoices.innerHTML = "";
    renderLeyendaDesventajas([]);
    if (desventajaSlot) desventajaSlot.classList.remove("fusionando");
    limpiarReelsDesventaja();

    await esperar(420);
    if (tokenSecuencia !== desventajaSecuenciaId) return;

    const resultado = generarResultadoTragaperras();
    await animarTragaperras(resultado, tokenSecuencia);
    if (tokenSecuencia !== desventajaSecuenciaId) return;

    const triple = resultado[0] === resultado[1] && resultado[1] === resultado[2];
    let seleccion = { emoji: resultado[0], auto: false };

    if (triple) {
        setEstadoDesventaja("");
        renderLeyendaDesventajas([resultado[0]], resultado[0]);
        if (desventajaSlot) desventajaSlot.classList.add("fusionando");
        await esperar(980);
    } else {
        setEstadoDesventaja("");
        seleccion = await mostrarEleccionDesventaja(resultado, tokenSecuencia);
        if (tokenSecuencia !== desventajaSecuenciaId) return;
    }

    setEstadoDesventaja("APLICANDO DESVENTAJA...");
    await esperar(DURACION_LECTURA_RESULTADO_TRAGAPERRAS_MS);

    if (tokenSecuencia !== desventajaSecuenciaId) return;
    completarFaseDesventaja(seleccion.emoji);
}

const LISTA_MODOS_INICIAL = ["letra bendita", "letra prohibida", "palabras bonus", "palabras prohibidas", "frase final"];


// Objeto que asocia cada modo con un color
const COLORES_MODOS = {
    "letra bendita": "green",
    "letra prohibida": "red",
    "tertulia": "blue",
    "palabras bonus": "yellow",
    "palabras prohibidas": "pink",
    "frase final": "orange"
};

const letras_prohibidas = ['e','a','o','s','r','n','i','d','l','c'];
const letras_benditas= ['z','j','ñ','x','k','w', 'y', 'q', 'h', 'f'];
const frecuencia_letras = {
    'a': 12.53,
    'b': 1.42,
    'c': 4.68,
    'd': 5.86,
    'e': 13.68,
    'f': 0.69,
    'g': 1.01,
    'h': 0.7,
    'i': 6.25,
    'j': 0.44,
    'k': 0.02,
    'l': 4.97,
    'm': 3.15,
    'n': 6.71,
    'ñ': 0.31,
    'o': 8.68,
    'p': 2.51,
    'q': 0.88,
    'r': 6.87,
    's': 7.98,
    't': 4.63,
    'u': 3.93,
    'v': 0.90,
    'w': 0.01,
    'x': 0.22,
    'y': 0.90,
    'z': 0.52
}

let letras_benditas_restantes = [...letras_benditas];
let letras_prohibidas_restantes = [...letras_prohibidas];

const palabras_prohibidas = [
    "de", "la", "que", "el", "en", "y", "a", "los", "se", "del",
    "las", "un", "por", "con", "no", "una", "su", "para", "es", "al",
    "lo", "como", "más", "o", "pero", "sus", "le", "ha", "me", "si",
    "sin", "sobre", "este", "ya", "entre", "cuando", "todo", "esta", "ser", "son",
    "dos", "también", "fue", "había", "era", "muy", "años", "hasta", "desde", "está"
];

const frases_finales = [
    "No hay nada que hacer: criaremos a los nuestros",
    "Cuando todo parecía perennemente feliz",
    "Nada es intercurrente",
    "Pudo ser el calor del verano",
    "Mataste a tus verdaderos padres",
    "Chillé y salí corriendo",
    "Y me desperté",
    "Habla, es lunes",
    "Nada mejor para aleonar el espíritu del Oeste",
    "Te perdono, mamá",
    "Me duele, pero prefiero que nos separemos",
    "Te estoy diciendo que te tienes que unir",
    "Alócate, coño",
    "No podía respirar",
    "Te van a dar varias hostias hagas lo que hagas",
    "Yo soy el autor de todo",
    "Lo flipo",
    "No consigo separar mis pensamientos",
    "Y la palabra de Marx será olvidada como la de todos",
    "Igual se han caído en el baño",
    "¿Sabes quién soy?",
    "No me importa que lo esté pasando mal",
    "Me gusta mucho esto de luchar",
    "¡Que viva este equipo!",
    "Se dedica a algo de la sanidad así que es parecido",
    "No puedo más",
    "Yo voté al partido",
    "Eres como la heroína, me matas",
    "Eras el amor de mi vida. En fin",
    "Te han robado twitter",
    "Ahora comienza el viaje",
    "Un lugar donde todo sale mal",
    "No es por ti, es por mí",
    "¡Dime qué quieres!",
    "Debe haber algo permanente en este cambiante cosmos",
    "Esperemos a que salga el sol",
    "Mierda",
    "¡Basta ya de tanta guerra!",
    "Siempre hay tiempo para volver a empezar",
    "Y pasarán muchos años más",
    "Me confundió un poco",
    "¡Que se callen!",
    "¡Tú nunca venías!",
    "Porque esta ciudad lo es todo, TODO",
    "Quizá algún día me vuelva a necesitar. Llámeme entonces"
];

let palabras_prohibidas_restantes = [...palabras_prohibidas];
const TOP_K_PALABRAS_MALDITAS = 5;
let palabras_top_usadas = new Set();

function normalizar_texto_maldito(texto) {
    return (texto || "")
        .toLowerCase()
        .replace(/[^a-záéíóúüñ\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function obtener_top_palabras_malditas(texto, k) {
    const limpio = normalizar_texto_maldito(texto);
    if (!limpio) return [];

    const conteo = new Map();
    limpio.split(" ").forEach(palabra => {
        if (palabra.length < 1) return;
        conteo.set(palabra, (conteo.get(palabra) || 0) + 1);
    });

    return Array.from(conteo.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([palabra]) => palabra)
        .slice(0, k);
}

var letra_prohibida = "";
var letra_bendita = "";
let listener_modo;
let listener_modo1;
let timeoutID_menu;
let listener_modo_psico;
let activado_psico = false;
let temp_text_inverso_activado = false;

let TIEMPO_INVERSO = 20000;
let TIEMPO_BORROSO = 20000;
let TIEMPO_BORRADO = 20000;
let TIEMPO_CAMBIO_MODOS = 5000;
let TIEMPO_CAMBIO_LETRA = 5000;
let TIEMPO_CAMBIO_PALABRA = 5000;
let TIEMPO_INICIAL = 20000;

const TIEMPO_INVERSO_BASE = TIEMPO_INVERSO;
const TIEMPO_BORROSO_BASE = TIEMPO_BORROSO;
const TIEMPO_BORRADO_BASE = TIEMPO_BORRADO;
const DURACION_NIVEL_REFERENCIA_MS = 60000;
const RAPIDEZ_BORRADO_BASE = rapidez_borrado;
const RAPIDEZ_INICIO_BORRADO_BASE = rapidez_inicio_borrado;
const mainTitle = document.querySelector('.main-title');
const buttonContainer = document.querySelector('.button-container');

function obtenerDuracionNivelActualMs() {
  const nivelMs = Number(TIEMPO_CAMBIO_MODOS);
  if (!Number.isFinite(nivelMs) || nivelMs <= 0) {
    return DURACION_NIVEL_REFERENCIA_MS;
  }
  return nivelMs;
}

function calcularDuracionDesventajaMs(baseMs) {
  const base = Number(baseMs);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const nivelActual = obtenerDuracionNivelActualMs();
  const escalada = Math.round((base / DURACION_NIVEL_REFERENCIA_MS) * nivelActual);
  // Nunca superar la duracion del nivel.
  return Math.min(nivelActual, Math.max(1, escalada));
}

let nombre = getEl("nombre");

let player = getParameterByName("name");
nombre.value = (player && player.trim() !== "") ? player.toUpperCase() : "ESCRITXR";

metadatos.style = "color:aqua; text-shadow: 0.0625em 0.0625em red;";

texto.addEventListener("keydown", (e) => {
    if (bloquear_borrado_putada && e.key === "Backspace") {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const direccion = e.key === "ArrowRight" ? "forward" : "backward";
        if (moverCursorPorPalabraBendita(direccion)) {
            e.preventDefault();
            return;
        }
    }
    if (e.key === "Backspace" || e.key === "Delete") {
        const sel = window.getSelection();
        const direccion = e.key === "Backspace" ? "backward" : "forward";
        if (caretAfectaPalabraBendita(direccion)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        const rangoBorrado = obtenerRangoBorradoCaracter(direccion);
        if (rangoBorrado && rangoIntersecaPalabraBendita(rangoBorrado)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        if (hayPalabraBenditaAdyacente(sel, direccion)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
    }
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;

        if (
          startContainer.nodeType === 1 &&
          startOffset === 0 &&
          startContainer.previousSibling &&
          startContainer.previousSibling.getAttribute &&
          startContainer.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault();
        }

        if (
          startContainer.nodeType === 3 &&
          startOffset === 0 &&
          startContainer.parentNode.previousSibling &&
          startContainer.parentNode.previousSibling.getAttribute &&
          startContainer.parentNode.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault();
        }
      }
    }
});

texto.addEventListener("beforeinput", (e) => {
    if (e.inputType && e.inputType.startsWith("delete")) {
        snapshot_html_bendita = texto.innerHTML;
        snapshot_offset_bendita = obtenerOffsetCaretEnTexto();
        snapshot_cantidad_benditas = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA).length;
    } else {
        snapshot_html_bendita = null;
        snapshot_offset_bendita = null;
        snapshot_cantidad_benditas = 0;
    }
    if (debeBloquearEdicionPalabraBendita(e)) {
        e.preventDefault();
        return;
    }
    if (!teclado_lento_putada) return;
    if (e.inputType === "insertText" || e.inputType === "insertParagraph") {
        e.preventDefault();
        const data = e.data ?? (e.inputType === "insertParagraph" ? "\n" : "");
        setTimeout(() => {
            if (!teclado_lento_putada) return;
            if (data === "\n") {
                document.execCommand("insertLineBreak");
            } else {
                document.execCommand("insertText", false, data);
            }
        }, RETRASO_TECLADO_LENTO_MS);
    }
});

texto.addEventListener("input", () => {
    if (!snapshot_html_bendita) return;
    const cantidad_actual = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA).length;
    if (cantidad_actual < snapshot_cantidad_benditas) {
        restaurando_bendita = true;
        texto.innerHTML = snapshot_html_bendita;
        if (Number.isFinite(snapshot_offset_bendita)) {
            colocarCaretEnOffset(snapshot_offset_bendita);
        }
        countChars(texto);
        setTimeout(() => {
            restaurando_bendita = false;
        }, 0);
    }
    snapshot_html_bendita = null;
    snapshot_offset_bendita = null;
    snapshot_cantidad_benditas = 0;
});
  
const PUTADAS = {
    "🐢": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORRADO);
        if (timeout_teclado_lento) {
            clearTimeout(timeout_teclado_lento);
            timeout_teclado_lento = null;
        }
        teclado_lento_putada = true;
        putada_actual = "🐢";
        timeout_teclado_lento = setTimeout(function () {
            teclado_lento_putada = false;
            if (putada_actual === "🐢") {
                putada_actual = "";
            }
            timeout_teclado_lento = null;
        }, duracionDesventaja);
    },
    "⌛": function () {
    },
    "⚡": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORRADO);
        borrado_cambiado = true;
        antiguo_rapidez_borrado = rapidez_borrado;
        antiguo_inicio_borrado = rapidez_inicio_borrado;
        rapidez_borrado = reduceLog(rapidez_borrado, RAYO_REDUCCION_K);
        rapidez_inicio_borrado = reduceLog(rapidez_inicio_borrado, RAYO_REDUCCION_K);
        putada_actual = "⚡";
        detenerSonidoRayoDesventaja();
        reproducirSonidoRayoDesventaja();
        intervalo_sonido_rayo_desventaja = setInterval(() => {
            reproducirSonidoRayoDesventaja();
        }, 4000);
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.transform = "translateX(-50%)";
        lightning.style.top = "27%";
        lightning.style.left = "50%";
        setTimeout(function () {
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            detenerSonidoRayoDesventaja();
            borrado_cambiado = false;
            rapidez_borrado = antiguo_rapidez_borrado;
            rapidez_inicio_borrado = antiguo_inicio_borrado;
            if (putada_actual === "⚡") {
                putada_actual = "";
            }
        }, duracionDesventaja);
    },

    "🙃": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_INVERSO);
        tiempo_inicial = new Date();
        desactivar_borrar = true;
        detenerAudioInversoDesventaja();
        audio_desventaja_inverso = crearAudio(AUDIO_DESVENTAJA_INVERSO, true, 0.8);
        //caret = guardarPosicionCaret();
        //caretNode = caret.caretNode;
        //caretPos = caret.caretPos;
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            texto.removeEventListener('animationend', arguments.callee);
        });

        procesarTexto();
        // Obtener el último nodo de texto en text
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el último nodo de texto, colocamos el cursor allí
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        
        temp_text_inverso_activado = true;
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            desactivar_borrar = false;

            texto.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.contentEditable= "true";
                texto.focus()
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            let lastLine = texto.lastChild;
            let lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                let caretNode = lastTextNode;
                let caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            detenerAudioInversoDesventaja();
            putada_actual = "";

        }, duracionDesventaja);
    },

    "🖊️": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORRADO);
        if (timeout_bloqueo_putada) {
            clearTimeout(timeout_bloqueo_putada);
            timeout_bloqueo_putada = null;
        }
        bloquear_borrado_putada = true;
        putada_actual = "🖊️";
        timeout_bloqueo_putada = setTimeout(function () {
            limpiar_bloqueo_putada();
        }, duracionDesventaja);
    },

    "🌪️": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORROSO);
        modo_texto_borroso = 1;
        tiempo_inicial = new Date();
        putada_actual = "🌪️";
        detenerAudioBorrosoDesventaja();
        audio_desventaja_borroso = crearAudio(AUDIO_DESVENTAJA_BORROSO, true, 0.8);
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            detenerAudioBorrosoDesventaja();
            if (putada_actual === "🌪️") {
                putada_actual = "";
            }
        }, duracionDesventaja);
    },
};

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        reproducirAudioModo("palabras bonus");
        palabra.style.backgroundColor = "yellow";
        explicación.style.color = "yellow";
        if (window.innerWidth <= 800) {
            definicion.style.fontSize = "2vw";
            palabra.style.fontSize = "5vw";
            explicación.style.fontSize = "5vw"
        }
        else{
            definicion.style.fontSize = "1vw";
            palabra.style.fontSize = "2vw";
            explicación.style.fontSize = "2vw"
        }
        explicación.innerHTML = "NIVEL PALABRAS BENDITAS";

        recibir_palabra();
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        reproducirAudioModo("letra prohibida");
        indice_letra_prohibida = Math.floor(Math.random() * letras_prohibidas_restantes.length);
        letra_prohibida = letras_prohibidas_restantes[indice_letra_prohibida]
        letras_prohibidas_restantes.splice(indice_letra_prohibida, 1);
        if(letras_prohibidas_restantes.length == 0){
            letras_prohibidas_restantes = [...letras_prohibidas];
        }

        listener_cambio_letra_palabra = setTimeout(nueva_letra_prohibida, TIEMPO_CAMBIO_LETRA);

        definicion.style.fontSize = "1.5vw";
        palabra.style.backgroundColor = "red";
        explicación.style.color = "red";
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("input", listener_modo);

        explicación.innerHTML = "NIVEL LETRA MALDITA";
        palabra.innerHTML = "LETRA MALDITA: " + letra_prohibida;
        definicion.innerHTML = "";
        //////socket.emit("nueva_palabra_musa", player);
    },

    "letra bendita": function (data) {
        reproducirAudioModo("letra bendita");
        indice_letra_bendita = Math.floor(Math.random() * letras_benditas_restantes.length);
        letra_bendita = letras_benditas_restantes[indice_letra_bendita]
        letras_benditas_restantes.splice(indice_letra_bendita, 1);
        if(letras_benditas_restantes.length == 0){
            letras_benditas_restantes = [...letras_benditas];
        }
        listener_cambio_letra_palabra = setTimeout(nueva_letra_bendita, TIEMPO_CAMBIO_LETRA);

        definicion.style.fontSize = "1.5vw";
        palabra.style.backgroundColor= "lime";
        explicación.style.color = "lime";
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        explicación.innerHTML = "NIVEL LETRA BENDITA";
        palabra.innerHTML = "LETRA BENDITA: " + letra_bendita;
        definicion.innerHTML = "";
        //////socket.emit("nueva_palabra_musa", player);
    },

    "texto borroso": function (data) {
        tiempo_inicial = new Date();
        duracion = data.duracion;
        if(es_pausa == false){
            modo_borroso(data);
        }
        else{
            modo_borroso_pausa(data);
        }
    },

    "psicodélico": function (data) {
        //explicación.innerHTML = "NIVEL PSICODÉLICO";
        //palabra1.innerHTML = "";
        //definicion1.innerHTML = "";
        listener_modo_psico = function () { modo_psicodélico() };
        texto.addEventListener("keyup", listener_modo_psico);
        activado_psico = true;
        /*socket.on("psico_a_j1", (data) => {
            stylize();
        });*/
    },

    'tertulia': function (socket) {
        reproducirAudioModo("tertulia");
        es_pausa = true;
        tiempo_restante = TIEMPO_BORRADO - (new Date().getTime() - tiempo_inicial.getTime());
        pausa();
        explicación.style.color = "blue";
        explicación.innerHTML = "NIVEL TERTULIA";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
    },

    'palabras prohibidas': function (data) {
        reproducirAudioModo("palabras prohibidas");
        palabra.style.backgroundColor = "pink";
        explicación.style.color = "pink";
        explicación.innerHTML = "NIVEL PALABRAS MALDITAS";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        palabras_top_usadas.clear();
        nueva_palabra_prohibida()

    },

    'frase final': function (socket) {
        reproducirAudioModo("frase final");
        explicación.style.color = "orange";
        palabra.style.backgroundColor = "orange";
        explicación.innerHTML = "NIVEL FRASE FINAL";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        frase_final();
    },

    "": function (data) { },
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        //////socket.off(enviar_palabra);
        asignada = false;
        texto.removeEventListener("keyup", listener_modo);
        definicion.style.fontSize = "1.5vw";
        clearTimeout(listener_cambio_letra_palabra);

    },

    "letra prohibida": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        clearTimeout(listener_cambio_letra_palabra);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        letra_bendita = "";
        clearTimeout(listener_cambio_letra_palabra);

    },

    "borroso": function (data) {
        texto.classList.remove("textarea_blur");
    },

    "psicodélico": function (data) {
        //socket.off('psico_a_j1');
        texto.removeEventListener("keyup", listener_modo_psico);
        activado_psico = false;
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
    },

    "tiempo_borrado_más": function (data){ },
    
    "tertulia": function (data) {
        es_pausa = false;
        reanudar();
    },

    "palabras prohibidas": function (data) {
        //////socket.off(enviar_palabra);
        asignada = false;
        texto.removeEventListener("keyup", listener_modo);
        clearTimeout(listener_cambio_letra_palabra);
        palabras_top_usadas.clear();

    },

    "frase final": function (data) {
        texto.removeEventListener("keyup", listener_modo);
    },

    "": function (data) { },
};

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto.addEventListener("input", (evt) => {
    countChars(texto);
});

// Recibe los datos del jugador 1 y los coloca.
/*socket.on(texto_x, (data) => {
    texto.innerText = data.text;
    puntos.innerHTML = data.points;
    nivel.innerHTML = data.level;
    texto.scrollTop = texto.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
});
*/

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
function count(data){
    if(data.player == player){
    if (convertirASegundos(data.count) >= 20) {
        tiempo.style.color = "white";
    }
    if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
        console.log(convertirASegundos(data.count))
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "yellow";
    }
    if (10 > convertirASegundos(data.count) && activado_psico == false) {
        MODOS["psicodélico"](data, socket);
        tiempo.style.color = "red";
    }

    tiempo.innerHTML = data.count;
    actualizarBarraVida(tiempo, data.count);
    if (data.count == "¡Tiempo!") {
        limpiar_bloqueo_putada();
        limpiar_teclado_lento();
        console.log(putada_actual, "esto no doebería ocurrir")
        if (putada_actual == "🙃"){
            console.log("NO PUEDOOOOO ESTO NO DEBERÍA OCURRRIR")
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.removeEventListener('animationend', arguments.callee);
            });
            clearTimeout(tempo_text_inverso);
            temp_text_inverso_activado = false;
            procesarTexto();
        }
        
        if (modo_actual != "" && modo_actual != "frase final") {
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "white";
            pararEscritura = true;
            stopConfetti();
            clearTimeout(listener_cuenta_atras);
            clearInterval(timer);  
            clearTimeout(sub_timer);
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            if(temp_text_inverso_activado == true){
                temp_text_inverso_activado = false;
                clearTimeout(tempo_text_inverso);
                procesarTexto();
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            texto_guardado = texto.innerText;
        
            //texto.innerText = "";
            texto.style.display = "none";
            texto.style.height = "";
            texto.rows =  "6";
            definicion.style.fontSize = "1.5vw";
            temas.innerHTML = "";
            temas.display = "";
            texto.contentEditable= "false";
            palabra.innerHTML = "";
            definicion.innerHTML = "";
            explicación.innerHTML = "";
            menu_modificador = false;
            focusedButtonIndex = 0;
            modificadorButtons = [];

            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
        
            // Desactiva el blur de ambos textos.
            blurreado = false;
            texto.classList.remove("textarea_blur");
        
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            puntos_palabra = 0;
            puntos_ = 0;
            puntos_letra_prohibida = 0;
            puntos_letra_bendita = 0;
        
            letra_prohibida = "";
            letra_bendita = "";
            asignada = false;
            palabra_actual = []; // Variable que almacena la palabra bonus actual.            
            // Desactiva, por seguridad, todos los modos.
            modo_texto_borroso = 0;
            desactivar_borrar = true;
            console.log(puntos)
            
            feedback.innerHTML = "";
            
            definicion.innerHTML = "";
            explicación.innerHTML = "";
        
            caracteres_seguidos = 0;
            
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            for (let key in LIMPIEZAS) { 
                console.log(key)
                LIMPIEZAS[key]();
                console.log(texto.innerHTML)
                console.log(temp_text_inverso_activado)
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
        
            clearTimeout(borrado);
            clearTimeout(cambio_palabra);
            clearTimeout(tempo_text_borroso);
        }
        console.log(data)
        console.log("MIERDA PUTA")
        console.log(texto.innerHTML)
        console.log(temp_text_inverso_activado)
        if (!terminado) {
            if (puedeResucitarSegunEstado()) {
                iniciarMenu();
            } else {
                btnNo.click();
            }
        }
        }
    }
};
  
function resucitar(){
    terminado = false;
    desactivar_borrar = false;
    logo.style.display = "none"; 
    neon.style.display = "none"; 
    tiempo.innerHTML = "";
    tiempo.style.display = "";
    actualizarBarraVida(tiempo, "");

    pararEscritura = true;
    stopConfetti();
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);  
    clearTimeout(sub_timer);
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    if(temp_text_inverso_activado == true){
        clearTimeout(tempo_text_inverso);
        temp_text_inverso_activado = false;
        procesarTexto();
    }

    texto.innerText = texto_guardado;
    texto.style.display = "";
    texto.style.height = "";
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    console.log(modo_actual)
    if(modo_actual != "tertulia"){
    texto.contentEditable= "false";
    }
    //puntos.innerHTML = 0 + " palabras";
    //nivel.innerHTML = "nivel 0";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");
    
    // Desactiva, por seguridad, todos los modos.
    console.log(puntos)

    caracteres_seguidos = 0;
        texto.innerText = texto_guardado.trim();

        

        // Obtener el último nodo de texto en texto
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el último nodo de texto, colocamos el cursor allí
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        texto.scrollTo(0, texto.scrollHeight);
}
// Inicia el juego.
function inicio() {
    if (typeof atributos !== 'undefined' && atributos) {
        const total = Object.values(atributos).reduce((a, b) => a + b, 0);
        if (Number.isFinite(total) && total !== LIMITE_TOTAL) {
            if (typeof feedback !== 'undefined' && feedback) {
                feedback.style.color = 'orange';
                feedback.innerHTML = 'Reparte los 10 puntos de habilidad para empezar';
                if (typeof animateCSS === 'function') {
                    clearTimeout(delay_animacion);
                    animateCSS('.feedback1', 'flash').then(() => {
                        delay_animacion = setTimeout(function () {
                            feedback.innerHTML = '';
                        }, 2000);
                    });
                } else {
                    setTimeout(() => {
                        feedback.innerHTML = '';
                    }, 2000);
                }
            }
            return;
        }
    }
    aplicarAtributos();

    actualizarVariables()
    rellenarListaModos()
    animateCSS(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "none";
        btnEscribir.style.display = "none";
        btnLimpiar.style.display = "";
        btnDescargarTexto.style.display = "none" 
        btnPantallaCompleta.style.display = ""
        btnFinal.style = "" 
        btnVolver.style.display = "none";
        animateCSS(".botones", "backInLeft")
    });

    animateCSS(".contenedor", "backOutLeft").then((message) => {
        animateCSS(".contenedor", "pulse");

    limpieza();
    modos_restantes = [...LISTA_MODOS];
    palabras_prohibidas_restantes = [...palabras_prohibidas];

    desactivar_borrar = false;
    texto.style.height = "";

    logo.style.display = "none"; 
    neon.style.display = "none"; 
    texto.contentEditable= "false";
    tiempo.innerHTML = "";
    tiempo.style.display = "";
    actualizarBarraVida(tiempo, "");

    detenerTodoAudioJuego();
    reproducirSfx(AUDIO_CUENTA_ATRAS_INICIO, 0.9);

    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADX?</span>'); 
    preparados.appendTo($('.container'));
    setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);

    setTimeout(() => {
    var counter = 3;
  
    timer = setInterval(function() {
      
      $('#countdown').remove();

      if (counter >= 0 && counter <= 3) {
        const indiceAudio = 3 - counter;
        if (indiceAudio >= 0 && indiceAudio < AUDIOS_CUENTA_ATRAS.length) {
          reproducirSfx(AUDIOS_CUENTA_ATRAS[indiceAudio], 0.9);
        }
      }
      
      var countdown = $('<span id="countdown">'+(counter==0?'¡ESCRIBE!':counter)+'</span>'); 
      countdown.appendTo($('.container'));  
      sub_timer = setTimeout(() => {
        if (counter > -1) {
          $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
        } else {
            post_inicio(false);
          $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        }
      }, 20);
  
      counter--;
  
      if (counter <= -1) {
        clearInterval(timer);
        setTimeout(() => {
          $('#countdown').remove();
        }, 1000);
      }
    }, 1000);
}, 1000);
});
};

//////socket.on("post-inicio", (data) => {
//////    console.log(data.borrar_texto, "borrar texto")
//////    post_inicio(data.borrar_texto);
//////});    

function post_inicio(borrar_texto){
    clearTimeout(timer);
        if (borrar_texto == false) {
            texto.innerText = texto_guardado.trim();

            

            // Obtener el último nodo de texto en texto
            let lastLine = texto.lastChild;
            let lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                let caretNode = lastTextNode;
                let caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            texto.scrollTo(0, texto.scrollHeight);
            }
        
        //socket.off("recibe_temas");
        texto.contentEditable= "true";
        texto.focus();
        animateCSS(".explicación", "bounceInLeft");
        animateCSS(".palabra", "bounceInLeft");
        animateCSS(".definicion", "bounceInLeft");
        resetResumenPartida();
        resetHeatmap();
        startCountDown(TIEMPO_INICIAL/1000)
        temp_modos()
}

function startCountDown(duration) {

    secondsRemaining = duration;
    registrarTiempoControl(1, secondsRemaining);
    let min = parseInt(secondsRemaining / 60, 10);
    let sec = parseInt(secondsRemaining % 60, 10);
    count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    tiempo.textContent = count;
    tiempo.style.color = "white";
    actualizarBarraVida(tiempo, count);

    clearInterval(countInterval);
    countInterval = setInterval(function () {
        if (desventajaEnCurso) {
            return;
        }
        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        actualizarBarraVida(tiempo, count);
        registrarTiempoControl(1, secondsRemaining);
        if (secondsRemaining == 20) {
            tiempo.style.color = "yellow"
        }
        if (secondsRemaining == 10) {
            tiempo.style.color = "red"
        }
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining <= 0) {
            final();
        };

    }, 1000);
}

function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function addSeconds(secs) {
    if (secs > 0) {
        reproducirSfx(AUDIO_GANAR_TIEMPO, 1);
    } else if (secs < 0) {
        reproducirSfx(AUDIO_PERDER_TIEMPO, 1);
    }
    secondsRemaining += secs;
    if(secondsRemaining < 0){
        secondsRemaining = 0;
    }  
    min = parseInt(secondsRemaining / 60);
    sec = parseInt(secondsRemaining % 60);

    tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    actualizarBarraVida(tiempo, count);
    registrarTiempoControl(1, secondsRemaining);
}

// Resetea el tablero de juego.
function limpiar(borrar){
    animateCSS(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "";
        btnEscribir.style.display = "";
        //btnDescargarTexto.style.display = "" 
        btnPantallaCompleta.style.display = "" 
        btnFinal.style.display = "none" 
        animateCSS(".botones", "backInLeft")
    });


    if(borrar == false){
        texto_guardado = texto.innerText;
    }

    limpieza();

    stopConfetti()
    
    texto.rows =  "1";

    modo_actual = "";
    putada_actual = "";

    temas.innerHTML = "";
    
    texto.contentEditable= "false";

    tiempo.style.display = "none";
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    });
    logo.style.display = "";
    neon.style.display = ""; 
    texto.removeEventListener("keyup", listener_modo_psico);
    texto.removeEventListener("keyup", listener_modo1);

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    restablecer_estilo();
};

function activar_modo (data){
    animacion_modo();
    palabra.innerHTML = "";
    explicación.innerHTML = "";
    LIMPIEZAS[modo_actual](data);
    rapidez_borrado -= 200;
    rapidez_inicio_borrado -= 200;
    modo_actual = data.modo_actual;
    if(terminado == false){
    MODOS[modo_actual](data, socket);
    }
};

function pausar_js (data){
    es_pausa = true;
    LIMPIEZAS[modo_actual](data);
    tiempo_restante = TIEMPO_BORRADO - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
};


function nueva_letra (letra) {
    palabra_actual = []
    definicion.innerHTML = "";
    if(modo_actual == "letra prohibida"){
        letra_prohibida = letra;

        texto.removeEventListener("beforeinput", listener_modo);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("beforeinput", listener_modo);
        animacion_palabra();
        palabra.innerHTML = "LETRA PROHIBIDA: " + letra_prohibida;
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = letra;
        texto.removeEventListener("beforeinput", listener_modo);
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo);
        animacion_palabra();
        palabra.innerHTML = "LETRA BENDITA: " + letra_bendita;
    }
};

async function recibir_palabra() {
    data = await getRandomSpanishWord();
    console.log(data)
    if (data) {
      console.log(`
        <h2>Palabra: ${data.title}</h2>
        <p>Definición: ${data.definicion}</p>
      `);
      
    } else {
      document.getElementById('resultado').textContent = 'Hubo un error';
    }
    animacion_modo();
    palabra_actual = [data.title];
    tiempo_palabras_bonus = puntuación_palabra(data.title);
    palabra.innerHTML = data.title + " (⏱️+" + tiempo_palabras_bonus + " segs.)" ;
    definicion.innerHTML = data.definicion;

    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    asignada = true;
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto.addEventListener("keyup", listener_modo);
    clearTimeout(listener_cambio_letra_palabra)
    listener_cambio_letra_palabra = setTimeout(recibir_palabra, TIEMPO_CAMBIO_PALABRA);
}

function nueva_palabra_prohibida() {
    const top = obtener_top_palabras_malditas(texto.innerText, TOP_K_PALABRAS_MALDITAS);
    let palabra_elegida = top.find(palabra => !palabras_top_usadas.has(palabra));

    if (palabra_elegida) {
        palabras_top_usadas.add(palabra_elegida);
        palabra_bonus = [[palabra_elegida], [""]];
    } else {
        indice_palabra = Math.floor(Math.random() * palabras_prohibidas_restantes.length);
        palabra_bonus = [[palabras_prohibidas_restantes[indice_palabra]], [""]];
        palabras_prohibidas_restantes.splice(indice_palabra, 1);
        if(palabras_prohibidas_restantes.length == 0){
            palabras_prohibidas_restantes = [...palabras_prohibidas];
        }
    }

    palabras_var = palabra_bonus[0];
    tiempo_palabras_bonus = puntuación_palabra(palabra_bonus[0][0]);
        
    console.log(palabra_bonus, palabras_var, tiempo_palabras_bonus)
    animacion_modo();
    palabra_actual = palabra_bonus[0];
    palabra.innerHTML = palabras_var + " (⏱️-" + tiempo_palabras_bonus + " segs.)";

    definicion.innerHTML = palabra_bonus[1];
    tiempo_palabras_bonus = tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo);
    asignada = true;
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
    texto.addEventListener("keyup", listener_modo);
    clearTimeout(listener_cambio_letra_palabra)
    listener_cambio_letra_palabra = setTimeout(nueva_palabra_prohibida, TIEMPO_CAMBIO_PALABRA);
}

function frase_final() {

    str_frase_final = frases_finales[Math.floor(Math.random() * frases_finales.length)];
    console.log("\""+str_frase_final+"\"")
    animacion_modo();
    palabra.innerHTML = "\""+str_frase_final+"\"";
    definicion.innerHTML = "⬆️ ¡Introduce la frase final para ganar! ⬆️"
    limpiarMarcadoFraseFinal();

    texto.removeEventListener("keyup", listener_modo);
    listener_modo = function (e) { modo_frase_final(e) };
    texto.addEventListener("keyup", listener_modo);
}

// FUNCIONES AUXILIARES.

   /*************************************************************
      VARIABLES GLOBALES Y REFERENCIAS A ELEMENTOS DEL DOM
    **************************************************************/
      const mainMenu = document.getElementById('mainMenu');
      const quantityMenu = document.getElementById('quantityMenu');
  
      const btnSi = document.getElementById('btnSi');
      const btnNo = document.getElementById('btnNo');
      const mainMenuButtons = [btnSi, btnNo];
      let mainMenuIndex = 0;
  
      const quantityDisplay = document.getElementById('quantityDisplay');
      const btnConfirmar = document.getElementById('btnConfirmar');
      const btnAtras = document.getElementById('btnAtras');
      let quantityMenuElements = [quantityDisplay, btnConfirmar, btnAtras];
      let quantityMenuIndex = 0;
  
      let palabras = 1;
      const PALABRAS_A_SEGUNDOS = 3;
      let currentMenu = 'main';

      function contarPalabrasTexto(textoBase) {
        const matches = (textoBase || "").match(/\b\w+\b/g);
        return matches ? matches.length : 0;
      }

      function puedeResucitarSegunEstado() {
        return modo_actual !== "frase final" && contarPalabrasTexto(texto_guardado) > 0;
      }

      /*************************************************************
        ACTUALIZACIONES DE ESTADO VISUAL
      **************************************************************/
      function actualizarSeleccionMainMenu() {
        mainMenuButtons.forEach(btn => btn.classList.remove('selected'));
        mainMenuButtons[mainMenuIndex].classList.add('selected');
        mainMenuButtons[mainMenuIndex].focus();
      }
  
      function actualizarSeleccionQuantityMenu() {
        quantityMenuElements.forEach(el => el.classList.remove('selected'));
        quantityMenuElements[quantityMenuIndex].classList.add('selected');
        if (quantityMenuIndex === 1) btnConfirmar.focus();
        if (quantityMenuIndex === 2) btnAtras.focus();
      }
  
      function actualizarTextoCantidad() {
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        quantityDisplay.innerHTML = `<span style="color: yellow;">${palabras} palabra(s)</span> => <span style="color: green;">${segundos} segundo(s)</span>`;

      }
      
      
      function recortarUltimasPalabras(text, cantidadPalabras) {
        if (cantidadPalabras <= 0) {
          return text;
        }
        
        let endPos = text.length; // posición hasta la que mantenemos el texto
        let palabrasEliminadas = 0;
  
        while (palabrasEliminadas < cantidadPalabras) {
          // 1. Ignorar espacios y saltos de línea desde el final (si los hay)
          while (endPos > 0 && /\s/.test(text[endPos - 1])) {
            endPos--;
          }
          if (endPos <= 0) {
            // Si se quedó sin texto, todo se elimina
            return '';
          }
  
          // 2. Retroceder hasta el inicio de la palabra previa
          let inicioPalabra = endPos - 1;
          while (inicioPalabra >= 0 && !/\s/.test(text[inicioPalabra])) {
            inicioPalabra--;
          }
  
          // Ajustamos endPos al inicio de esta palabra (para recortarla)
          endPos = inicioPalabra >= 0 ? inicioPalabra + 1 : 0;
          palabrasEliminadas++;
  
          if (endPos <= 0) {
            return '';
          }
        }
  
        // 3. Retornar sólo la parte que no recortamos, con la estructura intacta
        return text.substring(0, endPos);
      }

      function mostrarMenuQuantity() {
        mainMenu.style.display = 'none';
        quantityMenu.style.display = 'block';
        currentMenu = 'quantity';
        quantityMenuIndex = 0;
        actualizarTextoCantidad();
        actualizarSeleccionQuantityMenu();
      }
  
      function mostrarMenuPrincipal() {
        quantityMenu.style.display = 'none';
        mainMenu.style.display = 'block';
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
      }

      function iniciarMenu() {
        if (!puedeResucitarSegunEstado()) {
          btnNo.click();
          return;
        }
        console.log("Iniciando menú");


        document.addEventListener('keydown', manejadorTeclas);
        animateCSS(".mainMenu", "flash");
        mainTitle.innerHTML = '<span style="color: red;">GAME OVER</span><br><br> ¿QUIERES <span style="color: lime">RESUCITAR</span> A CAMBIO DE <span style="color: yellow;">PALABRAS</span>?';
        mainMenu.style.display = 'block';
        mainTitle.style.display = 'block';
        buttonContainer.style.display = 'flex';
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        timeoutID_menu = setTimeout(() => {
            // Si seguimos en el menú (por ejemplo, no hubo otra acción), ejecuta el clic:
            console.log("Tiempo cumplido. Se hace clic automático en botón NO.");
            btnNo.click(); 
          }, 30000);
      }
  
      /*************************************************************
        EVENTOS DE CLICK PARA LOS BOTONES CON stopPropagation()
      **************************************************************/
      btnSi.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se active el listener global
        if (!puedeResucitarSegunEstado()) {
          btnNo.click();
          return;
        }
        mostrarMenuQuantity();
      });
  
      btnNo.addEventListener('click', (evento) => {
        evento.stopPropagation();
        texto.innerText = texto_guardado;
        tiempo.style.color = "white";
        if (terminado == false) {
          final();
          setTimeout(function () {
            texto.style.height = "";
            texto.rows = "1";
            texto.style.display = "none";
            //texto.innerText = texto_guardado;
            
            tiempo.style.color = "white";
          }, 2000);
        }
        animateCSS(".tiempo", "bounceInLeft");
        tiempo.innerHTML = "¡GRACIAS POR JUGAR!";
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }

        document.removeEventListener('keydown', manejadorTeclas);
                
        // Lógica para finalizar el juego.
      });
      
  
      btnConfirmar.addEventListener('click', (evento) => {
        evento.stopPropagation();
        clearTimeout(timeoutID_menu);
        socket.emit("resucitar", {player: player, secs: palabras * PALABRAS_A_SEGUNDOS});

        // Recortar las últimas "palabras" de "texto_guardado"
        console.log("texto_guardado", palabras);
        console.log("texto_guardado", texto_guardado);

        texto_guardado = recortarUltimasPalabras(texto_guardado, palabras);

        console.log("texto_guardado", texto_guardado);

        // Ocultar los menús para que no se vean más
        resucitar()
        mainMenu.style.display = 'none';
        quantityMenu.style.display = 'none';
        mainTitle.style.display = 'none';
        buttonContainer.style.display = 'none';
        
        document.removeEventListener('keydown', manejadorTeclas);

        post_inicio(false)
      });
  
      btnAtras.addEventListener('click', (evento) => {
        evento.stopPropagation();
        mostrarMenuPrincipal();
      });
  
      /*************************************************************
        EVENTO DE TECLAS: FLECHAS Y ENTER
      **************************************************************/
      // Definimos la función manejadora de eventos de teclado.
function manejadorTeclas(evento) {
    evento.stopPropagation();
    if (currentMenu === 'main') {
      switch (evento.key) {
        case 'ArrowLeft':
          mainMenuIndex = 0;
          actualizarSeleccionMainMenu();
          break;
        case 'ArrowRight':
          mainMenuIndex = 1;
          actualizarSeleccionMainMenu();
          break;
        default:
          break;
      }
    } else if (currentMenu === 'quantity') {
      switch (evento.key) {
        case 'ArrowLeft':
          quantityMenuIndex--;
          if (quantityMenuIndex < 0) {
            quantityMenuIndex = quantityMenuElements.length - 1; 
          }
          actualizarSeleccionQuantityMenu();
          break;
        case 'ArrowRight':
          quantityMenuIndex++;
          if (quantityMenuIndex >= quantityMenuElements.length) {
            quantityMenuIndex = 0;
          }
          actualizarSeleccionQuantityMenu();
          break;
        case 'ArrowUp':
          if (quantityMenuIndex === 0) {
            palabras++;
            actualizarTextoCantidad();
          }
          break;
        case 'ArrowDown':
          if (quantityMenuIndex === 0 && palabras > 1) {
            palabras--;
            actualizarTextoCantidad();
          }
          break;
        case 'Enter':
          if (quantityMenuIndex === 1) {
            btnConfirmar.click();
          } else if (quantityMenuIndex === 2) {
            btnAtras.click();
          }
          break;
        default:
          break;
      }
    }
  }


function getRandColor() {
    var hex = "01234567890ABCDEF",
        res = "#";
    for (var i = 0; i < 6; i += 1) {
        res += hex[Math.floor(Math.random() * hex.length)];
    }
    return res;
}

function getRandNumber(s, e) {
    return Math.floor(Math.random() * (e - s + 1)) + s;
}

function getRandFontFamily() {
    var fontFamilies = [
        "Impact",
        "Georgia",
        "Tahoma",
        "Verdana",
        "Impact",
        "Marlet",
    ]; // Add more
    return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
}

function getTextAlign() {
    var aligns = ["center", "left", "right", "justify"]; // Add more
    return aligns[Math.floor(Math.random() * aligns.length)];
}

function stylize() {
    texto.style.color = getRandColor();
    document.body.style.backgroundColor = getRandColor();
    document.body.style.backgroundColor = getRandColor();
}

function animacion_modo() {
    const animateCSS = (element, animation, prefix = "animate__") =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

function animacion_palabra() {
    const animateCSS = (element, animation, prefix = "animate__") =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    animateCSS(".palabra", "bounceInLeft");
}

// Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
function restablecer_estilo() {
    texto.style.color = "white";
    document.body.style.backgroundColor = "black";
}

const CLASE_PALABRA_BENDITA_LOCAL = "palabra-bendita";
const CLASE_LETRA_BENDITA_LOCAL = "letra-verde";
const SELECTOR_PALABRA_PROTEGIDA = `.${CLASE_PALABRA_BENDITA_LOCAL}, .${CLASE_LETRA_BENDITA_LOCAL}`;
const SELECTOR_PALABRA_MARCADA = `.${CLASE_PALABRA_BENDITA_LOCAL}`;

function rangoIntersecaPalabraMarcada(rango) {
    if (!texto || !rango) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_MARCADA);
    for (const span of spans) {
        if (rango.intersectsNode(span)) return true;
    }
    return false;
}

function nodoEnPalabraBendita(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.ELEMENT_NODE) {
        return nodo.closest(SELECTOR_PALABRA_PROTEGIDA);
    }
    if (nodo.nodeType === Node.TEXT_NODE) {
        return nodo.parentElement?.closest(SELECTOR_PALABRA_PROTEGIDA) || null;
    }
    return null;
}

function rangoIntersecaPalabraBendita(rango) {
    if (!texto || !rango) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
    for (const span of spans) {
        if (rango.intersectsNode(span)) return true;
    }
    return false;
}

function hayPalabraBenditaAdyacente(sel, direccion) {
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return rangoIntersecaPalabraBendita(range);
    const node = range.startContainer;
    const offset = range.startOffset;
    if (nodoEnPalabraBendita(node)) return true;
    let objetivo = null;
    if (node.nodeType === Node.TEXT_NODE) {
        if (direccion === "backward" && offset === 0) {
            objetivo = node.previousSibling || node.parentNode?.previousSibling;
        }
        if (direccion === "forward" && offset === node.textContent.length) {
            objetivo = node.nextSibling || node.parentNode?.nextSibling;
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        const indice = direccion === "backward" ? offset - 1 : offset;
        objetivo = node.childNodes[indice];
    }
    return Boolean(nodoEnPalabraBendita(objetivo));
}

function obtenerRangoBorradoCaracter(direccion) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const original = sel.getRangeAt(0).cloneRange();
    if (!original.collapsed) return original;
    if (typeof sel.modify === "function") {
        sel.removeAllRanges();
        sel.addRange(original);
        sel.collapse(original.endContainer, original.endOffset);
        sel.modify("extend", direccion, "character");
        const rango = sel.getRangeAt(0).cloneRange();
        sel.removeAllRanges();
        sel.addRange(original);
        return rango;
    }
    return null;
}

function obtenerOffsetInicioNodo(nodo) {
    if (!texto || !nodo) return 0;
    const range = document.createRange();
    range.selectNodeContents(texto);
    range.setEndBefore(nodo);
    return range.toString().length;
}

function caretAfectaPalabraBendita(direccion) {
    if (!texto) return false;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return rangoIntersecaPalabraBendita(range);
    const caretOffset = obtenerOffsetCaretEnTexto();
    const targetOffset = direccion === "backward" ? caretOffset - 1 : caretOffset;
    if (targetOffset < 0) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
    for (const span of spans) {
        const inicio = obtenerOffsetInicioNodo(span);
        const fin = inicio + (span.textContent || "").length;
        if (targetOffset >= inicio && targetOffset < fin) return true;
    }
    return false;
}

let snapshot_html_bendita = null;
let snapshot_offset_bendita = null;
let snapshot_cantidad_benditas = 0;
let restaurando_bendita = false;

function moverCursorPorPalabraBendita(direccion) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;
    let span = nodoEnPalabraBendita(range.startContainer);
    if (!span) {
        const node = range.startContainer;
        const offset = range.startOffset;
        let candidato = null;
        if (node.nodeType === Node.TEXT_NODE) {
            if (direccion === "forward" && offset === node.textContent.length) {
                candidato = node.nextSibling || node.parentNode?.nextSibling;
            } else if (direccion === "backward" && offset === 0) {
                candidato = node.previousSibling || node.parentNode?.previousSibling;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const indice = direccion === "forward" ? offset : offset - 1;
            candidato = node.childNodes[indice];
        }
        if (candidato) {
            span = nodoEnPalabraBendita(candidato);
        }
    }
    if (!span) return false;
    const nuevoRango = document.createRange();
    if (direccion === "forward") {
        nuevoRango.setStartAfter(span);
    } else {
        nuevoRango.setStartBefore(span);
    }
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
    return true;
}

function debeBloquearEdicionPalabraBendita(e) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    const rangosObjetivo = typeof e.getTargetRanges === "function" ? e.getTargetRanges() : [];
    if (rangosObjetivo && rangosObjetivo.length) {
        for (const rango of rangosObjetivo) {
            if (rangoIntersecaPalabraBendita(rango)) return true;
        }
    }
    if (range.collapsed) {
        if (nodoEnPalabraBendita(range.startContainer)) return true;
    } else if (rangoIntersecaPalabraBendita(range)) {
        return true;
    }
    if (e.inputType && e.inputType.startsWith("delete")) {
        const direccion = e.inputType.includes("Forward") ? "forward" : "backward";
        if (caretAfectaPalabraBendita(direccion)) return true;
        const rangoBorrado = obtenerRangoBorradoCaracter(direccion);
        if (rangoBorrado && rangoIntersecaPalabraBendita(rangoBorrado)) {
            return true;
        }
        if (hayPalabraBenditaAdyacente(sel, direccion)) return true;
    }
    return false;
}

function obtenerRangoPorOffsets(contenedor, inicio, fin) {
    if (!contenedor || inicio >= fin) return null;
    const walker = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT, null, false);
    let pos = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const length = node.textContent.length;
        const nodeEnd = pos + length;
        if (!startNode && inicio <= nodeEnd) {
            startNode = node;
            startOffset = Math.max(0, Math.min(length, inicio - pos));
        }
        if (startNode && fin <= nodeEnd) {
            endNode = node;
            endOffset = Math.max(0, Math.min(length, fin - pos));
            break;
        }
        pos = nodeEnd;
    }
    if (!startNode || !endNode) return null;
    const rango = document.createRange();
    rango.setStart(startNode, startOffset);
    rango.setEnd(endNode, endOffset);
    return rango;
}

let progreso_frase_final_intensidad = 0;
let progreso_frase_final_ultimo_match = 0;

function estiloProgresoFraseFinal(intensidad) {
    const t = Math.max(0, Math.min(1, intensidad));
    const saturation = Math.round(t * 100);
    const lightness = Math.round(96 - (t * 40));
    const glowSize = (0.08 + (t * 0.6)).toFixed(2);
    const glowAlpha = (0.03 + (t * 0.6)).toFixed(2);
    return {
        color: `hsl(32, ${saturation}%, ${lightness}%)`,
        textShadow: `0 0 ${glowSize}em rgba(255, 140, 0, ${glowAlpha})`,
    };
}

function limpiarMarcadoFraseFinal() {
    if (!texto) return;
    const spans = texto.querySelectorAll(".frase-final-progreso");
    spans.forEach((span) => {
        const parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
        parent.normalize();
    });
    progreso_frase_final_intensidad = 0;
    progreso_frase_final_ultimo_match = 0;
}

function animarFalloFraseFinal() {
    if (!texto) return;
    texto.classList.remove("frase-final-fallo");
    void texto.offsetWidth;
    texto.classList.add("frase-final-fallo");
    texto.addEventListener(
        "animationend",
        () => texto.classList.remove("frase-final-fallo"),
        { once: true }
    );
}

function obtenerOffsetCaretEnTexto() {
    if (!texto) return 0;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return 0;
    const range = sel.getRangeAt(0).cloneRange();
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(texto);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
}

function colocarCaretEnOffset(offset) {
    if (!texto) return;
    const walker = document.createTreeWalker(texto, NodeFilter.SHOW_TEXT, null, false);
    let pos = 0;
    let ultimoNodo = null;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        ultimoNodo = node;
        const length = node.textContent.length;
        if (offset <= pos + length) {
            const range = document.createRange();
            range.setStart(node, Math.max(0, offset - pos));
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        pos += length;
    }
    if (ultimoNodo) {
        const range = document.createRange();
        range.setStart(ultimoNodo, ultimoNodo.textContent.length);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

function obtenerRangoUltimosCaracteres(cantidad) {
    if (!texto || cantidad <= 0) return null;
    const sel = window.getSelection();
    if (!sel) return null;
    const original = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const range = document.createRange();
    range.selectNodeContents(texto);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    let resultado = null;
    if (typeof sel.modify === "function") {
        for (let i = 0; i < cantidad; i++) {
            sel.modify("extend", "backward", "character");
        }
        resultado = sel.getRangeAt(0).cloneRange();
    } else {
        const textoPlano = texto.textContent || "";
        const inicio = Math.max(0, textoPlano.length - cantidad);
        resultado = obtenerRangoPorOffsets(texto, inicio, inicio + cantidad);
    }
    sel.removeAllRanges();
    if (original) {
        sel.addRange(original);
    }
    return resultado;
}

function actualizarProgresoFraseFinal() {
    if (!texto) return;
    const objetivo = (typeof str_frase_final === "string" ? str_frase_final : "").toLowerCase();
    if (!objetivo) {
        limpiarMarcadoFraseFinal();
        return;
    }
    const textoPlano = (texto.innerText || "").toLowerCase();
    const max = Math.min(textoPlano.length, objetivo.length);
    let matchLen = 0;
    for (let len = max; len > 0; len--) {
        if (textoPlano.endsWith(objetivo.slice(0, len))) {
            matchLen = len;
            break;
        }
    }
    if (progreso_frase_final_ultimo_match > 0 && matchLen === 0) {
        animarFalloFraseFinal();
    }
    const caretOffset = obtenerOffsetCaretEnTexto();
    limpiarMarcadoFraseFinal();
    if (matchLen === 0) {
        colocarCaretEnOffset(caretOffset);
        return;
    }
    const rango = obtenerRangoUltimosCaracteres(matchLen);
    if (!rango) {
        colocarCaretEnOffset(caretOffset);
        return;
    }
    const span = document.createElement("span");
    span.className = "frase-final-progreso";
    const ratio = Math.max(0, Math.min(1, matchLen / objetivo.length));
    const intensidadObjetivo = Math.pow(ratio, 1.6);
    const estiloPrevio = estiloProgresoFraseFinal(progreso_frase_final_intensidad);
    const estiloObjetivo = estiloProgresoFraseFinal(intensidadObjetivo);
    span.style.color = estiloPrevio.color;
    span.style.textShadow = estiloPrevio.textShadow;
    try {
        rango.surroundContents(span);
    } catch (err) {
        const fragmento = rango.extractContents();
        span.appendChild(fragmento);
        rango.insertNode(span);
    }
    requestAnimationFrame(() => {
        if (!span.isConnected) return;
        span.style.color = estiloObjetivo.color;
        span.style.textShadow = estiloObjetivo.textShadow;
    });
    progreso_frase_final_intensidad = intensidadObjetivo;
    progreso_frase_final_ultimo_match = matchLen;
    colocarCaretEnOffset(caretOffset);
}


function marcarPalabraBenditaRango(inicio, fin) {
    if (!texto) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    if (!Number.isInteger(inicio) || !Number.isInteger(fin)) return;
    const rango = obtenerRangoPorOffsets(texto, inicio, fin);
    if (!rango) return;
    const contenido = rango.toString();
    if (!contenido || !contenido.trim()) return;
    if (rangoIntersecaPalabraMarcada(rango)) return;
    const span = document.createElement("span");
    span.className = CLASE_PALABRA_BENDITA_LOCAL;
    span.setAttribute("contenteditable", "false");
    const fragmento = rango.extractContents();
    span.appendChild(fragmento);
    rango.insertNode(span);
    const nuevoRango = document.createRange();
    nuevoRango.setStartAfter(span);
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
}


//Función auxiliar que comprueba que se inserta la palabra bonus.
function modo_palabras_bonus(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(e.target);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            let endingIndex = preCaretRange.toString().length;
            let startingIndex = 0; // Inicializacion
            const textContent = e.target.textContent || "";
            const esCaracterPalabra = (ch) => /[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]/.test(ch || "");
            const esSeparador = (ch) => !esCaracterPalabra(ch);

            while (endingIndex > 0 && esSeparador(textContent[endingIndex - 1])) {
                endingIndex -= 1;
            }

            // Calcula startingIndex: Retrocede hasta encontrar un delimitador o el inicio del texto
            for (let i = endingIndex - 1; i >= 0; i--) {
                if (esSeparador(textContent[i]) || i === 0) {
                    startingIndex = (i === 0 && !esSeparador(textContent[i])) ? i : i + 1;
                    break;
                }
            }

            // Ajusta endingIndex: Avanza hasta encontrar un delimitador o el final del texto
            for (let i = endingIndex; i <= textContent.length; i++) {
                if (i === textContent.length || esSeparador(textContent[i])) {
                    endingIndex = i;
                    break;
                }
            }

            console.log("Texto seleccionado:", textContent.substring(startingIndex, endingIndex)); // Debugging
            console.log("palabra_actual:", palabra_actual); // Debugging
            console.log("Indices:", startingIndex, endingIndex); // Debugging


        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            texto.focus();
            asignada = false;
            recibir_palabra()
            addSeconds(tiempo_palabras_bonus)
            feedback.innerHTML = "⏱️+" + tiempo_palabras_bonus + " segs.";
            clearTimeout(delay_animacion);
            color = color_positivo;
            feedback.style.color = color;
            tiempo_feed = "⏱️+" + tiempo_palabras_bonus + " segs.";
            insp = false;
            if (definicion.innerHTML.startsWith('<span style="color:lime;">MUSA</span>:')) {
                insp = true;
            }            
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            const palabraObjetivo = Array.isArray(palabra_actual)
                ? palabra_actual[0]
                : palabra_actual;
            const palabraLower = (palabraObjetivo || "").toLowerCase();
            const tokenLower = textContent
                .slice(startingIndex, endingIndex)
                .toLowerCase();
            let indiceMatch = -1;
            if (palabraLower) {
                indiceMatch = tokenLower.lastIndexOf(palabraLower);
            }
            const inicioMarca = indiceMatch >= 0
                ? startingIndex + indiceMatch
                : startingIndex;
            const finMarca = indiceMatch >= 0
                ? inicioMarca + palabraLower.length
                : endingIndex;
            marcarPalabraBenditaRango(inicioMarca, finMarca);
        }
    }
}


// Función que intercepta el uso de palabras malditas y aplica penalización.
function modo_palabras_prohibidas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
        let range = selection.getRangeAt(0);
        let preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        let endingIndex = preCaretRange.toString().length;
        let startingIndex = 0; // Inicialización
        let textContent = e.target.innerText;

        // Calcula startingIndex: retrocede hasta encontrar un delimitador o el inicio del texto
        for (let i = endingIndex - 1; i >= 0; i--) {
            if (textContent[i] === ' ' || textContent[i] === '\n' || i === 0) {
                startingIndex = (i === 0 && (textContent[i] !== ' ' && textContent[i] !== '\n')) ? i : i + 1;
                break;
            }
        }

        // Ajusta endingIndex: avanza hasta encontrar un delimitador o el final del texto
        for (let i = endingIndex; i <= textContent.length; i++) {
            if (textContent[i] === ' ' || textContent[i] === '\n' || i === textContent.length) {
                endingIndex = i;
                break;
            }
        }

        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            texto.focus();
            asignada = false;
            const palabraDetectada = (palabra_actual && palabra_actual.length && palabra_actual[0])
                ? palabra_actual[0]
                : textContent.substring(startingIndex, endingIndex);
            registrarIntentoPalabraProhibida(palabraDetectada);
            nueva_palabra_prohibida();
            const tiempo_penal = -Math.abs(tiempo_palabras_bonus);
            addSeconds(tiempo_penal);
            feedback.style.color = color_negativo;
            feedback.innerHTML = "⏱️" + tiempo_penal + " segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
        }
    }
}

/**
 * Función que intercepta la inserción de la "letra prohibida".
 * Si se detecta dicha letra, se elimina inmediatamente del contenido.
 *
 * Se asume que:
 * - toNormalForm(letra) normaliza la letra (por ejemplo, quita acentos).
 * - letra_prohibida es la letra prohibida (en minúscula).
 * - addSeconds(valor), puntos, puntos_, feedback, color_negativo, delay_animacion
 *   y animateCSS(selector, animacion) forman parte de la lógica para actualizar la UI y dar feedback.
 */
/**
 * Función que intercepta la inserción de la "letra prohibida" en un div contenteditable.
 * Si se detecta la inserción de dicha letra, se elimina inmediatamente.
 *
 * Se asume que:
 * - toNormalForm(letra) normaliza la letra (por ejemplo, quita acentos).
 * - letra_prohibida es la letra prohibida (en minúscula).
 * - addSeconds(valor), puntos, puntos_, feedback, color_negativo, delay_animacion
 *   y animateCSS(selector, animacion) forman parte de la lógica para actualizar la UI y dar feedback.
 */
function modo_letra_prohibida(e) {
  // Solo procesamos inserciones de texto
  if (e.inputType === "insertText") {
    // Capturamos la letra insertada; en la mayoría de navegadores e.data está definida.
    let letra = e.data;
    // Fallback para Safari: si e.data no está disponible, obtenemos la letra desde el nodo de texto
    if (!letra) {
      let sel = window.getSelection();
      if (sel.rangeCount > 0) {
        let node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE && sel.focusOffset > 0) {
          letra = node.textContent.charAt(sel.focusOffset - 1);
        }
      }
    }
    
    // Si la letra (normalizada) coincide con la letra prohibida, procedemos
      if (
      letra &&
      (
        (toNormalForm(letra) === letra_prohibida || toNormalForm(letra) === letra_prohibida.toUpperCase()) &&
        !(letra_prohibida.toLowerCase() === 'n' && (letra === 'ñ' || letra === 'Ñ'))
      )
    ) {
      // Usamos setTimeout para esperar a que el DOM se actualice con la inserción
      setTimeout(() => {
        let sel = window.getSelection();
        if (sel.rangeCount > 0) {
          let range = sel.getRangeAt(0);
          if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
            let node = range.startContainer;
            // Guardamos el offset original antes de modificar el contenido
            let originalOffset = range.startOffset;
            let textoActual = node.textContent;
            // Verificamos que el carácter justo antes del cursor sea la letra insertada
            if (textoActual.charAt(originalOffset - 1) === letra) {
              // Eliminamos el carácter prohibido del contenido
              let nuevoTexto = textoActual.substring(0, originalOffset - 1) + textoActual.substring(originalOffset);
              node.textContent = nuevoTexto;
              // Calculamos el nuevo offset, asegurándonos de que esté dentro de los límites
              let newOffset = originalOffset - 1;
              if (newOffset < 0) newOffset = 0;
              if (newOffset > node.textContent.length) newOffset = node.textContent.length;
              // Intentamos establecer el inicio del rango; en caso de error, lo ubicamos al final del nodo
              try {
                range.setStart(node, newOffset);
              } catch (err) {
                console.error("Error setting range start: ", err);
                range.setStart(node, node.textContent.length);
              }
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        }
      }, 0);
      
      // Actualiza la UI: penaliza (descuenta tiempo, actualiza puntos, muestra feedback)
      registrarIntentoLetraProhibida(letra_prohibida);
      addSeconds(-2);
      puntos.innerHTML = puntos_ + " palabras";
      feedback.style.color = color_negativo;
      feedback.innerHTML = "⏱️-2 segs.";
      clearTimeout(delay_animacion);
      animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(() => {
          feedback.innerHTML = "";
        }, 2000);
      });
    }
  }
}



function modo_frase_final(e) {

    actualizarProgresoFraseFinal();
    // Obtenemos el texto completo del elemento
    let textContent = e.target.innerText;
    // Convertimos a minúsculas y recortamos espacios (opcional pero recomendable):
    let textLower = textContent.trim().toLowerCase();
  
    // Definimos la frase final, también en minúscula y sin espacios sobrantes
    let fraseFinal = str_frase_final.trim().toLowerCase();
  
    // Revisamos si el texto termina exactamente con esa frase final:
    if (textLower.endsWith(fraseFinal)) {
      // Aquí va tu lógica de finalización
      e.target.innerText = textContent.trim() + ".";
      final();
    }
  }
  

function palabras_musas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(e.target);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            let endingIndex = preCaretRange.toString().length;
            let startingIndex = 0; // Inicialización
            let textContent = e.target.innerText;

            // Calcula startingIndex: Retrocede hasta encontrar un delimitador o el inicio del texto
            for (let i = endingIndex - 1; i >= 0; i--) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === 0) {
                    startingIndex = (i === 0 && (textContent[i] !== ' ' && textContent[i] !== '\n')) ? i : i + 1;
                    break;
                }
            }

            // Ajusta endingIndex: Avanza hasta encontrar un delimitador o el final del texto
            for (let i = endingIndex; i <= textContent.length; i++) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === textContent.length) {
                    endingIndex = i;
                    break;
                }
            }

            console.log("Texto seleccionado:", textContent.substring(startingIndex, endingIndex)); // Debugging
            console.log("palabra_actual:", palabra_actual); // Debugging
            console.log("Índices:", startingIndex, endingIndex); // Debugging

        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {

            definicion.innerHTML = "";
            texto.focus();
            asignada = false;
            feedback.style.color = "white";
            feedback.innerHTML = "+🎨 insp.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            color = "white"
            tiempo_feed = feedback.innerHTML;
        }
    }
}
  
// Esta función se llama cuando se produce un input (antes de que se modifique el contenido)
// y se utiliza para procesar tanto inserciones como borrados.
function modo_letra_bendita(e) {
    // Si el evento ya ha sido procesado, salimos
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }

    // Obtenemos la selección y el rango actual en el documento
    let sel = window.getSelection();
    if (!sel.rangeCount) return;
    let range = sel.getRangeAt(0);
    let node = sel.anchorNode;

    // Comprobamos el tipo de acción que se va a realizar según la propiedad inputType
    // Para borrado (retroceso)
    if (e.inputType === "deleteContentBackward") {
        console.log('Backspace detectado');
        console.log('Node:', node);
        console.log('Parent Node:', node ? node.parentNode : null);
        console.log('Parent Node class:', node && node.parentNode ? node.parentNode.className : 'No parent node');
        console.log('Focus Offset:', sel.focusOffset);

        // Si se cumple la condición de que el nodo pertenece a un span con la clase "letra-verde"
        // y el cursor está al inicio, prevenimos la acción por defecto y ejecutamos nuestra lógica
        if (node && node.parentNode && node.parentNode.className === 'letra-verde' && sel.focusOffset === 0) {
            e.preventDefault(); // Prevenir el borrado automático
            addSeconds(-1);
            // Feedback visual negativo
            feedback.style.color = color_negativo;
            feedback.innerHTML = "⏱️-1 segs.";
            addSeconds(-1);
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            // Aquí se podría enviar feedback vía Socket.io, por ejemplo.
        }
        return; // Salir si se ha procesado el borrado
    }

    // Para inserción de texto
    if (e.inputType === "insertText") {
        // e.data contiene el carácter que se va a insertar
        let letra = e.data;
        // Si se inserta un único carácter, lo procesamos
        if (letra && letra.length === 1) {
            // Comprobamos si la letra corresponde a la "letra bendita"
            if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
                (letra_bendita === "ñ" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
                // Prevenimos la acción por defecto para controlar la inserción manualmente
                e.preventDefault();
                console.log('Se procesa letra bendita');

                // Creamos un nodo de texto con la letra
                let textNode = document.createTextNode(letra);
                // Creamos un elemento span para darle estilo (clase "letra-verde")
                let span = document.createElement("span");
                span.className = "letra-verde";
                span.setAttribute("contenteditable", "false");
                span.appendChild(textNode);

                // Creamos nodos de texto vacíos para facilitar el posicionamiento
                let emptyTextNodeBefore = document.createTextNode("");
                let emptyTextNodeAfter = document.createTextNode("");

                // Insertamos los nodos en la posición actual del cursor
                range.insertNode(emptyTextNodeBefore);
                range.insertNode(span);
                range.insertNode(emptyTextNodeAfter);

                // Ajustamos el rango para posicionar el cursor adecuadamente
                range.setStartBefore(emptyTextNodeBefore);
                range.setEndBefore(emptyTextNodeBefore);
                sel.removeAllRanges();
                sel.addRange(range);

                // Actualizamos el tiempo y la visualización de puntos según la lógica del juego
                puntos.innerHTML = puntos_ + " palabras";
                console.log(puntos);

                // Feedback visual positivo
                feedback.style.color = color_positivo;
                feedback.innerHTML = "⏱️+2 segs.";
                addSeconds(+2);
                clearTimeout(delay_animacion);
                animateCSS(".feedback1", "flash").then((message) => {
                    delay_animacion = setTimeout(function () {
                        feedback.innerHTML = "";
                    }, 2000);
                });

                // Aquí se podría enviar feedback vía Socket.io
            } else {
                // Si la letra no es la "letra bendita" y el nodo actual es parte de un span "letra-verde"
                if (node && node.parentNode && node.parentNode.className === 'letra-verde') {
                    e.preventDefault();
                    let newTextNode = document.createTextNode(letra);
                    if (sel.focusOffset === 0) {
                        node.parentNode.parentNode.insertBefore(newTextNode, node.parentNode);
                    } else {
                        if (node.parentNode.nextSibling) {
                            node.parentNode.parentNode.insertBefore(newTextNode, node.parentNode.nextSibling);
                        } else {
                            node.parentNode.parentNode.appendChild(newTextNode);
                        }
                    }
                    range.setStartAfter(newTextNode);
                    range.setEndAfter(newTextNode);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }
    }
    // Se pueden añadir otros casos según se necesiten para otros tipos de input (por ejemplo, pegado de texto).
}
function nueva_letra_bendita(){
    indice_letra_bendita = Math.floor(Math.random() * letras_benditas_restantes.length);
    letra_bendita = letras_benditas_restantes[indice_letra_bendita]
    letras_benditas_restantes.splice(indice_letra_bendita, 1);
    if(letras_benditas_restantes.length == 0){
        letras_benditas_restantes = [...letras_benditas];
    }
    if (letra_bendita) {
        resumenPartida.letrasBenditas.add(String(letra_bendita).toUpperCase());
    }
    console.log("LETRA BENDITA", letra_bendita)
    nueva_letra(letra_bendita)
    listener_cambio_letra_palabra = setTimeout(nueva_letra_bendita, TIEMPO_CAMBIO_LETRA);
}

function nueva_letra_prohibida(){
    indice_letra_prohibida = Math.floor(Math.random() * letras_prohibidas_restantes.length);
    letra_prohibida = letras_prohibidas_restantes[indice_letra_prohibida]
    letras_prohibidas_restantes.splice(indice_letra_prohibida, 1);
    if(letras_prohibidas_restantes.length == 0){
        letras_prohibidas_restantes = [...letras_prohibidas];
    }
    if (letra_prohibida) {
        resumenPartida.letrasMalditas.add(String(letra_prohibida).toUpperCase());
    }
    nueva_letra(letra_prohibida)
    listener_cambio_letra_palabra = setTimeout(nueva_letra_prohibida, TIEMPO_CAMBIO_LETRA);
}

function modo_psicodélico() {
    stylize();
}


// Función que inicia el temporizador para una duración determinada
function temp_modos() {

    modo_anterior = modo_actual;
    modo_actual = modos_restantes[0];
    modos_restantes.splice(0, 1);
    console.log(modo_actual)
    MODOS[modo_actual]("");

    // Reiniciar la variable de contador
    secondsPassed = 0;
    
    // Crear un intervalo que se ejecute cada segundo (1000 ms)
    intervaloID_temp_modos = setInterval(() => {
    if (desventajaEnCurso) {
      return;
    }
    secondsPassed++;  // Incrementar el contador cada segundo
    console.log(`Segundos pasados: ${secondsPassed}`);
    console.log(modo_actual)
    console.log(modo_anterior)
    console.log(modos_restantes)
    console.log(secondsPassed >= TIEMPO_CAMBIO_MODOS)
    console.log(secondsPassed)
    console.log(TIEMPO_CAMBIO_MODOS)

      // Verificar si se alcanzó la duración deseada y reiniciar
      if (secondsPassed >= TIEMPO_CAMBIO_MODOS/1000) {
        if(modo_actual == "frase final"){
            final()
            fin_del_juego = true;
            clearInterval(intervaloID_temp_modos);
            LIMPIEZAS[modo_actual]("");
            modos_restantes = [...LISTA_MODOS];
            modo_anterior = "";
            modo_actual = "";
        }
        else{
        iniciarDesventajaEntreNiveles();
        }
        
        // Si se requiere alguna acción adicional al reiniciar, colócala aquí
      }
    }, 1000);
  }

function limpieza(){
    cancelarSecuenciaDesventaja();
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    detenerTodoAudioJuego();
    clearInterval(countInterval);
    clearInterval(intervaloID_temp_modos)
    pararEscritura = true;
    clearTimeout(timeoutID_menu)
    stopConfetti();
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);  
    clearTimeout(sub_timer);
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    console.log(texto.innerHTML)
    if(temp_text_inverso_activado == true){
        temp_text_inverso_activado = false;
        clearTimeout(tempo_text_inverso);
        procesarTexto();
    }

    texto.innerText = "";
    texto.style.display = "";
    texto.style.height = "";
    if (window.innerWidth <= 800) {
        texto.style.maxHeight = "2em";
    }
    else{
        texto.style.maxHeight = "calc(1.5em * 2)";

    }
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    texto.contentEditable= "false";
    puntos.innerHTML = 0 + " palabras";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    texto.focus();

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");

    puntos_palabra = 0;
    puntos_ = 0;
    puntos_letra_prohibida = 0;
    puntos_letra_bendita = 0;

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    locura = false;
    console.log(puntos)
    
    feedback.innerHTML = "";
    
    definicion.innerHTML = "";
    explicación.innerHTML = "";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = 4000;
    rapidez_inicio_borrado = 4000;

    caracteres_seguidos = 0;
    
    for (let key in LIMPIEZAS) { 
        console.log(key)
        LIMPIEZAS[key]();
    }

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    clearTimeout(tempo_text_borroso);
    actualizarBarraVida(tiempo, "");
}

function limpieza_final(){
    animateCSS(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "";
        btnEscribir.style.display = "";
        btnDescargarTexto.style.display = "" 
        btnFinal.style.display = "none"
        btnPantallaCompleta.style.display = "" 
        animateCSS(".botones", "backInLeft")
    });

    clearTimeout(timeoutID_menu);
    cancelarSecuenciaDesventaja();
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    clearInterval(countInterval);
    clearInterval(intervaloID_temp_modos);
    clearInterval(listener_cambio_letra_palabra)
    detenerMusicaModo();
    detenerSfxActivos();
    detenerAudioFinal();
    confetti_aux();
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    texto.contentEditable= "false";
    //texto.style.display = "none";
    tiempo.style.display="none"
    temas.display = "none";
    temas.innerHTML = "";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";

    definicion.style.fontSize = "1.5vw";

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.

    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    locura = false;

    tiempo.style.color = "white";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = 4000;
    rapidez_inicio_borrado = 4000;

    LIMPIEZAS["psicodélico"]("");

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    //clearTimeout(tempo_text_borroso);
    actualizarBarraVida(tiempo, "");
}

function pausa(){

    menu_modificador = false;
    texto.contentEditable= "false";

    clearTimeout(borrado);
    desactivar_borrar = true;
}

function reanudar(){

    menu_modificador = true;
    texto.contentEditable = "true";

    clearTimeout(borrado);
    desactivar_borrar = false;
    
    texto.focus();
}

function modo_borroso_pausa(data){
    console.log(tiempo_restante)
    if(tiempo_restante > 0){
        modo_borroso(data);
    }
}

function modo_inverso_pausa(){
    if(tiempo_restante > 0){
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_INVERSO);
        desactivar_borrar = true;
        caretNode, caretPos = guardarPosicionCaret();
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            // Obtener el último nodo de texto en text
            lastLine = texto.lastChild;
            lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                caretNode = lastTextNode;
                caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            texto.removeEventListener('animationend', arguments.callee);
        });
        
        procesarTexto();
        
        
        temp_text_inverso_activado = true;
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            desactivar_borrar = false;
            texto.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.contentEditable= "true";
                texto.focus()
                // Obtener el último nodo de texto en text
                lastLine = texto.lastChild;
                lastTextNode = lastLine;
                while (lastTextNode && lastTextNode.nodeType !== 3) {
                    lastTextNode = lastTextNode.lastChild;
                }
                
                // Si encontramos el último nodo de texto, colocamos el cursor allí
                if (lastTextNode) {
                    caretNode = lastTextNode;
                    caretPos = lastTextNode.length;
                    restaurarPosicionCaret(caretNode, caretPos);
                }
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            putada_actual = "";
          
        }, duracionDesventaja);
    }
}

function tiempo_borrado_menos(){
    const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORRADO);
    borrado_cambiado = true;
    antiguo_rapidez_borrado = rapidez_borrado;
    antiguo_inicio_borrado = rapidez_inicio_borrado;
    rapidez_borrado = 7000;
    rapidez_inicio_borrado = 7000;
    setTimeout(function () {
        borrado_cambiado = false;
        rapidez_borrado = antiguo_rapidez_borrado;
        rapidez_inicio_borrado = antiguo_inicio_borrado;
    }, duracionDesventaja);
}

function enviar_putada(putada){

    socket.emit("enviar_putada_a_jx", {player, putada});
}

function tiempo_muerto(){
    socket.emit("tiempo_muerto_a_control", '');
}

function borroso(){
    putada = "borroso";
    socket.emit("enviar_putada_a_jx", player, putada);
}

function inverso(){
    putada = "inverso";
    socket.emit("enviar_putada_a_jx", player, putada);
}

function modo_borroso(data){
    if (modo_texto_borroso == 1) {
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            modo_texto_borroso = 0
            putada_actual = ""
        }, data);   
    }
}

var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecución

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function confetti_aux() {
  reproducirAudioFinal();
  var animationEnd = Date.now() + duration; // Actualiza aquí dentro de la función
  isConfettiRunning = true; // Habilita la ejecución de confetti
  console.log(isConfettiRunning);
  
  var interval = setInterval(function() {
    if (!isConfettiRunning) {
      clearInterval(interval);
      return;
    }

    var timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    var particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function stopConfetti() {
  detenerAudioFinal();
  isConfettiRunning = false; // Deshabilita la ejecución de confetti
  confetti.reset(); // Detiene la animación de confetti
}

function final(){

    menu_modificador = false;
    cancelarSecuenciaDesventaja();
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    cerrarResumenPartida();
    limpieza_final();
    
    modo_actual = "";
    putada_actual = "";
    // Impide que se pueda escribir en los dos textos.
    texto.contentEditable= "false";

    // Variable booleana que dice si la ronda ha terminado o no.
    terminado = true;
    
    console.log("ES EL FINAL")
    texto.style.maxHeight = "none";
    texto.style.height = "auto";
    texto.style.height = texto.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
    //texto.style.display = "none";
    
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    });
    logo.style.display = "";
    neon.style.display = "";
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    LIMPIEZAS["psicodélico"]("");/* TODO: VER POR QUÉ NO FUNCIONA ESTO  */
    texto.removeEventListener("keyup", listener_modo_psico);
    restablecer_estilo();
    tiempo.style.color = "white";
}

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

let punteroInicio = 0;  // Global que representa el inicio del texto a verificar en la siguiente iteración

function ajustarPunteros(texto) {
    let punteroFinal = texto.length;

    // Si el punteroFinal está en medio de una palabra, retrocede hasta el espacio anterior
    while (punteroFinal > punteroInicio && texto[punteroFinal - 1] !== ' ') {
        punteroFinal--;
    }

    // Ahora, si el punteroInicio está en medio de una palabra, avanza hasta el espacio siguiente
    while (punteroInicio < punteroFinal && texto[punteroInicio] !== ' ') {
        punteroInicio++;
    }

    return texto.substring(punteroInicio, punteroFinal).trim();  // trim() para eliminar espacios adicionales
}

 // Función que invierte las letras de cada palabra pero NO el orden de las palabras.
 function invertirPalabras(texto) {
    return texto
      .split(' ')                         // Separa por espacios
      .map(palabra => palabra.split('').reverse().join('')) 
      .join(' ');
  }

  /**
   * Función recursiva que:
   * - Invierne el contenido de los nodos de texto
   * - Clona y procesa los nodos de tipo elemento para preservar estructura e hijos
   */
  function procesarNodo(nodo) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      // Si es un nodo de texto, lo invertimos
      const textoInvertido = invertirPalabras(nodo.textContent);
      return document.createTextNode(textoInvertido);

    } else if (nodo.nodeType === Node.ELEMENT_NODE) {
      // Clonamos el nodo (pero sin hijos) para preservar etiquetas y atributos (estilos, clases, etc.)
      const nuevoNodo = nodo.cloneNode(false);

      // Recorremos los hijos originales y los procesamos recursivamente
      nodo.childNodes.forEach(child => {
        // Insertamos en el clon el resultado de procesar cada hijo
        nuevoNodo.appendChild(procesarNodo(child));
      });

      return nuevoNodo;
    }

    // Si quisieras manejar comentarios u otro tipo de nodos,
    // podrías añadir más condiciones. Si no, simplemente retorna el nodo tal cual.
    return nodo.cloneNode(true);
  }

  function procesarTexto() {
    console.log("ESTO NO PARAAAAAAAAAAA")
    // El contenedor original
    // Creamos un fragmento para ir colocando los nodos procesados
    const fragmento = document.createDocumentFragment();

    // Recorremos los childNodes del div con id="texto"
    texto.childNodes.forEach(nodo => {
      // Procesamos cada nodo (ya sea texto o elemento) y lo añadimos al fragmento
      fragmento.appendChild(procesarNodo(nodo));
    });

    // Limpiamos el contenido original y lo reemplazamos con el fragmento procesado
    texto.innerHTML = "";
    texto.appendChild(fragmento);
  }

function efectoMaquinaDeEscribir(elemento, textoHtml, velocidad = 50) {
  // Reiniciar la bandera al inicio para permitir nuevas ejecuciones
  pararEscritura = false;

  // Asegurar salto de línea inicial si el contenido actual no termina con <br>
  let contenidoInicial = elemento.innerHTML.trim(); // Limpiamos espacios innecesarios
  if (!contenidoInicial.endsWith("<br>")) {
    contenidoInicial += "<br>"; // Añadimos un salto de línea si no está presente
  }

  let contenidoEscrito = contenidoInicial; // Inicializamos con el contenido previo
  let cursor = 0;                          // Índice para recorrer el texto

  // Añadir los saltos de línea adicionales al texto
  textoHtml = "<br>" + textoHtml + "<br><br>";

  // Desactiva la edición temporal
  elemento.contentEditable = "false";

  // ---- Función para colocar el cursor justo al final ----
  function colocarCursorAlFinal(elem) {
    const range = document.createRange();
    const sel = window.getSelection();

    let ultimoNodo = elem.lastChild;
    while (ultimoNodo && ultimoNodo.nodeType !== 3 && ultimoNodo.lastChild) {
      ultimoNodo = ultimoNodo.lastChild;
    }

    if (ultimoNodo && ultimoNodo.nodeType === 3) {
      range.setStart(ultimoNodo, ultimoNodo.textContent.length);
      range.setEnd(ultimoNodo, ultimoNodo.textContent.length);
    } else if (elem.lastChild) {
      range.setStartAfter(elem.lastChild);
      range.setEndAfter(elem.lastChild);
    } else {
      range.setStart(elem, 0);
      range.setEnd(elem, 0);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ---- Función recursiva para escribir el texto ----
  function escribir() {
    // Verificar si se ha solicitado detener la escritura
    if (pararEscritura) {
      return; // Salimos de la función para detener la recursión
    }

    if (cursor < textoHtml.length) {
      // Detectamos etiquetas HTML para escribirlas completas de golpe
      if (textoHtml.substring(cursor).startsWith("<")) {
        const finEtiqueta = textoHtml.indexOf(">", cursor) + 1;
        contenidoEscrito += textoHtml.substring(cursor, finEtiqueta);
        cursor = finEtiqueta;
      } else {
        // Caso normal: añadimos un carácter
        contenidoEscrito += textoHtml.charAt(cursor);
        cursor++;
      }

      // Actualizamos el contenido en el elemento
      elemento.innerHTML = contenidoEscrito;
      elemento.scrollTop = elemento.scrollHeight;  // Scroll al final

      // Continuamos con un pequeño retraso
      setTimeout(escribir, velocidad);
    } else {
      // Cuando terminamos
      elemento.contentEditable = "true";          // Reactivamos edición
      colocarCursorAlFinal(elemento);            // Cursor al final
      elemento.focus();                          // Enfocamos el elemento
    }
    
  }

  // Inicia el proceso de escritura
  escribir();
}

// Función para detener el efecto de la máquina de escribir
function detenerEfectoMaquina() {
  pararEscritura = true;
}


function confetti_musas(){
var scalar = 2;
var unicorn = confetti.shapeFromText({ text: '⭐', scalar });
isConfettiRunning = true;

var end = Date.now() + (2 * 1000);

// go Buckeyes!
(function frame() {
  confetti({
    startVelocity: 10,
    particleCount: 1,
    angle: 270,
    spread: 1000,
    origin: { y: 0 },
    shapes: [unicorn],
    scalar: 3
  });

  if ((Date.now() < end) && isConfettiRunning) {
    requestAnimationFrame(frame);
  }
}());
}

const textarea = texto;

/*document.addEventListener('DOMContentLoaded', function () {
    const gradientTop = document.getElementById('gradientTop');
    const gradientBottom = document.getElementById('gradientBottom');

    function updateGradients() {
        const scrollTop = textarea.scrollTop;
        const scrollHeight = textarea.scrollHeight;
        const clientHeight = textarea.clientHeight;

        if (scrollTop > 0) {
            gradientTop.style.opacity = '1';
        } else {
            gradientTop.style.opacity = '0';
        }

        if (scrollTop + clientHeight < scrollHeight) {
            gradientBottom.style.opacity = '1';
        } else {
            gradientBottom.style.opacity = '0';
        }
    }

    textarea.addEventListener('input', updateGradients);
    textarea.addEventListener('scroll', updateGradients);
    window.addEventListener('resize', updateGradients); // Añadido para manejar cambios de tamaño de la ventana

    // Inicialización de los gradientes al cargar la página
    updateGradients();
});*/

// Función auxiliar que dada una palabra devuelve una puntación de respecto de la frecuencia.
function puntuación_palabra(palabra) {
    palabra = palabra.toLowerCase();
    let puntuación = 0;
    if (palabra != null) {
        palabra = palabra.replace(/\s+/g, '')
        let longitud = palabra.length;
        string_unico(toNormalForm(palabra)).split("").forEach(letra => puntuación += frecuencia_letras[letra]);
        puntuación = Math.ceil((((10 - puntuación*0.5) + longitud * 0.1 * 30)) / 5) * 5
        if(isNaN(puntuación)){
            puntuación = 10;
        }
        return puntuación;
    }
    else return 10;
}

function string_unico(names) {
    string = "";
    ss = "";
    namestring = names.split("");

    for (j = 0; j < namestring.length; j++) {
        for (i = j; i < namestring.length; i++) {
            if (string.includes(namestring[i])) // if contains not work then  
                break;                          // use includes like in snippet
            else
                string += namestring[i];
        }
        if (ss.length < string.length)
            ss = string;
        string = "";
    }
    return ss;
}

function toNormalForm(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function getRandomSpanishWord() {
    try {
      // 1) Obtener página aleatoria con origin=*
      const randomUrl = 'https://es.wiktionary.org/w/api.php?action=query&list=random&rnlimit=1&rnnamespace=0&format=json&origin=*';
      const randomRes = await fetch(randomUrl);
      const randomData = await randomRes.json();
      
      if (!randomData.query.random[0]) {
        throw new Error('No se obtuvo página aleatoria');
      }

      const title = randomData.query.random[0].title;
      console.log('Título aleatorio:', title);

      // 2) Consultar el HTML parseado de esa página
      const parseUrl = `https://es.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
      const parseRes = await fetch(parseUrl);
      const parseData = await parseRes.json();
      
      if (!parseData.parse) {
        throw new Error('No se pudo parsear la página');
      }

      // 3) Obtenemos la cadena HTML embebida
      const html = parseData.parse.text['*'];

      // 4) Parsear el HTML con DOMParser (nativo del navegador)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Buscamos el primer <dd> dentro de <dl>
      let definicionDD = doc.querySelector('dl > dd');
      // En caso de no existir <dd>, buscamos el primer <li> en .mw-parser-output
      if (!definicionDD) {
        definicionDD = doc.querySelector('div.mw-parser-output li');
      }

      let definicion = definicionDD ? definicionDD.textContent.trim() : 'Sin definición encontrada';

      // Eliminar cualquier estilo incrustado si lo hubiera
      // (en DOMParser, por fortuna, el <style> no suele mezclarse con textContent, 
      //  pero si quieres asegurarte de quitar estilos, puedes hacer algo como:
      doc.querySelectorAll('style').forEach(st => st.remove());
      definicion = definicion.replace(/\.mw-parser-output\s*\.[\s\S]+?\}/g, '').trim();

      // Mostrar en consola
      console.log('Definición encontrada:\n', definicion);

      // Retornar un objeto con la info
      return { title, definicion };

    } catch (err) {
      console.error('Error en getRandomSpanishWord:', err);
      return null;
    }
  }

  

function ajustarFuerza(secs_base, fuerza) {
  if (typeof secs_base !== 'number' || typeof fuerza !== 'number') {
    throw new TypeError('ajustarFuerza: ambos parametros deben ser numeros');
  }
  if (fuerza == 0) {
    return Math.round(secs_base);
  }
  if (fuerza > LIMITE_TOTAL) {
    fuerza = LIMITE_TOTAL;
  }
  const factorLog = Math.log(fuerza + 1) / Math.log(LIMITE_TOTAL + 1);
  const pctIncremento = maxIncremento * factorLog;
  const resultado = Math.round(secs_base * (1 + pctIncremento));
  console.log(
    `[ajustarFuerza] secs_base=${secs_base}, fuerza=${fuerza}, ` +
    `factorLog=${factorLog.toFixed(3)}, pctInc=${(pctIncremento*100).toFixed(1)}% -> resultado=${resultado}`
  );
  return resultado;
}

function ajustarDestreza(secs_base, destreza) {
  if (typeof secs_base !== 'number' || typeof destreza !== 'number') {
    throw new TypeError('ajustarDestreza: ambos parametros deben ser numeros');
  }
  if (destreza == 0) {
    return Math.round(secs_base);
  }
  if (destreza > LIMITE_TOTAL) {
    destreza = LIMITE_TOTAL;
  }
  const numerador = Math.log(destreza + 1);
  const denominador = Math.log(LIMITE_TOTAL + 1);
  const factorLog = numerador / denominador;
  const pctReduccion = maxIncrementoDestreza * factorLog;
  const resultado = Math.round(secs_base * (1 - pctReduccion));
  console.log(
    `[ajustarDestreza] secs_base=${secs_base}, destreza=${destreza}, ` +
    `factorLog=${factorLog.toFixed(3)}, pctRed=${(pctReduccion*100).toFixed(1)}% -> resultado=${resultado}`
  );
  return resultado;
}

function ajustarRapidez(baseRapidezBorrado, baseInicioBorrado, agilidad) {
  if (typeof baseRapidezBorrado !== 'number' ||
      typeof baseInicioBorrado !== 'number' ||
      typeof agilidad !== 'number') {
    throw new TypeError('ajustarRapidez: todos los parametros deben ser numeros');
  }
  if (agilidad == 0) {
    rapidez_borrado = baseRapidezBorrado;
    rapidez_inicio_borrado = baseInicioBorrado;
    console.log(
      `[ajustarRapidez] agilidad=0 -> rapidez_borrado=${rapidez_borrado}, ` +
      `rapidez_inicio_borrado=${rapidez_inicio_borrado}`
    );
    return;
  }
  if (agilidad > LIMITE_TOTAL) {
    agilidad = LIMITE_TOTAL;
  }
  const factorLog = Math.log(agilidad + 1) / Math.log(LIMITE_TOTAL + 1);
  const pctIncremento = maxIncremento * factorLog;
  rapidez_borrado = Math.round(baseRapidezBorrado * (1 + pctIncremento));
  rapidez_inicio_borrado = Math.round(baseInicioBorrado * (1 + pctIncremento));
  console.log(
    `[ajustarRapidez] baseRapidezBorrado=${baseRapidezBorrado}, baseInicioBorrado=${baseInicioBorrado}, ` +
    `agilidad=${agilidad}, factorLog=${factorLog.toFixed(3)}, ` +
    `pctInc=${(pctIncremento*100).toFixed(1)}% -> rapidez_borrado=${rapidez_borrado}, ` +
    `rapidez_inicio_borrado=${rapidez_inicio_borrado}`
  );
}

function aplicarAtributos() {
  const attrs = (typeof atributos !== 'undefined' && atributos) ? atributos : { fuerza: 0, agilidad: 0, destreza: 0 };
  const fuerza = Number(attrs.fuerza) || 0;
  const agilidad = Number(attrs.agilidad) || 0;
  const destreza = Number(attrs.destreza) || 0;

  if (typeof SECS_BASE === 'number') {
    secs_palabras = ajustarFuerza(SECS_BASE, fuerza);
  }

  ajustarRapidez(RAPIDEZ_BORRADO_BASE, RAPIDEZ_INICIO_BORRADO_BASE, agilidad);
  TIEMPO_INVERSO = ajustarDestreza(TIEMPO_INVERSO_BASE, destreza);
  TIEMPO_BORROSO = ajustarDestreza(TIEMPO_BORROSO_BASE, destreza);
  TIEMPO_BORRADO = ajustarDestreza(TIEMPO_BORRADO_BASE, destreza);
}
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

// ---- PDF estilo control (1 jugador) ----
function obtenerColorPorClases(clases) {
    if (clases.has("letra-verde")) return [0, 210, 110];
    if (clases.has("palabra-musa") || clases.has("palabra-bendita-musa")) return [255, 157, 66];
    if (clases.has("palabra-bendita")) return [255, 229, 91];
    if (clases.has("frase-final-progreso")) return [255, 157, 66];
    return [230, 230, 230];
}

function extraerPalabrasConClase(html, clases) {
    const contenedor = document.createElement("div");
    contenedor.innerHTML = html || "";
    const selector = (clases || []).map(cls => `.${cls}`).join(",");
    if (!selector) return [];
    const encontrados = new Set();
    contenedor.querySelectorAll(selector).forEach(el => {
        const texto = (el.textContent || "").trim();
        if (!texto) return;
        texto.split(/\s+/).forEach(token => {
            const limpio = token.replace(/^[^\\wÁÉÍÓÚÜÑáéíóúüñ]+|[^\\wÁÉÍÓÚÜÑáéíóúüñ]+$/g, "");
            if (limpio) {
                encontrados.add(limpio.toUpperCase());
            }
        });
    });
    return Array.from(encontrados).sort();
}

function construirSegmentosColor(html) {
    const contenedor = document.createElement("div");
    contenedor.innerHTML = html || "";
    const segmentos = [];

    const pushTexto = (texto, color) => {
        if (!texto) return;
        const key = color.join(",");
        const ultimo = segmentos[segmentos.length - 1];
        if (ultimo && ultimo.key === key) {
            ultimo.texto += texto;
        } else {
            segmentos.push({ texto, color, key });
        }
    };

    const walk = (nodo, clasesActivas) => {
        if (nodo.nodeType === Node.TEXT_NODE) {
            pushTexto(nodo.textContent, obtenerColorPorClases(clasesActivas));
            return;
        }
        if (nodo.nodeType !== Node.ELEMENT_NODE) return;

        const tag = nodo.tagName;
        if (tag === "BR") {
            pushTexto("\n", obtenerColorPorClases(clasesActivas));
            return;
        }

        const nuevasClases = new Set(clasesActivas);
        if (nodo.classList && nodo.classList.length) {
            nodo.classList.forEach(cls => nuevasClases.add(cls));
        }

        if (tag === "DIV" || tag === "P") {
            const ultimo = segmentos[segmentos.length - 1];
            if (ultimo && !ultimo.texto.endsWith("\n")) {
                pushTexto("\n", obtenerColorPorClases(clasesActivas));
            }
        }

        Array.from(nodo.childNodes).forEach(child => walk(child, nuevasClases));

        if (tag === "DIV" || tag === "P") {
            const ultimo = segmentos[segmentos.length - 1];
            if (ultimo && !ultimo.texto.endsWith("\n")) {
                pushTexto("\n", obtenerColorPorClases(clasesActivas));
            }
        }
    };

    walk(contenedor, new Set());
    return segmentos;
}

function agregarSegmentosEnPagina(doc, segmentos, x, yInicial, tamano, agregarLogo, margen, anchoPagina, altoPagina) {
    const maxWidth = anchoPagina - (margen * 2);
    const lineHeight = tamano * 0.4;
    let y = yInicial;
    let xCursor = x;

    const nuevaLinea = () => {
        xCursor = x;
        y += lineHeight;
        if (y > altoPagina - margen) {
            doc.addPage();
            agregarLogo();
            y = margen + 10;
        }
    };

    segmentos.forEach(seg => {
        const color = seg.color || [0, 0, 0];
        const partes = seg.texto.split(/(\n)/);
        partes.forEach(parte => {
            if (!parte) return;
            if (parte === "\n") {
                nuevaLinea();
                return;
            }
            const tokens = parte.split(/(\s+)/);
            tokens.forEach(token => {
                if (!token) return;
                if (token.trim() === "" && xCursor === x) {
                    return;
                }
                setPdfFont(doc, tamano, color);
                const anchoToken = doc.getTextWidth(token);
                if (xCursor + anchoToken > x + maxWidth && token.trim() !== "") {
                    nuevaLinea();
                }
                doc.text(token, xCursor, y);
                xCursor += anchoToken;
            });
        });
    });

    return y;
}

const PDF_RETRO_GAMING_TTF = "AAEAAAAOAIAAAwBgRFNJRwAAAAEAAHhcAAAACEdERUYFdwQpAAB4ZAAAADxHUE9TbJF0jwAAeKAAAAAgR1NVQtxl3MoAAHjAAAAAbk9TLzKSNjNJAAABaAAAAGBjbWFwgnaf4AAABsQAAALIZ2x5ZkCoxtYAAAwMAABopGhlYWQj4RDAAAAA7AAAADZoaGVhI6USswAAASQAAAAkaG10ePzrthIAAAHIAAAE/GxvY2E4mFMEAAAJjAAAAoBtYXhwAUoAggAAAUgAAAAgbmFtZYlY4EEAAHSwAAADinBvc3QBnADMAAB4PAAAACAAAQAAAAEAADE8FGdfDzz1AAAQAAAAAADYlMtdAAAAANiU7MP/RvujFF0QAAAAAAgAAgAAAAAAAAABAAAQAPujAAAVF/9GALkUXQABAAAAAAAAAAAAAAAAAAABPwABAAABPwCAAAoAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAMMBwGQAAUABAgACAAAAP3SCAAIAAAACAAAzAMzAAAAAAQAAAAAAAAAgAACh0AAAAoAAAAAAAAAAERBWSAAQAAg+wQLovujAAAQAARdAAAABQAAAAAHRQuiAAAAIAAECZYC3AC6AAAAugAABdEAAAUXAXQJdAF0ELoBdAxdAXQMXQF0DdEBdAUXAXQIAAF0CAABdA3RAXQK6AF0BRcAAAgAAXQFFwF0DF0BdAxdAXQIAAF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQFFwF0BRcAAAl0AXQJdAF0CXQBdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQK6AF0DF0BdAxdAXQK6AF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdA3RAXQMXQF0DF0BdAxdAXQIAAF0DF0BdAgAAXQMXQF0CXQBdAgAAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAl0AXQMXQF0DF0BdAUXAXQJdAF0CugBdAaLAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAroAXQMXQF0CXQBdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAgAAXQFFwF0CAABdAroAXQFFwF0DF0BdAxdAXQLogF0DF0BdARdAXQMXQF0CXQBdA9FAXQIAAF0D0UBdAroAXQK6AF0DF0AugxdAXQPRQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdBC6AXQMXQF0DF0BdAxdAXQMXQF0DF0BdAroAXQK6AF0CugBdAroAXQN0QF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0CXQBdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0FRcBdAxdAXQMXQF0DF0BdAxdAXQMXQF0BRcAAAaLAXQHRf9GB0X/Rg3RAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQK6AF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQK6AF0ELoBdAxdAXQMXQF0DF0BdAxdAXQK6AF0DF0BdBC6AXQMXQF0DF0BdAxdAXQMXQF0D0UBdAxdAXQMXQF0DF0BdA9FAXQPRQF0DF0BdBIuAXQSLgF0DF0BdAxdAXQMXQF0DF0BdAroAXQLogF0EugBdBIuAXQMXQF0DF0BdAxdAXQK6AF0DdEBdAxdAXQN0QF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdBC6AXQMXQF0DdEBdAxdAXQPRQF0ELoBdA6LAXQQugF0DF0BdAxdAXQRdAF0DF0BdAxdAXQMXQF0DF0BdAl0AXQN0QF0DF0BdA3RAXQMXQF0DF0BdAxdAXQK6AF0DF0BdAxdAXQMXQF0DF0BdAxdAXQMXQF0DF0BdAroAXQMXQF0D0UBdAxdAXQN0QF0DF0BdA3RAXQPRQF0DosBdA9FAXQMXQF0DF0BdBC6AXQMXQF0DF0BdAxdAXQJdAF0DF0BdAUXAXQHRf9GEi4BdBIuAXQMXQAACugBdAxdAXQMXQF0CugBdAl0AXQK6AAACXQAAA9FAXQPRQF0DdEBdA0XAXQN0QF0DF0BdAxdAAALogAADosBdA3RAXQN0QF0DdEBdA6LAXQPRQF0DF0BdAroAXQGiwF0BRcAAAroAXQJdAAADdEAug9FAXQPRQF0DF0BdA3RAXQSLgF0E6IBdAAAAAMAAAADAAAAHAABAAAAAAEUAAMAAQAAABwABAD4AAAAOgAgAAQAGgB+AKsArgCxALYAuwD/AXgDoQOpA7IEAQQE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BF0C6P0Y+6MC6AF1AugBdQLo/RgC6P0Y/ov9GP6L/RgC6P0YAAMBdP0YC6IOiwADAAcAKwAAAREhEQERIRETESERIREhESERIREhESERIREhESERIREhESERIREhESERIREIuv6L/oz+jLr90f6MAukBdP0X/owBdAIvAukCLgF0/Rj+iwLpAXT+jP3SAXQEXfujBdEC6f0X9dMC6AF0AXT+jARdAXQC6QF0Aun9F/6M/owBdP0X/oz7o/6M/RgAAAUBdAAAC6ILogAFAAsAEQAXAC8AACERIREhGQIhESERAREhESEZAiERIREBESERIREhESERIREhESERIREhESERIREHRQF1AXT+jALo9dIBdAF1/osC6fujAXQBdQF0AXQBdQLo/oz+jP6L/oz+jALo/oz+jAF0AXQBdf0XBdEC6f6M/osBdQF0AXT9GPdGAugBdQF0AXQBdQLo/Rj+i/6M/oz+i/0YAAEBdAAADRcLogAdAAAhESERIREhESERIREhESERIREhESERIREhESERIREC6P6MAXT+jAF0B0YBdP0Y+6MC6P0YA6MFF/3R/owBdARdAXQC6QF0/oz+jAF0/Rf+jPujBF3+jP0X/owAAQF0B0UEXQuiAAMAAAERIREBdALpB0UEXfujAAEBdAAAB0ULogATAAAhESERIREhESERIREhESERIREhEQRd/ov+jAF0AXUC6P6M/owBdAF0AXQBdAXSAXQBdP6M/oz6Lv6M/owAAAABAXQAAAdFC6IAEwAAIREhESERIREhESERIREhESERIREBdAF0AXX+i/6MAukBdAF0/oz+jAF0AXQF0gF0AXT+jP6M+i7+jP6MAAAAAQF0AugNFwouABsAAAERIREhESERIREhESERIREhESERIREhESERIREC6AIv/F0Do/3RA6MBdQOi/dIDo/xdAi78Xv6LAugBdQF0AXQBdQF0/owBdP6M/ov+jP6M/osBdf6LAAEBdAIuCi4JdAALAAABESERIREhESERIREEXf0XAukC6ALp/RcCLgLpAXQC6f0X/oz9FwABAAD+jARdAugABwAAGQEhESERIREBdALp/ov+jAF0Auj9GP6MAAAAAQF0BRcHRQaLAAMAAAERIREBdAXRBRcBdP6MAAEBdAAABF0C6AADAAAhESERAXQC6QLo/RgAAAABAXQAAAuiC6IAFwAAIREhESERIREhESERIREhESERIREhESERAXQBdAF1AXQBdAF1Auj+jP6M/ov+jP6MAugBdQF0AXQBdQLo/Rj+i/6M/oz+i/0YAAAAAwF0AAALoguiAAcADwAbAAABESERIREhEQERIREhESERAREhESERIREhESERCLr+i/6M/owBdAF0AXX7o/6L/owBdAdGAXT+jAF0BF3+jP6L/owEXQF0AXUBdPuj+i8BdAi6AXT+jPdG/owAAQF0AAAHRQuiAAsAACERIREhESERIREhEQF0AXT+jAF0AukBdAF0B0YBdAF09dL+jAAAAAEBdAAAC6ILogAXAAAhESERIREhESERIREhESERIREhESERIREBdAF0BdL7o/0XAXQHRgF0/oz6LwRdAugF0QF0Aun+jAF0AXT+jP0X/oz7owF0/RgAAAABAXQAAAuiC6IAGwAAIREhESERIREhESERIREhESERIREhESERIREhEQLo/owC6QRd+6MBdAF0+i8KLv6M/owBdAF0/owBdAF0/owEXQF0AXUBdAF0/oz+jP6L/oz7o/6MAAAAAgF0AAALoguiAAcAEwAAAREhESERIREBESERIREhESERIREIuv6L/oz+jARd+LoBdAF1AXQF0QXRBF3+jP6L/oz6LwRdAugBdQF0AXT0XgABAXQAAAuiC6IAEwAAIREhESERIREhESERIREhESERIREC6P6MAukEXfi6CLr6LwXRAXT+jAF0AXT+jARdBdH+jP0X/oz7o/6MAAAAAgF0AAALoguiAAMAFwAAAREhEQERIREhESERIREhESERIREhESERCLr7o/6L/owBdAdGAXT9GPujBdEBdP6MAXQEXfuj/owBdAi6AXT+jP6MAXT9F/6M+6P+jAABAXQAAAuiC6IAEwAAIREhESERIREhESERIREhESERIREEXQF0AXQBdfuj/RcKLv6M/oz+iwXRAXQBdQF0/owC6P0Y/ov+jPovAAAAAwF0AAALoguiAAMABwAbAAABESERAREhEQERIREhESERIREhESERIREhESERCLr7owRd+6P+i/6MAXT+jAF0B0YBdP6MAXT+jAF0BF37owXRAun9F/i7AXQEXQF0AukBdP6M/Rf+jPuj/owAAgF0AAALoguiAAMAFwAAAREhEQERIREhESERIREhESERIREhESERCLr7o/6L/owC6QRd+i7+jAF0B0YBdP6MBdEEXfuj+i8BdAF0/owC6QF0BF0BdP6M90b+jAACAXQAAARdCLoAAwAHAAAhESERAREhEQF0Aun9FwLpAuj9GAXRAun9FwAAAAIAAP6MBF0IugAHAAsAABkBIREhESERAREhEQF0Aun+i/6MAun+jAF0Auj9GP6MB0UC6f0XAAAAAQF0AAAIugouABsAACERIREhESERIREhESERIREhESERIREhESERIREF0f6M/ov+jAF0AXUBdALp/ov+jP6MAXQBdAF1AXQBdAF1AXQBdAF1AXT+jP6L/oz+jP6L/oz+jAAAAAIBdALoCLoHRQADAAcAAAERIREBESERAXQHRvi6B0YC6AF1/osC6QF0/owAAQF0AAAIugouABsAACERIREhESERIREhESERIREhESERIREhESERIREBdAF0AXUBdP6M/ov+jALpAXQBdAF1/ov+jP6MAXQBdAF1AXQBdAF1AXT+jP6L/oz+jP6L/oz+jAAAAAIBdAAAC6ILogADABcAACERIREBESERIREhESERIREhESERIREhEQRdAuj9GAF0Aun7o/0XAXQHRgF0/oz9FwLo/RgEXQF0AXQC6f6MAXQBdP6M/Rf+jP6MAAAABQF0AAALoguiAAMABwALABMAFwAAIREhEQERIREBESERAREhESERIREBESERAugHRv0X/oz7owF0AXUEXQF0AXT3RgdGAXT+jARdAuj9GP0XCLr3RgF0BdL7owXR+LoHRgF0/owAAAACAXQAAAuiC6IABwAXAAABESERIREhEQERIREhESERIREhESERIREIuv6L/oz+jP0XAXQBdQRdAXQBdP0Y+6MF0QLpAXT+jP0X+i8IugF0AXT+jP6M90YEXfujAAMBdAAAC6ILogADAAcAEwAAAREhEQERIREBESERIREhESERIREIuvujBF37o/0XCLoBdP6MAXT+jAF0BF37owXRAun9F/i7C6L+jP0X/oz7o/6MAAEBdAAAC6ILogAbAAAhESERIREhESERIREhESERIREhESERIREhESERBF3+i/6MAXQBdQXRAXT9GP0X/owBdALpAuj+jAF0AXQF0gF0AXT+jP6MAXT+jPou/owBdP6M/owAAAACAXQAAAuiC6IABwATAAABESERIREhEQERIREhESERIREhEQdFAXX+i/0Y/RcHRgF0AXT+jP6MAXQBdAXSAXT3Rv6MC6L+jP6M+i7+jP6MAAEBdAAAC6ILogALAAAhESERIREhESERIREBdAou+LsEXfujB0ULov6M/Rf+jPuj/owAAAABAXQAAAuiC6IACQAAIREhESERIREhEQF0Ci74uwRd+6MLov6M/Rf+jPovAAEBdAAAC6ILogAbAAAhESERIREhESERIREhESERIREhESERIREhESERBF3+i/6MAXQBdQXRAXT9GP0X/owBdALp/RcF0QF0AXQF0gF0AXT+jP6MAXT+jPou/owDowF0+XUAAAABAXQAAAuiC6IACwAAIREhESERIREhESERAXQC6QRdAuj9GPujC6L7owRd9F4F0fovAAAAAQF0AAAKLguiAAsAACERIREhESERIREhEQF0Aun9Fwi6/RcC6QF0CLoBdP6M90b+jAAAAAEBdAAAC6ILogANAAAhESERIREhESERIREhEQLo/owC6QRd+6MHRf6MAXQC6f0XCLoBdPXS/owAAQF0AAALoguiAB8AACERIREhESERIREhESERIREhESERIREhESERIREhESERAXQC6QF0AXQBdQLo/oz+jP6LAXUBdAF0/Rj+i/6M/owLovujAXUBdAF0/oz+jP6L/oz+jP6L/RgC6AF1AXT6LwAAAAEBdAAACi4LogAFAAAhESERIREBdALpBdELovXS/owAAQF0AAALoguiABcAACERIREhESERIREhESERIREhESERIREhEQF0AXQBdQF0AXQBdQF0AXT9GP6L/oz+jAui/oz+jP6LAXUBdAF09F4F0f6MAXT6LwAAAAEBdAAAC6ILogAXAAAhESERIREhESERIREhESERIREhESERIREBdAF0AXUBdAF0AXUC6P6M/oz+i/6M/owLov6M/oz+i/6MBdH0XgF0AXQBdQF0+i8AAAACAXQAAAuiC6IAAwAPAAABESERAREhESERIREhESERCLr7o/6L/owBdAdGAXT+jAF0CLr3Rv6MAXQIugF0/oz3Rv6MAAIBdAAAC6ILogADAA0AAAERIREBESERIREhESERCLr7o/0XCLoBdP6M+i8HRQLp/Rf4uwui/oz9F/6M+i8AAAADAXQAAAuiC6IAAwALABkAACERIREBESERIREhEQERIREhESERIREhESERCi4BdPuj/owC6fuj/ov+jAF0B0YBdP6M/owBdP6MAXQBdAF1BdH3Rv6MAXQIugF0/oz4uv6M/owAAgF0AAALoguiAAMAEQAAAREhEQERIREhESERIREhESERCLr7o/0XCLoBdP6MAXT9GPujB0UC6f0X+LsLov6M/Rf+jPovBdH6LwAAAAEBdAAAC6ILogAbAAAhESERIREhESERIREhESERIREhESERIREhESERAuj+jALpBF36Lv6MAXQHRgF0/Rj7owXRAXT+jAF0AXT+jARdAXQC6QF0/oz+jAF0/Rf+jPuj/owAAAABAXQAAAuiC6IABwAAIREhESERIREFF/xdCi78XgouAXT+jPXSAAAAAQF0AAALoguiAAsAACERIREhESERIREhEQLo/owC6QRdAuj+jAF0Ci710gou9dL+jAAAAAEBdAAAC6ILogAXAAAhESERIREhESERIREhESERIREhESERIREF0f6M/ov+jALpAXQBdAF1Auj+jP6M/osBdAF0AXUHRfi7/osBdQdF+Lv+i/6M/owAAAABAXQAAA0XC6IAFwAAIREhESERIREhESERIREhESERIREhESERAuj+jALpAi4BdQIuAun+i/6M/oz9F/6MAXQKLvi7B0X4uwdF9dL+jAF0AXT+jP6MAAAAAQF0AAALoguiACMAACERIREhESERIREhESERIREhESERIREhESERIREhESERIREhEQF0AXQBdf6L/owC6QF0AXQBdQLo/oz+jAF0AXT9GP6L/oz+jARdAXQBdAF1Auj9GP6LAXUC6P0Y/ov+jP6M+6MEXQF0/oz7owAAAAEBdAAAC6ILogAXAAAhESMRIREhESERIREhESERIREhESERIxEFF7r+i/6MAukBdAF0AXUC6P6M/oy6BF0BdAF0BF37o/6MAXQEXfuj/oz+jPujAAEBdAAAC6ILogAbAAAhESERIREhESERIREhESERIREhESERIREhESERAXQBdAF1AXQBdAF1+LoKLv6M/oz+i/6M/owHRQLoAXUBdAF0AXUBdAF0/Rj+i/6M/oz+i/6M/owAAAABAXQAAAdFC6IABwAAIREhESERIREBdAXR/RgC6Aui/oz3Rv6MAAAAAQF0AAALoguiABcAACERIREhESERIREhESERIREhESERIREhEQi6/ov+jP6M/ov+jALpAXQBdAF1AXQBdALoAXUBdAF0AXUC6P0Y/ov+jP6M/ov9GAAAAAEBdAAAB0ULogAHAAAhESERIREhEQF0Aun9FwXRAXQIugF09F4AAAABAXQHRQuiC6IAEwAAAREhESERIREhESERIREhESERIREBdAF0AXUEXQF0AXT9GP6L/oz+jAdFAXUBdAF0/oz+jP6LAXUBdP6M/osAAQF0AAAIugF0AAMAACERIREBdAdGAXT+jAAAAAEBdAdFB0ULogALAAABESERIREhESERIREEXf6L/owC6QF0AXQHRQF1AXQBdP6M/oz+iwACAXQAAAuiB0UAAwARAAABESERAREhESERIREhESERIREIuvuj/ov+jAF0BdL6LgdGAXQBdAF0/oz+jAF0AXQBdQF0AXT+jPovAAAAAgF0AAALoguiAAMADQAAAREhEQERIREhESERIREIuvuj/RcC6QXRAXT+jAF0BF37o/6MC6L7o/6M+6P+jAAAAAEBdAAAC6IHRQATAAAhESERIREhESERIREhESERIREhEQLo/owBdAdGAXT9GPujBF0C6P6MAXQEXQF0/oz+jAF0+6MBdP6M/owAAAACAXQAAAuiC6IAAwANAAABESERAREhESERIREhEQi6+6P+i/6MAXQF0gLoAXQEXfuj/owBdARdAXQEXfReAAAAAgF0AAALogdFAAMAEQAAAREhEQERIREhESERIREhESERCLr7o/6L/owBdAdGAXT4uwXRBF0BdP6M+6MBdARdAXT+jP0X/oz+jAAAAAEBdAAACLoLogAPAAAhESERIREhESERIREhESERAuj+jAF0AXUEXf0XAun9FwXRAXQC6QF0/oz9F/6M+i8AAAACAXT7owuiB0UAAwARAAABESERAREhESERIREhESERIREIuvuj/osF0vou/owBdAi6/owBdARd+6P6LwF1AugBdARdAXT10/6LAAAAAQF0AAALoguiAAsAACERIREhESERIREhEQF0AukF0QF0/Rj7owui+6P+jPovBdH6LwAAAAIBdAAABF0LogADAAcAACERIREBESERAXQC6f0XAukHRfi7CLoC6P0YAAAAAgF0/owIuguiAAsADwAAAREhESERIREhESERAREhEQLo/owC6QF0Aun+i/6MAun+jAF0AXT+jAdF+Lv+jAouAuj9GAABAXQAAAouC6IAFwAAIREhESERIREhESERIREhESERIREhESERAXQC6QF0AXQC6f6M/osBdQF0/Rf+jP6MC6L4uwF0AXT+jP6M/ov+jP6MAXQBdP0YAAAAAQF0AAAF0QuiAAcAACERIREhESERAuj+jALpAXQBdAou9dL+jAAAAAEBdAAAC6IHRQANAAAhESERIREhESERIREhEQF0CLoBdP0Y/ov+jP6MB0X+jPovBdH6LwXR+i8AAQF0AAALogdFAAkAACERIREhESERIREBdAi6AXT9GPujB0X+jPovBdH6LwACAXQAAAuiB0UAAwAPAAABESERAREhESERIREhESERCLr7o/6L/owBdAdGAXT+jAF0BF37o/6MAXQEXQF0/oz7o/6MAAIBdPujC6IHRQADAA0AAAERIREBESERIREhESERCLr7o/0XCLoBdP6M+i8BdARd+6P6Lwui/oz7o/6M+6MAAAACAXT7owuiB0UAAwANAAABESERAREhESERIREhEQi6+6MEXfou/owBdAi6AXQEXfuj+i8EXQF0BF0BdPReAAAAAgF0AAAKLgdFAAcACwAAIREhESERIREBESERAXQC6QF0/owBdARdB0X+jP6M+6MF0QF0/owAAAABAXQAAAuiB0UAEwAAIREhESERIREhESERIREhESERIREBdAdG+i7+jAF0B0b6LwXRAXT+jAF0AXQBdQF0AXT+jP6M/ov+jP6MAAAAAQF0AAAIuguiAA8AACERIREhESERIREhESERIREEXf6L/owBdALpAun9FwLpAXQEXQF0BF37o/6M+6P+jAAAAAEBdAAAC6IHRQALAAAhESERIREhESERIREC6P6MAukEXQLo/owBdAXR+i8F0fov/owAAAABAXQAAAuiB0UAEwAAIREhESERIREhESERIREhESERIREEXf6L/owC6QF0AXQBdQLo/oz+jAF0AXQEXfuj/owBdARd+6P+jP6MAAAAAwF0AAALogdFAAcACwATAAAhESERIREhGQIhGQIhESERIREC6P6MAukBdAF0AXUC6P6MAXQF0fov/owBdAXR+i/+jAF0BdH6L/6MAAEBdAAAC6IHRQAjAAAhESERIREhESERIREhFSE1IREhESERIREhESERIREhNSEVIREBdAF0AXX+i/6MAukBdAF0AXUC6P6M/owBdAF0/Rj+i/6M/owBdAF0AXUBdAF0/oy6ugF0/oz+jP6L/oz+jAF0urr+jAAAAAEBdPujC6IHRQAPAAABESERIREhESERIREhESERAugF0vou/owC6QRdAuj+jPujAXUC6AF0BdH6LwXR9dP+iwABAXQAAAuiB0UAEwAAIREhESERIREhESERIREhESERIREBdAF0AXUBdPujCi7+jP6M/osEXQF0AXQBdQF0AXT+jP6M/ov+jP6MAAAAAQF0AAAHRQuiABMAACERIREhESERIREhESERIREhESERBF3+i/6MAXQBdQLo/oz+jAF0AXQBdAOjAXQDowF0/oz8Xf6M/F3+jAAAAAEBdP0YBF0LogADAAABESERAXQC6f0YDorxdgABAXQAAAdFC6IAEwAAIREhESERIREhESERIREhESERIREBdAF0AXX+i/6MAukBdAF0/oz+jAF0A6MBdAOjAXT+jPxd/oz8Xf6MAAAAAwF0BF0KLgi6AAMABwATAAABESERIREhEQERIREhESERIREhEQF0AXQF0gF0+6P+jP6LAukBdAF1BdEBdP6MAXT+jP6MAXQBdAF1/ov+jP6MAAAAAgF0AAAEXQuiAAMABwAAIREhEQERIREBdALp/RcC6QdF+LsIugLo/RgAAAACAXT+jAuiCLoAAwAfAAABESERAREhESERIREhESERIREhESERIREhESERIREhEQXR/owBdP0X/owBdALpAXQC6QF0/Rj+iwF1Auj+jP0XAXQEXfuj/RgBdAF0BF0BdAF1/ov+jP6MAXT7owF0/oz+jP6MAAEBdAAAC6ILogAXAAAhESERIREhESERIREhESERIREhESERIREBdAF0/owBdAF1BdEBdP0Y/RcEXfujBdEBdARdAXQC6QF0/oz+jAF0/Rf+jPuj/owAAAAIAXQCLgroCXQAAwAHAAsADwATABcAGwAfAAABESERIREhESERIREBESERIREhEQERIREhESERIREhEQF0AXQBdQOjAXQBdPgAAXUDowF0+AABdAF1A6MBdAF0Ai4BdP6MAXT+jAF0/owBdARe+6IEXvuiBF4BdP6MAXT+jAF0/owAAAABAXQAAAuiC6IAIwAAIREhESE1IREhNSERIREhESERIREhESERIREhFSERIRUhESERBRf8XQOj/F0C6f6L/owC6QF0AXQBdQLo/oz+jALo/F4DovxeAXQBdLoBdboBdARd+6P+jAF0BF37o/6Muv6Luv6M/owAAAACAXT7owOiDosAAwAHAAABESERAREhEQF0Ai790gIu+6MH//gBCugIAPgAAAIBdAAAC6ILogARACMAACERIREhESERIREhESERIREhEQERIREhESERIREhESERIREhEQLo/owC6QRd+6MEXQF0AXT+jPi6/owBdAdGAXT9GPujBF37owF0AXT+jAIuAXUBdP3S/Rf+jAUXAXQDowF0/oz+jAF0/dL+i/6MAAAAAgF0CLoIuguiAAMABwAAAREhESERIREBdALpAXQC6Qi6Auj9GALo/RgAAAADAXQAAA6LC6IACwAPABsAAAERIREhESERIREhERMRIREBESERIREhESERIREGi/6MAXQEXf0YAui6+Lv+i/6MAXQKLwF0/owC6AF1AugBdf6L/Rj+i/6MCLr3Rv6MAXQIugF0/oz3Rv6MAAADAXQDogdFC6IAAwANABEAAAERIRkCIREhESERIREBESERAXQBdALp/RcC6QF0+6MC6QUXAi790v6LAXUCLgF1AXT5dAaMAXT+jAAAAgF0AAAOiwouABsANwAAIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREF0f6M/ov+jAF0AXUBdALp/ov+jP6MAXQBdAF1Auj+jP6M/osBdQF0AXQC6f6M/ov+jAF0AXUBdAF0AXQBdQF0AXQBdQF0/oz+i/6M/oz+i/6M/owBdAF0AXUBdAF0AXUBdP6M/ov+jP6M/ov+jP6MAAYBdALoCi4LogADAAcAEwAXABsAHwAAAREhEQE1IRUBESERIxUzFSE1IxUFESERIREhEQERIREC6AXS/dH+jP6LBF67u/3RuvxdAXQF0gF0+LoF0gLoAXX+iwRdu7v90gRd/Re6urq6ugXR+i8F0fovBdEBdP6MAAIBdAC6Ci4K6AADAA8AACURIREBESERIREhESERIREBdAi6+i/9FwLpAugC6f0XugF0/owC6ALpAXUC6P0Y/ov9FwAAAgC6+6MLogdFAAcAEwAAExEhESERIREBESERIREhESERIRG6AugBdf6LAXUCLgIvAi790v6M+6MLovuj/oz6LwRdAXQBdARd+LsBdP6MAAACAXQAAAuiC6IAAwANAAAlESERBREhESERIREhEQou/oz+i/uj/owBdAi6ugl09oy6BdEBdALpAXT0XgACAXQAAA6LCi4AGwA3AAAhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhEQF0AXQBdQF0/oz+i/6MAukBdAF0AXX+i/6M/owC6AF1AXQBdP6M/oz+iwLpAXQBdQF0/oz+i/6MAXQBdAF1AXQBdAF1AXT+jP6L/oz+jP6L/oz+jAF0AXQBdQF0AXQBdQF0/oz+i/6M/oz+i/6M/owAAgF0AAALoguiABMAFwAAIREhESERIREhESERIREhESERIREBESERAuj+jAF0AukC6f6L/RgEXQLo/oz7owLpAXQC6QF0AXT+jP6M/RcBdP6M/owIugLo/RgAAAADAXQAAAuiEAAABwAXAB8AAAERIREhESERAREhESERIREhESERIREhERMRIREhESERCLr+i/6M/oz9FwF0AXUEXQF0AXT9GPujuv6LAukBdQXRAukBdP6M/Rf6Lwi6AXQBdP6M/oz3RgRd+6MNFwF0AXX+i/6MAAADAXQAAAuiEAAABwAXAB8AAAERIREhESERAREhESERIREhESERIREhERMRIREhESERCLr+i/6M/oz9FwF0AXUEXQF0AXT9GPujugF0Aun+jAXRAukBdP6M/Rf6Lwi6AXQBdP6M/oz3RgRd+6MNFwF0AXX+i/6MAAADAXQAAAuiEAAABwAXACMAAAERIREhESERAREhESERIREhESERIREhEQERIREhESERIREhEQi6/ov+jP6M/RcBdAF1BF0BdAF0/Rj7o/6LAXUEXQF0/Rf+jAXRAukBdP6M/Rf6Lwi6AXQBdP6M/oz3RgRd+6MNFwF0AXX+i/6MAXT+jAAGAXQAAAuiEAAABwAXABsAHwAjACcAAAERIREhESERAREhESERIREhESERIREhEQMRIREhESERAREhESERIREIuv6L/oz+jP0XAXQBdQRdAXQBdP0Y+6O7AXUBdAF1/RcBdAF1AXQF0QLpAXT+jP0X+i8IugF0AXT+jP6M90YEXfujDRcBdP6MAXT+jAF0AXX+iwF1/osAAAQBdAAAC6IQAAAHABcAGwAfAAABESERIREhEQERIREhESERIREhESERIREBESERIREhEQi6/ov+jP6M/RcBdAF1BF0BdAF0/Rj7o/6LAukBdALpBdEC6QF0/oz9F/ovCLoBdAF0/oz+jPdGBF37ow0XAun9FwLp/RcAAAAFAXQAAAuiEAAABwAbAB8AIwAnAAABESERIREhEQERIREhESERIREhESERIREhESEZAiERIREhEQERIREIuv6L/oz+jP0XAXQBdQF0AXQBdQF0AXT9GPujAXQBdAF1/RcBdAXRAukBdP6M/Rf6Lwi6AXQBdAF1/ov+jP6M90YEXfujDRcBdP6MAXT+jAF0AXX+iwAAAgF0AAAQAAuiAAUAGQAAAREhESERAREhESERIREhESERIREhESERIREHRf6M/oz9FwF0AXULo/ouBF37owXS90X9GAXRBF3+jP0X+i8IugF0AXT+jP0X/oz7o/6MBF37owAAAAEBdP0YC6ILogAhAAABESERIREhESERIREhESERIREhESERIREhESERIREhESERBF0C6P0Y/ov+jAF0AXUF0QF0/Rj9F/6MAXQC6QLo/oz+jP0YAXQBdAF0AXQF0gF0AXT+jP6MAXT+jPou/owBdP6M/Rj+jAAAAAIBdAAAC6IQAAALABMAACERIREhESERIREhEQERIREhESERAXQKLvi7BF37owdF+XX+iwLpAXULov6M/Rf+jPuj/owNFwF0AXX+i/6MAAAAAgF0AAALohAAAAsAEwAAIREhESERIREhESERAREhESERIREBdAou+LsEXfujB0X5dQF0Aun+jAui/oz9F/6M+6P+jA0XAXQBdf6L/owAAAACAXQAAAuiEAAACwAXAAAhESERIREhESERIREBESERIREhESERIREBdAou+LsEXfujB0X3RgF1BF0BdP0X/owLov6M/Rf+jPuj/owNFwF0AXX+i/6MAXT+jAAAAAMBdAAAC6IQAAALAA8AEwAAIREhESERIREhESERAREhESERIREBdAou+LsEXfujB0X3RgLpAXQC6Qui/oz9F/6M+6P+jA0XAun9FwLp/RcAAgF0AAAKLhAAAAsAEwAAIREhESERIREhESERAREhESERIREBdALp/RcIuv0XAun6L/6LAukBdAF0CLoBdP6M90b+jA0XAXQBdf6L/owAAAACAXQAAAouEAAACwATAAAhESERIREhESERIREBESERIREhEQF0Aun9Fwi6/RcC6fovAXQC6f6LAXQIugF0/oz3Rv6MDRcBdAF1/ov+jAAAAAIBdAAACi4QAAALABcAACERIREhESERIREhEQERIREhESERIREhEQF0Aun9Fwi6/RcC6fgAAXQEXgF0/Rf+jAF0CLoBdP6M90b+jA0XAXQBdf6L/owBdP6MAAAAAwF0AAAKLhAAAAsADwATAAAhESERIREhESERIREBESERIREhEQF0Aun9Fwi6/RcC6fgAAukBdALpAXQIugF0/oz3Rv6MDRcC6f0XAun9FwACAXQAAA0XC6IACwAbAAABETMRIREhESERIREBESERIREhESERIREhESERCXS6/oz9FwLp/Rf9F/6MAXQHRgF0AXX+i/6MAXQBdAXSAXT8Xf6M/F3+jAUXAXQFF/6M/oz6Lv6M/owAAAUBdAAAC6IQAAAXABsAHwAjACcAACERIREhESERIREhESERIREhESERIREhEQMRIREhESERAREhESERIREBdAF0AXUBdAF0AXUC6P6M/oz+i/6M/oy7AXUBdAF1/RcBdAF1AXQLov6M/oz+i/6MBdH0XgF0AXQBdQF0+i8NFwF0/owBdP6MAXQBdf6LAXX+iwAAAAADAXQAAAuiEAAAAwAPABcAAAERIREBESERIREhESERIREBESERIREhEQi6+6P+i/6MAXQHRgF0/oz66f6LAukBdQF0CLr3Rv6MAXQIugF0/oz3Rv6MDRcBdAF1/ov+jAADAXQAAAuiEAAAAwAPABcAAAERIREBESERIREhESERIREBESERIREhEQi6+6P+i/6MAXQHRgF0/oz66QF0Aun+jAF0CLr3Rv6MAXQIugF0/oz3Rv6MDRcBdAF1/ov+jAADAXQAAAuiEAAAAwAPABsAAAERIREBESERIREhESERIREBESERIREhESERIREIuvuj/ov+jAF0B0YBdP6M+LoBdQRdAXT9F/6MAXQIuvdG/owBdAi6AXT+jPdG/owNFwF0AXX+i/6MAXT+jAAGAXQAAAuiEAAAAwAPABMAFwAbAB8AAAERIREBESERIREhESERIREBESERIREhEQERIREhESERCLr7o/6L/owBdAdGAXT+jPl0AXUBdAF1/RcBdAF1AXQBdAi690b+jAF0CLoBdP6M90b+jA0XAXT+jAF0/owBdAF1/osBdf6LAAQBdAAAC6IQAAADAA8AEwAXAAABESERAREhESERIREhESERAREhESERIREIuvuj/ov+jAF0B0YBdP6M+LoC6QF0AukBdAi690b+jAF0CLoBdP6M90b+jA0XAun9FwLp/RcAAAAJAXQC6Ai6Ci4AAwAHAAsADwATABcAGwAfACMAAAERIREhESERAREhESERIREBESERAREhESERIREBESERIREhEQF0AXQEXQF1+i4BdQF0AXT9GAF0/RcBdQF0AXT6LwF0BF0BdQLoAXX+iwF1/osBdQF0/owBdP6MAXQBdP6MAXQBdf6LAXX+iwF1AXT+jAF0/owABgF0AAALoguiAAMABwALABUAIwAnAAAhESERIREhEQERIREBESERIREhFSERIREhESERIREhESERIREBESERAXQBdAF1BF39FwF0AXX+iwF1AXQBdPdG/owBdAXS+6MBdP6MBdEBdAF0/owBdP6MBF0C6P0Y/RcF0QF1AXS6+AABdAdGAXT+jPov/ov+jAi6AXT+jAAAAAACAXQAAAuiEAAACwATAAAhESERIREhESERIREBESERIREhEQLo/owC6QRdAuj+jPrp/osC6QF1AXQKLvXSCi710v6MDRcBdAF1/ov+jAAAAAIBdAAAC6IQAAALABMAACERIREhESERIREhEQERIREhESERAuj+jALpBF0C6P6M+ukBdALp/owBdAou9dIKLvXS/owNFwF0AXX+i/6MAAAAAgF0AAALohAAAAsAFwAAIREhESERIREhESERAREhESERIREhESERAuj+jALpBF0C6P6M+LoBdQRdAXT9F/6MAXQKLvXSCi710v6MDRcBdAF1/ov+jAF0/owAAAADAXQAAAuiEAAACwAPABMAACERIREhESERIREhEQERIREhESERAuj+jALpBF0C6P6M+LoC6QF0AukBdAou9dIKLvXS/owNFwLp/RcC6f0XAAIBdAAAC6IQAAAXAB8AACERIxEhESERIREhESERIREhESERIREjEQERIREhESERBRe6/ov+jALpAXQBdAF1Auj+jP6Muv0XAXQC6f6MBF0BdAF0BF37o/6MAXQEXfuj/oz+jPujDRcBdAF1/ov+jAACAXQAAAuiC6IAAwAPAAABESERAREhESERIREhESERCLr7o/0XAukF0QF0/oz6LwLoBdL6Lv0YC6L+jP6M+i7+jP6MAAEBdAAAC6ILogAdAAAhESERIREhESERIREhESERIxEhESERIREhESERIREBdAdGAXT+jAF0AXT+jPujugIuAXX+i/6MAXT9GAui/oz9F/0Y/ov+jP6MAXQBdP6MAXQBdQLoAun10gAAAwF0AAALoguiAAMAEQAZAAABESERAREhESERIREhESERIREBESERIREhEQi6+6P+i/6MAXQF0vouB0YBdPl1/osC6QF1AXQBdP6M/owBdAF0AXUBdAF0/oz6Lwi6AXQBdP6M/owAAAADAXQAAAuiC6IAAwARABkAAAERIREBESERIREhESERIREhEQERIREhESERCLr7o/6L/owBdAXS+i4HRgF0+XUBdALp/owBdAF0/oz+jAF0AXQBdQF0AXT+jPovCLoBdAF0/oz+jAAAAAMBdAAAC6ILogADABEAHQAAAREhEQERIREhESERIREhESERAREhESERIREhESERCLr7o/6L/owBdAXS+i4HRgF090YBdQRdAXT9F/6MAXQBdP6M/owBdAF0AXUBdAF0/oz6Lwi6AXQBdP6M/owBdP6MAAAABgF0AAALoguiAAMAEQAVABkAHQAhAAABESERAREhESERIREhESERIREBESERIREhEQERIREhESERCLr7o/6L/owBdAXS+i4HRgF0+AABdQF0AXX9FwF0AXUBdAF0AXT+jP6MAXQBdAF1AXQBdP6M+i8IugF0/owBdP6MAXQBdP6MAXT+jAAAAAQBdAAAC6ILogADABEAFQAZAAABESERAREhESERIREhESERIREBESERIREhEQi6+6P+i/6MAXQF0vouB0YBdPdGAukBdALpAXQBdP6M/owBdAF0AXUBdAF0/oz6Lwi6Auj9GALo/RgABQF0AAALoguiAAMAFQAZAB0AIQAAAREhEQERIREhESERIREhESERIREhEQERIREhESERAREhEQi6+6P+i/6MAXQF0vouAukBdALpAXT4uwF0AXQBdf0XAXQBdAF0/oz+jAF0AXQBdQF0AXQBdf6L/oz6Lwi6AXT+jAF0/owBdAF0/owAAwF0AAAUXQdFAAMABwAhAAABESERAREhEQERIREhESERIREhESERIREhESERIREhESERCLr7ow0X+6P10f6MAXQF0vouB0YBdAdGAXX4ugXR+Lr+jAF0AXT+jALpAXT+jPujAXQBdAF1AXQBdP6MAXT+jP0X/oz+jAF0/owAAAABAXT9GAuiB0UAGQAAAREhESERIREhESERIREhESERIREhESERIREEXQLo+6P+jAF0B0YBdP0Y+6MEXQLo/oz+jP0YAXQBdAF0BF0BdP6M/owBdPujAXT+jP0Y/owAAAADAXQAAAuiC6IAAwARABkAAAERIREBESERIREhESERIREhEQERIREhESERCLr7o/6L/owBdAdGAXT4uwXR+un+iwLpAXUEXQF0/oz7owF0BF0BdP6M/Rf+jP6MCLoBdAF0/oz+jAAAAAMBdAAAC6ILogADABEAGQAAAREhEQERIREhESERIREhESERAREhESERIREIuvuj/ov+jAF0B0YBdPi7BdH66QF0Aun+jARdAXT+jPujAXQEXQF0/oz9F/6M/owIugF0AXT+jP6MAAAAAwF0AAALoguiAAMAEQAdAAABESERAREhESERIREhESERIREBESERIREhESERIREIuvuj/ov+jAF0B0YBdPi7BdH4ugF1BF0BdP0X/owEXQF0/oz7owF0BF0BdP6M/Rf+jP6MCLoBdAF0/oz+jAF0/owAAAAEAXQAAAuiC6IAAwARABUAGQAAAREhEQERIREhESERIREhESERAREhESERIREIuvuj/ov+jAF0B0YBdPi7BdH4ugLpAXQC6QRdAXT+jPujAXQEXQF0/oz9F/6M/owIugLo/RgC6P0YAAIAAAAABF0LogADAAsAACERIREBESERIREhEQF0Aun9F/6MAugBdQdF+LsIugF0AXT+jP6MAAAAAgF0AAAF0QuiAAMACwAAIREhEQERIREhESERAXQC6f0XAXQC6f6MB0X4uwi6AXQBdP6M/owAAAAC/0YAAAaLC6IAAwAPAAAhESERAREhESERIREhESERAXQC6frpAXQEXQF0/Rf+jAdF+LsIugF0AXT+jP6MAXT+jAAAAAP/RgAABosLogADAAcACwAAIREhEQERIREhESERAXQC6frpAugBdALpB0X4uwi6Auj9GALo/RgAAgF0AAANFwuiAAMAFwAAAREhEQERIREhESERIREhESERIREhESERCLr7o/6L/owBdAXS/RcC6QLoAXX+i/6MAXQEXfuj/owBdARdAXQBdQF0AXT+jP6M+Lr+jAAFAXQAAAuiC6IACQANABEAFQAZAAAhESERIREhESERAxEhESERIREBESERIREhEQF0CLoBdP0Y+6O7AXUBdAF1/RcBdAF1AXQHRf6M+i8F0fovCLoBdP6MAXT+jAF0AXT+jAF0/owAAAMBdAAAC6ILogADAA8AFwAAAREhEQERIREhESERIREhEQERIREhESERCLr7o/6L/owBdAdGAXT+jPrp/osC6QF1AXQEXfuj/owBdARdAXT+jPuj/owIugF0AXT+jP6MAAMBdAAAC6ILogADAA8AFwAAAREhEQERIREhESERIREhEQERIREhESERCLr7o/6L/owBdAdGAXT+jPrpAXQC6f6MAXQEXfuj/owBdARdAXT+jPuj/owIugF0AXT+jP6MAAMBdAAAC6ILogADAA8AGwAAAREhEQERIREhESERIREhEQERIREhESERIREhEQi6+6P+i/6MAXQHRgF0/oz4ugF1BF0BdP0X/owBdARd+6P+jAF0BF0BdP6M+6P+jAi6AXQBdP6M/owBdP6MAAYBdAAAC6ILogADAA8AEwAXABsAHwAAAREhEQERIREhESERIREhEQERIREhESERAREhESERIREIuvuj/ov+jAF0B0YBdP6M+XQBdQF0AXX9FwF0AXUBdAF0BF37o/6MAXQEXQF0/oz7o/6MCLoBdP6MAXT+jAF0AXT+jAF0/owABAF0AAALoguiAAMADwATABcAAAERIREBESERIREhESERIREBESERIREhEQi6+6P+i/6MAXQHRgF0/oz4ugLpAXQC6QF0BF37o/6MAXQEXQF0/oz7o/6MCLoC6P0YAuj9GAAAAAMBdAF0Ci4IugADAAcACwAAAREhEQERIREBESERBF0C6PovCLr6LwLoAXQBdP6MAukBdP6MAugBdf6LAAMBdAAAC6IHRQAJABMALwAAAREjFSMVIxUjFQM1MzUzNTM1IREBETM1MzUhESERIRUzNSERIxUjFSERIREhNSEVCLq6u7q6urq6uv0Y/Re6uv6MAXQF0roCLrq6AXT+jPov/osBdALpu7q6ugF0uru6uv0X/RgBdLq6AukBdLq6/oy6uv0X/oy6ugAAAgF0AAALoguiAAkAEQAAIREhESERIREhEQERIREhESERAuj+jALpBF0C6Pl1/osC6QF1AXQF0fovBdH4uwi6AXQBdP6M/owAAgF0AAALoguiAAkAEQAAIREhESERIREhEQERIREhESERAuj+jALpBF0C6Pl1AXQC6f6MAXQF0fovBdH4uwi6AXQBdP6M/owAAgF0AAALoguiAAkAFQAAIREhESERIREhEQERIREhESERIREhEQLo/owC6QRdAuj3RgF1BF0BdP0X/owBdAXR+i8F0fi7CLoBdAF0/oz+jAF0/owAAwF0AAALoguiAAkADQARAAAhESERIREhESERAREhESERIREC6P6MAukEXQLo90YC6QF0AukBdAXR+i8F0fi7CLoC6P0YAuj9GAAAAAIBdPujC6ILogAPABcAAAERIREhESERIREhESERIREBESERIREhEQLoBdL6Lv6MAukEXQLo/oz66QF0Aun+jPujAXUC6AF0BdH6LwXR9dP+iw0XAXQBdP6M/owAAgF0+6MLoguiAAMADwAAAREhEQERIREhESERIREhEQi6+6P9FwLpBdEBdP6M+i8BdARd+6P6Lw//+6P+jPuj/oz7owADAXT7owuiC6IADwATABcAAAERIREhESERIREhESERIREBESERIREhEQLoBdL6Lv6MAukEXQLo/oz4ugLpAXQC6fujAXUC6AF0BdH6LwXR9dP+iw0XAuj9GALo/RgAAAADAXQAAAuiEAAAFwAbAB8AACERIxEhESERIREhESERIREhESERIREjEQERIREhESERBRe6/ov+jALpAXQBdAF1Auj+jP6MuvroAukBdALpBF0BdAF0BF37o/6MAXQEXfuj/oz+jPujDRcC6f0XAun9FwAAAAIBdAAAC6ILogAHABcAAAERIREhESERAREhESERIREhESERIREhEQi6/ov+jP6M/RcBdAF1BF0BdAF0/Rj7owXRAukBdP6M/Rf6Lwi6AXQBdP6M/oz3RgRd+6MAAwF0AAALoguiAAMABwATAAABESERAREhEQERIREhESERIREhEQi6+6MEXfuj/RcIugF0/owBdP6MAXQEXfujBdEC6f0X+LsLov6M/Rf+jPuj/owAAQF0AAAKLguiAAUAACERIREhEQF0CLr6Lwui/oz10gACAXQAABAAC6IACwAfAAABESERIxEhESMRIREBESERIREhESERIREhESERIREhEQui/oy6/oy7/oz7owF0AXUBdAF0AukBdAF1AXQBdQIuAukC6QF0/oz9F/0X/dICLgLpAukCLgF0/oz90v0X/Rf90gAAAAEBdAAAC6ILogALAAAhESERIREhESERIREBdAou+LsEXfujB0ULov6M/Rf+jPuj/owAAAABAXQAAAuiC6IAGwAAIREhESERIREhESERIREhESERIREhESERIREhEQF0AXQBdQF0AXQBdfi6Ci7+jP6M/ov+jP6MB0UC6AF1AXQBdAF1AXQBdP0Y/ov+jP6M/ov+jP6MAAAAAQF0AAALoguiAAsAACERIREhESERIREhEQF0AukEXQLo/Rj7owui+6MEXfReBdH6LwAAAAMBdAAAC6ILogADAAcAEwAAAREhERMRIREBESERIREhESERIREFFwLpuvuj/ov+jAF0B0YBdP6MBRcBdP6M/F0IuvdG/owBdAi6AXT+jPdG/owAAAEBdAAACi4LogALAAAhESERIREhESERIREBdALp/RcIuv0XAukBdAi6AXT+jPdG/owAAAABAXQAAAuiC6IAHwAAIREhESERIREhESERIREhESERIREhESERIREhESERIREBdALpAXQBdAF1Auj+jP6M/osBdQF0AXT9GP6L/oz+jAui+6MBdQF0AXT+jP6M/ov+jP6M/ov9GALoAXUBdPovAAAAAQF0AAAQAAuiACMAACERIREhESERIREhESERIREhESERIREhESERIxEhESMRIREhEQF0AXQBdQF0AXQC6QF0AXUBdAF1/Rf+i/6Muv6Mu/6M/owCLgLpAukCLgF0/oz90v0X/Rf90gIuAukC6QF0/oz9F/0X/dIAAQF0AAALoguiABcAACERIREhESERIREhESERIREhESERIREhEQF0AXQBdQF0AXQBdQF0AXT9GP6L/oz+jAui/oz+jP6LAXUBdAF09F4F0f6MAXT6LwAAAAEBdAAAC6ILogAXAAAhESERIREhESERIREhESERIREhESERIREBdAF0AXUBdAF0AXUC6P6M/oz+i/6M/owLov6M/oz+i/6MBdH0XgF0AXQBdQF0+i8AAAADAXQAAAuiC6IAAwAHAAsAACERIREBESERAREhEQF0Ci74AAXS+AAKLgF0/owFFwF0/owFFwF0/owAAAACAXQAAAuiC6IAAwAPAAABESERAREhESERIREhESERCLr7o/6L/owBdAdGAXT+jAF0CLr3Rv6MAXQIugF0/oz3Rv6MAAEBdAAADosLogALAAAhESERIREhESERIREC6P6MDRf+jP0X+6MKLgF0/oz10gou9dIAAAACAXQAAAuiC6IAAwANAAABESERAREhESERIREhEQi6+6P9Fwi6AXT+jPovB0UC6f0X+LsLov6M/Rf+jPovAAAAAQF0AAALoguiABcAACERIREhESERIREhESERIREhESERIREhEQF0AXQBdf6L/owKLvi7AXQBdP6M/owHRQOiAXUBdAF1A6L+jP3S/ov+jP6L/dL+jAAAAAEBdAAAC6ILogAHAAAhESERIREhEQRd/RcKLvxeCi4BdP6M9dIAAAABAXQAAA6LC6IAHwAAIREjESERIREhESERIREhESERIREhESERIREhESERIxEGi7r+jP6L/owC6QF0AXQBdQF0AXQC6f6M/ov+jLoEXQF0AXQC6QF0/oz9F/6MAXQC6QF0/oz9F/6M/oz7owADAXQAAA6LC6IAAwAHABsAAAERIREhESERAREhESERIREhESERIREhESERIREGi/3SB0X90v0X/F3+jAF0A6MC6QOjAXT+jPxdAugF0vouBdL6Lv0YAXQBdAXSAXQBdP6M/oz6Lv6M/owAAAABAXQAAAuiC6IAIwAAIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERAXQBdAF1/ov+jALpAXQBdAF1Auj+jP6MAXQBdP0Y/ov+jP6MBF0BdAF0AXUC6P0Y/osBdQLo/Rj+i/6M/oz7owRdAXT+jPujAAAAAQF0AAARdAuiACcAACERIxEhESERIREhESERIREhETMRIREzESERIREhESERIREhESERIxEIALv+jP6M/ov+jALpAXQBdLsC6LoBdQF0Aun+jP6L/oz+i7oEXQF0AXQBdQF0AXT+jP6M/osEXfujAXUBdAF0/oz+jP6L/oz+jPujAAAAAQF0AAARdAuiAC8AACERIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhEQF0BF3+jP6L/owBdAF1Ci4BdQF0/oz+i/6MBF34ugF0AXUBdP6M+Lr+jAF0AXQBdQF0AXQBdQF0AukBdAF0/oz+jP0X/oz+i/6M/owC6AF1AXQC6QF0/oz9F/6M/ov9GAAAAAIBdAAAC6IHRQAHABsAAAERIREhESERAREhESERIREhESERIREhESERIREF0QF0/oz+jP6L/owBdARdAXUC6P6MAXT9GP6LAXQBdAF1AXT7o/6MAXQEXQF0/owBdP6M+6P+jAF0/owAAQF0+6MLoguiACMAAAERIREhESERIREhESERIREhESERIREhESERIREhESERIREhEQF0AXQBdQXRAXT+jAF0/oz+jP0XAXQBdf0XAun9F/6MAXT+jPujDRcBdAF0/oz8Xf6M/dH+jP6MAXQBdAIvAXQDo/6M+i7+jPovAAMBdAAAC6IQAAALAA8AEwAAIREhESERIREhESERAREhESERIREBdAou+LsEXfujB0X3RgLpAXQC6Qui/oz9F/6M+6P+jA0XAun9FwLp/RcAAQF0AAALoguiAB8AACERIREhESERIREhESERIREhESERIREhESERIREhESERBF3+i/6MAXQBdQXRAXT9GP0X/owEXfujAXQC6QLo/owBdAF0BdIBdAF0/oz+jAF0/oz90f6M/dH+jAF0/oz+jAAAAAEBdAAACi4LogALAAAhESERIREhESERIREBdALp/RcIuv0XAukBdAi6AXT+jPdG/owAAAADAXQAAAroEAAACwAPABMAACERIREhESERIREhEQERIREhESERAXQC6f0XCLr90gLo90YC6QF0AukBdAi6AXT+jPdG/owNFwLp/RcC6f0XAAIBdAAAEi4LogADABcAAAERIREBESERIREhESERIREhESERIREhEQ9F/F310gF0AXUHRQUYAXT+jPgA/Rf+jAF0BF37o/6MAXQIugF0+6P+jPuj/owKLvdG/owAAgF0AAARdAuiAAMAFQAAAREhEQERIREhESERIREhESERIREhEQ6L/Rf10gLpBF0C6AReAXT+jPi6+6MBdARd+6P+jAui+6MEXfuj/oz7o/6MBdH6LwAAAAIBdAAAC6ILogAHABcAAAERIREhESERAREhESERIREhESERIREhEQi6/ov+jP6M/RcBdAF1BF0BdAF0/Rj7owaLAi8BdP6M/dH5dQi6AXQBdP6M/oz3RgUX+ukAAgF0AAALoguiAAMADwAAAREhEQERIREhESERIREhEQi6+6P9Fwi6+i8F0QF0/owBdARd+6P+jAui/oz9F/6M+6P+jAADAXQAAAuiC6IAAwAHABMAAAERIREBESERAREhESERIREhESERCLr7owRd+6P9Fwi6AXT+jAF0/owBdARd+6MF0QLp/Rf4uwui/oz9F/6M+6P+jAABAXQAAAouC6IABQAAIREhESERAXQIuvovC6L+jPXSAAIBdP3SDRcLogADABEAAAERIREBESERIREhESERIREhEQi6/Rf7owF0AXUHRQF1/Rf6LwF0CLr3RvxeA6IIugF09dL8XgIu/dIAAAABAXQAAAuiC6IACwAAIREhESERIREhESERAXQKLvi7BF37owdFC6L+jP0X/oz7o/6MAAAAAQF0AAANFwuiABsAACERIREhESERIREhESERIREhESERIREhESERIREBdAF0/owC6QF0AukBdALp/osBdf0X/oz9F/6MBdEBdARd+6MEXfujBF37o/6M+i8F0fovBdH6LwAAAAEBdAAAC6ILogAbAAAhESERIREhESERIREhESERIREhESERIREhESERAuj+jALpBF38XQOj+6P9FwF0B0YBdP6MAXT+jAF0AXT+jAOjAXQDo/6MAXQBdP6M/F3+jPxd/owAAAABAXQAAAuiC6IAFwAAIREhESERIREhESERIREhESERIREhESERAXQC6QF0AXQBdQF0AXT9GP6L/oz+jP6LC6L6LwF0AXUBdAF09F4F0f6M/ov+jP6MAAAAAgF0AAALohAAABcAIwAAIREhESERIREhESERIREhESERIREhESERExEhESERIREhESERAXQC6QF0AXQBdQF0AXT9GP6L/oz+jP6Luv6MAukC6QLo/owLovovAXQBdQF0AXT0XgXR/oz+i/6M/owNFwF0AXX+iwF1/ov+jAAAAAABAXQAAAuiC6IAHwAAIREhESERIREhESERIREhESERIREhESERIREhESERIREBdALpAXQBdAF1Auj+jP6M/osBdQF0AXT9GP6L/oz+jAui+6MBdQF0AXT+jP6M/ov+jP6M/ov9GALoAXUBdPovAAAAAQF0AAALoguiAA0AACERIREhESERIREhESERAXQBdAF1B0X9GP0X/owBdAi6AXT0Xgou90b+jAABAXQAAAuiC6IAFwAAIREhESERIREhESERIREhESERIREhESERAXQBdAF1AXQBdAF1AXQBdP0Y/ov+jP6MC6L+jP6M/osBdQF0AXT0XgXR/owBdPovAAAAAQF0AAALoguiAAsAACERIREhESERIREhEQF0AukEXQLo/Rj7owui+6MEXfReBdH6LwAAAAIBdAAAC6ILogADAA8AAAERIREBESERIREhESERIREIuvuj/ov+jAF0B0YBdP6MAXQIuvdG/owBdAi6AXT+jPdG/owAAQF0AAALoguiAAcAACERIREhESERAXQKLv0Y+6MLovReCi710gAAAAIBdAAAC6ILogADAA0AAAERIREBESERIREhESERCLr7o/0XCLoBdP6M+i8HRQLp/Rf4uwui/oz9F/6M+i8AAAABAXQAAAuiC6IAGwAAIREhESERIREhESERIREhESERIREhESERIREhEQRd/ov+jAF0AXUF0QF0/Rj9F/6MAXQC6QLo/owBdAF0BdIBdAF0/oz+jAF0/oz6Lv6MAXT+jP6MAAAAAQF0AAALoguiAAcAACERIREhESERBRf8XQou/F4KLgF0/oz10gAAAAEBdAAAC6ILogATAAAhESERIREhESERIREhESERIREhEQLo/owC6QRd+i7+jALpBF0C6P6MAXQBdP6MA6MBdAUX+ukFF/XS/owAAAADAXQAABAAC6IAAwAHABsAAAERIREhESERAREhESERIREhESERIREhESERIREHRf0YCLr9F/0X+6P+jAF0BF0C6QRdAXX+i/ujAugF0vouBdL6Lv0YAXQBdAXSAXQBdP6M/oz6Lv6M/owAAAABAXQAAAuiC6IAIwAAIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERAXQBdAF1/ov+jALpAXQBdAF1Auj+jP6MAXQBdP0Y/ov+jP6MBF0BdAF0AXUC6P0Y/osBdQLo/Rj+i/6M/oz7owRdAXT+jPujAAAAAQF0/dINFwuiAAsAAAERIREhESERIREhEQou90YC6QRdAugBdf3SAi4LovXSCi710vxeAAEBdAAAC6ILogALAAAhESERIREhESERIREIuvou/owC6QRdAugFFwF0BRf66QUX9F4AAAABAXQAAA6LC6IACwAAIREhESERIREhESERAXQC6QIuAukCLgLpC6L10gou9dIKLvReAAAAAQF0/dIQAAuiAA8AAAERIREhESERIREhESERIRENF/RdAukCLgLpAi4C6QF1/dICLgui9dIKLvXSCi710vxeAAIBdAAADdELogADAA8AAAERIREBESERIREhESERIREK6Puj/Rf90gUXBdIBdP6MAXQEXfuj/owKLgF0+6P+jPuj/owAAwF0AAAQAAuiAAMADQARAAABESERAREhESERIREhESERIREIuvuj/RcC6QXRAXT+jALpAukBdARd+6P+jAui+6P+jPuj/owLovReAAIBdAAAC6ILogADAA0AAAERIREBESERIREhESERCLr7o/0XAukF0QF0/owBdARd+6P+jAui+6P+jPuj/owAAAABAXQAAAuiC6IAHwAAIREhESERIREhESERIREhESERIREhESERIREhESERIREC6P6MAukC6AF1+6MEXf6L/Rj9FwF0BdIBdAF0/oz+jAF0AXT+jAF0Ai8BdAIvAXT+jAF0AXT+jP6M+i7+jP6MAAAAAgF0AAAQuguiAAMAFwAAAREhEQERIREhESERIREhESERIREhESERDdH7o/gAA6MBdAF1B0UBdf6L+Lv+i/6MAXQIuvdG/owLovrpA6MBdP6M90b+jAF0A6P66QACAXQAAAuiC6IAAwARAAABESERAREhESERIREhESERIREIuvuj/RcBdP6MAXQIuv0Y+6MHRQLp/Rf4uwXRAXQC6QF09F4F0fovAAAAAgF0AAALogdFAAMAEQAAAREhEQERIREhESERIREhESERCLr7o/6L/owBdAXS+i4HRgF0AXQBdP6M/owBdAF0AXUBdAF0/oz6LwAAAAIBdAAAC6ILogAFABcAAAERIREhEQERIREhESERIREhESERIREhEQi6/ov9GP6L/owBdAdG+i8BdARdAXT+jAF0BF3+jP0X/owBdAi6AXT+jPujAXT+jPuj/owAAwF0AAALogdFAAMABwATAAABESERAREhEQERIREhESERIREhEQi6+6MEXfuj/RcIugF0/owBdP6MAXQBdP6MAukBdP6M+6MHRf6M/oz+i/6M/owAAQF0AAAIugdFAAUAACERIREhEQF0B0b7owdF/oz6LwACAXT90g0XB0UAAwARAAABESERAREhESERIREhESERIREIuv0X+6MBdAF1B0UBdf0X+i8BdARd+6P8XgOiBF0BdPov/F4CLv3SAAAAAgF0AAALogdFAAMAEQAAAREhEQERIREhESERIREhESERCLr7o/6L/owBdAdGAXT4uwXRBF0BdP6M+6MBdARdAXT+jP0X/oz+jAAAAAEBdAAADRcHRQAbAAAhESERIREhESERIREhESERIREhESERIREhESERAXQBdP6MAukBdALpAXQC6f6LAXX9F/6M/Rf+jALoAXUC6P0YAuj9GALo/Rj+i/0YAuj9GALo/RgAAAABAXQAAAuiB0UAGwAAIREhESERIREhESERIREhESERIREhESERIREhEQLo/owC6QRd/RcC6fuj/RcBdAdGAXT+jAF0/owBdAF0/owBdAF1AXT+jAF0AXT+jP6M/ov+jP6MAAAAAQF0AAALogdFABMAACERIREhESERITUhESERIREhESEVAXQC6QF0AXQBdQLo/Rj+i/6M/owHRfxdAXUBdLr4uwOi/oz+jLoAAgF0AAALoguiABMAHwAAIREhESERIREhNSERIREhESERIRUDESERIREhESERIREBdALpAXQBdAF1Auj9GP6L/oz+jLv+jALpAukC6P6MB0X8XQF1AXS6+LsDov6M/oy6CLoBdAF0/owBdP6M/owAAAEBdAAACi4HRQAXAAAhESERIREhESERIREhESERIREhESERIREBdALpAXQBdALp/oz+iwF1AXT9F/6M/owHRf0YAXQBdP6M/oz+i/6M/owBdAF0/RgAAAABAXQAAAuiB0UADQAAIREhESERIREhESERIREBdAF0AXUHRf0Y/Rf+jAF0BF0BdPi7BdH7o/6MAAEBdAAAC6IHRQATAAAhESERIREhESERIREhESERIREhEQF0AukBdAF0AXUC6P0Y/ov+jP6MB0X+jP6MAXQBdPi7Auj+jAF0/RgAAAABAXQAAAuiB0UACwAAIREhESERIREhESERAXQC6QRdAuj9GPujB0X9GALo+LsC6P0YAAAAAgF0AAALogdFAAMADwAAAREhEQERIREhESERIREhEQi6+6P+i/6MAXQHRgF0/owBdARd+6P+jAF0BF0BdP6M+6P+jAABAXQAAAuiB0UABwAAIREhESERIREBdAou/Rj7owdF+LsF0fovAAAAAgF0+6MLogdFAAMADQAAAREhEQERIREhESERIREIuvuj/RcIugF0/oz6LwF0BF37o/ovC6L+jPuj/oz7owAAAAEBdAAAC6IHRQATAAAhESERIREhESERIREhESERIREhEQLo/owBdAdGAXT9GPujBF0C6P6MAXQEXQF0/oz+jAF0+6MBdP6M/owAAAABAXQAAAouB0UABwAAIREhESERIREEXf0XCLr9FwXRAXT+jPovAAAAAQF0+6MLogdFAA8AAAERIREhESERIREhESERIREC6AXS+i7+jALpBF0C6P6M+6MBdQLoAXQF0fovBdH10/6LAAMBdPujDosLogADAAcAGwAAAREhESERIREBESERIREhESERIREhESERIREhEQaL/dIHRf3S/Rf8Xf6MAXQDowLpA6MBdP6M/F0BdARd+6MEXfuj+i8EXQF0BF0BdARd+6P+jPuj/oz7owAAAAEBdAAAC6IHRQAjAAAhESERIREhESERIREhFSE1IREhESERIREhESERIREhNSEVIREBdAF0AXX+i/6MAukBdAF0AXUC6P6M/owBdAF0/Rj+i/6M/owBdAF0AXUBdAF0/oy6ugF0/oz+jP6L/oz+jAF0urr+jAAAAAEBdP3SDRcHRQALAAABESERIREhESERIREKLvdGAukEXQLoAXX90gIuB0X6LwXR+i/8XgABAXQAAAuiB0UACwAAIREhESERIREhESERCLr6Lv6MAukEXQLoAi4BdAOj/F0Do/i7AAAAAQF0AAANFwdFAAsAACERIREhESERIREhEQF0AukBdALpAXQC6QdF+i8F0fovBdH4uwAAAAEBdP3SDosHRQAPAAABESERIREhESERIREhESERC6L10gLpAXQC6QF0AukBdP3SAi4HRfovBdH6LwXR+i/8XgACAXQAAA3RB0UAAwAPAAABESERAREhESERIREhESERCuj7o/0X/dIFFwXSAXT+jAF0AXT+jP6MBdEBdP0Y/ov+jP6MAAMBdAAADosHRQADAA0AEQAAAREhEQERIREhESERIREhESERB0X9GP0XAukEXQF0/owC6ALpAXQBdP6M/owHRf0Y/ov+jP6MB0X4uwACAXQAAAuiB0UAAwANAAABESERAREhESERIREhEQi6+6P9FwLpBdEBdP6MAXQBdP6M/owHRf0Y/ov+jP6MAAAAAQF0AAALogdFABcAACERIREhESERIREhESERIREhESERIREhEQLo/owC6QRd/RcC6fuj/RcBdAdGAXT+jAF0AXT+jAF0AXUBdP6MAXQBdP6M+6P+jAAAAAIBdAAAEAAHRQADABcAAAERIREBESERIREhESERIREhESERIREhEQ0X+6P4ugLpAXQBdAdGAXX+i/i6/oz+jAF0BF37o/6MB0X9GAF0AXT+jPuj/owBdAF0/RgAAgF0AAALogdFAAMAEQAAAREhEQERIREhESERIREhESERCLr7o/0XAXT+jAF0CLr9GPujBF0BdP6M+6MC6AF1AXQBdPi7Auj9GAAAAAMBdAAAC6ILogADABEAGQAAAREhEQERIREhESERIREhESERAREhESERIREIuvuj/ov+jAF0B0YBdPi7BdH66f6LAukBdQRdAXT+jPujAXQEXQF0/oz9F/6M/owIugF0AXT+jP6MAAAABAF0AAALoguiAAMAEQAVABkAAAERIREBESERIREhESERIREhEQERIREhESERCLr7o/6L/owBdAdGAXT4uwXR+LoC6QF0AukEXQF0/oz7owF0BF0BdP6M/Rf+jP6MCLoC6P0YAuj9GAACAXQAAAi6C6IABQANAAAhESERIREDESERIREhEQF0B0b7o7sBdQLp/osHRf6M+i8IugF0AXT+jP6MAAABAXQAAAuiB0UAFwAAIREhESERIREhESERIREhESERIREhESERAuj+jAF0B0YBdP0Y+6MC6P0YBF0C6P6MAXQEXQF0/oz+jAF0/oz+i/6MAXT+jP6MAAAAAgF0AAAEXQuiAAMABwAAIREhEQERIREBdALp/RcC6QdF+LsIugLo/RgAAAAD/0YAAAaLC6IAAwAHAAsAACERIREBESERIREhEQF0Aun66QLoAXQC6QdF+LsIugLo/RgC6P0YAAIBdAAAEXQHRQADABUAAAERIREBESERIREhESERIREhESERIREOi/0X9dIBdAi6BF4BdP6M+Lr9F/6MAXQBdP6M/owBdAXR/Rj+i/6M/owF0fuj/owAAAACAXQAABF0B0UAAwAVAAABESERAREhESERIREhESERIREhESERDov9F/XSAukEXQLoBF4BdP6M+Lr7owF0AXT+jP6MB0X9GALo/Rj+i/6M/owC6P0YAAAAAQAAAAALoguiABcAACERIREhESERIREhESERIREhESERIREhEQF0/owBdALpAuj9GAF0BF0BdP0Y/ov9GAi6AXQBdP6M/oz9FwF0/oz6LwXR/oz7owAAAAIBdAAACi4LogAXAB8AACERIREhESERIREhESERIREhESERIREhGQIhESERIREBdALpAXQBdALp/oz+iwF1AXT9F/6M/owBdALp/osHRf0YAXQBdP6M/oz+i/6M/owBdAF0/RgIugF0AXT+jP6MAAACAXQAAAuiC6IAEwAbAAAhESERIREhESE1IREhESERIREhFRMRIREhESERAXQC6QF0AXQBdQLo/Rj+i/6M/oy6/osC6QF1B0X8XQF1AXS6+LsDov6M/oy6CLoBdAF0/oz+jAAAAgF0+6MLoguiAA8AGwAAAREhESERIREhESERIREhEQERIREhESERIREhEQLoBdL6Lv6MAukEXQLo/oz5dP6MAukC6QLo/oz7owF1AugBdAXR+i8F0fXT/osNFwF0AXT+jAF0/oz+jAABAXQAAAouDdEABwAAIREhESERIREBdAXRAun6LwuiAi/8XfXSAAAAAQF0AAAIugl0AAcAACERIREhESERAXQEXQLp+6MHRQIv/F36LwAAAAEAAAAACi4LogANAAAhESERIREhESERIREhEQF0/owBdAi6+i8C6P0YBdEBdARd/oz9F/6M+i8AAQAAAAAIugdFAA0AACERIREhESERIREhESERAXT+jAF0B0b7owLo/RgC6AF1Auj+jP6M/ov9GAABAXT90g6LC6IAHwAAAREhESERIREhESERIREhESERIREhESERIREhESERIRELov6M/oz9F/6M/RcBdP6MAukBdALpAXQC6f6LAXUBdP3SAi4FF/rpBRf66QUXAXQFF/rpBRf66QUX+un+jPxd/F4AAQF0/dIOiwdFAB8AAAERIREhESERIREhESERIREhESERIREhESERIREhESERC6L+jP6M/Rf+jP0XAXT+jALpAXQC6QF0Aun+iwF1AXT90gIuAuj9GALo/RgC6AF1Auj9GALo/RgC6P0Y/ov+jPxeAAEBdP3SDRcLogAjAAABESERIREhESERIREhESERIREhESERIREhESERIREhESERIREKLv6M/ov+jP6M/RcC6QF0AXQBdQLo/oz+jP6LAXUBdAF0AXX90gIuAugBdQF0+i8LovujAXUBdAF0/oz+jP6L/oz+jP6L/oz8XgABAXT90gxdB0UAGQAAAREhESERIREhESERIREhESERIREhESERIREJdP3R/oz+jP0XAukBdAIvAuj90v6LAXUDo/3SAi4BdAF0/RgHRf0YAXQBdP6M/oz+i/6M/F4AAAABAXQAAA0XC6IAJwAAIREhETMRIREzESERIREhESERIREhESERIREhESERIREhESMRIREjEQF0Aum6AXS6AXUBdALp/ov+jP6MAXQBdAF1/Rf+jP6Luv6Mugui+6MC6f0XAXUBdAF0/oz+jP6L/oz+jP6L/RgC6AF1AXT9FwLp+i8AAAABAXQAAAuiB0UAHwAAIREhETMRIREzESERIREhESERIREhESERIREjESERIxEBdALpugF0ugF1Auj+jP6MAXQBdP0Y/ou6/oy6B0X9GAF0/owBdAF0/oz+jP6L/oz+jAF0AXT+jAF0/RgAAAABAAAAAAuiC6IAJwAAIREhESERIREhESERIREhESERIREhESERIREhESERIREhESERIREhEQF0/owBdALpAXT+jAF0AXQBdQLo/oz+jP6LAXUBdAF0/Rj+i/6M/owIugF0AXT+jP6M/osBdQF0AXT+jP6M/ov+jP6M/ov9GALoAXUBdPovAAAAAQAAAAAK6AuiAB8AACERIREhESERIREhESERIREhESERIREhESERIREhESERAXT+jAF0AukBdP6MAXQCLwLo/dL+iwF1AXT9F/6M/owIAAF0Ai790v6M/F0BdAF0/oz+jP6L/oz+jAF0AXT9GAAAAAEBdAAADdELogAhAAAhESERIREhESERIREhESERIREhESERIREhESERIREhESERA6L90gUXAXUBdAF0Aun+jP6L/owBdAF1AXT9F/6M/oz+iwouAXT7owF1AXQBdP6M/oz+i/6M/oz+i/0YAugBdQF0+i8AAQF0AAANFwdFABkAACERIREhESERIREhESERIREhESERIREhESERA6L90gUXAXUBdAOj/dH+jAF0Ai/8Xf6M/osF0QF0/RgBdAF0/oz+jP6L/oz+jAF0AXT9GAABAXT90g0XC6IADwAAAREhESERIREhESERIREhEQou/oz7o/0XAukEXQLoAXX90gIuBdH6Lwui+6MEXfXS/F4AAQF0/dINFwdFAA8AAAERIREhESERIREhESERIREKLv6M+6P9FwLpBF0C6AF1/dICLgLo/RgHRf0YAuj6L/xeAAEBdAAADdELogANAAAhESERIREhESERIREhEQF0AukEXQUX/dH9GPujC6L7owRd/oz10gXR+i8AAQF0AAAOiwdFAA0AACERIREhESERIREhESERAXQC6QRdBdH9F/0Y+6MHRf0YAuj+jPovAuj9GAABAXT90guiC6IACwAAAREhESERIREhESERB0X90vxdCi78XgIu/dICLgouAXT+jPdG/F4AAQF0/dIKLgdFAAsAAAERIREhESERIREhEQaL/dL9Fwi6/RcCL/3SAi4F0QF0/oz7o/xeAAEBdAdFBdELogAHAAABESERIREhEQF0AXQC6f6MB0UC6QF0/oz9FwABAAAHRQRdC6IABwAAGQEhESERIREBdALp/osHRQF1Auj9GP6LAAAAAgF0B0UKLguiAAcADwAAAREhESERIREhESERIREhEQF0AXQC6f6MAXQBdALp/owHRQLpAXT+jP0XAukBdP6M/RcAAAACAAAHRQi6C6IABwAPAAAZASERIREhESERIREhESERAXQC6f6LAXUBdALp/osHRQF1Auj9GP6LAXUC6P0Y/osAAQC6AAANFwuiADMAACERIREjNSE1MzUhNSE1MzUhESERIREhESERIREhESERIRUjFSEVIRUjFSEVIREhESERIREFF/6Luv3SugF0/dK6AXQBdQF0BdEBdf0X/Rf+jAOjuv0XA6O6/RcBdALpAun+iwF0AXS6u7q6uroBdQF0AXT+jP6MAXT+jP6Lurq6uru6/owBdP6M/owAAAAAAwF0BdEOiwuiAAMAEQAZAAABESERAREhESERIREhESERIREhESERIREhEQouAXT4AP3SB0YBdP6M/ov90ggA/osBdQF0B0UBdf6L/owEXQF0/oz+jP0XBF37owLpAXQBdPovAAEBdAAADosLogAbAAAhESERIREhESERIREhESERIREhESERIREhESERAuj+jAF0AXUEXf0XAukBdARd/RcC6f0X/Rj9FwXRAXQC6QF0/oz9FwLpAXT+jP0X/oz6LwXR+i8AAAABAXQAAAuiC6IAEQAAIREhESERIREhESERIREhESERAuj+jAF0AXUEXf0XBdH9GP0XBdEBdALpAXT+jP0X+LsF0fovAAIBdAAADRcLogADABUAAAERIREBESERIREhESERIREhESERIREIuv0X/Rf+jAF0AXUHRQF1/Rf+jP0XB0UC6f0X+LsF0QF0AukBdPXS/owBdARd+i8AAAABAXQAABF0C6IAHQAAIREhESERIREhESERIREhESERIREhESERIREhESERAuj+jAF0AXUEXf0XAukBdARd/RcF0v0X/Rf9GP0XBdEBdALpAXT+jP0XAukBdP6M/Rf4uwXR+i8F0fovAAIBdAAAEugLogADACEAAAERIREBESERIREhESERIREhESERIREhESERIREhESERIREOi/0X90b+jAF0AXUEXf0XAukBdAdGAXT9GP6L/Rf9GP0XB0UC6f0X+LsF0QF0AukBdP6M/RcC6QF09dL+jAF0BF36LwXR+i8AAAAAABcBGgABAAAAAAAAAEUAWgABAAAAAAABAAwABwABAAAAAAACAAcAAAABAAAAAAADABkABwABAAAAAAAEAAwABwABAAAAAAAFAC8AIAABAAAAAAAGAAsATwABAAAAAAAIABsAbgABAAAAAAAJABsAbgABAAAAAAAKAEUAWgABAAAAAAATACkAnwADAAEECQAAAIoAyAADAAEECQABABgBYAADAAEECQACAA4BUgADAAEECQADADIBYAADAAEECQAEABgBYAADAAEECQAFAF4BkgADAAEECQAGABYB8AADAAEECQAIADYA8AADAAEECQAJADYA8AADAAEECQAKAIoAyAADAAEECQATAFICBgADAAEECQEAABgCWFJlZ3VsYXJSZXRybyBHYW1pbmc6VmVyc2lvbiAxLjAwVmVyc2lvbiAxLjAwIEZlYnJ1YXJ5IDIyLCAyMDE5LCBpbml0aWFsIHJlbGVhc2VSZXRyb0dhbWluZ0NvcHlyaWdodCCpIDIwMTkgYnkgVmFzaWx5IERyYWlnbyBha2EgRGF5bWFyaXVzLiBBbGwgcmlnaHRzIHJlc2VydmVkLkZpdmUgYmlnIHF1YWNraW5nIHplcGh5cnMgam9sdCBteSB3YXggYmVkAEMAbwBwAHkAcgBpAGcAaAB0ACAAqQAgADIAMAAxADkAIABiAHkAIABWAGEAcwBpAGwAeQAgAEQAcgBhAGkAZwBvACAAYQBrAGEAIABEAGEAeQBtAGEAcgBpAHUAcwAuACAAQQBsAGwAIAByAGkAZwBoAHQAcwAgAHIAZQBzAGUAcgB2AGUAZAAuAFIAZQBnAHUAbABhAHIAUgBlAHQAcgBvACAARwBhAG0AaQBuAGcAOgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMABWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAgAEYAZQBiAHIAdQBhAHIAeQAgADIAMgAsACAAMgAwADEAOQAsACAAaQBuAGkAdABpAGEAbAAgAHIAZQBsAGUAYQBzAGUAUgBlAHQAcgBvAEcAYQBtAGkAbgBnAEYAaQB2AGUAIABiAGkAZwAgAHEAdQBhAGMAawBpAG4AZwAgAHoAZQBwAGgAeQByAHMAIABqAG8AbAB0ACAAbQB5ACAAdwBhAHgAIABiAGUAZABBAHcAOABKAGQARgBsAGsAVgB3AD0APQAAAAMAAAAAAAABmQDMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAABAAAADgAAAAAAAAAAAAIABwAAAGkAAQBqAGoAAgBrAGwAAQBtAG0AAgBuATgAAQE5ATkAAgE6AT4AAQABAAAACgAcAB4AAWxhdG4ACAAEAAAAAP//AAAAAAAAAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFsaWdhAAgAAAABAAAAAQAEAAQAAAABAAgAAQAuAAIACgAgAAIABgAOAGoAAwBGAAwAbQADAFUADAABAAQBOQAEAFcAUAAQAAEAAgALABAAAA==";

const PDF_FUENTE_NOMBRE = "RetroGaming";
let pdfFuenteActiva = "Times-Roman";

function prepararFuentePdf(doc) {
    pdfFuenteActiva = "Times-Roman";
    try {
        doc.addFileToVFS("RetroGaming.ttf", PDF_RETRO_GAMING_TTF);
        doc.addFont("RetroGaming.ttf", PDF_FUENTE_NOMBRE, "normal");
        pdfFuenteActiva = PDF_FUENTE_NOMBRE;
    } catch (error) {
        console.warn("No se pudo cargar la fuente retro para PDF.", error);
    }
}

function setPdfFont(doc, size, color, estilo = "normal") {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    if (pdfFuenteActiva === PDF_FUENTE_NOMBRE) {
        doc.setFont(pdfFuenteActiva, "normal");
    } else {
        doc.setFont(pdfFuenteActiva, estilo);
    }
}

function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hh = h / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (hh >= 0 && hh < 1) { r = c; g = x; b = 0; }
    else if (hh >= 1 && hh < 2) { r = x; g = c; b = 0; }
    else if (hh >= 2 && hh < 3) { r = 0; g = c; b = x; }
    else if (hh >= 3 && hh < 4) { r = 0; g = x; b = c; }
    else if (hh >= 4 && hh < 5) { r = x; g = 0; b = c; }
    else if (hh >= 5 && hh < 6) { r = c; g = 0; b = x; }
    const m = l - c / 2;
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
}

function dibujarHeatmapPdf(doc, jugadorId, x, y, width) {
    const conteos = heatmapConteos[jugadorId];
    let max = 0;
    conteos.forEach(v => { if (v > max) max = v; });
    const baseHue = jugadorId === 1 ? 185 : 0;
    const layout = HEATMAP_LAYOUT;
    const maxUnits = layout.reduce((acc, fila) => {
        const total = fila.reduce((s, tecla) => s + (tecla.ancho || 1), 0);
        return Math.max(acc, total);
    }, 0);
    const unit = width / maxUnits;
    const gap = unit * 0.08;
    const rowHeight = unit * 0.85;
    let yCursor = y;

    layout.forEach(fila => {
        let xCursor = x;
        fila.forEach(tecla => {
            const ancho = tecla.ancho || 1;
            const w = (unit * ancho) - gap;
            const h = rowHeight;
            if (!tecla.spacer) {
                const count = conteos.get(tecla.code) || 0;
                const intensidad = max > 0 ? count / max : 0;
                const hslColor = hslToRgb(baseHue, 78, 24 + 42 * intensidad);
                doc.setFillColor(hslColor[0], hslColor[1], hslColor[2]);
                doc.setDrawColor(90, 90, 90);
                doc.setLineWidth(0.35);
                doc.rect(xCursor, yCursor, w, h, "FD");

                let label = String(tecla.label || tecla.code);
                const lines = label.split("\n");
                let fontSize = Math.max(5, h * 0.35);
                if (lines.length > 1) {
                    fontSize *= 0.88;
                }
                const labelColor = [247, 208, 126];
                const shadowColor = [170, 30, 30];
                const shadowOffset = Math.max(0.3, fontSize * 0.06);
                const lineSpacing = lines.length > 1 ? fontSize * 0.9 : fontSize * 1.05;
                const baseYOffset = lines.length > 1 ? fontSize * 0.18 : 0;
                if (tecla.code === "Backspace") {
                    doc.setDrawColor(labelColor[0], labelColor[1], labelColor[2]);
                    doc.setLineWidth(Math.max(0.25, h * 0.04));
                    const cx = xCursor + w / 2;
                    const cy = yCursor + h / 2;
                    const shaft = w * 0.48;
                    const head = h * 0.16;
                    const startX = cx + shaft / 2;
                    const endX = cx - shaft / 2;
                    doc.line(startX, cy, endX, cy);
                    doc.line(endX, cy, endX + head, cy - head);
                    doc.line(endX, cy, endX + head, cy + head);
                } else {
                    setPdfFont(doc, fontSize, shadowColor);
                    lines.forEach((line, idx) => {
                        const offset = (idx - (lines.length - 1) / 2) * lineSpacing;
                        doc.text(line, xCursor + w / 2 + shadowOffset, yCursor + h / 2 + offset + baseYOffset + shadowOffset, { align: "center" });
                    });
                    setPdfFont(doc, fontSize, labelColor);
                    lines.forEach((line, idx) => {
                        const offset = (idx - (lines.length - 1) / 2) * lineSpacing;
                        doc.text(line, xCursor + w / 2, yCursor + h / 2 + offset + baseYOffset, { align: "center" });
                    });
                }
            }
            xCursor += unit * ancho;
        });
        yCursor += rowHeight + gap;
    });

    return yCursor;
}

function dibujarLetrasPdf(doc, titulo, letras, x, y, color, width, tituloColor = null) {
    setPdfFont(doc, 11, tituloColor || color, "bold");
    doc.text(titulo, x, y);
    let yCursor = y + 5;
    if (!letras.length) {
        setPdfFont(doc, 10, [150, 150, 150]);
        doc.text("-", x, yCursor);
        return yCursor + 6;
    }

    setPdfFont(doc, 10, [20, 20, 20]);
    let xCursor = x;
    letras.forEach(letra => {
        const texto = String(letra).toUpperCase();
        const paddingX = 2.2;
        const paddingY = 1.6;
        const textWidth = doc.getTextWidth(texto);
        const w = textWidth + paddingX * 2;
        const h = 6;
        if (xCursor + w > x + width) {
            xCursor = x;
            yCursor += h + 2;
        }
        doc.setFillColor(color[0], color[1], color[2]);
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.roundedRect(xCursor, yCursor - (h - paddingY), w, h, 1.5, 1.5, "F");
        setPdfFont(doc, 10, [20, 20, 20]);
        doc.text(texto, xCursor + w / 2, yCursor, { align: "center" });
        xCursor += w + 2;
    });
    return yCursor + 8;
}

function dibujarPalabrasPdf(doc, titulo, palabras, x, y, color, width) {
    setPdfFont(doc, 11, color, "bold");
    doc.text(titulo, x, y);
    let yCursor = y + 5;
    if (!palabras.length) {
        setPdfFont(doc, 10, [150, 150, 150]);
        doc.text("-", x, yCursor);
        return yCursor + 6;
    }

    let xCursor = x;
    palabras.forEach(palabra => {
        const texto = String(palabra).toUpperCase();
        const paddingX = 2.6;
        const paddingY = 1.6;
        const textWidth = doc.getTextWidth(texto);
        const w = textWidth + paddingX * 2;
        const h = 6.2;
        if (xCursor + w > x + width) {
            xCursor = x;
            yCursor += h + 2;
        }
        doc.setFillColor(color[0], color[1], color[2]);
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.roundedRect(xCursor, yCursor - (h - paddingY), w, h, 1.5, 1.5, "F");
        setPdfFont(doc, 9, [20, 20, 20]);
        doc.text(texto, xCursor + w / 2, yCursor, { align: "center" });
        xCursor += w + 2;
    });
    return yCursor + 8;
}

function recortarTextoPdf(doc, texto, maxWidth) {
    if (doc.getTextWidth(texto) <= maxWidth) return texto;
    let recorte = texto;
    while (recorte.length > 1 && doc.getTextWidth(recorte + "...") > maxWidth) {
        recorte = recorte.slice(0, -1);
    }
    return recorte + "...";
}

const PDF_COLORES_NIVELES = {
    letraBendita: [0, 210, 110],
    letraMaldita: [255, 90, 90],
    palabrasBenditas: [255, 229, 91],
    palabrasMalditas: [255, 110, 190],
};

function dibujarGraficaVidaPdf(doc, serie, x, y, width, height, colorLinea) {
    doc.setDrawColor(90, 90, 90);
    doc.setLineWidth(0.3);
    doc.rect(x, y, width, height);
    const serieValida = Array.isArray(serie)
        ? serie.filter(p => p && Number.isFinite(p.t) && Number.isFinite(p.v))
        : [];
    if (serieValida.length < 2) {
        setPdfFont(doc, 10, [180, 180, 180]);
    doc.text("Sin datos de vida registrados.", x + 4, y + height / 2);
    return y + height + 6;
}
    const valores = serieValida.map(p => p.v);
    const maxValor = Math.max(...valores, 1);
    const minValor = Math.min(...valores, 0);
    const rangoValor = Math.max(maxValor - minValor, 1);
    const tInicio = serieValida[0].t;
    const tFin = serieValida[serieValida.length - 1].t;
    const rangoTiempo = Math.max(tFin - tInicio, 1);

    for (let i = 0; i <= 4; i += 1) {
        const yLine = y + (height * (i / 4));
        doc.setDrawColor(70, 70, 70);
        doc.setLineWidth(0.2);
        doc.line(x, yLine, x + width, yLine);
    }

    const colorSegura = Array.isArray(colorLinea) ? colorLinea : [255, 255, 255];
    doc.setDrawColor(colorSegura[0], colorSegura[1], colorSegura[2]);
    doc.setLineWidth(0.6);

    // Etiquetas de ejes
    const formatTiempoVida = (segundos) => {
        const total = Math.max(0, Math.round(segundos));
        const min = Math.floor(total / 60);
        const sec = total % 60;
        return min > 0 ? `${min}:${String(sec).padStart(2, "0")}` : `${sec}s`;
    };
    setPdfFont(doc, 7, [170, 170, 170]);
    for (let i = 0; i <= 4; i += 2) {
        const ratio = i / 4;
        const valor = maxValor - (rangoValor * ratio);
        const yLine = y + (height * ratio);
        doc.text(formatTiempoVida(valor), x + 2, yLine + 2);
    }
    const totalSegundos = Math.round(rangoTiempo / 1000);
    const mitadSegundos = Math.round(totalSegundos / 2);
    const yEtiquetasX = y + height - 1.5;
    doc.text(formatTiempoVida(0), x + 4, yEtiquetasX);
    doc.text(formatTiempoVida(mitadSegundos), x + (width / 2), yEtiquetasX, { align: "center" });
    doc.text(formatTiempoVida(totalSegundos), x + width - 4, yEtiquetasX, { align: "right" });

    let prev = null;
    serieValida.forEach(punto => {
        const xPos = x + ((punto.t - tInicio) / rangoTiempo) * width;
        const yPos = y + height - ((punto.v - minValor) / rangoValor) * height;
        if (!Number.isFinite(xPos) || !Number.isFinite(yPos)) {
            return;
        }
        if (prev) {
            doc.line(prev.x, prev.y, xPos, yPos);
        }
        prev = { x: xPos, y: yPos };
    });
    return y + height + 6;
}

function agregarPaginaEstadisticas(doc, jugadorId, nombre, agregarLogoEnPagina, margen, anchoPagina, altoPagina, headerRightX, palabrasBenditas) {
    const accent = jugadorId === 1 ? [70, 240, 255] : [255, 107, 107];
    const accentSoft = [
        Math.min(220, accent[0] + 90),
        Math.min(220, accent[1] + 90),
        Math.min(220, accent[2] + 90)
    ];
    const headerHeight = 22;

    setPdfFont(doc, 16, [255, 255, 255], "bold");
    const limiteNombreX = headerRightX || (anchoPagina - margen);
    const tituloInforme = "INFORME DE PARTIDA";
    const tituloWidth = doc.getTextWidth(tituloInforme);
    const offsetTitulo = doc.getTextWidth("<SCRI> B - ");
    const tituloXBase = margen + offsetTitulo;
    const tituloXMax = Math.max(margen, limiteNombreX - tituloWidth);
    const tituloX = Math.min(tituloXMax, Math.max(margen, tituloXBase));
    doc.text(tituloInforme, tituloX, 14);
    let nombreMostrar = nombre || "";
    let nombreTam = 11;
    setPdfFont(doc, nombreTam, accent, "bold");
    const anchoDisponible = Math.max(10, limiteNombreX - margen);
    while (nombreTam > 8 && doc.getTextWidth(nombreMostrar) > anchoDisponible) {
        nombreTam -= 1;
        setPdfFont(doc, nombreTam, accent, "bold");
    }
    nombreMostrar = recortarTextoPdf(doc, nombreMostrar, anchoDisponible);
    const nombreShadow = jugadorId === 1 ? [255, 107, 107] : [70, 240, 255];
    const nombreOffset = Math.max(0.2, nombreTam * 0.03);

    const renderHeader = () => {
        doc.setFillColor(5, 5, 5);
        doc.rect(0, 0, anchoPagina, altoPagina, "F");
        doc.setFillColor(12, 12, 12);
        doc.rect(0, 0, anchoPagina, headerHeight, "F");
        agregarLogoEnPagina();
        setPdfFont(doc, 16, [255, 255, 255], "bold");
        doc.text(tituloInforme, tituloX, 14);
        setPdfFont(doc, nombreTam, nombreShadow, "bold");
        doc.text(nombreMostrar, limiteNombreX + nombreOffset, 14 + nombreOffset, { align: "right" });
        setPdfFont(doc, nombreTam, accent, "bold");
        doc.text(nombreMostrar, limiteNombreX, 14, { align: "right" });
    };

    doc.addPage();
    renderHeader();


    let y = headerHeight + 8;
    const footerReserva = 14;
    const nuevaPagina = () => {
        doc.addPage();
        renderHeader();
        y = headerHeight + 8;
    };
    const asegurarEspacio = (alturaEstimada) => {
        if (y + alturaEstimada > altoPagina - footerReserva) {
            nuevaPagina();
        }
    };

    const dibujarSeccion = (titulo, yInicio, dibujarContenido) => {
        const footerReserva = 12;
        const alturaMinimaSeccion = 60;
        if (yInicio + alturaMinimaSeccion > altoPagina - footerReserva) {
            nuevaPagina();
            yInicio = y;
        }
        const boxX = margen - 2;
        const boxWidth = anchoPagina - (margen * 2) + 4;
        const yTitulo = yInicio + 6;
        setPdfFont(doc, 12, accent, "bold");
        doc.text(titulo.toUpperCase(), margen, yTitulo);
        let yContenido = yTitulo + 4;
        yContenido = dibujarContenido(yContenido);
        const boxHeight = Math.max(18, yContenido - yInicio + 4);
        doc.setDrawColor(accent[0], accent[1], accent[2]);
        doc.setLineWidth(0.4);
        doc.roundedRect(boxX, yInicio, boxWidth, boxHeight, 3, 3, "S");
        return yInicio + boxHeight + 6;
    };

    const conteos = heatmapConteos[jugadorId];
    let totalPulsaciones = 0;
    let teclasUsadas = 0;
    const topTeclas = [];
    conteos.forEach((count, code) => {
        if (count > 0) {
            totalPulsaciones += count;
            teclasUsadas += 1;
            topTeclas.push({ code, count });
        }
    });
    topTeclas.sort((a, b) => b.count - a.count);

    const etiquetasTeclas = new Map();
    HEATMAP_LAYOUT.forEach(fila => {
        fila.forEach(tecla => {
            if (!tecla.spacer) {
                etiquetasTeclas.set(tecla.code, tecla.label || tecla.code);
            }
        });
    });
    const nombreTecla = (code) => etiquetasTeclas.get(code) || code;

    const serieVida = resumenPartida.tiempos[jugadorId] || [];
    const duracionMs = serieVida.length ? serieVida[serieVida.length - 1].t : 0;
    const formatTiempo = (ms) => {
        if (!ms) return "-";
        const totalSec = Math.max(0, Math.round(ms / 1000));
        const minutos = Math.floor(totalSec / 60);
        const segundos = String(totalSec % 60).padStart(2, "0");
        return `${minutos}:${segundos}`;
    };
    const duracionMin = duracionMs ? (duracionMs / 60000) : 0;
    const duracionEscrituraMs = obtenerTiempoEscrituraMs();
    const duracionEscrituraMin = duracionEscrituraMs ? (duracionEscrituraMs / 60000) : 0;
    const ritmo = duracionEscrituraMin > 0 ? Math.round(totalPulsaciones / duracionEscrituraMin) : 0;
    const valoresVida = serieVida.map(p => p.v);
    const vidaMin = valoresVida.length ? Math.min(...valoresVida) : null;
    const vidaMax = valoresVida.length ? Math.max(...valoresVida) : null;
    const vidaProm = valoresVida.length
        ? Math.round(valoresVida.reduce((acc, v) => acc + v, 0) / valoresVida.length)
        : null;
    const topTexto = topTeclas.length
        ? topTeclas.slice(0, 3).map(item => `${nombreTecla(item.code)} (${item.count})`).join(" - ")
        : "-";

    const letrasB = Array.from(resumenPartida.letrasBenditas).sort();
    const letrasM = Array.from(resumenPartida.letrasMalditas).sort();

    const intentosLetra = resumenPartida.intentosLetraProhibida[jugadorId] || 0;
    const intentosPalabra = resumenPartida.intentosPalabraProhibida[jugadorId] || 0;
    const letrasProhibidasMap = resumenPartida.letrasProhibidasUsadas[jugadorId];
    const palabrasProhibidasMap = resumenPartida.palabrasProhibidasUsadas[jugadorId];
    const letrasProhibidasTexto = letrasProhibidasMap && letrasProhibidasMap.size
        ? Array.from(letrasProhibidasMap.keys()).join(", ")
        : "-";
    const palabrasProhibidasTexto = palabrasProhibidasMap && palabrasProhibidasMap.size
        ? Array.from(palabrasProhibidasMap.keys()).join(", ")
        : "-";

    asegurarEspacio(70);
    y = dibujarSeccion("Resumen rápido", y, (yContenido) => {
        const maxWidth = anchoPagina - (margen * 2) - 4;
        const colGap = 8;
        const colWidth = (maxWidth - colGap) / 2;
        const leftX = margen;
        const rightX = margen + colWidth + colGap;
        const lineHeight = 5;
        const lineas = [
            { label: "Duración total", value: formatTiempo(duracionMs) },
            { label: "Pulsaciones totales", value: totalPulsaciones || 0 },
            { label: "Teclas distintas", value: teclasUsadas || 0 },
            { label: "Ritmo estimado", value: ritmo ? `${ritmo} puls/min` : "-" },
            { label: "Vida mínima", value: vidaMin !== null ? vidaMin : "-" },
            { label: "Vida máxima", value: vidaMax !== null ? vidaMax : "-" },
            { label: "Vida media", value: vidaProm !== null ? vidaProm : "-" },
            { label: "Top teclas", value: topTexto }
        ];
        const mid = Math.ceil(lineas.length / 2);
        const colLeft = lineas.slice(0, mid);
        const colRight = lineas.slice(mid);
        let yLeft = yContenido + 2;
        let yRight = yContenido + 2;

        const dibujarLineaResumen = (xBase, yBase, linea, anchoMax) => {
            const etiqueta = String(linea.label || "");
            const valor = String(linea.value ?? "-");
            const etiquetaTexto = `${etiqueta}:`;
            let yCursor = yBase;

            setPdfFont(doc, 10, accentSoft, "bold");
            let etiquetaWidth = doc.getTextWidth(etiquetaTexto);
            if (etiquetaWidth > (anchoMax - 20)) {
                doc.text(etiquetaTexto, xBase, yCursor);
                yCursor += lineHeight;
                etiquetaWidth = 0;
            } else {
                doc.text(etiquetaTexto, xBase, yCursor);
                etiquetaWidth += doc.getTextWidth(" ");
            }

            const anchoValor = Math.max(10, anchoMax - etiquetaWidth);
            const lineasValor = doc.splitTextToSize(valor, anchoValor);
            setPdfFont(doc, 10, [230, 230, 230]);
            if (lineasValor.length) {
                const xValor = etiquetaWidth > 0 ? xBase + etiquetaWidth : xBase;
                doc.text(lineasValor[0], xValor, yCursor);
                yCursor += lineHeight;
                for (let i = 1; i < lineasValor.length; i += 1) {
                    doc.text(lineasValor[i], xValor, yCursor);
                    yCursor += lineHeight;
                }
            } else {
                yCursor += lineHeight;
            }

            return yCursor;
        };

        colLeft.forEach(linea => {
            yLeft = dibujarLineaResumen(leftX, yLeft, linea, colWidth);
        });
        colRight.forEach(linea => {
            yRight = dibujarLineaResumen(rightX, yRight, linea, colWidth);
        });

        return Math.max(yLeft, yRight) + 1;
    });

    asegurarEspacio(90);
    y = dibujarSeccion("Mapa de calor", y, (yContenido) => {
        return dibujarHeatmapPdf(doc, jugadorId, margen, yContenido, anchoPagina - (margen * 2));
    });

    asegurarEspacio(80);
    y = dibujarSeccion("Letras destacadas", y, (yContenido) => {
        const colGap = 8;
        const colWidth = (anchoPagina - (margen * 2) - colGap) / 2;
        const leftX = margen;
        const rightX = margen + colWidth + colGap;
        let yCursor = yContenido + 2;

        const conteosLetra = new Map();
        heatmapConteos[jugadorId].forEach((count, code) => {
            const label = nombreTecla(code);
            if (typeof label === "string" && label.length === 1) {
                const letra = label.toUpperCase();
                conteosLetra.set(letra, (conteosLetra.get(letra) || 0) + count);
            }
        });

        const totalInsercionesBendita = letrasB.reduce((acc, letra) => acc + (conteosLetra.get(letra) || 0), 0);
        const totalInsercionesMaldita = intentosLetra || 0;

        setPdfFont(doc, 11, PDF_COLORES_NIVELES.letraBendita, "bold");
        doc.text("BENDITA", leftX, yCursor);
        setPdfFont(doc, 11, PDF_COLORES_NIVELES.letraMaldita, "bold");
        doc.text("MALDITA", rightX, yCursor);

        yCursor += 5;
        setPdfFont(doc, 10, accentSoft, "bold");
        doc.text(`${totalInsercionesBendita} insercciones`, leftX, yCursor);
        doc.text(`${totalInsercionesMaldita} insercciones`, rightX, yCursor);

        const yList = yCursor + 6;
        const yBenditas = dibujarLetrasPdf(doc, "Letras", letrasB, leftX, yList, PDF_COLORES_NIVELES.letraBendita, colWidth);
        const yMalditas = dibujarLetrasPdf(doc, "Letras", letrasM, rightX, yList, PDF_COLORES_NIVELES.letraMaldita, colWidth);
        return Math.max(yBenditas, yMalditas);
    });

    asegurarEspacio(80);
    y = dibujarSeccion("Palabras destacadas", y, (yContenido) => {
        const colGap = 8;
        const colWidth = (anchoPagina - (margen * 2) - colGap) / 2;
        const leftX = margen;
        const rightX = margen + colWidth + colGap;
        let yCursor = yContenido + 2;
        const palabrasB = Array.isArray(palabrasBenditas) ? palabrasBenditas : [];
        const palabrasM = palabrasProhibidasMap && palabrasProhibidasMap.size
            ? Array.from(palabrasProhibidasMap.keys()).map(p => String(p).toUpperCase())
            : [];

        const totalInsercionesBendita = palabrasB.length;
        const totalInsercionesMaldita = intentosPalabra || 0;

        setPdfFont(doc, 11, PDF_COLORES_NIVELES.palabrasBenditas, "bold");
        doc.text("BENDITA", leftX, yCursor);
        setPdfFont(doc, 11, PDF_COLORES_NIVELES.palabrasMalditas, "bold");
        doc.text("MALDITA", rightX, yCursor);

        yCursor += 5;
        setPdfFont(doc, 10, accentSoft, "bold");
        doc.text(`${totalInsercionesBendita} insercciones`, leftX, yCursor);
        doc.text(`${totalInsercionesMaldita} insercciones`, rightX, yCursor);

        const yPalabras = yCursor + 6;
        const yBenditas = dibujarPalabrasPdf(doc, "Palabras", palabrasB, leftX, yPalabras, PDF_COLORES_NIVELES.palabrasBenditas, colWidth);
        const yMalditas = dibujarPalabrasPdf(doc, "Palabras", palabrasM, rightX, yPalabras, PDF_COLORES_NIVELES.palabrasMalditas, colWidth);
        return Math.max(yBenditas, yMalditas);
    });

    asegurarEspacio(75);
    y = dibujarSeccion("Evolución de vida", y, (yContenido) => {
        return dibujarGraficaVidaPdf(doc, serieVida, margen, yContenido + 2, anchoPagina - (margen * 2), 45, accent);
    });

}


function descargar_textos() {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();
    prepararFuentePdf(doc);

    const margen = 20;
    const anchoPagina = doc.internal.pageSize.width;
    const altoPagina = doc.internal.pageSize.height;
    const imgLogo = 'data:image/png;base64,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';
    const scrib_logo =  'data:image/png;base64,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';
     // Tama�o original y c�lculo para logos
    const anchoLogoOriginal = 1555;
    const altoLogoOriginal = 1466;
    const anchoLogoMaximo = 17;
    const altoLogo = altoLogoOriginal * (anchoLogoMaximo / anchoLogoOriginal);
    const altoLogoEscalado = altoLogo * 0.85;
    const xLogo = anchoPagina - anchoLogoMaximo - margen + 4;

    const anchoScribLogoOriginal = 256;
    const altoScribLogoOriginal = 256;
    const anchoScribLogoMaximo = 20;
    const altoScribLogo = altoScribLogoOriginal * (anchoScribLogoMaximo / anchoScribLogoOriginal);
    const xLogoIzquierda = margen - 27;
    const headerRightX = xLogo - 6;

    let accentColor = [70, 240, 255];

    function agregarLogoEnPagina() {
         doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
         doc.setLineWidth(1.4);
         doc.line(margen - 6, margen + 2, anchoPagina - margen + 6, margen + 2);
         const yLogo = margen - 16;
         const yScrib = yLogo + (altoLogoEscalado - altoScribLogo) / 2;
         doc.addImage(imgLogo, 'PNG', xLogo, yLogo, anchoLogoMaximo, altoLogoEscalado);
         doc.addImage(scrib_logo, 'PNG', xLogoIzquierda + 18, yScrib, anchoScribLogoMaximo, altoScribLogo);
         setPdfFont(doc, 8, [120, 120, 120]);
         const footerY = altoPagina - 6;
         doc.text("<SCRI> B", margen, footerY);
         const suturaTexto = "SUTURA TEATRO";
         const suturaX = anchoPagina - margen - doc.getTextWidth(suturaTexto);
         doc.text(suturaTexto, suturaX, footerY);
    }

    function agregarPaginaTexto() {
        doc.setFillColor(5, 5, 5);
        doc.rect(0, 0, anchoPagina, altoPagina, "F");
        agregarLogoEnPagina();
    }
 
    function dibujarNombreEnPagina(texto, x, y, tamano, color, shadowColor) {
        if (!texto) return y + 6;
        const textoMostrar = recortarTextoPdf(doc, texto, anchoPagina - 2 * margen);
        const offset = Math.max(0.2, tamano * 0.03);
        setPdfFont(doc, tamano, shadowColor, "bold");
        doc.text(textoMostrar, x + offset, y + offset);
        setPdfFont(doc, tamano, color, "bold");
        doc.text(textoMostrar, x, y);
        return y + 6;
    }

    function agregarTextoEnPagina(texto, x, yInicial, tamano, color, bold = false) {
        setPdfFont(doc, tamano, color, bold ? 'bold' : 'normal');

        let y = yInicial;
        const lineas = doc.splitTextToSize(texto, anchoPagina - 2 * margen);

        lineas.forEach(linea => {
            if (y > altoPagina - margen) {
                doc.addPage();
                agregarPaginaTexto();
                y = margen + 10;
            }
            doc.text(linea, x, y);
            y += 6;
        });

        return y;
    }

    agregarPaginaTexto();

    const nombreValor = (nombre && nombre.value) ? nombre.value.trim() : "";
    const nombrePdf = nombreValor || "Jugador 1";
    let yActual = dibujarNombreEnPagina(nombrePdf, margen, margen + 13, 25, accentColor, [255, 107, 107]);

    const htmlTexto = (texto && texto.innerHTML) ? texto.innerHTML : "";
    const textoPlano = (texto && texto.innerText) ? texto.innerText : "";
    const segmentos = construirSegmentosColor(htmlTexto);
    if (segmentos.length) {
        yActual = agregarSegmentosEnPagina(doc, segmentos, margen, yActual + 5, 15, agregarPaginaTexto, margen, anchoPagina, altoPagina);
    } else {
        yActual = agregarTextoEnPagina(textoPlano, margen, yActual + 5, 15, [230, 230, 230]);
    }

    const palabrasBenditas = extraerPalabrasConClase(htmlTexto, ["palabra-bendita"]);
    agregarPaginaEstadisticas(doc, 1, nombrePdf, agregarLogoEnPagina, margen, anchoPagina, altoPagina, headerRightX, palabrasBenditas);

    doc.save(nombrePdf + '.pdf');
    if (typeof downloadTxtFile === "function") {
        downloadTxtFile(nombrePdf + '.txt', nombrePdf + "\n" + textoPlano);
    }
}



