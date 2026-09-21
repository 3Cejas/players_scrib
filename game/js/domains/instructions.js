(function initScribInstructions(root, factory) {
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.ScribInstructions = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildScribInstructions(root) {
    "use strict";

    const STEP_MAX = 6;
    const STEP_COUNT = STEP_MAX + 1;
    const WRITER_DEMO_WRITING_MS = 1800;
    const WRITER_DEMO_IDLE_MS = 1400;
    const WRITER_DEMO_DELETE_INTERVAL_MS = 420;
    const WRITER_DEMO_EMPTY_MS = 1200;

    const safeText = (value, fallback) => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeStep = (value) => {
        const number = Number(value);
        return Number.isFinite(number) ? Math.max(0, Math.min(STEP_MAX, Math.trunc(number))) : 0;
    };

    const normalizeCredits = (value = {}) => {
        const fallback = root && root.ScribCredits ? root.ScribCredits.DEFAULT_STATE : {};
        const credits = value && typeof value === "object" ? value : {};
        return {
            escritxrRojo: safeText(credits.escritxr_rojo, fallback.escritxr_rojo || "ESCRITXR ROJX"),
            escritxrAzul: safeText(credits.escritxr_azul, fallback.escritxr_azul || "ESCRITXR AZUL"),
            interpretesRojos: [
                safeText(credits.interprete_rojo_1, fallback.interprete_rojo_1 || "INTÉRPRETE 1"),
                safeText(credits.interprete_rojo_2, fallback.interprete_rojo_2 || "INTÉRPRETE 2")
            ],
            interpretesAzules: [
                safeText(credits.interprete_azul_1, fallback.interprete_azul_1 || "INTÉRPRETE 1"),
                safeText(credits.interprete_azul_2, fallback.interprete_azul_2 || "INTÉRPRETE 2")
            ]
        };
    };

    const teamMarkup = (team, credits) => {
        const red = team === "rojo";
        const writer = red ? credits.escritxrRojo : credits.escritxrAzul;
        const performers = red ? credits.interpretesRojos : credits.interpretesAzules;
        return `
            <div class="scrib-instructions__team scrib-instructions__team--${team}">
                <span class="scrib-instructions__team-orbit" aria-hidden="true"></span>
                <span class="scrib-instructions__feather" aria-hidden="true">${red ? "🪶" : "🖋️"}</span>
                <p class="scrib-instructions__eyebrow">EQUIPO ${red ? "ROJO" : "AZUL"}</p>
                <h2>${writer}</h2>
                <div class="scrib-instructions__cast">
                    <span>🎭 ${performers[0]}</span>
                    <span>🎭 ${performers[1]}</span>
                </div>
            </div>`;
    };

    const sceneMarkup = (step, credits) => {
        if (step === 1) return teamMarkup("rojo", credits);
        if (step === 2) return teamMarkup("azul", credits);
        if (step === 0) {
            return `
                <div class="scrib-instructions__scene scrib-instructions__scene--process">
                    <p class="scrib-instructions__eyebrow">ASÍ NACE UNA HISTORIA</p>
                    <h2>DOS ESCRITORAS.<br>DOS HISTORIAS.</h2>
                    <div class="scrib-instructions__process" aria-label="Dos escritoras crean dos obras que llegan a escena">
                        <span><b>✍️</b>ESCRIBEN</span><i>→</i><span><b>🎮</b>COMPITEN</span><i>→</i><span><b>🎭</b>SUBE A ESCENA</span>
                    </div>
                    <p class="scrib-instructions__keyline">MUSAS, VAIS A AYUDAR A NACER HISTORIAS</p>
                </div>`;
        }
        if (step === 3) {
            return `
                <div class="scrib-instructions__scene scrib-instructions__scene--veil">
                    <div class="scrib-instructions__veil" aria-hidden="true"><i></i><i></i></div>
                    <p class="scrib-instructions__eyebrow">ESCRITORAS</p>
                    <h2>OCUPAD VUESTRO<br>LUGAR</h2>
                </div>`;
        }
        if (step === 4) {
            return `
                <div class="scrib-instructions__scene scrib-instructions__scene--delete">
                    <p class="scrib-instructions__eyebrow">EL JUEGO NO ESPERA</p>
                    <h2>SI PARAN…<br><em>EL TEXTO DESAPARECE</em></h2>
                    <div class="scrib-instructions__writer-demo" data-state="writing" aria-label="Demostración de escritura y borrado automático">
                        <div class="scrib-instructions__writer-demo-head" aria-hidden="true">
                            <span>ESCRITXR</span>
                            <span class="scrib-instructions__writer-status">
                                <b class="scrib-instructions__writer-status-write">ESCRIBIENDO ↑</b>
                                <b class="scrib-instructions__writer-status-rest">SIN ESCRIBIR ↓</b>
                            </span>
                        </div>
                        <p class="scrib-instructions__writer-copy"><span class="scrib-instructions__cursor-line" data-full-text="La historia empieza a cobrar vida">La historia empieza a cobrar vida</span><i aria-hidden="true"></i></p>
                    </div>
                </div>`;
        }
        if (step === 5) {
            return `
                <div class="scrib-instructions__scene scrib-instructions__scene--ideas">
                    <p class="scrib-instructions__eyebrow">LAS MUSAS ENTRAN EN LA HISTORIA</p>
                    <h2>ENVÍA PALABRAS.<br>INSPIRA A TU ESCRITORA.</h2>
                    <div class="scrib-instructions__idea-composer" aria-label="Ejemplo bloqueado del envío de palabras">
                        <label for="scrib_instructions_word">PALABRA PARA TU ESCRITORA</label>
                        <div class="scrib-instructions__idea-input-row">
                            <input id="scrib_instructions_word" type="text" placeholder="ESCRIBE UNA PALABRA" disabled>
                            <button type="button" disabled>INSPIRAR <span aria-hidden="true">🚀</span></button>
                        </div>
                    </div>
                </div>`;
        }
        return `
            <div class="scrib-instructions__scene scrib-instructions__scene--victory">
                <p class="scrib-instructions__eyebrow">INSPIRAR TAMBIÉN ES JUGAR</p>
                <h2>CUANTO MÁS Y MEJOR<br>INSPIRÉIS…</h2>
                <div class="scrib-instructions__scorebar" aria-label="Marcador de inspiración en movimiento">
                    <strong class="scrib-instructions__score scrib-instructions__score--blue">24</strong>
                    <div class="scrib-instructions__score-track" aria-hidden="true">
                        <span class="scrib-instructions__score-segment scrib-instructions__score-segment--blue"></span>
                        <span class="scrib-instructions__score-segment scrib-instructions__score-segment--red"></span>
                        <i class="scrib-instructions__score-center"></i>
                    </div>
                    <strong class="scrib-instructions__score scrib-instructions__score--red">18</strong>
                </div>
            </div>`;
    };

    function create(options = {}) {
        const documentRef = options.documentRef || (root && root.document) || null;
        let node = options.container || null;
        let state = { visible: false, step: 0, credits: normalizeCredits(), perspective: "spectator", team: 0 };
        let featureMusicActive = false;
        let writerAnimationFrame = null;

        const ensureNode = () => {
            if (node || !documentRef || !documentRef.body) return node;
            node = documentRef.createElement("section");
            node.className = "scrib-instructions";
            node.hidden = true;
            node.setAttribute("aria-hidden", "true");
            node.setAttribute("aria-live", "polite");
            documentRef.body.appendChild(node);
            return node;
        };

        const setFeatureMusic = (active) => {
            const next = Boolean(active);
            if (next === featureMusicActive) return;
            featureMusicActive = next;
            const EventCtor = root && root.CustomEvent;
            if (documentRef && typeof documentRef.dispatchEvent === "function" && typeof EventCtor === "function") {
                documentRef.dispatchEvent(new EventCtor("scrib:view-feature-music", {
                    detail: { active: next, source: "instructions" }
                }));
            }
        };

        const stopWriterAnimation = () => {
            if (writerAnimationFrame == null) return;
            root?.cancelAnimationFrame?.(writerAnimationFrame);
            writerAnimationFrame = null;
        };

        const startWriterAnimation = () => {
            stopWriterAnimation();
            const textNode = node?.querySelector?.(".scrib-instructions__cursor-line");
            const requestFrame = root?.requestAnimationFrame?.bind(root);
            if (!textNode || !requestFrame) return;
            const characters = Array.from(String(textNode.dataset.fullText || textNode.textContent || ""));
            if (root?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
                textNode.textContent = characters.join("");
                return;
            }
            const demo = textNode.closest?.(".scrib-instructions__writer-demo");
            const deletionDuration = characters.length * WRITER_DEMO_DELETE_INTERVAL_MS;
            const deletionStartsAt = WRITER_DEMO_WRITING_MS + WRITER_DEMO_IDLE_MS;
            const deletionEndsAt = deletionStartsAt + deletionDuration;
            const duration = deletionEndsAt + WRITER_DEMO_EMPTY_MS;
            let startedAt = null;
            let previousVisible = characters.length;
            let previousState = "writing";
            const update = (timestamp) => {
                if (!state.visible || state.step !== 4) {
                    writerAnimationFrame = null;
                    return;
                }
                if (startedAt == null) startedAt = timestamp;
                const elapsed = (timestamp - startedAt) % duration;
                const demoState = elapsed < WRITER_DEMO_WRITING_MS ? "writing" : "resting";
                let visible = characters.length;
                if (elapsed >= deletionStartsAt && elapsed < deletionEndsAt) {
                    const removed = Math.floor((elapsed - deletionStartsAt) / WRITER_DEMO_DELETE_INTERVAL_MS) + 1;
                    visible = characters.length - removed;
                } else if (elapsed >= deletionEndsAt) {
                    visible = 0;
                }
                visible = Math.max(0, Math.min(characters.length, visible));
                if (demo && demoState !== previousState) {
                    previousState = demoState;
                    demo.dataset.state = demoState;
                }
                if (visible !== previousVisible) {
                    previousVisible = visible;
                    textNode.textContent = characters.slice(0, visible).join("");
                }
                writerAnimationFrame = requestFrame(update);
            };
            writerAnimationFrame = requestFrame(update);
        };

        const render = () => {
            const target = ensureNode();
            if (!target) return;
            stopWriterAnimation();
            target.hidden = !state.visible;
            target.setAttribute("aria-hidden", state.visible ? "false" : "true");
            target.dataset.step = String(state.step);
            target.dataset.perspective = state.perspective;
            target.dataset.team = String(state.team || 0);
            if (!state.visible) {
                setFeatureMusic(false);
                return;
            }
            target.innerHTML = `
                <div class="scrib-instructions__backdrop" aria-hidden="true"><i></i><i></i><i></i></div>
                <div class="scrib-instructions__stage">${sceneMarkup(state.step, state.credits)}</div>`;
            if (state.step === 4) startWriterAnimation();
            target.classList.remove("is-entering");
            void target.offsetWidth;
            target.classList.add("is-entering");
            // Las dos presentaciones de equipo comparten una sola entrada
            // musical: cambiar de rojo a azul no reinicia la pista.
            setFeatureMusic(state.step === 1 || state.step === 2);
        };

        return {
            setState(next = {}) {
                state = {
                    ...state,
                    ...next,
                    visible: Boolean(Object.prototype.hasOwnProperty.call(next, "visible") ? next.visible : state.visible),
                    step: normalizeStep(Object.prototype.hasOwnProperty.call(next, "step") ? next.step : state.step),
                    credits: normalizeCredits(next.credits || state.credits),
                    perspective: next.perspective === "muse" ? "muse" : "spectator",
                    team: Number(next.team) === 2 ? 2 : Number(next.team) === 1 ? 1 : 0
                };
                render();
                return { ...state };
            },
            getState: () => ({ ...state }),
            destroy() {
                stopWriterAnimation();
                setFeatureMusic(false);
                node?.remove?.();
                node = null;
            }
        };
    }

    return { create, normalizeStep, STEP_COUNT, STEP_MAX };
});
