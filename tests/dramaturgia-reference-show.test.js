const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const REFERENCE_ROOT = path.join(ROOT, "game/dramaturgia/reference-show");
const manifest = JSON.parse(fs.readFileSync(path.join(REFERENCE_ROOT, "manifest.json"), "utf8"));
const model = require("../game/dramaturgia/js/model.js");

const EXPECTED_SCREENS = ["control", "writer1", "musa1", "spectator", "actor1"];
const EXPECTED_MILESTONES = [
  "warmup-lugares-open",
  "warmup-lugares",
  "warmup-acciones-open",
  "warmup-acciones",
  "warmup-frase-final-open",
  "warmup-frase-final",
  "level-letra-bendita-feedback",
  "level-letra-bendita",
  "competition-letra-bendita",
  "level-letra-prohibida-feedback",
  "level-letra-prohibida",
  "competition-letra-prohibida",
  "level-tertulia",
  "level-palabras-bonus-feedback",
  "level-palabras-bonus",
  "competition-palabras-bonus",
  "level-palabras-prohibidas-feedback",
  "level-palabras-prohibidas",
  "competition-palabras-prohibidas",
  "level-frase-final",
  "representation-preparation",
  "representation-projection",
  "representation-final"
];
const EXPECTED_INTERACTION_CHANGES = {
  control: [
    "warmup-lugares-open",
    "competition-letra-bendita",
    "competition-letra-prohibida",
    "competition-palabras-bonus",
    "competition-palabras-prohibidas",
    "representation-preparation"
  ],
  writer1: [
    "warmup-lugares-open",
    "warmup-lugares",
    "warmup-acciones-open",
    "warmup-acciones",
    "warmup-frase-final-open",
    "warmup-frase-final",
    "level-letra-bendita-feedback",
    "level-letra-bendita",
    "competition-letra-bendita",
    "level-letra-prohibida-feedback",
    "level-letra-prohibida",
    "competition-letra-prohibida",
    "level-tertulia",
    "level-palabras-bonus-feedback",
    "level-palabras-bonus",
    "competition-palabras-bonus",
    "level-palabras-prohibidas-feedback",
    "level-palabras-prohibidas",
    "competition-palabras-prohibidas",
    "level-frase-final",
    "representation-preparation"
  ],
  musa1: [
    "warmup-lugares-open",
    "warmup-lugares",
    "warmup-acciones-open",
    "warmup-acciones",
    "warmup-frase-final-open",
    "warmup-frase-final",
    "level-letra-bendita-feedback",
    "level-letra-bendita",
    "competition-letra-bendita",
    "level-letra-prohibida-feedback",
    "level-letra-prohibida",
    "competition-letra-prohibida",
    "level-tertulia",
    "level-palabras-bonus-feedback",
    "level-palabras-bonus",
    "competition-palabras-bonus",
    "level-palabras-prohibidas-feedback",
    "level-palabras-prohibidas",
    "competition-palabras-prohibidas",
    "level-frase-final",
    "representation-preparation"
  ],
  spectator: [
    "warmup-lugares-open",
    "warmup-lugares",
    "warmup-acciones-open",
    "warmup-acciones",
    "warmup-frase-final-open",
    "warmup-frase-final",
    "level-letra-bendita-feedback",
    "level-letra-bendita",
    "competition-letra-bendita",
    "level-letra-prohibida-feedback",
    "level-letra-prohibida",
    "competition-letra-prohibida",
    "level-tertulia",
    "level-palabras-bonus-feedback",
    "level-palabras-bonus",
    "competition-palabras-bonus",
    "level-palabras-prohibidas-feedback",
    "level-palabras-prohibidas",
    "competition-palabras-prohibidas",
    "level-frase-final",
    "representation-preparation"
  ],
  actor1: [
    "warmup-lugares-open",
    "level-letra-bendita",
    "level-letra-prohibida",
    "level-tertulia",
    "level-palabras-bonus",
    "level-palabras-prohibidas",
    "level-frase-final",
    "representation-preparation"
  ]
};
const BASE_BY_SCREEN = {
  control: "../../../control/",
  writer1: "../../../players/",
  musa1: "../../../public/players/",
  spectator: "../../../spectator/",
  actor1: "../../../actors/source/"
};
const SOURCE_PATTERN_BY_SCREEN = {
  control: /^control$/,
  writer1: /^writer[12]$/,
  musa1: /^musa[12]$/,
  spectator: /^spectator$/,
  actor1: /^actor[12]$/
};
const WARMUP_PAIRS = [
  { request: "lugares", openId: "warmup-lugares-open", closedId: "warmup-lugares" },
  { request: "acciones", openId: "warmup-acciones-open", closedId: "warmup-acciones" },
  { request: "frase_final", openId: "warmup-frase-final-open", closedId: "warmup-frase-final" }
];
const COMPETITION_LEVELS = [
  { mode: "letra bendita", id: "competition-letra-bendita" },
  { mode: "letra prohibida", id: "competition-letra-prohibida" },
  { mode: "palabras bonus", id: "competition-palabras-bonus" },
  { mode: "palabras prohibidas", id: "competition-palabras-prohibidas" }
];
const DISADVANTAGE_PAIRS = [
  {
    mode: "letra bendita",
    feedbackId: "level-letra-bendita-feedback",
    stableId: "level-letra-bendita",
    levelText: "NIVEL LETRA BENDITA"
  },
  {
    mode: "letra prohibida",
    feedbackId: "level-letra-prohibida-feedback",
    stableId: "level-letra-prohibida",
    levelText: "NIVEL LETRA MALDITA"
  },
  {
    mode: "palabras bonus",
    feedbackId: "level-palabras-bonus-feedback",
    stableId: "level-palabras-bonus",
    levelText: "NIVEL PALABRAS BENDITAS"
  },
  {
    mode: "palabras prohibidas",
    feedbackId: "level-palabras-prohibidas-feedback",
    stableId: "level-palabras-prohibidas",
    levelText: "NIVEL PALABRAS MALDITAS"
  }
];

function readRole(milestoneId, screenId) {
  const milestone = manifest.milestones[milestoneId];
  assert.ok(milestone, `${milestoneId} exists in the reference manifest`);
  const relative = milestone.roles[screenId]
    .replace(/^reference-show\//, "");
  return fs.readFileSync(path.join(REFERENCE_ROOT, relative), "utf8");
}

function elementMarkup(html, id, tagName = "(?:button|div|section|span|p)") {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(
    `<(${tagName})\\b[^>]*\\bid="${escapedId}"[^>]*>[\\s\\S]*?<\\/\\1>`,
    "i"
  ))?.[0] || "";
}

test("reference show is traversable and readable by the production web server", () => {
  const rootMode = fs.statSync(REFERENCE_ROOT).mode & 0o777;
  const blobsMode = fs.statSync(path.join(REFERENCE_ROOT, "blobs")).mode & 0o777;
  assert.equal(rootMode & 0o005, 0o005, "reference root grants read/traverse to Nginx");
  assert.equal(blobsMode & 0o005, 0o005, "blob directory grants read/traverse to Nginx");
  assert.equal(
    (fs.statSync(path.join(REFERENCE_ROOT, "manifest.js")).mode & 0o004),
    0o004,
    "manifest is world-readable"
  );
});

test("reference show publishes a complete 23 by 5 journey made from inert role HTML", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.source, "isolated-match-simulator");
  assert.deepEqual(manifest.screenIds, EXPECTED_SCREENS);
  assert.deepEqual(model.SHOW_JOURNEY.map(({ id }) => id), EXPECTED_MILESTONES);
  assert.deepEqual(Object.keys(manifest.milestones), EXPECTED_MILESTONES);

  let references = 0;
  const checkedFiles = new Set();
  model.SHOW_JOURNEY.forEach(({ id: milestoneId }) => {
    const milestone = manifest.milestones[milestoneId];
    assert.ok(milestone.checkpointId, `${milestoneId} has a real simulator checkpoint`);
    assert.deepEqual(Object.keys(milestone.roles), EXPECTED_SCREENS);
    assert.deepEqual(Object.keys(milestone.sources), EXPECTED_SCREENS);
    assert.ok(milestone.context && typeof milestone.context === "object", `${milestoneId} has context metadata`);
    EXPECTED_SCREENS.forEach((screenId) => {
      references += 1;
      assert.match(
        milestone.sources[screenId],
        SOURCE_PATTERN_BY_SCREEN[screenId],
        `${milestoneId}/${screenId} identifies its real source screen`
      );
      const relative = milestone.roles[screenId].replace(/^reference-show\//, "");
      const file = path.join(REFERENCE_ROOT, relative);
      assert.equal(fs.existsSync(file), true, `${milestoneId}/${screenId} exists`);
      const html = fs.readFileSync(file, "utf8");
      assert.match(html, /data-scrib-reference-show="complete-v1"/);
      assert.match(html, /data-scrib-snapshot-frozen/);
      assert.match(
        html,
        new RegExp(`data-snapshot-screen-id="${milestone.sources[screenId]}"`),
        `${milestoneId}/${screenId} contains the declared source role`
      );
      assert.match(html, new RegExp(`<base href="${BASE_BY_SCREEN[screenId].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
      assert.doesNotMatch(html, /localhost|127\.0\.0\.1/i);
      assert.doesNotMatch(html, /<script\b|<iframe\b|\son[a-z]+\s*=/i);
      if (!checkedFiles.has(file)) {
        const expectedHash = path.basename(file, ".html");
        const actualHash = crypto.createHash("sha256").update(html).digest("hex");
        assert.equal(actualHash, expectedHash, `${relative} keeps its content hash`);
        checkedFiles.add(file);
      }
    });
  });
  assert.equal(references, 115);
});

test("reference show renders only substantial changes for each role", () => {
  const journeyIds = model.SHOW_JOURNEY.map(({ id }) => id);
  const journeyIndex = new Map(journeyIds.map((id, index) => [id, index]));
  assert.deepEqual(Object.keys(manifest.interactionChanges), EXPECTED_SCREENS);
  assert.deepEqual(manifest.interactionChanges, EXPECTED_INTERACTION_CHANGES);

  let renderableViews = 0;
  EXPECTED_SCREENS.forEach((screenId) => {
    const changes = manifest.interactionChanges[screenId];
    assert.ok(changes.length > 0, `${screenId} keeps at least one meaningful view`);
    assert.equal(new Set(changes).size, changes.length, `${screenId} has no duplicate milestones`);
    changes.forEach((milestoneId) => {
      assert.ok(journeyIndex.has(milestoneId), `${screenId}/${milestoneId} belongs to the show`);
    });
    const positions = changes.map((milestoneId) => journeyIndex.get(milestoneId));
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b), `${screenId} stays causal`);
    renderableViews += changes.length;

    let previousPath = "";
    model.SHOW_JOURNEY.forEach(({ id: milestoneId }) => {
      const currentPath = manifest.milestones[milestoneId].roles[screenId];
      if (currentPath === previousPath) {
        assert.equal(
          changes.includes(milestoneId),
          false,
          `${screenId}/${milestoneId} must not repeat an identical preceding view`
        );
      }
      previousPath = currentPath;
    });
  });
  assert.equal(renderableViews, 77);
  assert.ok(renderableViews < (model.SHOW_JOURNEY.length * EXPECTED_SCREENS.length));

  const sandbox = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(REFERENCE_ROOT, "manifest.js"), "utf8"),
    sandbox
  );
  const scriptManifest = JSON.parse(JSON.stringify(
    sandbox.window.ScribDramaturgiaReferenceShowManifest
  ));
  assert.deepEqual(scriptManifest, manifest, "JSON and browser manifests stay in sync");
});

test("every warmup trigger preserves its open and closed interaction states", () => {
  WARMUP_PAIRS.forEach(({ request, openId, closedId }) => {
    const open = manifest.milestones[openId];
    const closed = manifest.milestones[closedId];
    assert.ok(open && closed, `${request} has both warmup moments`);
    assert.equal(open.context.request, request);
    assert.equal(open.context.moment, "open");
    assert.equal(closed.context.request, request);
    assert.equal(closed.context.moment, "closed");
    assert.ok(open.seq < closed.seq, `${request} closes after its open state`);

    ["writer1", "musa1", "spectator"].forEach((screenId) => {
      assert.notEqual(
        open.roles[screenId],
        closed.roles[screenId],
        `${request}/${screenId} does not reuse the closed frame for the open state`
      );
    });

    const openWriter = readRole(openId, "writer1");
    const closedWriter = readRole(closedId, "writer1");
    const openButton = elementMarkup(openWriter, "calentamiento_bloquear_escritor", "button");
    const closedButton = elementMarkup(closedWriter, "calentamiento_bloquear_escritor", "button");
    assert.match(openButton, /CERRAR DETONADOR/i, `${request} is still actionable before closing`);
    assert.doesNotMatch(openButton, /DETONADOR CERRADO/i);
    assert.doesNotMatch(openButton, /\sdisabled(?:=""|\s|>)/i);
    assert.match(closedButton, /DETONADOR CERRADO/i, `${request} records the closed trigger`);
    assert.match(closedButton, /\sdisabled(?:=""|\s|>)/i);

    const openMuse = readRole(openId, "musa1");
    const closedMuse = readRole(closedId, "musa1");
    assert.match(openMuse, /vista-calentamiento-musa/);
    assert.doesNotMatch(openMuse, /calentamiento-bloqueado/);
    assert.match(closedMuse, /calentamiento-bloqueado|DETONADOR CERRADO/i);
  });
});

test("every competitive level freezes a numeric inspiration marker and the global clock", () => {
  COMPETITION_LEVELS.forEach(({ mode, id: milestoneId }) => {
    const milestone = manifest.milestones[milestoneId];
    assert.ok(milestone, `${milestoneId} exists`);
    assert.equal(milestone.context.moment, "competition");
    assert.equal(milestone.context.mode, mode);
    assert.ok(milestone.context.marker && typeof milestone.context.marker === "object");
    assert.ok(Number.isFinite(Number(milestone.context.marker[1])));
    assert.ok(Number.isFinite(Number(milestone.context.marker[2])));
    assert.equal(milestone.sources.writer1, "writer1");
    assert.equal(milestone.sources.musa1, "musa1");

    ["control", "writer1", "spectator"].forEach((screenId) => {
      const html = readRole(milestoneId, screenId);
      const hud = elementMarkup(html, "scrib_competition_hud", "section");
      assert.match(hud, /data-active="1"/i, `${milestoneId}/${screenId} shows the competition`);
      assert.match(hud, /data-clock="1"/i, `${milestoneId}/${screenId} shows the global clock`);
      const scoreTexts = [...hud.matchAll(/<strong\b[^>]*scrib-competition-score[^>]*>([^<]+)<\/strong>/gi)]
        .map((match) => match[1].trim());
      assert.equal(scoreTexts.length, 2);
      scoreTexts.forEach((score) => {
        assert.match(score, /^-?\d+(?:\.\d+)?$/);
        assert.doesNotMatch(score, /%/);
      });
      assert.doesNotMatch(hud, /votacion|votar/i);
    });
  });

  assert.equal(Object.keys(manifest.milestones).some((id) => id.startsWith("vote-")), false);
});

test("disadvantage levels preserve visible feedback followed by the stable level", () => {
  DISADVANTAGE_PAIRS.forEach(({ mode, feedbackId, stableId, levelText }) => {
    const feedback = manifest.milestones[feedbackId];
    const stable = manifest.milestones[stableId];
    assert.ok(feedback && stable, `${mode} has feedback and stable moments`);
    assert.equal(feedback.context.mode, mode);
    assert.equal(feedback.context.moment, "feedback");
    assert.equal(stable.context.mode, mode);
    assert.equal(stable.context.moment, "stable");
    assert.ok(feedback.seq < stable.seq, `${mode} becomes stable after its feedback`);

    const disadvantagedPlayer = Number(feedback.context.disadvantagedPlayer);
    assert.ok(disadvantagedPlayer === 1 || disadvantagedPlayer === 2);
    assert.equal(stable.context.disadvantagedPlayer, disadvantagedPlayer);
    assert.equal(feedback.sources.writer1, `writer${disadvantagedPlayer}`);
    assert.equal(stable.sources.writer1, feedback.sources.writer1);
    assert.notEqual(feedback.roles.writer1, stable.roles.writer1);

    const feedbackHtml = readRole(feedbackId, "writer1");
    const stableHtml = readRole(stableId, "writer1");
    assert.match(feedbackHtml, new RegExp(`data-snapshot-screen-id="writer${disadvantagedPlayer}"`));
    assert.match(feedbackHtml, new RegExp(levelText, "i"));
    assert.match(feedbackHtml, /class="[^"]*feedback-tiempo-float[^"]*"[^>]*>[\s\S]*?DESVENTAJA!/i);
    const feedbackFreezeRule = feedbackHtml.match(/feedback-tiempo-float[^}]*\{[^}]*\}/i)?.[0] || "";
    assert.match(feedbackFreezeRule, /animation:\s*none\s*!important/i);
    assert.match(feedbackFreezeRule, /opacity:\s*1\s*!important/i);
    assert.match(feedbackFreezeRule, /transform:\s*none\s*!important/i);
    assert.match(stableHtml, new RegExp(levelText, "i"));
    assert.match(stableHtml, /id="scrib_competition_hud"[^>]*data-active="1"/i);
    assert.doesNotMatch(stableHtml, /votacion_ventaja_modal[^>]*\bactiva\b/i);
  });
});

test("reference show contains the remaining real level and representation surfaces", () => {
  assert.match(readRole("level-letra-bendita", "musa1"), /partida-activa/);
  assert.doesNotMatch(readRole("level-letra-bendita", "musa1"), /¿PREPARADOS\?/i);
  assert.match(readRole("representation-projection", "spectator"), /teleprompter/i);
});
