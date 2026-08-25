(function initScribDramaturgiaModel(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ScribDramaturgiaModel = api;
    }
})(typeof window !== "undefined" ? window : globalThis, function createScribDramaturgiaModel() {
    "use strict";

    const MAX_EVENTS_DEFAULT = 240;
    const GRAPH_EVENTS_DEFAULT = 72;
    const TIMELINE_EVENTS_DEFAULT = 120;

    const SPACES = Object.freeze([
        { id: "sistema", label: "Sistema / Control", shortLabel: "Sistema", order: 0, accent: "#ffd166" },
        { id: "escritxr1", label: "Escritxr 1 · Azul", shortLabel: "Escritxr 1", order: 1, accent: "#51e7ff" },
        { id: "escritxr2", label: "Escritxr 2 · Rojo", shortLabel: "Escritxr 2", order: 2, accent: "#ff5964" },
        { id: "musas", label: "Musas / Público", shortLabel: "Musas", order: 3, accent: "#91ffbd" },
        { id: "escena", label: "Escena / Intérpretes", shortLabel: "Escena", order: 4, accent: "#b48cff" }
    ]);

    const SPACE_BY_ID = Object.freeze(SPACES.reduce((acc, space) => {
        acc[space.id] = space;
        return acc;
    }, {}));

    const PHASES = Object.freeze({
        calentamiento: { id: "calentamiento", label: "Calentamiento", accent: "#ff9f43" },
        juego: { id: "juego", label: "Juego", accent: "#5b9dff" },
        representacion: { id: "representacion", label: "Representación", accent: "#9d7cff" },
        espera: { id: "espera", label: "En espera", accent: "#8192a5" }
    });

    const MODE_LABELS = Object.freeze({
        "letra bendita": "Letra bendita",
        "letra prohibida": "Letra maldita",
        "tertulia": "Tertulia",
        "palabras bonus": "Palabras benditas",
        "palabras prohibidas": "Palabras malditas",
        "frase final": "Frase final"
    });

    // Projection used by the historical score. Team variants remain archived,
    // but the score deliberately presents one canonical screen per role.
    const HISTORY_ROLE_ROWS = Object.freeze([
        Object.freeze({ id: "control", label: "Control", screenId: "control", accent: "#ffd166", order: 0 }),
        Object.freeze({ id: "escritxr", label: "Escritxr", screenId: "writer1", accent: "#51e7ff", order: 1 }),
        Object.freeze({ id: "musa", label: "Musa", screenId: "musa1", accent: "#91ffbd", order: 2 }),
        Object.freeze({ id: "espectador", label: "Espectador", screenId: "spectator", accent: "#b48cff", order: 3 }),
        Object.freeze({ id: "interprete", label: "Intérprete", screenId: "actor1", accent: "#51e7ff", order: 4 })
    ]);

    // Expected dramaturgical journey. Warmup detonators and disadvantages keep
    // their short-lived interaction state separate from the stable view that
    // follows it. Dynamic voting and transition columns are inserted by
    // buildShowScore only when a real checkpoint supports them.
    const SHOW_JOURNEY = Object.freeze([
        Object.freeze({
            id: "warmup-lugares-open",
            section: "calentamiento",
            sectionLabel: "Calentamiento",
            kind: "warmup",
            request: "lugares",
            moment: "open",
            label: "Lugares · abierto",
            order: 0
        }),
        Object.freeze({
            id: "warmup-lugares",
            section: "calentamiento",
            sectionLabel: "Calentamiento",
            kind: "warmup",
            request: "lugares",
            moment: "closed",
            label: "Lugares · cerrado",
            order: 1
        }),
        Object.freeze({
            id: "warmup-acciones-open",
            section: "calentamiento",
            sectionLabel: "Calentamiento",
            kind: "warmup",
            request: "acciones",
            moment: "open",
            label: "Acciones · abierto",
            order: 2
        }),
        Object.freeze({
            id: "warmup-acciones",
            section: "calentamiento",
            sectionLabel: "Calentamiento",
            kind: "warmup",
            request: "acciones",
            moment: "closed",
            label: "Acciones · cerrado",
            order: 3
        }),
        Object.freeze({
            id: "warmup-frase-final-open",
            section: "calentamiento",
            sectionLabel: "Calentamiento",
            kind: "warmup",
            request: "frase final",
            moment: "open",
            label: "Frase final · abierto",
            order: 4
        }),
        Object.freeze({
            id: "warmup-frase-final",
            section: "calentamiento",
            sectionLabel: "Calentamiento",
            kind: "warmup",
            request: "frase final",
            moment: "closed",
            label: "Frase final · cerrado",
            order: 5
        }),
        ...[
            ["level-letra-bendita-feedback", "level", "letra bendita", "feedback", "Desventaja inicial"],
            ["level-letra-bendita", "level", "letra bendita", "stable", "Letra bendita"],
            ["competition-letra-bendita", "competition", "letra bendita", "score", "Marcador · Letra bendita"],
            ["level-letra-prohibida-feedback", "level", "letra prohibida", "feedback", "Desventaja inicial"],
            ["level-letra-prohibida", "level", "letra prohibida", "stable", "Letra maldita"],
            ["competition-letra-prohibida", "competition", "letra prohibida", "score", "Marcador · Letra maldita"],
            ["level-tertulia", "level", "tertulia", "stable", "Tertulia"],
            ["level-palabras-bonus-feedback", "level", "palabras bonus", "feedback", "Desventaja inicial"],
            ["level-palabras-bonus", "level", "palabras bonus", "stable", "Palabras benditas"],
            ["competition-palabras-bonus", "competition", "palabras bonus", "score", "Marcador · Palabras benditas"],
            ["level-palabras-prohibidas-feedback", "level", "palabras prohibidas", "feedback", "Desventaja inicial"],
            ["level-palabras-prohibidas", "level", "palabras prohibidas", "stable", "Palabras malditas"],
            ["competition-palabras-prohibidas", "competition", "palabras prohibidas", "score", "Marcador · Palabras malditas"],
            ["level-frase-final", "level", "frase final", "stable", "Frase final"]
        ].map(([id, kind, mode, moment, label], index) => Object.freeze({
            id,
            section: "niveles",
            sectionLabel: "Niveles",
            kind,
            mode,
            moment,
            label,
            order: 6 + index
        })),
        Object.freeze({
            id: "representation-preparation",
            section: "representacion",
            sectionLabel: "Representación",
            kind: "representation",
            moment: "preparation",
            label: "Preparación",
            order: 20
        }),
        Object.freeze({
            id: "representation-projection",
            section: "representacion",
            sectionLabel: "Representación",
            kind: "representation",
            moment: "projection",
            label: "Proyección",
            order: 21
        }),
        Object.freeze({
            id: "representation-final",
            section: "representacion",
            sectionLabel: "Representación",
            kind: "representation",
            moment: "final",
            label: "Final",
            order: 22
        })
    ]);

    function safeText(value, maxLength = 220) {
        const normalized = String(value == null ? "" : value)
            .replace(/\s+/g, " ")
            .trim();
        if (normalized.length <= maxLength) return normalized;
        return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
    }

    function stripHtml(value) {
        const source = String(value == null ? "" : value);
        return safeText(
            source
                .replace(/<style[\s\S]*?<\/style>/gi, " ")
                .replace(/<script[\s\S]*?<\/script>/gi, " ")
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/p>/gi, "\n")
                .replace(/<[^>]+>/g, " ")
                .replace(/&nbsp;|&#160;/gi, " ")
                .replace(/&amp;/gi, "&")
                .replace(/&lt;/gi, "<")
                .replace(/&gt;/gi, ">")
                .replace(/&quot;|&#34;/gi, "\"")
                .replace(/&#39;|&apos;/gi, "'"),
            50000
        );
    }

    function editorPlainText(payload) {
        if (typeof payload === "string") return stripHtml(payload);
        const data = payload && typeof payload === "object" ? payload : {};
        if (typeof data.plano === "string") return safeText(data.plano, 50000);
        if (typeof data.texto_guardado === "string") return stripHtml(data.texto_guardado);
        if (typeof data.text === "string") return stripHtml(data.text);
        return "";
    }

    function integer(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
    }

    function timestamp(value, fallback = Date.now()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
    }

    function normalizeSpace(value, event = {}) {
        const raw = String(value || "").toLowerCase().trim();
        if (SPACE_BY_ID[raw]) return raw;
        const player = integer(
            event.player
            ?? event.equipo
            ?? event.actor?.equipo
            ?? event.source?.team
            ?? event.facts?.player
            ?? event.hechos?.player,
            0
        );
        if (/musa|público|publico|audiencia/.test(raw)) return "musas";
        if (/escena|actor|intérprete|interprete|teleprompter|espectador/.test(raw)) return "escena";
        if (/escrit/.test(raw) && player === 2) return "escritxr2";
        if (/escrit/.test(raw) && player === 1) return "escritxr1";
        if (player === 2 && /texto|escrit/.test(String(event.tipo || event.kind || ""))) return "escritxr2";
        if (player === 1 && /texto|escrit/.test(String(event.tipo || event.kind || ""))) return "escritxr1";
        return "sistema";
    }

    function normalizePhase(value) {
        const raw = String(value || "").toLowerCase().trim();
        if (raw === "representación") return "representacion";
        if (PHASES[raw]) return raw;
        return "espera";
    }

    function phaseFromSnapshot(snapshot = {}) {
        const partida = snapshot.partida && typeof snapshot.partida === "object" ? snapshot.partida : {};
        const tutorialSource = snapshot.tutorial || snapshot.calentamiento;
        const tutorial = tutorialSource && typeof tutorialSource === "object" ? tutorialSource : {};
        const spectatorSource = snapshot.espectador || snapshot.vista_espectador;
        const spectator = spectatorSource && typeof spectatorSource === "object" ? spectatorSource : {};
        const teleprompter = snapshot.teleprompter && typeof snapshot.teleprompter === "object"
            ? snapshot.teleprompter.state || {}
            : {};
        const spectatorMode = String(spectator.modo || "").toLowerCase();
        if (
            partida.fin_del_juego
            || teleprompter.visible
            || /represent|crédit|credit|stats|obra/.test(spectatorMode)
        ) {
            return "representacion";
        }
        if (String(partida.modo_actual || "").trim()) {
            return "juego";
        }
        if (tutorial.activo || tutorial.vista || spectator.calentamiento_vista) {
            return "calentamiento";
        }
        return "espera";
    }

    function phaseLabel(phase) {
        return (PHASES[normalizePhase(phase)] || PHASES.espera).label;
    }

    function modeLabel(mode) {
        const raw = String(mode || "").trim().toLowerCase();
        return MODE_LABELS[raw] || (raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Sin modo");
    }

    function normalizeEvent(input, fallbackSeq = 0) {
        const event = input && typeof input === "object" ? input : {};
        const seq = Math.max(0, integer(event.seq, fallbackSeq));
        const ts = timestamp(event.ts, Date.now());
        const tipo = safeText(event.tipo || event.kind || "estado", 48).toLowerCase() || "estado";
        const espacio = normalizeSpace(event.espacio || event.space || event.source?.space, event);
        const fase = normalizePhase(event.fase || event.phase);
        const causeIdsRaw = event.causa_ids || event.cause_ids || event.causes || [];
        const causaIds = Array.isArray(causeIdsRaw)
            ? [...new Set(causeIdsRaw.map((value) => safeText(value, 120)).filter(Boolean))]
            : [];
        const hechos = event.hechos && typeof event.hechos === "object"
            ? { ...event.hechos }
            : (event.facts && typeof event.facts === "object" ? { ...event.facts } : {});
        const mode = safeText(event.modo || event.mode || hechos.modo || "", 80).toLowerCase();
        const id = safeText(
            event.id || `${safeText(event.session_id || "sesion", 64)}:${seq || ts}`,
            160
        );
        return {
            id,
            seq,
            ts,
            checkpoint_id: safeText(event.checkpoint_id || event.checkpointId || "", 500),
            tipo,
            titulo: safeText(event.titulo || event.title || modeLabel(mode), 92),
            detalle: safeText(event.detalle || event.detail || "", 300),
            espacio,
            fase,
            modo: mode,
            modo_seq: Math.max(0, integer(event.modo_seq ?? event.mode_seq, 0)),
            causa_ids: causaIds,
            hechos
        };
    }

    function createStore(options = {}) {
        return {
            schemaVersion: 1,
            maxEvents: Math.max(20, integer(options.maxEvents, MAX_EVENTS_DEFAULT)),
            sessionId: "",
            sessionStartedAt: 0,
            lastSeq: 0,
            lastSnapshotTs: 0,
            current: {},
            events: [],
            eventIds: new Set(),
            selectedId: "",
            frozenAt: 0
        };
    }

    function resetStoreEvents(store) {
        store.events = [];
        store.eventIds = new Set();
        store.lastSeq = 0;
        store.selectedId = "";
    }

    function insertEvent(store, input) {
        const event = normalizeEvent(input, store.lastSeq + 1);
        if (!event.id || store.eventIds.has(event.id)) return null;
        store.eventIds.add(event.id);
        store.events.push(event);
        store.events.sort((left, right) => {
            if (left.seq && right.seq && left.seq !== right.seq) return left.seq - right.seq;
            if (left.ts !== right.ts) return left.ts - right.ts;
            return left.id.localeCompare(right.id);
        });
        while (store.events.length > store.maxEvents) {
            const removed = store.events.shift();
            if (removed) store.eventIds.delete(removed.id);
        }
        store.lastSeq = Math.max(store.lastSeq, event.seq);
        if (!store.selectedId) store.selectedId = event.id;
        return event;
    }

    function snapshotSession(snapshot = {}) {
        const source = snapshot.session || snapshot.sesion;
        const session = source && typeof source === "object" ? source : {};
        return {
            id: safeText(session.id || session.session_id || session.sesion_id || "", 120),
            startedAt: timestamp(
                session.started_at || session.startedAt || session.inicio_ts || session.iniciada_en,
                0
            ),
            lastSeq: Math.max(0, integer(session.last_seq ?? session.lastSeq, 0))
        };
    }

    function applySnapshot(store, snapshot = {}) {
        if (!store || !snapshot || typeof snapshot !== "object") return [];
        const session = snapshotSession(snapshot);
        if (session.id && store.sessionId && session.id !== store.sessionId) {
            resetStoreEvents(store);
        }
        if (session.id) store.sessionId = session.id;
        if (session.startedAt) store.sessionStartedAt = session.startedAt;
        store.schemaVersion = Math.max(1, integer(snapshot.schema_version ?? snapshot.schemaVersion, 1));
        store.lastSnapshotTs = timestamp(snapshot.ts, Date.now());
        store.frozenAt = 0;
        const previousCurrent = store.current && typeof store.current === "object"
            ? store.current
            : {};
        const incomingCurrent = snapshot.actual && typeof snapshot.actual === "object"
            ? snapshot.actual
            : snapshot;
        store.current = { ...incomingCurrent };
        if (
            !store.current.temporizador
            && previousCurrent.temporizador
            && typeof previousCurrent.temporizador === "object"
        ) {
            store.current.temporizador = previousCurrent.temporizador;
        }
        ["reloj_partida", "competicion_ronda"].forEach((key) => {
            if (!store.current[key] && previousCurrent[key] && typeof previousCurrent[key] === "object") {
                store.current[key] = previousCurrent[key];
            }
        });
        const rawEvents = Array.isArray(snapshot.eventos)
            ? snapshot.eventos
            : (Array.isArray(snapshot.events) ? snapshot.events : []);
        const inserted = rawEvents.map((event) => insertEvent(store, event)).filter(Boolean);
        store.lastSeq = Math.max(store.lastSeq, session.lastSeq);
        if (store.selectedId && !store.eventIds.has(store.selectedId)) {
            store.selectedId = store.events.length ? store.events[store.events.length - 1].id : "";
        }
        return inserted;
    }

    function ensureCurrentObject(store, key) {
        if (!store.current || typeof store.current !== "object") store.current = {};
        if (!store.current[key] || typeof store.current[key] !== "object") store.current[key] = {};
        return store.current[key];
    }

    function applyDelta(store, eventName, payload = {}) {
        if (!store) return;
        const current = store.current || (store.current = {});
        const data = payload && typeof payload === "object" ? payload : {};
        switch (eventName) {
            case "texto1":
            case "texto2": {
                const player = eventName === "texto1" ? 1 : 2;
                const textos = ensureCurrentObject(store, "textos");
                textos[player] = {
                    html: payload,
                    plano: editorPlainText(payload)
                };
                break;
            }
            case "nombre1":
            case "nombre2": {
                const player = eventName === "nombre1" ? 1 : 2;
                const nombres = ensureCurrentObject(store, "nombres");
                nombres[player] = safeText(payload, 80);
                break;
            }
            case "stats_live_estado":
                current.stats = data;
                break;
            case "nube_inspiracion_estado": {
                const inspiration = ensureCurrentObject(store, "inspiracion");
                inspiration.nube = data;
                break;
            }
            case "actualizar_contador_musas": {
                const musas = ensureCurrentObject(store, "musas");
                musas.contador = data;
                break;
            }
            case "competicion_ronda_estado":
                current.competicion_ronda = data;
                break;
            case "competicion_ronda_punto":
                if (data.estado && typeof data.estado === "object") current.competicion_ronda = data.estado;
                break;
            case "competicion_cambio_lider": {
                const competicion = ensureCurrentObject(store, "competicion_ronda");
                competicion.lider = integer(data.lider, 0) || null;
                competicion.desventaja_player = integer(data.desventaja_player, 0) || null;
                competicion.desventaja = safeText(data.desventaja, 20);
                break;
            }
            case "reloj_partida_estado":
                current.reloj_partida = data;
                break;
            case "teleprompter_state": {
                const teleprompter = ensureCurrentObject(store, "teleprompter");
                teleprompter.state = data.state && typeof data.state === "object" ? data.state : data;
                break;
            }
            case "teleprompter_ack": {
                const teleprompter = ensureCurrentObject(store, "teleprompter");
                const ack = teleprompter.ackBySource && typeof teleprompter.ackBySource === "object"
                    ? teleprompter.ackBySource
                    : (teleprompter.ackBySource = {});
                const player = integer(data.source, 0);
                if (player === 1 || player === 2) ack[player] = data;
                break;
            }
            case "vista_espectador_modo":
                current.espectador = data;
                break;
            case "desventaja_activa_estado": {
                const list = Array.isArray(current.desventajas) ? current.desventajas : [];
                const player = integer(data.player, 0);
                const kind = safeText(data.putada || data.tipo || data.id || "", 80);
                current.desventajas = list
                    .filter((item) => integer(item.player, 0) !== player || safeText(item.putada || item.tipo || item.id || "", 80) !== kind)
                    .concat([data]);
                break;
            }
            case "count": {
                const counts = ensureCurrentObject(store, "conteos");
                const player = integer(data.player, 0);
                if (player === 1 || player === 2) counts[player] = data;
                break;
            }
            case "modo_actual":
            case "activar_modo":
            case "temp_modos": {
                const partida = ensureCurrentObject(store, "partida");
                const mode = typeof payload === "string" ? payload : data.modo_actual;
                if (mode !== undefined) partida.modo_actual = mode;
                if (data.modo_seq !== undefined) partida.modo_seq = data.modo_seq;
                if (eventName === "temp_modos") {
                    current.temporizador = {
                        ...data,
                        recibido_en_ts: Date.now()
                    };
                }
                break;
            }
            case "estado_banderas_musas": {
                const musas = ensureCurrentObject(store, "musas");
                musas.banderas = data;
                break;
            }
            case "musa_regalo_bandera_estado": {
                const musas = ensureCurrentObject(store, "musas");
                musas.regalo_bandera = data;
                break;
            }
            case "feedback_musas_estado": {
                const musas = ensureCurrentObject(store, "musas");
                musas.feedback = data;
                break;
            }
            case "calentamiento_estado_espectador":
            case "calentamiento_estado": {
                current.tutorial = data;
                break;
            }
            case "creditos_estado":
                current.creditos = data;
                break;
            case "fin": {
                const partida = ensureCurrentObject(store, "partida");
                partida.fin_del_juego = true;
                break;
            }
            case "inicio": {
                const partida = ensureCurrentObject(store, "partida");
                partida.fin_del_juego = false;
                break;
            }
            case "limpiar":
                current.partida = {
                    ...(current.partida && typeof current.partida === "object" ? current.partida : {}),
                    modo_actual: "",
                    fin_del_juego: false
                };
                break;
            default:
                break;
        }
        current.ts = timestamp(data.ts, Date.now());
        store.lastSnapshotTs = current.ts;
    }

    function visibleEvents(store, options = {}) {
        const filter = safeText(options.filter || "todos", 24).toLowerCase() || "todos";
        const phase = safeText(options.phase || "todas", 24).toLowerCase() || "todas";
        const limit = Math.max(1, integer(options.limit, TIMELINE_EVENTS_DEFAULT));
        const filtered = store.events.filter((event) => (
            (filter === "todos" || event.espacio === filter)
            && (phase === "todas" || event.fase === phase)
        ));
        return filtered.slice(-limit);
    }

    function causalParents(event, eventIds) {
        return event.causa_ids.filter((id) => eventIds.has(id));
    }

    function buildGraphLayout(events, options = {}) {
        const nodeWidth = Math.max(170, integer(options.nodeWidth, 220));
        const nodeHeight = Math.max(92, integer(options.nodeHeight, 118));
        const xGap = Math.max(32, integer(options.xGap, 58));
        const laneHeight = Math.max(nodeHeight + 24, integer(options.laneHeight, 164));
        const padX = Math.max(20, integer(options.padX, 44));
        const padY = Math.max(20, integer(options.padY, 34));
        const depthById = new Map();
        const lastDepthByLane = new Map();
        const eventIds = new Set(events.map((event) => event.id));
        let maxDepth = 0;

        const nodes = events.map((event, index) => {
            const parents = causalParents(event, eventIds);
            const parentDepth = parents.reduce((max, id) => Math.max(max, depthById.get(id) ?? -1), -1);
            const chronologyFloor = Math.floor(index / Math.max(4, integer(options.eventsPerLayer, 6)));
            const laneIndex = SPACE_BY_ID[event.espacio]?.order ?? 0;
            const laneFloor = (lastDepthByLane.get(laneIndex) ?? -1) + 1;
            const depth = Math.max(parentDepth + 1, chronologyFloor, laneFloor);
            depthById.set(event.id, depth);
            lastDepthByLane.set(laneIndex, depth);
            maxDepth = Math.max(maxDepth, depth);
            return {
                id: event.id,
                event,
                depth,
                x: padX + depth * (nodeWidth + xGap),
                y: padY + laneIndex * laneHeight,
                width: nodeWidth,
                height: nodeHeight
            };
        });

        const nodeById = new Map(nodes.map((node) => [node.id, node]));
        const edges = [];
        events.forEach((event) => {
            const to = nodeById.get(event.id);
            if (!to) return;
            causalParents(event, eventIds).forEach((parentId) => {
                const from = nodeById.get(parentId);
                if (!from) return;
                const x1 = from.x + from.width;
                const y1 = from.y + from.height / 2;
                const x2 = to.x;
                const y2 = to.y + to.height / 2;
                const curve = Math.max(30, Math.abs(x2 - x1) * 0.42);
                edges.push({
                    id: `${parentId}->${event.id}`,
                    from: parentId,
                    to: event.id,
                    path: `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`
                });
            });
        });

        const width = Math.max(
            integer(options.minWidth, 980),
            padX * 2 + (maxDepth + 1) * nodeWidth + maxDepth * xGap
        );
        const widthWithOverflow = Math.max(width, ...nodes.map((node) => node.x + node.width + padX));
        const height = padY * 2 + (SPACES.length - 1) * laneHeight + nodeHeight + 80;
        return { nodes, edges, width: widthWithOverflow, height };
    }

    function journeyKey(value) {
        return String(value == null ? "" : value)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function journeyMode(value) {
        const normalized = journeyKey(value);
        if (normalized === "palabras benditas" || normalized === "palabra bonus") {
            return "palabras bonus";
        }
        return normalized;
    }

    function checkpointEvents(checkpoint) {
        return Array.isArray(checkpoint && checkpoint.events)
            ? checkpoint.events.filter((event) => event && typeof event === "object")
            : [];
    }

    function eventFacts(event) {
        if (event && event.hechos && typeof event.hechos === "object") return event.hechos;
        if (event && event.facts && typeof event.facts === "object") return event.facts;
        return {};
    }

    function checkpointDescriptor(checkpoint) {
        const events = checkpointEvents(checkpoint);
        const phases = new Set();
        const modes = new Set();
        const requests = new Set();

        [
            checkpoint && checkpoint.primaryPhase,
            checkpoint && checkpoint.phase,
            checkpoint && checkpoint.stage && checkpoint.stage.phase
        ].forEach((value) => {
            const normalized = journeyKey(value);
            if (normalized) phases.add(normalized === "representación" ? "representacion" : normalized);
        });
        [
            checkpoint && checkpoint.primaryMode,
            checkpoint && checkpoint.mode,
            checkpoint && checkpoint.stage && checkpoint.stage.mode
        ].forEach((value) => {
            const normalized = journeyMode(value);
            if (normalized) modes.add(normalized);
        });

        events.forEach((event) => {
            const facts = eventFacts(event);
            const phase = journeyKey(event.fase || event.phase || facts.fase || facts.phase);
            if (phase) phases.add(phase);
            [event.modo, event.mode, facts.modo, facts.mode].forEach((value) => {
                const normalized = journeyMode(value);
                if (normalized) modes.add(normalized);
            });
            [event.solicitud, event.request, facts.solicitud, facts.request].forEach((value) => {
                const normalized = journeyKey(value);
                if (normalized) requests.add(normalized);
            });
        });
        return { checkpoint, events, phases, modes, requests };
    }

    function descriptorHasPhase(descriptor, phase) {
        const expected = journeyKey(phase);
        return descriptor.phases.has(expected);
    }

    function explicitModeEvent(descriptor, mode) {
        const expected = journeyMode(mode);
        return descriptor.events.some((event) => {
            if (journeyKey(event.tipo || event.kind) !== "modo") return false;
            const facts = eventFacts(event);
            return [event.modo, event.mode, facts.modo, facts.mode]
                .some((value) => journeyMode(value) === expected);
        });
    }

    function warmupRequestMatches(requests, expected) {
        const target = journeyKey(expected);
        return [...requests].some((request) => {
            if (target === "lugares") return /(?:^|\s)lugares?(?:\s|$)/.test(request);
            if (target === "acciones") return /(?:^|\s)acciones?(?:\s|$)/.test(request);
            return request.includes("frase final");
        });
    }

    function warmupMoment(descriptor, expected) {
        const event = [...descriptor.events].reverse().find((candidate) => {
            if (journeyKey(candidate.tipo || candidate.kind) !== "calentamiento") return false;
            const facts = eventFacts(candidate);
            return warmupRequestMatches(new Set([
                candidate.solicitud,
                candidate.request,
                facts.solicitud,
                facts.request
            ].map(journeyKey).filter(Boolean)), expected);
        });
        if (!event) return "";
        const teams = eventFacts(event).equipos;
        if (!teams || typeof teams !== "object") return "unknown";
        const entries = [1, 2].map((player) => teams[player] || teams[String(player)] || {});
        const closed = entries.every((team) => Boolean(team.bloqueado && team.final));
        if (closed) return "closed";
        const open = entries.every((team) => (
            Number(team.aciertos) > 0
            && !team.bloqueado
            && !team.final
        ));
        return open ? "open" : "other";
    }

    function activeDisadvantage(descriptor) {
        for (const event of descriptor.events) {
            if (journeyKey(event.tipo || event.kind) !== "desventaja") continue;
            const facts = eventFacts(event);
            const active = Array.isArray(facts.activas) ? facts.activas : [];
            const item = active.find((candidate) => {
                const player = Number(candidate && candidate.player);
                return player === 1 || player === 2;
            });
            if (item) return item;
        }
        return null;
    }

    function representationSignals(descriptor) {
        const output = {
            phaseTransition: false,
            teleprompterReady: false,
            teleprompterPlaying: false,
            teleprompterHidden: false,
            publicProjection: false,
            final: false
        };
        descriptor.events.forEach((event) => {
            const type = journeyKey(event.tipo || event.kind);
            const facts = eventFacts(event);
            const title = journeyKey(event.titulo || event.title);
            const detail = journeyKey(event.detalle || event.detail);
            const phase = journeyKey(event.fase || event.phase || facts.fase || facts.phase);
            const viewMode = journeyKey(
                facts.modo || facts.mode || facts.vista || facts.view || event.vista || event.view
            );
            const visible = Boolean(facts.visible);
            const playing = Boolean(facts.reproduciendo ?? facts.playing);

            if (type === "fase" && phase === "representacion") output.phaseTransition = true;
            if (type === "teleprompter") {
                if (visible && playing) output.teleprompterPlaying = true;
                else if (visible) output.teleprompterReady = true;
                else output.teleprompterHidden = true;
            }
            if (
                type === "vista espectador"
                || type === "vista_espectador"
                || type === "proyeccion"
            ) {
                if (/credit|stats|final|cierre/.test(viewMode)) output.final = true;
                else if (/represent|obra|proyec|teleprompter|partida/.test(viewMode)) {
                    output.publicProjection = true;
                }
            }
            if (
                /^(?:fin|final|creditos|credito|cierre)$/.test(type)
                || /creditos|cierre de la obra|representacion final/.test(`${title} ${detail}`)
                || facts.final === true
                || facts.finished === true
            ) {
                output.final = true;
            }
        });
        return output;
    }

    function milestoneScore(milestone, descriptor) {
        if (milestone.kind === "warmup") {
            if (!warmupRequestMatches(descriptor.requests, milestone.request)) return 0;
            const warmupEvent = descriptor.events.some((event) => (
                journeyKey(event.tipo || event.kind) === "calentamiento"
            ));
            const moment = warmupMoment(descriptor, milestone.request);
            if (milestone.moment === "open" && moment !== "open") return 0;
            if (
                milestone.moment === "closed"
                && moment !== "closed"
                && moment !== "unknown"
            ) return 0;
            return 130 + (warmupEvent ? 35 : 0)
                + (moment === milestone.moment ? 120 : 0)
                + (descriptorHasPhase(descriptor, "calentamiento") ? 10 : 0);
        }
        if (milestone.kind === "level") {
            const expected = journeyMode(milestone.mode);
            if (!descriptor.modes.has(expected)) return 0;
            const disadvantage = activeDisadvantage(descriptor);
            if (milestone.moment === "feedback") {
                return disadvantage
                    ? 280 + (descriptorHasPhase(descriptor, "juego") ? 10 : 0)
                    : 0;
            }
            if (descriptor.voting || disadvantage) return 0;
            return 100 + (explicitModeEvent(descriptor, expected) ? 100 : 0)
                + (descriptorHasPhase(descriptor, "juego") ? 10 : 0);
        }
        if (milestone.kind === "competition") {
            const expected = journeyMode(milestone.mode);
            const scoreEvent = descriptor.events.find((event) => {
                const type = journeyKey(event.tipo || event.kind);
                const facts = eventFacts(event);
                return type === "competicion ronda"
                    && journeyMode(event.modo || event.mode || facts.modo || facts.mode) === expected;
            });
            if (!scoreEvent) return 0;
            const facts = eventFacts(scoreEvent);
            return facts.activa === false ? 120 : 230;
        }
        if (milestone.kind === "voting") {
            const voting = descriptor.voting || votingCheckpoint(descriptor.checkpoint);
            if (!voting) return 0;
            if (descriptor.votingSupplemental) return 0;
            const expectedContexts = [milestone.afterMode, milestone.operationalAfterMode]
                .map(journeyMode)
                .filter(Boolean);
            if (descriptor.modes.size) {
                const contextual = expectedContexts.some((mode) => descriptor.modes.has(mode));
                if (!contextual) return 0;
            }
            // Prefer the moment the voting UI opens. A closing checkpoint still
            // fills the expected column when no opening snapshot was captured.
            return voting.moment === "vote" ? 240 : 150;
        }
        if (milestone.kind === "representation") {
            const signals = representationSignals(descriptor);
            const inRepresentation = descriptorHasPhase(descriptor, "representacion");
            if (milestone.moment === "preparation") {
                if (signals.phaseTransition) return 220;
                if (signals.teleprompterReady) return 185;
                return inRepresentation ? 35 : 0;
            }
            if (milestone.moment === "projection") {
                if (signals.teleprompterPlaying) return 220;
                if (signals.publicProjection) return 190;
                return 0;
            }
            if (signals.final) return 220;
            if (signals.teleprompterHidden && inRepresentation) return 110;
        }
        return 0;
    }

    function checkpointOrderValue(checkpoint, field, fallback) {
        const parsed = Number(checkpoint && checkpoint[field]);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
    }

    function orderCheckpoints(checkpoints) {
        const entries = (Array.isArray(checkpoints) ? checkpoints : [])
            .filter((checkpoint) => checkpoint && typeof checkpoint === "object")
            .map((checkpoint, inputIndex) => ({ checkpoint, inputIndex }));
        entries.sort((left, right) => {
            const leftSeq = checkpointOrderValue(
                left.checkpoint,
                "seqEnd",
                checkpointOrderValue(left.checkpoint, "seq", Number.MAX_SAFE_INTEGER)
            );
            const rightSeq = checkpointOrderValue(
                right.checkpoint,
                "seqEnd",
                checkpointOrderValue(right.checkpoint, "seq", Number.MAX_SAFE_INTEGER)
            );
            if (leftSeq !== rightSeq) return leftSeq - rightSeq;
            const leftTs = checkpointOrderValue(
                left.checkpoint,
                "ts",
                checkpointOrderValue(left.checkpoint, "capturedAt", Number.MAX_SAFE_INTEGER)
            );
            const rightTs = checkpointOrderValue(
                right.checkpoint,
                "ts",
                checkpointOrderValue(right.checkpoint, "capturedAt", Number.MAX_SAFE_INTEGER)
            );
            if (leftTs !== rightTs) return leftTs - rightTs;
            return left.inputIndex - right.inputIndex;
        });

        const entryById = new Map();
        const rankByEntry = new Map();
        entries.forEach((entry, index) => {
            const id = safeText(entry.checkpoint.id, 500);
            if (id && !entryById.has(id)) entryById.set(id, entry);
            rankByEntry.set(entry, index);
        });
        const children = new Map(entries.map((entry) => [entry, []]));
        const indegree = new Map(entries.map((entry) => [entry, 0]));
        entries.forEach((entry) => {
            const parentIds = Array.isArray(entry.checkpoint.previousCheckpointIds)
                ? entry.checkpoint.previousCheckpointIds
                : [];
            [...new Set(parentIds.map((id) => safeText(id, 500)).filter(Boolean))].forEach((id) => {
                const parent = entryById.get(id);
                if (!parent || parent === entry) return;
                children.get(parent).push(entry);
                indegree.set(entry, indegree.get(entry) + 1);
            });
        });
        const queue = entries.filter((entry) => indegree.get(entry) === 0);
        queue.sort((left, right) => rankByEntry.get(left) - rankByEntry.get(right));
        const ordered = [];
        while (queue.length) {
            const entry = queue.shift();
            ordered.push(entry);
            children.get(entry).forEach((child) => {
                indegree.set(child, indegree.get(child) - 1);
                if (indegree.get(child) === 0) {
                    queue.push(child);
                    queue.sort((left, right) => rankByEntry.get(left) - rankByEntry.get(right));
                }
            });
        }
        if (ordered.length !== entries.length) {
            entries.forEach((entry) => {
                if (!ordered.includes(entry)) ordered.push(entry);
            });
        }
        return ordered.map((entry) => entry.checkpoint);
    }

    // Sequence alignment selects at most one real checkpoint for every expected
    // milestone while preserving both the canonical journey and causal chronology.
    function assignMilestones(descriptors, milestones = SHOW_JOURNEY) {
        const rowCount = milestones.length + 1;
        const columnCount = descriptors.length + 1;
        const scores = Array.from({ length: rowCount }, () => Array(columnCount).fill(0));
        const steps = Array.from({ length: rowCount }, () => Array(columnCount).fill(""));
        for (let journeyIndex = 1; journeyIndex < rowCount; journeyIndex += 1) {
            steps[journeyIndex][0] = "pending";
        }
        for (let checkpointIndex = 1; checkpointIndex < columnCount; checkpointIndex += 1) {
            steps[0][checkpointIndex] = "skip";
        }
        for (let journeyIndex = 1; journeyIndex < rowCount; journeyIndex += 1) {
            for (let checkpointIndex = 1; checkpointIndex < columnCount; checkpointIndex += 1) {
                let best = scores[journeyIndex - 1][checkpointIndex];
                let step = "pending";
                if (scores[journeyIndex][checkpointIndex - 1] > best) {
                    best = scores[journeyIndex][checkpointIndex - 1];
                    step = "skip";
                }
                const match = milestoneScore(
                    milestones[journeyIndex - 1],
                    descriptors[checkpointIndex - 1]
                );
                const matchedScore = scores[journeyIndex - 1][checkpointIndex - 1] + match;
                if (match > 0 && matchedScore > best) {
                    best = matchedScore;
                    step = "match";
                }
                scores[journeyIndex][checkpointIndex] = best;
                steps[journeyIndex][checkpointIndex] = step;
            }
        }

        const assignments = Array(milestones.length).fill(null);
        let journeyIndex = milestones.length;
        let checkpointIndex = descriptors.length;
        while (journeyIndex > 0 || checkpointIndex > 0) {
            const step = steps[journeyIndex][checkpointIndex];
            if (step === "match") {
                assignments[journeyIndex - 1] = descriptors[checkpointIndex - 1].checkpoint;
                journeyIndex -= 1;
                checkpointIndex -= 1;
            } else if (step === "skip" && checkpointIndex > 0) {
                checkpointIndex -= 1;
            } else if (journeyIndex > 0) {
                journeyIndex -= 1;
            } else {
                checkpointIndex -= 1;
            }
        }
        return assignments;
    }

    function checkpointStatus(checkpoint) {
        if (!checkpoint) return { status: "pending", missingScreenIds: HISTORY_ROLE_ROWS.map((row) => row.screenId) };
        const roles = checkpoint.roles && typeof checkpoint.roles === "object" ? checkpoint.roles : null;
        const missingScreenIds = roles
            ? HISTORY_ROLE_ROWS.map((row) => row.screenId).filter((screenId) => !roles[screenId])
            : [];
        return {
            status: checkpoint.complete === false || missingScreenIds.length ? "partial" : "ready",
            missingScreenIds
        };
    }

    function votingCheckpoint(checkpoint) {
        const events = checkpointEvents(checkpoint);
        const voteEvents = events.filter((event) => {
            const type = journeyKey(event.tipo || event.kind);
            const title = journeyKey(event.titulo || event.title);
            return type === "votacion" || type === "votacion musa" || title.includes("votacion");
        });
        if (!voteEvents.length) return null;
        const hasOpening = voteEvents.some((event) => {
            const facts = eventFacts(event);
            const title = journeyKey(event.titulo || event.title);
            return facts.activa === true || /inici|abiert|apertur/.test(title);
        });
        const hasClosing = voteEvents.some((event) => {
            const facts = eventFacts(event);
            const title = journeyKey(event.titulo || event.title);
            return facts.activa === false || /final|result|cerrad/.test(title);
        });
        return {
            label: hasClosing && !hasOpening ? "Resultado de votación" : "Votación de Musa",
            moment: hasOpening || !hasClosing ? "vote" : "result",
            hasOpening,
            hasClosing
        };
    }

    function annotateVotingEpisodes(descriptors) {
        let openVoting = false;
        descriptors.forEach((descriptor) => {
            const info = votingCheckpoint(descriptor.checkpoint);
            descriptor.voting = info;
            descriptor.votingSupplemental = false;
            if (!info) return;
            if (info.hasOpening) {
                openVoting = !info.hasClosing;
                return;
            }
            if (info.hasClosing && openVoting) {
                descriptor.votingSupplemental = true;
                openVoting = false;
            }
        });
    }

    function transitionCheckpoint(checkpoint) {
        const events = checkpointEvents(checkpoint);
        const event = events.find((candidate) => {
            const type = journeyKey(candidate.tipo || candidate.kind);
            return [
                "sesion", "fase", "modo", "inicio", "fin", "transicion",
                "calentamiento", "teleprompter", "vista espectador"
            ].includes(type);
        });
        if (!event) return null;
        const type = journeyKey(event.tipo || event.kind);
        const facts = eventFacts(event);
        const phase = journeyKey(event.fase || event.phase || facts.fase || facts.phase);
        const mode = journeyMode(event.modo || event.mode || facts.modo || facts.mode);
        if (type === "modo") {
            return { label: mode ? `Transición · ${modeLabel(mode)}` : "Cierre de nivel" };
        }
        if (type === "calentamiento" || phase === "calentamiento") {
            return { label: "Transición de calentamiento" };
        }
        if (phase === "representacion" || type === "teleprompter" || type === "vista espectador") {
            return { label: "Transición de representación" };
        }
        if (phase === "juego") return { label: "Entrada en juego" };
        return { label: "Transición del show" };
    }

    function makeExpectedColumn(milestone, checkpoint) {
        const state = checkpointStatus(checkpoint);
        return {
            ...milestone,
            expected: true,
            checkpoint: checkpoint || null,
            status: state.status,
            missingScreenIds: state.missingScreenIds
        };
    }

    function attachVotingCheckpoints(expectedColumns, orderedCheckpoints) {
        const order = new Map(orderedCheckpoints.map((checkpoint, index) => [checkpoint, index]));
        const votingColumns = expectedColumns.filter((column) => column.kind === "voting");
        const primary = new Set();
        votingColumns.forEach((column) => {
            const info = column.checkpoint ? votingCheckpoint(column.checkpoint) : null;
            if (column.checkpoint) primary.add(column.checkpoint);
            column.openingCheckpoint = info && info.hasOpening ? column.checkpoint : null;
            column.closingCheckpoint = info && info.hasClosing ? column.checkpoint : null;
        });

        orderedCheckpoints.forEach((checkpoint) => {
            if (primary.has(checkpoint)) return;
            const info = votingCheckpoint(checkpoint);
            if (!info) return;
            const checkpointIndex = order.get(checkpoint);
            if (info.hasClosing) {
                const owner = [...votingColumns].reverse().find((column) => (
                    column.checkpoint
                    && order.get(column.checkpoint) <= checkpointIndex
                    && !column.closingCheckpoint
                ));
                if (owner) owner.closingCheckpoint = checkpoint;
            }
            if (info.hasOpening) {
                const owner = votingColumns.find((column) => (
                    column.checkpoint
                    && checkpointIndex <= order.get(column.checkpoint)
                    && !column.openingCheckpoint
                ));
                if (owner) owner.openingCheckpoint = checkpoint;
            }
        });
        votingColumns.forEach((column) => {
            column.relatedCheckpoints = [...new Set([
                column.openingCheckpoint,
                column.closingCheckpoint
            ].filter(Boolean))];
        });
    }

    function makeExtraColumn(checkpoint, type, metadata) {
        const state = checkpointStatus(checkpoint);
        return {
            id: `${type}:${safeText(checkpoint.id, 500) || checkpointOrderValue(checkpoint, "ts", 0)}`,
            section: type === "voting" ? "niveles" : "transiciones",
            sectionLabel: type === "voting" ? "Niveles" : "Transición",
            kind: type,
            label: metadata.label,
            moment: metadata.moment || "transition",
            expected: false,
            checkpoint,
            status: state.status,
            missingScreenIds: state.missingScreenIds
        };
    }

    /**
     * Projects real checkpoint HTML onto the complete expected show score. Missing
     * moments remain explicit pending columns; no current or synthetic checkpoint
     * is ever substituted. Voting uses expected columns, while unmatched
     * transitions remain real, explicitly marked extras.
     */
    function buildShowScore(checkpoints) {
        const orderedCheckpoints = orderCheckpoints(checkpoints);
        const descriptors = orderedCheckpoints.map(checkpointDescriptor);
        annotateVotingEpisodes(descriptors);
        const regularMilestones = SHOW_JOURNEY.filter((milestone) => milestone.kind !== "voting");
        const votingMilestones = SHOW_JOURNEY.filter((milestone) => milestone.kind === "voting");
        const regularAssignments = assignMilestones(descriptors, regularMilestones);
        const votingDescriptors = descriptors.filter((descriptor) => (
            descriptor.voting && !descriptor.votingSupplemental
        ));
        const votingAssignments = assignMilestones(votingDescriptors, votingMilestones);
        const assignmentByMilestone = new Map();
        regularMilestones.forEach((milestone, index) => {
            assignmentByMilestone.set(milestone.id, regularAssignments[index]);
        });
        votingMilestones.forEach((milestone, index) => {
            assignmentByMilestone.set(milestone.id, votingAssignments[index]);
        });
        const assignments = SHOW_JOURNEY.map((milestone) => (
            assignmentByMilestone.get(milestone.id) || null
        ));
        const expectedColumns = SHOW_JOURNEY.map((milestone, index) => (
            makeExpectedColumn(milestone, assignments[index])
        ));
        attachVotingCheckpoints(expectedColumns, orderedCheckpoints);
        const orderedIndex = new Map(orderedCheckpoints.map((checkpoint, index) => [checkpoint, index]));
        const assigned = new Set(assignments.filter(Boolean));
        const extras = [];

        orderedCheckpoints.forEach((checkpoint) => {
            const vote = votingCheckpoint(checkpoint);
            if (vote) return;
            if (assigned.has(checkpoint)) return;
            const transition = transitionCheckpoint(checkpoint);
            if (transition) {
                extras.push({
                    checkpoint,
                    column: makeExtraColumn(checkpoint, "transition", transition)
                });
            }
        });

        // A captured vote floats to its real chronological point. Its pending
        // placeholder, when no checkpoint exists, remains in SHOW_JOURNEY order.
        const floating = expectedColumns
            .filter((column) => column.kind === "voting" && column.checkpoint)
            .map((column) => ({ checkpoint: column.checkpoint, column, priority: 0 }))
            .concat(extras.map((extra) => ({ ...extra, priority: 1 })));
        const anchoredColumns = expectedColumns.filter((column) => !(
            column.kind === "voting" && column.checkpoint
        ));
        const floatingBySlot = Array.from({ length: anchoredColumns.length + 1 }, () => []);
        floating.forEach((item) => {
            const itemIndex = orderedIndex.get(item.checkpoint);
            let slot = 0;
            let foundTemporalAnchor = false;
            anchoredColumns.forEach((column, anchorIndex) => {
                if (
                    column.checkpoint
                    && orderedIndex.get(column.checkpoint) <= itemIndex
                ) {
                    slot = anchorIndex + 1;
                    foundTemporalAnchor = true;
                }
            });
            if (!foundTemporalAnchor && item.column.expected) {
                slot = anchoredColumns.filter((column) => column.order < item.column.order).length;
            }
            floatingBySlot[slot].push(item);
        });
        floatingBySlot.forEach((slot) => slot.sort((left, right) => {
            const order = orderedIndex.get(left.checkpoint) - orderedIndex.get(right.checkpoint);
            return order || left.priority - right.priority;
        }));

        const columns = floatingBySlot[0].map((item) => item.column);
        anchoredColumns.forEach((column, index) => {
            columns.push(column);
            floatingBySlot[index + 1].forEach((item) => columns.push(item.column));
        });
        const captured = expectedColumns.filter((column) => column.checkpoint).length;
        const partial = expectedColumns.filter((column) => column.status === "partial").length;
        const pending = expectedColumns.length - captured;
        const represented = new Set(columns.flatMap((column) => [
            column.checkpoint,
            ...(Array.isArray(column.relatedCheckpoints) ? column.relatedCheckpoints : [])
        ]).filter(Boolean));

        return {
            rows: HISTORY_ROLE_ROWS,
            journey: SHOW_JOURNEY,
            columns,
            expectedColumns,
            unplacedCheckpoints: orderedCheckpoints.filter((checkpoint) => !represented.has(checkpoint)),
            coverage: {
                expected: SHOW_JOURNEY.length,
                captured,
                ready: captured - partial,
                partial,
                pending,
                complete: pending === 0 && partial === 0
            }
        };
    }

    function currentWriter(snapshot = {}, player) {
        const id = player === 2 ? 2 : 1;
        const textos = snapshot.textos && typeof snapshot.textos === "object" ? snapshot.textos : {};
        const rawText = textos[id] || textos[String(id)] || {};
        const stats = snapshot.stats || snapshot.estadisticas;
        const statsPlayers = stats && stats.players && typeof stats.players === "object"
            ? stats.players
            : {};
        const rawStats = statsPlayers[id] || statsPlayers[String(id)] || {};
        const names = snapshot.nombres && typeof snapshot.nombres === "object" ? snapshot.nombres : {};
        const museCount = snapshot.musas && snapshot.musas.contador && typeof snapshot.musas.contador === "object"
            ? snapshot.musas.contador[`escritxr${id}`] ?? snapshot.musas.contador[id] ?? 0
            : 0;
        const plain = typeof rawText.plano === "string"
            ? safeText(rawText.plano, 50000)
            : editorPlainText(rawText.html ?? rawText);
        return {
            id,
            nombre: safeText(
                names[id] || names[String(id)] || rawStats.nombre || `ESCRITXR ${id}`,
                80
            ),
            texto: plain,
            palabras: Math.max(0, integer(rawStats.palabrasTotal, plain ? plain.split(/\s+/).filter(Boolean).length : 0)),
            ritmo: Math.max(0, Number(rawStats.ritmoPpm) || 0),
            pulsaciones: Math.max(0, integer(rawStats.pulsacionesTotal, 0)),
            musas: Math.max(0, integer(museCount, 0))
        };
    }

    function currentSummary(snapshot = {}) {
        const partida = snapshot.partida && typeof snapshot.partida === "object" ? snapshot.partida : {};
        const timer = snapshot.reloj_partida && typeof snapshot.reloj_partida === "object"
            ? snapshot.reloj_partida
            : (snapshot.temporizador && typeof snapshot.temporizador === "object" ? snapshot.temporizador : {});
        const competition = snapshot.competicion_ronda && typeof snapshot.competicion_ronda === "object"
            ? snapshot.competicion_ronda
            : {};
        const teleprompter = snapshot.teleprompter && typeof snapshot.teleprompter === "object"
            ? snapshot.teleprompter.state || {}
            : {};
        const spectatorSource = snapshot.espectador || snapshot.vista_espectador;
        const spectator = spectatorSource && typeof spectatorSource === "object" ? spectatorSource : {};
        const phase = phaseFromSnapshot(snapshot);
        const remainingAtReceipt = Math.max(0, integer(
            timer.tiempo_restante_segundos
            ?? timer.tiempo_restante_modo_segundos
            ?? timer.segundos_restantes
            ?? timer.remaining_seconds,
            0
        ));
        const timerReference = timestamp(timer.now || timer.recibido_en_ts || timer.ts, 0);
        const elapsedSinceTimer = timerReference
            ? Math.max(0, Math.floor((Date.now() - timerReference) / 1000))
            : 0;
        return {
            phase,
            phaseLabel: phaseLabel(phase),
            mode: safeText(partida.modo_actual || "", 80),
            modeLabel: modeLabel(partida.modo_actual || ""),
            modeSeq: Math.max(0, integer(partida.modo_seq, 0)),
            remainingSeconds: Math.max(0, remainingAtReceipt - elapsedSinceTimer),
            finished: Boolean(partida.fin_del_juego),
            spectatorMode: safeText(spectator.modo || "", 80),
            teleprompterVisible: Boolean(teleprompter.visible),
            teleprompterSource: integer(teleprompter.source, 0),
            voteActive: false,
            score: {
                1: Number(competition.marcador && competition.marcador[1]) || 0,
                2: Number(competition.marcador && competition.marcador[2]) || 0
            },
            leader: integer(competition.lider, 0) || null,
            disadvantagePlayer: integer(competition.desventaja_player, 0) || null,
            disadvantage: safeText(competition.desventaja, 20),
            writer1: currentWriter(snapshot, 1),
            writer2: currentWriter(snapshot, 2)
        };
    }

    function formatClock(ts) {
        const date = new Date(timestamp(ts, Date.now()));
        return date.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    function formatElapsed(ts, startedAt) {
        const elapsed = Math.max(0, timestamp(ts, 0) - timestamp(startedAt, 0));
        const totalSeconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return {
        GRAPH_EVENTS_DEFAULT,
        HISTORY_ROLE_ROWS,
        MAX_EVENTS_DEFAULT,
        MODE_LABELS,
        PHASES,
        SHOW_JOURNEY,
        SPACES,
        SPACE_BY_ID,
        TIMELINE_EVENTS_DEFAULT,
        applyDelta,
        applySnapshot,
        buildGraphLayout,
        buildShowScore,
        createStore,
        currentSummary,
        currentWriter,
        editorPlainText,
        formatClock,
        formatElapsed,
        insertEvent,
        modeLabel,
        normalizeEvent,
        phaseFromSnapshot,
        phaseLabel,
        safeText,
        stripHtml,
        visibleEvents
    };
});
