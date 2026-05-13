(function initScribEditorDeletion(global) {
    const TEXT_NODE = 3;
    const ELEMENT_NODE = 1;
    const DEFAULT_PROTECTED_CLASSES = ["palabra-bendita", "palabra-musa", "letra-verde"];

    function normalizarClases(clases) {
        return Array.isArray(clases) && clases.length
            ? clases.map((clase) => String(clase || "").trim()).filter(Boolean)
            : DEFAULT_PROTECTED_CLASSES;
    }

    function obtenerHijos(nodo) {
        return Array.from((nodo && nodo.childNodes) || []);
    }

    function tieneClase(nodo, clase) {
        if (!nodo || !clase) return false;
        if (nodo.classList && typeof nodo.classList.contains === "function") {
            return nodo.classList.contains(clase);
        }
        const clases = typeof nodo.className === "string"
            ? nodo.className
            : (typeof nodo.getAttribute === "function" ? nodo.getAttribute("class") : "");
        return String(clases || "").split(/\s+/).includes(clase);
    }

    function esContentEditableFalse(nodo) {
        if (!nodo || nodo.nodeType !== ELEMENT_NODE) return false;
        if (typeof nodo.getAttribute === "function") {
            return nodo.getAttribute("contenteditable") === "false";
        }
        return String(nodo.contentEditable || "").toLowerCase() === "false";
    }

    function esNodoProtegido(nodo, clasesProtegidas = DEFAULT_PROTECTED_CLASSES) {
        if (!nodo || nodo.nodeType !== ELEMENT_NODE) return false;
        const clases = normalizarClases(clasesProtegidas);
        return clases.some((clase) => tieneClase(nodo, clase)) || esContentEditableFalse(nodo);
    }

    function leerTextoNodo(nodo) {
        if (!nodo) return "";
        if (typeof nodo.data === "string") return nodo.data;
        return typeof nodo.textContent === "string" ? nodo.textContent : "";
    }

    function escribirTextoNodo(nodo, valor) {
        if (!nodo) return;
        if (typeof nodo.data === "string") {
            nodo.data = valor;
        }
        nodo.textContent = valor;
    }

    function obtenerUltimoNodoTextoEditable(raiz, opciones = {}) {
        if (!raiz) return null;
        const clasesProtegidas = normalizarClases(opciones.protectedClasses || opciones.clasesProtegidas);
        let ultimo = null;

        const visitar = (nodo, dentroProtegido = false) => {
            if (!nodo) return;
            if (nodo.nodeType === TEXT_NODE) {
                if (!dentroProtegido && leerTextoNodo(nodo).length > 0) {
                    ultimo = nodo;
                }
                return;
            }
            if (nodo.nodeType !== ELEMENT_NODE && nodo !== raiz) return;
            const protegido = dentroProtegido || esNodoProtegido(nodo, clasesProtegidas);
            obtenerHijos(nodo).forEach((hijo) => visitar(hijo, protegido));
        };

        visitar(raiz, false);
        return ultimo;
    }

    function removerNodoVacio(nodo) {
        if (!nodo || leerTextoNodo(nodo).length > 0) return;
        if (nodo.parentNode && typeof nodo.parentNode.removeChild === "function") {
            nodo.parentNode.removeChild(nodo);
        } else if (typeof nodo.remove === "function") {
            nodo.remove();
        }
    }

    function borrarUltimoCaracterEditable(raiz, opciones = {}) {
        const nodo = obtenerUltimoNodoTextoEditable(raiz, opciones);
        if (!nodo) {
            return { deleted: false, node: null, removedNode: false };
        }
        const textoActual = leerTextoNodo(nodo);
        if (!textoActual) {
            return { deleted: false, node: nodo, removedNode: false };
        }
        const siguienteTexto = textoActual.slice(0, -1);
        escribirTextoNodo(nodo, siguienteTexto);
        const eliminado = siguienteTexto.length === 0;
        if (eliminado) {
            removerNodoVacio(nodo);
        }
        return {
            deleted: true,
            node: nodo,
            removedNode: eliminado,
            previousText: textoActual,
            nextText: siguienteTexto
        };
    }

    function obtenerNodosTextoEditablesAlrededor(raiz, nodoProtegido, opciones = {}) {
        const clasesProtegidas = normalizarClases(opciones.protectedClasses || opciones.clasesProtegidas);
        let anterior = null;
        let siguiente = null;
        let encontrado = false;

        const visitar = (nodo, dentroProtegido = false) => {
            if (!nodo || siguiente) return;
            if (nodo === nodoProtegido) {
                encontrado = true;
                return;
            }
            if (nodo.nodeType === TEXT_NODE) {
                if (!dentroProtegido && leerTextoNodo(nodo).length > 0) {
                    if (encontrado) {
                        siguiente = nodo;
                    } else {
                        anterior = nodo;
                    }
                }
                return;
            }
            if (nodo.nodeType !== ELEMENT_NODE && nodo !== raiz) return;
            const protegido = dentroProtegido || (nodo !== raiz && esNodoProtegido(nodo, clasesProtegidas));
            if (protegido) return;
            obtenerHijos(nodo).forEach((hijo) => visitar(hijo, protegido));
        };

        visitar(raiz, false);
        return { anterior, siguiente, encontrado };
    }

    function borrarCaracterEditableJuntoAProtegido(raiz, nodoProtegido, direccion = "backward", opciones = {}) {
        if (!raiz || !nodoProtegido) {
            return { deleted: false, node: null, removedNode: false, protectedNode: nodoProtegido || null };
        }
        const { anterior, siguiente, encontrado } = obtenerNodosTextoEditablesAlrededor(raiz, nodoProtegido, opciones);
        if (!encontrado) {
            return { deleted: false, node: null, removedNode: false, protectedNode: nodoProtegido };
        }
        const borrarHaciaDelante = direccion === "forward";
        const nodo = borrarHaciaDelante ? siguiente : anterior;
        if (!nodo) {
            return { deleted: false, node: null, removedNode: false, protectedNode: nodoProtegido };
        }
        const textoActual = leerTextoNodo(nodo);
        if (!textoActual) {
            return { deleted: false, node: nodo, removedNode: false, protectedNode: nodoProtegido };
        }
        const siguienteTexto = borrarHaciaDelante
            ? textoActual.slice(1)
            : textoActual.slice(0, -1);
        escribirTextoNodo(nodo, siguienteTexto);
        const eliminado = siguienteTexto.length === 0;
        if (eliminado) {
            removerNodoVacio(nodo);
        }
        return {
            deleted: true,
            direction: borrarHaciaDelante ? "forward" : "backward",
            node: nodo,
            protectedNode: nodoProtegido,
            removedNode: eliminado,
            previousText: textoActual,
            nextText: siguienteTexto
        };
    }

    global.ScribEditorDeletion = {
        borrarCaracterEditableJuntoAProtegido,
        borrarUltimoCaracterEditable,
        esNodoProtegido,
        obtenerNodosTextoEditablesAlrededor,
        obtenerUltimoNodoTextoEditable
    };
})(window);
