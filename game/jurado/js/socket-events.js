if (typeof socket !== "undefined" && socket) {
    socket.on("connect", () => {
        setConexionJurado(true);
        socket.emit("registrar_jurado");
        socket.emit("pedir_stats_live");
        socket.emit("pedir_nube_inspiracion");
        socket.emit("pedir_idioma_actual");
        socket.emit("pedir_vista_espectador_modo");
        socket.emit("pedir_jurado_resultado");
        setTimeout(() => window.scribJurado?.emitirResultadoJurado?.(), 0);
    });

    socket.on("disconnect", () => {
        setConexionJurado(false);
    });

    socket.on("connect_error", () => {
        setConexionJurado(false);
    });

    socket.on("recargar_rol_remoto", () => {
        window.location.reload();
    });

    socket.on("idioma_actual", (payload = {}) => {
        if (window && typeof window.scribSetLanguage2P === "function") {
            window.scribSetLanguage2P(payload && payload.idioma ? payload.idioma : "es");
        }
    });

    socket.on("nombre1", (nombre) => {
        actualizarNombreJurado(1, nombre);
    });

    socket.on("nombre2", (nombre) => {
        actualizarNombreJurado(2, nombre);
    });

    socket.on("texto1", (data) => {
        aplicarTextoJurado(1, data);
    });

    socket.on("texto2", (data) => {
        aplicarTextoJurado(2, data);
    });

    socket.on("actualizar_contador_musas", (payload = {}) => {
        aplicarMusasJurado(payload);
    });

    socket.on("stats_live_estado", (payload = {}) => {
        aplicarStatsLiveJurado(payload);
    });

    socket.on("nube_inspiracion_estado", (payload = {}) => {
        aplicarNubeInspiracionJurado(payload);
    });

    socket.on("vista_espectador_modo", (payload = {}) => {
        actualizarVistaRevelacionJurado(payload);
    });

    socket.on("jurado_resultado_estado", (payload = {}) => {
        actualizarResultadoServidorJurado(payload);
    });

    socket.on("modo_actual", (payload = {}) => {
        const modo = typeof payload === "string" ? payload : payload && payload.modo_actual;
        actualizarModoJurado(modo || "partida");
    });

    socket.on("temp_modos", (payload = {}) => {
        const modo = typeof payload === "string" ? payload : payload && payload.modo_actual;
        if (modo) actualizarModoJurado(modo);
    });

    socket.on("limpiar", () => {
        aplicarTextoJurado(1, { text: "", points: 0 });
        aplicarTextoJurado(2, { text: "", points: 0 });
        aplicarMusasJurado({ escritxr1: 0, escritxr2: 0 });
        actualizarModoJurado("partida");
    });
}
