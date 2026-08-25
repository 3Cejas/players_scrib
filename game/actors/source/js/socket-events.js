// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const getEl = id => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let explicación = getEl("explicación");
let metadatos_actor = getEl("metadatos_actor");
const timeout_marcador_actor = new Map();
const escapeHtml = (valor) => String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const tJuego2P = (clave, variables = {}, fallback = "") => (
    (window && typeof window.scribT2P === "function")
        ? window.scribT2P(clave, variables, fallback)
        : (fallback || clave)
);
const apiTransicionNivelActor = window && window.ScribLevelTransition;
const controladorTransicionNivelActor = apiTransicionNivelActor
    ? apiTransicionNivelActor.createController({
        root: getEl("level_transition"),
        liveRegion: getEl("level_transition_status"),
        translate: tJuego2P,
        windowRef: window,
        documentRef: document
    })
    : null;
const seguimientoTransicionNivelActor = apiTransicionNivelActor
    ? apiTransicionNivelActor.createModeTracker()
    : null;
let transicionNivelPendienteActor = null;
let introTransicionNivelActivaActor = false;

function observarModoCanonicoTransicionActor(payload = {}) {
    if (!seguimientoTransicionNivelActor) {
        return { accepted: false, baseline: false, transition: false };
    }
    return seguimientoTransicionNivelActor.observe(payload);
}

function mostrarTransicionNivelActor(observacion, payload = {}) {
    if (!observacion || !observacion.transition || !controladorTransicionNivelActor) return false;
    return controladorTransicionNivelActor.show(observacion.mode, payload);
}

function aplazarTransicionNivelActor(observacion, payload = {}) {
    if (!observacion || !observacion.transition) return false;
    transicionNivelPendienteActor = {
        observacion: { ...observacion },
        payload: (payload && typeof payload === "object") ? { ...payload } : {}
    };
    return true;
}

function mostrarTransicionNivelPendienteActor(modoAplicado) {
    if (!transicionNivelPendienteActor) return false;
    const pendiente = transicionNivelPendienteActor;
    transicionNivelPendienteActor = null;
    const modoNormalizado = apiTransicionNivelActor?.normalizeMode(modoAplicado);
    if (modoNormalizado !== pendiente.observacion.mode) return false;
    return mostrarTransicionNivelActor(pendiente.observacion, pendiente.payload);
}

function ocultarTransicionNivelActor() {
    controladorTransicionNivelActor?.hide();
}

function reiniciarSeguimientoTransicionNivelActor(opciones = {}) {
    seguimientoTransicionNivelActor?.reset();
    transicionNivelPendienteActor = null;
    introTransicionNivelActivaActor = false;
    ocultarTransicionNivelActor();
    if (opciones.primeEmpty) {
        seguimientoTransicionNivelActor?.observe({ modo_actual: "", modo_seq: 0 });
    }
}
const traducirTituloModoActor = (modo, fallback = "") => (
    (window && typeof window.scribTranslateModeTitle2P === "function")
        ? window.scribTranslateModeTitle2P(modo, fallback || String(modo || "").toUpperCase())
        : (fallback || String(modo || "").toUpperCase())
);
const traducirDescripcionModoActor = (modo, fallback = "") => (
    (window && typeof window.scribTranslateModeDescription2P === "function")
        ? window.scribTranslateModeDescription2P(modo, fallback)
        : fallback
);
const traducirStripModoActor = (modo) => (
    (window && typeof window.scribTranslateModeStrip2P === "function")
        ? window.scribTranslateModeStrip2P(modo)
        : [String(modo || "").toUpperCase()]
);
const formatearPalabrasActor = (valor) => (
    (window && typeof window.scribFormatWordsCount2P === "function")
        ? window.scribFormatWordsCount2P(valor)
        : `${Number(valor) || 0} palabras`
);
const textoTiempoAgotadoActor = () => (
    tJuego2P("timer.time_up", {}, "¡Tiempo!")
);

function pintarTextoActorLocal(html) {
    const contenido = String(html || "");
    if (window.ScribActorAnnotations && typeof window.ScribActorAnnotations.setRemoteHtml === "function") {
        window.ScribActorAnnotations.setRemoteHtml(contenido);
        return;
    }
    if (texto1) {
        texto1.innerHTML = contenido;
    }
}

function limpiarAnotacionesLocalesActor() {
    if (window.ScribActorAnnotations && typeof window.ScribActorAnnotations.clear === "function") {
        window.ScribActorAnnotations.clear({ html: "", render: false });
    }
}

const CLASES_BARRA_NIVEL_ACTOR = [
    "barra-nivel--bendita",
    "barra-nivel--prohibida",
    "barra-nivel--bonus",
    "barra-nivel--prohibidas",
    "barra-nivel--tertulia",
    "barra-nivel--frase-final"
];

const CLASES_ESTILO_PALABRA_NIVEL_ACTOR = [
    "palabra-letras--bendita",
    "palabra-letras--prohibida",
    "palabra-letras--bonus",
    "palabra-letras--prohibidas",
    "palabra-letras--tertulia",
    "palabra-letras--frase-final"
];

const CLASES_ESTILO_DEFINICION_NIVEL_ACTOR = [
    "definicion-letras--bendita",
    "definicion-letras--prohibida",
    "definicion-letras--bonus",
    "definicion-letras--prohibidas",
    "definicion-letras--tertulia",
    "definicion-letras--frase-final"
];

function formatoLetraNivelActor(letra) {
    const valor = String(letra || "").trim();
    return valor ? valor.toUpperCase() : "-";
}

function renderLetraDestacadaNivelActor(letra) {
    return `<span class="explicacion-letra-destacada">${escapeHtml(formatoLetraNivelActor(letra))}</span>`;
}

function construirExplicacionNivelLetraActor(tipo, letra) {
    if (window && typeof window.scribBuildModeRule2P === "function") {
        return window.scribBuildModeRule2P(tipo, letra);
    }
    const letraDestacada = renderLetraDestacadaNivelActor(letra);
    if (tipo === "bendita") return `CADA PALABRA DEBE INCLUIR LA LETRA ${letraDestacada}.`;
    if (tipo === "prohibida") return `NINGUNA PALABRA PUEDE USAR LA LETRA ${letraDestacada}.`;
    return "";
}

function setBarraNivelClaseActor(tipo = "") {
    if (!palabra || !palabra.classList) return;
    CLASES_BARRA_NIVEL_ACTOR.forEach((clase) => palabra.classList.remove(clase));
    if (!tipo) return;
    palabra.classList.add(`barra-nivel--${tipo}`);
}

function limpiarEstiloNivelesActor() {
    if (palabra && palabra.classList) {
        CLASES_ESTILO_PALABRA_NIVEL_ACTOR.forEach((clase) => palabra.classList.remove(clase));
    }
    if (definicion && definicion.classList) {
        definicion.classList.remove("objetivo-nivel");
        CLASES_ESTILO_DEFINICION_NIVEL_ACTOR.forEach((clase) => definicion.classList.remove(clase));
    }
}

function aplicarEstiloNivelesActor(tipo = "") {
    limpiarEstiloNivelesActor();
    if (!tipo || !palabra || !palabra.classList || !definicion || !definicion.classList) return;
    palabra.classList.add(`palabra-letras--${tipo}`);
    definicion.classList.add(`definicion-letras--${tipo}`);
}

function extraerTextoPalabraEventoActor(data = {}) {
    if (!data || typeof data !== "object") return "";
    if (typeof data.palabras_var === "string" && data.palabras_var.trim()) {
        return data.palabras_var.trim();
    }
    if (Array.isArray(data.palabras_var) && data.palabras_var.length) {
        const primera = String(data.palabras_var[0] || "").trim();
        if (primera) return primera;
    }
    if (Array.isArray(data.palabra_bonus) && data.palabra_bonus.length) {
        const primeraBonus = String(data.palabra_bonus[0] || "").trim();
        if (primeraBonus) return primeraBonus;
    }
    return "";
}

function normalizarTextoPlanoActor(texto) {
    return String(texto ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function construirTextoPalabraConTiempoActor(palabraTexto, tiempoSegundos, tipo = "bendita") {
    const base = String(palabraTexto || "").trim();
    if (!base) return "";
    const esMaldita = tipo === "maldita";
    const tiempoTexto = window.ScribInspiration && typeof window.ScribInspiration.formatearTiempoPalabraAsignada === "function"
        ? window.ScribInspiration.formatearTiempoPalabraAsignada(tiempoSegundos, { maldita: esMaldita })
        : "";
    if (!tiempoTexto) return escapeHtml(base);
    const claseTiempo = esMaldita ? "palabra-tiempo--maldita" : "palabra-tiempo--bendita";
    return `${escapeHtml(base)} <span class="palabra-tiempo ${claseTiempo}">${escapeHtml(tiempoTexto)}</span>`;
}

function construirBloqueObjetivoNivelActor(palabraTexto, opciones = {}) {
    const base = String(palabraTexto || "").trim();
    if (!base) return "";
    const tipo = String(opciones.tipo || "bonus").trim().toLowerCase();
    const esMaldita = tipo === "prohibidas";
    const tiempoSeguro = window.ScribInspiration && typeof window.ScribInspiration.resolverTiempoPalabraAsignada === "function"
        ? window.ScribInspiration.resolverTiempoPalabraAsignada({
            tiempo_palabras_bonus: opciones.tiempoSegundos,
            palabras_var: base
        })
        : null;
    const palabraHtml = tiempoSeguro !== null
        ? construirTextoPalabraConTiempoActor(base, tiempoSeguro, esMaldita ? "maldita" : "bendita")
        : escapeHtml(base);
    const descripcion = normalizarTextoPlanoActor(opciones.descripcion);
    const descripcionHtml = descripcion
        ? `<span class="objetivo-def objetivo-def--${tipo}">${escapeHtml(descripcion)}</span>`
        : "";
    return `<span class="objetivo-chip objetivo-chip--${tipo}">${palabraHtml}</span>${descripcionHtml}`;
}

function renderObjetivoNivelActor(palabraTexto, opciones = {}) {
    if (!definicion) return false;
    const bloque = construirBloqueObjetivoNivelActor(palabraTexto, opciones);
    const tieneContenido = Boolean(String(bloque || "").trim());
    if (definicion.classList) {
        definicion.classList.toggle("objetivo-nivel", tieneContenido);
    }
    definicion.innerHTML = tieneContenido ? bloque : "";
    return tieneContenido;
}

let cache_letra_bendita_actor = "";
let cache_letra_prohibida_actor = "";
let cache_objetivo_bonus_actor = null;
let cache_objetivo_prohibidas_actor = null;

function limpiarCacheInfoNivelesActor() {
    cache_letra_bendita_actor = "";
    cache_letra_prohibida_actor = "";
    cache_objetivo_bonus_actor = null;
    cache_objetivo_prohibidas_actor = null;
}

function actualizarCacheLetrasActor(data = {}) {
    if (!data || typeof data !== "object") return;
    const letraBendita = typeof data.letra_bendita === "string" ? data.letra_bendita.trim() : "";
    const letraProhibida = typeof data.letra_prohibida === "string" ? data.letra_prohibida.trim() : "";
    if (letraBendita) {
        cache_letra_bendita_actor = letraBendita;
    }
    if (letraProhibida) {
        cache_letra_prohibida_actor = letraProhibida;
    }
}

function construirObjetivoCacheadoActor(data = {}, tipo = "bonus") {
    const textoPalabra = extraerTextoPalabraEventoActor(data);
    if (!textoPalabra) return null;
    const descripcionBase = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[1] : data && data.definicion;
    return {
        palabra: textoPalabra,
        tipo,
        tiempoSegundos: window.ScribInspiration && typeof window.ScribInspiration.resolverTiempoPalabraAsignada === "function"
            ? window.ScribInspiration.resolverTiempoPalabraAsignada(data)
            : data && data.tiempo_palabras_bonus,
        descripcion: descripcionBase
    };
}

function actualizarCacheObjetivoActor(modo, data = {}) {
    if (modo === "palabras bonus") {
        const objetivo = construirObjetivoCacheadoActor(data, "bonus");
        if (objetivo) {
            cache_objetivo_bonus_actor = objetivo;
            return true;
        }
        return false;
    }
    if (modo === "palabras prohibidas") {
        const objetivo = construirObjetivoCacheadoActor(data, "prohibidas");
        if (objetivo) {
            cache_objetivo_prohibidas_actor = objetivo;
            return true;
        }
        return false;
    }
    return false;
}

function renderObjetivoCacheadoActor(modo) {
    const objetivo = modo === "palabras bonus"
        ? cache_objetivo_bonus_actor
        : (modo === "palabras prohibidas" ? cache_objetivo_prohibidas_actor : null);
    if (!objetivo || !objetivo.palabra) return false;
    return renderObjetivoNivelActor(objetivo.palabra, {
        tipo: objetivo.tipo,
        tiempoSegundos: objetivo.tiempoSegundos,
        descripcion: objetivo.descripcion
    });
}

function renderInfoModoActor(modo, data = {}, opciones = {}) {
    const modoNormalizado = typeof modo === "string" ? modo : "";
    const animar = Boolean(opciones && opciones.animar);
    if (animar) {
        animacion_modo();
    }

    actualizarCacheLetrasActor(data);
    limpiarEstiloNivelesActor();
    setBarraNivelClaseActor("");

    if (!modoNormalizado) {
        palabra.innerHTML = "";
        explicación.innerHTML = "";
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "palabras bonus") {
        setBarraNivelClaseActor("bonus");
        aplicarEstiloNivelesActor("bonus");
        explicación.style.color = "yellow";
        explicación.innerHTML = traducirDescripcionModoActor("palabras bonus", "GANA QUIEN ESCRIBE MAS PALABRAS");
        palabra.innerHTML = traducirTituloModoActor("palabras bonus", "NIVEL PALABRAS BENDITAS");
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "letra prohibida") {
        setBarraNivelClaseActor("prohibida");
        aplicarEstiloNivelesActor("prohibida");
        const letra = (typeof data.letra_prohibida === "string" && data.letra_prohibida.trim())
            ? data.letra_prohibida
            : cache_letra_prohibida_actor;
        explicación.style.color = "red";
        explicación.innerHTML = construirExplicacionNivelLetraActor("prohibida", letra);
        palabra.innerHTML = traducirTituloModoActor("letra prohibida", "NIVEL LETRA MALDITA");
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "letra bendita") {
        setBarraNivelClaseActor("bendita");
        aplicarEstiloNivelesActor("bendita");
        const letra = (typeof data.letra_bendita === "string" && data.letra_bendita.trim())
            ? data.letra_bendita
            : cache_letra_bendita_actor;
        explicación.style.color = "lime";
        explicación.innerHTML = construirExplicacionNivelLetraActor("bendita", letra);
        palabra.innerHTML = traducirTituloModoActor("letra bendita", "NIVEL LETRA BENDITA");
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "palabras prohibidas") {
        setBarraNivelClaseActor("prohibidas");
        aplicarEstiloNivelesActor("prohibidas");
        explicación.style.color = "pink";
        explicación.innerHTML = traducirDescripcionModoActor("palabras prohibidas", "EVITA LAS PALABRAS MALDITAS");
        palabra.innerHTML = traducirTituloModoActor("palabras prohibidas", "NIVEL PALABRAS MALDITAS");
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "tertulia") {
        setBarraNivelClaseActor("tertulia");
        aplicarEstiloNivelesActor("tertulia");
        explicación.style.color = "#86d0ff";
        explicación.innerHTML = traducirDescripcionModoActor("tertulia", "DIALOGA CON TUS MUSAS");
        palabra.innerHTML = traducirTituloModoActor("tertulia", "NIVEL TERTULIA");
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "frase final") {
        setBarraNivelClaseActor("frase-final");
        aplicarEstiloNivelesActor("frase-final");
        explicación.style.color = "orange";
        explicación.innerHTML = traducirDescripcionModoActor("frase final", "ULTIMA RONDA");
        palabra.innerHTML = traducirTituloModoActor("frase final", "NIVEL FRASE FINAL");
        definicion.innerHTML = "";
        return;
    }

    palabra.innerHTML = "";
    explicación.innerHTML = "";
    definicion.innerHTML = "";
}

function hayInfoNivelVisibleActor() {
    const textoPalabra = palabra && typeof palabra.textContent === "string" ? palabra.textContent.trim() : "";
    const textoExplicacion = explicación && typeof explicación.textContent === "string" ? explicación.textContent.trim() : "";
    return Boolean(textoPalabra || textoExplicacion);
}

let DURACION_NIVEL_MS_ACTOR = 60000;
let inicio_nivel_ts_actor = 0;
let intervalo_progreso_nivel_actor = null;
let progreso_frase_final_base_segundos_actor = null;

function normalizarDuracionNivelMsActor(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return null;
    if (numero <= 600) return Math.round(numero * 1000);
    return Math.round(numero);
}

function actualizarDuracionNivelDesdeParametrosActor(parametros = {}) {
    const candidatos = [
        parametros.TIEMPO_MODOS,
        parametros.DURACION_TIEMPO_MODOS,
        parametros.TIEMPO_CAMBIO_MODOS,
        parametros.DURACION_TIEMPO_MUERTO
    ];
    for (const candidato of candidatos) {
        const ms = normalizarDuracionNivelMsActor(candidato);
        if (ms) {
            DURACION_NIVEL_MS_ACTOR = ms;
            return;
        }
    }
}

function setProgresoNivelBarraActor(progreso) {
    if (!palabra) return;
    const valor = Number(progreso);
    const pct = Math.max(0, Math.min(100, Number.isFinite(valor) ? valor : 0));
    palabra.style.setProperty("--nivel-progress", `${pct.toFixed(2)}%`);
}

function detenerProgresoNivelBarraActor(reiniciar = false) {
    if (intervalo_progreso_nivel_actor) {
        clearInterval(intervalo_progreso_nivel_actor);
        intervalo_progreso_nivel_actor = null;
    }
    inicio_nivel_ts_actor = 0;
    if (reiniciar) {
        setProgresoNivelBarraActor(0);
    }
}

function reiniciarProgresoFraseFinalActor() {
    progreso_frase_final_base_segundos_actor = null;
}

function actualizarProgresoFraseFinalActor(segundosRestantes) {
    if (modo_actual !== "frase final") return false;
    const segundos = Number(segundosRestantes);
    if (!Number.isFinite(segundos) || segundos < 0) return false;

    if (!Number.isFinite(progreso_frase_final_base_segundos_actor) || progreso_frase_final_base_segundos_actor <= 0) {
        progreso_frase_final_base_segundos_actor = segundos;
    } else if (segundos > progreso_frase_final_base_segundos_actor) {
        progreso_frase_final_base_segundos_actor = segundos;
    }

    const base = Math.max(1, Number(progreso_frase_final_base_segundos_actor) || 1);
    const restante = Math.max(0, segundos);
    const pct = Math.max(0, Math.min(100, ((base - restante) / base) * 100));
    setProgresoNivelBarraActor(pct);
    if (pct >= 100) {
        detenerProgresoNivelBarraActor(false);
    }
    return true;
}

function tickProgresoNivelBarraActor() {
    if (!inicio_nivel_ts_actor || DURACION_NIVEL_MS_ACTOR <= 0) {
        setProgresoNivelBarraActor(0);
        return;
    }
    const transcurrido = Date.now() - inicio_nivel_ts_actor;
    const pct = Math.min(100, (transcurrido / DURACION_NIVEL_MS_ACTOR) * 100);
    setProgresoNivelBarraActor(pct);
    if (pct >= 100) {
        detenerProgresoNivelBarraActor(false);
    }
}

function iniciarProgresoNivelBarraActor() {
    if (modo_actual === "frase final") {
        detenerProgresoNivelBarraActor(true);
        reiniciarProgresoFraseFinalActor();
        return;
    }
    detenerProgresoNivelBarraActor(true);
    inicio_nivel_ts_actor = Date.now();
    tickProgresoNivelBarraActor();
    intervalo_progreso_nivel_actor = setInterval(tickProgresoNivelBarraActor, 120);
}

const formatearPuntosMarcadorActor = (valor) => {
    return formatearPalabrasActor(valor);
};

function destacarMarcadorActorHit(elemento) {
    if (!elemento) return;
    elemento.classList.remove("puntos-hit");
    void elemento.offsetWidth;
    elemento.classList.add("puntos-hit");
    const timeoutPrevio = timeout_marcador_actor.get(elemento);
    if (timeoutPrevio) {
        clearTimeout(timeoutPrevio);
    }
    const timeoutNuevo = setTimeout(() => {
        if (elemento) {
            elemento.classList.remove("puntos-hit");
        }
    }, 640);
    timeout_marcador_actor.set(elemento, timeoutNuevo);
}

function actualizarPuntosMarcadorActor(valor, animar = true) {
    if (!puntos1) return;
    const previo = (puntos1.textContent || "").trim();
    const siguiente = formatearPuntosMarcadorActor(valor);
    puntos1.textContent = siguiente;
    if (animar && siguiente !== previo) {
        destacarMarcadorActorHit(puntos1);
    }
}



let listener_cuenta_atras = null;
let timer = null;
let revision_intro_actor = 0;
let timeout_preparados_actor = null;
let timeout_animacion_countdown_actor = null;
let timeout_remover_countdown_actor = null;
let modo_actual = "";
let modo_seq_actual_actor = 0;
let partida_finalizada_actor = false;
texto1.style.height = "auto";
texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
texto1.scrollTop = texto1.scrollHeight;

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
if (tiempo) {
    tiempo.style.display = "none";
}

const VIDA_MAX_SEGUNDOS = 10 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";
const DURACION_ANIMACION_ENTRADA_VIDA_MS = 880;
const animacionesEntradaBarraVida = new WeakMap();
let animacionEntradaVidaPendiente = false;
let ultimo_count_valido_actor = "";
let ultimo_ts_count_actor = 0;
let ultimo_count_seq_actor = 0;
let tiempo_seq_actual_actor = 0;
let temporizador_gigante_actor_interval = null;
let temporizador_gigante_actor_restante = 0;
let temporizador_gigante_actor_activo = false;
const DURACION_ALERTA_TIEMPO_LIMITE_ACTOR_MS = 15000;
let timeout_alerta_tiempo_limite_actor = null;
let raf_actualizar_flechas_niveles_actor = null;
const timeouts_actualizar_flechas_niveles_actor = new Set();

function invalidarIntroActor() {
    revision_intro_actor += 1;
    introTransicionNivelActivaActor = false;
    transicionNivelPendienteActor = null;
    clearTimeout(listener_cuenta_atras);
    clearTimeout(timeout_preparados_actor);
    clearTimeout(timeout_animacion_countdown_actor);
    clearTimeout(timeout_remover_countdown_actor);
    clearTimeout(timer);
    clearInterval(timer);
    listener_cuenta_atras = null;
    timeout_preparados_actor = null;
    timeout_animacion_countdown_actor = null;
    timeout_remover_countdown_actor = null;
    timer = null;
    $('#countdown').remove();
    return revision_intro_actor;
}

function esRevisionIntroActorActiva(revision) {
    return revision === revision_intro_actor;
}

function programarActualizacionFlechasNivelesActor(delay = 0) {
    if (delay > 0) {
        const timeoutId = setTimeout(() => {
            timeouts_actualizar_flechas_niveles_actor.delete(timeoutId);
            actualizarFlechasNiveles();
        }, delay);
        timeouts_actualizar_flechas_niveles_actor.add(timeoutId);
        return;
    }
    if (raf_actualizar_flechas_niveles_actor) return;
    raf_actualizar_flechas_niveles_actor = requestAnimationFrame(() => {
        raf_actualizar_flechas_niveles_actor = null;
        actualizarFlechasNiveles();
    });
}

function limpiarAsincroniaVisualActor() {
    limpiarDesventajasActor();
    if (raf_actualizar_flechas_niveles_actor) {
        cancelAnimationFrame(raf_actualizar_flechas_niveles_actor);
        raf_actualizar_flechas_niveles_actor = null;
    }
    timeouts_actualizar_flechas_niveles_actor.forEach((timeoutId) => clearTimeout(timeoutId));
    timeouts_actualizar_flechas_niveles_actor.clear();
    timeout_marcador_actor.forEach((timeoutId, elemento) => {
        clearTimeout(timeoutId);
        if (elemento && elemento.classList) {
            elemento.classList.remove("puntos-hit");
        }
    });
    timeout_marcador_actor.clear();
    detenerTemporizadorGiganteActor();
    ocultarAlertaTiempoLimiteActor();
}

function extraerModoSeqPayloadActor(payload = {}) {
    const valor = Number(payload && payload.modo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function extraerTiempoSeqPayloadActor(payload = {}) {
    const valor = Number(payload && payload.tiempo_seq);
    return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : null;
}

function aceptarTiempoActor(payload = {}, opciones = {}) {
    const { actualizar = true } = opciones;
    const seq = extraerTiempoSeqPayloadActor(payload);
    if (seq === null) {
        return true;
    }
    if (seq < tiempo_seq_actual_actor) {
        return false;
    }
    if (actualizar && seq > tiempo_seq_actual_actor) {
        tiempo_seq_actual_actor = seq;
        ultimo_count_seq_actor = 0;
    }
    return true;
}

function aceptarEventoModoActor(payload = {}, opciones = {}) {
    const { actualizar = true } = opciones;
    const seq = extraerModoSeqPayloadActor(payload);
    if (seq === null) {
        return true;
    }
    if (seq < modo_seq_actual_actor) {
        return false;
    }
    if (actualizar && seq > modo_seq_actual_actor) {
        modo_seq_actual_actor = seq;
        ultimo_count_seq_actor = 0;
        tiempo_seq_actual_actor = 0;
    }
    return true;
}

function extraerPayloadNuevaLetraActor(payload) {
    if (payload && typeof payload === "object") {
        const letraPayload = typeof payload.letra === "string"
            ? payload.letra
            : (typeof payload.letra_bendita === "string"
                ? payload.letra_bendita
                : (typeof payload.letra_prohibida === "string" ? payload.letra_prohibida : ""));
        return {
            letra: String(letraPayload || "").trim(),
            payload
        };
    }
    return {
        letra: String(payload || "").trim(),
        payload: {}
    };
}
let alerta_tiempo_limite_actor_activa = false;
const aviso_tiempo_limite_actor = (() => {
    if (!document.body) return null;
    let nodo = getEl("actor_tiempo_limite_aviso");
    if (!nodo) {
        nodo = document.createElement("div");
        nodo.id = "actor_tiempo_limite_aviso";
        nodo.setAttribute("aria-hidden", "true");
        const textoAviso = document.createElement("p");
        textoAviso.className = "actor-tiempo-limite-texto";
        textoAviso.textContent = tJuego2P("actor.time_limit", {}, "¡INTERPRETE, ES HORA DE ACTUAR!");
        nodo.appendChild(textoAviso);
        document.body.appendChild(nodo);
    }
    return nodo;
})();

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

function normalizarPlayerCountActor(valor) {
    if (valor === null || typeof valor === "undefined") return null;
    const numeroDirecto = Number(valor);
    if (numeroDirecto === 1 || numeroDirecto === 2) return numeroDirecto;
    const texto = String(valor || "").trim();
    if (!texto) return null;
    const match = texto.match(/[12]/);
    if (!match) return null;
    const numero = Number(match[0]);
    return numero === 1 || numero === 2 ? numero : null;
}

function formatearSegundosCountActor(totalSegundos) {
    if (!Number.isFinite(totalSegundos)) return "";
    const total = Math.max(0, Math.floor(Number(totalSegundos) || 0));
    const minutos = Math.floor(total / 60);
    const segundos = total % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function normalizarTextoCountActor(valor) {
    if (valor === null || typeof valor === "undefined") return "";
    if (typeof valor === "number" && Number.isFinite(valor)) {
        return formatearSegundosCountActor(valor);
    }
    if (typeof valor !== "string") {
        return "";
    }
    const texto = String(valor || "").trim();
    if (!texto) return "";
    if (texto.indexOf(":") !== -1) return texto;
    if (/^\d+$/.test(texto)) {
        return formatearSegundosCountActor(Number(texto));
    }
    if (texto.toLowerCase().includes("tiempo")) {
        return textoTiempoAgotadoActor();
    }
    return texto;
}

function extraerCountDesdePayloadActor(payload, playerSeleccionado = null) {
    if (!payload || typeof payload !== "object") {
        return { countTexto: normalizarTextoCountActor(payload), playerEvento: null };
    }

    let playerEvento = normalizarPlayerCountActor(
        payload.player ?? payload.jugador ?? payload.escritor ?? payload.team
    );
    let countTexto = normalizarTextoCountActor(payload.count);

    const clavesGenerales = ["tiempo", "timer", "clock", "contador", "remaining", "restante"];
    const claveJugadorPreferida = Number(playerSeleccionado) === 2 ? "2" : "1";
    const clavesJugador = Number(playerSeleccionado) === 2
        ? ["count2", "tiempo2", "timer2", "p2", "j2", "player2", "escritor2", "equipo2", "2", "rojo"]
        : ["count1", "tiempo1", "timer1", "p1", "j1", "player1", "escritor1", "equipo1", "1", "azul"];

    if (!countTexto && playerSeleccionado !== null) {
        for (const clave of clavesJugador) {
            if (!Object.prototype.hasOwnProperty.call(payload, clave)) continue;
            const candidato = normalizarTextoCountActor(payload[clave]);
            if (!candidato) continue;
            countTexto = candidato;
            playerEvento = playerSeleccionado;
            break;
        }
    }

    if (!countTexto) {
        for (const clave of clavesGenerales) {
            if (!Object.prototype.hasOwnProperty.call(payload, clave)) continue;
            const candidato = normalizarTextoCountActor(payload[clave]);
            if (!candidato) continue;
            countTexto = candidato;
            break;
        }
    }

    if (!countTexto) {
        const countPlano1 = normalizarTextoCountActor(payload.count1);
        const countPlano2 = normalizarTextoCountActor(payload.count2);
        if (playerSeleccionado === 1 && countPlano1) {
            countTexto = countPlano1;
            playerEvento = 1;
        } else if (playerSeleccionado === 2 && countPlano2) {
            countTexto = countPlano2;
            playerEvento = 2;
        } else {
            countTexto = countPlano1 || countPlano2 || "";
            if (countTexto && !playerEvento) {
                playerEvento = countPlano1 ? 1 : 2;
            }
        }
    }

    const nested = payload.count && typeof payload.count === "object" ? payload.count : null;
    if (!countTexto && nested) {
        if (playerSeleccionado !== null) {
            for (const clave of clavesJugador) {
                if (!Object.prototype.hasOwnProperty.call(nested, clave)) continue;
                const candidato = normalizarTextoCountActor(nested[clave]);
                if (!candidato) continue;
                countTexto = candidato;
                playerEvento = playerSeleccionado;
                break;
            }
        }

        if (!countTexto) {
            const nestedCount = normalizarTextoCountActor(nested.count);
            if (nestedCount) {
                countTexto = nestedCount;
            }
            const nestedPlayer = normalizarPlayerCountActor(nested.player);
            if (nestedPlayer !== null) {
                playerEvento = nestedPlayer;
            }
        }

        if (!countTexto) {
            for (const valor of Object.values(nested)) {
                const candidato = normalizarTextoCountActor(valor);
                if (!candidato) continue;
                countTexto = candidato;
                const valorPlayer = normalizarPlayerCountActor(claveJugadorPreferida);
                if (valorPlayer !== null && playerEvento === null) {
                    playerEvento = valorPlayer;
                }
                break;
            }
        }
    }

    return { countTexto, playerEvento };
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

function inicializarBarraVidaActor() {
    if (!tiempo) return;
    tiempo.style.display = "none";
    tiempo.innerHTML = "";
}

function aplicarTemaAlertaTiempoLimiteActor(equipo) {
    if (!document.body) return;
    const equipoNorm = Number(equipo) === 2 ? 2 : 1;
    document.body.classList.toggle("actor-tiempo-limite-equipo-1", equipoNorm === 1);
    document.body.classList.toggle("actor-tiempo-limite-equipo-2", equipoNorm === 2);
}

function ocultarAlertaTiempoLimiteActor() {
    if (timeout_alerta_tiempo_limite_actor) {
        clearTimeout(timeout_alerta_tiempo_limite_actor);
        timeout_alerta_tiempo_limite_actor = null;
    }
    alerta_tiempo_limite_actor_activa = false;
    if (aviso_tiempo_limite_actor) {
        aviso_tiempo_limite_actor.setAttribute("aria-hidden", "true");
    }
    if (!document.body) return;
    document.body.classList.remove("actor-tiempo-limite-activo");
}

function mostrarAlertaTiempoLimiteActor() {
    if (!document.body || alerta_tiempo_limite_actor_activa) return;
    alerta_tiempo_limite_actor_activa = true;
    if (aviso_tiempo_limite_actor) {
        aviso_tiempo_limite_actor.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("actor-tiempo-limite-activo");
    timeout_alerta_tiempo_limite_actor = setTimeout(() => {
        ocultarAlertaTiempoLimiteActor();
    }, DURACION_ALERTA_TIEMPO_LIMITE_ACTOR_MS);
}

function pintarConteoActor(textoConteo, opciones = {}) {
    if (!tiempo) return null;
    const texto = String(textoConteo || "").trim();
    if (!texto) return null;
    const animarEntrada = Boolean(opciones && opciones.animarEntrada);
    const segundosCount = extraerSegundosTiempo(texto);

    if (Number.isFinite(segundosCount) && segundosCount >= 20) {
        tiempo.style.color = "white";
    } else if (Number.isFinite(segundosCount) && segundosCount >= 10) {
        tiempo.style.color = "yellow";
    } else if (Number.isFinite(segundosCount) && segundosCount < 10) {
        tiempo.style.color = "red";
    }

    tiempo.style.display = DISPLAY_BARRA_VIDA;
    tiempo.innerHTML = texto;

    if (Number.isFinite(segundosCount)) {
        actualizarBarraVida(tiempo, texto, { animarEntrada });
    } else {
        cancelarAnimacionEntradaBarraVida(tiempo);
    }
    return segundosCount;
}

function detenerTemporizadorGiganteActor(opciones = {}) {
    const ocultar = !opciones || opciones.ocultar !== false;
    if (temporizador_gigante_actor_interval) {
        clearInterval(temporizador_gigante_actor_interval);
        temporizador_gigante_actor_interval = null;
    }
    temporizador_gigante_actor_restante = 0;
    temporizador_gigante_actor_activo = false;
    if (!tiempo || !ocultar) return;
    tiempo.innerHTML = "";
    tiempo.style.display = "none";
    cancelarAnimacionEntradaBarraVida(tiempo);
}

function iniciarTemporizadorGiganteActor(duracion) {
    detenerTemporizadorGiganteActor({ ocultar: false });
    ocultarAlertaTiempoLimiteActor();
    const total = Math.max(0, Number(duracion) || (10 * 60));
    temporizador_gigante_actor_restante = total;
    temporizador_gigante_actor_activo = true;
    pintarConteoActor(formatearSegundosCountActor(temporizador_gigante_actor_restante), { animarEntrada: true });

    temporizador_gigante_actor_interval = setInterval(() => {
        temporizador_gigante_actor_restante -= 1;
        if (temporizador_gigante_actor_restante < 0) {
            detenerTemporizadorGiganteActor({ ocultar: false });
            pintarConteoActor("00:00");
            mostrarAlertaTiempoLimiteActor();
            return;
        }
        pintarConteoActor(formatearSegundosCountActor(temporizador_gigante_actor_restante));
    }, 1000);
}

let niveles_bloqueados = true;
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

function refrescarEtiquetasNivelesActor() {
    nivelesItems.forEach((item) => {
        const modo = item && item.dataset ? item.dataset.modo : "";
        const strips = traducirStripModoActor(modo);
        const contenedorTexto = item ? item.querySelector(".nivel-texto") : null;
        if (!contenedorTexto) return;
        const spans = Array.from(contenedorTexto.querySelectorAll("span"));
        while (spans.length < strips.length) {
            const extra = document.createElement("span");
            contenedorTexto.appendChild(extra);
            spans.push(extra);
        }
        spans.forEach((span, indice) => {
            span.textContent = strips[indice] || "";
            span.style.display = strips[indice] ? "" : "none";
        });
    });
}

function refrescarCountdownActor() {
    if (window && typeof window.scribRefreshCountdownText2P === "function") {
        window.scribRefreshCountdownText2P(getEl("countdown"));
    }
}

function actualizarTextoAlertaTiempoLimiteActor() {
    if (!aviso_tiempo_limite_actor) return;
    const textoAviso = aviso_tiempo_limite_actor.querySelector(".actor-tiempo-limite-texto");
    if (!textoAviso) return;
    textoAviso.textContent = tJuego2P("actor.time_limit", {}, "¡INTERPRETE, ES HORA DE ACTUAR!");
}

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
    programarActualizacionFlechasNivelesActor();
    const timeoutResetLargo = setTimeout(() => {
        timeouts_actualizar_flechas_niveles_actor.delete(timeoutResetLargo);
        nivelesScroll.scrollLeft = 0;
        actualizarFlechasNiveles();
    }, 50);
    timeouts_actualizar_flechas_niveles_actor.add(timeoutResetLargo);
    const timeoutResetFinal = setTimeout(() => {
        timeouts_actualizar_flechas_niveles_actor.delete(timeoutResetFinal);
        nivelesScroll.scrollLeft = 0;
        actualizarFlechasNiveles();
    }, 200);
    timeouts_actualizar_flechas_niveles_actor.add(timeoutResetFinal);
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

function aplicarTemaMarcadorActor(equipo) {
    if (!metadatos_actor) return;
    const equipoNorm = Number(equipo) === 2 ? 2 : 1;
    const tema = equipoNorm === 2
        ? {
            color: "#ff6b6b",
            color2: "#46f0ff",
            texto: "#ffadad"
        }
        : {
            color: "#46f0ff",
            color2: "#ff6b6b",
            texto: "#9ff8ff"
        };

    metadatos_actor.classList.toggle("marcador-equipo-1", equipoNorm === 1);
    metadatos_actor.classList.toggle("marcador-equipo-2", equipoNorm === 2);
    metadatos_actor.style.setProperty("--equipo-color", tema.color);
    metadatos_actor.style.setProperty("--equipo-color-2", tema.color2);
    metadatos_actor.style.setProperty("--equipo-texto", tema.texto);
    metadatos_actor.setAttribute("data-equipo", String(equipoNorm));
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
    programarActualizacionFlechasNivelesActor();
    programarActualizacionFlechasNivelesActor(220);
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
    actualizarFlechasNiveles();
    recalcularLineaNiveles();
});
window.addEventListener("load", () => {
    resetearScrollNiveles();
    programarActualizacionFlechasNivelesActor(120);
    programarActualizacionFlechasNivelesActor(320);
});
window.addEventListener("pageshow", () => {
    resetearScrollNiveles();
    programarActualizacionFlechasNivelesActor(120);
});
requestAnimationFrame(() => {
    setNivelesDesactivados(!modo_actual || niveles_bloqueados);
    refrescarEtiquetasNivelesActor();
    resetearScrollNiveles();
    actualizarColorEquipo();
    recalcularLineaNiveles();
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
    programarActualizacionFlechasNivelesActor();
    programarActualizacionFlechasNivelesActor(60);
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

let sincro = 0;
let votando = false;
let tiempo_modificador_actor = 3500;
let timeout_texto_borroso_actor = null;
let timeout_texto_inverso_actor = null;
let revision_desventaja_actor = 0;
let desventaja_activa_actor = null;

const {
    BRUMA: PUTADA_BORROSO_ACTOR,
    ESPEJO: PUTADA_INVERSO_ACTOR
} = window.ScribDisadvantages.EMOJIS;

function normalizarDuracionModificadorActor(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return null;
    if (numero <= 600) return Math.round(numero * 1000);
    return Math.round(numero);
}

function actualizarDuracionModificadorDesdeParametrosActor(parametros = {}) {
    const duracion = normalizarDuracionModificadorActor(parametros && parametros.TIEMPO_MODIFICADOR);
    if (duracion) {
        tiempo_modificador_actor = duracion;
    }
}

function obtenerDuracionModificadorActor(opciones = {}) {
    const duracionOverride = Number(
        opciones.duracionMs
        ?? opciones.duracion_ms
        ?? opciones.tiempo_restante_ms
        ?? opciones.restante_ms
    );
    if (Number.isFinite(duracionOverride) && duracionOverride > 0) {
        return Math.round(duracionOverride);
    }
    return Math.max(0, Number(tiempo_modificador_actor) || 3500);
}

function normalizarPutadaActor(putada) {
    const valor = String(putada || "").trim();
    if (!valor) return "";
    if (window.ScribDisadvantages && typeof window.ScribDisadvantages.normalizar === "function") {
        return window.ScribDisadvantages.normalizar(valor);
    }
    return valor;
}

function limpiarAnimacionGiroActor() {
    if (!texto1) return;
    texto1.classList.remove("rotate-vertical-center");
}

function animarGiroTextoActor() {
    if (!texto1) return;
    limpiarAnimacionGiroActor();
    void texto1.offsetWidth;
    texto1.classList.add("rotate-vertical-center");
    const limpiar = () => limpiarAnimacionGiroActor();
    texto1.addEventListener("animationend", limpiar, { once: true });
    setTimeout(limpiar, 2300);
}

function limpiarDesventajaTextoBorrosoActor() {
    clearTimeout(timeout_texto_borroso_actor);
    timeout_texto_borroso_actor = null;
    if (!texto1) return;
    texto1.classList.remove("textarea_blur", "actor-texto-borroso-activo");
    if (texto1.dataset) {
        delete texto1.dataset.actorPutada;
    }
    if (desventaja_activa_actor && desventaja_activa_actor.tipo === "borroso") {
        desventaja_activa_actor = null;
    }
}

function limpiarDesventajaTextoInversoActor(opciones = {}) {
    clearTimeout(timeout_texto_inverso_actor);
    timeout_texto_inverso_actor = null;
    if (!texto1) return;
    texto1.classList.remove("actor-texto-inverso-activo");
    if (texto1.dataset && texto1.dataset.actorPutada === "inverso") {
        delete texto1.dataset.actorPutada;
    }
    if (opciones.animar === true) {
        animarGiroTextoActor();
    }
    if (desventaja_activa_actor && desventaja_activa_actor.tipo === "inverso") {
        desventaja_activa_actor = null;
    }
}

function limpiarDesventajasActor() {
    revision_desventaja_actor += 1;
    limpiarDesventajaTextoBorrosoActor();
    limpiarDesventajaTextoInversoActor();
    limpiarAnimacionGiroActor();
    desventaja_activa_actor = null;
}

function programarTimeoutDesventajaActor() {
    const activa = desventaja_activa_actor;
    if (!activa) return;
    const duracion = Math.max(0, Math.round(Number(activa.restanteMs) || 0));
    activa.inicioTs = Date.now();
    activa.restanteMs = duracion;
    activa.pausada = false;
    const revision = activa.revision;
    const limpiar = activa.tipo === "borroso"
        ? limpiarDesventajaTextoBorrosoActor
        : () => limpiarDesventajaTextoInversoActor({ animar: true });
    const timeoutId = setTimeout(() => {
        if (revision !== revision_desventaja_actor) return;
        limpiar();
    }, duracion);
    if (activa.tipo === "borroso") {
        timeout_texto_borroso_actor = timeoutId;
    } else {
        timeout_texto_inverso_actor = timeoutId;
    }
}

function registrarDesventajaActivaActor(tipo, putada, duracionMs, revision) {
    desventaja_activa_actor = {
        tipo,
        putada,
        duracionMs,
        restanteMs: duracionMs,
        inicioTs: Date.now(),
        pausada: false,
        revision
    };
    programarTimeoutDesventajaActor();
}

function pausarDesventajaActivaActor() {
    const activa = desventaja_activa_actor;
    if (!activa || activa.pausada) return;
    const transcurrido = Math.max(0, Date.now() - activa.inicioTs);
    activa.restanteMs = Math.max(0, activa.restanteMs - transcurrido);
    activa.pausada = true;
    clearTimeout(timeout_texto_borroso_actor);
    clearTimeout(timeout_texto_inverso_actor);
    timeout_texto_borroso_actor = null;
    timeout_texto_inverso_actor = null;
}

function reanudarDesventajaActivaActor() {
    const activa = desventaja_activa_actor;
    if (!activa || !activa.pausada) return;
    programarTimeoutDesventajaActor();
}

function aplicarDesventajaTextoBorrosoActor(opciones = {}) {
    limpiarDesventajasActor();
    const revision = revision_desventaja_actor;
    if (!texto1) return false;
    const duracion = obtenerDuracionModificadorActor(opciones);
    texto1.classList.add("textarea_blur", "actor-texto-borroso-activo");
    if (texto1.dataset) {
        texto1.dataset.actorPutada = "borroso";
    }
    registrarDesventajaActivaActor("borroso", PUTADA_BORROSO_ACTOR, duracion, revision);
    return true;
}

function aplicarDesventajaTextoInversoActor(opciones = {}) {
    limpiarDesventajasActor();
    const revision = revision_desventaja_actor;
    if (!texto1) return false;
    const duracion = obtenerDuracionModificadorActor(opciones);
    texto1.classList.add("actor-texto-inverso-activo");
    if (texto1.dataset) {
        texto1.dataset.actorPutada = "inverso";
    }
    animarGiroTextoActor();
    registrarDesventajaActivaActor("inverso", PUTADA_INVERSO_ACTOR, duracion, revision);
    return true;
}

function aplicarPutadaActor(targetPlayer, putada, opciones = {}) {
    const target = Number(targetPlayer);
    if (target !== Number(player)) {
        return false;
    }
    const clave = normalizarPutadaActor(putada);
    if (clave === PUTADA_BORROSO_ACTOR) {
        return aplicarDesventajaTextoBorrosoActor(opciones);
    }
    if (clave === PUTADA_INVERSO_ACTOR) {
        return aplicarDesventajaTextoInversoActor(opciones);
    }
    return false;
}

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    'palabras bonus': function (data) {
        renderInfoModoActor("palabras bonus", data, { animar: true });
        socket.off(enviar_palabra);
        socket.on(enviar_palabra, (payload) => {
            recibir_palabra(payload);
        });
    },

    //Recibe y activa el modo letra prohibida.
    'letra prohibida': function (data) {
        renderInfoModoActor("letra prohibida", data, { animar: true });
    },

    //Recibe y activa el modo letra bendita.
    'letra bendita': function (data) {
        renderInfoModoActor("letra bendita", data, { animar: true });
    },

    'palabras prohibidas': function (data) {
        renderInfoModoActor("palabras prohibidas", data, { animar: true });
        socket.off(enviar_palabra);
        socket.on(enviar_palabra, (payload) => {
            recibir_palabra_prohibida(payload);
        });
    },

    'tertulia': function (data) {
        //activar_socket_feedback();
        renderInfoModoActor("tertulia", data, { animar: true });

    },

    'frase final': function (data) {
        //activar_socket_feedback();
        renderInfoModoActor("frase final", data, { animar: true });

    },

    '': function (data) {
        renderInfoModoActor("", data, { animar: false });
    }
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        socket.off(enviar_palabra);
    },

    "letra prohibida": function (data) { },

    "letra bendita": function (data) { },

    "palabras prohibidas": function (data) {
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        socket.off(enviar_palabra);
    },

    "tertulia": function (data) { },

    "frase final": function (data) { },

    "": function (data) { },
};

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


var player = getParameterByName("player");

    if (player == 1) {
        enviar_putada_de_jx = 'enviar_putada_de_j2';
        feedback_a_j_x = 'feedback_a_j1';
        feedback_de_j_x = 'feedback_de_j1';
        texto_x = 'texto1'
        enviar_postgame_x = 'enviar_postgame1';
        recibir_postgame_x = 'recibir_postgame1';
        nombre = 'nombre1';
        //nombre1.value = "ESCRITXR 1" 
        enviar_palabra = 'enviar_palabra_j1'
        nombre1.style="color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"
        aplicarTemaMarcadorActor(1);
        aplicarTemaAlertaTiempoLimiteActor(1);

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
        enviar_palabra = 'enviar_palabra_j2'
        nombre1.style="color:red; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;"
        aplicarTemaMarcadorActor(2);
        aplicarTemaAlertaTiempoLimiteActor(2);
    }

if (player != 1 && player != 2) {
    aplicarTemaMarcadorActor(1);
    aplicarTemaAlertaTiempoLimiteActor(1);
}

actualizarColorEquipo();
inicializarBarraVidaActor();
    
const socket = io(serverUrl);

socket.on("idioma_actual", (payload = {}) => {
    if (window && typeof window.scribSetLanguage2P === "function") {
        window.scribSetLanguage2P(payload && payload.idioma ? payload.idioma : "es");
    }
});

socket.on("recargar_rol_remoto", () => {
    window.location.reload();
});

socket.on("connect", () => {
    reiniciarSeguimientoTransicionNivelActor();
    limpiarAsincroniaVisualActor();
    invalidarIntroActor();
    modo_seq_actual_actor = 0;
    ultimo_count_seq_actor = 0;
    tiempo_seq_actual_actor = 0;
    socket.emit("registrar_actor", { player });
    socket.emit("pedir_nombre");
    socket.emit("pedir_idioma_actual");
});

socket.on("disconnect", () => {
    ocultarTransicionNivelActor();
    limpiarAsincroniaVisualActor();
    invalidarIntroActor();
});

socket.on("connect_error", () => {
    ocultarTransicionNivelActor();
    limpiarAsincroniaVisualActor();
    invalidarIntroActor();
});
// Recibe el nombre del jugador 1 y lo coloca en su sitio.

socket.on('modo_actual', (data = {}) => {
    if (!aceptarEventoModoActor(data)) {
        return;
    }
    const payload = (data && typeof data === "object") ? data : {};
    const observacionTransicion = observarModoCanonicoTransicionActor(payload);
    const traeModo = Object.prototype.hasOwnProperty.call(payload, "modo_actual");
    const siguiente_modo = traeModo ? String(payload.modo_actual || "") : modo_actual;
    modo_actual = siguiente_modo;
    actualizarDuracionNivelDesdeParametrosActor(payload);
    actualizarCacheLetrasActor(payload);
    if (modo_actual === "palabras bonus") {
        actualizarCacheObjetivoActor("palabras bonus", payload);
    } else if (modo_actual === "palabras prohibidas") {
        actualizarCacheObjetivoActor("palabras prohibidas", payload);
    }
    niveles_bloqueados = !siguiente_modo;
    setNivelesDesactivados(!siguiente_modo);
    actualizarNiveles(modo_actual);
    renderInfoModoActor(modo_actual, payload, { animar: false });
    if (modo_actual) {
        iniciarProgresoNivelBarraActor();
    } else {
        detenerProgresoNivelBarraActor(true);
        reiniciarProgresoFraseFinalActor();
    }
    if (introTransicionNivelActivaActor) {
        aplazarTransicionNivelActor(observacionTransicion, payload);
    } else {
        mostrarTransicionNivelActor(observacionTransicion, payload);
    }
});

socket.on("temp_modos", (data = {}) => {
    if (!aceptarEventoModoActor(data)) {
        return;
    }
    if (!modo_actual || modo_actual === "frase final") return;
    const payload = (data && typeof data === "object") ? data : {};
    const modoEvento = typeof payload.modo_actual === "string" ? payload.modo_actual : "";
    if (!modoEvento || modoEvento !== modo_actual) return;
    const segundos = Number(payload.segundos_transcurridos);
    if (!Number.isFinite(segundos) || segundos < 0) return;
    const ms = Math.max(0, Math.min(DURACION_NIVEL_MS_ACTOR, Math.round(segundos * 1000)));
    inicio_nivel_ts_actor = Date.now() - ms;
    const pct = DURACION_NIVEL_MS_ACTOR > 0 ? (ms / DURACION_NIVEL_MS_ACTOR) * 100 : 0;
    setProgresoNivelBarraActor(pct);
});


socket.on('dar_nombre', (nombre) => {
    if(nombre == "") nombre = tJuego2P("ui.writer_generic", {}, "ESCRITXR");
    nombre1.innerHTML = nombre;
});

function normalizarPayloadPutadaActor(playerFallback, payload) {
    const data = (payload && typeof payload === "object") ? payload : { putada: payload };
    const target = Number(data.player || data.target || data.jugador || playerFallback);
    const duracion = Number(
        data.tiempo_restante_ms
        ?? data.restante_ms
        ?? data.duracion_ms
        ?? data.duracionMs
    );
    return {
        target: Number(target) === 2 ? 2 : 1,
        putada: data.putada || data.seleccion || data.ventaja || data.tipo || "",
        pausada: Boolean(data.pausada),
        opciones: Number.isFinite(duracion) && duracion > 0 ? { duracionMs: Math.trunc(duracion) } : {}
    };
}

function aplicarPayloadPutadaActor(playerFallback, payload) {
    const data = normalizarPayloadPutadaActor(playerFallback, payload);
    const aplicada = aplicarPutadaActor(data.target, data.putada, data.opciones);
    if (aplicada && data.pausada) {
        pausarDesventajaActivaActor();
    }
    return aplicada;
}

socket.on("enviar_ventaja_j1", (putada) => {
    aplicarPayloadPutadaActor(1, putada);
});

socket.on("enviar_ventaja_j2", (putada) => {
    aplicarPayloadPutadaActor(2, putada);
});

socket.on("enviar_putada_de_j1", (putada) => {
    aplicarPayloadPutadaActor(1, putada);
});

socket.on("enviar_putada_de_j2", (putada) => {
    aplicarPayloadPutadaActor(2, putada);
});

socket.on("desventaja_activa_estado", (payload) => {
    aplicarPayloadPutadaActor(1, payload);
});

socket.on("pausar_js", () => {
    pausarDesventajaActivaActor();
});

socket.on("reanudar_js", () => {
    reanudarDesventajaActivaActor();
});

// Recibe los datos del jugador 1 y los coloca.
socket.on(texto_x, data => {
    console.log(data)
    const htmlRemoto = typeof data?.text === "string" ? data.text : "";
    const guardadoRemoto = typeof data?.texto_guardado === "string" ? data.texto_guardado : "";
    let htmlLocal = htmlRemoto;
    if (htmlRemoto.trim().length > 0) {
        htmlLocal = htmlRemoto;
    } else if (guardadoRemoto.trim().length > 0) {
        htmlLocal = escapeHtml(guardadoRemoto).replace(/\n/g, "<br>");
    } else {
        htmlLocal = htmlRemoto;
    }
    pintarTextoActorLocal(htmlLocal);
    actualizarPuntosMarcadorActor(data.points);
    //cambiar_color_puntuación()
        //texto1.style.height = ""; // resetear la altura
    texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value;
        }
    }*/
    //texto1.style.height = (texto1.scrollHeight) + "px";
    texto1.scrollTop = texto1.scrollHeight;
    //window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView(false);
});

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", (data = {}) => {
    if (!aceptarEventoModoActor(data)) {
        return;
    }
    if (!aceptarTiempoActor(data)) {
        return;
    }
    const countSeq = Number(data && data.count_seq);
    if (Number.isFinite(countSeq) && countSeq > 0) {
        if (countSeq <= ultimo_count_seq_actor) {
            return;
        }
        ultimo_count_seq_actor = Math.trunc(countSeq);
    }
    if (temporizador_gigante_actor_activo) {
        return;
    }
    const playerSeleccionado = normalizarPlayerCountActor(player);
    const payloadNormalizado = extraerCountDesdePayloadActor(data, playerSeleccionado);
    const countTexto = payloadNormalizado.countTexto;
    const playerEvento = payloadNormalizado.playerEvento;

    if (!countTexto) {
        return;
    }

    const playerEventoNormalizado = normalizarPlayerCountActor(playerEvento);
    const coincidePlayer = playerEventoNormalizado === null
        || playerSeleccionado === null
        || playerEventoNormalizado === playerSeleccionado;

    if (!coincidePlayer) {
        return;
    }

    const segundosCountPrevio = extraerSegundosTiempo(countTexto);
    const animarEntradaVida = Boolean(animacionEntradaVidaPendiente && Number.isFinite(segundosCountPrevio));
    const segundosCount = pintarConteoActor(countTexto, { animarEntrada: animarEntradaVida });
    if (Number.isFinite(segundosCount)) {
        ultimo_count_valido_actor = countTexto;
        ultimo_ts_count_actor = Date.now();
    }
    if (Number.isFinite(segundosCount) && modo_actual === "frase final") {
        actualizarProgresoFraseFinalActor(segundosCount);
    }
    if (animarEntradaVida) {
        animacionEntradaVidaPendiente = false;
    }
    const cuentaFinalizada = String(countTexto || "").toLowerCase().includes("tiempo");
    if (!cuentaFinalizada && modo_actual && !hayInfoNivelVisibleActor()) {
        renderInfoModoActor(modo_actual, {}, { animar: false });
    }
    if (cuentaFinalizada) {
        setPendienteAnimacionEntradaBarraVida(false);
        cancelarAnimacionEntradaBarraVida(tiempo);
        detenerProgresoNivelBarraActor(false);
        stopConfetti();
        mostrarAlertaTiempoLimiteActor();

        limpiezas();

        //texto1.innerText = (texto1.innerText).substring(saltos_línea_alineacion_1, texto1.innerText.length);
        //texto2.value = (texto2.value).substring(saltos_línea_alineacion_2, texto2.value.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');
        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
    }
});

socket.on("temporizador_gigante_inicio", (data = {}) => {
    const duracion = (data && typeof data === "object") ? data.duracion : data;
    iniciarTemporizadorGiganteActor(duracion);
});

socket.on("temporizador_gigante_detener", () => {
    detenerTemporizadorGiganteActor();
});

socket.on("fin", (data) => {
    const payload = (data && typeof data === "object") ? data : { player: data };
    if (payload.partida_finalizada !== true || Number(payload.player) !== Number(player)) return;
    ocultarTransicionNivelActor();
    if (partida_finalizada_actor) return;
    partida_finalizada_actor = true;
    tiempo.innerHTML = textoTiempoAgotadoActor();
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    if (alerta_tiempo_limite_actor_activa) {
        stopConfetti();
    } else {
        confetti_aux();
    }
    limpiezas();
});

function calcularFontSizeCountdownActor(textoCountdown, objetivoVw) {
    const caracteres = Math.max(1, Array.from(String(textoCountdown || "").trim()).length);
    const limitePorAncho = 88 / (caracteres * 0.7);
    const valor = Math.min(Number(objetivoVw) || 10, limitePorAncho);
    return Math.max(4, Math.min(valor, 40)).toFixed(2) + "vw";
}

function crearCountdownActor(textoCountdown) {
    $('#countdown').remove();
    return $('<span id="countdown"></span>')
        .text(textoCountdown)
        .appendTo('body');
}

function aplicarEstiloCountdownActor(expandido = false) {
    const countdown = $('#countdown');
    const textoCountdown = countdown.text() || "";
    const esNumero = /^\d+$/.test(String(textoCountdown).trim());
    countdown.css({
        'font-size': calcularFontSizeCountdownActor(textoCountdown, expandido ? (esNumero ? 40 : 14) : 10),
        'opacity': expandido ? 0 : 1,
        'max-width': '92vw',
        'white-space': 'nowrap',
        'line-height': 1,
        'text-align': 'center',
        'overflow': 'visible'
    });
}

function finalizarCuentaAtrasActor(revisionIntro) {
    if (!esRevisionIntroActorActiva(revisionIntro)) {
        return;
    }
    introTransicionNivelActivaActor = false;
    if (modo_actual) {
        setPendienteAnimacionEntradaBarraVida(true);
        cancelarAnimacionEntradaBarraVida(tiempo);
        if (tiempo) {
            tiempo.style.display = DISPLAY_BARRA_VIDA;
            aplicarEstadoBarraVida(tiempo, 0);
        }
        mostrarTransicionNivelPendienteActor(modo_actual);
        return;
    }
    limpiarAnotacionesLocalesActor();
    texto1.innerText = "";
    actualizarPuntosMarcadorActor(0, false);
    tiempo.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);

    limpiezas();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    texto1.style.height = "";
    texto1.rows =  "3";
    animacion_modo();
}

function programarPasoCountdownActor(paso, revisionIntro) {
    if (!esRevisionIntroActorActiva(revisionIntro)) {
        return;
    }
    const pasoActual = Number(paso);
    const textoPaso = pasoActual === 0 ? tJuego2P("countdown.write", {}, "\u00a1ESCRIBE!") : pasoActual;
    crearCountdownActor(textoPaso);

    clearTimeout(timeout_animacion_countdown_actor);
    timeout_animacion_countdown_actor = setTimeout(() => {
        timeout_animacion_countdown_actor = null;
        if (!esRevisionIntroActorActiva(revisionIntro)) {
            return;
        }
        aplicarEstiloCountdownActor(true);
    }, 20);

    if (pasoActual <= 0) {
        clearTimeout(timeout_remover_countdown_actor);
        timeout_remover_countdown_actor = setTimeout(() => {
            timeout_remover_countdown_actor = null;
            if (!esRevisionIntroActorActiva(revisionIntro)) {
                return;
            }
            $('#countdown').remove();
        }, 1000);

        clearTimeout(listener_cuenta_atras);
        listener_cuenta_atras = setTimeout(() => {
            listener_cuenta_atras = null;
            finalizarCuentaAtrasActor(revisionIntro);
        }, 2000);
        return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        programarPasoCountdownActor(pasoActual - 1, revisionIntro);
    }, 1000);
}

// Inicia el juego.
socket.on('inicio', data => {
    const revisionIntro = invalidarIntroActor();
    introTransicionNivelActivaActor = true;
    limpiarAsincroniaVisualActor();
    const payloadInicio = (data && typeof data === "object") ? data : {};
    const parametrosInicio = (payloadInicio.parametros && typeof payloadInicio.parametros === "object")
        ? payloadInicio.parametros
        : payloadInicio;
    actualizarDuracionNivelDesdeParametrosActor(parametrosInicio || {});
    actualizarDuracionModificadorDesdeParametrosActor(parametrosInicio || {});
    partida_finalizada_actor = false;
    stopConfetti();
    ocultarAlertaTiempoLimiteActor();
    limpiarCacheInfoNivelesActor();
    limpiarAnotacionesLocalesActor();
    detenerProgresoNivelBarraActor(true);
    reiniciarProgresoFraseFinalActor();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerTemporizadorGiganteActor();
    ultimo_count_valido_actor = "";
    ultimo_ts_count_actor = 0;
    if (tiempo) {
        tiempo.style.display = "none";
        tiempo.innerHTML = "";
    }
    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    crearCountdownActor(tJuego2P("countdown.ready", {}, "\u00bfPREPARADOS?"));
    timeout_preparados_actor = setTimeout(() => {
        if (!esRevisionIntroActorActiva(revisionIntro)) {
            return;
        }
        aplicarEstiloCountdownActor(false);
    }, 20);
    listener_cuenta_atras = setTimeout(() => {
        listener_cuenta_atras = null;
        programarPasoCountdownActor(3, revisionIntro);
    }, 1000);
});

// Resetea el tablero de juego.
socket.on('limpiar', () => {
    reiniciarSeguimientoTransicionNivelActor({ primeEmpty: true });
    invalidarIntroActor();
    limpiarAsincroniaVisualActor();
    partida_finalizada_actor = false;
    ocultarAlertaTiempoLimiteActor();
    limpiarCacheInfoNivelesActor();
    detenerProgresoNivelBarraActor(true);
    reiniciarProgresoFraseFinalActor();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerTemporizadorGiganteActor();
    ultimo_count_valido_actor = "";
    ultimo_ts_count_actor = 0;

    limpiarAnotacionesLocalesActor();
    texto1.innerText = "";
    actualizarPuntosMarcadorActor(0, false);
    tiempo.innerHTML = "";
    tiempo.style.display = "none";
    actualizarBarraVida(tiempo, tiempo.innerHTML);

    limpiezas();
    stopConfetti();
    modo_actual = "";
    niveles_bloqueados = true;
    setNivelesDesactivados(true);
    actualizarNiveles(modo_actual);

    texto1.style.height = "";
    texto1.rows =  "3";
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */
});

// Recibe el nombre del jugador y lo coloca en su sitio.
socket.on(nombre, data => {
    nombre1.value = data || tJuego2P("ui.writer_generic", {}, "ESCRITXR");
});

socket.on('activar_modo', data => {
    if (!aceptarEventoModoActor(data)) {
        return;
    }
    const payload = (data && typeof data === "object") ? data : {};
    const modo_previo = modo_actual;
    const limpiarModoPrevio = LIMPIEZAS[modo_previo];
    if (typeof limpiarModoPrevio === "function") {
        limpiarModoPrevio(payload);
    }
    const siguiente_modo = typeof payload.modo_actual === "string" ? payload.modo_actual : "";
    modo_actual = siguiente_modo;
    actualizarDuracionNivelDesdeParametrosActor(payload);
    actualizarCacheLetrasActor(payload);
    if (modo_actual === "palabras bonus") {
        const objetivoActualizado = actualizarCacheObjetivoActor("palabras bonus", payload);
        if (!objetivoActualizado && modo_previo !== "palabras bonus") {
            cache_objetivo_bonus_actor = null;
        }
    } else if (modo_actual === "palabras prohibidas") {
        const objetivoActualizado = actualizarCacheObjetivoActor("palabras prohibidas", payload);
        if (!objetivoActualizado && modo_previo !== "palabras prohibidas") {
            cache_objetivo_prohibidas_actor = null;
        }
    }
    niveles_bloqueados = false;
    setNivelesDesactivados(false);
    actualizarNiveles(modo_actual);
    const ejecutarModo = MODOS[modo_actual];
    if (typeof ejecutarModo === "function") {
        ejecutarModo(payload);
    } else {
        renderInfoModoActor(modo_actual, payload, { animar: true });
    }
    if (modo_actual) {
        iniciarProgresoNivelBarraActor();
    } else {
        detenerProgresoNivelBarraActor(true);
        reiniciarProgresoFraseFinalActor();
    }
});

function cambiar_color_puntuación() {
    if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) > parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        puntos1.style.color = "green";
        if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) == parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        }
    }
    else {
        puntos1.style.color = "red";
    }
}

socket.on("nueva letra", letra => {
    const eventoLetra = extraerPayloadNuevaLetraActor(letra);
    if (!aceptarEventoModoActor(eventoLetra.payload)) {
        return;
    }
    letra = eventoLetra.letra;
    console.log("NUEVA LETRA")
    if(modo_actual == "letra prohibida"){
        cache_letra_prohibida_actor = String(letra || "").trim();
        renderInfoModoActor("letra prohibida", { letra_prohibida: cache_letra_prohibida_actor }, { animar: true });
        }
    else if(modo_actual == "letra bendita"){
        cache_letra_bendita_actor = String(letra || "").trim();
        renderInfoModoActor("letra bendita", { letra_bendita: cache_letra_bendita_actor }, { animar: true });
    }
});

function recibir_palabra(data) {
    if (!aceptarEventoModoActor(data, { actualizar: false })) {
        return;
    }
    actualizarCacheObjetivoActor("palabras bonus", data || {});
    renderInfoModoActor("palabras bonus", data || {}, { animar: true });
}

function recibir_palabra_prohibida(data) {
    if (!aceptarEventoModoActor(data, { actualizar: false })) {
        return;
    }
    actualizarCacheObjetivoActor("palabras prohibidas", data || {});
    renderInfoModoActor("palabras prohibidas", data || {}, { animar: true });
}
function limpiezas(){
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraActor(true);
    reiniciarProgresoFraseFinalActor();
    invalidarIntroActor();
    limpiarAsincroniaVisualActor();

    limpiarEstiloNivelesActor();
    setBarraNivelClaseActor("");
    palabra.innerHTML = "";
    explicación.innerHTML = "";
    definicion.innerHTML = "";
    tiempo.style.color = "white"
    puntos1.style.removeProperty("color");
    votando = false;
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
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

function convertirASegundos(tiempo) {
    if (typeof tiempo !== "string" || tiempo.indexOf(":") === -1) return NaN;
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    if (Number.isNaN(minutos) || Number.isNaN(segundos)) return NaN;
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

  var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecución
let confettiIntervalActor = null;

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

function confetti_aux() {
    stopConfetti();
    var animationEnd = Date.now() + duration; // Actualiza aquí dentro de la función
    isConfettiRunning = true; // Habilita la ejecución de confetti
    console.log(isConfettiRunning);
    
    confettiIntervalActor = setInterval(function() {
      if (!isConfettiRunning) {
        clearInterval(confettiIntervalActor);
        confettiIntervalActor = null;
        return;
      }
  
      var timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(confettiIntervalActor);
        confettiIntervalActor = null;
        return;
      }
  
      var particleCount = 50 * (timeLeft / duration);
      console.log("HOLAAAA");
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }

function stopConfetti() {
    isConfettiRunning = false; // Deshabilita la ejecución de confetti
    if (confettiIntervalActor) {
        clearInterval(confettiIntervalActor);
        confettiIntervalActor = null;
    }
    confetti.reset(); // Detiene la animación de confetti
  }

function refrescarUiIdiomaActor() {
    refrescarEtiquetasNivelesActor();
    actualizarTextoAlertaTiempoLimiteActor();
    refrescarCountdownActor();

    if (puntos1) {
        const matchPuntos = String(puntos1.textContent || "").match(/-?\d+/);
        actualizarPuntosMarcadorActor(matchPuntos ? Number(matchPuntos[0]) : 0, false);
    }

    if (modo_actual) {
        renderInfoModoActor(modo_actual, {}, { animar: false });
    }

    if (tiempo && String(tiempo.textContent || "").trim() && String(tiempo.textContent || "").indexOf(":") === -1) {
        tiempo.innerHTML = textoTiempoAgotadoActor();
    }
}

if (window && typeof window.scribOnLanguageChange2P === "function") {
    window.scribOnLanguageChange2P(() => {
        refrescarUiIdiomaActor();
    });
}

refrescarUiIdiomaActor();
