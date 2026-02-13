let countInterval;
let countInterval1;
let listener_cuenta_atras;
let time_minutes; // Value in minutes
let time_seconds; // Value in seconds
let secondsRemaining;
let secondsRemaining1;
let secondsPassed;
let impro_estado = false;
let fin_j1 = false;
let fin_j2 = false;
let terminado = false;
let terminado1 = false;
let juego_iniciado = false;
let pausado = false;
let intervalId;  // Guarda el ID del setInterval para poder limpiarlo luego
let TimeoutTiempoMuerto;  // Guarda el ID del setInterval para poder limpiarlo luego
let vista_calentamiento = false;
let temporizador_gigante_activo = false;
let regalo_musas_enviado = false;

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "flex";

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


function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function startCountDown_p1(duration) {

    secondsRemaining = duration;

    let min;
    let sec;
    clearInterval(countInterval);
    countInterval = setInterval(function () {
        display_modo.style.color = COLORES_MODOS[modo_actual]; // Asignar color al texto del label
        display_modo.textContent = modo_actual.toUpperCase();
        console.log("modo_actual", modo_actual)
        console.log("DURACION_TIEMPO_MODOS", DURACION_TIEMPO_MODOS)
        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        actualizarBarraVida(tiempo, tiempo.textContent);
        if (window.registrarTiempoControl) {
            window.registrarTiempoControl(1, secondsRemaining);
        }
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        console.log('count', {count, player:1})
        socket.emit('count', {count, player:1});
        if (secondsRemaining == 20) {
            tiempo.style.color = "yellow"
        }
        if (secondsRemaining == 10) {
            tiempo.style.color = "red"
        }
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining <= 0) {
            final(1);
        };

    }, 1000);
}

function startCountDown_p2(duration) {
    secondsRemaining1 = duration;
    let min1;
    let sec1;
    clearInterval(countInterval1);
    countInterval1 = setInterval(function () {

        min1 = parseInt(secondsRemaining1 / 60);
        sec1 = parseInt(secondsRemaining1 % 60);

        tiempo1.textContent = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
        actualizarBarraVida(tiempo1, tiempo1.textContent);
        if (window.registrarTiempoControl) {
            window.registrarTiempoControl(2, secondsRemaining1);
        }
        count1 = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
        socket.emit('count', {count : count1, player: 2});
        if (secondsRemaining1 == 20) {
            tiempo1.style.color = "yellow"
        }
        if (secondsRemaining1 == 10) {
            tiempo1.style.color = "red"
        }
        secondsRemaining1 = secondsRemaining1 - 1;
        if (secondsRemaining1 <= 0) {
            final(2);
        };

    }, 1000);
}

function addSeconds(secs) {
    secondsRemaining += secs;
    if(secondsRemaining < 0){
        secondsRemaining = 0;
    }  
    min = parseInt(secondsRemaining / 60);
    sec = parseInt(secondsRemaining % 60);

    tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    actualizarBarraVida(tiempo, tiempo.textContent);
    count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    if (window.registrarTiempoControl) {
        window.registrarTiempoControl(1, secondsRemaining);
    }
}

function addSeconds1(secs) {
    secondsRemaining1 += secs;
    if(secondsRemaining1 < 0){
        secondsRemaining1 = 0;
    }  
    min1 = parseInt(secondsRemaining1 / 60);
    sec1 = parseInt(secondsRemaining1 % 60);

    tiempo1.textContent = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
    actualizarBarraVida(tiempo1, tiempo1.textContent);
    count1 = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
    console.log(min1)
    console.log("JOOOOOOOOO", count1)
    if (window.registrarTiempoControl) {
        window.registrarTiempoControl(2, secondsRemaining1);
    }
}

function normalizarFraseFinal(valor) {
    let texto = (valor || "").trim();
    if (texto.startsWith("\u00ab") && texto.endsWith("\u00bb") && texto.length > 1) {
        texto = texto.slice(1, -1).trim();
    }
    texto = texto.replace(/^["\u201c]+/, "").replace(/["\u201d]+$/, "").trim();
    return texto;
}

function temp() {
    console.log(frase_final_j1.value)
    const fraseJ1 = normalizarFraseFinal(frase_final_j1.value);
    const fraseJ2 = normalizarFraseFinal(frase_final_j2.value);
    var checkboxFraseFinal = document.querySelector('input[type="checkbox"][value="frase final"]');
    console.log(checkboxFraseFinal)
    if((!fraseJ1 || !fraseJ2) && checkboxFraseFinal && checkboxFraseFinal.checked){
        if(!fraseJ1){
        alert("Falta introducir una frase inicial para " + nombre1.value + ".")
        }
        else{
            alert("Falta introducir una frase inicial para " + nombre2.value + ".")
        }
    }
    else{
    if (window.resetResumenPartida) {
        window.resetResumenPartida();
    }
    terminado = false;
    terminado1 = false;
    regalo_musas_enviado = false;
    fin_j1 = false;
    fin_j2 = false;
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("definicion").innerHTML = "";
    tiempo.style.color = "white"
    tiempo1.style.color = "white"

    clearInterval(countInterval);
    clearInterval(countInterval1);

    let duration;

    // --------------------------------------------------
// 3A. DESESTRUCTURACION DE OBJETO
// --------------------------------------------------
// Nota: al asignar a variables ya declaradas, debemos envolver
// la destructuracion entre parentesis para evitar que JS lo interprete
// como un bloque de codigo.
({
    minutos: time_minutes,
    segundos: time_seconds,
    totalSegundos: duration
  } = obtenerTotalSegundos());
  
  console.log('Objeto ->', time_minutes, time_seconds, duration);

    tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    tiempo1.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    actualizarBarraVida(tiempo, tiempo.textContent);
    actualizarBarraVida(tiempo1, tiempo1.textContent);

    count = tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;    
    count1 = tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;   

    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        boton_pausar_reanudar.innerHTML = "\u{23F8}\u{FE0F} PAUSAR";
    }
    rellenarListaModos();
    actualizarVariables();
    socket.emit('inicio', {count, borrar_texto : false, parametros: {DURACION_TIEMPO_MODOS, LISTA_MODOS, LISTA_MODOS_LOCURA, TIEMPO_CAMBIO_LETRA, TIEMPO_CAMBIO_PALABRAS, TIEMPO_VOTACION, PALABRAS_INSERTADAS_META, TIEMPO_MODIFICADOR, LIMITE_TIEMPO_INSPIRACION, FRASE_FINAL_J1: fraseJ1, FRASE_FINAL_J2: fraseJ2} });
    juego_iniciado = true;
    modo_actual = "";
  
    DURACION_TIEMPO_MODOS = TIEMPO_MODOS;
    
    listener_cuenta_atras = setTimeout(function(){
        console.log({count1, player:2})
        socket.emit('count', {count, player:1});
        socket.emit('count', {count : count1, player:2});
        console.log(duration, tiempo)
        duration = duration - 1;
        startCountDown_p1(duration);
        startCountDown_p2(duration);

    }, 8000);
}
};


function obtenerTotalSegundos() {
    // Lectura y saneado de los inputs (suponemos que existen en el DOM)
    const mRaw = parseInt(document.getElementById('tiempo_minutos').value, 10);
    const sRaw = parseInt(document.getElementById('tiempo_segundos').value, 10);
  
    // Validación de rangos y normalización
    const m = Math.min(Math.max(mRaw || 0, 0), 60);
    const s = Math.min(Math.max(sRaw || 0, 0), 59);
  
    // Retornamos un objeto con los tres valores
    return {
      minutos: m,
      segundos: s,
      totalSegundos: m * 60 + s
    };
  }

function cambiarValor(campoId, incremento) {
    const input = document.getElementById(campoId);
    if (!input) return;

    let valorActual = parseInt(input.value, 10);
    if (isNaN(valorActual)) {
        valorActual = 0;
    }

    let nuevoValor = valorActual + incremento;
    const min = parseInt(input.min, 10) || Number.MIN_SAFE_INTEGER;
    const max = parseInt(input.max, 10) || Number.MAX_SAFE_INTEGER;
    const stepAttr = parseInt(input.step, 10);
    const step = Number.isNaN(stepAttr) ? Math.abs(incremento) : stepAttr;

    if (!Number.isNaN(step) && step > 0) {
        nuevoValor = Math.round(nuevoValor / step) * step;
    }

    if (nuevoValor < min) {
        nuevoValor = min;
    } else if (nuevoValor > max) {
        nuevoValor = max;
    }

    input.value = nuevoValor;
}

function vote() {
    socket.emit('vote', "nada");
};

function exit() {
    socket.emit('exit', "nada");
};

function temas() {
    palabras = tema.value.split(",")
    socket.emit('temas', palabras);
};

function limpiar() {
    //document.getElementById("nombre").value = "ESCRITXR 1";
    //document.getElementById("nombre1").value = "ESCRITXR 2";
    display_modo.style.color = "white";
    display_modo.textContent = "Ninguno";
    tiempo_modos_secs.textContent = "0 segundos";
    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        boton_pausar_reanudar.innerHTML = "\u{23F8}\u{FE0F} PAUSAR";
    }
    texto_guardado1 = texto1.innerText;
    texto_guardado2 = texto2.innerText;
    //texto1.innerText = "";
    //texto2.innerText = "";
    juego_iniciado = false;
    regalo_musas_enviado = false;
    document.getElementById("puntos").innerHTML = "0 palabras";
    document.getElementById("puntos1").innerHTML = "0 palabras";
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("texto").style.height = "40";
    document.getElementById("texto").style.height = (document.getElementById("texto").scrollHeight) + "px";
    document.getElementById("texto1").style.height = "40";
    document.getElementById("texto1").style.height = (document.getElementById("texto1").scrollHeight) + "px";
    document.getElementById("definicion").innerHTML = "";
    document.getElementById("explicación").innerHTML = "";
    socket.emit('limpiar', false);

    DURACION_TIEMPO_MODOS = DURACION_TIEMPO_MODOS;
    clearInterval(listener_cuenta_atras);
    clearInterval(countInterval);
    clearInterval(countInterval1);
    clearTimeout(tempo_text_borroso);
    clearTimeout(TimeoutTiempoMuerto);
    temporizador_gigante_activo = false;

    tiempo.innerHTML = "";
    tiempo1.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    actualizarBarraVida(tiempo1, tiempo1.innerHTML);
    document.getElementById("texto").classList.remove('textarea_blur');
    document.getElementById("texto1").classList.remove('textarea_blur');
    puntuacion_final1.innerHTML = "";
    puntuacion_final2.innerHTML = "";
    //socket.emit('count', "");
    if (feedback1 !== null) {
        feedback1.innerHTML = "";
    }
    if (feedback2 !== null) {
        feedback2.innerHTML = "";
    }
    if (typeof resetearHeatmap === "function") {
        resetearHeatmap();
    }
    if (window.resetResumenPartida) {
        window.resetResumenPartida();
    }
};

function borrar_texto_guardado() {
    texto_guardado1 = "";
    texto_guardado2 = "";
    socket.emit('borrar_texto_guardado');
}

function activar_temporizador_gigante() {
    if (temporizador_gigante_activo) {
        temporizador_gigante_activo = false;
        socket.emit('temporizador_gigante_detener', {});
        return;
    }
    temporizador_gigante_activo = true;
    socket.emit('activar_temporizador_gigante', { duracion: 10 * 60 });
}

function fin(player) {
    if(player == 1){
        fin_j1 = true
        final(1);
    }
    else if(player == 2){
        fin_j2 = true
        final(2);
    }
    if(fin_j1 && fin_j2){
        fin_j1 = false;
        fin_j2 = false;
        juego_iniciado = false;

    }
    socket.emit('fin_de_control', player);
};

function cambiar_vista() {
    socket.emit('cambiar_vista', 'nada');
};

function cambiar_vista_calentamiento(boton) {
    vista_calentamiento = !vista_calentamiento;
    actualizarBotonVistaCalentamiento(boton);
    socket.emit('cambiar_vista_calentamiento', { activo: vista_calentamiento });
}

function actualizarBotonVistaCalentamiento(boton) {
    const destino = boton || document.getElementById("boton_vista_calentamiento");
    if (!destino) return;
    destino.textContent = vista_calentamiento ? "\u{1F3AE} VISTA PARTIDA" : "\u{1F525} VISTA CALENTAMIENTO";
    destino.dataset.activo = vista_calentamiento ? "1" : "0";
}

const TIPOS_SOLICITUD_CALENTAMIENTO = new Set(["libre", "lugares", "acciones", "frase_final"]);
const ETIQUETAS_SOLICITUD_CALENTAMIENTO = {
    libre: "LIBRE",
    lugares: "LUGARES",
    acciones: "ACCIONES",
    frase_final: "PALABRAS PARA FRASE FINAL"
};
let solicitud_calentamiento_actual = "libre";

function actualizarSolicitudCalentamientoControl(payload = {}) {
    const tipoRecibido = (payload && typeof payload.solicitud === "string")
        ? payload.solicitud
        : (payload && typeof payload.tipo === "string" ? payload.tipo : "libre");
    const tipo = TIPOS_SOLICITUD_CALENTAMIENTO.has(tipoRecibido) ? tipoRecibido : "libre";
    solicitud_calentamiento_actual = tipo;

    const botones = document.querySelectorAll("[data-solicitud-calentamiento]");
    botones.forEach((boton) => {
        const activo = boton.dataset.solicitudCalentamiento === tipo;
        boton.dataset.active = activo ? "1" : "0";
        boton.classList.toggle("is-active", activo);
    });

    const estado = document.getElementById("calentamiento_solicitud_actual");
    if (estado) {
        const etiqueta = ETIQUETAS_SOLICITUD_CALENTAMIENTO[tipo] || ETIQUETAS_SOLICITUD_CALENTAMIENTO.libre;
        estado.textContent = `CONSIGNA ACTUAL: ${etiqueta}`;
    }
}

function pedir_solicitud_calentamiento(tipo) {
    const destino = TIPOS_SOLICITUD_CALENTAMIENTO.has(tipo) ? tipo : "libre";
    socket.emit("calentamiento_solicitud", { tipo: destino });
    actualizarSolicitudCalentamientoControl({ tipo: destino });
}

let parametros_visibles = false;
let teleprompter_visible = false;
let teleprompter_emit_timeout = null;
let teleprompter_play_raf = null;
let teleprompter_last_tick = null;

const TELEPROMPTER_FONT_MIN = 18;
const TELEPROMPTER_FONT_MAX = 80;
const TELEPROMPTER_SPEED_MIN = 5;
const TELEPROMPTER_SPEED_MAX = 200;

const teleprompter_state = {
    visible: false,
    text: "",
    fontSize: 36,
    speed: 25,
    playing: false,
    scroll: 0,
    source: 0
};

const animateCSS = (element, animation, prefix = "animate__") =>
    new Promise((resolve) => {
        const node = typeof element === "string" ? document.querySelector(element) : element;
        if (!node) {
            resolve("no-node");
            return;
        }

        const animationName = `${prefix}${animation}`;
        node.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve("Animation ended");
        }

        node.addEventListener("animationend", handleAnimationEnd, { once: true });
    });

function toggleParametros() {
    if (teleprompter_visible) {
        toggleTeleprompter(true);
        parametros_visibles = false;
        const panelControles = document.getElementById("panel_controles");
        const panelParametros = document.getElementById("panel_parametros");
        const panelParametrosExtra = document.getElementById("panel_parametros_extra");
        const boton = document.getElementById("boton_parametros");
        if (panelParametros) {
            panelParametros.classList.add("panel-oculto");
        }
        if (panelParametrosExtra) {
            panelParametrosExtra.classList.add("panel-oculto");
        }
        if (panelControles) {
            panelControles.classList.remove("panel-oculto");
            animateCSS(panelControles, "backInLeft");
        }
        if (boton) {
            boton.textContent = "\u2699\uFE0F PAR\u00C1METROS";
        }
        return;
    }
    parametros_visibles = !parametros_visibles;
    const panelControles = document.getElementById("panel_controles");
    const panelParametros = document.getElementById("panel_parametros");
    const panelParametrosExtra = document.getElementById("panel_parametros_extra");
    const boton = document.getElementById("boton_parametros");

    if (parametros_visibles) {
        if (panelControles) {
            animateCSS(panelControles, "backOutLeft").then(() => {
                panelControles.classList.add("panel-oculto");
            });
        }
        if (panelParametros) {
            panelParametros.classList.remove("panel-oculto");
            animateCSS(panelParametros, "backInLeft");
        }
        if (panelParametrosExtra) {
            panelParametrosExtra.classList.remove("panel-oculto");
            animateCSS(panelParametrosExtra, "backInLeft");
        }
    } else {
        if (panelParametros) {
            animateCSS(panelParametros, "backOutLeft").then(() => {
                panelParametros.classList.add("panel-oculto");
            });
        }
        if (panelParametrosExtra) {
            animateCSS(panelParametrosExtra, "backOutLeft").then(() => {
                panelParametrosExtra.classList.add("panel-oculto");
            });
        }
        if (panelControles) {
            panelControles.classList.remove("panel-oculto");
            animateCSS(panelControles, "backInLeft");
        }
    }
    if (boton) {
        boton.textContent = parametros_visibles ? "\u{1F3AE} CONTROLES" : "\u2699\uFE0F PAR\u00C1METROS";
    }
}

function actualizarTeleprompterUI() {
    const fontLabel = document.getElementById("teleprompter_font_size");
    const speedLabel = document.getElementById("teleprompter_speed");
    const playBtn = document.getElementById("teleprompter_play");
    const fontMeter = document.getElementById("teleprompter_font_meter");
    const speedMeter = document.getElementById("teleprompter_speed_meter");
    if (fontLabel) {
        fontLabel.textContent = Math.round(teleprompter_state.fontSize);
    }
    if (speedLabel) {
        speedLabel.textContent = Math.round(teleprompter_state.speed);
    }
    if (playBtn) {
        playBtn.textContent = teleprompter_state.playing ? "\u23F8\uFE0F PAUSA" : "\u25B6\uFE0F PLAY";
    }
    if (fontMeter) {
        const pct = (teleprompter_state.fontSize - TELEPROMPTER_FONT_MIN) / (TELEPROMPTER_FONT_MAX - TELEPROMPTER_FONT_MIN);
        fontMeter.style.width = `${Math.max(0, Math.min(1, pct)) * 100}%`;
    }
    if (speedMeter) {
        const pct = (teleprompter_state.speed - TELEPROMPTER_SPEED_MIN) / (TELEPROMPTER_SPEED_MAX - TELEPROMPTER_SPEED_MIN);
        speedMeter.style.width = `${Math.max(0, Math.min(1, pct)) * 100}%`;
    }
    const botonTeleprompter = document.getElementById("boton_teleprompter");
    if (botonTeleprompter) {
        botonTeleprompter.textContent = teleprompter_visible ? "\u{1F399}\uFE0F CONTROLES" : "\u{1F399}\uFE0F TELEPROMPTER";
    }
    if (typeof actualizarBotonesTeleprompterCarga === "function") {
        actualizarBotonesTeleprompterCarga();
    }
}

function actualizarBotonesTeleprompterCarga() {
    const btnJ1 = document.getElementById("teleprompter_cargar_j1");
    const btnJ2 = document.getElementById("teleprompter_cargar_j2");
    const textoJ1 = (typeof texto1 !== "undefined" && texto1) ? (texto1.innerText || "").trim() : "";
    const textoJ2 = (typeof texto2 !== "undefined" && texto2) ? (texto2.innerText || "").trim() : "";
    const habilJ1 = textoJ1.length > 0;
    const habilJ2 = textoJ2.length > 0;
    if (btnJ1) {
        btnJ1.disabled = !habilJ1;
        btnJ1.classList.toggle("teleprompter-btn-disabled", !habilJ1);
    }
    if (btnJ2) {
        btnJ2.disabled = !habilJ2;
        btnJ2.classList.toggle("teleprompter-btn-disabled", !habilJ2);
    }
}

window.actualizarBotonesTeleprompterCarga = actualizarBotonesTeleprompterCarga;

function emitirTeleprompter(inmediato = false) {
    if (!socket) return;
    const textoActivo = typeof teleprompter_state.text === "string" && teleprompter_state.text.trim().length > 0;
    teleprompter_state.visible = teleprompter_visible && textoActivo;
    if (inmediato) {
        socket.emit('teleprompter_control', { state: { ...teleprompter_state } });
        return;
    }
    if (teleprompter_emit_timeout) return;
    teleprompter_emit_timeout = setTimeout(() => {
        teleprompter_emit_timeout = null;
        socket.emit('teleprompter_control', { state: { ...teleprompter_state } });
    }, 60);
}

function teleprompterPlayLoop(ts) {
    if (!teleprompter_state.playing) {
        teleprompter_play_raf = null;
        teleprompter_last_tick = null;
        return;
    }
    if (teleprompter_last_tick === null) {
        teleprompter_last_tick = ts;
    }
    const dt = (ts - teleprompter_last_tick) / 1000;
    teleprompter_last_tick = ts;
    if (dt > 0) {
        teleprompter_state.scroll += teleprompter_state.speed * dt;
        emitirTeleprompter();
    }
    teleprompter_play_raf = requestAnimationFrame(teleprompterPlayLoop);
}

function iniciarTeleprompterPlay() {
    if (teleprompter_play_raf) return;
    teleprompter_last_tick = null;
    teleprompter_play_raf = requestAnimationFrame(teleprompterPlayLoop);
}

function detenerTeleprompterPlay() {
    if (teleprompter_play_raf) {
        cancelAnimationFrame(teleprompter_play_raf);
    }
    teleprompter_play_raf = null;
    teleprompter_last_tick = null;
}

function toggleTeleprompter(forzarCerrar = false) {
    if (forzarCerrar) {
        teleprompter_visible = false;
    } else {
        teleprompter_visible = !teleprompter_visible;
    }
    const panelControles = document.getElementById("panel_controles");
    const panelTeleprompter = document.getElementById("panel_teleprompter");

    if (teleprompter_visible) {
        if (panelControles) {
            animateCSS(panelControles, "backOutLeft").then(() => {
                panelControles.classList.add("panel-oculto");
            });
        }
        if (panelTeleprompter) {
            panelTeleprompter.classList.remove("panel-oculto");
            animateCSS(panelTeleprompter, "backInLeft");
        }
        teleprompter_state.visible = true;
    } else {
        if (panelTeleprompter) {
            animateCSS(panelTeleprompter, "backOutLeft").then(() => {
                panelTeleprompter.classList.add("panel-oculto");
            });
        }
        if (panelControles) {
            panelControles.classList.remove("panel-oculto");
            animateCSS(panelControles, "backInLeft");
        }
        teleprompter_state.visible = false;
        teleprompter_state.playing = false;
        detenerTeleprompterPlay();
    }
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}

function teleprompterCargarTexto(jugador) {
    const textoFuente = jugador === 2 ? texto2 : texto1;
    const texto = textoFuente ? textoFuente.innerText : "";
    if (!texto || !texto.trim()) {
        if (typeof actualizarBotonesTeleprompterCarga === "function") {
            actualizarBotonesTeleprompterCarga();
        }
        return;
    }
    teleprompter_state.text = (texto || "").trim();
    teleprompter_state.scroll = 0;
    teleprompter_state.source = jugador === 2 ? 2 : 1;
    teleprompter_state.playing = false;
    teleprompter_state.visible = true;
    teleprompter_visible = true;
    detenerTeleprompterPlay();
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
}

function teleprompterSubir() {
    teleprompter_state.scroll = Math.max(0, teleprompter_state.scroll - 60);
    emitirTeleprompter(true);
}

function teleprompterBajar() {
    teleprompter_state.scroll += 60;
    emitirTeleprompter(true);
}

function teleprompterSubirGrande() {
    teleprompter_state.scroll = Math.max(0, teleprompter_state.scroll - 260);
    emitirTeleprompter();
}

function teleprompterBajarGrande() {
    teleprompter_state.scroll += 260;
    emitirTeleprompter();
}

function teleprompterIrInicio() {
    teleprompter_state.scroll = 0;
    emitirTeleprompter(true);
}

function teleprompterIrFinal() {
    teleprompter_state.scroll = Number.MAX_SAFE_INTEGER;
    emitirTeleprompter(true);
}

function teleprompterCambiarFuente(delta) {
    const nueva = Math.min(TELEPROMPTER_FONT_MAX, Math.max(TELEPROMPTER_FONT_MIN, teleprompter_state.fontSize + delta));
    teleprompter_state.fontSize = nueva;
    actualizarTeleprompterUI();
    emitirTeleprompter(true);
    if (teleprompter_state.playing && !teleprompter_play_raf) {
        iniciarTeleprompterPlay();
    }
}

function teleprompterCambiarVelocidad(delta) {
    const nueva = Math.min(TELEPROMPTER_SPEED_MAX, Math.max(TELEPROMPTER_SPEED_MIN, teleprompter_state.speed + delta));
    teleprompter_state.speed = nueva;
    actualizarTeleprompterUI();
    emitirTeleprompter();
    if (teleprompter_state.playing && !teleprompter_play_raf) {
        iniciarTeleprompterPlay();
    }
}

function teleprompterTogglePlay() {
    teleprompter_state.playing = !teleprompter_state.playing;
    actualizarTeleprompterUI();
    if (teleprompter_state.playing) {
        iniciarTeleprompterPlay();
    } else {
        detenerTeleprompterPlay();
    }
    emitirTeleprompter(true);
}

const TELEPROMPTER_GAMEPAD = {
    deadzone: 0.18,
    analogSpeed: 320
};
let teleprompter_gamepad_loop = null;
let teleprompter_gamepad_last = null;
let teleprompter_gamepad_prev_buttons = [];
const teleprompter_btn_timeouts = new Map();
const teleprompter_hold_intervals = new Map();

const teleprompter_hold_actions = {
    "font-down": () => teleprompterCambiarFuente(-2),
    "font-up": () => teleprompterCambiarFuente(2),
    "speed-down": () => teleprompterCambiarVelocidad(-5),
    "speed-up": () => teleprompterCambiarVelocidad(5),
    "scroll-up": () => teleprompterSubir(),
    "scroll-down": () => teleprompterBajar()
};

const activarBotonVisual = (id, duracion = 160) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("tp-btn--active");
    if (teleprompter_btn_timeouts.has(el)) {
        clearTimeout(teleprompter_btn_timeouts.get(el));
    }
    const timeout = setTimeout(() => {
        el.classList.remove("tp-btn--active");
        teleprompter_btn_timeouts.delete(el);
    }, duracion);
    teleprompter_btn_timeouts.set(el, timeout);
};

const setBotonHeld = (id, activo) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (activo) {
        el.classList.add("tp-btn--held");
    } else {
        el.classList.remove("tp-btn--held");
    }
};

const iniciarHoldTeleprompter = (elemento, accion) => {
    if (!elemento || !accion) return;
    const ejecutar = () => accion();
    ejecutar();
    const interval = setInterval(ejecutar, 140);
    teleprompter_hold_intervals.set(elemento, interval);
    elemento.classList.add("tp-btn--held");
};

const detenerHoldTeleprompter = (elemento) => {
    if (!elemento) return;
    const interval = teleprompter_hold_intervals.get(elemento);
    if (interval) {
        clearInterval(interval);
        teleprompter_hold_intervals.delete(elemento);
    }
    elemento.classList.remove("tp-btn--held");
};

const configurarHoldTeleprompter = () => {
    const botones = document.querySelectorAll(".tp-btn");
    botones.forEach((btn) => {
        let activo = false;
        const accion = teleprompter_hold_actions[btn.dataset.hold];
        const start = (event) => {
            if (btn.disabled || btn.classList.contains("tp-btn--empty")) return;
            if (activo) return;
            event.preventDefault();
            activo = true;
            detenerHoldTeleprompter(btn);
            if (accion) {
                iniciarHoldTeleprompter(btn, accion);
            } else {
                btn.classList.add("tp-btn--held");
            }
        };
        const stop = () => {
            if (!activo) return;
            activo = false;
            if (accion) {
                detenerHoldTeleprompter(btn);
            } else {
                btn.classList.remove("tp-btn--held");
            }
        };
        btn.addEventListener("pointerdown", start);
        btn.addEventListener("pointerup", stop);
        btn.addEventListener("pointerleave", stop);
        btn.addEventListener("pointercancel", stop);
        btn.addEventListener("mousedown", start);
        btn.addEventListener("mouseup", stop);
        btn.addEventListener("mouseleave", stop);
        btn.addEventListener("touchstart", start, { passive: false });
        btn.addEventListener("touchend", stop);
        btn.addEventListener("touchcancel", stop);
    });
};

const obtenerGamepadActivo = () => {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    if (!pads) return null;
    for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (pad && pad.connected) return pad;
    }
    return null;
};

const botonJustPressed = (pad, index, threshold = 0.5) => {
    if (!pad || !pad.buttons || !pad.buttons[index]) return false;
    const btn = pad.buttons[index];
    const pressed = !!(btn.pressed || btn.value > threshold);
    const prev = !!teleprompter_gamepad_prev_buttons[index];
    teleprompter_gamepad_prev_buttons[index] = pressed;
    return pressed && !prev;
};

function teleprompterGamepadLoop(ts) {
    const pad = obtenerGamepadActivo();
    if (!pad) {
        teleprompter_gamepad_last = ts;
        teleprompter_gamepad_prev_buttons = [];
        teleprompter_gamepad_loop = requestAnimationFrame(teleprompterGamepadLoop);
        return;
    }
    const tiempoActual = ts || performance.now();
    const dt = teleprompter_gamepad_last ? (tiempoActual - teleprompter_gamepad_last) / 1000 : 0;
    teleprompter_gamepad_last = tiempoActual;

    if (teleprompter_state.visible) {
        const axisY = pad.axes && pad.axes.length > 1 ? pad.axes[1] : 0;
        const abs = Math.abs(axisY);
        if (abs > TELEPROMPTER_GAMEPAD.deadzone && dt > 0) {
            const factor = (abs - TELEPROMPTER_GAMEPAD.deadzone) / (1 - TELEPROMPTER_GAMEPAD.deadzone);
            const delta = axisY * factor * TELEPROMPTER_GAMEPAD.analogSpeed * dt;
            teleprompter_state.scroll = Math.max(0, teleprompter_state.scroll + delta);
            emitirTeleprompter();
        }

        if (abs > TELEPROMPTER_GAMEPAD.deadzone) {
            setBotonHeld("tp_dpad_up", axisY < 0);
            setBotonHeld("tp_dpad_down", axisY > 0);
        } else {
            setBotonHeld("tp_dpad_up", false);
            setBotonHeld("tp_dpad_down", false);
        }

        if (botonJustPressed(pad, 12)) {
            teleprompterSubir();
            activarBotonVisual("tp_dpad_up");
        }
        if (botonJustPressed(pad, 13)) {
            teleprompterBajar();
            activarBotonVisual("tp_dpad_down");
        }
        if (botonJustPressed(pad, 14)) {
            teleprompterCambiarVelocidad(-5);
            activarBotonVisual("tp_dpad_left");
        }
        if (botonJustPressed(pad, 15)) {
            teleprompterCambiarVelocidad(5);
            activarBotonVisual("tp_dpad_right");
        }
        if (botonJustPressed(pad, 0)) {
            teleprompterTogglePlay();
            activarBotonVisual("tp_x");
            activarBotonVisual("teleprompter_play");
        }
        if (botonJustPressed(pad, 1)) {
            teleprompterCambiarFuente(2);
            activarBotonVisual("tp_circle");
        }
        if (botonJustPressed(pad, 2)) {
            teleprompterCambiarFuente(-2);
            activarBotonVisual("tp_square");
        }
        if (botonJustPressed(pad, 3)) {
            teleprompterBajarGrande();
            activarBotonVisual("tp_triangle");
        }
        if (botonJustPressed(pad, 4)) {
            teleprompterIrInicio();
            activarBotonVisual("tp_l1");
        }
        if (botonJustPressed(pad, 5)) {
            teleprompterIrFinal();
            activarBotonVisual("tp_r1");
        }
        if (botonJustPressed(pad, 6, 0.6)) {
            teleprompterCambiarFuente(-2);
            activarBotonVisual("tp_l2");
        }
        if (botonJustPressed(pad, 7, 0.6)) {
            teleprompterCambiarFuente(2);
            activarBotonVisual("tp_r2");
        }
    } else {
        teleprompter_gamepad_prev_buttons = pad.buttons.map((btn) => !!(btn && (btn.pressed || btn.value > 0.5)));
        setBotonHeld("tp_dpad_up", false);
        setBotonHeld("tp_dpad_down", false);
    }

    teleprompter_gamepad_loop = requestAnimationFrame(teleprompterGamepadLoop);
}

const iniciarTeleprompterGamepad = () => {
    if (teleprompter_gamepad_loop) return;
    teleprompter_gamepad_loop = requestAnimationFrame(teleprompterGamepadLoop);
};

if (typeof window !== "undefined") {
    window.addEventListener("gamepadconnected", iniciarTeleprompterGamepad);
    window.addEventListener("gamepaddisconnected", () => {
        const pad = obtenerGamepadActivo();
        if (!pad) {
            teleprompter_gamepad_prev_buttons = [];
        }
    });
    window.addEventListener("load", iniciarTeleprompterGamepad);
    window.addEventListener("load", configurarHoldTeleprompter);
}
function reiniciar_calentamiento() {
    socket.emit('reiniciar_calentamiento');
}

function reiniciar_marcador_calentamiento() {
    socket.emit('reiniciar_marcador_calentamiento');
}

function activar_banderas_musas() {
    socket.emit('activar_banderas_musas');
}

function enviar_comentario() {
    palabras = tema.value;
    socket.emit('enviar_comentario', palabras);
};

function puntuacion_final() {
    p1 = puntos1.innerHTML.match(/\d+/)[0];
    p2 = puntos2.innerHTML.match(/\d+/)[0];
    maxima = Math.max(p1, p2);

    v1 = parseInt(votos1.value);
    v2 = parseInt(votos2.value);
    suma = parseInt(v1 + v2);
    pfinal1 = parseInt(+p1 + Math.round((v1 / suma) * maxima));
    pfinal2 = parseInt(+p2 + Math.round((v2 / suma) * maxima));

    if(findValueInRowAndChange(nombre1.value, pfinal1) == false){
        fila = clasificacion.insertRow(clasificacion.rows.length);
        nombre = fila.insertCell(0);
        nombre.contentEditable = false;
        puntuacion = fila.insertCell(1);
        puntuacion.contentEditable = false;
        borrar = fila.insertCell(2);
        borrar.innerHTML = '<input type="button" value="❌" onclick="deleteRow(this)">';
        editar = fila.insertCell(3);
        editar.innerHTML = '<input type="button" value="✏️" onclick="editableRow(this)"></input>';
        nombre.innerHTML = nombre1.value;
        puntuacion.innerHTML = pfinal1;
    }

    if(findValueInRowAndChange(nombre2.value, pfinal2) == false){
        fila = clasificacion.insertRow(clasificacion.rows.length);
        nombre = fila.insertCell(0);
        nombre.contentEditable = false;
        puntuacion = fila.insertCell(1);
        puntuacion.contentEditable = false;
        borrar = fila.insertCell(2);
        borrar.innerHTML = '<input type="button" value="❌" onclick="deleteRow(this)">'
        editar = fila.insertCell(3);
        editar.innerHTML = '<input type="button" value="✏️" onclick="editableRow(this)"></input>';
        nombre.innerHTML = nombre2.value;
        puntuacion.innerHTML = pfinal2;
    }

    sortTable();

    puntuacion_final1.innerHTML = "🗳️ Puntuación del público = " + Math.round((v1 / suma) * maxima) + "<br>🏁 Puntuación final = " + pfinal1;
    puntuacion_final2.innerHTML = "🗳️ Puntuación del público = " + Math.round((v2 / suma) * maxima) + "<br>🏁 Puntuación final = " + pfinal2;
   
    pfinal1 = puntuacion_final1.innerHTML;
    pfinal2 = puntuacion_final2.innerHTML;

    socket.emit('enviar_puntuacion_final', {pfinal1, pfinal2});
};

function enviar_clasificacion(){
    data = extractData('clasificacion', (x) => ({
        jugador: x[0],
        puntuacion: x[1],
      }));
      socket.emit('enviar_clasificacion', data);
  }

function pausar(){
    pausado = true;
    clearInterval(countInterval);
    clearInterval(countInterval1);
    // Variables para llevar el conteo y controlar el intervalo
    socket.emit('pausar', '');
}


function pausar_reanudar(boton) {
    // Imprimimos en consola para verificar
    console.log(fin_j1, fin_j2);

    console.log("¿Terminado?:", !(fin_j1 || fin_j2));
    console.log("Valor de data-value:", boton.dataset.value);

    if (juego_iniciado) {
      // Usamos comparación == para no preocuparnos de que sea string
      if (boton.dataset.value == 0) {
        pausar();
        boton.innerHTML = "\u{25B6}\u{FE0F} REANUDAR";
        boton.dataset.value = 1;
      }
      else if (boton.dataset.value == 1) {
        reanudar();
        boton.innerHTML = "\u{23F8}\u{FE0F} PAUSAR";
        boton.dataset.value = 0;
      }
    }
  }


function reanudar(){
    if(modo_actual != "tertulia"){
    socket.emit('count', {count, player:1});
    socket.emit('count', {count : count1, player:2});
    console.log("estooo",secondsRemaining)
    console.log("estooo", TIEMPO_MODOS - secondsRemaining)
    startCountDown_p1(secondsRemaining);
    startCountDown_p2(secondsRemaining);
    pausado = false;
    socket.emit('reanudar', '');
    }
    else if(modo_actual == "tertulia"){
        clearTimeout(TimeoutTiempoMuerto)
        reanudar_modo();
    }
}

function reanudar_modo(){
    console.log(count, secondsRemaining, tiempo)
    console.log(time_minutes, time_seconds)
    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        boton_pausar_reanudar.innerHTML = "\u{23F8}\u{FE0F} PAUSAR";
    }
    socket.emit('count', {count, player:1});
    socket.emit('count', {count : count1, player:2});


    startCountDown_p1(secondsRemaining);
    startCountDown_p2(secondsRemaining1);
    pausado = false;
    //socket.emit('reanudar_modo', '');
}
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("clasificacion");
    switching = true;
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
      //start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /*Loop through all table rows (except the
      first, which contains table headers):*/
      for (i = 1; i < (rows.length - 1); i++) {
        //start by saying there should be no switching:
        shouldSwitch = false;
        /*Get the two elements you want to compare,
        one from current row and one from the next:*/
        x = rows[i].getElementsByTagName("TD")[1];
        y = rows[i + 1].getElementsByTagName("TD")[1];
        //check if the two rows should switch place:
        if (Number(x.innerHTML.match(/\d+/)[0]) < Number(y.innerHTML.match(/\d+/)[0])) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        /*If a switch has been marked, make the switch
        and mark that a switch has been done:*/
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }

  function findValueInRowAndChange(nombre, puntos) {
    clasificacion = document.getElementById("clasificacion");
    var rows = clasificacion.rows;
    for (var i = 1; i < rows.length; i++) {
      var cols = rows[i].cells;
      for (var c = 0; c < cols.length; c++) {
        if (cols[c].innerText == nombre) {
          cols[1].innerHTML = puntos;
          return true;
        }
      }
    }
    return false;
  }

  function deleteRow(r) {
    var i = r.parentNode.parentNode.rowIndex;
    document.getElementById("clasificacion").deleteRow(i);
}

function editableRow(r) {
    table_ = document.getElementById("clasificacion");
    var i = r.parentNode.parentNode.rowIndex;
    rows_ = table_.rows;
    editando = rows_[i].getElementsByTagName("TD")[0].contentEditable;
    if(editando == 'true'){
        r.value = "✏️";
        rows_[i].getElementsByTagName("TD")[0].contentEditable = 'false';
        rows_[i].getElementsByTagName("TD")[1].contentEditable = 'false';
        sortTable();
    }
    else {
        r.value = "✅";
        rows_[i].getElementsByTagName("TD")[0].contentEditable = 'true';
        rows_[i].getElementsByTagName("TD")[1].contentEditable = 'true';

    }
}

const extractData = (tableId, mapper) => {
    const myTab = document.getElementById(tableId);
    if (myTab) {
      const data = [...myTab.rows].map((r) => [...r.cells].map((c) => c.innerText));
      return data.map(mapper);
    }
  };

function final(player){
    if(player == 1){
        clearInterval(countInterval);
        tiempo.style.color = "white"
        tiempo.innerHTML = "¡Tiempo!";
        actualizarBarraVida(tiempo, tiempo.innerHTML);
        count = "¡Tiempo!";
        texto_guardado1 = texto1.innerHTML;
        terminado = true;
        console.log("texto1", texto_guardado1)
        socket.emit('count', {count, player});
    }
    else{
        clearInterval(countInterval1);
        tiempo1.style.color = "white"
        tiempo1.innerHTML = "¡Tiempo!";
        actualizarBarraVida(tiempo1, tiempo1.innerHTML);
        count1 = "¡Tiempo!";
        terminado1 = true;
        console.log("texto2", texto_guardado2)
        texto_guardado2 = texto2.innerHTML;
        socket.emit('count', {count : count1, player:2});
    }

    if(terminado && terminado1){
        tiempo_modos_secs.textContent = 0 + " segundos";
        display_modo.style.color = "white";
        display_modo.textContent = "Ninguno"; 
        console.log("PRUEBA FINAL", texto_guardado1)
        if (!regalo_musas_enviado && typeof window.emitirRegaloMusas === "function") {
            regalo_musas_enviado = true;
            window.emitirRegaloMusas();
        }
        //setTimeout(descargar_textos, 5000);
    }
}

function frase_final(player){
    const fraseTema = normalizarFraseFinal(tema.value);
    if(player== 1){
        frase_final_j1.value = fraseTema;
    }
    else{
        frase_final_j2.value = fraseTema;
    }
}
