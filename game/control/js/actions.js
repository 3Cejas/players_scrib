let countInterval;
let countInterval1;
let listener_cuenta_atras;
let time_minutes; // Value in minutes
let time_seconds; // Value in seconds
let count = "00:00";
let count1 = "00:00";
let secondsRemaining = null;
let secondsRemaining1 = null;
let secondsPassed;
let impro_estado = false;
let fin_j1 = false;
let fin_j2 = false;
let terminado = false;
let terminado1 = false;
let juego_iniciado = false;
let pausado = false;
let intervalId;  // Guarda el ID del setInterval para poder limpiarlo luego
let TimeoutTiempoMuerto;  // Guarda el ID del setInterval para poder limpiarlo luego
let vista_calentamiento = false;
let vista_espectador_modo = "tutorial";
let vista_principal_control = "tutorial";
let puntuacion_slide_step_control = 0;
let puntuacion_reveal_phase_control = 0;
let jurado_slide_step_control = 0;
let estado_puntuacion_final_control = null;
let estado_resultado_jurado_control = null;
let puntuacion_final_captura_solicitada = false;
let timeout_feedback_puntuacion_control = null;
let escala_ui_espectador_control = 1;
let temporizador_gigante_activo = false;
let regalo_musas_enviado = false;
let banderas_musas_activas = false;
let borrar_texto_en_inicio_activo = false;
let modo_control_activo = "";
let segundos_modo_control = 0;
let revision_temporizadores_control = 0;
let revision_creditos_emit_control = 0;
const count_seq_control = { 1: 0, 2: 0 };
const tiempo_seq_control = { 1: 0, 2: 0 };
const ESCALA_UI_ESPECTADOR_CONTROL_MIN = 0.82;
const ESCALA_UI_ESPECTADOR_CONTROL_MAX = 1.28;
const EVENTO_CAMBIO_IDIOMA_UI = "scrib:language-changed";
const BANDERAS_IDIOMA_CONTROL = {
    es: "\uD83C\uDDEA\uD83C\uDDF8",
    en: "\uD83C\uDDEC\uD83C\uDDE7",
    fr: "\uD83C\uDDEB\uD83C\uDDF7"
};
const PARAMETROS_CONTROL_PERSISTENTES = [
    "duracion_minutos",
    "duracion_segundos",
    "tiempo_cambio_letra",
    "tiempo_cambio_palabras",
    "limite_tiempo_inspiracion",
    "escala_espectador"
];
let aplicando_estado_control_persistente = false;
let timeout_emision_estado_control_persistente = null;
let persistencia_parametros_control_inicializada = false;

function formatearIdiomaControl(option) {
    const valor = String(option && option.value ? option.value : "").trim();
    const codigo = valor.toLowerCase();
    const etiqueta = String(valor || (option && option.textContent) || "").trim().toUpperCase();
    const bandera = BANDERAS_IDIOMA_CONTROL[codigo] || "";
    return `${bandera} ${etiqueta}`.trim();
}

function invalidarTemporizadoresPartidaControl() {
    revision_temporizadores_control += 1;
    clearTimeout(listener_cuenta_atras);
    clearInterval(countInterval);
    clearInterval(countInterval1);
    clearTimeout(TimeoutTiempoMuerto);
    listener_cuenta_atras = null;
    countInterval = null;
    countInterval1 = null;
    TimeoutTiempoMuerto = null;
    return revision_temporizadores_control;
}

function obtenerRevisionTemporizadoresControl() {
    return revision_temporizadores_control;
}

function esRevisionTemporizadoresControlActiva(revision) {
    return revision === revision_temporizadores_control;
}

function invalidarEmisionCreditosControl({ emitirPendiente = false } = {}) {
    revision_creditos_emit_control += 1;
    const habiaPendiente = Boolean(creditos_emit_timeout);
    if (creditos_emit_timeout) {
        clearTimeout(creditos_emit_timeout);
        creditos_emit_timeout = null;
    }
    if (
        emitirPendiente
        && habiaPendiente
        && typeof socket !== "undefined"
        && socket
        && typeof socket.emit === "function"
    ) {
        const creditos = obtenerCreditosDesdePanelControl();
        creditos_estado_control = { ...creditos };
        socket.emit("creditos_actualizar", { creditos });
    }
    return revision_creditos_emit_control;
}

function obtenerRevisionEmisionCreditosControl() {
    return revision_creditos_emit_control;
}

function reiniciarCountSeqControl() {
    count_seq_control[1] = 0;
    count_seq_control[2] = 0;
}

function reiniciarTiempoSeqControl() {
    tiempo_seq_control[1] = 0;
    tiempo_seq_control[2] = 0;
}

if (typeof window !== "undefined") {
    window.reiniciarCountSeqControl2P = reiniciarCountSeqControl;
    window.reiniciarTiempoSeqControl2P = reiniciarTiempoSeqControl;
}

function obtenerModoSeqControlActual() {
    if (window && typeof window.obtenerModoSyncSeqControl2P === "function") {
        return Number(window.obtenerModoSyncSeqControl2P()) || 0;
    }
    return 0;
}

function sincronizarTiempoSeqControl(playerId, seq) {
    const id = Number(playerId) === 2 ? 2 : 1;
    const valor = Number(seq);
    if (!Number.isFinite(valor)) {
        return tiempo_seq_control[id] || 0;
    }
    tiempo_seq_control[id] = Math.max(Number(tiempo_seq_control[id]) || 0, Math.max(0, Math.trunc(valor)));
    return tiempo_seq_control[id];
}

function obtenerTiempoSeqControlActual(playerId) {
    const id = Number(playerId) === 2 ? 2 : 1;
    return Number(tiempo_seq_control[id]) || 0;
}

function emitirCountControl(payload = {}) {
    if (!socket || !payload) return;
    const playerId = Number(payload.player) === 2 ? 2 : 1;
    count_seq_control[playerId] = (Number(count_seq_control[playerId]) || 0) + 1;
    socket.emit('count', {
        ...payload,
        player: playerId,
        count_seq: count_seq_control[playerId],
        modo_seq: obtenerModoSeqControlActual(),
        tiempo_seq: obtenerTiempoSeqControlActual(playerId)
    });
}

if (typeof window !== "undefined") {
    window.emitirCountControl = emitirCountControl;
    window.sincronizarTiempoSeqControl2P = sincronizarTiempoSeqControl;
    window.obtenerTiempoSyncSeqControl2P = obtenerTiempoSeqControlActual;
}
const tJuego2PControl = (clave, variables = {}, fallback = "") => (
    (window && typeof window.scribT2P === "function")
        ? window.scribT2P(clave, variables, fallback)
        : (fallback || clave)
);
const traducirModoControl = (modo) => (
    (window && typeof window.scribTranslateModeName2P === "function")
        ? window.scribTranslateModeName2P(modo)
        : String(modo || "").toUpperCase()
);
const traducirSolicitudCalentamientoControl = (tipo, opciones = {}) => (
    (window && typeof window.scribTranslateWarmupRequest2P === "function")
        ? window.scribTranslateWarmupRequest2P(tipo, opciones)
        : String(tipo || "")
);
const CLASE_CURSOR_PLUMA_CONTROL = "cursor-control-pluma-activo";
const SOPORTA_CURSOR_PLUMA_CONTROL = (() => {
    if (typeof window.matchMedia !== "function") return true;
    return window.matchMedia("(pointer: fine)").matches;
})();
let cursor_pluma_control = null;
let cursor_pluma_control_inicializado = false;
let timeout_cursor_pluma_control_press = null;
let selector_idioma_control_inicializado = false;
let numeros_linea_control_inicializados = false;
let logs_control_inicializados = false;
let reloj_control_interval = null;
const logs_control_buffer = [];
const LOGS_CONTROL_MAX = 120;
const DURACION_ANIMACION_MENU_CONTROL_MS = 220;
const DURACION_ANIMACION_DROPDOWN_CONTROL_MS = 190;
const DURACION_ANIMACION_IDIOMA_CONTROL_MS = 360;

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "flex";
const DURACION_ANIMACION_ENTRADA_VIDA_MS = 880;
const animacionesEntradaBarraVida = new WeakMap();
const animacionEntradaVidaPendiente = { 1: false, 2: false };
const COLOR_BARRA_VIDA_CONTROL = {
    tiempo: "#46f0ff",
    tiempo1: "#ff5f67"
};

function obtenerTextoModoControl(modo = modo_control_activo) {
    const modoNormalizado = typeof modo === "string" ? modo.trim() : "";
    return modoNormalizado
        ? traducirModoControl(modoNormalizado)
        : tJuego2PControl("control.mode.none", {}, "Ninguno");
}

function formatearSegundosControl(segundos = segundos_modo_control) {
    const total = Number.isFinite(Number(segundos)) ? Math.max(0, Math.round(Number(segundos))) : 0;
    return tJuego2PControl("control.time.seconds_count", { count: total }, `${total} segundos`);
}

function normalizarModoNivelControl(modo) {
    return typeof modo === "string" ? modo.trim().toLowerCase() : "";
}

function actualizarNivelActivoControl(modo = modo_control_activo) {
    const modoNormalizado = normalizarModoNivelControl(modo);
    document.querySelectorAll(".level-sequence [data-mode]").forEach((chip) => {
        const activo = chip.dataset.mode === modoNormalizado;
        chip.classList.toggle("is-active", activo);
        if (activo) {
            chip.setAttribute("aria-current", "true");
        } else {
            chip.removeAttribute("aria-current");
        }
    });
}
window.actualizarNivelActivoControl = actualizarNivelActivoControl;

function actualizarCabeceraModoControl({
    modo = modo_control_activo,
    segundos = segundos_modo_control,
    duracion = null,
    restante = null
} = {}) {
    modo_control_activo = typeof modo === "string" ? modo.trim() : "";
    const tieneRestanteExplicito = restante !== null && restante !== undefined;
    const tieneDuracionExplicita = duracion !== null && duracion !== undefined;
    const duracionNormalizada = tieneDuracionExplicita ? obtenerDuracionModoControl(duracion) : 0;
    const restanteNormalizado = (tieneRestanteExplicito || tieneDuracionExplicita)
        ? calcularTiempoRestanteModoControl({
            segundos,
            duracion: duracionNormalizada,
            restante
        })
        : normalizarSegundosModoControl(segundos);
    segundos_modo_control = restanteNormalizado;
    if (typeof tiempo_restante_modo_actual_control !== "undefined") {
        tiempo_restante_modo_actual_control = restanteNormalizado;
    }
    if (typeof duracion_modo_actual_control !== "undefined" && tieneDuracionExplicita) {
        duracion_modo_actual_control = duracionNormalizada;
    }
    actualizarNivelActivoControl(modo_control_activo);

    const display = document.getElementById("display_modo");
    const tiempo = document.getElementById("tiempo_modos_secs");
    if (display) {
        display.textContent = obtenerTextoModoControl(modo_control_activo);
        display.style.color = modo_control_activo && typeof COLORES_MODOS !== "undefined" && COLORES_MODOS[modo_control_activo]
            ? COLORES_MODOS[modo_control_activo]
            : "white";
    }
    if (tiempo) {
        tiempo.textContent = formatearSegundosControl(restanteNormalizado);
    }
}
window.actualizarCabeceraModoControl = actualizarCabeceraModoControl;

const INTERVALO_TESTIGOS_DESVENTAJA_CONTROL_MS = 500;
const estado_testigos_desventaja_control = { 1: null, 2: null };
let estado_testigo_votacion_desventaja_control = null;
let intervalo_testigos_desventaja_control = null;
let intervalo_cuenta_atras_modo_control = null;
let fin_cuenta_atras_modo_control_ts = 0;
let duracion_cuenta_atras_modo_control = 0;
let modo_cuenta_atras_modo_control = "";

function normalizarEquipoTestigoControl(valor) {
    if (valor === 1 || valor === 2) return valor;
    const texto = String(valor || "").trim().toLowerCase();
    if (texto === "1" || texto === "j1" || texto === "azul" || texto === "blue") return 1;
    if (texto === "2" || texto === "j2" || texto === "rojo" || texto === "red") return 2;
    return null;
}

function crearPayloadTestigoDesventajaControl(payload = {}, playerFallback = null) {
    const data = payload && typeof payload === "object"
        ? { ...payload }
        : { putada: String(payload || "") };
    const player = normalizarEquipoTestigoControl(
        playerFallback
        || data.player
        || data.target
        || data.perdedor
        || data.equipo
    );
    if (!player) return null;
    return {
        ...data,
        player,
        _recibido_en_ts: Date.now()
    };
}

function obtenerMsTestigoControl(payload = {}) {
    if (!payload || typeof payload !== "object") return 0;
    const terminaEnTs = Number(payload.termina_en_ts || payload.terminaEnTs || 0);
    if (Number.isFinite(terminaEnTs) && terminaEnTs > 0) {
        return Math.max(0, Math.trunc(terminaEnTs - Date.now()));
    }
    const restante = Number(
        payload.tiempo_restante_ms
        ?? payload.restante_ms
        ?? payload.restanteMs
        ?? payload.duracion_ms
        ?? payload.duracionMs
        ?? 0
    );
    if (!Number.isFinite(restante) || restante <= 0) return 0;
    if (payload.pausada === true) {
        return Math.max(0, Math.trunc(restante));
    }
    const recibidoEnTs = Number(payload._recibido_en_ts || payload.recibido_en_ts || payload.recibidoEnTs || payload.now || 0);
    const baseTs = Number.isFinite(recibidoEnTs) && recibidoEnTs > 0 ? recibidoEnTs : Date.now();
    return Math.max(0, Math.trunc(restante - (Date.now() - baseTs)));
}

function formatearTiempoTestigoControl(ms) {
    const totalSegundos = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos}:${paddedFormat(segundos)}`;
}

function normalizarSegundosModoControl(valor, fallback = 0) {
    if (valor !== null && valor !== undefined && valor !== "") {
        const numero = Number(valor);
        if (Number.isFinite(numero)) {
            return Math.max(0, Math.trunc(numero));
        }
    }
    const fallbackNumero = Number(fallback);
    return Number.isFinite(fallbackNumero) ? Math.trunc(fallbackNumero) : 0;
}

function obtenerDuracionModoControl(valor = null) {
    const directa = normalizarSegundosModoControl(valor, -1);
    if (directa >= 0) return directa;
    if (typeof TIEMPO_CAMBIO_MODOS !== "undefined" && Number(TIEMPO_CAMBIO_MODOS) > 0) {
        return normalizarSegundosModoControl(TIEMPO_CAMBIO_MODOS);
    }
    if (typeof DURACION_TIEMPO_MODOS !== "undefined" && Number(DURACION_TIEMPO_MODOS) > 0) {
        return normalizarSegundosModoControl(DURACION_TIEMPO_MODOS);
    }
    return 0;
}

function calcularTiempoRestanteModoControl({ segundos = 0, duracion = null, restante = null } = {}) {
    const restanteDirecto = normalizarSegundosModoControl(restante, -1);
    if (restanteDirecto >= 0) return restanteDirecto;
    const duracionNormalizada = obtenerDuracionModoControl(duracion);
    const transcurridos = normalizarSegundosModoControl(segundos);
    return duracionNormalizada > 0
        ? Math.max(0, duracionNormalizada - transcurridos)
        : transcurridos;
}

function detenerCuentaAtrasModoControl() {
    if (intervalo_cuenta_atras_modo_control) {
        clearInterval(intervalo_cuenta_atras_modo_control);
        intervalo_cuenta_atras_modo_control = null;
    }
    fin_cuenta_atras_modo_control_ts = 0;
    duracion_cuenta_atras_modo_control = 0;
    modo_cuenta_atras_modo_control = "";
}
window.detenerCuentaAtrasModoControl = detenerCuentaAtrasModoControl;

function refrescarCuentaAtrasModoControl() {
    if (!fin_cuenta_atras_modo_control_ts) {
        detenerCuentaAtrasModoControl();
        return;
    }
    const restante = Math.max(0, Math.ceil((fin_cuenta_atras_modo_control_ts - Date.now()) / 1000));
    actualizarCabeceraModoControl({
        modo: modo_cuenta_atras_modo_control || modo_control_activo,
        duracion: duracion_cuenta_atras_modo_control,
        restante
    });
    if (restante <= 0) {
        detenerCuentaAtrasModoControl();
    }
}

function iniciarCuentaAtrasModoControl({ modo = modo_control_activo, duracion = null, restante = null } = {}) {
    const duracionNormalizada = obtenerDuracionModoControl(duracion);
    const restanteNormalizado = calcularTiempoRestanteModoControl({
        duracion: duracionNormalizada,
        restante: restante ?? duracionNormalizada
    });
    detenerCuentaAtrasModoControl();
    modo_cuenta_atras_modo_control = typeof modo === "string" ? modo.trim() : "";
    duracion_cuenta_atras_modo_control = duracionNormalizada;
    fin_cuenta_atras_modo_control_ts = Date.now() + (restanteNormalizado * 1000);
    refrescarCuentaAtrasModoControl();
    if (restanteNormalizado > 0) {
        intervalo_cuenta_atras_modo_control = setInterval(refrescarCuentaAtrasModoControl, 250);
    }
}
window.iniciarCuentaAtrasModoControl = iniciarCuentaAtrasModoControl;

function obtenerEmojiDesventajaControl(payload = {}) {
    const valor = String(
        payload.putada
        || payload.seleccion
        || payload.emoji
        || ""
    ).trim();
    if (!valor) return "\u26A0\uFE0F";
    if (window && window.ScribDisadvantages && typeof window.ScribDisadvantages.normalizar === "function") {
        return window.ScribDisadvantages.normalizar(valor) || valor;
    }
    return valor;
}

function pintarTestigoDesventajaControl(playerSolicitado) {
    const player = normalizarEquipoTestigoControl(playerSolicitado);
    if (!player) return false;
    const testigo = document.getElementById(`control_desventaja_activa_j${player}`);
    const iconoEl = document.getElementById(`control_desventaja_activa_icon_j${player}`);
    const tiempoEl = document.getElementById(`control_desventaja_activa_time_j${player}`);
    if (!testigo) return false;
    const payload = estado_testigos_desventaja_control[player];
    const restanteMs = obtenerMsTestigoControl(payload);
    const activo = Boolean(payload && player && restanteMs > 0);
    if (!activo) {
        estado_testigos_desventaja_control[player] = null;
    }
    testigo.dataset.active = activo ? "1" : "0";
    testigo.dataset.team = String(player);
    if (iconoEl) {
        iconoEl.textContent = activo ? obtenerEmojiDesventajaControl(payload) : "-";
    }
    if (tiempoEl) {
        tiempoEl.textContent = activo ? formatearTiempoTestigoControl(restanteMs) : "--";
    }
    const equipo = player === 2 ? "rojo" : "azul";
    const detalle = payload && (payload.putada || payload.seleccion) ? ` - ${payload.putada || payload.seleccion}` : "";
    testigo.title = activo
        ? `Desventaja ${equipo}${detalle}: ${formatearTiempoTestigoControl(restanteMs)}`
        : "Sin desventaja activa";
    return activo;
}

function pintarTestigoVotacionDesventajaControl(payload) {
    const testigo = document.getElementById("control_votacion_desventaja");
    const tiempoEl = document.getElementById("control_votacion_desventaja_time");
    if (!testigo) return false;
    const equipo = normalizarEquipoTestigoControl(payload && payload.equipo);
    const restanteMs = obtenerMsTestigoControl(payload);
    const activo = Boolean(payload && payload.activa && equipo && restanteMs > 0);
    if (!activo) {
        estado_testigo_votacion_desventaja_control = null;
    }
    testigo.dataset.active = activo ? "1" : "0";
    testigo.dataset.team = activo ? String(equipo) : "";
    const icono = testigo.querySelector(".level-status-witness__icon");
    if (icono) {
        icono.textContent = "\u{1F5F3}\uFE0F";
    }
    if (tiempoEl) {
        tiempoEl.textContent = activo ? formatearTiempoTestigoControl(restanteMs) : "--";
    }
    testigo.title = activo
        ? `Votacion de desventaja ${equipo === 2 ? "roja" : "azul"}: ${formatearTiempoTestigoControl(restanteMs)}`
        : "Sin votacion de desventaja activa";
    return activo;
}

function actualizarTestigosDesventajaControl() {
    // Renderizar siempre ambos equipos. Array#some cortocircuitaba al hallar
    // una desventaja azul y dejaba sin refrescar el indicador rojo.
    const activoDesventaja = [1, 2]
        .map((player) => pintarTestigoDesventajaControl(player))
        .some(Boolean);
    const activoVoto = pintarTestigoVotacionDesventajaControl(estado_testigo_votacion_desventaja_control);
    const hayActivos = activoDesventaja || activoVoto;
    if (hayActivos && !intervalo_testigos_desventaja_control) {
        intervalo_testigos_desventaja_control = setInterval(
            actualizarTestigosDesventajaControl,
            INTERVALO_TESTIGOS_DESVENTAJA_CONTROL_MS
        );
    } else if (!hayActivos && intervalo_testigos_desventaja_control) {
        clearInterval(intervalo_testigos_desventaja_control);
        intervalo_testigos_desventaja_control = null;
    }
}

function sincronizarDesventajaActivaControl(payload = {}, opciones = {}) {
    const data = crearPayloadTestigoDesventajaControl(payload, opciones.player);
    if (!data) return;
    if (data.activa === false || obtenerMsTestigoControl(data) <= 0) {
        estado_testigos_desventaja_control[data.player] = null;
    } else {
        estado_testigos_desventaja_control[data.player] = data;
    }
    actualizarTestigosDesventajaControl();
}
window.sincronizarDesventajaActivaControl = sincronizarDesventajaActivaControl;

function sincronizarVotacionDesventajaControl(payload = {}) {
    const data = payload && typeof payload === "object" ? { ...payload } : {};
    const equipo = normalizarEquipoTestigoControl(data.equipo);
    if (!data.activa || !equipo) {
        estado_testigo_votacion_desventaja_control = null;
    } else {
        estado_testigo_votacion_desventaja_control = {
            ...data,
            equipo: `j${equipo}`,
            _recibido_en_ts: Date.now()
        };
        if (obtenerMsTestigoControl(estado_testigo_votacion_desventaja_control) <= 0) {
            estado_testigo_votacion_desventaja_control = null;
        }
    }
    actualizarTestigosDesventajaControl();
}
window.sincronizarVotacionDesventajaControl = sincronizarVotacionDesventajaControl;

const INTERVALO_TESTIGOS_PALABRAS_MUSAS_CONTROL_MS = 500;
const estado_testigos_palabras_musas_control = { 1: null, 2: null };
let intervalo_testigos_palabras_musas_control = null;

function obtenerMsTestigoPalabraMusaControl(payload = {}) {
    if (!payload || typeof payload !== "object") return 0;
    const restante = Number(
        payload.tiempo_restante_ms
        ?? payload.restante_ms
        ?? payload.restanteMs
        ?? 0
    );
    if (Number.isFinite(restante) && restante > 0) {
        const recibidoEnTs = Number(payload._recibido_en_ts || payload.recibido_en_ts || payload.now || 0);
        const baseTs = Number.isFinite(recibidoEnTs) && recibidoEnTs > 0 ? recibidoEnTs : Date.now();
        return Math.max(0, Math.trunc(restante - (Date.now() - baseTs)));
    }
    const caducaEnTs = Number(payload.caduca_en_ts || payload.caducaEnTs || 0);
    if (Number.isFinite(caducaEnTs) && caducaEnTs > 0) {
        return Math.max(0, Math.trunc(caducaEnTs - Date.now()));
    }
    return 0;
}

function formatearSegundosInspiracionMusaControl(restanteMs) {
    const segundos = Math.max(0, Math.ceil((Number(restanteMs) || 0) / 1000));
    return segundos > 0 ? `${segundos}s` : "--";
}

function obtenerFirmaInspiracionMusaControl(payload = {}) {
    if (window.ScribInspiration && typeof window.ScribInspiration.normalizarFirmaMusa === "function") {
        return window.ScribInspiration.normalizarFirmaMusa(payload, {
            fallback: false,
            maxAutores: 6,
            maxNombre: 24,
            maxVisibles: 2
        });
    }
    const nombre = String(payload && (payload.musa_nombre ?? payload.musa) || "")
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 24)
        .toUpperCase();
    return { autores: nombre ? [nombre] : [], texto: nombre, completo: nombre };
}

function normalizarEstadoPalabraMusaControl(payload = {}, playerFallback = null) {
    const data = payload && typeof payload === "object" ? { ...payload } : {};
    const player = normalizarEquipoTestigoControl(playerFallback || data.player || data.target_player || data.target);
    if (!player) return null;
    const cola = Math.max(0, Math.trunc(Number(
        data.cola
        ?? data.cola_palabras_musas
        ?? data.queue_count
        ?? data.queue
        ?? 0
    ) || 0));
    return {
        ...data,
        player,
        cola,
        cola_palabras_musas: cola,
        activa: Boolean(data.activa),
        _recibido_en_ts: Date.now()
    };
}

function pintarTestigoPalabraMusaControl(player) {
    const id = Number(player) === 2 ? 2 : 1;
    const testigo = document.getElementById(`control_palabra_musa_j${id}`);
    const tiempoEl = document.getElementById(`control_palabra_musa_j${id}_time`);
    const colaEl = document.getElementById(`control_palabra_musa_j${id}_queue`);
    const palabraEl = document.getElementById(`control_palabra_musa_j${id}_word`);
    const autorEl = document.getElementById(`control_palabra_musa_j${id}_author`);
    if (!testigo) return false;
    const payload = estado_testigos_palabras_musas_control[id];
    const restanteMs = obtenerMsTestigoPalabraMusaControl(payload);
    const cola = Math.max(0, Math.trunc(Number(payload && (payload.cola ?? payload.cola_palabras_musas)) || 0));
    const activo = Boolean(payload && payload.activa && restanteMs > 0);
    if (!activo && payload && payload.activa) {
        estado_testigos_palabras_musas_control[id] = {
            ...payload,
            activa: false,
            tiempo_restante_ms: 0,
            caduca_en_ts: 0
        };
    }
    testigo.dataset.active = activo ? "1" : "0";
    testigo.dataset.queued = cola > 0 ? "1" : "0";
    testigo.dataset.team = String(id);
    if (tiempoEl) {
        tiempoEl.textContent = activo ? formatearSegundosInspiracionMusaControl(restanteMs) : "--";
    }
    if (colaEl) {
        colaEl.textContent = String(cola);
    }
    const palabraTexto = payload && payload.palabra ? String(payload.palabra) : "";
    if (palabraEl) {
        palabraEl.textContent = activo && palabraTexto ? palabraTexto : "-";
    }
    const firma = obtenerFirmaInspiracionMusaControl(payload || {});
    const mostrarAutor = Boolean(activo && firma.texto);
    if (autorEl) {
        autorEl.textContent = mostrarAutor ? `\u2726 ${firma.texto}` : "";
        autorEl.hidden = !mostrarAutor;
        autorEl.title = mostrarAutor ? `Inspiraci\u00f3n de ${firma.completo}` : "";
    }
    const equipo = id === 2 ? "rojo" : "azul";
    const palabra = palabraTexto ? ` - ${palabraTexto}` : "";
    const autora = mostrarAutor ? `, enviada por ${firma.completo}` : "";
    testigo.title = activo
        ? `Palabra de musas para escritxr ${equipo}${palabra}${autora}: inspiracion x5. Cola: ${cola}`
        : `Sin palabra de musas activa para escritxr ${equipo}. Cola: ${cola}`;
    return activo;
}

function actualizarTestigosPalabrasMusasControl() {
    const activoJ1 = pintarTestigoPalabraMusaControl(1);
    const activoJ2 = pintarTestigoPalabraMusaControl(2);
    const hayActivos = activoJ1 || activoJ2;
    if (hayActivos && !intervalo_testigos_palabras_musas_control) {
        intervalo_testigos_palabras_musas_control = setInterval(
            actualizarTestigosPalabrasMusasControl,
            INTERVALO_TESTIGOS_PALABRAS_MUSAS_CONTROL_MS
        );
    } else if (!hayActivos && intervalo_testigos_palabras_musas_control) {
        clearInterval(intervalo_testigos_palabras_musas_control);
        intervalo_testigos_palabras_musas_control = null;
    }
}

function sincronizarEstadoPalabrasMusasControl(payload = {}) {
    const data = payload && typeof payload === "object" ? payload : {};
    const players = data.players && typeof data.players === "object" ? data.players : data;
    [1, 2].forEach((player) => {
        const raw = players[player] || players[`j${player}`] || players[String(player)] || {};
        const normalizado = normalizarEstadoPalabraMusaControl(raw, player);
        if (normalizado) {
            estado_testigos_palabras_musas_control[player] = normalizado;
        }
    });
    actualizarTestigosPalabrasMusasControl();
}
window.sincronizarEstadoPalabrasMusasControl = sincronizarEstadoPalabrasMusasControl;

function limpiarTestigosPalabrasMusasControl() {
    estado_testigos_palabras_musas_control[1] = null;
    estado_testigos_palabras_musas_control[2] = null;
    actualizarTestigosPalabrasMusasControl();
}
window.limpiarTestigosPalabrasMusasControl = limpiarTestigosPalabrasMusasControl;

function limpiarTestigosDesventajaControl() {
    estado_testigos_desventaja_control[1] = null;
    estado_testigos_desventaja_control[2] = null;
    estado_testigo_votacion_desventaja_control = null;
    actualizarTestigosDesventajaControl();
}
window.limpiarTestigosDesventajaControl = limpiarTestigosDesventajaControl;

function pausarTestigosDesventajaControl() {
    [1, 2].forEach((player) => {
        const payload = estado_testigos_desventaja_control[player];
        const restanteMs = obtenerMsTestigoControl(payload);
        if (!payload || restanteMs <= 0) return;
        estado_testigos_desventaja_control[player] = {
            ...payload,
            pausada: true,
            tiempo_restante_ms: restanteMs,
            restante_ms: restanteMs,
            termina_en_ts: 0,
            _recibido_en_ts: Date.now()
        };
    });
    actualizarTestigosDesventajaControl();
}
window.pausarTestigosDesventajaControl = pausarTestigosDesventajaControl;

function reanudarTestigosDesventajaControl() {
    [1, 2].forEach((player) => {
        const payload = estado_testigos_desventaja_control[player];
        const restanteMs = obtenerMsTestigoControl(payload);
        if (!payload || restanteMs <= 0) return;
        estado_testigos_desventaja_control[player] = {
            ...payload,
            pausada: false,
            tiempo_restante_ms: restanteMs,
            restante_ms: restanteMs,
            termina_en_ts: Date.now() + restanteMs,
            _recibido_en_ts: Date.now()
        };
    });
    actualizarTestigosDesventajaControl();
}
window.reanudarTestigosDesventajaControl = reanudarTestigosDesventajaControl;

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

function ocultarCursorPlumaControl() {
    if (!cursor_pluma_control) return;
    cursor_pluma_control.classList.remove("activa");
}

function moverCursorPlumaControl(clientX, clientY) {
    if (!cursor_pluma_control) return;
    cursor_pluma_control.style.left = `${clientX}px`;
    cursor_pluma_control.style.top = `${clientY}px`;
    cursor_pluma_control.classList.add("activa");
    cursor_pluma_control.classList.remove("is-hidden");
}

function pulsarCursorPlumaControl() {
    if (!cursor_pluma_control) return;
    cursor_pluma_control.classList.add("is-pressing");
    clearTimeout(timeout_cursor_pluma_control_press);
    timeout_cursor_pluma_control_press = setTimeout(() => {
        timeout_cursor_pluma_control_press = null;
        if (!cursor_pluma_control) return;
        cursor_pluma_control.classList.remove("is-pressing");
    }, 140);
}

function inicializarCursorPlumaControl() {
    if (cursor_pluma_control_inicializado) return;
    cursor_pluma_control_inicializado = true;
    if (!SOPORTA_CURSOR_PLUMA_CONTROL || !document.body) return;

    let nodo = document.getElementById("control_cursor_pluma");
    if (!nodo) {
        nodo = document.createElement("div");
        nodo.id = "control_cursor_pluma";
        nodo.className = "control-cursor-pluma";
        nodo.setAttribute("aria-hidden", "true");
        document.body.appendChild(nodo);
    }
    cursor_pluma_control = nodo;
    document.body.classList.add(CLASE_CURSOR_PLUMA_CONTROL);

    window.addEventListener("mousemove", (evento) => {
        if (!document.body || !document.body.classList.contains(CLASE_CURSOR_PLUMA_CONTROL)) return;
        if (!evento || typeof evento.clientX !== "number" || typeof evento.clientY !== "number") return;
        moverCursorPlumaControl(evento.clientX, evento.clientY);
    }, { passive: true });
    window.addEventListener("pointerdown", (evento) => {
        if (!document.body || !document.body.classList.contains(CLASE_CURSOR_PLUMA_CONTROL)) return;
        if (!evento || typeof evento.clientX !== "number" || typeof evento.clientY !== "number") return;
        moverCursorPlumaControl(evento.clientX, evento.clientY);
        pulsarCursorPlumaControl();
    }, { passive: true });
    window.addEventListener("blur", ocultarCursorPlumaControl);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            ocultarCursorPlumaControl();
        }
    });
    document.addEventListener("mouseleave", ocultarCursorPlumaControl);
}

function inicializarSelectorIdiomaControl() {
    if (selector_idioma_control_inicializado) return;
    const contenedor = document.querySelector(".control-language");
    const selector = document.getElementById("selector_idioma_control");
    if (!contenedor || !selector) return;

    selector_idioma_control_inicializado = true;
    contenedor.removeAttribute("for");
    contenedor.setAttribute("role", "group");
    selector.tabIndex = -1;
    selector.setAttribute("aria-hidden", "true");

    const interfaz = document.createElement("div");
    interfaz.className = "control-language-ui";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "control-language-button";
    boton.setAttribute("aria-haspopup", "listbox");
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-labelledby", "selector_idioma_label");

    const textoActual = document.createElement("span");
    textoActual.className = "control-language-current";
    boton.appendChild(textoActual);

    const lista = document.createElement("div");
    lista.className = "control-language-list";
    lista.setAttribute("role", "listbox");
    lista.setAttribute("aria-label", selector.getAttribute("aria-label") || "Idioma");

    interfaz.appendChild(boton);
    interfaz.appendChild(lista);
    contenedor.appendChild(interfaz);
    let ultimoValorIdiomaSincronizado = selector.value;

    const animarCambioIdioma = () => {
        if (timeout_animacion_idioma_control) {
            clearTimeout(timeout_animacion_idioma_control);
            timeout_animacion_idioma_control = null;
        }
        contenedor.classList.remove("is-changing");
        void contenedor.offsetWidth;
        contenedor.classList.add("is-changing");
        timeout_animacion_idioma_control = setTimeout(() => {
            contenedor.classList.remove("is-changing");
            timeout_animacion_idioma_control = null;
        }, DURACION_ANIMACION_IDIOMA_CONTROL_MS);
    };

    const cerrar = ({ devolverFoco = false } = {}) => {
        contenedor.classList.remove("is-open");
        boton.setAttribute("aria-expanded", "false");
        if (cursor_pluma_control) {
            cursor_pluma_control.classList.remove("is-hidden");
        }
        if (devolverFoco) {
            boton.focus();
        }
    };

    const abrir = () => {
        contenedor.classList.add("is-open");
        boton.setAttribute("aria-expanded", "true");
        if (cursor_pluma_control) {
            cursor_pluma_control.classList.remove("is-hidden");
        }
    };

    const sincronizar = ({ animar = false } = {}) => {
        const opciones = Array.from(selector.options || []);
        const valorActual = selector.value;
        const seleccionada = opciones.find((option) => option.value === valorActual) || opciones[0] || null;
        const debeAnimarCambio = animar || (ultimoValorIdiomaSincronizado && ultimoValorIdiomaSincronizado !== valorActual);
        textoActual.textContent = seleccionada ? formatearIdiomaControl(seleccionada) : "";
        lista.setAttribute("aria-label", selector.getAttribute("aria-label") || "Idioma");
        lista.innerHTML = "";

        opciones.forEach((option) => {
            const botonOpcion = document.createElement("button");
            botonOpcion.type = "button";
            botonOpcion.className = "control-language-option";
            botonOpcion.dataset.value = option.value;
            botonOpcion.setAttribute("role", "option");
            botonOpcion.setAttribute("aria-selected", option.value === valorActual ? "true" : "false");
            botonOpcion.setAttribute("aria-label", option.textContent || option.value);
            botonOpcion.textContent = formatearIdiomaControl(option);
            if (option.value === valorActual) {
                botonOpcion.classList.add("is-selected");
            }
            lista.appendChild(botonOpcion);
        });
        ultimoValorIdiomaSincronizado = valorActual;
        if (debeAnimarCambio) {
            animarCambioIdioma();
        }
    };

    const aplicarCambioIdioma = (nuevoValor) => {
        const idioma = String(nuevoValor || "es");
        if (selector.value !== idioma) {
            selector.value = idioma;
        }
        if (window && typeof window.scribSetLanguage2P === "function") {
            window.scribSetLanguage2P(idioma);
        }
        if (window && typeof window.emitirCambioIdiomaControl === "function") {
            window.emitirCambioIdiomaControl(idioma);
        } else {
            selector.dispatchEvent(new Event("change", { bubbles: true }));
        }
    };

    boton.addEventListener("click", () => {
        if (contenedor.classList.contains("is-open")) {
            cerrar();
            return;
        }
        abrir();
    });

    boton.addEventListener("keydown", (evento) => {
        if (evento.key !== "ArrowDown" && evento.key !== "Enter" && evento.key !== " ") return;
        evento.preventDefault();
        abrir();
        const primeraOpcion = lista.querySelector(".control-language-option");
        if (primeraOpcion) {
            primeraOpcion.focus();
        }
    });

    lista.addEventListener("click", (evento) => {
        const opcion = evento.target.closest(".control-language-option");
        if (!opcion) return;
        const nuevoValor = opcion.dataset.value || "es";
        const cambiaIdioma = selector.value !== nuevoValor;
        if (cambiaIdioma) {
            aplicarCambioIdioma(nuevoValor);
        }
        sincronizar({ animar: cambiaIdioma });
        cerrar({ devolverFoco: true });
    });

    lista.addEventListener("keydown", (evento) => {
        const opciones = Array.from(lista.querySelectorAll(".control-language-option"));
        const indiceActual = opciones.indexOf(document.activeElement);
        if (evento.key === "Escape") {
            evento.preventDefault();
            cerrar({ devolverFoco: true });
            return;
        }
        if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
            evento.preventDefault();
            if (!opciones.length) return;
            const direccion = evento.key === "ArrowDown" ? 1 : -1;
            const siguienteIndice = indiceActual >= 0
                ? (indiceActual + direccion + opciones.length) % opciones.length
                : 0;
            opciones[siguienteIndice].focus();
            return;
        }
        if (evento.key === "Enter" || evento.key === " ") {
            const opcion = document.activeElement;
            if (opcion && opcion.classList.contains("control-language-option")) {
                evento.preventDefault();
                opcion.click();
            }
        }
    });

    document.addEventListener("click", (evento) => {
        if (!contenedor.contains(evento.target)) {
            cerrar();
        }
    });

    window.addEventListener("resize", () => cerrar());
    window.addEventListener(EVENTO_CAMBIO_IDIOMA_UI, () => sincronizar({ animar: true }));
    selector.addEventListener("change", () => sincronizar({ animar: true }));
    sincronizar();
}

function extraerLineasTextoControl(elemento) {
    if (!elemento) return [""]; 
    const texto = typeof elemento.innerText === "string"
        ? elemento.innerText
        : String(elemento.textContent || "");
    const normalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const sinSaltoFinal = normalizado.endsWith("\n") ? normalizado.slice(0, -1) : normalizado;
    return sinSaltoFinal ? sinSaltoFinal.split("\n") : [""];
}

function actualizarNumerosLineaControl(playerId) {
    const id = Number(playerId) === 2 ? 2 : 1;
    const textoEl = document.getElementById(id === 2 ? "texto1" : "texto");
    const lineasEl = document.getElementById(id === 2 ? "line_numbers_j2" : "line_numbers_j1");
    if (!textoEl || !lineasEl) return;
    const totalLineas = Math.max(1, extraerLineasTextoControl(textoEl).length);
    lineasEl.textContent = Array.from({ length: totalLineas }, (_, index) => String(index + 1)).join("\n");
    lineasEl.scrollTop = textoEl.scrollTop || 0;
}
window.actualizarNumerosLineaControl = actualizarNumerosLineaControl;

function inicializarNumerosLineaControl() {
    if (numeros_linea_control_inicializados) return;
    numeros_linea_control_inicializados = true;
    [1, 2].forEach((playerId) => {
        const textoEl = document.getElementById(playerId === 2 ? "texto1" : "texto");
        const lineasEl = document.getElementById(playerId === 2 ? "line_numbers_j2" : "line_numbers_j1");
        if (!textoEl || !lineasEl) return;
        actualizarNumerosLineaControl(playerId);
        textoEl.addEventListener("scroll", () => {
            lineasEl.scrollTop = textoEl.scrollTop || 0;
        }, { passive: true });
        if (typeof MutationObserver !== "undefined") {
            const observer = new MutationObserver(() => actualizarNumerosLineaControl(playerId));
            observer.observe(textoEl, { childList: true, characterData: true, subtree: true });
        }
    });
}

function serializarLogControl(valor) {
    if (typeof valor === "string") return valor;
    if (valor instanceof Error) return valor.stack || valor.message;
    try {
        return JSON.stringify(valor);
    } catch (_error) {
        return String(valor);
    }
}

function renderizarLogsControl() {
    const output = document.getElementById("logs_control_output");
    if (!output) return;
    output.textContent = logs_control_buffer.length
        ? logs_control_buffer.map((entrada) => `[${entrada.hora}] ${entrada.tipo.toUpperCase()} ${entrada.texto}`).join("\n")
        : "Sin logs todavia.";
    output.scrollTop = output.scrollHeight;
}

function registrarLogControl(tipo = "info", args = []) {
    const fecha = new Date();
    const hora = fecha.toLocaleTimeString("es-ES", { hour12: false });
    const texto = Array.from(args || []).map(serializarLogControl).join(" ");
    logs_control_buffer.push({
        hora,
        tipo: String(tipo || "info"),
        texto: texto || "(sin detalle)"
    });
    while (logs_control_buffer.length > LOGS_CONTROL_MAX) {
        logs_control_buffer.shift();
    }
    renderizarLogsControl();
}
window.registrarLogControl = registrarLogControl;

function toggleLogsControl() {
    const panel = document.getElementById("panel_logs_control");
    const boton = document.getElementById("boton_ver_logs");
    if (!panel) return;
    const oculto = panel.classList.contains("panel-oculto");
    panel.classList.toggle("panel-oculto", !oculto);
    if (boton) {
        boton.dataset.active = oculto ? "1" : "0";
        boton.classList.toggle("is-active", oculto);
    }
    renderizarLogsControl();
}
window.toggleLogsControl = toggleLogsControl;

const SECCIONES_BOTONES_CONTROL = new Set(["tutorial", "detonadores", "juego", "representacion", "deliberacion", "final", "asistencia"]);
let dropdown_modos_control_inicializado = false;
let observer_modos_control = null;
let frases_finales_control_inicializadas = false;
let parametros_colapsados_control = false;
let timeout_animacion_parametros_control = null;
let timeout_cierre_dropdown_modos_control = null;
let timeout_apertura_dropdown_modos_control = null;
let timeout_animacion_idioma_control = null;
const timeouts_animacion_secciones_control = new WeakMap();
const timeouts_guardado_frase_final_control = { 1: null, 2: null };

function textoRepresentacionControl(corto = false) {
    const fallback = corto ? "\u{1F3AD} REPR." : "\u{1F3AD} REPRESENTACI\u00d3N";
    return tJuego2PControl(corto ? "control.title.representation_short" : "control.title.representation", {}, fallback);
}

function actualizarEtiquetaRepresentacionControl() {
    const boton = document.getElementById("control_title_representation");
    if (!boton) return;
    const textoCompleto = textoRepresentacionControl(false);
    const textoCorto = textoRepresentacionControl(true);
    boton.textContent = textoCompleto;
    boton.classList.remove("is-short-label");

    const margen = 2;
    if (boton.scrollWidth > boton.clientWidth + margen) {
        boton.textContent = textoCorto;
        boton.classList.add("is-short-label");
    }
}
window.actualizarEtiquetaRepresentacionControl = actualizarEtiquetaRepresentacionControl;

function marcarAnimacionSeccionControl(panel, clase, duracion = DURACION_ANIMACION_MENU_CONTROL_MS) {
    if (!panel) return;
    const timeoutPrevio = timeouts_animacion_secciones_control.get(panel);
    if (timeoutPrevio) {
        clearTimeout(timeoutPrevio);
    }
    panel.classList.remove("is-entering", "is-collapsing");
    panel.classList.add(clase);
    const timeout = setTimeout(() => {
        panel.classList.remove(clase);
        timeouts_animacion_secciones_control.delete(panel);
    }, duracion);
    timeouts_animacion_secciones_control.set(panel, timeout);
}

function activarSeccionControl(seccion) {
    if (!SECCIONES_BOTONES_CONTROL.has(seccion)) return;
    const contenedor = document.querySelector(`[data-control-section="${seccion}"]`);
    if (!contenedor) return;
    const tablaPrincipal = document.querySelector("table.default");
    if (tablaPrincipal) {
        tablaPrincipal.classList.remove("asistencia-activa");
    }
    if (seccion === "asistencia" && !parametros_colapsados_control) {
        setPanelParametrosColapsadoControl(true);
    }
    document.querySelectorAll("[data-control-section]").forEach((panel) => {
        const activa = panel === contenedor;
        const estabaActiva = !panel.classList.contains("is-collapsed");
        panel.classList.toggle("is-collapsed", !activa);
        if (activa && !estabaActiva) {
            marcarAnimacionSeccionControl(panel, "is-entering");
        } else if (!activa && estabaActiva) {
            marcarAnimacionSeccionControl(panel, "is-collapsing");
        } else if (activa) {
            panel.classList.remove("is-collapsing");
        } else {
            panel.classList.remove("is-entering");
        }
        const nombrePanel = panel.dataset.controlSection || "";
        const boton = document.querySelector(`[data-control-tab="${nombrePanel}"]`)
            || panel.querySelector(".control-collapsible-toggle");
        if (boton) {
            boton.setAttribute("aria-expanded", activa ? "true" : "false");
            boton.setAttribute("aria-selected", activa ? "true" : "false");
            boton.tabIndex = activa ? 0 : -1;
        }
    });
    desplazarPestanaControlAVisible(seccion);
    actualizarFlechasPestanasControl();
}

function toggleSeccionControl(seccion) {
    if (!SECCIONES_BOTONES_CONTROL.has(seccion)) return;
    if (seccion !== "asistencia" && window.ScribMuseHelpControl?.cerrarDetalle) {
        window.ScribMuseHelpControl.cerrarDetalle();
    }
    if (teleprompter_visible) {
        if (seccion === "representacion") {
            volverMenuRepresentacionTeleprompter();
            return;
        }
        teleprompter_visible = false;
        teleprompter_state.visible = false;
        teleprompter_state.preparing = false;
        teleprompter_state.playing = false;
        marcarCambioTeleprompterLocalControl();
        emitirTeleprompter(true);
        invalidarContextoTeleprompterControl({ reiniciarEstadoCarga: true });
        const panelTeleprompter = obtenerPanelTeleprompterRepresentacionControl();
        const representacion = document.querySelector('[data-control-section="representacion"]');
        if (panelTeleprompter) {
            panelTeleprompter.classList.add("panel-oculto");
            panelTeleprompter.setAttribute("aria-hidden", "true");
        }
        if (representacion) {
            representacion.classList.remove("is-teleprompter-open");
        }
        actualizarTeleprompterUI();
    }
    if (creditos_visibles) {
        if (seccion === "final") {
            toggleCreditos();
            return;
        }
        aplicarVistaPanelControl("controles");
    }
    activarSeccionControl(seccion);
}
window.toggleSeccionControl = toggleSeccionControl;

let pestanas_control_inicializadas = false;
let observer_pestanas_control = null;

function actualizarFlechasPestanasControl() {
    const viewport = document.getElementById("control_tabs_viewport");
    const anterior = document.getElementById("control_tabs_prev");
    const siguiente = document.getElementById("control_tabs_next");
    if (!viewport || !anterior || !siguiente) return;
    const shell = viewport.closest(".control-tabs-shell");
    const maximo = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const hayDesbordamiento = maximo > 2;
    const mostrarAnterior = hayDesbordamiento && viewport.scrollLeft > 2;
    const mostrarSiguiente = hayDesbordamiento && viewport.scrollLeft < maximo - 2;
    if (shell) {
        shell.dataset.hasPrevious = mostrarAnterior ? "true" : "false";
        shell.dataset.hasNext = mostrarSiguiente ? "true" : "false";
    }
    anterior.hidden = !mostrarAnterior;
    siguiente.hidden = !mostrarSiguiente;
    anterior.setAttribute("aria-hidden", mostrarAnterior ? "false" : "true");
    siguiente.setAttribute("aria-hidden", mostrarSiguiente ? "false" : "true");
}

function desplazarPestanaControlAVisible(seccion, comportamiento = "smooth") {
    const viewport = document.getElementById("control_tabs_viewport");
    const boton = document.querySelector(`[data-control-tab="${seccion}"]`);
    if (!viewport || !boton) return;
    const izquierda = boton.offsetLeft;
    const derecha = izquierda + boton.offsetWidth;
    const visibleIzquierda = viewport.scrollLeft;
    const visibleDerecha = visibleIzquierda + viewport.clientWidth;
    if (izquierda < visibleIzquierda) {
        viewport.scrollTo({ left: Math.max(0, izquierda - 4), behavior: comportamiento });
    } else if (derecha > visibleDerecha) {
        viewport.scrollTo({ left: Math.max(0, derecha - viewport.clientWidth + 4), behavior: comportamiento });
    }
}

function desplazarPestanasControl(direccion) {
    const viewport = document.getElementById("control_tabs_viewport");
    if (!viewport) return;
    const signo = direccion === "prev" ? -1 : 1;
    const maximo = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const distancia = Math.max(180, viewport.clientWidth * 0.72);
    const destino = Math.max(0, Math.min(maximo, viewport.scrollLeft + (signo * distancia)));
    viewport.dataset.scrollDirection = direccion;
    viewport.scrollTo({ left: destino, behavior: "smooth" });
}

function inicializarPestanasControl() {
    if (pestanas_control_inicializadas) return;
    const viewport = document.getElementById("control_tabs_viewport");
    const anterior = document.getElementById("control_tabs_prev");
    const siguiente = document.getElementById("control_tabs_next");
    if (!viewport || !anterior || !siguiente) return;
    pestanas_control_inicializadas = true;
    viewport.addEventListener("scroll", actualizarFlechasPestanasControl, { passive: true });
    viewport.addEventListener("keydown", (evento) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) return;
        const pestanas = Array.from(viewport.querySelectorAll("[data-control-tab]"));
        if (!pestanas.length) return;
        const actual = Math.max(0, pestanas.indexOf(document.activeElement));
        let indice = actual;
        if (evento.key === "ArrowLeft") indice = Math.max(0, actual - 1);
        if (evento.key === "ArrowRight") indice = Math.min(pestanas.length - 1, actual + 1);
        if (evento.key === "Home") indice = 0;
        if (evento.key === "End") indice = pestanas.length - 1;
        evento.preventDefault();
        const destino = pestanas[indice];
        destino.focus();
        toggleSeccionControl(destino.dataset.controlTab);
    });
    if (typeof ResizeObserver === "function") {
        observer_pestanas_control = new ResizeObserver(actualizarFlechasPestanasControl);
        observer_pestanas_control.observe(viewport);
    }
    window.addEventListener("resize", actualizarFlechasPestanasControl);
    requestAnimationFrame(() => {
        const activa = document.querySelector('[data-control-section]:not(.is-collapsed)');
        if (activa) desplazarPestanaControlAVisible(activa.dataset.controlSection, "auto");
        actualizarFlechasPestanasControl();
    });
}

window.actualizarFlechasPestanasControl = actualizarFlechasPestanasControl;
window.desplazarPestanasControl = desplazarPestanasControl;
window.inicializarPestanasControl = inicializarPestanasControl;

function setPanelParametrosColapsadoControl(colapsado) {
    parametros_colapsados_control = Boolean(colapsado);
    const panel = document.getElementById("panel_parametros");
    const tabla = panel ? panel.closest("table.default") : document.querySelector("table.default");
    const boton = document.getElementById("boton_colapsar_parametros");

    if (timeout_animacion_parametros_control) {
        clearTimeout(timeout_animacion_parametros_control);
        timeout_animacion_parametros_control = null;
    }
    if (panel) {
        panel.classList.add("is-side-animating");
        timeout_animacion_parametros_control = setTimeout(() => {
            panel.classList.remove("is-side-animating");
            timeout_animacion_parametros_control = null;
        }, DURACION_ANIMACION_MENU_CONTROL_MS);
    }

    if (tabla) {
        tabla.classList.toggle("parametros-colapsados", parametros_colapsados_control);
    }
    if (panel) {
        panel.classList.toggle("is-side-collapsed", parametros_colapsados_control);
    }
    if (boton) {
        boton.setAttribute("aria-expanded", parametros_colapsados_control ? "false" : "true");
        boton.innerHTML = parametros_colapsados_control ? "&#x2039;" : "&#x203A;";
        boton.title = parametros_colapsados_control ? "Expandir par\u00e1metros" : "Contraer par\u00e1metros";
    }
    if (parametros_colapsados_control && typeof setDropdownModosControl === "function") {
        setDropdownModosControl(false);
    }
}
window.setPanelParametrosColapsadoControl = setPanelParametrosColapsadoControl;

function togglePanelParametrosControl() {
    setPanelParametrosColapsadoControl(!parametros_colapsados_control);
}
window.togglePanelParametrosControl = togglePanelParametrosControl;

function actualizarResumenModosControl() {
    const resumen = document.getElementById("resumen_modos_control");
    const lista = document.getElementById("listaModos");
    if (!resumen || !lista) return;

    const casillas = Array.from(lista.querySelectorAll('input[name="modos"]'));
    const total = casillas.length;
    const activas = casillas.filter((casilla) => casilla.checked).length;

    if (total === 0) {
        resumen.textContent = "Sin niveles";
    } else if (activas === total) {
        resumen.textContent = `${activas} activos`;
    } else {
        resumen.textContent = `${activas}/${total} activos`;
    }
    actualizarOpcionesFraseFinalControl();
}
window.actualizarResumenModosControl = actualizarResumenModosControl;

function estaModoFraseFinalActivoControl() {
    const checkbox = document.querySelector('input[name="modos"][value="frase final"]');
    return checkbox ? checkbox.checked : true;
}
window.estaModoFraseFinalActivoControl = estaModoFraseFinalActivoControl;

function actualizarOpcionesFraseFinalControl() {
    const activo = estaModoFraseFinalActivoControl();
    const contenedor = document.querySelector(".parametros-top-grid");
    if (contenedor) {
        contenedor.classList.toggle("frase-final-inactiva", !activo);
    }
    [1, 2].forEach((playerId) => {
        const bloque = document.getElementById(`param_frase_final_j${playerId}`);
        if (!bloque) return;
        bloque.hidden = !activo;
        bloque.setAttribute("aria-hidden", activo ? "false" : "true");
    });
}
window.actualizarOpcionesFraseFinalControl = actualizarOpcionesFraseFinalControl;

function obtenerInputFraseFinalControl(playerId) {
    return document.getElementById(Number(playerId) === 2 ? "frase_final_j2" : "frase_final_j1");
}

function obtenerEditorFraseFinalControl(playerId) {
    const bloque = document.getElementById(Number(playerId) === 2 ? "param_frase_final_j2" : "param_frase_final_j1");
    return bloque ? bloque.querySelector(".frase_final_editor") : null;
}

function marcarEstadoGuardadoFraseFinalControl(playerId, estado) {
    const id = Number(playerId) === 2 ? 2 : 1;
    const editor = obtenerEditorFraseFinalControl(id);
    const estadoNodo = document.getElementById(`frase_final_estado_j${id}`);
    if (!editor || !estadoNodo) return;
    editor.classList.toggle("is-saving", estado === "saving");
    editor.classList.toggle("is-saved", estado === "saved");
    estadoNodo.classList.toggle("is-saving", estado === "saving");
    estadoNodo.classList.toggle("is-saved", estado === "saved");
    estadoNodo.textContent = estado === "saving" ? "\u2026" : "\u2713";
}

function guardarFraseFinalControl(playerId, opciones = {}) {
    const id = Number(playerId) === 2 ? 2 : 1;
    const input = obtenerInputFraseFinalControl(id);
    if (!input) return;
    if (opciones.normalizar === true) {
        input.value = normalizarFraseFinal(input.value);
    }

    if (timeouts_guardado_frase_final_control[id]) {
        clearTimeout(timeouts_guardado_frase_final_control[id]);
    }
    marcarEstadoGuardadoFraseFinalControl(id, "saving");
    timeouts_guardado_frase_final_control[id] = setTimeout(() => {
        marcarEstadoGuardadoFraseFinalControl(id, "saved");
        const editor = obtenerEditorFraseFinalControl(id);
        if (editor) {
            editor.classList.remove("frase-final-aplicada");
            void editor.offsetWidth;
            editor.classList.add("frase-final-aplicada");
        }
    }, 220);
    emitirEstadoControlPersistente();
}
window.guardarFraseFinalControl = guardarFraseFinalControl;

function obtenerNombreEscritoraFraseFinalControl(playerId) {
    const id = Number(playerId) === 2 ? 2 : 1;
    const input = document.getElementById(id === 2 ? "nombre1" : "nombre");
    const fallback = id === 2
        ? tJuego2PControl("ui.writer_2", {}, "ESCRITXR 2")
        : tJuego2PControl("ui.writer_1", {}, "ESCRITXR 1");
    return String(input && input.value ? input.value : fallback).trim() || fallback;
}

function actualizarEtiquetasFraseFinalControl() {
    [1, 2].forEach((playerId) => {
        const etiqueta = document.getElementById(`frase_final_label_j${playerId}`);
        if (etiqueta) {
            etiqueta.textContent = obtenerNombreEscritoraFraseFinalControl(playerId);
        }
    });
}
window.actualizarEtiquetasFraseFinalControl = actualizarEtiquetasFraseFinalControl;

function setDropdownModosControl(abierto) {
    const contenedor = document.getElementById("parametros_modos_dropdown");
    const boton = document.getElementById("boton_modos_dropdown");
    const menu = document.getElementById("parametros_modos_menu");
    if (!contenedor || !boton || !menu) return;

    const visible = Boolean(abierto);
    boton.setAttribute("aria-expanded", visible ? "true" : "false");
    if (timeout_cierre_dropdown_modos_control) {
        clearTimeout(timeout_cierre_dropdown_modos_control);
        timeout_cierre_dropdown_modos_control = null;
    }
    if (timeout_apertura_dropdown_modos_control) {
        clearTimeout(timeout_apertura_dropdown_modos_control);
        timeout_apertura_dropdown_modos_control = null;
    }

    if (visible) {
        menu.hidden = false;
        contenedor.classList.remove("is-closing");
        contenedor.classList.add("is-open", "is-opening");
        timeout_apertura_dropdown_modos_control = setTimeout(() => {
            contenedor.classList.remove("is-opening");
            timeout_apertura_dropdown_modos_control = null;
        }, DURACION_ANIMACION_DROPDOWN_CONTROL_MS);
    } else {
        const estabaVisible = contenedor.classList.contains("is-open") || !menu.hidden;
        contenedor.classList.remove("is-open", "is-opening");
        if (estabaVisible) {
            menu.hidden = false;
            contenedor.classList.add("is-closing");
            timeout_cierre_dropdown_modos_control = setTimeout(() => {
                menu.hidden = true;
                contenedor.classList.remove("is-closing");
                timeout_cierre_dropdown_modos_control = null;
            }, DURACION_ANIMACION_DROPDOWN_CONTROL_MS);
        } else {
            menu.hidden = true;
            contenedor.classList.remove("is-closing");
        }
    }
    actualizarResumenModosControl();
}
window.setDropdownModosControl = setDropdownModosControl;

function toggleDropdownModosControl() {
    const menu = document.getElementById("parametros_modos_menu");
    setDropdownModosControl(!(menu && !menu.hidden));
}
window.toggleDropdownModosControl = toggleDropdownModosControl;

function inicializarDropdownModosControl() {
    if (dropdown_modos_control_inicializado) return;
    const lista = document.getElementById("listaModos");
    const contenedor = document.getElementById("parametros_modos_dropdown");
    if (!lista || !contenedor) return;

    dropdown_modos_control_inicializado = true;
    lista.addEventListener("change", (evento) => {
        if (evento.target && evento.target.matches('input[name="modos"]')) {
            actualizarResumenModosControl();
        }
    });

    if (typeof MutationObserver === "function") {
        observer_modos_control = new MutationObserver(actualizarResumenModosControl);
        observer_modos_control.observe(lista, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["checked"]
        });
    }

    document.addEventListener("click", (evento) => {
        if (!contenedor.contains(evento.target)) {
            setDropdownModosControl(false);
        }
    });
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            setDropdownModosControl(false);
        }
    });
    actualizarResumenModosControl();
}
window.inicializarDropdownModosControl = inicializarDropdownModosControl;

function inicializarFrasesFinalesControl() {
    if (frases_finales_control_inicializadas) return;
    frases_finales_control_inicializadas = true;
    [1, 2].forEach((playerId) => {
        const input = obtenerInputFraseFinalControl(playerId);
        if (input) {
            input.addEventListener("input", () => guardarFraseFinalControl(playerId, { normalizar: false }));
            input.addEventListener("change", () => guardarFraseFinalControl(playerId, { normalizar: true }));
            input.addEventListener("blur", () => guardarFraseFinalControl(playerId, { normalizar: true }));
            marcarEstadoGuardadoFraseFinalControl(playerId, "saved");
        }
        const nombreInput = document.getElementById(playerId === 2 ? "nombre1" : "nombre");
        if (nombreInput) {
            nombreInput.addEventListener("input", actualizarEtiquetasFraseFinalControl);
        }
    });
    actualizarEtiquetasFraseFinalControl();
    actualizarOpcionesFraseFinalControl();
}
window.inicializarFrasesFinalesControl = inicializarFrasesFinalesControl;

function limpiarLogsControl() {
    logs_control_buffer.length = 0;
    renderizarLogsControl();
}
window.limpiarLogsControl = limpiarLogsControl;

function inicializarLogsControl() {
    if (logs_control_inicializados) return;
    logs_control_inicializados = true;
    if (typeof console !== "undefined" && !console.__scribControlLogsWrapped) {
        ["log", "warn", "error"].forEach((tipo) => {
            const original = console[tipo];
            if (typeof original !== "function") return;
            console[tipo] = function consoleControlWrapper(...args) {
                registrarLogControl(tipo, args);
                return original.apply(console, args);
            };
        });
        console.__scribControlLogsWrapped = true;
    }
    renderizarLogsControl();
}

function actualizarRelojControl() {
    const reloj = document.getElementById("control_clock");
    if (!reloj) return;
    reloj.textContent = new Date().toLocaleTimeString("es-ES", { hour12: false });
}

function inicializarRelojControl() {
    if (reloj_control_interval) return;
    actualizarRelojControl();
    reloj_control_interval = setInterval(actualizarRelojControl, 1000);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        inicializarCursorPlumaControl();
        inicializarSelectorIdiomaControl();
        inicializarNumerosLineaControl();
        inicializarLogsControl();
        inicializarRelojControl();
        inicializarDropdownModosControl();
        inicializarFrasesFinalesControl();
    }, { once: true });
} else {
    inicializarCursorPlumaControl();
    inicializarSelectorIdiomaControl();
    inicializarNumerosLineaControl();
    inicializarLogsControl();
    inicializarRelojControl();
    inicializarDropdownModosControl();
    inicializarFrasesFinalesControl();
}

function setPendienteAnimacionEntradaBarraVida(playerId, valor) {
    const id = Number(playerId);
    if (id !== 1 && id !== 2) return;
    animacionEntradaVidaPendiente[id] = Boolean(valor);
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
    elemento.style.setProperty("--vida-pct", `${pct.toFixed(1)}%`);
    elemento.style.setProperty("--vida-color", COLOR_BARRA_VIDA_CONTROL[elemento.id] || "#41d860");
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


function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function formatearSegundosControl(segundos) {
    const total = Math.max(0, Math.trunc(Number(segundos) || 0));
    const minutos = parseInt(total / 60);
    const segundosRestantes = parseInt(total % 60);
    return `${paddedFormat(minutos)}:${paddedFormat(segundosRestantes)}`;
}

function obtenerSegundosParaReanudarControl(valorActual, elementoTiempo) {
    const valor = Number(valorActual);
    if (valorActual !== null && typeof valorActual !== "undefined" && Number.isFinite(valor) && valor >= 0) {
        return Math.max(0, Math.trunc(valor));
    }
    const total = obtenerTotalSegundos();
    const totalConfig = Math.max(0, Math.trunc(Number(total.totalSegundos) || 0));
    if (typeof extraerSegundosTextoStatsControl === "function") {
        const desdeTexto = extraerSegundosTextoStatsControl(
            elementoTiempo ? (elementoTiempo.textContent || elementoTiempo.innerText || "") : ""
        );
        if (Number.isFinite(desdeTexto) && desdeTexto > 0) {
            return Math.max(0, Math.trunc(desdeTexto));
        }
    }
    return totalConfig;
}

function prepararContadoresReanudacionControl() {
    secondsRemaining = obtenerSegundosParaReanudarControl(secondsRemaining, tiempo);
    secondsRemaining1 = obtenerSegundosParaReanudarControl(secondsRemaining1, tiempo1);
    count = formatearSegundosControl(secondsRemaining);
    count1 = formatearSegundosControl(secondsRemaining1);
    if (tiempo) {
        tiempo.textContent = count;
        actualizarBarraVida(tiempo, count);
    }
    if (tiempo1) {
        tiempo1.textContent = count1;
        actualizarBarraVida(tiempo1, count1);
    }
}

function startCountDown_p1(duration, revisionEsperada = revision_temporizadores_control) {

    secondsRemaining = duration;

    let min;
    let sec;
    clearInterval(countInterval);
    const renderTick = function () {
        if (!esRevisionTemporizadoresControlActiva(revisionEsperada)) {
            return false;
        }
        display_modo.style.color = COLORES_MODOS[modo_actual]; // Asignar color al texto del label
        display_modo.textContent = traducirModoControl(modo_actual);
        console.log("modo_actual", modo_actual)
        console.log("DURACION_TIEMPO_MODOS", DURACION_TIEMPO_MODOS)
        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        const animarEntradaVidaJ1 = Boolean(animacionEntradaVidaPendiente[1]);
        actualizarBarraVida(tiempo, tiempo.textContent, { animarEntrada: animarEntradaVidaJ1 });
        if (animarEntradaVidaJ1) {
            animacionEntradaVidaPendiente[1] = false;
        }
        if (window.registrarTiempoControl) {
            window.registrarTiempoControl(1, secondsRemaining);
        }
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        console.log('count', {count, player:1})
        emitirCountControl({ count, player: 1 });
        if (secondsRemaining == 20) {
            tiempo.style.color = "yellow"
        }
        if (secondsRemaining == 10) {
            tiempo.style.color = "red"
        }
        return true;
    };
    const tick = function () {
        if (!renderTick()) {
            clearInterval(countInterval);
            countInterval = null;
            return;
        }
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining <= 0) {
            final(1);
        };
    };
    if (!renderTick()) {
        return;
    }
    countInterval = setInterval(tick, 1000);
}

function startCountDown_p2(duration, revisionEsperada = revision_temporizadores_control) {
    secondsRemaining1 = duration;
    let min1;
    let sec1;
    clearInterval(countInterval1);
    const renderTick = function () {
        if (!esRevisionTemporizadoresControlActiva(revisionEsperada)) {
            return false;
        }

        min1 = parseInt(secondsRemaining1 / 60);
        sec1 = parseInt(secondsRemaining1 % 60);

        tiempo1.textContent = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
        const animarEntradaVidaJ2 = Boolean(animacionEntradaVidaPendiente[2]);
        actualizarBarraVida(tiempo1, tiempo1.textContent, { animarEntrada: animarEntradaVidaJ2 });
        if (animarEntradaVidaJ2) {
            animacionEntradaVidaPendiente[2] = false;
        }
        if (window.registrarTiempoControl) {
            window.registrarTiempoControl(2, secondsRemaining1);
        }
        count1 = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
        emitirCountControl({ count: count1, player: 2 });
        if (secondsRemaining1 == 20) {
            tiempo1.style.color = "yellow"
        }
        if (secondsRemaining1 == 10) {
            tiempo1.style.color = "red"
        }
        return true;
    };
    const tick = function () {
        if (!renderTick()) {
            clearInterval(countInterval1);
            countInterval1 = null;
            return;
        }
        secondsRemaining1 = secondsRemaining1 - 1;
        if (secondsRemaining1 <= 0) {
            final(2);
        };
    };
    if (!renderTick()) {
        return;
    }
    countInterval1 = setInterval(tick, 1000);
}

function addSeconds(secs) {
    secondsRemaining += secs;
    if(secondsRemaining < 0){
        secondsRemaining = 0;
    }  
    min = parseInt(secondsRemaining / 60);
    sec = parseInt(secondsRemaining % 60);

    tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    actualizarBarraVida(tiempo, tiempo.textContent);
    count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    if (window.registrarTiempoControl) {
        window.registrarTiempoControl(1, secondsRemaining);
    }
}

function addSeconds1(secs) {
    secondsRemaining1 += secs;
    if(secondsRemaining1 < 0){
        secondsRemaining1 = 0;
    }  
    min1 = parseInt(secondsRemaining1 / 60);
    sec1 = parseInt(secondsRemaining1 % 60);

    tiempo1.textContent = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
    actualizarBarraVida(tiempo1, tiempo1.textContent);
    count1 = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
    console.log(min1)
    console.log("JOOOOOOOOO", count1)
    if (window.registrarTiempoControl) {
        window.registrarTiempoControl(2, secondsRemaining1);
    }
}

function normalizarFraseFinal(valor) {
    if (window.ScribFraseFinalUtils && typeof window.ScribFraseFinalUtils.normalizarFraseFinal === "function") {
        return window.ScribFraseFinalUtils.normalizarFraseFinal(valor);
    }
    let texto = (valor || "").trim();
    if (texto.startsWith("\u00ab") && texto.endsWith("\u00bb") && texto.length > 1) {
        texto = texto.slice(1, -1).trim();
    }
    texto = texto.replace(/^["\u201c]+/, "").replace(/["\u201d]+$/, "").trim();
    return texto;
}

function obtenerValorParametroPersistenteControl(id) {
    const input = document.getElementById(id);
    if (!input) return undefined;
    const valor = Number(input.value);
    return Number.isFinite(valor) ? Math.trunc(valor) : undefined;
}

function obtenerModosPersistentesControl() {
    if (typeof rellenarListaModos === "function") {
        rellenarListaModos();
    }
    return Array.from(document.querySelectorAll('input[name="modos"]:checked'))
        .map((checkbox) => checkbox.value)
        .filter(Boolean);
}

function obtenerEstadoPersistenteControl() {
    const parametros = {};
    PARAMETROS_CONTROL_PERSISTENTES.forEach((id) => {
        const valor = obtenerValorParametroPersistenteControl(id);
        if (Number.isFinite(valor)) {
            parametros[id] = valor;
        }
    });
    return {
        borrar_texto: borrar_texto_en_inicio_activo === true,
        frases_finales: {
            1: String(frase_final_j1 && frase_final_j1.value ? frase_final_j1.value : ""),
            2: String(frase_final_j2 && frase_final_j2.value ? frase_final_j2.value : "")
        },
        parametros,
        modos: obtenerModosPersistentesControl(),
        nombres: {
            1: String(nombre1 && nombre1.value ? nombre1.value : ""),
            2: String(nombre2 && nombre2.value ? nombre2.value : "")
        }
    };
}
window.obtenerEstadoPersistenteControl = obtenerEstadoPersistenteControl;

function emitirEstadoControlPersistente(opciones = {}) {
    if (aplicando_estado_control_persistente) return;
    const emitir = () => {
        timeout_emision_estado_control_persistente = null;
        if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function" || !socket.connected) {
            return;
        }
        socket.emit("control_estado_actualizar", obtenerEstadoPersistenteControl());
    };
    if (opciones.inmediato === true) {
        if (timeout_emision_estado_control_persistente) {
            clearTimeout(timeout_emision_estado_control_persistente);
            timeout_emision_estado_control_persistente = null;
        }
        emitir();
        return;
    }
    if (timeout_emision_estado_control_persistente) {
        clearTimeout(timeout_emision_estado_control_persistente);
    }
    timeout_emision_estado_control_persistente = setTimeout(emitir, 140);
}
window.emitirEstadoControlPersistente = emitirEstadoControlPersistente;

function aplicarEstadoPersistenteControl(payload = {}) {
    const data = payload && typeof payload === "object" ? payload : {};
    aplicando_estado_control_persistente = true;
    try {
        if (Object.prototype.hasOwnProperty.call(data, "borrar_texto")) {
            borrar_texto_en_inicio_activo = data.borrar_texto === true;
        }

        const parametros = data.parametros && typeof data.parametros === "object" ? data.parametros : {};
        PARAMETROS_CONTROL_PERSISTENTES.forEach((id) => {
            if (!Object.prototype.hasOwnProperty.call(parametros, id)) return;
            const input = document.getElementById(id);
            const valor = Number(parametros[id]);
            if (input && Number.isFinite(valor)) {
                input.value = String(Math.trunc(valor));
            }
        });

        if (Array.isArray(data.modos)) {
            if (typeof generarCasillas === "function") {
                generarCasillas(data.modos);
            } else {
                const activos = new Set(data.modos.map((modo) => String(modo || "").trim().toLowerCase()));
                document.querySelectorAll('input[name="modos"]').forEach((checkbox) => {
                    checkbox.checked = activos.has(String(checkbox.value || "").trim().toLowerCase());
                });
            }
        }

        const frases = data.frases_finales && typeof data.frases_finales === "object" ? data.frases_finales : {};
        if (frase_final_j1 && Object.prototype.hasOwnProperty.call(frases, 1)) {
            frase_final_j1.value = String(frases[1] || "");
        }
        if (frase_final_j2 && Object.prototype.hasOwnProperty.call(frases, 2)) {
            frase_final_j2.value = String(frases[2] || "");
        }

        const nombres = data.nombres && typeof data.nombres === "object" ? data.nombres : {};
        if (nombre1 && Object.prototype.hasOwnProperty.call(nombres, 1)) {
            // El servidor recorta los espacios de los extremos. Mientras se escribe,
            // no debemos devolver ese valor al campo porque borraria el espacio que
            // separa nombre y apellido antes de que llegue la siguiente letra.
            if (document.activeElement !== nombre1) {
                nombre1.value = String(nombres[1] || "ESCRITXR 1");
            }
            val_nombre1 = nombre1.value.toUpperCase();
        }
        if (nombre2 && Object.prototype.hasOwnProperty.call(nombres, 2)) {
            if (document.activeElement !== nombre2) {
                nombre2.value = String(nombres[2] || "ESCRITXR 2");
            }
            val_nombre2 = nombre2.value.toUpperCase();
        }

        if (typeof actualizarVariables === "function") {
            actualizarVariables();
        }
        if (typeof actualizarControlesEscalaEspectadorControl === "function") {
            escala_ui_espectador_control = obtenerEscalaEspectadorParametroControl();
            actualizarControlesEscalaEspectadorControl();
        }
        if (typeof rellenarListaModos === "function") {
            rellenarListaModos();
        }
        if (typeof actualizarResumenModosControl === "function") {
            actualizarResumenModosControl();
        }
        if (typeof actualizarOpcionesFraseFinalControl === "function") {
            actualizarOpcionesFraseFinalControl();
        }
        if (typeof marcarEstadoGuardadoFraseFinalControl === "function") {
            marcarEstadoGuardadoFraseFinalControl(1, "saved");
            marcarEstadoGuardadoFraseFinalControl(2, "saved");
        }
        if (typeof actualizarEtiquetasFraseFinalControl === "function") {
            actualizarEtiquetasFraseFinalControl();
        }
        if (typeof actualizarTitulosHeatmap === "function") {
            actualizarTitulosHeatmap();
        }
        if (typeof actualizarNombresConexiones === "function") {
            actualizarNombresConexiones();
        }
        actualizarBotonBorrarTextoGuardadoControl();
    } finally {
        aplicando_estado_control_persistente = false;
    }
}
window.aplicarEstadoPersistenteControl = aplicarEstadoPersistenteControl;

function inicializarPersistenciaParametrosControl() {
    if (persistencia_parametros_control_inicializada) return;
    persistencia_parametros_control_inicializada = true;
    PARAMETROS_CONTROL_PERSISTENTES.forEach((id) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener("input", () => emitirEstadoControlPersistente());
        input.addEventListener("change", () => emitirEstadoControlPersistente());
    });
    const listaModos = document.getElementById("listaModos");
    if (listaModos) {
        listaModos.addEventListener("change", (evento) => {
            if (evento.target && evento.target.matches('input[name="modos"]')) {
                emitirEstadoControlPersistente();
            }
        });
    }
}
window.inicializarPersistenciaParametrosControl = inicializarPersistenciaParametrosControl;

function actualizarBotonBorrarTextoGuardadoControl() {
    const boton = document.getElementById("boton_borrar_texto_guardado");
    if (!boton) return;
    const activo = borrar_texto_en_inicio_activo === true;
    boton.dataset.active = activo ? "1" : "0";
    boton.classList.toggle("is-active", activo);
    boton.setAttribute("aria-pressed", activo ? "true" : "false");
    boton.textContent = tJuego2PControl("control.button.delete_saved", {}, "BORRAR TEXTO");
    boton.title = activo
        ? "La siguiente partida arrancara sin texto guardado."
        : "La siguiente partida recuperara el ultimo texto guardado.";
}
window.actualizarBotonBorrarTextoGuardadoControl = actualizarBotonBorrarTextoGuardadoControl;

function actualizarBotonSkipTertuliaControl() {
    const boton = document.getElementById("boton_skip_tertulia");
    if (!boton) return;
    const visible = juego_iniciado === true && modo_actual === "tertulia";
    boton.textContent = tJuego2PControl("control.button.skip_tertulia", {}, "\u23ED\uFE0F SKIP TERTULIA");
    boton.classList.toggle("is-visible", visible);
}

function actualizarBotonFinPartidaControl() {
    const boton = document.getElementById("boton_fin_partida");
    if (!boton) return;
    const visible = juego_iniciado === true;
    boton.hidden = !visible;
    boton.setAttribute("aria-hidden", visible ? "false" : "true");
    boton.tabIndex = visible ? 0 : -1;
}
window.actualizarBotonFinPartidaControl = actualizarBotonFinPartidaControl;

function temp() {
    console.log(frase_final_j1.value)
    const fraseJ1 = normalizarFraseFinal(frase_final_j1.value);
    const fraseJ2 = normalizarFraseFinal(frase_final_j2.value);
    var checkboxFraseFinal = document.querySelector('input[type="checkbox"][value="frase final"]');
    console.log(checkboxFraseFinal)
    if((!fraseJ1 || !fraseJ2) && checkboxFraseFinal && checkboxFraseFinal.checked){
        if(!fraseJ1){
        alert(`Falta introducir una frase inicial para ${nombre1.value}.`)
        }
        else{
            alert(`Falta introducir una frase inicial para ${nombre2.value}.`)
        }
    }
    else{
    if (window.resetResumenPartida) {
        window.resetResumenPartida();
    }
    detenerCuentaAtrasModoControl();
    limpiarTestigosDesventajaControl();
    terminado = false;
    terminado1 = false;
    regalo_musas_enviado = false;
    puntuacion_final_captura_solicitada = false;
    fin_j1 = false;
    fin_j2 = false;
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("definicion").innerHTML = "";
    clearInterval(countInterval);
    clearInterval(countInterval1);
    count = "00:00";
    count1 = "00:00";

    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        actualizarBotonPausaReanudarControl(boton_pausar_reanudar);
    }
    rellenarListaModos();
    actualizarVariables();
    const borrarTextoEnInicio = borrar_texto_en_inicio_activo === true;
    if (borrarTextoEnInicio) {
        texto_guardado1 = "";
        texto_guardado2 = "";
        const textoPanel1 = document.getElementById("texto");
        const textoPanel2 = document.getElementById("texto1");
        if (textoPanel1) {
            textoPanel1.innerHTML = "";
            textoPanel1.style.height = "40";
            textoPanel1.style.height = textoPanel1.scrollHeight + "px";
        }
        if (textoPanel2) {
            textoPanel2.innerHTML = "";
            textoPanel2.style.height = "40";
            textoPanel2.style.height = textoPanel2.scrollHeight + "px";
        }
        if (window.actualizarBotonesTeleprompterCarga) {
            window.actualizarBotonesTeleprompterCarga();
        }
    }
    const escalaEspectador = normalizarEscalaUiEspectadorControl(
        typeof ESCALA_UI_ESPECTADOR !== "undefined" ? ESCALA_UI_ESPECTADOR : escala_ui_espectador_control
    );
    escala_ui_espectador_control = escalaEspectador;
    socket.emit("ajustar_escala_espectador", { valor: escalaEspectador });
    emitirEstadoControlPersistente({ inmediato: true });
    asegurarVistaPartidaParaInicioControl();
    socket.emit('inicio', {count, borrar_texto : borrarTextoEnInicio, parametros: {DURACION_PARTIDA, DURACION_TIEMPO_MODOS, LISTA_MODOS, TIEMPO_CAMBIO_LETRA, TIEMPO_CAMBIO_PALABRAS, LIMITE_TIEMPO_INSPIRACION, ESCALA_UI_ESPECTADOR: escalaEspectador, FRASE_FINAL_J1: fraseJ1, FRASE_FINAL_J2: fraseJ2} });
    juego_iniciado = true;
    modo_actual = "";
    actualizarBotonSkipTertuliaControl();
    actualizarBotonFinPartidaControl();
  
    invalidarTemporizadoresPartidaControl();
}
};

let nueva_partida_pendiente = false;

function actualizarBotonNuevaPartidaControl(pendiente = nueva_partida_pendiente) {
    const boton = document.getElementById("boton_nueva_partida");
    if (!boton) return;
    boton.dataset.pending = pendiente ? "1" : "0";
    boton.disabled = Boolean(pendiente);
    boton.setAttribute("aria-busy", pendiente ? "true" : "false");
    boton.textContent = pendiente
        ? tJuego2PControl("control.button.new_match_pending", {}, "PREPARANDO…")
        : tJuego2PControl("control.button.new_match", {}, "✨ NUEVA PARTIDA");
}

function nueva_partida() {
    if (nueva_partida_pendiente) return;
    const confirmar = window.confirm(
        tJuego2PControl(
            "control.confirm.new_match",
            {},
            "¿Preparar una nueva partida? Las musas tendrán que volver a elegir escritxr."
        )
    );
    if (!confirmar) return;
    if (!socket || !socket.connected) {
        window.alert("Control no está conectado al servidor.");
        return;
    }

    nueva_partida_pendiente = true;
    actualizarBotonNuevaPartidaControl(true);
    let completada = false;
    const terminar = (error, respuesta = {}) => {
        if (completada) return;
        completada = true;
        nueva_partida_pendiente = false;
        actualizarBotonNuevaPartidaControl(false);
        if (error || !respuesta || respuesta.ok !== true) {
            window.alert("No se pudo preparar la nueva partida. Inténtalo de nuevo.");
            return;
        }
        limpiar({ emitirServidor: false });
        mostrar_vista_tutorial();
    };

    if (typeof socket.timeout === "function") {
        socket.timeout(8000).emit("nueva_partida", {}, terminar);
    } else {
        socket.emit("nueva_partida", {}, (respuesta) => terminar(null, respuesta));
    }
}

window.nueva_partida = nueva_partida;


function obtenerTotalSegundos() {
    // Lectura y saneado de los inputs (suponemos que existen en el DOM)
    const mRaw = parseInt(document.getElementById('duracion_minutos').value, 10);
    const sRaw = parseInt(document.getElementById('duracion_segundos').value, 10);
  
    // ValidaciÃ³n de rangos y normalizaciÃ³n
    const m = Math.min(Math.max(mRaw || 0, 0), 360);
    const s = Math.min(Math.max(sRaw || 0, 0), 59);
  
    // Retornamos un objeto con los tres valores
    return {
      minutos: m,
      segundos: s,
      totalSegundos: m * 60 + s
    };
  }

function cambiarValor(campoId, incremento) {
    const input = document.getElementById(campoId);
    if (!input) return;

    let valorActual = parseInt(input.value, 10);
    if (isNaN(valorActual)) {
        valorActual = 0;
    }

    let nuevoValor = valorActual + incremento;
    const min = parseInt(input.min, 10) || Number.MIN_SAFE_INTEGER;
    const max = parseInt(input.max, 10) || Number.MAX_SAFE_INTEGER;
    const stepAttr = parseInt(input.step, 10);
    const step = Number.isNaN(stepAttr) ? Math.abs(incremento) : stepAttr;

    if (!Number.isNaN(step) && step > 0) {
        nuevoValor = Math.round(nuevoValor / step) * step;
    }

    if (nuevoValor < min) {
        nuevoValor = min;
    } else if (nuevoValor > max) {
        nuevoValor = max;
    }

    input.value = nuevoValor;
    if (typeof actualizarVariables === "function") {
        actualizarVariables();
    }
    emitirEstadoControlPersistente();
}

function vote() {
    socket.emit('vote', "nada");
};

function exit() {
    socket.emit('exit', "nada");
};

function temas() {
    palabras = tema.value.split(",")
    socket.emit('temas', palabras);
};

function limpiar({ emitirServidor = true } = {}) {
    //document.getElementById("nombre").value = "ESCRITXR 1";
    //document.getElementById("nombre1").value = "ESCRITXR 2";
    detenerCuentaAtrasModoControl();
    actualizarCabeceraModoControl({ modo: "", segundos: 0 });
    limpiarTestigosDesventajaControl();
    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        actualizarBotonPausaReanudarControl(boton_pausar_reanudar);
    }
    texto_guardado1 = texto1.innerText;
    texto_guardado2 = texto2.innerText;
    //texto1.innerText = "";
    //texto2.innerText = "";
    juego_iniciado = false;
    actualizarBotonFinPartidaControl();
    terminado = false;
    terminado1 = false;
    fin_j1 = false;
    fin_j2 = false;
    regalo_musas_enviado = false;
    puntuacion_final_captura_solicitada = false;
    if (typeof window.actualizarPuntosMarcadorControl === "function") {
        window.actualizarPuntosMarcadorControl(1, 0, false);
        window.actualizarPuntosMarcadorControl(2, 0, false);
    } else {
        document.getElementById("puntos").innerHTML = tJuego2PControl("score.words_count", { count: 0 }, "0 palabras");
        document.getElementById("puntos1").innerHTML = tJuego2PControl("score.words_count", { count: 0 }, "0 palabras");
    }
    if (typeof window.actualizarMusasMarcadorControl === "function") {
        window.actualizarMusasMarcadorControl(1, 0, false);
        window.actualizarMusasMarcadorControl(2, 0, false);
    } else {
        const musasJ1 = document.getElementById("musas");
        const musasJ2 = document.getElementById("musas1");
        if (musasJ1) musasJ1.innerHTML = tJuego2PControl("score.muses_count", { count: 0 }, "0 musas");
        if (musasJ2) musasJ2.innerHTML = tJuego2PControl("score.muses_count", { count: 0 }, "0 musas");
    }
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("texto").style.height = "40";
    document.getElementById("texto").style.height = (document.getElementById("texto").scrollHeight) + "px";
    document.getElementById("texto1").style.height = "40";
    document.getElementById("texto1").style.height = (document.getElementById("texto1").scrollHeight) + "px";
    const definicionControl = document.getElementById("definicion");
    const explicacionControl = document.querySelector('[id^="explicaci"]');
    if (definicionControl) definicionControl.innerHTML = "";
    if (explicacionControl) explicacionControl.innerHTML = "";
    if (emitirServidor) socket.emit('limpiar', false);
    invalidarEmisionCreditosControl({ emitirPendiente: true });
    invalidarContextoTeleprompterControl({ reiniciarEstadoCarga: true });
    teleprompter_state.text = "";
    teleprompter_state.scroll = 0;
    teleprompter_state.source = 0;
    teleprompter_state.loadId = 0;
    teleprompter_state.visible = false;
    teleprompter_state.preparing = false;
    teleprompter_state.playing = false;
    panel_control_previo_teleprompter = "controles";
    marcarCambioTeleprompterLocalControl();
    if (teleprompter_visible) {
        aplicarVistaPanelControl("controles");
    }
    actualizarTeleprompterUI();
    emitirTeleprompter(true);

    invalidarTemporizadoresPartidaControl();
    setPendienteAnimacionEntradaBarraVida(1, false);
    setPendienteAnimacionEntradaBarraVida(2, false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);
    clearTimeout(tempo_text_borroso);
    temporizador_gigante_activo = false;

    tiempo.innerHTML = "";
    tiempo1.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    actualizarBarraVida(tiempo1, tiempo1.innerHTML);
    document.getElementById("texto").classList.remove('textarea_blur');
    document.getElementById("texto1").classList.remove('textarea_blur');
    puntuacion_final1.innerHTML = "";
    puntuacion_final2.innerHTML = "";
    //socket.emit('count', "");
    if (feedback1 !== null) {
        feedback1.innerHTML = "";
    }
    if (feedback2 !== null) {
        feedback2.innerHTML = "";
    }
    if (typeof resetearHeatmap === "function") {
        resetearHeatmap();
    }
    if (window.resetResumenPartida) {
        window.resetResumenPartida();
    }
    actualizarBotonSkipTertuliaControl();
};

function borrar_texto_guardado() {
    borrar_texto_en_inicio_activo = !borrar_texto_en_inicio_activo;
    actualizarBotonBorrarTextoGuardadoControl();
    emitirEstadoControlPersistente({ inmediato: true });
}

function activar_temporizador_gigante() {
    if (temporizador_gigante_activo) {
        temporizador_gigante_activo = false;
        socket.emit('temporizador_gigante_detener', {});
        return;
    }
    if (vista_calentamiento) {
        vista_calentamiento = false;
        emitirVistaControl("cambiar_vista_calentamiento", { activo: false });
    }
    cerrarVideotutorialDesdeVistaControl();
    vista_principal_control = "partida";
    vista_espectador_modo = "partida";
    socket.emit("cambiar_vista_espectador_modo", { modo: "partida" });
    temporizador_gigante_activo = true;
    socket.emit('activar_temporizador_gigante', { duracion: 10 * 60 });
}

function actualizarEstadoTemporizadorControl(payload = {}) {
    temporizador_gigante_activo = Boolean(payload.mostrar && payload.estado !== "oculto");
    const boton = document.getElementById("boton_temporizador_gigante");
    if (!boton) return;
    boton.dataset.active = temporizador_gigante_activo ? "1" : "0";
    boton.classList.toggle("is-active", temporizador_gigante_activo);
    boton.setAttribute("aria-pressed", temporizador_gigante_activo ? "true" : "false");
}

window.actualizarEstadoTemporizadorControl = actualizarEstadoTemporizadorControl;

function pedirFeedbackMusas() {
    if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
        return;
    }
    socket.emit("pedir_feedback_musas", { url: "/feedback/" });
}

function saltar_tertulia() {
    if (!juego_iniciado || modo_actual !== "tertulia") {
        return;
    }
    detenerCuentaAtrasModoControl();
    clearTimeout(TimeoutTiempoMuerto);
    socket.emit('saltar_tertulia', {});
}

function cambiar_vista() {
    socket.emit('cambiar_vista', 'nada');
};

const VISTAS_PRINCIPALES_CONTROL = new Set(["tutorial", "detonadores", "partida"]);

function emitirVistaControl(evento, payload) {
    if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") return;
    socket.emit(evento, payload);
}

function cerrarVideotutorialDesdeVistaControl() {
    if (window.ScribVideotutorialControl) {
        const estadoVideo = window.ScribVideotutorialControl.obtenerEstado();
        if (estadoVideo.visible || estadoVideo.reproduciendo) {
            window.ScribVideotutorialControl.ocultar();
        }
    }
    if (window.ScribShowNarrationControl && typeof window.ScribShowNarrationControl.getState === "function") {
        const estadoNarracion = window.ScribShowNarrationControl.getState();
        if (estadoNarracion && estadoNarracion.active && typeof socket !== "undefined" && socket) {
            socket.emit("narracion_show_detener", {});
        }
    }
}

function actualizarBotonesVistaPrincipalControl() {
    document.querySelectorAll("[data-vista-principal]").forEach((boton) => {
        const destino = boton.dataset.vistaPrincipal;
        const activa = destino === "tutorial"
            ? vista_espectador_modo === "tutorial"
            : destino === "detonadores"
                ? vista_espectador_modo === "calentamiento" || vista_calentamiento
                : vista_espectador_modo === "partida" && destino === vista_principal_control;
        boton.dataset.active = activa ? "1" : "0";
        boton.classList.toggle("is-active", activa);
        boton.setAttribute("aria-pressed", activa ? "true" : "false");
    });
    const botonDetonadores = document.getElementById("boton_vista_calentamiento");
    const botonPartida = document.getElementById("boton_vista_partida");
    if (botonDetonadores) {
        botonDetonadores.textContent = tJuego2PControl("control.button.detonators_view", {}, "\u{1F4A5} VISTA DETONADORES");
    }
    if (botonPartida) {
        botonPartida.textContent = tJuego2PControl("control.button.game_view", {}, "\u{1F3AE} VISTA PARTIDA");
    }
}

function aplicarVistaPrincipalControl(vista) {
    if (temporizador_gigante_activo) {
        temporizador_gigante_activo = false;
        socket.emit("temporizador_gigante_detener", {});
    }
    const destino = VISTAS_PRINCIPALES_CONTROL.has(vista) ? vista : "tutorial";
    const activarDetonadores = destino === "detonadores";
    const modoEspectador = destino === "tutorial" ? "tutorial" : "partida";
    vista_principal_control = destino;
    // Cada pulsacion confirma el estado autoritativo. Esto permite reabrir el
    // canal del tutorial aunque Control ya creyera tener seleccionada la vista.
    vista_calentamiento = activarDetonadores;
    emitirVistaControl("cambiar_vista_calentamiento", { activo: activarDetonadores });
    vista_espectador_modo = modoEspectador;
    emitirVistaControl("cambiar_vista_espectador_modo", { modo: modoEspectador });
    cerrarVideotutorialDesdeVistaControl();
    actualizarBotonesVistaEspectadorControl();
    if (activarDetonadores) {
        pedir_solicitud_calentamiento(SOLICITUD_CALENTAMIENTO_POR_DEFECTO);
    }
}

function cambiar_vista_calentamiento() {
    aplicarVistaPrincipalControl("detonadores");
}

function mostrar_vista_detonadores() {
    aplicarVistaPrincipalControl("detonadores");
}

function mostrar_vista_tutorial() {
    aplicarVistaPrincipalControl("tutorial");
}

function mostrar_vista_partida() {
    aplicarVistaPrincipalControl("partida");
}

function asegurarVistaPartidaParaInicioControl() {
    const vistaPartidaYaActiva = vista_principal_control === "partida"
        && vista_espectador_modo === "partida"
        && vista_calentamiento === false;
    if (vistaPartidaYaActiva) {
        actualizarBotonesVistaPrincipalControl();
        return false;
    }
    aplicarVistaPrincipalControl("partida");
    return true;
}

window.mostrar_vista_tutorial = mostrar_vista_tutorial;
window.mostrar_vista_detonadores = mostrar_vista_detonadores;
window.mostrar_vista_partida = mostrar_vista_partida;
window.asegurarVistaPartidaParaInicioControl = asegurarVistaPartidaParaInicioControl;

function fin_partida_global() {
    if (!juego_iniciado && !modo_actual) return;
    socket.emit("finalizar_partida");
}

function actualizarBotonVistaCalentamiento(boton) {
    const destino = boton || document.getElementById("boton_vista_calentamiento");
    if (!destino) return;
    if (vista_calentamiento) vista_principal_control = "detonadores";
    destino.textContent = tJuego2PControl("control.button.detonators_view", {}, "\u{1F4A5} VISTA DETONADORES");
    actualizarBotonesVistaPrincipalControl();
}
window.actualizarBotonVistaCalentamiento = actualizarBotonVistaCalentamiento;
window.actualizarBotonesVistaPrincipalControl = actualizarBotonesVistaPrincipalControl;

function actualizarBotonPausaReanudarControl(boton) {
    if (!boton) return;
    boton.innerHTML = boton.dataset.value == 1
        ? tJuego2PControl("control.button.resume", {}, "\u{25B6}\u{FE0F} REANUDAR")
        : tJuego2PControl("control.button.pause", {}, "\u{23F8}\u{FE0F} PAUSAR");
}
window.actualizarBotonPausaReanudarControl = actualizarBotonPausaReanudarControl;

// `calentamiento` es un modo resuelto que llega desde el servidor cuando la
// vista Detonadores está activa. Conservarlo evita confundirlo con Tutorial y,
// sobre todo, garantiza que al pulsar Tutorial se envíe el cambio autoritativo.
const MODOS_VISTA_ESPECTADOR = new Set(["partida", "tutorial", "calentamiento", "stats", "puntuacion", "nube_inspiracion", "creditos", "deliberacion", "resultado_jurado", "resultado_final"]);
const PUNTUACION_CATEGORIAS_CONTROL = [
    "produccion",
    "ritmo",
    "riqueza_lexica",
    "bonus",
    "precision",
    "pulsaciones"
];
const PUNTUACION_PASO_MAX_CONTROL = PUNTUACION_CATEGORIAS_CONTROL.length + 1;
const JURADO_CATEGORIAS_CONTROL = [
    "IDEA Y MUNDO",
    "VOZ",
    "ESTRUCTURA",
    "RIESGO",
    "CIERRE",
    "INSPIRACIÓN ÚTIL",
    "ESCUCHA",
    "RITMO",
    "COOPERACIÓN"
];
const JURADO_PASO_MAX_CONTROL = JURADO_CATEGORIAS_CONTROL.length + 1;
const normalizarModoVistaEspectador = (valor) => {
    const modo = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    return MODOS_VISTA_ESPECTADOR.has(modo) ? modo : "tutorial";
};
const normalizarEscalaUiEspectadorControl = (valor) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
        return ESCALA_UI_ESPECTADOR_CONTROL_MAX;
    }
    return Math.min(
        ESCALA_UI_ESPECTADOR_CONTROL_MAX,
        Math.max(ESCALA_UI_ESPECTADOR_CONTROL_MIN, numero)
    );
};

function actualizarControlesEscalaEspectadorControl() {
    const input = document.getElementById("escala_espectador");
    const valor = document.getElementById("escala_espectador_valor");
    const porcentaje = Math.round(normalizarEscalaUiEspectadorControl(escala_ui_espectador_control) * 100);
    if (input && Number(input.value) !== porcentaje) {
        input.value = String(porcentaje);
    }
    if (valor) {
        valor.textContent = `${porcentaje}%`;
    }
    if (typeof ESCALA_UI_ESPECTADOR !== "undefined") {
        ESCALA_UI_ESPECTADOR = porcentaje / 100;
    }
}

function obtenerEscalaEspectadorParametroControl() {
    const input = document.getElementById("escala_espectador");
    const porcentaje = input ? Number(input.value) : 100;
    const escala = Number.isFinite(porcentaje) ? porcentaje / 100 : 1;
    return normalizarEscalaUiEspectadorControl(escala);
}

function actualizarEscalaEspectadorControlDesdeParametro(opciones = {}) {
    const emitir = opciones.emitir !== false;
    escala_ui_espectador_control = obtenerEscalaEspectadorParametroControl();
    if (typeof ESCALA_UI_ESPECTADOR !== "undefined") {
        ESCALA_UI_ESPECTADOR = escala_ui_espectador_control;
    }
    actualizarControlesEscalaEspectadorControl();
    if (!emitir || typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
        emitirEstadoControlPersistente();
        return;
    }
    socket.emit("ajustar_escala_espectador", { valor: escala_ui_espectador_control });
    emitirEstadoControlPersistente();
}
window.actualizarEscalaEspectadorControlDesdeParametro = actualizarEscalaEspectadorControlDesdeParametro;

const ROLES_REINICIO_REMOTO_CONTROL = new Set([
    "escritxr1",
    "escritxr2",
    "espectador",
    "actorxs1",
    "actorxs2"
]);

function normalizarRolReinicioRemotoControl(rol) {
    const valor = String(rol || "")
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
    if (valor === "escritora1" || valor === "escritor1" || valor === "writer1") return "escritxr1";
    if (valor === "escritora2" || valor === "escritor2" || valor === "writer2") return "escritxr2";
    if (valor === "spectator") return "espectador";
    if (valor === "actores1" || valor === "actor1") return "actorxs1";
    if (valor === "actores2" || valor === "actor2") return "actorxs2";
    return ROLES_REINICIO_REMOTO_CONTROL.has(valor) ? valor : "";
}

function reiniciarRolRemoto(rol) {
    const destino = normalizarRolReinicioRemotoControl(rol);
    if (!destino || typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
        return;
    }
    const boton = document.querySelector(`[data-restart-role="${destino}"]`);
    if (
        (boton && boton.disabled)
        || (
            window
            && typeof window.rolRemotoConectadoControl === "function"
            && !window.rolRemotoConectadoControl(destino)
        )
    ) {
        return;
    }
    socket.emit("reiniciar_rol_remoto", { rol: destino });
}
window.reiniciarRolRemoto = reiniciarRolRemoto;

function actualizarBotonesVistaEspectadorControl() {
    const botonStats = document.getElementById("boton_vista_stats");
    const botonPuntuacion = document.getElementById("boton_vista_puntuacion");
    const botonNube = document.getElementById("boton_vista_nube_inspiracion");
    const botonCreditos = document.getElementById("boton_mostrar_creditos");
    const botonDeliberacion = document.getElementById("boton_vista_deliberacion");
    const botonResultadoVideojuego = document.getElementById("boton_resultado_videojuego");
    const botonResultadoJurado = document.getElementById("boton_resultado_jurado");
    const statsNav = document.getElementById("stats_nav_control");
    const statsNavLabel = document.getElementById("stats_nav_label");
    const statsPrev = document.getElementById("stats_nav_prev");
    const statsNext = document.getElementById("stats_nav_next");
    const puntuacionNav = document.getElementById("puntuacion_nav_control");
    const puntuacionLabel = document.getElementById("puntuacion_nav_label");
    const puntuacionPrev = document.getElementById("puntuacion_nav_prev");
    const puntuacionNext = document.getElementById("puntuacion_nav_next");
    const juradoNav = document.getElementById("jurado_nav_control");
    const juradoLabel = document.getElementById("jurado_nav_label");
    const juradoPrev = document.getElementById("jurado_nav_prev");
    const juradoNext = document.getElementById("jurado_nav_next");
    if (botonStats) {
        const activo = vista_espectador_modo === "stats";
        botonStats.dataset.active = activo ? "1" : "0";
        botonStats.classList.toggle("is-active", activo);
        botonStats.textContent = tJuego2PControl("control.button.stats", {}, "\u{1F4CA} STATS");
    }
    if (botonPuntuacion) {
        const activo = vista_espectador_modo === "puntuacion";
        const disponible = Boolean(estado_puntuacion_final_control && estado_puntuacion_final_control.disponible);
        botonPuntuacion.dataset.active = activo ? "1" : "0";
        botonPuntuacion.dataset.available = disponible ? "1" : "0";
        botonPuntuacion.classList.toggle("is-active", activo);
        botonPuntuacion.textContent = tJuego2PControl("control.button.result", {}, "\u{1F3C6} RESULTADO");
        botonPuntuacion.title = disponible
            ? tJuego2PControl("control.score.ready", {}, "Resultado listo para mostrar")
            : tJuego2PControl("control.score.unavailable", {}, "El resultado estara disponible cuando terminen ambas escritoras.");
        botonPuntuacion.setAttribute("aria-label", `${botonPuntuacion.textContent}. ${botonPuntuacion.title}`);
    }
    if (botonNube) {
        const activo = vista_espectador_modo === "nube_inspiracion";
        botonNube.dataset.active = activo ? "1" : "0";
        botonNube.classList.toggle("is-active", activo);
        botonNube.textContent = tJuego2PControl("control.button.cloud", {}, "\u2601\uFE0F NUBE DE INSPIRACI\u00d3N");
    }
    if (botonCreditos) {
        const activo = vista_espectador_modo === "creditos";
        botonCreditos.dataset.active = activo ? "1" : "0";
        botonCreditos.classList.toggle("is-active", activo);
        botonCreditos.setAttribute("aria-pressed", activo ? "true" : "false");
        botonCreditos.textContent = tJuego2PControl("control.button.show_credits", {}, "\u2B50 VISTA CR\u00c9DITOS");
    }
    if (botonDeliberacion) {
        const activo = vista_espectador_modo === "deliberacion";
        botonDeliberacion.dataset.active = activo ? "1" : "0";
        botonDeliberacion.classList.toggle("is-active", activo);
        botonDeliberacion.setAttribute("aria-pressed", activo ? "true" : "false");
    }
    if (botonResultadoVideojuego) {
        const activo = vista_espectador_modo === "puntuacion";
        botonResultadoVideojuego.dataset.active = activo ? "1" : "0";
        botonResultadoVideojuego.classList.toggle("is-active", activo);
        botonResultadoVideojuego.setAttribute("aria-pressed", activo ? "true" : "false");
    }
    if (botonResultadoJurado) {
        const activo = vista_espectador_modo === "resultado_jurado";
        const disponible = Boolean(estado_resultado_jurado_control?.disponible);
        botonResultadoJurado.dataset.active = activo ? "1" : "0";
        botonResultadoJurado.dataset.available = disponible ? "1" : "0";
        botonResultadoJurado.classList.toggle("is-active", activo);
        botonResultadoJurado.setAttribute("aria-pressed", activo ? "true" : "false");
        botonResultadoJurado.title = disponible
            ? "Veredicto listo para mostrar"
            : "El jurado todav\u00eda no ha completado su puntuaci\u00f3n";
    }
    if (statsNavLabel) {
        statsNavLabel.textContent = tJuego2PControl("control.stats.slides", {}, "\u{1F4CA} SLIDES STATS");
    }
    if (statsPrev) {
        statsPrev.setAttribute("aria-label", tJuego2PControl("control.stats.prev_aria", {}, "Slide anterior"));
    }
    if (statsNext) {
        statsNext.setAttribute("aria-label", tJuego2PControl("control.stats.next_aria", {}, "Slide siguiente"));
    }
    if (statsNav) {
        const visible = vista_espectador_modo === "stats";
        statsNav.hidden = !visible;
        statsNav.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    if (puntuacionPrev) {
        puntuacionPrev.textContent = "";
        puntuacionPrev.setAttribute("aria-label", tJuego2PControl("control.score.prev_aria", {}, "Revelacion anterior"));
        puntuacionPrev.disabled = puntuacion_slide_step_control <= 0;
    }
    if (puntuacionNext) {
        puntuacionNext.textContent = "";
        puntuacionNext.setAttribute("aria-label", tJuego2PControl("control.score.next_aria", {}, "Revelar siguiente apartado"));
        puntuacionNext.disabled = puntuacion_slide_step_control >= PUNTUACION_PASO_MAX_CONTROL;
    }
    if (puntuacionLabel) {
        let etiquetaPaso = tJuego2PControl("score.step.intro", {}, "INTRO");
        if (puntuacion_slide_step_control === PUNTUACION_PASO_MAX_CONTROL) {
            etiquetaPaso = tJuego2PControl("score.step.final", {}, "GANADOR");
        } else if (puntuacion_slide_step_control > 0) {
            const idCategoria = PUNTUACION_CATEGORIAS_CONTROL[puntuacion_slide_step_control - 1];
            etiquetaPaso = tJuego2PControl(`score.category.${idCategoria}.label`, {}, idCategoria.replace(/_/g, " ").toUpperCase());
        }
        const fases = ["EN MISTERIO", "DESVELAR AZUL", "DESVELAR ROJO Y GANADOR"];
        const detalle = puntuacion_slide_step_control > 0 && puntuacion_slide_step_control < PUNTUACION_PASO_MAX_CONTROL
            ? fases[puntuacion_reveal_phase_control]
            : "";
        const numeroSlide = puntuacion_slide_step_control + 1;
        const totalSlides = PUNTUACION_PASO_MAX_CONTROL + 1;
        puntuacionLabel.textContent = [
            `${etiquetaPaso} \u00b7 ${numeroSlide}/${totalSlides}`,
            detalle
        ].filter(Boolean).join(" \u00b7 ");
    }
    if (puntuacionNav) {
        const visible = vista_espectador_modo === "puntuacion";
        puntuacionNav.hidden = !visible;
        puntuacionNav.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    if (juradoPrev) juradoPrev.disabled = jurado_slide_step_control <= 0;
    if (juradoNext) {
        const criterioActual = estado_resultado_jurado_control?.revelacion?.criterios?.[jurado_slide_step_control - 1];
        const esperandoJurado = jurado_slide_step_control > 0
            && jurado_slide_step_control < JURADO_PASO_MAX_CONTROL
            && criterioActual
            && criterioActual.confirmado !== true;
        juradoNext.disabled = Boolean(esperandoJurado);
        juradoNext.setAttribute(
            "aria-label",
            jurado_slide_step_control >= JURADO_PASO_MAX_CONTROL
                ? "Mostrar ganador final"
                : "Revelar siguiente resultado"
        );
        juradoNext.title = esperandoJurado
            ? "EL JURADO DEBE CONFIRMAR ESTE APARTADO"
            : jurado_slide_step_control >= JURADO_PASO_MAX_CONTROL
            ? "MOSTRAR GANADOR FINAL"
            : "SIGUIENTE SLIDE";
    }
    if (juradoLabel) {
        let etiqueta = "PRESENTACIÓN";
        if (jurado_slide_step_control === JURADO_PASO_MAX_CONTROL) etiqueta = "VEREDICTO DEL JURADO";
        else if (jurado_slide_step_control > 0) etiqueta = JURADO_CATEGORIAS_CONTROL[jurado_slide_step_control - 1];
        juradoLabel.textContent = `${etiqueta} \u00b7 ${jurado_slide_step_control + 1}/${JURADO_PASO_MAX_CONTROL + 1}`;
    }
    if (juradoNav) {
        const visible = vista_espectador_modo === "resultado_jurado";
        juradoNav.hidden = !visible;
        juradoNav.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    actualizarBotonesVistaPrincipalControl();
    actualizarControlesEscalaEspectadorControl();
}

function cambiar_vista_espectador(modo) {
    if (temporizador_gigante_activo) {
        temporizador_gigante_activo = false;
        socket.emit("temporizador_gigante_detener", {});
    }
    const destino = normalizarModoVistaEspectador(modo);
    const siguiente = vista_espectador_modo === destino ? "partida" : destino;
    if (siguiente !== "partida" && vista_calentamiento) {
        vista_calentamiento = false;
        emitirVistaControl("cambiar_vista_calentamiento", { activo: false });
    }
    if (siguiente !== "partida") vista_principal_control = "partida";
    cerrarVideotutorialDesdeVistaControl();
    vista_espectador_modo = siguiente;
    actualizarBotonesVistaEspectadorControl();
    socket.emit("cambiar_vista_espectador_modo", { modo: siguiente });
}

function navegarSlidesStatsControl(direccion) {
    const dir = typeof direccion === "string" ? direccion.trim().toLowerCase() : "";
    if ((dir !== "prev" && dir !== "next") || vista_espectador_modo !== "stats") {
        return;
    }
    if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
        return;
    }
    socket.emit("stats_slide_control_navegar", { direccion: dir });
}

function mostrarPuntuacionFinal() {
    if (!socket || typeof socket.emit !== "function") return;
    if (temporizador_gigante_activo) {
        temporizador_gigante_activo = false;
        socket.emit("temporizador_gigante_detener", {});
    }
    if (!estado_puntuacion_final_control || estado_puntuacion_final_control.disponible !== true) {
        mostrarFeedbackPuntuacionControl(
            tJuego2PControl("control.score.unavailable", {}, "El resultado estara disponible cuando terminen ambas escritoras."),
            "pendiente"
        );
        socket.emit("pedir_puntuacion_final");
        return;
    }
    if (vista_calentamiento) {
        vista_calentamiento = false;
        emitirVistaControl("cambiar_vista_calentamiento", { activo: false });
    }
    cerrarVideotutorialDesdeVistaControl();
    vista_principal_control = "partida";
    socket.emit("mostrar_puntuacion_final", {}, (respuesta = {}) => {
        if (respuesta && respuesta.ok === true) return;
        mostrarFeedbackPuntuacionControl(
            tJuego2PControl("control.score.error", {}, "No se pudo mostrar el resultado. Vuelve a intentarlo."),
            "error"
        );
    });
}

function mostrarFeedbackPuntuacionControl(mensaje, tipo = "pendiente") {
    if (!document || !document.body) return;
    let feedback = document.getElementById("puntuacion_feedback_control");
    if (!feedback) {
        feedback = document.createElement("div");
        feedback.id = "puntuacion_feedback_control";
        feedback.className = "puntuacion-feedback-control";
        feedback.setAttribute("role", "status");
        feedback.setAttribute("aria-live", "polite");
        document.body.appendChild(feedback);
    }
    if (timeout_feedback_puntuacion_control) {
        clearTimeout(timeout_feedback_puntuacion_control);
    }
    feedback.dataset.tipo = tipo === "error" ? "error" : "pendiente";
    feedback.textContent = String(mensaje || "");
    feedback.classList.remove("is-visible");
    requestAnimationFrame(() => feedback.classList.add("is-visible"));
    timeout_feedback_puntuacion_control = setTimeout(() => {
        feedback.classList.remove("is-visible");
        timeout_feedback_puntuacion_control = null;
    }, 3600);
}

function navegarPuntuacionFinal(direccion) {
    if (!socket || typeof socket.emit !== "function" || vista_espectador_modo !== "puntuacion") return;
    if (direccion === "anterior") {
        socket.emit("puntuacion_final_anterior");
        return;
    }
    if (direccion === "siguiente") {
        socket.emit("puntuacion_final_siguiente");
    }
}

function reiniciarPuntuacionFinal() {
    mostrarPuntuacionFinal();
}

function ocultarPuntuacionFinal() {
    if (!socket || typeof socket.emit !== "function") return;
    socket.emit("ocultar_puntuacion_final");
}

function actualizarEstadoPuntuacionFinalControl(payload = {}) {
    estado_puntuacion_final_control = payload && typeof payload === "object" ? payload : null;
    actualizarBotonesVistaEspectadorControl();
}

window.mostrarPuntuacionFinal = mostrarPuntuacionFinal;
window.navegarPuntuacionFinal = navegarPuntuacionFinal;
window.reiniciarPuntuacionFinal = reiniciarPuntuacionFinal;
window.ocultarPuntuacionFinal = ocultarPuntuacionFinal;
window.actualizarEstadoPuntuacionFinalControl = actualizarEstadoPuntuacionFinalControl;
window.mostrarFeedbackPuntuacionControl = mostrarFeedbackPuntuacionControl;

function mostrarVistaDeliberacion() {
    if (vista_espectador_modo === "deliberacion") {
        actualizarBotonesVistaEspectadorControl();
        return;
    }
    cambiar_vista_espectador("deliberacion");
}

function mostrarResultadoVideojuego() {
    mostrarPuntuacionFinal();
}

function mostrarResultadoJurado() {
    if (!socket || typeof socket.emit !== "function") return;
    if (!estado_resultado_jurado_control?.disponible) {
        const estado = document.getElementById("deliberacion_estado_control");
        if (estado) estado.textContent = "El jurado todav\u00eda no ha completado su puntuaci\u00f3n.";
        socket.emit("pedir_jurado_resultado");
        return;
    }
    if (temporizador_gigante_activo) {
        temporizador_gigante_activo = false;
        socket.emit("temporizador_gigante_detener", {});
    }
    cerrarVideotutorialDesdeVistaControl();
    socket.emit("mostrar_resultado_jurado", {}, (respuesta = {}) => {
        if (respuesta.ok === true) return;
        const estado = document.getElementById("deliberacion_estado_control");
        if (estado) estado.textContent = "No se pudo mostrar el resultado del jurado.";
    });
}

function actualizarResultadoJuradoControl(payload = {}) {
    estado_resultado_jurado_control = payload && typeof payload === "object" ? payload : null;
    const estado = document.getElementById("deliberacion_estado_control");
    if (estado) {
        const criterioActual = estado_resultado_jurado_control?.revelacion?.criterios?.[jurado_slide_step_control - 1];
        estado.textContent = estado_resultado_jurado_control?.disponible
            ? (criterioActual && criterioActual.confirmado !== true
                ? "El jurado est\u00e1 ajustando las barras en directo. Confirma para continuar."
                : "Veredicto del jurado listo para mostrar.")
            : "El resultado del jurado aparecer\u00e1 cuando haya puntuado a ambas escritoras.";
    }
    actualizarBotonesVistaEspectadorControl();
}

function navegarResultadoJurado(direccion) {
    if (!socket || typeof socket.emit !== "function" || vista_espectador_modo !== "resultado_jurado") return;
    if (direccion !== "anterior" && jurado_slide_step_control >= JURADO_PASO_MAX_CONTROL) {
        socket.emit("mostrar_resultado_final", {}, (respuesta = {}) => {
            if (respuesta.ok === true) return;
            const estado = document.getElementById("deliberacion_estado_control");
            if (estado) estado.textContent = "No se pudo mostrar el ganador final.";
        });
        return;
    }
    socket.emit(direccion === "anterior" ? "jurado_resultado_anterior" : "jurado_resultado_siguiente", {}, (respuesta = {}) => {
        if (respuesta.ok !== false) return;
        const estado = document.getElementById("deliberacion_estado_control");
        if (estado && respuesta.code === "JURY_CRITERION_NOT_CONFIRMED") {
            estado.textContent = "El jurado debe confirmar las dos puntuaciones antes de continuar.";
        }
    });
}

window.mostrarVistaDeliberacion = mostrarVistaDeliberacion;
window.mostrarResultadoVideojuego = mostrarResultadoVideojuego;
window.mostrarResultadoJurado = mostrarResultadoJurado;
window.actualizarResultadoJuradoControl = actualizarResultadoJuradoControl;
window.navegarResultadoJurado = navegarResultadoJurado;

function actualizarModoVistaEspectadorControl(payload = {}) {
    const modoServidor = typeof payload.modo === "string" ? payload.modo.trim().toLowerCase() : "tutorial";
    vista_espectador_modo = normalizarModoVistaEspectador(modoServidor);
    if (Object.prototype.hasOwnProperty.call(payload, "calentamiento_vista")) {
        vista_calentamiento = Boolean(payload.calentamiento_vista);
    }
    if (modoServidor === "tutorial") {
        vista_principal_control = "tutorial";
    } else if (modoServidor === "calentamiento" || vista_calentamiento) {
        vista_principal_control = "detonadores";
    } else if (vista_espectador_modo === "partida") {
        vista_principal_control = "partida";
    }
    if (payload && Object.prototype.hasOwnProperty.call(payload, "puntuacion_slide_step")) {
        const paso = Number(payload.puntuacion_slide_step);
        puntuacion_slide_step_control = Number.isFinite(paso)
            ? Math.max(0, Math.min(PUNTUACION_PASO_MAX_CONTROL, Math.trunc(paso)))
            : 0;
    }
    if (payload && Object.prototype.hasOwnProperty.call(payload, "puntuacion_reveal_phase")) {
        const fase = Number(payload.puntuacion_reveal_phase);
        puntuacion_reveal_phase_control = Number.isFinite(fase)
            ? Math.max(0, Math.min(2, Math.trunc(fase)))
            : 0;
    }
    if (payload && Object.prototype.hasOwnProperty.call(payload, "jurado_slide_step")) {
        const paso = Number(payload.jurado_slide_step);
        jurado_slide_step_control = Number.isFinite(paso)
            ? Math.max(0, Math.min(JURADO_PASO_MAX_CONTROL, Math.trunc(paso)))
            : 0;
    }
    const estadoDeliberacion = document.getElementById("deliberacion_estado_control");
    if (estadoDeliberacion && vista_espectador_modo === "resultado_final") {
        estadoDeliberacion.textContent = "Ganador final revelado con la puntuación del videojuego y del jurado.";
    }
    if (payload && Object.prototype.hasOwnProperty.call(payload, "escala_ui")) {
        escala_ui_espectador_control = normalizarEscalaUiEspectadorControl(payload.escala_ui);
    }
    actualizarBotonesVistaEspectadorControl();
}

function mostrarCreditosEspectador() {
    const creditos = obtenerCreditosDesdePanelControl();
    creditos_estado_control = { ...creditos };
    if (vista_espectador_modo === "creditos") {
        actualizarBotonesVistaEspectadorControl();
        return;
    }
    if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
        vista_espectador_modo = "creditos";
        actualizarBotonesVistaEspectadorControl();
        return;
    }

    if (temporizador_gigante_activo) {
        temporizador_gigante_activo = false;
        socket.emit("temporizador_gigante_detener", {});
    }
    if (vista_calentamiento) {
        vista_calentamiento = false;
        emitirVistaControl("cambiar_vista_calentamiento", { activo: false });
    }
    cerrarVideotutorialDesdeVistaControl();

    vista_espectador_modo = "creditos";
    actualizarBotonesVistaEspectadorControl();
    socket.emit("creditos_actualizar", { creditos });
    socket.emit("mostrar_creditos_espectador", { creditos });
}

const ORDEN_SOLICITUD_CALENTAMIENTO = ["lugares", "acciones", "frase_final"];
const SOLICITUD_CALENTAMIENTO_NINGUNA = "ninguna";
const SOLICITUD_CALENTAMIENTO_POR_DEFECTO = SOLICITUD_CALENTAMIENTO_NINGUNA;
const TIPOS_SOLICITUD_CALENTAMIENTO = new Set([
    SOLICITUD_CALENTAMIENTO_NINGUNA,
    ...ORDEN_SOLICITUD_CALENTAMIENTO
]);
let solicitud_calentamiento_actual = SOLICITUD_CALENTAMIENTO_POR_DEFECTO;
let ultimo_payload_solicitud_calentamiento_control = { tipo: SOLICITUD_CALENTAMIENTO_POR_DEFECTO };
const estado_autofill_frase_final_calentamiento = {
    1: { id: "", palabra: "", musa_nombre: "" },
    2: { id: "", palabra: "", musa_nombre: "" }
};

function normalizarFinalCalentamientoControl(entrada) {
    if (!entrada || typeof entrada !== "object") return null;
    const palabra = normalizarFraseFinal(entrada.palabra);
    if (!palabra) return null;
    return {
        id: typeof entrada.id === "string" ? entrada.id.trim() : "",
        palabra,
        musa_nombre: obtenerFirmaInspiracionMusaControl(entrada).completo
    };
}

function sincronizarFraseFinalControlDesdeCalentamiento(equipo, dataEquipo = {}) {
    const input = equipo === 1 ? frase_final_j1 : frase_final_j2;
    if (!input) return;
    const autorEl = document.getElementById(`frase_final_musa_j${equipo}`);
    const estadoPrevio = estado_autofill_frase_final_calentamiento[equipo] || { id: "", palabra: "", musa_nombre: "" };
    const finalCalentamiento = normalizarFinalCalentamientoControl(dataEquipo && dataEquipo.final);
    if (!finalCalentamiento) {
        estadoPrevio.id = "";
        estadoPrevio.palabra = "";
        estadoPrevio.musa_nombre = "";
        estado_autofill_frase_final_calentamiento[equipo] = estadoPrevio;
        if (autorEl) {
            autorEl.textContent = "";
            autorEl.hidden = true;
            autorEl.title = "";
        }
        return;
    }

    const idServidor = finalCalentamiento.id || "";
    const cambioFinalServidor = idServidor
        ? idServidor !== estadoPrevio.id
        : finalCalentamiento.palabra !== estadoPrevio.palabra;
    const valorActualInput = normalizarFraseFinal(input.value);
    const debeAplicar = cambioFinalServidor || !valorActualInput || valorActualInput === estadoPrevio.palabra;

    if (debeAplicar) {
        input.value = finalCalentamiento.palabra;
    }

    estadoPrevio.id = idServidor;
    estadoPrevio.palabra = finalCalentamiento.palabra;
    estadoPrevio.musa_nombre = finalCalentamiento.musa_nombre;
    estado_autofill_frase_final_calentamiento[equipo] = estadoPrevio;
    if (autorEl) {
        autorEl.textContent = finalCalentamiento.musa_nombre
            ? `\u2726 ${finalCalentamiento.musa_nombre}`
            : "";
        autorEl.hidden = !finalCalentamiento.musa_nombre;
        autorEl.title = finalCalentamiento.musa_nombre
            ? `Inspiraci\u00f3n de ${finalCalentamiento.musa_nombre}`
            : "";
    }
}

function actualizarSolicitudCalentamientoControl(payload = {}) {
    const tipoRecibido = (payload && typeof payload.solicitud === "string")
        ? payload.solicitud
        : (payload && typeof payload.tipo === "string" ? payload.tipo : SOLICITUD_CALENTAMIENTO_POR_DEFECTO);
    const tipo = TIPOS_SOLICITUD_CALENTAMIENTO.has(tipoRecibido) ? tipoRecibido : SOLICITUD_CALENTAMIENTO_POR_DEFECTO;
    solicitud_calentamiento_actual = tipo;
    ultimo_payload_solicitud_calentamiento_control = payload && typeof payload === "object"
        ? { ...payload, solicitud: tipo }
        : { tipo };

    const botones = document.querySelectorAll("[data-solicitud-calentamiento]");
    botones.forEach((boton) => {
        const activo = boton.dataset.solicitudCalentamiento === tipo;
        boton.dataset.active = activo ? "1" : "0";
        boton.classList.toggle("is-active", activo);
        boton.setAttribute("aria-pressed", activo ? "true" : "false");
    });

    const flujo = document.getElementById("calentamiento_flujo_estado");
    if (flujo && payload && payload.equipos) {
        const equipos = payload && payload.equipos ? payload.equipos : {};
        const formatear = (equipoData = {}) => {
            const final = equipoData && equipoData.final && typeof equipoData.final.palabra === "string"
                ? equipoData.final.palabra.trim()
                : "";
            if (final) {
                const compacta = final.toUpperCase().slice(0, 18);
                return tJuego2PControl("control.warmup.flow.final", { word: compacta }, `FINAL ${compacta}`);
            }
            if (equipoData && equipoData.bloqueado) {
                return tJuego2PControl("control.warmup.flow.blocked", {}, "BLOQUEADO");
            }
            return tJuego2PControl("control.warmup.flow.open", {}, "ABIERTO");
        };
        const estadoJ1 = formatear(equipos[1] || {});
        const estadoJ2 = formatear(equipos[2] || {});
        flujo.textContent = tJuego2PControl("control.warmup.flow.summary", { j1: estadoJ1, j2: estadoJ2 }, `J1: ${estadoJ1} | J2: ${estadoJ2}`);
    }

    if (payload && payload.equipos) {
        const equipos = payload.equipos || {};
        sincronizarFraseFinalControlDesdeCalentamiento(1, equipos[1] || {});
        sincronizarFraseFinalControlDesdeCalentamiento(2, equipos[2] || {});
    }
}

function pedir_solicitud_calentamiento(tipo) {
    const tipoSolicitado = TIPOS_SOLICITUD_CALENTAMIENTO.has(tipo) ? tipo : SOLICITUD_CALENTAMIENTO_POR_DEFECTO;
    const destino = (
        tipoSolicitado !== SOLICITUD_CALENTAMIENTO_POR_DEFECTO &&
        tipoSolicitado === solicitud_calentamiento_actual
    )
        ? SOLICITUD_CALENTAMIENTO_POR_DEFECTO
        : tipoSolicitado;
    socket.emit("calentamiento_solicitud", { tipo: destino });
    actualizarSolicitudCalentamientoControl({ tipo: destino });
}

actualizarSolicitudCalentamientoControl({ tipo: SOLICITUD_CALENTAMIENTO_POR_DEFECTO });

let parametros_visibles = false;
let creditos_visibles = false;
let teleprompter_visible = false;
let panel_control_previo_teleprompter = "controles";
let teleprompter_emit_timeout = null;
let creditos_emit_timeout = null;
let listeners_creditos_inicializados = false;

const TELEPROMPTER_LIMITS_CONTROL = {
    ...window.ScribTeleprompter.LIMITS,
    fontMax: 80,
    speedMax: 200
};
const TELEPROMPTER_FONT_MIN = TELEPROMPTER_LIMITS_CONTROL.fontMin;
const TELEPROMPTER_FONT_MAX = TELEPROMPTER_LIMITS_CONTROL.fontMax;
const TELEPROMPTER_SPEED_MIN = TELEPROMPTER_LIMITS_CONTROL.speedMin;
const TELEPROMPTER_SPEED_MAX = TELEPROMPTER_LIMITS_CONTROL.speedMax;
const CREDITOS_AGRADECIMIENTOS_MAX = window.ScribCredits.THANKS_MAX;
const PANEL_CONTROL_MODOS = new Set(["controles", "parametros", "creditos", "teleprompter"]);
const CAMPOS_CREDITOS_CONTROL = window.ScribCredits.CONTROL_FIELDS;
const CAMPO_AGRADECIMIENTOS_CONTROL = window.ScribCredits.CONTROL_THANKS_FIELD;
let creditos_estado_control = { ...window.ScribCredits.DEFAULT_STATE };

const teleprompter_state = window.ScribTeleprompter.crearEstado();

const TELEPROMPTER_ACK_TIMEOUT_MS = 4200;
let teleprompter_load_seq = 0;
let teleprompter_revision_seq = 0;
let teleprompter_espera_ack = null;
let teleprompter_ack_timeout = null;

function obtenerRevisionTeleprompterControlActual() {
    return Number(teleprompter_state.revision) || 0;
}

function extraerRevisionTeleprompterControl(state = {}) {
    return window.ScribTeleprompter.normalizarRevision(state && state.revision);
}

function marcarCambioTeleprompterLocalControl() {
    teleprompter_revision_seq = Math.max(teleprompter_revision_seq + 1, Number(teleprompter_state.revision) || 0);
    teleprompter_state.revision = teleprompter_revision_seq;
    return teleprompter_state.revision;
}

function actualizarEstadoCargaTeleprompter(mensaje, tipo = "idle") {
    const estado = document.getElementById("teleprompter_estado_carga");
    if (!estado) return;
    estado.textContent = mensaje || tJuego2PControl("control.teleprompter.status.empty", {}, "Sin carga en teleprompter");
    estado.className = `teleprompter-status teleprompter-status--${tipo}`;
}

function reiniciarEstadoCargaTeleprompterControl() {
    actualizarEstadoCargaTeleprompter("", "idle");
}

function limpiarEsperaAckTeleprompter() {
    teleprompter_espera_ack = null;
    if (teleprompter_ack_timeout) {
        clearTimeout(teleprompter_ack_timeout);
        teleprompter_ack_timeout = null;
    }
}

function iniciarEsperaAckTeleprompter(loadId, source) {
    limpiarEsperaAckTeleprompter();
    const revision = obtenerRevisionTeleprompterControlActual();
    teleprompter_espera_ack = {
        loadId: Number(loadId) || 0,
        source: source === 2 ? 2 : 1,
        startedAt: Date.now(),
        revision
    };
    teleprompter_ack_timeout = setTimeout(() => {
        if (!teleprompter_espera_ack || teleprompter_espera_ack.loadId !== loadId) return;
        if (teleprompter_espera_ack.revision !== revision) return;
        if (obtenerRevisionTeleprompterControlActual() !== revision) return;
        const etiqueta = teleprompter_espera_ack.source === 2 ? "J2" : "J1";
        actualizarEstadoCargaTeleprompter(`Texto ${etiqueta} enviado, sin confirmaciÃ³n del espectador`, "error");
    }, TELEPROMPTER_ACK_TIMEOUT_MS);
}

function procesarTeleprompterAckControl(payload = {}) {
    const loadId = Number(payload.loadId);
    if (!Number.isFinite(loadId) || loadId <= 0) return;
    if (!teleprompter_espera_ack || teleprompter_espera_ack.loadId !== loadId) return;

    const source = Number(payload.source) === 2 ? 2 : 1;
    const etiqueta = source === 2 ? "J2" : "J1";
    const textoRenderizado = Boolean(payload.rendered);
    const timerActivo = Boolean(payload.timerActive);
    const visible = Boolean(payload.visible);

    limpiarEsperaAckTeleprompter();
    if (!textoRenderizado) {
        actualizarEstadoCargaTeleprompter(`Texto ${etiqueta} no renderizado en espectador`, "error");
        return;
    }
    if (timerActivo && !visible) {
        actualizarEstadoCargaTeleprompter(`Texto ${etiqueta} cargado (oculto por temporizador de 10 minutos)`, "warn");
        return;
    }
    if (visible) {
        actualizarEstadoCargaTeleprompter(`Texto ${etiqueta} cargado y visible en espectador`, "ok");
        return;
    }
    actualizarEstadoCargaTeleprompter(`Texto ${etiqueta} cargado en espectador`, "ok");
}

function sincronizarTeleprompterEstadoControl(state = {}) {
    if (!state || typeof state !== "object") return;
    const revision = extraerRevisionTeleprompterControl(state);
    if (window.ScribTeleprompter.esEstadoObsoleto(state, teleprompter_state.revision)) {
        return;
    }
    window.ScribTeleprompter.aplicarEstado(teleprompter_state, state, TELEPROMPTER_LIMITS_CONTROL);
    if (revision !== null) {
        teleprompter_revision_seq = Math.max(teleprompter_revision_seq, revision);
    }
    actualizarTeleprompterUI();
}

if (typeof window !== "undefined") {
    window.procesarTeleprompterAckControl = procesarTeleprompterAckControl;
    window.sincronizarTeleprompterEstadoControl = sincronizarTeleprompterEstadoControl;
    window.resetTeleprompterSyncControl2P = () => {
        invalidarContextoTeleprompterControl({ reiniciarEstadoCarga: true });
        teleprompter_revision_seq = 0;
        teleprompter_state.revision = 0;
    };
}

const animateCSS = window.ScribRuntime.animateCSS;

const normalizarTextoCreditoControl = window.ScribCredits.normalizarTexto;
const normalizarTextoAgradecimientosControl = window.ScribCredits.normalizarAgradecimientos;
const normalizarEstadoCreditosControl = window.ScribCredits.normalizarEstado;

const aplicarCreditosEnPanelControl = (estado = {}) => {
    const data = normalizarEstadoCreditosControl(estado);
    creditos_estado_control = { ...data };
    CAMPOS_CREDITOS_CONTROL.forEach(([clave, id]) => {
        const input = document.getElementById(id);
        if (!input) return;
        if (input.value !== data[clave]) {
            input.value = data[clave];
        }
    });
    const textarea = document.getElementById(CAMPO_AGRADECIMIENTOS_CONTROL[1]);
    if (textarea && textarea.value !== data.agradecimientos) {
        textarea.value = data.agradecimientos;
    }
};

function obtenerCreditosDesdePanelControl() {
    const data = { ...creditos_estado_control };
    CAMPOS_CREDITOS_CONTROL.forEach(([clave, id, max]) => {
        const input = document.getElementById(id);
        if (!input) return;
        data[clave] = normalizarTextoCreditoControl(input.value, max);
    });
    const textarea = document.getElementById(CAMPO_AGRADECIMIENTOS_CONTROL[1]);
    if (textarea) {
        data.agradecimientos = normalizarTextoAgradecimientosControl(textarea.value, CREDITOS_AGRADECIMIENTOS_MAX);
    }
    return normalizarEstadoCreditosControl(data);
}

function emitirCreditosControl(inmediato = false) {
    if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") return;
    const creditos = obtenerCreditosDesdePanelControl();
    creditos_estado_control = { ...creditos };
    if (inmediato) {
        invalidarEmisionCreditosControl();
        socket.emit("creditos_actualizar", { creditos });
        return;
    }
    if (creditos_emit_timeout) return;
    const revisionProgramada = obtenerRevisionEmisionCreditosControl();
    creditos_emit_timeout = setTimeout(() => {
        creditos_emit_timeout = null;
        if (obtenerRevisionEmisionCreditosControl() !== revisionProgramada) return;
        socket.emit("creditos_actualizar", { creditos: obtenerCreditosDesdePanelControl() });
    }, 120);
}

function inicializarPanelCreditosControl() {
    if (listeners_creditos_inicializados) return;
    const ids = CAMPOS_CREDITOS_CONTROL.map(([, id]) => id);
    ids.push(CAMPO_AGRADECIMIENTOS_CONTROL[1]);
    const elementos = ids
        .map((id) => document.getElementById(id))
        .filter((el) => Boolean(el));
    if (!elementos.length) return;
    listeners_creditos_inicializados = true;
    elementos.forEach((el) => {
        el.addEventListener("input", () => {
            creditos_estado_control = obtenerCreditosDesdePanelControl();
            emitirCreditosControl();
        });
        el.addEventListener("change", () => {
            creditos_estado_control = obtenerCreditosDesdePanelControl();
            emitirCreditosControl(true);
        });
    });
    aplicarCreditosEnPanelControl(creditos_estado_control);
}

window.actualizarCreditosControlRemoto = (payload = {}) => {
    const creditos = (payload && typeof payload === "object" && payload.creditos)
        ? payload.creditos
        : payload;
    aplicarCreditosEnPanelControl(creditos);
};

function actualizarBotonesPanelSuperiorControl() {
    const botonParametros = document.getElementById("boton_parametros");
    const botonCreditos = document.getElementById("boton_editar_creditos")
        || document.getElementById("boton_creditos");
    if (botonParametros) {
        botonParametros.dataset.active = parametros_visibles ? "1" : "0";
        botonParametros.classList.toggle("is-active", parametros_visibles);
        botonParametros.textContent = parametros_visibles
            ? tJuego2PControl("control.button.controls", {}, "\u{1F3AE} CONTROLES")
            : tJuego2PControl("control.button.parameters", {}, "\u2699\uFE0F PAR\u00c1METROS");
    }
    if (botonCreditos) {
        botonCreditos.dataset.active = creditos_visibles ? "1" : "0";
        botonCreditos.classList.toggle("is-active", creditos_visibles);
        botonCreditos.setAttribute("aria-expanded", creditos_visibles ? "true" : "false");
        botonCreditos.textContent = tJuego2PControl("control.button.edit_credits", {}, "\u{1F4DD} EDITAR CR\u00c9DITOS");
    }
}

function prepararCreditosFinalControl() {
    const host = document.getElementById("panel_creditos_final");
    const panelLegacy = document.getElementById("panel_creditos");
    const panel = (host && host.querySelector(".creditos-panel"))
        || (panelLegacy && panelLegacy.querySelector(".creditos-panel"));
    if (host && panel && panel.parentElement !== host) {
        host.appendChild(panel);
    }
    if (panelLegacy && panelLegacy !== host) {
        panelLegacy.classList.add("panel-oculto");
    }
    return host || panelLegacy;
}

function obtenerPanelTeleprompterRepresentacionControl() {
    return document.getElementById("panel_teleprompter_representacion")
        || document.getElementById("panel_teleprompter");
}

function prepararTeleprompterRepresentacionControl() {
    const host = document.getElementById("panel_teleprompter_representacion");
    const panelLegacy = document.getElementById("panel_teleprompter");
    const panel = (host && host.querySelector(".teleprompter-panel"))
        || (panelLegacy && panelLegacy.querySelector(".teleprompter-panel"));
    if (host && panel && panel.parentElement !== host) {
        host.appendChild(panel);
    }
    if (panelLegacy && panelLegacy !== host) {
        panelLegacy.classList.add("panel-oculto");
    }
    return host || panelLegacy;
}

function aplicarVistaPanelControl(vistaDestino) {
    const destino = PANEL_CONTROL_MODOS.has(vistaDestino) ? vistaDestino : "controles";
    const salirDeTeleprompter = teleprompter_visible && destino !== "teleprompter";
    const salirDeCreditos = creditos_visibles && destino !== "creditos";
    const panelControles = document.getElementById("panel_controles");
    const panelParametros = document.getElementById("panel_parametros");
    const panelParametrosExtra = document.getElementById("panel_parametros_extra");
    const panelCreditos = prepararCreditosFinalControl();
    const panelCreditosLegacy = document.getElementById("panel_creditos");
    const panelTeleprompter = prepararTeleprompterRepresentacionControl();
    const panelTeleprompterLegacy = document.getElementById("panel_teleprompter");
    const panelRepresentacion = document.querySelector('[data-control-section="representacion"]');
    const panelFinal = document.querySelector('[data-control-section="final"]');

    if (salirDeTeleprompter) {
        teleprompter_state.visible = false;
        teleprompter_state.preparing = false;
        teleprompter_state.playing = false;
        invalidarContextoTeleprompterControl({ reiniciarEstadoCarga: true });
    }
    if (salirDeCreditos) {
        invalidarEmisionCreditosControl({ emitirPendiente: true });
    }

    parametros_visibles = destino === "parametros";
    creditos_visibles = destino === "creditos";
    teleprompter_visible = destino === "teleprompter";

    if (panelControles) panelControles.classList.add("panel-oculto");
    if (panelParametros) panelParametros.classList.add("panel-oculto");
    if (panelParametrosExtra) panelParametrosExtra.classList.add("panel-oculto");
    if (panelCreditosLegacy && panelCreditosLegacy !== panelCreditos) {
        panelCreditosLegacy.classList.add("panel-oculto");
    }
    if (panelCreditos) {
        panelCreditos.classList.add("panel-oculto");
        panelCreditos.setAttribute("aria-hidden", "true");
    }
    if (panelTeleprompterLegacy && panelTeleprompterLegacy !== panelTeleprompter) {
        panelTeleprompterLegacy.classList.add("panel-oculto");
    }
    if (panelTeleprompter) {
        panelTeleprompter.classList.add("panel-oculto");
        panelTeleprompter.setAttribute("aria-hidden", "true");
    }
    if (panelRepresentacion) {
        panelRepresentacion.classList.remove("is-teleprompter-open");
    }
    if (panelFinal) {
        panelFinal.classList.remove("is-creditos-open");
    }

    if (destino === "parametros") {
        if (panelControles) {
            panelControles.classList.remove("panel-oculto");
        }
        if (panelParametros) {
            panelParametros.classList.remove("panel-oculto");
            animateCSS(panelParametros, "fadeInLeft");
        }
        if (panelParametrosExtra) {
            panelParametrosExtra.classList.remove("panel-oculto");
            animateCSS(panelParametrosExtra, "fadeInLeft");
        }
        if (typeof asegurarCasillasModos === "function") {
            asegurarCasillasModos();
        }
    } else if (destino === "creditos") {
        inicializarPanelCreditosControl();
        if (panelControles) {
            panelControles.classList.remove("panel-oculto");
        }
        activarSeccionControl("final");
        if (panelFinal) {
            panelFinal.classList.add("is-creditos-open");
        }
        if (panelCreditos) {
            panelCreditos.classList.remove("panel-oculto");
            panelCreditos.setAttribute("aria-hidden", "false");
            animateCSS(panelCreditos, "fadeIn");
        }
    } else if (destino === "teleprompter") {
        if (panelControles) {
            panelControles.classList.remove("panel-oculto");
        }
        activarSeccionControl("representacion");
        if (panelRepresentacion) {
            panelRepresentacion.classList.add("is-teleprompter-open");
        }
        if (panelTeleprompter) {
            panelTeleprompter.classList.remove("panel-oculto");
            panelTeleprompter.setAttribute("aria-hidden", "false");
            animateCSS(panelTeleprompter, "fadeIn");
        }
    } else if (panelControles) {
        panelControles.classList.remove("panel-oculto");
        if (panelParametros) {
            panelParametros.classList.remove("panel-oculto");
        }
    }

    actualizarBotonesPanelSuperiorControl();
}

function toggleParametros() {
    const teleprompterEstabaActivo = teleprompter_visible;
    if (teleprompterEstabaActivo) {
        teleprompter_state.visible = false;
        teleprompter_state.preparing = false;
        teleprompter_state.playing = false;
        marcarCambioTeleprompterLocalControl();
    }
    const mostrarParametros = teleprompterEstabaActivo ? true : !parametros_visibles;
    aplicarVistaPanelControl(mostrarParametros ? "parametros" : "controles");
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}

function toggleCreditos() {
    const teleprompterEstabaActivo = teleprompter_visible;
    if (teleprompterEstabaActivo) {
        teleprompter_state.visible = false;
        teleprompter_state.preparing = false;
        teleprompter_state.playing = false;
        marcarCambioTeleprompterLocalControl();
    }
    const mostrarCreditos = teleprompterEstabaActivo ? true : !creditos_visibles;
    aplicarVistaPanelControl(mostrarCreditos ? "creditos" : "controles");
    inicializarPanelCreditosControl();
    if (mostrarCreditos) {
        emitirCreditosControl(true);
    }
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}

function volverMenuFinalCreditos() {
    aplicarVistaPanelControl("controles");
    activarSeccionControl("final");
}

if (typeof window !== "undefined") {
    window.volverMenuFinalCreditos = volverMenuFinalCreditos;
}

function actualizarTeleprompterUI() {
    const fontLabel = document.getElementById("teleprompter_font_size");
    const speedLabel = document.getElementById("teleprompter_speed");
    const playBtn = document.getElementById("teleprompter_play");
    const fontMeter = document.getElementById("teleprompter_font_meter");
    const speedMeter = document.getElementById("teleprompter_speed_meter");
    if (fontLabel) {
        fontLabel.textContent = Math.round(teleprompter_state.fontSize);
    }
    if (speedLabel) {
        speedLabel.textContent = Math.round(teleprompter_state.speed);
    }
    if (playBtn) {
        playBtn.textContent = teleprompter_state.playing
            ? tJuego2PControl("control.teleprompter.pause", {}, "\u23F8\uFE0F PAUSA")
            : tJuego2PControl("control.teleprompter.play", {}, "\u25B6\uFE0F PLAY");
    }
    if (fontMeter) {
        const pct = (teleprompter_state.fontSize - TELEPROMPTER_FONT_MIN) / (TELEPROMPTER_FONT_MAX - TELEPROMPTER_FONT_MIN);
        fontMeter.style.width = `${Math.max(0, Math.min(1, pct)) * 100}%`;
    }
    if (speedMeter) {
        const pct = (teleprompter_state.speed - TELEPROMPTER_SPEED_MIN) / (TELEPROMPTER_SPEED_MAX - TELEPROMPTER_SPEED_MIN);
        speedMeter.style.width = `${Math.max(0, Math.min(1, pct)) * 100}%`;
    }
    const botonTeleprompter = document.getElementById("boton_teleprompter");
    if (botonTeleprompter) {
        botonTeleprompter.textContent = teleprompter_visible
            ? tJuego2PControl("control.teleprompter.controls", {}, "\u{1F399}\uFE0F CONTROLES")
            : tJuego2PControl("control.button.teleprompter", {}, "\u{1F399}\uFE0F TELEPROMPTER");
    }
    if (typeof actualizarBotonesTeleprompterCarga === "function") {
        actualizarBotonesTeleprompterCarga();
    }
}

function obtenerTextoJugadorParaRepresentacion(jugador) {
    const esJ2 = jugador === 2;
    const nodoTexto = esJ2
        ? ((typeof texto2 !== "undefined" && texto2) ? texto2 : null)
        : ((typeof texto1 !== "undefined" && texto1) ? texto1 : null);
    const textoVisible = nodoTexto ? String(nodoTexto.innerText || "").trim() : "";
    if (textoVisible) {
        return textoVisible;
    }
    const respaldo = esJ2
        ? (typeof texto_guardado2 === "string" ? texto_guardado2 : "")
        : (typeof texto_guardado1 === "string" ? texto_guardado1 : "");
    return String(respaldo || "").trim();
}

function actualizarBotonesTeleprompterCarga() {
    const btnJ1 = document.getElementById("teleprompter_cargar_j1");
    const btnJ2 = document.getElementById("teleprompter_cargar_j2");
    const textoJ1 = obtenerTextoJugadorParaRepresentacion(1);
    const textoJ2 = obtenerTextoJugadorParaRepresentacion(2);
    const habilJ1 = textoJ1.length > 0;
    const habilJ2 = textoJ2.length > 0;
    if (btnJ1) {
        btnJ1.disabled = !habilJ1;
        btnJ1.classList.toggle("teleprompter-btn-disabled", !habilJ1);
    }
    if (btnJ2) {
        btnJ2.disabled = !habilJ2;
        btnJ2.classList.toggle("teleprompter-btn-disabled", !habilJ2);
    }
}

window.actualizarBotonesTeleprompterCarga = actualizarBotonesTeleprompterCarga;

function emitirTeleprompter(inmediato = false) {
    if (!socket) return;
    const textoActivo = typeof teleprompter_state.text === "string" && teleprompter_state.text.trim().length > 0;
    teleprompter_state.visible = teleprompter_visible && textoActivo && !teleprompter_state.preparing;
    if (inmediato) {
        if (teleprompter_emit_timeout) {
            clearTimeout(teleprompter_emit_timeout);
            teleprompter_emit_timeout = null;
        }
        socket.emit('teleprompter_control', { state: { ...teleprompter_state } });
        return;
    }
    if (teleprompter_emit_timeout) return;
    const revisionProgramada = obtenerRevisionTeleprompterControlActual();
    teleprompter_emit_timeout = setTimeout(() => {
        teleprompter_emit_timeout = null;
        if (obtenerRevisionTeleprompterControlActual() !== revisionProgramada) return;
        socket.emit('teleprompter_control', { state: { ...teleprompter_state } });
    }, 60);
}

function toggleTeleprompter(forzarCerrar = false) {
    const estaVisible = teleprompter_visible;
    if (forzarCerrar && !estaVisible) {
        return;
    }
    const abrirTeleprompter = forzarCerrar ? false : !estaVisible;
    if (abrirTeleprompter) {
        panel_control_previo_teleprompter = parametros_visibles
            ? "parametros"
            : creditos_visibles
                ? "creditos"
                : "controles";
        aplicarVistaPanelControl("teleprompter");
        teleprompter_state.visible = false;
        teleprompter_state.preparing = true;
        teleprompter_state.playing = false;
    } else {
        teleprompter_state.visible = false;
        teleprompter_state.preparing = false;
        teleprompter_state.playing = false;
        const vistaRetorno = (PANEL_CONTROL_MODOS.has(panel_control_previo_teleprompter) && panel_control_previo_teleprompter !== "teleprompter")
            ? panel_control_previo_teleprompter
            : "controles";
        aplicarVistaPanelControl(vistaRetorno);
    }
    marcarCambioTeleprompterLocalControl();
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}

function volverMenuRepresentacionTeleprompter() {
    teleprompter_state.visible = false;
    teleprompter_state.preparing = false;
    teleprompter_state.playing = false;
    marcarCambioTeleprompterLocalControl();
    aplicarVistaPanelControl("controles");
    activarSeccionControl("representacion");
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}

if (typeof window !== "undefined") {
    window.volverMenuRepresentacionTeleprompter = volverMenuRepresentacionTeleprompter;
}

function teleprompterCargarTexto(jugador) {
    const texto = obtenerTextoJugadorParaRepresentacion(jugador === 2 ? 2 : 1);
    if (!texto || !texto.trim()) {
        const etiqueta = jugador === 2 ? "J2" : "J1";
        actualizarEstadoCargaTeleprompter(`No hay texto para cargar en ${etiqueta}`, "warn");
        if (typeof actualizarBotonesTeleprompterCarga === "function") {
            actualizarBotonesTeleprompterCarga();
        }
        return;
    }
    const source = jugador === 2 ? 2 : 1;
    const etiqueta = source === 2 ? "J2" : "J1";
    const loadId = ++teleprompter_load_seq;
    teleprompter_state.text = (texto || "").trim();
    teleprompter_state.scroll = 0;
    teleprompter_state.source = source;
    teleprompter_state.playing = false;
    teleprompter_state.preparing = false;
    teleprompter_state.visible = true;
    teleprompter_state.loadId = loadId;
    marcarCambioTeleprompterLocalControl();
    if (!teleprompter_visible) {
        aplicarVistaPanelControl("teleprompter");
    }
    actualizarEstadoCargaTeleprompter(`Cargando texto ${etiqueta} en espectador...`, "info");
    iniciarEsperaAckTeleprompter(loadId, source);
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}

function teleprompterSubir() {
    teleprompter_state.scroll = Math.max(0, teleprompter_state.scroll - 60);
    marcarCambioTeleprompterLocalControl();
    emitirTeleprompter(true);
}

function teleprompterBajar() {
    teleprompter_state.scroll += 60;
    marcarCambioTeleprompterLocalControl();
    emitirTeleprompter(true);
}

function teleprompterSubirGrande() {
    teleprompter_state.scroll = Math.max(0, teleprompter_state.scroll - 260);
    marcarCambioTeleprompterLocalControl();
    emitirTeleprompter();
}

function teleprompterBajarGrande() {
    teleprompter_state.scroll += 260;
    marcarCambioTeleprompterLocalControl();
    emitirTeleprompter();
}

function teleprompterIrInicio() {
    teleprompter_state.scroll = 0;
    marcarCambioTeleprompterLocalControl();
    emitirTeleprompter(true);
}

function teleprompterIrFinal() {
    teleprompter_state.scroll = Number.MAX_SAFE_INTEGER;
    marcarCambioTeleprompterLocalControl();
    emitirTeleprompter(true);
}

function teleprompterCambiarFuente(delta) {
    const nueva = Math.min(TELEPROMPTER_FONT_MAX, Math.max(TELEPROMPTER_FONT_MIN, teleprompter_state.fontSize + delta));
    teleprompter_state.fontSize = nueva;
    marcarCambioTeleprompterLocalControl();
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}

function teleprompterCambiarVelocidad(delta) {
    const nueva = Math.min(TELEPROMPTER_SPEED_MAX, Math.max(TELEPROMPTER_SPEED_MIN, teleprompter_state.speed + delta));
    teleprompter_state.speed = nueva;
    marcarCambioTeleprompterLocalControl();
    actualizarTeleprompterUI();
    emitirTeleprompter();
}

function teleprompterTogglePlay() {
    teleprompter_state.playing = !teleprompter_state.playing;
    marcarCambioTeleprompterLocalControl();
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}
const teleprompter_btn_timeouts = new Map();
const teleprompter_hold_intervals = new Map();

const teleprompter_hold_actions = {
    "font-down": () => teleprompterCambiarFuente(-2),
    "font-up": () => teleprompterCambiarFuente(2),
    "speed-down": () => teleprompterCambiarVelocidad(-5),
    "speed-up": () => teleprompterCambiarVelocidad(5),
    "scroll-up": () => teleprompterSubir(),
    "scroll-down": () => teleprompterBajar()
};

const activarBotonVisual = (id, duracion = 160) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("tp-btn--active");
    if (teleprompter_btn_timeouts.has(el)) {
        clearTimeout(teleprompter_btn_timeouts.get(el));
    }
    const timeout = setTimeout(() => {
        el.classList.remove("tp-btn--active");
        teleprompter_btn_timeouts.delete(el);
    }, duracion);
    teleprompter_btn_timeouts.set(el, timeout);
};

const setBotonHeld = (id, activo) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.tpHoldActive = activo ? "1" : "0";
    if (activo) {
        el.classList.add("tp-btn--held");
    } else {
        el.classList.remove("tp-btn--held");
    }
};

function limpiarFeedbackVisualTeleprompterControl() {
    teleprompter_btn_timeouts.forEach((timeout, elemento) => {
        clearTimeout(timeout);
        if (elemento) {
            elemento.classList.remove("tp-btn--active");
        }
    });
    teleprompter_btn_timeouts.clear();
    teleprompter_hold_intervals.forEach((interval, elemento) => {
        clearInterval(interval);
        if (elemento) {
            elemento.classList.remove("tp-btn--held");
            elemento.dataset.tpHoldActive = "0";
        }
    });
    teleprompter_hold_intervals.clear();
    document.querySelectorAll(".tp-btn").forEach((btn) => {
        btn.classList.remove("tp-btn--active", "tp-btn--held");
        btn.dataset.tpHoldActive = "0";
    });
}

function invalidarContextoTeleprompterControl({ reiniciarEstadoCarga = false } = {}) {
    if (teleprompter_emit_timeout) {
        clearTimeout(teleprompter_emit_timeout);
        teleprompter_emit_timeout = null;
    }
    limpiarEsperaAckTeleprompter();
    limpiarFeedbackVisualTeleprompterControl();
    if (reiniciarEstadoCarga) {
        reiniciarEstadoCargaTeleprompterControl();
    }
}

function procesarTeleprompterFeedbackControl(payload = {}) {
    const tipo = typeof payload.type === "string" ? payload.type : "";
    const id = typeof payload.id === "string" ? payload.id : "";
    if (!tipo || !id) return;
    if (!teleprompter_visible) return;
    if (tipo === "press") {
        activarBotonVisual(id, Math.max(60, Math.trunc(Number(payload.duration) || 160)));
        return;
    }
    if (tipo === "held") {
        setBotonHeld(id, Boolean(payload.active));
    }
}

if (typeof window !== "undefined") {
    window.procesarTeleprompterFeedbackControl = procesarTeleprompterFeedbackControl;
}

const iniciarHoldTeleprompter = (elemento, accion) => {
    if (!elemento || !accion) return;
    const ejecutar = () => accion();
    ejecutar();
    const interval = setInterval(ejecutar, 140);
    teleprompter_hold_intervals.set(elemento, interval);
    elemento.dataset.tpHoldActive = "1";
    elemento.classList.add("tp-btn--held");
};

const detenerHoldTeleprompter = (elemento) => {
    if (!elemento) return;
    const interval = teleprompter_hold_intervals.get(elemento);
    if (interval) {
        clearInterval(interval);
        teleprompter_hold_intervals.delete(elemento);
    }
    elemento.dataset.tpHoldActive = "0";
    elemento.classList.remove("tp-btn--held");
};

const configurarHoldTeleprompter = () => {
    const botones = document.querySelectorAll(".tp-btn");
    botones.forEach((btn) => {
        btn.dataset.tpHoldActive = btn.dataset.tpHoldActive === "1" ? "1" : "0";
        const accion = teleprompter_hold_actions[btn.dataset.hold];
        const start = (event) => {
            if (btn.disabled || btn.classList.contains("tp-btn--empty")) return;
            if (btn.dataset.tpHoldActive === "1") return;
            event.preventDefault();
            detenerHoldTeleprompter(btn);
            if (accion) {
                iniciarHoldTeleprompter(btn, accion);
            } else {
                btn.dataset.tpHoldActive = "1";
                btn.classList.add("tp-btn--held");
            }
        };
        const stop = () => {
            if (btn.dataset.tpHoldActive !== "1") return;
            if (accion) {
                detenerHoldTeleprompter(btn);
            } else {
                btn.dataset.tpHoldActive = "0";
                btn.classList.remove("tp-btn--held");
            }
        };
        btn.addEventListener("pointerdown", start);
        btn.addEventListener("pointerup", stop);
        btn.addEventListener("pointerleave", stop);
        btn.addEventListener("pointercancel", stop);
        btn.addEventListener("mousedown", start);
        btn.addEventListener("mouseup", stop);
        btn.addEventListener("mouseleave", stop);
        btn.addEventListener("touchstart", start, { passive: false });
        btn.addEventListener("touchend", stop);
        btn.addEventListener("touchcancel", stop);
    });
};

if (typeof window !== "undefined") {
    window.addEventListener("load", configurarHoldTeleprompter);
    window.addEventListener("resize", actualizarEtiquetaRepresentacionControl);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(actualizarEtiquetaRepresentacionControl).catch(() => {});
    }
    window.addEventListener("load", () => {
        inicializarPestanasControl();
        refrescarTextosEstaticosControl();
        inicializarPanelCreditosControl();
        inicializarPersistenciaParametrosControl();
        actualizarTestigosDesventajaControl();
        aplicarCreditosEnPanelControl(creditos_estado_control);
    });
}
function reiniciar_calentamiento() {
    socket.emit('reiniciar_calentamiento');
}

function reiniciar_marcador_calentamiento() {
    socket.emit('reiniciar_marcador_calentamiento');
}

function actualizarBotonBanderasMusasControl(estado = banderas_musas_activas) {
    banderas_musas_activas = Boolean(estado);
    document.querySelectorAll("[data-banderas-musas-control]").forEach((boton) => {
        boton.dataset.activo = banderas_musas_activas ? "1" : "0";
        boton.dataset.active = banderas_musas_activas ? "1" : "0";
        boton.classList.toggle("is-active", banderas_musas_activas);
        boton.setAttribute("aria-pressed", banderas_musas_activas ? "true" : "false");
        boton.textContent = banderas_musas_activas
            ? tJuego2PControl("control.button.flags.on", {}, "\uD83D\uDEA9 BANDERAS ACTIVADAS")
            : tJuego2PControl("control.button.flags.off", {}, "\uD83D\uDEA9 BANDERAS DESACTIVADAS");
    });
}

window.actualizarEstadoBanderasMusasControl = (payload = {}) => {
    const activa = Boolean(payload && payload.activa);
    actualizarBotonBanderasMusasControl(activa);
};

function refrescarTextosEstaticosControl() {
    const textos = [
        ["control_title_tutorial", "control.title.tutorial", "\u{1F4D6} TUTORIAL"],
        ["control_title_detonadores", "control.title.detonators", "\u{1F4A5} DETONADORES"],
        ["control_title_game", "control.title.game", "\u{1F3AE} JUEGO"],
        ["control_title_parameters_text", "control.button.parameters", "\u2699\uFE0F PAR\u00c1METROS"],
        ["control_subtitle_musas", "control.subtitle.muses", "DETONADORES PARA MUSAS"],
        ["boton_nueva_partida", "control.button.new_match", "\u2728 NUEVA PARTIDA"],
        ["boton_vista_tutorial", "control.button.tutorial_view", "\u{1F4D6} VISTA TUTORIAL"],
        ["boton_vista_partida", "control.button.game_view", "\u{1F3AE} VISTA PARTIDA"],
        ["boton_reiniciar_calentamiento", "control.button.clear", "\u{1F9F9} LIMPIAR"],
        ["boton_reiniciar_marcador_calentamiento", "control.button.reset_score", "\u21BB REINICIAR MARCADOR"],
        ["boton_escribir", "control.button.write", "\u270E ESCRIBIR"],
        ["boton_limpiar_juego", "control.button.clear", "\u{1F9F9} LIMPIAR"],
        ["boton_descargar_textos", "control.button.download_texts", "\u2B07\uFE0F DESCARGAR TEXTOS"],
        ["boton_temporizador_gigante", "control.button.giant_timer", "\u23F1\uFE0F TEMPORIZADOR GIGANTE"],
        ["boton_fin_j1", "control.button.end.blue", "\uD83D\uDD35 FIN"],
        ["boton_fin_j2", "control.button.end.red", "\uD83D\uDD34 FIN"],
        ["frase_final_heading_j1", "mode.name.frase_final", "FRASE FINAL"],
        ["frase_final_heading_j2", "mode.name.frase_final", "FRASE FINAL"],
        ["boton_solicitud_lugares", "control.button.request_places", "\u{1F4CD} PEDIR LUGARES"],
        ["boton_solicitud_acciones", "control.button.request_actions", "\u{1F3C3} PEDIR ACCIONES"],
        ["boton_solicitud_frase_final", "control.button.request_final_phrase", "\u{1F4AC} PEDIR FRASE FINAL"],
        ["teleprompter_cargar_j1", "control.button.load", "\u{1F4BE} CARGAR"],
        ["teleprompter_cargar_j2", "control.button.load", "\u{1F4BE} CARGAR"]
    ];

    textos.forEach(([id, clave, fallback]) => {
        const nodo = document.getElementById(id);
        if (nodo) {
            nodo.textContent = tJuego2PControl(clave, {}, fallback);
        }
    });
    actualizarBotonesVistaPrincipalControl();
    actualizarEtiquetaRepresentacionControl();

    const fraseFinalJ1 = document.getElementById("frase_final_j1");
    const fraseFinalJ2 = document.getElementById("frase_final_j2");
    const placeholderFrase = tJuego2PControl("control.placeholder.final_phrase", {}, "Escribe la frase final...");
    if (fraseFinalJ1) fraseFinalJ1.setAttribute("placeholder", placeholderFrase);
    if (fraseFinalJ2) fraseFinalJ2.setAttribute("placeholder", placeholderFrase);
    actualizarEtiquetasFraseFinalControl();
    actualizarOpcionesFraseFinalControl();

    actualizarCabeceraModoControl();
    actualizarBotonesPanelSuperiorControl();
    actualizarBotonesVistaEspectadorControl();
    actualizarBotonSkipTertuliaControl();
    actualizarBotonVistaCalentamiento();
    actualizarBotonBorrarTextoGuardadoControl();
    actualizarBotonBanderasMusasControl();
    actualizarBotonNuevaPartidaControl();
    if (typeof boton_pausar_reanudar !== "undefined" && boton_pausar_reanudar) {
        actualizarBotonPausaReanudarControl(boton_pausar_reanudar);
    } else {
        const botonPausa = document.getElementById("boton_pausar_reanudar");
        if (botonPausa) actualizarBotonPausaReanudarControl(botonPausa);
    }
    actualizarSolicitudCalentamientoControl(ultimo_payload_solicitud_calentamiento_control);
    actualizarTeleprompterUI();
}
window.refrescarIdiomaControlUI = refrescarTextosEstaticosControl;

function activar_banderas_musas() {
    const siguienteEstado = !banderas_musas_activas;
    actualizarBotonBanderasMusasControl(siguienteEstado);
    socket.emit('activar_banderas_musas', {
        activa: siguienteEstado,
        bloquear_desactivar: siguienteEstado
    });
}

function enviar_comentario() {
    palabras = tema.value;
    socket.emit('enviar_comentario', palabras);
};

function puntuacion_final() {
    p1 = puntos1.innerHTML.match(/\d+/)[0];
    p2 = puntos2.innerHTML.match(/\d+/)[0];
    maxima = Math.max(p1, p2);

    v1 = parseInt(votos1.value);
    v2 = parseInt(votos2.value);
    suma = parseInt(v1 + v2);
    pfinal1 = parseInt(+p1 + Math.round((v1 / suma) * maxima));
    pfinal2 = parseInt(+p2 + Math.round((v2 / suma) * maxima));

    if(findValueInRowAndChange(nombre1.value, pfinal1) == false){
        fila = clasificacion.insertRow(clasificacion.rows.length);
        nombre = fila.insertCell(0);
        nombre.contentEditable = false;
        puntuacion = fila.insertCell(1);
        puntuacion.contentEditable = false;
        borrar = fila.insertCell(2);
        borrar.innerHTML = '<input type="button" value="\u274C" onclick="deleteRow(this)">';
        editar = fila.insertCell(3);
        editar.innerHTML = '<input type="button" value="\u270F\uFE0F" onclick="editableRow(this)"></input>';
        nombre.innerHTML = nombre1.value;
        puntuacion.innerHTML = pfinal1;
    }

    if(findValueInRowAndChange(nombre2.value, pfinal2) == false){
        fila = clasificacion.insertRow(clasificacion.rows.length);
        nombre = fila.insertCell(0);
        nombre.contentEditable = false;
        puntuacion = fila.insertCell(1);
        puntuacion.contentEditable = false;
        borrar = fila.insertCell(2);
        borrar.innerHTML = '<input type="button" value="\u274C" onclick="deleteRow(this)">'
        editar = fila.insertCell(3);
        editar.innerHTML = '<input type="button" value="\u270F\uFE0F" onclick="editableRow(this)"></input>';
        nombre.innerHTML = nombre2.value;
        puntuacion.innerHTML = pfinal2;
    }

    sortTable();

    puntuacion_final1.innerHTML = "\u{1F5F3}\uFE0F Puntuaci\u00f3n del p\u00fablico = " + Math.round((v1 / suma) * maxima) + "<br>\u{1F3C1} Puntuaci\u00f3n final = " + pfinal1;
    puntuacion_final2.innerHTML = "\u{1F5F3}\uFE0F Puntuaci\u00f3n del p\u00fablico = " + Math.round((v2 / suma) * maxima) + "<br>\u{1F3C1} Puntuaci\u00f3n final = " + pfinal2;
   
    pfinal1 = puntuacion_final1.innerHTML;
    pfinal2 = puntuacion_final2.innerHTML;

    socket.emit('enviar_puntuacion_final', {pfinal1, pfinal2});
};

function enviar_clasificacion(){
    data = extractData('clasificacion', (x) => ({
        jugador: x[0],
        puntuacion: x[1],
      }));
      socket.emit('enviar_clasificacion', data);
  }

function pausar(opciones = {}){
    pausado = true;
    clearInterval(countInterval);
    clearInterval(countInterval1);
    countInterval = null;
    countInterval1 = null;
    // Variables para llevar el conteo y controlar el intervalo
    socket.emit('pausar', opciones && typeof opciones === "object" ? opciones : {});
}


function pausar_reanudar(boton) {
    // Imprimimos en consola para verificar
    console.log(fin_j1, fin_j2);

    console.log("Â¿Terminado?:", !(fin_j1 || fin_j2));
    console.log("Valor de data-value:", boton.dataset.value);

    if (!juego_iniciado && modo_actual) {
        juego_iniciado = true;
    }
    if (juego_iniciado) {
      // Usamos comparaciÃ³n == para no preocuparnos de que sea string
      if (boton.dataset.value == 0) {
        pausar();
        boton.dataset.value = 1;
        actualizarBotonPausaReanudarControl(boton);
      }
      else if (boton.dataset.value == 1) {
        reanudar();
        boton.dataset.value = 0;
        actualizarBotonPausaReanudarControl(boton);
      }
    }
  }


function reanudar(){
    if(modo_actual != "tertulia"){
    pausado = false;
    socket.emit('reanudar', '');
    }
    else if(modo_actual == "tertulia"){
        clearTimeout(TimeoutTiempoMuerto)
        TimeoutTiempoMuerto = null;
        reanudar_modo();
    }
}

function reanudar_modo(){
    if(modo_actual !== "tertulia"){
        return false;
    }
    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        actualizarBotonPausaReanudarControl(boton_pausar_reanudar);
    }
    pausado = false;
    socket.emit('reanudar_modo', '');
    return true;
}
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("clasificacion");
    switching = true;
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
      //start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /*Loop through all table rows (except the
      first, which contains table headers):*/
      for (i = 1; i < (rows.length - 1); i++) {
        //start by saying there should be no switching:
        shouldSwitch = false;
        /*Get the two elements you want to compare,
        one from current row and one from the next:*/
        x = rows[i].getElementsByTagName("TD")[1];
        y = rows[i + 1].getElementsByTagName("TD")[1];
        //check if the two rows should switch place:
        if (Number(x.innerHTML.match(/\d+/)[0]) < Number(y.innerHTML.match(/\d+/)[0])) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        /*If a switch has been marked, make the switch
        and mark that a switch has been done:*/
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }

  function findValueInRowAndChange(nombre, puntos) {
    clasificacion = document.getElementById("clasificacion");
    var rows = clasificacion.rows;
    for (var i = 1; i < rows.length; i++) {
      var cols = rows[i].cells;
      for (var c = 0; c < cols.length; c++) {
        if (cols[c].innerText == nombre) {
          cols[1].innerHTML = puntos;
          return true;
        }
      }
    }
    return false;
  }

  function deleteRow(r) {
    var i = r.parentNode.parentNode.rowIndex;
    document.getElementById("clasificacion").deleteRow(i);
}

function editableRow(r) {
    table_ = document.getElementById("clasificacion");
    var i = r.parentNode.parentNode.rowIndex;
    rows_ = table_.rows;
    editando = rows_[i].getElementsByTagName("TD")[0].contentEditable;
    if(editando == 'true'){
        r.value = "\u270F\uFE0F";
        rows_[i].getElementsByTagName("TD")[0].contentEditable = 'false';
        rows_[i].getElementsByTagName("TD")[1].contentEditable = 'false';
        sortTable();
    }
    else {
        r.value = "\u2705";
        rows_[i].getElementsByTagName("TD")[0].contentEditable = 'true';
        rows_[i].getElementsByTagName("TD")[1].contentEditable = 'true';

    }
}

const extractData = (tableId, mapper) => {
    const myTab = document.getElementById(tableId);
    if (myTab) {
      const data = [...myTab.rows].map((r) => [...r.cells].map((c) => c.innerText));
      return data.map(mapper);
    }
  };

function final(player, opciones = {}){
    const emitirConteoFinal = !opciones || opciones.emitirConteoFinal !== false;
    if(player == 1){
        setPendienteAnimacionEntradaBarraVida(1, false);
        cancelarAnimacionEntradaBarraVida(tiempo);
        clearInterval(countInterval);
        tiempo.style.color = "white"
        tiempo.innerHTML = tJuego2PControl("timer.time_up", {}, "Â¡Tiempo!");
        actualizarBarraVida(tiempo, tiempo.innerHTML);
        count = tJuego2PControl("timer.time_up", {}, "Â¡Tiempo!");
        texto_guardado1 = texto1.innerText;
        terminado = true;
        if (window.registrarTiempoControl) {
            window.registrarTiempoControl(1, 0);
        }
        console.log("texto1", texto_guardado1)
        if (emitirConteoFinal) {
            emitirCountControl({ count, player });
        }
    }
    else{
        setPendienteAnimacionEntradaBarraVida(2, false);
        cancelarAnimacionEntradaBarraVida(tiempo1);
        clearInterval(countInterval1);
        tiempo1.style.color = "white"
        tiempo1.innerHTML = tJuego2PControl("timer.time_up", {}, "Â¡Tiempo!");
        actualizarBarraVida(tiempo1, tiempo1.innerHTML);
        count1 = tJuego2PControl("timer.time_up", {}, "Â¡Tiempo!");
        terminado1 = true;
        if (window.registrarTiempoControl) {
            window.registrarTiempoControl(2, 0);
        }
        texto_guardado2 = texto2.innerText;
        console.log("texto2", texto_guardado2)
        if (emitirConteoFinal) {
            emitirCountControl({ count: count1, player: 2 });
        }
    }

    if (window.emitirStatsLiveControl) {
        window.emitirStatsLiveControl();
    }

    if(terminado && terminado1){
        if (!puntuacion_final_captura_solicitada && socket && typeof socket.emit === "function") {
            puntuacion_final_captura_solicitada = true;
            socket.emit("capturar_puntuacion_final");
        }
        detenerCuentaAtrasModoControl();
        actualizarCabeceraModoControl({ modo: "", segundos: 0 });
        console.log("PRUEBA FINAL", texto_guardado1)
        if (!regalo_musas_enviado && typeof window.emitirRegaloMusas === "function") {
            regalo_musas_enviado = true;
            window.emitirRegaloMusas();
        }
        //setTimeout(descargar_textos, 5000);
    }
}

function frase_final(player){
    guardarFraseFinalControl(player, { normalizar: true });
}
