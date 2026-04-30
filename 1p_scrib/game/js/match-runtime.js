function limpiarCountdownInicioEscritora() {
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);
    clearTimeout(sub_timer);
    clearTimeout(preparados_timer);
    clearTimeout(fallback_cuenta_atras_timer);
    listener_cuenta_atras = null;
    timer = null;
    sub_timer = null;
    preparados_timer = null;
    fallback_cuenta_atras_timer = null;
    $('#countdown').remove();
}

function extraerSegundosTiempo(textoTiempo) {
    if (!textoTiempo || typeof textoTiempo !== "string" || textoTiempo.indexOf(":") === -1) {
        return null;
    }
    const partes = textoTiempo.split(":");
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

function animarEntradaBarraVidaInicioPartida() {
    if (!tiempo) return;
    const segundosIniciales = Math.max(0, Math.floor((Number(TIEMPO_INICIAL) || 0) / 1000));
    const minutos = parseInt(segundosIniciales / 60, 10);
    const segundos = parseInt(segundosIniciales % 60, 10);
    const textoInicial = `${paddedFormat(minutos)}:${paddedFormat(segundos)}`;
    tiempo.textContent = textoInicial;
    tiempo.style.color = "white";
    actualizarBarraVida(tiempo, textoInicial, { animarEntrada: true });
    // Ya se animó en la intro visual; evita doble animación al arrancar el temporizador real.
    animacionEntradaVidaPendiente = false;
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

function actualizarBarraVida(elemento, textoTiempo, opciones = {}) {
    if (!elemento) return;
    const animarEntrada = Boolean(opciones && opciones.animarEntrada);
    const total = extraerSegundosTiempo(textoTiempo);
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



function count(data){
    if(data.player == player){
    if (convertirASegundos(data.count) >= 20) {
        tiempo.style.color = "white";
    }
    if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
        console.log(convertirASegundos(data.count))
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "yellow";
    }
    if (10 > convertirASegundos(data.count) && activado_psico == false) {
        MODOS["psicodélico"](data, socket);
        tiempo.style.color = "red";
    }

    tiempo.innerHTML = data.count;
    const segundosCount = extraerSegundosTiempo(data.count);
    const animarEntradaVida = Boolean(animacionEntradaVidaPendiente && Number.isFinite(segundosCount));
    actualizarBarraVida(tiempo, data.count, { animarEntrada: animarEntradaVida });
    if (animarEntradaVida) {
        animacionEntradaVidaPendiente = false;
    }
    if (Number.isFinite(segundosCount)) {
        actualizarProgresoFraseFinalEscritora(segundosCount);
    }
    if (data.count == "¡Tiempo!") {
        actualizarProgresoFraseFinalEscritora(0);
        limpiar_bloqueo_putada();
        limpiar_teclado_lento();
        console.log(putada_actual, "esto no doebería ocurrir")
        if (putada_actual == "🙃"){
            console.log("NO PUEDOOOOO ESTO NO DEBERÍA OCURRRIR")
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.removeEventListener('animationend', arguments.callee);
            });
            clearTimeout(tempo_text_inverso);
            temp_text_inverso_activado = false;
            procesarTexto();
        }
        
        if (modo_actual != "" && modo_actual != "frase final") {
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "white";
            pararEscritura = true;
            stopConfetti();
            limpiarCountdownInicioEscritora();
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            if(temp_text_inverso_activado == true){
                temp_text_inverso_activado = false;
                clearTimeout(tempo_text_inverso);
                procesarTexto();
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            texto_guardado = texto.innerText;
        
            //texto.innerText = "";
            texto.style.display = "none";
            texto.style.height = "";
            texto.rows =  "6";
            definicion.style.fontSize = "1.5vw";
            temas.innerHTML = "";
            temas.display = "";
            texto.contentEditable= "false";
            palabra.innerHTML = "";
            definicion.innerHTML = "";
            explicación.innerHTML = "";
            menu_modificador = false;
            focusedButtonIndex = 0;
            modificadorButtons = [];

            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
        
            // Desactiva el blur de ambos textos.
            blurreado = false;
            texto.classList.remove("textarea_blur");
        
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            puntos_palabra = 0;
            puntos_ = 0;
            puntos_letra_prohibida = 0;
            puntos_letra_bendita = 0;
        
            letra_prohibida = "";
            letra_bendita = "";
            asignada = false;
            palabra_actual = []; // Variable que almacena la palabra bonus actual.            
            // Desactiva, por seguridad, todos los modos.
            modo_texto_borroso = 0;
            desactivar_borrar = true;
            console.log(puntos)
            
            limpiarFeedbackFlotanteEscritora();
            
            definicion.innerHTML = "";
            explicación.innerHTML = "";
        
            caracteres_seguidos = 0;
            
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            for (let key in LIMPIEZAS) { 
                console.log(key)
                LIMPIEZAS[key]();
                console.log(texto.innerHTML)
                console.log(temp_text_inverso_activado)
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
        
            limpiarTimeoutCompartidoGameplay1P("borrado");
            limpiarTimeoutCompartidoGameplay1P("cambio_palabra");
            clearTimeout(tempo_text_borroso);
        }
        console.log(data)
        console.log("MIERDA PUTA")
        console.log(texto.innerHTML)
        console.log(temp_text_inverso_activado)
        if (!terminado) {
            if (puedeResucitarSegunEstado()) {
                prepararMenuResurreccionPorTiempo();
                iniciarMenu();
            } else {
                finalizarSinResurreccion();
            }
        }
        }
    }
};
  
function resucitar(){
    terminado = false;
    desactivar_borrar = false;
    setAccionesPartidaDesplegadas1P(false);
    if (logo) logo.style.display = "none"; 
    if (neon) neon.style.display = "none"; 
    tiempo.innerHTML = "";
    tiempo.style.display = "";
    actualizarBarraVida(tiempo, "");

    pararEscritura = true;
    stopConfetti();
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    if(temp_text_inverso_activado == true){
        clearTimeout(tempo_text_inverso);
        temp_text_inverso_activado = false;
        procesarTexto();
    }

    texto.innerText = texto_guardado;
    texto.style.display = "";
    texto.style.height = "";
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    console.log(modo_actual)
    if(modo_actual != "tertulia"){
    texto.contentEditable= "false";
    }
    //puntos.innerHTML = 0 + " palabras";
    //nivel.innerHTML = "nivel 0";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");
    
    // Desactiva, por seguridad, todos los modos.
    console.log(puntos)

    caracteres_seguidos = 0;
        texto.innerText = texto_guardado.trim();

        

        // Obtener el último nodo de texto en texto
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el último nodo de texto, colocamos el cursor allí
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        texto.scrollTo(0, texto.scrollHeight);
}
// Inicia el juego.
function inicio() {
    if (inicio_en_progreso_1p) {
        return;
    }
    if (typeof atributos !== 'undefined' && atributos) {
        const total = Object.values(atributos).reduce((a, b) => a + b, 0);
        if (Number.isFinite(total) && total !== LIMITE_TOTAL) {
            if (typeof feedback !== 'undefined' && feedback) {
                feedback.style.color = 'orange';
                feedback.innerHTML = 'Reparte los 10 puntos de habilidad para empezar';
                if (typeof animateCSS === 'function') {
                    clearTimeout(delay_animacion);
                    animateCSS('.feedback1', 'flash').then(() => {
                        delay_animacion = setTimeout(function () {
                            feedback.innerHTML = '';
                        }, 2000);
                    });
                } else {
                    setTimeout(() => {
                        feedback.innerHTML = '';
                    }, 2000);
                }
            }
            return;
        }
    }
    inicio_en_progreso_1p = true;
    setAccionesPartidaDesplegadas1P(false);
    aplicarAtributos();
    // En partida nueva, siempre arrancar con texto vacío.
    texto_guardado = "";
    texto.innerText = "";
    setPartidaActivaCursorPluma(true);
    // Mantiene ocultos cabecera/marcador/vida durante toda la transición de arranque.
    iniciarSecuenciaIntroPartidaEscritora();
    setModoDashboardSolo(false);

    actualizarVariables()
    rellenarListaModos()
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    reiniciarProgresoFraseFinalEscritora();
    limpiarCountdownInicioEscritora();
    post_inicio_pendiente_escritora = null;
    animarCSSJuego1P(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "none";
        btnEscribir.style.display = "none";
        btnLimpiar.style.display = "";
        btnDescargarTexto.style.display = "none" 
        btnPantallaCompleta.style.display = ""
        btnFinal.style = "" 
        sincronizarVisibilidadBtnVolver1P();
    });

    animarCSSJuego1P(".contenedor", "backOutLeft").then((message) => {
        animarCSSJuego1P(".contenedor", "pulse");

    limpieza();
    modos_restantes = [...LISTA_MODOS];
    palabras_prohibidas_restantes = [...palabras_prohibidas];
    actualizarDuracionNivelDesdeParametrosEscritora({ TIEMPO_CAMBIO_MODOS });

    desactivar_borrar = false;
    texto.style.height = "";

    if (logo) logo.style.display = "none"; 
    if (neon) neon.style.display = "none"; 
    texto.contentEditable= "false";
    tiempo.innerHTML = "";
    tiempo.style.display = "";
    actualizarBarraVida(tiempo, "");
    setProgresoNivelBarraEscritora(0);

    detenerTodoAudioJuego();
    reproducirSfx(AUDIO_CUENTA_ATRAS_INICIO, 0.9);

    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás.
    $('#countdown').remove();
    var preparados = $('<span id="countdown">' + tJuego1P("countdown.ready", {}, "&iquest;PREPARADOS?") + '</span>');
    preparados.appendTo($('.container'));
    preparados_timer = setTimeout(() => {
        preparados_timer = null;
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        revelarEtapaIntroPartidaEscritora(1);
        animarEntradaBarraVidaInicioPartida();
    }, 20);

    listener_cuenta_atras = setTimeout(() => {
    listener_cuenta_atras = null;
    var counter = 3;

    timer = setInterval(function() {

      $('#countdown').remove();

      if (counter >= 0 && counter <= 3) {
        const indiceAudio = 3 - counter;
        if (indiceAudio >= 0 && indiceAudio < AUDIOS_CUENTA_ATRAS.length) {
          reproducirSfx(AUDIOS_CUENTA_ATRAS[indiceAudio], 0.9);
        }
      }
      var countdown = $('<span id="countdown">'+(counter === 0 ? tJuego1P("countdown.write", {}, "&iexcl;ESCRIBE!") : counter)+'</span>');
      countdown.appendTo($('.container'));
      if (counter === 3) {
        revelarEtapaIntroPartidaEscritora(2);
      } else if (counter === 2) {
        revelarEtapaIntroPartidaEscritora(3);
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
          finalizarSecuenciaIntroPartidaEscritora();
          post_inicio(true);
        }, 1000);
      }
    }, 1000);
    fallback_cuenta_atras_timer = setTimeout(() => {
        fallback_cuenta_atras_timer = null;
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        $('#countdown').remove();
        finalizarSecuenciaIntroPartidaEscritora();
        post_inicio(true);
    }, 6800);
}, 1000);
});
};

//////socket.on("post-inicio", (data) => {
//////    console.log(data.borrar_texto, "borrar texto")
//////    post_inicio(data.borrar_texto);
//////});    

function post_inicio(borrar_texto){
    inicio_en_progreso_1p = false;
    clearInterval(timer);
    timer = null;
        limpiarClasesIntroPartidaEscritora();
        if (tiempo) {
            tiempo.classList.add("tiempo-vida");
            tiempo.style.display = DISPLAY_BARRA_VIDA;
        }
        if (borrar_texto == false) {
            texto.innerText = texto_guardado.trim();

            

            // Obtener el último nodo de texto en texto
            let lastLine = texto.lastChild;
            let lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                let caretNode = lastTextNode;
                let caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            texto.scrollTo(0, texto.scrollHeight);
            }
        
        //socket.off("recibe_temas");
        texto.contentEditable= "true";
        texto.focus();
            animarCSSJuego1P(".explicación", "bounceInLeft");
            animarCSSJuego1P(".palabra", "bounceInLeft");
            animarCSSJuego1P(".definicion", "bounceInLeft");
        programarAjusteAlturaEditorEscritora();
        resetResumenPartida();
        resetHeatmap();
        animarCSSJuego1P("#partida_acciones_toggle_wrap", "backInDown");
        startCountDown(TIEMPO_INICIAL/1000)
        temp_modos()
}

function colocarCursorAlFinalEditor() {
    if (!texto) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let lastNode = texto.lastChild;

    while (lastNode && lastNode.nodeType !== 3 && lastNode.lastChild) {
        lastNode = lastNode.lastChild;
    }

    if (lastNode && lastNode.nodeType === 3) {
        const offset = lastNode.textContent ? lastNode.textContent.length : 0;
        range.setStart(lastNode, offset);
        range.setEnd(lastNode, offset);
    } else if (texto.lastChild) {
        range.setStartAfter(texto.lastChild);
        range.setEndAfter(texto.lastChild);
    } else {
        range.setStart(texto, 0);
        range.setEnd(texto, 0);
    }

    selection.removeAllRanges();
    selection.addRange(range);
    texto.scrollTo(0, texto.scrollHeight);
}

function ocultarMenuResurreccion() {
    mainMenu.style.display = "none";
    quantityMenu.style.display = "none";
    if (mainTitle) {
        mainTitle.style.display = "none";
    }
    if (buttonContainer) {
        buttonContainer.style.display = "none";
    }
    document.removeEventListener("keydown", manejadorTeclas);
    clearTimeout(timeoutID_menu);
    timeoutID_menu = null;
    if (typeof actualizarEstadoMenuAccionesPartida1P === "function") {
        actualizarEstadoMenuAccionesPartida1P();
    }
}

function prepararMenuResurreccionPorTiempo() {
    memorizarOffsetCaretTextoJuego1P();
    setAccionesPartidaDesplegadas1P(false);
    menu_resurreccion_activo = true;
    limpiarTimeoutCompartidoGameplay1P("borrado");
    desactivar_borrar = true;
    setPartidaActivaCursorPluma(false);
    ocultarCursorPlumaEscritora();
    ocultarCaretNeonEscritora();
    texto.style.display = "none";
    texto.contentEditable = "false";
    tiempo.style.color = "white";
    pausarProgresoNivelBarraEscritora();
}

function limpiarEstadoGameOverBarraVida() {
    if (!tiempo || !tiempo.classList) return;
    tiempo.classList.remove("tiempo-vida--game-over");
}

function mostrarGameOverBarraVida() {
    if (!tiempo) return;
    tiempo.style.display = "";
    tiempo.style.color = "#ff5050";
    tiempo.classList.add("tiempo-vida--game-over");
    tiempo.textContent = "00:00";
    actualizarBarraVida(tiempo, "00:00");
}

function reanudarTrasResurreccion(segundosResurreccion) {
    const segundos = Number(segundosResurreccion);
    if (!Number.isFinite(segundos) || segundos <= 0) {
        finalizarSinResurreccion();
        return;
    }
    if (modo_actual === "frase final") {
        finalizarSinResurreccion();
        return;
    }

    limpiarEstadoGameOverBarraVida();
    menu_resurreccion_activo = false;
    ocultarMenuResurreccion();
    terminado = false;
    desactivar_borrar = false;
    texto.style.display = "";
    tiempo.style.display = "";
    texto.innerText = texto_guardado;
    if (modo_actual !== "tertulia") {
        texto.contentEditable = "true";
        setPartidaActivaCursorPluma(true);
        requestAnimationFrame(() => {
            restaurarFocoTextoJuego1P();
        });
    }
    reanudarProgresoNivelBarraEscritora();
    startCountDown(segundos);
}

function gestionarTiempoAgotado() {
    limpiarIntervalCompartidoGameplay1P("countInterval");
    actualizarProgresoFraseFinalEscritora(0);
    if (terminado) {
        return;
    }

    setPartidaActivaCursorPluma(false);
    ocultarCursorPlumaEscritora();
    ocultarCaretNeonEscritora();
    texto_guardado = texto.innerText;
    mostrarGameOverBarraVida();
    if (modo_actual !== "frase final" && puedeResucitarSegunEstado()) {
        prepararMenuResurreccionPorTiempo();
        iniciarMenu();
        return;
    }

    menu_resurreccion_activo = false;
    finalizarSinResurreccion();
}

function startCountDown(duration) {

    limpiarEstadoGameOverBarraVida();
    if (tiempo) {
        tiempo.classList.add("tiempo-vida");
        tiempo.style.display = DISPLAY_BARRA_VIDA;
    }
    secondsRemaining = duration;
    registrarTiempoControl(1, secondsRemaining);
    let min = parseInt(secondsRemaining / 60, 10);
    let sec = parseInt(secondsRemaining % 60, 10);
    count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    tiempo.textContent = count;
    tiempo.style.color = "white";
    const animarEntradaVida = Boolean(animacionEntradaVidaPendiente);
    actualizarBarraVida(tiempo, count, { animarEntrada: animarEntradaVida });
    if (animarEntradaVida) {
        animacionEntradaVidaPendiente = false;
    }
    actualizarProgresoFraseFinalEscritora(secondsRemaining);

    limpiarIntervalCompartidoGameplay1P("countInterval");
    escribirEstadoCompartidoGameplay1P("countInterval", setInterval(function () {
        if (desventajaEnCurso || menu_resurreccion_activo) {
            return;
        }
        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        actualizarBarraVida(tiempo, count);
        actualizarProgresoFraseFinalEscritora(secondsRemaining);
        registrarTiempoControl(1, secondsRemaining);
        if (secondsRemaining == 20) {
            tiempo.style.color = "yellow"
        }
        if (secondsRemaining == 10) {
            tiempo.style.color = "red"
        }
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining <= 0) {
            gestionarTiempoAgotado();
        };

    }, 1000));
}

function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function addSeconds(secs) {
    if (modo_actual === "frase final") {
        return false;
    }
    if (secs > 0) {
        reproducirSfx(AUDIO_GANAR_TIEMPO, 1);
    } else if (secs < 0) {
        reproducirSfx(AUDIO_PERDER_TIEMPO, 1);
    }
    secondsRemaining += secs;
    if(secondsRemaining < 0){
        secondsRemaining = 0;
    }  
    min = parseInt(secondsRemaining / 60);
    sec = parseInt(secondsRemaining % 60);

    tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    actualizarBarraVida(tiempo, count);
    actualizarProgresoFraseFinalEscritora(secondsRemaining);
    registrarTiempoControl(1, secondsRemaining);
    return true;
}

// Resetea el tablero de juego.
function limpiar(borrar){
    inicio_en_progreso_1p = false;
    setAccionesPartidaDesplegadas1P(false);
    setPartidaActivaCursorPluma(false);
    setModoDashboardSolo(true);
    limpiarEstadoGameOverBarraVida();
    animarCSSJuego1P(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "";
        btnEscribir.style.display = "";
        //btnDescargarTexto.style.display = "" 
        btnPantallaCompleta.style.display = "" 
        btnFinal.style.display = "none" 
        animarCSSJuego1P(".botones", "backInLeft")
    });


    if(borrar == false){
        texto_guardado = texto.innerText;
    }

    limpieza();

    stopConfetti()
    
    texto.rows =  "1";

    modo_actual = "";
    putada_actual = "";

    temas.innerHTML = "";
    
    texto.contentEditable= "false";

    tiempo.style.display = "none";
    animarCSSJuego1P(".cabecera", "backInLeft").then((message) => {
        animarCSSJuego1P(".contenedor", "pulse");
    });
    if (logo) logo.style.display = "";
    if (neon) neon.style.display = ""; 
    texto.removeEventListener("keyup", listener_modo_psico);
    texto.removeEventListener("keyup", listener_modo1);

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    borrado_cambiado = false;
    escribirRapidecesGameplay1P(antiguo_rapidez_borrado, antiguo_inicio_borrado);

    restablecer_estilo();
    programarAjusteAlturaEditorEscritora();
    iniciarMusicaMenu1P({ reiniciar: true });
};


// FUNCIONES AUXILIARES.

   /*************************************************************
      VARIABLES GLOBALES Y REFERENCIAS A ELEMENTOS DEL DOM
    **************************************************************/
      const mainMenu = document.getElementById('mainMenu');
      const quantityMenu = document.getElementById('quantityMenu');
  
      const btnSi = document.getElementById('btnSi'); // legado
      const btnNo = document.getElementById('btnNo'); // legado
      const mainMenuButtons = [btnSi, btnNo].filter(Boolean);
      let mainMenuIndex = 0;
  
      const quantityDisplay = document.getElementById('quantityDisplay');
      const btnConfirmar = document.getElementById('btnConfirmar');
      const btnAtras = document.getElementById('btnAtras');
      let quantityMenuElements = [quantityDisplay, btnConfirmar].filter(Boolean);
      let quantityMenuIndex = 0;
  
      let palabras = 1;
      const PALABRAS_A_SEGUNDOS = 3;
      let currentMenu = 'quantity';

      function contarPalabrasTexto(textoBase) {
        const matches = (textoBase || "").match(/\b\w+\b/g);
        return matches ? matches.length : 0;
      }

      function puedeResucitarSegunEstado() {
        return modo_actual !== "frase final" && contarPalabrasTexto(texto_guardado) > 0;
      }

      function obtenerMaxPalabrasResucitar() {
        return Math.max(1, contarPalabrasTexto(texto_guardado));
      }

      function finalizarSinResurreccion() {
        menu_resurreccion_activo = false;
        setPartidaActivaCursorPluma(false);
        ocultarCursorPlumaEscritora();
        ocultarCaretNeonEscritora();
        ocultarMenuResurreccion();
        texto.innerText = texto_guardado;
        tiempo.style.color = "white";
        if (terminado == false) {
          final();
          setTimeout(function () {
            texto.style.height = "";
            texto.rows = "1";
            texto.style.display = "none";
            tiempo.style.color = "white";
          }, 2000);
        }
    animarCSSJuego1P(".tiempo", "bounceInLeft");
        tiempo.innerHTML = tJuego1P("thanks.playing", {}, "¡GRACIAS POR JUGAR!");
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
      }

      /*************************************************************
        ACTUALIZACIONES DE ESTADO VISUAL
      **************************************************************/
      function actualizarSeleccionMainMenu() {
        if (!mainMenuButtons.length) return;
        if (mainMenuIndex < 0 || mainMenuIndex >= mainMenuButtons.length) {
          mainMenuIndex = 0;
        }
        mainMenuButtons.forEach(btn => btn.classList.remove('selected'));
        mainMenuButtons[mainMenuIndex].classList.add('selected');
        mainMenuButtons[mainMenuIndex].focus();
      }
  
      function actualizarSeleccionQuantityMenu() {
        if (!quantityMenuElements.length) return;
        if (quantityMenuIndex < 0 || quantityMenuIndex >= quantityMenuElements.length) {
          quantityMenuIndex = 0;
        }
        quantityMenuElements.forEach(el => el.classList.remove('selected'));
        quantityMenuElements[quantityMenuIndex].classList.add('selected');
        if (quantityMenuElements[quantityMenuIndex] && typeof quantityMenuElements[quantityMenuIndex].focus === 'function') {
          quantityMenuElements[quantityMenuIndex].focus();
        }
      }
  
      function actualizarTextoCantidad() {
        const maxPalabras = obtenerMaxPalabrasResucitar();
        palabras = Math.min(Math.max(1, palabras), maxPalabras);
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        const etiquetaPalabras = tJuego1P("res.quantity.words_label", {}, "Palabras");
        const etiquetaSegundos = tJuego1P("res.quantity.seconds_label", {}, "Segundos");
        const etiquetaMax = tJuego1P("res.quantity.max", { max: maxPalabras }, `MAX ${maxPalabras}`);
        quantityDisplay.innerHTML = `
          <div class="resucitar-stepper" aria-hidden="true">
            <button id="resucitarArrowUp" class="resucitar-stepper-arrow" type="button" data-res-key="ArrowUp" aria-label="Arriba">&uarr;</button>
            <button id="resucitarArrowDown" class="resucitar-stepper-arrow" type="button" data-res-key="ArrowDown" aria-label="Abajo">&darr;</button>
          </div>
          <div class="resucitar-metric">
            <span class="resucitar-label">${etiquetaPalabras}</span>
            <span class="resucitar-value resucitar-pop palabras">${palabras}</span>
            <span class="resucitar-max">${etiquetaMax}</span>
          </div>
          <div class="resucitar-arrow">→</div>
          <div class="resucitar-metric">
            <span class="resucitar-label">${etiquetaSegundos}</span>
            <span class="resucitar-value resucitar-pop segundos">${segundos}</span>
          </div>
        `;
        quantityDisplay.querySelectorAll('[data-res-key]').forEach((botonKeypad) => {
          botonKeypad.addEventListener('click', (evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            const tecla = botonKeypad.getAttribute('data-res-key');
            if (!tecla) return;
            ejecutarAccionMenuResurreccion(tecla);
          });
        });
      }

      function cambiarCantidadResurreccion(deltaPalabras) {
        if (!Number.isFinite(deltaPalabras) || deltaPalabras === 0) return;
        if (deltaPalabras > 0) {
          const maxPalabras = obtenerMaxPalabrasResucitar();
          let esLimite = false;
          if (palabras < maxPalabras) {
            palabras++;
            actualizarTextoCantidad();
            esLimite = palabras >= maxPalabras;
          } else {
            esLimite = true;
          }
          activarIndicadorConversor('up', esLimite);
          return;
        }

        let esLimite = false;
        if (palabras > 1) {
          palabras--;
          actualizarTextoCantidad();
          esLimite = palabras <= 1;
        } else {
          esLimite = true;
        }
        activarIndicadorConversor('down', esLimite);
      }

      function confirmarResurreccionActual() {
        if (modo_actual === "frase final") {
          finalizarSinResurreccion();
          return;
        }
        const segundosResurreccion = palabras * PALABRAS_A_SEGUNDOS;
        if (typeof socket !== "undefined" && socket && typeof socket.emit === "function") {
          socket.emit("resucitar", {player: player, secs: segundosResurreccion});
        }

        console.log("texto_guardado", palabras);
        console.log("texto_guardado", texto_guardado);

        texto_guardado = recortarUltimasPalabras(texto_guardado, palabras);

        console.log("texto_guardado", texto_guardado);

        reanudarTrasResurreccion(segundosResurreccion);
      }

      function activarIndicadorConversor(direccion, esLimite) {
        const flecha = direccion === 'up'
          ? document.getElementById('resucitarArrowUp')
          : document.getElementById('resucitarArrowDown');
        if (!flecha) return;
        flecha.classList.remove('activo', 'limite');
        void flecha.offsetWidth;
        flecha.classList.add('activo');
        if (esLimite) {
          flecha.classList.add('limite');
        }
        flecha.addEventListener('animationend', () => {
          flecha.classList.remove('activo', 'limite');
        }, { once: true });
      }
      
      
      function recortarUltimasPalabras(text, cantidadPalabras) {
        if (cantidadPalabras <= 0) {
          return text;
        }
        
        let endPos = text.length; // posición hasta la que mantenemos el texto
        let palabrasEliminadas = 0;
  
        while (palabrasEliminadas < cantidadPalabras) {
          // 1. Ignorar espacios y saltos de línea desde el final (si los hay)
          while (endPos > 0 && /\s/.test(text[endPos - 1])) {
            endPos--;
          }
          if (endPos <= 0) {
            // Si se quedó sin texto, todo se elimina
            return '';
          }
  
          // 2. Retroceder hasta el inicio de la palabra previa
          let inicioPalabra = endPos - 1;
          while (inicioPalabra >= 0 && !/\s/.test(text[inicioPalabra])) {
            inicioPalabra--;
          }
  
          // Ajustamos endPos al inicio de esta palabra (para recortarla)
          endPos = inicioPalabra >= 0 ? inicioPalabra + 1 : 0;
          palabrasEliminadas++;
  
          if (endPos <= 0) {
            return '';
          }
        }
  
        // 3. Retornar sólo la parte que no recortamos, con la estructura intacta
        return text.substring(0, endPos);
      }

      function mostrarMenuQuantity() {
        if (mainMenu) mainMenu.style.display = 'none';
        if (quantityMenu) quantityMenu.style.display = 'block';
        if (btnAtras) {
          btnAtras.style.display = 'none';
          btnAtras.disabled = true;
        }
        currentMenu = 'quantity';
        quantityMenuIndex = 0;
        actualizarTextoCantidad();
        actualizarSeleccionQuantityMenu();
        if (typeof actualizarEstadoMenuAccionesPartida1P === "function") {
          actualizarEstadoMenuAccionesPartida1P();
        }
      }
  
      function mostrarMenuPrincipal() {
        // El flujo de 1P ya no muestra decision Si/No: va directo a confirmar resurreccion.
        mostrarMenuQuantity();
      }

      function iniciarMenu() {
        if (modo_actual === "frase final") {
          finalizarSinResurreccion();
          return;
        }
        if (!puedeResucitarSegunEstado()) {
          finalizarSinResurreccion();
          return;
        }
        menu_resurreccion_activo = true;
        console.log("Iniciando menú de resurrección");
        document.removeEventListener('keydown', manejadorTeclas);
        document.addEventListener('keydown', manejadorTeclas);
        if (mainTitle) mainTitle.style.display = 'none';
        if (buttonContainer) buttonContainer.style.display = 'none';
        if (mainMenu) mainMenu.style.display = 'none';
        mostrarMenuQuantity();
animarCSSJuego1P("#quantityMenu", "flash");
      }
  
      /*************************************************************
        EVENTOS DE CLICK PARA LOS BOTONES CON stopPropagation()
      **************************************************************/
      if (btnSi) {
        btnSi.addEventListener('click', (evento) => {
          evento.stopPropagation();
          mostrarMenuQuantity();
        });
      }
  
      if (btnNo) {
        btnNo.addEventListener('click', (evento) => {
          evento.stopPropagation();
          finalizarSinResurreccion();
        });
      }
      
  
      btnConfirmar.addEventListener('click', (evento) => {
        evento.stopPropagation();
        if (modo_actual === "frase final") {
          finalizarSinResurreccion();
          return;
        }
        const segundosResurreccion = palabras * PALABRAS_A_SEGUNDOS;
        if (typeof socket !== "undefined" && socket && typeof socket.emit === "function") {
          socket.emit("resucitar", {player: player, secs: segundosResurreccion});
        }

        // Recortar las últimas "palabras" de "texto_guardado"
        console.log("texto_guardado", palabras);
        console.log("texto_guardado", texto_guardado);

        texto_guardado = recortarUltimasPalabras(texto_guardado, palabras);

        console.log("texto_guardado", texto_guardado);

        reanudarTrasResurreccion(segundosResurreccion);
      });

      function ejecutarAccionMenuResurreccion(tecla) {
        if (currentMenu === 'quantity') {
          switch (tecla) {
        case 'ArrowLeft':
          quantityMenuIndex--;
          if (quantityMenuIndex < 0) {
            quantityMenuIndex = quantityMenuElements.length - 1; 
          }
          actualizarSeleccionQuantityMenu();
          break;
        case 'ArrowRight':
          quantityMenuIndex++;
          if (quantityMenuIndex >= quantityMenuElements.length) {
            quantityMenuIndex = 0;
          }
          actualizarSeleccionQuantityMenu();
          break;
        case 'ArrowUp':
          if (quantityMenuIndex === 0) {
            const maxPalabras = obtenerMaxPalabrasResucitar();
            let esLimite = false;
            if (palabras < maxPalabras) {
              palabras++;
              actualizarTextoCantidad();
              esLimite = palabras >= maxPalabras;
            } else {
              esLimite = true;
            }
            activarIndicadorConversor('up', esLimite);
          }
          break;
        case 'ArrowDown':
          if (quantityMenuIndex === 0) {
            let esLimite = false;
            if (palabras > 1) {
              palabras--;
              actualizarTextoCantidad();
              esLimite = palabras <= 1;
            } else {
              esLimite = true;
            }
            activarIndicadorConversor('down', esLimite);
          }
          break;
        case 'Enter':
          btnConfirmar.click();
          break;
        default:
          break;
          }
        }
      }

      /*************************************************************
        EVENTO DE TECLAS: FLECHAS Y ENTER
      **************************************************************/
      // Definimos la función manejadora de eventos de teclado.
function manejadorTeclas(evento) {
    const tecla = (evento.key === 'Enter' || evento.code === 'NumpadEnter')
      ? 'Enter'
      : evento.key;
    evento.stopPropagation();
    ejecutarAccionMenuResurreccion(tecla);
  }

      document.querySelectorAll('[data-res-key]').forEach((botonKeypad) => {
        botonKeypad.addEventListener('click', (evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          const tecla = botonKeypad.getAttribute('data-res-key');
          if (!tecla) return;
          ejecutarAccionMenuResurreccion(tecla);
        });
      });


var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecución

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function confetti_aux() {
  if (typeof confetti !== "function") {
    reproducirAudioFinal();
    isConfettiRunning = false;
    return;
  }
  reproducirAudioFinal();
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
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function stopConfetti() {
  detenerAudioFinal();
  isConfettiRunning = false; // Deshabilita la ejecución de confetti
  if (typeof confetti === "function" && typeof confetti.reset === "function") {
    confetti.reset();
  }
}

function final(){
    setPartidaActivaCursorPluma(false);

    menu_modificador = false;
    cancelarSecuenciaDesventaja();
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    cerrarResumenPartida();
    limpieza_final();
    
    modo_actual = "";
    putada_actual = "";
    // Impide que se pueda escribir en los dos textos.
    texto.contentEditable= "false";

    // Variable booleana que dice si la ronda ha terminado o no.
    terminado = true;
    if (typeof actualizarEstadoMenuAccionesPartida1P === "function") {
        actualizarEstadoMenuAccionesPartida1P();
    }
    
    console.log("ES EL FINAL")
    texto.style.maxHeight = "none";
    texto.style.height = "auto";
    texto.style.height = texto.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
    //texto.style.display = "none";
    
    animarCSSJuego1P(".cabecera", "backInLeft").then((message) => {
        animarCSSJuego1P(".contenedor", "pulse");
    });
    if (logo) logo.style.display = "";
    if (neon) neon.style.display = "";
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    LIMPIEZAS["psicodélico"]("");/* TODO: VER POR QUÉ NO FUNCIONA ESTO  */
    texto.removeEventListener("keyup", listener_modo_psico);
    restablecer_estilo();
    tiempo.style.color = "white";
}

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

