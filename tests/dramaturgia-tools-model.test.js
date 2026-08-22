const test = require("node:test");
const assert = require("node:assert/strict");

const tools = require("../game/dramaturgia/js/tools-model.js");

test("dramaturgy screen room defines the nine canonical read-only views", () => {
  assert.equal(tools.SCREENS.length, 9);
  assert.equal(new Set(tools.SCREENS.map((screen) => screen.id)).size, 9);
  assert.deepEqual(
    tools.SCREENS.map((screen) => screen.id),
    [
      "control",
      "spectator",
      "jury",
      "writer1",
      "musa1",
      "actor1",
      "writer2",
      "musa2",
      "actor2"
    ]
  );
  tools.SCREENS.forEach((screen) => {
    assert.match(screen.url, /dramaturgia_monitor=1/);
    assert.match(screen.url, new RegExp(`screen_id=${screen.id}(?:&|$)`));
    assert.ok(screen.width > 0);
    assert.ok(screen.height > 0);
  });
  assert.equal(tools.SCREENS.filter((screen) => screen.group === "sistema").length, 3);
  assert.equal(tools.SCREENS.filter((screen) => screen.group === "azul").length, 3);
  assert.equal(tools.SCREENS.filter((screen) => screen.group === "rojo").length, 3);

  const writer1 = tools.SCREENS.find((screen) => screen.id === "writer1");
  const writer2 = tools.SCREENS.find((screen) => screen.id === "writer2");
  const musa1 = tools.SCREENS.find((screen) => screen.id === "musa1");
  const musa2 = tools.SCREENS.find((screen) => screen.id === "musa2");
  const actor1 = tools.SCREENS.find((screen) => screen.id === "actor1");
  const actor2 = tools.SCREENS.find((screen) => screen.id === "actor2");
  assert.deepEqual(
    [writer1.label, writer2.label, musa1.label, musa2.label, actor1.label, actor2.label],
    ["Escritxr", "Escritxr", "Musa", "Musa", "Intérprete", "Intérprete"]
  );
  assert.equal(musa1.accent, writer1.accent);
  assert.equal(musa2.accent, writer2.accent);
  assert.notEqual(musa1.accent, musa2.accent);
});

test("dramaturgy simulator config applies presets, limits and valid modes", () => {
  const normalized = tools.normalizeConfig({
    seed: "  prueba repetible  ",
    total_seconds: 2,
    mode_seconds: 999,
    speed: 99,
    writer_ppm: -20,
    muse_interval_seconds: 0,
    muses_per_team: 12,
    votes: false,
    hearts: false,
    auto_finish: false,
    full_show: false,
    modes: ["tertulia", "modo inexistente", "tertulia", "frase final"]
  }, "quick");

  assert.equal(normalized.seed, "prueba repetible");
  assert.equal(normalized.total_seconds, 30);
  assert.equal(normalized.mode_seconds, 300);
  assert.equal(normalized.speed, 8);
  assert.equal(normalized.writer_ppm, 5);
  assert.equal(normalized.muse_interval_seconds, 1);
  assert.equal(normalized.muses_per_team, 4);
  assert.equal(normalized.votes, false);
  assert.equal(normalized.hearts, false);
  assert.equal(normalized.auto_finish, false);
  assert.equal(normalized.full_show, false);
  assert.deepEqual(normalized.modes, ["tertulia", "frase final"]);

  assert.deepEqual(tools.normalizeConfig({}, "stress").modes, tools.MODES);
  assert.equal(tools.normalizeConfig({}, "stress").speed, 3);
  assert.equal(tools.normalizeConfig({}, "stress").full_show, true);
});

test("dramaturgy interaction seed is reproducible", () => {
  const first = tools.createSeededRandom("misma-semilla");
  const second = tools.createSeededRandom("misma-semilla");
  const other = tools.createSeededRandom("otra-semilla");
  const firstSequence = Array.from({ length: 8 }, () => first());
  const secondSequence = Array.from({ length: 8 }, () => second());
  const otherSequence = Array.from({ length: 8 }, () => other());

  assert.deepEqual(firstSequence, secondSequence);
  assert.notDeepEqual(firstSequence, otherSequence);
  firstSequence.forEach((value) => assert.ok(value >= 0 && value < 1));
});
