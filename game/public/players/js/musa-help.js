(function instalarAyudaMusa(global, factory) {
    "use strict";

    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (global) global.ScribMusaHelp = api;
})(typeof window !== "undefined" ? window : null, function crearApiAyudaMusa() {
    "use strict";

    const EVENTOS = Object.freeze({
        pedirEstado: "pedir_ayuda_musa_estado",
        estado: "ayuda_musa_estado",
        solicitar: "ayuda_musa_solicitar",
        cancelar: "ayuda_musa_cancelar",
        diagnosticoSolicitud: "ayuda_musa_diagnostico_solicitud",
        diagnosticoConsentir: "ayuda_musa_diagnostico_consentir",
        diagnosticoFrame: "ayuda_musa_diagnostico_frame",
        comando: "ayuda_musa_comando_remoto",
        comandoResultado: "ayuda_musa_comando_resultado",
        recargar: "recargar_rol_remoto"
    });
    const ESTADOS_ACTIVOS = new Set(["pendiente", "atendiendo"]);
    const TIPOS_COMANDO = new Set(["tap", "scroll", "back", "reconnect"]);
    const MAX_FRAME_BASE64 = 420000;
    const INTERVALO_FRAME_MS = 1000;
    const MAX_DIAGNOSTICO_MS = 5 * 60 * 1000;
    const CONSENT_KEY_PREFIX = "scrib_musa_help_consent:";

    function textoSeguro(valor, maximo) {
        return String(valor == null ? "" : valor)
            .replace(/[\u0000-\u001f\u007f]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, maximo);
    }

    function normalizarHex(valor, fallback) {
        const limpio = textoSeguro(valor, 16).toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(limpio)) return limpio;
        if (/^#[0-9a-f]{3}$/.test(limpio)) {
            return `#${limpio[1]}${limpio[1]}${limpio[2]}${limpio[2]}${limpio[3]}${limpio[3]}`;
        }
        return fallback || "#ffd60a";
    }

    function tintaParaColor(valor) {
        const color = normalizarHex(valor, "#ffd60a");
        const canales = [1, 3, 5].map((indice) => parseInt(color.slice(indice, indice + 2), 16) / 255);
        const lineales = canales.map((canal) => (
            canal <= 0.03928 ? canal / 12.92 : Math.pow((canal + 0.055) / 1.055, 2.4)
        ));
        const luminancia = (0.2126 * lineales[0]) + (0.7152 * lineales[1]) + (0.0722 * lineales[2]);
        return luminancia > 0.43 ? "#071018" : "#ffffff";
    }

    function normalizarEstadoDiagnostico(valor) {
        const estado = textoSeguro(valor, 18).toLowerCase();
        return new Set(["inactivo", "solicitado", "activo"]).has(estado) ? estado : "inactivo";
    }

    function normalizarTicket(valor) {
        if (!valor || typeof valor !== "object") return null;
        const ticketId = textoSeguro(valor.ticket_id, 96);
        const estado = textoSeguro(valor.estado, 20).toLowerCase();
        if (!ticketId || !ESTADOS_ACTIVOS.has(estado)) return null;
        const color = normalizarHex(valor.color, "#ffd60a");
        const diagnosticoRaw = valor.diagnostico && typeof valor.diagnostico === "object"
            ? valor.diagnostico
            : {};
        return {
            ticket_id: ticketId,
            nombre_musa: textoSeguro(valor.nombre_musa, 24) || "MUSA",
            equipo: Number(valor.equipo || valor.player) === 2 ? 2 : 1,
            color,
            color_nombre: textoSeguro(valor.color_nombre, 24).toUpperCase() || "AMARILLO",
            estado,
            solicitado_ts: Math.max(0, Number(valor.solicitado_ts) || 0),
            atendido_ts: Math.max(0, Number(valor.atendido_ts) || 0),
            conectada: valor.conectada !== false,
            diagnostico: {
                estado: normalizarEstadoDiagnostico(diagnosticoRaw.estado),
                expires_ts: Math.max(0, Number(diagnosticoRaw.expires_ts) || 0),
                ultimo_frame_ts: Math.max(0, Number(diagnosticoRaw.ultimo_frame_ts) || 0)
            }
        };
    }

    function normalizarEstado(payload) {
        const raw = payload && payload.estado && typeof payload.estado === "object"
            ? payload.estado
            : payload;
        return {
            version: Math.max(0, Number(raw && raw.version) || 0),
            revision: Math.max(0, Number(raw && raw.revision) || 0),
            ts: Math.max(0, Number(raw && raw.ts) || 0),
            ticket: normalizarTicket(raw && raw.ticket)
        };
    }

    function normalizarComando(payload) {
        const raw = payload && payload.comando && typeof payload.comando === "object"
            ? { ...payload, ...payload.comando }
            : (payload || {});
        const tipo = textoSeguro(raw.tipo, 20).toLowerCase();
        const commandId = textoSeguro(raw.command_id, 96);
        const ticketId = textoSeguro(raw.ticket_id, 96);
        const sessionId = textoSeguro(raw.session_id, 96);
        if (!TIPOS_COMANDO.has(tipo) || !commandId || !ticketId || !sessionId) return null;
        const salida = { tipo, command_id: commandId, ticket_id: ticketId, session_id: sessionId };
        if (tipo === "tap") {
            const x = Number(raw.x);
            const y = Number(raw.y);
            if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return null;
            salida.x = x;
            salida.y = y;
        }
        if (tipo === "scroll") {
            const deltaX = Number(raw.delta_x != null ? raw.delta_x : raw.x);
            const deltaY = Number(raw.delta_y != null ? raw.delta_y : raw.y);
            salida.delta_x = Number.isFinite(deltaX) ? Math.max(-1200, Math.min(1200, deltaX)) : 0;
            salida.delta_y = Number.isFinite(deltaY) ? Math.max(-1200, Math.min(1200, deltaY)) : 0;
        }
        return salida;
    }

    function crearRequestId(globalRef) {
        const cryptoRef = globalRef && globalRef.crypto;
        if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
            return `mhelp_${cryptoRef.randomUUID().replace(/-/g, "")}`;
        }
        const aleatorio = Math.random().toString(36).slice(2, 12);
        return `mhelp_${Date.now().toString(36)}_${aleatorio}`;
    }

    function esControlTextual(elemento) {
        if (!elemento || elemento.nodeType !== 1) return false;
        if (elemento.matches("input, textarea, select, option")) return true;
        if (elemento.isContentEditable || elemento.closest("[contenteditable='true'], [contenteditable='']")) return true;
        return false;
    }

    function obtenerObjetivoTap(elemento) {
        if (!elemento || elemento.nodeType !== 1 || esControlTextual(elemento)) return null;
        const objetivo = elemento.closest("button, [role='button'], [onclick]");
        if (!objetivo || esControlTextual(objetivo)) return null;
        if (objetivo.matches("a") || objetivo.closest("a")) return null;
        if (objetivo.matches(":disabled, [aria-disabled='true']")) return null;
        return objetivo;
    }

    function obtenerAvisoAtencion(ticket, diagnosticoLocal) {
        if (!ticket || ticket.estado !== "atendiendo") {
            return { visible: false, diagnostico: false, texto: "" };
        }
        const diagnosticoActivo = Boolean(diagnosticoLocal)
            || (ticket.diagnostico && ticket.diagnostico.estado === "activo");
        return {
            visible: true,
            diagnostico: diagnosticoActivo,
            texto: diagnosticoActivo
                ? "ESTAMOS REVISANDO ESTA PÁGINA"
                : "YA TE ESTÁN ATENDIENDO"
        };
    }

    function crearControlador(opciones) {
        const options = opciones || {};
        const globalRef = options.windowRef || (typeof window !== "undefined" ? window : null);
        const documentRef = options.documentRef || (globalRef && globalRef.document);
        const socket = options.socket;
        if (!globalRef || !documentRef || !socket || typeof socket.on !== "function" || typeof socket.emit !== "function") {
            throw new Error("Ayuda Musa necesita ventana, documento y socket.");
        }

        const estadoLocal = {
            revision: -1,
            ticket: null,
            solicitudPendiente: false,
            consentimientoPendiente: false,
            banderaMinimizada: false,
            diagnostico: null,
            frameSeq: 0,
            frameTimer: null,
            frameEnCurso: false,
            ultimoError: "",
            errorAyuda: "",
            registroListo: false,
            comandosVistos: new Set(),
            remoteActivityTimer: null,
            destruido: false
        };

        function crearInterfaz() {
            const fab = documentRef.createElement("button");
            fab.id = "musa_help_fab";
            fab.className = "musa-help-fab";
            fab.type = "button";
            fab.dataset.state = "idle";
            fab.setAttribute("aria-haspopup", "dialog");
            fab.setAttribute("aria-controls", "musa_help_confirm musa_help_flag");
            fab.setAttribute("aria-expanded", "false");
            fab.setAttribute("aria-label", "Pedir ayuda");
            fab.innerHTML = [
                '<span class="musa-help-fab__icon" aria-hidden="true">!</span>',
                '<span class="musa-help-fab__copy">',
                '<span class="musa-help-fab__title">AYUDA</span>',
                '<span id="musa_help_fab_status" class="musa-help-fab__status">PEDIR ASISTENCIA</span>',
                "</span>"
            ].join("");

            const confirmacion = documentRef.createElement("div");
            confirmacion.id = "musa_help_confirm";
            confirmacion.className = "musa-help-confirm";
            confirmacion.hidden = true;
            confirmacion.dataset.musaHelpPrivate = "true";
            confirmacion.innerHTML = [
                '<section class="musa-help-confirm__card" role="dialog" aria-modal="true" aria-labelledby="musa_help_confirm_title" aria-describedby="musa_help_confirm_copy">',
                '<p class="musa-help-confirm__eyebrow">CANAL DE ASISTENCIA</p>',
                '<h2 id="musa_help_confirm_title" class="musa-help-confirm__title">¿PEDIR AYUDA?</h2>',
                '<p id="musa_help_confirm_copy" class="musa-help-confirm__copy">Enviaremos tu aviso al equipo y te daremos un color para encontrarte en la sala.</p>',
                '<p class="musa-help-confirm__privacy"><span aria-hidden="true">&#x1F512;</span><span>Si hace falta, podremos ayudarte dentro de esta página. Puedes cancelar la ayuda cuando quieras.</span></p>',
                '<div class="musa-help-confirm__actions">',
                '<button id="musa_help_confirm_cancel" class="musa-help-action musa-help-action--dark" type="button">VOLVER</button>',
                '<button id="musa_help_confirm_accept" class="musa-help-action musa-help-action--primary" type="button">SÍ, PEDIR AYUDA</button>',
                "</div>",
                '<p id="musa_help_confirm_feedback" class="musa-help-confirm__feedback" role="status" aria-live="polite"></p>',
                "</section>"
            ].join("");

            const bandera = documentRef.createElement("section");
            bandera.id = "musa_help_flag";
            bandera.className = "musa-help-flag";
            bandera.hidden = true;
            bandera.setAttribute("role", "dialog");
            bandera.setAttribute("aria-modal", "true");
            bandera.setAttribute("aria-labelledby", "musa_help_flag_title");
            bandera.innerHTML = [
                '<div class="musa-help-flag__card">',
                '<span class="musa-help-flag__symbol" aria-hidden="true">&#x1F6A9;</span>',
                '<h2 id="musa_help_flag_title" class="musa-help-flag__title">AGITA ESTA BANDERA EN EL AIRE</h2>',
                '<p class="musa-help-flag__copy">Levanta la pantalla y muévela para que el equipo pueda encontrarte</p>',
                '<div class="musa-help-flag__actions">',
                '<button id="musa_help_flag_minimize" class="musa-help-action musa-help-action--dark" type="button">MINIMIZAR BANDERA</button>',
                '<button id="musa_help_flag_cancel" class="musa-help-action musa-help-action--dark" type="button">CANCELAR AYUDA</button>',
                "</div>",
                "</div>"
            ].join("");

            const remoteIndicator = documentRef.createElement("div");
            remoteIndicator.id = "musa_help_remote_indicator";
            remoteIndicator.className = "musa-help-remote-indicator";
            remoteIndicator.hidden = true;
            remoteIndicator.setAttribute("role", "status");
            remoteIndicator.setAttribute("aria-live", "assertive");
            remoteIndicator.textContent = "ASISTENCIA REMOTA ACTIVA";

            const attendingHalo = documentRef.createElement("div");
            attendingHalo.id = "musa_help_attending_indicator";
            attendingHalo.className = "musa-help-attending-halo";
            attendingHalo.hidden = true;
            attendingHalo.setAttribute("role", "status");
            attendingHalo.setAttribute("aria-live", "polite");
            attendingHalo.setAttribute("aria-atomic", "true");
            const attendingHaloText = documentRef.createElement("span");
            attendingHaloText.id = "musa_help_attending_halo_text";
            attendingHaloText.className = "musa-help-attending-halo__text";
            attendingHaloText.textContent = "YA TE ESTÁN ATENDIENDO";
            attendingHalo.append(attendingHaloText);

            documentRef.body.append(fab, confirmacion, bandera, attendingHalo, remoteIndicator);
            return {
                fab,
                fabStatus: fab.querySelector("#musa_help_fab_status"),
                confirmacion,
                confirmAccept: confirmacion.querySelector("#musa_help_confirm_accept"),
                confirmCancel: confirmacion.querySelector("#musa_help_confirm_cancel"),
                confirmFeedback: confirmacion.querySelector("#musa_help_confirm_feedback"),
                bandera,
                flagMinimize: bandera.querySelector("#musa_help_flag_minimize"),
                flagCancel: bandera.querySelector("#musa_help_flag_cancel"),
                remoteIndicator,
                attendingHalo,
                attendingHaloText
            };
        }

        const ui = crearInterfaz();

        function enfocar(elemento) {
            if (!elemento || typeof elemento.focus !== "function") return;
            try { elemento.focus({ preventScroll: true }); } catch (_error) { elemento.focus(); }
        }

        function definirColor(color) {
            const seguro = normalizarHex(color, "#ffd60a");
            ui.fab.style.setProperty("--musa-help-color", seguro);
            ui.bandera.style.setProperty("--musa-help-color", seguro);
            const tinta = tintaParaColor(seguro);
            ui.fab.style.setProperty("--musa-help-ink", tinta);
            ui.bandera.style.setProperty("--musa-help-ink", tinta);
        }

        function claveConsentimiento(ticketId) {
            return `${CONSENT_KEY_PREFIX}${textoSeguro(ticketId, 96)}`;
        }

        function guardarConsentimiento(ticketId) {
            try { globalRef.sessionStorage.setItem(claveConsentimiento(ticketId), "1"); } catch (_error) {}
        }

        function tieneConsentimiento(ticketId) {
            try { return globalRef.sessionStorage.getItem(claveConsentimiento(ticketId)) === "1"; } catch (_error) { return false; }
        }

        function borrarConsentimiento(ticketId) {
            if (!ticketId) return;
            try { globalRef.sessionStorage.removeItem(claveConsentimiento(ticketId)); } catch (_error) {}
        }

        function abrirConfirmacion() {
            if (estadoLocal.ticket) {
                estadoLocal.banderaMinimizada = false;
                renderizar();
                return;
            }
            ui.confirmFeedback.textContent = "";
            ui.confirmacion.hidden = false;
            ui.fab.setAttribute("aria-expanded", "true");
            enfocar(ui.confirmAccept);
        }

        function cerrarConfirmacion() {
            ui.confirmacion.hidden = true;
            ui.fab.setAttribute("aria-expanded", estadoLocal.ticket && !estadoLocal.banderaMinimizada ? "true" : "false");
            enfocar(ui.fab);
        }

        function estadoVisualTicket(ticket) {
            if (!ticket) return { key: "idle", fab: "PEDIR ASISTENCIA" };
            if (estadoLocal.errorAyuda) {
                return { key: "attending", fab: "REINTENTA CANCELAR" };
            }
            if (estadoLocal.diagnostico || ticket.diagnostico.estado === "activo") {
                return { key: "diagnostic", fab: "REVISIÓN EN CURSO" };
            }
            if (ticket.estado === "atendiendo") {
                return { key: "attending", fab: "TE ESTÁN ATENDIENDO" };
            }
            return { key: "pending", fab: "AYUDA ENVIADA" };
        }

        function renderizar() {
            const ticket = estadoLocal.ticket;
            const visual = estadoVisualTicket(ticket);
            const avisoAtencion = obtenerAvisoAtencion(ticket, estadoLocal.diagnostico);
            ui.fab.dataset.state = estadoLocal.solicitudPendiente ? "pending" : visual.key;
            ui.fabStatus.textContent = estadoLocal.solicitudPendiente ? "ENVIANDO AVISO…" : visual.fab;
            ui.fab.setAttribute("aria-label", ticket ? "Ayuda activa" : "Pedir ayuda");
            ui.fab.disabled = estadoLocal.solicitudPendiente;
            ui.flagCancel.disabled = estadoLocal.solicitudPendiente;
            ui.attendingHalo.hidden = !avisoAtencion.visible;
            ui.attendingHalo.dataset.diagnostic = avisoAtencion.diagnostico ? "1" : "0";
            ui.attendingHaloText.textContent = avisoAtencion.texto || "YA TE ESTÁN ATENDIENDO";
            if (!ticket) {
                definirColor("#ffd60a");
                ui.bandera.hidden = true;
                ui.fab.setAttribute("aria-expanded", ui.confirmacion.hidden ? "false" : "true");
                return;
            }
            definirColor(ticket.color);
            ui.bandera.hidden = estadoLocal.banderaMinimizada;
            ui.fab.setAttribute("aria-expanded", ui.bandera.hidden ? "false" : "true");
        }

        function emitirConTimeout(evento, payload, callback, timeoutMs) {
            let resuelto = false;
            const timer = globalRef.setTimeout(() => {
                if (resuelto) return;
                resuelto = true;
                callback({ ok: false, code: "timeout" });
            }, timeoutMs || 6000);
            socket.emit(evento, payload, (respuesta) => {
                if (resuelto) return;
                resuelto = true;
                globalRef.clearTimeout(timer);
                callback(respuesta || { ok: false });
            });
        }

        function solicitarAyuda() {
            if (estadoLocal.ticket || estadoLocal.solicitudPendiente) return;
            if (!socket.connected || !estadoLocal.registroListo) {
                ui.confirmFeedback.textContent = socket.connected
                    ? "Estamos terminando de enlazar tu móvil. Espera un momento y vuelve a pulsar."
                    : "Todavía no hay conexión. Revisa el aviso de pantalla y vuelve a intentarlo.";
                return;
            }
            estadoLocal.solicitudPendiente = true;
            estadoLocal.consentimientoPendiente = true;
            ui.confirmAccept.disabled = true;
            ui.confirmCancel.disabled = true;
            ui.confirmFeedback.textContent = "Enviando tu aviso…";
            renderizar();
            emitirConTimeout(EVENTOS.solicitar, { request_id: crearRequestId(globalRef) }, (respuesta) => {
                ui.confirmAccept.disabled = false;
                ui.confirmCancel.disabled = false;
                estadoLocal.solicitudPendiente = false;
                if (!respuesta || respuesta.ok !== true) {
                    estadoLocal.consentimientoPendiente = false;
                    const code = textoSeguro(respuesta && respuesta.code, 40).toUpperCase();
                    ui.confirmFeedback.textContent = new Set(["MUSA_NOT_REGISTERED", "MUSA_SESSION_INACTIVE"]).has(code)
                        ? "Estamos terminando de enlazar tu móvil. Espera un momento y vuelve a pulsar."
                        : "No hemos podido enviar el aviso. Comprueba la conexión e inténtalo otra vez.";
                    renderizar();
                    return;
                }
                const ticket = normalizarTicket(respuesta.ticket || (respuesta.estado && respuesta.estado.ticket));
                if (ticket) {
                    estadoLocal.ticket = ticket;
                    guardarConsentimiento(ticket.ticket_id);
                }
                cerrarConfirmacion();
                renderizar();
            });
        }

        function detenerCaptura(opcionesDetener) {
            const opts = opcionesDetener || {};
            if (estadoLocal.frameTimer) {
                globalRef.clearTimeout(estadoLocal.frameTimer);
                estadoLocal.frameTimer = null;
            }
            const diagnostico = estadoLocal.diagnostico;
            estadoLocal.diagnostico = null;
            estadoLocal.frameEnCurso = false;
            ui.remoteIndicator.hidden = true;
            if (opts.revocar && diagnostico && estadoLocal.ticket) {
                socket.emit(EVENTOS.diagnosticoConsentir, {
                    ticket_id: estadoLocal.ticket.ticket_id,
                    session_id: diagnostico.session_id,
                    aceptar: false,
                    request_id: crearRequestId(globalRef)
                });
            }
        }

        function cancelarAyuda() {
            const ticket = estadoLocal.ticket;
            if (!ticket || estadoLocal.solicitudPendiente) return;
            estadoLocal.solicitudPendiente = true;
            estadoLocal.errorAyuda = "";
            detenerCaptura({ revocar: true });
            borrarConsentimiento(ticket.ticket_id);
            renderizar();
            emitirConTimeout(EVENTOS.cancelar, {
                ticket_id: ticket.ticket_id,
                request_id: crearRequestId(globalRef)
            }, (respuesta) => {
                estadoLocal.solicitudPendiente = false;
                if (respuesta && respuesta.ok === true) {
                    estadoLocal.ticket = null;
                    estadoLocal.banderaMinimizada = false;
                } else if (estadoLocal.ticket && estadoLocal.ticket.ticket_id === ticket.ticket_id) {
                    estadoLocal.ticket = ticket;
                    borrarConsentimiento(ticket.ticket_id);
                    estadoLocal.errorAyuda = "NO SE PUDO CERRAR EL AVISO · ACCESO REMOTO REVOCADO";
                }
                renderizar();
            });
        }

        function aplicarEstado(payload) {
            const estado = normalizarEstado(payload);
            if (estado.revision && estado.revision < estadoLocal.revision) return false;
            const anterior = estadoLocal.ticket;
            estadoLocal.revision = Math.max(estadoLocal.revision, estado.revision);
            estadoLocal.ticket = estado.ticket;
            if (!estado.ticket) {
                borrarConsentimiento(anterior && anterior.ticket_id);
                detenerCaptura();
                estadoLocal.banderaMinimizada = false;
                estadoLocal.consentimientoPendiente = false;
                estadoLocal.errorAyuda = "";
                renderizar();
                return true;
            }
            const esNuevoTicket = !anterior || anterior.ticket_id !== estado.ticket.ticket_id;
            if (esNuevoTicket) estadoLocal.errorAyuda = "";
            if (estadoLocal.consentimientoPendiente || (!esNuevoTicket && tieneConsentimiento(estado.ticket.ticket_id))) {
                guardarConsentimiento(estado.ticket.ticket_id);
                estadoLocal.consentimientoPendiente = false;
            }
            if (esNuevoTicket) estadoLocal.banderaMinimizada = false;
            if (estado.ticket.estado === "atendiendo" && (!anterior || anterior.estado !== "atendiendo")) {
                estadoLocal.banderaMinimizada = true;
            }
            if (
                estado.ticket.diagnostico.estado === "activo"
                && (!anterior || anterior.diagnostico.estado !== "activo")
            ) {
                estadoLocal.banderaMinimizada = true;
            }
            if (estado.ticket.diagnostico.estado === "inactivo" && estadoLocal.diagnostico) detenerCaptura();
            renderizar();
            return true;
        }

        function colorVisible(valor) {
            const limpio = textoSeguro(valor, 64).toLowerCase();
            return limpio && limpio !== "transparent" && limpio !== "rgba(0, 0, 0, 0)";
        }

        function crearCanvasEstructural() {
            const canvas = documentRef.createElement("canvas");
            const viewportWidth = Math.max(1, Number(globalRef.innerWidth) || 360);
            const viewportHeight = Math.max(1, Number(globalRef.innerHeight) || 640);
            const ratio = Math.min(1, 680 / viewportWidth, 430 / viewportHeight);
            canvas.width = Math.max(240, Math.round(viewportWidth * ratio));
            canvas.height = Math.max(180, Math.round(viewportHeight * ratio));
            const ctx = canvas.getContext("2d", { alpha: false });
            if (!ctx) return canvas;
            const bodyStyle = globalRef.getComputedStyle(documentRef.body);
            ctx.fillStyle = colorVisible(bodyStyle.backgroundColor) ? bodyStyle.backgroundColor : "#06101c";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const sx = canvas.width / viewportWidth;
            const sy = canvas.height / viewportHeight;
            const elementos = Array.from(documentRef.body.querySelectorAll("*"));
            let pintados = 0;
            for (const elemento of elementos) {
                if (pintados >= 260 || (elemento.dataset && elemento.dataset.musaHelpPrivate === "true")) continue;
                if (elemento.matches("script, style, link, meta, noscript") || elemento.hidden) continue;
                const rect = elemento.getBoundingClientRect();
                if (rect.width < 2 || rect.height < 2 || rect.bottom <= 0 || rect.right <= 0 || rect.top >= viewportHeight || rect.left >= viewportWidth) continue;
                const style = globalRef.getComputedStyle(elemento);
                if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
                const x = Math.max(0, rect.left) * sx;
                const y = Math.max(0, rect.top) * sy;
                const width = Math.min(viewportWidth, rect.right) * sx - x;
                const height = Math.min(viewportHeight, rect.bottom) * sy - y;
                if (colorVisible(style.backgroundColor)) {
                    ctx.fillStyle = style.backgroundColor;
                    ctx.fillRect(x, y, width, height);
                }
                if (colorVisible(style.borderTopColor) && parseFloat(style.borderTopWidth) > 0) {
                    ctx.strokeStyle = style.borderTopColor;
                    ctx.lineWidth = Math.max(1, Math.min(3, parseFloat(style.borderTopWidth) * sx));
                    ctx.strokeRect(x, y, width, height);
                }
                const esInteractivo = elemento.matches("button, a, [role='button']");
                const sinHijosElemento = elemento.children.length === 0;
                if (!esControlTextual(elemento) && (esInteractivo || sinHijosElemento)) {
                    const texto = textoSeguro(elemento.textContent, 90);
                    if (texto) {
                        const fontSize = Math.max(7, Math.min(18, (parseFloat(style.fontSize) || 12) * sy));
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(x, y, width, height);
                        ctx.clip();
                        ctx.fillStyle = colorVisible(style.color) ? style.color : "#ffffff";
                        ctx.font = `${style.fontWeight || "600"} ${fontSize}px sans-serif`;
                        ctx.textBaseline = "top";
                        ctx.fillText(texto, x + 3, y + 3, Math.max(0, width - 6));
                        ctx.restore();
                    }
                }
                pintados += 1;
            }
            return canvas;
        }

        async function capturarCanvas() {
            const html2canvasImpl = options.html2canvas || globalRef.html2canvas;
            if (typeof html2canvasImpl !== "function") return crearCanvasEstructural();
            try {
                const viewportWidth = Math.max(1, Number(globalRef.innerWidth) || 360);
                const viewportHeight = Math.max(1, Number(globalRef.innerHeight) || 640);
                const scale = Math.min(1, 720 / viewportWidth, 480 / viewportHeight);
                return await html2canvasImpl(documentRef.documentElement, {
                    backgroundColor: "#06101c",
                    logging: false,
                    useCORS: false,
                    allowTaint: false,
                    removeContainer: true,
                    scale,
                    x: Number(globalRef.scrollX) || 0,
                    y: Number(globalRef.scrollY) || 0,
                    width: viewportWidth,
                    height: viewportHeight,
                    windowWidth: viewportWidth,
                    windowHeight: viewportHeight,
                    ignoreElements: (elemento) => elemento && elemento.dataset && elemento.dataset.musaHelpPrivate === "true"
                });
            } catch (error) {
                estadoLocal.ultimoError = textoSeguro(error && error.message, 120) || "captura no disponible";
                return crearCanvasEstructural();
            }
        }

        function reducirCanvas(canvas, factor) {
            const reducido = documentRef.createElement("canvas");
            reducido.width = Math.max(160, Math.round(canvas.width * factor));
            reducido.height = Math.max(120, Math.round(canvas.height * factor));
            const ctx = reducido.getContext("2d", { alpha: false });
            if (ctx) ctx.drawImage(canvas, 0, 0, reducido.width, reducido.height);
            return reducido;
        }

        function codificarCanvas(canvas) {
            let actual = canvas;
            let calidad = 0.52;
            let dataUrl = actual.toDataURL("image/jpeg", calidad);
            for (let intento = 0; intento < 5 && dataUrl.length > MAX_FRAME_BASE64; intento += 1) {
                if (intento % 2 === 0) calidad = Math.max(0.28, calidad - 0.1);
                else actual = reducirCanvas(actual, 0.76);
                dataUrl = actual.toDataURL("image/jpeg", calidad);
            }
            const coma = dataUrl.indexOf(",");
            const data = coma >= 0 ? dataUrl.slice(coma + 1) : "";
            if (!data || data.length > MAX_FRAME_BASE64) return null;
            return { mime: "image/jpeg", data, width: actual.width, height: actual.height };
        }

        function diagnosticoVigente() {
            const diag = estadoLocal.diagnostico;
            const ticket = estadoLocal.ticket;
            return Boolean(
                diag && ticket &&
                diag.ticket_id === ticket.ticket_id &&
                diag.expires_ts > Date.now()
            );
        }

        function programarFrame(delay) {
            if (estadoLocal.frameTimer) globalRef.clearTimeout(estadoLocal.frameTimer);
            if (!diagnosticoVigente()) {
                detenerCaptura();
                renderizar();
                return;
            }
            estadoLocal.frameTimer = globalRef.setTimeout(enviarFrame, Math.max(0, Number(delay) || 0));
        }

        async function enviarFrame() {
            if (!diagnosticoVigente() || estadoLocal.frameEnCurso) return;
            if (!socket.connected) {
                programarFrame(INTERVALO_FRAME_MS);
                return;
            }
            estadoLocal.frameEnCurso = true;
            const diagnostico = { ...estadoLocal.diagnostico };
            try {
                const canvas = await capturarCanvas();
                if (!diagnosticoVigente() || diagnostico.session_id !== estadoLocal.diagnostico.session_id) return;
                const frame = codificarCanvas(canvas);
                if (!frame) throw new Error("frame demasiado grande");
                estadoLocal.frameSeq += 1;
                socket.emit(EVENTOS.diagnosticoFrame, {
                    ticket_id: diagnostico.ticket_id,
                    session_id: diagnostico.session_id,
                    seq: estadoLocal.frameSeq,
                    mime: frame.mime,
                    data: frame.data,
                    width: frame.width,
                    height: frame.height,
                    ts: Date.now(),
                    ruta: textoSeguro(globalRef.location && globalRef.location.pathname, 180),
                    viewport: {
                        width: Math.max(1, Number(globalRef.innerWidth) || frame.width),
                        height: Math.max(1, Number(globalRef.innerHeight) || frame.height)
                    },
                    online: globalRef.navigator ? globalRef.navigator.onLine !== false : true,
                    socket_conectado: Boolean(socket.connected),
                    ultimo_error: estadoLocal.ultimoError
                }, (respuesta) => {
                    if (
                        respuesta && respuesta.ok === false
                        && new Set(["DIAGNOSTIC_NOT_ACTIVE", "STALE_DIAGNOSTIC", "TICKET_NOT_FOUND"]).has(respuesta.code)
                    ) {
                        detenerCaptura();
                        renderizar();
                    }
                });
            } catch (error) {
                estadoLocal.ultimoError = textoSeguro(error && error.message, 120) || "error de captura";
            } finally {
                if (
                    estadoLocal.diagnostico
                    && estadoLocal.diagnostico.session_id === diagnostico.session_id
                ) {
                    estadoLocal.frameEnCurso = false;
                    if (diagnosticoVigente()) {
                        programarFrame(INTERVALO_FRAME_MS);
                    } else {
                        detenerCaptura();
                        renderizar();
                    }
                }
            }
        }

        function consentirDiagnostico(payload) {
            const ticket = estadoLocal.ticket;
            const ticketId = textoSeguro(payload && payload.ticket_id, 96);
            const sessionId = textoSeguro(payload && payload.session_id, 96);
            const expiresTs = Math.max(0, Number(payload && payload.expires_ts) || 0);
            const autorizado = Boolean(
                ticket &&
                ticket.ticket_id === ticketId &&
                sessionId &&
                expiresTs > Date.now() &&
                tieneConsentimiento(ticketId)
            );
            const respuesta = {
                ticket_id: ticketId,
                session_id: sessionId,
                aceptar: autorizado,
                request_id: crearRequestId(globalRef)
            };
            emitirConTimeout(EVENTOS.diagnosticoConsentir, respuesta, (ack) => {
                if (!autorizado || !ack || ack.ok !== true || ack.aceptado === false) return;
                const expiracionActiva = Math.min(
                    Date.now() + MAX_DIAGNOSTICO_MS,
                    Math.max(Date.now() + 1000, Number(ack.expires_ts) || expiresTs)
                );
                estadoLocal.diagnostico = { ticket_id: ticketId, session_id: sessionId, expires_ts: expiracionActiva };
                estadoLocal.banderaMinimizada = true;
                estadoLocal.frameSeq = 0;
                ui.remoteIndicator.hidden = false;
                ui.remoteIndicator.textContent = "ASISTENCIA ACTIVA · SOLO ESTA PÁGINA";
                renderizar();
                programarFrame(0);
            });
        }

        function mostrarActividadRemota(texto) {
            if (estadoLocal.remoteActivityTimer) globalRef.clearTimeout(estadoLocal.remoteActivityTimer);
            ui.remoteIndicator.hidden = false;
            ui.remoteIndicator.textContent = textoSeguro(texto, 80) || "ASISTENCIA ACTIVA";
            estadoLocal.remoteActivityTimer = globalRef.setTimeout(() => {
                estadoLocal.remoteActivityTimer = null;
                if (diagnosticoVigente()) {
                    ui.remoteIndicator.hidden = false;
                    ui.remoteIndicator.textContent = "ASISTENCIA ACTIVA · SOLO ESTA PÁGINA";
                } else {
                    ui.remoteIndicator.hidden = true;
                }
            }, 1800);
        }

        function emitirResultadoComando(comando, ok, detalle) {
            socket.emit(EVENTOS.comandoResultado, {
                ticket_id: comando.ticket_id,
                session_id: comando.session_id,
                command_id: comando.command_id,
                ok: Boolean(ok),
                detalle: textoSeguro(detalle, 120)
            });
        }

        function comandoAutorizado(comando) {
            return Boolean(
                comando && diagnosticoVigente() &&
                estadoLocal.diagnostico.ticket_id === comando.ticket_id &&
                estadoLocal.diagnostico.session_id === comando.session_id &&
                !estadoLocal.comandosVistos.has(comando.command_id)
            );
        }

        function recordarComando(commandId) {
            estadoLocal.comandosVistos.add(commandId);
            if (estadoLocal.comandosVistos.size > 120) {
                const primero = estadoLocal.comandosVistos.values().next().value;
                estadoLocal.comandosVistos.delete(primero);
            }
        }

        function ejecutarComando(payload) {
            const comando = normalizarComando(payload);
            if (!comandoAutorizado(comando)) {
                if (comando) emitirResultadoComando(comando, false, "Comando no autorizado o sesión caducada");
                return false;
            }
            recordarComando(comando.command_id);
            if (comando.tipo === "tap") {
                const x = Math.round(comando.x * Math.max(0, (Number(globalRef.innerWidth) || 1) - 1));
                const y = Math.round(comando.y * Math.max(0, (Number(globalRef.innerHeight) || 1) - 1));
                const objetivo = obtenerObjetivoTap(documentRef.elementFromPoint(x, y));
                if (!objetivo) {
                    emitirResultadoComando(comando, false, "No hay un botón seguro en ese punto");
                    return false;
                }
                mostrarActividadRemota("ASISTENCIA · TOCANDO UN BOTÓN");
                objetivo.classList.add("musa-help-remote-target");
                globalRef.setTimeout(() => objetivo.classList.remove("musa-help-remote-target"), 700);
                objetivo.click();
                emitirResultadoComando(comando, true, "Botón pulsado");
                return true;
            }
            if (comando.tipo === "scroll") {
                mostrarActividadRemota("ASISTENCIA · DESPLAZANDO LA PÁGINA");
                globalRef.scrollBy({ left: comando.delta_x, top: comando.delta_y, behavior: "smooth" });
                emitirResultadoComando(comando, true, "Desplazamiento aplicado");
                return true;
            }
            if (comando.tipo === "back") {
                let cerrado = false;
                if (!ui.bandera.hidden) {
                    estadoLocal.banderaMinimizada = true;
                    renderizar();
                    cerrado = true;
                } else if (!ui.confirmacion.hidden) {
                    cerrarConfirmacion();
                    cerrado = true;
                } else {
                    const capas = Array.from(documentRef.querySelectorAll("[role='dialog']:not([hidden]), .modal:not([hidden]), #overlay"));
                    for (let indice = capas.length - 1; indice >= 0 && !cerrado; indice -= 1) {
                        const capa = capas[indice];
                        if (capa === ui.bandera || capa === ui.confirmacion) continue;
                        const style = typeof globalRef.getComputedStyle === "function" ? globalRef.getComputedStyle(capa) : null;
                        if (style && (style.display === "none" || style.visibility === "hidden")) continue;
                        const botonCerrar = capa.querySelector("button[data-dismiss], button[data-close], button[aria-label*='cerrar' i], button[aria-label*='volver' i], #btn_volver");
                        const objetivoSeguro = obtenerObjetivoTap(botonCerrar);
                        if (!objetivoSeguro) continue;
                        objetivoSeguro.click();
                        cerrado = true;
                    }
                }
                mostrarActividadRemota(cerrado ? "ASISTENCIA · CERRANDO UNA VENTANA" : "NO HAY NADA QUE CERRAR");
                emitirResultadoComando(
                    comando,
                    cerrado,
                    cerrado ? "Ventana interna cerrada" : "No hay una ventana interna segura que cerrar"
                );
                return cerrado;
            }
            if (comando.tipo === "reconnect") {
                mostrarActividadRemota("ASISTENCIA · REINTENTANDO CONEXIÓN");
                if (!socket.connected && typeof socket.connect === "function") socket.connect();
                emitirResultadoComando(comando, true, socket.connected ? "Conexión ya activa" : "Reconexión solicitada");
                return true;
            }
            emitirResultadoComando(comando, false, "Comando no permitido");
            return false;
        }

        function manejarRecarga(payload) {
            const raw = payload && typeof payload === "object" ? payload : {};
            const rol = textoSeguro(raw.rol, 20).toLowerCase();
            const ticketId = textoSeguro(raw.ticket_id, 96);
            if (rol && rol !== "musa") return false;
            if (!estadoLocal.ticket || (ticketId && ticketId !== estadoLocal.ticket.ticket_id)) return false;
            mostrarActividadRemota("ASISTENCIA · REINICIANDO ESTA PÁGINA");
            globalRef.setTimeout(() => globalRef.location.reload(), 420);
            return true;
        }

        function pedirEstado() {
            socket.emit(EVENTOS.pedirEstado, {}, (respuesta) => {
                if (respuesta && respuesta.ok === true) aplicarEstado(respuesta.estado || respuesta);
            });
        }

        function registrarError(evento) {
            const error = evento && (evento.error || evento.reason);
            estadoLocal.ultimoError = textoSeguro(
                (error && error.message) || (evento && evento.message) || error,
                120
            );
        }

        ui.fab.addEventListener("click", abrirConfirmacion);
        ui.confirmCancel.addEventListener("click", cerrarConfirmacion);
        ui.confirmAccept.addEventListener("click", solicitarAyuda);
        ui.flagMinimize.addEventListener("click", () => {
            estadoLocal.banderaMinimizada = true;
            renderizar();
            enfocar(ui.fab);
        });
        ui.flagCancel.addEventListener("click", cancelarAyuda);
        ui.confirmacion.addEventListener("click", (evento) => {
            if (evento.target === ui.confirmacion && !estadoLocal.solicitudPendiente) cerrarConfirmacion();
        });
        documentRef.addEventListener("keydown", (evento) => {
            if (evento.key === "Escape" && !ui.confirmacion.hidden && !estadoLocal.solicitudPendiente) cerrarConfirmacion();
        });
        globalRef.addEventListener("error", registrarError);
        globalRef.addEventListener("unhandledrejection", registrarError);

        socket.on(EVENTOS.estado, aplicarEstado);
        socket.on(EVENTOS.diagnosticoSolicitud, consentirDiagnostico);
        socket.on("ayuda_musa_diagnostico_detener", (payload = {}) => {
            const ticketId = textoSeguro(payload.ticket_id, 96);
            const sessionId = textoSeguro(payload.session_id, 96);
            if (
                !estadoLocal.diagnostico
                || ticketId !== estadoLocal.diagnostico.ticket_id
                || sessionId !== estadoLocal.diagnostico.session_id
            ) return;
            detenerCaptura();
            renderizar();
        });
        socket.on(EVENTOS.comando, ejecutarComando);
        socket.on(EVENTOS.recargar, manejarRecarga);
        socket.on("disconnect", () => {
            estadoLocal.registroListo = false;
            if (estadoLocal.ticket) {
                ui.fabStatus.textContent = "RECONECTANDO…";
                mostrarActividadRemota("CONEXIÓN INTERRUMPIDA · REINTENTANDO");
            }
        });
        socket.on("connect", () => {
            estadoLocal.registroListo = false;
            if (estadoLocal.ticket) pedirEstado();
        });

        renderizar();
        return Object.freeze({
            requestState: pedirEstado,
            setRegistrationReady(ready) {
                estadoLocal.registroListo = ready === true;
                if (estadoLocal.registroListo) pedirEstado();
                return estadoLocal.registroListo;
            },
            applyState: aplicarEstado,
            handleDiagnosticRequest: consentirDiagnostico,
            handleCommand: ejecutarComando,
            handleReload: manejarRecarga,
            cancel: cancelarAyuda,
            destroy() {
                estadoLocal.destruido = true;
                detenerCaptura({ revocar: true });
            },
            getState() {
                return {
                    revision: estadoLocal.revision,
                    ticket: estadoLocal.ticket ? { ...estadoLocal.ticket } : null,
                    diagnostico: estadoLocal.diagnostico ? { ...estadoLocal.diagnostico } : null
                };
            }
        });
    }

    return Object.freeze({
        EVENTS: EVENTOS,
        normalizeHex: normalizarHex,
        foregroundForColor: tintaParaColor,
        normalizeTicket: normalizarTicket,
        normalizeState: normalizarEstado,
        normalizeCommand: normalizarComando,
        isTextualControl: esControlTextual,
        getSafeTapTarget: obtenerObjetivoTap,
        getAttendingNotice: obtenerAvisoAtencion,
        createController: crearControlador
    });
});
