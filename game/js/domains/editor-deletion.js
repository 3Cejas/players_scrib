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

    function esInputTypeBorrado(inputType) {
        const tipo = String(inputType || "").trim().toLowerCase();
        return tipo.startsWith("delete") || tipo === "historyundo" || tipo === "historyredo";
    }

    function esTeclaBorrado(evento) {
        if (!evento) return false;
        const tecla = String(evento.key || "").trim().toLowerCase();
        const codigoNumerico = Number(evento.keyCode || evento.which || 0);

        if (
            tecla === "backspace"
            || tecla === "delete"
            || tecla === "del"
            || tecla === "undo"
            || tecla === "redo"
            || tecla === "cut"
            || codigoNumerico === 8
            || codigoNumerico === 46
        ) {
            return true;
        }

        const modificadorEdicion = evento.ctrlKey === true || evento.metaKey === true;
        if (!modificadorEdicion || evento.altKey === true) return false;

        // Cortar y deshacer/rehacer pueden eliminar contenido sin una tecla
        // Backspace/Delete. Los demás atajos se dejan al beforeinput destructivo.
        return ["x", "z", "y"].includes(tecla);
    }

    function esRangoNoColapsado(rango) {
        if (!rango) return false;
        if (typeof rango.collapsed === "boolean") return !rango.collapsed;
        return rango.startContainer !== rango.endContainer || rango.startOffset !== rango.endOffset;
    }

    function obtenerSeleccionEditor(editor) {
        const documento = editor && editor.ownerDocument;
        if (documento && typeof documento.getSelection === "function") {
            return documento.getSelection();
        }
        if (global && typeof global.getSelection === "function") {
            return global.getSelection();
        }
        return null;
    }

    function seleccionNoColapsadaEnEditor(editor, evento) {
        const rangosObjetivo = typeof evento?.getTargetRanges === "function"
            ? evento.getTargetRanges()
            : [];
        if (Array.from(rangosObjetivo || []).some(esRangoNoColapsado)) return true;

        const seleccion = obtenerSeleccionEditor(editor);
        if (!seleccion || !seleccion.rangeCount) return false;
        const rango = seleccion.getRangeAt(0);
        if (!esRangoNoColapsado(rango)) return false;
        if (!editor || typeof editor.contains !== "function") return true;
        const ancestro = rango.commonAncestorContainer || rango.startContainer;
        return ancestro === editor || editor.contains(ancestro);
    }

    function esReemplazoDeSeleccion(evento, editor, opciones = {}) {
        const tipo = String(evento?.inputType || "").trim().toLowerCase();
        if (tipo === "insertreplacementtext") return true;
        if (!tipo.startsWith("insert")) return false;
        if (tipo.includes("composition") && opciones.composicionIniciadaEnCaret === true) return false;
        return seleccionNoColapsadaEnEditor(editor, evento);
    }

    function esArrastreConBorrado(evento, editor) {
        const tipoEvento = String(evento?.type || "").toLowerCase();
        if (tipoEvento !== "dragstart" && tipoEvento !== "drop") return false;
        const efecto = String(evento?.dataTransfer?.dropEffect || evento?.dataTransfer?.effectAllowed || "")
            .toLowerCase();
        return efecto.includes("move") || seleccionNoColapsadaEnEditor(editor, evento);
    }

    function esEventoBorradoManual(evento, editor, opciones = {}) {
        if (!evento) return false;
        const tipoEvento = String(evento.type || "").toLowerCase();
        if (tipoEvento === "cut") return true;
        if (tipoEvento === "beforeinput") {
            return esInputTypeBorrado(evento.inputType) || esReemplazoDeSeleccion(evento, editor, opciones);
        }
        if (tipoEvento === "keydown") return esTeclaBorrado(evento);
        return esArrastreConBorrado(evento, editor);
    }

    function cancelarEventoBorrado(evento) {
        if (typeof evento?.preventDefault === "function") evento.preventDefault();
        if (typeof evento?.stopImmediatePropagation === "function") evento.stopImmediatePropagation();
        if (typeof evento?.stopPropagation === "function") evento.stopPropagation();
    }

    function capturarEstadoEditor(editor) {
        if (!editor || typeof editor.innerHTML !== "string") return null;
        return { html: editor.innerHTML };
    }

    function restaurarEstadoEditor(editor, estado) {
        if (!editor || !estado || typeof estado.html !== "string") return false;
        editor.innerHTML = estado.html;
        if (typeof editor.focus === "function") editor.focus();
        return true;
    }

    function instalarBloqueoBorradoManual(editor, estaActivo) {
        if (!editor || typeof editor.addEventListener !== "function") {
            return function () {};
        }

        const leerActivo = typeof estaActivo === "function" ? estaActivo : function () { return false; };
        let ultimoEstadoSeguro = capturarEstadoEditor(editor);
        let restauracionPendiente = null;
        let composicionIniciadaEnCaret = false;
        const bloquear = function (evento) {
            const tipoEvento = String(evento?.type || "").toLowerCase();
            if (tipoEvento === "compositionstart") {
                const reemplazaSeleccion = seleccionNoColapsadaEnEditor(editor, evento);
                composicionIniciadaEnCaret = !reemplazaSeleccion;
                if (!leerActivo() || !reemplazaSeleccion) return;
                cancelarEventoBorrado(evento);
                return;
            }
            if (tipoEvento === "compositionend") {
                composicionIniciadaEnCaret = false;
                return;
            }
            if (!leerActivo()) return;
            const opcionesEvento = { composicionIniciadaEnCaret };
            if (!esEventoBorradoManual(evento, editor, opcionesEvento)) {
                if (tipoEvento === "beforeinput") {
                    restauracionPendiente = null;
                }
                return;
            }
            // Solo un beforeinput que el navegador declara no cancelable puede
            // necesitar rollback. Guardar una instantánea tras keydown/cut/drag
            // dejaría estado obsoleto que podría revertir una mutación legítima
            // posterior del propio ciclo de juego.
            restauracionPendiente = tipoEvento === "beforeinput" && evento.cancelable === false
                ? {
                    estado: capturarEstadoEditor(editor) || ultimoEstadoSeguro,
                    reemplazo: esReemplazoDeSeleccion(evento, editor, opcionesEvento)
                }
                : null;
            cancelarEventoBorrado(evento);
        };
        const vigilarInput = function (evento) {
            if (!leerActivo()) {
                ultimoEstadoSeguro = capturarEstadoEditor(editor);
                restauracionPendiente = null;
                return;
            }
            const tipo = String(evento?.inputType || "");
            const borrarSinBeforeInput = esInputTypeBorrado(tipo);
            const reemplazoNoCancelable = Boolean(restauracionPendiente?.reemplazo && tipo.toLowerCase().startsWith("insert"));
            const mutacionSinTipoTrasBloqueo = Boolean(restauracionPendiente && !tipo);
            if (!borrarSinBeforeInput && !reemplazoNoCancelable && !mutacionSinTipoTrasBloqueo) {
                ultimoEstadoSeguro = capturarEstadoEditor(editor);
                restauracionPendiente = null;
                return;
            }

            const estado = restauracionPendiente?.estado || ultimoEstadoSeguro;
            restaurarEstadoEditor(editor, estado);
            restauracionPendiente = null;
            ultimoEstadoSeguro = capturarEstadoEditor(editor) || estado;
            cancelarEventoBorrado(evento);
        };
        const eventos = [
            "keydown",
            "beforeinput",
            "cut",
            "dragstart",
            "drop",
            "compositionstart",
            "compositionend"
        ];
        eventos.forEach((tipo) => editor.addEventListener(tipo, bloquear, true));
        editor.addEventListener("input", vigilarInput, true);

        return function desinstalarBloqueoBorradoManual() {
            if (typeof editor.removeEventListener !== "function") return;
            eventos.forEach((tipo) => editor.removeEventListener(tipo, bloquear, true));
            editor.removeEventListener("input", vigilarInput, true);
        };
    }

    global.ScribEditorDeletion = {
        borrarCaracterEditableJuntoAProtegido,
        borrarUltimoCaracterEditable,
        esEventoBorradoManual,
        esInputTypeBorrado,
        esReemplazoDeSeleccion,
        esTeclaBorrado,
        esNodoProtegido,
        instalarBloqueoBorradoManual,
        obtenerNodosTextoEditablesAlrededor,
        obtenerUltimoNodoTextoEditable
    };
})(window);
