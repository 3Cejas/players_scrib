let soporte = document.getElementById('soporte');
const players_fit_root = getEl("players_fit_root");
const contenedor_principal_escritora = getEl("contenedor");
const info_total_escritora = players_fit_root ? players_fit_root.querySelector(".info-total") : null;
let raf_ajuste_viewport_escritora = null;
let raf_ajuste_altura_editor_escritora = null;
let resize_observer_fit_viewport_escritora = null;
let resize_observer_info_total_escritora = null;
let timeout_reajuste_viewport_escritora_1 = null;
let timeout_reajuste_viewport_escritora_2 = null;
let timeout_reajuste_viewport_escritora_3 = null;
let timeout_reajuste_viewport_escritora_4 = null;
let bloqueo_resize_viewport_escritora_hasta = 0;

const resetAjusteViewportEscritora = () => {
    if (!players_fit_root) return;
    players_fit_root.style.removeProperty("width");
    players_fit_root.style.removeProperty("height");
    players_fit_root.style.removeProperty("max-height");
    players_fit_root.style.removeProperty("min-height");
    players_fit_root.style.removeProperty("transform");
};

const obtenerViewportActualEscritora = () => {
    const vv = window.visualViewport;
    const ancho = vv && Number.isFinite(vv.width) && vv.width > 0
        ? vv.width
        : window.innerWidth;
    const alto = vv && Number.isFinite(vv.height) && vv.height > 0
        ? vv.height
        : window.innerHeight;
    return {
        width: Math.max(1, Math.round(ancho || 1)),
        height: Math.max(1, Math.round(alto || 1))
    };
};

const ajustarViewportEscritora = () => {
    if (!players_fit_root) return;
    bloqueo_resize_viewport_escritora_hasta = Date.now() + 160;
    const body = document.body;
    const viewportActual = obtenerViewportActualEscritora();
    const viewportW = viewportActual.width;
    const viewportH = viewportActual.height;
    const permitirScrollPagina = Boolean(body && body.classList.contains("modo-opciones"));

    if (document.documentElement) {
        document.documentElement.style.overflowX = "hidden";
        document.documentElement.style.overflowY = permitirScrollPagina ? "auto" : "hidden";
    }
    if (body) {
        body.style.overflowX = "hidden";
        body.style.overflowY = permitirScrollPagina ? "auto" : "hidden";
    }

    players_fit_root.style.transform = "none";
    if (body && body.classList.contains("modo-opciones")) {
        players_fit_root.style.width = `${viewportW}px`;
        players_fit_root.style.height = `${viewportH}px`;
        players_fit_root.style.maxHeight = `${viewportH}px`;
        players_fit_root.style.minHeight = `${viewportH}px`;
        return;
    }
    if (body && body.classList.contains("ui-dashboard-only")) {
        players_fit_root.style.width = `${viewportW}px`;
        players_fit_root.style.height = "auto";
        players_fit_root.style.maxHeight = "none";
        players_fit_root.style.minHeight = `${viewportH}px`;
        actualizarCentroVerticalDashboard1P();
        return;
    }
    players_fit_root.style.width = `${viewportW}px`;
    players_fit_root.style.height = "auto";
    players_fit_root.style.maxHeight = "none";
    players_fit_root.style.minHeight = `${viewportH}px`;
    const anchoNatural = Math.max(Math.ceil(players_fit_root.scrollWidth || 0), 1);
    const altoNatural = Math.max(Math.ceil(players_fit_root.scrollHeight || 0), 1);
    const reservaViewportY = Math.max(42, Math.round(viewportH * 0.055));

    let escala = Math.min(1, viewportW / anchoNatural, Math.max(1, viewportH - reservaViewportY) / altoNatural);
    if (!Number.isFinite(escala) || escala <= 0) {
        escala = 1;
    }

    const offsetX = Math.max(0, (viewportW - (anchoNatural * escala)) * 0.5);
    const offsetY = Math.max(0, (viewportH - (altoNatural * escala)) * 0.5);
    players_fit_root.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0) scale(${escala.toFixed(4)})`;
};

const ajustarAlturaEditorEscritora = () => {
    if (!texto || !contenedor_principal_escritora) return;
    if (document.body && (document.body.classList.contains("ui-dashboard-only") || document.body.classList.contains("modo-opciones"))) {
        texto.style.removeProperty("min-height");
        texto.style.removeProperty("max-height");
        if (typeof programarActualizacionDegradadoTextoEscritor === "function") {
            programarActualizacionDegradadoTextoEscritor();
        }
        return;
    }
    const textareaContainer = texto.closest(".textarea-container");
    if (!textareaContainer) return;
    const viewportH = obtenerViewportActualEscritora().height;
    const topEditor = textareaContainer.getBoundingClientRect().top;
    const altoInfo = info_total_escritora ? Math.ceil(info_total_escritora.getBoundingClientRect().height) : 0;
    const margenSeguro = Math.max(76, Math.round(viewportH * 0.1));
    const disponible = Math.floor(viewportH - topEditor - altoInfo - margenSeguro);
    const maxPx = Math.max(180, disponible);
    const minPx = Math.max(110, Math.min(maxPx - 20, Math.round(maxPx * 0.38)));
    texto.style.minHeight = `${minPx}px`;
    texto.style.maxHeight = `${maxPx}px`;
    if (typeof programarActualizacionDegradadoTextoEscritor === "function") {
        programarActualizacionDegradadoTextoEscritor();
    }
};

const programarAjusteAlturaEditorEscritora = () => {
    if (raf_ajuste_altura_editor_escritora) return;
    raf_ajuste_altura_editor_escritora = requestAnimationFrame(() => {
        raf_ajuste_altura_editor_escritora = null;
        ajustarAlturaEditorEscritora();
    });
};

const programarAjusteViewportEscritora = () => {
    if (!players_fit_root) return;
    if (raf_ajuste_viewport_escritora) return;
    raf_ajuste_viewport_escritora = requestAnimationFrame(() => {
        raf_ajuste_viewport_escritora = null;
        ajustarViewportEscritora();
        ajustarAlturaEditorEscritora();
    });
};

const programarReajusteViewportEscritoraDiferido = () => {
    programarAjusteViewportEscritora();
    if (timeout_reajuste_viewport_escritora_1) {
        clearTimeout(timeout_reajuste_viewport_escritora_1);
    }
    if (timeout_reajuste_viewport_escritora_2) {
        clearTimeout(timeout_reajuste_viewport_escritora_2);
    }
    if (timeout_reajuste_viewport_escritora_3) {
        clearTimeout(timeout_reajuste_viewport_escritora_3);
    }
    if (timeout_reajuste_viewport_escritora_4) {
        clearTimeout(timeout_reajuste_viewport_escritora_4);
    }
    timeout_reajuste_viewport_escritora_1 = setTimeout(() => {
        programarAjusteViewportEscritora();
    }, 120);
    timeout_reajuste_viewport_escritora_2 = setTimeout(() => {
        programarAjusteViewportEscritora();
    }, 280);
    timeout_reajuste_viewport_escritora_3 = setTimeout(() => {
        programarAjusteViewportEscritora();
    }, 520);
    timeout_reajuste_viewport_escritora_4 = setTimeout(() => {
        programarAjusteViewportEscritora();
    }, 900);
};

function aplicarVisibilidadBotonesDashboard() {
    if (btnEscribir) btnEscribir.style.display = "";
    if (btnPantallaCompleta) btnPantallaCompleta.style.display = "";
    if (btnOpciones) btnOpciones.style.display = "";
    if (btnLimpiar) btnLimpiar.style.display = "none";
    if (btnFinal) btnFinal.style.display = "none";
    if (btnDescargarTexto) btnDescargarTexto.style.display = "none";
    sincronizarVisibilidadBtnVolver1P();
    actualizarColumnasBotonesDashboard1P();
}

const contenedor_botones_dashboard_1p = document.querySelector("body.page-players .botones");
const cabecera_dashboard_1p = document.querySelector("body.page-players .cabecera");
const footer_legal_dashboard_1p = document.getElementById("footer_legal");
let observador_columnas_botones_dashboard_1p = null;
let acciones_partida_desplegadas_1p = false;

function esVisibleUIJuego1P(elemento) {
    if (!elemento) return false;
    if (typeof window.getComputedStyle !== "function") {
        return elemento.style.display !== "none" && elemento.style.visibility !== "hidden";
    }
    const estilo = window.getComputedStyle(elemento);
    return estilo.display !== "none" && estilo.visibility !== "hidden";
}

function hayMenuResurreccionVisible1P() {
    return esVisibleUIJuego1P(getEl("mainMenu")) || esVisibleUIJuego1P(getEl("quantityMenu"));
}

function hayOverlayBloqueanteCursorPluma1P() {
    if (typeof terminado !== "undefined" && terminado) return true;
    if (typeof menu_resurreccion_activo !== "undefined" && menu_resurreccion_activo) return true;
    return hayMenuResurreccionVisible1P();
}

function hayOverlayBloqueanteTextoJuego1P() {
    if (hayOverlayBloqueanteCursorPluma1P()) return true;
    if (typeof desventajaEnCurso !== "undefined" && desventajaEnCurso) return true;
    return esVisibleUIJuego1P(desventajaOverlay);
}

function esVistaPartidaConMenuAcciones1P() {
    const body = document.body;
    if (!body) return false;
    if (body.classList.contains("ui-dashboard-only") || body.classList.contains("modo-opciones")) {
        return false;
    }
    if (typeof terminado !== "undefined" && terminado) {
        return false;
    }
    return true;
}

function actualizarTextoToggleAccionesPartida1P() {
    if (!partidaAccionesToggle) return;
    const abierto = Boolean(acciones_partida_desplegadas_1p);
    const textoAccesible = abierto
        ? tJuego1P("ui.actions_hide", {}, "\u25B4 OCULTAR OPCIONES")
        : tJuego1P("ui.actions_show", {}, "\u25BE OPCIONES");
    const textoVisible = tJuego1P("ui.actions_label", {}, "OPCIONES");
    const etiqueta = partidaAccionesToggle.querySelector(".partida-acciones-toggle-label");
    if (etiqueta) {
        etiqueta.textContent = textoVisible;
    } else {
        partidaAccionesToggle.textContent = textoVisible;
    }
    partidaAccionesToggle.setAttribute("aria-expanded", abierto ? "true" : "false");
    partidaAccionesToggle.setAttribute("aria-label", textoAccesible);
}

function sincronizarVisibilidadBtnVolver1P() {
    if (!btnVolver || !document.body) return;
    if (document.body.classList.contains("modo-opciones")) {
        btnVolver.style.setProperty("display", "inline-block", "important");
        return;
    }
    btnVolver.style.setProperty("display", "none", "important");
}

function actualizarEstadoMenuAccionesPartida1P() {
    const body = document.body;
    const mostrarBase = esVistaPartidaConMenuAcciones1P();
    const mostrarPanel = mostrarBase && Boolean(acciones_partida_desplegadas_1p);
    if (!mostrarBase) {
        acciones_partida_desplegadas_1p = false;
    }
    if (partidaAccionesToggleWrap) {
        partidaAccionesToggleWrap.hidden = !mostrarBase;
    }
    if (partidaAccionesToggle) {
        partidaAccionesToggle.disabled = false;
    }
    if (btnContraerAcciones) {
        btnContraerAcciones.style.setProperty("display", "none", "important");
    }
    if (body) {
        body.classList.toggle("partida-ui-activa", mostrarBase);
        body.classList.toggle("partida-acciones-desplegadas", mostrarPanel);
    }
    actualizarTextoToggleAccionesPartida1P();
}

function setAccionesPartidaDesplegadas1P(desplegadas) {
    acciones_partida_desplegadas_1p = Boolean(desplegadas);
    actualizarEstadoMenuAccionesPartida1P();
    programarAjusteViewportEscritora();
}

function toggleAccionesPartida1P() {
    if (!esVistaPartidaConMenuAcciones1P()) return;
    setAccionesPartidaDesplegadas1P(!acciones_partida_desplegadas_1p);
}

window.setAccionesPartidaDesplegadas1P = setAccionesPartidaDesplegadas1P;
window.actualizarEstadoMenuAccionesPartida1P = actualizarEstadoMenuAccionesPartida1P;
window.toggleAccionesPartida1P = toggleAccionesPartida1P;

if (partidaAccionesToggle) {
    partidaAccionesToggle.addEventListener("click", (evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        toggleAccionesPartida1P();
    });
}

function contarBotonesVisiblesDashboard1P() {
    if (!contenedor_botones_dashboard_1p || typeof window.getComputedStyle !== "function") return 0;
    return Array.from(contenedor_botones_dashboard_1p.querySelectorAll(".btn")).filter((boton) => {
        if (!boton) return false;
        if (boton.id === "btn_contraer_acciones") return false;
        if (boton.id === "btn_volver" && (!document.body || !document.body.classList.contains("modo-opciones"))) {
            return false;
        }
        const estilo = window.getComputedStyle(boton);
        return estilo.display !== "none" && estilo.visibility !== "hidden";
    }).length;
}

function resolverColumnasBotonesDashboard1P(totalVisibles) {
    const total = Math.max(0, Number(totalVisibles) || 0);
    if (total >= 7) return 4;
    if (total >= 5) return 3;
    if (total === 4) return 2;
    if (total === 3) return 3;
    return Math.max(1, total);
}

function actualizarCentroVerticalDashboard1P() {
    if (!contenedor_botones_dashboard_1p) return;
    const body = document.body;
    if (!body || !body.classList.contains("ui-dashboard-only") || body.classList.contains("modo-opciones")) {
        contenedor_botones_dashboard_1p.style.removeProperty("--botones-offset-y");
        return;
    }
    const viewportH = obtenerViewportActualEscritora().height || window.innerHeight || 0;
    if (!viewportH) {
        contenedor_botones_dashboard_1p.style.removeProperty("--botones-offset-y");
        return;
    }
    contenedor_botones_dashboard_1p.style.setProperty("--botones-offset-y", "0px");
    const botonesRect = contenedor_botones_dashboard_1p.getBoundingClientRect();
    if (!botonesRect || botonesRect.height <= 0) return;

    const objetivoTop = Math.max(0, (viewportH - botonesRect.height) * 0.5);
    const topActual = botonesRect.top;
    let desplazamiento = Math.round(objetivoTop - topActual);

    if (cabecera_dashboard_1p) {
        const cabeceraRect = cabecera_dashboard_1p.getBoundingClientRect();
        const espacioMinimo = Math.round((cabeceraRect.bottom + 10) - topActual);
        desplazamiento = Math.max(desplazamiento, espacioMinimo);
    }

    if (footer_legal_dashboard_1p && typeof window.getComputedStyle === "function") {
        const estiloFooter = window.getComputedStyle(footer_legal_dashboard_1p);
        if (estiloFooter.display !== "none" && estiloFooter.visibility !== "hidden") {
            const footerRect = footer_legal_dashboard_1p.getBoundingClientRect();
            const espacioInferior = Math.floor((viewportH - 10) - footerRect.bottom);
            desplazamiento = Math.min(desplazamiento, espacioInferior);
        }
    }

    const siguienteOffset = `${Math.max(0, desplazamiento)}px`;
    if (contenedor_botones_dashboard_1p.style.getPropertyValue("--botones-offset-y").trim() !== siguienteOffset) {
        contenedor_botones_dashboard_1p.style.setProperty("--botones-offset-y", siguienteOffset);
    }
}

function actualizarColumnasBotonesDashboard1P() {
    if (!contenedor_botones_dashboard_1p) return;
    const visibles = contarBotonesVisiblesDashboard1P();
    const columnas = resolverColumnasBotonesDashboard1P(visibles);
    const columnasTexto = String(columnas);
    const visiblesTexto = String(visibles);
    if (contenedor_botones_dashboard_1p.style.getPropertyValue("--botones-columns-auto").trim() !== columnasTexto) {
        contenedor_botones_dashboard_1p.style.setProperty("--botones-columns-auto", columnasTexto);
    }
    if (contenedor_botones_dashboard_1p.dataset.botonesVisibles !== visiblesTexto) {
        contenedor_botones_dashboard_1p.dataset.botonesVisibles = visiblesTexto;
    }
    actualizarCentroVerticalDashboard1P();
    actualizarEstadoMenuAccionesPartida1P();
}

function iniciarObservadorColumnasBotonesDashboard1P() {
    if (!contenedor_botones_dashboard_1p || observador_columnas_botones_dashboard_1p || typeof MutationObserver !== "function") {
        actualizarColumnasBotonesDashboard1P();
        return;
    }
    observador_columnas_botones_dashboard_1p = new MutationObserver((mutaciones) => {
        const hayCambioExterno = mutaciones.some((mutacion) => {
            if (!mutacion) return false;
            if (mutacion.type !== "attributes") return true;
            if (mutacion.target !== contenedor_botones_dashboard_1p) return true;
            return mutacion.attributeName !== "style"
                && mutacion.attributeName !== "data-botones-visibles"
                && mutacion.attributeName !== "class";
        });
        if (!hayCambioExterno) return;
        actualizarColumnasBotonesDashboard1P();
    });
    observador_columnas_botones_dashboard_1p.observe(contenedor_botones_dashboard_1p, {
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden"]
    });
    actualizarColumnasBotonesDashboard1P();
}

function setModoDashboardSolo(activo) {
    if (!document.body) return;
    document.body.classList.toggle("ui-dashboard-only", Boolean(activo));
    if (activo) {
        setPartidaActivaCursorPluma(false);
        aplicarVisibilidadBotonesDashboard();
    } else {
        setPartidaActivaCursorPluma(true);
        ocultarCursorPlumaEscritora();
    }
    actualizarColumnasBotonesDashboard1P();
    programarAjusteViewportEscritora();
    programarAjusteAlturaEditorEscritora();
}

const iniciarAjusteViewportEscritora = () => {
    if (document.documentElement) {
        document.documentElement.style.overflow = "hidden";
    }
    if (document.body) {
        document.body.style.overflow = "hidden";
    }
    if (!players_fit_root) return;
    if (!resize_observer_fit_viewport_escritora && typeof ResizeObserver === "function") {
        resize_observer_fit_viewport_escritora = new ResizeObserver(() => {
            if (Date.now() < bloqueo_resize_viewport_escritora_hasta) return;
            programarReajusteViewportEscritoraDiferido();
        });
        resize_observer_fit_viewport_escritora.observe(players_fit_root);
    }
    if (!resize_observer_info_total_escritora && info_total_escritora && typeof ResizeObserver === "function") {
        resize_observer_info_total_escritora = new ResizeObserver(() => {
            if (Date.now() < bloqueo_resize_viewport_escritora_hasta) return;
            programarAjusteAlturaEditorEscritora();
            programarReajusteViewportEscritoraDiferido();
        });
        resize_observer_info_total_escritora.observe(info_total_escritora);
    }
    programarReajusteViewportEscritoraDiferido();
};

window.addEventListener("resize", programarReajusteViewportEscritoraDiferido);
window.addEventListener("orientationchange", programarReajusteViewportEscritoraDiferido);
window.addEventListener("load", programarReajusteViewportEscritoraDiferido);
window.addEventListener("fullscreenchange", programarReajusteViewportEscritoraDiferido);
window.addEventListener("webkitfullscreenchange", programarReajusteViewportEscritoraDiferido);
if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
    window.visualViewport.addEventListener("resize", programarReajusteViewportEscritoraDiferido);
}

iniciarObservadorColumnasBotonesDashboard1P();
iniciarAjusteViewportEscritora();
