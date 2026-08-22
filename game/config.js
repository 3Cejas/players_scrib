// config.js (versión sin ES Modules)
window.isProduction = false;
window.SERVER_URL_PROD = window.location.origin;
window.SERVER_URL_DEV = "http://localhost:3000";

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
