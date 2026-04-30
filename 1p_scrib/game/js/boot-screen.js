const ESCRITXR_BOOT_DURACION_MS = 7600;
const ESCRITXR_BOOT_PAUSA_FIN_MS = 140;
const ESCRITXR_BOOT_NEGRO_MS = 240;
const ESCRITXR_BOOT_SALIDA_MS = 520;
let escritxrBootActiva = false;
let escritxrBootFrame = null;
let escritxrBootTimeout = null;

function obtenerNombreCargaEscritxr() {
    const valor = String((nombre && nombre.value) || "").trim().toUpperCase();
    return valor || "AUTOR/A";
}

const ACENTOS_TEXTO_CARGA_ESCRITXR = {
    kicker: [
        {
            patron: /(SISTEMA DE ESCRITURA|WRITING SYSTEM|SYSTEME D['’]ECRITURE)/gi,
            clase: "escritxr-boot-accent--cyan"
        }
    ],
    title: [
        {
            patron: /(NUEVO MUNDO|NEW WORLD|NOUVEAU MONDE)/gi,
            clase: "escritxr-boot-accent--gold"
        }
    ],
    copy: [
        {
            patron: /\b(PLUMA|PEN|PLUME)\b/gi,
            clase: "escritxr-boot-accent--gold"
        },
        {
            patron: /\b(ESCENARIO|STAGE|SCENE)\b/gi,
            clase: "escritxr-boot-accent--mint"
        }
    ],
    log: [
        {
            patron: /(RITMO DE ESCRITURA|WRITING PACE|RYTHME D['’]ECRITURE)/gi,
            clase: "escritxr-boot-accent--violet"
        },
        {
            patron: /(NUEVO RETO|NEW CHALLENGE|NOUVEAU DEFI)/gi,
            clase: "escritxr-boot-accent--gold"
        },
        {
            patron: /\b(PLUMA|PEN|PLUME)\b/gi,
            clase: "escritxr-boot-accent--gold"
        },
        {
            patron: /\b(REGLAS|RULES|REGLES)\b/gi,
            clase: "escritxr-boot-accent--mint"
        },
        {
            patron: /\b(MUNDO|WORLD|MONDE)\b/gi,
            clase: "escritxr-boot-accent--cyan"
        },
        {
            patron: /\b(ESCENARIO|STAGE|SCENE)\b/gi,
            clase: "escritxr-boot-accent--mint"
        }
    ],
    status: [
        {
            patron: /(SISTEMA DE ESCRITURA|WRITING SYSTEM|SYSTEME D['’]ECRITURE)/gi,
            clase: "escritxr-boot-accent--cyan"
        },
        {
            patron: /(SINCRONIA ESTABLE|SYNC STABLE|SYNCHRONISATION STABLE)/gi,
            clase: "escritxr-boot-accent--violet"
        },
        {
            patron: /(NUEVO RETO|NEW CHALLENGE|NOUVEAU DEFI)/gi,
            clase: "escritxr-boot-accent--gold"
        },
        {
            patron: /(ESCENARIO Y ATMOSFERA|STAGE AND ATMOSPHERE|SCENE ET DE L['’]AMBIANCE)/gi,
            clase: "escritxr-boot-accent--mint"
        },
        {
            patron: /(ACCESO AUTORIZADO|ACCESS AUTHORIZED|ACCES AUTORISE)/gi,
            clase: "escritxr-boot-accent--gold"
        },
        {
            patron: /(MUNDO CARGADO|WORLD LOADED|MONDE CHARGE)/gi,
            clase: "escritxr-boot-accent--cyan"
        }
    ]
};

function aplicarAcentosTextoCargaEscritxr(html, contexto = "copy") {
    const reglas = ACENTOS_TEXTO_CARGA_ESCRITXR[contexto] || [];
    return reglas.reduce((textoMarcado, { patron, clase }) => {
        return textoMarcado.replace(patron, (coincidencia) => {
            return `<span class="escritxr-boot-accent ${clase}">${coincidencia}</span>`;
        });
    }, html);
}

function renderizarLogsCargaEscritxr(logs, indiceActivo) {
    const lista = getEl("escritxr_boot_logs");
    if (!lista) return;
    const items = Array.from(lista.querySelectorAll("li"));
    items.forEach((item, indice) => {
        item.innerHTML = logs[indice] || "";
        item.classList.toggle("is-active", indice === indiceActivo);
        item.classList.toggle("is-done", indice < indiceActivo);
    });
}

function actualizarTextosCargaEscritxr() {
    const overlay = getEl("escritxr_boot_overlay");
    if (!overlay) return null;

    const nombreEscritxr = escapeHtmlBasico(obtenerNombreCargaEscritxr());
    const writerHtml = `<span class="escritxr-boot-name escritxr-boot-name--escritxr">${nombreEscritxr}</span>`;
    const logs = [
        tJuego1P("boot.writer.log_1", { writer: writerHtml }, `ENLAZANDO PLUMA DE ${writerHtml}`),
        tJuego1P("boot.writer.log_2", {}, "CALIBRANDO EL RITMO DE ESCRITURA"),
        tJuego1P("boot.writer.log_3", {}, "CARGANDO REGLAS DEL NUEVO RETO"),
        tJuego1P("boot.writer.log_4", { writer: writerHtml }, `PINTANDO EL MUNDO DE ${writerHtml}`),
        tJuego1P("boot.writer.log_5", {}, "ABRIENDO EL ESCENARIO")
    ].map((textoLog) => aplicarAcentosTextoCargaEscritxr(textoLog, "log"));
    const estados = [
        tJuego1P("boot.writer.state_1", {}, "ENLAZANDO SISTEMA DE ESCRITURA"),
        tJuego1P("boot.writer.state_2", {}, "SINCRONIA ESTABLE"),
        tJuego1P("boot.writer.state_3", {}, "COMPILANDO EL NUEVO RETO"),
        tJuego1P("boot.writer.state_4", {}, "LEVANTANDO ESCENARIO Y ATMOSFERA"),
        tJuego1P("boot.writer.state_5", {}, "ACCESO AUTORIZADO")
    ].map((textoEstado) => aplicarAcentosTextoCargaEscritxr(textoEstado, "status"));

    const kicker = getEl("escritxr_boot_kicker");
    const titulo = getEl("escritxr_boot_title");
    const copy = getEl("escritxr_boot_copy");
    if (kicker) {
        kicker.innerHTML = aplicarAcentosTextoCargaEscritxr(
            escapeHtmlBasico(tJuego1P("boot.writer.kicker", {}, "INICIANDO SISTEMA DE ESCRITURA")),
            "kicker"
        );
    }
    if (titulo) {
        titulo.innerHTML = aplicarAcentosTextoCargaEscritxr(
            escapeHtmlBasico(tJuego1P("boot.writer.title", {}, "ENTRANDO EN UN NUEVO MUNDO")),
            "title"
        );
    }
    if (copy) {
        copy.innerHTML = aplicarAcentosTextoCargaEscritxr(
            tJuego1P(
                "boot.writer.copy",
                { writer: writerHtml },
                `${writerHtml} afila la pluma. Preparando la entrada al escenario.`
            ),
            "copy"
        );
    }

    return { overlay, logs, estados };
}

function limpiarEstadoOverlayCargaEscritxr(overlay = getEl("escritxr_boot_overlay")) {
    if (document.body) {
        document.body.classList.remove("escritxr-boot-activa");
    }
    if (!overlay) return;
    overlay.classList.remove("is-active", "is-finishing", "is-revealing");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--boot-bar-progress", "0%");
    overlay.style.setProperty("--boot-world-progress", "0%");
}

function finalizarCargaInicialEscritxr() {
    const overlay = getEl("escritxr_boot_overlay");
    if (escritxrBootFrame) {
        cancelAnimationFrame(escritxrBootFrame);
        escritxrBootFrame = null;
    }
    if (escritxrBootTimeout) {
        clearTimeout(escritxrBootTimeout);
        escritxrBootTimeout = null;
    }
    escritxrBootActiva = false;
    if (!overlay) {
        asegurarMusicaMenu1P();
        limpiarEstadoOverlayCargaEscritxr(null);
        return;
    }
    overlay.classList.add("is-finishing");
    overlay.classList.remove("is-revealing");
    overlay.setAttribute("aria-hidden", "true");
    escritxrBootTimeout = setTimeout(() => {
        overlay.classList.add("is-revealing");
        escritxrBootTimeout = setTimeout(() => {
            escritxrBootTimeout = null;
            limpiarEstadoOverlayCargaEscritxr(overlay);
            asegurarMusicaMenu1P();
        }, ESCRITXR_BOOT_SALIDA_MS);
    }, ESCRITXR_BOOT_NEGRO_MS);
}

function iniciarCargaInicialEscritxr() {
    if (escritxrBootActiva) return;
    const datos = actualizarTextosCargaEscritxr();
    if (!datos || !datos.overlay) {
        iniciarMusicaMenu1P({ reiniciar: true, volumeInicial: 0, fadeInMs: 900 });
        return;
    }

    const { overlay, logs, estados } = datos;
    const porcentaje = getEl("escritxr_boot_percent");
    const estado = getEl("escritxr_boot_status");
    const pixels = Array.from(document.querySelectorAll("#escritxr_boot_pixels span"));
    const umbrales = [0.12, 0.34, 0.56, 0.79, 0.96];

    escritxrBootActiva = true;
    if (document.body) {
        document.body.classList.add("escritxr-boot-activa");
    }
    overlay.classList.remove("is-finishing", "is-revealing");
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    overlay.style.setProperty("--boot-bar-progress", "0%");
    overlay.style.setProperty("--boot-world-progress", "0%");
    pixels.forEach((pixel) => pixel.classList.remove("is-on"));
    renderizarLogsCargaEscritxr(logs, 0);
    iniciarMusicaMenu1P({ reiniciar: true, volumeInicial: 0, fadeInMs: 900 });

    const inicio = performance.now();
    const bootReducidoMovil = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const intervaloPintadoMs = bootReducidoMovil ? 96 : 0;
    let ultimoPintadoBoot = -Infinity;
    const paso = (ahora) => {
        const progreso = Math.min((ahora - inicio) / ESCRITXR_BOOT_DURACION_MS, 1);
        if (intervaloPintadoMs && progreso < 1 && (ahora - ultimoPintadoBoot) < intervaloPintadoMs) {
            escritxrBootFrame = requestAnimationFrame(paso);
            return;
        }
        const easing = 1 - Math.pow(1 - progreso, 3);
        const pct = Math.round(easing * 100);
        let indiceActivo = umbrales.findIndex((umbral) => progreso <= umbral);
        if (indiceActivo === -1) indiceActivo = logs.length - 1;
        ultimoPintadoBoot = ahora;

        overlay.style.setProperty("--boot-bar-progress", `${pct}%`);
        overlay.style.setProperty("--boot-world-progress", `${Math.max(12, pct)}%`);
        if (porcentaje) porcentaje.textContent = `${pct}%`;
        if (estado) estado.innerHTML = estados[indiceActivo] || estados[estados.length - 1];
        renderizarLogsCargaEscritxr(logs, indiceActivo);

        const pixelsActivos = Math.round((pixels.length || 0) * easing);
        pixels.forEach((pixel, indice) => {
            pixel.classList.toggle("is-on", indice < pixelsActivos);
        });

        if (progreso < 1) {
            escritxrBootFrame = requestAnimationFrame(paso);
            return;
        }

        escritxrBootFrame = null;
        renderizarLogsCargaEscritxr(logs, logs.length);
        if (estado) {
            estado.innerHTML = aplicarAcentosTextoCargaEscritxr(
                tJuego1P("boot.writer.state_done", {}, "MUNDO CARGADO"),
                "status"
            );
        }
        if (porcentaje) porcentaje.textContent = "100%";
        escritxrBootTimeout = setTimeout(() => {
            finalizarCargaInicialEscritxr();
        }, ESCRITXR_BOOT_PAUSA_FIN_MS);
    };

    escritxrBootFrame = requestAnimationFrame(paso);
}

texto.addEventListener("keydown", (e) => {
    if (bloquear_borrado_putada && e.key === "Backspace") {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const direccion = e.key === "ArrowRight" ? "forward" : "backward";
        if (moverCursorPorPalabraBendita(direccion)) {
            e.preventDefault();
            return;
        }
    }
    if (e.key === "Backspace" || e.key === "Delete") {
        const sel = window.getSelection();
        const direccion = e.key === "Backspace" ? "backward" : "forward";
        if (caretAfectaPalabraBendita(direccion)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        const rangoBorrado = obtenerRangoBorradoCaracter(direccion);
        if (rangoBorrado && rangoIntersecaPalabraBendita(rangoBorrado)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        if (hayPalabraBenditaAdyacente(sel, direccion)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
    }
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;

        if (
          startContainer.nodeType === 1 &&
          startOffset === 0 &&
          startContainer.previousSibling &&
          startContainer.previousSibling.getAttribute &&
          startContainer.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault();
        }

        if (
          startContainer.nodeType === 3 &&
          startOffset === 0 &&
          startContainer.parentNode.previousSibling &&
          startContainer.parentNode.previousSibling.getAttribute &&
          startContainer.parentNode.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault();
        }
      }
    }
});

