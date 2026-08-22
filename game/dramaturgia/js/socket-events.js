if (typeof dramaturgiaSocket !== "undefined" && dramaturgiaSocket) {
    const dramaturgiaDeltaEvents = [
        "texto1",
        "texto2",
        "nombre1",
        "nombre2",
        "stats_live_estado",
        "nube_inspiracion_estado",
        "actualizar_contador_musas",
        "votacion_ventaja_estado",
        "teleprompter_state",
        "teleprompter_ack",
        "vista_espectador_modo",
        "desventaja_activa_estado",
        "count",
        "modo_actual",
        "activar_modo",
        "temp_modos",
        "estado_banderas_musas",
        "musa_regalo_bandera_estado",
        "feedback_musas_estado",
        "calentamiento_estado_espectador",
        "calentamiento_estado",
        "creditos_estado",
        "inicio",
        "fin",
        "limpiar"
    ];

    function iniciarResyncDramaturgia() {
        if (dramaturgiaUi.resyncTimer) {
            window.clearInterval(dramaturgiaUi.resyncTimer);
        }
        dramaturgiaUi.resyncTimer = window.setInterval(() => {
            requestDramaturgiaSync();
        }, 15000);
    }

    function detenerResyncDramaturgia() {
        if (!dramaturgiaUi.resyncTimer) return;
        window.clearInterval(dramaturgiaUi.resyncTimer);
        dramaturgiaUi.resyncTimer = null;
    }

    dramaturgiaSocket.on("connect", () => {
        setDramaturgiaConnection(true, "Sincronizando estado y cronología");
        dramaturgiaSocket.emit("registrar_dramaturgia", {
            ui_version: DRAMATURGIA_UI_VERSION
        });
        dramaturgiaSocket.emit("pedir_estado_dramaturgia");
        iniciarResyncDramaturgia();
    });

    dramaturgiaSocket.on("disconnect", () => {
        detenerResyncDramaturgia();
        setDramaturgiaConnection(false, "El mapa conserva el último estado mientras reconecta");
    });

    dramaturgiaSocket.on("connect_error", () => {
        setDramaturgiaConnection(false, "No se puede alcanzar el servidor SCRIB");
    });

    dramaturgiaSocket.on("reconnect_attempt", () => {
        setDramaturgiaConnection(false, "Reintentando conexión");
    });

    dramaturgiaSocket.on("dramaturgia_estado", (snapshot = {}) => {
        applyDramaturgiaSnapshot(snapshot);
        setDramaturgiaConnection(true, "Recorrido de la partida sincronizado");
    });

    dramaturgiaSocket.on("dramaturgia_evento", (payload = {}) => {
        const events = Array.isArray(payload) ? payload : [payload];
        events.forEach((event) => applyDramaturgiaEvent(event));
    });

    dramaturgiaSocket.on("dramaturgia_checkpoint", (payload = {}) => {
        const history = window.ScribDramaturgiaHistoryController;
        if (history) history.receiveCheckpoint(payload);
    });

    dramaturgiaDeltaEvents.forEach((eventName) => {
        dramaturgiaSocket.on(eventName, (payload = {}) => {
            applyDramaturgiaDelta(eventName, payload);
        });
    });

    dramaturgiaSocket.on("recargar_rol_remoto", () => {
        window.location.reload();
    });
}
