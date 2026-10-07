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

test('the historical calendar contains the seventeen approved functions, newest first', () => {
    const { terminal, sections, events } = harness();
    assert.deepEqual(sections.map(section => section.year), [2026, 2025, 2024, 2023]);
    assert.equal(events.length, 17);
    const timestamps = sections.flatMap(section => section.events.map(event => {
        assert.equal(event.past, true);
        assert.equal(terminal.isScheduleEventPast(event, section), true);
        return terminal.parseScheduleEventDate(event, section).getTime();
    }));
    assert.deepEqual(timestamps, [...timestamps].sort((left, right) => right - left));
    assert.equal(new Set(timestamps).size, 17);
    assert.ok(events.some(event => event.name === 'WE:NOW' && event.date === '27 de junio de 2023'));
    assert.ok(events.some(event => /Niña y la Mujer en la Ciencia/.test(event.name) && event.date === '12 de febrero de 2024'));
    assert.ok(events.some(event => /Matadero/.test(event.venue) && event.date === '21 de octubre de 2025'));
    assert.deepEqual(events.filter(event => /Luchana/.test(event.venue)).map(event => event.date), ['22 de mayo de 2025', '21 de mayo de 2025']);
    assert.deepEqual(events.filter(event => /Perú/.test(event.venue)).map(event => event.date), ['1 de febrero de 2025', '24 de enero de 2025']);
    assert.ok(events.some(event => event.name === 'Festival MUTIS' && event.date === '30 de marzo de 2025'));
    assert.ok(events.some(event => event.venue === 'Sala NavelArt' && event.date === '28 de marzo de 2025'));
});

test('Imparables includes each Nave 73 performance in September 2026 with its confirmed time and venue', () => {
    const { terminal, sections, events } = harness();
    const nave73 = events.filter(event => event.venue === 'Nave 73');
    assert.deepEqual(nave73.map(event => event.date), [
        '24 de septiembre de 2026', '23 de septiembre de 2026', '22 de septiembre de 2026'
    ]);
    assert.deepEqual(events.slice(0, 3), nave73);
    for (const event of nave73) {
        assert.equal(event.time, '20:00 hrs.');
        assert.equal(event.address, 'C. Palos de la Frontera, 5, 28012 Madrid');
        assert.match(event.name, /Festival Imparables/);
        assert.equal(event.castPending, true);
        assert.equal(event.writers, undefined);
        assert.equal(event.performers, undefined);
        const markup = terminal.buildScheduleCardMarkup(event, sections[0]);
        assert.match(markup, /schedule-card--past/);
        assert.match(markup, /Elenco pendiente de completar/);
        assert.doesNotMatch(markup, /Entradas|schedule-card__ticket/);
    }
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
    assert.equal((markup.match(/<article /g) || []).length, 17);
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

test('dates are grouped in separate year sections, newest first, with each function in its own year', () => {
    const { terminal, sections } = harness();
    const markup = terminal.buildScheduleMarkup();
    const groups = [...markup.matchAll(/<section class="schedule-section" aria-label="Fechas de (\d{4})">([\s\S]*?)<\/section>/g)];
    assert.deepEqual(groups.map(group => Number(group[1])), [2026, 2025, 2024, 2023]);
    for (let index = 0; index < groups.length; index++) {
        const [, year, content] = groups[index];
        assert.ok(content.includes('<h2 class="schedule-section__year">' + year + '</h2>'));
        assert.equal((content.match(/<article /g) || []).length, sections[index].events.length);
        const dates = [...content.matchAll(/schedule-card__date">📅 ([^<]+)/g)].map(match => match[1]);
        assert.deepEqual(dates, sections[index].events.map(event => event.date));
        assert.ok(dates.every(date => date.endsWith(year)));
    }
});

test('each date displays its own researched cast without reusing a generic roster', () => {
    const { terminal, sections, events } = harness();
    assert.ok(events.every(event => event.writers || event.performers || event.participants || event.castPending));
    const onDate = date => events.find(event => event.date === date);
    assert.equal(onDate('17 de enero de 2026').writers, 'Miriam del Valle · Ángela Bueno');
    assert.equal(onDate('27 de febrero de 2026').writers, 'Lucía Cerván · Ángela Bueno Harris');
    assert.equal(onDate('27 de marzo de 2026').writers, 'Ángela Bueno Harris · Pablo Pineño');
    assert.equal(onDate('21 de octubre de 2025').performers, 'Diego Valverde · Elena Conde');
    assert.equal(onDate('28 de marzo de 2025').performers, 'Elena Conde · Fabiana Pereira · Pablo Pineño · Diego Valverde');
    assert.equal(onDate('27 de junio de 2023').writers, 'Álvaro Sandin · Irene Herráez');
    assert.deepEqual(events.filter(event => event.castPending).map(event => event.date), [
        '24 de septiembre de 2026', '23 de septiembre de 2026', '22 de septiembre de 2026',
        '27 de marzo de 2026', '22 de mayo de 2025', '30 de marzo de 2025', '1 de febrero de 2025'
    ]);
    for (const section of sections) {
        for (const event of section.events) {
            const markup = terminal.buildScheduleCardMarkup(event, section);
            assert.equal(markup.includes('Elenco pendiente de completar.'), !!event.castPending);
            assert.equal(markup.includes('Escritores/as:'), !!event.writers);
            assert.equal(markup.includes('Intérpretes:'), !!event.performers);
            assert.equal(markup.includes('Participantes:'), !!event.participants);
        }
    }
});

test('every calendar performance retains a matching evidence record', () => {
    const { terminal, sections } = harness();
    const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/site-cast-sources.json'), 'utf8'));
    const dates = sections.flatMap(section => section.events.map(event => {
        const date = terminal.parseScheduleEventDate(event, section);
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    }));
    assert.deepEqual(evidence.dates.map(record => record.date), dates);
    assert.ok(evidence.dates.every(record => record.sources.length > 0 && record.note));
});

test('mixed-role sources are credited as participants and all cast names are escaped', () => {
    const { terminal, events } = harness();
    const lima = events.find(event => event.date === '24 de enero de 2025');
    assert.equal(lima.writers, undefined);
    assert.equal(lima.performers, undefined);
    assert.match(lima.participants, /Conny Betzabé/);
    assert.match(lima.participants, /Karla Rivera/);
    const markup = terminal.buildScheduleCardMarkup({
        date: '1 de febrero de 2025', venue: 'Sala',
        writers: 'Nombre <uno>', performers: 'Nombre & dos', participants: '<script>tres</script>'
    }, { tone: 'showcase' });
    assert.match(markup, /Nombre &lt;uno&gt;/);
    assert.match(markup, /Nombre &amp; dos/);
    assert.match(markup, /&lt;script&gt;tres&lt;\/script&gt;/);
    assert.doesNotMatch(markup, /<script>|undefined|null/);
});
