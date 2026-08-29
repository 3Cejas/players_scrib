const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const tutorial = require("../game/js/domains/video-tutorial.js");

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("the CSS tutorial timeline is contiguous and leaves enough time for every action", () => {
  assert.equal(tutorial.TIMELINE[0].start, 0);
  assert.equal(tutorial.TIMELINE.at(-1).end, 138);
  tutorial.TIMELINE.slice(1).forEach((phase, index) => {
    assert.equal(phase.start, tutorial.TIMELINE[index].end);
  });
  assert.deepEqual(
    [95, 102, 109, 116].map((second) => tutorial.phaseAt(second).id),
    ["red", "blue", "green", "white"]
  );
  assert.equal(tutorial.phaseAt(123).id, "complete");
  assert.equal(tutorial.phaseAt(131).id, "farewell");
  assert.equal(tutorial.phaseAt(999).id, "farewell");
});

test("tutorial state migrates legacy MP4 configuration to the narration track", () => {
  const state = tutorial.normalizeState({
    activo: true,
    visible: true,
    reproduciendo: true,
    session_id: "session-a",
    phase_seq: 4,
    reproduccion_seq: 7,
    posicion_segundos: 43.5,
    configuracion: {
      habilitado: true,
      silenciado: false,
      intervalo_segundos: 420,
      duracion_segundos: 138,
      video_url: "../media/tutorial-scrib.mp4"
    },
    verificacion: {
      conectadas: 4,
      verificadas: 9,
      pendientes: -5,
      nombres_verificados: ["Luna", "Luna", "Sol"]
    }
  });

  assert.equal(state.visible, true);
  assert.equal(state.positionSeconds, 43.5);
  assert.equal(state.config.intervalSeconds, 420);
  assert.equal(state.config.durationSeconds, 138);
  assert.equal(state.config.audioUrl, tutorial.DEFAULT_AUDIO_URL);
  assert.equal(state.verification.verified, 4);
  assert.equal(state.verification.pending, 0);
  assert.deepEqual(state.verification.names, ["Luna", "Sol"]);
  assert.equal(tutorial.playbackKey(state), "session-a:4:7");
});

test("tutorial accepts only safe audio URLs and versions its bundled narration", () => {
  const locationRef = { href: "https://scrib.test/game/spectator/index.html" };
  const bundled = "https://scrib.test/game/media/tutorial-scrib-audio.mp3?v=20260829c";
  assert.equal(tutorial.safeAudioUrl("../media/tutorial-scrib-audio.mp3", locationRef), bundled);
  assert.equal(tutorial.safeAudioUrl("../media/tutorial-scrib.mp4", locationRef), bundled);
  assert.equal(tutorial.safeAudioUrl("javascript:alert(1)", locationRef), tutorial.DEFAULT_AUDIO_URL);
  assert.equal(tutorial.safeAudioUrl("data:audio/mp3;base64,AAAA", locationRef), tutorial.DEFAULT_AUDIO_URL);
  assert.equal(tutorial.progressAt(-2, 138), 0);
  assert.equal(tutorial.progressAt(69, 138), 0.5);
  assert.equal(tutorial.progressAt(150, 138), 1);
});

test("spectator and muse load the synchronized CSS tutorial before socket handlers", () => {
  const spectator = read("game/spectator/index.html");
  const muse = read("game/public/players/index.html");
  for (const html of [spectator, muse]) {
    assert.match(html, /video-tutorial\.css\?v=20260829c/);
    assert.match(html, /domains\/video-tutorial\.js\?v=20260829c/);
    assert.ok(html.indexOf("js/state.js") < html.indexOf("domains/video-tutorial.js"));
    assert.ok(html.indexOf("domains/video-tutorial.js") < html.indexOf("js/socket-events.js"));
  }

  assert.match(read("game/spectator/js/socket-events.js"), /registrar_espectador[\s\S]*pedir_video_tutorial_estado/);
  assert.match(read("game/public/players/js/socket-events.js"), /if \(aplicada\)[\s\S]*pedir_video_tutorial_estado/);
});

test("spectator tutorial is live HTML and CSS, with the phone only in practical scenes", () => {
  const css = read("game/css/video-tutorial.css");
  const js = read("game/js/domains/video-tutorial.js");

  assert.match(js, /<audio class="scrib-video-tutorial__audio"/);
  assert.doesNotMatch(js, /<video\b/);
  for (const element of [
    "scrib-video-tutorial__access-card",
    "scrib-video-tutorial__phone",
    "scrib-video-tutorial__team-card--blue",
    "scrib-video-tutorial__team-card--red",
    "scrib-video-tutorial__fingerprint",
    "scrib-video-tutorial__color-stage",
    "scrib-video-tutorial__confetti"
  ]) {
    assert.match(js, new RegExp(element));
  }
  for (const scene of ["name", "choices", "manual", "automatic", "assigned"]) {
    assert.match(css, new RegExp(`data-scene="${scene}"[^\\n]+scrib-video-tutorial__phone`));
  }
  assert.doesNotMatch(css, /data-scene="(?:welcome|access|access-wait|ready|red|blue|green|white)"[^\n]+scrib-video-tutorial__phone/);
  assert.match(css, /@keyframes vtPhoneIn/);
  assert.match(css, /@keyframes vtFingerProgress/);
  assert.match(css, /@keyframes vtColorArrive/);
  assert.match(css, /@keyframes vtConfetti/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("tutorial explains direct choice and automatic assignment using the real muse controls", () => {
  const js = read("game/js/domains/video-tutorial.js");
  const manifest = JSON.parse(read("scripts/tutorial-scrib-narration.json"));
  const narration = manifest.map(({ text }) => text).join(" ");

  assert.match(js, /ELIGE TU ESCRITXR/);
  assert.match(js, /EQUIPO AZUL/);
  assert.match(js, /EQUIPO ROJO/);
  assert.match(js, /DETECCIÓN AUTOMÁTICA/);
  assert.match(js, /MANTÉN EL DEDO/);
  assert.match(narration, /puedes tocar directamente/i);
  assert.match(narration, /detección automática/i);
  assert.doesNotMatch(narration, /equilibr/i);
  assert.doesNotMatch(js, /SÍ, FUNCIONA|device__confirm|data-video-tutorial-time|data-video-tutorial-progress/);
});

test("narration manifest, generated MP3 and CSS timeline stay synchronized", () => {
  const manifest = JSON.parse(read("scripts/tutorial-scrib-narration.json"));
  const generator = read("scripts/generate-tutorial-scrib-audio.sh");
  const audioPath = path.join(ROOT, "game/media/tutorial-scrib-audio.mp3");

  assert.equal(manifest.length, tutorial.TIMELINE.length);
  manifest.forEach((scene, index) => {
    assert.equal(scene.start, tutorial.TIMELINE[index].start);
    assert.equal(scene.start + scene.duration, tutorial.TIMELINE[index].end);
  });
  assert.ok(fs.statSync(audioPath).size > 100_000);
  assert.match(generator, /es-MX-DaliaNeural/);
  assert.match(generator, /2\. ACOMPAÑAR VOZ CON MELODIA\.mp3/);
  assert.match(generator, /sidechaincompress=/);
  assert.match(generator, /tutorial-scrib-audio\.mp3/);
  assert.doesNotMatch(generator, /\.mp4|xfade=|scale=1920:1080/);
});

test("mobile calibration changes through four solid colors and verifies automatically", () => {
  const css = read("game/css/video-tutorial.css");
  const js = read("game/js/domains/video-tutorial.js");

  for (const phase of ["red", "blue", "green", "white"]) {
    assert.match(css, new RegExp(`data-phase="${phase}"`));
  }
  assert.match(js, /video_tutorial_verificar/);
  assert.match(js, /\["complete", "farewell"\]\.includes/);
  assert.match(js, /session_id:[\s\S]*phase_seq:[\s\S]*reproduccion_seq:/);
  assert.match(js, /root\.classList\.add\("is-visible"\)/);
  assert.match(js, /root\.classList\.add\("is-leaving"\)[\s\S]*VISIBILITY_TRANSITION_MS/);
});
