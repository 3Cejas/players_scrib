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
  { key: "00-bienvenida", start: 0, duration: 8, leadMs: 260, caption: "¡Hola! Bienvenida a SCRIB. Nos alegra que estés aquí.", narration: "¡Hola! Bienvenida a Escrib. Qué alegría tenerte aquí.", voiceRate: "-3%", voicePitch: "+3Hz", eyebrow: "TE DAMOS LA BIENVENIDA", title: "¡HOLA, MUSA!", note: "Vamos a preparar tu móvil con calma para que puedas participar.", screen: "welcome" },
  { key: "01-acceso", start: 8, duration: 10, leadMs: 320, caption: "Entra en scribshow.es/musa o escanea el código QR.", narration: "Para empezar, entra en scribshow punto es, barra musa. Si te resulta más cómodo, escanea el código QR.", voiceRate: "-4%", voicePitch: "+2Hz", eyebrow: "PASO 1 · CONEXIÓN", title: "ENTRA O\nESCANEA", note: "Elige la opción que te resulte más cómoda.", screen: "welcome", showQr: true },
  { key: "02-espera-acceso", start: 18, duration: 9, leadMs: 420, caption: "¿Ya lo has escaneado? Tómate tu tiempo.", narration: "¿Ya lo has escaneado? No pasa nada. Tómate tu tiempo. El código seguirá aquí.", voiceRate: "-4%", voicePitch: "+3Hz", eyebrow: "SEGUIMOS AQUÍ", title: "¿YA LO HAS\nESCANEADO?", note: "Puedes escanear el QR o escribir el enlace en tu navegador.", screen: "welcome", showQr: true },
  { key: "03-acceso-listo", start: 27, duration: 9, leadMs: 420, caption: "¿Ya estás dentro? ¡Genial! Pasemos a lo siguiente.", narration: "¿Ya estás dentro? ¡Genial! Pasemos a lo siguiente.", voiceRate: "-3%", voicePitch: "+4Hz", eyebrow: "TODO PREPARADO", title: "¡GENIAL!", note: "Ya podemos continuar con el siguiente paso.", screen: "welcome", showQr: true },
  { key: "04-omitir", start: 36, duration: 9, leadMs: 320, caption: "En la bienvenida, pulsa OMITIR TUTORIAL.", narration: "En la bienvenida, pulsa omitir tutorial.", voiceRate: "-3%", voicePitch: "+2Hz", eyebrow: "PASO 2 · ACCESO RÁPIDO", title: "PULSA\n“OMITIR TUTORIAL”", note: "Ese botón te lleva directamente a elegir tu nombre.", screen: "skip" },
  { key: "05-nombre", start: 45, duration: 9, leadMs: 320, caption: "Escribe tu nombre de musa y avanza con la flecha azul.", narration: "Escribe tu nombre de musa, y avanza con la flecha azul.", voiceRate: "-3%", voicePitch: "+2Hz", eyebrow: "PASO 3 · NOMBRE", title: "ESCRIBE CÓMO\nQUIERES APARECER", note: "Este es el nombre que verá el público con tus mensajes.", screen: "name" },
  { key: "06-asignacion", start: 54, duration: 9, leadMs: 320, caption: "Pulsa DESCUBRIR MI EQUIPO para saber cuál te ha tocado.", narration: "Pulsa descubrir mi equipo para saber cuál te ha tocado.", voiceRate: "-3%", voicePitch: "+2Hz", eyebrow: "PASO 4 · EQUIPO", title: "DESCUBRE\nTU EQUIPO", note: "La pantalla te mostrará si eres del equipo azul o del equipo rojo.", screen: "assignment" },
  { key: "07-resultado", start: 63, duration: 9, leadMs: 320, caption: "Aquí aparecen tu equipo y tu escritxr. Después, entra al juego.", narration: "Verás tu equipo y quién escribe contigo. Después, entra.", voiceRate: "-2%", voicePitch: "+1Hz", eyebrow: "PASO 5 · RESULTADO", title: "REVISA TU EQUIPO\nY TU ESCRITXR", note: "Lee ambos datos y, cuando estés preparada, entra al juego.", screen: "reveal" },
  { key: "08-aviso", start: 72, duration: 7, leadMs: 260, caption: "¡Muy bien! Ahora vamos a probar los colores.", narration: "¡Muy bien! Ahora, juguemos un poco con los colores.", voiceRate: "-2%", voicePitch: "+4Hz", eyebrow: "PRUEBA DE PANTALLA", title: "MIRA TU MÓVIL", note: "Vamos a comprobar que la pantalla responde correctamente.", screen: "warning", remaining: "00:48" },
  { key: "09-rojo", start: 79, duration: 6, leadMs: 520, caption: "¡Primera prueba! ¿Ves la pantalla roja?", narration: "¡Primera prueba! ¿Ves la pantalla roja?", voiceRate: "-4%", voicePitch: "+5Hz", eyebrow: "COLOR 1 DE 4", title: "ROJO", note: "¿Se ha teñido todo de rojo?", screen: "color", colorName: "ROJO", color: "#f20d35", remaining: "00:41" },
  { key: "10-azul", start: 85, duration: 6, leadMs: 520, caption: "¿Ha cambiado? Ahora debería verse azul.", narration: "¿Ha cambiado? Ahora debería verse azul.", voiceRate: "-4%", voicePitch: "+5Hz", eyebrow: "COLOR 2 DE 4", title: "AZUL", note: "¿Ha funcionado el cambio?", screen: "color", colorName: "AZUL", color: "#0965ff", remaining: "00:35" },
  { key: "11-verde", start: 91, duration: 6, leadMs: 520, caption: "¡Vamos bien! ¿Ya ves el verde?", narration: "¡Vamos bien! ¿Ya ves el verde?", voiceRate: "-4%", voicePitch: "+5Hz", eyebrow: "COLOR 3 DE 4", title: "VERDE", note: "Solo queda un color más.", screen: "color", colorName: "VERDE", color: "#00b65c", remaining: "00:29" },
  { key: "12-blanco", start: 97, duration: 6, leadMs: 520, caption: "Y por último, blanco. ¿Ha funcionado?", narration: "Y por último, blanco. ¿Ha funcionado?", voiceRate: "-4%", voicePitch: "+5Hz", eyebrow: "COLOR 4 DE 4", title: "BLANCO", note: "¿Has visto los cuatro colores?", screen: "color", colorName: "BLANCO", color: "#ffffff", remaining: "00:23" },
  { key: "13-verificada", start: 103, duration: 8, leadMs: 300, caption: "¿Has visto los cuatro colores? ¡Genial! La prueba ha funcionado.", narration: "¿Has visto los cuatro colores? ¡Genial! La prueba ha funcionado.", voiceRate: "-3%", voicePitch: "+4Hz", eyebrow: "PRUEBA COMPLETADA", title: "¡HA\nFUNCIONADO!", note: "Tu pantalla responde y ya está preparada.", screen: "verified", remaining: "00:17" },
  { key: "14-despedida", start: 111, duration: 9, leadMs: 260, caption: "Gracias por acompañarnos. ¡Nos vemos dentro!", narration: "Gracias por acompañarnos. ¡Disfruta, y nos vemos dentro!", voiceRate: "-2%", voicePitch: "+4Hz", eyebrow: "YA ESTÁS PREPARADA", title: "¡GRACIAS,\nMUSA!", note: "Disfruta, participa y ayuda a dar vida a la historia.", screen: "verified", remaining: "00:09" }
];

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function timestamp(seconds, decimal = ".") {
  const millis = Math.round(seconds * 1000);
  const hours = Math.floor(millis / 3600000);
  const minutes = Math.floor((millis % 3600000) / 60000);
  const secs = Math.floor((millis % 60000) / 1000);
  const ms = millis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}${decimal}${String(ms).padStart(3, "0")}`;
}

function realScreen(scene, assets) {
  const logos = `<div class="real-logos"><img src="${assets.logo}" alt=""><img class="sutura" src="${assets.sutura}" alt=""></div>`;
  if (scene.screen === "welcome" || scene.screen === "skip") {
    return `<div class="real-page real-page--welcome"><h2><span class="orange">MUSA</span>, BIENVENIDA A <span class="cyan">&lt;SCRI&gt; B</span></h2><img class="welcome-logo" src="${assets.logo}" alt=""><div class="welcome-actions"><button class="skip-button">Omitir tutorial</button><span class="start-label">COMENZAR</span><i class="arrow arrow--down"></i></div></div>`;
  }
  if (scene.screen === "name") {
    return `<div class="real-page real-page--name">${logos}<i class="arrow arrow--up"></i><h2>¿CUÁL SERÁ TU NOMBRE?</h2><div class="real-input">LUNA<span></span></div><i class="arrow arrow--down"></i></div>`;
  }
  if (scene.screen === "assignment") {
    return `<div class="real-page real-page--assignment">${logos}<i class="arrow arrow--up"></i><h2><span class="orange">LUNA</span>,<br>DESCUBRE TU EQUIPO</h2><p>Pulsa el botón para saber si te ha tocado el equipo azul o el rojo.</p><div class="balance"><div class="team team--blue"><img src="${assets.plumeBlue}" alt=""><span>AZUL</span></div><b>⇄</b><div class="team team--red"><img src="${assets.plumeRed}" alt=""><span>ROJO</span></div></div><button class="discover">DESCUBRIR MI EQUIPO</button><small>Verás el resultado antes de entrar al juego.</small></div>`;
  }
  if (scene.screen === "reveal") {
    return `<div class="boot-overlay"><div class="boot-panel"><div class="boot-kicker">ASIGNACIÓN DE MUSA</div><h2>¡EQUIPO ASIGNADO!</h2><p>Tu equipo: AZUL. Tu escritxr: ALEX.</p><div class="arena"><div class="arena-team"><img src="${assets.plumeBlue}" alt=""><span>AZUL</span></div><div class="result"><small>TU EQUIPO</small><strong>AZUL</strong><small>TU ESCRITXR</small><b>ALEX</b></div><div class="arena-team arena-team--red"><img src="${assets.plumeRed}" alt=""><span>ROJO</span></div></div><div class="boot-status"><span>Equipo asignado · acceso autorizado</span><b>100%</b></div><div class="boot-bar"><i></i></div><button class="enter">ENTRAR AL JUEGO</button></div></div>`;
  }

  const phaseClass = scene.screen === "color" ? " calibration--color" : "";
  const phaseStyle = scene.color ? ` style="--phase-color:${scene.color}"` : "";
  const title = scene.screen === "warning" ? "PREPARA TU PANTALLA" : scene.screen === "verified" ? "CONFIGURACIÓN VERIFICADA" : scene.colorName;
  const copy = scene.screen === "warning" ? "Ahora comprobaremos juntos el color y el brillo." : scene.screen === "verified" ? "Tu dispositivo está conectado y listo para inspirar." : "";
  return `<div class="calibration${phaseClass}${scene.screen === "verified" ? " calibration--verified" : ""}"${phaseStyle}><div class="calibration-grid"></div><div class="calibration-card">${scene.screen === "verified" ? '<div class="verified-check">✓</div>' : ""}${scene.screen !== "color" ? `<span class="calibration-kicker">${scene.screen === "verified" ? "TODO FUNCIONA" : "PRUEBA DE CONEXIÓN"}</span>` : ""}<h2>${title}</h2>${copy ? `<p>${copy}</p>` : ""}${scene.screen !== "color" ? '<div class="identity">LUNA · EQUIPO AZUL · ESCRITXR: ALEX</div>' : ""}<small class="device-time">${scene.remaining || (scene.screen === "warning" ? "00:30" : "00:04")}</small></div></div>`;
}

function sceneHtml(scene, assets) {
  const accent = scene.color || (scene.screen === "verified" ? "#70ff9a" : "#45e6ff");
  const title = scene.title.split("\n").map(escapeHtml).join("<br>");
  const qrBlock = scene.showQr
    ? `<div class="access-qr"><img src="${assets.qr}" alt="Código QR para scribshow.es/musa"><div><strong>scribshow.es/musa</strong><span>Escanea el código o escribe el enlace.</span></div></div>`
    : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    @font-face{font-family:VT323;src:url(data:font/ttf;base64,${assets.vtFont}) format("truetype")}@font-face{font-family:Retro;src:url(data:font/ttf;base64,${assets.retroFont}) format("truetype")}
    *{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#03060c}body{font-family:Arial,sans-serif;color:#f5fbff}.stage{--accent:${accent};position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 78% 46%,color-mix(in srgb,var(--accent),transparent 82%),transparent 32%),radial-gradient(circle at 14% 9%,rgba(189,162,255,.16),transparent 30%),linear-gradient(135deg,#050912,#06131c 52%,#08070e)}.stage:before{content:"";position:absolute;inset:0;opacity:.13;background:repeating-linear-gradient(0deg,transparent 0 5px,rgba(255,255,255,.06) 6px);mix-blend-mode:screen}.stage:after{content:"";position:absolute;width:850px;height:850px;border:1px solid color-mix(in srgb,var(--accent),transparent 80%);border-radius:50%;right:-260px;top:90px;box-shadow:0 0 90px color-mix(in srgb,var(--accent),transparent 85%)}
    .chrome{position:absolute;left:72px;top:42px;z-index:3;height:72px;display:flex;align-items:center}.brand{display:flex;align-items:center;gap:18px;font:34px VT323,monospace;letter-spacing:4px}.brand img{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 0 12px var(--accent))}.brand b{color:var(--accent);font-weight:400}.layout{position:absolute;z-index:2;left:120px;right:120px;top:150px;bottom:130px;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:100px}.copy{padding-left:42px}.eyebrow{display:inline-flex;align-items:center;gap:12px;font:29px VT323,monospace;letter-spacing:3px;color:var(--accent);border:1px solid color-mix(in srgb,var(--accent),transparent 35%);background:color-mix(in srgb,var(--accent),transparent 91%);box-shadow:0 0 28px color-mix(in srgb,var(--accent),transparent 88%);padding:10px 18px;border-radius:999px}.eyebrow:before{content:"";width:9px;height:9px;border-radius:50%;background:var(--accent);box-shadow:0 0 14px var(--accent)}.copy h1{margin:32px 0 26px;font:400 78px/.91 VT323,monospace;letter-spacing:3px;text-shadow:4px 4px 0 rgba(255,60,70,.25),-3px -2px 0 rgba(45,220,255,.2),0 0 35px color-mix(in srgb,var(--accent),transparent 78%)}.note{max-width:690px;margin:0;color:#c5d4de;font-size:28px;line-height:1.35}.copy--qr h1{margin:18px 0 12px;font-size:62px}.copy--qr .note{font-size:22px}.access-qr{max-width:740px;margin-top:18px;padding:16px 18px;display:grid;grid-template-columns:203px 1fr;align-items:center;gap:22px;border:1px solid rgba(85,244,255,.5);border-radius:22px;background:rgba(3,14,22,.86);box-shadow:0 0 34px rgba(85,244,255,.16)}.access-qr img{width:203px;height:203px;border-radius:0;background:#fff;image-rendering:pixelated}.access-qr div{min-width:0;display:grid;gap:11px}.access-qr strong{color:#fff;font:41px VT323,monospace;letter-spacing:1px;white-space:nowrap}.access-qr span{color:#bcd2df;font-size:20px;line-height:1.35}
    .device-wrap{position:relative;display:flex;justify-content:center;align-items:center;min-height:790px}.device-shadow{position:absolute;width:520px;height:140px;bottom:10px;border-radius:50%;background:color-mix(in srgb,var(--accent),transparent 78%);filter:blur(48px);opacity:.55}.phone{position:relative;width:418px;height:770px;padding:18px;border-radius:54px;background:linear-gradient(145deg,#25313d,#070a0f 35%,#202935);box-shadow:0 0 0 2px rgba(255,255,255,.24),0 28px 70px rgba(0,0,0,.65),0 0 50px color-mix(in srgb,var(--accent),transparent 83%)}.phone:before{content:"";position:absolute;left:50%;top:12px;transform:translateX(-50%);width:112px;height:22px;border-radius:0 0 14px 14px;background:#05070a;z-index:4}.screen{position:relative;width:100%;height:100%;border-radius:39px;overflow:hidden;background:#073e55;border:1px solid rgba(255,255,255,.08);font-family:Retro,VT323,monospace}.screen:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(255,255,255,.027) 4px)}
    .real-page{position:absolute;inset:0;padding:45px 24px 30px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:radial-gradient(circle at 22% 12%,rgba(0,245,255,.18),transparent 38%),radial-gradient(circle at 80% 80%,rgba(255,70,80,.14),transparent 36%),linear-gradient(180deg,#08435a,#062f42)}.real-page h2{margin:0;color:#fff;font:24px/1.24 Retro,monospace;letter-spacing:.05em;text-shadow:2px 2px #000}.orange{color:orange}.cyan{color:#00f5ff;text-shadow:-2px 0 #ff3c3c,0 0 12px rgba(0,245,255,.65)}.real-page--welcome h2{max-width:330px;font-size:27px}.welcome-logo{width:100px;margin-top:42px;filter:drop-shadow(0 0 16px rgba(0,245,255,.45))}.welcome-actions{position:absolute;left:0;right:0;bottom:36px;display:flex;flex-direction:column;align-items:center;gap:11px}.skip-button{padding:9px 20px;border:1px solid rgba(99,231,255,.65);border-radius:999px;color:#eafcff;background:linear-gradient(135deg,rgba(99,231,255,.22),rgba(255,91,91,.12));font:12px Retro,monospace;letter-spacing:.08em}.start-label{color:#00f5ff;font:14px Retro,monospace;letter-spacing:.12em;text-shadow:0 0 10px rgba(0,245,255,.6)}
    .real-logos{position:absolute;top:38px;left:22px;right:22px;display:flex;align-items:center;justify-content:space-between}.real-logos img{width:54px}.real-logos .sutura{width:42px}.arrow{display:block;width:55px;height:32px;position:relative}.arrow:before,.arrow:after{content:"";position:absolute;top:50%;width:75%;height:7px;border-radius:99px;background:currentColor;box-shadow:0 0 13px currentColor}.arrow--down{color:#00f5ff}.arrow--down:before{left:50%;transform:translate(-82%,-50%) rotate(25deg)}.arrow--down:after{left:50%;transform:translate(-18%,-50%) rotate(-25deg)}.arrow--up{color:#ff4b4b}.arrow--up:before{left:50%;transform:translate(-82%,-50%) rotate(-25deg)}.arrow--up:after{left:50%;transform:translate(-18%,-50%) rotate(25deg)}.real-page--name{gap:36px}.real-page--name>.arrow--up{position:absolute;top:95px}.real-page--name>.arrow--down{position:absolute;bottom:26px}.real-page--name h2{font-size:24px}.real-input{width:100%;padding:18px;border:2px solid #00f5ff;border-radius:10px;color:orange;background:rgba(0,0,0,.18);font:35px Retro,monospace;box-shadow:0 0 20px rgba(0,245,255,.28)}.real-input span{display:inline-block;width:3px;height:32px;margin-left:5px;vertical-align:middle;background:#00f5ff}
    .real-page--assignment{justify-content:flex-start;padding-top:112px;gap:15px}.real-page--assignment>.arrow{position:absolute;top:91px}.real-page--assignment h2{font-size:18px}.real-page--assignment p{margin:0;color:#eaf7ff;font:12px/1.45 Arial,sans-serif}.balance{width:100%;display:grid;grid-template-columns:1fr 32px 1fr;align-items:center;gap:5px}.team{min-height:92px;padding:9px;display:grid;place-items:center;border:1px solid rgba(0,245,255,.4);border-radius:12px;background:rgba(0,160,220,.12);color:#5eeeff}.team--red{border-color:rgba(255,76,76,.48);background:rgba(210,25,36,.12);color:#ff5d68}.team img{height:42px}.team span{font:14px Retro,monospace}.balance>b{color:#fff;font-size:25px}.discover,.enter{border:0;border-radius:10px;padding:15px 18px;color:#041117;background:linear-gradient(90deg,#4cecff,#a4ffd9);font:13px Retro,monospace;box-shadow:0 8px 26px rgba(0,238,255,.27)}.real-page--assignment small{color:#a9c0cf;font:9px/1.35 Retro,monospace}
    .boot-overlay{position:absolute;inset:0;padding:44px 12px 14px;display:grid;place-items:center;background:linear-gradient(180deg,rgba(3,8,14,.98),#020408);--boot:#46eaff}.boot-panel{width:100%;padding:15px 12px;display:grid;gap:10px;border:1px solid color-mix(in srgb,var(--boot),transparent 44%);border-radius:18px;background:linear-gradient(145deg,rgba(5,12,22,.96),rgba(5,7,14,.98));box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 0 28px rgba(70,234,255,.14);text-align:center}.boot-kicker{color:#78efff;font:8px Retro,monospace;letter-spacing:.18em}.boot-panel h2{margin:0;color:#fff;font:21px Retro,monospace;letter-spacing:.08em;text-shadow:-2px 0 rgba(70,234,255,.6)}.boot-panel>p{margin:0;color:#dcebf5;font:10px/1.45 Arial,sans-serif}.arena{position:relative;min-height:210px;padding:12px 5px;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:36px;border:1px solid rgba(70,234,255,.25);border-radius:14px;background:rgba(0,0,0,.26)}.arena-team{min-height:105px;padding:10px;display:grid;place-items:center;border:1px solid rgba(70,234,255,.32);border-radius:12px;color:#54eaff;background:rgba(28,160,215,.1)}.arena-team--red{color:#ff5966;border-color:rgba(255,75,84,.35);background:rgba(190,30,45,.1)}.arena-team img{height:44px}.arena-team span{font:11px Retro,monospace}.result{position:absolute;left:50%;top:50%;z-index:2;width:72%;padding:12px;display:grid;transform:translate(-50%,-50%);border:1px solid rgba(70,234,255,.7);border-radius:12px;background:rgba(4,12,20,.96);box-shadow:0 0 24px rgba(70,234,255,.28)}.result small{color:#9cb5c5;font:8px Retro,monospace}.result strong{color:#54eaff;font:25px Retro,monospace}.result b{color:#fff;font:18px Retro,monospace}.boot-status{display:flex;justify-content:space-between;gap:8px;color:#dcecf4;font:8px Retro,monospace;letter-spacing:.04em}.boot-status b{color:#75efff}.boot-bar{height:10px;border:1px solid rgba(70,234,255,.48);border-radius:99px;overflow:hidden;background:rgba(255,255,255,.05)}.boot-bar i{display:block;width:100%;height:100%;background:linear-gradient(90deg,#46eaff,#fff,#6fffc0)}.enter{justify-self:center;padding:12px 20px}
    .calibration{position:absolute;inset:0;padding:46px 18px 28px;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#102536,#02060b 72%);font-family:Retro,monospace}.calibration-grid{position:absolute;inset:0;opacity:.22;background-image:linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px);background-size:27px 27px;mask-image:radial-gradient(circle,#000,transparent 78%)}.calibration-card{position:relative;z-index:1;width:100%;padding:28px 20px;display:grid;justify-items:center;gap:14px;border:1px solid rgba(255,255,255,.25);border-radius:24px;text-align:center;background:rgba(3,10,17,.78);box-shadow:0 24px 70px rgba(0,0,0,.45),inset 0 0 30px rgba(85,244,255,.06)}.calibration-kicker{color:#55f4ff;font-size:9px;letter-spacing:.13em}.calibration h2{max-width:13ch;margin:0;color:#fff;font:27px/1.06 Retro,monospace;letter-spacing:.03em}.calibration p{margin:0;color:rgba(255,255,255,.78);font:13px/1.45 Arial,sans-serif}.identity{color:#55f4ff;font:9px/1.45 Retro,monospace;letter-spacing:.05em}.device-time{color:rgba(255,255,255,.52);font:9px Arial,sans-serif;letter-spacing:.13em}.calibration--color{background:var(--phase-color);padding:46px 18px 28px}.calibration--color .calibration-grid{display:none}.calibration--color .calibration-card{width:auto;padding:18px 24px;background:rgba(0,0,0,.68);border-color:rgba(255,255,255,.7)}.calibration--color h2{font-size:31px}.calibration--verified{background:radial-gradient(circle at 50% 35%,#0a4027,#020b07 70%)}.calibration--verified h2{color:#4dff9a}.verified-check{width:74px;height:74px;display:grid;place-items:center;border:2px solid #4dff9a;border-radius:50%;color:#4dff9a;font:42px Arial,sans-serif;box-shadow:0 0 30px rgba(77,255,154,.42)}
  </style></head><body><main class="stage"><header class="chrome"><div class="brand"><img src="${assets.logo}" alt=""><span>SCRIB</span><b>· MUSA</b></div></header><section class="layout"><div class="copy${scene.showQr ? " copy--qr" : ""}"><div class="eyebrow">${escapeHtml(scene.eyebrow)}</div><h1>${title}</h1><p class="note">${escapeHtml(scene.note)}</p>${qrBlock}</div><div class="device-wrap"><div class="device-shadow"></div><div class="phone"><div class="screen">${realScreen(scene, assets)}</div></div></div></div></section></main></body></html>`;
}

function dataUrl(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  const extension = path.extname(fullPath).toLowerCase();
  const mime = extension === ".jpg" || extension === ".jpeg"
    ? "image/jpeg"
    : (extension === ".svg" ? "image/svg+xml" : "image/png");
  return `data:${mime};base64,${fs.readFileSync(fullPath).toString("base64")}`;
}

async function main() {
  fs.mkdirSync(scenesDir, { recursive: true });
  fs.mkdirSync(textDir, { recursive: true });
  fs.mkdirSync(path.dirname(vttPath), { recursive: true });
  const assets = {
    logo: dataUrl("img/logo.png"),
    sutura: dataUrl("img/logo_sutura.png"),
    plumeBlue: dataUrl("game/public/img/pluma_azul.png"),
    plumeRed: dataUrl("game/public/img/pluma_roja.png"),
    qr: dataUrl("game/media/scribshow-musa-qr.svg"),
    vtFont: fs.readFileSync(path.join(ROOT, "game/css/fonts/VT323-Regular.ttf")).toString("base64"),
    retroFont: fs.readFileSync(path.join(ROOT, "game/css/fonts/Retro Gaming.ttf")).toString("base64")
  };
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  try {
    for (const scene of scenes) {
      await page.setContent(sceneHtml(scene, assets), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(scenesDir, `${scene.key}.png`), type: "png" });
      fs.writeFileSync(path.join(textDir, `${scene.key}.txt`), `${scene.narration || scene.caption}\n`, "utf8");
    }
  } finally {
    await browser.close();
  }
  const manifest = scenes.map((scene) => ({
    ...scene,
    image: path.join(scenesDir, `${scene.key}.png`),
    narrationPath: path.join(textDir, `${scene.key}.txt`)
  }));
  fs.writeFileSync(path.join(buildDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const vtt = ["WEBVTT", ""].concat(scenes.flatMap((scene) => [`${timestamp(scene.start)} --> ${timestamp(scene.start + scene.duration)}`, scene.caption, ""])).join("\n");
  fs.writeFileSync(vttPath, vtt, "utf8");
  const srt = scenes.flatMap((scene, index) => [String(index + 1), `${timestamp(scene.start, ",")} --> ${timestamp(scene.start + scene.duration, ",")}`, scene.caption, ""]).join("\n");
  fs.writeFileSync(path.join(buildDir, "captions.srt"), `${srt}\n`, "utf8");
  const assTimestamp = (seconds) => {
    const centiseconds = Math.round(seconds * 100);
    const hours = Math.floor(centiseconds / 360000);
    const minutes = Math.floor((centiseconds % 360000) / 6000);
    const secs = Math.floor((centiseconds % 6000) / 100);
    const cs = centiseconds % 100;
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };
  const escapeAss = (value) => String(value).replace(/\\/g, "\\\\").replace(/{/g, "\\{").replace(/}/g, "\\}").replace(/\r?\n/g, "\\N");
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
  const assEvents = scenes.map((scene) => `Dialogue: 0,${assTimestamp(scene.start)},${assTimestamp(scene.start + scene.duration)},Caption,,0,0,0,,${escapeAss(scene.burnedCaption || scene.caption)}`).join("\n");
  fs.writeFileSync(path.join(buildDir, "captions.ass"), `${assHeader}\n${assEvents}\n`, "utf8");
  process.stdout.write(`${buildDir}\n`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
