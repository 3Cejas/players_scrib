function modo_palabras_bonus(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(e.target);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            let endingIndex = preCaretRange.toString().length;
            let startingIndex = 0; // Inicializacion
            const textContent = e.target.textContent || "";
            const esCaracterPalabra = (ch) => /[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]/.test(ch || "");
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

            console.log("Texto seleccionado:", textContent.substring(startingIndex, endingIndex)); // Debugging
            console.log("palabra_actual:", palabra_actual); // Debugging
            console.log("Indices:", startingIndex, endingIndex); // Debugging


        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            texto.focus();
            asignada = false;
            recibir_palabra(invalidarSolicitudesPalabraBonus1P())
            addSeconds(tiempo_palabras_bonus)
            mostrarFeedbackFlotanteEscritora(formatearTiempoSegundosI18n1P(tiempo_palabras_bonus, { signo: "+" }), {
                color: color_positivo,
                tipo: "ganar_tiempo"
            });
            const palabraObjetivo = Array.isArray(palabra_actual)
                ? palabra_actual[0]
                : palabra_actual;
            const palabraLower = (palabraObjetivo || "").toLowerCase();
            const tokenLower = textContent
                .slice(startingIndex, endingIndex)
                .toLowerCase();
            let indiceMatch = -1;
            if (palabraLower) {
                indiceMatch = tokenLower.lastIndexOf(palabraLower);
            }
            const inicioMarca = indiceMatch >= 0
                ? startingIndex + indiceMatch
                : startingIndex;
            const finMarca = indiceMatch >= 0
                ? inicioMarca + palabraLower.length
                : endingIndex;
            marcarPalabraBenditaRango(inicioMarca, finMarca);
        }
    }
}


// Función que intercepta el uso de palabras malditas y aplica penalización.
function modo_palabras_prohibidas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
        let range = selection.getRangeAt(0);
        let preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        let endingIndex = preCaretRange.toString().length;
        let startingIndex = 0; // Inicialización
        let textContent = e.target.innerText;

        // Calcula startingIndex: retrocede hasta encontrar un delimitador o el inicio del texto
        for (let i = endingIndex - 1; i >= 0; i--) {
            if (textContent[i] === ' ' || textContent[i] === '\n' || i === 0) {
                startingIndex = (i === 0 && (textContent[i] !== ' ' && textContent[i] !== '\n')) ? i : i + 1;
                break;
            }
        }

        // Ajusta endingIndex: avanza hasta encontrar un delimitador o el final del texto
        for (let i = endingIndex; i <= textContent.length; i++) {
            if (textContent[i] === ' ' || textContent[i] === '\n' || i === textContent.length) {
                endingIndex = i;
                break;
            }
        }

        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            texto.focus();
            asignada = false;
            const palabraDetectada = (palabra_actual && palabra_actual.length && palabra_actual[0])
                ? palabra_actual[0]
                : textContent.substring(startingIndex, endingIndex);
            registrarIntentoPalabraProhibida(palabraDetectada);
            nueva_palabra_prohibida();
            const tiempo_penal = -Math.abs(tiempo_palabras_bonus);
            addSeconds(tiempo_penal);
            mostrarFeedbackFlotanteEscritora(formatearTiempoSegundosI18n1P(tiempo_penal), {
                color: color_negativo,
                tipo: "perder_tiempo"
            });
        }
    }
}

/**
 * Función que intercepta la inserción de la "letra prohibida".
 * Si se detecta dicha letra, se elimina inmediatamente del contenido.
 *
 * Se asume que:
 * - toNormalForm(letra) normaliza la letra (por ejemplo, quita acentos).
 * - letra_prohibida es la letra prohibida (en minúscula).
 * - addSeconds(valor), puntos, puntos_, feedback, color_negativo, delay_animacion
 *   y animateCSS(selector, animacion) forman parte de la lógica para actualizar la UI y dar feedback.
 */
/**
 * Función que intercepta la inserción de la "letra prohibida" en un div contenteditable.
 * Si se detecta la inserción de dicha letra, se elimina inmediatamente.
 *
 * Se asume que:
 * - toNormalForm(letra) normaliza la letra (por ejemplo, quita acentos).
 * - letra_prohibida es la letra prohibida (en minúscula).
 * - addSeconds(valor), puntos, puntos_, feedback, color_negativo, delay_animacion
 *   y animateCSS(selector, animacion) forman parte de la lógica para actualizar la UI y dar feedback.
 */
function modo_letra_prohibida(e) {
  // Solo procesamos inserciones de texto
  if (e.inputType === "insertText") {
    // Capturamos la letra insertada; en la mayoría de navegadores e.data está definida.
    let letra = e.data;
    // Fallback para Safari: si e.data no está disponible, obtenemos la letra desde el nodo de texto
    if (!letra) {
      let sel = window.getSelection();
      if (sel.rangeCount > 0) {
        let node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE && sel.focusOffset > 0) {
          letra = node.textContent.charAt(sel.focusOffset - 1);
        }
      }
    }
    
    // Si la letra (normalizada) coincide con la letra prohibida, procedemos
      if (
      letra &&
      (
        (toNormalForm(letra) === letra_prohibida || toNormalForm(letra) === letra_prohibida.toUpperCase()) &&
        !(letra_prohibida.toLowerCase() === 'n' && (letra === 'ñ' || letra === 'Ñ'))
      )
    ) {
      // Usamos setTimeout para esperar a que el DOM se actualice con la inserción
      setTimeout(() => {
        let sel = window.getSelection();
        if (sel.rangeCount > 0) {
          let range = sel.getRangeAt(0);
          if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
            let node = range.startContainer;
            // Guardamos el offset original antes de modificar el contenido
            let originalOffset = range.startOffset;
            let textoActual = node.textContent;
            // Verificamos que el carácter justo antes del cursor sea la letra insertada
            if (textoActual.charAt(originalOffset - 1) === letra) {
              // Eliminamos el carácter prohibido del contenido
              let nuevoTexto = textoActual.substring(0, originalOffset - 1) + textoActual.substring(originalOffset);
              node.textContent = nuevoTexto;
              // Calculamos el nuevo offset, asegurándonos de que esté dentro de los límites
              let newOffset = originalOffset - 1;
              if (newOffset < 0) newOffset = 0;
              if (newOffset > node.textContent.length) newOffset = node.textContent.length;
              // Intentamos establecer el inicio del rango; en caso de error, lo ubicamos al final del nodo
              try {
                range.setStart(node, newOffset);
              } catch (err) {
                console.error("Error setting range start: ", err);
                range.setStart(node, node.textContent.length);
              }
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        }
      }, 0);
      
      // Actualiza la UI: penaliza (descuenta tiempo, actualiza puntos, muestra feedback)
      registrarIntentoLetraProhibida(letra_prohibida);
      addSeconds(-2);
      actualizarPuntosMarcador(puntos_);
      mostrarFeedbackFlotanteEscritora(formatearTiempoSegundosI18n1P(2, { signo: "-" }), {
        color: color_negativo,
        tipo: "letra_prohibida"
      });
    }
  }
}



function modo_frase_final(e) {

    actualizarProgresoFraseFinal();
    // Obtenemos el texto completo del elemento
    let textContent = e.target.innerText;
    // Convertimos a minúsculas y recortamos espacios (opcional pero recomendable):
    let textLower = textContent.trim().toLowerCase();
  
    // Definimos la frase final, también en minúscula y sin espacios sobrantes
    let fraseFinal = str_frase_final.trim().toLowerCase();
  
    // Revisamos si el texto termina exactamente con esa frase final:
    if (textLower.endsWith(fraseFinal)) {
      // Aquí va tu lógica de finalización
      e.target.innerText = textContent.trim() + ".";
      final();
    }
  }
  

function palabras_musas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(e.target);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            let endingIndex = preCaretRange.toString().length;
            let startingIndex = 0; // Inicialización
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
            console.log("Índices:", startingIndex, endingIndex); // Debugging

        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {

            definicion.innerHTML = "";
            texto.focus();
            asignada = false;
            mostrarFeedbackFlotanteEscritora("+insp.", {
                color: "white",
                tipo: "inspiracion"
            });
        }
    }
}
  
// Esta función se llama cuando se produce un input (antes de que se modifique el contenido)
// y se utiliza para procesar tanto inserciones como borrados.
function modo_letra_bendita(e) {
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }
    let sel = window.getSelection();
    if (!sel.rangeCount) return;
    let node = sel.anchorNode;
    if (e.inputType && e.inputType.startsWith("delete")) {
        const nodoProtegido = obtenerNodoProtegidoAfectadoPorEdicion(e);
        if (nodoProtegido && nodoProtegido.classList.contains(CLASE_LETRA_BENDITA_LOCAL)) {
            e.preventDefault();
            addSeconds(-1);
            mostrarFeedbackFlotanteEscritora(formatearTiempoSegundosI18n1P(1, { signo: "-" }), {
                color: color_negativo,
                tipo: "letra_bendita"
            });
        }
        return;
    }
    if (e.inputType === "insertText") {
        let letra = obtenerCaracterEntradaEvento(e);
        if (letra && letra.length === 1) {
            if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
                (letra_bendita === "\u00f1" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
                e.preventDefault();
                console.log('Se procesa letra bendita');
                insertarSpanProtegidoEnCaret(letra, CLASE_LETRA_BENDITA_LOCAL);
                texto.dispatchEvent(new Event("input", { bubbles: true }));
                actualizarPuntosMarcador(puntos_);
                console.log(puntos);
                addSeconds(+2);
                mostrarFeedbackFlotanteEscritora(formatearTiempoSegundosI18n1P(2, { signo: "+" }), {
                    color: color_positivo,
                    tipo: "letra_bendita"
                });
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
    }
}
function nueva_letra_bendita(){
    const selector = typeof elegir_letra_nivel_ponderada === "function"
        ? elegir_letra_nivel_ponderada
        : (restantes, base) => {
            const lista = Array.isArray(restantes) && restantes.length > 0 ? [...restantes] : [...base];
            const indice = Math.floor(Math.random() * lista.length);
            const letra = lista[indice];
            lista.splice(indice, 1);
            return { letra, pendientes: lista.length === 0 ? [...base] : lista };
        };
    const seleccion = selector(
        letras_benditas_restantes,
        typeof letras_benditas_ponderadas !== "undefined" ? letras_benditas_ponderadas : letras_benditas,
        "bendita"
    );
    letra_bendita = seleccion.letra;
    letras_benditas_restantes = seleccion.pendientes;
    if (letra_bendita) {
        resumenPartida.letrasBenditas.add(String(letra_bendita).toUpperCase());
    }
    console.log("LETRA BENDITA", letra_bendita)
    nueva_letra(letra_bendita)
    listener_cambio_letra_palabra = setTimeout(nueva_letra_bendita, TIEMPO_CAMBIO_LETRA);
}

function nueva_letra_prohibida(){
    const selector = typeof elegir_letra_nivel_ponderada === "function"
        ? elegir_letra_nivel_ponderada
        : (restantes, base) => {
            const lista = Array.isArray(restantes) && restantes.length > 0 ? [...restantes] : [...base];
            const indice = Math.floor(Math.random() * lista.length);
            const letra = lista[indice];
            lista.splice(indice, 1);
            return { letra, pendientes: lista.length === 0 ? [...base] : lista };
        };
    const seleccion = selector(letras_prohibidas_restantes, letras_prohibidas, "prohibida");
    letra_prohibida = seleccion.letra;
    letras_prohibidas_restantes = seleccion.pendientes;
    if (letra_prohibida) {
        resumenPartida.letrasMalditas.add(String(letra_prohibida).toUpperCase());
    }
    nueva_letra(letra_prohibida)
    listener_cambio_letra_palabra = setTimeout(nueva_letra_prohibida, TIEMPO_CAMBIO_LETRA);
}

function modo_psicodélico() {
    stylize();
}

function obtenerDuracionModoActualSegundos() {
    if (modo_actual === "frase final") {
        const restante = Math.ceil(Number(secondsRemaining));
        if (Number.isFinite(restante) && restante > 0) {
            return restante;
        }
        return 1;
    }
    const duracionBase = Number(TIEMPO_CAMBIO_MODOS) / 1000;
    if (!Number.isFinite(duracionBase) || duracionBase <= 0) {
        return 1;
    }
    return Math.ceil(duracionBase);
}


// Función que inicia el temporizador para una duración determinada
function temp_modos() {
    actualizarDuracionNivelDesdeParametrosEscritora({ TIEMPO_CAMBIO_MODOS });

    modo_anterior = modo_actual;
    modo_actual = modos_restantes[0];
    modos_restantes.splice(0, 1);
    if (!modo_actual) {
        return;
    }
    console.log(modo_actual)
    MODOS[modo_actual]("");
    duracion_modo_actual_segundos = obtenerDuracionModoActualSegundos();

    // Reiniciar la variable de contador
    secondsPassed = 0;
    
    // Crear un intervalo que se ejecute cada segundo (1000 ms)
    escribirEstadoCompartidoGameplay1P("intervaloID_temp_modos", setInterval(() => {
    if (desventajaEnCurso || menu_resurreccion_activo) {
      return;
    }
    secondsPassed++;  // Incrementar el contador cada segundo
    console.log(`Segundos pasados: ${secondsPassed}`);
    console.log(modo_actual)
    console.log(modo_anterior)
    console.log(modos_restantes)
    console.log(secondsPassed >= duracion_modo_actual_segundos)
    console.log(secondsPassed)
    console.log(duracion_modo_actual_segundos)

      // Verificar si se alcanzó la duración deseada y reiniciar
      if (secondsPassed >= duracion_modo_actual_segundos) {
        if(modo_actual == "frase final"){
            setProgresoNivelBarraEscritora(100);
            final()
            fin_del_juego = true;
            limpiarIntervalCompartidoGameplay1P("intervaloID_temp_modos");
            LIMPIEZAS[modo_actual]("");
            modos_restantes = [...LISTA_MODOS];
            modo_anterior = "";
            modo_actual = "";
        }
        else{
        iniciarDesventajaEntreNiveles();
        }
        
        // Si se requiere alguna acción adicional al reiniciar, colócala aquí
      }
    }, 1000));
  }

function limpieza(){
    limpiarEstadoGameOverBarraVida();
    cancelarSecuenciaDesventaja();
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    menu_resurreccion_activo = false;
    duracion_modo_actual_segundos = 0;
    ocultarMenuResurreccion();
    detenerTodoAudioJuego();
    animacionEntradaVidaPendiente = false;
    cancelarAnimacionEntradaBarraVida(tiempo);
    detenerProgresoNivelBarraEscritora(true);
    reiniciarProgresoFraseFinalEscritora();
    limpiarIntervalCompartidoGameplay1P("countInterval");
    limpiarIntervalCompartidoGameplay1P("intervaloID_temp_modos")
    pararEscritura = true;
    clearTimeout(timeoutID_menu)
    stopConfetti();
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    console.log(texto.innerHTML)
    if(temp_text_inverso_activado == true){
        temp_text_inverso_activado = false;
        clearTimeout(tempo_text_inverso);
        procesarTexto();
    }

    texto.innerText = "";
    texto.style.display = "";
    texto.style.height = "";
    if (window.innerWidth <= 800) {
        texto.style.maxHeight = "2em";
    }
    else{
        texto.style.maxHeight = "calc(1.5em * 2)";

    }
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    texto.contentEditable= "false";
    actualizarPuntosMarcador(0, false);
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    texto.focus();

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");

    puntos_palabra = 0;
    puntos_ = 0;
    puntos_letra_prohibida = 0;
    puntos_letra_bendita = 0;

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    locura = false;
    console.log(puntos)
    
    limpiarFeedbackFlotanteEscritora();
    
    definicion.innerHTML = "";
    explicación.innerHTML = "";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    escribirRapidecesGameplay1P(4000, 4000);

    caracteres_seguidos = 0;
    
    for (let key in LIMPIEZAS) { 
        console.log(key)
        LIMPIEZAS[key]();
    }

    limpiarTimeoutCompartidoGameplay1P("borrado");
    limpiarTimeoutCompartidoGameplay1P("cambio_palabra");
    clearTimeout(tempo_text_borroso);
    actualizarBarraVida(tiempo, "");
}

function limpieza_final(){
    inicio_en_progreso_1p = false;
    setAccionesPartidaDesplegadas1P(false);
    limpiarEstadoGameOverBarraVida();
    animarCSSJuego1P(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "";
        btnEscribir.style.display = "";
        btnDescargarTexto.style.display = "" 
        btnFinal.style.display = "none"
        btnPantallaCompleta.style.display = "" 
        animarCSSJuego1P(".botones", "backInLeft")
    });

    clearTimeout(timeoutID_menu);
    timeoutID_menu = null;
    menu_resurreccion_activo = false;
    duracion_modo_actual_segundos = 0;
    ocultarMenuResurreccion();
    cancelarSecuenciaDesventaja();
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    limpiarIntervalCompartidoGameplay1P("countInterval");
    limpiarIntervalCompartidoGameplay1P("intervaloID_temp_modos");
    clearInterval(listener_cambio_letra_palabra)
    animacionEntradaVidaPendiente = false;
    cancelarAnimacionEntradaBarraVida(tiempo);
    limpiarCountdownInicioEscritora();
    limpiarClasesIntroPartidaEscritora();
    detenerProgresoNivelBarraEscritora(true);
    reiniciarProgresoFraseFinalEscritora();
    detenerMusicaModo();
    detenerSfxActivos();
    detenerAudioFinal();
    confetti_aux();
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    texto.contentEditable= "false";
    //texto.style.display = "none";
    tiempo.style.display="none"
    temas.display = "none";
    temas.innerHTML = "";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    limpiarEstiloNivelesEscritora();
    setBarraNivelClaseEscritora("");
    limpiarFeedbackFlotanteEscritora();

    definicion.style.fontSize = "1.5vw";

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.

    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    locura = false;

    tiempo.style.color = "white";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    escribirRapidecesGameplay1P(4000, 4000);

    LIMPIEZAS["psicodélico"]("");

    limpiarTimeoutCompartidoGameplay1P("borrado");
    limpiarTimeoutCompartidoGameplay1P("cambio_palabra");
    //clearTimeout(tempo_text_borroso);
    actualizarBarraVida(tiempo, "");
}

function pausa(){

    menu_modificador = false;
    texto.contentEditable= "false";

    limpiarTimeoutCompartidoGameplay1P("borrado");
    desactivar_borrar = true;
}

function reanudar(){

    menu_modificador = true;
    texto.contentEditable = "true";

    limpiarTimeoutCompartidoGameplay1P("borrado");
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
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_INVERSO);
        desactivar_borrar = true;
        caretNode, caretPos = guardarPosicionCaret();
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            // Obtener el último nodo de texto en text
            lastLine = texto.lastChild;
            lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                caretNode = lastTextNode;
                caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            texto.removeEventListener('animationend', arguments.callee);
        });
        
        procesarTexto();
        
        
        temp_text_inverso_activado = true;
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            desactivar_borrar = false;
            texto.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.contentEditable= "true";
                texto.focus()
                // Obtener el último nodo de texto en text
                lastLine = texto.lastChild;
                lastTextNode = lastLine;
                while (lastTextNode && lastTextNode.nodeType !== 3) {
                    lastTextNode = lastTextNode.lastChild;
                }
                
                // Si encontramos el último nodo de texto, colocamos el cursor allí
                if (lastTextNode) {
                    caretNode = lastTextNode;
                    caretPos = lastTextNode.length;
                    restaurarPosicionCaret(caretNode, caretPos);
                }
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            putada_actual = "";
          
        }, duracionDesventaja);
    }
}

function tiempo_borrado_menos(){
    const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORRADO);
    borrado_cambiado = true;
    antiguo_rapidez_borrado = leerRapidezBorradoGameplay1P();
    antiguo_inicio_borrado = leerRapidezInicioBorradoGameplay1P();
    escribirRapidecesGameplay1P(7000, 7000);
    setTimeout(function () {
        borrado_cambiado = false;
    escribirRapidecesGameplay1P(antiguo_rapidez_borrado, antiguo_inicio_borrado);
    }, duracionDesventaja);
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
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            modo_texto_borroso = 0
            putada_actual = ""
        }, data);   
    }
}



