const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function entorno(options = {}) {
    const window = {};
    const context = vm.createContext({ window });
    for (const file of ["inspiration", "muse-letter-input"]) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, `../game/js/domains/${file}.js`), "utf8"), context);
    }
    const api = window.ScribMuseLetterInput;
    const node = () => ({
        children: [], style: {}, hidden: false, scrollLeft: 0,
        appendChild(child) { this.children.push(child); },
        replaceChildren(...children) { this.children = children; },
        classList: { values: new Set(), toggle(key, value) { value ? this.values.add(key) : this.values.delete(key); } }
    });
    const document = { createElement: node, createDocumentFragment: node };
    const input = {
        ownerDocument: document, value: "", maxLength: 20,
        selectionStart: 0, selectionEnd: 0, scrollLeft: 0,
        listeners: {},
        addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
        dispatchEvent(event) { (this.listeners[event.type] || []).forEach(fn => fn(event)); },
        setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
        setRangeText(value, start, end) {
            this.value = this.value.slice(0, start) + value + this.value.slice(end);
            this.setSelectionRange(start + value.length, start + value.length);
        }
    };
    const root = node(), mirror = node();
    let nextFrame = 0;
    const windowRef = {
        Event: class { constructor(type) { this.type = type; } },
        getComputedStyle() { return { font: "20px monospace", textAlign: "center" }; },
        requestAnimationFrame() { return ++nextFrame; },
        addEventListener() {}
    };
    const controller = api.createController({ input, root, mirror, windowRef, ...options });
    const dispatch = (type, properties = {}) => {
        const event = { type, cancelable: true, defaultPrevented: false, ...properties,
            preventDefault() { this.defaultPrevented = true; } };
        input.dispatchEvent(event);
        return event;
    };
    const write = (value, cursor = value.length) => {
        input.value = value;
        input.setSelectionRange(cursor, cursor);
        dispatch("input");
    };
    return { api, input, root, mirror, controller, dispatch, write };
}

test("blessed letter highlights every matching character, including uppercase and accents", () => {
    const { api } = entorno();
    assert.equal(api.segmentos("ÁrbolAAá", "a").filter(parte => parte.coincide).map(parte => parte.texto).join(""), "ÁAAá");
    assert.equal(api.segmentos("niñoNÑn\u0303", "ñ").filter(parte => parte.coincide).map(parte => parte.texto).join(""), "ñÑn\u0303");
    assert.equal(api.segmentos("niñoNÑn\u0303", "n").filter(parte => parte.coincide).map(parte => parte.texto).join(""), "nN");
});

test("changing the blessed letter recolors the draft without changing the text or selection", () => {
    const { input, root, mirror, controller, write } = entorno();
    controller.setRule({ modo: "letra bendita", letra: "a" });
    write("casa", 2);
    const highlighted = () => mirror.children[0].children[0].children[0].children
        .filter(span => span.className).map(span => span.textContent).join("");
    assert.equal(highlighted(), "aa");
    controller.setRule({ modo: "letra bendita", letra: "s" });
    assert.equal(highlighted(), "s");
    assert.equal(input.value, "casa");
    assert.equal(input.selectionStart, 2);
    assert.equal(root.classList.values.has("musa-letter-highlight"), true);
    controller.setRule({ modo: "palabras bonus" });
    assert.equal(mirror.hidden, true);
    assert.equal(root.classList.values.has("musa-letter-highlight"), false);
    assert.equal(input.value, "casa");
});

test("cursed letter is blocked by keyboard and beforeinput without deleting a selected word", () => {
    const { controller, dispatch, input, write } = entorno();
    controller.setRule({ modo: "letra prohibida", letra: "a" });
    write("sol");
    input.setSelectionRange(0, 3);
    assert.equal(dispatch("keydown", { key: "Á" }).defaultPrevented, true);
    assert.equal(dispatch("keydown", { key: "a", ctrlKey: true }).defaultPrevented, false);
    assert.equal(dispatch("beforeinput", { inputType: "insertText", data: "A" }).defaultPrevented, true);
    assert.equal(input.value, "sol");
    assert.equal(dispatch("beforeinput", { inputType: "insertText", data: "luz" }).defaultPrevented, false);
});

test("paste removes forbidden characters while preserving valid characters and caret", () => {
    const { controller, dispatch, input, write } = entorno();
    controller.setRule({ modo: "letra prohibida", letra: "a" });
    write("sol", 1);
    const event = dispatch("paste", { clipboardData: { getData: () => "cÁsa" } });
    assert.equal(event.defaultPrevented, true);
    assert.equal(input.value, "scsol");
    assert.equal(input.selectionStart, 3);
});

test("filtered inserts delegate to the gameplay keyboard instead of bypassing its penalty", () => {
    const pending = [];
    const { controller, dispatch, input, write } = entorno({ insertText: texto => pending.push(texto) });
    controller.setRule({ modo: "letra prohibida", letra: "a" });
    write("sol");
    dispatch("paste", { clipboardData: { getData: () => "casa" } });
    assert.deepEqual(pending, ["cs"]);
    assert.equal(input.value, "sol");
    controller.setRule({ modo: "letra prohibida", letra: "s" });
    assert.equal(controller.filtrar(pending[0]), "c", "queued input is revalidated against the current letter when committed");
});

test("mobile replacement, undo and autofill input are sanitized with correct selection offsets", () => {
    const { controller, input, write } = entorno();
    controller.setRule({ modo: "letra prohibida", letra: "a" });
    write("Ábaca", 3);
    assert.equal(input.value, "bc");
    assert.equal(input.selectionStart, 1);
    input.value = "aSáL";
    input.setSelectionRange(1, 4);
    controller.refrescar();
    assert.equal(input.value, "SL");
    assert.equal(input.selectionStart, 0);
    assert.equal(input.selectionEnd, 2);
});

test("IME composition stays intact until completion, then enforces the current letter", () => {
    const { controller, dispatch, input, write } = entorno();
    controller.setRule({ modo: "letra prohibida", letra: "ñ" });
    dispatch("compositionstart");
    write("n\u0303ieve");
    assert.equal(input.value, "n\u0303ieve");
    assert.equal(dispatch("beforeinput", { inputType: "insertCompositionText", data: "ñ", isComposing: true }).defaultPrevented, false);
    dispatch("compositionend");
    assert.equal(input.value, "ieve");
    assert.equal(input.selectionStart, 4);
});

test("cursed letter changes remove only newly invalid characters and leaving the level restores all keys", () => {
    const { controller, input, dispatch, write } = entorno();
    controller.setRule({ modo: "letra prohibida", letra: "x" });
    write("niñon", 3);
    controller.setRule({ modo: "letra prohibida", letra: "n" });
    assert.equal(input.value, "iño");
    assert.equal(input.selectionStart, 2);
    assert.equal(dispatch("keydown", { key: "x" }).defaultPrevented, false);
    assert.equal(dispatch("keydown", { key: "N" }).defaultPrevented, true);
    controller.setRule({ modo: "tertulia" });
    assert.equal(dispatch("keydown", { key: "N" }).defaultPrevented, false);
    write("NÑx");
    assert.equal(input.value, "NÑx");
    controller.setRule();
    assert.equal(controller.filtrar("aNÑx"), "aNÑx");
});

test("the color mirror follows the native horizontal scroll and clears when the word is sent", () => {
    const { controller, input, mirror, write, dispatch } = entorno();
    controller.setRule({ modo: "letra bendita", letra: "a" });
    write("abecedario");
    input.scrollLeft = 55;
    dispatch("scroll");
    assert.equal(mirror.children[0].scrollLeft, 55);
    input.value = "";
    controller.refrescar();
    assert.equal(mirror.hidden, true);
});

test("Muse entrypoint loads letter editing before state and syncs its rule before voting guards", () => {
    const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    const html = read("game/public/players/index.html");
    const sockets = read("game/public/players/js/socket-events.js");
    const state = read("game/public/players/js/state.js");
    assert.ok(html.indexOf("domains/muse-letter-input.js?v=20261001a") < html.indexOf("./js/state.js?"));
    assert.match(html, /id="musa_letter_mirror"[^>]*aria-hidden="true"/);
    const handler = sockets.slice(sockets.indexOf('socket.on("pedir_inspiracion_musa"'), sockets.indexOf("function convertirASegundos"));
    assert.ok(handler.indexOf("actualizarReglaLetraInspiracionMusa(juego)") < handler.indexOf("if(sincro == 1"));
    assert.match(handler, /preservarBorrador: juego\.modo_actual === modo_actual/);
    assert.match(sockets, /function limpiezas\([^\n]*\{\n\s*actualizarReglaLetraInspiracionMusa\(\)/);
    assert.match(sockets, /function limpiezas_final\(\)\{\n\s*actualizarReglaLetraInspiracionMusa\(\)/);
    assert.match(state, /function setUiPartidaFinalizadaMusa[\s\S]*actualizarReglaLetraInspiracionMusa\(\)/);
});
