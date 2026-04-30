function guardarPosicionCaret() {
  let sel = window.getSelection();
  if (sel.rangeCount > 0) {
      let range = sel.getRangeAt(0);
      return {
          caretPos: range.startOffset,
          caretNode: range.startContainer
      };
  }
  return {
      caretPos: 0,
      caretNode: null
  };
}

// FunciÃ³n para restaurar la posiciÃ³n del caret
function restaurarPosicionCaret(caretNode, caretPos) {
  let sel = window.getSelection();
  let range = sel.getRangeAt(0);
  range.setStart(caretNode, Math.min(caretPos, caretNode.length));
  range.setEnd(caretNode, Math.min(caretPos, caretNode.length));
  sel.removeAllRanges();
  sel.addRange(range);
}

function desventajaSeleccionActiva() {
  return typeof desventajaEnCurso !== "undefined" && desventajaEnCurso === true;
}

function borrar() {
  if (desventajaSeleccionActiva()) {
    clearTimeout(borrado);
    return;
  }

  if (modo_actual === "frase final") {
    clearTimeout(borrado);
    return;
  }

  if (!desactivar_borrar) {
    let nodoBorrado = false;

    // 1. Guardar la posiciÃ³n del caret usando la funciÃ³n
    let { caretNode, caretPos } = guardarPosicionCaret();

    // 2. CÃ³digo existente

    if (modo_actual !== "frase final") {
      addSeconds(-1);
      if (typeof mostrarFeedbackFlotanteEscritora === "function") {
        mostrarFeedbackFlotanteEscritora(formatearSegundosJuego1P(1, { signo: "-" }), {
          color: color_negativo,
          tipo: "borrar"
        });
      } else {
        feedback.style.color = color_negativo;
        feedback.innerHTML = `â±ï¸${formatearSegundosJuego1P(1, { signo: "-" })}`;
        clearTimeout(delay_animacion);
        animateCSS(".feedback1", "flash").then(() => {
          delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
          }, 2000);
        });
      }
      color = color_negativo;
      tiempo_feed = formatearSegundosJuego1P(1, { signo: "-" });
    }
    caracteres_seguidos = 0;
    indice_buscar_palabra = texto.innerText.length;

    // 3. Obtener Ãºltima lÃ­nea y Ãºltimo nodo de texto
    lastLine = texto.lastChild;
    lastTextNode = lastLine.lastChild;
    if (!lastTextNode) {
      lastTextNode = lastLine;
    }
    
    // 4. Buscar Ãºltimo nodo de texto
    while (lastTextNode && lastTextNode.nodeType !== 3) {
      lastTextNode = lastTextNode.previousSibling;
    }

    // 5. Si nodo vacÃ­o, eliminar y avanzar
    if (lastTextNode && lastTextNode.data.trim() === "") {
      lastLine.removeChild(lastTextNode);
      lastTextNode = lastLine.lastChild;
      caretNode = lastTextNode;
      caretPos = lastTextNode ? lastTextNode.length : 0;
      nodoBorrado = true;
    }

    // 6. Si no hay nodo de texto, retroceder a la lÃ­nea anterior si existe
    if (!lastTextNode && lastLine.previousSibling) {
      lastLine.remove();
      lastLine = texto.lastChild;
      lastTextNode = lastLine ? lastLine.lastChild : null;
      caretNode = lastTextNode;
      caretPos = lastTextNode ? lastTextNode.length : 0;
      nodoBorrado = true;
    }

    // 7. Borrar Ãºltimo carÃ¡cter si procede
    if (!nodoBorrado && lastTextNode && lastTextNode.data && lastTextNode.data.length > 0) {
      lastTextNode.data = lastTextNode.data.substring(0, lastTextNode.data.length - 1);
    }

    // 8. Actualizar estado
    if(texto.innerText.match(/\b\w+\b/g) != null){
      puntos_ = texto.innerText.match(/\b\w+\b/g).length;
    } else {
      puntos_ = 0;
    }
    if (typeof actualizarPuntosMarcador === "function") {
      actualizarPuntosMarcador(puntos_);
    } else {
      puntos.innerHTML = formatearConteoPalabrasJuego1P(puntos_);
    }
    //cambio_nivel(puntos_);
    clearTimeout(borrado);
    borrado = setTimeout(() => {
      borrar();
    }, rapidez_borrado);

    // 9. Reposicionar caret usando la funciÃ³n
    
    if (caretNode) {
      restaurarPosicionCaret(caretNode, caretPos);
    }

  } else {
    clearTimeout(borrado);
  }

}

// FunciÃ³n para obtener la posiciÃ³n del caret dentro de un contenedor
function getCaretCharacterOffsetWithin(element) {
  let caretOffset = 0;
  const doc = element.ownerDocument || element.document;
  const win = doc.defaultView || doc.parentWindow;
  let sel;
  
  if (typeof win.getSelection !== "undefined") {
    sel = win.getSelection();
    if (sel.rangeCount > 0) {
      const range = win.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;

      // Contando los saltos de lÃ­nea
      const div = document.createElement("div");
      div.appendChild(preCaretRange.cloneContents());
      const text = div.innerHTML;
      const matches = text.match(/<br>|<div>/g);
      const extraLines = matches ? matches.length : 0;
      caretOffset += extraLines;
    }
  }
  
  return caretOffset;
}

//FunciÃ³n que modifica el comportamiento del juego.
function countChars(texto) {
  var lastWordCount = puntos_; // Mantenemos el Ãºltimo recuento de palabras

  if(texto.innerText.match(/\b\w+\b/g) != null){
  puntos_ = texto.innerText.match(/\b\w+\b/g).length;
  }
  else{
    puntos_ = 0;
  }
  if (typeof actualizarPuntosMarcador === "function") {
    actualizarPuntosMarcador(puntos_);
  } else {
    puntos.innerHTML = formatearConteoPalabrasJuego1P(puntos_);
  }
  //cambio_nivel(puntos_);
  clearTimeout(borrado);
  if (desventajaSeleccionActiva()) {
    return;
  }
  if (modo_actual === "frase final") {
    return;
  }
  
  // Ahora, en lugar de contar los caracteres, incrementamos palabras_seguidas si el recuento de palabras ha aumentado
  if (puntos_ > lastWordCount) {
    caracteres_seguidos += 1;
  }

  if (caracteres_seguidos == 3 && modo_actual !== "frase final") {
    const bonusTiempo = (typeof secs_palabras === "number" && !Number.isNaN(secs_palabras))
      ? secs_palabras
      : 6;
    addSeconds(bonusTiempo);
    if (typeof mostrarFeedbackFlotanteEscritora === "function") {
      mostrarFeedbackFlotanteEscritora(formatearSegundosJuego1P(bonusTiempo, { signo: "+" }), {
        color: color_positivo,
        tipo: "ganar_tiempo"
      });
    } else {
      feedback.style.color = color_positivo;
      feedback.innerHTML = `â±ï¸${formatearSegundosJuego1P(bonusTiempo, { signo: "+" })}`;
      clearTimeout(delay_animacion);
      animateCSS(".feedback1", "flash").then(() => {
        delay_animacion = setTimeout(function () {
          feedback.innerHTML = "";
        }, 2000);
      });
    }
    caracteres_seguidos = 0; // Reseteamos el contador de palabras seguidas
    secs = bonusTiempo;
    /////socket.emit('aumentar_tiempo', {secs, player});
    color = color_positivo;
    tiempo_feed = formatearSegundosJuego1P(bonusTiempo, { signo: "+" });
  }
  borrado = setTimeout(function () {
    borrar();
}, rapidez_inicio_borrado);

}


//FunciÃ³n auxiliar que, dado un string, lo devuelve en su forma normal, es decir, sin acentos, diÃ©resis y similares.
function toNormalForm(str) {
    return str
        .normalize("NFD")
        .replace(
            /([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,
            "$1"
        );
}

/*
//FunciÃ³n auxiliar que cambia la rapidez y el inicio de borrado en funciÃ³n de la cantidad de caracteres escritos.
function cambio_nivel(caracteres) {
    if (0 <= caracteres && caracteres < 100) {
        nivel.innerHTML = "nivel 1";
        if(!borrado_cambiado){
          rapidez_inicio_borrado = 4000;
          rapidez_borrado = 4000;
        }
    }
    if (100 <= caracteres && caracteres < 200) {
        nivel.innerHTML = "nivel 2";
        if(!borrado_cambiado){
          rapidez_inicio_borrado = 3800;
          rapidez_borrado = 3800;
        }
    }
    if (300 <= caracteres && caracteres < 400) {
        nivel.innerHTML = "nivel 3";
        if(!borrado_cambiado){
          rapidez_borrado = 3600;
          rapidez_inicio_borrado = 3600;
        }
    }
    if (400 <= caracteres && caracteres < 500) {
        nivel.innerHTML = "nivel 4";
        if(!borrado_cambiado){
          rapidez_borrado = 3400;
          rapidez_inicio_borrado = 3400;
        }
    }

    if (500 <= caracteres && caracteres < 600) {
      nivel.innerHTML = "nivel 5";
      if(!borrado_cambiado){
        rapidez_borrado = 3200;
        rapidez_inicio_borrado = 3200;
      }
    }

    if (600 <= caracteres && caracteres < 700) {
      nivel.innerHTML = "nivel 6";
      if(!borrado_cambiado){
        rapidez_borrado = 3000;
        rapidez_inicio_borrado = 3000;
      }
    }

    if (700 <= caracteres && caracteres < 800) {
      nivel.innerHTML = "nivel 7";
      if(!borrado_cambiado){
        rapidez_borrado = 2800;
        rapidez_inicio_borrado = 2800;
      }
    }

    if (900 <= caracteres && caracteres < 1000) {
      nivel.innerHTML = "nivel 8";
      if(!borrado_cambiado){
        rapidez_borrado = 2600;
        rapidez_inicio_borrado = 2600;
      }
    }

    if (1000 <= caracteres && caracteres < 1100) {
      nivel.innerHTML = "nivel 9";
      if(!borrado_cambiado){
        rapidez_borrado = 2400;
        rapidez_inicio_borrado = 2400;
      }
    }

    if (1100 <= caracteres && caracteres < 1200) {
      nivel.innerHTML = "nivel 10";
      if(!borrado_cambiado){
        rapidez_borrado = 2200;
        rapidez_inicio_borrado = 2200;
      }
    }

    if (1200 <= caracteres && caracteres < 1400) {
      nivel.innerHTML = "nivel 11";
      if(!borrado_cambiado){
        rapidez_borrado = 2000;
        rapidez_inicio_borrado = 2000;
      }
    }

    if (1400 <= caracteres && caracteres < 1600) {
      nivel.innerHTML = "nivel 12";
      if(!borrado_cambiado){
        rapidez_borrado = 1800;
        rapidez_inicio_borrado = 1800;
      }
    }

    if (1800 <= caracteres && caracteres < 2000) {
      nivel.innerHTML = "nivel 13";
      if(!borrado_cambiado){
        rapidez_borrado = 1600;
        rapidez_inicio_borrado = 1600;
      }
    }

    if (caracteres >= 2000) {
        nivel.innerHTML = "nivel 14";
        if(!borrado_cambiado){
          rapidez_borrado = 1400;
          rapidez_inicio_borrado = 1400;
        }
    }
}
*/

//FunciÃ³n auxiliar para crear las animaciones del feedback.
