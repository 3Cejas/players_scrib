// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
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

if (tiempo) {
    tiempo.style.display = "none";
}

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";

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

function actualizarBarraVida(elemento, texto) {
    if (!elemento) {
        return;
    }
    const total = extraerSegundosTiempo(texto);
    if (total === null) {
        elemento.style.setProperty("--vida-pct", "0%");
        elemento.style.setProperty("--vida-color", "#d94b4b");
        elemento.style.display = "none";
        return;
    }
    const limitado = Math.min(Math.max(total, 0), VIDA_MAX_SEGUNDOS);
    const porcentaje = (limitado / VIDA_MAX_SEGUNDOS) * 100;
    const tono = Math.max(0, Math.min(120, porcentaje * 1.2));
    elemento.style.display = DISPLAY_BARRA_VIDA;
    elemento.style.setProperty("--vida-pct", `${porcentaje.toFixed(1)}%`);
    elemento.style.setProperty("--vida-color", `hsl(${tono}, 85%, 55%)`);
}

let terminado = false;
let clasificacion = getEl("clasificacion");
let notificacion = getEl("notificacion");
let fin_pag = getEl("fin_pag");
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
var intervalID = -1;
let timer = null;
let preparados_timer = null;
let sub_timer = null;
let listener_cuenta_atras = null;
let LIMITE_TIEMPO_INSPIRACION = 30;
const VENTAJAS_PUTADAS = [
    { emoji: "🐢", descripcion: "🐢 El teclado del contrincante irá más lento." },
    { emoji: "⚡", descripcion: "⚡ El videojuego borrará más rápido el texto del contrincante." },
    { emoji: "🙃", descripcion: "🙃 El texto se volverá un espejo para el contrincante." },
    { emoji: "🌪️", descripcion: "🌪️ Una pesada bruma caerá sobre el texto del contrincante." },
    { emoji: "🖊️", descripcion: "🖊️ El contrincante no podrá borrar su texto." }
];

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

const RETRASO_TECLADO_LENTO_MS = 500;
let teclado_lento_putada = false;
let timeout_teclado_lento = null;
let TIEMPO_MODIFICADOR = 0;

let temporizador_lectura_interval = null;
let temporizador_lectura_restante = 0;
let temporizador_lectura_activo = false;
let lectura_estado_guardado = null;
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
    const enhorabuenaHtml = `<span style="color: lime;">¡Enhorabuena!</span>`;
    tarea.innerHTML = `${nombreHtml}, lee el fruto de tu creación. ${enhorabuenaHtml}`;
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
const calentamiento_semilla1 = getEl("calentamiento_semilla1");
const calentamiento_semilla2 = getEl("calentamiento_semilla2");
const calentamiento_objetivo = getEl("calentamiento_objetivo");
const calentamiento_intentos = getEl("calentamiento_intentos");
const calentamiento_aciertos = getEl("calentamiento_aciertos");
const calentamiento_input = getEl("calentamiento_input");
const calentamiento_enviar = getEl("calentamiento_enviar");

aplicarTecladoLento(campo_palabra);
aplicarTecladoLento(calentamiento_input);
const calentamiento_feedback = getEl("calentamiento_feedback");
const calentamiento_usadas = getEl("calentamiento_usadas");
let calentamiento_rol = "musa";
let calentamiento_activo = false;
let calentamiento_vista = false;
let calentamiento_estado_actual = "inactivo";
let calentamiento_pendiente_enviado = false;
let calentamiento_semilla_enviada = false;
let calentamiento_pendiente_anterior = false;
let calentamiento_bloqueado_revelacion = false;
let calentamiento_timeout_revelacion = null;
const CALENTAMIENTO_REVELADO_MS = 3000;
let calentamiento_revelacion_inicio = 0;
let calentamiento_ultimo_estado = null;
let calentamiento_timeout_ganado = null;
let calentamiento_sonido_ganado = null;
const CALENTAMIENTO_GANADO_MS = 8000;
let calentamiento_ultimo_ganado = "";
const CALENTAMIENTO_GANADO_ESPERA_MS = 3000;
let calentamiento_timeout_ganado_show = null;
let calentamiento_semillas_prev = { 1: "", 2: "" };
let calentamiento_semillas_reveladas = false;
let calentamiento_semillas_reveal_at = 0;
let calentamiento_timeout_semillas_reveal = null;
let calentamiento_semillas_ts = 0;
let calentamiento_objetivo_prev = "";
let calentamiento_ultimo_intento_id = null;
let calentamiento_timeout_intermedia_reveal = null;
const CALENTAMIENTO_INTERMEDIA_VISIBLE_MS = 2500;
let calentamiento_intermedia_visible_hasta = 0;
let calentamiento_intermedia_reveal_at = 0;

const mostrarFeedbackCalentamiento = (mensaje, esError = false) => {
    if (!calentamiento_feedback) return;
    const prefijo = esError ? "⚠️ " : "✨ ";
    calentamiento_feedback.innerHTML = `${prefijo}${mensaje}`;
    calentamiento_feedback.style.color = esError ? "#ff6b6b" : "#ffb35c";
};
const animarReveladoCalentamiento = (elemento) => {
    if (!elemento) return;
    elemento.classList.remove("calentamiento-revelar");
    void elemento.offsetWidth;
    elemento.classList.add("calentamiento-revelar");
    elemento.addEventListener("animationend", () => {
        elemento.classList.remove("calentamiento-revelar");
    }, { once: true });
};

const actualizarCalentamiento = (data) => {
    if (!data) return;
    calentamiento_ultimo_estado = data;
    calentamiento_activo = Boolean(data.activo);
    calentamiento_vista = Boolean(data.vista);
    calentamiento_rol = data.rol || "musa";
    calentamiento_estado_actual = data.estado || "inactivo";
    if (document.body) {
        document.body.classList.toggle("vista-calentamiento-musa", calentamiento_activo && calentamiento_vista);
    }
    if (calentamiento_section) {
        calentamiento_section.classList.toggle("activo", calentamiento_activo && calentamiento_vista);
    }
    if (!calentamiento_activo || !calentamiento_vista) {
        if (calentamiento_estado) {
            calentamiento_estado.textContent = calentamiento_activo ? "Calentamiento oculto." : "Calentamiento inactivo.";
        }
        if (calentamiento_input) calentamiento_input.disabled = true;
        if (calentamiento_enviar) calentamiento_enviar.disabled = true;
        calentamiento_bloqueado_revelacion = false;
        calentamiento_revelacion_inicio = 0;
        if (calentamiento_timeout_revelacion) {
            clearTimeout(calentamiento_timeout_revelacion);
            calentamiento_timeout_revelacion = null;
        }
        return;
    }
    const semillas = data.semillas || {};
    const semillasRecibidas = data.semillasRecibidas || {};
    const semilla1Recibida = Boolean(semillasRecibidas[1]);
    const semilla2Recibida = Boolean(semillasRecibidas[2]);
    const ultimoIntento = data.ultimoIntento || null;
    if (!ultimoIntento || !Array.isArray(ultimoIntento.palabras)) {
        calentamiento_ultimo_intento_id = null;
        calentamiento_intermedia_reveal_at = 0;
        if (calentamiento_timeout_intermedia_reveal) {
            clearTimeout(calentamiento_timeout_intermedia_reveal);
            calentamiento_timeout_intermedia_reveal = null;
        }
    } else if (ultimoIntento.id !== calentamiento_ultimo_intento_id) {
        if (calentamiento_timeout_intermedia_reveal) {
            clearTimeout(calentamiento_timeout_intermedia_reveal);
        }
        calentamiento_ultimo_intento_id = ultimoIntento.id;
        const esperaReveal = CALENTAMIENTO_REVELADO_MS + 250;
        calentamiento_intermedia_reveal_at = Date.now() + esperaReveal;
        calentamiento_timeout_intermedia_reveal = setTimeout(() => {
            const palabraA = ultimoIntento.palabras[0] || "--";
            const palabraB = ultimoIntento.palabras[1] || ultimoIntento.palabras[0] || "--";
            if (calentamiento_semilla1) {
                calentamiento_semilla1.textContent = palabraA;
                animarReveladoCalentamiento(calentamiento_semilla1);
            }
            if (calentamiento_semilla2) {
                calentamiento_semilla2.textContent = palabraB;
                animarReveladoCalentamiento(calentamiento_semilla2);
            }
            calentamiento_semillas_prev = { 1: palabraA, 2: palabraB };
            calentamiento_intermedia_visible_hasta = Date.now() + CALENTAMIENTO_INTERMEDIA_VISIBLE_MS;
            calentamiento_intermedia_reveal_at = 0;
        }, esperaReveal);
    }
    const ahora = Date.now();
    const intermediaVisible = ahora < calentamiento_intermedia_visible_hasta;
    const intermediaPendiente = calentamiento_intermedia_reveal_at && ahora < calentamiento_intermedia_reveal_at;
    const semillaA = semillas[1] || "";
    const semillaB = semillas[2] || "";
    const semillasListas = Boolean(semillaA && semillaB);
    const semillasTs = Number(data.semillasTs) || 0;
    if (!semillasListas) {
        calentamiento_semillas_reveladas = false;
        calentamiento_semillas_ts = 0;
        calentamiento_semillas_reveal_at = 0;
        if (calentamiento_timeout_semillas_reveal) {
            clearTimeout(calentamiento_timeout_semillas_reveal);
            calentamiento_timeout_semillas_reveal = null;
        }
    } else if (semillasTs && semillasTs !== calentamiento_semillas_ts) {
        calentamiento_semillas_ts = semillasTs;
        calentamiento_semillas_reveladas = false;
        if (calentamiento_timeout_semillas_reveal) {
            clearTimeout(calentamiento_timeout_semillas_reveal);
        }
        const esperaSemillas = CALENTAMIENTO_REVELADO_MS + 250;
        calentamiento_semillas_reveal_at = Date.now() + esperaSemillas;
        calentamiento_timeout_semillas_reveal = setTimeout(() => {
            calentamiento_semillas_reveladas = true;
            calentamiento_semillas_reveal_at = 0;
            if (!intermediaVisible && !intermediaPendiente) {
                if (calentamiento_semilla1) {
                    calentamiento_semilla1.textContent = semillaA || "--";
                    animarReveladoCalentamiento(calentamiento_semilla1);
                }
                if (calentamiento_semilla2) {
                    calentamiento_semilla2.textContent = semillaB || "--";
                    animarReveladoCalentamiento(calentamiento_semilla2);
                }
                calentamiento_semillas_prev = { 1: semillaA, 2: semillaB };
            }
        }, esperaSemillas);
    } else if (!semillasTs && semillasListas && !calentamiento_semillas_reveladas) {
        calentamiento_semillas_reveladas = true;
        calentamiento_semillas_reveal_at = 0;
    }
    const mostrarSemillas = !intermediaVisible && !intermediaPendiente && calentamiento_semillas_reveladas;
    if (mostrarSemillas) {
        const mostrar1 = semillaA || "--";
        const mostrar2 = semillaB || "--";
        if (calentamiento_semilla1) calentamiento_semilla1.textContent = mostrar1;
        if (calentamiento_semilla2) calentamiento_semilla2.textContent = mostrar2;
        calentamiento_semillas_prev = { 1: mostrar1, 2: mostrar2 };
    } else if (!intermediaVisible && !intermediaPendiente) {
        if (calentamiento_semilla1) calentamiento_semilla1.textContent = "--";
        if (calentamiento_semilla2) calentamiento_semilla2.textContent = "--";
    }
    if (calentamiento_objetivo) {
        const pendientePalabra = data.pendientePalabra || "";
        const pendienteSocketId = data.pendienteSocketId || "";
        const esRemitente = pendienteSocketId && socket && socket.id && pendienteSocketId === socket.id;
        const objetivoTexto = esRemitente ? (pendientePalabra || "--") : "--";
        calentamiento_objetivo.textContent = objetivoTexto;
        if (objetivoTexto !== "--" && objetivoTexto !== calentamiento_objetivo_prev) {
            animarReveladoCalentamiento(calentamiento_objetivo);
        }
        calentamiento_objetivo_prev = objetivoTexto;
    }
    if (semillas[1] && semillas[2]) {
        if (calentamiento_feedback && calentamiento_feedback.textContent.includes("Palabra enviada")) {
            calentamiento_feedback.textContent = "";
        }
    }
    if (calentamiento_intentos) calentamiento_intentos.textContent = data.intentos ?? 0;
    if (calentamiento_aciertos) calentamiento_aciertos.textContent = data.aciertos ?? 0;
    if (calentamiento_usadas) {
        const usadas = Array.isArray(data.usadas) ? data.usadas : [];
        calentamiento_usadas.textContent = usadas.length ? usadas.join(" | ") : "-";
    }
    if (!data.pendiente) {
        calentamiento_pendiente_enviado = false;
    }
    if (calentamiento_pendiente_anterior && !data.pendiente && calentamiento_estado_actual === "jugando") {
        if (calentamiento_timeout_revelacion) {
            clearTimeout(calentamiento_timeout_revelacion);
        }
        calentamiento_bloqueado_revelacion = true;
        calentamiento_revelacion_inicio = Date.now();
        calentamiento_timeout_revelacion = setTimeout(() => {
            calentamiento_bloqueado_revelacion = false;
            calentamiento_revelacion_inicio = 0;
            if (calentamiento_feedback && calentamiento_feedback.textContent.includes("Intento enviado")) {
                calentamiento_feedback.textContent = "";
            }
            if (calentamiento_ultimo_estado) {
                actualizarCalentamiento(calentamiento_ultimo_estado);
            }
        }, CALENTAMIENTO_REVELADO_MS);
    }
    calentamiento_pendiente_anterior = Boolean(data.pendiente);
    if (data.pendiente) {
        calentamiento_bloqueado_revelacion = false;
        calentamiento_revelacion_inicio = 0;
        if (calentamiento_timeout_revelacion) {
            clearTimeout(calentamiento_timeout_revelacion);
            calentamiento_timeout_revelacion = null;
        }
    }
    if (calentamiento_estado_actual !== "jugando") {
        calentamiento_bloqueado_revelacion = false;
        calentamiento_revelacion_inicio = 0;
        if (calentamiento_timeout_revelacion) {
            clearTimeout(calentamiento_timeout_revelacion);
            calentamiento_timeout_revelacion = null;
        }
    }
    if (calentamiento_bloqueado_revelacion && calentamiento_revelacion_inicio) {
        if (Date.now() - calentamiento_revelacion_inicio >= CALENTAMIENTO_REVELADO_MS) {
            calentamiento_bloqueado_revelacion = false;
            calentamiento_revelacion_inicio = 0;
            if (calentamiento_feedback && calentamiento_feedback.textContent.includes("Intento enviado")) {
                calentamiento_feedback.textContent = "";
            }
            if (calentamiento_ultimo_estado) {
                actualizarCalentamiento(calentamiento_ultimo_estado);
            }
        }
    }
    const esSemillaDoble = calentamiento_rol === "semilla_doble";
    const esSemilla = esSemillaDoble || calentamiento_rol === "semilla1" || calentamiento_rol === "semilla2";
    const posicionSemilla = esSemillaDoble
        ? (!semilla1Recibida ? 1 : (!semilla2Recibida ? 2 : null))
        : (calentamiento_rol === "semilla1" ? 1 : (calentamiento_rol === "semilla2" ? 2 : null));
    if (calentamiento_estado_actual !== "esperando_semillas" || !esSemilla) {
        calentamiento_semilla_enviada = false;
    } else if (esSemillaDoble && semilla1Recibida && !semilla2Recibida) {
        calentamiento_semilla_enviada = false;
    }
    let estadoTexto = "🔥 Calentamiento en curso.";
    let estadoAnimado = false;
    let puedeEnviar = false;
    let placeholder = "Palabra intermedia";

    if (calentamiento_estado_actual === "sin_musas") {
        estadoTexto = "👥 Esperando musas de este equipo.";
    } else if (calentamiento_estado_actual === "esperando_semillas") {
        const otraSemillaRecibida = posicionSemilla === 1 ? semilla2Recibida : (posicionSemilla === 2 ? semilla1Recibida : false);
        const semillaActualRecibida = posicionSemilla === 1 ? semilla1Recibida : (posicionSemilla === 2 ? semilla2Recibida : false);
        if (esSemilla && posicionSemilla && calentamiento_semilla_enviada && !esSemillaDoble && !otraSemillaRecibida) {
            estadoTexto = "⏳ Palabra semilla enviada. Espera a la otra musa.";
            placeholder = "Esperando otra palabra semilla";
            estadoAnimado = true;
            puedeEnviar = false;
        } else if (esSemilla && posicionSemilla && !semillaActualRecibida) {
            estadoTexto = `🌱 Eres musa semilla: escribe la palabra ${posicionSemilla}.`;
            placeholder = `Palabra semilla ${posicionSemilla}`;
            puedeEnviar = true;
        } else {
            estadoTexto = "⏳ Esperando palabras semilla";
            estadoAnimado = true;
        }
    } else if (calentamiento_estado_actual === "jugando") {
        if (data.pendiente) {
            estadoTexto = "🤝 Esperando otra musa para comparar";
            estadoAnimado = true;
        } else {
            estadoTexto = "🧠 Envia una palabra que se encuentre en medio de:";
        }
        if (calentamiento_bloqueado_revelacion) {
            estadoTexto = "🔮 Revelando nuevas palabras";
            estadoAnimado = true;
            puedeEnviar = false;
        } else {
            puedeEnviar = !calentamiento_pendiente_enviado;
        }
    } else if (calentamiento_estado_actual === "ganado") {
        estadoTexto = "";
    }

    if (calentamiento_estado) {
        if (estadoAnimado) {
            calentamiento_estado.innerHTML = `${estadoTexto}<span class="ellipsis"></span>`;
        } else {
            calentamiento_estado.textContent = estadoTexto;
        }
    }
    if (calentamiento_input) {
        calentamiento_input.placeholder = placeholder;
        calentamiento_input.disabled = !puedeEnviar;
    }
    if (calentamiento_enviar) {
        calentamiento_enviar.disabled = !puedeEnviar;
    }
};
const enviarCalentamiento = () => {
    if (!calentamiento_activo || !calentamiento_input) {
        return;
    }
    const palabra = calentamiento_input.value.trim();
    if (!palabra) {
        mostrarFeedbackCalentamiento("Escribe una palabra.", true);
        return;
    }
    if (/\s/.test(palabra)) {
        mostrarFeedbackCalentamiento("Envia solo una palabra, sin espacios.", true);
        return;
    }
    if (palabra.length > 10) {
        mostrarFeedbackCalentamiento("Maximo 10 caracteres.", true);
        return;
    }
    if (calentamiento_estado_actual === "esperando_semillas") {
        const semillasRecibidas = (calentamiento_ultimo_estado && calentamiento_ultimo_estado.semillasRecibidas) ? calentamiento_ultimo_estado.semillasRecibidas : {};
        const semilla1Recibida = Boolean(semillasRecibidas[1]);
        const semilla2Recibida = Boolean(semillasRecibidas[2]);
        let posicion = null;
        if (calentamiento_rol === "semilla1") {
            posicion = 1;
        } else if (calentamiento_rol === "semilla2") {
            posicion = 2;
        } else if (calentamiento_rol === "semilla_doble") {
            posicion = !semilla1Recibida ? 1 : (!semilla2Recibida ? 2 : null);
        }
        if (!posicion) {
            mostrarFeedbackCalentamiento("No eres musa semilla.", true);
            return;
        }
        socket.emit("calentamiento_semilla", { posicion, palabra });
        calentamiento_semilla_enviada = true;
        if (calentamiento_input) calentamiento_input.disabled = true;
        if (calentamiento_enviar) calentamiento_enviar.disabled = true;
        calentamiento_input.value = "";
        mostrarFeedbackCalentamiento("Palabra enviada. Espera a la otra musa.", false);
        return;
    }
    if (calentamiento_estado_actual !== "jugando") {
        mostrarFeedbackCalentamiento("El calentamiento no esta listo.", true);
        return;
    }
    socket.emit("calentamiento_intento", { palabra });
    calentamiento_pendiente_enviado = true;
    calentamiento_input.value = "";
    mostrarFeedbackCalentamiento("Intento enviado.", false);
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
const REGEX_NOMBRE_MUSA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$/;
const REGEX_LETRA_MUSA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

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
    }

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
        if (ventaja === "🐢") {
            activarTecladoLentoMusa();
        }
    });
}

socket.on('temporizador_gigante_inicio', (data) => {
    iniciarTemporizadorLectura(data && data.duracion);
});

socket.on('temporizador_gigante_detener', () => {
    cancelarTemporizadorLectura();
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    if (!nombre_musa) return;
    socket.emit('registrar_musa', { musa: player, nombre: nombre_musa });
    socket.emit('pedir_nombre');
    setTimeout(() => {
        socket.emit('pedir_texto');
    }, 80);
});

socket.on('calentamiento_estado_musa', (data) => {
    actualizarCalentamiento(data);
});

socket.on('calentamiento_error', (data) => {
    calentamiento_pendiente_enviado = false;
    if (calentamiento_estado_actual === "esperando_semillas") {
        calentamiento_semilla_enviada = false;
    }
    mostrarFeedbackCalentamiento(data && data.mensaje ? data.mensaje : "Error.", true);
});

socket.on('calentamiento_ganado', (data) => {
    calentamiento_pendiente_enviado = false;
    const palabra = data && data.palabra ? data.palabra : "";
    const mensaje = palabra
        ? "\u00a1Las musas hab\u00e9is acertado! La palabra ha sido \u00ab<span class=\"calentamiento-palabra-ganadora\">" + escapeHtml(palabra) + "</span>\u00bb."
        : "\u00a1Las musas hab\u00e9is acertado!";
    if (calentamiento_timeout_ganado_show) {
        clearTimeout(calentamiento_timeout_ganado_show);
    }
    if (calentamiento_timeout_ganado) {
        clearTimeout(calentamiento_timeout_ganado);
    }
    calentamiento_timeout_ganado_show = setTimeout(() => {
        calentamiento_ultimo_ganado = mensaje;
        mostrarFeedbackCalentamiento(mensaje, false);
        if (typeof confetti_musas === "function") {
            confetti_musas();
        }
        if (typeof Audio !== "undefined") {
            if (!calentamiento_sonido_ganado) {
                calentamiento_sonido_ganado = new Audio("../../audio/FX/9. ESTRELLAS.mp3");
            }
            calentamiento_sonido_ganado.currentTime = 0;
            calentamiento_sonido_ganado.play().catch(() => {});
        }
        calentamiento_timeout_ganado = setTimeout(() => {
            if (calentamiento_feedback && calentamiento_feedback.textContent.includes("hab\u00e9is acertado")) {
                calentamiento_feedback.textContent = "";
            }
        }, CALENTAMIENTO_GANADO_MS);
    }, CALENTAMIENTO_GANADO_ESPERA_MS);
});

// Variables de los modos.
let modo_actual = "";
let niveles_bloqueados = true;
let tempo_text_borroso;
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
    nivelesContenedor.style.setProperty("--equipo-color", colorEquipo || "#00f5ff");
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
    setNivelesDesactivados(terminado || !modo_actual || niveles_bloqueados);
    resetearScrollNiveles();
    actualizarColorEquipo();
    recalcularLineaNiveles();
});

function actualizarNiveles(modo) {
    if (!nivelesItems.length) return;
    const indice = NIVELES_ORDEN.indexOf(modo);
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
    nivelesItems.forEach((item, idx) => {
        item.classList.toggle("nivel-pasado", indice >= 0 && idx < indice);
        item.classList.toggle("nivel-activo", idx === indice);
        item.classList.toggle("nivel-futuro", indice < 0 || idx > indice);
        item.setAttribute("aria-current", idx === indice ? "step" : "false");
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

// Recibe los datos del jugador 1 y los coloca.
function handler_recibir_texto_x(data) {
if(data.text != null) texto1.innerHTML = data.text;
    if(data.points != null) puntos1.innerHTML = formatearPuntos(data.points);
    if(mostrar_texto.value == 1){
        //texto1.style.height = ""; // resetear la altura
        texto1.style.height = "auto";
    }
    if (jugador_psico == 1) {
        stylize();
    }
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
}

socket.on(texto_x, handler_recibir_texto_x);

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", data => {
    if(data.player == player){
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
        actualizarBarraVida(tiempo, data.count);
    }
    if (data.count == "¡Tiempo!") {
        confetti_aux();

        limpiezas_final();

        //texto1.innerText = (texto1.innerText).substring(saltos_línea_alineacion_1, texto1.innerText.length);
        //texto2.value = (texto2.value).substring(saltos_línea_alineacion_2, texto2.value.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');
        // Variable booleana que dice si la ronda ha terminado o no.
        //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
        //texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
        mostrar_texto.backgroundColor = "green";

        mostrar_texto.value = 1;
        notificacion.style.display = "none";
    }
}
});

// Inicia el juego.
socket.on('inicio', data => {
    LIMITE_TIEMPO_INSPIRACION = data.parametros.LIMITE_TIEMPO_INSPIRACION;
    TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR || TIEMPO_MODIFICADOR;
    resetearTemporizadorLectura();
    limpiarTecladoLentoMusa();
    terminado = false;
    niveles_bloqueados = true;
    setNivelesDesactivados(false);
    actualizarNiveles("");
    tiempo.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    tiempo.style.display = "";
    tiempo.style.color = "white"

    animateCSS(".contenedor", "pulse");

    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADOS?</span>'); 
    preparados.appendTo($('.container'));
    preparados_timer = setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);

    setTimeout(() => {

    var counter = 3;
  
    timer = setInterval(function() {
      
      $('#countdown').remove();
      
      var countdown = $('<span id="countdown">'+(counter==0?'¡ESCRIBE!':counter)+'</span>'); 
      countdown.appendTo($('.container'));
  
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
        setTimeout(() => {
          $('#countdown').remove();
        }, 1000);
  

    }
  }, 1000);
}, 1000);
});

socket.on("post-inicio", () => {
                resetearTemporizadorLectura();
                socket.off('vote');
                socket.off('exit');
                socket.off('scroll');
                socket.off('temas_jugadores');
                //socket.off('recibir_comentario');
                socket.off('recibir_postgame1');
                socket.off('recibir_postgame2');
    
                limpiezas();
                /*
                skill.style = 'animation: brillo 2s ease-in-out;'
                skill.style.display = "flex";
                */
    
                texto1.style.height = "4.5em";
                texto1.rows =  "3";
});

// Resetea el tablero de juego.
socket.on('limpiar', () => {
    skill.style = 'animation: brillo 2s ease-in-out;'
    resetearTemporizadorLectura();
    limpiarTecladoLentoMusa();
    // Recibe el nombre del jugador y lo coloca en su sitio.
    socket.on(nombre, data => {
        nombre1.value = data;
    });

    limpiezas();

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

});

// Recibe el nombre del jugador y lo coloca en su sitio.
socket.on(nombre, data => {
    nombre1.value = data;
});

socket.on(elegir_ventaja, (data = {}) => {
    console.log("MODO ACTUAL", modo_actual);
    console.log("REVERTIR", false);
    cambiar_jugadores(false);
    texto1.style.color = "white";
    votando_ = true;
    confetti_musas();
    const opciones = obtenerOpcionesVentaja(data.opciones);
    const botones = opciones
        .map(op => `<button class='btn btn-ventaja' value='${op.emoji}' onclick='elegir_ventaja_publico(this)'>${op.emoji}</button>`)
        .join("");
    const explicaciones = opciones
        .map(op => op.descripcion)
        .join("<br><br>");
    tarea.innerHTML =
        "<p>¡" +
        "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" +
        nombre1.value +
        "</span>" +
        " está realmente inspirado!<br>Elige una ventaja:</p>" +
        botones +
        "<br><br><p style='font-size: 3.5vw;'>" + explicaciones + "</p>";
    enviarPalabra_boton.style.display = "none";
    campo_palabra.style.display = "none";
    recordatorio.innerHTML = "";
    animateCSS(".notificacion", "flash");
});

socket.on("elegir_repentizado", ({seleccionados, TIEMPO_VOTACION}) => {
    votando = true;
    tarea.innerHTML = "<p>¿Por donde quieres que continúe la historia?</p><button class='btn repentizado' value = '1' onclick='elegir_repentizado_publico(this)'>"+ seleccionados[0] + "</button><br><br><button class='btn' value = '2' onclick='elegir_repentizado_publico(this)'>"+ seleccionados[1] + "</button><br><br><button class='btn' value = '3' onclick='elegir_repentizado_publico(this)'>"+ seleccionados[2] + "</button>"
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
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
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
        tarea.innerHTML = "Cántame a mí, " + etiquetaMusa + ", una palabra que me inspire:"
    }
    if(juego.modo_actual == "letra bendita") {
        letra = juego.letra_bendita;
        tarea.innerHTML = "Cántame a mí, " + etiquetaMusa + ", una palabra que lleve la letra " + "<span style='color: green;'>" + letra.toUpperCase(); + "</span> :";
    }
    if(juego.modo_actual == "letra prohibida") {
        letra = juego.letra_prohibida;
        tarea.innerHTML = "Cántame a mí, " + etiquetaMusa + ", una palabra que <span style='color: red;'>NO</span> lleve la letra " + "<span style='color: red;'>" + letra.toUpperCase(); + "</span> :";
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
        tarea.innerHTML = "<br><br><br>" + etiquetaMusa + ", mira a " + "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" + nombre1.value + "</span>" + " y " + "<span style='color: blue;'>CUENTA</span>" + " todo aquello que le has querido decir hasta ahora.";
    
    }

    if(juego.modo_actual == "frase final") {
        campo_palabra.value = "none";
        enviarPalabra_boton.style.display = "none";
        campo_palabra.style.display = "none";
        tarea.innerHTML = "<br><br><br>" + etiquetaMusa + ", " + "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" +  nombre1.value + "</span>" + " va a TERMINAR su obra gracias a ti. 🤍";
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
    //var tamaño_letra = getRandNumber(7, 35)
    //text.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = getTextAlign();
    //texto2.style.textAlign = getTextAlign();
    //texto2.style.fontFamily = getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
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
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

// Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
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

// Función auxiliar que elimina los saltos de línea al principio de un string.
function eliminar_saltos_de_linea(texto) {
    var i = 0;
    while (texto[i] == "\n") {
        i++;
    }
    return (texto.substring(i, texto.length));
}

// Función auxiliar que genera un string con n saltos de línea.
function crear_n_saltos_de_linea(n) {
    var saltos = "";
    var cont = 0;
    while (cont <= n) {
        saltos += "\n";
        cont++;
    }
    return saltos;
}

// FUNCIONES AUXILIARES PARA LA ELECCIÓN ALEATORIA DEL TEMA.
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

function limpiezas(){
    stopConfetti()
    clearInterval(intervalID)
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);
    clearTimeout(sub_timer);
    clearTimeout(preparados_timer);
    limpiar_colddown()
    cambiar_jugadores(false);
    skill.style.display = "none";
    skill.style.border = "0.5vw solid greenyellow";
    skill_cancel.style.display = "none";
    texto1.innerText = "";

    puntos1.innerHTML = 0 + " palabras";
   
    
    puntos1.style.color = "white";  
    votando = false;
    texto1.style.height = "4.5em"; /* Alto para tres líneas de texto */
    texto1.scrollTop = texto1.scrollHeight;
    mostrar_texto.backgroundColor = "red";

    mostrar_texto.value = 0;
    setNivelesDesactivados(false);
    niveles_bloqueados = true;
    actualizarNiveles("");
}

function limpiezas_final(){
    clearInterval(interval_cooldown);
    limpiar_colddown()
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
// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto1.addEventListener("keyup", (evt) => {
    console.log(evt.key)
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
  
    }
  });
  // Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
  texto1.addEventListener("keydown", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
  
    }
  });
  
  // Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
  texto1.addEventListener("press", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
  
    }
  });

function limpiar_colddown(){
    clearInterval(interval_cooldown);
    text_progress.removeEventListener('mouseenter', onMouseEnter);
    text_progress.removeEventListener('mouseleave', onMouseLeave);
    bar_progress.style.width = '0%'
    //button.disabled = false; // Habilita el botón
    text_progress.style.color = "orange";
    text_progress.innerHTML = "🚀 Inspirar"
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
  if(target.textContent == '✏️'){
        editando = true;
        mostrar_texto.value = 0;
        mostrarTextoCompleto(mostrar_texto);
        texto1.contentEditable= "true";
        target.textContent = '✉️';
        skill_cancel.style.display = "flex";
    return
  }
  if(!target.classList.contains(SKILL_CLASS)) return;

  if(target.textContent == '✉️'){
    
    feedback_texto_editado.innerHTML = "¡Texto editado!"
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
    target.textContent = '✏️'
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
        target.textContent = '✏️';
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
    skill.textContent = '✏️';
}
// Add click handler to the table
skill.addEventListener('click', activateSkill, false);

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

  function confetti_musas(){
    var scalar = 2;
    var unicorn = confetti.shapeFromText({ text: '⭐', scalar });
    isConfettiRunning = true; // Habilita la ejecución de confetti
    
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

    // Función de mapeo clara y reversible
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

    // 4) Aplicar estilos según el jugador resultante
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
