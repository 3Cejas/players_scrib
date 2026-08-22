(function initScribDramaturgiaReferenceShow(global) {
    "use strict";

    const MANIFEST_URL = "./reference-show/manifest.json?v=20260731f";
    const MAX_CONCURRENT_PREVIEWS = 8;
    const PREVIEW_LOAD_TIMEOUT_MS = 15000;
    const previewSpecs = new WeakMap();
    const queuedPreviews = new WeakSet();
    const previewQueue = [];
    const activePreviewJobs = new Set();
    let manifest = null;
    let toolsModel = null;
    let previewObserver = null;
    let resizeObserver = null;
    let previewPumpScheduled = false;

    function screenById(screenId) {
        return toolsModel && toolsModel.SCREENS.find((screen) => screen.id === screenId) || null;
    }

    function milestoneById(milestoneId) {
        return manifest && manifest.milestones && manifest.milestones[milestoneId] || null;
    }

    function getView(milestoneId, screenId) {
        const milestone = milestoneById(milestoneId);
        const screen = screenById(screenId);
        const path = milestone && milestone.roles ? milestone.roles[screenId] : "";
        if (!milestone || !screen || !path) return null;
        return {
            milestoneId,
            checkpointId: milestone.checkpointId || "",
            screen,
            url: new URL(path, global.document.baseURI).href
        };
    }

    function fitPreview(host) {
        const spec = previewSpecs.get(host);
        const stage = host && host.querySelector(".history-view__stage");
        if (!host || !spec || !stage) return;
        const screen = spec.view.screen;
        const scale = Math.max(0.01, Math.min(
            host.clientWidth / screen.width,
            host.clientHeight / screen.height
        ) * 0.99);
        stage.style.setProperty("--history-scale", String(scale));
    }

    function schedulePreviewPump() {
        if (previewPumpScheduled) return;
        previewPumpScheduled = true;
        global.setTimeout(() => {
            previewPumpScheduled = false;
            pumpPreviewQueue();
        }, 0);
    }

    function settlePreviewJob(job) {
        if (!job || job.settled) return false;
        job.settled = true;
        activePreviewJobs.delete(job);
        if (job.timeoutId) {
            global.clearTimeout(job.timeoutId);
            job.timeoutId = 0;
        }
        if (job.spec.job === job) job.spec.job = null;
        job.spec.loading = false;
        schedulePreviewPump();
        return true;
    }

    function releaseDisconnectedPreviewJobs() {
        [...activePreviewJobs].forEach((job) => {
            if (!job.host.isConnected || previewSpecs.get(job.host) !== job.spec) {
                settlePreviewJob(job);
            }
        });
    }

    function pumpPreviewQueue() {
        releaseDisconnectedPreviewJobs();
        while (activePreviewJobs.size < MAX_CONCURRENT_PREVIEWS && previewQueue.length) {
            const host = previewQueue.shift();
            queuedPreviews.delete(host);
            if (!host || !host.isConnected || host.dataset.historyState === "ready") continue;
            loadPreview(host);
        }
    }

    function queuePreview(host, priority = false) {
        const spec = previewSpecs.get(host);
        if (
            !host
            || !spec
            || spec.loading
            || host.dataset.historyState === "ready"
            || queuedPreviews.has(host)
        ) return;
        queuedPreviews.add(host);
        if (priority) previewQueue.unshift(host);
        else previewQueue.push(host);
        schedulePreviewPump();
    }

    function markPreviewError(host) {
        host.dataset.historyState = "error";
        const placeholder = host.querySelector(".history-view__placeholder");
        if (placeholder) placeholder.textContent = "No se pudo cargar la vista";
    }

    function loadPreview(host) {
        const spec = previewSpecs.get(host);
        if (!spec || spec.loading || host.dataset.historyState === "ready") {
            return;
        }
        spec.loading = true;
        const { screen, url } = spec.view;
        const stage = global.document.createElement("div");
        stage.className = "history-view__stage";
        stage.style.setProperty("--screen-width", `${screen.width}px`);
        stage.style.setProperty("--screen-height", `${screen.height}px`);
        const frame = global.document.createElement("iframe");
        frame.className = "history-view__frame";
        frame.title = `${screen.label} · recorrido de referencia`;
        frame.tabIndex = -1;
        frame.loading = "eager";
        frame.setAttribute("sandbox", "allow-same-origin");
        frame.setAttribute("allow", "autoplay 'none'; camera 'none'; microphone 'none'; display-capture 'none'");
        frame.setAttribute("referrerpolicy", "same-origin");
        const job = {
            host,
            spec,
            frame,
            settled: false,
            timeoutId: 0
        };
        job.settle = () => settlePreviewJob(job);
        spec.job = job;
        activePreviewJobs.add(job);
        frame.addEventListener("load", () => {
            const current = previewSpecs.get(host);
            if (host.isConnected && current === spec) {
                host.dataset.historyState = "ready";
                host.classList.add("has-frame", "is-loaded", "is-reference");
                fitPreview(host);
            }
            job.settle();
        }, { once: true });
        frame.addEventListener("error", () => {
            if (host.isConnected && previewSpecs.get(host) === spec) {
                markPreviewError(host);
            }
            job.settle();
        }, { once: true });
        job.timeoutId = global.setTimeout(() => {
            if (
                host.isConnected
                && previewSpecs.get(host) === spec
                && host.dataset.historyState !== "ready"
            ) {
                markPreviewError(host);
            }
            job.settle();
        }, PREVIEW_LOAD_TIMEOUT_MS);
        frame.src = url;
        stage.appendChild(frame);
        host.querySelector(".history-view__stage")?.remove();
        host.insertBefore(stage, host.firstChild);
        host.dataset.historyState = "loading";
        fitPreview(host);
    }

    function ensureObservers() {
        if (!resizeObserver && typeof global.ResizeObserver === "function") {
            resizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => fitPreview(entry.target));
            });
        }
        if (!previewObserver && typeof global.IntersectionObserver === "function") {
            previewObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) queuePreview(entry.target, true);
                });
            }, { root: null, rootMargin: "320px", threshold: 0.01 });
        }
    }

    function mountPreview(host, milestoneId, screenId) {
        const view = getView(milestoneId, screenId);
        if (!host || !view) return false;
        ensureObservers();
        previewSpecs.set(host, { view, loading: false, job: null });
        host.dataset.historyState = "queued";
        host.dataset.referenceMilestone = milestoneId;
        if (resizeObserver) resizeObserver.observe(host);
        if (previewObserver) previewObserver.observe(host);
        queuePreview(host);
        return true;
    }

    function openView(milestoneId, screenId, focus, label = "") {
        const view = getView(milestoneId, screenId);
        const pool = global.ScribDramaturgiaScreenPool;
        if (!view || !pool || typeof pool.openReferenceScreen !== "function") return false;
        return pool.openReferenceScreen({
            screenId,
            url: view.url,
            focus,
            label
        });
    }

    function notifyReady() {
        global.dispatchEvent(new CustomEvent("scrib:dramaturgia-reference-ready", {
            detail: {
                id: manifest.id || "",
                milestones: Object.keys(manifest.milestones || {}).length
            }
        }));
    }

    function install(candidate) {
        if (global.ScribDramaturgiaReferenceShow) return true;
        toolsModel = global.ScribDramaturgiaToolsModel || null;
        if (!candidate || !toolsModel || !Array.isArray(toolsModel.SCREENS)) return false;
        manifest = candidate;
        global.ScribDramaturgiaReferenceShow = Object.freeze({
            manifest,
            getView,
            hasMilestone: (milestoneId) => Boolean(milestoneById(milestoneId)),
            mountPreview,
            openView
        });
        notifyReady();
        return true;
    }

    async function loadManifestFallback() {
        if (install(global.ScribDramaturgiaReferenceShowManifest)) return;
        try {
            const response = await global.fetch(new URL(MANIFEST_URL, global.document.baseURI), {
                credentials: "same-origin",
                cache: "no-store",
                headers: { Accept: "application/json" }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const candidate = await response.json();
            global.ScribDramaturgiaReferenceShowManifest = Object.freeze(candidate);
            if (!install(candidate)) throw new Error("No se pudo inicializar el archivo de vistas");
        } catch (error) {
            global.document.documentElement.dataset.referenceShowState = "error";
            global.console.error("No se pudo cargar el recorrido de referencia de SCRI-B", error);
        }
    }

    if (!install(global.ScribDramaturgiaReferenceShowManifest)) {
        if (global.document.readyState === "loading") {
            global.document.addEventListener("DOMContentLoaded", loadManifestFallback, { once: true });
        } else {
            loadManifestFallback();
        }
    }
})(window);
