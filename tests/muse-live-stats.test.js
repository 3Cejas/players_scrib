const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveSlide, normalizePayload, renderSlide, createController } = require("../game/public/players/js/musa-live-stats.js");

test("muse stats follow the same four cyclic slides as the projector", () => {
    const data = { players: { 1: { nombre: "AZUL" }, 2: { nombre: "ROJA" } } };
    for (const [step, team, kind] of [[0, 1, "heatmap"], [1, 2, "heatmap"], [2, 1, "overview"], [3, 2, "overview"], [4, 1, "heatmap"], [-1, 2, "overview"]]) {
        const slide = renderSlide(data, step);
        assert.equal(slide.team, team);
        assert.equal(slide.kind, kind);
        assert.equal(slide.name, team === 1 ? "AZUL" : "ROJA");
    }
    assert.equal(resolveSlide(NaN), 0);
});

test("live metrics use the server fields, finite values and safe bounded histories", () => {
    const data = { players: { 1: { palabrasTotal: 10, palabrasUnicas: 8, valorInspiracion: 4.5, ritmoPpm: 90, pulsacionesTotal: 30, intentosLetraProhibida: 2, intentosPalabraProhibida: 1, heatmap: { KeyA: 5, KeyB: Infinity }, tiempoTotalMs: 60000 } }, historial_inspiracion: { 1: [{ t: 0, valor: 0 }, { t: 30000, valor: 4.5 }, { t: NaN, valor: 9 }] } };
    const player = normalizePayload(data).players[1];
    assert.equal(player.fallos, 3);
    assert.equal(player.heatmap.KeyB, 0);
    assert.equal(player.history.length, 2);
    const slide = renderSlide(data, 2);
    assert.match(slide.html, /80%/);
    assert.match(slide.html, /4\.5/);
    assert.match(slide.html, /1:00/);
    assert.doesNotMatch(slide.html, /NaN|Infinity|peso máximo|Huella de las musas|Tiempo ganado/);
    assert.doesNotThrow(() => renderSlide(null, 0));
    assert.match(renderSlide(data, 2, "en").html, /Inspiration over time/);
    assert.match(renderSlide(data, 2, "fr").html, /Richesse lexicale/);
});

test("stats can appear, change slides, translate and disappear without altering the muse page", () => {
    const fields = Object.fromEntries(["title", "name", "subtitle", "counter", "footer", "content"].map(key => [key, { textContent: "", innerHTML: "" }]));
    const root = { dataset: {}, hidden: true, scrollTop: 20, querySelector: selector => fields[selector.match(/"([^"]+)"/)[1]], setAttribute() {} };
    let language = "es";
    let languageChanged;
    const controller = createController({ root, windowRef: { scribGetLanguage2P: () => language, scribOnLanguageChange2P: cb => { languageChanged = cb; } } });
    controller.update({ players: { 2: { nombre: "<img src=x>" } } });
    assert.equal(root.hidden, true);
    controller.setView({ active: true, step: 1 });
    assert.equal(root.dataset.team, "2");
    assert.equal(root.scrollTop, 0);
    assert.equal(fields.name.textContent, "<img src=x>");
    assert.doesNotMatch(fields.content.innerHTML, /<img/);
    root.scrollTop = 70;
    controller.update({ players: { 2: { palabrasTotal: 3 } } });
    assert.equal(root.scrollTop, 70);
    language = "en";
    languageChanged();
    assert.equal(fields.title.textContent, "MATCH STATS");
    controller.setView({ active: false });
    assert.equal(root.hidden, true);
    controller.setView({ active: true, step: 3 });
    assert.equal(fields.counter.textContent, "4 / 4");
});
