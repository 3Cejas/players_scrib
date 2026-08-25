(function initDramaturgiaTools(global) {
    "use strict";

    const toolsModel = global.ScribDramaturgiaToolsModel;
    const GROUPS = [
        { id: "sistema", accent: "#ffd166" },
        { id: "azul", accent: "#51e7ff" },
        { id: "rojo", accent: "#ff5964" }
    ];
    const STATUS_LABELS = {
        idle: ["LABORATORIO EN ESPERA", "Configura un guion y comprueba el servidor."],
        arming: ["COMPROBANDO SERVIDOR", "Validando roles y estado de partida."],
        starting: ["ARRANCANDO BOTS", "Registrando las superficies sintéticas."],
        running: ["SIMULACIÓN EN CURSO", "Los bots interactúan mediante los protocolos reales."],
        paused: ["SIMULACIÓN PAUSADA", "Puedes inspeccionar o ejecutar un solo paso."],
        completed: ["SIMULACIÓN COMPLETADA", "La secuencia automática ha terminado."],
        stopped: ["SIMULACIÓN DETENIDA", "El estado de prueba se ha limpiado."],
        aborted: ["ABORTADA POR ROL HUMANO", "La persona real ha recuperado la partida."],
        blocked: ["INICIO BLOQUEADO", "Hay una partida o roles humanos activos."],
        error: ["ERROR DE SIMULACIÓN", "Consulta el registro de ejecución."]
    };
    const SCREEN_STATUS_LABELS = {
        loading: "cargando",
        syncing: "sincronizando",
        live: "activo",
        offline: "sin conexión",
        error: "error"
    };

    const ui = {
        initialized: false,
        workspace: "mapa",
        screensBuilt: false,
        screenStates: new Map(),
        screenNodes: new Map(),
        expanded: null,
        resizeObserver: null,
        statusTimer: null,
        simState: null,
        simLogKeys: new Set()
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function setTextIfChanged(node, value) {
        if (node && node.textContent !== value) {
            node.textContent = value;
        }
    }

    function screenById(id) {
        return toolsModel.SCREENS.find((screen) => screen.id === id) || null;
    }

    function formatSeconds(value) {
        const seconds = Math.max(0, Math.floor(Number(value) || 0));
        return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }

    function setWorkspace(value, options = {}) {
        const allowed = ["mapa", "pantallas", "laboratorio"];
        const next = allowed.includes(value) ? value : "mapa";
        ui.workspace = next;
        document.querySelectorAll("[data-dramaturgia-workspace]").forEach((button) => {
            const active = button.dataset.dramaturgiaWorkspace === next;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", active ? "true" : "false");
            button.tabIndex = active ? 0 : -1;
        });
        document.querySelectorAll("[data-dramaturgia-workspace-panel]").forEach((panel) => {
            const active = panel.dataset.dramaturgiaWorkspacePanel === next;
            panel.hidden = !active;
            panel.classList.toggle("is-active", active);
        });
        if (next === "pantallas" || next === "laboratorio") {
            mountScreens(next);
        }
        if (next === "mapa" && typeof global.scheduleDramaturgiaRender === "function") {
            global.scheduleDramaturgiaRender();
        }
        const skipLink = byId("dramaturgia_skip_link");
        if (skipLink) {
            const targets = {
                mapa: ["#dramaturgia_map", "Saltar al mapa activo"],
                pantallas: ["#dramaturgia_workspace_screens", "Saltar a las pantallas"],
                laboratorio: ["#dramaturgia_workspace_lab", "Saltar al laboratorio"]
            };
            skipLink.href = targets[next][0];
            skipLink.textContent = targets[next][1];
        }
        if (options.updateHash !== false && global.history && typeof global.history.replaceState === "function") {
            global.history.replaceState(null, "", `#${next}`);
        }
    }

    global.isDramaturgiaMapWorkspaceActive = () => ui.workspace === "mapa";

    function rolePresence(screen) {
        const runtime = global.ScribDramaturgiaRuntime || {};
        const current = runtime.store && runtime.store.current
            ? runtime.store.current
            : {};
        const connections = current.connections || current.conexiones || {};
        if (screen.id === "control") return connections.control;
        if (screen.id === "spectator") return connections.spectator || connections.espectador;
        if (screen.id === "jury") return connections.jury || connections.jurado;
        const player = screen.id.endsWith("2") ? 2 : 1;
        if (screen.id.startsWith("writer")) {
            return connections.writers && (connections.writers[player] || connections.writers[String(player)]);
        }
        if (screen.id.startsWith("musa")) {
            return connections.musas && (connections.musas[player] || connections.musas[String(player)]);
        }
        if (screen.id.startsWith("actor")) {
            return connections.actors && (connections.actors[player] || connections.actors[String(player)]);
        }
        return null;
    }

    function updateScreenPresence() {
        if (!ui.screensBuilt) return;
        toolsModel.SCREENS.forEach((screen) => {
            const nodes = ui.screenNodes.get(screen.id);
            if (!nodes) return;
            const presence = rolePresence(screen);
            const count = presence && Number.isFinite(Number(presence.count))
                ? Number(presence.count)
                : 0;
            setTextIfChanged(nodes.presence, count > 0
                ? `${count} sesión${count === 1 ? "" : "es"} activa${count === 1 ? "" : "s"}`
                : "sin sesión activa");
        });
    }

    function setScreenStatusLabel(status, screen, state) {
        if (!status || !screen) return;
        const label = SCREEN_STATUS_LABELS[state] || SCREEN_STATUS_LABELS.loading;
        status.setAttribute("aria-label", `Estado de ${screen.label}: ${label}`);
    }

    function fitStage(viewport, stage, screen) {
        if (!viewport || !stage || !screen) return;
        const width = Math.max(1, viewport.clientWidth);
        const height = Math.max(1, viewport.clientHeight);
        const scale = Math.max(0.02, Math.min(width / screen.width, height / screen.height) * 0.985);
        stage.style.setProperty("--screen-scale", String(scale));
    }

    function fitAllScreens() {
        ui.screenNodes.forEach((nodes, id) => {
            const screen = screenById(id);
            const viewport = ui.expanded && ui.expanded.kind === "live" && ui.expanded.id === id
                ? byId("dramaturgia_screen_dialog_viewport")
                : nodes.viewport;
            fitStage(viewport, nodes.stage, screen);
        });
        if (ui.expanded && ui.expanded.kind === "history") {
            fitStage(
                byId("dramaturgia_screen_dialog_viewport"),
                ui.expanded.stage,
                screenById(ui.expanded.id)
            );
        }
    }

    function createScreenTile(screen) {
        const tile = document.createElement("article");
        tile.className = "screen-tile";
        tile.dataset.screenId = screen.id;
        tile.dataset.monitorState = "loading";
        tile.style.setProperty("--screen-accent", screen.accent);

        const header = document.createElement("header");
        header.className = "screen-tile__header";
        const title = document.createElement("span");
        title.className = "screen-tile__title";
        const strong = document.createElement("strong");
        strong.textContent = screen.label;
        const presence = document.createElement("small");
        presence.textContent = "comprobando rol real";
        title.append(strong, presence);
        const status = document.createElement("span");
        status.className = "screen-tile__status";
        status.setAttribute("role", "img");
        setScreenStatusLabel(status, screen, "loading");
        header.append(title, status);

        const viewport = document.createElement("div");
        viewport.className = "screen-tile__viewport";
        const stage = document.createElement("div");
        stage.className = "screen-tile__stage";
        stage.style.setProperty("--screen-width", `${screen.width}px`);
        stage.style.setProperty("--screen-height", `${screen.height}px`);
        const frame = document.createElement("iframe");
        frame.className = "screen-tile__frame";
        frame.title = `Vista de ${screen.label}`;
        frame.dataset.src = screen.url;
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
        frame.setAttribute("allow", "autoplay 'none'; camera 'none'; microphone 'none'; display-capture 'none'");
        frame.setAttribute("referrerpolicy", "same-origin");
        frame.tabIndex = -1;
        stage.appendChild(frame);
        viewport.appendChild(stage);

        const open = document.createElement("button");
        open.type = "button";
        open.className = "screen-tile__open";
        open.dataset.screenOpen = screen.id;
        open.setAttribute("aria-label", `Ampliar ${screen.label}`);
        open.addEventListener("click", () => openScreen(screen.id));
        tile.append(header, viewport, open);

        ui.screenNodes.set(screen.id, { tile, viewport, stage, frame, status, presence, open });
        ui.screenStates.set(screen.id, "loading");
        frame.addEventListener("load", () => {
            if (ui.screenStates.get(screen.id) === "live") return;
            ui.screenStates.set(screen.id, "syncing");
            tile.dataset.monitorState = "syncing";
            setScreenStatusLabel(status, screen, "syncing");
        });
        frame.src = frame.dataset.src;
        return tile;
    }

    function buildScreens() {
        if (ui.screensBuilt || !toolsModel) return;
        const root = byId("dramaturgia_screen_grid");
        if (!root) return;
        ui.screensBuilt = true;
        GROUPS.forEach((group) => {
            const section = document.createElement("section");
            section.className = "screen-group";
            section.style.setProperty("--group-accent", group.accent);
            const grid = document.createElement("div");
            grid.className = "screen-group__grid";
            toolsModel.SCREENS
                .filter((screen) => screen.group === group.id)
                .forEach((screen) => grid.appendChild(createScreenTile(screen)));
            section.appendChild(grid);
            root.appendChild(section);
        });
        if (typeof global.ResizeObserver === "function") {
            ui.resizeObserver = new ResizeObserver(fitAllScreens);
            ui.screenNodes.forEach((nodes) => ui.resizeObserver.observe(nodes.viewport));
            const dialogViewport = byId("dramaturgia_screen_dialog_viewport");
            if (dialogViewport) ui.resizeObserver.observe(dialogViewport);
        }
        global.requestAnimationFrame(fitAllScreens);
        updateScreenPresence();
    }

    function mountScreens(workspace) {
        const mountIds = {
            pantallas: "dramaturgia_screens_mount",
            laboratorio: "dramaturgia_lab_screens_mount"
        };
        const mountId = mountIds[workspace];
        if (!mountId) return false;
        buildScreens();
        const root = byId("dramaturgia_screen_grid");
        const mount = byId(mountId);
        if (!root || !mount) return false;
        if (root.parentElement !== mount) {
            // `moveBefore` performs an atomic DOM move: unlike remove/append,
            // browsers keep each iframe browsing context and monitor socket alive.
            if (typeof mount.moveBefore === "function") {
                mount.moveBefore(root, null);
            } else {
                mount.appendChild(root);
            }
        }
        global.requestAnimationFrame(fitAllScreens);
        return true;
    }

    function setMonitorState(screenId, state) {
        const nodes = ui.screenNodes.get(screenId);
        if (!nodes || state === "blocked" || state === "open") return;
        const normalized = ["loading", "syncing", "live", "offline", "error"].includes(state)
            ? state
            : "loading";
        ui.screenStates.set(screenId, normalized);
        nodes.tile.dataset.monitorState = normalized;
        setScreenStatusLabel(nodes.status, screenById(screenId), normalized);
        updateScreenPresence();
    }

    function openScreen(screenId) {
        const nodes = ui.screenNodes.get(screenId);
        const screen = screenById(screenId);
        const dialog = byId("dramaturgia_screen_dialog");
        const dialogViewport = byId("dramaturgia_screen_dialog_viewport");
        if (!nodes || !screen || !dialog || !dialogViewport) return;
        if (ui.expanded && ui.expanded.kind === "live" && ui.expanded.id === screenId) return;
        if (ui.expanded) closeScreen();
        ui.expanded = {
            kind: "live",
            id: screenId,
            home: nodes.viewport,
            focus: document.activeElement
        };
        const title = byId("dramaturgia_screen_dialog_title");
        if (title) title.textContent = screen.label;
        dialog.style.setProperty("--screen-accent", screen.accent);
        dialog.classList.toggle("screen-dialog--portrait", screen.height > screen.width);
        dialogViewport.appendChild(nodes.stage);
        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            dialog.setAttribute("open", "");
        }
        global.requestAnimationFrame(() => {
            fitStage(dialogViewport, nodes.stage, screen);
            const close = byId("dramaturgia_screen_dialog_close");
            if (close) close.focus();
        });
    }

    function openHistoryScreen(options = {}) {
        const screen = screenById(options.screenId || options.id);
        const html = typeof options.html === "string" ? options.html : "";
        const dialog = byId("dramaturgia_screen_dialog");
        const dialogViewport = byId("dramaturgia_screen_dialog_viewport");
        if (!screen || !html || !dialog || !dialogViewport) return false;
        if (ui.expanded) closeScreen();

        const stage = document.createElement("div");
        stage.className = "history-dialog-stage";
        stage.style.setProperty("--screen-width", `${screen.width}px`);
        stage.style.setProperty("--screen-height", `${screen.height}px`);
        const frame = document.createElement("iframe");
        frame.className = "history-dialog-frame";
        frame.title = `${screen.label} · vista histórica congelada`;
        frame.setAttribute("sandbox", "allow-same-origin");
        frame.setAttribute("allow", "autoplay 'none'; camera 'none'; microphone 'none'; display-capture 'none'");
        frame.setAttribute("referrerpolicy", "no-referrer");
        frame.srcdoc = html;
        stage.appendChild(frame);

        ui.expanded = {
            kind: "history",
            id: screen.id,
            stage,
            focus: options.focus || document.activeElement
        };
        const title = byId("dramaturgia_screen_dialog_title");
        if (title) title.textContent = screen.label;
        dialog.dataset.dialogKind = "history";
        dialog.style.setProperty("--screen-accent", screen.accent);
        dialog.classList.toggle("screen-dialog--portrait", screen.height > screen.width);
        dialogViewport.replaceChildren(stage);
        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            dialog.setAttribute("open", "");
        }
        global.requestAnimationFrame(() => {
            fitStage(dialogViewport, stage, screen);
            const close = byId("dramaturgia_screen_dialog_close");
            if (close) close.focus();
        });
        return true;
    }

    function openReferenceScreen(options = {}) {
        const screen = screenById(options.screenId || options.id);
        const url = typeof options.url === "string" ? options.url : "";
        const dialog = byId("dramaturgia_screen_dialog");
        const dialogViewport = byId("dramaturgia_screen_dialog_viewport");
        if (!screen || !url || !dialog || !dialogViewport) return false;
        if (ui.expanded) closeScreen();

        const stage = document.createElement("div");
        stage.className = "history-dialog-stage";
        stage.style.setProperty("--screen-width", `${screen.width}px`);
        stage.style.setProperty("--screen-height", `${screen.height}px`);
        const frame = document.createElement("iframe");
        frame.className = "history-dialog-frame";
        frame.title = `${screen.label} · recorrido de referencia`;
        frame.setAttribute("sandbox", "allow-same-origin");
        frame.setAttribute("allow", "autoplay 'none'; camera 'none'; microphone 'none'; display-capture 'none'");
        frame.setAttribute("referrerpolicy", "same-origin");
        frame.src = url;
        stage.appendChild(frame);

        ui.expanded = {
            kind: "reference",
            id: screen.id,
            stage,
            focus: options.focus || document.activeElement
        };
        const title = byId("dramaturgia_screen_dialog_title");
        if (title) title.textContent = options.label
            ? `${screen.label} · ${options.label}`
            : screen.label;
        dialog.dataset.dialogKind = "history";
        dialog.style.setProperty("--screen-accent", screen.accent);
        dialog.classList.toggle("screen-dialog--portrait", screen.height > screen.width);
        dialogViewport.replaceChildren(stage);
        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            dialog.setAttribute("open", "");
        }
        global.requestAnimationFrame(() => {
            fitStage(dialogViewport, stage, screen);
            const close = byId("dramaturgia_screen_dialog_close");
            if (close) close.focus();
        });
        return true;
    }

    function closeScreen() {
        const dialog = byId("dramaturgia_screen_dialog");
        if (!ui.expanded || !dialog) return;
        const expanded = ui.expanded;
        const nodes = expanded.kind === "live" ? ui.screenNodes.get(expanded.id) : null;
        if (nodes && expanded.home) {
            expanded.home.appendChild(nodes.stage);
            global.requestAnimationFrame(() => fitStage(expanded.home, nodes.stage, screenById(expanded.id)));
        } else {
            const viewport = byId("dramaturgia_screen_dialog_viewport");
            if (viewport) viewport.replaceChildren();
        }
        ui.expanded = null;
        if (dialog.open && typeof dialog.close === "function") {
            dialog.close();
        } else {
            dialog.removeAttribute("open");
        }
        dialog.style.removeProperty("--screen-accent");
        dialog.removeAttribute("data-dialog-kind");
        dialog.classList.remove("screen-dialog--portrait");
        if (expanded.focus && typeof expanded.focus.focus === "function") {
            expanded.focus.focus();
        }
    }

    function getScreenSource(screenId) {
        const nodes = ui.screenNodes.get(screenId);
        const screen = screenById(screenId);
        if (!nodes || !screen) return null;
        return {
            screen,
            frame: nodes.frame,
            state: ui.screenStates.get(screenId) || "loading"
        };
    }

    function getScreenSources() {
        return toolsModel.SCREENS
            .map((screen) => getScreenSource(screen.id))
            .filter(Boolean);
    }

    function applyPreset(name) {
        const config = toolsModel.normalizeConfig({}, name);
        byId("dramaturgia_sim_seed").value = config.seed;
        byId("dramaturgia_sim_total_seconds").value = config.total_seconds;
        byId("dramaturgia_sim_mode_seconds").value = config.mode_seconds;
        byId("dramaturgia_sim_speed").value = String(config.speed);
        byId("dramaturgia_sim_writer_ppm").value = config.writer_ppm;
        byId("dramaturgia_sim_muse_interval").value = config.muse_interval_seconds;
        byId("dramaturgia_sim_muses").value = config.muses_per_team;
        byId("dramaturgia_sim_hearts").checked = config.hearts;
        byId("dramaturgia_sim_auto_finish").checked = config.auto_finish;
        byId("dramaturgia_sim_full_show").checked = config.full_show;
        document.querySelectorAll('[name="dramaturgia_sim_mode"]').forEach((checkbox) => {
            checkbox.checked = config.modes.includes(checkbox.value);
        });
    }

    function collectConfig() {
        const modes = Array.from(document.querySelectorAll('[name="dramaturgia_sim_mode"]:checked'))
            .map((checkbox) => checkbox.value);
        if (!modes.length) return null;
        return toolsModel.normalizeConfig({
            seed: byId("dramaturgia_sim_seed").value,
            total_seconds: byId("dramaturgia_sim_total_seconds").value,
            mode_seconds: byId("dramaturgia_sim_mode_seconds").value,
            speed: byId("dramaturgia_sim_speed").value,
            writer_ppm: byId("dramaturgia_sim_writer_ppm").value,
            muse_interval_seconds: byId("dramaturgia_sim_muse_interval").value,
            muses_per_team: byId("dramaturgia_sim_muses").value,
            votes: false,
            hearts: byId("dramaturgia_sim_hearts").checked,
            auto_finish: byId("dramaturgia_sim_auto_finish").checked,
            full_show: byId("dramaturgia_sim_full_show").checked,
            modes
        }, byId("dramaturgia_sim_preset").value);
    }

    function emitAck(eventName, payload = {}, timeoutMs = 6000) {
        return new Promise((resolve) => {
            const socket = global.ScribDramaturgiaRuntime && global.ScribDramaturgiaRuntime.socket;
            if (!socket || !socket.connected) {
                resolve({ ok: false, code: "OFFLINE", error: "Servidor desconectado" });
                return;
            }
            let settled = false;
            const timeout = global.setTimeout(() => {
                if (settled) return;
                settled = true;
                resolve({ ok: false, code: "TIMEOUT", error: "El servidor no respondió" });
            }, timeoutMs);
            socket.emit(eventName, payload, (response) => {
                if (settled) return;
                settled = true;
                global.clearTimeout(timeout);
                resolve(response || { ok: false, code: "EMPTY_RESPONSE" });
            });
        });
    }

    function setPreflight(result) {
        const root = byId("dramaturgia_sim_preflight");
        const title = byId("dramaturgia_sim_preflight_title");
        const detail = byId("dramaturgia_sim_preflight_detail");
        if (!root || !title || !detail) return;
        const safe = Boolean(result && result.ok && result.can_start);
        root.dataset.safe = safe ? "true" : "false";
        title.textContent = safe ? "Partida libre · arranque seguro" : "Partida no disponible";
        const blockers = result && Array.isArray(result.blockers) ? result.blockers : [];
        detail.textContent = safe
            ? "No hay roles humanos ni un modo activo. La simulación puede empezar."
            : (result && result.error) || (blockers.length
                ? `Bloquean: ${blockers.join(", ")}. Cierra esas superficies y vuelve a comprobar.`
                : "No se ha podido confirmar un estado seguro.");
    }

    async function preflight() {
        setSimStatus({ state: "arming", message: "Comprobando roles y partida" });
        const result = await emitAck("dramaturgia_sim_preflight", {});
        setPreflight(result);
        if (!ui.simState || !["running", "paused"].includes(ui.simState.state)) {
            setSimStatus({
                state: result && result.can_start ? "idle" : "blocked",
                message: result && result.can_start ? "Servidor libre para test" : "Hay actividad humana o una partida real"
            });
        }
        return result;
    }

    function appendLog(text, key) {
        const clean = String(text || "").trim();
        if (!clean) return;
        const stableKey = key || clean;
        if (ui.simLogKeys.has(stableKey)) return;
        ui.simLogKeys.add(stableKey);
        const list = byId("dramaturgia_sim_log");
        if (!list) return;
        const item = document.createElement("li");
        item.textContent = clean;
        list.prepend(item);
        while (list.children.length > 36) {
            list.lastElementChild.remove();
        }
    }

    function setSimStatus(payload = {}) {
        const state = String(payload.state || payload.estado || "idle").toLowerCase();
        const root = byId("dramaturgia_sim_status");
        const labels = STATUS_LABELS[state] || STATUS_LABELS.idle;
        if (root) {
            root.dataset.state = state;
            const strong = root.querySelector("strong");
            const small = root.querySelector("small");
            if (strong) strong.textContent = labels[0];
            if (small) small.textContent = payload.message || payload.mensaje || labels[1];
        }
        const running = state === "running";
        const paused = state === "paused";
        const active = running || paused || state === "starting";
        const cleanable = active || (
            Boolean(payload.run_id)
            && ["completed", "aborted", "error"].includes(state)
        );
        byId("dramaturgia_sim_start").disabled = active;
        byId("dramaturgia_sim_pause").disabled = !running;
        byId("dramaturgia_sim_resume").disabled = !paused;
        byId("dramaturgia_sim_step").disabled = !paused;
        byId("dramaturgia_sim_stop").disabled = !cleanable;
        document.querySelectorAll(".sim-fieldset input, .sim-fieldset select").forEach((control) => {
            control.disabled = active && control.id !== "dramaturgia_sim_password";
        });
    }

    function renderSimState(payload = {}) {
        ui.simState = payload;
        setSimStatus(payload);
        const run = byId("dramaturgia_sim_run");
        const elapsed = byId("dramaturgia_sim_elapsed");
        const mode = byId("dramaturgia_sim_mode");
        const words = byId("dramaturgia_sim_words");
        const inspirations = byId("dramaturgia_sim_inspirations");
        const progress = byId("dramaturgia_sim_progress_bar");
        const metrics = payload.metrics || payload.metricas || {};
        const config = payload.config || {};
        if (run) run.textContent = payload.run_id ? String(payload.run_id).slice(-12).toUpperCase() : "SIN RUN";
        if (elapsed) elapsed.textContent = formatSeconds(metrics.elapsed_seconds || 0);
        if (mode) {
            const stageLabels = {
                warmup: "Calentamiento",
                representation: "Representación"
            };
            mode.textContent = stageLabels[payload.stage]
                || payload.mode
                || payload.modo
                || "—";
        }
        if (words) words.textContent = `${metrics.words_1 || 0} / ${metrics.words_2 || 0}`;
        if (inspirations) inspirations.textContent = String(metrics.inspirations || 0);
        if (progress) {
            const total = Math.max(1, Number(config.total_seconds) || 1);
            const pct = Math.max(0, Math.min(100, ((Number(metrics.elapsed_seconds) || 0) / total) * 100));
            progress.style.width = `${pct}%`;
            const progressRoot = byId("dramaturgia_sim_progress");
            if (progressRoot) {
                progressRoot.setAttribute("aria-valuenow", String(Math.round(pct)));
                progressRoot.setAttribute(
                    "aria-valuetext",
                    `${formatSeconds(metrics.elapsed_seconds || 0)} de ${formatSeconds(total)}`
                );
            }
        }
        const entries = Array.isArray(payload.log) ? payload.log : [];
        entries.forEach((entry) => {
            const item = entry && typeof entry === "object" ? entry : { message: entry };
            appendLog(item.message || item.mensaje, item.id || `${item.ts || ""}:${item.message || item.mensaje || ""}`);
        });
        if (payload.message || payload.mensaje) {
            appendLog(payload.message || payload.mensaje, `${payload.state}:${payload.revision || ""}:${payload.message || payload.mensaje}`);
        }
    }

    async function authorizeAndStart(event) {
        event.preventDefault();
        const config = collectConfig();
        if (!config) {
            setSimStatus({ state: "blocked", message: "Selecciona al menos un modo para el guion" });
            const firstMode = document.querySelector('[name="dramaturgia_sim_mode"]');
            if (firstMode) firstMode.focus();
            return;
        }
        const check = await preflight();
        if (!check || !check.can_start) return;
        const passwordInput = byId("dramaturgia_sim_password");
        const password = passwordInput.value;
        if (!password) {
            setSimStatus({ state: "blocked", message: "Escribe la clave de roles para autorizar el laboratorio" });
            passwordInput.focus();
            return;
        }
        const auth = await emitAck("dramaturgia_sim_autorizar", { password });
        passwordInput.value = "";
        if (!auth || !auth.ok) {
            setSimStatus({ state: "blocked", message: "Clave de roles incorrecta" });
            return;
        }
        setSimStatus({ state: "starting" });
        const result = await emitAck("dramaturgia_sim_iniciar", { config }, 10000);
        if (!result || !result.ok) {
            setPreflight(result || {});
            setSimStatus({ state: "blocked", message: (result && result.error) || "No se pudo iniciar" });
            return;
        }
        renderSimState(result.state || result);
    }

    async function authorizeCurrentPanel() {
        const passwordInput = byId("dramaturgia_sim_password");
        const password = passwordInput.value;
        if (!password) {
            setSimStatus({
                ...(ui.simState || {}),
                message: "Escribe la clave de roles para recuperar los controles en esta pestaña"
            });
            passwordInput.focus();
            return false;
        }
        const auth = await emitAck("dramaturgia_sim_autorizar", { password });
        passwordInput.value = "";
        if (!auth || !auth.ok) {
            setSimStatus({
                ...(ui.simState || {}),
                message: "Clave de roles incorrecta; los controles siguen protegidos"
            });
            passwordInput.focus();
            return false;
        }
        appendLog("Controles autorizados en esta pestaña.", `auth:${auth.expires_at || Date.now()}`);
        return true;
    }

    async function simCommand(eventName, retryAuthorization = true) {
        const result = await emitAck(eventName, {});
        if (!result || !result.ok) {
            if (
                retryAuthorization
                && result
                && result.code === "NOT_AUTHORIZED"
                && await authorizeCurrentPanel()
            ) {
                return simCommand(eventName, false);
            }
            setSimStatus({ state: "error", message: (result && result.error) || "Orden rechazada" });
            return;
        }
        renderSimState(result.state || result);
    }

    function initialize() {
        if (!toolsModel || ui.initialized) return;
        document.querySelectorAll("[data-dramaturgia-workspace]").forEach((button, index, buttons) => {
            button.addEventListener("click", () => setWorkspace(button.dataset.dramaturgiaWorkspace));
            button.addEventListener("keydown", (event) => {
                let nextIndex = index;
                if (event.key === "ArrowRight") nextIndex = (index + 1) % buttons.length;
                else if (event.key === "ArrowLeft") nextIndex = (index - 1 + buttons.length) % buttons.length;
                else if (event.key === "Home") nextIndex = 0;
                else if (event.key === "End") nextIndex = buttons.length - 1;
                else return;
                event.preventDefault();
                const next = buttons[nextIndex];
                setWorkspace(next.dataset.dramaturgiaWorkspace);
                next.focus();
            });
        });

        const hashWorkspace = global.location.hash.replace(/^#/, "");
        setWorkspace(
            ["mapa", "pantallas", "laboratorio"].includes(hashWorkspace) ? hashWorkspace : "mapa",
            { updateHash: false }
        );
        // El archivo causal necesita las nueve superficies canónicas aunque la
        // pestaña Pantallas permanezca oculta. Sus DOM se congelan por checkpoint.
        buildScreens();

        global.addEventListener("message", (event) => {
            if (event.origin !== global.location.origin) return;
            const data = event.data;
            if (!data || data.type !== "scrib-dramaturgia-monitor") return;
            const nodes = ui.screenNodes.get(data.screenId);
            if (!nodes || event.source !== nodes.frame.contentWindow) return;
            if (data.estado === "open") {
                if (!ui.expanded || ui.expanded.id !== data.screenId) {
                    openScreen(data.screenId);
                }
                return;
            }
            setMonitorState(data.screenId, data.estado);
        });

        const dialog = byId("dramaturgia_screen_dialog");
        byId("dramaturgia_screen_dialog_close").addEventListener("click", closeScreen);
        if (dialog) {
            dialog.addEventListener("cancel", (event) => {
                event.preventDefault();
                closeScreen();
            });
            dialog.addEventListener("click", (event) => {
                if (event.target === dialog) closeScreen();
            });
        }

        byId("dramaturgia_sim_preset").addEventListener("change", (event) => applyPreset(event.target.value));
        byId("dramaturgia_sim_form").addEventListener("submit", authorizeAndStart);
        byId("dramaturgia_sim_check").addEventListener("click", preflight);
        byId("dramaturgia_sim_pause").addEventListener("click", () => simCommand("dramaturgia_sim_pausar"));
        byId("dramaturgia_sim_resume").addEventListener("click", () => simCommand("dramaturgia_sim_reanudar"));
        byId("dramaturgia_sim_step").addEventListener("click", () => simCommand("dramaturgia_sim_paso"));
        byId("dramaturgia_sim_stop").addEventListener("click", () => simCommand("dramaturgia_sim_detener"));
        applyPreset("visual");
        setSimStatus({ state: "idle" });

        const socket = global.ScribDramaturgiaRuntime && global.ScribDramaturgiaRuntime.socket;
        if (socket) {
            socket.on("dramaturgia_sim_estado", renderSimState);
            socket.on("connect", () => {
                socket.emit("dramaturgia_sim_estado_pedir");
            });
        }
        ui.statusTimer = global.setInterval(updateScreenPresence, 2000);
        global.addEventListener("resize", fitAllScreens);
        ui.initialized = true;
    }

    global.initializeDramaturgiaTools = initialize;
    global.renderDramaturgiaScreenPresence = updateScreenPresence;
    global.ScribDramaturgiaScreenPool = {
        ensure: buildScreens,
        mount: mountScreens,
        getScreen: screenById,
        getSource: getScreenSource,
        getSources: getScreenSources,
        openHistoryScreen,
        openReferenceScreen
    };
    global.ScribDramaturgiaSimulatorControls = {
        start: () => authorizeAndStart({ preventDefault() {} })
    };
})(window);
