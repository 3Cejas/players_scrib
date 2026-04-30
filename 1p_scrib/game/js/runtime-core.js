let tiempo_inicial = new Date();
let es_pausa = false;
let borrado_cambiado = false;
let duracion;
let texto_guardado = "";
let pararEscritura = false;
let LISTA_MODOS = ["palabras bonus", "letra bendita","letra prohibida", "palabras bonus", "palabras prohibidas", "frase final"];
let modos_restantes;

const getEl = (...ids) => {
    for (const id of ids) {
        const elemento = document.getElementById(id);
        if (elemento) return elemento;
    }
    return null;
}; // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let texto = getEl("texto");
let puntos = getEl("puntos");
let feedback = getEl("feedback1");
let musas = getEl("musas");
  
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let explicación = getEl("explicación", "explicaciÃ³n");
let metadatos = getEl("metadatos");
  
let tiempo = getEl("tiempo");
let temas = getEl("temas");
let lightning = getEl("lightning");
let neon = getEl("neon");
let logo = getEl("logo");

let btnFinal = getEl("btn_final");
let btnPantallaCompleta = getEl("btn_pantalla_completa");
let btnLimpiar = getEl("btn_limpiar");
let btnEscribir = getEl("btn_escribir");
let btnDescargarTexto = getEl("btn_descargar_texto");
let btnOpciones = getEl("btn_opciones");
let btnVolver = getEl("btn_volver");
let btnContraerAcciones = getEl("btn_contraer_acciones");
let btnSilencio = getEl("btn_silencio");
let partidaAccionesToggleWrap = getEl("partida_acciones_toggle_wrap");
let partidaAccionesToggle = getEl("partida_acciones_toggle");
let div_opciones = getEl("opciones");
let desventajaOverlay = getEl("desventajaOverlay");
let desventajaStatus = getEl("desventajaStatus");
let desventajaSlot = getEl("desventajaSlot");
let desventajaReel1 = getEl("desventajaReel1");
let desventajaReel2 = getEl("desventajaReel2");
let desventajaReel3 = getEl("desventajaReel3");
let desventajaChoices = getEl("desventajaChoices");
let desventajaLegend = getEl("desventajaLegend");
let desventajaChoiceTimer = getEl("desventajaChoiceTimer");
let desventajaChoiceTimerFill = getEl("desventajaChoiceTimerFill");

let tiempo_cambio_palabras_input = document.getElementById('tiempo_cambio_palabras');
let tiempo_cambio_letra_input = document.getElementById('tiempo_cambio_letra');
let tiempo_modos_input = document.getElementById('tiempo_modos');
let tiempo_inicial_input = document.getElementById('tiempo_inicial');

function obtenerCompartidoGameplay1P() {
    if (typeof window === "undefined" || !window.scrib1pGameplayShared) {
        return null;
    }
    return window.scrib1pGameplayShared;
}

function leerNumeroCompartidoGameplay1P(clave, fallback) {
    const compartido = obtenerCompartidoGameplay1P();
    if (!compartido) return fallback;
    const valor = Number(compartido[clave]);
    return Number.isFinite(valor) ? valor : fallback;
}

function leerLimiteTotalGameplay1P() {
    return leerNumeroCompartidoGameplay1P("LIMITE_TOTAL", 10);
}

function leerSecsBaseGameplay1P() {
    return leerNumeroCompartidoGameplay1P("SECS_BASE", 2);
}

function leerMaxIncrementoGameplay1P() {
    return leerNumeroCompartidoGameplay1P("maxIncremento", 3);
}

function leerMaxIncrementoDestrezaGameplay1P() {
    return leerNumeroCompartidoGameplay1P("maxIncrementoDestreza", 0.5);
}

function leerRapidezBorradoGameplay1P() {
    return leerNumeroCompartidoGameplay1P("rapidez_borrado", 3000);
}

function leerRapidezInicioBorradoGameplay1P() {
    return leerNumeroCompartidoGameplay1P("rapidez_inicio_borrado", 3000);
}

function escribirRapidecesGameplay1P(rapidezBorrado, rapidezInicioBorrado) {
    const compartido = obtenerCompartidoGameplay1P();
    if (compartido) {
        compartido.rapidez_borrado = rapidezBorrado;
        compartido.rapidez_inicio_borrado = rapidezInicioBorrado;
        return;
    }
    try {
        rapidez_borrado = rapidezBorrado;
        rapidez_inicio_borrado = rapidezInicioBorrado;
    } catch (_error) {}
}

function leerAtributosGameplay1P() {
    const compartido = obtenerCompartidoGameplay1P();
    if (compartido && compartido.atributos) {
        return compartido.atributos;
    }
    if (typeof atributos !== "undefined" && atributos) {
        return atributos;
    }
    return { fuerza: 0, agilidad: 0, destreza: 0 };
}

function animarCSSJuego1P(element, animation, prefix = "animate__") {
    if (typeof animateCSS === "function") {
        return animateCSS(element, animation, prefix);
    }
    return Promise.resolve("Animation skipped");
}

function leerEstadoCompartidoGameplay1P(clave, fallback = null) {
    const compartido = obtenerCompartidoGameplay1P();
    if (!compartido || !(clave in compartido)) {
        return fallback;
    }
    const valor = compartido[clave];
    return typeof valor === "undefined" ? fallback : valor;
}

function escribirEstadoCompartidoGameplay1P(clave, valor) {
    const compartido = obtenerCompartidoGameplay1P();
    if (!compartido) return;
    compartido[clave] = valor;
}

function limpiarTimeoutCompartidoGameplay1P(clave) {
    clearTimeout(leerEstadoCompartidoGameplay1P(clave));
    escribirEstadoCompartidoGameplay1P(clave, null);
}

function limpiarIntervalCompartidoGameplay1P(clave) {
    clearInterval(leerEstadoCompartidoGameplay1P(clave));
    escribirEstadoCompartidoGameplay1P(clave, null);
}

