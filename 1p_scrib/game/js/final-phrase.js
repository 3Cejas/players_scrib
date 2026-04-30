let progreso_frase_final_intensidad = 0;
let progreso_frase_final_ultimo_match = 0;
const TAGS_SALTO_LINEA_FRASE_FINAL = new Set(["BR", "DIV", "P", "LI"]);

function estiloProgresoFraseFinal(intensidad) {
    const t = Math.max(0, Math.min(1, intensidad));
    const saturation = Math.round(t * 100);
    const lightness = Math.round(96 - (t * 40));
    const glowSize = (0.08 + (t * 0.6)).toFixed(2);
    const glowAlpha = (0.03 + (t * 0.6)).toFixed(2);
    return {
        color: `hsl(32, ${saturation}%, ${lightness}%)`,
        textShadow: `0 0 ${glowSize}em rgba(255, 140, 0, ${glowAlpha})`,
    };
}

function limpiarMarcadoFraseFinal() {
    if (!texto) return;
    const spans = texto.querySelectorAll(".frase-final-progreso");
    spans.forEach((span) => {
        const parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
        parent.normalize();
    });
    progreso_frase_final_intensidad = 0;
    progreso_frase_final_ultimo_match = 0;
}

function animarFalloFraseFinal() {
    if (!texto) return;
    texto.classList.remove("frase-final-fallo");
    void texto.offsetWidth;
    texto.classList.add("frase-final-fallo");
    texto.addEventListener(
        "animationend",
        () => texto.classList.remove("frase-final-fallo"),
        { once: true }
    );
}

function obtenerTextoPlanoConSaltosFraseFinal(elemento) {
    let contenido = "";

    function recorrer(nodo, esRaiz) {
        if (nodo.nodeType === Node.TEXT_NODE) {
            contenido += nodo.textContent;
            return;
        }
        if (nodo.nodeType !== Node.ELEMENT_NODE) return;

        const tag = nodo.tagName;
        if (tag === "BR") {
            contenido += "\n";
            return;
        }

        const hijos = nodo.childNodes;
        if (!hijos || hijos.length === 0) {
            if (!esRaiz && TAGS_SALTO_LINEA_FRASE_FINAL.has(tag)) {
                contenido += "\n";
            }
            return;
        }

        for (let i = 0; i < hijos.length; i++) {
            recorrer(hijos[i], false);
        }

        if (!esRaiz && TAGS_SALTO_LINEA_FRASE_FINAL.has(tag)) {
            if (contenido.length === 0 || contenido[contenido.length - 1] !== "\n") {
                contenido += "\n";
            }
        }
    }

    recorrer(elemento, true);
    return contenido;
}

function contarCaretConSaltosFraseFinal(elemento, range) {
    let caretPos = 0;
    let encontrado = false;

    function agregarTexto(textoNodo) {
        caretPos += textoNodo.length;
    }

    function agregarSalto() {
        caretPos += 1;
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
            if (!esRaiz && TAGS_SALTO_LINEA_FRASE_FINAL.has(tag)) {
                agregarSalto();
            }
            return;
        }

        for (let i = 0; i < hijos.length; i++) {
            recorrer(hijos[i], false);
            if (encontrado) return;
        }

        if (!esRaiz && TAGS_SALTO_LINEA_FRASE_FINAL.has(tag)) {
            agregarSalto();
        }
    }

    recorrer(elemento, true);
    return caretPos;
}

function obtenerOffsetCaretEnTexto() {
    if (!texto) return 0;
    const textoPlano = obtenerTextoPlanoConSaltosFraseFinal(texto);
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return textoPlano.length;
    const range = sel.getRangeAt(0);
    if (!texto.contains(range.startContainer)) return textoPlano.length;
    return contarCaretConSaltosFraseFinal(texto, range);
}

function colocarCaretEnOffset(offset) {
    if (!texto) return;
    const sel = window.getSelection();
    if (!sel) return;

    let restante = Math.max(0, Number(offset) || 0);
    let destinoNodo = null;
    let destinoOffset = 0;

    function fijarDestino(nodo, offsetNodo) {
        if (destinoNodo) return;
        destinoNodo = nodo;
        destinoOffset = offsetNodo;
    }

    function recorrer(nodo, esRaiz) {
        if (destinoNodo) return;

        if (nodo.nodeType === Node.TEXT_NODE) {
            const length = nodo.textContent.length;
            if (restante <= length) {
                fijarDestino(nodo, Math.max(0, Math.min(length, restante)));
                return;
            }
            restante -= length;
            return;
        }

        if (nodo.nodeType !== Node.ELEMENT_NODE) return;

        const tag = nodo.tagName;
        if (tag === "BR") {
            if (restante === 0) {
                const padre = nodo.parentNode;
                if (padre) {
                    const indice = Array.prototype.indexOf.call(padre.childNodes, nodo);
                    fijarDestino(padre, indice + 1);
                }
                return;
            }
            restante = Math.max(0, restante - 1);
            return;
        }

        const hijos = nodo.childNodes;
        if (!hijos || hijos.length === 0) {
            if (!esRaiz && TAGS_SALTO_LINEA_FRASE_FINAL.has(tag)) {
                if (restante === 0) {
                    fijarDestino(nodo, 0);
                    return;
                }
                restante = Math.max(0, restante - 1);
            }
            return;
        }

        for (let i = 0; i < hijos.length; i++) {
            recorrer(hijos[i], false);
            if (destinoNodo) return;
        }

        if (!esRaiz && TAGS_SALTO_LINEA_FRASE_FINAL.has(tag)) {
            if (restante === 0) {
                fijarDestino(nodo, hijos.length);
                return;
            }
            restante = Math.max(0, restante - 1);
        }
    }

    recorrer(texto, true);

    const range = document.createRange();
    if (destinoNodo) {
        range.setStart(destinoNodo, destinoOffset);
    } else if (texto.lastChild) {
        range.selectNodeContents(texto);
        range.collapse(false);
    } else {
        range.setStart(texto, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function obtenerRangoUltimosCaracteres(cantidad) {
    if (!texto || cantidad <= 0) return null;
    const sel = window.getSelection();
    if (!sel) return null;
    const original = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const range = document.createRange();
    range.selectNodeContents(texto);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    let resultado = null;
    if (typeof sel.modify === "function") {
        for (let i = 0; i < cantidad; i++) {
            sel.modify("extend", "backward", "character");
        }
        resultado = sel.getRangeAt(0).cloneRange();
    } else {
        const textoPlano = texto.textContent || "";
        const inicio = Math.max(0, textoPlano.length - cantidad);
        resultado = obtenerRangoPorOffsets(texto, inicio, inicio + cantidad);
    }
    sel.removeAllRanges();
    if (original) {
        sel.addRange(original);
    }
    return resultado;
}

function actualizarProgresoFraseFinal() {
    if (!texto) return;
    const objetivo = (typeof str_frase_final === "string" ? str_frase_final : "").toLowerCase();
    if (!objetivo) {
        limpiarMarcadoFraseFinal();
        return;
    }
    const textoPlano = (texto.innerText || "").toLowerCase();
    const max = Math.min(textoPlano.length, objetivo.length);
    let matchLen = 0;
    for (let len = max; len > 0; len--) {
        if (textoPlano.endsWith(objetivo.slice(0, len))) {
            matchLen = len;
            break;
        }
    }
    if (progreso_frase_final_ultimo_match > 0 && matchLen === 0) {
        animarFalloFraseFinal();
    }
    const caretOffset = obtenerOffsetCaretEnTexto();
    limpiarMarcadoFraseFinal();
    if (matchLen === 0) {
        colocarCaretEnOffset(caretOffset);
        return;
    }
    const rango = obtenerRangoUltimosCaracteres(matchLen);
    if (!rango) {
        colocarCaretEnOffset(caretOffset);
        return;
    }
    const span = document.createElement("span");
    span.className = "frase-final-progreso";
    const ratio = Math.max(0, Math.min(1, matchLen / objetivo.length));
    const intensidadObjetivo = Math.pow(ratio, 1.6);
    const estiloPrevio = estiloProgresoFraseFinal(progreso_frase_final_intensidad);
    const estiloObjetivo = estiloProgresoFraseFinal(intensidadObjetivo);
    span.style.color = estiloPrevio.color;
    span.style.textShadow = estiloPrevio.textShadow;
    try {
        rango.surroundContents(span);
    } catch (err) {
        const fragmento = rango.extractContents();
        span.appendChild(fragmento);
        rango.insertNode(span);
    }
    requestAnimationFrame(() => {
        if (!span.isConnected) return;
        span.style.color = estiloObjetivo.color;
        span.style.textShadow = estiloObjetivo.textShadow;
    });
    progreso_frase_final_intensidad = intensidadObjetivo;
    progreso_frase_final_ultimo_match = matchLen;
    colocarCaretEnOffset(caretOffset);
}


function marcarPalabraBenditaRango(inicio, fin) {
    if (!texto) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    if (!Number.isInteger(inicio) || !Number.isInteger(fin)) return;
    const rango = obtenerRangoPorOffsets(texto, inicio, fin);
    if (!rango) return;
    const contenido = rango.toString();
    if (!contenido || !contenido.trim()) return;
    if (rangoIntersecaPalabraMarcada(rango)) return;
    const span = document.createElement("span");
    span.className = CLASE_PALABRA_BENDITA_LOCAL;
    span.setAttribute("contenteditable", "false");
    const fragmento = rango.extractContents();
    span.appendChild(fragmento);
    rango.insertNode(span);
    const nuevoRango = document.createRange();
    nuevoRango.setStartAfter(span);
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
}



