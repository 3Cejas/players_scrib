(function (globalRef, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    if (globalRef && globalRef.document) {
        globalRef.ScribActivityHeartbeat = api;
        api.install(globalRef);
    }
})(typeof window !== "undefined" ? window : null, function () {
    "use strict";

    const ACTIVITY_INTERVAL_MS = 45000;
    const DIRECT_HOST = "sutura.ddns.net";
    const GATEWAY_HOST = "sutura-gateway.ddns.net";

    function normalizePath(pathname) {
        const value = typeof pathname === "string" && pathname ? pathname : "/";
        return value.startsWith("/") ? value : `/${value}`;
    }

    function canonicalActivityPath(locationRef) {
        if (!locationRef) return "";

        const hostname = String(locationRef.hostname || "").toLowerCase();
        const pathname = normalizePath(locationRef.pathname);
        const search = typeof locationRef.search === "string" ? locationRef.search : "";

        if (hostname === GATEWAY_HOST) {
            return `${pathname}${search}`;
        }

        if (hostname === DIRECT_HOST) {
            const gatewayPath = pathname === "/sutura" || pathname.startsWith("/sutura/")
                ? pathname
                : `/sutura${pathname}`;
            return `${gatewayPath}${search}`;
        }

        return "";
    }

    function resolveActivityTarget(locationRef) {
        if (!locationRef || !["http:", "https:"].includes(String(locationRef.protocol || "").toLowerCase())) {
            return null;
        }

        const hostname = String(locationRef.hostname || "").toLowerCase();
        const activityPath = canonicalActivityPath(locationRef);
        if (!activityPath) return null;

        const query = `visible=1&path=${encodeURIComponent(activityPath)}`;
        if (hostname === GATEWAY_HOST) {
            return {
                url: `/_activity?${query}`,
                path: activityPath,
                crossOrigin: false
            };
        }

        if (hostname === DIRECT_HOST) {
            return {
                url: `https://${GATEWAY_HOST}/_activity?${query}`,
                path: activityPath,
                crossOrigin: true
            };
        }

        return null;
    }

    function createController(globalObject, options) {
        const opts = options || {};
        const documentRef = opts.document || globalObject.document;
        const navigatorRef = opts.navigator || globalObject.navigator || {};
        const target = opts.target || resolveActivityTarget(opts.location || globalObject.location);
        const intervalMs = Number.isFinite(opts.intervalMs) && opts.intervalMs > 0
            ? opts.intervalMs
            : ACTIVITY_INTERVAL_MS;
        const setIntervalRef = opts.setInterval || globalObject.setInterval.bind(globalObject);
        const clearIntervalRef = opts.clearInterval || globalObject.clearInterval.bind(globalObject);
        const fetchRef = opts.fetch || (typeof globalObject.fetch === "function"
            ? globalObject.fetch.bind(globalObject)
            : null);
        let intervalId = null;
        let started = false;

        function isVisible() {
            return documentRef && documentRef.visibilityState === "visible";
        }

        function send() {
            if (!started || !target || !isVisible()) return false;

            try {
                if (
                    typeof navigatorRef.sendBeacon === "function"
                    && navigatorRef.sendBeacon(target.url)
                ) {
                    return true;
                }
            } catch (error) {
                // El fallback fetch conserva el latido si Beacon no está disponible.
            }

            if (typeof fetchRef !== "function") return false;

            try {
                const request = fetchRef(target.url, {
                    method: "POST",
                    cache: "no-store",
                    keepalive: true,
                    credentials: target.crossOrigin ? "include" : "same-origin",
                    ...(target.crossOrigin ? { mode: "no-cors" } : {})
                });
                if (request && typeof request.catch === "function") {
                    request.catch(function () {});
                }
                return true;
            } catch (error) {
                return false;
            }
        }

        function stopTimer() {
            if (intervalId === null) return;
            clearIntervalRef(intervalId);
            intervalId = null;
        }

        function startTimer() {
            if (!started || !target || !isVisible() || intervalId !== null) return;
            send();
            intervalId = setIntervalRef(send, intervalMs);
        }

        function handleVisibilityChange() {
            if (isVisible()) {
                startTimer();
            } else {
                stopTimer();
            }
        }

        function start() {
            if (started || !target || !documentRef) return false;
            started = true;
            documentRef.addEventListener("visibilitychange", handleVisibilityChange);
            startTimer();
            return true;
        }

        function stop() {
            if (!started) return;
            started = false;
            stopTimer();
            documentRef.removeEventListener("visibilitychange", handleVisibilityChange);
        }

        return {
            start,
            stop,
            send,
            target,
            isRunning: function () {
                return started;
            }
        };
    }

    function install(globalObject, options) {
        if (!globalObject || !globalObject.document || globalObject.__suturaActivityPing) {
            return null;
        }

        const target = resolveActivityTarget(globalObject.location);
        if (!target) return null;

        globalObject.__suturaActivityPing = true;
        const controller = createController(globalObject, {
            ...(options || {}),
            target
        });
        controller.start();
        return controller;
    }

    return {
        ACTIVITY_INTERVAL_MS,
        DIRECT_HOST,
        GATEWAY_HOST,
        canonicalActivityPath,
        resolveActivityTarget,
        createController,
        install
    };
});
