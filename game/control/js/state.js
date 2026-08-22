// Se establece la conexion con el servidor segun si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl, { autoConnect: false });
  
const getEl = id => document.getElementById(id);
const tJuego2P = (clave, variables = {}, fallback = "") => (
    (window && typeof window.scribT2P === "function")
        ? window.scribT2P(clave, variables, fallback)
        : (fallback || clave)
);

function extraerNumeroMarcadorControl(valor) {
    const match = String(valor ?? "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
}

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
let explicacion = getEl("explicaci\u00F3n");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tiempo1 = getEl("tiempo1");
let tiempo_modos_secs = getEl("tiempo_modos_secs");
let display_modo = getEl("display_modo");
let tema = getEl("temas");
let boton_pausar_reanudar = getEl("boton_pausar_reanudar");
let boton_vista_calentamiento = getEl("boton_vista_calentamiento");
let forzar_solicitud_calentamiento_default_pendiente = false;
const timeout_marcador_control = new WeakMap();
const estadoServidorDot = getEl("estado_servidor");
const estadoServidorTexto = getEl("estado_servidor_texto");
const estadoPlayer1Dot = getEl("estado_player_1");
const estadoPlayer2Dot = getEl("estado_player_2");
const estadoPlayer1Label = getEl("estado_player_1_label");
const estadoPlayer2Label = getEl("estado_player_2_label");
const estadoPlayer1Texto = getEl("estado_player_1_texto");
const estadoPlayer2Texto = getEl("estado_player_2_texto");
const estadoEspectadorDot = getEl("estado_espectador");
const estadoEspectadorTexto = getEl("estado_espectador_texto");
const estadoActor1Dot = getEl("estado_actor_1");
const estadoActor1Texto = getEl("estado_actor_1_texto");
const estadoActor2Dot = getEl("estado_actor_2");
const estadoActor2Texto = getEl("estado_actor_2_texto");
const botonesReinicioRemotoControl = {
    escritxr1: getEl("boton_reiniciar_escritxr_1"),
    escritxr2: getEl("boton_reiniciar_escritxr_2"),
    espectador: getEl("boton_reiniciar_espectador"),
    actorxs1: getEl("boton_reiniciar_actorxs_1"),
    actorxs2: getEl("boton_reiniciar_actorxs_2")
};
const estadoRolesRemotosControl = {
    escritxr1: false,
    escritxr2: false,
    espectador: false,
    actorxs1: false,
    actorxs2: false
};

const formatearPuntosMarcadorControl = (valor) => {
    const texto = String(valor ?? "").trim();
    if (!texto) return tJuego2P("score.words_count", { count: 0 }, "0 palabras");
    if (/^-?\d+(?:\.\d+)?$/.test(texto)) {
        return tJuego2P("score.words_count", { count: texto }, `${texto} palabras`);
    }
    return texto;
};

const formatearMusasMarcadorControl = (valor) => {
    const texto = String(valor ?? "").trim();
    if (!texto) return tJuego2P("score.muses_count", { count: 0 }, "0 musas");
    if (/^-?\d+(?:\.\d+)?$/.test(texto)) {
        return tJuego2P("score.muses_count", { count: texto }, `${texto} musas`);
    }
    return texto;
};

const esMarcadorCompactoControl = (elemento) => (
    Boolean(elemento && typeof elemento.closest === "function" && elemento.closest(".writer-header-stats"))
);

const formatearNumeroMarcadorCompactoControl = (valor) => {
    const numero = extraerNumeroMarcadorControl(valor);
    return numero === null ? "0" : String(numero);
};

const formatearPuntosMarcadorCompactoControl = (valor) => (
    formatearPuntosMarcadorControl(formatearNumeroMarcadorCompactoControl(valor))
);

const formatearMusasMarcadorCompactoControl = (valor) => (
    formatearMusasMarcadorControl(formatearNumeroMarcadorCompactoControl(valor))
);

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

const setEstadoTextoConexion = (el, conectado, textoActivo = "CONECTADO") => {
    if (!el) return;
    el.textContent = conectado
        ? textoActivo
        : tJuego2P("control.connection.disconnected", {}, "DESCONECTADO");
    el.classList.toggle("is-off", !conectado);
};

const setBotonReinicioRemoto = (rol, conectado) => {
    const boton = botonesReinicioRemotoControl[rol];
    estadoRolesRemotosControl[rol] = Boolean(conectado);
    if (!boton) return;
    boton.disabled = !conectado;
    boton.setAttribute("aria-disabled", conectado ? "false" : "true");
    boton.classList.toggle("is-disabled", !conectado);
};

const rolRemotoConectadoControl = (rol) => Boolean(estadoRolesRemotosControl[rol]);
window.rolRemotoConectadoControl = rolRemotoConectadoControl;

const blinkEstadoDot = (el) => {
    if (!el) return;
    el.classList.remove("conexion-dot--ping");
    void el.offsetWidth;
    el.classList.add("conexion-dot--ping");
};

const setEstadoServidor = (conectado) => {
    setEstadoDot(estadoServidorDot, conectado ? "ok" : "off");
    setEstadoTextoConexion(
        estadoServidorTexto,
        conectado,
        tJuego2P("control.connection.active", {}, "ACTIVO")
    );
};

const setEstadoPlayers = (j1, j2) => {
    setEstadoDot(estadoPlayer1Dot, j1 ? "ok" : "off");
    setEstadoDot(estadoPlayer2Dot, j2 ? "ok" : "off");
    setEstadoTextoConexion(estadoPlayer1Texto, j1);
    setEstadoTextoConexion(estadoPlayer2Texto, j2);
    setBotonReinicioRemoto("escritxr1", j1);
    setBotonReinicioRemoto("escritxr2", j2);
};

const setEstadoRolRemoto = (dot, texto, conectado, rol = "") => {
    setEstadoDot(dot, conectado ? "ok" : "off");
    setEstadoTextoConexion(texto, conectado);
    if (rol) {
        setBotonReinicioRemoto(rol, conectado);
    }
};
window.setEstadoRolRemoto = setEstadoRolRemoto;

const actualizarNombresConexiones = () => {
    if (estadoPlayer1Label) {
        estadoPlayer1Label.textContent = (val_nombre1 || "").trim() || tJuego2P("ui.writer_1", {}, "ESCRITXR 1");
    }
    if (estadoPlayer2Label) {
        estadoPlayer2Label.textContent = (val_nombre2 || "").trim() || tJuego2P("ui.writer_2", {}, "ESCRITXR 2");
    }
};

const procesarEstadoConexiones = (estado) => {
    if (!estado || !estado.players) return;
    lastPongTs = Date.now();
    setEstadoServidor(true);
    const conexiones = estado.connections || {};
    const writers = conexiones.writers || {};
    const actors = conexiones.actors || {};
    const j1Conectado = writers[1] && typeof writers[1].connected !== "undefined"
        ? Boolean(writers[1].connected)
        : Boolean(estado.players.j1);
    const j2Conectado = writers[2] && typeof writers[2].connected !== "undefined"
        ? Boolean(writers[2].connected)
        : Boolean(estado.players.j2);
    setEstadoPlayers(j1Conectado, j2Conectado);
    setEstadoRolRemoto(estadoEspectadorDot, estadoEspectadorTexto, Boolean(conexiones.spectator && conexiones.spectator.connected), "espectador");
    setEstadoRolRemoto(estadoActor1Dot, estadoActor1Texto, Boolean(actors[1] && actors[1].connected), "actorxs1");
    setEstadoRolRemoto(estadoActor2Dot, estadoActor2Texto, Boolean(actors[2] && actors[2].connected), "actorxs2");
    blinkEstadoDot(estadoServidorDot);
    if (j1Conectado) blinkEstadoDot(estadoPlayer1Dot);
    if (j2Conectado) blinkEstadoDot(estadoPlayer2Dot);
    if (conexiones.spectator && conexiones.spectator.connected) blinkEstadoDot(estadoEspectadorDot);
    if (actors[1] && actors[1].connected) blinkEstadoDot(estadoActor1Dot);
    if (actors[2] && actors[2].connected) blinkEstadoDot(estadoActor2Dot);
    if (estado.palabras_musas_control && typeof window.sincronizarEstadoPalabrasMusasControl === "function") {
        window.sincronizarEstadoPalabrasMusasControl(estado.palabras_musas_control);
    }
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
            setEstadoRolRemoto(estadoEspectadorDot, estadoEspectadorTexto, false, "espectador");
            setEstadoRolRemoto(estadoActor1Dot, estadoActor1Texto, false, "actorxs1");
            setEstadoRolRemoto(estadoActor2Dot, estadoActor2Texto, false, "actorxs2");
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
    const siguiente = esMarcadorCompactoControl(puntosEl)
        ? formatearPuntosMarcadorCompactoControl(valor)
        : formatearPuntosMarcadorControl(valor);
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
    const siguiente = esMarcadorCompactoControl(musasEl)
        ? formatearMusasMarcadorCompactoControl(valor)
        : formatearMusasMarcadorControl(valor);
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
let escala_espectador_input = document.getElementById('escala_espectador');
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

function obtenerEscalaUiEspectadorParametro() {
    const valor = escala_espectador_input ? escala_espectador_input.valueAsNumber : 100;
    const porcentaje = Number.isFinite(valor) ? valor : 100;
    const limitado = Math.min(128, Math.max(82, porcentaje));
    return limitado / 100;
}

let LIMITE_TIEMPO_INSPIRACION = limite_tiempo_inspiracion_input.valueAsNumber;
let TIEMPO_MODIFICADOR = tiempo_modificador_input.valueAsNumber * 1000;
let TIEMPO_CAMBIO_PALABRAS = tiempo_cambio_palabras_input.valueAsNumber * 1000;
let ESCALA_UI_ESPECTADOR = obtenerEscalaUiEspectadorParametro();
let TIEMPO_VOTACION = tiempo_votacion_input.valueAsNumber * 1000;
let TIEMPO_CAMBIO_LETRA = tiempo_cambio_letra_input.valueAsNumber *1000;
let TIEMPO_MODOS = tiempo_modos_input.valueAsNumber;

let DURACION_TIEMPO_MODOS = TIEMPO_MODOS;
let DURACION_TIEMPO_MUERTO = DURACION_TIEMPO_MODOS * 1000;
let TIEMPO_CAMBIO_MODOS = DURACION_TIEMPO_MODOS - 1;

// Lista de modos disponibles (catalogo fijo para que nunca desaparezcan del panel).
const LISTA_MODOS_DISPONIBLES = ["letra bendita", "letra prohibida", "tertulia", "palabras bonus", "palabras prohibidas", "frase final"];
let LISTA_MODOS = LISTA_MODOS_DISPONIBLES.slice();

// Objeto que asocia cada modo con un color
const COLORES_MODOS = {
    "letra bendita": "#6bff83",
    "letra prohibida": "#ff8fa0",
    "tertulia": "#64e8ff",
    "palabras bonus": "#ffd65a",
    "palabras prohibidas": "#ff71c8",
    "frase final": "#ffad42"
};

// Funcion para generar las casillas de verificacion dentro de <td>
function crearConteoModos(modos) {
    const conteo = new Map();
    (Array.isArray(modos) ? modos : []).forEach((modo) => {
        conteo.set(modo, (conteo.get(modo) || 0) + 1);
    });
    return conteo;
}

// Funcion para generar las casillas de verificacion dentro de <td>
function generarCasillas(modosMarcados = LISTA_MODOS) {
    const tr = document.getElementById('listaModos');
    if (!tr) return;
    tr.innerHTML = '';
    const conteoMarcados = crearConteoModos(modosMarcados);

    LISTA_MODOS_DISPONIBLES.forEach(function(modo, index) {
        // Crear <td> para contener el checkbox y el label
        const td = document.createElement('td');
        td.style.textAlign = 'center'; // Centrar contenido dentro del <td>

        // Crear el checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `modo-${index}`;
        checkbox.name = 'modos';
        checkbox.value = modo;
        const vecesMarcado = conteoMarcados.get(modo) || 0;
        checkbox.checked = vecesMarcado > 0;
        if (vecesMarcado > 0) {
            conteoMarcados.set(modo, vecesMarcado - 1);
        }

        // Crear el label
        const label = document.createElement('label');
        label.htmlFor = `modo-${index}`;
        label.textContent = (window && typeof window.scribTranslateModeName2P === "function")
            ? window.scribTranslateModeName2P(modo)
            : modo.toUpperCase();
        label.style.display = 'block'; // Asegurar que el label se muestre en una nueva linea
        label.style.color = COLORES_MODOS[modo]; // Asignar color al texto del label
        label.style.paddingLeft = "0.2vw";
        label.style.paddingRight = "0.2vw";

        // Anadir primero el checkbox y luego el label al <td>
        td.appendChild(checkbox);
        td.appendChild(label);

        // Anadir el <td> al <tr>
        tr.appendChild(td);
    });
}

function asegurarCasillasModos() {
    const tr = document.getElementById('listaModos');
    if (!tr) return;
    const casillas = tr.querySelectorAll('input[name="modos"]');
    if (casillas.length !== LISTA_MODOS_DISPONIBLES.length) {
        generarCasillas(LISTA_MODOS);
    }
}

// Funcion para obtener los modos seleccionados
function rellenarListaModos() {
    asegurarCasillasModos();
    const seleccionados = document.querySelectorAll('input[name="modos"]:checked');

    LISTA_MODOS = Array.from(seleccionados).map(checkbox => checkbox.value);

    // Opcional: Mostrar los resultados en consola para verificar
    console.log('LISTA_MODOS:', LISTA_MODOS);
}
function actualizarVariables() {
    LIMITE_TIEMPO_INSPIRACION = limite_tiempo_inspiracion_input.valueAsNumber;
    TIEMPO_MODIFICADOR = tiempo_modificador_input.valueAsNumber * 1000;
    TIEMPO_CAMBIO_PALABRAS = tiempo_cambio_palabras_input.valueAsNumber * 1000;
    ESCALA_UI_ESPECTADOR = obtenerEscalaUiEspectadorParametro();
    TIEMPO_VOTACION = tiempo_votacion_input.valueAsNumber * 1000;
    TIEMPO_CAMBIO_LETRA = tiempo_cambio_letra_input.valueAsNumber *1000;
    TIEMPO_MODOS = tiempo_modos_input.valueAsNumber;

    DURACION_TIEMPO_MODOS = TIEMPO_MODOS;
    DURACION_TIEMPO_MUERTO = DURACION_TIEMPO_MODOS * 1000;
    TIEMPO_CAMBIO_MODOS = DURACION_TIEMPO_MODOS - 1;

   console.log('LIMITE_TIEMPO_INSPIRACION:', LIMITE_TIEMPO_INSPIRACION);
   console.log('TIEMPO_MODIFICADOR:', TIEMPO_MODIFICADOR);
   console.log('TIEMPO_CAMBIO_PALABRAS:', TIEMPO_CAMBIO_PALABRAS);
   console.log('ESCALA_UI_ESPECTADOR:', ESCALA_UI_ESPECTADOR);
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
        asegurarCasillasModos();
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
    const selectorIdioma = getEl("selector_idioma_control");
    window.emitirCambioIdiomaControl = (idioma = "es") => {
        socket.emit("cambiar_idioma_global", { idioma });
    };
    if (selectorIdioma) {
        selectorIdioma.addEventListener("change", (evento) => {
            const idioma = evento && evento.target ? evento.target.value : "es";
            window.emitirCambioIdiomaControl(idioma);
        });
    }
});

window.addEventListener('load', inicializarHeatmap);
let modo_actual = "";
let segundos_modo_actual_control = 0;
let duracion_modo_actual_control = 0;
let tiempo_restante_modo_actual_control = 0;
let modo_seq_actual_control = 0;

function extraerModoSeqPayloadControl(payload = {}) {
    const valor = Number(payload && payload.modo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function aceptarEventoModoControl(payload = {}, opciones = {}) {
    const { actualizar = true } = opciones;
    const seq = extraerModoSeqPayloadControl(payload);
    if (seq === null) {
        return true;
    }
    if (seq < modo_seq_actual_control) {
        return false;
    }
    if (actualizar && seq > modo_seq_actual_control) {
        modo_seq_actual_control = seq;
        if (window && typeof window.reiniciarCountSeqControl2P === "function") {
            window.reiniciarCountSeqControl2P();
        }
        if (window && typeof window.reiniciarTiempoSeqControl2P === "function") {
            window.reiniciarTiempoSeqControl2P();
        }
    }
    return true;
}

if (typeof window !== "undefined") {
    window.obtenerModoSyncSeqControl2P = () => modo_seq_actual_control;
}

const HEATMAP_LAYOUT = [
    [
        { code: "Backquote", label: "Âº\nÂª" },
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
        { code: "Minus", label: "Â¿\n?" },
        { code: "Equal", label: "Â¡\n!" },
        { code: "Backspace", label: "â†", ancho: 2.4 }
    ],
    [
        { code: "Tab", label: "Tab", ancho: 1.6 },
        { code: "KeyQ", label: "Q" }, { code: "KeyW", label: "W" }, { code: "KeyE", label: "E" }, { code: "KeyR", label: "R" },
        { code: "KeyT", label: "T" }, { code: "KeyY", label: "Y" }, { code: "KeyU", label: "U" }, { code: "KeyI", label: "I" },
        { code: "KeyO", label: "O" }, { code: "KeyP", label: "P" },
        { code: "BracketLeft", label: "Â´\n+" }, { code: "BracketRight", label: "`\n^" },
        { code: "Backslash", label: "\\", ancho: 1.6 }
    ],
    [
        { code: "CapsLock", label: "Caps", ancho: 1.9 },
        { code: "KeyA", label: "A" }, { code: "KeyS", label: "S" }, { code: "KeyD", label: "D" }, { code: "KeyF", label: "F" },
        { code: "KeyG", label: "G" }, { code: "KeyH", label: "H" }, { code: "KeyJ", label: "J" }, { code: "KeyK", label: "K" },
        { code: "KeyL", label: "L" }, { code: "Semicolon", label: "Ã‘" },
        { code: "Quote", label: "Â¨\nÂ´" },
        { code: "Enter", label: "Enter", ancho: 2.5 }
    ],
    [
        { code: "ShiftLeft", label: "Shift", ancho: 2.6 },
        { code: "IntlBackslash", label: "<\n>" },
        { code: "KeyZ", label: "Z" }, { code: "KeyX", label: "X" }, { code: "KeyC", label: "C" }, { code: "KeyV", label: "V" },
        { code: "KeyB", label: "B" }, { code: "KeyN", label: "N" }, { code: "KeyM", label: "M" },
        { code: "Comma", label: ",\n;" }, { code: "Period", label: ".\n:" }, { code: "Slash", label: "Â¿\n?" },
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
    tiempoEscrituraMs: 0,
    timelineModos: []
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
    resumenPartida.timelineModos = [];
}

function registrarModoActual(nuevoModo) {
    if (!nuevoModo) return;
    const ahora = Date.now();
    if (!resumenPartida.inicio) {
        resumenPartida.inicio = ahora;
    }
    const tiempoRelativoMs = Math.max(0, ahora - resumenPartida.inicio);
    const anterior = resumenPartida.modoActual;
    if (anterior && resumenPartida.ultimoCambioModo !== null && anterior !== nuevoModo) {
        if (anterior !== "tertulia") {
            resumenPartida.tiempoEscrituraMs += Math.max(0, ahora - resumenPartida.ultimoCambioModo);
        }
    }
    if (anterior !== nuevoModo || resumenPartida.ultimoCambioModo === null) {
        const timeline = Array.isArray(resumenPartida.timelineModos) ? resumenPartida.timelineModos : [];
        const ultimoSegmento = timeline.length ? timeline[timeline.length - 1] : null;
        if (
            ultimoSegmento
            && (
                ultimoSegmento.finMs === null
                || typeof ultimoSegmento.finMs === "undefined"
                || !Number.isFinite(Number(ultimoSegmento.finMs))
            )
        ) {
            ultimoSegmento.finMs = tiempoRelativoMs;
        }
        timeline.push({
            modo: String(nuevoModo || "").trim().slice(0, 32),
            inicioMs: tiempoRelativoMs,
            finMs: null
        });
        resumenPartida.timelineModos = timeline;
        resumenPartida.modoActual = nuevoModo;
        resumenPartida.ultimoCambioModo = ahora;
    }
}

function obtenerTimelineModosControl(tsActual = Date.now()) {
    if (!resumenPartida.inicio) return [];
    const ahora = Number(tsActual) || Date.now();
    const tiempoRelativoActual = Math.max(0, ahora - resumenPartida.inicio);
    const timeline = Array.isArray(resumenPartida.timelineModos) ? resumenPartida.timelineModos : [];
    return timeline
        .map((segmento, indice) => {
            const inicioMs = Math.max(0, Number(segmento && segmento.inicioMs) || 0);
            const finRaw = segmento ? segmento.finMs : null;
            const tieneFin = finRaw !== null && typeof finRaw !== "undefined" && Number.isFinite(Number(finRaw));
            const esUltimo = indice === (timeline.length - 1);
            const inicioSiguiente = Math.max(
                inicioMs,
                Number(timeline[indice + 1] && timeline[indice + 1].inicioMs) || inicioMs
            );
            const finMs = tieneFin
                ? Math.max(inicioMs, Number(finRaw))
                : (esUltimo ? tiempoRelativoActual : inicioSiguiente);
            return {
                modo: String(segmento && segmento.modo ? segmento.modo : "").trim().slice(0, 32),
                inicioMs,
                finMs
            };
        })
        .filter((segmento) => segmento.modo && segmento.finMs > segmento.inicioMs);
}

function obtenerTiempoEscrituraMs() {
    let total = resumenPartida.tiempoEscrituraMs || 0;
    if (resumenPartida.modoActual && resumenPartida.ultimoCambioModo !== null && resumenPartida.modoActual !== "tertulia") {
        total += Math.max(0, Date.now() - resumenPartida.ultimoCambioModo);
    }
    return total;
}

function extraerSegundosTextoStatsControl(texto = "") {
    const valor = String(texto || "").trim();
    if (!valor || valor.indexOf(":") === -1) return null;
    const partes = valor.split(":");
    if (partes.length < 2) return null;
    const minutos = parseInt(partes[0], 10);
    const segundos = parseInt(partes[1], 10);
    if (Number.isNaN(minutos) || Number.isNaN(segundos)) return null;
    return Math.max(0, (minutos * 60) + segundos);
}

function obtenerUltimaVidaRegistradaControl(playerId) {
    const serie = resumenPartida.tiempos[playerId];
    if (!Array.isArray(serie) || !serie.length) return null;
    const ultimo = Number(serie[serie.length - 1] && serie[serie.length - 1].v);
    return Number.isFinite(ultimo) ? Math.max(0, ultimo) : null;
}

function obtenerVidaActualStatsControl(playerId) {
    const id = Number(playerId);
    if (id !== 1 && id !== 2) return null;
    const estaTerminado = Boolean(id === 2 ? (terminado1 || fin_j2) : (terminado || fin_j1));
    if (estaTerminado) {
        return 0;
    }

    const ultimoValor = obtenerUltimaVidaRegistradaControl(id);
    if ((resumenPartida.modoActual === "tertulia" || modo_actual === "tertulia") && Number.isFinite(ultimoValor)) {
        return ultimoValor;
    }

    const nodoTiempo = id === 2 ? tiempo1 : tiempo;
    const desdeTexto = extraerSegundosTextoStatsControl(
        nodoTiempo ? (nodoTiempo.textContent || nodoTiempo.innerText || "") : ""
    );
    if (Number.isFinite(desdeTexto)) {
        return desdeTexto;
    }

    const desdeContador = Number(id === 2 ? secondsRemaining1 : secondsRemaining);
    if (Number.isFinite(desdeContador)) {
        return Math.max(0, desdeContador);
    }

    return Number.isFinite(ultimoValor) ? ultimoValor : null;
}

function registrarTiempoEstadoActualControl(playerId) {
    if (!resumenPartida.inicio) return;
    const valorVida = obtenerVidaActualStatsControl(playerId);
    if (!Number.isFinite(valorVida)) return;
    registrarTiempoControl(playerId, valorVida);
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

function tokenizarPalabrasUnicodeStatsControl(textoPlano = "") {
    const normalizado = String(textoPlano || "")
        .normalize("NFKC")
        .toLocaleLowerCase();
    return normalizado.match(/[\p{L}\p{N}](?:[\p{L}\p{N}\p{M}]|['’\u2010-\u2015-](?=[\p{L}\p{N}]))*/gu) || [];
}

function obtenerPalabrasUnicasControl(playerId) {
    const textoEl = Number(playerId) === 2 ? texto2 : texto1;
    const textoPlano = textoEl ? extraerTextoPlanoDesdeHtmlControl(textoEl.innerHTML || "") : "";
    return new Set(tokenizarPalabrasUnicodeStatsControl(textoPlano)).size;
}

window.tokenizarPalabrasUnicodeStatsControl = tokenizarPalabrasUnicodeStatsControl;

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

function obtenerHeatmapCompletoControl(playerId) {
    const conteos = heatmapConteos[playerId];
    const heatmap = {};
    let totalPulsaciones = 0;
    let teclasDistintas = 0;
    if (!conteos || typeof conteos.forEach !== "function") {
        return { heatmap, totalPulsaciones, teclasDistintas };
    }
    conteos.forEach((count, code) => {
        const codigo = String(code || "").trim();
        const valor = Math.max(0, Math.round(Number(count) || 0));
        if (!codigo || valor <= 0) return;
        heatmap[codigo] = valor;
        totalPulsaciones += valor;
        teclasDistintas += 1;
    });
    return { heatmap, totalPulsaciones, teclasDistintas };
}

function obtenerResumenJugadorStatsControl(playerId) {
    const serieVida = resumenPartida.tiempos[playerId] || [];
    const datosHeatmap = obtenerHeatmapCompletoControl(playerId);
    const tiempoTotalMs = serieVida.length
        ? Number(serieVida[serieVida.length - 1].t) || 0
        : (resumenPartida.inicio ? Math.max(0, Date.now() - resumenPartida.inicio) : 0);
    const tiempoEscrituraMs = Math.max(0, Number(obtenerTiempoEscrituraMs()) || 0);
    const topTeclas = obtenerTopTeclasControl(playerId);
    const pulsacionesTotal = datosHeatmap.totalPulsaciones;
    const ritmoPpm = tiempoEscrituraMs > 0
        ? Math.round(pulsacionesTotal / Math.max(tiempoEscrituraMs / 60000, 0.001))
        : 0;
    const textoEl = playerId === 2 ? texto2 : texto1;
    const html = textoEl && typeof textoEl.innerHTML === "string" ? textoEl.innerHTML : "";
    const palabrasBenditas = extraerPalabrasConClase(html, CLASES_PALABRAS_DESTACADAS_PDF);
    const palabrasMalditasMap = resumenPartida.palabrasProhibidasUsadas[playerId];
    const palabrasMalditas = palabrasMalditasMap && typeof palabrasMalditasMap.keys === "function"
        ? Array.from(palabrasMalditasMap.keys()).map((valor) => String(valor).toUpperCase()).sort()
        : [];

    return {
        id: playerId,
        nombre: (playerId === 2 ? val_nombre2 : val_nombre1) || `ESCRITXR ${playerId}`,
        palabrasTotal: obtenerConteoPalabrasControl(playerId),
        palabrasUnicas: obtenerPalabrasUnicasControl(playerId),
        pulsacionesTotal,
        teclasDistintas: datosHeatmap.teclasDistintas,
        topTeclas: topTeclas.map((item) => ({ ...item })),
        heatmap: { ...datosHeatmap.heatmap },
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
    const ts = Date.now();
    return {
        ts,
        modo_actual: String(modo_actual || ""),
        timeline_modos: obtenerTimelineModosControl(ts),
        players: {
            1: obtenerResumenJugadorStatsControl(1),
            2: obtenerResumenJugadorStatsControl(2)
        }
    };
}

function emitirStatsLiveControl() {
    if (!socket || !socket.connected) return;
    registrarTiempoEstadoActualControl(1);
    registrarTiempoEstadoActualControl(2);
    socket.emit("stats_live_actualizar", construirPayloadStatsLiveControl());
}

window.emitirStatsLiveControl = emitirStatsLiveControl;

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
        heatmapTitleJ1.textContent = val_nombre1
            ? tJuego2P("control.heatmap_title", { name: val_nombre1 }, `Mapa de calor ${val_nombre1}`)
            : tJuego2P("control.heatmap_title", { name: "" }, "Mapa de calor").trim();
    }
    if (heatmapTitleJ2) {
        heatmapTitleJ2.textContent = val_nombre2
            ? tJuego2P("control.heatmap_title", { name: val_nombre2 }, `Mapa de calor ${val_nombre2}`)
            : tJuego2P("control.heatmap_title", { name: "" }, "Mapa de calor").trim();
    }
}

actualizarTitulosHeatmap();
actualizarNombresConexiones();
if (window.actualizarBotonesTeleprompterCarga) {
    window.actualizarBotonesTeleprompterCarga();
}

