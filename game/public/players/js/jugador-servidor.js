// Se establece la conexiÃ³n con el servidor segÃºn si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);
const getEl = id => document.getElementById(id); // Obtiene los elementos con id.
const escapeHtml = (valor) => String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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

function refrescarClasesUiPartidaMusa() {
    if (!document.body) return;
    document.body.classList.toggle("partida-activa", ui_partida_activa_musa);
    document.body.classList.toggle("partida-finalizada-musa", ui_partida_finalizada_musa);
}

function setUiPartidaActivaMusa(activa) {
    ui_partida_activa_musa = Boolean(activa);
    if (ui_partida_activa_musa) {
        ui_partida_finalizada_musa = false;
    }
    refrescarClasesUiPartidaMusa();
}

function setUiPartidaFinalizadaMusa(finalizada) {
    ui_partida_finalizada_musa = Boolean(finalizada);
    if (ui_partida_finalizada_musa) {
        ui_partida_activa_musa = false;
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
    const animarEntrada = Boolean(opciones && opciones.animarEntrada);
    const total = extraerSegundosTiempo(texto);
    if (total === null) {
        cancelarAnimacionEntradaBarraVida(elemento);
        elemento.style.setProperty("--vida-pct", "0%");
        elemento.style.setProperty("--vida-color", "#d94b4b");
        elemento.style.display = "none";
        return;
    }
    const limitado = Math.min(Math.max(total, 0), VIDA_MAX_SEGUNDOS);
    const porcentaje = (limitado / VIDA_MAX_SEGUNDOS) * 100;
    elemento.style.display = DISPLAY_BARRA_VIDA;
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
let votacion_ventaja_duracion_ms = 0;
let votacion_ventaja_fin_ts = 0;
let votacion_ventaja_timer_interval = null;
var intervalID = -1;
let timer = null;
let preparados_timer = null;
let sub_timer = null;
let listener_cuenta_atras = null;
let fallback_cuenta_atras_timer = null;

function limpiarCountdownInicioMusa(removerNodo = true) {
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);
    clearTimeout(sub_timer);
    clearTimeout(preparados_timer);
    clearTimeout(fallback_cuenta_atras_timer);
    timer = null;
    sub_timer = null;
    preparados_timer = null;
    listener_cuenta_atras = null;
    fallback_cuenta_atras_timer = null;
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
        document.getElementById("countdown")
    );
}
let LIMITE_TIEMPO_INSPIRACION = 30;
const EMOJI_TORTUGA = "\uD83D\uDC22";
const EMOJI_RAYO = "\u26A1";
const EMOJI_ESPEJO = "\uD83D\uDE43";
const EMOJI_BRUMA = "\uD83C\uDF2A\uFE0F";
const EMOJI_BLOQUEO = "\uD83D\uDD8A\uFE0F";
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
let toast_inspiracion_musa = null;

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
    toast.classList.remove("musa-inspiracion-toast--propia", "musa-inspiracion-toast--ajena");
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
const VENTAJAS_PUTADAS = [
    { emoji: EMOJI_TORTUGA, descripcion: `${EMOJI_TORTUGA} El teclado del contrincante ira mas lento.` },
    { emoji: EMOJI_RAYO, descripcion: `${EMOJI_RAYO} El videojuego borrara mas rapido el texto del contrincante.` },
    { emoji: EMOJI_ESPEJO, descripcion: `${EMOJI_ESPEJO} El texto se volvera un espejo para el contrincante.` },
    { emoji: EMOJI_BRUMA, descripcion: `${EMOJI_BRUMA} Una pesada bruma caera sobre el texto del contrincante.` },
    { emoji: EMOJI_BLOQUEO, descripcion: `${EMOJI_BLOQUEO} El contrincante no podra borrar su texto.` }
];
const MAPA_VENTAJAS_PUTADAS = new Map(VENTAJAS_PUTADAS.map(op => [op.emoji, op]));
const COLORES_VOTACION_VENTAJA = ["#46f0ff", "#ff6b6b", "#f7d07e"];
const SEGMENTOS_PIE_VOTACION = new WeakMap();

function normalizarEquipoVotacion(valor) {
    if (valor === 1 || valor === "1" || valor === "j1") return 1;
    if (valor === 2 || valor === "2" || valor === "j2") return 2;
    return null;
}

function obtenerOpcionesVentaja(opcionesEmojis) {
    const mapa = new Map(VENTAJAS_PUTADAS.map(op => [op.emoji, op]));
    if (!Array.isArray(opcionesEmojis) || opcionesEmojis.length === 0) {
        return [...VENTAJAS_PUTADAS].sort(() => Math.random() - 0.5).slice(0, 3);
    }
    return opcionesEmojis
        .map(emoji => mapa.get(emoji))
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
    if (votacion_ventaja_modal_titulo) {
        votacion_ventaja_modal_titulo.textContent = "GRACIAS POR VOTAR";
    }
    if (recordatorio) {
        recordatorio.innerHTML = `<span style='color: green;'>Gracias por votar ${escapeHtml(voto)}.</span>`;
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

function pintarPieVotacionVentaja(pieEl, totalEl, legendEl, datos) {
    if (!pieEl || !legendEl) return;
    const total = datos.reduce((acc, item) => acc + item.votos, 0);
    let acumulado = 0;
    const segmentos = datos.map((item) => {
        const proporcion = total > 0 ? (item.votos / total) : (1 / datos.length);
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
    pieEl.classList.toggle("sin-votos", total === 0);
    SEGMENTOS_PIE_VOTACION.set(pieEl, segmentos);
    pintarEmojisPieVotacionVentaja(pieEl, datos, total);
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
    if (!emoji || !votacion_ventaja_activa || votacion_ventaja_ya_voto || votacion_ventaja_voto_emitido) {
        return;
    }
    votacion_ventaja_voto_emitido = true;
    if (typeof elegir_ventaja_publico === "function") {
        elegir_ventaja_publico({ value: emoji });
        return;
    }
    socket.emit("enviar_voto_ventaja", emoji);
    window.dispatchEvent(new CustomEvent("musa_voto_ventaja_emitido", { detail: { voto: emoji } }));
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
        const nombreObjetivo = (nombre1 && nombre1.value ? nombre1.value : "ESCRITXR").toUpperCase();
        const claseColor = obtenerClaseColorEscritxr(nombreObjetivo);
        votacion_ventaja_modal_titulo.innerHTML = `ELIGE UNA DESVENTAJA PARA <span class="votacion-ventaja-escritxr ${claseColor}">${escapeHtml(nombreObjetivo)}</span>`;
    }
    if (votacion_ventaja_modal_opciones) {
        votacion_ventaja_modal_opciones.innerHTML = `<p class="votacion-ventaja-modal-ayuda">Toca un quesito del grafico para votar.</p>`;
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

function actualizarPiesVotacionVentaja() {
    const datos = construirDatosVotacionVentaja(votacion_ventaja_opciones, votacion_ventaja_votos);
    if (!datos.length) return;
    pintarPieVotacionVentaja(
        votacion_ventaja_pie_modal,
        votacion_ventaja_total_modal,
        votacion_ventaja_legend_modal,
        datos
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

function mostrarRegaloPdf(payload) {
    if (!payload || !payload.data || !regalo_pdf) {
        return;
    }
    actualizarNombreRegalo();
    regalo_pdf_data = payload.data;
    regalo_pdf_filename = payload.filename || "regalo.pdf";
    regalo_pdf.classList.add("regalo-pdf--visible");
    regalo_pdf.classList.remove("regalo-pdf--claimed");
    regalo_pdf.setAttribute("aria-hidden", "false");
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
        const respuesta = await fetch(regalo_pdf_data);
        const blob = await respuesta.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = regalo_pdf_filename || "regalo.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        if (typeof confetti_musas === "function") {
            confetti_musas();
        }
    } catch (error) {
        console.error("No se pudo descargar el regalo PDF:", error);
    }
    setTimeout(() => {
        ocultarRegaloPdf();
        regalo_btn.disabled = false;
    }, 900);
}

if (regalo_btn) {
    regalo_btn.addEventListener("click", descargarRegaloPdf);
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
            setTimeout(() => {
                if (!teclado_lento_putada) return;
                insertarTextoEnInput(input, data);
            }, RETRASO_TECLADO_LENTO_MS);
        }
    });
    input.addEventListener("paste", (e) => {
        if (!teclado_lento_putada) return;
        const texto = (e.clipboardData || window.clipboardData)?.getData("text");
        if (!texto) return;
        e.preventDefault();
        setTimeout(() => {
            if (!teclado_lento_putada) return;
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
        timeout_teclado_lento = setTimeout(() => {
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
        timeout_rayo_musa = setTimeout(() => {
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
        texto1.classList.remove("textarea-bruma-musa");
        texto1.classList.add("textarea-bruma-musa-salida");
        timeout_bruma_salida_musa = setTimeout(() => {
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
        tempo_text_borroso = setTimeout(() => {
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
        timeout_espejo_musa = setTimeout(() => {
            limpiarEspejoMusa();
        }, duracion);
    }
}

function limpiarEfectosVisualesDesventajaMusa() {
    limpiarRayoMusa();
    limpiarBrumaMusa(false);
    limpiarEspejoMusa();
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
    const p = Number(player);
    if (p === 1) {
        return "color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
    }
    if (p === 2) {
        return "color:red; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;";
    }
    if (nombre1 && nombre1.style && nombre1.style.color) {
        const sombra = nombre1.style.textShadow ? ` text-shadow: ${nombre1.style.textShadow};` : "";
        return `color:${nombre1.style.color};${sombra}`;
    }
    return "color: orange;";
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
    lectura_estado_guardado = null;
    limpiarTemporizadorLecturaPersistente();
    mostrarBarraVida();
}

function cancelarTemporizadorLectura() {
    detenerTemporizadorLectura();
    restaurarEstadoLectura();
    limpiarTemporizadorLecturaPersistente();
    tiempo.innerHTML = "";
    tiempo.style.display = "none";
    ocultarBarraVida();
}

function actualizarTemporizadorLectura() {
    const minutos = Math.floor(temporizador_lectura_restante / 60);
    const segundos = temporizador_lectura_restante % 60;
    const texto = `${paddedFormat(minutos)}:${paddedFormat(segundos)}`;
    tiempo.innerHTML = texto;
}

function iniciarTemporizadorLectura(duracion, finTimestamp) {
    resetearTemporizadorLectura();
    guardarEstadoLectura();
    mostrarMensajeLecturaFinal();
    temporizador_lectura_restante = Math.max(0, Number(duracion) || (10 * 60));
    temporizador_lectura_activo = true;
    tiempo.style.display = "";
    tiempo.style.color = "white";
    ocultarBarraVida();
    const fin = finTimestamp || (Date.now() + (temporizador_lectura_restante * 1000));
    guardarTemporizadorLecturaPersistente(fin);
    actualizarTemporizadorLectura();
    temporizador_lectura_interval = setInterval(() => {
        temporizador_lectura_restante -= 1;
        if (temporizador_lectura_restante < 0) {
            clearInterval(temporizador_lectura_interval);
            temporizador_lectura_interval = null;
            temporizador_lectura_restante = 0;
            actualizarTemporizadorLectura();
            temporizador_lectura_activo = false;
            limpiarTemporizadorLecturaPersistente();
            mostrarMensajeLecturaFinal();
            return;
        }
        actualizarTemporizadorLectura();
    }, 1000);
}

function restaurarTemporizadorLecturaPersistente() {
    const finTimestamp = obtenerTemporizadorLecturaPersistente();
    if (!finTimestamp) return;
    const restante = Math.ceil((finTimestamp - Date.now()) / 1000);
    if (restante > 0) {
        iniciarTemporizadorLectura(restante, finTimestamp);
    } else {
        limpiarTemporizadorLecturaPersistente();
        temporizador_lectura_activo = false;
        ocultarBarraVida();
        mostrarMensajeLecturaFinal();
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
const calentamiento_input = getEl("calentamiento_input");
const calentamiento_enviar = getEl("calentamiento_enviar");
const calentamiento_text_progress = getEl("calentamiento_text_progress");
const calentamiento_bar_progress = getEl("calentamiento_bar_progress");
const calentamiento_estado_cierre = getEl("calentamiento_estado_cierre");
const calentamiento_final_musa = getEl("calentamiento_final_musa");

aplicarTecladoLento(campo_palabra);
aplicarTecladoLento(calentamiento_input);

const calentamiento_feedback = getEl("calentamiento_feedback");
let calentamiento_activo = false;
let calentamiento_vista = false;
let timeout_destello_calentamiento = null;
let timeout_feedback_calentamiento = null;
let calentamiento_cooldown = false;
let calentamiento_interval_cooldown = null;
let calentamiento_solicitud_actual = null;
let calentamiento_bloqueado = false;
let calentamiento_final_actual = null;
let calentamiento_final_id_previo = "";
let timeout_animacion_consigna = null;
const MENSAJES_SOLICITUD_CALENTAMIENTO = {
    libre: {
        estado: "Envia palabras para llenar la pantalla del calentamiento.",
        placeholder: "Escribe una palabra"
    },
    lugares: {
        estado: "Envia lugares o sitios donde la historia naciera.",
        estadoHtml: 'Envia <span class="calentamiento-consigna-lugares">lugares o sitios</span> donde la historia naciera.',
        placeholder: "Ejemplo: playa"
    },
    acciones: {
        estado: "Envia acciones (verbos) con las que historia avanzase.",
        estadoHtml: 'Envia <span class="calentamiento-consigna-acciones">acciones (verbos)</span> con las que la historia avanzase.',
        placeholder: "Ejemplo: correr"
    },
    frase_final: {
        estado: "Envía palabras para construir la frase final.",
        estadoHtml: 'Envia palabras para construir la <span class="calentamiento-consigna-frase-final">frase final</span>.',
        placeholder: "Ejemplo: destino"
    }
};

const normalizarFinalCalentamientoMusa = (entrada) => {
    if (!entrada || typeof entrada !== "object") return null;
    if (typeof entrada.id !== "string" || !entrada.id) return null;
    if (typeof entrada.palabra !== "string" || !entrada.palabra.trim()) return null;
    return {
        id: entrada.id,
        palabra: entrada.palabra.trim(),
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
    document.documentElement.style.setProperty("--musa-progress-color", colorProgreso);
    document.documentElement.style.setProperty("--musa-progress-text-color", colorTextoProgreso);
};

const obtenerColorFeedbackCalentamiento = () => {
    if (!calentamiento_section) return "#9fffa2";
    return calentamiento_section.classList.contains("calentamiento-equipo-2")
        ? "#ffafaf"
        : "#8cefff";
};

const restaurarTextoBotonCalentamiento = () => {
    if (!calentamiento_text_progress) return;
    calentamiento_text_progress.innerHTML = `ENVIAR <span class="btn-emoji" aria-hidden="true">${EMOJI_ROCKET}</span>`;
    calentamiento_text_progress.style.color = "";
};

const onMouseEnterCalentamiento = () => {
    if (!calentamiento_text_progress) return;
    calentamiento_text_progress.style.color = "black";
};

const onMouseLeaveCalentamiento = () => {
    if (!calentamiento_text_progress) return;
    calentamiento_text_progress.style.color = "";
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
    calentamiento_text_progress.textContent = "Enviando...";
    calentamiento_text_progress.style.color = "white";
    calentamiento_text_progress.addEventListener("mouseenter", onMouseEnterCalentamiento);
    calentamiento_text_progress.addEventListener("mouseleave", onMouseLeaveCalentamiento);
    let progress = 0;
    const incrementoPorIntervalo = 100;
    const limiteSegundos = Number(LIMITE_TIEMPO_INSPIRACION) > 0 ? Number(LIMITE_TIEMPO_INSPIRACION) : 30;
    const intervalo = (limiteSegundos * 1000) / incrementoPorIntervalo;
    if (calentamiento_interval_cooldown) {
        clearInterval(calentamiento_interval_cooldown);
    }
    calentamiento_interval_cooldown = setInterval(() => {
        progress += 1;
        calentamiento_bar_progress.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(calentamiento_interval_cooldown);
            calentamiento_interval_cooldown = null;
            setTimeout(() => {
                limpiarCooldownCalentamiento();
            }, 1000);
        }
    }, intervalo);
};

const mostrarFeedbackCalentamiento = (mensaje, esError = false) => {
    if (!calentamiento_feedback) return;
    const texto = typeof mensaje === "string" ? mensaje : "";
    calentamiento_feedback.textContent = texto;
    calentamiento_feedback.style.color = esError ? "#ff6b6b" : obtenerColorFeedbackCalentamiento();
    if (timeout_feedback_calentamiento) {
        clearTimeout(timeout_feedback_calentamiento);
        timeout_feedback_calentamiento = null;
    }
    if (!texto) return;
    timeout_feedback_calentamiento = setTimeout(() => {
        if (!calentamiento_feedback) return;
        calentamiento_feedback.textContent = "";
        timeout_feedback_calentamiento = null;
    }, 2400);
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
    timeout_destello_calentamiento = setTimeout(() => {
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
    timeout_animacion_consigna = setTimeout(() => {
        if (!calentamiento_section) return;
        calentamiento_section.classList.remove("calentamiento-consigna-cambio");
        timeout_animacion_consigna = null;
    }, 760);
};

const actualizarBloqueoCalentamientoMusa = (bloqueado, finalPalabra) => {
    if (calentamiento_section) {
        calentamiento_section.classList.toggle("calentamiento-bloqueado", Boolean(bloqueado));
        calentamiento_section.classList.toggle("calentamiento-final-elegida", Boolean(finalPalabra));
    }
    if (calentamiento_estado_cierre) {
        calentamiento_estado_cierre.textContent = bloqueado
            ? "Consigna cerrada por tu escritxr."
            : "";
    }
    if (calentamiento_text_progress && bloqueado) {
        calentamiento_text_progress.textContent = "CONSIGNA CERRADA";
        calentamiento_text_progress.style.color = "white";
    }
    if (!calentamiento_final_musa) return;
    if (!finalPalabra) {
        calentamiento_final_musa.textContent = "";
        calentamiento_final_musa.classList.remove("activa", "reveal");
        calentamiento_final_id_previo = "";
        return;
    }
    calentamiento_final_musa.textContent = `Palabra elegida: «${finalPalabra.palabra}»`;
    calentamiento_final_musa.classList.add("activa");
    if (calentamiento_final_id_previo !== finalPalabra.id) {
        calentamiento_final_musa.classList.remove("reveal");
        void calentamiento_final_musa.offsetWidth;
        calentamiento_final_musa.classList.add("reveal");
    }
    calentamiento_final_id_previo = finalPalabra.id;
};

const actualizarCalentamiento = (data = {}) => {
    calentamiento_activo = Boolean(data.activo);
    calentamiento_vista = Boolean(data.vista);
    calentamiento_bloqueado = Boolean(data.bloqueado);
    calentamiento_final_actual = normalizarFinalCalentamientoMusa(data.final);
    actualizarTemaCalentamiento(data.equipo || player);
    const solicitud = (typeof data.solicitud === "string" && MENSAJES_SOLICITUD_CALENTAMIENTO[data.solicitud])
        ? data.solicitud
        : "libre";
    const solicitudAnterior = calentamiento_solicitud_actual;
    calentamiento_solicitud_actual = solicitud;
    const cambioConsigna = Boolean(solicitudAnterior && solicitudAnterior !== solicitud);
    const mensajeSolicitud = MENSAJES_SOLICITUD_CALENTAMIENTO[solicitud] || MENSAJES_SOLICITUD_CALENTAMIENTO.libre;
    const visible = calentamiento_activo && calentamiento_vista;

    if (document.body) {
        document.body.classList.toggle("vista-calentamiento-musa", visible);
    }
    if (calentamiento_section) {
        calentamiento_section.classList.toggle("activo", visible);
    }

    if (!visible) {
        if (calentamiento_estado) {
            calentamiento_estado.textContent = calentamiento_activo
                ? "Calentamiento oculto."
                : "Calentamiento inactivo.";
        }
        limpiarCooldownCalentamiento();
        mostrarFeedbackCalentamiento("");
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
    if (calentamiento_input) {
        calentamiento_input.placeholder = mensajeSolicitud.placeholder;
        calentamiento_input.disabled = calentamiento_bloqueado;
    }
    if (calentamiento_enviar) {
        calentamiento_enviar.disabled = calentamiento_bloqueado;
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

const enviarCalentamiento = () => {
    if (!calentamiento_activo || !calentamiento_vista || !calentamiento_input) {
        return;
    }
    if (calentamiento_bloqueado) {
        mostrarFeedbackCalentamiento("La consigna esta cerrada por tu escritxr.", true);
        return;
    }
    if (calentamiento_cooldown) {
        if (calentamiento_text_progress) {
            calentamiento_text_progress.classList.add("disabled-click-feedback");
            setTimeout(() => {
                calentamiento_text_progress.classList.remove("disabled-click-feedback");
            }, 500);
        }
        return;
    }
    const palabra = calentamiento_input.value.trim();
    if (!palabra) {
        mostrarFeedbackCalentamiento("Escribe una palabra.", true);
        return;
    }
    if (/\s/.test(palabra)) {
        mostrarFeedbackCalentamiento("Solo se permite una palabra, sin espacios.", true);
        return;
    }
    if (palabra.length > 24) {
        mostrarFeedbackCalentamiento("Maximo 24 caracteres.", true);
        return;
    }
    socket.emit("calentamiento_intento", { palabra });
    startProgressCalentamiento(calentamiento_enviar);
    calentamiento_input.value = "";
    mostrarFeedbackCalentamiento("Palabra enviada.", false);
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
    if (valor == null) return "0 palabras";
    if (typeof valor === "number") return `${valor} palabras`;
    const texto = String(valor).trim();
    if (/^\d+$/.test(texto)) return `${texto} palabras`;
    if (/^\d+palabras$/i.test(texto)) {
        return texto.replace(/^(\d+)(palabras)$/i, "$1 $2");
    }
    return texto;
}

const MAX_NOMBRE_MUSA = 10;
const REGEX_NOMBRE_MUSA = /^[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F10-9 _.-]+$/;
const REGEX_LETRA_MUSA = /[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1]/;

function normalizarNombreMusa(valor) {
    if (typeof valor !== "string") return "";
    const limpio = valor.trim().slice(0, MAX_NOMBRE_MUSA);
    if (!limpio) return "";
    if (!REGEX_NOMBRE_MUSA.test(limpio)) return "";
    if (!REGEX_LETRA_MUSA.test(limpio)) return "";
    return limpio.toUpperCase();
}

const nombre_musa = normalizarNombreMusa(
    getParameterByName("name") ||
    getParameterByName("nombre") ||
    getParameterByName("musa")
);

if (!nombre_musa) {
    window.location.href = "../index.html?error=nombre_musa";
}

window.nombre_musa = nombre_musa;
if (nombre_musa_label && nombre_musa) {
    nombre_musa_label.textContent = nombre_musa;
}

restaurarTemporizadorLecturaPersistente();

var player = getParameterByName("player");
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
        elegir_ventaja = "elegir_ventaja_j1";
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
        elegir_ventaja = "elegir_ventaja_j2"; 
        enviar_ventaja = "enviar_ventaja_j2";
        nombre1.style="color:red;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;";
        metadatos.style = "color:aqua; text-shadow: 0.0625em 0.0625em red;";
        document.documentElement.style.setProperty("--equipo-color", "red");
    }

aplicarColorTemporizadorVotacionVentaja(player);
configurarColorRegalo();
actualizarNombreRegalo();
if (regalo_pdf_pendiente) {
    mostrarRegaloPdf(regalo_pdf_pendiente);
    regalo_pdf_pendiente = null;
}

socket.on("feedback_musa_inspiracion", (payload = {}) => {
    if (!payload || payload.tipo !== "inspiracion") return;
    activarFulgorBordesMusa();
    mostrarToastInspiracionMusa(payload);
});

// Recibe el nombre del jugador 1 y lo coloca en su sitio.

socket.on('modo_actual', (data) => {
    const siguiente_modo = data.modo_actual;
    console.log("MODO_ACTUAL", siguiente_modo)
    texto1.style.color = "white";
    setNivelesDesactivados(false);
    if (siguiente_modo === "palabras prohibidas") {
        cambiar_jugadores(true);

    } else {
        cambiar_jugadores(false);
    }
    modo_actual = siguiente_modo;
    niveles_bloqueados = false;
    actualizarNiveles(modo_actual);
    if(sincro == 1 || votando == true){

    }
    else{
        enviarPalabra_boton.style.display = "";
        campo_palabra.style.display = "";
    if(modo_actual == "letra bendita"){
        letra_bendita = data.letra_bendita;
        pedir_inspiracion({modo_actual, letra_bendita})
    }
    if(modo_actual == "letra prohibida"){
        letra_prohibida = data.letra_prohibida;
        pedir_inspiracion({modo_actual, letra_prohibida})
    }

    if (
        modo_actual === "palabras bonus" ||
        modo_actual === "tertulia" ||
        modo_actual === "palabras prohibidas" ||
        modo_actual === "frase final"
    ) {
        pedir_inspiracion({ modo_actual });
    }

    sincro = 0;
    }
});

socket.on('dar_nombre', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR";
    console.log("NOMBRE", nombre)
    nombre1.value = nombre;
});

if (enviar_ventaja) {
    socket.on(enviar_ventaja, (ventaja) => {
        if (ventaja === EMOJI_TORTUGA) {
            activarTecladoLentoMusa();
            return;
        }
        if (ventaja === EMOJI_RAYO) {
            activarRayoMusa();
            return;
        }
        if (ventaja === EMOJI_ESPEJO) {
            activarEspejoMusa();
            return;
        }
        if (ventaja === EMOJI_BRUMA) {
            activarBrumaMusa();
        }
    });
}

socket.on('temporizador_gigante_inicio', (data) => {
    iniciarTemporizadorLectura(data && data.duracion);
});

socket.on('temporizador_gigante_detener', () => {
    cancelarTemporizadorLectura();
});

function aplicarEstadoBanderasMusaDesdeServidor(payload = {}) {
    if (typeof aplicarEstadoBanderasControl === 'function') {
        aplicarEstadoBanderasControl(payload);
        return;
    }
    const botonBandera = document.getElementById('btn_bandera');
    if (!botonBandera) return;
    if (payload && payload.activa === false) {
        if (typeof desactivarPantalla === 'function') {
            desactivarPantalla({ forzadoControl: true });
        }
        return;
    }
    if (Number(botonBandera.value) !== 0) return;
    if (typeof bandera === 'function') {
        bandera(botonBandera, { forzadoControl: true });
    }
}

socket.on('estado_banderas_musas', (payload = {}) => {
    aplicarEstadoBanderasMusaDesdeServidor(payload);
});

socket.on('activar_banderas_musas', (payload = {}) => {
    const estadoNormalizado = (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'activa'))
        ? payload
        : { activa: true, bloqueado_por_control: true };
    aplicarEstadoBanderasMusaDesdeServidor(estadoNormalizado);
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    if (!nombre_musa) return;
    socket.emit('registrar_musa', { musa: player, nombre: nombre_musa });
    socket.emit('pedir_estado_banderas_musas');
    socket.emit('pedir_nombre');
    setTimeout(() => {
        socket.emit('pedir_texto');
    }, 80);
});

socket.on('regalo_pdf_musas', (payload) => {
    if (!player) {
        regalo_pdf_pendiente = payload;
        return;
    }
    if (payload && payload.player && Number(payload.player) !== Number(player)) {
        return;
    }
    mostrarRegaloPdf(payload);
});

socket.on('regalo_pdf_musas_reset', () => {
    regalo_pdf_pendiente = null;
    ocultarRegaloPdf();
});

socket.on('calentamiento_estado_musa', (data) => {
    actualizarCalentamiento(data);
});

socket.on('calentamiento_error', (data) => {
    mostrarFeedbackCalentamiento(data && data.mensaje ? data.mensaje : "Error.", true);
});

socket.on('calentamiento_ganado', (data) => {
    const palabra = data && data.palabra ? ` (${data.palabra})` : "";
    mostrarFeedbackCalentamiento(`Palabra destacada${palabra}.`, false);
    dispararDestelloCalentamiento(data && data.equipo);
});

// Variables de los modos.
let modo_actual = "";
let niveles_bloqueados = true;
let listener_modo;
let jugador_psico;
const NIVELES_ORDEN = [
    "letra bendita",
    "letra prohibida",
    "tertulia",
    "palabras bonus",
    "palabras prohibidas",
    "frase final"
];
const nivelesLinea = document.querySelector(".niveles-linea");
const nivelesItems = Array.from(document.querySelectorAll(".nivel-item"));
const nivelesScroll = document.querySelector(".niveles-scroll");
const nivelesPrev = document.querySelector(".niveles-prev");
const nivelesNext = document.querySelector(".niveles-next");
const nivelesContenedor = document.querySelector(".niveles");

function setNivelesDesactivados(estado) {
    if (!nivelesContenedor) return;
    nivelesContenedor.classList.toggle("niveles-desactivados", Boolean(estado));
}

function obtenerIndiceNivelActivo() {
    return nivelesItems.findIndex((item) => item.classList.contains("nivel-activo"));
}

function obtenerCentroItem(item) {
    if (!item || !nivelesLinea) return 0;
    const icono = item.querySelector(".nivel-icono");
    const rectLinea = nivelesLinea.getBoundingClientRect();
    if (icono) {
        const rectIcono = icono.getBoundingClientRect();
        return rectIcono.left - rectLinea.left + rectIcono.width / 2;
    }
    const rectItem = item.getBoundingClientRect();
    return rectItem.left - rectLinea.left + rectItem.width / 2;
}

function obtenerMaxScrollPermitido() {
    if (!nivelesScroll) return 0;
    return Math.max(0, nivelesScroll.scrollWidth - nivelesScroll.clientWidth);
}

function limitarScrollNiveles() {
    if (!nivelesScroll) return;
    const maxScroll = obtenerMaxScrollPermitido();
    if (nivelesScroll.scrollLeft > maxScroll) {
        nivelesScroll.scrollLeft = maxScroll;
    } else if (nivelesScroll.scrollLeft < 0) {
        nivelesScroll.scrollLeft = 0;
    }
}

function asegurarNivelActualVisible() {
    if (!nivelesScroll || !nivelesItems.length) return;
    const indice = obtenerIndiceNivelActivo();
    if (indice < 0) return;
    const item = nivelesItems[indice];
    const rectScroll = nivelesScroll.getBoundingClientRect();
    const rectItem = item.getBoundingClientRect();
    const margen = 8;
    let nuevoScroll = nivelesScroll.scrollLeft;
    if (rectItem.right > rectScroll.right - margen) {
        nuevoScroll += rectItem.right - rectScroll.right + margen;
    } else if (rectItem.left < rectScroll.left + margen) {
        nuevoScroll -= rectScroll.left - rectItem.left + margen;
    }
    const maxScroll = obtenerMaxScrollPermitido();
    nuevoScroll = Math.min(Math.max(0, nuevoScroll), maxScroll);
    if (Math.abs(nuevoScroll - nivelesScroll.scrollLeft) > 1) {
        nivelesScroll.scrollLeft = nuevoScroll;
    }
}

function resetearScrollNiveles() {
    if (!nivelesScroll) return;
    nivelesScroll.scrollTo({ left: 0, behavior: "auto" });
    if (nivelesPrev) {
        nivelesPrev.classList.remove("niveles-flecha--visible");
    }
    if (nivelesNext) {
        nivelesNext.classList.remove("niveles-flecha--visible");
    }
    limitarScrollNiveles();
    requestAnimationFrame(actualizarFlechasNiveles);
    setTimeout(() => {
        if (obtenerIndiceNivelActivo() < 0) {
            nivelesScroll.scrollLeft = 0;
        }
        actualizarFlechasNiveles();
    }, 50);
    setTimeout(() => {
        if (obtenerIndiceNivelActivo() < 0) {
            nivelesScroll.scrollLeft = 0;
        }
        actualizarFlechasNiveles();
    }, 200);
}

function sincronizarVisorNiveles() {
    if (!nivelesScroll || !nivelesItems.length) return;
    recalcularLineaNiveles();
    asegurarNivelActualVisible();
    limitarScrollNiveles();
    actualizarFlechasNiveles();
}

function programarSincronizacionVisorNiveles() {
    sincronizarVisorNiveles();
    requestAnimationFrame(sincronizarVisorNiveles);
    setTimeout(sincronizarVisorNiveles, 90);
    setTimeout(sincronizarVisorNiveles, 220);
    setTimeout(sincronizarVisorNiveles, 520);
}

function recalcularLineaNiveles() {
    if (!nivelesLinea || !nivelesItems.length) return;
    const primero = nivelesItems[0];
    const ultimo = nivelesItems[nivelesItems.length - 1];
    const inicio = obtenerCentroItem(primero);
    const fin = obtenerCentroItem(ultimo);
    const longitud = Math.max(0, fin - inicio);
    nivelesLinea.style.setProperty("--linea-inicio", `${inicio}px`);
    nivelesLinea.style.setProperty("--linea-longitud", `${longitud}px`);

    const icono = primero.querySelector(".nivel-icono");
    if (icono) {
        const rectLinea = nivelesLinea.getBoundingClientRect();
        const rectIcono = icono.getBoundingClientRect();
        const lineaTop = rectIcono.top - rectLinea.top + rectIcono.height / 2;
        nivelesLinea.style.setProperty("--linea-top", `${lineaTop}px`);
        if (nivelesContenedor) {
            const rectCont = nivelesContenedor.getBoundingClientRect();
            const topGlobal = (rectLinea.top - rectCont.top) + lineaTop;
            nivelesContenedor.style.setProperty("--linea-top-global", `${topGlobal}px`);
        }
    }
}

function actualizarColorEquipo() {
    if (!nivelesContenedor) return;
    const colorEquipo = (nombre1 && nombre1.style && nombre1.style.color)
        ? nombre1.style.color
        : (nombre1 ? getComputedStyle(nombre1).color : "");
    const colorFinal = colorEquipo || "#00f5ff";
    nivelesContenedor.style.setProperty("--equipo-color", colorFinal);
    document.documentElement.style.setProperty("--equipo-color", colorFinal);
}

function actualizarFlechasNiveles() {
    if (!nivelesScroll || !nivelesPrev || !nivelesNext) return;
    limitarScrollNiveles();
    const maxScrollTotal = nivelesScroll.scrollWidth - nivelesScroll.clientWidth;
    const maxScroll = Math.min(maxScrollTotal, obtenerMaxScrollPermitido());
    const hayOverflow = maxScrollTotal > 4;
    const scrollActual = Math.max(0, Math.round(nivelesScroll.scrollLeft));
    const margen = 8;
    const limiteDerecho = Math.max(0, Math.round(maxScroll) - margen);
    const puedeIzquierda = hayOverflow && scrollActual > margen;
    const puedeDerecha = hayOverflow && scrollActual < limiteDerecho;
    nivelesPrev.classList.toggle("niveles-flecha--visible", puedeIzquierda);
    nivelesNext.classList.toggle("niveles-flecha--visible", puedeDerecha);
    if (!hayOverflow) {
        nivelesPrev.classList.remove("niveles-flecha--visible");
        nivelesNext.classList.remove("niveles-flecha--visible");
    }
    nivelesPrev.classList.remove("niveles-flecha--disabled");
    nivelesNext.classList.remove("niveles-flecha--disabled");
}

function desplazarNiveles(direccion) {
    if (!nivelesScroll) return;
    const delta = nivelesScroll.clientWidth * 0.6;
    const maxScroll = obtenerMaxScrollPermitido();
    const nuevoScroll = Math.min(Math.max(0, nivelesScroll.scrollLeft + direccion * delta), maxScroll);
    nivelesScroll.scrollTo({ left: nuevoScroll, behavior: "smooth" });
    requestAnimationFrame(actualizarFlechasNiveles);
    setTimeout(actualizarFlechasNiveles, 220);
}

if (nivelesPrev && nivelesNext) {
    nivelesPrev.addEventListener("click", () => desplazarNiveles(-1));
    nivelesNext.addEventListener("click", () => desplazarNiveles(1));
}

if (nivelesScroll) {
    nivelesScroll.addEventListener("scroll", () => {
        limitarScrollNiveles();
        actualizarFlechasNiveles();
    });
}

window.addEventListener("resize", () => {
    programarSincronizacionVisorNiveles();
});
window.addEventListener("load", () => {
    resetearScrollNiveles();
    programarSincronizacionVisorNiveles();
});
window.addEventListener("pageshow", () => {
    resetearScrollNiveles();
    programarSincronizacionVisorNiveles();
});
requestAnimationFrame(() => {
    setNivelesDesactivados(terminado || !modo_actual || niveles_bloqueados);
    resetearScrollNiveles();
    actualizarColorEquipo();
    programarSincronizacionVisorNiveles();
});

function actualizarNiveles(modo) {
    if (!nivelesItems.length) return;
    const indice = NIVELES_ORDEN.indexOf(modo);
    aplicarOrdenCircular(indice);
    if (niveles_bloqueados && indice < 0) {
        nivelesItems.forEach((item) => {
            item.classList.remove("nivel-activo", "nivel-pasado");
            item.classList.add("nivel-futuro");
            item.setAttribute("aria-current", "false");
        });
        actualizarFlechasNiveles();
        actualizarColorEquipo();
        recalcularLineaNiveles();
        return;
    }
    if (indice >= 0) {
        niveles_bloqueados = false;
    }
    const total = nivelesItems.length;
    const mitad = total / 2;
    nivelesItems.forEach((item, idx) => {
        if (indice < 0) {
            item.classList.remove("nivel-activo", "nivel-pasado");
            item.classList.add("nivel-futuro");
            item.setAttribute("aria-current", "false");
            return;
        }
        let delta = idx - indice;
        if (delta > mitad) delta -= total;
        if (delta < -mitad) delta += total;
        item.classList.toggle("nivel-pasado", delta < 0);
        item.classList.toggle("nivel-activo", delta === 0);
        item.classList.toggle("nivel-futuro", delta > 0);
        item.setAttribute("aria-current", delta === 0 ? "step" : "false");
    });
    if (nivelesLinea) {
        const progreso = indice < 0 || nivelesItems.length <= 1
            ? 0
            : (indice / (nivelesItems.length - 1)) * 100;
        nivelesLinea.style.setProperty("--progreso", `${progreso}%`);
        const inicio = obtenerCentroItem(nivelesItems[0]);
        const centroActivo = indice >= 0 ? obtenerCentroItem(nivelesItems[indice]) : inicio;
        const progresoPx = indice < 0 ? 0 : Math.max(0, centroActivo - inicio);
        nivelesLinea.style.setProperty("--progreso-px", `${progresoPx}px`);
    }
    asegurarNivelActualVisible();
    limitarScrollNiveles();
    actualizarFlechasNiveles();
    actualizarColorEquipo();
    recalcularLineaNiveles();
    requestAnimationFrame(actualizarFlechasNiveles);
    setTimeout(actualizarFlechasNiveles, 60);
}

function aplicarOrdenCircular(indiceActivo) {
    if (!nivelesItems.length) return;
    if (indiceActivo < 0) {
        nivelesItems.forEach((item) => {
            item.style.order = "";
        });
        return;
    }
    const total = nivelesItems.length;
    const centro = Math.floor(total / 2);
    nivelesItems.forEach((item, idx) => {
        const distancia = (idx - indiceActivo + total) % total;
        const orden = (distancia + centro) % total;
        item.style.order = orden;
    });
}

// Recibe los datos del jugador 1 y los coloca.
function handler_recibir_texto_x(data) {
if(data.text != null) texto1.innerHTML = data.text;
    if (data.points != null && puntos1) {
        const puntosAnteriores = puntos1.textContent;
        const puntosNuevos = formatearPuntos(data.points);
        puntos1.innerHTML = puntosNuevos;
        if (puntosNuevos !== puntosAnteriores) {
            destacarPuntosMusaHit();
        }
    }
    if(mostrar_texto.value == 1){
        //texto1.style.height = ""; // resetear la altura
        texto1.style.height = "auto";
    }
    if (jugador_psico == 1) {
        stylize();
    }
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_lÃ­nea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_lÃ­nea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value;
        }
    }*/
    //texto1.style.height = (texto1.scrollHeight) + "px";
    texto1.scrollTop = texto1.scrollHeight;
    //window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView(false);
}

socket.on(texto_x, handler_recibir_texto_x);

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", data => {
    if(data.player == player){
    const segundosRestantes = extraerSegundosTiempo(data.count);
    const introEnCurso = secuencia_inicio_musa_activa || (document.body && document.body.classList.contains(CLASE_INTRO_PARTIDA_MUSA));
    if (segundosRestantes !== null && !ui_partida_activa_musa && !introEnCurso) {
        setUiPartidaActivaMusa(true);
    }
        console.log(data.count)
    if (!temporizador_lectura_activo) {
        mostrarBarraVida();
        if(convertirASegundos(data.count) >= 20){
            tiempo.style.color = "white"
        }
        if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
            tiempo.style.color = "yellow"
        }
        if (10 > convertirASegundos(data.count)) {
            console.log("MENOR QUE 10", convertirASegundos(data.count) )
            tiempo.style.color = "red"
        }
        tiempo.innerHTML = data.count;
        const animarEntradaVida = Boolean(animacionEntradaVidaPendiente && Number.isFinite(segundosRestantes));
        actualizarBarraVida(tiempo, data.count, { animarEntrada: animarEntradaVida });
        if (animarEntradaVida) {
            animacionEntradaVidaPendiente = false;
        }
    }
    if (data.count == "\u00A1Tiempo!") {
        confetti_aux();

        limpiezas_final();
        limpiarEfectosVisualesDesventajaMusa();

        //texto1.innerText = (texto1.innerText).substring(saltos_lÃ­nea_alineacion_1, texto1.innerText.length);
        //texto2.value = (texto2.value).substring(saltos_lÃ­nea_alineacion_2, texto2.value.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');
        // Variable booleana que dice si la ronda ha terminado o no.
        //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de lÃ­nea del jugador 1 para alinear los textos.
        //texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de lÃ­nea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
        if (typeof actualizarEstadoTextoCompleto === "function") {
            actualizarEstadoTextoCompleto(mostrar_texto, true);
        }
        mostrar_texto.style.backgroundColor = "";
        mostrar_texto.value = 1;
        notificacion.style.display = "none";
    }
}
});

// Inicia el juego.
socket.on('inicio', data => {
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    setUiPartidaActivaMusa(false);
    setUiPartidaFinalizadaMusa(false);
    limpiarCountdownInicioMusa();
    post_inicio_pendiente_musa = false;
    LIMITE_TIEMPO_INSPIRACION = data.parametros.LIMITE_TIEMPO_INSPIRACION;
    TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR || TIEMPO_MODIFICADOR;
    ocultarRegaloPdf();
    resetearTemporizadorLectura();
    limpiarTecladoLentoMusa();
    limpiarEfectosVisualesDesventajaMusa();
    terminado = false;
    niveles_bloqueados = true;
    setNivelesDesactivados(false);
    actualizarNiveles("");
    tiempo.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    tiempo.style.display = "";
    tiempo.style.color = "white"

    animateCSS(".contenedor", "pulse");
    iniciarSecuenciaIntroPartidaMusa();

    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atras
    $('#countdown').remove();
    var preparados = $('<span id="countdown">\u00BFPREPARADOS?</span>');
    preparados.appendTo($('.container'));
    preparados_timer = setTimeout(() => {
        preparados_timer = null;
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        revelarEtapaIntroPartidaMusa(1);
    }, 20);

    listener_cuenta_atras = setTimeout(() => {
    listener_cuenta_atras = null;

    var counter = 3;
  
    timer = setInterval(function() {
      
      $('#countdown').remove();
      
      var countdown = $('<span id="countdown">' + (counter == 0 ? '\u00A1ESCRIBE!' : counter) + '</span>');
      countdown.appendTo($('.container'));

      if (counter === 3) {
        revelarEtapaIntroPartidaMusa(2);
      } else if (counter === 2) {
        revelarEtapaIntroPartidaMusa(3);
      } else if (counter === 1) {
        revelarEtapaIntroPartidaMusa(4);
        programarSincronizacionVisorNiveles();
      }
  
      sub_timer = setTimeout(() => {
        if (counter > -1) {
          $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
        } else {
          $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        }
      }, 20);
  
      counter--;
  
      if (counter <= -1) {
        clearInterval(timer);
        timer = null;
        setTimeout(() => {
          clearTimeout(fallback_cuenta_atras_timer);
          fallback_cuenta_atras_timer = null;
          $('#countdown').remove();
          finalizarSecuenciaIntroPartidaMusa();
        }, 1000);
  

    }
  }, 1000);
}, 1000);

    // Failsafe para evitar que la intro se quede atascada en "PREPARADOS?".
    fallback_cuenta_atras_timer = setTimeout(() => {
        limpiarCountdownInicioMusa();
        finalizarSecuenciaIntroPartidaMusa();
    }, 7000);
});

function aplicarPostInicioMusa() {
    const modoAlAplicarPostInicio = modo_actual;
    limpiarCountdownInicioMusa();
    limpiarClasesIntroPartidaMusa();
    secuencia_inicio_musa_activa = false;
    post_inicio_pendiente_musa = false;
    setUiPartidaActivaMusa(true);
    resetearTemporizadorLectura();
    socket.off('vote');
    socket.off('exit');
    socket.off('scroll');
    socket.off('temas_jugadores');
    //socket.off('recibir_comentario');
    socket.off('recibir_postgame1');
    socket.off('recibir_postgame2');

    limpiezas();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    /*
    skill.style = 'animation: brillo 2s ease-in-out;'
    skill.style.display = "flex";
    */

    texto1.style.height = "4.5em";
    texto1.rows =  "3";
    if (modoAlAplicarPostInicio) {
        niveles_bloqueados = false;
        setNivelesDesactivados(false);
        actualizarNiveles(modoAlAplicarPostInicio);
    }
    programarSincronizacionVisorNiveles();
}

socket.on("post-inicio", () => {
    if (hayCountdownInicioActivoMusa()) {
        post_inicio_pendiente_musa = true;
        // Si por cualquier carrera el contador quedo visible pero sin timers,
        // forzamos cierre de intro para no quedarse en "PREPARADOS?".
        if (!listener_cuenta_atras && !timer && !secuencia_inicio_musa_activa) {
            finalizarSecuenciaIntroPartidaMusa();
        }
        return;
    }
    aplicarPostInicioMusa();
});

// Resetea el tablero de juego.
socket.on('limpiar', () => {
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    const mantenerResumenPartida = ui_partida_activa_musa || terminado;
    if (mantenerResumenPartida) {
        setUiPartidaFinalizadaMusa(true);
    } else {
        setUiPartidaActivaMusa(false);
        setUiPartidaFinalizadaMusa(false);
    }
    skill.style = 'animation: brillo 2s ease-in-out;'
    resetearTemporizadorLectura();
    limpiarTecladoLentoMusa();
    limpiarEfectosVisualesDesventajaMusa();
    // Recibe el nombre del jugador y lo coloca en su sitio.
    socket.on(nombre, data => {
        nombre1.value = data;
    });

    limpiezas({ preservarResumenFinal: mantenerResumenPartida });

    modo_actual = "";
    terminado = true;
    niveles_bloqueados = true;
    setNivelesDesactivados(true);
    actualizarNiveles("");
    tiempo.style.display = "none";
    tiempo.style.color = "white"
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */
    notificacion.style.display = "none";
    resetearScrollNiveles();
    resetearEstadoVotacionVentaja();

});

// Recibe el nombre del jugador y lo coloca en su sitio.
socket.on(nombre, data => {
    nombre1.value = data;
    actualizarNombreRegalo();
});

socket.on(elegir_ventaja, (data = {}) => {
    console.log("MODO ACTUAL", modo_actual);
    console.log("REVERTIR", false);
    cambiar_jugadores(false);
    texto1.style.color = "white";
    const overlay = getEl("overlay");
    if (overlay && overlay.style.display !== "none") {
        if (typeof desactivarPantalla === "function") {
            desactivarPantalla({ forzadoControl: true });
        } else {
            overlay.style.display = "none";
        }
    }
    votando = true;
    confetti_musas();
    votacion_ventaja_participo = true;
    votacion_ventaja_activa = true;
    votacion_ventaja_ya_voto = false;
    votacion_ventaja_voto_emitido = false;
    votacion_ventaja_equipo = normalizarEquipoVotacion(data.equipo) || Number(player) || null;
    const opciones = obtenerOpcionesVentaja(data.opciones);
    votacion_ventaja_opciones = opciones.map(op => op.emoji);
    votacion_ventaja_votos = inicializarVotosVentajaEquilibrado(votacion_ventaja_opciones);
    aplicarColorTemporizadorVotacionVentaja(votacion_ventaja_equipo);
    sincronizarTemporizadorVotacionVentaja(data);
    renderizarModalVotacionVentaja(opciones);
    actualizarPiesVotacionVentaja();
    if (votacion_ventaja_duracion_ms > 0 && obtenerMsRestantesVotacionVentaja() <= 0) {
        manejarFinTiempoVotacionVentaja();
    } else {
        mostrarModalVotacionVentaja();
        ocultarInlineVotacionVentaja();
    }
    enviarPalabra_boton.style.display = "none";
    campo_palabra.style.display = "none";
    recordatorio.innerHTML = "";
    notificacion.style.display = "block";
    animateCSS(".notificacion", "flash");
});

socket.on('votacion_ventaja_estado', (data = {}) => {
    if (!data || typeof data !== "object") return;

    const equipo = normalizarEquipoVotacion(data.equipo);
    votacion_ventaja_equipo = equipo;
    aplicarColorTemporizadorVotacionVentaja(equipo || player);
    const esEquipoActual = Boolean(equipo) && Number(player) === equipo;

    if (Array.isArray(data.opciones) && data.opciones.length > 0) {
        votacion_ventaja_opciones = data.opciones.slice(0, 3);
    }
    if (data.votos && typeof data.votos === "object") {
        votacion_ventaja_votos = { ...data.votos };
    }

    if (votacion_ventaja_opciones.length > 0) {
        const opcionesRender = obtenerOpcionesVentaja(votacion_ventaja_opciones);
        renderizarModalVotacionVentaja(opcionesRender);
        actualizarPiesVotacionVentaja();
    }

    if (data.activa === true) {
        votacion_ventaja_activa = true;
        sincronizarTemporizadorVotacionVentaja(data);
        if (esEquipoActual) {
            votacion_ventaja_participo = true;
            if (votacion_ventaja_ya_voto) {
                ocultarModalVotacionVentaja();
                mostrarInlineVotacionVentaja();
            } else {
                const tiempoAgotado = votacion_ventaja_duracion_ms > 0 && obtenerMsRestantesVotacionVentaja() <= 0;
                if (tiempoAgotado) {
                    manejarFinTiempoVotacionVentaja();
                } else {
                    votacion_ventaja_voto_emitido = false;
                    mostrarModalVotacionVentaja();
                    ocultarInlineVotacionVentaja();
                }
            }
        } else if (!votacion_ventaja_participo) {
            ocultarModalVotacionVentaja();
            ocultarInlineVotacionVentaja();
        }
        return;
    }

    if (data.activa === false) {
        votando = false;
        resetearEstadoVotacionVentaja();
    }
});

socket.on("elegir_repentizado", ({seleccionados, TIEMPO_VOTACION}) => {
    votando = true;
    tarea.innerHTML = "<p>&iquest;Por donde quieres que continue la historia?</p><button class='btn repentizado' value = '1' onclick='elegir_repentizado_publico(this)'>" + seleccionados[0] + "</button><br><br><button class='btn' value = '2' onclick='elegir_repentizado_publico(this)'>" + seleccionados[1] + "</button><br><br><button class='btn' value = '3' onclick='elegir_repentizado_publico(this)'>" + seleccionados[2] + "</button>";
    enviarPalabra_boton.style.display = "none";
    campo_palabra.style.display = "none";
    recordatorio.innerHTML = "";
    setTimeout(() => {
        socket.emit('pedir_nombre');
        votando = false;
    }, TIEMPO_VOTACION);
    animateCSS(".notificacion", "flash");
});

socket.on("pedir_inspiracion_musa", juego => {
    const es_prohibidas = juego.modo_actual === "palabras prohibidas";
    cambiar_jugadores(es_prohibidas);
    texto1.style.color = es_prohibidas ? "red" : "white";
    actualizarNiveles(juego.modo_actual);
    if(sincro == 1 || votando == true){
        return;
    }
    pedir_inspiracion(juego);
});

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un nÃºmero entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un nÃºmero entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

function pedir_inspiracion(juego){
    campo_palabra.value = "";
    enviarPalabra_boton.style.display = "";
    campo_palabra.style.display = "";
    modo_actual = juego.modo_actual;
    recordatorio.innerHTML = "";
    const etiquetaMusa = "<span style='color: orange;'>" + nombre_musa + "</span>";
    if(terminado == false && votando == false){
    if(juego.modo_actual == "palabras bonus"){
        tarea.innerHTML = "Cantame a mí, " + etiquetaMusa + ", una palabra que me inspire:";
    }
    if(juego.modo_actual == "letra bendita") {
        letra = juego.letra_bendita;
        tarea.innerHTML = "Cantame a mí, " + etiquetaMusa + ", una palabra que lleve la letra <span style='color: green;'>" + letra.toUpperCase() + "</span>:";
    }
    if(juego.modo_actual == "letra prohibida") {
        letra = juego.letra_prohibida;
        tarea.innerHTML = "Cantame a mí, " + etiquetaMusa + ", una palabra que <span style='color: red;'>NO</span> lleve la letra <span style='color: red;'>" + letra.toUpperCase() + "</span>:";
    }

    if(juego.modo_actual == "palabras prohibidas"){
        console.log("REVERTIR", true);
        cambiar_jugadores(true);
        texto1.style.color = "red";
        tarea.innerHTML = "<span style='color: pink;'>Incordia</span> a mi oponente, " + etiquetaMusa + ", con una palabra que no pueda usar:";
    } 

    if(juego.modo_actual == "tertulia") {
        campo_palabra.value = "none";
        enviarPalabra_boton.style.display = "none";
        campo_palabra.style.display = "none";
        tarea.innerHTML = "<br><br><br>" + etiquetaMusa + ", mira a " + "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" + nombre1.value + "</span>" + " y " + "<span style='color: #86d0ff;'>CUENTA</span>" + " todo aquello que le has querido decir hasta ahora.";
    
    }

    if(juego.modo_actual == "frase final") {
        campo_palabra.value = "none";
        enviarPalabra_boton.style.display = "none";
        campo_palabra.style.display = "none";
        tarea.innerHTML = "<br><br><br>" + etiquetaMusa + ", " + "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" +  nombre1.value + "</span>" + " va a TERMINAR su obra gracias a ti. " + EMOJI_CORAZON_OJOS;
    }

    socket.emit("pedir_texto", { musa: player });
    notificacion.style.display = "block";
    animateCSS(".notificacion", "flash");
    fin_pag.scrollIntoView({behavior: "smooth", block: "end"});
    }
}

function recibir_palabra(data) {
    animacion_modo();
    palabra1.innerHTML = "(+" + data.puntuacion + " pts) " + data.palabras_var;
    definicion1.innerHTML = data.palabra_bonus[1];
}

//FUNCIONES AUXILIARES.

function getRandColor() {
    var hex = "01234567890ABCDEF",
        res = "#";
    for (var i = 0; i < 6; i += 1) {
        res += hex[Math.floor(Math.random() * hex.length)];
    }
    return res;
}

function getRandNumber(s, e) {
    return Math.floor(Math.random() * (e - s + 1)) + s;
}

function getRandFontFamily() {
    var fontFamilies = ["Impact", "Georgia", "Tahoma", "Verdana", "Impact", "Marlet"]; // Add more
    return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
}

function getTextAlign() {
    var aligns = ["center", "left", "right", "justify"]; // Add more
    return aligns[Math.floor(Math.random() * aligns.length)];
}

function stylize() {
    //texto1.style.fontFamily = getRandFontFamily();
    texto1.style.color = getRandColor();
    //var tamaÃ±o_letra = getRandNumber(7, 35)
    //text.style.fontSize = tamaÃ±o_letra + "px"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = getTextAlign();
    //texto2.style.textAlign = getTextAlign();
    //texto2.style.fontFamily = getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tamaÃ±o_letra + "px"; // Font sizes between 15px and 35px
    document.body.style.backgroundColor = getRandColor();
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
    document.body.style.backgroundColor = getRandColor();
}


function animacion_modo() {
    const animateCSS = (element, animation, prefix = 'animate__') =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".explicacion", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

// FunciÃ³n auxiliar que reestablece el estilo inicial de la pÃ¡gina modificado por el modo psicodÃ©lico.
function restablecer_estilo() {
    //texto1.style.fontFamily = "monospace";
    texto1.style.color = "orange";
    //texto1.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = "justify";
    //texto2.style.fontFamily = "monospace";
    //texto2.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto2.style.textAlign = "justify";
    document.body.style.backgroundColor = "black";
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
}

// FunciÃ³n auxiliar que elimina los saltos de lÃ­nea al principio de un string.
function eliminar_saltos_de_linea(texto) {
    var i = 0;
    while (texto[i] == "\n") {
        i++;
    }
    return (texto.substring(i, texto.length));
}

// FunciÃ³n auxiliar que genera un string con n saltos de lÃ­nea.
function crear_n_saltos_de_linea(n) {
    var saltos = "";
    var cont = 0;
    while (cont <= n) {
        saltos += "\n";
        cont++;
    }
    return saltos;
}

// FUNCIONES AUXILIARES PARA LA ELECCIÃ“N ALEATORIA DEL TEMA.
(function ($) {

    $.fn.wordsrotator = function (options) {
        var defaults = {
            autoLoop: true,
            randomize: false,
            stopOnHover: false,
            changeOnClick: false,
            words: null,
            animationIn: "flipInY",
            animationOut: "flipOutY",
            speed: 40,
            onRotate: function () { },//you add these 2 methods to allow the effetct
            stopRotate: function () { }

        };
        var settings = $.extend({}, defaults, options);
        var listItem
        var array_bak = [];
        var stopped = false;

        settings.stopRotate = function () {//you call this one to stop rotate 
            stopped = true;
        }

        return this.each(function () {
            var el = $(this)
            var cont = $("#" + el.attr("id"));
            var array = [];

            //if array is not empty
            if ((settings.words) || (settings.words instanceof Array)) {
                array = $.extend(true, [], settings.words);

                //In random order, need a copy of array
                if (settings.randomize) array_bak = $.extend(true, [], array);

                listItem = 0
                //if randomize pick a random value for the list item
                if (settings.randomize) listItem = Math.floor(Math.random() * array.length)

                //init value into container
                cont.html(array[listItem]);

                // animation option
                var rotate = function () {
                    data = array[listItem]
                    socket.emit('envia_temas', array[listItem]);
                    cont.html("<span id='temas'><span>" + array[listItem] + "</span></span>");
                    texto1.focus();

                    if (settings.randomize) {
                        //remove printed element from array
                        array.splice(listItem, 1);
                        //refill the array from his copy, if empty
                        if (array.length == 0) array = $.extend(true, [], array_bak);
                        //generate new random number
                        listItem = Math.floor(Math.random() * array.length);
                    } else {
                        //if reached the last element of the array, reset the index 
                        if (array.length == listItem + 1) listItem = -1;
                        //move to the next element
                        listItem++;
                    }

                    settings.onRotate(); //this callback will allow to change the speed

                    if (settings.autoLoop && !stopped) {
                        //using timeout instead of interval will allow to change the speed
                        t = setTimeout(function () {
                            rotate()
                        }, settings.speed, function () {
                            rotate()
                        });
                        if (settings.stopOnHover) {
                            cont.hover(function () {
                                window.clearTimeout(t)
                            }, function () {
                                t = setTimeout(rotate, settings.speed, rotate);

                            });
                        };
                    }
                };

                t = setTimeout(function () {
                    rotate()
                }, settings.speed, function () {
                    rotate()
                })
                cont.on("click", function () {
                    if (settings.changeOnClick) {
                        rotate();
                        return false;
                    };
                });
            };

        });
    }

}(jQuery));

function eventFire(el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}

function erm() {
    $(function () {
        $("#temas").wordsrotator({
            animationIn: "fadeOutIn", //css class for entrace animation
            animationOut: "fadeOutDown", //css class for exit animation
            randomize: true,
            stopOnHover: false, //stop animation on hover
            words: temas,
            onRotate: function () {
                //on each rotate you make the timeout longer, until it's slow enough
                if (this.speed < 600) {
                    this.speed += 20;
                } else {
                    this.stopRotate();
                }
            }
        });
    });
    eventFire(document.getElementById('temas'), 'click');
}

function cambiar_color_puntuacion() {
    if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) > parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        puntos1.style.color = "green";
        if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) == parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        }
    }
    else {
        puntos1.style.color = "red";
    }
}

function limpiezas({ preservarResumenFinal = false } = {}){
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    stopConfetti()
    clearInterval(intervalID)
    limpiarCountdownInicioMusa();
    secuencia_inicio_musa_activa = false;
    post_inicio_pendiente_musa = false;
    limpiarClasesIntroPartidaMusa();
    limpiar_colddown()
    limpiarEfectosVisualesDesventajaMusa();
    cambiar_jugadores(false);
    skill.style.display = "none";
    skill.style.border = "0.5vw solid greenyellow";
    skill_cancel.style.display = "none";
    if (!preservarResumenFinal) {
        texto1.innerText = "";
        puntos1.innerHTML = 0 + " palabras";
        texto1.style.height = "4.5em"; /* Alto para tres lÃ­neas de texto */
        texto1.scrollTop = texto1.scrollHeight;
        if (typeof actualizarEstadoTextoCompleto === "function") {
            actualizarEstadoTextoCompleto(mostrar_texto, false);
        }
        mostrar_texto.style.backgroundColor = "";
        mostrar_texto.value = 0;
    } else {
        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px";
        texto1.scrollTop = texto1.scrollHeight;
        if (typeof actualizarEstadoTextoCompleto === "function") {
            actualizarEstadoTextoCompleto(mostrar_texto, true);
        }
        mostrar_texto.style.backgroundColor = "";
        mostrar_texto.value = 1;
    }

    puntos1.style.color = "white";  
    votando = false;
    setNivelesDesactivados(false);
    niveles_bloqueados = true;
    actualizarNiveles("");
}

function limpiezas_final(){
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    clearInterval(interval_cooldown);
    limpiarCountdownInicioMusa();
    secuencia_inicio_musa_activa = false;
    post_inicio_pendiente_musa = false;
    limpiarClasesIntroPartidaMusa();
    limpiar_colddown()
    limpiarEfectosVisualesDesventajaMusa();
    cambiar_jugadores(false);
    skill.style.display = "none";
    skill_cancel.style.display = "none";
    tiempo.style.color = "white";
    votando = false;
    terminado = true;
    setNivelesDesactivados(true);
    niveles_bloqueados = true;
    actualizarNiveles("");
    resetearScrollNiveles();
}
// Cuando el texto del jugador 1 cambia, envÃ­a los datos de jugador 1 al resto.
texto1.addEventListener("keyup", (evt) => {
    console.log(evt.key)
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
  
    }
  });
  // Cuando el texto del jugador 1 cambia, envÃ­a los datos de jugador 1 al resto.
  texto1.addEventListener("keydown", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
  
    }
  });
  
  // Cuando el texto del jugador 1 cambia, envÃ­a los datos de jugador 1 al resto.
  texto1.addEventListener("press", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
  
    }
  });

function limpiar_colddown(){
    clearInterval(interval_cooldown);
    text_progress.removeEventListener('mouseenter', onMouseEnter);
    text_progress.removeEventListener('mouseleave', onMouseLeave);
    bar_progress.style.width = '0%'
    //button.disabled = false; // Habilita el botÃ³n
    text_progress.style.color = "";
    text_progress.innerHTML = `${EMOJI_ROCKET} Inspirar`;
    cooldown = false;
}

  const SECOND_IN_MS = 1000;
  const UPDATE_INTERVAL = SECOND_IN_MS / 60; // Update 60 times per second (60 FPS)
  const SKILL_CLASS = 'skill';
  const DISABLED_CLASS = 'disabled';
  
// Cooldown in milliseconds
cooldowntime = 5000;

// Activate clicked skill
const activateSkill = (event) => {
  const {target} = event;
  // Exit if we click on anything that isn't a skill
  if (target.textContent === EMOJI_EDITAR) {
        editando = true;
        mostrar_texto.value = 0;
        mostrarTextoCompleto(mostrar_texto);
        texto1.contentEditable= "true";
        target.textContent = EMOJI_ENVIAR;
        skill_cancel.style.display = "flex";
    return
  }
  if(!target.classList.contains(SKILL_CLASS)) return;

  if (target.textContent === EMOJI_ENVIAR) {
    
    feedback_texto_editado.innerHTML = "&iexcl;Texto editado!";
    animateCSS(".feedback_texto_editado", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
        feedback_texto_editado.innerHTML = "";
        }, 800);
    });
    texto1.style.height = "";
    editando = false;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable = "false";
    socket.emit('aumentar_tiempo', {secs:-1, player});
    socket.emit(texto_x, { text: texto1.innerText, points: puntos1.textContent});
    skill_cancel.style.display = "none";
    target.textContent = EMOJI_EDITAR;
  }
  target.classList.add(DISABLED_CLASS);
  target.style = '--time-left: 100%';
  
  // Get cooldown time
  let time = cooldowntime - UPDATE_INTERVAL;
  
  // Update remaining cooldown
  intervalID = setInterval(() => {
    // Pass remaining time in percentage to CSS
    const passedTime = time / cooldowntime * 100;
    target.style = `--time-left: ${passedTime}%;`;

    // Display time left
    //target.textContent = (time / SECOND_IN_MS).toFixed(2);
    time -= UPDATE_INTERVAL;
    
    // Stop timer when there is no time left
    if(time < 0) {
        
        skill_cancel.style.display = "none";
        skill.style.display = "flex";
        target.textContent = EMOJI_EDITAR;
        target.style = '';
        target.style = 'animation: brillo 2s ease-in-out;'
        target.classList.remove(DISABLED_CLASS);
      
      clearInterval(intervalID);
    }
  }, UPDATE_INTERVAL);
}

function cancelar(boton){
    socket.emit('pedir_texto')
    texto1.style.height = "";
    editando = false;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable = "false";
    boton.style.display = "none";
    skill.textContent = EMOJI_EDITAR;
}
// Add click handler to the table
skill.addEventListener('click', activateSkill, false);

var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecuciÃ³n

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

function confetti_aux() {
    var animationEnd = Date.now() + duration; // Actualiza aquÃ­ dentro de la funciÃ³n
    isConfettiRunning = true; // Habilita la ejecuciÃ³n de confetti
    console.log(isConfettiRunning);
    
    var interval = setInterval(function() {
      if (!isConfettiRunning) {
        clearInterval(interval);
        return;
      }
  
      var timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
  
      var particleCount = 50 * (timeLeft / duration);
      console.log("HOLAAAA");
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }

function stopConfetti() {
    isConfettiRunning = false; // Deshabilita la ejecuciÃ³n de confetti
    confetti.reset(); // Detiene la animaciÃ³n de confetti
  }

  function confetti_musas(){
    var scalar = 2;
    var unicorn = confetti.shapeFromText({ text: EMOJI_STAR, scalar });
    isConfettiRunning = true; // Habilita la ejecuciÃ³n de confetti
    
    var end = Date.now() + (2 * 1000);
    
    // go Buckeyes!
    (function frame() {
      confetti({
        startVelocity: 10,
        particleCount: 1,
        angle: 270,
        spread: 1000,
        origin: { y: 0 },
        shapes: [unicorn],
        scalar: 3
      });
    
      if ((Date.now() < end) && isConfettiRunning) {
        requestAnimationFrame(frame);
      }
    }());
    }

function cambiar_jugadores(revertir) {

    const p = Number(player); // jugador local: 1 o 2

    // FunciÃ³n de mapeo clara y reversible
    const mapJugador = (j) => revertir ? (3 - j) : j;

    const jugadorTexto = mapJugador(p);
    const jugadorEstilo = mapJugador(p);
    console.log("Revertir:", revertir);
    console.log("OFF", texto_x);

    // 1) Quitar listener anterior
    socket.off(texto_x, handler_recibir_texto_x);

    // 2) Nuevo canal de texto
    texto_x = `texto${jugadorTexto}`;

    console.log("ON", texto_x);

    // 3) Volver a suscribir
    socket.on(texto_x, handler_recibir_texto_x);

    // 4) Aplicar estilos segÃºn el jugador resultante
    if (jugadorEstilo === 1) {
        nombre1.style =
            "color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
        metadatos.style =
            "color:red; text-shadow: 0.0625em 0.0625em aqua;";

    } else {

        nombre1.style =
            "color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
        metadatos.style =
            "color:red; text-shadow: 0.0625em 0.0625em aqua;";

                    nombre1.style =
            "color:red; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;";
        metadatos.style =
            "color:aqua; text-shadow: 0.0625em 0.0625em red;";
    }

    socket.emit('pedir_nombre', {musa : jugadorTexto});

    actualizarColorEquipo();

    console.log(
        "texto_x final =", texto_x,
        "| jugadorTexto =", jugadorTexto,
        "| jugadorEstilo =", jugadorEstilo
    );
}


