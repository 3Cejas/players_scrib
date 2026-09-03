(function initShowNarrationControl(global) {
    "use strict";

    const ACK_TIMEOUT_MS = 6500;
    let initialized = false;
    let requestCounter = 0;
    let state = {
        connected: false,
        synced: false,
        active: false,
        sequence: 0,
        pending: null,
        error: ""
    };

    const getEl = (id) => global.document && global.document.getElementById(id);
    const getSocket = () => (typeof socket !== "undefined" ? socket : null);
    const requestId = () => `show_${Date.now().toString(36)}_${(++requestCounter).toString(36)}`;

    function normalizeState(payload = {}) {
        const data = payload && payload.estado && typeof payload.estado === "object"
            ? payload.estado
            : (payload && typeof payload === "object" ? payload : {});
        return {
            active: Boolean(data.activa ?? data.reproduciendo),
            sequence: Math.max(0, Math.trunc(Number(data.secuencia) || 0))
        };
    }

    function visualState() {
        if (!state.connected) return "disconnected";
        if (state.pending) return "pending";
        if (state.error) return "error";
        if (!state.synced) return "waiting";
        return state.active ? "playing" : "idle";
    }

    function updateUI() {
        const panel = getEl("show_narration_control");
        const button = getEl("show_narration_toggle");
        const status = getEl("show_narration_status");
        const statusText = getEl("show_narration_status_text");
        if (!panel) return;
        const code = visualState();
        panel.dataset.state = code;
        panel.setAttribute("aria-busy", state.pending ? "true" : "false");
        const disabled = !state.connected || !state.synced || Boolean(state.pending);
        if (button) {
            button.disabled = disabled;
            button.setAttribute("aria-disabled", disabled ? "true" : "false");
            button.setAttribute("aria-pressed", state.active ? "true" : "false");
            button.setAttribute("aria-label", state.active ? "Pausar narración visual" : "Iniciar narración visual");
            button.classList.toggle("is-playing", state.active);
            const icon = button.querySelector("span");
            if (icon) icon.textContent = state.active ? "■" : "▶";
        }
        let message = "";
        if (code === "disconnected") message = "SIN CONEXIÓN";
        else if (code === "waiting") message = "SINCRONIZANDO…";
        else if (code === "pending") message = "ENVIANDO…";
        else if (code === "error") message = "NO SE PUDO CAMBIAR";
        if (statusText) statusText.textContent = message;
        if (status) status.hidden = !message;
    }

    function clearPending(id = "") {
        if (!state.pending || (id && state.pending.id !== id)) return false;
        if (state.pending.timer) global.clearTimeout(state.pending.timer);
        state.pending = null;
        return true;
    }

    function applyState(payload = {}) {
        const normalized = normalizeState(payload);
        state = {
            ...state,
            ...normalized,
            synced: true,
            error: ""
        };
        clearPending();
        updateUI();
        return { ...state };
    }

    function settle(id, response = {}) {
        if (!clearPending(id)) return false;
        if (response && response.ok === true) {
            applyState(response.estado || response);
            return true;
        }
        state.error = String(response && response.code || "REQUEST_FAILED");
        updateUI();
        return false;
    }

    function emitAction(eventName) {
        const socketRef = getSocket();
        if (!socketRef || !socketRef.connected || state.pending) return false;
        const id = requestId();
        state.error = "";
        state.pending = {
            id,
            timer: global.setTimeout(() => settle(id, { ok: false, code: "TIMEOUT" }), ACK_TIMEOUT_MS)
        };
        updateUI();
        socketRef.emit(eventName, { request_id: id }, (response = {}) => settle(id, response));
        return true;
    }

    function toggle() {
        if (state.active) return emitAction("narracion_show_detener");
        const oldTutorial = global.ScribVideotutorialControl;
        if (oldTutorial && typeof oldTutorial.obtenerEstado === "function") {
            const previous = oldTutorial.obtenerEstado();
            if (previous && (previous.visible || previous.reproduciendo)) oldTutorial.ocultar();
        }
        return emitAction("narracion_show_reproducir");
    }

    function markConnection(value) {
        state.connected = Boolean(value);
        if (!state.connected) {
            state.synced = false;
            clearPending();
        }
        updateUI();
    }

    function initialize() {
        if (initialized || !global.document || !getEl("show_narration_control")) return;
        initialized = true;
        getEl("show_narration_toggle")?.addEventListener("click", toggle);
        const socketRef = getSocket();
        markConnection(Boolean(socketRef && socketRef.connected));
    }

    const api = Object.freeze({
        applyState,
        initialize,
        markConnection,
        normalizeState,
        toggle,
        getState: () => ({ ...state, pending: state.pending ? { id: state.pending.id } : null })
    });
    global.ScribShowNarrationControl = api;
    if (global.document && global.document.readyState === "loading") {
        global.document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else initialize();
}(window));
