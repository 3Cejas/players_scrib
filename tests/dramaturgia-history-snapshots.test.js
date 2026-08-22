const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const history = require("../game/dramaturgia/js/history-snapshots.js");
const HISTORY_SNAPSHOTS_SOURCE = fs.readFileSync(
  path.join(__dirname, "../game/dramaturgia/js/history-snapshots.js"),
  "utf8"
);

function checkpoint(id, sessionId, seq, eventId, roles = {}) {
  return {
    id,
    sessionId,
    seq,
    ts: 1_000 + seq,
    eventIds: [eventId],
    roles
  };
}

test("history snapshots exports screen IDs in the canonical monitor order", () => {
  assert.deepEqual(history.SCREEN_IDS, [
    "control",
    "spectator",
    "jury",
    "writer1",
    "musa1",
    "actor1",
    "writer2",
    "musa2",
    "actor2"
  ]);
  assert.ok(Object.isFrozen(history.SCREEN_IDS));
});

test("journal events form a stable causal checkpoint without mutating the source lookup", () => {
  const previous = new Map([
    ["older-event", "checkpoint:old"],
    ["other-event", { id: "checkpoint:other" }]
  ]);
  const source = [
    { id: "event-3", seq: 3, ts: 1_300, causa_ids: ["event-2", "older-event"] },
    { id: "event-1", seq: 1, ts: 1_100, causa_ids: [] },
    { id: "event-2", seq: 2, ts: 1_200, cause_ids: ["event-1", "other-event"] }
  ];

  const grouped = history.groupEventsIntoCheckpoint(source, "session-a", previous);
  const groupedAgain = history.groupEventsIntoCheckpoint(source, "session-a", previous);

  assert.deepEqual(grouped.events.map((event) => event.id), ["event-1", "event-2", "event-3"]);
  assert.deepEqual(grouped.eventIds, ["event-1", "event-2", "event-3"]);
  assert.equal(grouped.seqStart, 1);
  assert.equal(grouped.seqEnd, 3);
  assert.equal(grouped.primaryEventId, "event-3");
  assert.deepEqual(grouped.causeEventIds, ["event-1", "other-event", "event-2", "older-event"]);
  assert.deepEqual(grouped.previousCheckpointIds, ["checkpoint:other", "checkpoint:old"]);
  assert.equal(grouped.id, groupedAgain.id);
  assert.equal(previous.size, 2);
  assert.equal(source[0].id, "event-3");
});

test("working history store indexes events, updates duplicates and stays bounded", () => {
  const store = history.createHistoryStore({ maxCheckpoints: 2 });
  store.putCheckpoint(checkpoint("cp-2", "session-a", 2, "event-2"));
  store.putCheckpoint(checkpoint("cp-1", "session-a", 1, "event-1"));

  assert.deepEqual(store.listCheckpoints("session-a").map((item) => item.id), ["cp-1", "cp-2"]);
  assert.equal(store.checkpointForEvent("event-2"), "cp-2");

  store.putCheckpoint(checkpoint("cp-2", "session-a", 2, "event-2b"));
  assert.equal(store.size, 2);
  assert.equal(store.checkpointForEvent("event-2"), "");
  assert.equal(store.checkpointForEvent("event-2b"), "cp-2");

  store.addCheckpoint(checkpoint("cp-3", "session-a", 3, "event-3"));
  assert.deepEqual(store.listCheckpoints("session-a").map((item) => item.id), ["cp-2", "cp-3"]);
  assert.equal(store.getCheckpoint("cp-1"), null);
  assert.equal(store.clearSession("session-a"), 2);
  assert.equal(store.size, 0);
});

test("snapshot hash is the standard lowercase SHA-256 digest", async () => {
  const value = "<SCRI> B · archivo visual 🎭";
  const expected = crypto.createHash("sha256").update(value).digest("hex");
  assert.equal(await history.hashSnapshot(value), expected);
  assert.equal((await history.hashSnapshot(value)).length, 64);
});

test("snapshot hash keeps SHA-256 semantics without WebCrypto or Node require", async () => {
  const filename = path.join(__dirname, "../game/dramaturgia/js/history-snapshots.js");
  const source = fs.readFileSync(filename, "utf8");
  const isolatedBrowser = {};
  vm.createContext(isolatedBrowser);
  vm.runInContext(source, isolatedBrowser, { filename });
  const value = "fallback puro · ñ 🎭";
  const expected = crypto.createHash("sha256").update(value).digest("hex");

  assert.equal(
    await isolatedBrowser.ScribDramaturgiaHistorySnapshots.hashSnapshot(value),
    expected
  );
});

test("archive falls back to volatile memory with the complete async contract", async () => {
  const archive = await history.openArchive({
    name: "test-history",
    indexedDB: null,
    maxBytes: 10_000,
    maxCheckpoints: 2
  });
  assert.equal(archive.kind, "memory");
  assert.equal(archive.persistent, false);

  await archive.putBlob("hash-1", "<!doctype html><p>one</p>", { screenId: "control", capturedAt: 11 });
  await archive.putCheckpoint(checkpoint("cp-1", "session-a", 1, "event-1", { control: "hash-1" }));
  const blob = await archive.getBlob("hash-1");
  assert.equal(blob.html, "<!doctype html><p>one</p>");
  assert.equal(blob.meta.screenId, "control");
  assert.ok(blob.size > 0);

  await archive.putBlob("hash-2", "<p>two</p>", { screenId: "writer1" });
  await archive.putCheckpoint(checkpoint("cp-2", "session-a", 2, "event-2", { writer1: "hash-2" }));
  await archive.putBlob("hash-3", "<p>three</p>", { screenId: "spectator" });
  await archive.putCheckpoint(checkpoint("cp-3", "session-a", 3, "event-3", { spectator: "hash-3" }));

  assert.deepEqual(
    (await archive.listCheckpoints("session-a")).map((item) => item.id),
    ["cp-2", "cp-3"]
  );
  assert.equal(await archive.getBlob("hash-1"), null, "prune removes the unreferenced oldest blob");
  assert.equal((await archive.getCheckpoint("cp-3")).roles.spectator, "hash-3");

  assert.equal(await archive.clearSession("session-a"), 2);
  assert.deepEqual(await archive.listCheckpoints("session-a"), []);
  assert.equal(await archive.getBlob("hash-2"), null);
  archive.close();
});

test("serializeDocument fails clearly outside a browser DOM", () => {
  assert.throws(
    () => history.serializeDocument(null, {}),
    /requires a browser Document/
  );
});

test("snapshot freeze keeps transient floating feedback visible without animation", () => {
  const feedbackFreezeRule = HISTORY_SNAPSHOTS_SOURCE
    .match(/feedback-tiempo-float[^}]*\{[^}]*\}/i)?.[0] || "";
  assert.match(feedbackFreezeRule, /animation:\s*none\s*!important/i);
  assert.match(feedbackFreezeRule, /opacity:\s*1\s*!important/i);
  assert.match(feedbackFreezeRule, /transform:\s*none\s*!important/i);
});
