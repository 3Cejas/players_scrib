(function initScribTeleprompter(global) {
    const LIMITS = {
        fontMin: 18,
        fontMax: 96,
        speedMin: 5,
        speedMax: 300
    };

    function clamp(valor, min, max) {
        return Math.min(Math.max(valor, min), max);
    }

    function normalizarRevision(valor) {
        const revision = Number(valor);
        if (!Number.isFinite(revision)) return null;
        return Math.max(0, Math.trunc(revision));
    }

    function crearEstado(overrides = {}) {
        return {
            visible: false,
            text: "",
            fontSize: 36,
            speed: 25,
            playing: false,
            scroll: 0,
            source: 0,
            loadId: 0,
            revision: 0,
            ...overrides
        };
    }

    function aplicarEstado(destino, state = {}, limits = LIMITS) {
        if (!destino || !state || typeof state !== "object") {
            return destino;
        }
        if (typeof state.visible === "boolean") {
            destino.visible = state.visible;
        }
        if (typeof state.text === "string") {
            destino.text = state.text;
        }
        if (Number.isFinite(state.fontSize)) {
            destino.fontSize = clamp(Number(state.fontSize), limits.fontMin, limits.fontMax);
        }
        if (Number.isFinite(state.speed)) {
            destino.speed = clamp(Number(state.speed), limits.speedMin, limits.speedMax);
        }
        if (typeof state.playing === "boolean") {
            destino.playing = state.playing;
        }
        if (Number.isFinite(state.scroll)) {
            destino.scroll = Number(state.scroll);
        }
        if (state.source !== undefined) {
            const source = Number(state.source);
            destino.source = source === 2 ? 2 : source === 1 ? 1 : 0;
        }
        if (Number.isFinite(state.loadId)) {
            destino.loadId = Math.max(0, Math.trunc(Number(state.loadId)));
        }
        const revision = normalizarRevision(state.revision);
        if (revision !== null) {
            destino.revision = revision;
        }
        return destino;
    }

    function esEstadoObsoleto(state = {}, revisionActual = 0) {
        const revision = normalizarRevision(state.revision);
        return revision !== null && revision < Number(revisionActual || 0);
    }

    global.ScribTeleprompter = {
        LIMITS,
        aplicarEstado,
        clamp,
        crearEstado,
        esEstadoObsoleto,
        normalizarRevision
    };
})(window);
