(function initScribWarmupWriter(global) {
    "use strict";

    const LIMITE_DETONADORES_ESCRITORA = 80;

    const normalizarEquipo = (valor) => {
        const equipo = Number(valor);
        return equipo === 1 || equipo === 2 ? equipo : null;
    };

    const prioridadVisual = (entrada = {}) => (
        Number(Boolean(entrada.esFinal)) * 4
        + Number(Boolean(entrada.destacada)) * 2
    );

    const ordenarDetonadores = (entradas = []) => entradas.slice().sort((a, b) => (
        prioridadVisual(b) - prioridadVisual(a)
        || (Number(b && b.ts) || 0) - (Number(a && a.ts) || 0)
    ));

    function seleccionarDetonadoresParaEscritora(
        entradas = [],
        equipoEscritora = null,
        limite = LIMITE_DETONADORES_ESCRITORA
    ) {
        const lista = Array.isArray(entradas) ? entradas.filter(Boolean) : [];
        const equipo = normalizarEquipo(equipoEscritora);
        const maximo = Math.max(0, Math.trunc(Number(limite) || 0));
        if (!maximo) return [];
        if (!equipo) return ordenarDetonadores(lista).slice(0, maximo);

        // La escritora debe poder seleccionar primero los detonadores de sus
        // musas. Los del equipo rival se conservan como contexto, pero nunca
        // pueden llenar la nube y dejar fuera los propios.
        const propios = ordenarDetonadores(lista.filter((entrada) => Number(entrada.equipo) === equipo));
        const rivales = ordenarDetonadores(lista.filter((entrada) => Number(entrada.equipo) !== equipo));
        return propios.concat(rivales).slice(0, maximo);
    }

    const api = Object.freeze({
        LIMITE_DETONADORES_ESCRITORA,
        seleccionarDetonadoresParaEscritora
    });

    global.ScribWarmupWriter = api;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
