const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');

function harness() {
    let selection = null;
    const focusCalls = [];
    const context = vm.createContext({
        Terminal: function () {},
        window: { getSelection: () => selection }
    });
    for (const method of ['shouldAutoFocusCommandLine', 'focus']) {
        vm.runInContext(source.match(new RegExp('Terminal\\.prototype\\.' + method + ' = function[\\s\\S]*?\\n    \\};'))[0], context);
    }
    const terminal = new context.Terminal();
    terminal.cmdLine = { focus: options => focusCalls.push(options) };
    return { terminal, focusCalls, selectText: () => { selection = { rangeCount: 1, getRangeAt: () => ({ collapsed: false }) }; } };
}

function target(inPrompt = false, interactive = false) {
    return { closest: selector => (selector === '#input-line' ? inPrompt : interactive) ? {} : null };
}

test('section text, cards, headings and page background never focus the bottom command line', () => {
    const { terminal } = harness();
    for (const name of ['paragraph', 'schedule-card', 'heading', 'background']) {
        assert.equal(terminal.shouldAutoFocusCommandLine({ target: target() }), false, name);
    }
    assert.equal(terminal.shouldAutoFocusCommandLine({}), false);
});

test('only the prompt row focuses commands; links, buttons and text selections keep their own focus', () => {
    const { terminal, selectText } = harness();
    assert.equal(terminal.shouldAutoFocusCommandLine({ target: target(true) }), true);
    assert.equal(terminal.shouldAutoFocusCommandLine({ target: target(true, true) }), false);
    assert.equal(terminal.shouldAutoFocusCommandLine({ target: target(false, true) }), false);
    assert.equal(terminal.shouldAutoFocusCommandLine({ target: terminal.cmdLine }), false);
    selectText();
    assert.equal(terminal.shouldAutoFocusCommandLine({ target: target(true) }), false);
});

test('command completion and quick navigation focus without scrolling the page', () => {
    const { terminal, focusCalls } = harness();
    terminal.no_writing = false;
    terminal.focus();
    assert.equal(terminal.no_writing, true);
    assert.equal(focusCalls.length, 1);
    assert.equal(focusCalls[0].preventScroll, true);
});
