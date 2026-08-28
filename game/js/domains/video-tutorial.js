(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    if (!root) return;
    root.ScribVideoTutorial = api;

    if (!root.document) return;
    const socketRef = typeof socket !== "undefined" ? socket : null;
    if (!socketRef) return;

    const start = () => {
        if (root.__scribVideoTutorialController) return;
        root.__scribVideoTutorialController = api.createController({
            windowRef: root,
            documentRef: root.document,
            socketRef
        });
    };

    if (root.document.readyState === "loading") {
        root.document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
}(typeof window !== "undefined" ? window : null, function () {
    "use strict";

    const DEFAULT_DURATION_SECONDS = 60;
    const DEFAULT_VIDEO_URL = "../media/tutorial-scrib.mp4";
    const VIDEO_ASSET_VERSION = "20260828a";
    const REQUEST_EVENT = "pedir_video_tutorial_estado";
    const STATE_EVENT = "video_tutorial_estado";
    const VERIFY_EVENT = "video_tutorial_verificar";
    const VISIBILITY_TRANSITION_MS = 560;
    const NARRATION_RETRY_EVENTS = Object.freeze(["pointerdown", "touchstart", "keydown"]);

    const TIMELINE = Object.freeze([
        Object.freeze({ id: "connected", start: 0, end: 30, label: "CONEXI\u00d3N RECIBIDA", copy: "Sigue las instrucciones de la pantalla principal." }),
        Object.freeze({ id: "ready", start: 30, end: 34, label: "PREPARA TU PANTALLA", copy: "Ahora comprobaremos juntos el color y el brillo." }),
        Object.freeze({ id: "red", start: 34, end: 38, label: "ROJO", copy: "Comprueba que toda la pantalla se vea roja." }),
        Object.freeze({ id: "blue", start: 38, end: 42, label: "AZUL", copy: "Comprueba que toda la pantalla se vea azul." }),
        Object.freeze({ id: "green", start: 42, end: 46, label: "VERDE", copy: "Comprueba que toda la pantalla se vea verde." }),
        Object.freeze({ id: "white", start: 46, end: 50, label: "BLANCO", copy: "Comprueba el brillo y que no haya filtros activos." }),
        Object.freeze({ id: "confirm", start: 50, end: 60, label: "\u00bfVISTE LOS CUATRO COLORES?", copy: "Confirma para terminar la prueba de este dispositivo." })
    ]);

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function asFiniteNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function cleanText(value, maxLength = 80) {
        return String(value == null ? "" : value)
            .replace(/[\u0000-\u001f\u007f]/g, "")
            .trim()
            .slice(0, maxLength);
    }

    function normalizeVerification(raw = {}) {
        const connected = Math.max(0, Math.trunc(asFiniteNumber(raw.conectadas, 0)));
        const verified = clamp(Math.trunc(asFiniteNumber(raw.verificadas, 0)), 0, connected);
        const names = Array.isArray(raw.nombres_verificados)
            ? Array.from(new Set(raw.nombres_verificados.map((name) => cleanText(name, 24)).filter(Boolean))).slice(0, 64)
            : [];
        return {
            connected,
            verified,
            pending: Math.max(0, Math.trunc(asFiniteNumber(raw.pendientes, connected - verified))),
            names
        };
    }

    function normalizeState(raw = {}, now = Date.now()) {
        const config = raw && typeof raw.configuracion === "object" ? raw.configuracion : {};
        const durationSeconds = clamp(
            asFiniteNumber(config.duracion_segundos, DEFAULT_DURATION_SECONDS),
            3,
            3600
        );
        const startedAt = Math.max(0, asFiniteNumber(raw.inicio_ts, 0));
        const explicitPosition = asFiniteNumber(raw.posicion_segundos, NaN);
        const derivedPosition = startedAt > 0 ? Math.max(0, (now - startedAt) / 1000) : 0;
        const positionSeconds = clamp(
            Number.isFinite(explicitPosition) ? explicitPosition : derivedPosition,
            0,
            durationSeconds
        );
        const visible = Boolean(raw.visible && raw.reproduciendo);

        return {
            version: Math.max(1, Math.trunc(asFiniteNumber(raw.version, 1))),
            active: Boolean(raw.activo),
            visible,
            playing: Boolean(raw.reproduciendo),
            sessionId: cleanText(raw.session_id, 80),
            phaseSeq: Math.max(0, Math.trunc(asFiniteNumber(raw.phase_seq, 0))),
            playbackSeq: Math.max(0, Math.trunc(asFiniteNumber(raw.reproduccion_seq, 0))),
            revision: Math.max(0, Math.trunc(asFiniteNumber(raw.revision, 0))),
            startedAt,
            finishedAt: Math.max(0, asFiniteNumber(raw.fin_ts, 0)),
            positionSeconds,
            nextPlaybackAt: Math.max(0, asFiniteNumber(raw.proxima_reproduccion_ts, 0)),
            origin: cleanText(raw.origen, 32),
            config: {
                enabled: Boolean(config.habilitado),
                muted: Boolean(config.silenciado),
                intervalSeconds: clamp(asFiniteNumber(config.intervalo_segundos, 300), 15, 86400),
                durationSeconds,
                videoUrl: cleanText(config.video_url, 500) || DEFAULT_VIDEO_URL
            },
            verification: normalizeVerification(raw.verificacion || {})
        };
    }

    function phaseAt(seconds) {
        const position = Math.max(0, asFiniteNumber(seconds, 0));
        return TIMELINE.find((phase) => position >= phase.start && position < phase.end)
            || TIMELINE[TIMELINE.length - 1];
    }

    function progressAt(seconds, durationSeconds = DEFAULT_DURATION_SECONDS) {
        return clamp(asFiniteNumber(seconds, 0) / Math.max(1, asFiniteNumber(durationSeconds, DEFAULT_DURATION_SECONDS)), 0, 1);
    }

    function safeVideoUrl(value, locationRef = null) {
        const raw = cleanText(value, 500) || DEFAULT_VIDEO_URL;
        if (/^(?:javascript|data|blob):/i.test(raw)) return DEFAULT_VIDEO_URL;
        if (!locationRef || !locationRef.href || typeof URL !== "function") return raw;
        try {
            const resolved = new URL(raw, locationRef.href);
            if (!/^https?:$/i.test(resolved.protocol)) return DEFAULT_VIDEO_URL;
            if (/\/tutorial-scrib\.mp4$/i.test(resolved.pathname) && !resolved.searchParams.has("v")) {
                resolved.searchParams.set("v", VIDEO_ASSET_VERSION);
            }
            return resolved.href;
        } catch (_error) {
            return DEFAULT_VIDEO_URL;
        }
    }

    function playbackKey(state) {
        if (!state) return "";
        return `${state.sessionId}:${state.phaseSeq}:${state.playbackSeq}`;
    }

    function requestId(windowRef) {
        try {
            if (windowRef.crypto && typeof windowRef.crypto.randomUUID === "function") {
                return windowRef.crypto.randomUUID();
            }
        } catch (_error) {}
        return `vt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function formatTime(seconds) {
        const safe = Math.max(0, Math.ceil(asFiniteNumber(seconds, 0)));
        return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
    }

    function inferRole(documentRef) {
        if (documentRef.body && documentRef.body.classList.contains("page-spectator")) return "spectator";
        if (documentRef.getElementById("nombre_musa_label")) return "muse";
        return "";
    }

    function createSpectatorOverlay(documentRef) {
        const root = documentRef.createElement("section");
        root.id = "video_tutorial_overlay";
        root.className = "scrib-video-tutorial scrib-video-tutorial--spectator";
        root.hidden = true;
        root.setAttribute("aria-label", "Videotutorial para conectarse a SCRIB");
        root.innerHTML = `
            <div class="scrib-video-tutorial__ambient" aria-hidden="true"></div>
            <video class="scrib-video-tutorial__media" playsinline preload="auto" autoplay></video>
            <strong class="scrib-video-tutorial__slide-url" data-video-tutorial-slide-url hidden></strong>
            <div class="scrib-video-tutorial__fallback" hidden>
                <span aria-hidden="true">\u25b6</span>
                <strong>PREPARANDO VIDEOTUTORIAL</strong>
                <small>La gu\u00eda continuar\u00e1 en cuanto el v\u00eddeo est\u00e9 disponible.</small>
            </div>
            <p class="scrib-visually-hidden" role="status" aria-live="assertive" data-video-tutorial-live></p>
        `;
        documentRef.body.appendChild(root);
        return root;
    }

    function createMuseOverlay(documentRef) {
        const root = documentRef.createElement("section");
        root.id = "video_tutorial_musa";
        root.className = "scrib-video-tutorial-device";
        root.hidden = true;
        root.setAttribute("aria-labelledby", "video_tutorial_musa_title");
        root.innerHTML = `
            <div class="scrib-video-tutorial-device__grid" aria-hidden="true"></div>
            <div class="scrib-video-tutorial-device__card">
                <span class="scrib-video-tutorial-device__eyebrow" data-video-tutorial-eyebrow>PRUEBA DE CONEXI\u00d3N</span>
                <div class="scrib-video-tutorial-device__check" aria-hidden="true">\u2713</div>
                <h1 id="video_tutorial_musa_title" data-video-tutorial-title>CONEXI\u00d3N RECIBIDA</h1>
                <p data-video-tutorial-copy>Sigue las instrucciones de la pantalla principal.</p>
                <div class="scrib-video-tutorial-device__identity" data-video-tutorial-identity></div>
                <button class="scrib-video-tutorial-device__confirm" type="button" hidden>S\u00cd, FUNCIONA</button>
                <span class="scrib-video-tutorial-device__timer" data-video-tutorial-device-time>00:60</span>
            </div>
            <p class="scrib-visually-hidden" role="status" aria-live="assertive" data-video-tutorial-live></p>
        `;
        documentRef.body.appendChild(root);
        return root;
    }

    function createController(options = {}) {
        const windowRef = options.windowRef;
        const documentRef = options.documentRef;
        const socketRef = options.socketRef;
        const role = options.role || inferRole(documentRef);
        if (!windowRef || !documentRef || !socketRef || !role) return null;

        const root = role === "spectator"
            ? createSpectatorOverlay(documentRef)
            : createMuseOverlay(documentRef);
        const media = root.querySelector("video");
        const liveRegion = root.querySelector("[data-video-tutorial-live]");
        const confirmButton = root.querySelector(".scrib-video-tutorial-device__confirm");
        const storage = (() => {
            try { return windowRef.sessionStorage; } catch (_error) { return null; }
        })();
        const scheduleFrame = typeof windowRef.requestAnimationFrame === "function"
            ? windowRef.requestAnimationFrame.bind(windowRef)
            : (callback) => windowRef.setTimeout(callback, 50);
        const cancelFrame = typeof windowRef.cancelAnimationFrame === "function"
            ? windowRef.cancelAnimationFrame.bind(windowRef)
            : windowRef.clearTimeout.bind(windowRef);

        let state = null;
        let syncReceivedAt = 0;
        let syncPosition = 0;
        let frameId = null;
        let activePlaybackKey = "";
        let activeVideoUrl = "";
        let lastPhaseId = "";
        let verifying = false;
        let locallyVerified = false;
        let hideTransitionTimer = null;

        if (role === "spectator") {
            const joinNode = root.querySelector("[data-video-tutorial-slide-url]");
            if (joinNode) {
                try {
                    const joinUrl = new URL("../public/index.html", windowRef.location.href);
                    joinUrl.search = "";
                    joinUrl.hash = "";
                    joinNode.textContent = `${joinUrl.host}${joinUrl.pathname.replace(/index\.html$/i, "")}`;
                } catch (_error) {
                    joinNode.textContent = "SCRIB";
                }
            }
        }

        function currentPosition() {
            if (!state || !state.visible) return 0;
            return clamp(
                syncPosition + Math.max(0, Date.now() - syncReceivedAt) / 1000,
                0,
                state.config.durationSeconds
            );
        }

        function verificationStorageKey() {
            return `scrib-video-tutorial:${playbackKey(state)}`;
        }

        function restoreLocalVerification() {
            locallyVerified = false;
            if (!storage || !state) return;
            try { locallyVerified = storage.getItem(verificationStorageKey()) === "1"; } catch (_error) {}
        }

        function setVisible(visible) {
            if (hideTransitionTimer != null) {
                windowRef.clearTimeout(hideTransitionTimer);
                hideTransitionTimer = null;
            }
            if (visible) {
                root.hidden = false;
                root.classList.remove("is-leaving");
                root.setAttribute("aria-hidden", "false");
                documentRef.body.classList.add("scrib-video-tutorial-active");
                void root.offsetWidth;
                root.classList.add("is-visible");
                return;
            }

            root.setAttribute("aria-hidden", "true");
            documentRef.body.classList.remove("scrib-video-tutorial-active");
            root.classList.remove("is-visible");
            root.classList.add("is-leaving");
            if (media) {
                try { media.pause(); } catch (_error) {}
            }
            const reducedMotion = Boolean(windowRef.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
            hideTransitionTimer = windowRef.setTimeout(() => {
                root.hidden = true;
                root.classList.remove("is-leaving");
                hideTransitionTimer = null;
            }, reducedMotion ? 0 : VISIBILITY_TRANSITION_MS);
        }

        function showFallback(show) {
            const fallback = root.querySelector(".scrib-video-tutorial__fallback");
            if (fallback) fallback.hidden = !show;
        }

        function playMedia(position, force = false) {
            if (!media || !state || !state.visible) return;
            const nextUrl = safeVideoUrl(state.config.videoUrl, windowRef.location);
            const nextKey = playbackKey(state);
            const changed = force || nextKey !== activePlaybackKey || nextUrl !== activeVideoUrl;
            if (changed) {
                activePlaybackKey = nextKey;
                activeVideoUrl = nextUrl;
                media.src = nextUrl;
                media.defaultMuted = false;
                media.muted = false;
                media.volume = 1;
                media.removeAttribute("muted");
                media.currentTime = 0;
                media.load();
            }

            const seekAndPlay = () => {
                try {
                    if (Number.isFinite(media.duration) && media.duration > 0) {
                        media.currentTime = Math.min(position, Math.max(0, media.duration - 0.05));
                    }
                } catch (_error) {}
                const attempt = media.play();
                if (!attempt || typeof attempt.catch !== "function") return;
                attempt.then(() => {
                    delete media.dataset.narrationBlocked;
                    showFallback(false);
                }).catch(() => {
                    media.dataset.narrationBlocked = "true";
                });
            };

            if (media.readyState >= 1) seekAndPlay();
            else media.addEventListener("loadedmetadata", seekAndPlay, { once: true });
        }

        function renderSpectator(position) {
            const joinNode = root.querySelector("[data-video-tutorial-slide-url]");
            if (joinNode) joinNode.hidden = !(position >= 6 && position < 11);
        }

        function museIdentity() {
            const muse = cleanText(documentRef.getElementById("nombre_musa_label")?.textContent, 24);
            const writer = cleanText(documentRef.getElementById("nombre")?.value || documentRef.getElementById("nombre")?.textContent, 36);
            let team = "";
            try {
                const player = new URLSearchParams(windowRef.location.search).get("player");
                team = player === "1" ? "EQUIPO AZUL" : (player === "2" ? "EQUIPO ROJO" : "");
            } catch (_error) {}
            return [muse, team, writer && `ESCRITXR: ${writer}`].filter(Boolean).join(" \u00b7 ");
        }

        function renderMuse(position) {
            const phase = phaseAt(position);
            const title = root.querySelector("[data-video-tutorial-title]");
            const copy = root.querySelector("[data-video-tutorial-copy]");
            const eyebrow = root.querySelector("[data-video-tutorial-eyebrow]");
            const identity = root.querySelector("[data-video-tutorial-identity]");
            const time = root.querySelector("[data-video-tutorial-device-time]");
            root.dataset.phase = locallyVerified ? "verified" : phase.id;
            root.classList.toggle("is-verified", locallyVerified);
            if (title) title.textContent = locallyVerified ? "CONFIGURACI\u00d3N VERIFICADA" : phase.label;
            if (copy) copy.textContent = locallyVerified
                ? "Tu dispositivo est\u00e1 conectado y listo para inspirar."
                : phase.copy;
            if (eyebrow) eyebrow.textContent = locallyVerified ? "TODO FUNCIONA" : "PRUEBA DE CONEXI\u00d3N";
            if (identity) identity.textContent = museIdentity();
            if (time) time.textContent = formatTime(state.config.durationSeconds - position);
            if (confirmButton) {
                confirmButton.hidden = phase.id !== "confirm" || locallyVerified;
                confirmButton.disabled = verifying;
                confirmButton.textContent = verifying ? "VERIFICANDO\u2026" : "S\u00cd, FUNCIONA";
            }
            if (phase.id !== lastPhaseId) {
                lastPhaseId = phase.id;
                if (liveRegion) liveRegion.textContent = phase.label;
            }
        }

        function tick() {
            frameId = null;
            if (!state || !state.visible) return;
            const position = currentPosition();
            if (role === "spectator") renderSpectator(position);
            else renderMuse(position);
            frameId = scheduleFrame(tick);
        }

        function beginTicking() {
            if (frameId != null) cancelFrame(frameId);
            frameId = scheduleFrame(tick);
        }

        function handleState(raw = {}) {
            const previousKey = playbackKey(state);
            state = normalizeState(raw);
            syncReceivedAt = Date.now();
            syncPosition = state.positionSeconds;
            const nextKey = playbackKey(state);
            if (nextKey !== previousKey) {
                verifying = false;
                lastPhaseId = "";
                restoreLocalVerification();
            }
            setVisible(state.visible);
            if (!state.visible) {
                if (frameId != null) cancelFrame(frameId);
                frameId = null;
                return;
            }
            if (role === "spectator") {
                renderSpectator(syncPosition);
                playMedia(syncPosition, nextKey !== previousKey);
            } else {
                renderMuse(syncPosition);
            }
            beginTicking();
        }

        function verify() {
            if (!state || !state.visible || verifying || locallyVerified) return;
            if (phaseAt(currentPosition()).id !== "confirm") return;
            verifying = true;
            renderMuse(currentPosition());
            const payload = {
                session_id: state.sessionId,
                phase_seq: state.phaseSeq,
                reproduccion_seq: state.playbackSeq,
                request_id: requestId(windowRef)
            };
            let settled = false;
            const settle = (response = {}) => {
                if (settled) return;
                settled = true;
                verifying = false;
                if (response && response.ok === true) {
                    locallyVerified = true;
                    try { storage?.setItem(verificationStorageKey(), "1"); } catch (_error) {}
                    if (liveRegion) liveRegion.textContent = "Configuraci\u00f3n verificada correctamente.";
                }
                renderMuse(currentPosition());
            };
            socketRef.emit(VERIFY_EVENT, payload, settle);
            windowRef.setTimeout(() => settle({ ok: false }), 4500);
        }

        if (media) {
            media.addEventListener("error", () => showFallback(true));
            media.addEventListener("playing", () => showFallback(false));
        }
        const retryNarration = () => {
            if (role !== "spectator" || !state || !state.visible || !media?.paused) return;
            playMedia(currentPosition());
        };
        NARRATION_RETRY_EVENTS.forEach((eventName) => {
            documentRef.addEventListener(eventName, retryNarration, { passive: true });
        });
        if (confirmButton) confirmButton.addEventListener("click", verify);

        socketRef.on(STATE_EVENT, handleState);
        socketRef.on("disconnect", () => setVisible(false));
        socketRef.on("connect", () => {
            windowRef.setTimeout(() => socketRef.emit(REQUEST_EVENT), 250);
        });
        if (socketRef.connected) socketRef.emit(REQUEST_EVENT);

        return {
            role,
            root,
            handleState,
            verify,
            getState: () => state,
            getPosition: currentPosition,
            destroy() {
                if (frameId != null) cancelFrame(frameId);
                if (hideTransitionTimer != null) windowRef.clearTimeout(hideTransitionTimer);
                NARRATION_RETRY_EVENTS.forEach((eventName) => {
                    documentRef.removeEventListener(eventName, retryNarration);
                });
                try { media?.pause(); } catch (_error) {}
                root.remove();
            }
        };
    }

    return Object.freeze({
        DEFAULT_DURATION_SECONDS,
        DEFAULT_VIDEO_URL,
        TIMELINE,
        normalizeState,
        normalizeVerification,
        phaseAt,
        progressAt,
        safeVideoUrl,
        playbackKey,
        createController
    });
}));
