(function initScribCompetitionUI(global) {
  "use strict";

  const STYLE_ID = "scrib-competition-style";
  const ROOT_ID = "scrib_competition_hud";
  const conexiones = new WeakSet();
  let ui = null;
  let relojInterval = null;
  let relojEstado = null;
  let estadoActual = null;
  let rolActual = "";

  const htmlSeguro = (valor) => String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function instalarEstilos() {
    if (!document.head || document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .scrib-competition-hud{--azul:#46f0ff;--rojo:#ff5f67;--oro:#ffe475;position:fixed;z-index:2147481200;left:50%;top:clamp(8px,1.4vh,18px);transform:translateX(-50%);width:min(760px,72vw);font-family:Inter,system-ui,sans-serif;color:#fff;pointer-events:none;filter:drop-shadow(0 10px 26px #000a);transition:opacity .35s,transform .35s}
      body:has(#scrib_competition_hud) #inspiracion{display:none!important}
      .scrib-competition-hud[data-role="spectator"]{top:clamp(114px,15vh,166px);width:min(940px,72vw)}
      .scrib-competition-hud[data-role="control"]{position:relative;inset:auto;transform:none;width:100%;filter:none;z-index:2}
      .scrib-competition-hud[data-active="0"][data-clock="0"]{opacity:0;transform:translate(-50%,-20px)}
      .scrib-competition-hud[data-role="control"][data-active="0"][data-clock="0"]{transform:translateY(-6px)}
      .scrib-competition-shell{position:relative;border:1px solid #ffffff38;border-radius:18px;padding:9px 14px 11px;background:linear-gradient(180deg,#101423f2,#060914ed);box-shadow:inset 0 0 26px #ffffff0b,0 0 0 1px #000}
      .scrib-competition-top{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin-bottom:7px}
      .scrib-competition-mode{font-size:clamp(10px,.8vw,13px);font-weight:900;letter-spacing:.13em;text-align:left;color:#d7dcf4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .scrib-competition-clock{font-variant-numeric:tabular-nums;font-size:clamp(19px,1.8vw,30px);font-weight:1000;letter-spacing:.08em;color:#fff;border:1px solid #ffffff30;border-radius:999px;padding:2px 13px;background:#050711}
      .scrib-competition-clock::before{content:'TIEMPO ';font-size:.44em;color:#abb2cb;vertical-align:middle}
      .scrib-competition-criterion{text-align:right;font-size:clamp(8px,.68vw,11px);font-weight:800;letter-spacing:.07em;color:#abb2cb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .scrib-competition-hud[data-role="control"] .scrib-competition-shell{padding:4px 6px;border-radius:8px;background:#050914d9}
      .scrib-competition-hud[data-role="control"] .scrib-competition-top{display:none}
      .scrib-competition-hud[data-role="control"] .scrib-competition-scoreline{grid-template-columns:minmax(28px,auto) 1fr minmax(28px,auto);gap:5px}
      .scrib-competition-hud[data-role="control"] .scrib-competition-score{min-width:30px;height:25px;border-radius:6px;font-size:15px}
      .scrib-competition-hud[data-role="control"] .scrib-competition-bar{height:18px}
      .scrib-competition-hud[data-role="control"] .scrib-competition-center{height:23px;width:7px}
      .scrib-competition-hud[data-role="control"] .scrib-competition-curse{font-size:15px}
      .control-competition-slot + .level-status-witnesses .level-status-witness--disadvantage{display:none}
      .scrib-competition-hud[data-role="writer"] .scrib-competition-mode,.scrib-competition-hud[data-role="writer"] .scrib-competition-criterion,.scrib-competition-hud[data-role="spectator"] .scrib-competition-mode,.scrib-competition-hud[data-role="spectator"] .scrib-competition-criterion{display:none}
      .scrib-competition-hud[data-role="writer"] .scrib-competition-top,.scrib-competition-hud[data-role="spectator"] .scrib-competition-top{display:flex;justify-content:center;margin-bottom:7px}
      .scrib-competition-scoreline{display:grid;grid-template-columns:minmax(54px,auto) 1fr minmax(54px,auto);gap:9px;align-items:center}
      .scrib-competition-score{position:relative;display:flex;align-items:center;justify-content:center;min-width:58px;height:42px;border-radius:12px;font-size:clamp(22px,2.1vw,36px);font-weight:1000;font-variant-numeric:tabular-nums;background:#090c18;border:1px solid currentColor;transition:transform .2s,box-shadow .25s}
      .scrib-competition-score--1{color:var(--azul);box-shadow:inset 0 0 18px #46f0ff24}
      .scrib-competition-score--2{color:var(--rojo);box-shadow:inset 0 0 18px #ff5f6724}
      .scrib-competition-score.is-leading{transform:scale(1.08);box-shadow:0 0 24px currentColor,inset 0 0 18px #ffffff24}
      .scrib-competition-score.is-hit{animation:scribScoreHit .42s ease-out}
      .scrib-competition-bar{position:relative;height:28px;display:flex;overflow:hidden;border:1px solid #fff5;border-radius:999px;background:#060812;box-shadow:inset 0 0 15px #000;isolation:isolate}
      .scrib-competition-segment{height:100%;transition:width .65s cubic-bezier(.2,.9,.2,1);position:relative}
      .scrib-competition-segment--1{background:linear-gradient(90deg,#087c9d,var(--azul))}
      .scrib-competition-segment--2{background:linear-gradient(90deg,var(--rojo),#9d1731)}
      .scrib-competition-center{position:absolute;z-index:3;left:var(--marker-position,50%);top:50%;width:11px;height:34px;transform:translate(-50%,-50%) skewX(-12deg);background:#fff;box-shadow:0 0 15px #fff;transition:left .65s cubic-bezier(.2,.9,.2,1)}
      .scrib-competition-curse{position:absolute;z-index:4;top:50%;left:var(--curse-position,50%);transform:translate(-50%,-50%);font-size:19px;filter:drop-shadow(0 0 5px #000);transition:left .7s cubic-bezier(.2,.9,.2,1)}
      .scrib-competition-streak{position:absolute;top:100%;margin-top:7px;padding:4px 9px;border-radius:999px;background:#090c18e8;border:1px solid currentColor;font-size:11px;font-weight:1000;letter-spacing:.08em;opacity:0;transform:translateY(-5px);transition:.2s}
      .scrib-competition-streak[data-active="1"]{opacity:1;transform:none}
      .scrib-competition-streak--1{left:2%;color:var(--azul)}.scrib-competition-streak--2{right:2%;color:var(--rojo)}
      .scrib-competition-fly{position:fixed;z-index:2147483000;left:0;top:0;padding:5px 10px;border-radius:999px;border:1px solid currentColor;background:#090c18f2;font:1000 16px/1 Inter,system-ui,sans-serif;color:var(--fly-color,#fff);white-space:nowrap;pointer-events:none;opacity:0}
      .scrib-competition-fly.is-flying{animation:scribFly var(--fly-duration,800ms) cubic-bezier(.18,.8,.22,1) forwards}
      .scrib-competition-fly.is-muse{color:var(--oro);box-shadow:0 0 20px #ffe475b0}
      .scrib-competition-change{position:fixed;z-index:2147483100;left:50%;top:43%;transform:translate(-50%,-50%) scale(.7);opacity:0;text-align:center;font:1000 clamp(25px,4vw,64px)/.95 Inter,system-ui,sans-serif;letter-spacing:.04em;color:#fff;text-shadow:0 0 8px #fff,0 0 32px #8b5cff,4px 4px 0 #000;pointer-events:none;animation:scribLeaderChange 1.55s ease-out forwards}
      .scrib-competition-change small{display:block;margin-top:10px;font-size:.3em;letter-spacing:.18em;color:var(--change-color,#fff)}
      .scrib-competition-burst{position:fixed;z-index:2147483050;width:8px;height:8px;border-radius:50%;background:var(--burst-color);pointer-events:none;animation:scribBurst .75s ease-out forwards}
      @keyframes scribScoreHit{0%{transform:scale(1)}40%{transform:scale(1.3)}100%{transform:scale(1)}}
      @keyframes scribFly{0%{transform:translate(var(--x0),var(--y0)) scale(.7);opacity:0}15%{opacity:1}70%{transform:translate(var(--xm),var(--ym)) scale(1.35)}100%{transform:translate(var(--x1),var(--y1)) scale(.75);opacity:0}}
      @keyframes scribLeaderChange{0%{opacity:0;transform:translate(-50%,-50%) scale(.6) rotate(-3deg)}18%,65%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-58%) scale(1.1)}}
      @keyframes scribBurst{from{opacity:1;transform:translate(0,0) scale(1)}to{opacity:0;transform:translate(var(--bx),var(--by)) scale(0)}}
      @media (max-width:800px){.scrib-competition-hud{width:94vw}.scrib-competition-criterion{display:none}.scrib-competition-top{grid-template-columns:1fr auto}.scrib-competition-hud[data-role="spectator"]{width:84vw}}
      @media (prefers-reduced-motion:reduce){.scrib-competition-segment,.scrib-competition-center,.scrib-competition-curse{transition:none}.scrib-competition-fly.is-flying,.scrib-competition-change,.scrib-competition-burst{animation-duration:.01ms!important}}
    `;
    document.head.appendChild(style);
  }

  function crearUi(rol) {
    instalarEstilos();
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("section");
      root.id = ROOT_ID;
      root.className = "scrib-competition-hud";
      root.setAttribute("aria-live", "polite");
      document.body.appendChild(root);
    }
    root.dataset.role = rol || "game";
    const slotControl = rol === "control" ? document.getElementById("control_competition_slot") : null;
    if (slotControl && root.parentElement !== slotControl) slotControl.appendChild(root);
    root.dataset.active = "0";
    root.dataset.clock = "0";
    root.innerHTML = `
      <div class="scrib-competition-shell">
        <div class="scrib-competition-top">
          <span class="scrib-competition-mode">ESPERANDO NIVEL</span>
          <span class="scrib-competition-clock">00:00</span>
          <span class="scrib-competition-criterion">MARCADOR DE INSPIRACIÓN</span>
        </div>
        <div class="scrib-competition-scoreline">
          <strong class="scrib-competition-score scrib-competition-score--1">0</strong>
          <div class="scrib-competition-bar">
            <span class="scrib-competition-segment scrib-competition-segment--1"></span>
            <span class="scrib-competition-segment scrib-competition-segment--2"></span>
            <span class="scrib-competition-center"></span>
            <span class="scrib-competition-curse" aria-label="Desventaja"></span>
          </div>
          <strong class="scrib-competition-score scrib-competition-score--2">0</strong>
        </div>
        <span class="scrib-competition-streak scrib-competition-streak--1"></span>
        <span class="scrib-competition-streak scrib-competition-streak--2"></span>
      </div>`;
    return {
      root,
      mode: root.querySelector(".scrib-competition-mode"),
      clock: root.querySelector(".scrib-competition-clock"),
      criterion: root.querySelector(".scrib-competition-criterion"),
      bar: root.querySelector(".scrib-competition-bar"),
      segments: { 1: root.querySelector(".scrib-competition-segment--1"), 2: root.querySelector(".scrib-competition-segment--2") },
      scores: { 1: root.querySelector(".scrib-competition-score--1"), 2: root.querySelector(".scrib-competition-score--2") },
      streaks: { 1: root.querySelector(".scrib-competition-streak--1"), 2: root.querySelector(".scrib-competition-streak--2") },
      curse: root.querySelector(".scrib-competition-curse")
    };
  }

  const numero = (valor) => {
    const n = Number(valor) || 0;
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  };

  function posicionMarcador(a, b) {
    const diferencia = (Number(a) || 0) - (Number(b) || 0);
    return Math.max(10, Math.min(90, 50 + (Math.tanh(diferencia / 8) * 40)));
  }

  function actualizarEstado(estado) {
    if (!estado || typeof estado !== "object") return;
    estadoActual = estado;
    if (!ui) ui = crearUi(rolActual);
    const marcador = estado.marcador || { 1: 0, 2: 0 };
    const pos = posicionMarcador(marcador[1], marcador[2]);
    ui.root.dataset.active = estado.activa ? "1" : "0";
    ui.mode.textContent = estado.modo_publico || String(estado.modo || "").toUpperCase() || "ESPERANDO NIVEL";
    ui.criterion.textContent = estado.activa ? (estado.criterio || "MARCADOR DE INSPIRACIÓN") : "COMPETICIÓN EN PAUSA";
    ui.scores[1].textContent = numero(marcador[1]);
    ui.scores[2].textContent = numero(marcador[2]);
    ui.scores[1].classList.toggle("is-leading", Number(estado.lider) === 1);
    ui.scores[2].classList.toggle("is-leading", Number(estado.lider) === 2);
    ui.segments[1].style.width = `${pos}%`;
    ui.segments[2].style.width = `${100 - pos}%`;
    ui.bar.style.setProperty("--marker-position", `${pos}%`);
    const portador = Number(estado.desventaja_player);
    ui.curse.textContent = estado.activa ? String(estado.desventaja || "") : "";
    ui.bar.style.setProperty("--curse-position", portador === 1 ? "11%" : (portador === 2 ? "89%" : "50%"));
    [1, 2].forEach((player) => {
      const racha = Number(estado.rachas && estado.rachas[player]) || 0;
      ui.streaks[player].dataset.active = racha >= 2 ? "1" : "0";
      ui.streaks[player].textContent = racha >= 2 ? `RACHA ×${racha}` : "";
    });
  }

  function formatearTiempo(segundos) {
    const total = Math.max(0, Math.ceil(Number(segundos) || 0));
    const minutos = Math.floor(total / 60);
    return `${String(minutos).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function restanteReloj() {
    if (!relojEstado) return 0;
    if (relojEstado.activo && !relojEstado.pausado && Number(relojEstado.termina_en_ts) > 0) {
      return Math.max(0, (Number(relojEstado.termina_en_ts) - Date.now()) / 1000);
    }
    return Math.max(0, Number(relojEstado.tiempo_restante_segundos) || 0);
  }

  function pintarReloj() {
    if (!ui) ui = crearUi(rolActual);
    const visible = Boolean(relojEstado && (relojEstado.activo || relojEstado.tiempo_restante_segundos > 0));
    ui.root.dataset.clock = visible ? "1" : "0";
    ui.clock.textContent = formatearTiempo(restanteReloj());
    ui.clock.classList.toggle("is-paused", Boolean(relojEstado && relojEstado.pausado));
  }

  function actualizarReloj(payload) {
    relojEstado = payload && typeof payload === "object" ? { ...payload } : null;
    pintarReloj();
    if (relojInterval) clearInterval(relojInterval);
    relojInterval = setInterval(pintarReloj, 250);
  }

  function rectOrigen(player) {
    const selectoresPorRol = {
      spectator: player === 1 ? ["#texto1", ".writer-card--j1 .writer-textarea"] : ["#texto2", ".writer-card--j2 .writer-textarea"],
      control: player === 1 ? ["#texto", ".writer-card--j1 .writer-textarea"] : ["#texto1", ".writer-card--j2 .writer-textarea"],
      writer: ["#texto", ".writer-textarea"]
    };
    const selectores = selectoresPorRol[rolActual] || (player === 1 ? ["#texto"] : ["#texto1"]);
    for (const selector of selectores) {
      const nodo = document.querySelector(selector);
      if (nodo && typeof nodo.getBoundingClientRect === "function") return nodo.getBoundingClientRect();
    }
    return { left: player === 1 ? 20 : innerWidth - 80, top: innerHeight * .6, width: 40, height: 20 };
  }

  function sonidoPunto(player, racha) {
    if (!global.AudioContext && !global.webkitAudioContext) return;
    try {
      const Ctx = global.AudioContext || global.webkitAudioContext;
      const ctx = sonidoPunto.ctx || (sonidoPunto.ctx = new Ctx());
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = racha >= 3 ? "triangle" : "sine";
      osc.frequency.value = (player === 1 ? 520 : 420) + Math.min(racha, 8) * 28;
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.045, ctx.currentTime + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + .17);
    } catch (_) {}
  }

  function lanzarParticulas(rect, player) {
    const color = player === 1 ? "#46f0ff" : "#ff5f67";
    for (let i = 0; i < 12; i += 1) {
      const part = document.createElement("i");
      part.className = "scrib-competition-burst";
      part.style.left = `${rect.left + rect.width / 2}px`;
      part.style.top = `${rect.top + rect.height / 2}px`;
      part.style.setProperty("--burst-color", color);
      const angulo = (Math.PI * 2 * i) / 12;
      const radio = 32 + Math.random() * 42;
      part.style.setProperty("--bx", `${Math.cos(angulo) * radio}px`);
      part.style.setProperty("--by", `${Math.sin(angulo) * radio}px`);
      document.body.appendChild(part);
      part.addEventListener("animationend", () => part.remove(), { once: true });
    }
  }

  function etiquetaPublicaPunto(payload = {}) {
    const valor = String(payload.palabra || payload.etiqueta || "").trim();
    if (!valor) return Number(payload.delta) < 0 ? "BORRADO" : "ESCRITURA";
    if (/^(?:div|br|p|li)$/i.test(valor) || /mini[\s_-]*insp/i.test(valor)) {
      return Number(payload.delta) < 0 ? "BORRADO" : "ESCRITURA";
    }
    return valor;
  }

  function animarPunto(payload) {
    if (!payload || !ui) return;
    const player = Number(payload.player) === 2 ? 2 : 1;
    const origen = rectOrigen(player);
    const destino = ui.scores[player].getBoundingClientRect();
    const token = document.createElement("span");
    const etiqueta = etiquetaPublicaPunto(payload);
    const firmaMusa = payload.tipo === "inspiracion_musa" && payload.musa_nombre
      ? `${htmlSeguro(payload.musa_nombre)} · `
      : "";
    token.className = `scrib-competition-fly${payload.tipo === "inspiracion_musa" ? " is-muse" : ""}`;
    token.innerHTML = `${payload.tipo === "inspiracion_musa" ? "✦ " : ""}${firmaMusa}${htmlSeguro(etiqueta)} <b>${Number(payload.delta) > 0 ? "+" : ""}${numero(payload.delta)}</b>`;
    token.style.setProperty("--fly-color", player === 1 ? "#46f0ff" : "#ff5f67");
    document.body.appendChild(token);
    const tokenRect = token.getBoundingClientRect();
    const mitadTokenX = tokenRect.width / 2;
    const mitadTokenY = tokenRect.height / 2;
    const origenX = origen.left + origen.width / 2 - mitadTokenX;
    const origenY = origen.top + origen.height / 2 - mitadTokenY;
    const destinoX = destino.left + destino.width / 2 - mitadTokenX;
    const destinoY = destino.top + destino.height / 2 - mitadTokenY;
    token.style.setProperty("--x0", `${origenX}px`);
    token.style.setProperty("--y0", `${origenY}px`);
    token.style.setProperty("--xm", `${(origenX + destinoX) / 2}px`);
    token.style.setProperty("--ym", `${Math.min(origenY, destinoY) - 70}px`);
    token.style.setProperty("--x1", `${destinoX}px`);
    token.style.setProperty("--y1", `${destinoY}px`);
    requestAnimationFrame(() => token.classList.add("is-flying"));
    token.addEventListener("animationend", () => token.remove(), { once: true });
    ui.scores[player].classList.remove("is-hit");
    void ui.scores[player].offsetWidth;
    ui.scores[player].classList.add("is-hit");
    const racha = Math.max(0, Number(payload.racha) || 0);
    sonidoPunto(player, racha);
    if (racha >= 3) {
      lanzarParticulas(destino, player);
      if (racha % 3 === 0 && typeof global.confetti === "function") {
        global.confetti({ particleCount: 22, spread: 55, scalar: .8, origin: { x: player === 1 ? .35 : .65, y: .18 }, colors: [player === 1 ? "#46f0ff" : "#ff5f67", "#ffe475", "#ffffff"] });
      }
    }
  }

  function animarCambioLider(payload) {
    const lider = Number(payload && payload.lider);
    const portador = Number(payload && payload.desventaja_player);
    const aviso = document.createElement("div");
    aviso.className = "scrib-competition-change";
    aviso.style.setProperty("--change-color", lider === 1 ? "#46f0ff" : "#ff5f67");
    aviso.innerHTML = `¡CAMBIO DE VENTAJA!<small>${lider ? `ESCRITXR ${lider} SE LIBERA · ${htmlSeguro(payload.desventaja || "")} PASA A ESCRITXR ${portador}` : "EMPATE"}</small>`;
    document.body.appendChild(aviso);
    aviso.addEventListener("animationend", () => aviso.remove(), { once: true });
    if (ui && ui.curse) {
      ui.curse.animate([
        { transform: "translate(-50%,-50%) scale(1) rotate(0deg)" },
        { transform: "translate(-50%,-180%) scale(2.1) rotate(180deg)" },
        { transform: "translate(-50%,-50%) scale(1) rotate(360deg)" }
      ], { duration: 900, easing: "cubic-bezier(.2,.9,.2,1)" });
    }
  }

  function limpiarDesventaja() {
    if (ui && ui.curse) ui.curse.textContent = "";
  }

  function conectar(socket, opciones = {}) {
    if (!socket || typeof socket.on !== "function" || conexiones.has(socket)) return;
    conexiones.add(socket);
    rolActual = String(opciones.role || opciones.rol || rolActual || "game");
    ui = ui || crearUi(rolActual);
    socket.on("competicion_ronda_estado", actualizarEstado);
    socket.on("competicion_ronda_punto", (payload) => {
      if (payload && payload.estado) actualizarEstado(payload.estado);
      if (!payload || payload.animar !== false) animarPunto(payload);
    });
    socket.on("competicion_cambio_lider", animarCambioLider);
    socket.on("reloj_partida_estado", actualizarReloj);
    socket.on("desventaja_ronda_limpiar", limpiarDesventaja);
  }

  global.ScribCompetitionUI = {
    actualizarEstado,
    actualizarReloj,
    conectar,
    formatearTiempo,
    posicionMarcador
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { formatearTiempo, posicionMarcador };
  }
})(typeof window !== "undefined" ? window : globalThis);
