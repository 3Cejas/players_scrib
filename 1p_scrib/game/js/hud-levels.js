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
    if (tipoNorm === "ganar_tiempo" || tipoNorm === "letra_bendita" || tipoNorm === "inspiracion") {
        return "positivo";
    }
    if (tipoNorm === "perder_tiempo" || tipoNorm === "letra_prohibida" || tipoNorm === "lista_prohibidas" || tipoNorm === "borrar") {
        return "negativo";
    }
    const textoNorm = String(texto || "").trim().toLowerCase();
    if (!textoNorm) return "neutro";
    if (textoNorm.includes("perder") || textoNorm.startsWith("-") || /\s-\d/.test(textoNorm)) {
        return "negativo";
    }
    if (textoNorm.includes("insp") || textoNorm.includes("ganar") || textoNorm.startsWith("+") || /\s\+\d/.test(textoNorm)) {
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

const timeout_marcador_escritora = new WeakMap();

const formatearPuntosMarcador = (valor) => {
    return formatearConteoPalabrasI18n1P(valor);
};

const formatearMusasMarcador = (valor) => {
    return formatearConteoMusasI18n1P(valor);
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

actualizarPuntosMarcador(puntos ? puntos.textContent : 0, false);
actualizarMusasMarcador(musas ? musas.textContent : 0, false);

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
let inicio_pausa_nivel_ts_escritora = 0;

const CLASE_INTRO_PARTIDA_ESCRITORA = "partida-intro-escritora";
const CLASES_ETAPAS_INTRO_PARTIDA_ESCRITORA = [
    "partida-intro-stage-tiempo-escritora",
    "partida-intro-stage-marcador-escritora",
    "partida-intro-stage-info-escritora"
];
let secuencia_inicio_escritora_activa = false;
let post_inicio_pendiente_escritora = null;

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
        TIEMPO_CAMBIO_MODOS
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
    inicio_pausa_nivel_ts_escritora = 0;
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

function pausarProgresoNivelBarraEscritora() {
    if (modo_actual === "frase final") return;
    if (!inicio_nivel_ts_escritora || inicio_pausa_nivel_ts_escritora) return;
    inicio_pausa_nivel_ts_escritora = Date.now();
    if (intervalo_progreso_nivel_escritora) {
        clearInterval(intervalo_progreso_nivel_escritora);
        intervalo_progreso_nivel_escritora = null;
    }
}

function reanudarProgresoNivelBarraEscritora() {
    if (modo_actual === "frase final") return;
    if (!inicio_nivel_ts_escritora || !inicio_pausa_nivel_ts_escritora) return;
    const pausaMs = Math.max(0, Date.now() - inicio_pausa_nivel_ts_escritora);
    inicio_pausa_nivel_ts_escritora = 0;
    inicio_nivel_ts_escritora += pausaMs;
    tickProgresoNivelBarraEscritora();
    if (!intervalo_progreso_nivel_escritora) {
        intervalo_progreso_nivel_escritora = setInterval(tickProgresoNivelBarraEscritora, 120);
    }
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

function formatoLetraNivelEscritora(letra) {
    const valor = String(letra || "").trim();
    return valor ? valor.toUpperCase() : "-";
}

function renderLetraDestacadaNivelEscritora(letra) {
    return `<span class="explicacion-letra-destacada">${formatoLetraNivelEscritora(letra)}</span>`;
}

function construirExplicacionNivelLetraEscritora(tipo, letra) {
    const letraDestacada = renderLetraDestacadaNivelEscritora(letra);
    if (tipo === "bendita") {
        return tJuego1P("mode.rule.bendita", { letter: letraDestacada }, `CADA PALABRA DEBE INCLUIR LA LETRA ${letraDestacada}.`);
    }
    if (tipo === "prohibida") {
        return tJuego1P("mode.rule.prohibida", { letter: letraDestacada }, `NINGUNA PALABRA PUEDE USAR LA LETRA ${letraDestacada}.`);
    }
    return "";
}

function escapeHtmlBasico(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function construirTextoPalabraConTiempoEscritora(palabraTexto, tiempoSegundos, tipo = "bendita") {
    const base = String(palabraTexto || "").trim();
    if (!base) return "";
    const tiempoRaw = String(tiempoSegundos ?? "").trim();
    if (!tiempoRaw) return escapeHtmlBasico(base);
    const tiempoLimpio = tiempoRaw.replace(/^[+-]\s*/, "");
    const esMaldita = tipo === "maldita";
    const signo = esMaldita ? "-" : "+";
    const claseTiempo = esMaldita ? "palabra-tiempo--maldita" : "palabra-tiempo--bendita";
    const tiempoTexto = formatearTiempoSegundosI18n1P(tiempoLimpio, { signo });
    return `${escapeHtmlBasico(base)} <span class="palabra-tiempo ${claseTiempo}"><span class="palabra-tiempo-badge">${escapeHtmlBasico(tiempoTexto)}</span></span>`;
}

function renderObjetivoNivelEscritora(palabraTexto, opciones = {}) {
    if (!definicion) return;
    const base = String(palabraTexto || "").trim();
    if (!base) {
        definicion.classList.remove("objetivo-nivel");
        definicion.innerHTML = "";
        return;
    }
    const tipo = String(opciones.tipo || "bonus").trim().toLowerCase();
    const clase = `objetivo-chip--${tipo}`;
    const tiempoSegundos = String(opciones.tiempoSegundos ?? "").trim();
    const descripcion = String(opciones.descripcion || "").trim();
    const textoPalabra = tiempoSegundos
        ? construirTextoPalabraConTiempoEscritora(base, tiempoSegundos, tipo === "prohibidas" ? "maldita" : "bendita")
        : escapeHtmlBasico(base);
    const descripcionHtml = descripcion
        ? `<span class="objetivo-def objetivo-def--${tipo}">${escapeHtmlBasico(descripcion)}</span>`
        : "";
    definicion.classList.add("objetivo-nivel");
    definicion.innerHTML = `<span class="objetivo-chip ${clase}">${textoPalabra}</span>${descripcionHtml}`;
}

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

function finalizarSecuenciaIntroPartidaEscritora() {
    secuencia_inicio_escritora_activa = false;
    revelarEtapaIntroPartidaEscritora(CLASES_ETAPAS_INTRO_PARTIDA_ESCRITORA.length);
    // La intro ya terminó: quitamos clases para no ocultar vida/nombre/marcador durante la partida.
    limpiarClasesIntroPartidaEscritora();
}

