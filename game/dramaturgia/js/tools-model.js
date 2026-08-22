(function initScribDramaturgiaToolsModel(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ScribDramaturgiaToolsModel = api;
    }
})(typeof window !== "undefined" ? window : globalThis, function createToolsModel() {
    "use strict";

    const MODES = Object.freeze([
        "letra bendita",
        "letra prohibida",
        "tertulia",
        "palabras bonus",
        "palabras prohibidas",
        "frase final"
    ]);

    const SCREENS = Object.freeze([
        {
            id: "control",
            group: "sistema",
            label: "Control",
            short: "CTRL",
            accent: "#ffd166",
            width: 1600,
            height: 1100,
            url: "../control/index.html?dramaturgia_monitor=1&screen_id=control"
        },
        {
            id: "spectator",
            group: "sistema",
            label: "Espectador",
            short: "ESCENA",
            accent: "#b48cff",
            width: 1600,
            height: 1000,
            url: "../spectator/index.html?dramaturgia_monitor=1&screen_id=spectator"
        },
        {
            id: "jury",
            group: "sistema",
            label: "Jurado",
            short: "JURADO",
            accent: "#e0ebf5",
            width: 1440,
            height: 1000,
            url: "../jurado/index.html?dramaturgia_monitor=1&screen_id=jury"
        },
        {
            id: "writer1",
            group: "azul",
            label: "Escritxr",
            short: "ESCRITXR",
            accent: "#51e7ff",
            width: 1400,
            height: 1000,
            url: "../players/index.html?player=1&dramaturgia_monitor=1&screen_id=writer1"
        },
        {
            id: "musa1",
            group: "azul",
            label: "Musa",
            short: "MUSA",
            accent: "#51e7ff",
            width: 430,
            height: 932,
            url: "../public/players/index.html?player=1&name=OBSERVA&dramaturgia_monitor=1&screen_id=musa1"
        },
        {
            id: "actor1",
            group: "azul",
            label: "Intérprete",
            short: "INTÉRPRETE",
            accent: "#51e7ff",
            width: 1400,
            height: 900,
            url: "../actors/source/index.html?player=1&dramaturgia_monitor=1&screen_id=actor1"
        },
        {
            id: "writer2",
            group: "rojo",
            label: "Escritxr",
            short: "ESCRITXR",
            accent: "#ff5964",
            width: 1400,
            height: 1000,
            url: "../players/index.html?player=2&dramaturgia_monitor=1&screen_id=writer2"
        },
        {
            id: "musa2",
            group: "rojo",
            label: "Musa",
            short: "MUSA",
            accent: "#ff5964",
            width: 430,
            height: 932,
            url: "../public/players/index.html?player=2&name=OBSERVA&dramaturgia_monitor=1&screen_id=musa2"
        },
        {
            id: "actor2",
            group: "rojo",
            label: "Intérprete",
            short: "INTÉRPRETE",
            accent: "#ff5964",
            width: 1400,
            height: 900,
            url: "../actors/source/index.html?player=2&dramaturgia_monitor=1&screen_id=actor2"
        }
    ]);

    const PRESETS = Object.freeze({
        visual: Object.freeze({
            seed: "sutura-visual",
            total_seconds: 150,
            mode_seconds: 14,
            speed: 1,
            writer_ppm: 52,
            muse_interval_seconds: 7,
            muses_per_team: 2,
            votes: true,
            hearts: true,
            auto_finish: true,
            full_show: true,
            modes: [...MODES]
        }),
        quick: Object.freeze({
            seed: "sutura-rapida",
            total_seconds: 90,
            mode_seconds: 10,
            speed: 1.5,
            writer_ppm: 78,
            muse_interval_seconds: 4,
            muses_per_team: 1,
            votes: true,
            hearts: false,
            auto_finish: true,
            full_show: true,
            modes: [...MODES]
        }),
        stress: Object.freeze({
            seed: "sutura-carga",
            total_seconds: 120,
            mode_seconds: 5,
            speed: 3,
            writer_ppm: 180,
            muse_interval_seconds: 2,
            muses_per_team: 4,
            votes: true,
            hearts: true,
            auto_finish: true,
            full_show: true,
            modes: [...MODES]
        })
    });

    function numberInRange(value, fallback, min, max) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(min, Math.min(max, parsed));
    }

    function normalizeModes(value, fallback = MODES) {
        const list = Array.isArray(value) ? value : fallback;
        const unique = [];
        list.forEach((mode) => {
            const normalized = String(mode || "").trim().toLowerCase();
            if (MODES.includes(normalized) && !unique.includes(normalized)) {
                unique.push(normalized);
            }
        });
        return unique.length ? unique : [...fallback];
    }

    function normalizeConfig(input = {}, presetName = "visual") {
        const base = PRESETS[presetName] || PRESETS.visual;
        const source = input && typeof input === "object" ? input : {};
        return {
            seed: String(source.seed ?? base.seed).trim().slice(0, 64) || base.seed,
            total_seconds: Math.round(numberInRange(source.total_seconds, base.total_seconds, 30, 3600)),
            mode_seconds: Math.round(numberInRange(source.mode_seconds, base.mode_seconds, 5, 300)),
            speed: numberInRange(source.speed, base.speed, 0.25, 8),
            writer_ppm: Math.round(numberInRange(source.writer_ppm, base.writer_ppm, 5, 600)),
            muse_interval_seconds: numberInRange(
                source.muse_interval_seconds,
                base.muse_interval_seconds,
                1,
                120
            ),
            muses_per_team: Math.round(numberInRange(
                source.muses_per_team,
                base.muses_per_team,
                0,
                4
            )),
            votes: source.votes === undefined ? base.votes : Boolean(source.votes),
            hearts: source.hearts === undefined ? base.hearts : Boolean(source.hearts),
            auto_finish: source.auto_finish === undefined ? base.auto_finish : Boolean(source.auto_finish),
            full_show: source.full_show === undefined ? base.full_show : Boolean(source.full_show),
            modes: normalizeModes(source.modes, base.modes)
        };
    }

    function hashSeed(seed) {
        const text = String(seed || "");
        let hash = 2166136261;
        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function createSeededRandom(seed) {
        let state = hashSeed(seed) || 0x6d2b79f5;
        return function random() {
            state += 0x6d2b79f5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }

    return {
        MODES,
        PRESETS,
        SCREENS,
        createSeededRandom,
        hashSeed,
        normalizeConfig,
        normalizeModes
    };
});
