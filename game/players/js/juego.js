let borrado; // Variable que almacena el identificador de la función temporizada de borrado.
let atributos;
const LIMITE_TOTAL = 10;
const SECS_BASE = 2;
const maxIncremento =  3; // queremos +300% de habilidades en el mejor caso
const maxIncrementoDestreza =  0.5; // queremos +300% de habilidades en el mejor caso
let secs_palabras;
var CLASE_PALABRA_BENDITA = window.CLASE_PALABRA_BENDITA || "palabra-bendita";
window.CLASE_PALABRA_BENDITA = CLASE_PALABRA_BENDITA;
const CLASE_PALABRA_MUSA = "palabra-musa";
const CLASE_LETRA_BENDITA = "letra-verde";
let antiguo_inicio_borrado = 1000;
let rapidez_borrado = 1000; // Variable que almacena la velocidad del borrado del texto.
let antiguo_rapidez_borrado = 1000;
let rapidez_inicio_borrado = 1000; // Variable que almacena el tiempo de espera sin escribir hasta que empieza a borrar el texto.
let asignada = false; // Variable boolena que dice si hay una palabra bonus asignada.
let palabra_actual = ""; // Variable que almacena la palabra bonus actual.
let puntos_palabra = 0; // Variable que almacena los puntos obtenidos por meter palabras bonus.
let terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
let countInterval; // Variable que almacena el identificador de la función que será ejecutada cada x segundos para uso para actualizar el contador.
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

let lastLine;
let lastTextNode;

let caretPos;
let caretNode;



document.addEventListener('keydown', function(event) {
});

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

function obtenerUltimoNodoEditable() {
  if (!texto) return null;
  const walker = document.createTreeWalker(texto, NodeFilter.SHOW_TEXT, null, false);
  let last = null;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent) continue;
    const dentroProtegida = node.parentElement?.closest(`.${CLASE_PALABRA_BENDITA}, .${CLASE_PALABRA_MUSA}, .${CLASE_LETRA_BENDITA}`);
    if (dentroProtegida) continue;
    last = node;
  }
  return last;
}

function borrarUltimoCaracterEditable() {
  const nodo = obtenerUltimoNodoEditable();
  if (!nodo || !nodo.data) return false;
  nodo.data = nodo.data.substring(0, nodo.data.length - 1);
  if (nodo.data.length === 0 && nodo.parentNode) {
    nodo.parentNode.removeChild(nodo);
  }
  return true;
}

function borrar() {
  if (!desactivar_borrar) {
    // 1. Guardar la posición del caret usando la función
    let { caretNode, caretPos } = guardarPosicionCaret();

    // 2. Código existente

    feedback.style.color = color_negativo;
    feedback.innerHTML = "⏱️-1 segs.";
    clearTimeout(delay_animacion);
    animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    });

    secs = -1;
    socket.emit('aumentar_tiempo', {secs, player});
    color = color_negativo;
    tiempo_feed = "⏱️-" + "1" + " segs."
    socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "borrar"});
    caracteres_seguidos = 0;
    // 3. Borrar último carácter editable, saltando palabras benditas
    borrarUltimoCaracterEditable();

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
      console.log(rapidez_borrado, "rapidez_borrado")
    }, rapidez_borrado);

    // 9. Reposicionar caret usando la función
    
    if (caretNode) {
      restaurarPosicionCaret(caretNode, caretPos);
    }

  } else {
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

  if (caracteres_seguidos == 3) {
    feedback.style.color = color_positivo;
    tiempo_feed = `⏱️+${secs_palabras} segs.`;
    feedback.innerHTML = tiempo_feed;
    clearTimeout(delay_animacion);
    animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    });
    caracteres_seguidos = 0; // Reseteamos el contador de palabras seguidas
    console.log("fuerza: " + secs_palabras);
    socket.emit('aumentar_tiempo', {secs: secs_palabras, player});
    color = color_positivo;    socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "ganar_tiempo"});
  }
  console.log(rapidez_borrado, rapidez_inicio_borrado);
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

       // Esperar a que el DOM esté completamente cargado
       document.addEventListener('DOMContentLoaded', () => {
        // Estado inicial de los atributos
        atributos = { fuerza: 0, agilidad: 0, destreza: 0 };
  
        // Referencias a elementos del DOM
        const container = document.getElementById('atributos-container');
        const totalUsadosEl = document.getElementById('total-usados');
        const totalWrapEl = document.getElementById('total');
        const btnInicioEl = document.getElementById('btnInicio');
  
        // Función para calcular la suma total
        function calcularTotal() {
          return Object.values(atributos).reduce((a, b) => a + b, 0);
        }
  
    // Función para actualizar toda la interfaz tras un cambio
    function actualizarInterfaz() {
      // 1) Calculamos total de puntos usados
      const total = calcularTotal();

      // 2) Iteramos cada atributo para sincronizar contador, botones y barras
      document.querySelectorAll('.atributo').forEach(div => {
        const key     = div.dataset.atributo;            // "fuerza", "agilidad", ...
        const valor   = atributos[key];                  // valor actual
        const contadorEl = div.querySelector('.contador');
        const btnMenos= div.querySelector('button[data-action="decrement"]');
        const btnMas  = div.querySelector('button[data-action="increment"]');
        const puntos  = div.querySelectorAll('.punto');

        // Actualiza la UI numérica
        if (contadorEl) {
          contadorEl.textContent = valor;
        }

        // Deshabilita botones según reglas
        btnMenos.disabled = (valor === 0);
        btnMas.disabled   = (total >= LIMITE_TOTAL);

        // Sincroniza el botón de inicio legacy (oculto visualmente)
        if (btnInicioEl) {
          btnInicioEl.disabled = (total !== LIMITE_TOTAL);
        }

        // Rellena los puntitos de la barra según valor
        puntos.forEach((el, idx) => {
          el.classList.toggle('filled', idx < valor);
        });
      });

      // 3) Actualiza el número total en pantalla
      totalUsadosEl.textContent = total;
      actualizarTotalComoBoton(total);

      // 4) Aplica clases de color según porcentaje usado
      //    Calculamos ratio de uso (puede superar 1 si excede)
      const ratio = total / LIMITE_TOTAL;
      const ratioAjustado = Math.max(0, Math.min(ratio, 1));

      // La cápsula de puntos usados transita de color:
      // azul -> verde para escritxr azul, rojo -> verde para escritxr rojo.
      if (totalWrapEl) {
        const equipoRojo = document.body.classList.contains('equipo-rojo');
        const hueInicio = equipoRojo ? 0 : 188;
        const hueFinal = 130;
        const hue = Math.round(hueInicio + ((hueFinal - hueInicio) * ratioAjustado));
        totalWrapEl.style.setProperty('--total-border-color', `hsla(${hue}, 95%, 63%, 0.6)`);
        totalWrapEl.style.setProperty('--total-bg-a', `hsla(${hue}, 95%, 56%, 0.24)`);
        totalWrapEl.style.setProperty('--total-bg-b', `hsla(${hue}, 95%, 38%, 0.10)`);
        totalWrapEl.style.setProperty('--total-glow', `hsla(${hue}, 95%, 56%, 0.34)`);
      }

      // Quitamos clases de estado previas
      totalUsadosEl.classList.remove('estado-ok', 'estado-warn', 'estado-danger', 'estado-over');

      // Asignamos la clase adecuada
      if (ratio > 1) {
        totalUsadosEl.classList.add('estado-over');
      } else if (ratio > 0.8) {
        totalUsadosEl.classList.add('estado-danger');
      } else if (ratio > 0.5) {
        totalUsadosEl.classList.add('estado-warn');
      } else {
        totalUsadosEl.classList.add('estado-ok');
      }
    }

    function actualizarTotalComoBoton(total) {
      if (!totalWrapEl) return;
      const listo = total === LIMITE_TOTAL;
      totalWrapEl.classList.toggle('total-ready', listo);
      totalWrapEl.setAttribute('role', 'button');
      totalWrapEl.setAttribute('aria-disabled', listo ? 'false' : 'true');
      totalWrapEl.tabIndex = listo ? 0 : -1;
      totalWrapEl.title = listo
        ? 'Comenzar a escribir'
        : 'Reparte 10 puntos para comenzar';
    }

    function intentarEmpezarDesdeTotal(evento) {
      if (evento) {
        evento.preventDefault();
      }
      if (calcularTotal() !== LIMITE_TOTAL) return;
      if (btnInicioEl && !btnInicioEl.disabled) {
        btnInicioEl.click();
        return;
      }
      if (typeof inicioJuego === 'function') {
        inicioJuego();
      }
    }

  
        // Delegación de eventos: manejar todos los botones desde el contenedor
        container.addEventListener('click', e => {
          const boton = e.target.closest('button[data-action]');
          if (!boton) return;
          e.preventDefault(); // Prevenir cualquier comportamiento por defecto
          const action = boton.dataset.action;
          const atributoDiv = boton.closest('.atributo');
          if (!atributoDiv) return;
          const key = atributoDiv.dataset.atributo;
          const contadorEl = atributoDiv.querySelector('.contador');
          let indicePunto = null;
  
          if (action === 'increment' && calcularTotal() < LIMITE_TOTAL) {
            atributos[key]++;
            indicePunto = atributos[key] - 1;
          } else if (action === 'decrement' && atributos[key] > 0) {
            atributos[key]--;
            indicePunto = atributos[key];
          } else {
            return;
          }

          // Animación de pulsación en el botón
          boton.classList.remove('is-pressed');
          void boton.offsetWidth;
          boton.classList.add('is-pressed');
          setTimeout(() => boton.classList.remove('is-pressed'), 360);

          // Barrido de fila para dar feedback visual al cambio
          atributoDiv.classList.remove('is-burst');
          void atributoDiv.offsetWidth;
          atributoDiv.classList.add('is-burst');
          setTimeout(() => atributoDiv.classList.remove('is-burst'), 500);

          // Pequeño "pop" en el punto afectado
          if (indicePunto !== null) {
            const puntos = atributoDiv.querySelectorAll('.punto');
            const punto = puntos[indicePunto];
            if (punto) {
              punto.classList.remove('pop');
              void punto.offsetWidth;
              punto.classList.add('pop');
              setTimeout(() => punto.classList.remove('pop'), 450);
            }
          }

          // Animación del valor numérico del atributo
          if (contadorEl) {
            contadorEl.classList.remove('is-changing');
            void contadorEl.offsetWidth;
            contadorEl.classList.add('is-changing');
            setTimeout(() => contadorEl.classList.remove('is-changing'), 320);
          }

          actualizarInterfaz();
        });

        if (totalWrapEl) {
          totalWrapEl.addEventListener('click', (evento) => {
            intentarEmpezarDesdeTotal(evento);
          });
          totalWrapEl.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
              intentarEmpezarDesdeTotal(evento);
            }
          });
        }
  
        // Inicializar interfaz
        actualizarInterfaz();
      });
