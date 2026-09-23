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

test("la escritora acepta el canal dirigido de calentamiento de su propio equipo", () => {
  const socketEvents = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "../game/players/js/socket-events.js"),
    "utf8"
  );
  assert.match(socketEvents, /socket\.on\('calentamiento_estado_escritor',[\s\S]*equipo_destino[\s\S]*Number\(player\)[\s\S]*actualizarCalentamientoEscritor/);
});

test("el calentamiento se resincroniza sin repintar una revision ya aplicada", () => {
  const state = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "../game/players/js/state.js"),
    "utf8"
  );
  assert.match(state, /revisionNormalizada <= revision_calentamiento_escritor\) return false/);
  assert.match(state, /setInterval\([\s\S]*solicitarEstadoCalentamientoEscritor,[\s\S]*1500/);
});
