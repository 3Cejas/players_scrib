let borrado; // Variable que almacena el identificador de la funciÃ³n temporizada de borrado.
let atributos;
const LIMITE_TOTAL = 10;
const SECS_BASE = 2;
const maxIncremento =  3; // queremos +300% de habilidades en el mejor caso
const maxIncrementoDestreza =  0.5; // queremos +300% de habilidades en el mejor caso
let secs_palabras = SECS_BASE;
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
let countInterval; // Variable que almacena el identificador de la funciÃ³n que serÃ¡ ejecutada cada x segundos para uso para actualizar el contador.
let cambio_palabra; // Variable que almacena el identificador de la funciÃ³n temporizada de cambio de palabra.
let blurreado = false; // Variable booleana que si alguno de los dos textos ha sido blurreado.
let puntuacion = 0; // Variable entera que almacena la puntuaciÃ³n de la palabra bonus.
let puntos_ = 0; // Puntos del jugador 1.
let puntos_escritura = 0;
let puntuacion_acumulada_j2 = 0;
let delay_animacion;
let delay_animacion_tiempo;
let envio_puntos;
let caracteres_seguidos = 0;
puntos_letra_prohibida = 0;
puntos_letra_bendita = 0;
//let saltos_lÃ­nea_alineacion_1 = 0; // Variable entera que almacena los saltos de lÃ­nea del jugador 1 para alÃ­near los textos.
//let saltos_lÃ­nea_alineacion_2 = 0; // Variable entera que almacena los saltos de lÃ­nea del jugador 2 para alÃ­near los textos.
const color_negativo = "red";
const color_positivo = "greenyellow";
let isFullscreen = false;
let menu_modificador = false;
let focusedButtonIndex = 0;
let modificadorButtons = [];
let revision_borrado_escritora = 0;

function mostrarFeedbackTiempoEscritora(texto, tipo, color) {
  const contenido = String(texto ?? "").trim();
  if (!contenido) return;

  if (typeof mostrarFeedbackFlotanteEscritora === "function") {
    mostrarFeedbackFlotanteEscritora(contenido, { tipo, color });
    if (typeof feedback !== "undefined" && feedback) {
      feedback.innerHTML = "";
    }
    return;
  }

  if (typeof feedback !== "undefined" && feedback) {
    feedback.style.color = color || "";
    feedback.innerHTML = contenido;
    clearTimeout(delay_animacion);
    animateCSS(".feedback1", "flash").then(() => {
      delay_animacion = setTimeout(() => {
        feedback.innerHTML = "";
      }, 2000);
    });
  }
}

function normalizarValorAtributoEscritora(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  return Math.max(0, Math.min(LIMITE_TOTAL, Math.trunc(numero)));
}

function normalizarAtributosEscritora(valor = {}) {
  const data = (valor && typeof valor === "object") ? valor : {};
  return {
    fuerza: normalizarValorAtributoEscritora(data.fuerza),
    agilidad: normalizarValorAtributoEscritora(data.agilidad),
    destreza: normalizarValorAtributoEscritora(data.destreza)
  };
}

function calcularSegundosPalabrasPorFuerzaEscritora(fuerza) {
  const fuerzaNormalizada = normalizarValorAtributoEscritora(fuerza);
  if (typeof ajustarFuerza === "function") {
    try {
      const ajustado = Number(ajustarFuerza(SECS_BASE, fuerzaNormalizada));
      if (Number.isFinite(ajustado) && ajustado > 0) {
        return Math.max(1, Math.trunc(ajustado));
      }
    } catch (_error) {}
  }
  if (fuerzaNormalizada === 0) {
    return Math.round(SECS_BASE);
  }
  const factorLog = Math.log(fuerzaNormalizada + 1) / Math.log(LIMITE_TOTAL + 1);
  return Math.max(1, Math.round(SECS_BASE * (1 + (maxIncremento * factorLog))));
}

function recalcularBonosAtributosEscritora(opciones = {}) {
  atributos = normalizarAtributosEscritora(atributos);
  secs_palabras = calcularSegundosPalabrasPorFuerzaEscritora(atributos.fuerza);

  if (typeof ajustarRapidez === "function") {
    try {
      ajustarRapidez(rapidez_borrado, rapidez_inicio_borrado, atributos.agilidad);
    } catch (_error) {}
  }

  const tiempoModificadorBase = Number(opciones.tiempoModificadorBase);
  if (
    Number.isFinite(tiempoModificadorBase)
    && tiempoModificadorBase > 0
    && typeof TIEMPO_MODIFICADOR !== "undefined"
    && typeof ajustarDestreza === "function"
  ) {
    try {
      const ajusteDestreza = Number(ajustarDestreza(tiempoModificadorBase, atributos.destreza));
      if (Number.isFinite(ajusteDestreza)) {
        TIEMPO_MODIFICADOR = tiempoModificadorBase + ajusteDestreza;
      }
    } catch (_error) {}
  }

  return secs_palabras;
}

function pintarAtributosUiEscritora() {
  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") {
    return;
  }
  const atributosNormalizados = normalizarAtributosEscritora(atributos);
  const total = Object.values(atributosNormalizados).reduce((suma, valor) => suma + valor, 0);
  document.querySelectorAll(".atributo").forEach((div) => {
    const key = div && div.dataset ? div.dataset.atributo : "";
    const valor = atributosNormalizados[key] || 0;
    const contadorEl = div.querySelector ? div.querySelector(".contador") : null;
    if (contadorEl) {
      contadorEl.textContent = valor;
    }
    if (div.querySelectorAll) {
      div.querySelectorAll(".punto").forEach((el, idx) => {
        if (el && el.classList) {
          el.classList.toggle("filled", idx < valor);
        }
      });
    }
  });
  const totalUsadosEl = document.getElementById ? document.getElementById("total-usados") : null;
  if (totalUsadosEl) {
    totalUsadosEl.textContent = total;
  }
  const totalWrapEl = document.getElementById ? document.getElementById("total") : null;
  if (totalWrapEl) {
    totalWrapEl.classList.toggle("total-ready", total === LIMITE_TOTAL);
    totalWrapEl.setAttribute("aria-disabled", total === LIMITE_TOTAL ? "false" : "true");
    totalWrapEl.tabIndex = total === LIMITE_TOTAL ? 0 : -1;
  }
  const btnInicioEl = document.getElementById ? document.getElementById("btnInicio") : null;
  if (btnInicioEl) {
    btnInicioEl.disabled = total !== LIMITE_TOTAL;
  }
}

function aplicarAtributosEscritora(nuevosAtributos = {}, opciones = {}) {
  atributos = normalizarAtributosEscritora(nuevosAtributos);
  const segundos = recalcularBonosAtributosEscritora(opciones);
  pintarAtributosUiEscritora();
  return segundos;
}

function obtenerSegundosPalabrasEscritora() {
  const actual = Number(secs_palabras);
  if (Number.isFinite(actual) && actual > 0) {
    return Math.max(1, Math.trunc(actual));
  }
  return recalcularBonosAtributosEscritora();
}

let lastLine;
let lastTextNode;

let caretPos;
let caretNode;

function cancelarTemporizadorBorradoEscritora() {
  clearTimeout(borrado);
  borrado = null;
}

function invalidarBorradoEscritora() {
  revision_borrado_escritora += 1;
  cancelarTemporizadorBorradoEscritora();
  return revision_borrado_escritora;
}

function programarBorradoEscritora(delayMs, callback) {
  const revisionProgramada = revision_borrado_escritora;
  cancelarTemporizadorBorradoEscritora();
  borrado = setTimeout(() => {
    if (revisionProgramada !== revision_borrado_escritora) {
      return;
    }
    callback(revisionProgramada);
  }, delayMs);
  return revisionProgramada;
}

function estaBloqueadoBorradoEscritora() {
  return typeof bloquear_borrado_putada !== "undefined" && bloquear_borrado_putada === true;
}

function posponerBorradoAutomaticoBloqueado() {
  if (!estaBloqueadoBorradoEscritora()) return false;
  programarBorradoEscritora(rapidez_borrado, (revisionProgramada) => {
    borrar(revisionProgramada);
  });
  return true;
}



document.addEventListener('keydown', function(event) {
});

// FunciÃ³n para guardar la posiciÃ³n del caret
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
  if (!caretNode) return;
  let sel = window.getSelection();
  if (!sel) return;
  let range = (sel.rangeCount > 0) ? sel.getRangeAt(0) : document.createRange();
  const longitudNodo = typeof caretNode.length === "number"
    ? caretNode.length
    : (typeof caretNode.textContent === "string" ? caretNode.textContent.length : 0);
  const offsetSeguro = Math.min(Math.max(0, caretPos), longitudNodo);
  range.setStart(caretNode, offsetSeguro);
  range.setEnd(caretNode, offsetSeguro);
  sel.removeAllRanges();
  sel.addRange(range);
}

function obtenerUltimoNodoEditable() {
  if (window.ScribEditorDeletion && typeof window.ScribEditorDeletion.obtenerUltimoNodoTextoEditable === "function") {
    return window.ScribEditorDeletion.obtenerUltimoNodoTextoEditable(texto, {
      protectedClasses: [CLASE_PALABRA_BENDITA, CLASE_PALABRA_MUSA, CLASE_LETRA_BENDITA]
    });
  }
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
  if (window.ScribEditorDeletion && typeof window.ScribEditorDeletion.borrarUltimoCaracterEditable === "function") {
    return window.ScribEditorDeletion.borrarUltimoCaracterEditable(texto, {
      protectedClasses: [CLASE_PALABRA_BENDITA, CLASE_PALABRA_MUSA, CLASE_LETRA_BENDITA]
    }).deleted;
  }
  const nodo = obtenerUltimoNodoEditable();
  if (!nodo || !nodo.data) return false;
  nodo.data = nodo.data.substring(0, nodo.data.length - 1);
  if (nodo.data.length === 0 && nodo.parentNode) {
    nodo.parentNode.removeChild(nodo);
  }
  return true;
}

function nodoPerteneceAlEditor(nodo) {
  if (!texto || !nodo) return false;
  if (nodo === texto) return true;
  if (typeof texto.contains === "function") {
    try {
      return texto.contains(nodo);
    } catch (_error) {
      return false;
    }
  }
  let actual = nodo;
  while (actual) {
    if (actual === texto) return true;
    actual = actual.parentNode;
  }
  return false;
}

function borrar(revisionEsperada = revision_borrado_escritora) {
  if (revisionEsperada !== revision_borrado_escritora) {
    return;
  }
  if (modo_actual === "frase final") {
    cancelarTemporizadorBorradoEscritora();
    return;
  }
  if (posponerBorradoAutomaticoBloqueado()) {
    return;
  }
  if (!desactivar_borrar) {
    // 1. Guardar la posiciÃ³n del caret usando la funciÃ³n
    let { caretNode, caretPos } = guardarPosicionCaret();
    const haBorrado = borrarUltimoCaracterEditable();
    if (!haBorrado) {
      cancelarTemporizadorBorradoEscritora();
      sendText();
      return;
    }

    // 2. CÃ³digo existente

    tiempo_feed = "-0.05 insp.";
    mostrarFeedbackTiempoEscritora(tiempo_feed, "borrar", color_negativo);

    color = color_negativo;
    tiempo_feed = "-0.05 insp.";
    socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "borrar" });
    caracteres_seguidos = 0;

    // 8. Actualizar estado
    if(texto.innerText.match(/\b\w+\b/g) != null){
      puntos_ = texto.innerText.match(/\b\w+\b/g).length;
    } else {
      puntos_ = 0;
    }
    if (typeof actualizarPuntosMarcador === "function") {
      actualizarPuntosMarcador(`${puntos_} palabras`);
    } else {
      puntos.innerHTML = puntos_ + " palabras";
    }
    //cambio_nivel(puntos_);
    programarBorradoEscritora(rapidez_borrado, (revisionProgramada) => {
      borrar(revisionProgramada);
      console.log(rapidez_borrado, "rapidez_borrado")
    });

    // 9. Reposicionar caret usando la funciÃ³n
    
    if (caretNode && nodoPerteneceAlEditor(caretNode)) {
      restaurarPosicionCaret(caretNode, caretPos);
    } else if (typeof colocarCursorAlFinalEditor === "function") {
      colocarCursorAlFinalEditor();
    }

  } else {
    cancelarTemporizadorBorradoEscritora();
  }
  
  // 10. EnvÃ­o de texto
  sendText();
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
    actualizarPuntosMarcador(`${puntos_} palabras`);
  } else {
    puntos.innerHTML = puntos_ + " palabras";
  }
  //cambio_nivel(puntos_);
  cancelarTemporizadorBorradoEscritora();
  
  // Ahora, en lugar de contar los caracteres, incrementamos palabras_seguidas si el recuento de palabras ha aumentado
  if (puntos_ > lastWordCount) {
    caracteres_seguidos += 1;
  }

  if (caracteres_seguidos == 3 && modo_actual !== "frase final") {
    const miniInspiracion = obtenerSegundosPalabrasEscritora() / 10;
    tiempo_feed = `+${miniInspiracion.toFixed(1)} insp.`;
    mostrarFeedbackTiempoEscritora(tiempo_feed, "mini_inspiracion", color_positivo);
    caracteres_seguidos = 0; // Reseteamos el contador de palabras seguidas
    console.log("fuerza: " + miniInspiracion);
    color = color_positivo;
    socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "mini_inspiracion"});
  }
  console.log(rapidez_borrado, rapidez_inicio_borrado);
  if (modo_actual !== "frase final") {
    programarBorradoEscritora(rapidez_inicio_borrado, (revisionProgramada) => {
      borrar(revisionProgramada);
    });
  }

}

window.countChars = countChars;



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
const animateCSS = window.ScribRuntime.animateCSS;

       // Esperar a que el DOM estÃ© completamente cargado
       document.addEventListener('DOMContentLoaded', () => {
        // Estado inicial de los atributos
        atributos = normalizarAtributosEscritora(atributos);
  
        // Referencias a elementos del DOM
        const container = document.getElementById('atributos-container');
        const totalUsadosEl = document.getElementById('total-usados');
        const totalWrapEl = document.getElementById('total');
        const btnInicioEl = document.getElementById('btnInicio');
  
        // FunciÃ³n para calcular la suma total
        function calcularTotal() {
          return Object.values(atributos).reduce((a, b) => a + b, 0);
        }
  
    // FunciÃ³n para actualizar toda la interfaz tras un cambio
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

        // Actualiza la UI numÃ©rica
        if (contadorEl) {
          contadorEl.textContent = valor;
        }

        // Deshabilita botones segÃºn reglas
        btnMenos.disabled = (valor === 0);
        btnMas.disabled   = (total >= LIMITE_TOTAL);

        // Sincroniza el botÃ³n de inicio legacy (oculto visualmente)
        if (btnInicioEl) {
          btnInicioEl.disabled = (total !== LIMITE_TOTAL);
        }

        // Rellena los puntitos de la barra segÃºn valor
        puntos.forEach((el, idx) => {
          el.classList.toggle('filled', idx < valor);
        });
      });

      // 3) Actualiza el nÃºmero total en pantalla
      totalUsadosEl.textContent = total;
      actualizarTotalComoBoton(total);

      // 4) Aplica clases de color segÃºn porcentaje usado
      //    Calculamos ratio de uso (puede superar 1 si excede)
      const ratio = total / LIMITE_TOTAL;
      const ratioAjustado = Math.max(0, Math.min(ratio, 1));

      // La cÃ¡psula de puntos usados transita de color:
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

  
        // DelegaciÃ³n de eventos: manejar todos los botones desde el contenedor
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

          // AnimaciÃ³n de pulsaciÃ³n en el botÃ³n
          boton.classList.remove('is-pressed');
          void boton.offsetWidth;
          boton.classList.add('is-pressed');
          setTimeout(() => boton.classList.remove('is-pressed'), 360);

          // Barrido de fila para dar feedback visual al cambio
          atributoDiv.classList.remove('is-burst');
          void atributoDiv.offsetWidth;
          atributoDiv.classList.add('is-burst');
          setTimeout(() => atributoDiv.classList.remove('is-burst'), 500);

          // PequeÃ±o "pop" en el punto afectado
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

          // AnimaciÃ³n del valor numÃ©rico del atributo
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
