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
        const report = { label, browser: firefox ? 'Firefox' : 'Chromium', cpuThrottle: cdp ? 4 : null, deviceScaleFactor: 2, menuReadyMs,
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
            assert.ok(details.animations <= 2);
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
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'), { timeout: 3000 });
    assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(folder, label + '-mobile.png') });
}

main().catch(error => { console.error(error); process.exitCode = 1; });
