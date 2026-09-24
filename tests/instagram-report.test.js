const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const report = require("../game/js/domains/instagram-report.js");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function datosFicticios() {
    const textoLargo = Array.from({ length: 70 }, (_, indice) => (
        `Escena ${indice + 1}. La ciudad despierta y una carta cambia el rumbo de la historia.`
    )).join("\n");
    return {
        fecha: "24 DE SEPTIEMBRE DE 2026",
        duracion: "35:00",
        jugadores: {
            1: {
                nombre: "ALVARA STRINGANA",
                texto: textoLargo,
                palabras: 510,
                unicas: 211,
                pulsaciones: 4200,
                ppm: 120,
                inspiraciones: 18,
                puntuacion: 63.5,
                letrasBenditas: ["A", "R"],
                letrasMalditas: ["X"],
                palabrasBenditas: ["Volcán", "Brújula"],
                palabrasMalditas: ["Niebla"]
            },
            2: {
                nombre: "PABLO PINEÑO",
                texto: "Primera línea.\n\nSegunda línea después de un salto.",
                palabras: 8,
                unicas: 7,
                pulsaciones: 58,
                ppm: 92,
                inspiraciones: 3,
                puntuacion: 36.5
            }
        },
        musas: {
            1: { nombres: ["Nébula", "Luna"], enviadas: 30, introducidas: 18, efectividad: 60, superbonus: 2 },
            2: { nombres: ["Casiopea"], enviadas: 9, introducidas: 3, efectividad: 33, superbonus: 0 }
        },
        puntuacion: {
            disponible: true,
            jugadores: { 1: { total: 63.5 }, 2: { total: 36.5 } },
            categorias: [
                { id: "produccion", etiqueta: "Producción", valores: { 1: 510, 2: 8 }, puntos: { 1: 18, 2: 2 } }
            ],
            ganador: 1,
            empate: false
        }
    };
}

test("Instagram carousel uses the vertical 4:5 publication size", () => {
    assert.equal(report.WIDTH, 1080);
    assert.equal(report.HEIGHT, 1350);
    assert.equal(report.WIDTH / report.HEIGHT, 4 / 5);
});

test("carousel plan is ordered and paginates the complete texts", () => {
    const plan = report.crearPlan(datosFicticios());
    assert.deepEqual(plan.slides.slice(0, 5).map((slide) => slide.tipo), [
        "portada",
        "resumen",
        "puntuacion",
        "niveles",
        "musas"
    ]);
    assert.equal(plan.slides.at(-1).tipo, "cierre");
    const historia1 = plan.slides.filter((slide) => slide.tipo === "historia" && slide.jugadorId === 1);
    const historia2 = plan.slides.filter((slide) => slide.tipo === "historia" && slide.jugadorId === 2);
    assert.ok(historia1.length > 1, "a long story should span multiple publication images");
    assert.equal(historia1.at(-1).pagina, historia1.length);
    assert.match(historia1.flatMap((slide) => slide.lineas).join(" "), /Escena 70\./);
    assert.match(historia2.flatMap((slide) => slide.lineas).join("\n"), /Segunda línea después/);
});

test("ZIP writer stores ordered PNG files in a valid archive structure", () => {
    const zip = report.crearZip([
        { nombre: "01_portada.png", bytes: new Uint8Array([137, 80, 78, 71]) },
        { nombre: "02_resumen.png", bytes: new Uint8Array([1, 2, 3, 4]) }
    ], new Date("2026-09-24T12:00:00Z"));
    const texto = Buffer.from(zip).toString("latin1");

    assert.deepEqual(Array.from(zip.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
    assert.match(texto, /01_portada\.png/);
    assert.match(texto, /02_resumen\.png/);
    assert.ok(texto.indexOf("01_portada.png") < texto.indexOf("02_resumen.png"));
    assert.deepEqual(Array.from(zip.slice(-22, -18)), [0x50, 0x4b, 0x05, 0x06]);
});

test("Control exposes the final-section export button and composes it from live match data", () => {
    const html = read("game/control/index.html");
    const control = read("game/control/js/instagram-export-control.js");

    assert.match(html, /id="boton_exportar_instagram"/);
    assert.match(html, /domains\/instagram-report\.js/);
    assert.match(html, /instagram-export-control\.js/);
    assert.match(control, /pedirResumenMusasPdfControl\(2500\)/);
    assert.match(control, /estado_puntuacion_final_control/);
    assert.match(control, /report\.generarPngs\(datos/);
    assert.match(control, /report\.crearZip\(resultado\.archivos\)/);
    assert.match(control, /type: "application\/zip"/);
});
