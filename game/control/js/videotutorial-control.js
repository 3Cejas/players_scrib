(function initVideotutorialControl(global) {
    "use strict";

    const INTERVALO_MIN_SEGUNDOS = 15;
    const INTERVALO_MAX_SEGUNDOS = 86400;
    const INTERVALO_MIN_MINUTOS = 1;
    const INTERVALO_MAX_MINUTOS = 1440;
    const ACK_TIMEOUT_MS = 6500;
    let inicializado = false;
    let contadorSolicitudes = 0;
    let estado = {
        conectado: false,
        sincronizado: false,
        intervaloSegundos: 180,
        faseActiva: true,
        sessionId: "",
        phaseSeq: 0,
        reproduccionSeq: 0,
        programado: false,
        visible: false,
        reproduciendo: false,
        videoUrl: "",
        duracionSegundos: 0,
        silenciado: true,
        inicioTs: 0,
        finTs: 0,
        posicionSegundos: 0,
        proximaReproduccionTs: 0,
        verificacionDisponible: false,
        musasConectadas: 0,
        musasVerificadas: 0,
        mensaje: "",
        error: "",
        pendiente: null
    };

    const getEl = (id) => global.document && global.document.getElementById(id);
    const obtenerSocket = () => (typeof socket !== "undefined" ? socket : null);
    const limitarSegundos = (valor, fallback = 180) => {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return fallback;
        return Math.max(INTERVALO_MIN_SEGUNDOS, Math.min(INTERVALO_MAX_SEGUNDOS, Math.round(numero)));
    };
    const segundosAMinutos = (valor) => Math.max(
        INTERVALO_MIN_MINUTOS,
        Math.min(INTERVALO_MAX_MINUTOS, Math.round(limitarSegundos(valor, 180) / 60))
    );
    const normalizarConteo = (valor) => {
        const numero = Number(valor);
        return Number.isFinite(numero) && numero >= 0 ? Math.min(9999, Math.floor(numero)) : 0;
    };
    const primerBooleano = (...valores) => {
        const encontrado = valores.find((valor) => typeof valor === "boolean");
        return typeof encontrado === "boolean" ? encontrado : null;
    };

    function normalizarEstado(payload = {}) {
        const raiz = payload && typeof payload === "object" ? payload : {};
        const data = raiz.estado && typeof raiz.estado === "object"
            ? raiz.estado
            : (raiz.state && typeof raiz.state === "object" ? raiz.state : raiz);
        const config = data.configuracion && typeof data.configuracion === "object"
            ? data.configuracion
            : (data.config && typeof data.config === "object" ? data.config : data);
        const intervaloSegundos = Number(
            config.intervalo_segundos
            ?? config.intervalSeconds
            ?? data.intervalo_segundos
        );
        const intervaloMinutos = Number(
            config.intervalo_minutos
            ?? config.intervaloMinutos
            ?? config.interval_minutes
            ?? data.intervalo_minutos
            ?? data.intervaloMinutos
        );
        const intervaloNormalizado = Number.isFinite(intervaloSegundos)
            ? limitarSegundos(intervaloSegundos, estado.intervaloSegundos)
            : (Number.isFinite(intervaloMinutos)
                ? limitarSegundos(intervaloMinutos * 60, estado.intervaloSegundos)
                : estado.intervaloSegundos);
        const visibleExplicito = primerBooleano(
            data.visible,
            data.mostrando,
            data.reproduciendo,
            data.playing
        );
        const estadoTexto = String(data.status ?? data.estado_actual ?? "").trim().toLowerCase();
        const visible = visibleExplicito === null
            ? ["playing", "reproduciendo", "visible"].includes(estadoTexto)
            : visibleExplicito;
        const programadoExplicito = primerBooleano(
            data.programado,
            data.habilitado,
            config.habilitado,
            data.enabled
        );
        const programado = programadoExplicito === null
            ? (visible || estado.programado)
            : programadoExplicito;
        const proximaRaw = Number(
            data.proxima_reproduccion_ts
            ?? data.proximaReproduccionTs
            ?? data.next_play_at
            ?? data.nextPlayAt
            ?? 0
        );
        const reproduciendo = primerBooleano(data.reproduciendo, data.playing) ?? visible;
        const duracionRaw = Number(config.duracion_segundos ?? config.duration_seconds ?? 0);
        const inicioRaw = Number(data.inicio_ts ?? data.started_at ?? 0);
        const finRaw = Number(data.fin_ts ?? data.ends_at ?? 0);
        const posicionRaw = Number(data.posicion_segundos ?? data.position_seconds ?? 0);
        const verificacion = data.verificacion && typeof data.verificacion === "object"
            ? data.verificacion
            : (data.verification && typeof data.verification === "object" ? data.verification : null);
        const sessionId = typeof data.session_id === "string"
            ? data.session_id.trim().slice(0, 128)
            : estado.sessionId;
        const phaseRaw = Number(data.phase_seq ?? data.phaseSeq);
        const reproduccionRaw = Number(data.reproduccion_seq ?? data.reproduccionSeq);
        return {
            sincronizado: true,
            intervaloSegundos: intervaloNormalizado,
            faseActiva: primerBooleano(data.activo, data.active) ?? estado.faseActiva,
            sessionId,
            phaseSeq: Number.isInteger(phaseRaw) && phaseRaw >= 0 ? phaseRaw : estado.phaseSeq,
            reproduccionSeq: Number.isInteger(reproduccionRaw) && reproduccionRaw >= 0
                ? reproduccionRaw
                : estado.reproduccionSeq,
            programado: Boolean(programado),
            visible: Boolean(visible),
            reproduciendo: Boolean(reproduciendo),
            videoUrl: typeof config.video_url === "string" ? config.video_url.trim().slice(0, 2048) : estado.videoUrl,
            duracionSegundos: Number.isFinite(duracionRaw) && duracionRaw >= 0 ? duracionRaw : estado.duracionSegundos,
            silenciado: primerBooleano(config.silenciado, config.muted) ?? estado.silenciado,
            inicioTs: Number.isFinite(inicioRaw) && inicioRaw > 0 ? inicioRaw : 0,
            finTs: Number.isFinite(finRaw) && finRaw > 0 ? finRaw : 0,
            posicionSegundos: Number.isFinite(posicionRaw) && posicionRaw >= 0 ? posicionRaw : 0,
            proximaReproduccionTs: Number.isFinite(proximaRaw) && proximaRaw > 0 ? proximaRaw : 0,
            verificacionDisponible: Boolean(verificacion),
            musasConectadas: verificacion ? normalizarConteo(verificacion.conectadas ?? verificacion.total) : 0,
            musasVerificadas: verificacion ? normalizarConteo(verificacion.verificadas ?? verificacion.confirmadas) : 0,
            mensaje: typeof data.mensaje === "string"
                ? data.mensaje.trim().slice(0, 180)
                : (typeof data.message === "string" ? data.message.trim().slice(0, 180) : "")
        };
    }

    function obtenerCodigoVisual() {
        if (!estado.conectado) return "disconnected";
        if (estado.pendiente) return "pending";
        if (estado.error) return "error";
        if (!estado.sincronizado) return "waiting";
        if (!estado.faseActiva) return "inactive";
        if (estado.reproduciendo || estado.visible) return "playing";
        if (estado.programado) return "scheduled";
        return "idle";
    }

    function formatearIntervalo(segundos) {
        const total = limitarSegundos(segundos, 180);
        if (total % 3600 === 0) return `${total / 3600} H`;
        if (total % 60 === 0) return `${total / 60} MIN`;
        return `${total} S`;
    }

    function actualizarUI() {
        const panel = getEl("videotutorial_control");
        if (!panel) return;
        const codigo = obtenerCodigoVisual();
        panel.dataset.state = codigo;
        panel.setAttribute("aria-busy", estado.pendiente ? "true" : "false");

        const input = getEl("videotutorial_intervalo");
        if (input && global.document.activeElement !== input) {
            input.value = String(segundosAMinutos(estado.intervaloSegundos));
        }
        const repeticion = getEl("videotutorial_habilitado");
        if (repeticion && global.document.activeElement !== repeticion) {
            repeticion.checked = Boolean(estado.programado);
        }
        const bloqueado = !estado.conectado || !estado.sincronizado || Boolean(estado.pendiente);
        const accionBloqueada = bloqueado || !estado.faseActiva || !estado.sessionId || estado.phaseSeq <= 0;
        ["videotutorial_configurar", "videotutorial_mostrar", "videotutorial_ocultar"].forEach((id) => {
            const boton = getEl(id);
            if (!boton) return;
            const deshabilitado = id === "videotutorial_configurar" ? bloqueado : accionBloqueada;
            boton.disabled = deshabilitado;
            boton.setAttribute("aria-disabled", deshabilitado ? "true" : "false");
        });
        if (input) {
            input.disabled = bloqueado;
            input.setAttribute("aria-disabled", bloqueado ? "true" : "false");
        }
        if (repeticion) {
            repeticion.disabled = bloqueado;
            repeticion.setAttribute("aria-disabled", bloqueado ? "true" : "false");
        }

        const titulo = getEl("videotutorial_estado_texto");
        let texto = "REPETICIÓN DESACTIVADA";
        if (codigo === "disconnected") {
            texto = "SIN CONEXIÓN";
        } else if (codigo === "waiting") {
            texto = "SINCRONIZANDO…";
        } else if (codigo === "pending") {
            texto = "ENVIANDO…";
        } else if (codigo === "error") {
            texto = "NO SE PUDO CAMBIAR";
        } else if (codigo === "inactive") {
            texto = "FUERA DE FASE";
        } else if (codigo === "playing") {
            texto = "REPRODUCIENDO AHORA";
        } else if (codigo === "scheduled") {
            texto = `PROGRAMADO · ${formatearIntervalo(estado.intervaloSegundos)}`;
        }
        if (titulo) titulo.textContent = texto;
    }

    function limpiarPendiente(requestId = "") {
        if (!estado.pendiente) return false;
        if (requestId && estado.pendiente.requestId !== requestId) return false;
        if (estado.pendiente.timeout) {
            global.clearTimeout(estado.pendiente.timeout);
        }
        estado.pendiente = null;
        return true;
    }

    function aplicarEstado(payload = {}) {
        const normalizado = normalizarEstado(payload);
        limpiarPendiente();
        estado = {
            ...estado,
            ...normalizado,
            error: "",
            pendiente: null
        };
        actualizarUI();
        return { ...estado };
    }

    function marcarConexion(conectado) {
        const siguiente = Boolean(conectado);
        if (!siguiente) limpiarPendiente();
        estado = {
            ...estado,
            conectado: siguiente,
            sincronizado: false,
            error: "",
            pendiente: null,
            mensaje: siguiente ? "Esperando el estado del servidor." : ""
        };
        actualizarUI();
    }

    function crearRequestId() {
        contadorSolicitudes += 1;
        return `control-video-${Date.now().toString(36)}-${contadorSolicitudes.toString(36)}`;
    }

    function aplicarOptimista(tipo, payload = {}) {
        if (tipo === "configurar") {
            estado.intervaloSegundos = limitarSegundos(payload.intervalo_segundos, estado.intervaloSegundos);
            estado.programado = Boolean(payload.habilitado);
            estado.mensaje = estado.programado
                ? "Repetición automática guardada."
                : "Repetición automática desactivada.";
        } else if (tipo === "mostrar") {
            estado.visible = true;
            estado.reproduciendo = true;
            estado.mensaje = "Reproducción iniciada.";
        } else if (tipo === "ocultar") {
            estado.visible = false;
            estado.reproduciendo = false;
            estado.mensaje = "Reproducción detenida y videotutorial retirado.";
        }
    }

    function procesarAck(requestId, tipo, payloadEnviado, respuesta = {}) {
        if (!estado.pendiente || estado.pendiente.requestId !== requestId) return;
        const data = respuesta && typeof respuesta === "object" ? respuesta : {};
        const fallo = respuesta === false || data.ok === false || data.success === false;
        limpiarPendiente(requestId);
        if (fallo) {
            estado.error = String(data.error || data.mensaje || data.message || data.code || "El servidor rechazó la operación.")
                .trim()
                .slice(0, 180);
            actualizarUI();
            return;
        }
        const incluyeEstado = Boolean(
            data.estado
            || data.state
            || data.configuracion
            || Object.prototype.hasOwnProperty.call(data, "visible")
            || Object.prototype.hasOwnProperty.call(data, "programado")
            || Object.prototype.hasOwnProperty.call(data, "intervalo_segundos")
            || Object.prototype.hasOwnProperty.call(data, "intervalo_minutos")
        );
        if (incluyeEstado) {
            aplicarEstado(data);
            return;
        }
        aplicarOptimista(tipo, payloadEnviado);
        estado.error = "";
        actualizarUI();
    }

    function emitirOperacion(evento, tipo, payload, etiqueta) {
        const socketActual = obtenerSocket();
        if (!socketActual || !socketActual.connected || typeof socketActual.emit !== "function") {
            estado.error = "Control no está conectado al servidor.";
            actualizarUI();
            return false;
        }
        if (estado.pendiente) return false;
        const requestId = crearRequestId();
        const payloadSeguro = { ...payload, request_id: requestId };
        estado.error = "";
        estado.pendiente = { requestId, evento, tipo, etiqueta, timeout: null };
        estado.pendiente.timeout = global.setTimeout(() => {
            if (!estado.pendiente || estado.pendiente.requestId !== requestId) return;
            limpiarPendiente(requestId);
            estado.error = "El servidor no confirmó la operación. Revisa la conexión e inténtalo de nuevo.";
            actualizarUI();
        }, ACK_TIMEOUT_MS);
        actualizarUI();
        try {
            socketActual.emit(evento, payloadSeguro, (respuesta) => {
                procesarAck(requestId, tipo, payloadSeguro, respuesta);
            });
        } catch (_) {
            limpiarPendiente(requestId);
            estado.error = "No se pudo enviar la operación al servidor.";
            actualizarUI();
            return false;
        }
        return true;
    }

    function configurar() {
        const input = getEl("videotutorial_intervalo");
        const repeticion = getEl("videotutorial_habilitado");
        const valor = Number(input && input.value);
        if (!Number.isFinite(valor) || valor < INTERVALO_MIN_MINUTOS || valor > INTERVALO_MAX_MINUTOS || !Number.isInteger(valor)) {
            if (input) {
                input.setCustomValidity(`Introduce un número entero entre ${INTERVALO_MIN_MINUTOS} y ${INTERVALO_MAX_MINUTOS}.`);
                if (typeof input.reportValidity === "function") input.reportValidity();
            }
            estado.error = `El intervalo debe ser un número entero entre ${INTERVALO_MIN_MINUTOS} y ${INTERVALO_MAX_MINUTOS} minutos.`;
            actualizarUI();
            return false;
        }
        if (input) input.setCustomValidity("");
        return emitirOperacion(
            "video_tutorial_configurar",
            "configurar",
            {
                video_url: estado.videoUrl,
                intervalo_segundos: valor * 60,
                duracion_segundos: estado.duracionSegundos,
                habilitado: Boolean(repeticion && repeticion.checked),
                silenciado: estado.silenciado
            },
            "Guardando el intervalo del videotutorial."
        );
    }

    const payloadFase = () => ({
        session_id: estado.sessionId,
        phase_seq: estado.phaseSeq
    });
    const mostrar = () => emitirOperacion(
        "video_tutorial_reproducir",
        "mostrar",
        payloadFase(),
        "Solicitando la reproducción inmediata."
    );
    const ocultar = () => emitirOperacion(
        "video_tutorial_detener",
        "ocultar",
        payloadFase(),
        "Deteniendo y retirando la reproducción actual."
    );

    function inicializar() {
        if (inicializado || !global.document) return;
        const panel = getEl("videotutorial_control");
        if (!panel) return;
        inicializado = true;
        const form = getEl("videotutorial_config_form");
        const input = getEl("videotutorial_intervalo");
        const repeticion = getEl("videotutorial_habilitado");
        const botonMostrar = getEl("videotutorial_mostrar");
        const botonOcultar = getEl("videotutorial_ocultar");
        if (form) {
            form.addEventListener("submit", (evento) => {
                evento.preventDefault();
                configurar();
            });
        }
        if (input) {
            input.addEventListener("input", () => {
                input.setCustomValidity("");
                if (estado.error) {
                    estado.error = "";
                    actualizarUI();
                }
            });
        }
        if (repeticion) {
            repeticion.addEventListener("change", () => {
                if (estado.error) {
                    estado.error = "";
                    actualizarUI();
                }
            });
        }
        if (botonMostrar) botonMostrar.addEventListener("click", mostrar);
        if (botonOcultar) botonOcultar.addEventListener("click", ocultar);
        const socketActual = obtenerSocket();
        marcarConexion(Boolean(socketActual && socketActual.connected));
    }

    const api = {
        aplicarEstado,
        configurar,
        inicializar,
        marcarConexion,
        mostrar,
        normalizarEstado,
        ocultar,
        obtenerEstado: () => ({ ...estado, pendiente: estado.pendiente ? { ...estado.pendiente } : null })
    };
    global.ScribVideotutorialControl = Object.freeze(api);
    global.configurarVideotutorialControl = configurar;
    global.mostrarVideotutorialAhoraControl = mostrar;
    global.ocultarVideotutorialControl = ocultar;

    if (global.document && global.document.readyState === "loading") {
        global.document.addEventListener("DOMContentLoaded", inicializar, { once: true });
    } else {
        inicializar();
    }
})(window);
