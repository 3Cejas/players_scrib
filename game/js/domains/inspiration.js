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

    function normalizarNombreAutorMusa(valor, max = 24) {
        const limite = Math.max(1, Math.trunc(Number(max) || 24));
        return Array.from(String(valor ?? "")
            .normalize("NFKC")
            .replace(/[\p{Cc}\p{Cf}]/gu, "")
            .replace(/\s+/gu, " ")
            .trim())
            .slice(0, limite)
            .join("")
            .toLocaleUpperCase();
    }

    function extraerAutoresMusa(payload = {}, opciones = {}) {
        const fuente = payload && typeof payload === "object" ? payload : {};
        const superbonus = fuente.superbonus && typeof fuente.superbonus === "object"
            ? fuente.superbonus
            : {};
        const listas = [superbonus.musas, fuente.musas, fuente.autores];
        let candidatos = listas.find((lista) => Array.isArray(lista) && lista.length) || [];
        if (!candidatos.length) {
            const unico = typeof payload === "string"
                ? payload
                : (fuente.musa_nombre ?? fuente.nombre_musa ?? fuente.musa ?? fuente.autor ?? "");
            candidatos = String(unico || "")
                .split(/\s+\+\s+/u)
                .filter(Boolean);
        }

        const maxAutores = Math.max(1, Math.min(12, Math.trunc(Number(opciones.maxAutores) || 6)));
        const maxNombre = Math.max(1, Math.min(48, Math.trunc(Number(opciones.maxNombre) || 24)));
        const vistos = new Set();
        const autores = [];
        candidatos.forEach((candidato) => {
            if (autores.length >= maxAutores) return;
            const nombre = normalizarNombreAutorMusa(candidato, maxNombre);
            if (!nombre) return;
            const clave = nombre.toLocaleLowerCase();
            if (vistos.has(clave)) return;
            vistos.add(clave);
            autores.push(nombre);
        });
        const fallback = opciones.fallback === false
            ? ""
            : normalizarNombreAutorMusa(opciones.fallback || "MUSA", maxNombre);
        if (!autores.length && fallback) autores.push(fallback);
        return autores;
    }

    function normalizarFirmaMusa(payload = {}, opciones = {}) {
        const autores = extraerAutoresMusa(payload, opciones);
        const maxVisibles = Math.max(1, Math.min(3, Math.trunc(Number(opciones.maxVisibles) || 2)));
        let texto = autores.slice(0, maxVisibles).join(" + ");
        if (autores.length > maxVisibles) {
            texto = `${autores[0]} +${autores.length - 1}`;
        }
        return {
            autores,
            texto,
            completo: autores.join(" + ")
        };
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
        const referencia = resolverTiempoPalabraAsignada(data, opciones.fallback);
        if (referencia === null) return "";
        const modo = String(opciones.modo || "").trim();
        const tipo = String(opciones.tipo || "").trim();
        const esMaldita = opciones.maldita === true || modo === "palabras prohibidas" || tipo === "prohibidas" || tipo === "maldita";
        const factor = normalizarFactorInspiracion(
            data && typeof data === "object" ? data.valor_inspiracion : opciones.valor_inspiracion
        );
        const esMusa = Boolean(
            data
            && typeof data === "object"
            && (data.origen_musa || data.musa_nombre || data.musa || (Array.isArray(data.musas) && data.musas.length))
        );
        const valor = Number(((esMusa ? 5 : 1) * factor).toFixed(2));
        const signo = esMaldita ? "-" : "+";
        return `${signo}${valor} insp.`;
    }

    function esAtajoDescartarInspiracion(evento = {}) {
        const esF8 = evento.code === "F8" || evento.key === "F8";
        if (!esF8) return false;
        if (
            evento.defaultPrevented ||
            evento.repeat ||
            evento.isComposing ||
            Number(evento.keyCode) === 229 ||
            evento.altKey ||
            evento.ctrlKey ||
            evento.metaKey ||
            evento.shiftKey
        ) {
            return false;
        }
        return true;
    }

    function normalizarFactorInspiracion(valor, fallback = 1) {
        const tieneValor = valor !== null && typeof valor !== "undefined" && String(valor).trim() !== "";
        const tieneFallback = fallback !== null && typeof fallback !== "undefined" && String(fallback).trim() !== "";
        const numero = tieneValor ? Number(valor) : Number.NaN;
        const respaldo = tieneFallback ? Number(fallback) : 1;
        const candidato = Number.isFinite(numero) ? numero : (Number.isFinite(respaldo) ? respaldo : 1);
        return Math.max(0, Math.min(1, candidato));
    }

    function normalizarMetaEntregaInspiracion(payload = {}) {
        const fuente = payload && typeof payload === "object" ? payload : {};
        const inspiracionId = String(fuente.inspiracion_id || "").trim().slice(0, 160);
        const descartes = Math.max(0, Math.trunc(Number(fuente.descartes_consecutivos) || 0));
        const factorPorRacha = descartes <= 0 ? 1 : (descartes === 1 ? 0.75 : (descartes === 2 ? 0.5 : 0.25));
        const factor = normalizarFactorInspiracion(fuente.factor_inspiracion, factorPorRacha);
        const valor = normalizarFactorInspiracion(fuente.valor_inspiracion, factor);
        const porcentajeTiempo = descartes <= 0 ? 100 : (descartes === 1 ? 75 : (descartes === 2 ? 50 : 25));
        return {
            inspiracion_id: inspiracionId,
            descartes_consecutivos: descartes,
            factor_inspiracion: factor,
            valor_inspiracion: valor,
            porcentaje_tiempo: porcentajeTiempo
        };
    }

    function normalizarResultadoAprovechamiento(respuesta = {}) {
        if (!respuesta || typeof respuesta !== "object" || respuesta.ok !== true) return null;
        const resultado = respuesta.resultado && typeof respuesta.resultado === "object"
            ? respuesta.resultado
            : {};
        const valorRaw = respuesta.valor_inspiracion ?? resultado.valor_inspiracion;
        const tiempoRaw = respuesta.tiempo_otorgado ?? resultado.tiempo_otorgado;
        if (
            valorRaw === null || typeof valorRaw === "undefined" || String(valorRaw).trim() === ""
            || tiempoRaw === null || typeof tiempoRaw === "undefined" || String(tiempoRaw).trim() === ""
        ) {
            return null;
        }
        const valorInspiracion = Number(valorRaw);
        const tiempoOtorgado = Number(tiempoRaw);
        if (!Number.isFinite(valorInspiracion) || !Number.isFinite(tiempoOtorgado)) return null;
        return {
            valor_inspiracion: normalizarFactorInspiracion(valorInspiracion),
            tiempo_otorgado: tiempoOtorgado
        };
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
        esAtajoDescartarInspiracion,
        formatearTiempoPalabraAsignada,
        extraerAutoresMusa,
        normalizarFactorInspiracion,
        normalizarFirmaMusa,
        normalizarNombreAutorMusa,
        normalizarMetaEntregaInspiracion,
        normalizarResultadoAprovechamiento,
        normalizarTexto,
        normalizarSegundosTiempo,
        resolverTiempoPalabraAsignada,
        tienePreviewTiempo,
        validarInspiracion
    };
})(window);
