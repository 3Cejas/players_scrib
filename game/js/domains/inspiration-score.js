(function initScribInspirationScore(global) {
    const DATA_ATTRIBUTE = "data-inspiration-value";

    function redondear(valor, decimales = 2) {
        const factor = 10 ** Math.max(0, Math.trunc(decimales));
        return Math.round((Number(valor) + Number.EPSILON) * factor) / factor;
    }

    function normalizarValorElemento(elemento) {
        if (!elemento || typeof elemento.getAttribute !== "function") return 0;
        const atributo = elemento.getAttribute(DATA_ATTRIBUTE);
        if (atributo === null || String(atributo).trim() === "") return 1;
        const numero = Number(String(atributo).trim().replace(",", "."));
        return Number.isFinite(numero) ? Math.min(1, Math.max(0, numero)) : 1;
    }

    function sumarElementos(elementos) {
        const total = Array.from(elementos || []).reduce((suma, elemento) => (
            suma + normalizarValorElemento(elemento)
        ), 0);
        return redondear(total);
    }

    function sumarDesdeHtml(html, clases = [], documento = global && global.document) {
        if (!documento || typeof documento.createElement !== "function") return null;
        const selector = Array.from(clases || [])
            .map((clase) => String(clase || "").trim())
            .filter(Boolean)
            .map((clase) => `.${clase}`)
            .join(",");
        if (!selector) return 0;
        const contenedor = documento.createElement("div");
        contenedor.innerHTML = String(html || "");
        return sumarElementos(contenedor.querySelectorAll(selector));
    }

    const api = Object.freeze({
        DATA_ATTRIBUTE,
        normalizarValorElemento,
        sumarDesdeHtml,
        sumarElementos
    });

    global.ScribInspirationScore = api;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
