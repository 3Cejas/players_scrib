(function () {
    "use strict";

    const params = new URLSearchParams(window.location.search);
    if (String(params.get("role") || "").toLowerCase() !== "technician") return;

    const selectedPlayer = Number(params.get("player")) === 2 ? 2 : 1;
    const state = window.ScribTeleprompter?.crearEstado?.() || {
        visible: false, preparing: false, text: "", fontSize: 44, speed: 35, playing: false,
        scroll: 0, source: 0, loadId: 0, revision: 0
    };
    let marks = [];
    let marksRevision = 0;
    let anchorTime = performance.now();
    let anchorScroll = 0;
    let raf = 0;

    const overlay = document.getElementById("technician_teleprompter");
    const screen = document.getElementById("technician_teleprompter_screen");
    const text = document.getElementById("technician_teleprompter_text");
    const notes = document.getElementById("technician_teleprompter_notes");
    const title = document.getElementById("technician_teleprompter_title");
    const play = document.getElementById("technician_teleprompter_play");
    const sync = document.getElementById("technician_teleprompter_sync");
    const sizeButton = document.getElementById("technician_teleprompter_size");

    document.body.classList.add("page-technician");
    document.title = `SCRB · Técnico ${selectedPlayer}`;
    if (overlay) overlay.hidden = false;

    const normalizarMarca = (mark = {}) => ({
        ...mark,
        start: Math.max(0, Math.trunc(Number(mark.start) || 0)),
        end: Math.max(0, Math.trunc(Number(mark.end) || 0)),
        note: String(mark.note || "").trim(),
        color: String(mark.color || "").trim(),
        underlineColor: String(mark.underlineColor || "").trim()
    });

    function estilosSegmento(inicio, fin) {
        return marks.filter((mark) => mark.start < fin && mark.end > inicio);
    }

    function renderMarkedText() {
        if (!text) return;
        const contenido = String(state.text || "");
        const limites = new Set([0, contenido.length]);
        marks.forEach((mark) => {
            limites.add(Math.max(0, Math.min(contenido.length, mark.start)));
            limites.add(Math.max(0, Math.min(contenido.length, mark.end)));
        });
        const puntos = Array.from(limites).sort((a, b) => a - b);
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < puntos.length - 1; index += 1) {
            const inicio = puntos[index];
            const fin = puntos[index + 1];
            if (fin <= inicio) continue;
            const segmento = document.createElement("span");
            segmento.textContent = contenido.slice(inicio, fin);
            const activas = estilosSegmento(inicio, fin);
            const color = activas.map((mark) => mark.color).find(Boolean);
            const subrayada = activas.find((mark) => mark.underline);
            const conNota = activas.find((mark) => mark.note);
            if (color) segmento.style.color = color;
            if (subrayada) {
                segmento.classList.add("technician-mark--underline");
                segmento.style.setProperty("--technician-mark-color", subrayada.underlineColor || "#ffe95c");
            }
            if (conNota) {
                segmento.classList.add("technician-mark--note");
                segmento.title = conNota.note;
            }
            fragment.appendChild(segmento);
        }
        text.replaceChildren(fragment);
        text.style.fontSize = `${Math.max(18, Number(state.fontSize) || 44)}px`;
        renderNotes();
    }

    function renderNotes() {
        if (!notes) return;
        const anotadas = marks.filter((mark) => mark.note);
        if (!anotadas.length) {
            notes.innerHTML = '<span class="technician-teleprompter__empty">Sin notas para este texto</span>';
            return;
        }
        notes.replaceChildren(...anotadas.map((mark, index) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "technician-teleprompter__note";
            item.innerHTML = `<b>${index + 1}</b><span></span>`;
            item.querySelector("span").textContent = mark.note;
            item.addEventListener("click", () => {
                const ratio = Math.max(0, Math.min(1, mark.start / Math.max(1, String(state.text || "").length)));
                const maxScroll = Math.max(0, text.scrollHeight - screen.clientHeight);
                anchorScroll = maxScroll * ratio;
                anchorTime = performance.now();
                syncScroll();
            });
            return item;
        }));
    }

    function currentScroll(now = performance.now()) {
        if (!state.playing || !state.visible || Number(state.speed) <= 0) return anchorScroll;
        return anchorScroll + ((now - anchorTime) / 1000) * Number(state.speed);
    }

    function syncScroll(now = performance.now()) {
        if (!screen || !text) return;
        const maxScroll = Math.max(0, text.scrollHeight - screen.clientHeight + 4);
        const objetivo = Math.max(0, Math.min(currentScroll(now), maxScroll));
        text.style.transform = `translateY(${-objetivo}px)`;
    }

    function loop(now) {
        syncScroll(now);
        raf = requestAnimationFrame(loop);
    }

    function renderState() {
        if (!overlay) return;
        const sourceMatches = Number(state.source) === selectedPlayer;
        const active = sourceMatches && (state.visible || state.preparing);
        overlay.classList.toggle("technician-teleprompter--active", active);
        overlay.classList.toggle("technician-teleprompter--preparing", Boolean(state.preparing));
        if (title) {
            title.textContent = !sourceMatches && (state.visible || state.preparing)
                ? "Teleprompter del otro equipo"
                : state.preparing
                    ? "Preparando texto…"
                    : state.visible
                        ? `Texto de ${selectedPlayer === 1 ? "ESCRITXR 1" : "ESCRITXR 2"}`
                        : "Esperando texto";
        }
        if (play) play.textContent = state.playing && active ? "▶ EN MARCHA" : active ? "❚❚ EN PAUSA" : "EN ESPERA";
        if (sync) sync.textContent = `SINCRONIZADO · R${Number(state.revision) || 0}`;
        renderMarkedText();
        requestAnimationFrame(syncScroll);
    }

    function applyTeleprompter(next = {}) {
        const revision = window.ScribTeleprompter?.normalizarRevision?.(next.revision);
        if (revision !== null && revision < (Number(state.revision) || 0)) return;
        anchorScroll = Number(next.scroll ?? state.scroll) || 0;
        anchorTime = performance.now();
        if (window.ScribTeleprompter?.aplicarEstado) {
            window.ScribTeleprompter.aplicarEstado(state, next, {
                fontMin: 18, fontMax: 120, speedMin: 0, speedMax: 300
            });
        } else {
            Object.assign(state, next);
        }
        renderState();
    }

    window.ScribTechnicianTeleprompter = {
        setMarks(nextMarks, revision = 0) {
            if (Number(revision) < marksRevision) return;
            marksRevision = Number(revision) || marksRevision;
            marks = (Array.isArray(nextMarks) ? nextMarks : []).map(normalizarMarca);
            renderMarkedText();
            requestAnimationFrame(syncScroll);
        },
        applyTeleprompter
    };

    socket.on("teleprompter_state", (payload = {}) => applyTeleprompter(payload.state || {}));
    socket.on("connect", () => {
        socket.emit("pedir_teleprompter_estado");
        socket.emit("pedir_marcas_tecnico_estado");
    });
    sizeButton?.addEventListener("click", () => {
        overlay.classList.toggle("technician-teleprompter--expanded");
        sizeButton.textContent = overlay.classList.contains("technician-teleprompter--expanded") ? "↘" : "↗";
        requestAnimationFrame(syncScroll);
    });
    raf = requestAnimationFrame(loop);
    window.addEventListener("beforeunload", () => cancelAnimationFrame(raf), { once: true });
    renderState();
}());
