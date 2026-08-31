(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (!root) return;
    root.ScribShowNarration = api;
    if (!root.document) return;
    const socketRef = typeof socket !== "undefined" ? socket : null;
    if (!socketRef) return;

    const start = () => {
        if (root.__scribShowNarrationController) return;
        root.__scribShowNarrationController = api.createController({
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

    const REQUEST_EVENT = "pedir_narracion_show_estado";
    const STATE_EVENT = "narracion_show_estado";
    const DEFAULT_PREROLL_SECONDS = 5;
    const DEFAULT_AUDIO_SECONDS = 80.013;
    const DEFAULT_AUDIO_URL = "../media/narracion-show.mp3";
    const DEFAULT_SLIDE_URL = "../media/narracion-final.png";
    const ASSET_VERSION = "20260831f";
    const MAX_AUDIO_DRIFT_SECONDS = 1.25;
    const RETRY_EVENTS = Object.freeze(["pointerdown", "touchstart", "keydown"]);

    const SCENES = Object.freeze([
        Object.freeze({ id: "black", start: 0, title: "", kicker: "" }),
        Object.freeze({ id: "binary", start: 5, title: "DOS SÍMBOLOS", kicker: "UN LENGUAJE INFINITO", glyph: "0  1" }),
        Object.freeze({ id: "speed", start: 15.28, title: "VELOCIDAD", kicker: "MÁS ALLÁ DE LO HUMANO", glyph: "∞" }),
        Object.freeze({ id: "origin-code", start: 18.8, title: "200 AÑOS", kicker: "", glyph: "" }),
        Object.freeze({ id: "precision", start: 21.94, title: "PRECISIÓN", kicker: "UN ORDEN PERFECTO", glyph: "{ }" }),
        Object.freeze({ id: "programming", start: 34.06, title: "PROGRAMACIÓN", kicker: "LA TECNOLOGÍA DEL CÓDIGO", glyph: "</>" }),
        Object.freeze({ id: "writing-question", start: 37.94, title: "OTRA TECNOLOGÍA", kicker: "LA ESCRITURA YA ESTABA AQUÍ", glyph: "Aa" }),
        Object.freeze({ id: "writing-origin", start: 45.58, title: "5.000 AÑOS", kicker: "EL NACIMIENTO DE LA ESCRITURA", glyph: "𓂀" }),
        Object.freeze({ id: "journey", start: 49.44, title: "TIEMPO Y ESPACIO", kicker: "UN VIAJE HACIA EL FUTURO", glyph: "→" }),
        Object.freeze({ id: "eternal", start: 56.36, title: "ETERNIDAD", kicker: "LO ESCRITO PERMANECE", glyph: "∞" }),
        Object.freeze({ id: "writing", start: 65.48, title: "ESCRITURA", kicker: "LA TECNOLOGÍA DE LAS PALABRAS", glyph: "Aa" }),
        Object.freeze({ id: "fusion", start: 70.26, title: "CÓDIGO + PALABRA", kicker: "DOS MUNDOS SE ENCUENTRAN", glyph: "0 A" }),
        Object.freeze({ id: "today", start: 76.02, title: "¿Y SI FUERA HOY?", kicker: "ALGO ESTÁ A PUNTO DE NACER", glyph: "?" }),
        Object.freeze({ id: "reveal", start: 80, title: "", kicker: "", glyph: "" }),
        Object.freeze({ id: "brand", start: 82.38, title: "<SCRI> B", kicker: "", glyph: "" }),
        Object.freeze({ id: "final", start: 85.013, title: "", kicker: "" })
    ]);

    // Marcas obtenidas de la locución real (tiempo de audio + 5 s de pre-roll).
    // Los huecos respetan las pausas de la voz: el siguiente texto nunca se
    // adelanta a una palabra que todavía no se ha pronunciado.
    const SUBTITLES = Object.freeze([
        Object.freeze({ start: 6.38, end: 10.82, text: "¿Y si existe un lenguaje de tan solo dos símbolos?" }),
        Object.freeze({ start: 10.98, end: 14.22, text: "Capaz de expresar aquello que los humanos no podemos." }),
        Object.freeze({ start: 14.78, end: 17.34, text: "A una velocidad inimaginable." }),
        Object.freeze({ start: 17.74, end: 21.48, text: "Que nos dirige doscientos años atrás, cuando se inventó." }),
        Object.freeze({ start: 21.94, end: 23.48, text: "Con un orden perfecto." }),
        Object.freeze({ start: 23.78, end: 30.74, text: "Con una exactitud en su semántica que puede detener guerras enteras y firmar paces eternas." }),
        Object.freeze({ start: 31.64, end: 33.48, text: "¿Realmente hay un lenguaje así?" }),
        Object.freeze({ start: 34.06, end: 36.82, text: "Esa es la tecnología de la programación." }),
        Object.freeze({ start: 37.94, end: 40.12, text: "¿Qué pasaría si les dijera…" }),
        Object.freeze({ start: 40.68, end: 44.48, text: "que cada día todos aquí usan una tecnología en la que apenas reparan?" }),
        Object.freeze({ start: 45.58, end: 48.78, text: "Una que nos lleva cinco mil años atrás, cuando la inventamos." }),
        Object.freeze({ start: 49.44, end: 53.32, text: "Ha recorrido grandes distancias en el tiempo y el espacio hasta llegar al futuro." }),
        Object.freeze({ start: 54.08, end: 56.36, text: "Es tan sencilla que un niño la puede usar." }),
        Object.freeze({ start: 56.36, end: 59.4, text: "Y hace que verdaderamente seamos eternos." }),
        Object.freeze({ start: 60.76, end: 62.4, text: "¿No es eso magia?" }),
        Object.freeze({ start: 62.82, end: 65.12, text: "Hay una tecnología así." }),
        Object.freeze({ start: 65.48, end: 68.76, text: "Esa tecnología es la escritura." }),
        Object.freeze({ start: 70.26, end: 74.4, text: "¿Y si un día la programación y la escritura se fusionaran…" }),
        Object.freeze({ start: 74.4, end: 75.62, text: "creando un videojuego?" }),
        Object.freeze({ start: 76.02, end: 77.96, text: "¿Y si ese día fuera hoy?" }),
        Object.freeze({ start: 79.22, end: 80, text: "¿Qué surgiría?" }),
        Object.freeze({ start: 80, end: 82.38, text: "¡Surgiría…!", tone: "reveal" }),
        Object.freeze({ start: 82.38, end: 83.76, text: "<SCRI> B", tone: "brand" })
    ]);

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const clean = (value, max = 2048) => String(value == null ? "" : value).trim().slice(0, max);

    function versionedAssetUrl(value, fallback, locationRef, extension) {
        let resolved;
        try {
            resolved = new URL(clean(value) || fallback, locationRef && locationRef.href ? locationRef.href : "https://scrib.invalid/");
        } catch (_error) {
            resolved = new URL(fallback, "https://scrib.invalid/");
        }
        const protocol = String(resolved.protocol || "").toLowerCase();
        if (!["http:", "https:"].includes(protocol) || !new RegExp(`\\.${extension}$`, "i").test(resolved.pathname)) {
            resolved = new URL(fallback, locationRef && locationRef.href ? locationRef.href : "https://scrib.invalid/");
        }
        if (!resolved.searchParams.has("v")) resolved.searchParams.set("v", ASSET_VERSION);
        return resolved.href;
    }

    function normalizeState(raw = {}) {
        const data = raw && typeof raw === "object" ? raw : {};
        const config = data.configuracion && typeof data.configuracion === "object" ? data.configuracion : {};
        return {
            active: Boolean(data.activa ?? data.reproduciendo),
            sessionId: clean(data.session_id, 128),
            sequence: Math.max(0, Math.trunc(finite(data.secuencia, 0))),
            startedAt: Math.max(0, finite(data.inicio_ts, 0)),
            positionSeconds: Math.max(0, finite(data.posicion_segundos, 0)),
            config: {
                prerollSeconds: clamp(finite(config.pre_roll_segundos, DEFAULT_PREROLL_SECONDS), 0, 30),
                audioSeconds: clamp(finite(config.duracion_audio_segundos, DEFAULT_AUDIO_SECONDS), 1, 3600),
                audioUrl: clean(config.audio_url) || DEFAULT_AUDIO_URL,
                slideUrl: clean(config.slide_url) || DEFAULT_SLIDE_URL
            }
        };
    }

    function sceneAt(position) {
        const value = Math.max(0, finite(position, 0));
        for (let index = SCENES.length - 1; index >= 0; index -= 1) {
            if (value >= SCENES[index].start) return SCENES[index];
        }
        return SCENES[0];
    }

    function subtitleAt(position) {
        const value = Math.max(0, finite(position, 0));
        return SUBTITLES.find((item) => value >= item.start && value < item.end) || null;
    }

    function inferRole(documentRef) {
        const body = documentRef && documentRef.body;
        if (body && body.classList && body.classList.contains("page-spectator")) return "spectator";
        const path = String(documentRef && documentRef.location && documentRef.location.pathname || "");
        if (/\/spectator\//i.test(path)) return "spectator";
        if (/\/public\/players\//i.test(path)) return "muse";
        return "";
    }

    function createSpectatorOverlay(documentRef) {
        const root = documentRef.createElement("section");
        root.id = "show_narration_overlay";
        root.className = "scrib-show-narration scrib-show-narration--spectator";
        root.hidden = true;
        root.setAttribute("aria-hidden", "true");
        root.innerHTML = `
            <div class="scrib-show-narration__world" aria-hidden="true">
                <div class="scrib-show-narration__aurora"></div>
                <div class="scrib-show-narration__grid"></div>
                <div class="scrib-show-narration__binary">${"<i>01</i>".repeat(18)}</div>
                <div class="scrib-show-narration__orbit scrib-show-narration__orbit--one"></div>
                <div class="scrib-show-narration__orbit scrib-show-narration__orbit--two"></div>
                <div class="scrib-show-narration__paper">${"<i></i>".repeat(9)}</div>
                <div class="scrib-show-narration__stroke"></div>
                <div class="scrib-show-narration__fusion"><i></i><i></i><b></b></div>
                <div class="scrib-show-narration__date" aria-hidden="true"><span>1820</span></div>
                <img class="scrib-show-narration__brand" src="../media/scrib-logo-mark.png?v=${ASSET_VERSION}" alt="" aria-hidden="true">
                <div class="scrib-show-narration__glyph" data-show-glyph></div>
            </div>
            <div class="scrib-show-narration__subtitle" aria-hidden="true" hidden><p data-show-subtitle></p></div>
            <img class="scrib-show-narration__final" data-show-final alt="&lt;SCRI&gt; B, el primer videojuego de escritura improvisada">
            <audio class="scrib-show-narration__audio" preload="auto"></audio>
            <p class="scrib-visually-hidden" role="status" aria-live="assertive" data-show-live></p>`;
        documentRef.body.appendChild(root);
        return root;
    }

    function createMuseOverlay(documentRef) {
        const root = documentRef.createElement("section");
        root.id = "show_narration_muse";
        root.className = "scrib-show-lights";
        root.hidden = true;
        root.setAttribute("aria-hidden", "true");
        root.innerHTML = `
            <div class="scrib-show-lights__wash" aria-hidden="true"></div>
            <div class="scrib-show-lights__beams" aria-hidden="true">${"<i></i>".repeat(8)}</div>
            <div class="scrib-show-lights__rings" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="scrib-show-lights__particles" aria-hidden="true">${"<i></i>".repeat(16)}</div>
            <div class="scrib-show-lights__date" aria-hidden="true"><span>1820</span></div>
            <img class="scrib-show-lights__brand" src="../../media/scrib-logo-mark.png?v=${ASSET_VERSION}" alt="" aria-hidden="true">
            <strong class="scrib-show-lights__glyph" data-show-glyph aria-hidden="true"></strong>
            <div class="scrib-show-lights__subtitle" aria-hidden="true" hidden><p data-show-subtitle></p></div>
            <p class="scrib-visually-hidden" role="status" aria-live="polite" data-show-live></p>`;
        documentRef.body.appendChild(root);
        return root;
    }

    function createController(options = {}) {
        const windowRef = options.windowRef;
        const documentRef = options.documentRef;
        const socketRef = options.socketRef;
        const role = options.role || inferRole(documentRef);
        if (!windowRef || !documentRef || !socketRef || !role) return null;

        const root = role === "spectator" ? createSpectatorOverlay(documentRef) : createMuseOverlay(documentRef);
        const audio = root.querySelector("audio");
        const finalImage = root.querySelector("[data-show-final]");
        const live = root.querySelector("[data-show-live]");
        const subtitleNode = root.querySelector("[data-show-subtitle]");
        const subtitleBox = subtitleNode ? subtitleNode.parentElement : null;
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
        let activeKey = "";
        let renderedScene = "";
        let renderedSubtitle = "";
        let finalAnnounced = false;

        const currentPosition = () => state && state.active
            ? Math.max(0, syncPosition + ((Date.now() - syncReceivedAt) / 1000))
            : 0;

        const dispatch = (name, detail) => {
            if (role !== "spectator" || typeof windowRef.CustomEvent !== "function") return;
            documentRef.dispatchEvent(new windowRef.CustomEvent(name, { detail }));
        };

        const requestUnderlyingView = () => {
            if (socketRef.connected === false || typeof socketRef.emit !== "function") return;
            socketRef.emit("pedir_vista_espectador_modo");
            socketRef.emit("pedir_pre_show_estado");
        };

        const pauseAudio = (reset = false) => {
            if (!audio) return;
            try {
                audio.pause();
                if (reset) audio.currentTime = 0;
            } catch (_error) {}
        };

        const setVisible = (visible) => {
            const next = Boolean(visible);
            const changed = !root.hidden !== next;
            if (next) {
                root.hidden = false;
                root.setAttribute("aria-hidden", "false");
                documentRef.body.classList.add("scrib-show-narration-active");
                void root.offsetWidth;
                root.classList.add("is-visible");
                if (changed) dispatch("scrib:show-narration-visibility", { visible: true, immediate: true });
                return;
            }
            root.classList.remove("is-visible");
            root.setAttribute("aria-hidden", "true");
            root.hidden = true;
            documentRef.body.classList.remove("scrib-show-narration-active");
            pauseAudio(true);
            if (changed) {
                dispatch("scrib:show-narration-visibility", { visible: false, immediate: false });
                requestUnderlyingView();
            }
            finalAnnounced = false;
            renderedScene = "";
            renderedSubtitle = "";
        };

        const playNarration = (position, force = false) => {
            if (role !== "spectator" || !audio || !state || !state.active) return;
            const audioPosition = position - state.config.prerollSeconds;
            if (audioPosition < 0 || audioPosition >= state.config.audioSeconds) {
                pauseAudio(audioPosition < 0);
                return;
            }
            const url = versionedAssetUrl(state.config.audioUrl, DEFAULT_AUDIO_URL, windowRef.location, "mp3");
            if (force || audio.src !== url) {
                audio.src = url;
                audio.volume = 1;
                audio.muted = false;
                audio.load();
            }
            if (!force && !audio.paused) return;
            const start = () => {
                try {
                    if (force || Math.abs(finite(audio.currentTime, 0) - audioPosition) > MAX_AUDIO_DRIFT_SECONDS) {
                        audio.currentTime = Math.min(audioPosition, Math.max(0, state.config.audioSeconds - 0.05));
                    }
                } catch (_error) {}
                const attempt = audio.play();
                if (attempt && typeof attempt.catch === "function") {
                    attempt.then(() => delete audio.dataset.blocked).catch(() => { audio.dataset.blocked = "true"; });
                }
            };
            if (audio.readyState >= 1) start();
            else audio.addEventListener("loadedmetadata", start, { once: true });
        };

        const render = (position) => {
            const scene = sceneAt(position);
            if (scene.id !== renderedScene) {
                renderedScene = scene.id;
                root.dataset.scene = scene.id;
                const glyph = root.querySelector("[data-show-glyph]");
                if (glyph) glyph.textContent = scene.glyph || "";
                root.classList.remove("is-scene-entering");
                void root.offsetWidth;
                root.classList.add("is-scene-entering");
                if (live && scene.title) live.textContent = `${scene.title}. ${scene.kicker}`;
            }
            const cue = subtitleAt(position);
            const subtitle = cue ? cue.text : "";
            if (subtitleBox) subtitleBox.hidden = !subtitle;
            if (subtitle !== renderedSubtitle) {
                renderedSubtitle = subtitle;
                const node = subtitleNode;
                if (node) {
                    node.textContent = subtitle;
                    node.dataset.tone = cue && cue.tone ? cue.tone : "narration";
                    node.classList.remove("is-entering");
                    void node.offsetWidth;
                    if (subtitle) node.classList.add("is-entering");
                }
            }
            if (role === "spectator") {
                if (scene.id === "final" && !finalAnnounced) {
                    finalAnnounced = true;
                    dispatch("scrib:show-narration-final", { immediate: true });
                }
            }
        };

        const tick = () => {
            frameId = null;
            if (!state || !state.active) return;
            const position = currentPosition();
            render(position);
            playNarration(position);
            frameId = scheduleFrame(tick);
        };

        const handleState = (raw = {}) => {
            const previousPosition = currentPosition();
            const previousKey = activeKey;
            const next = normalizeState(raw);
            activeKey = `${next.sessionId}:${next.sequence}`;
            const samePlayback = Boolean(state && state.active && next.active && previousKey === activeKey);
            state = next;
            syncReceivedAt = Date.now();
            syncPosition = samePlayback && Math.abs(previousPosition - next.positionSeconds) < 2
                ? previousPosition
                : next.positionSeconds;
            if (activeKey !== previousKey) {
                renderedScene = "";
                renderedSubtitle = "";
                finalAnnounced = false;
                if (role === "spectator" && finalImage) {
                    finalImage.src = versionedAssetUrl(state.config.slideUrl, DEFAULT_SLIDE_URL, windowRef.location, "png");
                }
            }
            setVisible(state.active);
            if (frameId != null) cancelFrame(frameId);
            frameId = null;
            if (!state.active) return;
            render(syncPosition);
            playNarration(syncPosition, activeKey !== previousKey);
            frameId = scheduleFrame(tick);
        };

        const retry = () => {
            if (role !== "spectator" || !state || !state.active || !audio || !audio.paused) return;
            playNarration(currentPosition(), true);
        };
        RETRY_EVENTS.forEach((name) => documentRef.addEventListener(name, retry, { passive: true }));
        socketRef.on(STATE_EVENT, handleState);
        socketRef.on("disconnect", () => setVisible(false));
        socketRef.on("connect", () => windowRef.setTimeout(() => socketRef.emit(REQUEST_EVENT), 220));
        if (socketRef.connected) socketRef.emit(REQUEST_EVENT);

        return {
            role,
            root,
            handleState,
            getPosition: currentPosition,
            getState: () => state,
            destroy() {
                if (frameId != null) cancelFrame(frameId);
                RETRY_EVENTS.forEach((name) => documentRef.removeEventListener(name, retry));
                pauseAudio(true);
                root.remove();
            }
        };
    }

    return Object.freeze({
        DEFAULT_AUDIO_SECONDS,
        DEFAULT_AUDIO_URL,
        DEFAULT_PREROLL_SECONDS,
        DEFAULT_SLIDE_URL,
        SCENES,
        SUBTITLES,
        createController,
        normalizeState,
        sceneAt,
        subtitleAt,
        versionedAssetUrl
    });
}));
