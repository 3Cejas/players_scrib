(function initScribLevelTransition(global) {
    "use strict";

    const MODE_META = Object.freeze({
        "letra bendita": Object.freeze({
            suffix: "letra_bendita",
            theme: "blessed-letter",
            icon: "\u{1F64F}",
            detailKey: "level.transition.rule.blessed",
            detailFallback: "Cada palabra debe incluir la letra {letter}."
        }),
        "letra prohibida": Object.freeze({
            suffix: "letra_prohibida",
            theme: "forbidden-letter",
            icon: "\u{1F608}",
            detailKey: "level.transition.rule.forbidden",
            detailFallback: "Ninguna palabra puede usar la letra {letter}."
        }),
        "palabras bonus": Object.freeze({
            suffix: "palabras_bonus",
            theme: "bonus-words",
            icon: "\u{1F4D6}",
            detailKey: "mode.desc.bonus",
            detailFallback: "Suma tiempo con palabras bonus."
        }),
        "palabras prohibidas": Object.freeze({
            suffix: "palabras_prohibidas",
            theme: "forbidden-words",
            icon: "\u2694\uFE0F",
            detailKey: "mode.desc.prohibidas",
            detailFallback: "Evita las palabras prohibidas."
        }),
        tertulia: Object.freeze({
            suffix: "tertulia",
            theme: "muse-chat",
            icon: "\u{1F4AC}",
            detailKey: "mode.desc.tertulia",
            detailFallback: "Dialoga con tus musas."
        }),
        "frase final": Object.freeze({
            suffix: "frase_final",
            theme: "final-line",
            icon: "\u{1F3C1}",
            detailKey: "mode.desc.frase_final",
            detailFallback: "Ultima ronda."
        })
    });

    const MODE_ALIASES = Object.freeze({
        "letra bendecida": "letra bendita",
        "blessed letter": "letra bendita",
        "forbidden letter": "letra prohibida",
        "bonus words": "palabras bonus",
        "forbidden words": "palabras prohibidas",
        "muse chat": "tertulia",
        "final sentence": "frase final",
        "final line": "frase final"
    });

    function cleanText(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function normalizeMode(value) {
        const mode = cleanText(value)
            .toLocaleLowerCase("es-ES")
            .replace(/[\s_-]+/g, " ");
        if (Object.prototype.hasOwnProperty.call(MODE_META, mode)) return mode;
        return MODE_ALIASES[mode] || "";
    }

    function normalizeSequence(value) {
        if (value === null || value === undefined || value === "") return null;
        const sequence = Number(value);
        return Number.isFinite(sequence) && sequence >= 0 ? Math.trunc(sequence) : null;
    }

    function normalizeLetter(value) {
        const text = cleanText(value).replace(/\s+/g, "");
        if (!text) return "?";
        const letter = Array.from(text).find((character) => (
            /[A-Za-z\u00c0-\u024f\u1e00-\u1eff]/u.test(character)
        ));
        return (letter || Array.from(text)[0] || "?").toLocaleUpperCase("es-ES");
    }

    function interpolate(text, variables = {}) {
        return String(text || "").replace(/\{(\w+)\}/g, (_match, key) => (
            Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : ""
        ));
    }

    function fallbackTranslate(_key, variables = {}, fallback = "") {
        return interpolate(fallback, variables);
    }

    function resolveTranslator(translate) {
        if (typeof translate === "function") return translate;
        if (global && typeof global.scribT2P === "function") {
            return global.scribT2P.bind(global);
        }
        return fallbackTranslate;
    }

    function extractMode(payload) {
        if (typeof payload === "string") return normalizeMode(payload);
        if (!payload || typeof payload !== "object") return "";
        return normalizeMode(payload.modo_actual ?? payload.mode ?? payload.modo);
    }

    function extractLetter(mode, payload = {}) {
        if (!payload || typeof payload !== "object") return "?";
        if (mode === "letra bendita") {
            return normalizeLetter(payload.letra_bendita ?? payload.letra ?? payload.letter);
        }
        if (mode === "letra prohibida") {
            return normalizeLetter(payload.letra_prohibida ?? payload.letra ?? payload.letter);
        }
        return "";
    }

    function buildPresentation(modeValue, payload = {}, options = {}) {
        const mode = normalizeMode(modeValue) || extractMode(payload);
        const meta = MODE_META[mode];
        if (!meta) return null;
        const translate = resolveTranslator(options.translate);
        const eyebrow = translate("level.transition.eyebrow", {}, "NUEVO NIVEL");
        const title = translate(
            `mode.title.${meta.suffix}`,
            {},
            `NIVEL ${mode.toLocaleUpperCase("es-ES")}`
        );
        const variables = mode.startsWith("letra ") ? { letter: extractLetter(mode, payload) } : {};
        const detail = translate(meta.detailKey, variables, meta.detailFallback);
        const announcement = translate(
            "level.transition.announcement",
            { eyebrow, title, detail },
            "{eyebrow}: {title}. {detail}"
        );

        return Object.freeze({
            mode,
            theme: meta.theme,
            icon: meta.icon,
            eyebrow: cleanText(eyebrow),
            title: cleanText(title),
            detail: cleanText(detail),
            announcement: cleanText(announcement)
        });
    }

    function createModeTracker(options = {}) {
        const onTransition = typeof options.onTransition === "function"
            ? options.onTransition
            : function () {};
        let hasBaseline = false;
        let lastMode = "";
        let lastSequence = null;
        let lastFingerprint = "";

        function observe(payload = {}) {
            const rawMode = typeof payload === "string"
                ? payload
                : (payload && typeof payload === "object"
                    ? (payload.modo_actual ?? payload.mode ?? payload.modo ?? "")
                    : "");
            const mode = normalizeMode(rawMode);
            if (cleanText(rawMode) && !mode) {
                return Object.freeze({ accepted: false, baseline: false, transition: false, reason: "invalid" });
            }
            const sequence = normalizeSequence(payload && typeof payload === "object"
                ? (payload.modo_seq ?? payload.mode_seq)
                : null);
            const fingerprint = `${mode}\u0000${sequence === null ? "no-seq" : sequence}`;

            if (!hasBaseline) {
                hasBaseline = true;
                lastMode = mode;
                lastSequence = sequence;
                lastFingerprint = fingerprint;
                return Object.freeze({ accepted: true, baseline: true, transition: false, mode, sequence });
            }

            if (sequence !== null && lastSequence !== null && sequence < lastSequence) {
                return Object.freeze({ accepted: false, baseline: false, transition: false, reason: "stale", mode, sequence });
            }
            if (fingerprint === lastFingerprint) {
                return Object.freeze({ accepted: false, baseline: false, transition: false, reason: "duplicate", mode, sequence });
            }

            // mode_seq only orders and deduplicates canonical snapshots. Some
            // intra-level updates also advance it, so only a mode change is a
            // level transition worth announcing.
            const transition = Boolean(mode) && mode !== lastMode;
            lastMode = mode;
            lastSequence = sequence;
            lastFingerprint = fingerprint;
            const result = Object.freeze({ accepted: true, baseline: false, transition, mode, sequence });
            if (transition) onTransition(result, payload);
            return result;
        }

        return Object.freeze({
            observe,
            reset: function () {
                hasBaseline = false;
                lastMode = "";
                lastSequence = null;
                lastFingerprint = "";
            },
            getState: function () {
                return Object.freeze({ hasBaseline, lastMode, lastSequence, lastFingerprint });
            }
        });
    }

    function createController(options = {}) {
        const documentRef = options.documentRef || (global && global.document);
        const windowRef = options.windowRef || global;
        const root = options.root || (documentRef && documentRef.getElementById("level_transition"));
        const liveRegion = options.liveRegion
            || (documentRef && documentRef.getElementById("level_transition_status"));
        const setTimer = options.setTimer || (global && global.setTimeout ? global.setTimeout.bind(global) : setTimeout);
        const clearTimer = options.clearTimer || (global && global.clearTimeout ? global.clearTimeout.bind(global) : clearTimeout);
        const durationMs = Math.max(1000, Number(options.durationMs) || 2800);
        const reducedDurationMs = Math.max(800, Number(options.reducedDurationMs) || 1700);
        let hideTimer = null;
        let announceTimer = null;
        let currentMode = "";
        let currentPayload = null;
        let visible = false;

        function query(selector) {
            return root && typeof root.querySelector === "function" ? root.querySelector(selector) : null;
        }

        function prefersReducedMotion() {
            try {
                return Boolean(windowRef && typeof windowRef.matchMedia === "function"
                    && windowRef.matchMedia("(prefers-reduced-motion: reduce)").matches);
            } catch (_error) {
                return false;
            }
        }

        function clearTimers() {
            if (hideTimer !== null) clearTimer(hideTimer);
            if (announceTimer !== null) clearTimer(announceTimer);
            hideTimer = null;
            announceTimer = null;
        }

        function render(presentation) {
            if (!root || !presentation) return false;
            root.dataset.levelTheme = presentation.theme;
            const eyebrow = query("[data-level-eyebrow]");
            const icon = query("[data-level-icon]");
            const title = query("[data-level-title]");
            const detail = query("[data-level-detail]");
            if (eyebrow) eyebrow.textContent = presentation.eyebrow;
            if (icon) icon.textContent = presentation.icon;
            if (title) title.textContent = presentation.title;
            if (detail) detail.textContent = presentation.detail;
            if (liveRegion) {
                liveRegion.textContent = "";
                announceTimer = setTimer(function () {
                    announceTimer = null;
                    liveRegion.textContent = presentation.announcement;
                }, 20);
            }
            return true;
        }

        function hide() {
            clearTimers();
            visible = false;
            if (root) {
                root.classList.remove("is-visible");
                root.setAttribute("aria-hidden", "true");
            }
            if (documentRef && documentRef.body) {
                documentRef.body.classList.remove("level-transition-active");
            }
        }

        function show(mode, payload = {}) {
            const presentation = buildPresentation(mode, payload, options);
            if (!root || !presentation) return false;
            clearTimers();
            currentMode = presentation.mode;
            currentPayload = payload && typeof payload === "object" ? { ...payload } : {};
            render(presentation);
            root.classList.remove("is-visible");
            // Reading layout restarts the entrance sequence when levels change quickly.
            void root.offsetWidth;
            root.setAttribute("aria-hidden", "false");
            root.classList.add("is-visible");
            if (documentRef && documentRef.body) {
                documentRef.body.classList.add("level-transition-active");
            }
            visible = true;
            hideTimer = setTimer(hide, prefersReducedMotion() ? reducedDurationMs : durationMs);
            return true;
        }

        function refresh() {
            if (!visible || !currentMode) return false;
            const presentation = buildPresentation(currentMode, currentPayload || {}, options);
            return render(presentation);
        }

        let unsubscribeLanguage = function () {};
        if (windowRef && typeof windowRef.scribOnLanguageChange2P === "function") {
            unsubscribeLanguage = windowRef.scribOnLanguageChange2P(refresh);
        }

        return Object.freeze({
            show,
            hide,
            refresh,
            isVisible: function () { return visible; },
            isReady: function () { return Boolean(root); },
            destroy: function () {
                hide();
                if (typeof unsubscribeLanguage === "function") unsubscribeLanguage();
            }
        });
    }

    const api = Object.freeze({
        MODE_META,
        normalizeMode,
        normalizeSequence,
        normalizeLetter,
        extractMode,
        buildPresentation,
        createModeTracker,
        createController
    });

    global.ScribLevelTransition = api;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
