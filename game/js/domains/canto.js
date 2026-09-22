(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (!root) return;
    root.ScribCanto = api;
    if (!root.document) return;
    const socketRef = typeof socket !== "undefined" ? socket : null;
    if (!socketRef) return;

    const start = () => {
        if (root.__scribCantoController) return;
        root.__scribCantoController = api.createController({
            windowRef: root,
            documentRef: root.document,
            socketRef
        });
    };
    if (root.document.readyState === "loading") {
        root.document.addEventListener("DOMContentLoaded", start, { once: true });
    } else start();
}(typeof window !== "undefined" ? window : null, function () {
    "use strict";

    const REQUEST_EVENT = "pedir_canto_estado";
    const STATE_EVENT = "canto_estado";
    const DEFAULT_AUDIO_URL = "../media/musica-iliada.mp3";
    const DEFAULT_AUDIO_SECONDS = 32;
    const DEFAULT_FADE_MS = 1800;
    const EXIT_AUDIO_FADE_MULTIPLIER = 2;
    const DEFAULT_VOLUME = 0.86;
    const EXIT_MS = 1050;
    const ASSET_VERSION = "20260920a";
    const RETRY_EVENTS = Object.freeze(["pointerdown", "touchstart", "keydown"]);
    const DEFAULT_TEXT = "Musas, con esta inspiración inicial, ha llegado el momento de que las historias se hagan realidad. La Odisea de Homero comienza diciendo ‘Cántame a mí, Musa, la historia’. Y eso es lo que debéis hacer hoy: contar una historia. Junto con vuestra escritora, junto con vuestro equipo. Es la única forma de ganar.";

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const clean = (value, max = 4096) => String(value == null ? "" : value).trim().slice(0, max);

    function normalizeState(raw = {}) {
        const data = raw && raw.estado && typeof raw.estado === "object" ? raw.estado : raw;
        const source = data && typeof data === "object" ? data : {};
        const config = source.configuracion && typeof source.configuracion === "object"
            ? source.configuracion
            : {};
        return {
            active: Boolean(source.activo),
            sessionId: clean(source.session_id, 128),
            sequence: Math.max(0, Math.trunc(finite(source.secuencia, 0))),
            startedAt: Math.max(0, finite(source.inicio_ts, 0)),
            positionSeconds: Math.max(0, finite(source.posicion_segundos, 0)),
            config: {
                audioUrl: clean(config.audio_url) || DEFAULT_AUDIO_URL,
                audioSeconds: clamp(finite(config.duracion_audio_segundos, DEFAULT_AUDIO_SECONDS), 1, 3600),
                fadeMs: clamp(finite(config.fade_ms, DEFAULT_FADE_MS), 0, 15000),
                loop: config.loop !== false,
                text: clean(config.texto) || DEFAULT_TEXT
            }
        };
    }

    function inferRole(documentRef) {
        const body = documentRef && documentRef.body;
        if (body && body.classList && body.classList.contains("page-spectator")) return "spectator";
        const path = String(documentRef && documentRef.location && documentRef.location.pathname || "");
        if (/\/spectator\//i.test(path)) return "spectator";
        if (/\/public\/players\//i.test(path)) return "muse";
        return "";
    }

    function inferTeam(windowRef) {
        try {
            const params = new URLSearchParams(windowRef.location.search || "");
            return Number(params.get("player")) === 2 ? 2 : 1;
        } catch (_error) {
            return 1;
        }
    }

    function versionedAudioUrl(value, locationRef) {
        let resolved;
        try {
            resolved = new URL(clean(value) || DEFAULT_AUDIO_URL, locationRef && locationRef.href
                ? locationRef.href
                : "https://scrib.invalid/");
        } catch (_error) {
            resolved = new URL(DEFAULT_AUDIO_URL, "https://scrib.invalid/");
        }
        if (!["http:", "https:"].includes(String(resolved.protocol || "").toLowerCase()) || !/\.mp3$/i.test(resolved.pathname)) {
            resolved = new URL(DEFAULT_AUDIO_URL, locationRef && locationRef.href
                ? locationRef.href
                : "https://scrib.invalid/");
        }
        if (!resolved.searchParams.has("v")) resolved.searchParams.set("v", ASSET_VERSION);
        return resolved.href;
    }

    function createSpectatorOverlay(documentRef) {
        const overlay = documentRef.createElement("section");
        overlay.id = "canto_espectador";
        overlay.className = "scrib-canto scrib-canto--spectator";
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
            <div class="scrib-canto__world" aria-hidden="true">
                <div class="scrib-canto__night"></div>
                <div class="scrib-canto__stars">${"<i></i>".repeat(28)}</div>
                <div class="scrib-canto__moon"></div>
                <div class="scrib-canto__horizon"></div>
                <div class="scrib-canto__sea scrib-canto__sea--back"></div>
                <div class="scrib-canto__ship"><i></i><b></b><span></span></div>
                <div class="scrib-canto__sea scrib-canto__sea--front"></div>
                <div class="scrib-canto__pages">${"<i></i>".repeat(10)}</div>
            </div>
            <article class="scrib-canto__stage">
                <h1><span>CÁNTAME A MÍ, MUSA,</span><strong>LA HISTORIA</strong></h1>
                <p class="scrib-canto__lead">AQUELLA QUE ESTÁ A PUNTO DE HACERSE REALIDAD</p>
            </article>
            <audio class="scrib-canto__audio" preload="auto" loop data-canto-audio></audio>
            <p class="scrib-visually-hidden" role="status" aria-live="assertive" data-canto-live></p>`;
        documentRef.body.appendChild(overlay);
        return overlay;
    }

    function createMuseOverlay(documentRef, team) {
        const overlay = documentRef.createElement("section");
        overlay.id = "canto_musa";
        overlay.className = `scrib-canto scrib-canto--muse scrib-canto--team-${team}`;
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
            <div class="scrib-canto-flag__sky" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="scrib-canto-flag__sparks" aria-hidden="true">${"<i></i>".repeat(16)}</div>
            <article class="scrib-canto-flag">
                <div class="scrib-canto-flag__cloth" aria-hidden="true">
                    <i></i><i></i><i></i><i></i><i></i><i></i>
                </div>
                <div class="scrib-canto-flag__copy">
                    <small>HA LLEGADO VUESTRO MOMENTO</small>
                    <span class="scrib-canto-flag__mark" aria-hidden="true">Μ</span>
                    <h1>CÁNTAME A MÍ,<br><strong>MUSA</strong></h1>
                    <p>CONTAD UNA HISTORIA</p>
                </div>
            </article>
            <p class="scrib-visually-hidden" role="status" aria-live="assertive" data-canto-live></p>`;
        documentRef.body.appendChild(overlay);
        return overlay;
    }

    function createController(options = {}) {
        const windowRef = options.windowRef;
        const documentRef = options.documentRef;
        const socketRef = options.socketRef;
        const role = options.role || inferRole(documentRef);
        if (!windowRef || !documentRef || !socketRef || !role) return null;

        const overlay = role === "spectator"
            ? createSpectatorOverlay(documentRef)
            : createMuseOverlay(documentRef, inferTeam(windowRef));
        const audio = overlay.querySelector("[data-canto-audio]");
        const live = overlay.querySelector("[data-canto-live]");
        const text = overlay.querySelector("[data-canto-text]");
        const setTimer = windowRef.setTimeout.bind(windowRef);
        const clearTimer = windowRef.clearTimeout.bind(windowRef);
        let state = normalizeState();
        let exitTimer = null;
        let fadeTimer = null;
        let fadeSequence = 0;
        let activeKey = "";
        let blocked = false;

        const dispatchAudioState = (active, fadeMs) => {
            if (role !== "spectator" || typeof windowRef.CustomEvent !== "function") return;
            documentRef.dispatchEvent(new windowRef.CustomEvent("scrib:canto-visibility", {
                detail: { active: Boolean(active), fadeMs: Math.max(0, finite(fadeMs, DEFAULT_FADE_MS)) }
            }));
        };

        const clearFade = () => {
            fadeSequence += 1;
            if (fadeTimer != null) clearTimer(fadeTimer);
            fadeTimer = null;
        };

        const fadeAudio = (target, durationMs, onDone = null) => {
            if (!audio) return;
            clearFade();
            const sequence = fadeSequence;
            const from = clamp(finite(audio.volume, 0), 0, 1);
            const to = clamp(finite(target, 0), 0, 1);
            const duration = Math.max(0, finite(durationMs, 0));
            const startedAt = Date.now();
            if (!duration || Math.abs(to - from) < 0.001) {
                audio.volume = to;
                if (typeof onDone === "function") onDone();
                return;
            }
            const step = () => {
                if (sequence !== fadeSequence) return;
                const progress = clamp((Date.now() - startedAt) / duration, 0, 1);
                audio.volume = from + ((to - from) * progress);
                if (progress >= 1) {
                    fadeTimer = null;
                    if (typeof onDone === "function") onDone();
                    return;
                }
                fadeTimer = setTimer(step, 45);
            };
            step();
        };

        const startAudio = (forceSeek = false) => {
            if (!audio || !state.active) return;
            const url = versionedAudioUrl(state.config.audioUrl, windowRef.location);
            if (audio.src !== url) {
                audio.src = url;
                audio.load();
                forceSeek = true;
            }
            audio.loop = state.config.loop;
            audio.muted = false;
            const play = () => {
                if (forceSeek) {
                    const duration = Number.isFinite(audio.duration) && audio.duration > 0
                        ? audio.duration
                        : state.config.audioSeconds;
                    try { audio.currentTime = state.positionSeconds % duration; } catch (_error) {}
                }
                if (forceSeek) audio.volume = 0;
                let attempt;
                try { attempt = audio.play(); } catch (_error) { blocked = true; return; }
                if (attempt && typeof attempt.then === "function") {
                    attempt.then(() => {
                        blocked = false;
                        fadeAudio(DEFAULT_VOLUME, state.config.fadeMs);
                    }).catch(() => { blocked = true; });
                } else {
                    blocked = false;
                    fadeAudio(DEFAULT_VOLUME, state.config.fadeMs);
                }
            };
            if (audio.readyState >= 1) play();
            else audio.addEventListener("loadedmetadata", play, { once: true });
        };

        const finishExit = (revision) => {
            if (revision !== activeKey || state.active) return;
            overlay.hidden = true;
            overlay.classList.remove("is-leaving");
            if (audio) {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (_error) {}
            }
        };

        const show = () => {
            if (exitTimer != null) clearTimer(exitTimer);
            exitTimer = null;
            overlay.hidden = false;
            overlay.setAttribute("aria-hidden", "false");
            overlay.classList.remove("is-leaving");
            documentRef.body.classList.add("scrib-canto-active");
            void overlay.offsetWidth;
            overlay.classList.add("is-visible", "is-entering");
            setTimer(() => overlay.classList.remove("is-entering"), 1200);
        };

        const hide = (animate = true) => {
            documentRef.body.classList.remove("scrib-canto-active");
            overlay.setAttribute("aria-hidden", "true");
            overlay.classList.remove("is-visible", "is-entering");
            if (overlay.hidden) return;
            if (!animate) {
                overlay.hidden = true;
                overlay.classList.remove("is-leaving");
                return;
            }
            overlay.classList.add("is-leaving");
            const revision = activeKey;
            if (exitTimer != null) clearTimer(exitTimer);
            exitTimer = setTimer(() => finishExit(revision), EXIT_MS);
        };

        const handleState = (raw = {}) => {
            const previousActive = state.active;
            const previousKey = activeKey;
            state = normalizeState(raw);
            activeKey = `${state.sessionId}:${state.sequence}:${state.active ? 1 : 0}`;
            if (text) text.textContent = state.config.text;
            if (state.active) {
                show();
                if (live && (!previousActive || previousKey !== activeKey)) {
                    live.textContent = "Canto de las musas activado. Cántame a mí, Musa, la historia.";
                }
                dispatchAudioState(true, state.config.fadeMs);
                if (role === "spectator") startAudio(!previousActive || previousKey !== activeKey);
                return;
            }
            if (previousActive) {
                const fadeOutMs = clamp(
                    state.config.fadeMs * EXIT_AUDIO_FADE_MULTIPLIER,
                    0,
                    15000
                );
                if (live) live.textContent = "Canto de las musas finalizado.";
                dispatchAudioState(false, fadeOutMs);
                if (audio) fadeAudio(0, fadeOutMs, () => {
                    if (!state.active) {
                        try { audio.pause(); } catch (_error) {}
                    }
                });
                hide(true);
            } else {
                hide(false);
            }
        };

        const retryAudio = () => {
            if (role !== "spectator" || !blocked || !state.active) return;
            startAudio(false);
        };
        RETRY_EVENTS.forEach((eventName) => documentRef.addEventListener(eventName, retryAudio, { passive: true }));
        socketRef.on(STATE_EVENT, handleState);
        socketRef.on("disconnect", () => {
            dispatchAudioState(false, 250);
            hide(false);
            if (audio) {
                try { audio.pause(); } catch (_error) {}
            }
        });
        socketRef.on("connect", () => setTimer(() => socketRef.emit(REQUEST_EVENT), 180));
        if (socketRef.connected) socketRef.emit(REQUEST_EVENT);

        return {
            role,
            overlay,
            handleState,
            getState: () => state,
            destroy() {
                if (exitTimer != null) clearTimer(exitTimer);
                clearFade();
                RETRY_EVENTS.forEach((eventName) => documentRef.removeEventListener(eventName, retryAudio));
                dispatchAudioState(false, 0);
                if (audio) {
                    try { audio.pause(); } catch (_error) {}
                }
                overlay.remove();
            }
        };
    }

    return Object.freeze({
        ASSET_VERSION,
        DEFAULT_AUDIO_SECONDS,
        DEFAULT_AUDIO_URL,
        DEFAULT_FADE_MS,
        EXIT_AUDIO_FADE_MULTIPLIER,
        DEFAULT_TEXT,
        createController,
        normalizeState,
        versionedAudioUrl
    });
}));
