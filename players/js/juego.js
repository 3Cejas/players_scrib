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
let cambio_palabra; // Variable que almacena el identificador de la función temporizada de cambio de palabra.
let blurreado = false; // Variable booleana que si alguno de los dos textos ha sido blurreado.
let puntuacion = 0; // Variable entera que almacena la puntuación de la palabra bonus.
let puntos = 0; // Puntos del jugador 1.
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



document.addEventListener('keydown', function(event) {
  if(event.key === "Backspace"){
    var delete_type = new Audio('../audio/delete.WAV');
    delete_type.play();
  }
  else{
    var audio_type = new Audio('../audio/type.WAV');
    audio_type.play();
  }
});
document.addEventListener('click', function(event) {
  texto1.focus();
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
      texto1.focus();
    }
  }
}
});

// Función que aumenta de tamaño el texto del jugador 1 cuando el jugador 1 escribe cualquier carácter en el texto.
function auto_grow(element) {
    element.style.height = "5px";
    element.style.height = element.scrollHeight + "px";
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
      while (texto2.scrollHeight > texto1.scrollHeight) {
        saltos_línea_alineacion_1 += 1;
        texto1.innerText = "\n" + texto1.innerText;
      }
      texto1.style.height = texto2.scrollHeight + "px";
      texto2.style.height = texto2.scrollHeight + "px";
    } else {
      while (texto2.scrollHeight < texto1.scrollHeight) {
        saltos_línea_alineacion_2 += 1;
        texto2.innerText = "\n" + texto2.innerText;
      }
      texto1.style.height = texto1.scrollHeight + "px";
      texto2.style.height = texto1.scrollHeight + "px";
    }*/
    texto1.style.height = texto1.scrollHeight + "px";
    texto2.style.height = texto2.scrollHeight + "px";
    //window.scrollTo(0, document.body.scrollHeight);
    focalizador1.scrollIntoView({ block: "end" });
}

// Función para guardar la posición del caret
function guardarPosicionCaret() {
  let sel = window.getSelection();
  let range = sel.getRangeAt(0);
  return {
    caretPos: range.startOffset,
    caretNode: range.startContainer
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
  console.log("Borrando");
  if (!desactivar_borrar) {
    let nodoBorrado = false;

    // 1. Guardar la posición del caret usando la función
    let { caretNode, caretPos } = guardarPosicionCaret();

    // 2. Código existente
    secs = -1;
    socket.emit('aumentar_tiempo', {secs, player});
    caracteres_seguidos = 0;
    indice_buscar_palabra = texto1.innerText.length;

    // 3. Obtener última línea y último nodo de texto
    let lastLine = texto1.lastChild;
    let lastTextNode = lastLine.lastChild;
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
      lastLine = texto1.lastChild;
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
    if(texto1.innerText.match(/\b\w+\b/g) != null){
      puntos = texto1.innerText.match(/\b\w+\b/g).length;
      cambiar_color_puntuación();
    } else {
      puntos = 0;
    }
    puntos1.innerHTML = puntos + " palabras 🖋️";
    cambio_nivel(puntos);
    clearTimeout(borrado);
    borrado = setTimeout(() => {
      borrar();
    }, rapidez_borrado);

    // 9. Reposicionar caret usando la función
    if (caretNode) {
      restaurarPosicionCaret(caretNode, caretPos);
    }

  } else {
    console.log("Borrado desactivado");
    clearTimeout(borrado);
  }
  
  // 10. Envío de texto
  sendText();
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
  var lastWordCount = puntos; // Mantenemos el último recuento de palabras

  if(texto.innerText.match(/\b\w+\b/g) != null){
  puntos = texto.innerText.match(/\b\w+\b/g).length;
  cambiar_color_puntuación();
  }
  else{
    puntos = 0;
  }
  puntos1.innerHTML = puntos + " palabras 🖋️";
  cambio_nivel(puntos);
  clearTimeout(borrado);
  
  // Ahora, en lugar de contar los caracteres, incrementamos palabras_seguidas si el recuento de palabras ha aumentado
  if (puntos > lastWordCount) {
    caracteres_seguidos += 1;
  }

  if (caracteres_seguidos == 5 && locura == false) {
    feedback1.style.color = color_positivo;
    feedback1.innerHTML = "⏱️+3 segs.";
    clearTimeout(delay_animacion);
    animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    });
    caracteres_seguidos = 0; // Reseteamos el contador de palabras seguidas
    secs = 3
    socket.emit('aumentar_tiempo', {secs, player});
    color = color_positivo;
    tiempo_feed = "⏱️+" + "3" + " segs."
    socket.emit(feedback_de_j_x, { color, tiempo_feed});
  }
  console.log("big")
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

//Función auxiliar que cambia la rapidez y el inicio de borrado en función de la cantidad de caracteres escritos.
function cambio_nivel(caracteres) {
    if (0 <= caracteres && caracteres < 100) {
        nivel1.innerHTML = "🌡️ nivel 1";
        if(!borrado_cambiado){
          rapidez_inicio_borrado = 4000;
          rapidez_borrado = 4000;
        }
    }
    if (100 <= caracteres && caracteres < 200) {
        nivel1.innerHTML = "🌡️ nivel 2";
        if(!borrado_cambiado){
          rapidez_inicio_borrado = 3800;
          rapidez_borrado = 3800;
        }
    }
    if (300 <= caracteres && caracteres < 400) {
        nivel1.innerHTML = "🌡️ nivel 3";
        if(!borrado_cambiado){
          rapidez_borrado = 3600;
          rapidez_inicio_borrado = 3600;
        }
    }
    if (400 <= caracteres && caracteres < 500) {
        nivel1.innerHTML = "🌡️ nivel 4";
        if(!borrado_cambiado){
          rapidez_borrado = 3400;
          rapidez_inicio_borrado = 3400;
        }
    }

    if (500 <= caracteres && caracteres < 600) {
      nivel1.innerHTML = "🌡️ nivel 5";
      if(!borrado_cambiado){
        rapidez_borrado = 3200;
        rapidez_inicio_borrado = 3200;
      }
    }

    if (600 <= caracteres && caracteres < 700) {
      nivel1.innerHTML = "🌡️ nivel 6";
      if(!borrado_cambiado){
        rapidez_borrado = 3000;
        rapidez_inicio_borrado = 3000;
      }
    }

    if (700 <= caracteres && caracteres < 800) {
      nivel1.innerHTML = "🌡️ nivel 7";
      if(!borrado_cambiado){
        rapidez_borrado = 2800;
        rapidez_inicio_borrado = 2800;
      }
    }

    if (900 <= caracteres && caracteres < 1000) {
      nivel1.innerHTML = "🌡️ nivel 8";
      if(!borrado_cambiado){
        rapidez_borrado = 2600;
        rapidez_inicio_borrado = 2600;
      }
    }

    if (1000 <= caracteres && caracteres < 1100) {
      nivel1.innerHTML = "🌡️ nivel 9";
      if(!borrado_cambiado){
        rapidez_borrado = 2400;
        rapidez_inicio_borrado = 2400;
      }
    }

    if (1100 <= caracteres && caracteres < 1200) {
      nivel1.innerHTML = "🌡️ nivel 10";
      if(!borrado_cambiado){
        rapidez_borrado = 2200;
        rapidez_inicio_borrado = 2200;
      }
    }

    if (1200 <= caracteres && caracteres < 1400) {
      nivel1.innerHTML = "🌡️ nivel 11";
      if(!borrado_cambiado){
        rapidez_borrado = 2000;
        rapidez_inicio_borrado = 2000;
      }
    }

    if (1400 <= caracteres && caracteres < 1600) {
      nivel1.innerHTML = "🌡️ nivel 12";
      if(!borrado_cambiado){
        rapidez_borrado = 1800;
        rapidez_inicio_borrado = 1800;
      }
    }

    if (1800 <= caracteres && caracteres < 2000) {
      nivel1.innerHTML = "🌡️ nivel 13";
      if(!borrado_cambiado){
        rapidez_borrado = 1600;
        rapidez_inicio_borrado = 1600;
      }
    }

    if (caracteres >= 2000) {
        nivel1.innerHTML = "🌡️ nivel 14";
        if(!borrado_cambiado){
          rapidez_borrado = 1400;
          rapidez_inicio_borrado = 1400;
        }
    }
}

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