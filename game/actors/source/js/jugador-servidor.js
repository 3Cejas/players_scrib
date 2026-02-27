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
const timeout_marcador_actor = new WeakMap();
const escapeHtml = (valor) => String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
    const letraDestacada = renderLetraDestacadaNivelActor(letra);
    if (tipo === "bendita") {
        return `CADA PALABRA DEBE INCLUIR LA LETRA ${letraDestacada}.`;
    }
    if (tipo === "prohibida") {
        return `NINGUNA PALABRA PUEDE USAR LA LETRA ${letraDestacada}.`;
    }
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
    const tiempoRaw = String(tiempoSegundos ?? "").trim();
    if (!tiempoRaw) return escapeHtml(base);
    const tiempoLimpio = tiempoRaw.replace(/^[+-]\s*/, "");
    const esMaldita = tipo === "maldita";
    const signo = esMaldita ? "-" : "+";
    const claseTiempo = esMaldita ? "palabra-tiempo--maldita" : "palabra-tiempo--bendita";
    const tiempoTexto = `${signo}${tiempoLimpio} segs.`;
    return `${escapeHtml(base)} <span class="palabra-tiempo ${claseTiempo}">${escapeHtml(tiempoTexto)}</span>`;
}

function construirBloqueObjetivoNivelActor(palabraTexto, opciones = {}) {
    const base = String(palabraTexto || "").trim();
    if (!base) return "";
    const tipo = String(opciones.tipo || "bonus").trim().toLowerCase();
    const esMaldita = tipo === "prohibidas";
    const tiempoRaw = String(opciones.tiempoSegundos ?? "").trim();
    const palabraHtml = tiempoRaw
        ? construirTextoPalabraConTiempoActor(base, tiempoRaw, esMaldita ? "maldita" : "bendita")
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
        tiempoSegundos: data && data.tiempo_palabras_bonus,
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
        explicación.innerHTML = "SUMA TIEMPO CON PALABRAS BONUS";
        palabra.innerHTML = "NIVEL PALABRAS BONUS";
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
        palabra.innerHTML = "NIVEL LETRA PROHIBIDA";
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
        palabra.innerHTML = "NIVEL LETRA BENDITA";
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "palabras prohibidas") {
        setBarraNivelClaseActor("prohibidas");
        aplicarEstiloNivelesActor("prohibidas");
        explicación.style.color = "pink";
        explicación.innerHTML = "EVITA LAS PALABRAS PROHIBIDAS";
        palabra.innerHTML = "NIVEL PALABRAS PROHIBIDAS";
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "tertulia") {
        setBarraNivelClaseActor("tertulia");
        aplicarEstiloNivelesActor("tertulia");
        explicación.style.color = "#86d0ff";
        explicación.innerHTML = "DIALOGA CON TUS MUSAS";
        palabra.innerHTML = "NIVEL TERTULIA";
        definicion.innerHTML = "";
        return;
    }

    if (modoNormalizado === "frase final") {
        setBarraNivelClaseActor("frase-final");
        aplicarEstiloNivelesActor("frase-final");
        explicación.style.color = "orange";
        explicación.innerHTML = "ULTIMA RONDA";
        palabra.innerHTML = "NIVEL FRASE FINAL";
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
    const texto = String(valor ?? "").trim();
    if (!texto) return "0 palabras";
    if (/^-?\d+(?:\.\d+)?$/.test(texto)) {
        return `${texto} palabras`;
    }
    return texto;
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
let modo_actual = "";
let partida_finalizada_actor = false;
let esperando_resurreccion_actor = false;
texto1.style.height = "auto";
texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
texto1.scrollTop = texto1.scrollHeight;

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
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
        nivelesScroll.scrollLeft = 0;
        actualizarFlechasNiveles();
    }, 50);
    setTimeout(() => {
        nivelesScroll.scrollLeft = 0;
        actualizarFlechasNiveles();
    }, 200);
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
    actualizarFlechasNiveles();
    recalcularLineaNiveles();
});
window.addEventListener("load", () => {
    resetearScrollNiveles();
    setTimeout(actualizarFlechasNiveles, 120);
    setTimeout(actualizarFlechasNiveles, 320);
});
window.addEventListener("pageshow", () => {
    resetearScrollNiveles();
    setTimeout(actualizarFlechasNiveles, 120);
});
requestAnimationFrame(() => {
    setNivelesDesactivados(!modo_actual || niveles_bloqueados);
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

let sincro = 0;
let votando = false;

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
        elegir_ventaja = "elegir_ventaja_j1";
        enviar_palabra = 'enviar_palabra_j1'
        nombre1.style="color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"
        if (metadatos_actor) {
            metadatos_actor.classList.remove("marcador-equipo-2");
            metadatos_actor.classList.add("marcador-equipo-1");
        }

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
        enviar_palabra = 'enviar_palabra_j2'
        nombre1.style="color:red; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;"
        if (metadatos_actor) {
            metadatos_actor.classList.remove("marcador-equipo-1");
            metadatos_actor.classList.add("marcador-equipo-2");
        }
    }

actualizarColorEquipo();
    
const socket = io(serverUrl);

socket.emit('pedir_nombre');
// Recibe el nombre del jugador 1 y lo coloca en su sitio.

socket.on('modo_actual', (data = {}) => {
    const payload = (data && typeof data === "object") ? data : {};
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
});

socket.on("temp_modos", (data = {}) => {
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
    if(nombre == "") nombre = "ESCRITXR";
    nombre1.innerHTML = nombre;
});

// Recibe los datos del jugador 1 y los coloca.
socket.on(texto_x, data => {
    console.log(data)
    texto1.innerHTML = data.text;
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
socket.on("count", data => {
    if(data.player == player){
        const segundosCount = extraerSegundosTiempo(data.count);
        if (convertirASegundos(data.count) >= 20) {
            tiempo.style.color = "white";
        }
        if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
            tiempo.style.color = "yellow";
        }
        if (10 > convertirASegundos(data.count)) {
            tiempo.style.color = "red";
        }
    tiempo.innerHTML = data.count;
    const animarEntradaVida = Boolean(animacionEntradaVidaPendiente && Number.isFinite(segundosCount));
    actualizarBarraVida(tiempo, data.count, { animarEntrada: animarEntradaVida });
    if (Number.isFinite(segundosCount) && modo_actual === "frase final") {
        actualizarProgresoFraseFinalActor(segundosCount);
    }
    if (animarEntradaVida) {
        animacionEntradaVidaPendiente = false;
    }
    const cuentaFinalizada = String(data.count || "").toLowerCase().includes("tiempo");
    if (!cuentaFinalizada && modo_actual && !hayInfoNivelVisibleActor()) {
        renderInfoModoActor(modo_actual, {}, { animar: false });
    }
    if (cuentaFinalizada) {
        setPendienteAnimacionEntradaBarraVida(false);
        cancelarAnimacionEntradaBarraVida(tiempo);
        detenerProgresoNivelBarraActor(false);
        const finDefinitivoPorTiempo = modo_actual === "frase final";
        esperando_resurreccion_actor = !finDefinitivoPorTiempo;
        partida_finalizada_actor = finDefinitivoPorTiempo;
        if (finDefinitivoPorTiempo) {
            confetti_aux();
        } else {
            stopConfetti();
        }

        limpiezas();

        //texto1.innerText = (texto1.innerText).substring(saltos_línea_alineacion_1, texto1.innerText.length);
        //texto2.value = (texto2.value).substring(saltos_línea_alineacion_2, texto2.value.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');
        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
    } else if (Number.isFinite(segundosCount) && segundosCount > 0 && !partida_finalizada_actor) {
        esperando_resurreccion_actor = false;
    }
}
});

socket.on("resucitar_control", (data = {}) => {
    if (Number(data.player) !== Number(player)) return;
    esperando_resurreccion_actor = false;
    partida_finalizada_actor = false;
    stopConfetti();
    niveles_bloqueados = !modo_actual;
    setNivelesDesactivados(!modo_actual);
    actualizarNiveles(modo_actual);
    renderInfoModoActor(modo_actual, {}, { animar: true });
    if (modo_actual) {
        iniciarProgresoNivelBarraActor();
    }
});

socket.on("fin", (data) => {
    const payload = (data && typeof data === "object") ? data : { player: data };
    if (Number(payload.player) !== Number(player)) return;
    if (partida_finalizada_actor) return;
    esperando_resurreccion_actor = false;
    partida_finalizada_actor = true;
    tiempo.innerHTML = "¡Tiempo!";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    confetti_aux();
    limpiezas();
});

// Inicia el juego.
socket.on('inicio', data => {
    const payloadInicio = (data && typeof data === "object") ? data : {};
    const parametrosInicio = (payloadInicio.parametros && typeof payloadInicio.parametros === "object")
        ? payloadInicio.parametros
        : payloadInicio;
    actualizarDuracionNivelDesdeParametrosActor(parametrosInicio || {});
    esperando_resurreccion_actor = false;
    partida_finalizada_actor = false;
    stopConfetti();
    limpiarCacheInfoNivelesActor();
    detenerProgresoNivelBarraActor(true);
    reiniciarProgresoFraseFinalActor();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADOS?</span>');
    preparados.appendTo('body');
    setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);
    setTimeout(() => {
    var counter = 3;
  
    timer = setInterval(function() {
      
      $('#countdown').remove();
      
      var countdown = $('<span id="countdown">'+(counter==0?'¡ESCRIBE!':counter)+'</span>');
      countdown.appendTo('body');
  
      setTimeout(() => {
        if (counter > -1) {
          $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
        } else {
          $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        }
      }, 20);
  
      counter--;
  
      if (counter <= -1) {
        clearInterval(timer);
        setTimeout(() => {
          $('#countdown').remove();
        }, 1000);
  
        // Ejecuta tu función personalizada después de x segundos (por ejemplo, 2 segundos)
        listener_cuenta_atras = setTimeout(function(){
            if (modo_actual) {
                setPendienteAnimacionEntradaBarraVida(true);
                cancelarAnimacionEntradaBarraVida(tiempo);
                if (tiempo) {
                    tiempo.style.display = DISPLAY_BARRA_VIDA;
                    aplicarEstadoBarraVida(tiempo, 0);
                }
                return;
            }
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
        }, 2000);
    }
  }, 1000);
}, 1000);
});

// Resetea el tablero de juego.
socket.on('limpiar', () => {
    esperando_resurreccion_actor = false;
    partida_finalizada_actor = false;
    limpiarCacheInfoNivelesActor();
    detenerProgresoNivelBarraActor(true);
    reiniciarProgresoFraseFinalActor();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);

    // Recibe el nombre del jugador y lo coloca en su sitio.
    socket.on(nombre, data => {
        nombre1.value = data;
    });

    texto1.innerText = "";
    actualizarPuntosMarcadorActor(0, false);
    tiempo.innerHTML = "";
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
    nombre1.value = data;
});

socket.on('activar_modo', data => {
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
    actualizarCacheObjetivoActor("palabras bonus", data || {});
    renderInfoModoActor("palabras bonus", data || {}, { animar: true });
}

function recibir_palabra_prohibida(data) {
    actualizarCacheObjetivoActor("palabras prohibidas", data || {});
    renderInfoModoActor("palabras prohibidas", data || {}, { animar: true });
}
function limpiezas(){
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraActor(true);
    reiniciarProgresoFraseFinalActor();
    clearTimeout(listener_cuenta_atras);
    clearTimeout(timer);

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
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

  var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecución

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

function confetti_aux() {
    var animationEnd = Date.now() + duration; // Actualiza aquí dentro de la función
    isConfettiRunning = true; // Habilita la ejecución de confetti
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
    isConfettiRunning = false; // Deshabilita la ejecución de confetti
    confetti.reset(); // Detiene la animación de confetti
  }
