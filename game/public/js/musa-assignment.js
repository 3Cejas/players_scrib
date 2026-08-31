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
    const SESSION_ID_PATTERN = /^partida_[a-z0-9]+_[a-z0-9]+$/i;

    function normalizeTeam(value) {
        if (value === 1 || value === "1" || value === "j1" || value === "azul" || value === "blue") {
            return 1;
        }
        if (value === 2 || value === "2" || value === "j2" || value === "rojo" || value === "red") {
            return 2;
        }
        return null;
    }

    function normalizeAssignmentMode(value) {
        return String(value || "").trim().toLowerCase() === "manual"
            ? "manual"
            : "automatica";
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
                message: cleanText(payload.mensaje || payload.message || payload.error),
                sessionId: normalizeSessionId(payload.session_id || payload.sessionId)
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
            assignmentMode: normalizeAssignmentMode(payload.modo_asignacion || payload.assignmentMode),
            reassigned: Boolean(payload.reasignada ?? payload.reassigned),
            reconnection: Boolean(payload.reconexion ?? payload.reconnection),
            clientId: cleanText(payload.client_id || payload.clientId),
            sessionId: normalizeSessionId(payload.session_id || payload.sessionId),
            timestamp: rawTimestamp !== null && rawTimestamp !== undefined && rawTimestamp !== ""
                && Number.isFinite(Number(rawTimestamp))
                ? Number(rawTimestamp)
                : null
        };
    }

    function createRegistrationPayload(identity = {}) {
        const mode = normalizeAssignmentMode(identity.assignmentMode || identity.modo_asignacion);
        const payload = {
            client_id: cleanText(identity.clientId || identity.client_id),
            nombre: cleanText(identity.name || identity.nombre),
            request_id: normalizeRequestId(identity.requestId || identity.request_id),
            modo_asignacion: mode
        };
        const sessionId = normalizeSessionId(identity.sessionId || identity.session_id);
        if (sessionId) payload.session_id = sessionId;
        const team = normalizeTeam(identity.player ?? identity.equipo ?? identity.team);
        if (mode === "manual" && team) payload.equipo = team;
        return payload;
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

    function normalizeSessionId(value) {
        const normalized = cleanText(value);
        return SESSION_ID_PATTERN.test(normalized) ? normalized : "";
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

    function readAssignmentSession(sessionStorage, clientId) {
        const expectedClientId = normalizeClientId(clientId);
        if (!expectedClientId) return null;
        try {
            const raw = sessionStorage?.getItem(ASSIGNMENT_SESSION_KEY);
            const stored = raw ? JSON.parse(raw) : null;
            const storedClientId = normalizeClientId(stored && (stored.clientId || stored.client_id));
            const assignment = normalizeAssignment(stored);
            const name = cleanText(stored && (stored.name || stored.nombre));
            if (!assignment || assignment.ok !== true || !name || storedClientId !== expectedClientId) {
                return null;
            }
            return {
                assignment: { ...assignment, clientId: expectedClientId },
                clientId: expectedClientId,
                name
            };
        } catch (_error) {
            return null;
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
            modo_asignacion: normalizeAssignmentMode(normalized.assignmentMode),
            assigned: "1"
        });
        if (normalized.sessionId) params.set("session_id", normalized.sessionId);
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
                name: cleanText(nextIdentity && (nextIdentity.name || nextIdentity.nombre)),
                assignmentMode: normalizeAssignmentMode(
                    nextIdentity && (nextIdentity.assignmentMode || nextIdentity.modo_asignacion)
                ),
                sessionId: normalizeSessionId(nextIdentity && (nextIdentity.sessionId || nextIdentity.session_id)),
                player: normalizeTeam(nextIdentity && (nextIdentity.player ?? nextIdentity.equipo ?? nextIdentity.team))
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

    function createHoldController(options = {}) {
        const durationMs = Math.max(300, Number(options.durationMs) || 1800);
        const now = typeof options.now === "function"
            ? options.now
            : () => (typeof performance !== "undefined" && typeof performance.now === "function"
                ? performance.now()
                : Date.now());
        const requestFrame = typeof options.requestFrame === "function"
            ? options.requestFrame
            : (callback) => {
                if (typeof requestAnimationFrame === "function") return requestAnimationFrame(callback);
                return setTimeout(() => callback(now()), 16);
            };
        const cancelFrame = typeof options.cancelFrame === "function"
            ? options.cancelFrame
            : (frameId) => {
                if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frameId);
                else clearTimeout(frameId);
            };
        const onProgress = typeof options.onProgress === "function" ? options.onProgress : function () {};
        const onComplete = typeof options.onComplete === "function" ? options.onComplete : function () {};
        let active = false;
        let completed = false;
        let startedAt = 0;
        let frameId = null;

        function stopFrame() {
            if (frameId === null) return;
            cancelFrame(frameId);
            frameId = null;
        }

        function tick(timestamp) {
            if (!active) return;
            const current = Number.isFinite(Number(timestamp)) ? Number(timestamp) : now();
            const progress = Math.max(0, Math.min(1, (current - startedAt) / durationMs));
            onProgress(progress);
            if (progress >= 1) {
                active = false;
                completed = true;
                frameId = null;
                onComplete();
                return;
            }
            frameId = requestFrame(tick);
        }

        return {
            start() {
                if (active || completed) return false;
                active = true;
                startedAt = now();
                onProgress(0);
                frameId = requestFrame(tick);
                return true;
            },
            cancel() {
                if (!active) return false;
                active = false;
                stopFrame();
                onProgress(0, { cancelled: true });
                return true;
            },
            reset() {
                active = false;
                completed = false;
                stopFrame();
                onProgress(0, { reset: true });
            },
            isActive() { return active; },
            isComplete() { return completed; }
        };
    }

    return {
        CLIENT_STORAGE_KEY,
        ASSIGNMENT_SESSION_KEY,
        normalizeTeam,
        normalizeAssignmentMode,
        normalizeAssignment,
        createRegistrationPayload,
        createClientId,
        createRequestId,
        normalizeClientId,
        normalizeRequestId,
        normalizeSessionId,
        getOrCreateClientId,
        rotateClientId,
        clearAssignmentSession,
        readAssignmentSession,
        assignmentBelongsToClient,
        buildGameUrl,
        createCoordinator,
        createHoldController
    };
});
