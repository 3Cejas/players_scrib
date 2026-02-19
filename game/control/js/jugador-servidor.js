// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);
  
const getEl = id => document.getElementById(id);

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let objetivo1 = getEl("objetivo");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");
let votos1 = getEl("votos");
let musas1 = getEl("musas");
let frase_final_j1 = getEl("frase_final_j1")
let frase_final_j2 = getEl("frase_final_j2")

let palabra1 = getEl("palabra");
let definicion1 = getEl("definicion");
let explicación = getEl("explicación");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tiempo1 = getEl("tiempo1");
let tiempo_modos_secs = getEl("tiempo_modos_secs");
let display_modo = getEl("display_modo");
let tema = getEl("temas");
let boton_pausar_reanudar = getEl("boton_pausar_reanudar");
let boton_vista_calentamiento = getEl("boton_vista_calentamiento");
const timeout_marcador_control = new WeakMap();
const estadoServidorDot = getEl("estado_servidor");
const estadoServidorTexto = getEl("estado_servidor_texto");
const estadoPlayer1Dot = getEl("estado_player_1");
const estadoPlayer2Dot = getEl("estado_player_2");
const estadoPlayer1Label = getEl("estado_player_1_label");
const estadoPlayer2Label = getEl("estado_player_2_label");

const formatearPuntosMarcadorControl = (valor) => {
    const texto = String(valor ?? "").trim();
    if (!texto) return "0 palabras";
    if (/^-?\d+(?:\.\d+)?$/.test(texto)) {
        return `${texto} palabras`;
    }
    return texto;
};

const formatearMusasMarcadorControl = (valor) => {
    const texto = String(valor ?? "").trim();
    if (!texto) return "0 musas";
    if (/^-?\d+(?:\.\d+)?$/.test(texto)) {
        return `${texto} musas`;
    }
    return texto;
};

function destacarMarcadorControlHit(elemento) {
    if (!elemento) return;
    elemento.classList.remove("puntos-hit");
    void elemento.offsetWidth;
    elemento.classList.add("puntos-hit");
    const timeoutPrevio = timeout_marcador_control.get(elemento);
    if (timeoutPrevio) {
        clearTimeout(timeoutPrevio);
    }
    const timeoutNuevo = setTimeout(() => {
        if (elemento) {
            elemento.classList.remove("puntos-hit");
        }
    }, 640);
    timeout_marcador_control.set(elemento, timeoutNuevo);
}

const STATUS_PING_INTERVAL_MS = 5000;
const STATUS_STALE_MS = 15000;
let statusPingInterval = null;
let statusWatchdogInterval = null;
let lastPongTs = 0;

const setEstadoDot = (el, estado) => {
    if (!el) return;
    el.classList.remove("conexion-dot--ok", "conexion-dot--warn", "conexion-dot--off");
    el.classList.add(`conexion-dot--${estado}`);
    el.dataset.status = estado;
};

const blinkEstadoDot = (el) => {
    if (!el) return;
    el.classList.remove("conexion-dot--ping");
    void el.offsetWidth;
    el.classList.add("conexion-dot--ping");
};

const setEstadoServidor = (conectado) => {
    setEstadoDot(estadoServidorDot, conectado ? "ok" : "off");
    if (estadoServidorTexto) {
        estadoServidorTexto.textContent = conectado ? "CONECTADO" : "DESCONECTADO";
    }
};

const setEstadoPlayers = (j1, j2) => {
    setEstadoDot(estadoPlayer1Dot, j1 ? "ok" : "off");
    setEstadoDot(estadoPlayer2Dot, j2 ? "ok" : "off");
};

const actualizarNombresConexiones = () => {
    if (estadoPlayer1Label) {
        estadoPlayer1Label.textContent = (val_nombre1 || "").trim() || "ESCRITXR 1";
    }
    if (estadoPlayer2Label) {
        estadoPlayer2Label.textContent = (val_nombre2 || "").trim() || "ESCRITXR 2";
    }
};

const procesarEstadoConexiones = (estado) => {
    if (!estado || !estado.players) return;
    lastPongTs = Date.now();
    setEstadoServidor(true);
    setEstadoPlayers(Boolean(estado.players.j1), Boolean(estado.players.j2));
    blinkEstadoDot(estadoServidorDot);
    if (estado.players.j1) blinkEstadoDot(estadoPlayer1Dot);
    if (estado.players.j2) blinkEstadoDot(estadoPlayer2Dot);
};

const enviarPingEstado = () => {
    if (!socket || !socket.connected) return;
    socket.emit('health_ping', {}, (estado) => {
        procesarEstadoConexiones(estado);
    });
};

const iniciarStatusPing = () => {
    clearInterval(statusPingInterval);
    clearInterval(statusWatchdogInterval);
    enviarPingEstado();
    statusPingInterval = setInterval(enviarPingEstado, STATUS_PING_INTERVAL_MS);
    statusWatchdogInterval = setInterval(() => {
        if (!socket || !socket.connected) return;
        if (lastPongTs && (Date.now() - lastPongTs) > STATUS_STALE_MS) {
            setEstadoServidor(false);
            setEstadoPlayers(false, false);
        }
    }, 1000);
};

const detenerStatusPing = () => {
    clearInterval(statusPingInterval);
    clearInterval(statusWatchdogInterval);
    statusPingInterval = null;
    statusWatchdogInterval = null;
    lastPongTs = 0;
};

if (tiempo) {
    tiempo.style.display = "none";
}
if (tiempo1) {
    tiempo1.style.display = "none";
}


let temporizador = getEl("temporizador");

// COMPONENTES DEL JUGADOR 2
let nombre2 = getEl("nombre1");
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let objetivo2 = getEl("objetivo1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");
let votos2 = getEl("votos1");
let musas2 = getEl("musas1");

function actualizarPuntosMarcadorControl(playerId, valor, animar = true) {
    const esJ2 = Number(playerId) === 2;
    const puntosEl = esJ2 ? puntos2 : puntos1;
    if (!puntosEl) return;
    const previo = (puntosEl.textContent || "").trim();
    const siguiente = formatearPuntosMarcadorControl(valor);
    puntosEl.textContent = siguiente;
    if (animar && siguiente !== previo) {
        destacarMarcadorControlHit(puntosEl);
    }
}

function actualizarMusasMarcadorControl(playerId, valor, animar = true) {
    const esJ2 = Number(playerId) === 2;
    const musasEl = esJ2 ? musas2 : musas1;
    if (!musasEl) return;
    const previo = (musasEl.textContent || "").trim();
    const siguiente = formatearMusasMarcadorControl(valor);
    musasEl.textContent = siguiente;
    if (animar && siguiente !== previo) {
        destacarMarcadorControlHit(musasEl);
    }
}

window.actualizarPuntosMarcadorControl = actualizarPuntosMarcadorControl;
window.actualizarMusasMarcadorControl = actualizarMusasMarcadorControl;
actualizarPuntosMarcadorControl(1, puntos1 ? puntos1.textContent : 0, false);
actualizarPuntosMarcadorControl(2, puntos2 ? puntos2.textContent : 0, false);
actualizarMusasMarcadorControl(1, musas1 ? musas1.textContent : 0, false);
actualizarMusasMarcadorControl(2, musas2 ? musas2.textContent : 0, false);

let puntuacion_final1 = getEl("puntuacion_final1");
let puntuacion_final2 = getEl("puntuacion_final2");

let clasificacion = getEl("clasificacion");

let limite_tiempo_inspiracion_input = document.getElementById('limite_tiempo_inspiracion');
let tiempo_modificador_input = document.getElementById('tiempo_modificador');
let tiempo_cambio_palabras_input = document.getElementById('tiempo_cambio_palabras');
let palabras_insertadas_meta_input = document.getElementById('palabras_insertadas_meta');
let tiempo_votacion_input = document.getElementById('tiempo_votacion')
let tiempo_cambio_letra_input = document.getElementById('tiempo_cambio_letra');
let tiempo_modos_input = document.getElementById('tiempo_modos');
let minInput  = document.getElementById('tiempo_minutos');
let segInput  = document.getElementById('tiempo_segundos');

let tempo_text_borroso;

let postgame1;
let postgame2;

let texto_guardado1 = "";
let texto_guardado2 = "";

let LIMITE_TIEMPO_INSPIRACION = limite_tiempo_inspiracion_input.valueAsNumber;
let TIEMPO_MODIFICADOR = tiempo_modificador_input.valueAsNumber * 1000;
let TIEMPO_CAMBIO_PALABRAS = tiempo_cambio_palabras_input.valueAsNumber * 1000;
let PALABRAS_INSERTADAS_META = palabras_insertadas_meta_input.valueAsNumber;
let TIEMPO_VOTACION = tiempo_votacion_input.valueAsNumber * 1000;
let TIEMPO_CAMBIO_LETRA = tiempo_cambio_letra_input.valueAsNumber *1000;
let TIEMPO_MODOS = tiempo_modos_input.valueAsNumber;

let DURACION_TIEMPO_MODOS = TIEMPO_MODOS;
let DURACION_TIEMPO_MUERTO = DURACION_TIEMPO_MODOS * 1000;
let TIEMPO_CAMBIO_MODOS = DURACION_TIEMPO_MODOS - 1;

// Lista de modos disponibles
let LISTA_MODOS = ["letra bendita", "letra prohibida", "tertulia", "palabras bonus", "palabras prohibidas", "tertulia", "frase final"];
let LISTA_MODOS_LOCURA = [ "letra bendita", "letra prohibida", "palabras bonus", "palabras prohibidas"];

// Objeto que asocia cada modo con un color
const COLORES_MODOS = {
    "letra bendita": "green",
    "letra prohibida": "red",
    "tertulia": "blue",
    "palabras bonus": "yellow",
    "palabras prohibidas": "pink",
    "frase final": "orange"
};

// Función para generar las casillas de verificación dentro de <td>
function generarCasillas() {
    const tr = document.getElementById('listaModos');
    LISTA_MODOS.forEach(function(modo, index) {
        // Crear <td> para contener el checkbox y el label
        const td = document.createElement('td');
        td.style.textAlign = 'center'; // Centrar contenido dentro del <td>

        // Crear el checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `modo-${index}`;
        checkbox.name = 'modos';
        checkbox.value = modo;
        checkbox.checked = true;

        // Crear el label
        const label = document.createElement('label');
        label.htmlFor = `modo-${index}`;
        label.textContent = modo.toUpperCase(); // Convertir el modo a mayúsculas
        label.style.display = 'block'; // Asegurar que el label se muestre en una nueva línea
        label.style.color = COLORES_MODOS[modo]; // Asignar color al texto del label
        label.style.paddingLeft = "0.2vw";
        label.style.paddingRight = "0.2vw";

        // Añadir primero el checkbox y luego el label al <td>
        td.appendChild(checkbox);
        td.appendChild(label);

        // Añadir el <td> al <tr>
        tr.appendChild(td);
    });
}

// Función para obtener los modos seleccionados
function rellenarListaModos() {
    const seleccionados = document.querySelectorAll('input[name="modos"]:checked');

    LISTA_MODOS = Array.from(seleccionados).map(checkbox => checkbox.value);

    LISTA_MODOS_LOCURA = LISTA_MODOS.filter(modo => modo !== "tertulia" && modo !== "locura");

    // Opcional: Mostrar los resultados en consola para verificar
    console.log('LISTA_MODOS:', LISTA_MODOS);
    console.log('LISTA_MODOS_LOCURA:', LISTA_MODOS_LOCURA);
}

function actualizarVariables() {
    LIMITE_TIEMPO_INSPIRACION = limite_tiempo_inspiracion_input.valueAsNumber;
    TIEMPO_MODIFICADOR = tiempo_modificador_input.valueAsNumber * 1000;
    TIEMPO_CAMBIO_PALABRAS = tiempo_cambio_palabras_input.valueAsNumber * 1000;
    PALABRAS_INSERTADAS_META = palabras_insertadas_meta_input.valueAsNumber;
    TIEMPO_VOTACION = tiempo_votacion_input.valueAsNumber * 1000;
    TIEMPO_CAMBIO_LETRA = tiempo_cambio_letra_input.valueAsNumber *1000;
    TIEMPO_MODOS = tiempo_modos_input.valueAsNumber;

    DURACION_TIEMPO_MODOS = TIEMPO_MODOS;
    DURACION_TIEMPO_MUERTO = DURACION_TIEMPO_MODOS * 1000;
    TIEMPO_CAMBIO_MODOS = DURACION_TIEMPO_MODOS - 1;

   console.log('LIMITE_TIEMPO_INSPIRACION:', LIMITE_TIEMPO_INSPIRACION);
   console.log('TIEMPO_MODIFICADOR:', TIEMPO_MODIFICADOR);
   console.log('TIEMPO_CAMBIO_PALABRAS:', TIEMPO_CAMBIO_PALABRAS);
   console.log('PALABRAS_INSERTADAS_META:', PALABRAS_INSERTADAS_META);
   console.log('TIEMPO_VOTACION:', TIEMPO_VOTACION);
   console.log('TIEMPO_CAMBIO_LETRA:', TIEMPO_CAMBIO_LETRA);
   console.log('TIEMPO_MODOS:', TIEMPO_MODOS);
}

let heatmapInicializado = false;

function inicializarHeatmap() {
    if (heatmapInicializado) return;
    const contenedorJ1 = document.getElementById("heatmap-j1");
    const contenedorJ2 = document.getElementById("heatmap-j2");
    if (!contenedorJ1 || !contenedorJ2) return;
    crearHeatmap("heatmap-j1", 1);
    crearHeatmap("heatmap-j2", 2);
    heatmapInicializado = true;
}

document.addEventListener('DOMContentLoaded', function () {
    try {
        generarCasillas();
    } catch (error) {
        console.warn("Error al generar las casillas de modos.", error);
    }
    try {
        // Inicializa las variables con los valores por defecto
        actualizarVariables();
    } catch (error) {
        console.warn("Error al inicializar variables del panel.", error);
    }
    inicializarHeatmap();
});

window.addEventListener('load', inicializarHeatmap);
let modo_actual = "";

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
    1: new Map(),
    2: new Map()
};
const heatmapKeys = {
    1: new Map(),
    2: new Map()
};

const resumenPartida = {
    letrasBenditas: new Set(),
    letrasMalditas: new Set(),
    intentosLetraProhibida: { 1: 0, 2: 0 },
    intentosPalabraProhibida: { 1: 0, 2: 0 },
    letrasProhibidasUsadas: { 1: new Map(), 2: new Map() },
    palabrasProhibidasUsadas: { 1: new Map(), 2: new Map() },
    tiempos: {
        1: [],
        2: []
    },
    inicio: null,
    modoActual: null,
    ultimoCambioModo: null,
    tiempoEscrituraMs: 0
};

function resetResumenPartida() {
    resumenPartida.letrasBenditas.clear();
    resumenPartida.letrasMalditas.clear();
    resumenPartida.intentosLetraProhibida[1] = 0;
    resumenPartida.intentosLetraProhibida[2] = 0;
    resumenPartida.intentosPalabraProhibida[1] = 0;
    resumenPartida.intentosPalabraProhibida[2] = 0;
    resumenPartida.letrasProhibidasUsadas[1].clear();
    resumenPartida.letrasProhibidasUsadas[2].clear();
    resumenPartida.palabrasProhibidasUsadas[1].clear();
    resumenPartida.palabrasProhibidasUsadas[2].clear();
    resumenPartida.tiempos[1] = [];
    resumenPartida.tiempos[2] = [];
    resumenPartida.inicio = Date.now();
    resumenPartida.modoActual = null;
    resumenPartida.ultimoCambioModo = null;
    resumenPartida.tiempoEscrituraMs = 0;
}

function registrarModoActual(nuevoModo) {
    if (!nuevoModo) return;
    const ahora = Date.now();
    const anterior = resumenPartida.modoActual;
    if (anterior && resumenPartida.ultimoCambioModo !== null && anterior !== nuevoModo) {
        if (anterior !== "tertulia") {
            resumenPartida.tiempoEscrituraMs += Math.max(0, ahora - resumenPartida.ultimoCambioModo);
        }
    }
    if (anterior !== nuevoModo || resumenPartida.ultimoCambioModo === null) {
        resumenPartida.modoActual = nuevoModo;
        resumenPartida.ultimoCambioModo = ahora;
    }
}

function obtenerTiempoEscrituraMs() {
    let total = resumenPartida.tiempoEscrituraMs || 0;
    if (resumenPartida.modoActual && resumenPartida.ultimoCambioModo !== null && resumenPartida.modoActual !== "tertulia") {
        total += Math.max(0, Date.now() - resumenPartida.ultimoCambioModo);
    }
    return total;
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

window.resetResumenPartida = resetResumenPartida;
window.registrarTiempoControl = registrarTiempoControl;
resetResumenPartida();

let intervalo_stats_live_control = null;
const INTERVALO_STATS_LIVE_CONTROL_MS = 1200;

function obtenerConteoPalabrasControl(playerId) {
    const puntosEl = playerId === 2 ? puntos2 : puntos1;
    const textoPuntos = puntosEl ? String(puntosEl.textContent || "") : "";
    const match = textoPuntos.match(/\d+/);
    if (match) {
        return Number(match[0]) || 0;
    }
    const textoEl = playerId === 2 ? texto2 : texto1;
    const textoPlano = textoEl ? extraerTextoPlanoDesdeHtmlControl(textoEl.innerHTML || "") : "";
    if (!textoPlano) return 0;
    return textoPlano.split(/\s+/).filter(Boolean).length;
}

function obtenerResumenVidaControl(serie = []) {
    const valores = Array.isArray(serie) ? serie.map((p) => Number(p && p.v)).filter(Number.isFinite) : [];
    if (!valores.length) {
        return { actual: null, min: null, max: null, media: null };
    }
    const total = valores.reduce((acc, val) => acc + val, 0);
    return {
        actual: valores[valores.length - 1],
        min: Math.min(...valores),
        max: Math.max(...valores),
        media: Math.round(total / valores.length)
    };
}

function obtenerTopTeclasControl(playerId, limite = 6) {
    const conteos = heatmapConteos[playerId];
    if (!conteos || typeof conteos.forEach !== "function") return [];
    const top = [];
    conteos.forEach((count, code) => {
        if (!Number.isFinite(count) || count <= 0) return;
        top.push({ code, count: Number(count) });
    });
    top.sort((a, b) => b.count - a.count);
    return top.slice(0, limite);
}

function obtenerResumenJugadorStatsControl(playerId) {
    const serieVida = resumenPartida.tiempos[playerId] || [];
    const tiempoTotalMs = serieVida.length
        ? Number(serieVida[serieVida.length - 1].t) || 0
        : (resumenPartida.inicio ? Math.max(0, Date.now() - resumenPartida.inicio) : 0);
    const tiempoEscrituraMs = Math.max(0, Number(obtenerTiempoEscrituraMs()) || 0);
    const topTeclas = obtenerTopTeclasControl(playerId);
    const pulsacionesTotal = topTeclas.reduce((acc, item) => acc + item.count, 0);
    const ritmoPpm = tiempoEscrituraMs > 0
        ? Math.round(pulsacionesTotal / Math.max(tiempoEscrituraMs / 60000, 0.001))
        : 0;
    const textoEl = playerId === 2 ? texto2 : texto1;
    const html = textoEl && typeof textoEl.innerHTML === "string" ? textoEl.innerHTML : "";
    const palabrasBenditas = extraerPalabrasConClase(html, ["palabra-bendita", "palabra-bendita-musa"]);
    const palabrasMalditasMap = resumenPartida.palabrasProhibidasUsadas[playerId];
    const palabrasMalditas = palabrasMalditasMap && typeof palabrasMalditasMap.keys === "function"
        ? Array.from(palabrasMalditasMap.keys()).map((valor) => String(valor).toUpperCase()).sort()
        : [];

    return {
        id: playerId,
        nombre: (playerId === 2 ? val_nombre2 : val_nombre1) || `ESCRITXR ${playerId}`,
        palabrasTotal: obtenerConteoPalabrasControl(playerId),
        pulsacionesTotal,
        teclasDistintas: topTeclas.length,
        topTeclas: topTeclas.map((item) => ({ ...item })),
        ritmoPpm,
        tiempoTotalMs,
        tiempoEscrituraMs,
        vida: obtenerResumenVidaControl(serieVida),
        letrasBenditas: Array.from(resumenPartida.letrasBenditas).sort(),
        letrasMalditas: Array.from(resumenPartida.letrasMalditas).sort(),
        palabrasBenditas,
        palabrasMalditas,
        intentosLetraProhibida: Number(resumenPartida.intentosLetraProhibida[playerId] || 0),
        intentosPalabraProhibida: Number(resumenPartida.intentosPalabraProhibida[playerId] || 0)
    };
}

function construirPayloadStatsLiveControl() {
    return {
        ts: Date.now(),
        modo_actual: String(modo_actual || ""),
        players: {
            1: obtenerResumenJugadorStatsControl(1),
            2: obtenerResumenJugadorStatsControl(2)
        }
    };
}

function emitirStatsLiveControl() {
    if (!socket || !socket.connected) return;
    socket.emit("stats_live_actualizar", construirPayloadStatsLiveControl());
}

function iniciarStatsLiveControl() {
    if (intervalo_stats_live_control) {
        clearInterval(intervalo_stats_live_control);
    }
    emitirStatsLiveControl();
    intervalo_stats_live_control = setInterval(emitirStatsLiveControl, INTERVALO_STATS_LIVE_CONTROL_MS);
}

function detenerStatsLiveControl() {
    if (!intervalo_stats_live_control) return;
    clearInterval(intervalo_stats_live_control);
    intervalo_stats_live_control = null;
}

function resetearHeatmap() {
    [1, 2].forEach(jugadorId => {
        heatmapConteos[jugadorId].clear();
        heatmapKeys[jugadorId].forEach(teclaEl => {
            teclaEl.style.backgroundColor = "#222";
            teclaEl.title = "";
        });
    });
}

function crearHeatmap(contenedorId, jugadorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    contenedor.innerHTML = "";

    HEATMAP_LAYOUT.forEach(fila => {
        const filaEl = document.createElement("div");
        filaEl.className = "heatmap-row";
        fila.forEach(tecla => {
            const teclaEl = document.createElement("div");
            if (tecla.spacer) {
                teclaEl.className = "heatmap-spacer";
            } else {
                teclaEl.className = "heatmap-key";
                teclaEl.dataset.code = tecla.code;
                teclaEl.textContent = tecla.label || tecla.code;
                heatmapKeys[jugadorId].set(tecla.code, teclaEl);
            }
            const ancho = tecla.ancho || 1;
            teclaEl.style.setProperty("--heatmap-span", ancho);
            filaEl.appendChild(teclaEl);
        });
        contenedor.appendChild(filaEl);
    });
}

function actualizarHeatmap(jugadorId, code, key) {
    if (!heatmapConteos[jugadorId]) return;
    const conteo = (heatmapConteos[jugadorId].get(code) || 0) + 1;
    heatmapConteos[jugadorId].set(code, conteo);

    const teclaEl = heatmapKeys[jugadorId].get(code);
    if (!teclaEl) return;

    let max = 0;
    heatmapConteos[jugadorId].forEach(v => { if (v > max) max = v; });
    const intensidad = max > 0 ? conteo / max : 0;
    const color = `hsl(${40 - 40 * intensidad}, 90%, ${30 + 40 * intensidad}%)`;
    teclaEl.style.backgroundColor = color;
    teclaEl.title = `${key || code} (${conteo})`;
}


let val_nombre1 = nombre1.value.toUpperCase();

let val_nombre2 = nombre2.value.toUpperCase();

const heatmapTitleJ1 = getEl("heatmap-title-j1");
const heatmapTitleJ2 = getEl("heatmap-title-j2");

function actualizarTitulosHeatmap() {
    if (heatmapTitleJ1) {
        heatmapTitleJ1.textContent = val_nombre1 ? `Mapa de calor ${val_nombre1}` : "Mapa de calor";
    }
    if (heatmapTitleJ2) {
        heatmapTitleJ2.textContent = val_nombre2 ? `Mapa de calor ${val_nombre2}` : "Mapa de calor";
    }
}

actualizarTitulosHeatmap();
actualizarNombresConexiones();
if (window.actualizarBotonesTeleprompterCarga) {
    window.actualizarBotonesTeleprompterCarga();
}


socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    setEstadoServidor(true);
    iniciarStatusPing();
    if (typeof actualizarSolicitudCalentamientoControl === "function") {
        actualizarSolicitudCalentamientoControl({ tipo: "libre" });
    }
    if (typeof actualizarModoVistaEspectadorControl === "function") {
        actualizarModoVistaEspectadorControl({ modo: "partida" });
    }
    socket.emit('envío_nombre1', val_nombre1);
    socket.emit('envío_nombre2', val_nombre2);
    socket.emit('pedir_estado_banderas_musas');
    socket.emit('pedir_vista_espectador_modo');
    iniciarStatsLiveControl();
});
socket.on('disconnect', () => {
    setEstadoServidor(false);
    setEstadoPlayers(false, false);
    detenerStatusPing();
    detenerStatsLiveControl();
});

socket.on('connect_error', () => {
    setEstadoServidor(false);
});

socket.on('health_pong', (estado) => {
    procesarEstadoConexiones(estado);
});
socket.on('calentamiento_vista', (data) => {
    vista_calentamiento = Boolean(data && data.activo);
    if (typeof actualizarBotonVistaCalentamiento === "function") {
        actualizarBotonVistaCalentamiento();
    }
    if (boton_vista_calentamiento) {
        boton_vista_calentamiento.dataset.activo = vista_calentamiento ? "1" : "0";
        boton_vista_calentamiento.textContent = vista_calentamiento ? "\u{1F3AE} VISTA PARTIDA" : "\u{1F525} VISTA CALENTAMIENTO";
    }
});

socket.on('calentamiento_estado_espectador', (data) => {
    if (typeof actualizarSolicitudCalentamientoControl === "function") {
        actualizarSolicitudCalentamientoControl(data || {});
    }
});
socket.on('vista_espectador_modo', (payload = {}) => {
    if (typeof actualizarModoVistaEspectadorControl === "function") {
        actualizarModoVistaEspectadorControl(payload);
    }
});
socket.on('estado_banderas_musas', (data = {}) => {
    if (typeof window.actualizarEstadoBanderasMusasControl === "function") {
        window.actualizarEstadoBanderasMusasControl(data);
    }
});

socket.on('actualizar_contador_musas', (contador_musas = {}) => {
    actualizarMusasMarcadorControl(1, contador_musas.escritxr1);
    actualizarMusasMarcadorControl(2, contador_musas.escritxr2);
});

function extraerTextoPlanoDesdeHtmlControl(html) {
    if (typeof html !== "string" || !html) return "";
    const contenedor = document.createElement("div");
    contenedor.innerHTML = html;
    return String(contenedor.textContent || contenedor.innerText || "").trim();
}

function convertirTextoPlanoAHtmlControl(textoPlano) {
    const plano = String(textoPlano || "").trim();
    if (!plano) return "";
    return escapeHtml(plano).replace(/\n/g, "<br>");
}

function actualizarTextoJugadorControlDesdeSocket(playerId, data) {
    const esJ2 = playerId === 2;
    const textoEl = esJ2 ? texto2 : texto1;
    const puntosEl = esJ2 ? puntos2 : puntos1;
    if (!textoEl || !data) return;

    const htmlRemoto = typeof data.text === "string" ? data.text : "";
    const guardadoRemoto = typeof data.texto_guardado === "string" ? data.texto_guardado : "";
    const guardadoLocal = esJ2 ? texto_guardado2 : texto_guardado1;
    const textoRemotoPlano = extraerTextoPlanoDesdeHtmlControl(htmlRemoto);
    const hayTextoRemoto = textoRemotoPlano.length > 0;
    const hayGuardadoRemoto = guardadoRemoto.trim().length > 0;
    const jugadorTerminado = esJ2 ? Boolean(terminado1 || fin_j2) : Boolean(terminado || fin_j1);

    if (hayTextoRemoto) {
        textoEl.innerHTML = htmlRemoto;
    } else if (hayGuardadoRemoto) {
        textoEl.innerHTML = convertirTextoPlanoAHtmlControl(guardadoRemoto);
    } else if (!jugadorTerminado) {
        textoEl.innerHTML = htmlRemoto;
    } else if (!extraerTextoPlanoDesdeHtmlControl(textoEl.innerHTML || "") && String(guardadoLocal || "").trim()) {
        textoEl.innerHTML = convertirTextoPlanoAHtmlControl(guardadoLocal);
    }

    if (hayGuardadoRemoto) {
        if (esJ2) {
            texto_guardado2 = guardadoRemoto;
        } else {
            texto_guardado1 = guardadoRemoto;
        }
    } else if (hayTextoRemoto) {
        const plano = extraerTextoPlanoDesdeHtmlControl(textoEl.innerHTML || "");
        if (esJ2) {
            texto_guardado2 = plano;
        } else {
            texto_guardado1 = plano;
        }
    } else if (!jugadorTerminado) {
        if (esJ2) {
            texto_guardado2 = "";
        } else {
            texto_guardado1 = "";
        }
    }

    if (puntosEl && typeof data.points !== "undefined") {
        actualizarPuntosMarcadorControl(playerId, data.points);
    }
    textoEl.style.height = (textoEl.scrollHeight) + "px";
}

// Recibe los datos del jugador 1 y los coloca.
socket.on('texto1', data => {
    actualizarTextoJugadorControlDesdeSocket(1, data);
    if (window.actualizarBotonesTeleprompterCarga) {
        window.actualizarBotonesTeleprompterCarga();
    }
    emitirStatsLiveControl();
});

socket.on('texto2', data => {
    actualizarTextoJugadorControlDesdeSocket(2, data);
    if (window.actualizarBotonesTeleprompterCarga) {
        window.actualizarBotonesTeleprompterCarga();
    }
    emitirStatsLiveControl();

});

socket.on('borrar_texto_guardado', () => {
    texto_guardado1 = "";
    texto_guardado2 = "";
});

socket.on('temp_modos', data => {
    tiempo_modos_secs.textContent = data.segundos_transcurridos + " segundos";
    display_modo.textContent = data.modo_actual.toUpperCase();
    display_modo.style.color = COLORES_MODOS[data.modo_actual];
    registrarModoActual(data.modo_actual);
    emitirStatsLiveControl();
    console.log(data.secondsPassed, "secondsPassed", data.modo_actual);
    console.log(COLORES_MODOS[data.modo_actual])
});

socket.on('tecla_jugador_control', data => {
    if (!data || !data.player || !data.code) return;
    actualizarHeatmap(data.player, data.code, data.key);
    emitirStatsLiveControl();
});


socket.on('tiempo_muerto_control', data => {
    display_modo.style.color = COLORES_MODOS[modo_actual];
    display_modo.textContent = modo_actual.toUpperCase();
    boton_pausar_reanudar.innerHTML = "▶️ REANUDAR";
    boton_pausar_reanudar.dataset.value = 1;
    pausar();
  TimeoutTiempoMuerto = setTimeout(function(){
    reanudar_modo();
  }, TIEMPO_CAMBIO_MODOS * 1000);
});

socket.on('fin_a_control', () => {
    fin_j1 = false;
    fin_j2 = false;
    final(1);
    final(2);
    socket.emit('fin_de_control', 1);
    socket.emit('fin_de_control', 2);
  });


socket.on('fin_de_player_a_control', (player) => {
if(player == 1){
    fin_j1 = false;
    final(1);

}
else if(player == 2){
    fin_j2 = false;
    final(2);
}
});


nombre1.addEventListener("input", evt => {
    val_nombre1 = nombre1.value.toUpperCase();
    actualizarTitulosHeatmap();
    actualizarNombresConexiones();
    socket.emit('envío_nombre1', val_nombre1);
});

nombre2.addEventListener("input", evt => {
    val_nombre2 = nombre2.value.toUpperCase();
    actualizarTitulosHeatmap();
    actualizarNombresConexiones();
    socket.emit('envío_nombre2', val_nombre2);
});

socket.on("recibir_postgame1", (data) => {
    postgame2 = "\n🖋️ Caracteres escritos = " + data.longitud + "\n📚 Palabras bonus = " + data.puntos_palabra + "\n❌ Letra prohibida = " + data.puntos_letra_prohibida + "\n\n";
});

socket.on("recibir_postgame2", (data) => {
    postgame1 = "\n🖋️ Caracteres escritos = " + data.longitud + "\n📚 Palabras bonus = " + data.puntos_palabra + "\n❌ Letra prohibida = " + data.puntos_letra_prohibida + "\n";
});

socket.on("aumentar_tiempo_control", (data) => {
    if(data.player == 1){
        addSeconds(data.secs);
    }
    else {
        console.log(data.player);
        console.log(data.secs);
        addSeconds1(data.secs);
    }
    emitirStatsLiveControl();
});

socket.on('activar_modo', (data) => {
    modo_actual = data.modo_actual;
    console.log(modo_actual)
    registrarModoActual(modo_actual);
    if (data && data.letra_bendita) {
        resumenPartida.letrasBenditas.add(String(data.letra_bendita).toUpperCase());
    }
    if (data && data.letra_prohibida) {
        resumenPartida.letrasMalditas.add(String(data.letra_prohibida).toUpperCase());
    }
    MODOS[modo_actual]();
    emitirStatsLiveControl();
});

socket.on('nueva letra', (letra) => {
    const valor = String(letra || "").toUpperCase();
    if (!valor) return;
    if (modo_actual === "letra bendita") {
        resumenPartida.letrasBenditas.add(valor);
    } else if (modo_actual === "letra prohibida") {
        resumenPartida.letrasMalditas.add(valor);
    }
});

socket.on('intento_prohibido', (data) => {
    if (!data || !data.player || !data.tipo) return;
    const playerId = data.player;
    if (!Object.prototype.hasOwnProperty.call(resumenPartida.intentosLetraProhibida, playerId)) return;
    const valor = data.valor ? String(data.valor).toUpperCase() : "";
    if (data.tipo === "letra") {
        resumenPartida.intentosLetraProhibida[playerId] += 1;
        if (valor) {
            const mapa = resumenPartida.letrasProhibidasUsadas[playerId];
            mapa.set(valor, (mapa.get(valor) || 0) + 1);
        }
        return;
    }
    if (data.tipo === "palabra") {
        resumenPartida.intentosPalabraProhibida[playerId] += 1;
        if (valor) {
            const mapa = resumenPartida.palabrasProhibidasUsadas[playerId];
            mapa.set(valor, (mapa.get(valor) || 0) + 1);
        }
    }
    emitirStatsLiveControl();
});

socket.on('resucitar_control', (data) => {
 if(data.player == 1){
    secondsPassed = 0
    startCountDown_p1(data.secs);
 }
 else if(data.player == 2){
    secondsPassed1 = 0
    startCountDown_p2(data.secs);

 }
});


function downloadTxtFile(filename, htmlContent) {
    // Reemplazar etiquetas <br> y separar bloques de <div> con saltos de línea
    let contentWithNewlines = htmlContent
        .replace(/<br\s*\/?>/gi, '\n')               // Reemplaza <br> por saltos de línea
        .replace(/<\/div>\s*<div>/gi, '\n')          // Reemplaza el cierre y apertura de <div> consecutivos por un salto de línea
        .replace(/<\/?div>/gi, '')                   // Elimina etiquetas <div> restantes
        .trim();                                     // Elimina espacios en blanco al inicio y final
    
    // Crear un Blob con el texto procesado
    const blob = new Blob([contentWithNewlines], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);  // Requerido en algunos navegadores como Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

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

function descargar_textos(opciones = {}) {
    const opcionesNormalizadas = (opciones && typeof opciones === "object") ? opciones : {};
    const descargar = opcionesNormalizadas.descargar !== false;
    const emitirMusas = opcionesNormalizadas.emitirMusas === true;
    const { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    prepararFuentePdf(doc);

    const margen = 20;
    const anchoPagina = doc.internal.pageSize.width;
    const altoPagina = doc.internal.pageSize.height;
    const imgLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABhMAAAW6CAMAAADBEGM8AAAATlBMVEVMaXH/+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e//+e8QStEqAAAAGXRSTlMAYNAwQICgEPDAIOBwkFCwppi19vfW/Wqym4PmjQAAAAlwSFlzAAAuIwAALiMBeKU/dgAAIABJREFUeJzt3deW40ByaNGiBT2layTx/39UzbI0sGkQ7uw3Lc1Ms0gAgcww+fEB2HBYry+bzWa7v7u1Od7/P9d//5nTer2W/rgAgOIO90Cw3x9bg8CA/X57Dw/SfwIAINe/WLBNCwVtweFfbDhI/0UAgMma9em835UJBs+W181lJf3nAQDGWS0qRYOXyLBupP9SAECPezioHQ0eHAkMAKBSc9nMGQ4eAsP2xFYSAOhxWJyXIvHgx+7fgkH6SwAA/FsfbAvVFWXaXVkvAICktfD64NVxeyG/AAACDotr9eqiFPsTPQwAMKvVSdcC4dnyzC4SAMxkddaRQehzJCwAQH0WAsKXJZtIAFDTwUxA+LJfkHIGgCoa1TmEDrste0gAUNzlKv14T3VksQAAJR3OKstOx9ptySwAQCELmUFGRe0v0t8iADhw2NhKK3diCwkAMq220o/ygnYbogIAJPOwafSEqAAAiRZONo2eEBUAYLpmY7rSqAdRAQCm8RsR7ogKADCe74hwt1tIf8cAYIP/iHB3pF8BAIaFiAh3ewYhAUA/l7VGXc6kFQCg2zpSRLiRVgCAbgdvHWoj7BmOBwAtmrP081nGRvqLBwB9TlFSy2+W5JoB4MnK4Alq5bBUAIA/UbeNfrFUAIAfl7DbRn9O0j8CAKjQmD1nuag9vQoAEDi3/GK3lv4pAEBYE7AloROpZgCxkUl4wv4RgMDIJLw6Un8EIKpow43GYAASgKA20s9fnc7SvwsAzC/ivLtxriQVAERDcrnbkqAAIBb2jfqQaQYQCU0JA3YEBQBhrKg3GrK7SP9IADCPBamEEahJBRACqYRxCAoA/Gu20s9aMwgKALxrQh+nNhFBAYBvZJcnISgA8GxFdnkaggIAvyg4moxjdgB4tZB+wBpE8xoApwgJKQgKAFw6Sz9djToyEA+AP7QlpGJKKgB3CAnpttI/HgCURUjIsZH++QCgJEJCHoakAnCEkJCJ4iMAflBxlI08MwAv6EsogDwzAB8ICUUw+QiAB4SEMnYH6V8SALIxCbWUpfRPCQC5CAnl0KUAwDhOVSuJglQAthESSmL3CIBp9KqVxe4RAMNO0s9Qd6g9AmDWRfoJ6s9e+jcFgESUHFVA5xoAmyg5qmHH3CMAJpFfroI0MwCLyC9XQpoZgD0r6UenWwxIBWBOc5R+dPq1lv5xAWAikgn1UI8KwBjmY9fEQgGAKQc6E2pioQDAlL30U9M5FgoADKEMtTIWCgDsYKZFdRykAMAMdo6qo0cBgBXsHM2AZmYANlBzNAemHgGwgZ2jOeykf2YAGINzdObBOQoADGDO0UwoRwVgwFn6WRkGWWYA6h2kn5RxnKV/awAYQoJ5NmSZAWi3ln5QRnKR/rUBoB8J5hnRywxAN05NmNOukf69AaBHQwfzrGhRAKDZRvohGcxV+gcHgG4sE2ZG5REAxVgmzI3KIwBqsUyYHZVHANRimTC7o/RvDgAdWCYI4AhOAEqxTBBwkv7VAaAVywQJDMwGoJPhZcJ+f95s1v/8TJ9u7v/HabPZ79UHOtHfHAC6qH96ttjtN4v1wICI1XpzVjzsdT3PrwsAk5ibdLTfXCYcSnO4bHQGhk29nxQAkpkaiLrcJL1er05XdashEgoAFLJzbsLuusgZJ7raLKX/gieMtwCg0FX62TjStsA0iGah6a+lQwGAOjZOYV5mrRAeKQoLzMsGoM5Z+sk4bLct+0bdnHRsIp2L/lUAUIC61Our3abCmWSrrYK/myQzAG20F6Iea22wNAv5eqtKfxoApNJZuv9jV3XL/SL9x0/osgCAGajOMFfZNXqy3or+gXQyA9BF86ij7Ryv0QfJqEAnMwBd5PfUuxzneok+yNWmUngEQJWV2ONwyJyv0GupvAKFRwBU0dqcsJy5xfcis17i/E0AqijdOhLYU9mI9CvM/3cCQCedW0e7AoONpmskks0UowJQROXW0VLqQbmef9VEMSoARTRuHW1r9yT0mL0yV2RFBACtNG4dyZbsr2YejkeDAgA9TvM+AMcQHx8971KBmABADx0Tox/UHW80zqxLBZrWAKjRzPjwG2Wn4+CxGTPvNK0BUOMy37NvFCUh4eNjPVuvAjEBgBqyM0HfqAkJ/1ZQcw27ICYAUENXJaqikPAxW6qZmABAC11HJ+gKCXPtHzHwCIAWuk7dVNe9dZil/kj6rwSAb6oGWygoQn01ywAk6T8SAL5p6k7Q2bs1Q1JB+k8EgG/1H3ijbaW/iw6L6kkF6b8QAL6saz/uxltKfxedVrWDgvQfCABfZp8B2mknOAl1SO1Ms/TfBwBf5E6mf6WsCvVZUzcoSP95QJtG8XsaalGTYj5JfxP9qpYf0Z8AjVbKb0pUUfFJN8lV+osYVDEo0McMhdb6b0qUpyXFrDmZ8KNeUCAmQJ/T0sBNieK0dDGr619uU629j5gAdbaEhJiUlB0ZWaTWiqDEBCjTLAkJQekoO7Kwc/SpUlDgnDXosjoSEqKa64SAfiZ2jj7VCQo6Z3ogrMvuSEiIqsojbipLWydVggIxAZps1M2sx3xqPOEmO0h/C1PUCApr6T8K+NVsCQmBqShFNbabXqH6iJgANZolISEyDTHBTIL5R/k+BWvfAPxa7QgJoZ2KP96ms7eZXjwoSP9BwLeFvvNvMSsF7QnmlgkfxYOC3iHhCOa+McpOZmgKDt60t0woPiXVUt0VHGvupekKz7/FjOTbEywuE0oHBYthEf6s7lc1ISE4+ZhgrOjoR1Py5DVuQyhw2XEtQkFMMNWb8KDkcZzk9CDvs96EkBDesdyDLY2R4XctCpbxSv8pwNeZUYQElHuuJbIz6ehNsYZmyo4g7StBRkiAeEzYSX8BOUpVpG6l/xBE97UTykmbkI8JRjPM3wplY3g7g6yvJS/vJviQjwm2s6uFKlJtfwkw76tLiZCAuyLPtHRH6b8/U5HiI9P7ZzCv+VruEhLwqcAjLYf56/BS4EuwW3oFB1ZLH7ciCinwSMthuOroW4GBUWT2IOfytdQlJOBb/hMti8m5Fs/y88xWu/bgwPc7DSEBP7IfaFk8FOY3uW1/1nMqsKv5LqcmJOBX9mM9i+1K1G8rvgTYdPiumyMk4E/2Yz2Lj8L8zHOJ7OdUYNP6u2qOkIAH+c/1HE4K86853wGVqJDxM5uFkIBHBR7sGaT/+kKyUgrckRDxM5ll6aDQAwWVeLIn85Bi/pSTUmDrCAJ+W/AJCXhW9gzJifwcOZnepcDWEQT8NuATEvBC9EwdR0dOJn+PVB1hfgtCAroQE8o4pA4+cpJmhyXnn6uPkIA3ojHBRynql8QDdtykVGBG83vTExLwrsC4nnRr6b++pLSCVE9hESasfqvkCAloQUwopUnZPdpxV2Jev6kEQgJaZfbg5nEVE5LGZpNhxrz+XgIJCWi1LveEn85XTEjZPWIkKubU/F2jhAS0IyaUM333iB5mzGn1145ESECXog/5iZzFhOm7RywTMKPL30sLIQGdij7kJ/IWE6buHvnp44YBD/UkhAR0k2xQcNSz9mXi7pG7mAi9HlIJhAT0yZrznMldTJhWxkU2AbM5PEw2IySgj2SDgsOH4pRlF9kEzGX9sIIlJKBX4kyGIhzupx/G//X0JmAuj+tXQgL6SRajepwTPXrdRQszZtJsH647QgKGVHjWj+bw8hx95tpJ+pMiiMdUAiEBw3LOjczlsfBm5MKLgaiYx2MqgZCAESg8KmzcF+oxHEKhp1I4QgJGkCw8ukr/8TWMOl6HBDPm8JRKICRgFJLMpY2IskduTszgKZVASMA4Ta0H/hgud1BGpJld/t3Q5imVQEjAWJJJZp9bKIOz8Hz+2VDmuauekICxth0Prjkcpf/4Oga6mak5Qn3PqQRCAsYTPWptJf3XV7Hq/Zt3DLVAdc+pBEICJuh/gFXmdBeld+11kf508O85lUBIwCQph8uX4rPyqLce1WkYhCYvi39CAiaR7Fq7LaT/+jq661Fd9mRAlZdUAiEBE4kmFBzORr3rPF2H2xO1vaQSuOYwlWhCwWmWuWsGOfll1PaSSiAkYDrJDgWPB+t8av1Sd04jIPR4XfYTEjCdZIeC2+PG2hrXCAmo7DWVQEhACsmz1vwuFFoa15wm1KHGayqBkIAkoiOP3C4U3tM0hATU9ZpKICQg0ZST5cvzulB4XX4RElDXWwUhIQGJRKtR/U4JfQoKO69/JZRo3hqN9oQEJDrM9/xv47RH4eNj9bcA23J7oqrVayrB7QIcc3i7nObld1flcLru9/vtgoiAui5vXZKEBGQQ3jza8cgEcrwPUyEkIIfw5hFz4YAM76kEQgIyCW8euU0zA/W9pxIICcglvHnEofVAqvdUAiEB2aQ3j9g9AtKc3+8mQgLyybat3Th9DEjRtNy5hAQUIDvz6EbtEZBg1TJ/l5CAEjoPgZmN2841oJZFy21LSEAZsgOz70gpAJO0pBIICShlPXsMeOO3nRkory2VwE2EckRPW/vEkTPAaKu27V5CAsqRblG40aUAjNZaFUJIQEHyWWbmvQMjteb/CAkoSj7LTIIMGKNpHUZDSEBZ4r3MdwQFYMjbGZufCAkoTbyX+e4k/S0AyrWn/ggJKO4y8+O/HZc20KNp3+TlvkEF8uWod1zcQKdDayphx7ww1CA+9OgLQQHo0DIY+0ZrD6pRUI56R1AAWr2fsXlHSEAt7Vfc/AgKwLuWMzbvCAmoRkPf2ieCAvCqbTD2jZCAqrQsFAgKwIu2wdg3QgLqUrNQoE8BeNI2GPtGSEBtahYKdDQDf1oHY/+zJCSgLj0LBYIC8KN1MPaNqZGYgZ6FAtc78KWrc4hbBPUpWiiwLgY+OqdZEBIwD0ULBfJnQMc0ixshATPRtFCgJhXhtQ/GvhESMBslU4++kWlGaJ1n4u4JCZiLjvGoP7j0EVfHNIsbL0uYk45zFH4dSSogqFVXKoGQgFmpOHDtAUkFhNQ+GPuOkIBZreZ84I+xZf8I8XRMs7gREjC7rnpoMXQqIJquaRY3QgLmp6se9W7H/hFC6RiMfbeR/mwISFPj2jf2jxBIT0U4r0eQoKse9RP1RwijZ/eWkAAR6/me9eOxZkYIndMsboQEiOnslZG0P0h/LUB1ndMsboQEyNGXZr7bcfwavOtJ5lFqAUGdc1ZkXUk1w7PuaRbMCYYwbd3M33YX6S8GqKZ7mgUhAdLUdTP/YKkArxY9W7aEBEhT2KTwhaUCfOqeZkFIgAY9y1hhLBXgT880C0ICVFC7e0QBBvxZ9ZX6cagaVFC7e3SjVwHO9Bb6ERKghN7do39LBdqa4UbTO4uYkAAtFO8e/bNcS38/QBF90ywICdBE8+7RjWGp8KH7QLU7jiSHJpp3j27kmuFB/5sXJ+hAlYPKuUcP9tTowbS+aRY3QgLUUTr36MGZpTXs6jlQ7Y6QAHVUTs1+wrRUmNU3zeJGSIBGOqdmP6MCCTb1lqDebrztQCOVZ669utLCBnOagRIOKiigk/KC1G8b0gqwpe9AtTtCArRSepTCC9IKMGWofIOQALUspBTujtxFsGKgBJXWG6hmIqVwtyfZDBP6DlS7YzY2dLORUrijhw0GDJSgEhKgno2UwqctJUhQru9AtTtCAtRr+rstdSEqQLPeA9XuCAkwQPfY7FcUpkKt3gPV7pa808CCxSwP81J2RAXoNDhBjOMSYMRAG742RAUo1H+g2h0hAWYoP0vhDVEB2vQfqHZHSIAdpvLMn4gKUKX/QLW7K1csDBlMjilEDRLUGG7zYTY2bLGVZ/5GVIAKgyWohATYY6ef+dGWcm+IGzhQ7fNClf6MwGTGio9+MAcJwkassTfSnxFIYK346MeSMZMQNOJliisUJg0dDaXXcUFJB2QMl6ASEmCWxeKjb7sN6WYIGDpQ7Y6QALMMBwXSzRAwojKDE3RgmcmK1F977j7MaehAtTsGocI220HhdjyRWMBchg5UuyMkwDqjFam/dvSxYR5DB6p9Xo6EBJhnPSiwhYRZDB2odnckJMABQ2dxdjlShYS6RhVuMwgVLthtU3i0pb0Z9YwpQSUkwAsfQYF8M6oZPFDtjpAAN5wEBRYLqGL4QLW7PSEBfpjuXXvCYgGljSlBZRAqnPETFFgsoKzhA9U+rzrpjwmU5Sko/FssUIaEQsaUoBIS4JCroHC7XS/SXyg8GHGg2h3HJcAhZ0HhtjuzWECmEQeq3dE0CZdWlR/S81tyzAJyjJwGRkiAU8bn4bXasoeERONKUAkJcMxjULjtzsygQYIxB6rdry/eOuCYy6Bwuy2pQ8JU40pQGYQK55wGhdvtSmoBU4w4UO2OkADv3AaF247UAsYac6Da50VFSIB73kpSH5FawCgjS1BvS/YkEYDnoMBJCxhhzIFqdwxCRQy+gwIZZwwYe/IgIQFReA8K99M6uZ3RbvTgeGZjIw7/QYFCJLQbdaDaHVPvEEmEoHAPC9LfM7QZdaDaHSEBsbg5ea0f9al4NLYE9XY7S39UYGZBggJhAX/GHah2xwoT8YQJCoQFfBk5zeJGSEBQY0vyPCAsYNyBaneEBAQVKSgQFoIbeaDajXkWiGzkHDA3CAthja+0IyQgMr8T8boQFkIaf6ETEhDb2MkvnhAWohl7oNqNeRZAjO61V4SFSEYeqHZHSADG12z7QliIYvQ0C0ICcBeoUeEFYSGCCYUUzLMA7ibstrpDWHBu/DQLQgLwa3w3j0OEBcem7Iwy4gj4Fa8m9QlhwakpZXU0LwMPJuThfCIsODRl/UtIAJ5ELT96QFjwZUrxxI6fHngxfh6MY4QFP6Z03tC8DLQIXH70gLDgw5QUGSEBaBU80/yLsGDflBec5UH60wJKxRx00YawYNqkPkyal4FOEybDuEdYMGvSuw0hAegRuaf5HWHBpNOU35jmZaDfpBvKP8KCNdNeawgJwJDw7Wuvdtu19G+C0aZtf26kPy5gAEmFN8cz1Yo2THujoXkZGIWkwjvCggXTdj4JCcBIEY/kHEZYUG5aKoFONWC81bHWg9U2woJi0zY9CQnAFFPOIomFsKDUZdLidsmvCExDUWqn45lpCOpMOGPzRqcakID9ox7LE2FBk4nrWkICkID9o16EBT0mHv9BpxqQhv2jfoQFHaalEggJQDL2j4bsF2xDSJtyxuaN5mUgB/tHw66EBUlTTwikUw3IQv/aCFceNFImLmV3/FJApon5u6AYoCpj4isLnWpAARP3a6MiLMxv4qVJSACKYH72SDQ5z2rSGZs32hKAYkg1j0aT82ymnh9OSADKIdU8Hm0Ls1hM/FmuhASgoMPEkr/YaFuobfLR4XSqAYVNmzIW3pWMc0WTTwM8S39iwB+qUqfhJOdqJlc90JYA1MBSYSIKkaqYPIiLkADUsWYA0lRknEubXAVHWwJQTUMD23RMRCpp8hYmIQGoiaVCAnqci5k4GJu2BKA2lgpJSC0UMfniIyQA1bFUSLM88XzKM3Uw9u225SsH6mOpkIqp2jmmn/FEpxowD5YKqXZb9pASTR+wwplqwFxYKqQ7Up6aYuo0C9oSgFmtaWtOxx7SVFMHY/9bkVHrBcyLtuYMO+qQpph+hgdtCcDsmICUhTqk0SZPs7gdCQmAgBPnKmShl22MyYOxaUsApHCuQqbjhoTzgITl6J6QAEiZPGwAL0g490q4wGhLAAQlrOzxbMcpzp0SKhk4QAeQRQdbvj2LhTbTp1nQlgAoQFlqPhYL76ZPs7jtCAmAAuSaS2Cx8Gz6NAvaEgAtEu5fvGGx8CAhUUVbAqAGI5DKYLHwZfo0C9oSAF0YgVTGjp6FlGkWtCUA6tDXXMg1eoPz9GkWtCUACtGsUMox8jSkpMuItgRAIzaQSol7/E7ScEXSMIBSGzaQSomZb04Zl0JbAqAXG0jlBJyRl1K/RlsCoBobSAVt19I/55xSplnQlgCoRwVSQYG2kBKmWdCWAFjABlJJx02Mx94i5cu5xvhuAOtWzEAqaRsgsZD0HkFbAmDFgiHaJe2dJxYOSVmojfTHBjBawxDtoo6eEwsp0yxoSwCMOVxLPxdj27lNLCS9PuycL50Ah6hLLcxlYqFJenegLQGwiKMVCru6eztOmmZxW3qMjkAApBVK2/uam5r21kBbAmAWaYXSPKWb005jogYVsIy0Qmle+tiSplkQEgDzSCuU5qIIaZV2WThaJgFRNUzRLm1nvggp5UA1RmMDThwYglSc6aiQOBWLGlTAC4YglWc3KqRNs7gtCQmAH2uGIBVn9IiFlAPVbtSgAt6QbC7P4ny8xK4VRmMD3pBsrsBaVEgsQaUGFfCIZHMFpqJC0oFq/5ykPziAKg4km8uzExVS9w+pQQXcWhMVyjMSFRKXidSgAq5xDlsFBqJCYgnq7UhIAJw7kWwub6+8XyHtQDVqUIEIKEGqQXUXW+rgdGpQgRASxxugl9qokHag2o0aVCAOClNrOKt8rU47UO1GDSoQCiVIFWicpJ3cwk4NKhALUaGC3Ub6Z32RdqAaNahASc36n8Xmbn/3fLcd9/vzZq1h85nC1ApUndDZpO4bUYMK5Dms16fN5rrfj74Jd/uN/H1HVKhgqaZdIfFANWpQgUT/FgSbzXZ8HHi1E5+4TGFqDXv5aH+XdqDajRpUYLL1ZXNODwWPjifh+4+oUIOCwtT0imNqUIHR/gWD7b7sQ3QnXfPXpOYh0UO6BCm5BJUaVGCU9WKzr7T7Ln6wIe0KFcgeap94oNqNGlRg0OpSLRr8EH81IypUcJTLFiUv/ahBBfqsF+d5qvjlt3BpV6hAaDZe6oFq1KAC3VaLc5Ek8kgKqv+IChVIzLtIPVBNxVUIKNRcNvM/HjXcjkSF8uZPKyySP+tWwTUIKLNabIX6uK7Sf/odTWzlzdvDljH0Vn4DE9BldbpK1urrGJVDVChvxm6F1APVbhQcAU+E48En6abmb0SF4mYbjZd6oJp06SygymGxFY8Hd0ct27m0Nhc3T11q6oFq1KACvy5nPa/FOnaPPhh4UcO1+gZS8oFqCtomARUOp/S7qIad/JScH0SF4moPMUkvQVVR9AZIWytaIPxQs1D4ICpUULUCKflANQqOgI9GSQbh1U76i3nCwIvi6rWwZfxW51qfCbDhsNC1Y/ToIv3lPCMqlLar8wsnH6h2owYVwR1Oc06smEzdKp6oUFqNGUjpJai3nZIKaECC8oDwz1H6K3pHVCisfLNC8oFq1KAiskZ9QLjTU3n0Z8UYpLLKVn5mlKBScISwGsU5hCc6V/IMxyusYK45/UC1221PSEBMFzvbH1oTfkSFsor1NacfqKYwewXMYXVWWXbaQVOHwjOiQllllgo5Z2mLn+4HzK856WtM66U3JhAVCiuwVEg/UO2md0kK1HMxkkR4oPvd7WIswiqXu1RYZayAKThCOIeNxQeYzhzzHwZpl5S3VEg/UI2hd4hnYXSfQ/+tSlQoKX2pkHGgGjWoiMbmEuGT9Fc3BlGhoNSlQsaBahy8jGDW9rIIv1QcyjyMqFBQ0lIhpwSVoXeIxFyh0TMrtSAM0i7oOH3DMP1AtZudiwzId9A5Ans8O2t6okJBEyuQc6ZZMPQOgVjeNPpiqrGUqFDOcsqcq4wD1ahBRSAe9rg1TsDrQVQoZsLBnBkHqlFwhDAau5VGD+zl/pqc2Qp4dB35tM6a3TX2HwFsO5gaadTpaPGG5XiFUkZt9OccqGZsbxJI5eapZDT55+b7Fzecas44UO2mfXAKUIb9xPIPu3csUaGQoVRzxoFq/9Yh1KAiAEejOk2v6w9uIrOs3aXnS84qQaXgCBE4igi2Q8KHr99CUvfYiZwD1SZWuwImuXoKWQ8JH85+DzldE0uzpllQgwr/fD2B7FWhtvH1m0hp3/fPK/p18MoB9PL19PGT/ePQnRLe94+yDlTTfXofUICviODrfBMP7eTiXq+IrGkWDL2Dd84iQqHD2vUgKuR7XjnmHKhGwRG881b1WOCkdnUYg5TvIcOU1/3hahUKvHLXHbVxtkj4wnC8fD+VQlkHqlFwBN/cPWqubovG3f1U8/uaf5Q3zYJTNuHaydljZu9w2+iPuyXd/E6ZB6p5qXEGWnkrc/QdEe6ICrn+4//k/fcpOIJf3oqN/EeEu5WzX80WTtmEX97eOGNEhDtvsdyQIwVH8MpbvnLrNrPcZu1sz88KCo7glq9Ewu4cKiLc0cQmgFM24ZWvLemdz36EId4qxvRj6B2c8nUG/DFsHYi37T/twl5o8G7h6UkSNyLc+YruuvWe1gbY5WrbKHZEuPNWPKYWQ+/gU5PZwqlKnOLTPq6CvFoUHMEnT9VGRIQf67yBbhhGwRFc8jQRm4jwiMLUuig4gkuOaheJCK8oQaroJP3rAhU42nYmIrRwlSlSxc/B3sADP0+MLRGhHSVIVVBwBI9WbrKQscYaTeRoLajGkgsODrlZJPg9Qq0QZuMVtqfgCP64WSSQRxiBEqSSKDiCQ14WCUSEcZiCVA4FR/DHyyKBiDBeQ7K5CAqO4JCTRcKSiDDJgWRzPgqO4I+TRQKT7qYj2ZyLgiP446NxecembhJXI9HnR8ER3Gl87B/EPEOtBDqbM1BwBHcuLl4TaVHLQWdzqo30TwcU5uMALlLLudY+FotzI4EFb1wklykFLIEetskoOII7J+m7qoQziYQi6GGbaElIgDONh6Nz9tyYxZBWmOQ/pH8voKy1g9dCto3KIq0wBTVHcMVDASLbRsXRrTABQQF+eGhKoNqoBroVJiAowAsP+0aUhlfCEKTxCArwwcGr4J4mtXoYgjQaQQEOOKg3YrZRZdSljkVQgHkr+y+BLBKqoy51LIICjLNfWMIiYRZrDz3uc+ByhGn2X/9YJMzFxwz1+miSgV2N+Xc/Fgkz4nDOcQgKsGpl/sWPQ63mxQbSKAQF2LSQvnWy0ZMwOzaQxiAowCLzGwFH5t0JcFC6PAN66mHaIKaVAAAgAElEQVSO/WkWW6YbyaCFbRhnKcAa810Ju4v0VxgYLWyDCAqwxfypyySXRTEDaRBBAZaYP1DtLP0Nhmf+raK6JXubMMN6dpl9IwWas/RloB1BAUaYb1Rj30gHmhUGLKV/IWCMlfU7mX0jNcg192MeHgyw3rvMvpEm5Jr7ERSgnvXe5SXVHLrYn6tbFQ3NUM56wdGVtJ029DX3IihANesFR8w30oi+5h60KUAx66OOSSUoRVlqD4IC1LJeg0oqQS+WCt1oU4BSB+MhYc+tpdlG+vrQizYFqGS9BpWqPuXM973Uw7ULhayHBMo39GOp0IXaCKhjvIp8xxElFrBU6MIrDZQx3qnGgWpWsFRoR/ERdDEeEijcsIOlQrsd1zAUMf7yxhmbphi/2mrhxQZ6GO9Uo2jDGHoVWnEdQwvjIeEk/f1hKtqaW1F8BB2MhwQKNixiqdCG0SzQwHZIYMKRUQxLbUHxEeQZvzW5iey62O6IqYI8M6QZn3pHSLCMI9jeXaV/FARnPCQsD9JfILJYP8CpAvLMkGQ9JLDQto4GtjckyCCHkABpVKW+2rH4hRRCAhQg1fyCCxtCCAlQoSHV/Ix+ZogwHhK4bxxhANIz2jAhgJAAPehqfkaJNWZHSIAmxlsnSzuyMYq52b4FCQn+0KrwiNY1zMz2jCNCgkcr9o8eMOwXsyIkQB/2jx6RUsCMCAlQif2jP6QUMB/bIYG+BMfYP/pDSgFzsT1MgJDgGv1rf0gpYB4L6Us9CyHBO/rXfjAIHrMgJEC3NfOPvnG1YwaEBGh3sN1PWdBZ+qeAfyvT72AspmNobFdBFMRZCqiMkAATbC9ny9mxMEZVhAQYYftSLWcv/UPANeNz71hHR2L8Yi2GglTUY/wuY6Z8MCQVPrE6RjW2p8nwvhQOky7ultI/A9yy/drFkKOA6FS4oyAVddhuDyUkhLSyvd1ZyFr6Z4BLtov76FULivFHNyakooq19HWdhZsiLttbnmWwe4TibFd705gQme0VbhmUYaOwxvZUevZTQ7uYfqEpgnZmlEVjAizjoB3O10FZtrdk2UwNz/hLTQnsHqEg21WovCHho7Hdb1kAu0cox3aOjipU3Nle6xbAuxFKMV5ydJD+/qBD+EEX7B6hjMZ0SKDkCD9sr3fzsXuEIoxn5xh8h1/Rpx9RbIESbG/DMuUID2xvg+Zj0Yx8tjdhyS/jycH2qjcXI16Q7SJ9FWchv4wXxrdCc7F7hEzG19oslfEqeFBg8BeyGL9/NtLfHzSynSHLxJlryGK795MeHbQKHRQoxEMG2/ll8mnoEDkokGNDOtun6LBzik5n6YtTEMtnpDrYzi+zRka3yC3NjLhAItv5Zd6G0CdwUGBTFWls77ly3aNf4KBAkwJSGL9lSCZggPErPAd3B6Yz3qxGMgGD4gaFvfRXD3uMN6uRTMAIcYMCB5RjKtvJBObEY5SwQYF0GyYyfq8w5gjjGL/Q0zH2BZMYTyZQVoGxwgYFupkxgfFkAlO+MF7UoECaGRPYTiZQaIcpogYFNlgxmu1jdChDxTRBg8JR+nuHGcbHHLEmxkRBgwIvTxjJdjKBScCYzPZM+FRUbGOcjfSlmoeXH0xnPIOWiPo8jGH8zAR2jpAiZlBgTY1hzVH6Os3CchhpQgYF3qAwzPYBzJwWglTGr/w01KNiiPEKDN57kMp4o2Ya2jsxwHgZKjVHSBcyKDAfFf320pdoHmqOkKGx/UaUhMY19DJeps3OEbIYH/2YhPmo6LGSvj7zsHOETMbvgBRU6qGH8f1U3niQy3iNRQpuG3Qy3sBMCQXyGd8+TcDyGl2sr5sptUYB8XrXttJfObQyvnPE7BYUEa93jYUCWhnfOSJVhjLitSmwUEAb6ztHDLVAIcYbNxOwUEAL4y9HtCagmHBtClfpbxwKGd854k0HBYWrSKU+A6+s7xxRY42SrL8iTcUyG6+M7xwdSTCjqGjFRywU8Mz6axEJZpQVrfiIhQKeWC+04IJGadHyzCwU8Mj4hOzbSvoLhD/GzyWfivcqPLBeZUEHMyqwvqE6EQsF/LJ+kggdzKgiVp6ZhQJ+WR/6xeFqqCJYnpmFAr5Z3zfl8EBUEivPzEIB347S12Im6lBRi/VM2zQsFPDJeiaNtxvUY31fdRKmHuHuIH0h5uLlBhWFSikwNAwf9lsTGP2Omqy3c07CzYSPj4v0ZZiLVxtUZf4OmYK7CY31BDPtaqgsUkqBhQKsJ5hpV0NtoboUuJ+iM59g5tgEVBepS4EbKjrrCWaWCZjBSfo6nw93VHDWO5h5q8EsAg0+YlBMbNYTzEy1wCysT4mcgHsqNOsJ5ttC+htEEIEKUrmpAjP/8sMrDeZylr7YZ7OU/qohx3zdNW80mIv5Rp7xGBYT1kr62svFMgHzMV+PMRqT8MKyXofKMgFzirN7xICLoMxnzVgmYFZh2pkZcBGU+f1RlgmYlfnN1rHoW4vJfGsmywTMLMzuEa2gEZmvQ2WZgLmFqT3ifSsi8+1qXLaYXZjaI1644jE/D5XlLQRE2T3ijPN4zLerkQaDAPtbriNRjhqN/QoKlgmQYL6CeyTKUaMx367GMgEygkzN5gYLxn6qjNcYyDgE2T3iGIVYzC8T2O6EFPMVe+NQ1xcKywQgWZARF0xHjcR+5w3XK8TYf6UahfeuQBbSV1s2qqchyHwh9zhkmeOwv0y4SH+FiCxImpkscxj2lwmkvyAqRpqZ2ywM+8sEXmAgy/49NAZZuyDsLxNop4GwGN3MZJmDsP+Kw6UKafY7fMbg5SsE+8sE+tUgzv7AsDHYpA3B/jKBQlTIC1GPSpY5AgfLBApRIS/G0OyV9NeM+uwvE3h3gQYh6lFJ3fnnYJnAwQnQIMRCYSf9LaM6+8sEMszQwcH71TDOZfbOwWV8lf4OgS8OXrAGcbt55+AqJsMMJRy8YQ1jWe6bg+5LMsxQI8JBCrQo+Oag+ZIMM9SIcJDCUvpLRk0eLmGWstDDwUvWIFoUPHNwBdPDDEU8vGUNOUt/yajHw4gWSuOgiYPXrCFk8BxzMKGFKdlQJcJCgUo/tw7S11YBtNpDlwALBW46txwsEzj4CcoEWCgw38IrD+NZ2NqENgEWCmweOeVhjCMlENAmwEKBzSOnHIy1oFQa+ni4sfqxeeSTh9kstFRCHw931gAqwF3yMJqF0StQyP9CgeGoHrnY9WSuBRQKsFCgLcihq/RVVQBbR9DIQ0XfADaP/PHQr8bWEXTyUNLXj80jf87SF1UJbB1BJRdvXL2oPHLHxeqWrSMo5WFEQD/a1rxxkQVj6whKeZg43I+2NW9cVMuxdQSt3A+4YPPIGReFqGwdQS0XC/FebB754mK7k1lH0MvFSrwPm0eu+CiLYNYR9HJfjspIYldcXK9ck1Cskb4/quOdzBMX61q2jqCZi/3ZPtyAjlykr6YiyHFBMxd1HH2o8XDEw6gjauGgnIvVeB9qwd3wkWFm4Ap0O0nfIrXRM+qGiwwzgxmhnPssM69lbvhY07JwhXIu9mj7cIiCEz4yzCS4oJ2PO60HZR5O+Hh7oRAO6vlYkXejldkHJ7uca+nvERji4pCSHrSN+uCkGkL6awQGuZ+YTSuzCz7Ws5Q8wICl9H1SGdWoHjh5deFihAFOFuWd9tJfMApwMoWFRSsM8NEe2kP6C0YBHs5hZrAFjPBR5NeNalT7nBz/RBEcTHByv3WiJNw+J+8tDLaACU4qvzvROmqel0uUwRawwclLWCfuROuc1EHQKwMjvG8esWK3zkm9NN0JMMLLyrwLmT3jvJTG0Z0AK5xvHrFkN87HyQl0J8AO75tHJBRs8zHXgu4E2OFlbd6FNbtpTuZakE6AIU5yeF24GU3zMrp3I/1FAqM5qfXrwqLdNCdbR5ydAEO8rM67kNwzzM3FKf1FAhN4eRXrQELBMC9bR/TTwxIv910HEgqGeXlfYe4WLLlI3zB10aFgl5utI9rpYYr0DVMZHQpmuVnCktSCKc5bmXlHM8vL1hEpZtjivBqVkUdWudk64gxY2OLm1mtHzYdVbraOSDHDGDdL9HaN9PeLNG6uS7YvYcxW+p6pi0OZbfKzfiXFDGOcz0Zl1oxNXsZkk2KGOc5no5Lhs8nNdEYuQJjjZuO2nfTXixR+3lSofIM5zhMKbOda5KdEmpFbMMd5QoF70iI/rZQMyoY5fpbprVi7G9RIXzXlUAwNe3bSt01VdK0Z5GftyrFOMMjPOr2V9NeL6fzkuCg7gkF+8nmt2NC1x8/SlckWMGgtfd/URZLZHD9NzFx9MEn6vqmLs9bM8dPEzCq1psP6G4n80vbSN05VnLVmjpsmZsqOallvrk9XyXJ7ohOpIDdjidtJf72YyFElKhdfBc2ivSxmd10QggvxU/nXiuW7MY6uR8qOilv31UnuttztRThK6bUhzWeMn0pUklmlLQbHs+2JCiXMcXfIoZPZGD+VqIxqL+syamAnUaEA30lmOplt8bRs5ZC1gg6jn1PXg/RnNY8kM/RwVIlKLqugKdfFjmCcyXknM0VqpnhatVIHU0oz8bK48tVncd7JzDuDKdKXS0nS36Ubq8lJpiWvgllq3A56kOiz5CJ9uRREKquQlPLkHUEhh+/zNykSt8RTcosrr4zEjhU2CDJ42sJ9xwx7SxwNtmAqahnJTYwEhXSeSj1akG6yw9NgC3Yti8joa79If3a7HE0TaENFoB2e0gk8kkrIuSLIKSRzXnjEdAs7PKUTeBkpYHrF0aMdewSJXC3Y37Gta4endMKNdtpsTeYFQZo/laMRMy24Lszw9XYi/W06kD0QkZxOIgqPoIKrdALXXbYC1wMphTSOxhO3YVPRClfpBNanuZoCnVM0DqZxXoxKrs8KV+kEYkKuIs8luhSSOC9G5aowwlc6gZM7Mh2K/AzUHiVxXoxKnskIX9chl12mQlva/A4pygRktVjEG+FrD5NnUZ5STyUWCkkKfftKkWYywlf9G23MeYoVHLB3nML3ZFQKxY2Qvk7KorQhT7GuqaP0X2KSrxe0NzSUmuDpKOYbMSFTwcIXehQSXMt9/xpxd5rg7BBYtrGzFHwmMd0mga/k3hum4JngrHVS+uu0rWRdMptHCZzHBCpATHCW1ZL+Om0rOuaEzaPpXM2ZeUcxqgW+OtYYd5Sn6KKRjYLpfDULvSEmWODsxYSLLkvRMSdX6b/GIOcxgWW8Bc42MIkJOcouGlmzJSj6C+gj/fViBGcF0cSEHIXfUqkBm67sL6AOxagGODvZif2KHIXrknkATFf2F1CHS0I/b0O3KHbLUXgjkSTzdK4G17/j/tTPWYqZay5L4S5afozpnO3lvuKS0M9ZiplrLkvhBxI/xnTOYwL5Pv28XYI8hnIUvhpI7kznfOARMUE/ZylmYkKWwjGBB8B03hbuL6hPVs9bipm6hizEBHHOYwINCup5SzETE7IQE8R5jwmcoKCduyuQmJCDfII4d3fkC25Q7dxltLjkclB3JM77wCPOxtXO2aBsYkKewmdpEBOm8x4TuCaUczYo+0ZMyFN442Ih/fcYREyAKH8XIDEhR8HTmPkx0vi7JZ+RY1LO2VnMNx5DeZiLKs57TKAWTbmz9BVSHDEhQ1N2ncCBzAmICRDlbbIFMSHd4VR6JCfbBAncdZG+kv6C0c/bZAu2KxKVDwg3RmWnKf876CL9/aKXv7IjrrgEzaLO0H5aVlNU+SkU4a1NNYd7l9JfqTnN4qlv8b/K/RSkE5KU+wF0YndXNX9lR8SEaS7bp+3D/aJg19pZ+o+zqdwPoBMxQTV/ZUfEhAkO5+c29u2h6FBEto6SlPsBdGK4hWr+yo6ICWM1i+dff7f52ugtNu2EosM0pb5/rWhkVs1f2RExYZzV857R7fg7hqLYeAsGW6Qp9f1rRUxQTfryqIDdymFvdUb7h2+tKfSiQIY5UZmvXy9igmYOy46ICYMOL0uE2/b5Oyu0UGCZkKjM168Xe4qaFZ54pgIxod/lNYe0fU0Fl1kosExIVeLb14yYoJnHI52ICT2a02sG+S0ifBSqUOZ3SFXi29eMmKCZu0PWbjyLerxtGrVGhH8KdDUz6ihZ/pevGytIzRyWohITuqzf3gA6IsLHxyr7V9gxwCBZ9pevnfQXjB7SF0cNxIRWb2mE7ojwUWBTkb6kdLnfvXrSXzC6OZyAR0xotXhrROuLCB/ZK8jtTH+XS3lfvQHSXzC6eSxFJSa8aSZHhH//naxu5iU7RxlyvnkTuDr0KjjaRg9iwrNm81Zaul8N/9dWGQWpR276DC7f1J5wi+rlsRSVc1yetEWEcbdkelDYjQg56ERMgByHU1HpnH/UEhGOo9uLUxsaCQl5iAmQ47EUlZjw5z0i7KasotZJKwVCQiZiAuTUOXBRGDHh23tm+XaettGfsn205NCETP5jApOw9JK+NqogJnxqiQj7yY/rw+S3hivp5Vz+YwK3qFou2xMojb9bv28LHpNW7BNTTtzt+TwOpnzGVaKWzxcSJmx9HN4jwqREwqP1hEaFJamEAlxWAz4hJqhFTHCp2b5/Kdv0LZ1m7FJhx61eBDEBYnxefNFjwnux0W2ZV+hxGDU+d7A1GuP4vC0fERPU8nnxxZ7Ee3nf6kneNvqzall6PP8bRIRifN6Wj4gJank8PeEWesLWqqXjpEwl0GHTk1dYnqg2Ksdl19CT6Et5xZxefNJfq5i2nf+0aqNWq3NrZer+xBKhKKe35QNiglpZoy/1kv5apSxaOswKr9Kb9eb698ja7bcbWlKLIyZAjPSlUUnMgsiW+tNR80+TrNZrFge1OH1Ve0BMUEv60qgk4qtr05KYLJBbhoD575i5ERO08tmeEDImtDWWTZ9kARXmv2PmRkzQymtMCPd63NakxiLBKp8TZ54QE7RyecraLV7186Ult8wiwSyvr2oPiAlaee2NiRUTmpYuExYJhhETIMZrTAh1xbFI8Mb/WNRYd6gpLk/evIW64lgk+OP1Ve1BoDvUGK+9MXEGHrUtEjjnzDhiAsR4jQlRGplbh1jHSqZ45Pa2/ENM0Mrlacx30l/sPFYtPQm7gL0Z3hATIEb6yqgmxIOxbYthz3hS+/yPtiAmqCV9ZVQTICa0TTdi38iF2W+X+RETtJK+MqrxX3jTllxm38iFw/z3y+yICUqtpK+Maty/L7cll5fsG7kQoGWNmKCV34tvK/3V1nVoKw44S38qlOF14swjYoJSfmOC70uudd9oIf2pUEiA9gTnN6hhfmOC66a1tn2jXcxjhFzyOl3gETFBKccvJNJfbT1NW70RqQRHArQnEBO0chwT3L42t/WpeU+fBBOgPYGYoJXjmOC1KrN1ZKb/yttQ5r5XJBATlHIcE5w+JltTCWSXXfFbIf6AmKCU42SWywaF1lQC2WVn/FZ+PCAmKOU4meXxmlu1dSUwGNsbx6v3Px7vTxccx4Sl9Hdb3rqlK4GCI38cr97/EBOUchwT/BWjtmaXKTjyx/Nd+YuYoJTnq8/blkrr2yMhwaG25aA7xASlPMcEX8Wozbbtb3SZSA9v7jtFBDFBKc/NMa6el03rgXjUoHoUouzI1+3pifSFUZOnbZXWMaiEBJ9a80buEBOUkr4wanK0OF217jATEnwKUYpKTNBK+sKoaSf95RZDSAjFc5LvDzFBKekLoyovhfuLtpDAKZtuhSg7IiZoJX1hVOXkqdm6vcw8C7eaue8TGcQEpaQvjKp8XHWEhGBilB3dLtLfM9pJXxhVuSg8IiREEyPF7GUV74/0hVGVh8Kj9rpE0suOtTYn+kNMUEr6wqhL+tvNR0iIp7UVxR9igk7O01nmd1gICQHNfJNIISbo5DydZf3hSUgIyPk9+ctLpbg3zq8/44VH7SHB6Zmi+Haa+SaRIv09o53zmGA7ydweElwUU6FbkBQzMUEp5zHB9HQLQkJMQVLMxASlnMcEy8fqtIcE2ysfjDDzLSLlKP09o533mGC3V7I9JHD2snveb8kfvN0o5f0CPEt/wanaJ6HuCAnuBeliJiZo5T0mWL3wOkKC+X4LDLrOfY8IsXpruuc9JhhNZLWHBMM7YRgtxqBs83XifrmPCSbfrJv2U7JpTAjgMPMNIoaYoJT7mGDxOdq0VyNShRpBjLOYb8QEvaSvjNosPkjbQ8JS+mNhDlE61tgIVUv6yqjNYBV0+1PhSMlRCFE61hiBp5b0lVGduUdpe0ig5CgG54OKHxATtJK+MqqztkTt2E9mFmoMl3nvDkHmXtbCkL4yqjPWtdbxTLCYFkGC87x3hyDpbxpdpK+M6my1xnQ0JpBfjiJMOoGYoJb0lVGf9Dc8RdMeEnaGR/lhijjpBF5z1JK+NOozlMvqaEwwlxNBqjjpBFvr91CkL436DPXGdNSmG0uJIF2cdMJV+qtGF+lLoz47LyQdEzFZZccRJ51g6FUtmgAXofRXPFbHvgHJhDjCDDsiJii2l7426jOSUOgoOSKZEEiYYUdc1ooFiAk23ki68st0JgQSZtiRmTe1iALEBBsJhY6jVBhzFEmUsxNuRofYxxAgJpjoou86cZHXqUBWs94WsqS/a3SKEBMMbF121aXb2PdCGadZbwtZ0t81OkUoiNZf33/o2DSgDDWUCC9o32xs6MbUtWfhif4zFLoqgtl0jSTOYAtigmYRYsJNe4V/V7kJO0ehxBlsYWHtHleImKD88IGuqnR2jmIJVInK645iIdJaumerdDWrsXMUTKBKVAt1H2GtpS+OOeykv+U+Xc1qLK+DiVSJSo21YiFiguorsKvyi261YCKUAP7i4tYrRkxQ/MrdmVjUHMdQQYBxlH+kv2x0izGJUW+2tqszQXkOBMXFuBO/6b0hEeEAhTu11ahdbUo7FtfBhKj2+EF7gmbSV8c8TtJfc4fOUmCtHxi1hNo6ohRVM+mrYx5Kd2I6S01YW0cTauuImKBakBkrKrdimmPXxyXBHE2g43RuXN+6BYkJKluZO6sPOUgnnI7zM5yiHVOzIDFB4+ZRZxkqRzCHE2n+3Y1SVN1CDDxS2crcdM4yYLc1nFhbR/onFYcWJCYoHLDSuVvAHRNPrK0jSlFVixIT1G3Rd09GVpn7QE3Bto4UzxVAlOEW+jaPuneOeImKJ9bWEd03ukWJCdo2j7o3C6jTiydIpccPLnHVwvTK6No86t450lghhbrC3ITfqKvTTfr6mIuqzaPunSPul4BCzTq6UYqqnfT1MRtNm0fdO0e6ljOYRahZR2TM1AuzlanoadtzGjvLhHiibR0puhPRJkxM0LN51D3niHa1iEKdsHbjIldvK32FzEbN5lH3M4BjEyLqfkXwibIj5aI0relZsvaU//IGFVCYcvAf7I8qF6jmQclLeHdGkWVCRHFW6t+kv3AMCPSWomNoRM/CjGVCQD11yT5RdqRd51lf/qhoBzt0PwJYJkQUbK6Fnj1cdJK+RGakYSOzp86LZUJEYQr/fnCZqyd9icxIweytntYElgkRRWtOoOzIgEDvKfInE/RtHjNBOKJozQlqSj3QLVBMkD8Htu8JoGFnC3OL1pygqHcUXeI0KMint/oS+tKfDRJ69hKdouxIv0ANCuLvKH1rMpYJEcU6dPOOFLN+gRoUpFsU+soOVRTKYmbxMsx6RsygU6AGBeGFa293EtUYEUXauP3GetgA6YtkVpJXZN8DgF3WkMJlmJlsYUKo61Kw4LN3n0DH3A3MK1wPMy8/NkQqRpVsUej7nuU7JyAg1K33hS4cC2J1zYi9kPfm8hV0WGN2ATPMLIhNiJXnElu79m3RMdYipHBTsm+kmG0IVYwqdlH2Rl761SIKNyX7Jt8hhFGCrWBlNjT7739eniIKmGEmxWyE9HUyL5k3ld5tAm6UkEIV/H2ji9mG7sMgXZLIcvWvxWjtjCjYnu0XLnUbgs1cWQp8xb1FhxSihhSwEJVdUitiFR5JjJHofyVkPR1RsDTeF15/jIiW65q/yqd/55h3p4giFqIy6dGKcBubcz+E+4Mu90lEzUzXui70ZlohfaXMbebNmqZ/mUDaLaJoG7ZfmP5rRbSiuJnbhvtvf7ZYQwrYr3ZjKKodwQqPZi5HHWhXJcMcUbQc3hcaccwIt46d9d18IJlIhjmiaEvzLwxFNSPeQeEz7uEP1BySYY4o5jKB1JkdoY7f/DTjInZgmcDs4IhC9qvdboz/tUP6WpnfbAUQA4W+zImMKFz19xeJCQJIFO+1Zba+tYGvlinZEcW73z5xsRsSsKdyptTu0Bvhap6PAU2CLhPYJ7XkJH21zG+md5aBmbM0J0QUrvb7GyV2hkR8cZnlAh2qL6E5IaCQ0+9uvADZEnH4yiy10kNl6Lw5BRRwp/YT6QRTArbQzDHgYmiZQCFGQFGXCaQTbIm4wznDvs1QqGVMZEBRlwksim0JN93iNsdCYfBbpYcnnrDLBNIJtkRMMldfKAwMv2OuRUhhlwmkE2yJmGSuvlAYXCawwRpP2GUCV7s1AZPMtRcKg8sEto4CCrtM4Gq3JmKSufJCYXCZwNZRPHGXCdTYWRMxyVx3oTC8TGAxHU/Id69PnJ1gTcgkc9WFwnCUZTEdTszb7BNnJ5gjfcnIqLdQGN4kYOsonqADUe+kv3pMNjCszal6C4XhXCJbR+EEXiZwFLM9Qeshau1yjsglsnUUTuBlAi379gQ9IbZWw/1wiGXrKJx4557/4aAQe+KdyfylTnfliGUCW0fhhGwC+sIZsxYNlk46VWWhMGInjq2jaKIuxe8YbGFR1L3OGsmvEcsEWniiGW5YcYxVsUUxu9b+WZf/LkcsE8i5RRP2BrtjVWxR2Dq58guFMQMMGCYfTOhlAqtim6SvGzHFOyxHLBO4SaIJWuz9hVWxTTG71m7lD/sYs0xg+kswcYff3VGJatNZ+sIRU/gtZswbITdJMFFLOD5xxJpRcTtqyk64GPNGSLl2MGGzdZ+oRC2jWS82m/1+/44o+rYAACAASURBVNvostzvr5vNutobZsiz1r4U3ckZs0zgJgkmcLvajZmoBaxP276l5vK6qVA/GTihULQKaNTGMTdJLKfaF7Bu0l+/bc3lPG7ncV8+LsRNKJSsRx1VX0K5diih61AZ7ZVjdZqUidpty75uxk0oFGxcG7VM4CaJJXQdKk3MyVbnhD3H3bngrkfghEK5yohRtz/l2qFEnS/5g1VxisMmOQl1LbeHFDihUOrEtXFl6DQxhxK6DpX+zCSXvItmXyoqBE4o3HZlntOjlgmUa4cSeR7qHaviqZr0JcKvbZnVWeSEQpny0HHLBJqYIwmeYGZVPFWz6btilvsvg1/7rkgsjpxQKJNmHpdMpBI1ksir7zu2jibpiAj762bx2pu2Wi82154N/32JaBw5oVBiR2fkUJv8fwhmRE8ws3U0RVtE2J8XvY3K69O1Y2GxK/D2GfuVJj/NPG6ZQCVqJKHfs+7YOhpv8fpwX45sQ1t3VK3mb1OHTijkp5lH7r3x4hRI8A5mCiomWL0kCa6LKXni1blttXDNTjXPcpWolfsCP/IkLV6c4gifYKagYqzmeZdmWkD4smjJPC9zg0LwSuq87beR9z8vToFcK1+x+jEVfpz14+bPcZP44rh+f4IvM3+B4CvdY1ZMHblMYCZqHLFHZN/xBjTO48NjnzMMZP2WwNrlBYXoRRI5C92x2wRUoobRxB6RfcfW0RiHhwd5dgvy6fVBlBkUom9/ZvweY9tVmf4SRuw6vk9sHY1w+XvslhhKcXjdQMrb/wg+wTGnwWbkOyEtPGGwc8TVPsbfvtGy0Jii123srERz9Nks6U0KY7+5QsP2oF/41gTqrkdoft/Dd+WGiq9fNnxyDoiJPd7iLnWxO/YBUOWIPCg0subANequhzS/D45CU+u+rF6CQk5lS/h3m8SIOnqfIOO3gSXR6zXu2Doa8hsSjoVfFl+DQsYahJebtOXu2M4OBltEEf7t6sbW0aDfkJDfb/zqJShkFB/xdpM04mL018ZdEgQvVze2job8hoQax5O+BIWMPDMl1Sm7R6PrtajNi4F3qxuL4kHfIeFY56nwsp+dnlKIXo16S3mXHzkk+98iJPl3gSnsHN3qvP168v2szR5J1OWlFjK5Wzb2bNQvk8P26OYk3pxiYOfojvbMXt+ThIrWGz17fsHfJf9DAteONlPLJcZPv+TNKQR2ju6Y7NVrXf9bapZlfhBGOU5uLBs/OpCkWwQNO0d3TPbq8/0iWTdwvrycpNa7hm9lvpu2ezQ6L8+UyBCYc3THxd7rq3q99lpqU+QnGZ0v9WzS1KjxKRhW0xEw5+gTI1H7fO0t1H8gPC9ZU0vhWfjepl3Q408iIp0QABOyv1B23ePrzXuGPu/n3aPUNHPwg3W+jd8MnZBQJJ0QAAm5T8y16PP5HlmtCPXRc+1R4ghONo/uxkfU8R0d7LAGQD7uC2viHp8XSeZZNyO9FEUmvpay9r0b2848YZQs6QT/DtGPpfpBc0K3r+f0TFHzOc2c+AyibOLTyHzMhPYkXp38Ixv3hfefHps5v6EiCwU6br6MW9pNWFWRTnCPBuZvNCd0+9ydzzsQc4oiCwU2jz6N+tUmbB+TTnCPMtRvXOs9PjOQ8x2u9bxQSCw9YvPoy5iQOr4QleW0e+OHnHjHEbPdPpcJc04+2xT4adg8+jacAJjyVZFO8G7CC4JzbJN2u79yJ53Skuq5kjRxNjObR1+Gq8WmjBbnPnGOZMIP5v92+1xMzruOen5Kpb2bsnn0bairZEIhKlus3pFM+EWGudu9J3i+BPOn5ysz7ch5No9+DOQApvR8k07wjWTCL15/etw3YebeRn7e+EnbsGDz6Ed/l8KU74l0gm8kE36RYe52f2efPWY+b/ykTSdk8+hXX0ph0m4B6QTXSCb84VLvdt/bTx1PmqxElpnNo199W39Txp2xnnaNM2v/kGHuscs5BDPZc3t9WrqHzaNf3SmZSdMCSSd4xpijB/O1Y9lzf3cQOFmiRC8zm0d/On/CSdsFpBMc47TNB6yIe9y3jgS21l6OUUj632Bg9oOupdakxRR7rI5NaVNxb/bdckuOQidLPD+r0jaPePH509G6NmkLmZcnxziG6oHAbrkd93dtkZj5/NaStnnEZf6gPc886UAt0gl+UZHxiCu9x31kpsiOwfMLbNobKptHj9ryzNO+IdIJbpFffsI5zD22UoeSNiV+JFpwHrXkmacVpJNO8Ir88pO0yQlRHEWqju6er9K0/SvOlX3y/p4/KcNMOsEt8stPWBD3uYlV6j5Xkqa1kEwZ7xbB62prWpMSbTxekXh7wstPn/vgA6F/+vkdP3FgNu8/T14nnk/7eqjPc4r+5WeMOuqzkNtbe0l/piUUuNqfPc/NnriMIvHm04r88hMKUXttxNIJn0M1HiRu8THf4tnT/s+0LYPEpRqUa7hHnlGI2usqmG/Zl/ihmG/x4vF7nPYwIJ3gEiVHryiv67UXHAb1XCeZmPehReHVX4yf2KZEOsElUm4vePfptxdLMb8VkiZu8vEW9Oo3KEx8GjAp0iMW0q+4zvvdBGPCy2Evicej0qLw6nfy0cTUYrEfFnpwe7ySadE1RLSl7/m3SiwQo0XhzXdQmPg4oLfTIery3tCvNkD0UfD8Hpv6QdgvffNVkTpp/B1F2x5RhfqGfrUhojHhufAotRRy0nnDQdyDwtTsO9us7jD47h2VFENEXw9f3vBTO0kov353nT7PgEYeb6hCfUe/2iDRmPAytDP1RZVhLi22UwuySL15Q0howQ7pINEvaVHm5yLL3OZ/Jv7nxdrZUcnEfFIILBOGLSVjwksmILnlnCxzAZRjOMNd0YKxFsP2kjHhpc82OdtNlrkAGv59ISS04Softhft9H75wZL/d8gyZ2MAni/0qrVhmTDCRrRV6eUXSw7iZJmzMQTGFUJCK5YJI5xEY8LL+31yhTxZ5myUbXtCSGjFMmGMteiYm+emtYznEpunuehYc4SQ0I5Do8ZoNMWE9HQ3WeZcBX9VCJs4Iz0MJnqNc5R8Q9wX+81oz8nD7eIHQ446sBYeZyu5k/wy2z3jwcRqOQ8da24QEjrw3jPSQjLx8jLcImMDo+FGyJJ4eAXUISR0YZkw0kFy0E25mMBxUnko0nOCkNCFZcJoS8HnwWtMyKgL4FzmHAyVd4KQ0IllwmgnwUk3rzEh52dj4lcGOtZ8ICR0Ypkw3kHwgfAaE3KiE+WoGZgg7AIhoRvLhAn2cqepvFYLZT2aGHqUjhvGA0JCN5YJUyzkNo9e3+2zYgLlqOlK/aAQREjowVvPJEexyqPXmJC1i0U5ajLOWHOAkNCDZcI0C7Eg+hoT8n651+wExqJjzb4LIaEHtdYTHaWyzGVjAuWoqThjzTx2TvswEHWqhVQYfY0JmQe7MB01EfMirSMk9GKZMNlRKI6+1Y/m/c8xDzINZ6xZR0joxTJhuotQIC0cE17nrGIcEnDGMdilH8uEBHuZjELpmEDfWhI61mxjz7Qf13eKg0zp0duSN/dT0LeWgtptyxpCQr+dWE+ubRuREvW36tHcpxP7qim4ZwxrOE5qAMuERHuJb654TGChkIChqIYdCAkDWCakanYCOwjlY8JJ4qozjqoMu2heHkTzTbLVcf4q9fIxgQEX0wkevoo8Cy73IayCMwgEhbeYkB/TGXAxGSlmq0ifDeNU2RyH/dxvjG8P8PykBguFyQr8kJBAwdEwem8yLa6n9Uezni0p89ZrUyDRzY0yEXeNTQ0dmiOwCM52WK/X83X9vV3VBWICk/AmYiiqSSsKjkagfsKaGjGBhcJE1GVYtGaPdAymWlhTJSawUJiG28Ygaq5HoV3NnCoxgYXCJAxFNYhLfBTa1ex5+xGLxAQWClOQYjaHcRYjsS1qz9uPWGatx1vUBP9Z5CvHfEgljMQx4wa9/YplYgILhSl4mbKFVMJY1KHa07z9ioVyQiwUpqBez5DmKn25mCF1yjwyvB+BUygmcLbOJEtKj6ygK2E8rmqDqsUEDuGcZsdQGBuYeTcedagWXar9jmQUJuIGMoAT1SY4Uodq0fsM02KPJu6eifbcQtqxbzQFpRMmVYwJLBSmkjhTCROwbzQFbTc2vb/Ml9vCYKEwGftHilFvNM38B4ShhPdMcLnHEguF6ag/UmvNQeOTMOzXqJoxgYVCAuqPlOL0wGkYdGTV+wZpwZjAQiHFlptJnwPJ5YlIMFv1/luW3NJmoZBi/kO5MeBEcnkiEsxWtbzJl9y7OHArJSHVrApHbE7He41VLRMoitZDsgmbhlSzIhfebCbjrcas9zbmsjGh4XZKszuV/BmQjgrUBHQw29XyHl+2b4qFQqo9SwUNWCSkoHjOruoxoaGoOxVLBXkHFgkpGJFtWEvyrPB8hcX8V6QbLBWEUW6UZMd1a1hLTChdMMBCIR1LBUkHyo3ScNVa1vKDlv4nWtLYGI2lghhSYYk4g9m0ll+0+L/B21YWqvpEMN0oGa0JlrUdkDnLP4LxlkzQnh1H56TjJca0WWICEy5ynan2nhe55XS0JtjWsmV6LP+vMAov146BYjNaM+8uA6ta21piQo3ZVWTrsu3ZpJ0J20ZZODXBuJb0b42YwISLAthAmgXbRlnYObKuZZFcZcbtaf6L0x82kOqj2igTQy2sa/lRt1X+IW61Evbs1VZFk1ouhlpY15b8rVNJRj1qGVta2KohkZCN8zbNa3tSV6ou5g2sjN2G266KZkMiIRs7R+a1bfNXignUo5ZyJK1QwYKIkI+dI/vaakRrhfrz7FeoWzQ2l7Yg31UAO0cOtG3o1HreUI9aEMnmktZsbBbBzpEDbf2a1Z42HKRQEsnmUogIhbBz5EHbL1vvWcPEgKKICiUQEUph58iDVdtPW++fox61sC13YSYiQjlsZ3rQ+pCu+O9R/10YhalZiAgFMefIhbayo13Ff480c3FEhWREhJKYc+RD23t7lXFHPxh7VN7uTF4hwYWIUBQ7Rz603RZVYwJp5irINk9FP0JhnK3mRNuPW7egjDRzHUSFCZoTEaGwpfRvijKatl+3csAnzVwJXWwjHc5ktUrbceCTE60v7ZVjAmnmavbMQRq25qWkgpP0z4pCWjO+tX9e0sz1HE8Uf/RakFiugQZmN1qn0lXfguC2rIgipG6HDWmEKmhg9qP16Vw9JrQ2T6OYK4mFNmwaVcMF50fr1n79bFFbpxwKYgvpFZVGFdHA7Edr2VHN0RY//y73Z3VbCkH+sESoiTJUR9p7BcT+YRS1XLBYuDuwRKiKMlRPWiuAjnP8y9e5L9yQdls2ehdcapVRAO1J64q67miLbzQpzOR4ilyGtNpyndVGGaorrWVHs8QEjlybzzXoHhKVp3NgGqovrT/yTEUENCnMZ7cNd07u4cSwxVmQTHDl0PojzzTf8MCqfk67c6Cbl4AwG2Za+HJp/ZXnmnnLiIuZHWOEBQLCjEgmONPeOjZbqQq37uzchwUCwqxIJnjTXqU3W0xgxIWE49ltferqTECYl/M3jIDa76D5ahcZcSFjt724e79rLluqjOZGMsGd9h96xg/Aa52Yq6e+hcOJxjQBJBPc6RgwMeMnYPdI0vHsoUKVBYIUkgn+tLeNzTrQit0jYdeT6S3h9YY2FymMOXKo9UCdmdqYf7B7JO64XZjcRlqxYSSKMUcOtb9izRsT2D1SwVpcWG+utDzK2kpfA6ig/beeq2XtG7tHWhy3JvaRmgv7RQpwZoJH7ZMt5o4J7B5psttv1oozh6sT+WQddqaWlRipfbLF7DXHzD3SZrk96WtrWy3OLA/00HeBoICOXZvZf23mHmmkKDCsCQfa0KzmU0fVxvxPAm54rY7XzUUyx3C4bK7sLepDs5pTHTuz828Usnuk2/JfZJj7TWFNNNBrqTjlhAxNxw8u8FE6MhvQ5Lg/b9b1Q8O/YHDek0jWjGY1rzomW0jEhK5tLOiz2183/2JD6TfFZr3ebPbsIlrgYSIK2nSkmOdtWfvW8GJoznG/32xO63XOS+P6HgnO+z2bh4aQX3Zr2/6Li8SEzkULTNjv76uHzeayvuvKSK0+/7+n+3/w33+BbIFN9C/71XFPnmU+De3MgAHklx3r+M3nbmP+wWsjoB79y4517dZI7RZSkAqoR8mRY13dw2LNq+2nOQBQg/nYnrUfniA5yISCVEA1oWQj5tFVCi6XQqIgFdCMkRa+df3ugh+J83UAvSg58q3r+buT/FBMSAW0ouTIua6MrkzL2g9mGwBKUXLkXFeKWTYmNBSkAipRcuRd1xu5cGUBMy4AjaR6WTGbrhdy6Z+eGReAPkw5cu/Q9duLDz0kpQBos5R+LKC6zlNsxM/gJaUAKEMVagCdWzTiMYGUAqALVagRdO7QKHghoEsBUISzNkPo3KCR/mB3DD4C9OCszQiarp9ftI35B4OPADVoTAihc89etmXtx4o8M6ADs1Bj6Ewx64gJnKUA6EBjQhCdO/ZaXgq2c172ANopeUlEdZ0b9tJtzL84nhkQR2NCGJ3XgHgb8w+OZwakERLC6G4Lk29Z+0HrGiCLxoQ4urvC9MQEWtcAUYSEQLozuJrWiuSZATmEhEi6E7jSn+xRQ54ZEEOvWiTd14H0J3tCnhmQQkiIZNV5HSirRu7+oABqIiSE0t0lrCwm0M8MiNDSvIp5nDuvBHWN7OSZgfmpexCgru7jLdW0Mf/iKE5gboSEaLpTt/piAsVHwMwICdEcui8GhadnMDcbmNVV+p7H3HqmRihqY/7FkAtgRgw5iqfz8ITbTWXnIsVHwGwICQH1HHcs/dHaUXwEzISQEFFP1lb6o3XoiWIAyiEkhNR9QRylP1oHio+AORASQurJ2WprY/7VUHwEVEdIiKknZas2JlCRClRHSAiqp+xI8ZCTy3x3BhASISGqnmkR+tqY/1CRCtS0IyREdey+KjTHhJ7JfQBycaxaWE3PZaGxjfkPbQpALYSEuPpGReiOCX2NFQAyEBICO/VcGMqvC9oUgCpIL0fWty0v/dmGND25EACJCAmh9R1SI/3ZBtGmABRHSIit56mqdbTFA4ICUBghIbiea0NvG/MfeteAoggJwfWVHVmICfSuASUREqLre6TaOIaVoAAUQ0gIr2fake425j80NAOFEBLQdzyNkZhAQzNQxpWQgL62r4v0hxuLoAAUYGO3GHX1XSHKR1s8ICgA2QgJ+Pg49F0idmICUy6AXIQEfPSXot4M7S0SFIA8ik/Qwoz6JuDpH23xgKAA5FhI38LQoa8U1VRMICgAGQgJ+NJXimpg3NEjggKQaEdIwLe+qagmRls8YHI2kIQTdPCr70KxFhMYkgqkICTgT9+VYq80jaAATLYkJODXqu9SsTLa4gFBAZiIEUd40Hv6gMGYQFAAptkTEvCgtxT1JP3pUhAUgAns7RCjqr6yI0OjLR4RFIDRCAl41lu9aTMmEBSAsWhLwIve68VoTCAoAKPQqYZXvRPwbI22eERQAIbRloA3/UcZS3+6dAQFYAhtCXjXW3ZkOCZ8rBhzAfSiLQEtesuOjI3Ae8ZAPKDPlpCAFr1v0+bGHT0hKADdOEAHrXqvGtsxgaAAdKLgCK16px1ZjwkEBaDdzmqZOWrrnXZkctzRE4IC0OJIwRE69JcdmY8JHx/bmW4ywA4KjtCp7+BNFzGBoAC8YMIRuvWWotoci/qKoAA8cnFbo5b+i8dHHqp/fwwIZXeRviGhWdN/+fiICQPzO4BAyC6jV/8EPC8xgaAAfCG7jH6n/gvIzSvFmol4ANllDBrYapf+eOUwJhWgdxmD+suOHMUExqQiPA5LwLCBNl/pj1cSLc2IbXmQvgdhQP9FtJP+eEU1A4siwDMmY2OEQ/9VZH0E3iu61xAWjWoYY6AU1VtMoHsNQTEGFeMM1O27iwk0KiAkUgkYaeC92V9MoFEBAdGVgLH6p6K6vJRoVEAwO7oSMNpAJY6HUdlvqElFKAw4wgQD78wuY8JHM7A6Ahy5UoKKCQYuJ58x4ePjPMvNCMjzeg+jjlXU64nyI4RACSqmGWhPcDwxi/IjBLBn3wjTDEzKdnN8QosVmWZ453adj2qG2nodxwSmH8E59o0w3VABju+LikwzHGPfCAmGXpV9xwQyzfCLfSOkGDpmxnlMoKcZTrFvhDRDV5b7wVn0NMMj9o2Qphm6tKQ/4Aw4UgHucFQCEg21J0SICSQV4AzzjZCMmHBHUgGecMQm0g2eOib9AedBUgFuMBcbOYgJ3+hUgA+cp4Ysg/lV6Q84mwX7R3CApgTkGZzuIP0B58P4I5hHchm5hmLCTvoDzoiDdmDcmeQycg1dZHvpDziroSGxgGK7i/QNBAeGLrNYMeFjNTTqA9CKEzZRwGAbc7CYwP4RjNrRuYwSBlvWosWEEdW5gD57KlBRBDHhHftHsIZFAkoZnPQTMCawfwRjWCSgmMGNkogxgfojmEKbGsohJrSjfw1WLGlTQ0GDU36CxoSPhkMVYAGZBJQ1ONoiakz4+Lgw/wjqkUlAYcSEbofBLwcQxSIBxRET+tCqAM1YJKC8wf2R0DGBVgXoxdE5qGHwwosdEz4ajtqBTkw3QhWDV17wmECqGSodGYGKOgavvfAxga5m6MM5CahkNXjxERNYKkAZutRQzeAIPGLCHVWp0IMCVFRETBjpxFIBOlwpQEVFwzFhKf0RlWCpAA3ILaOu4Zhwk/6IarBUgLgNuWXUNaJRV/oj6sFSAbLoW0Z1xIRJTv+3/n0PtKNvGTMgJkzz/+vf+UArWhIwB2LCJIf6dz7Qhm0jzIOYMAnDjyCCaiPMZURMWEt/RkWYkgoJVBthNiMOmCQm/LrUv/uBVzSpYUYjqiuJCb84ohmzW3IDYk7EhAma+g8A4An1p5jZiJiwkf6MaizqPwKARyQSMDdiwgTL+s8A4A+JBMyPmDDe8FkTQDl7dm0hYERMOEt/Ri3IMGM+RxIJEDEiJnCAwjfGomIuO1bnEEJMGI0MM+ZCahliRsQEDtX5wqBszGNLahlyxjzopD+jDoy/wyz2K+lLHaERE8Zi/B1mQLERhI2JCaxk/2nIMKM6xp9C3JiYwJvLBxlm1Ef5KRQgJoxEDzPqIiJAhTEx4ST9IRWghxlV0ZAAJcbEBK5WephR1Y6GBGgxJiZspT+kPKZkox4iAhQZExNoZB5zRCmQhIgAVcbEBBqZOYcZlRARoMyogQ3SH1IchaiogogAda5jrlzpDymOUUeogIgAhUZtlEdvUKAQFeUdT0QEKDQqJkRvuM8oRP1/6f9VeEaHGpQaFROCNyjkTET97w1zkvCGiAC1RsWE4KdvZhSiHj8+GqICnu2jL7yh2ajnXewGhZyJqJ+vg0QFPGAaNlQ7jbmKj9KfUlRGIerPF0dUwDfOUINy61EXsvSnFJXRr/a3a0xUwO22OxMRoN24mBD5NMCMZcLuqdhwQTN0bEfaEWDAuJgQOSeW0a/2Wq9FVAhsSakRTBgXEwIXo477glrt3l8LFxzNE9OVxDKsGHVFB56WXXCZ8GnNnIxwdiSWYcioizpuMWrZZcLX/yTn84TCDAvYMu66lv6UYjKe390bbgeiQhj0p8GacWnPqGvfjLEWXcuET5SmhsCmEQwat70d9WWnyjLhU0MRknfHBZtGMGhcTAhaeFRrmfDlQrrZsS2VRrBp3JvwVfpjyqi3TPhCYsGp44ZNI1g1buhnzIlHdZcJn5oNW0juXKNutcKFkYOgQ+6M1l4mfFmwheQJSwQYN7IAP+Lm6AzLhO9/aEsVkhMsEWDeyJgQMcmcsUw4TfynmhNbSPaxRIAHI1+GAyaZM5YJKekX2puNo9AIToy74AMmmTOe0WkjMFks2LWkFwFujNzKDrcqXqU/INIDKIsFi44clQNPRla9hMudZVQD5UzKZ7FgzG4b7taAc9dxl/5Z+nPOLGMgau4U2RVlSGZc2TOCOyMbFJbSn3NmGcuE/FxjQ8+CBcsTe0Zw6DTyBpD+nPO6pD8pyhw2caDBWTeSCPBq7CZJrEq7jAfyqtRnYA9JreO52K8MaDO2DD9U19oi/XFR9JzSy8hsD2ZEVhnOjbwTIp2/2aS/oO8K7yiQWtCFgAD/liPvhkAFFiPz7m0qLKcOp7E/EeoiICCEsdsTcW6HQ8YyoU7kJCzIIyAgirEvxXE6FGafajEGYUESSWUEMrbsMkyHQka7Wt2xUIQFGUsCAkIZPdgnSj22aLvaAMLC3PY0piGcsXdHvX0RVTLqUGepzTqcKFCdyW7L6ApENPbNM8YZChl1qLOtpJoF7WzVHc+x2jSBX6NfO6U/6Cx01aF2u5wZflHPlR0jBDb6KRihFm+2Q5gLWJFcqOF4jnChA91G19kUHduglNCxCanYRSprxwIB+GhG3zDSn7Q+8XmoCVYblgtFLDdkEIC70RvT7tfUOQlmyRr25rIlu5Bleb5QYgR8G51kdr95dE5/qIi3eR9OV7aRkhy3CzaMgAejk8zeN48yOphnTzC3Wp2YojoN8QB4N/5R6HzzKGNfXk9D33pDXBiHeAC0G51kdr55lNGaoOx0CeLCEPIHQI/R78c6dkgqGT34qYXCIWkr8gvtdnvqi4B+44dD69kiKS9j50g8wdzhsNhSp/pouV0oDN+ANuPHvinbIynplP6kOWpePjXrzZ4Fw78f6cryABhpwkAHt0m5VcZzU3/qfbU4B84w7Pabi9sLF6hhfMPTrHPe5pSxx2JlYOz6FG8niXAApBifUKh7kpicjJojW4n39SnKimF53axN/TSAHhPOkfGZZc6pOTpJf/jpVgvXOYbd/rwgdwBkmJBQcJllbjL2VMx+Ic36tPW2ZPgXDU4sDoB8EyaoedydzZhztDP+fRzWGxeR4Ug0AAoan1Dw2MucMefISdL935phszc6WnW/3VzYKQLKmnJugLuXsZwJ2UvpD1/Uar05763UJu0IPyF9sgAABmJJREFUBkA140ceeXkzfpCzdeKyK/awXmyuapPQu/11c1q7/OIBPSY8F23VXg7LaGD2Fx+f3GPDea8k27Db78+bxdp4+gawYsqD0deDMKcM1dfOUbfV+rL5t3IQiA7/IsF2s1kTCoCZTahG9dW31uRkVuNtYDTre3j4t3iouLW03O+vm81pzf4QIGjKo9FT39rog0db+FowTfcvQNwjxOcSYp9atrS7/3f39/+VxZr1AKDGlBJ9RwuFjJkWdrvVqlr/+IwW7xa//wFneSnAl0nb6m5ekHM6E6x3qwFAjylLfy+lR4ecTXGDc44AYKxJ8x2cLBRy2rOsTMgGgBSTNo987JtMmOjx/g04WSoBQLtJdSMeph7lNKvdGKoAwLdpw0HtPxNz8su3s/SnB4C6pjX0mi/EzDmAOUwDM4DApmVcjTeu5Ryjc9vRYQvAvWn768aTrFkToY3HQwAYYcrA7JvxNHNOyRFlqABCmDj7x3CaOWekxe1oe4UEAONMOW3N9LNxkRMSAk5DBRDTxNGWVgsyJ8a+FyQTAAQxdUvlIv2Bk2RVodpOowDABFNO1rkzWXuUFxKWFv9kAEgytRzHYOdaXkigMwFAIJPnPZgbGJ3Vq2Z1twwA0kx+YhorSM0MCVaz6gCQZHKVpq2UQmZIMLhVBgA5Jp+0bmkcXGZIsNuQAQBppnf42inOzAwJ5JcBhNNML8uxkmfODAk0qwEIKGEUkI2HZW5IcHIGNQBMMXE66p2JTZXckMAwVAAhJYyRNhAU8lrV6F8GENXUARcmgkJuSLBVcgsA5aScN6M8KKxzQ4LuPw8A6kkoPbrdjgfpj90j77yEm5UsOgDUkHQKmeJX6WkHTRMSAOBR0kJBb1DIOnv5zk5XHgBUkHZcsc6g0OwJCQCQZfLUo6+goHCS9CqzLYEqVABITcqq23i/ZBYcERIA4OMjdcNF2T5L2ibYIxoTAGD6gWs/9oqeoc01PySozJEAwMySi3WOap6iq7SsCCEBAF6l1aN+UjI7O7sr4R9CAgB8ynikXhXsHxXYN1KYMgcAKRlFnMe19IfPHXBESACAJ6ucx+lZdKnQnAtEBEICADzIKuSUXCqs85PLhAQAeNbkPVq3QkuFMosEQgIAPEtuUviyEylAKrNIICQAwKvcN+7l7BtIhxLlRjdCAgC8y9w9+mc/71E7mxLlRjdCAgC0yao9+rKdLypcymwbERIAoF3+ELnZosI6+6CEH4QEAGhX5EG7rT8jolQi4UZIAIBOhzI79Pu6x+0css/X/KXxYCAA0OJS6Fl7PFXrVygYEZiECgC9yrSA3W2rvIKXyyPcCAkAMCT7ROM/x3PhZ26zKFVr9Gk5b+ksANiTcZRCi5Jh4XAu+tE4exkAhhXoUnhyPJfYRGoWBRcwnzSc+wAA6i0KP3zvz99T1nKhWZSrPf2xLfV1AYBvBQt7/uxS48KhQkCgLQEARiu9TfNrv7lMyus2l3OVz0JbAgCM1lQLCnf782k9Yi//UCke/HOkBhUAxluVrfBps79uTuv26drN+nTeV/wEFBwBwCQzBIWfB/R+v9lsFuu7xWaz3Vddo9yRXQaAiTJPXVOM7DIATFahIlUDxlkAQAqXQYFUAgCkcRgUztLfKQCY5S0o0JUAABl8BQXGoAJAlvVsJan1baS/TACwbr4+hcp27e1xAIAJVtVbyGbBYGwAKKHu7KN57OhTA4BCqozOntOe5DIAFGO7/Gh3kv7+AMAVy5lmFgkAUFizl360JyKTAAAVbKSf7km2lBsBQA2ro/QDfrIjPQkAUElzln7GT7OjcRkAKlpbWipcyS0DQFV2lgpLto0AoDoboy6OVBsBwCxO6nsVdhuqjQBgJto3kIgIADCng+IOti2pZQCY2VppVCAiAIAEjVGBiAAAUpRFhd2GiAAAghRFhSOZZQCQttJx3s6SfgQA0OCwER94saVnGQDUWEhuIR1JIwCALmKLhe1F+k8HALxbb2efebE8kVcGAK0uc4YF9owAQLvLdpZNpON5Jf2XAgBGWG0qj9NenggIAGBHczlXigu764ItIwAwp0Jc2G9oRAAAu9aba6H8AvEAADxo1qfzPqcg6bg9EQ8AwJNmvdhcJ/c77/+FA3oQAMCr1b/YsNnv+xcOx/1+u9msySYDQByr9ad/QeLu8vV/EQgA4Mv/Ar+mDb7rm83eAAAAAElFTkSuQmCC';
    const scrib_logo =  'data:image/png;base64,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';
     // Tamaño original y cálculo para logos
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

    function emitirPdfMusas(playerId, nombre, documento) {
        if (!emitirMusas || !documento) return;
        try {
            const dataUri = documento.output('datauristring');
            if (dataUri) {
                socket.emit('regalo_pdf_musas', {
                    player: playerId,
                    filename: (nombre || `regalo_j${playerId}`) + '.pdf',
                    data: dataUri
                });
            }
        } catch (error) {
            console.error("Error al generar PDF para musas:", error);
        }
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

    function obtenerContenidoExportable(playerId) {
        const esJ2 = playerId === 2;
        const textoEl = esJ2 ? texto2 : texto1;
        const guardado = esJ2 ? texto_guardado2 : texto_guardado1;
        const htmlActual = textoEl && typeof textoEl.innerHTML === "string" ? textoEl.innerHTML : "";
        const textoPlanoActual = textoEl && typeof textoEl.innerText === "string"
            ? String(textoEl.innerText || "").trim()
            : "";
        const textoPlanoGuardado = typeof guardado === "string" ? guardado.trim() : "";
        const textoPlano = textoPlanoActual || textoPlanoGuardado;
        const html = extraerTextoPlanoDesdeHtmlControl(htmlActual).length > 0
            ? htmlActual
            : convertirTextoPlanoAHtmlControl(textoPlano);
        return { html, textoPlano };
    }

    const contenidoJ1 = obtenerContenidoExportable(1);
    const contenidoJ2 = obtenerContenidoExportable(2);

    agregarPaginaTexto();

    let yActual = dibujarNombreEnPagina(val_nombre1, margen, margen + 13, 25, accentColor, [255, 107, 107]);

    const segmentos1 = construirSegmentosColor(contenidoJ1.html || "");
    if (segmentos1.length) {
        yActual = agregarSegmentosEnPagina(doc, segmentos1, margen, yActual + 5, 15, agregarPaginaTexto, margen, anchoPagina, altoPagina);
    } else {
        yActual = agregarTextoEnPagina(contenidoJ1.textoPlano, margen, yActual + 5, 15, [230, 230, 230]);
    }

    const palabrasBenditas1 = extraerPalabrasConClase(contenidoJ1.html || "", ["palabra-bendita", "palabra-bendita-musa"]);
    agregarPaginaEstadisticas(doc, 1, val_nombre1, agregarLogoEnPagina, margen, anchoPagina, altoPagina, headerRightX, palabrasBenditas1);
    emitirPdfMusas(1, val_nombre1, doc);
    // Descargar el primer PDF y TXT
    if (descargar) {
        doc.save(val_nombre1 + '.pdf');
    }
    // Combina el nombre del escritor y el contenido HTML
    console.log("ES ES FINAAAL", val_nombre1 + "\n" + texto_guardado1);
    if (descargar) {
        downloadTxtFile(val_nombre1 + '.txt', val_nombre1 + "\n" + contenidoJ1.textoPlano);
    }
    // Preparar el segundo documento
    doc = new jsPDF();
    prepararFuentePdf(doc);
    accentColor = [255, 107, 107];
    agregarPaginaTexto();

    yActual = dibujarNombreEnPagina(val_nombre2, margen, margen + 13, 25, accentColor, [70, 240, 255]);

    const segmentos2 = construirSegmentosColor(contenidoJ2.html || "");
    if (segmentos2.length) {
        yActual = agregarSegmentosEnPagina(doc, segmentos2, margen, yActual + 5, 15, agregarPaginaTexto, margen, anchoPagina, altoPagina);
    } else {
        yActual = agregarTextoEnPagina(contenidoJ2.textoPlano, margen, yActual + 5, 15, [230, 230, 230]);
    }

    const palabrasBenditas2 = extraerPalabrasConClase(contenidoJ2.html || "", ["palabra-bendita", "palabra-bendita-musa"]);
    agregarPaginaEstadisticas(doc, 2, val_nombre2, agregarLogoEnPagina, margen, anchoPagina, altoPagina, headerRightX, palabrasBenditas2);
    emitirPdfMusas(2, val_nombre2, doc);
    // Descargar el segundo PDF y TXT
    if (descargar) {
        doc.save(val_nombre2 + '.pdf');
    }
    // Combina el nombre del escritor y el contenido HTML
    if (descargar) {
        downloadTxtFile(val_nombre2 + '.txt', val_nombre2 + "\n" + contenidoJ2.textoPlano);
    }
}

window.emitirRegaloMusas = function emitirRegaloMusas() {
    descargar_textos({ descargar: false, emitirMusas: true });
};

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
    },

    "letra bendita": function (data) {
    },

    "texto borroso": function (data) {
    },

    "psicodélico": function (data) {
    },

    'tertulia': function (socket) {
    },

    'palabras prohibidas': function (data) {
    },

    'ortografía perfecta': function (data) {
    },


    'frase final': function (data) {
    },

    "": function (data) { },
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
    },

    "letra prohibida": function (data) {
    },

    "letra bendita": function (data) {
    },

    "borroso": function (data) {
    },

    "psicodélico": function (data) {
    },

    "inverso": function (data) {
    },

    "tiempo_borrado_más": function (data){ },
    
    "tertulia": function (data) { },

    "palabras prohibidas": function (data) {
    },

    "ortografía perfecta": function (data) {
    },

    "frase final": function (data) { },

    "": function (data) { },
};







