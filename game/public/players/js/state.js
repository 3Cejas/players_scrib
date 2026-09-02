// Se establece la conexiÃ³n con el servidor segÃºn si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl, { autoConnect: false });
const getEl = id => document.getElementById(id); // Obtiene los elementos con id.
const escapeHtml = (valor) => String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const normalizarFirmaMusaPublico = (payload = {}, opciones = {}) => {
    if (window.ScribInspiration && typeof window.ScribInspiration.normalizarFirmaMusa === "function") {
        return window.ScribInspiration.normalizarFirmaMusa(payload, opciones);
    }
    const valor = payload && typeof payload === "object"
        ? (payload.musa_nombre || payload.nombre_musa || payload.musa || "")
        : payload;
    const nombre = String(valor || "").trim().slice(0, 24).toUpperCase() || (opciones.fallback === false ? "" : "MUSA");
    return { autores: nombre ? [nombre] : [], texto: nombre, completo: nombre };
};
const crearNodoFirmaMusaPublico = (payload = {}, clase = "") => {
    const firma = normalizarFirmaMusaPublico(payload);
    if (!firma.texto) return null;
    const nodo = document.createElement("span");
    nodo.className = ["inspiration-author", clase].filter(Boolean).join(" ");
    nodo.title = firma.completo;
    nodo.setAttribute("aria-label", `Musa: ${firma.completo}`);
    const destello = document.createElement("span");
    destello.className = "inspiration-author__spark";
    destello.setAttribute("aria-hidden", "true");
    destello.textContent = "✦";
    const nombre = document.createElement("span");
    nombre.className = "inspiration-author__name";
    nombre.textContent = firma.texto;
    nodo.append(destello, nombre);
    return nodo;
};
// Reutiliza helpers globales de traduccion para evitar colisiones globales.
const traducirStripModoMusa = (modo) => (
    (window && typeof window.scribTranslateModeStrip2P === "function")
        ? window.scribTranslateModeStrip2P(modo)
        : [String(modo || "").toUpperCase()]
);
const formatearPuntosJuego2P = (valor) => (
    (window && typeof window.scribFormatWordsCount2P === "function")
        ? window.scribFormatWordsCount2P(valor)
        : `${Number(valor) || 0} palabras`
);
const refrescarCountdownMusa = () => {
    if (window && typeof window.scribRefreshCountdownText2P === "function") {
        window.scribRefreshCountdownText2P(document.getElementById("countdown"));
    }
};

function obtenerMensajesSolicitudCalentamiento() {
    return {
        ninguna: {
            estado: tJuego2P(
                "warmup.muse.state.none",
                {},
                "Sin detonador activo. Usa la bandera hasta que control active una consigna."
            )
        },
        libre: {
            estado: tJuego2P(
                "warmup.muse.state.none",
                {},
                "Sin detonador activo. Usa la bandera hasta que control active una consigna."
            ),
            placeholder: tJuego2P("warmup.muse.placeholder.word", {}, "Escribe una palabra")
        },
        lugares: {
            estado: tJuego2P("warmup.muse.state.lugares_html", {}, "Inspira lugares o sitios donde la historia nacera."),
            estadoHtml: tJuego2P("warmup.muse.state.lugares_html", {}, "Inspira lugares o sitios donde la historia nacera."),
            placeholder: tJuego2P("warmup.muse.placeholder.place", {}, "Ejemplo: playa")
        },
        acciones: {
            estado: tJuego2P("warmup.muse.state.acciones_html", {}, "Inspira acciones (verbos) con las que la historia avance."),
            estadoHtml: tJuego2P("warmup.muse.state.acciones_html", {}, "Inspira acciones (verbos) con las que la historia avance."),
            placeholder: tJuego2P("warmup.muse.placeholder.action", {}, "Ejemplo: correr")
        },
        frase_final: {
            estado: tJuego2P("warmup.muse.state.frase_final_html", {}, "Inspira la frase final."),
            estadoHtml: tJuego2P("warmup.muse.state.frase_final_html", {}, "Inspira la frase final."),
            placeholder: tJuego2P("warmup.muse.placeholder.final", {}, "Ejemplo: hacia el destino final")
        }
    };
}

animateCSS(".contenedor", "pulse");

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tema = getEl("temas");
let metadatos = getEl("metadatos");
let text_progress = getEl("text-progress");
let bar_progress = getEl("bar-progress");
let ui_partida_activa_musa = false;
let ui_partida_finalizada_musa = false;
const musa_view_transition = getEl("musa_view_transition");
let vista_visual_musa = "espera";
let timeout_revelado_vista_musa = null;
const controlador_transicion_vista_musa = window.ScribViewTransition
    ? window.ScribViewTransition.createController({
        overlay: musa_view_transition,
        reducedMotion: () => Boolean(
            window.matchMedia
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
    })
    : null;

function animarTransicionVistaMusa(destino) {
    const siguiente = String(destino || "espera").trim().toLowerCase() || "espera";
    if (siguiente === vista_visual_musa) return false;
    const anterior = vista_visual_musa;
    vista_visual_musa = siguiente;
    if (document.body) {
        document.body.classList.remove("musa-vista-cambiando");
        void document.body.offsetWidth;
        document.body.classList.add("musa-vista-cambiando");
        if (timeout_revelado_vista_musa) clearTimeout(timeout_revelado_vista_musa);
        timeout_revelado_vista_musa = setTimeout(() => {
            document.body?.classList.remove("musa-vista-cambiando");
            timeout_revelado_vista_musa = null;
        }, 980);
    }
    if (!controlador_transicion_vista_musa) return false;
    return controlador_transicion_vista_musa.transition({
        from: anterior,
        to: siguiente,
        swap() {}
    });
}

function refrescarClasesUiPartidaMusa() {
    if (!document.body) return;
    if (ui_partida_finalizada_musa) {
        animarTransicionVistaMusa("resultado");
    } else if (ui_partida_activa_musa) {
        animarTransicionVistaMusa("partida");
    }
    document.body.classList.toggle("partida-activa", ui_partida_activa_musa);
    document.body.classList.toggle("partida-finalizada-musa", ui_partida_finalizada_musa);
}

function setUiPartidaActivaMusa(activa) {
    ui_partida_activa_musa = Boolean(activa);
    if (ui_partida_activa_musa) {
        ui_partida_finalizada_musa = false;
        if (typeof cerrarPreShowMusaPorTutorial === "function") {
            cerrarPreShowMusaPorTutorial();
        }
    }
    refrescarClasesUiPartidaMusa();
}

function setUiPartidaFinalizadaMusa(finalizada) {
    ui_partida_finalizada_musa = Boolean(finalizada);
    if (ui_partida_finalizada_musa) {
        ui_partida_activa_musa = false;
        if (typeof cerrarPreShowMusaPorTutorial === "function") {
            cerrarPreShowMusaPorTutorial();
        }
    }
    refrescarClasesUiPartidaMusa();
}

const CLASE_INTRO_PARTIDA_MUSA = "partida-intro-musa";
const CLASES_ETAPAS_INTRO_PARTIDA_MUSA = [
    "partida-intro-stage-tiempo",
    "partida-intro-stage-metadatos",
    "partida-intro-stage-acciones",
    "partida-intro-stage-niveles"
];
let secuencia_inicio_musa_activa = false;
let post_inicio_pendiente_musa = false;

function limpiarClasesIntroPartidaMusa() {
    if (!document.body) return;
    document.body.classList.remove(CLASE_INTRO_PARTIDA_MUSA);
    CLASES_ETAPAS_INTRO_PARTIDA_MUSA.forEach((clase) => {
        document.body.classList.remove(clase);
    });
}

function iniciarSecuenciaIntroPartidaMusa() {
    if (!document.body) return;
    limpiarClasesIntroPartidaMusa();
    document.body.classList.add(CLASE_INTRO_PARTIDA_MUSA);
    secuencia_inicio_musa_activa = true;
    post_inicio_pendiente_musa = false;
    revelarEtapaIntroPartidaMusa(0);
}

function revelarEtapaIntroPartidaMusa(etapa) {
    if (!document.body || !Number.isFinite(etapa)) return;
    const total = CLASES_ETAPAS_INTRO_PARTIDA_MUSA.length;
    const limite = Math.max(0, Math.min(total, Math.floor(etapa)));
    for (let i = 0; i < total; i++) {
        if (i < limite) {
            document.body.classList.add(CLASES_ETAPAS_INTRO_PARTIDA_MUSA[i]);
        }
    }
}

function finalizarSecuenciaIntroPartidaMusa() {
    secuencia_inicio_musa_activa = false;
    revelarEtapaIntroPartidaMusa(CLASES_ETAPAS_INTRO_PARTIDA_MUSA.length);
    if (post_inicio_pendiente_musa) {
        post_inicio_pendiente_musa = false;
        aplicarPostInicioMusa();
    }
}

setUiPartidaActivaMusa(false);
setUiPartidaFinalizadaMusa(false);

if (tiempo) {
    tiempo.style.display = "none";
}

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";
const DURACION_ANIMACION_ENTRADA_VIDA_MS = 880;
const animacionesEntradaBarraVida = new WeakMap();
let animacionEntradaVidaPendiente = false;

function extraerSegundosTiempo(texto) {
    if (!texto || typeof texto !== "string" || texto.indexOf(":") === -1) {
        return null;
    }
    const partes = texto.split(":");
    if (partes.length < 2) {
        return null;
    }
    const minutos = parseInt(partes[0], 10);
    const segundos = parseInt(partes[1], 10);
    if (Number.isNaN(minutos) || Number.isNaN(segundos)) {
        return null;
    }
    return (minutos * 60) + segundos;
}

function setPendienteAnimacionEntradaBarraVida(valor) {
    animacionEntradaVidaPendiente = Boolean(valor);
}

function debeAnimarEntradaBarraVida(elemento, opciones = {}) {
    if (!elemento) return false;
    if (opciones && opciones.animarEntrada) return true;
    if (elemento.dataset && elemento.dataset.vidaVisible !== "1") return true;
    return elemento.style && elemento.style.display === "none";
}

function cancelarAnimacionEntradaBarraVida(elemento) {
    if (!elemento) return;
    const frameId = animacionesEntradaBarraVida.get(elemento);
    if (frameId) {
        cancelAnimationFrame(frameId);
        animacionesEntradaBarraVida.delete(elemento);
    }
}

function aplicarEstadoBarraVida(elemento, porcentaje) {
    const pct = Math.max(0, Math.min(100, Number(porcentaje) || 0));
    const tono = Math.max(0, Math.min(120, pct * 1.2));
    elemento.style.setProperty("--vida-pct", `${pct.toFixed(1)}%`);
    elemento.style.setProperty("--vida-color", `hsl(${tono}, 85%, 55%)`);
}

function animarEntradaBarraVida(elemento, porcentajeObjetivo, duracionMs = DURACION_ANIMACION_ENTRADA_VIDA_MS) {
    if (!elemento) return;
    const objetivo = Math.max(0, Math.min(100, Number(porcentajeObjetivo) || 0));
    cancelarAnimacionEntradaBarraVida(elemento);
    aplicarEstadoBarraVida(elemento, 0);

    if (objetivo <= 0 || duracionMs <= 0) {
        aplicarEstadoBarraVida(elemento, objetivo);
        return;
    }

    const inicio = performance.now();
    const paso = (ahora) => {
        const progreso = Math.min((ahora - inicio) / duracionMs, 1);
        const easing = 1 - Math.pow(1 - progreso, 3);
        aplicarEstadoBarraVida(elemento, objetivo * easing);

        if (progreso < 1) {
            const siguiente = requestAnimationFrame(paso);
            animacionesEntradaBarraVida.set(elemento, siguiente);
            return;
        }

        animacionesEntradaBarraVida.delete(elemento);
        aplicarEstadoBarraVida(elemento, objetivo);
    };

    const primerFrame = requestAnimationFrame(paso);
    animacionesEntradaBarraVida.set(elemento, primerFrame);
}

function actualizarBarraVida(elemento, texto, opciones = {}) {
    if (!elemento) {
        return;
    }
    const total = extraerSegundosTiempo(texto);
    if (total === null) {
        cancelarAnimacionEntradaBarraVida(elemento);
        elemento.style.setProperty("--vida-pct", "0%");
        elemento.style.setProperty("--vida-color", "#d94b4b");
        elemento.style.display = "none";
        if (elemento.dataset) elemento.dataset.vidaVisible = "0";
        return;
    }
    const animarEntrada = debeAnimarEntradaBarraVida(elemento, opciones);
    const limitado = Math.min(Math.max(total, 0), VIDA_MAX_SEGUNDOS);
    const porcentaje = (limitado / VIDA_MAX_SEGUNDOS) * 100;
    elemento.style.display = DISPLAY_BARRA_VIDA;
    if (elemento.dataset) elemento.dataset.vidaVisible = "1";
    if (animarEntrada) {
        animarEntradaBarraVida(elemento, porcentaje);
        return;
    }
    cancelarAnimacionEntradaBarraVida(elemento);
    aplicarEstadoBarraVida(elemento, porcentaje);
}

let terminado = false;
let clasificacion = getEl("clasificacion");
let notificacion = getEl("notificacion");
let fin_pag = getEl("fin_pag");
let regalo_pdf = getEl("regalo_pdf");
let regalo_btn = getEl("regalo_btn");
let regalo_nombre = getEl("regalo_nombre");
let regalo_pdf_data = null;
let regalo_pdf_filename = null;
let regalo_pdf_pendiente = null;
let regalo_pdf_ultimo_data = null;
let regalo_pdf_ultimo_filename = null;
let regalo_postgame_data = null;
let regalo_postgame_escritxr_activo = 1;
let musa_postgame = getEl("musa_postgame");
let musa_postgame_cerrar = getEl("musa_postgame_cerrar");
let musa_postgame_pdf = getEl("musa_postgame_pdf");
let musa_postgame_tab_propio = getEl("musa_postgame_tab_propio");
let musa_postgame_tab_rival = getEl("musa_postgame_tab_rival");
let campo_palabra = getEl("palabra");
let tarea = getEl("tarea");
let mostrar_texto = getEl("mostrar_texto");
let recordatorio = getEl("recordatorio");
let enviarPalabra_boton = getEl("progressButton");
let sincro = 0;
let votando = false;
const skill = getEl("skill")
const skill_cancel = getEl("skill_cancel")
const feedback_texto_editado = getEl("feedback_texto_editado")
const bandera_regalo_estado = getEl("bandera_regalo_estado");
const bandera_regalo_titulo = getEl("bandera_regalo_titulo");
const bandera_regalo_valor = getEl("bandera_regalo_valor");
const bandera_regalo_fill = getEl("bandera_regalo_fill");
window.__scribModoActualMusaPreview = "";
let votacion_ventaja_inline = getEl("votacion_ventaja_inline");
let votacion_ventaja_pie_inline = getEl("votacion_ventaja_pie_inline");
let votacion_ventaja_legend_inline = getEl("votacion_ventaja_legend_inline");
let votacion_ventaja_total_inline = getEl("votacion_ventaja_total_inline");
let votacion_ventaja_timer_inline = getEl("votacion_ventaja_timer_inline");
let votacion_ventaja_timer_fill_inline = getEl("votacion_ventaja_timer_fill_inline");
let votacion_ventaja_timer_text_inline = getEl("votacion_ventaja_timer_text_inline");
let votacion_ventaja_modal = getEl("votacion_ventaja_modal");
let votacion_ventaja_modal_titulo = getEl("votacion_ventaja_modal_titulo");
let votacion_ventaja_modal_opciones = getEl("votacion_ventaja_modal_opciones");
let votacion_ventaja_modal_explicaciones = getEl("votacion_ventaja_modal_explicaciones");
let votacion_ventaja_timer_modal = getEl("votacion_ventaja_timer_modal");
let votacion_ventaja_timer_fill_modal = getEl("votacion_ventaja_timer_fill_modal");
let votacion_ventaja_timer_text_modal = getEl("votacion_ventaja_timer_text_modal");
let votacion_ventaja_pie_modal = getEl("votacion_ventaja_pie_modal");
let votacion_ventaja_legend_modal = getEl("votacion_ventaja_legend_modal");
let votacion_ventaja_total_modal = getEl("votacion_ventaja_total_modal");
let votacion_ventaja_activa = false;
let votacion_ventaja_participo = false;
let votacion_ventaja_ya_voto = false;
let votacion_ventaja_equipo = null;
let votacion_ventaja_opciones = [];
let votacion_ventaja_votos = {};
let votacion_ventaja_voto_emitido = false;
let votacion_ventaja_gracias_timer = null;
let votacion_ventaja_ultimo_voto = "";
let votacion_ventaja_duracion_ms = 0;
let votacion_ventaja_fin_ts = 0;
let votacion_ventaja_timer_interval = null;
const nombres_escritxr_por_equipo = { 1: "", 2: "" };
let equipo_pendiente_nombre_musa = null;
const MUSA_WORLD_ENTRY_DURACION_MS = 6200;
const MUSA_WORLD_ENTRY_RELEASE_MS = 700;
const MUSA_WORLD_ENTRY_BLACK_HOLD_MS = 180;
const MUSA_WORLD_ENTRY_FADE_MS = 980;
let musa_world_entry_activa = false;
let musa_world_entry_frame = null;
let musa_world_entry_release_timeout = null;
let musa_world_entry_hide_timeout = null;
let musa_world_entry_indice_log = 0;
let revision_world_entry_musa = 0;
var intervalID = -1;
let timer = null;
let preparados_timer = null;
let sub_timer = null;
let listener_cuenta_atras = null;
let fallback_cuenta_atras_timer = null;
let timeout_remover_countdown_musa = null;
let revision_intro_musa = 0;
let revision_contexto_desventajas_musa = 0;
let revision_contexto_calentamiento_musa = 0;

if (campo_palabra) {
    campo_palabra.addEventListener("input", () => {
        if (typeof actualizarPreviewTiempoPalabraMusa === "function") {
            actualizarPreviewTiempoPalabraMusa(campo_palabra.value);
        }
    });
}

if (typeof actualizarPreviewTiempoPalabraMusa === "function") {
    actualizarPreviewTiempoPalabraMusa("");
}

function limpiarCountdownInicioMusa(removerNodo = true) {
    clearTimeout(listener_cuenta_atras);
    clearTimeout(timer);
    clearInterval(timer);
    clearTimeout(sub_timer);
    clearTimeout(preparados_timer);
    clearTimeout(fallback_cuenta_atras_timer);
    clearTimeout(timeout_remover_countdown_musa);
    timer = null;
    sub_timer = null;
    preparados_timer = null;
    listener_cuenta_atras = null;
    fallback_cuenta_atras_timer = null;
    timeout_remover_countdown_musa = null;
    if (removerNodo) {
        $('#countdown').remove();
    }
}

function hayCountdownInicioActivoMusa() {
    return Boolean(
        secuencia_inicio_musa_activa ||
        listener_cuenta_atras ||
        timer ||
        preparados_timer ||
        timeout_remover_countdown_musa ||
        document.getElementById("countdown")
    );
}

function invalidarIntroMusa() {
    revision_intro_musa += 1;
    limpiarCountdownInicioMusa();
    return revision_intro_musa;
}

function esRevisionIntroMusaActiva(revision) {
    return revision === revision_intro_musa;
}
let LIMITE_TIEMPO_INSPIRACION = 30;
const {
    TORTUGA: EMOJI_TORTUGA,
    RAYO: EMOJI_RAYO,
    ESPEJO: EMOJI_ESPEJO,
    BRUMA: EMOJI_BRUMA,
    BLOQUEO: EMOJI_BLOQUEO
} = window.ScribDisadvantages.EMOJIS;
const EMOJI_ROCKET = "\uD83D\uDE80";
const EMOJI_EDITAR = "\u270F\uFE0F";
const EMOJI_ENVIAR = "\u2709\uFE0F";
const EMOJI_STAR = "\u2B50";
const EMOJI_CORAZON_OJOS = "\uD83E\uDD0D";
const DURACION_FULGOR_MUSA_MS = 980;
const DURACION_TOAST_INSPIRACION_MS = 2600;
let timeout_fulgor_musa = null;
let timeout_toast_musa = null;
let timeout_nombre_musa_destacado = null;
let timeout_puntos_musa_destacado = null;
let timeout_bandera_regalo_anim = null;
let toast_inspiracion_musa = null;
let timeout_pedir_texto_connect_musa = null;
let raf_sincronizacion_niveles_musa = null;
const timeouts_sincronizacion_niveles_musa = new Set();

function normalizarNombreMusaEvento(valor) {
    if (typeof valor !== "string") return "";
    return valor.trim().toUpperCase().slice(0, 18);
}

function obtenerToastInspiracionMusa() {
    if (toast_inspiracion_musa && document.body.contains(toast_inspiracion_musa)) {
        return toast_inspiracion_musa;
    }
    const el = document.createElement("div");
    el.id = "musa_inspiracion_toast";
    el.className = "musa-inspiracion-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
    toast_inspiracion_musa = el;
    return el;
}

function activarFulgorBordesMusa() {
    if (!document.body) return;
    document.body.classList.remove("musa-borde-fulgor");
    // Forzamos reflow para reiniciar la animacion aunque la clase ya exista.
    void document.body.offsetWidth;
    document.body.classList.add("musa-borde-fulgor");
    if (timeout_fulgor_musa) {
        clearTimeout(timeout_fulgor_musa);
    }
    timeout_fulgor_musa = setTimeout(() => {
        if (document.body) {
            document.body.classList.remove("musa-borde-fulgor");
        }
    }, DURACION_FULGOR_MUSA_MS);
}

function destacarNombreMusaHit() {
    if (!nombre_musa_label) return;
    nombre_musa_label.classList.remove("musa-nombre-hit");
    void nombre_musa_label.offsetWidth;
    nombre_musa_label.classList.add("musa-nombre-hit");
    if (timeout_nombre_musa_destacado) {
        clearTimeout(timeout_nombre_musa_destacado);
    }
    timeout_nombre_musa_destacado = setTimeout(() => {
        if (nombre_musa_label) {
            nombre_musa_label.classList.remove("musa-nombre-hit");
        }
    }, 1400);
}

function destacarPuntosMusaHit() {
    if (!puntos1) return;
    puntos1.classList.remove("puntos-hit");
    void puntos1.offsetWidth;
    puntos1.classList.add("puntos-hit");
    if (timeout_puntos_musa_destacado) {
        clearTimeout(timeout_puntos_musa_destacado);
    }
    timeout_puntos_musa_destacado = setTimeout(() => {
        if (puntos1) {
            puntos1.classList.remove("puntos-hit");
        }
    }, 640);
}

function obtenerNombreEscritxrInspiracion(payload = {}) {
    const nombreLocal = (nombre1 && typeof nombre1.value === "string")
        ? nombre1.value.trim()
        : "";
    const nombrePayload = (typeof payload.nombre_escritxr === "string")
        ? payload.nombre_escritxr.trim()
        : "";
    if (nombrePayload) {
        return nombrePayload.toUpperCase().slice(0, 24);
    }
    const escritxrId = Number(payload.escritxr);
    if ((escritxrId === 1 || escritxrId === 2) && escritxrId !== Number(player)) {
        return `ESCRITXR ${escritxrId}`;
    }
    if (nombreLocal) {
        return nombreLocal.toUpperCase().slice(0, 24);
    }
    if (escritxrId === 1 || escritxrId === 2) {
        return `ESCRITXR ${escritxrId}`;
    }
    return "ESCRITXR";
}

function mostrarToastInspiracionMusa(payload = {}) {
    const musaEvento = normalizarNombreMusaEvento(payload.musa_nombre || "");
    const musaLocal = normalizarNombreMusaEvento(window.nombre_musa || "");
    const esPalabraPropia = Boolean(musaEvento && musaLocal && musaEvento === musaLocal);
    const nombreEscritxr = obtenerNombreEscritxrInspiracion(payload);
    const palabra = typeof payload.palabra === "string"
        ? payload.palabra.trim().slice(0, 48)
        : "";

    const toast = obtenerToastInspiracionMusa();
    toast.classList.remove("musa-inspiracion-toast--propia", "musa-inspiracion-toast--ajena", "musa-inspiracion-toast--regalo");
    toast.classList.add(esPalabraPropia ? "musa-inspiracion-toast--propia" : "musa-inspiracion-toast--ajena");

    if (esPalabraPropia) {
        const partePalabra = palabra ? ` «${palabra}»` : "";
        toast.textContent = `¡${nombreEscritxr} HA UTILIZADO TU PALABRA!${partePalabra}`;
        destacarNombreMusaHit();
    } else {
        const partePalabra = palabra ? ` «${palabra}»` : "";
        toast.textContent = `¡${nombreEscritxr} HA UTILIZADO TU PALABRA!${partePalabra}`;
    }

    toast.classList.remove("activa");
    void toast.offsetWidth;
    toast.classList.add("activa");
    if (timeout_toast_musa) {
        clearTimeout(timeout_toast_musa);
    }
    timeout_toast_musa = setTimeout(() => {
        toast.classList.remove("activa");
    }, DURACION_TOAST_INSPIRACION_MS);
}

function obtenerEstadoRegaloBanderaMusaLocal(payload = {}) {
    const equipoLocal = Number(player);
    if (equipoLocal !== 1 && equipoLocal !== 2) return null;
    const equipos = payload && payload.equipos;
    if (!equipos || typeof equipos !== "object") return null;
    return equipos[equipoLocal] || null;
}

function animarEstadoRegaloBanderaMusa() {
    if (!bandera_regalo_estado) return;
    bandera_regalo_estado.classList.remove("is-award");
    void bandera_regalo_estado.offsetWidth;
    bandera_regalo_estado.classList.add("is-award");
    if (timeout_bandera_regalo_anim) {
        clearTimeout(timeout_bandera_regalo_anim);
    }
    timeout_bandera_regalo_anim = setTimeout(() => {
        if (bandera_regalo_estado) {
            bandera_regalo_estado.classList.remove("is-award");
        }
    }, 720);
}

function actualizarEstadoRegaloBanderaMusa(payload = {}) {
    if (!bandera_regalo_estado || !bandera_regalo_titulo || !bandera_regalo_valor || !bandera_regalo_fill) {
        return;
    }
    const estado = obtenerEstadoRegaloBanderaMusaLocal(payload);
    if (!estado || !estado.visible) {
        bandera_regalo_estado.hidden = true;
        bandera_regalo_fill.style.width = "0%";
        return;
    }

    const musasActivas = Math.max(0, Number(estado.musas) || 0);
    const objetivo = Math.max(1, Number(estado.objetivo) || 1);
    const progreso = Math.max(0, Math.min(objetivo, Number(estado.progreso) || 0));
    const cooldownMs = Math.max(0, Number(estado.cooldown_ms) || 0);

    bandera_regalo_estado.hidden = false;
    bandera_regalo_titulo.textContent = `${musasActivas} MUSA${musasActivas === 1 ? "" : "S"} | APOYO VISUAL`;
    bandera_regalo_valor.textContent = cooldownMs > 0 && progreso === 0
        ? `RECARGA ${Math.max(1, Math.ceil(cooldownMs / 1000))}S`
        : `${progreso}/${objetivo}`;
    bandera_regalo_fill.style.width = `${Math.max(0, Math.min(100, Number(estado.progreso_pct) || 0))}%`;
    bandera_regalo_estado.setAttribute("aria-label", `Apoyo visual de musas: ${progreso} de ${objetivo}.`);
}

function mostrarToastRegaloBanderaMusa(payload = {}) {
    if (Number(payload && payload.player) !== Number(player)) return;
    const nombreEscritxr = obtenerNombreEscritxrInspiracion({ escritxr: player });
    const toast = obtenerToastInspiracionMusa();
    toast.classList.remove("musa-inspiracion-toast--propia", "musa-inspiracion-toast--ajena");
    toast.classList.add("musa-inspiracion-toast--regalo");
    toast.textContent = `APOYO DE MUSAS PARA ${nombreEscritxr}`;
    toast.classList.remove("activa");
    void toast.offsetWidth;
    toast.classList.add("activa");
    if (timeout_toast_musa) {
        clearTimeout(timeout_toast_musa);
    }
    timeout_toast_musa = setTimeout(() => {
        toast.classList.remove("activa");
    }, DURACION_TOAST_INSPIRACION_MS);
    animarEstadoRegaloBanderaMusa();
}

function limpiarTimersCosmeticosMusa() {
    if (typeof delay_animacion !== "undefined" && delay_animacion !== null) {
        clearTimeout(delay_animacion);
        delay_animacion = null;
    }
    if (intervalID !== -1) {
        clearInterval(intervalID);
        intervalID = -1;
    }
    stopConfetti();
    if (timeout_fulgor_musa) {
        clearTimeout(timeout_fulgor_musa);
        timeout_fulgor_musa = null;
    }
    if (timeout_toast_musa) {
        clearTimeout(timeout_toast_musa);
        timeout_toast_musa = null;
    }
    if (timeout_nombre_musa_destacado) {
        clearTimeout(timeout_nombre_musa_destacado);
        timeout_nombre_musa_destacado = null;
    }
    if (timeout_puntos_musa_destacado) {
        clearTimeout(timeout_puntos_musa_destacado);
        timeout_puntos_musa_destacado = null;
    }
    if (timeout_bandera_regalo_anim) {
        clearTimeout(timeout_bandera_regalo_anim);
        timeout_bandera_regalo_anim = null;
    }
    if (document.body) {
        document.body.classList.remove("musa-borde-fulgor");
    }
    if (nombre_musa_label) {
        nombre_musa_label.classList.remove("musa-nombre-hit");
    }
    if (puntos1) {
        puntos1.classList.remove("puntos-hit");
    }
    if (bandera_regalo_estado) {
        bandera_regalo_estado.classList.remove("is-award");
    }
    if (skill_cancel && skill_cancel.style) {
        skill_cancel.style.display = "none";
    }
    if (toast_inspiracion_musa) {
        toast_inspiracion_musa.classList.remove(
            "activa",
            "musa-inspiracion-toast--propia",
            "musa-inspiracion-toast--ajena",
            "musa-inspiracion-toast--regalo"
        );
        toast_inspiracion_musa.textContent = "";
    }
}

function programarSincronizacionNivelesMusa(fn, delay = 0) {
    if (delay > 0) {
        const timeoutId = setTimeout(() => {
            timeouts_sincronizacion_niveles_musa.delete(timeoutId);
            fn();
        }, delay);
        timeouts_sincronizacion_niveles_musa.add(timeoutId);
        return timeoutId;
    }
    if (raf_sincronizacion_niveles_musa) return raf_sincronizacion_niveles_musa;
    raf_sincronizacion_niveles_musa = requestAnimationFrame(() => {
        raf_sincronizacion_niveles_musa = null;
        fn();
    });
    return raf_sincronizacion_niveles_musa;
}

function cancelarSincronizacionVisorNivelesMusa() {
    if (raf_sincronizacion_niveles_musa) {
        cancelAnimationFrame(raf_sincronizacion_niveles_musa);
        raf_sincronizacion_niveles_musa = null;
    }
    timeouts_sincronizacion_niveles_musa.forEach((timeoutId) => clearTimeout(timeoutId));
    timeouts_sincronizacion_niveles_musa.clear();
}
const VENTAJAS_PUTADAS = window.ScribDisadvantages.opcionesVotacion();
const MAPA_VENTAJAS_PUTADAS = new Map(VENTAJAS_PUTADAS.map(op => [op.emoji, op]));
const COLORES_VOTACION_VENTAJA = ["#46f0ff", "#ff6b6b", "#f7d07e"];
const SEGMENTOS_PIE_VOTACION = new WeakMap();

function normalizarEquipoVotacion(valor) {
    if (valor === 1 || valor === "1" || valor === "j1") return 1;
    if (valor === 2 || valor === "2" || valor === "j2") return 2;
    return null;
}

function normalizarNombreEscritxrUi(valor, fallback = "ESCRITXR") {
    const nombre = typeof valor === "string" ? valor.trim() : "";
    return (nombre || fallback).toUpperCase();
}

function registrarNombreEscritxrPorEquipo(equipo, nombreValor) {
    const equipoNorm = normalizarEquipoVotacion(equipo);
    if (!equipoNorm) return;
    const nombreNorm = typeof nombreValor === "string" ? nombreValor.trim() : "";
    nombres_escritxr_por_equipo[equipoNorm] = nombreNorm || `ESCRITXR ${equipoNorm}`;
    if (musa_world_entry_activa) {
        actualizarContenidoEntradaMusa();
    }
}

function obtenerEquipoObjetivoVotacionVentaja() {
    const equipoMusa = normalizarEquipoVotacion(votacion_ventaja_equipo) || normalizarEquipoVotacion(player);
    if (equipoMusa === 1 || equipoMusa === 2) {
        return 3 - equipoMusa;
    }
    return null;
}

function obtenerNombreEscritxrObjetivoVotacionVentaja() {
    const equipoObjetivo = obtenerEquipoObjetivoVotacionVentaja();
    if (equipoObjetivo === 1 || equipoObjetivo === 2) {
        const nombreGuardado = nombres_escritxr_por_equipo[equipoObjetivo];
        return normalizarNombreEscritxrUi(nombreGuardado, `ESCRITXR ${equipoObjetivo}`);
    }
    return normalizarNombreEscritxrUi(nombre1 && nombre1.value ? nombre1.value : "", "ESCRITXR");
}

function pedirNombreMusa(equipo = null) {
    const equipoNorm = normalizarEquipoVotacion(equipo);
    equipo_pendiente_nombre_musa = equipoNorm;
    if (equipoNorm) {
        socket.emit('pedir_nombre', { musa: equipoNorm });
        return;
    }
    socket.emit('pedir_nombre');
}

function obtenerOpcionesVentaja(opcionesEmojis) {
    if (!Array.isArray(opcionesEmojis) || opcionesEmojis.length === 0) {
        return [...VENTAJAS_PUTADAS].sort(() => Math.random() - 0.5).slice(0, 3);
    }
    return opcionesEmojis
        .map(emoji => MAPA_VENTAJAS_PUTADAS.get(window.ScribDisadvantages.normalizar(emoji)))
        .filter(Boolean)
        .slice(0, 3);
}

function obtenerNumeroNoNegativo(...valores) {
    for (const valor of valores) {
        const numero = Number(valor);
        if (Number.isFinite(numero) && numero >= 0) {
            return numero;
        }
    }
    return null;
}

function obtenerColorEquipoVotacion(equipo) {
    return Number(equipo) === 2 ? "#ff6b6b" : "#46f0ff";
}

function aplicarColorTemporizadorVotacionVentaja(equipo) {
    const color = obtenerColorEquipoVotacion(equipo);
    if (votacion_ventaja_timer_modal) {
        votacion_ventaja_timer_modal.style.setProperty("--votacion-ventaja-timer-color", color);
    }
    if (votacion_ventaja_timer_inline) {
        votacion_ventaja_timer_inline.style.setProperty("--votacion-ventaja-timer-color", color);
    }
}

function formatearTiempoRestanteVotacion(ms) {
    const totalSegundos = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function actualizarBarraTiempoVotacionVentaja(restanteMs, duracionMs) {
    const restante = Math.max(0, Number(restanteMs) || 0);
    const total = Math.max(1, Number(duracionMs) || 1);
    const porcentaje = Math.max(0, Math.min(100, (restante / total) * 100));
    const texto = formatearTiempoRestanteVotacion(restante);

    if (votacion_ventaja_timer_fill_modal) {
        votacion_ventaja_timer_fill_modal.style.width = `${porcentaje.toFixed(1)}%`;
    }
    if (votacion_ventaja_timer_fill_inline) {
        votacion_ventaja_timer_fill_inline.style.width = `${porcentaje.toFixed(1)}%`;
    }
    if (votacion_ventaja_timer_text_modal) {
        votacion_ventaja_timer_text_modal.textContent = texto;
    }
    if (votacion_ventaja_timer_text_inline) {
        votacion_ventaja_timer_text_inline.textContent = texto;
    }
}

function detenerTemporizadorVotacionVentaja() {
    if (votacion_ventaja_timer_interval) {
        clearInterval(votacion_ventaja_timer_interval);
        votacion_ventaja_timer_interval = null;
    }
}

function obtenerMsRestantesVotacionVentaja() {
    if (!votacion_ventaja_fin_ts) return 0;
    return Math.max(0, votacion_ventaja_fin_ts - Date.now());
}

function manejarFinTiempoVotacionVentaja() {
    ocultarModalVotacionVentaja();
    if (votacion_ventaja_activa && votacion_ventaja_ya_voto) {
        mostrarInlineVotacionVentaja();
    } else {
        ocultarInlineVotacionVentaja();
    }
}

function tickTemporizadorVotacionVentaja() {
    if (votacion_ventaja_duracion_ms <= 0 || votacion_ventaja_fin_ts <= 0) {
        return;
    }
    const restante = obtenerMsRestantesVotacionVentaja();
    actualizarBarraTiempoVotacionVentaja(restante, votacion_ventaja_duracion_ms);
    if (restante <= 0) {
        detenerTemporizadorVotacionVentaja();
        manejarFinTiempoVotacionVentaja();
    }
}

function iniciarTemporizadorVotacionVentaja() {
    if (votacion_ventaja_timer_interval) {
        return;
    }
    votacion_ventaja_timer_interval = setInterval(tickTemporizadorVotacionVentaja, 200);
}

function sincronizarTemporizadorVotacionVentaja(payload = {}) {
    const duracionPayload = obtenerNumeroNoNegativo(
        payload.duracion_ms,
        payload.tiempo_votacion_ms,
        payload.TIEMPO_VOTACION
    );
    const restantePayload = obtenerNumeroNoNegativo(
        payload.tiempo_restante_ms,
        payload.restante_ms
    );
    const terminaEnPayload = obtenerNumeroNoNegativo(payload.termina_en_ts);

    if (duracionPayload !== null && duracionPayload > 0) {
        votacion_ventaja_duracion_ms = duracionPayload;
    }
    if (restantePayload !== null) {
        votacion_ventaja_fin_ts = Date.now() + restantePayload;
    } else if (terminaEnPayload !== null && terminaEnPayload > 0) {
        votacion_ventaja_fin_ts = terminaEnPayload;
    } else if (!votacion_ventaja_fin_ts && votacion_ventaja_duracion_ms > 0) {
        votacion_ventaja_fin_ts = Date.now() + votacion_ventaja_duracion_ms;
    }

    if (votacion_ventaja_activa && votacion_ventaja_duracion_ms > 0 && votacion_ventaja_fin_ts > 0) {
        tickTemporizadorVotacionVentaja();
        if (obtenerMsRestantesVotacionVentaja() > 0) {
            iniciarTemporizadorVotacionVentaja();
        }
    }
}

function resetearTemporizadorVotacionVentaja() {
    detenerTemporizadorVotacionVentaja();
    votacion_ventaja_duracion_ms = 0;
    votacion_ventaja_fin_ts = 0;
    actualizarBarraTiempoVotacionVentaja(0, 1);
}

function ocultarModalVotacionVentaja() {
    if (votacion_ventaja_modal) {
        votacion_ventaja_modal.classList.remove("activa");
    }
}

function mostrarModalVotacionVentaja() {
    if (votacion_ventaja_modal) {
        votacion_ventaja_modal.classList.add("activa");
    }
}

function ocultarInlineVotacionVentaja() {
    if (votacion_ventaja_inline) {
        votacion_ventaja_inline.classList.remove("activa");
    }
}

function mostrarInlineVotacionVentaja() {
    if (votacion_ventaja_inline) {
        votacion_ventaja_inline.classList.add("activa");
    }
}

function construirDatosVotacionVentaja(opciones, votos) {
    const opcionesUsar = Array.isArray(opciones) ? opciones.slice(0, 3) : [];
    return opcionesUsar.map((emoji, idx) => {
        const info = MAPA_VENTAJAS_PUTADAS.get(emoji);
        const descripcionBase = info ? info.descripcion : "Desventaja";
        const descripcion = String(descripcionBase).startsWith(emoji)
            ? String(descripcionBase).slice(emoji.length).trim()
            : String(descripcionBase);
        return {
            emoji,
            descripcion,
            color: COLORES_VOTACION_VENTAJA[idx % COLORES_VOTACION_VENTAJA.length],
            votos: Number(votos && votos[emoji]) || 0
        };
    });
}

function inicializarVotosVentajaEquilibrado(opciones) {
    const base = {};
    if (!Array.isArray(opciones)) return base;
    opciones.slice(0, 3).forEach((emoji) => {
        base[emoji] = 0;
    });
    return base;
}

function mostrarGraciasVotoVentaja(voto) {
    votacion_ventaja_ultimo_voto = String(voto || "");
    if (votacion_ventaja_modal_titulo) {
        votacion_ventaja_modal_titulo.textContent = tJuego2P("ui.thanks_for_voting", {}, "GRACIAS POR VOTAR");
    }
    if (recordatorio) {
        recordatorio.innerHTML = `<span style='color: green;'>${escapeHtml(
            tJuego2P("vote.thanks_detail", { vote: voto, voto }, `Gracias por votar ${voto}.`)
        )}</span>`;
    }
}

function pintarEmojisPieVotacionVentaja(pieEl, datos, total) {
    if (!pieEl || !Array.isArray(datos) || datos.length === 0) return;
    const previo = pieEl.querySelector(".votacion-ventaja-pie-emojis");
    if (previo) {
        previo.remove();
    }
    const capa = document.createElement("div");
    capa.className = "votacion-ventaja-pie-emojis";
    let acumulado = 0;
    datos.forEach((item) => {
        if (total > 0 && item.votos <= 0) {
            return;
        }
        const proporcion = total > 0 ? (item.votos / total) : (1 / datos.length);
        const inicio = acumulado;
        const fin = acumulado + (proporcion * 360);
        acumulado = fin;
        const angulo = ((inicio + fin) / 2) - 90;
        // Mantener el emoji centrado sobre el grosor del donut.
        // El agujero interior usa inset 16% en CSS, por eso el radio medio es ~42%.
        const radio = 42;
        const rad = (angulo * Math.PI) / 180;
        const x = 50 + (Math.cos(rad) * radio);
        const y = 50 + (Math.sin(rad) * radio);
        const etiqueta = document.createElement("span");
        etiqueta.className = "votacion-ventaja-pie-emoji";
        etiqueta.textContent = item.emoji;
        etiqueta.style.left = `${x.toFixed(2)}%`;
        etiqueta.style.top = `${y.toFixed(2)}%`;
        capa.appendChild(etiqueta);
    });
    pieEl.appendChild(capa);
}

function pintarPieVotacionVentaja(pieEl, totalEl, legendEl, datos, opciones = {}) {
    if (!pieEl || !legendEl) return;
    const mantenerSegmentosEquilibrados = Boolean(opciones && opciones.segmentosEquilibrados);
    const datosSegmentos = mantenerSegmentosEquilibrados
        ? datos.map((item) => ({ ...item, votos: 1 }))
        : datos;
    const total = datos.reduce((acc, item) => acc + item.votos, 0);
    const totalSegmentos = datosSegmentos.reduce((acc, item) => acc + item.votos, 0);
    let acumulado = 0;
    const segmentos = datosSegmentos.map((item) => {
        const proporcion = totalSegmentos > 0 ? (item.votos / totalSegmentos) : (1 / datos.length);
        const inicio = acumulado;
        const fin = acumulado + (proporcion * 360);
        acumulado = fin;
        return {
            inicio,
            fin,
            color: item.color,
            emoji: item.emoji
        };
    });

    pieEl.style.background = `conic-gradient(${segmentos.map(seg => `${seg.color} ${seg.inicio.toFixed(2)}deg ${seg.fin.toFixed(2)}deg`).join(", ")})`;
    pieEl.classList.toggle("sin-votos", totalSegmentos === 0);
    SEGMENTOS_PIE_VOTACION.set(pieEl, segmentos);
    pintarEmojisPieVotacionVentaja(pieEl, datosSegmentos, totalSegmentos);
    if (totalEl) {
        totalEl.textContent = String(total);
    }

    legendEl.innerHTML = "";
    datos.forEach((item) => {
        const fila = document.createElement("div");
        fila.className = "votacion-ventaja-legend-item";

        const color = document.createElement("span");
        color.className = "votacion-ventaja-color";
        color.style.background = item.color;

        const emoji = document.createElement("span");
        emoji.className = "votacion-ventaja-emoji";
        emoji.textContent = item.emoji;

        const desc = document.createElement("span");
        desc.className = "votacion-ventaja-desc";
        desc.textContent = item.descripcion;

        const count = document.createElement("span");
        count.className = "votacion-ventaja-count";
        count.textContent = String(item.votos);

        const pct = document.createElement("span");
        pct.className = "votacion-ventaja-pct";
        pct.textContent = total > 0 ? `${Math.round((item.votos / total) * 100)}%` : "0%";

        fila.append(color, emoji, desc, count, pct);
        legendEl.appendChild(fila);
    });
}

function obtenerEmojiPorClickPie(pieEl, evt) {
    if (!pieEl || !evt) return "";
    const segmentos = SEGMENTOS_PIE_VOTACION.get(pieEl);
    if (!Array.isArray(segmentos) || segmentos.length === 0) return "";

    const rect = pieEl.getBoundingClientRect();
    const cx = rect.left + (rect.width / 2);
    const cy = rect.top + (rect.height / 2);
    const dx = evt.clientX - cx;
    const dy = evt.clientY - cy;
    const radioExterior = rect.width / 2;
    const distancia = Math.sqrt((dx * dx) + (dy * dy));
    const radioHueco = radioExterior * 0.68;
    if (distancia < radioHueco || distancia > radioExterior) {
        return "";
    }

    let angulo = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
    if (angulo < 0) angulo += 360;

    const segmento = segmentos.find((seg) => angulo >= seg.inicio && angulo < seg.fin);
    return segmento ? segmento.emoji : "";
}

function votarVentajaPorEmoji(emoji) {
    return false;
}

function obtenerEquipoEscritxrObjetivo(nombreEscritxr) {
    const nombre = String(nombreEscritxr || "");
    const matchUltimoDigito = nombre.match(/([12])(?!.*[12])/);
    if (matchUltimoDigito) {
        return Number(matchUltimoDigito[1]);
    }
    const equipoMusa = Number(votacion_ventaja_equipo) || Number(player) || 0;
    if (equipoMusa === 1 || equipoMusa === 2) {
        return 3 - equipoMusa;
    }
    return 0;
}

function obtenerClaseColorEscritxr(nombreEscritxr) {
    const equipoObjetivo = obtenerEquipoEscritxrObjetivo(nombreEscritxr);
    if (equipoObjetivo === 1) return "votacion-ventaja-escritxr--1";
    if (equipoObjetivo === 2) return "votacion-ventaja-escritxr--2";
    return "";
}

function renderizarModalVotacionVentaja(opciones) {
    if (!Array.isArray(opciones) || opciones.length === 0) return;
    if (votacion_ventaja_modal_titulo) {
        const nombreObjetivo = obtenerNombreEscritxrObjetivoVotacionVentaja();
        const claseColor = obtenerClaseColorEscritxr(nombreObjetivo);
        votacion_ventaja_modal_titulo.innerHTML = tJuego2P(
            "ui.choose_disadvantage_for",
            { name: `<span class="votacion-ventaja-escritxr ${claseColor}">${escapeHtml(nombreObjetivo)}</span>` },
            `ELIGE UNA DESVENTAJA PARA <span class="votacion-ventaja-escritxr ${claseColor}">${escapeHtml(nombreObjetivo)}</span>`
        );
    }
    if (votacion_ventaja_modal_opciones) {
        votacion_ventaja_modal_opciones.innerHTML = `<p class="votacion-ventaja-modal-ayuda">${escapeHtml(
            tJuego2P("vote.chart_help", {}, "Toca un quesito del grafico para votar.")
        )}</p>`;
    }
    if (votacion_ventaja_modal_explicaciones) {
        votacion_ventaja_modal_explicaciones.innerHTML = "";
    }
}

function manejarClickModalVotacionVentaja(evt) {
    const boton = evt.target && evt.target.closest
        ? evt.target.closest(".votacion-ventaja-modal-btn")
        : null;
    if (!boton) {
        return;
    }
    votarVentajaPorEmoji(boton.value);
}

function votarVentajaDesdeModal(boton) {
    votarVentajaPorEmoji(boton && boton.value ? boton.value : "");
}

window.votarVentajaDesdeModal = votarVentajaDesdeModal;

function manejarClickPieModalVotacionVentaja(evt) {
    const emoji = obtenerEmojiPorClickPie(votacion_ventaja_pie_modal, evt);
    if (!emoji) return;
    votarVentajaPorEmoji(emoji);
}

function debeCongelarPieModalVotacionVentaja() {
    return Boolean(
        votacion_ventaja_activa &&
        votacion_ventaja_participo &&
        !votacion_ventaja_voto_emitido
    );
}

function actualizarPiesVotacionVentaja() {
    const datos = construirDatosVotacionVentaja(votacion_ventaja_opciones, votacion_ventaja_votos);
    if (!datos.length) return;
    pintarPieVotacionVentaja(
        votacion_ventaja_pie_modal,
        votacion_ventaja_total_modal,
        votacion_ventaja_legend_modal,
        datos,
        { segmentosEquilibrados: debeCongelarPieModalVotacionVentaja() }
    );
    pintarPieVotacionVentaja(
        votacion_ventaja_pie_inline,
        votacion_ventaja_total_inline,
        votacion_ventaja_legend_inline,
        datos
    );
}

function resetearEstadoVotacionVentaja() {
    votacion_ventaja_activa = false;
    votacion_ventaja_participo = false;
    votacion_ventaja_ya_voto = false;
    votacion_ventaja_voto_emitido = false;
    votacion_ventaja_ultimo_voto = "";
    votacion_ventaja_equipo = null;
    votacion_ventaja_opciones = [];
    votacion_ventaja_votos = {};
    if (votacion_ventaja_gracias_timer) {
        clearTimeout(votacion_ventaja_gracias_timer);
        votacion_ventaja_gracias_timer = null;
    }
    resetearTemporizadorVotacionVentaja();
    aplicarColorTemporizadorVotacionVentaja(player);
    ocultarModalVotacionVentaja();
    ocultarInlineVotacionVentaja();
}

if (votacion_ventaja_modal_opciones) {
    votacion_ventaja_modal_opciones.addEventListener("click", manejarClickModalVotacionVentaja);
}
if (votacion_ventaja_pie_modal) {
    votacion_ventaja_pie_modal.addEventListener("click", manejarClickPieModalVotacionVentaja);
}

window.addEventListener("musa_voto_ventaja_emitido", (evt) => {
    const voto = evt && evt.detail ? evt.detail.voto : "";
    if (voto) {
        votacion_ventaja_votos[voto] = (Number(votacion_ventaja_votos[voto]) || 0) + 1;
    }
    actualizarPiesVotacionVentaja();
    mostrarGraciasVotoVentaja(voto);
    votacion_ventaja_ya_voto = true;
    votacion_ventaja_voto_emitido = true;
    if (votacion_ventaja_gracias_timer) {
        clearTimeout(votacion_ventaja_gracias_timer);
    }
    votacion_ventaja_gracias_timer = setTimeout(() => {
        ocultarModalVotacionVentaja();
        if (votacion_ventaja_activa) {
            mostrarInlineVotacionVentaja();
        } else {
            ocultarInlineVotacionVentaja();
        }
    }, 600);
});

const RETRASO_TECLADO_LENTO_MS = 500;
let teclado_lento_putada = false;
let timeout_teclado_lento = null;
let TIEMPO_MODIFICADOR = 0;
let timeout_rayo_musa = null;
let tempo_text_borroso = null;
let timeout_bruma_salida_musa = null;
let lightning_musa = null;
let timeout_espejo_musa = null;

let temporizador_lectura_interval = null;
let temporizador_lectura_restante = 0;
let temporizador_lectura_activo = false;
let lectura_estado_guardado = null;
const FEEDBACK_MUSA_URL_LOCAL = "../../../feedback/index.html";
const FEEDBACK_MUSA_URL_WEB = "/feedback/";
let redireccion_feedback_musa_en_curso = false;

function debeUsarRutaLocalFeedbackMusa() {
    const host = String(window.location.hostname || "").trim().toLowerCase();
    return (
        window.location.protocol === "file:"
        || window.isProduction === false
        || host === "localhost"
        || host === "127.0.0.1"
    );
}

function resolverUrlFeedbackMusa(payload = {}) {
    const usarRutaLocal = debeUsarRutaLocalFeedbackMusa();
    const urlFallback = usarRutaLocal ? FEEDBACK_MUSA_URL_LOCAL : FEEDBACK_MUSA_URL_WEB;
    const urlCruda = (!usarRutaLocal && payload && typeof payload.url === "string" && payload.url.trim())
        ? payload.url.trim()
        : urlFallback;
    try {
        return new URL(urlCruda, window.location.href).toString();
    } catch (error) {
        try {
            return new URL(urlFallback, window.location.href).toString();
        } catch (fallbackError) {
            return urlFallback;
        }
    }
}

function redirigirMusaAFeedback(payload = {}) {
    if (window.__SCRIB_DRAMATURGIA_MONITOR__?.active) {
        return;
    }
    const payloadSeguro = (payload && typeof payload === "object") ? payload : {};
    const activo = !Object.prototype.hasOwnProperty.call(payloadSeguro, "activa") || Boolean(payloadSeguro.activa);
    if (!activo || redireccion_feedback_musa_en_curso) {
        return;
    }
    if (/\/feedback(?:\/|$)/i.test(window.location.pathname)) {
        return;
    }
    redireccion_feedback_musa_en_curso = true;
    window.location.assign(resolverUrlFeedbackMusa(payloadSeguro));
}

function configurarColorRegalo() {
    if (!regalo_pdf) {
        return;
    }
    const color = Number(player) === 2 ? "#ff6b6b" : "#35f0ff";
    regalo_pdf.style.setProperty("--regalo-color", color);
}

function actualizarNombreRegalo() {
    if (!regalo_nombre) {
        return;
    }
    const nombreTexto = (nombre1 && nombre1.value) ? nombre1.value.trim() : "";
    regalo_nombre.textContent = nombreTexto || "ESCRITXR";
    if (nombre1) {
        const estilo = window.getComputedStyle(nombre1);
        regalo_nombre.style.color = estilo.color;
        regalo_nombre.style.textShadow = estilo.textShadow;
        regalo_nombre.style.fontFamily = estilo.fontFamily;
        regalo_nombre.style.letterSpacing = estilo.letterSpacing;
    }
}

function puedeMostrarRegaloPdfMusa() {
    return Boolean(terminado || ui_partida_finalizada_musa || temporizador_lectura_activo);
}

function intentarMostrarRegaloPdfPendiente() {
    if (!regalo_pdf_pendiente || !player) {
        return;
    }
    mostrarRegaloPdf(regalo_pdf_pendiente);
}

function mostrarRegaloPdf(payload) {
    if (!payload || !payload.data || !regalo_pdf) {
        return;
    }
    if (payload.client_id && window.musa_client_id && String(payload.client_id) !== String(window.musa_client_id)) {
        return;
    }
    if (payload.player && player && Number(payload.player) !== Number(player)) {
        return;
    }
    if (!puedeMostrarRegaloPdfMusa()) {
        regalo_pdf_pendiente = payload;
        return;
    }
    actualizarNombreRegalo();
    regalo_pdf_data = payload.data;
    regalo_pdf_filename = payload.filename || "regalo.pdf";
    regalo_pdf_ultimo_data = regalo_pdf_data;
    regalo_pdf_ultimo_filename = regalo_pdf_filename;
    regalo_postgame_data = payload.postgame && typeof payload.postgame === "object" ? payload.postgame : null;
    regalo_pdf.classList.add("regalo-pdf--visible");
    regalo_pdf.classList.remove("regalo-pdf--claimed");
    regalo_pdf.setAttribute("aria-hidden", "false");
    regalo_pdf_pendiente = null;
}

function traducirPostgameMusa(clave, fallback) {
    return window && typeof window.scribT2P === "function" ? window.scribT2P(clave, {}, fallback) : fallback;
}

function valorPostgameMusa(id, valor) {
    const elemento = getEl(id);
    if (elemento) elemento.textContent = String(valor);
}

function escritorPostgameMusa(playerId) {
    const escritores = regalo_postgame_data && regalo_postgame_data.escritores;
    return escritores && (escritores[playerId] || escritores[String(playerId)])
        ? (escritores[playerId] || escritores[String(playerId)])
        : { nombre: `ESCRITXR ${playerId}`, texto: "", stats: {} };
}

function pintarTextoPostgameMusa(playerId) {
    const id = Number(playerId) === 2 ? 2 : 1;
    regalo_postgame_escritxr_activo = id;
    const escritxr = escritorPostgameMusa(id);
    const stats = escritxr.stats && typeof escritxr.stats === "object" ? escritxr.stats : {};
    valorPostgameMusa("musa_postgame_escritxr_nombre", escritxr.nombre || `ESCRITXR ${id}`);
    valorPostgameMusa("musa_postgame_palabras", Math.max(0, Number(stats.palabras) || 0));
    valorPostgameMusa("musa_postgame_pulsaciones", Math.max(0, Number(stats.pulsaciones) || 0));
    valorPostgameMusa("musa_postgame_ritmo", Math.max(0, Number(stats.ritmo_ppm) || 0));
    valorPostgameMusa(
        "musa_postgame_texto",
        String(escritxr.texto || "").trim() || traducirPostgameMusa("muse.postgame.empty_text", "Este texto quedó vacío.")
    );
    const propio = Number(regalo_postgame_data && regalo_postgame_data.player) === id;
    [musa_postgame_tab_propio, musa_postgame_tab_rival].forEach((tab) => {
        if (!tab) return;
        const tabPlayer = Number(tab.dataset.player);
        const activo = tabPlayer === id;
        tab.classList.toggle("is-active", activo);
        tab.setAttribute("aria-selected", activo ? "true" : "false");
    });
    if (musa_postgame) {
        musa_postgame.style.setProperty("--postgame-reader-color", propio ? "var(--postgame-team-color)" : "var(--postgame-rival-color)");
    }
}

function pintarPostgameMusa() {
    if (!regalo_postgame_data || !musa_postgame) return false;
    const equipo = Number(regalo_postgame_data.player) === 2 ? 2 : 1;
    const rival = equipo === 1 ? 2 : 1;
    const datosMusa = regalo_postgame_data.musa && typeof regalo_postgame_data.musa === "object"
        ? regalo_postgame_data.musa
        : {};
    const stats = datosMusa.stats && typeof datosMusa.stats === "object" ? datosMusa.stats : {};
    valorPostgameMusa("musa_postgame_musa_nombre", datosMusa.nombre || "MUSA");
    valorPostgameMusa("musa_postgame_enviadas", Math.max(0, Number(stats.enviadas) || 0));
    valorPostgameMusa("musa_postgame_introducidas", Math.max(0, Number(stats.introducidas) || 0));
    valorPostgameMusa("musa_postgame_efectividad", `${Math.max(0, Number(stats.efectividad_pct) || 0)}%`);
    const impacto = Number(stats.impacto_neto) || 0;
    valorPostgameMusa("musa_postgame_impacto", `${impacto > 0 ? "+" : ""}${impacto}`);
    if (musa_postgame_tab_propio) {
        musa_postgame_tab_propio.dataset.player = String(equipo);
        musa_postgame_tab_propio.textContent = traducirPostgameMusa("muse.postgame.your_writer", "TU ESCRITXR");
    }
    if (musa_postgame_tab_rival) {
        musa_postgame_tab_rival.dataset.player = String(rival);
        musa_postgame_tab_rival.textContent = traducirPostgameMusa("muse.postgame.other_writer", "OTRX ESCRITXR");
    }
    musa_postgame.style.setProperty("--postgame-team-color", equipo === 2 ? "#ff6578" : "#43eaff");
    musa_postgame.style.setProperty("--postgame-rival-color", equipo === 2 ? "#43eaff" : "#ff6578");
    pintarTextoPostgameMusa(equipo);
    return true;
}

function mostrarPostgameMusa() {
    if (!pintarPostgameMusa()) return;
    musa_postgame.classList.add("musa-postgame--visible");
    musa_postgame.setAttribute("aria-hidden", "false");
    document.body.classList.add("musa-postgame-activo");
}

function ocultarPostgameMusa({ limpiar = false } = {}) {
    if (musa_postgame) {
        musa_postgame.classList.remove("musa-postgame--visible");
        musa_postgame.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("musa-postgame-activo");
    if (limpiar) {
        regalo_postgame_data = null;
        regalo_pdf_ultimo_data = null;
        regalo_pdf_ultimo_filename = null;
    }
}

async function descargarArchivoRegalo(data, filename) {
    if (!data) return false;
    const respuesta = await fetch(data);
    if (!respuesta.ok) throw new Error(`PDF HTTP ${respuesta.status}`);
    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "regalo.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
}

function ocultarRegaloPdf() {
    if (!regalo_pdf) {
        return;
    }
    regalo_pdf.classList.remove("regalo-pdf--visible");
    regalo_pdf.classList.remove("regalo-pdf--claimed");
    regalo_pdf.setAttribute("aria-hidden", "true");
    regalo_pdf_data = null;
    regalo_pdf_filename = null;
}

async function descargarRegaloPdf() {
    if (!regalo_pdf_data || !regalo_btn) {
        return;
    }
    regalo_btn.disabled = true;
    regalo_pdf.classList.add("regalo-pdf--claimed");
    try {
        await descargarArchivoRegalo(regalo_pdf_data, regalo_pdf_filename);
        if (typeof confetti_musas === "function") {
            confetti_musas();
        }
    } catch (error) {
        console.error("No se pudo descargar el regalo PDF:", error);
        regalo_pdf.classList.remove("regalo-pdf--claimed");
        regalo_btn.disabled = false;
        return;
    }
    setTimeout(() => {
        ocultarRegaloPdf();
        regalo_btn.disabled = false;
        mostrarPostgameMusa();
    }, 900);
}

if (regalo_btn) {
    regalo_btn.addEventListener("click", descargarRegaloPdf);
}
if (musa_postgame_tab_propio) {
    musa_postgame_tab_propio.addEventListener("click", () => pintarTextoPostgameMusa(musa_postgame_tab_propio.dataset.player));
}
if (musa_postgame_tab_rival) {
    musa_postgame_tab_rival.addEventListener("click", () => pintarTextoPostgameMusa(musa_postgame_tab_rival.dataset.player));
}
if (musa_postgame_cerrar) {
    musa_postgame_cerrar.addEventListener("click", () => ocultarPostgameMusa());
}
if (musa_postgame_pdf) {
    musa_postgame_pdf.addEventListener("click", async () => {
        musa_postgame_pdf.disabled = true;
        try {
            await descargarArchivoRegalo(regalo_pdf_ultimo_data, regalo_pdf_ultimo_filename);
        } catch (error) {
            console.error("No se pudo volver a descargar el PDF:", error);
        } finally {
            musa_postgame_pdf.disabled = false;
        }
    });
}
if (window && typeof window.scribOnLanguageChange2P === "function") {
    window.scribOnLanguageChange2P(() => {
        if (regalo_postgame_data) pintarPostgameMusa();
    });
}
const creditos_musa = getEl("creditos_musa");
const creditos_musa_track = getEl("creditos_musa_track");
const creditos_musa_content = getEl("creditos_musa_content");
const creditos_musa_sociales = getEl("creditos_musa_sociales");
let estado_creditos_musa = window.ScribCredits
    ? window.ScribCredits.normalizarPayload({})
    : { creditos: {}, mostrar: false, animacion_id: 0 };
let vista_modo_remota_musa = "tutorial";
const deliberacion_musa = getEl("deliberacion_musa");
const resultado_videojuego_musa = getEl("resultado_videojuego_musa");
const resultado_videojuego_musa_stage = getEl("resultado_videojuego_musa_stage");
const resultado_jurado_musa = getEl("resultado_jurado_musa");
const resultado_jurado_musa_stage = getEl("resultado_jurado_musa_stage");
let estado_puntuacion_final_musa = null;
let estado_resultado_jurado_musa = null;

function normalizarResultadoJuradoMusa(payload = {}) {
    const jugadores = payload && payload.jugadores && typeof payload.jugadores === "object" ? payload.jugadores : {};
    const normalizarJugador = (id) => {
        const jugador = jugadores[id] || jugadores[String(id)] || {};
        return {
            nombre: String(jugador.nombre || `ESCRITXR ${id}`).trim() || `ESCRITXR ${id}`,
            total: Math.max(0, Math.min(10, Number(jugador.total) || 0))
        };
    };
    return {
        disponible: Boolean(payload && payload.disponible),
        empate: Boolean(payload && payload.empate),
        ganador: Number(payload && payload.ganador) || 0,
        jugadores: { 1: normalizarJugador(1), 2: normalizarJugador(2) }
    };
}

function tarjetaResultadoMusa(jugador, id, ganador, escala = 100) {
    const total = Number(jugador && jugador.total) || 0;
    const esGanador = Number(ganador) === id;
    return `<article class="resultado-musa__card resultado-musa__card--${id}${esGanador ? " is-winner" : ""}">
        <small>${esGanador ? "GANADOR" : "FINALISTA"}</small>
        <h3>${escapeHtml(jugador && jugador.nombre ? jugador.nombre : `ESCRITXR ${id}`)}</h3>
        <strong>${total.toFixed(1)}</strong><span>/ ${escala}</span>
    </article>`;
}

function renderizarPuntuacionFinalMusa() {
    if (!resultado_videojuego_musa_stage) return;
    const api = window.ScribFinalScore;
    const estado = api ? api.normalizarPayload(estado_puntuacion_final_musa || {}) : (estado_puntuacion_final_musa || {});
    if (!estado.disponible) {
        resultado_videojuego_musa_stage.innerHTML = '<p class="resultado-musa__espera">CALCULANDO EL RESULTADO&hellip;</p>';
        return;
    }
    resultado_videojuego_musa_stage.innerHTML = `<div class="resultado-musa__cards">
        ${tarjetaResultadoMusa(estado.jugadores[1], 1, estado.empate ? 0 : estado.ganador, 100)}
        ${tarjetaResultadoMusa(estado.jugadores[2], 2, estado.empate ? 0 : estado.ganador, 100)}
    </div><p class="resultado-musa__veredicto">${estado.empate ? "EMPATE" : "RESULTADO DEL JUEGO"}</p>`;
}

function renderizarResultadoJuradoMusa() {
    if (!resultado_jurado_musa_stage) return;
    const estado = normalizarResultadoJuradoMusa(estado_resultado_jurado_musa || {});
    if (!estado.disponible) {
        resultado_jurado_musa_stage.innerHTML = '<p class="resultado-musa__espera">EL JURADO SIGUE DELIBERANDO&hellip;</p>';
        return;
    }
    resultado_jurado_musa_stage.innerHTML = `<div class="resultado-musa__cards">
        ${tarjetaResultadoMusa(estado.jugadores[1], 1, estado.empate ? 0 : estado.ganador, 10)}
        ${tarjetaResultadoMusa(estado.jugadores[2], 2, estado.empate ? 0 : estado.ganador, 10)}
    </div><p class="resultado-musa__veredicto">${estado.empate ? "EMPATE DEL JURADO" : "DECISI&Oacute;N DEL JURADO"}</p>`;
}

function sincronizarVistaDeliberacionMusa() {
    const pantallas = [deliberacion_musa, resultado_videojuego_musa, resultado_jurado_musa];
    pantallas.forEach((pantalla) => {
        if (!pantalla) return;
        pantalla.hidden = true;
        pantalla.setAttribute("aria-hidden", "true");
    });
    let activa = null;
    if (vista_modo_remota_musa === "deliberacion") activa = deliberacion_musa;
    else if (vista_modo_remota_musa === "puntuacion") {
        renderizarPuntuacionFinalMusa();
        activa = resultado_videojuego_musa;
    } else if (vista_modo_remota_musa === "resultado_jurado") {
        renderizarResultadoJuradoMusa();
        activa = resultado_jurado_musa;
    }
    if (!activa) return false;
    animarTransicionVistaMusa(vista_modo_remota_musa);
    activa.hidden = false;
    activa.setAttribute("aria-hidden", "false");
    return true;
}

function actualizarPuntuacionFinalMusa(payload = {}) {
    estado_puntuacion_final_musa = payload;
    if (vista_modo_remota_musa === "puntuacion") renderizarPuntuacionFinalMusa();
}

function actualizarResultadoJuradoMusa(payload = {}) {
    estado_resultado_jurado_musa = normalizarResultadoJuradoMusa(payload);
    if (vista_modo_remota_musa === "resultado_jurado") renderizarResultadoJuradoMusa();
}

window.actualizarPuntuacionFinalMusa = actualizarPuntuacionFinalMusa;
window.actualizarResultadoJuradoMusa = actualizarResultadoJuradoMusa;

function finalizarCreditosMusa() {
    if (!creditos_musa || creditos_musa.hidden || vista_modo_remota_musa !== "creditos") return;
    creditos_musa.classList.add("creditos-musa--finalizados");
    if (creditos_musa_sociales) creditos_musa_sociales.setAttribute("aria-hidden", "false");
}

function renderizarListaCreditosMusa(musas, clase) {
    const lista = Array.isArray(musas) ? musas : [];
    if (!lista.length) return "";
    return `<section class="creditos-musa__equipo ${clase}"><h4>MUSAS</h4><ul>${lista.map((musa) => `<li>${escapeHtml(musa)}</li>`).join("")}</ul></section>`;
}

function renderizarCreditosMusa() {
    if (!creditos_musa_content || !window.ScribCredits) return;
    const data = estado_creditos_musa.creditos || window.ScribCredits.DEFAULT_STATE;
    const lineas = window.ScribCredits.SPECTATOR_ORDER.map(([label, campo]) => (
        `<div class="creditos-musa__linea"><span>${escapeHtml(label)}</span><strong>${escapeHtml(data[campo] || "—")}</strong></div>`
    )).join("");
    const musas = data.musas || {};
    const equiposMusas = `${renderizarListaCreditosMusa(musas.azules, "creditos-musa__equipo--azul")}${renderizarListaCreditosMusa(musas.rojas, "creditos-musa__equipo--rojo")}`;
    const agradecimientos = data.agradecimientos
        ? escapeHtml(data.agradecimientos).replace(/\n/g, "<br>")
        : "GRACIAS POR INSPIRAR";
    const nombreMusaCreditos = String(window.nombre_musa || "").trim();
    const cierrePersonalizado = nombreMusaCreditos
        ? `GRACIAS, <strong>${escapeHtml(nombreMusaCreditos)}</strong>, POR HACERLO POSIBLE.`
        : "GRACIAS POR HACERLO POSIBLE.";
    creditos_musa_content.innerHTML = `
        <header class="creditos-musa__apertura">
            <div class="creditos-musa__logos" aria-label="SCRI B">
                <img class="creditos-musa__marca creditos-musa__marca--scrib" src="../../media/scrib-logo-mark.png" alt="SCRI B">
            </div>
            <p>CR&Eacute;DITOS DEL SHOW</p>
        </header>
        <section class="creditos-musa__bloque">${lineas}</section>
        ${equiposMusas ? `<section class="creditos-musa__bloque"><h3 class="creditos-musa__titulo">LAS MUSAS</h3><div class="creditos-musa__musas">${equiposMusas}</div></section>` : ""}
        <section class="creditos-musa__bloque">
            <h3 class="creditos-musa__titulo">AGRADECIMIENTOS</h3>
            <p class="creditos-musa__agradecimientos">${agradecimientos}</p>
        </section>
        <footer class="creditos-musa__cierre">
            <div class="creditos-musa__produccion" aria-label="Una producci&oacute;n de Sutura">
                <small>UNA PRODUCCI&Oacute;N DE</small>
                <span class="creditos-musa__cierre-sutura-lockup"><img class="creditos-musa__cierre-marca--sutura" src="../../img/logo.png" alt="Sutura Teatro"></span>
            </div>
            <p>${cierrePersonalizado}</p>
        </footer>
    `;
}

function configurarTrayectoCreditosMusa() {
    if (!creditos_musa_track || !creditos_musa_sociales) return;
    const altoViewport = Math.max(window.innerHeight || 0, 1);
    const yInicio = altoViewport * 0.72;
    const centroSocial = creditos_musa_sociales.offsetTop + (creditos_musa_sociales.offsetHeight * 0.5);
    const yFin = (altoViewport * 0.5) - centroSocial;
    const distancia = Math.max(1, yInicio - yFin);
    creditos_musa_track.style.setProperty("--creditos-musa-y-inicio", `${yInicio.toFixed(2)}px`);
    creditos_musa_track.style.setProperty("--creditos-musa-y-fin", `${yFin.toFixed(2)}px`);
    creditos_musa_track.style.setProperty("--creditos-musa-duracion", `${Math.max(46, distancia / 24).toFixed(2)}s`);
}

function ocultarCreditosMusa() {
    if (creditos_musa) {
        creditos_musa.classList.remove("creditos-musa--finalizados");
        creditos_musa.hidden = true;
        creditos_musa.setAttribute("aria-hidden", "true");
    }
    if (creditos_musa_sociales) creditos_musa_sociales.setAttribute("aria-hidden", "true");
}

function sincronizarVisibilidadCreditosMusa(forzarReinicio = false) {
    const visible = Boolean(
        creditos_musa
        && estado_creditos_musa.mostrar
        && vista_modo_remota_musa === "creditos"
    );
    if (!visible) {
        ocultarCreditosMusa();
        return false;
    }
    animarTransicionVistaMusa("creditos");
    renderizarCreditosMusa();
    creditos_musa.hidden = false;
    creditos_musa.setAttribute("aria-hidden", "false");
    if (creditos_musa_sociales) creditos_musa_sociales.setAttribute("aria-hidden", "false");
    configurarTrayectoCreditosMusa();
    const animacionCreditosActiva = Boolean(
        creditos_musa_track
        && typeof creditos_musa_track.getAnimations === "function"
        && creditos_musa_track.getAnimations().length
    );
    if (creditos_musa_track && (forzarReinicio || !animacionCreditosActiva)) {
        creditos_musa.classList.remove("creditos-musa--finalizados");
        if (creditos_musa_sociales) creditos_musa_sociales.setAttribute("aria-hidden", "false");
        creditos_musa_track.style.animation = "none";
        void creditos_musa_track.offsetWidth;
        creditos_musa_track.style.removeProperty("animation");
    }
    return true;
}

function actualizarCreditosMusa(payload = {}) {
    const animacionPrevia = Number(estado_creditos_musa.animacion_id) || 0;
    estado_creditos_musa = window.ScribCredits
        ? window.ScribCredits.normalizarPayload(payload)
        : payload;
    return sincronizarVisibilidadCreditosMusa(
        Number(estado_creditos_musa.animacion_id) !== animacionPrevia
    );
}

if (creditos_musa_track) {
    creditos_musa_track.addEventListener("animationend", (event) => {
        if (event.target !== creditos_musa_track || event.animationName !== "creditosMusaRoll") return;
        finalizarCreditosMusa();
    });
}

const CLAVE_TEMPORIZADOR_LECTURA = "scrib_temporizador_lectura_fin";

function paddedFormat(num) {
    return num < 10 ? `0${num}` : `${num}`;
}

function insertarTextoEnInput(input, texto) {
    if (!input || !texto) return;
    const inicio = input.selectionStart ?? input.value.length;
    const fin = input.selectionEnd ?? input.value.length;
    const valor = input.value;
    let insercion = texto;
    if (input.maxLength > 0) {
        const disponible = input.maxLength - (valor.length - (fin - inicio));
        insercion = disponible > 0 ? texto.slice(0, disponible) : "";
    }
    if (!insercion) return;
    input.value = valor.slice(0, inicio) + insercion + valor.slice(fin);
    const cursor = inicio + insercion.length;
    input.setSelectionRange(cursor, cursor);
}

function removerEspaciosInspiracion(texto) {
    return String(texto || "").replace(/\s+/g, "");
}

function bloquearEspaciosEnInspiracionInput(input, permitirEspaciosFn = null) {
    if (!input) return;
    input.addEventListener("keydown", (evt) => {
        if (!evt) return;
        const permitirEspacios = typeof permitirEspaciosFn === "function"
            ? Boolean(permitirEspaciosFn())
            : false;
        if (permitirEspacios) return;
        if (evt.key === " " || evt.key === "Spacebar" || evt.code === "Space") {
            evt.preventDefault();
        }
    });
    input.addEventListener("input", () => {
        const permitirEspacios = typeof permitirEspaciosFn === "function"
            ? Boolean(permitirEspaciosFn())
            : false;
        if (permitirEspacios) return;
        const valorActual = String(input.value || "");
        const valorSinEspacios = removerEspaciosInspiracion(valorActual);
        if (valorActual === valorSinEspacios) {
            return;
        }
        const cursor = input.selectionStart ?? valorSinEspacios.length;
        const diferencia = valorActual.length - valorSinEspacios.length;
        input.value = valorSinEspacios;
        if (typeof input.setSelectionRange === "function") {
            const nuevoCursor = Math.max(0, cursor - diferencia);
            input.setSelectionRange(nuevoCursor, nuevoCursor);
        }
    });
}

function ocultarBarraVida() {
    tiempo.classList.remove("tiempo-vida");
}

function mostrarBarraVida() {
    if (!tiempo.classList.contains("tiempo-vida")) {
        tiempo.classList.add("tiempo-vida");
    }
    actualizarBarraVida(tiempo, tiempo.innerHTML);
}

function aplicarTecladoLento(input) {
    if (!input) return;
    input.addEventListener("beforeinput", (e) => {
        if (!teclado_lento_putada) return;
        if (e.inputType === "insertText") {
            e.preventDefault();
            const data = e.data ?? "";
            if (!data) return;
            const revisionContexto = obtenerRevisionContextoDesventajasMusa();
            setTimeout(() => {
                if (!teclado_lento_putada || !esRevisionContextoDesventajasMusaActiva(revisionContexto)) return;
                insertarTextoEnInput(input, data);
            }, RETRASO_TECLADO_LENTO_MS);
        }
    });
    input.addEventListener("paste", (e) => {
        if (!teclado_lento_putada) return;
        const texto = (e.clipboardData || window.clipboardData)?.getData("text");
        if (!texto) return;
        e.preventDefault();
        const revisionContexto = obtenerRevisionContextoDesventajasMusa();
        setTimeout(() => {
            if (!teclado_lento_putada || !esRevisionContextoDesventajasMusaActiva(revisionContexto)) return;
            insertarTextoEnInput(input, texto);
        }, RETRASO_TECLADO_LENTO_MS);
    });
}

function limpiarTecladoLentoMusa() {
    teclado_lento_putada = false;
    if (timeout_teclado_lento) {
        clearTimeout(timeout_teclado_lento);
        timeout_teclado_lento = null;
    }
}

function activarTecladoLentoMusa() {
    limpiarTecladoLentoMusa();
    teclado_lento_putada = true;
    const duracion = TIEMPO_MODIFICADOR > 0 ? TIEMPO_MODIFICADOR : (60 * 1000);
    if (duracion > 0) {
        const revisionContexto = obtenerRevisionContextoDesventajasMusa();
        timeout_teclado_lento = setTimeout(() => {
            if (!esRevisionContextoDesventajasMusaActiva(revisionContexto)) return;
            teclado_lento_putada = false;
            timeout_teclado_lento = null;
        }, duracion);
    }
}

function obtenerDuracionDesventajaMusa() {
    return TIEMPO_MODIFICADOR > 0 ? TIEMPO_MODIFICADOR : (60 * 1000);
}

function asegurarLightningMusa() {
    if (lightning_musa && lightning_musa.isConnected) {
        return lightning_musa;
    }
    lightning_musa = getEl("lightning");
    if (lightning_musa) {
        return lightning_musa;
    }
    lightning_musa = document.createElement("div");
    lightning_musa.id = "lightning";
    lightning_musa.setAttribute("aria-hidden", "true");
    document.body.appendChild(lightning_musa);
    return lightning_musa;
}

function limpiarRayoMusa() {
    if (timeout_rayo_musa) {
        clearTimeout(timeout_rayo_musa);
        timeout_rayo_musa = null;
    }
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    if (lightning_musa && lightning_musa.classList) {
        lightning_musa.classList.remove("lightning");
    }
}

function activarRayoMusa() {
    limpiarRayoMusa();
    document.body.classList.add("bg");
    document.body.classList.add("rain");
    const duracion = obtenerDuracionDesventajaMusa();
    if (duracion > 0) {
        const revisionContexto = obtenerRevisionContextoDesventajasMusa();
        timeout_rayo_musa = setTimeout(() => {
            if (!esRevisionContextoDesventajasMusaActiva(revisionContexto)) return;
            timeout_rayo_musa = null;
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
        }, duracion);
    }
}

function limpiarBrumaMusa(apagarProgresivo = false) {
    if (tempo_text_borroso) {
        clearTimeout(tempo_text_borroso);
        tempo_text_borroso = null;
    }
    if (timeout_bruma_salida_musa) {
        clearTimeout(timeout_bruma_salida_musa);
        timeout_bruma_salida_musa = null;
    }
    if (!texto1) return;
    if (apagarProgresivo) {
        const revisionContexto = obtenerRevisionContextoDesventajasMusa();
        texto1.classList.remove("textarea-bruma-musa");
        texto1.classList.add("textarea-bruma-musa-salida");
        timeout_bruma_salida_musa = setTimeout(() => {
            if (!esRevisionContextoDesventajasMusaActiva(revisionContexto)) return;
            timeout_bruma_salida_musa = null;
            if (texto1) {
                texto1.classList.remove("textarea-bruma-musa-salida");
            }
        }, 900);
        return;
    }
    texto1.classList.remove("textarea-bruma-musa");
    texto1.classList.remove("textarea-bruma-musa-salida");
}

function activarBrumaMusa() {
    if (!texto1) return;
    limpiarBrumaMusa(false);
    void texto1.offsetWidth;
    texto1.classList.add("textarea-bruma-musa");
    const duracion = obtenerDuracionDesventajaMusa();
    if (duracion > 0) {
        const revisionContexto = obtenerRevisionContextoDesventajasMusa();
        tempo_text_borroso = setTimeout(() => {
            if (!esRevisionContextoDesventajasMusaActiva(revisionContexto)) return;
            tempo_text_borroso = null;
            limpiarBrumaMusa(true);
        }, duracion);
    }
}

function limpiarEspejoMusa() {
    if (timeout_espejo_musa) {
        clearTimeout(timeout_espejo_musa);
        timeout_espejo_musa = null;
    }
}

function activarEspejoMusa() {
    limpiarEspejoMusa();
    const duracion = obtenerDuracionDesventajaMusa();
    if (duracion > 0) {
        const revisionContexto = obtenerRevisionContextoDesventajasMusa();
        timeout_espejo_musa = setTimeout(() => {
            if (!esRevisionContextoDesventajasMusaActiva(revisionContexto)) return;
            limpiarEspejoMusa();
        }, duracion);
    }
}

function limpiarEfectosVisualesDesventajaMusa() {
    limpiarRayoMusa();
    limpiarBrumaMusa(false);
    limpiarEspejoMusa();
}

function invalidarContextoDesventajasMusa() {
    revision_contexto_desventajas_musa += 1;
    limpiarTecladoLentoMusa();
    limpiarEfectosVisualesDesventajaMusa();
    return revision_contexto_desventajas_musa;
}

function obtenerRevisionContextoDesventajasMusa() {
    return revision_contexto_desventajas_musa;
}

function esRevisionContextoDesventajasMusaActiva(revision) {
    return revision === revision_contexto_desventajas_musa;
}

function guardarTemporizadorLecturaPersistente(finTimestamp) {
    try {
        localStorage.setItem(CLAVE_TEMPORIZADOR_LECTURA, String(finTimestamp));
    } catch (error) {
        console.warn("No se pudo guardar el temporizador:", error);
    }
}

function obtenerTemporizadorLecturaPersistente() {
    try {
        const valor = localStorage.getItem(CLAVE_TEMPORIZADOR_LECTURA);
        if (!valor) return null;
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : null;
    } catch (error) {
        return null;
    }
}

function limpiarTemporizadorLecturaPersistente() {
    try {
        localStorage.removeItem(CLAVE_TEMPORIZADOR_LECTURA);
    } catch (error) {
        console.warn("No se pudo limpiar el temporizador:", error);
    }
}

function obtenerEstiloMusa() {
    // IMPORTANTE: tras un refresh, `restaurarTemporizadorLecturaPersistente()` puede ejecutarse
    // antes de que la variable global `player` esté inicializada. Por eso añadimos fallback
    // al query param y también al estilo computado del input `nombre1`.
    const p = Number(player || getParameterByName("player"));
    if (p === 1) {
        return "color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
    }
    if (p === 2) {
        return "color:red; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;";
    }

    if (nombre1) {
        // 1) Intento con estilo inline (si ya se aplicó en la inicialización)
        if (nombre1.style && nombre1.style.color) {
            const sombraInline = nombre1.style.textShadow ? ` text-shadow: ${nombre1.style.textShadow};` : "";
            return `color:${nombre1.style.color};${sombraInline}`;
        }

        // 2) Fallback robusto al estilo computado (por si viene de CSS y no de inline style)
        const estilo = window.getComputedStyle ? window.getComputedStyle(nombre1) : null;
        if (estilo && estilo.color) {
            const sombraComputada = estilo.textShadow && estilo.textShadow !== "none"
                ? ` text-shadow: ${estilo.textShadow};`
                : "";
            return `color:${estilo.color};${sombraComputada}`;
        }
    }

    return "color: orange;";
}

function forzarVisibilidadAccionesLecturaFinal(activo) {
    const contenedorAcciones = document.getElementById("metadatos_acciones");
    const botonTextoCompleto = document.getElementById("mostrar_texto");
    const botonBandera = document.getElementById("btn_bandera");
    const cardTexto = botonTextoCompleto && botonTextoCompleto.closest ? botonTextoCompleto.closest(".marcador-accion") : null;
    const cardBandera = botonBandera && botonBandera.closest ? botonBandera.closest(".marcador-accion") : null;

    const elementos = [contenedorAcciones, cardTexto, cardBandera, botonTextoCompleto, botonBandera].filter(Boolean);
    elementos.forEach((el) => {
        if (!el || !el.style) return;
        if (activo) {
            if (!Object.prototype.hasOwnProperty.call(el.dataset, "lecturaVisDisplayPrev")) {
                el.dataset.lecturaVisDisplayPrev = el.style.display || "";
                el.dataset.lecturaVisVisibilityPrev = el.style.visibility || "";
                el.dataset.lecturaVisOpacityPrev = el.style.opacity || "";
                el.dataset.lecturaVisPointerPrev = el.style.pointerEvents || "";
            }
            if (el === contenedorAcciones) {
                el.style.display = "grid";
            } else {
                el.style.display = "";
            }
            el.style.visibility = "visible";
            el.style.opacity = "1";
            el.style.pointerEvents = "auto";
        } else if (Object.prototype.hasOwnProperty.call(el.dataset, "lecturaVisDisplayPrev")) {
            el.style.display = el.dataset.lecturaVisDisplayPrev;
            el.style.visibility = el.dataset.lecturaVisVisibilityPrev;
            el.style.opacity = el.dataset.lecturaVisOpacityPrev;
            el.style.pointerEvents = el.dataset.lecturaVisPointerPrev;
            delete el.dataset.lecturaVisDisplayPrev;
            delete el.dataset.lecturaVisVisibilityPrev;
            delete el.dataset.lecturaVisOpacityPrev;
            delete el.dataset.lecturaVisPointerPrev;
        }
    });

    if (activo) {
        if (typeof setUiPartidaFinalizadaMusa === "function") {
            setUiPartidaFinalizadaMusa(true);
        } else if (typeof setUiPartidaActivaMusa === "function") {
            setUiPartidaActivaMusa(true);
        }
        intentarMostrarRegaloPdfPendiente();
    }
}

function mostrarMensajeLecturaFinal() {
    const musaLabel = nombre_musa || "MUSA";
    const estiloMusa = obtenerEstiloMusa();
    const nombreHtml = `<span style="${estiloMusa}">${escapeHtml(musaLabel)}</span>`;
    const enhorabuenaHtml = `<span style="color: lime;">&iexcl;Enhorabuena!</span>`;
    tarea.innerHTML = `${nombreHtml}, lee el fruto de tu creacion. ${enhorabuenaHtml}`;
    recordatorio.innerHTML = "";
    notificacion.style.display = "block";
    if (campo_palabra) {
        campo_palabra.style.display = "none";
    }
    if (enviarPalabra_boton) {
        enviarPalabra_boton.style.display = "none";
    }
    animateCSS(".notificacion", "flash");
    if (fin_pag) {
        fin_pag.scrollIntoView({behavior: "smooth", block: "end"});
    }
}

function guardarEstadoLectura() {
    if (lectura_estado_guardado) return;
    lectura_estado_guardado = {
        tarea: tarea.innerHTML,
        recordatorio: recordatorio.innerHTML,
        notificacion: notificacion.style.display
    };
}

function restaurarEstadoLectura() {
    if (!lectura_estado_guardado) return;
    tarea.innerHTML = lectura_estado_guardado.tarea;
    recordatorio.innerHTML = lectura_estado_guardado.recordatorio;
    notificacion.style.display = lectura_estado_guardado.notificacion;
    lectura_estado_guardado = null;
}

function detenerTemporizadorLectura() {
    if (temporizador_lectura_interval) {
        clearInterval(temporizador_lectura_interval);
        temporizador_lectura_interval = null;
    }
    temporizador_lectura_restante = 0;
    temporizador_lectura_activo = false;
}

function resetearTemporizadorLectura() {
    detenerTemporizadorLectura();
    limpiarTemporizadorLecturaPersistente();
}

function cancelarTemporizadorLectura() {
    detenerTemporizadorLectura();
    limpiarTemporizadorLecturaPersistente();
    const overlay = getEl("temporizador_musa");
    if (overlay) {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
        overlay.classList.remove("is-urgent", "is-finished");
    }
}

let temporizador_lectura_duracion = 0;
let temporizador_lectura_fin_ts = 0;

function actualizarTemporizadorLectura(forzarRestante = null) {
    if (forzarRestante !== null && typeof forzarRestante !== "undefined" && Number.isFinite(Number(forzarRestante))) {
        temporizador_lectura_restante = Math.max(0, Math.ceil(Number(forzarRestante)));
    } else if (temporizador_lectura_fin_ts > 0) {
        temporizador_lectura_restante = Math.max(0, Math.ceil((temporizador_lectura_fin_ts - Date.now()) / 1000));
    }
    const minutos = Math.floor(temporizador_lectura_restante / 60);
    const segundos = temporizador_lectura_restante % 60;
    const texto = `${paddedFormat(minutos)}:${paddedFormat(segundos)}`;
    const valor = getEl("temporizador_musa_valor");
    const ring = getEl("temporizador_musa_ring");
    const overlay = getEl("temporizador_musa");
    if (valor) valor.textContent = texto;
    if (ring) {
        const duracion = Math.max(1, temporizador_lectura_duracion || temporizador_lectura_restante);
        const progreso = Math.max(0, Math.min(1, temporizador_lectura_restante / duracion));
        ring.style.setProperty("--temporizador-progreso", `${(progreso * 360).toFixed(2)}deg`);
    }
    if (overlay) overlay.classList.toggle("is-urgent", temporizador_lectura_restante <= 10);
}

function iniciarTemporizadorLectura(duracion, finTimestamp) {
    resetearTemporizadorLectura();
    const overlay = getEl("temporizador_musa");
    const final = getEl("temporizador_musa_final");
    temporizador_lectura_duracion = Math.max(1, Number(duracion) || (10 * 60));
    temporizador_lectura_fin_ts = Number(finTimestamp) || (Date.now() + (temporizador_lectura_duracion * 1000));
    temporizador_lectura_restante = Math.max(0, Math.ceil((temporizador_lectura_fin_ts - Date.now()) / 1000));
    temporizador_lectura_activo = true;
    guardarTemporizadorLecturaPersistente(temporizador_lectura_fin_ts);
    if (overlay) {
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");
        overlay.classList.remove("is-finished");
    }
    if (final) final.hidden = true;
    actualizarTemporizadorLectura();
    if (temporizador_lectura_restante <= 0) {
        finalizarTemporizadorLectura();
        return;
    }
    temporizador_lectura_interval = setInterval(() => {
        actualizarTemporizadorLectura();
        if (temporizador_lectura_restante <= 0) {
            finalizarTemporizadorLectura();
            return;
        }
    }, 250);
}

function finalizarTemporizadorLectura() {
    detenerTemporizadorLectura();
    limpiarTemporizadorLecturaPersistente();
    const overlay = getEl("temporizador_musa");
    const final = getEl("temporizador_musa_final");
    if (overlay) {
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");
        overlay.classList.remove("is-urgent");
        overlay.classList.add("is-finished");
    }
    if (final) final.hidden = false;
}

function aplicarEstadoTemporizadorMusa(payload = {}) {
    const estado = String(payload.estado || "").trim().toLowerCase();
    if (estado === "oculto" || payload.mostrar === false) {
        cancelarTemporizadorLectura();
        return;
    }
    if (estado === "finalizado") {
        finalizarTemporizadorLectura();
        return;
    }
    const duracion = Math.max(1, Number(payload.duracion) || Number(payload.restante) || (10 * 60));
    const finTs = Number(payload.fin_ts) || (Date.now() + (Math.max(0, Number(payload.restante) || duracion) * 1000));
    iniciarTemporizadorLectura(duracion, finTs);
}

function restaurarTemporizadorLecturaPersistente() {
    const finTimestamp = obtenerTemporizadorLecturaPersistente();
    if (!finTimestamp) return;
    const restante = Math.ceil((finTimestamp - Date.now()) / 1000);
    if (restante > 0) {
        iniciarTemporizadorLectura(restante, finTimestamp);
    } else {
        limpiarTemporizadorLecturaPersistente();
        finalizarTemporizadorLectura();
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

let jugador1 = document.querySelector('.jugador1');
let jugador2 = document.querySelector('.jugador2');
let nombre_musa_label = getEl("nombre_musa_label");
const calentamiento_section = getEl("calentamiento");
const calentamiento_estado = getEl("calentamiento_estado");
const calentamiento_input_wrap = calentamiento_section ? calentamiento_section.querySelector(".calentamiento-input") : null;
const calentamiento_input = getEl("calentamiento_input");
const calentamiento_enviar = getEl("calentamiento_enviar");
const calentamiento_text_progress = getEl("calentamiento_text_progress");
const calentamiento_bar_progress = getEl("calentamiento_bar_progress");
const calentamiento_estado_cierre = getEl("calentamiento_estado_cierre");
const calentamiento_final_musa = getEl("calentamiento_final_musa");

aplicarTecladoLento(campo_palabra);
aplicarTecladoLento(calentamiento_input);
bloquearEspaciosEnInspiracionInput(campo_palabra);
bloquearEspaciosEnInspiracionInput(calentamiento_input, () => calentamiento_solicitud_actual === "frase_final");

const calentamiento_feedback = getEl("calentamiento_feedback");
let calentamiento_activo = false;
let calentamiento_vista = false;
let timeout_destello_calentamiento = null;
let timeout_feedback_calentamiento = null;
let timeout_feedback_calentamiento_salida = null;
let calentamiento_cooldown = false;
let calentamiento_interval_cooldown = null;
let calentamiento_envio_pendiente = false;
let calentamiento_timeout_respuesta = null;
let calentamiento_solicitud_actual = "ninguna";
let calentamiento_bloqueado = false;
let calentamiento_final_actual = null;
let calentamiento_final_id_previo = "";
let timeout_animacion_consigna = null;
let ultimo_payload_calentamiento_musa = null;
const CALENTAMIENTO_MAX_PALABRA = 24;
const CALENTAMIENTO_MAX_FRASE_FINAL = 48;
const esSolicitudActivaCalentamiento = () => (
    Boolean(obtenerMensajesSolicitudCalentamiento()[calentamiento_solicitud_actual]) &&
    calentamiento_solicitud_actual !== "ninguna"
);
const esSolicitudFraseFinalCalentamiento = () => (
    esSolicitudActivaCalentamiento() && calentamiento_solicitud_actual === "frase_final"
);
const obtenerMaxLongitudCalentamiento = () => (
    esSolicitudFraseFinalCalentamiento()
        ? CALENTAMIENTO_MAX_FRASE_FINAL
        : CALENTAMIENTO_MAX_PALABRA
);
const normalizarFinalCalentamientoMusa = (entrada) => {
    if (!entrada || typeof entrada !== "object") return null;
    if (typeof entrada.id !== "string" || !entrada.id) return null;
    if (typeof entrada.palabra !== "string" || !entrada.palabra.trim()) return null;
    return {
        id: entrada.id,
        palabra: entrada.palabra.trim(),
        musa_nombre: typeof (entrada.musa_nombre ?? entrada.nombre_musa) === "string"
            ? (entrada.musa_nombre ?? entrada.nombre_musa)
            : "",
        musas: Array.isArray(entrada.musas) ? entrada.musas.slice(0, 6) : [],
        ts: Number(entrada.ts) || 0
    };
};

const actualizarTemaCalentamiento = (equipo) => {
    if (!calentamiento_section) return;
    const idEquipo = Number(equipo || player);
    const esRojo = idEquipo === 2;
    calentamiento_section.classList.toggle("calentamiento-equipo-1", !esRojo);
    calentamiento_section.classList.toggle("calentamiento-equipo-2", esRojo);
    const colorProgreso = esRojo ? "rgba(255, 125, 125, 0.92)" : "rgba(123, 239, 255, 0.92)";
    const colorTextoProgreso = esRojo ? "#ffb8b8" : "#8fefff";
    const colorTextoCarga = esRojo ? "#fff2e2" : "#f2fbff";
    document.documentElement.style.setProperty("--musa-progress-color", colorProgreso);
    document.documentElement.style.setProperty("--musa-progress-text-color", colorTextoProgreso);
    document.documentElement.style.setProperty("--musa-progress-loading-text-color", colorTextoCarga);
};

const obtenerColorFeedbackCalentamiento = () => {
    if (!calentamiento_section) return "#9fffa2";
    return calentamiento_section.classList.contains("calentamiento-equipo-2")
        ? "#ffafaf"
        : "#8cefff";
};

const restaurarTextoBotonCalentamiento = () => {
    if (!calentamiento_text_progress) return;
    calentamiento_text_progress.innerHTML = tJuego2P(
        "warmup.inspire",
        {},
        `INSPIRAR <span class="btn-emoji" aria-hidden="true">${EMOJI_ROCKET}</span>`
    );
    calentamiento_text_progress.style.color = "";
};

const onMouseEnterCalentamiento = () => {
    if (!calentamiento_text_progress) return;
    calentamiento_text_progress.style.color = "var(--musa-progress-loading-text-color, #f7fbff)";
};

const onMouseLeaveCalentamiento = () => {
    if (!calentamiento_text_progress) return;
    calentamiento_text_progress.style.color = calentamiento_cooldown
        ? "var(--musa-progress-loading-text-color, #f7fbff)"
        : "";
};

const limpiarCooldownCalentamiento = () => {
    if (calentamiento_interval_cooldown) {
        clearInterval(calentamiento_interval_cooldown);
        calentamiento_interval_cooldown = null;
    }
    if (calentamiento_text_progress) {
        calentamiento_text_progress.removeEventListener("mouseenter", onMouseEnterCalentamiento);
        calentamiento_text_progress.removeEventListener("mouseleave", onMouseLeaveCalentamiento);
    }
    if (calentamiento_bar_progress) {
        calentamiento_bar_progress.style.width = "0%";
    }
    restaurarTextoBotonCalentamiento();
    calentamiento_cooldown = false;
};

const startProgressCalentamiento = (button) => {
    if (!button || !calentamiento_text_progress || !calentamiento_bar_progress) return;
    calentamiento_cooldown = true;
    calentamiento_text_progress.textContent = tJuego2P("warmup.inspiring", {}, "Inspirando...");
    calentamiento_text_progress.style.color = "var(--musa-progress-loading-text-color, #f7fbff)";
    calentamiento_text_progress.addEventListener("mouseenter", onMouseEnterCalentamiento);
    calentamiento_text_progress.addEventListener("mouseleave", onMouseLeaveCalentamiento);
    let progress = 0;
    const incrementoPorIntervalo = 100;
    const limiteSegundos = Number(LIMITE_TIEMPO_INSPIRACION) > 0 ? Number(LIMITE_TIEMPO_INSPIRACION) : 30;
    const intervalo = (limiteSegundos * 1000) / incrementoPorIntervalo;
    if (calentamiento_interval_cooldown) {
        clearInterval(calentamiento_interval_cooldown);
    }
    const revisionContexto = obtenerRevisionContextoCalentamientoMusa();
    calentamiento_interval_cooldown = setInterval(() => {
        if (!esRevisionContextoCalentamientoMusaActiva(revisionContexto)) {
            clearInterval(calentamiento_interval_cooldown);
            calentamiento_interval_cooldown = null;
            return;
        }
        progress += 1;
        calentamiento_bar_progress.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(calentamiento_interval_cooldown);
            calentamiento_interval_cooldown = null;
            setTimeout(() => {
                if (!esRevisionContextoCalentamientoMusaActiva(revisionContexto)) return;
                limpiarCooldownCalentamiento();
            }, 1000);
        }
    }, intervalo);
};

const CLASES_FEEDBACK_CALENTAMIENTO = ["feedback-destacado", "equipo-1", "equipo-2", "activa", "is-leaving"];
const DURACION_FEEDBACK_CALENTAMIENTO_MS = 2400;
const DURACION_SALIDA_FEEDBACK_CALENTAMIENTO_MS = 280;

const limpiarEstiloFeedbackCalentamiento = () => {
    if (!calentamiento_feedback) return;
    calentamiento_feedback.classList.remove(...CLASES_FEEDBACK_CALENTAMIENTO);
    calentamiento_feedback.style.color = "";
};

const mostrarFeedbackCalentamiento = (mensaje, esError = false, opciones = {}) => {
    if (!calentamiento_feedback) return;
    const texto = typeof mensaje === "string" ? mensaje : "";
    const usarHtml = Boolean(opciones && opciones.html);
    const clasesExtra = (opciones && typeof opciones.clase === "string")
        ? opciones.clase.trim().split(/\s+/).filter(Boolean)
        : [];
    const esFeedbackDestacado = clasesExtra.includes("feedback-destacado");
    limpiarEstiloFeedbackCalentamiento();
    if (usarHtml) {
        calentamiento_feedback.innerHTML = texto;
    } else {
        calentamiento_feedback.textContent = texto;
    }
    if (!usarHtml) {
        calentamiento_feedback.style.color = esError ? "#ff6b6b" : obtenerColorFeedbackCalentamiento();
    }
    clasesExtra.forEach((clase) => calentamiento_feedback.classList.add(clase));
    if (timeout_feedback_calentamiento) {
        clearTimeout(timeout_feedback_calentamiento);
        timeout_feedback_calentamiento = null;
    }
    if (timeout_feedback_calentamiento_salida) {
        clearTimeout(timeout_feedback_calentamiento_salida);
        timeout_feedback_calentamiento_salida = null;
    }
    if (!texto) return;
    const revisionContexto = obtenerRevisionContextoCalentamientoMusa();
    if (esFeedbackDestacado) {
        calentamiento_feedback.classList.remove("is-leaving", "activa");
        void calentamiento_feedback.offsetWidth;
        calentamiento_feedback.classList.add("activa");
    }
    timeout_feedback_calentamiento = setTimeout(() => {
        if (!esRevisionContextoCalentamientoMusaActiva(revisionContexto)) return;
        if (!calentamiento_feedback) return;
        if (esFeedbackDestacado) {
            calentamiento_feedback.classList.remove("activa");
            calentamiento_feedback.classList.add("is-leaving");
            timeout_feedback_calentamiento_salida = setTimeout(() => {
                if (!esRevisionContextoCalentamientoMusaActiva(revisionContexto)) return;
                if (!calentamiento_feedback) return;
                calentamiento_feedback.textContent = "";
                limpiarEstiloFeedbackCalentamiento();
                timeout_feedback_calentamiento_salida = null;
            }, DURACION_SALIDA_FEEDBACK_CALENTAMIENTO_MS);
        } else {
            calentamiento_feedback.textContent = "";
            limpiarEstiloFeedbackCalentamiento();
        }
        timeout_feedback_calentamiento = null;
    }, DURACION_FEEDBACK_CALENTAMIENTO_MS);
};

const dispararDestelloCalentamiento = (equipo) => {
    if (!calentamiento_section) return;
    const idEquipo = Number(equipo || player);
    const clase = idEquipo === 2 ? "destello-equipo-2" : "destello-equipo-1";
    calentamiento_section.classList.remove("destello-equipo-1", "destello-equipo-2");
    void calentamiento_section.offsetWidth;
    calentamiento_section.classList.add(clase);
    if (timeout_destello_calentamiento) {
        clearTimeout(timeout_destello_calentamiento);
    }
    const revisionContexto = obtenerRevisionContextoCalentamientoMusa();
    timeout_destello_calentamiento = setTimeout(() => {
        if (!esRevisionContextoCalentamientoMusaActiva(revisionContexto)) return;
        calentamiento_section.classList.remove(clase);
        timeout_destello_calentamiento = null;
    }, 820);
};

const animarCambioConsignaCalentamiento = () => {
    if (!calentamiento_section) return;
    calentamiento_section.classList.remove("calentamiento-consigna-cambio");
    void calentamiento_section.offsetWidth;
    calentamiento_section.classList.add("calentamiento-consigna-cambio");
    if (timeout_animacion_consigna) {
        clearTimeout(timeout_animacion_consigna);
    }
    const revisionContexto = obtenerRevisionContextoCalentamientoMusa();
    timeout_animacion_consigna = setTimeout(() => {
        if (!esRevisionContextoCalentamientoMusaActiva(revisionContexto)) return;
        if (!calentamiento_section) return;
        calentamiento_section.classList.remove("calentamiento-consigna-cambio");
        timeout_animacion_consigna = null;
    }, 760);
};

function invalidarContextoCalentamientoMusa() {
    revision_contexto_calentamiento_musa += 1;
    calentamiento_envio_pendiente = false;
    if (calentamiento_timeout_respuesta) {
        clearTimeout(calentamiento_timeout_respuesta);
        calentamiento_timeout_respuesta = null;
    }
    limpiarCooldownCalentamiento();
    if (timeout_feedback_calentamiento) {
        clearTimeout(timeout_feedback_calentamiento);
        timeout_feedback_calentamiento = null;
    }
    if (timeout_feedback_calentamiento_salida) {
        clearTimeout(timeout_feedback_calentamiento_salida);
        timeout_feedback_calentamiento_salida = null;
    }
    if (timeout_destello_calentamiento) {
        clearTimeout(timeout_destello_calentamiento);
        timeout_destello_calentamiento = null;
    }
    if (timeout_animacion_consigna) {
        clearTimeout(timeout_animacion_consigna);
        timeout_animacion_consigna = null;
    }
    if (calentamiento_feedback) {
        calentamiento_feedback.textContent = "";
        limpiarEstiloFeedbackCalentamiento();
    }
    if (calentamiento_section) {
        calentamiento_section.classList.remove(
            "destello-equipo-1",
            "destello-equipo-2",
            "calentamiento-consigna-cambio"
        );
    }
    return revision_contexto_calentamiento_musa;
}

function obtenerRevisionContextoCalentamientoMusa() {
    return revision_contexto_calentamiento_musa;
}

function esRevisionContextoCalentamientoMusaActiva(revision) {
    return revision === revision_contexto_calentamiento_musa;
}

const actualizarBloqueoCalentamientoMusa = (bloqueado, finalPalabra) => {
    if (calentamiento_section) {
        calentamiento_section.classList.toggle("calentamiento-bloqueado", Boolean(bloqueado));
        calentamiento_section.classList.toggle("calentamiento-final-elegida", Boolean(finalPalabra));
    }
    if (calentamiento_estado_cierre) {
        calentamiento_estado_cierre.textContent = "";
        calentamiento_estado_cierre.classList.remove("activa");
    }
    if (calentamiento_text_progress && bloqueado) {
        calentamiento_text_progress.textContent = `\u{1F512} ${tJuego2P("warmup.button.closed", {}, "DETONADOR CERRADO")}`;
        calentamiento_text_progress.style.color = "white";
    }
    if (!calentamiento_final_musa) return;
    if (!finalPalabra) {
        calentamiento_final_musa.textContent = "";
        calentamiento_final_musa.classList.remove("activa", "reveal");
        calentamiento_final_id_previo = "";
        return;
    }
    const etiqueta = document.createElement("span");
    etiqueta.className = "calentamiento-final-label";
    etiqueta.textContent = tJuego2P("warmup.word_chosen", {}, "PALABRA ELEGIDA");
    const palabra = document.createElement("span");
    palabra.className = "calentamiento-final-chip";
    palabra.textContent = finalPalabra.palabra;
    calentamiento_final_musa.replaceChildren(etiqueta, palabra);
    const firma = crearNodoFirmaMusaPublico(finalPalabra, "inspiration-author--final");
    if (firma) calentamiento_final_musa.appendChild(firma);
    calentamiento_final_musa.classList.add("activa");
    if (calentamiento_final_id_previo !== finalPalabra.id) {
        calentamiento_final_musa.classList.remove("reveal");
        void calentamiento_final_musa.offsetWidth;
        calentamiento_final_musa.classList.add("reveal");
    }
    calentamiento_final_id_previo = finalPalabra.id;
};

const actualizarCalentamiento = (data = {}) => {
    ultimo_payload_calentamiento_musa = { ...(data || {}) };
    const mensajesCalentamiento = obtenerMensajesSolicitudCalentamiento();
    calentamiento_activo = Boolean(data.activo);
    calentamiento_vista = Boolean(data.vista);
    // `activo` describe la dinamica interna y puede mantenerse a true aunque
    // Control ya haya vuelto a Tutorial. Solo la vista visible la bloquea.
    if (calentamiento_vista) {
        cerrarPreShowMusaPorTutorial();
    }
    calentamiento_bloqueado = Boolean(data.bloqueado);
    calentamiento_final_actual = normalizarFinalCalentamientoMusa(data.final);
    actualizarTemaCalentamiento(data.equipo || player);
    const solicitudRecibida = typeof data.solicitud === "string" ? data.solicitud.trim().toLowerCase() : "";
    const solicitud = (solicitudRecibida && mensajesCalentamiento[solicitudRecibida])
        ? solicitudRecibida
        : "ninguna";
    const solicitudActiva = solicitud !== "ninguna";
    const solicitudAnterior = calentamiento_solicitud_actual;
    calentamiento_solicitud_actual = solicitud;
    const cambioConsigna = Boolean(
        solicitudActiva &&
        solicitudAnterior &&
        solicitudAnterior !== "ninguna" &&
        solicitudAnterior !== solicitud
    );
    const mensajeSolicitud = mensajesCalentamiento[solicitud] || mensajesCalentamiento.ninguna;
    const visible = calentamiento_activo && calentamiento_vista;

    if (visible) {
        animarTransicionVistaMusa("calentamiento");
    }

    if (document.body) {
        document.body.classList.toggle("vista-calentamiento-musa", visible);
    }
    if (calentamiento_section) {
        calentamiento_section.classList.toggle("activo", visible);
        calentamiento_section.classList.toggle("calentamiento-sin-solicitud", visible && !solicitudActiva);
    }

    if (!visible) {
        if (calentamiento_estado) {
            calentamiento_estado.textContent = calentamiento_activo
                ? tJuego2P("warmup.state.hidden", {}, "Tutorial oculto.")
                : tJuego2P("warmup.state.inactive", {}, "Tutorial inactivo.");
        }
        invalidarContextoCalentamientoMusa();
        if (calentamiento_input_wrap) calentamiento_input_wrap.hidden = false;
        if (calentamiento_input) calentamiento_input.disabled = true;
        if (calentamiento_enviar) calentamiento_enviar.disabled = true;
        calentamiento_bloqueado = false;
        calentamiento_final_actual = null;
        actualizarBloqueoCalentamientoMusa(false, null);
        return;
    }

    // Si cambia la consigna, se reinicia el cooldown de envio para la musa afectada.
    if (cambioConsigna) {
        limpiarCooldownCalentamiento();
    }

    if (calentamiento_estado) {
        if (mensajeSolicitud.estadoHtml) {
            calentamiento_estado.innerHTML = mensajeSolicitud.estadoHtml;
        } else {
            calentamiento_estado.textContent = mensajeSolicitud.estado;
        }
    }

    if (!solicitudActiva) {
        invalidarContextoCalentamientoMusa();
        if (calentamiento_input_wrap) calentamiento_input_wrap.hidden = true;
        if (calentamiento_input) {
            calentamiento_input.value = "";
            calentamiento_input.disabled = true;
        }
        if (calentamiento_enviar) {
            calentamiento_enviar.disabled = true;
        }
        actualizarBloqueoCalentamientoMusa(false, null);
        return;
    }

    if (calentamiento_input_wrap) calentamiento_input_wrap.hidden = false;
    if (calentamiento_input) {
        calentamiento_input.placeholder = mensajeSolicitud.placeholder;
        calentamiento_input.maxLength = obtenerMaxLongitudCalentamiento();
        calentamiento_input.disabled = calentamiento_bloqueado || calentamiento_envio_pendiente;
    }
    if (calentamiento_enviar) {
        calentamiento_enviar.disabled = calentamiento_bloqueado || calentamiento_envio_pendiente;
    }
    if (calentamiento_bloqueado) {
        limpiarCooldownCalentamiento();
    }
    if (!calentamiento_cooldown) {
        restaurarTextoBotonCalentamiento();
    }
    if (cambioConsigna) {
        animarCambioConsignaCalentamiento();
    }
    actualizarBloqueoCalentamientoMusa(calentamiento_bloqueado, calentamiento_final_actual);
};

const mensajeErrorCalentamiento = (data = {}) => {
    if (data && data.codigo === "CONTENIDO_NO_PERMITIDO") {
        return tJuego2P(
            "warmup.feedback.inappropriate_language",
            {},
            "No se permiten palabrotas ni lenguaje ofensivo."
        );
    }
    return data && data.mensaje
        ? data.mensaje
        : tJuego2P("warmup.feedback.generic_error", {}, "Error.");
};

const enviarCalentamiento = () => {
    if (!calentamiento_activo || !calentamiento_vista || !calentamiento_input) {
        return;
    }
    if (!esSolicitudActivaCalentamiento()) {
        mostrarFeedbackCalentamiento(tJuego2P("warmup.feedback.no_trigger", {}, "No hay detonador activo."), true);
        return;
    }
    if (calentamiento_bloqueado) {
        mostrarFeedbackCalentamiento(tJuego2P("warmup.feedback.closed_by_writer", {}, "La consigna esta cerrada por tu escritxr."), true);
        return;
    }
    if (calentamiento_cooldown || calentamiento_envio_pendiente) {
        if (calentamiento_text_progress) {
            calentamiento_text_progress.classList.add("disabled-click-feedback");
            setTimeout(() => {
                calentamiento_text_progress.classList.remove("disabled-click-feedback");
            }, 500);
        }
        return;
    }
    const esFraseFinal = esSolicitudFraseFinalCalentamiento();
    const valorEntrada = String(calentamiento_input.value || "").trim();
    if (!valorEntrada) {
        mostrarFeedbackCalentamiento(
            esFraseFinal
                ? tJuego2P("warmup.feedback.write_phrase", {}, "Escribe una frase.")
                : tJuego2P("warmup.feedback.write_word", {}, "Escribe una palabra."),
            true
        );
        return;
    }
    if (!esFraseFinal && /\s/.test(valorEntrada)) {
        mostrarFeedbackCalentamiento(tJuego2P("warmup.feedback.one_word_only", {}, "Solo se permite una palabra, sin espacios."), true);
        return;
    }
    const contenido = esFraseFinal ? valorEntrada.replace(/\s+/g, " ") : valorEntrada;
    const maxLongitud = obtenerMaxLongitudCalentamiento();
    if (contenido.length > maxLongitud) {
        mostrarFeedbackCalentamiento(
            tJuego2P("warmup.feedback.max_chars", { max: maxLongitud }, `Maximo ${maxLongitud} caracteres.`),
            true
        );
        return;
    }
    const revisionContexto = obtenerRevisionContextoCalentamientoMusa();
    let respuestaProcesada = false;
    let timeoutRespuesta = null;
    calentamiento_envio_pendiente = true;
    calentamiento_input.disabled = true;
    if (calentamiento_enviar) calentamiento_enviar.disabled = true;

    const procesarRespuesta = (respuesta = {}) => {
        if (respuestaProcesada) return;
        respuestaProcesada = true;
        if (timeoutRespuesta) {
            clearTimeout(timeoutRespuesta);
            if (calentamiento_timeout_respuesta === timeoutRespuesta) {
                calentamiento_timeout_respuesta = null;
            }
            timeoutRespuesta = null;
        }
        if (!esRevisionContextoCalentamientoMusaActiva(revisionContexto)) return;
        calentamiento_envio_pendiente = false;
        calentamiento_input.disabled = calentamiento_bloqueado;
        if (calentamiento_enviar) calentamiento_enviar.disabled = calentamiento_bloqueado;
        if (!respuesta || respuesta.ok !== true) {
            mostrarFeedbackCalentamiento(mensajeErrorCalentamiento(respuesta), true);
            return;
        }
        startProgressCalentamiento(calentamiento_enviar);
        calentamiento_input.value = "";
        mostrarFeedbackCalentamiento(
            esFraseFinal
                ? tJuego2P("warmup.feedback.phrase_sent", {}, "Frase enviada.")
                : tJuego2P("warmup.feedback.word_sent", {}, "Palabra enviada."),
            false
        );
    };

    timeoutRespuesta = setTimeout(() => {
        procesarRespuesta({
            ok: false,
            mensaje: tJuego2P("warmup.feedback.generic_error", {}, "No se pudo confirmar el envio.")
        });
    }, 5000);
    calentamiento_timeout_respuesta = timeoutRespuesta;
    socket.emit("calentamiento_intento", { palabra: contenido }, procesarRespuesta);
};

if (calentamiento_enviar) {
    calentamiento_enviar.addEventListener("click", enviarCalentamiento);
}
if (calentamiento_input) {
    calentamiento_input.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
            evt.preventDefault();
            enviarCalentamiento();
        }
    });
}
function formatearPuntos(valor) {
    if (valor == null) return formatearPuntosJuego2P(0);
    if (typeof valor === "number") return formatearPuntosJuego2P(valor);
    const texto = String(valor).trim();
    if (/^\d+$/.test(texto)) return formatearPuntosJuego2P(texto);
    if (/^\d+palabras$/i.test(texto)) {
        return formatearPuntosJuego2P(texto.replace(/^(\d+)(palabras)$/i, "$1"));
    }
    return texto;
}

const MAX_NOMBRE_MUSA = 10;
const REGEX_NOMBRE_MUSA = /^[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F10-9 _.-]+$/;
const REGEX_LETRA_MUSA = /[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1]/;
const CLAVE_CLIENTE_MUSA = "scrib_musa_client_id";
const CLAVE_ASIGNACION_MUSA = "scrib_musa_assignment";

function normalizarNombreMusa(valor) {
    if (typeof valor !== "string") return "";
    const limpio = valor.trim().slice(0, MAX_NOMBRE_MUSA);
    if (!limpio) return "";
    if (!REGEX_NOMBRE_MUSA.test(limpio)) return "";
    if (!REGEX_LETRA_MUSA.test(limpio)) return "";
    return limpio.toUpperCase();
}

function obtenerIdClienteMusa() {
    if (window.ScribMusaAssignment && typeof window.ScribMusaAssignment.getOrCreateClientId === "function") {
        return window.ScribMusaAssignment.getOrCreateClientId(window.sessionStorage, {
            key: CLAVE_CLIENTE_MUSA,
            windowRef: window
        });
    }
    throw new Error("No se pudo inicializar la identidad por pestaña de la musa.");
}

const nombre_musa_solicitado = normalizarNombreMusa(
    getParameterByName("name") ||
    getParameterByName("nombre") ||
    getParameterByName("musa")
);
const musa_client_id = obtenerIdClienteMusa();
const asignacion_musa_guardada = window.ScribMusaAssignment.readAssignmentSession(
    window.sessionStorage,
    musa_client_id
);
const sesion_partida_musa = window.ScribMusaAssignment.normalizeSessionId(
    (asignacion_musa_guardada && asignacion_musa_guardada.assignment.sessionId)
    || getParameterByName("session_id")
);
const nombre_musa = normalizarNombreMusa(
    (asignacion_musa_guardada && asignacion_musa_guardada.name) || nombre_musa_solicitado
);

if (!nombre_musa) {
    window.location.href = "../index.html?error=nombre_musa";
}

if (!sesion_partida_musa) {
    window.ScribMusaAssignment.clearAssignmentSession(window.sessionStorage);
    window.location.replace("../index.html?notice=nueva_partida");
}

window.nombre_musa = nombre_musa;
window.musa_client_id = musa_client_id;
window.sesion_partida_musa = sesion_partida_musa;
if (nombre_musa_label && nombre_musa) {
    nombre_musa_label.textContent = nombre_musa;
}

var player = asignacion_musa_guardada
    ? String(asignacion_musa_guardada.assignment.player)
    : getParameterByName("player");
if (document.body) {
    document.body.classList.toggle("equipo-azul", Number(player) !== 2);
    document.body.classList.toggle("equipo-rojo", Number(player) === 2);
}
registrarNombreEscritxrPorEquipo(
    player,
    (asignacion_musa_guardada && asignacion_musa_guardada.assignment.writer)
        || getParameterByName("escritxr")
        || ""
);

function guardarAsignacionMusaSesion(asignacion) {
    if (!asignacion || asignacion.ok !== true) return;
    try {
        window.sessionStorage.setItem(CLAVE_ASIGNACION_MUSA, JSON.stringify({
            ...asignacion,
            clientId: musa_client_id,
            name: nombre_musa,
            revealedAt: Date.now()
        }));
    } catch (_error) {}
}

function obtenerAsignacionMusaSesion() {
    if (!asignacion_musa_guardada) return null;
    return {
        ...asignacion_musa_guardada.assignment,
        clientId: asignacion_musa_guardada.clientId,
        name: asignacion_musa_guardada.name
    };
}

const asignacion_musa_inicial = obtenerAsignacionMusaSesion();
const modo_asignacion_musa = window.ScribMusaAssignment.normalizeAssignmentMode(
    (asignacion_musa_inicial && asignacion_musa_inicial.assignmentMode)
    || getParameterByName("modo_asignacion")
);
window.modo_asignacion_musa = modo_asignacion_musa;

function construirUrlMusaAsignada(asignacion) {
    if (!window.ScribMusaAssignment) return "";
    return window.ScribMusaAssignment.buildGameUrl(
        "./index.html",
        asignacion,
        nombre_musa
    );
}

function canonicalizarUrlAsignacionMusa(asignacion = asignacion_musa_inicial) {
    if (!asignacion || !window.history || typeof window.history.replaceState !== "function") return;
    const destino = construirUrlMusaAsignada(asignacion);
    if (!destino) return;
    const actual = new URL(window.location.href);
    const canonica = new URL(destino, actual);
    if (actual.pathname === canonica.pathname && actual.search === canonica.search) return;
    window.history.replaceState(null, "", `${canonica.pathname}${canonica.search}${canonica.hash}`);
}

canonicalizarUrlAsignacionMusa();

function aplicarAsignacionAutoritativaMusa(payload) {
    const assignmentApi = window.ScribMusaAssignment;
    if (!assignmentApi || !assignmentApi.assignmentBelongsToClient(payload, musa_client_id)) return false;
    const asignacion = assignmentApi.normalizeAssignment(payload);
    if (!asignacion || asignacion.ok !== true) return false;
    guardarAsignacionMusaSesion(asignacion);

    player = String(asignacion.player);
    if (document.body) {
        document.body.classList.toggle("equipo-azul", Number(player) !== 2);
        document.body.classList.toggle("equipo-rojo", Number(player) === 2);
    }
    registrarNombreEscritxrPorEquipo(asignacion.player, asignacion.writer);
    if (nombre1) nombre1.value = asignacion.writer;
    canonicalizarUrlAsignacionMusa(asignacion);
    return true;
}

window.aplicarAsignacionAutoritativaMusa = aplicarAsignacionAutoritativaMusa;

function obtenerNombreEscritxrEntradaMusa() {
    const equipo = normalizarEquipoVotacion(player) || 1;
    const nombreAsignado = asignacion_musa_inicial && asignacion_musa_inicial.writer;
    if (nombreAsignado) {
        return normalizarNombreEscritxrUi(nombreAsignado, `ESCRITXR ${equipo}`);
    }
    const nombreQuery = typeof getParameterByName("escritxr") === "string"
        ? getParameterByName("escritxr").trim()
        : "";
    if (nombreQuery) {
        return normalizarNombreEscritxrUi(nombreQuery, `ESCRITXR ${equipo}`);
    }
    const nombreGuardado = nombres_escritxr_por_equipo[equipo];
    if (nombreGuardado) {
        return normalizarNombreEscritxrUi(nombreGuardado, `ESCRITXR ${equipo}`);
    }
    const nombreVisible = nombre1 && typeof nombre1.value === "string" ? nombre1.value : "";
    return normalizarNombreEscritxrUi(nombreVisible, `ESCRITXR ${equipo}`);
}

function construirNombreMusaEntradaHtml() {
    return `<span class="musa-world-entry__name musa-world-entry__name--musa">${escapeHtml(window.nombre_musa || "MUSA")}</span>`;
}

function construirNombreEscritxrEntradaHtml() {
    const nombre = obtenerNombreEscritxrEntradaMusa();
    const claseEquipo = Number(player) === 2
        ? "musa-world-entry__name--rojo"
        : "musa-world-entry__name--azul";
    return `<span class="musa-world-entry__name ${claseEquipo}">${escapeHtml(nombre)}</span>`;
}

function obtenerEstadosEntradaMusa() {
    return [
        tJuego2P("world.status.linking", {}, "🔗 ENLAZANDO CANAL DE INSPIRACION"),
        tJuego2P("world.status.sync", {}, "⚙️ SINCRONIA DE SISTEMA ESTABLE"),
        tJuego2P("world.status.compiling", {}, "🧩 COMPILANDO EL NUEVO MUNDO"),
        tJuego2P("world.status.color", {}, "🎨 VOLCANDO COLOR Y ATMOSFERA"),
        tJuego2P("world.status.authorized", {}, "✅ ACCESO AUTORIZADO")
    ];
}

function construirLogsEntradaMusa() {
    const teamLabel = Number(player) === 2
        ? tJuego2P("world.team.red", {}, "ROJO")
        : tJuego2P("world.team.blue", {}, "AZUL");
    return [
        tJuego2P("world.log.link_muse", { muse: construirNombreMusaEntradaHtml() }, `🔗 ENLAZANDO A ${construirNombreMusaEntradaHtml()}`),
        tJuego2P("world.log.sync_pen", { team: teamLabel }, `🖋️ SINCRONIZANDO PLUMA ${teamLabel}`),
        tJuego2P("world.log.load_imagery", { writer: construirNombreEscritxrEntradaHtml() }, `📖 CARGANDO IMAGINARIO DE ${construirNombreEscritxrEntradaHtml()}`),
        tJuego2P("world.log.paint_world", {}, "🎨 PINTANDO EL COLOR DEL MUNDO"),
        tJuego2P("world.log.portal", {}, "🌀 ABRIENDO PORTAL DE INSPIRACION")
    ];
}

function renderizarLogsEntradaMusa(logs, indiceActivo) {
    const lista = getEl("musa_world_entry_logs");
    if (!lista) return;
    const items = Array.from(lista.querySelectorAll("li"));
    items.forEach((item, indice) => {
        item.innerHTML = logs[indice] || "";
        item.classList.toggle("is-active", indice === indiceActivo);
        item.classList.toggle("is-done", indice < indiceActivo);
    });
    musa_world_entry_indice_log = indiceActivo;
}

function actualizarContenidoEntradaMusa() {
    const copy = getEl("musa_world_entry_copy");
    if (copy) {
        copy.innerHTML = tJuego2P(
            "world.copy",
            { muse: construirNombreMusaEntradaHtml(), writer: construirNombreEscritxrEntradaHtml() },
            `${construirNombreMusaEntradaHtml()} ha elegido apoyar a ${construirNombreEscritxrEntradaHtml()}. Preparando la entrada al mundo de juego.`
        );
    }
    renderizarLogsEntradaMusa(construirLogsEntradaMusa(), musa_world_entry_indice_log);
}

function invalidarEntradaMundoMusa() {
    revision_world_entry_musa += 1;
    musa_world_entry_activa = false;
    musa_world_entry_indice_log = 0;
    if (musa_world_entry_frame) {
        cancelAnimationFrame(musa_world_entry_frame);
        musa_world_entry_frame = null;
    }
    if (musa_world_entry_release_timeout) {
        clearTimeout(musa_world_entry_release_timeout);
        musa_world_entry_release_timeout = null;
    }
    if (musa_world_entry_hide_timeout) {
        clearTimeout(musa_world_entry_hide_timeout);
        musa_world_entry_hide_timeout = null;
    }
    const overlay = getEl("musa_world_entry");
    if (overlay) {
        overlay.classList.remove(
            "is-visible",
            "musa-world-entry--azul",
            "musa-world-entry--rojo",
            "musa-world-entry--blackout",
            "musa-world-entry--reveal-game"
        );
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.setProperty("--world-entry-progress", "0%");
        overlay.style.setProperty("--world-entry-world-progress", "0%");
    }
    const percent = getEl("musa_world_entry_percent");
    if (percent) {
        percent.textContent = "0%";
    }
    const status = getEl("musa_world_entry_status");
    if (status) {
        const estados = obtenerEstadosEntradaMusa();
        status.textContent = estados[0] || "";
    }
    document.querySelectorAll("#musa_world_entry_pixels span").forEach((pixel) => {
        pixel.classList.remove("is-on");
    });
    if (document.body) {
        document.body.classList.remove("musa-world-entry-activa", "musa-world-entry-salida");
    }
    return revision_world_entry_musa;
}

function esRevisionEntradaMundoMusaActiva(revision) {
    return revision === revision_world_entry_musa;
}

function reproducirEntradaMundoMusa() {
    const overlay = getEl("musa_world_entry");
    if (!overlay) return;
    const status = getEl("musa_world_entry_status");
    const percent = getEl("musa_world_entry_percent");
    const pixelNodes = Array.from(document.querySelectorAll("#musa_world_entry_pixels span"));
    const estados = obtenerEstadosEntradaMusa();
    const umbrales = [0.12, 0.34, 0.56, 0.79, 0.96];
    const revisionEntrada = invalidarEntradaMundoMusa();

    musa_world_entry_activa = true;
    musa_world_entry_indice_log = 0;

    overlay.classList.remove("musa-world-entry--azul", "musa-world-entry--rojo");
    overlay.classList.add(player == 2 ? "musa-world-entry--rojo" : "musa-world-entry--azul", "is-visible");
    overlay.setAttribute("aria-hidden", "false");
    overlay.style.setProperty("--world-entry-progress", "0%");
    overlay.style.setProperty("--world-entry-world-progress", "0%");
    pixelNodes.forEach((pixel) => pixel.classList.remove("is-on"));
    actualizarContenidoEntradaMusa();
    if (document.body) {
        document.body.classList.add("musa-world-entry-activa");
        document.body.classList.remove("musa-world-entry-salida");
    }

    const inicio = performance.now();
    const paso = (ahora) => {
        if (!esRevisionEntradaMundoMusaActiva(revisionEntrada)) {
            return;
        }
        const progreso = Math.min((ahora - inicio) / MUSA_WORLD_ENTRY_DURACION_MS, 1);
        const easing = 1 - Math.pow(1 - progreso, 3);
        const pct = Math.round(easing * 100);
        let idxActivo = umbrales.findIndex((umbral) => progreso <= umbral);
        if (idxActivo === -1) idxActivo = estados.length - 1;

        musa_world_entry_indice_log = idxActivo;
        overlay.style.setProperty("--world-entry-progress", `${pct}%`);
        overlay.style.setProperty("--world-entry-world-progress", `${Math.max(12, Math.round(easing * 100))}%`);
        if (percent) percent.textContent = `${pct}%`;
        if (status) status.textContent = estados[idxActivo] || estados[estados.length - 1];
        renderizarLogsEntradaMusa(construirLogsEntradaMusa(), idxActivo);

        const pixelsActivos = Math.round((pixelNodes.length || 0) * easing);
        pixelNodes.forEach((pixel, indice) => {
            pixel.classList.toggle("is-on", indice < pixelsActivos);
        });

        if (progreso < 1) {
            musa_world_entry_frame = requestAnimationFrame(paso);
            return;
        }

        musa_world_entry_frame = null;
        musa_world_entry_indice_log = estados.length;
        renderizarLogsEntradaMusa(construirLogsEntradaMusa(), estados.length);
        if (status) status.textContent = tJuego2P("world.status.loaded", {}, "🏁 MUNDO CARGADO");
        if (percent) percent.textContent = "100%";

        musa_world_entry_release_timeout = setTimeout(() => {
            if (!esRevisionEntradaMundoMusaActiva(revisionEntrada)) {
                return;
            }
            musa_world_entry_release_timeout = null;
            overlay.classList.add("musa-world-entry--blackout");
            musa_world_entry_hide_timeout = setTimeout(() => {
                if (!esRevisionEntradaMundoMusaActiva(revisionEntrada)) {
                    return;
                }
                musa_world_entry_hide_timeout = null;
                if (document.body) {
                    document.body.classList.add("musa-world-entry-salida");
                    document.body.classList.remove("musa-world-entry-activa");
                }
                overlay.classList.add("musa-world-entry--reveal-game");
                musa_world_entry_hide_timeout = setTimeout(() => {
                    if (!esRevisionEntradaMundoMusaActiva(revisionEntrada)) {
                        return;
                    }
                    musa_world_entry_hide_timeout = null;
                    musa_world_entry_activa = false;
                    overlay.classList.remove(
                        "is-visible",
                        "musa-world-entry--azul",
                        "musa-world-entry--rojo",
                        "musa-world-entry--blackout",
                        "musa-world-entry--reveal-game"
                    );
                    overlay.setAttribute("aria-hidden", "true");
                    if (document.body) {
                        document.body.classList.remove("musa-world-entry-salida");
                    }
                }, MUSA_WORLD_ENTRY_FADE_MS);
            }, MUSA_WORLD_ENTRY_BLACK_HOLD_MS);
        }, MUSA_WORLD_ENTRY_RELEASE_MS);
    };

    musa_world_entry_frame = requestAnimationFrame(paso);
}

const pre_show_musa = getEl("pre_show_musa");
const pre_show_musa_form = getEl("pre_show_musa_form");
const pre_show_musa_input = getEl("pre_show_musa_input");
const pre_show_musa_enviar = getEl("pre_show_musa_enviar");
const pre_show_musa_contador = getEl("pre_show_musa_contador");
const pre_show_musa_feedback = getEl("pre_show_musa_feedback");
let pre_show_estado_musa = window.ScribPreShow.normalizarEstado({ activo: false });
let pre_show_bloqueado_por_tutorial_musa = false;
let vista_tutorial_musa_permitida = true;
let pre_show_envio_pendiente_musa = null;
let pre_show_envio_revision_musa = 0;
let pre_show_cooldown_musa = false;
let pre_show_cooldown_timer_musa = null;
let pre_show_timeout_ack_musa = null;
let pre_show_ime_activo_musa = false;

function traducirErrorPreShowMusa(respuesta = {}) {
    const code = String(respuesta.code || respuesta.codigo || "").trim().toUpperCase();
    if (code === "INVALID_TEXT") {
        return tJuego2P("preshow.muse.feedback.empty", {}, "Escribe un mensaje antes de enviarlo.");
    }
    if (code === "TEXT_TOO_LONG") {
        return tJuego2P(
            "preshow.muse.feedback.too_long",
            { max: pre_show_estado_musa.limite_texto },
            `El mensaje no puede superar ${pre_show_estado_musa.limite_texto} caracteres.`
        );
    }
    if (code === "OFFENSIVE_TEXT") {
        return tJuego2P("preshow.muse.feedback.offensive", {}, "Ese mensaje contiene lenguaje no permitido.");
    }
    if (code === "RATE_LIMITED" || code === "DUPLICATE_MESSAGE") {
        return tJuego2P("preshow.muse.feedback.rate_limited", {}, "Espera un momento antes de volver a enviar.");
    }
    if (code === "NOT_ACTIVE") {
        return tJuego2P("preshow.muse.feedback.closed", {}, "El canal ya se ha cerrado: empieza el tutorial.");
    }
    return tJuego2P("preshow.muse.feedback.error", {}, "No se pudo enviar. Intentalo de nuevo.");
}

function mostrarFeedbackPreShowMusa(mensaje = "", esError = false) {
    if (!pre_show_musa_feedback) return;
    pre_show_musa_feedback.textContent = String(mensaje || "");
    pre_show_musa_feedback.classList.toggle("is-error", Boolean(esError));
}

function actualizarContadorPreShowMusa() {
    if (!pre_show_musa_input || !pre_show_musa_contador) return;
    const limite = pre_show_estado_musa.limite_texto || window.ScribPreShow.MAX_TEXTO;
    const longitud = Array.from(pre_show_musa_input.value || "").length;
    pre_show_musa_contador.textContent = `${longitud} / ${limite}`;
    pre_show_musa_contador.classList.toggle("is-near-limit", longitud >= Math.floor(limite * 0.85));
    pre_show_musa_contador.classList.toggle("is-over-limit", longitud > limite);
}

function tieneSesionPreShowMusaSincronizada() {
    return window.ScribPreShow.tieneSesionSincronizada(pre_show_estado_musa);
}

function preShowMusaVisible() {
    return Boolean(
        pre_show_estado_musa.activo
        && !pre_show_bloqueado_por_tutorial_musa
        && vista_tutorial_musa_permitida
        && !calentamiento_vista
        && !ui_partida_activa_musa
        && !ui_partida_finalizada_musa
        && !secuencia_inicio_musa_activa
    );
}

function refrescarControlesPreShowMusa() {
    const visible = preShowMusaVisible();
    const pendiente = Boolean(pre_show_envio_pendiente_musa);
    const textoActual = pre_show_musa_input ? String(pre_show_musa_input.value || "") : "";
    const limite = pre_show_estado_musa.limite_texto || window.ScribPreShow.MAX_TEXTO;
    const textoValido = Boolean(textoActual.trim()) && Array.from(textoActual).length <= limite;
    const sesionLista = tieneSesionPreShowMusaSincronizada();
    if (pre_show_musa_input) {
        pre_show_musa_input.disabled = !visible || pendiente || !sesionLista;
    }
    if (pre_show_musa_enviar) {
        pre_show_musa_enviar.disabled = !visible || pendiente || pre_show_cooldown_musa || !textoValido || !sesionLista;
    }
    actualizarContadorPreShowMusa();
}

function cancelarEnvioPreShowMusa() {
    pre_show_envio_revision_musa += 1;
    pre_show_envio_pendiente_musa = null;
    if (pre_show_timeout_ack_musa) {
        clearTimeout(pre_show_timeout_ack_musa);
        pre_show_timeout_ack_musa = null;
    }
}

function limpiarCooldownPreShowMusa() {
    if (pre_show_cooldown_timer_musa) {
        clearTimeout(pre_show_cooldown_timer_musa);
        pre_show_cooldown_timer_musa = null;
    }
    pre_show_cooldown_musa = false;
}

function iniciarCooldownPreShowMusa(duracionMs = pre_show_estado_musa.cooldown_ms) {
    limpiarCooldownPreShowMusa();
    pre_show_cooldown_musa = true;
    refrescarControlesPreShowMusa();
    const revision = pre_show_envio_revision_musa;
    pre_show_cooldown_timer_musa = setTimeout(() => {
        if (revision !== pre_show_envio_revision_musa) return;
        pre_show_cooldown_timer_musa = null;
        pre_show_cooldown_musa = false;
        refrescarControlesPreShowMusa();
    }, Math.max(500, Number(duracionMs) || pre_show_estado_musa.cooldown_ms));
}

function aplicarVisibilidadPreShowMusa() {
    const visible = preShowMusaVisible();
    if (visible) {
        animarTransicionVistaMusa("tutorial");
    } else if (!calentamiento_vista && !ui_partida_activa_musa && !ui_partida_finalizada_musa) {
        animarTransicionVistaMusa("espera");
    }
    if (document.body) {
        document.body.classList.toggle("pre-show-musa-activo", visible);
    }
    if (pre_show_musa) {
        pre_show_musa.hidden = !visible;
        pre_show_musa.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    if (!visible) {
        cancelarEnvioPreShowMusa();
        limpiarCooldownPreShowMusa();
        if (pre_show_musa_input) {
            pre_show_musa_input.value = "";
            pre_show_musa_input.blur();
        }
        mostrarFeedbackPreShowMusa("");
    }
    refrescarControlesPreShowMusa();
}

function actualizarModoVistaMusaRemoto(payload = {}) {
    if (!musa_registro_confirmado) return false;
    const modo = typeof payload.modo === "string" ? payload.modo.trim().toLowerCase() : "";
    vista_modo_remota_musa = modo || "tutorial";
    vista_tutorial_musa_permitida = modo === "tutorial";
    if (vista_tutorial_musa_permitida) {
        pre_show_bloqueado_por_tutorial_musa = false;
    }
    aplicarVisibilidadPreShowMusa();
    sincronizarVisibilidadCreditosMusa();
    sincronizarVistaDeliberacionMusa();
    return true;
}

function restaurarVistaMusaTrasVideoTutorial() {
    if (vista_tutorial_musa_permitida) {
        pre_show_bloqueado_por_tutorial_musa = false;
    }
    refrescarClasesUiPartidaMusa();
    aplicarVisibilidadPreShowMusa();
    if (socket.connected) {
        socket.emit("pedir_vista_espectador_modo");
        socket.emit("pedir_pre_show_estado");
    }
}

document.addEventListener("scrib:video-tutorial-visibility", (event) => {
    if (event && event.detail && event.detail.visible) return;
    restaurarVistaMusaTrasVideoTutorial();
});

function actualizarEstadoPreShowMusa(payload = {}) {
    const siguiente = window.ScribPreShow.normalizarEstado(payload);
    const nuevaSesion = Boolean(
        siguiente.session_id
        && siguiente.session_id !== pre_show_estado_musa.session_id
    );
    const cambioFase = siguiente.session_id !== pre_show_estado_musa.session_id
        || siguiente.phase_seq !== pre_show_estado_musa.phase_seq;
    if (cambioFase) {
        cancelarEnvioPreShowMusa();
        limpiarCooldownPreShowMusa();
    }
    if (nuevaSesion && siguiente.activo && window.ScribPreShow.tieneSesionSincronizada(siguiente)) {
        pre_show_bloqueado_por_tutorial_musa = false;
        calentamiento_activo = false;
        calentamiento_vista = false;
        terminado = false;
        setUiPartidaActivaMusa(false);
        setUiPartidaFinalizadaMusa(false);
        if (document.body) document.body.classList.remove("vista-calentamiento-musa");
        if (calentamiento_section) calentamiento_section.classList.remove("activo");
    }
    pre_show_estado_musa = siguiente;
    aplicarVisibilidadPreShowMusa();
    return siguiente;
}

function cerrarPreShowMusaPorTutorial() {
    pre_show_bloqueado_por_tutorial_musa = true;
    pre_show_estado_musa = window.ScribPreShow.normalizarEstado({
        activo: false,
        session_id: pre_show_estado_musa.session_id,
        phase_seq: pre_show_estado_musa.phase_seq,
        limite_texto: pre_show_estado_musa.limite_texto,
        cooldown_ms: pre_show_estado_musa.cooldown_ms
    });
    aplicarVisibilidadPreShowMusa();
}

function suspenderPreShowMusaPorConexion() {
    cancelarEnvioPreShowMusa();
    limpiarCooldownPreShowMusa();
    if (document.body) document.body.classList.remove("pre-show-musa-activo");
    if (pre_show_musa) {
        pre_show_musa.hidden = true;
        pre_show_musa.setAttribute("aria-hidden", "true");
    }
    if (pre_show_musa_input) {
        pre_show_musa_input.disabled = true;
        pre_show_musa_input.blur();
    }
}

function enviarMensajePreShowMusa() {
    if (!preShowMusaVisible() || pre_show_envio_pendiente_musa || pre_show_cooldown_musa) return false;
    if (!tieneSesionPreShowMusaSincronizada()) {
        socket.emit("pedir_pre_show_estado");
        mostrarFeedbackPreShowMusa(tJuego2P("preshow.muse.feedback.error", {}, "No se pudo enviar. Intentalo de nuevo."), true);
        refrescarControlesPreShowMusa();
        return false;
    }
    const validacion = window.ScribPreShow.validarTexto(
        pre_show_musa_input ? pre_show_musa_input.value : "",
        pre_show_estado_musa.limite_texto
    );
    if (!validacion.ok) {
        mostrarFeedbackPreShowMusa(traducirErrorPreShowMusa(validacion), true);
        return false;
    }

    const requestId = window.ScribPreShow.crearRequestId();
    const revision = ++pre_show_envio_revision_musa;
    const contexto = Object.freeze({
        requestId,
        revision,
        sessionId: pre_show_estado_musa.session_id,
        phaseSeq: pre_show_estado_musa.phase_seq,
        texto: validacion.texto
    });
    pre_show_envio_pendiente_musa = contexto;
    mostrarFeedbackPreShowMusa("");
    refrescarControlesPreShowMusa();

    let procesado = false;
    const procesarRespuesta = (respuesta = {}) => {
        if (procesado) return;
        procesado = true;
        const pendienteActual = pre_show_envio_pendiente_musa;
        if (
            !pendienteActual
            || pendienteActual.requestId !== contexto.requestId
            || contexto.revision !== pre_show_envio_revision_musa
            || contexto.sessionId !== pre_show_estado_musa.session_id
            || contexto.phaseSeq !== pre_show_estado_musa.phase_seq
        ) return;
        if (pre_show_timeout_ack_musa) {
            clearTimeout(pre_show_timeout_ack_musa);
            pre_show_timeout_ack_musa = null;
        }
        pre_show_envio_pendiente_musa = null;
        if (respuesta && respuesta.ok === true) {
            if (
                String(respuesta.session_id || "") !== contexto.sessionId
                || Number(respuesta.phase_seq) !== contexto.phaseSeq
            ) {
                socket.emit("pedir_pre_show_estado");
                mostrarFeedbackPreShowMusa(
                    tJuego2P("preshow.muse.feedback.error", {}, "No se pudo enviar. Intentalo de nuevo."),
                    true
                );
                refrescarControlesPreShowMusa();
                return;
            }
            if (pre_show_musa_input) pre_show_musa_input.value = "";
            mostrarFeedbackPreShowMusa(
                tJuego2P("preshow.muse.feedback.sent", {}, "Mensaje enviado al espectador."),
                false
            );
            iniciarCooldownPreShowMusa(pre_show_estado_musa.cooldown_ms);
            return;
        }
        const code = String(respuesta && (respuesta.code || respuesta.codigo) || "").toUpperCase();
        if (code === "NOT_ACTIVE") {
            cerrarPreShowMusaPorTutorial();
            return;
        }
        if (code === "STALE_PHASE" || code === "STALE_SESSION") {
            socket.emit("pedir_pre_show_estado");
        }
        if (code === "RATE_LIMITED" || code === "DUPLICATE_MESSAGE") {
            iniciarCooldownPreShowMusa(respuesta.retry_after_ms || pre_show_estado_musa.cooldown_ms);
        }
        mostrarFeedbackPreShowMusa(traducirErrorPreShowMusa(respuesta), true);
        refrescarControlesPreShowMusa();
    };

    pre_show_timeout_ack_musa = setTimeout(() => {
        pre_show_timeout_ack_musa = null;
        procesarRespuesta({ ok: false, code: "TIMEOUT" });
    }, 6000);
    socket.emit("pre_show_musa_enviar", {
        texto: contexto.texto,
        client_id: musa_client_id,
        request_id: contexto.requestId,
        session_id: contexto.sessionId,
        phase_seq: contexto.phaseSeq
    }, procesarRespuesta);
    return true;
}

if (pre_show_musa_form) {
    pre_show_musa_form.addEventListener("submit", (evt) => {
        evt.preventDefault();
        enviarMensajePreShowMusa();
    });
}

if (pre_show_musa_input) {
    pre_show_musa_input.addEventListener("input", () => {
        mostrarFeedbackPreShowMusa("");
        refrescarControlesPreShowMusa();
    });
    pre_show_musa_input.addEventListener("compositionstart", () => {
        pre_show_ime_activo_musa = true;
    });
    pre_show_musa_input.addEventListener("compositionend", () => {
        pre_show_ime_activo_musa = false;
    });
    pre_show_musa_input.addEventListener("keydown", (evt) => {
        if (
            evt.key !== "Enter"
            || evt.shiftKey
            || evt.altKey
            || evt.ctrlKey
            || evt.metaKey
            || evt.isComposing
            || pre_show_ime_activo_musa
            || evt.keyCode === 229
        ) return;
        evt.preventDefault();
        if (pre_show_musa_form && typeof pre_show_musa_form.requestSubmit === "function") {
            pre_show_musa_form.requestSubmit();
        } else {
            enviarMensajePreShowMusa();
        }
    });
}

refrescarControlesPreShowMusa();

actualizarTemaCalentamiento(player);
let enviar_ventaja;

    if (player == 1) {
        enviar_putada_de_jx = 'enviar_putada_de_j2';
        feedback_a_j_x = 'feedback_a_j1';
        feedback_de_j_x = 'feedback_de_j1';
        texto_x = 'texto1'
        enviar_postgame_x = 'enviar_postgame1';
        recibir_postgame_x = 'recibir_postgame1';
        nombre = 'nombre1';
        //nombre1.value = "ESCRITXR 1" 
        enviar_ventaja = "enviar_ventaja_j1";
        nombre1.style="color:aqua;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
        metadatos.style = "color:red; text-shadow: 0.0625em 0.0625em aqua;";
        document.documentElement.style.setProperty("--equipo-color", "aqua");

    } else if (player == 2) {
        console.log(nombre1.value)
        enviar_putada_de_jx = 'enviar_putada_de_j1';
        feedback_a_j_x = 'feedback_a_j2';
        feedback_de_j_x = 'feedback_de_j2';
        texto_x = 'texto2'
        enviar_postgame_x = 'enviar_postgame2';
        recibir_postgame_x = 'recibir_postgame2';
        nombre = 'nombre2';
        //nombre1.value="ESCRITXR 2";
        enviar_ventaja = "enviar_ventaja_j2";
        nombre1.style="color:red;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;";
        metadatos.style = "color:aqua; text-shadow: 0.0625em 0.0625em red;";
        document.documentElement.style.setProperty("--equipo-color", "red");
    }

aplicarColorTemporizadorVotacionVentaja(player);
const asignacionMusaYaRevelada = getParameterByName("assigned") === "1";
if (!asignacionMusaYaRevelada) {
    reproducirEntradaMundoMusa();
} else {
    invalidarEntradaMundoMusa();
}

// Se restaura DESPUÉS de inicializar `player` y de aplicar el estilo del equipo.
// Si se hace antes (como ocurría), `obtenerEstiloMusa()` cae en el fallback naranja
// al recargar la página porque `player` todavía está indefinido y el estilo aún no existe.
restaurarTemporizadorLecturaPersistente();

configurarColorRegalo();
actualizarNombreRegalo();
intentarMostrarRegaloPdfPendiente();
