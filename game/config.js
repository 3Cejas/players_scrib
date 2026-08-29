// config.js (versión sin ES Modules)
const scribHostname = String(window.location && window.location.hostname || "").toLowerCase();
window.isProduction = !new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(scribHostname)
    && !scribHostname.endsWith(".localhost");
window.SERVER_URL_PROD = "https://sutura-gateway.ddns.net";
window.SERVER_URL_DEV = "http://localhost:3000";

if (typeof document !== "undefined") {
    try {
        const configScriptBase = document.currentScript && document.currentScript.src
            ? document.currentScript.src
            : `${window.location.origin}/scrib/game/config.js`;
        const activityScriptUrl = new URL("./js/activity-heartbeat.js?v=20260827b", configScriptBase).href;
        const activityScriptLoaded = Array.from(document.scripts || []).some(function (script) {
            return script.src === activityScriptUrl;
        });

        if (!activityScriptLoaded) {
            const activityScript = document.createElement("script");
            activityScript.src = activityScriptUrl;
            activityScript.async = true;
            activityScript.dataset.scribActivityHeartbeat = "true";
            (document.head || document.documentElement).appendChild(activityScript);
        }
    } catch (error) {
        // La carga local (file://) y los navegadores antiguos continúan sin heartbeat.
    }
}

if (
    typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("dramaturgia_monitor") === "1"
    && typeof document !== "undefined"
) {
    const monitorScriptBase = document.currentScript && document.currentScript.src
        ? document.currentScript.src
        : `${window.location.origin}/scrib/game/config.js`;
    const monitorScriptUrl = new URL("./js/monitor-socket.js?v=20260730c", monitorScriptBase).href;
    document.write(`<script src="${monitorScriptUrl}"><\/script>`);
}
