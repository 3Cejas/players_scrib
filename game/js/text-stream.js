(function initScribTextStream(global) {
    "use strict";

    const normalizarTexto = (valor) => typeof valor === "string" ? valor : String(valor ?? "");

    function crearParcheTexto(anterior, siguiente) {
        const base = normalizarTexto(anterior);
        const nuevo = normalizarTexto(siguiente);
        let inicio = 0;
        const limitePrefijo = Math.min(base.length, nuevo.length);
        while (inicio < limitePrefijo && base.charCodeAt(inicio) === nuevo.charCodeAt(inicio)) inicio += 1;
        let sufijo = 0;
        const limiteSufijo = Math.min(base.length - inicio, nuevo.length - inicio);
        while (
            sufijo < limiteSufijo
            && base.charCodeAt(base.length - 1 - sufijo) === nuevo.charCodeAt(nuevo.length - 1 - sufijo)
        ) sufijo += 1;
        return {
            start: inicio,
            deleteCount: base.length - inicio - sufijo,
            insert: nuevo.slice(inicio, nuevo.length - sufijo)
        };
    }

    function aplicarParcheTexto(base, parche) {
        const texto = normalizarTexto(base);
        if (!parche || typeof parche !== "object") return null;
        const start = Number(parche.start);
        const deleteCount = Number(parche.deleteCount ?? parche.delete_count);
        const insert = normalizarTexto(parche.insert);
        if (!Number.isInteger(start) || !Number.isInteger(deleteCount)) return null;
        if (start < 0 || deleteCount < 0 || start > texto.length || (start + deleteCount) > texto.length) {
            return null;
        }
        return texto.slice(0, start) + insert + texto.slice(start + deleteCount);
    }

    const normalizarPlayers = (players) => Array.from(new Set(
        (Array.isArray(players) ? players : [players])
            .map(Number)
            .filter((id) => id === 1 || id === 2)
    ));

    function crearReceptor({ socket, players = [1, 2], cursors = false, onText = () => {}, onCursor = () => {} } = {}) {
        let suscripciones = normalizarPlayers(players);
        const estados = {
            1: { text: "", plain: "", revision: 0, payload: null },
            2: { text: "", plain: "", revision: 0, payload: null }
        };
        const pendientes = new Map();
        let frame = 0;
        let protocoloActivo = false;

        const requestFrame = typeof global.requestAnimationFrame === "function"
            ? global.requestAnimationFrame.bind(global)
            : (callback) => global.setTimeout(callback, 0);

        const renderPendientes = () => {
            frame = 0;
            const lote = Array.from(pendientes.entries());
            pendientes.clear();
            lote.forEach(([player, detalle]) => onText(player, detalle.payload, detalle));
        };

        const programar = (player, payload, origen) => {
            pendientes.set(player, { payload, origen, state: { ...estados[player] } });
            if (frame) return;
            const delay = global.ScribPerformanceProtection
                && typeof global.ScribPerformanceProtection.getRenderDelay === "function"
                ? global.ScribPerformanceProtection.getRenderDelay()
                : 0;
            frame = delay > 0
                ? global.setTimeout(renderPendientes, delay)
                : requestFrame(renderPendientes);
        };

        const pedirSuscripcion = () => {
            if (!socket || typeof socket.emit !== "function") return;
            socket.emit("suscribir_textos", {
                players: suscripciones,
                deltas: true,
                cursors: Boolean(cursors)
            }, (respuesta = {}) => {
                protocoloActivo = respuesta && respuesta.ok === true && Number(respuesta.protocol) >= 2;
            });
        };

        const aplicarSnapshot = (snapshot = {}) => {
            const player = Number(snapshot.player);
            if (!suscripciones.includes(player)) return;
            const entrada = snapshot.payload;
            const payload = entrada && typeof entrada === "object"
                ? { ...entrada }
                : { text: typeof entrada === "string" ? entrada : normalizarTexto(snapshot.text) };
            const text = typeof snapshot.text === "string"
                ? snapshot.text
                : (typeof payload.text === "string" ? payload.text : "");
            const plain = typeof snapshot.plain === "string"
                ? snapshot.plain
                : (typeof payload.texto_guardado === "string" ? payload.texto_guardado : "");
            const revision = Math.max(0, Math.trunc(Number(snapshot.revision) || 0));
            payload.text = text;
            if (plain || Object.prototype.hasOwnProperty.call(payload, "texto_guardado")) {
                payload.texto_guardado = plain;
            }
            payload.revision = revision;
            estados[player] = { text, plain, revision, payload };
            protocoloActivo = true;
            programar(player, payload, "snapshot");
        };

        const aplicarDelta = (delta = {}) => {
            const player = Number(delta.player);
            if (!suscripciones.includes(player)) return;
            const actual = estados[player];
            const baseRevision = Number(delta.baseRevision ?? delta.base_revision);
            const revision = Number(delta.revision);
            if (!Number.isInteger(baseRevision) || baseRevision !== actual.revision || !Number.isInteger(revision)) {
                pedirSuscripcion();
                return;
            }
            const text = aplicarParcheTexto(actual.text, delta.htmlPatch || delta.html_patch);
            const plain = aplicarParcheTexto(actual.plain, delta.plainPatch || delta.plain_patch);
            if (text === null || plain === null) {
                pedirSuscripcion();
                return;
            }
            const payload = {
                ...(actual.payload && typeof actual.payload === "object" ? actual.payload : {}),
                ...(delta.meta && typeof delta.meta === "object" ? delta.meta : {}),
                text,
                texto_guardado: plain,
                revision
            };
            estados[player] = { text, plain, revision, payload };
            protocoloActivo = true;
            programar(player, payload, "delta");
        };

        const aplicarLegacy = (player, entrada) => {
            if (!suscripciones.includes(player) || protocoloActivo) return;
            const payload = entrada && typeof entrada === "object" ? entrada : { text: normalizarTexto(entrada) };
            const text = typeof payload.text === "string" ? payload.text : "";
            const plain = typeof payload.texto_guardado === "string" ? payload.texto_guardado : "";
            estados[player] = { text, plain, revision: 0, payload };
            programar(player, payload, "legacy");
        };

        const recibirCursor = (payload = {}) => {
            const player = Number(payload.player);
            if (!suscripciones.includes(player)) return;
            onCursor(player, payload, { state: { ...estados[player] } });
        };

        if (socket && typeof socket.on === "function") {
            socket.on("texto_snapshot", aplicarSnapshot);
            socket.on("texto_delta", aplicarDelta);
            socket.on("texto_cursor", recibirCursor);
            socket.on("texto1", (payload) => aplicarLegacy(1, payload));
            socket.on("texto2", (payload) => aplicarLegacy(2, payload));
            socket.on("connect", pedirSuscripcion);
            if (socket.connected) pedirSuscripcion();
        }

        return {
            getState: (player) => ({ ...estados[Number(player) === 2 ? 2 : 1] }),
            subscribe(nextPlayers) {
                suscripciones = normalizarPlayers(nextPlayers);
                // Un render del canal anterior puede seguir pendiente en el mismo
                // frame. Lo descartamos al cambiar de equipo para que nunca vuelva
                // a pintar texto obsoleto después del nuevo snapshot.
                Array.from(pendientes.keys()).forEach((player) => {
                    if (!suscripciones.includes(player)) pendientes.delete(player);
                });
                protocoloActivo = false;
                pedirSuscripcion();
            },
            resync: pedirSuscripcion
        };
    }

    function crearEmisor({ socket, player, onSnapshot = () => {} } = {}) {
        const id = Number(player) === 2 ? 2 : 1;
        let activo = false;
        let revision = 0;
        let htmlBase = "";
        let plainBase = "";
        let ultimoPayloadDeseado = null;
        let temporizadorReintento = 0;

        const copiarPayload = (payload = {}) => ({
            ...(payload && typeof payload === "object" ? payload : { text: normalizarTexto(payload) })
        });

        const cancelarReintento = () => {
            if (!temporizadorReintento) return;
            global.clearTimeout(temporizadorReintento);
            temporizadorReintento = 0;
        };

        const observarSnapshot = (entrada = {}) => {
            const payload = entrada && typeof entrada === "object" ? entrada : { text: normalizarTexto(entrada) };
            htmlBase = typeof payload.text === "string" ? payload.text : "";
            plainBase = typeof payload.texto_guardado === "string" ? payload.texto_guardado : "";
            if (Number.isInteger(Number(payload.revision))) revision = Math.max(0, Number(payload.revision));
        };

        const recibirSnapshot = (snapshot = {}) => {
            if (Number(snapshot.player) !== id) return;
            revision = Math.max(0, Math.trunc(Number(snapshot.revision) || 0));
            htmlBase = typeof snapshot.text === "string" ? snapshot.text : "";
            plainBase = typeof snapshot.plain === "string" ? snapshot.plain : "";
            activo = true;
            onSnapshot(snapshot);
        };

        const negociar = () => {
            activo = false;
            cancelarReintento();
            if (!socket || typeof socket.emit !== "function") return;
            socket.emit("suscribir_textos", { players: [id], deltas: true, cursors: false }, (respuesta = {}) => {
                activo = respuesta && respuesta.ok === true && Number(respuesta.protocol) >= 2;
            });
        };

        const enviar = (payload = {}) => {
            const entrada = copiarPayload(payload);
            const html = typeof entrada.text === "string" ? entrada.text : "";
            const plain = typeof entrada.texto_guardado === "string" ? entrada.texto_guardado : "";
            if (!activo) {
                socket.emit(`texto${id}`, entrada);
                htmlBase = html;
                plainBase = plain;
                return false;
            }
            const meta = { ...entrada };
            delete meta.text;
            delete meta.texto_guardado;
            const baseRevision = revision;
            revision += 1;
            socket.emit("texto_delta_actualizar", {
                player: id,
                baseRevision,
                htmlPatch: crearParcheTexto(htmlBase, html),
                plainPatch: crearParcheTexto(plainBase, plain),
                meta
            }, (respuesta = {}) => {
                if (respuesta && respuesta.ok === true) return;
                const codigo = String(respuesta && respuesta.code || "");
                if (codigo === "REVISION_MISMATCH" || codigo === "INVALID_PATCH") {
                    cancelarReintento();
                    temporizadorReintento = global.setTimeout(() => {
                        temporizadorReintento = 0;
                        if (activo && ultimoPayloadDeseado) enviar(ultimoPayloadDeseado);
                    }, 35);
                    return;
                }
                if (codigo !== "TEXT_LOCKED" && codigo !== "INACTIVE_WRITER") {
                    activo = false;
                }
            });
            htmlBase = html;
            plainBase = plain;
            return true;
        };

        if (socket && typeof socket.on === "function") {
            socket.on("texto_snapshot", recibirSnapshot);
            socket.on("connect", negociar);
            if (socket.connected) negociar();
        }

        return {
            isActive: () => activo,
            observeSnapshot: observarSnapshot,
            send(payload = {}) {
                ultimoPayloadDeseado = copiarPayload(payload);
                return enviar(ultimoPayloadDeseado);
            }
        };
    }

    global.ScribTextStream = {
        aplicarParcheTexto,
        crearEmisor,
        crearParcheTexto,
        crearReceptor
    };
})(typeof window !== "undefined" ? window : globalThis);
