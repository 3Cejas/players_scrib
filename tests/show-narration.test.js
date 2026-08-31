const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const narration = require("../game/js/domains/show-narration.js");

test("show narration starts with five black seconds and keeps the final scene open", () => {
    assert.equal(narration.DEFAULT_PREROLL_SECONDS, 5);
    assert.equal(narration.sceneAt(0).id, "black");
    assert.equal(narration.sceneAt(4.999).id, "black");
    assert.equal(narration.sceneAt(5).id, "binary");
    assert.equal(narration.sceneAt(80).id, "reveal");
    assert.equal(narration.sceneAt(82.38).id, "brand");
    assert.equal(narration.sceneAt(85.013).id, "final");
    assert.equal(narration.sceneAt(9_999).id, "final");
});

test("subtitles follow the spoken words without anticipating pauses", () => {
    assert.equal(narration.subtitleAt(4.9), null);
    assert.equal(narration.subtitleAt(5.5), null);
    assert.match(narration.subtitleAt(6.4).text, /dos símbolos/);
    assert.equal(narration.subtitleAt(10.9), null);
    assert.match(narration.subtitleAt(82).text, /Surgiría/);
    assert.match(narration.subtitleAt(82.5).text, /<SCRI> B/);
    assert.equal(narration.subtitleAt(85.013), null);
    narration.SUBTITLES.forEach((cue, index) => {
        assert.ok(cue.end > cue.start, `invalid subtitle ${index}`);
        if (index > 0) assert.ok(cue.start >= narration.SUBTITLES[index - 1].end, `overlap at subtitle ${index}`);
    });
});

test("fusion, historical date and final brand use the requested visual symbols", () => {
    assert.equal(narration.SCENES.find(({ id }) => id === "fusion").glyph, "0 A");
    assert.equal(narration.SCENES.find(({ id }) => id === "origin-code").glyph, "");
    assert.equal(narration.SCENES.find(({ id }) => id === "reveal").glyph, "");
    assert.equal(narration.SCENES.find(({ id }) => id === "brand").glyph, "");
    assert.equal(narration.sceneAt(37.94).id, "writing-question");
});

test("authoritative state normalizes late-join playback safely", () => {
    const state = narration.normalizeState({
        activa: true,
        session_id: "opening",
        secuencia: 4,
        inicio_ts: 10_000,
        posicion_segundos: 93.5,
        configuracion: {
            pre_roll_segundos: 5,
            duracion_audio_segundos: 80.013,
            audio_url: "../media/narracion-show.mp3",
            slide_url: "../media/narracion-final.png"
        }
    });
    assert.equal(state.active, true);
    assert.equal(state.sequence, 4);
    assert.equal(state.positionSeconds, 93.5);
    assert.equal(state.config.prerollSeconds, 5);
    assert.equal(state.config.audioSeconds, 80.013);
});

test("the spectator and muse load the synchronized visuals and bundled originals", () => {
    const spectator = read("game/spectator/index.html");
    const muse = read("game/public/players/index.html");
    for (const html of [spectator, muse]) {
        assert.match(html, /show-narration\.css\?v=20260831d/);
        assert.match(html, /domains\/show-narration\.js\?v=20260831d/);
    }
    assert.ok(fs.statSync(path.join(ROOT, "game/media/narracion-show.mp3")).size > 3_000_000);
    const png = fs.readFileSync(path.join(ROOT, "game/media/narracion-final.png"));
    assert.deepEqual(Array.from(png.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
    const css = read("game/css/show-narration.css");
    assert.match(css, /scrib-show-lights/);
    assert.match(css, /data-scene="final"[\s\S]*scrib-show-narration__final/);
    assert.match(css, /object-fit:\s*fill/);
    assert.match(css, /data-scene="black"[\s\S]*visibility:\s*hidden/);
    assert.match(css, /scrib-show-lights__subtitle/);
    assert.match(css, /scrib-show-narration__date/);
    assert.match(css, /data-scene="brand"[\s\S]*scrib-show-narration__brand/);
    assert.match(css, /showSubtitleEnter/);
    assert.match(css, /showSymbolAttraction/);
    const source = read("game/js/domains/show-narration.js");
    assert.match(source, /scrib-show-lights__subtitle[\s\S]*data-show-subtitle/);
    assert.match(source, /\.\.\/media\/scrib-logo-mark\.png/);
    assert.match(source, /\.\.\/\.\.\/media\/scrib-logo-mark\.png/);
    assert.match(source, /scrib-show-narration__date[^\n]*<span>1820<\/span>/);
    assert.match(source, /subtitleBox\.hidden = !subtitle/);
    assert.doesNotMatch(source, /glyph: "SURGIRÍA/);
    assert.doesNotMatch(source, /scrib-show-narration__copy|data-show-title|data-show-kicker/);
});

test("Control exposes one stateful play-pause button without another interval", () => {
    const html = read("game/control/index.html");
    const section = html.match(/<section id="show_narration_control"[\s\S]*?<\/section>/)?.[0] || "";
    assert.match(section, /NARRACI&Oacute;N DE APERTURA/);
    assert.match(section, /id="show_narration_toggle"/);
    assert.equal((section.match(/<button/g) || []).length, 1);
    assert.doesNotMatch(section, /INTERVALO|REPETIR/);

    const control = read("game/control/js/show-narration-control.js");
    assert.match(control, /narracion_show_reproducir/);
    assert.match(control, /narracion_show_detener/);
    assert.match(control, /aria-pressed/);
    assert.match(read("game/control/js/socket-events.js"), /pedir_narracion_show_estado/);
});

test("tutorial music is silent during narration and starts instantly on the final slide", () => {
    const transitions = read("game/js/domains/view-transition.js");
    assert.match(transitions, /scrib:show-narration-visibility/);
    assert.match(transitions, /scrib:show-narration-final/);
    assert.match(transitions, /music\.currentTime = 0/);
    assert.match(transitions, /fadeMusic\(musicVolume, 0\)/);
});
