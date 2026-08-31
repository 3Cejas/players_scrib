const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function crearElemento(id, valor = "") {
  const listeners = new Map();
  return {
    id,
    value: valor,
    textContent: "",
    disabled: false,
    dataset: {},
    attributes: {},
    customValidity: "",
    addEventListener(tipo, listener) {
      listeners.set(tipo, listener);
    },
    setAttribute(nombre, contenido) {
      this.attributes[nombre] = String(contenido);
    },
    setCustomValidity(mensaje) {
      this.customValidity = String(mensaje);
    },
    reportValidity() {
      this.reportedValidity = true;
    },
    dispatch(tipo, extra = {}) {
      const listener = listeners.get(tipo);
      if (!listener) return;
      listener({ preventDefault() {}, target: this, ...extra });
    }
  };
}

function crearHarness() {
  const ids = [
    "videotutorial_control",
    "videotutorial_config_form",
    "videotutorial_intervalo",
    "videotutorial_habilitado",
    "videotutorial_intervalo_menos",
    "videotutorial_intervalo_mas",
    "videotutorial_reproduccion_toggle",
    "videotutorial_estado",
    "videotutorial_estado_texto"
  ];
  const elementos = new Map(ids.map((id) => [id, crearElemento(
    id,
    id === "videotutorial_intervalo" ? "3" : ""
  )]));
  elementos.forEach((elemento) => {
    const clases = new Set();
    elemento.classList = {
      toggle(clase, activa) {
        if (activa) clases.add(clase);
        else clases.delete(clase);
      },
      contains(clase) { return clases.has(clase); }
    };
  });
  const emisiones = [];
  const timers = new Map();
  let timerId = 0;
  const socket = {
    connected: true,
    emit(evento, payload, ack) {
      emisiones.push({ evento, payload, ack });
    }
  };
  const document = {
    readyState: "complete",
    activeElement: null,
    getElementById(id) {
      return elementos.get(id) || null;
    },
    addEventListener() {}
  };
  const window = {
    document,
    setTimeout(callback) {
      timerId += 1;
      timers.set(timerId, callback);
      return timerId;
    },
    clearTimeout(id) {
      timers.delete(id);
    }
  };
  vm.runInNewContext(read("game/control/js/videotutorial-control.js"), {
    window,
    document,
    socket,
    Intl,
    Date,
    console
  }, { filename: "game/control/js/videotutorial-control.js" });
  return { api: window.ScribVideotutorialControl, elementos, emisiones, timers };
}

test("video tutorial state follows the definitive singular server contract", () => {
  const { api } = crearHarness();
  const state = api.normalizarEstado({
    reproduciendo: true,
    visible: true,
    inicio_ts: 1000,
    fin_ts: 61000,
    posicion_segundos: 4.5,
    proxima_reproduccion_ts: 90000,
    configuracion: {
      video_url: "/media/tutorial.mp3",
      intervalo_segundos: 420,
      duracion_segundos: 60,
      habilitado: true,
      silenciado: true
    },
    verificacion: { conectadas: 4, verificadas: 3 }
  });

  assert.deepEqual({ ...state }, {
    sincronizado: true,
    intervaloSegundos: 420,
    faseActiva: true,
    sessionId: "",
    phaseSeq: 0,
    reproduccionSeq: 0,
    programado: true,
    visible: true,
    reproduciendo: true,
    videoUrl: "/media/tutorial.mp3",
    duracionSegundos: 60,
    silenciado: true,
    inicioTs: 1000,
    finTs: 61000,
    posicionSegundos: 4.5,
    proximaReproduccionTs: 90000,
    verificacionDisponible: true,
    musasConectadas: 4,
    musasVerificadas: 3,
    mensaje: ""
  });
});

test("control waits for authoritative config and preserves media fields when changing interval", () => {
  const { api, elementos, emisiones } = crearHarness();
  const reproducir = elementos.get("videotutorial_reproduccion_toggle");
  assert.equal(reproducir.disabled, true, "actions stay locked before the first state snapshot");

  api.aplicarEstado({
    activo: true,
    session_id: "video-session",
    phase_seq: 2,
    visible: false,
    reproduciendo: false,
    configuracion: {
      video_url: "https://cdn.example.test/tutorial.mp3",
      intervalo_segundos: 300,
      duracion_segundos: 75,
      habilitado: true,
      silenciado: false
    }
  });
  assert.equal(reproducir.disabled, false);
  assert.equal(elementos.get("videotutorial_intervalo").value, "5");
  assert.equal(elementos.get("videotutorial_habilitado").checked, true);

  elementos.get("videotutorial_intervalo").value = "8";
  elementos.get("videotutorial_habilitado").checked = false;
  assert.equal(api.configurar(), true);
  assert.equal(emisiones.length, 1);
  assert.equal(emisiones[0].evento, "video_tutorial_configurar");
  assert.deepEqual(
    { ...emisiones[0].payload, request_id: "<dynamic>" },
    {
      video_url: "https://cdn.example.test/tutorial.mp3",
      intervalo_segundos: 480,
      duracion_segundos: 75,
      habilitado: false,
      silenciado: false,
      request_id: "<dynamic>"
    }
  );
  assert.match(emisiones[0].payload.request_id, /^control-video-/);
  emisiones[0].ack({ ok: true });
  assert.equal(api.obtenerEstado().intervaloSegundos, 480);
  assert.equal(api.obtenerEstado().programado, false);
});

test("the single play control toggles state, serializes ACKs and glows while active", () => {
  const { api, elementos, emisiones } = crearHarness();
  api.aplicarEstado({
    activo: true,
    session_id: "video-session",
    phase_seq: 7,
    proxima_reproduccion_ts: Date.now() + 60000,
    configuracion: {
      video_url: "/tutorial.mp3",
      intervalo_segundos: 300,
      duracion_segundos: 60,
      habilitado: true,
      silenciado: true
    },
    verificacion: { conectadas: 4, verificadas: 2 }
  });

  assert.equal(api.mostrar(), true);
  assert.equal(api.ocultar(), false, "a second action cannot overtake an in-flight ACK");
  assert.equal(emisiones[0].evento, "video_tutorial_reproducir");
  assert.equal(emisiones[0].payload.session_id, "video-session");
  assert.equal(emisiones[0].payload.phase_seq, 7);
  assert.equal(elementos.get("videotutorial_control").attributes["aria-busy"], "true");
  emisiones[0].ack({ ok: true });
  assert.equal(api.obtenerEstado().reproduciendo, true);
  assert.equal(elementos.get("videotutorial_reproduccion_toggle").textContent, "■");
  assert.equal(elementos.get("videotutorial_reproduccion_toggle").attributes["aria-pressed"], "true");
  assert.equal(elementos.get("videotutorial_reproduccion_toggle").classList.contains("is-playing"), true);
  assert.equal(elementos.get("videotutorial_estado").hidden, true);

  assert.equal(api.alternarReproduccion(), true);
  assert.equal(emisiones[1].evento, "video_tutorial_detener");
  assert.equal(emisiones[1].payload.session_id, "video-session");
  assert.equal(emisiones[1].payload.phase_seq, 7);
  emisiones[1].ack({ ok: true });
  assert.equal(api.obtenerEstado().reproduciendo, false);
  assert.equal(elementos.get("videotutorial_control").attributes["aria-busy"], "false");
  assert.equal(elementos.get("videotutorial_reproduccion_toggle").textContent, "▶");
});

test("interval stepper clamps minute changes and saves them immediately", () => {
  const { api, elementos, emisiones } = crearHarness();
  api.aplicarEstado({
    activo: true,
    session_id: "video-session",
    phase_seq: 3,
    configuracion: { intervalo_segundos: 180, habilitado: false }
  });
  assert.equal(api.ajustarIntervalo(1), true);
  assert.equal(elementos.get("videotutorial_intervalo").value, "4");
  assert.equal(emisiones[0].evento, "video_tutorial_configurar");
  emisiones[0].ack({ ok: true });
  assert.equal(api.ajustarIntervalo(-20), true);
  assert.equal(elementos.get("videotutorial_intervalo").value, "1");
});

test("control HTML, CSS and Socket.IO wiring expose an accessible motion-safe interface", () => {
  const html = read("game/control/index.html");
  const css = read("game/control/index.css");
  const socketEvents = read("game/control/js/socket-events.js");
  const moduleSource = read("game/control/js/videotutorial-control.js");

  assert.match(html, /id="videotutorial_control"[\s\S]*aria-labelledby="videotutorial_control_title"/);
  assert.match(html, /id="videotutorial_intervalo"[\s\S]*min="1"[\s\S]*max="1440"/);
  assert.match(html, /id="videotutorial_habilitado"[\s\S]*type="checkbox"[\s\S]*role="switch"/);
  assert.doesNotMatch(html, /id="videotutorial_configurar"|>GUARDAR<|REPRODUCCI&Oacute;N AHORA|REPETICI&Oacute;N DESACTIVADA/);
  assert.match(html, /id="videotutorial_intervalo_menos"[\s\S]*id="videotutorial_intervalo_mas"/);
  assert.match(html, /id="videotutorial_reproduccion_toggle"[\s\S]*aria-pressed="false"/);
  assert.doesNotMatch(html, /VIDEOTUTORIAL PREVIO|INTERVALO AUTOM&Aacute;TICO|Puedes reproducirlo antes o durante el tutorial/);
  assert.doesNotMatch(html, /id="videotutorial_estado_dot"|id="videotutorial_mostrar"|id="videotutorial_ocultar"/);
  assert.match(html, /id="videotutorial_estado"[\s\S]*role="status"[\s\S]*aria-live="polite"/);
  assert.doesNotMatch(html, /videotutorial-control__icon/);
  assert.doesNotMatch(html, /id="videotutorial_estado_detalle"/);
  assert.match(html, /videotutorial-control\.js\?v=20260829p/);

  assert.match(socketEvents, /socket\.emit\('pedir_video_tutorial_estado'\)/);
  assert.match(socketEvents, /socket\.on\('video_tutorial_estado'/);
  assert.match(moduleSource, /"video_tutorial_configurar"/);
  assert.match(moduleSource, /"video_tutorial_reproducir"/);
  assert.match(moduleSource, /"video_tutorial_detener"/);
  assert.match(moduleSource, /intervalo_segundos:\s*valor \* 60/);
  assert.match(moduleSource, /session_id:\s*estado\.sessionId/);
  assert.doesNotMatch(moduleSource, /Puedes reproducir ahora o activar la repetición automática/);
  assert.doesNotMatch(moduleSource, /Termina a las|Verificación:/);
  assert.doesNotMatch(moduleSource, /\.innerHTML\s*=/);
  assert.doesNotMatch(moduleSource, /emitirOperacion\(\s*"videotutorial_/);

  assert.match(css, /\.videotutorial-control\[data-state="playing"\]/);
  assert.match(css, /\.videotutorial-control\[data-state="error"\]/);
  assert.match(css, /\.control-group--tutorial \{[\s\S]*--group-accent: #ffb04a/);
  assert.match(css, /\.videotutorial-control \.videotutorial-control__button \{[\s\S]*--tutorial-control-accent/);
  assert.match(css, /\.videotutorial-control__button--play\.is-playing/);
  assert.match(css, /\.videotutorial-control__stepper/);
  assert.match(css, /container-name:\s*tutorial-controls/);
  assert.match(css, /@container tutorial-controls \(max-width: 34rem\)/);
  assert.match(css, /control-group-buttons--tutorial[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) !important/);
  assert.match(css, /#panel_controles \.control-group--tutorial #boton_nueva_partida\s*\{[\s\S]{0,320}background:/);
});
