(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.ScribViewTransition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const COVER_MS = 320;
    const REVEAL_MS = 620;

    const VIEW_LABELS = Object.freeze({
        partida: "VISTA PARTIDA",
        calentamiento: "VISTA DETONADORES",
        stats: "ESTADÍSTICAS",
        puntuacion: "RESULTADO",
        nube_inspiracion: "NUBE DE INSPIRACIÓN",
        creditos: "CRÉDITOS"
    });

    function viewLabel(mode) {
        return VIEW_LABELS[mode] || "NUEVA VISTA";
    }

    function createController(options = {}) {
        const overlay = options.overlay || null;
        const setTimer = options.setTimer || setTimeout;
        const clearTimer = options.clearTimer || clearTimeout;
        const reducedMotion = typeof options.reducedMotion === "function"
            ? options.reducedMotion
            : () => false;
        let timers = [];
        let destination = "";
        let running = false;

        const clearTimers = () => {
            timers.forEach((timer) => clearTimer(timer));
            timers = [];
        };

        const resetOverlay = () => {
            if (!overlay) return;
            overlay.classList.remove("is-covering", "is-revealing");
            overlay.hidden = true;
            overlay.setAttribute("aria-hidden", "true");
            delete overlay.dataset.destination;
        };

        const cancel = () => {
            clearTimers();
            destination = "";
            running = false;
            resetOverlay();
        };

        const transition = ({ from, to, swap }) => {
            if (typeof swap !== "function") return false;
            if (running && destination === to) return true;

            clearTimers();
            running = false;
            destination = "";

            if (!overlay || from === to || reducedMotion()) {
                resetOverlay();
                swap();
                return false;
            }

            destination = to;
            running = true;
            overlay.dataset.destination = to;
            const label = overlay.querySelector("[data-view-transition-label]");
            if (label) label.textContent = viewLabel(to);
            overlay.hidden = false;
            overlay.setAttribute("aria-hidden", "true");
            overlay.classList.remove("is-covering", "is-revealing");
            void overlay.offsetWidth;
            overlay.classList.add("is-covering");

            timers.push(setTimer(() => {
                swap();
                overlay.classList.remove("is-covering");
                overlay.classList.add("is-revealing");
                timers.push(setTimer(() => {
                    destination = "";
                    running = false;
                    resetOverlay();
                }, REVEAL_MS));
            }, COVER_MS));
            return true;
        };

        return {
            transition,
            cancel,
            isRunningTo: (mode) => running && destination === mode
        };
    }

    return {
        COVER_MS,
        REVEAL_MS,
        VIEW_LABELS,
        viewLabel,
        createController
    };
});
