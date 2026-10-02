(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.ScribMuseLiveStats = api;
})(typeof window !== "undefined" ? window : null, function () {
    "use strict";
    const COPY = {
        es: { title: "STATS DE LA PARTIDA", heatmap: "MAPA DE CALOR", overview: "ESTADÍSTICAS", waiting: "Esperando estadísticas de las escritoras…", control: "SLIDES SINCRONIZADAS CON CONTROL", keys: "Pulsaciones", active: "Teclas activas", maximum: "Máximo en una tecla", vocabulary: "Riqueza léxica", unique: "palabras únicas", variety: "variedad", inspiration: "Inspiración incorporada", evolution: "Evolución de la inspiración", production: "Producción", pace: "Ritmo", precision: "Precisión", words: "palabras", mistakes: "fallos", points: "puntos", elapsed: "Tiempo transcurrido" },
        en: { title: "MATCH STATS", heatmap: "KEYBOARD HEATMAP", overview: "STATISTICS", waiting: "Waiting for live writer stats…", control: "SLIDES SYNCHRONIZED WITH CONTROL", keys: "Keystrokes", active: "Active keys", maximum: "Most presses on one key", vocabulary: "Lexical richness", unique: "unique words", variety: "variety", inspiration: "Incorporated inspiration", evolution: "Inspiration over time", production: "Production", pace: "Pace", precision: "Accuracy", words: "words", mistakes: "mistakes", points: "points", elapsed: "Elapsed time" },
        fr: { title: "STATISTIQUES DU JEU", heatmap: "CARTE DU CLAVIER", overview: "STATISTIQUES", waiting: "En attente des statistiques des écrivaines…", control: "DIAPOS SYNCHRONISÉES AVEC LE CONTRÔLE", keys: "Frappes", active: "Touches actives", maximum: "Maximum sur une touche", vocabulary: "Richesse lexicale", unique: "mots uniques", variety: "variété", inspiration: "Inspiration intégrée", evolution: "Évolution de l’inspiration", production: "Production", pace: "Rythme", precision: "Précision", words: "mots", mistakes: "erreurs", points: "points", elapsed: "Temps écoulé" }
    };
    const KEYBOARD = [
        Array.from("1234567890", (label, i) => ["Digit" + (i === 9 ? 0 : i + 1), label]).concat([["Backspace", "⌫", 2]]),
        [["Tab", "⇥", 1.5]].concat(Array.from("QWERTYUIOP", letter => ["Key" + letter, letter])),
        Array.from("ASDFGHJKL", letter => ["Key" + letter, letter]).concat([["Semicolon", "Ñ"], ["Enter", "↵", 1.5]]),
        [["ShiftLeft", "⇧", 1.5]].concat(Array.from("ZXCVBNM", letter => ["Key" + letter, letter]), [["Comma", ","], ["Period", "."], ["ShiftRight", "⇧", 1.5]]),
        [["ControlLeft", "Ctrl", 1.5], ["AltLeft", "Alt"], ["Space", "␣", 6], ["AltRight", "Alt"], ["ControlRight", "Ctrl", 1.5]]
    ];
    const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const number = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
    const decimal = value => String(Math.round(number(value) * 100) / 100);
    const time = value => {
        const seconds = Math.floor(number(value) / 1000);
        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    };
    function resolveSlide(step) {
        const integer = Number.isFinite(Number(step)) ? Math.trunc(Number(step)) : 0;
        return ((integer % 4) + 4) % 4;
    }
    function normalizePayload(payload = {}) {
        const raw = payload && typeof payload === "object" ? payload : {};
        const players = {};
        [1, 2].forEach(id => {
            const source = raw.players?.[id] || {};
            const heatmap = Object.fromEntries(Object.entries(source.heatmap || {}).slice(0, 128).map(([key, count]) => [key, number(count)]));
            const history = (Array.isArray(raw.historial_inspiracion?.[id]) ? raw.historial_inspiracion[id] : [])
                .filter(point => point && Number.isFinite(Number(point.t)) && Number.isFinite(Number(point.valor)))
                .slice(-360).map(point => ({ t: number(point.t), valor: number(point.valor) })).sort((a, b) => a.t - b.t);
            players[id] = {
                nombre: String(source.nombre || `ESCRITXR ${id}`).slice(0, 80),
                palabras: number(source.palabrasTotal), unicas: Math.min(number(source.palabrasTotal), number(source.palabrasUnicas)),
                inspiracion: number(source.valorInspiracion), pulsaciones: number(source.pulsacionesTotal), ppm: number(source.ritmoPpm),
                fallos: number(source.intentosLetraProhibida) + number(source.intentosPalabraProhibida),
                tiempo: number(source.tiempoTotalMs), heatmap, history
            };
        });
        return { players };
    }
    function card(icon, label, value, unit = "") {
        return `<article class="musa-stats-metric"><span aria-hidden="true">${icon}</span><small>${escape(label)}</small><strong>${escape(decimal(value))}</strong><em>${escape(unit)}</em></article>`;
    }
    function graph(player, copy) {
        const points = player.history.length ? player.history : [{ t: 0, valor: 0 }];
        const end = Math.max(1000, player.tiempo, ...points.map(point => point.t));
        const maximum = Math.max(1, player.inspiracion, ...points.map(point => point.valor));
        const path = points.concat([{ t: end, valor: player.inspiracion }]).map(point =>
            `${(32 + point.t / end * 558).toFixed(2)},${(152 - point.valor / maximum * 120).toFixed(2)}`).join(" ");
        return `<svg class="musa-stats-chart" viewBox="0 0 640 200" role="img" aria-label="${escape(copy.evolution)}: ${decimal(player.inspiracion)} ${escape(copy.points)}">
            <path d="M32 32V152H590" class="musa-stats-chart__axis"/><path d="M32 92H590M32 32H590" class="musa-stats-chart__grid"/>
            <polyline points="${path}" fill="none" class="musa-stats-chart__line" vector-effect="non-scaling-stroke"/>
            <text x="22" y="26">${decimal(maximum)}</text><text x="22" y="171">0</text><text x="40" y="177">0:00</text><text x="590" y="177" text-anchor="end">${time(end)}</text>
            <text x="320" y="197" text-anchor="middle">${escape(copy.elapsed)}</text></svg>`;
    }
    function renderSlide(payload, step, language = "es") {
        const copy = COPY[language] || COPY.es;
        const slide = resolveSlide(step);
        const team = slide % 2 + 1;
        const player = normalizePayload(payload).players[team];
        const kind = slide < 2 ? "heatmap" : "overview";
        let html;
        if (kind === "heatmap") {
            const values = Object.values(player.heatmap);
            const maximum = Math.max(0, ...values);
            const total = values.reduce((sum, value) => sum + value, 0);
            const rows = KEYBOARD.map(row => `<div class="musa-stats-keyboard-row" style="grid-template-columns:${row.map(key => `${key[2] || 1}fr`).join(" ")}">${row.map(([code, label]) => {
                const count = player.heatmap[code] || 0;
                return `<div class="musa-stats-key" data-key="${code}" style="--key-heat:${maximum ? count / maximum : 0}" title="${escape(label)}: ${decimal(count)}"><span>${escape(label)}</span><small>${count ? decimal(count) : ""}</small></div>`;
            }).join("")}</div>`).join("");
            html = `<div class="musa-stats-metrics">${card("⌨️", copy.keys, total)}${card("🎯", copy.active, values.filter(value => value > 0).length)}${card("🔥", copy.maximum, maximum)}</div><div class="musa-stats-keyboard">${rows}</div>`;
        } else {
            const richness = player.palabras ? Math.round(player.unicas / player.palabras * 100) : 0;
            html = `<div class="musa-stats-overview"><section class="musa-stats-vocabulary"><h3>${escape(copy.vocabulary)}</h3><div class="musa-stats-ring" style="--richness:${richness * 3.6}deg"><strong>${richness}%</strong><span>${escape(copy.variety)}</span></div><p><b>${decimal(player.unicas)}</b> ${escape(copy.unique)} / ${decimal(player.palabras)}</p></section>
                <section class="musa-stats-evolution"><h3>${escape(copy.evolution)}</h3><strong>${decimal(player.inspiracion)} <small>${escape(copy.points)}</small></strong>${graph(player, copy)}</section></div>
                <div class="musa-stats-metrics musa-stats-metrics--criteria">${card("✍️", copy.production, player.palabras, copy.words)}${card("⚡", copy.pace, player.ppm, "PPM")}${card("📚", copy.vocabulary, player.unicas, copy.unique)}${card("✨", copy.inspiration, player.inspiracion, copy.points)}${card("🎯", copy.precision, player.fallos, copy.mistakes)}${card("⌨️", copy.keys, player.pulsaciones)}</div>`;
        }
        return { slide, team, name: player.nombre, kind, title: copy.title, subtitle: kind === "heatmap" ? copy.heatmap : copy.overview, footer: copy.control, html };
    }
    function createController({ root, windowRef = window }) {
        let payload = null;
        let step = 0;
        let visible = false;
        let signature = "";
        const find = name => root.querySelector(`[data-musa-stats="${name}"]`);
        function render() {
            if (!visible) return;
            const language = windowRef.scribGetLanguage2P?.() || "es";
            const data = renderSlide(payload, step, language);
            root.dataset.slide = String(data.slide);
            root.dataset.team = String(data.team);
            find("title").textContent = data.title;
            find("name").textContent = data.name;
            find("subtitle").textContent = data.subtitle;
            find("counter").textContent = `${data.slide + 1} / 4`;
            find("footer").textContent = data.footer;
            const html = payload ? data.html : `<p class="musa-stats-waiting">${escape((COPY[language] || COPY.es).waiting)}</p>`;
            if (html !== signature) { find("content").innerHTML = html; signature = html; }
        }
        windowRef.scribOnLanguageChange2P?.(render);
        return {
            update(data) { payload = data; render(); },
            setView({ active, step: newStep = step }) {
                const next = resolveSlide(newStep);
                if (next !== resolveSlide(step)) root.scrollTop = 0;
                step = newStep;
                visible = Boolean(active);
                root.hidden = !visible;
                root.setAttribute("aria-hidden", String(!visible));
                render();
            }
        };
    }
    return { normalizePayload, resolveSlide, renderSlide, createController };
});
