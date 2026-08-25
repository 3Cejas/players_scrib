const ayuda_musa_controlador = window.ScribMusaHelp.createController({
    socket,
    windowRef: window,
    documentRef: document,
    html2canvas: window.html2canvas
});
window.ayudaMusaController = ayuda_musa_controlador;

socket.on("feedback_musa_inspiracion", (payload = {}) => {
    if (!payload || payload.tipo !== "inspiracion") return;
    activarFulgorBordesMusa();
    mostrarToastInspiracionMusa(payload);
});

function normalizarLetraModoMusa(letra) {
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

socket.on("idioma_actual", (payload = {}) => {
    if (window && typeof window.scribSetLanguage2P === "function") {
        window.scribSetLanguage2P(payload && payload.idioma ? payload.idioma : "es");
    }
});

let musa_request_id_activo = "";
let musa_request_id_ultimo = "";
let musa_request_seq = 0;
let musa_registro_confirmado = false;

function crearRequestIdRegistroMusa() {
    const api = window.ScribMusaAssignment;
    musa_request_seq += 1;
    let requestId = api.createRequestId();
    if (requestId === musa_request_id_ultimo) requestId = `${requestId}${musa_request_seq.toString(36)}`;
    musa_request_id_ultimo = requestId;
    return requestId;
}

function procesarAsignacionAutoritativaMusa(payload = {}, contexto = {}) {
    const api = window.ScribMusaAssignment;
    const payloadRequestId = api.normalizeRequestId(payload && payload.request_id);
    const requestIdEsperado = api.normalizeRequestId(contexto.requestId || musa_request_id_activo);
    const esReequilibrioSinRequest = !payloadRequestId
        && musa_registro_confirmado
        && String(payload && payload.motivo || "").trim().toLowerCase() === "reequilibrio";
    if ((!payloadRequestId || payloadRequestId !== requestIdEsperado) && !esReequilibrioSinRequest) return false;
    if (typeof window.aplicarAsignacionAutoritativaMusa !== "function") return false;
    const aplicada = window.aplicarAsignacionAutoritativaMusa(payload);
    if (aplicada) musa_registro_confirmado = true;
    return aplicada;
}

socket.on("musa_asignacion", procesarAsignacionAutoritativaMusa);

function manejarMusaReemplazadaEnJuego() {
    if (window.__scribMusaReplacementInProgress) return;
    window.__scribMusaReplacementInProgress = true;
    musa_request_id_activo = "";
    musa_registro_confirmado = false;
    invalidarEntradaMundoMusa();
    window.ScribMusaAssignment.clearAssignmentSession(window.sessionStorage);
    window.musa_client_id = window.ScribMusaAssignment.rotateClientId(window.sessionStorage, { windowRef: window });
    try { socket.disconnect(); } catch (_error) {}
    window.location.replace("../index.html?notice=musa_reemplazada");
}

socket.on("musa_reemplazada", manejarMusaReemplazadaEnJuego);

socket.on("pre_show_estado", (payload = {}) => {
    actualizarEstadoPreShowMusa(payload);
});

// Recibe el nombre del jugador 1 y lo coloca en su sitio.

socket.on('modo_actual', (data) => {
    if (!aceptarEventoModoMusa(data)) {
        return;
    }
    const siguiente_modo = data.modo_actual;
    const cambioRealModo = siguiente_modo !== modo_actual;
    console.log("MODO_ACTUAL", siguiente_modo)
    texto1.style.color = "white";
    if (cambioRealModo) {
        limpiarTimersCosmeticosMusa();
        cancelarSincronizacionVisorNivelesMusa();
        invalidarContextoDesventajasMusa();
    }
    setNivelesDesactivados(false);
    if (siguiente_modo === "palabras prohibidas") {
        cambiar_jugadores(true);

    } else {
        cambiar_jugadores(false);
    }
    modo_actual = siguiente_modo;
    niveles_bloqueados = false;
    actualizarNiveles(modo_actual);
    if(sincro == 1 || votando == true){

    }
    else{
        enviarPalabra_boton.style.display = "";
        campo_palabra.style.display = "";
    if(modo_actual == "letra bendita"){
        letra_bendita = normalizarLetraModoMusa(data.letra_bendita);
        pedir_inspiracion({modo_actual, letra_bendita})
    }
    if(modo_actual == "letra prohibida"){
        letra_prohibida = normalizarLetraModoMusa(data.letra_prohibida);
        pedir_inspiracion({modo_actual, letra_prohibida})
    }

    if (
        modo_actual === "palabras bonus" ||
        modo_actual === "tertulia" ||
        modo_actual === "palabras prohibidas" ||
        modo_actual === "frase final"
    ) {
        pedir_inspiracion({ modo_actual });
    }

    sincro = 0;
    }
});

socket.on('dar_nombre', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR";
    console.log("NOMBRE", nombre)
    nombre1.value = nombre;
    const equipoRecibido = equipo_pendiente_nombre_musa || normalizarEquipoVotacion(player);
    registrarNombreEscritxrPorEquipo(equipoRecibido, nombre);
    equipo_pendiente_nombre_musa = null;
    if (votacion_ventaja_activa && votacion_ventaja_opciones.length > 0) {
        renderizarModalVotacionVentaja(obtenerOpcionesVentaja(votacion_ventaja_opciones));
    }
});

if (enviar_ventaja) {
    socket.on(enviar_ventaja, (ventaja) => {
        if (ventaja === EMOJI_TORTUGA) {
            activarTecladoLentoMusa();
            return;
        }
        if (ventaja === EMOJI_RAYO) {
            activarRayoMusa();
            return;
        }
        if (ventaja === EMOJI_ESPEJO) {
            activarEspejoMusa();
            return;
        }
        if (ventaja === EMOJI_BRUMA) {
            activarBrumaMusa();
        }
    });
}

socket.on('temporizador_gigante_inicio', (data) => {
    iniciarTemporizadorLectura(data && data.duracion);
});

socket.on('temporizador_gigante_detener', () => {
    cancelarTemporizadorLectura();
});

function aplicarEstadoBanderasMusaDesdeServidor(payload = {}) {
    if (typeof aplicarEstadoBanderasControl === 'function') {
        aplicarEstadoBanderasControl(payload);
        return;
    }
    const botonBandera = document.getElementById('btn_bandera');
    if (!botonBandera) return;
    if (payload && payload.activa === false) {
        if (typeof desactivarPantalla === 'function') {
            desactivarPantalla({ forzadoControl: true });
        }
        return;
    }
    if (Number(botonBandera.value) !== 0) return;
    if (typeof bandera === 'function') {
        bandera(botonBandera, { forzadoControl: true });
    }
}

socket.on('estado_banderas_musas', (payload = {}) => {
    aplicarEstadoBanderasMusaDesdeServidor(payload);
});

socket.on('activar_banderas_musas', (payload = {}) => {
    const estadoNormalizado = (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'activa'))
        ? payload
        : { activa: true, bloqueado_por_control: true };
    aplicarEstadoBanderasMusaDesdeServidor(estadoNormalizado);
});

socket.on('musa_regalo_bandera_estado', (payload = {}) => {
    actualizarEstadoRegaloBanderaMusa(payload);
});

socket.on('feedback_musas_estado', (payload = {}) => {
    redirigirMusaAFeedback(payload);
});

socket.on('connect', () => {
    if (window.__scribMusaReplacementInProgress) return;
    console.log("Conectado al servidor por primera vez.");
    limpiarTimersCosmeticosMusa();
    cancelarSincronizacionVisorNivelesMusa();
    invalidarIntroMusa();
    invalidarContextoDesventajasMusa();
    invalidarContextoCalentamientoMusa();
    modo_seq_actual_musa = 0;
    ultimo_count_seq_musa = 0;
    tiempo_seq_actual_musa = 0;
    if (!nombre_musa) return;
    musa_request_id_activo = crearRequestIdRegistroMusa();
    musa_registro_confirmado = false;
    const payloadRegistroMusa = window.ScribMusaAssignment.createRegistrationPayload({
        clientId: musa_client_id,
        name: nombre_musa,
        requestId: musa_request_id_activo
    });
    const requestIdRegistroMusa = musa_request_id_activo;
    socket.emit('registrar_musa', payloadRegistroMusa, (payload = {}) => {
        if (requestIdRegistroMusa !== musa_request_id_activo) return false;
        const aplicada = procesarAsignacionAutoritativaMusa(payload, { requestId: requestIdRegistroMusa });
        if (aplicada) {
            socket.emit('pedir_pre_show_estado');
            socket.emit('pedir_video_tutorial_estado');
            ayuda_musa_controlador.requestState();
        }
        return aplicada;
    });
    socket.emit('pedir_idioma_actual');
    socket.emit('pedir_estado_banderas_musas');
    socket.emit('pedir_estado_regalo_bandera_musas');
    pedirNombreMusa();
    socket.emit('pedir_estado_musa');
    socket.emit('pedir_feedback_musas_estado');
    if (timeout_pedir_texto_connect_musa) {
        clearTimeout(timeout_pedir_texto_connect_musa);
    }
    timeout_pedir_texto_connect_musa = setTimeout(() => {
        timeout_pedir_texto_connect_musa = null;
        socket.emit('pedir_texto');
    }, 80);
});

socket.on('disconnect', () => {
    musa_request_id_activo = "";
    musa_registro_confirmado = false;
    limpiarTimersCosmeticosMusa();
    cancelarSincronizacionVisorNivelesMusa();
    if (timeout_pedir_texto_connect_musa) {
        clearTimeout(timeout_pedir_texto_connect_musa);
        timeout_pedir_texto_connect_musa = null;
    }
    invalidarEntradaMundoMusa();
    invalidarIntroMusa();
    invalidarContextoDesventajasMusa();
    invalidarContextoCalentamientoMusa();
    suspenderPreShowMusaPorConexion();
});

socket.on('connect_error', () => {
    limpiarTimersCosmeticosMusa();
    cancelarSincronizacionVisorNivelesMusa();
    if (timeout_pedir_texto_connect_musa) {
        clearTimeout(timeout_pedir_texto_connect_musa);
        timeout_pedir_texto_connect_musa = null;
    }
    invalidarEntradaMundoMusa();
    invalidarIntroMusa();
    invalidarContextoDesventajasMusa();
    invalidarContextoCalentamientoMusa();
    suspenderPreShowMusaPorConexion();
});

socket.on('regalo_pdf_musas', (payload) => {
    if (payload && payload.client_id && window.musa_client_id && String(payload.client_id) !== String(window.musa_client_id)) {
        return;
    }
    if (!player) {
        regalo_pdf_pendiente = payload;
        return;
    }
    mostrarRegaloPdf(payload);
});

socket.on('regalo_pdf_musas_reset', () => {
    regalo_pdf_pendiente = null;
    ocultarRegaloPdf();
});

socket.on('calentamiento_estado_musa', (data) => {
    actualizarCalentamiento(data);
});

socket.on('calentamiento_error', (data) => {
    mostrarFeedbackCalentamiento(
        mensajeErrorCalentamiento(data),
        true
    );
});

const obtenerEquipoDestacadoCalentamiento = (payload = {}) => {
    const equipo = normalizarEquipoVotacion(payload.equipo || payload.escritxr || payload.player);
    if (equipo === 1 || equipo === 2) return equipo;
    const equipoLocal = normalizarEquipoVotacion(player);
    return equipoLocal === 1 || equipoLocal === 2 ? equipoLocal : 1;
};

const obtenerNombreEscritxrDestacadoCalentamiento = (payload = {}, equipo = null) => {
    const nombrePayload = typeof payload.nombre_escritxr === "string" ? payload.nombre_escritxr.trim() : "";
    if (nombrePayload) {
        return normalizarNombreEscritxrUi(nombrePayload, "ESCRITXR");
    }
    const equipoResuelto = (equipo === 1 || equipo === 2) ? equipo : obtenerEquipoDestacadoCalentamiento(payload);
    const nombreGuardado = nombres_escritxr_por_equipo[equipoResuelto];
    if (nombreGuardado) {
        return normalizarNombreEscritxrUi(nombreGuardado, `ESCRITXR ${equipoResuelto}`);
    }
    return normalizarNombreEscritxrUi(nombre1 && nombre1.value ? nombre1.value : "", `ESCRITXR ${equipoResuelto}`);
};

socket.on('calentamiento_ganado', (data) => {
    const equipoDestacado = obtenerEquipoDestacadoCalentamiento(data || {});
    const claseEquipo = equipoDestacado === 2 ? "equipo-2" : "equipo-1";
    const nombreEscritxr = `<span class="calentamiento-feedback-escritxr ${claseEquipo}">${escapeHtml(
        obtenerNombreEscritxrDestacadoCalentamiento(data || {}, equipoDestacado)
    )}</span>`;
    const mensaje = `<span class="calentamiento-feedback-exclamacion">\u00A1</span>${tJuego2P(
        "warmup.feedback.word_highlighted",
        { name: nombreEscritxr },
        `${nombreEscritxr} ha destacado tu palabra!`
    )}`;
    mostrarFeedbackCalentamiento(mensaje, false, {
        html: true,
        clase: `feedback-destacado ${claseEquipo}`
    });
    dispararDestelloCalentamiento(equipoDestacado);
});

// Variables de los modos.
let modo_actual = "";
let modo_seq_actual_musa = 0;
let ultimo_count_seq_musa = 0;
let tiempo_seq_actual_musa = 0;
let niveles_bloqueados = true;
let listener_modo;
let jugador_psico;
const NIVELES_ORDEN = [
    "letra bendita",
    "letra prohibida",
    "tertulia",
    "palabras bonus",
    "palabras prohibidas",
    "frase final"
];
const nivelesLinea = document.querySelector(".niveles-linea");
const nivelesItems = Array.from(document.querySelectorAll(".nivel-item"));
const nivelesScroll = document.querySelector(".niveles-scroll");
const nivelesPrev = document.querySelector(".niveles-prev");
const nivelesNext = document.querySelector(".niveles-next");
const nivelesContenedor = document.querySelector(".niveles");

function extraerModoSeqPayloadMusa(payload = {}) {
    const valor = Number(payload && payload.modo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function extraerTiempoSeqPayloadMusa(payload = {}) {
    const valor = Number(payload && payload.tiempo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function aceptarTiempoMusa(payload = {}, opciones = {}) {
    const { actualizar = true } = opciones;
    const seq = extraerTiempoSeqPayloadMusa(payload);
    if (seq === null) {
        return true;
    }
    if (seq < tiempo_seq_actual_musa) {
        return false;
    }
    if (actualizar && seq > tiempo_seq_actual_musa) {
        tiempo_seq_actual_musa = seq;
        ultimo_count_seq_musa = 0;
    }
    return true;
}

function aceptarEventoModoMusa(payload = {}, opciones = {}) {
    const { actualizar = true } = opciones;
    const seq = extraerModoSeqPayloadMusa(payload);
    if (seq === null) {
        return true;
    }
    if (seq < modo_seq_actual_musa) {
        return false;
    }
    if (actualizar && seq > modo_seq_actual_musa) {
        modo_seq_actual_musa = seq;
        ultimo_count_seq_musa = 0;
        tiempo_seq_actual_musa = 0;
    }
    return true;
}

function refrescarEtiquetasNivelesMusa() {
    nivelesItems.forEach((item) => {
        const modo = item && item.dataset ? item.dataset.modo : "";
        const strips = traducirStripModoMusa(modo);
        const contenedorTexto = item ? item.querySelector(".nivel-texto") : null;
        if (!contenedorTexto) return;
        const spans = Array.from(contenedorTexto.querySelectorAll("span"));
        while (spans.length < strips.length) {
            const extra = document.createElement("span");
            contenedorTexto.appendChild(extra);
            spans.push(extra);
        }
        spans.forEach((span, indice) => {
            span.textContent = strips[indice] || "";
            span.style.display = strips[indice] ? "" : "none";
        });
    });
}

function setNivelesDesactivados(estado) {
    if (!nivelesContenedor) return;
    nivelesContenedor.classList.toggle("niveles-desactivados", Boolean(estado));
}

function obtenerIndiceNivelActivo() {
    return nivelesItems.findIndex((item) => item.classList.contains("nivel-activo"));
}

function obtenerCentroItem(item) {
    if (!item || !nivelesLinea) return 0;
    const icono = item.querySelector(".nivel-icono");
    const rectLinea = nivelesLinea.getBoundingClientRect();
    if (icono) {
        const rectIcono = icono.getBoundingClientRect();
        return rectIcono.left - rectLinea.left + rectIcono.width / 2;
    }
    const rectItem = item.getBoundingClientRect();
    return rectItem.left - rectLinea.left + rectItem.width / 2;
}

function obtenerMaxScrollPermitido() {
    if (!nivelesScroll) return 0;
    return Math.max(0, nivelesScroll.scrollWidth - nivelesScroll.clientWidth);
}

function limitarScrollNiveles() {
    if (!nivelesScroll) return;
    const maxScroll = obtenerMaxScrollPermitido();
    if (nivelesScroll.scrollLeft > maxScroll) {
        nivelesScroll.scrollLeft = maxScroll;
    } else if (nivelesScroll.scrollLeft < 0) {
        nivelesScroll.scrollLeft = 0;
    }
}

function asegurarNivelActualVisible() {
    if (!nivelesScroll || !nivelesItems.length) return;
    const indice = obtenerIndiceNivelActivo();
    if (indice < 0) return;
    const item = nivelesItems[indice];
    const rectScroll = nivelesScroll.getBoundingClientRect();
    const rectItem = item.getBoundingClientRect();
    const margen = 8;
    let nuevoScroll = nivelesScroll.scrollLeft;
    if (rectItem.right > rectScroll.right - margen) {
        nuevoScroll += rectItem.right - rectScroll.right + margen;
    } else if (rectItem.left < rectScroll.left + margen) {
        nuevoScroll -= rectScroll.left - rectItem.left + margen;
    }
    const maxScroll = obtenerMaxScrollPermitido();
    nuevoScroll = Math.min(Math.max(0, nuevoScroll), maxScroll);
    if (Math.abs(nuevoScroll - nivelesScroll.scrollLeft) > 1) {
        nivelesScroll.scrollLeft = nuevoScroll;
    }
}

function resetearScrollNiveles() {
    if (!nivelesScroll) return;
    nivelesScroll.scrollTo({ left: 0, behavior: "auto" });
    if (nivelesPrev) {
        nivelesPrev.classList.remove("niveles-flecha--visible");
    }
    if (nivelesNext) {
        nivelesNext.classList.remove("niveles-flecha--visible");
    }
    limitarScrollNiveles();
    programarSincronizacionNivelesMusa(actualizarFlechasNiveles);
    programarSincronizacionNivelesMusa(() => {
        if (obtenerIndiceNivelActivo() < 0) {
            nivelesScroll.scrollLeft = 0;
        }
        actualizarFlechasNiveles();
    }, 50);
    programarSincronizacionNivelesMusa(() => {
        if (obtenerIndiceNivelActivo() < 0) {
            nivelesScroll.scrollLeft = 0;
        }
        actualizarFlechasNiveles();
    }, 200);
}

function sincronizarVisorNiveles() {
    if (!nivelesScroll || !nivelesItems.length) return;
    recalcularLineaNiveles();
    asegurarNivelActualVisible();
    limitarScrollNiveles();
    actualizarFlechasNiveles();
}

function programarSincronizacionVisorNiveles() {
    cancelarSincronizacionVisorNivelesMusa();
    sincronizarVisorNiveles();
    programarSincronizacionNivelesMusa(sincronizarVisorNiveles);
    programarSincronizacionNivelesMusa(sincronizarVisorNiveles, 90);
    programarSincronizacionNivelesMusa(sincronizarVisorNiveles, 220);
    programarSincronizacionNivelesMusa(sincronizarVisorNiveles, 520);
}

function recalcularLineaNiveles() {
    if (!nivelesLinea || !nivelesItems.length) return;
    const primero = nivelesItems[0];
    const ultimo = nivelesItems[nivelesItems.length - 1];
    const inicio = obtenerCentroItem(primero);
    const fin = obtenerCentroItem(ultimo);
    const longitud = Math.max(0, fin - inicio);
    nivelesLinea.style.setProperty("--linea-inicio", `${inicio}px`);
    nivelesLinea.style.setProperty("--linea-longitud", `${longitud}px`);

    const icono = primero.querySelector(".nivel-icono");
    if (icono) {
        const rectLinea = nivelesLinea.getBoundingClientRect();
        const rectIcono = icono.getBoundingClientRect();
        const lineaTop = rectIcono.top - rectLinea.top + rectIcono.height / 2;
        nivelesLinea.style.setProperty("--linea-top", `${lineaTop}px`);
        if (nivelesContenedor) {
            const rectCont = nivelesContenedor.getBoundingClientRect();
            const topGlobal = (rectLinea.top - rectCont.top) + lineaTop;
            nivelesContenedor.style.setProperty("--linea-top-global", `${topGlobal}px`);
        }
    }
}

function actualizarColorEquipo() {
    if (!nivelesContenedor) return;
    const colorEquipo = (nombre1 && nombre1.style && nombre1.style.color)
        ? nombre1.style.color
        : (nombre1 ? getComputedStyle(nombre1).color : "");
    const colorFinal = colorEquipo || "#00f5ff";
    nivelesContenedor.style.setProperty("--equipo-color", colorFinal);
    document.documentElement.style.setProperty("--equipo-color", colorFinal);
}

function actualizarFlechasNiveles() {
    if (!nivelesScroll || !nivelesPrev || !nivelesNext) return;
    limitarScrollNiveles();
    const maxScrollTotal = nivelesScroll.scrollWidth - nivelesScroll.clientWidth;
    const maxScroll = Math.min(maxScrollTotal, obtenerMaxScrollPermitido());
    const hayOverflow = maxScrollTotal > 4;
    const scrollActual = Math.max(0, Math.round(nivelesScroll.scrollLeft));
    const margen = 8;
    const limiteDerecho = Math.max(0, Math.round(maxScroll) - margen);
    const puedeIzquierda = hayOverflow && scrollActual > margen;
    const puedeDerecha = hayOverflow && scrollActual < limiteDerecho;
    nivelesPrev.classList.toggle("niveles-flecha--visible", puedeIzquierda);
    nivelesNext.classList.toggle("niveles-flecha--visible", puedeDerecha);
    if (!hayOverflow) {
        nivelesPrev.classList.remove("niveles-flecha--visible");
        nivelesNext.classList.remove("niveles-flecha--visible");
    }
    nivelesPrev.classList.remove("niveles-flecha--disabled");
    nivelesNext.classList.remove("niveles-flecha--disabled");
}

function desplazarNiveles(direccion) {
    if (!nivelesScroll) return;
    const delta = nivelesScroll.clientWidth * 0.6;
    const maxScroll = obtenerMaxScrollPermitido();
    const nuevoScroll = Math.min(Math.max(0, nivelesScroll.scrollLeft + direccion * delta), maxScroll);
    nivelesScroll.scrollTo({ left: nuevoScroll, behavior: "smooth" });
    programarSincronizacionNivelesMusa(actualizarFlechasNiveles);
    programarSincronizacionNivelesMusa(actualizarFlechasNiveles, 220);
}

if (nivelesPrev && nivelesNext) {
    nivelesPrev.addEventListener("click", () => desplazarNiveles(-1));
    nivelesNext.addEventListener("click", () => desplazarNiveles(1));
}

if (nivelesScroll) {
    nivelesScroll.addEventListener("scroll", () => {
        limitarScrollNiveles();
        actualizarFlechasNiveles();
    });
}

window.addEventListener("resize", () => {
    programarSincronizacionVisorNiveles();
});
window.addEventListener("load", () => {
    resetearScrollNiveles();
    programarSincronizacionVisorNiveles();
});
window.addEventListener("pageshow", () => {
    resetearScrollNiveles();
    programarSincronizacionVisorNiveles();
});
programarSincronizacionNivelesMusa(() => {
    setNivelesDesactivados(terminado || !modo_actual || niveles_bloqueados);
    resetearScrollNiveles();
    actualizarColorEquipo();
    programarSincronizacionVisorNiveles();
});

function actualizarNiveles(modo) {
    if (!nivelesItems.length) return;
    const indice = NIVELES_ORDEN.indexOf(modo);
    aplicarOrdenCircular(indice);
    if (niveles_bloqueados && indice < 0) {
        nivelesItems.forEach((item) => {
            item.classList.remove("nivel-activo", "nivel-pasado");
            item.classList.add("nivel-futuro");
            item.setAttribute("aria-current", "false");
        });
        actualizarFlechasNiveles();
        actualizarColorEquipo();
        recalcularLineaNiveles();
        return;
    }
    if (indice >= 0) {
        niveles_bloqueados = false;
    }
    const total = nivelesItems.length;
    const mitad = total / 2;
    nivelesItems.forEach((item, idx) => {
        if (indice < 0) {
            item.classList.remove("nivel-activo", "nivel-pasado");
            item.classList.add("nivel-futuro");
            item.setAttribute("aria-current", "false");
            return;
        }
        let delta = idx - indice;
        if (delta > mitad) delta -= total;
        if (delta < -mitad) delta += total;
        item.classList.toggle("nivel-pasado", delta < 0);
        item.classList.toggle("nivel-activo", delta === 0);
        item.classList.toggle("nivel-futuro", delta > 0);
        item.setAttribute("aria-current", delta === 0 ? "step" : "false");
    });
    if (nivelesLinea) {
        const progreso = indice < 0 || nivelesItems.length <= 1
            ? 0
            : (indice / (nivelesItems.length - 1)) * 100;
        nivelesLinea.style.setProperty("--progreso", `${progreso}%`);
        const inicio = obtenerCentroItem(nivelesItems[0]);
        const centroActivo = indice >= 0 ? obtenerCentroItem(nivelesItems[indice]) : inicio;
        const progresoPx = indice < 0 ? 0 : Math.max(0, centroActivo - inicio);
        nivelesLinea.style.setProperty("--progreso-px", `${progresoPx}px`);
    }
    asegurarNivelActualVisible();
    limitarScrollNiveles();
    actualizarFlechasNiveles();
    actualizarColorEquipo();
    recalcularLineaNiveles();
    programarSincronizacionNivelesMusa(actualizarFlechasNiveles);
    programarSincronizacionNivelesMusa(actualizarFlechasNiveles, 60);
}

function aplicarOrdenCircular(indiceActivo) {
    if (!nivelesItems.length) return;
    if (indiceActivo < 0) {
        nivelesItems.forEach((item) => {
            item.style.order = "";
        });
        return;
    }
    const total = nivelesItems.length;
    const centro = Math.floor(total / 2);
    nivelesItems.forEach((item, idx) => {
        const distancia = (idx - indiceActivo + total) % total;
        const orden = (distancia + centro) % total;
        item.style.order = orden;
    });
}

function refrescarUiIdiomaMusa() {
    refrescarEtiquetasNivelesMusa();
    refrescarCountdownMusa();

    if (nombre_musa_label && nombre_musa) {
        nombre_musa_label.textContent = nombre_musa;
    }
    if (puntos1) {
        const matchPuntos = String(puntos1.textContent || "").match(/-?\d+/);
        puntos1.textContent = formatearPuntos(matchPuntos ? Number(matchPuntos[0]) : 0);
    }

    if (ultimo_payload_calentamiento_musa) {
        actualizarCalentamiento(ultimo_payload_calentamiento_musa);
    } else {
        restaurarTextoBotonCalentamiento();
    }

    actualizarContenidoEntradaMusa();
    if (typeof actualizarPreviewTiempoPalabraMusa === "function") {
        actualizarPreviewTiempoPalabraMusa(campo_palabra ? campo_palabra.value : "");
    }
    if (musa_world_entry_activa) {
        const status = getEl("musa_world_entry_status");
        const estados = obtenerEstadosEntradaMusa();
        const indice = Math.min(musa_world_entry_indice_log, estados.length);
        if (status) {
            status.textContent = indice >= estados.length
                ? tJuego2P("world.status.loaded", {}, "🏁 MUNDO CARGADO")
                : (estados[indice] || estados[estados.length - 1]);
        }
    }

    if (votacion_ventaja_activa && votacion_ventaja_opciones.length > 0) {
        if (votacion_ventaja_ya_voto) {
            mostrarGraciasVotoVentaja(votacion_ventaja_ultimo_voto);
        } else {
            renderizarModalVotacionVentaja(obtenerOpcionesVentaja(votacion_ventaja_opciones));
        }
        actualizarPiesVotacionVentaja();
    }
}

if (window && typeof window.scribOnLanguageChange2P === "function") {
    window.scribOnLanguageChange2P(() => {
        refrescarUiIdiomaMusa();
    });
}

refrescarUiIdiomaMusa();

// Recibe los datos del jugador 1 y los coloca.
function handler_recibir_texto_x(data) {
if(data.text != null) texto1.innerHTML = data.text;
    if (data.points != null && puntos1) {
        const puntosAnteriores = puntos1.textContent;
        const puntosNuevos = formatearPuntos(data.points);
        puntos1.innerHTML = puntosNuevos;
        if (puntosNuevos !== puntosAnteriores) {
            destacarPuntosMusaHit();
        }
    }
    if(mostrar_texto.value == 1){
        //texto1.style.height = ""; // resetear la altura
        texto1.style.height = "auto";
    }
    if (jugador_psico == 1) {
        stylize();
    }
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_lÃ­nea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_lÃ­nea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value;
        }
    }*/
    //texto1.style.height = (texto1.scrollHeight) + "px";
    texto1.scrollTop = texto1.scrollHeight;
    //window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView(false);
}

socket.on(texto_x, handler_recibir_texto_x);

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", data => {
    if (!aceptarEventoModoMusa(data)) {
        return;
    }
    if (!aceptarTiempoMusa(data)) {
        return;
    }
    const countSeq = Number(data && data.count_seq);
    if (Number.isFinite(countSeq) && countSeq > 0) {
        if (countSeq <= ultimo_count_seq_musa) {
            return;
        }
        ultimo_count_seq_musa = Math.trunc(countSeq);
    }
    if(data.player == player){
    const segundosRestantes = extraerSegundosTiempo(data.count);
    const introEnCurso = secuencia_inicio_musa_activa || (document.body && document.body.classList.contains(CLASE_INTRO_PARTIDA_MUSA));
    if (segundosRestantes !== null && !ui_partida_activa_musa && !introEnCurso) {
        setUiPartidaActivaMusa(true);
    }
        console.log(data.count)
    if (!temporizador_lectura_activo) {
        mostrarBarraVida();
        if(convertirASegundos(data.count) >= 20){
            tiempo.style.color = "white"
        }
        if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
            tiempo.style.color = "yellow"
        }
        if (10 > convertirASegundos(data.count)) {
            console.log("MENOR QUE 10", convertirASegundos(data.count) )
            tiempo.style.color = "red"
        }
        const textoCount = String(data.count || "").toLowerCase().includes("tiempo")
            ? tJuego2P("timer.time_up", {}, "¡Tiempo!")
            : data.count;
        tiempo.innerHTML = textoCount;
        const animarEntradaVida = Boolean(animacionEntradaVidaPendiente && Number.isFinite(segundosRestantes));
        actualizarBarraVida(tiempo, textoCount, { animarEntrada: animarEntradaVida });
        if (animarEntradaVida) {
            animacionEntradaVidaPendiente = false;
        }
    }
    if (data.count == "\u00A1Tiempo!") {
        limpiarEfectosVisualesDesventajaMusa();

        //texto1.innerText = (texto1.innerText).substring(saltos_lÃ­nea_alineacion_1, texto1.innerText.length);
        //texto2.value = (texto2.value).substring(saltos_lÃ­nea_alineacion_2, texto2.value.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');
        // Variable booleana que dice si la ronda ha terminado o no.
        //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de lÃ­nea del jugador 1 para alinear los textos.
        //texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de lÃ­nea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
        if (typeof actualizarEstadoTextoCompleto === "function") {
            actualizarEstadoTextoCompleto(mostrar_texto, true);
        }
        mostrar_texto.style.backgroundColor = "";
        mostrar_texto.value = 1;
        notificacion.style.display = "none";
    }
}
});

socket.on("fin", (data) => {
    const payload = (data && typeof data === "object") ? data : { player: data };
    if (payload.partida_finalizada !== true || Number(payload.player) !== Number(player)) return;
    if (terminado) return;
    confetti_aux();
    limpiezas_final();
    invalidarContextoDesventajasMusa();
    invalidarContextoCalentamientoMusa();
});

function calcularFontSizeCountdownMusa(textoCountdown, objetivoVw) {
    const caracteres = Math.max(1, Array.from(String(textoCountdown || "").trim()).length);
    const limitePorAncho = 88 / (caracteres * 0.7);
    const valor = Math.min(Number(objetivoVw) || 10, limitePorAncho);
    return Math.max(4, Math.min(valor, 40)).toFixed(2) + "vw";
}

function crearCountdownMusa(textoCountdown) {
    $('#countdown').remove();
    return $('<span id="countdown"></span>')
        .text(textoCountdown)
        .appendTo($('.container'));
}

function aplicarEstiloCountdownMusa(expandido = false) {
    const countdown = $('#countdown');
    const textoCountdown = countdown.text() || "";
    const esNumero = /^\d+$/.test(String(textoCountdown).trim());
    countdown.css({
        'font-size': calcularFontSizeCountdownMusa(textoCountdown, expandido ? (esNumero ? 40 : 14) : 10),
        'opacity': expandido ? 0 : 1,
        'max-width': '92vw',
        'white-space': 'nowrap',
        'line-height': 1,
        'text-align': 'center',
        'overflow': 'visible'
    });
}

function programarPasoCountdownMusa(paso, revisionIntro) {
    if (!esRevisionIntroMusaActiva(revisionIntro)) {
        return;
    }
    const pasoActual = Number(paso);
    const textoPaso = pasoActual === 0 ? tJuego2P("countdown.write", {}, "\u00a1ESCRIBE!") : pasoActual;
    crearCountdownMusa(textoPaso);

    if (pasoActual === 3) {
        revelarEtapaIntroPartidaMusa(2);
    } else if (pasoActual === 2) {
        revelarEtapaIntroPartidaMusa(3);
    } else if (pasoActual === 1) {
        revelarEtapaIntroPartidaMusa(4);
        programarSincronizacionVisorNiveles();
    }

    clearTimeout(sub_timer);
    sub_timer = setTimeout(() => {
        sub_timer = null;
        if (!esRevisionIntroMusaActiva(revisionIntro)) {
            return;
        }
        aplicarEstiloCountdownMusa(true);
    }, 20);

    if (pasoActual <= 0) {
        clearTimeout(timeout_remover_countdown_musa);
        timeout_remover_countdown_musa = setTimeout(() => {
            timeout_remover_countdown_musa = null;
            if (!esRevisionIntroMusaActiva(revisionIntro)) {
                return;
            }
            clearTimeout(fallback_cuenta_atras_timer);
            fallback_cuenta_atras_timer = null;
            $('#countdown').remove();
            finalizarSecuenciaIntroPartidaMusa();
        }, 1000);
        return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        programarPasoCountdownMusa(pasoActual - 1, revisionIntro);
    }, 1000);
}

// Inicia el juego.
socket.on('inicio', data => {
    cerrarPreShowMusaPorTutorial();
    limpiarTimersCosmeticosMusa();
    cancelarSincronizacionVisorNivelesMusa();
    invalidarEntradaMundoMusa();
    const revisionIntro = invalidarIntroMusa();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    setUiPartidaActivaMusa(false);
    setUiPartidaFinalizadaMusa(false);
    post_inicio_pendiente_musa = false;
    LIMITE_TIEMPO_INSPIRACION = data.parametros.LIMITE_TIEMPO_INSPIRACION;
    TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR || TIEMPO_MODIFICADOR;
    ocultarRegaloPdf();
    resetearTemporizadorLectura();
    invalidarContextoDesventajasMusa();
    invalidarContextoCalentamientoMusa();
    terminado = false;
    niveles_bloqueados = true;
    setNivelesDesactivados(false);
    actualizarNiveles("");
    tiempo.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    tiempo.style.display = "";
    tiempo.style.color = "white"

    animateCSS(".contenedor", "pulse");
    iniciarSecuenciaIntroPartidaMusa();

    crearCountdownMusa(tJuego2P("countdown.ready", {}, "\u00bfPREPARADOS?"));
    preparados_timer = setTimeout(() => {
        if (!esRevisionIntroMusaActiva(revisionIntro)) {
            return;
        }
        preparados_timer = null;
        aplicarEstiloCountdownMusa(false);
        revelarEtapaIntroPartidaMusa(1);
    }, 20);

    listener_cuenta_atras = setTimeout(() => {
        listener_cuenta_atras = null;
        programarPasoCountdownMusa(3, revisionIntro);
    }, 1000);

    // Failsafe para evitar que la intro se quede atascada en "PREPARADOS?".
    fallback_cuenta_atras_timer = setTimeout(() => {
        if (!esRevisionIntroMusaActiva(revisionIntro)) {
            return;
        }
        limpiarCountdownInicioMusa();
        finalizarSecuenciaIntroPartidaMusa();
    }, 12000);
});

function aplicarPostInicioMusa() {
    const modoAlAplicarPostInicio = modo_actual;
    invalidarIntroMusa();
    limpiarClasesIntroPartidaMusa();
    secuencia_inicio_musa_activa = false;
    post_inicio_pendiente_musa = false;
    setUiPartidaActivaMusa(true);
    resetearTemporizadorLectura();
    socket.off('vote');
    socket.off('exit');
    socket.off('scroll');
    socket.off('temas_jugadores');
    //socket.off('recibir_comentario');
    socket.off('recibir_postgame1');
    socket.off('recibir_postgame2');

    limpiezas();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    /*
    skill.style = 'animation: brillo 2s ease-in-out;'
    skill.style.display = "flex";
    */

    texto1.style.height = "4.5em";
    texto1.rows =  "3";
    if (modoAlAplicarPostInicio) {
        niveles_bloqueados = false;
        setNivelesDesactivados(false);
        actualizarNiveles(modoAlAplicarPostInicio);
    }
    programarSincronizacionVisorNiveles();
}

socket.on("post-inicio", () => {
    cerrarPreShowMusaPorTutorial();
    if (hayCountdownInicioActivoMusa()) {
        post_inicio_pendiente_musa = true;
        // Si por cualquier carrera el contador quedo visible pero sin timers,
        // forzamos cierre de intro para no quedarse en "PREPARADOS?".
        if (!listener_cuenta_atras && !timer && !secuencia_inicio_musa_activa) {
            finalizarSecuenciaIntroPartidaMusa();
        }
        return;
    }
    aplicarPostInicioMusa();
});

// Resetea el tablero de juego.
socket.on('limpiar', () => {
    limpiarTimersCosmeticosMusa();
    cancelarSincronizacionVisorNivelesMusa();
    invalidarEntradaMundoMusa();
    invalidarIntroMusa();
    invalidarContextoDesventajasMusa();
    invalidarContextoCalentamientoMusa();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    const mantenerResumenPartida = ui_partida_activa_musa || terminado;
    if (mantenerResumenPartida) {
        setUiPartidaFinalizadaMusa(true);
    } else {
        setUiPartidaActivaMusa(false);
        setUiPartidaFinalizadaMusa(false);
    }
    skill.style = 'animation: brillo 2s ease-in-out;'
    resetearTemporizadorLectura();
    // Recibe el nombre del jugador y lo coloca en su sitio.
    socket.on(nombre, data => {
        nombre1.value = data;
    });

    limpiezas({ preservarResumenFinal: mantenerResumenPartida });

    modo_actual = "";
    terminado = true;
    niveles_bloqueados = true;
    setNivelesDesactivados(true);
    actualizarNiveles("");
    tiempo.style.display = "none";
    tiempo.style.color = "white"
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */
    notificacion.style.display = "none";
    resetearScrollNiveles();
    resetearEstadoVotacionVentaja();

});

// Recibe el nombre del jugador y lo coloca en su sitio.
socket.on(nombre, data => {
    nombre1.value = data;
    registrarNombreEscritxrPorEquipo(player, data);
    actualizarNombreRegalo();
});

socket.on("elegir_repentizado", ({seleccionados, TIEMPO_VOTACION}) => {
    votando = true;
    tarea.innerHTML = "<p>&iquest;Por donde quieres que continue la historia?</p><button class='btn repentizado' value = '1' onclick='elegir_repentizado_publico(this)'>" + seleccionados[0] + "</button><br><br><button class='btn' value = '2' onclick='elegir_repentizado_publico(this)'>" + seleccionados[1] + "</button><br><br><button class='btn' value = '3' onclick='elegir_repentizado_publico(this)'>" + seleccionados[2] + "</button>";
    enviarPalabra_boton.style.display = "none";
    campo_palabra.style.display = "none";
    recordatorio.innerHTML = "";
    window.__scribModoActualMusaPreview = "";
    if (typeof actualizarPreviewTiempoPalabraMusa === "function") {
        actualizarPreviewTiempoPalabraMusa("");
    }
    setTimeout(() => {
        pedirNombreMusa(player);
        votando = false;
    }, TIEMPO_VOTACION);
    animateCSS(".notificacion", "flash");
});

socket.on("pedir_inspiracion_musa", juego => {
    if (!aceptarEventoModoMusa(juego)) {
        return;
    }
    const es_prohibidas = juego.modo_actual === "palabras prohibidas";
    cambiar_jugadores(es_prohibidas);
    texto1.style.color = es_prohibidas ? "red" : "white";
    actualizarNiveles(juego.modo_actual);
    if(sincro == 1 || votando == true){
        return;
    }
    pedir_inspiracion(juego);
});

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un nÃºmero entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un nÃºmero entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

function pedir_inspiracion(juego){
    campo_palabra.value = "";
    enviarPalabra_boton.style.display = "";
    campo_palabra.style.display = "";
    modo_actual = juego.modo_actual;
    window.__scribModoActualMusaPreview = modo_actual;
    recordatorio.innerHTML = "";
    const etiquetaMusa = "<span style='color: orange;'>" + nombre_musa + "</span>";
    if(terminado == false && votando == false){
    if(juego.modo_actual == "palabras bonus"){
        tarea.innerHTML = "Cantame a mí, " + etiquetaMusa + ", una palabra que me inspire:";
    }
    if(juego.modo_actual == "letra bendita") {
        letra = normalizarLetraModoMusa(juego.letra_bendita);
        tarea.innerHTML = "Cantame a mí, " + etiquetaMusa + ", una palabra que lleve la letra <span style='color: green;'>" + letra.toUpperCase() + "</span>:";
    }
    if(juego.modo_actual == "letra prohibida") {
        letra = normalizarLetraModoMusa(juego.letra_prohibida);
        tarea.innerHTML = "Cantame a mí, " + etiquetaMusa + ", una palabra que <span style='color: red;'>NO</span> lleve la letra <span style='color: red;'>" + letra.toUpperCase() + "</span>:";
    }

    if(juego.modo_actual == "palabras prohibidas"){
        console.log("REVERTIR", true);
        cambiar_jugadores(true);
        texto1.style.color = "red";
        tarea.innerHTML = "<span style='color: pink;'>Incordia</span> a mi oponente, " + etiquetaMusa + ", con una palabra que no pueda usar:";
    } 

    if(juego.modo_actual == "tertulia") {
        campo_palabra.value = "none";
        enviarPalabra_boton.style.display = "none";
        campo_palabra.style.display = "none";
        tarea.innerHTML = "<br><br><br>" + etiquetaMusa + ", mira a " + "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" + nombre1.value + "</span>" + " y " + "<span style='color: #86d0ff;'>CUENTA</span>" + " todo aquello que le has querido decir hasta ahora.";
    
    }

    if(juego.modo_actual == "frase final") {
        campo_palabra.value = "none";
        enviarPalabra_boton.style.display = "none";
        campo_palabra.style.display = "none";
        tarea.innerHTML = "<br><br><br>" + etiquetaMusa + ", " + "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" +  nombre1.value + "</span>" + " va a TERMINAR su obra gracias a ti. " + EMOJI_CORAZON_OJOS;
    }

    socket.emit("pedir_texto", { musa: player });
    notificacion.style.display = "block";
    if (typeof actualizarPreviewTiempoPalabraMusa === "function") {
        actualizarPreviewTiempoPalabraMusa(campo_palabra.value, modo_actual);
    }
    animateCSS(".notificacion", "flash");
    fin_pag.scrollIntoView({behavior: "smooth", block: "end"});
    }
}

function recibir_palabra(data) {
    animacion_modo();
    palabra1.innerHTML = "(+" + data.puntuacion + " pts) " + data.palabras_var;
    definicion1.innerHTML = data.palabra_bonus[1];
}

//FUNCIONES AUXILIARES.

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
    //var tamaÃ±o_letra = getRandNumber(7, 35)
    //text.style.fontSize = tamaÃ±o_letra + "px"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = getTextAlign();
    //texto2.style.textAlign = getTextAlign();
    //texto2.style.fontFamily = getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tamaÃ±o_letra + "px"; // Font sizes between 15px and 35px
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
    animateCSS(".explicacion", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

// FunciÃ³n auxiliar que reestablece el estilo inicial de la pÃ¡gina modificado por el modo psicodÃ©lico.
function restablecer_estilo() {
    //texto1.style.fontFamily = "monospace";
    texto1.style.color = "orange";
    //texto1.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = "justify";
    //texto2.style.fontFamily = "monospace";
    //texto2.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto2.style.textAlign = "justify";
    document.body.style.backgroundColor = "black";
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
}

// FunciÃ³n auxiliar que elimina los saltos de lÃ­nea al principio de un string.
function eliminar_saltos_de_linea(texto) {
    var i = 0;
    while (texto[i] == "\n") {
        i++;
    }
    return (texto.substring(i, texto.length));
}

// FunciÃ³n auxiliar que genera un string con n saltos de lÃ­nea.
function crear_n_saltos_de_linea(n) {
    var saltos = "";
    var cont = 0;
    while (cont <= n) {
        saltos += "\n";
        cont++;
    }
    return saltos;
}

function cambiar_color_puntuacion() {
    if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) > parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        puntos1.style.color = "green";
        if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) == parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        }
    }
    else {
        puntos1.style.color = "red";
    }
}

function limpiezas({ preservarResumenFinal = false } = {}){
    limpiarTimersCosmeticosMusa();
    cancelarSincronizacionVisorNivelesMusa();
    invalidarEntradaMundoMusa();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    stopConfetti()
    clearInterval(intervalID)
    invalidarIntroMusa();
    secuencia_inicio_musa_activa = false;
    post_inicio_pendiente_musa = false;
    limpiarClasesIntroPartidaMusa();
    limpiar_colddown()
    invalidarContextoDesventajasMusa();
    cambiar_jugadores(false);
    skill.style.display = "none";
    skill.style.border = "0.5vw solid greenyellow";
    skill_cancel.style.display = "none";
    if (!preservarResumenFinal) {
        texto1.innerText = "";
        puntos1.innerHTML = 0 + " palabras";
        texto1.style.height = "4.5em"; /* Alto para tres lÃ­neas de texto */
        texto1.scrollTop = texto1.scrollHeight;
        if (typeof actualizarEstadoTextoCompleto === "function") {
            actualizarEstadoTextoCompleto(mostrar_texto, false);
        }
        mostrar_texto.style.backgroundColor = "";
        mostrar_texto.value = 0;
    } else {
        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px";
        texto1.scrollTop = texto1.scrollHeight;
        if (typeof actualizarEstadoTextoCompleto === "function") {
            actualizarEstadoTextoCompleto(mostrar_texto, true);
        }
        mostrar_texto.style.backgroundColor = "";
        mostrar_texto.value = 1;
    }

    puntos1.style.color = "white";  
    votando = false;
    setNivelesDesactivados(false);
    niveles_bloqueados = true;
    actualizarNiveles("");
}

function limpiezas_final(){
    limpiarTimersCosmeticosMusa();
    cancelarSincronizacionVisorNivelesMusa();
    invalidarEntradaMundoMusa();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    clearInterval(interval_cooldown);
    invalidarIntroMusa();
    secuencia_inicio_musa_activa = false;
    post_inicio_pendiente_musa = false;
    limpiarClasesIntroPartidaMusa();
    limpiar_colddown()
    invalidarContextoDesventajasMusa();
    cambiar_jugadores(false);
    skill.style.display = "none";
    skill_cancel.style.display = "none";
    tiempo.style.color = "white";
    votando = false;
    terminado = true;
    setNivelesDesactivados(true);
    niveles_bloqueados = true;
    actualizarNiveles("");
    resetearScrollNiveles();
    intentarMostrarRegaloPdfPendiente();
}
// Cuando el texto del jugador 1 cambia, envÃ­a los datos de jugador 1 al resto.
texto1.addEventListener("keyup", (evt) => {
    console.log(evt.key)
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
  
    }
  });
  // Cuando el texto del jugador 1 cambia, envÃ­a los datos de jugador 1 al resto.
  texto1.addEventListener("keydown", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
  
    }
  });
  
  // Cuando el texto del jugador 1 cambia, envÃ­a los datos de jugador 1 al resto.
  texto1.addEventListener("press", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
  
    }
  });

function limpiar_colddown(){
    clearInterval(interval_cooldown);
    text_progress.removeEventListener('mouseenter', onMouseEnter);
    text_progress.removeEventListener('mouseleave', onMouseLeave);
    bar_progress.style.width = '0%'
    //button.disabled = false; // Habilita el botÃ³n
    text_progress.style.color = "";
    text_progress.innerHTML = `INSPIRAR <span class="btn-emoji" aria-hidden="true">${EMOJI_ROCKET}</span>`;
    cooldown = false;
}

  const SECOND_IN_MS = 1000;
  const UPDATE_INTERVAL = SECOND_IN_MS / 60; // Update 60 times per second (60 FPS)
  const SKILL_CLASS = 'skill';
  const DISABLED_CLASS = 'disabled';
  
// Cooldown in milliseconds
cooldowntime = 5000;

// Activate clicked skill
const activateSkill = (event) => {
  const {target} = event;
  // Exit if we click on anything that isn't a skill
  if (target.textContent === EMOJI_EDITAR) {
        editando = true;
        mostrar_texto.value = 0;
        mostrarTextoCompleto(mostrar_texto);
        texto1.contentEditable= "true";
        target.textContent = EMOJI_ENVIAR;
        skill_cancel.style.display = "flex";
    return
  }
  if(!target.classList.contains(SKILL_CLASS)) return;

  if (target.textContent === EMOJI_ENVIAR) {
    
    feedback_texto_editado.innerHTML = "&iexcl;Texto editado!";
    animateCSS(".feedback_texto_editado", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
        feedback_texto_editado.innerHTML = "";
        }, 800);
    });
    texto1.style.height = "";
    editando = false;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable = "false";
    socket.emit(texto_x, { text: texto1.innerText, points: puntos1.textContent});
    skill_cancel.style.display = "none";
    target.textContent = EMOJI_EDITAR;
  }
  target.classList.add(DISABLED_CLASS);
  target.style = '--time-left: 100%';
  
  // Get cooldown time
  let time = cooldowntime - UPDATE_INTERVAL;
  
  // Update remaining cooldown
  intervalID = setInterval(() => {
    // Pass remaining time in percentage to CSS
    const passedTime = time / cooldowntime * 100;
    target.style = `--time-left: ${passedTime}%;`;

    // Display time left
    //target.textContent = (time / SECOND_IN_MS).toFixed(2);
    time -= UPDATE_INTERVAL;
    
    // Stop timer when there is no time left
    if(time < 0) {
        
        skill_cancel.style.display = "none";
        skill.style.display = "flex";
        target.textContent = EMOJI_EDITAR;
        target.style = '';
        target.style = 'animation: brillo 2s ease-in-out;'
        target.classList.remove(DISABLED_CLASS);
      
      clearInterval(intervalID);
    }
  }, UPDATE_INTERVAL);
}

function cancelar(boton){
    socket.emit('pedir_texto')
    texto1.style.height = "";
    editando = false;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable = "false";
    boton.style.display = "none";
    skill.textContent = EMOJI_EDITAR;
}
// Add click handler to the table
skill.addEventListener('click', activateSkill, false);

var CONFETTI_TOP_Z_INDEX = 2147483647;
var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: CONFETTI_TOP_Z_INDEX };
var isConfettiRunning = true; // Indicador para controlar la ejecuciÃ³n
let confettiIntervalMusa = null;
let confettiFrameMusa = null;

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

function confetti_aux() {
    stopConfetti();
    var animationEnd = Date.now() + duration; // Actualiza aquÃ­ dentro de la funciÃ³n
    isConfettiRunning = true; // Habilita la ejecuciÃ³n de confetti
    console.log(isConfettiRunning);
    
    confettiIntervalMusa = setInterval(function() {
      if (!isConfettiRunning) {
        clearInterval(confettiIntervalMusa);
        confettiIntervalMusa = null;
        return;
      }
  
      var timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(confettiIntervalMusa);
        confettiIntervalMusa = null;
        return;
      }
  
      var particleCount = 50 * (timeLeft / duration);
      console.log("HOLAAAA");
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }

function stopConfetti() {
    isConfettiRunning = false; // Deshabilita la ejecuciÃ³n de confetti
    if (confettiIntervalMusa) {
        clearInterval(confettiIntervalMusa);
        confettiIntervalMusa = null;
    }
    if (confettiFrameMusa) {
        cancelAnimationFrame(confettiFrameMusa);
        confettiFrameMusa = null;
    }
    confetti.reset(); // Detiene la animaciÃ³n de confetti
  }

  function confetti_musas(){
    stopConfetti();
    var scalar = 2;
    var starShape = confetti.shapeFromText({
      text: "\u2B50",
      scalar,
      color: "#ffd43b",
      fontFamily: "\"Apple Color Emoji\", \"Segoe UI Emoji\", \"Noto Color Emoji\", sans-serif"
    });
    isConfettiRunning = true; // Habilita la ejecuciÃ³n de confetti
    
    var end = Date.now() + (2 * 1000);
    
    // go Buckeyes!
    (function frame() {
      confetti({
        startVelocity: 12,
        particleCount: 2,
        angle: 270,
        spread: 1000,
        origin: { x: randomInRange(0.12, 0.88), y: 0 },
        shapes: [starShape],
        scalar: 3,
        colors: ["#fff6ad", "#ffe066", "#ffd43b", "#ffffff"],
        zIndex: CONFETTI_TOP_Z_INDEX
      });
    
      if ((Date.now() < end) && isConfettiRunning) {
        confettiFrameMusa = requestAnimationFrame(frame);
        return;
      }
      confettiFrameMusa = null;
    }());
    }

function cambiar_jugadores(revertir) {

    const p = Number(player); // jugador local: 1 o 2

    // FunciÃ³n de mapeo clara y reversible
    const mapJugador = (j) => revertir ? (3 - j) : j;

    const jugadorTexto = mapJugador(p);
    const jugadorEstilo = mapJugador(p);
    console.log("Revertir:", revertir);
    console.log("OFF", texto_x);

    // 1) Quitar listener anterior
    socket.off(texto_x, handler_recibir_texto_x);

    // 2) Nuevo canal de texto
    texto_x = `texto${jugadorTexto}`;

    console.log("ON", texto_x);

    // 3) Volver a suscribir
    socket.on(texto_x, handler_recibir_texto_x);

    // 4) Aplicar estilos segÃºn el jugador resultante
    if (jugadorEstilo === 1) {
        nombre1.style =
            "color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
        metadatos.style =
            "color:red; text-shadow: 0.0625em 0.0625em aqua;";

    } else {

        nombre1.style =
            "color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
        metadatos.style =
            "color:red; text-shadow: 0.0625em 0.0625em aqua;";

                    nombre1.style =
            "color:red; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;";
        metadatos.style =
            "color:aqua; text-shadow: 0.0625em 0.0625em red;";
    }

    pedirNombreMusa(jugadorTexto);

    actualizarColorEquipo();

    console.log(
        "texto_x final =", texto_x,
        "| jugadorTexto =", jugadorTexto,
        "| jugadorEstilo =", jugadorEstilo
    );
}

if (socket && typeof socket.connect === "function" && !socket.connected) {
    socket.connect();
}
