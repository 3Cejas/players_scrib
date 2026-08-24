(function initScribPreShow(global) {
    "use strict";

    const MAX_TEXTO = 180;
    const MAX_MENSAJES = 24;
    const COOLDOWN_MS = 2500;

    function textoPlano(valor, maximo = MAX_TEXTO) {
        const limpio = String(valor ?? "")
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        return Array.from(limpio)
            .slice(0, Math.max(0, Number(maximo) || 0))
            .join("");
    }

    function normalizarLimite(valor) {
        const numero = Math.trunc(Number(valor));
        if (!Number.isFinite(numero)) return MAX_TEXTO;
        return Math.max(1, Math.min(MAX_TEXTO, numero));
    }

    function normalizarCooldown(valor) {
        const numero = Math.trunc(Number(valor));
        if (!Number.isFinite(numero)) return COOLDOWN_MS;
        return Math.max(500, Math.min(15000, numero));
    }

    function normalizarEquipo(valor) {
        const equipo = Number(valor);
        return equipo === 1 || equipo === 2 ? equipo : null;
    }

    function normalizarSessionId(valor) {
        if (typeof valor !== "string") return "";
        const id = valor.trim();
        if (!id || id.length > 96 || !/^[A-Za-z0-9_.:~\-]+$/.test(id)) return "";
        return id;
    }

    function normalizarPhaseSeq(valor) {
        return typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0 ? valor : 0;
    }

    function normalizarMensaje(valor, limiteTexto = MAX_TEXTO) {
        const data = valor && typeof valor === "object" ? valor : {};
        const id = textoPlano(data.id, 80);
        const texto = textoPlano(data.texto, limiteTexto);
        if (!id || !texto) return null;
        return Object.freeze({
            id,
            texto,
            nombre_musa: textoPlano(data.nombre_musa, 24) || "MUSA",
            equipo: normalizarEquipo(data.equipo),
            creado_en: Math.max(0, Math.trunc(Number(data.creado_en) || 0))
        });
    }

    function normalizarEstado(payload = {}) {
        const data = payload && typeof payload === "object" ? payload : {};
        const limiteTexto = normalizarLimite(data.limite_texto);
        const activo = data.activo === true;
        const vistos = new Set();
        const mensajes = activo && Array.isArray(data.mensajes)
            ? data.mensajes
                .map((mensaje) => normalizarMensaje(mensaje, limiteTexto))
                .filter((mensaje) => {
                    if (!mensaje || vistos.has(mensaje.id)) return false;
                    vistos.add(mensaje.id);
                    return true;
                })
                .slice(-MAX_MENSAJES)
            : [];
        return Object.freeze({
            version: Math.max(1, Math.trunc(Number(data.version) || 1)),
            activo,
            mensajes: Object.freeze(mensajes),
            limite_texto: limiteTexto,
            cooldown_ms: normalizarCooldown(data.cooldown_ms),
            session_id: normalizarSessionId(data.session_id),
            phase_seq: normalizarPhaseSeq(data.phase_seq)
        });
    }

    function tieneSesionSincronizada(estado = {}) {
        const data = estado && typeof estado === "object" ? estado : {};
        return Boolean(normalizarSessionId(data.session_id) && normalizarPhaseSeq(data.phase_seq));
    }

    function puedeReanudarEnLobby(estado = {}, contexto = {}) {
        const normalizado = normalizarEstado(estado);
        return Boolean(
            normalizado.activo
            && tieneSesionSincronizada(normalizado)
            && contexto.tutorialActivo !== true
            && contexto.partidaActiva !== true
            && contexto.partidaFinalizada !== true
        );
    }

    function debeReabrirNuevaSesion(estadoAnterior = {}, estadoSiguiente = {}, contexto = {}) {
        const anterior = normalizarEstado(estadoAnterior);
        const siguiente = normalizarEstado(estadoSiguiente);
        return Boolean(
            siguiente.session_id !== anterior.session_id
            && puedeReanudarEnLobby(siguiente, contexto)
        );
    }

    function validarTexto(valor, limite = MAX_TEXTO) {
        const maximo = normalizarLimite(limite);
        const original = String(valor ?? "").replace(/\r\n?/g, "\n");
        const texto = textoPlano(original, maximo);
        if (!texto) return Object.freeze({ ok: false, code: "INVALID_TEXT", texto: "", limite: maximo });
        const normalizadoCompleto = String(original)
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        const longitudNormalizada = Array.from(normalizadoCompleto).length;
        if (longitudNormalizada > maximo) {
            return Object.freeze({ ok: false, code: "TEXT_TOO_LONG", texto: "", limite: maximo });
        }
        return Object.freeze({ ok: true, code: "", texto, limite: maximo });
    }

    function crearRequestId(cryptoRef = global && global.crypto) {
        if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
            return `pre_${cryptoRef.randomUUID().replace(/-/g, "")}`;
        }
        return `pre_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    }

    const api = Object.freeze({
        MAX_TEXTO,
        MAX_MENSAJES,
        COOLDOWN_MS,
        textoPlano,
        normalizarMensaje,
        normalizarEstado,
        tieneSesionSincronizada,
        puedeReanudarEnLobby,
        debeReabrirNuevaSesion,
        validarTexto,
        crearRequestId
    });

    if (global) global.ScribPreShow = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
