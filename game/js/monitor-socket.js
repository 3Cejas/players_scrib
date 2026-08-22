(function instalarMonitorPantallaDramaturgia(global) {
    "use strict";

    const params = new URLSearchParams(global.location.search);
    if (params.get("dramaturgia_monitor") !== "1") {
        return;
    }

    const PANTALLAS = {
        control: { rol: "control", player: null },
        spectator: { rol: "espectador", player: null },
        jury: { rol: "jurado", player: null },
        writer1: { rol: "escritor", player: 1 },
        writer2: { rol: "escritor", player: 2 },
        musa1: { rol: "musa", player: 1 },
        musa2: { rol: "musa", player: 2 },
        actor1: { rol: "actor", player: 1 },
        actor2: { rol: "actor", player: 2 }
    };
    const REGISTROS_REALES = new Set([
        "registrar_actor",
        "registrar_control",
        "registrar_escritor",
        "registrar_espectador",
        "registrar_jurado",
        "registrar_musa"
    ]);
    const EVENTOS_INTERNOS_SOCKET_IO = new Set([
        "connect",
        "connect_error",
        "connect_timeout",
        "connecting",
        "disconnect",
        "error",
        "reconnect",
        "reconnect_attempt",
        "reconnect_failed",
        "reconnect_error",
        "reconnecting",
        "ping",
        "pong"
    ]);
    const EVENTOS_LECTURA = new Set([
        "health_ping",
        "pedir_atributos",
        "pedir_calentamiento_estado",
        "pedir_creditos_estado",
        "pedir_estado_banderas_musas",
        "pedir_estado_control",
        "pedir_estado_musa",
        "pedir_estado_palabras_musas_control",
        "pedir_estado_regalo_bandera_musas",
        "pedir_feedback_musas_estado",
        "pedir_idioma_actual",
        "pedir_nombre",
        "pedir_nube_inspiracion",
        "pedir_resumen_musas_pdf",
        "pedir_stats_live",
        "pedir_teleprompter_estado",
        "pedir_texto",
        "pedir_vista_espectador_modo"
    ]);

    function inferirPantalla() {
        const explicita = params.get("screen_id");
        if (PANTALLAS[explicita]) return explicita;
        const player = Number(params.get("player")) === 2 ? 2 : 1;
        const path = global.location.pathname;
        if (path.includes("/public/players/")) return `musa${player}`;
        if (path.includes("/actors/source/")) return `actor${player}`;
        if (path.includes("/players/")) return `writer${player}`;
        if (path.includes("/control/")) return "control";
        if (path.includes("/spectator/")) return "spectator";
        if (path.includes("/jurado/")) return "jury";
        return "";
    }

    const screenId = inferirPantalla();
    const pantalla = PANTALLAS[screenId];
    if (!pantalla) {
        return;
    }

    global.__SCRIB_DRAMATURGIA_MONITOR__ = {
        active: true,
        screenId,
        role: pantalla.rol,
        player: pantalla.player,
        readOnly: true
    };

    function informar(estado, extra) {
        if (!global.parent || global.parent === global) return;
        global.parent.postMessage({
            type: "scrib-dramaturgia-monitor",
            screenId,
            estado,
            role: pantalla.rol,
            player: pantalla.player,
            ...(extra || {})
        }, global.location.origin);
    }

    function envolverIo(ioOriginal) {
        if (typeof ioOriginal !== "function" || ioOriginal.__scribEsMonitor) {
            return ioOriginal;
        }

        function ioMonitorizado() {
            const argsIo = Array.prototype.slice.call(arguments);
            const optionsIndex = typeof argsIo[0] === "string" ? 1 : 0;
            const options = argsIo[optionsIndex] && typeof argsIo[optionsIndex] === "object"
                ? { ...argsIo[optionsIndex] }
                : {};
            const query = options.query && typeof options.query === "object"
                ? { ...options.query }
                : {};
            if (typeof options.query === "string") {
                new URLSearchParams(options.query).forEach((value, key) => {
                    query[key] = value;
                });
            }
            query.dramaturgia_monitor = "1";
            query.screen_id = screenId;
            options.query = query;
            argsIo[optionsIndex] = options;

            const socket = ioOriginal.apply(this, argsIo);
            if (!socket || typeof socket.emit !== "function" || socket.__scribMonitorizado) {
                return socket;
            }

            socket.__scribMonitorizado = true;
            let registrado = false;
            const emitirOriginal = socket.emit.bind(socket);

            const registrarMonitor = () => {
                if (registrado || !socket.connected) return;
                registrado = true;
                informar("syncing");
                emitirOriginal("registrar_monitor_pantalla", {
                    rol: pantalla.rol,
                    player: pantalla.player,
                    screen_id: screenId
                });
            };

            socket.emit = function emitirSoloLectura(evento) {
                const args = Array.prototype.slice.call(arguments, 1);
                if (EVENTOS_INTERNOS_SOCKET_IO.has(evento)) {
                    return emitirOriginal(evento, ...args);
                }
                if (REGISTROS_REALES.has(evento)) {
                    registrarMonitor();
                    return socket;
                }
                if (EVENTOS_LECTURA.has(evento)) {
                    return emitirOriginal(evento, ...args);
                }
                informar("blocked", { evento: String(evento || "") });
                const callback = args.length && typeof args[args.length - 1] === "function"
                    ? args[args.length - 1]
                    : null;
                if (callback) {
                    callback({ ok: false, solo_lectura: true, evento });
                }
                return socket;
            };

            socket.on("connect", () => {
                registrado = false;
                registrarMonitor();
            });
            socket.on("monitor_pantalla_estado", (payload) => {
                informar(payload && payload.ok ? "live" : "error", {
                    detail: payload && payload.ok ? "Réplica sincronizada" : "Registro de monitor rechazado"
                });
            });
            socket.on("disconnect", () => informar("offline"));
            socket.on("connect_error", () => informar("offline"));
            registrarMonitor();
            return socket;
        }

        Object.keys(ioOriginal).forEach((key) => {
            try {
                ioMonitorizado[key] = ioOriginal[key];
            } catch (_error) {}
        });
        ioMonitorizado.connect = function conectarMonitor() {
            return ioMonitorizado.apply(this, arguments);
        };
        ioMonitorizado.__scribEsMonitor = true;
        return ioMonitorizado;
    }

    if (typeof global.io === "function") {
        global.io = envolverIo(global.io);
    } else {
        let ioPendiente;
        try {
            Object.defineProperty(global, "io", {
                configurable: true,
                enumerable: true,
                get() {
                    return ioPendiente;
                },
                set(value) {
                    ioPendiente = envolverIo(value);
                }
            });
        } catch (_error) {
            informar("error", { detail: "No se pudo preparar el socket de monitor" });
        }
    }

    function silenciarMedios() {
        document.querySelectorAll("audio, video").forEach((media) => {
            media.muted = true;
            media.volume = 0;
        });
    }

    function prepararSuperficie() {
        document.documentElement.classList.add("scrib-dramaturgia-monitor");
        if (document.body) {
            document.body.classList.add("scrib-dramaturgia-monitor");
        }
        const style = document.createElement("style");
        style.textContent = `
            .scrib-dramaturgia-monitor .musa-world-entry,
            .scrib-dramaturgia-monitor #musa_world_entry {
                display: none !important;
            }
            .scrib-monitor-shield {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                cursor: zoom-in;
                background: transparent;
                touch-action: none;
            }
            .scrib-monitor-shield__badge {
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 6px 8px;
                border: 1px solid rgba(255,255,255,.5);
                border-radius: 4px;
                background: rgba(3,7,12,.82);
                color: #dffaff;
                font: 10px/1.2 monospace;
                letter-spacing: .08em;
                box-shadow: 0 0 14px rgba(81,231,255,.22);
            }
        `;
        document.head.appendChild(style);

        const shield = document.createElement("div");
        shield.className = "scrib-monitor-shield";
        shield.setAttribute("aria-label", "Réplica de solo lectura. Abrir pantalla.");
        shield.innerHTML = '<span class="scrib-monitor-shield__badge">RÉPLICA · SOLO LECTURA</span>';
        shield.addEventListener("click", () => informar("open"));
        document.body.appendChild(shield);
        silenciarMedios();

        if (typeof global.invalidarEntradaMundoMusa === "function") {
            global.invalidarEntradaMundoMusa();
        }
        informar("loading");
    }

    try {
        const playOriginal = global.HTMLMediaElement
            && global.HTMLMediaElement.prototype
            && global.HTMLMediaElement.prototype.play;
        if (playOriginal) {
            global.HTMLMediaElement.prototype.play = function reproducirSilenciado() {
                this.muted = true;
                this.volume = 0;
                return playOriginal.call(this).catch(() => undefined);
            };
        }
    } catch (_error) {}

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", prepararSuperficie, { once: true });
    } else {
        prepararSuperficie();
    }
})(window);
