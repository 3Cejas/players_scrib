// Se establece la conexi�f³n con el servidor seg�fºn si estamos abriendo el archivo localmente o no
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

const DURACION_FULGOR_ESPECTADOR_MS = 900;
const CLASES_FULGOR_LADO_ESPECTADOR = ["tipo-positivo", "tipo-negativo", "tipo-musa"];
const timeout_fulgor_espectador = { 1: null, 2: null };

const fulgores_espectador = (() => {
    const root = document.createElement("div");
    root.id = "espectador_fulgor_root";

    const lado1 = document.createElement("div");
    lado1.className = "espectador-fulgor-lado lado-1";
    root.appendChild(lado1);

    const lado2 = document.createElement("div");
    lado2.className = "espectador-fulgor-lado lado-2";
    root.appendChild(lado2);

    document.body.appendChild(root);
    return { 1: lado1, 2: lado2 };
})();

function activarFulgorLadoEspectador(playerId, tipo) {
    const id = Number(playerId);
    const nodo = fulgores_espectador[id];
    if (!nodo) return;
    nodo.classList.remove("activa");
    CLASES_FULGOR_LADO_ESPECTADOR.forEach((clase) => nodo.classList.remove(clase));
    nodo.classList.add(`tipo-${tipo}`);
    void nodo.offsetWidth;
    nodo.classList.add("activa");
    if (timeout_fulgor_espectador[id]) {
        clearTimeout(timeout_fulgor_espectador[id]);
    }
    timeout_fulgor_espectador[id] = setTimeout(() => {
        nodo.classList.remove("activa");
        CLASES_FULGOR_LADO_ESPECTADOR.forEach((clase) => nodo.classList.remove(clase));
    }, DURACION_FULGOR_ESPECTADOR_MS);
}

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
    programarAjusteViewportEspectador();
    requestAnimationFrame(sincronizarTeleprompterScroll);
};

window.addEventListener("resize", () => {
    if (teleprompter_estado.visible) {
        requestAnimationFrame(sincronizarTeleprompterScroll);
    }
    if (vista_calentamiento) {
        renderizarPalabrasCalentamiento();
    }
    if (vista_espectador_modo_resuelta === "stats" && stats_slides_track) {
        stats_slides_track.style.transform = `translateX(-${stats_slide_index * 100}%)`;
    }
    if (vista_espectador_modo_resuelta === "nube_inspiracion") {
        renderizarNubeInspiracion();
    }
    programarAjusteViewportEspectador();
});

const crearCorazonFlotante = (equipo, x, y) => {
    if (!contenedor_corazones_espectador) return;
    const corazon = document.createElement("span");
    const claseEquipo = equipo === 1 ? "corazon-azul" : "corazon-rojo";
    corazon.className = `corazon-flotante ${claseEquipo}`;
    corazon.textContent = equipo === 1 ? "💙" : "❤️";
    const tamano = 22 + Math.random() * 22;
    const duracion = 2000 + Math.random() * 1200;
    const desplazamiento = -(90 + Math.random() * 140);
    corazon.style.left = `${x}px`;
    corazon.style.top = `${y}px`;
    corazon.style.fontSize = `${tamano}px`;
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
let explicacion = getEl("explicacion") || getEl("explicaci�n");

let palabra2 = getEl("palabra1");
let definicion2 = getEl("definicion1");
let explicacion1 = getEl("explicacion1") || getEl("explicaci�n1");

let palabra3 = getEl("palabra2");
let definicion3 = getEl("definicion2");
let explicacion2 = getEl("explicacion2") || getEl("explicaci�n2");
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

const ocultarTodosResucitarMini = () => {
    ocultarResucitarMini(1);
    ocultarResucitarMini(2);
};

const ocultarResucitarMini = (playerId) => {
    const ui = resucitarMini[playerId];
    if (!ui || !ui.root) return;
    ui.root.classList.remove("activa");
    ui.root.style.display = "none";
    programarAjusteViewportEspectador();
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
    programarAjusteViewportEspectador();
};

if (tiempo) {
    tiempo.style.display = "none";
}
if (tiempo1) {
    tiempo1.style.display = "none";
}

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";
const DURACION_ANIMACION_ENTRADA_VIDA_MS = 880;
const animacionesEntradaBarraVida = new WeakMap();
const animacionEntradaVidaPendiente = { 1: false, 2: false };

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

function setPendienteAnimacionEntradaBarraVida(valor) {
    const estado = Boolean(valor);
    animacionEntradaVidaPendiente[1] = estado;
    animacionEntradaVidaPendiente[2] = estado;
}

function cancelarAnimacionEntradaBarraVida(elemento) {
    if (!elemento) return;
    const frameId = animacionesEntradaBarraVida.get(elemento);
    if (frameId) {
        cancelAnimationFrame(frameId);
        animacionesEntradaBarraVida.delete(elemento);
    }
}

function aplicarEstadoBarraVida(elemento, porcentaje) {
    const pct = Math.max(0, Math.min(100, Number(porcentaje) || 0));
    const tono = Math.max(0, Math.min(120, pct * 1.2));
    elemento.style.setProperty("--vida-pct", `${pct.toFixed(1)}%`);
    elemento.style.setProperty("--vida-color", `hsl(${tono}, 85%, 55%)`);
}

function animarEntradaBarraVida(elemento, porcentajeObjetivo, duracionMs = DURACION_ANIMACION_ENTRADA_VIDA_MS) {
    if (!elemento) return;
    const objetivo = Math.max(0, Math.min(100, Number(porcentajeObjetivo) || 0));
    cancelarAnimacionEntradaBarraVida(elemento);

    if (objetivo <= 0 || duracionMs <= 0) {
        aplicarEstadoBarraVida(elemento, objetivo);
        return;
    }

    const inicio = performance.now();
    const paso = (ahora) => {
        const progreso = Math.min((ahora - inicio) / duracionMs, 1);
        const easing = 1 - Math.pow(1 - progreso, 3);
        aplicarEstadoBarraVida(elemento, objetivo * easing);

        if (progreso < 1) {
            const siguiente = requestAnimationFrame(paso);
            animacionesEntradaBarraVida.set(elemento, siguiente);
            return;
        }

        animacionesEntradaBarraVida.delete(elemento);
        aplicarEstadoBarraVida(elemento, objetivo);
    };

    const primerFrame = requestAnimationFrame(paso);
    animacionesEntradaBarraVida.set(elemento, primerFrame);
}

function esInspiracionDesdeMusa(payload) {
    if (!payload || payload.tipo !== "inspiracion") return false;
    const origen = typeof payload.origen_musa === "string"
        ? payload.origen_musa.trim().toLowerCase()
        : "";
    return origen === "musa" || origen === "musa_enemiga";
}

function extraerDeltaFeedbackTiempo(feedbackTexto) {
    const texto = String(feedbackTexto ?? "").trim();
    if (!texto) return 0;
    const match = texto.match(/([+-])\s*(\d+(?:[.,]\d+)?)/);
    if (match) {
        const magnitud = Number(match[2].replace(",", "."));
        if (Number.isFinite(magnitud) && magnitud > 0) {
            return match[1] === "+" ? magnitud : -magnitud;
        }
    }
    const pareceTiempo = /seg|tiempo/i.test(texto);
    if (pareceTiempo && texto.includes("+")) return 1;
    if (pareceTiempo && texto.includes("-")) return -1;
    return 0;
}

function aplicarFulgorTiempoDesdeFeedbackEspectador(playerId, payload) {
    const id = Number(playerId);
    if (id !== 1 && id !== 2) return;
    const tipo = typeof payload?.tipo === "string"
        ? payload.tipo.trim().toLowerCase()
        : "";

    if (tipo === "ganar_tiempo") {
        activarFulgorLadoEspectador(id, "positivo");
        return;
    }
    if (tipo === "perder_tiempo" || tipo === "borrar") {
        activarFulgorLadoEspectador(id, "negativo");
        return;
    }

    const delta = extraerDeltaFeedbackTiempo(payload?.tiempo_feed);
    if (delta > 0) {
        activarFulgorLadoEspectador(id, "positivo");
    } else if (delta < 0) {
        activarFulgorLadoEspectador(id, "negativo");
    }
}

const feedback_tiempo_flotante_espectador = (() => {
    const root = document.createElement("div");
    root.id = "feedback_tiempo_flotante_root";

    const lado1 = document.createElement("div");
    lado1.className = "feedback-tiempo-columna lado-1";
    root.appendChild(lado1);

    const lado2 = document.createElement("div");
    lado2.className = "feedback-tiempo-columna lado-2";
    root.appendChild(lado2);

    document.body.appendChild(root);
    return { 1: lado1, 2: lado2 };
})();

function obtenerTipoFeedbackFlotanteDesdeTexto(texto = "") {
    const normalizado = String(texto || "").trim().toLowerCase();
    if (!normalizado) return "neutro";

    if (
        normalizado.includes("desventaja") ||
        normalizado.includes("prohibida") ||
        normalizado.includes("maldita") ||
        normalizado.includes("perder") ||
        normalizado.startsWith("-")
    ) {
        return "negativo";
    }
    if (
        normalizado.includes("ventaja") ||
        normalizado.includes("insp") ||
        normalizado.includes("bendita") ||
        normalizado.includes("bonus") ||
        normalizado.includes("ganar") ||
        normalizado.startsWith("+")
    ) {
        return "positivo";
    }

    const delta = extraerDeltaFeedbackTiempo(normalizado);
    if (delta > 0) return "positivo";
    if (delta < 0) return "negativo";
    return "neutro";
}

function obtenerClaseFeedbackTiempoFlotante(payload = {}) {
    const tipo = typeof payload.tipo === "string"
        ? payload.tipo.trim().toLowerCase()
        : "";
    if (tipo === "ganar_tiempo") return "positivo";
    if (tipo === "perder_tiempo" || tipo === "borrar") return "negativo";

    const tipoDesdeTexto = obtenerTipoFeedbackFlotanteDesdeTexto(payload.tiempo_feed);
    return tipoDesdeTexto;
}

function mostrarFeedbackFlotanteEspectador(playerId, texto, opciones = {}) {
    if (vista_espectador_modo_resuelta === "nube_inspiracion") return;
    const id = Number(playerId);
    if (id !== 1 && id !== 2) return;
    const contenedor = feedback_tiempo_flotante_espectador[id];
    if (!contenedor) return;

    const contenido = String(texto ?? "").trim();
    if (!contenido) return;

    const tipo = typeof opciones.tipo === "string" && opciones.tipo
        ? opciones.tipo
        : obtenerTipoFeedbackFlotanteDesdeTexto(contenido);

    const nodo = document.createElement("span");
    nodo.className = `feedback-tiempo-float ${tipo}`;
    nodo.textContent = contenido;

    if (typeof opciones.color === "string" && opciones.color.trim()) {
        nodo.style.setProperty("--feedback-float-color", opciones.color.trim());
    }

    const derivaX = (Math.random() * 18) - 9;
    const subidaDeseada = -54 - (Math.random() * 18);
    const rectContenedor = contenedor.getBoundingClientRect();
    const margenSuperior = 24;
    const subidaMaxima = -Math.max(8, rectContenedor.top - margenSuperior);
    const subidaY = Math.max(subidaDeseada, subidaMaxima);
    const duracion = 1100 + Math.round(Math.random() * 200);
    nodo.style.setProperty("--feedback-float-drift-x", `${derivaX.toFixed(1)}px`);
    nodo.style.setProperty("--feedback-float-rise-y", `${subidaY.toFixed(1)}px`);
    nodo.style.animationDuration = `${duracion}ms`;

    contenedor.appendChild(nodo);
    nodo.addEventListener("animationend", () => nodo.remove(), { once: true });

    while (contenedor.childElementCount > 6) {
        contenedor.firstElementChild.remove();
    }
}

function limpiarFeedbackFlotanteEspectador() {
    if (feedback_tiempo_flotante_espectador[1]) {
        feedback_tiempo_flotante_espectador[1].innerHTML = "";
    }
    if (feedback_tiempo_flotante_espectador[2]) {
        feedback_tiempo_flotante_espectador[2].innerHTML = "";
    }
}

function mostrarFeedbackTiempoFlotanteEspectador(playerId, payload = {}) {
    const texto = String(payload && payload.tiempo_feed != null ? payload.tiempo_feed : "").trim();
    if (!texto) return;
    mostrarFeedbackFlotanteEspectador(playerId, texto, {
        tipo: obtenerClaseFeedbackTiempoFlotante(payload),
        color: payload.color
    });
}

function actualizarBarraVida(elemento, texto, opciones = {}) {
    if (!elemento) {
        return;
    }
    const animarEntrada = Boolean(opciones && opciones.animarEntrada);
    const total = extraerSegundosTiempo(texto);
    if (total === null) {
        cancelarAnimacionEntradaBarraVida(elemento);
        elemento.style.setProperty("--vida-pct", "0%");
        elemento.style.setProperty("--vida-color", "#d94b4b");
        elemento.style.display = "none";
        return;
    }
    const limitado = Math.min(Math.max(total, 0), VIDA_MAX_SEGUNDOS);
    const porcentaje = (limitado / VIDA_MAX_SEGUNDOS) * 100;
    elemento.style.display = DISPLAY_BARRA_VIDA;
    if (animarEntrada) {
        animarEntradaBarraVida(elemento, porcentaje);
        return;
    }
    cancelarAnimacionEntradaBarraVida(elemento);
    aplicarEstadoBarraVida(elemento, porcentaje);
}
const calentamiento_espectador = getEl("calentamiento_espectador");
const calentamiento_global_estado = getEl("calentamiento_global_estado");
const calentamiento_nube = getEl("calentamiento_nube");
const calentamiento_cursor_1 = getEl("calentamiento_cursor_1");
const calentamiento_cursor_2 = getEl("calentamiento_cursor_2");
const calentamiento_cursor_label_1 = calentamiento_cursor_1 ? calentamiento_cursor_1.querySelector(".cursor-label") : null;
const calentamiento_cursor_label_2 = calentamiento_cursor_2 ? calentamiento_cursor_2.querySelector(".cursor-label") : null;
const calentamiento_consigna_espectador = getEl("calentamiento_consigna_espectador");
const calentamiento_final_j1 = getEl("calentamiento_final_j1");
const calentamiento_final_j2 = getEl("calentamiento_final_j2");
const calentamiento_overlay_ui = document.querySelector("#calentamiento_espectador .calentamiento-overlay-ui");
const stats_espectador = getEl("stats_espectador");
const stats_slides_track = getEl("stats_slides_track");
const stats_dots = getEl("stats_dots");
const stats_estado = getEl("stats_estado");
const stats_timestamp = getEl("stats_timestamp");
const nube_inspiracion_espectador = getEl("nube_inspiracion_espectador");
const nube_inspiracion_canvas = getEl("nube_inspiracion_canvas");
const contenedor_espectador = getEl("contenedor_espectador");
const temas_container = getEl("temas_container");
const info_general = getEl("info_general");
const spectator_fit_root = getEl("spectator_fit_root");
const container_general = document.querySelector(".container");
const cabecera = document.querySelector(".cabecera");
const cabecera_display_inicial = cabecera ? cabecera.style.display : "";
const MODOS_VISTA_ESPECTADOR = new Set(["partida", "calentamiento", "stats", "nube_inspiracion"]);
const MODOS_OVERRIDE_ESPECTADOR = new Set(["partida", "stats", "nube_inspiracion"]);
let vista_calentamiento = false;
let vista_espectador_override = "partida";
let vista_espectador_modo_resuelta = "partida";
let partida_activa_espectador = false;
let modo_nivel_activo_espectador = "";
let ultimo_estado_calentamiento = 0;
let intervalo_estado_calentamiento = null;
let palabras_calentamiento = [];
const DURACION_DECAY_CALENTAMIENTO_MS = 10000;
const VENTANA_ANIMACION_PALABRA_MS = 600;
const MARGEN_CABECERA_CALENTAMIENTO_PX = 18;
const MIN_Y_CALENTAMIENTO_DEFAULT = 26;
const MAX_NOMBRE_CURSOR_CALENTAMIENTO = 26;
const TIPOS_SOLICITUD_CALENTAMIENTO_VISTA = new Set(["libre", "lugares", "acciones", "frase_final"]);
const ETIQUETAS_SOLICITUD_CALENTAMIENTO_VISTA = {
    libre: "LIBRE",
    lugares: "LUGARES",
    acciones: "ACCIONES",
    frase_final: "FRASE FINAL"
};
let solicitud_calentamiento_espectador = "libre";
let finales_calentamiento_previos = { 1: "", 2: "" };
let cursores_calentamiento = {
    1: { x: 50, y: 50, visible: false },
    2: { x: 50, y: 50, visible: false }
};
let estado_stats_live_espectador = null;
let stats_slide_index = 0;
let stats_slide_count = 0;
let intervalo_stats_slides = null;
const INTERVALO_STATS_SLIDE_MS = 6500;
let estado_nube_inspiracion_espectador = null;
const posiciones_nube_inspiracion = new Map();
const palabras_nube_inspiracion = new Map();
const palabras_bloqueadas_nube = new Set();
const clave_activa_nube_por_equipo = { 1: "", 2: "" };
let intervalo_animacion_nube_inspiracion = null;
const INTERVALO_ANIMACION_NUBE_MS = 180;
const DURACION_VIGENCIA_ENTREGADA_NUBE_MS = 10000;
const DURACION_EXPIRAR_NUBE_MS = 160;
const DURACION_USO_NUBE_MS = 1000;
const PERMITIR_SCROLL_ESPECTADOR = false;
let raf_ajuste_viewport_espectador = null;
let resize_observer_fit_viewport_espectador = null;

const resetAjusteViewportEspectador = () => {
    if (!spectator_fit_root) return;
    spectator_fit_root.style.removeProperty("transform");
};

const ajustarViewportEspectador = () => {
    if (!spectator_fit_root) return;
    const esPartida = vista_espectador_modo_resuelta === "partida";
    const teleprompterActivo = Boolean(teleprompter_estado && teleprompter_estado.visible);
    if (!esPartida || teleprompterActivo) {
        resetAjusteViewportEspectador();
        return;
    }

    spectator_fit_root.style.transform = "none";
    const viewportW = Math.max(window.innerWidth || 0, 1);
    const viewportH = Math.max(window.innerHeight || 0, 1);
    const anchoNatural = Math.max(Math.ceil(spectator_fit_root.scrollWidth || 0), 1);
    const altoNatural = Math.max(Math.ceil(spectator_fit_root.scrollHeight || 0), 1);

    let escala = Math.min(1, viewportW / anchoNatural, viewportH / altoNatural);
    if (!Number.isFinite(escala) || escala <= 0) {
        escala = 1;
    }

    const offsetX = Math.max(0, (viewportW - (anchoNatural * escala)) * 0.5);
    spectator_fit_root.style.transform = `translate3d(${offsetX.toFixed(2)}px, 0, 0) scale(${escala.toFixed(4)})`;
};

const programarAjusteViewportEspectador = () => {
    if (!spectator_fit_root) return;
    if (raf_ajuste_viewport_espectador) return;
    raf_ajuste_viewport_espectador = requestAnimationFrame(() => {
        raf_ajuste_viewport_espectador = null;
        ajustarViewportEspectador();
    });
};

const iniciarAjusteViewportEspectador = () => {
    if (document.documentElement) {
        document.documentElement.style.overflow = "hidden";
    }
    if (document.body) {
        document.body.style.overflow = "hidden";
    }
    if (!spectator_fit_root) return;
    if (!resize_observer_fit_viewport_espectador && typeof ResizeObserver === "function") {
        resize_observer_fit_viewport_espectador = new ResizeObserver(() => {
            programarAjusteViewportEspectador();
        });
        resize_observer_fit_viewport_espectador.observe(spectator_fit_root);
    }
    programarAjusteViewportEspectador();
    setTimeout(programarAjusteViewportEspectador, 120);
};
const limitarPct = (valor, min, max) => Math.max(min, Math.min(max, valor));
const normalizarModoVistaEspectador = (valor) => {
    const modo = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    return MODOS_VISTA_ESPECTADOR.has(modo) ? modo : "partida";
};
const normalizarOverrideVistaEspectador = (valor) => {
    const modo = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    return MODOS_OVERRIDE_ESPECTADOR.has(modo) ? modo : "partida";
};
const resolverModoVistaEspectadorLocal = () => {
    if (vista_espectador_override === "stats" || vista_espectador_override === "nube_inspiracion") {
        return vista_espectador_override;
    }
    return vista_calentamiento ? "calentamiento" : "partida";
};
const normalizarNombreCursorCalentamiento = (valor, fallback) => {
    const texto = typeof valor === "string" ? valor.trim() : "";
    if (!texto) return fallback;
    return texto.slice(0, MAX_NOMBRE_CURSOR_CALENTAMIENTO);
};
const normalizarFinalCalentamientoEspectador = (entrada) => {
    if (!entrada || typeof entrada !== "object") return null;
    if (typeof entrada.id !== "string" || !entrada.id) return null;
    if (typeof entrada.palabra !== "string" || !entrada.palabra.trim()) return null;
    return {
        id: entrada.id,
        palabra: entrada.palabra.trim(),
        ts: Number(entrada.ts) || 0,
        animTs: Number(entrada.animTs) || 0
    };
};
const normalizarSolicitudCalentamientoVista = (valor) => {
    const tipo = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    return TIPOS_SOLICITUD_CALENTAMIENTO_VISTA.has(tipo) ? tipo : "libre";
};
const actualizarConsignaCalentamientoEspectador = (solicitud) => {
    if (!calentamiento_consigna_espectador) return;
    const tipo = normalizarSolicitudCalentamientoVista(solicitud);
    calentamiento_consigna_espectador.textContent = `CONSIGNA: ${ETIQUETAS_SOLICITUD_CALENTAMIENTO_VISTA[tipo] || "LIBRE"}`;
    calentamiento_consigna_espectador.classList.remove("tipo-libre", "tipo-lugares", "tipo-acciones", "tipo-frase_final");
    calentamiento_consigna_espectador.classList.add(`tipo-${tipo}`);
    if (solicitud_calentamiento_espectador && solicitud_calentamiento_espectador !== tipo) {
        calentamiento_consigna_espectador.classList.remove("consigna-cambio");
        void calentamiento_consigna_espectador.offsetWidth;
        calentamiento_consigna_espectador.classList.add("consigna-cambio");
    } else {
        calentamiento_consigna_espectador.classList.remove("consigna-cambio");
    }
    solicitud_calentamiento_espectador = tipo;
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
    const finales = {
        1: normalizarFinalCalentamientoEspectador(equipos[1] && equipos[1].final),
        2: normalizarFinalCalentamientoEspectador(equipos[2] && equipos[2].final)
    };
    [1, 2].forEach((equipo) => {
        const data = equipos[equipo] || {};
        const palabras = Array.isArray(data.palabras) ? data.palabras : [];
        const finalId = finales[equipo] ? finales[equipo].id : "";
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
                duracionMs: Number(entrada.duracionMs) > 0 ? Number(entrada.duracionMs) : DURACION_DECAY_CALENTAMIENTO_MS,
                esFinal: Boolean(finalId && finalId === entrada.id)
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
        if (entrada.esFinal) clases.push("is-final-word");
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

const chunkArrayEspectador = (arr, size) => {
    const salida = [];
    if (!Array.isArray(arr) || size <= 0) return salida;
    for (let i = 0; i < arr.length; i += size) {
        salida.push(arr.slice(i, i + size));
    }
    return salida;
};
const crearJugadorStatsVacioEspectador = (id) => ({
    id,
    nombre: `ESCRITXR ${id}`,
    palabrasTotal: 0,
    pulsacionesTotal: 0,
    teclasDistintas: 0,
    topTeclas: [],
    ritmoPpm: 0,
    tiempoTotalMs: 0,
    tiempoEscrituraMs: 0,
    vida: { actual: null, min: null, max: null, media: null },
    letrasBenditas: [],
    letrasMalditas: [],
    palabrasBenditas: [],
    palabrasMalditas: [],
    intentosLetraProhibida: 0,
    intentosPalabraProhibida: 0
});
const normalizarArrayTextoEspectador = (arr, maxItems = 80, maxLen = 48) => {
    if (!Array.isArray(arr)) return [];
    return arr
        .map((valor) => String(valor ?? "").trim().slice(0, maxLen))
        .filter(Boolean)
        .slice(0, maxItems);
};
const normalizarTopTeclasEspectador = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
        .map((item) => ({
            code: String(item && item.code ? item.code : "").trim().slice(0, 16),
            count: Math.max(0, Number(item && item.count) || 0)
        }))
        .filter((item) => item.code)
        .slice(0, 8);
};
const normalizarJugadorStatsLiveEspectador = (payload, id) => {
    const base = crearJugadorStatsVacioEspectador(id);
    const data = payload && typeof payload === "object" ? payload : {};
    const vida = data.vida && typeof data.vida === "object" ? data.vida : {};
    const valorVida = (valor) => {
        const num = Number(valor);
        return Number.isFinite(num) ? num : null;
    };
    return {
        ...base,
        id,
        nombre: (String(data.nombre ?? "").trim().slice(0, 28) || base.nombre),
        palabrasTotal: Math.max(0, Number(data.palabrasTotal) || 0),
        pulsacionesTotal: Math.max(0, Number(data.pulsacionesTotal) || 0),
        teclasDistintas: Math.max(0, Number(data.teclasDistintas) || 0),
        topTeclas: normalizarTopTeclasEspectador(data.topTeclas),
        ritmoPpm: Math.max(0, Number(data.ritmoPpm) || 0),
        tiempoTotalMs: Math.max(0, Number(data.tiempoTotalMs) || 0),
        tiempoEscrituraMs: Math.max(0, Number(data.tiempoEscrituraMs) || 0),
        vida: {
            actual: valorVida(vida.actual),
            min: valorVida(vida.min),
            max: valorVida(vida.max),
            media: valorVida(vida.media)
        },
        letrasBenditas: normalizarArrayTextoEspectador(data.letrasBenditas, 32, 8),
        letrasMalditas: normalizarArrayTextoEspectador(data.letrasMalditas, 32, 8),
        palabrasBenditas: normalizarArrayTextoEspectador(data.palabrasBenditas, 64, 28),
        palabrasMalditas: normalizarArrayTextoEspectador(data.palabrasMalditas, 64, 28),
        intentosLetraProhibida: Math.max(0, Number(data.intentosLetraProhibida) || 0),
        intentosPalabraProhibida: Math.max(0, Number(data.intentosPalabraProhibida) || 0)
    };
};
const normalizarStatsLiveEspectador = (payload = {}) => {
    const data = payload && typeof payload === "object" ? payload : {};
    const players = data.players && typeof data.players === "object" ? data.players : {};
    return {
        ts: Number.isFinite(Number(data.ts)) ? Number(data.ts) : Date.now(),
        modo_actual: String(data.modo_actual ?? "").trim().slice(0, 32),
        players: {
            1: normalizarJugadorStatsLiveEspectador(players[1], 1),
            2: normalizarJugadorStatsLiveEspectador(players[2], 2)
        }
    };
};
const normalizarNubeInspiracionEspectador = (payload = {}) => {
    const data = payload && typeof payload === "object" ? payload : {};
    const equipos = data.equipos && typeof data.equipos === "object" ? data.equipos : {};
    const normalizarEquipo = (entrada, fallbackNombre) => {
        const equipoData = entrada && typeof entrada === "object" ? entrada : {};
        const nombre = String(equipoData.nombre ?? "").trim().slice(0, 28) || fallbackNombre;
        const palabras = Array.isArray(equipoData.palabras)
            ? equipoData.palabras
                .map((valor) => String(valor ?? "").trim().slice(0, 32))
                .filter(Boolean)
            : [];
        return { nombre, palabras };
    };
    return {
        ts: Number.isFinite(Number(data.ts)) ? Number(data.ts) : Date.now(),
        modo_actual: String(data.modo_actual ?? "").trim().slice(0, 32),
        equipos: {
            1: normalizarEquipo(equipos[1], "ESCRITXR 1"),
            2: normalizarEquipo(equipos[2], "ESCRITXR 2")
        }
    };
};
const formatearDuracionMsEspectador = (ms) => {
    const valor = Math.max(0, Number(ms) || 0);
    const totalSeg = Math.floor(valor / 1000);
    const minutos = Math.floor(totalSeg / 60);
    const segundos = totalSeg % 60;
    return `${minutos}:${segundos.toString().padStart(2, "0")}`;
};
const formatearHoraEspectador = (ts) => {
    const fecha = new Date(Number(ts) || Date.now());
    return fecha.toLocaleTimeString("es-ES", { hour12: false });
};
const renderizarChipsStats = (items = [], claseExtra = "") => {
    if (!Array.isArray(items) || !items.length) {
        return `<span class="stats-tag vacio">Sin datos</span>`;
    }
    return items
        .map((item) => `<span class="stats-tag ${claseExtra}">${escapeHtml(String(item))}</span>`)
        .join("");
};
const construirSlidesStats = (payload) => {
    const estado = normalizarStatsLiveEspectador(payload);
    const p1 = estado.players[1];
    const p2 = estado.players[2];
    const slides = [];

    slides.push({
        titulo: "RESUMEN",
        subtitulo: estado.modo_actual ? `Modo: ${estado.modo_actual}` : "Modo: partida",
        html: `
            <div class="stats-resumen-grid">
                <article class="stats-resumen-card equipo-1">
                    <h4>${escapeHtml(p1.nombre)}</h4>
                    <p><strong>${p1.palabrasTotal}</strong> palabras</p>
                    <p><strong>${p1.ritmoPpm}</strong> ppm</p>
                    <p><strong>${p1.pulsacionesTotal}</strong> pulsaciones</p>
                </article>
                <article class="stats-resumen-card equipo-2">
                    <h4>${escapeHtml(p2.nombre)}</h4>
                    <p><strong>${p2.palabrasTotal}</strong> palabras</p>
                    <p><strong>${p2.ritmoPpm}</strong> ppm</p>
                    <p><strong>${p2.pulsacionesTotal}</strong> pulsaciones</p>
                </article>
            </div>
        `
    });

    [p1, p2].forEach((jugador, index) => {
        const equipo = index + 1;
        const topTeclas = jugador.topTeclas.map((item) => `${item.code} x${item.count}`);
        const vidaTexto = [
            jugador.vida.actual !== null ? `actual ${jugador.vida.actual}s` : null,
            jugador.vida.min !== null ? `min ${jugador.vida.min}s` : null,
            jugador.vida.max !== null ? `max ${jugador.vida.max}s` : null,
            jugador.vida.media !== null ? `media ${jugador.vida.media}s` : null
        ].filter(Boolean).join(" | ") || "Sin datos";

        slides.push({
            titulo: escapeHtml(jugador.nombre),
            subtitulo: "Metricas base",
            html: `
                <div class="stats-metricas-grid equipo-${equipo}">
                    <div class="stats-metrica"><span>Palabras</span><strong>${jugador.palabrasTotal}</strong></div>
                    <div class="stats-metrica"><span>Pulsaciones</span><strong>${jugador.pulsacionesTotal}</strong></div>
                    <div class="stats-metrica"><span>Teclas distintas</span><strong>${jugador.teclasDistintas}</strong></div>
                    <div class="stats-metrica"><span>Ritmo</span><strong>${jugador.ritmoPpm} ppm</strong></div>
                    <div class="stats-metrica"><span>Tiempo total</span><strong>${formatearDuracionMsEspectador(jugador.tiempoTotalMs)}</strong></div>
                    <div class="stats-metrica"><span>Tiempo escritura</span><strong>${formatearDuracionMsEspectador(jugador.tiempoEscrituraMs)}</strong></div>
                </div>
                <p class="stats-vida-linea">${escapeHtml(vidaTexto)}</p>
                <div class="stats-tags">${renderizarChipsStats(topTeclas, "stats-tag--soft")}</div>
            `
        });

        const listas = [
            { titulo: "Letras benditas", items: jugador.letrasBenditas, chunk: 16 },
            { titulo: "Letras malditas", items: jugador.letrasMalditas, chunk: 16 },
            { titulo: "Palabras benditas", items: jugador.palabrasBenditas, chunk: 12 },
            { titulo: "Palabras malditas", items: jugador.palabrasMalditas, chunk: 12 }
        ];
        listas.forEach((lista) => {
            const trozos = chunkArrayEspectador(lista.items, lista.chunk);
            if (!trozos.length) return;
            trozos.forEach((trozo, idx) => {
                slides.push({
                    titulo: escapeHtml(jugador.nombre),
                    subtitulo: `${lista.titulo}${trozos.length > 1 ? ` (${idx + 1}/${trozos.length})` : ""}`,
                    html: `
                        <div class="stats-tags stats-tags--densas equipo-${equipo}">
                            ${renderizarChipsStats(trozo)}
                        </div>
                    `
                });
            });
        });

        slides.push({
            titulo: escapeHtml(jugador.nombre),
            subtitulo: "Intentos en restricciones",
            html: `
                <div class="stats-intentos-grid equipo-${equipo}">
                    <div class="stats-intento">
                        <span>Intentos letra prohibida</span>
                        <strong>${jugador.intentosLetraProhibida}</strong>
                    </div>
                    <div class="stats-intento">
                        <span>Intentos palabra prohibida</span>
                        <strong>${jugador.intentosPalabraProhibida}</strong>
                    </div>
                </div>
            `
        });
    });
    return slides;
};
const actualizarPaginadorStats = () => {
    if (!stats_dots) return;
    stats_dots.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < stats_slide_count; i += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = `stats-dot${i === stats_slide_index ? " activo" : ""}`;
        dot.setAttribute("aria-label", `Slide ${i + 1}`);
        dot.addEventListener("click", () => {
            stats_slide_index = i;
            if (stats_slides_track) {
                stats_slides_track.style.transform = `translateX(-${stats_slide_index * 100}%)`;
            }
            actualizarPaginadorStats();
        });
        fragment.appendChild(dot);
    }
    stats_dots.appendChild(fragment);
};
const renderizarStatsEspectador = () => {
    if (!stats_slides_track || !stats_estado || !stats_timestamp) return;
    const estado = normalizarStatsLiveEspectador(estado_stats_live_espectador || {});
    const slides = construirSlidesStats(estado);
    stats_slides_track.innerHTML = "";
    const fragment = document.createDocumentFragment();
    slides.forEach((slide) => {
        const item = document.createElement("article");
        item.className = "stats-slide";
        item.innerHTML = `
            <header class="stats-slide-header">
                <h3>${slide.titulo}</h3>
                <p>${escapeHtml(slide.subtitulo || "")}</p>
            </header>
            <div class="stats-slide-body">${slide.html}</div>
        `;
        fragment.appendChild(item);
    });
    stats_slides_track.appendChild(fragment);
    stats_slide_count = slides.length;
    if (stats_slide_index >= stats_slide_count) {
        stats_slide_index = 0;
    }
    stats_slides_track.style.transform = `translateX(-${stats_slide_index * 100}%)`;
    actualizarPaginadorStats();
    const nombreModo = estado.modo_actual ? estado.modo_actual : "partida";
    stats_estado.textContent = `Modo: ${nombreModo} | ${stats_slide_count} slides`;
    stats_timestamp.textContent = `Actualizado: ${formatearHoraEspectador(estado.ts)}`;
};
const iniciarSlidesStats = () => {
    if (intervalo_stats_slides) return;
    intervalo_stats_slides = setInterval(() => {
        if (vista_espectador_modo_resuelta !== "stats") return;
        if (!stats_slide_count || stats_slide_count <= 1 || !stats_slides_track) return;
        stats_slide_index = (stats_slide_index + 1) % stats_slide_count;
        stats_slides_track.style.transform = `translateX(-${stats_slide_index * 100}%)`;
        actualizarPaginadorStats();
    }, INTERVALO_STATS_SLIDE_MS);
};
const detenerSlidesStats = () => {
    if (!intervalo_stats_slides) return;
    clearInterval(intervalo_stats_slides);
    intervalo_stats_slides = null;
};
const hashCadenaInspiracion = (texto) => {
    const valor = String(texto || "");
    let hash = 2166136261;
    for (let i = 0; i < valor.length; i += 1) {
        hash ^= valor.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
};
const randomSemilla = (semilla) => {
    const x = Math.sin(semilla) * 10000;
    return x - Math.floor(x);
};
const normalizarPalabraNube = (valor) => String(valor || "").trim().toLowerCase();
const clavePalabraNube = (equipo, palabra) => `${equipo}:${normalizarPalabraNube(palabra)}`;
const equipoOrigenInspiracion = (escritoraId, payload = {}) => {
    const player = Number(escritoraId);
    const origen = typeof payload.origen_musa === "string"
        ? payload.origen_musa.trim().toLowerCase()
        : "";
    if (origen === "musa_enemiga") {
        return player === 1 ? 2 : 1;
    }
    return player === 2 ? 2 : 1;
};
const extraerPalabraEventoInspiracion = (valor, profundidad = 0) => {
    if (profundidad > 4) return "";
    if (typeof valor === "string") return valor.trim();
    if (Array.isArray(valor)) {
        for (let i = 0; i < valor.length; i++) {
            const candidata = extraerPalabraEventoInspiracion(valor[i], profundidad + 1);
            if (candidata) return candidata;
        }
        return "";
    }
    if (valor && typeof valor === "object") {
        const clavesPreferidas = ["palabra", "word", "texto", "valor", "palabras_var"];
        for (let i = 0; i < clavesPreferidas.length; i++) {
            const clave = clavesPreferidas[i];
            if (!Object.prototype.hasOwnProperty.call(valor, clave)) continue;
            const candidata = extraerPalabraEventoInspiracion(valor[clave], profundidad + 1);
            if (candidata) return candidata;
        }
        if (Object.prototype.hasOwnProperty.call(valor, "palabra_bonus")) {
            const bonus = valor.palabra_bonus;
            if (Array.isArray(bonus) && bonus.length) {
                const candidataBonus = extraerPalabraEventoInspiracion(bonus[0], profundidad + 1);
                if (candidataBonus) return candidataBonus;
            } else {
                const candidataBonus = extraerPalabraEventoInspiracion(bonus, profundidad + 1);
                if (candidataBonus) return candidataBonus;
            }
        }
    }
    return "";
};
const crearRegistroPalabraNube = (equipo, palabra, ahora = Date.now()) => ({
    equipo,
    palabra: String(palabra || "").trim(),
    ts: ahora,
    entregadaTs: 0,
    expiraTs: 0,
    usadaTs: 0,
    expirandoTs: 0
});
const obtenerPosicionNube = (equipo, clave, indice, ocupadas) => {
    const previa = posiciones_nube_inspiracion.get(clave);
    if (previa) {
        ocupadas.push(previa);
        return previa;
    }
    const base = hashCadenaInspiracion(clave);
    const minX = equipo === 1 ? 7 : 52;
    const maxX = equipo === 1 ? 46 : 93;
    for (let i = 0; i < 80; i += 1) {
        const semilla = base + (i * 379) + (indice * 941);
        const x = minX + (randomSemilla(semilla + 11) * (maxX - minX));
        const y = 12 + (randomSemilla(semilla + 23) * 78);
        const scale = 0.9 + (randomSemilla(semilla + 37) * 0.8);
        const rot = Math.round((randomSemilla(semilla + 51) - 0.5) * 18);
        const radio = 6 + (scale * 2.8);
        const colisiona = ocupadas.some((ocupada) => {
            const dx = ocupada.x - x;
            const dy = ocupada.y - y;
            const dist = Math.sqrt((dx * dx) + (dy * dy));
            return dist < (ocupada.radio + radio);
        });
        if (!colisiona) {
            const salida = { x, y, scale, rot, radio };
            posiciones_nube_inspiracion.set(clave, salida);
            ocupadas.push(salida);
            return salida;
        }
    }
    const fallback = {
        x: minX + ((indice * 13) % Math.max(8, (maxX - minX))),
        y: 15 + ((indice * 9) % 76),
        scale: 1,
        rot: 0,
        radio: 8
    };
    posiciones_nube_inspiracion.set(clave, fallback);
    ocupadas.push(fallback);
    return fallback;
};
const garantizarPalabraNube = (equipo, palabra, ahora = Date.now()) => {
    const limpia = String(palabra || "").trim();
    if (!limpia) return "";
    const clave = clavePalabraNube(equipo, limpia);
    if (palabras_bloqueadas_nube.has(clave)) {
        palabras_bloqueadas_nube.delete(clave);
    }
    if (!palabras_nube_inspiracion.has(clave)) {
        palabras_nube_inspiracion.set(clave, crearRegistroPalabraNube(equipo, limpia, ahora));
    }
    return clave;
};
const sincronizarNubeDesdeSnapshot = (estado = {}) => {
    const equipos = estado && estado.equipos ? estado.equipos : {};
    const ahora = Date.now();
    const presentes = new Set();
    [1, 2].forEach((equipo) => {
        const palabras = Array.isArray(equipos[equipo] && equipos[equipo].palabras)
            ? equipos[equipo].palabras
            : [];
        palabras.forEach((palabra) => {
            const limpia = String(palabra || "").trim();
            if (!limpia) return;
            const clave = clavePalabraNube(equipo, limpia);
            presentes.add(clave);
            if (!palabras_nube_inspiracion.has(clave) && !palabras_bloqueadas_nube.has(clave)) {
                palabras_nube_inspiracion.set(clave, crearRegistroPalabraNube(equipo, limpia, ahora));
            }
        });
    });
    // Si una palabra ya no viene en snapshot y no fue entregada/usada, se retira.
    Array.from(palabras_nube_inspiracion.entries()).forEach(([clave, registro]) => {
        if (!registro) return;
        const esActiva = clave_activa_nube_por_equipo[registro.equipo] === clave;
        const enSalida = Boolean(registro.usadaTs || registro.expiraTs || registro.expirandoTs || esActiva);
        if (!presentes.has(clave) && !enSalida) {
            palabras_nube_inspiracion.delete(clave);
            posiciones_nube_inspiracion.delete(clave);
        }
    });
    Array.from(palabras_bloqueadas_nube).forEach((clave) => {
        if (!presentes.has(clave)) {
            palabras_bloqueadas_nube.delete(clave);
        }
    });
};
const marcarPalabraInspirandoNube = (equipo, palabra) => {
    const clave = garantizarPalabraNube(equipo, palabra);
    if (!clave) return;
    const ahora = Date.now();
    clave_activa_nube_por_equipo[equipo] = clave;
    const registro = palabras_nube_inspiracion.get(clave);
    if (!registro) return;
    registro.entregadaTs = ahora;
    registro.expiraTs = ahora + DURACION_VIGENCIA_ENTREGADA_NUBE_MS;
    registro.expirandoTs = 0;
    registro.usadaTs = 0;
    if (vista_espectador_modo_resuelta === "nube_inspiracion") {
        renderizarNubeInspiracion();
    }
};
const marcarPalabraUsadaNube = (equipo, palabra = "") => {
    let clave = "";
    const limpia = String(palabra || "").trim();
    if (limpia) {
        clave = garantizarPalabraNube(equipo, limpia);
    } else {
        clave = clave_activa_nube_por_equipo[equipo] || "";
    }
    if (!clave) return;
    const registro = palabras_nube_inspiracion.get(clave);
    if (!registro) return;
    registro.usadaTs = Date.now();
    registro.expiraTs = 0;
    registro.expirandoTs = 0;
    if (clave_activa_nube_por_equipo[equipo] === clave) {
        clave_activa_nube_por_equipo[equipo] = "";
    }
    if (vista_espectador_modo_resuelta === "nube_inspiracion") {
        renderizarNubeInspiracion();
    }
};
const procesarPalabraUsadaInspiracion = (escritoraId, payload = {}) => {
    const equipo = equipoOrigenInspiracion(escritoraId, payload);
    const palabra = typeof payload.palabra === "string" ? payload.palabra.trim() : "";
    marcarPalabraUsadaNube(equipo, palabra);
};
const depurarPalabrasNube = () => {
    const ahora = Date.now();
    let cambio = false;
    Array.from(palabras_nube_inspiracion.entries()).forEach(([clave, registro]) => {
        if (!registro) {
            palabras_nube_inspiracion.delete(clave);
            posiciones_nube_inspiracion.delete(clave);
            cambio = true;
            return;
        }
        if (registro.usadaTs) {
            if ((ahora - registro.usadaTs) > DURACION_USO_NUBE_MS) {
                palabras_nube_inspiracion.delete(clave);
                posiciones_nube_inspiracion.delete(clave);
                palabras_bloqueadas_nube.add(clave);
                if (clave_activa_nube_por_equipo[registro.equipo] === clave) {
                    clave_activa_nube_por_equipo[registro.equipo] = "";
                }
                cambio = true;
            }
            return;
        }
        if (registro.expiraTs > 0 && ahora >= registro.expiraTs) {
            if (!registro.expirandoTs) {
                registro.expirandoTs = ahora;
                if (clave_activa_nube_por_equipo[registro.equipo] === clave) {
                    clave_activa_nube_por_equipo[registro.equipo] = "";
                }
                cambio = true;
                return;
            }
            if ((ahora - registro.expirandoTs) >= DURACION_EXPIRAR_NUBE_MS) {
                palabras_nube_inspiracion.delete(clave);
                posiciones_nube_inspiracion.delete(clave);
                palabras_bloqueadas_nube.add(clave);
                cambio = true;
            }
        }
    });
    return cambio;
};
const iniciarAnimacionNubeInspiracion = () => {
    if (intervalo_animacion_nube_inspiracion) return;
    intervalo_animacion_nube_inspiracion = setInterval(() => {
        const cambio = depurarPalabrasNube();
        if (vista_espectador_modo_resuelta === "nube_inspiracion" && (cambio || palabras_nube_inspiracion.size > 0)) {
            renderizarNubeInspiracion();
        }
    }, INTERVALO_ANIMACION_NUBE_MS);
};
const detenerAnimacionNubeInspiracion = () => {
    if (!intervalo_animacion_nube_inspiracion) return;
    clearInterval(intervalo_animacion_nube_inspiracion);
    intervalo_animacion_nube_inspiracion = null;
};
const renderizarNubeInspiracion = () => {
    if (!nube_inspiracion_canvas) return;
    depurarPalabrasNube();
    const ocupadas = [];
    const fragment = document.createDocumentFragment();
    const entradas = Array.from(palabras_nube_inspiracion.entries())
        .map(([clave, registro]) => ({ clave, registro }))
        .filter(({ registro }) => registro && typeof registro.palabra === "string" && registro.palabra.trim())
        .sort((a, b) => a.registro.ts - b.registro.ts);

    entradas.forEach(({ clave, registro }, indice) => {
        const pos = obtenerPosicionNube(registro.equipo, clave, indice, ocupadas);
        const estaActiva = clave_activa_nube_por_equipo[registro.equipo] === clave && !registro.usadaTs && !registro.expirandoTs;
        const estaUsada = Boolean(registro.usadaTs);
        const estaExpirando = Boolean(registro.expirandoTs);

        const nodo = document.createElement("span");
        nodo.className = `nube-inspiracion-palabra equipo-${registro.equipo}${estaActiva ? " is-active" : ""}${estaUsada ? " is-used" : ""}${estaExpirando ? " is-expiring" : ""}`;
        nodo.textContent = registro.palabra;
        nodo.style.left = `${pos.x.toFixed(2)}%`;
        nodo.style.top = `${pos.y.toFixed(2)}%`;
        nodo.style.setProperty("--nube-scale", pos.scale.toFixed(2));
        nodo.style.setProperty("--nube-rot", `${pos.rot}deg`);
        fragment.appendChild(nodo);
    });

    nube_inspiracion_canvas.innerHTML = "";
    nube_inspiracion_canvas.appendChild(fragment);
};

const actualizarVisibilidadPanelNivelEspectador = () => {
    if (!info_general || !info_general.classList) return;
    const modoActivo = typeof modo_nivel_activo_espectador === "string" && modo_nivel_activo_espectador.trim().length > 0;
    const vistaPartida = vista_espectador_modo_resuelta === "partida";
    const mostrar = Boolean(partida_activa_espectador && vistaPartida && modoActivo);
    info_general.classList.toggle("info-general-panel--oculto", !mostrar);
    programarAjusteViewportEspectador();
};

const actualizarModoVistaEspectadorUi = (modoForzado = null) => {
    const modo = normalizarModoVistaEspectador(modoForzado || resolverModoVistaEspectadorLocal());
    vista_espectador_modo_resuelta = modo;
    if (modo === "nube_inspiracion") {
        limpiarFeedbackFlotanteEspectador();
    }
    if (document.body) {
        document.body.classList.toggle("vista-calentamiento", modo === "calentamiento");
        document.body.classList.toggle("vista-stats", modo === "stats");
        document.body.classList.toggle("vista-nube-inspiracion", modo === "nube_inspiracion");
    }
    if (calentamiento_espectador) {
        calentamiento_espectador.style.display = modo === "calentamiento" ? "flex" : "none";
    }
    if (stats_espectador) {
        stats_espectador.style.display = modo === "stats" ? "grid" : "none";
    }
    if (nube_inspiracion_espectador) {
        nube_inspiracion_espectador.style.display = modo === "nube_inspiracion" ? "flex" : "none";
    }
    if (cabecera) {
        cabecera.style.display = modo === "partida" ? (cabecera_display_inicial || "") : "none";
    }
    if (modo === "stats") {
        iniciarSlidesStats();
        detenerAnimacionNubeInspiracion();
        renderizarStatsEspectador();
    } else if (modo === "nube_inspiracion") {
        iniciarAnimacionNubeInspiracion();
        renderizarNubeInspiracion();
    } else {
        detenerAnimacionNubeInspiracion();
    }
    actualizarVisibilidadPanelNivelEspectador();
    programarAjusteViewportEspectador();
};
const actualizarVistaCalentamiento = (activa) => {
    vista_calentamiento = Boolean(activa);
    actualizarModoVistaEspectadorUi();
};
const actualizarModoVistaEspectadorRemota = (payload = {}) => {
    if (payload && typeof payload === "object") {
        if (Object.prototype.hasOwnProperty.call(payload, "calentamiento_vista")) {
            vista_calentamiento = Boolean(payload.calentamiento_vista);
        }
        if (Object.prototype.hasOwnProperty.call(payload, "override")) {
            vista_espectador_override = normalizarOverrideVistaEspectador(payload.override);
        }
        if (Object.prototype.hasOwnProperty.call(payload, "modo")) {
            const modoServidor = normalizarModoVistaEspectador(payload.modo);
            actualizarModoVistaEspectadorUi(modoServidor);
            return;
        }
    }
    actualizarModoVistaEspectadorUi();
};
actualizarModoVistaEspectadorUi();
iniciarAjusteViewportEspectador();

const actualizarFinalCardCalentamiento = (equipo, dataEquipo = {}) => {
    const card = equipo === 1 ? calentamiento_final_j1 : calentamiento_final_j2;
    if (!card) return;
    const label = card.querySelector(".final-label");
    const word = card.querySelector(".final-word");
    const final = normalizarFinalCalentamientoEspectador(dataEquipo && dataEquipo.final);
    const bloqueado = Boolean(dataEquipo && dataEquipo.bloqueado);
    if (label) {
        const nombre = equipo === 1
            ? normalizarNombreCursorCalentamiento(getEl("nombre")?.value, "ESCRITXR 1")
            : normalizarNombreCursorCalentamiento(getEl("nombre1")?.value, "ESCRITXR 2");
        label.textContent = nombre.toUpperCase();
    }
    if (word) {
        if (final) {
            word.textContent = final.palabra.toUpperCase();
        } else if (bloqueado) {
            word.textContent = "ELIGIENDO...";
        } else {
            word.textContent = "PENDIENTE";
        }
    }
    card.classList.toggle("is-blocked", bloqueado && !final);
    card.classList.toggle("is-final", Boolean(final));
    if (final && finales_calentamiento_previos[equipo] !== final.id) {
        card.classList.remove("reveal");
        void card.offsetWidth;
        card.classList.add("reveal");
    }
    if (!final) {
        card.classList.remove("reveal");
    }
    finales_calentamiento_previos[equipo] = final ? final.id : "";
};

const construirEstadoGlobalCalentamiento = (equipos = {}) => {
    const e1 = equipos[1] || {};
    const e2 = equipos[2] || {};
    const final1 = normalizarFinalCalentamientoEspectador(e1.final);
    const final2 = normalizarFinalCalentamientoEspectador(e2.final);
    if (final1 && final2) return "Ambas escritoras eligieron su palabra final. Esperando nueva consigna.";
    if (final1 || final2) return "Falta una palabra final para completar esta consigna.";
    const bloqueadas = Number(Boolean(e1.bloqueado)) + Number(Boolean(e2.bloqueado));
    if (bloqueadas > 0) return "Consigna cerrada en una mesa. Falta elegir palabra final.";
    return "Recibiendo palabras de las musas.";
};

const actualizarCalentamientoEspectador = (data) => {
    if (!data) return;
    actualizarEtiquetasCursorCalentamiento();
    actualizarConsignaCalentamientoEspectador(data.solicitud);
    if (typeof data.vista === "boolean") {
        actualizarVistaCalentamiento(data.vista);
    }
    const equipos = data.equipos || {};
    const activo = Boolean(data.activo && data.vista);
    if (calentamiento_global_estado) {
        calentamiento_global_estado.textContent = activo
            ? construirEstadoGlobalCalentamiento(equipos)
            : (data.activo ? "Calentamiento oculto." : "Calentamiento inactivo.");
    }
    actualizarFinalCardCalentamiento(1, equipos[1] || {});
    actualizarFinalCardCalentamiento(2, equipos[2] || {});
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

const CLASES_FADE_TEXTAREA_ESPECTADOR = [
    "textarea-fade-none",
    "textarea-fade-top",
    "textarea-fade-bottom",
    "textarea-fade-both"
];
const raf_degradado_textarea_espectador = new WeakMap();
let degradado_textarea_espectador_iniciado = false;
let observadores_mutacion_textarea_espectador = [];
let observadores_resize_textarea_espectador = [];

function obtenerTextareasEspectador() {
    return [texto1, texto2].filter((el) => el && el.classList);
}

function actualizarDegradadoDinamicoTextareaEspectador(textarea) {
    if (!textarea || !textarea.classList) return;
    const clientHeight = textarea.clientHeight || 0;
    const scrollHeight = textarea.scrollHeight || 0;

    if (clientHeight <= 0 || textarea.style.display === "none") {
        CLASES_FADE_TEXTAREA_ESPECTADOR.forEach((clase) => textarea.classList.remove(clase));
        textarea.classList.add("textarea-fade-none");
        return;
    }

    const margen = 2;
    const tieneOverflow = (scrollHeight - clientHeight) > margen;
    const scrollTop = Math.max(0, textarea.scrollTop || 0);
    const ocultoArriba = tieneOverflow && (scrollTop > margen);
    const ocultoAbajo = tieneOverflow && ((scrollTop + clientHeight) < (scrollHeight - margen));

    CLASES_FADE_TEXTAREA_ESPECTADOR.forEach((clase) => textarea.classList.remove(clase));
    if (ocultoArriba && ocultoAbajo) {
        textarea.classList.add("textarea-fade-both");
    } else if (ocultoArriba) {
        textarea.classList.add("textarea-fade-top");
    } else if (ocultoAbajo) {
        textarea.classList.add("textarea-fade-bottom");
    } else {
        textarea.classList.add("textarea-fade-none");
    }
}

function programarActualizacionDegradadoTextareaEspectador(textarea) {
    if (!textarea) return;
    if (raf_degradado_textarea_espectador.has(textarea)) return;
    const rafId = requestAnimationFrame(() => {
        raf_degradado_textarea_espectador.delete(textarea);
        actualizarDegradadoDinamicoTextareaEspectador(textarea);
    });
    raf_degradado_textarea_espectador.set(textarea, rafId);
}

function programarActualizacionDegradadoTextosEspectador() {
    obtenerTextareasEspectador().forEach(programarActualizacionDegradadoTextareaEspectador);
}

function iniciarDegradadoDinamicoTextosEspectador() {
    if (degradado_textarea_espectador_iniciado) return;
    const textareas = obtenerTextareasEspectador();
    if (!textareas.length) return;
    degradado_textarea_espectador_iniciado = true;

    const eventos = ["input", "scroll", "keyup", "mouseup", "touchend", "focus", "blur"];
    textareas.forEach((textarea) => {
        eventos.forEach((evento) => {
            textarea.addEventListener(evento, () => {
                programarActualizacionDegradadoTextareaEspectador(textarea);
            });
        });
    });

    window.addEventListener("resize", programarActualizacionDegradadoTextosEspectador);

    if (typeof MutationObserver === "function") {
        observadores_mutacion_textarea_espectador = textareas.map((textarea) => {
            const observer = new MutationObserver(() => {
                programarActualizacionDegradadoTextareaEspectador(textarea);
            });
            observer.observe(textarea, {
                subtree: true,
                childList: true,
                characterData: true,
                attributes: true,
                attributeFilter: ["class", "style"]
            });
            return observer;
        });
    }

    if (typeof ResizeObserver === "function") {
        observadores_resize_textarea_espectador = textareas.map((textarea) => {
            const observer = new ResizeObserver(() => {
                programarActualizacionDegradadoTextareaEspectador(textarea);
            });
            observer.observe(textarea);
            return observer;
        });
    }

    programarActualizacionDegradadoTextosEspectador();
    setTimeout(programarActualizacionDegradadoTextosEspectador, 120);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarDegradadoDinamicoTextosEspectador, { once: true });
} else {
    iniciarDegradadoDinamicoTextosEspectador();
}

const timeout_puntos_espectador = new WeakMap();

const formatearPuntosMarcador = (valor) => {
    const texto = String(valor ?? "").trim();
    if (!texto) return "0 palabras";
    if (/^-?\d+(?:\.\d+)?$/.test(texto)) {
        return `${texto} palabras`;
    }
    return texto;
};

const formatearMusasMarcador = (valor) => {
    const texto = String(valor ?? "").trim();
    if (!texto) return "0 musas";
    if (/^-?\d+(?:\.\d+)?$/.test(texto)) {
        return `${texto} musas`;
    }
    return texto;
};

function destacarPuntosEspectadorHit(elemento) {
    if (!elemento) return;
    elemento.classList.remove("puntos-hit");
    void elemento.offsetWidth;
    elemento.classList.add("puntos-hit");
    const timeoutPrevio = timeout_puntos_espectador.get(elemento);
    if (timeoutPrevio) {
        clearTimeout(timeoutPrevio);
    }
    const timeoutNuevo = setTimeout(() => {
        if (elemento) {
            elemento.classList.remove("puntos-hit");
        }
    }, 640);
    timeout_puntos_espectador.set(elemento, timeoutNuevo);
}

function actualizarPuntosMarcadorEquipo(elemento, valor, animar = true) {
    if (!elemento) return;
    const previo = (elemento.textContent || "").trim();
    const siguiente = formatearPuntosMarcador(valor);
    elemento.textContent = siguiente;
    if (animar && siguiente !== previo) {
        destacarPuntosEspectadorHit(elemento);
    }
}

function actualizarMusasMarcadorEquipo(elemento, valor, animar = true) {
    if (!elemento) return;
    const previo = (elemento.textContent || "").trim();
    const siguiente = formatearMusasMarcador(valor);
    elemento.textContent = siguiente;
    if (animar && siguiente !== previo) {
        destacarPuntosEspectadorHit(elemento);
    }
}

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
let cola_palabras_pendientes_espectador = [];
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
const CLASE_INTRO_BLOQUE_ESPECTADOR = "intro-reveal-bloque";
const CLASE_INTRO_OCULTO_ESPECTADOR = "is-intro-hidden";
const FASE_INTRO_MAX_ESPECTADOR = 3;
const jugador_intro_1 = contenedor_espectador ? contenedor_espectador.querySelector(".jugador1") : null;
const jugador_intro_2 = contenedor_espectador ? contenedor_espectador.querySelector(".jugador2") : null;
const BLOQUES_INTRO_CUENTA_ATRAS_ESPECTADOR = [
    { key: "nivel", elemento: info_general, origen: "up" },
    { key: "jugadora1", elemento: jugador_intro_1, origen: "left" },
    { key: "jugadora2", elemento: jugador_intro_2, origen: "right" },
    { key: "inspiracion", elemento: inspiracion, origen: "down" }
];
const CLASES_BARRA_NIVEL = [
    "barra-nivel--bendita",
    "barra-nivel--prohibida",
    "barra-nivel--bonus",
    "barra-nivel--prohibidas",
    "barra-nivel--tertulia",
    "barra-nivel--frase-final"
];

let DURACION_NIVEL_MS = 60000;
let inicio_nivel_ts = 0;
let intervalo_progreso_nivel = null;
let intro_cuenta_atras_activa = false;
let intro_cuenta_atras_fase = -1;

let sonido;

function limpiarColaPalabrasPendientesEspectador() {
    cola_palabras_pendientes_espectador = [];
}

function debeAplazarRenderPalabraEspectador() {
    return Boolean(cuenta_atras_activa || inicio_modo_delay || modo_pendiente);
}

function encolarPalabraPendienteEspectador(data, escritxr) {
    const jugador = Number(escritxr) === 2 ? 2 : 1;
    cola_palabras_pendientes_espectador.push({ data, escritxr: jugador });
    if (cola_palabras_pendientes_espectador.length > 40) {
        cola_palabras_pendientes_espectador.shift();
    }
}

function vaciarColaPalabrasPendientesEspectador() {
    if (!cola_palabras_pendientes_espectador.length) return;
    const cola = cola_palabras_pendientes_espectador.slice();
    cola_palabras_pendientes_espectador = [];
    cola.forEach((item) => {
        if (!item) return;
        recibir_palabra(item.data, item.escritxr);
    });
}

function asegurarIntroBloquesEspectador() {
    BLOQUES_INTRO_CUENTA_ATRAS_ESPECTADOR.forEach((bloque) => {
        if (!bloque || !bloque.elemento || !bloque.elemento.classList) return;
        bloque.elemento.classList.add(CLASE_INTRO_BLOQUE_ESPECTADOR);
        if (bloque.origen) {
            bloque.elemento.dataset.introFrom = bloque.origen;
        }
    });
}

function setOcultoIntroBloqueEspectador(bloque, ocultar = true) {
    if (!bloque || !bloque.elemento || !bloque.elemento.classList) return;
    if (ocultar) {
        bloque.elemento.classList.add(CLASE_INTRO_OCULTO_ESPECTADOR);
    } else {
        bloque.elemento.classList.remove(CLASE_INTRO_OCULTO_ESPECTADOR);
    }
}

function faseIntroDesdeContadorEspectador(contador) {
    if (contador >= 3) return 0;
    if (contador === 2) return 1;
    if (contador === 1) return 2;
    return 3;
}

function revelarFaseIntroCuentaAtrasEspectador(faseObjetivo) {
    if (!intro_cuenta_atras_activa) return;
    const fase = Math.max(-1, Math.min(FASE_INTRO_MAX_ESPECTADOR, Number(faseObjetivo)));
    if (!Number.isFinite(fase) || fase <= intro_cuenta_atras_fase) return;
    for (let i = intro_cuenta_atras_fase + 1; i <= fase; i += 1) {
        const bloque = BLOQUES_INTRO_CUENTA_ATRAS_ESPECTADOR[i];
        setOcultoIntroBloqueEspectador(bloque, false);
    }
    intro_cuenta_atras_fase = fase;
}

function iniciarIntroCuentaAtrasEspectador() {
    finalizarIntroCuentaAtrasEspectador();
    if (vista_espectador_modo_resuelta !== "partida") return;
    asegurarIntroBloquesEspectador();
    BLOQUES_INTRO_CUENTA_ATRAS_ESPECTADOR.forEach((bloque) => {
        setOcultoIntroBloqueEspectador(bloque, true);
    });
    intro_cuenta_atras_activa = true;
    intro_cuenta_atras_fase = -1;
}

function actualizarIntroCuentaAtrasSegunContador(contador) {
    if (!intro_cuenta_atras_activa) return;
    if (vista_espectador_modo_resuelta !== "partida") {
        finalizarIntroCuentaAtrasEspectador();
        return;
    }
    revelarFaseIntroCuentaAtrasEspectador(faseIntroDesdeContadorEspectador(contador));
}

function finalizarIntroCuentaAtrasEspectador() {
    asegurarIntroBloquesEspectador();
    BLOQUES_INTRO_CUENTA_ATRAS_ESPECTADOR.forEach((bloque) => {
        setOcultoIntroBloqueEspectador(bloque, false);
    });
    intro_cuenta_atras_activa = false;
    intro_cuenta_atras_fase = FASE_INTRO_MAX_ESPECTADOR;
}

function normalizarDuracionNivelMs(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return null;
    if (numero <= 600) return Math.round(numero * 1000);
    return Math.round(numero);
}

function actualizarDuracionNivelDesdeParametros(parametros = {}) {
    const candidatos = [
        parametros.TIEMPO_MODOS,
        parametros.DURACION_TIEMPO_MODOS,
        parametros.TIEMPO_CAMBIO_MODOS,
        parametros.DURACION_TIEMPO_MUERTO
    ];
    for (const candidato of candidatos) {
        const ms = normalizarDuracionNivelMs(candidato);
        if (ms) {
            DURACION_NIVEL_MS = ms;
            return;
        }
    }
}

function setProgresoNivelBarra(progreso) {
    if (!palabra1) return;
    const valor = Number(progreso);
    const pct = Math.max(0, Math.min(100, Number.isFinite(valor) ? valor : 0));
    palabra1.style.setProperty("--nivel-progress", `${pct.toFixed(2)}%`);
}

function detenerProgresoNivelBarra(reiniciar = false) {
    if (intervalo_progreso_nivel) {
        clearInterval(intervalo_progreso_nivel);
        intervalo_progreso_nivel = null;
    }
    inicio_nivel_ts = 0;
    if (reiniciar) {
        setProgresoNivelBarra(0);
    }
}

function tickProgresoNivelBarra() {
    if (!inicio_nivel_ts || DURACION_NIVEL_MS <= 0) {
        setProgresoNivelBarra(0);
        return;
    }
    const transcurrido = Date.now() - inicio_nivel_ts;
    const pct = Math.min(100, (transcurrido / DURACION_NIVEL_MS) * 100);
    setProgresoNivelBarra(pct);
    if (pct >= 100) {
        detenerProgresoNivelBarra(false);
    }
}

function iniciarProgresoNivelBarra() {
    detenerProgresoNivelBarra(true);
    inicio_nivel_ts = Date.now();
    tickProgresoNivelBarra();
    intervalo_progreso_nivel = setInterval(tickProgresoNivelBarra, 120);
}

function formatoLetraNivel(letra) {
    const valor = String(letra || "").trim();
    return valor ? valor.toUpperCase() : "-";
}

function escaparHTML(texto) {
    return String(texto).replace(/[&<>"']/g, (char) => {
        switch (char) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case "\"": return "&quot;";
            case "'": return "&#39;";
            default: return char;
        }
    });
}

function renderLetraDestacadaNivel(letra) {
    const valor = escaparHTML(formatoLetraNivel(letra));
    return `<span class="explicacion-letra-destacada">${valor}</span>`;
}

function construirExplicacionNivelLetra(tipo, letra) {
    const letraDestacada = renderLetraDestacadaNivel(letra);
    if (tipo === "bendita") {
        return `CADA PALABRA DEBE INCLUIR LA LETRA ${letraDestacada}.`;
    }
    if (tipo === "prohibida") {
        return `NINGUNA PALABRA PUEDE USAR LA LETRA ${letraDestacada}.`;
    }
    return "";
}

function setBarraNivelClase(tipo = "") {
    if (!palabra1) return;
    CLASES_BARRA_NIVEL.forEach((clase) => palabra1.classList.remove(clase));
    if (!tipo) return;
    palabra1.classList.add(`barra-nivel--${tipo}`);
}

const CLASES_ESTILO_PALABRA_LETRA = [
    "palabra-letras--bendita",
    "palabra-letras--prohibida",
    "palabra-letras--bonus",
    "palabra-letras--prohibidas",
    "palabra-letras--frase-final"
];
const CLASES_ESTILO_DEFINICION_LETRA = [
    "definicion-letras--bendita",
    "definicion-letras--prohibida",
    "definicion-letras--bonus",
    "definicion-letras--prohibidas",
    "definicion-letras--frase-final"
];
const PROPIEDADES_INLINE_PALABRA_LETRAS = [
    "display",
    "align-items",
    "justify-content",
    "flex-wrap",
    "box-sizing",
    "width",
    "max-width",
    "min-height",
    "margin",
    "padding",
    "border",
    "border-radius",
    "background",
    "color",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "text-align",
    "word-break",
    "overflow-wrap",
    "letter-spacing",
    "text-shadow",
    "box-shadow",
    "white-space",
    "overflow",
    "text-overflow",
    "position",
    "isolation"
];
const PROPIEDADES_INLINE_DEFINICION_LETRAS = [
    "display",
    "box-sizing",
    "width",
    "max-width",
    "min-height",
    "max-height",
    "margin",
    "padding",
    "border",
    "border-radius",
    "background",
    "color",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "letter-spacing",
    "text-shadow",
    "overflow",
    "white-space",
    "text-overflow",
    "scrollbar-width",
    "box-shadow"
];
const CLASES_MODO_LETRAS_ESPECTADOR_BODY = [
    "modo-letra-bendita-espectador",
    "modo-letra-prohibida-espectador",
    "modo-palabras-bonus-espectador",
    "modo-palabras-prohibidas-espectador",
    "modo-frase-final-espectador"
];

function setClaseModoLetrasEspectadorBody(tipo = "") {
    if (!document.body || !document.body.classList) return;
    CLASES_MODO_LETRAS_ESPECTADOR_BODY.forEach((clase) => document.body.classList.remove(clase));
    if (tipo === "bendita") {
        document.body.classList.add("modo-letra-bendita-espectador");
    } else if (tipo === "prohibida") {
        document.body.classList.add("modo-letra-prohibida-espectador");
    } else if (tipo === "bonus") {
        document.body.classList.add("modo-palabras-bonus-espectador");
    } else if (tipo === "prohibidas") {
        document.body.classList.add("modo-palabras-prohibidas-espectador");
    } else if (tipo === "frase-final") {
        document.body.classList.add("modo-frase-final-espectador");
    }
}

function limpiarPropiedadesInlineModoLetras(nodo, propiedades) {
    if (!nodo || !nodo.style || !Array.isArray(propiedades)) return;
    propiedades.forEach((propiedad) => nodo.style.removeProperty(propiedad));
}

function aplicarInlineEstiloPalabraModoLetras(nodo, tipo = "") {
    if (!nodo || !nodo.style) return;
    const PALETAS = {
        bendita: { borde: "#5dff86", gradA: "#8affaa", gradB: "#2cb95d", texto: "#f5fbff", sombra: "0.06em 0.06em 0 rgba(0, 0, 0, 0.55), 0 0 0.4em rgba(0, 0, 0, 0.25)" },
        prohibida: { borde: "#ff6f84", gradA: "#ff9daf", gradB: "#d43f5b", texto: "#f5fbff", sombra: "0.06em 0.06em 0 rgba(0, 0, 0, 0.55), 0 0 0.4em rgba(0, 0, 0, 0.25)" },
        bonus: { borde: "#ffd86f", gradA: "#fff27c", gradB: "#f3b340", texto: "#121825", sombra: "0.05em 0.05em 0 rgba(255, 255, 255, 0.35), 0 0.12em 0.25em rgba(0, 0, 0, 0.38)" },
        prohibidas: { borde: "#ff9be3", gradA: "#ffc1ee", gradB: "#dc66bb", texto: "#151a27", sombra: "0.05em 0.05em 0 rgba(255, 255, 255, 0.3), 0 0.12em 0.25em rgba(0, 0, 0, 0.36)" },
        "frase-final": { borde: "#ffb675", gradA: "#ffd6a6", gradB: "#e58b3f", texto: "#1a1b20", sombra: "0.05em 0.05em 0 rgba(255, 255, 255, 0.28), 0 0.12em 0.25em rgba(0, 0, 0, 0.4)" }
    };
    const paleta = PALETAS[tipo] || PALETAS.bendita;
    const borde = paleta.borde;
    const gradA = paleta.gradA;
    const gradB = paleta.gradB;
    const texto = paleta.texto || "#f5fbff";
    const sombra = paleta.sombra || "0.06em 0.06em 0 rgba(0, 0, 0, 0.55), 0 0 0.4em rgba(0, 0, 0, 0.25)";
    nodo.style.setProperty("display", "flex", "important");
    nodo.style.setProperty("align-items", "center", "important");
    nodo.style.setProperty("justify-content", "center", "important");
    nodo.style.setProperty("flex-wrap", "wrap", "important");
    nodo.style.setProperty("box-sizing", "border-box", "important");
    nodo.style.setProperty("width", "min(92vw, 1100px)", "important");
    nodo.style.setProperty("max-width", "100%", "important");
    nodo.style.setProperty("min-height", "clamp(34px, 3vw, 58px)", "important");
    nodo.style.setProperty("margin", "clamp(4px, 0.45vw, 9px) auto 0", "important");
    nodo.style.setProperty("padding", "clamp(6px, 0.55vw, 11px) clamp(14px, 1.6vw, 28px)", "important");
    nodo.style.setProperty("border", "clamp(2px, 0.16vw, 4px) solid " + borde, "important");
    nodo.style.setProperty("border-radius", "clamp(10px, 1vw, 18px)", "important");
    nodo.style.setProperty("background", "linear-gradient(110deg, " + gradA + " 0%, " + gradB + " 100%)", "important");
    nodo.style.setProperty("color", texto, "important");
    nodo.style.setProperty("font-family", "\"Retro-gaming\"", "important");
    nodo.style.setProperty("font-size", "clamp(22px, 1.9vw, 36px)", "important");
    nodo.style.setProperty("font-weight", "700", "important");
    nodo.style.setProperty("line-height", "1.08", "important");
    nodo.style.setProperty("text-align", "center", "important");
    nodo.style.setProperty("word-break", "break-word", "important");
    nodo.style.setProperty("overflow-wrap", "anywhere", "important");
    nodo.style.setProperty("letter-spacing", "clamp(0.02em, 0.08vw, 0.08em)", "important");
    nodo.style.setProperty("text-shadow", sombra, "important");
    nodo.style.setProperty("box-shadow", "inset 0 0 0 1px rgba(255, 255, 255, 0.14), inset 0 -0.2em 0 rgba(0, 0, 0, 0.25), 0 0.18em 0 rgba(0, 0, 0, 0.28)", "important");
    nodo.style.setProperty("white-space", "normal", "important");
    nodo.style.setProperty("overflow", "hidden", "important");
    nodo.style.setProperty("text-overflow", "clip", "important");
    nodo.style.setProperty("position", "relative", "important");
    nodo.style.setProperty("isolation", "isolate", "important");
}

function aplicarInlineEstiloDefinicionModoLetras(nodo, tipo = "") {
    if (!nodo || !nodo.style) return;
    const PALETAS = {
        bendita: { borde: "#5dff86", fondo: "linear-gradient(160deg, rgba(7, 16, 10, 0.94) 0%, rgba(10, 35, 17, 0.92) 100%)" },
        prohibida: { borde: "#ff6f84", fondo: "linear-gradient(160deg, rgba(16, 7, 11, 0.94) 0%, rgba(40, 11, 19, 0.92) 100%)" },
        bonus: { borde: "#ffd86f", fondo: "linear-gradient(160deg, rgba(21, 17, 7, 0.94) 0%, rgba(46, 32, 8, 0.92) 100%)" },
        prohibidas: { borde: "#ff9be3", fondo: "linear-gradient(160deg, rgba(18, 7, 18, 0.94) 0%, rgba(40, 10, 34, 0.92) 100%)" },
        "frase-final": { borde: "#ffb675", fondo: "linear-gradient(160deg, rgba(24, 12, 6, 0.94) 0%, rgba(54, 27, 8, 0.92) 100%)" }
    };
    const paleta = PALETAS[tipo] || PALETAS.bendita;
    const borde = paleta.borde;
    const fondo = paleta.fondo;
    nodo.style.setProperty("display", "block", "important");
    nodo.style.setProperty("box-sizing", "border-box", "important");
    nodo.style.setProperty("width", "min(92vw, 1100px)", "important");
    nodo.style.setProperty("max-width", "min(92vw, 1100px)", "important");
    nodo.style.setProperty("min-height", "clamp(26px, 2.3vw, 42px)", "important");
    nodo.style.setProperty("max-height", "none", "important");
    nodo.style.setProperty("margin", "clamp(4px, 0.35vw, 8px) auto 0", "important");
    nodo.style.setProperty("padding", "clamp(6px, 0.5vw, 10px) clamp(12px, 1.2vw, 20px)", "important");
    nodo.style.setProperty("border", "clamp(1px, 0.12vw, 3px) solid " + borde, "important");
    nodo.style.setProperty("border-radius", "clamp(8px, 0.8vw, 14px)", "important");
    nodo.style.setProperty("background", fondo, "important");
    nodo.style.setProperty("color", "#f2f8ff", "important");
    nodo.style.setProperty("font-family", "\"Retro-gaming\"", "important");
    nodo.style.setProperty("font-size", "clamp(15px, 1.12vw, 24px)", "important");
    nodo.style.setProperty("font-weight", "700", "important");
    nodo.style.setProperty("line-height", "1.08", "important");
    nodo.style.setProperty("letter-spacing", "clamp(0.02em, 0.04vw, 0.06em)", "important");
    nodo.style.setProperty("text-shadow", "0.06em 0.06em 0 rgba(0, 0, 0, 0.62)", "important");
    nodo.style.setProperty("overflow", "hidden", "important");
    nodo.style.setProperty("white-space", "nowrap", "important");
    nodo.style.setProperty("text-overflow", "ellipsis", "important");
    nodo.style.setProperty("scrollbar-width", "none", "important");
    nodo.style.setProperty("box-shadow", "inset 0 0 0 1px rgba(255, 255, 255, 0.1)", "important");
}

function limpiarEstiloPalabrasModoLetrasEspectador() {
    setClaseModoLetrasEspectadorBody("");
    [palabra2, palabra3].forEach((nodo) => {
        if (!nodo || !nodo.classList) return;
        CLASES_ESTILO_PALABRA_LETRA.forEach((clase) => nodo.classList.remove(clase));
        limpiarPropiedadesInlineModoLetras(nodo, PROPIEDADES_INLINE_PALABRA_LETRAS);
        nodo.style.removeProperty("background-color");
        nodo.style.removeProperty("color");
    });
    [definicion2, definicion3].forEach((nodo) => {
        if (!nodo || !nodo.classList) return;
        CLASES_ESTILO_DEFINICION_LETRA.forEach((clase) => nodo.classList.remove(clase));
        limpiarPropiedadesInlineModoLetras(nodo, PROPIEDADES_INLINE_DEFINICION_LETRAS);
        nodo.style.removeProperty("background-color");
        nodo.style.removeProperty("color");
    });
}

function aplicarEstiloPalabrasModoLetrasEspectador(tipo = "") {
    limpiarEstiloPalabrasModoLetrasEspectador();
    if (!tipo || tipo === "bendita" || tipo === "prohibida") return;
    setClaseModoLetrasEspectadorBody(tipo);
    const clasePalabra = `palabra-letras--${tipo}`;
    const claseDefinicion = `definicion-letras--${tipo}`;
    [palabra2, palabra3].forEach((nodo) => {
        if (nodo && nodo.classList) {
            nodo.classList.add(clasePalabra);
            aplicarInlineEstiloPalabraModoLetras(nodo, tipo);
        }
    });
    [definicion2, definicion3].forEach((nodo) => {
        if (nodo && nodo.classList) {
            nodo.classList.add(claseDefinicion);
            aplicarInlineEstiloDefinicionModoLetras(nodo, tipo);
        }
    });
}

const CLASES_FX_CAMBIO_LETRA_ESPECTADOR = [
    "fx-cambio-letra-bendita",
    "fx-cambio-letra-maldita"
];
const CLASES_FX_CAMBIO_PALABRA_ESPECTADOR = [
    "fx-palabra-cambio-bendita",
    "fx-palabra-cambio-maldita"
];
const CLASES_FX_CAMBIO_DEFINICION_ESPECTADOR = [
    "fx-definicion-cambio-bendita",
    "fx-definicion-cambio-maldita"
];

function extraerDefinicionPalabraEvento(data = {}) {
    if (!data || typeof data !== "object") return "";
    const bonus = data.palabra_bonus;
    if (Array.isArray(bonus)) {
        const candidato = bonus.length > 1 ? bonus[1] : "";
        if (typeof candidato === "string" && candidato.trim()) return candidato;
    }
    if (typeof bonus === "string" && bonus.trim()) return bonus;
    if (typeof data.definicion === "string" && data.definicion.trim()) return data.definicion;
    if (typeof data.descripcion === "string" && data.descripcion.trim()) return data.descripcion;
    if (typeof data.significado === "string" && data.significado.trim()) return data.significado;
    return "";
}

function actualizarDefinicionConVisibilidad(nodo, contenidoHTML, usarMarquee = true) {
    if (!nodo) return;
    const contenido = typeof contenidoHTML === "string" ? contenidoHTML.trim() : "";
    if (!contenido) {
        nodo.innerHTML = "";
        nodo.style.setProperty("display", "none", "important");
        return;
    }
    nodo.style.setProperty("display", "block", "important");
    nodo.innerHTML = contenido;
    if (usarMarquee) {
        aplicarMarqueeSiOverflow(nodo);
    }
}

function actualizarPalabraConVisibilidad(nodo, contenidoHTML) {
    if (!nodo) return false;
    const contenido = typeof contenidoHTML === "string" ? contenidoHTML.trim() : "";
    if (!contenido) {
        nodo.innerHTML = "";
        nodo.style.setProperty("display", "none", "important");
        return false;
    }
    nodo.innerHTML = contenido;
    if (nodo.classList && (
        nodo.classList.contains("palabra-letras--bonus") ||
        nodo.classList.contains("palabra-letras--prohibidas") ||
        nodo.classList.contains("palabra-letras--frase-final") ||
        nodo.classList.contains("palabra-letras--bendita") ||
        nodo.classList.contains("palabra-letras--prohibida")
    )) {
        nodo.style.setProperty("display", "flex", "important");
    } else {
        nodo.style.setProperty("display", "block", "important");
    }
    return true;
}

function extraerPalabraPrincipalEvento(data = {}) {
    return extraerPalabraEventoInspiracion(data);
}

function obtenerClaseTiempoPalabraSegunModo() {
    if (modo_actual === "letra bendita" || modo_actual === "palabras bonus") {
        return "palabra-tiempo--bendita";
    }
    if (modo_actual === "letra prohibida" || modo_actual === "palabras prohibidas") {
        return "palabra-tiempo--maldita";
    }
    return "";
}

function construirTextoPalabraEvento(data = {}) {
    let palabra = extraerPalabraPrincipalEvento(data);
    if (!palabra && data && typeof data === "object") {
        const palabrasVar = data.palabras_var;
        if (typeof palabrasVar === "string") {
            palabra = palabrasVar.trim();
        } else if (Array.isArray(palabrasVar)) {
            const primera = palabrasVar.length ? palabrasVar[0] : "";
            palabra = extraerPalabraEventoInspiracion(primera) || extraerPalabraEventoInspiracion(palabrasVar);
        } else if (typeof palabrasVar !== "undefined" && palabrasVar !== null) {
            palabra = String(palabrasVar).trim();
        }
    }
    if (!palabra && data && typeof data === "object") {
        const bonus = data.palabra_bonus;
        if (Array.isArray(bonus) && bonus.length) {
            palabra = extraerPalabraEventoInspiracion(bonus[0]) || extraerPalabraEventoInspiracion(bonus);
        } else if (typeof bonus === "string") {
            palabra = bonus.trim();
        }
    }
    if (!palabra) return "";
    const palabraSegura = escaparHTML(palabra);
    const tiempoRaw = data.tiempo_palabras_bonus;
    const hayTiempo = !(tiempoRaw === null || typeof tiempoRaw === "undefined" || String(tiempoRaw).trim() === "");
    if (!hayTiempo) return palabraSegura;
    const tiempoLimpio = String(tiempoRaw).trim().replace(/^[+-]\s*/, "");
    const signo = (modo_actual == "palabras prohibidas") ? "-" : "+";
    const tiempoTexto = `${signo}${tiempoLimpio} segs.`;
    const claseTiempo = obtenerClaseTiempoPalabraSegunModo();
    if (!claseTiempo) {
        return `${palabraSegura} ${escaparHTML(tiempoTexto)}`;
    }
    return `${palabraSegura} <span class="palabra-tiempo ${claseTiempo}">${escaparHTML(tiempoTexto)}</span>`;
}

function reiniciarClaseAnimadaEspectador(nodo, clase, duracionMs = 820) {
    if (!nodo || !nodo.classList || !clase) return;
    nodo.classList.remove(clase);
    void nodo.offsetWidth;
    nodo.classList.add(clase);
    setTimeout(() => {
        if (nodo && nodo.classList) {
            nodo.classList.remove(clase);
        }
    }, duracionMs);
}

function activarEfectoCambioLetraEspectador(tipo = "") {
    const esBendita = tipo === "bendita";
    const esProhibida = tipo === "prohibida";
    if (!esBendita && !esProhibida) return;
    const clase = esBendita ? "fx-cambio-letra-bendita" : "fx-cambio-letra-maldita";

    if (palabra1 && palabra1.classList) {
        CLASES_FX_CAMBIO_LETRA_ESPECTADOR.forEach((nombreClase) => palabra1.classList.remove(nombreClase));
    }
    if (explicacion && explicacion.classList) {
        CLASES_FX_CAMBIO_LETRA_ESPECTADOR.forEach((nombreClase) => explicacion.classList.remove(nombreClase));
    }

    reiniciarClaseAnimadaEspectador(palabra1, clase, 880);
    reiniciarClaseAnimadaEspectador(explicacion, clase, 880);
}

function animarCambioPalabraLetrasEspectador(nodoPalabra, nodoDefinicion) {
    const esBendita = modo_actual === "letra bendita";
    const esProhibida = modo_actual === "letra prohibida";
    if (!esBendita && !esProhibida) return false;

    const clasePalabra = esBendita ? "fx-palabra-cambio-bendita" : "fx-palabra-cambio-maldita";
    const claseDefinicion = esBendita ? "fx-definicion-cambio-bendita" : "fx-definicion-cambio-maldita";

    if (nodoPalabra && nodoPalabra.classList) {
        CLASES_FX_CAMBIO_PALABRA_ESPECTADOR.forEach((nombreClase) => nodoPalabra.classList.remove(nombreClase));
    }
    if (nodoDefinicion && nodoDefinicion.classList) {
        CLASES_FX_CAMBIO_DEFINICION_ESPECTADOR.forEach((nombreClase) => nodoDefinicion.classList.remove(nombreClase));
    }

    reiniciarClaseAnimadaEspectador(nodoPalabra, clasePalabra, 760);
    reiniciarClaseAnimadaEspectador(nodoDefinicion, claseDefinicion, 900);
    return true;
}

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
    "ï¿½Yï¿½ï¿½": function () {
        
    },
    "ï¿½sï¿½": function (player) {
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

    "ï¿½O>": function () {

    },
    "ï¿½YTf": function (player) {
        detenerAudioInverso();
        audio_inverso = reproducirSonido("../../game/audio/FX/8. INVERSO LOOP.mp3", true)
        if(player == 1){
            texto1.classList.add("rotate-vertical-center");
            // A�f±ade un escuchador para el evento 'animationend'
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
            // A�f±ade un escuchador para el evento 'animationend'
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

    "ï¿½YOï¿½ï¸": function (player) {
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
    "ï¿½Yï¿½ï¿½": function (player) {
    },
    "ï¿½Y-Sï¸": function (player) {
    },
};

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    'palabras bonus': function (data) {
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true)
    reproducirSonido("../../game/audio/FX/12. PALABRAS BONUS.mp3")
        console.log("ALGO")
        aplicarEstiloPalabrasModoLetrasEspectador("bonus");
        actualizarPalabraConVisibilidad(palabra2, "");
        actualizarPalabraConVisibilidad(palabra3, "");
        setBarraNivelClase("bonus");
        explicacion.style.color = "yellow";
        explicacion.innerHTML = "SUMA TIEMPO CON PALABRAS BONUS";
        palabra1.innerHTML = "NIVEL PALABRAS BONUS";
        actualizarDefinicionConVisibilidad(definicion2, "", false);
        definicion2.style.maxWidth = "100%";
        actualizarDefinicionConVisibilidad(definicion3, "", false);
        definicion3.style.maxWidth = "100%";
    },

    //Recibe y activa el modo letra prohibida.
    'letra prohibida': function (data = {}) {
        sonido_modo = reproducirSonido("../../game/audio/6. KEYGEN PRUEBA 2.mp3", true)
        reproducirSonido("../../game/audio/FX/11. LETRA PROHIBIDA.mp3")
        actualizarPalabraConVisibilidad(palabra2, "");
        actualizarDefinicionConVisibilidad(definicion2, "", false);
        explicacion1.innerHTML = "";
        actualizarPalabraConVisibilidad(palabra3, "");
        actualizarDefinicionConVisibilidad(definicion3, "", false);
        explicacion2.innerHTML = "";
        aplicarEstiloPalabrasModoLetrasEspectador("prohibida");
        setBarraNivelClase("prohibida");
        explicacion.style.color = "red";
        explicacion.innerHTML = construirExplicacionNivelLetra("prohibida", data.letra_prohibida);
        palabra1.innerHTML = "NIVEL LETRA PROHIBIDA";
        actualizarDefinicionConVisibilidad(definicion2, "", false);
        definicion2.style.maxWidth = "100%";
        actualizarDefinicionConVisibilidad(definicion3, "", false);
        definicion3.style.maxWidth = "100%";
        activarEfectoCambioLetraEspectador("prohibida");
        
    },

    //Recibe y activa el modo letra bendita.
    'letra bendita': function (data = {}) {
        reproducirSonido("../../game/audio/FX/10. LETRA BENDITA.mp3")
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true);

        actualizarPalabraConVisibilidad(palabra2, "");
        actualizarDefinicionConVisibilidad(definicion2, "", false);
        explicacion1.innerHTML = "";
        actualizarPalabraConVisibilidad(palabra3, "");
        actualizarDefinicionConVisibilidad(definicion3, "", false);
        explicacion2.innerHTML = "";

        aplicarEstiloPalabrasModoLetrasEspectador("bendita");
        setBarraNivelClase("bendita");
        explicacion.style.color = "lime";
        explicacion.innerHTML = construirExplicacionNivelLetra("bendita", data.letra_bendita);
        palabra1.innerHTML = "NIVEL LETRA BENDITA";
        actualizarDefinicionConVisibilidad(definicion2, "", false);
        definicion2.style.maxWidth = "100%";
        actualizarDefinicionConVisibilidad(definicion3, "", false);
        definicion3.style.maxWidth = "100%";
        activarEfectoCambioLetraEspectador("bendita");
    },

    'psicod�f©lico': function (data, socket, player) {
        //explicacion.innerHTML = "MODO PSICODï¿½?LICO";
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
        aplicarEstiloPalabrasModoLetrasEspectador("prohibidas");
        actualizarPalabraConVisibilidad(palabra2, "");
        actualizarPalabraConVisibilidad(palabra3, "");
        setBarraNivelClase("prohibidas");
        explicacion.style.color = "pink";
        explicacion.innerHTML = "EVITA LAS PALABRAS PROHIBIDAS";
        palabra1.innerHTML = "NIVEL PALABRAS PROHIBIDAS";
        actualizarDefinicionConVisibilidad(definicion2, "", false);
        definicion2.style.maxWidth = "100%";
        actualizarDefinicionConVisibilidad(definicion3, "", false);
        definicion3.style.maxWidth = "100%";
    },

    'tertulia': function (socket) {
        sonido_modo = reproducirSonido("../../game/audio/7. KEYGEN PRUEBA 3.mp3", true)
        reproducirSonido("../../game/audio/FX/14. TERTULIA.mp3")
        setBarraNivelClase("tertulia");
        //activar_socket_feedback();
        explicacion.style.color = "#86d0ff";
        explicacion.innerHTML = "MODIFICADORES ACTIVOS";
        palabra1.innerHTML = "NIVEL TERTULIA";

    },

    'frase final': function (socket) {
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true)
        reproducirSonido("../../game/audio/FX/15. FRASE FINAL.mp3")
        aplicarEstiloPalabrasModoLetrasEspectador("frase-final");
        setBarraNivelClase("frase-final");
        //activar_socket_feedback();
        explicacion.style.color = "orange";
        explicacion.innerHTML = "ULTIMA RONDA";
        palabra1.innerHTML = "NIVEL FRASE FINAL";
        actualizarPalabraConVisibilidad(palabra2, "&laquo;" + frase_final_j1 + "&raquo;");
        actualizarDefinicionConVisibilidad(definicion2, "&iexcl;Esta es la &uacute;ltima!", false);
        actualizarDefinicionConVisibilidad(definicion3, "&iexcl;Esta es la &uacute;ltima!", false);
        actualizarPalabraConVisibilidad(palabra3, "&laquo;" + frase_final_j2 + "&raquo;");
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
        limpiarEstiloPalabrasModoLetrasEspectador();
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        actualizarPalabraConVisibilidad(palabra2, "");
        actualizarPalabraConVisibilidad(palabra3, "");
        definicion2.innerHTML = "";
        definicion3.innerHTML = "";
    },

    "letra prohibida": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
        limpiarEstiloPalabrasModoLetrasEspectador();
    },

    "letra bendita": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
        limpiarEstiloPalabrasModoLetrasEspectador();
    },

    "psicod�f©lico": function (data, player) {
        if(player == 1){
            activado_psico1 = false;
        }
        else if(player == 2){
            activado_psico2 = false;
        }

        if(activado_psico1 == false && activado_psico2 == false){
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicod�f©lico, se vuelve a limpiar.
        }
    },

    "palabras prohibidas": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
        limpiarEstiloPalabrasModoLetrasEspectador();
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        actualizarPalabraConVisibilidad(palabra2, "");
        actualizarPalabraConVisibilidad(palabra3, "");
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
        limpiarEstiloPalabrasModoLetrasEspectador();
        definicion1.innerHTML = "";
        definicion2.innerHTML = "";
        definicion3.innerHTML = "";
        palabra1.innerHTML = "";
        actualizarPalabraConVisibilidad(palabra2, "");
        actualizarPalabraConVisibilidad(palabra3, "");
    },

    "": function (data) { },
};

function ejecutarLimpiezaModo(nombreModo, data) {
    const limpieza = LIMPIEZAS[nombreModo] || LIMPIEZAS[""];
    if (typeof limpieza === "function") {
        limpieza(data);
    }
}

function ejecutarModo(nombreModo, data) {
    const activador = MODOS[nombreModo] || MODOS[""];
    if (typeof activador === "function") {
        activador(data);
    }
}

activar_sockets_extratextuales();

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    actualizarEtiquetasCursorCalentamiento();
    socket.emit('registrar_espectador');
    socket.emit('pedir_calentamiento_estado');
    socket.emit('pedir_vista_espectador_modo');
    socket.emit('pedir_stats_live');
    socket.emit('pedir_nube_inspiracion');
    iniciarSlidesStats();
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

socket.on('vista_espectador_modo', (payload = {}) => {
    actualizarModoVistaEspectadorRemota(payload);
});

socket.on('stats_live_estado', (payload = {}) => {
    estado_stats_live_espectador = normalizarStatsLiveEspectador(payload);
    if (vista_espectador_modo_resuelta === "stats") {
        renderizarStatsEspectador();
    }
});

socket.on('disconnect', () => {
    detenerSlidesStats();
    detenerAnimacionNubeInspiracion();
});

socket.on('nube_inspiracion_estado', (payload = {}) => {
    estado_nube_inspiracion_espectador = normalizarNubeInspiracionEspectador(payload);
    sincronizarNubeDesdeSnapshot(estado_nube_inspiracion_espectador);
    if (vista_espectador_modo_resuelta === "nube_inspiracion") {
        renderizarNubeInspiracion();
    }
});


socket.on('actualizar_contador_musas', contador_musas => {
    console.log("actualizar_contador_musas")
    actualizarMusasMarcadorEquipo(musas1, contador_musas.escritxr1);
    actualizarMusasMarcadorEquipo(musas2, contador_musas.escritxr2);

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
        actualizarPuntosMarcadorEquipo(puntos1, paquete.points);
        console.log("CAMBIADDOO")
        cambiar_color_puntuacion()
        const caretLine = Number.isInteger(paquete.caretLine) ? paquete.caretLine : null;
        const caretRatio = typeof paquete.caretRatio === "number" ? paquete.caretRatio : null;
        const caretPos = typeof paquete.caretPos === "number"
            ? paquete.caretPos
            : (paquete.caretPos && typeof paquete.caretPos.caretPos === "number" ? paquete.caretPos.caretPos : null);
        const caretPath = Array.isArray(paquete.caretPath) ? paquete.caretPath : null;
        const caretOffset = Number.isInteger(paquete.caretOffset) ? paquete.caretOffset : null;
        if (caretPos !== null) {
            if (posicionarScrollPorCaretPosPreciso(texto1, caretPos)) {
                programarActualizacionDegradadoTextareaEspectador(texto1);
                return;
            }
        }
        if (caretPath && caretOffset !== null) {
            if (posicionarScrollPorCaretPath(texto1, caretPath, caretOffset)) {
                programarActualizacionDegradadoTextareaEspectador(texto1);
                return;
            }
        }
        if (caretPos !== null) {
            const maxPos = obtenerTextoPlanoConSaltos(texto1).length;
            if (maxPos > 0 && caretPos >= maxPos - 1) {
                texto1.scrollTop = texto1.scrollHeight;
                programarActualizacionDegradadoTextareaEspectador(texto1);
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
            saltos_l�f­nea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_l�f­nea_alineacion_2 += 1;
            texto2.innerText = "\n" + texto2.innerText;
        }
    }*/
        texto1.style.height = "";
        if (caretPos === null) {
            texto1.scrollTop = texto1.scrollHeight;
        }
        programarActualizacionDegradadoTextareaEspectador(texto1);
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
        actualizarPuntosMarcadorEquipo(puntos2, paquete.points);
        cambiar_color_puntuacion()
        const caretLine = Number.isInteger(paquete.caretLine) ? paquete.caretLine : null;
        const caretRatio = typeof paquete.caretRatio === "number" ? paquete.caretRatio : null;
        const caretPos = typeof paquete.caretPos === "number"
            ? paquete.caretPos
            : (paquete.caretPos && typeof paquete.caretPos.caretPos === "number" ? paquete.caretPos.caretPos : null);
        const caretPath = Array.isArray(paquete.caretPath) ? paquete.caretPath : null;
        const caretOffset = Number.isInteger(paquete.caretOffset) ? paquete.caretOffset : null;
        if (caretPos !== null) {
            if (posicionarScrollPorCaretPosPreciso(texto2, caretPos)) {
                programarActualizacionDegradadoTextareaEspectador(texto2);
                return;
            }
        }
        if (caretPath && caretOffset !== null) {
            if (posicionarScrollPorCaretPath(texto2, caretPath, caretOffset)) {
                programarActualizacionDegradadoTextareaEspectador(texto2);
                return;
            }
        }
        if (caretPos !== null) {
            const maxPos = obtenerTextoPlanoConSaltos(texto2).length;
            if (maxPos > 0 && caretPos >= maxPos - 1) {
                texto2.scrollTop = texto2.scrollHeight;
                programarActualizacionDegradadoTextareaEspectador(texto2);
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
            saltos_l�f­nea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText

        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_l�f­nea_alineacion_2 += 1;
            texto2.innerText = "\n" + texto2.innerText
        }
    }*/
        texto2.style.height = "";
        if (caretPos === null) {
            texto2.scrollTop = texto2.scrollHeight;
        }
        programarActualizacionDegradadoTextareaEspectador(texto2);
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
    const segundosCount = convertirASegundos(data.count);
    if (Number.isFinite(segundosCount)) {
        terminado = false;
    }
    if (Number.isFinite(segundosCount) && segundosCount >= 10 && activado_psico1) {
        LIMPIEZAS["psicod�f©lico"](data, data.player);
    }
    if (Number.isFinite(segundosCount)) {
        if (segundosCount >= 20) {
            tiempo.style.color = "white";
        } else if (segundosCount >= 10) {
            tiempo.style.color = "yellow";
        } else if (activado_psico1 == false) {
            MODOS["psicod�f©lico"](data, socket, data.player);
            tiempo.style.color = "red";
        } else {
            tiempo.style.color = "red";
        }
    }
    tiempo.innerHTML = data.count;
    const animarEntradaVidaJ1 = Boolean(animacionEntradaVidaPendiente[1] && Number.isFinite(segundosCount));
    actualizarBarraVida(tiempo, data.count, { animarEntrada: animarEntradaVidaJ1 });
    if (animarEntradaVidaJ1) {
        animacionEntradaVidaPendiente[1] = false;
    }
    if (String(data.count || "").toLowerCase().includes("tiempo")) {
        LIMPIEZAS["psicod�f©lico"](data, data.player);
        //confetti_aux()
        terminado = true;
        feedback1.innerHTML = "";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        explicacion.innerHTML = "";
        palabra1.style.display = "";
        definicion1.style.display = "";
        explicacion.style.display = "";
        texto1.style.display = "none";
        tiempo.style.color = "white";
    }
    }

    if(data.player == 2){
        const segundosCount = convertirASegundos(data.count);
        if (Number.isFinite(segundosCount)) {
            terminado1 = false;
        }
        if (Number.isFinite(segundosCount) && segundosCount >= 10 && activado_psico2) {
            LIMPIEZAS["psicod�f©lico"](data, data.player);
        }
        if (Number.isFinite(segundosCount)) {
            if (segundosCount >= 20) {
                tiempo1.style.color = "white";
            } else if (segundosCount >= 10) {
                tiempo1.style.color = "yellow";
            } else if (activado_psico2 == false) {
                MODOS["psicod�f©lico"](data, socket, data.player);
                tiempo1.style.color = "red";
            } else {
                tiempo1.style.color = "red";
            }
        }
        tiempo1.innerHTML = data.count;
        const animarEntradaVidaJ2 = Boolean(animacionEntradaVidaPendiente[2] && Number.isFinite(segundosCount));
        actualizarBarraVida(tiempo1, data.count, { animarEntrada: animarEntradaVidaJ2 });
        if (animarEntradaVidaJ2) {
            animacionEntradaVidaPendiente[2] = false;
        }
        if (String(data.count || "").toLowerCase().includes("tiempo")) {
            LIMPIEZAS["psicod�f©lico"](data, data.player);
            terminado1 = true;
            feedback2.innerHTML = "";
            palabra2.innerHTML = "";
            definicion2.innerHTML = "";
            explicacion1.innerHTML = "";
            palabra2.style.display = "none";
            definicion2.style.display = "none";
            explicacion1.style.display = "none";

            texto2.style.display = "none";
            tiempo1.style.color = "white";
        }
    }
    if (terminado && terminado1) {

        confetti_aux();
        ejecutarLimpiezaModo(modo_actual, data);
        
        limpiezas_final();

        activar_sockets_extratextuales();
        //texto1.innerText = (texto1.innerText).substring(saltos_l�f­nea_alineacion_1, texto1.innerText.length);
        //texto2.innerText = (texto2.innerText).substring(saltos_l�f­nea_alineacion_2, texto2.innerText.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');


        //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de l�f­nea del jugador 1 para alinear los textos.
        //texto2.innerText = eliminar_saltos_de_linea(texto2.innerText); //Eliminamos los saltos de l�f­nea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto2.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tama�f±o del �f¡rea de texto del j1.
        texto2.style.height = (texto2.scrollHeight) + "px";// Reajustamos el tama�f±o del �f¡rea de texto del j2.

        animateCSS(".cabecera", "backInLeft").then((message) => {
            animateCSS(".contenedor_espectador", "pulse");
        });
        logo.style.display = "";
        neon.style.display = "";
        LIMPIEZAS["psicod�f©lico"]("");
        tiempo.style.color = "white";
        tiempo1.style.color = "white";
    }
});

socket.on('resucitar_control', data => {
    if(data.player == 1){
        terminado = false;
        palabra1.style.display = "";
        definicion1.style.display = "";
        explicacion.style.display = "";
        texto1.style.display = "";
        ocultarResucitarMini(1);
    }
    else if(data.player == 2){
        terminado1 = false;
        actualizarPalabraConVisibilidad(palabra2, palabra2.innerHTML);
        definicion2.style.display = "";
        explicacion1.style.display = "";
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
    limpiarColaPalabrasPendientesEspectador();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);
    partida_activa_espectador = true;
    modo_nivel_activo_espectador = "";
    setBarraNivelClase("");
    actualizarVisibilidadPanelNivelEspectador();
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
        iniciarIntroCuentaAtrasEspectador();
        animateCSS(".contenedor_espectador", "pulse");
        animateCSS(".inspiracion", "pulse");
        TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR;
        actualizarDuracionNivelDesdeParametros(data && data.parametros ? data.parametros : {});
        setProgresoNivelBarra(0);
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
    // S�f³lo si existe y es string hacemos .trim()
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
    // Se muestra "&iquest;PREPARADOS?" antes de comenzar la cuenta atras
    $('#countdown').remove();
    var preparados = $('<span id="countdown">&iquest;PREPARADOS?</span>');
    preparados.appendTo($('.container'));
    timeout_countdown = setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);
    timeout_timer = setTimeout(() => {
        var counter = 3;
        var index   = 0; // �fndice para recorrer el array de audios
        
        var timer = setInterval(function() {
          // Eliminamos el anterior #countdown para volverlo a crear
          $('#countdown').remove();
          
          // Creamos el nuevo elemento con el n�fºmero o el texto final
          var countdown = $('<span id="countdown">'+ (counter === 0 ? '&iexcl;ESCRIBE!' : counter) +'</span>');
          countdown.appendTo($('.container'));
          actualizarIntroCuentaAtrasSegunContador(counter);
        
          // Peque�f±a pausa para aplicar el CSS que hace el efecto
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
            finalizarIntroCuentaAtrasEspectador();
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
    partida_activa_espectador = true;
    finalizarIntroCuentaAtrasEspectador();
    detenerTemporizadorGigante();
    
    limpiezas();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    if (tiempo1) {
        tiempo1.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo1, 0);
    }

    texto1.style.display = "";
    texto2.style.display = "";
    palabra1.style.display = "";
    definicion1.style.display = "";
    explicacion.style.display = "";
    actualizarPalabraConVisibilidad(palabra2, palabra2.innerHTML);
    actualizarPalabraConVisibilidad(palabra3, palabra3.innerHTML);
    definicion2.style.display = "";
    explicacion.style.display = "";
    actualizarVisibilidadPanelNivelEspectador();
});

// Resetea el tablero de juego.
socket.on('limpiar', data => {
    detenerTemporizadorGigante();
    limpiarColaPalabrasPendientesEspectador();
    setPendienteAnimacionEntradaBarraVida(false);
    partida_activa_espectador = false;
    ocultarTodosResucitarMini();
    modo_nivel_activo_espectador = "";
    modo_actual = "";
    setBarraNivelClase("");
    actualizarVisibilidadPanelNivelEspectador();
    finalizarIntroCuentaAtrasEspectador();
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
    ejecutarLimpiezaModo(modo_actual, data);
    modo_actual = data && typeof data.modo_actual === "string" ? data.modo_actual : "";
    modo_nivel_activo_espectador = modo_actual;
    actualizarDuracionNivelDesdeParametros(data || {});
    setBarraNivelClase("");
    ejecutarModo(modo_actual, data);
    actualizarVisibilidadPanelNivelEspectador();
    if (modo_actual) {
        iniciarProgresoNivelBarra();
    } else {
        detenerProgresoNivelBarra(true);
    }
    blueCount = 0;
    redCount = 0;
    updateBar();
    actualizarVisibilidadPanelNivelEspectador();
    vaciarColaPalabrasPendientesEspectador();
}

socket.on('recibir_feedback_modificador', data => {
    const playerId = Number(data && data.player) === 2 ? 2 : 1;
    const idMod = data && typeof data.id_mod === "string" ? data.id_mod : "";
    const nodoMod = idMod ? getEl(idMod) : null;
    const textoFeedback = nodoMod
        ? (nodoMod.textContent || nodoMod.innerText || "")
        : "";

    if (textoFeedback.trim()) {
        mostrarFeedbackFlotanteEspectador(playerId, textoFeedback, {
            tipo: obtenerTipoFeedbackFlotanteDesdeTexto(textoFeedback)
        });
    }

    if (playerId === 2) {
        if (nodoMod) {
            nodoMod.style.display = "none";
        }
    } else if (idMod) {
        const idModLado1 = `${idMod.substring(0, Math.max(0, idMod.length - 1))}1`;
        const nodoModLado1 = getEl(idModLado1);
        if (nodoModLado1) {
            nodoModLado1.style.display = "none";
        }
    }
});

socket.on('enviar_palabra_j1', data => {
    if (debeAplazarRenderPalabraEspectador()) {
        encolarPalabraPendienteEspectador(data, 1);
        return;
    }
    recibir_palabra(data, 1);
});

socket.on('enviar_palabra_j2', data => {
    if (debeAplazarRenderPalabraEspectador()) {
        encolarPalabraPendienteEspectador(data, 2);
        return;
    }
    recibir_palabra(data, 2);
});

// Suscripci�f³n al evento 'inspirar_j1'
socket.on('inspirar_j1', data => {
    const palabra = typeof data === "string" ? data : data?.palabra;
    const musa_nombre = (data && typeof data === "object") ? (data.musa_nombre || data.musa) : "";
    if (!palabra) return;
    marcarPalabraInspirandoNube(1, palabra);
    /*
      Usamos un template literal en una sola l�f­nea para evitar
      los espacios y saltos de l�f­nea inducidos por la indentaci�f³n.
      De este modo, no quedan espacios antes o despu�f©s de las comillas �,« �,».
    */
    const musaLabel = musa_nombre ? escapeHtml(musa_nombre) : "MUSA";
    actualizarDefinicionConVisibilidad(
        definicion2,
        `<span style="color: orange;">${musaLabel}</span><span style="color: white;">: </span><span style="color: white;">Podr&iacute;as escribir la palabra &laquo;</span><span style="color: lime; text-decoration: underline;">${escapeHtml(palabra)}</span><span style="color: white;">&raquo;</span>`,
        true
    );
    animateCSS(".definicion1", "flash");
});

// Suscripci�f³n al evento 'inspirar_j2'
socket.on('inspirar_j2', data => {
    const palabra = typeof data === "string" ? data : data?.palabra;
    const musa_nombre = (data && typeof data === "object") ? (data.musa_nombre || data.musa) : "";
    if (!palabra) return;
    marcarPalabraInspirandoNube(2, palabra);
    /*
      Replica exacta del anterior, apuntando al elemento definicion3.
      Mantener coherencia en el formato garantiza que no aparezcan espacios 
      no deseados alrededor de �,«palabra�,».
    */
    const musaLabel = musa_nombre ? escapeHtml(musa_nombre) : "MUSA";
    actualizarDefinicionConVisibilidad(
        definicion3,
        `<span style="color: orange;">${musaLabel}</span><span style="color: white;">: </span><span style="color: white;">Podr&iacute;as escribir la palabra &laquo;</span><span style="color: lime; text-decoration: underline;">${escapeHtml(palabra)}</span><span style="color: white;">&raquo;</span>`,
        true
    );
    animateCSS(".definicion2", "flash");
});

function recibir_palabra(data, escritxr) {
    if ((Number(escritxr) === 1 && terminado) || (Number(escritxr) === 2 && terminado1)) {
        return;
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

        const definicionFallback = extraerDefinicionPalabraEvento(data);
        const textoPalabra = construirTextoPalabraEvento(data);
        const palabraInspiracion = extraerPalabraPrincipalEvento(data);
        if (escritxr == 1) {
        const hayPalabra = actualizarPalabraConVisibilidad(palabra2, textoPalabra);
        if (!hayPalabra) {
            actualizarDefinicionConVisibilidad(definicion2, "", false);
            return;
        }
        let definicionHTML = "";
        if (data?.origen_musa === "musa") {
            const musaLabel = data?.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA";
            definicionHTML = `<span style="color:lime;">${musaLabel}</span><span style="color: white;">: </span><span style='color: white;'>Podr&iacute;as escribir esta palabra</span>`;
            marcarPalabraInspirandoNube(1, palabraInspiracion);
        } else if (data?.origen_musa === "musa_enemiga") {
            const musaLabel = data?.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA ENEMIGA";
            definicionHTML = `<span style="color:red;">${musaLabel}</span>: <span style='color: orange;'>Me pega esta palabra</span>`;
            marcarPalabraInspirandoNube(2, palabraInspiracion);
        } else {
            definicionHTML = definicionFallback;
        }
            actualizarDefinicionConVisibilidad(definicion2, definicionHTML, true);
        
            if (!animarCambioPalabraLetrasEspectador(palabra2, definicion2)) {
                animateCSS(".explicacion1", "bounceInLeft");
                animateCSS(".palabra1", "bounceInLeft");
                animateCSS(".definicion1", "bounceInLeft");
            }
        }
        
    else{
        const hayPalabra = actualizarPalabraConVisibilidad(palabra3, textoPalabra);
        if (!hayPalabra) {
            actualizarDefinicionConVisibilidad(definicion3, "", false);
            return;
        }
        let definicionHTML = "";
        if (data?.origen_musa === "musa") {
            const musaLabel = data?.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA";
            definicionHTML = `<span style="color:lime;">${musaLabel}</span><span style="color: white;">: </span><span style='color: white;'>Podr&iacute;as escribir esta palabra</span>`;
            marcarPalabraInspirandoNube(2, palabraInspiracion);
        } else if (data?.origen_musa === "musa_enemiga") {
            const musaLabel = data?.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA ENEMIGA";
            definicionHTML = `<span style="color:red;">${musaLabel}</span>: <span style='color: orange;'>Me pega esta palabra</span>`;
            marcarPalabraInspirandoNube(1, palabraInspiracion);
        } else {
            definicionHTML = definicionFallback;
        }
        actualizarDefinicionConVisibilidad(definicion3, definicionHTML, true);
           
        if (!animarCambioPalabraLetrasEspectador(palabra3, definicion3)) {
            animateCSS(".explicacion2", "bounceInLeft");
            animateCSS(".palabra2", "bounceInLeft");
            animateCSS(".definicion2", "bounceInLeft");
        }
    }
}

socket.on('feedback_a_j2', data => {
    var feedback = document.querySelector(".feedback1");
    if (feedback) {
        feedback.innerHTML = "";
    }
    mostrarFeedbackTiempoFlotanteEspectador(1, data);
    aplicarFulgorTiempoDesdeFeedbackEspectador(1, data);

    console.log(data.tiempo_feed)
    console.log(data.tipo)
    console.log(modo_actual)

    if (data.tipo == "borrar") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }

    if(data.tipo == "inspiracion"){
        procesarPalabraUsadaInspiracion(1, data);
        if (esInspiracionDesdeMusa(data)) {
            activarFulgorLadoEspectador(1, "musa");
        }
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
    // Si empieza por "â±ï¸+" (ej.: "â±ï¸+2 segs." o "â±ï¸+6 segs.")
    if (data.tipo == "ganar_tiempo") {
        reproducirSonido("../../game/audio/GANAR 2 SEG.mp3");

    }
});

socket.on('feedback_a_j1', data => {
    var feedback1 = document.querySelector(".feedback2");
    if (feedback1) {
        feedback1.innerHTML = "";
    }
    mostrarFeedbackTiempoFlotanteEspectador(2, data);
    aplicarFulgorTiempoDesdeFeedbackEspectador(2, data);

    console.log(data.tiempo_feed)
    console.log(data.tipo)
    console.log(modo_actual)

    if (data.tipo == "borrar") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }

    if(data.tipo == "inspiracion"){
        procesarPalabraUsadaInspiracion(2, data);
        if (esInspiracionDesdeMusa(data)) {
            activarFulgorLadoEspectador(2, "musa");
        }
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
    // Si empieza por "â±ï¸+" (ej.: "â±ï¸+2 segs." o "â±ï¸+6 segs.")
    if (data.tipo == "ganar_tiempo") {
        reproducirSonido("../../game/audio/GANAR 2 SEG.mp3");

    }
});

socket.on('recibir_comentario', data => {
    tema.innerHTML = data;
});

socket.on('fin', data => {
        detenerSonidosDesventaja();
        //confetti_aux();
});

socket.on("enviar_repentizado", repentizado => {
    //temas.innerHTML = "ï¿½sï¿½ï¸ "+ repentizado + " ï¿½sï¿½ï¸";
    //animateCSS(".temas", "flash")
});

socket.on("enviar_ventaja_j1", putada => {
    limpiarEstadoVotacionVentaja();
    PUTADAS[putada](1);
    mostrarFeedbackFlotanteEspectador(1, `${putada} DESVENTAJA!`, { tipo: "negativo" });
    mostrarFeedbackFlotanteEspectador(2, `${putada} VENTAJA!`, { tipo: "positivo" });
});

socket.on("enviar_ventaja_j2", putada => {
    limpiarEstadoVotacionVentaja();
    PUTADAS[putada](2);
    mostrarFeedbackFlotanteEspectador(2, `${putada} DESVENTAJA!`, { tipo: "negativo" });
    mostrarFeedbackFlotanteEspectador(1, `${putada} VENTAJA!`, { tipo: "positivo" });
});

socket.on("nueva letra", letra => {
    if(modo_actual == "letra prohibida"){
        animacion_modo();
        explicacion.innerHTML = construirExplicacionNivelLetra("prohibida", letra);
        activarEfectoCambioLetraEspectador("prohibida");
        }
    else if(modo_actual == "letra bendita"){
        animacion_modo();
        explicacion.innerHTML = construirExplicacionNivelLetra("bendita", letra);
        activarEfectoCambioLetraEspectador("bendita");
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

    // Configuramos el bucle seg�fºn el par�f¡metro 'loop'
    sonido.loop = loop;

    // Intentamos reproducir el sonido
    // Si el navegador requiere interacci�f³n del usuario,
    // esta promesa puede fallar (por ejemplo, en navegadores m�f³viles).
    sonido.play().catch(error => {
      console.error('No se pudo reproducir el audio:', error);
    });
    return sonido;
  }

// Referencias a los elementos
// Variables para guardar los IDs de intervalo si es necesario detenerlos despu�f©s

// Ejemplo: iniciar animaciones seg�fºn un estado o condici�f³n
function iniciarAnimacionesSegunCondicion(condicion) {
  if (condicion === "azul") {
    // Inicia animaci�f³n para musas azules
    Temasinterval = startDotAnimation(temas,'MUSAS <span style="color:aqua;">AZULES</span> ELIGIENDO <span style="color:lime;">VENTAJA</span>');
  } else if (condicion === "rojo") {
    // Inicia animaci�f³n para musas rojas
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

    // Abre la votaci�f³n de los textos.
    socket.on('vote', data => {
        ventana = window.open("https://www.mentimeter.com/s/0f9582fcdbab7e15216ee66df67113d6/f14a05785a97", '_blank')
    });

    // Cierra la votaci�f³n de los textos.
    socket.on('exit', data => {
        ventana.close();
    });

    // Realiza el scroll.
    socket.on('scroll', data => {
        if (!PERMITIR_SCROLL_ESPECTADOR) return;
        if (data == "arriba") {
            window.scrollBy(0, -50);
        }
        else {
            window.scrollBy(0, 50);
        }
    });

    socket.on('scroll_sincro', data => {
        if (!PERMITIR_SCROLL_ESPECTADOR) return;
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
    Recibe los temas y llama a la funci�f³n erm() para
    elegir uno aleatoriamente.
    */
    socket.on('temas_espectador', data => {
        temas = data;
        erm();
    });



    /*socket.on("recibir_postgame1", (data) => {
        focalizador2.innerHTML = "<br>ï¿½Y-<ï¸ Caracteres escritos = " + data.longitud + "<br>ï¿½Y"s Palabras bonus = " + data.puntos_palabra + "<br>ï¿½O Letra prohibida = " + data.puntos_letra_prohibida + "<br>ï¿½Y~? Letra bendita = " + data.puntos_letra_bendita;
    });

    socket.on("recibir_postgame2", (data) => {
        focalizador1.innerHTML = "<br>ï¿½Y-<ï¸ Caracteres escritos = " + data.longitud + "<br>ï¿½Y"s Palabras bonus = " + data.puntos_palabra + "<br>ï¿½O Letra prohibida = " + data.puntos_letra_prohibida + "<br>ï¿½Y~? Letra bendita = " + data.puntos_letra_bendita;
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
    //var tama�f±o_letra = getRandNumber(7, 35)
    //text.style.fontSize = tama�f±o_letra + "px"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = getTextAlign();
    //texto2.style.textAlign = getTextAlign();
    //texto2.style.fontFamily = getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tama�f±o_letra + "px"; // Font sizes between 15px and 35px
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
    animateCSS(".explicaci�f³n", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

// Funci�f³n auxiliar que reestablece el estilo inicial de la p�f¡gina modificado por el modo psicod�f©lico.
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

// Funci�f³n auxiliar que elimina los saltos de l�f­nea al principio de un string.
function eliminar_saltos_de_linea(texto) {
    var i = 0;
    while (texto[i] == "\n") {
        i++;
    }
    return (texto.substring(i, texto.length));
}

// Funci�f³n auxiliar que genera un string con n saltos de l�f­nea.
function crear_n_saltos_de_linea(n) {
    var saltos = "";
    var cont = 0;
    while (cont <= n) {
        saltos += "\n";
        cont++;
    }
    return saltos;
}

// FUNCIONES AUXILIARES PARA LA ELECCIï¿½"N ALEATORIA DEL TEMA.
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

function cambiar_color_puntuacion() {
    // El color del marcador ahora es fijo por equipo (CSS). 
    // Limpiamos cualquier inline style residual de l�f³gicas anteriores.
    if (puntos1) puntos1.style.removeProperty("color");
    if (puntos2) puntos2.style.removeProperty("color");
}

function limpiezas(){

    finalizarIntroCuentaAtrasEspectador();
    limpiarColaPalabrasPendientesEspectador();
    detenerSonidosDesventaja();
    ocultarTodosResucitarMini();
    detenerProgresoNivelBarra(true);
    limpiarEstiloPalabrasModoLetrasEspectador();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);

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
    limpiarFeedbackFlotanteEspectador();

    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicacion.innerHTML = "";
    palabra2.innerHTML = "";
    definicion2.innerHTML = "";
    explicacion1.innerHTML = "";
    palabra3.innerHTML = "";
    definicion3.innerHTML = "";
    explicacion2.innerHTML = "";

    
    texto1.innerText = "";
    texto2.innerText = "";
    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";
    texto1.style.display = "none";
    texto2.style.display = "none";
    programarActualizacionDegradadoTextosEspectador();

    actualizarPuntosMarcadorEquipo(puntos1, 0, false);
    actualizarPuntosMarcadorEquipo(puntos2, 0, false);
    
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

    limpiarColaPalabrasPendientesEspectador();
    limpiarEstiloPalabrasModoLetrasEspectador();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);
    partida_activa_espectador = false;
    modo_nivel_activo_espectador = "";
    modo_actual = "";
    setBarraNivelClase("");
    actualizarVisibilidadPanelNivelEspectador();
    finalizarIntroCuentaAtrasEspectador();
    detenerProgresoNivelBarra(true);

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
    limpiarFeedbackFlotanteEspectador();
    
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicacion.innerHTML = "";
    palabra2.innerHTML = "";
    definicion2.innerHTML = "";
    explicacion1.innerHTML = "";
    palabra3.innerHTML = "";
    definicion3.innerHTML = "";
    explicacion2.innerHTML = "";
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

    LIMPIEZAS["psicod�f©lico"]("");

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
var isConfettiRunning = true; // Indicador para controlar la ejecuci�f³n

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function confetti_aux() {

    sonido_confetti = reproducirSonido("../../game/audio/CELEBRACION con explosiones.mp3")
    
  var animationEnd = Date.now() + duration; // Actualiza aqu�f­ dentro de la funci�f³n
  isConfettiRunning = true; // Habilita la ejecuci�f³n de confetti
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

  isConfettiRunning = false; // Deshabilita la ejecuci�f³n de confetti
  confetti.reset(); // Detiene la animaci�f³n de confetti
}

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un n�fºmero entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un n�fºmero entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

  function confetti_musas(pos){

    sonido_confetti_musa = reproducirSonido("../../game/audio/FX/9. ESTRELLAS.mp3")
    
    var scalar = 2;
    var unicorn = confetti.shapeFromText({ text: 'â­', scalar });
    isConfettiRunning = true; // Habilita la ejecuci�f³n de confetti
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

// Funci�f³n para actualizar la barra
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

    if (!inspiracion) return;
    const blueSegment = inspiracion.querySelector('.bar-segment.blue');
    const redSegment = inspiracion.querySelector('.bar-segment.red');
    if (!blueSegment || !redSegment) return;
    const blueText = blueSegment.querySelector('.percentage-text');
    const redText = redSegment.querySelector('.percentage-text');
    if (!blueText || !redText) return;

    blueSegment.style.width = `${bluePercentage}%`;
    redSegment.style.width = `${redPercentage}%`;

    // Ajuste din�f¡mico del tama�f±o de la fuente en vw
    const baseFontSize = 0.5; // Tama�f±o de fuente base en vw
    const maxFontSize = 2; // Tama�f±o de fuente m�f¡ximo en vw
    const blueFontSize = Math.min(baseFontSize + (bluePercentage / 100) * (maxFontSize - baseFontSize), maxFontSize);
    const redFontSize = Math.min(baseFontSize + (redPercentage / 100) * (maxFontSize - baseFontSize), maxFontSize);

    // Eliminar ".00" si el valor es un n�fºmero entero
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

// Inicializaci�f³n con valores iniciales
blueCount = 0;
redCount = 0;
updateBar();

// Funci�f³n para establecer la posici�f³n del caret
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

// Funci�f³n para centrar el scroll en la posici�f³n del caret
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

    // Centramos el scroll en la posici�f³n del caret
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


