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
        const letraObjetivo = normalizarTexto(letra);
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
        calcularTiempoPalabra,
        normalizarTexto,
        tienePreviewTiempo,
        validarInspiracion
    };
})(window);
