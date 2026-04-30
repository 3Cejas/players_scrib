(function initScribDisadvantages(global) {
    const EMOJIS = {
        TORTUGA: "\u{1F422}",
        RAYO: "\u26A1",
        ESPEJO: "\u{1F643}",
        BRUMA: "\u{1F32A}\uFE0F",
        BLOQUEO: "\u{1F58A}\uFE0F"
    };

    const ALIASES = {
        [EMOJIS.TORTUGA]: EMOJIS.TORTUGA,
        [EMOJIS.RAYO]: EMOJIS.RAYO,
        [EMOJIS.ESPEJO]: EMOJIS.ESPEJO,
        "\u{1F32A}": EMOJIS.BRUMA,
        [EMOJIS.BRUMA]: EMOJIS.BRUMA,
        "\u{1F58A}": EMOJIS.BLOQUEO,
        [EMOJIS.BLOQUEO]: EMOJIS.BLOQUEO,
        tortuga: EMOJIS.TORTUGA,
        turtle: EMOJIS.TORTUGA,
        lento: EMOJIS.TORTUGA,
        "teclado lento": EMOJIS.TORTUGA,
        rayo: EMOJIS.RAYO,
        rapido: EMOJIS.RAYO,
        "borrado rapido": EMOJIS.RAYO,
        espejo: EMOJIS.ESPEJO,
        inverso: EMOJIS.ESPEJO,
        "al reves": EMOJIS.ESPEJO,
        bruma: EMOJIS.BRUMA,
        borroso: EMOJIS.BRUMA,
        remolino: EMOJIS.BRUMA,
        pluma: EMOJIS.BLOQUEO,
        boligrafo: EMOJIS.BLOQUEO,
        "sin borrado": EMOJIS.BLOQUEO,
        "bloqueo borrado": EMOJIS.BLOQUEO,
        "bloqueo de borrado": EMOJIS.BLOQUEO,
        "borrado bloqueado": EMOJIS.BLOQUEO,
        "backspace bloqueado": EMOJIS.BLOQUEO
    };

    const DESCRIPCIONES = {
        [EMOJIS.TORTUGA]: "El teclado del contrincante ira mas lento.",
        [EMOJIS.RAYO]: "El videojuego borrara mas rapido el texto del contrincante.",
        [EMOJIS.ESPEJO]: "El texto se volvera un espejo para el contrincante.",
        [EMOJIS.BRUMA]: "Una pesada bruma caera sobre el texto del contrincante.",
        [EMOJIS.BLOQUEO]: "El contrincante no podra borrar su texto."
    };

    function normalizar(valor) {
        const raw = String(valor || "").trim();
        if (!raw) return "";
        return ALIASES[raw] || ALIASES[raw.toLowerCase()] || raw;
    }

    function etiqueta(emoji) {
        const normalizada = normalizar(emoji);
        if (normalizada === EMOJIS.TORTUGA) return `${EMOJIS.TORTUGA} TECLADO LENTO`;
        if (normalizada === EMOJIS.RAYO) return `${EMOJIS.RAYO} BORRADO RAPIDO`;
        if (normalizada === EMOJIS.BRUMA) return `${EMOJIS.BRUMA} TEXTO BORROSO`;
        if (normalizada === EMOJIS.ESPEJO) return `${EMOJIS.ESPEJO} INVERSO`;
        if (normalizada === EMOJIS.BLOQUEO) return `${EMOJIS.BLOQUEO} BORRADO BLOQUEADO`;
        return String(emoji || "");
    }

    function opcionesVotacion() {
        return [EMOJIS.TORTUGA, EMOJIS.RAYO, EMOJIS.ESPEJO, EMOJIS.BRUMA, EMOJIS.BLOQUEO]
            .map((emoji) => ({
                emoji,
                descripcion: `${emoji} ${DESCRIPCIONES[emoji]}`
            }));
    }

    global.ScribDisadvantages = {
        EMOJIS,
        DESCRIPCIONES,
        etiqueta,
        normalizar,
        opcionesVotacion
    };
})(window);
