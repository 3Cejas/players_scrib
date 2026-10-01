(function initMuseLetterInput(global) {
    function normalizar(valor) {
        return global.ScribInspiration.normalizarTexto(String(valor || ""));
    }

    // Keep decomposed accents together (including n + tilde), and retain
    // UTF-16 offsets so filtering does not move the native input's caret.
    function segmentos(texto, letra) {
        const objetivo = normalizar(letra);
        return Array.from(String(texto || "").matchAll(/[^\p{M}]\p{M}*|\p{M}+/gu), (match) => ({
            texto: match[0], inicio: match.index,
            coincide: Boolean(objetivo) && normalizar(match[0]) === objetivo
        }));
    }

    function filtrarTexto(texto, letra) {
        return segmentos(texto, letra).filter(parte => !parte.coincide).map(parte => parte.texto).join("");
    }

    function createController({ input, root, mirror, insertText, windowRef = global } = {}) {
        if (!input || !root || !mirror) return null;
        const documentRef = input.ownerDocument;
        const viewport = documentRef.createElement("span");
        viewport.className = "musa-letter-mirror__viewport";
        const text = documentRef.createElement("span");
        text.className = "musa-letter-mirror__text";
        viewport.appendChild(text);
        mirror.replaceChildren(viewport);
        let modo = "";
        let letra = "";
        let componiendo = false;
        let frame = null;
        const maldita = () => modo === "letra prohibida" && Boolean(letra);
        const filtrar = valor => maldita() ? filtrarTexto(valor, letra) : String(valor || "");

        function sincronizarScroll() {
            viewport.scrollLeft = input.scrollLeft;
        }

        function refrescar() {
            const activo = modo === "letra bendita" && Boolean(letra) && Boolean(input.value);
            root.classList.toggle("musa-letter-highlight", activo);
            mirror.hidden = !activo;
            text.replaceChildren();
            if (!activo) return;
            const style = windowRef.getComputedStyle(input);
            for (const property of ["font", "letterSpacing", "textAlign", "textTransform", "direction", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"]) {
                mirror.style[property] = style[property];
            }
            const fragment = documentRef.createDocumentFragment();
            segmentos(input.value, letra).forEach(parte => {
                const span = documentRef.createElement("span");
                span.textContent = parte.texto;
                if (parte.coincide) span.className = "musa-letter-mirror__blessed";
                fragment.appendChild(span);
            });
            text.appendChild(fragment);
            sincronizarScroll();
        }

        function programarScroll() {
            if (frame !== null) return;
            frame = windowRef.requestAnimationFrame(() => {
                frame = null;
                sincronizarScroll();
            });
        }

        function sanear() {
            const actual = String(input.value || "");
            const limpio = filtrar(actual);
            if (limpio !== actual) {
                const inicio = input.selectionStart ?? actual.length;
                const fin = input.selectionEnd ?? inicio;
                // Map each selection boundary through whole graphemes: slicing
                // inside an accent must not turn a legal ñ into a forbidden n.
                const cursorLimpio = posicion => segmentos(actual, letra)
                    .filter(parte => !parte.coincide && parte.inicio < posicion)
                    .reduce((total, parte) => total + Math.min(parte.texto.length, posicion - parte.inicio), 0);
                const direccion = input.selectionDirection || "none";
                input.value = limpio;
                input.setSelectionRange(cursorLimpio(inicio), cursorLimpio(fin), direccion);
            }
            refrescar();
            programarScroll();
            return limpio;
        }

        function insertar(valor) {
            const inicio = input.selectionStart ?? input.value.length;
            const fin = input.selectionEnd ?? inicio;
            const espacio = input.maxLength > 0 ? input.maxLength - (input.value.length - (fin - inicio)) : Infinity;
            const limpio = filtrar(valor).slice(0, Math.max(0, espacio));
            // If all the inserted characters are forbidden, leave a selected
            // part of the existing word intact instead of deleting it.
            if (!limpio) return;
            if (typeof insertText === "function") {
                insertText(limpio);
                return;
            }
            input.setRangeText(limpio, inicio, fin, "end");
            input.dispatchEvent(new windowRef.Event("input", { bubbles: true }));
        }

        input.addEventListener("keydown", event => {
            if (maldita() && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing
                && Array.from(event.key || "").length === 1 && filtrar(event.key) !== event.key) {
                event.preventDefault();
            }
            programarScroll();
        });
        input.addEventListener("beforeinput", event => {
            if (!maldita() || event.defaultPrevented || event.isComposing || componiendo
                || !String(event.inputType || "").startsWith("insert") || typeof event.data !== "string") return;
            if (filtrar(event.data) !== event.data && event.cancelable) {
                event.preventDefault();
                insertar(event.data);
            }
        });
        input.addEventListener("paste", event => {
            const valor = event.clipboardData?.getData("text");
            if (!maldita() || event.defaultPrevented || !valor || filtrar(valor) === valor) return;
            event.preventDefault();
            insertar(valor);
        });
        input.addEventListener("input", () => componiendo ? refrescar() : sanear());
        input.addEventListener("compositionstart", () => { componiendo = true; });
        input.addEventListener("compositionend", () => {
            componiendo = false;
            sanear();
        });
        input.addEventListener("scroll", sincronizarScroll, { passive: true });
        input.addEventListener("keyup", programarScroll);
        input.addEventListener("click", programarScroll);
        windowRef.addEventListener("resize", refrescar, { passive: true });
        if (typeof windowRef.ResizeObserver === "function") new windowRef.ResizeObserver(refrescar).observe(input);
        documentRef.fonts?.ready?.then(refrescar);
        refrescar();
        return {
            refrescar: sanear,
            filtrar,
            setRule(regla = {}) {
                modo = String(regla.modo || "");
                letra = String(regla.letra || "");
                sanear();
            }
        };
    }

    global.ScribMuseLetterInput = { segmentos, filtrarTexto, createController };
})(typeof window !== "undefined" ? window : globalThis);
