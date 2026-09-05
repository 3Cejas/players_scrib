const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const levelTransition = require("../game/js/domains/level-transition.js");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function interpolate(text, variables = {}) {
    return String(text || "").replace(/\{(\w+)\}/g, (_match, key) => variables[key] ?? "");
}

test("level transition presents every canonical mode with text, icon and theme", () => {
    const modes = [
        "letra bendita",
        "letra prohibida",
        "palabras bonus",
        "palabras prohibidas",
        "tertulia",
        "frase final"
    ];
    modes.forEach((mode) => {
        const presentation = levelTransition.buildPresentation(mode, {
            letra_bendita: "ñ",
            letra_prohibida: "z"
        });
        assert.equal(presentation.mode, mode);
        assert.ok(presentation.theme);
        assert.ok(presentation.icon);
        assert.match(presentation.title, /^NIVEL /);
        assert.ok(presentation.detail);
        assert.match(presentation.announcement, /NUEVO NIVEL/);
    });

    const dictionary = {
        "level.transition.eyebrow": "NEW LEVEL",
        "mode.title.letra_prohibida": "FORBIDDEN LETTER LEVEL",
        "level.transition.rule.forbidden": "No word may use {letter}.",
        "level.transition.announcement": "{eyebrow}: {title}. {detail}"
    };
    const translated = levelTransition.buildPresentation("Forbidden Letter", { letter: "q" }, {
        translate: (key, variables, fallback) => interpolate(dictionary[key] || fallback, variables)
    });
    assert.deepEqual(
        {
            mode: translated.mode,
            title: translated.title,
            detail: translated.detail,
            announcement: translated.announcement
        },
        {
            mode: "letra prohibida",
            title: "FORBIDDEN LETTER LEVEL",
            detail: "No word may use Q.",
            announcement: "NEW LEVEL: FORBIDDEN LETTER LEVEL. No word may use Q."
        }
    );
    assert.equal(levelTransition.buildPresentation("desconocido"), null);
});

test("canonical tracker uses the first snapshot as baseline and mode_seq only for ordering", () => {
    assert.equal(levelTransition.normalizeSequence(null), null);
    assert.equal(levelTransition.normalizeSequence(""), null);
    assert.equal(levelTransition.normalizeSequence("7"), 7);
    const transitions = [];
    const tracker = levelTransition.createModeTracker({
        onTransition: (result) => transitions.push(result)
    });

    const baseline = tracker.observe({ modo_actual: "palabras bonus", modo_seq: 4 });
    assert.equal(baseline.baseline, true, "joining an active match must not replay a level change");
    assert.equal(baseline.transition, false);

    assert.equal(
        tracker.observe({ modo_actual: "palabras bonus", modo_seq: 4 }).reason,
        "duplicate"
    );
    const intraLevel = tracker.observe({ modo_actual: "palabras bonus", modo_seq: 5 });
    assert.equal(intraLevel.accepted, true);
    assert.equal(intraLevel.transition, false, "a sequence advance inside the same mode is not a new level");
    assert.equal(
        tracker.observe({ modo_actual: "letra prohibida", modo_seq: 3 }).reason,
        "stale"
    );

    const nextLevel = tracker.observe({ modo_actual: "letra prohibida", modo_seq: 6 });
    assert.equal(nextLevel.transition, true);
    assert.equal(transitions.length, 1);
    assert.equal(transitions[0].mode, "letra prohibida");

    tracker.reset();
    assert.equal(
        tracker.observe({ modo_actual: "letra prohibida", modo_seq: 6 }).transition,
        false,
        "the first reconnect snapshot becomes the new baseline"
    );
});

test("an empty initial snapshot primes the first real level transition", () => {
    const tracker = levelTransition.createModeTracker();
    const emptyBaseline = tracker.observe({});
    assert.equal(emptyBaseline.accepted, true);
    assert.equal(emptyBaseline.baseline, true);
    assert.equal(emptyBaseline.mode, "");

    const firstLevel = tracker.observe({ modo_actual: "letra bendita", modo_seq: 1 });
    assert.equal(firstLevel.transition, true);
    assert.equal(firstLevel.mode, "letra bendita");

    const letterUpdate = tracker.observe({ modo_actual: "letra bendita", modo_seq: 2, letra_bendita: "m" });
    assert.equal(letterUpdate.transition, false, "changing the target letter must not replay the level overlay");
});

function fakeClassList() {
    const values = new Set();
    return {
        add: (...names) => names.forEach((name) => values.add(name)),
        remove: (...names) => names.forEach((name) => values.delete(name)),
        contains: (name) => values.has(name)
    };
}

function fakeElement() {
    return {
        textContent: "",
        dataset: {},
        attributes: {},
        classList: fakeClassList(),
        offsetWidth: 640,
        setAttribute(name, value) {
            this.attributes[name] = String(value);
        }
    };
}

test("controller replaces rapid transitions, announces them, and honors reduced duration", () => {
    const selectors = new Map([
        ["[data-level-eyebrow]", fakeElement()],
        ["[data-level-icon]", fakeElement()],
        ["[data-level-title]", fakeElement()],
        ["[data-level-detail]", fakeElement()]
    ]);
    const root = fakeElement();
    root.querySelector = (selector) => selectors.get(selector) || null;
    const liveRegion = fakeElement();
    const body = fakeElement();
    const timers = new Map();
    const cleared = [];
    let nextTimer = 1;
    const controller = levelTransition.createController({
        root,
        liveRegion,
        documentRef: { body },
        windowRef: { matchMedia: () => ({ matches: true }) },
        setTimer: (callback, delay) => {
            const id = nextTimer++;
            timers.set(id, { callback, delay });
            return id;
        },
        clearTimer: (id) => {
            cleared.push(id);
            timers.delete(id);
        },
        durationMs: 2800,
        reducedDurationMs: 1300
    });

    assert.equal(controller.show("letra bendita", { letra_bendita: "r" }), true);
    assert.equal(root.classList.contains("is-visible"), true);
    assert.equal(root.attributes["aria-hidden"], "false");
    assert.equal(body.classList.contains("level-transition-active"), true);
    assert.equal(root.dataset.levelTheme, "blessed-letter");
    assert.match(selectors.get("[data-level-title]").textContent, /LETRA BENDITA/);
    assert.ok(Array.from(timers.values()).some((timer) => timer.delay === 1300));

    const announcement = Array.from(timers.values()).find((timer) => timer.delay === 20);
    announcement.callback();
    assert.match(liveRegion.textContent, /NUEVO NIVEL/);

    assert.equal(controller.show("tertulia"), true);
    assert.equal(root.dataset.levelTheme, "muse-chat");
    assert.ok(cleared.length >= 1, "the previous hide timeout must be cancelled");
    const latestAnnouncement = Array.from(timers.values())
        .filter((timer) => timer.delay === 20)
        .at(-1);
    latestAnnouncement.callback();
    const persistentAnnouncement = liveRegion.textContent;
    const hide = Array.from(timers.values()).find((timer) => timer.delay === 1300);
    hide.callback();
    assert.equal(root.classList.contains("is-visible"), false);
    assert.equal(root.attributes["aria-hidden"], "true");
    assert.equal(body.classList.contains("level-transition-active"), false);
    assert.equal(
        liveRegion.textContent,
        persistentAnnouncement,
        "hiding the visual layer must not cut off the assistive announcement"
    );
});

test("spectator and actor expose one accessible, responsive transition driven by modo_actual", () => {
    const spectatorHtml = read("game/spectator/index.html");
    const spectatorState = read("game/spectator/js/state.js");
    const spectatorSockets = read("game/spectator/js/socket-events.js");
    const actorHtml = read("game/actors/source/index.html");
    const actorSockets = read("game/actors/source/js/socket-events.js");
    const css = read("game/css/level-transition.css");
    const i18n = read("game/js/i18n.js");

    [spectatorHtml, actorHtml].forEach((html) => {
        assert.equal((html.match(/id="level_transition"/g) || []).length, 1);
        assert.equal((html.match(/id="level_transition_status"/g) || []).length, 1);
        assert.match(html, /role="status" aria-live="assertive" aria-atomic="true"/);
        assert.match(html, /level-transition\.css\?v=20260823a/);
        assert.match(html, /domains\/level-transition\.js\?v=20260823a/);
    });
    assert.match(actorHtml, /level-transition level-transition--compact/);

    const spectatorActivate = spectatorSockets.slice(
        spectatorSockets.indexOf("socket.on('activar_modo'"),
        spectatorSockets.indexOf("socket.on('modo_actual'")
    );
    assert.doesNotMatch(spectatorActivate, /observarModoCanonicoTransicionEspectador/);
    assert.match(spectatorSockets, /socket\.on\('modo_actual'[\s\S]*observarModoCanonicoTransicionEspectador\(payload\)/);
    assert.match(spectatorSockets, /aplazarTransicionNivelEspectador\(observacionTransicion, payload\)/);
    assert.match(spectatorState, /if \(vista_espectador_modo_resuelta !== "partida"\) return false/);
    assert.match(spectatorState, /durationMs: 5200,[\s\S]*reducedDurationMs: 3200/);
    assert.match(spectatorState, /if \(modo !== "partida"\)[\s\S]*ocultarTransicionNivelEspectador\(\)/);
    assert.match(
        spectatorSockets,
        /function ejecutarCierrePartidaEspectador[\s\S]*ocultarTransicionNivelEspectador\(\)/
    );

    const actorActivate = actorSockets.slice(actorSockets.indexOf("socket.on('activar_modo'"));
    assert.doesNotMatch(actorActivate, /observarModoCanonicoTransicionActor/);
    assert.match(actorSockets, /socket\.on\('modo_actual'[\s\S]*observarModoCanonicoTransicionActor\(payload\)/);
    assert.match(actorSockets, /reiniciarSeguimientoTransicionNivelActor\(\)/);
    assert.match(
        actorSockets,
        /if \(introTransicionNivelActivaActor\)[\s\S]*aplazarTransicionNivelActor\(observacionTransicion, payload\)/
    );
    assert.match(
        actorSockets,
        /function finalizarCuentaAtrasActor[\s\S]*mostrarTransicionNivelPendienteActor\(modo_actual\)/
    );

    assert.match(css, /position: fixed;[\s\S]*pointer-events: none/);
    assert.match(css, /@keyframes scribLevelPanel/);
    assert.match(css, /@keyframes scribLevelCompactPanel/);
    assert.match(css, /@media \(max-width: 620px\), \(max-height: 560px\)/);
    assert.match(css, /@media \(max-height: 440px\)/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /@media \(forced-colors: active\)/);
    assert.match(css, /"Retro-gaming"/);

    [
        "level.transition.eyebrow",
        "level.transition.announcement",
        "level.transition.rule.blessed",
        "level.transition.rule.forbidden"
    ].forEach((key) => {
        assert.equal((i18n.match(new RegExp(`"${key.replace(/\./g, "\\.")}"`, "g")) || []).length, 3);
    });
});
