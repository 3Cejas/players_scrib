socket.on("musa_corazon", (data) => {
    const equipo = data && Number(data.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    lanzarCorazonEscritor(equipo);
});

socket.on("nombre1", (data) => {
    const nombreAzul = normalizarNombreCursorCalentamientoEscritor(data, "ESCRITXR 1");
    nombres_cursores_calentamiento_escritor[1] = nombreAzul;
    if (player == 1 && nombre) {
        nombre.value = nombreAzul;
    }
    actualizarEtiquetasCursorCalentamientoEscritor();
});

socket.on("nombre2", (data) => {
    const nombreRojo = normalizarNombreCursorCalentamientoEscritor(data, "ESCRITXR 2");
    nombres_cursores_calentamiento_escritor[2] = nombreRojo;
    if (player == 2 && nombre) {
        nombre.value = nombreRojo;
    }
    actualizarEtiquetasCursorCalentamientoEscritor();
});

const {
    TORTUGA: PUTADA_TORTUGA,
    RAYO: PUTADA_RAYO,
    ESPEJO: PUTADA_INVERSO,
    BLOQUEO: PUTADA_PLUMA,
    BRUMA: PUTADA_BORROSO
} = window.ScribDisadvantages.EMOJIS;

const PUTADAS = {
    [PUTADA_TORTUGA]: function () {
        if (timeout_teclado_lento) {
            clearTimeout(timeout_teclado_lento);
            timeout_teclado_lento = null;
        }
        teclado_lento_putada = true;
        putada_actual = PUTADA_TORTUGA;
        const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
        timeout_teclado_lento = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            teclado_lento_putada = false;
            putada_actual = "";
            timeout_teclado_lento = null;
        }, TIEMPO_MODIFICADOR);
    },
    "âŒ›": function () {
    },
    [PUTADA_RAYO]: function () {
        const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
        borrado_cambiado = true;
        antiguo_rapidez_borrado = rapidez_borrado;
        antiguo_inicio_borrado = rapidez_inicio_borrado;
        
        rapidez_borrado = reduceLog(rapidez_borrado, RAYO_REDUCCION_K);
        rapidez_inicio_borrado = reduceLog(rapidez_inicio_borrado, RAYO_REDUCCION_K);
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.transform = "translateX(-50%)";
        lightning.style.top = "27%";
        lightning.style.left = "50%";
        setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            borrado_cambiado = false;
            rapidez_borrado = antiguo_rapidez_borrado;
            rapidez_inicio_borrado = antiguo_inicio_borrado;
        }, TIEMPO_MODIFICADOR);
    },

    [PUTADA_INVERSO]: function () {
        tiempo_inicial = new Date();
        desactivar_borrar = true;
        //caret = guardarPosicionCaret();
        //caretNode = caret.caretNode;
        //caretPos = caret.caretPos;
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // AÃ±ade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            texto.removeEventListener('animationend', arguments.callee);
        });

        procesarTexto();
        // Obtener el Ãºltimo nodo de texto en text
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el Ãºltimo nodo de texto, colocamos el cursor allÃ­
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        sendText();
        const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
        temp_text_inverso_activado = true;
        setInterfazInversaGlobal(true);
        tempo_text_inverso = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            temp_text_inverso_activado = false;
            setInterfazInversaGlobal(false);
            desactivar_borrar = false;

            texto.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.contentEditable= "true";
                texto.focus()
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            let lastLine = texto.lastChild;
            let lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el Ãºltimo nodo de texto, colocamos el cursor allÃ­
            if (lastTextNode) {
                let caretNode = lastTextNode;
                let caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            putada_actual = "";
        sendText()  
        }, TIEMPO_MODIFICADOR);
    },

    [PUTADA_PLUMA]: function () {
        if (timeout_bloqueo_putada) {
            clearTimeout(timeout_bloqueo_putada);
            timeout_bloqueo_putada = null;
        }
        bloquear_borrado_putada = true;
        putada_actual = PUTADA_PLUMA;
        const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
        timeout_bloqueo_putada = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            limpiar_bloqueo_putada();
        }, TIEMPO_MODIFICADOR);
    },

    [PUTADA_BORROSO]: function () {
        const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
        modo_texto_borroso = 1;
        tiempo_inicial = new Date();
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            putada_actual = "";
        }, TIEMPO_MODIFICADOR);
    },
};

function renderizarObjetivoFraseFinalEscritora() {
    if (!palabra) return;
    palabra.innerHTML = traducirTituloModoEscritora("frase final", "NIVEL FRASE FINAL");
    const fraseObjetivo = String(frase_final || "").trim();
    const palabraObjetivo = fraseObjetivo ? "\u00AB" + fraseObjetivo + "\u00BB" : "\u00AB-\u00BB";
    renderObjetivoNivelEscritora(palabraObjetivo, {
        tipo: "frase-final",
        descripcion: traducirDescripcionModoEscritora("frase final", "ULTIMA RONDA")
    });
}

function refrescarCabeceraModoActualEscritora() {
    if (!palabra || !explicacion) return;
    if (modo_actual === "palabras bonus") {
        explicacion.style.color = "yellow";
        explicacion.innerHTML = traducirDescripcionModoEscritora("palabras bonus", "SUMA TIEMPO CON PALABRAS BONUS");
        palabra.innerHTML = traducirTituloModoEscritora("palabras bonus", "NIVEL PALABRAS BONUS");
        return;
    }
    if (modo_actual === "letra prohibida") {
        explicacion.style.color = "red";
        explicacion.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        palabra.innerHTML = traducirTituloModoEscritora("letra prohibida", "NIVEL LETRA PROHIBIDA");
        return;
    }
    if (modo_actual === "letra bendita") {
        explicacion.style.color = "lime";
        explicacion.innerHTML = construirExplicacionNivelLetraEscritora("bendita", letra_bendita);
        palabra.innerHTML = traducirTituloModoEscritora("letra bendita", "NIVEL LETRA BENDITA");
        return;
    }
    if (modo_actual === "tertulia") {
        explicacion.style.color = "#86d0ff";
        explicacion.innerHTML = traducirDescripcionModoEscritora("tertulia", "DIALOGA CON TUS MUSAS");
        palabra.innerHTML = traducirTituloModoEscritora("tertulia", "NIVEL TERTULIA");
        return;
    }
    if (modo_actual === "palabras prohibidas") {
        explicacion.style.color = "pink";
        explicacion.innerHTML = traducirDescripcionModoEscritora("palabras prohibidas", "EVITA LAS PALABRAS PROHIBIDAS");
        palabra.innerHTML = traducirTituloModoEscritora("palabras prohibidas", "NIVEL PALABRAS PROHIBIDAS");
        return;
    }
    if (modo_actual === "frase final") {
        explicacion.style.color = "orange";
        explicacion.innerHTML = traducirDescripcionModoEscritora("frase final", "ULTIMA RONDA");
        renderizarObjetivoFraseFinalEscritora();
    }
}

function refrescarCountdownEscritora() {
    if (window && typeof window.scribRefreshCountdownText2P === "function") {
        window.scribRefreshCountdownText2P(document.getElementById("countdown"));
    }
}

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("bonus");
        if (explicacion) {
            explicacion.style.color = "yellow";
            explicacion.innerHTML = traducirDescripcionModoEscritora("palabras bonus", "SUMA TIEMPO CON PALABRAS BONUS");
        }
        palabra.innerHTML = traducirTituloModoEscritora("palabras bonus", "NIVEL PALABRAS BONUS");
        definicion.innerHTML = "";
        socket.emit("nueva_palabra", player);
        socket.on(enviar_palabra, data => {
          console.log(data)
            recibir_palabra(data);
        });
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("prohibida");
        letra_prohibida = data.letra_prohibida;
        //TO DO: MODIFICAR FUNCIÃ“N PARA QUE NO ESTÃ‰ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        if (explicacion) {
            explicacion.style.color = "red";
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        }
        palabra.innerHTML = traducirTituloModoEscritora("letra prohibida", "NIVEL LETRA PROHIBIDA");
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
    },

    "letra bendita": function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("bendita");
        letra_bendita = data.letra_bendita;
        //TO DO: MODIFICAR FUNCIÃ“N PARA QUE NO ESTÃ‰ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        if (explicacion) {
            explicacion.style.color = "lime";
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("bendita", letra_bendita);
        }
        palabra.innerHTML = traducirTituloModoEscritora("letra bendita", "NIVEL LETRA BENDITA");
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
    },

    "texto borroso": function (data) {
        tiempo_inicial = new Date();
        duracion = data.duracion;
        if(es_pausa == false){
            modo_borroso(data);
        }
        else{
            modo_borroso_pausa(data);
        }
    },

    "psicodÃ©lico": function (data) {
        //explicaciÃ³n.innerHTML = "MODO PSICODÃ‰LICO";
        //palabra1.innerHTML = "";
        //definicion1.innerHTML = "";
        listener_modo_psico = function () { modo_psicodelico() };
        texto.addEventListener("keyup", listener_modo_psico);
        activado_psico = true;
        /*socket.on("psico_a_j1", (data) => {
            stylize();
        });*/
    },

    'tertulia': function (socket) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("tertulia");
        es_pausa = true;
        tiempo_restante = TIEMPO_MODIFICADOR - (new Date().getTime() - tiempo_inicial.getTime());
        pausa();
        // Fuerza un snapshot al entrar en tertulia para resincronizar
        // vistas remotas aunque no haya una nueva pulsacion de texto.
        sendText();
        if (explicacion) {
            explicacion.style.color = "#86d0ff";
            explicacion.innerHTML = traducirDescripcionModoEscritora("tertulia", "DIALOGA CON TUS MUSAS");
        }
        palabra.innerHTML = traducirTituloModoEscritora("tertulia", "NIVEL TERTULIA");
        definicion.innerHTML = "";
    },

    'palabras prohibidas': function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("prohibidas");
        if (explicacion) {
            explicacion.style.color = "pink";
            explicacion.innerHTML = traducirDescripcionModoEscritora("palabras prohibidas", "EVITA LAS PALABRAS PROHIBIDAS");
        }
        palabra.innerHTML = traducirTituloModoEscritora("palabras prohibidas", "NIVEL PALABRAS PROHIBIDAS");
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_prohibida", player);
        socket.on(enviar_palabra, data => {
            console.log("ESTA FUNCIONANDOOOOOO")
            recibir_palabra_prohibida(data);
        });
    },

    'frase final': function (socket) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("frase-final");
        if (explicacion) {
            explicacion.style.color = "orange";
            explicacion.innerHTML = traducirDescripcionModoEscritora("frase final", "ULTIMA RONDA");
        }
        palabra.innerHTML = traducirTituloModoEscritora("frase final", "NIVEL FRASE FINAL");
        definicion.innerHTML = "";
        function_frase_final();
    },

    "": function (data) { },
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        socket.off(enviar_palabra);
        asignada = false;
        limpiarDeteccionMultipalabraAsignada();
        texto.removeEventListener("keyup", listener_modo);
        definicion.style.fontSize = "1.5vw";
    },

    "letra prohibida": function (data) {
        texto.removeEventListener("beforeinput", listener_modo, true);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        texto.removeEventListener("beforeinput", listener_modo, true);
        letra_bendita = "";
    },

    "borroso": function (data) {
        texto.classList.remove("textarea_blur");
    },

    "psicodÃ©lico": function (data) {
        //socket.off('psico_a_j1');
        texto.removeEventListener("keyup", listener_modo_psico);
        activado_psico = false;
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodÃ©lico, se vuelve a limpiar.
    },

    "tiempo_borrado_mÃ¡s": function (data){ },
    
    "tertulia": function (data) {
        es_pausa = false;
        reanudar();
    },

    "palabras prohibidas": function (data) {
        socket.off(enviar_palabra);
        asignada = false;
        limpiarDeteccionMultipalabraAsignada();
        texto.removeEventListener("keyup", listener_modo);
    },


    "frase final": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        limpiarMarcadoFraseFinal();
    },

    "": function (data) { },
};

// Cuando el texto cambia, envÃ­a los datos actuales al resto.
texto.addEventListener("input", () => {
    if (restaurando_bendita) return;
    countChars(texto);
    sendText();
});

// Enviar teclas para el mapa de calor.
texto.addEventListener("keydown", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key == "Backspace") {
        socket.emit('tecla_jugador', { player, code: evt.code || "", key: evt.key || "" });
    }
});

socket.on("idioma_actual", (payload = {}) => {
    if (window && typeof window.scribSetLanguage2P === "function") {
        window.scribSetLanguage2P(payload && payload.idioma ? payload.idioma : "es");
    }
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    limpiarAsincroniaVisualEscritora({ resetViewport: true });
    invalidarEstadoAsincronoEscritora();
    modo_seq_actual = 0;
    ultimo_count_seq_escritora = 0;
    tiempo_seq_actual_escritora = 0;
    resurreccion_confirmacion_pendiente = false;
    sincronizarEstadoContadorEscritora(null, "");
    actualizarEtiquetasCursorCalentamientoEscritor();
    socket.emit('registrar_escritor', player);
    socket.emit('pedir_idioma_actual');
    socket.emit('pedir_calentamiento_estado');
    socket.emit('pedir_estado_regalo_bandera_musas');
    socket.emit('calentamiento_cursor', { visible: false });
});

socket.on('disconnect', () => {
    limpiarAsincroniaVisualEscritora({ resetViewport: true });
    invalidarEstadoAsincronoEscritora();
});

socket.on('connect_error', () => {
    limpiarAsincroniaVisualEscritora({ resetViewport: true });
    invalidarEstadoAsincronoEscritora();
});

socket.on('calentamiento_vista', (data) => {
    actualizarVistaCalentamientoEscritor(Boolean(data && data.activo));
});

socket.on('calentamiento_estado_espectador', (data) => {
    actualizarCalentamientoEscritor(data || {});
});

socket.on('calentamiento_cursor', (payload = {}) => {
    actualizarCursorCalentamientoEscritor(payload);
});

socket.on('calentamiento_error_escritor', (data = {}) => {
    mostrarErrorCalentamientoEscritor(data && data.mensaje ? data.mensaje : tJuego2P("warmup.feedback.generic_error", {}, "No se pudo completar la accion."));
});

//activar los sockets extratextuales.
activar_sockets_extratextuales();
socket.on('actualizar_contador_musas', contador_musas => {
    console.log("actualizar_contador_musas")
    const totalMusas = player == 1 ? contador_musas.escritxr1 : contador_musas.escritxr2;
    actualizarMusasMarcador(totalMusas);
});

socket.on('musa_regalo_bandera_estado', (payload = {}) => {
    actualizarEstadoRegaloBanderaEscritora(payload);
});

// Recibe los datos del jugador 1 y los coloca.
/*socket.on(texto_x, (data) => {
    texto.innerText = data.text;
    puntos.innerHTML = data.points;
    nivel.innerHTML = data.level;
    texto.scrollTop = texto.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
});
*/

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", (data) => {
    if (!aceptarEventoModoEscritora(data)) {
        return;
    }
    if (!aceptarTiempoEscritora(data)) {
        return;
    }
    const countSeq = Number(data && data.count_seq);
    if (Number.isFinite(countSeq) && countSeq > 0) {
        if (countSeq <= ultimo_count_seq_escritora) {
            return;
        }
        ultimo_count_seq_escritora = Math.trunc(countSeq);
    }
    if(data.player == player){
    procesarFulgorCambioTiempoDesdeContador(data.count);
    const segundosCount = extraerSegundosContador(data.count);
    if (segundosCount !== null && segundosCount >= 10 && activado_psico) {
        LIMPIEZAS["psicodÃ©lico"]("");
    }
    if (segundosCount !== null) {
        if (segundosCount >= 20) {
            tiempo.style.color = "white";
        } else if (segundosCount >= 10) {
            tiempo.style.color = "yellow";
        } else if (activado_psico == false) {
            MODOS["psicodÃ©lico"](data, socket);
            tiempo.style.color = "red";
        } else {
            tiempo.style.color = "red";
        }
    }

    const textoCount = String(data.count || "").toLowerCase().includes("tiempo")
        ? tJuego2P("timer.time_up", {}, "Â¡Tiempo!")
        : data.count;
    tiempo.innerHTML = textoCount;
    const animarEntradaVida = Boolean(animacionEntradaVidaPendiente && Number.isFinite(segundosCount));
    actualizarBarraVida(tiempo, textoCount, { animarEntrada: animarEntradaVida });
    if (animarEntradaVida) {
        animacionEntradaVidaPendiente = false;
    }
    if (Number.isFinite(segundosCount)) {
        actualizarProgresoFraseFinalEscritora(segundosCount);
    }
    if (String(data.count || "").toLowerCase().includes("tiempo")) {
        actualizarProgresoFraseFinalEscritora(0);
        limpiar_bloqueo_putada();
        limpiar_teclado_lento();
        setInterfazInversaGlobal(false);
        console.log(putada_actual, "esto no doeberÃ­a ocurrir")
        if (putada_actual == PUTADA_INVERSO){
            console.log("NO PUEDOOOOO ESTO NO DEBERÃA OCURRRIR")
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.removeEventListener('animationend', arguments.callee);
            });
            clearTimeout(tempo_text_inverso);
            temp_text_inverso_activado = false;
            setInterfazInversaGlobal(false);
            procesarTexto();
        }
        sendText();
        if (modo_actual != "" && modo_actual != "frase final") {
        LIMPIEZAS["psicodÃ©lico"]("");
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
                setInterfazInversaGlobal(false);
                clearTimeout(tempo_text_inverso);
                procesarTexto();
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            capturarTextoGuardadoDesdeEditor();
        
            //texto.innerText = "";
            texto.style.display = "none";
            texto.style.height = "";
            feedback_tiempo.style.color = color_positivo;
            texto.rows =  "6";
            definicion.style.fontSize = "1.5vw";
            temas.innerHTML = "";
            temas.display = "";
            texto.contentEditable= "false";
            palabra.innerHTML = "";
            definicion.innerHTML = "";
            explicacion.innerHTML = "";
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
            limpiarDeteccionMultipalabraAsignada();
            palabra_actual = []; // Variable que almacena la palabra bonus actual.            
            // Desactiva, por seguridad, todos los modos.
            modo_texto_borroso = 0;
            desactivar_borrar = true;
            console.log(puntos)
            
            limpiarFeedbackFlotanteEscritora();
            
            definicion.innerHTML = "";
            explicacion.innerHTML = "";
        
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
        
            if (typeof invalidarBorradoEscritora === "function") {
                invalidarBorradoEscritora();
            }
            clearTimeout(cambio_palabra);
            clearTimeout(tempo_text_borroso);
        }
        console.log(data)
        console.log("MIERDA PUTA")
        console.log(texto.innerHTML)
        console.log(temp_text_inverso_activado)
        const rondaActivaParaResolucion = hayRondaActivaParaResucitar();
        if (!terminado && rondaActivaParaResolucion && puedeResucitarSegunEstado()) {
            iniciarMenu();
        } else if (!terminado && rondaActivaParaResolucion) {
            esperando_resurreccion_tiempo = false;
            btnNo.click();
        }
        }
    }
});

socket.on("aumentar_tiempo_control", (data = {}) => {
    if (Number(data.player) !== Number(player)) return;
    if (!aceptarTiempoEscritora(data)) return;
    activarFulgorCambioTiempoEscritora(data.secs);
    aplicarAjusteLocalTiempoEscritora(data.secs, data);
    if (data.origen === "musa_bandera") {
        mostrarFeedbackRegaloBanderaEscritora(data);
    }
});

socket.on("resucitar_control", (data = {}) => {
    if (Number(data.player) !== Number(player)) return;
    if (!aceptarTiempoEscritora(data)) return;
    resurreccion_confirmacion_pendiente = false;
    resucitar();
    if (Number.isFinite(Number(data.secs)) && Number(data.secs) > 0) {
        const textoContador = formatearSegundosContador(Number(data.secs));
        tiempo.innerHTML = textoContador;
        actualizarBarraVida(tiempo, textoContador, { animarEntrada: true });
        ultimo_tiempo_contador_segundos = Math.max(0, Math.trunc(Number(data.secs)));
        ultimo_tiempo_contador_ms = Date.now();
    }
    post_inicio(false);
});
  
function resucitar(){
    terminado = false;
    esperando_resurreccion_tiempo = false;
    resurreccion_confirmacion_pendiente = false;
    gameover_ui_activa_escritora = false;
    reproducirEfectoVidaEscritora(AUDIO_RESUCITAR_ESCRITORA);
    permitir_fin_por_decision_local = false;
    desactivar_borrar = false;
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    ocultarUiResucitar({ emitirEstado: false });
    setIndicadorGanadoraEscritora(false);
    document.body.classList.remove('modo-resucitar');
    logo.style.display = "none"; 
    neon.style.display = "none"; 
    tiempo.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    tiempo.style.display = "";

    pararEscritura = true;
    stopConfetti();
    limpiarCountdownInicioEscritora();
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    if(temp_text_inverso_activado == true){
        clearTimeout(tempo_text_inverso);
        temp_text_inverso_activado = false;
        setInterfazInversaGlobal(false);
        procesarTexto();
    }

    restaurarTextoGuardadoEnEditor();
    texto.style.display = "";
    texto.style.height = "";
    feedback_tiempo.style.color = color_positivo;
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
    explicacion.innerHTML = "";
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
        restaurarTextoGuardadoEnEditor();

        sendText()

        // Obtener el Ãºltimo nodo de texto en texto
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el Ãºltimo nodo de texto, colocamos el cursor allÃ­
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        texto.scrollTo(0, texto.scrollHeight);
        colocarCursorAlFinalEditor();
}

// Inicia el juego.
socket.on("inicio", (data) => {
    invalidarEstadoAsincronoEscritora();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    reiniciarProgresoFraseFinalEscritora();
    partida_global_finalizada = false;
    setInterfazInversaGlobal(false);
    permitir_fin_por_decision_local = false;
    esperando_resurreccion_tiempo = false;
    ocultarUiResucitar({ emitirEstado: false });
    limpiarCountdownInicioEscritora();
    post_inicio_pendiente_escritora = null;
    ultimo_tiempo_contador_segundos = null;
    ultimo_tiempo_contador_ms = 0;
    animateCSS(".cabecera", "backOutLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    // Comprueba que data.parametros existe y que el campo solicitado no es null/undefined
    if (player == 1) {
      if (data.parametros?.FRASE_FINAL_J1) {
        frase_final = data.parametros.FRASE_FINAL_J1.trim().toLowerCase();
      }
    } else if(player == 2) {
      if (data.parametros?.FRASE_FINAL_J2) {
        frase_final = data.parametros.FRASE_FINAL_J2.trim().toLowerCase();
      }
    }
    console.log("FRASE FINAL", data.parametros)
    console.log("FRASE FINAL", frase_final)
    limpieza();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR + ajustarDestreza(data.parametros.TIEMPO_MODIFICADOR, atributos['destreza']);
    actualizarDuracionNivelDesdeParametrosEscritora(data && data.parametros ? data.parametros : {});
    console.log(atributos);
    ajustarRapidez(rapidez_borrado, rapidez_inicio_borrado, atributos['agilidad'])
    secs_palabras = ajustarFuerza(SECS_BASE, atributos['fuerza'])
    desactivar_borrar = false;
    texto.style.height = "";

    logo.style.display = "none"; 
    neon.style.display = "none"; 
    texto.contentEditable= "false";
    tiempo.innerHTML = "";
    tiempo.style.display = "";
    setProgresoNivelBarraEscritora(0);
    iniciarSecuenciaIntroPartidaEscritora();

    // Se muestra "Â¿PREPARADOS?" antes de comenzar la cuenta atrÃ¡s.
    $('#countdown').remove();
    var preparados = $('<span id="countdown"></span>');
    preparados.text(tJuego2P("countdown.ready", {}, "Â¿PREPARADOS?"));
    preparados.appendTo($('.container'));
    preparados_timer = setTimeout(() => {
        preparados_timer = null;
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        revelarEtapaIntroPartidaEscritora(1);
    }, 20);

    listener_cuenta_atras = setTimeout(() => {
    listener_cuenta_atras = null;
    var counter = 3;

    timer = setInterval(function() {

      $('#countdown').remove();

      var countdown = $('<span id="countdown"></span>');
      countdown.text(counter === 0 ? tJuego2P("countdown.write", {}, "Â¡ESCRIBE!") : counter);
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
        }, 1000);
      }
    }, 1000);
}, 1000);

    // Failsafe: evita que el contador se quede bloqueado en pantalla.
    fallback_cuenta_atras_timer = setTimeout(() => {
        limpiarCountdownInicioEscritora();
        finalizarSecuenciaIntroPartidaEscritora();
    }, 7000);
});
});

socket.on("post-inicio", (data) => {
    if (hayCountdownInicioActivoEscritora()) {
        post_inicio_pendiente_escritora = data || {};
        if (!listener_cuenta_atras && !timer && !secuencia_inicio_escritora_activa) {
            finalizarSecuenciaIntroPartidaEscritora();
        }
        return;
    }
    console.log(data && data.borrar_texto, "borrar texto");
    aplicarPostInicioEscritora(data && data.borrar_texto);
});    

socket.on("borrar_texto_guardado", () => {
    texto_guardado = "";
    sendText();
});

function post_inicio(borrar_texto){
    limpiarCountdownInicioEscritora();
    setIndicadorGanadoraEscritora(false);
    if (borrar_texto === false) {
        if (!String(texto_guardado || "").trim() && texto) {
            const textoActual = normalizarSaltosTextoGuardado(obtenerTextoPlanoConSaltos(texto));
            if (String(textoActual || "").trim()) {
                texto_guardado = textoActual;
            }
        }
        restaurarTextoGuardadoEnEditor();

        sendText();

        // Obtener el Ãºltimo nodo de texto en texto
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el Ãºltimo nodo de texto, colocamos el cursor allÃ­
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        texto.scrollTo(0, texto.scrollHeight);
    } else if (borrar_texto === true) {
        texto_guardado = "";
        if (texto) {
            texto.innerText = "";
            texto.scrollTo(0, 0);
        }
        sendText();
    }
    
    // socket.off("recibe_temas");
    // Si el modo activo es tertulia, no debe permitirse escribir.
    if (modo_actual === "tertulia" || es_pausa === true) {
        texto.contentEditable = "false";
        texto.blur();
    } else {
        texto.contentEditable = "true";
        texto.focus();
        requestAnimationFrame(() => {
            colocarCursorAlFinalEditor();
        });
    }
}

// Resetea el tablero de juego.
socket.on("limpiar", (borrar) => {
    partida_global_finalizada = true;
    detenerProgresoNivelBarraEscritora(true);
    if(borrar == false){
        capturarTextoGuardadoDesdeEditor();
    }
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    secuencia_inicio_escritora_activa = false;
    post_inicio_pendiente_escritora = null;
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);

    limpieza();
    document.body.classList.remove('partida-activa');
    actualizarOcultacionMarcadorEscritora();

    stopConfetti()
    
    texto.rows =  "1";

    modo_actual = "";
    putada_actual = "";

    temas.innerHTML = "";
    
    texto.contentEditable= "false";

    tiempo.style.display = "none";
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    });
    logo.style.display = "";
    neon.style.display = ""; 
    texto.removeEventListener("keyup", listener_modo_psico);
    texto.removeEventListener("keyup", listener_modo1);

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    restablecer_estilo();
});

socket.on("activar_modo", (data) => {
    if (!aceptarEventoModoEscritora(data)) {
        return;
    }
    const modoSiguiente = data && typeof data.modo_actual === "string" ? data.modo_actual : "";
    if (estaResurreccionActiva()) {
        // Mantener activa la UI de resurrecciÃ³n evita cierres prematuros
        // y desincronizaciones con espectador durante carreras de eventos.
        permitir_fin_por_decision_local = false;
    }
    animacion_modo();
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");
    setProgresoNivelBarraEscritora(0);
    palabra.innerHTML = "";
    if (explicacion) {
        explicacion.innerHTML = "";
    }
    invalidarEstadoAsincronoEscritora();
    LIMPIEZAS[modo_actual](data);
    rapidez_borrado -= 100;
    rapidez_inicio_borrado -= 100;
    modo_actual = modoSiguiente;
    actualizarDuracionNivelDesdeParametrosEscritora(data || {});
    if(terminado == false){
    MODOS[modo_actual](data, socket);
    }
    if (modo_actual !== "frase final") {
        reiniciarProgresoFraseFinalEscritora();
    }
    if (modo_actual) {
        iniciarProgresoNivelBarraEscritora();
    } else {
        detenerProgresoNivelBarraEscritora(true);
    }
});

socket.on(enviar_palabra, data => {
    if (estaResurreccionActiva()) {
        return;
    }
    if(modo_actual == "palabras bonus"){
        recibir_palabra(data);
    }
});

socket.on('pausar_js', data => {
    es_pausa = true;
    LIMPIEZAS[modo_actual](data);
    tiempo_restante = TIEMPO_MODIFICADOR - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
});

socket.on('fin', data => {
    const payload = (data && typeof data === "object") ? data : { player: data };
    const jugadorFin = Number(payload && payload.player);
    const motivoFin = payload && payload.motivo === "sin_palabras" ? "sin_palabras" : "";
    const cierreSinPalabras = motivoFin === "sin_palabras"
        || (
            Number(player) === jugadorFin &&
            modo_actual !== "frase final" &&
            obtenerPalabrasMarcadorEscritora() <= 0
        );
    const esFinForzadoControl = Boolean(
        payload &&
        payload.origen === "control" &&
        payload.forzar_fin === true
    );
    console.log(data);
    if (Number(player) === jugadorFin) {
        const finEnFraseFinal = modo_actual === "frase final";
        if (!esFinForzadoControl && !permitir_fin_por_decision_local && !partida_global_finalizada) {
            if (estaResurreccionActiva()) {
                return;
            }
            if (!finEnFraseFinal && puedeResucitarSegunEstado()) {
                return;
            }
        }
        esperando_resurreccion_tiempo = false;
        ocultarUiResucitar();
        console.log("confetti_auxAAXACASCASCASCAS");
        const textoGanador = cierreSinPalabras ? TEXTO_PERDISTE_SIN_PALABRAS : undefined;
        final({ textoGanador });
        permitir_fin_por_decision_local = false;
    }
});

socket.on('reanudar_js', data => {
    if (modo_actual === "tertulia") {
        es_pausa = true;
        pausa();
        return;
    }
    es_pausa = false;
    reanudar();
});

socket.on(inspirar, data => {
    if (estaResurreccionActiva()) {
        return;
    }
    const palabra = typeof data === "string" ? data : data?.palabra;
    const musa_nombre = (data && typeof data === "object") ? (data.musa_nombre || data.musa) : "";
    if (palabra != "") {
        palabra_actual = [palabra];
        const musaLabel = musa_nombre ? escapeHtml(musa_nombre) : "MUSA";
        definicion.innerHTML = (`<span style='color: orange;'>${musaLabel}</span>` +
        "<span style='color: white;'>: </span>" +
        "<span style='color: white;'>PodrÃ­as escribir la palabra Â«</span>" +
        "<span style='color: lime; text-decoration: underline;'>" + escapeHtml(palabra) +
        "</span><span style='color: white;'>Â»</span>");
        establecerContextoMusaDefinicion("musa", musa_nombre);
        animateCSS(".definicion", "flash");
        prepararDeteccionMultipalabraAsignada();
        asignada = true;
        texto.removeEventListener("keyup", listener_modo1);
        listener_modo1 = function (e) { palabras_musas(e) };
        texto.addEventListener("keyup", listener_modo1);
    }
});

socket.on(enviar_ventaja, ventaja => {
    mostrarFeedbackFlotanteEscritora(`${ventaja} DESVENTAJA!`, {
        tipo: "negativo",
        color: color_negativo
    });
    console.log(ventaja);
    PUTADAS[ventaja]();
});

socket.on("enviar_repentizado", repentizado => {

    if(terminado == false){
        //temas.innerHTML = "âš ï¸ "+ repentizado + " âš ï¸";
        //efectoMaquinaDeEscribir(texto, repentizado, 150);
        //animateCSS(".temas", "flash")
    }
    
});

socket.on("nueva letra", letra => {
    const eventoLetra = extraerNuevaLetraPayload(letra);
    if (!aceptarEventoModoEscritora(eventoLetra.payload)) {
        return;
    }
    letra = eventoLetra.letra;
    const esModoLetras = (modo_actual == "letra prohibida" || modo_actual == "letra bendita");
    if (!esModoLetras) {
        return;
    }
    const hayObjetivoMusaActivo = Boolean(
        asignada === true
        && obtenerObjetivosPalabraActual().length > 0
    );
    if (!hayObjetivoMusaActivo) {
        palabra_actual = [];
        limpiarDeteccionMultipalabraAsignada();
        definicion.innerHTML = "";
        establecerContextoMusaDefinicion("");
    }
    if(modo_actual == "letra prohibida"){
        letra_prohibida = letra;

        texto.removeEventListener("beforeinput", listener_modo, true);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        animacion_palabra();
        setBarraNivelClaseEscritora("prohibida");
        if (explicacion) {
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        }
        palabra.innerHTML = traducirTituloModoEscritora("letra prohibida", "NIVEL LETRA PROHIBIDA");
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = letra;
        texto.removeEventListener("beforeinput", listener_modo, true);
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        animacion_palabra();
        setBarraNivelClaseEscritora("bendita");
        if (explicacion) {
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("bendita", letra_bendita);
        }
        palabra.innerHTML = traducirTituloModoEscritora("letra bendita", "NIVEL LETRA BENDITA");
    }
});


socket.on(elegir_ventaja, () => {
    confetti_musas();
});

function recibir_palabra(data) {
    if (estaResurreccionActiva()) {
        return;
    }
    if (!aceptarEventoModoEscritora(data, { actualizar: false })) {
        return;
    }
    animacion_modo();
    palabra_actual = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[0] : "";
    setBarraNivelClaseEscritora("bonus");
    const textoPalabra = extraerTextoPalabraEventoEscritora(data);
    palabra.innerHTML = traducirTituloModoEscritora("palabras bonus", "NIVEL PALABRAS BONUS");
    if (data.origen_musa === "musa") {
        const musaLabel = data.musa_nombre ? String(data.musa_nombre) : "MUSA";
        const descripcion = `${musaLabel}: PodrÃ­as escribir esta palabra`;
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "bonus",
            tiempoSegundos: data.tiempo_palabras_bonus,
            descripcion
        });
        establecerContextoMusaDefinicion("musa", data.musa_nombre);
    } else {
        const descripcionBase = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[1] : data && data.definicion;
        const descripcion = normalizarTextoPlanoEscritora(descripcionBase);
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "bonus",
            tiempoSegundos: data.tiempo_palabras_bonus,
            descripcion
        });
        establecerContextoMusaDefinicion("");
    }

    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    prepararDeteccionMultipalabraAsignada();
    asignada = true;
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto.addEventListener("keyup", listener_modo);
}

function recibir_palabra_prohibida(data) {
    if (estaResurreccionActiva()) {
        return;
    }
    if (!aceptarEventoModoEscritora(data, { actualizar: false })) {
        return;
    }
    animacion_modo();
    palabra_actual = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[0] : "";
    setBarraNivelClaseEscritora("prohibidas");
    const textoPalabra = extraerTextoPalabraEventoEscritora(data);
    palabra.innerHTML = traducirTituloModoEscritora("palabras prohibidas", "NIVEL PALABRAS PROHIBIDAS");

    if (data.origen_musa === "musa_enemiga") {
        const musaLabel = data.musa_nombre ? String(data.musa_nombre) : "MUSA ENEMIGA";
        const descripcion = `${musaLabel}: me pega esta palabra`;
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "prohibidas",
            tiempoSegundos: data.tiempo_palabras_bonus,
            descripcion
        });
        establecerContextoMusaDefinicion("musa_enemiga", data.musa_nombre);
    } else {
        const descripcionBase = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[1] : data && data.definicion;
        const descripcion = normalizarTextoPlanoEscritora(descripcionBase);
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "prohibidas",
            tiempoSegundos: data.tiempo_palabras_bonus,
            descripcion
        });
        establecerContextoMusaDefinicion("");
    }
    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    prepararDeteccionMultipalabraAsignada();
    asignada = true;
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
    texto.addEventListener("keyup", listener_modo);
}

// FUNCIONES AUXILIARES.

   /*************************************************************
      VARIABLES GLOBALES Y REFERENCIAS A ELEMENTOS DEL DOM
    **************************************************************/
      const mainMenu = document.getElementById('mainMenu');
      const quantityMenu = document.getElementById('quantityMenu');
  
      const btnSi = document.getElementById('btnSi');
      const btnNo = document.getElementById('btnNo');
      const btnInicio = document.getElementById('btnInicio');
      const mainMenuButtons = [btnSi, btnNo];
      let mainMenuIndex = 0;
  
      const quantityDisplay = document.getElementById('quantityDisplay');
      const btnConfirmar = document.getElementById('btnConfirmar');
      const btnAtras = document.getElementById('btnAtras');
      let quantityMenuElements = [btnConfirmar, btnAtras];
      let quantityMenuIndex = 0;
  
      let palabras = 1;
      const PALABRAS_A_SEGUNDOS = 3;
      let currentMenu = 'main';

      function contarPalabrasTexto(textoBase) {
        const matches = (textoBase || "").match(/\b\w+\b/g);
        return matches ? matches.length : 0;
      }

      function obtenerPalabrasDisponiblesResucitar() {
        const palabrasGuardadas = contarPalabrasTexto(texto_guardado);
        const palabrasActuales = texto && typeof texto.innerText === "string"
          ? contarPalabrasTexto(texto.innerText)
          : 0;
        return Math.max(palabrasGuardadas, palabrasActuales);
      }

      function hayRondaActivaParaResucitar() {
        return Boolean(
          !partida_global_finalizada
          && typeof modo_actual === "string"
          && modo_actual.trim().length > 0
        );
      }

      function puedeResucitarSegunEstado() {
        return hayRondaActivaParaResucitar()
          && modo_actual !== "frase final"
          && obtenerPalabrasDisponiblesResucitar() > 0;
      }

      function estaResurreccionActiva() {
        return Boolean(esperando_resurreccion_tiempo || (document.body && document.body.classList.contains('modo-resucitar')));
      }

      function ajustarPalabrasResucitar() {
        const max = obtenerPalabrasDisponiblesResucitar();
        const min = max > 0 ? 1 : 0;
        if (palabras < min) palabras = min;
        if (palabras > max) palabras = max;
        return { max, min };
      }

      function configurarResurreccionObligatoria(activa) {
        resurreccion_obligatoria_activa = Boolean(activa);
        if (btnAtras) {
          btnAtras.style.display = resurreccion_obligatoria_activa ? 'none' : '';
        }
        quantityMenuElements = resurreccion_obligatoria_activa
          ? [btnConfirmar]
          : [btnConfirmar, btnAtras];
        quantityMenuElements = quantityMenuElements.filter(Boolean);
        if (!quantityMenuElements.length) {
          quantityMenuIndex = 0;
          return;
        }
        if (quantityMenuIndex >= quantityMenuElements.length || quantityMenuIndex < 0) {
          quantityMenuIndex = 0;
        }
      }

      function emitirEstadoResucitar(menuForzado = null) {
        if (!socket || typeof socket.emit !== "function") return;
        const { max } = ajustarPalabrasResucitar();
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        const menu = menuForzado || currentMenu;
        const visible = menu === "main"
          ? (mainMenu && mainMenu.style.display !== "none")
          : menu === "quantity"
            ? (quantityMenu && quantityMenu.style.display !== "none")
            : false;
        if (!hayRondaActivaParaResucitar()) {
          socket.emit("resucitar_menu", window.ScribResurrection.crearEstadoMenu(playerNumber, {
            menu: "hidden",
            visible: false,
            mainIndex: 0,
            quantityIndex: 0,
            palabras: 0,
            max: 0,
            segundos: 0
          }));
          return;
        }
        socket.emit("resucitar_menu", window.ScribResurrection.crearEstadoMenu(playerNumber, {
          menu,
          visible,
          mainIndex: mainMenuIndex,
          quantityIndex: quantityMenuIndex,
          palabras,
          max,
          segundos
        }));
      }

      function ocultarUiResucitar({ emitirEstado = true } = {}) {
        clearTimeout(timeoutID_menu);
        timeoutID_menu = null;
        esperando_resurreccion_tiempo = false;
        resurreccion_confirmacion_pendiente = false;
        gameover_ui_activa_escritora = false;
        configurarResurreccionObligatoria(false);
        currentMenu = 'main';
        mainMenuIndex = 0;
        quantityMenuIndex = 0;
        if (mainMenu) {
          mainMenu.style.display = 'none';
        }
        if (quantityMenu) {
          quantityMenu.style.display = 'none';
        }
        if (mainTitle) {
          mainTitle.style.display = 'none';
        }
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
        document.body.classList.remove('modo-resucitar');
        document.removeEventListener('keydown', manejadorTeclas);
        if (emitirEstado) {
          emitirEstadoResucitar('hidden');
        }
      }
  
      /*************************************************************
        ACTUALIZACIONES DE ESTADO VISUAL
      **************************************************************/
        function toggleFullscreen() {
            if (isFullscreen) {
              // Salir de pantalla completa
              if (document.exitFullscreen) {
                document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
              }
              isFullscreen = false;
            } else {
              // Entrar en pantalla completa
              const elem = document.documentElement;
              if (elem.requestFullscreen) {
                elem.requestFullscreen();
              } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
              } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
              }
              isFullscreen = true;
            }
          }
      
          // ------------------------------------------------------
          // 3) FUNCIÃ“N PRINCIPAL: INICIO DEL JUEGO
          // ------------------------------------------------------
          function inicioJuego() {
            animateCSS(".atributos", "backOutLeft")
              .then(() => {
                      // Creamos un nuevo elemento <style>
                const style = document.createElement('style');
                style.id = 'style-ocultar-cursor'; 
                // AÃ±adimos !important para asegurar que se aplique por encima de cualquier otro cursor
                style.textContent = `* { cursor: none !important; }`;

                // Insertamos la regla en el <head> del documento
                retirarEstiloOcultarCursorEscritora();
                document.getElementById('atributos-container').style.display = "none";
              contenedor.style.display = "flex";
              btnInicio.style.display = "none";
              document.getElementById('total').style.display = "none";
              document.body.classList.add('partida-activa');
              actualizarOcultacionMarcadorEscritora();
              sincronizarCursorPlumaJuegoEscritora();
              animateCSS(".contenedor", "backInLeft");
      
                // Ponemos FULLSCREEN inmediatamente al iniciar
                toggleFullscreen();
      
                // Foco en el textarea
                texto.focus();
      
                // Listener global para alternar fullscreen con click si procede
                socket.emit("enviar_atributos", {player, atributos});
                document.addEventListener('click', function(event) {
                  // SÃ³lo si no estamos en un menÃº de modificadores
                  if (!menu_modificador && modificadorButtons.length === 0 && !vista_calentamiento_escritor) {
                    if (event.button === 0) {       // click izquierdo
                      toggleFullscreen();
                      texto.focus();
                    }
                  }
                });
              });
          }
        function actualizarSeleccionMainMenu() {
        mainMenuButtons.forEach(btn => btn.classList.remove('selected'));
        mainMenuButtons[mainMenuIndex].classList.add('selected');
        mainMenuButtons[mainMenuIndex].focus();
        emitirEstadoResucitar();
      }
  
      function actualizarSeleccionQuantityMenu(enfocar = true) {
        if (!quantityMenuElements.length) return;
        if (quantityMenuIndex >= quantityMenuElements.length || quantityMenuIndex < 0) {
          quantityMenuIndex = 0;
        }
        quantityMenuElements.forEach(el => el.classList.remove('selected'));
        const seleccionado = quantityMenuElements[quantityMenuIndex];
        if (seleccionado) {
          seleccionado.classList.add('selected');
        }
        emitirEstadoResucitar();
        if (!enfocar) return;
        if (resurreccion_obligatoria_activa) {
          btnConfirmar.focus();
          return;
        }
        if (quantityMenuIndex === 0 && btnConfirmar) btnConfirmar.focus();
        if (quantityMenuIndex === 1 && btnAtras) btnAtras.focus();
      }
  
      function actualizarTextoCantidad() {
        const { max } = ajustarPalabrasResucitar();
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        quantityDisplay.innerHTML = construirCantidadResucitarJuego2P({ palabras, segundos, max });
        const arrow = quantityDisplay.querySelector(".resucitar-arrow");
        if (arrow) {
          arrow.innerHTML = "&rarr;";
        }
        const stepper = quantityDisplay.querySelector(".resucitar-stepper");
        if (stepper) {
          const arrows = stepper.querySelectorAll(".resucitar-stepper-arrow");
          if (arrows[0]) arrows[0].id = "resucitarArrowUp";
          if (arrows[1]) arrows[1].id = "resucitarArrowDown";
        }
        emitirEstadoResucitar();
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
        
        let endPos = text.length; // posiciÃ³n hasta la que mantenemos el texto
        let palabrasEliminadas = 0;
  
        while (palabrasEliminadas < cantidadPalabras) {
          // 1. Ignorar espacios y saltos de lÃ­nea desde el final (si los hay)
          while (endPos > 0 && /\s/.test(text[endPos - 1])) {
            endPos--;
          }
          if (endPos <= 0) {
            // Si se quedÃ³ sin texto, todo se elimina
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
  
        // 3. Retornar sÃ³lo la parte que no recortamos, con la estructura intacta
        return text.substring(0, endPos);
      }

      function mostrarMenuQuantity({ obligatoria = false } = {}) {
        configurarResurreccionObligatoria(obligatoria);
        mainMenu.style.display = 'none';
        quantityMenu.style.display = 'block';
        document.body.classList.add('modo-resucitar');
        currentMenu = 'quantity';
        quantityMenuIndex = 0;
        actualizarTextoCantidad();
        actualizarSeleccionQuantityMenu();
        emitirEstadoResucitar();
      }
  
      function mostrarMenuPrincipal() {
        configurarResurreccionObligatoria(false);
        quantityMenu.style.display = 'none';
        mainMenu.style.display = 'block';
        document.body.classList.add('modo-resucitar');
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        emitirEstadoResucitar();
      }

      function iniciarMenu() {
        if (modo_actual === "frase final") {
          esperando_resurreccion_tiempo = false;
          btnNo.click();
          return;
        }
        if (!puedeResucitarSegunEstado()) {
          esperando_resurreccion_tiempo = false;
          btnNo.click();
          return;
        }
        if (!texto_guardado && texto && typeof texto.innerText === "string") {
          capturarTextoGuardadoDesdeEditor();
        }
        clearTimeout(timeoutID_menu);
        permitir_fin_por_decision_local = false;
        esperando_resurreccion_tiempo = true;
        if (!gameover_ui_activa_escritora) {
          gameover_ui_activa_escritora = true;
          reproducirEfectoVidaEscritora(AUDIO_GAME_OVER_ESCRITORA);
        }
        console.log("Iniciando menu de resurreccion obligatoria");
        document.removeEventListener('keydown', manejadorTeclas);
        document.addEventListener('keydown', manejadorTeclas);
        if (mainTitle) {
          mainTitle.style.display = 'none';
        }
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
        mostrarMenuQuantity({ obligatoria: true });
        animateCSS("#quantityMenu", "flash");
      }
  
      /*************************************************************
        EVENTOS DE CLICK PARA LOS BOTONES CON stopPropagation()
      **************************************************************/

    btnInicio.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se active el listener global
        inicioJuego();
        });
      btnSi.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se active el listener global
        if (!puedeResucitarSegunEstado()) {
          esperando_resurreccion_tiempo = false;
          btnNo.click();
          return;
        }
        esperando_resurreccion_tiempo = true;
        mostrarMenuQuantity({ obligatoria: true });
      });
  
      btnNo.addEventListener('click', (evento) => {
        
        evento.stopPropagation();
        permitir_fin_por_decision_local = true;
        esperando_resurreccion_tiempo = false;
        resurreccion_confirmacion_pendiente = false;
        document.body.classList.remove('modo-resucitar');
        restaurarTextoGuardadoEnEditor();
        tiempo.style.color = "white";
        if (terminado == false) {
            const sinPalabrasParaResucitar = modo_actual !== "frase final"
              && !partida_global_finalizada
              && obtenerPalabrasDisponiblesResucitar() <= 0;
            const payloadFin = sinPalabrasParaResucitar
              ? { player, motivo: "sin_palabras" }
              : player;
            socket.emit('fin_de_player', payloadFin)
            const textoGanador = sinPalabrasParaResucitar ? TEXTO_PERDISTE_SIN_PALABRAS : undefined;
            final({ textoGanador });
          setTimeout(function () {
            texto.style.height = "";
            texto.rows = "1";
            texto.style.display = "none";
            //texto.innerText = texto_guardado;
            sendText();
            tiempo.style.color = "white";
          }, 2000);
        }
        animateCSS(".tiempo", "bounceInLeft");
        tiempo.innerHTML = "Â¡GRACIAS POR JUGAR!";
        actualizarBarraVida(tiempo, tiempo.innerHTML);
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
        ocultarUiResucitar();
                
        // LÃ³gica para finalizar el juego.
      });
      
  
      btnConfirmar.addEventListener('click', (evento) => {
        evento.stopPropagation();
        if (modo_actual === "frase final") {
          esperando_resurreccion_tiempo = false;
          btnNo.click();
          return;
        }
        if (resurreccion_confirmacion_pendiente) {
          return;
        }
        clearTimeout(timeoutID_menu);
        timeoutID_menu = null;
        esperando_resurreccion_tiempo = false;
        permitir_fin_por_decision_local = false;
        resurreccion_confirmacion_pendiente = true;
        socket.emit("resucitar", {
          player: player,
          palabras,
          secs: palabras * PALABRAS_A_SEGUNDOS
        });

        // Recortar las Ãºltimas "palabras" de "texto_guardado"
        console.log("texto_guardado", palabras);
        console.log("texto_guardado", texto_guardado);

        texto_guardado = recortarUltimasPalabras(texto_guardado, palabras);

        console.log("texto_guardado", texto_guardado);

        // Ocultar los menÃºs para que no se vean mÃ¡s
      });
  
      btnAtras.addEventListener('click', (evento) => {
        evento.stopPropagation();
        if (resurreccion_obligatoria_activa) {
          quantityMenuIndex = 0;
          actualizarSeleccionQuantityMenu();
          return;
        }
        quantityMenu.style.display = 'none';
        mainMenu.style.display = 'block';
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        if (mainTitle) {
          mainTitle.style.display = 'block';
        }
        if (buttonContainer) {
          buttonContainer.style.display = 'flex';
        }
        emitirEstadoResucitar();
      });

      btnConfirmar.addEventListener('focus', () => {
        quantityMenuIndex = 0;
        actualizarSeleccionQuantityMenu(false);
      });

      btnAtras.addEventListener('focus', () => {
        quantityMenuIndex = 1;
        actualizarSeleccionQuantityMenu(false);
      });
  
      /*************************************************************
        EVENTO DE TECLAS: FLECHAS Y ENTER
      **************************************************************/
      // Definimos la funciÃ³n manejadora de eventos de teclado.
function manejadorTeclas(evento) {
    const tecla = (evento.key === 'Enter' || evento.code === 'NumpadEnter')
      ? 'Enter'
      : evento.key;
    evento.stopPropagation();
    if (currentMenu === 'main') {
      switch (tecla) {
        case 'ArrowLeft':
          mainMenuIndex = 0;
          actualizarSeleccionMainMenu();
          break;
        case 'ArrowRight':
          mainMenuIndex = 1;
          actualizarSeleccionMainMenu();
          break;
        default:
          break;
      }
    } else if (currentMenu === 'quantity') {
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
          evento.preventDefault();
          {
            const limites = ajustarPalabrasResucitar();
            let esLimite = false;
            if (palabras < limites.max) {
              palabras++;
              actualizarTextoCantidad();
              esLimite = palabras >= limites.max;
            } else {
              esLimite = true;
            }
            activarIndicadorConversor('up', esLimite);
          }
          break;
        case 'ArrowDown':
          evento.preventDefault();
          {
            const limites = ajustarPalabrasResucitar();
            let esLimite = false;
            if (palabras > limites.min) {
              palabras--;
              actualizarTextoCantidad();
              esLimite = palabras <= limites.min;
            } else {
              esLimite = true;
            }
            activarIndicadorConversor('down', esLimite);
          }
          break;
        case 'Enter':
          evento.preventDefault();
          {
            if (resurreccion_obligatoria_activa) {
              btnConfirmar.click();
              break;
            }
            if (document.activeElement === btnAtras || quantityMenuIndex === 1) {
              btnAtras.click();
            } else if (document.activeElement === btnConfirmar || quantityMenuIndex === 0) {
              btnConfirmar.click();
            } else {
              btnConfirmar.click();
            }
          }
          break;
        default:
          break;
      }
    }
  }

// FunciÃ³n para enviar texto al otro jugador y a control
function refrescarUiIdiomaEscritora() {
    const textoGanadorPrevio = TEXTO_GANADOR_ESCRITORA;
    const textoPerdidaPrevio = TEXTO_PERDISTE_SIN_PALABRAS;
    TEXTO_GANADOR_ESCRITORA = tJuego2P("game.finished", {}, "Â¡TEXTO TERMINADO!");
    TEXTO_PERDISTE_SIN_PALABRAS = tJuego2P("game.no_words_lost", {}, "Â¡PERDISTE, NO ESCRIBISTE NADA!");

    if (metadatos && metadatos.hasAttribute("data-ganador")) {
        const textoActual = String(metadatos.getAttribute("data-ganador") || "").trim();
        const esPerdida = textoActual === textoPerdidaPrevio;
        setIndicadorGanadoraEscritora(true, esPerdida ? TEXTO_PERDISTE_SIN_PALABRAS : TEXTO_GANADOR_ESCRITORA);
    }

    if (puntos) {
        actualizarPuntosMarcador(obtenerPalabrasMarcadorEscritora(), false);
    }
    if (musas) {
        const matchMusas = String(musas.textContent || "").match(/-?\d+/);
        actualizarMusasMarcador(matchMusas ? Number(matchMusas[0]) : 0, false);
    }

    actualizarEtiquetasCursorCalentamientoEscritor();
    if (ultimo_payload_calentamiento_escritor) {
        actualizarCalentamientoEscritor(ultimo_payload_calentamiento_escritor);
    } else {
        actualizarConsignaCalentamientoEscritor(calentamiento_solicitud_escritor);
        actualizarBotonBloquearCalentamientoEscritor(
            Boolean(vista_calentamiento_escritor),
            Boolean(calentamiento_estado_equipo_escritor && calentamiento_estado_equipo_escritor.bloqueado),
            Number(calentamiento_estado_equipo_escritor && calentamiento_estado_equipo_escritor.seleccionadas)
        );
        actualizarFinalCalentamientoEscritor(calentamiento_estado_equipo_escritor && calentamiento_estado_equipo_escritor.final);
    }

    refrescarCabeceraModoActualEscritora();
    refrescarCountdownEscritora();

    if (typeof quantityMenu !== "undefined" && quantityMenu && quantityMenu.style.display !== "none") {
        actualizarTextoCantidad();
    }
    if (
        (typeof mainMenu !== "undefined" && mainMenu && mainMenu.style.display !== "none")
        || (typeof quantityMenu !== "undefined" && quantityMenu && quantityMenu.style.display !== "none")
    ) {
        emitirEstadoResucitar();
    }
}

if (window && typeof window.scribOnLanguageChange2P === "function") {
    window.scribOnLanguageChange2P(() => {
        refrescarUiIdiomaEscritora();
    });
}

refrescarUiIdiomaEscritora();

function sendText() {
    capturarTextoGuardadoDesdeEditor();
    let text = texto.innerHTML;
    let points = puntos.innerHTML;
    const caretInfo = obtenerCaretInfo(texto);
    socket.emit(texto_x, {
        text,
        points,
        caretPos: caretInfo.caretPos,
        caretLine: caretInfo.caretLine,
        caretRatio: caretInfo.caretRatio,
        caretPath: caretInfo.caretPath,
        caretOffset: caretInfo.caretOffset,
        texto_guardado
    });
}

window.sendText = sendText;

const TAGS_SALTO_LINEA = new Set(["BR", "DIV", "P", "LI"]);

function obtenerTextoPlanoConSaltos(elemento) {
    let texto = "";
    function recorrer(nodo, esRaiz) {
        if (nodo.nodeType === Node.TEXT_NODE) {
            texto += nodo.textContent;
            return;
        }
        if (nodo.nodeType !== Node.ELEMENT_NODE) return;
        const tag = nodo.tagName;
        if (tag === "BR") {
            texto += "\n";
            return;
        }
        const hijos = nodo.childNodes;
        if (!hijos || hijos.length === 0) {
            if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
                texto += "\n";
            }
            return;
        }
        for (let i = 0; i < hijos.length; i++) {
            recorrer(hijos[i], false);
        }
        if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
            if (texto.length === 0 || texto[texto.length - 1] !== "\n") {
                texto += "\n";
            }
        }
    }
    recorrer(elemento, true);
    return texto;
}

function contarCaretConSaltos(elemento, range) {
    let caretPos = 0;
    let caretLine = 0;
    let encontrado = false;

    function agregarTexto(texto) {
        caretPos += texto.length;
        caretLine += (texto.match(/\n/g) || []).length;
    }

    function agregarSalto() {
        caretPos += 1;
        caretLine += 1;
    }

    function recorrer(nodo, esRaiz) {
        if (encontrado) return;
        if (nodo === range.startContainer) {
            if (nodo.nodeType === Node.TEXT_NODE) {
                agregarTexto(nodo.textContent.slice(0, range.startOffset));
                encontrado = true;
                return;
            }
            if (nodo.nodeType === Node.ELEMENT_NODE) {
                const hijos = nodo.childNodes || [];
                const limite = Math.min(range.startOffset, hijos.length);
                for (let i = 0; i < limite; i++) {
                    recorrer(hijos[i], false);
                    if (encontrado) return;
                }
                encontrado = true;
                return;
            }
        }
        if (nodo.nodeType === Node.TEXT_NODE) {
            agregarTexto(nodo.textContent);
            return;
        }
        if (nodo.nodeType !== Node.ELEMENT_NODE) return;
        const tag = nodo.tagName;
        if (tag === "BR") {
            agregarSalto();
            return;
        }
        const hijos = nodo.childNodes;
        if (!hijos || hijos.length === 0) {
            if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
                agregarSalto();
            }
            return;
        }
        for (let i = 0; i < hijos.length; i++) {
            recorrer(hijos[i], false);
            if (encontrado) return;
        }
        if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
            agregarSalto();
        }
    }

    recorrer(elemento, true);
    return { caretPos, caretLine };
}

function obtenerIndiceCaretEnTexto(elemento) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
        return obtenerTextoPlanoConSaltos(elemento).length;
    }
    const range = sel.getRangeAt(0);
    if (!elemento.contains(range.startContainer)) {
        return obtenerTextoPlanoConSaltos(elemento).length;
    }
    return contarCaretConSaltos(elemento, range).caretPos;
}

function obtenerCaretInfo(elemento) {
    const textoPlano = obtenerTextoPlanoConSaltos(elemento);
    const totalChars = textoPlano.length;
    let caretPos = totalChars;
    let caretLine = (textoPlano.match(/\n/g) || []).length;
    let caretPath = null;
    let caretOffset = 0;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (elemento.contains(range.startContainer)) {
            const conteo = contarCaretConSaltos(elemento, range);
            caretPos = conteo.caretPos;
            caretLine = conteo.caretLine;
            caretPath = obtenerRutaNodo(elemento, range.startContainer);
            caretOffset = range.startOffset;
        }
    }
    ultimoCaretRatio = totalChars > 0
        ? Math.max(0, Math.min(caretPos / totalChars, 1))
        : ultimoCaretRatio;
    return {
        caretPos,
        caretLine,
        caretRatio: ultimoCaretRatio,
        caretPath,
        caretOffset
    };
}

let rafEnvioCaret = null;
let ultimoCaretRatio = 0;

function obtenerRutaNodo(raiz, nodo) {
    const ruta = [];
    let actual = nodo;
    while (actual && actual !== raiz) {
        const padre = actual.parentNode;
        if (!padre) break;
        const indice = Array.prototype.indexOf.call(padre.childNodes, actual);
        ruta.unshift(indice);
        actual = padre;
    }
    return actual === raiz ? ruta : null;
}

function solicitarEnvioCaret() {
    if (rafEnvioCaret) return;
    rafEnvioCaret = requestAnimationFrame(() => {
        rafEnvioCaret = null;
        const caretInfo = obtenerCaretInfo(texto);
        socket.emit(texto_x, {
            text: texto.innerHTML,
            points: puntos.innerHTML,
            caretPos: caretInfo.caretPos,
            caretLine: caretInfo.caretLine,
            caretRatio: caretInfo.caretRatio,
            caretPath: caretInfo.caretPath,
            caretOffset: caretInfo.caretOffset,
            texto_guardado
        });
    });
}

document.addEventListener("selectionchange", () => {
    if (!texto || document.activeElement !== texto || !texto.isContentEditable) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!texto.contains(sel.anchorNode)) return;
    solicitarEnvioCaret();
});

function manejarRecibeTemasEscritora(data) {
    temas.innerHTML = data;
}

function manejarRecibirComentarioEscritora(data) {
    console.log(data);
    temas.innerHTML = data;
}

function registrarSocketExtratextualEscritora(evento, handler) {
    window.ScribRuntime.onSocket(socket, evento, handler);
}

function activar_sockets_extratextuales() {
    // Recibe los temas (que elige Espectador) y los coloca en su sitio.
    registrarSocketExtratextualEscritora("recibe_temas", manejarRecibeTemasEscritora);
    registrarSocketExtratextualEscritora("recibir_comentario", manejarRecibirComentarioEscritora);
}


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
    var fontFamilies = [
        "Impact",
        "Georgia",
        "Tahoma",
        "Verdana",
        "Impact",
        "Marlet",
    ]; // Add more
    return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
}

function getTextAlign() {
    var aligns = ["center", "left", "right", "justify"]; // Add more
    return aligns[Math.floor(Math.random() * aligns.length)];
}

function stylize() {
    texto.style.color = getRandColor();
    document.body.style.backgroundColor = getRandColor();
    document.body.style.backgroundColor = getRandColor();
}

function animacion_modo() {
    const animateCSS = (element, animation, prefix = "animate__") =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);
            if (!node) {
                resolve("Element not found");
                return;
            }

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    animateCSS(".explicaciÃ³n", "bounceInLeft");
    animateCSS("#palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

function animacion_palabra() {
    const animateCSS = (element, animation, prefix = "animate__") =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);
            if (!node) {
                resolve("Element not found");
                return;
            }

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    animateCSS("#palabra", "bounceInLeft");
}

// FunciÃ³n auxiliar que reestablece el estilo inicial de la pÃ¡gina modificado por el modo psicodÃ©lico.
function restablecer_estilo() {
    texto.style.color = "white";
    document.body.style.backgroundColor = "black";
}

//FunciÃ³n auxiliar que comprueba que se inserta la palabra bonus.
function modo_palabras_bonus(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
        if (!selection || !selection.rangeCount) return;
        let range = selection.getRangeAt(0);
        let preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        let endingIndex = preCaretRange.toString().length;
        let startingIndex = 0; // Inicializacion
        const textContent = e.target.textContent || "";
        const objetivos = obtenerObjetivosPalabraActual();
        const esCaracterPalabra = (ch) => /[A-Za-z0-9ÃÃ‰ÃÃ“ÃšÃœÃ‘Ã¡Ã©Ã­Ã³ÃºÃ¼Ã±]/.test(ch || "");
        const esSeparador = (ch) => !esCaracterPalabra(ch);

        while (endingIndex > 0 && esSeparador(textContent[endingIndex - 1])) {
            endingIndex -= 1;
        }

        // Calcula startingIndex: Retrocede hasta encontrar un delimitador o el inicio del texto
        for (let i = endingIndex - 1; i >= 0; i--) {
            if (esSeparador(textContent[i]) || i === 0) {
                startingIndex = (i === 0 && !esSeparador(textContent[i])) ? i : i + 1;
                break;
            }
        }

        // Ajusta endingIndex: Avanza hasta encontrar un delimitador o el final del texto
        for (let i = endingIndex; i <= textContent.length; i++) {
            if (i === textContent.length || esSeparador(textContent[i])) {
                endingIndex = i;
                break;
            }
        }

        const tokenActual = textContent.substring(startingIndex, endingIndex);
        const tokenLower = tokenActual.toLowerCase();
        const coincidenciaMultipalabra = detectarInsercionMultipalabra(textContent);
        const palabraDetectadaToken = objetivos.find((objetivo) =>
            tokenLower.includes((objetivo || "").toLowerCase())
        );

        console.log("Texto seleccionado:", tokenActual); // Debugging
        console.log("palabra_actual:", palabra_actual); // Debugging
        console.log("Indices:", startingIndex, endingIndex); // Debugging

        if (coincidenciaMultipalabra || palabraDetectadaToken) {
            texto.focus();
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            socket.emit("nueva_palabra", player);
            emitirCambioTiempoEscritora(tiempo_palabras_bonus);
            const color = color_positivo;
            const tiempo_feed = "+" + tiempo_palabras_bonus + " segs.";
            const tipo = (definicion.dataset.origenMusa === "musa") ? "inspiracion" : "rae";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo });
            const payloadFeedback = (tipo === "inspiracion")
                ? construirPayloadFeedbackInspiracion({ color, tiempo_feed, tipo })
                : { color, tiempo_feed, tipo };
            socket.emit(feedback_de_j_x, payloadFeedback);
            if (tipo === "inspiracion") {
                activarFulgorInspiracionEscritora();
                socket.emit("feedback_musa_inspiracion", { ...payloadFeedback, player });
            }

            let inicioMarca = startingIndex;
            let finMarca = endingIndex;
            if (coincidenciaMultipalabra) {
                inicioMarca = coincidenciaMultipalabra.inicio;
                finMarca = coincidenciaMultipalabra.fin;
            } else {
                const palabraLower = (palabraDetectadaToken || "").toLowerCase();
                let indiceMatch = -1;
                if (palabraLower) {
                    indiceMatch = tokenLower.lastIndexOf(palabraLower);
                }
                inicioMarca = indiceMatch >= 0
                    ? startingIndex + indiceMatch
                    : startingIndex;
                finMarca = indiceMatch >= 0
                    ? inicioMarca + palabraLower.length
                    : endingIndex;
            }

            const esMusa = definicion?.dataset?.origenMusa === "musa";
            marcarPalabraBenditaActual(inicioMarca, finMarca, esMusa);
            countChars(texto);
            sendText();
        }
    }
}

function modo_palabras_prohibidas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(e.target);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            let endingIndex = preCaretRange.toString().length;
            let startingIndex = 0; // InicializaciÃ³n
            let textContent = e.target.innerText;

            // Calcula startingIndex: Retrocede hasta encontrar un delimitador o el inicio del texto
            for (let i = endingIndex - 1; i >= 0; i--) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === 0) {
                    startingIndex = (i === 0 && (textContent[i] !== ' ' && textContent[i] !== '\n')) ? i : i + 1;
                    break;
                }
            }

            // Ajusta endingIndex: Avanza hasta encontrar un delimitador o el final del texto
            for (let i = endingIndex; i <= textContent.length; i++) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === textContent.length) {
                    endingIndex = i;
                    break;
                }
            }

            console.log("Texto seleccionado:", textContent.substring(startingIndex, endingIndex)); // Debugging
            console.log("palabra_actual:", palabra_actual); // Debugging
            console.log("Ãndices:", startingIndex, endingIndex); // Debugging

        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            const palabraEncontrada = Array.isArray(palabra_actual)
                ? palabra_actual.find(palabra => textContent
                    .substring(startingIndex, endingIndex)
                    .toLowerCase()
                    .includes((palabra || "").toLowerCase()))
                : palabra_actual;
            const palabraReportada = palabraEncontrada || textContent.substring(startingIndex, endingIndex);
            socket.emit("intento_prohibido", { player, tipo: "palabra", valor: palabraReportada });
            texto.focus();
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            socket.emit("nueva_palabra_prohibida", player);
            tiempo_palabras_bonus = -tiempo_palabras_bonus;
            emitirCambioTiempoEscritora(tiempo_palabras_bonus);
            const color = color_negativo;
            const tiempo_feed = String(tiempo_palabras_bonus) + " segs.";
            const tipo = (definicion.dataset.origenMusa === "musa_enemiga") ? "inspiracion" : "lista_prohibidas";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo });
            const payloadFeedback = (tipo === "inspiracion")
                ? construirPayloadFeedbackInspiracion({ color, tiempo_feed, tipo })
                : { color, tiempo_feed, tipo };
            socket.emit(feedback_de_j_x, payloadFeedback);
            if (tipo === "inspiracion") {
                activarFulgorInspiracionEscritora();
                socket.emit("feedback_musa_inspiracion", { ...payloadFeedback, player });
            }
        }
    }
}

function palabras_musas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
        if (!selection || !selection.rangeCount) return;
        let range = selection.getRangeAt(0);
        let preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        let endingIndex = preCaretRange.toString().length;
        let startingIndex = 0; // Inicializacion
        const textContent = e.target.textContent || "";
        const objetivos = obtenerObjetivosPalabraActual();

        // Calcula startingIndex: Retrocede hasta encontrar un delimitador o el inicio del texto
        for (let i = endingIndex - 1; i >= 0; i--) {
            if (textContent[i] === ' ' || textContent[i] === '\n' || i === 0) {
                startingIndex = (i === 0 && (textContent[i] !== ' ' && textContent[i] !== '\n')) ? i : i + 1;
                break;
            }
        }

        // Ajusta endingIndex: Avanza hasta encontrar un delimitador o el final del texto
        for (let i = endingIndex; i <= textContent.length; i++) {
            if (textContent[i] === ' ' || textContent[i] === '\n' || i === textContent.length) {
                endingIndex = i;
                break;
            }
        }

        const tokenActual = textContent.substring(startingIndex, endingIndex);
        const tokenLower = tokenActual.toLowerCase();
        const coincidenciaMultipalabra = detectarInsercionMultipalabra(textContent);
        const palabraEncontrada = coincidenciaMultipalabra
            ? coincidenciaMultipalabra.objetivo
            : objetivos.find((objetivo) => tokenLower.includes((objetivo || "").toLowerCase()));

        console.log("Texto seleccionado:", tokenActual); // Debugging
        console.log("palabra_actual:", palabra_actual); // Debugging
        console.log("Indices:", startingIndex, endingIndex); // Debugging

        if (coincidenciaMultipalabra || palabraEncontrada) {

            definicion.innerHTML = "";
            texto.focus();
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            const tiempo_feed = "+insp.";
            const color = "white";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo: "inspiracion" });
            socket.emit("nueva_palabra_musa", player);
            socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "inspiracion" });
            activarFulgorInspiracionEscritora();

            let inicioMarca = startingIndex;
            let finMarca = endingIndex;
            if (coincidenciaMultipalabra) {
                inicioMarca = coincidenciaMultipalabra.inicio;
                finMarca = coincidenciaMultipalabra.fin;
            } else {
                const palabraLower = (palabraEncontrada || "").toLowerCase();
                let indiceMatch = -1;
                if (palabraLower) {
                    indiceMatch = tokenLower.lastIndexOf(palabraLower);
                }
                inicioMarca = indiceMatch >= 0
                    ? startingIndex + indiceMatch
                    : startingIndex;
                finMarca = indiceMatch >= 0
                    ? inicioMarca + palabraLower.length
                    : endingIndex;
            }

            if (marcarPalabraMusaActual(inicioMarca, finMarca)) {
                countChars(texto);
                sendText();
            }
        }
    }
}

function modo_letra_prohibida(e) {
    if (e.defaultPrevented || e.inputType !== "insertText") return;
    const letra = obtenerCaracterEntradaEvento(e);
    if (!letra || letra.length !== 1) return;

    if (
      toNormalForm(letra) === letra_prohibida ||
      toNormalForm(letra) === letra_prohibida.toUpperCase()
    ) {
      e.preventDefault();
      const letraReportada = letra_prohibida || letra;
      socket.emit("intento_prohibido", { player, tipo: "letra", valor: letraReportada });
    /*
      let sel = window.getSelection();
      let range = sel.getRangeAt(0);
  
      // Crea un nodo de texto para la letra
      let textNode = document.createTextNode(letra);
  
      // Crea un span con la clase para el color y coloca el nodo de texto dentro
      let span = document.createElement("span");
      span.className = "letra-roja";
      span.appendChild(textNode);
  
      // Crea nodos de texto vacÃ­os para actuar como delimitadores
      let emptyTextNodeBefore = document.createTextNode("");
      let emptyTextNodeAfter = document.createTextNode("");
  
      // Inserta los nodos en el DOM
      range.insertNode(emptyTextNodeBefore);
      range.insertNode(span);
      range.insertNode(emptyTextNodeAfter);
  
      // Mueve el cursor a la derecha del nodo span
      range.setStartAfter(span);
      range.setEndAfter(span);
      sel.removeAllRanges();
      sel.addRange(range);
  
      // Borra el span despuÃ©s de medio segundo
      setTimeout(() => {
        span.parentNode.removeChild(span);
      }, 100);
      */

      // Actualiza otros aspectos de la UI y envÃ­a eventos a travÃ©s de Socket.io
      // AquÃ­ irÃ­a la lÃ³gica para manejar la UI y eventos de Socket.io (la he mantenido igual)
      secs = -2;
      console.log(secs);
      emitirCambioTiempoEscritora(secs);
      actualizarPuntosMarcador(puntos_ + " palabras");
      sendText();
      const tiempo_feed = "-2 segs.";
      const color = color_negativo;
      mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo: "letra_prohibida" });
      socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "letra_prohibida" });
    }
  }
  
  // Esta funciÃ³n se llama cuando se presiona una tecla
function modo_letra_bendita(e) {
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }

    if (bloquear_borrado_putada && e.key === 'Backspace') {
        e.preventDefault();
        return;
    }

    let letra = e.key; // Captura la letra tecleada
    let sel = window.getSelection();
    let range = sel.getRangeAt(0);
    let node = sel.anchorNode;

    // AÃ±adido: Procesar tecla Backspace
    if (e.key === 'Backspace') {
        console.log('Node:', node);
        console.log('Parent Node:', node.parentNode);
        console.log('Parent Node class:', node.parentNode ? node.parentNode.className : 'No parent node');
        console.log('Focus Offset:', sel.focusOffset);

        if (node && node.parentNode.className === 'letra-verde' && sel.focusOffset === 0) {
            e.preventDefault(); // Prevenir el comportamiento por defecto de la tecla Backspace
            secs = -2
            emitirCambioTiempoEscritora(secs); // Emitir el evento de socket
            // Feedback visual
            const tiempo_feed = "-1 segs.";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color: color_negativo, tipo: "letra_bendita" });
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed, tipo: "letra_bendita" });
        }
        return; // Salir de la funciÃ³n si la tecla es Backspace
    }

    if (letra.length === 1) {
        if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
            (letra_bendita === "Ã±" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
            e.preventDefault();
            console.log('Se procesa letra bendita');

            let textNode = document.createTextNode(letra);
            let span = document.createElement("span");
            span.className = "letra-verde";
            span.setAttribute("contenteditable", "false");
            span.appendChild(textNode);

            let emptyTextNodeBefore = document.createTextNode("");
            let emptyTextNodeAfter = document.createTextNode("");

            range.insertNode(emptyTextNodeBefore);
            range.insertNode(span);
            range.insertNode(emptyTextNodeAfter);

            range.setStartBefore(emptyTextNodeBefore);
            range.setEndBefore(emptyTextNodeBefore);
            sel.removeAllRanges();
            sel.addRange(range);
            secs = 2;
            emitirCambioTiempoEscritora(secs);
            actualizarPuntosMarcador(puntos_ + " palabras");
            console.log(puntos);
            sendText();

            // Feedback visual
            const tiempo_feed = "+2 segs.";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color: color_positivo, tipo: "letra_bendita" });
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed, tipo: "letra_bendita" });
        } else {
            if (node && node.parentNode.className === 'letra-verde') {
                e.preventDefault();

                let newTextNode = document.createTextNode(letra);
                if (sel.focusOffset === 0) {
                    node.parentNode.parentNode.insertBefore(newTextNode, node.parentNode);
                } else {
                    if (node.parentNode.nextSibling) {
                        node.parentNode.parentNode.insertBefore(newTextNode, node.parentNode.nextSibling);
                    } else {
                        node.parentNode.parentNode.appendChild(newTextNode);
                    }
                }
                range.setStartAfter(newTextNode);
                range.setEndAfter(newTextNode);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
    // AquÃ­ podrÃ­as aÃ±adir mÃ¡s comportamientos para otras teclas no imprimibles si lo consideras necesario
}


  

function modo_psicodelico() {
    stylize();
}

function modo_letra_prohibida(e) {
    if (e.defaultPrevented || e.inputType !== "insertText") return;
    const letra = obtenerCaracterEntradaEvento(e);
    if (!letra || letra.length !== 1) return;

    if (
        toNormalForm(letra) === letra_prohibida ||
        toNormalForm(letra) === letra_prohibida.toUpperCase()
    ) {
        e.preventDefault();
        const letraReportada = letra_prohibida || letra;
        socket.emit("intento_prohibido", { player, tipo: "letra", valor: letraReportada });
        secs = -2;
        console.log(secs);
        emitirCambioTiempoEscritora(secs);
        actualizarPuntosMarcador(puntos_ + " palabras");
        const tiempo_feed = "-2 segs.";
        const color = color_negativo;
        mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo: "letra_prohibida" });
        socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "letra_prohibida" });
    }
}

function modo_letra_bendita(e) {
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }

    if (bloquear_borrado_putada && e.inputType === 'deleteContentBackward') {
        e.preventDefault();
        return;
    }

    let sel = window.getSelection();
    if (!sel.rangeCount) return;
    let node = sel.anchorNode;

    if (e.inputType === 'deleteContentBackward') {
        console.log('Node:', node);
        console.log('Parent Node:', node ? node.parentNode : null);
        console.log('Parent Node class:', node && node.parentNode ? node.parentNode.className : 'No parent node');
        console.log('Focus Offset:', sel.focusOffset);

        if (node && node.parentNode && node.parentNode.className === 'letra-verde' && sel.focusOffset === 0) {
            e.preventDefault();
            secs = -2;
            emitirCambioTiempoEscritora(secs);
            const tiempo_feed = "-1 segs.";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color: color_negativo, tipo: "letra_bendita" });
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed, tipo: "letra_bendita" });
        }
        return;
    }

    if (e.inputType !== "insertText") return;
    let letra = obtenerCaracterEntradaEvento(e);
    if (!letra || letra.length !== 1) return;

    if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
        (letra_bendita === "\u00f1" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
        e.preventDefault();
        console.log('Se procesa letra bendita');

        insertarSpanProtegidoEnCaret(letra, CLASE_LETRA_BENDITA_LOCAL);
        texto.dispatchEvent(new Event("input", { bubbles: true }));
        secs = 2;
        emitirCambioTiempoEscritora(secs);
        actualizarPuntosMarcador(puntos_ + " palabras");
        console.log(puntos);

        const tiempo_feed = "+2 segs.";
        mostrarFeedbackFlotanteEscritora(tiempo_feed, { color: color_positivo, tipo: "letra_bendita" });
        socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed, tipo: "letra_bendita" });
    } else {
        const nodoProtegido = nodoEnPalabraBendita(node);
        if (nodoProtegido && nodoProtegido.classList.contains(CLASE_LETRA_BENDITA_LOCAL)) {
            e.preventDefault();
            insertarTextoJuntoANodoProtegido(
                nodoProtegido,
                letra,
                sel.focusOffset === 0 ? "before" : "after"
            );
            texto.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }
}

function limpieza(){
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    setInterfazInversaGlobal(false);
    pararEscritura = true;
    permitir_fin_por_decision_local = false;
    esperando_resurreccion_tiempo = false;
    resurreccion_confirmacion_pendiente = false;
    ocultarUiResucitar({ emitirEstado: false });
    stopConfetti();
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    secuencia_inicio_escritora_activa = false;
    post_inicio_pendiente_escritora = null;
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    document.body.classList.remove("fin-escritora-anim");
    lightning.classList.remove("lightning");
    console.log(texto.innerHTML)
    if(temp_text_inverso_activado == true){
        temp_text_inverso_activado = false;
        setInterfazInversaGlobal(false);
        clearTimeout(tempo_text_inverso);
        procesarTexto();
    }

    texto.innerText = "";
    texto.style.display = "";
    texto.style.height = "";
    feedback_tiempo.style.color = color_positivo;
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    texto.contentEditable= "false";
    actualizarPuntosMarcador(0, false);
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicacion.innerHTML = "";
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    texto.focus();

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");
    setIndicadorGanadoraEscritora(false);

    puntos_palabra = 0;
    puntos_ = 0;
    puntos_letra_prohibida = 0;
    puntos_letra_bendita = 0;

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    limpiarDeteccionMultipalabraAsignada();
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    console.log(puntos)
    
    limpiarFeedbackFlotanteEscritora();
    
    definicion.innerHTML = "";
    explicacion.innerHTML = "";
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");

    // Restablece la rÃ¡pidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    caracteres_seguidos = 0;
    
    for (let key in LIMPIEZAS) { 
        console.log(key)
        LIMPIEZAS[key]();
    }

            limpiarAsincroniaVisualEscritora();
            invalidarEstadoAsincronoEscritora();
            clearTimeout(cambio_palabra);
            clearTimeout(tempo_text_borroso);
}

function limpieza_final(){
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    setInterfazInversaGlobal(false);
    permitir_fin_por_decision_local = false;
    esperando_resurreccion_tiempo = false;
    resurreccion_confirmacion_pendiente = false;
    ocultarUiResucitar({ emitirEstado: false });
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    document.body.classList.remove("fin-escritora-anim");
    secuencia_inicio_escritora_activa = false;
    post_inicio_pendiente_escritora = null;
    confetti_aux();
    texto.contentEditable= "false";
    texto.style.display = "none";
    temas.display = "none";
    temas.innerHTML = "";
    limpiarFeedbackFlotanteEscritora();
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicacion.innerHTML = "";
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");

    definicion.style.fontSize = "1.5vw";

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    limpiarDeteccionMultipalabraAsignada();
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.

    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;

    tiempo.style.color = "white";

    // Restablece la rÃ¡pidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    LIMPIEZAS["psicodÃ©lico"]("");

    limpiarAsincroniaVisualEscritora();
    invalidarEstadoAsincronoEscritora();
    clearTimeout(cambio_palabra);
    //clearTimeout(tempo_text_borroso);
}

function pausa(){

    menu_modificador = false;
    texto.contentEditable= "false";

    invalidarEstadoAsincronoEscritora();
    desactivar_borrar = true;
}

function reanudar(){

    menu_modificador = true;
    texto.contentEditable = "true";

    invalidarEstadoAsincronoEscritora();
    desactivar_borrar = false;
    
    texto.focus();
}

function modo_borroso_pausa(data){
    console.log(tiempo_restante)
    if(tiempo_restante > 0){
        modo_borroso(data);
    }
}

function modo_inverso_pausa(){
    if(tiempo_restante > 0){
        desactivar_borrar = true;
        caretNode, caretPos = guardarPosicionCaret();
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // AÃ±ade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            // Obtener el Ãºltimo nodo de texto en text
            lastLine = texto.lastChild;
            lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el Ãºltimo nodo de texto, colocamos el cursor allÃ­
            if (lastTextNode) {
                caretNode = lastTextNode;
                caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            texto.removeEventListener('animationend', arguments.callee);
        });
        
        procesarTexto();
        
        sendText();
        const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
        temp_text_inverso_activado = true;
        setInterfazInversaGlobal(true);
        tempo_text_inverso = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            temp_text_inverso_activado = false;
            setInterfazInversaGlobal(false);
            desactivar_borrar = false;
            texto.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.contentEditable= "true";
                texto.focus()
                // Obtener el Ãºltimo nodo de texto en text
                lastLine = texto.lastChild;
                lastTextNode = lastLine;
                while (lastTextNode && lastTextNode.nodeType !== 3) {
                    lastTextNode = lastTextNode.lastChild;
                }
                
                // Si encontramos el Ãºltimo nodo de texto, colocamos el cursor allÃ­
                if (lastTextNode) {
                    caretNode = lastTextNode;
                    caretPos = lastTextNode.length;
                    restaurarPosicionCaret(caretNode, caretPos);
                }
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            putada_actual = "";
        sendText()  
        }, TIEMPO_MODIFICADOR);
    }
}

function tiempo_borrado_menos(){
    const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
    borrado_cambiado = true;
    antiguo_rapidez_borrado = rapidez_borrado;
    antiguo_inicio_borrado = rapidez_inicio_borrado;
    rapidez_borrado = 7000;
    rapidez_inicio_borrado = 7000;
    setTimeout(function () {
        if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
            return;
        }
        borrado_cambiado = false;
        rapidez_borrado = antiguo_rapidez_borrado;
        rapidez_inicio_borrado = antiguo_inicio_borrado;
    }, TIEMPO_MODIFICADOR);
}

function enviar_putada(putada){

    socket.emit("enviar_putada_a_jx", {player, putada});
}

function tiempo_muerto(){
    socket.emit("tiempo_muerto_a_control", '');
}

function borroso(){
    putada = "borroso";
    socket.emit("enviar_putada_a_jx", player, putada);
}

function inverso(){
    putada = "inverso";
    socket.emit("enviar_putada_a_jx", player, putada);
}

function modo_borroso(data){
    if (modo_texto_borroso == 1) {
        const revisionContexto = obtenerRevisionContextoTransitorioEscritora();
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            modo_texto_borroso = 0
            putada_actual = ""
        }, data);   
    }
}

var CONFETTI_TOP_Z_INDEX = 2147483647;
var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: CONFETTI_TOP_Z_INDEX };
var isConfettiRunning = true; // Indicador para controlar la ejecuciÃ³n
let confettiIntervalEscritora = null;
let confettiFrameEscritora = null;

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function confetti_aux() {
  stopConfetti();
  var animationEnd = Date.now() + duration; // Actualiza aquÃ­ dentro de la funciÃ³n
  isConfettiRunning = true; // Habilita la ejecuciÃ³n de confetti
  console.log(isConfettiRunning);
  
  confettiIntervalEscritora = setInterval(function() {
    if (!isConfettiRunning) {
      clearInterval(confettiIntervalEscritora);
      confettiIntervalEscritora = null;
      return;
    }

    var timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(confettiIntervalEscritora);
      confettiIntervalEscritora = null;
      return;
    }

    var particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function stopConfetti() {
  isConfettiRunning = false; // Deshabilita la ejecuciÃ³n de confetti
  if (confettiIntervalEscritora) {
    clearInterval(confettiIntervalEscritora);
    confettiIntervalEscritora = null;
  }
  if (confettiFrameEscritora) {
    cancelAnimationFrame(confettiFrameEscritora);
    confettiFrameEscritora = null;
  }
  confetti.reset(); // Detiene la animaciÃ³n de confetti
}

function final(opciones = {}){
    capturarTextoGuardadoSinPerderPrevio();
    const textoGanador = (opciones && typeof opciones.textoGanador === "string" && opciones.textoGanador.trim())
      ? opciones.textoGanador
      : TEXTO_GANADOR_ESCRITORA;
    animarFinEscritora(textoGanador);
    setInterfazInversaGlobal(false);
    permitir_fin_por_decision_local = false;
    esperando_resurreccion_tiempo = false;
    resurreccion_confirmacion_pendiente = false;
    ocultarUiResucitar();
    //sendText();
    menu_modificador = false;
    limpieza_final();
    
    modo_actual = "";
    putada_actual = "";
    activar_sockets_extratextuales();

    // Impide que se pueda escribir en los dos textos.
    texto.contentEditable= "false";

    // Variable booleana que dice si la ronda ha terminado o no.
    terminado = true;

    texto.style.height = "auto";
    texto.style.height = texto.scrollHeight + "px"; //Reajustamos el tamaÃ±o del Ã¡rea de texto del j1.
    texto.style.display = "none";
    
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    });
    logo.style.display = "";
    neon.style.display = "";
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    LIMPIEZAS["psicodÃ©lico"]("");/* TODO: VER POR QUÃ‰ NO FUNCIONA ESTO  */
    texto.removeEventListener("keyup", listener_modo_psico);
    restablecer_estilo();
    tiempo.style.color = "white";
}

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un nÃºmero entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un nÃºmero entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }
  
function invertirPalabras(texto) {
    return texto
      .split(' ')                         // Separa por espacios
      .map(palabra => palabra.split('').reverse().join('')) 
      .join(' ');
  }

  /**
   * FunciÃ³n recursiva que:
   * - Invierne el contenido de los nodos de texto
   * - Clona y procesa los nodos de tipo elemento para preservar estructura e hijos
   */
  function procesarNodo(nodo) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      // Si es un nodo de texto, lo invertimos
      const textoInvertido = invertirPalabras(nodo.textContent);
      return document.createTextNode(textoInvertido);

    } else if (nodo.nodeType === Node.ELEMENT_NODE) {
      // Clonamos el nodo (pero sin hijos) para preservar etiquetas y atributos (estilos, clases, etc.)
      const nuevoNodo = nodo.cloneNode(false);

      // Recorremos los hijos originales y los procesamos recursivamente
      nodo.childNodes.forEach(child => {
        // Insertamos en el clon el resultado de procesar cada hijo
        nuevoNodo.appendChild(procesarNodo(child));
      });

      return nuevoNodo;
    }

    // Si quisieras manejar comentarios u otro tipo de nodos,
    // podrÃ­as aÃ±adir mÃ¡s condiciones. Si no, simplemente retorna el nodo tal cual.
    return nodo.cloneNode(true);
  }

  function procesarTexto() {
    console.log("ESTO NO PARAAAAAAAAAAA")
    // El contenedor original
    // Creamos un fragmento para ir colocando los nodos procesados
    const fragmento = document.createDocumentFragment();

    // Recorremos los childNodes del div con id="texto"
    texto.childNodes.forEach(nodo => {
      // Procesamos cada nodo (ya sea texto o elemento) y lo aÃ±adimos al fragmento
      fragmento.appendChild(procesarNodo(nodo));
    });

    // Limpiamos el contenido original y lo reemplazamos con el fragmento procesado
    texto.innerHTML = "";
    texto.appendChild(fragmento);
  }

function efectoMaquinaDeEscribir(elemento, textoHtml, velocidad = 50) {
  // Reiniciar la bandera al inicio para permitir nuevas ejecuciones
  pararEscritura = false;

  // Asegurar salto de lÃ­nea inicial si el contenido actual no termina con <br>
  let contenidoInicial = elemento.innerHTML.trim(); // Limpiamos espacios innecesarios
  if (!contenidoInicial.endsWith("<br>")) {
    contenidoInicial += "<br>"; // AÃ±adimos un salto de lÃ­nea si no estÃ¡ presente
  }

  let contenidoEscrito = contenidoInicial; // Inicializamos con el contenido previo
  let cursor = 0;                          // Ãndice para recorrer el texto

  // AÃ±adir los saltos de lÃ­nea adicionales al texto
  textoHtml = "<br>" + textoHtml + "<br><br>";

  // Desactiva la ediciÃ³n temporal
  elemento.contentEditable = "false";

  // ---- FunciÃ³n para colocar el cursor justo al final ----
  function colocarCursorAlFinal(elem) {
    const range = document.createRange();
    const sel = window.getSelection();

    let ultimoNodo = elem.lastChild;
    while (ultimoNodo && ultimoNodo.nodeType !== 3 && ultimoNodo.lastChild) {
      ultimoNodo = ultimoNodo.lastChild;
    }

    if (ultimoNodo && ultimoNodo.nodeType === 3) {
      range.setStart(ultimoNodo, ultimoNodo.textContent.length);
      range.setEnd(ultimoNodo, ultimoNodo.textContent.length);
    } else if (elem.lastChild) {
      range.setStartAfter(elem.lastChild);
      range.setEndAfter(elem.lastChild);
    } else {
      range.setStart(elem, 0);
      range.setEnd(elem, 0);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ---- FunciÃ³n recursiva para escribir el texto ----
  function escribir() {
    // Verificar si se ha solicitado detener la escritura
    if (pararEscritura) {
      return; // Salimos de la funciÃ³n para detener la recursiÃ³n
    }

    if (cursor < textoHtml.length) {
      // Detectamos etiquetas HTML para escribirlas completas de golpe
      if (textoHtml.substring(cursor).startsWith("<")) {
        const finEtiqueta = textoHtml.indexOf(">", cursor) + 1;
        contenidoEscrito += textoHtml.substring(cursor, finEtiqueta);
        cursor = finEtiqueta;
      } else {
        // Caso normal: aÃ±adimos un carÃ¡cter
        contenidoEscrito += textoHtml.charAt(cursor);
        cursor++;
      }

      // Actualizamos el contenido en el elemento
      elemento.innerHTML = contenidoEscrito;
      elemento.scrollTop = elemento.scrollHeight;  // Scroll al final

      // Continuamos con un pequeÃ±o retraso
      setTimeout(escribir, velocidad);
    } else {
      // Cuando terminamos
      elemento.contentEditable = "true";          // Reactivamos ediciÃ³n
      colocarCursorAlFinal(elemento);            // Cursor al final
      elemento.focus();                          // Enfocamos el elemento
    }
    sendText();
  }

  // Inicia el proceso de escritura
  escribir();
}

// FunciÃ³n para detener el efecto de la mÃ¡quina de escribir
function detenerEfectoMaquina() {
  pararEscritura = true;
}


function confetti_musas(){
var scalar = 2;
var starShape = confetti.shapeFromText({
  text: "â­",
  scalar,
  color: "#ffd43b",
  fontFamily: "\"Apple Color Emoji\", \"Segoe UI Emoji\", \"Noto Color Emoji\", sans-serif"
});
isConfettiRunning = true;

var end = Date.now() + (2 * 1000);

// go Buckeyes!
    (function frame() {
      confetti({
    startVelocity: 12,
    particleCount: 2,
    angle: 270,
    spread: 1000,
    origin: { x: randomInRange(0.12, 0.88), y: 0 },
    shapes: [starShape],
    scalar: 3,
    colors: ["#fff6ad", "#ffe066", "#ffd43b", "#ffffff"],
    zIndex: CONFETTI_TOP_Z_INDEX
  });

      if ((Date.now() < end) && isConfettiRunning) {
        confettiFrameEscritora = requestAnimationFrame(frame);
        return;
      }
      confettiFrameEscritora = null;
    }());
    }

const textarea = texto;
const CLASES_FADE_TEXTAREA_ESCRITOR = [
    "textarea-fade-none",
    "textarea-fade-top",
    "textarea-fade-bottom",
    "textarea-fade-both"
];
function actualizarDegradadoDinamicoTextoEscritor() {
    if (!textarea || !textarea.classList) return;
    const gradientTop = document.getElementById("gradientTop");
    const gradientBottom = document.getElementById("gradientBottom");
    const clientHeight = textarea.clientHeight || 0;
    const scrollHeight = textarea.scrollHeight || 0;

    if (clientHeight <= 0 || textarea.style.display === "none") {
        CLASES_FADE_TEXTAREA_ESCRITOR.forEach((clase) => textarea.classList.remove(clase));
        textarea.classList.add("textarea-fade-none");
        if (gradientTop) gradientTop.style.opacity = "0";
        if (gradientBottom) gradientBottom.style.opacity = "0";
        return;
    }

    const margen = 2;
    const tieneOverflow = (scrollHeight - clientHeight) > margen;
    const scrollTop = Math.max(0, textarea.scrollTop || 0);
    const ocultoArriba = tieneOverflow && (scrollTop > margen);
    const ocultoAbajo = tieneOverflow && ((scrollTop + clientHeight) < (scrollHeight - margen));

    CLASES_FADE_TEXTAREA_ESCRITOR.forEach((clase) => textarea.classList.remove(clase));
    if (ocultoArriba && ocultoAbajo) {
        textarea.classList.add("textarea-fade-both");
    } else if (ocultoArriba) {
        textarea.classList.add("textarea-fade-top");
    } else if (ocultoAbajo) {
        textarea.classList.add("textarea-fade-bottom");
    } else {
        textarea.classList.add("textarea-fade-none");
    }

    if (gradientTop) gradientTop.style.opacity = ocultoArriba ? "1" : "0";
    if (gradientBottom) gradientBottom.style.opacity = ocultoAbajo ? "1" : "0";
}

function programarActualizacionDegradadoTextoEscritor() {
    if (raf_degradado_textarea_escritor) return;
    raf_degradado_textarea_escritor = requestAnimationFrame(() => {
        raf_degradado_textarea_escritor = null;
        actualizarDegradadoDinamicoTextoEscritor();
    });
}

function iniciarDegradadoDinamicoTextoEscritor() {
    if (degradado_textarea_escritor_iniciado || !textarea) return;
    degradado_textarea_escritor_iniciado = true;

    const eventos = ["input", "scroll", "keyup", "mouseup", "touchend", "focus", "blur"];
    eventos.forEach((evento) => {
        textarea.addEventListener(evento, programarActualizacionDegradadoTextoEscritor);
    });
    window.addEventListener("resize", programarActualizacionDegradadoTextoEscritor);
    document.addEventListener("selectionchange", () => {
        if (document.activeElement === textarea) {
            programarActualizacionDegradadoTextoEscritor();
        }
    });

    if (typeof MutationObserver === "function") {
        observador_degradado_textarea_escritor = new MutationObserver(() => {
            programarActualizacionDegradadoTextoEscritor();
        });
        observador_degradado_textarea_escritor.observe(textarea, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["class", "style"]
        });
    }

    if (typeof ResizeObserver === "function") {
        observador_resize_textarea_escritor = new ResizeObserver(() => {
            programarActualizacionDegradadoTextoEscritor();
        });
        observador_resize_textarea_escritor.observe(textarea);
    }

    programarActualizacionDegradadoTextoEscritor();
    if (timeout_degradado_textarea_escritor) {
        clearTimeout(timeout_degradado_textarea_escritor);
    }
    timeout_degradado_textarea_escritor = setTimeout(() => {
        timeout_degradado_textarea_escritor = null;
        programarActualizacionDegradadoTextoEscritor();
    }, 120);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarDegradadoDinamicoTextoEscritor, { once: true });
} else {
    iniciarDegradadoDinamicoTextoEscritor();
}

function function_frase_final() {

    animacion_modo();
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("frase-final");
    if (explicacion) {
        explicacion.style.color = "orange";
        explicacion.innerHTML = traducirDescripcionModoEscritora("frase final", "ULTIMA RONDA");
    }
    renderizarObjetivoFraseFinalEscritora();
    limpiarMarcadoFraseFinal();

    texto.removeEventListener("keyup", listener_modo);
    listener_modo = function (e) { modo_frase_final(e) };
    texto.addEventListener("keyup", listener_modo);
}

function modo_frase_final(e) {
    actualizarProgresoFraseFinal();
    // Obtenemos el texto completo del elemento
    let textContent = e.target.innerText;
    // Convertimos a minÃºsculas y recortamos espacios (opcional pero recomendable):
    let textLower = textContent.trim().toLowerCase();
  
    // Revisamos si el texto termina exactamente con esa frase final:
    if (textLower.endsWith(frase_final)) {
      // AquÃ­ va tu lÃ³gica de finalizaciÃ³n
      final();
      socket.emit("fin_de_player", player);
    }
  }

  function ajustarFuerza(secs_base, fuerza) {
    // 1. ValidaciÃ³n de tipos:
    if (typeof secs_base !== 'number' || typeof fuerza !== 'number') {
      throw new TypeError('ajustarFuerza: ambos parÃ¡metros deben ser nÃºmeros');
    }
  
    // 2. Caso fuerza === 0: devolvemos el valor base sin alteraciones.
    if (fuerza === 0) {
      return Math.round(secs_base);
    }
  
    // 3. Colapsamos fuerza al mÃ¡ximo si lo excede:
    if (fuerza > LIMITE_TOTAL) {
      fuerza = LIMITE_TOTAL;
    }
  
    // 4. CÃ¡lculo del factor logarÃ­tmico normalizado:
    //    Numerador: log(fuerza + 1)
    //    Denominador: log(LIMITE_TOTAL + 1) para que el mÃ¡ximo sea 1
    const factorLog = Math.log(fuerza + 1) / Math.log(LIMITE_TOTAL + 1);
  
    // 5. Porcentaje de incremento final:
    //    maxIncremento * factorLog, entre 0 y maxIncremento
    const pctIncremento = maxIncremento * factorLog;
  
    // 6. CÃ¡lculo del resultado y redondeo:
    const resultado = Math.round(secs_base * (1 + pctIncremento));
  
    // 7. (Opcional) DepuraciÃ³n en consola:
    console.log(
      `[ajustarFuerza] secs_base=${secs_base}, fuerza=${fuerza}, ` +
      `factorLog=${factorLog.toFixed(3)}, pctInc=${(pctIncremento*100).toFixed(1)}% â†’ resultado=${resultado}`
    );
  
    return resultado;
  }


  function ajustarDestreza(secs_base, destreza) {
    // 1. ValidaciÃ³n de tipos:
    if (typeof secs_base !== 'number' || typeof destreza !== 'number') {
      throw new TypeError('ajustarDestreza: ambos parÃ¡metros deben ser nÃºmeros');
    }
  
    // 2. Caso destreza === 0: devolvemos el valor base sin alteraciones.
    if (destreza === 0) {
      return Math.round(secs_base);
    }
  
    // 3. Limitar destreza al rango [0, LIMITE_TOTAL].
    if (destreza > LIMITE_TOTAL) {
      destreza = LIMITE_TOTAL;
    }
  
    // 4. CÃ¡lculo del factor logarÃ­tmico normalizado:
    //    Numerador:   log(destreza + 1)
    //    Denominador: log(LIMITE_TOTAL + 1) â†’ mÃ¡ximo factor = 1
    const numerador   = Math.log(destreza + 1);
    const denominador = Math.log(LIMITE_TOTAL + 1);
    const factorLog   = numerador / denominador;
  
    // 5. Porcentaje de reducciÃ³n final:
    //    Entre 0 (sin cambio) y maxIncremento (reducciÃ³n mÃ¡xima).
    const pctReduccion = maxIncrementoDestreza * factorLog;
  
    // 6. CÃ¡lculo del nuevo valor:
    const resultado = Math.round(secs_base * (1 - pctReduccion));
  
    // 7. (Opcional) DepuraciÃ³n en consola:
    console.log(
      `[ajustarDestreza] secs_base=${secs_base}, destreza=${destreza}, ` +
      `factorLog=${factorLog.toFixed(3)}, pctRed=${(pctReduccion*100).toFixed(1)}% â†’ resultado=${resultado}`
    );
  
    return resultado;
  }

  function ajustarRapidez(baseRapidezBorrado, baseInicioBorrado, agilidad) {
    // 1. ValidaciÃ³n de tipos:
    if (typeof baseRapidezBorrado !== 'number' ||
        typeof baseInicioBorrado  !== 'number' ||
        typeof agilidad          !== 'number') {
      throw new TypeError('ajustarRapidez: todos los parÃ¡metros deben ser nÃºmeros');
    }
  
    // 2. Caso agilidad === 0: devolvemos las bases sin alteraciones.
    if (agilidad === 0) {
      rapidez_borrado        = baseRapidezBorrado;
      rapidez_inicio_borrado = baseInicioBorrado;
      console.log(
        `[ajustarRapidez] agilidad=0 â†’ rapidez_borrado=${rapidez_borrado}, ` +
        `rapidez_inicio_borrado=${rapidez_inicio_borrado}`
      );
      return;
    }
  
    // 3. Colapsar agilidad al mÃ¡ximo si lo excede:
    if (agilidad > LIMITE_TOTAL) {
      agilidad = LIMITE_TOTAL;
    }
  
    // 4. CÃ¡lculo del factor logarÃ­tmico normalizado:
    //    - Numerador:   log(agilidad + 1) crece de forma decreciente.
    //    - Denominador: log(LIMITE_TOTAL + 1) garantiza que el mÃ¡ximo sea 1.
    const factorLog = Math.log(agilidad + 1) / Math.log(LIMITE_TOTAL + 1);
  
    // 5. Porcentaje de incremento final:
    //    Entre 0 (sin cambio) y maxIncremento (incremento mÃ¡ximo).
    const pctIncremento = maxIncremento * factorLog;
  
    // 6. AplicaciÃ³n del incremento y redondeo opcional:
    rapidez_borrado        = Math.round(baseRapidezBorrado     * (1 + pctIncremento));
    rapidez_inicio_borrado = Math.round(baseInicioBorrado      * (1 + pctIncremento));
  
    // 7. DepuraciÃ³n en consola:
    console.log(
      `[ajustarRapidez] baseRapidezBorrado=${baseRapidezBorrado}, baseInicioBorrado=${baseInicioBorrado}, ` +
      `agilidad=${agilidad}, factorLog=${factorLog.toFixed(3)}, ` +
      `pctInc=${(pctIncremento*100).toFixed(1)}% â†’ rapidez_borrado=${rapidez_borrado}, ` +
      `rapidez_inicio_borrado=${rapidez_inicio_borrado}`
    );
  }
  

  /**
 * reduceLog:
 *   Reduce un tiempo (ms) aplicando una atenuaciÃ³n logarÃ­tmica.
 *
 * @param {number} base    - Valor original en milisegundos (debe ser > 0).
 * @param {number} k       - Coeficiente de â€œfuerzaâ€ de la reducciÃ³n. 
 *                           k = 0 â†’ sin reducciÃ³n; a mayor k â†’ mÃ¡s reducciÃ³n.
 * @returns {number}       - Nuevo valor en ms, redondeado.
 */
function reduceLog(base, k = 1) {
    if (base <= 0) return 0;
    // 1) Calculamos ln(base)
    const lnBase = Math.log(base);
    // 2) Creamos el denominador 1 + kÂ·ln(base), para que nunca divida por 0
    const denom = 1 + k * lnBase;
    // 3) Dividimos y redondeamos
    return Math.round(base / denom);
  }
  



if (socket && typeof socket.connect === "function" && !socket.connected) {
    socket.connect();
}
