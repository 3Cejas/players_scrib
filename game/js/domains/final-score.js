(function initScribFinalScore(global) {
    const CATEGORY_IDS = Object.freeze([
        "produccion",
        "ritmo",
        "riqueza_lexica",
        "bonus",
        "precision",
        "pulsaciones"
    ]);
    const MAX_STEP = CATEGORY_IDS.length + 1;

    function numeroFinito(valor, fallback = 0) {
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : fallback;
    }

    function redondear(valor, decimales = 2) {
        const factor = 10 ** Math.max(0, Math.trunc(decimales));
        return Math.round((numeroFinito(valor) + Number.EPSILON) * factor) / factor;
    }

    function normalizarJugador(valor, id) {
        const data = valor && typeof valor === "object" ? valor : {};
        return {
            id,
            nombre: String(data.nombre || `ESCRITXR ${id}`).trim().slice(0, 32) || `ESCRITXR ${id}`,
            total: Math.max(0, Math.min(100, redondear(data.total)))
        };
    }

    function normalizarGanador(valor) {
        const id = Number(valor);
        return id === 1 || id === 2 ? id : null;
    }

    function normalizarCategoria(valor, indice) {
        const data = valor && typeof valor === "object" ? valor : {};
        const idEsperado = CATEGORY_IDS[indice] || "";
        const idRecibido = String(data.id || "").trim().toLowerCase();
        const id = CATEGORY_IDS.includes(idRecibido) ? idRecibido : idEsperado;
        const valores = data.valores && typeof data.valores === "object" ? data.valores : {};
        const puntos = data.puntos && typeof data.puntos === "object" ? data.puntos : {};
        const ganador = normalizarGanador(data.ganador);
        const empate = data.empate === true || ganador === null;
        return {
            id,
            etiqueta: String(data.etiqueta || "").trim().slice(0, 48),
            explicacion: String(data.explicacion || "").trim().slice(0, 180),
            peso: Math.max(0, redondear(data.peso)),
            unidad: String(data.unidad || "").trim().toLowerCase().slice(0, 32),
            mejor: data.mejor === "menor" ? "menor" : "mayor",
            valores: {
                1: redondear(valores[1] ?? valores["1"]),
                2: redondear(valores[2] ?? valores["2"])
            },
            puntos: {
                1: Math.max(0, redondear(puntos[1] ?? puntos["1"])),
                2: Math.max(0, redondear(puntos[2] ?? puntos["2"]))
            },
            ganador,
            empate
        };
    }

    function categoriaPorId(categorias, id, indice) {
        const encontrada = categorias.find((categoria) => (
            categoria && String(categoria.id || "").trim().toLowerCase() === id
        ));
        return normalizarCategoria(encontrada || {}, indice);
    }

    function normalizarPayload(payload = {}) {
        const data = payload && typeof payload === "object" ? payload : {};
        const jugadores = data.jugadores && typeof data.jugadores === "object" ? data.jugadores : {};
        const categoriasEntrada = Array.isArray(data.categorias) ? data.categorias : [];
        const ganador = normalizarGanador(data.ganador);
        return {
            schemaVersion: Math.max(1, Math.trunc(numeroFinito(data.schema_version ?? data.schemaVersion, 1))),
            formulaVersion: String(data.formula_version || data.formulaVersion || "scrib-puntuacion-v1").trim().slice(0, 48),
            disponible: data.disponible === true,
            datosSuficientes: data.datos_suficientes === true || data.datosSuficientes === true,
            calculadoEnTs: Math.max(0, Math.trunc(numeroFinito(data.calculado_en_ts ?? data.calculadoEnTs))),
            jugadores: {
                1: normalizarJugador(jugadores[1] || jugadores["1"], 1),
                2: normalizarJugador(jugadores[2] || jugadores["2"], 2)
            },
            categorias: CATEGORY_IDS.map((id, indice) => categoriaPorId(categoriasEntrada, id, indice)),
            ganador,
            empate: data.empate === true || ganador === null,
            diferencia: Math.max(0, Math.min(100, redondear(data.diferencia)))
        };
    }

    function normalizarPaso(valor) {
        const numero = Math.trunc(numeroFinito(valor));
        return Math.max(0, Math.min(MAX_STEP, numero));
    }

    function obtenerVista(payload, paso) {
        const estado = normalizarPayload(payload);
        const step = normalizarPaso(paso);
        if (!estado.disponible) {
            return { tipo: "espera", paso: step, estado, categoria: null, indiceCategoria: -1 };
        }
        if (!estado.datosSuficientes) {
            return { tipo: "insuficiente", paso: step, estado, categoria: null, indiceCategoria: -1 };
        }
        if (step === 0) {
            return { tipo: "intro", paso: step, estado, categoria: null, indiceCategoria: -1 };
        }
        if (step === MAX_STEP) {
            return { tipo: "final", paso: step, estado, categoria: null, indiceCategoria: CATEGORY_IDS.length };
        }
        const indiceCategoria = step - 1;
        return {
            tipo: "categoria",
            paso: step,
            estado,
            categoria: estado.categorias[indiceCategoria],
            indiceCategoria
        };
    }

    function normalizarFaseRevelado(valor) {
        const numero = Math.trunc(numeroFinito(valor));
        return Math.max(0, Math.min(2, numero));
    }

    function crearFirmaVista(payload, paso, fase = 0) {
        const vista = obtenerVista(payload, paso);
        const estado = vista.estado;
        return JSON.stringify({
            paso: vista.paso,
            fase: vista.tipo === "categoria" ? normalizarFaseRevelado(fase) : 0,
            tipo: vista.tipo,
            disponible: estado.disponible,
            datosSuficientes: estado.datosSuficientes,
            formulaVersion: estado.formulaVersion,
            jugadores: [estado.jugadores[1], estado.jugadores[2]],
            categorias: estado.categorias.map((categoria) => ({
                id: categoria.id,
                etiqueta: categoria.etiqueta,
                explicacion: categoria.explicacion,
                peso: categoria.peso,
                unidad: categoria.unidad,
                mejor: categoria.mejor,
                valores: categoria.valores,
                puntos: categoria.puntos,
                ganador: categoria.ganador,
                empate: categoria.empate
            })),
            ganador: estado.ganador,
            empate: estado.empate,
            diferencia: estado.diferencia
        });
    }

    function totalesParciales(estado, cantidadCategorias) {
        const limite = Math.max(0, Math.min(CATEGORY_IDS.length, Math.trunc(numeroFinito(cantidadCategorias))));
        const salida = { 1: 0, 2: 0 };
        estado.categorias.slice(0, limite).forEach((categoria) => {
            salida[1] += numeroFinito(categoria && categoria.puntos && categoria.puntos[1]);
            salida[2] += numeroFinito(categoria && categoria.puntos && categoria.puntos[2]);
        });
        salida[1] = redondear(salida[1]);
        salida[2] = redondear(salida[2]);
        return salida;
    }

    function totalesDuranteRevelado(estado, indiceCategoria, fase) {
        const indice = Math.max(0, Math.min(CATEGORY_IDS.length - 1, Math.trunc(numeroFinito(indiceCategoria))));
        const etapa = normalizarFaseRevelado(fase);
        const salida = totalesParciales(estado, indice);
        const categoria = estado && Array.isArray(estado.categorias) ? estado.categorias[indice] : null;
        if (!categoria) return salida;
        if (etapa >= 1) salida[1] = redondear(salida[1] + numeroFinito(categoria.puntos && categoria.puntos[1]));
        if (etapa >= 2) salida[2] = redondear(salida[2] + numeroFinito(categoria.puntos && categoria.puntos[2]));
        return salida;
    }

    const api = Object.freeze({
        CATEGORY_IDS,
        MAX_STEP,
        normalizarPayload,
        normalizarPaso,
        normalizarFaseRevelado,
        obtenerVista,
        crearFirmaVista,
        redondear,
        totalesParciales,
        totalesDuranteRevelado
    });

    global.ScribFinalScore = api;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
