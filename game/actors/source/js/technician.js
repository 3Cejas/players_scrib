(function () {
    "use strict";

    const params = new URLSearchParams(window.location.search);
    if (String(params.get("role") || "").toLowerCase() !== "technician") return;

    const TEAM_STORAGE_KEY = "scrib_technician_selected_player_v1";
    const playerFromUrl = Number(params.get("player"));
    let playerStored = 1;
    try {
        playerStored = Number(window.localStorage.getItem(TEAM_STORAGE_KEY)) === 2 ? 2 : 1;
    } catch (error) {
        playerStored = 1;
    }
    let selectedPlayer = playerFromUrl === 1 || playerFromUrl === 2 ? playerFromUrl : playerStored;
    const state = window.ScribTeleprompter?.crearEstado?.() || {
        visible: false, preparing: false, text: "", fontSize: 44, speed: 35, playing: false,
        scroll: 0, source: 0, loadId: 0, revision: 0
    };
    let marks = [];
    let marksRevision = 0;
    let anchorTime = performance.now();
    let anchorScroll = 0;
    let raf = 0;
    let noteTargets = [];
    let visibleNoteId = "";
    let lastNoteFollowAt = 0;
    let switchingTeam = false;
    let switchCommitTimer = 0;
    let switchEndTimer = 0;
    let transitionTargetPlayer = selectedPlayer;
    const writerNames = {
        1: "ESCRITXR 1",
        2: "ESCRITXR 2"
    };

    const overlay = document.getElementById("technician_teleprompter");
    const screen = document.getElementById("technician_teleprompter_screen");
    const text = document.getElementById("technician_teleprompter_text");
    const notes = document.getElementById("technician_teleprompter_notes");
    const title = document.getElementById("technician_teleprompter_title");
    const teamSwitch = document.getElementById("technician_team_switch");
    const teamButtons = Array.from(document.querySelectorAll("[data-technician-player]"));
    const writerNameLabels = Array.from(document.querySelectorAll("[data-technician-writer-name]"));
    const teamTransition = document.getElementById("technician_team_transition");
    const teamTransitionLabel = document.getElementById("technician_team_transition_label");

    document.body.classList.add("page-technician");
    if (overlay) overlay.hidden = false;

    function normalizarPlayer(nextPlayer) {
        return Number(nextPlayer) === 2 ? 2 : 1;
    }

    function normalizarNombreEscritxr(valor, playerId) {
        const id = normalizarPlayer(playerId);
        return String(valor || "").replace(/\s+/g, " ").trim() || `ESCRITXR ${id}`;
    }

    function obtenerNombreEscritxr(playerId) {
        const id = normalizarPlayer(playerId);
        return normalizarNombreEscritxr(writerNames[id], id);
    }

    function renderWriterNames() {
        writerNameLabels.forEach((label) => {
            const id = normalizarPlayer(label.dataset.technicianWriterName);
            label.textContent = obtenerNombreEscritxr(id);
        });
        if (teamTransitionLabel && switchingTeam) {
            teamTransitionLabel.textContent = obtenerNombreEscritxr(transitionTargetPlayer);
        }
    }

    function guardarEquipoSeleccionado() {
        try {
            window.localStorage.setItem(TEAM_STORAGE_KEY, String(selectedPlayer));
        } catch (error) {
            // La selección persiste cuando el navegador permite almacenamiento local.
        }
    }

    function actualizarUrlEquipo() {
        try {
            const url = new URL(window.location.href);
            url.searchParams.set("role", "technician");
            url.searchParams.set("player", String(selectedPlayer));
            window.history.replaceState(window.history.state, "", url);
        } catch (error) {
            // El cambio de equipo no depende de que se pueda actualizar la URL.
        }
    }

    function renderTeamSwitch() {
        document.body.dataset.technicianPlayer = String(selectedPlayer);
        document.title = `SCRB · Técnica · ${obtenerNombreEscritxr(selectedPlayer)}`;
        renderWriterNames();
        teamButtons.forEach((button) => {
            const active = normalizarPlayer(button.dataset.technicianPlayer) === selectedPlayer;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
            button.disabled = switchingTeam;
        });
    }

    function aplicarEquipo(nextPlayer, { requestState = true } = {}) {
        selectedPlayer = normalizarPlayer(nextPlayer);
        marks = [];
        marksRevision = 0;
        anchorScroll = 0;
        anchorTime = performance.now();
        window.ScribActorTeamSelection?.select?.(selectedPlayer, { solicitarEstado: requestState });
        guardarEquipoSeleccionado();
        actualizarUrlEquipo();
        renderTeamSwitch();
        renderState();
    }

    function finalizarCambioEquipo() {
        switchingTeam = false;
        document.body.classList.remove("technician-team-switching");
        if (teamTransition) {
            teamTransition.classList.remove("is-active", "is-team-1", "is-team-2");
            teamTransition.setAttribute("aria-hidden", "true");
        }
        renderTeamSwitch();
    }

    function cambiarEquipo(nextPlayer) {
        const next = normalizarPlayer(nextPlayer);
        if (next === selectedPlayer) return false;
        if (switchingTeam && next === transitionTargetPlayer) return true;
        clearTimeout(switchCommitTimer);
        clearTimeout(switchEndTimer);
        switchingTeam = true;
        transitionTargetPlayer = next;
        document.body.classList.add("technician-team-switching");
        teamButtons.forEach((button) => { button.disabled = true; });

        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (teamTransition) {
            teamTransition.classList.remove("is-team-1", "is-team-2");
            teamTransition.classList.add(`is-team-${next}`, "is-active");
            teamTransition.setAttribute("aria-hidden", "false");
        }
        if (teamTransitionLabel) {
            teamTransitionLabel.textContent = obtenerNombreEscritxr(next);
        }

        if (reduceMotion) {
            aplicarEquipo(next);
            finalizarCambioEquipo();
            return true;
        }

        switchCommitTimer = window.setTimeout(() => aplicarEquipo(next), 325);
        switchEndTimer = window.setTimeout(finalizarCambioEquipo, 800);
        return true;
    }

    const normalizarMarca = (mark = {}) => ({
        ...mark,
        start: Math.max(0, Math.trunc(Number(mark.start) || 0)),
        end: Math.max(0, Math.trunc(Number(mark.end) || 0)),
        note: String(mark.note || "").trim(),
        color: String(mark.color || "").trim(),
        underlineColor: String(mark.underlineColor || "").trim()
    });

    const claveMarca = (mark = {}) => String(
        mark.id || `${mark.start}:${mark.end}:${mark.createdAt || 0}:${mark.note || ""}`
    );

    function estilosSegmento(inicio, fin) {
        return marks.filter((mark) => mark.start < fin && mark.end > inicio);
    }

    function renderMarkedText() {
        if (!text) return;
        const contenido = String(state.text || "");
        const segmentosPorNota = new Map();
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
            const conNotas = activas.filter((mark) => mark.note);
            if (color) segmento.style.color = color;
            if (subrayada) {
                segmento.classList.add("technician-mark--underline");
                segmento.style.setProperty("--technician-mark-color", subrayada.underlineColor || "#ffe95c");
            }
            if (conNotas.length) {
                segmento.classList.add("technician-mark--note");
                segmento.title = conNotas.map((mark) => mark.note).join(" · ");
                conNotas.forEach((mark) => {
                    const key = claveMarca(mark);
                    const segmentos = segmentosPorNota.get(key) || [];
                    segmentos.push(segmento);
                    segmentosPorNota.set(key, segmentos);
                });
            }
            fragment.appendChild(segmento);
        }
        text.replaceChildren(fragment);
        text.style.fontSize = `${Math.max(18, Number(state.fontSize) || 44)}px`;
        const botonesPorNota = renderNotes();
        updateNoteTargets(segmentosPorNota, botonesPorNota);
    }

    function renderNotes() {
        const botones = new Map();
        if (!notes) return botones;
        const anotadas = marks.filter((mark) => mark.note);
        if (!anotadas.length) {
            notes.innerHTML = '<span class="technician-teleprompter__empty">Sin notas para este texto</span>';
            return botones;
        }
        const items = anotadas.map((mark, index) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "technician-teleprompter__note";
            item.dataset.technicianNoteId = claveMarca(mark);
            item.innerHTML = `<b>${index + 1}</b><span></span>`;
            item.querySelector("span").textContent = mark.note;
            item.addEventListener("click", () => {
                const ratio = Math.max(0, Math.min(1, mark.start / Math.max(1, String(state.text || "").length)));
                const maxScroll = Math.max(0, text.scrollHeight - screen.clientHeight);
                anchorScroll = maxScroll * ratio;
                anchorTime = performance.now();
                syncScroll();
            });
            botones.set(claveMarca(mark), item);
            return item;
        });
        notes.replaceChildren(...items);
        return botones;
    }

    function updateNoteTargets(segmentosPorNota, botonesPorNota) {
        visibleNoteId = "";
        lastNoteFollowAt = 0;
        if (!text || !screen || !notes || !segmentosPorNota.size) {
            noteTargets = [];
            return;
        }
        const textRect = text.getBoundingClientRect();
        noteTargets = marks
            .filter((mark) => mark.note)
            .map((mark) => {
                const id = claveMarca(mark);
                const segmentos = segmentosPorNota.get(id) || [];
                const rects = segmentos.flatMap((segmento) => Array.from(segmento.getClientRects()));
                if (!rects.length || !botonesPorNota.has(id)) return null;
                return {
                    id,
                    start: Number(mark.start) || 0,
                    top: Math.min(...rects.map((rect) => rect.top - textRect.top)),
                    bottom: Math.max(...rects.map((rect) => rect.bottom - textRect.top)),
                    button: botonesPorNota.get(id)
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.top - b.top || a.start - b.start);
    }

    function scrollNoteIntoView(target) {
        if (!notes || !target?.button) return;
        const notesRect = notes.getBoundingClientRect();
        const buttonRect = target.button.getBoundingClientRect();
        const left = notes.scrollLeft + buttonRect.left - notesRect.left;
        const right = left + buttonRect.width;
        const visibleLeft = notes.scrollLeft;
        const visibleRight = visibleLeft + notes.clientWidth;
        if (left >= visibleLeft && right <= visibleRight) return;
        const destination = Math.max(0, left - parseFloat(getComputedStyle(notes).paddingLeft || "0"));
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (typeof notes.scrollTo === "function") {
            notes.scrollTo({ left: destination, behavior: reduceMotion ? "auto" : "smooth" });
        } else {
            notes.scrollLeft = destination;
        }
    }

    function followFirstVisibleNote(now = performance.now()) {
        if (!noteTargets.length || !screen || !text || now - lastNoteFollowAt < 120) return;
        lastNoteFollowAt = now;
        const screenRect = screen.getBoundingClientRect();
        const textRect = text.getBoundingClientRect();
        const target = noteTargets.find((item) => (
            textRect.top + item.bottom >= screenRect.top
            && textRect.top + item.top <= screenRect.bottom
        ));
        if (!target) {
            visibleNoteId = "";
            return;
        }
        if (target.id === visibleNoteId) return;
        visibleNoteId = target.id;
        scrollNoteIntoView(target);
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
        followFirstVisibleNote(now);
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
        overlay.classList.toggle("technician-teleprompter--expanded", active);
        overlay.classList.toggle("technician-teleprompter--preparing", Boolean(state.preparing));
        overlay.dataset.player = String(Number(state.source) === 2 ? 2 : selectedPlayer);
        document.body.classList.toggle("technician-teleprompter-visible", active);
        if (title) {
            title.textContent = obtenerNombreEscritxr(Number(state.source) === 2 ? 2 : selectedPlayer);
        }
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
        const source = Number(state.source);
        if ((state.visible || state.preparing) && (source === 1 || source === 2) && source !== selectedPlayer) {
            cambiarEquipo(source);
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
        switchPlayer(nextPlayer) {
            selectedPlayer = normalizarPlayer(nextPlayer);
            marks = [];
            marksRevision = 0;
            noteTargets = [];
            visibleNoteId = "";
            anchorScroll = 0;
            anchorTime = performance.now();
            renderTeamSwitch();
            renderState();
        },
        setWriterName(playerId, value) {
            const id = normalizarPlayer(playerId);
            writerNames[id] = normalizarNombreEscritxr(value, id);
            renderTeamSwitch();
            renderState();
        },
        applyTeleprompter
    };

    socket.on("teleprompter_state", (payload = {}) => applyTeleprompter(payload.state || {}));
    socket.on("connect", () => {
        window.ScribActorTeamSelection?.requestState?.();
    });
    teamSwitch?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-technician-player]");
        if (!button || !teamSwitch.contains(button)) return;
        cambiarEquipo(button.dataset.technicianPlayer);
    });
    raf = requestAnimationFrame(loop);
    window.addEventListener("beforeunload", () => {
        cancelAnimationFrame(raf);
        clearTimeout(switchCommitTimer);
        clearTimeout(switchEndTimer);
    }, { once: true });

    [1, 2].forEach((id) => {
        writerNames[id] = normalizarNombreEscritxr(
            window.ScribActorTeamSelection?.getWriterName?.(id),
            id
        );
    });
    const actorPlayerInicial = window.ScribActorTeamSelection?.getPlayer?.() || 1;
    if (normalizarPlayer(actorPlayerInicial) !== selectedPlayer) {
        aplicarEquipo(selectedPlayer, { requestState: false });
    } else {
        guardarEquipoSeleccionado();
        actualizarUrlEquipo();
        renderTeamSwitch();
        renderState();
    }
    if (socket.connected) {
        window.ScribActorTeamSelection?.requestState?.();
    }
}());
