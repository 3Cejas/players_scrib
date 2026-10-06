const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');

function harness() {
    class CalendarDate extends Date {
        constructor(...args) {
            super(...(args.length ? args : [2026, 9, 6]));
        }
    }
    const context = vm.createContext({ Date: CalendarDate, normalizeScribBrand: text => text });
    const fragments = [
        'function Terminal() {}',
        source.match(/var escapeHTML = function \(str\) \{[\s\S]*?\n    \};/)[0],
        source.match(/var scheduleSections = \[[\s\S]*?\n    \];/)[0]
    ];
    for (const name of ['parseScheduleEventDate', 'isScheduleEventPast', 'buildScheduleCardMarkup', 'buildScheduleMarkup']) {
        fragments.push(source.match(new RegExp('Terminal\\.prototype\\.' + name + ' = function[\\s\\S]*?\\n    \\};'))[0]);
    }
    vm.runInContext(fragments.join('\n'), context);
    const sections = JSON.parse(JSON.stringify(context.scheduleSections));
    return { terminal: new context.Terminal(), sections, events: sections.flatMap(section => section.events) };
}

test('the historical calendar contains the fourteen approved functions, newest first', () => {
    const { terminal, sections, events } = harness();
    assert.deepEqual(sections.map(section => section.year), [2026, 2025, 2024, 2023]);
    assert.equal(events.length, 14);
    const timestamps = sections.flatMap(section => section.events.map(event => {
        assert.equal(event.past, true);
        assert.equal(terminal.isScheduleEventPast(event, section), true);
        return terminal.parseScheduleEventDate(event, section).getTime();
    }));
    assert.deepEqual(timestamps, [...timestamps].sort((left, right) => right - left));
    assert.equal(new Set(timestamps).size, 14);
    assert.ok(events.some(event => event.name === 'WE:NOW' && event.date === '27 de junio de 2023'));
    assert.ok(events.some(event => /Niña y la Mujer en la Ciencia/.test(event.name) && event.date === '12 de febrero de 2024'));
    assert.ok(events.some(event => /Matadero/.test(event.venue) && event.date === '21 de octubre de 2025'));
    assert.deepEqual(events.filter(event => /Luchana/.test(event.venue)).map(event => event.date), ['22 de mayo de 2025', '21 de mayo de 2025']);
    assert.deepEqual(events.filter(event => /Perú/.test(event.venue)).map(event => event.date), ['1 de febrero de 2025', '24 de enero de 2025']);
    assert.ok(events.some(event => event.name === 'Festival MUTIS' && event.date === '30 de marzo de 2025'));
    assert.ok(events.some(event => event.venue === 'Sala NavelArt' && event.date === '28 de marzo de 2025'));
});

test('Exlímite includes January and uses the performance date, not the November setup', () => {
    const { events } = harness();
    const exlimite = events.filter(event => event.venue === 'Sala Exlímite');
    assert.deepEqual(exlimite.map(event => event.date), [
        '27 de marzo de 2026', '27 de febrero de 2026', '17 de enero de 2026', '16 de noviembre de 2025'
    ]);
    assert.equal(exlimite.find(event => /noviembre/.test(event.date)).time, '19:00 hrs.');
});

test('Hollywood contains only the April 9 function backed by its liquidation', () => {
    const { events } = harness();
    const hollywood = events.filter(event => event.venue === 'Espacio Hollywood');
    assert.equal(hollywood.length, 1);
    assert.equal(hollywood[0].date, '9 de abril de 2026');
    assert.equal(hollywood[0].writers, 'Diego vs Maca');
});

test('unconfirmed times are omitted without rendering undefined or empty labels', () => {
    const { terminal, sections } = harness();
    for (const section of sections) {
        for (const event of section.events.filter(event => !event.time)) {
            const markup = terminal.buildScheduleCardMarkup(event, section);
            assert.doesNotMatch(markup, /Hora:|undefined|null/);
            assert.ok(markup.includes(event.venue));
        }
    }
    const markup = terminal.buildScheduleMarkup();
    assert.equal((markup.match(/<article /g) || []).length, 14);
    assert.match(markup, /Torneo &lt;SCRI&gt; B/);
    assert.doesNotMatch(markup, /Entradas|schedule-card__ticket/);
    assert.doesNotMatch(markup, /schedule-section__header|schedule-section__title|schedule-section__subtitle/);
    assert.doesNotMatch(source, /HISTÓRICO|Torneo y funciones en Madrid/);
    assert.match(source, /this\.type\("# FECHAS",/);
});

test('past functions never advertise ticket links, while future functions can', () => {
    const { terminal } = harness();
    const event = { date: '9 de abril de 2026', name: '<b>Festival</b>', venue: 'Sala & Teatro', ticketUrl: 'https://example.com/tickets' };
    const past = terminal.buildScheduleCardMarkup(event, { tone: 'showcase' });
    assert.doesNotMatch(past, /Entradas|example\.com/);
    assert.match(past, /&lt;b&gt;Festival&lt;\/b&gt;/);
    assert.match(past, /Sala &amp; Teatro/);
    const future = terminal.buildScheduleCardMarkup({ ...event, date: '9 de abril de 2027' }, { tone: 'showcase' });
    assert.match(future, /Entradas/);
    assert.doesNotMatch(future, /schedule-card--past/);
});
