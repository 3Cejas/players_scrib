(function initScribResurrection(global) {
    function normalizarPlayer(valor) {
        const id = Number(valor);
        return id === 1 || id === 2 ? id : null;
    }

    function crearEstadoMenu(player, overrides = {}) {
        return {
            player: normalizarPlayer(player) || 1,
            visible: false,
            menu: "main",
            mainIndex: 0,
            quantityIndex: 0,
            palabras: 1,
            max: 1,
            segundos: 0,
            obligatorio: false,
            ...overrides
        };
    }

    function estaActiva(estado = {}) {
        return Boolean(estado && estado.visible);
    }

    global.ScribResurrection = {
        crearEstadoMenu,
        estaActiva,
        normalizarPlayer
    };
})(window);
