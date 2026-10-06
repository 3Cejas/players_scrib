#!/usr/bin/env node
// Browser QA against a private local preview: never touches live game sessions.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '.e2e-artifacts/one-player-theme');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const firefox = process.env.SOLO_BROWSER === 'firefox';

async function main() {
  await fs.mkdir(output, { recursive: true });
  const preview = http.createServer(async (request, response) => {
    try {
      let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
      assert.ok(file.startsWith(root + path.sep));
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg' };
      response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      response.end(await fs.readFile(file));
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise(resolve => preview.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${preview.address().port}`;
  let browser;
  const reports = [];
  try {
    browser = await puppeteer.launch({ browser: firefox ? 'firefox' : 'chrome',
      executablePath: firefox ? '/usr/bin/firefox' : '/usr/bin/chromium', headless: true,
      args: firefox ? [] : ['--no-sandbox'] });
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 },
      { width: 820, height: 1180, hasTouch: true }, { width: 390, height: 844, hasTouch: true },
      { width: 320, height: 568, hasTouch: true }].filter(viewport => !process.env.SOLO_WIDTH || viewport.width === Number(process.env.SOLO_WIDTH))) {
      const page = await browser.newPage();
      await page.setViewport(viewport);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const label = `${firefox ? 'firefox' : 'chromium'}-${viewport.width}`;
      const screenshot = name => page.screenshot({ path: path.join(output, `${label}-${name}.png`) });
      const intro = [];
      await page.goto(url + '/1p_scrib/', { waitUntil: 'networkidle2' });
      await screenshot('welcome');
      // Move through the actual onboarding buttons, including validation.
      for (const id of ['intro-que-es', 'intro-tiempo', 'intro-niveles', 'intro-nombre', 'intro-atributos', 'intro-jugar']) {
        if (id === 'intro-atributos') await page.type('#nombre', 'ALVARA');
        if (id === 'intro-jugar') {
          for (const [attribute, value] of [['fuerza', 4], ['agilidad', 3], ['destreza', 3]]) {
            for (let i = 0; i < value; i++) await page.click(`[data-attr="${attribute}"][data-action="increment"]`);
          }
        }
        const current = await page.evaluate(() => obtenerIndiceSeccionActual());
        const sections = await page.$$eval('.intro-section', nodes => nodes.map(node => node.id));
        await page.click(`#${sections[current]} [data-scroll-target="#${id}"]`);
        await page.waitForFunction(target => document.querySelector('.intro-scroll').scrollTop >= document.getElementById(target).offsetTop - 2, {}, id);
        await sleep(450);
        const detail = await page.evaluate(target => {
          const section = document.getElementById(target);
          const nodes = [...section.querySelectorAll('h1,h2,h3,input,button,.intro-explica-text,.intro-nivel,.intro-habilidad')];
          return { target, overflow: nodes.filter(node => {
            const r = node.getBoundingClientRect();
            return r.width && (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1);
          }).map(node => node.className || node.tagName) };
        }, id);
        intro.push(detail);
        await screenshot(id);
        assert.deepEqual(detail.overflow, [], `${label} onboarding ${id} overflow`);
      }
      assert.equal(await page.$eval('#intro-total-usados', node => node.textContent), '10');
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.click('.intro-choice-btn')]);
      await page.waitForFunction(() => !document.body.classList.contains('escritxr-boot-activa'), { timeout: 30000 });
      assert.equal(await page.$eval('#nombre', node => node.value), 'ALVARA');
      await screenshot('dashboard');
      await page.click('#btn_opciones');
      await page.waitForFunction(() => getComputedStyle(document.getElementById('opciones')).display !== 'none');
      await sleep(900);
      await screenshot('options');
      const optionsFit = await page.$eval('#btn_volver', node => {
        const r = node.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
      });
      assert.ok(optionsFit, `${label} options back button fits`);
      // Check real controls, not decorative button glows that expand scrollWidth.
      assert.ok(await page.$$eval('#opciones, #opciones .opciones_table, #listaModos .casilla', nodes => nodes.every(node => {
        const r = node.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth;
      })), `${label} options have no clipped panels`);
      for (const selector of ['#opciones .spinner-button', '.opciones-idioma-button', '#listaModos label']) {
        for (const control of await page.$$(selector)) {
          await control.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
          assert.ok(await control.evaluate(node => {
            const r = node.getBoundingClientRect();
            return r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
          }), `${label} ${selector} is reachable`);
        }
      }
      await page.$eval('#btn_volver', node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.evaluate(() => { document.getElementById('tiempo_inicial').value = 300; });
      await page.click('#btn_volver');
      await page.waitForFunction(() => !document.body.classList.contains('modo-opciones'));
      await sleep(900);
      await page.click('#btn_escribir');
      await page.waitForFunction(() => document.getElementById('texto').isContentEditable, { timeout: 30000 });
      await sleep(600);
      // Freeze decay/level transitions only for repeatable local visual fixtures.
      await page.evaluate(() => {
        desactivar_borrar = true;
        limpiarIntervalCompartidoGameplay1P('countInterval');
        limpiarIntervalCompartidoGameplay1P('intervaloID_temp_modos');
        clearTimeout(listener_cambio_letra_palabra);
        letra_bendita = 'a';
      });
      await page.type('#texto', 'La ciudad despierta bajo un cielo de tinta.\nLas palabras iluminan la noche.');
      assert.ok(await page.$eval('#texto', node => Boolean(node.querySelector('.letra-verde'))), `${label} blessed letters still work`);
      assert.equal(await page.$eval('#texto', node => node.innerText.trim()), 'La ciudad despierta bajo un cielo de tinta.\nLas palabras iluminan la noche.');
      await sleep(500);
      await screenshot('writing');
      const short = await checkLayout(page, label);
      await page.type('#texto', '\n' + Array.from({ length: 24 }, (_, i) => `Línea ${i + 1}: el mar abre otra puerta.`).join('\n'));
      await sleep(500);
      const long = await checkLayout(page, label);
      assert.ok(Math.abs(short.panelHeight - long.panelHeight) < 2, `${label} typing never scales the panel`);
      assert.ok(long.editorScroll, `${label} long text scrolls inside the editor`);
      await screenshot('long-text');
      const storyBeforeResize = await page.$eval('#texto', node => node.innerText);
      await page.setViewport({ ...viewport, height: Math.min(viewport.height, 460) });
      await sleep(400);
      await checkLayout(page, label + ' reduced viewport');
      assert.equal(await page.$eval('#texto', node => node.innerText), storyBeforeResize);
      await page.setViewport(viewport);
      await sleep(400);
      await page.evaluate(() => gestionarTiempoAgotado());
      await page.waitForFunction(() => getComputedStyle(document.getElementById('quantityMenu')).display !== 'none');
      await sleep(400);
      const resurrectionFits = await page.$eval('#quantityMenu', node => {
        const r = node.getBoundingClientRect();
        const button = document.getElementById('btnConfirmar').getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && button.bottom <= r.bottom;
      });
      assert.ok(resurrectionFits, `${label} resurrection panel and button fit`);
      await screenshot('resurrection');
      await page.click('#btnConfirmar');
      await page.waitForFunction(() => document.getElementById('texto').isContentEditable);
      await page.evaluate(() => {
        desactivar_borrar = true;
        limpiarIntervalCompartidoGameplay1P('countInterval');
        limpiarIntervalCompartidoGameplay1P('intervaloID_temp_modos');
        // Distinct local reels make the choice path deterministic (triples auto-apply).
        window.soloQAOriginalReels = generarResultadoTragaperras;
        generarResultadoTragaperras = () => DESVENTAJAS_BASE.slice(0, 3).map(item => item.emoji);
        window.soloQADisadvantage = iniciarDesventajaEntreNiveles();
      });
      await page.waitForSelector('.desventaja-reel.elegible', { timeout: 20000 });
      assert.ok(await page.$eval('.desventaja-card', node => {
        const r = node.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
      }), `${label} disadvantage selection fits`);
      assert.ok(await page.$$eval('.desventaja-choice-btn', nodes => nodes.every(node => node.scrollHeight <= node.clientHeight + 1)), `${label} choice text fits inside its button`);
      await screenshot('disadvantage');
      await page.click('.desventaja-reel.elegible');
      await page.waitForFunction(() => !document.getElementById('desventajaOverlay').classList.contains('activa'), { timeout: 20000 });
      assert.ok(await page.$eval('#texto', node => node.isContentEditable));
      await page.evaluate(() => {
        generarResultadoTragaperras = window.soloQAOriginalReels;
        limpiar_teclado_lento();
        limpiarIntervalCompartidoGameplay1P('countInterval');
        limpiarIntervalCompartidoGameplay1P('intervaloID_temp_modos');
      });
      const levels = [];
      for (const mode of ['letra prohibida', 'palabras bonus', 'palabras prohibidas', 'frase final']) {
        await page.evaluate(mode => {
          LIMPIEZAS[modo_actual]('');
          modos_restantes = [mode];
          temp_modos();
          limpiarIntervalCompartidoGameplay1P('intervaloID_temp_modos');
        }, mode);
        await sleep(1000);
        const detail = await checkLayout(page, `${label} ${mode}`);
        levels.push(detail);
        await screenshot(mode.replaceAll(' ', '-'));
      }
      await page.evaluate(() => {
        str_frase_final = 'Y cuando la última luz se apagó, comprendimos que todas aquellas palabras eran el comienzo de una historia que nunca dejaríamos de contar.';
        document.getElementById('palabra').textContent = `«${str_frase_final}»`;
      });
      await sleep(400);
      await checkLayout(page, label + ' long final phrase');
      assert.ok(await page.$eval('#palabra', node => node.scrollHeight <= node.clientHeight + 1), `${label} final phrase is never clipped within its chip`);
      await screenshot('long-final-phrase');
      await page.evaluate(() => {
        const info = document.querySelector('.info-total');
        info.scrollTop = info.scrollHeight;
      });
      await screenshot('long-final-phrase-bottom');
      await page.evaluate(() => final());
      await sleep(1000);
      await screenshot('finished');
      assert.ok(await page.$eval('#texto', node => node.innerText.includes('\n')), `${label} finished story keeps line breaks`);
      assert.ok(await page.$eval('#btn_descargar_texto', node => getComputedStyle(node).display !== 'none'));
      await page.click('#btn_escribir');
      await page.waitForFunction(() => document.getElementById('texto').isContentEditable);
      assert.equal(await page.$eval('#texto', node => node.textContent), '');
      assert.deepEqual(errors, [], `${label} browser errors`);
      reports.push({ viewport, intro, short, long, levels, errors });
      console.log(`${label}: onboarding, options, writing, resize, resurrection, disadvantage, 5 levels, long phrase, finish and restart OK`);
      await page.close();
    }
    const reportLabel = `${firefox ? 'firefox' : 'chromium'}${process.env.SOLO_WIDTH ? '-' + process.env.SOLO_WIDTH : ''}`;
    await fs.writeFile(path.join(output, `${reportLabel}-report.json`), JSON.stringify(reports, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => preview.close(resolve));
  }
}

async function checkLayout(page, label) {
  const layout = await page.evaluate(() => {
    const bounds = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
    };
    const panel = bounds('.solo-text-panel');
    const info = bounds('.info-total');
    const editor = document.getElementById('texto');
    return { panel, info, panelHeight: panel.height, editorHeight: editor.clientHeight,
      editorScroll: editor.scrollHeight > editor.clientHeight, horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      fits: panel.top >= 0 && panel.right <= innerWidth + 1 && info.bottom <= innerHeight + 1 && panel.bottom <= info.top + 1,
      scale: getComputedStyle(document.getElementById('players_fit_root')).transform,
      caret: getComputedStyle(editor).caretColor };
  });
  assert.ok(layout.fits && !layout.horizontalOverflow && layout.editorHeight >= 50 && layout.scale === 'none', `${label} layout: ${JSON.stringify(layout)}`);
  assert.notEqual(layout.caret, 'rgba(0, 0, 0, 0)');
  return layout;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
