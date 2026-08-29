const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const ROOT = path.resolve(__dirname, "..");
const tutorial = require("../game/js/domains/video-tutorial.js");

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function rasterStats(relativePath) {
  const png = PNG.sync.read(fs.readFileSync(path.join(ROOT, relativePath)));
  let opaque = 0;
  let dark = 0;
  let light = 0;
  for (let offset = 0; offset < png.data.length; offset += 4) {
    const alpha = png.data[offset + 3];
    if (alpha < 128) continue;
    opaque += 1;
    const luminance = (png.data[offset] + png.data[offset + 1] + png.data[offset + 2]) / 3;
    if (luminance < 64) dark += 1;
    if (luminance > 220) light += 1;
  }
  return { width: png.width, height: png.height, opaque, dark, light };
}

test("the CSS tutorial timeline is contiguous and leaves enough time for every action", () => {
  assert.equal(tutorial.TIMELINE[0].start, 0);
  assert.equal(tutorial.TIMELINE.at(-1).end, 153);
  tutorial.TIMELINE.slice(1).forEach((phase, index) => {
    assert.equal(phase.start, tutorial.TIMELINE[index].end);
  });
  assert.deepEqual(
    [110.42, 117.42, 124.42, 131.42].map((second) => tutorial.phaseAt(second).id),
    ["red", "blue", "green", "white"]
  );
  assert.equal(tutorial.phaseAt(138.28).id, "complete");
  assert.equal(tutorial.phaseAt(146.24).id, "farewell");
  assert.equal(tutorial.TIMELINE.find(({ id }) => id === "access").end, 37.38);
  assert.equal(tutorial.TIMELINE.find(({ id }) => id === "access-wait").end, 47.32);
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
      duracion_segundos: 153,
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
  assert.equal(state.config.durationSeconds, 153);
  assert.equal(state.config.audioUrl, tutorial.DEFAULT_AUDIO_URL);
  assert.equal(state.verification.verified, 4);
  assert.equal(state.verification.pending, 0);
  assert.deepEqual(state.verification.names, ["Luna", "Sol"]);
  assert.equal(tutorial.playbackKey(state), "session-a:4:7");
});

test("tutorial accepts only safe audio URLs and versions its bundled narration", () => {
  const locationRef = { href: "https://scrib.test/game/spectator/index.html" };
  const bundled = "https://scrib.test/game/media/tutorial-scrib-audio.mp3?v=20260829q";
  assert.equal(tutorial.safeAudioUrl("../media/tutorial-scrib-audio.mp3", locationRef), bundled);
  assert.equal(tutorial.safeAudioUrl("../media/tutorial-scrib.mp4", locationRef), bundled);
  assert.equal(tutorial.safeAudioUrl("javascript:alert(1)", locationRef), tutorial.DEFAULT_AUDIO_URL);
  assert.equal(tutorial.safeAudioUrl("data:audio/mp3;base64,AAAA", locationRef), tutorial.DEFAULT_AUDIO_URL);
  assert.equal(tutorial.progressAt(-2, 153), 0);
  assert.equal(tutorial.progressAt(76.5, 153), 0.5);
  assert.equal(tutorial.progressAt(160, 153), 1);
});

test("spectator and muse load the synchronized CSS tutorial before socket handlers", () => {
  const spectator = read("game/spectator/index.html");
  const muse = read("game/public/players/index.html");
  for (const html of [spectator, muse]) {
    assert.match(html, /video-tutorial\.css\?v=20260829r/);
    assert.match(html, /domains\/video-tutorial\.js\?v=20260829r/);
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
    "scrib-video-tutorial__welcome-qr",
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

test("spectator tutorial fills the viewport and adds readable synchronized subtitles", () => {
  const css = read("game/css/video-tutorial.css");
  const js = read("game/js/domains/video-tutorial.js");
  const spectatorMarkup = js.match(/function createSpectatorOverlay[\s\S]*?function createMuseOverlay/)?.[0] || "";
  const brandMarkup = spectatorMarkup.match(/<header class="scrib-video-tutorial__brand"[\s\S]*?<\/header>/)?.[0] || "";

  assert.match(css, /\.scrib-video-tutorial,[\s\S]*width:\s*100vw;[\s\S]*height:\s*100dvh;/);
  assert.match(css, /\.scrib-video-tutorial__scene\s*\{[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;/);
  assert.doesNotMatch(spectatorMarkup, /data-video-tutorial-kicker|data-video-tutorial-copy|data-video-color-copy/);
  assert.match(spectatorMarkup, /scrib-video-tutorial__subtitles" aria-hidden="true"/);
  assert.match(spectatorMarkup, /data-video-tutorial-subtitle/);
  assert.match(js, /subtitle\.textContent = phase\.subtitle \|\| phase\.copy/);
  assert.doesNotMatch(js, /subtitle\.innerHTML/);
  assert.match(css, /\.scrib-video-tutorial__subtitles\s*\{[\s\S]*?inset:\s*0;[\s\S]*?pointer-events:\s*none/);
  assert.match(css, /\.scrib-video-tutorial__subtitles p\s*\{[\s\S]*?bottom:[\s\S]*?background:\s*rgba\(0, 4, 10, 0\.88\)/);
  assert.match(css, /\.scrib-video-tutorial \.scrib-visually-hidden,[\s\S]*clip-path:\s*inset\(50%\)/);
  assert.match(css, /@keyframes vtSubtitleIn/);
  assert.doesNotMatch(js, /\bPASO\s+\d|COLOR\s+\d\s+DE\s+4/);
  assert.match(brandMarkup, /scrib-video-tutorial__brand-mark/);
  assert.match(spectatorMarkup, /<div class="scrib-video-tutorial__welcome-qr"><\/div>/);
  assert.doesNotMatch(spectatorMarkup, /<span class="scrib-video-tutorial__welcome-qr"/);
  assert.match(css, /scrib-video-tutorial__brand-mark[\s\S]*scrib-logo-mark\.png\?v=20260829r/);
  assert.match(css, /scrib-video-tutorial__welcome-qr[\s\S]*scribshow-musa-qr\.png\?v=20260829r/);
  assert.match(css, /scrib-video-tutorial__brand-mark[\s\S]*mix-blend-mode:\s*normal/);
  assert.match(css, /scrib-video-tutorial__welcome-qr[\s\S]*mix-blend-mode:\s*normal/);
  assert.doesNotMatch(brandMarkup, /<b>|MUSA/);
  assert.doesNotMatch(brandMarkup, /<span>&lt;SCRI&gt; B<\/span>/);
  assert.doesNotMatch(spectatorMarkup, /SCRIB · MUSA|conectarse a SCRIB/);
});

test("spectator logo and QR raster assets contain visible pixels", () => {
  const logo = rasterStats("game/media/scrib-logo-mark.png");
  const qr = rasterStats("game/media/scribshow-musa-qr.png");

  assert.deepEqual([logo.width, logo.height], [500, 500]);
  assert.ok(logo.opaque > 10_000, "the SCRI mark must not be an empty transparent image");
  assert.ok(logo.light > 10_000, "the SCRI mark must contain its white artwork");
  assert.deepEqual([qr.width, qr.height], [1024, 1024]);
  assert.ok(qr.dark > 100_000, "the QR must contain dark modules");
  assert.ok(qr.light > 100_000, "the QR must retain its light modules and quiet zone");
});

test("the spectator CRT texture covers every view without blocking interaction", () => {
  const html = read("game/spectator/index.html");
  const css = read("game/css/dashboard-players.css");
  const block = css.match(/\.spectator-crt-overlay\s*\{([\s\S]*?)\}/)?.[1] || "";

  assert.match(html, /<div class="spectator-crt-overlay" aria-hidden="true"><i><\/i><\/div>/);
  assert.match(block, /position:\s*fixed/);
  assert.match(block, /inset:\s*0/);
  assert.match(block, /pointer-events:\s*none/);
  assert.match(css, /\.spectator-crt-overlay::before[\s\S]*repeating-linear-gradient/);
  assert.match(css, /\.spectator-crt-overlay::after[\s\S]*repeating-linear-gradient/);
  assert.match(css, /@keyframes spectatorCrtScan/);
  assert.match(css, /@keyframes spectatorCrtFlicker/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.spectator-crt-overlay/);
});

test("tutorial explains direct choice and automatic assignment using the real muse controls", () => {
  const js = read("game/js/domains/video-tutorial.js");
  const manifest = JSON.parse(read("scripts/tutorial-scrib-narration.json"));
  const narration = manifest.map(({ text }) => text).join(" ");

  assert.match(js, /ELIGE TU ESCRITXR/);
  assert.doesNotMatch(js, /EQUIPO AZUL|EQUIPO ROJO/);
  assert.match(js, /DETECCIÓN AUTOMÁTICA/);
  assert.match(js, /MANTÉN EL DEDO/);
  assert.match(narration, /puedes tocar directamente/i);
  assert.match(narration, /detección automática/i);
  assert.match(narration, /Bienvenida a Escribe\./);
  assert.match(narration, /Escribe show punto es, barra musa/);
  assert.match(js, /Bienvenida a <SCRI> B\./);
  assert.match(js, /abre scribshow\.es\/musa o escanea/);
  assert.doesNotMatch(narration, /equilibr/i);
  assert.doesNotMatch(js, /SÍ, FUNCIONA|TODO FUNCIONA|Tu dispositivo está conectado|device__confirm|data-video-tutorial-time|data-video-tutorial-progress/);
});

test("narration manifest, generated MP3 and CSS timeline stay synchronized", () => {
  const manifest = JSON.parse(read("scripts/tutorial-scrib-narration.json"));
  const generator = read("scripts/generate-tutorial-scrib-audio.sh");
  const audioPath = path.join(ROOT, "game/media/tutorial-scrib-audio.mp3");

  assert.equal(manifest.length, tutorial.TIMELINE.length);
  manifest.forEach((scene, index) => {
    const expectedStart = index === 0 ? 0 : scene.start + (scene.leadMs / 1000);
    const nextScene = manifest[index + 1];
    const expectedEnd = nextScene
      ? nextScene.start + (nextScene.leadMs / 1000)
      : scene.start + scene.duration;
    assert.equal(tutorial.TIMELINE[index].start, expectedStart);
    assert.equal(tutorial.TIMELINE[index].end, expectedEnd);
    assert.equal(scene.subtitle || scene.text, tutorial.TIMELINE[index].subtitle);
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
  assert.match(js, /scrib:video-tutorial-visibility/);
  assert.match(js, /scrib-video-tutorial-device__share[\s\S]*scribshow-musa-qr\.png\?v=20260829q[\s\S]*scrib-video-tutorial-device__url[\s\S]*scribshow\.es\/musa/);
  assert.doesNotMatch(js, /<a[^>]+scribshow\.es\/musa/);
  assert.match(css, /scrib-video-tutorial-device__share/);
  assert.match(css, /scrib-video-tutorial-device__url[\s\S]*text-decoration:\s*underline/);
  assert.match(css, /scrib-video-tutorial-device__phase-visual/);
  assert.match(css, /is-phase-entering[\s\S]*vtDeviceCardIn/);
  assert.match(css, /\.scrib-video-tutorial \*,[\s\S]*\.scrib-video-tutorial-device \*::after[\s\S]*box-sizing:\s*border-box/);
  assert.match(css, /data-phase="access"[^\n]+scrib-video-tutorial-device__share/);
  assert.match(css, /scrib-video-tutorial-device__share\s*\{\s*display:\s*none/);
  assert.match(css, /@keyframes vtDeviceColorSweep/);
  assert.match(css, /@keyframes vtDeviceColorNameGlow/);
});
