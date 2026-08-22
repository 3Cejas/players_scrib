(function registerScribDramaturgiaRole(global) {
    global.ScribRoleModules = global.ScribRoleModules || {};
    global.ScribRoleModules.dramaturgia = {
        model: true,
        state: true,
        socketEvents: true,
        readOnly: true
    };
})(window);

const DRAMATURGIA_PAN_THRESHOLD = 6;
const DRAMATURGIA_PAN_BLOCKING_SELECTOR = [
    "button",
    "a",
    "input",
    "select",
    "textarea",
    "iframe",
    "[role='button']",
    "[contenteditable='true']"
].join(",");

function bindDramaturgiaMapPan(viewport) {
    if (!viewport || viewport.dataset.mapPanBound === "true") return;
    viewport.dataset.mapPanBound = "true";
    viewport.classList.add("is-pan-enabled");

    let gesture = null;
    let suppressNextClick = false;
    let suppressTimer = 0;
    const scrollSurface = () => viewport.querySelector(".show-score") || viewport;

    const finishGesture = (event) => {
        if (!gesture || (event && event.pointerId !== gesture.pointerId)) return;
        const finished = gesture;
        gesture = null;
        viewport.classList.remove("is-panning");
        if (
            typeof viewport.hasPointerCapture === "function"
            && viewport.hasPointerCapture(finished.pointerId)
            && typeof viewport.releasePointerCapture === "function"
        ) {
            viewport.releasePointerCapture(finished.pointerId);
        }
        if (finished.dragging) {
            suppressNextClick = true;
            window.clearTimeout(suppressTimer);
            suppressTimer = window.setTimeout(() => {
                suppressNextClick = false;
            }, 0);
        }
    };

    viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "touch" || event.button !== 0) return;
        const interactive = event.target.closest?.(DRAMATURGIA_PAN_BLOCKING_SELECTOR);
        const isSnapshotOpen = interactive?.matches?.(".history-view__open");
        if (interactive && !isSnapshotOpen) return;
        const surface = scrollSurface();
        gesture = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: surface.scrollLeft,
            scrollTop: surface.scrollTop,
            surface,
            dragging: false
        };
    });

    viewport.addEventListener("pointermove", (event) => {
        if (!gesture || event.pointerId !== gesture.pointerId) return;
        const deltaX = event.clientX - gesture.startX;
        const deltaY = event.clientY - gesture.startY;
        if (!gesture.dragging && Math.hypot(deltaX, deltaY) < DRAMATURGIA_PAN_THRESHOLD) return;
        if (!gesture.dragging) {
            gesture.dragging = true;
            viewport.classList.add("is-panning");
            if (typeof viewport.setPointerCapture === "function") {
                viewport.setPointerCapture(event.pointerId);
            }
        }
        event.preventDefault();
        gesture.surface.scrollLeft = gesture.scrollLeft - deltaX;
        gesture.surface.scrollTop = gesture.scrollTop - deltaY;
    });

    viewport.addEventListener("pointerup", finishGesture);
    viewport.addEventListener("pointercancel", finishGesture);
    viewport.addEventListener("lostpointercapture", finishGesture);
    viewport.addEventListener("pointerleave", (event) => {
        if (gesture && !gesture.dragging) finishGesture(event);
    });
    viewport.addEventListener("click", (event) => {
        if (!suppressNextClick) return;
        suppressNextClick = false;
        window.clearTimeout(suppressTimer);
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);
}

async function initializeDramaturgiaInterface() {
    if (typeof window.initializeDramaturgiaTools === "function") {
        window.initializeDramaturgiaTools();
    }
    if (window.ScribDramaturgiaHistoryController) {
        try {
            await window.ScribDramaturgiaHistoryController.initialize();
        } catch (_error) {
            // El controlador deja el fallo visible en el estado del archivo.
        }
    }

    document.querySelectorAll("[data-space-filter]").forEach((button) => {
        button.addEventListener("click", () => setDramaturgiaFilter(button.dataset.spaceFilter));
    });

    document.querySelectorAll("[data-phase-filter]").forEach((button) => {
        button.addEventListener("click", () => setDramaturgiaPhaseFilter(button.dataset.phaseFilter));
    });

    const zoomOut = dramaturgiaEl("dramaturgia_zoom_out");
    const zoomIn = dramaturgiaEl("dramaturgia_zoom_in");
    const zoomFit = dramaturgiaEl("dramaturgia_zoom_fit");
    if (zoomOut) zoomOut.addEventListener("click", () => setDramaturgiaZoom(dramaturgiaUi.graphZoom - 0.1));
    if (zoomIn) zoomIn.addEventListener("click", () => setDramaturgiaZoom(dramaturgiaUi.graphZoom + 0.1));
    if (zoomFit) zoomFit.addEventListener("click", fitDramaturgiaMapZoom);

    const graphViewport = dramaturgiaEl("dramaturgia_graph_viewport");
    bindDramaturgiaMapPan(graphViewport);

    let resizeFrame = 0;
    window.addEventListener("resize", () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(scheduleDramaturgiaRender);
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            requestDramaturgiaSync();
        }
    });

    setDramaturgiaFilter("todos");
    setDramaturgiaPhaseFilter("todas");
    setDramaturgiaZoom(1);
    scheduleDramaturgiaRender();

    if (!dramaturgiaUi.staleTimer) {
        dramaturgiaUi.staleTimer = window.setInterval(renderDramaturgiaHeader, 1000);
    }

    if (dramaturgiaSocket && typeof dramaturgiaSocket.connect === "function") {
        dramaturgiaSocket.connect();
    } else {
        setDramaturgiaConnection(false, "La biblioteca de conexión no está disponible");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDramaturgiaInterface);
} else {
    initializeDramaturgiaInterface();
}
