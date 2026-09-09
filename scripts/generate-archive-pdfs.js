#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const puppeteer = require("puppeteer");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "archivo", "data", "textos.json");
const outputDir = path.join(root, "archivo", "pdf");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function assetData(mime, data) {
  return `data:${mime};base64,${data.toString("base64")}`;
}

function paragraphHtml(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => {
      const direction = /^\s*\(/.test(paragraph) ? " class=\"direction\"" : "";
      return `<p${direction}>${escapeHtml(paragraph)}</p>`;
    })
    .join("\n");
}

function documentHtml(entry, assets) {
  const statBits = [
    `${entry.wordCount.toLocaleString("es-ES")} PALABRAS`,
    entry.stats && entry.stats.duration ? `${escapeHtml(entry.stats.duration)} EN DIRECTO` : "ESCRITURA EN VIVO",
    entry.stats && entry.stats.rhythm ? escapeHtml(entry.stats.rhythm.toUpperCase()) : ""
  ].filter(Boolean);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(entry.author)} · &lt;SCRI&gt; B</title>
<style>
@font-face{font-family:Retro;src:url(${assets.retro}) format("truetype")}
@font-face{font-family:VT;src:url(${assets.vt}) format("truetype")}
@page{size:A4;margin:19mm 18mm 20mm}
*{box-sizing:border-box}
html{background:#f2efe7;color:#182026}
body{margin:0;font:14.4pt/1.46 VT,monospace;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.title-card{position:relative;margin:0 0 13mm;padding:13mm 12mm 11mm;overflow:hidden;border:.35mm solid #222b38;background:linear-gradient(120deg,#061a27 0%,#07111d 48%,#241018 100%);color:#fff;break-inside:avoid}
.title-card:before{content:"";position:absolute;inset:auto auto -30mm -22mm;width:72mm;height:72mm;border:1px solid rgba(28,215,239,.22);border-radius:50%}
.title-card:after{content:"";position:absolute;right:-20mm;top:-32mm;width:76mm;height:76mm;border:1px solid rgba(255,82,106,.25);border-radius:50%}
.brand{position:relative;z-index:1;display:flex;align-items:center;gap:4mm;margin-bottom:13mm;color:#89effa;font:6.8pt Retro,monospace;letter-spacing:.16em}
.brand img{width:13mm;height:13mm;object-fit:contain;filter:drop-shadow(0 0 3mm rgba(34,224,246,.24))}
.brand strong{display:block;color:#fff;font-size:8pt}.brand small{display:block;margin-top:1.2mm}
.eyebrow{position:relative;z-index:1;margin:0 0 3mm;color:#ffcf68;font:6.5pt Retro,monospace;letter-spacing:.14em}
h1{position:relative;z-index:1;margin:0;max-width:145mm;font:22pt/1.18 Retro,monospace;overflow-wrap:anywhere;text-shadow:1.1mm 0 0 rgba(30,221,241,.18),-1.1mm 0 0 rgba(255,76,99,.18)}
.date{position:relative;z-index:1;margin:4mm 0 0;color:#cbd6dc;font-size:14pt}
.stats{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:2.5mm;margin:9mm 0 0;padding:0;list-style:none}
.stats li{padding:2.4mm 3mm;border:.2mm solid rgba(109,225,238,.22);background:rgba(0,0,0,.28);font:5.7pt Retro,monospace;color:#cfeef1;letter-spacing:.05em}
.manuscript{font-size:14.4pt}.manuscript p{margin:0 0 5.5mm;orphans:3;widows:3}.manuscript p:first-child:not(.direction):first-letter{float:left;margin:2mm 2.6mm 0 0;color:#087998;font:31pt/.72 Retro,monospace;text-shadow:1mm 1mm 0 rgba(255,82,106,.2)}
.manuscript .direction{font-style:italic;color:#43515a}
.end{margin-top:14mm;padding-top:8mm;border-top:.3mm solid #9cb0b8;break-inside:avoid;text-align:center;color:#586870;font:6pt Retro,monospace;letter-spacing:.12em}
.end img{display:block;width:17mm;height:17mm;margin:0 auto 3mm;object-fit:contain;filter:grayscale(1) brightness(.32)}
</style>
</head>
<body>
<header class="title-card">
  <div class="brand"><img src="${assets.logo}" alt=""><span><strong>&lt;SCRI&gt; B</strong><small>ARCHIVO VIVO</small></span></div>
  <p class="eyebrow">TEXTO CREADO EN DIRECTO</p>
  <h1>${escapeHtml(entry.author)}</h1>
  <p class="date">${escapeHtml(entry.dateLabel)}</p>
  <ul class="stats">${statBits.map((stat) => `<li>${stat}</li>`).join("")}</ul>
</header>
<main class="manuscript">${paragraphHtml(entry.text)}</main>
<footer class="end"><img src="${assets.sutura}" alt=""><p>FIN DEL EXPEDIENTE · UN ARCHIVO DE ESCRITURA VIVA</p></footer>
</body>
</html>`;
}

async function main() {
  const data = JSON.parse(await fs.readFile(dataPath, "utf8"));
  const [logo, sutura, retro, vt] = await Promise.all([
    fs.readFile(path.join(root, "img", "logo.png")),
    fs.readFile(path.join(root, "img", "logo_sutura.png")),
    fs.readFile(path.join(root, "game", "css", "fonts", "Retro Gaming.ttf")),
    fs.readFile(path.join(root, "game", "css", "fonts", "VT323-Regular.ttf"))
  ]);
  const assets = {
    logo: assetData("image/png", logo),
    sutura: assetData("image/png", sutura),
    retro: assetData("font/ttf", retro),
    vt: assetData("font/ttf", vt)
  };

  await fs.mkdir(outputDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    for (const [index, entry] of data.entries.entries()) {
      const output = path.join(root, "archivo", entry.pdf);
      await page.setContent(documentHtml(entry, assets), { waitUntil: "load", timeout: 0 });
      await page.evaluate(() => document.fonts.ready);
      await page.pdf({
        path: output,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        tagged: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="box-sizing:border-box;width:100%;margin:0 18mm;padding:0 0 4px;border-bottom:1px solid #1dd8ee;color:#62727a;font:7px monospace;letter-spacing:.08em"><span>&lt;SCRI&gt; B · ARCHIVO VIVO</span><span style="float:right">ESCRITURA IMPROVISADA</span></div>',
        footerTemplate: '<div style="box-sizing:border-box;width:100%;margin:0 18mm;padding:4px 0 0;border-top:1px solid #ff526a;color:#62727a;font:7px monospace;letter-spacing:.08em"><span>SCRIBSHOW.ES/ARCHIVO</span><span style="float:right">PÁGINA <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'
      });
      process.stdout.write(`[${String(index + 1).padStart(2, "0")}/${data.entries.length}] ${path.basename(output)}\n`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
