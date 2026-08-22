(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ScribMusaAssignment = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const CLIENT_STORAGE_KEY = "scrib_musa_client_id";
    const ASSIGNMENT_SESSION_KEY = "scrib_musa_assignment";
    const WINDOW_NAME_PREFIX = "scrib:musa-client:";
    const CLIENT_ID_PATTERN = /^musa_[a-z0-9]{1,24}_[a-z0-9]{6,32}$/i;
    const REQUEST_ID_PATTERN = /^req_[a-z0-9]{1,24}_[a-z0-9]{6,32}$/i;

    function normalizeTeam(value) {
        if (value === 1 || value === "1" || value === "j1" || value === "azul" || value === "blue") {
            return 1;
        }
        if (value === 2 || value === "2" || value === "j2" || value === "rojo" || value === "red") {
            return 2;
        }
        return null;
    }

    function cleanText(value, fallback = "") {
        const text = typeof value === "string" ? value.trim() : "";
        return text || fallback;
    }

    function normalizeAssignment(payload) {
        if (!payload || typeof payload !== "object") return null;
        if (payload.ok === false) {
            return {
                ok: false,
                code: cleanText(payload.codigo || payload.code, "ASIGNACION_RECHAZADA"),
                message: cleanText(payload.mensaje || payload.message || payload.error)
            };
        }

        const player = normalizeTeam(payload.player ?? payload.equipo ?? payload.color);
        if (!player) return null;
        const color = player === 2 ? "rojo" : "azul";
        const rawTimestamp = payload.ts ?? payload.timestamp;
        const writer = cleanText(
            payload.nombre_escritxr || payload.escritxr || payload.writer,
            `ESCRITXR ${player}`
        );

        return {
            ok: true,
            player,
            equipo: player,
            color,
            teamName: cleanText(payload.nombre_equipo || payload.teamName, color.toUpperCase()),
            writer,
            reassigned: Boolean(payload.reasignada ?? payload.reassigned),
            reconnection: Boolean(payload.reconexion ?? payload.reconnection),
            clientId: cleanText(payload.client_id || payload.clientId),
            timestamp: rawTimestamp !== null && rawTimestamp !== undefined && rawTimestamp !== ""
                && Number.isFinite(Number(rawTimestamp))
                ? Number(rawTimestamp)
                : null
        };
    }

    function createRegistrationPayload(identity = {}) {
        return {
            client_id: cleanText(identity.clientId || identity.client_id),
            nombre: cleanText(identity.name || identity.nombre),
            request_id: normalizeRequestId(identity.requestId || identity.request_id)
        };
    }

    function createOpaqueId(prefix, now = Date.now, random = Math.random) {
        const timestamp = Math.max(0, Math.trunc(Number(now()) || Date.now())).toString(36);
        const randomValue = Math.max(0, Math.min(0.999999999999, Number(random()) || 0));
        const randomPart = Math.floor(randomValue * 0xffffffffffff).toString(36).padStart(10, "0");
        return `${prefix}_${timestamp}_${randomPart}`;
    }

    function createClientId(now = Date.now, random = Math.random) {
        return createOpaqueId("musa", now, random);
    }

    function createRequestId(now = Date.now, random = Math.random) {
        return createOpaqueId("req", now, random);
    }

    function normalizeClientId(value) {
        const normalized = cleanText(value);
        return CLIENT_ID_PATTERN.test(normalized) ? normalized : "";
    }

    function normalizeRequestId(value) {
        const normalized = cleanText(value);
        return REQUEST_ID_PATTERN.test(normalized) ? normalized : "";
    }

    function readClientIdFromWindowName(windowRef) {
        const value = cleanText(windowRef && windowRef.name);
        if (!value.startsWith(WINDOW_NAME_PREFIX)) return "";
        return normalizeClientId(value.slice(WINDOW_NAME_PREFIX.length));
    }

    function writeClientIdToWindowName(windowRef, clientId) {
        if (!windowRef || !normalizeClientId(clientId)) return false;
        try {
            windowRef.name = `${WINDOW_NAME_PREFIX}${clientId}`;
            return readClientIdFromWindowName(windowRef) === clientId;
        } catch (_error) {
            return false;
        }
    }

    function getOrCreateClientId(sessionStorage, options = {}) {
        const key = cleanText(options.key, CLIENT_STORAGE_KEY);
        try {
            if (!sessionStorage || typeof sessionStorage.getItem !== "function" || typeof sessionStorage.setItem !== "function") {
                throw new Error("Session storage unavailable.");
            }
            const existing = normalizeClientId(sessionStorage.getItem(key));
            if (existing) {
                if (cleanText(options.windowRef && options.windowRef.name).startsWith(WINDOW_NAME_PREFIX)) {
                    writeClientIdToWindowName(options.windowRef, existing);
                }
                return existing;
            }
            const generated = createClientId(options.now, options.random);
            sessionStorage.setItem(key, generated);
            if (normalizeClientId(sessionStorage.getItem(key)) !== generated) {
                throw new Error("Session storage did not persist the muse identity.");
            }
            return generated;
        } catch (_error) {
            const existingFallback = readClientIdFromWindowName(options.windowRef);
            if (existingFallback) return existingFallback;
            const generatedFallback = createClientId(options.now, options.random);
            writeClientIdToWindowName(options.windowRef, generatedFallback);
            return generatedFallback;
        }
    }

    function rotateClientId(sessionStorage, options = {}) {
        const key = cleanText(options.key, CLIENT_STORAGE_KEY);
        let currentId = "";
        try { currentId = normalizeClientId(sessionStorage && sessionStorage.getItem(key)); } catch (_error) {}
        if (!currentId) currentId = readClientIdFromWindowName(options.windowRef);
        let nextId = createClientId(options.now, options.random);
        if (nextId === currentId) nextId = `${nextId}r`;
        let stored = false;
        try {
            if (sessionStorage && typeof sessionStorage.setItem === "function") {
                sessionStorage.setItem(key, nextId);
                stored = normalizeClientId(sessionStorage.getItem(key)) === nextId;
            }
        } catch (_error) {}
        writeClientIdToWindowName(options.windowRef, nextId);
        return nextId;
    }

    function clearAssignmentSession(sessionStorage) {
        try {
            sessionStorage?.removeItem(ASSIGNMENT_SESSION_KEY);
            return true;
        } catch (_error) {
            return false;
        }
    }

    function assignmentBelongsToClient(payload, clientId) {
        const payloadClientId = cleanText(payload && payload.client_id);
        const expectedClientId = cleanText(clientId);
        return !payloadClientId || !expectedClientId || payloadClientId === expectedClientId;
    }

    function buildGameUrl(baseUrl, assignment, name) {
        const normalized = normalizeAssignment(assignment) || assignment;
        if (!normalized || normalized.ok !== true || !normalizeTeam(normalized.player)) return "";
        const separator = String(baseUrl || "").includes("?") ? "&" : "?";
        const params = new URLSearchParams({
            player: String(normalized.player),
            name: cleanText(name),
            escritxr: cleanText(normalized.writer, `ESCRITXR ${normalized.player}`),
            assigned: "1"
        });
        return `${baseUrl}${separator}${params.toString()}`;
    }

    function createCoordinator(options = {}) {
        const socket = options.socket;
        if (!socket || typeof socket.on !== "function" || typeof socket.emit !== "function") {
            throw new TypeError("A Socket.IO-compatible socket is required.");
        }

        const onWaiting = typeof options.onWaiting === "function" ? options.onWaiting : function () {};
        const onAssigned = typeof options.onAssigned === "function" ? options.onAssigned : function () {};
        const onError = typeof options.onError === "function" ? options.onError : function () {};
        const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 12000);
        const setTimer = options.setTimer || setTimeout;
        const clearTimer = options.clearTimer || clearTimeout;
        let identity = null;
        let delivered = false;
        let lastFingerprint = "";
        let timeoutId = null;
        let destroyed = false;
        let requestRevision = 0;
        let activeRequestId = "";
        let lastRequestIdIssued = "";

        function issueRequestId() {
            let nextId = createRequestId(options.now, options.random);
            if (nextId === lastRequestIdIssued) {
                nextId = `${nextId}${requestRevision.toString(36)}`;
            }
            lastRequestIdIssued = nextId;
            return nextId;
        }

        function clearRequestTimeout() {
            if (timeoutId === null) return;
            clearTimer(timeoutId);
            timeoutId = null;
        }

        function processPayload(payload) {
            if (destroyed || !identity || !assignmentBelongsToClient(payload, identity.clientId)) {
                return false;
            }
            const payloadRequestId = normalizeRequestId(payload && payload.request_id);
            const isRebalanceWithoutRequest = !payloadRequestId
                && delivered
                && cleanText(payload && payload.motivo).toLowerCase() === "reequilibrio";
            if ((!payloadRequestId || payloadRequestId !== activeRequestId) && !isRebalanceWithoutRequest) {
                return false;
            }
            const assignment = normalizeAssignment(payload);
            if (!assignment) return false;
            if (assignment.ok === false) {
                clearRequestTimeout();
                onError(assignment);
                return true;
            }
            const fingerprint = [assignment.player, assignment.teamName, assignment.writer].join("\u0000");
            if (delivered && fingerprint === lastFingerprint) {
                clearRequestTimeout();
                return true;
            }
            const isUpdate = delivered;
            delivered = true;
            lastFingerprint = fingerprint;
            clearRequestTimeout();
            onAssigned(assignment, { updated: isUpdate });
            return true;
        }

        function emitRegistration(force = false) {
            if (destroyed || !identity || (delivered && !force)) return false;
            if (socket.connected === false) {
                if (!delivered) onWaiting("connecting");
                if (typeof socket.connect === "function") socket.connect();
                return false;
            }
            if (!delivered) onWaiting("assigning");
            clearRequestTimeout();
            const revision = ++requestRevision;
            activeRequestId = issueRequestId();
            timeoutId = setTimer(function () {
                timeoutId = null;
                if (!delivered && !destroyed) {
                    onError({ ok: false, code: "ASIGNACION_TIMEOUT", message: "" });
                }
            }, timeoutMs);
            socket.emit("registrar_musa", createRegistrationPayload({
                ...identity,
                requestId: activeRequestId
            }), function (payload) {
                if (revision !== requestRevision) return false;
                return processPayload(payload);
            });
            return true;
        }

        function request(nextIdentity) {
            identity = {
                clientId: cleanText(nextIdentity && (nextIdentity.clientId || nextIdentity.client_id)),
                name: cleanText(nextIdentity && (nextIdentity.name || nextIdentity.nombre))
            };
            delivered = false;
            lastFingerprint = "";
            activeRequestId = "";
            clearRequestTimeout();
            return emitRegistration();
        }

        function retry() {
            if (!identity) return false;
            delivered = false;
            return emitRegistration();
        }

        function handleConnect() {
            if (identity) emitRegistration(delivered);
        }

        function handleDisconnect() {
            requestRevision += 1;
            clearRequestTimeout();
            activeRequestId = "";
            const invalidated = delivered;
            delivered = false;
            lastFingerprint = "";
            if (identity) {
                onWaiting(invalidated ? "revalidating" : "connecting", { invalidated });
            }
        }

        socket.on("musa_asignacion", processPayload);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        return {
            request,
            retry,
            processPayload,
            isAssigned: function () { return delivered; },
            getActiveRequestId: function () { return activeRequestId; },
            destroy: function () {
                destroyed = true;
                requestRevision += 1;
                activeRequestId = "";
                clearRequestTimeout();
                if (typeof socket.off === "function") {
                    socket.off("musa_asignacion", processPayload);
                    socket.off("connect", handleConnect);
                    socket.off("disconnect", handleDisconnect);
                }
            }
        };
    }

    return {
        CLIENT_STORAGE_KEY,
        ASSIGNMENT_SESSION_KEY,
        normalizeTeam,
        normalizeAssignment,
        createRegistrationPayload,
        createClientId,
        createRequestId,
        normalizeClientId,
        normalizeRequestId,
        getOrCreateClientId,
        rotateClientId,
        clearAssignmentSession,
        assignmentBelongsToClient,
        buildGameUrl,
        createCoordinator
    };
});
