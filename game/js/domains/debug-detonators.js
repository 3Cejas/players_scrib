(function instalarDetonadoresDebug(global) {
    "use strict";

    const ID_ESTILOS = "scrib-debug-detonators-styles";
    const ID_CAPA = "scrib-debug-detonators-layer";
    const PALABRAS = [
        "VOLC\u00c1N", "SECRETO", "TORMENTA", "LABERINTO", "SALTO",
        "RUIDO", "FUEGO", "SUE\u00d1O", "GIRO", "DESTELLO", "\u00a1BUM!"
    ];

    function asegurarEstilos(documento) {
        if (!documento || documento.getElementById(ID_ESTILOS)) return;
        const estilos = documento.createElement("style");
        estilos.id = ID_ESTILOS;
        estilos.textContent = `
            .scrib-debug-detonators-layer {
                position: fixed;
                z-index: 2147482000;
                inset: 0;
                overflow: hidden;
                pointer-events: none;
                contain: strict;
            }
            .scrib-debug-detonator {
                --debug-color: #6ff7ff;
                position: absolute;
                left: var(--debug-x);
                top: var(--debug-y);
                display: inline-flex;
                align-items: center;
                gap: .28em;
                max-width: 72vw;
                padding: .28em .48em;
                border: .08em solid color-mix(in srgb, var(--debug-color), white 28%);
                border-radius: .3em;
                background: rgba(2, 8, 16, .88);
                color: var(--debug-color);
                box-shadow: 0 0 .55em var(--debug-color), inset 0 0 .35em color-mix(in srgb, var(--debug-color), transparent 78%);
                font: 800 var(--debug-size)/1 "Retro-gaming", monospace;
                letter-spacing: .04em;
                text-shadow: .06em .06em #000, 0 0 .42em var(--debug-color);
                white-space: nowrap;
                opacity: 0;
                transform: translate(-50%, -50%) scale(.18) rotate(var(--debug-rotation));
                will-change: transform, opacity, filter;
                animation: scribDebugDetonatorFly var(--debug-duration) cubic-bezier(.16,.78,.2,1) forwards;
            }
            .scrib-debug-detonator::before { content: "\ud83d\udca5"; }
            @keyframes scribDebugDetonatorFly {
                0% { opacity: 0; filter: blur(8px) brightness(2.2); transform: translate(-50%, -50%) scale(.18) rotate(var(--debug-rotation)); }
                12% { opacity: 1; filter: blur(0) brightness(1.5); transform: translate(-50%, -50%) scale(1.16) rotate(calc(var(--debug-rotation) * -.35)); }
                25% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                78% { opacity: 1; filter: blur(0) brightness(1); }
                100% { opacity: 0; filter: blur(4px) brightness(1.7); transform: translate(calc(-50% + var(--debug-dx)), calc(-50% + var(--debug-dy))) scale(.72) rotate(calc(var(--debug-rotation) * .55)); }
            }
            @media (prefers-reduced-motion: reduce) {
                .scrib-debug-detonator { animation-duration: 1.4s; }
            }
        `;
        documento.head.appendChild(estilos);
    }

    function asegurarCapa(documento) {
        let capa = documento.getElementById(ID_CAPA);
        if (capa) return capa;
        capa = documento.createElement("div");
        capa.id = ID_CAPA;
        capa.className = "scrib-debug-detonators-layer";
        capa.setAttribute("aria-hidden", "true");
        documento.body.appendChild(capa);
        return capa;
    }

    function numeroAleatorio(minimo, maximo) {
        return minimo + (Math.random() * (maximo - minimo));
    }

    function burst(payload = {}, documento = global.document) {
        if (!documento || !documento.body) return 0;
        asegurarEstilos(documento);
        const capa = asegurarCapa(documento);
        const cantidad = Math.min(8, Math.max(1, Math.round(Number(payload.cantidad) || 3)));
        const velocidad = Math.min(10, Math.max(1, Number(payload.velocidad) || 5));
        const colores = ["#54efff", "#ff5e72", "#ffd65a", "#75ff9b", "#d58cff", "#ff944f"];
        for (let i = 0; i < cantidad; i += 1) {
            const nodo = documento.createElement("span");
            nodo.className = "scrib-debug-detonator";
            nodo.textContent = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
            nodo.style.setProperty("--debug-x", `${numeroAleatorio(8, 92).toFixed(2)}vw`);
            nodo.style.setProperty("--debug-y", `${numeroAleatorio(12, 88).toFixed(2)}vh`);
            nodo.style.setProperty("--debug-dx", `${numeroAleatorio(-13, 13).toFixed(2)}vw`);
            nodo.style.setProperty("--debug-dy", `${numeroAleatorio(-16, 8).toFixed(2)}vh`);
            nodo.style.setProperty("--debug-size", `${numeroAleatorio(1.05, 3.35).toFixed(2)}rem`);
            nodo.style.setProperty("--debug-rotation", `${numeroAleatorio(-14, 14).toFixed(2)}deg`);
            nodo.style.setProperty("--debug-duration", `${Math.max(1.7, 4.4 - (velocidad * .2)).toFixed(2)}s`);
            nodo.style.setProperty("--debug-color", colores[Math.floor(Math.random() * colores.length)]);
            nodo.addEventListener("animationend", () => nodo.remove(), { once: true });
            capa.appendChild(nodo);
        }
        while (capa.childElementCount > 64) capa.firstElementChild.remove();
        return cantidad;
    }

    function clear(documento = global.document) {
        const capa = documento && documento.getElementById(ID_CAPA);
        if (capa) capa.replaceChildren();
    }

    global.ScribDebugDetonators = Object.freeze({ burst, clear });
})(typeof window !== "undefined" ? window : globalThis);
