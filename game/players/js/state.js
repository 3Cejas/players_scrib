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
const tJuego2P = (clave, variables = {}, fallback = "") => (
    (window && typeof window.scribT2P === "function")
        ? window.scribT2P(clave, variables, fallback)
        : (fallback || clave)
);
const traducirTituloModoEscritora = (modo, fallback = "") => (
    (window && typeof window.scribTranslateModeTitle2P === "function")
        ? window.scribTranslateModeTitle2P(modo, fallback || String(modo || "").toUpperCase())
        : (fallback || String(modo || "").toUpperCase())
);
const traducirDescripcionModoEscritora = (modo, fallback = "") => (
    (window && typeof window.scribTranslateModeDescription2P === "function")
        ? window.scribTranslateModeDescription2P(modo, fallback)
        : fallback
);
const traducirSolicitudCalentamientoEscritora = (tipo, opciones = {}) => (
    (window && typeof window.scribTranslateWarmupRequest2P === "function")
        ? window.scribTranslateWarmupRequest2P(tipo, opciones)
        : (opciones && opciones.corta ? "NINGUNO" : "SIN DETONADOR ACTIVO")
);
const traducirNombreEscritoraUi = (id, fallback = "") => (
    (window && typeof window.scribTranslateWriterName2P === "function")
        ? window.scribTranslateWriterName2P(id, fallback || `ESCRITXR ${id}`)
        : (fallback || `ESCRITXR ${id}`)
);
const formatearPalabrasJuego2P = (valor) => (
    (window && typeof window.scribFormatWordsCount2P === "function")
        ? window.scribFormatWordsCount2P(valor)
        : `${Number(valor) || 0} palabras`
);
const formatearMusasJuego2P = (valor) => (
    (window && typeof window.scribFormatMusesCount2P === "function")
        ? window.scribFormatMusesCount2P(valor)
        : `${Number(valor) || 0} musas`
);
const construirCantidadResucitarJuego2P = (payload = {}) => (
    (window && typeof window.scribBuildResurrectionQuantityHtml2P === "function")
        ? window.scribBuildResurrectionQuantityHtml2P(payload)
        : ""
);
const normalizarSaltosTextoGuardado = (valor) => String(valor ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

function capturarTextoGuardadoDesdeEditor() {
    if (!texto) {
        texto_guardado = "";
        return texto_guardado;
    }
    texto_guardado = normalizarSaltosTextoGuardado(obtenerTextoPlanoConSaltos(texto));
    return texto_guardado;
}

function capturarTextoGuardadoSinPerderPrevio() {
    const previo = typeof texto_guardado === "string" ? texto_guardado : "";
    const capturado = capturarTextoGuardadoDesdeEditor();
    if (!String(capturado || "").trim() && String(previo || "").trim()) {
        texto_guardado = previo;
    }
    return texto_guardado;
}

function restaurarTextoGuardadoEnEditor() {
    if (!texto) return;
    texto.innerText = normalizarSaltosTextoGuardado(texto_guardado);
}

function colocarCursorAlFinalEditor() {
    if (!texto) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let lastNode = texto.lastChild;

    while (lastNode && lastNode.nodeType !== 3 && lastNode.lastChild) {
        lastNode = lastNode.lastChild;
    }

    if (lastNode && lastNode.nodeType === 3) {
        const offset = lastNode.textContent ? lastNode.textContent.length : 0;
        range.setStart(lastNode, offset);
        range.setEnd(lastNode, offset);
    } else if (texto.lastChild) {
        range.setStartAfter(texto.lastChild);
        range.setEndAfter(texto.lastChild);
    } else {
        range.setStart(texto, 0);
        range.setEnd(texto, 0);
    }

    selection.removeAllRanges();
    selection.addRange(range);
    texto.scrollTo(0, texto.scrollHeight);
}
const AUDIO_GAME_OVER_ESCRITORA = "../../game/audio/PERDER PALABRA.mp3";
const AUDIO_RESUCITAR_ESCRITORA = "../../game/audio/GANAR PALABRA.mp3";

function reproducirEfectoVidaEscritora(ruta, volumen = 0.9) {
    try {
        const audio = new Audio(ruta);
        audio.volume = Math.max(0, Math.min(1, Number(volumen) || 0.9));
        audio.play().catch(() => {});
    } catch (_) {}
}

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
    payload.modo_actual = typeof modo_actual === "string" ? modo_actual : "";
    payload.modo_seq = Number.isFinite(modo_seq_actual) ? modo_seq_actual : 0;
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
let TEXTO_GANADOR_ESCRITORA = tJuego2P("game.finished", {}, "Â¡TEXTO TERMINADO!");
let TEXTO_PERDISTE_SIN_PALABRAS = tJuego2P("game.no_words_lost", {}, "Â¡PERDISTE, NO ESCRIBISTE NADA!");
let timeout_fulgor_escritor = null;
let timeout_musa_regalo_estado_anim = null;

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

function animarFinEscritora(textoGanador) {
    activarFulgorEscritor("escritor-borde-fulgor-negativo");
    setIndicadorGanadoraEscritora(true, textoGanador);
}

function emitirCambioTiempoEscritora(secs) {
    const delta = Number(secs);
    if (!Number.isFinite(delta) || delta === 0) return;
    // En frase final no se permite ganar tiempo escribiendo.
    if (modo_actual === "frase final" && delta > 0) return;
    activarFulgorCambioTiempoEscritora(delta);
    socket.emit("aumentar_tiempo", { secs: delta, player });
}

let ultimo_tiempo_contador_segundos = null;
let ultimo_tiempo_contador_ms = 0;

function sincronizarEstadoContadorEscritora(segundos, texto = "") {
    const valor = Number(segundos);
    const normalizado = Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
    if (tiempo) {
        if (normalizado === null) {
            delete tiempo.dataset.remainingSeconds;
        } else {
            tiempo.dataset.remainingSeconds = String(normalizado);
        }
        if (texto) {
            tiempo.dataset.displayText = String(texto);
        }
    }
    if (typeof window !== "undefined") {
        window.__scribWriterTimerRemaining = normalizado;
    }
}

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

function formatearSegundosContador(valor) {
    const total = Math.max(0, Math.trunc(Number(valor) || 0));
    const minutos = Math.floor(total / 60);
    const segundos = total % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function aplicarAjusteLocalTiempoEscritora(secs, payload = {}) {
    const delta = Math.trunc(Number(secs) || 0);
    if ((!delta && !payload) || !tiempo) return;
    const countAfter = typeof payload.count_after === "string" ? payload.count_after.trim() : "";
    const secondsAfter = Number(payload.count_seconds_after);
    if (countAfter) {
        tiempo.innerHTML = countAfter;
        actualizarBarraVida(tiempo, countAfter);
        const absoluto = extraerSegundosContador(countAfter);
        ultimo_tiempo_contador_segundos = absoluto !== null ? absoluto : null;
        ultimo_tiempo_contador_ms = Date.now();
        sincronizarEstadoContadorEscritora(ultimo_tiempo_contador_segundos, countAfter);
        return;
    }
    if (Number.isFinite(secondsAfter)) {
        const textoContadorAbsoluto = secondsAfter > 0
            ? formatearSegundosContador(secondsAfter)
            : tJuego2P("timer.time_up", {}, "Ã‚Â¡Tiempo!");
        tiempo.innerHTML = textoContadorAbsoluto;
        actualizarBarraVida(tiempo, textoContadorAbsoluto);
        ultimo_tiempo_contador_segundos = secondsAfter > 0 ? Math.max(0, Math.trunc(secondsAfter)) : null;
        ultimo_tiempo_contador_ms = Date.now();
        sincronizarEstadoContadorEscritora(ultimo_tiempo_contador_segundos, textoContadorAbsoluto);
        return;
    }
    if (!delta) return;
    const actual = extraerSegundosContador(String(tiempo.textContent || tiempo.innerText || ""));
    if (actual === null) return;
    const nuevo = Math.max(0, actual + delta);
    const textoContador = nuevo > 0
        ? formatearSegundosContador(nuevo)
        : tJuego2P("timer.time_up", {}, "Â¡Tiempo!");
    tiempo.innerHTML = textoContador;
    actualizarBarraVida(tiempo, textoContador);
    ultimo_tiempo_contador_segundos = nuevo > 0 ? nuevo : null;
    ultimo_tiempo_contador_ms = Date.now();
    sincronizarEstadoContadorEscritora(ultimo_tiempo_contador_segundos, textoContador);
}

function procesarFulgorCambioTiempoDesdeContador(countTexto) {
    const actual = extraerSegundosContador(countTexto);
    if (actual === null) {
        ultimo_tiempo_contador_segundos = null;
        ultimo_tiempo_contador_ms = 0;
        sincronizarEstadoContadorEscritora(null, countTexto);
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
    sincronizarEstadoContadorEscritora(actual, countTexto);
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
    corazon.textContent = equipo === 1 ? "ðŸ’™" : "â¤ï¸";
    const tamano = 22 + Math.random() * 22;
    const duracion = 2000 + Math.random() * 1200;
    const desplazamiento = -(90 + Math.random() * 140);
    corazon.style.left = `${x}px`;
    corazon.style.top = `${y}px`;
    corazon.style.fontSize = `${tamano}px`;
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
let musa_regalo_estado = getEl("musa_regalo_estado");
  
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let metadatos = getEl("metadatos");

function setIndicadorGanadoraEscritora(visible, texto = TEXTO_GANADOR_ESCRITORA) {
    if (!metadatos) return;
    if (!visible) {
        metadatos.removeAttribute("data-ganador");
        return;
    }
    metadatos.setAttribute("data-ganador", texto || TEXTO_GANADOR_ESCRITORA);
}
  
let tiempo = getEl("tiempo");
let temas = getEl("temas");
let lightning = getEl("lightning");
let feedback_tiempo = getEl("feedback_tiempo");
let neon = getEl("neon");
const explicacion = getEl("explicacion") || getEl("explicación") || getEl("explicaciÃ³n");
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
let progreso_frase_final_base_segundos_escritora = null;

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

function reiniciarProgresoFraseFinalEscritora() {
    progreso_frase_final_base_segundos_escritora = null;
}

function actualizarProgresoFraseFinalEscritora(segundosRestantes) {
    if (modo_actual !== "frase final") return false;
    const segundos = Number(segundosRestantes);
    if (!Number.isFinite(segundos) || segundos < 0) return false;

    if (!Number.isFinite(progreso_frase_final_base_segundos_escritora) || progreso_frase_final_base_segundos_escritora <= 0) {
        progreso_frase_final_base_segundos_escritora = segundos;
    } else if (segundos > progreso_frase_final_base_segundos_escritora) {
        // Protege de ajustes de tiempo positivos durante sincronizaciones.
        progreso_frase_final_base_segundos_escritora = segundos;
    }

    const base = Math.max(1, Number(progreso_frase_final_base_segundos_escritora) || 1);
    const restante = Math.max(0, segundos);
    const pct = Math.max(0, Math.min(100, ((base - restante) / base) * 100));
    setProgresoNivelBarraEscritora(pct);
    if (pct >= 100) {
        detenerProgresoNivelBarraEscritora(false);
    }
    return true;
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
    if (modo_actual === "frase final") {
        detenerProgresoNivelBarraEscritora(true);
        reiniciarProgresoFraseFinalEscritora();
        return;
    }
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
    if (window && typeof window.scribBuildModeRule2P === "function") {
        return window.scribBuildModeRule2P(tipo, letra);
    }
    const letraDestacada = renderLetraDestacadaNivelEscritora(letra);
    if (tipo === "bendita") return `CADA PALABRA DEBE INCLUIR LA LETRA ${letraDestacada}.`;
    if (tipo === "prohibida") return `NINGUNA PALABRA PUEDE USAR LA LETRA ${letraDestacada}.`;
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
    return formatearPalabrasJuego2P(valor);
};

const formatearMusasMarcador = (valor) => {
    return formatearMusasJuego2P(valor);
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

function obtenerEstadoRegaloBanderaEscritora(payload = {}) {
    const equipoLocal = Number(player);
    if (equipoLocal !== 1 && equipoLocal !== 2) return null;
    const equipos = payload && payload.equipos;
    if (!equipos || typeof equipos !== "object") return null;
    return equipos[equipoLocal] || null;
}

function animarChipRegaloMusaEscritora() {
    if (!musa_regalo_estado) return;
    musa_regalo_estado.classList.remove("is-award");
    void musa_regalo_estado.offsetWidth;
    musa_regalo_estado.classList.add("is-award");
    if (timeout_musa_regalo_estado_anim) {
        clearTimeout(timeout_musa_regalo_estado_anim);
    }
    timeout_musa_regalo_estado_anim = setTimeout(() => {
        timeout_musa_regalo_estado_anim = null;
        if (musa_regalo_estado) {
            musa_regalo_estado.classList.remove("is-award");
        }
    }, 720);
}

function actualizarEstadoRegaloBanderaEscritora(payload = {}) {
    if (!musa_regalo_estado) return;
    const estado = obtenerEstadoRegaloBanderaEscritora(payload);
    if (!estado || !estado.visible) {
        musa_regalo_estado.hidden = true;
        musa_regalo_estado.textContent = "";
        return;
    }
    const objetivo = Math.max(1, Number(estado.objetivo) || 1);
    const progreso = Math.max(0, Math.min(objetivo, Number(estado.progreso) || 0));
    const regaloSegs = Math.max(1, Number(estado.regalo_secs) || 1);
    const cooldownMs = Math.max(0, Number(estado.cooldown_ms) || 0);
    musa_regalo_estado.hidden = false;
    musa_regalo_estado.textContent = cooldownMs > 0 && progreso === 0
        ? `REGALO +${regaloSegs}S | RECARGA ${Math.max(1, Math.ceil(cooldownMs / 1000))}S`
        : `REGALO +${regaloSegs}S | ${progreso}/${objetivo}`;
}

function mostrarFeedbackRegaloBanderaEscritora(data = {}) {
    if (Number(data.player) !== Number(player)) return;
    const secs = Math.max(1, Math.abs(Number(data.secs) || 0));
    mostrarFeedbackFlotanteEscritora(`+${secs} SEG${secs === 1 ? "" : "S"} MUSAS`, {
        color: color_positivo,
        tipo: "ganar_tiempo"
    });
    animarChipRegaloMusaEscritora();
}

function obtenerPalabrasMarcadorEscritora() {
    if (!puntos) return 0;
    const texto = String(puntos.textContent || "").trim();
    const match = texto.match(/-?\d+/);
    if (!match) return 0;
    const valor = Number(match[0]);
    return Number.isFinite(valor) ? valor : 0;
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
const CLASE_CURSOR_PLUMA_ATRIBUTOS = "cursor-atributos-pluma-activo";
const SOPORTA_CURSOR_PLUMA_ATRIBUTOS = (() => {
    if (typeof window.matchMedia !== "function") return true;
    return window.matchMedia("(pointer: fine)").matches;
})();
const cursor_pluma_atributos_escritora = (() => {
    if (!SOPORTA_CURSOR_PLUMA_ATRIBUTOS || !document.body) return null;
    let nodo = getEl("atributos_cursor_pluma");
    if (!nodo) {
        nodo = document.createElement("div");
        nodo.id = "atributos_cursor_pluma";
        nodo.className = "atributos-cursor-pluma";
        nodo.setAttribute("aria-hidden", "true");
        const punto = document.createElement("span");
        punto.className = "cursor-punto";
        nodo.appendChild(punto);
        document.body.appendChild(nodo);
    }
    return nodo;
})();
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
let calentamiento_solicitud_escritor = "ninguna";
let ultimo_payload_calentamiento_escritor = null;
const DURACION_DECAY_CALENTAMIENTO_MS = 10000;
const VENTANA_ANIMACION_PALABRA_MS = 600;
const MARGEN_CABECERA_CALENTAMIENTO_PX = 18;
const MIN_Y_CALENTAMIENTO_DEFAULT = 26;
const MAX_NOMBRE_CURSOR_CALENTAMIENTO = 26;
const TIPOS_SOLICITUD_CALENTAMIENTO_VISTA = new Set(["ninguna", "lugares", "acciones", "frase_final"]);
const ETIQUETAS_SOLICITUD_CALENTAMIENTO_VISTA = {
    ninguna: "SIN DETONADOR ACTIVO",
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
let timeout_ajuste_viewport_escritora = null;
let resize_observer_fit_viewport_escritora = null;
let cursor_pluma_atributos_inicializado = false;
let cursor_pluma_juego_escritora = null;
let cursor_pluma_juego_inicializado = false;
let cursor_pluma_juego_activo = false;
let timeout_cursor_pluma_juego_inactivo = null;
let timeout_cursor_pluma_juego_press = null;
let timeout_cursor_pluma_atributos_press = null;
let ultimo_cursor_pluma_juego_x = Math.round((window.innerWidth || 0) * 0.5);
let ultimo_cursor_pluma_juego_y = Math.round((window.innerHeight || 0) * 0.5);
let ultimo_cursor_pluma_atributos_x = Math.round((window.innerWidth || 0) * 0.5);
let ultimo_cursor_pluma_atributos_y = Math.round((window.innerHeight || 0) * 0.5);
let raf_cursor_pluma_juego = null;
let raf_cursor_pluma_atributos = null;
let observador_cursor_pluma_juego_escritora = null;
let raf_degradado_textarea_escritor = null;
let timeout_degradado_textarea_escritor = null;
let observador_degradado_textarea_escritor = null;
let observador_resize_textarea_escritor = null;
let degradado_textarea_escritor_iniciado = false;
const CURSOR_PLUMA_JUEGO_INACTIVIDAD_MS = 1600;
const SOPORTA_CURSOR_PLUMA_JUEGO = (() => {
    if (typeof window.matchMedia !== "function") return true;
    return window.matchMedia("(pointer: fine)").matches;
})();

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
    if (timeout_ajuste_viewport_escritora) {
        clearTimeout(timeout_ajuste_viewport_escritora);
    }
    timeout_ajuste_viewport_escritora = setTimeout(() => {
        timeout_ajuste_viewport_escritora = null;
        programarAjusteViewportEscritora();
    }, 120);
};

const esElementoVisible = (elemento) => {
    if (!elemento || !document.body || !document.body.contains(elemento)) return false;
    const estilos = window.getComputedStyle(elemento);
    if (!estilos || estilos.display === "none" || estilos.visibility === "hidden") return false;
    if (Number.parseFloat(estilos.opacity || "1") <= 0.01) return false;
    return elemento.getClientRects().length > 0;
};

const sincronizarEquipoCursorPlumaAtributos = () => {
    if (!cursor_pluma_atributos_escritora) return;
    cursor_pluma_atributos_escritora.classList.remove("equipo-1", "equipo-2");
    if (playerNumber === 2) {
        cursor_pluma_atributos_escritora.classList.add("equipo-2");
        return;
    }
    cursor_pluma_atributos_escritora.classList.add("equipo-1");
};

const ocultarCursorPlumaAtributosEscritora = () => {
    if (!cursor_pluma_atributos_escritora) return;
    cursor_pluma_atributos_escritora.classList.remove("activo");
};

const retirarEstiloOcultarCursorEscritora = () => {
    const style = getEl("style-ocultar-cursor");
    if (style && style.parentNode) {
        style.parentNode.removeChild(style);
    }
};

const limpiarOcultacionCursorPlumaJuegoEscritora = () => {
    clearTimeout(timeout_cursor_pluma_juego_inactivo);
    timeout_cursor_pluma_juego_inactivo = null;
};

const ocultarCursorPlumaJuegoEscritora = () => {
    if (!cursor_pluma_juego_escritora) return;
    cursor_pluma_juego_escritora.classList.remove("activa");
};

const aplicarTransformCursorPlumaEscritora = (nodo, clientX, clientY) => {
    if (!nodo) return;
    nodo.style.transform = `translate3d(${Math.round(clientX)}px, ${Math.round(clientY)}px, 0) translate(-33px, -38px)`;
};

const posicionarCursorPlumaJuegoEscritora = (clientX, clientY) => {
    if (!cursor_pluma_juego_escritora) return;
    ultimo_cursor_pluma_juego_x = clientX;
    ultimo_cursor_pluma_juego_y = clientY;
    if (raf_cursor_pluma_juego) return;
    raf_cursor_pluma_juego = requestAnimationFrame(() => {
        raf_cursor_pluma_juego = null;
        aplicarTransformCursorPlumaEscritora(
            cursor_pluma_juego_escritora,
            ultimo_cursor_pluma_juego_x,
            ultimo_cursor_pluma_juego_y
        );
    });
};

const pulsarCursorPlumaJuegoEscritora = () => {
    if (!cursor_pluma_juego_escritora) return;
    cursor_pluma_juego_escritora.classList.add("is-pressing");
    clearTimeout(timeout_cursor_pluma_juego_press);
    timeout_cursor_pluma_juego_press = setTimeout(() => {
        timeout_cursor_pluma_juego_press = null;
        if (!cursor_pluma_juego_escritora) return;
        cursor_pluma_juego_escritora.classList.remove("is-pressing");
    }, 140);
};

const sincronizarEquipoCursorPlumaJuegoEscritora = () => {
    if (!cursor_pluma_juego_escritora) return;
    cursor_pluma_juego_escritora.classList.remove("equipo-1", "equipo-2");
    cursor_pluma_juego_escritora.classList.add(playerNumber === 2 ? "equipo-2" : "equipo-1");
};

const crearCursorPlumaJuegoEscritora = () => {
    if (!document.body) return null;
    if (!cursor_pluma_juego_escritora) {
        const nodo = document.createElement("div");
        nodo.id = "cursor_pluma_juego_escritora";
        nodo.className = "escritora-cursor-pluma";
        nodo.setAttribute("aria-hidden", "true");
        document.body.appendChild(nodo);
        cursor_pluma_juego_escritora = nodo;
    }
    sincronizarEquipoCursorPlumaJuegoEscritora();
    return cursor_pluma_juego_escritora;
};

const debeMostrarCursorPlumaJuegoEscritora = () => (
    Boolean(
        texto &&
        texto.isContentEditable &&
        document.body &&
        document.body.classList.contains("partida-activa") &&
        !vista_calentamiento_escritor &&
        !estaResurreccionActiva() &&
        esElementoVisible(texto)
    )
);

const programarOcultacionCursorPlumaJuegoEscritora = () => {
    limpiarOcultacionCursorPlumaJuegoEscritora();
    if (!cursor_pluma_juego_activo || !SOPORTA_CURSOR_PLUMA_JUEGO) return;
    timeout_cursor_pluma_juego_inactivo = setTimeout(() => {
        timeout_cursor_pluma_juego_inactivo = null;
        ocultarCursorPlumaJuegoEscritora();
    }, CURSOR_PLUMA_JUEGO_INACTIVIDAD_MS);
};

const mostrarCursorPlumaJuegoEscritora = (clientX = ultimo_cursor_pluma_juego_x, clientY = ultimo_cursor_pluma_juego_y) => {
    if (!cursor_pluma_juego_activo || !cursor_pluma_juego_escritora) return;
    posicionarCursorPlumaJuegoEscritora(clientX, clientY);
    cursor_pluma_juego_escritora.classList.add("activa");
    programarOcultacionCursorPlumaJuegoEscritora();
};

const setCursorPlumaJuegoEscritoraActiva = (activa) => {
    cursor_pluma_juego_activo = Boolean(activa);
    retirarEstiloOcultarCursorEscritora();
    if (texto && texto.classList) {
        texto.classList.add("textarea--pluma-cursor");
        texto.classList.toggle("textarea--pluma-cursor-visible", cursor_pluma_juego_activo && SOPORTA_CURSOR_PLUMA_JUEGO);
    }
    if (!cursor_pluma_juego_activo) {
        limpiarOcultacionCursorPlumaJuegoEscritora();
        ocultarCursorPlumaJuegoEscritora();
        return;
    }
    if (!SOPORTA_CURSOR_PLUMA_JUEGO) return;
    crearCursorPlumaJuegoEscritora();
    mostrarCursorPlumaJuegoEscritora();
};

const sincronizarCursorPlumaJuegoEscritora = () => {
    sincronizarEquipoCursorPlumaJuegoEscritora();
    setCursorPlumaJuegoEscritoraActiva(debeMostrarCursorPlumaJuegoEscritora());
};

const iniciarCursorPlumaJuegoEscritora = () => {
    if (cursor_pluma_juego_inicializado || !texto) return;
    cursor_pluma_juego_inicializado = true;
    texto.classList.add("textarea--pluma-cursor");
    if (SOPORTA_CURSOR_PLUMA_JUEGO) {
        crearCursorPlumaJuegoEscritora();
    }

    const manejarMovimiento = (evento) => {
        if (!evento || typeof evento.clientX !== "number" || typeof evento.clientY !== "number") return;
        ultimo_cursor_pluma_juego_x = evento.clientX;
        ultimo_cursor_pluma_juego_y = evento.clientY;
        if (!cursor_pluma_juego_activo) return;
        mostrarCursorPlumaJuegoEscritora(evento.clientX, evento.clientY);
    };

    document.addEventListener("mousemove", manejarMovimiento, { passive: true });
    document.addEventListener("pointerdown", (evento) => {
        if (!evento || typeof evento.clientX !== "number" || typeof evento.clientY !== "number") return;
        if (!cursor_pluma_juego_activo) return;
        mostrarCursorPlumaJuegoEscritora(evento.clientX, evento.clientY);
        pulsarCursorPlumaJuegoEscritora();
    }, { passive: true });
    texto.addEventListener("mouseenter", manejarMovimiento);
    texto.addEventListener("mousemove", manejarMovimiento);
    texto.addEventListener("focus", () => {
        sincronizarCursorPlumaJuegoEscritora();
        mostrarCursorPlumaJuegoEscritora();
    });
    texto.addEventListener("click", () => {
        sincronizarCursorPlumaJuegoEscritora();
        mostrarCursorPlumaJuegoEscritora();
    });
    texto.addEventListener("input", () => {
        sincronizarCursorPlumaJuegoEscritora();
        programarOcultacionCursorPlumaJuegoEscritora();
    });
    texto.addEventListener("keydown", programarOcultacionCursorPlumaJuegoEscritora);
    texto.addEventListener("blur", ocultarCursorPlumaJuegoEscritora);
    texto.addEventListener("mouseleave", () => {
        limpiarOcultacionCursorPlumaJuegoEscritora();
        ocultarCursorPlumaJuegoEscritora();
    });
    window.addEventListener("blur", () => {
        limpiarOcultacionCursorPlumaJuegoEscritora();
        ocultarCursorPlumaJuegoEscritora();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            limpiarOcultacionCursorPlumaJuegoEscritora();
            ocultarCursorPlumaJuegoEscritora();
            return;
        }
        sincronizarCursorPlumaJuegoEscritora();
    });

    if (typeof MutationObserver === "function" && !observador_cursor_pluma_juego_escritora) {
        observador_cursor_pluma_juego_escritora = new MutationObserver(() => {
            sincronizarCursorPlumaJuegoEscritora();
        });
        // El propio sincronizador cambia clases del editor; si observamos class/style
        // aquÃ­ entramos en un bucle de mutaciones al cargar la vista de escritora.
        observador_cursor_pluma_juego_escritora.observe(texto, {
            attributes: true,
            attributeFilter: ["contenteditable"]
        });
        if (document.body) {
            observador_cursor_pluma_juego_escritora.observe(document.body, {
                attributes: true,
                attributeFilter: ["class", "style"]
            });
        }
    }

    sincronizarCursorPlumaJuegoEscritora();
};

const moverCursorPlumaAtributosEscritora = (clientX, clientY) => {
    if (!cursor_pluma_atributos_escritora) return;
    ultimo_cursor_pluma_atributos_x = clientX;
    ultimo_cursor_pluma_atributos_y = clientY;
    if (!raf_cursor_pluma_atributos) {
        raf_cursor_pluma_atributos = requestAnimationFrame(() => {
            raf_cursor_pluma_atributos = null;
            aplicarTransformCursorPlumaEscritora(
                cursor_pluma_atributos_escritora,
                ultimo_cursor_pluma_atributos_x,
                ultimo_cursor_pluma_atributos_y
            );
        });
    }
    cursor_pluma_atributos_escritora.classList.add("activo");
};

const pulsarCursorPlumaAtributosEscritora = () => {
    if (!cursor_pluma_atributos_escritora) return;
    cursor_pluma_atributos_escritora.classList.add("is-pressing");
    clearTimeout(timeout_cursor_pluma_atributos_press);
    timeout_cursor_pluma_atributos_press = setTimeout(() => {
        timeout_cursor_pluma_atributos_press = null;
        if (!cursor_pluma_atributos_escritora) return;
        cursor_pluma_atributos_escritora.classList.remove("is-pressing");
    }, 140);
};

const esSeleccionAtributosActivaEscritora = () => (
    esElementoVisible(panel_atributos_escritora) ||
    esElementoVisible(panel_total_atributos_escritora) ||
    esElementoVisible(boton_inicio_atributos_escritora)
);

const inicializarCursorPlumaAtributosEscritora = () => {
    if (cursor_pluma_atributos_inicializado) return;
    cursor_pluma_atributos_inicializado = true;
    if (!SOPORTA_CURSOR_PLUMA_ATRIBUTOS || !cursor_pluma_atributos_escritora) return;
    sincronizarEquipoCursorPlumaAtributos();
    window.addEventListener("mousemove", (evento) => {
        if (!document.body || !document.body.classList.contains(CLASE_CURSOR_PLUMA_ATRIBUTOS)) return;
        if (!evento || typeof evento.clientX !== "number" || typeof evento.clientY !== "number") return;
        moverCursorPlumaAtributosEscritora(evento.clientX, evento.clientY);
    }, { passive: true });
    window.addEventListener("pointerdown", (evento) => {
        if (!document.body || !document.body.classList.contains(CLASE_CURSOR_PLUMA_ATRIBUTOS)) return;
        if (!evento || typeof evento.clientX !== "number" || typeof evento.clientY !== "number") return;
        moverCursorPlumaAtributosEscritora(evento.clientX, evento.clientY);
        pulsarCursorPlumaAtributosEscritora();
    }, { passive: true });
    window.addEventListener("blur", ocultarCursorPlumaAtributosEscritora);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            ocultarCursorPlumaAtributosEscritora();
        }
    });
    document.addEventListener("mouseleave", ocultarCursorPlumaAtributosEscritora);
};

const limpiarAsincroniaVisualEscritora = ({ resetViewport = false } = {}) => {
    if (timeout_fulgor_escritor) {
        clearTimeout(timeout_fulgor_escritor);
        timeout_fulgor_escritor = null;
    }
    if (document.body) {
        CLASES_FULGOR_ESCRITOR.forEach((clase) => document.body.classList.remove(clase));
    }
    if (timeout_musa_regalo_estado_anim) {
        clearTimeout(timeout_musa_regalo_estado_anim);
        timeout_musa_regalo_estado_anim = null;
    }
    if (musa_regalo_estado) {
        musa_regalo_estado.classList.remove("is-award");
    }
    if (raf_ajuste_viewport_escritora) {
        cancelAnimationFrame(raf_ajuste_viewport_escritora);
        raf_ajuste_viewport_escritora = null;
    }
    if (timeout_ajuste_viewport_escritora) {
        clearTimeout(timeout_ajuste_viewport_escritora);
        timeout_ajuste_viewport_escritora = null;
    }
    if (raf_degradado_textarea_escritor) {
        cancelAnimationFrame(raf_degradado_textarea_escritor);
        raf_degradado_textarea_escritor = null;
    }
    if (timeout_degradado_textarea_escritor) {
        clearTimeout(timeout_degradado_textarea_escritor);
        timeout_degradado_textarea_escritor = null;
    }
    if (resetViewport) {
        resetAjusteViewportEscritora();
    }
    clearTimeout(timeout_cursor_pluma_juego_inactivo);
    timeout_cursor_pluma_juego_inactivo = null;
    clearTimeout(timeout_cursor_pluma_juego_press);
    timeout_cursor_pluma_juego_press = null;
    clearTimeout(timeout_cursor_pluma_atributos_press);
    timeout_cursor_pluma_atributos_press = null;
    if (raf_cursor_pluma_juego) {
        cancelAnimationFrame(raf_cursor_pluma_juego);
        raf_cursor_pluma_juego = null;
    }
    if (raf_cursor_pluma_atributos) {
        cancelAnimationFrame(raf_cursor_pluma_atributos);
        raf_cursor_pluma_atributos = null;
    }
    if (cursor_pluma_juego_escritora) {
        cursor_pluma_juego_escritora.classList.remove("activa", "is-pressing");
    }
    if (cursor_pluma_atributos_escritora) {
        cursor_pluma_atributos_escritora.classList.remove("activo", "is-pressing");
    }
};

const actualizarOcultacionMarcadorEscritora = () => {
    if (!document.body) return;
    const seleccionAtributosActiva = esSeleccionAtributosActivaEscritora();
    const ocultarMarcador = Boolean(vista_calentamiento_escritor || seleccionAtributosActiva);
    document.body.classList.toggle(CLASE_OCULTAR_MARCADOR_ESCRITORA, ocultarMarcador);
    sincronizarEquipoCursorPlumaAtributos();
    const mostrarCursorPlumaAtributos = Boolean(
        SOPORTA_CURSOR_PLUMA_ATRIBUTOS &&
        cursor_pluma_atributos_escritora &&
        seleccionAtributosActiva &&
        !vista_calentamiento_escritor &&
        !document.body.classList.contains("partida-activa")
    );
    document.body.classList.toggle(CLASE_CURSOR_PLUMA_ATRIBUTOS, mostrarCursorPlumaAtributos);
    if (!mostrarCursorPlumaAtributos) {
        ocultarCursorPlumaAtributosEscritora();
    }
    sincronizarCursorPlumaJuegoEscritora();
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
    return TIPOS_SOLICITUD_CALENTAMIENTO_VISTA.has(tipo) ? tipo : "ninguna";
};
const actualizarConsignaCalentamientoEscritor = (solicitud) => {
    if (!calentamiento_consigna_escritor) return;
    const tipo = normalizarSolicitudCalentamientoVista(solicitud);
    const etiqueta = traducirSolicitudCalentamientoEscritora(tipo);
    calentamiento_consigna_escritor.textContent = tJuego2P(
        "warmup.request.writer",
        { label: etiqueta },
        `DETONADOR: ${etiqueta}`
    );
    calentamiento_consigna_escritor.classList.remove("tipo-libre", "tipo-ninguna", "tipo-lugares", "tipo-acciones", "tipo-frase_final");
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
            traducirNombreEscritoraUi(1, "ESCRITXR 1")
        );
    }
    if (calentamiento_cursor_label_escritor_2) {
        calentamiento_cursor_label_escritor_2.textContent = normalizarNombreCursorCalentamientoEscritor(
            nombres_cursores_calentamiento_escritor[2],
            traducirNombreEscritoraUi(2, "ESCRITXR 2")
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
        const xPx = rectStage.left + ((xPct / 100) * rectStage.width);
        const yPx = rectStage.top + ((yPct / 100) * rectStage.height);
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
inicializarCursorPlumaAtributosEscritora();
iniciarCursorPlumaJuegoEscritora();
actualizarOcultacionMarcadorEscritora();
iniciarAjusteViewportEscritora();

const actualizarBotonBloquearCalentamientoEscritor = (activo, bloqueado, seleccionadas) => {
    if (!calentamiento_bloquear_escritor) return;
    const cantidad = Number.isFinite(seleccionadas) ? Math.max(0, Math.floor(seleccionadas)) : 0;
    if (!activo) {
        calentamiento_bloquear_escritor.disabled = true;
        calentamiento_bloquear_escritor.textContent = tJuego2P("warmup.button.select_words", {}, "SELECCIONA PALABRAS");
        return;
    }
    if (bloqueado) {
        calentamiento_bloquear_escritor.disabled = true;
        calentamiento_bloquear_escritor.textContent = tJuego2P("warmup.button.closed", {}, "DETONADOR CERRADO");
        return;
    }
    if (cantidad > 0) {
        calentamiento_bloquear_escritor.disabled = false;
        calentamiento_bloquear_escritor.textContent = tJuego2P(
            "warmup.button.close_count",
            { count: cantidad },
            `CERRAR DETONADOR (${cantidad})`
        );
        return;
    }
    calentamiento_bloquear_escritor.disabled = true;
    calentamiento_bloquear_escritor.textContent = tJuego2P("warmup.button.select_words", {}, "SELECCIONA PALABRAS");
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
    calentamiento_final_escritor.textContent = tJuego2P(
        "warmup.final_word",
        { word: finalValido.palabra.toUpperCase() },
        `PALABRA FINAL: ${finalValido.palabra.toUpperCase()}`
    );
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
        : tJuego2P("warmup.feedback.generic_error", {}, "No se pudo completar la accion.");
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
    ultimo_payload_calentamiento_escritor = { ...(data || {}) };
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
        if (!Boolean(data.activo)) {
            calentamiento_estado_escritor.textContent = tJuego2P("warmup.state.inactive", {}, "Tutorial inactivo.");
        } else if (!Boolean(data.vista)) {
            calentamiento_estado_escritor.textContent = tJuego2P("warmup.state.waiting_view", {}, "Esperando vista de tutorial.");
        } else if (!bloqueado) {
            calentamiento_estado_escritor.textContent = tJuego2P(
                "warmup.state.select_words",
                {},
                "Selecciona palabras de tu equipo y pulsa CERRAR DETONADOR."
            );
        } else if (!finalEquipo) {
            calentamiento_estado_escritor.textContent = tJuego2P(
                "warmup.state.closed_choose_final",
                {},
                "Consigna cerrada. Elige una palabra final de las seleccionadas."
            );
        } else {
            calentamiento_estado_escritor.textContent = tJuego2P(
                "warmup.state.final_fixed",
                { word: finalEquipo.palabra },
                `Palabra final fijada: ${finalEquipo.palabra}.`
            );
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
const PATRON_CARACTER_PALABRA = "A-Za-z0-9ÃÃ‰ÃÃ“ÃšÃœÃ‘Ã¡Ã©Ã­Ã³ÃºÃ¼Ã±";
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

function rangoIntersecaNodo(rango, nodo) {
    if (!rango || !nodo) return false;
    if (typeof rango.intersectsNode === "function") {
        try {
            return rango.intersectsNode(nodo);
        } catch (_error) {
            return false;
        }
    }
    try {
        const rangoNodo = document.createRange();
        rangoNodo.selectNodeContents(nodo);
        return !(
            rango.compareBoundaryPoints(Range.END_TO_START, rangoNodo) <= 0
            || rango.compareBoundaryPoints(Range.START_TO_END, rangoNodo) >= 0
        );
    } catch (_error) {
        return false;
    }
}

function rangoIntersecaPalabraBendita(rango) {
    if (!texto || !rango) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
    for (const span of spans) {
        if (rangoIntersecaNodo(rango, span)) return true;
    }
    return false;
}

function obtenerNodoProtegidoEnRango(rango) {
    if (!texto || !rango) return null;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
    for (const span of spans) {
        if (rangoIntersecaNodo(rango, span)) return span;
    }
    return null;
}

function rangoIntersecaPalabraMarcada(rango) {
    if (!texto || !rango) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_MARCADA);
    for (const span of spans) {
        if (rangoIntersecaNodo(rango, span)) return true;
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

function obtenerNodoProtegidoAdyacente(sel, direccion) {
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return obtenerNodoProtegidoEnRango(range);
    const node = range.startContainer;
    const offset = range.startOffset;
    if (nodoEnPalabraBendita(node)) return nodoEnPalabraBendita(node);
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
    return nodoEnPalabraBendita(objetivo);
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

function obtenerNodoProtegidoAfectadoPorDireccion(direccion) {
    if (!texto) return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return obtenerNodoProtegidoEnRango(range);
    const directo = nodoEnPalabraBendita(range.startContainer);
    if (directo) return directo;

    const caretOffset = obtenerOffsetCaretEnTexto();
    const targetOffset = direccion === "backward" ? caretOffset - 1 : caretOffset;
    if (targetOffset >= 0) {
        const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
        for (const span of spans) {
            const inicio = obtenerOffsetInicioNodo(span);
            const fin = inicio + (span.textContent || "").length;
            if (targetOffset >= inicio && targetOffset < fin) return span;
        }
    }

    const rangoBorrado = obtenerRangoBorradoCaracter(direccion);
    const spanPorRango = obtenerNodoProtegidoEnRango(rangoBorrado);
    if (spanPorRango) return spanPorRango;

    return obtenerNodoProtegidoAdyacente(sel, direccion);
}

function obtenerNodoProtegidoAfectadoPorEdicion(e) {
    const rangosObjetivo = typeof e?.getTargetRanges === "function" ? e.getTargetRanges() : [];
    if (rangosObjetivo && rangosObjetivo.length) {
        for (const rango of rangosObjetivo) {
            const span = obtenerNodoProtegidoEnRango(rango);
            if (span) return span;
        }
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
            const spanDirecto = nodoEnPalabraBendita(range.startContainer);
            if (spanDirecto) return spanDirecto;
        } else {
            const spanSeleccionado = obtenerNodoProtegidoEnRango(range);
            if (spanSeleccionado) return spanSeleccionado;
        }
    }

    const tipo = String(e?.inputType || "");
    if (tipo.startsWith("delete")) {
        return obtenerNodoProtegidoAfectadoPorDireccion(tipo.includes("Forward") ? "forward" : "backward");
    }

    return null;
}

let snapshot_html_bendita = null;
let snapshot_offset_bendita = null;
let snapshot_cantidad_benditas = 0;
let snapshot_input_type_bendita = "";
let snapshot_input_data_bendita = "";
let restaurando_bendita = false;

function limpiarSnapshotProtegido() {
    snapshot_html_bendita = null;
    snapshot_offset_bendita = null;
    snapshot_cantidad_benditas = 0;
    snapshot_input_type_bendita = "";
    snapshot_input_data_bendita = "";
}

function debeVigilarMutacionProtegida(inputType) {
    const tipo = String(inputType || "");
    return tipo.startsWith("delete") || tipo.startsWith("insert");
}

function obtenerCaracterEntradaEvento(e) {
    if (typeof e?.data === "string" && e.data.length > 0) {
        return e.data;
    }
    if (typeof e?.key === "string" && e.key.length === 1) {
        return e.key;
    }
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return "";
    const node = sel.anchorNode;
    if (node && node.nodeType === Node.TEXT_NODE && sel.focusOffset > 0) {
        return node.textContent.charAt(sel.focusOffset - 1);
    }
    return "";
}

function insertarTextoPlanoEnCaretProtegido(contenido) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const fragmento = document.createDocumentFragment();
    const textoPlano = String(contenido ?? "");
    const partes = textoPlano.split("\n");
    partes.forEach((parte, indice) => {
        if (parte) {
            fragmento.appendChild(document.createTextNode(parte));
        }
        if (indice < partes.length - 1) {
            fragmento.appendChild(document.createElement("br"));
        }
    });
    const marcador = document.createTextNode("");
    fragmento.appendChild(marcador);
    range.insertNode(fragmento);

    const nuevoRango = document.createRange();
    nuevoRango.setStart(marcador, 0);
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
    return true;
}

function reinsertarEntradaTrasRestauracionProtegida() {
    const tipo = String(snapshot_input_type_bendita || "");
    if (!tipo.startsWith("insert")) return false;
    const esSalto = tipo === "insertParagraph" || tipo === "insertLineBreak";
    const contenido = esSalto ? "\n" : (snapshot_input_data_bendita ?? "");
    if (!contenido && !esSalto) return false;
    return insertarTextoPlanoEnCaretProtegido(contenido);
}

function insertarSpanProtegidoEnCaret(letra, clase) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const span = document.createElement("span");
    span.className = clase;
    span.setAttribute("contenteditable", "false");
    span.textContent = letra;

    const marcador = document.createTextNode("");
    const fragmento = document.createDocumentFragment();
    fragmento.appendChild(span);
    fragmento.appendChild(marcador);
    range.insertNode(fragmento);

    const nuevoRango = document.createRange();
    nuevoRango.setStart(marcador, 0);
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
    return true;
}

function insertarTextoJuntoANodoProtegido(nodoProtegido, contenido, direccion = "after") {
    if (!nodoProtegido || !nodoProtegido.parentNode) return false;
    const nuevoTexto = document.createTextNode(String(contenido ?? ""));
    if (direccion === "before") {
        nodoProtegido.parentNode.insertBefore(nuevoTexto, nodoProtegido);
    } else {
        nodoProtegido.parentNode.insertBefore(nuevoTexto, nodoProtegido.nextSibling);
    }
    const sel = window.getSelection();
    if (!sel) return true;
    const range = document.createRange();
    range.setStart(nuevoTexto, nuevoTexto.textContent.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
}

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
    return Boolean(obtenerNodoProtegidoAfectadoPorEdicion(e));
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
let modo_seq_actual = 0;
let ultimo_count_seq_escritora = 0;
let tiempo_seq_actual_escritora = 0;
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
let resurreccion_confirmacion_pendiente = false;
let gameover_ui_activa_escritora = false;
let permitir_fin_por_decision_local = false;
let partida_global_finalizada = false;
let listener_modo_psico;
let activado_psico = false;
let temp_text_inverso_activado = false;
let revision_contexto_transitorio_escritora = 0;

function invalidarContextoTransitorioEscritora() {
    revision_contexto_transitorio_escritora += 1;
    clearTimeout(tempo_text_inverso);
    tempo_text_inverso = null;
    clearTimeout(tempo_text_borroso);
    tempo_text_borroso = null;
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    return revision_contexto_transitorio_escritora;
}

function obtenerRevisionContextoTransitorioEscritora() {
    return revision_contexto_transitorio_escritora;
}

function esRevisionContextoTransitorioEscritoraActiva(revision) {
    return revision === revision_contexto_transitorio_escritora;
}

function invalidarEstadoAsincronoEscritora() {
    invalidarContextoTransitorioEscritora();
    if (typeof invalidarBorradoEscritora === "function") {
        invalidarBorradoEscritora();
    }
}

function extraerModoSeqPayload(payload = {}) {
    const valor = Number(payload && payload.modo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function extraerTiempoSeqPayloadEscritora(payload = {}) {
    const valor = Number(payload && payload.tiempo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function aceptarTiempoEscritora(payload = {}, opciones = {}) {
    const { actualizar = true } = opciones;
    const seq = extraerTiempoSeqPayloadEscritora(payload);
    if (seq === null) {
        return true;
    }
    if (seq < tiempo_seq_actual_escritora) {
        return false;
    }
    if (actualizar && seq > tiempo_seq_actual_escritora) {
        tiempo_seq_actual_escritora = seq;
        ultimo_count_seq_escritora = 0;
    }
    return true;
}

function aceptarEventoModoEscritora(payload = {}, opciones = {}) {
    const { actualizar = true } = opciones;
    const seq = extraerModoSeqPayload(payload);
    if (seq === null) {
        return true;
    }
    if (seq < modo_seq_actual) {
        return false;
    }
    if (actualizar && seq > modo_seq_actual) {
        modo_seq_actual = seq;
        ultimo_count_seq_escritora = 0;
        tiempo_seq_actual_escritora = 0;
    }
    return true;
}

function extraerNuevaLetraPayload(payload) {
    if (payload && typeof payload === "object") {
        const letraPayload = typeof payload.letra === "string"
            ? payload.letra
            : (typeof payload.letra_bendita === "string"
                ? payload.letra_bendita
                : (typeof payload.letra_prohibida === "string" ? payload.letra_prohibida : ""));
        return {
            letra: String(letraPayload || "").trim(),
            payload
        };
    }
    return {
        letra: String(payload || "").trim(),
        payload: {}
    };
}

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
  
        // Si el cursor estÃ¡ justo antes de un `contenteditable="false"`, bloqueamos el retroceso
        if (
          startContainer.nodeType === 1 &&
          startOffset === 0 &&
          startContainer.previousSibling &&
          startContainer.previousSibling.getAttribute &&
          startContainer.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault(); // Bloquea la acciÃ³n de retroceso
        }
  
        // Si el cursor estÃ¡ dentro de un nodo de texto, verificamos el anterior
        if (
          startContainer.nodeType === 3 &&
          startOffset === 0 &&
          startContainer.parentNode.previousSibling &&
          startContainer.parentNode.previousSibling.getAttribute &&
          startContainer.parentNode.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault(); // Bloquea la acciÃ³n de retroceso
        }
      }
    }
  });

function insertarConRetrasoTecladoLento(contenido, esSaltoLinea = false) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0).cloneRange();
    if (!texto.contains(range.commonAncestorContainer)) return false;

    range.deleteContents();

    if (esSaltoLinea) {
        const salto = document.createElement("br");
        range.insertNode(salto);
        range.setStartAfter(salto);
    } else {
        const valor = String(contenido ?? "");
        if (!valor) return false;
        const nodoTexto = document.createTextNode(valor);
        range.insertNode(nodoTexto);
        range.setStartAfter(nodoTexto);
    }

    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    texto.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
}

texto.addEventListener("beforeinput", (e) => {
    if (debeVigilarMutacionProtegida(e.inputType)) {
        snapshot_html_bendita = texto.innerHTML;
        snapshot_offset_bendita = obtenerOffsetCaretEnTexto();
        snapshot_cantidad_benditas = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA).length;
        snapshot_input_type_bendita = String(e.inputType || "");
        snapshot_input_data_bendita = e.data ?? "";
    } else {
        limpiarSnapshotProtegido();
    }
    if (debeBloquearEdicionPalabraBendita(e)) {
        e.preventDefault();
        limpiarSnapshotProtegido();
        return;
    }
    if (!teclado_lento_putada) return;
    if (
        e.inputType === "insertText" ||
        e.inputType === "insertParagraph" ||
        e.inputType === "insertLineBreak"
    ) {
        e.preventDefault();
        limpiarSnapshotProtegido();
        const esSaltoLinea = e.inputType === "insertParagraph" || e.inputType === "insertLineBreak";
        const data = esSaltoLinea ? "\n" : (e.data ?? "");
        const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
        setTimeout(() => {
            if (!teclado_lento_putada) return;
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) return;
            insertarConRetrasoTecladoLento(data, esSaltoLinea);
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
        reinsertarEntradaTrasRestauracionProtegida();
        countChars(texto);
        sendText();
        setTimeout(() => {
            restaurando_bendita = false;
        }, 0);
    }
    limpiarSnapshotProtegido();
});

// Se establece la conexiÃ³n con el servidor segÃºn si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl, { autoConnect: false });

