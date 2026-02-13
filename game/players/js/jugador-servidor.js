var player = getParameterByName("player");
const playerNumber = Number(player);
if (document.body) {
    if (playerNumber === 1) document.body.classList.add("equipo-azul");
    if (playerNumber === 2) document.body.classList.add("equipo-rojo");
} else {
    window.addEventListener("DOMContentLoaded", () => {
        if (playerNumber === 1) document.body.classList.add("equipo-azul");
        if (playerNumber === 2) document.body.classList.add("equipo-rojo");
    }, { once: true });
}

let feedback_a_j_x;
let feedback_de_j_x;
let texto_x;
let texto_y;
let enviar_postgame_x;
let recibir_postgame_x;
let enviar_putada_de_jx;
let tiempo_inicial = new Date();
let es_pausa = false;
let borrado_cambiado = false;
let duracion;
let texto_guardado = "";
let interval_ortografia_perfecta;
let pararEscritura = false;
let inspirar;
let enviar_palabra;
let enviar_ventaja;
let elegir_ventaja


const getEl = (id) => document.getElementById(id); // Obtiene los elementos con id.
const escapeHtml = (valor) => String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const contenedor_corazones_escritor = (() => {
    let contenedor = getEl("corazones_escritor");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "corazones_escritor";
        contenedor.className = "corazones-flotantes";
        document.body.appendChild(contenedor);
    }
    return contenedor;
})();

const crearCorazonFlotante = (equipo, x, y) => {
    if (!contenedor_corazones_escritor) return;
    const corazon = document.createElement("span");
    const claseEquipo = equipo === 1 ? "corazon-azul" : "corazon-rojo";
    corazon.className = `corazon-flotante ${claseEquipo}`;
    corazon.textContent = equipo === 1 ? "💙" : "❤️";
    const tamaño = 22 + Math.random() * 22;
    const duracion = 2000 + Math.random() * 1200;
    const desplazamiento = -(90 + Math.random() * 140);
    corazon.style.left = `${x}px`;
    corazon.style.top = `${y}px`;
    corazon.style.fontSize = `${tamaño}px`;
    corazon.style.setProperty("--corazon-duracion", `${duracion}ms`);
    corazon.style.setProperty("--corazon-dy", `${desplazamiento}px`);
    contenedor_corazones_escritor.appendChild(corazon);
    corazon.addEventListener("animationend", () => {
        corazon.remove();
    });
};

const lanzarCorazonEscritor = (equipo) => {
    const ancho = window.innerWidth || 0;
    const alto = window.innerHeight || 0;
    if (!ancho || !alto) return;
    const margen = ancho * 0.12;
    const x = margen + Math.random() * Math.max(0, ancho - (margen * 2));
    const yMin = alto * 0.45;
    const yMax = alto * 0.8;
    const y = yMin + Math.random() * (yMax - yMin);
    crearCorazonFlotante(equipo, x, y);
};

// COMPONENTES DEL JUGADOR 1
let nombre;
let texto = getEl("texto");
let puntos = getEl("puntos");
let feedback = getEl("feedback1");
let alineador = getEl("alineador1");
let musas = getEl("musas");
  
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let explicación = getEl("explicación");
let metadatos = getEl("metadatos");
  
let tiempo = getEl("tiempo");
let temas = getEl("temas");
let lightning = getEl("lightning");
let feedback_tiempo = getEl("feedback_tiempo");
let neon = getEl("neon");

if (tiempo) {
    tiempo.style.display = "none";
}

const calentamiento_escritor = getEl("calentamiento_escritor");
const calentamiento_nube_escritor = getEl("calentamiento_nube_escritor");
const calentamiento_cursor_escritor_1 = getEl("calentamiento_cursor_escritor_1");
const calentamiento_cursor_escritor_2 = getEl("calentamiento_cursor_escritor_2");
const calentamiento_cursor_label_escritor_1 = calentamiento_cursor_escritor_1 ? calentamiento_cursor_escritor_1.querySelector(".cursor-label") : null;
const calentamiento_cursor_label_escritor_2 = calentamiento_cursor_escritor_2 ? calentamiento_cursor_escritor_2.querySelector(".cursor-label") : null;
const calentamiento_estado_escritor = getEl("calentamiento_estado_escritor");
const calentamiento_overlay_ui_escritor = document.querySelector("#calentamiento_escritor .calentamiento-overlay-ui");
let vista_calentamiento_escritor = false;
let calentamiento_palabras_escritor = [];
let calentamiento_cursores_escritor = {
    1: { x: 50, y: 50, visible: false },
    2: { x: 50, y: 50, visible: false }
};
const DURACION_DECAY_CALENTAMIENTO_MS = 10000;
const VENTANA_ANIMACION_PALABRA_MS = 600;
const MARGEN_CABECERA_CALENTAMIENTO_PX = 18;
const MIN_Y_CALENTAMIENTO_DEFAULT = 26;
const MAX_NOMBRE_CURSOR_CALENTAMIENTO = 26;
const nombres_cursores_calentamiento_escritor = {
    1: "ESCRITXR 1",
    2: "ESCRITXR 2"
};
let editable_previo_calentamiento = null;
let ultimo_envio_cursor_calentamiento = 0;
const limitarPct = (valor, min, max) => Math.max(min, Math.min(max, valor));
const normalizarNombreCursorCalentamientoEscritor = (valor, fallback) => {
    const texto = typeof valor === "string" ? valor.trim() : "";
    if (!texto) return fallback;
    return texto.slice(0, MAX_NOMBRE_CURSOR_CALENTAMIENTO);
};
const actualizarEtiquetasCursorCalentamientoEscritor = () => {
    if (calentamiento_cursor_label_escritor_1) {
        calentamiento_cursor_label_escritor_1.textContent = normalizarNombreCursorCalentamientoEscritor(
            nombres_cursores_calentamiento_escritor[1],
            "ESCRITXR 1"
        );
    }
    if (calentamiento_cursor_label_escritor_2) {
        calentamiento_cursor_label_escritor_2.textContent = normalizarNombreCursorCalentamientoEscritor(
            nombres_cursores_calentamiento_escritor[2],
            "ESCRITXR 2"
        );
    }
};
const obtenerMinYPalabrasCalentamientoEscritor = () => {
    if (!calentamiento_overlay_ui_escritor) return MIN_Y_CALENTAMIENTO_DEFAULT;
    const altoVentana = window.innerHeight || 1;
    const rect = calentamiento_overlay_ui_escritor.getBoundingClientRect();
    if (!Number.isFinite(rect.bottom) || rect.bottom <= 0) return MIN_Y_CALENTAMIENTO_DEFAULT;
    const yPct = ((rect.bottom + MARGEN_CABECERA_CALENTAMIENTO_PX) / altoVentana) * 100;
    return limitarPct(yPct, 12, 62);
};

const aplicarCursorCalentamientoEscritor = (elemento, cursor) => {
    if (!elemento) return;
    const visible = Boolean(cursor && cursor.visible);
    elemento.classList.toggle("activo", visible);
    if (!visible) return;
    const x = typeof cursor.x === "number" ? cursor.x : 50;
    const y = typeof cursor.y === "number" ? cursor.y : 50;
    elemento.style.left = `${Math.max(0, Math.min(100, x))}%`;
    elemento.style.top = `${Math.max(0, Math.min(100, y))}%`;
};

const renderizarCursoresCalentamientoEscritor = () => {
    aplicarCursorCalentamientoEscritor(calentamiento_cursor_escritor_1, calentamiento_cursores_escritor[1]);
    aplicarCursorCalentamientoEscritor(calentamiento_cursor_escritor_2, calentamiento_cursores_escritor[2]);
};

const renderizarPalabrasCalentamientoEscritor = () => {
    if (!calentamiento_nube_escritor) return;
    calentamiento_nube_escritor.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const equipoEscritor = playerNumber === 1 || playerNumber === 2 ? playerNumber : null;
    const ahora = Date.now();
    const minY = obtenerMinYPalabrasCalentamientoEscritor();
    calentamiento_palabras_escritor.forEach((entrada) => {
        const propia = equipoEscritor !== null && entrada.equipo === equipoEscritor;
        const nodo = document.createElement("span");
        const clases = [`calentamiento-palabra`, `equipo-${entrada.equipo}`];
        if (entrada.destacada) clases.push("is-highlighted");
        if (entrada.destacada && entrada.animOnTs && (ahora - entrada.animOnTs) < VENTANA_ANIMACION_PALABRA_MS) {
            clases.push("is-highlight-enter");
        }
        if (!entrada.destacada && entrada.animOffTs && (ahora - entrada.animOffTs) < VENTANA_ANIMACION_PALABRA_MS) {
            clases.push("is-highlight-exit");
        }
        if (propia && entrada.id) clases.push("calentamiento-palabra-clickable");
        nodo.className = clases.join(" ");
        nodo.textContent = entrada.palabra;
        nodo.style.left = `${Math.max(0, Math.min(100, entrada.x))}%`;
        nodo.style.top = `${limitarPct(entrada.y, minY, 96)}%`;
        const duracionMs = Number(entrada.duracionMs) > 0 ? Number(entrada.duracionMs) : DURACION_DECAY_CALENTAMIENTO_MS;
        const edadMs = Math.max(0, Date.now() - (Number(entrada.ts) || Date.now()));
        const delayMs = entrada.destacada ? 0 : -Math.min(edadMs, duracionMs);
        nodo.style.setProperty("--calentamiento-decay-duration", `${duracionMs}ms`);
        nodo.style.setProperty("--calentamiento-decay-delay", `${delayMs}ms`);
        if (propia && entrada.id) {
            nodo.dataset.id = entrada.id;
            nodo.addEventListener("click", () => {
                if (!socket || !socket.connected) return;
                socket.emit("calentamiento_click_palabra", { id: entrada.id });
            });
        }
        fragment.appendChild(nodo);
    });
    calentamiento_nube_escritor.appendChild(fragment);
};

const normalizarPalabrasCalentamientoEscritor = (equipos = {}) => {
    const lista = [];
    const minY = obtenerMinYPalabrasCalentamientoEscritor();
    [1, 2].forEach((equipo) => {
        const data = equipos[equipo] || {};
        const palabras = Array.isArray(data.palabras) ? data.palabras : [];
        palabras.forEach((entrada) => {
            if (!entrada || typeof entrada.palabra !== "string") return;
            lista.push({
                id: typeof entrada.id === "string" ? entrada.id : "",
                palabra: entrada.palabra,
                equipo,
                x: typeof entrada.x === "number" ? entrada.x : 50,
                y: limitarPct(typeof entrada.y === "number" ? entrada.y : 50, minY, 96),
                destacada: Boolean(entrada.destacada),
                ts: Number(entrada.ts) || 0,
                animOnTs: Number(entrada.animOnTs) || 0,
                animOffTs: Number(entrada.animOffTs) || 0,
                duracionMs: Number(entrada.duracionMs) > 0 ? Number(entrada.duracionMs) : DURACION_DECAY_CALENTAMIENTO_MS
            });
        });
    });
    lista.sort((a, b) => a.ts - b.ts);
    return lista.slice(-220);
};

const actualizarVistaCalentamientoEscritor = (activa) => {
    const siguiente = Boolean(activa);
    if (vista_calentamiento_escritor === siguiente) return;
    vista_calentamiento_escritor = siguiente;
    if (document.body) {
        document.body.classList.toggle("vista-calentamiento-escritor", vista_calentamiento_escritor);
    }
    if (calentamiento_escritor) {
        calentamiento_escritor.setAttribute("aria-hidden", vista_calentamiento_escritor ? "false" : "true");
        calentamiento_escritor.style.display = vista_calentamiento_escritor ? "flex" : "none";
    }
    if (texto) {
        if (vista_calentamiento_escritor) {
            editable_previo_calentamiento = texto.contentEditable;
            texto.contentEditable = "false";
        } else if (editable_previo_calentamiento !== null) {
            texto.contentEditable = editable_previo_calentamiento;
            editable_previo_calentamiento = null;
        }
    }
    if (!vista_calentamiento_escritor) {
        socket.emit("calentamiento_cursor", { visible: false });
    }
};

const actualizarCalentamientoEscritor = (data = {}) => {
    if (typeof data.vista === "boolean") {
        actualizarVistaCalentamientoEscritor(data.vista);
    }
    const activo = Boolean(data.activo && data.vista);
    if (calentamiento_estado_escritor) {
        const etiquetaEquipo = playerNumber === 1 ? "azules" : (playerNumber === 2 ? "rojas" : "de tu equipo");
        calentamiento_estado_escritor.textContent = activo
            ? `Palabras sincronizadas. Click para iluminar/desiluminar las ${etiquetaEquipo}.`
            : "Esperando vista de calentamiento.";
    }
    calentamiento_palabras_escritor = normalizarPalabrasCalentamientoEscritor(data.equipos || {});
    if (data.cursores && typeof data.cursores === "object") {
        calentamiento_cursores_escritor = {
            1: { ...(calentamiento_cursores_escritor[1] || {}), ...(data.cursores[1] || {}) },
            2: { ...(calentamiento_cursores_escritor[2] || {}), ...(data.cursores[2] || {}) }
        };
    }
    renderizarPalabrasCalentamientoEscritor();
    renderizarCursoresCalentamientoEscritor();
};

const actualizarCursorCalentamientoEscritor = (payload = {}) => {
    const equipo = Number(payload.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    calentamiento_cursores_escritor[equipo] = {
        ...(calentamiento_cursores_escritor[equipo] || {}),
        ...payload
    };
    renderizarCursoresCalentamientoEscritor();
};

const enviarCursorCalentamiento = (x, y, visible = true) => {
    if (!vista_calentamiento_escritor || !socket || !socket.connected) return;
    const ahora = Date.now();
    if (visible && (ahora - ultimo_envio_cursor_calentamiento) < 40) return;
    ultimo_envio_cursor_calentamiento = ahora;
    socket.emit("calentamiento_cursor", {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
        visible
    });
};

window.addEventListener("mousemove", (evt) => {
    if (!vista_calentamiento_escritor) return;
    const ancho = window.innerWidth || 1;
    const alto = window.innerHeight || 1;
    enviarCursorCalentamiento((evt.clientX / ancho) * 100, (evt.clientY / alto) * 100, true);
});

window.addEventListener("blur", () => {
    if (!vista_calentamiento_escritor) return;
    socket.emit("calentamiento_cursor", { visible: false });
});

window.addEventListener("resize", () => {
    if (!vista_calentamiento_escritor) return;
    renderizarPalabrasCalentamientoEscritor();
});

window.addEventListener("beforeunload", () => {
    if (!socket) return;
    socket.emit("calentamiento_cursor", { visible: false });
});

const CLASE_PALABRA_BENDITA_LOCAL =
    typeof CLASE_PALABRA_BENDITA !== "undefined" ? CLASE_PALABRA_BENDITA : "palabra-bendita";
const CLASE_PALABRA_MUSA_LOCAL = "palabra-musa";
const CLASE_LETRA_BENDITA_LOCAL = "letra-verde";
const SELECTOR_PALABRA_PROTEGIDA = `.${CLASE_PALABRA_BENDITA_LOCAL}, .${CLASE_PALABRA_MUSA_LOCAL}, .${CLASE_LETRA_BENDITA_LOCAL}`;
const SELECTOR_PALABRA_MARCADA = `.${CLASE_PALABRA_BENDITA_LOCAL}, .${CLASE_PALABRA_MUSA_LOCAL}`;
const PATRON_CARACTER_PALABRA = "A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ";
let estadoObjetivosMultipalabra = [];

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

function rangoIntersecaPalabraMarcada(rango) {
    if (!texto || !rango) return false;
    const spans = texto.querySelectorAll(SELECTOR_PALABRA_MARCADA);
    for (const span of spans) {
        if (rango.intersectsNode(span)) return true;
    }
    return false;
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

function obtenerOffsetCaretEnTexto() {
    if (!texto) return 0;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return 0;
    const range = sel.getRangeAt(0).cloneRange();
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(texto);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
}

function colocarCaretEnOffset(offset) {
    if (!texto) return;
    const walker = document.createTreeWalker(texto, NodeFilter.SHOW_TEXT, null, false);
    let pos = 0;
    let ultimoNodo = null;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        ultimoNodo = node;
        const length = node.textContent.length;
        if (offset <= pos + length) {
            const range = document.createRange();
            range.setStart(node, Math.max(0, offset - pos));
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        pos += length;
    }
    if (ultimoNodo) {
        const range = document.createRange();
        range.setStart(ultimoNodo, ultimoNodo.textContent.length);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
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

let snapshot_html_bendita = null;
let snapshot_offset_bendita = null;
let snapshot_cantidad_benditas = 0;
let restaurando_bendita = false;

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
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    const rangosObjetivo = typeof e.getTargetRanges === "function" ? e.getTargetRanges() : [];
    if (rangosObjetivo && rangosObjetivo.length) {
        for (const rango of rangosObjetivo) {
            if (rangoIntersecaPalabraBendita(rango)) return true;
        }
    }
    if (range.collapsed) {
        if (nodoEnPalabraBendita(range.startContainer)) return true;
    } else if (rangoIntersecaPalabraBendita(range)) {
        return true;
    }
    if (e.inputType && e.inputType.startsWith("delete")) {
        const direccion = e.inputType.includes("Forward") ? "forward" : "backward";
        if (caretAfectaPalabraBendita(direccion)) return true;
        const rangoBorrado = obtenerRangoBorradoCaracter(direccion);
        if (rangoBorrado && rangoIntersecaPalabraBendita(rangoBorrado)) {
            return true;
        }
        if (hayPalabraBenditaAdyacente(sel, direccion)) return true;
    }
    return false;
}

function obtenerRangoPalabraActual() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const original = sel.getRangeAt(0).cloneRange();
    if (typeof sel.modify === "function") {
        sel.collapse(original.endContainer, original.endOffset);
        sel.modify("move", "backward", "word");
        sel.modify("extend", "forward", "word");
        const rango = sel.getRangeAt(0).cloneRange();
        sel.removeAllRanges();
        sel.addRange(original);
        return rango;
    }
    if (original.startContainer.nodeType !== Node.TEXT_NODE) {
        return null;
    }
    const textoNodo = original.startContainer.textContent || "";
    let inicio = original.startOffset;
    let fin = original.startOffset;
    while (inicio > 0 && !/\s/.test(textoNodo[inicio - 1])) {
        inicio -= 1;
    }
    while (fin < textoNodo.length && !/\s/.test(textoNodo[fin])) {
        fin += 1;
    }
    const rango = document.createRange();
    rango.setStart(original.startContainer, inicio);
    rango.setEnd(original.startContainer, fin);
    return rango;
}

function marcarPalabraBenditaActual(inicio, fin, esMusa) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const rango = Number.isInteger(inicio) && Number.isInteger(fin)
        ? obtenerRangoPorOffsets(texto, inicio, fin)
        : obtenerRangoPalabraActual();
    if (!rango) return;
    const contenido = rango.toString();
    if (!contenido || !contenido.trim()) return;
    if (rangoIntersecaPalabraMarcada(rango)) return;
    const span = document.createElement("span");
    span.className = CLASE_PALABRA_BENDITA_LOCAL;
    if (esMusa) {
        span.classList.add("palabra-bendita-musa");
    }
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

function marcarPalabraMusaActual(inicio, fin) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const rango = Number.isInteger(inicio) && Number.isInteger(fin)
        ? obtenerRangoPorOffsets(texto, inicio, fin)
        : obtenerRangoPalabraActual();
    if (!rango) return false;
    const contenido = rango.toString();
    if (!contenido || !contenido.trim()) return false;
    if (rangoIntersecaPalabraMarcada(rango)) return false;
    const span = document.createElement("span");
    span.className = CLASE_PALABRA_MUSA_LOCAL;
    span.setAttribute("contenteditable", "false");
    const fragmento = rango.extractContents();
    span.appendChild(fragmento);
    rango.insertNode(span);
    const nuevoRango = document.createRange();
    nuevoRango.setStartAfter(span);
    nuevoRango.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRango);
    return true;
}

function obtenerObjetivosPalabraActual() {
    if (Array.isArray(palabra_actual)) {
        return palabra_actual
            .map((palabra) => (typeof palabra === "string" ? palabra.trim() : ""))
            .filter(Boolean);
    }
    if (typeof palabra_actual === "string") {
        const palabra = palabra_actual.trim();
        return palabra ? [palabra] : [];
    }
    return [];
}

function escaparRegex(valor) {
    return String(valor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function esObjetivoMultipalabra(objetivo) {
    return typeof objetivo === "string" && /\s+/.test(objetivo.trim());
}

function crearRegexObjetivoMultipalabra(objetivo) {
    if (!esObjetivoMultipalabra(objetivo)) return null;
    const partes = String(objetivo).trim().split(/\s+/).map(escaparRegex);
    if (partes.length < 2) return null;
    const cuerpo = partes.join("\\s+");
    const separador = `[^${PATRON_CARACTER_PALABRA}]`;
    return new RegExp(`(^|${separador})(${cuerpo})(?=$|${separador})`, "gi");
}

function buscarCoincidenciasMultipalabra(textoFuente, objetivo) {
    if (typeof textoFuente !== "string") return [];
    const regex = crearRegexObjetivoMultipalabra(objetivo);
    if (!regex) return [];
    const coincidencias = [];
    let match;
    while ((match = regex.exec(textoFuente)) !== null) {
        const prefijo = match[1] || "";
        const contenido = match[2] || "";
        const inicio = match.index + prefijo.length;
        coincidencias.push({ inicio, fin: inicio + contenido.length });
        if (regex.lastIndex === match.index) {
            regex.lastIndex += 1;
        }
    }
    return coincidencias;
}

function prepararDeteccionMultipalabraAsignada() {
    const textoBase = texto?.textContent || "";
    estadoObjetivosMultipalabra = obtenerObjetivosPalabraActual()
        .filter(esObjetivoMultipalabra)
        .map((objetivo) => ({
            objetivo,
            ocurrenciasBase: buscarCoincidenciasMultipalabra(textoBase, objetivo).length
        }));
}

function limpiarDeteccionMultipalabraAsignada() {
    estadoObjetivosMultipalabra = [];
}

function detectarInsercionMultipalabra(textoActual) {
    if (!Array.isArray(estadoObjetivosMultipalabra) || !estadoObjetivosMultipalabra.length) {
        return null;
    }
    const fuente = typeof textoActual === "string" ? textoActual : "";
    let mejorCoincidencia = null;
    estadoObjetivosMultipalabra.forEach((estado) => {
        const coincidencias = buscarCoincidenciasMultipalabra(fuente, estado.objetivo);
        if (coincidencias.length <= estado.ocurrenciasBase) return;
        const indiceNueva = Math.max(0, Math.min(coincidencias.length - 1, estado.ocurrenciasBase));
        const coincidenciaNueva = coincidencias[indiceNueva] || coincidencias[coincidencias.length - 1];
        if (!coincidenciaNueva) return;
        if (!mejorCoincidencia || coincidenciaNueva.fin >= mejorCoincidencia.fin) {
            mejorCoincidencia = {
                objetivo: estado.objetivo,
                inicio: coincidenciaNueva.inicio,
                fin: coincidenciaNueva.fin
            };
        }
    });
    return mejorCoincidencia;
}

let progreso_frase_final_intensidad = 0;
let progreso_frase_final_ultimo_match = 0;

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
    const objetivo = (frase_final || "").toLowerCase();
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

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";

function extraerSegundosTiempo(texto) {
    if (!texto || typeof texto !== "string" || texto.indexOf(":") === -1) {
        return null;
    }
    const partes = texto.split(":");
    if (partes.length < 2) {
        return null;
    }
    const minutos = parseInt(partes[0], 10);
    const segundos = parseInt(partes[1], 10);
    if (Number.isNaN(minutos) || Number.isNaN(segundos)) {
        return null;
    }
    return (minutos * 60) + segundos;
}

function actualizarBarraVida(elemento, texto) {
    if (!elemento) {
        return;
    }
    const total = extraerSegundosTiempo(texto);
    if (total === null) {
        elemento.style.setProperty("--vida-pct", "0%");
        elemento.style.setProperty("--vida-color", "#d94b4b");
        elemento.style.display = "none";
        return;
    }
    const limitado = Math.min(Math.max(total, 0), VIDA_MAX_SEGUNDOS);
    const porcentaje = (limitado / VIDA_MAX_SEGUNDOS) * 100;
    const tono = Math.max(0, Math.min(120, porcentaje * 1.2));
    elemento.style.display = DISPLAY_BARRA_VIDA;
    elemento.style.setProperty("--vida-pct", `${porcentaje.toFixed(1)}%`);
    elemento.style.setProperty("--vida-color", `hsl(${tono}, 85%, 55%)`);
}

let contenedor = getEl("contenedor")
  

let tempo_text_borroso;
let tempo_text_inverso;

let listener_cuenta_atras = null;
let timer = null;
let sub_timer = null;

// Variables de los modos.
let modo_actual = "";
let putada_actual = "";
let modo_texto_borroso = 0;
let desactivar_borrar = false;
let bloquear_borrado_putada = false;
let timeout_bloqueo_putada = null;
let teclado_lento_putada = false;
let timeout_teclado_lento = null;
const RETRASO_TECLADO_LENTO_MS = 500;
const RAYO_REDUCCION_K = 0.08;

function limpiar_bloqueo_putada() {
    bloquear_borrado_putada = false;
    putada_actual = "";
    if (timeout_bloqueo_putada) {
        clearTimeout(timeout_bloqueo_putada);
        timeout_bloqueo_putada = null;
    }
}

function limpiar_teclado_lento() {
    teclado_lento_putada = false;
    if (timeout_teclado_lento) {
        clearTimeout(timeout_teclado_lento);
        timeout_teclado_lento = null;
    }
}

var letra_prohibida = "";
var letra_bendita = "";
let frase_final;
let listener_modo;
let listener_modo1;
let timeoutID_menu;
let listener_modo_psico;
let activado_psico = false;
let temp_text_inverso_activado = false;

let TIEMPO_MODIFICADOR;
const mainTitle = document.querySelector('.main-title');
const buttonContainer = document.querySelector('.button-container');


function getParameterByName(name, url) {
if (!url) url = window.location.href;
name = name.replace(/[\[\]]/g, "\\$&");
var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
if (!results) return null;
if (!results[2]) return '';
return decodeURIComponent(results[2].replace(/\+/g, " "));
}

if (player == 1) {
    enviar_putada_de_jx = 'enviar_putada_de_j2';
    feedback_a_j_x = 'feedback_a_j1';
    feedback_de_j_x = 'feedback_de_j1';
    texto_x = 'texto1';
    enviar_postgame_x = 'enviar_postgame1';
    recibir_postgame_x = 'recibir_postgame1';
    nombre = getEl("nombre");
    nombre.value = "ESCRITXR 1";
    nombres_cursores_calentamiento_escritor[1] = nombre.value;
    inspirar = 'inspirar_j1';
    enviar_palabra = 'enviar_palabra_j1';
    enviar_ventaja = 'enviar_ventaja_j1';
    elegir_ventaja = "elegir_ventaja_j1";
    nombre.style="color:aqua;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"
    metadatos.style = "color:aqua; text-shadow: 0.0625em 0.0625em red;";

} else if (player == 2) {
    enviar_putada_de_jx = 'enviar_putada_de_j1';
    feedback_a_j_x = 'feedback_a_j2';
    feedback_de_j_x = 'feedback_de_j2';
    texto_x = 'texto2';
    enviar_postgame_x = 'enviar_postgame2';
    recibir_postgame_x = 'recibir_postgame2';
    nombre = getEl("nombre");
    nombre.value = "ESCRITXR 2"
    nombres_cursores_calentamiento_escritor[2] = nombre.value;
    inspirar = 'inspirar_j2';
    enviar_palabra = 'enviar_palabra_j2'
    enviar_ventaja = 'enviar_ventaja_j2';
    elegir_ventaja = "elegir_ventaja_j2";
    nombre.style="color:red;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;"
    metadatos.style = "color:red; text-shadow: 0.0625em 0.0625em aqua;";

}
actualizarEtiquetasCursorCalentamientoEscritor();

texto.addEventListener("keydown", (e) => {
    if (bloquear_borrado_putada && e.key === "Backspace") {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const direccion = e.key === "ArrowRight" ? "forward" : "backward";
        if (moverCursorPorPalabraBendita(direccion)) {
            e.preventDefault();
            return;
        }
    }
    if (e.key === "Backspace" || e.key === "Delete") {
        const sel = window.getSelection();
        const direccion = e.key === "Backspace" ? "backward" : "forward";
        if (caretAfectaPalabraBendita(direccion)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        const rangoBorrado = obtenerRangoBorradoCaracter(direccion);
        if (rangoBorrado && rangoIntersecaPalabraBendita(rangoBorrado)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        if (hayPalabraBenditaAdyacente(sel, direccion)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
    }
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;
  
        // Si el cursor está justo antes de un `contenteditable="false"`, bloqueamos el retroceso
        if (
          startContainer.nodeType === 1 &&
          startOffset === 0 &&
          startContainer.previousSibling &&
          startContainer.previousSibling.getAttribute &&
          startContainer.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault(); // Bloquea la acción de retroceso
        }
  
        // Si el cursor está dentro de un nodo de texto, verificamos el anterior
        if (
          startContainer.nodeType === 3 &&
          startOffset === 0 &&
          startContainer.parentNode.previousSibling &&
          startContainer.parentNode.previousSibling.getAttribute &&
          startContainer.parentNode.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault(); // Bloquea la acción de retroceso
        }
      }
    }
  });

texto.addEventListener("beforeinput", (e) => {
    if (e.inputType && e.inputType.startsWith("delete")) {
        snapshot_html_bendita = texto.innerHTML;
        snapshot_offset_bendita = obtenerOffsetCaretEnTexto();
        snapshot_cantidad_benditas = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA).length;
    } else {
        snapshot_html_bendita = null;
        snapshot_offset_bendita = null;
        snapshot_cantidad_benditas = 0;
    }
    if (debeBloquearEdicionPalabraBendita(e)) {
        e.preventDefault();
        return;
    }
    if (!teclado_lento_putada) return;
    if (e.inputType === "insertText" || e.inputType === "insertParagraph") {
        e.preventDefault();
        const data = e.data ?? (e.inputType === "insertParagraph" ? "\n" : "");
        setTimeout(() => {
            if (!teclado_lento_putada) return;
            if (data === "\n") {
                document.execCommand("insertLineBreak");
            } else {
                document.execCommand("insertText", false, data);
            }
        }, RETRASO_TECLADO_LENTO_MS);
    }
});

texto.addEventListener("input", (e) => {
    if (!snapshot_html_bendita) return;
    const cantidad_actual = texto.querySelectorAll(SELECTOR_PALABRA_PROTEGIDA).length;
    if (cantidad_actual < snapshot_cantidad_benditas) {
        restaurando_bendita = true;
        texto.innerHTML = snapshot_html_bendita;
        if (Number.isFinite(snapshot_offset_bendita)) {
            colocarCaretEnOffset(snapshot_offset_bendita);
        }
        countChars(texto);
        sendText();
        setTimeout(() => {
            restaurando_bendita = false;
        }, 0);
    }
    snapshot_html_bendita = null;
    snapshot_offset_bendita = null;
    snapshot_cantidad_benditas = 0;
});

// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);

socket.on("musa_corazon", (data) => {
    const equipo = data && Number(data.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    lanzarCorazonEscritor(equipo);
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
  
const PUTADAS = {
    "🐢": function () {
        if (timeout_teclado_lento) {
            clearTimeout(timeout_teclado_lento);
            timeout_teclado_lento = null;
        }
        teclado_lento_putada = true;
        putada_actual = "🐢";
        timeout_teclado_lento = setTimeout(function () {
            teclado_lento_putada = false;
            putada_actual = "";
            timeout_teclado_lento = null;
        }, TIEMPO_MODIFICADOR);
    },
    "⌛": function () {
    },
    "⚡": function () {
        borrado_cambiado = true;
        antiguo_rapidez_borrado = rapidez_borrado;
        antiguo_inicio_borrado = rapidez_inicio_borrado;
        
        rapidez_borrado = reduceLog(rapidez_borrado, RAYO_REDUCCION_K);
        rapidez_inicio_borrado = reduceLog(rapidez_inicio_borrado, RAYO_REDUCCION_K);
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.transform = "translateX(-50%)";
        lightning.style.top = "27%";
        lightning.style.left = "50%";
        setTimeout(function () {
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            borrado_cambiado = false;
            rapidez_borrado = antiguo_rapidez_borrado;
            rapidez_inicio_borrado = antiguo_inicio_borrado;
        }, TIEMPO_MODIFICADOR);
    },

    "🙃": function () {
        tiempo_inicial = new Date();
        desactivar_borrar = true;
        //caret = guardarPosicionCaret();
        //caretNode = caret.caretNode;
        //caretPos = caret.caretPos;
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            texto.removeEventListener('animationend', arguments.callee);
        });

        procesarTexto();
        // Obtener el último nodo de texto en text
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el último nodo de texto, colocamos el cursor allí
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        sendText();
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
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            let lastLine = texto.lastChild;
            let lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                let caretNode = lastTextNode;
                let caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            putada_actual = "";
        sendText()  
        }, TIEMPO_MODIFICADOR);
    },

    "🖊️": function () {
        if (timeout_bloqueo_putada) {
            clearTimeout(timeout_bloqueo_putada);
            timeout_bloqueo_putada = null;
        }
        bloquear_borrado_putada = true;
        putada_actual = "🖊️";
        timeout_bloqueo_putada = setTimeout(function () {
            limpiar_bloqueo_putada();
        }, TIEMPO_MODIFICADOR);
    },

    "🌪️": function () {
        modo_texto_borroso = 1;
        tiempo_inicial = new Date();
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            putada_actual = "";
        }, TIEMPO_MODIFICADOR);
    },
};

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        palabra.style.backgroundColor = "yellow";
        explicación.style.color = "yellow";
        definicion.style.fontSize = "1vw";
        explicación.innerHTML = "NIVEL PALABRAS BENDITAS";
        socket.emit("nueva_palabra", player);
        socket.on(enviar_palabra, data => {
          console.log(data)
            recibir_palabra(data);
        });
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        definicion.style.fontSize = "1.5vw";
        palabra.style.backgroundColor = "red";
        explicación.style.color = "red";
        letra_prohibida = data.letra_prohibida;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("keydown", listener_modo);
        explicación.innerHTML = "NIVEL LETRA MALDITA";
        palabra.innerHTML = "LETRA MALDITA: " + letra_prohibida;
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
    },

    "letra bendita": function (data) {
        definicion.style.fontSize = "1.5vw";
        palabra.style.backgroundColor= "lime";
        explicación.style.color = "lime";
        letra_bendita = data.letra_bendita;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("keydown", listener_modo, true);
        explicación.innerHTML = "NIVEL LETRA BENDITA";
        palabra.innerHTML = "LETRA BENDITA: " + letra_bendita;
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
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

    "psicodélico": function (data) {
        //explicación.innerHTML = "MODO PSICODÉLICO";
        //palabra1.innerHTML = "";
        //definicion1.innerHTML = "";
        listener_modo_psico = function () { modo_psicodélico() };
        texto.addEventListener("keyup", listener_modo_psico);
        activado_psico = true;
        /*socket.on("psico_a_j1", (data) => {
            stylize();
        });*/
    },

    'tertulia': function (socket) {
        es_pausa = true;
        tiempo_restante = TIEMPO_MODIFICADOR - (new Date().getTime() - tiempo_inicial.getTime());
        pausa();
        explicación.style.color = "blue";
        explicación.innerHTML = "NIVEL TERTULIA";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
    },

    'palabras prohibidas': function (data) {
        palabra.style.backgroundColor = "pink";
        explicación.style.color = "pink";
        explicación.innerHTML = "NIVEL PALABRAS MALDITAS";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_prohibida", player);
        socket.on(enviar_palabra, data => {
            console.log("ESTA FUNCIONANDOOOOOO")
            recibir_palabra_prohibida(data);
        });
    },

    'ortografía perfecta': function (data) {
        palabra.style.backgroundColor = "orange";
        explicación.style.color = "orange";
        explicación.innerHTML = "MODO ORTOGRAFÍA PERFECTA";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        modo_ortografía_perfecta();

    },

    'frase final': function (socket) {
        palabra.style.backgroundColor = "orange";
        explicación.style.color = "orange";
        explicación.innerHTML = "NIVEL FRASE FINAL";
        palabra.innerHTML = "";
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
        texto.removeEventListener("keyup", listener_modo);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        letra_bendita = "";
    },

    "borroso": function (data) {
        texto.classList.remove("textarea_blur");
    },

    "psicodélico": function (data) {
        //socket.off('psico_a_j1');
        texto.removeEventListener("keyup", listener_modo_psico);
        activado_psico = false;
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
    },

    "tiempo_borrado_más": function (data){ },
    
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

    "ortografía perfecta": function (data) {
        clearTimeout(interval_ortografia_perfecta);
    },

    "frase final": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        limpiarMarcadoFraseFinal();
    },

    "": function (data) { },
};

// Cuando el texto cambia, envía los datos actuales al resto.
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

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    actualizarEtiquetasCursorCalentamientoEscritor();
    socket.emit('registrar_escritor', player);
    socket.emit('pedir_calentamiento_estado');
    socket.emit('calentamiento_cursor', { visible: false });
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

//activar los sockets extratextuales.
activar_sockets_extratextuales();
socket.on('actualizar_contador_musas', contador_musas => {
    console.log("actualizar_contador_musas")
    if(player == 1){
    musas.innerHTML = contador_musas.escritxr1 + " musas";
    }
    else{
        musas.innerHTML = contador_musas.escritxr2 + " musas";
    }
});

// Recibe los datos del jugador 1 y los coloca.
/*socket.on(texto_x, (data) => {
    texto.innerText = data.text;
    puntos.innerHTML = data.points;
    nivel.innerHTML = data.level;
    texto.scrollTop = texto.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
});
*/

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", (data) => {
    if(data.player == player){
    if (convertirASegundos(data.count) >= 20) {
        tiempo.style.color = "white";
    }
    if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
        console.log(convertirASegundos(data.count))
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "yellow";
    }
    if (10 > convertirASegundos(data.count) && activado_psico == false) {
        MODOS["psicodélico"](data, socket);
        tiempo.style.color = "red";
    }

    tiempo.innerHTML = data.count;
    actualizarBarraVida(tiempo, data.count);
    if (data.count == "¡Tiempo!") {
        limpiar_bloqueo_putada();
        limpiar_teclado_lento();
        console.log(putada_actual, "esto no doebería ocurrir")
        if (putada_actual == "🙃"){
            console.log("NO PUEDOOOOO ESTO NO DEBERÍA OCURRRIR")
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.removeEventListener('animationend', arguments.callee);
            });
            clearTimeout(tempo_text_inverso);
            temp_text_inverso_activado = false;
            procesarTexto();
        }
        sendText();
        if (modo_actual != "" && modo_actual != "frase final") {
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "white";
            pararEscritura = true;
            stopConfetti();
            clearTimeout(listener_cuenta_atras);
            clearInterval(timer);  
            clearTimeout(sub_timer);
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            if(temp_text_inverso_activado == true){
                temp_text_inverso_activado = false;
                clearTimeout(tempo_text_inverso);
                procesarTexto();
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            texto_guardado = texto.innerText;
        
            //texto.innerText = "";
            texto.style.display = "none";
            texto.style.height = "";
            feedback_tiempo.style.color = color_positivo;
            texto.rows =  "6";
            definicion.style.fontSize = "1.5vw";
            temas.innerHTML = "";
            temas.display = "";
            texto.contentEditable= "false";
            palabra.innerHTML = "";
            definicion.innerHTML = "";
            explicación.innerHTML = "";
            menu_modificador = false;
            focusedButtonIndex = 0;
            modificadorButtons = [];

            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
        
            // Desactiva el blur de ambos textos.
            blurreado = false;
            texto.classList.remove("textarea_blur");
        
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            puntos_palabra = 0;
            puntos_ = 0;
            puntos_letra_prohibida = 0;
            puntos_letra_bendita = 0;
        
            letra_prohibida = "";
            letra_bendita = "";
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            palabra_actual = []; // Variable que almacena la palabra bonus actual.            
            // Desactiva, por seguridad, todos los modos.
            modo_texto_borroso = 0;
            desactivar_borrar = true;
            console.log(puntos)
            
            feedback.innerHTML = "";
            
            definicion.innerHTML = "";
            explicación.innerHTML = "";
        
            caracteres_seguidos = 0;
            
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            for (let key in LIMPIEZAS) { 
                console.log(key)
                LIMPIEZAS[key]();
                console.log(texto.innerHTML)
                console.log(temp_text_inverso_activado)
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
        
            clearTimeout(borrado);
            clearTimeout(cambio_palabra);
            clearTimeout(tempo_text_borroso);
        }
        console.log(data)
        console.log("MIERDA PUTA")
        console.log(texto.innerHTML)
        console.log(temp_text_inverso_activado)
        if (!terminado) {
        if (puedeResucitarSegunEstado()) {
            iniciarMenu();
        } else {
            btnNo.click();
        }
        }
        }
    }
});
  
function resucitar(){
    terminado = false;
    desactivar_borrar = false;
    limpiar_bloqueo_putada();
    limpiar_teclado_lento();
    document.body.classList.remove('modo-resucitar');
    logo.style.display = "none"; 
    neon.style.display = "none"; 
    tiempo.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    tiempo.style.display = "";

    pararEscritura = true;
    stopConfetti();
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);  
    clearTimeout(sub_timer);
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    if(temp_text_inverso_activado == true){
        clearTimeout(tempo_text_inverso);
        temp_text_inverso_activado = false;
        procesarTexto();
    }

    texto.innerText = texto_guardado;
    texto.style.display = "";
    texto.style.height = "";
    feedback_tiempo.style.color = color_positivo;
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    console.log(modo_actual)
    if(modo_actual != "tertulia"){
    texto.contentEditable= "false";
    }
    //puntos.innerHTML = 0 + " palabras";
    //nivel.innerHTML = "nivel 0";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");
    
    // Desactiva, por seguridad, todos los modos.
    console.log(puntos)

    caracteres_seguidos = 0;
        texto.innerText = texto_guardado.trim();

        sendText()

        // Obtener el último nodo de texto en texto
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el último nodo de texto, colocamos el cursor allí
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        texto.scrollTo(0, texto.scrollHeight);
}

// Inicia el juego.
socket.on("inicio", (data) => {
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
    TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR + ajustarDestreza(data.parametros.TIEMPO_MODIFICADOR, atributos['destreza']);
    console.log(atributos);
    ajustarRapidez(rapidez_borrado, rapidez_inicio_borrado, atributos['agilidad'])
    secs_palabras = ajustarFuerza(SECS_BASE, atributos['fuerza'])
    desactivar_borrar = false;
    texto.style.height = "";

    logo.style.display = "none"; 
    neon.style.display = "none"; 
    texto.contentEditable= "false";
    tiempo.innerHTML = "";
    tiempo.style.display = "";

    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADOS?</span>'); 
    preparados.appendTo($('.container'));
    setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);

    setTimeout(() => {
    var counter = 3;
  
    timer = setInterval(function() {
      
      $('#countdown').remove();
      
      var countdown = $('<span id="countdown">'+(counter==0?'¡ESCRIBE!':counter)+'</span>'); 
      countdown.appendTo($('.container'));
  
      sub_timer = setTimeout(() => {
        if (counter > -1) {
          $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
        } else {
          $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        }
      }, 20);
  
      counter--;
  
      if (counter <= -1) {
        clearInterval(timer);
        setTimeout(() => {
          $('#countdown').remove();
        }, 1000);
      }
    }, 1000);
}, 1000);
});
});

socket.on("post-inicio", (data) => {
    console.log(data.borrar_texto, "borrar texto")
    post_inicio(data.borrar_texto);
});    

socket.on("borrar_texto_guardado", () => {
    texto_guardado = "";
    sendText();
});

function post_inicio(borrar_texto){
    clearTimeout(timer);
        if (borrar_texto == false) {
            texto.innerText = texto_guardado.trim();

            sendText()

            // Obtener el último nodo de texto en texto
            let lastLine = texto.lastChild;
            let lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                let caretNode = lastTextNode;
                let caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            texto.scrollTo(0, texto.scrollHeight);
            }
        
        //socket.off("recibe_temas");
        texto.contentEditable= "true";
        texto.focus();
}

// Resetea el tablero de juego.
socket.on("limpiar", (borrar) => {
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on("nombre" + player, (data) => {
        nombre.value = data;
    });
    if(borrar == false){
        texto_guardado = texto.innerText;
    }

    limpieza();
    document.body.classList.remove('partida-activa');

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
    animacion_modo();
    palabra.innerHTML = "";
    explicación.innerHTML = "";
    LIMPIEZAS[modo_actual](data);
    rapidez_borrado -= 100;
    rapidez_inicio_borrado -= 100;
    modo_actual = data.modo_actual;
    if(terminado == false){
    MODOS[modo_actual](data, socket);
    }
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
});

socket.on('fin', data => {
    console.log(data)
    if(player == data){
        console.log("confetti_auxAAXACASCASCASCAS")
        final();
    }
});

socket.on('reanudar_js', data => {
    es_pausa = false;
    reanudar();
});

socket.on(inspirar, data => {
    const palabra = typeof data === "string" ? data : data?.palabra;
    const musa_nombre = (data && typeof data === "object") ? (data.musa_nombre || data.musa) : "";
    if (palabra != "") {
        palabra_actual = [palabra];
        const musaLabel = musa_nombre ? escapeHtml(musa_nombre) : "MUSA";
        definicion.innerHTML = (`<span style='color: orange;'>${musaLabel}</span>` +
        "<span style='color: white;'>: </span>" +
        "<span style='color: white;'>Podrías escribir la palabra «</span>" +
        "<span style='color: lime; text-decoration: underline;'>" + escapeHtml(palabra) +
        "</span><span style='color: white;'>»</span>");
        definicion.dataset.origenMusa = "musa";
        animateCSS(".definicion", "flash");
        prepararDeteccionMultipalabraAsignada();
        asignada = true;
        texto.removeEventListener("keyup", listener_modo1);
        listener_modo1 = function (e) { palabras_musas(e) };
        texto.addEventListener("keyup", listener_modo1);
    }
});

socket.on(enviar_ventaja, ventaja => {
    feedback.innerHTML = ventaja + " <span style='color: red;'>¡DESVENTAJA!</span>";
    console.log(ventaja);
    PUTADAS[ventaja]();
    animateCSS(".feedback1", "flash").then((message) => {
        setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    }); 
});

socket.on("enviar_repentizado", repentizado => {

    if(terminado == false){
        //temas.innerHTML = "⚠️ "+ repentizado + " ⚠️";
        //efectoMaquinaDeEscribir(texto, repentizado, 150);
        //animateCSS(".temas", "flash")
    }
    
    });

socket.on("nueva letra", letra => {
    palabra_actual = []
    limpiarDeteccionMultipalabraAsignada();
    definicion.innerHTML = "";
    if(modo_actual == "letra prohibida"){
        letra_prohibida = letra;

        texto.removeEventListener("keydown", listener_modo);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("keydown", listener_modo);
        animacion_palabra();
        palabra.innerHTML = "LETRA PROHIBIDA: " + letra_prohibida;
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = letra;
        texto.removeEventListener("keydown", listener_modo);
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("keydown", listener_modo);
        animacion_palabra();
        palabra.innerHTML = "LETRA BENDITA: " + letra_bendita;
    }
});


socket.on(elegir_ventaja, () => {
    confetti_musas();
});

function recibir_palabra(data) {
    animacion_modo();
    palabra_actual = data.palabra_bonus[0];
    palabra.innerHTML = data.palabras_var + " (⏱️+" + data.tiempo_palabras_bonus + " segs.)" ;
    if (data.origen_musa === "musa") {
        const musaLabel = data.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA";
        definicion.innerHTML = `<span style="color:lime;">${musaLabel}</span><span style="color: white;">: </span><span style='color: white;'>Podrías escribir esta palabra ⬆️</span>`;
        definicion.dataset.origenMusa = "musa";
    } else {
        definicion.innerHTML = data.palabra_bonus[1];
        definicion.dataset.origenMusa = "";
    }

    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    prepararDeteccionMultipalabraAsignada();
    asignada = true;
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto.addEventListener("keyup", listener_modo);
}

function recibir_palabra_prohibida(data) {
    animacion_modo();
    palabra_actual = data.palabra_bonus[0];
    palabra.innerHTML = data.palabras_var + " (⏱️-" + data.tiempo_palabras_bonus + " segs.)";

    if (data.origen_musa === "musa_enemiga") {
        const musaLabel = data.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA ENEMIGA";
        definicion.innerHTML = `<span style="color:red;">${musaLabel}</span>: <span style='color: orange;'>me pega esta palabra ⬆️</span>`;
        definicion.dataset.origenMusa = "musa_enemiga";
    } else {
        definicion.innerHTML = data.palabra_bonus[1];
        definicion.dataset.origenMusa = "";
    }
    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    prepararDeteccionMultipalabraAsignada();
    asignada = true;
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
    texto.addEventListener("keyup", listener_modo);
}

// FUNCIONES AUXILIARES.

   /*************************************************************
      VARIABLES GLOBALES Y REFERENCIAS A ELEMENTOS DEL DOM
    **************************************************************/
      const mainMenu = document.getElementById('mainMenu');
      const quantityMenu = document.getElementById('quantityMenu');
  
      const btnSi = document.getElementById('btnSi');
      const btnNo = document.getElementById('btnNo');
      const btnInicio = document.getElementById('btnInicio');
      const mainMenuButtons = [btnSi, btnNo];
      let mainMenuIndex = 0;
  
      const quantityDisplay = document.getElementById('quantityDisplay');
      const btnConfirmar = document.getElementById('btnConfirmar');
      const btnAtras = document.getElementById('btnAtras');
      let quantityMenuElements = [btnConfirmar, btnAtras];
      let quantityMenuIndex = 0;
  
      let palabras = 1;
      const PALABRAS_A_SEGUNDOS = 3;
      let currentMenu = 'main';

      function contarPalabrasTexto(textoBase) {
        const matches = (textoBase || "").match(/\b\w+\b/g);
        return matches ? matches.length : 0;
      }

      function puedeResucitarSegunEstado() {
        return modo_actual !== "frase final" && contarPalabrasTexto(texto_guardado) > 0;
      }

      function ajustarPalabrasResucitar() {
        const max = contarPalabrasTexto(texto_guardado);
        const min = max > 0 ? 1 : 0;
        if (palabras < min) palabras = min;
        if (palabras > max) palabras = max;
        return { max, min };
      }

      function emitirEstadoResucitar(menuForzado = null) {
        if (!socket || typeof socket.emit !== "function") return;
        const { max } = ajustarPalabrasResucitar();
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        const menu = menuForzado || currentMenu;
        const visible = menu === "main"
          ? (mainMenu && mainMenu.style.display !== "none")
          : menu === "quantity"
            ? (quantityMenu && quantityMenu.style.display !== "none")
            : false;
        socket.emit("resucitar_menu", {
          player: playerNumber,
          menu,
          visible,
          mainIndex: mainMenuIndex,
          quantityIndex: quantityMenuIndex,
          palabras,
          max,
          segundos
        });
      }
  
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
          // 3) FUNCIÓN PRINCIPAL: INICIO DEL JUEGO
          // ------------------------------------------------------
          function inicioJuego() {
            animateCSS(".atributos", "backOutLeft")
              .then(() => {
                      // Creamos un nuevo elemento <style>
                const style = document.createElement('style');
                style.id = 'style-ocultar-cursor'; 
                // Añadimos !important para asegurar que se aplique por encima de cualquier otro cursor
                style.textContent = `* { cursor: none !important; }`;

                // Insertamos la regla en el <head> del documento
                document.head.appendChild(style);
                document.getElementById('atributos-container').style.display = "none";
              contenedor.style.display = "flex";
              btnInicio.style.display = "none";
              document.getElementById('total').style.display = "none";
              document.body.classList.add('partida-activa');
              animateCSS(".contenedor", "backInLeft");
      
                // Ponemos FULLSCREEN inmediatamente al iniciar
                toggleFullscreen();
      
                // Foco en el textarea
                texto.focus();
      
                // Listener global para alternar fullscreen con click si procede
                socket.emit("enviar_atributos", {player, atributos});
                document.addEventListener('click', function(event) {
                  // Sólo si no estamos en un menú de modificadores
                  if (!menu_modificador && modificadorButtons.length === 0) {
                    if (event.button === 0) {       // click izquierdo
                      toggleFullscreen();
                      texto.focus();
                    }
                  }
                });
              });
          }
        function actualizarSeleccionMainMenu() {
        mainMenuButtons.forEach(btn => btn.classList.remove('selected'));
        mainMenuButtons[mainMenuIndex].classList.add('selected');
        mainMenuButtons[mainMenuIndex].focus();
        emitirEstadoResucitar();
      }
  
      function actualizarSeleccionQuantityMenu(enfocar = true) {
        quantityMenuElements.forEach(el => el.classList.remove('selected'));
        quantityMenuElements[quantityMenuIndex].classList.add('selected');
        emitirEstadoResucitar();
        if (!enfocar) return;
        if (quantityMenuIndex === 0) btnConfirmar.focus();
        if (quantityMenuIndex === 1) btnAtras.focus();
      }
  
      function actualizarTextoCantidad() {
        const { max } = ajustarPalabrasResucitar();
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        quantityDisplay.innerHTML = `
          <div class="resucitar-stepper" aria-hidden="true">
            <div id="resucitarArrowUp" class="resucitar-stepper-arrow">&uarr;</div>
            <div id="resucitarArrowDown" class="resucitar-stepper-arrow">&darr;</div>
          </div>
          <div class="resucitar-metric">
            <span class="resucitar-label">Palabras</span>
            <span class="resucitar-value resucitar-pop palabras">${palabras}</span>
            <span class="resucitar-max">MAX ${max}</span>
          </div>
          <div class="resucitar-arrow">→</div>
          <div class="resucitar-metric">
            <span class="resucitar-label">Segundos</span>
            <span class="resucitar-value resucitar-pop segundos">${segundos}</span>
          </div>
        `;
        emitirEstadoResucitar();
      }

      function activarIndicadorConversor(direccion, esLimite) {
        const flecha = direccion === 'up'
          ? document.getElementById('resucitarArrowUp')
          : document.getElementById('resucitarArrowDown');
        if (!flecha) return;
        flecha.classList.remove('activo', 'limite');
        void flecha.offsetWidth;
        flecha.classList.add('activo');
        if (esLimite) {
          flecha.classList.add('limite');
        }
        flecha.addEventListener('animationend', () => {
          flecha.classList.remove('activo', 'limite');
        }, { once: true });
      }
      
      
      function recortarUltimasPalabras(text, cantidadPalabras) {
        if (cantidadPalabras <= 0) {
          return text;
        }
        
        let endPos = text.length; // posición hasta la que mantenemos el texto
        let palabrasEliminadas = 0;
  
        while (palabrasEliminadas < cantidadPalabras) {
          // 1. Ignorar espacios y saltos de línea desde el final (si los hay)
          while (endPos > 0 && /\s/.test(text[endPos - 1])) {
            endPos--;
          }
          if (endPos <= 0) {
            // Si se quedó sin texto, todo se elimina
            return '';
          }
  
          // 2. Retroceder hasta el inicio de la palabra previa
          let inicioPalabra = endPos - 1;
          while (inicioPalabra >= 0 && !/\s/.test(text[inicioPalabra])) {
            inicioPalabra--;
          }
  
          // Ajustamos endPos al inicio de esta palabra (para recortarla)
          endPos = inicioPalabra >= 0 ? inicioPalabra + 1 : 0;
          palabrasEliminadas++;
  
          if (endPos <= 0) {
            return '';
          }
        }
  
        // 3. Retornar sólo la parte que no recortamos, con la estructura intacta
        return text.substring(0, endPos);
      }

      function mostrarMenuQuantity() {
        mainMenu.style.display = 'none';
        quantityMenu.style.display = 'block';
        document.body.classList.add('modo-resucitar');
        currentMenu = 'quantity';
        quantityMenuIndex = 0;
        actualizarTextoCantidad();
        actualizarSeleccionQuantityMenu();
        emitirEstadoResucitar();
      }
  
      function mostrarMenuPrincipal() {
        quantityMenu.style.display = 'none';
        mainMenu.style.display = 'block';
        document.body.classList.add('modo-resucitar');
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        emitirEstadoResucitar();
      }

      function iniciarMenu() {
        if (!puedeResucitarSegunEstado()) {
          btnNo.click();
          return;
        }
        console.log("Iniciando menú");


        document.addEventListener('keydown', manejadorTeclas);
        animateCSS(".mainMenu", "flash");
        mainTitle.innerHTML = '<span class="resucitar-title-over">GAME OVER</span><span class="resucitar-title-question">&iquest;QUIERES <span class="resucitar-highlight">RESUCITAR</span> A CAMBIO DE PALABRAS?</span>';
        mainMenu.style.display = 'block';
        mainTitle.style.display = 'block';
        buttonContainer.style.display = 'flex';
        document.body.classList.add('modo-resucitar');
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        emitirEstadoResucitar();
        timeoutID_menu = setTimeout(() => {
            // Si seguimos en el menú (por ejemplo, no hubo otra acción), ejecuta el clic:
            console.log("Tiempo cumplido. Se hace clic automático en botón NO.");
            btnNo.click(); 
          }, 60000);
      }
  
      /*************************************************************
        EVENTOS DE CLICK PARA LOS BOTONES CON stopPropagation()
      **************************************************************/

    btnInicio.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se active el listener global
        inicioJuego();
        });
      btnSi.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se active el listener global
        if (!puedeResucitarSegunEstado()) {
          btnNo.click();
          return;
        }
        mostrarMenuQuantity();
      });
  
      btnNo.addEventListener('click', (evento) => {
        
        evento.stopPropagation();
        document.body.classList.remove('modo-resucitar');
        texto.innerText = texto_guardado;
        tiempo.style.color = "white";
        if (terminado == false) {
            socket.emit('fin_de_player', player)
          final();
          setTimeout(function () {
            texto.style.height = "";
            texto.rows = "1";
            texto.style.display = "none";
            //texto.innerText = texto_guardado;
            sendText();
            tiempo.style.color = "white";
          }, 2000);
        }
        animateCSS(".tiempo", "bounceInLeft");
        tiempo.innerHTML = "¡GRACIAS POR JUGAR!";
        actualizarBarraVida(tiempo, tiempo.innerHTML);
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }

        document.removeEventListener('keydown', manejadorTeclas);
        emitirEstadoResucitar('hidden');
                
        // Lógica para finalizar el juego.
      });
      
  
      btnConfirmar.addEventListener('click', (evento) => {
        evento.stopPropagation();
        clearTimeout(timeoutID_menu);
        socket.emit("resucitar", {player: player, secs: palabras * PALABRAS_A_SEGUNDOS});

        // Recortar las últimas "palabras" de "texto_guardado"
        console.log("texto_guardado", palabras);
        console.log("texto_guardado", texto_guardado);

        texto_guardado = recortarUltimasPalabras(texto_guardado, palabras);

        console.log("texto_guardado", texto_guardado);

        // Ocultar los menús para que no se vean más
        resucitar()
        mainMenu.style.display = 'none';
        quantityMenu.style.display = 'none';
        mainTitle.style.display = 'none';
        buttonContainer.style.display = 'none';
        
        document.removeEventListener('keydown', manejadorTeclas);
        emitirEstadoResucitar('hidden');

        post_inicio(false)
      });
  
      btnAtras.addEventListener('click', (evento) => {
        evento.stopPropagation();
        quantityMenu.style.display = 'none';
        mainMenu.style.display = 'block';
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        if (mainTitle) {
          mainTitle.style.display = 'block';
        }
        if (buttonContainer) {
          buttonContainer.style.display = 'flex';
        }
        emitirEstadoResucitar();
      });

      btnConfirmar.addEventListener('focus', () => {
        quantityMenuIndex = 0;
        actualizarSeleccionQuantityMenu(false);
      });

      btnAtras.addEventListener('focus', () => {
        quantityMenuIndex = 1;
        actualizarSeleccionQuantityMenu(false);
      });
  
      /*************************************************************
        EVENTO DE TECLAS: FLECHAS Y ENTER
      **************************************************************/
      // Definimos la función manejadora de eventos de teclado.
function manejadorTeclas(evento) {
    const tecla = (evento.key === 'Enter' || evento.code === 'NumpadEnter')
      ? 'Enter'
      : evento.key;
    evento.stopPropagation();
    if (currentMenu === 'main') {
      switch (tecla) {
        case 'ArrowLeft':
          mainMenuIndex = 0;
          actualizarSeleccionMainMenu();
          break;
        case 'ArrowRight':
          mainMenuIndex = 1;
          actualizarSeleccionMainMenu();
          break;
        default:
          break;
      }
    } else if (currentMenu === 'quantity') {
      switch (tecla) {
        case 'ArrowLeft':
          quantityMenuIndex--;
          if (quantityMenuIndex < 0) {
            quantityMenuIndex = quantityMenuElements.length - 1; 
          }
          actualizarSeleccionQuantityMenu();
          break;
        case 'ArrowRight':
          quantityMenuIndex++;
          if (quantityMenuIndex >= quantityMenuElements.length) {
            quantityMenuIndex = 0;
          }
          actualizarSeleccionQuantityMenu();
          break;
        case 'ArrowUp':
          evento.preventDefault();
          {
            const limites = ajustarPalabrasResucitar();
            let esLimite = false;
            if (palabras < limites.max) {
              palabras++;
              actualizarTextoCantidad();
              esLimite = palabras >= limites.max;
            } else {
              esLimite = true;
            }
            activarIndicadorConversor('up', esLimite);
          }
          break;
        case 'ArrowDown':
          evento.preventDefault();
          {
            const limites = ajustarPalabrasResucitar();
            let esLimite = false;
            if (palabras > limites.min) {
              palabras--;
              actualizarTextoCantidad();
              esLimite = palabras <= limites.min;
            } else {
              esLimite = true;
            }
            activarIndicadorConversor('down', esLimite);
          }
          break;
        case 'Enter':
          evento.preventDefault();
          {
            if (document.activeElement === btnAtras || quantityMenuIndex === 1) {
              btnAtras.click();
            } else if (document.activeElement === btnConfirmar || quantityMenuIndex === 0) {
              btnConfirmar.click();
            } else {
              btnConfirmar.click();
            }
          }
          break;
        default:
          break;
      }
    }
  }

// Función para enviar texto al otro jugador y a control
function sendText() {
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
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!texto.contains(sel.anchorNode)) return;
    solicitarEnvioCaret();
});

function activar_sockets_extratextuales() {
    // Recibe el nombre del jugador x y lo coloca en su sitio.
    socket.on("nombre" + player, (data) => {
        nombre.value = data;
    });

    //Recibe los temas (que elige Espectador) y los coloca en su sitio.
    socket.on("recibe_temas", (data) => {
        temas.innerHTML = data;
    });
    
    socket.on("recibir_comentario", (data) => {
        console.log(data)
        temas.innerHTML = data;
    });
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

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

function animacion_palabra() {
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
    animateCSS(".palabra", "bounceInLeft");
}

// Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
function restablecer_estilo() {
    texto.style.color = "white";
    document.body.style.backgroundColor = "black";
}

//Función auxiliar que comprueba que se inserta la palabra bonus.
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
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            socket.emit("nueva_palabra", player);
            socket.emit('aumentar_tiempo', {secs: tiempo_palabras_bonus, player});
            feedback.innerHTML = "⏱️+" + tiempo_palabras_bonus + " segs.";
            clearTimeout(delay_animacion);
            color = color_positivo;
            feedback.style.color = color;
            tiempo_feed = "⏱️+" + tiempo_palabras_bonus + " segs.";
            tipo = "rae";
            if (definicion.dataset.origenMusa === "musa") {
                tipo = "inspiracion";
            }
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo});

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
            marcarPalabraBenditaActual(inicioMarca, finMarca, esMusa);
            countChars(texto);
            sendText();
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
            const palabraEncontrada = Array.isArray(palabra_actual)
                ? palabra_actual.find(palabra => textContent
                    .substring(startingIndex, endingIndex)
                    .toLowerCase()
                    .includes((palabra || "").toLowerCase()))
                : palabra_actual;
            const palabraReportada = palabraEncontrada || textContent.substring(startingIndex, endingIndex);
            socket.emit("intento_prohibido", { player, tipo: "palabra", valor: palabraReportada });
            texto.focus();
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            socket.emit("nueva_palabra_prohibida", player);
            tiempo_palabras_bonus = -tiempo_palabras_bonus;
            socket.emit('aumentar_tiempo', {secs: tiempo_palabras_bonus, player});
            color = color_negativo;
            feedback.style.color = color;
            feedback.innerHTML = "⏱️" + tiempo_palabras_bonus + " segs.";
            tipo = "lista_prohibidas";
            console.log(definicion.innerHTML)
            if (definicion.dataset.origenMusa === "musa_enemiga") {
                tipo = "inspiracion";
            }
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            color = color_negativo;
            tiempo_feed = "⏱️" + tiempo_palabras_bonus + " segs.";
            socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo});
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

            definicion.innerHTML = "";
            texto.focus();
            asignada = false;
            limpiarDeteccionMultipalabraAsignada();
            feedback.style.color = "white";
            feedback.innerHTML = "+🎨 insp.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            color = "white";
            tiempo_feed = feedback.innerHTML;
            socket.emit("nueva_palabra_musa", player);
            socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "inspiracion" });

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

            if (marcarPalabraMusaActual(inicioMarca, finMarca)) {
                countChars(texto);
                sendText();
            }
        }
    }
}

function modo_letra_prohibida(e) {
    let letra = e.key;  // Captura la letra tecleada
  
    if (
      toNormalForm(letra) === letra_prohibida || 
      toNormalForm(letra) === letra_prohibida.toUpperCase()
    ) {
      e.preventDefault();  // Evita el comportamiento predeterminado del evento de tecla
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
  
      // Crea nodos de texto vacíos para actuar como delimitadores
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
  
      // Borra el span después de medio segundo
      setTimeout(() => {
        span.parentNode.removeChild(span);
      }, 100);
      */

      // Actualiza otros aspectos de la UI y envía eventos a través de Socket.io
      // Aquí iría la lógica para manejar la UI y eventos de Socket.io (la he mantenido igual)
      secs = -2;
      console.log(secs);
      socket.emit('aumentar_tiempo', {secs, player});
      puntos.innerHTML = puntos_ + " palabras";
      sendText();
      feedback.style.color = color_negativo;
      feedback.innerHTML = "⏱️-2 segs.";
      clearTimeout(delay_animacion);
      animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
          feedback.innerHTML = "";
        }, 2000);
      });
      color = color_negativo;
      tiempo_feed = feedback.innerHTML;
      socket.emit(feedback_de_j_x, { color, tiempo_feed, tipo: "letra_prohibida" });
    }
  }
  
  // Esta función se llama cuando se presiona una tecla
function modo_letra_bendita(e) {
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }

    if (bloquear_borrado_putada && e.key === 'Backspace') {
        e.preventDefault();
        return;
    }

    let letra = e.key; // Captura la letra tecleada
    let sel = window.getSelection();
    let range = sel.getRangeAt(0);
    let node = sel.anchorNode;

    // Añadido: Procesar tecla Backspace
    if (e.key === 'Backspace') {
        console.log('Node:', node);
        console.log('Parent Node:', node.parentNode);
        console.log('Parent Node class:', node.parentNode ? node.parentNode.className : 'No parent node');
        console.log('Focus Offset:', sel.focusOffset);

        if (node && node.parentNode.className === 'letra-verde' && sel.focusOffset === 0) {
            e.preventDefault(); // Prevenir el comportamiento por defecto de la tecla Backspace
            secs = -2
            socket.emit('aumentar_tiempo', {secs, player}); // Emitir el evento de socket
            // Feedback visual
            feedback.style.color = color_negativo;
            feedback.innerHTML = "⏱️-1 segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            // Envío de feedback a través de Socket.io
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed: feedback.innerHTML, tipo: "letra_bendita" });
        }
        return; // Salir de la función si la tecla es Backspace
    }

    if (letra.length === 1) {
        if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
            (letra_bendita === "ñ" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
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
            socket.emit('aumentar_tiempo', {secs, player});
            puntos.innerHTML = puntos_ + " palabras";
            console.log(puntos);
            sendText();

            // Feedback visual
            feedback.style.color = color_positivo;
            feedback.innerHTML = "⏱️+2 segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });

            // Envío de feedback a través de Socket.io
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed: feedback.innerHTML, tipo: "letra_bendita" });
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
    // Aquí podrías añadir más comportamientos para otras teclas no imprimibles si lo consideras necesario
}


  

function modo_psicodélico() {
    stylize();
}

function limpieza(){
    pararEscritura = true;
    clearTimeout(timeoutID_menu)
    stopConfetti();
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);  
    clearTimeout(sub_timer);
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
    feedback_tiempo.style.color = color_positivo;
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    texto.contentEditable= "false";
    puntos.innerHTML = 0 + " palabras";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
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
    limpiarDeteccionMultipalabraAsignada();
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    console.log(puntos)
    
    feedback.innerHTML = "";
    
    definicion.innerHTML = "";
    explicación.innerHTML = "";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    caracteres_seguidos = 0;
    
    for (let key in LIMPIEZAS) { 
        console.log(key)
        LIMPIEZAS[key]();
    }

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    clearTimeout(tempo_text_borroso);
}

function limpieza_final(){
    clearTimeout(timeoutID_menu);
    confetti_aux();
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    texto.contentEditable= "false";
    texto.style.display = "none";
    temas.display = "none";
    temas.innerHTML = "";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";

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

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    LIMPIEZAS["psicodélico"]("");

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    //clearTimeout(tempo_text_borroso);
}

function pausa(){

    menu_modificador = false;
    texto.contentEditable= "false";

    clearTimeout(borrado);
    desactivar_borrar = true;
}

function reanudar(){

    menu_modificador = true;
    texto.contentEditable = "true";

    clearTimeout(borrado);
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
        
        sendText();
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
        sendText()  
        }, TIEMPO_MODIFICADOR);
    }
}

function tiempo_borrado_menos(){
    borrado_cambiado = true;
    antiguo_rapidez_borrado = rapidez_borrado;
    antiguo_inicio_borrado = rapidez_inicio_borrado;
    rapidez_borrado = 7000;
    rapidez_inicio_borrado = 7000;
    setTimeout(function () {
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
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            modo_texto_borroso = 0
            putada_actual = ""
        }, data);   
    }
}

var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecución

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function confetti_aux() {
  var animationEnd = Date.now() + duration; // Actualiza aquí dentro de la función
  isConfettiRunning = true; // Habilita la ejecución de confetti
  console.log(isConfettiRunning);
  
  var interval = setInterval(function() {
    if (!isConfettiRunning) {
      clearInterval(interval);
      return;
    }

    var timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    var particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function stopConfetti() {
  isConfettiRunning = false; // Deshabilita la ejecución de confetti
  confetti.reset(); // Detiene la animación de confetti
}

function final(){
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
    texto.style.height = texto.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
    texto.style.display = "none";
    
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    });
    logo.style.display = "";
    neon.style.display = "";
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    LIMPIEZAS["psicodélico"]("");/* TODO: VER POR QUÉ NO FUNCIONA ESTO  */
    texto.removeEventListener("keyup", listener_modo_psico);
    restablecer_estilo();
    tiempo.style.color = "white";
}

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }
  
// El URL de tu servidor LanguageTool
const apiUrl = 'https://language-tool.zeabur.app/v2/check?language=es-ES&disabledRules=UPPERCASE_SENTENCE_START&text=';
let ultimoOffsetVerificado = 0;  // Guarda la última posición verificada

const penalizaciones = {
    "Cambios en las normas lingüísticas": -1,
    "Concordancia en grupos nominales": -2,
    "Concordancia sujeto/predicado": -2,
    "Confusiones": -1,
    "Confusiones (2)": -1,
    "Diacríticos (tilde)": -1,
    "Errores según el contexto": -1,
    "Estilo": -1,
    "Expresiones incorrectas": -1,
    "Gramática": -2,
    "Mayúsculas y minúsculas": -1,
    "Miscellaneous": -1,
    "Ortografía": -1,
    "Posible error ortográfico": -1,
    "Preposiciones": -1,
    "Puntuación": -1,
    "Redundancias": -1,
    "Reglas específicas para Wikipedia": -1,
    "Repeticiones (estilo)": -1,
    "Semàntica": -1,
    "Tipografía": -1,
    "Variedades de lengua": -1,
    "Varios": -1,
    "diacríticos (experimental)": -1,
    "expresiones preferibles": -1,
    "nombres propios": -1,
    "repeticiones": -1,
    "tipografía avanzada": -1
};

// Función que determina la penalización basada en la categoría de error
function determinarPenalizacion(categoria) {
    return penalizaciones[categoria] || -1;  // Devuelve -1 si la categoría no está en el objeto
}

// Función que hace la petición al servidor
function hacerPeticion(textoDesdeUltimoOffset) {
    return fetch(apiUrl + encodeURIComponent(textoDesdeUltimoOffset))
    .then(response => response.json())
    .then(data => {
        let totalPenalizacion = 0;
        console.log(`Número de errores detectados: ${data.matches.length}`);
        // Imprimir detalles de cada error y calcular penalización
        data.matches.forEach((error, index) => {
            const palabraError = textoDesdeUltimoOffset.substr(error.context.offset, error.context.length);
            const penalizacion = determinarPenalizacion(error.rule.category.name);
            totalPenalizacion += penalizacion;

            console.log(`Error ${index + 1}:`);
            console.log(`- Mensaje: ${error.message}`);
            console.log(`- Palabra con error: ${palabraError}`);
            console.log(`- Texto completo del error: ${error.context.text}`);
            console.log(`- Penalización: ${penalizacion}`);
            console.log('-------------------------');
        });
        
        console.log(`Penalización total: ${totalPenalizacion}`);
        // Actualizar el último offset verificado
        ultimoOffsetVerificado = textoDesdeUltimoOffset.length;
        return totalPenalizacion;
    })
    .catch(error => {
        console.error('Error al hacer la petición:', error);
    });
}

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

function modo_ortografía_perfecta() {
    setInterval(() => {
        // Tomar solo el nuevo texto desde el puntero de inicio hasta el final ajustado
        const nuevoTexto = ajustarPunteros(texto.innerText);
        // Actualizar el puntero de inicio global para la próxima iteración
        punteroInicio += nuevoTexto.length;

        hacerPeticion(nuevoTexto).then(descuento => {
            if(descuento != 0) {
                feedback.style.color = color_negativo;
                feedback.innerHTML = "⏱️" + descuento +" segs.";
                clearTimeout(delay_animacion);
                animateCSS(".feedback1", "flash").then((message) => {
                    delay_animacion = setTimeout(function () {
                        feedback.innerHTML = "";
                    }, 2000);
                });
            }
        });
    }, 10000);
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
    sendText();
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

const textarea = texto;

document.addEventListener('DOMContentLoaded', function () {
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
});

function function_frase_final() {

    animacion_modo();
    palabra.innerHTML = "«"+frase_final+"»";
    definicion.innerHTML = "⬆️ ¡Introduce la frase final para ganar! ⬆️"
    limpiarMarcadoFraseFinal();

    texto.removeEventListener("keyup", listener_modo);
    listener_modo = function (e) { modo_frase_final(e) };
    texto.addEventListener("keyup", listener_modo);
}

function modo_frase_final(e) {
    actualizarProgresoFraseFinal();
    // Obtenemos el texto completo del elemento
    let textContent = e.target.innerText;
    // Convertimos a minúsculas y recortamos espacios (opcional pero recomendable):
    let textLower = textContent.trim().toLowerCase();
  
    // Revisamos si el texto termina exactamente con esa frase final:
    if (textLower.endsWith(frase_final)) {
      // Aquí va tu lógica de finalización
      final();
      socket.emit("fin_de_player", player);
    }
  }

  function ajustarFuerza(secs_base, fuerza) {
    // 1. Validación de tipos:
    if (typeof secs_base !== 'number' || typeof fuerza !== 'number') {
      throw new TypeError('ajustarFuerza: ambos parámetros deben ser números');
    }
  
    // 2. Caso fuerza === 0: devolvemos el valor base sin alteraciones.
    if (fuerza === 0) {
      return Math.round(secs_base);
    }
  
    // 3. Colapsamos fuerza al máximo si lo excede:
    if (fuerza > LIMITE_TOTAL) {
      fuerza = LIMITE_TOTAL;
    }
  
    // 4. Cálculo del factor logarítmico normalizado:
    //    Numerador: log(fuerza + 1)
    //    Denominador: log(LIMITE_TOTAL + 1) para que el máximo sea 1
    const factorLog = Math.log(fuerza + 1) / Math.log(LIMITE_TOTAL + 1);
  
    // 5. Porcentaje de incremento final:
    //    maxIncremento * factorLog, entre 0 y maxIncremento
    const pctIncremento = maxIncremento * factorLog;
  
    // 6. Cálculo del resultado y redondeo:
    const resultado = Math.round(secs_base * (1 + pctIncremento));
  
    // 7. (Opcional) Depuración en consola:
    console.log(
      `[ajustarFuerza] secs_base=${secs_base}, fuerza=${fuerza}, ` +
      `factorLog=${factorLog.toFixed(3)}, pctInc=${(pctIncremento*100).toFixed(1)}% → resultado=${resultado}`
    );
  
    return resultado;
  }


  function ajustarDestreza(secs_base, destreza) {
    // 1. Validación de tipos:
    if (typeof secs_base !== 'number' || typeof destreza !== 'number') {
      throw new TypeError('ajustarDestreza: ambos parámetros deben ser números');
    }
  
    // 2. Caso destreza === 0: devolvemos el valor base sin alteraciones.
    if (destreza === 0) {
      return Math.round(secs_base);
    }
  
    // 3. Limitar destreza al rango [0, LIMITE_TOTAL].
    if (destreza > LIMITE_TOTAL) {
      destreza = LIMITE_TOTAL;
    }
  
    // 4. Cálculo del factor logarítmico normalizado:
    //    Numerador:   log(destreza + 1)
    //    Denominador: log(LIMITE_TOTAL + 1) → máximo factor = 1
    const numerador   = Math.log(destreza + 1);
    const denominador = Math.log(LIMITE_TOTAL + 1);
    const factorLog   = numerador / denominador;
  
    // 5. Porcentaje de reducción final:
    //    Entre 0 (sin cambio) y maxIncremento (reducción máxima).
    const pctReduccion = maxIncrementoDestreza * factorLog;
  
    // 6. Cálculo del nuevo valor:
    const resultado = Math.round(secs_base * (1 - pctReduccion));
  
    // 7. (Opcional) Depuración en consola:
    console.log(
      `[ajustarDestreza] secs_base=${secs_base}, destreza=${destreza}, ` +
      `factorLog=${factorLog.toFixed(3)}, pctRed=${(pctReduccion*100).toFixed(1)}% → resultado=${resultado}`
    );
  
    return resultado;
  }

  function ajustarRapidez(baseRapidezBorrado, baseInicioBorrado, agilidad) {
    // 1. Validación de tipos:
    if (typeof baseRapidezBorrado !== 'number' ||
        typeof baseInicioBorrado  !== 'number' ||
        typeof agilidad          !== 'number') {
      throw new TypeError('ajustarRapidez: todos los parámetros deben ser números');
    }
  
    // 2. Caso agilidad === 0: devolvemos las bases sin alteraciones.
    if (agilidad === 0) {
      rapidez_borrado        = baseRapidezBorrado;
      rapidez_inicio_borrado = baseInicioBorrado;
      console.log(
        `[ajustarRapidez] agilidad=0 → rapidez_borrado=${rapidez_borrado}, ` +
        `rapidez_inicio_borrado=${rapidez_inicio_borrado}`
      );
      return;
    }
  
    // 3. Colapsar agilidad al máximo si lo excede:
    if (agilidad > LIMITE_TOTAL) {
      agilidad = LIMITE_TOTAL;
    }
  
    // 4. Cálculo del factor logarítmico normalizado:
    //    - Numerador:   log(agilidad + 1) crece de forma decreciente.
    //    - Denominador: log(LIMITE_TOTAL + 1) garantiza que el máximo sea 1.
    const factorLog = Math.log(agilidad + 1) / Math.log(LIMITE_TOTAL + 1);
  
    // 5. Porcentaje de incremento final:
    //    Entre 0 (sin cambio) y maxIncremento (incremento máximo).
    const pctIncremento = maxIncremento * factorLog;
  
    // 6. Aplicación del incremento y redondeo opcional:
    rapidez_borrado        = Math.round(baseRapidezBorrado     * (1 + pctIncremento));
    rapidez_inicio_borrado = Math.round(baseInicioBorrado      * (1 + pctIncremento));
  
    // 7. Depuración en consola:
    console.log(
      `[ajustarRapidez] baseRapidezBorrado=${baseRapidezBorrado}, baseInicioBorrado=${baseInicioBorrado}, ` +
      `agilidad=${agilidad}, factorLog=${factorLog.toFixed(3)}, ` +
      `pctInc=${(pctIncremento*100).toFixed(1)}% → rapidez_borrado=${rapidez_borrado}, ` +
      `rapidez_inicio_borrado=${rapidez_inicio_borrado}`
    );
  }
  

  /**
 * reduceLog:
 *   Reduce un tiempo (ms) aplicando una atenuación logarítmica.
 *
 * @param {number} base    - Valor original en milisegundos (debe ser > 0).
 * @param {number} k       - Coeficiente de “fuerza” de la reducción. 
 *                           k = 0 → sin reducción; a mayor k → más reducción.
 * @returns {number}       - Nuevo valor en ms, redondeado.
 */
function reduceLog(base, k = 1) {
    if (base <= 0) return 0;
    // 1) Calculamos ln(base)
    const lnBase = Math.log(base);
    // 2) Creamos el denominador 1 + k·ln(base), para que nunca divida por 0
    const denom = 1 + k * lnBase;
    // 3) Dividimos y redondeamos
    return Math.round(base / denom);
  }
  
