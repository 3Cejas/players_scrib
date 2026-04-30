function insertarConRetrasoTecladoLento(contenido, esSaltoLinea = false) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0).cloneRange();
    if (!texto.contains(range.commonAncestorContainer)) return false;

    range.deleteContents();

    if (esSaltoLinea) {
        const salto = document.createElement("br");
        range.insertNode(salto);
        range.setStartAfter(salto);
    } else {
        const valor = String(contenido ?? "");
        if (!valor) return false;
        const nodoTexto = document.createTextNode(valor);
        range.insertNode(nodoTexto);
        range.setStartAfter(nodoTexto);
    }

    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    texto.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
}

texto.addEventListener("beforeinput", (e) => {
    if (debeVigilarMutacionProtegida(e.inputType)) {
        snapshot_html_bendita = texto.innerHTML;
        snapshot_offset_bendita = obtenerOffsetCaretEnTexto();
        snapshot_cantidad_benditas = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA).length;
        snapshot_input_type_bendita = String(e.inputType || "");
        snapshot_input_data_bendita = e.data ?? "";
    } else {
        limpiarSnapshotProtegido();
    }
    if (debeBloquearEdicionPalabraBendita(e)) {
        e.preventDefault();
        limpiarSnapshotProtegido();
        return;
    }
    if (!teclado_lento_putada) return;
    if (
        e.inputType === "insertText" ||
        e.inputType === "insertParagraph" ||
        e.inputType === "insertLineBreak"
    ) {
        e.preventDefault();
        limpiarSnapshotProtegido();
        const esSaltoLinea = e.inputType === "insertParagraph" || e.inputType === "insertLineBreak";
        const data = esSaltoLinea ? "\n" : (e.data ?? "");
        setTimeout(() => {
            if (!teclado_lento_putada) return;
            insertarConRetrasoTecladoLento(data, esSaltoLinea);
        }, RETRASO_TECLADO_LENTO_MS);
    }
});

texto.addEventListener("input", () => {
    if (!snapshot_html_bendita) return;
    const cantidad_actual = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA).length;
    if (cantidad_actual < snapshot_cantidad_benditas) {
        restaurando_bendita = true;
        texto.innerHTML = snapshot_html_bendita;
        if (Number.isFinite(snapshot_offset_bendita)) {
            colocarCaretEnOffset(snapshot_offset_bendita);
        }
        reinsertarEntradaTrasRestauracionProtegida();
        countChars(texto);
        setTimeout(() => {
            restaurando_bendita = false;
        }, 0);
    }
    limpiarSnapshotProtegido();
});
  

let punteroInicio = 0;  // Global que representa el inicio del texto a verificar en la siguiente iteración

function ajustarPunteros(texto) {
    let punteroFinal = texto.length;

    // Si el punteroFinal está en medio de una palabra, retrocede hasta el espacio anterior
    while (punteroFinal > punteroInicio && texto[punteroFinal - 1] !== ' ') {
        punteroFinal--;
    }

    // Ahora, si el punteroInicio está en medio de una palabra, avanza hasta el espacio siguiente
    while (punteroInicio < punteroFinal && texto[punteroInicio] !== ' ') {
        punteroInicio++;
    }

    return texto.substring(punteroInicio, punteroFinal).trim();  // trim() para eliminar espacios adicionales
}

 // Función que invierte las letras de cada palabra pero NO el orden de las palabras.
 function invertirPalabras(texto) {
    return texto
      .split(' ')                         // Separa por espacios
      .map(palabra => palabra.split('').reverse().join('')) 
      .join(' ');
  }

  /**
   * Función recursiva que:
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
    // podrías añadir más condiciones. Si no, simplemente retorna el nodo tal cual.
    return nodo.cloneNode(true);
  }

  function procesarTexto() {
    console.log("ESTO NO PARAAAAAAAAAAA")
    // El contenedor original
    // Creamos un fragmento para ir colocando los nodos procesados
    const fragmento = document.createDocumentFragment();

    // Recorremos los childNodes del div con id="texto"
    texto.childNodes.forEach(nodo => {
      // Procesamos cada nodo (ya sea texto o elemento) y lo añadimos al fragmento
      fragmento.appendChild(procesarNodo(nodo));
    });

    // Limpiamos el contenido original y lo reemplazamos con el fragmento procesado
    texto.innerHTML = "";
    texto.appendChild(fragmento);
  }

function efectoMaquinaDeEscribir(elemento, textoHtml, velocidad = 50) {
  // Reiniciar la bandera al inicio para permitir nuevas ejecuciones
  pararEscritura = false;

  // Asegurar salto de línea inicial si el contenido actual no termina con <br>
  let contenidoInicial = elemento.innerHTML.trim(); // Limpiamos espacios innecesarios
  if (!contenidoInicial.endsWith("<br>")) {
    contenidoInicial += "<br>"; // Añadimos un salto de línea si no está presente
  }

  let contenidoEscrito = contenidoInicial; // Inicializamos con el contenido previo
  let cursor = 0;                          // Índice para recorrer el texto

  // Añadir los saltos de línea adicionales al texto
  textoHtml = "<br>" + textoHtml + "<br><br>";

  // Desactiva la edición temporal
  elemento.contentEditable = "false";

  // ---- Función para colocar el cursor justo al final ----
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

  // ---- Función recursiva para escribir el texto ----
  function escribir() {
    // Verificar si se ha solicitado detener la escritura
    if (pararEscritura) {
      return; // Salimos de la función para detener la recursión
    }

    if (cursor < textoHtml.length) {
      // Detectamos etiquetas HTML para escribirlas completas de golpe
      if (textoHtml.substring(cursor).startsWith("<")) {
        const finEtiqueta = textoHtml.indexOf(">", cursor) + 1;
        contenidoEscrito += textoHtml.substring(cursor, finEtiqueta);
        cursor = finEtiqueta;
      } else {
        // Caso normal: añadimos un carácter
        contenidoEscrito += textoHtml.charAt(cursor);
        cursor++;
      }

      // Actualizamos el contenido en el elemento
      elemento.innerHTML = contenidoEscrito;
      elemento.scrollTop = elemento.scrollHeight;  // Scroll al final

      // Continuamos con un pequeño retraso
      setTimeout(escribir, velocidad);
    } else {
      // Cuando terminamos
      elemento.contentEditable = "true";          // Reactivamos edición
      colocarCursorAlFinal(elemento);            // Cursor al final
      elemento.focus();                          // Enfocamos el elemento
    }
    
  }

  // Inicia el proceso de escritura
  escribir();
}

// Función para detener el efecto de la máquina de escribir
function detenerEfectoMaquina() {
  pararEscritura = true;
}


function confetti_musas(){
var scalar = 2;
var unicorn = confetti.shapeFromText({ text: '⭐', scalar });
isConfettiRunning = true;

var end = Date.now() + (2 * 1000);

// go Buckeyes!
(function frame() {
  confetti({
    startVelocity: 10,
    particleCount: 1,
    angle: 270,
    spread: 1000,
    origin: { y: 0 },
    shapes: [unicorn],
    scalar: 3
  });

  if ((Date.now() < end) && isConfettiRunning) {
    requestAnimationFrame(frame);
  }
}());
}

var textarea = texto;

const CLASES_FADE_TEXTAREA_ESCRITOR = [
    "textarea-fade-none",
    "textarea-fade-top",
    "textarea-fade-bottom",
    "textarea-fade-both"
];
var raf_degradado_textarea_escritor = null;
var observador_degradado_textarea_escritor = null;
var observador_resize_textarea_escritor = null;
var degradado_textarea_escritor_iniciado = false;

function actualizarDegradadoDinamicoTextoEscritor() {
    if (!textarea || !textarea.classList) return;
    const gradientTop = document.getElementById("gradientTop");
    const gradientBottom = document.getElementById("gradientBottom");
    const clientHeight = textarea.clientHeight || 0;
    const scrollHeight = textarea.scrollHeight || 0;
    let claseObjetivo = "textarea-fade-none";
    let opacidadTop = "0";
    let opacidadBottom = "0";

    if (!(clientHeight <= 0 || textarea.style.display === "none")) {
        const margen = 2;
        const tieneOverflow = (scrollHeight - clientHeight) > margen;
        const scrollTop = Math.max(0, textarea.scrollTop || 0);
        const ocultoArriba = tieneOverflow && (scrollTop > margen);
        const ocultoAbajo = tieneOverflow && ((scrollTop + clientHeight) < (scrollHeight - margen));

        if (ocultoArriba && ocultoAbajo) {
            claseObjetivo = "textarea-fade-both";
        } else if (ocultoArriba) {
            claseObjetivo = "textarea-fade-top";
        } else if (ocultoAbajo) {
            claseObjetivo = "textarea-fade-bottom";
        }

        opacidadTop = ocultoArriba ? "1" : "0";
        opacidadBottom = ocultoAbajo ? "1" : "0";
    }

    const claseActual = CLASES_FADE_TEXTAREA_ESCRITOR.find((clase) => textarea.classList.contains(clase));
    if (claseActual !== claseObjetivo) {
        CLASES_FADE_TEXTAREA_ESCRITOR.forEach((clase) => textarea.classList.remove(clase));
        textarea.classList.add(claseObjetivo);
    }

    if (gradientTop && gradientTop.style.opacity !== opacidadTop) {
        gradientTop.style.opacity = opacidadTop;
    }
    if (gradientBottom && gradientBottom.style.opacity !== opacidadBottom) {
        gradientBottom.style.opacity = opacidadBottom;
    }
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
            characterData: true
        });
    }

    if (typeof ResizeObserver === "function") {
        observador_resize_textarea_escritor = new ResizeObserver(() => {
            programarActualizacionDegradadoTextoEscritor();
        });
        observador_resize_textarea_escritor.observe(textarea);
    }

    programarActualizacionDegradadoTextoEscritor();
    setTimeout(programarActualizacionDegradadoTextoEscritor, 120);
}

let uiJuego1PInicializada = false;

function inicializarArranqueUIJuego1P() {
    if (uiJuego1PInicializada) return;
    uiJuego1PInicializada = true;
    setIdiomaJuego1P(idioma_juego_1p, { persistir: false });
    iniciarDegradadoDinamicoTextoEscritor();
    actualizarBotonesSilencioJuego();
    iniciarCargaInicialEscritxr();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarArranqueUIJuego1P, { once: true });
} else {
    inicializarArranqueUIJuego1P();
}

/*document.addEventListener('DOMContentLoaded', function () {
    const gradientTop = document.getElementById('gradientTop');
    const gradientBottom = document.getElementById('gradientBottom');

    function updateGradients() {
        const scrollTop = textarea.scrollTop;
        const scrollHeight = textarea.scrollHeight;
        const clientHeight = textarea.clientHeight;

        if (scrollTop > 0) {
            gradientTop.style.opacity = '1';
        } else {
            gradientTop.style.opacity = '0';
        }

        if (scrollTop + clientHeight < scrollHeight) {
            gradientBottom.style.opacity = '1';
        } else {
            gradientBottom.style.opacity = '0';
        }
    }

    textarea.addEventListener('input', updateGradients);
    textarea.addEventListener('scroll', updateGradients);
    window.addEventListener('resize', updateGradients); // Añadido para manejar cambios de tamaño de la ventana

    // Inicialización de los gradientes al cargar la página
    updateGradients();
});*/

