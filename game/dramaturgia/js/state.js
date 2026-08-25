// Estado y render del observatorio. El socket se abre al final de index.js,
// después de registrar todos los listeners.
const dramaturgiaServerUrl = window.isProduction
    ? window.SERVER_URL_PROD
    : window.SERVER_URL_DEV;

const dramaturgiaSocket = window.io
    ? window.io(dramaturgiaServerUrl, { autoConnect: false })
    : null;

const dramaturgiaModel = window.ScribDramaturgiaModel;
const dramaturgiaStore = dramaturgiaModel.createStore({ maxEvents: 240 });
const DRAMATURGIA_UI_VERSION = "dramaturgia-competition-clock-v11";
const DRAMATURGIA_ZOOM_MIN = 0.35;
const DRAMATURGIA_ZOOM_MAX = 1.8;
const DRAMATURGIA_SCORE_COLUMN_WIDTH = 190;
const DRAMATURGIA_SCORE_ROW_HEIGHT = 116;
const DRAMATURGIA_LEVEL_VISUALS = Object.freeze({
    "letra bendita": Object.freeze({ emoji: "🙏", accent: "#6bff83" }),
    "letra prohibida": Object.freeze({ emoji: "😈", accent: "#ff8fa0", label: "Letra maldita" }),
    tertulia: Object.freeze({ emoji: "💬", accent: "#64e8ff" }),
    "palabras bonus": Object.freeze({ emoji: "📖", accent: "#ffd65a" }),
    "palabras prohibidas": Object.freeze({ emoji: "⚔️", accent: "#ff71c8" }),
    "frase final": Object.freeze({ emoji: "🏁", accent: "#ffad42" })
});
const DRAMATURGIA_ROLE_INTERACTION_MILESTONES = Object.freeze({
    control: Object.freeze(["warmup-lugares"]),
    writer1: Object.freeze([
        "warmup-lugares",
        "warmup-acciones",
        "warmup-frase-final",
        "level-letra-bendita",
        "level-letra-prohibida",
        "level-tertulia",
        "level-palabras-bonus",
        "level-palabras-prohibidas",
        "level-frase-final",
        "representation-preparation"
    ]),
    musa1: Object.freeze([
        "warmup-lugares",
        "warmup-acciones",
        "warmup-frase-final",
        "level-letra-bendita",
        "competition-letra-bendita",
        "level-letra-prohibida",
        "level-tertulia",
        "competition-letra-prohibida",
        "level-palabras-bonus",
        "competition-palabras-bonus",
        "level-palabras-prohibidas",
        "competition-palabras-prohibidas",
        "level-frase-final",
        "representation-preparation"
    ]),
    spectator: Object.freeze([
        "warmup-lugares",
        "warmup-acciones",
        "warmup-frase-final",
        "level-letra-bendita",
        "competition-letra-bendita",
        "level-letra-prohibida",
        "level-tertulia",
        "competition-letra-prohibida",
        "level-palabras-bonus",
        "competition-palabras-bonus",
        "level-palabras-prohibidas",
        "competition-palabras-prohibidas",
        "level-frase-final",
        "representation-preparation"
    ]),
    actor1: Object.freeze([
        "warmup-lugares",
        "level-letra-bendita",
        "level-letra-prohibida",
        "level-tertulia",
        "level-palabras-bonus",
        "level-palabras-prohibidas",
        "level-frase-final",
        "representation-preparation"
    ])
});

window.ScribDramaturgiaRuntime = {
    socket: dramaturgiaSocket,
    store: dramaturgiaStore,
    uiVersion: DRAMATURGIA_UI_VERSION
};

const dramaturgiaUi = {
    connected: false,
    filter: "todos",
    phase: "todas",
    graphZoom: 1,
    graphRenderKey: "",
    renderPending: false,
    lastAnnouncedId: "",
    resyncTimer: null,
    staleTimer: null
};

window.addEventListener("scrib:dramaturgia-reference-ready", () => {
    dramaturgiaUi.graphRenderKey = "";
    renderDramaturgiaGraph();
});

function dramaturgiaEl(id) {
    return document.getElementById(id);
}

function dramaturgiaCreate(tag, className = "", text = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== "") node.textContent = text;
    return node;
}

function dramaturgiaPhase(phaseId) {
    return dramaturgiaModel.PHASES[phaseId] || dramaturgiaModel.PHASES.espera;
}

function setDramaturgiaConnection(connected, detail = "") {
    dramaturgiaUi.connected = Boolean(connected);
    if (!connected && !dramaturgiaStore.frozenAt) {
        dramaturgiaStore.frozenAt = Date.now();
    }
    if (connected) {
        dramaturgiaStore.frozenAt = 0;
    }
    const status = dramaturgiaEl("dramaturgia_connection");
    const dot = dramaturgiaEl("dramaturgia_connection_dot");
    const copy = dramaturgiaEl("dramaturgia_connection_detail");
    if (status) {
        status.textContent = connected ? "EN DIRECTO" : "DATOS CONGELADOS";
        status.classList.toggle("is-live", connected);
        status.classList.toggle("is-offline", !connected);
    }
    if (dot) {
        dot.classList.toggle("is-live", connected);
        dot.classList.toggle("is-offline", !connected);
    }
    if (copy) {
        copy.textContent = detail || (connected ? "Sincronizado con SCRIB" : "Reconectando con el servidor");
    }
    scheduleDramaturgiaRender();
}

function setDramaturgiaFilter(filter) {
    const allowed = new Set(["todos", ...dramaturgiaModel.SPACES.map((space) => space.id)]);
    dramaturgiaUi.filter = allowed.has(filter) ? filter : "todos";
    document.querySelectorAll("[data-space-filter]").forEach((button) => {
        const active = button.dataset.spaceFilter === dramaturgiaUi.filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    scheduleDramaturgiaRender();
}

function setDramaturgiaPhaseFilter(phase) {
    const allowed = new Set(["todas", "calentamiento", "juego", "representacion", "espera"]);
    dramaturgiaUi.phase = allowed.has(phase) ? phase : "todas";
    document.querySelectorAll("[data-phase-filter]").forEach((button) => {
        const active = button.dataset.phaseFilter === dramaturgiaUi.phase;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    scheduleDramaturgiaRender();
}

function dramaturgiaMapScrollSurface(viewport) {
    return viewport?.querySelector(".show-score") || viewport || null;
}

function applyDramaturgiaScoreZoom(shell, zoom = dramaturgiaUi.graphZoom) {
    if (!shell) return;
    shell.style.setProperty(
        "--score-column-width",
        `${Math.round(DRAMATURGIA_SCORE_COLUMN_WIDTH * zoom)}px`
    );
    shell.style.setProperty(
        "--score-row-height",
        `${Math.round(DRAMATURGIA_SCORE_ROW_HEIGHT * zoom)}px`
    );
}

function updateDramaturgiaZoomControls() {
    const label = dramaturgiaEl("dramaturgia_zoom_label");
    if (label) label.textContent = `${Math.round(dramaturgiaUi.graphZoom * 100)}%`;
    const zoomOut = dramaturgiaEl("dramaturgia_zoom_out");
    const zoomIn = dramaturgiaEl("dramaturgia_zoom_in");
    if (zoomOut) zoomOut.disabled = dramaturgiaUi.graphZoom <= DRAMATURGIA_ZOOM_MIN;
    if (zoomIn) zoomIn.disabled = dramaturgiaUi.graphZoom >= DRAMATURGIA_ZOOM_MAX;
}

function setDramaturgiaZoom(value) {
    const nextZoom = Math.max(
        DRAMATURGIA_ZOOM_MIN,
        Math.min(DRAMATURGIA_ZOOM_MAX, Number(value) || 1)
    );
    const anchors = Array.from(document.querySelectorAll(".map-viewport")).map((viewport) => {
        const surface = dramaturgiaMapScrollSurface(viewport);
        if (!surface || !surface.querySelector?.(".show-score__grid")) return null;
        return {
            viewport,
            x: (surface.scrollLeft + (surface.clientWidth / 2)) / Math.max(1, surface.scrollWidth),
            y: (surface.scrollTop + (surface.clientHeight / 2)) / Math.max(1, surface.scrollHeight)
        };
    }).filter(Boolean);

    dramaturgiaUi.graphZoom = nextZoom;
    document.querySelectorAll(".map-viewport .show-score").forEach((shell) => {
        applyDramaturgiaScoreZoom(shell, nextZoom);
    });
    updateDramaturgiaZoomControls();

    anchors.forEach((anchor) => {
        const surface = dramaturgiaMapScrollSurface(anchor.viewport);
        if (!surface) return;
        surface.scrollLeft = (anchor.x * surface.scrollWidth) - (surface.clientWidth / 2);
        surface.scrollTop = (anchor.y * surface.scrollHeight) - (surface.clientHeight / 2);
    });
}

function fitDramaturgiaMapZoom() {
    const viewport = dramaturgiaEl("dramaturgia_graph_viewport");
    const surface = dramaturgiaMapScrollSurface(viewport);
    const shell = viewport?.querySelector(".show-score");
    if (!surface || !shell) {
        setDramaturgiaZoom(0.8);
        return;
    }
    const columnCount = Math.max(1, Number(shell.style.getPropertyValue("--score-column-count")) || 1);
    const rowCount = Math.max(1, Number(shell.style.getPropertyValue("--score-role-count")) || 5);
    const roleWidth = shell.querySelector(".show-score__role")?.getBoundingClientRect().width || 140;
    const headerHeight = [
        ".show-score__phase",
        ".show-score__milestone"
    ].reduce((total, selector) => (
        total + (shell.querySelector(selector)?.getBoundingClientRect().height || 0)
    ), 0);
    const horizontalZoom = (surface.clientWidth - roleWidth - 16)
        / (columnCount * DRAMATURGIA_SCORE_COLUMN_WIDTH);
    const verticalZoom = (surface.clientHeight - headerHeight - 16)
        / (rowCount * DRAMATURGIA_SCORE_ROW_HEIGHT);
    setDramaturgiaZoom(Math.min(horizontalZoom, verticalZoom));
    surface.scrollTo({ left: 0, top: 0, behavior: "smooth" });
}

function selectDramaturgiaEvent(eventId) {
    if (!dramaturgiaStore.eventIds.has(eventId)) return;
    dramaturgiaStore.selectedId = eventId;
    scheduleDramaturgiaRender();
}

function getDramaturgiaEvents(limit) {
    return dramaturgiaModel.visibleEvents(dramaturgiaStore, {
        filter: dramaturgiaUi.filter,
        phase: dramaturgiaUi.phase,
        limit
    });
}

function renderDramaturgiaHeader() {
    const summary = dramaturgiaModel.currentSummary(dramaturgiaStore.current);
    const phase = dramaturgiaPhase(summary.phase);
    const phaseLabel = dramaturgiaEl("dramaturgia_phase");
    const modeLabel = dramaturgiaEl("dramaturgia_mode");
    const clockLabel = dramaturgiaEl("dramaturgia_mode_clock");
    const sequenceLabel = dramaturgiaEl("dramaturgia_sequence");
    const sessionLabel = dramaturgiaEl("dramaturgia_session");
    if (phaseLabel) {
        phaseLabel.textContent = summary.phaseLabel.toUpperCase();
        phaseLabel.dataset.phase = summary.phase;
        phaseLabel.style.setProperty("--phase-accent", phase.accent);
    }
    if (modeLabel) {
        const marcador = summary.score && summary.mode && summary.mode !== "tertulia"
            ? ` · ${summary.score[1]} ↔ ${summary.score[2]}`
            : "";
        const desventaja = summary.disadvantagePlayer
            ? ` · ${summary.disadvantage || "DESVENTAJA"} E${summary.disadvantagePlayer}`
            : "";
        modeLabel.textContent = `${summary.modeLabel}${marcador}${desventaja}`;
    }
    if (clockLabel) {
        clockLabel.textContent = summary.remainingSeconds > 0
            ? `${String(Math.floor(summary.remainingSeconds / 60)).padStart(2, "0")}:${String(summary.remainingSeconds % 60).padStart(2, "0")}`
            : "—";
    }
    if (sequenceLabel) sequenceLabel.textContent = `MODO #${summary.modeSeq || 0}`;
    if (sessionLabel) {
        const suffix = dramaturgiaStore.sessionId
            ? dramaturgiaStore.sessionId.slice(-8).toUpperCase()
            : "SIN SESIÓN";
        sessionLabel.textContent = suffix;
    }
}

function renderDramaturgiaEmpty(container, message) {
    container.replaceChildren();
    const empty = dramaturgiaCreate("div", "map-empty");
    empty.append(
        dramaturgiaCreate("span", "map-empty__signal", "⌁"),
        dramaturgiaCreate("strong", "", "Esperando vistas congeladas"),
        dramaturgiaCreate("p", "", message)
    );
    container.appendChild(empty);
}

function dramaturgiaHistory() {
    return window.ScribDramaturgiaHistoryController || null;
}

function dramaturgiaReferenceShow() {
    return window.ScribDramaturgiaReferenceShow || null;
}

function toolsModelScreens() {
    const model = window.ScribDramaturgiaToolsModel;
    return model && Array.isArray(model.SCREENS) ? model.SCREENS : [];
}

function getDramaturgiaCheckpoints(limit) {
    const history = dramaturgiaHistory();
    return history ? history.getCheckpoints({
        filter: "todos",
        phase: "todas",
        limit
    }) : [];
}

function createHistoryView(checkpoint, screen, options = {}) {
    const roleLabel = options.label || screen.label;
    const view = dramaturgiaCreate("div", "history-view");
    view.dataset.checkpointId = checkpoint.id;
    view.dataset.screenId = screen.id;
    view.style.setProperty("--screen-accent", screen.accent);
    view.style.setProperty("--screen-width", `${screen.width}px`);
    view.style.setProperty("--screen-height", `${screen.height}px`);

    const available = Boolean(checkpoint.roles && checkpoint.roles[screen.id]);
    const placeholder = dramaturgiaCreate("span", "history-view__placeholder", "Cargando pantalla…");
    const label = dramaturgiaCreate("span", "history-view__label", roleLabel);
    const open = dramaturgiaCreate("button", "history-view__open");
    open.type = "button";
    open.disabled = !available;
    open.setAttribute(
        "aria-label",
        available
            ? `Ver ${roleLabel} en grande`
            : `${roleLabel} no está disponible en este momento`
    );
    if (options.timeline) open.dataset.timelinePreview = "true";
    if (available) {
        open.addEventListener("click", async () => {
            open.disabled = true;
            open.setAttribute("aria-busy", "true");
            await dramaturgiaHistory()?.openSnapshot(checkpoint.id, screen.id, open);
            if (open.isConnected) {
                open.disabled = false;
                open.removeAttribute("aria-busy");
            }
        });
    } else {
        view.classList.add("is-missing");
        view.dataset.historyState = "missing";
    }
    if (available) {
        view.append(placeholder, label, open);
        dramaturgiaHistory()?.mountPreview(view, checkpoint.id, screen.id);
    } else {
        view.appendChild(open);
    }
    return view;
}

function createReferenceView(column, screen, options = {}) {
    const reference = dramaturgiaReferenceShow();
    const milestoneId = column && column.id;
    const source = reference && reference.getView(milestoneId, screen.id);
    if (!source) return null;
    const roleLabel = options.label || screen.label;
    const momentLabel = column.label || "Momento del show";
    const view = dramaturgiaCreate("div", "history-view is-reference");
    view.dataset.screenId = screen.id;
    view.dataset.referenceMilestone = milestoneId;
    view.style.setProperty("--screen-accent", screen.accent);
    view.style.setProperty("--screen-width", `${screen.width}px`);
    view.style.setProperty("--screen-height", `${screen.height}px`);

    const placeholder = dramaturgiaCreate("span", "history-view__placeholder", "Cargando vista…");
    const label = dramaturgiaCreate("span", "history-view__label", roleLabel);
    const open = dramaturgiaCreate("button", "history-view__open");
    open.type = "button";
    open.setAttribute("aria-label", `Ver ${roleLabel} durante ${momentLabel} en grande`);
    if (options.timeline) open.dataset.timelinePreview = "true";
    open.addEventListener("click", () => {
        reference.openView(milestoneId, screen.id, open, momentLabel);
    });
    view.append(placeholder, label, open);
    reference.mountPreview(view, milestoneId, screen.id);
    return view;
}

function shouldRenderRoleView(row, column) {
    if (!row) return false;
    if (column && column.kind === "current") return true;
    const declared = dramaturgiaReferenceShow()?.manifest?.interactionChanges?.[row.screenId];
    const milestones = Array.isArray(declared)
        ? declared
        : DRAMATURGIA_ROLE_INTERACTION_MILESTONES[row.screenId];
    if (!Array.isArray(milestones)) return true;
    return milestones.includes(column && column.id);
}

function checkpointRenderKey(checkpoints, suffix = "") {
    return `${suffix}:${checkpoints.map((checkpoint) => (
        `${checkpoint.id}:${checkpoint.capturedAt}:${Object.keys(checkpoint.roles || {}).length}`
    )).join("|")}`;
}

function checkpointPhase(checkpoint) {
    const events = Array.isArray(checkpoint && checkpoint.events) ? checkpoint.events : [];
    const candidate = checkpoint && (checkpoint.primaryPhase || checkpoint.phase)
        || [...events].reverse().find((event) => event && event.fase)?.fase
        || "espera";
    return dramaturgiaModel.normalizePhase
        ? dramaturgiaModel.normalizePhase(candidate)
        : (String(candidate || "").toLowerCase().replace("representación", "representacion") || "espera");
}

function showColumnPhase(column) {
    if (column.kind === "current") return "actual";
    if (column.section === "calentamiento") return "calentamiento";
    if (column.section === "niveles" || column.section === "juego") return "juego";
    if (column.section === "representacion") return "representacion";
    return checkpointPhase(column.checkpoint);
}

function showPhaseLabel(phase) {
    if (phase === "actual") return "📸 Vista observada";
    if (phase === "calentamiento") return "📖 Calentamiento";
    if (phase === "juego") return "🎮 Niveles";
    if (phase === "representacion") return "🎭 Representación";
    return "🎬 Transición";
}

function showColumnMode(column) {
    const explicit = column.mode || column.afterMode || column.operationalAfterMode;
    if (explicit) return String(explicit).trim().toLowerCase();
    const events = Array.isArray(column.checkpoint && column.checkpoint.events)
        ? column.checkpoint.events
        : [];
    const event = [...events].reverse().find((candidate) => candidate && (candidate.modo || candidate.mode));
    return String(event && (event.modo || event.mode) || "").trim().toLowerCase();
}

function showColumnVisual(column) {
    const mode = showColumnMode(column);
    if (column.kind === "level" && DRAMATURGIA_LEVEL_VISUALS[mode]) {
        const visual = DRAMATURGIA_LEVEL_VISUALS[mode];
        return column.moment === "feedback"
            ? { ...visual, emoji: "⚠️" }
            : visual;
    }
    if (column.kind === "voting") return { emoji: "🗳️", accent: "#91ffbd" };
    if (column.kind === "warmup") {
        const request = String(column.request || "").toLowerCase();
        if (request.includes("lugar")) return { emoji: "📍", accent: "#ff9f43" };
        if (request.includes("accion") || request.includes("acción")) return { emoji: "🏃", accent: "#ff9f43" };
        return { emoji: "💬", accent: "#ff9f43" };
    }
    if (column.kind === "representation") {
        if (column.moment === "preparation") return { emoji: "🎬", accent: "#9d7cff" };
        if (column.moment === "projection") return { emoji: "🎭", accent: "#9d7cff" };
        return { emoji: "🏁", accent: "#9d7cff" };
    }
    if (column.kind === "current" || column.kind === "checkpoint") {
        return { emoji: "📸", accent: "#ffd166" };
    }
    if (DRAMATURGIA_LEVEL_VISUALS[mode]) return DRAMATURGIA_LEVEL_VISUALS[mode];
    const phase = showColumnPhase(column);
    if (phase === "calentamiento") return { emoji: "📖", accent: "#ff9f43" };
    if (phase === "juego") return { emoji: "🎮", accent: "#5b9dff" };
    if (phase === "representacion") return { emoji: "🎭", accent: "#9d7cff" };
    return { emoji: "🎬", accent: "#8192a5" };
}

function showColumnsForCurrentPhase(columns) {
    if (dramaturgiaUi.phase === "todas") return columns;
    return columns.filter((column) => showColumnPhase(column) === dramaturgiaUi.phase);
}

function showScoreWithObservedSnapshot(score) {
    // El recorrido de referencia ya ofrece el show completo. La apertura del
    // archivo local no debe añadir una columna ajena al cronograma canónico.
    if (dramaturgiaReferenceShow()) return score;
    const columns = Array.isArray(score.columns) ? score.columns : [];
    if (columns.some((column) => Boolean(column.checkpoint))) return score;
    const rows = Array.isArray(score.rows) ? score.rows : [];
    const unplaced = Array.isArray(score.unplacedCheckpoints) ? score.unplacedCheckpoints : [];
    const checkpoint = [...unplaced].reverse().find((candidate) => (
        candidate
        && candidate.roles
        && rows.some((row) => Boolean(candidate.roles[row.screenId]))
    ));
    if (!checkpoint) return score;
    return {
        ...score,
        columns: [{
            id: `observed:${checkpoint.id}`,
            label: "Vista observada",
            section: "actual",
            sectionLabel: "Vista observada",
            kind: "current",
            checkpoint,
            expected: false,
            status: checkpoint.complete === false ? "partial" : "ready"
        }, ...columns]
    };
}

function renderShowScore(viewport, score, options = {}) {
    const rows = Array.isArray(score.rows) ? score.rows : [];
    const columns = showColumnsForCurrentPhase(Array.isArray(score.columns) ? score.columns : []);
    if (!columns.length) {
        renderDramaturgiaEmpty(
            viewport,
            options.raw
                ? "Todavía no hay pantallas guardadas en esta fase."
                : "Este tramo se mostrará cuando exista una partida capturada desde el calentamiento."
        );
        return;
    }

    const previousSurface = dramaturgiaMapScrollSurface(viewport);
    const previousScroll = previousSurface
        ? { left: previousSurface.scrollLeft, top: previousSurface.scrollTop }
        : { left: 0, top: 0 };
    const shell = dramaturgiaCreate("div", "show-score");
    shell.style.setProperty("--score-column-count", String(columns.length));
    shell.style.setProperty("--score-role-count", String(rows.length));
    applyDramaturgiaScoreZoom(shell);
    shell.dataset.scoreKind = options.raw ? "all" : "journey";

    const grid = dramaturgiaCreate("div", "show-score__grid");
    const corner = dramaturgiaCreate("div", "show-score__corner");
    corner.appendChild(dramaturgiaCreate("strong", "", "ROLES"));
    grid.appendChild(corner);

    let phaseStart = 0;
    while (phaseStart < columns.length) {
        const phase = showColumnPhase(columns[phaseStart]);
        let phaseEnd = phaseStart + 1;
        while (phaseEnd < columns.length && showColumnPhase(columns[phaseEnd]) === phase) {
            phaseEnd += 1;
        }
        const phaseBand = dramaturgiaCreate("div", "show-score__phase", showPhaseLabel(phase));
        phaseBand.dataset.phase = phase;
        phaseBand.style.gridColumn = `${phaseStart + 2} / span ${phaseEnd - phaseStart}`;
        phaseBand.style.gridRow = "1";
        grid.appendChild(phaseBand);
        phaseStart = phaseEnd;
    }

    columns.forEach((column, index) => {
        const checkpoint = column.checkpoint || null;
        const captured = Boolean(checkpoint);
        const referenced = !captured && Boolean(dramaturgiaReferenceShow()?.hasMilestone(column.id));
        const state = captured ? "captured" : (referenced ? "reference" : "pending");
        const milestone = dramaturgiaCreate(
            "div",
            `show-score__milestone is-${state}`
        );
        milestone.dataset.state = state;
        milestone.dataset.milestoneId = column.id || `column-${index + 1}`;
        milestone.dataset.kind = column.kind || "moment";
        const visual = showColumnVisual(column);
        const mode = showColumnMode(column);
        if (mode) milestone.dataset.mode = mode;
        milestone.style.setProperty("--milestone-accent", visual.accent);
        milestone.style.gridColumn = String(index + 2);
        milestone.style.gridRow = "2";
        const emoji = dramaturgiaCreate("span", "show-score__milestone-emoji", visual.emoji);
        emoji.setAttribute("aria-hidden", "true");
        const title = dramaturgiaCreate("strong", "", column.label || `Momento ${index + 1}`);
        milestone.append(emoji, title);
        grid.appendChild(milestone);
    });

    const screenById = new Map(toolsModelScreens().map((screen) => [screen.id, screen]));
    rows.forEach((row, rowIndex) => {
        const gridRow = rowIndex + 3;
        const role = dramaturgiaCreate("div", "show-score__role");
        role.style.gridRow = String(gridRow);
        role.style.setProperty("--role-accent", row.accent || "#dfeaf0");
        role.appendChild(dramaturgiaCreate("strong", "", row.label));
        grid.appendChild(role);

        columns.forEach((column, columnIndex) => {
            const checkpoint = column.checkpoint || null;
            const screen = screenById.get(row.screenId);
            const roleViewChanged = shouldRenderRoleView(row, column);
            const captured = roleViewChanged
                && Boolean(checkpoint && checkpoint.roles && checkpoint.roles[row.screenId]);
            const referenceView = roleViewChanged && !captured && screen
                ? createReferenceView(column, screen, { timeline: true, label: row.label })
                : null;
            const state = !roleViewChanged
                ? "unchanged"
                : (captured ? "captured" : (referenceView ? "reference" : "pending"));
            const cell = dramaturgiaCreate(
                "div",
                `show-score__cell is-${state}`
            );
            cell.dataset.state = state;
            cell.style.setProperty("--column-accent", showColumnVisual(column).accent);
            cell.style.gridColumn = String(columnIndex + 2);
            cell.style.gridRow = String(gridRow);
            if (captured && screen) {
                cell.appendChild(createHistoryView(checkpoint, screen, {
                    timeline: true,
                    label: row.label
                }));
            } else if (referenceView) {
                cell.appendChild(referenceView);
            } else if (!roleViewChanged) {
                cell.setAttribute(
                    "aria-label",
                    `${row.label}: sin una interacción nueva durante ${column.label || `Momento ${columnIndex + 1}`}`
                );
            } else {
                cell.setAttribute(
                    "aria-label",
                    `${row.label}: todavía no hay una pantalla guardada para ${column.label || `Momento ${columnIndex + 1}`}`
                );
            }
            grid.appendChild(cell);
        });
    });

    shell.appendChild(grid);
    viewport.replaceChildren(shell);
    shell.scrollLeft = previousScroll.left;
    shell.scrollTop = previousScroll.top;
}

function renderDramaturgiaGraph() {
    const viewport = dramaturgiaEl("dramaturgia_graph_viewport");
    if (!viewport) return;
    const checkpoints = getDramaturgiaCheckpoints(720);
    const key = checkpointRenderKey(
        checkpoints,
        `${dramaturgiaUi.phase}:${viewport.clientWidth}:journey`
    );
    if (dramaturgiaUi.graphRenderKey === key) return;
    dramaturgiaUi.graphRenderKey = key;
    const score = showScoreWithObservedSnapshot(dramaturgiaModel.buildShowScore(checkpoints));
    renderShowScore(viewport, score);
}

function renderDramaturgiaStaleState() {
    const frozen = dramaturgiaEl("dramaturgia_frozen");
    if (!frozen) return;
    if (!dramaturgiaStore.frozenAt) {
        frozen.hidden = true;
        return;
    }
    frozen.hidden = false;
    frozen.textContent = "Conexión interrumpida. Conservamos la última pantalla recibida.";
}

function renderDramaturgiaHistoryStatus() {
    const node = dramaturgiaEl("dramaturgia_history_status");
    const history = dramaturgiaHistory();
    if (!node || !history) return;
    const status = history.getStatus();
    node.textContent = status.text;
    node.dataset.state = status.state;
}

function renderDramaturgia() {
    dramaturgiaUi.renderPending = false;
    renderDramaturgiaHeader();
    renderDramaturgiaStaleState();
    renderDramaturgiaHistoryStatus();
    const mapWorkspaceActive = typeof window.isDramaturgiaMapWorkspaceActive === "function"
        ? window.isDramaturgiaMapWorkspaceActive()
        : true;
    if (mapWorkspaceActive) {
        renderDramaturgiaGraph();
    }
    if (typeof window.renderDramaturgiaScreenPresence === "function") {
        window.renderDramaturgiaScreenPresence();
    }
}

function scheduleDramaturgiaRender() {
    if (dramaturgiaUi.renderPending) return;
    dramaturgiaUi.renderPending = true;
    window.requestAnimationFrame(renderDramaturgia);
}

function announceDramaturgiaEvent(event) {
    if (!event || dramaturgiaUi.lastAnnouncedId === event.id) return;
    dramaturgiaUi.lastAnnouncedId = event.id;
    const live = dramaturgiaEl("dramaturgia_live_region");
    if (live) {
        live.textContent = "Nuevo momento de la partida disponible";
    }
}

function applyDramaturgiaSnapshot(snapshot) {
    const hadSelection = Boolean(dramaturgiaStore.selectedId);
    const previousSessionId = dramaturgiaStore.sessionId;
    const inserted = dramaturgiaModel.applySnapshot(dramaturgiaStore, snapshot);
    const sessionChanged = Boolean(
        previousSessionId
        && dramaturgiaStore.sessionId
        && previousSessionId !== dramaturgiaStore.sessionId
    );
    if (inserted.length && (!hadSelection || sessionChanged)) {
        dramaturgiaStore.selectedId = inserted[inserted.length - 1].id;
    }
    dramaturgiaHistory()?.syncSession(dramaturgiaStore.sessionId, dramaturgiaStore.events);
    scheduleDramaturgiaRender();
}

function applyDramaturgiaEvent(event) {
    const inserted = dramaturgiaModel.insertEvent(dramaturgiaStore, event);
    if (!inserted) return;
    dramaturgiaHistory()?.receiveEvent(event);
    announceDramaturgiaEvent(inserted);
    scheduleDramaturgiaRender();
}

function applyDramaturgiaDelta(eventName, payload) {
    dramaturgiaModel.applyDelta(dramaturgiaStore, eventName, payload);
    scheduleDramaturgiaRender();
}

function requestDramaturgiaSync() {
    if (!dramaturgiaSocket || !dramaturgiaSocket.connected) return;
    dramaturgiaSocket.emit("pedir_estado_dramaturgia");
}

window.scribDramaturgia = {
    socket: dramaturgiaSocket,
    store: dramaturgiaStore,
    ui: dramaturgiaUi,
    applySnapshot: applyDramaturgiaSnapshot,
    applyEvent: applyDramaturgiaEvent,
    applyDelta: applyDramaturgiaDelta,
    requestSync: requestDramaturgiaSync,
    render: scheduleDramaturgiaRender,
    selectEvent: selectDramaturgiaEvent,
    setConnection: setDramaturgiaConnection,
    setFilter: setDramaturgiaFilter,
    setPhaseFilter: setDramaturgiaPhaseFilter,
    setZoom: setDramaturgiaZoom
};

window.addEventListener("scrib-dramaturgia-history-update", scheduleDramaturgiaRender);
