const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');

function harness() {
    const timers = new Map();
    const listeners = new Map();
    const input = { readOnly: true };
    let nextTimer = 0;
    class Element {
        constructor() { this.markup = ''; this.insertions = 0; }
        insertAdjacentHTML(position, markup) {
            assert.equal(position, 'beforeend');
            this.markup += markup;
            this.insertions++;
        }
        // Instant rendering must never replace an existing DOM tree.
        set innerHTML(value) { throw new Error('Full DOM reparse'); }
    }
    const context = vm.createContext({
        Node: Element,
        Number,
        InvalidArgumentException: Error,
        isURL: () => false,
        normalizeScribBrand: text => text,
        document: {
            getElementById: () => input,
            addEventListener: (name, handler) => listeners.set(name, handler),
            removeEventListener: name => listeners.delete(name)
        },
        setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
        clearTimeout: id => timers.delete(id)
    });
    const escaping = source.match(/var escapeHTML = function \(str\) \{[\s\S]*?\n    \};/)[0];
    const renderer = source.match(/var TypeSimulator = function[\s\S]*?(?=\n    return \{\s+listener:)/)[0];
    vm.runInContext(escaping + '\n' + renderer, context);
    const output = new Element();
    const simulator = new context.TypeSimulator(0, output);
    return { simulator, output, timers, listeners, input };
}

test('instant site text renders once, preserving bold markup, escaping and line breaks', () => {
    const { simulator, output, timers, listeners, input } = harness();
    let calls = 0;
    simulator.type('Hola **musa**\n<script>&"\' fin', () => calls++);
    assert.equal(output.markup, 'Hola <strong>musa</strong><br/>&lt;script&gt;&amp;&quot;&#39; fin<br/>');
    assert.equal(output.insertions, 1);
    assert.equal(calls, 1);
    assert.equal(input.readOnly, false);
    assert.equal(timers.size, 0);
    assert.equal(listeners.size, 0);
});

test('long texts do not schedule one timer or rebuild the output for every character', () => {
    const { simulator, output, timers } = harness();
    const text = 'Una historia con muchas líneas.\n'.repeat(1000);
    simulator.type(text);
    assert.equal(output.insertions, 1);
    assert.equal(output.markup.split('<br/>').length, 1002);
    assert.equal(timers.size, 0);
});

test('instant rendering cancels pending typewriter work before accepting another command', () => {
    const { simulator, output, timers, listeners, input } = harness();
    const oldRun = simulator.activeRunId;
    simulator.pendingTimeoutId = 12;
    timers.set(12, () => assert.fail('Old work must not run'));
    simulator.activeSkipHandler = () => {};
    listeners.set('dblclick', simulator.activeSkipHandler);
    listeners.set('keypress', simulator.activeSkipHandler);
    simulator.type('**Sin cierre', () => simulator.type('Siguiente'));
    assert.equal(output.markup, '<strong>Sin cierre</strong><br/>Siguiente<br/>');
    assert.equal(simulator.activeRunId, oldRun + 2);
    assert.equal(output.insertions, 2);
    assert.equal(timers.size, 0);
    assert.equal(listeners.size, 0);
    assert.equal(input.readOnly, false);
});

test('the website uses deferred boot and a native cursor instead of tracking the mouse', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'css/main.css'), 'utf8');
    assert.doesNotMatch(html, /Hyphenator|class="hyphenate"/);
    assert.match(html, /<script defer src="\.\/js\/main\.js/);
    assert.doesNotMatch(source, /initPenCursor|movePenCursor|penCursorHideTimeout/);
    assert.doesNotMatch(css, /cursor:\s*none|will-change:\s*(?:color|left)|heroSubtitleColorShift/);
    assert.match(css, /--site-feather-cursor:\s*url\("\.\.\/img\/cursor-pluma\.svg\?n=2"\)/);
    assert.match(css, /\.site-paused #background-effects > \*/);
    assert.match(css, /animation-play-state: paused/);
    assert.equal((html.match(/<span class="aquarium-/g) || []).length, 3);
    assert.match(source, /DOMContentLoaded/);
});

test('the native cursor preserves the original feather instead of drawing a new arrow', () => {
    const svg = fs.readFileSync(path.join(root, 'img/cursor-pluma.svg'), 'utf8');
    const original = fs.readFileSync(path.join(root, '1p_scrib/game/img/pluma_azul.png'));
    assert.match(svg, /width="44" height="44"/);
    assert.match(svg, /rotate\(-14 22 22\)/);
    const encoded = svg.match(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/)[1];
    assert.deepEqual(Buffer.from(encoded, 'base64'), original);
    assert.doesNotMatch(svg, /<animate|<script|https?:\/\/(?!www\.w3\.org)/);
});

test('heading colour effects create one decorative layer and pause when offscreen', () => {
    const observed = [];
    let observerCallback;
    const header = { textContent: 'ASCII <SCRI> B', attributes: {}, classList: { toggle: (name, value) => { header.offscreen = value; } },
        setAttribute: (name, value) => { header.attributes[name] = value; } };
    const subtitle = { dataset: {}, children: [], cloneNode: () => ({ attributes: {}, removeAttribute: name => assert.equal(name, 'id'),
        setAttribute(name, value) { this.attributes[name] = value; } }), appendChild: child => subtitle.children.push(child),
        classList: { toggle: (name, value) => { subtitle.offscreen = value; } } };
    const context = vm.createContext({
        Terminal: function () {}, document: { getElementById: id => { assert.equal(id, 'hero-subtitle'); return subtitle; } },
        window: { IntersectionObserver: class {
            constructor(callback) { observerCallback = callback; }
            observe(element) { observed.push(element); }
        } }
    });
    vm.runInContext(source.match(/Terminal\.prototype\.bindLightweightSiteEffects = function[\s\S]*?\n    \};/)[0], context);
    const terminal = new context.Terminal();
    terminal.asciiHeader = header;
    terminal.bindLightweightSiteEffects();
    terminal.bindLightweightSiteEffects();
    assert.equal(subtitle.children.length, 1);
    assert.equal(subtitle.children[0].className, 'hero-subtitle__glow');
    assert.equal(subtitle.children[0].attributes['aria-hidden'], 'true');
    assert.equal(header.attributes['data-glow-text'], header.textContent);
    assert.deepEqual(observed, [header, subtitle]);
    observerCallback([{ target: header, isIntersecting: false }, { target: subtitle, isIntersecting: true }]);
    assert.equal(header.offscreen, true);
    assert.equal(subtitle.offscreen, false);
});

test('persistent visual effects animate only transforms/opacity and are motion-safe', () => {
    const css = fs.readFileSync(path.join(root, 'css/main.css'), 'utf8');
    for (const name of ['aquariumDriftBlue', 'aquariumDriftRed', 'aquariumCurrent', 'siteColorCrossfade']) {
        const rule = css.match(new RegExp('@keyframes ' + name + ' \\{[\\s\\S]*?\\n\\}'))[0];
        assert.doesNotMatch(rule, /filter:|color:|text-shadow:|background-position:|width:|height:|left:|top:/);
    }
    assert.match(css, /#containerascii\.site-effect-offscreen::after/);
    assert.match(css, /\.site-effect-offscreen \.hero-subtitle__glow/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.doesNotMatch(css, /mix-blend-mode:\s*screen|(?:^|[;\s{])filter:\s*blur/);
});
