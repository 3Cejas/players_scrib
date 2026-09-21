(function initScribScreenAwake(globalRef, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    if (globalRef && globalRef.document) {
        globalRef.ScribScreenAwake = api;
        api.install(globalRef);
    }
})(typeof window !== "undefined" ? window : null, function buildScribScreenAwake() {
    "use strict";

    function createController(globalObject, options) {
        const opts = options || {};
        const documentRef = opts.document || globalObject.document;
        const navigatorRef = opts.navigator || globalObject.navigator || {};
        const wakeLock = navigatorRef.wakeLock;
        const supported = Boolean(wakeLock && typeof wakeLock.request === "function");
        let sentinel = null;
        let started = false;
        let requesting = false;
        let generation = 0;

        function isVisible() {
            return !documentRef || documentRef.visibilityState !== "hidden";
        }

        function handleRelease(event) {
            if (!sentinel || !event || !event.target || event.target === sentinel) {
                sentinel = null;
            }
        }

        async function release() {
            const current = sentinel;
            sentinel = null;
            if (!current) return false;
            current.removeEventListener?.("release", handleRelease);
            try {
                await current.release?.();
                return true;
            } catch (_error) {
                return false;
            }
        }

        async function acquire() {
            if (!started || !supported || !isVisible()) return false;
            if (sentinel && sentinel.released !== true) return true;
            if (requesting) return false;

            requesting = true;
            const requestGeneration = generation;
            try {
                const nextSentinel = await wakeLock.request("screen");
                if (!nextSentinel) return false;
                if (!started || requestGeneration !== generation || !isVisible()) {
                    try { await nextSentinel.release?.(); } catch (_error) {}
                    return false;
                }
                sentinel = nextSentinel;
                sentinel.addEventListener?.("release", handleRelease, { once: true });
                return true;
            } catch (_error) {
                return false;
            } finally {
                requesting = false;
            }
        }

        function handleVisibilityChange() {
            if (isVisible()) {
                acquire();
            } else {
                release();
            }
        }

        function handleForeground() {
            if (isVisible()) acquire();
        }

        function start() {
            if (started || !documentRef) return false;
            started = true;
            generation += 1;
            documentRef.addEventListener?.("visibilitychange", handleVisibilityChange);
            documentRef.addEventListener?.("pointerdown", handleForeground);
            documentRef.addEventListener?.("touchstart", handleForeground);
            documentRef.addEventListener?.("keydown", handleForeground);
            globalObject.addEventListener?.("focus", handleForeground);
            globalObject.addEventListener?.("pageshow", handleForeground);
            globalObject.addEventListener?.("pagehide", release);
            acquire();
            return supported;
        }

        function stop() {
            if (!started) return;
            started = false;
            generation += 1;
            documentRef.removeEventListener?.("visibilitychange", handleVisibilityChange);
            documentRef.removeEventListener?.("pointerdown", handleForeground);
            documentRef.removeEventListener?.("touchstart", handleForeground);
            documentRef.removeEventListener?.("keydown", handleForeground);
            globalObject.removeEventListener?.("focus", handleForeground);
            globalObject.removeEventListener?.("pageshow", handleForeground);
            globalObject.removeEventListener?.("pagehide", release);
            release();
        }

        return {
            start,
            stop,
            acquire,
            release,
            isSupported: function () { return supported; },
            isRunning: function () { return started; },
            isHeld: function () { return Boolean(sentinel && sentinel.released !== true); },
            getSentinel: function () { return sentinel; }
        };
    }

    function install(globalObject, options) {
        if (!globalObject || !globalObject.document || globalObject.__scribScreenAwakeController) {
            return null;
        }
        const controller = createController(globalObject, options);
        globalObject.__scribScreenAwakeController = controller;
        controller.start();
        return controller;
    }

    return { createController, install };
});
