(function initScribCredits(global) {
    const TEXT_MAX = 80;
    const THANKS_MAX = 420;
    const MUSES_MAX = 60;
    const MUSE_NAME_MAX = 48;

    const DEFAULT_STATE = Object.freeze({
        escritxr_rojo: "\u00c1NGELA BUENO",
        escritxr_azul: "MIRIAM DEL VALLE",
        interprete_azul_1: "PAULA CM",
        interprete_azul_2: "DIEGO VALVERDE",
        interprete_rojo_1: "ANA SEMPERE",
        interprete_rojo_2: "PABLO PINE\u00d1O",
        programacion: "DAVID VI\u00d1AS",
        dramaturgia: "PABLO PINE\u00d1O",
        iluminacion: "TERESA TIMPER",
        musica: "ARNY RAM\u00cdREZ",
        voz_off: "NINACHASKA ZL",
        agradecimientos: "SALA EXL\u00cdMITE\nJUAN CEACERO",
        musas: Object.freeze({
            azules: Object.freeze([]),
            rojas: Object.freeze([])
        })
    });

    const FIELDS = Object.freeze([
        "escritxr_rojo",
        "escritxr_azul",
        "interprete_azul_1",
        "interprete_azul_2",
        "interprete_rojo_1",
        "interprete_rojo_2",
        "programacion",
        "dramaturgia",
        "iluminacion",
        "musica",
        "voz_off"
    ]);

    const CONTROL_FIELDS = Object.freeze([
        ["escritxr_rojo", "credito_escritxr_rojo", TEXT_MAX],
        ["escritxr_azul", "credito_escritxr_azul", TEXT_MAX],
        ["interprete_azul_1", "credito_interprete_azul_1", TEXT_MAX],
        ["interprete_azul_2", "credito_interprete_azul_2", TEXT_MAX],
        ["interprete_rojo_1", "credito_interprete_rojo_1", TEXT_MAX],
        ["interprete_rojo_2", "credito_interprete_rojo_2", TEXT_MAX],
        ["programacion", "credito_programacion", TEXT_MAX],
        ["dramaturgia", "credito_dramaturgia", TEXT_MAX],
        ["iluminacion", "credito_iluminacion", TEXT_MAX],
        ["musica", "credito_musica", TEXT_MAX],
        ["voz_off", "credito_voz_off", TEXT_MAX]
    ]);

    const CONTROL_THANKS_FIELD = Object.freeze(["agradecimientos", "credito_agradecimientos", THANKS_MAX]);

    const SPECTATOR_ORDER = Object.freeze([
        ["\u2764\ufe0f ESCRITORA", "escritxr_rojo"],
        ["\u2764\ufe0f INT\u00c9RPRETE", "interprete_rojo_1"],
        ["\u2764\ufe0f INT\u00c9RPRETE", "interprete_rojo_2"],
        ["\ud83d\udc99 ESCRITOR", "escritxr_azul"],
        ["\ud83d\udc99 INT\u00c9RPRETE", "interprete_azul_1"],
        ["\ud83d\udc99 INT\u00c9RPRETE", "interprete_azul_2"],
        ["\ud83d\udc7e PROGRAMACI\u00d3N", "programacion"],
        ["\u270d\ufe0f DRAMATURGIA", "dramaturgia"],
        ["\ud83d\udca1 ILUMINACI\u00d3N", "iluminacion"],
        ["\ud83c\udfb9 M\u00daSICA", "musica"],
        ["\ud83d\udde3\ufe0f VOZ EN OFF", "voz_off"]
    ]);

    function normalizarTexto(valor, max = TEXT_MAX) {
        return String(valor ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, max);
    }

    function normalizarAgradecimientos(valor, max = THANKS_MAX) {
        return String(valor ?? "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n")
            .map((linea) => linea.trim())
            .filter(Boolean)
            .join("\n")
            .slice(0, max);
    }

    function normalizarListaMusas(valor = []) {
        return (Array.isArray(valor) ? valor : [])
            .map((nombre) => normalizarTexto(nombre, MUSE_NAME_MAX))
            .filter(Boolean)
            .filter((nombre, indice, lista) => (
                lista.findIndex((otro) => otro.toLocaleLowerCase() === nombre.toLocaleLowerCase()) === indice
            ))
            .slice(0, MUSES_MAX);
    }

    function normalizarMusas(entrada = {}) {
        const data = (entrada && typeof entrada === "object") ? entrada : {};
        return {
            azules: normalizarListaMusas(data.azules),
            rojas: normalizarListaMusas(data.rojas)
        };
    }

    function normalizarEstado(entrada = {}) {
        const data = (entrada && typeof entrada === "object") ? entrada : {};
        const salida = { ...DEFAULT_STATE };
        FIELDS.forEach((campo) => {
            salida[campo] = normalizarTexto(data[campo], TEXT_MAX);
        });
        salida.agradecimientos = normalizarAgradecimientos(data.agradecimientos, THANKS_MAX);
        salida.musas = normalizarMusas(data.musas);
        return salida;
    }

    function normalizarPayload(payload = {}) {
        const data = (payload && typeof payload === "object") ? payload : {};
        const entradaCreditos = (data.creditos && typeof data.creditos === "object") ? data.creditos : {};
        return {
            creditos: normalizarEstado(entradaCreditos),
            mostrar: Boolean(data.mostrar),
            animacion_id: Number(data.animacion_id) || 0,
            ts: Number(data.ts) || Date.now()
        };
    }

    global.ScribCredits = {
        CONTROL_FIELDS,
        CONTROL_THANKS_FIELD,
        DEFAULT_STATE,
        FIELDS,
        MUSES_MAX,
        MUSE_NAME_MAX,
        SPECTATOR_ORDER,
        TEXT_MAX,
        THANKS_MAX,
        normalizarAgradecimientos,
        normalizarEstado,
        normalizarListaMusas,
        normalizarMusas,
        normalizarPayload,
        normalizarTexto
    };
})(window);
