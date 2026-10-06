#!/usr/bin/env node
// Compare the public website before/after changes, independently of game sessions.
// Uses an ephemeral local preview by default; SITE_URL can point to production.
// SITE_BROWSER=firefox node scripts/profile-site-performance.js current --verify
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

async function main() {
    const label = process.argv[2] || 'current';
    assert.match(label, /^[a-z0-9-]+$/i);
    const firefox = process.env.SITE_BROWSER === 'firefox';
    const preview = process.env.SITE_URL ? null : await startPreview();
    const siteUrl = process.env.SITE_URL || preview.url;
    let browser;
    const folder = path.resolve('.e2e-artifacts/site-performance');
    try {
        browser = await puppeteer.launch({
            browser: firefox ? 'firefox' : 'chrome',
            executablePath: process.env.SITE_BROWSER_PATH || (process.platform === 'linux' ? (firefox ? '/usr/bin/firefox' : '/usr/bin/chromium') : undefined),
            headless: true,
            args: firefox ? [] : ['--no-sandbox', '--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2']
        });
        await fs.mkdir(folder, { recursive: true });
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
        const errors = [];
        page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.stack); });
        const cdp = firefox ? null : await page.createCDPSession();
        if (cdp) {
            await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
            await cdp.send('Performance.enable');
        }
        const started = Date.now();
        await page.goto(siteUrl, { waitUntil: 'load' });
        await page.waitForFunction(() => {
            const input = document.getElementById('cmdline');
            return input && !input.disabled && !input.readOnly && document.querySelector('[data-command="prensa"]');
        }, { timeout: 30000 });
        // Optional read-only isolation when tuning the site's visual layers.
        const effectSamples = {
            'background-only': '#containerascii::after,.hero-subtitle__glow{animation:none!important;opacity:0!important}',
            'headings-only': '#background-effects>*{animation:none!important}',
            'no-mask': '.aquarium-current{-webkit-mask-image:none!important;mask-image:none!important}',
            'no-current': '.aquarium-current{display:none!important}'
        };
        if (process.env.SITE_EFFECTS_SAMPLE) {
            assert.ok(effectSamples[process.env.SITE_EFFECTS_SAMPLE]);
            await page.addStyleTag({ content: effectSamples[process.env.SITE_EFFECTS_SAMPLE] });
        }
        const menuReadyMs = Date.now() - started;
        await page.mouse.move(100, 700);
        // Let entrance transitions settle before measuring pointer movement.
        await new Promise(resolve => setTimeout(resolve, 400));
        const metrics = async () => cdp
            ? Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(item => [item.name, item.value]))
            : {};
        const before = await metrics();
        if (cdp) await page.tracing.start({ categories: ['devtools.timeline'], path: path.join(folder, label + '-trace.json') });
        const measureStart = Date.now();
        const frames = page.evaluate(() => new Promise(resolve => {
            const gaps = [];
            const start = performance.now();
            let previous = start;
            function frame(now) {
                gaps.push(now - previous);
                previous = now;
                if (now - start >= 4000) {
                    resolve({ frames: gaps.length, frameSampleMs: Math.round(now - start), gapsOver50ms: gaps.filter(gap => gap > 50).length });
                } else requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        }));
        for (let index = 0; index < 60; index++) {
            await page.mouse.move(100 + (index % 40) * 30, 690 + Math.sin(index / 8) * 100);
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        const frameResult = await frames;
        const after = await metrics();
        if (cdp) await page.tracing.stop();
        const details = await page.evaluate(() => ({
            animations: document.getAnimations().filter(animation => animation.playState === 'running').length,
            pointerFine: matchMedia('(pointer: fine)').matches,
            customCursorNodes: document.querySelectorAll('.page-cursor-pluma').length,
            inputCursor: getComputedStyle(document.getElementById('cmdline')).cursor,
            backgroundLayers: document.querySelectorAll('#background-effects > *').length,
            backgroundFilters: [...document.querySelectorAll('#background-effects > *')].map(node => getComputedStyle(node).filter),
            jsBytes: performance.getEntriesByType('resource').filter(entry => entry.name.includes('/js/')).reduce((sum, entry) => sum + entry.decodedBodySize, 0),
            hyphenatorLoaded: performance.getEntriesByType('resource').some(entry => /Hyphenator/.test(entry.name)),
            overflow: document.documentElement.scrollWidth > innerWidth,
            strongWelcome: [...document.querySelectorAll('#output strong')].some(node => /Bienvenidx/.test(node.textContent))
        }));
        const report = { label, effectSample: process.env.SITE_EFFECTS_SAMPLE || 'all', browser: firefox ? 'Firefox' : 'Chromium', cpuThrottle: cdp ? 4 : null, deviceScaleFactor: 2, menuReadyMs,
            sampleMs: Date.now() - measureStart, ...frameResult, ...details, errors };
        for (const key of ['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount']) {
            if (cdp) report[key] = +(after[key] - before[key]).toFixed(4);
        }
        if (cdp) {
            const trace = JSON.parse(await fs.readFile(path.join(folder, label + '-trace.json'), 'utf8'));
            report.paintEvents = trace.traceEvents.filter(event => event.name === 'Paint' && event.ph === 'X').length;
        }
        await page.screenshot({ path: path.join(folder, label + '-desktop.png') });
        if (process.argv.includes('--verify')) {
            assert.equal(errors.length, 0);
            assert.equal(details.customCursorNodes, 0);
            assert.equal(details.inputCursor, 'text');
            assert.equal(details.hyphenatorLoaded, false);
            assert.equal(details.strongWelcome, true);
            assert.equal(details.overflow, false);
            assert.equal(details.backgroundLayers, 3);
            assert.ok(details.animations <= 5);
            assert.ok(details.backgroundFilters.every(filter => filter === 'none'));
            await checkNavigation(page, folder, label, !firefox);
            assert.deepEqual(errors, []);
        }
        await fs.writeFile(path.join(folder, label + '.json'), JSON.stringify(report, null, 2));
        console.log(JSON.stringify(report, null, 2));
    } finally {
        if (browser) await browser.close();
        if (preview) await new Promise(resolve => preview.server.close(resolve));
    }
}

async function startPreview() {
    const root = path.resolve(__dirname, '..');
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
        '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf' };
    const server = http.createServer(async (request, response) => {
        try {
            let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
            if (file !== root && !file.startsWith(root + path.sep)) {
                response.writeHead(403).end();
                return;
            }
            if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
            const data = await fs.readFile(file);
            response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
            response.end(data);
        } catch {
            response.writeHead(404).end();
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    return { server, url: `http://127.0.0.1:${server.address().port}` };
}

async function checkNavigation(page, folder, label, canEmulateMedia) {
    const runCommand = async command => {
        await page.waitForFunction(() => {
            const input = document.getElementById('cmdline');
            return !input.disabled && !input.readOnly;
        });
        await page.click('#cmdline');
        await page.type('#cmdline', command);
        await page.keyboard.press('Enter');
        await page.waitForFunction(command => history.state && history.state.terminalCommand === command && !document.getElementById('cmdline').disabled, {}, command);
    };
    assert.equal(await page.$$eval('.hero-subtitle__glow', layers => layers.length), 1);
    const cursor = await page.evaluate(() => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 44;
            canvas.getContext('2d').drawImage(image, 0, 0);
            const pixels = canvas.getContext('2d').getImageData(0, 0, 44, 44).data;
            let visible = 0;
            for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) visible++;
            resolve({ width: image.naturalWidth, height: image.naturalHeight, visible });
        };
        image.onerror = () => reject(new Error('Native feather cursor failed to load'));
        image.src = './img/cursor-pluma.svg?n=2';
    }));
    assert.equal(cursor.width, 44);
    assert.equal(cursor.height, 44);
    assert.ok(cursor.visible > 300);
    const alignment = await page.evaluate(() => {
        const original = document.querySelector('#hero-subtitle > .hero-subtitle__word').getBoundingClientRect();
        const copy = document.querySelector('.hero-subtitle__glow > .hero-subtitle__word').getBoundingClientRect();
        return { distance: Math.abs(original.top - copy.top) + Math.abs(original.left - copy.left), original: { top: original.top, left: original.left }, copy: { top: copy.top, left: copy.left } };
    });
    assert.ok(alignment.distance < 1, 'Decorative heading must exactly overlap the original: ' + JSON.stringify(alignment));
    await page.evaluate(() => document.documentElement.classList.add('site-paused'));
    await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
    await page.evaluate(() => document.documentElement.classList.remove('site-paused'));
    await runCommand('prensa');
    await page.click('[data-command="imagenes"]');
    await page.waitForSelector('.output-gallery-image');
    const lazy = await page.$$eval('.output-gallery-image', images => images.every(image => image.loading === 'lazy'));
    assert.equal(lazy, true);
    // Media and the lightbox must keep working with the lighter rendering.
    await page.click('.output-gallery-item');
    await page.waitForSelector('.output-lightbox:not(.output-lightbox--hidden)');
    await page.waitForFunction(() => {
        const image = document.querySelector('.output-lightbox__image');
        return image && image.complete && image.naturalWidth > 0;
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.output-lightbox:not(.output-lightbox--hidden)'));
    await page.goBack();
    await page.waitForSelector('[data-command="imagenes"]');
    await page.goBack();
    await page.waitForSelector('[data-command="compañía"]');
    await page.click('[data-command="compañía"]');
    await page.waitForFunction(() => history.state.terminalCommand === 'compañía' && !document.getElementById('cmdline').disabled);
    await page.goBack();
    await page.waitForSelector('[data-command="prensa"]');
    // Puppeteer's Firefox/BiDi transport cannot emulate media features.
    if (canEmulateMedia) {
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await new Promise(resolve => setTimeout(resolve, 250));
        assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), 0);
    }
    await runCommand('fechas');
    await page.waitForSelector('.schedule-card');
    const calendar = await page.evaluate(() => ({
        cards: document.querySelectorAll('.schedule-card').length,
        dates: [...document.querySelectorAll('.schedule-card__date')].map(node => node.textContent),
        ticketLinks: document.querySelectorAll('.schedule-card__ticket').length,
        body: document.querySelector('.schedule-layout').textContent,
        overflow: document.documentElement.scrollWidth > innerWidth
    }));
    assert.equal(calendar.cards, 14);
    assert.equal(calendar.ticketLinks, 0);
    assert.equal(calendar.overflow, false);
    assert.ok(calendar.dates.includes('📅 16 de noviembre de 2025'));
    assert.ok(calendar.dates.includes('📅 17 de enero de 2026'));
    assert.match(calendar.body, /WE:NOW/);
    assert.match(calendar.body, /Festival MUTIS/);
    assert.doesNotMatch(calendar.body, /undefined|15 de noviembre de 2025/);
    assert.equal(await page.$$eval('.schedule-section__header', headers => headers.length), 0);
    assert.equal(await page.$eval('.output-title', title => title.textContent), 'FECHAS');
    await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.body.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.screenshot({ path: path.join(folder, label + '-calendar-desktop.png'), fullPage: true });
    await captureCalendarCards(page, folder, label + '-desktop');
    await page.waitForFunction(() => document.getElementById('containerascii').classList.contains('site-effect-offscreen'));
    for (const selector of ['#containerascii', '.hero-subtitle__glow']) {
        const effect = await page.$eval(selector, node => {
            const style = getComputedStyle(node, node.id === 'containerascii' ? '::after' : null);
            return { name: style.animationName, state: style.animationPlayState };
        });
        assert.ok(effect.name === 'none' || effect.state === 'paused', 'Offscreen heading must pause or disable its effect');
    }
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'), { timeout: 3000 });
    assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(folder, label + '-mobile.png'), fullPage: true });
    await captureCalendarCards(page, folder, label + '-mobile');
    await page.setViewport({ width: 320, height: 740, deviceScaleFactor: 1 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.$$eval('.schedule-card', cards => cards.every(card => card.scrollWidth <= card.clientWidth)), true);
}

async function captureCalendarCards(page, folder, label) {
    for (const index of [0, 4, 10, 13]) {
        await page.evaluate(index => document.querySelectorAll('.schedule-card')[index].scrollIntoView({ block: 'start', behavior: 'instant' }), index);
        const bounds = await page.evaluate(index => {
            const header = document.querySelectorAll('.schedule-card__date')[index].getBoundingClientRect();
            return { top: header.top, bottom: header.bottom, width: innerWidth, height: innerHeight };
        }, index);
        assert.ok(bounds.top >= 0 && bounds.bottom <= bounds.height);
        await page.screenshot({ path: path.join(folder, label + '-calendar-card-' + index + '.png') });
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
