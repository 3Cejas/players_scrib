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
    assert.match(css, /cursor:\s*url\("\.\.\/img\/cursor-pluma\.svg"\)/);
    assert.match(css, /\.site-paused \.aquarium-glow\s*\{\s*animation-play-state: paused/);
    assert.equal((html.match(/<span class="aquarium-/g) || []).length, 2);
    assert.match(source, /DOMContentLoaded/);
});
