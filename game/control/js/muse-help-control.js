(function inicializarMuseHelpControl(global) {
    "use strict";

    const ACK_TIMEOUT_MS = 7000;
    const MAX_TICKETS = 200;
    const MAX_FRAME_BASE64 = 4 * 1024 * 1024;
    const FRAME_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
    const ESTADOS_ABIERTOS = new Set(["solicitada", "atendida"]);
    const pending = new Map();
    const frames = new Map();
    let requestCounter = 0;
    let ageInterval = null;
    let cursorTimer = null;
    let lastRemoteCommandAt = 0;
    let initialized = false;
    let state = {
        connected: false,
        synced: false,
        revision: 0,
        ts: 0,
        tickets: [],
        selectedId: "",
        message: "",
        error: ""
    };

    const getEl = (id) => global.document && global.document.getElementById(id);
    const getSocket = () => (typeof socket !== "undefined" ? socket : null);
    const cleanText = (value, max = 180) => String(value == null ? "" : value)
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function normalizeTimestamp(value) {
        const number = Number(value);
        if (!Number.isFinite(number) || number <= 0) return 0;
        return number < 1e12 ? Math.round(number * 1000) : Math.round(number);
    }

    function normalizeTeam(value) {
        const raw = cleanText(value, 24).toLowerCase();
        if (["1", "azul", "blue", "j1", "escritxr1"].includes(raw)) {
            return { id: 1, label: "EQUIPO AZUL", className: "is-blue" };
        }
        if (["2", "rojo", "roja", "red", "j2", "escritxr2"].includes(raw)) {
            return { id: 2, label: "EQUIPO ROJO", className: "is-red" };
        }
        return { id: 0, label: "EQUIPO SIN ASIGNAR", className: "is-neutral" };
    }

    function normalizeColor(value, teamId = 0) {
        const raw = cleanText(value, 16);
        if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toUpperCase();
        if (/^#[0-9a-f]{3}$/i.test(raw)) {
            return `#${raw.slice(1).split("").map((char) => char + char).join("")}`.toUpperCase();
        }
        return teamId === 1 ? "#22D9FF" : (teamId === 2 ? "#FF4D67" : "#FFD84D");
    }

    function normalizeTicketStatus(value) {
        const raw = cleanText(value, 32).toLowerCase().replace(/[\s-]+/g, "_");
        if (["solicitada", "solicitado", "pendiente", "nueva", "abierta"].includes(raw)) return "solicitada";
        if (["atendida", "atendiendo", "en_atencion", "en_curso"].includes(raw)) return "atendida";
        if (["resuelta", "resuelto", "cerrada", "cerrado"].includes(raw)) return "resuelta";
        if (["cancelada", "cancelado"].includes(raw)) return "cancelada";
        return "solicitada";
    }

    function normalizeDiagnosticStatus(value) {
        const raw = cleanText(value, 40).toLowerCase().replace(/[\s-]+/g, "_");
        if (["solicitado", "solicitada", "requested", "esperando", "esperando_consentimiento"].includes(raw)) return "solicitado";
        if (["activo", "activa", "active", "accepted", "aceptado"].includes(raw)) return "activo";
        if (["rechazado", "rechazada", "denied"].includes(raw)) return "rechazado";
        if (["caducado", "caducada", "expired"].includes(raw)) return "caducado";
        if (["detenido", "detenida", "stopped", "closed"].includes(raw)) return "detenido";
        return "inactivo";
    }

    function normalizeViewport(value) {
        if (!value || typeof value !== "object") return { width: 0, height: 0 };
        const width = clamp(Math.round(Number(value.width) || 0), 0, 10000);
        const height = clamp(Math.round(Number(value.height) || 0), 0, 10000);
        return { width, height };
    }

    function normalizePath(value) {
        const raw = cleanText(value, 180);
        if (!raw.startsWith("/") || raw.startsWith("//") || /[?#]/.test(raw)) return "";
        return raw;
    }

    function normalizeDiagnostic(value = {}) {
        const diagnostic = value && typeof value === "object" ? value : {};
        const sessionId = cleanText(diagnostic.session_id ?? diagnostic.sessionId, 128);
        return {
            status: normalizeDiagnosticStatus(diagnostic.estado ?? diagnostic.status),
            sessionId,
            expiresTs: normalizeTimestamp(diagnostic.expires_ts ?? diagnostic.expiresAt),
            lastFrameTs: normalizeTimestamp(diagnostic.ultimo_frame_ts ?? diagnostic.lastFrameTs),
            path: normalizePath(diagnostic.ruta ?? diagnostic.path),
            viewport: normalizeViewport(diagnostic.viewport),
            online: typeof diagnostic.online === "boolean" ? diagnostic.online : null,
            socketConnected: typeof diagnostic.socket_conectado === "boolean"
                ? diagnostic.socket_conectado
                : (typeof diagnostic.socketConnected === "boolean" ? diagnostic.socketConnected : null),
            lastError: cleanText(diagnostic.ultimo_error ?? diagnostic.lastError, 240)
        };
    }

    function normalizeTicket(value = {}) {
        const ticket = value && typeof value === "object" ? value : {};
        const ticketId = cleanText(ticket.ticket_id ?? ticket.ticketId ?? ticket.id, 128);
        if (!ticketId) return null;
        const team = normalizeTeam(ticket.equipo ?? ticket.team ?? ticket.equipo_id);
        const color = normalizeColor(ticket.color, team.id);
        return {
            ticketId,
            museName: cleanText(ticket.nombre_musa ?? ticket.nombre ?? ticket.muse_name, 80) || "MUSA SIN NOMBRE",
            team,
            color,
            colorName: cleanText(ticket.color_nombre ?? ticket.colorName, 24).toUpperCase() || color,
            status: normalizeTicketStatus(ticket.estado ?? ticket.status),
            requestedTs: normalizeTimestamp(ticket.solicitado_ts ?? ticket.created_at ?? ticket.requestedAt),
            updatedTs: normalizeTimestamp(ticket.actualizado_ts ?? ticket.updated_at ?? ticket.updatedAt),
            connected: typeof ticket.conectada === "boolean"
                ? ticket.conectada
                : (typeof ticket.connected === "boolean" ? ticket.connected : false),
            diagnostic: normalizeDiagnostic(ticket.diagnostico ?? ticket.diagnostic)
        };
    }

    function normalizeState(payload = {}) {
        const root = payload && typeof payload === "object" ? payload : {};
        const data = root.estado && typeof root.estado === "object"
            ? root.estado
            : (root.state && typeof root.state === "object" ? root.state : root);
        const rawTickets = Array.isArray(data.tickets)
            ? data.tickets
            : (Array.isArray(data.incidencias) ? data.incidencias : (Array.isArray(data.ayudas) ? data.ayudas : []));
        const rawHistory = Array.isArray(data.historial)
            ? data.historial
            : (Array.isArray(data.history) ? data.history : []);
        const seen = new Set();
        const tickets = rawTickets
            .concat(rawHistory)
            .slice(0, MAX_TICKETS)
            .map(normalizeTicket)
            .filter(Boolean)
            .filter((ticket) => {
                if (seen.has(ticket.ticketId)) return false;
                seen.add(ticket.ticketId);
                return true;
            })
            .sort((a, b) => {
                const activeDifference = Number(!ESTADOS_ABIERTOS.has(a.status)) - Number(!ESTADOS_ABIERTOS.has(b.status));
                if (activeDifference) return activeDifference;
                const statusDifference = Number(a.status === "atendida") - Number(b.status === "atendida");
                if (statusDifference) return statusDifference;
                return (a.requestedTs || Number.MAX_SAFE_INTEGER) - (b.requestedTs || Number.MAX_SAFE_INTEGER);
            });
        return {
            revision: Math.max(0, Math.floor(Number(data.revision) || 0)),
            ts: normalizeTimestamp(data.ts ?? data.timestamp),
            tickets
        };
    }

    function selectedTicket() {
        return state.tickets.find((ticket) => ticket.ticketId === state.selectedId) || null;
    }

    function isOpen(ticket) {
        return Boolean(ticket && ESTADOS_ABIERTOS.has(ticket.status));
    }

    function relativeAge(timestamp, now = Date.now()) {
        if (!timestamp) return "AHORA";
        const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
        if (seconds < 5) return "AHORA";
        if (seconds < 60) return `HACE ${seconds} S`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `HACE ${minutes} MIN`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `HACE ${hours} H`;
        return `HACE ${Math.floor(hours / 24)} D`;
    }

    function statusLabel(status) {
        return ({
            solicitada: "PENDIENTE",
            atendida: "EN ATENCIÓN",
            resuelta: "RESUELTA",
            cancelada: "CANCELADA"
        })[status] || "PENDIENTE";
    }

    function diagnosticLabel(status) {
        return ({
            inactivo: "Sin solicitar",
            solicitado: "Activando vista segura",
            activo: "Compartiendo con permiso",
            rechazado: "Permiso rechazado",
            caducado: "Permiso caducado",
            detenido: "Diagnóstico detenido"
        })[status] || "Sin solicitar";
    }

    function setText(id, value) {
        const element = getEl(id);
        if (element) element.textContent = value;
    }

    function setButtonDisabled(id, disabled) {
        const button = getEl(id);
        if (!button) return;
        button.disabled = Boolean(disabled);
        button.setAttribute("aria-disabled", disabled ? "true" : "false");
    }

    function setHidden(id, hidden) {
        const element = getEl(id);
        if (element) element.hidden = Boolean(hidden);
    }

    function renderList() {
        const list = getEl("asistencia_lista");
        if (!list || !global.document) return;
        const activeCount = state.tickets.filter(isOpen).length;
        list.replaceChildren();
        state.tickets.forEach((ticket) => {
            const item = global.document.createElement("li");
            const button = global.document.createElement("button");
            const swatch = global.document.createElement("span");
            const copy = global.document.createElement("span");
            const name = global.document.createElement("strong");
            const meta = global.document.createElement("span");
            const status = global.document.createElement("span");
            button.type = "button";
            button.className = `asistencia-ticket ${ticket.team.className}`;
            button.dataset.ticketId = ticket.ticketId;
            button.dataset.status = ticket.status;
            button.setAttribute("aria-pressed", ticket.ticketId === state.selectedId ? "true" : "false");
            button.setAttribute("aria-label", `${ticket.museName}, ${ticket.team.label}, bandera ${ticket.colorName}, ${statusLabel(ticket.status)}, ${relativeAge(ticket.requestedTs)}`);
            swatch.className = "asistencia-ticket__flag";
            swatch.style.setProperty("--help-flag", ticket.color);
            swatch.setAttribute("aria-hidden", "true");
            copy.className = "asistencia-ticket__copy";
            name.textContent = ticket.museName;
            meta.className = "asistencia-ticket__meta";
            meta.textContent = `${ticket.team.label} · ${ticket.colorName} · ${relativeAge(ticket.requestedTs)}`;
            status.className = "asistencia-ticket__status";
            status.textContent = statusLabel(ticket.status);
            copy.append(name, meta);
            button.append(swatch, copy, status);
            button.addEventListener("click", () => selectTicket(ticket.ticketId));
            item.append(button);
            list.append(item);
        });
        setHidden("asistencia_lista_vacia", state.tickets.length > 0);
        setText("asistencia_contador", `${activeCount} ${activeCount === 1 ? "activa" : "activas"}`);
        const tabCounter = getEl("asistencia_tab_contador");
        if (tabCounter) {
            tabCounter.textContent = String(activeCount);
            tabCounter.dataset.active = activeCount > 0 ? "1" : "0";
            tabCounter.setAttribute("aria-label", `${activeCount} ${activeCount === 1 ? "incidencia activa" : "incidencias activas"}`);
        }
    }

    function renderDiagnosticFacts(ticket, frame) {
        const diagnostic = ticket ? ticket.diagnostic : normalizeDiagnostic();
        const meta = frame && frame.meta ? frame.meta : {};
        const path = meta.path || diagnostic.path;
        const viewport = meta.viewport && meta.viewport.width ? meta.viewport : diagnostic.viewport;
        const online = typeof meta.online === "boolean" ? meta.online : diagnostic.online;
        const socketConnected = typeof meta.socketConnected === "boolean" ? meta.socketConnected : diagnostic.socketConnected;
        setText("asistencia_diagnostico_ruta", path || "—");
        setText("asistencia_diagnostico_viewport", viewport.width && viewport.height ? `${viewport.width} × ${viewport.height}` : "—");
        let connection = "—";
        if (online !== null || socketConnected !== null) {
            connection = `${online === false ? "SIN RED" : "RED OK"} · ${socketConnected === false ? "SOCKET CAÍDO" : "SOCKET OK"}`;
        }
        setText("asistencia_diagnostico_conexion", connection);
    }

    function renderPreview(ticket) {
        const shell = getEl("asistencia_preview_shell");
        const image = getEl("asistencia_preview");
        const fallback = getEl("asistencia_preview_fallback");
        if (!shell || !image || !fallback || !ticket) return;
        const frame = frames.get(ticket.ticketId) || null;
        const active = ticket.diagnostic.status === "activo" && Boolean(ticket.diagnostic.sessionId);
        const validFrame = active && frame && frame.sessionId === ticket.diagnostic.sessionId;
        shell.dataset.state = validFrame ? "live" : ticket.diagnostic.status;
        image.hidden = !validFrame;
        fallback.hidden = Boolean(validFrame);
        if (validFrame) {
            if (image.src !== frame.src) image.src = frame.src;
            setText("asistencia_ultimo_frame", `Imagen ${relativeAge(frame.ts)}`);
        } else {
            image.removeAttribute("src");
            let title = "VISTA BLOQUEADA";
            let detail = "Solicita permiso para iniciar el diagnóstico.";
            if (ticket.diagnostic.status === "solicitado") {
                title = "ESPERANDO A LA MUSA";
                detail = "Activando la vista segura autorizada para esta incidencia.";
            } else if (ticket.diagnostic.status === "activo") {
                title = "CONECTANDO VISTA";
                detail = "Permiso aceptado. Esperando la primera imagen segura.";
            } else if (ticket.diagnostic.status === "rechazado") {
                title = "PERMISO RECHAZADO";
                detail = "La musa decidió no compartir su pantalla.";
            } else if (ticket.diagnostic.status === "caducado") {
                title = "PERMISO CADUCADO";
                detail = "Solicita un nuevo permiso para continuar.";
            }
            if (ticket.diagnostic.lastError) detail = ticket.diagnostic.lastError;
            setText("asistencia_preview_fallback_title", title);
            setText("asistencia_preview_fallback_detail", detail);
            setText("asistencia_ultimo_frame", ticket.diagnostic.lastFrameTs
                ? `Última imagen ${relativeAge(ticket.diagnostic.lastFrameTs)}`
                : "Sin imagen recibida");
        }
        renderDiagnosticFacts(ticket, frame);
    }

    function renderDetail() {
        const ticket = selectedTicket();
        setHidden("asistencia_sin_seleccion", Boolean(ticket));
        setHidden("asistencia_incidente", !ticket);
        if (!ticket) return;
        const open = isOpen(ticket);
        const busy = pending.has(ticket.ticketId);
        const diagnosticActive = ticket.diagnostic.status === "activo" && Boolean(ticket.diagnostic.sessionId);
        const diagnosticPending = ticket.diagnostic.status === "solicitado";
        setText("asistencia_nombre", ticket.museName);
        setText("asistencia_meta", `${ticket.team.label} · BANDERA ${ticket.colorName} · ${relativeAge(ticket.requestedTs)} · ${ticket.connected ? "CONECTADA" : "DESCONECTADA"}`);
        const status = getEl("asistencia_estado");
        if (status) {
            status.textContent = statusLabel(ticket.status);
            status.dataset.status = ticket.status;
        }
        const flag = getEl("asistencia_color");
        if (flag) {
            flag.style.setProperty("--help-flag", ticket.color);
            flag.title = `Bandera ${ticket.colorName} (${ticket.color})`;
        }
        setText("asistencia_diagnostico_estado", diagnosticLabel(ticket.diagnostic.status));
        const consent = getEl("asistencia_diagnostico_ayuda");
        if (consent) {
            consent.dataset.state = ticket.diagnostic.status;
            consent.textContent = diagnosticActive
                ? "Autorización temporal activa: el control se limita a tocar, desplazar, volver y reconectar. La musa puede revocarla cancelando."
                : (diagnosticPending
                    ? "Abriendo la vista segura que la musa autorizó al confirmar su petición de ayuda."
                    : "La musa ya autorizó temporalmente esta página al pedir ayuda y puede revocarlo cancelando. No permite escribir ni acceder a cámara, micrófono u otras aplicaciones.");
        }
        setButtonDisabled("asistencia_atender", !state.connected || busy || ticket.status !== "solicitada");
        setButtonDisabled("asistencia_resolver", !state.connected || busy || !open);
        setButtonDisabled("asistencia_cancelar", !state.connected || busy || !open);
        setButtonDisabled("asistencia_recargar", !state.connected || busy || !open || !ticket.connected);
        setButtonDisabled("asistencia_diagnostico_abrir", !state.connected || busy || !open || !ticket.connected || diagnosticActive || diagnosticPending);
        setButtonDisabled("asistencia_diagnostico_cerrar", !state.connected || busy || !(diagnosticActive || diagnosticPending));
        setHidden("asistencia_diagnostico_abrir", diagnosticActive || diagnosticPending);
        setHidden("asistencia_diagnostico_cerrar", !(diagnosticActive || diagnosticPending));
        ["asistencia_scroll_arriba", "asistencia_scroll_abajo", "asistencia_volver", "asistencia_reconectar"].forEach((id) => {
            setButtonDisabled(id, !state.connected || !diagnosticActive || busy);
        });
        renderPreview(ticket);
    }

    function renderGlobalStatus() {
        const refresh = getEl("asistencia_actualizar");
        if (refresh) {
            refresh.disabled = !state.connected;
            refresh.setAttribute("aria-disabled", state.connected ? "false" : "true");
        }
        let text = "Asistencia sincronizada.";
        if (!state.connected) text = "Sin conexión con el servidor.";
        else if (!state.synced) text = "Sincronizando incidencias…";
        else if (state.error) text = state.error;
        else if (state.message) text = state.message;
        else {
            const active = state.tickets.filter(isOpen).length;
            text = active ? `${active} ${active === 1 ? "musa necesita" : "musas necesitan"} atención.` : "No hay peticiones activas.";
        }
        const status = getEl("asistencia_estado_global");
        if (status) {
            status.textContent = text;
            status.dataset.state = state.error ? "error" : (!state.connected ? "offline" : "ready");
        }
    }

    function render() {
        renderList();
        renderDetail();
        renderGlobalStatus();
    }

    function refreshRelativeTimes() {
        if (!global.document) return;
        const ticketButtons = new Map(
            Array.from(global.document.querySelectorAll(".asistencia-ticket"))
                .map((button) => [button.dataset.ticketId, button])
        );
        state.tickets.forEach((ticket) => {
            const button = ticketButtons.get(ticket.ticketId);
            if (!button) return;
            const meta = button.querySelector(".asistencia-ticket__meta");
            if (meta) meta.textContent = `${ticket.team.label} · ${ticket.colorName} · ${relativeAge(ticket.requestedTs)}`;
            button.setAttribute("aria-label", `${ticket.museName}, ${ticket.team.label}, bandera ${ticket.colorName}, ${statusLabel(ticket.status)}, ${relativeAge(ticket.requestedTs)}`);
        });
        const ticket = selectedTicket();
        if (!ticket) return;
        setText("asistencia_meta", `${ticket.team.label} · BANDERA ${ticket.colorName} · ${relativeAge(ticket.requestedTs)} · ${ticket.connected ? "CONECTADA" : "DESCONECTADA"}`);
        const frame = frames.get(ticket.ticketId);
        if (frame && ticket.diagnostic.status === "activo" && frame.sessionId === ticket.diagnostic.sessionId) {
            setText("asistencia_ultimo_frame", `Imagen ${relativeAge(frame.ts)}`);
        } else if (ticket.diagnostic.lastFrameTs) {
            setText("asistencia_ultimo_frame", `Última imagen ${relativeAge(ticket.diagnostic.lastFrameTs)}`);
        }
    }

    function applyState(payload = {}) {
        const normalized = normalizeState(payload);
        const ids = new Set(normalized.tickets.map((ticket) => ticket.ticketId));
        for (const ticketId of frames.keys()) {
            if (!ids.has(ticketId)) frames.delete(ticketId);
        }
        let selectedId = ids.has(state.selectedId) ? state.selectedId : "";
        if (!selectedId) {
            const firstOpen = normalized.tickets.find(isOpen);
            selectedId = firstOpen ? firstOpen.ticketId : (normalized.tickets[0] ? normalized.tickets[0].ticketId : "");
        }
        pending.forEach((entry) => {
            if (entry.timeout) global.clearTimeout(entry.timeout);
        });
        pending.clear();
        state = {
            ...state,
            ...normalized,
            synced: true,
            selectedId,
            message: "",
            error: ""
        };
        render();
        return getState();
    }

    function markConnected(connected) {
        const next = Boolean(connected);
        if (!next) {
            pending.forEach((entry) => {
                if (entry.timeout) global.clearTimeout(entry.timeout);
            });
            pending.clear();
        }
        state.connected = next;
        state.synced = next ? state.synced : false;
        state.error = "";
        state.message = next ? "Esperando el estado de asistencia." : "";
        render();
    }

    function createRequestId() {
        requestCounter += 1;
        return `control-help-${Date.now().toString(36)}-${requestCounter.toString(36)}`;
    }

    function errorMessage(response) {
        const code = cleanText(response && (response.code || response.error || response.message), 80);
        return ({
            CONSENT_REQUIRED: "La musa todavía no ha autorizado el diagnóstico.",
            DIAGNOSTIC_INACTIVE: "El diagnóstico ya no está activo.",
            DIAGNOSTIC_NOT_ACTIVE: "El diagnóstico ya no está activo.",
            DIAGNOSTIC_NOT_REQUESTED: "Primero hay que solicitar el diagnóstico.",
            STALE_DIAGNOSTIC: "El permiso de diagnóstico ha caducado.",
            NOT_AUTHORIZED: "La musa todavía no ha autorizado el diagnóstico.",
            MUSE_DISCONNECTED: "La musa está desconectada.",
            STALE_TICKET: "La incidencia ya no está activa.",
            FORBIDDEN: "El servidor rechazó esta acción.",
            RATE_LIMITED: "Demasiadas órdenes seguidas. Espera un instante."
        })[code] || code || "El servidor rechazó la operación.";
    }

    function finishPending(ticketId, requestId) {
        const entry = pending.get(ticketId);
        if (!entry || entry.requestId !== requestId) return false;
        if (entry.timeout) global.clearTimeout(entry.timeout);
        pending.delete(ticketId);
        return true;
    }

    function emitAction(eventName, extra = {}, label = "Enviando operación…") {
        const ticket = selectedTicket();
        const socketNow = getSocket();
        if (!ticket || !state.connected || !socketNow || !socketNow.connected || typeof socketNow.emit !== "function") {
            state.error = "Control no está conectado al servidor.";
            renderGlobalStatus();
            return false;
        }
        if (pending.has(ticket.ticketId)) return false;
        const requestId = createRequestId();
        const payload = { ticket_id: ticket.ticketId, request_id: requestId, ...extra };
        const entry = { requestId, eventName, timeout: null };
        entry.timeout = global.setTimeout(() => {
            if (!finishPending(ticket.ticketId, requestId)) return;
            state.error = "El servidor no confirmó la operación. Revisa la conexión.";
            render();
        }, ACK_TIMEOUT_MS);
        pending.set(ticket.ticketId, entry);
        state.message = label;
        state.error = "";
        render();
        try {
            socketNow.emit(eventName, payload, (response = {}) => {
                if (!finishPending(ticket.ticketId, requestId)) return;
                if (!response || response.ok === false || response.success === false) {
                    state.error = errorMessage(response);
                    state.message = "";
                    render();
                    return;
                }
                if (response.estado || response.state || response.tickets || response.incidencias) {
                    applyState(response);
                    return;
                }
                state.message = "Operación confirmada.";
                state.error = "";
                render();
            });
        } catch (_) {
            finishPending(ticket.ticketId, requestId);
            state.error = "No se pudo enviar la operación al servidor.";
            state.message = "";
            render();
            return false;
        }
        return true;
    }

    function requestState() {
        const socketNow = getSocket();
        if (!socketNow || !socketNow.connected || typeof socketNow.emit !== "function") {
            state.error = "Control no está conectado al servidor.";
            renderGlobalStatus();
            return false;
        }
        state.message = "Actualizando incidencias…";
        state.error = "";
        renderGlobalStatus();
        socketNow.emit("pedir_ayuda_musas_estado", {}, (response = {}) => {
            if (response && response.ok === false) {
                state.error = errorMessage(response);
                state.message = "";
                renderGlobalStatus();
                return;
            }
            if (response && (response.estado || response.state || response.tickets || response.incidencias)) {
                applyState(response);
            }
        });
        return true;
    }

    function selectTicket(ticketId) {
        const safeId = cleanText(ticketId, 128);
        if (!state.tickets.some((ticket) => ticket.ticketId === safeId)) return false;
        state.selectedId = safeId;
        state.error = "";
        state.message = "";
        render();
        return true;
    }

    function attend() {
        return emitAction("ayuda_musa_atender", {}, "Marcando la incidencia como atendida…");
    }

    function resolve(resolution = "resuelta") {
        const normalized = resolution === "cancelada" ? "cancelada" : "resuelta";
        return emitAction(
            "ayuda_musa_resolver",
            { resolucion: normalized },
            normalized === "cancelada" ? "Cancelando la incidencia…" : "Cerrando la incidencia…"
        );
    }

    function reloadMuse() {
        const ticket = selectedTicket();
        if (!ticket) return false;
        const accepted = typeof global.confirm !== "function" || global.confirm(
            `¿Recargar ahora la página de ${ticket.museName}? Perderá cualquier dato local que no se haya enviado.`
        );
        if (!accepted) return false;
        return emitAction("ayuda_musa_recargar", {}, "Solicitando la recarga exacta de la musa…");
    }

    function requestDiagnostic() {
        return emitAction("ayuda_musa_diagnostico_solicitar", {}, "Abriendo el diagnóstico autorizado…");
    }

    function stopDiagnostic() {
        return emitAction("ayuda_musa_diagnostico_detener", {}, "Deteniendo el diagnóstico…");
    }

    function emitRemoteCommand(type, data = {}) {
        const ticket = selectedTicket();
        if (!ticket || ticket.diagnostic.status !== "activo" || !ticket.diagnostic.sessionId) return false;
        const now = Date.now();
        if (now - lastRemoteCommandAt < 80) return false;
        lastRemoteCommandAt = now;
        const safeTypes = new Set(["tap", "scroll", "back", "reconnect"]);
        if (!safeTypes.has(type)) return false;
        const extra = { session_id: ticket.diagnostic.sessionId, tipo: type };
        if (type === "tap") {
            extra.x = clamp(Number(data.x) || 0, 0, 1);
            extra.y = clamp(Number(data.y) || 0, 0, 1);
        } else if (type === "scroll") {
            extra.delta_x = clamp(Math.round(Number(data.deltaX) || 0), -1200, 1200);
            extra.delta_y = clamp(Math.round(Number(data.deltaY) || 0), -1200, 1200);
        }
        return emitAction("ayuda_musa_comando_remoto", extra, `Enviando orden remota: ${type}…`);
    }

    function normalizeFrame(payload = {}) {
        const frame = payload && typeof payload === "object" ? payload : {};
        const ticketId = cleanText(frame.ticket_id ?? frame.ticketId, 128);
        const sessionId = cleanText(frame.session_id ?? frame.sessionId, 128);
        const mime = cleanText(frame.mime, 32).toLowerCase();
        const data = typeof frame.data === "string" ? frame.data : "";
        const seq = Math.max(0, Math.floor(Number(frame.seq) || 0));
        if (!ticketId || !sessionId || !FRAME_MIMES.has(mime)) return null;
        if (!data || data.length > MAX_FRAME_BASE64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) return null;
        return {
            ticketId,
            sessionId,
            seq,
            mime,
            src: `data:${mime};base64,${data}`,
            width: clamp(Math.round(Number(frame.width) || 0), 0, 10000),
            height: clamp(Math.round(Number(frame.height) || 0), 0, 10000),
            ts: normalizeTimestamp(frame.ts) || Date.now(),
            meta: {
                path: normalizePath(frame.ruta ?? frame.path),
                viewport: normalizeViewport(frame.viewport || { width: frame.viewport_width, height: frame.viewport_height }),
                online: typeof frame.online === "boolean" ? frame.online : null,
                socketConnected: typeof frame.socket_conectado === "boolean" ? frame.socket_conectado : null,
                lastError: cleanText(frame.ultimo_error, 240)
            }
        };
    }

    function processFrame(payload = {}) {
        const frame = normalizeFrame(payload);
        if (!frame) return false;
        const ticket = state.tickets.find((item) => item.ticketId === frame.ticketId);
        if (!ticket || ticket.diagnostic.status !== "activo" || ticket.diagnostic.sessionId !== frame.sessionId) return false;
        const previous = frames.get(frame.ticketId);
        if (previous && frame.seq <= previous.seq) return false;
        frames.set(frame.ticketId, frame);
        if (state.selectedId === frame.ticketId) {
            renderPreview(ticket);
        }
        return true;
    }

    function calculateContainedTap({ clientX, clientY, box, sourceWidth, sourceHeight } = {}) {
        const rect = box && typeof box === "object" ? box : {};
        const boxWidth = Number(rect.width) || 0;
        const boxHeight = Number(rect.height) || 0;
        const sourceW = Number(sourceWidth) || 0;
        const sourceH = Number(sourceHeight) || 0;
        const pointerX = Number(clientX);
        const pointerY = Number(clientY);
        if (!boxWidth || !boxHeight || !sourceW || !sourceH || !Number.isFinite(pointerX) || !Number.isFinite(pointerY)) {
            return null;
        }
        const sourceAspect = sourceW / sourceH;
        const boxAspect = boxWidth / boxHeight;
        let renderedWidth = boxWidth;
        let renderedHeight = boxHeight;
        let renderedLeft = Number(rect.left) || 0;
        let renderedTop = Number(rect.top) || 0;
        if (sourceAspect > boxAspect) {
            renderedHeight = renderedWidth / sourceAspect;
            renderedTop += (boxHeight - renderedHeight) / 2;
        } else {
            renderedWidth = renderedHeight * sourceAspect;
            renderedLeft += (boxWidth - renderedWidth) / 2;
        }
        if (pointerX < renderedLeft || pointerX > renderedLeft + renderedWidth
            || pointerY < renderedTop || pointerY > renderedTop + renderedHeight) return null;
        return {
            x: clamp((pointerX - renderedLeft) / renderedWidth, 0, 1),
            y: clamp((pointerY - renderedTop) / renderedHeight, 0, 1)
        };
    }

    function handlePreviewTap(event) {
        const shell = getEl("asistencia_preview_shell");
        const image = getEl("asistencia_preview");
        if (!shell || !image || image.hidden || typeof image.getBoundingClientRect !== "function") return;
        const imageRect = image.getBoundingClientRect();
        const shellRect = typeof shell.getBoundingClientRect === "function" ? shell.getBoundingClientRect() : imageRect;
        const frame = frames.get(state.selectedId);
        const sourceWidth = Number(image.naturalWidth) || Number(frame && frame.width) || 0;
        const sourceHeight = Number(image.naturalHeight) || Number(frame && frame.height) || 0;
        if (!imageRect.width || !imageRect.height || !sourceWidth || !sourceHeight) return;
        const clientX = Number(event.clientX);
        const clientY = Number(event.clientY);
        const point = calculateContainedTap({
            clientX,
            clientY,
            box: imageRect,
            sourceWidth,
            sourceHeight
        });
        if (!point || !emitRemoteCommand("tap", point)) return;
        const cursor = getEl("asistencia_preview_cursor");
        if (cursor) {
            cursor.style.left = `${clamp((clientX - shellRect.left) / shellRect.width, 0, 1) * 100}%`;
            cursor.style.top = `${clamp((clientY - shellRect.top) / shellRect.height, 0, 1) * 100}%`;
            cursor.classList.remove("is-visible");
            void cursor.offsetWidth;
            cursor.classList.add("is-visible");
            if (cursorTimer) global.clearTimeout(cursorTimer);
            cursorTimer = global.setTimeout(() => cursor.classList.remove("is-visible"), 520);
        }
    }

    function initialize() {
        if (initialized || !global.document || !getEl("asistencia_control")) return;
        initialized = true;
        const on = (id, event, handler, options) => {
            const element = getEl(id);
            if (element) element.addEventListener(event, handler, options);
        };
        on("asistencia_actualizar", "click", requestState);
        on("asistencia_atender", "click", attend);
        on("asistencia_resolver", "click", () => resolve("resuelta"));
        on("asistencia_cancelar", "click", () => resolve("cancelada"));
        on("asistencia_recargar", "click", reloadMuse);
        on("asistencia_diagnostico_abrir", "click", requestDiagnostic);
        on("asistencia_diagnostico_cerrar", "click", stopDiagnostic);
        on("asistencia_scroll_arriba", "click", () => emitRemoteCommand("scroll", { deltaY: -620 }));
        on("asistencia_scroll_abajo", "click", () => emitRemoteCommand("scroll", { deltaY: 620 }));
        on("asistencia_volver", "click", () => emitRemoteCommand("back"));
        on("asistencia_reconectar", "click", () => emitRemoteCommand("reconnect"));
        on("asistencia_preview_shell", "click", handlePreviewTap);
        on("asistencia_preview_shell", "wheel", (event) => {
            const ticket = selectedTicket();
            if (!ticket || ticket.diagnostic.status !== "activo") return;
            event.preventDefault();
            emitRemoteCommand("scroll", { deltaX: event.deltaX, deltaY: event.deltaY });
        }, { passive: false });
        ageInterval = global.setInterval(() => {
            refreshRelativeTimes();
        }, 1000);
        const socketNow = getSocket();
        markConnected(Boolean(socketNow && socketNow.connected));
    }

    function getState() {
        return {
            connected: state.connected,
            synced: state.synced,
            revision: state.revision,
            ts: state.ts,
            tickets: state.tickets.map((ticket) => ({
                ...ticket,
                team: { ...ticket.team },
                diagnostic: { ...ticket.diagnostic, viewport: { ...ticket.diagnostic.viewport } }
            })),
            selectedId: state.selectedId,
            message: state.message,
            error: state.error
        };
    }

    const api = Object.freeze({
        aplicarEstado: applyState,
        atender: attend,
        calcularTapContenido: calculateContainedTap,
        cancelar: () => resolve("cancelada"),
        detenerDiagnostico: stopDiagnostic,
        enviarComandoRemoto: emitRemoteCommand,
        inicializar: initialize,
        marcarConexion: markConnected,
        normalizarEstado: normalizeState,
        normalizarFrame: normalizeFrame,
        obtenerEstado: getState,
        pedirEstado: requestState,
        procesarFrame: processFrame,
        recargarMusa: reloadMuse,
        resolver: () => resolve("resuelta"),
        seleccionar: selectTicket,
        solicitarDiagnostico: requestDiagnostic
    });
    global.ScribMuseHelpControl = api;

    if (global.document && global.document.readyState === "loading") {
        global.document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})(window);
