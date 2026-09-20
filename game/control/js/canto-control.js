(function initCantoControl(global) {
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
    const requestId = () => `canto_${Date.now().toString(36)}_${(++requestCounter).toString(36)}`;

    function normalizeState(payload = {}) {
        const data = payload && payload.estado && typeof payload.estado === "object"
            ? payload.estado
            : (payload && typeof payload === "object" ? payload : {});
        return {
            active: Boolean(data.activo),
            sequence: Math.max(0, Math.trunc(Number(data.secuencia) || 0))
        };
    }

    function updateUI() {
        const button = getEl("boton_canto");
        if (!button) return;
        const disabled = !state.connected || !state.synced || Boolean(state.pending);
        button.disabled = disabled;
        button.setAttribute("aria-disabled", disabled ? "true" : "false");
        button.setAttribute("aria-pressed", state.active ? "true" : "false");
        button.dataset.active = state.active ? "1" : "0";
        button.dataset.pending = state.pending ? "1" : "0";
        button.classList.toggle("is-active", state.active);
        button.classList.toggle("is-pending", Boolean(state.pending));
        button.title = state.active ? "Desactivar Canto" : "Activar Canto y mostrar Vista partida";
        button.setAttribute("aria-label", button.title);
        const status = getEl("canto_control_status");
        if (status) {
            status.textContent = state.error
                ? "NO SE PUDO CAMBIAR"
                : state.pending
                    ? "CAMBIANDO…"
                    : "";
            status.hidden = !status.textContent;
        }
    }

    function clearPending(id = "") {
        if (!state.pending || (id && state.pending.id !== id)) return false;
        if (state.pending.timer) global.clearTimeout(state.pending.timer);
        state.pending = null;
        return true;
    }

    function applyState(payload = {}) {
        const normalized = normalizeState(payload);
        state = { ...state, ...normalized, synced: true, error: "" };
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
        return emitAction(state.active ? "canto_desactivar" : "canto_activar");
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
        if (initialized || !global.document || !getEl("boton_canto")) return;
        initialized = true;
        getEl("boton_canto").addEventListener("click", toggle);
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
    global.ScribCantoControl = api;
    if (global.document && global.document.readyState === "loading") {
        global.document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else initialize();
}(window));
