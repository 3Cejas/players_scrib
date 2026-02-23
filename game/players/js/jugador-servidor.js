var player = getParameterByName("player");
const playerNumber = Number(player);
if (document.body) {
    if (playerNumber === 1) document.body.classList.add("equipo-azul");
    if (playerNumber === 2) document.body.classList.add("equipo-rojo");
} else {
    window.addEventListener("DOMContentLoaded", () => {
        if (playerNumber === 1) document.body.classList.add("equipo-azul");
        if (playerNumber === 2) document.body.classList.add("equipo-rojo");
    }, { once: true });
}

let feedback_a_j_x;
let feedback_de_j_x;
let texto_x;
let texto_y;
let enviar_postgame_x;
let recibir_postgame_x;
let enviar_putada_de_jx;
let tiempo_inicial = new Date();
let es_pausa = false;
let borrado_cambiado = false;
let duracion;
let texto_guardado = "";
let interval_ortografia_perfecta;
let pararEscritura = false;
let inspirar;
let enviar_palabra;
let enviar_ventaja;
let elegir_ventaja


const getEl = (id) => document.getElementById(id); // Obtiene los elementos con id.
const escapeHtml = (valor) => String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizarNombreMusaFeedback = (valor) => {
    if (typeof valor !== "string") return "";
    return valor.trim().slice(0, 18).toUpperCase();
};

const establecerContextoMusaDefinicion = (origen, musaNombre = "") => {
    if (!definicion || !definicion.dataset) return;
    definicion.dataset.origenMusa = origen || "";
    definicion.dataset.musaNombre = normalizarNombreMusaFeedback(musaNombre);
};

const construirPayloadFeedbackInspiracion = (basePayload = {}) => {
    const payload = { ...(basePayload || {}) };
    const origenMusa = definicion?.dataset?.origenMusa
        ? String(definicion.dataset.origenMusa).trim().toLowerCase()
        : "";
    if (origenMusa !== "musa" && origenMusa !== "musa_enemiga") {
        return payload;
    }
    payload.origen_musa = origenMusa;
    const musaNombre = definicion?.dataset?.musaNombre
        ? normalizarNombreMusaFeedback(definicion.dataset.musaNombre)
        : "";
    if (musaNombre) {
        payload.musa_nombre = musaNombre;
    }

    let palabraReferencia = "";
    if (typeof palabra_actual !== "undefined") {
        if (Array.isArray(palabra_actual)) {
            const primera = palabra_actual.find((p) => typeof p === "string" && p.trim());
            palabraReferencia = primera || "";
        } else if (typeof palabra_actual === "string") {
            palabraReferencia = palabra_actual;
        }
    }
    palabraReferencia = String(palabraReferencia || "").trim().slice(0, 48);
    if (palabraReferencia) {
        payload.palabra = palabraReferencia;
    }

    return payload;
};

const DURACION_FULGOR_ESCRITOR_MS = 880;
const CLASES_FULGOR_ESCRITOR = [
    "escritor-borde-fulgor-musa",
    "escritor-borde-fulgor-positivo",
    "escritor-borde-fulgor-negativo"
];
let timeout_fulgor_escritor = null;

function activarFulgorEscritor(claseObjetivo) {
    if (!document.body) return;
    CLASES_FULGOR_ESCRITOR.forEach((clase) => document.body.classList.remove(clase));
    if (!claseObjetivo) return;
    void document.body.offsetWidth;
    document.body.classList.add(claseObjetivo);
    if (timeout_fulgor_escritor) {
        clearTimeout(timeout_fulgor_escritor);
    }
    timeout_fulgor_escritor = setTimeout(() => {
        if (!document.body) return;
        document.body.classList.remove(claseObjetivo);
    }, DURACION_FULGOR_ESCRITOR_MS);
}

function activarFulgorInspiracionEscritora() {
    activarFulgorEscritor("escritor-borde-fulgor-musa");
}

function activarFulgorCambioTiempoEscritora(secs) {
    const delta = Number(secs);
    if (!Number.isFinite(delta) || delta === 0) return;
    activarFulgorEscritor(delta > 0 ? "escritor-borde-fulgor-positivo" : "escritor-borde-fulgor-negativo");
}

function emitirCambioTiempoEscritora(secs) {
    const delta = Number(secs);
    if (!Number.isFinite(delta) || delta === 0) return;
    activarFulgorCambioTiempoEscritora(delta);
    socket.emit("aumentar_tiempo", { secs: delta, player });
}

let ultimo_tiempo_contador_segundos = null;
let ultimo_tiempo_contador_ms = 0;

function extraerSegundosContador(valor) {
    if (typeof valor !== "string") return null;
    const texto = valor.trim();
    const match = texto.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const minutos = Number(match[1]);
    const segundos = Number(match[2]);
    if (!Number.isFinite(minutos) || !Number.isFinite(segundos)) return null;
    return (minutos * 60) + segundos;
}

function procesarFulgorCambioTiempoDesdeContador(countTexto) {
    const actual = extraerSegundosContador(countTexto);
    if (actual === null) {
        ultimo_tiempo_contador_segundos = null;
        ultimo_tiempo_contador_ms = 0;
        return;
    }
    const ahora = Date.now();
    if (ultimo_tiempo_contador_segundos !== null) {
        let ticksEsperados = 1;
        if (ultimo_tiempo_contador_ms > 0) {
            ticksEsperados = Math.max(1, Math.round((ahora - ultimo_tiempo_contador_ms) / 1000));
            // Evita lecturas extremas tras pausas largas o cambios de pantalla.
            if (ticksEsperados > 6) {
                ticksEsperados = 1;
            }
        }
        const esperadoSinAjuste = ultimo_tiempo_contador_segundos - ticksEsperados;
        const ajuste = actual - esperadoSinAjuste;
        if (ajuste !== 0) {
            activarFulgorCambioTiempoEscritora(ajuste);
        }
    }
    ultimo_tiempo_contador_segundos = actual;
    ultimo_tiempo_contador_ms = ahora;
}

const contenedor_corazones_escritor = (() => {
    let contenedor = getEl("corazones_escritor");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "corazones_escritor";
        contenedor.className = "corazones-flotantes";
        document.body.appendChild(contenedor);
    }
    return contenedor;
})();

const crearCorazonFlotante = (equipo, x, y) => {
    if (!contenedor_corazones_escritor) return;
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
    contenedor_corazones_escritor.appendChild(corazon);
    corazon.addEventListener("animationend", () => {
        corazon.remove();
    });
};

const lanzarCorazonEscritor = (equipo) => {
    const ancho = window.innerWidth || 0;
    const alto = window.innerHeight || 0;
    if (!ancho || !alto) return;
    const margen = ancho * 0.12;
    const x = margen + Math.random() * Math.max(0, ancho - (margen * 2));
    const yMin = alto * 0.45;
    const yMax = alto * 0.8;
    const y = yMin + Math.random() * (yMax - yMin);
    crearCorazonFlotante(equipo, x, y);
};

const feedback_flotante_escritora = (() => {
    let root = getEl("feedback_tiempo_flotante_root");
    if (!root) {
        root = document.createElement("div");
        root.id = "feedback_tiempo_flotante_root";
        document.body.appendChild(root);
    }
    let columna = root.querySelector(".feedback-tiempo-columna.lado-1");
    if (!columna) {
        columna = document.createElement("div");
        columna.className = "feedback-tiempo-columna lado-1";
        root.appendChild(columna);
    }
    return columna;
})();

function obtenerTipoFeedbackFlotanteEscritora(texto = "", tipo = "") {
    const tipoNorm = String(tipo || "").trim().toLowerCase();
    if (tipoNorm === "ganar_tiempo" || tipoNorm === "letra_bendita" || tipoNorm === "inspiracion" || tipoNorm === "rae") {
        return "positivo";
    }
    if (tipoNorm === "perder_tiempo" || tipoNorm === "letra_prohibida" || tipoNorm === "lista_prohibidas" || tipoNorm === "borrar") {
        return "negativo";
    }
    const textoNorm = String(texto || "").trim().toLowerCase();
    if (!textoNorm) return "neutro";
    if (textoNorm.includes("desventaja") || textoNorm.includes("perder") || textoNorm.startsWith("-") || /\s-\d/.test(textoNorm)) {
        return "negativo";
    }
    if (textoNorm.includes("ventaja") || textoNorm.includes("insp") || textoNorm.includes("ganar") || textoNorm.startsWith("+") || /\s\+\d/.test(textoNorm)) {
        return "positivo";
    }
    return "neutro";
}

function mostrarFeedbackFlotanteEscritora(texto, opciones = {}) {
    const contenido = String(texto ?? "").trim();
    if (!contenido || !feedback_flotante_escritora) return;
    const tipo = obtenerTipoFeedbackFlotanteEscritora(contenido, opciones.tipo);
    const nodo = document.createElement("span");
    nodo.className = `feedback-tiempo-float ${tipo}`;
    nodo.textContent = contenido;

    if (typeof opciones.color === "string" && opciones.color.trim()) {
        nodo.style.setProperty("--feedback-float-color", opciones.color.trim());
    }

    const derivaX = (Math.random() * 18) - 9;
    const subidaDeseada = -54 - (Math.random() * 18);
    const rectContenedor = feedback_flotante_escritora.getBoundingClientRect();
    const margenSuperior = 24;
    const subidaMaxima = -Math.max(8, rectContenedor.top - margenSuperior);
    const subidaY = Math.max(subidaDeseada, subidaMaxima);
    const duracion = 1100 + Math.round(Math.random() * 200);
    nodo.style.setProperty("--feedback-float-drift-x", `${derivaX.toFixed(1)}px`);
    nodo.style.setProperty("--feedback-float-rise-y", `${subidaY.toFixed(1)}px`);
    nodo.style.animationDuration = `${duracion}ms`;

    feedback_flotante_escritora.appendChild(nodo);
    nodo.addEventListener("animationend", () => nodo.remove(), { once: true });
    while (feedback_flotante_escritora.childElementCount > 6) {
        feedback_flotante_escritora.firstElementChild.remove();
    }
    if (feedback) {
        feedback.innerHTML = "";
    }
}

function limpiarFeedbackFlotanteEscritora() {
    if (feedback_flotante_escritora) {
        feedback_flotante_escritora.innerHTML = "";
    }
    if (feedback) {
        feedback.innerHTML = "";
    }
}

// COMPONENTES DEL JUGADOR 1
let nombre;
let texto = getEl("texto");
let puntos = getEl("puntos");
let feedback = getEl("feedback1");
let alineador = getEl("alineador1");
let musas = getEl("musas");
  
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let explicación = getEl("explicación");
let metadatos = getEl("metadatos");
  
let tiempo = getEl("tiempo");
let temas = getEl("temas");
let lightning = getEl("lightning");
let feedback_tiempo = getEl("feedback_tiempo");
let neon = getEl("neon");
const explicacion = getEl("explicación") || getEl("explicacion");
const timeout_marcador_escritora = new WeakMap();

const CLASES_BARRA_NIVEL_ESCRITORA = [
    "barra-nivel--bendita",
    "barra-nivel--prohibida",
    "barra-nivel--bonus",
    "barra-nivel--prohibidas",
    "barra-nivel--tertulia",
    "barra-nivel--frase-final"
];

const CLASES_ESTILO_PALABRA_NIVEL_ESCRITORA = [
    "palabra-letras--bendita",
    "palabra-letras--prohibida",
    "palabra-letras--bonus",
    "palabra-letras--prohibidas",
    "palabra-letras--tertulia",
    "palabra-letras--frase-final"
];

const CLASES_ESTILO_DEFINICION_NIVEL_ESCRITORA = [
    "definicion-letras--bendita",
    "definicion-letras--prohibida",
    "definicion-letras--bonus",
    "definicion-letras--prohibidas",
    "definicion-letras--tertulia",
    "definicion-letras--frase-final"
];

let DURACION_NIVEL_MS_ESCRITORA = 60000;
let inicio_nivel_ts_escritora = 0;
let intervalo_progreso_nivel_escritora = null;

function normalizarDuracionNivelMsEscritora(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return null;
    if (numero <= 600) return Math.round(numero * 1000);
    return Math.round(numero);
}

function actualizarDuracionNivelDesdeParametrosEscritora(parametros = {}) {
    const candidatos = [
        parametros.TIEMPO_MODOS,
        parametros.DURACION_TIEMPO_MODOS,
        parametros.TIEMPO_CAMBIO_MODOS,
        parametros.DURACION_TIEMPO_MUERTO
    ];
    for (const candidato of candidatos) {
        const ms = normalizarDuracionNivelMsEscritora(candidato);
        if (ms) {
            DURACION_NIVEL_MS_ESCRITORA = ms;
            return;
        }
    }
}

function setProgresoNivelBarraEscritora(progreso) {
    if (!palabra) return;
    const valor = Number(progreso);
    const pct = Math.max(0, Math.min(100, Number.isFinite(valor) ? valor : 0));
    palabra.style.setProperty("--nivel-progress", `${pct.toFixed(2)}%`);
}

function detenerProgresoNivelBarraEscritora(reiniciar = false) {
    if (intervalo_progreso_nivel_escritora) {
        clearInterval(intervalo_progreso_nivel_escritora);
        intervalo_progreso_nivel_escritora = null;
    }
    inicio_nivel_ts_escritora = 0;
    if (reiniciar) {
        setProgresoNivelBarraEscritora(0);
    }
}

function tickProgresoNivelBarraEscritora() {
    if (!inicio_nivel_ts_escritora || DURACION_NIVEL_MS_ESCRITORA <= 0) {
        setProgresoNivelBarraEscritora(0);
        return;
    }
    const transcurrido = Date.now() - inicio_nivel_ts_escritora;
    const pct = Math.min(100, (transcurrido / DURACION_NIVEL_MS_ESCRITORA) * 100);
    setProgresoNivelBarraEscritora(pct);
    if (pct >= 100) {
        detenerProgresoNivelBarraEscritora(false);
    }
}

function iniciarProgresoNivelBarraEscritora() {
    detenerProgresoNivelBarraEscritora(true);
    inicio_nivel_ts_escritora = Date.now();
    tickProgresoNivelBarraEscritora();
    intervalo_progreso_nivel_escritora = setInterval(tickProgresoNivelBarraEscritora, 120);
}

function formatoLetraNivelEscritora(letra) {
    const valor = String(letra || "").trim();
    return valor ? valor.toUpperCase() : "-";
}

function renderLetraDestacadaNivelEscritora(letra) {
    return `<span class="explicacion-letra-destacada">${escapeHtml(formatoLetraNivelEscritora(letra))}</span>`;
}

function construirExplicacionNivelLetraEscritora(tipo, letra) {
    const letraDestacada = renderLetraDestacadaNivelEscritora(letra);
    if (tipo === "bendita") {
        return `CADA PALABRA DEBE INCLUIR LA LETRA ${letraDestacada}.`;
    }
    if (tipo === "prohibida") {
        return `NINGUNA PALABRA PUEDE USAR LA LETRA ${letraDestacada}.`;
    }
    return "";
}

function setBarraNivelClaseEscritora(tipo = "") {
    if (!palabra || !palabra.classList) return;
    CLASES_BARRA_NIVEL_ESCRITORA.forEach((clase) => palabra.classList.remove(clase));
    if (!tipo) return;
    palabra.classList.add(`barra-nivel--${tipo}`);
}

function limpiarEstiloNivelesEscritora() {
    if (palabra && palabra.classList) {
        CLASES_ESTILO_PALABRA_NIVEL_ESCRITORA.forEach((clase) => palabra.classList.remove(clase));
    }
    if (definicion && definicion.classList) {
        definicion.classList.remove("objetivo-nivel");
        CLASES_ESTILO_DEFINICION_NIVEL_ESCRITORA.forEach((clase) => definicion.classList.remove(clase));
    }
}

function aplicarEstiloNivelesEscritora(tipo = "") {
    limpiarEstiloNivelesEscritora();
    if (!tipo || !palabra || !palabra.classList || !definicion || !definicion.classList) return;
    palabra.classList.add(`palabra-letras--${tipo}`);
    definicion.classList.add(`definicion-letras--${tipo}`);
}

function extraerTextoPalabraEventoEscritora(data = {}) {
    if (!data || typeof data !== "object") return "";
    if (typeof data.palabras_var === "string" && data.palabras_var.trim()) {
        return data.palabras_var.trim();
    }
    if (Array.isArray(data.palabras_var) && data.palabras_var.length) {
        const primera = String(data.palabras_var[0] || "").trim();
        if (primera) return primera;
    }
    if (Array.isArray(data.palabra_bonus) && data.palabra_bonus.length) {
        const primeraBonus = String(data.palabra_bonus[0] || "").trim();
        if (primeraBonus) return primeraBonus;
    }
    return "";
}

function construirTextoPalabraConTiempoEscritora(palabraTexto, tiempoSegundos, tipo = "bendita") {
    const base = String(palabraTexto || "").trim();
    if (!base) return "";
    const tiempoRaw = String(tiempoSegundos ?? "").trim();
    if (!tiempoRaw) return escapeHtml(base);
    const tiempoLimpio = tiempoRaw.replace(/^[+-]\s*/, "");
    const esMaldita = tipo === "maldita";
    const signo = esMaldita ? "-" : "+";
    const claseTiempo = esMaldita ? "palabra-tiempo--maldita" : "palabra-tiempo--bendita";
    const tiempoTexto = `${signo}${tiempoLimpio} segs.`;
    return `${escapeHtml(base)} <span class="palabra-tiempo ${claseTiempo}">${escapeHtml(tiempoTexto)}</span>`;
}

function normalizarTextoPlanoEscritora(texto) {
    return String(texto ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function construirBloqueObjetivoNivelEscritora(palabraTexto, opciones = {}) {
    const base = String(palabraTexto || "").trim();
    if (!base) return "";
    const tipo = String(opciones.tipo || "bonus").trim().toLowerCase();
    const esMaldita = tipo === "prohibidas";
    const tiempoRaw = String(opciones.tiempoSegundos ?? "").trim();
    const palabraHtml = tiempoRaw
        ? construirTextoPalabraConTiempoEscritora(base, tiempoRaw, esMaldita ? "maldita" : "bendita")
        : escapeHtml(base);
    const descripcion = normalizarTextoPlanoEscritora(opciones.descripcion);
    const descripcionHtml = descripcion
        ? `<span class="objetivo-def objetivo-def--${tipo}">${escapeHtml(descripcion)}</span>`
        : "";
    return `<span class="objetivo-chip objetivo-chip--${tipo}">${palabraHtml}</span>${descripcionHtml}`;
}

function renderObjetivoNivelEscritora(palabraTexto, opciones = {}) {
    if (!definicion) return false;
    const bloque = construirBloqueObjetivoNivelEscritora(palabraTexto, opciones);
    const tieneContenido = Boolean(String(bloque || "").trim());
    if (definicion.classList) {
        definicion.classList.toggle("objetivo-nivel", tieneContenido);
    }
    definicion.innerHTML = tieneContenido ? bloque : "";
    return tieneContenido;
}

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

function destacarMarcadorEscritoraHit(elemento) {
    if (!elemento) return;
    elemento.classList.remove("puntos-hit");
    void elemento.offsetWidth;
    elemento.classList.add("puntos-hit");
    const timeoutPrevio = timeout_marcador_escritora.get(elemento);
    if (timeoutPrevio) {
        clearTimeout(timeoutPrevio);
    }
    const timeoutNuevo = setTimeout(() => {
        if (elemento) {
            elemento.classList.remove("puntos-hit");
        }
    }, 640);
    timeout_marcador_escritora.set(elemento, timeoutNuevo);
}

function actualizarPuntosMarcador(valor, animar = true) {
    if (!puntos) return;
    const previo = (puntos.textContent || "").trim();
    const siguiente = formatearPuntosMarcador(valor);
    puntos.textContent = siguiente;
    if (animar && siguiente !== previo) {
        destacarMarcadorEscritoraHit(puntos);
    }
}

function actualizarMusasMarcador(valor, animar = true) {
    if (!musas) return;
    const previo = (musas.textContent || "").trim();
    const siguiente = formatearMusasMarcador(valor);
    musas.textContent = siguiente;
    if (animar && siguiente !== previo) {
        destacarMarcadorEscritoraHit(musas);
    }
}

if (tiempo) {
    tiempo.style.display = "none";
}

const calentamiento_escritor = getEl("calentamiento_escritor");
const calentamiento_stage_escritor = document.querySelector("#calentamiento_escritor .calentamiento-stage");
const calentamiento_nube_escritor = getEl("calentamiento_nube_escritor");
const calentamiento_cursor_escritor_1 = getEl("calentamiento_cursor_escritor_1");
const calentamiento_cursor_escritor_2 = getEl("calentamiento_cursor_escritor_2");
const calentamiento_cursor_label_escritor_1 = calentamiento_cursor_escritor_1 ? calentamiento_cursor_escritor_1.querySelector(".cursor-label") : null;
const calentamiento_cursor_label_escritor_2 = calentamiento_cursor_escritor_2 ? calentamiento_cursor_escritor_2.querySelector(".cursor-label") : null;
const calentamiento_consigna_escritor = getEl("calentamiento_consigna_escritor");
const calentamiento_estado_escritor = getEl("calentamiento_estado_escritor");
const calentamiento_bloquear_escritor = getEl("calentamiento_bloquear_escritor");
const calentamiento_final_escritor = getEl("calentamiento_final_escritor");
const calentamiento_overlay_ui_escritor = document.querySelector("#calentamiento_escritor .calentamiento-overlay-ui");
const panel_atributos_escritora = getEl("atributos-container");
const panel_total_atributos_escritora = getEl("total");
const boton_inicio_atributos_escritora = getEl("btnInicio");
const players_fit_root = getEl("players_fit_root");
let vista_calentamiento_escritor = false;
let calentamiento_palabras_escritor = [];
let calentamiento_cursores_escritor = {
    1: { x: 50, y: 50, visible: false },
    2: { x: 50, y: 50, visible: false }
};
let calentamiento_estado_equipo_escritor = {
    bloqueado: false,
    seleccionadas: 0,
    final: null
};
let calentamiento_ultimo_final_escritor = "";
let timeout_error_calentamiento_escritor = null;
let calentamiento_solicitud_escritor = "libre";
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
const nombres_cursores_calentamiento_escritor = {
    1: "ESCRITXR 1",
    2: "ESCRITXR 2"
};
let editable_previo_calentamiento = null;
let ultimo_envio_cursor_calentamiento = 0;
let observador_marcador_escritora = null;
const CLASE_OCULTAR_MARCADOR_ESCRITORA = "ocultar-marcador-escritora";
const CLASE_INTRO_PARTIDA_ESCRITORA = "partida-intro-escritora";
const CLASES_ETAPAS_INTRO_PARTIDA_ESCRITORA = [
    "partida-intro-stage-tiempo-escritora",
    "partida-intro-stage-marcador-escritora",
    "partida-intro-stage-info-escritora"
];
let secuencia_inicio_escritora_activa = false;
let post_inicio_pendiente_escritora = null;
let raf_ajuste_viewport_escritora = null;
let resize_observer_fit_viewport_escritora = null;

const resetAjusteViewportEscritora = () => {
    if (!players_fit_root) return;
    players_fit_root.style.removeProperty("transform");
};

const ajustarViewportEscritora = () => {
    if (!players_fit_root) return;
    if (vista_calentamiento_escritor) {
        resetAjusteViewportEscritora();
        return;
    }

    players_fit_root.style.transform = "none";
    const viewportW = Math.max(window.innerWidth || 0, 1);
    const viewportH = Math.max(window.innerHeight || 0, 1);
    const anchoNatural = Math.max(Math.ceil(players_fit_root.scrollWidth || 0), 1);
    const altoNatural = Math.max(Math.ceil(players_fit_root.scrollHeight || 0), 1);

    let escala = Math.min(1, viewportW / anchoNatural, viewportH / altoNatural);
    if (!Number.isFinite(escala) || escala <= 0) {
        escala = 1;
    }

    const offsetX = Math.max(0, (viewportW - (anchoNatural * escala)) * 0.5);
    players_fit_root.style.transform = `translate3d(${offsetX.toFixed(2)}px, 0, 0) scale(${escala.toFixed(4)})`;
};

const programarAjusteViewportEscritora = () => {
    if (!players_fit_root) return;
    if (raf_ajuste_viewport_escritora) return;
    raf_ajuste_viewport_escritora = requestAnimationFrame(() => {
        raf_ajuste_viewport_escritora = null;
        ajustarViewportEscritora();
    });
};

const iniciarAjusteViewportEscritora = () => {
    if (document.documentElement) {
        document.documentElement.style.overflow = "hidden";
    }
    if (document.body) {
        document.body.style.overflow = "hidden";
    }
    if (!players_fit_root) return;
    if (!resize_observer_fit_viewport_escritora && typeof ResizeObserver === "function") {
        resize_observer_fit_viewport_escritora = new ResizeObserver(() => {
            programarAjusteViewportEscritora();
        });
        resize_observer_fit_viewport_escritora.observe(players_fit_root);
    }
    programarAjusteViewportEscritora();
    setTimeout(programarAjusteViewportEscritora, 120);
};

const esElementoVisible = (elemento) => {
    if (!elemento || !document.body || !document.body.contains(elemento)) return false;
    const estilos = window.getComputedStyle(elemento);
    if (!estilos || estilos.display === "none" || estilos.visibility === "hidden") return false;
    if (Number.parseFloat(estilos.opacity || "1") <= 0.01) return false;
    return elemento.getClientRects().length > 0;
};

const actualizarOcultacionMarcadorEscritora = () => {
    if (!document.body) return;
    const seleccionAtributosActiva =
        esElementoVisible(panel_atributos_escritora) ||
        esElementoVisible(panel_total_atributos_escritora) ||
        esElementoVisible(boton_inicio_atributos_escritora);
    const ocultarMarcador = Boolean(vista_calentamiento_escritor || seleccionAtributosActiva);
    document.body.classList.toggle(CLASE_OCULTAR_MARCADOR_ESCRITORA, ocultarMarcador);
    programarAjusteViewportEscritora();
};

function limpiarClasesIntroPartidaEscritora() {
    if (!document.body) return;
    document.body.classList.remove(CLASE_INTRO_PARTIDA_ESCRITORA);
    CLASES_ETAPAS_INTRO_PARTIDA_ESCRITORA.forEach((clase) => {
        document.body.classList.remove(clase);
    });
}

function revelarEtapaIntroPartidaEscritora(etapa) {
    if (!document.body || !Number.isFinite(etapa)) return;
    const total = CLASES_ETAPAS_INTRO_PARTIDA_ESCRITORA.length;
    const limite = Math.max(0, Math.min(total, Math.floor(etapa)));
    for (let i = 0; i < total; i += 1) {
        if (i < limite) {
            document.body.classList.add(CLASES_ETAPAS_INTRO_PARTIDA_ESCRITORA[i]);
        }
    }
}

function iniciarSecuenciaIntroPartidaEscritora() {
    if (!document.body) return;
    limpiarClasesIntroPartidaEscritora();
    document.body.classList.add(CLASE_INTRO_PARTIDA_ESCRITORA);
    secuencia_inicio_escritora_activa = true;
    post_inicio_pendiente_escritora = null;
    revelarEtapaIntroPartidaEscritora(0);
}

function hayCountdownInicioActivoEscritora() {
    return Boolean(
        secuencia_inicio_escritora_activa ||
        listener_cuenta_atras ||
        timer ||
        preparados_timer ||
        document.getElementById("countdown")
    );
}

function aplicarPostInicioEscritora(borrar_texto) {
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    secuencia_inicio_escritora_activa = false;
    post_inicio_pendiente_escritora = null;
    post_inicio(borrar_texto);
}

function finalizarSecuenciaIntroPartidaEscritora() {
    secuencia_inicio_escritora_activa = false;
    revelarEtapaIntroPartidaEscritora(CLASES_ETAPAS_INTRO_PARTIDA_ESCRITORA.length);
    if (post_inicio_pendiente_escritora && !hayCountdownInicioActivoEscritora()) {
        const payloadPendiente = post_inicio_pendiente_escritora;
        post_inicio_pendiente_escritora = null;
        aplicarPostInicioEscritora(payloadPendiente && payloadPendiente.borrar_texto);
    }
}

const iniciarObservadorMarcadorEscritora = () => {
    if (observador_marcador_escritora || typeof MutationObserver !== "function") return;
    const objetivos = [
        panel_atributos_escritora,
        panel_total_atributos_escritora,
        boton_inicio_atributos_escritora,
        document.body
    ].filter(Boolean);
    if (!objetivos.length) return;
    observador_marcador_escritora = new MutationObserver(() => {
        actualizarOcultacionMarcadorEscritora();
    });
    objetivos.forEach((objetivo) => {
        observador_marcador_escritora.observe(objetivo, {
            attributes: true,
            attributeFilter: ["style", "class", "hidden", "aria-hidden"]
        });
    });
    window.addEventListener("resize", actualizarOcultacionMarcadorEscritora);
};
const limitarPct = (valor, min, max) => Math.max(min, Math.min(max, valor));
const normalizarNombreCursorCalentamientoEscritor = (valor, fallback) => {
    const texto = typeof valor === "string" ? valor.trim() : "";
    if (!texto) return fallback;
    return texto.slice(0, MAX_NOMBRE_CURSOR_CALENTAMIENTO);
};
const normalizarFinalCalentamientoEscritor = (entrada) => {
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
const actualizarConsignaCalentamientoEscritor = (solicitud) => {
    if (!calentamiento_consigna_escritor) return;
    const tipo = normalizarSolicitudCalentamientoVista(solicitud);
    calentamiento_consigna_escritor.textContent = `CONSIGNA: ${ETIQUETAS_SOLICITUD_CALENTAMIENTO_VISTA[tipo] || "LIBRE"}`;
    calentamiento_consigna_escritor.classList.remove("tipo-libre", "tipo-lugares", "tipo-acciones", "tipo-frase_final");
    calentamiento_consigna_escritor.classList.add(`tipo-${tipo}`);
    if (calentamiento_solicitud_escritor && calentamiento_solicitud_escritor !== tipo) {
        calentamiento_consigna_escritor.classList.remove("consigna-cambio");
        void calentamiento_consigna_escritor.offsetWidth;
        calentamiento_consigna_escritor.classList.add("consigna-cambio");
    } else {
        calentamiento_consigna_escritor.classList.remove("consigna-cambio");
    }
    calentamiento_solicitud_escritor = tipo;
};
const actualizarEtiquetasCursorCalentamientoEscritor = () => {
    if (calentamiento_cursor_label_escritor_1) {
        calentamiento_cursor_label_escritor_1.textContent = normalizarNombreCursorCalentamientoEscritor(
            nombres_cursores_calentamiento_escritor[1],
            "ESCRITXR 1"
        );
    }
    if (calentamiento_cursor_label_escritor_2) {
        calentamiento_cursor_label_escritor_2.textContent = normalizarNombreCursorCalentamientoEscritor(
            nombres_cursores_calentamiento_escritor[2],
            "ESCRITXR 2"
        );
    }
};
const obtenerMinYPalabrasCalentamientoEscritor = () => {
    if (!calentamiento_overlay_ui_escritor) return MIN_Y_CALENTAMIENTO_DEFAULT;
    const altoVentana = window.innerHeight || 1;
    const rect = calentamiento_overlay_ui_escritor.getBoundingClientRect();
    if (!Number.isFinite(rect.bottom) || rect.bottom <= 0) return MIN_Y_CALENTAMIENTO_DEFAULT;
    const yPct = ((rect.bottom + MARGEN_CABECERA_CALENTAMIENTO_PX) / altoVentana) * 100;
    return limitarPct(yPct, 12, 62);
};

const obtenerRectStageCalentamientoEscritor = () => {
    if (!calentamiento_stage_escritor || typeof calentamiento_stage_escritor.getBoundingClientRect !== "function") {
        return null;
    }
    const rect = calentamiento_stage_escritor.getBoundingClientRect();
    const width = Number(rect && rect.width) || 0;
    const height = Number(rect && rect.height) || 0;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return null;
    }
    return rect;
};

const aplicarCursorCalentamientoEscritor = (elemento, cursor) => {
    if (!elemento) return;
    const visible = Boolean(cursor && cursor.visible);
    elemento.classList.toggle("activo", visible);
    if (!visible) return;
    const x = typeof cursor.x === "number" ? cursor.x : 50;
    const y = typeof cursor.y === "number" ? cursor.y : 50;
    const xPct = Math.max(0, Math.min(100, x));
    const yPct = Math.max(0, Math.min(100, y));
    const rectStage = obtenerRectStageCalentamientoEscritor();
    if (rectStage) {
        const xPx = (xPct / 100) * rectStage.width;
        const yPx = (yPct / 100) * rectStage.height;
        elemento.style.left = `${xPx}px`;
        elemento.style.top = `${yPx}px`;
        return;
    }
    elemento.style.left = `${xPct}%`;
    elemento.style.top = `${yPct}%`;
};

const renderizarCursoresCalentamientoEscritor = () => {
    aplicarCursorCalentamientoEscritor(calentamiento_cursor_escritor_1, calentamiento_cursores_escritor[1]);
    aplicarCursorCalentamientoEscritor(calentamiento_cursor_escritor_2, calentamiento_cursores_escritor[2]);
};

const renderizarPalabrasCalentamientoEscritor = () => {
    if (!calentamiento_nube_escritor) return;
    calentamiento_nube_escritor.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const equipoEscritor = playerNumber === 1 || playerNumber === 2 ? playerNumber : null;
    const ahora = Date.now();
    const minY = obtenerMinYPalabrasCalentamientoEscritor();
    calentamiento_palabras_escritor.forEach((entrada) => {
        const propia = equipoEscritor !== null && entrada.equipo === equipoEscritor;
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
        if (propia && entrada.id) clases.push("calentamiento-palabra-clickable");
        nodo.className = clases.join(" ");
        nodo.textContent = entrada.palabra;
        nodo.style.left = `${Math.max(0, Math.min(100, entrada.x))}%`;
        nodo.style.top = `${limitarPct(entrada.y, minY, 96)}%`;
        const duracionMs = Number(entrada.duracionMs) > 0 ? Number(entrada.duracionMs) : DURACION_DECAY_CALENTAMIENTO_MS;
        const edadMs = Math.max(0, Date.now() - (Number(entrada.ts) || Date.now()));
        const delayMs = entrada.destacada ? 0 : -Math.min(edadMs, duracionMs);
        nodo.style.setProperty("--calentamiento-decay-duration", `${duracionMs}ms`);
        nodo.style.setProperty("--calentamiento-decay-delay", `${delayMs}ms`);
        if (propia && entrada.id) {
            nodo.dataset.id = entrada.id;
            nodo.addEventListener("click", () => {
                if (!socket || !socket.connected) return;
                socket.emit("calentamiento_click_palabra", { id: entrada.id });
            });
        }
        fragment.appendChild(nodo);
    });
    calentamiento_nube_escritor.appendChild(fragment);
};

const normalizarPalabrasCalentamientoEscritor = (equipos = {}) => {
    const lista = [];
    const minY = obtenerMinYPalabrasCalentamientoEscritor();
    const finales = {
        1: normalizarFinalCalentamientoEscritor(equipos[1] && equipos[1].final),
        2: normalizarFinalCalentamientoEscritor(equipos[2] && equipos[2].final)
    };
    [1, 2].forEach((equipo) => {
        const data = equipos[equipo] || {};
        const palabras = Array.isArray(data.palabras) ? data.palabras : [];
        const finalId = finales[equipo] ? finales[equipo].id : "";
        palabras.forEach((entrada) => {
            if (!entrada || typeof entrada.palabra !== "string") return;
            lista.push({
                id: typeof entrada.id === "string" ? entrada.id : "",
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

const actualizarVistaCalentamientoEscritor = (activa) => {
    const siguiente = Boolean(activa);
    if (vista_calentamiento_escritor === siguiente) return;
    vista_calentamiento_escritor = siguiente;
    if (document.body) {
        document.body.classList.toggle("vista-calentamiento-escritor", vista_calentamiento_escritor);
    }
    if (calentamiento_escritor) {
        calentamiento_escritor.setAttribute("aria-hidden", vista_calentamiento_escritor ? "false" : "true");
        calentamiento_escritor.style.display = vista_calentamiento_escritor ? "flex" : "none";
    }
    if (texto) {
        if (vista_calentamiento_escritor) {
            editable_previo_calentamiento = texto.contentEditable;
            texto.contentEditable = "false";
        } else if (editable_previo_calentamiento !== null) {
            texto.contentEditable = editable_previo_calentamiento;
            editable_previo_calentamiento = null;
        }
    }
    if (!vista_calentamiento_escritor) {
        socket.emit("calentamiento_cursor", { visible: false });
    }
    actualizarOcultacionMarcadorEscritora();
};

iniciarObservadorMarcadorEscritora();
actualizarOcultacionMarcadorEscritora();
iniciarAjusteViewportEscritora();

const actualizarBotonBloquearCalentamientoEscritor = (activo, bloqueado, seleccionadas) => {
    if (!calentamiento_bloquear_escritor) return;
    const cantidad = Number.isFinite(seleccionadas) ? Math.max(0, Math.floor(seleccionadas)) : 0;
    if (!activo) {
        calentamiento_bloquear_escritor.disabled = true;
        calentamiento_bloquear_escritor.textContent = "SELECCIONA PALABRAS";
        return;
    }
    if (bloqueado) {
        calentamiento_bloquear_escritor.disabled = true;
        calentamiento_bloquear_escritor.textContent = "CONSIGNA CERRADA";
        return;
    }
    if (cantidad > 0) {
        calentamiento_bloquear_escritor.disabled = false;
        calentamiento_bloquear_escritor.textContent = `CERRAR CONSIGNA (${cantidad})`;
        return;
    }
    calentamiento_bloquear_escritor.disabled = true;
    calentamiento_bloquear_escritor.textContent = "SELECCIONA PALABRAS";
};

const actualizarFinalCalentamientoEscritor = (finalPalabra) => {
    if (!calentamiento_final_escritor) return;
    const finalValido = normalizarFinalCalentamientoEscritor(finalPalabra);
    if (!finalValido) {
        calentamiento_final_escritor.textContent = "";
        calentamiento_final_escritor.classList.remove("activo", "reveal");
        calentamiento_ultimo_final_escritor = "";
        return;
    }
    calentamiento_final_escritor.textContent = `PALABRA FINAL: ${finalValido.palabra.toUpperCase()}`;
    calentamiento_final_escritor.classList.add("activo");
    if (calentamiento_ultimo_final_escritor !== finalValido.id) {
        calentamiento_final_escritor.classList.remove("reveal");
        void calentamiento_final_escritor.offsetWidth;
        calentamiento_final_escritor.classList.add("reveal");
    }
    calentamiento_ultimo_final_escritor = finalValido.id;
};

const mostrarErrorCalentamientoEscritor = (mensaje) => {
    const textoError = typeof mensaje === "string" && mensaje.trim()
        ? mensaje.trim()
        : "No se pudo completar la accion.";
    if (calentamiento_estado_escritor) {
        calentamiento_estado_escritor.textContent = textoError;
        calentamiento_estado_escritor.classList.add("calentamiento-error");
    }
    if (calentamiento_bloquear_escritor) {
        calentamiento_bloquear_escritor.classList.add("is-error");
    }
    if (timeout_error_calentamiento_escritor) {
        clearTimeout(timeout_error_calentamiento_escritor);
    }
    timeout_error_calentamiento_escritor = setTimeout(() => {
        if (calentamiento_estado_escritor) {
            calentamiento_estado_escritor.classList.remove("calentamiento-error");
        }
        if (calentamiento_bloquear_escritor) {
            calentamiento_bloquear_escritor.classList.remove("is-error");
        }
        timeout_error_calentamiento_escritor = null;
    }, 1200);
};

const actualizarCalentamientoEscritor = (data = {}) => {
    if (typeof data.vista === "boolean") {
        actualizarVistaCalentamientoEscritor(data.vista);
    }
    const activo = Boolean(data.activo && data.vista);
    actualizarConsignaCalentamientoEscritor(data.solicitud);
    const equipos = data.equipos || {};
    const equipoEscritor = playerNumber === 1 || playerNumber === 2 ? playerNumber : null;
    const dataEquipo = equipoEscritor !== null ? (equipos[equipoEscritor] || {}) : {};
    const bloqueado = Boolean(dataEquipo && dataEquipo.bloqueado);
    const seleccionadas = Number.isFinite(Number(dataEquipo && dataEquipo.seleccionadas))
        ? Number(dataEquipo.seleccionadas)
        : 0;
    const finalEquipo = normalizarFinalCalentamientoEscritor(dataEquipo && dataEquipo.final);
    calentamiento_estado_equipo_escritor = {
        bloqueado,
        seleccionadas: Math.max(0, Math.floor(seleccionadas)),
        final: finalEquipo
    };
    if (calentamiento_estado_escritor) {
        calentamiento_estado_escritor.classList.remove("calentamiento-error");
    }
    if (calentamiento_bloquear_escritor) {
        calentamiento_bloquear_escritor.classList.remove("is-error");
    }
    if (calentamiento_estado_escritor) {
        if (!activo) {
            calentamiento_estado_escritor.textContent = "Esperando vista de calentamiento.";
        } else if (!bloqueado) {
            calentamiento_estado_escritor.textContent = "Selecciona palabras de tu equipo y pulsa CERRAR CONSIGNA.";
        } else if (!finalEquipo) {
            calentamiento_estado_escritor.textContent = "Consigna cerrada. Elige una palabra final de las seleccionadas.";
        } else {
            calentamiento_estado_escritor.textContent = `Palabra final fijada: ${finalEquipo.palabra}.`;
        }
    }
    actualizarBotonBloquearCalentamientoEscritor(activo, bloqueado, seleccionadas);
    actualizarFinalCalentamientoEscritor(finalEquipo);
    calentamiento_palabras_escritor = normalizarPalabrasCalentamientoEscritor(equipos);
    if (data.cursores && typeof data.cursores === "object") {
        calentamiento_cursores_escritor = {
            1: { ...(calentamiento_cursores_escritor[1] || {}), ...(data.cursores[1] || {}) },
            2: { ...(calentamiento_cursores_escritor[2] || {}), ...(data.cursores[2] || {}) }
        };
    }
    renderizarPalabrasCalentamientoEscritor();
    renderizarCursoresCalentamientoEscritor();
};

const actualizarCursorCalentamientoEscritor = (payload = {}) => {
    const equipo = Number(payload.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    calentamiento_cursores_escritor[equipo] = {
        ...(calentamiento_cursores_escritor[equipo] || {}),
        ...payload
    };
    renderizarCursoresCalentamientoEscritor();
};

const enviarCursorCalentamiento = (x, y, visible = true) => {
    if (!vista_calentamiento_escritor || !socket || !socket.connected) return;
    const ahora = Date.now();
    if (visible && (ahora - ultimo_envio_cursor_calentamiento) < 40) return;
    ultimo_envio_cursor_calentamiento = ahora;
    socket.emit("calentamiento_cursor", {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
        visible
    });
};

window.addEventListener("mousemove", (evt) => {
    if (!vista_calentamiento_escritor) return;
    const rectStage = obtenerRectStageCalentamientoEscritor();
    if (rectStage) {
        const ancho = rectStage.width || 1;
        const alto = rectStage.height || 1;
        const x = ((evt.clientX - rectStage.left) / ancho) * 100;
        const y = ((evt.clientY - rectStage.top) / alto) * 100;
        enviarCursorCalentamiento(x, y, true);
        return;
    }
    const ancho = window.innerWidth || 1;
    const alto = window.innerHeight || 1;
    enviarCursorCalentamiento((evt.clientX / ancho) * 100, (evt.clientY / alto) * 100, true);
});

window.addEventListener("blur", () => {
    if (!vista_calentamiento_escritor) return;
    socket.emit("calentamiento_cursor", { visible: false });
});

window.addEventListener("resize", () => {
    if (vista_calentamiento_escritor) {
        renderizarPalabrasCalentamientoEscritor();
        renderizarCursoresCalentamientoEscritor();
    }
    programarAjusteViewportEscritora();
});

window.addEventListener("beforeunload", () => {
    if (!socket) return;
    socket.emit("calentamiento_cursor", { visible: false });
});

if (calentamiento_bloquear_escritor) {
    calentamiento_bloquear_escritor.addEventListener("click", () => {
        if (!socket || !socket.connected) return;
        const estado = calentamiento_estado_equipo_escritor || {};
        if (estado.bloqueado) return;
        socket.emit("calentamiento_bloquear_equipo");
    });
}

const CLASE_PALABRA_BENDITA_LOCAL =
    typeof CLASE_PALABRA_BENDITA !== "undefined" ? CLASE_PALABRA_BENDITA : "palabra-bendita";
const CLASE_PALABRA_MUSA_LOCAL = "palabra-musa";
const CLASE_LETRA_BENDITA_LOCAL = "letra-verde";
const SELECTOR_PALABRA_PROTEGIDA = `.${CLASE_PALABRA_BENDITA_LOCAL}, .${CLASE_PALABRA_MUSA_LOCAL}, .${CLASE_LETRA_BENDITA_LOCAL}`;
const SELECTOR_PALABRA_MARCADA = `.${CLASE_PALABRA_BENDITA_LOCAL}, .${CLASE_PALABRA_MUSA_LOCAL}`;
const PATRON_CARACTER_PALABRA = "A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ";
let estadoObjetivosMultipalabra = [];

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

function rangoIntersecaPalabraMarcada(rango) {
    if (!texto || !rango) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_MARCADA);
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

function obtenerRangoPalabraActual() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const original = sel.getRangeAt(0).cloneRange();
    if (typeof sel.modify === "function") {
        sel.collapse(original.endContainer, original.endOffset);
        sel.modify("move", "backward", "word");
        sel.modify("extend", "forward", "word");
        const rango = sel.getRangeAt(0).cloneRange();
        sel.removeAllRanges();
        sel.addRange(original);
        return rango;
    }
    if (original.startContainer.nodeType !== Node.TEXT_NODE) {
        return null;
    }
    const textoNodo = original.startContainer.textContent || "";
    let inicio = original.startOffset;
    let fin = original.startOffset;
    while (inicio > 0 && !/\s/.test(textoNodo[inicio - 1])) {
        inicio -= 1;
    }
    while (fin < textoNodo.length && !/\s/.test(textoNodo[fin])) {
        fin += 1;
    }
    const rango = document.createRange();
    rango.setStart(original.startContainer, inicio);
    rango.setEnd(original.startContainer, fin);
    return rango;
}

function marcarPalabraBenditaActual(inicio, fin, esMusa) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const rango = Number.isInteger(inicio) && Number.isInteger(fin)
        ? obtenerRangoPorOffsets(texto, inicio, fin)
        : obtenerRangoPalabraActual();
    if (!rango) return;
    const contenido = rango.toString();
    if (!contenido || !contenido.trim()) return;
    if (rangoIntersecaPalabraMarcada(rango)) return;
    const span = document.createElement("span");
    span.className = CLASE_PALABRA_BENDITA_LOCAL;
    if (esMusa) {
        span.classList.add("palabra-bendita-musa");
    }
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

function marcarPalabraMusaActual(inicio, fin) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const rango = Number.isInteger(inicio) && Number.isInteger(fin)
        ? obtenerRangoPorOffsets(texto, inicio, fin)
        : obtenerRangoPalabraActual();
    if (!rango) return false;
    const contenido = rango.toString();
    if (!contenido || !contenido.trim()) return false;
    if (rangoIntersecaPalabraMarcada(rango)) return false;
    const span = document.createElement("span");
    span.className = CLASE_PALABRA_MUSA_LOCAL;
    span.setAttribute("contenteditable", "false");
    const fragmento = rango.extractContents();
    span.appendChild(fragmento);
    rango.insertNode(span);
    const nuevoRango = document.createRange();
    nuevoRango.setStartAfter(span);
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
    return true;
}

function obtenerObjetivosPalabraActual() {
    if (Array.isArray(palabra_actual)) {
        return palabra_actual
            .map((palabra) => (typeof palabra === "string" ? palabra.trim() : ""))
            .filter(Boolean);
    }
    if (typeof palabra_actual === "string") {
        const palabra = palabra_actual.trim();
        return palabra ? [palabra] : [];
    }
    return [];
}

function escaparRegex(valor) {
    return String(valor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function esObjetivoMultipalabra(objetivo) {
    return typeof objetivo === "string" && /\s+/.test(objetivo.trim());
}

function crearRegexObjetivoMultipalabra(objetivo) {
    if (!esObjetivoMultipalabra(objetivo)) return null;
    const partes = String(objetivo).trim().split(/\s+/).map(escaparRegex);
    if (partes.length < 2) return null;
    const cuerpo = partes.join("\\s+");
    const separador = `[^${PATRON_CARACTER_PALABRA}]`;
    return new RegExp(`(^|${separador})(${cuerpo})(?=$|${separador})`, "gi");
}

function buscarCoincidenciasMultipalabra(textoFuente, objetivo) {
    if (typeof textoFuente !== "string") return [];
    const regex = crearRegexObjetivoMultipalabra(objetivo);
    if (!regex) return [];
    const coincidencias = [];
    let match;
    while ((match = regex.exec(textoFuente)) !== null) {
        const prefijo = match[1] || "";
        const contenido = match[2] || "";
        const inicio = match.index + prefijo.length;
        coincidencias.push({ inicio, fin: inicio + contenido.length });
        if (regex.lastIndex === match.index) {
            regex.lastIndex += 1;
        }
    }
    return coincidencias;
}

function prepararDeteccionMultipalabraAsignada() {
    const textoBase = texto?.textContent || "";
    estadoObjetivosMultipalabra = obtenerObjetivosPalabraActual()
        .filter(esObjetivoMultipalabra)
        .map((objetivo) => ({
            objetivo,
            ocurrenciasBase: buscarCoincidenciasMultipalabra(textoBase, objetivo).length
        }));
}

function limpiarDeteccionMultipalabraAsignada() {
    estadoObjetivosMultipalabra = [];
}

function detectarInsercionMultipalabra(textoActual) {
    if (!Array.isArray(estadoObjetivosMultipalabra) || !estadoObjetivosMultipalabra.length) {
        return null;
    }
    const fuente = typeof textoActual === "string" ? textoActual : "";
    let mejorCoincidencia = null;
    estadoObjetivosMultipalabra.forEach((estado) => {
        const coincidencias = buscarCoincidenciasMultipalabra(fuente, estado.objetivo);
        if (coincidencias.length <= estado.ocurrenciasBase) return;
        const indiceNueva = Math.max(0, Math.min(coincidencias.length - 1, estado.ocurrenciasBase));
        const coincidenciaNueva = coincidencias[indiceNueva] || coincidencias[coincidencias.length - 1];
        if (!coincidenciaNueva) return;
        if (!mejorCoincidencia || coincidenciaNueva.fin >= mejorCoincidencia.fin) {
            mejorCoincidencia = {
                objetivo: estado.objetivo,
                inicio: coincidenciaNueva.inicio,
                fin: coincidenciaNueva.fin
            };
        }
    });
    return mejorCoincidencia;
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
    const objetivo = (frase_final || "").toLowerCase();
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

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";
const DURACION_ANIMACION_ENTRADA_VIDA_MS = 880;
const animacionesEntradaBarraVida = new WeakMap();
let animacionEntradaVidaPendiente = false;

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
    animacionEntradaVidaPendiente = Boolean(valor);
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

let contenedor = getEl("contenedor")
  

let tempo_text_borroso;
let tempo_text_inverso;

let listener_cuenta_atras = null;
let timer = null;
let sub_timer = null;
let preparados_timer = null;
let fallback_cuenta_atras_timer = null;

function limpiarCountdownInicioEscritora() {
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);
    clearTimeout(sub_timer);
    clearTimeout(preparados_timer);
    clearTimeout(fallback_cuenta_atras_timer);
    listener_cuenta_atras = null;
    timer = null;
    sub_timer = null;
    preparados_timer = null;
    fallback_cuenta_atras_timer = null;
    $('#countdown').remove();
}

// Variables de los modos.
let modo_actual = "";
let putada_actual = "";
let modo_texto_borroso = 0;
let desactivar_borrar = false;
let bloquear_borrado_putada = false;
let timeout_bloqueo_putada = null;
let teclado_lento_putada = false;
let timeout_teclado_lento = null;
const RETRASO_TECLADO_LENTO_MS = 500;
const RAYO_REDUCCION_K = 0.08;

function limpiar_bloqueo_putada() {
    bloquear_borrado_putada = false;
    putada_actual = "";
    if (timeout_bloqueo_putada) {
        clearTimeout(timeout_bloqueo_putada);
        timeout_bloqueo_putada = null;
    }
}

function limpiar_teclado_lento() {
    teclado_lento_putada = false;
    if (timeout_teclado_lento) {
        clearTimeout(timeout_teclado_lento);
        timeout_teclado_lento = null;
    }
}

var letra_prohibida = "";
var letra_bendita = "";
let frase_final;
let listener_modo;
let listener_modo1;
let timeoutID_menu;
let resurreccion_obligatoria_activa = false;
let esperando_resurreccion_tiempo = false;
let permitir_fin_por_decision_local = false;
let partida_global_finalizada = false;
let listener_modo_psico;
let activado_psico = false;
let temp_text_inverso_activado = false;

function setInterfazInversaGlobal(_estado) {
}

let TIEMPO_MODIFICADOR;
const mainTitle = document.querySelector('.main-title');
const buttonContainer = document.querySelector('.button-container');


function getParameterByName(name, url) {
if (!url) url = window.location.href;
name = name.replace(/[\[\]]/g, "\\$&");
var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
if (!results) return null;
if (!results[2]) return '';
return decodeURIComponent(results[2].replace(/\+/g, " "));
}

if (player == 1) {
    enviar_putada_de_jx = 'enviar_putada_de_j2';
    feedback_a_j_x = 'feedback_a_j1';
    feedback_de_j_x = 'feedback_de_j1';
    texto_x = 'texto1';
    enviar_postgame_x = 'enviar_postgame1';
    recibir_postgame_x = 'recibir_postgame1';
    nombre = getEl("nombre");
    nombre.value = "ESCRITXR 1";
    nombres_cursores_calentamiento_escritor[1] = nombre.value;
    inspirar = 'inspirar_j1';
    enviar_palabra = 'enviar_palabra_j1';
    enviar_ventaja = 'enviar_ventaja_j1';
    elegir_ventaja = "elegir_ventaja_j1";
    nombre.style="color:aqua;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"
    if (metadatos) {
        metadatos.style.removeProperty("color");
        metadatos.style.removeProperty("text-shadow");
        metadatos.classList.remove("marcador-equipo-2");
        metadatos.classList.add("marcador-equipo-1");
    }

} else if (player == 2) {
    enviar_putada_de_jx = 'enviar_putada_de_j1';
    feedback_a_j_x = 'feedback_a_j2';
    feedback_de_j_x = 'feedback_de_j2';
    texto_x = 'texto2';
    enviar_postgame_x = 'enviar_postgame2';
    recibir_postgame_x = 'recibir_postgame2';
    nombre = getEl("nombre");
    nombre.value = "ESCRITXR 2"
    nombres_cursores_calentamiento_escritor[2] = nombre.value;
    inspirar = 'inspirar_j2';
    enviar_palabra = 'enviar_palabra_j2'
    enviar_ventaja = 'enviar_ventaja_j2';
    elegir_ventaja = "elegir_ventaja_j2";
    nombre.style="color:red;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;"
    if (metadatos) {
        metadatos.style.removeProperty("color");
        metadatos.style.removeProperty("text-shadow");
        metadatos.classList.remove("marcador-equipo-1");
        metadatos.classList.add("marcador-equipo-2");
    }

}
actualizarEtiquetasCursorCalentamientoEscritor();

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
  
        // Si el cursor está justo antes de un `contenteditable="false"`, bloqueamos el retroceso
        if (
          startContainer.nodeType === 1 &&
          startOffset === 0 &&
          startContainer.previousSibling &&
          startContainer.previousSibling.getAttribute &&
          startContainer.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault(); // Bloquea la acción de retroceso
        }
  
        // Si el cursor está dentro de un nodo de texto, verificamos el anterior
        if (
          startContainer.nodeType === 3 &&
          startOffset === 0 &&
          startContainer.parentNode.previousSibling &&
          startContainer.parentNode.previousSibling.getAttribute &&
          startContainer.parentNode.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault(); // Bloquea la acción de retroceso
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

texto.addEventListener("input", (e) => {
    if (!snapshot_html_bendita) return;
    const cantidad_actual = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA).length;
    if (cantidad_actual < snapshot_cantidad_benditas) {
        restaurando_bendita = true;
        texto.innerHTML = snapshot_html_bendita;
        if (Number.isFinite(snapshot_offset_bendita)) {
            colocarCaretEnOffset(snapshot_offset_bendita);
        }
        countChars(texto);
        sendText();
        setTimeout(() => {
            restaurando_bendita = false;
        }, 0);
    }
    snapshot_html_bendita = null;
    snapshot_offset_bendita = null;
    snapshot_cantidad_benditas = 0;
});

// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);

socket.on("musa_corazon", (data) => {
    const equipo = data && Number(data.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    lanzarCorazonEscritor(equipo);
});

socket.on("nombre1", (data) => {
    const nombreAzul = normalizarNombreCursorCalentamientoEscritor(data, "ESCRITXR 1");
    nombres_cursores_calentamiento_escritor[1] = nombreAzul;
    if (player == 1 && nombre) {
        nombre.value = nombreAzul;
    }
    actualizarEtiquetasCursorCalentamientoEscritor();
});

socket.on("nombre2", (data) => {
    const nombreRojo = normalizarNombreCursorCalentamientoEscritor(data, "ESCRITXR 2");
    nombres_cursores_calentamiento_escritor[2] = nombreRojo;
    if (player == 2 && nombre) {
        nombre.value = nombreRojo;
    }
    actualizarEtiquetasCursorCalentamientoEscritor();
});
  
const PUTADAS = {
    "🐢": function () {
        if (timeout_teclado_lento) {
            clearTimeout(timeout_teclado_lento);
            timeout_teclado_lento = null;
        }
        teclado_lento_putada = true;
        putada_actual = "🐢";
        timeout_teclado_lento = setTimeout(function () {
            teclado_lento_putada = false;
            putada_actual = "";
            timeout_teclado_lento = null;
        }, TIEMPO_MODIFICADOR);
    },
    "⌛": function () {
    },
    "⚡": function () {
        borrado_cambiado = true;
        antiguo_rapidez_borrado = rapidez_borrado;
        antiguo_inicio_borrado = rapidez_inicio_borrado;
        
        rapidez_borrado = reduceLog(rapidez_borrado, RAYO_REDUCCION_K);
        rapidez_inicio_borrado = reduceLog(rapidez_inicio_borrado, RAYO_REDUCCION_K);
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
            borrado_cambiado = false;
            rapidez_borrado = antiguo_rapidez_borrado;
            rapidez_inicio_borrado = antiguo_inicio_borrado;
        }, TIEMPO_MODIFICADOR);
    },

    "🙃": function () {
        tiempo_inicial = new Date();
        desactivar_borrar = true;
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
        sendText();
        temp_text_inverso_activado = true;
        setInterfazInversaGlobal(true);
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            setInterfazInversaGlobal(false);
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
            putada_actual = "";
        sendText()  
        }, TIEMPO_MODIFICADOR);
    },

    "🖊️": function () {
        if (timeout_bloqueo_putada) {
            clearTimeout(timeout_bloqueo_putada);
            timeout_bloqueo_putada = null;
        }
        bloquear_borrado_putada = true;
        putada_actual = "🖊️";
        timeout_bloqueo_putada = setTimeout(function () {
            limpiar_bloqueo_putada();
        }, TIEMPO_MODIFICADOR);
    },

    "🌪️": function () {
        modo_texto_borroso = 1;
        tiempo_inicial = new Date();
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            putada_actual = "";
        }, TIEMPO_MODIFICADOR);
    },
};

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("bonus");
        if (explicacion) {
            explicacion.style.color = "yellow";
            explicacion.innerHTML = "SUMA TIEMPO CON PALABRAS BONUS";
        }
        palabra.innerHTML = "NIVEL PALABRAS BONUS";
        definicion.innerHTML = "";
        socket.emit("nueva_palabra", player);
        socket.on(enviar_palabra, data => {
          console.log(data)
            recibir_palabra(data);
        });
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("prohibida");
        letra_prohibida = data.letra_prohibida;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("keydown", listener_modo);
        if (explicacion) {
            explicacion.style.color = "red";
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        }
        palabra.innerHTML = "NIVEL LETRA PROHIBIDA";
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
    },

    "letra bendita": function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("bendita");
        letra_bendita = data.letra_bendita;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("keydown", listener_modo, true);
        if (explicacion) {
            explicacion.style.color = "lime";
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("bendita", letra_bendita);
        }
        palabra.innerHTML = "NIVEL LETRA BENDITA";
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
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
        //explicación.innerHTML = "MODO PSICODÉLICO";
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
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("tertulia");
        es_pausa = true;
        tiempo_restante = TIEMPO_MODIFICADOR - (new Date().getTime() - tiempo_inicial.getTime());
        pausa();
        if (explicacion) {
            explicacion.style.color = "#86d0ff";
            explicacion.innerHTML = "DIALOGA CON TUS MUSAS";
        }
        palabra.innerHTML = "NIVEL TERTULIA";
        definicion.innerHTML = "";
    },

    'palabras prohibidas': function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("prohibidas");
        if (explicacion) {
            explicacion.style.color = "pink";
            explicacion.innerHTML = "EVITA LAS PALABRAS PROHIBIDAS";
        }
        palabra.innerHTML = "NIVEL PALABRAS PROHIBIDAS";
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_prohibida", player);
        socket.on(enviar_palabra, data => {
            console.log("ESTA FUNCIONANDOOOOOO")
            recibir_palabra_prohibida(data);
        });
    },

    'ortografía perfecta': function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("frase-final");
        if (explicacion) {
            explicacion.style.color = "orange";
            explicacion.innerHTML = "MODO ORTOGRAFÍA PERFECTA";
        }
        palabra.innerHTML = "NIVEL ORTOGRAFÍA PERFECTA";
        definicion.innerHTML = "";
        modo_ortografia_perfecta();

    },

    'frase final': function (socket) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("frase-final");
        if (explicacion) {
            explicacion.style.color = "orange";
            explicacion.innerHTML = "ULTIMA RONDA";
        }
        palabra.innerHTML = "NIVEL FRASE FINAL";
        definicion.innerHTML = "";
        function_frase_final();
    },

    "": function (data) { },
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        socket.off(enviar_palabra);
        asignada = false;
        limpiarDeteccionMultipalabraAsignada();
        texto.removeEventListener("keyup", listener_modo);
        definicion.style.fontSize = "1.5vw";
    },

    "letra prohibida": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        letra_bendita = "";
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
        socket.off(enviar_palabra);
        asignada = false;
        limpiarDeteccionMultipalabraAsignada();
        texto.removeEventListener("keyup", listener_modo);
    },

    "ortografía perfecta": function (data) {
        clearTimeout(interval_ortografia_perfecta);
    },

    "frase final": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        limpiarMarcadoFraseFinal();
    },

    "": function (data) { },
};

// Cuando el texto cambia, envía los datos actuales al resto.
texto.addEventListener("input", () => {
    if (restaurando_bendita) return;
    countChars(texto);
    sendText();
});

// Enviar teclas para el mapa de calor.
texto.addEventListener("keydown", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key == "Backspace") {
        socket.emit('tecla_jugador', { player, code: evt.code || "", key: evt.key || "" });
    }
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    actualizarEtiquetasCursorCalentamientoEscritor();
    socket.emit('registrar_escritor', player);
    socket.emit('pedir_calentamiento_estado');
    socket.emit('calentamiento_cursor', { visible: false });
});

socket.on('calentamiento_vista', (data) => {
    actualizarVistaCalentamientoEscritor(Boolean(data && data.activo));
});

socket.on('calentamiento_estado_espectador', (data) => {
    actualizarCalentamientoEscritor(data || {});
});

socket.on('calentamiento_cursor', (payload = {}) => {
    actualizarCursorCalentamientoEscritor(payload);
});

socket.on('calentamiento_error_escritor', (data = {}) => {
    mostrarErrorCalentamientoEscritor(data && data.mensaje ? data.mensaje : "No se pudo completar la accion.");
});

//activar los sockets extratextuales.
activar_sockets_extratextuales();
socket.on('actualizar_contador_musas', contador_musas => {
    console.log("actualizar_contador_musas")
    const totalMusas = player == 1 ? contador_musas.escritxr1 : contador_musas.escritxr2;
    actualizarMusasMarcador(totalMusas);
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
socket.on("count", (data) => {
    if(data.player == player){
    procesarFulgorCambioTiempoDesdeContador(data.count);
    const segundosCount = extraerSegundosContador(data.count);
    if (segundosCount !== null && segundosCount >= 10 && activado_psico) {
        LIMPIEZAS["psicodélico"]("");
    }
    if (segundosCount !== null) {
        if (segundosCount >= 20) {
            tiempo.style.color = "white";
        } else if (segundosCount >= 10) {
            tiempo.style.color = "yellow";
        } else if (activado_psico == false) {
            MODOS["psicodélico"](data, socket);
            tiempo.style.color = "red";
        } else {
            tiempo.style.color = "red";
        }
    }

    tiempo.innerHTML = data.count;
    const animarEntradaVida = Boolean(animacionEntradaVidaPendiente && Number.isFinite(segundosCount));
    actualizarBarraVida(tiempo, data.count, { animarEntrada: animarEntradaVida });
    if (animarEntradaVida) {
        animacionEntradaVidaPendiente = false;
    }
    if (data.count == "¡Tiempo!") {
        limpiar_bloqueo_putada();
        limpiar_teclado_lento();
        setInterfazInversaGlobal(false);
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
            setInterfazInversaGlobal(false);
            procesarTexto();
        }
        sendText();
        if (modo_actual != "" && modo_actual != "frase final") {
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "white";
            pararEscritura = true;
            stopConfetti();
            limpiarCountdownInicioEscritora();
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            if(temp_text_inverso_activado == true){
                temp_text_inverso_activado = false;
                setInterfazInversaGlobal(false);
                clearTimeout(tempo_text_inverso);
                procesarTexto();
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            texto_guardado = texto.innerText;
        
            //texto.innerText = "";
            texto.style.display = "none";
            texto.style.height = "";
            feedback_tiempo.style.color = color_positivo;
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
            limpiarDeteccionMultipalabraAsignada();
            palabra_actual = []; // Variable que almacena la palabra bonus actual.            
            // Desactiva, por seguridad, todos los modos.
            modo_texto_borroso = 0;
            desactivar_borrar = true;
            console.log(puntos)
            
            limpiarFeedbackFlotanteEscritora();
            
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
        if (!terminado && !partida_global_finalizada && puedeResucitarSegunEstado()) {
            iniciarMenu();
        } else if (!terminado) {
            esperando_resurreccion_tiempo = false;
            btnNo.click();
        }
        }
    }
});

socket.on("aumentar_tiempo_control", (data = {}) => {
    if (Number(data.player) !== Number(player)) return;
    activarFulgorCambioTiempoEscritora(data.secs);
});
  
function resucitar(){
    terminado = false;
    esperando_resurreccion_tiempo = false;
    permitir_fin_por_decision_local = false;
    desactivar_borrar = false;
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    ocultarUiResucitar({ emitirEstado: false });
    document.body.classList.remove('modo-resucitar');
    logo.style.display = "none"; 
    neon.style.display = "none"; 
    tiempo.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    tiempo.style.display = "";

    pararEscritura = true;
    stopConfetti();
    limpiarCountdownInicioEscritora();
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    if(temp_text_inverso_activado == true){
        clearTimeout(tempo_text_inverso);
        temp_text_inverso_activado = false;
        setInterfazInversaGlobal(false);
        procesarTexto();
    }

    texto.innerText = texto_guardado;
    texto.style.display = "";
    texto.style.height = "";
    feedback_tiempo.style.color = color_positivo;
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

        sendText()

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
socket.on("inicio", (data) => {
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    partida_global_finalizada = false;
    setInterfazInversaGlobal(false);
    permitir_fin_por_decision_local = false;
    esperando_resurreccion_tiempo = false;
    ocultarUiResucitar({ emitirEstado: false });
    limpiarCountdownInicioEscritora();
    post_inicio_pendiente_escritora = null;
    ultimo_tiempo_contador_segundos = null;
    ultimo_tiempo_contador_ms = 0;
    animateCSS(".cabecera", "backOutLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    // Comprueba que data.parametros existe y que el campo solicitado no es null/undefined
    if (player == 1) {
      if (data.parametros?.FRASE_FINAL_J1) {
        frase_final = data.parametros.FRASE_FINAL_J1.trim().toLowerCase();
      }
    } else if(player == 2) {
      if (data.parametros?.FRASE_FINAL_J2) {
        frase_final = data.parametros.FRASE_FINAL_J2.trim().toLowerCase();
      }
    }
    console.log("FRASE FINAL", data.parametros)
    console.log("FRASE FINAL", frase_final)
    limpieza();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR + ajustarDestreza(data.parametros.TIEMPO_MODIFICADOR, atributos['destreza']);
    actualizarDuracionNivelDesdeParametrosEscritora(data && data.parametros ? data.parametros : {});
    console.log(atributos);
    ajustarRapidez(rapidez_borrado, rapidez_inicio_borrado, atributos['agilidad'])
    secs_palabras = ajustarFuerza(SECS_BASE, atributos['fuerza'])
    desactivar_borrar = false;
    texto.style.height = "";

    logo.style.display = "none"; 
    neon.style.display = "none"; 
    texto.contentEditable= "false";
    tiempo.innerHTML = "";
    tiempo.style.display = "";
    setProgresoNivelBarraEscritora(0);
    iniciarSecuenciaIntroPartidaEscritora();

    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás.
    $('#countdown').remove();
    var preparados = $('<span id="countdown">&iquest;PREPARADOS?</span>');
    preparados.appendTo($('.container'));
    preparados_timer = setTimeout(() => {
        preparados_timer = null;
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        revelarEtapaIntroPartidaEscritora(1);
    }, 20);

    listener_cuenta_atras = setTimeout(() => {
    listener_cuenta_atras = null;
    var counter = 3;

    timer = setInterval(function() {

      $('#countdown').remove();

      var countdown = $('<span id="countdown">'+(counter === 0 ? '&iexcl;ESCRIBE!' : counter)+'</span>');
      countdown.appendTo($('.container'));
      if (counter === 3) {
        revelarEtapaIntroPartidaEscritora(2);
      } else if (counter === 2) {
        revelarEtapaIntroPartidaEscritora(3);
      }

      sub_timer = setTimeout(() => {
        if (counter > -1) {
          $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
        } else {
          $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        }
      }, 20);

      counter--;

      if (counter <= -1) {
        clearInterval(timer);
        timer = null;
        setTimeout(() => {
          clearTimeout(fallback_cuenta_atras_timer);
          fallback_cuenta_atras_timer = null;
          $('#countdown').remove();
          finalizarSecuenciaIntroPartidaEscritora();
        }, 1000);
      }
    }, 1000);
}, 1000);

    // Failsafe: evita que el contador se quede bloqueado en pantalla.
    fallback_cuenta_atras_timer = setTimeout(() => {
        limpiarCountdownInicioEscritora();
        finalizarSecuenciaIntroPartidaEscritora();
    }, 7000);
});
});

socket.on("post-inicio", (data) => {
    if (hayCountdownInicioActivoEscritora()) {
        post_inicio_pendiente_escritora = data || {};
        if (!listener_cuenta_atras && !timer && !secuencia_inicio_escritora_activa) {
            finalizarSecuenciaIntroPartidaEscritora();
        }
        return;
    }
    console.log(data && data.borrar_texto, "borrar texto");
    aplicarPostInicioEscritora(data && data.borrar_texto);
});    

socket.on("borrar_texto_guardado", () => {
    texto_guardado = "";
    sendText();
});

function post_inicio(borrar_texto){
    limpiarCountdownInicioEscritora();
        if (borrar_texto == false) {
            texto.innerText = texto_guardado.trim();

            sendText()

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
}

// Resetea el tablero de juego.
socket.on("limpiar", (borrar) => {
    partida_global_finalizada = true;
    detenerProgresoNivelBarraEscritora(true);
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on("nombre" + player, (data) => {
        nombre.value = data;
    });
    if(borrar == false){
        texto_guardado = texto.innerText;
    }
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    secuencia_inicio_escritora_activa = false;
    post_inicio_pendiente_escritora = null;
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);

    limpieza();
    document.body.classList.remove('partida-activa');
    actualizarOcultacionMarcadorEscritora();

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
});

socket.on("activar_modo", (data) => {
    const modoSiguiente = data && typeof data.modo_actual === "string" ? data.modo_actual : "";
    if (estaResurreccionActiva()) {
        // Si llega un modo nuevo, forzamos salida del estado de resurrección
        // para no bloquear la petición/recepción de palabras.
        esperando_resurreccion_tiempo = false;
        ocultarUiResucitar({ emitirEstado: false });
    }
    animacion_modo();
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");
    setProgresoNivelBarraEscritora(0);
    palabra.innerHTML = "";
    if (explicacion) {
        explicacion.innerHTML = "";
    }
    LIMPIEZAS[modo_actual](data);
    rapidez_borrado -= 100;
    rapidez_inicio_borrado -= 100;
    modo_actual = modoSiguiente;
    actualizarDuracionNivelDesdeParametrosEscritora(data || {});
    if(terminado == false){
    MODOS[modo_actual](data, socket);
    }
    if (modo_actual) {
        iniciarProgresoNivelBarraEscritora();
    } else {
        detenerProgresoNivelBarraEscritora(true);
    }
});

socket.on(enviar_palabra, data => {
    if (estaResurreccionActiva()) {
        return;
    }
    if(modo_actual == "palabras bonus"){
        recibir_palabra(data);
    }
});

socket.on('pausar_js', data => {
    es_pausa = true;
    LIMPIEZAS[modo_actual](data);
    tiempo_restante = TIEMPO_MODIFICADOR - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
});

socket.on('fin', data => {
    console.log(data)
    if(player == data){
        const finEnFraseFinal = modo_actual === "frase final";
        if (!permitir_fin_por_decision_local && !partida_global_finalizada && !finEnFraseFinal && (esperando_resurreccion_tiempo || puedeResucitarSegunEstado())) {
            return;
        }
        esperando_resurreccion_tiempo = false;
        ocultarUiResucitar();
        console.log("confetti_auxAAXACASCASCASCAS")
        final();
        permitir_fin_por_decision_local = false;
    }
});

socket.on('reanudar_js', data => {
    es_pausa = false;
    reanudar();
});

socket.on(inspirar, data => {
    if (estaResurreccionActiva()) {
        return;
    }
    const palabra = typeof data === "string" ? data : data?.palabra;
    const musa_nombre = (data && typeof data === "object") ? (data.musa_nombre || data.musa) : "";
    if (palabra != "") {
        palabra_actual = [palabra];
        const musaLabel = musa_nombre ? escapeHtml(musa_nombre) : "MUSA";
        definicion.innerHTML = (`<span style='color: orange;'>${musaLabel}</span>` +
        "<span style='color: white;'>: </span>" +
        "<span style='color: white;'>Podrías escribir la palabra «</span>" +
        "<span style='color: lime; text-decoration: underline;'>" + escapeHtml(palabra) +
        "</span><span style='color: white;'>»</span>");
        establecerContextoMusaDefinicion("musa", musa_nombre);
        animateCSS(".definicion", "flash");
        prepararDeteccionMultipalabraAsignada();
        asignada = true;
        texto.removeEventListener("keyup", listener_modo1);
        listener_modo1 = function (e) { palabras_musas(e) };
        texto.addEventListener("keyup", listener_modo1);
    }
});

socket.on(enviar_ventaja, ventaja => {
    mostrarFeedbackFlotanteEscritora(`${ventaja} DESVENTAJA!`, {
        tipo: "negativo",
        color: color_negativo
    });
    console.log(ventaja);
    PUTADAS[ventaja]();
});

socket.on("enviar_repentizado", repentizado => {

    if(terminado == false){
        //temas.innerHTML = "⚠️ "+ repentizado + " ⚠️";
        //efectoMaquinaDeEscribir(texto, repentizado, 150);
        //animateCSS(".temas", "flash")
    }
    
    });

socket.on("nueva letra", letra => {
    palabra_actual = []
    limpiarDeteccionMultipalabraAsignada();
    definicion.innerHTML = "";
    establecerContextoMusaDefinicion("");
    if(modo_actual == "letra prohibida"){
        letra_prohibida = letra;

        texto.removeEventListener("keydown", listener_modo);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("keydown", listener_modo);
        animacion_palabra();
        setBarraNivelClaseEscritora("prohibida");
        if (explicacion) {
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        }
        palabra.innerHTML = "NIVEL LETRA PROHIBIDA";
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = letra;
        texto.removeEventListener("keydown", listener_modo);
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("keydown", listener_modo);
        animacion_palabra();
        setBarraNivelClaseEscritora("bendita");
        if (explicacion) {
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("bendita", letra_bendita);
        }
        palabra.innerHTML = "NIVEL LETRA BENDITA";
    }
});


socket.on(elegir_ventaja, () => {
    confetti_musas();
});

function recibir_palabra(data) {
    if (estaResurreccionActiva()) {
        return;
    }
    animacion_modo();
    palabra_actual = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[0] : "";
    setBarraNivelClaseEscritora("bonus");
    const textoPalabra = extraerTextoPalabraEventoEscritora(data);
    palabra.innerHTML = "NIVEL PALABRAS BONUS";
    if (data.origen_musa === "musa") {
        const musaLabel = data.musa_nombre ? String(data.musa_nombre) : "MUSA";
        const descripcion = `${musaLabel}: Podrías escribir esta palabra`;
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "bonus",
            tiempoSegundos: data.tiempo_palabras_bonus,
            descripcion
        });
        establecerContextoMusaDefinicion("musa", data.musa_nombre);
    } else {
        const descripcionBase = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[1] : data && data.definicion;
        const descripcion = normalizarTextoPlanoEscritora(descripcionBase);
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "bonus",
            tiempoSegundos: data.tiempo_palabras_bonus,
            descripcion
        });
        establecerContextoMusaDefinicion("");
    }

    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    prepararDeteccionMultipalabraAsignada();
    asignada = true;
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto.addEventListener("keyup", listener_modo);
}

function recibir_palabra_prohibida(data) {
    if (estaResurreccionActiva()) {
        return;
    }
    animacion_modo();
    palabra_actual = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[0] : "";
    setBarraNivelClaseEscritora("prohibidas");
    const textoPalabra = extraerTextoPalabraEventoEscritora(data);
    palabra.innerHTML = "NIVEL PALABRAS PROHIBIDAS";

    if (data.origen_musa === "musa_enemiga") {
        const musaLabel = data.musa_nombre ? String(data.musa_nombre) : "MUSA ENEMIGA";
        const descripcion = `${musaLabel}: me pega esta palabra`;
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "prohibidas",
            tiempoSegundos: data.tiempo_palabras_bonus,
            descripcion
        });
        establecerContextoMusaDefinicion("musa_enemiga", data.musa_nombre);
    } else {
        const descripcionBase = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[1] : data && data.definicion;
        const descripcion = normalizarTextoPlanoEscritora(descripcionBase);
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "prohibidas",
            tiempoSegundos: data.tiempo_palabras_bonus,
            descripcion
        });
        establecerContextoMusaDefinicion("");
    }
    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    prepararDeteccionMultipalabraAsignada();
    asignada = true;
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
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
      const btnInicio = document.getElementById('btnInicio');
      const mainMenuButtons = [btnSi, btnNo];
      let mainMenuIndex = 0;
  
      const quantityDisplay = document.getElementById('quantityDisplay');
      const btnConfirmar = document.getElementById('btnConfirmar');
      const btnAtras = document.getElementById('btnAtras');
      let quantityMenuElements = [btnConfirmar, btnAtras];
      let quantityMenuIndex = 0;
  
      let palabras = 1;
      const PALABRAS_A_SEGUNDOS = 3;
      let currentMenu = 'main';

      function contarPalabrasTexto(textoBase) {
        const matches = (textoBase || "").match(/\b\w+\b/g);
        return matches ? matches.length : 0;
      }

      function obtenerPalabrasDisponiblesResucitar() {
        const palabrasGuardadas = contarPalabrasTexto(texto_guardado);
        const palabrasActuales = texto && typeof texto.innerText === "string"
          ? contarPalabrasTexto(texto.innerText)
          : 0;
        return Math.max(palabrasGuardadas, palabrasActuales);
      }

      function puedeResucitarSegunEstado() {
        return !partida_global_finalizada && obtenerPalabrasDisponiblesResucitar() > 0;
      }

      function estaResurreccionActiva() {
        return Boolean(esperando_resurreccion_tiempo || (document.body && document.body.classList.contains('modo-resucitar')));
      }

      function ajustarPalabrasResucitar() {
        const max = obtenerPalabrasDisponiblesResucitar();
        const min = max > 0 ? 1 : 0;
        if (palabras < min) palabras = min;
        if (palabras > max) palabras = max;
        return { max, min };
      }

      function configurarResurreccionObligatoria(activa) {
        resurreccion_obligatoria_activa = Boolean(activa);
        if (btnAtras) {
          btnAtras.style.display = resurreccion_obligatoria_activa ? 'none' : '';
        }
        quantityMenuElements = resurreccion_obligatoria_activa
          ? [btnConfirmar]
          : [btnConfirmar, btnAtras];
        quantityMenuElements = quantityMenuElements.filter(Boolean);
        if (!quantityMenuElements.length) {
          quantityMenuIndex = 0;
          return;
        }
        if (quantityMenuIndex >= quantityMenuElements.length || quantityMenuIndex < 0) {
          quantityMenuIndex = 0;
        }
      }

      function emitirEstadoResucitar(menuForzado = null) {
        if (!socket || typeof socket.emit !== "function") return;
        const { max } = ajustarPalabrasResucitar();
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        const menu = menuForzado || currentMenu;
        const visible = menu === "main"
          ? (mainMenu && mainMenu.style.display !== "none")
          : menu === "quantity"
            ? (quantityMenu && quantityMenu.style.display !== "none")
            : false;
        socket.emit("resucitar_menu", {
          player: playerNumber,
          menu,
          visible,
          mainIndex: mainMenuIndex,
          quantityIndex: quantityMenuIndex,
          palabras,
          max,
          segundos
        });
      }

      function ocultarUiResucitar({ emitirEstado = true } = {}) {
        clearTimeout(timeoutID_menu);
        timeoutID_menu = null;
        esperando_resurreccion_tiempo = false;
        configurarResurreccionObligatoria(false);
        currentMenu = 'main';
        mainMenuIndex = 0;
        quantityMenuIndex = 0;
        if (mainMenu) {
          mainMenu.style.display = 'none';
        }
        if (quantityMenu) {
          quantityMenu.style.display = 'none';
        }
        if (mainTitle) {
          mainTitle.style.display = 'none';
        }
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
        document.body.classList.remove('modo-resucitar');
        document.removeEventListener('keydown', manejadorTeclas);
        if (emitirEstado) {
          emitirEstadoResucitar('hidden');
        }
      }
  
      /*************************************************************
        ACTUALIZACIONES DE ESTADO VISUAL
      **************************************************************/
        function toggleFullscreen() {
            if (isFullscreen) {
              // Salir de pantalla completa
              if (document.exitFullscreen) {
                document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
              }
              isFullscreen = false;
            } else {
              // Entrar en pantalla completa
              const elem = document.documentElement;
              if (elem.requestFullscreen) {
                elem.requestFullscreen();
              } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
              } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
              }
              isFullscreen = true;
            }
          }
      
          // ------------------------------------------------------
          // 3) FUNCIÓN PRINCIPAL: INICIO DEL JUEGO
          // ------------------------------------------------------
          function inicioJuego() {
            animateCSS(".atributos", "backOutLeft")
              .then(() => {
                      // Creamos un nuevo elemento <style>
                const style = document.createElement('style');
                style.id = 'style-ocultar-cursor'; 
                // Añadimos !important para asegurar que se aplique por encima de cualquier otro cursor
                style.textContent = `* { cursor: none !important; }`;

                // Insertamos la regla en el <head> del documento
                document.head.appendChild(style);
                document.getElementById('atributos-container').style.display = "none";
              contenedor.style.display = "flex";
              btnInicio.style.display = "none";
              document.getElementById('total').style.display = "none";
              document.body.classList.add('partida-activa');
              actualizarOcultacionMarcadorEscritora();
              animateCSS(".contenedor", "backInLeft");
      
                // Ponemos FULLSCREEN inmediatamente al iniciar
                toggleFullscreen();
      
                // Foco en el textarea
                texto.focus();
      
                // Listener global para alternar fullscreen con click si procede
                socket.emit("enviar_atributos", {player, atributos});
                document.addEventListener('click', function(event) {
                  // Sólo si no estamos en un menú de modificadores
                  if (!menu_modificador && modificadorButtons.length === 0 && !vista_calentamiento_escritor) {
                    if (event.button === 0) {       // click izquierdo
                      toggleFullscreen();
                      texto.focus();
                    }
                  }
                });
              });
          }
        function actualizarSeleccionMainMenu() {
        mainMenuButtons.forEach(btn => btn.classList.remove('selected'));
        mainMenuButtons[mainMenuIndex].classList.add('selected');
        mainMenuButtons[mainMenuIndex].focus();
        emitirEstadoResucitar();
      }
  
      function actualizarSeleccionQuantityMenu(enfocar = true) {
        if (!quantityMenuElements.length) return;
        if (quantityMenuIndex >= quantityMenuElements.length || quantityMenuIndex < 0) {
          quantityMenuIndex = 0;
        }
        quantityMenuElements.forEach(el => el.classList.remove('selected'));
        const seleccionado = quantityMenuElements[quantityMenuIndex];
        if (seleccionado) {
          seleccionado.classList.add('selected');
        }
        emitirEstadoResucitar();
        if (!enfocar) return;
        if (resurreccion_obligatoria_activa) {
          btnConfirmar.focus();
          return;
        }
        if (quantityMenuIndex === 0 && btnConfirmar) btnConfirmar.focus();
        if (quantityMenuIndex === 1 && btnAtras) btnAtras.focus();
      }
  
      function actualizarTextoCantidad() {
        const { max } = ajustarPalabrasResucitar();
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        quantityDisplay.innerHTML = `
          <div class="resucitar-stepper" aria-hidden="true">
            <div id="resucitarArrowUp" class="resucitar-stepper-arrow">&uarr;</div>
            <div id="resucitarArrowDown" class="resucitar-stepper-arrow">&darr;</div>
          </div>
          <div class="resucitar-metric">
            <span class="resucitar-label">Palabras</span>
            <span class="resucitar-value resucitar-pop palabras">${palabras}</span>
            <span class="resucitar-max">MAX ${max}</span>
          </div>
          <div class="resucitar-arrow">→</div>
          <div class="resucitar-metric">
            <span class="resucitar-label">Segundos</span>
            <span class="resucitar-value resucitar-pop segundos">${segundos}</span>
          </div>
        `;
        emitirEstadoResucitar();
      }

      function activarIndicadorConversor(direccion, esLimite) {
        const flecha = direccion === 'up'
          ? document.getElementById('resucitarArrowUp')
          : document.getElementById('resucitarArrowDown');
        if (!flecha) return;
        flecha.classList.remove('activo', 'limite');
        void flecha.offsetWidth;
        flecha.classList.add('activo');
        if (esLimite) {
          flecha.classList.add('limite');
        }
        flecha.addEventListener('animationend', () => {
          flecha.classList.remove('activo', 'limite');
        }, { once: true });
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

      function mostrarMenuQuantity({ obligatoria = false } = {}) {
        configurarResurreccionObligatoria(obligatoria);
        mainMenu.style.display = 'none';
        quantityMenu.style.display = 'block';
        document.body.classList.add('modo-resucitar');
        currentMenu = 'quantity';
        quantityMenuIndex = 0;
        actualizarTextoCantidad();
        actualizarSeleccionQuantityMenu();
        emitirEstadoResucitar();
      }
  
      function mostrarMenuPrincipal() {
        configurarResurreccionObligatoria(false);
        quantityMenu.style.display = 'none';
        mainMenu.style.display = 'block';
        document.body.classList.add('modo-resucitar');
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        emitirEstadoResucitar();
      }

      function iniciarMenu() {
        if (!puedeResucitarSegunEstado()) {
          esperando_resurreccion_tiempo = false;
          btnNo.click();
          return;
        }
        if (!texto_guardado && texto && typeof texto.innerText === "string") {
          texto_guardado = texto.innerText;
        }
        clearTimeout(timeoutID_menu);
        permitir_fin_por_decision_local = false;
        esperando_resurreccion_tiempo = true;
        console.log("Iniciando menu de resurreccion obligatoria");
        document.removeEventListener('keydown', manejadorTeclas);
        document.addEventListener('keydown', manejadorTeclas);
        if (mainTitle) {
          mainTitle.style.display = 'none';
        }
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
        mostrarMenuQuantity({ obligatoria: true });
        animateCSS("#quantityMenu", "flash");
      }
  
      /*************************************************************
        EVENTOS DE CLICK PARA LOS BOTONES CON stopPropagation()
      **************************************************************/

    btnInicio.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se active el listener global
        inicioJuego();
        });
      btnSi.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se active el listener global
        if (!puedeResucitarSegunEstado()) {
          esperando_resurreccion_tiempo = false;
          btnNo.click();
          return;
        }
        esperando_resurreccion_tiempo = true;
        mostrarMenuQuantity({ obligatoria: true });
      });
  
      btnNo.addEventListener('click', (evento) => {
        
        evento.stopPropagation();
        permitir_fin_por_decision_local = true;
        esperando_resurreccion_tiempo = false;
        document.body.classList.remove('modo-resucitar');
        texto.innerText = texto_guardado;
        tiempo.style.color = "white";
        if (terminado == false) {
            socket.emit('fin_de_player', player)
          final();
          setTimeout(function () {
            texto.style.height = "";
            texto.rows = "1";
            texto.style.display = "none";
            //texto.innerText = texto_guardado;
            sendText();
            tiempo.style.color = "white";
          }, 2000);
        }
        animateCSS(".tiempo", "bounceInLeft");
        tiempo.innerHTML = "¡GRACIAS POR JUGAR!";
        actualizarBarraVida(tiempo, tiempo.innerHTML);
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
        ocultarUiResucitar();
                
        // Lógica para finalizar el juego.
      });
      
  
      btnConfirmar.addEventListener('click', (evento) => {
        evento.stopPropagation();
        clearTimeout(timeoutID_menu);
        timeoutID_menu = null;
        esperando_resurreccion_tiempo = false;
        permitir_fin_por_decision_local = false;
        socket.emit("resucitar", {player: player, secs: palabras * PALABRAS_A_SEGUNDOS});

        // Recortar las últimas "palabras" de "texto_guardado"
        console.log("texto_guardado", palabras);
        console.log("texto_guardado", texto_guardado);

        texto_guardado = recortarUltimasPalabras(texto_guardado, palabras);

        console.log("texto_guardado", texto_guardado);

        // Ocultar los menús para que no se vean más
        resucitar()
        ocultarUiResucitar();

        post_inicio(false)
      });
  
      btnAtras.addEventListener('click', (evento) => {
        evento.stopPropagation();
        if (resurreccion_obligatoria_activa) {
          quantityMenuIndex = 0;
          actualizarSeleccionQuantityMenu();
          return;
        }
        quantityMenu.style.display = 'none';
        mainMenu.style.display = 'block';
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        if (mainTitle) {
          mainTitle.style.display = 'block';
        }
        if (buttonContainer) {
          buttonContainer.style.display = 'flex';
        }
        emitirEstadoResucitar();
      });

      btnConfirmar.addEventListener('focus', () => {
        quantityMenuIndex = 0;
        actualizarSeleccionQuantityMenu(false);
      });

      btnAtras.addEventListener('focus', () => {
        quantityMenuIndex = 1;
        actualizarSeleccionQuantityMenu(false);
      });
  
      /*************************************************************
        EVENTO DE TECLAS: FLECHAS Y ENTER
      **************************************************************/
      // Definimos la función manejadora de eventos de teclado.
function manejadorTeclas(evento) {
    const tecla = (evento.key === 'Enter' || evento.code === 'NumpadEnter')
      ? 'Enter'
      : evento.key;
    evento.stopPropagation();
    if (currentMenu === 'main') {
      switch (tecla) {
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
      switch (tecla) {
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
          evento.preventDefault();
          {
            const limites = ajustarPalabrasResucitar();
            let esLimite = false;
            if (palabras < limites.max) {
              palabras++;
              actualizarTextoCantidad();
              esLimite = palabras >= limites.max;
            } else {
              esLimite = true;
            }
            activarIndicadorConversor('up', esLimite);
          }
          break;
        case 'ArrowDown':
          evento.preventDefault();
          {
            const limites = ajustarPalabrasResucitar();
            let esLimite = false;
            if (palabras > limites.min) {
              palabras--;
              actualizarTextoCantidad();
              esLimite = palabras <= limites.min;
            } else {
              esLimite = true;
            }
            activarIndicadorConversor('down', esLimite);
          }
          break;
        case 'Enter':
          evento.preventDefault();
          {
            if (resurreccion_obligatoria_activa) {
              btnConfirmar.click();
              break;
            }
            if (document.activeElement === btnAtras || quantityMenuIndex === 1) {
              btnAtras.click();
            } else if (document.activeElement === btnConfirmar || quantityMenuIndex === 0) {
              btnConfirmar.click();
            } else {
              btnConfirmar.click();
            }
          }
          break;
        default:
          break;
      }
    }
  }

// Función para enviar texto al otro jugador y a control
function sendText() {
    let text = texto.innerHTML;
    let points = puntos.innerHTML;
    const caretInfo = obtenerCaretInfo(texto);
    socket.emit(texto_x, {
        text,
        points,
        caretPos: caretInfo.caretPos,
        caretLine: caretInfo.caretLine,
        caretRatio: caretInfo.caretRatio,
        caretPath: caretInfo.caretPath,
        caretOffset: caretInfo.caretOffset,
        texto_guardado
    });
}

const TAGS_SALTO_LINEA = new Set(["BR", "DIV", "P", "LI"]);

function obtenerTextoPlanoConSaltos(elemento) {
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
    recorrer(elemento, true);
    return texto;
}

function contarCaretConSaltos(elemento, range) {
    let caretPos = 0;
    let caretLine = 0;
    let encontrado = false;

    function agregarTexto(texto) {
        caretPos += texto.length;
        caretLine += (texto.match(/\n/g) || []).length;
    }

    function agregarSalto() {
        caretPos += 1;
        caretLine += 1;
    }

    function recorrer(nodo, esRaiz) {
        if (encontrado) return;
        if (nodo === range.startContainer) {
            if (nodo.nodeType === Node.TEXT_NODE) {
                agregarTexto(nodo.textContent.slice(0, range.startOffset));
                encontrado = true;
                return;
            }
            if (nodo.nodeType === Node.ELEMENT_NODE) {
                const hijos = nodo.childNodes || [];
                const limite = Math.min(range.startOffset, hijos.length);
                for (let i = 0; i < limite; i++) {
                    recorrer(hijos[i], false);
                    if (encontrado) return;
                }
                encontrado = true;
                return;
            }
        }
        if (nodo.nodeType === Node.TEXT_NODE) {
            agregarTexto(nodo.textContent);
            return;
        }
        if (nodo.nodeType !== Node.ELEMENT_NODE) return;
        const tag = nodo.tagName;
        if (tag === "BR") {
            agregarSalto();
            return;
        }
        const hijos = nodo.childNodes;
        if (!hijos || hijos.length === 0) {
            if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
                agregarSalto();
            }
            return;
        }
        for (let i = 0; i < hijos.length; i++) {
            recorrer(hijos[i], false);
            if (encontrado) return;
        }
        if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
            agregarSalto();
        }
    }

    recorrer(elemento, true);
    return { caretPos, caretLine };
}

function obtenerIndiceCaretEnTexto(elemento) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
        return obtenerTextoPlanoConSaltos(elemento).length;
    }
    const range = sel.getRangeAt(0);
    if (!elemento.contains(range.startContainer)) {
        return obtenerTextoPlanoConSaltos(elemento).length;
    }
    return contarCaretConSaltos(elemento, range).caretPos;
}

function obtenerCaretInfo(elemento) {
    const textoPlano = obtenerTextoPlanoConSaltos(elemento);
    const totalChars = textoPlano.length;
    let caretPos = totalChars;
    let caretLine = (textoPlano.match(/\n/g) || []).length;
    let caretPath = null;
    let caretOffset = 0;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (elemento.contains(range.startContainer)) {
            const conteo = contarCaretConSaltos(elemento, range);
            caretPos = conteo.caretPos;
            caretLine = conteo.caretLine;
            caretPath = obtenerRutaNodo(elemento, range.startContainer);
            caretOffset = range.startOffset;
        }
    }
    ultimoCaretRatio = totalChars > 0
        ? Math.max(0, Math.min(caretPos / totalChars, 1))
        : ultimoCaretRatio;
    return {
        caretPos,
        caretLine,
        caretRatio: ultimoCaretRatio,
        caretPath,
        caretOffset
    };
}

let rafEnvioCaret = null;
let ultimoCaretRatio = 0;

function obtenerRutaNodo(raiz, nodo) {
    const ruta = [];
    let actual = nodo;
    while (actual && actual !== raiz) {
        const padre = actual.parentNode;
        if (!padre) break;
        const indice = Array.prototype.indexOf.call(padre.childNodes, actual);
        ruta.unshift(indice);
        actual = padre;
    }
    return actual === raiz ? ruta : null;
}

function solicitarEnvioCaret() {
    if (rafEnvioCaret) return;
    rafEnvioCaret = requestAnimationFrame(() => {
        rafEnvioCaret = null;
        const caretInfo = obtenerCaretInfo(texto);
        socket.emit(texto_x, {
            text: texto.innerHTML,
            points: puntos.innerHTML,
            caretPos: caretInfo.caretPos,
            caretLine: caretInfo.caretLine,
            caretRatio: caretInfo.caretRatio,
            caretPath: caretInfo.caretPath,
            caretOffset: caretInfo.caretOffset,
            texto_guardado
        });
    });
}

document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!texto.contains(sel.anchorNode)) return;
    solicitarEnvioCaret();
});

function activar_sockets_extratextuales() {
    // Recibe el nombre del jugador x y lo coloca en su sitio.
    socket.on("nombre" + player, (data) => {
        nombre.value = data;
    });

    //Recibe los temas (que elige Espectador) y los coloca en su sitio.
    socket.on("recibe_temas", (data) => {
        temas.innerHTML = data;
    });
    
    socket.on("recibir_comentario", (data) => {
        console.log(data)
        temas.innerHTML = data;
    });
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
            if (!node) {
                resolve("Element not found");
                return;
            }

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
    animateCSS("#palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

function animacion_palabra() {
    const animateCSS = (element, animation, prefix = "animate__") =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);
            if (!node) {
                resolve("Element not found");
                return;
            }

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    animateCSS("#palabra", "bounceInLeft");
}

// Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
function restablecer_estilo() {
    texto.style.color = "white";
    document.body.style.backgroundColor = "black";
}

//Función auxiliar que comprueba que se inserta la palabra bonus.
function modo_palabras_bonus(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
        if (!selection || !selection.rangeCount) return;
        let range = selection.getRangeAt(0);
        let preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        let endingIndex = preCaretRange.toString().length;
        let startingIndex = 0; // Inicializacion
        const textContent = e.target.textContent || "";
        const objetivos = obtenerObjetivosPalabraActual();
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

        const tokenActual = textContent.substring(startingIndex, endingIndex);
        const tokenLower = tokenActual.toLowerCase();
        const coincidenciaMultipalabra = detectarInsercionMultipalabra(textContent);
        const palabraDetectadaToken = objetivos.find((objetivo) =>
            tokenLower.includes((objetivo || "").toLowerCase())
        );

        console.log("Texto seleccionado:", tokenActual); // Debugging
        console.log("palabra_actual:", palabra_actual); // Debugging
        console.log("Indices:", startingIndex, endingIndex); // Debugging

        if (coincidenciaMultipalabra || palabraDetectadaToken) {
            texto.focus();
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            socket.emit("nueva_palabra", player);
            emitirCambioTiempoEscritora(tiempo_palabras_bonus);
            const color = color_positivo;
            const tiempo_feed = "+" + tiempo_palabras_bonus + " segs.";
            const tipo = (definicion.dataset.origenMusa === "musa") ? "inspiracion" : "rae";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo });
            const payloadFeedback = (tipo === "inspiracion")
                ? construirPayloadFeedbackInspiracion({ color, tiempo_feed, tipo })
                : { color, tiempo_feed, tipo };
            socket.emit(feedback_de_j_x, payloadFeedback);
            if (tipo === "inspiracion") {
                activarFulgorInspiracionEscritora();
                socket.emit("feedback_musa_inspiracion", { ...payloadFeedback, player });
            }

            let inicioMarca = startingIndex;
            let finMarca = endingIndex;
            if (coincidenciaMultipalabra) {
                inicioMarca = coincidenciaMultipalabra.inicio;
                finMarca = coincidenciaMultipalabra.fin;
            } else {
                const palabraLower = (palabraDetectadaToken || "").toLowerCase();
                let indiceMatch = -1;
                if (palabraLower) {
                    indiceMatch = tokenLower.lastIndexOf(palabraLower);
                }
                inicioMarca = indiceMatch >= 0
                    ? startingIndex + indiceMatch
                    : startingIndex;
                finMarca = indiceMatch >= 0
                    ? inicioMarca + palabraLower.length
                    : endingIndex;
            }

            const esMusa = definicion?.dataset?.origenMusa === "musa";
            marcarPalabraBenditaActual(inicioMarca, finMarca, esMusa);
            countChars(texto);
            sendText();
        }
    }
}

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
            const palabraEncontrada = Array.isArray(palabra_actual)
                ? palabra_actual.find(palabra => textContent
                    .substring(startingIndex, endingIndex)
                    .toLowerCase()
                    .includes((palabra || "").toLowerCase()))
                : palabra_actual;
            const palabraReportada = palabraEncontrada || textContent.substring(startingIndex, endingIndex);
            socket.emit("intento_prohibido", { player, tipo: "palabra", valor: palabraReportada });
            texto.focus();
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            socket.emit("nueva_palabra_prohibida", player);
            tiempo_palabras_bonus = -tiempo_palabras_bonus;
            emitirCambioTiempoEscritora(tiempo_palabras_bonus);
            const color = color_negativo;
            const tiempo_feed = String(tiempo_palabras_bonus) + " segs.";
            const tipo = (definicion.dataset.origenMusa === "musa_enemiga") ? "inspiracion" : "lista_prohibidas";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo });
            const payloadFeedback = (tipo === "inspiracion")
                ? construirPayloadFeedbackInspiracion({ color, tiempo_feed, tipo })
                : { color, tiempo_feed, tipo };
            socket.emit(feedback_de_j_x, payloadFeedback);
            if (tipo === "inspiracion") {
                activarFulgorInspiracionEscritora();
                socket.emit("feedback_musa_inspiracion", { ...payloadFeedback, player });
            }
        }
    }
}

function palabras_musas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
        if (!selection || !selection.rangeCount) return;
        let range = selection.getRangeAt(0);
        let preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        let endingIndex = preCaretRange.toString().length;
        let startingIndex = 0; // Inicializacion
        const textContent = e.target.textContent || "";
        const objetivos = obtenerObjetivosPalabraActual();

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

        const tokenActual = textContent.substring(startingIndex, endingIndex);
        const tokenLower = tokenActual.toLowerCase();
        const coincidenciaMultipalabra = detectarInsercionMultipalabra(textContent);
        const palabraEncontrada = coincidenciaMultipalabra
            ? coincidenciaMultipalabra.objetivo
            : objetivos.find((objetivo) => tokenLower.includes((objetivo || "").toLowerCase()));

        console.log("Texto seleccionado:", tokenActual); // Debugging
        console.log("palabra_actual:", palabra_actual); // Debugging
        console.log("Indices:", startingIndex, endingIndex); // Debugging

        if (coincidenciaMultipalabra || palabraEncontrada) {

            definicion.innerHTML = "";
            texto.focus();
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            const tiempo_feed = "+insp.";
            const color = "white";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo: "inspiracion" });
            socket.emit("nueva_palabra_musa", player);
            socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "inspiracion" });
            activarFulgorInspiracionEscritora();

            let inicioMarca = startingIndex;
            let finMarca = endingIndex;
            if (coincidenciaMultipalabra) {
                inicioMarca = coincidenciaMultipalabra.inicio;
                finMarca = coincidenciaMultipalabra.fin;
            } else {
                const palabraLower = (palabraEncontrada || "").toLowerCase();
                let indiceMatch = -1;
                if (palabraLower) {
                    indiceMatch = tokenLower.lastIndexOf(palabraLower);
                }
                inicioMarca = indiceMatch >= 0
                    ? startingIndex + indiceMatch
                    : startingIndex;
                finMarca = indiceMatch >= 0
                    ? inicioMarca + palabraLower.length
                    : endingIndex;
            }

            if (marcarPalabraMusaActual(inicioMarca, finMarca)) {
                countChars(texto);
                sendText();
            }
        }
    }
}

function modo_letra_prohibida(e) {
    let letra = e.key;  // Captura la letra tecleada
  
    if (
      toNormalForm(letra) === letra_prohibida || 
      toNormalForm(letra) === letra_prohibida.toUpperCase()
    ) {
      e.preventDefault();  // Evita el comportamiento predeterminado del evento de tecla
      const letraReportada = letra_prohibida || letra;
      socket.emit("intento_prohibido", { player, tipo: "letra", valor: letraReportada });
    /*
      let sel = window.getSelection();
      let range = sel.getRangeAt(0);
  
      // Crea un nodo de texto para la letra
      let textNode = document.createTextNode(letra);
  
      // Crea un span con la clase para el color y coloca el nodo de texto dentro
      let span = document.createElement("span");
      span.className = "letra-roja";
      span.appendChild(textNode);
  
      // Crea nodos de texto vacíos para actuar como delimitadores
      let emptyTextNodeBefore = document.createTextNode("");
      let emptyTextNodeAfter = document.createTextNode("");
  
      // Inserta los nodos en el DOM
      range.insertNode(emptyTextNodeBefore);
      range.insertNode(span);
      range.insertNode(emptyTextNodeAfter);
  
      // Mueve el cursor a la derecha del nodo span
      range.setStartAfter(span);
      range.setEndAfter(span);
      sel.removeAllRanges();
      sel.addRange(range);
  
      // Borra el span después de medio segundo
      setTimeout(() => {
        span.parentNode.removeChild(span);
      }, 100);
      */

      // Actualiza otros aspectos de la UI y envía eventos a través de Socket.io
      // Aquí iría la lógica para manejar la UI y eventos de Socket.io (la he mantenido igual)
      secs = -2;
      console.log(secs);
      emitirCambioTiempoEscritora(secs);
      actualizarPuntosMarcador(puntos_ + " palabras");
      sendText();
      const tiempo_feed = "-2 segs.";
      const color = color_negativo;
      mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo: "letra_prohibida" });
      socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "letra_prohibida" });
    }
  }
  
  // Esta función se llama cuando se presiona una tecla
function modo_letra_bendita(e) {
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }

    if (bloquear_borrado_putada && e.key === 'Backspace') {
        e.preventDefault();
        return;
    }

    let letra = e.key; // Captura la letra tecleada
    let sel = window.getSelection();
    let range = sel.getRangeAt(0);
    let node = sel.anchorNode;

    // Añadido: Procesar tecla Backspace
    if (e.key === 'Backspace') {
        console.log('Node:', node);
        console.log('Parent Node:', node.parentNode);
        console.log('Parent Node class:', node.parentNode ? node.parentNode.className : 'No parent node');
        console.log('Focus Offset:', sel.focusOffset);

        if (node && node.parentNode.className === 'letra-verde' && sel.focusOffset === 0) {
            e.preventDefault(); // Prevenir el comportamiento por defecto de la tecla Backspace
            secs = -2
            emitirCambioTiempoEscritora(secs); // Emitir el evento de socket
            // Feedback visual
            const tiempo_feed = "-1 segs.";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color: color_negativo, tipo: "letra_bendita" });
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed, tipo: "letra_bendita" });
        }
        return; // Salir de la función si la tecla es Backspace
    }

    if (letra.length === 1) {
        if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
            (letra_bendita === "ñ" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
            e.preventDefault();
            console.log('Se procesa letra bendita');

            let textNode = document.createTextNode(letra);
            let span = document.createElement("span");
            span.className = "letra-verde";
            span.setAttribute("contenteditable", "false");
            span.appendChild(textNode);

            let emptyTextNodeBefore = document.createTextNode("");
            let emptyTextNodeAfter = document.createTextNode("");

            range.insertNode(emptyTextNodeBefore);
            range.insertNode(span);
            range.insertNode(emptyTextNodeAfter);

            range.setStartBefore(emptyTextNodeBefore);
            range.setEndBefore(emptyTextNodeBefore);
            sel.removeAllRanges();
            sel.addRange(range);
            secs = 2;
            emitirCambioTiempoEscritora(secs);
            actualizarPuntosMarcador(puntos_ + " palabras");
            console.log(puntos);
            sendText();

            // Feedback visual
            const tiempo_feed = "+2 segs.";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color: color_positivo, tipo: "letra_bendita" });
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed, tipo: "letra_bendita" });
        } else {
            if (node && node.parentNode.className === 'letra-verde') {
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
    // Aquí podrías añadir más comportamientos para otras teclas no imprimibles si lo consideras necesario
}


  

function modo_psicodélico() {
    stylize();
}

function limpieza(){
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    setInterfazInversaGlobal(false);
    pararEscritura = true;
    permitir_fin_por_decision_local = false;
    esperando_resurreccion_tiempo = false;
    ocultarUiResucitar({ emitirEstado: false });
    stopConfetti();
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    secuencia_inicio_escritora_activa = false;
    post_inicio_pendiente_escritora = null;
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    console.log(texto.innerHTML)
    if(temp_text_inverso_activado == true){
        temp_text_inverso_activado = false;
        setInterfazInversaGlobal(false);
        clearTimeout(tempo_text_inverso);
        procesarTexto();
    }

    texto.innerText = "";
    texto.style.display = "";
    texto.style.height = "";
    feedback_tiempo.style.color = color_positivo;
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    texto.contentEditable= "false";
    actualizarPuntosMarcador(0, false);
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
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
    limpiarDeteccionMultipalabraAsignada();
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    console.log(puntos)
    
    limpiarFeedbackFlotanteEscritora();
    
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    caracteres_seguidos = 0;
    
    for (let key in LIMPIEZAS) { 
        console.log(key)
        LIMPIEZAS[key]();
    }

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    clearTimeout(tempo_text_borroso);
}

function limpieza_final(){
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    setInterfazInversaGlobal(false);
    permitir_fin_por_decision_local = false;
    esperando_resurreccion_tiempo = false;
    ocultarUiResucitar({ emitirEstado: false });
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    secuencia_inicio_escritora_activa = false;
    post_inicio_pendiente_escritora = null;
    confetti_aux();
    texto.contentEditable= "false";
    texto.style.display = "none";
    temas.display = "none";
    temas.innerHTML = "";
    limpiarFeedbackFlotanteEscritora();
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");

    definicion.style.fontSize = "1.5vw";

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    limpiarDeteccionMultipalabraAsignada();
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.

    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;

    tiempo.style.color = "white";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    LIMPIEZAS["psicodélico"]("");

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    //clearTimeout(tempo_text_borroso);
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
        
        sendText();
        temp_text_inverso_activado = true;
        setInterfazInversaGlobal(true);
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            setInterfazInversaGlobal(false);
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
        sendText()  
        }, TIEMPO_MODIFICADOR);
    }
}

function tiempo_borrado_menos(){
    borrado_cambiado = true;
    antiguo_rapidez_borrado = rapidez_borrado;
    antiguo_inicio_borrado = rapidez_inicio_borrado;
    rapidez_borrado = 7000;
    rapidez_inicio_borrado = 7000;
    setTimeout(function () {
        borrado_cambiado = false;
        rapidez_borrado = antiguo_rapidez_borrado;
        rapidez_inicio_borrado = antiguo_inicio_borrado;
    }, TIEMPO_MODIFICADOR);
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
  isConfettiRunning = false; // Deshabilita la ejecución de confetti
  confetti.reset(); // Detiene la animación de confetti
}

function final(){
    setInterfazInversaGlobal(false);
    permitir_fin_por_decision_local = false;
    esperando_resurreccion_tiempo = false;
    ocultarUiResucitar();
    //sendText();
    menu_modificador = false;
    limpieza_final();
    
    modo_actual = "";
    putada_actual = "";
    activar_sockets_extratextuales();

    // Impide que se pueda escribir en los dos textos.
    texto.contentEditable= "false";

    // Variable booleana que dice si la ronda ha terminado o no.
    terminado = true;

    texto.style.height = "auto";
    texto.style.height = texto.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
    texto.style.display = "none";
    
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
  
// El URL de tu servidor LanguageTool
const apiUrl = 'https://language-tool.zeabur.app/v2/check?language=es-ES&disabledRules=UPPERCASE_SENTENCE_START&text=';
let ultimoOffsetVerificado = 0;  // Guarda la última posición verificada

const penalizaciones = {
    "Cambios en las normas lingüísticas": -1,
    "Concordancia en grupos nominales": -2,
    "Concordancia sujeto/predicado": -2,
    "Confusiones": -1,
    "Confusiones (2)": -1,
    "Diacríticos (tilde)": -1,
    "Errores según el contexto": -1,
    "Estilo": -1,
    "Expresiones incorrectas": -1,
    "Gramática": -2,
    "Mayúsculas y minúsculas": -1,
    "Miscellaneous": -1,
    "Ortografía": -1,
    "Posible error ortográfico": -1,
    "Preposiciones": -1,
    "Puntuación": -1,
    "Redundancias": -1,
    "Reglas específicas para Wikipedia": -1,
    "Repeticiones (estilo)": -1,
    "Semàntica": -1,
    "Tipografía": -1,
    "Variedades de lengua": -1,
    "Varios": -1,
    "diacríticos (experimental)": -1,
    "expresiones preferibles": -1,
    "nombres propios": -1,
    "repeticiones": -1,
    "tipografía avanzada": -1
};

// Función que determina la penalización basada en la categoría de error
function determinarPenalizacion(categoria) {
    return penalizaciones[categoria] || -1;  // Devuelve -1 si la categoría no está en el objeto
}

// Función que hace la petición al servidor
function hacerPeticion(textoDesdeUltimoOffset) {
    return fetch(apiUrl + encodeURIComponent(textoDesdeUltimoOffset))
    .then(response => response.json())
    .then(data => {
        let totalPenalizacion = 0;
        console.log(`Número de errores detectados: ${data.matches.length}`);
        // Imprimir detalles de cada error y calcular penalización
        data.matches.forEach((error, index) => {
            const palabraError = textoDesdeUltimoOffset.substr(error.context.offset, error.context.length);
            const penalizacion = determinarPenalizacion(error.rule.category.name);
            totalPenalizacion += penalizacion;

            console.log(`Error ${index + 1}:`);
            console.log(`- Mensaje: ${error.message}`);
            console.log(`- Palabra con error: ${palabraError}`);
            console.log(`- Texto completo del error: ${error.context.text}`);
            console.log(`- Penalización: ${penalizacion}`);
            console.log('-------------------------');
        });
        
        console.log(`Penalización total: ${totalPenalizacion}`);
        // Actualizar el último offset verificado
        ultimoOffsetVerificado = textoDesdeUltimoOffset.length;
        return totalPenalizacion;
    })
    .catch(error => {
        console.error('Error al hacer la petición:', error);
    });
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

function modo_ortografia_perfecta() {
    setInterval(() => {
        // Tomar solo el nuevo texto desde el puntero de inicio hasta el final ajustado
        const nuevoTexto = ajustarPunteros(texto.innerText);
        // Actualizar el puntero de inicio global para la pr?xima iteraci?n
        punteroInicio += nuevoTexto.length;

        hacerPeticion(nuevoTexto).then(descuento => {
            if (descuento != 0) {
                const tiempo_feed = String(descuento) + " segs.";
                mostrarFeedbackFlotanteEscritora(tiempo_feed, { color: color_negativo, tipo: "perder_tiempo" });
            }
        });
    }, 10000);
}

 // Funci?n que invierte las letras de cada palabra pero NO el orden de las palabras.
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
    sendText();
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
const CLASES_FADE_TEXTAREA_ESCRITOR = [
    "textarea-fade-none",
    "textarea-fade-top",
    "textarea-fade-bottom",
    "textarea-fade-both"
];
let raf_degradado_textarea_escritor = null;
let observador_degradado_textarea_escritor = null;
let observador_resize_textarea_escritor = null;
let degradado_textarea_escritor_iniciado = false;

function actualizarDegradadoDinamicoTextoEscritor() {
    if (!textarea || !textarea.classList) return;
    const gradientTop = document.getElementById("gradientTop");
    const gradientBottom = document.getElementById("gradientBottom");
    const clientHeight = textarea.clientHeight || 0;
    const scrollHeight = textarea.scrollHeight || 0;

    if (clientHeight <= 0 || textarea.style.display === "none") {
        CLASES_FADE_TEXTAREA_ESCRITOR.forEach((clase) => textarea.classList.remove(clase));
        textarea.classList.add("textarea-fade-none");
        if (gradientTop) gradientTop.style.opacity = "0";
        if (gradientBottom) gradientBottom.style.opacity = "0";
        return;
    }

    const margen = 2;
    const tieneOverflow = (scrollHeight - clientHeight) > margen;
    const scrollTop = Math.max(0, textarea.scrollTop || 0);
    const ocultoArriba = tieneOverflow && (scrollTop > margen);
    const ocultoAbajo = tieneOverflow && ((scrollTop + clientHeight) < (scrollHeight - margen));

    CLASES_FADE_TEXTAREA_ESCRITOR.forEach((clase) => textarea.classList.remove(clase));
    if (ocultoArriba && ocultoAbajo) {
        textarea.classList.add("textarea-fade-both");
    } else if (ocultoArriba) {
        textarea.classList.add("textarea-fade-top");
    } else if (ocultoAbajo) {
        textarea.classList.add("textarea-fade-bottom");
    } else {
        textarea.classList.add("textarea-fade-none");
    }

    if (gradientTop) gradientTop.style.opacity = ocultoArriba ? "1" : "0";
    if (gradientBottom) gradientBottom.style.opacity = ocultoAbajo ? "1" : "0";
}

function programarActualizacionDegradadoTextoEscritor() {
    if (raf_degradado_textarea_escritor) return;
    raf_degradado_textarea_escritor = requestAnimationFrame(() => {
        raf_degradado_textarea_escritor = null;
        actualizarDegradadoDinamicoTextoEscritor();
    });
}

function iniciarDegradadoDinamicoTextoEscritor() {
    if (degradado_textarea_escritor_iniciado || !textarea) return;
    degradado_textarea_escritor_iniciado = true;

    const eventos = ["input", "scroll", "keyup", "mouseup", "touchend", "focus", "blur"];
    eventos.forEach((evento) => {
        textarea.addEventListener(evento, programarActualizacionDegradadoTextoEscritor);
    });
    window.addEventListener("resize", programarActualizacionDegradadoTextoEscritor);
    document.addEventListener("selectionchange", () => {
        if (document.activeElement === textarea) {
            programarActualizacionDegradadoTextoEscritor();
        }
    });

    if (typeof MutationObserver === "function") {
        observador_degradado_textarea_escritor = new MutationObserver(() => {
            programarActualizacionDegradadoTextoEscritor();
        });
        observador_degradado_textarea_escritor.observe(textarea, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["class", "style"]
        });
    }

    if (typeof ResizeObserver === "function") {
        observador_resize_textarea_escritor = new ResizeObserver(() => {
            programarActualizacionDegradadoTextoEscritor();
        });
        observador_resize_textarea_escritor.observe(textarea);
    }

    programarActualizacionDegradadoTextoEscritor();
    setTimeout(programarActualizacionDegradadoTextoEscritor, 120);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarDegradadoDinamicoTextoEscritor, { once: true });
} else {
    iniciarDegradadoDinamicoTextoEscritor();
}

function function_frase_final() {

    animacion_modo();
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("frase-final");
    palabra.innerHTML = "NIVEL FRASE FINAL";
    const fraseObjetivo = String(frase_final || "").trim();
    const palabraObjetivo = fraseObjetivo ? "\u00AB" + fraseObjetivo + "\u00BB" : "\u00AB-\u00BB";
    renderObjetivoNivelEscritora(palabraObjetivo, {
        tipo: "frase-final",
        descripcion: "\u00A1Esta es la \u00FAltima!"
    });
    limpiarMarcadoFraseFinal();

    texto.removeEventListener("keyup", listener_modo);
    listener_modo = function (e) { modo_frase_final(e) };
    texto.addEventListener("keyup", listener_modo);
}

function modo_frase_final(e) {
    actualizarProgresoFraseFinal();
    // Obtenemos el texto completo del elemento
    let textContent = e.target.innerText;
    // Convertimos a minúsculas y recortamos espacios (opcional pero recomendable):
    let textLower = textContent.trim().toLowerCase();
  
    // Revisamos si el texto termina exactamente con esa frase final:
    if (textLower.endsWith(frase_final)) {
      // Aquí va tu lógica de finalización
      final();
      socket.emit("fin_de_player", player);
    }
  }

  function ajustarFuerza(secs_base, fuerza) {
    // 1. Validación de tipos:
    if (typeof secs_base !== 'number' || typeof fuerza !== 'number') {
      throw new TypeError('ajustarFuerza: ambos parámetros deben ser números');
    }
  
    // 2. Caso fuerza === 0: devolvemos el valor base sin alteraciones.
    if (fuerza === 0) {
      return Math.round(secs_base);
    }
  
    // 3. Colapsamos fuerza al máximo si lo excede:
    if (fuerza > LIMITE_TOTAL) {
      fuerza = LIMITE_TOTAL;
    }
  
    // 4. Cálculo del factor logarítmico normalizado:
    //    Numerador: log(fuerza + 1)
    //    Denominador: log(LIMITE_TOTAL + 1) para que el máximo sea 1
    const factorLog = Math.log(fuerza + 1) / Math.log(LIMITE_TOTAL + 1);
  
    // 5. Porcentaje de incremento final:
    //    maxIncremento * factorLog, entre 0 y maxIncremento
    const pctIncremento = maxIncremento * factorLog;
  
    // 6. Cálculo del resultado y redondeo:
    const resultado = Math.round(secs_base * (1 + pctIncremento));
  
    // 7. (Opcional) Depuración en consola:
    console.log(
      `[ajustarFuerza] secs_base=${secs_base}, fuerza=${fuerza}, ` +
      `factorLog=${factorLog.toFixed(3)}, pctInc=${(pctIncremento*100).toFixed(1)}% → resultado=${resultado}`
    );
  
    return resultado;
  }


  function ajustarDestreza(secs_base, destreza) {
    // 1. Validación de tipos:
    if (typeof secs_base !== 'number' || typeof destreza !== 'number') {
      throw new TypeError('ajustarDestreza: ambos parámetros deben ser números');
    }
  
    // 2. Caso destreza === 0: devolvemos el valor base sin alteraciones.
    if (destreza === 0) {
      return Math.round(secs_base);
    }
  
    // 3. Limitar destreza al rango [0, LIMITE_TOTAL].
    if (destreza > LIMITE_TOTAL) {
      destreza = LIMITE_TOTAL;
    }
  
    // 4. Cálculo del factor logarítmico normalizado:
    //    Numerador:   log(destreza + 1)
    //    Denominador: log(LIMITE_TOTAL + 1) → máximo factor = 1
    const numerador   = Math.log(destreza + 1);
    const denominador = Math.log(LIMITE_TOTAL + 1);
    const factorLog   = numerador / denominador;
  
    // 5. Porcentaje de reducción final:
    //    Entre 0 (sin cambio) y maxIncremento (reducción máxima).
    const pctReduccion = maxIncrementoDestreza * factorLog;
  
    // 6. Cálculo del nuevo valor:
    const resultado = Math.round(secs_base * (1 - pctReduccion));
  
    // 7. (Opcional) Depuración en consola:
    console.log(
      `[ajustarDestreza] secs_base=${secs_base}, destreza=${destreza}, ` +
      `factorLog=${factorLog.toFixed(3)}, pctRed=${(pctReduccion*100).toFixed(1)}% → resultado=${resultado}`
    );
  
    return resultado;
  }

  function ajustarRapidez(baseRapidezBorrado, baseInicioBorrado, agilidad) {
    // 1. Validación de tipos:
    if (typeof baseRapidezBorrado !== 'number' ||
        typeof baseInicioBorrado  !== 'number' ||
        typeof agilidad          !== 'number') {
      throw new TypeError('ajustarRapidez: todos los parámetros deben ser números');
    }
  
    // 2. Caso agilidad === 0: devolvemos las bases sin alteraciones.
    if (agilidad === 0) {
      rapidez_borrado        = baseRapidezBorrado;
      rapidez_inicio_borrado = baseInicioBorrado;
      console.log(
        `[ajustarRapidez] agilidad=0 → rapidez_borrado=${rapidez_borrado}, ` +
        `rapidez_inicio_borrado=${rapidez_inicio_borrado}`
      );
      return;
    }
  
    // 3. Colapsar agilidad al máximo si lo excede:
    if (agilidad > LIMITE_TOTAL) {
      agilidad = LIMITE_TOTAL;
    }
  
    // 4. Cálculo del factor logarítmico normalizado:
    //    - Numerador:   log(agilidad + 1) crece de forma decreciente.
    //    - Denominador: log(LIMITE_TOTAL + 1) garantiza que el máximo sea 1.
    const factorLog = Math.log(agilidad + 1) / Math.log(LIMITE_TOTAL + 1);
  
    // 5. Porcentaje de incremento final:
    //    Entre 0 (sin cambio) y maxIncremento (incremento máximo).
    const pctIncremento = maxIncremento * factorLog;
  
    // 6. Aplicación del incremento y redondeo opcional:
    rapidez_borrado        = Math.round(baseRapidezBorrado     * (1 + pctIncremento));
    rapidez_inicio_borrado = Math.round(baseInicioBorrado      * (1 + pctIncremento));
  
    // 7. Depuración en consola:
    console.log(
      `[ajustarRapidez] baseRapidezBorrado=${baseRapidezBorrado}, baseInicioBorrado=${baseInicioBorrado}, ` +
      `agilidad=${agilidad}, factorLog=${factorLog.toFixed(3)}, ` +
      `pctInc=${(pctIncremento*100).toFixed(1)}% → rapidez_borrado=${rapidez_borrado}, ` +
      `rapidez_inicio_borrado=${rapidez_inicio_borrado}`
    );
  }
  

  /**
 * reduceLog:
 *   Reduce un tiempo (ms) aplicando una atenuación logarítmica.
 *
 * @param {number} base    - Valor original en milisegundos (debe ser > 0).
 * @param {number} k       - Coeficiente de “fuerza” de la reducción. 
 *                           k = 0 → sin reducción; a mayor k → más reducción.
 * @returns {number}       - Nuevo valor en ms, redondeado.
 */
function reduceLog(base, k = 1) {
    if (base <= 0) return 0;
    // 1) Calculamos ln(base)
    const lnBase = Math.log(base);
    // 2) Creamos el denominador 1 + k·ln(base), para que nunca divida por 0
    const denom = 1 + k * lnBase;
    // 3) Dividimos y redondeamos
    return Math.round(base / denom);
  }
  
