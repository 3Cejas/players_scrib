// Conexion comun al rol. Se deja en autoConnect:false para registrar eventos antes de abrir socket.
const serverUrl = window.isProduction
    ? window.SERVER_URL_PROD
    : window.SERVER_URL_DEV;

const socket = window.io ? io(serverUrl, { autoConnect: false }) : null;

const JURADO_STORAGE_KEY = "scrib_jurado_eval_v1";
const JURADO_PANELS = new Set(["textos", "estadisticas", "inspiracion", "notas", "evaluacion"]);
const JURADO_STAT_META = {
    palabras: { icon: "\u{1F58B}\uFE0F", label: "Palabras" },
    ritmo: { icon: "\u26A1", label: "Ritmo PPM" },
    pulsaciones: { icon: "\u2328\uFE0F", label: "Pulsaciones" },
    teclasDistintas: { icon: "\u{1F3B9}", label: "Teclas distintas" },
    tiempoTotal: { icon: "\u23F1\uFE0F", label: "Tiempo total" },
    tiempoEscritura: { icon: "\u270D\uFE0F", label: "Tiempo escritura" },
    topTeclas: { icon: "\u{1F51D}", label: "Top teclas" },
    graficas: { icon: "\u{1F4C8}", label: "Graficas stats" }
};
const JURADO_CRITERIOS_ESCRITURA = [
    { id: "idea", label: "Idea y mundo" },
    { id: "voz", label: "Voz" },
    { id: "estructura", label: "Estructura" },
    { id: "riesgo", label: "Riesgo" },
    { id: "cierre", label: "Cierre" }
];
const JURADO_CRITERIOS_MUSAS = [
    { id: "inspiracion", label: "Inspiracion util" },
    { id: "escucha", label: "Escucha" },
    { id: "ritmo", label: "Ritmo" },
    { id: "cooperacion", label: "Cooperacion" }
];
const JURADO_STATS_HISTORY_MAX = 80;
let jurado_resultado_emit_timeout = null;

const estado_jurado = {
    panel: "textos",
    modoActual: "partida",
    lastStatsTs: 0,
    writers: {
        1: crearWriterJurado(1),
        2: crearWriterJurado(2)
    },
    evaluacion: cargarEstadoGuardadoJurado()
};

function getEl(id) {
    return document.getElementById(id);
}

function crearWriterJurado(id) {
    return {
        id,
        nombre: `ESCRITXR ${id}`,
        html: "",
        plain: "",
        points: 0,
        chars: 0,
        words: 0,
        musas: 0,
        stats: null,
        statsHistory: [],
        cloud: []
    };
}

function crearEvaluacionVaciaJurado() {
    return {
        writers: {
            1: { notes: "", writing: {}, muses: {} },
            2: { notes: "", writing: {}, muses: {} }
        }
    };
}

function cargarEstadoGuardadoJurado() {
    const base = crearEvaluacionVaciaJurado();
    try {
        const raw = window.localStorage.getItem(JURADO_STORAGE_KEY);
        if (!raw) return base;
        const parsed = JSON.parse(raw);
        [1, 2].forEach((id) => {
            const data = parsed && parsed.writers ? parsed.writers[id] || parsed.writers[String(id)] : null;
            if (!data || typeof data !== "object") return;
            base.writers[id].notes = typeof data.notes === "string" ? data.notes : "";
            base.writers[id].writing = data.writing && typeof data.writing === "object" ? data.writing : {};
            base.writers[id].muses = data.muses && typeof data.muses === "object" ? data.muses : {};
        });
    } catch (error) {
        console.warn("No se pudo cargar evaluacion del jurado", error);
    }
    return base;
}

function guardarEstadoJurado() {
    try {
        window.localStorage.setItem(JURADO_STORAGE_KEY, JSON.stringify(estado_jurado.evaluacion));
    } catch (error) {
        console.warn("No se pudo guardar evaluacion del jurado", error);
    }
}

function escapeHtmlJurado(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function textoPlanoDesdeHtmlJurado(html) {
    const div = document.createElement("div");
    div.innerHTML = String(html || "");
    return (div.innerText || div.textContent || "").replace(/\u00a0/g, " ").trim();
}

function calcularMetricasTextoJurado(texto) {
    const plain = String(texto || "").trim();
    let words = 0;
    if (plain) {
        try {
            words = (plain.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) || []).length;
        } catch (error) {
            words = plain.split(/\s+/).filter(Boolean).length;
        }
    }
    return {
        chars: plain.length,
        words
    };
}

function formatearNumeroJurado(valor, decimales = 0) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return decimales > 0 ? "0.0" : "0";
    return numero.toLocaleString("es-ES", {
        maximumFractionDigits: decimales,
        minimumFractionDigits: decimales
    });
}

function formatearMsJurado(valor) {
    const total = Math.max(0, Number(valor) || 0);
    const mins = Math.floor(total / 60000);
    const secs = Math.floor((total % 60000) / 1000);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatearCantidadJurado(valor, singular, plural) {
    const numero = Math.max(0, extraerNumeroJurado(valor, 0));
    const unidad = numero === 1 ? singular : plural;
    return `${formatearNumeroJurado(numero)} ${unidad}`;
}

function setTextoJurado(id, texto) {
    const el = getEl(id);
    if (el) el.textContent = texto;
}

function setHtmlJurado(id, html) {
    const el = getEl(id);
    if (el) el.innerHTML = html;
}

function setConexionJurado(conectado, detalle = "") {
    const dot = getEl("jurado_status_dot");
    const text = getEl("jurado_status_text");
    const activo = Boolean(conectado);
    if (dot) {
        dot.classList.remove("conexion-dot--ok", "conexion-dot--warn", "conexion-dot--off", "conexion-dot--ping");
        dot.classList.add(activo ? "conexion-dot--ok" : "conexion-dot--off");
        dot.dataset.status = activo ? "ok" : "off";
        if (activo) {
            void dot.offsetWidth;
            dot.classList.add("conexion-dot--ping");
        }
    }
    if (text) {
        text.textContent = activo ? "CONECTADO" : "DESCONECTADO";
        text.classList.toggle("is-off", !activo);
    }
}

function actualizarModoJurado(modo) {
    const limpio = String(modo || "partida").trim() || "partida";
    estado_jurado.modoActual = limpio;
}

function setPanelJurado(panel) {
    const siguiente = JURADO_PANELS.has(panel) ? panel : "textos";
    estado_jurado.panel = siguiente;
    document.querySelectorAll("[data-jury-panel]").forEach((button) => {
        const activo = button.dataset.juryPanel === siguiente;
        button.classList.toggle("is-active", activo);
        button.setAttribute("aria-selected", activo ? "true" : "false");
    });
    document.querySelectorAll("[data-jury-panel-target]").forEach((section) => {
        section.classList.toggle("is-active", section.dataset.juryPanelTarget === siguiente);
    });
}

function actualizarNombreJurado(id, nombre) {
    const writerId = Number(id);
    if (writerId !== 1 && writerId !== 2) return;
    const texto = String(nombre || "").trim() || `ESCRITXR ${writerId}`;
    estado_jurado.writers[writerId].nombre = texto;
    [
        `jurado_nombre_${writerId}`,
        `jurado_stats_nombre_${writerId}`,
        `jurado_cloud_nombre_${writerId}`,
        `jurado_notes_nombre_${writerId}`,
        `jurado_eval_nombre_${writerId}`
    ].forEach((domId) => setTextoJurado(domId, texto));
    programarResultadoJurado();
}

function extraerNumeroJurado(valor, fallback = 0) {
    const numero = Number(valor);
    if (Number.isFinite(numero)) return numero;
    const match = String(valor ?? "").match(/-?\d+(?:[.,]\d+)?/);
    if (!match) return fallback;
    const parsed = Number(match[0].replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizarPaqueteTextoJurado(paquete) {
    if (typeof paquete === "string") {
        return { text: paquete, points: null };
    }
    const data = paquete && typeof paquete === "object" ? paquete : {};
    return {
        text: typeof data.text === "string" ? data.text : "",
        points: data.points ?? data.puntos ?? null
    };
}

function aplicarTextoJurado(id, paquete) {
    const writerId = Number(id);
    if (writerId !== 1 && writerId !== 2) return;
    const data = normalizarPaqueteTextoJurado(paquete);
    const writer = estado_jurado.writers[writerId];
    const html = String(data.text || "");
    writer.html = html;
    writer.plain = textoPlanoDesdeHtmlJurado(html);
    const metricas = calcularMetricasTextoJurado(writer.plain);
    writer.chars = metricas.chars;
    writer.words = data.points === null || typeof data.points === "undefined"
        ? metricas.words
        : Math.max(0, extraerNumeroJurado(data.points, metricas.words));
    writer.points = writer.words;
    renderWriterTextoJurado(writerId);
    renderStatsJurado(writerId);
}

function renderWriterTextoJurado(id) {
    const writer = estado_jurado.writers[id];
    if (!writer) return;
    setHtmlJurado(`jurado_texto_${id}`, writer.html || "");
    setTextoJurado(`jurado_words_${id}`, formatearCantidadJurado(writer.words, "palabra", "palabras"));
    setTextoJurado(`jurado_musas_${id}`, formatearCantidadJurado(writer.musas, "musa", "musas"));
    renderPulsacionesJurado(id);
}

function renderPulsacionesJurado(id) {
    const writer = estado_jurado.writers[id];
    const bar = getEl(`jurado_pulsaciones_${id}`);
    const label = getEl(`jurado_pulsaciones_label_${id}`);
    if (!writer || !bar) return;
    const stats = writer.stats || {};
    const actual = Math.max(0, Number(stats.pulsacionesTotal) || 0);
    const texto = formatearNumeroJurado(actual);
    bar.style.setProperty("--pulse-pct", actual > 0 ? "100%" : "0%");
    bar.title = `Pulsaciones: ${texto}`;
    if (label) label.textContent = texto;
}

function aplicarMusasJurado(payload = {}) {
    const data = payload && typeof payload === "object" ? payload : {};
    const valores = {
        1: data.escritxr1 ?? data[1] ?? data.j1 ?? 0,
        2: data.escritxr2 ?? data[2] ?? data.j2 ?? 0
    };
    [1, 2].forEach((id) => {
        estado_jurado.writers[id].musas = Math.max(0, extraerNumeroJurado(valores[id], 0));
        renderWriterTextoJurado(id);
        renderStatsJurado(id);
    });
}

function obtenerJugadorStatsJurado(payload, id) {
    const players = payload && payload.players && typeof payload.players === "object" ? payload.players : {};
    return players[id] || players[String(id)] || {};
}

function normalizarStatsJugadorJurado(data = {}, id) {
    const topTeclas = Array.isArray(data.topTeclas) ? data.topTeclas.slice(0, 8) : [];
    return {
        nombre: String(data.nombre || estado_jurado.writers[id].nombre || `ESCRITXR ${id}`),
        palabrasTotal: Math.max(0, extraerNumeroJurado(data.palabrasTotal ?? data.wordsTotal ?? data.palabras ?? data.words, estado_jurado.writers[id].words)),
        pulsacionesTotal: Math.max(0, extraerNumeroJurado(data.pulsacionesTotal ?? data.keystrokesTotal ?? data.pulsaciones, 0)),
        teclasDistintas: Math.max(0, extraerNumeroJurado(data.teclasDistintas ?? data.distinctKeys, 0)),
        ritmoPpm: Math.max(0, Number(data.ritmoPpm ?? data.ppm ?? 0) || 0),
        tiempoTotalMs: Math.max(0, Number(data.tiempoTotalMs ?? data.totalMs ?? 0) || 0),
        tiempoEscrituraMs: Math.max(0, Number(data.tiempoEscrituraMs ?? data.writingMs ?? 0) || 0),
        topTeclas,
        heatmap: normalizarHeatmapJurado(data.heatmap, topTeclas)
    };
}

function normalizarTopTeclaJurado(item) {
    if (typeof item === "string") {
        const code = item.trim();
        return code ? { code, label: code, count: 1 } : null;
    }
    const data = item && typeof item === "object" ? item : {};
    const code = String(data.code ?? data.key ?? data.label ?? data.tecla ?? "").trim().slice(0, 24);
    const label = String(data.label ?? data.key ?? data.tecla ?? data.code ?? code).trim().slice(0, 12);
    const count = Math.max(0, extraerNumeroJurado(data.count ?? data.valor ?? data.total ?? 0, 0));
    if (!code && !label) return null;
    return { code: code || label, label: label || code, count };
}

function normalizarTopTeclasGraficaJurado(topTeclas = []) {
    if (!Array.isArray(topTeclas)) return [];
    return topTeclas
        .map(normalizarTopTeclaJurado)
        .filter((item) => item && item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
}

function normalizarHeatmapJurado(entrada, topTeclasFallback = []) {
    const salida = {};
    const pushTecla = (code, count) => {
        const codigo = String(code || "").trim().slice(0, 24);
        const valor = Math.max(0, extraerNumeroJurado(count, 0));
        if (!codigo || valor <= 0) return;
        if (Object.keys(salida).length >= 96 && !Object.prototype.hasOwnProperty.call(salida, codigo)) return;
        salida[codigo] = (salida[codigo] || 0) + valor;
    };
    if (entrada && typeof entrada === "object") {
        if (Array.isArray(entrada)) {
            entrada.forEach((item) => {
                if (!item || typeof item !== "object") return;
                pushTecla(item.code ?? item.key ?? item.label ?? item.tecla, item.count ?? item.valor ?? item.total);
            });
        } else {
            Object.keys(entrada).forEach((code) => pushTecla(code, entrada[code]));
        }
    }
    if (!Object.keys(salida).length) {
        normalizarTopTeclasGraficaJurado(topTeclasFallback).forEach((item) => pushTecla(item.code, item.count));
    }
    return salida;
}

function registrarMiniStatsJurado(id, stats = {}) {
    const writer = estado_jurado.writers[id];
    if (!writer) return;
    const ritmo = Number(stats.ritmoPpm);
    const palabras = Number(stats.palabrasTotal);
    const pulsaciones = Number(stats.pulsacionesTotal);
    const hayDato = [ritmo, palabras, pulsaciones].some(Number.isFinite);
    if (!hayDato) return;
    let t = Number(stats.tiempoTotalMs);
    if (!Number.isFinite(t) || t <= 0) {
        t = estado_jurado.lastStatsTs || Date.now();
    }
    const punto = {
        t: Math.max(0, t),
        r: Number.isFinite(ritmo) ? Math.max(0, ritmo) : null,
        p: Number.isFinite(palabras) ? Math.max(0, palabras) : null,
        k: Number.isFinite(pulsaciones) ? Math.max(0, pulsaciones) : null
    };
    const serie = writer.statsHistory;
    const ultimo = serie.length ? serie[serie.length - 1] : null;
    if (ultimo && Math.abs(ultimo.t - punto.t) < 500) {
        serie[serie.length - 1] = punto;
    } else {
        serie.push(punto);
    }
    while (serie.length > JURADO_STATS_HISTORY_MAX) {
        serie.shift();
    }
}

function aplicarStatsLiveJurado(payload = {}) {
    const data = payload && typeof payload === "object" ? payload : {};
    estado_jurado.lastStatsTs = Number(data.ts) || Date.now();
    if (data.modo_actual) {
        actualizarModoJurado(data.modo_actual);
    }
    [1, 2].forEach((id) => {
        const stats = normalizarStatsJugadorJurado(obtenerJugadorStatsJurado(data, id), id);
        estado_jurado.writers[id].stats = stats;
        registrarMiniStatsJurado(id, stats);
        if (stats.nombre) actualizarNombreJurado(id, stats.nombre);
        renderStatsJurado(id);
    });
    const fecha = new Date(estado_jurado.lastStatsTs);
    setTextoJurado("jurado_last_update", `Actualizado: ${fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
}

function resumirTopTeclasJurado(topTeclas) {
    if (!Array.isArray(topTeclas) || !topTeclas.length) return "Sin datos";
    return topTeclas.map((item) => {
        if (typeof item === "string") return item;
        const code = item && (item.label || item.code || item.key || item.tecla) ? (item.label || item.code || item.key || item.tecla) : "?";
        const count = item && (item.count ?? item.valor ?? item.total);
        return `${code}${typeof count !== "undefined" ? ` (${count})` : ""}`;
    }).join(", ");
}

function obtenerStatMetaJurado(statId) {
    return JURADO_STAT_META[statId] || { icon: "\u25A0", label: statId };
}

function crearStatCardJurado(statId, value, wide = false) {
    const meta = obtenerStatMetaJurado(statId);
    return `
        <div class="stat-card${wide ? " stat-card--wide" : ""}" data-stat="${escapeHtmlJurado(statId)}">
            <span class="stat-card__label">
                <span class="stat-card__icon" aria-hidden="true">${escapeHtmlJurado(meta.icon)}</span>
                <em>${escapeHtmlJurado(meta.label)}</em>
            </span>
            <strong>${escapeHtmlJurado(value)}</strong>
        </div>
    `;
}

function obtenerTopTeclasMiniJurado(stats = {}) {
    const top = normalizarTopTeclasGraficaJurado(stats.topTeclas);
    if (top.length) return top;
    const heatmap = stats.heatmap && typeof stats.heatmap === "object" ? stats.heatmap : {};
    return Object.keys(heatmap)
        .map((code) => ({ code, label: code, count: Math.max(0, extraerNumeroJurado(heatmap[code], 0)) }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
}

function crearMiniBarrasTeclasJurado(stats = {}) {
    const top = obtenerTopTeclasMiniJurado(stats);
    if (!top.length) {
        return `<div class="mini-stats-empty">Esperando teclas</div>`;
    }
    const max = Math.max(1, ...top.map((item) => item.count));
    return `
        <div class="mini-key-bars">
            ${top.map((item) => {
                const pct = Math.max(6, Math.min(100, (item.count / max) * 100));
                const label = item.label || item.code || "?";
                return `
                    <div class="mini-key-row" title="${escapeHtmlJurado(`${label} (${item.count})`)}">
                        <span class="mini-key-label">${escapeHtmlJurado(label)}</span>
                        <span class="mini-key-track"><i class="mini-key-fill" style="--bar-pct:${pct.toFixed(1)}%;"></i></span>
                        <em>${escapeHtmlJurado(formatearNumeroJurado(item.count))}</em>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderMiniGraficasStatsJurado(id, stats = {}) {
    const pulsaciones = Math.max(0, Number(stats.pulsacionesTotal) || 0);
    const meta = obtenerStatMetaJurado("graficas");
    return `
        <div class="stat-card stat-card--wide mini-stats-card">
            <span class="stat-card__label">
                <span class="stat-card__icon" aria-hidden="true">${escapeHtmlJurado(meta.icon)}</span>
                <em>${escapeHtmlJurado(meta.label)}</em>
            </span>
            <div class="mini-stats-layout">
                <section class="mini-stats-chart" aria-label="Grafica de teclas">
                    <header class="mini-stats-chart__title">
                        <span><i aria-hidden="true">\u2328\uFE0F</i> TECLAS</span>
                        <strong>${escapeHtmlJurado(formatearNumeroJurado(pulsaciones))}</strong>
                    </header>
                    ${crearMiniBarrasTeclasJurado(stats)}
                </section>
            </div>
        </div>
    `;
}

function renderStatsJurado(id) {
    const writer = estado_jurado.writers[id];
    if (writer) renderPulsacionesJurado(id);
    const contenedor = getEl(`jurado_stats_${id}`);
    if (!writer || !contenedor) return;
    const stats = writer.stats || {};
    const palabras = stats.palabrasTotal || writer.words;
    const html = [
        crearStatCardJurado("palabras", formatearNumeroJurado(palabras)),
        crearStatCardJurado("ritmo", formatearNumeroJurado(stats.ritmoPpm || 0, 1)),
        crearStatCardJurado("pulsaciones", formatearNumeroJurado(stats.pulsacionesTotal || 0)),
        crearStatCardJurado("teclasDistintas", formatearNumeroJurado(stats.teclasDistintas || 0)),
        crearStatCardJurado("tiempoTotal", formatearMsJurado(stats.tiempoTotalMs || 0)),
        crearStatCardJurado("tiempoEscritura", formatearMsJurado(stats.tiempoEscrituraMs || 0)),
        crearStatCardJurado("topTeclas", resumirTopTeclasJurado(stats.topTeclas), true),
        renderMiniGraficasStatsJurado(id, stats)
    ].join("");
    contenedor.innerHTML = html;
}

function normalizarPalabraNubeJurado(entrada) {
    if (typeof entrada === "string") {
        const palabra = entrada.trim();
        return palabra ? { palabra, count: 1, musas: [] } : null;
    }
    const data = entrada && typeof entrada === "object" ? entrada : {};
    const palabra = String(data.palabra ?? data.texto ?? data.word ?? data.valor ?? "").trim();
    if (!palabra) return null;
    const count = Math.max(1, extraerNumeroJurado(
        data.count ?? data.repeticiones ?? data.usos ?? data.total ?? data.veces ?? 1,
        1
    ));
    const firma = window.ScribInspiration && typeof window.ScribInspiration.normalizarFirmaMusa === "function"
        ? window.ScribInspiration.normalizarFirmaMusa(data, {
            fallback: false,
            maxAutores: 6,
            maxNombre: 24,
            maxVisibles: 2
        })
        : { autores: [], texto: "", completo: "" };
    return { palabra, count, musas: firma.autores };
}

function aplicarNubeInspiracionJurado(payload = {}) {
    const equipos = payload && payload.equipos && typeof payload.equipos === "object"
        ? payload.equipos
        : (payload && payload.teams && typeof payload.teams === "object" ? payload.teams : {});
    [1, 2].forEach((id) => {
        const equipo = equipos[id] || equipos[String(id)] || {};
        const base = Array.isArray(equipo.palabras_info)
            ? equipo.palabras_info
            : (Array.isArray(equipo.palabras) ? equipo.palabras : []);
        estado_jurado.writers[id].cloud = base
            .map(normalizarPalabraNubeJurado)
            .filter(Boolean)
            .slice(0, 80);
        renderNubeJurado(id);
    });
}

function renderNubeJurado(id) {
    const writer = estado_jurado.writers[id];
    const contenedor = getEl(`jurado_cloud_${id}`);
    if (!writer || !contenedor) return;
    contenedor.innerHTML = "";
    const fragment = document.createDocumentFragment();
    writer.cloud.forEach((item) => {
        const span = document.createElement("span");
        span.className = `cloud-word cloud-word--${id}`;
        span.dataset.size = String(Math.min(3, Math.max(1, item.count)));
        const palabra = document.createElement("span");
        palabra.className = "cloud-word__text";
        palabra.textContent = item.palabra;
        span.appendChild(palabra);
        const firma = window.ScribInspiration && typeof window.ScribInspiration.normalizarFirmaMusa === "function"
            ? window.ScribInspiration.normalizarFirmaMusa({ musas: item.musas }, {
                fallback: false,
                maxAutores: 6,
                maxNombre: 24,
                maxVisibles: 2
            })
            : { texto: "", completo: "" };
        if (firma.texto) {
            const autora = document.createElement("span");
            autora.className = "cloud-word__author";
            autora.textContent = `\u2726 ${firma.texto}`;
            autora.title = `Inspiraci\u00f3n de ${firma.completo}`;
            span.appendChild(autora);
        }
        const detalleAutora = firma.completo ? `, inspiraci\u00f3n de ${firma.completo}` : "";
        span.title = `${item.count} usos${detalleAutora}`;
        span.setAttribute("aria-label", `${item.palabra}, ${item.count} usos${detalleAutora}`);
        fragment.appendChild(span);
    });
    contenedor.appendChild(fragment);
}

function obtenerEvalWriterJurado(id) {
    const writerId = Number(id);
    const evaluacion = estado_jurado.evaluacion;
    evaluacion.writers[writerId] = evaluacion.writers[writerId] || { notes: "", writing: {}, muses: {} };
    evaluacion.writers[writerId].writing = evaluacion.writers[writerId].writing || {};
    evaluacion.writers[writerId].muses = evaluacion.writers[writerId].muses || {};
    return evaluacion.writers[writerId];
}

function obtenerValorCriterioJurado(id, scope, criterioId) {
    const writer = obtenerEvalWriterJurado(id);
    const scopeData = writer[scope] || {};
    const valor = Number(scopeData[criterioId]);
    return Number.isFinite(valor) ? Math.max(0, Math.min(10, valor)) : 0;
}

function setValorCriterioJurado(id, scope, criterioId, valor) {
    const writer = obtenerEvalWriterJurado(id);
    writer[scope] = writer[scope] || {};
    writer[scope][criterioId] = Math.max(0, Math.min(10, Number(valor) || 0));
    guardarEstadoJurado();
    actualizarTotalEvaluacionJurado(id);
    programarResultadoJurado();
}

function calcularTotalResultadoJurado(id) {
    const valores = [];
    JURADO_CRITERIOS_ESCRITURA.forEach((criterio) => valores.push(obtenerValorCriterioJurado(id, "writing", criterio.id)));
    JURADO_CRITERIOS_MUSAS.forEach((criterio) => valores.push(obtenerValorCriterioJurado(id, "muses", criterio.id)));
    return valores.length ? valores.reduce((sum, valor) => sum + valor, 0) / valores.length : 0;
}

function construirResultadoJurado() {
    const total1 = calcularTotalResultadoJurado(1);
    const total2 = calcularTotalResultadoJurado(2);
    const criterios = [
        ...JURADO_CRITERIOS_ESCRITURA.map((criterio) => ({ scope: "writing", ...criterio })),
        ...JURADO_CRITERIOS_MUSAS.map((criterio) => ({ scope: "muses", ...criterio }))
    ].map((criterio) => ({
        id: criterio.id,
        scope: criterio.scope,
        label: criterio.label,
        valores: {
            1: obtenerValorCriterioJurado(1, criterio.scope, criterio.id),
            2: obtenerValorCriterioJurado(2, criterio.scope, criterio.id)
        }
    }));
    return {
        disponible: total1 > 0 && total2 > 0,
        jugadores: {
            1: { nombre: estado_jurado.writers[1].nombre, total: total1 },
            2: { nombre: estado_jurado.writers[2].nombre, total: total2 }
        },
        criterios
    };
}

function emitirResultadoJurado() {
    if (!socket || !socket.connected) return false;
    socket.emit("jurado_resultado_actualizar", construirResultadoJurado());
    return true;
}

function programarResultadoJurado() {
    if (jurado_resultado_emit_timeout) clearTimeout(jurado_resultado_emit_timeout);
    jurado_resultado_emit_timeout = setTimeout(() => {
        jurado_resultado_emit_timeout = null;
        emitirResultadoJurado();
    }, 140);
}

function crearControlCriterioJurado(id, scope, criterio, labelId) {
    const valor = obtenerValorCriterioJurado(id, scope, criterio.id);
    const inputId = `jurado_eval_${scope}_${id}_${criterio.id}`;
    const control = document.createElement("div");
    control.className = `criteria-control criteria-control--${id}`;
    control.innerHTML = `
        <input id="${escapeHtmlJurado(inputId)}" type="range" min="0" max="10" step="1" value="${valor}" aria-labelledby="${escapeHtmlJurado(labelId)}" data-eval-scope="${escapeHtmlJurado(scope)}" data-writer="${id}" data-eval-id="${escapeHtmlJurado(criterio.id)}">
        <output for="${escapeHtmlJurado(inputId)}">${valor}</output>
    `;
    const input = control.querySelector("input");
    const output = control.querySelector("output");
    input.addEventListener("input", () => {
        output.textContent = input.value;
        setValorCriterioJurado(id, scope, criterio.id, input.value);
    });
    return control;
}

function crearFilaCriterioJurado(scope, criterio) {
    const row = document.createElement("div");
    const labelId = `jurado_eval_label_${scope}_${criterio.id}`;
    row.className = "criteria-row criteria-row--comparison";
    row.dataset.evalScope = scope;
    row.dataset.evalId = criterio.id;
    row.innerHTML = `<span id="${escapeHtmlJurado(labelId)}" class="criteria-row__label">${escapeHtmlJurado(criterio.label)}</span>`;
    row.appendChild(crearControlCriterioJurado(1, scope, criterio, labelId));
    row.appendChild(crearControlCriterioJurado(2, scope, criterio, labelId));
    return row;
}

function renderEvaluacionJurado() {
    const writing = getEl("jurado_eval_writing");
    const muses = getEl("jurado_eval_muses");
    if (writing) {
        writing.innerHTML = "";
        JURADO_CRITERIOS_ESCRITURA.forEach((criterio) => writing.appendChild(crearFilaCriterioJurado("writing", criterio)));
    }
    if (muses) {
        muses.innerHTML = "";
        JURADO_CRITERIOS_MUSAS.forEach((criterio) => muses.appendChild(crearFilaCriterioJurado("muses", criterio)));
    }
    [1, 2].forEach(actualizarTotalEvaluacionJurado);
}

function actualizarTotalEvaluacionJurado(id) {
    const valores = [];
    JURADO_CRITERIOS_ESCRITURA.forEach((criterio) => valores.push(obtenerValorCriterioJurado(id, "writing", criterio.id)));
    JURADO_CRITERIOS_MUSAS.forEach((criterio) => valores.push(obtenerValorCriterioJurado(id, "muses", criterio.id)));
    const media = valores.length ? valores.reduce((sum, valor) => sum + valor, 0) / valores.length : 0;
    setTextoJurado(`jurado_eval_total_${id}`, formatearNumeroJurado(media, 1));
}

function inicializarNotasJurado() {
    [1, 2].forEach((id) => {
        const textarea = getEl(`jurado_nota_${id}`);
        if (!textarea) return;
        textarea.value = obtenerEvalWriterJurado(id).notes || "";
        textarea.addEventListener("input", () => {
            obtenerEvalWriterJurado(id).notes = textarea.value;
            guardarEstadoJurado();
        });
    });
}

function refrescarDatosJurado() {
    if (!socket || !socket.connected) return;
    socket.emit("pedir_stats_live");
    socket.emit("pedir_nube_inspiracion");
    socket.emit("pedir_idioma_actual");
}

function construirBloqueEvaluacionResumenJurado(id) {
    const writer = estado_jurado.writers[id];
    const evalWriter = obtenerEvalWriterJurado(id);
    const writing = JURADO_CRITERIOS_ESCRITURA.map((criterio) => `${criterio.label}: ${obtenerValorCriterioJurado(id, "writing", criterio.id)}/10`).join("; ");
    const muses = JURADO_CRITERIOS_MUSAS.map((criterio) => `${criterio.label}: ${obtenerValorCriterioJurado(id, "muses", criterio.id)}/10`).join("; ");
    return [
        `${writer.nombre}`,
        `\u{1F58B}\uFE0F Palabras: ${writer.words} | \u{1F3A8} Musas: ${writer.musas}`,
        `Texto: ${writing}`,
        `Musas: ${muses}`,
        `Notas: ${evalWriter.notes || ""}`
    ].join("\n");
}

function copiarTextoPortapapelesJurado(texto) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        return navigator.clipboard.writeText(texto);
    }
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return Promise.resolve();
}

function copiarResumenJurado() {
    const texto = [
        "SCRIB - Resumen jurado",
        `Modo: ${estado_jurado.modoActual}`,
        "",
        construirBloqueEvaluacionResumenJurado(1),
        "",
        construirBloqueEvaluacionResumenJurado(2)
    ].join("\n");
    const boton = getEl("jurado_copiar_resumen");
    return copiarTextoPortapapelesJurado(texto).then(() => {
        if (!boton) return;
        const previo = boton.textContent;
        boton.textContent = "Copiado";
        setTimeout(() => {
            boton.textContent = previo;
        }, 1400);
    });
}

function limpiarEvaluacionJurado() {
    if (!window.confirm("Limpiar notas y evaluacion del jurado?")) return;
    estado_jurado.evaluacion = crearEvaluacionVaciaJurado();
    guardarEstadoJurado();
    inicializarNotasJurado();
    renderEvaluacionJurado();
    programarResultadoJurado();
}

function inicializarInterfazJurado() {
    document.querySelectorAll("[data-jury-panel]").forEach((button) => {
        button.addEventListener("click", () => setPanelJurado(button.dataset.juryPanel));
    });
    const copiar = getEl("jurado_copiar_resumen");
    if (copiar) copiar.addEventListener("click", copiarResumenJurado);
    const reset = getEl("jurado_reset_eval");
    if (reset) reset.addEventListener("click", limpiarEvaluacionJurado);
    inicializarNotasJurado();
    renderEvaluacionJurado();
    actualizarNombreJurado(1, estado_jurado.writers[1].nombre);
    actualizarNombreJurado(2, estado_jurado.writers[2].nombre);
    renderWriterTextoJurado(1);
    renderWriterTextoJurado(2);
    renderStatsJurado(1);
    renderStatsJurado(2);
    setPanelJurado("textos");
    if (socket && typeof socket.connect === "function") {
        socket.connect();
    } else {
        setConexionJurado(false, "SIN SOCKET");
    }
}

window.scribJurado = {
    estado: estado_jurado,
    setPanelJurado,
    refrescarDatosJurado,
    copiarResumenJurado,
    emitirResultadoJurado
};
window.setConexionJurado = setConexionJurado;
window.actualizarModoJurado = actualizarModoJurado;
window.actualizarNombreJurado = actualizarNombreJurado;
window.aplicarTextoJurado = aplicarTextoJurado;
window.aplicarMusasJurado = aplicarMusasJurado;
window.aplicarStatsLiveJurado = aplicarStatsLiveJurado;
window.aplicarNubeInspiracionJurado = aplicarNubeInspiracionJurado;
window.inicializarInterfazJurado = inicializarInterfazJurado;
