const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const tutorial = require("../game/js/domains/video-tutorial.js");

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("video tutorial timeline is contiguous and reserves the final confirmation", () => {
  assert.equal(tutorial.TIMELINE[0].start, 0);
  assert.equal(tutorial.TIMELINE.at(-1).end, 60);
  tutorial.TIMELINE.slice(1).forEach((phase, index) => {
    assert.equal(phase.start, tutorial.TIMELINE[index].end);
  });
  assert.deepEqual(
    [34, 38, 42, 46].map((second) => tutorial.phaseAt(second).id),
    ["red", "blue", "green", "white"]
  );
  assert.equal(tutorial.phaseAt(50).id, "confirm");
  assert.equal(tutorial.phaseAt(999).id, "confirm");
});

test("video tutorial normalizes authoritative playback and verification state", () => {
  const state = tutorial.normalizeState({
    activo: true,
    visible: true,
    reproduciendo: true,
    session_id: "session-a",
    phase_seq: 4,
    reproduccion_seq: 7,
    inicio_ts: 1000,
    posicion_segundos: 37.5,
    configuracion: {
      habilitado: true,
      silenciado: false,
      intervalo_segundos: 420,
      duracion_segundos: 60,
      video_url: "../media/tutorial-scrib.mp4"
    },
    verificacion: {
      conectadas: 4,
      verificadas: 9,
      pendientes: -5,
      nombres_verificados: ["Luna", "Luna", "Sol"]
    }
  }, 2000);

  assert.equal(state.visible, true);
  assert.equal(state.positionSeconds, 37.5);
  assert.equal(state.config.intervalSeconds, 420);
  assert.equal(state.verification.connected, 4);
  assert.equal(state.verification.verified, 4);
  assert.equal(state.verification.pending, 0);
  assert.deepEqual(state.verification.names, ["Luna", "Sol"]);
  assert.equal(tutorial.playbackKey(state), "session-a:4:7");
});

test("video tutorial rejects executable media URLs and clamps progress", () => {
  const locationRef = { href: "https://scrib.test/game/spectator/index.html" };
  assert.equal(
    tutorial.safeVideoUrl("../media/tutorial-scrib.mp4", locationRef),
    "https://scrib.test/game/media/tutorial-scrib.mp4"
  );
  assert.equal(tutorial.safeVideoUrl("javascript:alert(1)", locationRef), tutorial.DEFAULT_VIDEO_URL);
  assert.equal(tutorial.safeVideoUrl("data:video/mp4;base64,AAAA", locationRef), tutorial.DEFAULT_VIDEO_URL);
  assert.equal(tutorial.progressAt(-2, 60), 0);
  assert.equal(tutorial.progressAt(30, 60), 0.5);
  assert.equal(tutorial.progressAt(90, 60), 1);
});

test("spectator and muse load the synchronized tutorial before socket handlers", () => {
  const spectator = read("game/spectator/index.html");
  const muse = read("game/public/players/index.html");
  for (const html of [spectator, muse]) {
    assert.match(html, /video-tutorial\.css\?v=20260824d/);
    assert.match(html, /domains\/video-tutorial\.js\?v=20260824d/);
    assert.ok(html.indexOf("js/state.js") < html.indexOf("domains/video-tutorial.js"));
    assert.ok(html.indexOf("domains/video-tutorial.js") < html.indexOf("js/socket-events.js"));
  }

  const spectatorEvents = read("game/spectator/js/socket-events.js");
  const museEvents = read("game/public/players/js/socket-events.js");
  assert.match(spectatorEvents, /registrar_espectador[\s\S]*pedir_video_tutorial_estado/);
  assert.match(museEvents, /if \(aplicada\)[\s\S]*pedir_video_tutorial_estado/);
});

test("mobile calibration has four solid colors, confirmation and reduced-motion support", () => {
  const css = read("game/css/video-tutorial.css");
  const js = read("game/js/domains/video-tutorial.js");

  for (const phase of ["red", "blue", "green", "white"]) {
    assert.match(css, new RegExp(`data-phase="${phase}"`));
  }
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(js, /video_tutorial_verificar/);
  assert.match(js, /S\\u00cd, FUNCIONA/);
  assert.match(js, /session_id:[\s\S]*phase_seq:[\s\S]*reproduccion_seq:/);
});
