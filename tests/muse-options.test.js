const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizePreferences, readPreferences, savePreferences, installPreferences } = require("../game/public/players/js/musa-options.js");

test("muse preferences reject unsupported languages, sizes and non-boolean flags", () => {
    assert.deepEqual(normalizePreferences({ language: "xx", textSize: 99, reducedMotion: "false", highContrast: 1 }),
        { language: "", textSize: 1, reducedMotion: false, highContrast: false, readableFont: false });
    assert.equal(normalizePreferences(null).language, "");
});
test("muse preferences persist and gracefully handle blocked or corrupted storage", () => {
    let data;
    const storage = { getItem: () => data, setItem: (_key, value) => { data = value; } };
    assert.equal(savePreferences(storage, { language: "fr", textSize: 1.4, highContrast: true }), true);
    assert.equal(readPreferences(storage).language, "fr");
    assert.equal(readPreferences(storage).textSize, 1.4);
    data = "bad json";
    assert.equal(readPreferences(storage).textSize, 1);
    assert.equal(savePreferences(undefined, {}), false);
    assert.equal(readPreferences(undefined).language, "");
});
test("personal language overrides server language without changing other players or the OS preference", () => {
    let language = "es";
    let osReduced = true;
    const classes = new Map();
    const documentRef = { body: { classList: { toggle: (key, enabled) => classes.set(key, enabled) }, style: { setProperty() {} } } };
    const windowRef = {
        localStorage: { getItem: () => null, setItem() {} },
        matchMedia: () => ({ matches: osReduced }),
        scribGetLanguage2P: () => language,
        scribSetLanguage2P: value => { language = value; },
        dispatchEvent() {}, Event: class Event {}
    };
    const store = installPreferences(windowRef, documentRef);
    store.set({ language: "en" });
    store.serverLanguage("fr");
    assert.equal(language, "en");
    assert.equal(classes.get("musa-reduced-motion"), true);
    osReduced = false;
    store.set({ reducedMotion: true, highContrast: true, readableFont: true });
    assert.equal(store.reducedMotion(), true);
    store.set({ language: "", reducedMotion: false });
    assert.equal(language, "fr");
    assert.equal(store.reducedMotion(), false);
    assert.equal(classes.get("musa-high-contrast"), true);
});
