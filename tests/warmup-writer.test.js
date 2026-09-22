const test = require("node:test");
const assert = require("node:assert/strict");

const warmupWriter = require("../game/js/domains/warmup-writer.js");

const crearDetonador = (equipo, indice, opciones = {}) => ({
  id: `${equipo}-${indice}`,
  equipo,
  palabra: `${equipo === 1 ? "AZUL" : "ROJO"}-${indice}`,
  ts: indice,
  ...opciones
});

test("la escritora azul siempre conserva los detonadores de sus musas aunque el rojo llene la nube", () => {
  const azules = [crearDetonador(1, 1), crearDetonador(1, 2)];
  const rojos = Array.from({ length: 100 }, (_, indice) => crearDetonador(2, 1000 + indice));

  const visibles = warmupWriter.seleccionarDetonadoresParaEscritora(
    [...rojos, ...azules],
    1,
    80
  );

  assert.deepEqual(visibles.slice(0, 2).map(({ equipo }) => equipo), [1, 1]);
  assert.deepEqual(
    new Set(visibles.filter(({ equipo }) => equipo === 1).map(({ id }) => id)),
    new Set(["1-1", "1-2"])
  );
  assert.equal(visibles.length, 80);
});

test("la prioridad se aplica simetricamente a la escritora roja", () => {
  const azules = Array.from({ length: 100 }, (_, indice) => crearDetonador(1, 1000 + indice));
  const rojos = [
    crearDetonador(2, 1),
    crearDetonador(2, 2, { destacada: true })
  ];

  const visibles = warmupWriter.seleccionarDetonadoresParaEscritora(
    [...azules, ...rojos],
    2,
    80
  );

  assert.deepEqual(visibles.slice(0, 2).map(({ id }) => id), ["2-2", "2-1"]);
  assert.equal(visibles.filter(({ equipo }) => equipo === 2).length, 2);
  assert.equal(visibles.length, 80);
});
