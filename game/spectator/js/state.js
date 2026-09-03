// Se establece la conexiï¿½fÂ³n con el servidor segï¿½fÂºn si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl, { autoConnect: false });

const getEl = id => document.getElementById(id); // Obtiene los elementos con id.
const escapeHtml = (valor) => String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const normalizarFirmaMusaEspectador = (payload = {}, opciones = {}) => {
    if (window.ScribInspiration && typeof window.ScribInspiration.normalizarFirmaMusa === "function") {
        return window.ScribInspiration.normalizarFirmaMusa(payload, opciones);
    }
    const valor = payload && typeof payload === "object"
        ? (payload.musa_nombre || payload.nombre_musa || payload.musa || "")
        : payload;
    const nombre = String(valor || "").trim().slice(0, 24).toUpperCase() || (opciones.fallback === false ? "" : "MUSA");
    return { autores: nombre ? [nombre] : [], texto: nombre, completo: nombre };
};
const construirFirmaMusaHtmlEspectador = (payload = {}, clase = "") => {
    const firma = normalizarFirmaMusaEspectador(payload);
    if (!firma.texto) return "";
    const clases = ["inspiration-author", clase].filter(Boolean).join(" ");
    return `<span class="${clases}" title="${escapeHtml(firma.completo)}"><span class="inspiration-author__spark" aria-hidden="true">✦</span><span class="inspiration-author__name">${escapeHtml(firma.texto)}</span></span>`;
};
const crearNodoFirmaMusaEspectador = (payload = {}, clase = "") => {
    const firma = normalizarFirmaMusaEspectador(payload);
    if (!firma.texto) return null;
    const nodo = document.createElement("span");
    nodo.className = ["inspiration-author", clase].filter(Boolean).join(" ");
    nodo.title = firma.completo;
    nodo.setAttribute("aria-label", `Musa: ${firma.completo}`);
    const destello = document.createElement("span");
    destello.className = "inspiration-author__spark";
    destello.setAttribute("aria-hidden", "true");
    destello.textContent = "✦";
    const nombre = document.createElement("span");
    nombre.className = "inspiration-author__name";
    nombre.textContent = firma.texto;
    nodo.append(destello, nombre);
    return nodo;
};
const tJuego2P = (clave, variables = {}, fallback = "") => (
    (window && typeof window.scribT2P === "function")
        ? window.scribT2P(clave, variables, fallback)
        : (fallback || clave)
);
const apiTransicionNivelEspectador = window && window.ScribLevelTransition;
const controladorTransicionNivelEspectador = apiTransicionNivelEspectador
    ? apiTransicionNivelEspectador.createController({
        root: getEl("level_transition"),
        liveRegion: getEl("level_transition_status"),
        translate: tJuego2P,
        windowRef: window,
        documentRef: document
    })
    : null;
const seguimientoTransicionNivelEspectador = apiTransicionNivelEspectador
    ? apiTransicionNivelEspectador.createModeTracker()
    : null;
let transicionNivelPendienteEspectador = null;

function observarModoCanonicoTransicionEspectador(payload = {}) {
    if (!seguimientoTransicionNivelEspectador) {
        return { accepted: false, baseline: false, transition: false };
    }
    return seguimientoTransicionNivelEspectador.observe(payload);
}

function mostrarTransicionNivelEspectador(observacion, payload = {}) {
    if (!observacion || !observacion.transition || !controladorTransicionNivelEspectador) return false;
    if (vista_espectador_modo_resuelta !== "partida") return false;
    return controladorTransicionNivelEspectador.show(observacion.mode, payload);
}

function ocultarTransicionNivelEspectador() {
    controladorTransicionNivelEspectador?.hide();
}

function aplazarTransicionNivelEspectador(observacion, payload = {}) {
    if (!observacion || !observacion.transition) return false;
    transicionNivelPendienteEspectador = {
        observacion,
        payload: payload && typeof payload === "object" ? { ...payload } : {}
    };
    return true;
}

function mostrarTransicionNivelPendienteEspectador(modoAplicado) {
    if (!transicionNivelPendienteEspectador) return false;
    const pendiente = transicionNivelPendienteEspectador;
    transicionNivelPendienteEspectador = null;
    if (apiTransicionNivelEspectador?.normalizeMode(modoAplicado) !== pendiente.observacion.mode) {
        return false;
    }
    return mostrarTransicionNivelEspectador(pendiente.observacion, pendiente.payload);
}

function reiniciarSeguimientoTransicionNivelEspectador(opciones = {}) {
    seguimientoTransicionNivelEspectador?.reset();
    transicionNivelPendienteEspectador = null;
    ocultarTransicionNivelEspectador();
    if (opciones.primeEmpty) {
        seguimientoTransicionNivelEspectador?.observe({ modo_actual: "", modo_seq: 0 });
    }
}
const traducirTituloModoEspectador = (modo, fallback = "") => (
    (window && typeof window.scribTranslateModeTitle2P === "function")
        ? window.scribTranslateModeTitle2P(modo, fallback || String(modo || "").toUpperCase())
        : (fallback || String(modo || "").toUpperCase())
);
const traducirNombreModoEspectador = (modo, fallback = "") => (
    (window && typeof window.scribTranslateModeName2P === "function")
        ? window.scribTranslateModeName2P(modo, fallback || String(modo || "").toUpperCase())
        : (fallback || String(modo || "").toUpperCase())
);
const traducirDescripcionModoEspectador = (modo, fallback = "") => (
    (window && typeof window.scribTranslateModeDescription2P === "function")
        ? window.scribTranslateModeDescription2P(modo, fallback)
        : fallback
);
const formatearPalabrasEspectador = (valor) => (
    (window && typeof window.scribFormatWordsCount2P === "function")
        ? window.scribFormatWordsCount2P(valor)
        : `${Number(valor) || 0} palabras`
);
const formatearMusasEspectador = (valor) => (
    (window && typeof window.scribFormatMusesCount2P === "function")
        ? window.scribFormatMusesCount2P(valor)
        : `${Number(valor) || 0} musas`
);
const traducirSolicitudCalentamientoEspectador = (tipo, opciones = {}) => (
    (window && typeof window.scribTranslateWarmupRequest2P === "function")
        ? window.scribTranslateWarmupRequest2P(tipo, opciones)
        : String(tipo || "").toUpperCase()
);
const traducirNombreEscritoraEspectador = (id, fallback = "") => (
    (window && typeof window.scribTranslateWriterName2P === "function")
        ? window.scribTranslateWriterName2P(id, fallback)
        : (fallback || `ESCRITXR ${id}`)
);
const textoTiempoAgotadoEspectador = () => (
    tJuego2P("timer.time_up", {}, "Â¡Tiempo!")
);

const paddedFormat = (num) => (num < 10 ? `0${num}` : `${num}`);

const refrescarCountdownEspectador = () => {
    if (window && typeof window.scribRefreshCountdownText2P === "function") {
        window.scribRefreshCountdownText2P(getEl("countdown"));
    }
};

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
    nodo.innerHTML = `
        <div class="temporizador-gigante__rayos" aria-hidden="true"></div>
        <div class="temporizador-gigante__panel">
            <p class="temporizador-gigante__eyebrow">CUENTA ATR&Aacute;S PARA LA REPRESENTACI&Oacute;N</p>
            <div class="temporizador-gigante__ring" aria-hidden="true">
                <div class="temporizador-gigante__ring-inner">
                    <strong id="temporizador_gigante_valor">10:00</strong>
                    <span>PREPARAD EL ESCENARIO</span>
                </div>
            </div>
            <div class="temporizador-gigante__final" hidden>
                <span aria-hidden="true">&#x2728;</span>
                <h2>&iexcl;ES LA HORA!</h2>
                <p>Es hora de ver la representaci&oacute;n de los textos.</p>
            </div>
        </div>`;
    return nodo;
})();

let temporizador_gigante_interval = null;
let temporizador_gigante_restante = 0;
let temporizador_gigante_duracion = 0;
let temporizador_gigante_fin_ts = 0;

function actualizarTemporizadorGigante() {
    if (temporizador_gigante_fin_ts > 0) {
        temporizador_gigante_restante = Math.max(0, Math.ceil((temporizador_gigante_fin_ts - Date.now()) / 1000));
    }
    const minutos = Math.floor(temporizador_gigante_restante / 60);
    const segundos = temporizador_gigante_restante % 60;
    const valor = getEl("temporizador_gigante_valor");
    const ring = temporizador_gigante.querySelector(".temporizador-gigante__ring");
    if (valor) valor.textContent = `${paddedFormat(minutos)}:${paddedFormat(segundos)}`;
    if (ring) {
        const duracion = Math.max(1, temporizador_gigante_duracion || temporizador_gigante_restante);
        const progreso = Math.max(0, Math.min(1, temporizador_gigante_restante / duracion));
        ring.style.setProperty("--temporizador-progreso", `${(progreso * 360).toFixed(2)}deg`);
    }
    temporizador_gigante.classList.toggle("urgente", temporizador_gigante_restante <= 10);
}

function detenerTemporizadorGigante() {
    if (temporizador_gigante_interval) {
        clearInterval(temporizador_gigante_interval);
        temporizador_gigante_interval = null;
    }
    temporizador_gigante_restante = 0;
    temporizador_gigante_duracion = 0;
    temporizador_gigante_fin_ts = 0;
    temporizador_gigante.classList.remove("activo");
    temporizador_gigante.classList.remove("fin");
    temporizador_gigante.classList.remove("urgente");
    const final = temporizador_gigante.querySelector(".temporizador-gigante__final");
    if (final) final.hidden = true;
    controlador_audio_vista_espectador?.setMode(vista_espectador_modo_resuelta || "partida");
}

function iniciarTemporizadorGigante(duracion, finTimestamp = null) {
    detenerTemporizadorGigante();
    temporizador_gigante_duracion = Math.max(1, Number(duracion) || (10 * 60));
    temporizador_gigante_fin_ts = Number(finTimestamp) || (Date.now() + (temporizador_gigante_duracion * 1000));
    temporizador_gigante_restante = Math.max(0, Math.ceil((temporizador_gigante_fin_ts - Date.now()) / 1000));
    temporizador_gigante.classList.add("activo");
    temporizador_gigante.classList.remove("fin");
    const final = temporizador_gigante.querySelector(".temporizador-gigante__final");
    if (final) final.hidden = true;
    controlador_audio_vista_espectador?.setMode("temporizador");
    actualizarTemporizadorGigante();
    if (temporizador_gigante_restante <= 0) {
        finalizarTemporizadorGigante();
        return;
    }
    temporizador_gigante_interval = setInterval(() => {
        actualizarTemporizadorGigante();
        if (temporizador_gigante_restante <= 0) {
            finalizarTemporizadorGigante();
            return;
        }
    }, 250);
}

function finalizarTemporizadorGigante() {
    if (temporizador_gigante_interval) {
        clearInterval(temporizador_gigante_interval);
        temporizador_gigante_interval = null;
    }
    temporizador_gigante_restante = 0;
    temporizador_gigante.classList.add("activo", "fin");
    temporizador_gigante.classList.remove("urgente");
    const final = temporizador_gigante.querySelector(".temporizador-gigante__final");
    if (final) final.hidden = false;
}

function aplicarEstadoTemporizadorGigante(payload = {}) {
    const estado = String(payload.estado || "").trim().toLowerCase();
    if (estado === "oculto" || payload.mostrar === false) {
        detenerTemporizadorGigante();
        return;
    }
    if (estado === "finalizado") {
        finalizarTemporizadorGigante();
        return;
    }
    iniciarTemporizadorGigante(payload.duracion, payload.fin_ts);
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
const timeout_chip_regalo_musa_espectador = { 1: null, 2: null };

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
const teleprompter_preparing = getEl("teleprompter_preparing");
const TELEPROMPTER_LIMITS_ESPECTADOR = {
    ...window.ScribTeleprompter.LIMITS,
    fontMax: 80,
    speedMax: 200
};
const TELEPROMPTER_FONT_MIN = TELEPROMPTER_LIMITS_ESPECTADOR.fontMin;
const TELEPROMPTER_FONT_MAX = TELEPROMPTER_LIMITS_ESPECTADOR.fontMax;
const TELEPROMPTER_SPEED_MIN = TELEPROMPTER_LIMITS_ESPECTADOR.speedMin;
const TELEPROMPTER_SPEED_MAX = TELEPROMPTER_LIMITS_ESPECTADOR.speedMax;
const TELEPROMPTER_GAMEPAD = {
    deadzone: 0.18,
    analogSpeed: 320
};
const teleprompter_estado = window.ScribTeleprompter.crearEstado();
let teleprompter_revision_local = 0;
let teleprompter_last_ack_load_id = 0;
let teleprompter_emit_timeout = null;
let teleprompter_play_raf = null;
let teleprompter_last_tick = null;
let teleprompter_gamepad_loop = null;
let teleprompter_gamepad_last = null;
let teleprompter_gamepad_prev_buttons = [];
const teleprompter_feedback_hold_state = {
    tp_dpad_up: false,
    tp_dpad_down: false
};

const extraerRevisionTeleprompterEspectador = (state = {}) => {
    return window.ScribTeleprompter.normalizarRevision(state && state.revision);
};

const marcarCambioTeleprompterLocalEspectador = () => {
    teleprompter_revision_local = Math.max(teleprompter_revision_local + 1, Number(teleprompter_estado.revision) || 0);
    teleprompter_estado.revision = teleprompter_revision_local;
    return teleprompter_estado.revision;
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

const teleprompterTieneTexto = () => (
    typeof teleprompter_estado.text === "string" && teleprompter_estado.text.trim().length > 0
);

const teleprompterPuedeMoverse = () => teleprompter_estado.visible && teleprompterTieneTexto();

const teleprompterDebeReproducirse = () => (
    teleprompterPuedeMoverse() && teleprompter_estado.playing && teleprompter_estado.speed > 0
);

const emitirTeleprompterEstadoEspectador = (inmediato = false) => {
    if (!socket || typeof socket.emit !== "function") return;
    if (inmediato) {
        socket.emit("teleprompter_control", { state: { ...teleprompter_estado } });
        return;
    }
    if (teleprompter_emit_timeout) return;
    teleprompter_emit_timeout = setTimeout(() => {
        teleprompter_emit_timeout = null;
        socket.emit("teleprompter_control", { state: { ...teleprompter_estado } });
    }, 60);
};

const emitirTeleprompterFeedbackEspectador = (payload = {}) => {
    if (!socket || typeof socket.emit !== "function") return;
    const type = typeof payload.type === "string" ? payload.type.trim() : "";
    const id = typeof payload.id === "string" ? payload.id.trim() : "";
    if (!type || !id) return;
    socket.emit("teleprompter_feedback", {
        type,
        id,
        active: Boolean(payload.active),
        duration: Math.max(60, Math.trunc(Number(payload.duration) || 160))
    });
};

const activarBotonFeedbackEspectador = (id, duration = 160) => {
    emitirTeleprompterFeedbackEspectador({
        type: "press",
        id,
        duration
    });
};

const setHoldFeedbackEspectador = (id, active) => {
    if (!id) return;
    const activo = Boolean(active);
    if (teleprompter_feedback_hold_state[id] === activo) return;
    teleprompter_feedback_hold_state[id] = activo;
    emitirTeleprompterFeedbackEspectador({
        type: "held",
        id,
        active: activo
    });
};

const resetHoldFeedbackEspectador = () => {
    setHoldFeedbackEspectador("tp_dpad_up", false);
    setHoldFeedbackEspectador("tp_dpad_down", false);
};

const emitirTeleprompterAck = (loadId) => {
    const id = Number(loadId);
    if (!Number.isFinite(id) || id <= 0 || id === teleprompter_last_ack_load_id) {
        return;
    }
    teleprompter_last_ack_load_id = id;
    const overlay = teleprompter_overlay || getEl("teleprompter_overlay");
    const text = teleprompter_text || getEl("teleprompter_text");
    const overlayActive = Boolean(overlay && overlay.classList.contains("activo"));
    const timerActive = Boolean(temporizador_gigante && temporizador_gigante.classList.contains("activo"));
    const rendered = Boolean(text) && String(text.textContent || "") === String(teleprompter_estado.text || "");
    socket.emit("teleprompter_ack", {
        loadId: id,
        source: teleprompter_estado.source === 2 ? 2 : 1,
        rendered,
        overlayActive,
        timerActive,
        visible: overlayActive && !timerActive,
        textLength: String(teleprompter_estado.text || "").length
    });
};

const detenerTeleprompterPlayEspectador = () => {
    if (teleprompter_play_raf) {
        cancelAnimationFrame(teleprompter_play_raf);
    }
    teleprompter_play_raf = null;
    teleprompter_last_tick = null;
};

function teleprompterPlayLoopEspectador(ts) {
    if (!teleprompterDebeReproducirse()) {
        detenerTeleprompterPlayEspectador();
        return;
    }
    if (teleprompter_last_tick === null) {
        teleprompter_last_tick = ts;
    }
    const dt = (ts - teleprompter_last_tick) / 1000;
    teleprompter_last_tick = ts;
    if (dt > 0) {
        teleprompter_estado.scroll += teleprompter_estado.speed * dt;
        marcarCambioTeleprompterLocalEspectador();
        sincronizarTeleprompterScroll();
        emitirTeleprompterEstadoEspectador();
    }
    teleprompter_play_raf = requestAnimationFrame(teleprompterPlayLoopEspectador);
}

const sincronizarTeleprompterPlayEspectador = () => {
    if (teleprompterDebeReproducirse()) {
        if (!teleprompter_play_raf) {
            teleprompter_last_tick = null;
            teleprompter_play_raf = requestAnimationFrame(teleprompterPlayLoopEspectador);
        }
        return;
    }
    detenerTeleprompterPlayEspectador();
};

const aplicarRenderTeleprompterEspectador = ({ esNuevaCarga = false } = {}) => {
    const overlay = teleprompter_overlay || getEl("teleprompter_overlay");
    const screen = teleprompter_screen || getEl("teleprompter_screen");
    const text = teleprompter_text || getEl("teleprompter_text");
    if (text) {
        text.textContent = teleprompter_estado.text;
        text.style.fontSize = `${teleprompter_estado.fontSize}px`;
        if (esNuevaCarga) {
            text.classList.add("teleprompter-text--no-anim");
        }
    }
    if (overlay) {
        overlay.classList.toggle("activo", teleprompter_estado.visible);
    }
    if (teleprompter_preparing) {
        const preparando = Boolean(teleprompter_estado.preparing && !teleprompter_estado.visible);
        teleprompter_preparing.hidden = !preparando;
        teleprompter_preparing.classList.toggle("activo", preparando);
        teleprompter_preparing.setAttribute("aria-hidden", preparando ? "false" : "true");
    }
    if (typeof refrescarVisibilidadPreShowEspectador === "function") {
        refrescarVisibilidadPreShowEspectador();
    }
    if (screen) {
        const equipo = teleprompter_estado.source;
        const valor = teleprompterTieneTexto() && equipo === 1 ? "1" : teleprompterTieneTexto() && equipo === 2 ? "2" : "none";
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
    sincronizarTeleprompterPlayEspectador();
    programarAjusteViewportEspectador();
    requestAnimationFrame(() => {
        sincronizarTeleprompterScroll();
        if (esNuevaCarga) {
            if (text) {
                requestAnimationFrame(() => text.classList.remove("teleprompter-text--no-anim"));
            }
            emitirTeleprompterAck(teleprompter_estado.loadId);
        }
    });
};

const actualizarTeleprompterEstado = (state = {}) => {
    if (!state) return;
    const revision = extraerRevisionTeleprompterEspectador(state);
    if (window.ScribTeleprompter.esEstadoObsoleto(state, teleprompter_estado.revision)) {
        return;
    }
    let esNuevaCarga = false;
    if (Number.isFinite(state.loadId)) {
        const loadId = Math.max(0, Math.trunc(Number(state.loadId)));
        esNuevaCarga = loadId > 0 && loadId !== teleprompter_estado.loadId;
    }
    window.ScribTeleprompter.aplicarEstado(teleprompter_estado, state, TELEPROMPTER_LIMITS_ESPECTADOR);
    if (revision !== null) {
        teleprompter_revision_local = Math.max(teleprompter_revision_local, revision);
    }
    aplicarRenderTeleprompterEspectador({ esNuevaCarga });
};

const teleprompterSubirEspectador = () => {
    teleprompter_estado.scroll = Math.max(0, teleprompter_estado.scroll - 60);
    marcarCambioTeleprompterLocalEspectador();
    aplicarRenderTeleprompterEspectador();
    emitirTeleprompterEstadoEspectador(true);
};

const teleprompterBajarEspectador = () => {
    teleprompter_estado.scroll += 60;
    marcarCambioTeleprompterLocalEspectador();
    aplicarRenderTeleprompterEspectador();
    emitirTeleprompterEstadoEspectador(true);
};

const teleprompterBajarGrandeEspectador = () => {
    teleprompter_estado.scroll += 260;
    marcarCambioTeleprompterLocalEspectador();
    aplicarRenderTeleprompterEspectador();
    emitirTeleprompterEstadoEspectador();
};

const teleprompterIrInicioEspectador = () => {
    teleprompter_estado.scroll = 0;
    marcarCambioTeleprompterLocalEspectador();
    aplicarRenderTeleprompterEspectador();
    emitirTeleprompterEstadoEspectador(true);
};

const teleprompterIrFinalEspectador = () => {
    teleprompter_estado.scroll = Number.MAX_SAFE_INTEGER;
    marcarCambioTeleprompterLocalEspectador();
    aplicarRenderTeleprompterEspectador();
    emitirTeleprompterEstadoEspectador(true);
};

const teleprompterCambiarFuenteEspectador = (delta) => {
    teleprompter_estado.fontSize = Math.min(TELEPROMPTER_FONT_MAX, Math.max(TELEPROMPTER_FONT_MIN, teleprompter_estado.fontSize + delta));
    marcarCambioTeleprompterLocalEspectador();
    aplicarRenderTeleprompterEspectador();
    emitirTeleprompterEstadoEspectador(true);
};

const teleprompterCambiarVelocidadEspectador = (delta) => {
    teleprompter_estado.speed = Math.min(TELEPROMPTER_SPEED_MAX, Math.max(TELEPROMPTER_SPEED_MIN, teleprompter_estado.speed + delta));
    marcarCambioTeleprompterLocalEspectador();
    aplicarRenderTeleprompterEspectador();
    emitirTeleprompterEstadoEspectador();
};

const teleprompterTogglePlayEspectador = () => {
    teleprompter_estado.playing = !teleprompter_estado.playing;
    marcarCambioTeleprompterLocalEspectador();
    aplicarRenderTeleprompterEspectador();
    emitirTeleprompterEstadoEspectador(true);
};

const obtenerGamepadActivoEspectador = () => {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    if (!pads) return null;
    for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (pad && pad.connected) return pad;
    }
    return null;
};

const botonJustPressedEspectador = (pad, index, threshold = 0.5) => {
    if (!pad || !pad.buttons || !pad.buttons[index]) return false;
    const btn = pad.buttons[index];
    const pressed = !!(btn.pressed || btn.value > threshold);
    const prev = !!teleprompter_gamepad_prev_buttons[index];
    teleprompter_gamepad_prev_buttons[index] = pressed;
    return pressed && !prev;
};

function teleprompterGamepadLoopEspectador(ts) {
    const pad = obtenerGamepadActivoEspectador();
    if (!pad) {
        teleprompter_gamepad_last = ts;
        teleprompter_gamepad_prev_buttons = [];
        resetHoldFeedbackEspectador();
        teleprompter_gamepad_loop = requestAnimationFrame(teleprompterGamepadLoopEspectador);
        return;
    }
    const tiempoActual = ts || performance.now();
    const dt = teleprompter_gamepad_last ? (tiempoActual - teleprompter_gamepad_last) / 1000 : 0;
    teleprompter_gamepad_last = tiempoActual;

    if (teleprompterPuedeMoverse()) {
        const axisY = pad.axes && pad.axes.length > 1 ? pad.axes[1] : 0;
        const abs = Math.abs(axisY);
        if (abs > TELEPROMPTER_GAMEPAD.deadzone && dt > 0) {
            const factor = (abs - TELEPROMPTER_GAMEPAD.deadzone) / (1 - TELEPROMPTER_GAMEPAD.deadzone);
            const delta = axisY * factor * TELEPROMPTER_GAMEPAD.analogSpeed * dt;
            teleprompter_estado.scroll = Math.max(0, teleprompter_estado.scroll + delta);
            sincronizarTeleprompterScroll();
            emitirTeleprompterEstadoEspectador();
        }

        if (abs > TELEPROMPTER_GAMEPAD.deadzone) {
            setHoldFeedbackEspectador("tp_dpad_up", axisY < 0);
            setHoldFeedbackEspectador("tp_dpad_down", axisY > 0);
        } else {
            resetHoldFeedbackEspectador();
        }

        if (botonJustPressedEspectador(pad, 12)) {
            teleprompterSubirEspectador();
            activarBotonFeedbackEspectador("tp_dpad_up");
        }
        if (botonJustPressedEspectador(pad, 13)) {
            teleprompterBajarEspectador();
            activarBotonFeedbackEspectador("tp_dpad_down");
        }
        if (botonJustPressedEspectador(pad, 14)) {
            teleprompterCambiarVelocidadEspectador(-5);
            activarBotonFeedbackEspectador("tp_dpad_left");
        }
        if (botonJustPressedEspectador(pad, 15)) {
            teleprompterCambiarVelocidadEspectador(5);
            activarBotonFeedbackEspectador("tp_dpad_right");
        }
        if (botonJustPressedEspectador(pad, 0)) {
            teleprompterTogglePlayEspectador();
            activarBotonFeedbackEspectador("tp_x");
        }
        if (botonJustPressedEspectador(pad, 1)) {
            teleprompterCambiarFuenteEspectador(2);
            activarBotonFeedbackEspectador("tp_circle");
        }
        if (botonJustPressedEspectador(pad, 2)) {
            teleprompterCambiarFuenteEspectador(-2);
            activarBotonFeedbackEspectador("tp_square");
        }
        if (botonJustPressedEspectador(pad, 3)) {
            teleprompterBajarGrandeEspectador();
            activarBotonFeedbackEspectador("tp_triangle");
        }
        if (botonJustPressedEspectador(pad, 4)) {
            teleprompterIrInicioEspectador();
            activarBotonFeedbackEspectador("tp_l1");
        }
        if (botonJustPressedEspectador(pad, 5)) {
            teleprompterIrFinalEspectador();
            activarBotonFeedbackEspectador("tp_r1");
        }
        if (botonJustPressedEspectador(pad, 6, 0.6)) {
            teleprompterCambiarFuenteEspectador(-2);
            activarBotonFeedbackEspectador("tp_l2");
        }
        if (botonJustPressedEspectador(pad, 7, 0.6)) {
            teleprompterCambiarFuenteEspectador(2);
            activarBotonFeedbackEspectador("tp_r2");
        }
    } else {
        teleprompter_gamepad_prev_buttons = pad.buttons.map((btn) => !!(btn && (btn.pressed || btn.value > 0.5)));
        resetHoldFeedbackEspectador();
    }

    teleprompter_gamepad_loop = requestAnimationFrame(teleprompterGamepadLoopEspectador);
}

const iniciarTeleprompterGamepadEspectador = () => {
    if (teleprompter_gamepad_loop) return;
    teleprompter_gamepad_loop = requestAnimationFrame(teleprompterGamepadLoopEspectador);
};

window.addEventListener("gamepadconnected", iniciarTeleprompterGamepadEspectador);
window.addEventListener("gamepaddisconnected", () => {
    const pad = obtenerGamepadActivoEspectador();
    if (!pad) {
        teleprompter_gamepad_prev_buttons = [];
        resetHoldFeedbackEspectador();
    }
});
window.addEventListener("load", iniciarTeleprompterGamepadEspectador);

window.addEventListener("resize", () => {
    if (teleprompter_estado.visible) {
        requestAnimationFrame(sincronizarTeleprompterScroll);
    }
    if (vista_calentamiento) {
        renderizarPalabrasCalentamiento();
        renderizarCursoresCalentamiento();
    }
    if (vista_espectador_modo_resuelta === "stats" && stats_slides_track) {
        aplicarSlideStatsActual();
    }
    if (vista_espectador_modo_resuelta === "nube_inspiracion") {
        renderizarNubeInspiracion();
    }
    if (vista_espectador_modo_resuelta === "creditos") {
        renderizarCreditosEspectador();
    }
    programarAjusteViewportEspectador();
});

const crearCorazonFlotante = (equipo, x, y) => {
    if (!contenedor_corazones_espectador) return;
    const corazon = document.createElement("span");
    const claseEquipo = equipo === 1 ? "corazon-azul" : "corazon-rojo";
    corazon.className = `corazon-flotante ${claseEquipo}`;
    corazon.textContent = equipo === 1 ? "\u{1F499}" : "\u2764\uFE0F";
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
let explicacion = getEl("explicacion") || getEl("explicaciï¿½n");

let palabra2 = getEl("palabra1");
let definicion2 = getEl("definicion1");
let explicacion1 = getEl("explicacion1") || getEl("explicaciï¿½n1");

let palabra3 = getEl("palabra2");
let definicion3 = getEl("definicion2");
let explicacion2 = getEl("explicacion2") || getEl("explicaciï¿½n2");
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

function debeAnimarEntradaBarraVida(elemento, opciones = {}) {
    if (!elemento) return false;
    if (opciones && opciones.animarEntrada) return true;
    if (elemento.dataset && elemento.dataset.vidaVisible !== "1") return true;
    return elemento.style && elemento.style.display === "none";
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
    aplicarEstadoBarraVida(elemento, 0);

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

function esInspiracionMusaEnemiga(payload) {
    if (!payload || payload.tipo !== "inspiracion") return false;
    const origen = typeof payload.origen_musa === "string"
        ? payload.origen_musa.trim().toLowerCase()
        : "";
    return origen === "musa_enemiga";
}

function esEventoInspiracionVigenteEspectador(payload = {}) {
    if (!payload || payload.autoritativa !== true) return false;
    const seq = Number(payload.modo_seq);
    if (Number.isFinite(seq) && seq > 0 && seq < modo_seq_actual_espectador) {
        return false;
    }
    const modoPayload = typeof payload.modo_actual === "string"
        ? payload.modo_actual.trim().toLowerCase()
        : "";
    const modoLocal = typeof modo_actual === "string" ? modo_actual.trim().toLowerCase() : "";
    if (modoPayload && modoLocal && modoPayload !== modoLocal) {
        return false;
    }
    return true;
}

function actualizarBarraInspiracionAutoritativaEspectador(payload = {}) {
    if (!esEventoInspiracionVigenteEspectador(payload)) return;
    const equipo = Number(payload.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    const valorRaw = Number(payload && payload.valor_inspiracion);
    const valorInspiracion = Number.isFinite(valorRaw)
        ? Math.max(0, Math.min(1, valorRaw))
        : 1;
    increment(equipo === 1 ? "blue" : "red", valorInspiracion);
}

function limpiarSugerenciaMusaModoLetrasEspectador(escritoraId, payload = {}) {
    const modoEsLetras = modo_actual === "letra bendita" || modo_actual === "letra prohibida";
    if (!modoEsLetras) return;
    const tipo = typeof payload?.tipo === "string" ? payload.tipo.trim().toLowerCase() : "";
    if (tipo !== "inspiracion") return;
    const id = Number(escritoraId);
    const nodoDefinicion = id === 1 ? definicion2 : (id === 2 ? definicion3 : null);
    if (!nodoDefinicion) return;
    actualizarDefinicionConVisibilidad(nodoDefinicion, "", false);
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
    if (
        vista_espectador_modo_resuelta === "stats" ||
        vista_espectador_modo_resuelta === "puntuacion" ||
        vista_espectador_modo_resuelta === "nube_inspiracion" ||
        vista_espectador_modo_resuelta === "creditos"
    ) {
        return;
    }
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
    if (typeof opciones.claseExtra === "string" && opciones.claseExtra.trim()) {
        opciones.claseExtra.trim().split(/\s+/).forEach((clase) => {
            if (clase) nodo.classList.add(clase);
        });
    }

    if (typeof opciones.color === "string" && opciones.color.trim()) {
        nodo.style.setProperty("--feedback-float-color", opciones.color.trim());
    }

    const derivaX = (Math.random() * 18) - 9;
    const subidaDeseada = -54 - (Math.random() * 18);
    const rectContenedor = contenedor.getBoundingClientRect();
    const margenSuperior = 24;
    const subidaMaxima = -Math.max(8, rectContenedor.top - margenSuperior);
    const subidaY = Math.max(subidaDeseada, subidaMaxima);
    const duracionPersonalizada = Number(opciones.duracionMs);
    const duracion = Number.isFinite(duracionPersonalizada) && duracionPersonalizada > 0
        ? Math.round(duracionPersonalizada)
        : 1100 + Math.round(Math.random() * 200);
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

function normalizarFeedbacksTiempoFlotanteEspectador(payload = {}) {
    const items = [];
    const textoPrincipal = String(payload && payload.tiempo_feed != null ? payload.tiempo_feed : "").trim();
    if (textoPrincipal) {
        items.push(payload);
    }
    const extrasRaw = Array.isArray(payload?.feedback_extra)
        ? payload.feedback_extra
        : (payload?.feedback_extra ? [payload.feedback_extra] : []);
    extrasRaw.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const textoExtra = String(item.tiempo_feed != null ? item.tiempo_feed : "").trim();
        if (textoExtra) {
            items.push(item);
        }
    });
    return items;
}

function mostrarFeedbackTiempoFlotanteEspectador(playerId, payload = {}) {
    const items = normalizarFeedbacksTiempoFlotanteEspectador(payload);
    items.forEach((item) => {
        const texto = String(item && item.tiempo_feed != null ? item.tiempo_feed : "").trim();
        if (!texto) return;
        mostrarFeedbackFlotanteEspectador(playerId, texto, {
            tipo: obtenerClaseFeedbackTiempoFlotante(item),
            color: item.color,
            claseExtra: item.claseExtra
        });
    });
}

function actualizarBarraVida(elemento, texto, opciones = {}) {
    if (!elemento) {
        return;
    }
    const total = extraerSegundosTiempo(texto);
    if (total === null) {
        cancelarAnimacionEntradaBarraVida(elemento);
        elemento.style.setProperty("--vida-pct", "0%");
        elemento.style.setProperty("--vida-color", "#d94b4b");
        elemento.style.display = "none";
        if (elemento.dataset) elemento.dataset.vidaVisible = "0";
        return;
    }
    const animarEntrada = debeAnimarEntradaBarraVida(elemento, opciones);
    const limitado = Math.min(Math.max(total, 0), VIDA_MAX_SEGUNDOS);
    const porcentaje = (limitado / VIDA_MAX_SEGUNDOS) * 100;
    elemento.style.display = DISPLAY_BARRA_VIDA;
    if (elemento.dataset) elemento.dataset.vidaVisible = "1";
    if (animarEntrada) {
        animarEntradaBarraVida(elemento, porcentaje);
        return;
    }
    cancelarAnimacionEntradaBarraVida(elemento);
    aplicarEstadoBarraVida(elemento, porcentaje);
}
const calentamiento_espectador = getEl("calentamiento_espectador");
const calentamiento_stage_espectador = document.querySelector("#calentamiento_espectador .calentamiento-stage");
const calentamiento_global_estado = getEl("calentamiento_global_estado");
const calentamiento_nube = getEl("calentamiento_nube");
const calentamiento_cursor_1 = getEl("calentamiento_cursor_1");
const calentamiento_cursor_2 = getEl("calentamiento_cursor_2");
const calentamiento_cursor_label_1 = calentamiento_cursor_1 ? calentamiento_cursor_1.querySelector(".cursor-label") : null;
const calentamiento_cursor_label_2 = calentamiento_cursor_2 ? calentamiento_cursor_2.querySelector(".cursor-label") : null;
const calentamiento_consigna_espectador = getEl("calentamiento_consigna_espectador");
const calentamiento_detonadores_historial = getEl("calentamiento_detonadores_historial");
const calentamiento_final_j1 = getEl("calentamiento_final_j1");
const calentamiento_final_j2 = getEl("calentamiento_final_j2");
const calentamiento_overlay_ui = document.querySelector("#calentamiento_espectador .calentamiento-overlay-ui");
const stats_espectador = getEl("stats_espectador");
const stats_slider = stats_espectador ? stats_espectador.querySelector(".stats-slider") : null;
const stats_slides_track = getEl("stats_slides_track");
const stats_dots = getEl("stats_dots");
const stats_estado = getEl("stats_estado");
const stats_timestamp = getEl("stats_timestamp");
const puntuacion_espectador = getEl("puntuacion_espectador");
const puntuacion_stage = getEl("puntuacion_stage");
const puntuacion_paso = getEl("puntuacion_paso");
const puntuacion_formula = getEl("puntuacion_formula");
const puntuacion_dots = getEl("puntuacion_dots");
const puntuacion_particulas = getEl("puntuacion_particulas");
const deliberacion_espectador = getEl("deliberacion_espectador");
const resultado_jurado_espectador = getEl("resultado_jurado_espectador");
const resultado_jurado_stage = getEl("resultado_jurado_stage");
const resultado_final_espectador = getEl("resultado_final_espectador");
const resultado_final_stage = getEl("resultado_final_stage");
const deliberacion_audio_espectador = getEl("deliberacion_audio_espectador");
const deliberacion_latido_espectador = getEl("deliberacion_latido_espectador");
const deliberacion_victoria_espectador = getEl("deliberacion_victoria_espectador");
const nube_inspiracion_espectador = getEl("nube_inspiracion_espectador");
const nube_inspiracion_canvas = getEl("nube_inspiracion_canvas");
const creditos_espectador = getEl("creditos_espectador");
const creditos_track = getEl("creditos_track");
const creditos_content = getEl("creditos_content");
const creditos_sociales_final = getEl("creditos_sociales_final");
const creditos_audio_espectador = getEl("creditos_audio_espectador");
const contenedor_espectador = getEl("contenedor_espectador");
const temas_container = getEl("temas_container");
const info_general = getEl("info_general");
const spectator_fit_root = getEl("spectator_fit_root");
const spectator_view_transition = getEl("spectator_view_transition");
const container_general = document.querySelector(".container");
const cabecera = document.querySelector(".cabecera");
const cabecera_display_inicial = cabecera ? cabecera.style.display : "";
const neon_espectador = getEl("neon");
const MODOS_VISTA_ESPECTADOR = new Set(["partida", "tutorial", "calentamiento", "stats", "puntuacion", "nube_inspiracion", "creditos", "deliberacion", "resultado_jurado", "resultado_final"]);
const MODOS_OVERRIDE_ESPECTADOR = new Set(["partida", "tutorial", "stats", "puntuacion", "nube_inspiracion", "creditos", "deliberacion", "resultado_jurado", "resultado_final"]);
let vista_calentamiento = false;
let vista_espectador_override = "tutorial";
let vista_espectador_modo_resuelta = "tutorial";
let vista_espectador_modo_solicitada = "tutorial";
let vista_espectador_ui_inicializada = false;
const controlador_transicion_vista_espectador = window.ScribViewTransition
    ? window.ScribViewTransition.createController({
        overlay: spectator_view_transition,
        reducedMotion: () => Boolean(
            window.matchMedia
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
    })
    : null;
const controlador_audio_vista_espectador = window.ScribViewTransition
    ? window.ScribViewTransition.createAudioController({
        windowRef: window,
        documentRef: document,
        musicUrl: "../audio/1.%20MENU%20DE%20INICIO.mp3",
        transitionUrl: "../audio/FX/cambio-vista.mp3",
        fadeDurationMs: 3000,
        musicModes: ["tutorial", "calentamiento", "temporizador"]
    })
    : null;
let audio_deliberacion_modo_espectador = "";
let audio_deliberacion_victoria_firma = "";
const DELIBERACION_VICTORIA_INICIO_SEGUNDOS = 22.5;
const audios_deliberacion_pendientes_espectador = new Set();

const pausarAudioDeliberacionEspectador = (audio, reiniciar = false) => {
    if (!audio) return;
    audio.pause();
    if (reiniciar) {
        try { audio.currentTime = 0; } catch (_error) {}
    }
};

const reproducirAudioDeliberacionSeguro = (audio, volumen = 0.78) => {
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volumen));
    const promesa = audio.play();
    if (promesa && typeof promesa.catch === "function") {
        promesa
            .then(() => audios_deliberacion_pendientes_espectador.delete(audio))
            .catch(() => { audios_deliberacion_pendientes_espectador.add(audio); });
    }
};

const reintentarAudioDeliberacionEspectador = () => {
    if (!audios_deliberacion_pendientes_espectador.size) return;
    const pendientes = [...audios_deliberacion_pendientes_espectador];
    audios_deliberacion_pendientes_espectador.clear();
    pendientes.forEach((audio) => reproducirAudioDeliberacionSeguro(audio, audio.volume));
};
document.addEventListener("pointerdown", reintentarAudioDeliberacionEspectador, { passive: true });
document.addEventListener("keydown", reintentarAudioDeliberacionEspectador);

function sincronizarAudioDeliberacionEspectador(modo) {
    const siguiente = String(modo || "").trim().toLowerCase();
    audio_deliberacion_modo_espectador = siguiente;
    if (siguiente === "resultado_jurado") {
        pausarAudioDeliberacionEspectador(deliberacion_victoria_espectador, true);
        audio_deliberacion_victoria_firma = "";
        reproducirAudioDeliberacionSeguro(deliberacion_audio_espectador, 0.42);
        reproducirAudioDeliberacionSeguro(deliberacion_latido_espectador, 0.72);
        return;
    }
    pausarAudioDeliberacionEspectador(deliberacion_latido_espectador, true);
    if (siguiente === "deliberacion" || siguiente === "puntuacion") {
        pausarAudioDeliberacionEspectador(deliberacion_victoria_espectador, true);
        audio_deliberacion_victoria_firma = "";
        reproducirAudioDeliberacionSeguro(deliberacion_audio_espectador, 0.8);
        return;
    }
    pausarAudioDeliberacionEspectador(deliberacion_audio_espectador);
    if (siguiente !== "resultado_final") {
        pausarAudioDeliberacionEspectador(deliberacion_victoria_espectador, true);
        audio_deliberacion_victoria_firma = "";
    }
}

function reproducirVictoriaDeliberacionEspectador(firma) {
    const siguienteFirma = String(firma || "victoria");
    if (audio_deliberacion_victoria_firma === siguienteFirma) return;
    audio_deliberacion_victoria_firma = siguienteFirma;
    pausarAudioDeliberacionEspectador(deliberacion_audio_espectador);
    pausarAudioDeliberacionEspectador(deliberacion_latido_espectador);
    pausarAudioDeliberacionEspectador(deliberacion_victoria_espectador, true);
    try { deliberacion_victoria_espectador.currentTime = DELIBERACION_VICTORIA_INICIO_SEGUNDOS; } catch (_error) {}
    reproducirAudioDeliberacionSeguro(deliberacion_victoria_espectador, 0.92);
}
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
const ORDEN_SOLICITUD_CALENTAMIENTO_VISTA = ["lugares", "acciones", "frase_final"];

const pre_show_espectador = getEl("pre_show_espectador");
const pre_show_espectador_mensajes = getEl("pre_show_espectador_mensajes");
const pre_show_espectador_anuncio = getEl("pre_show_espectador_anuncio");
let pre_show_estado_espectador = window.ScribPreShow.normalizarEstado({ activo: false });
let pre_show_bloqueado_por_tutorial_espectador = false;
const pre_show_ids_vistos_espectador = new Set();
const PRE_SHOW_MENSAJES_VISIBLES_ESPECTADOR = 8;

function puedeMostrarPreShowEspectador() {
    return Boolean(
        pre_show_estado_espectador.activo
        && !pre_show_bloqueado_por_tutorial_espectador
        && !vista_calentamiento
        && vista_espectador_modo_resuelta === "tutorial"
        && !(teleprompter_estado && (teleprompter_estado.visible || teleprompter_estado.preparing))
    );
}

function crearVacioPreShowEspectador() {
    const vacio = document.createElement("div");
    vacio.className = "pre-show-espectador__empty";
    const texto = document.createElement("p");
    texto.textContent = tJuego2P(
        "preshow.spectator.waiting",
        {},
        "MUSAS, \u00a1HACEDLES ESCRIBIR!"
    );
    vacio.append(texto);
    return vacio;
}

function crearMensajePreShowEspectador(mensaje, esNuevo, indice) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "pre-show-message";
    tarjeta.setAttribute("role", "listitem");
    if (mensaje.equipo === 1 || mensaje.equipo === 2) {
        tarjeta.classList.add(`pre-show-message--team-${mensaje.equipo}`);
    }
    tarjeta.classList.toggle("is-new", Boolean(esNuevo));
    tarjeta.classList.toggle("is-static", !esNuevo);
    tarjeta.dataset.messageId = mensaje.id;
    if (esNuevo) tarjeta.style.animationDelay = `${Math.min(indice * 55, 280)}ms`;

    const musa = document.createElement("p");
    musa.className = "pre-show-message__muse";
    musa.textContent = mensaje.nombre_musa;
    const texto = document.createElement("p");
    texto.className = "pre-show-message__text";
    texto.textContent = mensaje.texto;
    tarjeta.append(musa, texto);
    return tarjeta;
}

function renderizarPreShowEspectador() {
    if (!pre_show_espectador_mensajes) return;
    if (!pre_show_estado_espectador.activo || pre_show_bloqueado_por_tutorial_espectador) {
        pre_show_espectador_mensajes.replaceChildren();
        return;
    }
    const mensajes = pre_show_estado_espectador.mensajes.slice(-PRE_SHOW_MENSAJES_VISIBLES_ESPECTADOR);
    if (!mensajes.length) {
        pre_show_espectador_mensajes.replaceChildren(crearVacioPreShowEspectador());
        return;
    }
    const fragmento = document.createDocumentFragment();
    const mensajesNuevos = [];
    mensajes.forEach((mensaje, indice) => {
        const esNuevo = !pre_show_ids_vistos_espectador.has(mensaje.id);
        fragmento.appendChild(crearMensajePreShowEspectador(mensaje, esNuevo, indice));
        if (esNuevo) mensajesNuevos.push(mensaje);
        pre_show_ids_vistos_espectador.add(mensaje.id);
    });
    pre_show_espectador_mensajes.replaceChildren(fragmento);
    const ultimoNuevo = mensajesNuevos[mensajesNuevos.length - 1];
    if (ultimoNuevo && pre_show_espectador_anuncio) {
        pre_show_espectador_anuncio.textContent = `${ultimoNuevo.nombre_musa}: ${ultimoNuevo.texto}`;
    }
}

function refrescarVisibilidadPreShowEspectador() {
    const visible = puedeMostrarPreShowEspectador();
    if (document.body) {
        document.body.classList.toggle("pre-show-espectador-activo", visible);
    }
    if (pre_show_espectador) {
        pre_show_espectador.hidden = !visible;
        pre_show_espectador.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    if (visible) renderizarPreShowEspectador();
    return visible;
}

function actualizarEstadoPreShowEspectador(payload = {}) {
    const siguiente = window.ScribPreShow.normalizarEstado(payload);
    const nuevaSesion = Boolean(
        siguiente.session_id
        && siguiente.session_id !== pre_show_estado_espectador.session_id
    );
    const cambioFase = nuevaSesion || siguiente.phase_seq !== pre_show_estado_espectador.phase_seq;
    if (cambioFase || !siguiente.activo) pre_show_ids_vistos_espectador.clear();
    if (nuevaSesion && siguiente.activo && window.ScribPreShow.tieneSesionSincronizada(siguiente)) {
        pre_show_bloqueado_por_tutorial_espectador = false;
        partida_activa_espectador = false;
        vista_calentamiento = false;
    }
    pre_show_estado_espectador = siguiente;
    if (!siguiente.activo && pre_show_espectador_mensajes) {
        pre_show_espectador_mensajes.replaceChildren();
    }
    if (!siguiente.activo && pre_show_espectador_anuncio) {
        pre_show_espectador_anuncio.textContent = "";
    }
    if (nuevaSesion && siguiente.activo && typeof actualizarModoVistaEspectadorUi === "function") {
        actualizarModoVistaEspectadorUi();
    } else {
        refrescarVisibilidadPreShowEspectador();
    }
    return siguiente;
}

function cerrarPreShowEspectadorPorTutorial() {
    pre_show_bloqueado_por_tutorial_espectador = true;
    pre_show_estado_espectador = window.ScribPreShow.normalizarEstado({
        activo: false,
        session_id: pre_show_estado_espectador.session_id,
        phase_seq: pre_show_estado_espectador.phase_seq,
        limite_texto: pre_show_estado_espectador.limite_texto,
        cooldown_ms: pre_show_estado_espectador.cooldown_ms
    });
    pre_show_ids_vistos_espectador.clear();
    if (pre_show_espectador_mensajes) pre_show_espectador_mensajes.replaceChildren();
    if (pre_show_espectador_anuncio) pre_show_espectador_anuncio.textContent = "";
    refrescarVisibilidadPreShowEspectador();
}

function suspenderPreShowEspectadorPorConexion() {
    if (document.body) document.body.classList.remove("pre-show-espectador-activo");
    if (pre_show_espectador) {
        pre_show_espectador.hidden = true;
        pre_show_espectador.setAttribute("aria-hidden", "true");
    }
}

function actualizarBrandingPartidaEspectador(opciones = {}) {
    const modoPartida = vista_espectador_modo_resuelta === "partida";
    if (cabecera) {
        cabecera.style.display = modoPartida ? (cabecera_display_inicial || "") : "none";
    }
    const displayBranding = modoPartida ? "" : "none";
    if (logo) {
        logo.style.display = displayBranding;
    }
    if (neon_espectador) {
        neon_espectador.style.display = displayBranding;
    }
}
const SOLICITUD_CALENTAMIENTO_VISTA_NINGUNA = "ninguna";
const SOLICITUD_CALENTAMIENTO_VISTA_POR_DEFECTO = SOLICITUD_CALENTAMIENTO_VISTA_NINGUNA;
const TIPOS_SOLICITUD_CALENTAMIENTO_VISTA = new Set([
    SOLICITUD_CALENTAMIENTO_VISTA_NINGUNA,
    ...ORDEN_SOLICITUD_CALENTAMIENTO_VISTA
]);
const MAX_TEXTO_DETONADOR_HISTORIAL = 48;
const crearHistorialDetonadoresBase = () => (
    ORDEN_SOLICITUD_CALENTAMIENTO_VISTA.map((tipo) => ({
        tipo,
        titulo: traducirSolicitudCalentamientoEspectador(tipo).toUpperCase(),
        valor: traducirSolicitudCalentamientoEspectador(SOLICITUD_CALENTAMIENTO_VISTA_NINGUNA, { corta: true }).toUpperCase(),
        detalles: []
    }))
);
let solicitud_calentamiento_espectador = SOLICITUD_CALENTAMIENTO_VISTA_POR_DEFECTO;
let historial_detonadores_espectador = crearHistorialDetonadoresBase();
let calentamiento_activo_previo_espectador = false;
let ultimo_payload_calentamiento_espectador = null;
let ultimo_payload_modo_espectador = null;
let ultima_letra_bendita_espectador = "";
let ultima_letra_prohibida_espectador = "";
let finales_calentamiento_previos = { 1: "", 2: "" };
let cursores_calentamiento = {
    1: { x: 50, y: 50, visible: false },
    2: { x: 50, y: 50, visible: false }
};
let estado_stats_live_espectador = null;
let stats_slide_step_remoto = 0;
let stats_slide_index = 0;
let stats_slide_count = 0;
let stats_slides_actuales = [];
let estado_puntuacion_final_espectador = null;
let estado_resultado_jurado_espectador = null;
let estado_resultado_final_espectador = null;
let puntuacion_slide_step_remoto = 0;
let puntuacion_reveal_phase_remoto = 0;
let jurado_slide_step_remoto = 0;
let puntuacion_firma_render_espectador = "";
let jurado_firma_render_espectador = "";
let resultado_final_firma_render_espectador = "";
let puntuacion_timeout_revelado_espectador = null;
let puntuacion_timeout_transferencia_espectador = null;
let puntuacion_raf_totales_espectador = [];
let jurado_timeout_revelado_espectador = null;
const stats_timeline_modos_local_espectador = [];
const STATS_LAYOUT_HEATMAP = [
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
    ]
];
const STATS_HEATMAP_LABELS = (() => {
    const mapa = new Map();
    STATS_LAYOUT_HEATMAP.forEach((fila) => {
        fila.forEach((tecla) => {
            if (!tecla || tecla.spacer || !tecla.code) return;
            mapa.set(tecla.code, tecla.label || tecla.code);
        });
    });
    return mapa;
})();
const STATS_HISTORIAL_VIDA_MAX = 320;
const STATS_HISTORIAL_VIDA_VENTANA_MS = 1000 * 60 * 15;
const STATS_REINICIO_SUBIDA_BRUSCA_SEGUNDOS = 15;
const STATS_REINICIO_SUBIDA_BRUSCA_VENTANA_MS = 8000;
const stats_historial_vida_espectador = { 1: [], 2: [] };
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
const ESCALA_UI_ESPECTADOR_MIN = 0.82;
const ESCALA_UI_ESPECTADOR_MAX = 1.28;
let raf_ajuste_viewport_espectador = null;
let timeout_ajuste_viewport_espectador = null;
let resize_observer_fit_viewport_espectador = null;
let estado_creditos_espectador = {
    creditos: { ...window.ScribCredits.DEFAULT_STATE },
    mostrar: false,
    animacion_id: 0
};
let escala_ui_espectador = ESCALA_UI_ESPECTADOR_MAX;
let creditos_animacion_raf = null;
let creditos_animacion_inicio = null;
let creditos_animacion_y_inicio = 0;
let creditos_animacion_y_fin = 0;
let creditos_animacion_duracion_ms = 0;
const CREDITOS_SCROLL_VELOCIDAD_PX_S = 34;
const CREDITOS_SCROLL_DURACION_MIN_MS = 28000;
const CREDITOS_SCROLL_MARGEN_SALIDA_PX = 100;
const reproducirMusicaCreditosEspectador = () => {
    if (!creditos_audio_espectador) return;
    creditos_audio_espectador.loop = true;
    creditos_audio_espectador.volume = 0.84;
    const promesa = creditos_audio_espectador.play();
    if (promesa && typeof promesa.catch === "function") {
        promesa.catch(() => {
            const reintentar = () => {
                if (vista_espectador_modo_resuelta !== "creditos") return;
                creditos_audio_espectador.play().catch(() => {});
            };
            document.addEventListener("pointerdown", reintentar, { once: true });
        });
    }
};
const detenerMusicaCreditosEspectador = () => {
    if (!creditos_audio_espectador) return;
    creditos_audio_espectador.pause();
    try { creditos_audio_espectador.currentTime = 0; } catch (_error) {}
};
const interpolarEscalaUiEspectador = (valor, salidaMin, salidaMax) => {
    const escala = normalizarEscalaUiEspectador(valor);
    const rangoEntrada = ESCALA_UI_ESPECTADOR_MAX - ESCALA_UI_ESPECTADOR_MIN;
    if (rangoEntrada <= 0) {
        return salidaMin;
    }
    const progreso = (escala - ESCALA_UI_ESPECTADOR_MIN) / rangoEntrada;
    return salidaMin + ((salidaMax - salidaMin) * progreso);
};
const normalizarEscalaUiEspectador = (valor, fallback = ESCALA_UI_ESPECTADOR_MAX) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
        return fallback;
    }
    return Math.max(ESCALA_UI_ESPECTADOR_MIN, Math.min(ESCALA_UI_ESPECTADOR_MAX, numero));
};
const aplicarEscalaUiEspectador = () => {
    const root = document.body && document.body.classList && document.body.classList.contains("page-spectator")
        ? document.body
        : document.documentElement;
    if (!root || !root.style) return;
    const escala = normalizarEscalaUiEspectador(escala_ui_espectador);
    root.style.setProperty("--spectator-ui-scale", escala.toFixed(3));
    root.style.setProperty("--spectator-name-scale", interpolarEscalaUiEspectador(escala, 0.9, 1.22).toFixed(3));
    root.style.setProperty("--spectator-time-scale", interpolarEscalaUiEspectador(escala, 0.9, 1.18).toFixed(3));
    root.style.setProperty("--spectator-meta-scale", interpolarEscalaUiEspectador(escala, 0.92, 1.2).toFixed(3));
    root.style.setProperty("--spectator-level-scale", interpolarEscalaUiEspectador(escala, 0.9, 1.18).toFixed(3));
    root.style.setProperty("--spectator-text-lines", interpolarEscalaUiEspectador(escala, 8.1, 4.25).toFixed(2));
};

const resetAjusteViewportEspectador = () => {
    if (!spectator_fit_root) return;
    spectator_fit_root.style.removeProperty("transform");
    spectator_fit_root.style.removeProperty("--spectator-veil-left");
    spectator_fit_root.style.removeProperty("--spectator-veil-right");
    spectator_fit_root.style.removeProperty("--spectator-veil-width");
};

const prepararMedicionViewportEspectador = () => {
    if (!spectator_fit_root) return;
    spectator_fit_root.style.transform = "none";
    spectator_fit_root.style.setProperty("--spectator-veil-left", "0px");
    spectator_fit_root.style.setProperty("--spectator-veil-right", "0px");
    spectator_fit_root.style.setProperty("--spectator-veil-width", "52vw");
};

const ajustarViewportEspectador = () => {
    if (!spectator_fit_root) return;
    const teleprompterActivo = Boolean(teleprompter_estado && teleprompter_estado.visible);
    const vistaPantallaCompleta = !["partida", "calentamiento"].includes(vista_espectador_modo_resuelta);
    if (teleprompterActivo || vistaPantallaCompleta) {
        resetAjusteViewportEspectador();
        return;
    }

    prepararMedicionViewportEspectador();
    const viewportW = Math.max(window.innerWidth || 0, 1);
    const viewportH = Math.max(window.innerHeight || 0, 1);
    const anchoNatural = Math.max(Math.ceil(spectator_fit_root.scrollWidth || 0), 1);
    const altoNatural = Math.max(Math.ceil(spectator_fit_root.scrollHeight || 0), 1);
    const escalaMaxima = Math.min(1, viewportW / anchoNatural, viewportH / altoNatural);

    let escala = escalaMaxima;
    if (!Number.isFinite(escala) || escala <= 0) {
        escala = Number.isFinite(escalaMaxima) && escalaMaxima > 0 ? escalaMaxima : 1;
    }

    const offsetX = Math.max(0, (viewportW - (anchoNatural * escala)) * 0.5);
    const anchoCajaRoot = Math.max(Math.ceil(spectator_fit_root.offsetWidth || 0), 1);
    const offsetRight = Math.max(0, viewportW - (offsetX + (anchoCajaRoot * escala)));
    const escalaSegura = Math.max(escala, 0.0001);
    spectator_fit_root.style.setProperty("--spectator-veil-left", `${(-offsetX / escalaSegura).toFixed(2)}px`);
    spectator_fit_root.style.setProperty("--spectator-veil-right", `${(-offsetRight / escalaSegura).toFixed(2)}px`);
    spectator_fit_root.style.setProperty("--spectator-veil-width", `${((viewportW * 0.52) / escalaSegura).toFixed(2)}px`);
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
    if (timeout_ajuste_viewport_espectador) {
        clearTimeout(timeout_ajuste_viewport_espectador);
    }
    timeout_ajuste_viewport_espectador = setTimeout(() => {
        timeout_ajuste_viewport_espectador = null;
        programarAjusteViewportEspectador();
    }, 120);
};
const limitarPct = (valor, min, max) => Math.max(min, Math.min(max, valor));
const normalizarModoVistaEspectador = (valor) => {
    const modo = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    return MODOS_VISTA_ESPECTADOR.has(modo) ? modo : "tutorial";
};
const normalizarOverrideVistaEspectador = (valor) => {
    const modo = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    return MODOS_OVERRIDE_ESPECTADOR.has(modo) ? modo : "tutorial";
};
const resolverModoVistaEspectadorLocal = () => {
    if (
        vista_espectador_override === "tutorial"
        || vista_espectador_override === "stats"
        || vista_espectador_override === "puntuacion"
        || vista_espectador_override === "nube_inspiracion"
        || vista_espectador_override === "creditos"
        || vista_espectador_override === "deliberacion"
        || vista_espectador_override === "resultado_jurado"
        || vista_espectador_override === "resultado_final"
    ) {
        return vista_espectador_override;
    }
    return vista_calentamiento ? "calentamiento" : "partida";
};
const normalizarPasoSlideStatsEspectador = (valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.trunc(numero) : 0;
};
const resolverIndiceSlideStatsEspectador = (paso, total) => {
    const cantidad = Number(total);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return 0;
    }
    const resto = normalizarPasoSlideStatsEspectador(paso) % cantidad;
    return resto < 0 ? resto + cantidad : resto;
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
        musa_nombre: typeof (entrada.musa_nombre ?? entrada.nombre_musa) === "string"
            ? (entrada.musa_nombre ?? entrada.nombre_musa)
            : "",
        musas: Array.isArray(entrada.musas) ? entrada.musas.slice(0, 6) : [],
        ts: Number(entrada.ts) || 0,
        animTs: Number(entrada.animTs) || 0
    };
};
const normalizarSolicitudCalentamientoVista = (valor) => {
    const tipo = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    return TIPOS_SOLICITUD_CALENTAMIENTO_VISTA.has(tipo) ? tipo : SOLICITUD_CALENTAMIENTO_VISTA_POR_DEFECTO;
};
const normalizarPayloadCreditosEspectador = window.ScribCredits.normalizarPayload;
const renderizarListaMusasCreditosEspectador = (musas = [], clase = "") => {
    if (!Array.isArray(musas) || musas.length === 0) {
        return `<p class="creditos-musas-vacio">${escapeHtml(tJuego2P("credits.muses_empty", {}, "Sin musas registradas"))}</p>`;
    }
    return `<ul class="creditos-musas-lista ${clase}">${musas.map((musa) => (
        `<li>${escapeHtml(musa)}</li>`
    )).join("")}</ul>`;
};
const renderizarMusasCreditosEspectador = (musas = {}) => {
    const azules = Array.isArray(musas.azules) ? musas.azules : [];
    const rojas = Array.isArray(musas.rojas) ? musas.rojas : [];
    if (!azules.length && !rojas.length) {
        return "";
    }
    return `
        <div class="creditos-bloque creditos-bloque--musas">
            <h3 class="creditos-subtitulo">${escapeHtml(tJuego2P("credits.muses_title", {}, "MUSAS"))}</h3>
            <div class="creditos-musas-grid">
                <section class="creditos-musas-columna creditos-musas-columna--azul">
                    <h4>${escapeHtml(tJuego2P("credits.muses_blue", {}, "MUSAS AZULES"))}</h4>
                    ${renderizarListaMusasCreditosEspectador(azules, "creditos-musas-lista--azul")}
                </section>
                <section class="creditos-musas-columna creditos-musas-columna--roja">
                    <h4>${escapeHtml(tJuego2P("credits.muses_red", {}, "MUSAS ROJAS"))}</h4>
                    ${renderizarListaMusasCreditosEspectador(rojas, "creditos-musas-lista--roja")}
                </section>
            </div>
        </div>
    `;
};
const detenerAnimacionCreditosEspectador = (reiniciar = true) => {
    if (creditos_animacion_raf) {
        cancelAnimationFrame(creditos_animacion_raf);
        creditos_animacion_raf = null;
    }
    creditos_animacion_inicio = null;
    creditos_animacion_y_inicio = 0;
    creditos_animacion_y_fin = 0;
    creditos_animacion_duracion_ms = 0;
    if (reiniciar && creditos_track) {
        creditos_track.style.transform = "translate3d(-50%, 140vh, 0)";
        creditos_track.style.opacity = "1";
    }
    if (creditos_espectador) {
        creditos_espectador.classList.remove("creditos-finalizados");
    }
    if (creditos_sociales_final) {
        creditos_sociales_final.setAttribute("aria-hidden", "true");
    }
};
const renderizarCreditosEspectador = () => {
    if (!creditos_content) return;
    const data = estado_creditos_espectador && estado_creditos_espectador.creditos
        ? estado_creditos_espectador.creditos
        : window.ScribCredits.DEFAULT_STATE;
    const lineas = window.ScribCredits.SPECTATOR_ORDER.map(([label, campo]) => {
        const valor = data[campo] ? data[campo] : "â€”";
        return `<div class="credito-linea"><span class="credito-label">${escapeHtml(label)}</span><span class="credito-leader" aria-hidden="true"></span><span class="credito-valor">${escapeHtml(valor)}</span></div>`;
    }).join("");
    const agradecimientos = data.agradecimientos
        ? escapeHtml(data.agradecimientos).replace(/\n/g, "<br>")
        : tJuego2P("credits.thanks_pending", {}, "Agradecimientos pendientes.");
    const musas = renderizarMusasCreditosEspectador(data.musas);
    creditos_content.innerHTML = `
        <header class="creditos-apertura">
            <div class="creditos-apertura__logos" aria-label="SCRI B">
                <img class="creditos-apertura__marca creditos-apertura__marca--scrib" src="../media/scrib-logo-mark.png" alt="SCRI B">
            </div>
            <p>CR&Eacute;DITOS DEL SHOW</p>
        </header>
        <div class="creditos-bloque">
            <div class="creditos-lineas">${lineas}</div>
        </div>
        ${musas}
        <div class="creditos-bloque creditos-bloque--agradecimientos">
            <h3 class="creditos-subtitulo">${tJuego2P("credits.thanks_title", {}, "AGRADECIMIENTOS:")}</h3>
            <p class="creditos-agradecimientos">${agradecimientos}</p>
        </div>
        <footer class="creditos-cierre">
            <div class="creditos-cierre__produccion" aria-label="Una producci&oacute;n de Sutura">
                <small>UNA PRODUCCI&Oacute;N DE</small>
                <span class="creditos-cierre__sutura-lockup"><img class="creditos-cierre__marca--sutura" src="../img/logo.png" alt="Sutura Teatro"></span>
            </div>
            <p>GRACIAS POR HACERLO POSIBLE.</p>
        </footer>
    `;
};
const iniciarAnimacionCreditosEspectador = (forzar = false) => {
    if (!creditos_espectador || !creditos_track) return;
    if (!forzar && (creditos_animacion_raf || creditos_animacion_inicio !== null)) {
        return;
    }
    renderizarCreditosEspectador();
    detenerAnimacionCreditosEspectador(false);
    creditos_espectador.classList.remove("creditos-finalizados");
    if (creditos_sociales_final) creditos_sociales_final.setAttribute("aria-hidden", "false");
    reproducirMusicaCreditosEspectador();
    creditos_track.style.opacity = "1";
    const altoViewportInicial = Math.max(window.innerHeight || 0, 1);
    const yInicioVisible = Math.round(altoViewportInicial * 0.82);
    creditos_track.style.transform = `translate3d(-50%, ${yInicioVisible}px, 0)`;
    requestAnimationFrame(() => {
        if (!creditos_espectador || !creditos_track || vista_espectador_modo_resuelta !== "creditos") return;
        const altoViewport = Math.max(window.innerHeight || 0, 1);
        const yInicio = yInicioVisible;
        const centroSocial = creditos_sociales_final
            ? (creditos_sociales_final.offsetTop + (creditos_sociales_final.offsetHeight * 0.5))
            : Math.max(
                Math.ceil(creditos_track.scrollHeight || 0),
                Math.ceil(creditos_track.getBoundingClientRect().height || 0),
                1
            ) + CREDITOS_SCROLL_MARGEN_SALIDA_PX;
        const yFin = Math.round((altoViewport * 0.5) - centroSocial);
        const distancia = Math.max(1, yInicio - yFin);
        const duracionMs = Math.max(
            CREDITOS_SCROLL_DURACION_MIN_MS,
            Math.round((distancia / CREDITOS_SCROLL_VELOCIDAD_PX_S) * 1000)
        );

        creditos_animacion_y_inicio = yInicio;
        creditos_animacion_y_fin = yFin;
        creditos_animacion_duracion_ms = duracionMs;
        creditos_animacion_inicio = null;
        creditos_track.style.transform = `translate3d(-50%, ${yInicio.toFixed(2)}px, 0)`;

        const step = (ts) => {
            if (!creditos_espectador || !creditos_track || vista_espectador_modo_resuelta !== "creditos") {
                creditos_animacion_raf = null;
                return;
            }
            if (!Number.isFinite(creditos_animacion_inicio) || creditos_animacion_inicio === null) {
                creditos_animacion_inicio = ts;
            }
            const progreso = Math.min(
                (ts - creditos_animacion_inicio) / Math.max(1, creditos_animacion_duracion_ms),
                1
            );
            const yActual = creditos_animacion_y_inicio + ((creditos_animacion_y_fin - creditos_animacion_y_inicio) * progreso);
            creditos_track.style.transform = `translate3d(-50%, ${yActual.toFixed(2)}px, 0)`;

            if (progreso >= 1) {
                creditos_animacion_raf = null;
                creditos_espectador.classList.add("creditos-finalizados");
                creditos_track.style.transform = `translate3d(-50%, ${creditos_animacion_y_fin.toFixed(2)}px, 0)`;
                return;
            }
            creditos_animacion_raf = requestAnimationFrame(step);
        };

        creditos_animacion_raf = requestAnimationFrame(step);
    });
};
const actualizarCreditosEspectador = (payload = {}) => {
    const previoAnimacionId = Number(estado_creditos_espectador && estado_creditos_espectador.animacion_id) || 0;
    estado_creditos_espectador = normalizarPayloadCreditosEspectador(payload);
    renderizarCreditosEspectador();
    const hayNuevaAnimacion = estado_creditos_espectador.animacion_id !== previoAnimacionId;
    if (vista_espectador_modo_resuelta === "creditos" && hayNuevaAnimacion) {
        iniciarAnimacionCreditosEspectador(true);
    }
};
const normalizarTextoDetonadorHistorial = (valor) => String(valor ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXTO_DETONADOR_HISTORIAL);
const obtenerDetonadorElegidoHistorial = (equipos = {}) => {
    const finalJ1 = normalizarFinalCalentamientoEspectador(equipos && equipos[1] ? equipos[1].final : null);
    const finalJ2 = normalizarFinalCalentamientoEspectador(equipos && equipos[2] ? equipos[2].final : null);
    const palabraJ1 = finalJ1 ? normalizarTextoDetonadorHistorial(finalJ1.palabra) : "";
    const palabraJ2 = finalJ2 ? normalizarTextoDetonadorHistorial(finalJ2.palabra) : "";
    if (palabraJ1 && palabraJ2) {
        if (palabraJ1.toUpperCase() === palabraJ2.toUpperCase()) return palabraJ1.toUpperCase();
        return normalizarTextoDetonadorHistorial(`${palabraJ1} / ${palabraJ2}`).toUpperCase();
    }
    if (palabraJ1) return palabraJ1.toUpperCase();
    if (palabraJ2) return palabraJ2.toUpperCase();
    return traducirSolicitudCalentamientoEspectador(SOLICITUD_CALENTAMIENTO_VISTA_NINGUNA, { corta: true }).toUpperCase();
};
const obtenerDetallesDetonadorHistorial = (equipos = {}) => [1, 2]
    .map((equipo) => {
        const final = normalizarFinalCalentamientoEspectador(equipos && equipos[equipo] ? equipos[equipo].final : null);
        if (!final) return null;
        return {
            equipo,
            palabra: normalizarTextoDetonadorHistorial(final.palabra).toUpperCase(),
            autoria: final
        };
    })
    .filter(Boolean);
const renderizarHistorialDetonadores = () => {
    if (!calentamiento_detonadores_historial) return;
    calentamiento_detonadores_historial.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const textoVacio = traducirSolicitudCalentamientoEspectador(SOLICITUD_CALENTAMIENTO_VISTA_NINGUNA, { corta: true }).toUpperCase();
    const valoresVacios = new Set(["NINGUNO", "NONE", "AUCUN", textoVacio]);
    historial_detonadores_espectador.forEach((entrada) => {
        const item = document.createElement("div");
        item.className = `detonador-historial-item tipo-${entrada.tipo}`;
        const titulo = document.createElement("span");
        titulo.className = "detonador-historial-caso";
        titulo.textContent = traducirSolicitudCalentamientoEspectador(entrada.tipo).toUpperCase();
        const valor = document.createElement("span");
        valor.className = "detonador-historial-label";
        const textoValorGuardado = normalizarTextoDetonadorHistorial(entrada.valor).toUpperCase();
        const textoValor = valoresVacios.has(textoValorGuardado) || !textoValorGuardado
            ? textoVacio
            : textoValorGuardado;
        const detalles = Array.isArray(entrada.detalles) ? entrada.detalles : [];
        if (detalles.length) {
            valor.classList.add("has-pairs");
            detalles.forEach((detalle) => {
                const par = document.createElement("span");
                par.className = `detonador-historial-pair equipo-${detalle.equipo}`;
                const palabra = document.createElement("span");
                palabra.className = "detonador-historial-pair__word";
                palabra.textContent = detalle.palabra;
                par.appendChild(palabra);
                const firma = crearNodoFirmaMusaEspectador(detalle.autoria, "inspiration-author--history");
                if (firma) par.appendChild(firma);
                valor.appendChild(par);
            });
        } else {
            valor.textContent = textoValor;
        }
        if (textoValor === textoVacio) {
            item.classList.add("is-empty");
        }
        item.appendChild(titulo);
        item.appendChild(valor);
        fragment.appendChild(item);
    });
    calentamiento_detonadores_historial.appendChild(fragment);
};
const limpiarHistorialDetonadores = () => {
    historial_detonadores_espectador = crearHistorialDetonadoresBase();
    renderizarHistorialDetonadores();
};
const registrarDetonadorHistorial = (solicitud, equipos = {}) => {
    const tipo = normalizarSolicitudCalentamientoVista(solicitud);
    if (!ORDEN_SOLICITUD_CALENTAMIENTO_VISTA.includes(tipo)) {
        renderizarHistorialDetonadores();
        return;
    }
    const entrada = historial_detonadores_espectador.find((item) => item.tipo === tipo);
    if (!entrada) {
        renderizarHistorialDetonadores();
        return;
    }
    const detonadorElegido = obtenerDetonadorElegidoHistorial(equipos);
    if (detonadorElegido && detonadorElegido !== "NINGUNO") {
        entrada.valor = detonadorElegido;
        entrada.detalles = obtenerDetallesDetonadorHistorial(equipos);
    }
    renderizarHistorialDetonadores();
};
const actualizarConsignaCalentamientoEspectador = (solicitud, equipos = {}) => {
    const tipo = normalizarSolicitudCalentamientoVista(solicitud);
    registrarDetonadorHistorial(tipo, equipos);
    if (!calentamiento_consigna_espectador) {
        solicitud_calentamiento_espectador = tipo;
        return;
    }
    const etiquetaActual = traducirSolicitudCalentamientoEspectador(tipo);
    calentamiento_consigna_espectador.textContent = tJuego2P(
        "warmup.request.spectator",
        { label: etiquetaActual },
        `DETONADOR ACTUAL: ${etiquetaActual}`
    );
    calentamiento_consigna_espectador.classList.remove("tipo-libre", "tipo-ninguna", "tipo-lugares", "tipo-acciones", "tipo-frase_final");
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
        const nombreAzul = normalizarNombreCursorCalentamiento(
            getEl("nombre")?.value,
            traducirNombreEscritoraEspectador(1, "ESCRITORA AZUL")
        );
        calentamiento_cursor_label_1.textContent = nombreAzul;
    }
    if (calentamiento_cursor_label_2) {
        const nombreRojo = normalizarNombreCursorCalentamiento(
            getEl("nombre1")?.value,
            traducirNombreEscritoraEspectador(2, "ESCRITORA ROJA")
        );
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

const obtenerRectStageCalentamientoEspectador = () => {
    if (!calentamiento_stage_espectador || typeof calentamiento_stage_espectador.getBoundingClientRect !== "function") {
        return null;
    }
    const rect = calentamiento_stage_espectador.getBoundingClientRect();
    const width = Number(rect && rect.width) || 0;
    const height = Number(rect && rect.height) || 0;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return null;
    }
    return rect;
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
                musa_nombre: typeof (entrada.musa_nombre ?? entrada.nombre_musa) === "string"
                    ? (entrada.musa_nombre ?? entrada.nombre_musa)
                    : "",
                musas: Array.isArray(entrada.musas) ? entrada.musas.slice(0, 6) : [],
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

const contextoMedicionCalentamiento = (() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    if (!canvas || typeof canvas.getContext !== "function") return null;
    return canvas.getContext("2d");
})();

const limitarNumeroCalentamiento = (valor, min, max) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return min;
    return Math.max(min, Math.min(max, numero));
};

const obtenerTamFuentePalabraCalentamientoPx = () => {
    const viewport = Math.max(window.innerWidth || 0, 1);
    return Math.max(15, Math.min(34, viewport * 0.022));
};

const medirCajaPalabraCalentamiento = (entrada, maxAnchoPx) => {
    const contenido = String(entrada && entrada.palabra || "").trim();
    const firma = normalizarFirmaMusaEspectador(entrada || {});
    const tamFuente = obtenerTamFuentePalabraCalentamientoPx();
    const maxAnchoSeguro = Math.max(120, Number(maxAnchoPx) || 320);
    let anchoTexto = contenido.length * (tamFuente * 0.62);
    if (contextoMedicionCalentamiento && typeof contextoMedicionCalentamiento.measureText === "function") {
        contextoMedicionCalentamiento.font = `${tamFuente}px "Retro-gaming", monospace`;
        anchoTexto = Math.max(anchoTexto, contextoMedicionCalentamiento.measureText(contenido).width);
    }
    const tamFirma = Math.max(9, tamFuente * 0.38);
    let anchoFirma = firma.texto ? Array.from(`✦ ${firma.texto}`).length * (tamFirma * 0.62) : 0;
    if (firma.texto && contextoMedicionCalentamiento && typeof contextoMedicionCalentamiento.measureText === "function") {
        contextoMedicionCalentamiento.font = `${tamFirma}px "Retro-gaming", monospace`;
        anchoFirma = Math.max(anchoFirma, contextoMedicionCalentamiento.measureText(`✦ ${firma.texto}`).width);
    }
    const paddingX = tamFuente * 0.9;
    const paddingY = tamFuente * 0.56;
    const anchoCaja = Math.max(tamFuente * 2.4, Math.min(maxAnchoSeguro, Math.max(anchoTexto + paddingX, anchoFirma + (tamFirma * 1.5))));
    const lineas = Math.max(1, Math.ceil((anchoTexto + (tamFuente * 0.16)) / maxAnchoSeguro));
    const altoLinea = tamFuente * 1.08;
    const altoFirma = firma.texto ? (tamFirma * 1.65) + Math.max(2, tamFuente * 0.08) : 0;
    const altoCaja = Math.max(altoLinea + paddingY, (lineas * altoLinea) + paddingY) + altoFirma;
    const factorReserva = entrada && (entrada.destacada || entrada.esFinal) ? 1.34 : 1.06;
    return {
        ancho: anchoCaja * factorReserva,
        alto: altoCaja * factorReserva,
        maxAncho: maxAnchoSeguro
    };
};

const haySolapePalabrasCalentamiento = (a, b, separacion = 0) => (
    Math.abs(a.cx - b.cx) < (((a.w + b.w) * 0.5) + separacion)
    && Math.abs(a.cy - b.cy) < (((a.h + b.h) * 0.5) + separacion)
);

const resolverPosicionSeguraPalabraCalentamiento = (entrada, cajasOcupadas, stageW, stageH, minY) => {
    const margenExteriorPx = 6;
    const maxAnchoTexto = entrada && entrada.esFinal
        ? Math.max(170, Math.min(stageW * 0.54, 620))
        : Math.max(150, Math.min(stageW * 0.4, 500));
    const caja = medirCajaPalabraCalentamiento(entrada, maxAnchoTexto);
    const minXPx = (caja.ancho * 0.5) + margenExteriorPx;
    const maxXPx = stageW - (caja.ancho * 0.5) - margenExteriorPx;
    const minYPx = ((limitarPct(minY, 0, 100) / 100) * stageH) + (caja.alto * 0.5) + margenExteriorPx;
    const maxYPx = stageH - (caja.alto * 0.5) - margenExteriorPx;

    const rangoXValido = minXPx <= maxXPx;
    const rangoYValido = minYPx <= maxYPx;
    const xBase = rangoXValido
        ? limitarNumeroCalentamiento((limitarPct(entrada.x, 0, 100) / 100) * stageW, minXPx, maxXPx)
        : stageW * 0.5;
    const yBase = rangoYValido
        ? limitarNumeroCalentamiento((limitarPct(entrada.y, minY, 96) / 100) * stageH, minYPx, maxYPx)
        : stageH * 0.5;

    const separacion = Math.max(5, Math.min(18, caja.alto * 0.16));
    const existeColision = (cx, cy) => cajasOcupadas.some((ocupada) => haySolapePalabrasCalentamiento(
        { cx, cy, w: caja.ancho, h: caja.alto },
        ocupada,
        separacion
    ));

    let posicionEncontrada = existeColision(xBase, yBase) ? null : { x: xBase, y: yBase };
    if (!posicionEncontrada) {
        const maxIntentos = 30;
        for (let intento = 1; intento <= maxIntentos; intento += 1) {
            const salto = Math.ceil(intento / 2);
            const dirY = (intento % 2 === 0) ? -1 : 1;
            const dirX = (intento % 4 < 2) ? 1 : -1;
            const deltaY = salto * ((caja.alto * 0.72) + 4);
            const deltaX = salto * Math.max(8, Math.min(26, caja.ancho * 0.15));
            const yCandidato = rangoYValido
                ? limitarNumeroCalentamiento(yBase + (dirY * deltaY), minYPx, maxYPx)
                : yBase;
            const xCandidato = rangoXValido
                ? limitarNumeroCalentamiento(xBase + (dirX * deltaX), minXPx, maxXPx)
                : xBase;

            if (!existeColision(xCandidato, yCandidato)) {
                posicionEncontrada = { x: xCandidato, y: yCandidato };
                break;
            }
            if (!existeColision(xBase, yCandidato)) {
                posicionEncontrada = { x: xBase, y: yCandidato };
                break;
            }
            if (!existeColision(xCandidato, yBase)) {
                posicionEncontrada = { x: xCandidato, y: yBase };
                break;
            }
        }
    }

    if (!posicionEncontrada) return null;
    const xFinal = posicionEncontrada.x;
    const yFinal = posicionEncontrada.y;

    cajasOcupadas.push({
        cx: xFinal,
        cy: yFinal,
        w: caja.ancho,
        h: caja.alto
    });

    return {
        xPct: limitarPct((xFinal / Math.max(1, stageW)) * 100, 0, 100),
        yPct: limitarPct((yFinal / Math.max(1, stageH)) * 100, minY, 96),
        maxAncho: caja.maxAncho
    };
};

const renderizarPalabrasCalentamiento = () => {
    if (!calentamiento_nube) return;
    calentamiento_nube.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const ahora = Date.now();
    const minY = obtenerMinYPalabrasCalentamiento();
    const rectStage = obtenerRectStageCalentamientoEspectador();
    const stageW = Math.max(1, Number(rectStage && rectStage.width) || window.innerWidth || 1);
    const stageH = Math.max(1, Number(rectStage && rectStage.height) || window.innerHeight || 1);
    const cajasOcupadas = [];
    const entradasVisibles = palabras_calentamiento.slice().sort((a, b) => {
        const prioridadA = Number(Boolean(a.esFinal)) * 4 + Number(Boolean(a.destacada)) * 2;
        const prioridadB = Number(Boolean(b.esFinal)) * 4 + Number(Boolean(b.destacada)) * 2;
        return prioridadB - prioridadA || (Number(b.ts) || 0) - (Number(a.ts) || 0);
    }).slice(0, 80);
    entradasVisibles.forEach((entrada) => {
        const posicionSegura = resolverPosicionSeguraPalabraCalentamiento(
            entrada,
            cajasOcupadas,
            stageW,
            stageH,
            minY
        );
        if (!posicionSegura) return;
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
        const palabraTexto = document.createElement("span");
        palabraTexto.className = "calentamiento-palabra__texto";
        palabraTexto.textContent = entrada.palabra;
        nodo.appendChild(palabraTexto);
        const firma = crearNodoFirmaMusaEspectador(entrada, "inspiration-author--warmup");
        if (firma) nodo.appendChild(firma);
        nodo.style.left = `${posicionSegura.xPct}%`;
        nodo.style.top = `${posicionSegura.yPct}%`;
        nodo.style.setProperty("--calentamiento-word-max-width", `${Math.round(posicionSegura.maxAncho)}px`);
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
    const xPct = Math.max(0, Math.min(100, x));
    const yPct = Math.max(0, Math.min(100, y));
    const rectStage = obtenerRectStageCalentamientoEspectador();
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

const renderizarCursoresCalentamiento = () => {
    aplicarCursorCalentamiento(calentamiento_cursor_1, cursores_calentamiento[1]);
    aplicarCursorCalentamiento(calentamiento_cursor_2, cursores_calentamiento[2]);
};

const crearJugadorStatsVacioEspectador = (id) => ({
    id,
    nombre: `ESCRITXR ${id}`,
    palabrasTotal: 0,
    pulsacionesTotal: 0,
    teclasDistintas: 0,
    topTeclas: [],
    heatmap: {},
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
const normalizarHeatmapStatsEspectador = (entrada, topTeclasFallback = []) => {
    const salida = {};
    const pushTecla = (code, count) => {
        const codigo = String(code || "").trim().slice(0, 24);
        const valor = Math.max(0, Number(count) || 0);
        if (!codigo || !Number.isFinite(valor) || valor <= 0) return;
        if (Object.prototype.hasOwnProperty.call(salida, codigo)) return;
        if (Object.keys(salida).length >= 128) return;
        salida[codigo] = valor;
    };
    if (entrada && typeof entrada === "object") {
        if (Array.isArray(entrada)) {
            entrada.forEach((item) => {
                if (!item || typeof item !== "object") return;
                pushTecla(item.code, item.count);
            });
        } else {
            Object.keys(entrada).forEach((code) => pushTecla(code, entrada[code]));
        }
    }
    if (!Object.keys(salida).length && Array.isArray(topTeclasFallback)) {
        topTeclasFallback.forEach((item) => pushTecla(item && item.code, item && item.count));
    }
    return salida;
};
const reiniciarHistorialVidaStatsEspectador = () => {
    stats_historial_vida_espectador[1] = [];
    stats_historial_vida_espectador[2] = [];
};
const reiniciarTimelineModosStatsEspectador = () => {
    stats_timeline_modos_local_espectador.length = 0;
};
const obtenerTiempoPartidaReferenciaStatsEspectador = (preferido = null) => {
    const candidatoPreferido = Number(preferido);
    if (Number.isFinite(candidatoPreferido)) {
        return Math.max(0, candidatoPreferido);
    }
    const tiemposEstado = [1, 2].map((equipo) => {
        const jugador = estado_stats_live_espectador && estado_stats_live_espectador.players
            ? estado_stats_live_espectador.players[equipo]
            : null;
        return Math.max(0, Number(jugador && jugador.tiempoTotalMs) || 0);
    });
    const tiemposHistorial = [1, 2].map((equipo) => {
        const serie = Array.isArray(stats_historial_vida_espectador[equipo]) ? stats_historial_vida_espectador[equipo] : [];
        const ultimo = serie.length ? serie[serie.length - 1] : null;
        return Math.max(0, Number(ultimo && ultimo.t) || 0);
    });
    return Math.max(0, ...tiemposEstado, ...tiemposHistorial);
};
const registrarModoTimelineStatsEspectador = (modo = "", tiempoReferenciaMs = null) => {
    const modoNormalizado = String(modo || "").trim().toLowerCase();
    if (!modoNormalizado) return;
    const tiempoMs = obtenerTiempoPartidaReferenciaStatsEspectador(tiempoReferenciaMs);
    const ultimo = stats_timeline_modos_local_espectador.length
        ? stats_timeline_modos_local_espectador[stats_timeline_modos_local_espectador.length - 1]
        : null;
    if (!ultimo) {
        stats_timeline_modos_local_espectador.push({ modo: modoNormalizado, inicioMs: 0, finMs: null });
        return;
    }
    if (ultimo.modo === modoNormalizado) return;
    if (
        ultimo.finMs === null
        || typeof ultimo.finMs === "undefined"
        || !Number.isFinite(Number(ultimo.finMs))
    ) {
        ultimo.finMs = Math.max(ultimo.inicioMs, tiempoMs);
    }
    stats_timeline_modos_local_espectador.push({
        modo: modoNormalizado,
        inicioMs: Math.max(0, tiempoMs),
        finMs: null
    });
};
const obtenerTimelineModosLocalStatsEspectador = (tiempoActualMs = null) => {
    const tiempoMs = obtenerTiempoPartidaReferenciaStatsEspectador(tiempoActualMs);
    return stats_timeline_modos_local_espectador
        .map((segmento, indice, arr) => {
            const inicioMs = Math.max(0, Number(segmento && segmento.inicioMs) || 0);
            const finRaw = segmento ? segmento.finMs : null;
            const tieneFin = finRaw !== null && typeof finRaw !== "undefined" && Number.isFinite(Number(finRaw));
            const esUltimo = indice === (arr.length - 1);
            const inicioSiguiente = Math.max(
                inicioMs,
                Number(arr[indice + 1] && arr[indice + 1].inicioMs) || inicioMs
            );
            const finMs = tieneFin
                ? Math.max(inicioMs, Number(finRaw))
                : (esUltimo ? Math.max(inicioMs, tiempoMs) : inicioSiguiente);
            return {
                modo: String(segmento && segmento.modo ? segmento.modo : "").trim().toLowerCase(),
                inicioMs,
                finMs
            };
        })
        .filter((segmento) => segmento.modo && segmento.finMs > segmento.inicioMs);
};
const resolverTimelineModosStatsEspectador = (estado = {}) => {
    const tiempoActualMs = Math.max(
        0,
        Number(estado && estado.players && estado.players[1] ? estado.players[1].tiempoTotalMs : 0) || 0,
        Number(estado && estado.players && estado.players[2] ? estado.players[2].tiempoTotalMs : 0) || 0
    );
    const timelinePayload = Array.isArray(estado && estado.timeline_modos) ? estado.timeline_modos : [];
    const timelineLocal = obtenerTimelineModosLocalStatsEspectador(tiempoActualMs);
    if (timelinePayload.length) return timelinePayload;
    return timelineLocal;
};
const suavizarSegmentosModoStatsEspectador = (segmentos = [], minDuracionMs = 1800) => {
    const salida = [];
    (Array.isArray(segmentos) ? segmentos : []).forEach((segmento) => {
        if (!segmento || segmento.finMs <= segmento.inicioMs) return;
        const ultimo = salida.length ? salida[salida.length - 1] : null;
        if (ultimo && ultimo.modo === segmento.modo && segmento.inicioMs <= ultimo.finMs) {
            ultimo.finMs = Math.max(ultimo.finMs, segmento.finMs);
            return;
        }
        salida.push({ ...segmento });
    });
    for (let i = 0; i < salida.length; i += 1) {
        const actual = salida[i];
        if (!actual) continue;
        if ((actual.finMs - actual.inicioMs) >= minDuracionMs) continue;
        const previo = i > 0 ? salida[i - 1] : null;
        const siguiente = i < salida.length - 1 ? salida[i + 1] : null;
        if (previo && siguiente && previo.modo === siguiente.modo) {
            previo.finMs = Math.max(previo.finMs, siguiente.finMs);
            salida.splice(i, 2);
            i = Math.max(-1, i - 2);
            continue;
        }
        if (siguiente) {
            siguiente.inicioMs = Math.min(siguiente.inicioMs, actual.inicioMs);
            salida.splice(i, 1);
            i = Math.max(-1, i - 2);
            continue;
        }
        if (previo) {
            previo.finMs = Math.max(previo.finMs, actual.finMs);
            salida.splice(i, 1);
            i = Math.max(-1, i - 2);
        }
    }
    return salida.filter((segmento) => segmento && segmento.finMs > segmento.inicioMs);
};
const compactarSegmentosModoPorPixelesStatsEspectador = (segmentos = [], opciones = {}) => {
    const spanMs = Math.max(1, Number(opciones && opciones.spanMs) || 0);
    const plotWidthPx = Math.max(1, Number(opciones && opciones.plotWidthPx) || 0);
    const minPx = Math.max(0, Number(opciones && opciones.minPx) || 0);
    if (!Array.isArray(segmentos) || segmentos.length < 2 || minPx <= 0) {
        return Array.isArray(segmentos) ? segmentos.filter((segmento) => segmento && segmento.finMs > segmento.inicioMs) : [];
    }
    const salida = segmentos
        .map((segmento) => ({ ...segmento }))
        .filter((segmento) => segmento && segmento.finMs > segmento.inicioMs);
    let huboCambios = true;
    while (huboCambios && salida.length > 1) {
        huboCambios = false;
        for (let i = 0; i < salida.length; i += 1) {
            const actual = salida[i];
            if (!actual) continue;
            const duracionMs = Math.max(0, actual.finMs - actual.inicioMs);
            const anchoPx = (duracionMs / spanMs) * plotWidthPx;
            if (anchoPx >= minPx) continue;
            const previo = i > 0 ? salida[i - 1] : null;
            const siguiente = i < salida.length - 1 ? salida[i + 1] : null;
            if (previo && siguiente && previo.modo === siguiente.modo) {
                previo.finMs = Math.max(previo.finMs, siguiente.finMs);
                salida.splice(i, 2);
                huboCambios = true;
                break;
            }
            if (!previo && siguiente) {
                siguiente.inicioMs = Math.min(siguiente.inicioMs, actual.inicioMs);
                salida.splice(i, 1);
                huboCambios = true;
                break;
            }
            if (previo && !siguiente) {
                previo.finMs = Math.max(previo.finMs, actual.finMs);
                salida.splice(i, 1);
                huboCambios = true;
                break;
            }
            if (previo && siguiente) {
                const anchoPrevio = ((previo.finMs - previo.inicioMs) / spanMs) * plotWidthPx;
                const anchoSiguiente = ((siguiente.finMs - siguiente.inicioMs) / spanMs) * plotWidthPx;
                if (anchoPrevio >= anchoSiguiente) {
                    previo.finMs = Math.max(previo.finMs, actual.finMs);
                } else {
                    siguiente.inicioMs = Math.min(siguiente.inicioMs, actual.inicioMs);
                }
                salida.splice(i, 1);
                huboCambios = true;
                break;
            }
        }
    }
    return suavizarSegmentosModoStatsEspectador(salida, 0);
};
const registrarPuntoVidaStatsEspectador = (equipo, ts, valorVida) => {
    const id = Number(equipo);
    if (id !== 1 && id !== 2) return;
    const valor = Number(valorVida);
    if (!Number.isFinite(valor)) return;
    let timestamp = Number(ts);
    if (!Number.isFinite(timestamp)) {
        timestamp = Date.now();
    }
    const serie = stats_historial_vida_espectador[id];
    const ultimo = serie.length ? serie[serie.length - 1] : null;
    if (ultimo && timestamp <= ultimo.t) {
        timestamp = ultimo.t + 1;
    }
    if (ultimo) {
        const deltaVida = valor - ultimo.v;
        const deltaMs = timestamp - ultimo.t;
        const subidaBrusca = deltaVida >= STATS_REINICIO_SUBIDA_BRUSCA_SEGUNDOS
            && deltaMs >= 0
            && deltaMs <= STATS_REINICIO_SUBIDA_BRUSCA_VENTANA_MS;
        const veniaAgotado = ultimo.v <= 5;
        const ventanaArranqueMs = Math.min(2500, STATS_REINICIO_SUBIDA_BRUSCA_VENTANA_MS);
        const pareceArranqueDePartida = ultimo.t <= ventanaArranqueMs
            && timestamp <= (ventanaArranqueMs * 2);
        // Solo reinicia al principio real de la partida.
        if (subidaBrusca && veniaAgotado && pareceArranqueDePartida) {
            serie.length = 0;
        }
    }
    if (!serie.length && valor <= 0) return;
    const ultimoActual = serie.length ? serie[serie.length - 1] : null;
    if (ultimoActual && ultimoActual.v === valor && (timestamp - ultimoActual.t) < 700) return;
    serie.push({ t: timestamp, v: Math.max(0, valor) });
    const limiteMin = timestamp - STATS_HISTORIAL_VIDA_VENTANA_MS;
    while (serie.length > STATS_HISTORIAL_VIDA_MAX || (serie.length > 2 && serie[0].t < limiteMin)) {
        serie.shift();
    }
};
const actualizarHistorialVidaDesdeStatsEspectador = (estado) => {
    const data = estado && typeof estado === "object" ? estado : {};
    const ts = Number(data.ts) || Date.now();
    [1, 2].forEach((equipo) => {
        const jugador = data.players && data.players[equipo] ? data.players[equipo] : null;
        const actual = jugador && jugador.vida ? jugador.vida.actual : null;
        const tiempoPartidaMs = jugador ? Number(jugador.tiempoTotalMs) : NaN;
        registrarPuntoVidaStatsEspectador(
            equipo,
            Number.isFinite(tiempoPartidaMs) ? tiempoPartidaMs : ts,
            actual
        );
    });
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
        heatmap: normalizarHeatmapStatsEspectador(data.heatmap, data.topTeclas),
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
const normalizarTimelineModosStatsEspectador = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
        .map((item) => ({
            modo: String(item && item.modo ? item.modo : "").trim().slice(0, 32).toLowerCase(),
            inicioMs: Math.max(0, Number(item && item.inicioMs) || 0),
            finMs: Math.max(0, Number(item && item.finMs) || 0)
        }))
        .filter((item) => item.modo && item.finMs > item.inicioMs)
        .sort((a, b) => a.inicioMs - b.inicioMs)
        .slice(0, 48);
};
const normalizarStatsLiveEspectador = (payload = {}) => {
    const data = payload && typeof payload === "object" ? payload : {};
    const players = data.players && typeof data.players === "object" ? data.players : {};
    return {
        ts: Number.isFinite(Number(data.ts)) ? Number(data.ts) : Date.now(),
        modo_actual: String(data.modo_actual ?? "").trim().slice(0, 32),
        timeline_modos: normalizarTimelineModosStatsEspectador(data.timeline_modos),
        players: {
            1: normalizarJugadorStatsLiveEspectador(players[1], 1),
            2: normalizarJugadorStatsLiveEspectador(players[2], 2)
        }
    };
};
const normalizarSuperbonusInspiracionEspectador = (payload = {}) => {
    const meta = payload && typeof payload === "object" ? payload.superbonus : null;
    if (!meta || typeof meta !== "object" || meta.activo !== true) {
        return { activo: false, repeticiones: 1, musas: [] };
    }
    const repeticiones = Math.max(2, Math.trunc(Number(meta.repeticiones) || 2));
    const musas = Array.isArray(meta.musas)
        ? meta.musas
            .map((musa) => String(musa || "").trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];
    return { activo: true, repeticiones, musas };
};
const normalizarInfoPalabraNubeEspectador = (valor) => {
    if (typeof valor === "string") {
        const palabra = valor.trim().slice(0, 32);
        return palabra ? { palabra, repeticiones: 1, superbonus: false, musas: [] } : null;
    }
    if (!valor || typeof valor !== "object") return null;
    const palabra = String(valor.palabra ?? valor.word ?? valor.texto ?? "").trim().slice(0, 32);
    if (!palabra) return null;
    const repeticiones = Math.max(1, Math.trunc(Number(valor.repeticiones) || 1));
    const autorDirecto = valor.musa_nombre ?? valor.nombre_musa ?? valor.musa ?? "";
    const musasBase = Array.isArray(valor.musas) && valor.musas.length
        ? valor.musas
        : (String(autorDirecto || "").trim() ? [autorDirecto] : []);
    const musas = normalizarFirmaMusaEspectador({ musas: musasBase }, { fallback: false }).autores;
    return {
        palabra,
        repeticiones,
        superbonus: Boolean(valor.superbonus === true && repeticiones >= 2),
        musas
    };
};
const aplicarSuperbonusDefinicionEspectador = (nodo, payload = {}) => {
    if (!nodo || !nodo.classList) return { activo: false, repeticiones: 1, musas: [] };
    const superbonus = normalizarSuperbonusInspiracionEspectador(payload);
    nodo.classList.toggle("definicion-superbonus", superbonus.activo);
    if (nodo.dataset) {
        if (superbonus.activo) {
            nodo.dataset.superbonus = "true";
            nodo.dataset.superbonusRepeticiones = String(superbonus.repeticiones);
        } else {
            delete nodo.dataset.superbonus;
            delete nodo.dataset.superbonusRepeticiones;
        }
    }
    return superbonus;
};
const normalizarNubeInspiracionEspectador = (payload = {}) => {
    const data = payload && typeof payload === "object" ? payload : {};
    const equipos = data.equipos && typeof data.equipos === "object" ? data.equipos : {};
    const normalizarEquipo = (entrada, fallbackNombre) => {
        const equipoData = entrada && typeof entrada === "object" ? entrada : {};
        const nombre = String(equipoData.nombre ?? "").trim().slice(0, 28) || fallbackNombre;
        const palabrasInfoBase = Array.isArray(equipoData.palabras_info)
            ? equipoData.palabras_info
            : (Array.isArray(equipoData.palabras) ? equipoData.palabras : []);
        const palabras_info = palabrasInfoBase
            .map(normalizarInfoPalabraNubeEspectador)
            .filter(Boolean);
        const palabras = palabras_info.map((item) => item.palabra);
        return { nombre, palabras, palabras_info };
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
const resolverModoActivoStatsEspectador = (estado = {}) => {
    const candidatos = [
        estado && estado.modo_actual,
        modo_nivel_activo_espectador,
        modo_actual
    ];
    return candidatos
        .map((valor) => String(valor ?? "").trim().toLowerCase())
        .find(Boolean) || "";
};
const obtenerClaseNivelActualStatsEspectador = (modo = "") => ({
    "letra bendita": "stats-current-level--bendita",
    "letra prohibida": "stats-current-level--prohibida",
    "palabras bonus": "stats-current-level--bonus",
    "palabras prohibidas": "stats-current-level--prohibidas",
    "tertulia": "stats-current-level--tertulia",
    "frase final": "stats-current-level--frase-final"
})[String(modo || "").trim().toLowerCase()] || "";
const renderizarEstadoStatsEspectador = (modo = "") => {
    if (!stats_estado) return;
    const modoNormalizado = String(modo || "").trim().toLowerCase();
    if (!modoNormalizado) {
        stats_estado.textContent = tJuego2P("stats.state.waiting", {}, "Esperando estadisticas de las escritoras...");
        return;
    }
    const etiqueta = escapeHtml(tJuego2P("stats.current_level", {}, "Nivel actual"));
    const nombre = escapeHtml(traducirNombreModoEspectador(modoNormalizado, modoNormalizado.toUpperCase()));
    const claseModo = obtenerClaseNivelActualStatsEspectador(modoNormalizado);
    stats_estado.innerHTML = `
        <span class="stats-estado-label">${etiqueta}:</span>
        <span class="stats-current-level${claseModo ? ` ${claseModo}` : ""}">${nombre}</span>
    `;
};
const normalizarPasoEjeStats = (valor) => {
    const numero = Math.max(1, Number(valor) || 0);
    const magnitud = 10 ** Math.floor(Math.log10(numero));
    const fraccion = numero / magnitud;
    if (fraccion <= 1) return magnitud;
    if (fraccion <= 1.5) return 1.5 * magnitud;
    if (fraccion <= 2) return 2 * magnitud;
    if (fraccion <= 2.5) return 2.5 * magnitud;
    if (fraccion <= 4) return 4 * magnitud;
    if (fraccion <= 5) return 5 * magnitud;
    if (fraccion <= 7.5) return 7.5 * magnitud;
    return 10 * magnitud;
};
const redondearMaximoEjeVidaStats = (valor) => {
    const objetivo = Math.max(4, Number(valor) || 0);
    const paso = normalizarPasoEjeStats(objetivo / 4);
    return Math.max(4, Math.ceil(objetivo / paso) * paso);
};
const formatearValorEjeVidaStats = (valor) => `${Math.max(0, Math.round(Number(valor) || 0))} s`;
const renderizarNombreEquipoStats = (nombre, equipo) => (
    `<span class="stats-slide-player-name equipo-${Number(equipo) === 2 ? 2 : 1}">${escapeHtml(String(nombre || `ESCRITXR ${equipo}`).trim() || `ESCRITXR ${equipo}`)}</span>`
);
const obtenerPaletaModoStatsEspectador = (modo = "") => ({
    "letra bendita": { color: "#5dff86", fillOpacity: 0.38, edgeOpacity: 0.9 },
    "letra prohibida": { color: "#ff6f84", fillOpacity: 0.38, edgeOpacity: 0.9 },
    "palabras bonus": { color: "#ffd86f", fillOpacity: 0.38, edgeOpacity: 0.88 },
    "palabras prohibidas": { color: "#ff9be3", fillOpacity: 0.38, edgeOpacity: 0.88 },
    "tertulia": { color: "#86d0ff", fillOpacity: 0.34, edgeOpacity: 0.84 },
    "frase final": { color: "#ffb675", fillOpacity: 0.38, edgeOpacity: 0.88 }
})[String(modo || "").trim().toLowerCase()] || {
    color: "#ffffff",
    fillOpacity: 0.08,
    edgeOpacity: 0.28
};
const resolverSegmentosModoVisiblesStatsEspectador = (timeline = [], dominio = {}, modoActual = "") => {
    const inicioDominio = Math.max(0, Number(dominio.inicioMs) || 0);
    const finDominio = Math.max(inicioDominio, Number(dominio.finMs) || 0);
    const normalizarModo = (valor) => String(valor || "").trim().toLowerCase();
    const segmentosBase = (Array.isArray(timeline) ? timeline : [])
        .map((segmento) => ({
            modo: normalizarModo(segmento && segmento.modo),
            inicioMs: Math.max(0, Number(segmento && segmento.inicioMs) || 0),
            finMs: Math.max(0, Number(segmento && segmento.finMs) || 0)
        }))
        .filter((segmento) => segmento.modo && segmento.finMs > segmento.inicioMs)
        .sort((a, b) => a.inicioMs - b.inicioMs);
    const segmentos = [];
    segmentosBase.forEach((segmento) => {
        const inicioMs = Math.max(inicioDominio, segmento.inicioMs);
        const finMs = Math.min(finDominio, segmento.finMs);
        if (finMs <= inicioMs) return;
        const previo = segmentos[segmentos.length - 1];
        if (previo && previo.modo === segmento.modo && inicioMs <= previo.finMs) {
            previo.finMs = Math.max(previo.finMs, finMs);
            return;
        }
        segmentos.push({ modo: segmento.modo, inicioMs, finMs });
    });
    const modoActivo = normalizarModo(modoActual);
    if (!modoActivo || finDominio <= inicioDominio) {
        return suavizarSegmentosModoStatsEspectador(segmentos);
    }
    if (!segmentos.length) {
        return [{ modo: modoActivo, inicioMs: inicioDominio, finMs: finDominio }];
    }
    const ultimo = segmentos[segmentos.length - 1];
    if (ultimo.modo === modoActivo) {
        ultimo.finMs = Math.max(ultimo.finMs, finDominio);
    } else if (ultimo.finMs < finDominio) {
        segmentos.push({
            modo: modoActivo,
            inicioMs: Math.max(inicioDominio, ultimo.finMs),
            finMs: finDominio
        });
    }
    return suavizarSegmentosModoStatsEspectador(segmentos);
};
const renderizarBandasModoStatsEspectador = (timeline = [], serie = {}, dominio = {}, modoActual = "") => {
    const inicioDominio = Math.max(0, Number(dominio.inicioMs) || 0);
    const finDominio = Math.max(inicioDominio, Number(dominio.finMs) || 0);
    const spanDominio = Math.max(1, finDominio - inicioDominio);
    if (!Number.isFinite(serie.plotLeft) || !Number.isFinite(serie.plotWidth)) {
        return "";
    }
    const segmentosRecortados = compactarSegmentosModoPorPixelesStatsEspectador(
        resolverSegmentosModoVisiblesStatsEspectador(timeline, {
            inicioMs: inicioDominio,
            finMs: finDominio
        }, modoActual),
        {
            spanMs: spanDominio,
            plotWidthPx: serie.plotWidth,
            minPx: 10
        }
    );
    const bandasHtml = segmentosRecortados.map((segmento) => {
        const inicioMs = segmento.inicioMs;
        const finMs = segmento.finMs;
        const x = serie.plotLeft + (((inicioMs - inicioDominio) / spanDominio) * serie.plotWidth);
        const xFin = serie.plotLeft + (((finMs - inicioDominio) / spanDominio) * serie.plotWidth);
        const width = Math.max(0, xFin - x);
        if (width <= 0.4) {
            return "";
        }
        const paleta = obtenerPaletaModoStatsEspectador(segmento.modo);
        const titulo = traducirNombreModoEspectador(segmento.modo, String(segmento.modo || "").toUpperCase());
        return `
            <g class="stats-tiempo-banda">
                <title>${escapeHtml(titulo)}</title>
                <rect x="${x.toFixed(2)}" y="${serie.plotTop.toFixed(2)}" width="${width.toFixed(2)}" height="${serie.plotHeight.toFixed(2)}" fill="${paleta.color}" fill-opacity="${paleta.fillOpacity}"></rect>
            </g>
        `;
    }).join("");
    const separadoresHtml = segmentosRecortados.slice(0, -1).map((segmento, indice) => {
        const siguiente = segmentosRecortados[indice + 1];
        if (!siguiente || segmento.modo === siguiente.modo) {
            return "";
        }
        const xSeparador = serie.plotLeft + (((siguiente.inicioMs - inicioDominio) / spanDominio) * serie.plotWidth);
        if (
            !Number.isFinite(xSeparador)
            || xSeparador <= (serie.plotLeft + 0.75)
            || xSeparador >= (serie.plotRight - 0.75)
        ) {
            return "";
        }
        const paleta = obtenerPaletaModoStatsEspectador(siguiente.modo);
        return `
            <line
                class="stats-tiempo-separador"
                x1="${xSeparador.toFixed(2)}"
                y1="${serie.plotTop.toFixed(2)}"
                x2="${xSeparador.toFixed(2)}"
                y2="${serie.plotBottom.toFixed(2)}"
                stroke="${paleta.color}"
                stroke-opacity="${Math.min(1, Math.max(0.72, Number(paleta.edgeOpacity) || 0.85)).toFixed(2)}"
                stroke-width="2.5"
            ></line>
        `;
    }).join("");
    return `${bandasHtml}${separadoresHtml}`;
};
const obtenerLabelTeclaStats = (code) => {
    const codigo = String(code || "").trim();
    const raw = STATS_HEATMAP_LABELS.get(codigo) || codigo;
    const limpio = String(raw)
        .split(/\n+/)
        .map((parte) => parte.trim())
        .filter(Boolean)
        .join("/");
    if (limpio) return limpio;
    return codigo || "Tecla";
};
const mezclarColorStats = (origen, destino, factor) => {
    const t = Math.max(0, Math.min(1, Number(factor) || 0));
    return [
        Math.round((origen[0] * (1 - t)) + (destino[0] * t)),
        Math.round((origen[1] * (1 - t)) + (destino[1] * t)),
        Math.round((origen[2] * (1 - t)) + (destino[2] * t))
    ];
};
const rgbStats = (arr) => `${arr[0]}, ${arr[1]}, ${arr[2]}`;
const estiloHeatmapTeclaStats = (equipo, nivel) => {
    const base = equipo === 2 ? [255, 107, 107] : [70, 240, 255];
    const oscuroA = [12, 18, 29];
    const oscuroB = [6, 10, 18];
    const bordeBase = [84, 96, 122];
    const t = Math.max(0, Math.min(1, Number(nivel) || 0));
    const fillA = mezclarColorStats(oscuroA, base, 0.14 + (t * 0.7));
    const fillB = mezclarColorStats(oscuroB, base, 0.07 + (t * 0.44));
    const border = mezclarColorStats(bordeBase, base, 0.18 + (t * 0.8));
    const glow = mezclarColorStats([18, 26, 44], base, 0.5 + (t * 0.5));
    return {
        fillA: rgbStats(fillA),
        fillB: rgbStats(fillB),
        border: rgbStats(border),
        glow: rgbStats(glow),
        glowAlpha: (0.12 + (t * 0.7)).toFixed(3)
    };
};
const renderizarHeatmapStatsJugador = (jugador, equipo) => {
    const heatmap = jugador && jugador.heatmap && typeof jugador.heatmap === "object" ? jugador.heatmap : {};
    const valores = Object.values(heatmap).map((v) => Math.max(0, Number(v) || 0)).filter((v) => v > 0);
    const maximo = valores.length ? Math.max(...valores) : 0;
    const total = valores.reduce((acc, v) => acc + v, 0);
    const filasHtml = STATS_LAYOUT_HEATMAP.map((fila) => {
        const columnas = Math.max(28, Math.round(fila.reduce((acc, tecla) => acc + (tecla.ancho || 1), 0) * 2));
        const teclasHtml = fila.map((tecla) => {
            const span = Math.max(1, Math.round((tecla.ancho || 1) * 2));
            const count = Math.max(0, Number(heatmap[tecla.code]) || 0);
            const nivel = maximo > 0 ? (count / maximo) : 0;
            const estilo = estiloHeatmapTeclaStats(equipo, nivel);
            const labelRaw = String(tecla.label || tecla.code || "").trim();
            const etiqueta = labelRaw ? labelRaw : String(tecla.code || "").trim();
            const labelHtml = escapeHtml(etiqueta).replace(/\n/g, "<br>");
            return `
                <div class="stats-hm-key equipo-${equipo}" style="--stats-hm-span:${span};--hm-fill-a:${estilo.fillA};--hm-fill-b:${estilo.fillB};--hm-border:${estilo.border};--hm-glow:${estilo.glow};--hm-glow-alpha:${estilo.glowAlpha};" title="${escapeHtml(`${obtenerLabelTeclaStats(tecla.code)} (${count})`)}">
                    <span class="stats-hm-key-label">${labelHtml}</span>
                    <em class="stats-hm-key-count">${count > 0 ? count : ""}</em>
                </div>
            `;
        }).join("");
        return `<div class="stats-heatmap-row" style="--stats-hm-cols:${columnas};">${teclasHtml}</div>`;
    }).join("");

    return `
        <div class="stats-kpis-grid stats-kpis-grid--heatmap equipo-${equipo}">
            <div class="stats-kpi"><span>&#x2328;&#xFE0F; Pulsaciones</span><strong>${total}</strong></div>
            <div class="stats-kpi"><span>&#x1F3AF; Teclas activas</span><strong>${valores.length}</strong></div>
            <div class="stats-kpi"><span>&#x1F525; Maximo en una tecla</span><strong>${maximo || 0}</strong></div>
        </div>
        <div class="stats-heatmap-board equipo-${equipo}">
            ${filasHtml}
        </div>
    `;
};
const construirSerieSvgVidaStats = (historial = [], opciones = {}) => {
    const ancho = 1000;
    const alto = 330;
    const padLeft = 92;
    const padRight = 26;
    const padTop = 28;
    const padBottom = 58;
    const usableX = ancho - padLeft - padRight;
    const usableY = alto - padTop - padBottom;
    const maxVidaHint = Math.max(0, Number(opciones && opciones.maxVidaHint) || 0);
    const fallbackMaxVida = maxVidaHint > 0 ? maxVidaHint : 120;
    const serieCruda = Array.isArray(historial) ? historial.slice(-STATS_HISTORIAL_VIDA_MAX) : [];
    const serie = serieCruda
        .map((p) => ({
            t: Number(p && p.t),
            v: Math.max(0, Number(p && p.v))
        }))
        .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
        .sort((a, b) => a.t - b.t);
    if (serie.length < 2) {
        return {
            ancho,
            alto,
            padLeft,
            padRight,
            padTop,
            padBottom,
            plotLeft: padLeft,
            plotRight: ancho - padRight,
            plotTop: padTop,
            plotBottom: alto - padBottom,
            plotWidth: usableX,
            plotHeight: usableY,
            linePath: "",
            areaPath: "",
            ultimo: null,
            maxVida: redondearMaximoEjeVidaStats(fallbackMaxVida),
            minT: 0,
            maxT: 0,
            spanT: 0
        };
    }
    const serieOrdenada = [];
    serie.forEach((punto) => {
        const ultimo = serieOrdenada[serieOrdenada.length - 1];
        if (ultimo && punto.t <= ultimo.t) {
            serieOrdenada[serieOrdenada.length - 1] = { t: ultimo.t, v: punto.v };
            return;
        }
        serieOrdenada.push(punto);
    });
    if (serieOrdenada.length < 2) {
        return {
            ancho,
            alto,
            padLeft,
            padRight,
            padTop,
            padBottom,
            plotLeft: padLeft,
            plotRight: ancho - padRight,
            plotTop: padTop,
            plotBottom: alto - padBottom,
            plotWidth: usableX,
            plotHeight: usableY,
            linePath: "",
            areaPath: "",
            ultimo: null,
            maxVida: redondearMaximoEjeVidaStats(fallbackMaxVida),
            minT: 0,
            maxT: 0,
            spanT: 0
        };
    }
    const minT = serieOrdenada[0].t;
    const maxT = serieOrdenada[serieOrdenada.length - 1].t;
    const spanT = Math.max(1, maxT - minT);
    const usarIndiceEnX = spanT <= 5;
    const divisorIdx = Math.max(1, serieOrdenada.length - 1);
    const maxObservada = serieOrdenada.reduce((acc, punto) => Math.max(acc, Math.max(0, Number(punto.v) || 0)), 0);
    const maxVida = redondearMaximoEjeVidaStats(Math.max(30, Math.ceil(Math.max(maxObservada, maxVidaHint, fallbackMaxVida) * 1.05)));
    const puntos = serieOrdenada.map((punto, idx) => {
        const ratioX = usarIndiceEnX ? (idx / divisorIdx) : ((punto.t - minT) / spanT);
        const x = padLeft + (ratioX * usableX);
        const y = alto - padBottom - ((Math.max(0, punto.v) / maxVida) * usableY);
        return { x, y, v: punto.v };
    });
    const linePath = (() => {
        if (!puntos.length) return "";
        let path = `M${puntos[0].x.toFixed(2)} ${puntos[0].y.toFixed(2)}`;
        for (let i = 1; i < puntos.length; i += 1) {
            const curr = puntos[i];
            path += ` L${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
        }
        return path;
    })();
    return {
        ancho,
        alto,
        padLeft,
        padRight,
        padTop,
        padBottom,
        plotLeft: padLeft,
        plotRight: ancho - padRight,
        plotTop: padTop,
        plotBottom: alto - padBottom,
        plotWidth: usableX,
        plotHeight: usableY,
        linePath,
        areaPath: "",
        ultimo: puntos[puntos.length - 1],
        maxVida,
        minT,
        maxT,
        spanT
    };
};
const renderizarEvolucionTiempoStatsJugador = (jugador, equipo, timelineModos = [], modoActual = "") => {
    const historial = stats_historial_vida_espectador[equipo] || [];
    const vida = jugador && jugador.vida ? jugador.vida : { actual: null, min: null, max: null, media: null };
    const maxVidaHint = Number.isFinite(Number(vida.max))
        ? Math.max(0, Number(vida.max))
        : (Number.isFinite(Number(vida.actual)) ? Math.max(0, Number(vida.actual)) : 0);
    const serie = construirSerieSvgVidaStats(historial, { maxVidaHint });
    const valorVida = (valor) => (Number.isFinite(Number(valor)) ? `${Math.max(0, Number(valor))} s` : "--");
    const totalMs = Math.max(0, Number(jugador && jugador.tiempoTotalMs) || 0);
    const inicioTiempoMs = Math.max(0, Math.round(serie.minT || 0));
    const finTiempoMs = Math.max(inicioTiempoMs, Math.max(totalMs, Math.round(serie.maxT || 0)));
    const totalTicks = 4;
    const yTicks = Array.from({ length: totalTicks + 1 }, (_, idx) => {
        const ratio = idx / totalTicks;
        const valor = serie.maxVida - (serie.maxVida * ratio);
        const y = serie.plotTop + (serie.plotHeight * ratio);
        return { valor, y };
    });
    const xTicks = Array.from({ length: totalTicks + 1 }, (_, idx) => {
        const ratio = idx / totalTicks;
        const valorMs = inicioTiempoMs + ((finTiempoMs - inicioTiempoMs) * ratio);
        const x = serie.plotLeft + (serie.plotWidth * ratio);
        return { valorMs, x };
    });
    const gridHorizontal = yTicks.map((tick) => (
        `<line x1="${serie.plotLeft.toFixed(2)}" y1="${tick.y.toFixed(2)}" x2="${serie.plotRight.toFixed(2)}" y2="${tick.y.toFixed(2)}"></line>`
    )).join("");
    const gridVertical = xTicks.map((tick) => (
        `<line x1="${tick.x.toFixed(2)}" y1="${serie.plotTop.toFixed(2)}" x2="${tick.x.toFixed(2)}" y2="${serie.plotBottom.toFixed(2)}"></line>`
    )).join("");
    const labelsY = yTicks.map((tick) => (
        `<text class="stats-tiempo-axis-label stats-tiempo-axis-label--y" x="${(serie.plotLeft - 12).toFixed(2)}" y="${(tick.y + 4).toFixed(2)}" text-anchor="end">${escapeHtml(formatearValorEjeVidaStats(tick.valor))}</text>`
    )).join("");
    const labelsX = xTicks.map((tick) => (
        `<text class="stats-tiempo-axis-label stats-tiempo-axis-label--x" x="${tick.x.toFixed(2)}" y="${(serie.plotBottom + 24).toFixed(2)}" text-anchor="middle">${escapeHtml(formatearDuracionMsEspectador(tick.valorMs))}</text>`
    )).join("");
    const bandasModo = renderizarBandasModoStatsEspectador(timelineModos, serie, {
        inicioMs: inicioTiempoMs,
        finMs: finTiempoMs
    }, modoActual);
    const tituloEjeY = escapeHtml(tJuego2P("stats.axis.y_time_left", {}, "Vida"));
    const tituloEjeX = escapeHtml(`\u231B\uFE0F ${tJuego2P("stats.axis.x_elapsed", {}, "Tiempo transcurrido")}`);
    const ejeYTitleX = 20;
    const ejeYTitleY = (serie.plotTop + (serie.plotHeight / 2)).toFixed(2);
    const graficaHtml = serie.linePath
        ? `
            <svg viewBox="0 0 ${serie.ancho} ${serie.alto}" class="stats-tiempo-svg" role="img" aria-label="Evolucion de la vida">
                <rect class="stats-tiempo-plot-bg" x="${serie.plotLeft.toFixed(2)}" y="${serie.plotTop.toFixed(2)}" width="${serie.plotWidth.toFixed(2)}" height="${serie.plotHeight.toFixed(2)}"></rect>
                <g class="stats-tiempo-bandas">${bandasModo}</g>
                <g class="stats-tiempo-grid">${gridHorizontal}${gridVertical}</g>
                <g class="stats-tiempo-axis">
                    <line x1="${serie.plotLeft.toFixed(2)}" y1="${serie.plotTop.toFixed(2)}" x2="${serie.plotLeft.toFixed(2)}" y2="${serie.plotBottom.toFixed(2)}"></line>
                    <line x1="${serie.plotLeft.toFixed(2)}" y1="${serie.plotBottom.toFixed(2)}" x2="${serie.plotRight.toFixed(2)}" y2="${serie.plotBottom.toFixed(2)}"></line>
                </g>
                <path class="stats-tiempo-linea equipo-${equipo}" d="${serie.linePath}" fill="none" vector-effect="non-scaling-stroke"></path>
                ${serie.ultimo ? `<circle class="stats-tiempo-punto equipo-${equipo}" cx="${serie.ultimo.x.toFixed(2)}" cy="${serie.ultimo.y.toFixed(2)}" r="6"></circle>` : ""}
                <g class="stats-tiempo-axis-labels">${labelsY}${labelsX}</g>
                <text class="stats-tiempo-axis-title stats-tiempo-axis-title--y" x="${ejeYTitleX}" y="${ejeYTitleY}" text-anchor="middle" transform="rotate(-90 ${ejeYTitleX} ${ejeYTitleY})"><tspan class="stats-tiempo-axis-icon stats-tiempo-axis-icon--vida equipo-${equipo}">&#x2665;</tspan><tspan dx="8">${tituloEjeY}</tspan></text>
                <text class="stats-tiempo-axis-title stats-tiempo-axis-title--x" x="${(serie.plotLeft + (serie.plotWidth / 2)).toFixed(2)}" y="${(serie.alto - 12).toFixed(2)}" text-anchor="middle">${tituloEjeX}</text>
            </svg>
        `
        : `<div class="stats-tiempo-vacio">${escapeHtml(tJuego2P("stats.time.waiting", {}, "Esperando datos de tiempo en vivo..."))}</div>`;
    const tituloPanelVida = escapeHtml(tJuego2P("stats.axis.y_time_left", {}, "Vida")).toUpperCase();
    return `
        <div class="stats-tiempo-layout equipo-${equipo}">
            <section class="stats-vida-panel equipo-${equipo}" aria-label="${tituloPanelVida}">
                <h4 class="stats-vida-panel-title">
                    <span class="stats-tiempo-axis-icon stats-tiempo-axis-icon--vida equipo-${equipo}">&#x2665;</span>
                    <span>${tituloPanelVida}</span>
                </h4>
                <div class="stats-vida-grid">
                    <div class="stats-kpi"><span>&#x1F7E2; Actual</span><strong>${valorVida(vida.actual)}</strong></div>
                    <div class="stats-kpi"><span>&#x1F680; Max</span><strong>${valorVida(vida.max)}</strong></div>
                    <div class="stats-kpi"><span>&#x1F4C9; Min</span><strong>${valorVida(vida.min)}</strong></div>
                    <div class="stats-kpi"><span>&#x1F4CA; Media</span><strong>${valorVida(vida.media)}</strong></div>
                </div>
            </section>
            <div class="stats-tiempo-board equipo-${equipo}">
                ${graficaHtml}
            </div>
        </div>
    `;
};
const construirSlidesStats = (payload) => {
    const estado = normalizarStatsLiveEspectador(payload);
    const timelineModos = resolverTimelineModosStatsEspectador(estado);
    const p1 = estado.players[1];
    const p2 = estado.players[2];
    const contextoHeatmapP1 = `${renderizarNombreEquipoStats(p1.nombre, 1)} &middot; MAPA DE CALOR`;
    const contextoHeatmapP2 = `${renderizarNombreEquipoStats(p2.nombre, 2)} &middot; MAPA DE CALOR`;
    const contextoTiempoP1 = `${renderizarNombreEquipoStats(p1.nombre, 1)} &middot; EVOLUCION DEL TIEMPO`;
    const contextoTiempoP2 = `${renderizarNombreEquipoStats(p2.nombre, 2)} &middot; EVOLUCION DEL TIEMPO`;
    return [
        {
            tipo: "heatmap",
            titulo: contextoHeatmapP1,
            contextoCabecera: contextoHeatmapP1,
            ocultarTituloEnSlide: true,
            html: renderizarHeatmapStatsJugador(p1, 1)
        },
        {
            tipo: "heatmap",
            titulo: contextoHeatmapP2,
            contextoCabecera: contextoHeatmapP2,
            ocultarTituloEnSlide: true,
            html: renderizarHeatmapStatsJugador(p2, 2)
        },
        {
            tipo: "tiempo",
            titulo: contextoTiempoP1,
            contextoCabecera: contextoTiempoP1,
            ocultarTituloEnSlide: true,
            html: renderizarEvolucionTiempoStatsJugador(p1, 1, timelineModos, estado.modo_actual)
        },
        {
            tipo: "tiempo",
            titulo: contextoTiempoP2,
            contextoCabecera: contextoTiempoP2,
            ocultarTituloEnSlide: true,
            html: renderizarEvolucionTiempoStatsJugador(p2, 2, timelineModos, estado.modo_actual)
        }
    ];
};
const actualizarCabeceraSlideStats = () => {
    if (!stats_timestamp) return;
    const slide = Array.isArray(stats_slides_actuales) ? stats_slides_actuales[stats_slide_index] : null;
    const contexto = slide && typeof slide.contextoCabecera === "string" ? slide.contextoCabecera.trim() : "";
    const visible = contexto.length > 0;
    stats_timestamp.hidden = !visible;
    stats_timestamp.setAttribute("aria-hidden", visible ? "false" : "true");
    stats_timestamp.innerHTML = visible ? contexto : "";
};
const aplicarSlideStatsActual = () => {
    if (!stats_slides_track) return;
    stats_slide_index = resolverIndiceSlideStatsEspectador(stats_slide_step_remoto, stats_slide_count);
    stats_slides_track.style.transform = `translateX(-${stats_slide_index * 100}%)`;
    const slide = Array.isArray(stats_slides_actuales) ? stats_slides_actuales[stats_slide_index] : null;
    const esSlideTiempo = Boolean(slide && slide.tipo === "tiempo");
    const esSlideHeatmap = Boolean(slide && slide.tipo === "heatmap");
    stats_slider?.classList.toggle("stats-slider--tiempo", esSlideTiempo);
    stats_slider?.classList.toggle("stats-slider--heatmap", esSlideHeatmap);
    actualizarPaginadorStats();
    actualizarCabeceraSlideStats();
};
const actualizarPaginadorStats = () => {
    if (!stats_dots) return;
    stats_dots.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < stats_slide_count; i += 1) {
        const dot = document.createElement("span");
        dot.className = `stats-dot${i === stats_slide_index ? " activo" : ""}`;
        dot.setAttribute("aria-hidden", "true");
        fragment.appendChild(dot);
    }
    stats_dots.appendChild(fragment);
};
const renderizarStatsEspectador = () => {
    if (!stats_slides_track || !stats_estado) return;
    const estado = normalizarStatsLiveEspectador(estado_stats_live_espectador || {});
    const slides = construirSlidesStats(estado);
    stats_slides_actuales = slides;
    stats_slides_track.innerHTML = "";
    const fragment = document.createDocumentFragment();
    slides.forEach((slide) => {
        const item = document.createElement("article");
        item.className = "stats-slide";
        const tituloHtml = (slide.titulo && !slide.ocultarTituloEnSlide)
            ? `<h3>${slide.titulo}</h3>`
            : "";
        const subtituloHtml = slide.subtitulo ? `<p>${escapeHtml(slide.subtitulo || "")}</p>` : "";
        const headerHtml = (tituloHtml || subtituloHtml)
            ? `
            <header class="stats-slide-header">
                ${tituloHtml}
                ${subtituloHtml}
            </header>
        `
            : "";
        item.innerHTML = `
            ${headerHtml}
            <div class="stats-slide-body stats-slide-body--${slide.tipo || "default"}">${slide.html}</div>
        `;
        fragment.appendChild(item);
    });
    stats_slides_track.appendChild(fragment);
    stats_slide_count = slides.length;
    aplicarSlideStatsActual();
    const nombreModo = estado.modo_actual ? estado.modo_actual : "partida";
    stats_estado.textContent = `Modo: ${nombreModo} Â· Heatmap + tiempo live Â· ${stats_slide_count} slides`;
    stats_timestamp.textContent = `Actualizado: ${formatearHoraEspectador(estado.ts)}`;
    actualizarCabeceraSlideStats();
    renderizarEstadoStatsEspectador(resolverModoActivoStatsEspectador(estado));
};
const iniciarSlidesStats = () => {
    aplicarSlideStatsActual();
};
const detenerSlidesStats = () => {
    return;
};

const PUNTUACION_ICONOS_CATEGORIA = Object.freeze({
    produccion: "\u270D\uFE0F",
    ritmo: "\u26A1",
    riqueza_lexica: "\u{1F4DA}",
    bonus: "\u2728",
    precision: "\u{1F3AF}",
    pulsaciones: "\u2328\uFE0F"
});
const PUNTUACION_UNIDADES_I18N = Object.freeze({
    produccion: "score.unit.words",
    ritmo: "score.unit.ppm",
    riqueza_lexica: "score.unit.unique_words",
    bonus: "score.unit.bonus",
    precision: "score.unit.attempts",
    pulsaciones: "score.unit.keystrokes"
});

const obtenerApiPuntuacionEspectador = () => (
    window && window.ScribFinalScore && typeof window.ScribFinalScore.normalizarPayload === "function"
        ? window.ScribFinalScore
        : null
);

const idiomaFormatoPuntuacionEspectador = () => {
    const idioma = window && typeof window.scribGetLanguage2P === "function"
        ? window.scribGetLanguage2P()
        : "es";
    if (idioma === "en") return "en-GB";
    if (idioma === "fr") return "fr-FR";
    return "es-ES";
};

const formatearNumeroPuntuacionEspectador = (valor) => {
    const numero = Number(valor);
    const seguro = Number.isFinite(numero) ? numero : 0;
    try {
        return new Intl.NumberFormat(idiomaFormatoPuntuacionEspectador(), {
            minimumFractionDigits: 0,
            maximumFractionDigits: Number.isInteger(seguro) ? 0 : 2
        }).format(seguro);
    } catch (_error) {
        return String(Math.round(seguro * 100) / 100);
    }
};

const traducirCategoriaPuntuacionEspectador = (categoria = {}) => {
    const id = String(categoria.id || "").trim().toLowerCase();
    const fallback = String(categoria.etiqueta || id.replace(/_/g, " ")).toUpperCase();
    return tJuego2P(`score.category.${id}.label`, {}, fallback);
};

const explicarCategoriaPuntuacionEspectador = (categoria = {}) => {
    const id = String(categoria.id || "").trim().toLowerCase();
    return tJuego2P(
        `score.category.${id}.explanation`,
        {},
        String(categoria.explicacion || "")
    );
};

const traducirUnidadPuntuacionEspectador = (categoria = {}) => {
    const id = String(categoria.id || "").trim().toLowerCase();
    const clave = PUNTUACION_UNIDADES_I18N[id];
    return clave ? tJuego2P(clave, {}, String(categoria.unidad || "")) : String(categoria.unidad || "");
};

const crearParticulasPuntuacionEspectador = () => {
    if (!puntuacion_particulas || puntuacion_particulas.childElementCount) return;
    const fragment = document.createDocumentFragment();
    for (let indice = 0; indice < 28; indice += 1) {
        const particula = document.createElement("span");
        particula.className = `puntuacion-particula puntuacion-particula--${indice % 3 === 0 ? "oro" : (indice % 2 === 0 ? "azul" : "roja")}`;
        particula.style.setProperty("--particula-x", `${4 + ((indice * 37) % 92)}%`);
        particula.style.setProperty("--particula-delay", `${(indice % 9) * 45}ms`);
        particula.style.setProperty("--particula-drift", `${-48 + ((indice * 29) % 96)}px`);
        particula.style.setProperty("--particula-rot", `${90 + ((indice * 47) % 300)}deg`);
        fragment.appendChild(particula);
    }
    puntuacion_particulas.appendChild(fragment);
};

const activarParticulasPuntuacionEspectador = (final = false, animar = true) => {
    if (!puntuacion_particulas) return;
    crearParticulasPuntuacionEspectador();
    puntuacion_particulas.classList.remove("is-active", "is-final");
    if (!animar) return;
    requestAnimationFrame(() => {
        if (vista_espectador_modo_resuelta !== "puntuacion") return;
        puntuacion_particulas.classList.toggle("is-final", Boolean(final));
        puntuacion_particulas.classList.add("is-active");
    });
};

const proporcionTotalPuntuacionEspectador = (totales = {}) => {
    const suma = (Number(totales[1]) || 0) + (Number(totales[2]) || 0);
    return suma > 0 ? Math.max(8, Math.min(92, ((Number(totales[1]) || 0) / suma) * 100)) : 50;
};

const construirMarcadorTotalPuntuacionEspectador = (estado, categoriasReveladas, totalesForzados = null, totalesObjetivo = null) => {
    const api = obtenerApiPuntuacionEspectador();
    const totales = totalesForzados || (api && typeof api.totalesParciales === "function"
        ? api.totalesParciales(estado, categoriasReveladas)
        : { 1: 0, 2: 0 });
    const objetivo = totalesObjetivo || totales;
    const proporcionAzul = proporcionTotalPuntuacionEspectador(totales);
    return `
        <section class="puntuacion-total" aria-label="Puntuaci&oacute;n acumulada">
            <div class="puntuacion-total__barra" data-total-1="${Number(totales[1]) || 0}" data-total-2="${Number(totales[2]) || 0}" data-target-1="${Number(objetivo[1]) || 0}" data-target-2="${Number(objetivo[2]) || 0}" style="--puntuacion-balance:${proporcionAzul.toFixed(2)}%" aria-label="${escapeHtml(estado.jugadores[1].nombre)}: ${escapeHtml(formatearNumeroPuntuacionEspectador(totales[1]))} puntos; ${escapeHtml(estado.jugadores[2].nombre)}: ${escapeHtml(formatearNumeroPuntuacionEspectador(totales[2]))} puntos">
                <span class="puntuacion-total__azul"><b data-total-player="1">${escapeHtml(formatearNumeroPuntuacionEspectador(totales[1]))}</b></span>
                <i aria-hidden="true"></i>
                <span class="puntuacion-total__rojo"><b data-total-player="2">${escapeHtml(formatearNumeroPuntuacionEspectador(totales[2]))}</b></span>
            </div>
        </section>
    `;
};

const construirIntroPuntuacionEspectador = (vista) => {
    const estado = vista.estado;
    const chips = estado.categorias.map((categoria) => `
        <li>
            <span aria-hidden="true">${PUNTUACION_ICONOS_CATEGORIA[categoria.id] || "\u25C6"}</span>
            <strong>${escapeHtml(traducirCategoriaPuntuacionEspectador(categoria))}</strong>
            <small>${escapeHtml(tJuego2P("score.category.weight", { weight: formatearNumeroPuntuacionEspectador(categoria.peso) }, `${categoria.peso} PTS`))}</small>
        </li>
    `).join("");
    return `
        <article class="puntuacion-panel puntuacion-panel--intro">
            <div class="puntuacion-trofeo" aria-hidden="true"><span>\u{1F3C6}</span></div>
            <h3>${escapeHtml(tJuego2P("score.intro.title", {}, "QUIEN JUGO MEJOR?"))}</h3>
            <div class="puntuacion-intro-duelo">
                <strong class="equipo-azul">${escapeHtml(estado.jugadores[1].nombre)}</strong>
                <span>VS</span>
                <strong class="equipo-rojo">${escapeHtml(estado.jugadores[2].nombre)}</strong>
            </div>
            <ul class="puntuacion-categorias-intro">${chips}</ul>
            ${construirMarcadorTotalPuntuacionEspectador(estado, 0)}
        </article>
    `;
};

const construirTarjetaCategoriaEquipoPuntuacion = (estado, categoria, player, fase = 0) => {
    const jugador = estado.jugadores[player];
    const valor = Number(categoria.valores[player]) || 0;
    const puntos = Number(categoria.puntos[player]) || 0;
    const peso = Math.max(0, Number(categoria.peso) || 0);
    const porcentaje = peso > 0 ? Math.max(0, Math.min(100, (puntos / peso) * 100)) : 50;
    const clase = player === 1 ? "azul" : "rojo";
    const revelado = fase >= player;
    const resultadoRevelado = fase >= 2;
    const gana = resultadoRevelado && Number(categoria.ganador) === player;
    const empata = categoria.empate === true;
    const recienRevelado = fase === player;
    if (!revelado) {
        return `
            <article class="puntuacion-categoria-equipo puntuacion-categoria-equipo--${clase} is-concealed">
                <h4>${escapeHtml(jugador.nombre)}</h4>
                <div class="puntuacion-categoria-misterio" aria-label="Puntuaci&oacute;n por desvelar"><strong>?</strong></div>
            </article>
        `;
    }
    return `
        <article class="puntuacion-categoria-equipo puntuacion-categoria-equipo--${clase}${gana ? " is-winner" : ""}${resultadoRevelado && empata ? " is-tie" : ""}${revelado ? " is-revealed" : " is-concealed"}${recienRevelado ? " is-newly-revealed" : ""}">
            <h4>${escapeHtml(jugador.nombre)}</h4>
            <div class="puntuacion-categoria-equipo__metrica">
                <strong data-score-final="${valor}">${escapeHtml(formatearNumeroPuntuacionEspectador(valor))}</strong>
                <span>${escapeHtml(traducirUnidadPuntuacionEspectador(categoria))}</span>
            </div>
            <div class="puntuacion-categoria-barra" data-points-source="${player}">
                <span style="--puntuacion-fill:${porcentaje.toFixed(2)}%"></span>
                <b class="puntuacion-categoria-barra__puntos"><span data-points-final="${puntos}">+${escapeHtml(formatearNumeroPuntuacionEspectador(puntos))}</span><small>PTS</small></b>
            </div>
        </article>
    `;
};

const construirCategoriaPuntuacionEspectador = (vista, fase = 0, totalesIniciales = null) => {
    const estado = vista.estado;
    const categoria = vista.categoria;
    const api = obtenerApiPuntuacionEspectador();
    const totalesRevelados = api && typeof api.totalesDuranteRevelado === "function"
        ? api.totalesDuranteRevelado(estado, vista.indiceCategoria, fase)
        : (api && typeof api.totalesParciales === "function"
            ? api.totalesParciales(estado, vista.indiceCategoria + (fase >= 2 ? 1 : 0))
            : { 1: 0, 2: 0 });
    const ganadorCategoria = fase >= 2 && !categoria.empate ? Number(categoria.ganador) : 0;
    const veredicto = fase >= 2
        ? (categoria.empate
            ? tJuego2P("score.category.tie_short", {}, "EMPATE")
            : `${estado.jugadores[ganadorCategoria].nombre} · GANADOR`)
        : "";
    return `
        <article class="puntuacion-panel puntuacion-panel--categoria" data-categoria="${escapeHtml(categoria.id)}">
            <header class="puntuacion-categoria-header">
                <span class="puntuacion-categoria-icono" aria-hidden="true">${PUNTUACION_ICONOS_CATEGORIA[categoria.id] || "\u25C6"}</span>
                <div>
                    <h3>${escapeHtml(traducirCategoriaPuntuacionEspectador(categoria))}</h3>
                    <p>${escapeHtml(explicarCategoriaPuntuacionEspectador(categoria))}</p>
                </div>
                <strong class="puntuacion-peso">${escapeHtml(tJuego2P("score.category.weight", { weight: formatearNumeroPuntuacionEspectador(categoria.peso) }, `${categoria.peso} PTS`))}</strong>
            </header>
            <div class="puntuacion-categoria-duelo">
                ${construirTarjetaCategoriaEquipoPuntuacion(estado, categoria, 1, fase)}
                <span class="puntuacion-vs puntuacion-vs--categoria" aria-hidden="true">VS</span>
                ${construirTarjetaCategoriaEquipoPuntuacion(estado, categoria, 2, fase)}
            </div>
            ${veredicto ? `<p class="puntuacion-categoria-veredicto ganador-${ganadorCategoria}">${escapeHtml(veredicto)}</p>` : ""}
            ${construirMarcadorTotalPuntuacionEspectador(estado, vista.indiceCategoria, totalesIniciales || totalesRevelados, totalesRevelados)}
        </article>
    `;
};

const cancelarTransferenciaPuntuacionEspectador = () => {
    if (puntuacion_timeout_transferencia_espectador) {
        clearTimeout(puntuacion_timeout_transferencia_espectador);
        puntuacion_timeout_transferencia_espectador = null;
    }
    puntuacion_raf_totales_espectador.forEach((id) => cancelAnimationFrame(id));
    puntuacion_raf_totales_espectador = [];
    if (puntuacion_espectador) {
        puntuacion_espectador.querySelectorAll(".puntuacion-puntos-vuelo").forEach((elemento) => elemento.remove());
    }
};

const animarCifraPuntuacionEspectador = (elemento, final, opciones = {}) => {
    if (!elemento) return;
    const numeroFinal = Number(final) || 0;
    const prefijo = opciones.prefijo || "";
    const duracion = Math.max(300, Number(opciones.duracion) || 1150);
    const inicio = performance.now();
    const decimales = Number.isInteger(numeroFinal) ? 0 : 2;
    const tick = (ahora) => {
        if (!elemento.isConnected) return;
        const progreso = Math.min(1, (ahora - inicio) / duracion);
        if (progreso < 1) {
            const amplitud = Math.max(4, Math.abs(numeroFinal) * 1.55);
            const aleatorio = Math.random() * amplitud;
            elemento.textContent = `${prefijo}${formatearNumeroPuntuacionEspectador(decimales ? Math.round(aleatorio * 100) / 100 : Math.round(aleatorio))}`;
            const raf = requestAnimationFrame(tick);
            puntuacion_raf_totales_espectador.push(raf);
            return;
        }
        elemento.textContent = `${prefijo}${formatearNumeroPuntuacionEspectador(numeroFinal)}`;
        elemento.classList.remove("is-scrambling");
    };
    elemento.classList.add("is-scrambling");
    const raf = requestAnimationFrame(tick);
    puntuacion_raf_totales_espectador.push(raf);
};

const iniciarRuletaCategoriaPuntuacionEspectador = () => {
    if (!puntuacion_stage || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const tarjeta = puntuacion_stage.querySelector(".puntuacion-categoria-equipo.is-newly-revealed");
    if (!tarjeta) return;
    const metrica = tarjeta.querySelector("[data-score-final]");
    const puntos = tarjeta.querySelector("[data-points-final]");
    animarCifraPuntuacionEspectador(metrica, metrica?.dataset.scoreFinal, { duracion: 1220 });
    animarCifraPuntuacionEspectador(puntos, puntos?.dataset.pointsFinal, { prefijo: "+", duracion: 1380 });
};

const actualizarMarcadorTotalPuntuacionEspectador = (totalesObjetivo, animar = true) => {
    const barra = puntuacion_stage?.querySelector(".puntuacion-total__barra");
    if (!barra) return;
    const inicio = {
        1: Number(barra.dataset.total1) || 0,
        2: Number(barra.dataset.total2) || 0
    };
    const objetivo = {
        1: Number(totalesObjetivo?.[1]) || 0,
        2: Number(totalesObjetivo?.[2]) || 0
    };
    const balance = proporcionTotalPuntuacionEspectador(objetivo);
    barra.style.setProperty("--puntuacion-balance", `${balance.toFixed(2)}%`);
    barra.dataset.total1 = String(objetivo[1]);
    barra.dataset.total2 = String(objetivo[2]);
    const duracion = animar && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 900 : 1;
    [1, 2].forEach((player) => {
        const elemento = barra.querySelector(`[data-total-player="${player}"]`);
        if (!elemento) return;
        const comienzo = performance.now();
        const tick = (ahora) => {
            if (!elemento.isConnected) return;
            const t = Math.min(1, (ahora - comienzo) / duracion);
            const suavizado = 1 - Math.pow(1 - t, 3);
            const valor = inicio[player] + ((objetivo[player] - inicio[player]) * suavizado);
            elemento.textContent = formatearNumeroPuntuacionEspectador(Math.round(valor * 100) / 100);
            if (t < 1) {
                const raf = requestAnimationFrame(tick);
                puntuacion_raf_totales_espectador.push(raf);
            }
        };
        const raf = requestAnimationFrame(tick);
        puntuacion_raf_totales_espectador.push(raf);
    });
};

const transferirPuntosAlMarcadorEspectador = (player, puntos, totalesObjetivo) => {
    const origen = puntuacion_stage?.querySelector(`[data-points-source="${player}"] .puntuacion-categoria-barra__puntos`);
    const destino = puntuacion_stage?.querySelector(`.puntuacion-total__${player === 1 ? "azul" : "rojo"}`);
    if (!origen || !destino || !puntuacion_espectador) {
        actualizarMarcadorTotalPuntuacionEspectador(totalesObjetivo, false);
        return;
    }
    const lanzar = () => {
        if (!origen.isConnected || !destino.isConnected) return;
        const rectOrigen = origen.getBoundingClientRect();
        const rectDestino = destino.getBoundingClientRect();
        const vuelo = document.createElement("span");
        vuelo.className = `puntuacion-puntos-vuelo equipo-${player}`;
        vuelo.textContent = `+${formatearNumeroPuntuacionEspectador(puntos)}`;
        vuelo.style.setProperty("--vuelo-x", `${rectDestino.left + (rectDestino.width / 2) - (rectOrigen.left + (rectOrigen.width / 2))}px`);
        vuelo.style.setProperty("--vuelo-y", `${rectDestino.top + (rectDestino.height / 2) - (rectOrigen.top + (rectOrigen.height / 2))}px`);
        vuelo.style.left = `${rectOrigen.left + (rectOrigen.width / 2)}px`;
        vuelo.style.top = `${rectOrigen.top + (rectOrigen.height / 2)}px`;
        puntuacion_espectador.appendChild(vuelo);
        requestAnimationFrame(() => vuelo.classList.add("is-flying"));
        vuelo.addEventListener("animationend", () => {
            vuelo.remove();
            actualizarMarcadorTotalPuntuacionEspectador(totalesObjetivo, true);
        }, { once: true });
    };
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        actualizarMarcadorTotalPuntuacionEspectador(totalesObjetivo, false);
        return;
    }
    puntuacion_timeout_transferencia_espectador = setTimeout(lanzar, 1420);
};

const construirDesgloseFinalPuntuacionEspectador = (estado) => estado.categorias.map((categoria) => {
    const ganador = Number(categoria.ganador);
    const resultado = categoria.empate
        ? tJuego2P("score.category.tie_short", {}, "EMPATE")
        : (estado.jugadores[ganador] ? estado.jugadores[ganador].nombre : "-");
    return `
        <li class="puntuacion-desglose-fila${ganador === 1 ? " gana-azul" : (ganador === 2 ? " gana-rojo" : " is-tie")}">
            <span class="puntuacion-desglose-icono" aria-hidden="true">${PUNTUACION_ICONOS_CATEGORIA[categoria.id] || "\u25C6"}</span>
            <strong>${escapeHtml(traducirCategoriaPuntuacionEspectador(categoria))}</strong>
            <span class="puntuacion-desglose-puntos puntuacion-desglose-puntos--azul">${escapeHtml(formatearNumeroPuntuacionEspectador(categoria.puntos[1]))}</span>
            <span class="puntuacion-desglose-ganador">${escapeHtml(resultado)}</span>
            <span class="puntuacion-desglose-puntos puntuacion-desglose-puntos--rojo">${escapeHtml(formatearNumeroPuntuacionEspectador(categoria.puntos[2]))}</span>
        </li>
    `;
}).join("");

const construirFinalPuntuacionEspectador = (vista) => {
    const estado = vista.estado;
    const ganador = Number(estado.ganador);
    const empate = estado.empate === true || (ganador !== 1 && ganador !== 2);
    const tituloResultado = empate
        ? tJuego2P("score.final.tie", {}, "EMPATE TECNICO")
        : estado.jugadores[ganador].nombre;
    const subtitulo = empate
        ? tJuego2P("score.final.tie_copy", {}, "Los dos equipos terminan con la misma puntuacion.")
        : tJuego2P("score.final.winner", {}, "GANADOR DE LA PARTIDA");
    return `
        <article class="puntuacion-panel puntuacion-panel--final${empate ? " is-tie" : ` ganador-${ganador}`}">
            <span class="puntuacion-kicker">${escapeHtml(tJuego2P("score.final.kicker", {}, "RESULTADO FINAL"))}</span>
            <div class="puntuacion-corona" aria-hidden="true">${empate ? "\u2696\uFE0F" : "\u{1F451}"}</div>
            <p class="puntuacion-final-subtitulo">${escapeHtml(subtitulo)}</p>
            <h3>${escapeHtml(tituloResultado)}</h3>
            ${empate ? "" : `<p class="puntuacion-final-margen">${escapeHtml(tJuego2P("score.final.margin", { difference: formatearNumeroPuntuacionEspectador(estado.diferencia) }, `VENTAJA: ${estado.diferencia} PTS`))}</p>`}
            ${construirMarcadorTotalPuntuacionEspectador(estado, estado.categorias.length)}
            <section class="puntuacion-desglose">
                <h4>${escapeHtml(tJuego2P("score.final.breakdown", {}, "DUELO POR APARTADOS"))}</h4>
                <ul>${construirDesgloseFinalPuntuacionEspectador(estado)}</ul>
            </section>
        </article>
    `;
};

const construirEsperaPuntuacionEspectador = (vista) => {
    const insuficiente = vista.tipo === "insuficiente";
    return `
        <article class="puntuacion-panel puntuacion-panel--espera${insuficiente ? " is-warning" : ""}">
            <span class="puntuacion-espera-icono" aria-hidden="true">${insuficiente ? "\u26A0\uFE0F" : "\u{1F3C6}"}</span>
            <h3>${escapeHtml(tJuego2P(insuficiente ? "score.insufficient.title" : "score.waiting.title", {}, insuficiente ? "DATOS INCOMPLETOS" : "RESULTADO PENDIENTE"))}</h3>
            <p>${escapeHtml(tJuego2P(insuficiente ? "score.insufficient" : "score.waiting", {}, insuficiente ? "Faltan datos de una escritora." : "El resultado estara disponible al terminar la partida."))}</p>
        </article>
    `;
};

const renderizarDotsPuntuacionEspectador = (paso) => {
    const api = obtenerApiPuntuacionEspectador();
    if (!puntuacion_dots || !api) return;
    puntuacion_dots.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (let indice = 0; indice <= api.MAX_STEP; indice += 1) {
        const dot = document.createElement("span");
        dot.className = `puntuacion-dot${indice === paso ? " is-active" : ""}${indice < paso ? " is-revealed" : ""}`;
        fragment.appendChild(dot);
    }
    puntuacion_dots.appendChild(fragment);
};

const etiquetaPasoPuntuacionEspectador = (vista) => {
    if (vista.tipo === "final") return tJuego2P("score.step.final", {}, "GANADOR");
    if (vista.tipo === "categoria" && vista.categoria) {
        return traducirCategoriaPuntuacionEspectador(vista.categoria);
    }
    return tJuego2P("score.step.intro", {}, "INTRO");
};

const renderizarPuntuacionFinalEspectador = (opciones = {}) => {
    if (!puntuacion_stage) return;
    const api = obtenerApiPuntuacionEspectador();
    if (!api) {
        puntuacion_stage.innerHTML = `<p>${escapeHtml(tJuego2P("score.waiting", {}, "Resultado pendiente."))}</p>`;
        return;
    }
    const estado = estado_puntuacion_final_espectador || api.normalizarPayload({});
    const vista = api.obtenerVista(estado, puntuacion_slide_step_remoto);
    const fase = vista.tipo === "categoria" && typeof api.normalizarFaseRevelado === "function"
        ? api.normalizarFaseRevelado(puntuacion_reveal_phase_remoto)
        : 0;
    // La marca temporal puede variar durante una resincronizacion aunque el
    // resultado visible sea identico. La firma de contenido evita volver a
    // montar la slide y relanzar sus particulas en ese caso.
    const firma = typeof api.crearFirmaVista === "function"
        ? api.crearFirmaVista(estado, vista.paso, fase)
        : `${vista.paso}:${vista.tipo}:${fase}`;
    if (firma === puntuacion_firma_render_espectador && opciones.forzar !== true) return;
    const animar = opciones.animar === true && firma !== puntuacion_firma_render_espectador;
    const pasoAnterior = Number(puntuacion_stage.dataset.step);
    const faseAnterior = Number(puntuacion_stage.dataset.phase);
    const cambioDeSlide = !Number.isFinite(pasoAnterior) || pasoAnterior !== vista.paso;
    const revelarEquipo = vista.tipo === "categoria"
        && pasoAnterior === vista.paso
        && Number.isFinite(faseAnterior)
        && fase === faseAnterior + 1
        && (fase === 1 || fase === 2)
        ? fase
        : 0;
    const totalesAntesDeRevelar = revelarEquipo && typeof api.totalesDuranteRevelado === "function"
        ? api.totalesDuranteRevelado(estado, vista.indiceCategoria, faseAnterior)
        : null;
    const totalesDespuesDeRevelar = vista.tipo === "categoria" && typeof api.totalesDuranteRevelado === "function"
        ? api.totalesDuranteRevelado(estado, vista.indiceCategoria, fase)
        : null;
    let html = "";
    if (vista.tipo === "intro") html = construirIntroPuntuacionEspectador(vista);
    else if (vista.tipo === "categoria") html = construirCategoriaPuntuacionEspectador(vista, fase, totalesAntesDeRevelar);
    else if (vista.tipo === "final") html = construirFinalPuntuacionEspectador(vista);
    else html = construirEsperaPuntuacionEspectador(vista);

    if (puntuacion_timeout_revelado_espectador) {
        clearTimeout(puntuacion_timeout_revelado_espectador);
        puntuacion_timeout_revelado_espectador = null;
    }
    cancelarTransferenciaPuntuacionEspectador();
    puntuacion_stage.classList.remove("is-revealing", "is-final");
    puntuacion_stage.innerHTML = html;
    puntuacion_stage.dataset.step = String(vista.paso);
    puntuacion_stage.dataset.phase = String(fase);
    const ganadorCategoria = vista.tipo === "categoria" && fase >= 2 && !vista.categoria.empate
        ? Number(vista.categoria.ganador)
        : 0;
    puntuacion_espectador.classList.toggle("is-category-winner-1", ganadorCategoria === 1);
    puntuacion_espectador.classList.toggle("is-category-winner-2", ganadorCategoria === 2);
    if (puntuacion_paso) {
        const etiquetaFase = vista.tipo === "categoria"
            ? (["EN MISTERIO", "EQUIPO AZUL", "EQUIPO ROJO Y GANADOR"][fase] || "")
            : "";
        puntuacion_paso.textContent = [etiquetaPasoPuntuacionEspectador(vista), etiquetaFase].filter(Boolean).join(" \u00b7 ");
    }
    if (puntuacion_formula) {
        puntuacion_formula.textContent = tJuego2P(
            "score.formula",
            { version: estado.formulaVersion || "scrib-puntuacion-v1" },
            `SCRIB \u00b7 ${estado.formulaVersion || "scrib-puntuacion-v1"}`
        );
    }
    renderizarDotsPuntuacionEspectador(vista.paso);
    const resultadoCategoriaRevelado = vista.tipo === "categoria" && fase >= 2;
    activarParticulasPuntuacionEspectador(vista.tipo === "final", animar && (resultadoCategoriaRevelado || vista.tipo === "final"));
    sincronizarAudioDeliberacionEspectador("puntuacion");
    if (animar && cambioDeSlide) {
        requestAnimationFrame(() => {
            if (vista_espectador_modo_resuelta !== "puntuacion") return;
            puntuacion_stage.classList.toggle("is-final", vista.tipo === "final");
            puntuacion_stage.classList.add("is-revealing");
            puntuacion_timeout_revelado_espectador = setTimeout(() => {
                puntuacion_stage.classList.remove("is-revealing");
                puntuacion_timeout_revelado_espectador = null;
            }, 1250);
        });
    }
    if (revelarEquipo) {
        iniciarRuletaCategoriaPuntuacionEspectador();
        transferirPuntosAlMarcadorEspectador(
            revelarEquipo,
            Number(vista.categoria.puntos?.[revelarEquipo]) || 0,
            totalesDespuesDeRevelar
        );
    }
    puntuacion_firma_render_espectador = firma;
};

const actualizarPuntuacionFinalEspectador = (payload = {}) => {
    const api = obtenerApiPuntuacionEspectador();
    if (!api) return;
    estado_puntuacion_final_espectador = api.normalizarPayload(payload);
    if (vista_espectador_modo_resuelta === "puntuacion") {
        renderizarPuntuacionFinalEspectador({ animar: true });
    }
};

window.actualizarPuntuacionFinalEspectador = actualizarPuntuacionFinalEspectador;

const normalizarResultadoJuradoEspectador = (payload = {}) => {
    const jugadores = payload && payload.jugadores && typeof payload.jugadores === "object"
        ? payload.jugadores
        : {};
    const normalizarJugador = (id) => {
        const jugador = jugadores[id] || jugadores[String(id)] || {};
        return {
            nombre: String(jugador.nombre || `ESCRITXR ${id}`).trim() || `ESCRITXR ${id}`,
            total: Math.max(0, Math.min(10, Number(jugador.total) || 0))
        };
    };
    const criteriosEntrada = Array.isArray(payload && payload.criterios) ? payload.criterios : [];
    const criterios = criteriosEntrada.map((criterio, indice) => {
        const valores = criterio && criterio.valores && typeof criterio.valores === "object" ? criterio.valores : {};
        const valor1 = Math.max(0, Math.min(10, Number(valores[1] ?? valores["1"]) || 0));
        const valor2 = Math.max(0, Math.min(10, Number(valores[2] ?? valores["2"]) || 0));
        const empate = Math.abs(valor1 - valor2) < 0.05;
        return {
            id: String(criterio && criterio.id || `criterio-${indice + 1}`),
            label: String(criterio && criterio.label || `APARTADO ${indice + 1}`),
            scope: String(criterio && criterio.scope || "writing"),
            valores: { 1: valor1, 2: valor2 },
            empate,
            ganador: empate ? 0 : (valor1 > valor2 ? 1 : 2)
        };
    });
    return {
        disponible: Boolean(payload && payload.disponible),
        empate: Boolean(payload && payload.empate),
        ganador: Number(payload && payload.ganador) || 0,
        actualizado_en_ts: Number(payload && payload.actualizado_en_ts) || 0,
        jugadores: { 1: normalizarJugador(1), 2: normalizarJugador(2) },
        criterios
    };
};

const tarjetaResultadoJuradoEspectador = (estado, id, valores, ganador, escala = 10) => {
    const jugador = estado.jugadores[id];
    const gana = Number(ganador) === id;
    const valor = Number(valores[id]) || 0;
    return `<article class="resultado-jurado-card resultado-jurado-card--${id}${gana ? " is-winner" : ""}">
        <small>${gana ? "GANADOR" : "FINALISTA"}</small>
        <h3>${escapeHtml(jugador.nombre)}</h3>
        <strong>${valor.toFixed(1)}</strong><span>/ ${escala}</span>
    </article>`;
};

const renderizarResultadoJuradoEspectador = (opciones = {}) => {
    if (!resultado_jurado_stage) return;
    const estado = normalizarResultadoJuradoEspectador(estado_resultado_jurado_espectador || {});
    if (!estado.disponible) {
        resultado_jurado_stage.innerHTML = `<p class="resultado-jurado-espera">EL VEREDICTO A&Uacute;N NO EST&Aacute; LISTO</p>`;
        return;
    }
    const maximo = estado.criterios.length + 1;
    const paso = Math.max(0, Math.min(maximo, Math.trunc(Number(jurado_slide_step_remoto) || 0)));
    const firma = `${estado.actualizado_en_ts}:${paso}`;
    if (firma === jurado_firma_render_espectador && opciones.forzar !== true) return;
    const animar = opciones.animar === true && firma !== jurado_firma_render_espectador;
    let html = "";
    if (paso === 0) {
        html = `<article class="resultado-jurado-intro">
            <span class="resultado-jurado-balanza" aria-hidden="true">&#x2696;&#xFE0F;</span>
            <small>DECISI&Oacute;N FINAL</small>
            <h2>LA DECISI&Oacute;N<br>DEL JURADO</h2>
        </article>`;
    } else if (paso <= estado.criterios.length) {
        const criterio = estado.criterios[paso - 1];
        html = `<article class="resultado-jurado-panel resultado-jurado-panel--criterio">
            <span class="resultado-jurado-kicker">APARTADO ${paso} DE ${estado.criterios.length}</span>
            <h2>${escapeHtml(criterio.label.toUpperCase())}</h2>
            <div class="resultado-jurado-cards">
                ${tarjetaResultadoJuradoEspectador(estado, 1, criterio.valores, criterio.empate ? 0 : criterio.ganador)}
                ${tarjetaResultadoJuradoEspectador(estado, 2, criterio.valores, criterio.empate ? 0 : criterio.ganador)}
            </div>
            <p class="resultado-jurado-veredicto">${criterio.empate ? "EMPATE EN ESTE APARTADO" : `${escapeHtml(estado.jugadores[criterio.ganador].nombre)} SE LLEVA EL APARTADO`}</p>
        </article>`;
    } else {
        const valores = { 1: estado.jugadores[1].total, 2: estado.jugadores[2].total };
        html = `<article class="resultado-jurado-panel resultado-jurado-panel--final">
            <span class="resultado-jurado-kicker">VEREDICTO DEL JURADO</span>
            <h2>${estado.empate ? "EMPATE" : escapeHtml(estado.jugadores[estado.ganador].nombre)}</h2>
            <div class="resultado-jurado-cards">
                ${tarjetaResultadoJuradoEspectador(estado, 1, valores, estado.empate ? 0 : estado.ganador)}
                ${tarjetaResultadoJuradoEspectador(estado, 2, valores, estado.empate ? 0 : estado.ganador)}
            </div>
            <p class="resultado-jurado-veredicto">${estado.empate ? "EL JURADO DECLARA UN EMPATE" : "ELECCI&Oacute;N DEL JURADO"}</p>
        </article>`;
    }
    if (jurado_timeout_revelado_espectador) {
        clearTimeout(jurado_timeout_revelado_espectador);
        jurado_timeout_revelado_espectador = null;
    }
    resultado_jurado_stage.classList.remove("is-revealing");
    resultado_jurado_stage.innerHTML = html;
    resultado_jurado_stage.dataset.step = String(paso);
    if (animar) requestAnimationFrame(() => {
        resultado_jurado_stage.classList.add("is-revealing");
        jurado_timeout_revelado_espectador = setTimeout(() => {
            resultado_jurado_stage.classList.remove("is-revealing");
            jurado_timeout_revelado_espectador = null;
        }, 1250);
    });
    jurado_firma_render_espectador = firma;
};

const actualizarResultadoJuradoEspectador = (payload = {}) => {
    estado_resultado_jurado_espectador = normalizarResultadoJuradoEspectador(payload);
    if (vista_espectador_modo_resuelta === "resultado_jurado") renderizarResultadoJuradoEspectador({ animar: true });
};

window.actualizarResultadoJuradoEspectador = actualizarResultadoJuradoEspectador;

const normalizarResultadoFinalEspectador = (payload = {}) => {
    const jugadores = payload && payload.jugadores && typeof payload.jugadores === "object" ? payload.jugadores : {};
    const normalizarJugador = (id) => {
        const jugador = jugadores[id] || jugadores[String(id)] || {};
        return {
            nombre: String(jugador.nombre || `ESCRITXR ${id}`).trim() || `ESCRITXR ${id}`,
            juego: Math.max(0, Math.min(100, Number(jugador.juego) || 0)),
            jurado: Math.max(0, Math.min(10, Number(jugador.jurado) || 0)),
            total: Math.max(0, Math.min(100, Number(jugador.total) || 0))
        };
    };
    return {
        disponible: Boolean(payload && payload.disponible),
        empate: Boolean(payload && payload.empate),
        ganador: Number(payload && payload.ganador) || 0,
        diferencia: Math.max(0, Number(payload && payload.diferencia) || 0),
        formula: String(payload && payload.formula || "50% videojuego + 50% jurado"),
        jugadores: { 1: normalizarJugador(1), 2: normalizarJugador(2) }
    };
};

const renderizarResultadoFinalEspectador = (opciones = {}) => {
    if (!resultado_final_stage) return;
    const estado = normalizarResultadoFinalEspectador(estado_resultado_final_espectador || {});
    if (!estado.disponible) {
        resultado_final_stage.innerHTML = '<p class="resultado-jurado-espera">CALCULANDO EL VEREDICTO FINAL&hellip;</p>';
        return;
    }
    const firma = `${estado.ganador}:${estado.jugadores[1].total}:${estado.jugadores[2].total}`;
    if (firma === resultado_final_firma_render_espectador && opciones.forzar !== true) return;
    const tarjeta = (id) => {
        const jugador = estado.jugadores[id];
        const gana = !estado.empate && estado.ganador === id;
        return `<article class="resultado-final-card resultado-final-card--${id}${gana ? " is-winner" : ""}">
            <h3>${escapeHtml(jugador.nombre)}</h3>
            <dl><div><dt>VIDEOJUEGO</dt><dd>${jugador.juego.toFixed(1)}</dd></div><div><dt>JURADO</dt><dd>${jugador.jurado.toFixed(1)}</dd></div></dl>
            <strong>${jugador.total.toFixed(1)}</strong><span>/ 100</span>
        </article>`;
    };
    resultado_final_stage.innerHTML = `<article class="resultado-final-panel ganador-${estado.ganador || 0}">
        <span class="resultado-final-kicker">GANADOR FINAL</span>
        <h2>${estado.empate ? "EMPATE" : escapeHtml(estado.jugadores[estado.ganador].nombre)}</h2>
        <p class="resultado-final-formula">${escapeHtml(estado.formula)}</p>
        <div class="resultado-final-cards">${tarjeta(1)}${tarjeta(2)}</div>
        <p class="resultado-final-celebracion">${estado.empate ? "DOS HISTORIAS. UN MISMO MARCADOR." : "&iexcl;ENHORABUENA, EQUIPO GANADOR!"}</p>
    </article>`;
    resultado_final_stage.classList.remove("is-celebrating");
    requestAnimationFrame(() => resultado_final_stage.classList.add("is-celebrating"));
    if (!estado.empate && typeof confetti_aux === "function") confetti_aux();
    reproducirVictoriaDeliberacionEspectador(`final:${estado.ganador || 0}:${estado.jugadores[1].total}:${estado.jugadores[2].total}`);
    resultado_final_firma_render_espectador = firma;
};

const actualizarResultadoFinalEspectador = (payload = {}) => {
    estado_resultado_final_espectador = normalizarResultadoFinalEspectador(payload);
    if (vista_espectador_modo_resuelta === "resultado_final") renderizarResultadoFinalEspectador({ animar: true });
};

window.actualizarResultadoFinalEspectador = actualizarResultadoFinalEspectador;

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
    expirandoTs: 0,
    superbonus: false,
    repeticiones: 1,
    musas: []
});
const actualizarMetadataPalabraNube = (registro, metadata = {}) => {
    if (!registro) return;
    const info = normalizarInfoPalabraNubeEspectador(metadata);
    const superbonus = normalizarSuperbonusInspiracionEspectador(metadata);
    const autoresDirectos = normalizarFirmaMusaEspectador(metadata, { fallback: false }).autores;
    if (superbonus.activo) {
        registro.superbonus = true;
        registro.repeticiones = superbonus.repeticiones;
        registro.musas = normalizarFirmaMusaEspectador({
            musas: [
                ...registro.musas,
                ...(superbonus.musas.length ? superbonus.musas : (info && info.musas || [])),
                ...autoresDirectos
            ]
        }, { fallback: false }).autores;
        return;
    }
    if (!info) {
        if (autoresDirectos.length) {
            registro.musas = normalizarFirmaMusaEspectador({
                musas: [...registro.musas, ...autoresDirectos]
            }, { fallback: false }).autores;
        }
        return;
    }
    registro.superbonus = Boolean(info.superbonus);
    registro.repeticiones = Math.max(1, Number(info.repeticiones) || 1);
    registro.musas = normalizarFirmaMusaEspectador({
        musas: [...registro.musas, ...(Array.isArray(info.musas) ? info.musas : []), ...autoresDirectos]
    }, { fallback: false }).autores;
};
const medirCajaNubeInspiracion = (registro, canvasW) => {
    const tamFuente = Math.max(16, Math.min(34, Math.max(window.innerWidth || 1, 1) * 0.023));
    const firma = normalizarFirmaMusaEspectador({ musas: registro && registro.musas || [] });
    const medir = (texto, fuentePx) => {
        let ancho = Array.from(String(texto || "")).length * (fuentePx * 0.62);
        if (contextoMedicionCalentamiento && typeof contextoMedicionCalentamiento.measureText === "function") {
            contextoMedicionCalentamiento.font = `${fuentePx}px "Retro-gaming", monospace`;
            ancho = Math.max(ancho, contextoMedicionCalentamiento.measureText(String(texto || "")).width);
        }
        return ancho;
    };
    const tamFirma = Math.max(9, tamFuente * 0.36);
    const anchoPalabra = medir(registro && registro.palabra, tamFuente) + (tamFuente * 0.9);
    const anchoFirma = firma.texto ? medir(`✦ ${firma.texto}`, tamFirma) + (tamFirma * 1.7) : 0;
    const anchoBadge = registro && registro.superbonus ? tamFuente * 2.15 : 0;
    const limiteMitad = Math.max(130, (Number(canvasW) || 1) * 0.43);
    // Reserva el pulso máximo, el borde superbonus y la altura real de la firma.
    // El texto se mide antes de aplicar CSS, por lo que un margen amplio evita
    // que dos tarjetas que no colisionan en reposo se rocen durante la animación.
    const factorAnimacion = 1.55;
    const anchoContenido = Math.min(limiteMitad / factorAnimacion, Math.max(anchoPalabra + anchoBadge, anchoFirma, tamFuente * 2.5));
    const lineasPalabra = Math.max(1, Math.min(2, Math.ceil((anchoPalabra + anchoBadge) / Math.max(1, anchoContenido))));
    return {
        w: anchoContenido * factorAnimacion,
        h: ((tamFuente * 1.25 * lineasPalabra) + (firma.texto ? tamFirma * 1.75 : 0)) * factorAnimacion,
        maxAncho: anchoContenido
    };
};
const obtenerPosicionNube = (equipo, clave, indice, ocupadas, caja, canvasW, canvasH) => {
    const base = hashCadenaInspiracion(clave);
    const mitadInicio = equipo === 1 ? 0 : canvasW * 0.5;
    const mitadFin = equipo === 1 ? canvasW * 0.5 : canvasW;
    const margen = 8;
    const minX = mitadInicio + (caja.w * 0.5) + margen;
    const maxX = mitadFin - (caja.w * 0.5) - margen;
    const minY = Math.max(canvasH * 0.12, (caja.h * 0.5) + margen);
    const maxY = canvasH - (caja.h * 0.5) - margen;
    if (minX > maxX || minY > maxY) return null;
    const separacion = 6;
    for (let i = 0; i < 180; i += 1) {
        const semilla = base + (i * 379) + (indice * 941);
        const cx = minX + (randomSemilla(semilla + 11) * (maxX - minX));
        const cy = minY + (randomSemilla(semilla + 23) * (maxY - minY));
        const colisiona = ocupadas.some((ocupada) => (
            Math.abs(ocupada.cx - cx) < (((ocupada.w + caja.w) * 0.5) + separacion)
            && Math.abs(ocupada.cy - cy) < (((ocupada.h + caja.h) * 0.5) + separacion)
        ));
        if (colisiona) continue;
        const salida = {
            cx,
            cy,
            x: (cx / canvasW) * 100,
            y: (cy / canvasH) * 100,
            w: caja.w,
            h: caja.h,
            scale: 1,
            rot: 0
        };
        posiciones_nube_inspiracion.set(clave, salida);
        ocupadas.push(salida);
        return salida;
    }
    return null;
};
const garantizarPalabraNube = (equipo, palabra, ahora = Date.now(), metadata = {}) => {
    const limpia = String(palabra || "").trim();
    if (!limpia) return "";
    const clave = clavePalabraNube(equipo, limpia);
    if (palabras_bloqueadas_nube.has(clave)) {
        palabras_bloqueadas_nube.delete(clave);
    }
    if (!palabras_nube_inspiracion.has(clave)) {
        palabras_nube_inspiracion.set(clave, crearRegistroPalabraNube(equipo, limpia, ahora));
    }
    actualizarMetadataPalabraNube(palabras_nube_inspiracion.get(clave), metadata);
    return clave;
};
const sincronizarNubeDesdeSnapshot = (estado = {}) => {
    const equipos = estado && estado.equipos ? estado.equipos : {};
    const ahora = Date.now();
    const presentes = new Set();
    [1, 2].forEach((equipo) => {
        const equipoData = equipos[equipo] && typeof equipos[equipo] === "object" ? equipos[equipo] : {};
        const base = Array.isArray(equipoData.palabras_info)
            ? equipoData.palabras_info
            : (Array.isArray(equipoData.palabras) ? equipoData.palabras : []);
        base.forEach((entrada) => {
            const info = normalizarInfoPalabraNubeEspectador(entrada);
            if (!info) return;
            const limpia = String(info.palabra || "").trim();
            if (!limpia) return;
            const clave = clavePalabraNube(equipo, limpia);
            presentes.add(clave);
            if (!palabras_nube_inspiracion.has(clave) && !palabras_bloqueadas_nube.has(clave)) {
                palabras_nube_inspiracion.set(clave, crearRegistroPalabraNube(equipo, limpia, ahora));
            }
            actualizarMetadataPalabraNube(palabras_nube_inspiracion.get(clave), info);
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
const marcarPalabraInspirandoNube = (equipo, palabra, metadata = {}) => {
    const clave = garantizarPalabraNube(equipo, palabra, Date.now(), metadata);
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
    posiciones_nube_inspiracion.clear();
    const ocupadas = [];
    const fragment = document.createDocumentFragment();
    const rectCanvas = typeof nube_inspiracion_canvas.getBoundingClientRect === "function"
        ? nube_inspiracion_canvas.getBoundingClientRect()
        : null;
    const canvasW = Math.max(1, Number(rectCanvas && rectCanvas.width) || window.innerWidth || 1);
    const canvasH = Math.max(1, Number(rectCanvas && rectCanvas.height) || window.innerHeight || 1);
    const capacidadPorEquipo = Math.max(6, Math.min(22, Math.floor((canvasW * canvasH) / 50000)));
    const candidatas = Array.from(palabras_nube_inspiracion.entries())
        .map(([clave, registro]) => ({ clave, registro }))
        .filter(({ registro }) => registro && typeof registro.palabra === "string" && registro.palabra.trim())
        .sort((a, b) => {
            const prioridad = ({ clave, registro }) => (
                Number(clave_activa_nube_por_equipo[registro.equipo] === clave) * 8
                + Number(Boolean(registro.usadaTs)) * 6
                + Number(Boolean(registro.expirandoTs)) * 4
                + Number(Boolean(registro.superbonus)) * 2
            );
            return prioridad(b) - prioridad(a) || (Number(b.registro.ts) || 0) - (Number(a.registro.ts) || 0);
        });
    const entradas = [1, 2].flatMap((equipo) => candidatas
        .filter(({ registro }) => registro.equipo === equipo)
        .slice(0, capacidadPorEquipo));

    entradas.forEach(({ clave, registro }, indice) => {
        const caja = medirCajaNubeInspiracion(registro, canvasW);
        const pos = obtenerPosicionNube(registro.equipo, clave, indice, ocupadas, caja, canvasW, canvasH);
        if (!pos) return;
        const estaActiva = clave_activa_nube_por_equipo[registro.equipo] === clave && !registro.usadaTs && !registro.expirandoTs;
        const estaUsada = Boolean(registro.usadaTs);
        const estaExpirando = Boolean(registro.expirandoTs);
        const esSuperbonus = Boolean(registro.superbonus && Number(registro.repeticiones) >= 2);

        const nodo = document.createElement("span");
        nodo.className = `nube-inspiracion-palabra equipo-${registro.equipo}${estaActiva ? " is-active" : ""}${estaUsada ? " is-used" : ""}${estaExpirando ? " is-expiring" : ""}${esSuperbonus ? " is-superbonus" : ""}`;
        nodo.style.setProperty("--nube-item-max-width", `${Math.round(caja.maxAncho)}px`);
        const filaPalabra = document.createElement("span");
        filaPalabra.className = "nube-inspiracion-word-row";
        const textoPalabra = document.createElement("span");
        textoPalabra.className = "nube-inspiracion-word";
        textoPalabra.textContent = registro.palabra;
        filaPalabra.appendChild(textoPalabra);
        if (esSuperbonus) {
            nodo.dataset.superbonus = "true";
            nodo.dataset.repeticiones = String(registro.repeticiones);
            const badge = document.createElement("span");
            badge.className = "nube-inspiracion-superbonus";
            badge.textContent = `x${registro.repeticiones}`;
            filaPalabra.appendChild(badge);
        }
        nodo.appendChild(filaPalabra);
        const firma = crearNodoFirmaMusaEspectador({ musas: registro.musas }, "inspiration-author--cloud");
        if (firma) nodo.appendChild(firma);
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

const aplicarModoVistaEspectadorUi = (modo) => {
    const modoPrevio = vista_espectador_modo_resuelta;
    vista_espectador_modo_resuelta = modo;
    sincronizarAudioDeliberacionEspectador(modo);
    if (modo !== "partida") {
        ocultarTransicionNivelEspectador();
    }
    if (modo === "nube_inspiracion") {
        limpiarFeedbackFlotanteEspectador();
    }
    if (document.body) {
        document.body.classList.toggle("vista-partida", modo === "partida");
        document.body.classList.toggle("vista-tutorial", modo === "tutorial");
        document.body.classList.toggle("vista-calentamiento", modo === "calentamiento");
        document.body.classList.toggle("vista-stats", modo === "stats");
        document.body.classList.toggle("vista-puntuacion", modo === "puntuacion");
        document.body.classList.toggle("vista-nube-inspiracion", modo === "nube_inspiracion");
        document.body.classList.toggle("vista-creditos", modo === "creditos");
        document.body.classList.toggle("vista-deliberacion", modo === "deliberacion");
        document.body.classList.toggle("vista-resultado-jurado", modo === "resultado_jurado");
        document.body.classList.toggle("vista-resultado-final", modo === "resultado_final");
    }
    if (calentamiento_espectador) {
        calentamiento_espectador.style.display = modo === "calentamiento" ? "flex" : "none";
    }
    if (stats_espectador) {
        stats_espectador.style.display = modo === "stats" ? "grid" : "none";
    }
    if (puntuacion_espectador) {
        puntuacion_espectador.style.display = modo === "puntuacion" ? "grid" : "none";
    }
    if (nube_inspiracion_espectador) {
        nube_inspiracion_espectador.style.display = modo === "nube_inspiracion" ? "flex" : "none";
    }
    if (creditos_espectador) {
        creditos_espectador.style.display = modo === "creditos" ? "flex" : "none";
    }
    if (deliberacion_espectador) {
        deliberacion_espectador.style.display = modo === "deliberacion" ? "grid" : "none";
    }
    if (resultado_jurado_espectador) {
        resultado_jurado_espectador.style.display = modo === "resultado_jurado" ? "grid" : "none";
    }
    if (resultado_final_espectador) {
        resultado_final_espectador.style.display = modo === "resultado_final" ? "grid" : "none";
    }
    actualizarBrandingPartidaEspectador({ permitirIntro: true });
    if (modo === "stats") {
        limpiarFeedbackFlotanteEspectador();
        stopConfetti();
        const countdown = getEl("countdown");
        if (countdown && countdown.parentNode) {
            countdown.parentNode.removeChild(countdown);
        }
        iniciarSlidesStats();
        detenerAnimacionNubeInspiracion();
        detenerAnimacionCreditosEspectador();
        renderizarStatsEspectador();
    } else if (modo === "puntuacion") {
        limpiarFeedbackFlotanteEspectador();
        stopConfetti();
        detenerSlidesStats();
        detenerAnimacionNubeInspiracion();
        detenerAnimacionCreditosEspectador();
        const entrandoEnPuntuacion = modoPrevio !== "puntuacion";
        if (entrandoEnPuntuacion) puntuacion_firma_render_espectador = "";
        renderizarPuntuacionFinalEspectador({ animar: entrandoEnPuntuacion });
    } else if (modo === "nube_inspiracion") {
        iniciarAnimacionNubeInspiracion();
        renderizarNubeInspiracion();
        detenerAnimacionCreditosEspectador();
    } else if (modo === "creditos") {
        detenerSlidesStats();
        detenerAnimacionNubeInspiracion();
        reproducirMusicaCreditosEspectador();
        if (modoPrevio !== "creditos") {
            iniciarAnimacionCreditosEspectador(true);
        }
    } else if (modo === "deliberacion") {
        detenerSlidesStats();
        detenerAnimacionNubeInspiracion();
        detenerAnimacionCreditosEspectador();
    } else if (modo === "resultado_jurado") {
        detenerSlidesStats();
        detenerAnimacionNubeInspiracion();
        detenerAnimacionCreditosEspectador();
        const entrandoEnResultadoJurado = modoPrevio !== "resultado_jurado";
        if (entrandoEnResultadoJurado) jurado_firma_render_espectador = "";
        renderizarResultadoJuradoEspectador({ animar: entrandoEnResultadoJurado });
    } else if (modo === "resultado_final") {
        detenerSlidesStats();
        detenerAnimacionNubeInspiracion();
        detenerAnimacionCreditosEspectador();
        const entrandoEnResultadoFinal = modoPrevio !== "resultado_final";
        if (entrandoEnResultadoFinal) resultado_final_firma_render_espectador = "";
        renderizarResultadoFinalEspectador({ animar: entrandoEnResultadoFinal });
    } else {
        detenerAnimacionNubeInspiracion();
        detenerAnimacionCreditosEspectador();
    }
    if (modo !== "creditos") {
        detenerMusicaCreditosEspectador();
    }
    if (modoPrevio === "puntuacion" && modo !== "puntuacion" && puntuacion_particulas) {
        puntuacion_particulas.classList.remove("is-active", "is-final");
    }
    actualizarVisibilidadPanelNivelEspectador();
    refrescarVisibilidadPreShowEspectador();
    programarAjusteViewportEspectador();
};
const actualizarModoVistaEspectadorUi = (modoForzado = null) => {
    const modo = normalizarModoVistaEspectador(modoForzado || resolverModoVistaEspectadorLocal());
    controlador_audio_vista_espectador?.setMode(modo, {
        initial: !vista_espectador_ui_inicializada
    });
    if (!vista_espectador_ui_inicializada) {
        vista_espectador_ui_inicializada = true;
        vista_espectador_modo_solicitada = modo;
        aplicarModoVistaEspectadorUi(modo);
        return;
    }
    if (
        modo === vista_espectador_modo_solicitada
        && modo !== vista_espectador_modo_resuelta
        && controlador_transicion_vista_espectador
        && controlador_transicion_vista_espectador.isRunningTo(modo)
    ) {
        return;
    }
    vista_espectador_modo_solicitada = modo;
    if (!controlador_transicion_vista_espectador) {
        aplicarModoVistaEspectadorUi(modo);
        return;
    }
    controlador_transicion_vista_espectador.transition({
        from: vista_espectador_modo_resuelta,
        to: modo,
        swap: () => aplicarModoVistaEspectadorUi(modo)
    });
};
const actualizarVistaCalentamiento = (activa) => {
    vista_calentamiento = Boolean(activa);
    if (vista_calentamiento) cerrarPreShowEspectadorPorTutorial();
    actualizarModoVistaEspectadorUi();
};
const actualizarModoVistaEspectadorRemota = (payload = {}) => {
    let cambioPasoStats = false;
    let cambioPasoPuntuacion = false;
    let cambioPasoJurado = false;
    let cambioEscalaUi = false;
    if (payload && typeof payload === "object") {
        if (Object.prototype.hasOwnProperty.call(payload, "stats_slide_step")) {
            const nuevoPaso = normalizarPasoSlideStatsEspectador(payload.stats_slide_step);
            cambioPasoStats = nuevoPaso !== stats_slide_step_remoto;
            stats_slide_step_remoto = nuevoPaso;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "puntuacion_slide_step")) {
            const api = obtenerApiPuntuacionEspectador();
            const nuevoPaso = api && typeof api.normalizarPaso === "function"
                ? api.normalizarPaso(payload.puntuacion_slide_step)
                : 0;
            cambioPasoPuntuacion = nuevoPaso !== puntuacion_slide_step_remoto;
            puntuacion_slide_step_remoto = nuevoPaso;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "puntuacion_reveal_phase")) {
            const api = obtenerApiPuntuacionEspectador();
            const nuevaFase = api && typeof api.normalizarFaseRevelado === "function"
                ? api.normalizarFaseRevelado(payload.puntuacion_reveal_phase)
                : Math.max(0, Math.min(2, Math.trunc(Number(payload.puntuacion_reveal_phase) || 0)));
            cambioPasoPuntuacion = cambioPasoPuntuacion || nuevaFase !== puntuacion_reveal_phase_remoto;
            puntuacion_reveal_phase_remoto = nuevaFase;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "jurado_slide_step")) {
            const nuevoPaso = Math.max(0, Math.trunc(Number(payload.jurado_slide_step) || 0));
            cambioPasoJurado = nuevoPaso !== jurado_slide_step_remoto;
            jurado_slide_step_remoto = nuevoPaso;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "escala_ui")) {
            const nuevaEscala = normalizarEscalaUiEspectador(payload.escala_ui, escala_ui_espectador);
            cambioEscalaUi = nuevaEscala !== escala_ui_espectador;
            escala_ui_espectador = nuevaEscala;
            aplicarEscalaUiEspectador();
        }
        if (Object.prototype.hasOwnProperty.call(payload, "calentamiento_vista")) {
            vista_calentamiento = Boolean(payload.calentamiento_vista);
        }
        if (Object.prototype.hasOwnProperty.call(payload, "override")) {
            vista_espectador_override = normalizarOverrideVistaEspectador(payload.override);
        }
        if (Object.prototype.hasOwnProperty.call(payload, "modo")) {
            const modoServidor = normalizarModoVistaEspectador(payload.modo);
            if (modoServidor === "tutorial") {
                pre_show_bloqueado_por_tutorial_espectador = false;
            }
            if (modoServidor === vista_espectador_modo_solicitada) {
                if (modoServidor === "tutorial") {
                    aplicarModoVistaEspectadorUi(modoServidor);
                    socket.emit("pedir_pre_show_estado");
                }
                if (modoServidor === "stats" && cambioPasoStats) {
                    aplicarSlideStatsActual();
                }
                if (modoServidor === "puntuacion" && cambioPasoPuntuacion) {
                    renderizarPuntuacionFinalEspectador({ animar: true });
                }
                if (modoServidor === "resultado_jurado" && cambioPasoJurado) {
                    renderizarResultadoJuradoEspectador({ animar: true });
                }
                if (cambioEscalaUi) {
                    programarAjusteViewportEspectador();
                }
                return;
            }
            actualizarModoVistaEspectadorUi(modoServidor);
            return;
        }
    }
    if (vista_espectador_modo_resuelta === "stats" && cambioPasoStats) {
        aplicarSlideStatsActual();
    }
    if (vista_espectador_modo_resuelta === "puntuacion" && cambioPasoPuntuacion) {
        renderizarPuntuacionFinalEspectador({ animar: true });
    }
    if (vista_espectador_modo_resuelta === "resultado_jurado" && cambioPasoJurado) {
        renderizarResultadoJuradoEspectador({ animar: true });
    }
    if (cambioEscalaUi || cambioPasoStats || cambioPasoPuntuacion || cambioPasoJurado) {
        programarAjusteViewportEspectador();
        return;
    }
    actualizarModoVistaEspectadorUi();
};

const restaurarVistaEspectadorTrasVideoTutorial = () => {
    const modo = normalizarModoVistaEspectador(resolverModoVistaEspectadorLocal());
    if (modo === "tutorial") {
        pre_show_bloqueado_por_tutorial_espectador = false;
    }
    vista_espectador_modo_solicitada = "";
    aplicarModoVistaEspectadorUi(modo);
    socket.emit("pedir_vista_espectador_modo");
    socket.emit("pedir_pre_show_estado");
};

document.addEventListener("scrib:video-tutorial-visibility", (event) => {
    if (event && event.detail && event.detail.visible) return;
    restaurarVistaEspectadorTrasVideoTutorial();
});

actualizarModoVistaEspectadorUi();
renderizarCreditosEspectador();
aplicarEscalaUiEspectador();
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
            ? normalizarNombreCursorCalentamiento(getEl("nombre")?.value, traducirNombreEscritoraEspectador(1, "ESCRITXR 1"))
            : normalizarNombreCursorCalentamiento(getEl("nombre1")?.value, traducirNombreEscritoraEspectador(2, "ESCRITXR 2"));
        label.textContent = nombre.toUpperCase();
    }
    if (word) {
        if (final) {
            const textoFinal = document.createElement("span");
            textoFinal.className = "final-word__text";
            textoFinal.textContent = final.palabra.toUpperCase();
            word.replaceChildren(textoFinal);
            const firma = crearNodoFirmaMusaEspectador(final, "inspiration-author--final");
            if (firma) word.appendChild(firma);
        } else if (bloqueado) {
            word.textContent = tJuego2P("warmup.final.choosing", {}, "ELIGIENDO...");
        } else {
            word.textContent = tJuego2P("warmup.final.pending", {}, "PENDIENTE");
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
    if (final1 && final2) return tJuego2P("warmup.state.both_final", {}, "Ambas escritoras eligieron su palabra final. Esperando nueva consigna.");
    if (final1 || final2) return tJuego2P("warmup.state.one_final_missing", {}, "Falta una palabra final para completar esta consigna.");
    const bloqueadas = Number(Boolean(e1.bloqueado)) + Number(Boolean(e2.bloqueado));
    if (bloqueadas > 0) return tJuego2P("warmup.state.table_closed_choose_final", {}, "Consigna cerrada en una mesa. Falta elegir palabra final.");
    return tJuego2P("warmup.state.receiving_words", {}, "Recibiendo palabras de las musas.");
};

const actualizarCalentamientoEspectador = (data) => {
    if (!data) return;
    ultimo_payload_calentamiento_espectador = data;
    const activoServidor = Boolean(data.activo);
    // La dinamica de detonadores puede seguir activa en segundo plano. Solo su
    // vista visible debe ocultar Tutorial; el estado periodico no puede echar
    // al publico del canal que Control acaba de seleccionar.
    if (data.vista === true) {
        cerrarPreShowEspectadorPorTutorial();
    }
    if (activoServidor && !calentamiento_activo_previo_espectador) {
        limpiarHistorialDetonadores();
    }
    calentamiento_activo_previo_espectador = activoServidor;
    actualizarEtiquetasCursorCalentamiento();
    const equipos = data.equipos || {};
    actualizarConsignaCalentamientoEspectador(data.solicitud, equipos);
    if (typeof data.vista === "boolean") {
        actualizarVistaCalentamiento(data.vista);
    }
    const activo = Boolean(data.activo && data.vista);
    if (calentamiento_global_estado) {
        calentamiento_global_estado.textContent = activo
            ? construirEstadoGlobalCalentamiento(equipos)
            : (data.activo
                ? tJuego2P("warmup.state.hidden", {}, "Tutorial oculto.")
                : tJuego2P("warmup.state.inactive", {}, "Tutorial inactivo."));
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
const raf_degradado_textarea_espectador = new Map();
let timeout_degradado_textos_espectador = null;
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
    if (timeout_degradado_textos_espectador) {
        clearTimeout(timeout_degradado_textos_espectador);
    }
    timeout_degradado_textos_espectador = setTimeout(() => {
        timeout_degradado_textos_espectador = null;
        programarActualizacionDegradadoTextosEspectador();
    }, 120);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarDegradadoDinamicoTextosEspectador, { once: true });
} else {
    iniciarDegradadoDinamicoTextosEspectador();
}

const timeout_puntos_espectador = new Map();

const formatearPuntosMarcador = (valor) => {
    return formatearPalabrasEspectador(valor);
};

const formatearMusasMarcador = (valor) => {
    return formatearMusasEspectador(valor);
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

function obtenerChipRegaloMusaEspectador(equipo) {
    if (Number(equipo) === 1) return musa_regalo_estado_j1;
    if (Number(equipo) === 2) return musa_regalo_estado_j2;
    return null;
}

function animarChipRegaloMusaEspectador(equipo) {
    const chip = obtenerChipRegaloMusaEspectador(equipo);
    if (!chip) return;
    chip.classList.remove("is-award");
    void chip.offsetWidth;
    chip.classList.add("is-award");
    if (timeout_chip_regalo_musa_espectador[equipo]) {
        clearTimeout(timeout_chip_regalo_musa_espectador[equipo]);
    }
    timeout_chip_regalo_musa_espectador[equipo] = setTimeout(() => {
        timeout_chip_regalo_musa_espectador[equipo] = null;
        if (chip) {
            chip.classList.remove("is-award");
        }
    }, 720);
}

function actualizarChipRegaloMusaEspectador(equipo, estado = null) {
    const chip = obtenerChipRegaloMusaEspectador(equipo);
    if (!chip) return;
    if (!estado || !estado.visible) {
        chip.hidden = true;
        chip.textContent = "";
        return;
    }
    const objetivo = Math.max(1, Number(estado.objetivo) || 1);
    const progreso = Math.max(0, Math.min(objetivo, Number(estado.progreso) || 0));
    const cooldownMs = Math.max(0, Number(estado.cooldown_ms) || 0);
    chip.hidden = false;
    chip.textContent = cooldownMs > 0 && progreso === 0
        ? `APOYO DE MUSAS | RECARGA ${Math.max(1, Math.ceil(cooldownMs / 1000))}S`
        : `APOYO DE MUSAS | ${progreso}/${objetivo}`;
}

function actualizarEstadoRegaloBanderaEspectador(payload = {}) {
    const equipos = payload && payload.equipos ? payload.equipos : {};
    actualizarChipRegaloMusaEspectador(1, equipos[1] || null);
    actualizarChipRegaloMusaEspectador(2, equipos[2] || null);
}

function limpiarAsincroniaVisualEspectador({ resetViewport = false } = {}) {
    Object.keys(timeout_fulgor_espectador).forEach((key) => {
        if (timeout_fulgor_espectador[key]) {
            clearTimeout(timeout_fulgor_espectador[key]);
            timeout_fulgor_espectador[key] = null;
        }
        const nodo = fulgores_espectador[key];
        if (nodo) {
            nodo.classList.remove("activa");
            CLASES_FULGOR_LADO_ESPECTADOR.forEach((clase) => nodo.classList.remove(clase));
        }
    });
    timeout_puntos_espectador.forEach((timeoutId, elemento) => {
        clearTimeout(timeoutId);
        if (elemento && elemento.classList) {
            elemento.classList.remove("puntos-hit");
        }
    });
    timeout_puntos_espectador.clear();
    Object.keys(timeout_chip_regalo_musa_espectador).forEach((key) => {
        if (timeout_chip_regalo_musa_espectador[key]) {
            clearTimeout(timeout_chip_regalo_musa_espectador[key]);
            timeout_chip_regalo_musa_espectador[key] = null;
        }
        const chip = obtenerChipRegaloMusaEspectador(Number(key));
        if (chip) {
            chip.classList.remove("is-award");
        }
    });
    if (raf_ajuste_viewport_espectador) {
        cancelAnimationFrame(raf_ajuste_viewport_espectador);
        raf_ajuste_viewport_espectador = null;
    }
    if (timeout_ajuste_viewport_espectador) {
        clearTimeout(timeout_ajuste_viewport_espectador);
        timeout_ajuste_viewport_espectador = null;
    }
    raf_degradado_textarea_espectador.forEach((rafId) => cancelAnimationFrame(rafId));
    raf_degradado_textarea_espectador.clear();
    if (timeout_degradado_textos_espectador) {
        clearTimeout(timeout_degradado_textos_espectador);
        timeout_degradado_textos_espectador = null;
    }
    if (resetViewport) {
        resetAjusteViewportEspectador();
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
let modo_seq_actual_espectador = 0;
let ultimo_count_seq_espectador = { 1: 0, 2: 0 };
let tiempo_seq_actual_espectador = { 1: 0, 2: 0 };
let tempo_rayo_espectador = null;
let tempo_text_inverso1;
let tempo_text_inverso2;
let tempo_text_borroso1;
let tempo_text_borroso2;
let revision_contexto_transitorio_espectador = 0;
let listener_modo;
let activado_psico1 = false;
let activado_psico2 = false;
let listener_cuenta_atras = null;
let timeout_countdown;
let timeout_timer;
let timeout_animacion_countdown_espectador = null;
let timeout_remover_countdown_espectador = null;
let timeout_fallback_countdown_espectador = null;
let revision_countdown_inicio_espectador = 0;
let cuenta_atras_activa = false;
let modo_pendiente = null;
let post_inicio_pendiente_espectador = null;

function invalidarContextoTransitorioEspectador() {
    revision_contexto_transitorio_espectador += 1;
    clearTimeout(tempo_rayo_espectador);
    clearTimeout(tempo_text_inverso1);
    clearTimeout(tempo_text_inverso2);
    clearTimeout(tempo_text_borroso1);
    clearTimeout(tempo_text_borroso2);
    tempo_rayo_espectador = null;
    tempo_text_inverso1 = null;
    tempo_text_inverso2 = null;
    tempo_text_borroso1 = null;
    tempo_text_borroso2 = null;
    detenerSonidosDesventaja();
    if (typeof limpiarVisualPutadasEspectador === "function") {
        limpiarVisualPutadasEspectador();
    }
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    lightning.style.removeProperty("animation-duration");
    if (texto1) {
        texto1.classList.remove("rotate-vertical-center", "textarea_blur");
    }
    if (texto2) {
        texto2.classList.remove("rotate-vertical-center", "textarea_blur");
    }
    if (typeof temp_text_borroso_activado1 !== "undefined") {
        temp_text_borroso_activado1 = false;
    }
    if (typeof temp_text_borroso_activado2 !== "undefined") {
        temp_text_borroso_activado2 = false;
    }
    if (typeof modo_texto_borroso1 !== "undefined") {
        modo_texto_borroso1 = false;
    }
    if (typeof modo_texto_borroso2 !== "undefined") {
        modo_texto_borroso2 = false;
    }
    return revision_contexto_transitorio_espectador;
}

function obtenerRevisionContextoTransitorioEspectador() {
    return revision_contexto_transitorio_espectador;
}

function esRevisionContextoTransitorioEspectadorActiva(revision) {
    return revision === revision_contexto_transitorio_espectador;
}

function invalidarCountdownInicioEspectador(opciones = {}) {
    const { resetFlags = true } = opciones;
    revision_countdown_inicio_espectador += 1;
    clearTimeout(listener_cuenta_atras);
    clearTimeout(timeout_countdown);
    clearTimeout(timeout_timer);
    clearTimeout(timeout_animacion_countdown_espectador);
    clearTimeout(timeout_remover_countdown_espectador);
    clearTimeout(timeout_fallback_countdown_espectador);
    clearTimeout(timeout_inicio_modo);
    clearTimeout(timer);
    clearInterval(timer);
    listener_cuenta_atras = null;
    timeout_countdown = null;
    timeout_timer = null;
    timeout_animacion_countdown_espectador = null;
    timeout_remover_countdown_espectador = null;
    timeout_fallback_countdown_espectador = null;
    timeout_inicio_modo = null;
    timer = null;
    $('#countdown').remove();
    if (resetFlags) {
        cuenta_atras_activa = false;
        inicio_modo_delay = false;
        modo_pendiente = null;
    }
    return revision_countdown_inicio_espectador;
}

function esRevisionCountdownInicioEspectadorActiva(revision) {
    return revision === revision_countdown_inicio_espectador;
}

let inicio_modo_delay = false;
let timeout_inicio_modo = null;
let cola_palabras_pendientes_espectador = [];
let cola_putadas_pendientes_espectador = [];
let Temasinterval;
let estado_votacion_ventaja_espectador = "";
let sonido_confetti_musa;
let sonido_confetti;
let audio_inverso;
let audio_borroso;
let sonido_modo;
let intervaloSonidoRayo;
let timer = null;
let frase_final_completada_j1 = false;
let frase_final_completada_j2 = false;
let confetti_cierre_partida_disparado = false;
let fin_ultimo_nivel_por_tiempo = false;
let suprimir_confetti_cierre_por_fin_control = false;
let cierre_definitivo_j1 = false;
let cierre_definitivo_j2 = false;
const color_negativo = "red";
const color_positivo = "greenyellow";
let musa_regalo_estado_j1 = getEl("musa_regalo_estado_j1");
let musa_regalo_estado_j2 = getEl("musa_regalo_estado_j2");
let TIEMPO_MODIFICADOR;
let frase_final_j1;
let frase_final_j2;

function extraerModoSeqPayloadEspectador(payload = {}) {
    const valor = Number(payload && payload.modo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function extraerTiempoSeqPayloadEspectador(payload = {}) {
    const valor = Number(payload && payload.tiempo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function aceptarEventoModoEspectador(payload = {}, opciones = {}) {
    const { actualizar = true } = opciones;
    const seq = extraerModoSeqPayloadEspectador(payload);
    if (seq === null) {
        return true;
    }
    if (seq < modo_seq_actual_espectador) {
        return false;
    }
    if (actualizar && seq > modo_seq_actual_espectador) {
        modo_seq_actual_espectador = seq;
        ultimo_count_seq_espectador[1] = 0;
        ultimo_count_seq_espectador[2] = 0;
        tiempo_seq_actual_espectador[1] = 0;
        tiempo_seq_actual_espectador[2] = 0;
    }
    return true;
}

function aceptarCountEspectador(payload = {}) {
    if (!aceptarEventoModoEspectador(payload)) {
        return false;
    }
    const playerId = Number(payload && payload.player) === 2 ? 2 : 1;
    const tiempoSeq = extraerTiempoSeqPayloadEspectador(payload);
    if (tiempoSeq !== null) {
        if (tiempoSeq < (tiempo_seq_actual_espectador[playerId] || 0)) {
            return false;
        }
        if (tiempoSeq > (tiempo_seq_actual_espectador[playerId] || 0)) {
            tiempo_seq_actual_espectador[playerId] = tiempoSeq;
            ultimo_count_seq_espectador[playerId] = 0;
        }
    }
    const countSeq = Number(payload && payload.count_seq);
    if (Number.isFinite(countSeq) && countSeq > 0) {
        if (countSeq <= (ultimo_count_seq_espectador[playerId] || 0)) {
            return false;
        }
        ultimo_count_seq_espectador[playerId] = Math.trunc(countSeq);
    }
    return true;
}

function extraerPayloadNuevaLetraEspectador(payload) {
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
let progreso_frase_final_base_j1 = null;
let progreso_frase_final_base_j2 = null;
let progreso_frase_final_base_max = 0;
let progreso_frase_final_actual_j1 = null;
let progreso_frase_final_actual_j2 = null;
let intro_cuenta_atras_activa = false;
let intro_cuenta_atras_fase = -1;

let sonido;

function limpiarColaPalabrasPendientesEspectador() {
    cola_palabras_pendientes_espectador = [];
}

function limpiarColaPutadasPendientesEspectador() {
    cola_putadas_pendientes_espectador = [];
}

function debeAplazarRenderPalabraEspectador() {
    return Boolean(cuenta_atras_activa || inicio_modo_delay || modo_pendiente);
}

function debeAplazarPutadaEspectador() {
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

function encolarPutadaPendienteEspectador(player, putada, opciones = {}) {
    const id = Number(player) === 2 ? 2 : 1;
    cola_putadas_pendientes_espectador.push({ player: id, putada, opciones });
    if (cola_putadas_pendientes_espectador.length > 20) {
        cola_putadas_pendientes_espectador.shift();
    }
}

function vaciarColaPutadasPendientesEspectador() {
    if (debeAplazarPutadaEspectador()) return;
    if (!cola_putadas_pendientes_espectador.length) return;
    const cola = cola_putadas_pendientes_espectador.slice();
    cola_putadas_pendientes_espectador = [];
    cola.forEach((item) => {
        if (!item) return;
        anunciarPutadaEspectador(item.player, item.putada, item.opciones || {});
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

function reiniciarProgresoFraseFinalEspectador() {
    progreso_frase_final_base_j1 = null;
    progreso_frase_final_base_j2 = null;
    progreso_frase_final_base_max = 0;
    progreso_frase_final_actual_j1 = null;
    progreso_frase_final_actual_j2 = null;
}

function registrarTiempoFraseFinalJugadorEspectador(playerId, segundosRestantes) {
    if (modo_actual !== "frase final") return;
    const segundos = Number(segundosRestantes);
    if (!Number.isFinite(segundos) || segundos < 0) return;
    const id = Number(playerId);
    if (id === 1) {
        progreso_frase_final_actual_j1 = segundos;
        if (!Number.isFinite(progreso_frase_final_base_j1) || progreso_frase_final_base_j1 <= 0 || segundos > progreso_frase_final_base_j1) {
            progreso_frase_final_base_j1 = segundos;
        }
    } else if (id === 2) {
        progreso_frase_final_actual_j2 = segundos;
        if (!Number.isFinite(progreso_frase_final_base_j2) || progreso_frase_final_base_j2 <= 0 || segundos > progreso_frase_final_base_j2) {
            progreso_frase_final_base_j2 = segundos;
        }
    }
    const baseMax = Math.max(
        Number.isFinite(progreso_frase_final_base_j1) ? progreso_frase_final_base_j1 : 0,
        Number.isFinite(progreso_frase_final_base_j2) ? progreso_frase_final_base_j2 : 0
    );
    if (baseMax > 0) {
        progreso_frase_final_base_max = baseMax;
    }
}

function obtenerRestanteMaxFraseFinalEspectador() {
    const candidatos = [];
    if (Number.isFinite(progreso_frase_final_actual_j1)) candidatos.push(Math.max(0, progreso_frase_final_actual_j1));
    if (Number.isFinite(progreso_frase_final_actual_j2)) candidatos.push(Math.max(0, progreso_frase_final_actual_j2));
    if (!candidatos.length) return null;
    return Math.max(...candidatos);
}

function actualizarProgresoFraseFinalEspectador() {
    if (modo_actual !== "frase final") return;
    const base = Math.max(0, Number(progreso_frase_final_base_max) || 0);
    if (base <= 0) {
        setProgresoNivelBarra(0);
        return;
    }
    const restanteMax = obtenerRestanteMaxFraseFinalEspectador();
    if (!Number.isFinite(restanteMax)) {
        return;
    }
    const pct = Math.max(0, Math.min(100, ((base - restanteMax) / base) * 100));
    setProgresoNivelBarra(pct);
    if (restanteMax <= 0) {
        fin_ultimo_nivel_por_tiempo = true;
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
        if (modo_actual === "frase final") {
            evaluarCierrePartidaEspectador({ origen: "progreso_nivel" }, { finTiempoUltimoNivel: true });
        }
    }
}

function iniciarProgresoNivelBarra() {
    if (modo_actual === "frase final") {
        detenerProgresoNivelBarra(true);
        reiniciarProgresoFraseFinalEspectador();
        return;
    }
    detenerProgresoNivelBarra(true);
    inicio_nivel_ts = Date.now();
    tickProgresoNivelBarra();
    intervalo_progreso_nivel = setInterval(tickProgresoNivelBarra, 120);
}

function sincronizarProgresoNivelBarraDesdeSegundos(payload = {}) {
    if (!modo_actual || modo_actual === "frase final") return false;
    const data = (payload && typeof payload === "object") ? payload : {};
    const modoEvento = typeof data.modo_actual === "string" ? data.modo_actual : "";
    if (modoEvento && modoEvento !== modo_actual) return false;
    const segundos = Number(data.segundos_transcurridos);
    if (!Number.isFinite(segundos) || segundos < 0) return false;

    const ms = Math.max(0, Math.min(DURACION_NIVEL_MS, Math.round(segundos * 1000)));
    inicio_nivel_ts = Date.now() - ms;
    const pct = DURACION_NIVEL_MS > 0 ? (ms / DURACION_NIVEL_MS) * 100 : 0;
    setProgresoNivelBarra(pct);

    if (pct >= 100) {
        detenerProgresoNivelBarra(false);
    } else if (!intervalo_progreso_nivel) {
        intervalo_progreso_nivel = setInterval(tickProgresoNivelBarra, 120);
    }
    return true;
}

function normalizarLetraNivel(letra) {
    if (window && typeof window.scribNormalizeModeLetter2P === "function") {
        return window.scribNormalizeModeLetter2P(letra);
    }
    const valor = String(letra || "").trim();
    if (!valor) return "";
    const compacto = valor.replace(/\s+/g, "");
    if (/[\u00b1\u2018\u2019\u0091]/u.test(compacto) && /[\u00c3\u00e3\u00c2\u0192]/u.test(compacto)) {
        return "\u00f1";
    }
    const letraValida = Array.from(compacto).find((char) => /[A-Za-z\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1]/u.test(char));
    return letraValida || Array.from(compacto)[0] || "";
}

function formatoLetraNivel(letra) {
    const valor = normalizarLetraNivel(letra);
    return valor ? valor.toLocaleUpperCase("es-ES") : "-";
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
    if (window && typeof window.scribBuildModeRule2P === "function") {
        return window.scribBuildModeRule2P(tipo, letra);
    }
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
        nodo.classList.remove("definicion-superbonus");
        if (nodo.dataset) {
            delete nodo.dataset.superbonus;
            delete nodo.dataset.superbonusRepeticiones;
        }
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
    const tiempoTexto = window.ScribInspiration && typeof window.ScribInspiration.formatearTiempoPalabraAsignada === "function"
        ? window.ScribInspiration.formatearTiempoPalabraAsignada(data, { modo: modo_actual })
        : "";
    if (!tiempoTexto) return palabraSegura;
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

function limpiarTimeoutRayoEspectador() {
    if (tempo_rayo_espectador) {
        clearTimeout(tempo_rayo_espectador);
        tempo_rayo_espectador = null;
    }
}

function ocultarRayoEspectador() {
    limpiarTimeoutRayoEspectador();
    detenerSonidoRayo();
    if (document.body && document.body.classList) {
        document.body.classList.remove("bg");
        document.body.classList.remove("rain");
    }
    if (lightning && lightning.classList) {
        lightning.classList.remove("lightning");
        lightning.style.removeProperty("animation-duration");
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
        animateCSS("#contenedor_espectador", "pulse");
    });
}
//reproducirSonido("../../game/audio/1. MENU DE INICIO.mp3", true)

const desventajaVaciaEspectador = function () {};
const {
    TORTUGA: PUTADA_TORTUGA,
    RAYO: PUTADA_RAYO,
    BRUMA: PUTADA_BORROSO,
    ESPEJO: PUTADA_INVERSO,
    BLOQUEO: PUTADA_PLUMA
} = window.ScribDisadvantages.EMOJIS;
const CLASES_VISUALES_PUTADA_ESPECTADOR = [
    "putada-visual-activa",
    "putada-visual--tortuga",
    "putada-visual--rayo",
    "putada-visual--borroso",
    "putada-visual--inverso",
    "putada-visual--pluma"
];
const temporizadores_visual_putada_espectador = { 1: null, 2: null };
const estado_visual_putada_espectador = { 1: null, 2: null };

function obtenerDuracionModificadorEspectador(opciones = {}) {
    const duracionOverride = Number(
        opciones.duracionMs
        ?? opciones.duracion_ms
        ?? opciones.tiempo_restante_ms
        ?? opciones.restante_ms
    );
    if (Number.isFinite(duracionOverride) && duracionOverride > 0) {
        return Math.round(duracionOverride);
    }
    const duracion = Number(TIEMPO_MODIFICADOR);
    if (Number.isFinite(duracion) && duracion > 0) {
        return Math.round(duracion);
    }
    return 3500;
}

function obtenerDuracionFeedbackPutadaEspectador() {
    const estimada = Math.round(obtenerDuracionModificadorEspectador() * 0.65);
    return Math.max(2600, Math.min(4200, estimada));
}

function obtenerRaizVisualPutadaEspectador(player) {
    const area = Number(player) === 2 ? texto2 : texto1;
    if (!area || typeof area.closest !== "function") {
        return null;
    }
    return area.closest(".jugador1, .jugador2");
}

function obtenerClaseVisualPutadaEspectador(putada) {
    switch (normalizarPutada(putada)) {
        case PUTADA_TORTUGA:
            return "putada-visual--tortuga";
        case PUTADA_RAYO:
            return "putada-visual--rayo";
        case PUTADA_BORROSO:
            return "putada-visual--borroso";
        case PUTADA_INVERSO:
            return "putada-visual--inverso";
        case PUTADA_PLUMA:
            return "putada-visual--pluma";
        default:
            return "";
    }
}

function obtenerEtiquetaVisualPutadaEspectador(putada) {
    return window.ScribDisadvantages.etiqueta(normalizarPutada(putada));
}

function limpiarVisualPutadaEspectador(player, opciones = {}) {
    const id = Number(player) === 2 ? 2 : 1;
    if (opciones.limpiarEfecto === true) {
        const activa = estado_visual_putada_espectador[id];
        if (activa && activa.putada) {
            limpiarTemporizadoresEfectoPutadaEspectador(id, activa.putada);
        }
    }
    clearTimeout(temporizadores_visual_putada_espectador[id]);
    temporizadores_visual_putada_espectador[id] = null;
    estado_visual_putada_espectador[id] = null;
    const raiz = obtenerRaizVisualPutadaEspectador(id);
    if (!raiz) {
        return;
    }
    raiz.classList.remove(...CLASES_VISUALES_PUTADA_ESPECTADOR);
    delete raiz.dataset.putadaVisual;
}

function limpiarVisualPutadasEspectador() {
    limpiarVisualPutadaEspectador(1, { limpiarEfecto: true });
    limpiarVisualPutadaEspectador(2, { limpiarEfecto: true });
}

function activarVisualPutadaEspectador(player, putada, opciones = {}) {
    const id = Number(player) === 2 ? 2 : 1;
    const clave = normalizarPutada(putada);
    const revisionContexto = obtenerRevisionContextoTransitorioEspectador();
    const clase = obtenerClaseVisualPutadaEspectador(clave);
    const etiqueta = obtenerEtiquetaVisualPutadaEspectador(clave);
    const raiz = obtenerRaizVisualPutadaEspectador(id);
    const activaAnterior = estado_visual_putada_espectador[id];
    if (activaAnterior && activaAnterior.putada) {
        limpiarTemporizadoresEfectoPutadaEspectador(id, activaAnterior.putada);
    }
    limpiarVisualPutadaEspectador(id);
    if (!raiz || !clase || !etiqueta) {
        return false;
    }
    const duracion = obtenerDuracionModificadorEspectador(opciones);
    raiz.dataset.putadaVisual = etiqueta;
    raiz.classList.add("putada-visual-activa", clase);
    estado_visual_putada_espectador[id] = {
        player: id,
        putada: clave,
        duracionMs: duracion,
        restanteMs: duracion,
        inicioTs: Date.now(),
        pausada: false,
        revision: revisionContexto
    };
    temporizadores_visual_putada_espectador[id] = setTimeout(() => {
        if (!esRevisionContextoTransitorioEspectadorActiva(revisionContexto)) {
            return;
        }
        limpiarVisualPutadaEspectador(id);
    }, duracion);
    return true;
}

function limpiarTemporizadoresEfectoPutadaEspectador(player, putada) {
    const id = Number(player) === 2 ? 2 : 1;
    const clave = normalizarPutada(putada);
    clearTimeout(temporizadores_visual_putada_espectador[id]);
    temporizadores_visual_putada_espectador[id] = null;
    if (clave === PUTADA_BORROSO) {
        if (id === 1) {
            clearTimeout(tempo_text_borroso1);
            tempo_text_borroso1 = null;
        } else {
            clearTimeout(tempo_text_borroso2);
            tempo_text_borroso2 = null;
        }
        detenerAudioBorroso();
    } else if (clave === PUTADA_INVERSO) {
        if (id === 1) {
            clearTimeout(tempo_text_inverso1);
            tempo_text_inverso1 = null;
        } else {
            clearTimeout(tempo_text_inverso2);
            tempo_text_inverso2 = null;
        }
        detenerAudioInverso();
    } else if (clave === PUTADA_RAYO) {
        ocultarRayoEspectador();
    }
}

function pausarDesventajasVisualesEspectador() {
    [1, 2].forEach((id) => {
        const activa = estado_visual_putada_espectador[id];
        if (!activa || activa.pausada) return;
        const transcurrido = Math.max(0, Date.now() - activa.inicioTs);
        activa.restanteMs = Math.max(0, activa.restanteMs - transcurrido);
        activa.pausada = true;
        limpiarTemporizadoresEfectoPutadaEspectador(id, activa.putada);
    });
}

function reanudarDesventajasVisualesEspectador() {
    [1, 2].forEach((id) => {
        const activa = estado_visual_putada_espectador[id];
        if (!activa || !activa.pausada) return;
        const restanteMs = Math.max(0, Math.round(Number(activa.restanteMs) || 0));
        const putada = activa.putada;
        aplicarPutadaEnEspectador(putada, id, {
            duracionMs: restanteMs,
            mostrarFeedback: false,
            mostrarVentajaRival: false
        });
    });
}

const desventajaRayoEspectador = function (player, opciones = {}) {
    limpiarTimeoutRayoEspectador();
    detenerSonidoRayo();
    const revisionContexto = obtenerRevisionContextoTransitorioEspectador();
    const duracion = obtenerDuracionModificadorEspectador(opciones);
    if (player == 1) {
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.animationDuration = "1.15s";
        lightning.style.right = "45%";
        lightning.style.left = "0%";
        reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
        intervaloSonidoRayo = setInterval(() => {
            reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
        }, 4000);
        tempo_rayo_espectador = setTimeout(function () {
            tempo_rayo_espectador = null;
            if (!esRevisionContextoTransitorioEspectadorActiva(revisionContexto)) {
                return;
            }
            ocultarRayoEspectador();
        }, duracion);
    } else if (player == 2) {
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.animationDuration = "1.15s";
        lightning.style.right = "0%";
        lightning.style.left = "45%";
        reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
        intervaloSonidoRayo = setInterval(() => {
            reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
        }, 4000);
        tempo_rayo_espectador = setTimeout(function () {
            tempo_rayo_espectador = null;
            if (!esRevisionContextoTransitorioEspectadorActiva(revisionContexto)) {
                return;
            }
            ocultarRayoEspectador();
        }, duracion);
    }
};

const desventajaInversoEspectador = function (player, opciones = {}) {
    detenerAudioInverso();
    audio_inverso = reproducirSonido("../../game/audio/FX/8. INVERSO LOOP.mp3", true);
    const revisionContexto = obtenerRevisionContextoTransitorioEspectador();
    const duracion = obtenerDuracionModificadorEspectador(opciones);
    if (player == 1) {
        texto1.classList.add("rotate-vertical-center");
        texto1.addEventListener("animationend", function () {
            texto1.classList.remove("rotate-vertical-center");
            texto1.removeEventListener("animationend", arguments.callee);
        });
        tempo_text_inverso1 = setTimeout(function () {
            if (!esRevisionContextoTransitorioEspectadorActiva(revisionContexto)) {
                return;
            }
            detenerAudioInverso();
            texto1.classList.add("rotate-vertical-center");
            texto1.addEventListener("animationend", function () {
                texto1.classList.remove("rotate-vertical-center");
                texto1.removeEventListener("animationend", arguments.callee);
            });
        }, duracion);
    } else if (player == 2) {
        texto2.classList.add("rotate-vertical-center");
        texto2.addEventListener("animationend", function () {
            texto2.classList.remove("rotate-vertical-center");
            texto2.removeEventListener("animationend", arguments.callee);
        });
        tempo_text_inverso2 = setTimeout(function () {
            if (!esRevisionContextoTransitorioEspectadorActiva(revisionContexto)) {
                return;
            }
            detenerAudioInverso();
            texto2.classList.add("rotate-vertical-center");
            texto2.addEventListener("animationend", function () {
                texto2.classList.remove("rotate-vertical-center");
                texto2.removeEventListener("animationend", arguments.callee);
            });
        }, duracion);
    }
};

const desventajaBorrosoEspectador = function (player, opciones = {}) {
    detenerAudioBorroso();
    audio_borroso = reproducirSonido("../../game/audio/FX/7. REMOLINO PARA LOOP.mp3", true);
    const revisionContexto = obtenerRevisionContextoTransitorioEspectador();
    const duracion = obtenerDuracionModificadorEspectador(opciones);
    modo_texto_borroso1 = true;
    tiempo_inicial = new Date();
    if (player == 1) {
        texto1.classList.add("textarea_blur");
        tempo_text_borroso1 = setTimeout(function () {
            if (!esRevisionContextoTransitorioEspectadorActiva(revisionContexto)) {
                return;
            }
            detenerAudioBorroso();
            temp_text_borroso_activado1 = true;
            texto1.classList.remove("textarea_blur");
        }, duracion);
    } else if (player == 2) {
        modo_texto_borroso2 = true;
        texto2.classList.add("textarea_blur");
        tempo_text_borroso2 = setTimeout(function () {
            if (!esRevisionContextoTransitorioEspectadorActiva(revisionContexto)) {
                return;
            }
            detenerAudioBorroso();
            temp_text_borroso_activado2 = true;
            texto2.classList.remove("textarea_blur");
        }, duracion);
    }
};

const PUTADAS = {
    [PUTADA_TORTUGA]: desventajaVaciaEspectador,
    [PUTADA_RAYO]: desventajaRayoEspectador,
    [PUTADA_BORROSO]: desventajaBorrosoEspectador,
    [PUTADA_INVERSO]: desventajaInversoEspectador,
    [PUTADA_PLUMA]: desventajaVaciaEspectador
};

function normalizarPutada(putada) {
    const valor = String(putada || "").trim();
    const sinVs16 = valor.replace(/\uFE0F/g, "");
    const valorTexto = typeof sinVs16.normalize === "function"
        ? sinVs16.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        : sinVs16.toLowerCase();
    const normalizadaCompartida = window.ScribDisadvantages.normalizar(valor);
    if (normalizadaCompartida !== valor) {
        return normalizadaCompartida;
    }
    const mapa = {
        [PUTADA_TORTUGA]: PUTADA_TORTUGA,
        [PUTADA_RAYO]: PUTADA_RAYO,
        "\u{1F32A}": PUTADA_BORROSO,
        [PUTADA_BORROSO]: PUTADA_BORROSO,
        [PUTADA_INVERSO]: PUTADA_INVERSO,
        "\u{1F58A}": PUTADA_PLUMA,
        [PUTADA_PLUMA]: PUTADA_PLUMA,
        "Ã¯Â¿Â½sÃ¯Â¿Â½": PUTADA_RAYO,
        "Ã¯Â¿Â½YTf": PUTADA_INVERSO,
        "Ã¯Â¿Â½YOÃ¯Â¿Â½Ã¯Â¸Â": PUTADA_BORROSO,
        "Ã¯Â¿Â½Y-SÃ¯Â¸Â": PUTADA_PLUMA,
        "Ã¯Â¿Â½YÃ¯Â¿Â½Ã¯Â¿Â½": PUTADA_TORTUGA,
        "Ã¯Â¿Â½O>": PUTADA_TORTUGA
    };
    const mapaTexto = {
        tortuga: PUTADA_TORTUGA,
        turtle: PUTADA_TORTUGA,
        lento: PUTADA_TORTUGA,
        "teclado lento": PUTADA_TORTUGA,
        rayo: PUTADA_RAYO,
        rapido: PUTADA_RAYO,
        "borrado rapido": PUTADA_RAYO,
        borroso: PUTADA_BORROSO,
        remolino: PUTADA_BORROSO,
        inverso: PUTADA_INVERSO,
        "al reves": PUTADA_INVERSO,
        pluma: PUTADA_PLUMA,
        boligrafo: PUTADA_PLUMA,
        "sin borrado": PUTADA_PLUMA,
        "bloqueo borrado": PUTADA_PLUMA,
        "bloqueo de borrado": PUTADA_PLUMA,
        "borrado bloqueado": PUTADA_PLUMA,
        "backspace bloqueado": PUTADA_PLUMA
    };
    return mapa[valor] || mapa[sinVs16] || mapaTexto[valorTexto] || valor;
}

function aplicarPutadaEnEspectador(putada, player, opciones = {}) {
    const clave = normalizarPutada(putada);
    activarVisualPutadaEspectador(player, clave, opciones);
    const handler = PUTADAS[clave];
    if (typeof handler === "function") {
        handler(player, opciones);
        return true;
    }
    console.warn("[Espectador] Desventaja desconocida:", putada, "->", clave);
    return false;
}

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
        explicacion.innerHTML = traducirDescripcionModoEspectador("palabras bonus", "GANA QUIEN ESCRIBE MAS PALABRAS");
        palabra1.innerHTML = traducirTituloModoEspectador("palabras bonus", "NIVEL PALABRAS BENDITAS");
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
        palabra1.innerHTML = traducirTituloModoEspectador("letra prohibida", "NIVEL LETRA MALDITA");
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
        palabra1.innerHTML = traducirTituloModoEspectador("letra bendita", "NIVEL LETRA BENDITA");
        actualizarDefinicionConVisibilidad(definicion2, "", false);
        definicion2.style.maxWidth = "100%";
        actualizarDefinicionConVisibilidad(definicion3, "", false);
        definicion3.style.maxWidth = "100%";
        activarEfectoCambioLetraEspectador("bendita");
    },

    'psicodï¿½fÂ©lico': function (data, socket, player) {
        //explicacion.innerHTML = "MODO PSICODÃ¯Â¿Â½?LICO";
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
        explicacion.innerHTML = traducirDescripcionModoEspectador("palabras prohibidas", "EVITA LAS PALABRAS MALDITAS");
        palabra1.innerHTML = traducirTituloModoEspectador("palabras prohibidas", "NIVEL PALABRAS MALDITAS");
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
        explicacion.innerHTML = traducirDescripcionModoEspectador("tertulia", "DIALOGA CON TUS MUSAS");
        palabra1.innerHTML = traducirTituloModoEspectador("tertulia", "NIVEL TERTULIA");

    },

    'frase final': function (socket) {
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true)
        reproducirSonido("../../game/audio/FX/15. FRASE FINAL.mp3")
        aplicarEstiloPalabrasModoLetrasEspectador("frase-final");
        setBarraNivelClase("frase-final");
        //activar_socket_feedback();
        explicacion.style.color = "orange";
        explicacion.innerHTML = traducirDescripcionModoEspectador("frase final", "ULTIMA RONDA");
        palabra1.innerHTML = traducirTituloModoEspectador("frase final", "NIVEL FRASE FINAL");
        actualizarPalabraConVisibilidad(palabra2, "&laquo;" + frase_final_j1 + "&raquo;");
        actualizarDefinicionConVisibilidad(definicion2, tJuego2P("mode.goal.last_one", {}, "Â¡Esta es la ultima!"), false);
        actualizarDefinicionConVisibilidad(definicion3, tJuego2P("mode.goal.last_one", {}, "Â¡Esta es la ultima!"), false);
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

    "psicodï¿½fÂ©lico": function (data, player) {
        if(player == 1){
            activado_psico1 = false;
        }
        else if(player == 2){
            activado_psico2 = false;
        }

        if(activado_psico1 == false && activado_psico2 == false){
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodï¿½fÂ©lico, se vuelve a limpiar.
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
    const estadoVotacionPendiente = estado_votacion_ventaja_espectador;
    const limpieza = LIMPIEZAS[nombreModo] || LIMPIEZAS[""];
    if (typeof limpieza === "function") {
        limpieza(data);
    }
    if (estadoVotacionPendiente && !estado_votacion_ventaja_espectador) {
        estado_votacion_ventaja_espectador = estadoVotacionPendiente;
    }
}

function ejecutarModo(nombreModo, data) {
    const activador = MODOS[nombreModo] || MODOS[""];
    if (typeof activador === "function") {
        activador(data);
    }
}

function obtenerHandlerPsicodelicoEspectador(registro) {
    if (!registro) return null;
    const clave = Object.keys(registro).find(key => key.includes("psicod"));
    return clave ? registro[clave] : null;
}

function ejecutarModoPsicodelicoEspectador(data, socketRef, playerId) {
    const activador = obtenerHandlerPsicodelicoEspectador(MODOS);
    if (typeof activador === "function") {
        activador(data, socketRef, playerId);
    }
}

function limpiarModoPsicodelicoEspectador(data, playerId) {
    const limpieza = obtenerHandlerPsicodelicoEspectador(LIMPIEZAS);
    if (typeof limpieza === "function") {
        limpieza(data, playerId);
    }
}
