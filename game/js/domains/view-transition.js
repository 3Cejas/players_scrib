(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.ScribViewTransition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const COVER_MS = 320;
    const REVEAL_MS = 620;
    const AUDIO_FADE_MS = 3000;
    const MUSIC_MODES = Object.freeze(["tutorial", "calentamiento"]);

    const VIEW_LABELS = Object.freeze({
        partida: "VISTA PARTIDA",
        tutorial: "VISTA TUTORIAL",
        calentamiento: "VISTA DETONADORES",
        stats: "ESTADÍSTICAS",
        puntuacion: "RESULTADO",
        nube_inspiracion: "NUBE DE INSPIRACIÓN",
        creditos: "CRÉDITOS",
        espera: "ESPERA CREATIVA",
        resultado: "FIN DE PARTIDA"
    });

    function viewLabel(mode) {
        return VIEW_LABELS[mode] || "NUEVA VISTA";
    }

    function createAudioController(options = {}) {
        const windowRef = options.windowRef || (typeof window !== "undefined" ? window : null);
        const documentRef = options.documentRef || (windowRef && windowRef.document) || null;
        const createAudio = typeof options.createAudio === "function"
            ? options.createAudio
            : (url) => (windowRef && typeof windowRef.Audio === "function" ? new windowRef.Audio(url) : null);
        const setTimer = options.setTimer || setTimeout;
        const clearTimer = options.clearTimer || clearTimeout;
        const now = typeof options.now === "function" ? options.now : Date.now;
        const fadeDurationMs = Math.max(0, Number(options.fadeDurationMs) || AUDIO_FADE_MS);
        const musicVolume = Math.max(0, Math.min(1, Number(options.musicVolume) || 0.48));
        const transitionVolume = Math.max(0, Math.min(1, Number(options.transitionVolume) || 0.72));
        const musicModes = new Set(Array.isArray(options.musicModes) ? options.musicModes : MUSIC_MODES);
        const music = createAudio(options.musicUrl || "");
        const transitionSound = createAudio(options.transitionUrl || "");
        let currentMode = "";
        let ducked = false;
        let blocked = false;
        let fadeTimer = null;
        let fadeSequence = 0;

        if (music) {
            music.loop = true;
            music.preload = "auto";
            music.volume = 0;
            music.setAttribute?.("data-spectator-view-music", "true");
        }
        if (transitionSound) {
            transitionSound.preload = "auto";
            transitionSound.volume = transitionVolume;
            transitionSound.setAttribute?.("data-spectator-view-sound", "true");
        }

        const normalizeMode = (value) => {
            const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
            return mode || "partida";
        };

        const playMedia = (media, trackBlocked = false) => {
            if (!media || typeof media.play !== "function") return;
            try {
                const result = media.play();
                if (result && typeof result.catch === "function") {
                    result.then(() => {
                        if (trackBlocked) blocked = false;
                    }).catch(() => {
                        if (trackBlocked) blocked = true;
                    });
                }
            } catch (_error) {
                if (trackBlocked) blocked = true;
            }
        };

        const clearFade = () => {
            fadeSequence += 1;
            if (fadeTimer != null) clearTimer(fadeTimer);
            fadeTimer = null;
        };

        const fadeMusic = (targetVolume, durationMs = fadeDurationMs) => {
            if (!music) return;
            clearFade();
            const sequence = fadeSequence;
            const target = Math.max(0, Math.min(1, Number(targetVolume) || 0));
            const from = Math.max(0, Math.min(1, Number(music.volume) || 0));
            const duration = Math.max(0, Number(durationMs) || 0);
            if (target > 0) playMedia(music, true);
            if (duration === 0 || Math.abs(target - from) < 0.001) {
                music.volume = target;
                if (target === 0 && typeof music.pause === "function") music.pause();
                return;
            }
            const startedAt = now();
            const step = () => {
                if (sequence !== fadeSequence) return;
                const progress = Math.max(0, Math.min(1, (now() - startedAt) / duration));
                music.volume = from + ((target - from) * progress);
                if (progress >= 1) {
                    fadeTimer = null;
                    if (target === 0 && typeof music.pause === "function") music.pause();
                    return;
                }
                fadeTimer = setTimer(step, 50);
            };
            step();
        };

        const playTransition = () => {
            if (!transitionSound) return;
            try {
                transitionSound.pause?.();
                transitionSound.currentTime = 0;
                transitionSound.volume = transitionVolume;
            } catch (_error) {}
            playMedia(transitionSound);
        };

        const targetMusicVolume = () => (
            musicModes.has(currentMode) && !ducked ? musicVolume : 0
        );

        const setMode = (value, config = {}) => {
            const mode = normalizeMode(value);
            if (mode === currentMode) return false;
            const previous = currentMode;
            currentMode = mode;
            if (previous && config.initial !== true) playTransition();
            fadeMusic(targetMusicVolume(), fadeDurationMs);
            return true;
        };

        const setDucked = (value) => {
            const next = Boolean(value);
            if (next === ducked) return false;
            ducked = next;
            fadeMusic(targetMusicVolume(), ducked ? 450 : fadeDurationMs);
            return true;
        };

        const retryPlayback = () => {
            if (!blocked || !music || targetMusicVolume() <= 0) return;
            blocked = false;
            fadeMusic(targetMusicVolume(), Math.min(650, fadeDurationMs));
        };

        const onTutorialVisibility = (event) => {
            setDucked(Boolean(event && event.detail && event.detail.visible));
        };
        const onPageHide = () => {
            clearFade();
            music?.pause?.();
            transitionSound?.pause?.();
        };
        ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
            documentRef?.addEventListener?.(eventName, retryPlayback, { passive: true });
        });
        documentRef?.addEventListener?.("scrib:video-tutorial-visibility", onTutorialVisibility);
        windowRef?.addEventListener?.("pagehide", onPageHide);

        return {
            setMode,
            setDucked,
            playTransition,
            getMode: () => currentMode,
            getMusic: () => music,
            getTransitionSound: () => transitionSound,
            destroy() {
                onPageHide();
                ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
                    documentRef?.removeEventListener?.(eventName, retryPlayback);
                });
                documentRef?.removeEventListener?.("scrib:video-tutorial-visibility", onTutorialVisibility);
                windowRef?.removeEventListener?.("pagehide", onPageHide);
            }
        };
    }

    function createController(options = {}) {
        const overlay = options.overlay || null;
        const setTimer = options.setTimer || setTimeout;
        const clearTimer = options.clearTimer || clearTimeout;
        const reducedMotion = typeof options.reducedMotion === "function"
            ? options.reducedMotion
            : () => false;
        let timers = [];
        let destination = "";
        let running = false;

        const clearTimers = () => {
            timers.forEach((timer) => clearTimer(timer));
            timers = [];
        };

        const resetOverlay = () => {
            if (!overlay) return;
            overlay.classList.remove("is-covering", "is-revealing");
            overlay.hidden = true;
            overlay.setAttribute("aria-hidden", "true");
            delete overlay.dataset.destination;
        };

        const cancel = () => {
            clearTimers();
            destination = "";
            running = false;
            resetOverlay();
        };

        const transition = ({ from, to, swap }) => {
            if (typeof swap !== "function") return false;
            if (running && destination === to) return true;

            clearTimers();
            running = false;
            destination = "";

            if (!overlay || from === to || reducedMotion()) {
                resetOverlay();
                swap();
                return false;
            }

            destination = to;
            running = true;
            overlay.dataset.destination = to;
            const label = overlay.querySelector("[data-view-transition-label]");
            if (label) label.textContent = viewLabel(to);
            overlay.hidden = false;
            overlay.setAttribute("aria-hidden", "true");
            overlay.classList.remove("is-covering", "is-revealing");
            void overlay.offsetWidth;
            overlay.classList.add("is-covering");

            timers.push(setTimer(() => {
                swap();
                overlay.classList.remove("is-covering");
                overlay.classList.add("is-revealing");
                timers.push(setTimer(() => {
                    destination = "";
                    running = false;
                    resetOverlay();
                }, REVEAL_MS));
            }, COVER_MS));
            return true;
        };

        return {
            transition,
            cancel,
            isRunningTo: (mode) => running && destination === mode
        };
    }

    return {
        COVER_MS,
        REVEAL_MS,
        AUDIO_FADE_MS,
        MUSIC_MODES,
        VIEW_LABELS,
        viewLabel,
        createAudioController,
        createController
    };
});
