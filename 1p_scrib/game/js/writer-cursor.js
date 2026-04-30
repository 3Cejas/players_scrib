let cursor_pluma_escritora = null;
let caret_neon_escritora = null;
let raf_caret_neon_escritora = null;
let bloqueo_selectionchange_caret_neon_escritora = false;
let partida_activa_cursor_pluma = false;
let caret_offset_memorizado_juego_1p = 0;
let raf_reenfoque_texto_juego_1p = null;
let persistencia_foco_texto_juego_1p_iniciada = false;
let timeout_cursor_pluma_inactivo_escritora = null;
let timeout_click_cursor_pluma_escritora = null;
const CURSOR_PLUMA_INACTIVIDAD_MS = 1600;
const soporta_cursor_pluma_escritora = (() => {
    return true;
})();

function seleccionPerteneceATextoJuego1P() {
    if (!texto) return false;
    const sel = window.getSelection();
    return Boolean(sel && sel.rangeCount && texto.contains(sel.anchorNode));
}

function debeMantenerFocoTextoJuego1P() {
    const body = document.body;
    if (!texto || !body) return false;
    if (!texto.isContentEditable || !esVisibleUIJuego1P(texto)) return false;
    if (body.classList.contains("ui-dashboard-only") || body.classList.contains("modo-opciones")) return false;
    if (document.hidden) return false;
    if (hayOverlayBloqueanteTextoJuego1P()) return false;
    return true;
}

function memorizarOffsetCaretTextoJuego1P() {
    if (!texto || !seleccionPerteneceATextoJuego1P()) return false;
    const offset = obtenerOffsetCaretEnTexto();
    if (!Number.isFinite(offset)) return false;
    caret_offset_memorizado_juego_1p = Math.max(0, offset);
    return true;
}

function restaurarFocoTextoJuego1P() {
    if (!debeMantenerFocoTextoJuego1P()) return false;
    try {
        texto.focus({ preventScroll: true });
    } catch (err) {
        texto.focus();
    }
    colocarCaretEnOffset(caret_offset_memorizado_juego_1p);
    programarActualizacionCaretNeonEscritora();
    return true;
}

function programarReenfoqueTextoJuego1P() {
    if (raf_reenfoque_texto_juego_1p) return;
    raf_reenfoque_texto_juego_1p = requestAnimationFrame(() => {
        raf_reenfoque_texto_juego_1p = null;
        if (!debeMantenerFocoTextoJuego1P()) return;
        if (document.activeElement === texto && seleccionPerteneceATextoJuego1P()) {
            programarActualizacionCaretNeonEscritora();
            return;
        }
        restaurarFocoTextoJuego1P();
    });
}

function inicializarPersistenciaFocoTextoJuego1P() {
    if (persistencia_foco_texto_juego_1p_iniciada || !texto) return;
    persistencia_foco_texto_juego_1p_iniciada = true;

    texto.addEventListener("blur", () => {
        memorizarOffsetCaretTextoJuego1P();
        programarReenfoqueTextoJuego1P();
    });
    ["focus", "click", "input", "keydown", "keyup", "mouseup", "touchend"].forEach((evento) => {
        texto.addEventListener(evento, memorizarOffsetCaretTextoJuego1P);
    });
    document.addEventListener("mousedown", memorizarOffsetCaretTextoJuego1P, true);
    document.addEventListener("touchstart", memorizarOffsetCaretTextoJuego1P, { capture: true, passive: true });
    document.addEventListener("focusin", (evento) => {
        if (!debeMantenerFocoTextoJuego1P()) return;
        const objetivo = evento.target;
        if (objetivo === texto || (objetivo instanceof Node && texto.contains(objetivo))) {
            memorizarOffsetCaretTextoJuego1P();
            return;
        }
        programarReenfoqueTextoJuego1P();
    }, true);
    document.addEventListener("click", (evento) => {
        if (!debeMantenerFocoTextoJuego1P()) return;
        const objetivo = evento.target;
        if (objetivo === texto || (objetivo instanceof Node && texto.contains(objetivo))) return;
        programarReenfoqueTextoJuego1P();
    }, true);
    document.addEventListener("selectionchange", () => {
        memorizarOffsetCaretTextoJuego1P();
    });
    window.addEventListener("fullscreenchange", programarReenfoqueTextoJuego1P);
    window.addEventListener("webkitfullscreenchange", programarReenfoqueTextoJuego1P);
}

function setPartidaActivaCursorPluma(activa) {
    partida_activa_cursor_pluma = Boolean(activa);
    if (texto && texto.classList) {
        texto.classList.add("textarea--pluma-cursor-visible");
    }
    if (!partida_activa_cursor_pluma) {
        limpiarOcultacionCursorPlumaInactivo();
        ocultarCursorPlumaEscritora();
        ocultarCaretNeonEscritora();
    } else {
        programarActualizacionCaretNeonEscritora();
    }
}

function limpiarOcultacionCursorPlumaInactivo() {
    clearTimeout(timeout_cursor_pluma_inactivo_escritora);
    timeout_cursor_pluma_inactivo_escritora = null;
}

function programarOcultacionCursorPlumaInactivo() {
    limpiarOcultacionCursorPlumaInactivo();
    if (!partida_activa_cursor_pluma || !soporta_cursor_pluma_escritora) return;
    if (!debeMantenerFocoTextoJuego1P()) return;
    timeout_cursor_pluma_inactivo_escritora = setTimeout(() => {
        timeout_cursor_pluma_inactivo_escritora = null;
        ocultarCursorPlumaEscritora();
    }, CURSOR_PLUMA_INACTIVIDAD_MS);
}

function ocultarCursorPlumaEscritora() {
    if (!cursor_pluma_escritora) return;
    cursor_pluma_escritora.classList.remove("activa");
}

function ocultarCaretNeonEscritora() {
    if (!caret_neon_escritora) return;
    caret_neon_escritora.classList.remove("activa");
}

function posicionarCursorPlumaEscritora(clientX, clientY) {
    if (!cursor_pluma_escritora) return;
    cursor_pluma_escritora.style.left = `${clientX}px`;
    cursor_pluma_escritora.style.top = `${clientY}px`;
}

function pulsarCursorPlumaEscritora() {
    if (!cursor_pluma_escritora) return;
    cursor_pluma_escritora.classList.add("is-pressing");
    clearTimeout(timeout_click_cursor_pluma_escritora);
    timeout_click_cursor_pluma_escritora = setTimeout(() => {
        timeout_click_cursor_pluma_escritora = null;
        if (!cursor_pluma_escritora) return;
        cursor_pluma_escritora.classList.remove("is-pressing");
    }, 140);
}

function posicionarCaretNeonEscritora(rect) {
    if (!caret_neon_escritora || !rect) return;
    const altura = Math.max(26, Math.round((rect.height || 0) + 8));
    caret_neon_escritora.style.left = `${Math.round(rect.left)}px`;
    caret_neon_escritora.style.top = `${Math.round(rect.top)}px`;
    caret_neon_escritora.style.height = `${altura}px`;
}

function mostrarCursorPlumaEscritora(clientX, clientY) {
    if (!cursor_pluma_escritora || !texto) return;
    if (hayOverlayBloqueanteCursorPluma1P()) {
        ocultarCursorPlumaEscritora();
        return;
    }
    posicionarCursorPlumaEscritora(clientX, clientY);
    cursor_pluma_escritora.classList.add("activa");
    programarOcultacionCursorPlumaInactivo();
}

function obtenerRectCaretActualEscritora() {
    if (!texto) return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const original = sel.getRangeAt(0).cloneRange();
    if (!original.collapsed || !texto.contains(original.startContainer)) return null;

    let rect = original.getBoundingClientRect();
    if (rect && rect.height > 0) {
        return rect;
    }

    const marcador = document.createElement("span");
    marcador.setAttribute("aria-hidden", "true");
    marcador.textContent = "\u200b";
    marcador.style.display = "inline-block";
    marcador.style.width = "1px";
    marcador.style.height = "1em";
    marcador.style.padding = "0";
    marcador.style.margin = "0";
    marcador.style.opacity = "0";
    marcador.style.pointerEvents = "none";

    const rangoPrueba = original.cloneRange();
    rangoPrueba.insertNode(marcador);
    rect = marcador.getBoundingClientRect();
    if (marcador.parentNode) {
        marcador.parentNode.removeChild(marcador);
    }
    bloqueo_selectionchange_caret_neon_escritora = true;
    sel.removeAllRanges();
    sel.addRange(original);
    requestAnimationFrame(() => {
        bloqueo_selectionchange_caret_neon_escritora = false;
    });
    return rect && rect.height > 0 ? rect : null;
}

function actualizarCaretNeonEscritora() {
    if (!texto || !caret_neon_escritora || !partida_activa_cursor_pluma || !texto.isContentEditable) {
        ocultarCaretNeonEscritora();
        return;
    }
    if (hayOverlayBloqueanteTextoJuego1P()) {
        ocultarCaretNeonEscritora();
        return;
    }
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) {
        ocultarCaretNeonEscritora();
        return;
    }
    const editorActivo = document.activeElement === texto
        || (document.activeElement instanceof Node && texto.contains(document.activeElement))
        || (typeof texto.matches === "function" && texto.matches(":focus-within"));
    if (!texto.contains(sel.anchorNode) || !editorActivo) {
        ocultarCaretNeonEscritora();
        return;
    }
    const rect = obtenerRectCaretActualEscritora();
    if (!rect || rect.height <= 0) {
        ocultarCaretNeonEscritora();
        return;
    }
    posicionarCaretNeonEscritora(rect);
    caret_neon_escritora.classList.add("activa");
}

function programarActualizacionCaretNeonEscritora() {
    if (raf_caret_neon_escritora) return;
    raf_caret_neon_escritora = requestAnimationFrame(() => {
        raf_caret_neon_escritora = null;
        actualizarCaretNeonEscritora();
    });
}

function crearCursorPlumaEscritora() {
    if (!texto || !document.body || !soporta_cursor_pluma_escritora) return;
    if (!cursor_pluma_escritora) {
        const nodo = document.createElement("div");
        nodo.id = "cursor_pluma_escritora";
        nodo.className = "escritora-cursor-pluma";
        document.body.appendChild(nodo);
        cursor_pluma_escritora = nodo;
    }
    if (!caret_neon_escritora) {
        const nodoCaret = document.createElement("div");
        nodoCaret.id = "caret_neon_escritora";
        nodoCaret.className = "escritora-caret-neon";
        document.body.appendChild(nodoCaret);
        caret_neon_escritora = nodoCaret;
    }
    texto.classList.add("textarea--pluma-cursor");
}

function inicializarCursorPlumaEscritora() {
    if (!texto) return;
    inicializarPersistenciaFocoTextoJuego1P();
    if (!soporta_cursor_pluma_escritora) return;
    crearCursorPlumaEscritora();
    if (!cursor_pluma_escritora) return;
    setPartidaActivaCursorPluma(false);

    const actualizar = (evt) => {
        if (!evt || typeof evt.clientX !== "number" || typeof evt.clientY !== "number") return;
        mostrarCursorPlumaEscritora(evt.clientX, evt.clientY);
    };

    texto.addEventListener("mouseenter", actualizar);
    texto.addEventListener("mousemove", actualizar);
    texto.addEventListener("mouseleave", () => {
        limpiarOcultacionCursorPlumaInactivo();
        ocultarCursorPlumaEscritora();
    });
    texto.addEventListener("blur", ocultarCursorPlumaEscritora);
    texto.addEventListener("blur", ocultarCaretNeonEscritora);
    texto.addEventListener("click", programarActualizacionCaretNeonEscritora);
    texto.addEventListener("focus", programarActualizacionCaretNeonEscritora);
    texto.addEventListener("input", programarActualizacionCaretNeonEscritora);
    texto.addEventListener("keydown", programarActualizacionCaretNeonEscritora);
    texto.addEventListener("keyup", programarActualizacionCaretNeonEscritora);
    texto.addEventListener("mouseup", programarActualizacionCaretNeonEscritora);
    texto.addEventListener("touchstart", () => {
        programarActualizacionCaretNeonEscritora();
    }, { passive: true });
    texto.addEventListener("touchend", () => {
        requestAnimationFrame(programarActualizacionCaretNeonEscritora);
    }, { passive: true });
    texto.addEventListener("scroll", programarActualizacionCaretNeonEscritora);
    document.addEventListener("mousemove", actualizar);
    document.addEventListener("pointerdown", (evt) => {
        if (!evt || typeof evt.clientX !== "number" || typeof evt.clientY !== "number") return;
        if (!partida_activa_cursor_pluma) return;
        mostrarCursorPlumaEscritora(evt.clientX, evt.clientY);
        pulsarCursorPlumaEscritora();
    }, { passive: true });
    document.addEventListener("touchend", () => {
        requestAnimationFrame(programarActualizacionCaretNeonEscritora);
    }, { passive: true });
    document.addEventListener("selectionchange", () => {
        if (bloqueo_selectionchange_caret_neon_escritora) return;
        const sel = window.getSelection();
        if (!texto || !sel || !sel.rangeCount) return;
        const editorActivo = document.activeElement === texto
            || (document.activeElement instanceof Node && texto.contains(document.activeElement))
            || (typeof texto.matches === "function" && texto.matches(":focus-within"));
        if (!editorActivo && !texto.contains(sel.anchorNode)) return;
        programarActualizacionCaretNeonEscritora();
    });
    window.addEventListener("blur", ocultarCursorPlumaEscritora);
    window.addEventListener("blur", ocultarCaretNeonEscritora);
    window.addEventListener("blur", limpiarOcultacionCursorPlumaInactivo);
    window.addEventListener("resize", programarActualizacionCaretNeonEscritora);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            limpiarOcultacionCursorPlumaInactivo();
            ocultarCursorPlumaEscritora();
            ocultarCaretNeonEscritora();
        }
    });
    if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
        window.visualViewport.addEventListener("resize", programarActualizacionCaretNeonEscritora);
        window.visualViewport.addEventListener("scroll", programarActualizacionCaretNeonEscritora);
    }
}

inicializarCursorPlumaEscritora();
setModoDashboardSolo(document.body && document.body.classList.contains("ui-dashboard-only"));
