(function initScribWarmupTiming(global) {
    "use strict";

    function crearReloj(ahoraMonotono = () => global.performance?.now?.() || 0) {
        let referenciaServidor = 0;
        let referenciaMonotona = 0;

        const ahora = () => referenciaServidor > 0
            ? referenciaServidor + Math.max(0, ahoraMonotono() - referenciaMonotona)
            : 0;

        const sincronizar = (payload = {}) => {
            let referencia = Number(payload.server_ts);
            if (!Number.isFinite(referencia) || referencia <= 0) {
                // Compatibility during deployment: infer a safe lower bound
                // from server timestamps, never from the device wall clock.
                referencia = ahora();
                [1, 2].forEach((equipo) => {
                    const palabras = payload.equipos?.[equipo]?.palabras;
                    (Array.isArray(palabras) ? palabras : []).forEach((entrada) => {
                        [entrada?.ts, entrada?.animOnTs, entrada?.animOffTs].forEach((valor) => {
                            const marca = Number(valor);
                            if (Number.isFinite(marca) && marca > referencia) referencia = marca;
                        });
                    });
                });
            }
            if (!(referencia > 0)) return;
            referenciaServidor = referencia;
            referenciaMonotona = ahoraMonotono();
        };

        const edadMs = (timestamp) => {
            const marca = Number(timestamp);
            if (!Number.isFinite(marca) || marca <= 0 || !referenciaServidor) return 0;
            return Math.max(0, ahora() - marca);
        };

        return Object.freeze({ sincronizar, edadMs });
    }

    const api = Object.freeze({ crearReloj });
    global.ScribWarmupTiming = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
