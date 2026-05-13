const CLASE_PALABRA_BENDITA_LOCAL = "palabra-bendita";
const CLASE_PALABRA_MUSA_LOCAL = "palabra-musa";
const CLASE_LETRA_BENDITA_LOCAL = "letra-verde";
const SELECTOR_PALABRA_PROTEGIDA = `.${CLASE_PALABRA_BENDITA_LOCAL}, .${CLASE_PALABRA_MUSA_LOCAL}, .${CLASE_LETRA_BENDITA_LOCAL}`;
const SELECTOR_PALABRA_MARCADA = `.${CLASE_PALABRA_BENDITA_LOCAL}, .${CLASE_PALABRA_MUSA_LOCAL}`;

function rangoIntersecaPalabraMarcada(rango) {
    if (!texto || !rango) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_MARCADA);
    for (const span of spans) {
        if (rango.intersectsNode(span)) return true;
    }
    return false;
}

function nodoEnPalabraBendita(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.ELEMENT_NODE) {
        return nodo.closest(SELECTOR_PALABRA_PROTEGIDA);
    }
    if (nodo.nodeType === Node.TEXT_NODE) {
        return nodo.parentElement?.closest(SELECTOR_PALABRA_PROTEGIDA) || null;
    }
    return null;
}

function rangoIntersecaPalabraBendita(rango) {
    if (!texto || !rango) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
    for (const span of spans) {
        if (rango.intersectsNode(span)) return true;
    }
    return false;
}

function obtenerNodoProtegidoEnRango(rango) {
    if (!texto || !rango) return null;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
    for (const span of spans) {
        if (rango.intersectsNode(span)) return span;
    }
    return null;
}

function hayPalabraBenditaAdyacente(sel, direccion) {
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return rangoIntersecaPalabraBendita(range);
    const node = range.startContainer;
    const offset = range.startOffset;
    if (nodoEnPalabraBendita(node)) return true;
    let objetivo = null;
    if (node.nodeType === Node.TEXT_NODE) {
        if (direccion === "backward" && offset === 0) {
            objetivo = node.previousSibling || node.parentNode?.previousSibling;
        }
        if (direccion === "forward" && offset === node.textContent.length) {
            objetivo = node.nextSibling || node.parentNode?.nextSibling;
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        const indice = direccion === "backward" ? offset - 1 : offset;
        objetivo = node.childNodes[indice];
    }
    return Boolean(nodoEnPalabraBendita(objetivo));
}

function obtenerNodoProtegidoAdyacente(sel, direccion) {
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return obtenerNodoProtegidoEnRango(range);
    const node = range.startContainer;
    const offset = range.startOffset;
    if (nodoEnPalabraBendita(node)) return nodoEnPalabraBendita(node);
    let objetivo = null;
    if (node.nodeType === Node.TEXT_NODE) {
        if (direccion === "backward" && offset === 0) {
            objetivo = node.previousSibling || node.parentNode?.previousSibling;
        }
        if (direccion === "forward" && offset === node.textContent.length) {
            objetivo = node.nextSibling || node.parentNode?.nextSibling;
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        const indice = direccion === "backward" ? offset - 1 : offset;
        objetivo = node.childNodes[indice];
    }
    return nodoEnPalabraBendita(objetivo);
}

function obtenerRangoBorradoCaracter(direccion) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const original = sel.getRangeAt(0).cloneRange();
    if (!original.collapsed) return original;
    if (typeof sel.modify === "function") {
        sel.removeAllRanges();
        sel.addRange(original);
        sel.collapse(original.endContainer, original.endOffset);
        sel.modify("extend", direccion, "character");
        const rango = sel.getRangeAt(0).cloneRange();
        sel.removeAllRanges();
        sel.addRange(original);
        return rango;
    }
    return null;
}

function obtenerOffsetInicioNodo(nodo) {
    if (!texto || !nodo) return 0;
    const range = document.createRange();
    range.selectNodeContents(texto);
    range.setEndBefore(nodo);
    return range.toString().length;
}

function caretAfectaPalabraBendita(direccion) {
    if (!texto) return false;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return rangoIntersecaPalabraBendita(range);
    const caretOffset = obtenerOffsetCaretEnTexto();
    const targetOffset = direccion === "backward" ? caretOffset - 1 : caretOffset;
    if (targetOffset < 0) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
    for (const span of spans) {
        const inicio = obtenerOffsetInicioNodo(span);
        const fin = inicio + (span.textContent || "").length;
        if (targetOffset >= inicio && targetOffset < fin) return true;
    }
    return false;
}

function obtenerNodoProtegidoAfectadoPorDireccion(direccion) {
    if (!texto) return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return obtenerNodoProtegidoEnRango(range);
    const directo = nodoEnPalabraBendita(range.startContainer);
    if (directo) return directo;

    const caretOffset = obtenerOffsetCaretEnTexto();
    const targetOffset = direccion === "backward" ? caretOffset - 1 : caretOffset;
    if (targetOffset >= 0) {
        const spans = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA);
        for (const span of spans) {
            const inicio = obtenerOffsetInicioNodo(span);
            const fin = inicio + (span.textContent || "").length;
            if (targetOffset >= inicio && targetOffset < fin) return span;
        }
    }

    const rangoBorrado = obtenerRangoBorradoCaracter(direccion);
    const spanPorRango = obtenerNodoProtegidoEnRango(rangoBorrado);
    if (spanPorRango) return spanPorRango;

    return obtenerNodoProtegidoAdyacente(sel, direccion);
}

function obtenerNodoProtegidoAfectadoPorEdicion(e) {
    const rangosObjetivo = typeof e?.getTargetRanges === "function" ? e.getTargetRanges() : [];
    if (rangosObjetivo && rangosObjetivo.length) {
        for (const rango of rangosObjetivo) {
            const span = obtenerNodoProtegidoEnRango(rango);
            if (span) return span;
        }
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
            const spanDirecto = nodoEnPalabraBendita(range.startContainer);
            if (spanDirecto) return spanDirecto;
        } else {
            const spanSeleccionado = obtenerNodoProtegidoEnRango(range);
            if (spanSeleccionado) return spanSeleccionado;
        }
    }

    const tipo = String(e?.inputType || "");
    if (tipo.startsWith("delete")) {
        return obtenerNodoProtegidoAfectadoPorDireccion(tipo.includes("Forward") ? "forward" : "backward");
    }

    return null;
}

let snapshot_html_bendita = null;
let snapshot_offset_bendita = null;
let snapshot_cantidad_benditas = 0;
let snapshot_input_type_bendita = "";
let snapshot_input_data_bendita = "";
let restaurando_bendita = false;

function limpiarSnapshotProtegido() {
    snapshot_html_bendita = null;
    snapshot_offset_bendita = null;
    snapshot_cantidad_benditas = 0;
    snapshot_input_type_bendita = "";
    snapshot_input_data_bendita = "";
}

function debeVigilarMutacionProtegida(inputType) {
    const tipo = String(inputType || "");
    return tipo.startsWith("delete") || tipo.startsWith("insert");
}

function obtenerCaracterEntradaEvento(e) {
    if (typeof e?.data === "string" && e.data.length > 0) {
        return e.data;
    }
    if (typeof e?.key === "string" && e.key.length === 1) {
        return e.key;
    }
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return "";
    const node = sel.anchorNode;
    if (node && node.nodeType === Node.TEXT_NODE && sel.focusOffset > 0) {
        return node.textContent.charAt(sel.focusOffset - 1);
    }
    return "";
}

function insertarTextoPlanoEnCaretProtegido(contenido) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const fragmento = document.createDocumentFragment();
    const textoPlano = String(contenido ?? "");
    const partes = textoPlano.split("\n");
    partes.forEach((parte, indice) => {
        if (parte) {
            fragmento.appendChild(document.createTextNode(parte));
        }
        if (indice < partes.length - 1) {
            fragmento.appendChild(document.createElement("br"));
        }
    });
    const marcador = document.createTextNode("");
    fragmento.appendChild(marcador);
    range.insertNode(fragmento);

    const nuevoRango = document.createRange();
    nuevoRango.setStart(marcador, 0);
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
    return true;
}

function reinsertarEntradaTrasRestauracionProtegida() {
    const tipo = String(snapshot_input_type_bendita || "");
    if (!tipo.startsWith("insert")) return false;
    const esSalto = tipo === "insertParagraph" || tipo === "insertLineBreak";
    const contenido = esSalto ? "\n" : (snapshot_input_data_bendita ?? "");
    if (!contenido && !esSalto) return false;
    return insertarTextoPlanoEnCaretProtegido(contenido);
}

function insertarSpanProtegidoEnCaret(letra, clase) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const span = document.createElement("span");
    span.className = clase;
    span.setAttribute("contenteditable", "false");
    span.textContent = letra;

    const marcador = document.createTextNode("");
    const fragmento = document.createDocumentFragment();
    fragmento.appendChild(span);
    fragmento.appendChild(marcador);
    range.insertNode(fragmento);

    const nuevoRango = document.createRange();
    nuevoRango.setStart(marcador, 0);
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
    return true;
}

function insertarTextoJuntoANodoProtegido(nodoProtegido, contenido, direccion = "after") {
    if (!nodoProtegido || !nodoProtegido.parentNode) return false;
    const nuevoTexto = document.createTextNode(String(contenido ?? ""));
    if (direccion === "before") {
        nodoProtegido.parentNode.insertBefore(nuevoTexto, nodoProtegido);
    } else {
        nodoProtegido.parentNode.insertBefore(nuevoTexto, nodoProtegido.nextSibling);
    }
    const sel = window.getSelection();
    if (!sel) return true;
    const range = document.createRange();
    range.setStart(nuevoTexto, nuevoTexto.textContent.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
}

function moverCursorPorPalabraBendita(direccion) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;
    let span = nodoEnPalabraBendita(range.startContainer);
    if (!span) {
        const node = range.startContainer;
        const offset = range.startOffset;
        let candidato = null;
        if (node.nodeType === Node.TEXT_NODE) {
            if (direccion === "forward" && offset === node.textContent.length) {
                candidato = node.nextSibling || node.parentNode?.nextSibling;
            } else if (direccion === "backward" && offset === 0) {
                candidato = node.previousSibling || node.parentNode?.previousSibling;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const indice = direccion === "forward" ? offset : offset - 1;
            candidato = node.childNodes[indice];
        }
        if (candidato) {
            span = nodoEnPalabraBendita(candidato);
        }
    }
    if (!span) return false;
    const nuevoRango = document.createRange();
    if (direccion === "forward") {
        nuevoRango.setStartAfter(span);
    } else {
        nuevoRango.setStartBefore(span);
    }
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
    return true;
}

function debeBloquearEdicionPalabraBendita(e) {
    return Boolean(obtenerNodoProtegidoAfectadoPorEdicion(e));
}

function obtenerClasesProtegidasEscritora1P() {
    return [CLASE_PALABRA_BENDITA_LOCAL, CLASE_PALABRA_MUSA_LOCAL, CLASE_LETRA_BENDITA_LOCAL];
}

function colocarCaretJuntoANodoProtegido1P(nodoProtegido, direccion) {
    if (!nodoProtegido || !nodoProtegido.parentNode) return;
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    if (direccion === "forward") {
        range.setStartBefore(nodoProtegido);
    } else {
        range.setStartAfter(nodoProtegido);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function emitirInputBorradoManualProtegido1P(direccion) {
    const tipo = direccion === "forward" ? "deleteContentForward" : "deleteContentBackward";
    let evento;
    try {
        evento = new InputEvent("input", {
            bubbles: true,
            cancelable: false,
            inputType: tipo,
            data: null
        });
    } catch (_error) {
        evento = new Event("input", { bubbles: true });
    }
    texto.dispatchEvent(evento);
}

function borrarCaracterEditableSaltandoProtegido1P(nodoProtegido, direccion) {
    if (!texto || !nodoProtegido) return false;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.getRangeAt(0).collapsed) return false;
    if (
        !window.ScribEditorDeletion
        || typeof window.ScribEditorDeletion.borrarCaracterEditableJuntoAProtegido !== "function"
    ) {
        return false;
    }
    const resultado = window.ScribEditorDeletion.borrarCaracterEditableJuntoAProtegido(
        texto,
        nodoProtegido,
        direccion,
        { protectedClasses: obtenerClasesProtegidasEscritora1P() }
    );
    if (!resultado || !resultado.deleted) return false;
    colocarCaretJuntoANodoProtegido1P(nodoProtegido, direccion);
    emitirInputBorradoManualProtegido1P(direccion);
    return true;
}

function obtenerRangoPorOffsets(contenedor, inicio, fin) {
    if (!contenedor || inicio >= fin) return null;
    const walker = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT, null, false);
    let pos = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const length = node.textContent.length;
        const nodeEnd = pos + length;
        if (!startNode && inicio <= nodeEnd) {
            startNode = node;
            startOffset = Math.max(0, Math.min(length, inicio - pos));
        }
        if (startNode && fin <= nodeEnd) {
            endNode = node;
            endOffset = Math.max(0, Math.min(length, fin - pos));
            break;
        }
        pos = nodeEnd;
    }
    if (!startNode || !endNode) return null;
    const rango = document.createRange();
    rango.setStart(startNode, startOffset);
    rango.setEnd(endNode, endOffset);
    return rango;
}


