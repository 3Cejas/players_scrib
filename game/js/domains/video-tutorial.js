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

    const DEFAULT_DURATION_SECONDS = 153;
    const DEFAULT_AUDIO_URL = "../media/tutorial-scrib-audio.mp3";
    const AUDIO_ASSET_VERSION = "20260829r";
    const REQUEST_EVENT = "pedir_video_tutorial_estado";
    const STATE_EVENT = "video_tutorial_estado";
    const VERIFY_EVENT = "video_tutorial_verificar";
    const VISIBILITY_TRANSITION_MS = 620;
    const MUSIC_PREROLL_SECONDS = 3;
    const MAX_CONTINUOUS_AUDIO_DRIFT_SECONDS = 1.5;
    const NARRATION_RETRY_EVENTS = Object.freeze(["pointerdown", "touchstart", "keydown"]);

    // Los cambios visuales empiezan al entrar la voz, no al principio del pequeño
    // silencio de cada pista. Asi subtitulo, escena y narracion llegan juntos.
    const TIMELINE = Object.freeze([
        Object.freeze({ id: "welcome", start: 0, end: 9.3, title: "¡HOLA, MUSA!", label: "BIENVENIDA A <SCRI> B", copy: "Vamos a preparar tu móvil con calma para entrar al juego.", subtitle: "¡Hola! Bienvenida a <SCRI> B. Vamos a preparar tu móvil con calma para que puedas jugar y darle ideas a tu escritora." }),
        Object.freeze({ id: "access", start: 9.3, end: 37.38, title: "ESCANEA O ESCRIBE", label: "ENTRA EN WWW.SCRIBSHOW.ES/MUSA", copy: "Abre www.scribshow.es/musa o escanea el código QR.", subtitle: "Para entrar, abre www.scribshow.es/musa o escanea este código QR. Lo dejamos unos segundos para que tengas tiempo." }),
        Object.freeze({ id: "access-wait", start: 37.38, end: 47.32, title: "¿YA ESTÁS DENTRO?", label: "TÓMATE TU TIEMPO", copy: "El código seguirá en pantalla mientras terminas de entrar.", subtitle: "¿Ya lo has escaneado? ¡Perfecto! Y si todavía estás entrando, tranquila: te esperamos." }),
        Object.freeze({ id: "name", start: 47.32, end: 57.32, title: "ESCRIBE TU NOMBRE", label: "ESCRIBE TU NOMBRE", copy: "Escribe el nombre con el que quieres aparecer durante el show.", subtitle: "Cuando aparezca la pantalla de acceso, escribe el nombre con el que quieres que te reconozcan durante el show." }),
        Object.freeze({ id: "choices", start: 57.32, end: 68.34, title: "ELIGE TU EQUIPO", label: "ELIGE TU ESCRITXR", copy: "Puedes escoger directamente una escritxr o usar la detección automática.", subtitle: "Después verás dos formas de elegir. Puedes tocar directamente a la escritora con la que quieres jugar, en azul o en rojo." }),
        Object.freeze({ id: "manual", start: 68.34, end: 80.34, title: "AZUL O ROJO", label: "ELECCIÓN DIRECTA", copy: "Pulsa la tarjeta de la escritxr con la que quieras jugar.", subtitle: "Si ya sabes con quién quieres estar, pulsa su tarjeta. Verás claramente su nombre antes de confirmar." }),
        Object.freeze({ id: "automatic", start: 80.34, end: 93.3, title: "DETECCIÓN AUTOMÁTICA", label: "DETECCIÓN AUTOMÁTICA", copy: "Mantén el dedo sobre la huella hasta terminar.", subtitle: "¿Prefieres que sea sorpresa? Pulsa detección automática y mantén el dedo sobre la huella hasta que termine la animación." }),
        Object.freeze({ id: "assigned", start: 93.3, end: 103.26, title: "EQUIPO ASIGNADO", label: "EQUIPO Y ESCRITXR", copy: "Verás tu equipo y el nombre de tu escritxr antes de entrar.", subtitle: "Al finalizar verás tu equipo y el nombre de tu escritora. Revísalos y entra al juego." }),
        Object.freeze({ id: "ready", start: 103.26, end: 110.42, title: "PRUEBA DE PANTALLA", label: "PREPARA TU PANTALLA", copy: "Ahora comprobaremos juntos cuatro cambios de color.", subtitle: "¡Ya casi está! Ahora vamos a comprobar que tu pantalla responde bien con cuatro colores." }),
        Object.freeze({ id: "red", start: 110.42, end: 117.42, title: "ROJO", label: "ROJO", copy: "¿Ves toda la pantalla roja?", subtitle: "Primera prueba: rojo. ¿Lo ves? ¡Perfecto!" }),
        Object.freeze({ id: "blue", start: 117.42, end: 124.42, title: "AZUL", label: "AZUL", copy: "¿Ha cambiado toda la pantalla a azul?", subtitle: "Ahora azul. ¿Ha cambiado toda la pantalla?" }),
        Object.freeze({ id: "green", start: 124.42, end: 131.42, title: "VERDE", label: "VERDE", copy: "¿Ya ves toda la pantalla verde?", subtitle: "Seguimos con verde. ¡Esto marcha genial!" }),
        Object.freeze({ id: "white", start: 131.42, end: 138.28, title: "BLANCO", label: "BLANCO", copy: "¿Ha funcionado también el último cambio?", subtitle: "Y por último, blanco. ¿Ha funcionado también?" }),
        Object.freeze({ id: "complete", start: 138.28, end: 146.24, title: "PRUEBA COMPLETADA", label: "CONFIGURACIÓN VERIFICADA", copy: "Ya está todo preparado.", subtitle: "¡Prueba completada! Tu móvil está conectado y listo para participar." }),
        Object.freeze({ id: "farewell", start: 146.24, end: 153, title: "¡A INSPIRAR!", label: "YA ESTÁS PREPARADA", copy: "Prepárate para jugar y dar vida a la historia.", subtitle: "Gracias, musa. Prepárate para inspirar y disfrutar. ¡Nos vemos dentro!" })
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

    const SUBTITLE_ACCENTS = Object.freeze({
        "www.scribshow.es/musa": "link",
        azul: "blue",
        rojo: "red",
        verde: "green",
        blanco: "white",
        amarillo: "yellow",
        naranja: "orange",
        violeta: "violet",
        morado: "violet"
    });

    function renderSubtitle(documentRef, node, value) {
        if (!node) return;
        const text = String(value || "");
        const matcher = /(www\.scribshow\.es\/musa|azul|rojo|verde|blanco|amarillo|naranja|violeta|morado)/gi;
        const fragment = documentRef.createDocumentFragment();
        let cursor = 0;
        for (const match of text.matchAll(matcher)) {
            if (match.index > cursor) fragment.appendChild(documentRef.createTextNode(text.slice(cursor, match.index)));
            const accent = documentRef.createElement("span");
            accent.className = `scrib-video-tutorial__subtitle-accent scrib-video-tutorial__subtitle-accent--${SUBTITLE_ACCENTS[match[0].toLowerCase()]}`;
            accent.textContent = match[0];
            fragment.appendChild(accent);
            cursor = match.index + match[0].length;
        }
        if (cursor < text.length) fragment.appendChild(documentRef.createTextNode(text.slice(cursor)));
        node.replaceChildren(fragment);
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
        const configuredAudio = cleanText(config.audio_url || config.video_url, 500);

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
                audioUrl: /\.mp4(?:$|[?#])/i.test(configuredAudio) ? DEFAULT_AUDIO_URL : (configuredAudio || DEFAULT_AUDIO_URL)
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

    function safeAudioUrl(value, locationRef = null) {
        const candidate = cleanText(value, 500);
        const raw = !candidate || /\.mp4(?:$|[?#])/i.test(candidate) ? DEFAULT_AUDIO_URL : candidate;
        if (/^(?:javascript|data|blob):/i.test(raw)) return DEFAULT_AUDIO_URL;
        if (!locationRef || !locationRef.href || typeof URL !== "function") return raw;
        try {
            const resolved = new URL(raw, locationRef.href);
            if (!/^https?:$/i.test(resolved.protocol)) return DEFAULT_AUDIO_URL;
            if (/\/tutorial-scrib-audio\.mp3$/i.test(resolved.pathname) && !resolved.searchParams.has("v")) {
                resolved.searchParams.set("v", AUDIO_ASSET_VERSION);
            }
            return resolved.href;
        } catch (_error) {
            return DEFAULT_AUDIO_URL;
        }
    }

    function playbackKey(state) {
        if (!state) return "";
        return `${state.sessionId}:${state.phaseSeq}:${state.playbackSeq}`;
    }

    function continuousPosition(previousPosition, incomingPosition, samePlayback, durationSeconds = DEFAULT_DURATION_SECONDS) {
        const duration = Math.max(1, asFiniteNumber(durationSeconds, DEFAULT_DURATION_SECONDS));
        const incoming = clamp(asFiniteNumber(incomingPosition, 0), 0, duration);
        if (!samePlayback) return incoming;
        return clamp(Math.max(asFiniteNumber(previousPosition, 0), incoming), 0, duration);
    }

    function shouldSeekAudio(changed, currentPosition, targetPosition, maxDriftSeconds = MAX_CONTINUOUS_AUDIO_DRIFT_SECONDS) {
        if (changed) return true;
        const current = Number(currentPosition);
        const target = Number(targetPosition);
        if (!Number.isFinite(current) || !Number.isFinite(target)) return false;
        return Math.abs(current - target) > Math.max(0, asFiniteNumber(maxDriftSeconds, MAX_CONTINUOUS_AUDIO_DRIFT_SECONDS));
    }

    function requestId(windowRef) {
        try {
            if (windowRef.crypto && typeof windowRef.crypto.randomUUID === "function") {
                return windowRef.crypto.randomUUID();
            }
        } catch (_error) {}
        return `vt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
        root.setAttribute("aria-label", "Tutorial animado para conectarse a <SCRI> B");
        root.innerHTML = `
            <div class="scrib-video-tutorial__ambient" aria-hidden="true">
                <i class="scrib-video-tutorial__orb scrib-video-tutorial__orb--one"></i>
                <i class="scrib-video-tutorial__orb scrib-video-tutorial__orb--two"></i>
                <i class="scrib-video-tutorial__beam"></i>
                <i class="scrib-video-tutorial__grid"></i>
            </div>
            <header class="scrib-video-tutorial__brand" aria-hidden="true">
                <img class="scrib-video-tutorial__brand-mark" src="../media/scrib-logo-mark.png?v=20260829t" alt="">
            </header>
            <div class="scrib-video-tutorial__scene">
                <div class="scrib-video-tutorial__copy">
                    <h1 data-video-tutorial-title></h1>
                    <p class="scrib-video-tutorial__access-url">www.scribshow.es/musa</p>
                </div>
                <div class="scrib-video-tutorial__visual" aria-hidden="true">
                    <div class="scrib-video-tutorial__welcome-mark">
                        <span>✦</span>
                        <strong>INSPIRA</strong>
                        <img class="scrib-video-tutorial__welcome-qr" src="../media/scribshow-musa-qr.png?v=20260829t" alt="Código QR de www.scribshow.es/musa">
                    </div>
                    <div class="scrib-video-tutorial__phone">
                        <div class="scrib-video-tutorial__phone-speaker"></div>
                        <div class="scrib-video-tutorial__phone-screen">
                            <div class="scrib-video-tutorial__mobile-screen scrib-video-tutorial__mobile-screen--name">
                                <span>&lt;SCRI&gt; B</span><h2>¿CUÁL SERÁ<br>TU NOMBRE?</h2><div class="scrib-video-tutorial__fake-input">LUNA<i></i></div><b>⌄</b>
                            </div>
                            <div class="scrib-video-tutorial__mobile-screen scrib-video-tutorial__mobile-screen--choices">
                                <span>LUNA,</span><h2>ELIGE TU ESCRITXR</h2>
                                <div class="scrib-video-tutorial__team-grid">
                                    <div class="scrib-video-tutorial__team-card scrib-video-tutorial__team-card--blue"><img src="../public/img/pluma_azul.png" alt=""><strong data-video-writer-blue>ESCRITXR 1</strong><b>ELEGIR</b></div>
                                    <div class="scrib-video-tutorial__team-card scrib-video-tutorial__team-card--red"><img src="../public/img/pluma_roja.png" alt=""><strong data-video-writer-red>ESCRITXR 2</strong><b>ELEGIR</b></div>
                                </div>
                                <div class="scrib-video-tutorial__auto-button">☝ DETECCIÓN AUTOMÁTICA</div>
                            </div>
                            <div class="scrib-video-tutorial__mobile-screen scrib-video-tutorial__mobile-screen--fingerprint">
                                <span>DETECCIÓN AUTOMÁTICA</span><h2>PON TU DEDO</h2>
                                <div class="scrib-video-tutorial__fingerprint"><i></i><svg viewBox="0 0 120 140"><path d="M60 10C31 10 10 32 10 61M110 61C110 32 89 10 60 10M23 72V61C23 39 39 24 60 24s37 15 37 37v20M36 85V62c0-14 10-25 24-25s24 11 24 25v30M48 98V63c0-7 5-13 12-13s12 6 12 13v40M60 64v48"/></svg></div>
                                <p>MANTÉN EL DEDO SOBRE LA HUELLA</p>
                            </div>
                            <div class="scrib-video-tutorial__mobile-screen scrib-video-tutorial__mobile-screen--result">
                                <span>ASIGNACIÓN COMPLETADA</span><div class="scrib-video-tutorial__result-check">✓</div><small>TU ESCRITXR</small><b data-video-writer-result>ESCRITXR 1</b><i>ENTRAR AL JUEGO</i>
                            </div>
                        </div>
                    </div>
                    <div class="scrib-video-tutorial__tap"><i></i></div>
                    <div class="scrib-video-tutorial__color-stage"><i></i><strong data-video-color-title></strong></div>
                    <div class="scrib-video-tutorial__complete-mark"><i>✓</i><strong>LISTA PARA INSPIRAR</strong></div>
                </div>
            </div>
            <div class="scrib-video-tutorial__subtitles" aria-hidden="true">
                <p data-video-tutorial-subtitle></p>
            </div>
            <div class="scrib-video-tutorial__confetti" aria-hidden="true">${"<i></i>".repeat(18)}</div>
            <audio class="scrib-video-tutorial__audio" preload="auto" autoplay></audio>
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
            <div class="scrib-video-tutorial-device__ambient" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <div class="scrib-video-tutorial-device__scan" aria-hidden="true"></div>
            <div class="scrib-video-tutorial-device__card">
                <span class="scrib-video-tutorial-device__eyebrow" data-video-tutorial-eyebrow>PRUEBA DE CONEXIÓN</span>
                <div class="scrib-video-tutorial-device__check" aria-hidden="true">✓</div>
                <div class="scrib-video-tutorial-device__phase-visual" aria-hidden="true"><i></i><strong data-video-tutorial-device-symbol>✦</strong><b></b></div>
                <div class="scrib-video-tutorial-device__mini-phone" aria-hidden="true">
                    <i class="scrib-video-tutorial-device__mini-speaker"></i>
                    <div class="scrib-video-tutorial-device__mini-screen">
                        <div class="scrib-video-tutorial-device__mini-step scrib-video-tutorial-device__mini-step--name"><small>TU NOMBRE</small><strong>LUNA<i></i></strong></div>
                        <div class="scrib-video-tutorial-device__mini-step scrib-video-tutorial-device__mini-step--choices"><span></span><span></span></div>
                        <div class="scrib-video-tutorial-device__mini-step scrib-video-tutorial-device__mini-step--fingerprint"><i></i><b>◎</b></div>
                        <div class="scrib-video-tutorial-device__mini-step scrib-video-tutorial-device__mini-step--assigned"><i>✓</i><strong>TU ESCRITXR</strong></div>
                    </div>
                </div>
                <h1 id="video_tutorial_musa_title" data-video-tutorial-title>CONEXIÓN RECIBIDA</h1>
                <p data-video-tutorial-copy>Sigue las instrucciones de la pantalla principal.</p>
                <div class="scrib-video-tutorial-device__share" aria-label="Código QR para invitar a otra musa">
                    <img src="../../media/scribshow-musa-qr.png?v=20260829t" alt="Código QR de www.scribshow.es/musa">
                    <div><strong>¿FALTA ALGUIEN?</strong><span class="scrib-video-tutorial-device__url">www.scribshow.es/musa</span><small>ENSÉÑALE ESTE CÓDIGO</small></div>
                </div>
                <div class="scrib-video-tutorial-device__identity" data-video-tutorial-identity><span data-video-tutorial-muse-name></span><span data-video-tutorial-writer-name></span></div>
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
        const audio = root.querySelector("audio");
        const liveRegion = root.querySelector("[data-video-tutorial-live]");
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
        let activeAudioUrl = "";
        let lastPhaseId = "";
        let verifying = false;
        let locallyVerified = false;
        let hideTransitionTimer = null;
        let verificationRetryTimer = null;
        let spectatorTutorialVisible = false;
        let musicPrerollAnnounced = false;

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
            const visibilityChanged = role === "spectator" && spectatorTutorialVisible !== Boolean(visible);
            spectatorTutorialVisible = Boolean(visible);
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
                if (visibilityChanged && typeof windowRef.CustomEvent === "function") {
                    documentRef.dispatchEvent(new windowRef.CustomEvent("scrib:video-tutorial-visibility", {
                        detail: { visible: true }
                    }));
                }
                return;
            }

            root.setAttribute("aria-hidden", "true");
            documentRef.body.classList.remove("scrib-video-tutorial-active");
            root.classList.remove("is-visible");
            root.classList.add("is-leaving");
            if (visibilityChanged && typeof windowRef.CustomEvent === "function") {
                documentRef.dispatchEvent(new windowRef.CustomEvent("scrib:video-tutorial-visibility", {
                    detail: { visible: false }
                }));
            }
            if (audio) {
                try { audio.pause(); } catch (_error) {}
            }
            const reducedMotion = Boolean(windowRef.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
            hideTransitionTimer = windowRef.setTimeout(() => {
                root.hidden = true;
                root.classList.remove("is-leaving");
                hideTransitionTimer = null;
            }, reducedMotion ? 0 : VISIBILITY_TRANSITION_MS);
        }

        function playSoundtrack(position, force = false) {
            if (!audio || !state || !state.visible) return;
            const nextUrl = safeAudioUrl(state.config.audioUrl, windowRef.location);
            const nextKey = playbackKey(state);
            const changed = force || nextKey !== activePlaybackKey || nextUrl !== activeAudioUrl;
            if (changed) {
                activePlaybackKey = nextKey;
                activeAudioUrl = nextUrl;
                audio.src = nextUrl;
                audio.defaultMuted = false;
                audio.muted = false;
                audio.volume = 1;
                audio.removeAttribute("muted");
                audio.currentTime = 0;
                audio.load();
            }

            const seekAndPlay = () => {
                try {
                    if (Number.isFinite(audio.duration) && audio.duration > 0) {
                        const target = Math.min(position, Math.max(0, audio.duration - 0.05));
                        if (shouldSeekAudio(changed, audio.currentTime, target)) audio.currentTime = target;
                    }
                } catch (_error) {}
                const attempt = audio.play();
                if (!attempt || typeof attempt.catch !== "function") return;
                attempt.then(() => delete audio.dataset.narrationBlocked)
                    .catch(() => { audio.dataset.narrationBlocked = "true"; });
            };

            if (audio.readyState >= 1) seekAndPlay();
            else audio.addEventListener("loadedmetadata", seekAndPlay, { once: true });
        }

        function writerName(id, fallback) {
            const node = documentRef.getElementById(id);
            return cleanText(node && (node.value || node.textContent), 34) || fallback;
        }

        function refreshWriterNames() {
            if (role !== "spectator") return;
            const blue = writerName("nombre", "ESCRITXR 1");
            const red = writerName("nombre1", "ESCRITXR 2");
            root.querySelectorAll("[data-video-writer-blue]").forEach((node) => { node.textContent = blue; });
            root.querySelectorAll("[data-video-writer-red]").forEach((node) => { node.textContent = red; });
            root.querySelectorAll("[data-video-writer-result]").forEach((node) => { node.textContent = blue; });
        }

        function enterSpectatorPhase(phase) {
            root.dataset.scene = phase.id;
            const title = root.querySelector("[data-video-tutorial-title]");
            const colorTitle = root.querySelector("[data-video-color-title]");
            const subtitle = root.querySelector("[data-video-tutorial-subtitle]");
            if (title) title.textContent = phase.title;
            if (colorTitle) colorTitle.textContent = phase.title;
            renderSubtitle(documentRef, subtitle, phase.subtitle || phase.copy);
            refreshWriterNames();
            root.classList.remove("is-scene-entering");
            void root.offsetWidth;
            root.classList.add("is-scene-entering");
            if (liveRegion) liveRegion.textContent = phase.subtitle || `${phase.label}. ${phase.copy}`;
        }

        function museContext() {
            const muse = cleanText(documentRef.getElementById("nombre_musa_label")?.textContent, 24);
            const writerFromPage = cleanText(documentRef.getElementById("nombre")?.value || documentRef.getElementById("nombre")?.textContent, 36);
            let player = "";
            let writerFromUrl = "";
            try {
                const params = new URLSearchParams(windowRef.location.search);
                player = params.get("player") || "";
                writerFromUrl = cleanText(params.get("escritxr"), 36);
            } catch (_error) {}
            return {
                player: player === "1" || player === "2" ? player : "",
                muse,
                writer: writerFromPage || writerFromUrl
            };
        }

        function renderMuse(position) {
            const phase = phaseAt(position);
            const visualPhase = locallyVerified ? "verified" : phase.id;
            const title = root.querySelector("[data-video-tutorial-title]");
            const copy = root.querySelector("[data-video-tutorial-copy]");
            const eyebrow = root.querySelector("[data-video-tutorial-eyebrow]");
            const identity = root.querySelector("[data-video-tutorial-identity]");
            const museName = root.querySelector("[data-video-tutorial-muse-name]");
            const writerName = root.querySelector("[data-video-tutorial-writer-name]");
            const symbol = root.querySelector("[data-video-tutorial-device-symbol]");
            const context = museContext();
            const symbols = {
                welcome: "✦",
                name: "✎",
                choices: "◆",
                manual: "☝",
                automatic: "◎",
                assigned: "✓",
                ready: "••••",
                complete: "✓",
                farewell: "✦",
                verified: "✓"
            };
            root.dataset.phase = visualPhase;
            root.dataset.team = context.player;
            root.classList.toggle("is-verified", locallyVerified);
            const accessPhase = phase.id === "access" || phase.id === "access-wait";
            if (title) {
                title.textContent = locallyVerified
                    ? "CONFIGURACIÓN VERIFICADA"
                    : (phase.id === "access" ? "ENTRA EN LA WEB O ESCANEA" : phase.label);
            }
            if (copy) {
                copy.hidden = locallyVerified || accessPhase;
                copy.textContent = locallyVerified || accessPhase ? "" : phase.copy;
            }
            if (eyebrow) {
                eyebrow.hidden = locallyVerified;
                eyebrow.textContent = locallyVerified ? "" : "PRUEBA DE CONEXIÓN";
            }
            if (identity) identity.hidden = locallyVerified;
            if (museName) museName.textContent = context.muse;
            if (writerName) writerName.textContent = context.writer;
            if (symbol) symbol.textContent = symbols[visualPhase] || "✦";
            if (visualPhase !== lastPhaseId) {
                lastPhaseId = visualPhase;
                root.classList.remove("is-phase-entering");
                void root.offsetWidth;
                root.classList.add("is-phase-entering");
                if (liveRegion) liveRegion.textContent = phase.label;
                if (phase.id === "complete" && !locallyVerified) scheduleAutomaticVerification();
            }
        }

        function renderSpectator(position) {
            const phase = phaseAt(position);
            if (phase.id === lastPhaseId) return;
            lastPhaseId = phase.id;
            enterSpectatorPhase(phase);
        }

        function announceMusicPreroll(position) {
            if (
                role !== "spectator"
                || musicPrerollAnnounced
                || !state
                || !state.visible
                || position < Math.max(0, state.config.durationSeconds - MUSIC_PREROLL_SECONDS)
            ) return;
            musicPrerollAnnounced = true;
            if (typeof windowRef.CustomEvent === "function") {
                documentRef.dispatchEvent(new windowRef.CustomEvent("scrib:video-tutorial-ending", {
                    detail: { secondsRemaining: Math.max(0, state.config.durationSeconds - position) }
                }));
            }
        }

        function scheduleAutomaticVerification(delay = 0) {
            if (verificationRetryTimer != null || locallyVerified || verifying) return;
            verificationRetryTimer = windowRef.setTimeout(() => {
                verificationRetryTimer = null;
                verify();
            }, delay);
        }

        function tick() {
            frameId = null;
            if (!state || !state.visible) return;
            const position = currentPosition();
            if (role === "spectator") {
                announceMusicPreroll(position);
                renderSpectator(position);
            }
            else renderMuse(position);
            frameId = scheduleFrame(tick);
        }

        function beginTicking() {
            if (frameId != null) cancelFrame(frameId);
            frameId = scheduleFrame(tick);
        }

        function handleState(raw = {}) {
            const previousState = state;
            const previousKey = playbackKey(state);
            const previousPosition = currentPosition();
            const nextState = normalizeState(raw);
            const nextKey = playbackKey(nextState);
            const samePlayback = Boolean(
                previousState
                && previousState.visible
                && nextState.visible
                && previousKey
                && nextKey === previousKey
            );
            state = nextState;
            syncReceivedAt = Date.now();
            syncPosition = continuousPosition(
                previousPosition,
                state.positionSeconds,
                samePlayback,
                state.config.durationSeconds
            );
            if (nextKey !== previousKey) {
                verifying = false;
                lastPhaseId = "";
                musicPrerollAnnounced = false;
                if (verificationRetryTimer != null) windowRef.clearTimeout(verificationRetryTimer);
                verificationRetryTimer = null;
                restoreLocalVerification();
            }
            setVisible(state.visible);
            if (!state.visible) {
                if (frameId != null) cancelFrame(frameId);
                frameId = null;
                return;
            }
            if (role === "spectator") {
                announceMusicPreroll(syncPosition);
                renderSpectator(syncPosition);
                playSoundtrack(syncPosition, nextKey !== previousKey);
            } else {
                renderMuse(syncPosition);
            }
            beginTicking();
        }

        function verify() {
            if (!state || !state.visible || verifying || locallyVerified) return;
            if (!["complete", "farewell"].includes(phaseAt(currentPosition()).id)) return;
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
                    if (liveRegion) liveRegion.textContent = "Configuración verificada correctamente.";
                } else if (state?.visible) {
                    scheduleAutomaticVerification(1800);
                }
                renderMuse(currentPosition());
            };
            socketRef.emit(VERIFY_EVENT, payload, settle);
            windowRef.setTimeout(() => settle({ ok: false }), 4500);
        }

        const retryNarration = () => {
            if (role !== "spectator" || !state || !state.visible || !audio?.paused) return;
            playSoundtrack(currentPosition());
        };
        NARRATION_RETRY_EVENTS.forEach((eventName) => {
            documentRef.addEventListener(eventName, retryNarration, { passive: true });
        });
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
                if (verificationRetryTimer != null) windowRef.clearTimeout(verificationRetryTimer);
                NARRATION_RETRY_EVENTS.forEach((eventName) => {
                    documentRef.removeEventListener(eventName, retryNarration);
                });
                try { audio?.pause(); } catch (_error) {}
                root.remove();
            }
        };
    }

    return Object.freeze({
        DEFAULT_DURATION_SECONDS,
        DEFAULT_AUDIO_URL,
        MUSIC_PREROLL_SECONDS,
        TIMELINE,
        normalizeState,
        normalizeVerification,
        phaseAt,
        progressAt,
        safeAudioUrl,
        playbackKey,
        continuousPosition,
        shouldSeekAudio,
        createController
    });
}));
