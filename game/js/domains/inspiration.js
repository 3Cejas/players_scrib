(function initScribInspiration(global) {
    const MODOS_CON_PREVIEW_TIEMPO = new Set(["palabras bonus", "palabras prohibidas"]);
    const LETRA_FREQ = {
        a: 1, b: 2, c: 3, d: 4, e: 5, f: 1, g: 2, h: 1, i: 5,
        j: 1, k: 1, l: 1, m: 2, n: 2, o: 5, p: 1, q: 1, r: 1,
        s: 1, t: 1, u: 5, v: 1, w: 1, x: 1, y: 1, z: 1
    };

    function normalizarTexto(valor) {
        return String(valor || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,
                "$1"
            )
            .normalize("NFC");
    }

    function normalizarLetraObjetivo(valor) {
        if (global && typeof global.scribNormalizeModeLetter2P === "function") {
            return global.scribNormalizeModeLetter2P(valor);
        }
        const texto = String(valor || "").trim().replace(/\s+/g, "");
        if (!texto) return "";
        const lower = texto.toLowerCase();
        if (
            lower === "ã±" ||
            lower === "ãƒâ±" ||
            lower === "ãƒâ€˜" ||
            lower === "ã‘" ||
            lower === "�ƒâ±" ||
            (/[�ÃÂƒâ]/.test(texto) && texto.includes("±"))
        ) {
            return "\u00f1";
        }
        return Array.from(texto)[0] || "";
    }

    function tienePreviewTiempo(modo = "") {
        return MODOS_CON_PREVIEW_TIEMPO.has(String(modo || "").trim());
    }

    function calcularTiempoPalabra(word) {
        if (!word) return 10;
        const clean = String(word).toLowerCase().replace(/\s+/g, "");
        let sum = 0;
        for (const ch of clean) {
            sum += LETRA_FREQ[ch] || 0;
        }
        const pts = Math.ceil((((10 - sum * 0.5) + clean.length * 3)) / 5) * 5;
        return Number.isNaN(pts) ? 10 : pts;
    }

    function extraerPalabraObjetivo(valor, profundidad = 0) {
        if (profundidad > 5) return "";
        if (typeof valor === "string") return valor.trim();
        if (Array.isArray(valor)) {
            for (let i = 0; i < valor.length; i++) {
                const candidata = extraerPalabraObjetivo(valor[i], profundidad + 1);
                if (candidata) return candidata;
            }
            return "";
        }
        if (valor && typeof valor === "object") {
            const clavesPreferidas = ["palabra", "word", "texto", "valor", "palabras_var"];
            for (let i = 0; i < clavesPreferidas.length; i++) {
                const clave = clavesPreferidas[i];
                if (!Object.prototype.hasOwnProperty.call(valor, clave)) continue;
                const candidata = extraerPalabraObjetivo(valor[clave], profundidad + 1);
                if (candidata) return candidata;
            }
            if (Object.prototype.hasOwnProperty.call(valor, "palabra_bonus")) {
                const candidataBonus = extraerPalabraObjetivo(valor.palabra_bonus, profundidad + 1);
                if (candidataBonus) return candidataBonus;
            }
        }
        return "";
    }

    function normalizarSegundosTiempo(valor) {
        if (valor === null || typeof valor === "undefined") return null;
        if (typeof valor === "number") {
            return Number.isFinite(valor) ? Math.trunc(Math.abs(valor)) : null;
        }
        const texto = String(valor).trim();
        if (!texto || /^undefined$/i.test(texto) || /^null$/i.test(texto)) return null;
        const match = texto.replace(",", ".").match(/[+-]?\d+(?:\.\d+)?/);
        if (!match) return null;
        const numero = Number(match[0]);
        return Number.isFinite(numero) ? Math.trunc(Math.abs(numero)) : null;
    }

    function resolverTiempoPalabraAsignada(data = {}, fallback) {
        const candidatos = [];
        if (data && typeof data === "object" && !Array.isArray(data)) {
            candidatos.push(
                data.tiempo_palabras_bonus,
                data.tiempo_bonus,
                data.tiempoSegundos,
                data.segundos,
                data.delta
            );
        } else {
            candidatos.push(data);
        }
        candidatos.push(fallback);
        for (let i = 0; i < candidatos.length; i++) {
            const segundos = normalizarSegundosTiempo(candidatos[i]);
            if (segundos !== null) return segundos;
        }
        const palabra = extraerPalabraObjetivo(data);
        return palabra ? calcularTiempoPalabra(palabra) : null;
    }

    function formatearTiempoPalabraAsignada(data = {}, opciones = {}) {
        const segundos = resolverTiempoPalabraAsignada(data, opciones.fallback);
        if (segundos === null) return "";
        const modo = String(opciones.modo || "").trim();
        const tipo = String(opciones.tipo || "").trim();
        const esMaldita = opciones.maldita === true || modo === "palabras prohibidas" || tipo === "prohibidas" || tipo === "maldita";
        const signo = esMaldita ? "-" : "+";
        return `${signo}${segundos} segs.`;
    }

    function calcularPreviewTiempoPalabra({ modo = "", texto = "" } = {}) {
        const modoActual = String(modo || "").trim();
        const palabra = String(texto || "").trim();
        if (!tienePreviewTiempo(modoActual)) {
            return {
                visible: false,
                motivo: "mode",
                modo: modoActual,
                palabra,
                segundos: 0,
                signo: "",
                delta: 0,
                tipo: ""
            };
        }
        if (!palabra) {
            return {
                visible: false,
                motivo: "empty",
                modo: modoActual,
                palabra,
                segundos: 0,
                signo: "",
                delta: 0,
                tipo: ""
            };
        }
        if (/\s/.test(palabra)) {
            return {
                visible: false,
                motivo: "spaces",
                modo: modoActual,
                palabra,
                segundos: 0,
                signo: "",
                delta: 0,
                tipo: ""
            };
        }
        const segundos = calcularTiempoPalabra(palabra);
        const esMaldita = modoActual === "palabras prohibidas";
        const signo = esMaldita ? "-" : "+";
        return {
            visible: true,
            motivo: "ok",
            modo: modoActual,
            palabra,
            segundos,
            signo,
            delta: esMaldita ? -segundos : segundos,
            tipo: esMaldita ? "resta" : "suma"
        };
    }

    function validarInspiracion({ modo = "", texto = "", letra = "" } = {}) {
        const inspiracionTexto = String(texto || "").trim();
        const modoActual = String(modo || "").trim();
        if (!inspiracionTexto) {
            return { ok: false, motivo: "empty" };
        }
        if (/\s/.test(inspiracionTexto)) {
            return { ok: false, motivo: "spaces" };
        }

        const inspiracionNormalizada = normalizarTexto(inspiracionTexto);
        const letraObjetivo = normalizarTexto(normalizarLetraObjetivo(letra));
        const contieneLetraObjetivo = Boolean(letraObjetivo) && inspiracionNormalizada.includes(letraObjetivo);
        const ok = (
            (modoActual === "letra prohibida" && !contieneLetraObjetivo) ||
            (modoActual === "letra bendita" && contieneLetraObjetivo) ||
            modoActual === "palabras bonus" ||
            modoActual === "palabras prohibidas"
        );

        return {
            ok,
            motivo: ok ? "ok" : "not-useful",
            texto: inspiracionTexto,
            contieneLetraObjetivo
        };
    }

    global.ScribInspiration = {
        calcularPreviewTiempoPalabra,
        calcularTiempoPalabra,
        extraerPalabraObjetivo,
        formatearTiempoPalabraAsignada,
        normalizarTexto,
        normalizarSegundosTiempo,
        resolverTiempoPalabraAsignada,
        tienePreviewTiempo,
        validarInspiracion
    };
})(window);
