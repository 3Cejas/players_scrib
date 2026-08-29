const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const tutorial = require("../game/js/domains/video-tutorial.js");

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("video tutorial timeline is contiguous and reserves the final confirmation", () => {
  assert.equal(tutorial.TIMELINE[0].start, 0);
  assert.equal(tutorial.TIMELINE.at(-1).end, 100);
  tutorial.TIMELINE.slice(1).forEach((phase, index) => {
    assert.equal(phase.start, tutorial.TIMELINE[index].end);
  });
  assert.deepEqual(
    [60, 65, 70, 75].map((second) => tutorial.phaseAt(second).id),
    ["red", "blue", "green", "white"]
  );
  assert.equal(tutorial.phaseAt(80).id, "confirm");
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
      duracion_segundos: 100,
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
    "https://scrib.test/game/media/tutorial-scrib.mp4?v=20260829a"
  );
  assert.equal(tutorial.safeVideoUrl("javascript:alert(1)", locationRef), tutorial.DEFAULT_VIDEO_URL);
  assert.equal(tutorial.safeVideoUrl("data:video/mp4;base64,AAAA", locationRef), tutorial.DEFAULT_VIDEO_URL);
  assert.equal(tutorial.progressAt(-2, 100), 0);
  assert.equal(tutorial.progressAt(50, 100), 0.5);
  assert.equal(tutorial.progressAt(120, 100), 1);
});

test("spectator and muse load the synchronized tutorial before socket handlers", () => {
  const spectator = read("game/spectator/index.html");
  const muse = read("game/public/players/index.html");
  for (const html of [spectator, muse]) {
    assert.match(html, /video-tutorial\.css\?v=20260829a/);
    assert.match(html, /domains\/video-tutorial\.js\?v=20260829a/);
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

test("spectator tutorial is clean, narrated and enters and leaves with a transition", () => {
  const css = read("game/css/video-tutorial.css");
  const js = read("game/js/domains/video-tutorial.js");

  for (const obsoleteChrome of [
    "MUSAS VERIFICADAS",
    "ACTIVAR NARRACI\\u00d3N",
    "GU\\u00cdA DE CONEXI\\u00d3N",
    "data-video-tutorial-progress",
    "data-video-tutorial-time"
  ]) {
    assert.doesNotMatch(js, new RegExp(obsoleteChrome));
  }
  assert.match(js, /data-video-tutorial-slide-url hidden/);
  assert.match(js, /position >= 8 && position < 17/);
  assert.match(js, /media\.defaultMuted = false;[\s\S]*media\.muted = false;[\s\S]*media\.volume = 1;/);
  assert.doesNotMatch(js, /mutedAttempt|soundButton/);
  assert.match(js, /root\.classList\.add\("is-visible"\)/);
  assert.match(js, /root\.classList\.add\("is-leaving"\)[\s\S]*VISIBILITY_TRANSITION_MS/);
  assert.match(css, /\.scrib-video-tutorial\.is-visible[\s\S]*opacity: 1;[\s\S]*transform: scale\(1\)/);
  assert.match(css, /\.scrib-video-tutorial__slide-url/);
});

test("generated tutorial has fixed scenes without baked timecode or progress chrome", () => {
  const renderer = read("scripts/render-tutorial-scrib-scenes.js");
  const generator = read("scripts/generate-tutorial-scrib-video.sh");

  assert.doesNotMatch(renderer, /class="timecode"|class="progress"|class="progress-labels"|VIDEOTUTORIAL DE ACCESO/);
  for (const realScreen of [
    "MUSA</span>, BIENVENIDA A",
    "Omitir tutorial",
    "¿CUÁL SERÁ TU NOMBRE?",
    "DESCUBRIR MI EQUIPO",
    "¡EQUIPO ASIGNADO!",
    "ENTRAR AL JUEGO",
    "PREPARA TU PANTALLA",
    "SÍ, FUNCIONA",
    "CONFIGURACIÓN VERIFICADA"
  ]) {
    assert.match(renderer, new RegExp(realScreen));
  }
  for (const inventedScreen of [
    "URL DE ESTA SALA",
    "Código QR ilustrativo",
    "COMPRUEBA TU PANTALLA",
    "PANTALLA LISTA",
    "REPORTADO AL SERVIDOR"
  ]) {
    assert.doesNotMatch(renderer, new RegExp(inventedScreen));
  }
  assert.match(renderer, /¡Hola! Bienvenida a Escrib\. Qué alegría tenerte aquí\./);
  assert.match(renderer, /Gracias por acompañarnos\.[\s\S]*¡Nos vemos dentro!/);
  assert.doesNotMatch(renderer, /equilibrad|equilibrio|automáticamente/i);
  for (const action of ["01-acceso", "02-omitir", "03-nombre", "04-asignacion", "05-resultado", "11-confirmacion"]) {
    assert.match(renderer, new RegExp(`key: "${action}"[^\\n]+duration: 9`));
  }
  assert.match(renderer, /scene\.narration \|\| scene\.caption/);
  assert.match(generator, /es-MX-DaliaNeural/);
  assert.match(generator, /--rate="\$\{voice_rate\}"/);
  assert.match(generator, /--pitch="\$\{voice_pitch\}"/);
  assert.match(generator, /raw \/ available > 1\.15/);
  assert.match(generator, /total_duration=.*last\.start \+ last\.duration/);
  assert.doesNotMatch(generator, /piper|zoompan=|noise=alls/);
  assert.match(generator, /scale=1920:1080:flags=lanczos,fps=30,format=yuv420p/);
  assert.match(generator, /xfade=transition=fade/);
  assert.match(generator, /2\. ACOMPAÑAR VOZ CON MELODIA\.mp3/);
  assert.match(generator, /sidechaincompress=/);
});

test("room URL has its own top-right layer and cannot cover tutorial copy", () => {
  const css = read("game/css/video-tutorial.css");
  const block = css.match(/\.scrib-video-tutorial__slide-url\s*\{([\s\S]*?)\}/)?.[1] || "";
  assert.match(block, /top:\s*4\.2%/);
  assert.match(block, /right:\s*4\.4%/);
  assert.doesNotMatch(block, /left:\s*8\.45%|top:\s*61%/);
  assert.match(block, /z-index:\s*5/);
});
