window.ScribCompetitionUI?.conectar(socket, { role: "writer" });

socket.on("musa_corazon", (data) => {
    const equipo = data && Number(data.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    lanzarCorazonEscritor(equipo);
});

socket.on("recargar_rol_remoto", () => {
    window.location.reload();
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

const ID_AVISO_INVERSO_ESCRITORA = "aviso_inverso_escritora";
const CLASE_AVISO_INVERSO_ESCRITORA_ACTIVO = "aviso-inverso-escritora-activo";

function normalizarDuracionDesventajaEscritora(duracionMs) {
    const valor = Number(duracionMs);
    if (Number.isFinite(valor) && valor > 0) {
        return Math.max(0, Math.trunc(valor));
    }
    const fallback = Number(TIEMPO_MODIFICADOR);
    return Number.isFinite(fallback) && fallback > 0 ? Math.max(0, Math.trunc(fallback)) : 0;
}

function normalizarPayloadDesventajaEscritora(payload) {
    const data = (payload && typeof payload === "object") ? payload : { putada: payload };
    const putadaRaw = data.putada || data.seleccion || data.ventaja || data.tipo || "";
    const putada = window.ScribDisadvantages.normalizar(putadaRaw);
    const duracionRaw = data.tiempo_restante_ms
        ?? data.restante_ms
        ?? data.duracion_ms
        ?? data.duracionMs;
    const duracion = Number(duracionRaw);
    const playerPayload = Number(data.player || data.target || data.jugador);
    const intensidadRaw = Number(data.intensidad);
    return {
        putada,
        player: Number.isFinite(playerPayload) ? playerPayload : null,
        duracionMs: Number.isFinite(duracion) && duracion > 0 ? Math.trunc(duracion) : null,
        intensidad: Number.isFinite(intensidadRaw) ? Math.max(0.6, Math.min(1, intensidadRaw)) : 1
    };
}

function mostrarAvisoInversoEscritora() {
    if (!document.body) return;
    let aviso = document.getElementById(ID_AVISO_INVERSO_ESCRITORA);
    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = ID_AVISO_INVERSO_ESCRITORA;
        aviso.className = "aviso-inverso-escritora";
        aviso.setAttribute("role", "alert");
        aviso.setAttribute("aria-live", "assertive");

        const icono = document.createElement("span");
        icono.className = "aviso-inverso-escritora__emoji";
        icono.textContent = PUTADA_INVERSO;

        const mensaje = document.createElement("span");
        mensaje.className = "aviso-inverso-escritora__texto";
        mensaje.textContent = "ESCRIBE CADA PALABRA AL REV\u00c9S";

        aviso.append(icono, mensaje);
        document.body.appendChild(aviso);
    }
    document.body.classList.add(CLASE_AVISO_INVERSO_ESCRITORA_ACTIVO);
}

function ocultarAvisoInversoEscritora() {
    if (document.body) {
        document.body.classList.remove(CLASE_AVISO_INVERSO_ESCRITORA_ACTIVO);
    }
    const aviso = document.getElementById(ID_AVISO_INVERSO_ESCRITORA);
    if (aviso) {
        aviso.remove();
    }
}

function aplicarDesventajaEscritora(payload, opciones = {}) {
    const data = normalizarPayloadDesventajaEscritora(payload);
    if (data.player && Number(data.player) !== Number(player)) {
        return false;
    }
    if (!data.putada || typeof PUTADAS[data.putada] !== "function") {
        return false;
    }
    if (opciones.mostrarFeedback !== false) {
        mostrarFeedbackFlotanteEscritora(`${data.putada} DESVENTAJA!`, {
            tipo: "negativo",
            color: color_negativo
        });
    }
    const putadaOpciones = {};
    putadaOpciones.intensidad = data.intensidad;
    intensidad_desventaja_escritora = data.intensidad;
    if (data.duracionMs) {
        putadaOpciones.duracionMs = data.duracionMs;
    }
    if (opciones.restaurando === true) {
        putadaOpciones.reanudando = true;
    }
    PUTADAS[data.putada](putadaOpciones);
    return true;
}

function registrarDesventajaActivaEscritora(tipo, duracionMs) {
    const duracion = normalizarDuracionDesventajaEscritora(duracionMs);
    desventaja_activa_escritora = {
        tipo,
        inicioTs: Date.now(),
        duracionMs: duracion,
        restanteMs: duracion,
        pausada: false
    };
    putada_actual = tipo;
    return obtenerRevisionContextoTransitorioEscritora();
}

function obtenerRestanteDesventajaActivaEscritora() {
    if (!desventaja_activa_escritora) return 0;
    if (desventaja_activa_escritora.pausada) {
        return Math.max(0, Number(desventaja_activa_escritora.restanteMs) || 0);
    }
    const duracion = Number(desventaja_activa_escritora.duracionMs) || 0;
    const inicio = Number(desventaja_activa_escritora.inicioTs) || Date.now();
    return Math.max(0, duracion - (Date.now() - inicio));
}

function finalizarDesventajaActivaEscritora(tipo) {
    if (tipo === PUTADA_INVERSO) {
        ocultarAvisoInversoEscritora();
    }
    if (desventaja_activa_escritora && desventaja_activa_escritora.tipo === tipo) {
        desventaja_activa_escritora = null;
    }
    if (putada_actual === tipo) {
        putada_actual = "";
    }
}

function limpiarTemporizadorDesventajaEscritora(tipo) {
    if (!tipo || tipo === PUTADA_TORTUGA) {
        clearTimeout(timeout_teclado_lento);
        timeout_teclado_lento = null;
    }
    if (!tipo || tipo === PUTADA_RAYO) {
        clearTimeout(timeout_rayo_putada);
        timeout_rayo_putada = null;
    }
    if (!tipo || tipo === PUTADA_INVERSO) {
        clearTimeout(tempo_text_inverso);
        tempo_text_inverso = null;
    }
    if (!tipo || tipo === PUTADA_PLUMA) {
        clearTimeout(timeout_bloqueo_putada);
        timeout_bloqueo_putada = null;
    }
    if (!tipo || tipo === PUTADA_BORROSO) {
        clearTimeout(tempo_text_borroso);
        tempo_text_borroso = null;
    }
}

function restaurarRayoEscritora() {
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    if (borrado_cambiado) {
        borrado_cambiado = false;
        rapidez_borrado = antiguo_rapidez_borrado;
        rapidez_inicio_borrado = antiguo_inicio_borrado;
    }
}

function limpiarDesventajasActivasEscritora() {
    limpiarTemporizadorDesventajaEscritora();
    desventaja_activa_escritora = null;
    teclado_lento_putada = false;
    bloquear_borrado_putada = false;
    temp_text_inverso_activado = false;
    setInterfazInversaGlobal(false);
    ocultarAvisoInversoEscritora();
    restaurarRayoEscritora();
    texto.classList.remove("textarea_blur");
    modo_texto_borroso = 0;
    intensidad_desventaja_escritora = 1;
    texto.style.removeProperty("--desventaja-blur");
    putada_actual = "";
}

function pausarDesventajaActivaEscritora() {
    if (!desventaja_activa_escritora || desventaja_activa_escritora.pausada) return;
    const restanteMs = obtenerRestanteDesventajaActivaEscritora();
    limpiarTemporizadorDesventajaEscritora(desventaja_activa_escritora.tipo);
    desventaja_activa_escritora = {
        ...desventaja_activa_escritora,
        restanteMs,
        pausada: true
    };
}

function reanudarDesventajaActivaEscritora() {
    if (!desventaja_activa_escritora || !desventaja_activa_escritora.pausada) return;
    const activa = desventaja_activa_escritora;
    const restanteMs = Math.max(0, Number(activa.restanteMs) || 0);
    desventaja_activa_escritora = null;
    if (restanteMs <= 0 || typeof PUTADAS[activa.tipo] !== "function") {
        finalizarDesventajaActivaEscritora(activa.tipo);
        return;
    }
    PUTADAS[activa.tipo]({ duracionMs: restanteMs, reanudando: true });
}

const PUTADAS = {
    [PUTADA_TORTUGA]: function (opciones = {}) {
        if (timeout_teclado_lento) {
            clearTimeout(timeout_teclado_lento);
            timeout_teclado_lento = null;
        }
        const duracion = normalizarDuracionDesventajaEscritora(opciones.duracionMs);
        teclado_lento_putada = true;
        const revisionContexto = registrarDesventajaActivaEscritora(PUTADA_TORTUGA, duracion);
        timeout_teclado_lento = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            teclado_lento_putada = false;
            timeout_teclado_lento = null;
            finalizarDesventajaActivaEscritora(PUTADA_TORTUGA);
        }, duracion);
    },
    "âŒ›": function () {
    },
    [PUTADA_RAYO]: function (opciones = {}) {
        limpiarTemporizadorDesventajaEscritora(PUTADA_RAYO);
        const duracion = normalizarDuracionDesventajaEscritora(opciones.duracionMs);
        const revisionContexto = registrarDesventajaActivaEscritora(PUTADA_RAYO, duracion);
        const reanudando = opciones.reanudando === true && borrado_cambiado;
        if (!reanudando) {
            borrado_cambiado = true;
            antiguo_rapidez_borrado = rapidez_borrado;
            antiguo_inicio_borrado = rapidez_inicio_borrado;
            const intensidad = Math.max(0.6, Math.min(1, Number(opciones.intensidad) || 1));
            rapidez_borrado = reduceLog(rapidez_borrado, RAYO_REDUCCION_K * intensidad);
            rapidez_inicio_borrado = reduceLog(rapidez_inicio_borrado, RAYO_REDUCCION_K * intensidad);
        }
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.transform = "translateX(-50%)";
        lightning.style.top = "27%";
        lightning.style.left = "50%";
        timeout_rayo_putada = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            timeout_rayo_putada = null;
            restaurarRayoEscritora();
            finalizarDesventajaActivaEscritora(PUTADA_RAYO);
        }, duracion);
    },

    [PUTADA_INVERSO]: function (opciones = {}) {
        limpiarTemporizadorDesventajaEscritora(PUTADA_INVERSO);
        const duracion = normalizarDuracionDesventajaEscritora(opciones.duracionMs);
        tiempo_inicial = new Date();
        const revisionContexto = registrarDesventajaActivaEscritora(PUTADA_INVERSO, duracion);
        desactivar_borrar = true;
        mostrarAvisoInversoEscritora();
        if (!(opciones.reanudando === true && temp_text_inverso_activado === true)) {
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
        }
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
            finalizarDesventajaActivaEscritora(PUTADA_INVERSO);
        sendText()  
        }, duracion);
    },

    [PUTADA_PLUMA]: function (opciones = {}) {
        if (timeout_bloqueo_putada) {
            clearTimeout(timeout_bloqueo_putada);
            timeout_bloqueo_putada = null;
        }
        const duracion = normalizarDuracionDesventajaEscritora(opciones.duracionMs);
        bloquear_borrado_putada = true;
        intensidad_desventaja_escritora = Math.max(0.6, Math.min(1, Number(opciones.intensidad) || 1));
        const revisionContexto = registrarDesventajaActivaEscritora(PUTADA_PLUMA, duracion);
        timeout_bloqueo_putada = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            limpiar_bloqueo_putada();
            finalizarDesventajaActivaEscritora(PUTADA_PLUMA);
        }, duracion);
    },

    [PUTADA_BORROSO]: function (opciones = {}) {
        limpiarTemporizadorDesventajaEscritora(PUTADA_BORROSO);
        const duracion = normalizarDuracionDesventajaEscritora(opciones.duracionMs);
        const revisionContexto = registrarDesventajaActivaEscritora(PUTADA_BORROSO, duracion);
        modo_texto_borroso = 1;
        const intensidad = Math.max(0.6, Math.min(1, Number(opciones.intensidad) || 1));
        texto.style.setProperty("--desventaja-blur", `${(3 + (7 * intensidad)).toFixed(1)}px`);
        tiempo_inicial = new Date();
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            if (!esRevisionContextoTransitorioEscritoraActiva(revisionContexto)) {
                return;
            }
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            texto.style.removeProperty("--desventaja-blur");
            modo_texto_borroso = 0;
            tempo_text_borroso = null;
            finalizarDesventajaActivaEscritora(PUTADA_BORROSO);
        }, duracion);
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
        explicacion.innerHTML = traducirDescripcionModoEscritora("palabras bonus", "GANA QUIEN ESCRIBE MAS PALABRAS");
        palabra.innerHTML = traducirTituloModoEscritora("palabras bonus", "NIVEL PALABRAS BENDITAS");
        return;
    }
    if (modo_actual === "letra prohibida") {
        explicacion.style.color = "red";
        explicacion.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        palabra.innerHTML = traducirTituloModoEscritora("letra prohibida", "NIVEL LETRA MALDITA");
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
        explicacion.innerHTML = traducirDescripcionModoEscritora("palabras prohibidas", "EVITA LAS PALABRAS MALDITAS");
        palabra.innerHTML = traducirTituloModoEscritora("palabras prohibidas", "NIVEL PALABRAS MALDITAS");
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
            explicacion.innerHTML = traducirDescripcionModoEscritora("palabras bonus", "GANA QUIEN ESCRIBE MAS PALABRAS");
        }
        palabra.innerHTML = traducirTituloModoEscritora("palabras bonus", "NIVEL PALABRAS BENDITAS");
        definicion.innerHTML = "";
        socket.emit("nueva_palabra", { player, accion: "solicitar", modo_seq: modo_seq_actual });
        socket.on(enviar_palabra, data => {
          console.log(data)
            recibir_palabra(data);
        });
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("prohibida");
        letra_prohibida = normalizarLetraNivelEscritora(data.letra_prohibida);
        //TO DO: MODIFICAR FUNCIÃ“N PARA QUE NO ESTÃ‰ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        if (explicacion) {
            explicacion.style.color = "red";
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        }
        palabra.innerHTML = traducirTituloModoEscritora("letra prohibida", "NIVEL LETRA MALDITA");
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", { player, accion: "solicitar", modo_seq: modo_seq_actual });
    },

    "letra bendita": function (data) {
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("bendita");
        letra_bendita = normalizarLetraNivelEscritora(data.letra_bendita);
        //TO DO: MODIFICAR FUNCIÃ“N PARA QUE NO ESTÃ‰ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        if (explicacion) {
            explicacion.style.color = "lime";
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("bendita", letra_bendita);
        }
        palabra.innerHTML = traducirTituloModoEscritora("letra bendita", "NIVEL LETRA BENDITA");
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", { player, accion: "solicitar", modo_seq: modo_seq_actual });
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
            explicacion.innerHTML = traducirDescripcionModoEscritora("palabras prohibidas", "EVITA LAS PALABRAS MALDITAS");
        }
        palabra.innerHTML = traducirTituloModoEscritora("palabras prohibidas", "NIVEL PALABRAS MALDITAS");
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_prohibida", { player, accion: "solicitar", modo_seq: modo_seq_actual });
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

const MODOS_DESCARTE_INSPIRACION_ESCRITORA = new Set([
    "palabras bonus",
    "letra bendita",
    "letra prohibida"
]);
const TIMEOUT_DESCARTE_INSPIRACION_MS = 6000;
let descarte_inspiracion_en_vuelo = null;
let aprovechamiento_inspiracion_en_vuelo = null;
let secuencia_request_inspiracion = 0;
let caret_previo_boton_descartar = null;
let timeout_estado_descartar = null;
let timeout_animacion_descartar = null;

function crearRequestIdInspiracionEscritora(prefijo = "inspiracion") {
    secuencia_request_inspiracion += 1;
    const clientId = typeof obtenerClientIdSesionEscritora === "function"
        ? obtenerClientIdSesionEscritora()
        : `writer-${player || "x"}`;
    return `${prefijo}-${clientId}-${Date.now().toString(36)}-${secuencia_request_inspiracion.toString(36)}`;
}

function normalizarMetaEntregaInspiracionEscritora(payload = {}) {
    if (window.ScribInspiration && typeof window.ScribInspiration.normalizarMetaEntregaInspiracion === "function") {
        return window.ScribInspiration.normalizarMetaEntregaInspiracion(payload);
    }
    const descartes = Math.max(0, Math.trunc(Number(payload?.descartes_consecutivos) || 0));
    const factorFallback = descartes <= 0 ? 1 : (descartes === 1 ? 0.75 : (descartes === 2 ? 0.5 : 0.25));
    const factorRaw = Number(payload?.factor_inspiracion);
    const factor = Number.isFinite(factorRaw) ? Math.max(0, Math.min(1, factorRaw)) : factorFallback;
    const valorRaw = Number(payload?.valor_inspiracion);
    return {
        inspiracion_id: String(payload?.inspiracion_id || "").trim(),
        descartes_consecutivos: descartes,
        factor_inspiracion: factor,
        valor_inspiracion: Number.isFinite(valorRaw) ? Math.max(0, Math.min(1, valorRaw)) : factor,
        porcentaje_tiempo: Math.round(factorFallback * 100)
    };
}

function esModoDescartableInspiracionEscritora(modo = modo_actual) {
    return MODOS_DESCARTE_INSPIRACION_ESCRITORA.has(String(modo || "").trim().toLowerCase());
}

function puedeDescartarInspiracionEscritora() {
    return Boolean(
        meta_inspiracion_activa_escritora?.inspiracion_id
        && esModoDescartableInspiracionEscritora()
        && asignada === true
        && descarte_inspiracion_en_vuelo === null
        && aprovechamiento_inspiracion_en_vuelo === null
        && es_pausa !== true
        && terminado !== true
        && partida_global_finalizada !== true
        && (!socket || socket.connected !== false)
    );
}

function limpiarTimeoutEstadoDescartarInspiracionEscritora() {
    if (timeout_estado_descartar) {
        clearTimeout(timeout_estado_descartar);
        timeout_estado_descartar = null;
    }
}

function anunciarEstadoDescartarInspiracionEscritora(mensaje = "", duracionMs = 0) {
    if (!inspiration_discard_status) return;
    limpiarTimeoutEstadoDescartarInspiracionEscritora();
    inspiration_discard_status.textContent = mensaje;
    if (mensaje && duracionMs > 0) {
        timeout_estado_descartar = setTimeout(() => {
            timeout_estado_descartar = null;
            if (inspiration_discard_status) inspiration_discard_status.textContent = "";
        }, duracionMs);
    }
}

function actualizarUiDescartarInspiracionEscritora(opciones = {}) {
    if (!inspiration_discard || !inspiration_discard_button) return;
    const meta = meta_inspiracion_activa_escritora;
    const tieneEntrega = Boolean(meta?.inspiracion_id && esModoDescartableInspiracionEscritora());
    inspiration_discard.hidden = !tieneEntrega;
    inspiration_discard.classList.toggle("has-penalty", Boolean(tieneEntrega && meta.descartes_consecutivos > 0));
    inspiration_discard.classList.toggle("is-pending", descarte_inspiracion_en_vuelo !== null);
    inspiration_discard_button.disabled = !puedeDescartarInspiracionEscritora();
    inspiration_discard_button.setAttribute(
        "aria-label",
        tJuego2P("writer.inspiration.discard_aria", {}, "Descartar inspiracion. Atajo F8")
    );

    const descartes = tieneEntrega ? Math.max(0, Number(meta.descartes_consecutivos) || 0) : 0;
    if (inspiration_discard_penalty) {
        inspiration_discard_penalty.hidden = descartes <= 0;
    }
    if (inspiration_discard_streak) {
        inspiration_discard_streak.textContent = descartes > 0
            ? tJuego2P("writer.inspiration.streak", { count: descartes }, `RACHA x${descartes}`)
            : "";
    }
    if (inspiration_discard_effect) {
        const scorePercent = Math.round((Number(meta?.factor_inspiracion) || 0) * 100);
        const timePercent = Number(meta?.porcentaje_tiempo) || 100;
        const esMusa = meta?.es_musa === true;
        const modoNormalizado = String(modo_actual || "").trim().toLowerCase();
        const esModoLetras = modoNormalizado === "letra bendita" || modoNormalizado === "letra prohibida";
        const clavePenalizacion = esModoLetras
            ? "writer.inspiration.penalty_score"
            : (esMusa ? "writer.inspiration.penalty" : "writer.inspiration.penalty_time_final");
        const fallbackPenalizacion = esModoLetras
            ? `ESTA INSPIRACION: MARCADOR ${scorePercent}%`
            : (esMusa
                ? `ESTA INSPIRACION: TIEMPO ${timePercent}% · MARCADOR ${scorePercent}%`
                : `ESTA INSPIRACION: TIEMPO ${timePercent}% · PUNTUACION FINAL ${scorePercent}%`);
        inspiration_discard_effect.textContent = descartes > 0
            ? tJuego2P(
                clavePenalizacion,
                { time: timePercent, score: scorePercent },
                fallbackPenalizacion
            )
            : "";
    }

    if (opciones.animarEntrada === true && tieneEntrega) {
        inspiration_discard.classList.remove("is-arriving");
        void inspiration_discard.offsetWidth;
        inspiration_discard.classList.add("is-arriving");
        if (timeout_animacion_descartar) clearTimeout(timeout_animacion_descartar);
        timeout_animacion_descartar = setTimeout(() => {
            timeout_animacion_descartar = null;
            if (inspiration_discard) inspiration_discard.classList.remove("is-arriving");
        }, 520);
    }
}

function resolverDescartePendientePorNuevaEntrega(metaNueva) {
    if (!descarte_inspiracion_en_vuelo || !metaNueva?.inspiracion_id) return;
    if (metaNueva.inspiracion_id === descarte_inspiracion_en_vuelo.inspiracion_id) return;
    clearTimeout(descarte_inspiracion_en_vuelo.timeoutId);
    descarte_inspiracion_en_vuelo = null;
    anunciarEstadoDescartarInspiracionEscritora(
        tJuego2P("writer.inspiration.discarded", {}, "Inspiracion descartada"),
        1800
    );
}

function registrarEntregaInspiracionEscritora(payload = {}, opciones = {}) {
    const meta = normalizarMetaEntregaInspiracionEscritora(payload);
    if (
        meta.inspiracion_id
        && meta_inspiracion_activa_escritora?.inspiracion_id === meta.inspiracion_id
    ) {
        return false;
    }
    resolverDescartePendientePorNuevaEntrega(meta);
    const origenMusa = typeof payload?.origen_musa === "string"
        ? payload.origen_musa.trim().toLowerCase()
        : "";
    meta_inspiracion_activa_escritora = {
        ...meta,
        origen_musa: origenMusa,
        es_musa: opciones.esMusa === true
            || payload?.origen_musa === true
            || origenMusa === "musa"
            || origenMusa === "musa_enemiga",
        modo_seq: Number.isFinite(Number(payload?.modo_seq))
            ? Math.max(0, Math.trunc(Number(payload.modo_seq)))
            : modo_seq_actual,
        tiempo_palabras_bonus: resolverTiempoPalabraAsignadaEscritora(payload)
    };
    if (definicion) definicion.classList.remove("is-discarding");
    if (inspiration_discard) inspiration_discard.classList.remove("is-discarding", "is-discarded");
    actualizarUiDescartarInspiracionEscritora({ animarEntrada: true });
    return true;
}

function limpiarEntregaInspiracionEscritora(opciones = {}) {
    if (descarte_inspiracion_en_vuelo && opciones.conservarPeticion !== true) {
        clearTimeout(descarte_inspiracion_en_vuelo.timeoutId);
        descarte_inspiracion_en_vuelo = null;
    }
    if (aprovechamiento_inspiracion_en_vuelo && opciones.conservarAprovechamiento !== true) {
        clearTimeout(aprovechamiento_inspiracion_en_vuelo.timeoutId);
        aprovechamiento_inspiracion_en_vuelo = null;
    }
    meta_inspiracion_activa_escritora = null;
    if (inspiration_discard) {
        inspiration_discard.classList.remove("is-arriving", "is-discarding", "has-penalty", "is-pending");
    }
    if (definicion) definicion.classList.remove("is-discarding");
    actualizarUiDescartarInspiracionEscritora();
    if (opciones.conservarMensaje !== true) {
        anunciarEstadoDescartarInspiracionEscritora("");
    }
}

function enfocarEditorTrasDescartarInspiracionEscritora(caretGuardado = null) {
    if (!texto || es_pausa || terminado || partida_global_finalizada) return;
    try {
        texto.focus({ preventScroll: true });
    } catch (_error) {
        texto.focus();
    }
    const caret = caretGuardado && caretGuardado.caretNode ? caretGuardado : null;
    if (caret && typeof nodoPerteneceAlEditor === "function" && nodoPerteneceAlEditor(caret.caretNode)) {
        restaurarPosicionCaret(caret.caretNode, caret.caretPos);
    }
}

function respuestaAckDescartarCorrecta(respuesta) {
    return respuesta === true || Boolean(respuesta && typeof respuesta === "object" && respuesta.ok === true);
}

function normalizarResultadoAckAprovechamientoEscritora(respuesta = {}) {
    if (window.ScribInspiration && typeof window.ScribInspiration.normalizarResultadoAprovechamiento === "function") {
        return window.ScribInspiration.normalizarResultadoAprovechamiento(respuesta);
    }
    if (!respuesta || typeof respuesta !== "object") return null;
    const resultado = respuesta.resultado && typeof respuesta.resultado === "object"
        ? respuesta.resultado
        : {};
    const valorRaw = respuesta.valor_inspiracion ?? resultado.valor_inspiracion;
    const tiempoRaw = respuesta.tiempo_otorgado ?? resultado.tiempo_otorgado;
    if (
        valorRaw === null || typeof valorRaw === "undefined" || String(valorRaw).trim() === ""
        || tiempoRaw === null || typeof tiempoRaw === "undefined" || String(tiempoRaw).trim() === ""
    ) {
        return null;
    }
    const valorInspiracion = Number(valorRaw);
    const tiempoOtorgado = Number(tiempoRaw);
    if (!Number.isFinite(valorInspiracion) || !Number.isFinite(tiempoOtorgado)) return null;
    return {
        valor_inspiracion: Math.max(0, Math.min(1, valorInspiracion)),
        tiempo_otorgado: tiempoOtorgado
    };
}

function limpiarObjetivoInspiracionDescartadoEscritora(inspiracionId) {
    if (meta_inspiracion_activa_escritora?.inspiracion_id !== inspiracionId) return false;
    asignada = false;
    palabra_actual = [];
    limpiarDeteccionMultipalabraAsignada();
    if (modo_actual === "palabras bonus" || modo_actual === "palabras prohibidas") {
        texto.removeEventListener("keyup", listener_modo);
    } else if (modo_actual === "letra bendita" || modo_actual === "letra prohibida") {
        texto.removeEventListener("keyup", listener_modo1);
        inspiracionLetraMusaActual = null;
    }
    if (definicion) {
        definicion.innerHTML = "";
        definicion.classList.remove("objetivo-nivel", "definicion-superbonus", "definicion--marquee");
        aplicarMarqueeSiOverflowEscritora(definicion);
        establecerContextoMusaDefinicion("");
    }
    meta_inspiracion_activa_escritora = null;
    return true;
}

function completarDescarteInspiracionEscritora(requestId, respuesta, caretGuardado) {
    if (!descarte_inspiracion_en_vuelo || descarte_inspiracion_en_vuelo.request_id !== requestId) return;
    const pendiente = descarte_inspiracion_en_vuelo;
    clearTimeout(pendiente.timeoutId);
    descarte_inspiracion_en_vuelo = null;
    const ok = respuestaAckDescartarCorrecta(respuesta);
    if (!ok) {
        asignada = pendiente.asignadaPrevia;
        if (inspiration_discard) inspiration_discard.classList.remove("is-discarding");
        if (definicion) definicion.classList.remove("is-discarding");
        actualizarUiDescartarInspiracionEscritora();
        anunciarEstadoDescartarInspiracionEscritora(
            tJuego2P("writer.inspiration.discard_error", {}, "No se pudo descartar. Intentalo de nuevo."),
            2800
        );
        enfocarEditorTrasDescartarInspiracionEscritora(caretGuardado);
        return;
    }

    setTimeout(() => {
        const objetivoRetirado = limpiarObjetivoInspiracionDescartadoEscritora(pendiente.inspiracion_id);
        if (objetivoRetirado && inspiration_discard) {
            inspiration_discard.classList.remove("is-discarding");
            inspiration_discard.classList.add("is-discarded");
            setTimeout(() => inspiration_discard?.classList.remove("is-discarded"), 420);
        }
        if (objetivoRetirado && definicion) definicion.classList.remove("is-discarding");
        actualizarUiDescartarInspiracionEscritora();
    }, 260);
    anunciarEstadoDescartarInspiracionEscritora(
        tJuego2P("writer.inspiration.discarded", {}, "Inspiracion descartada"),
        1800
    );
    enfocarEditorTrasDescartarInspiracionEscritora(caretGuardado);
}

function descartarInspiracionActivaEscritora(caretGuardado = null) {
    if (!puedeDescartarInspiracionEscritora()) return false;
    const meta = { ...meta_inspiracion_activa_escritora };
    const requestId = crearRequestIdInspiracionEscritora("descartar");
    const payload = {
        player,
        inspiracion_id: meta.inspiracion_id,
        modo_seq: Number.isFinite(Number(meta.modo_seq)) ? Number(meta.modo_seq) : modo_seq_actual,
        request_id: requestId
    };
    const timeoutId = setTimeout(() => {
        completarDescarteInspiracionEscritora(requestId, { ok: false, motivo: "timeout" }, caretGuardado);
    }, TIMEOUT_DESCARTE_INSPIRACION_MS);
    descarte_inspiracion_en_vuelo = {
        request_id: requestId,
        inspiracion_id: meta.inspiracion_id,
        asignadaPrevia: asignada,
        timeoutId
    };
    asignada = false;
    if (inspiration_discard) inspiration_discard.classList.add("is-discarding");
    if (definicion) definicion.classList.add("is-discarding");
    actualizarUiDescartarInspiracionEscritora();
    anunciarEstadoDescartarInspiracionEscritora(
        tJuego2P("writer.inspiration.discarding", {}, "Descartando inspiracion...")
    );
    socket.emit("descartar_inspiracion", payload, (respuesta) => {
        completarDescarteInspiracionEscritora(requestId, respuesta, caretGuardado);
    });
    return true;
}

function emitirAprovecharInspiracionEscritora(evento, opciones = {}) {
    if (aprovechamiento_inspiracion_en_vuelo) return false;
    const meta = meta_inspiracion_activa_escritora && typeof meta_inspiracion_activa_escritora === "object"
        ? { ...meta_inspiracion_activa_escritora }
        : null;
    if (!meta?.inspiracion_id) {
        if (typeof opciones.alRechazar === "function") opciones.alRechazar({ ok: false, motivo: "sin_entrega" });
        return false;
    }
    const requestId = crearRequestIdInspiracionEscritora("aprovechar");
    const modoSeq = Number.isFinite(Number(meta.modo_seq)) ? Number(meta.modo_seq) : modo_seq_actual;
    const payload = {
        player,
        accion: "aprovechar",
        inspiracion_id: meta.inspiracion_id,
        request_id: requestId,
        modo_seq: modoSeq
    };
    const completar = (respuesta) => {
        if (!aprovechamiento_inspiracion_en_vuelo || aprovechamiento_inspiracion_en_vuelo.request_id !== requestId) {
            return;
        }
        clearTimeout(aprovechamiento_inspiracion_en_vuelo.timeoutId);
        aprovechamiento_inspiracion_en_vuelo = null;
        const resultadoAck = normalizarResultadoAckAprovechamientoEscritora(respuesta);
        const ok = Boolean(
            respuesta
            && typeof respuesta === "object"
            && respuesta.ok === true
            && resultadoAck
        );
        if (!ok) {
            if (
                meta_inspiracion_activa_escritora?.inspiracion_id === meta.inspiracion_id
                && Number(modo_seq_actual) === Number(modoSeq)
            ) {
                asignada = true;
                actualizarUiDescartarInspiracionEscritora();
            }
            if (typeof opciones.alRechazar === "function") opciones.alRechazar(respuesta || { ok: false });
            return;
        }
        if (typeof opciones.alConfirmar === "function") opciones.alConfirmar(meta, respuesta, resultadoAck);
    };
    const timeoutId = setTimeout(() => completar({ ok: false, motivo: "timeout" }), TIMEOUT_DESCARTE_INSPIRACION_MS);
    aprovechamiento_inspiracion_en_vuelo = {
        request_id: requestId,
        inspiracion_id: meta.inspiracion_id,
        modo_seq: modoSeq,
        timeoutId
    };
    asignada = false;
    actualizarUiDescartarInspiracionEscritora();
    socket.emit(evento, payload, completar);
    return true;
}

function esF8InspiracionEscritora(evento = {}) {
    return evento.code === "F8" || evento.key === "F8";
}

function manejarKeydownDescartarInspiracionEscritora(evento) {
    const esAtajo = window.ScribInspiration?.esAtajoDescartarInspiracion
        ? window.ScribInspiration.esAtajoDescartarInspiracion(evento)
        : Boolean(
            esF8InspiracionEscritora(evento)
            && !evento.defaultPrevented
            && !evento.repeat
            && !evento.isComposing
            && Number(evento.keyCode) !== 229
            && !evento.altKey
            && !evento.ctrlKey
            && !evento.metaKey
            && !evento.shiftKey
        );
    if (!esAtajo || !puedeDescartarInspiracionEscritora()) return;
    const caretGuardado = guardarPosicionCaret();
    evento.preventDefault();
    evento.stopImmediatePropagation();
    descartarInspiracionActivaEscritora(caretGuardado);
}

function manejarKeyupDescartarInspiracionEscritora(evento) {
    const modoConObjetivoPorKeyup = esModoDescartableInspiracionEscritora()
        || String(modo_actual || "").trim().toLowerCase() === "palabras prohibidas";
    if (!esF8InspiracionEscritora(evento) || !modoConObjetivoPorKeyup) return;
    evento.preventDefault();
    evento.stopImmediatePropagation();
}

document.addEventListener("keydown", manejarKeydownDescartarInspiracionEscritora, true);
document.addEventListener("keyup", manejarKeyupDescartarInspiracionEscritora, true);

if (inspiration_discard_button) {
    inspiration_discard_button.addEventListener("pointerdown", () => {
        caret_previo_boton_descartar = guardarPosicionCaret();
    });
    inspiration_discard_button.addEventListener("click", () => {
        const caretGuardado = caret_previo_boton_descartar || guardarPosicionCaret();
        caret_previo_boton_descartar = null;
        descartarInspiracionActivaEscritora(caretGuardado);
        enfocarEditorTrasDescartarInspiracionEscritora(caretGuardado);
    });
}

socket.on("idioma_actual", (payload = {}) => {
    if (window && typeof window.scribSetLanguage2P === "function") {
        window.scribSetLanguage2P(payload && payload.idioma ? payload.idioma : "es");
    }
});

function crearOverlayEscritoraReemplazada() {
    let overlay = document.getElementById("escritora_reemplazada_overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "escritora_reemplazada_overlay";
    overlay.setAttribute("role", "alert");
    overlay.setAttribute("aria-live", "assertive");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483647";
    overlay.style.display = "none";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "min(8vw, 64px)";
    overlay.style.background = "rgba(2, 6, 18, 0.92)";
    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.color = "#f8fbff";
    overlay.style.fontFamily = "inherit";
    overlay.style.textAlign = "center";
    overlay.style.pointerEvents = "auto";
    const panel = document.createElement("div");
    panel.style.maxWidth = "760px";
    panel.style.border = "2px solid rgba(120, 220, 255, 0.75)";
    panel.style.boxShadow = "0 0 32px rgba(64, 242, 254, 0.45), inset 0 0 22px rgba(64, 242, 254, 0.12)";
    panel.style.background = "rgba(8, 16, 38, 0.96)";
    panel.style.borderRadius = "8px";
    panel.style.padding = "clamp(24px, 4vw, 42px)";
    const titulo = document.createElement("h1");
    titulo.id = "escritora_reemplazada_titulo";
    titulo.style.margin = "0 0 18px";
    titulo.style.fontSize = "clamp(1.8rem, 4vw, 3.5rem)";
    titulo.style.letterSpacing = "0";
    titulo.textContent = "Sesi\u00f3n reemplazada";
    const mensaje = document.createElement("p");
    mensaje.id = "escritora_reemplazada_mensaje";
    mensaje.style.margin = "0";
    mensaje.style.fontSize = "clamp(1rem, 2vw, 1.35rem)";
    mensaje.style.lineHeight = "1.45";
    panel.appendChild(titulo);
    panel.appendChild(mensaje);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    return overlay;
}

function mostrarAvisoEscritoraReemplazada(payload = {}) {
    const overlay = crearOverlayEscritoraReemplazada();
    const mensaje = typeof payload.mensaje === "string" && payload.mensaje.trim()
        ? payload.mensaje.trim()
        : "Otra sesi\u00f3n activa de este rol est\u00e1 activa. Esta pesta\u00f1a no va a funcionar.";
    const mensajeEl = document.getElementById("escritora_reemplazada_mensaje");
    if (mensajeEl) {
        mensajeEl.textContent = mensaje;
    }
    overlay.style.display = "flex";
    document.body.classList.add("escritora-reemplazada");
    menu_modificador = false;
    desactivar_borrar = true;
    if (typeof invalidarBorradoEscritora === "function") {
        invalidarBorradoEscritora();
    }
    if (texto) {
        texto.contentEditable = "false";
        texto.blur();
    }
    if (typeof socket !== "undefined" && socket && typeof socket.disconnect === "function") {
        socket.disconnect();
    }
}

function extraerAtributosPropiosEscritora(payload = {}) {
    const data = (payload && typeof payload === "object") ? payload : {};
    const id = Number(player);
    if (data.atributos && Number(data.player) === id) {
        return data.atributos;
    }
    return data[id] || data[String(id)] || null;
}

socket.on("recibir_atributos", (payload = {}) => {
    const atributosPropios = extraerAtributosPropiosEscritora(payload);
    if (atributosPropios && typeof atributosPropios === "object") {
        if (typeof aplicarAtributosEscritora === "function") {
            aplicarAtributosEscritora(atributosPropios);
        } else {
            atributos = atributosPropios;
        }
        return;
    }
    if (typeof obtenerSegundosPalabrasEscritora === "function") {
        obtenerSegundosPalabrasEscritora();
    }
});

socket.on("escritor_reemplazado", (payload = {}) => {
    mostrarAvisoEscritoraReemplazada(payload);
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    limpiarAsincroniaVisualEscritora({ resetViewport: true });
    invalidarEstadoAsincronoEscritora();
    modo_seq_actual = 0;
    ultimo_count_seq_escritora = 0;
    tiempo_seq_actual_escritora = 0;
    sincronizarEstadoContadorEscritora(null, "");
    limpiarEntregaInspiracionEscritora();
    actualizarEtiquetasCursorCalentamientoEscritor();
    socket.emit('registrar_escritor', {
        player,
        client_id: obtenerClientIdSesionEscritora()
    });
    socket.emit('pedir_atributos');
    socket.emit('pedir_idioma_actual');
    socket.emit('pedir_calentamiento_estado');
    socket.emit('pedir_estado_regalo_bandera_musas');
    socket.emit('calentamiento_cursor', { visible: false });
});

socket.on('disconnect', () => {
    limpiarEntregaInspiracionEscritora();
    limpiarAsincroniaVisualEscritora({ resetViewport: true });
    invalidarEstadoAsincronoEscritora();
});

socket.on('connect_error', () => {
    limpiarEntregaInspiracionEscritora();
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

function restaurarTextoEscritoraDesdeServidor(data = {}) {
    const payload = (data && typeof data === "object") ? data : { text: String(data || "") };
    const htmlRemoto = typeof payload.text === "string" ? payload.text : "";
    const guardadoRemoto = typeof payload.texto_guardado === "string" ? payload.texto_guardado : "";
    const hayTextoRemoto = htmlRemoto.trim().length > 0 || guardadoRemoto.trim().length > 0;
    if (!hayTextoRemoto) {
        return false;
    }
    if (htmlRemoto.trim().length > 0) {
        texto.innerHTML = htmlRemoto;
    } else {
        texto.innerHTML = escapeHtml(guardadoRemoto).replace(/\n/g, "<br>");
    }
    texto_guardado = normalizarSaltosTextoGuardado(
        guardadoRemoto || obtenerTextoPlanoConSaltos(texto)
    );
    texto_restaurado_desde_servidor = true;
    texto_html_restaurado_desde_servidor = texto.innerHTML;
    if (typeof payload.points !== "undefined" && puntos) {
        puntos.innerHTML = payload.points;
    } else if (typeof countChars === "function") {
        countChars(texto);
    }
    if (typeof payload.level !== "undefined" && nivel) {
        nivel.innerHTML = payload.level;
    }
    texto.scrollTop = texto.scrollHeight;
    requestAnimationFrame(() => {
        colocarCursorAlFinalEditor();
    });
    return true;
}

socket.on(texto_x, (data) => {
    restaurarTextoEscritoraDesdeServidor(data);
});

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
function calcularFontSizeCountdownEscritora(textoCountdown, objetivoVw) {
    const caracteres = Math.max(1, Array.from(String(textoCountdown || "").trim()).length);
    const limitePorAncho = 88 / (caracteres * 0.7);
    const valor = Math.min(Number(objetivoVw) || 10, limitePorAncho);
    return Math.max(4, Math.min(valor, 40)).toFixed(2) + "vw";
}

function crearCountdownEscritora(textoCountdown) {
    $('#countdown').remove();
    return $('<span id="countdown"></span>')
        .text(textoCountdown)
        .appendTo($('body'));
}

function aplicarEstiloCountdownEscritora(expandido = false) {
    const countdown = $('#countdown');
    const textoCountdown = countdown.text() || "";
    const esNumero = /^\d+$/.test(String(textoCountdown).trim());
    countdown.css({
        'font-size': calcularFontSizeCountdownEscritora(textoCountdown, expandido ? (esNumero ? 40 : 14) : 10),
        'opacity': expandido ? 0 : 1,
        'max-width': '92vw',
        'white-space': 'nowrap',
        'line-height': 1,
        'text-align': 'center',
        'overflow': 'visible'
    });
}

function programarPasoCountdownEscritora(paso, revisionIntro) {
    if (!esRevisionIntroEscritoraActiva(revisionIntro)) {
        return;
    }
    const pasoActual = Number(paso);
    const textoPaso = pasoActual === 0 ? tJuego2P("countdown.write", {}, "\u00a1ESCRIBE!") : pasoActual;
    crearCountdownEscritora(textoPaso);
    if (pasoActual === 3) {
        revelarEtapaIntroPartidaEscritora(2);
    } else if (pasoActual === 2) {
        revelarEtapaIntroPartidaEscritora(3);
    }

    clearTimeout(sub_timer);
    sub_timer = setTimeout(() => {
        sub_timer = null;
        if (!esRevisionIntroEscritoraActiva(revisionIntro)) {
            return;
        }
        aplicarEstiloCountdownEscritora(true);
    }, 20);

    if (pasoActual <= 0) {
        clearTimeout(listener_cuenta_atras);
        listener_cuenta_atras = setTimeout(() => {
            listener_cuenta_atras = null;
            if (!esRevisionIntroEscritoraActiva(revisionIntro)) {
                return;
            }
            clearTimeout(fallback_cuenta_atras_timer);
            fallback_cuenta_atras_timer = null;
            $('#countdown').remove();
            finalizarSecuenciaIntroPartidaEscritora();
        }, 1000);
        return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        programarPasoCountdownEscritora(pasoActual - 1, revisionIntro);
    }, 1000);
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
    const revisionIntro = invalidarIntroEscritora();
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
    const parametrosInicio = data && data.parametros ? data.parametros : {};
    const tiempoModificadorBase = Number(parametrosInicio.TIEMPO_MODIFICADOR);
    if (typeof recalcularBonosAtributosEscritora === "function") {
        recalcularBonosAtributosEscritora({ tiempoModificadorBase });
    } else {
        const atributosInicio = (atributos && typeof atributos === "object") ? atributos : { fuerza: 0, agilidad: 0, destreza: 0 };
        TIEMPO_MODIFICADOR = parametrosInicio.TIEMPO_MODIFICADOR + ajustarDestreza(parametrosInicio.TIEMPO_MODIFICADOR, atributosInicio['destreza']);
        ajustarRapidez(rapidez_borrado, rapidez_inicio_borrado, atributosInicio['agilidad'])
        secs_palabras = ajustarFuerza(SECS_BASE, atributosInicio['fuerza'])
    }
    actualizarDuracionNivelDesdeParametrosEscritora(data && data.parametros ? data.parametros : {});
    console.log(atributos);
    desactivar_borrar = false;
    texto.style.height = "";

    logo.style.display = "none"; 
    neon.style.display = "none"; 
    texto.contentEditable= "false";
    setTextoTiempoVidaEscritora("");
    tiempo.style.display = "";
    setProgresoNivelBarraEscritora(0);
    iniciarSecuenciaIntroPartidaEscritora();

    // Se muestra "Â¿PREPARADOS?" antes de comenzar la cuenta atrÃ¡s.
    crearCountdownEscritora(tJuego2P("countdown.ready", {}, "\u00bfPREPARADOS?"));
    preparados_timer = setTimeout(() => {
        preparados_timer = null;
        aplicarEstiloCountdownEscritora(false);
        revelarEtapaIntroPartidaEscritora(1);
    }, 20);

    listener_cuenta_atras = setTimeout(() => {
        listener_cuenta_atras = null;
        programarPasoCountdownEscritora(3, revisionIntro);
    }, 1000);

    // Failsafe: evita que el contador se quede bloqueado en pantalla.
    fallback_cuenta_atras_timer = setTimeout(() => {
        if (!esRevisionIntroEscritoraActiva(revisionIntro)) {
            return;
        }
        limpiarCountdownInicioEscritora();
        finalizarSecuenciaIntroPartidaEscritora();
    }, 12000);
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

function asegurarVistaPartidaActivaEscritora() {
    const logoEl = document.getElementById("logo");
    const neonEl = document.getElementById("neon");
    const atributosEl = document.getElementById("atributos-container");
    const totalEl = document.getElementById("total");
    const btnInicioEl = document.getElementById("btnInicio");
    if (logoEl) logoEl.style.display = "none";
    if (neonEl) neonEl.style.display = "none";
    if (atributosEl) atributosEl.style.display = "none";
    if (totalEl) totalEl.style.display = "none";
    if (btnInicioEl) btnInicioEl.style.display = "none";
    if (contenedor) contenedor.style.display = "flex";
    if (document.body) {
        document.body.classList.add("partida-activa");
    }
    actualizarOcultacionMarcadorEscritora();
}

function post_inicio(borrar_texto){
    limpiarCountdownInicioEscritora();
    setIndicadorGanadoraEscritora(false);
    if (typeof obtenerSegundosPalabrasEscritora === "function") {
        obtenerSegundosPalabrasEscritora();
    }
    asegurarVistaPartidaActivaEscritora();
    if (borrar_texto === false) {
        const restauradoDesdeServidor = texto_restaurado_desde_servidor;
        if (!String(texto_guardado || "").trim() && texto) {
            const textoActual = normalizarSaltosTextoGuardado(obtenerTextoPlanoConSaltos(texto));
            if (String(textoActual || "").trim()) {
                texto_guardado = textoActual;
            }
        }
        if (restauradoDesdeServidor && texto_html_restaurado_desde_servidor) {
            texto.innerHTML = texto_html_restaurado_desde_servidor;
        } else {
            restaurarTextoGuardadoEnEditor();
        }
        texto_restaurado_desde_servidor = false;
        texto_html_restaurado_desde_servidor = "";

        if (!restauradoDesdeServidor) {
            sendText();
        }

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
    const esReactivacionModoPausado = es_pausa === true && modoSiguiente === modo_actual;
    const saleDePausaHaciaModoEscribible = es_pausa === true && modoSiguiente !== "tertulia";
    animacion_modo();
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");
    setProgresoNivelBarraEscritora(0);
    palabra.innerHTML = "";
    if (explicacion) {
        explicacion.innerHTML = "";
    }
    if (!esReactivacionModoPausado) {
        invalidarEstadoAsincronoEscritora();
        limpiarEntregaInspiracionEscritora();
    }
    LIMPIEZAS[modo_actual](data);
    if (!esReactivacionModoPausado) {
        rapidez_borrado -= 100;
        rapidez_inicio_borrado -= 100;
    }
    modo_actual = modoSiguiente;
    actualizarDuracionNivelDesdeParametrosEscritora(data || {});
    if(terminado == false){
    MODOS[modo_actual](data, socket);
    }
    if (saleDePausaHaciaModoEscribible) {
        es_pausa = false;
        reanudar();
    }
    if (modo_actual && modo_actual !== "tertulia") {
        es_pausa = false;
        menu_modificador = true;
        desactivar_borrar = false;
        texto.contentEditable = "true";
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

socket.on("temp_modos", (data = {}) => {
    if (!aceptarEventoModoEscritora(data)) {
        return;
    }
    sincronizarProgresoNivelBarraEscritora(data);
});

socket.on(enviar_palabra, data => {
    if(modo_actual == "palabras bonus"){
        recibir_palabra(data);
    }
});

socket.on('pausar_js', data => {
    es_pausa = true;
    LIMPIEZAS[modo_actual](data);
    tiempo_restante = TIEMPO_MODIFICADOR - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
    actualizarUiDescartarInspiracionEscritora();
});

socket.on('fin', data => {
    const payload = (data && typeof data === "object") ? data : { player: data };
    const jugadorFin = Number(payload && payload.player);
    if (payload.partida_finalizada !== true || Number(player) !== jugadorFin) {
        return;
    }
    partida_global_finalizada = true;
    final();
});

socket.on('reanudar_js', data => {
    if (modo_actual === "tertulia") {
        es_pausa = false;
        reanudarDesventajaActivaEscritora();
        return;
    }
    es_pausa = false;
    reanudar();
});

let inspiracionLetraMusaActual = null;

function esPayloadLimpiezaInspiracion(data) {
    return Boolean(data && typeof data === "object" && (
        data.limpiar_inspiracion ||
        data.inspiracion_caducada ||
        data.limpiar
    ));
}

function limpiarInspiracionLetraMusa(data = {}) {
    if (modo_actual !== "letra bendita" && modo_actual !== "letra prohibida") {
        return;
    }
    const palabraAnterior = typeof data.palabra_anterior === "string"
        ? data.palabra_anterior.trim()
        : "";
    if (
        palabraAnterior &&
        inspiracionLetraMusaActual &&
        inspiracionLetraMusaActual.palabra &&
        palabraAnterior !== inspiracionLetraMusaActual.palabra
    ) {
        return;
    }
    palabra_actual = [];
    inspiracionLetraMusaActual = null;
    limpiarEntregaInspiracionEscritora();
    asignada = false;
    limpiarDeteccionMultipalabraAsignada();
    texto.removeEventListener("keyup", listener_modo1);
    definicion.innerHTML = "";
    aplicarMarqueeSiOverflowEscritora(definicion);
    establecerContextoMusaDefinicion("");
}

socket.on(inspirar, data => {
    const palabra = typeof data === "string" ? data : data?.palabra;
    const firmaMusa = normalizarFirmaMusaEscritora(data);
    if (esPayloadLimpiezaInspiracion(data) || !palabra) {
        limpiarInspiracionLetraMusa(data);
        return;
    }
    if (palabra != "") {
        if (!registrarEntregaInspiracionEscritora(data, { esMusa: true })) return;
        inspiracionLetraMusaActual = {
            palabra,
            caduca_en_ts: Number(data && typeof data === "object" ? data.caduca_en_ts : 0) || 0
        };
        palabra_actual = [palabra];
        definicion.innerHTML = `${construirFirmaMusaHtmlEscritora(data)}<span class="inspiration-guidance">Podr&iacute;as escribir la palabra &laquo;<span class="inspiration-guidance__word">${escapeHtml(palabra)}</span>&raquo;</span>`;
        aplicarMarqueeSiOverflowEscritora(definicion);
        establecerContextoMusaDefinicion("musa", firmaMusa.completo);
        animateCSS(".definicion", "flash");
        prepararDeteccionMultipalabraAsignada();
        asignada = true;
        actualizarUiDescartarInspiracionEscritora();
        texto.removeEventListener("keyup", listener_modo1);
        listener_modo1 = function (e) { palabras_musas(e) };
        texto.addEventListener("keyup", listener_modo1);
    }
});

socket.on(enviar_ventaja, ventaja => {
    console.log(ventaja);
    aplicarDesventajaEscritora(ventaja, { mostrarFeedback: true });
});

socket.on("desventaja_activa_estado", payload => {
    aplicarDesventajaEscritora(payload, {
        mostrarFeedback: false,
        restaurando: true
    });
});

socket.on("desventaja_ronda_limpiar", () => {
    limpiarDesventajasActivasEscritora();
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
        letra_prohibida = normalizarLetraNivelEscritora(letra);

        texto.removeEventListener("beforeinput", listener_modo, true);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        animacion_palabra();
        setBarraNivelClaseEscritora("prohibida");
        if (explicacion) {
            explicacion.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        }
        palabra.innerHTML = traducirTituloModoEscritora("letra prohibida", "NIVEL LETRA MALDITA");
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = normalizarLetraNivelEscritora(letra);
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


function recibir_palabra(data) {
    data = (data && typeof data === "object") ? data : {};
    if (!aceptarEventoModoEscritora(data, { actualizar: false })) {
        return;
    }
    if (!registrarEntregaInspiracionEscritora(data)) return;
    animacion_modo();
    setBarraNivelClaseEscritora("bonus");
    const textoPalabra = extraerTextoPalabraEventoEscritora(data);
    palabra_actual = Array.isArray(data && data.palabra_bonus)
        ? data.palabra_bonus[0]
        : (textoPalabra ? [textoPalabra] : "");
    const tiempoAsignado = resolverTiempoPalabraAsignadaEscritora(data);
    const superbonus = normalizarSuperbonusInspiracionEscritora(data);
    palabra.innerHTML = traducirTituloModoEscritora("palabras bonus", "NIVEL PALABRAS BENDITAS");
    if (data.origen_musa === "musa") {
        const descripcion = superbonus.activo
            ? `SUPERBONUS x${superbonus.repeticiones} · Podr\u00edas escribir esta palabra`
            : "Podr\u00edas escribir esta palabra";
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "bonus",
            tiempoSegundos: tiempoAsignado,
            descripcion,
            superbonus: data.superbonus,
            autoria: data
        });
        establecerContextoMusaDefinicion("musa", normalizarFirmaMusaEscritora(data).completo);
    } else {
        const descripcionBase = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[1] : data && data.definicion;
        const descripcion = normalizarTextoPlanoEscritora(descripcionBase);
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "bonus",
            tiempoSegundos: tiempoAsignado,
            descripcion,
            superbonus: data.superbonus
        });
        establecerContextoMusaDefinicion("");
    }

    tiempo_palabras_bonus = tiempoAsignado;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    prepararDeteccionMultipalabraAsignada();
    asignada = true;
    actualizarUiDescartarInspiracionEscritora();
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto.addEventListener("keyup", listener_modo);
    if (!es_pausa && modo_actual !== "tertulia") {
        menu_modificador = true;
        desactivar_borrar = false;
        texto.contentEditable = "true";
    }
}

function recibir_palabra_prohibida(data) {
    data = (data && typeof data === "object") ? data : {};
    if (!aceptarEventoModoEscritora(data, { actualizar: false })) {
        return;
    }
    if (!registrarEntregaInspiracionEscritora(data)) return;
    animacion_modo();
    setBarraNivelClaseEscritora("prohibidas");
    const textoPalabra = extraerTextoPalabraEventoEscritora(data);
    palabra_actual = Array.isArray(data && data.palabra_bonus)
        ? data.palabra_bonus[0]
        : (textoPalabra ? [textoPalabra] : "");
    const tiempoAsignado = resolverTiempoPalabraAsignadaEscritora(data);
    palabra.innerHTML = traducirTituloModoEscritora("palabras prohibidas", "NIVEL PALABRAS MALDITAS");

    if (data.origen_musa === "musa_enemiga") {
        const descripcion = "Me pega esta palabra";
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "prohibidas",
            tiempoSegundos: tiempoAsignado,
            descripcion,
            autoria: data
        });
        establecerContextoMusaDefinicion("musa_enemiga", normalizarFirmaMusaEscritora(data).completo);
    } else {
        const descripcionBase = Array.isArray(data && data.palabra_bonus) ? data.palabra_bonus[1] : data && data.definicion;
        const descripcion = normalizarTextoPlanoEscritora(descripcionBase);
        renderObjetivoNivelEscritora(textoPalabra, {
            tipo: "prohibidas",
            tiempoSegundos: tiempoAsignado,
            descripcion
        });
        establecerContextoMusaDefinicion("");
    }
    tiempo_palabras_bonus = tiempoAsignado;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    prepararDeteccionMultipalabraAsignada();
    asignada = true;
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
    texto.addEventListener("keyup", listener_modo);
    if (!es_pausa && modo_actual !== "tertulia") {
        menu_modificador = true;
        desactivar_borrar = false;
        texto.contentEditable = "true";
    }
}

// FUNCIONES AUXILIARES.

      const btnInicio = document.getElementById('btnInicio');

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
if (btnInicio) {
    btnInicio.addEventListener('click', (evento) => {
        evento.stopPropagation();
        inicioJuego();
    });
}

// FunciÃ³n para enviar texto al otro jugador y a control
function refrescarUiIdiomaEscritora() {
    const textoGanadorPrevio = TEXTO_GANADOR_ESCRITORA;
    const textoPerdidaPrevio = TEXTO_PERDISTE_SIN_PALABRAS;
    TEXTO_GANADOR_ESCRITORA = tJuego2P("game.finished", {}, "\u00a1TEXTO TERMINADO!");
    TEXTO_PERDISTE_SIN_PALABRAS = tJuego2P("game.no_words_lost", {}, "\u00a1PERDISTE, NO ESCRIBISTE NADA!");

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
    actualizarUiDescartarInspiracionEscritora();

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
        const esCaracterPalabra = (ch) => /[A-Za-z0-9\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1]/.test(ch || "");
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
            const color = color_positivo;
            const tipo = (definicion.dataset.origenMusa === "musa") ? "inspiracion" : "rae";

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
            emitirAprovecharInspiracionEscritora("nueva_palabra", {
                alConfirmar(metaConfirmada, _respuesta, resultadoAck) {
                    if (meta_inspiracion_activa_escritora?.inspiracion_id === metaConfirmada.inspiracion_id) {
                        limpiarDeteccionMultipalabraAsignada();
                    }
                    const segundosBonus = Math.abs(resultadoAck.tiempo_otorgado);
                    tiempo_palabras_bonus = segundosBonus;
                    const tiempo_feed = formatearTiempoPalabraAsignadaEscritora(segundosBonus, { modo: "palabras bonus" });
                    const payloadFeedback = construirPayloadFeedbackInspiracion({
                        color,
                        tiempo_feed,
                        tipo,
                        valor_inspiracion: resultadoAck.valor_inspiracion,
                        tiempo_otorgado: resultadoAck.tiempo_otorgado,
                        inspiracion_id: metaConfirmada.inspiracion_id,
                        ...(tipo === "inspiracion" ? {
                            feedback_extra: {
                                tiempo_feed: "+ \u26A1",
                                tipo: "inspiracion",
                                color: "#79ffe1",
                                claseExtra: "feedback-tiempo-float--musa-inspiracion"
                            }
                        } : {})
                    });
                    if (tipo === "inspiracion" && typeof mostrarFeedbackInspiracionConTiempoEscritora === "function") {
                        mostrarFeedbackInspiracionConTiempoEscritora(tiempo_feed, { color });
                    } else if (tiempo_feed) {
                        mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo });
                    }
                    socket.emit(feedback_de_j_x, payloadFeedback);
                    if (tipo === "inspiracion") {
                        activarFulgorInspiracionEscritora();
                        socket.emit("feedback_musa_inspiracion", { ...payloadFeedback, player });
                    }
                    marcarPalabraBenditaActual(
                        inicioMarca,
                        finMarca,
                        esMusa,
                        resultadoAck.valor_inspiracion
                    );
                    countChars(texto);
                    sendText();
                    limpiarObjetivoInspiracionDescartadoEscritora(metaConfirmada.inspiracion_id);
                    actualizarUiDescartarInspiracionEscritora();
                },
                alRechazar() {
                    anunciarEstadoDescartarInspiracionEscritora(
                        tJuego2P("writer.inspiration.use_error", {}, "La inspiracion ya no estaba disponible."),
                        2600
                    );
                }
            });
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
            texto.focus();
            const color = color_negativo;
            const tipo = (definicion.dataset.origenMusa === "musa_enemiga") ? "inspiracion" : "lista_prohibidas";
            emitirAprovecharInspiracionEscritora("nueva_palabra_prohibida", {
                alConfirmar(metaConfirmada, _respuesta, resultadoAck) {
                    if (meta_inspiracion_activa_escritora?.inspiracion_id === metaConfirmada.inspiracion_id) {
                        limpiarDeteccionMultipalabraAsignada();
                    }
                    socket.emit("intento_prohibido", { player, tipo: "palabra", valor: palabraReportada });
                    const segundosBase = Math.abs(resultadoAck.tiempo_otorgado);
                    const deltaTiempo = resultadoAck.tiempo_otorgado > 0
                        ? -segundosBase
                        : resultadoAck.tiempo_otorgado;
                    tiempo_palabras_bonus = segundosBase;
                    if (deltaTiempo !== 0) {
                        emitirCambioTiempoEscritora(deltaTiempo);
                    }
                    const tiempo_feed = formatearTiempoPalabraAsignadaEscritora(segundosBase, { modo: "palabras prohibidas" });
                    const payloadFeedback = construirPayloadFeedbackInspiracion({
                        color,
                        tiempo_feed,
                        tipo,
                        valor_inspiracion: resultadoAck.valor_inspiracion,
                        tiempo_otorgado: resultadoAck.tiempo_otorgado,
                        inspiracion_id: metaConfirmada.inspiracion_id
                    });
                    if (tiempo_feed) {
                        mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo });
                    }
                    socket.emit(feedback_de_j_x, payloadFeedback);
                    if (tipo === "inspiracion") {
                        activarFulgorInspiracionEscritora();
                        socket.emit("feedback_musa_inspiracion", { ...payloadFeedback, player });
                    }
                    limpiarObjetivoInspiracionDescartadoEscritora(metaConfirmada.inspiracion_id);
                    actualizarUiDescartarInspiracionEscritora();
                },
                alRechazar() {
                    anunciarEstadoDescartarInspiracionEscritora(
                        tJuego2P("writer.inspiration.use_error", {}, "La inspiracion ya no estaba disponible."),
                        2600
                    );
                }
            });
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
            texto.focus();
            const tiempo_feed = "+ \u26A1";
            const color = "white";

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
            emitirAprovecharInspiracionEscritora("nueva_palabra_musa", {
                alConfirmar(metaConfirmada, _respuesta, resultadoAck) {
                    if (meta_inspiracion_activa_escritora?.inspiracion_id === metaConfirmada.inspiracion_id) {
                        limpiarDeteccionMultipalabraAsignada();
                    }
                    const payloadFeedback = construirPayloadFeedbackInspiracion({
                        color,
                        tiempo_feed,
                        tipo: "inspiracion",
                        valor_inspiracion: resultadoAck.valor_inspiracion,
                        tiempo_otorgado: resultadoAck.tiempo_otorgado,
                        inspiracion_id: metaConfirmada.inspiracion_id
                    });
                    mostrarFeedbackFlotanteEscritora(tiempo_feed, { color, tipo: "inspiracion" });
                    socket.emit(feedback_de_j_x, payloadFeedback);
                    socket.emit("feedback_musa_inspiracion", { ...payloadFeedback, player });
                    activarFulgorInspiracionEscritora();
                    if (marcarPalabraMusaActual(
                        inicioMarca,
                        finMarca,
                        resultadoAck.valor_inspiracion
                    )) {
                        countChars(texto);
                        sendText();
                    }
                    limpiarObjetivoInspiracionDescartadoEscritora(metaConfirmada.inspiracion_id);
                    actualizarUiDescartarInspiracionEscritora();
                },
                alRechazar() {
                    anunciarEstadoDescartarInspiracionEscritora(
                        tJuego2P("writer.inspiration.use_error", {}, "La inspiracion ya no estaba disponible."),
                        2600
                    );
                }
            });
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
      const tiempo_feed = "-1 \u26A1";
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

    if (debeBloquearBorradoPorDestreza() && e.key === 'Backspace') {
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
            const tiempo_feed = "-0.1 \u26A1";
            mostrarFeedbackFlotanteEscritora(tiempo_feed, { color: color_negativo, tipo: "letra_bendita" });
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed, tipo: "letra_bendita" });
        }
        return; // Salir de la funciÃ³n si la tecla es Backspace
    }

    if (letra.length === 1) {
        if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
            (letra_bendita === "\u00f1" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
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
            const tiempo_feed = "+ \u26A1";
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
        const tiempo_feed = "-1 \u26A1";
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

    if (debeBloquearBorradoPorDestreza() && e.inputType === 'deleteContentBackward') {
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
            const tiempo_feed = "-0.1 \u26A1";
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

        const tiempo_feed = "+ \u26A1";
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
    limpiarEntregaInspiracionEscritora();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    setInterfazInversaGlobal(false);
    pararEscritura = true;
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
    limpiarEntregaInspiracionEscritora();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    setInterfazInversaGlobal(false);
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

    pausarDesventajaActivaEscritora();
    if (typeof invalidarBorradoEscritora === "function") {
        invalidarBorradoEscritora();
    }
    desactivar_borrar = true;
    actualizarUiDescartarInspiracionEscritora();
}

function reanudar(){

    menu_modificador = true;
    texto.contentEditable = "true";

    desactivar_borrar = false;
    actualizarUiDescartarInspiracionEscritora();
    reanudarDesventajaActivaEscritora();
    
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
      .map((palabra, indice) => {
        const intensidad = Math.max(0.6, Math.min(1, Number(intensidad_desventaja_escritora) || 1));
        const invertir = (indice % 10) < Math.round(intensidad * 10);
        return invertir ? palabra.split('').reverse().join('') : palabra;
      })
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
  text: "\u2B50",
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
