#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = path.resolve(__dirname, "..");
const buildDir = path.resolve(process.argv[2] || path.join(ROOT, ".tutorial-video-build"));
const vttPath = path.resolve(process.argv[3] || path.join(ROOT, "game/media/tutorial-scrib.vtt"));
const scenesDir = path.join(buildDir, "scenes");
const textDir = path.join(buildDir, "narration");

const scenes = [
  {
    key: "00-acceso",
    start: 0,
    duration: 6,
    leadMs: 350,
    caption: "Abre la dirección de la sala o escanea su código QR.",
    eyebrow: "PASO 1 · CONEXIÓN",
    title: "ABRE LA URL\nO ESCANEA EL QR",
    note: "Usa el enlace o el QR que muestra la organización.",
    screen: "access"
  },
  {
    key: "01-nombre",
    start: 6,
    duration: 6,
    leadMs: 500,
    caption: "Escribe tu nombre y toca DESCUBRIR MI EQUIPO.",
    eyebrow: "PASO 2 · IDENTIDAD",
    title: "¿CÓMO QUIERES\nAPARECER?",
    note: "El público verá este nombre cuando envíes una inspiración.",
    screen: "name"
  },
  {
    key: "02-asignacion",
    start: 12,
    duration: 8,
    leadMs: 350,
    caption: "Cuando aparezcan tu equipo y tu escritxr, toca ENTRAR AL JUEGO.",
    burnedCaption: "Cuando aparezcan tu equipo y tu escritxr,\ntoca ENTRAR AL JUEGO.",
    eyebrow: "PASO 3 · ASIGNACIÓN",
    title: "TU EQUIPO SE ELIGE\nAUTOMÁTICAMENTE",
    note: "Los equipos azul y rojo se mantienen equilibrados.",
    screen: "assignment"
  },
  {
    key: "03-comprueba",
    start: 20,
    duration: 6,
    leadMs: 350,
    caption: "Comprueba tu nombre, el color de tu equipo y quién es tu escritora o escritor.",
    burnedCaption: "Comprueba tu nombre, el color de tu equipo\ny quién es tu escritora o escritor.",
    eyebrow: "PASO 4 · COMPRUEBA",
    title: "REVISA LOS TRES\nDATOS DE PANTALLA",
    note: "Nombre, equipo y escritxr deben coincidir.",
    screen: "check"
  },
  {
    key: "04-lista",
    start: 26,
    duration: 4,
    leadMs: 350,
    caption: "Mantén esta pantalla abierta.",
    eyebrow: "PASO 5 · PREPARADA",
    title: "NO CIERRES\nESTA PANTALLA",
    note: "La prueba de imagen empieza enseguida.",
    screen: "ready"
  },
  {
    key: "05-aviso",
    start: 30,
    duration: 4,
    leadMs: 250,
    caption: "Ahora viene una prueba breve. Mira tu pantalla.",
    eyebrow: "PRUEBA DE PANTALLA",
    title: "MIRA LOS COLORES",
    note: "Verás cuatro colores, uno tras otro.",
    screen: "warning"
  },
  {
    key: "06-rojo",
    start: 34,
    duration: 4,
    leadMs: 650,
    caption: "ROJO",
    eyebrow: "COLOR 1 DE 4",
    title: "ROJO",
    note: "Primer color recibido.",
    screen: "color",
    colorName: "ROJO",
    color: "#ff4352",
    colorIndex: 0
  },
  {
    key: "07-azul",
    start: 38,
    duration: 4,
    leadMs: 650,
    caption: "AZUL",
    eyebrow: "COLOR 2 DE 4",
    title: "AZUL",
    note: "Segundo color recibido.",
    screen: "color",
    colorName: "AZUL",
    color: "#36dfff",
    colorIndex: 1
  },
  {
    key: "08-verde",
    start: 42,
    duration: 4,
    leadMs: 650,
    caption: "VERDE",
    eyebrow: "COLOR 3 DE 4",
    title: "VERDE",
    note: "Tercer color recibido.",
    screen: "color",
    colorName: "VERDE",
    color: "#58f47c",
    colorIndex: 2
  },
  {
    key: "09-blanco",
    start: 46,
    duration: 4,
    leadMs: 650,
    caption: "BLANCO",
    eyebrow: "COLOR 4 DE 4",
    title: "BLANCO",
    note: "Cuarto color recibido.",
    screen: "color",
    colorName: "BLANCO",
    color: "#ffffff",
    colorIndex: 3
  },
  {
    key: "10-confirmacion",
    start: 50,
    duration: 10,
    leadMs: 300,
    caption: "Si viste los cuatro colores, toca “SÍ, FUNCIONA” en tu pantalla. Verás la confirmación.",
    burnedCaption: "Si viste los cuatro colores, toca “SÍ, FUNCIONA”\nen tu pantalla. Verás la confirmación.",
    eyebrow: "ÚLTIMO PASO · CONFIRMA",
    title: "TOCA “SÍ, FUNCIONA”",
    note: "La confirmación avisa al servidor de que tu pantalla funciona.",
    screen: "success"
  }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function timestamp(seconds, decimal = ".") {
  const millis = Math.round(seconds * 1000);
  const hours = Math.floor(millis / 3600000);
  const minutes = Math.floor((millis % 3600000) / 60000);
  const secs = Math.floor((millis % 60000) / 1000);
  const ms = millis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}${decimal}${String(ms).padStart(3, "0")}`;
}

function qrMarkup() {
  const size = 21;
  const finder = (x, y, ox, oy) => {
    const dx = x - ox;
    const dy = y - oy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
    const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
    const center = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
    return edge || center;
  };
  const cells = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const fixed = finder(x, y, 0, 0) ?? finder(x, y, 14, 0) ?? finder(x, y, 0, 14);
      const on = fixed === null ? ((x * 11 + y * 7 + x * y * 3 + (x ^ y)) % 13) < 6 : fixed;
      cells.push(`<i class="${on ? "on" : ""}"></i>`);
    }
  }
  return `<div class="qr" aria-label="Código QR ilustrativo">${cells.join("")}</div>`;
}

function phoneScreen(scene) {
  if (scene.screen === "access") {
    return `
      <div class="mobile-kicker">ENTRA COMO MUSA</div>
      ${qrMarkup()}
      <div class="url-pill">URL DE ESTA SALA</div>
      <div class="mobile-help">URL o QR de la sala</div>`;
  }
  if (scene.screen === "name") {
    return `
      <div class="mobile-kicker">TU NOMBRE DE MUSA</div>
      <div class="name-label">NOMBRE</div>
      <div class="name-input"><span>LUNA</span><b class="caret"></b></div>
      <div class="primary-button">DESCUBRIR MI EQUIPO <span>→</span></div>
      <div class="mobile-help">Podrás reconocer tus mensajes</div>`;
  }
  if (scene.screen === "assignment") {
    return `
      <div class="mobile-kicker">ASIGNACIÓN COMPLETA</div>
      <div class="team-orb team-orb--blue"><span>★</span></div>
      <div class="team-title">EQUIPO AZUL</div>
      <div class="writer-card"><small>TU ESCRITXR</small><strong>ALEX</strong></div>
      <div class="primary-button primary-button--assignment">ENTRAR AL JUEGO <span>→</span></div>
      <div class="balance"><i></i><span>EQUIPOS EQUILIBRADOS</span><i></i></div>`;
  }
  if (scene.screen === "check") {
    return `
      <div class="mobile-kicker">COMPRUEBA TU PANTALLA</div>
      <div class="check-list">
        <div><b>✓</b><span>NOMBRE</span><strong>LUNA</strong></div>
        <div><b>✓</b><span>EQUIPO</span><strong class="cyan">AZUL</strong></div>
        <div><b>✓</b><span>ESCRITXR</span><strong>ALEX</strong></div>
      </div>
      <div class="mobile-help">Todo coincide</div>`;
  }
  if (scene.screen === "ready") {
    return `
      <div class="ready-rays"></div>
      <div class="ready-icon">◉</div>
      <div class="ready-title">PANTALLA LISTA</div>
      <div class="ready-sub">MANTÉNLA ABIERTA</div>
      <div class="connection-pill"><i></i> CONECTADA</div>`;
  }
  if (scene.screen === "warning") {
    return `
      <div class="warning-ring"><span>4</span></div>
      <div class="warning-title">COLORES</div>
      <div class="warning-sub">MIRA CON ATENCIÓN</div>
      <div class="sequence-mini"><i></i><i></i><i></i><i></i></div>`;
  }
  if (scene.screen === "color") {
    return `
      <div class="color-burst" style="--burst:${scene.color}"></div>
      <div class="color-disc" style="--active:${scene.color}"><span>${scene.colorName}</span></div>
      <div class="sequence-dots">${[0, 1, 2, 3].map((index) => `<i class="${index <= scene.colorIndex ? "done" : ""}" style="--dot:${index === 0 ? "#ff4352" : index === 1 ? "#36dfff" : index === 2 ? "#58f47c" : "#ffffff"}"></i>`).join("")}</div>
      <div class="mobile-help">COLOR ${scene.colorIndex + 1} / 4</div>`;
  }
  return `
    <div class="mobile-kicker">¿VISTE LOS 4 COLORES?</div>
    <div class="confirm-flow">
      <div class="confirm-step"><small>1 · TOCA</small><button>SÍ, FUNCIONA</button></div>
      <div class="confirm-arrow">↓</div>
      <div class="verified-card"><b>✓</b><span><small>2 · RESULTADO</small><strong>VERIFICACIÓN<br>CORRECTA</strong></span></div>
    </div>
    <div class="connection-pill connection-pill--verified"><i></i> REPORTADO AL SERVIDOR</div>`;
}

function sceneHtml(scene, logoData, fontData) {
  const accent = scene.color || (scene.screen === "success" ? "#70ff9a" : "#45e6ff");
  const title = scene.title.split("\n").map(escapeHtml).join("<br>");
  return `<!doctype html>
  <html lang="es"><head><meta charset="utf-8"><style>
    @font-face { font-family: VT323; src: url(data:font/ttf;base64,${fontData}) format("truetype"); }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #03060c; }
    body { font-family: Arial, Helvetica, sans-serif; color: #f5fbff; }
    .stage { --accent: ${accent}; position: relative; width: 100%; height: 100%; overflow: hidden; background:
      radial-gradient(circle at 76% 44%, color-mix(in srgb, var(--accent), transparent 83%) 0, transparent 31%),
      radial-gradient(circle at 15% 10%, rgba(189,162,255,.16), transparent 29%),
      linear-gradient(135deg, #050912 0%, #06131c 52%, #08070e 100%); }
    .stage::before { content:""; position:absolute; inset:0; opacity:.13; background: repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,.06) 6px); mix-blend-mode:screen; }
    .stage::after { content:""; position:absolute; width:850px; height:850px; border:1px solid color-mix(in srgb, var(--accent), transparent 80%); border-radius:50%; right:-260px; top:90px; box-shadow:0 0 90px color-mix(in srgb, var(--accent), transparent 85%); }
    .chrome { position:absolute; left:72px; right:72px; top:42px; height:72px; display:flex; align-items:center; z-index:3; }
    .brand { display:flex; align-items:center; gap:18px; font:34px VT323, monospace; letter-spacing:4px; }
    .brand img { width:54px; height:54px; object-fit:contain; filter:drop-shadow(0 0 12px var(--accent)); }
    .brand b { color:var(--accent); font-weight:400; }
    .layout { position:absolute; z-index:2; left:120px; right:120px; top:150px; bottom:130px; display:grid; grid-template-columns: 1.1fr .9fr; align-items:center; gap:100px; }
    .copy { padding-left:42px; }
    .eyebrow { display:inline-flex; align-items:center; gap:12px; font:29px VT323, monospace; letter-spacing:3px; color:var(--accent); border:1px solid color-mix(in srgb, var(--accent), transparent 35%); background:color-mix(in srgb, var(--accent), transparent 91%); box-shadow:0 0 28px color-mix(in srgb, var(--accent), transparent 88%); padding:10px 18px; border-radius:999px; }
    .eyebrow::before { content:""; width:9px; height:9px; border-radius:50%; background:var(--accent); box-shadow:0 0 14px var(--accent); }
    h1 { margin:32px 0 26px; font:400 78px/0.91 VT323, monospace; letter-spacing:3px; text-shadow:4px 4px 0 rgba(255,60,70,.25), -3px -2px 0 rgba(45,220,255,.2), 0 0 35px color-mix(in srgb, var(--accent), transparent 78%); }
    .note { max-width:690px; margin:0; color:#c5d4de; font-size:28px; line-height:1.35; }
    .device-wrap { position:relative; display:flex; justify-content:center; align-items:center; min-height:790px; }
    .device-shadow { position:absolute; width:520px; height:140px; bottom:10px; border-radius:50%; background:color-mix(in srgb, var(--accent), transparent 78%); filter:blur(48px); opacity:.55; }
    .phone { position:relative; width:418px; height:770px; padding:18px; border-radius:54px; background:linear-gradient(145deg,#25313d,#070a0f 35%,#202935 100%); box-shadow:0 0 0 2px rgba(255,255,255,.24), 0 28px 70px rgba(0,0,0,.65), 0 0 50px color-mix(in srgb,var(--accent),transparent 83%); }
    .phone::before { content:""; position:absolute; left:50%; top:12px; transform:translateX(-50%); width:112px; height:22px; border-radius:0 0 14px 14px; background:#05070a; z-index:4; }
    .screen { position:relative; width:100%; height:100%; border-radius:39px; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:54px 32px 42px; text-align:center; background:
      radial-gradient(circle at 50% 22%, color-mix(in srgb,var(--accent),transparent 78%), transparent 38%),
      linear-gradient(160deg,#0b1420,#06090f 72%); border:1px solid rgba(255,255,255,.08); }
    .screen::before { content:""; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(255,255,255,.035) 4px); }
    .mobile-kicker { position:relative; color:var(--accent); font:28px VT323, monospace; letter-spacing:2px; margin-bottom:24px; }
    .qr { width:238px; height:238px; padding:15px; display:grid; grid-template-columns:repeat(21,1fr); grid-template-rows:repeat(21,1fr); gap:1px; background:#f7fbff; border:8px solid #f7fbff; border-radius:13px; box-shadow:0 0 30px color-mix(in srgb,var(--accent),transparent 48%); }
    .qr i { background:transparent; }
    .qr i.on { background:#07111a; }
    .url-pill { position:relative; width:100%; margin-top:28px; padding:15px; border:1px solid rgba(255,255,255,.25); border-radius:10px; color:#e8f8ff; font:24px VT323, monospace; letter-spacing:1px; background:rgba(255,255,255,.06); }
    .mobile-help { position:relative; margin-top:22px; color:#8fa4b4; font:21px VT323, monospace; }
    .name-label { width:100%; text-align:left; color:#8da5b8; font:21px VT323, monospace; letter-spacing:2px; margin:20px 0 8px; }
    .name-input { width:100%; height:78px; display:flex; align-items:center; justify-content:center; gap:7px; border:2px solid var(--accent); border-radius:11px; background:rgba(69,230,255,.06); color:#fff; font:43px VT323, monospace; box-shadow:0 0 24px color-mix(in srgb,var(--accent),transparent 73%); }
    .caret { width:3px; height:39px; background:var(--accent); box-shadow:0 0 8px var(--accent); }
    .primary-button { width:100%; margin-top:30px; padding:21px 24px; display:flex; justify-content:center; gap:16px; color:#031016; background:linear-gradient(90deg,var(--accent),#a4ffd9); border-radius:11px; font:31px VT323, monospace; box-shadow:0 8px 28px color-mix(in srgb,var(--accent),transparent 65%); }
    .primary-button--assignment { margin-top:16px; padding:14px 18px; font-size:26px; }
    .team-orb { width:180px; height:180px; border-radius:50%; display:grid; place-items:center; background:radial-gradient(circle at 38% 32%,#e4fbff 0 4%,#5ceaff 12%,#1475e5 53%,#08265f 100%); box-shadow:0 0 28px #35dfff,0 0 76px rgba(45,151,255,.48); }
    .team-orb span { font-size:80px; text-shadow:0 0 18px #fff; }
    .team-title { margin-top:25px; color:#61eaff; font:45px VT323, monospace; letter-spacing:3px; }
    .writer-card { width:100%; margin-top:28px; padding:18px; border:1px solid rgba(115,234,255,.48); border-radius:13px; background:rgba(50,155,220,.1); }
    .writer-card small { display:block; color:#8fb1c6; font:19px VT323,monospace; letter-spacing:2px; }
    .writer-card strong { display:block; color:#fff; font:42px VT323,monospace; font-weight:400; margin-top:5px; }
    .balance { display:flex; align-items:center; gap:10px; margin-top:20px; color:#77e9a5; font:18px VT323,monospace; }
    .balance i,.connection-pill i { width:8px;height:8px;border-radius:50%;background:#61f38f;box-shadow:0 0 12px #61f38f; }
    .check-list { width:100%; display:flex; flex-direction:column; gap:15px; }
    .check-list div { display:grid; grid-template-columns:42px 1fr auto; align-items:center; min-height:74px; padding:13px 17px; text-align:left; border:1px solid rgba(140,180,205,.24); border-radius:12px; background:rgba(255,255,255,.045); }
    .check-list b { width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#05120b;background:#63f294;font:22px Arial; }
    .check-list span { color:#92a9ba; font:20px VT323,monospace; letter-spacing:1px; }
    .check-list strong { color:#fff; font:28px VT323,monospace; font-weight:400; }
    .check-list .cyan { color:#54eaff; }
    .ready-rays { position:absolute; width:440px;height:440px;border-radius:50%;background:repeating-conic-gradient(from 0deg,transparent 0 11deg,color-mix(in srgb,var(--accent),transparent 88%) 12deg 16deg,transparent 17deg 29deg); }
    .ready-icon { position:relative; width:180px;height:180px;border-radius:50%;display:grid;place-items:center;border:3px solid var(--accent);color:var(--accent);font:84px VT323,monospace;background:rgba(5,20,28,.85);box-shadow:0 0 45px color-mix(in srgb,var(--accent),transparent 42%); }
    .ready-title { position:relative; margin-top:30px; color:#fff; font:45px VT323,monospace; }
    .ready-sub { position:relative; color:var(--accent); font:27px VT323,monospace; letter-spacing:2px; }
    .connection-pill { position:relative; display:flex;align-items:center;gap:10px;margin-top:34px;padding:10px 18px;border-radius:999px;background:rgba(88,244,124,.08);border:1px solid rgba(88,244,124,.32);color:#82f59d;font:18px VT323,monospace;letter-spacing:1px; }
    .warning-ring { width:210px;height:210px;border-radius:50%;display:grid;place-items:center;border:12px solid rgba(255,207,90,.18);box-shadow:0 0 0 2px #ffcf5a inset,0 0 46px rgba(255,207,90,.35); }
    .warning-ring span { font:115px VT323,monospace;color:#ffcf5a; }
    .warning-title { margin-top:25px;font:49px VT323,monospace;color:#fff;letter-spacing:3px; }
    .warning-sub { font:24px VT323,monospace;color:#ffcf5a;letter-spacing:2px; }
    .sequence-mini,.sequence-dots { display:flex;gap:15px;margin-top:32px; }
    .sequence-mini i { width:26px;height:26px;border-radius:50%;box-shadow:0 0 14px currentColor; }
    .sequence-mini i:nth-child(1){background:#ff4352;color:#ff4352}.sequence-mini i:nth-child(2){background:#36dfff;color:#36dfff}.sequence-mini i:nth-child(3){background:#58f47c;color:#58f47c}.sequence-mini i:nth-child(4){background:#fff;color:#fff}
    .color-burst { position:absolute;width:570px;height:570px;border-radius:50%;background:repeating-conic-gradient(from 5deg,transparent 0 8deg,color-mix(in srgb,var(--burst),transparent 86%) 9deg 14deg,transparent 15deg 23deg); }
    .color-disc { position:relative;width:290px;height:290px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 38% 32%,color-mix(in srgb,var(--active),white 55%) 0 4%,var(--active) 28%,color-mix(in srgb,var(--active),black 55%) 100%);border:5px solid color-mix(in srgb,var(--active),white 30%);box-shadow:0 0 36px var(--active),0 0 100px color-mix(in srgb,var(--active),transparent 35%); }
    .color-disc span { color:${scene.colorName === "BLANCO" ? "#111" : "#fff"};font:54px VT323,monospace;letter-spacing:3px;text-shadow:${scene.colorName === "BLANCO" ? "none" : "0 3px 0 rgba(0,0,0,.45)"}; }
    .sequence-dots { position:relative; }
    .sequence-dots i { width:32px;height:10px;border-radius:10px;background:rgba(255,255,255,.15); }
    .sequence-dots i.done { background:var(--dot);box-shadow:0 0 13px var(--dot); }
    .confirm-flow { width:100%;display:flex;flex-direction:column;align-items:center;gap:14px; }
    .confirm-step { width:100%;padding:18px;border:1px solid rgba(255,255,255,.16);border-radius:13px;background:rgba(255,255,255,.045); }
    .confirm-step small,.verified-card small { display:block;color:#9ab0bf;font:18px VT323,monospace;letter-spacing:2px;margin-bottom:10px; }
    .confirm-step button { width:100%;border:0;border-radius:11px;padding:18px;color:#04110a;background:linear-gradient(90deg,#58f47c,#9affce);font:31px VT323,monospace;box-shadow:0 0 28px rgba(88,244,124,.4); }
    .confirm-arrow { color:#70ff9a;font-size:35px;line-height:1; }
    .verified-card { width:100%;display:grid;grid-template-columns:68px 1fr;align-items:center;text-align:left;padding:18px;border:1px solid rgba(112,255,154,.45);border-radius:13px;background:rgba(65,220,115,.1);box-shadow:0 0 28px rgba(88,244,124,.15); }
    .verified-card>b { width:52px;height:52px;border-radius:50%;display:grid;place-items:center;color:#06140b;background:#70ff9a;font-size:32px;box-shadow:0 0 20px rgba(112,255,154,.55); }
    .verified-card small { margin:0; }
    .verified-card strong { color:#9affb9;font:30px/1 VT323,monospace;font-weight:400;letter-spacing:1px; }
    .connection-pill--verified { margin-top:20px;font-size:16px; }
  </style></head><body>
    <main class="stage">
      <header class="chrome"><div class="brand"><img src="${logoData}" alt=""><span>SCRIB</span><b>· MUSA</b></div></header>
      <section class="layout">
        <div class="copy"><div class="eyebrow">${escapeHtml(scene.eyebrow)}</div><h1>${title}</h1><p class="note">${escapeHtml(scene.note)}</p></div>
        <div class="device-wrap"><div class="device-shadow"></div><div class="phone"><div class="screen">${phoneScreen(scene)}</div></div></div>
      </section>
    </main>
  </body></html>`;
}

async function main() {
  fs.mkdirSync(scenesDir, { recursive: true });
  fs.mkdirSync(textDir, { recursive: true });
  fs.mkdirSync(path.dirname(vttPath), { recursive: true });

  const logoData = `data:image/png;base64,${fs.readFileSync(path.join(ROOT, "img/logo.png")).toString("base64")}`;
  const fontData = fs.readFileSync(path.join(ROOT, "game/css/fonts/VT323-Regular.ttf")).toString("base64");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  try {
    for (const scene of scenes) {
      await page.setContent(sceneHtml(scene, logoData, fontData), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(scenesDir, `${scene.key}.png`), type: "png" });
      fs.writeFileSync(path.join(textDir, `${scene.key}.txt`), `${scene.caption}\n`, "utf8");
    }
  } finally {
    await browser.close();
  }

  const manifest = scenes.map((scene) => ({
    ...scene,
    image: path.join(scenesDir, `${scene.key}.png`),
    narration: path.join(textDir, `${scene.key}.txt`)
  }));
  fs.writeFileSync(path.join(buildDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const vtt = ["WEBVTT", ""].concat(scenes.flatMap((scene) => [
    `${timestamp(scene.start)} --> ${timestamp(scene.start + scene.duration)}`,
    scene.caption,
    ""
  ])).join("\n");
  fs.writeFileSync(vttPath, vtt, "utf8");

  const srt = scenes.flatMap((scene, index) => [
    String(index + 1),
    `${timestamp(scene.start, ",")} --> ${timestamp(scene.start + scene.duration, ",")}`,
    scene.caption,
    ""
  ]).join("\n");
  fs.writeFileSync(path.join(buildDir, "captions.srt"), `${srt}\n`, "utf8");

  const assTimestamp = (seconds) => {
    const centiseconds = Math.round(seconds * 100);
    const hours = Math.floor(centiseconds / 360000);
    const minutes = Math.floor((centiseconds % 360000) / 6000);
    const secs = Math.floor((centiseconds % 6000) / 100);
    const cs = centiseconds % 100;
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };
  const escapeAss = (value) => String(value)
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\r?\n/g, "\\N");
  const assHeader = `[Script Info]
Title: SCRIB · Acceso y verificación de musa
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Arial,46,&H00FFFFFF,&H00FFFFFF,&H00101820,&H78050A10,-1,0,0,0,100,100,0,0,3,1,0,2,190,190,90,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
  const assEvents = scenes.map((scene) =>
    `Dialogue: 0,${assTimestamp(scene.start)},${assTimestamp(scene.start + scene.duration)},Caption,,0,0,0,,${escapeAss(scene.burnedCaption || scene.caption)}`
  ).join("\n");
  fs.writeFileSync(path.join(buildDir, "captions.ass"), `${assHeader}\n${assEvents}\n`, "utf8");
  process.stdout.write(`${buildDir}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
