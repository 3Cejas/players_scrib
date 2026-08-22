(function initScribDramaturgiaHistoryController(global) {
    "use strict";

    const snapshots = global.ScribDramaturgiaHistorySnapshots;
    const toolsModel = global.ScribDramaturgiaToolsModel;
    if (!snapshots || !toolsModel) return;

    const archiveState = {
        archive: null,
        store: snapshots.createHistoryStore({ maxCheckpoints: 720 }),
        sessionId: "",
        sessionPromise: null,
        generation: 0,
        initialized: false,
        initializePromise: null,
        pendingByCheckpoint: new Map(),
        fallbackTimers: new Map(),
        captureIds: new Set(),
        captureTail: Promise.resolve(),
        baselineTimer: 0,
        journalEvents: [],
        missingEvents: 0,
        capturing: false,
        revision: 0,
        error: "",
        previewObserver: null,
        previewResizeObserver: null,
        previewSpecs: new WeakMap()
    };

    function cleanText(value, maxLength = 240) {
        return String(value == null ? "" : value).trim().slice(0, maxLength);
    }

    function uniqueStrings(values) {
        return [...new Set((Array.isArray(values) ? values : [])
            .map((value) => cleanText(value, 500))
            .filter(Boolean))];
    }

    function screenById(screenId) {
        return toolsModel.SCREENS.find((screen) => screen.id === screenId) || null;
    }

    function runtimeStore() {
        return global.ScribDramaturgiaRuntime && global.ScribDramaturgiaRuntime.store;
    }

    function eventType(event) {
        return cleanText(event && (event.tipo || event.type), 80).toLowerCase();
    }

    function isPresenceEvent(event) {
        return eventType(event) === "presencias";
    }

    function isPresenceOnlyCheckpoint(checkpoint) {
        const events = Array.isArray(checkpoint && checkpoint.events) ? checkpoint.events : [];
        return events.length > 0 && events.every(isPresenceEvent);
    }

    function visibleCheckpoints() {
        return archiveState.store.listCheckpoints(archiveState.sessionId)
            .filter((checkpoint) => !isPresenceOnlyCheckpoint(checkpoint));
    }

    function emitUpdate(reason = "update") {
        archiveState.revision += 1;
        global.dispatchEvent(new CustomEvent("scrib-dramaturgia-history-update", {
            detail: {
                reason,
                revision: archiveState.revision,
                status: getStatus()
            }
        }));
    }

    function refreshMissingEvents(events = archiveState.journalEvents) {
        archiveState.journalEvents = Array.isArray(events) ? [...events] : [];
        archiveState.missingEvents = archiveState.journalEvents.reduce((total, event) => {
            if (isPresenceEvent(event)) return total;
            const eventId = cleanText(event && event.id, 500);
            return total + (eventId && !archiveState.store.checkpointForEvent(eventId) ? 1 : 0);
        }, 0);
    }

    function getStatus() {
        const checkpoints = visibleCheckpoints();
        const count = checkpoints.length;
        const partialCount = checkpoints.filter((checkpoint) => checkpoint.complete === false).length;
        if (archiveState.error) {
            return { state: "error", text: archiveState.error, count, missing: archiveState.missingEvents, partial: partialCount };
        }
        if (archiveState.capturing) {
            return {
                state: "capturing",
                text: "Guardando pantallas…",
                count,
                missing: archiveState.missingEvents,
                partial: partialCount
            };
        }
        if (!archiveState.initialized) {
            return { state: "capturing", text: "Preparando recorrido…", count, missing: 0, partial: 0 };
        }
        if (!count) {
            return {
                state: archiveState.missingEvents ? "partial" : "ready",
                text: archiveState.missingEvents
                    ? "Esperando la siguiente pantalla"
                    : "Esperando el inicio de la partida",
                count,
                missing: archiveState.missingEvents,
                partial: partialCount
            };
        }
        return {
            state: archiveState.missingEvents || partialCount ? "partial" : "ready",
            text: `${count} momento${count === 1 ? "" : "s"} guardado${count === 1 ? "" : "s"}`,
            count,
            missing: archiveState.missingEvents,
            partial: partialCount
        };
    }

    function nextPaint(count = 1) {
        return new Promise((resolve) => {
            function frame(remaining) {
                global.requestAnimationFrame(() => {
                    if (remaining <= 1) resolve();
                    else frame(remaining - 1);
                });
            }
            frame(Math.max(1, count));
        });
    }

    function createPreviewObservers() {
        if (typeof global.ResizeObserver === "function") {
            archiveState.previewResizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => fitPreview(entry.target));
            });
        }
        if (typeof global.IntersectionObserver !== "function") return;
        archiveState.previewObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) loadPreview(entry.target);
                else unloadPreview(entry.target);
            });
        }, { root: null, rootMargin: "220px", threshold: 0.01 });
    }

    async function initialize() {
        if (archiveState.initializePromise) return archiveState.initializePromise;
        archiveState.initializePromise = (async () => {
            const pool = global.ScribDramaturgiaScreenPool;
            if (pool && typeof pool.ensure === "function") pool.ensure();
            archiveState.archive = await snapshots.openArchive({
                name: "scrib-dramaturgia-html-history-v1",
                maxBytes: 96 * 1024 * 1024,
                maxCheckpoints: 720
            });
            createPreviewObservers();
            archiveState.initialized = true;
            emitUpdate("initialized");
            return archiveState.archive;
        })().catch((error) => {
            archiveState.initialized = true;
            archiveState.error = "No se pudo preparar el recorrido";
            emitUpdate("initialize-error");
            throw error;
        });
        return archiveState.initializePromise;
    }

    async function syncSession(sessionId, journalEvents = []) {
        await initialize();
        const normalizedSession = cleanText(sessionId, 240);
        if (!normalizedSession) {
            refreshMissingEvents(journalEvents);
            emitUpdate("journal-only");
            return [];
        }
        if (normalizedSession === archiveState.sessionId && archiveState.sessionPromise) {
            await archiveState.sessionPromise;
            refreshMissingEvents(journalEvents);
            scheduleBaseline();
            emitUpdate("journal-sync");
            return archiveState.store.listCheckpoints(normalizedSession);
        }

        const generation = ++archiveState.generation;
        archiveState.sessionId = normalizedSession;
        archiveState.store = snapshots.createHistoryStore({ maxCheckpoints: 720 });
        archiveState.journalEvents = Array.isArray(journalEvents) ? [...journalEvents] : [];
        archiveState.missingEvents = 0;
        archiveState.error = "";
        archiveState.sessionPromise = (async () => {
            const persisted = await archiveState.archive.listCheckpoints(normalizedSession);
            if (generation !== archiveState.generation) return [];
            persisted.forEach((checkpoint) => archiveState.store.putCheckpoint(checkpoint));
            refreshMissingEvents(archiveState.journalEvents);
            scheduleBaseline();
            emitUpdate("session-loaded");
            return persisted;
        })().catch(() => {
            if (generation === archiveState.generation) {
                archiveState.error = "No se pudo recuperar esta partida";
                emitUpdate("session-error");
            }
            return [];
        });
        return archiveState.sessionPromise;
    }

    function scheduleBaseline() {
        if (archiveState.baselineTimer || !archiveState.sessionId) return;
        if (archiveState.capturing || archiveState.captureIds.size) return;
        if (visibleCheckpoints().length) return;
        archiveState.baselineTimer = global.setTimeout(() => {
            archiveState.baselineTimer = 0;
            if (visibleCheckpoints().length) return;
            const store = runtimeStore();
            const current = store && store.current ? store.current : {};
            const summary = global.ScribDramaturgiaModel
                ? global.ScribDramaturgiaModel.currentSummary(current)
                : { phase: "espera", mode: "" };
            const capturedAt = Date.now();
            const seq = store ? Number(store.lastSeq) || 0 : 0;
            const event = {
                id: `${archiveState.sessionId}:archivo-abierto:${capturedAt}`,
                seq,
                ts: capturedAt,
                tipo: "archivo_visual",
                titulo: "Apertura del archivo visual",
                detalle: "Estado real congelado al abrir Dramaturgia; no reconstruye momentos anteriores.",
                espacio: "sistema",
                fase: summary.phase || "espera",
                modo: summary.mode || "",
                causa_ids: []
            };
            enqueueCapture([event], {
                id: `checkpoint:${archiveState.sessionId}:apertura:${capturedAt}`,
                session_id: archiveState.sessionId,
                ts: capturedAt,
                seq_start: seq,
                seq_end: seq,
                event_ids: [event.id],
                causa_ids: [],
                source: "client_baseline"
            });
        }, 900);
    }

    function cancelBaseline() {
        if (!archiveState.baselineTimer) return;
        global.clearTimeout(archiveState.baselineTimer);
        archiveState.baselineTimer = 0;
    }

    function pendingEvents(checkpointId) {
        if (!archiveState.pendingByCheckpoint.has(checkpointId)) {
            archiveState.pendingByCheckpoint.set(checkpointId, new Map());
        }
        return archiveState.pendingByCheckpoint.get(checkpointId);
    }

    function receiveEvent(input) {
        const event = input && typeof input === "object" ? input : {};
        const eventId = cleanText(event.id, 500);
        if (!eventId) return;
        if (!archiveState.journalEvents.some((item) => item && item.id === eventId)) {
            archiveState.journalEvents.push({ ...event });
        }
        if (isPresenceEvent(event)) {
            refreshMissingEvents();
            scheduleBaseline();
            emitUpdate("presence-ignored");
            return;
        }
        cancelBaseline();
        const checkpointId = cleanText(event.checkpoint_id || event.checkpointId, 500)
            || `legacy:${archiveState.sessionId || "session"}:${eventId}`;
        pendingEvents(checkpointId).set(eventId, { ...event });
        const previousTimer = archiveState.fallbackTimers.get(checkpointId);
        if (previousTimer) global.clearTimeout(previousTimer);
        archiveState.fallbackTimers.set(checkpointId, global.setTimeout(() => {
            archiveState.fallbackTimers.delete(checkpointId);
            const group = archiveState.pendingByCheckpoint.get(checkpointId);
            if (!group || !group.size) return;
            archiveState.pendingByCheckpoint.delete(checkpointId);
            const events = [...group.values()];
            const eventTimestamps = events.map((item) => Number(item.ts) || 0).filter(Boolean);
            enqueueCapture(events, {
                id: checkpointId,
                session_id: event.session_id || archiveState.sessionId,
                ts: eventTimestamps.length ? Math.max(...eventTimestamps) : Date.now(),
                seq_start: Math.min(...events.map((item) => Number(item.seq) || 0)),
                seq_end: Math.max(...events.map((item) => Number(item.seq) || 0)),
                event_ids: events.map((item) => item.id),
                causa_ids: uniqueStrings(events.flatMap((item) => item.causa_ids || [])),
                source: "event_fallback"
            });
        }, 450));
    }

    function eventsForCheckpoint(payload) {
        const ids = uniqueStrings(payload.event_ids || payload.eventIds || []);
        const pending = archiveState.pendingByCheckpoint.get(cleanText(payload.id, 500));
        const store = runtimeStore();
        const storeEvents = store && Array.isArray(store.events) ? store.events : [];
        return ids.map((eventId) => (
            pending && pending.get(eventId)
            || storeEvents.find((event) => event.id === eventId)
        )).filter(Boolean);
    }

    function receiveCheckpoint(input = {}) {
        const payload = input && typeof input === "object" ? input : {};
        const checkpointId = cleanText(payload.id, 500);
        if (!checkpointId) return Promise.resolve(null);
        const timer = archiveState.fallbackTimers.get(checkpointId);
        if (timer) global.clearTimeout(timer);
        archiveState.fallbackTimers.delete(checkpointId);
        const events = eventsForCheckpoint(payload);
        archiveState.pendingByCheckpoint.delete(checkpointId);
        if (!events.length) return Promise.resolve(null);
        if (events.every(isPresenceEvent)) {
            refreshMissingEvents();
            scheduleBaseline();
            emitUpdate("presence-checkpoint-ignored");
            return Promise.resolve(null);
        }
        cancelBaseline();
        return enqueueCapture(events, { ...payload, source: "server_checkpoint" });
    }

    async function waitForFrameDocuments(timeoutMs = 3600) {
        const pool = global.ScribDramaturgiaScreenPool;
        if (!pool) return [];
        if (typeof pool.ensure === "function") pool.ensure();
        const startedAt = Date.now();
        let sources = [];
        do {
            sources = snapshots.SCREEN_IDS.map((screenId) => pool.getSource(screenId)).filter(Boolean);
            const ready = sources.filter((source) => {
                try {
                    const document = source.frame.contentDocument;
                    return document && document.documentElement && document.body
                        && (document.readyState === "interactive" || document.readyState === "complete");
                } catch (_error) {
                    return false;
                }
            });
            if (ready.length === snapshots.SCREEN_IDS.length) {
                const fontPromises = ready.map((source) => {
                    try {
                        return source.frame.contentDocument.fonts?.ready || Promise.resolve();
                    } catch (_error) {
                        return Promise.resolve();
                    }
                });
                await Promise.race([
                    Promise.allSettled(fontPromises),
                    new Promise((resolve) => global.setTimeout(resolve, 320))
                ]);
                await nextPaint(2);
                return sources;
            }
            await new Promise((resolve) => global.setTimeout(resolve, 80));
        } while (Date.now() - startedAt < timeoutMs);
        await nextPaint(2);
        return sources;
    }

    function checkpointAccent(checkpoint) {
        const event = checkpoint.events[checkpoint.events.length - 1] || {};
        const model = global.ScribDramaturgiaModel;
        return model && model.SPACE_BY_ID[event.espacio]
            ? model.SPACE_BY_ID[event.espacio].accent
            : "#ffd166";
    }

    async function captureCheckpoint(events, payload = {}) {
        const sessionId = cleanText(payload.session_id || payload.sessionId || archiveState.sessionId, 240);
        if (!sessionId) return null;
        if (Array.isArray(events) && events.length && events.every(isPresenceEvent)) return null;
        await syncSession(sessionId, archiveState.journalEvents);
        const checkpointId = cleanText(payload.id, 500);
        if (checkpointId && archiveState.store.getCheckpoint(checkpointId)) {
            return archiveState.store.getCheckpoint(checkpointId);
        }

        archiveState.capturing = true;
        archiveState.error = "";
        emitUpdate("capture-start");
        const sources = await waitForFrameDocuments();
        const capturedAt = Date.now();
        const serialized = [];
        const missingRoles = [];
        snapshots.SCREEN_IDS.forEach((screenId) => {
            const screen = screenById(screenId);
            const source = sources.find((item) => item && item.screen && item.screen.id === screenId);
            try {
                const document = source && source.frame.contentDocument;
                if (!document || !document.documentElement || !screen) throw new Error("unavailable");
                serialized.push({
                    screen,
                    html: snapshots.serializeDocument(document, {
                        screenId,
                        width: screen.width,
                        height: screen.height,
                        capturedAt,
                        baseUrl: document.baseURI
                    })
                });
            } catch (_error) {
                missingRoles.push(screenId);
            }
        });

        const previousByEvent = (eventId) => archiveState.store.checkpointForEvent(eventId);
        const checkpoint = snapshots.groupEventsIntoCheckpoint(events, sessionId, previousByEvent);
        if (!checkpoint) {
            archiveState.capturing = false;
            emitUpdate("capture-empty");
            return null;
        }
        checkpoint.id = checkpointId || checkpoint.id;
        checkpoint.ts = Number(payload.ts) || checkpoint.ts || capturedAt;
        checkpoint.capturedAt = capturedAt;
        checkpoint.seqStart = Number.isFinite(Number(payload.seq_start))
            ? Number(payload.seq_start)
            : checkpoint.seqStart;
        checkpoint.seqEnd = Number.isFinite(Number(payload.seq_end))
            ? Number(payload.seq_end)
            : checkpoint.seqEnd;
        checkpoint.seq = checkpoint.seqEnd;
        checkpoint.eventIds = uniqueStrings(payload.event_ids || checkpoint.eventIds);
        checkpoint.causeEventIds = uniqueStrings(payload.causa_ids || checkpoint.causeEventIds);
        checkpoint.previousCheckpointIds = uniqueStrings([
            ...checkpoint.previousCheckpointIds,
            ...checkpoint.causeEventIds.map(previousByEvent)
        ]);
        checkpoint.source = cleanText(payload.source || "server_checkpoint", 80);
        checkpoint.missingRoles = missingRoles;
        checkpoint.complete = missingRoles.length === 0;
        checkpoint.primarySpace = checkpoint.events[checkpoint.events.length - 1]?.espacio || "sistema";
        checkpoint.primaryPhase = checkpoint.events[checkpoint.events.length - 1]?.fase || "espera";
        checkpoint.accent = checkpointAccent(checkpoint);

        const artifacts = await Promise.all(serialized.map(async ({ screen, html }) => {
            const hash = await snapshots.hashSnapshot(html);
            await archiveState.archive.putBlob(hash, html, {
                screenId: screen.id,
                width: screen.width,
                height: screen.height,
                capturedAt
            });
            return { screenId: screen.id, hash };
        }));
        checkpoint.roles = Object.fromEntries(artifacts.map((item) => [item.screenId, item.hash]));
        await archiveState.archive.putCheckpoint(checkpoint);
        archiveState.store.putCheckpoint(checkpoint);
        refreshMissingEvents();
        archiveState.capturing = false;
        emitUpdate("checkpoint-captured");
        return checkpoint;
    }

    function enqueueCapture(events, payload = {}) {
        const id = cleanText(payload.id, 500);
        if (!id || archiveState.captureIds.has(id) || archiveState.store.getCheckpoint(id)) {
            return Promise.resolve(id ? archiveState.store.getCheckpoint(id) : null);
        }
        archiveState.captureIds.add(id);
        archiveState.captureTail = archiveState.captureTail
            .catch(() => null)
            .then(() => captureCheckpoint(events, payload))
            .catch(() => {
                archiveState.capturing = false;
                archiveState.error = "No se pudo guardar un momento";
                emitUpdate("capture-error");
                return null;
            })
            .finally(() => archiveState.captureIds.delete(id));
        return archiveState.captureTail;
    }

    function getCheckpoints(options = {}) {
        const filter = cleanText(options.filter || "todos", 40).toLowerCase();
        const phase = cleanText(options.phase || "todas", 40).toLowerCase();
        const limit = Math.max(1, Number(options.limit) || 72);
        return visibleCheckpoints()
            .filter((checkpoint) => checkpoint.events.some((event) => (
                (filter === "todos" || event.espacio === filter)
                && (phase === "todas" || event.fase === phase)
            )))
            .slice(-limit);
    }

    async function getSnapshot(checkpointId, screenId) {
        await initialize();
        const checkpoint = archiveState.store.getCheckpoint(checkpointId)
            || await archiveState.archive.getCheckpoint(checkpointId);
        const hash = checkpoint && checkpoint.roles ? checkpoint.roles[screenId] : "";
        if (!hash) return null;
        const blob = await archiveState.archive.getBlob(hash);
        return blob ? { checkpoint, hash, html: blob.html, meta: blob.meta || {} } : null;
    }

    function fitPreview(host) {
        const spec = archiveState.previewSpecs.get(host);
        const stage = host && host.querySelector(".history-view__stage");
        const screen = spec && screenById(spec.screenId);
        if (!host || !stage || !screen) return;
        const scale = Math.max(0.01, Math.min(
            host.clientWidth / screen.width,
            host.clientHeight / screen.height
        ) * 0.99);
        stage.style.setProperty("--history-scale", String(scale));
    }

    async function loadPreview(host) {
        const spec = archiveState.previewSpecs.get(host);
        if (!spec || spec.loading || host.dataset.historyState === "ready") return;
        spec.loading = true;
        const snapshot = await getSnapshot(spec.checkpointId, spec.screenId).catch(() => null);
        spec.loading = false;
        if (!host.isConnected || archiveState.previewSpecs.get(host) !== spec) return;
        if (!snapshot) {
            host.dataset.historyState = "missing";
            host.classList.add("is-missing");
            const placeholder = host.querySelector(".history-view__placeholder");
            if (placeholder) placeholder.textContent = "Sin captura para este rol";
            return;
        }
        const screen = screenById(spec.screenId);
        const stage = document.createElement("div");
        stage.className = "history-view__stage";
        stage.style.setProperty("--screen-width", `${screen.width}px`);
        stage.style.setProperty("--screen-height", `${screen.height}px`);
        const frame = document.createElement("iframe");
        frame.className = "history-view__frame";
        frame.title = `${screen.label} · miniatura histórica`;
        frame.tabIndex = -1;
        frame.setAttribute("sandbox", "allow-same-origin");
        frame.setAttribute("allow", "autoplay 'none'; camera 'none'; microphone 'none'; display-capture 'none'");
        frame.setAttribute("referrerpolicy", "no-referrer");
        frame.srcdoc = snapshot.html;
        stage.appendChild(frame);
        host.querySelector(".history-view__stage")?.remove();
        host.insertBefore(stage, host.firstChild);
        host.dataset.historyState = "ready";
        host.classList.add("has-frame", "is-loaded");
        host.classList.remove("is-missing");
        fitPreview(host);
        frame.addEventListener("load", () => fitPreview(host), { once: true });
    }

    function unloadPreview(host) {
        const spec = archiveState.previewSpecs.get(host);
        if (!spec || host.dataset.historyState !== "ready") return;
        host.querySelector(".history-view__stage")?.remove();
        host.dataset.historyState = "queued";
        host.classList.remove("has-frame", "is-loaded");
    }

    function mountPreview(host, checkpointId, screenId) {
        if (!host || !screenById(screenId)) return;
        const checkpoint = archiveState.store.getCheckpoint(checkpointId);
        const hash = checkpoint && checkpoint.roles ? checkpoint.roles[screenId] : "";
        archiveState.previewSpecs.set(host, { checkpointId, screenId, loading: false });
        if (!hash) {
            host.dataset.historyState = "missing";
            host.classList.add("is-missing");
            const placeholder = host.querySelector(".history-view__placeholder");
            if (placeholder) placeholder.textContent = "Sin captura para este rol";
            return;
        }
        host.dataset.historyState = "queued";
        if (archiveState.previewResizeObserver) archiveState.previewResizeObserver.observe(host);
        if (archiveState.previewObserver) archiveState.previewObserver.observe(host);
        else loadPreview(host);
    }

    async function openSnapshot(checkpointId, screenId, focus) {
        const snapshot = await getSnapshot(checkpointId, screenId);
        const pool = global.ScribDramaturgiaScreenPool;
        if (!snapshot || !pool || typeof pool.openHistoryScreen !== "function") return false;
        return pool.openHistoryScreen({ screenId, html: snapshot.html, focus });
    }

    global.ScribDramaturgiaHistoryController = {
        initialize,
        syncSession,
        receiveEvent,
        receiveCheckpoint,
        captureCheckpoint: enqueueCapture,
        getCheckpoints,
        getSnapshot,
        getStatus,
        mountPreview,
        openSnapshot,
        get revision() {
            return archiveState.revision;
        }
    };
})(window);
