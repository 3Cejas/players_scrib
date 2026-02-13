// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);

const getEl = id => document.getElementById(id); // Obtiene los elementos con id.
const escapeHtml = (valor) => String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const paddedFormat = (num) => (num < 10 ? `0${num}` : `${num}`);

const obtenerContenidoMarquee = (elemento) => {
    if (!elemento) return "";
    const inner = elemento.querySelector(".definicion-marquee__inner");
    return inner ? inner.innerHTML : elemento.innerHTML;
};

const aplicarMarqueeSiOverflow = (elemento) => {
    if (!elemento) return;
    const contenido = obtenerContenidoMarquee(elemento);
    elemento.classList.remove("definicion--marquee");
    elemento.innerHTML = contenido;
    elemento.style.removeProperty("--marquee-distance");
    elemento.style.removeProperty("--marquee-duration");

    requestAnimationFrame(() => {
        const distancia = elemento.scrollWidth - elemento.clientWidth;
        if (distancia <= 1) {
            return;
        }
        const velocidad = 35;
        const duracion = Math.max(distancia / velocidad, 6);
        elemento.style.setProperty("--marquee-distance", `${Math.ceil(distancia)}px`);
        elemento.style.setProperty("--marquee-duration", `${duracion.toFixed(2)}s`);
        elemento.innerHTML = `<span class="definicion-marquee__inner">${contenido}</span>`;
        elemento.classList.add("definicion--marquee");
    });
};

const temporizador_gigante = (() => {
    let nodo = getEl("temporizador_gigante");
    if (!nodo) {
        nodo = document.createElement("div");
        nodo.id = "temporizador_gigante";
        nodo.className = "temporizador-gigante";
        document.body.appendChild(nodo);
    }
    return nodo;
})();

let temporizador_gigante_interval = null;
let temporizador_gigante_restante = 0;

function actualizarTemporizadorGigante() {
    const minutos = Math.floor(temporizador_gigante_restante / 60);
    const segundos = temporizador_gigante_restante % 60;
    temporizador_gigante.textContent = `${paddedFormat(minutos)}:${paddedFormat(segundos)}`;
}

function detenerTemporizadorGigante() {
    if (temporizador_gigante_interval) {
        clearInterval(temporizador_gigante_interval);
        temporizador_gigante_interval = null;
    }
    temporizador_gigante_restante = 0;
    temporizador_gigante.textContent = "";
    temporizador_gigante.classList.remove("activo");
    temporizador_gigante.classList.remove("fin");
}

function iniciarTemporizadorGigante(duracion) {
    detenerTemporizadorGigante();
    temporizador_gigante_restante = Math.max(0, Number(duracion) || (10 * 60));
    temporizador_gigante.classList.add("activo");
    temporizador_gigante.classList.remove("fin");
    actualizarTemporizadorGigante();
    temporizador_gigante_interval = setInterval(() => {
        temporizador_gigante_restante -= 1;
        if (temporizador_gigante_restante < 0) {
            clearInterval(temporizador_gigante_interval);
            temporizador_gigante_interval = null;
            temporizador_gigante.textContent = "";
            temporizador_gigante.classList.add("fin");
            return;
        }
        actualizarTemporizadorGigante();
    }, 1000);
}

const contenedor_corazones_espectador = (() => {
    let contenedor = getEl("corazones_espectador");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "corazones_espectador";
        contenedor.className = "corazones-flotantes";
        document.body.appendChild(contenedor);
    }
    return contenedor;
})();

const teleprompter_overlay = getEl("teleprompter_overlay");
const teleprompter_screen = getEl("teleprompter_screen");
const teleprompter_text = getEl("teleprompter_text");
const teleprompter_estado = {
    visible: false,
    text: "",
    fontSize: 36,
    scroll: 0,
    source: 0
};

const sincronizarTeleprompterScroll = () => {
    const screen = teleprompter_screen || getEl("teleprompter_screen");
    const text = teleprompter_text || getEl("teleprompter_text");
    if (!screen || !text) return;
    const maxScroll = Math.max(0, text.scrollHeight - screen.clientHeight + 4);
    let objetivo = Number.isFinite(teleprompter_estado.scroll) ? teleprompter_estado.scroll : 0;
    if (objetivo >= Number.MAX_SAFE_INTEGER) {
        objetivo = maxScroll;
    }
    objetivo = Math.max(0, Math.min(objetivo, maxScroll));
    text.style.transform = `translateY(${-objetivo}px)`;
};

const actualizarTeleprompterEstado = (state = {}) => {
    if (!state) return;
    const overlay = teleprompter_overlay || getEl("teleprompter_overlay");
    const screen = teleprompter_screen || getEl("teleprompter_screen");
    const text = teleprompter_text || getEl("teleprompter_text");
    if (typeof state.visible === "boolean") {
        teleprompter_estado.visible = state.visible;
    }
    if (typeof state.text === "string") {
        teleprompter_estado.text = state.text;
        if (text) {
            text.textContent = state.text;
        }
    }
    if (state.source !== undefined) {
        const fuente = Number(state.source);
        teleprompter_estado.source = fuente === 1 || fuente === 2 ? fuente : 0;
    }
    if (Number.isFinite(state.fontSize)) {
        teleprompter_estado.fontSize = Math.min(96, Math.max(18, state.fontSize));
        if (text) {
            text.style.fontSize = `${teleprompter_estado.fontSize}px`;
        }
    }
    if (Number.isFinite(state.scroll)) {
        teleprompter_estado.scroll = state.scroll;
    }
    if (overlay) {
        overlay.classList.toggle("activo", teleprompter_estado.visible);
    }
    if (screen) {
        const tieneTexto = typeof teleprompter_estado.text === "string" && teleprompter_estado.text.trim().length > 0;
        const equipo = teleprompter_estado.source;
        const valor = tieneTexto && equipo === 1 ? "1" : tieneTexto && equipo === 2 ? "2" : "none";
        screen.setAttribute("data-team", valor);
        const frameColor = valor === "1"
            ? "rgba(69, 243, 255, 0.9)"
            : valor === "2"
                ? "rgba(255, 90, 90, 0.9)"
                : "rgba(120, 120, 120, 0.6)";
        screen.style.setProperty("--tp-frame", frameColor);
        screen.style.borderColor = frameColor;
        screen.style.boxShadow = `0 0 35px ${frameColor}, inset 0 0 30px rgba(0, 0, 0, 0.8)`;
    }
    requestAnimationFrame(sincronizarTeleprompterScroll);
};

window.addEventListener("resize", () => {
    if (teleprompter_estado.visible) {
        requestAnimationFrame(sincronizarTeleprompterScroll);
    }
    if (vista_calentamiento) {
        renderizarPalabrasCalentamiento();
    }
});

const crearCorazonFlotante = (equipo, x, y) => {
    if (!contenedor_corazones_espectador) return;
    const corazon = document.createElement("span");
    const claseEquipo = equipo === 1 ? "corazon-azul" : "corazon-rojo";
    corazon.className = `corazon-flotante ${claseEquipo}`;
    corazon.textContent = equipo === 1 ? "💙" : "❤️";
    const tamaño = 22 + Math.random() * 22;
    const duracion = 2000 + Math.random() * 1200;
    const desplazamiento = -(90 + Math.random() * 140);
    corazon.style.left = `${x}px`;
    corazon.style.top = `${y}px`;
    corazon.style.fontSize = `${tamaño}px`;
    corazon.style.setProperty("--corazon-duracion", `${duracion}ms`);
    corazon.style.setProperty("--corazon-dy", `${desplazamiento}px`);
    contenedor_corazones_espectador.appendChild(corazon);
    corazon.addEventListener("animationend", () => {
        corazon.remove();
    });
};

const lanzarCorazonEspectador = (equipo) => {
    const ancho = window.innerWidth || 0;
    const alto = window.innerHeight || 0;
    if (!ancho || !alto) return;
    const margen = ancho * 0.08;
    const mitad = ancho * 0.5;
    const minX = equipo === 1 ? margen : mitad + margen;
    const maxX = equipo === 1 ? mitad - margen : ancho - margen;
    const x = minX + Math.random() * Math.max(0, maxX - minX);
    const yMin = alto * 0.45;
    const yMax = alto * 0.8;
    const y = yMin + Math.random() * (yMax - yMin);
    crearCorazonFlotante(equipo, x, y);
};

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");
let musas1 = getEl("musas");


let logo = getEl("logo");
let palabra1 = getEl("palabra");
let definicion1 = getEl("definicion");
let explicación = getEl("explicación");

let palabra2 = getEl("palabra1");
let definicion2 = getEl("definicion1");
let explicación1 = getEl("explicación1");

let palabra3 = getEl("palabra2");
let definicion3 = getEl("definicion2");
let explicación2 = getEl("explicación2");
let ultimo_texto1 = "";
let ultimo_texto2 = "";
let ultimo_paquete_texto1 = null;
let ultimo_paquete_texto2 = null;
let pendiente_texto1 = false;
let pendiente_texto2 = false;

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tiempo1 = getEl("tiempo1");
let tema = getEl("temas");
let info = getEl("info");
let info1 = getEl("info1");
let info2= getEl("info2");
let inspiracion = getEl("inspiracion");

const construirResucitarMini = (root) => {
    if (!root) return null;
    return {
        root,
        mainPanel: root.querySelector(".resucitar-mini-main"),
        quantityPanel: root.querySelector(".resucitar-mini-quantity"),
        btnSi: root.querySelector('[data-btn="si"]'),
        btnNo: root.querySelector('[data-btn="no"]'),
        btnConfirmar: root.querySelector('[data-btn="confirmar"]'),
        btnAtras: root.querySelector('[data-btn="atras"]'),
        palabras: root.querySelector(".resucitar-mini-value.palabras"),
        segundos: root.querySelector(".resucitar-mini-value.segundos"),
        max: root.querySelector(".resucitar-mini-max")
    };
};

const resucitarMini = {
    1: construirResucitarMini(getEl("resucitar_mini_1")),
    2: construirResucitarMini(getEl("resucitar_mini_2"))
};

const ocultarResucitarMini = (playerId) => {
    const ui = resucitarMini[playerId];
    if (!ui || !ui.root) return;
    ui.root.classList.remove("activa");
    ui.root.style.display = "none";
};

const actualizarResucitarMini = (data) => {
    if (!data) return;
    const playerId = Number(data.player);
    const ui = resucitarMini[playerId];
    if (!ui || !ui.root) return;
    const menu = data.menu;
    const visible = data.visible && (menu === "main" || menu === "quantity");
    if (!visible) {
        ocultarResucitarMini(playerId);
        return;
    }
    ui.root.classList.add("activa");
    ui.root.style.display = "grid";
    if (ui.mainPanel) ui.mainPanel.style.display = menu === "main" ? "grid" : "none";
    if (ui.quantityPanel) ui.quantityPanel.style.display = menu === "quantity" ? "grid" : "none";

    if (ui.btnSi) ui.btnSi.classList.toggle("active", data.mainIndex === 0);
    if (ui.btnNo) ui.btnNo.classList.toggle("active", data.mainIndex === 1);
    if (ui.btnConfirmar) ui.btnConfirmar.classList.toggle("active", data.quantityIndex === 0);
    if (ui.btnAtras) ui.btnAtras.classList.toggle("active", data.quantityIndex === 1);

    if (typeof data.palabras === "number" && ui.palabras) {
        ui.palabras.textContent = data.palabras;
    }
    if (typeof data.segundos === "number" && ui.segundos) {
        ui.segundos.textContent = data.segundos;
    }
    if (typeof data.max === "number" && ui.max) {
        ui.max.textContent = `MAX ${data.max}`;
    }
};

if (tiempo) {
    tiempo.style.display = "none";
}
if (tiempo1) {
    tiempo1.style.display = "none";
}

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";

function extraerSegundosTiempo(texto) {
    if (!texto || typeof texto !== "string" || texto.indexOf(":") === -1) {
        return null;
    }
    const partes = texto.split(":");
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

function actualizarBarraVida(elemento, texto) {
    if (!elemento) {
        return;
    }
    const total = extraerSegundosTiempo(texto);
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
const calentamiento_espectador = getEl("calentamiento_espectador");
const calentamiento_global_estado = getEl("calentamiento_global_estado");
const calentamiento_nube = getEl("calentamiento_nube");
const calentamiento_cursor_1 = getEl("calentamiento_cursor_1");
const calentamiento_cursor_2 = getEl("calentamiento_cursor_2");
const calentamiento_cursor_label_1 = calentamiento_cursor_1 ? calentamiento_cursor_1.querySelector(".cursor-label") : null;
const calentamiento_cursor_label_2 = calentamiento_cursor_2 ? calentamiento_cursor_2.querySelector(".cursor-label") : null;
const calentamiento_overlay_ui = document.querySelector("#calentamiento_espectador .calentamiento-overlay-ui");
const contenedor_espectador = getEl("contenedor_espectador");
const temas_container = getEl("temas_container");
const info_general = getEl("info_general");
const container_general = document.querySelector(".container");
const cabecera = document.querySelector(".cabecera");
const cabecera_display_inicial = cabecera ? cabecera.style.display : "";
let vista_calentamiento = false;
let ultimo_estado_calentamiento = 0;
let intervalo_estado_calentamiento = null;
let palabras_calentamiento = [];
const DURACION_DECAY_CALENTAMIENTO_MS = 10000;
const VENTANA_ANIMACION_PALABRA_MS = 600;
const MARGEN_CABECERA_CALENTAMIENTO_PX = 18;
const MIN_Y_CALENTAMIENTO_DEFAULT = 26;
const MAX_NOMBRE_CURSOR_CALENTAMIENTO = 26;
let cursores_calentamiento = {
    1: { x: 50, y: 50, visible: false },
    2: { x: 50, y: 50, visible: false }
};
const limitarPct = (valor, min, max) => Math.max(min, Math.min(max, valor));
const normalizarNombreCursorCalentamiento = (valor, fallback) => {
    const texto = typeof valor === "string" ? valor.trim() : "";
    if (!texto) return fallback;
    return texto.slice(0, MAX_NOMBRE_CURSOR_CALENTAMIENTO);
};
const actualizarEtiquetasCursorCalentamiento = () => {
    if (calentamiento_cursor_label_1) {
        const nombreAzul = normalizarNombreCursorCalentamiento(getEl("nombre")?.value, "ESCRITORA AZUL");
        calentamiento_cursor_label_1.textContent = nombreAzul;
    }
    if (calentamiento_cursor_label_2) {
        const nombreRojo = normalizarNombreCursorCalentamiento(getEl("nombre1")?.value, "ESCRITORA ROJA");
        calentamiento_cursor_label_2.textContent = nombreRojo;
    }
};
const obtenerMinYPalabrasCalentamiento = () => {
    if (!calentamiento_overlay_ui) return MIN_Y_CALENTAMIENTO_DEFAULT;
    const altoVentana = window.innerHeight || 1;
    const rect = calentamiento_overlay_ui.getBoundingClientRect();
    if (!Number.isFinite(rect.bottom) || rect.bottom <= 0) return MIN_Y_CALENTAMIENTO_DEFAULT;
    const yPct = ((rect.bottom + MARGEN_CABECERA_CALENTAMIENTO_PX) / altoVentana) * 100;
    return limitarPct(yPct, 12, 62);
};

const normalizarPalabrasCalentamiento = (equipos = {}) => {
    const lista = [];
    const minY = obtenerMinYPalabrasCalentamiento();
    [1, 2].forEach((equipo) => {
        const data = equipos[equipo] || {};
        const palabras = Array.isArray(data.palabras) ? data.palabras : [];
        palabras.forEach((entrada) => {
            if (!entrada || typeof entrada.palabra !== "string") return;
            lista.push({
                id: entrada.id,
                palabra: entrada.palabra,
                equipo,
                x: typeof entrada.x === "number" ? entrada.x : 50,
                y: limitarPct(typeof entrada.y === "number" ? entrada.y : 50, minY, 96),
                destacada: Boolean(entrada.destacada),
                ts: Number(entrada.ts) || 0,
                animOnTs: Number(entrada.animOnTs) || 0,
                animOffTs: Number(entrada.animOffTs) || 0,
                duracionMs: Number(entrada.duracionMs) > 0 ? Number(entrada.duracionMs) : DURACION_DECAY_CALENTAMIENTO_MS
            });
        });
    });
    lista.sort((a, b) => a.ts - b.ts);
    return lista.slice(-220);
};

const renderizarPalabrasCalentamiento = () => {
    if (!calentamiento_nube) return;
    calentamiento_nube.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const ahora = Date.now();
    const minY = obtenerMinYPalabrasCalentamiento();
    palabras_calentamiento.forEach((entrada) => {
        const nodo = document.createElement("span");
        const clases = [`calentamiento-palabra`, `equipo-${entrada.equipo}`];
        if (entrada.destacada) clases.push("is-highlighted");
        if (entrada.destacada && entrada.animOnTs && (ahora - entrada.animOnTs) < VENTANA_ANIMACION_PALABRA_MS) {
            clases.push("is-highlight-enter");
        }
        if (!entrada.destacada && entrada.animOffTs && (ahora - entrada.animOffTs) < VENTANA_ANIMACION_PALABRA_MS) {
            clases.push("is-highlight-exit");
        }
        nodo.className = clases.join(" ");
        nodo.textContent = entrada.palabra;
        nodo.style.left = `${Math.max(0, Math.min(100, entrada.x))}%`;
        nodo.style.top = `${limitarPct(entrada.y, minY, 96)}%`;
        const duracionMs = Number(entrada.duracionMs) > 0 ? Number(entrada.duracionMs) : DURACION_DECAY_CALENTAMIENTO_MS;
        const edadMs = Math.max(0, Date.now() - (Number(entrada.ts) || Date.now()));
        const delayMs = entrada.destacada ? 0 : -Math.min(edadMs, duracionMs);
        nodo.style.setProperty("--calentamiento-decay-duration", `${duracionMs}ms`);
        nodo.style.setProperty("--calentamiento-decay-delay", `${delayMs}ms`);
        fragment.appendChild(nodo);
    });
    calentamiento_nube.appendChild(fragment);
};

const aplicarCursorCalentamiento = (elemento, cursor) => {
    if (!elemento) return;
    const visible = Boolean(cursor && cursor.visible);
    elemento.classList.toggle("activo", visible);
    if (!visible) return;
    const x = typeof cursor.x === "number" ? cursor.x : 50;
    const y = typeof cursor.y === "number" ? cursor.y : 50;
    elemento.style.left = `${Math.max(0, Math.min(100, x))}%`;
    elemento.style.top = `${Math.max(0, Math.min(100, y))}%`;
};

const renderizarCursoresCalentamiento = () => {
    aplicarCursorCalentamiento(calentamiento_cursor_1, cursores_calentamiento[1]);
    aplicarCursorCalentamiento(calentamiento_cursor_2, cursores_calentamiento[2]);
};

const actualizarVistaCalentamiento = (activa) => {
    vista_calentamiento = Boolean(activa);
    if (document.body) {
        document.body.classList.toggle("vista-calentamiento", vista_calentamiento);
    }
    if (calentamiento_espectador) {
        calentamiento_espectador.style.display = vista_calentamiento ? "flex" : "none";
    }
    if (cabecera) {
        cabecera.style.display = vista_calentamiento ? "none" : (cabecera_display_inicial || "");
    }
};

const actualizarCalentamientoEspectador = (data) => {
    if (!data) return;
    actualizarEtiquetasCursorCalentamiento();
    if (typeof data.vista === "boolean") {
        actualizarVistaCalentamiento(data.vista);
    }
    if (calentamiento_global_estado) {
        calentamiento_global_estado.textContent = "";
    }
    const equipos = data.equipos || {};
    palabras_calentamiento = normalizarPalabrasCalentamiento(equipos);
    if (data.cursores && typeof data.cursores === "object") {
        cursores_calentamiento = {
            1: { ...(cursores_calentamiento[1] || {}), ...(data.cursores[1] || {}) },
            2: { ...(cursores_calentamiento[2] || {}), ...(data.cursores[2] || {}) }
        };
    }
    renderizarPalabrasCalentamiento();
    renderizarCursoresCalentamiento();
};

const actualizarCursorCalentamientoRemoto = (payload = {}) => {
    const equipo = Number(payload.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    cursores_calentamiento[equipo] = {
        ...(cursores_calentamiento[equipo] || {}),
        ...payload
    };
    renderizarCursoresCalentamiento();
};

// COMPONENTES DEL JUGADOR 2
let nombre2 = getEl("nombre1");
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");
let musas2 = getEl("musas1");

let focalizador1 = getEl("focalizador1");
let focalizador2 = getEl("focalizador2");
let focalizador_id = 1;
let feedback_tiempo = getEl("feedback_tiempo");

// Variables de los modos.
let terminado = false;
let terminado1 = false;
let modo_actual = "";
let tempo_text_inverso1;
let tempo_text_inverso2;
let tempo_text_borroso1;
let tempo_text_borroso2;
let listener_modo;
let activado_psico1 = false;
let activado_psico2 = false;
let listener_cuenta_atras = null;
let timeout_countdown;
let timeout_timer;
let cuenta_atras_activa = false;
let modo_pendiente = null;
let inicio_modo_delay = false;
let timeout_inicio_modo = null;
let Temasinterval;
let sonido_confetti_musa;
let sonido_confetti;
let audio_inverso;
let audio_borroso;
let sonido_modo;
let intervaloSonidoRayo;
let timer = null;
const color_negativo = "red";
const color_positivo = "greenyellow";
let TIEMPO_MODIFICADOR;
let frase_final_j1;
let frase_final_j2;

let sonido;

function detenerSonidoRayo() {
    if (intervaloSonidoRayo) {
        clearInterval(intervaloSonidoRayo);
        intervaloSonidoRayo = null;
    }
}

function detenerAudioInverso() {
    if (audio_inverso) {
        audio_inverso.pause();
        audio_inverso.currentTime = 0;
        audio_inverso = null;
    }
}

function detenerAudioBorroso() {
    if (audio_borroso) {
        audio_borroso.pause();
        audio_borroso.currentTime = 0;
        audio_borroso = null;
    }
}

function detenerSonidosDesventaja() {
    detenerSonidoRayo();
    detenerAudioInverso();
    detenerAudioBorroso();
}

if (typeof animateCSS === "function") {
    animateCSS(".cabecera", "backInLeft").then(() => {
        animateCSS(".contenedor_espectador", "pulse");
    });
}
//reproducirSonido("../../game/audio/1. MENU DE INICIO.mp3", true)

const PUTADAS = {
    "🐢": function () {
        
    },
    "⚡": function (player) {
        detenerSonidoRayo();
        if(player == 1){
            document.body.classList.add("bg");
            document.body.classList.add("rain");
            lightning.classList.add("lightning")
            lightning.style.right = "45%";
            lightning.style.left = "0%";
            reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
            intervaloSonidoRayo = setInterval(() => {
                reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
            }, 4000);
            setTimeout(function () {
                detenerSonidoRayo();
                document.body.classList.remove("bg");
                document.body.classList.remove("rain");
                lightning.classList.remove("lightning");
            }, TIEMPO_MODIFICADOR);
        }
        else if(player == 2){
            document.body.classList.add("bg");
            document.body.classList.add("rain");
            lightning.classList.add("lightning")
            lightning.style.right = "0%";
            lightning.style.left = "45%";
            reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
            intervaloSonidoRayo = setInterval(() => {
                reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
            }, 4000)
            setTimeout(function () {
                detenerSonidoRayo();
                document.body.classList.remove("bg");
                document.body.classList.remove("rain");
                lightning.classList.remove("lightning");
            }, TIEMPO_MODIFICADOR);
        }
    },

    "⌛": function () {

    },
    "🙃": function (player) {
        detenerAudioInverso();
        audio_inverso = reproducirSonido("../../game/audio/FX/8. INVERSO LOOP.mp3", true)
        if(player == 1){
            texto1.classList.add("rotate-vertical-center");
            // Añade un escuchador para el evento 'animationend'
            texto1.addEventListener('animationend', function() {
                texto1.classList.remove("rotate-vertical-center");
                texto1.removeEventListener('animationend', arguments.callee);
            });
            tempo_text_inverso1 = setTimeout(function () {
                detenerAudioInverso();
                texto1.classList.add("rotate-vertical-center");
                texto1.addEventListener('animationend', function() {
                    texto1.classList.remove("rotate-vertical-center");
                    texto1.removeEventListener('animationend', arguments.callee);
                });
            }, TIEMPO_MODIFICADOR);
        }
        else if(player == 2){
            texto2.classList.add("rotate-vertical-center");
            // Añade un escuchador para el evento 'animationend'
            texto2.addEventListener('animationend', function() {
                texto2.classList.remove("rotate-vertical-center");
                texto2.removeEventListener('animationend', arguments.callee);
            });
            tempo_text_inverso2 = setTimeout(function () {
                detenerAudioInverso();
                texto2.classList.add("rotate-vertical-center");
                texto2.addEventListener('animationend', function() {
                    texto2.classList.remove("rotate-vertical-center");
                    texto2.removeEventListener('animationend', arguments.callee);
                });
            }, TIEMPO_MODIFICADOR);
        }
    },

    "🌪️": function (player) {
        detenerAudioBorroso();
        audio_borroso = reproducirSonido("../../game/audio/FX/7. REMOLINO PARA LOOP.mp3", true)
        modo_texto_borroso1 = true;
        tiempo_inicial = new Date();
        if(player == 1){
            texto1.classList.add("textarea_blur");
            tempo_text_borroso1 = setTimeout(function () {
            detenerAudioBorroso();
            temp_text_borroso_activado1 = true;
            texto1.classList.remove("textarea_blur");
        }, TIEMPO_MODIFICADOR);
        }
        else if(player == 2){
            modo_texto_borroso2 = true;
            console.log("BORROSO")
            texto2.classList.add("textarea_blur");
            tempo_text_borroso2 = setTimeout(function () {
            detenerAudioBorroso();
            temp_text_borroso_activado2 = true;
            texto2.classList.remove("textarea_blur");
        }, TIEMPO_MODIFICADOR);
        }
    },
    "🐢": function (player) {
    },
    "🖊️": function (player) {
    },
};

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    'palabras bonus': function (data) {
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true)
    reproducirSonido("../../game/audio/FX/12. PALABRAS BONUS.mp3")
        console.log("ALGO")
        explicación.style.color = "yellow";
        explicación.innerHTML = "NIVEL PALABRAS BONUS";
        palabra1.innerHTML = "";
        definicion2.innerHTML = "";
        palabra2.style.backgroundColor = "yellow";
        palabra3.style.backgroundColor = "yellow";
        definicion2.style.maxWidth = "100%";
        definicion3.innerHTML = "";
        definicion3.style.maxWidth = "100%";
    },

    //Recibe y activa el modo letra prohibida.
    'letra prohibida': function (data) {
        sonido_modo = reproducirSonido("../../game/audio/6. KEYGEN PRUEBA 2.mp3", true)
        reproducirSonido("../../game/audio/FX/11. LETRA PROHIBIDA.mp3")
        palabra2.innerHTML = "";
        definicion2.innerHTML = "";
        explicación1.innerHTML = "";
        palabra3.innerHTML = "";
        definicion3.innerHTML = "";
        explicación2.innerHTML = "";
        palabra1.style.backgroundColor= "red";
        explicación.style.color = "red";
        explicación.innerHTML = "NIVEL LETRA PROHIBIDA";
        palabra1.innerHTML = "LETRA MALDITA: " + data.letra_prohibida;
        definicion2.innerHTML = "";
        definicion2.style.maxWidth = "100%";
        definicion3.innerHTML = "";
        definicion3.style.maxWidth = "100%";
        
    },

    //Recibe y activa el modo letra bendita.
    'letra bendita': function (data) {
        reproducirSonido("../../game/audio/FX/10. LETRA BENDITA.mp3")
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true);

        palabra2.innerHTML = "";
        definicion2.innerHTML = "";
        explicación1.innerHTML = "";
        palabra3.innerHTML = "";
        definicion3.innerHTML = "";
        explicación2.innerHTML = "";

        palabra1.style.backgroundColor= "lime";
        explicación.style.color = "lime";
        explicación.innerHTML = "NIVEL LETRA BENDITA";
        palabra1.innerHTML = "LETRA BENDITA: " + data.letra_bendita;
        definicion2.innerHTML = "";
        definicion2.style.maxWidth = "100%";
        definicion3.innerHTML = "";
        definicion3.style.maxWidth = "100%";
    },

    'psicodélico': function (data, socket, player) {
        //explicación.innerHTML = "MODO PSICODÉLICO";
        //palabra1.innerHTML = "";
        //definicion1.innerHTML = "";
        if (player == 1) {
            activado_psico1 = true;
        }
        else if (player == 2) {
            activado_psico2 = true;
        }

    },

    'palabras prohibidas': function (data) {
        sonido_modo = reproducirSonido("../../game/audio/6. KEYGEN PRUEBA 2.mp3", true)
        reproducirSonido("../../game/audio/FX/13. PALABRAS PROHIBIDAS.mp3")
        palabra2.style.backgroundColor = "pink";
        palabra3.style.backgroundColor = "pink";
        explicación.style.color = "pink";
        explicación.innerHTML = "NIVEL PALABRAS PROHIBIDAS";
        palabra1.innerHTML = "";
        definicion2.innerHTML = "";
        definicion2.style.maxWidth = "100%";
        definicion3.innerHTML = "";
        definicion3.style.maxWidth = "100%";
    },

    'tertulia': function (socket) {
        sonido_modo = reproducirSonido("../../game/audio/7. KEYGEN PRUEBA 3.mp3", true)
        reproducirSonido("../../game/audio/FX/14. TERTULIA.mp3")
        //activar_socket_feedback();
        explicación.style.color = "blue";
        explicación.innerHTML = "NIVEL TERTULIA";
        palabra1.innerHTML = "";

    },

    'frase final': function (socket) {
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true)
        reproducirSonido("../../game/audio/FX/15. FRASE FINAL.mp3")
        //activar_socket_feedback();
        explicación.style.color = "orange";
        explicación.innerHTML = "NIVEL FRASE FINAL";
        palabra2.style.backgroundColor= "orange";
        palabra2.innerHTML = "«" + frase_final_j1 + "»";
        definicion2.innerHTML = "⬆️ ¡Esta es la última! ⬆️";
        definicion3.innerHTML = "⬆️ ¡Esta es la última! ⬆️";
        palabra3.style.backgroundColor= "orange";
        palabra3.innerHTML = "«"+ frase_final_j2 + "»";
        definicion2.style.maxWidth = "100%";
        definicion3.style.maxWidth = "100%";

    },

    '': function (data) {
    }
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        console.log(sonido_modo)
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        palabra2.innerHTML = "";
        palabra3.innerHTML = "";
        definicion2.innerHTML = "";
        definicion3.innerHTML = "";
    },

    "letra prohibida": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
    },

    "letra bendita": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
    },

    "psicodélico": function (data, player) {
        if(player == 1){
            activado_psico1 = false;
        }
        else if(player == 2){
            activado_psico2 = false;
        }

        if(activado_psico1 == false && activado_psico2 == false){
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
        }
    },

    "palabras prohibidas": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        palabra2.innerHTML = "";
        palabra3.innerHTML = "";
        definicion2.innerHTML = "";
        definicion3.innerHTML = "";
    },

    "tertulia": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        } 
        
    },

    "frase final": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
        definicion1.innerHTML = "";
        definicion2.innerHTML = "";
        definicion3.innerHTML = "";
        palabra1.innerHTML = "";
        palabra2.innerHTML = "";
        palabra3.innerHTML = "";   
    },

    "": function (data) { },
};

activar_sockets_extratextuales();

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    actualizarEtiquetasCursorCalentamiento();
    socket.emit('registrar_espectador');
    socket.emit('pedir_calentamiento_estado');
    if (!intervalo_estado_calentamiento) {
        intervalo_estado_calentamiento = setInterval(() => {
            if (!socket.connected) return;
            if (Date.now() - ultimo_estado_calentamiento < 1500) return;
            socket.emit('pedir_calentamiento_estado');
        }, 2000);
    }
});

socket.on('teleprompter_state', (payload = {}) => {
    actualizarTeleprompterEstado(payload.state || {});
});

socket.on('musa_corazon', (data) => {
    const equipo = data && Number(data.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    lanzarCorazonEspectador(equipo);
});

socket.on('temporizador_gigante_inicio', (data) => {
    iniciarTemporizadorGigante(data && data.duracion);
});

socket.on('temporizador_gigante_detener', () => {
    detenerTemporizadorGigante();
});

socket.on('calentamiento_vista', (data) => {
    actualizarVistaCalentamiento(data && data.activo);
});

socket.on('calentamiento_estado_espectador', (data) => {
    ultimo_estado_calentamiento = Date.now();
    actualizarCalentamientoEspectador(data);
});

socket.on('calentamiento_cursor', (payload = {}) => {
    actualizarCursorCalentamientoRemoto(payload);
});


socket.on('actualizar_contador_musas', contador_musas => {
    console.log("actualizar_contador_musas")
    musas1.innerHTML = contador_musas.escritxr1 + " musas";
    musas2.innerHTML = contador_musas.escritxr2 + " musas";

});

// Recibe los datos del jugador 1 y los coloca.
socket.on('texto1', data => {
    ultimo_paquete_texto1 = data;
    if (pendiente_texto1) return;
    pendiente_texto1 = true;
    requestAnimationFrame(() => {
        pendiente_texto1 = false;
        const paquete = ultimo_paquete_texto1;
        if (!paquete) return;
        if (typeof paquete.text === "string" && paquete.text !== ultimo_texto1) {
            texto1.innerHTML = paquete.text;
            ultimo_texto1 = paquete.text;
        }
        puntos1.innerHTML = paquete.points;
        console.log("CAMBIADDOO")
        cambiar_color_puntuación()
        const caretLine = Number.isInteger(paquete.caretLine) ? paquete.caretLine : null;
        const caretRatio = typeof paquete.caretRatio === "number" ? paquete.caretRatio : null;
        const caretPos = typeof paquete.caretPos === "number"
            ? paquete.caretPos
            : (paquete.caretPos && typeof paquete.caretPos.caretPos === "number" ? paquete.caretPos.caretPos : null);
        const caretPath = Array.isArray(paquete.caretPath) ? paquete.caretPath : null;
        const caretOffset = Number.isInteger(paquete.caretOffset) ? paquete.caretOffset : null;
        if (caretPos !== null) {
            if (posicionarScrollPorCaretPosPreciso(texto1, caretPos)) {
                return;
            }
        }
        if (caretPath && caretOffset !== null) {
            if (posicionarScrollPorCaretPath(texto1, caretPath, caretOffset)) {
                return;
            }
        }
        if (caretPos !== null) {
            const maxPos = obtenerTextoPlanoConSaltos(texto1).length;
            if (maxPos > 0 && caretPos >= maxPos - 1) {
                texto1.scrollTop = texto1.scrollHeight;
                return;
            }
            posicionarScrollPorCaretPos(texto1, Math.max(0, Math.min(caretPos, maxPos)));
        } else if (caretLine !== null) {
            posicionarScrollPorLinea(texto1, caretLine);
        } else if (caretRatio !== null) {
            posicionarScrollPorRatio(texto1, caretRatio);
        }
        if (activado_psico1) {
            stylize();
        }
        /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.innerText = "\n" + texto2.innerText;
        }
    }*/
        texto1.style.height = "";
        if (caretPos === null) {
            texto1.scrollTop = texto1.scrollHeight;
        }
        //window.scrollTo(0, document.body.scrollHeight);
        //focalizador1.scrollIntoView(false);
    });
});

socket.on('texto2', data => {
    ultimo_paquete_texto2 = data;
    if (pendiente_texto2) return;
    pendiente_texto2 = true;
    requestAnimationFrame(() => {
        pendiente_texto2 = false;
        const paquete = ultimo_paquete_texto2;
        if (!paquete) return;
        if (typeof paquete.text === "string" && paquete.text !== ultimo_texto2) {
            texto2.innerHTML = paquete.text;
            ultimo_texto2 = paquete.text;
        }
        puntos2.innerHTML = paquete.points;
        cambiar_color_puntuación()
        const caretLine = Number.isInteger(paquete.caretLine) ? paquete.caretLine : null;
        const caretRatio = typeof paquete.caretRatio === "number" ? paquete.caretRatio : null;
        const caretPos = typeof paquete.caretPos === "number"
            ? paquete.caretPos
            : (paquete.caretPos && typeof paquete.caretPos.caretPos === "number" ? paquete.caretPos.caretPos : null);
        const caretPath = Array.isArray(paquete.caretPath) ? paquete.caretPath : null;
        const caretOffset = Number.isInteger(paquete.caretOffset) ? paquete.caretOffset : null;
        if (caretPos !== null) {
            if (posicionarScrollPorCaretPosPreciso(texto2, caretPos)) {
                return;
            }
        }
        if (caretPath && caretOffset !== null) {
            if (posicionarScrollPorCaretPath(texto2, caretPath, caretOffset)) {
                return;
            }
        }
        if (caretPos !== null) {
            const maxPos = obtenerTextoPlanoConSaltos(texto2).length;
            if (maxPos > 0 && caretPos >= maxPos - 1) {
                texto2.scrollTop = texto2.scrollHeight;
                return;
            }
            posicionarScrollPorCaretPos(texto2, Math.max(0, Math.min(caretPos, maxPos)));
        } else if (caretLine !== null) {
            posicionarScrollPorLinea(texto2, caretLine);
        } else if (caretRatio !== null) {
            posicionarScrollPorRatio(texto2, caretRatio);
        }
        if (activado_psico2) {
            stylize();
        }
        /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText

        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.innerText = "\n" + texto2.innerText
        }
    }*/
        texto2.style.height = "";
        if (caretPos === null) {
            texto2.scrollTop = texto2.scrollHeight;
        }
        //window.scrollTo(0, document.body.scrollHeight);
        //focalizador2.scrollIntoView(false);
    });
});

activar_sockets_extratextuales()

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", data => {
    if(data.player == 1){
    if (convertirASegundos(data.count) >= 20) {
        tiempo.style.color = "white";
    }
    if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
        console.log(convertirASegundos(data.count))
        LIMPIEZAS["psicodélico"](data, data.player);
        tiempo.style.color = "yellow";
    }
    if (10 > convertirASegundos(data.count) && activado_psico1 == false) {
        MODOS["psicodélico"](data, socket, data.player);
        tiempo.style.color = "red";
    }
    tiempo.innerHTML = data.count;
    actualizarBarraVida(tiempo, data.count);
    if(data.count == '¡Tiempo!'){
        LIMPIEZAS["psicodélico"](data, data.player);
        //confetti_aux()
        terminado = true;
        feedback1.innerHTML = "";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        explicación.innerHTML = "";
        palabra1.style.display = "none";
        definicion1.style.display = "none";
        explicación.style.display = "none";
        texto1.style.display = "none";
        tiempo.style.color = "white";
    }
    }

    if(data.player == 2){
        if (convertirASegundos(data.count) >= 20) {
            tiempo1.style.color = "white";
        }
        if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
            console.log(convertirASegundos(data.count))
            LIMPIEZAS["psicodélico"](data, data.player);
            tiempo1.style.color = "yellow";
        }
        if (10 > convertirASegundos(data.count) && activado_psico2 == false) {
            MODOS["psicodélico"](data, socket, data.player);
            tiempo1.style.color = "red";
        }
        tiempo1.innerHTML = data.count;
        actualizarBarraVida(tiempo1, data.count);
        if(data.count == '¡Tiempo!'){
            LIMPIEZAS["psicodélico"](data, data.player);
            terminado1 = true;
            feedback2.innerHTML = "";
            palabra2.innerHTML = "";
            definicion2.innerHTML = "";
            explicación1.innerHTML = "";
            palabra2.style.display = "none";
            definicion2.style.display = "none";
            explicación1.style.display = "none";

            texto2.style.display = "none";
            tiempo1.style.color = "white";
        }
    }
    if (terminado && terminado1) {

        confetti_aux();
        LIMPIEZAS[modo_actual](data);
        
        limpiezas_final();

        activar_sockets_extratextuales();
        //texto1.innerText = (texto1.innerText).substring(saltos_línea_alineacion_1, texto1.innerText.length);
        //texto2.innerText = (texto2.innerText).substring(saltos_línea_alineacion_2, texto2.innerText.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');


        //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
        //texto2.innerText = eliminar_saltos_de_linea(texto2.innerText); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto2.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
        texto2.style.height = (texto2.scrollHeight) + "px";// Reajustamos el tamaño del área de texto del j2.

        animateCSS(".cabecera", "backInLeft").then((message) => {
            animateCSS(".contenedor_espectador", "pulse");
        });
        logo.style.display = "";
        neon.style.display = "";
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "white";
        tiempo1.style.color = "white";
    }
});

socket.on('resucitar_control', data => {
    if(data.player == 1){
        terminado = false;
        palabra1.style.display = "";
        definicion1.style.display = "";
        explicación.style.display = "";
        texto1.style.display = "";
        ocultarResucitarMini(1);
    }
    else if(data.player == 2){
        terminado1 = false;
        palabra2.style.display = "";
        definicion2.style.display = "";
        explicación1.style.display = "";
        texto2.style.display = "";
        ocultarResucitarMini(2);
    }
});

socket.on('resucitar_menu', data => {
    actualizarResucitarMini(data);
});

// Array con los audios en el orden que quieres reproducir
var audios = [
  "../../game/audio/5. PREPARADOS 2.mp3",
  "../../game/audio/5. PREPARADOS 3.mp3",
  "../../game/audio/5. PREPARADOS 4.mp3",
  "../../game/audio/5. PREPARADOS 5.mp3"
];


// Inicia el juego.
socket.on('inicio', data => {
    if(sonido){
    sonido.pause();
    }
    cuenta_atras_activa = true;
    modo_pendiente = null;
    inicio_modo_delay = false;
    if (timeout_inicio_modo) {
      clearTimeout(timeout_inicio_modo);
      timeout_inicio_modo = null;
    }
    reproducirSonido("../../game/audio/5. PREPARADOS 1.mp3")
    animateCSS(".cabecera", "backOutLeft").then((message) => {
        inspiracion.style.display = "block";
        animateCSS(".contenedor_espectador", "pulse");
        animateCSS(".inspiracion", "pulse");
        TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR;
        socket.off('vote');
        socket.off('exit');
        socket.off('scroll');
        socket.off('temas_jugadores');
        //socket.off('recibir_comentario');
        socket.off('recibir_postgame1');
        socket.off('recibir_postgame2');
            logo.style.display = "none";
            neon.style.display = "none";

    // Comprobamos que data.parametros existe y que cada campo es string
if (data.parametros && typeof data.parametros.FRASE_FINAL_J1 === 'string') {
    // Sólo si existe y es string hacemos .trim()
    frase_final_j1 = data.parametros.FRASE_FINAL_J1.trim();
  }
  
  if (data.parametros && typeof data.parametros.FRASE_FINAL_J2 === 'string') {
    frase_final_j2 = data.parametros.FRASE_FINAL_J2.trim();
  }


    tiempo.innerHTML = "";
    tiempo1.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    actualizarBarraVida(tiempo1, tiempo1.innerHTML);
    tiempo.style.display = "";
    tiempo1.style.display = "";

    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "6";
    texto2.rows = "6";
    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADOS?</span>'); 
    preparados.appendTo($('.container'));
    timeout_countdown = setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);
    timeout_timer = setTimeout(() => {
        var counter = 3;
        var index   = 0; // Índice para recorrer el array de audios
        
        var timer = setInterval(function() {
          // Eliminamos el anterior #countdown para volverlo a crear
          $('#countdown').remove();
          
          // Creamos el nuevo elemento con el número o el texto final
          var countdown = $('<span id="countdown">'+ (counter === 0 ? '¡ESCRIBE!' : counter) +'</span>');
          countdown.appendTo($('.container'));
        
          // Pequeña pausa para aplicar el CSS que hace el efecto
          setTimeout(() => {
            if (counter > -1) {
              $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
            } else {
              $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
            }
          }, 20);
        
          // Reproducimos el siguiente sonido mientras haya disponibles en el array
          if (counter === 0) {
            if (index < audios.length) {
              reproducirSonido(audios[index]);
              index++;
            }
            cuenta_atras_activa = false;
            inicio_modo_delay = true;
            if (timeout_inicio_modo) {
              clearTimeout(timeout_inicio_modo);
            }
            timeout_inicio_modo = setTimeout(() => {
              inicio_modo_delay = false;
              timeout_inicio_modo = null;
              if (modo_pendiente) {
                aplicarModo(modo_pendiente);
                modo_pendiente = null;
              }
            }, 1000);
          } else if (index < audios.length) {
            reproducirSonido(audios[index]);
            index++;
          }
          
          counter--;
        
          // Cuando counter llega a -1, paramos el intervalo y quitamos el #countdown
          if (counter <= -1) {
            clearInterval(timer);
            setTimeout(() => {
              $('#countdown').remove();
            }, 1000);
          }
        
        }, 1000);
}, 1000);
});
});

socket.on('post-inicio', data => {
    if (sonido) {
        sonido.pause();
        sonido.currentTime = 0;
    }
    detenerTemporizadorGigante();
    
    limpiezas();

    texto1.style.display = "";
    texto2.style.display = "";
    palabra1.style.display = "";
    definicion1.style.display = "";
    explicación.style.display = "";
    palabra2.style.display = "";
    definicion2.style.display = "";
    explicación.style.display = "";
});

// Resetea el tablero de juego.
socket.on('limpiar', data => {
    detenerTemporizadorGigante();
    cuenta_atras_activa = false;
    modo_pendiente = null;
    inicio_modo_delay = false;
    if (timeout_inicio_modo) {
      clearTimeout(timeout_inicio_modo);
      timeout_inicio_modo = null;
    }

    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on('nombre2', data => {
        nombre2.value = data;
        actualizarEtiquetasCursorCalentamiento();
    });

    // Recibe el nombre del jugador 1 y lo coloca en su sitio.
    socket.on('nombre1', data => {
        nombre1.value = data;
        actualizarEtiquetasCursorCalentamiento();
    });
    // Vaciar cualquier contenido HTML del elemento con id 'countdown'
    $('#countdown').empty()
    clearTimeout(timeout_countdown);
    clearTimeout(timeout_timer);

    limpiezas();
    stopConfetti();
    temas.style.display = "none";
    temas.innerHTML = "";
    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */

    tiempo.style.display = "none";
    tiempo1.style.display = "none";
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor_espectador", "pulse");
    });
    logo.style.display = "";
    neon.style.display = "";
    inspiracion.style.display = "none";
    if(sonido) sonido.pause();
    //reproducirSonido("../../game/audio/1. MENU DE INICIO.mp3", true)
    activar_sockets_extratextuales();
});

socket.on('activar_modo', data => {
    if (cuenta_atras_activa || inicio_modo_delay) {
        modo_pendiente = data;
        return;
    }
    aplicarModo(data);
});

function aplicarModo(data) {
    animacion_modo();
    limpiarEstadoVotacionVentaja();
    LIMPIEZAS[modo_actual](data);
    modo_actual = data.modo_actual;
    MODOS[modo_actual](data);
    blueCount = 0;
    redCount = 0;
    updateBar();
}

socket.on('recibir_feedback_modificador', data => {
    if(data.player == 2){
        feedback2.innerHTML = getEl(data.id_mod).innerHTML;
        clearTimeout(delay_animacion);
        animateCSS(".feedback2", "flash").then((message) => {
            delay_animacion = setTimeout(function () {
                feedback2.innerHTML = "";
            }, 2000);
        });
        getEl(data.id_mod).style.display = "none";
    }
    else{
        feedback1.innerHTML = getEl(data.id_mod).innerHTML;
        clearTimeout(delay_animacion);
        animateCSS(".feedback1", "flash").then((message) => {
            delay_animacion = setTimeout(function () {
                feedback1.innerHTML = "";
            }, 2000);
        });
        getEl(data.id_mod.substring(0, data.id_mod.length - 1) + "1").style.display = "none";
    }
});

socket.on('enviar_palabra_j1', data => {
    recibir_palabra(data, 1);
});

socket.on('enviar_palabra_j2', data => {
    recibir_palabra(data, 2);
});

// Suscripción al evento 'inspirar_j1'
socket.on('inspirar_j1', data => {
    const palabra = typeof data === "string" ? data : data?.palabra;
    const musa_nombre = (data && typeof data === "object") ? (data.musa_nombre || data.musa) : "";
    if (!palabra) return;
    /*
      Usamos un template literal en una sola línea para evitar
      los espacios y saltos de línea inducidos por la indentación.
      De este modo, no quedan espacios antes o después de las comillas « ».
    */
    const musaLabel = musa_nombre ? escapeHtml(musa_nombre) : "MUSA";
    definicion2.innerHTML = `<span style="color: orange;">${musaLabel}</span><span style="color: white;">: </span><span style="color: white;">Podrías escribir la palabra «</span><span style="color: lime; text-decoration: underline;">${escapeHtml(palabra)}</span><span style="color: white;">»</span>`;
    aplicarMarqueeSiOverflow(definicion2);
    animateCSS(".definicion1", "flash");
});

// Suscripción al evento 'inspirar_j2'
socket.on('inspirar_j2', data => {
    const palabra = typeof data === "string" ? data : data?.palabra;
    const musa_nombre = (data && typeof data === "object") ? (data.musa_nombre || data.musa) : "";
    if (!palabra) return;
    /*
      Replica exacta del anterior, apuntando al elemento definicion3.
      Mantener coherencia en el formato garantiza que no aparezcan espacios 
      no deseados alrededor de «palabra».
    */
    const musaLabel = musa_nombre ? escapeHtml(musa_nombre) : "MUSA";
    definicion3.innerHTML = `<span style="color: orange;">${musaLabel}</span><span style="color: white;">: </span><span style="color: white;">Podrías escribir la palabra «</span><span style="color: lime; text-decoration: underline;">${escapeHtml(palabra)}</span><span style="color: white;">»</span>`;
    aplicarMarqueeSiOverflow(definicion3);
    animateCSS(".definicion2", "flash");
});

function recibir_palabra(data, escritxr) {
    const animateCSS = (element, animation, prefix = 'animate__') =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });

        if (escritxr == 1) {
            signo = (modo_actual == "palabras prohibidas") ? "-" : "+";
        
            palabra2.innerHTML = data.palabras_var + " (" + signo + data.tiempo_palabras_bonus + " segs.)";
            if (data.origen_musa === "musa") {
                const musaLabel = data.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA";
                definicion2.innerHTML = `<span style="color:lime;">${musaLabel}</span><span style="color: white;">: </span><span style='color: white;'>Podrías escribir esta palabra ⬆️</span>`;
            } else if (data.origen_musa === "musa_enemiga") {
                const musaLabel = data.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA ENEMIGA";
                definicion2.innerHTML = `<span style="color:red;">${musaLabel}</span>: <span style='color: orange;'>me pega esta palabra ⬆️</span>`;
            } else {
                definicion2.innerHTML = data.palabra_bonus[1];
            }
            aplicarMarqueeSiOverflow(definicion2);
        
            animateCSS(".explicación1", "bounceInLeft");
            animateCSS(".palabra1", "bounceInLeft");
            animateCSS(".definicion1", "bounceInLeft");
        }
        
    else{
        signo = (modo_actual == "palabras prohibidas") ? "-" : "+";
        palabra3.innerHTML = data.palabras_var + " (" + signo + data.tiempo_palabras_bonus + " segs.)"
        if (data.origen_musa === "musa") {
            const musaLabel = data.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA";
            definicion3.innerHTML = `<span style="color:lime;">${musaLabel}</span><span style="color: white;">: </span><span style='color: white;'>Podrías escribir esta palabra ⬆️</span>`;
        } else if (data.origen_musa === "musa_enemiga") {
            const musaLabel = data.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA ENEMIGA";
            definicion3.innerHTML = `<span style="color:red;">${musaLabel}</span>: <span style='color: orange;'>me pega esta palabra ⬆️</span>`;
        } else {
            definicion3.innerHTML = data.palabra_bonus[1];
        }
        aplicarMarqueeSiOverflow(definicion3);
           
        animateCSS(".explicación2", "bounceInLeft");
        animateCSS(".palabra2", "bounceInLeft");
        animateCSS(".definicion2", "bounceInLeft");
    }
}

socket.on('feedback_a_j2', data => {
    var feedback = document.querySelector(".feedback1");
    feedback.style.color = data.color;
    feedback.innerHTML = data.tiempo_feed.toString();

    console.log(data.tiempo_feed)
    console.log(data.tipo)
    console.log(modo_actual)

    if (data.tipo == "borrar") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }

    if(data.tipo == "inspiracion"){
        if(modo_actual == "letra bendita" || modo_actual == "letra prohibida" || modo_actual == "palabras bonus" ){
        reproducirSonido("../../game/audio/GANAR PALABRA.mp3")
          increment('blue');
        }
        
        if(modo_actual == "palabras prohibidas"){
            reproducirSonido("../../game/audio/PERDER PALABRA.mp3")
            increment('red');
        }
    }

    if (data.tipo == "lista_prohibidas" || data.tipo == "letra_prohibida") {
        reproducirSonido("../../game/audio/PERDER PALABRA.mp3");

    }

    if (data.tipo == "rae" || data.tipo == "letra_bendita") {
            reproducirSonido("../../game/audio/GANAR PALABRA.mp3")
    }

    if (data.tipo == "perder_tiempo") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }
    // Si empieza por "⏱️+" (ej.: "⏱️+2 segs." o "⏱️+6 segs.")
    if (data.tipo == "ganar_tiempo") {
        reproducirSonido("../../game/audio/GANAR 2 SEG.mp3");

    }
    const animateCSS = (element, animation, prefix = 'animate__') =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });

    animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    });
});

socket.on('feedback_a_j1', data => {
    var feedback1 = document.querySelector(".feedback2");
    feedback1.style.color = data.color;
    feedback1.innerHTML = data.tiempo_feed.toString();

    console.log(data.tiempo_feed)
    console.log(data.tipo)
    console.log(modo_actual)

    if (data.tipo == "borrar") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }

    if(data.tipo == "inspiracion"){
        if(modo_actual == "letra bendita" || modo_actual == "letra prohibida" || modo_actual == "palabras bonus" ){
        reproducirSonido("../../game/audio/GANAR PALABRA.mp3")
          increment('red');
        }
        
        if(modo_actual == "palabras prohibidas"){
            reproducirSonido("../../game/audio/PERDER PALABRA.mp3")
            increment('blue');
        }
    }

    if (data.tipo == "lista_prohibidas" || data.tipo == "letra_prohibida") {
        reproducirSonido("../../game/audio/PERDER PALABRA.mp3");

    }

    if (data.tipo == "rae" || data.tipo == "letra_bendita") {
            reproducirSonido("../../game/audio/GANAR PALABRA.mp3")
    }

    if (data.tipo == "perder_tiempo") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }
    // Si empieza por "⏱️+" (ej.: "⏱️+2 segs." o "⏱️+6 segs.")
    if (data.tipo == "ganar_tiempo") {
        reproducirSonido("../../game/audio/GANAR 2 SEG.mp3");

    }

    const animateCSS = (element, animation, prefix = 'animate__') =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".feedback2", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    });
});

socket.on('recibir_comentario', data => {
    tema.innerHTML = data;
});

socket.on('fin', data => {
        detenerSonidosDesventaja();
        //confetti_aux();
});

socket.on("enviar_repentizado", repentizado => {
    //temas.innerHTML = "⚠️ "+ repentizado + " ⚠️";
    //animateCSS(".temas", "flash")
});

socket.on("enviar_ventaja_j1", putada => {
    limpiarEstadoVotacionVentaja();
    PUTADAS[putada](1);
    feedback1.innerHTML = putada + " <span style='color: red;'>¡DESVENTAJA!</span>";
    animateCSS(".feedback1", "flash").then((message) => {
        setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    });
    feedback2.innerHTML = putada + " <span style='color: lime;'>¡VENTAJA!</span>";
    animateCSS(".feedback2", "flash").then((message) => {
        setTimeout(function () {
            feedback2.innerHTML = "";
        }, 2000);
    });  
});

socket.on("enviar_ventaja_j2", putada => {
    limpiarEstadoVotacionVentaja();
    PUTADAS[putada](2);
    feedback2.innerHTML = putada + " <span style='color: red;'>¡DESVENTAJA!</span>";;
    animateCSS(".feedback2", "flash").then((message) => {
        setTimeout(function () {
            feedback2.innerHTML = "";
        }, 2000);
    }); 
    feedback1.innerHTML = putada + " <span style='color: lime;'>¡VENTAJA!</span>";
    animateCSS(".feedback1", "flash").then((message) => {
        setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    }); 
});

socket.on("nueva letra", letra => {
    definicion2.innerHTML = "";
    definicion3.innerHTML = "";

    if(modo_actual == "letra prohibida"){
        animacion_modo();
        palabra1.innerHTML = "LETRA PROHIBIDA: " + letra;
        }
    else if(modo_actual == "letra bendita"){
        animacion_modo();
        palabra1.innerHTML = "LETRA BENDITA: " + letra;
    }
});

socket.on('elegir_ventaja_j1', () => {
    confetti_musas(0.25);
    temas.innerHTML = "";
    temas.style.display = "";
    iniciarAnimacionesSegunCondicion("azul");
    
});

socket.on('elegir_ventaja_j2', () => {
    confetti_musas(0.75);
    temas.innerHTML = "";
    temas.style.display = "";
    iniciarAnimacionesSegunCondicion("rojo");
});

//FUNCIONES AUXILIARES.

function reproducirSonido(rutaArchivo, loop = false) {
    // Creamos una nueva instancia de Audio con la ruta proporcionada
    sonido = new Audio(rutaArchivo);

    // Configuramos el bucle según el parámetro 'loop'
    sonido.loop = loop;

    // Intentamos reproducir el sonido
    // Si el navegador requiere interacción del usuario,
    // esta promesa puede fallar (por ejemplo, en navegadores móviles).
    sonido.play().catch(error => {
      console.error('No se pudo reproducir el audio:', error);
    });
    return sonido;
  }

// Referencias a los elementos
// Variables para guardar los IDs de intervalo si es necesario detenerlos después

// Ejemplo: iniciar animaciones según un estado o condición
function iniciarAnimacionesSegunCondicion(condicion) {
  if (condicion === "azul") {
    // Inicia animación para musas azules
    Temasinterval = startDotAnimation(temas,'MUSAS <span style="color:aqua;">AZULES</span> ELIGIENDO <span style="color:lime;">VENTAJA</span>');
  } else if (condicion === "rojo") {
    // Inicia animación para musas rojas
    Temasinterval = startDotAnimation(temas,   'MUSAS <span style="color:red;">ROJAS</span> ELIGIENDO <span style="color:lime;">VENTAJA</span>');
  }
}

function startDotAnimation(element, baseText, maxDots = 3, intervalTime = 500) {
    let dotCount = 0;
  
    // Configura y guarda el intervalo
    animateCSS(".temas", "flash");
    element.style.color = 'orange';
    element.style.fontSize = '1.5em';
    const intervalId = setInterval(() => {
      dotCount = (dotCount + 1) % (maxDots + 1);
      element.innerHTML = baseText + ".".repeat(dotCount);
    }, intervalTime);
  
    return intervalId;
  }

  function limpiarEstadoVotacionVentaja() {
    temas.innerHTML = "";
    temas.style.display = "";
    if (Temasinterval) {
        clearInterval(Temasinterval);
        Temasinterval = null;
    }
  }

function activar_sockets_extratextuales() {

    // Abre la votación de los textos.
    socket.on('vote', data => {
        ventana = window.open("https://www.mentimeter.com/s/0f9582fcdbab7e15216ee66df67113d6/f14a05785a97", '_blank')
    });

    // Cierra la votación de los textos.
    socket.on('exit', data => {
        ventana.close();
    });

    // Realiza el scroll.
    socket.on('scroll', data => {
        if (data == "arriba") {
            window.scrollBy(0, -50);
        }
        else {
            window.scrollBy(0, 50);
        }
    });

    socket.on('scroll_sincro', data => {
        window.scrollTo({ top: 0});
    });

/*
    socket.on('impro', data => {
        if(data){
            document.getElementById("contenedor_espectador").style.display = "none";
            tiempo.style.display = "none";
            tiempo1.style.display = "none";
        }
        else{
            document.getElementById("contenedor_espectador").style.display = "";
            tiempo.style.display = "";
            tiempo1.style.display = "none";

        }
    });
*/
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on('nombre2', data => {
        nombre2.value = data;
        actualizarEtiquetasCursorCalentamiento();
    });

    // Recibe el nombre del jugador 1 y lo coloca en su sitio.
    socket.on('nombre1', data => {
        nombre1.value = data;
        actualizarEtiquetasCursorCalentamiento();
    });

    /*
    Recibe los temas y llama a la función erm() para
    elegir uno aleatoriamente.
    */
    socket.on('temas_espectador', data => {
        temas = data;
        erm();
    });



    /*socket.on("recibir_postgame1", (data) => {
        focalizador2.innerHTML = "<br>🖋️ Caracteres escritos = " + data.longitud + "<br>📚 Palabras bonus = " + data.puntos_palabra + "<br>❌ Letra prohibida = " + data.puntos_letra_prohibida + "<br>😇 Letra bendita = " + data.puntos_letra_bendita;
    });

    socket.on("recibir_postgame2", (data) => {
        focalizador1.innerHTML = "<br>🖋️ Caracteres escritos = " + data.longitud + "<br>📚 Palabras bonus = " + data.puntos_palabra + "<br>❌ Letra prohibida = " + data.puntos_letra_prohibida + "<br>😇 Letra bendita = " + data.puntos_letra_bendita;
    });*/
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
    var fontFamilies = ["Impact", "Georgia", "Tahoma", "Verdana", "Impact", "Marlet"]; // Add more
    return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
}

function getTextAlign() {
    var aligns = ["center", "left", "right", "justify"]; // Add more
    return aligns[Math.floor(Math.random() * aligns.length)];
}

function stylize() {
    //texto1.style.fontFamily = getRandFontFamily();
    texto1.style.color = getRandColor();
    //var tamaño_letra = getRandNumber(7, 35)
    //text.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = getTextAlign();
    //texto2.style.textAlign = getTextAlign();
    //texto2.style.fontFamily = getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    document.body.style.backgroundColor = getRandColor();
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
    document.body.style.backgroundColor = getRandColor();
}


function animacion_modo() {
    const animateCSS = (element, animation, prefix = 'animate__') =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

// Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
function restablecer_estilo() {
    //texto1.style.fontFamily = "monospace";
    texto1.style.color = "white";
    //texto1.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = "justify";
    //texto2.style.fontFamily = "monospace";
    texto2.style.color = "white";
    //texto2.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto2.style.textAlign = "justify";
    document.body.style.backgroundColor = "black";
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
}

// Función auxiliar que elimina los saltos de línea al principio de un string.
function eliminar_saltos_de_linea(texto) {
    var i = 0;
    while (texto[i] == "\n") {
        i++;
    }
    return (texto.substring(i, texto.length));
}

// Función auxiliar que genera un string con n saltos de línea.
function crear_n_saltos_de_linea(n) {
    var saltos = "";
    var cont = 0;
    while (cont <= n) {
        saltos += "\n";
        cont++;
    }
    return saltos;
}

// FUNCIONES AUXILIARES PARA LA ELECCIÓN ALEATORIA DEL TEMA.
(function ($) {

    $.fn.wordsrotator = function (options) {
        var defaults = {
            autoLoop: true,
            randomize: false,
            stopOnHover: false,
            changeOnClick: false,
            words: null,
            animationIn: "flipInY",
            animationOut: "flipOutY",
            speed: 40,
            onRotate: function () { },//you add these 2 methods to allow the effetct
            stopRotate: function () { }

        };
        var settings = $.extend({}, defaults, options);
        var listItem
        var array_bak = [];
        var stopped = false;

        settings.stopRotate = function () {//you call this one to stop rotate 
            stopped = true;
        }

        return this.each(function () {
            var el = $(this)
            var cont = $("#" + el.attr("id"));
            var array = [];

            //if array is not empty
            if ((settings.words) || (settings.words instanceof Array)) {
                array = $.extend(true, [], settings.words);

                //In random order, need a copy of array
                if (settings.randomize) array_bak = $.extend(true, [], array);

                listItem = 0
                //if randomize pick a random value for the list item
                if (settings.randomize) listItem = Math.floor(Math.random() * array.length)

                //init value into container
                cont.html(array[listItem]);

                // animation option
                var rotate = function () {
                    data = array[listItem]
                    socket.emit('envia_temas', array[listItem]);
                    cont.html("<span id='temas'><span>" + array[listItem] + "</span></span>");
                    texto1.focus();

                    if (settings.randomize) {
                        //remove printed element from array
                        array.splice(listItem, 1);
                        //refill the array from his copy, if empty
                        if (array.length == 0) array = $.extend(true, [], array_bak);
                        //generate new random number
                        listItem = Math.floor(Math.random() * array.length);
                    } else {
                        //if reached the last element of the array, reset the index 
                        if (array.length == listItem + 1) listItem = -1;
                        //move to the next element
                        listItem++;
                    }

                    settings.onRotate(); //this callback will allow to change the speed

                    if (settings.autoLoop && !stopped) {
                        //using timeout instead of interval will allow to change the speed
                        t = setTimeout(function () {
                            rotate()
                        }, settings.speed, function () {
                            rotate()
                        });
                        if (settings.stopOnHover) {
                            cont.hover(function () {
                                window.clearTimeout(t)
                            }, function () {
                                t = setTimeout(rotate, settings.speed, rotate);

                            });
                        };
                    }
                };

                t = setTimeout(function () {
                    rotate()
                }, settings.speed, function () {
                    rotate()
                })
                cont.on("click", function () {
                    if (settings.changeOnClick) {
                        rotate();
                        return false;
                    };
                });
            };

        });
    }

}(jQuery));

function eventFire(el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}

function erm() {
    $(function () {
        $("#temas").wordsrotator({
            animationIn: "fadeOutIn", //css class for entrace animation
            animationOut: "fadeOutDown", //css class for exit animation
            randomize: true,
            stopOnHover: false, //stop animation on hover
            words: temas,
            onRotate: function () {
                //on each rotate you make the timeout longer, until it's slow enough
                if (this.speed < 600) {
                    this.speed += 20;
                } else {
                    this.stopRotate();
                }
            }
        });
    });
    eventFire(document.getElementById('temas'), 'click');
}

function cambiar_color_puntuación() {
    if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) > parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        puntos1.style.color = "greenyellow";
        puntos2.style.color = "red";
        if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) == parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
            puntos2.style.color = "greenyellow";
        }
    }
    else {
        puntos1.style.color = "red";
        puntos2.style.color = "greenyellow";
    }
}

function limpiezas(){

    detenerSonidosDesventaja();

    clearTimeout(listener_cuenta_atras);
    clearTimeout(tempo_text_inverso1);
    clearTimeout(tempo_text_inverso2);
    clearTimeout(tempo_text_borroso1);
    clearTimeout(tempo_text_borroso2);
    if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
        sonido_modo.pause();
    }

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");

    clearInterval(timer)
    limpiarEstadoVotacionVentaja();
    terminado = false;
    terminado1 = false;

    feedback1.innerHTML = "";
    feedback2.innerHTML = "";

    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicación.innerHTML = "";
    palabra2.innerHTML = "";
    definicion2.innerHTML = "";
    explicación1.innerHTML = "";
    palabra3.innerHTML = "";
    definicion3.innerHTML = "";
    explicación2.innerHTML = "";

    
    texto1.innerText = "";
    texto2.innerText = "";
    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";
    texto1.style.display = "none";
    texto2.style.display = "none";

    puntos1.innerHTML = 0 + " palabras";
    puntos2.innerHTML = 0 + " palabras";
    
    texto1.classList.remove('textarea_blur');
    texto2.classList.remove('textarea_blur');
    

    focalizador1.innerHTML = "";
    focalizador2.innerHTML = "";

    for (let key in LIMPIEZAS) { 
        LIMPIEZAS[key]();
    }

    feedback_tiempo.style.color = color_positivo;
    feedback_tiempo1.style.color = color_positivo;

    blueCount = 0;
    redCount = 0;
    updateBar();
}

function limpiezas_final(){

    if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
        sonido_modo.pause();
    }

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");

    temas.style.display = "none";
    temas.innerHTML = "";
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicación.innerHTML = "";
    palabra2.innerHTML = "";
    definicion2.innerHTML = "";
    explicación1.innerHTML = "";
    palabra3.innerHTML = "";
    definicion3.innerHTML = "";
    explicación2.innerHTML = "";
    inspiracion.style.display = "none";

    tiempo.style.color = "white";
    tiempo1.style.color = "white";

    texto1.innerText = "";
    texto2.innerText = "";
    texto1.style.display = "none";
    texto2.style.display = "none";


    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";

    texto1.classList.remove('textarea_blur');
    texto2.classList.remove('textarea_blur');

    LIMPIEZAS["psicodélico"]("");

    feedback_tiempo.style.color = color_positivo;  
    feedback_tiempo1.style.color = color_positivo;

    clearTimeout(listener_cuenta_atras);
    clearTimeout(tempo_text_inverso1);
    clearTimeout(tempo_text_inverso2);
    clearTimeout(tempo_text_borroso1);
    clearTimeout(tempo_text_borroso2);

    detenerSonidosDesventaja();

    blueCount = 0;
    redCount = 0;
    updateBar();
    limpiarEstadoVotacionVentaja();
}

var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecución

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function confetti_aux() {

    sonido_confetti = reproducirSonido("../../game/audio/CELEBRACION con explosiones.mp3")
    
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
    if(sonido_confetti_musa) sonido_confetti_musa.pause();
    if(sonido_confetti) sonido_confetti.pause();

  isConfettiRunning = false; // Deshabilita la ejecución de confetti
  confetti.reset(); // Detiene la animación de confetti
}

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

  function confetti_musas(pos){

    sonido_confetti_musa = reproducirSonido("../../game/audio/FX/9. ESTRELLAS.mp3")
    
    var scalar = 2;
    var unicorn = confetti.shapeFromText({ text: '⭐', scalar });
    isConfettiRunning = true; // Habilita la ejecución de confetti
    var end = Date.now() + (2 * 1000);
    
    (function frame() {
      confetti({
        startVelocity: 10,
        particleCount: 1,
        angle: 270,
        spread: 1000,
        origin: { y: 0, x: pos },
        shapes: [unicorn],
        scalar: 3
      });
    
      if ((Date.now() < end) && isConfettiRunning) {
        requestAnimationFrame(frame);
      }
    }());
    }

// Función para actualizar la barra
function updateBar() {
    const total = blueCount + redCount;
    let bluePercentage, redPercentage;

    if (total === 0) {
        bluePercentage = 50;
        redPercentage = 50;
    } else {
        bluePercentage = (blueCount / total) * 100;
        redPercentage = (redCount / total) * 100;
    }

    const blueSegment = document.querySelector('.bar-segment.blue');
    const redSegment = document.querySelector('.bar-segment.red');
    const blueText = blueSegment.querySelector('.percentage-text');
    const redText = redSegment.querySelector('.percentage-text');

    blueSegment.style.width = `${bluePercentage}%`;
    redSegment.style.width = `${redPercentage}%`;

    // Ajuste dinámico del tamaño de la fuente en vw
    const baseFontSize = 0.5; // Tamaño de fuente base en vw
    const maxFontSize = 2; // Tamaño de fuente máximo en vw
    const blueFontSize = Math.min(baseFontSize + (bluePercentage / 100) * (maxFontSize - baseFontSize), maxFontSize);
    const redFontSize = Math.min(baseFontSize + (redPercentage / 100) * (maxFontSize - baseFontSize), maxFontSize);

    // Eliminar ".00" si el valor es un número entero
    if (Number.isInteger(bluePercentage)) {
        blueText.innerHTML = `${bluePercentage} %`;
    } else {
        blueText.innerHTML = `${bluePercentage.toFixed(0)} %`;
    }
    blueText.style.fontSize = `${blueFontSize}vw`;

    if (Number.isInteger(redPercentage)) {
        redText.innerHTML = `${redPercentage} %`;
    } else {
        redText.innerHTML = `${redPercentage.toFixed(0)} %`;
    }
    redText.style.fontSize = `${redFontSize}vw`;
}


function increment(color) {
    if (inspiracion && inspiracion.style.display !== "block") {
        inspiracion.style.display = "block";
    }
    if (color === 'blue') {
        blueCount++;
    } else if (color === 'red') {
        redCount++;
    }
    updateBar();
}

// Inicialización con valores iniciales
blueCount = 0;
redCount = 0;
updateBar();

// Función para establecer la posición del caret
function establecerPosicionCaret(node, pos) {
    const range = document.createRange();
    const selection = window.getSelection();
    let offset = pos;

    function setRange(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.length >= offset) {
                range.setStart(node, offset);
                return true;
            } else {
                offset -= node.length;
            }
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (setRange(node.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    setRange(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

// Función para centrar el scroll en la posición del caret
function centrarScroll(node, pos) {
    const range = document.createRange();
    const selection = window.getSelection();
    let offset = pos;

    function setRange(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.length >= offset) {
                range.setStart(node, offset);
                return true;
            } else {
                offset -= node.length;
            }
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (setRange(node.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    setRange(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Centramos el scroll en la posición del caret
    const caretPosition = range.getBoundingClientRect();
    const containerPosition = node.getBoundingClientRect();
    offset = caretPosition.top - containerPosition.top;
    node.scrollTop = offset - node.clientHeight / 2;
}

const mirrors = new WeakMap();

const TAGS_SALTO_LINEA = new Set(["BR", "DIV", "P", "LI"]);

function obtenerTextoPlanoConSaltos(contenedor) {
    let texto = "";
    function recorrer(nodo, esRaiz) {
        if (nodo.nodeType === Node.TEXT_NODE) {
            texto += nodo.textContent;
            return;
        }
        if (nodo.nodeType !== Node.ELEMENT_NODE) return;
        const tag = nodo.tagName;
        if (tag === "BR") {
            texto += "\n";
            return;
        }
        const hijos = nodo.childNodes;
        if (!hijos || hijos.length === 0) {
            if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
                texto += "\n";
            }
            return;
        }
        for (let i = 0; i < hijos.length; i++) {
            recorrer(hijos[i], false);
        }
        if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
            if (texto.length === 0 || texto[texto.length - 1] !== "\n") {
                texto += "\n";
            }
        }
    }
    recorrer(contenedor, true);
    return texto;
}

function prepararMirror(contenedor) {
    let mirror = mirrors.get(contenedor);
    if (!mirror) {
        mirror = document.createElement("div");
        mirror.setAttribute("data-mirror", "caret");
        mirror.style.position = "absolute";
        mirror.style.top = "0";
        mirror.style.left = "-99999px";
        mirror.style.visibility = "hidden";
        mirror.style.pointerEvents = "none";
        mirror.style.margin = "0";
        document.body.appendChild(mirror);
        mirrors.set(contenedor, mirror);
    }
    const estilos = getComputedStyle(contenedor);
    mirror.style.fontFamily = estilos.fontFamily;
    mirror.style.fontSize = estilos.fontSize;
    mirror.style.fontWeight = estilos.fontWeight;
    mirror.style.letterSpacing = estilos.letterSpacing;
    mirror.style.wordSpacing = estilos.wordSpacing;
    mirror.style.lineHeight = estilos.lineHeight;
    mirror.style.whiteSpace = estilos.whiteSpace;
    mirror.style.wordBreak = estilos.wordBreak;
    mirror.style.overflowWrap = estilos.overflowWrap;
    mirror.style.padding = estilos.padding;
    mirror.style.border = estilos.border;
    mirror.style.boxSizing = estilos.boxSizing;
    mirror.style.width = `${contenedor.clientWidth}px`;
    return mirror;
}

function posicionarScrollPorCaretPosPreciso(contenedor, caretPos) {
    if (!Number.isInteger(caretPos)) return false;
    if (contenedor.clientHeight === 0) return false;

    const mirror = prepararMirror(contenedor);
    const textoPlano = obtenerTextoPlanoConSaltos(contenedor);
    mirror.textContent = textoPlano;

    const total = textoPlano.length;
    const pos = Math.max(0, Math.min(caretPos, total));
    const lineHeight = Math.max(
        parseFloat(getComputedStyle(contenedor).lineHeight) || 0,
        16
    );

    if (!mirror.firstChild) {
        contenedor.scrollTop = 0;
        return true;
    }

    const textNode = mirror.firstChild;
    const range = document.createRange();
    range.setStart(textNode, pos);
    range.collapse(true);

    const marker = document.createElement("span");
    marker.setAttribute("data-caret-marker", "1");
    marker.style.display = "inline-block";
    marker.style.width = "0px";
    marker.style.height = `${lineHeight}px`;
    marker.style.padding = "0";
    marker.style.margin = "0";
    marker.style.pointerEvents = "none";
    marker.style.verticalAlign = "text-bottom";
    range.insertNode(marker);

    const rect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    marker.remove();

    if (!rect || (!rect.height && !rect.width)) {
        return false;
    }

    const padding = lineHeight * 0.2;
    const offsetTop = rect.top - mirrorRect.top;
    const target = offsetTop - (contenedor.clientHeight - lineHeight - padding);
    const maxScroll = Math.max(0, contenedor.scrollHeight - contenedor.clientHeight);
    contenedor.scrollTop = Math.max(0, Math.min(target, maxScroll));
    return true;
}

function obtenerNodoPorRuta(raiz, ruta) {
    let actual = raiz;
    for (let i = 0; i < ruta.length; i++) {
        if (!actual || !actual.childNodes || !actual.childNodes[ruta[i]]) {
            return null;
        }
        actual = actual.childNodes[ruta[i]];
    }
    return actual;
}

function obtenerPrimerTexto(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.TEXT_NODE) return nodo;
    for (let i = 0; i < nodo.childNodes.length; i++) {
        const encontrado = obtenerPrimerTexto(nodo.childNodes[i]);
        if (encontrado) return encontrado;
    }
    return null;
}

function obtenerUltimoTexto(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.TEXT_NODE) return nodo;
    for (let i = nodo.childNodes.length - 1; i >= 0; i--) {
        const encontrado = obtenerUltimoTexto(nodo.childNodes[i]);
        if (encontrado) return encontrado;
    }
    return null;
}

function obtenerNodoTextoCercano(nodo, offset) {
    if (nodo.nodeType === Node.TEXT_NODE) {
        return { nodo, offset: Math.min(offset, nodo.length) };
    }
    if (nodo.nodeType !== Node.ELEMENT_NODE) return null;
    const hijos = nodo.childNodes;
    if (!hijos || hijos.length === 0) return null;
    const anterior = offset > 0 ? hijos[offset - 1] : null;
    const siguiente = offset < hijos.length ? hijos[offset] : null;
    const textoAnterior = obtenerUltimoTexto(anterior);
    if (textoAnterior) {
        return { nodo: textoAnterior, offset: textoAnterior.length };
    }
    const textoSiguiente = obtenerPrimerTexto(siguiente);
    if (textoSiguiente) {
        return { nodo: textoSiguiente, offset: 0 };
    }
    return null;
}

function obtenerPrimerBr(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.ELEMENT_NODE && nodo.tagName === "BR") return nodo;
    if (!nodo.childNodes) return null;
    for (let i = 0; i < nodo.childNodes.length; i++) {
        const encontrado = obtenerPrimerBr(nodo.childNodes[i]);
        if (encontrado) return encontrado;
    }
    return null;
}

function obtenerUltimoBr(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.ELEMENT_NODE && nodo.tagName === "BR") return nodo;
    if (!nodo.childNodes) return null;
    for (let i = nodo.childNodes.length - 1; i >= 0; i--) {
        const encontrado = obtenerUltimoBr(nodo.childNodes[i]);
        if (encontrado) return encontrado;
    }
    return null;
}

function obtenerRectanguloPorBr(nodo, offset) {
    if (!nodo || nodo.nodeType !== Node.ELEMENT_NODE) return null;
    const hijos = nodo.childNodes;
    if (!hijos || hijos.length === 0) return null;
    const anterior = offset > 0 ? hijos[offset - 1] : null;
    const siguiente = offset < hijos.length ? hijos[offset] : null;
    const brAnterior = obtenerUltimoBr(anterior);
    if (brAnterior) {
        const rect = brAnterior.getBoundingClientRect();
        if (rect && (rect.height || rect.width)) return rect;
    }
    const brSiguiente = obtenerPrimerBr(siguiente);
    if (brSiguiente) {
        const rect = brSiguiente.getBoundingClientRect();
        if (rect && (rect.height || rect.width)) return rect;
    }
    const brInterno = obtenerUltimoBr(nodo);
    if (brInterno) {
        const rect = brInterno.getBoundingClientRect();
        if (rect && (rect.height || rect.width)) return rect;
    }
    return null;
}

function obtenerRectanguloRange(range) {
    const rects = range.getClientRects();
    if (rects.length > 0) return rects[0];
    const rect = range.getBoundingClientRect();
    if (rect && (rect.height || rect.width)) return rect;
    const nodo = range.startContainer;
    if (nodo && nodo.nodeType === Node.TEXT_NODE && nodo.length > 0) {
        const clone = range.cloneRange();
        if (range.startOffset > 0) {
            clone.setStart(nodo, range.startOffset - 1);
            clone.setEnd(nodo, range.startOffset);
        } else {
            clone.setStart(nodo, 0);
            clone.setEnd(nodo, Math.min(1, nodo.length));
        }
        const rectsClone = clone.getClientRects();
        if (rectsClone.length > 0) return rectsClone[0];
        const rectClone = clone.getBoundingClientRect();
        if (rectClone && (rectClone.height || rectClone.width)) return rectClone;
    }
    return null;
}

function ajustarScrollPorRect(contenedor, rect) {
    const contRect = contenedor.getBoundingClientRect();
    const lineHeight = Math.max(
        rect.height || 0,
        parseFloat(getComputedStyle(contenedor).lineHeight) || 0,
        16
    );
    const padding = lineHeight * 0.2;
    const target = (rect.top - contRect.top) - (contenedor.clientHeight - lineHeight - padding);
    const maxScroll = Math.max(0, contenedor.scrollHeight - contenedor.clientHeight);
    contenedor.scrollTop = Math.max(0, Math.min(target, maxScroll));
}

function posicionarScrollPorCaretPath(contenedor, ruta, offset) {
    const nodo = obtenerNodoPorRuta(contenedor, ruta);
    if (!nodo) return false;
    const range = document.createRange();
    if (nodo.nodeType === Node.TEXT_NODE) {
        const off = Math.max(0, Math.min(offset, nodo.length));
        range.setStart(nodo, off);
    } else if (nodo.nodeType === Node.ELEMENT_NODE) {
        const off = Math.max(0, Math.min(offset, nodo.childNodes.length));
        const cercano = obtenerNodoTextoCercano(nodo, off);
        if (cercano) {
            range.setStart(cercano.nodo, cercano.offset);
        } else {
            range.setStart(nodo, off);
        }
    } else {
        return false;
    }
    range.collapse(true);
    let rect = obtenerRectanguloRange(range);
    if (!rect && nodo.nodeType === Node.ELEMENT_NODE) {
        const off = Math.max(0, Math.min(offset, nodo.childNodes.length));
        rect = obtenerRectanguloPorBr(nodo, off);
    }
    if (!rect) {
        contenedor.scrollTop = contenedor.scrollHeight;
        return true;
    }
    ajustarScrollPorRect(contenedor, rect);
    return true;
}

function posicionarScrollPorRatio(node, ratio) {
    const lineHeight = Math.max(
        parseFloat(getComputedStyle(node).lineHeight) || 0,
        16
    );
    const padding = lineHeight * 0.2;
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
    const caretOffset = ratio * node.scrollHeight;
    const target = caretOffset - (node.clientHeight - lineHeight - padding);
    node.scrollTop = Math.max(0, Math.min(target, maxScroll));
}

function posicionarScrollPorLinea(node, linea) {
    const lineHeight = Math.max(
        parseFloat(getComputedStyle(node).lineHeight) || 0,
        16
    );
    const padding = lineHeight * 0.2;
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
    const offset = linea * lineHeight;
    const target = offset - (node.clientHeight - lineHeight - padding);
    node.scrollTop = Math.max(0, Math.min(target, maxScroll));
}

function posicionarScrollPorCaretPos(contenedor, pos) {
    const range = document.createRange();
    let restante = pos;
    let encontrado = false;

    function recorrer(nodo) {
        if (encontrado) return;
        if (nodo.nodeType === Node.TEXT_NODE) {
            const len = nodo.textContent.length;
            if (restante <= len) {
                range.setStart(nodo, restante);
                encontrado = true;
                return;
            }
            restante -= len;
            return;
        }
        if (nodo.nodeType === Node.ELEMENT_NODE) {
            if (nodo.tagName === "BR") {
                if (restante === 0) {
                    range.setStartBefore(nodo);
                    encontrado = true;
                    return;
                }
                restante -= 1;
                return;
            }
            for (let i = 0; i < nodo.childNodes.length; i++) {
                recorrer(nodo.childNodes[i]);
                if (encontrado) return;
            }
        }
    }

    recorrer(contenedor);
    if (!encontrado) {
        range.selectNodeContents(contenedor);
        range.collapse(false);
    } else {
        range.collapse(true);
    }

    const rect = obtenerRectanguloRange(range);
    if (!rect) {
        contenedor.scrollTop = contenedor.scrollHeight;
        return false;
    }
    ajustarScrollPorRect(contenedor, rect);
    return true;
}

function posicionarScrollEnUltimaLinea(node, pos) {
    const range = document.createRange();
    let offset = pos;

    function setRange(nodeActual) {
        if (nodeActual.nodeType === Node.TEXT_NODE) {
            if (nodeActual.length >= offset) {
                range.setStart(nodeActual, offset);
                return true;
            }
            offset -= nodeActual.length;
        } else {
            for (let i = 0; i < nodeActual.childNodes.length; i++) {
                if (setRange(nodeActual.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    if (!setRange(node)) return;
    range.collapse(true);

    const caretPosition = range.getBoundingClientRect();
    const containerPosition = node.getBoundingClientRect();
    const lineHeight = Math.max(
        caretPosition.height || 0,
        parseFloat(getComputedStyle(node).lineHeight) || 0,
        16
    );
    const padding = lineHeight * 0.2;
    const target = (caretPosition.top - containerPosition.top) - (node.clientHeight - lineHeight - padding);
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
    node.scrollTop = Math.max(0, Math.min(target, maxScroll));
}
