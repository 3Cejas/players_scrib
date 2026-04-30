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



