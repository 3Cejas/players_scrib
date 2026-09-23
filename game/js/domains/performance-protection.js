(function initScribPerformanceProtection(global) {
    "use strict";

    const DEFAULTS = Object.freeze({
        sampleMs: 500,
        evaluationMs: 1000,
        reportMs: 5000,
        reportTimeoutMs: 4000,
        warningSustainMs: 10000,
        dangerSustainMs: 15000,
        emergencySustainMs: 3000,
        minimumLevelMs: 60000,
        recoverySustainMs: 60000
    });

    const limitarNivel = (valor) => Math.max(0, Math.min(2, Math.trunc(Number(valor) || 0)));
    const numeroFinito = (valor, fallback = 0) => Number.isFinite(Number(valor)) ? Number(valor) : fallback;

    function percentil(valores, proporcion = 0.95) {
        if (!Array.isArray(valores) || !valores.length) return 0;
        const ordenados = valores.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        if (!ordenados.length) return 0;
        const indice = Math.max(0, Math.ceil(ordenados.length * proporcion) - 1);
        return ordenados[Math.min(indice, ordenados.length - 1)];
    }

    function analizarMetricas(metricas = {}) {
        const lag = Math.max(0, numeroFinito(metricas.lag_p95_ms));
        const fps = Math.max(0, numeroFinito(metricas.fps));
        const rtt = Math.max(0, numeroFinito(metricas.rtt_p95_ms));
        const heap = Math.max(0, Math.min(1, numeroFinito(metricas.heap_ratio)));
        const missed = Math.max(0, Math.trunc(numeroFinito(metricas.missed_heartbeats)));
        const visible = metricas.visible !== false;
        const warningReasons = [];
        const dangerReasons = [];

        if (lag > 80) warningReasons.push("main_thread_lag");
        if (lag > 150) dangerReasons.push("main_thread_lag");
        if (visible && fps > 0 && fps < 24) warningReasons.push("low_fps");
        if (visible && fps > 0 && fps < 18) dangerReasons.push("low_fps");
        if (rtt > 250) warningReasons.push("network_rtt");
        if (rtt > 500) dangerReasons.push("network_rtt");
        if (heap > 0.70) warningReasons.push("browser_memory");
        if (heap > 0.80) dangerReasons.push("browser_memory");
        if (missed >= 2) warningReasons.push("missed_heartbeats");
        if (missed >= 3) dangerReasons.push("missed_heartbeats");

        return {
            warning: warningReasons.length > 0,
            danger: dangerReasons.length > 0,
            emergency: lag > 500 || heap > 0.90 || missed >= 3,
            reasons: Array.from(new Set([...warningReasons, ...dangerReasons]))
        };
    }

    function crearMaquinaProteccion(opciones = {}) {
        const config = { ...DEFAULTS, ...opciones };
        let level = 0;
        let levelSince = 0;
        let warningSince = 0;
        let dangerSince = 0;
        let emergencySince = 0;
        let healthySince = 0;
        let reasons = [];
        const updateSince = (activo, actual, now) => activo ? (actual || now) : 0;
        const resetPressure = () => {
            warningSince = 0;
            dangerSince = 0;
            emergencySince = 0;
        };

        const evaluar = (metricas = {}, now = Date.now()) => {
            const presion = analizarMetricas(metricas);
            warningSince = updateSince(presion.warning || presion.danger || presion.emergency, warningSince, now);
            dangerSince = updateSince(presion.danger || presion.emergency, dangerSince, now);
            emergencySince = updateSince(presion.emergency, emergencySince, now);
            healthySince = updateSince(!presion.warning && !presion.danger && !presion.emergency, healthySince, now);
            reasons = presion.reasons;

            const warningSostenido = warningSince && (now - warningSince) >= config.warningSustainMs;
            const dangerSostenido = dangerSince && (now - dangerSince) >= config.dangerSustainMs;
            const emergencySostenida = emergencySince && (now - emergencySince) >= config.emergencySustainMs;
            const recuperacionSostenida = healthySince && (now - healthySince) >= config.recoverySustainMs;
            const permanenciaCumplida = !levelSince || (now - levelSince) >= config.minimumLevelMs;
            const previous = level;

            if (level === 0) {
                if (emergencySostenida || dangerSostenido) level = 2;
                else if (warningSostenido) level = 1;
            } else if (level === 1) {
                if (emergencySostenida || dangerSostenido) level = 2;
                else if (permanenciaCumplida && recuperacionSostenida) level = 0;
            } else if (permanenciaCumplida && recuperacionSostenida) {
                level = 1;
            }

            if (level !== previous) {
                levelSince = now;
                healthySince = 0;
                resetPressure();
            }
            return { level, previous, changed: level !== previous, reasons: reasons.slice(), levelSince };
        };

        return {
            evaluar,
            getLevel: () => level,
            snapshot: () => ({ level, levelSince, warningSince, dangerSince, emergencySince, healthySince, reasons: reasons.slice() })
        };
    }

    const runtime = {
        installed: false,
        role: "unknown",
        getPlayer: () => 0,
        socket: null,
        machine: crearMaquinaProteccion(),
        localLevel: 0,
        globalLevel: 0,
        effectiveLevel: 0,
        reasons: [],
        globalPayload: null,
        lagSamples: [],
        frameSamples: [],
        rttSamples: [],
        missedHeartbeats: 0,
        lastSampleTs: 0,
        wasVisible: true,
        timers: [],
        latestJobs: new Map(),
        lastRuns: new Map()
    };

    const isVisible = () => !global.document || global.document.visibilityState !== "hidden";

    function obtenerMetricas() {
        const now = Date.now();
        runtime.lagSamples = runtime.lagSamples.filter((item) => (now - item.ts) <= 20000);
        runtime.frameSamples = runtime.frameSamples.filter((ts) => (now - ts) <= 5000);
        runtime.rttSamples = runtime.rttSamples.filter((item) => (now - item.ts) <= 30000);
        const frames = runtime.frameSamples;
        const fps = frames.length >= 2 && (frames[frames.length - 1] - frames[0]) >= 1000
            ? ((frames.length - 1) * 1000) / (frames[frames.length - 1] - frames[0])
            : 0;
        const memoria = global.performance && global.performance.memory;
        const heapRatio = memoria && numeroFinito(memoria.jsHeapSizeLimit) > 0
            ? numeroFinito(memoria.usedJSHeapSize) / numeroFinito(memoria.jsHeapSizeLimit)
            : 0;
        return {
            lag_p95_ms: Math.round(percentil(runtime.lagSamples.map((item) => item.value)) * 10) / 10,
            fps: Math.round(fps * 10) / 10,
            rtt_p95_ms: Math.round(percentil(runtime.rttSamples.map((item) => item.value)) * 10) / 10,
            heap_ratio: Math.round(Math.max(0, Math.min(1, heapRatio)) * 1000) / 1000,
            missed_heartbeats: runtime.missedHeartbeats,
            visible: isVisible()
        };
    }

    function publicarEstado() {
        const next = Math.max(runtime.localLevel, runtime.globalLevel);
        const changed = next !== runtime.effectiveLevel;
        runtime.effectiveLevel = next;
        if (global.document && global.document.documentElement) {
            global.document.documentElement.dataset.performanceProtection = String(next);
        }
        if (!changed) return;
        if (next > 0) {
            if (typeof global.stopConfetti === "function") {
                try { global.stopConfetti(); } catch (_error) { /* no bloquea la protección */ }
            } else if (global.confetti && typeof global.confetti.reset === "function") {
                try { global.confetti.reset(); } catch (_error) { /* no bloquea la protección */ }
            }
        }
        if (typeof global.CustomEvent === "function" && typeof global.dispatchEvent === "function") {
            global.dispatchEvent(new global.CustomEvent("scrib:performance-protection", {
                detail: api.snapshot()
            }));
        }
    }

    function aplicarProteccionGlobal(payload = {}) {
        runtime.globalPayload = payload && typeof payload === "object" ? payload : null;
        runtime.globalLevel = limitarNivel(payload && payload.level);
        publicarEstado();
    }

    function evaluarLocal() {
        const resultado = runtime.machine.evaluar(obtenerMetricas(), Date.now());
        runtime.localLevel = resultado.level;
        runtime.reasons = resultado.reasons;
        publicarEstado();
    }

    function enviarReporte() {
        const socket = runtime.socket;
        if (!socket || !socket.connected || typeof socket.emit !== "function") return;
        const sentAt = Date.now();
        let settled = false;
        const timeout = global.setTimeout(() => {
            if (settled) return;
            settled = true;
            runtime.missedHeartbeats += 1;
        }, DEFAULTS.reportTimeoutMs);
        socket.emit("performance_protection_report", {
            role: runtime.role,
            player: numeroFinito(runtime.getPlayer()),
            level: runtime.localLevel,
            reasons: runtime.reasons,
            metrics: obtenerMetricas()
        }, (respuesta = {}) => {
            if (settled) return;
            settled = true;
            global.clearTimeout(timeout);
            runtime.missedHeartbeats = 0;
            runtime.rttSamples.push({ ts: Date.now(), value: Math.max(0, Date.now() - sentAt) });
            if (respuesta.protection) aplicarProteccionGlobal(respuesta.protection);
        });
    }

    function frameTick() {
        if (!runtime.installed) return;
        if (isVisible()) runtime.frameSamples.push(Date.now());
        if (typeof global.requestAnimationFrame === "function") global.requestAnimationFrame(frameTick);
    }

    function install({ socket, role = "unknown", getPlayer = () => 0, opciones = {} } = {}) {
        if (runtime.installed) return api;
        runtime.installed = true;
        runtime.socket = socket || null;
        runtime.role = String(role || "unknown");
        runtime.getPlayer = typeof getPlayer === "function" ? getPlayer : () => numeroFinito(getPlayer);
        runtime.machine = crearMaquinaProteccion(opciones);
        runtime.lastSampleTs = Date.now();
        runtime.wasVisible = isVisible();

        const sampleTimer = global.setInterval(() => {
            const now = Date.now();
            const visibleNow = isVisible();
            if (visibleNow && runtime.wasVisible) {
                runtime.lagSamples.push({ ts: now, value: Math.max(0, now - runtime.lastSampleTs - DEFAULTS.sampleMs) });
            } else {
                runtime.lagSamples.length = 0;
                runtime.frameSamples.length = 0;
            }
            runtime.wasVisible = visibleNow;
            runtime.lastSampleTs = now;
        }, DEFAULTS.sampleMs);
        const evaluationTimer = global.setInterval(evaluarLocal, DEFAULTS.evaluationMs);
        const reportTimer = global.setInterval(enviarReporte, DEFAULTS.reportMs);
        runtime.timers.push(sampleTimer, evaluationTimer, reportTimer);
        if (typeof global.requestAnimationFrame === "function") global.requestAnimationFrame(frameTick);

        if (socket && typeof socket.on === "function") {
            socket.on("performance_protection_global", aplicarProteccionGlobal);
            socket.on("connect", () => global.setTimeout(enviarReporte, 250));
            socket.on("disconnect", () => {
                runtime.missedHeartbeats = Math.max(runtime.missedHeartbeats, 2);
            });
        }
        if (socket && socket.connected) global.setTimeout(enviarReporte, 0);
        publicarEstado();
        return api;
    }

    function runLatest(key, callback, delays = {}) {
        if (typeof callback !== "function") return false;
        const level = runtime.effectiveLevel;
        const delay = Math.max(0, Number(delays[level] ?? (level >= 2 ? 3000 : (level === 1 ? 1000 : 0))) || 0);
        if (!delay) {
            callback();
            return true;
        }
        const id = String(key || "default");
        const existing = runtime.latestJobs.get(id);
        if (existing) {
            existing.callback = callback;
            return false;
        }
        const job = { callback, timer: 0 };
        job.timer = global.setTimeout(() => {
            runtime.latestJobs.delete(id);
            job.callback();
        }, delay);
        runtime.latestJobs.set(id, job);
        return true;
    }

    function shouldRun(key, intervals = {}) {
        const level = runtime.effectiveLevel;
        const minInterval = Math.max(0, Number(intervals[level] ?? (level >= 2 ? 500 : (level === 1 ? 250 : 0))) || 0);
        const now = Date.now();
        const id = String(key || "default");
        const previous = runtime.lastRuns.get(id) || 0;
        if (minInterval && (now - previous) < minInterval) return false;
        runtime.lastRuns.set(id, now);
        return true;
    }

    const api = {
        DEFAULTS,
        analizarMetricas,
        crearMaquinaProteccion,
        getLevel: () => runtime.effectiveLevel,
        getLocalLevel: () => runtime.localLevel,
        getRenderDelay: () => runtime.effectiveLevel >= 2 ? 150 : (runtime.effectiveLevel === 1 ? 50 : 0),
        install,
        isAtLeast: (level) => runtime.effectiveLevel >= limitarNivel(level),
        percentil,
        runLatest,
        shouldRun,
        snapshot: () => ({
            level: runtime.effectiveLevel,
            localLevel: runtime.localLevel,
            globalLevel: runtime.globalLevel,
            reasons: runtime.reasons.slice(),
            metrics: obtenerMetricas(),
            role: runtime.role,
            player: numeroFinito(runtime.getPlayer())
        })
    };

    global.ScribPerformanceProtection = api;
})(typeof window !== "undefined" ? window : globalThis);
