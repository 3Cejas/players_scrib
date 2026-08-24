const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const inspirationScore = require("../game/js/domains/inspiration-score.js");

const elemento = (valor, presente = true) => ({
    getAttribute(nombre) {
        assert.equal(nombre, "data-inspiration-value");
        return presente ? valor : null;
    }
});

test("weighted inspiration score sums values and gives legacy spans one point", () => {
    const total = inspirationScore.sumarElementos([
        elemento("0.75"),
        elemento("0,5"),
        elemento(null, false),
        elemento("valor-invalido"),
        elemento("-4"),
        elemento("99")
    ]);

    assert.equal(total, 4.25);
});

test("each highlighted inspiration is capped at one point", () => {
    assert.equal(inspirationScore.normalizarValorElemento(elemento("1.01")), 1);
    assert.equal(inspirationScore.normalizarValorElemento(elemento("Infinity")), 1);
});

test("control HTML extraction queries every highlighted inspiration class", () => {
    const vistos = { html: "", selector: "" };
    const spans = [elemento("0.8"), elemento(null, false)];
    const documento = {
        createElement() {
            return {
                set innerHTML(valor) {
                    vistos.html = valor;
                },
                querySelectorAll(selector) {
                    vistos.selector = selector;
                    return spans;
                }
            };
        }
    };

    const total = inspirationScore.sumarDesdeHtml(
        '<span class="palabra-bendita">luz</span>',
        ["palabra-bendita", "palabra-musa"],
        documento
    );

    assert.equal(total, 1.8);
    assert.equal(vistos.html, '<span class="palabra-bendita">luz</span>');
    assert.equal(vistos.selector, ".palabra-bendita,.palabra-musa");
});

test("control loads the scorer before building and sending live stats", () => {
    const root = path.resolve(__dirname, "..");
    const html = fs.readFileSync(path.join(root, "game/control/index.html"), "utf8");
    const state = fs.readFileSync(path.join(root, "game/control/js/state.js"), "utf8");

    assert.ok(html.indexOf("domains/inspiration-score.js") < html.indexOf("./js/state.js"));
    assert.match(state, /sumarDesdeHtml\(html, CLASES_PALABRAS_DESTACADAS_PDF\)/);
    assert.match(state, /valorInspiracion,/);
});
