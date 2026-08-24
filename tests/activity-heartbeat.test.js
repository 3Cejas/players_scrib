const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const heartbeat = require("../game/js/activity-heartbeat.js");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function locationFor(hostname, pathname, search = "", protocol = "https:") {
  return { hostname, pathname, search, protocol };
}

function createHarness({ hostname = heartbeat.GATEWAY_HOST, beaconResult = true } = {}) {
  const listeners = new Map();
  const intervals = new Map();
  const cleared = [];
  const beaconCalls = [];
  const fetchCalls = [];
  let nextIntervalId = 1;

  const document = {
    visibilityState: "visible",
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    }
  };

  const globalObject = {
    document,
    location: locationFor(hostname, "/sutura/scrib/game/control/index.html", "?room=1"),
    navigator: {
      sendBeacon(url) {
        beaconCalls.push(url);
        return beaconResult;
      }
    },
    fetch(url, options) {
      fetchCalls.push({ url, options });
      return Promise.resolve();
    },
    setInterval(callback, ms) {
      const id = nextIntervalId++;
      intervals.set(id, { callback, ms });
      return id;
    },
    clearInterval(id) {
      cleared.push(id);
      intervals.delete(id);
    }
  };

  return {
    globalObject,
    document,
    listeners,
    intervals,
    cleared,
    beaconCalls,
    fetchCalls
  };
}

test("activity endpoint follows the gateway contract on both production hosts", () => {
  assert.deepEqual(
    heartbeat.resolveActivityTarget(locationFor(
      "sutura-gateway.ddns.net",
      "/sutura/scrib/game/spectator/index.html",
      "?sala=principal"
    )),
    {
      url: "/_activity?visible=1&path=%2Fsutura%2Fscrib%2Fgame%2Fspectator%2Findex.html%3Fsala%3Dprincipal",
      path: "/sutura/scrib/game/spectator/index.html?sala=principal",
      crossOrigin: false
    }
  );

  assert.deepEqual(
    heartbeat.resolveActivityTarget(locationFor(
      "sutura.ddns.net",
      "/scrib/game/public/players/index.html",
      "?player=1"
    )),
    {
      url: "https://sutura-gateway.ddns.net/_activity?visible=1&path=%2Fsutura%2Fscrib%2Fgame%2Fpublic%2Fplayers%2Findex.html%3Fplayer%3D1",
      path: "/sutura/scrib/game/public/players/index.html?player=1",
      crossOrigin: true
    }
  );

  assert.equal(
    heartbeat.canonicalActivityPath(locationFor("sutura.ddns.net", "/sutura/scrib/game/", "")),
    "/sutura/scrib/game/",
    "an already canonical gateway path is not prefixed twice"
  );
  assert.equal(
    heartbeat.canonicalActivityPath(locationFor(
      "sutura.ddns.net",
      "/web/scrib/public/players/index.html",
      "?player=2"
    )),
    "/sutura/web/scrib/public/players/index.html?player=2",
    "the direct production route is canonicalized into the gateway world"
  );
  assert.equal(
    heartbeat.canonicalActivityPath(locationFor(
      "sutura-gateway.ddns.net",
      "/sutura/web/scrib/control/",
      ""
    )),
    "/sutura/web/scrib/control/",
    "the gateway production route remains unchanged"
  );
});

test("activity heartbeat pauses while hidden and resumes immediately when visible", () => {
  const harness = createHarness();
  const controller = heartbeat.createController(harness.globalObject);

  assert.equal(controller.start(), true);
  assert.equal(harness.beaconCalls.length, 1, "visible start sends immediately");
  assert.equal(harness.intervals.size, 1);
  assert.equal([...harness.intervals.values()][0].ms, 45000);

  const firstTick = [...harness.intervals.values()][0].callback;
  firstTick();
  assert.equal(harness.beaconCalls.length, 2);

  harness.document.visibilityState = "hidden";
  harness.listeners.get("visibilitychange")();
  assert.equal(harness.intervals.size, 0, "hidden documents do not retain a timer");
  firstTick();
  assert.equal(harness.beaconCalls.length, 2, "even a stale timer cannot send while hidden");

  harness.document.visibilityState = "visible";
  harness.listeners.get("visibilitychange")();
  assert.equal(harness.beaconCalls.length, 3, "returning to the page sends immediately");
  assert.equal(harness.intervals.size, 1);

  controller.stop();
  assert.equal(harness.intervals.size, 0);
  assert.equal(harness.listeners.has("visibilitychange"), false);
});

test("an initially hidden page waits for a visible state before starting its timer", () => {
  const harness = createHarness();
  harness.document.visibilityState = "hidden";
  const controller = heartbeat.createController(harness.globalObject);

  controller.start();
  assert.equal(harness.beaconCalls.length, 0);
  assert.equal(harness.fetchCalls.length, 0);
  assert.equal(harness.intervals.size, 0);

  harness.document.visibilityState = "visible";
  harness.listeners.get("visibilitychange")();
  assert.equal(harness.beaconCalls.length, 1);
  assert.equal(harness.intervals.size, 1);
});

test("cross-origin fallback uses a bodyless no-cors POST with keepalive", () => {
  const harness = createHarness({ hostname: heartbeat.DIRECT_HOST, beaconResult: false });
  harness.globalObject.location = locationFor(
    heartbeat.DIRECT_HOST,
    "/scrib/game/control/index.html",
    ""
  );
  const controller = heartbeat.createController(harness.globalObject);

  controller.start();

  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(
    harness.fetchCalls[0].url,
    "https://sutura-gateway.ddns.net/_activity?visible=1&path=%2Fsutura%2Fscrib%2Fgame%2Fcontrol%2Findex.html"
  );
  assert.deepEqual(harness.fetchCalls[0].options, {
    method: "POST",
    cache: "no-store",
    keepalive: true,
    credentials: "include",
    mode: "no-cors"
  });
});

test("file, development and duplicate gateway injection do not start network activity", () => {
  for (const location of [
    locationFor("", "/tmp/scrib/game/index.html", "", "file:"),
    locationFor("localhost", "/game/index.html", "", "http:"),
    locationFor("example.test", "/scrib/game/index.html")
  ]) {
    assert.equal(heartbeat.resolveActivityTarget(location), null);
  }

  const fileHarness = createHarness();
  fileHarness.globalObject.location = locationFor("", "/tmp/scrib/game/index.html", "", "file:");
  assert.equal(heartbeat.install(fileHarness.globalObject), null);
  assert.equal(fileHarness.beaconCalls.length, 0);
  assert.equal(fileHarness.fetchCalls.length, 0);
  assert.equal(fileHarness.listeners.size, 0);

  const injectedHarness = createHarness();
  injectedHarness.globalObject.__suturaActivityPing = true;
  assert.equal(heartbeat.install(injectedHarness.globalObject), null);
  assert.equal(injectedHarness.beaconCalls.length, 0);
  assert.equal(injectedHarness.intervals.size, 0);
});

test("all real SCRIB screens load one shared cache-busted heartbeat", () => {
  const config = read("game/config.js");
  assert.match(config, /activity-heartbeat\.js\?v=20260824a/);
  assert.match(config, /document\.createElement\("script"\)/);

  const multiplayerPages = [
    "game/index.html",
    "game/actors/index.html",
    "game/actors/source/index.html",
    "game/bolzano/index.html",
    "game/bolzano/musa.html",
    "game/control/index.html",
    "game/dramaturgia/index.html",
    "game/jurado/index.html",
    "game/players/index.html",
    "game/public/index.html",
    "game/public/players/index.html",
    "game/spectator/index.html"
  ];
  for (const page of multiplayerPages) {
    assert.match(read(page), /config\.js\?v=20260824a/, `${page} must refresh the shared loader`);
  }

  const standalonePages = {
    "index.html": "./game/js/activity-heartbeat.js?v=20260824a",
    "1p_scrib/index.html": "../game/js/activity-heartbeat.js?v=20260824a",
    "1p_scrib/game/index.html": "../../game/js/activity-heartbeat.js?v=20260824a",
    "game/repentizados-demo.html": "./js/activity-heartbeat.js?v=20260824a",
    "game/s7/index.html": "../js/activity-heartbeat.js?v=20260824a"
  };
  for (const [page, asset] of Object.entries(standalonePages)) {
    assert.ok(read(page).includes(asset), `${page} must load ${asset}`);
  }
});
