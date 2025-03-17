let borrado; // Variable que almacena el identificador de la función temporizada de borrado.
let antiguo_inicio_borrado = 3000;
let rapidez_borrado = 3000; // Variable que almacena la velocidad del borrado del texto.
let antiguo_rapidez_borrado = 3000;
let rapidez_inicio_borrado = 3000; // Variable que almacena el tiempo de espera sin escribir hasta que empieza a borrar el texto.
let asignada = false; // Variable boolena que dice si hay una palabra bonus asignada.
let palabra_actual = ""; // Variable que almacena la palabra bonus actual.
let puntos_palabra = 0; // Variable que almacena los puntos obtenidos por meter palabras bonus.
let terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
let countInterval; // Variable que almacena el identificador de la función que será ejecutada cada x segundos para uso para actualizar el contador.
let intervaloID_temp_modos;
let cambio_palabra; // Variable que almacena el identificador de la función temporizada de cambio de palabra.
let blurreado = false; // Variable booleana que si alguno de los dos textos ha sido blurreado.
let puntuacion = 0; // Variable entera que almacena la puntuación de la palabra bonus.
let puntos_ = 0; // Puntos del jugador 1.
let puntos_escritura = 0;
let puntuacion_acumulada_j2 = 0;
let delay_animacion;
let delay_animacion_tiempo;
let envio_puntos;
let caracteres_seguidos = 0;
puntos_letra_prohibida = 0;
puntos_letra_bendita = 0;
//let saltos_línea_alineacion_1 = 0; // Variable entera que almacena los saltos de línea del jugador 1 para alínear los textos.
//let saltos_línea_alineacion_2 = 0; // Variable entera que almacena los saltos de línea del jugador 2 para alínear los textos.
const color_negativo = "red";
const color_positivo = "greenyellow";
let isFullscreen = false;
let menu_modificador = false;
let focusedButtonIndex = 0;
let modificadorButtons = [];
let locura = false;

let lastLine;
let lastTextNode;

let caretPos;
let caretNode;



document.addEventListener('keydown', function(event) {
});

function pantalla_completa() {
  texto.focus();
  console.log(menu_modificador);
  if(menu_modificador == false || modificadorButtons.length == 0) {
  if (event.button === 0) {
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
      isFullscreen = false;
    } else {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      }
      isFullscreen = true;
      texto.focus();
    }
  }
}
};

// Función para guardar la posición del caret
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

// Función para restaurar la posición del caret
function restaurarPosicionCaret(caretNode, caretPos) {
  let sel = window.getSelection();
  let range = sel.getRangeAt(0);
  range.setStart(caretNode, Math.min(caretPos, caretNode.length));
  range.setEnd(caretNode, Math.min(caretPos, caretNode.length));
  sel.removeAllRanges();
  sel.addRange(range);
}

function borrar() {
  if (!desactivar_borrar) {
    let nodoBorrado = false;

    // 1. Guardar la posición del caret usando la función
    let { caretNode, caretPos } = guardarPosicionCaret();

    // 2. Código existente

    feedback.style.color = color_negativo;
    feedback.innerHTML = "⏱️-1 segs.";
    addSeconds(-1);
    clearTimeout(delay_animacion);
    animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    });

   ///////socket.emit('aumentar_tiempo', {secs, player});
    color = color_negativo;
    tiempo_feed = "⏱️-" + "1" + " segs."
    caracteres_seguidos = 0;
    indice_buscar_palabra = texto.innerText.length;

    // 3. Obtener última línea y último nodo de texto
    lastLine = texto.lastChild;
    lastTextNode = lastLine.lastChild;
    if (!lastTextNode) {
      lastTextNode = lastLine;
    }
    
    // 4. Buscar último nodo de texto
    while (lastTextNode && lastTextNode.nodeType !== 3) {
      lastTextNode = lastTextNode.previousSibling;
    }

    // 5. Si nodo vacío, eliminar y avanzar
    if (lastTextNode && lastTextNode.data.trim() === "") {
      lastLine.removeChild(lastTextNode);
      lastTextNode = lastLine.lastChild;
      caretNode = lastTextNode;
      caretPos = lastTextNode ? lastTextNode.length : 0;
      nodoBorrado = true;
    }

    // 6. Si no hay nodo de texto, retroceder a la línea anterior si existe
    if (!lastTextNode && lastLine.previousSibling) {
      lastLine.remove();
      lastLine = texto.lastChild;
      lastTextNode = lastLine ? lastLine.lastChild : null;
      caretNode = lastTextNode;
      caretPos = lastTextNode ? lastTextNode.length : 0;
      nodoBorrado = true;
    }

    // 7. Borrar último carácter si procede
    if (!nodoBorrado && lastTextNode && lastTextNode.data && lastTextNode.data.length > 0) {
      lastTextNode.data = lastTextNode.data.substring(0, lastTextNode.data.length - 1);
    }

    // 8. Actualizar estado
    if(texto.innerText.match(/\b\w+\b/g) != null){
      puntos_ = texto.innerText.match(/\b\w+\b/g).length;
    } else {
      puntos_ = 0;
    }
    puntos.innerHTML = puntos_ + " palabras";
    //cambio_nivel(puntos_);
    clearTimeout(borrado);
    borrado = setTimeout(() => {
      borrar();
    }, rapidez_borrado);

    // 9. Reposicionar caret usando la función
    
    if (caretNode) {
      restaurarPosicionCaret(caretNode, caretPos);
    }

  } else {
    clearTimeout(borrado);
  }

}

// Función para obtener la posición del caret dentro de un contenedor
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

      // Contando los saltos de línea
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

//Función que modifica el comportamiento del juego.
function countChars(texto) {
  var lastWordCount = puntos_; // Mantenemos el último recuento de palabras

  if(texto.innerText.match(/\b\w+\b/g) != null){
  puntos_ = texto.innerText.match(/\b\w+\b/g).length;
  }
  else{
    puntos_ = 0;
  }
  puntos.innerHTML = puntos_ + " palabras";
  //cambio_nivel(puntos_);
  clearTimeout(borrado);
  
  // Ahora, en lugar de contar los caracteres, incrementamos palabras_seguidas si el recuento de palabras ha aumentado
  if (puntos_ > lastWordCount) {
    caracteres_seguidos += 1;
  }

  if (caracteres_seguidos == 3 && locura == false) {
    feedback.style.color = color_positivo;
    feedback.innerHTML = "⏱️+6 segs.";
    addSeconds(6)
    clearTimeout(delay_animacion);
    animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    });
    caracteres_seguidos = 0; // Reseteamos el contador de palabras seguidas
    secs = 6;
    /////socket.emit('aumentar_tiempo', {secs, player});
    color = color_positivo;
    tiempo_feed = "⏱️+" + "6" + " segs."
  }
  borrado = setTimeout(function () {
    borrar();
}, rapidez_inicio_borrado);

}


//Función auxiliar que, dado un string, lo devuelve en su forma normal, es decir, sin acentos, diéresis y similares.
function toNormalForm(str) {
    return str
        .normalize("NFD")
        .replace(
            /([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,
            "$1"
        );
}

/*
//Función auxiliar que cambia la rapidez y el inicio de borrado en función de la cantidad de caracteres escritos.
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

//Función auxiliar para crear las animaciones del feedback.
const animateCSS = (element, animation, prefix = "animate__") =>
    // We create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        node.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve("Animation ended");
        }
        node.addEventListener("animationend", handleAnimationEnd, { once: true });
    });

    function downloadTxtFile(filename, htmlContent) {
      // Reemplazar etiquetas <br> y separar bloques de <div> con saltos de línea
      let contentWithNewlines = htmlContent
          .replace(/<br\s*\/?>/gi, '\n')               // Reemplaza <br> por saltos de línea
          .replace(/<\/div>\s*<div>/gi, '\n')          // Reemplaza el cierre y apertura de <div> consecutivos por un salto de línea
          .replace(/<\/?div>/gi, '')                   // Elimina etiquetas <div> restantes
          .trim();                                     // Elimina espacios en blanco al inicio y final
      
      // Crear un Blob con el texto procesado
      const blob = new Blob([contentWithNewlines], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);  // Requerido en algunos navegadores como Firefox
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
  }

    function descargar_textos() {
      const { jsPDF } = window.jspdf;
      var doc = new jsPDF();
  
      const margen = 20;
      const anchoPagina = doc.internal.pageSize.width;
      const altoPagina = doc.internal.pageSize.height;
      const imgLogo = 'data:image/jpeg;base64,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';
      const scrib_logo =  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACeYAAAGACAYAAADC/SDNAAAgAElEQVR4XuzdT6glR3og+p7nlReNkVqrhtnoj6E3lqCl8aY10JtxUYIB44VatBeGsZFaBi8ezCtQ+a3sErgG3sIwLQl7oBfTqLQYBgwlnjbTMK5Nj9QgedNgSbUZ6JVKGtMLrzzvRdh921enMu/J/xnfl78LB+qeyoyI7xdx8sSN/DLzX3zFDwECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQILCYwL9YrCQFESBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAl+RmGcQECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgACBBQUk5i2IqSgCBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQICAxzxggQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQILCkjMWxBTUQQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAQGKeMUCAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBBYUkJi3IKaiCBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQICAxDxjgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQILCggMW9BTEURIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAGJecYAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBBYUEBi3oKYiiJAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAhLzjAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQILCggMS8BTEVRYAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIEJOYZAwQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAYEEBiXkLYiqKAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAhIzDMGCBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIDAggIS8xbEVBQBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIEJCYZwwQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAIEFBSTmLYipKAIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgIDHPGCBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgsKSMxbEFNRBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIEBAYp4xQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIEFhSQmLcgpqIIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgIDEPGOAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgsKCAxb0FMRREgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAYl5xgABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIEFhQQGLegpiKIkCAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECEvOMAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgsKCAxLwFMRVFgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQk5hkDBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIEBgQQGJeQtiKooAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECEjMMwYIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgMCCAhLzFsRUFAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQkJhnDBAgQIAAAQIE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AIEwAY15YZTlArkRer+S97wR2itLjXm9pOcYxxsl2+tU+fVBY96z62bERqy9+4ft/zucOeJ6yFgVjXn3q6rGvGftvddyv/V4xMga845QFXNGgb37ST9vbq96z583XcO218mZBAgQIEDgooAL7UUiBxAgQIAAAQIEwgT+s0V6OSza8wP9tv3zF53GMszxAg/aEN88G+bP7e9Prhx66fwrT73psG+1o/900xnjH/z1NsW/dphmTzuvDx0KOtEQXh+2F6vy68Panmbm15cftqXwvYXl8PjKJbJ2/pWn33TYtXPau3+4aVIO/jeBEddDxhKdmoTPv/7QvvH0ymSXzr/y1JsOy3i9+I8m8LebFLYd3HOPfO1r697rxTYJZ/UW6PX6cMtrVm8D4xE4CezdT/p5c/s66rV/OM3w2mvg9mycSYAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC2jMizcVkQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQKC2jMK1x8qRMgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIBAvIDGvHhTEQkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECgsIDGvMLFlzoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIxAtozIs3FZEAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC2jMizcVkQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQKC2jMK1x8qRMgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIBAvIDGvHhTEQkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECgsIDGvMLFlzoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIxAtozIs3FZEAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC2jMizcVkQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQKC2jMK1x8qRMgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIBAvIDGvHhTEQkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECgsIDGvMLFlzoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIxAtozIs3FZEAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC2jMizcVkQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQKC2jMK1x8qRMgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIBAvIDGvHhTEQkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECgsIDGvMLFlzoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIxAtozIs3FZEAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC2jMizcVkQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQKC2jMK1x8qRMgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIBAvIDGvHhTEQkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECgsIDGvMLFlzoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIxAtozIs3FZEAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC2jMizcVkQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQKC2jMK1x8qRMgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIBAvIDGvHhTEQkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECgsIDGvMLFlzoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIxAtozIs3FZEAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC2jMizcVkQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQKC2jMK1x8qRMgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIBAvIDGvHhTEQkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECgsIDGvMLFlzoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIxAtozIs3FZEAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC2jMizcVkQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQKC2jMK1x8qRMgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIBAvIDGvHhTEQkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECgsIDGvMLFlzoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIxAtozIs3FZEAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECgtozCtcfKkTIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAQLyAxrx4UxEJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAoLCAxrzCxZc6AQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECMQLaMyLNxWRAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAoLaMwrXHypEyBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgEC8gMa8eFMRCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQKCwgMa8wsWXOgECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAjEC/wdxVCHJe5YFY4AAAAASUVORK5CYII=';
       // Tamaño original y cálculo para logos
      const anchoLogoOriginal = 1555;
      const altoLogoOriginal = 1466;
      const anchoLogoMaximo = 17;
      const altoLogo = altoLogoOriginal * (anchoLogoMaximo / anchoLogoOriginal);
      const xLogo = anchoPagina - anchoLogoMaximo - margen + 15;
  
      const anchoScribLogoOriginal = 2534;
      const altoScribLogoOriginal = 584;
      const anchoScribLogoMaximo = 70;
      const altoScribLogo = altoScribLogoOriginal * (anchoScribLogoMaximo / anchoScribLogoOriginal);
      const xLogoIzquierda = margen - 27;
  
      function agregarLogoEnPagina() {
           doc.addImage(imgLogo, 'PNG', xLogo, margen - 17, anchoLogoMaximo, altoLogo);
           doc.addImage(scrib_logo, 'PNG', xLogoIzquierda, margen - 13, anchoScribLogoMaximo, altoScribLogo);
      }
   
      function agregarTextoEnPagina(texto, x, yInicial, tamano, color, bold = false) {
          doc.setFontSize(tamano);
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont('Times-Roman', bold ? 'bold' : 'normal');
  
          let y = yInicial;
          const lineas = doc.splitTextToSize(texto, anchoPagina - 2 * margen);
  
          lineas.forEach(linea => {
              if (y > altoPagina - margen) {
                  doc.addPage();
                  agregarLogoEnPagina();
                  y = margen + 10;
              }
              doc.text(linea, x, y);
              y += 6;
          });
  
          return y;
      }
  
      agregarLogoEnPagina();
  
      let yActual = agregarTextoEnPagina(nombre.value, margen, margen + 13, 25, [0, 0, 0], true);
  
      var div = document.createElement("div");
      div.innerHTML = texto_guardado;
      yActual = agregarTextoEnPagina(texto.innerText, margen, yActual + 5, 15, [0, 0, 0]);
  
      // Descargar el primer PDF y TXT
      doc.save(nombre.value + '.pdf');
      // Combina el nombre del escritor y el contenido HTML
      console.log("ES ES FINAAAL", nombre.value + "\n" + texto_guardado);
      //downloadTxtFile(nombre.value + '.txt', nombre.value + "\n" + texto.innerText);
  }

function opciones(){
  
  animateCSS(".botones", "backOutLeft").then((message) => {
    btnOpciones.style.display = "none";
    btnEscribir.style.display = "none";
    btnLimpiar.style.display = "none";
    btnDescargarTexto.style.display = "none";
    btnPantallaCompleta.style.display = "none";
    btnVolver.style.display = "";
    animateCSS(".botones", "backInLeft")
  });

  animateCSS(".contenedor", "backOutLeft").then((message) => {
    contenedor.style.display = "none";
    div_opciones.style.display = "inline-block";
    animateCSS(".opciones", "backInLeft")
  })
}

function volver(){
  animateCSS(".botones", "backOutLeft").then((message) => {
    btnOpciones.style.display = "";
    btnEscribir.style.display = "";
    btnLimpiar.style.display = "";
    btnPantallaCompleta.style.display = "" 
    btnVolver.style.display = "none";
    animateCSS(".botones", "backInLeft")
  });
  animateCSS(".opciones", "backOutLeft").then((message) => {
    contenedor.style.display = "";
    div_opciones.style.display = ""
    contenedor.style.display = "";
    animateCSS(".contenedor", "backInLeft")
  })
}

function generarCasillas() {
  // Obtenemos el contenedor que ahora es un tbody
  const contenedor = document.getElementById('listaModos');
  if (!contenedor) {
    console.error('No se encontró el contenedor con id "listaModos"');
    return;
  }
  // Limpiar el contenedor antes de agregar elementos
  contenedor.innerHTML = "";

  // Centrar la tabla (asumiendo que el tbody es hijo directo de la tabla)
  if (contenedor.parentElement && contenedor.parentElement.tagName.toLowerCase() === "table") {
    contenedor.parentElement.style.margin = "0 auto";
  }

  // Si la ventana es pequeña (móvil), se apilan verticalmente y se agranda el tamaño del checkbox
  if (window.innerWidth <= 600) {
    LISTA_MODOS_INICIAL.forEach(function(modo, index) {
      // Crear una fila para cada casilla
      const tr = document.createElement('tr');
      // Crear una celda que contenga el checkbox y el label
      const td = document.createElement('td');
      td.className = "casilla";

      // Crear el checkbox con tamaño mayor para móviles
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `modo-${index}`;
      checkbox.name = 'modos';
      checkbox.value = modo;
      checkbox.checked = true;
      // Ajuste dinámico del tamaño del checkbox para móviles
      checkbox.style.width = "1.5em";
      checkbox.style.height = "1.5em";

      // Crear el label asociado al checkbox
      const label = document.createElement('label');
      label.htmlFor = `modo-${index}`;
      label.textContent = modo.toUpperCase(); // Convertir el modo a mayúsculas
      label.style.display = 'block'; // Mostrar el label en una nueva línea
      label.style.color = COLORES_MODOS[modo];
      label.style.paddingLeft = "0.2vw";
      label.style.paddingRight = "0.2vw";
      label.style.paddingBottom = "4vw";
      label.style.fontSize = "8vw";

      // Añadir el checkbox y el label a la celda, y la celda a la fila
      td.appendChild(checkbox);
      td.appendChild(label);
      tr.appendChild(td);
      // Agregar la fila al contenedor (tbody)
      contenedor.appendChild(tr);
    });
  }
}

/**
 * Función para obtener los modos seleccionados.
 * Recorre todos los checkbox con name "modos" que estén seleccionados y extrae su valor.
 */
function rellenarListaModos() {
  const seleccionados = document.querySelectorAll('input[name="modos"]:checked');
  const LISTA_MODOS = Array.from(seleccionados).map(checkbox => checkbox.value);
  console.log('LISTA_MODOS:', LISTA_MODOS);
}

/**
 * Función para actualizar variables globales a partir de inputs (ejemplo).
 * Aquí se actualizan algunas variables multiplicando el valor del input por 1000.
 */
function actualizarVariables() {
  // Ejemplo: suponiendo que existen elementos con los ids indicados
  // TIEMPO_CAMBIO_PALABRAS = document.getElementById('tiempo_cambio_palabras_input').valueAsNumber * 1000;
  // TIEMPO_INICIAL = document.getElementById('tiempo_inicial_input').valueAsNumber * 1000;
  // TIEMPO_CAMBIO_LETRA = document.getElementById('tiempo_cambio_letra_input').valueAsNumber * 1000;
  // TIEMPO_MODOS = document.getElementById('tiempo_modos_input').valueAsNumber * 1000;
  // TIEMPO_CAMBIO_MODOS = TIEMPO_MODOS - 1;
  console.log('Variables actualizadas (ejemplo)');
}

// Esperamos a que el DOM se cargue para generar las casillas y actualizar las variables
document.addEventListener('DOMContentLoaded', function () {
  generarCasillas();
  actualizarVariables();
});