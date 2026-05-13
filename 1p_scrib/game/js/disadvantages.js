const DURACION_ELECCION_DESVENTAJA_MS = 8000;
const DURACION_LECTURA_RESULTADO_TRAGAPERRAS_MS = 2400;
const INTERVALO_TRAGAPERRAS_MS = 80;
const TICKS_BASE_TRAGAPERRAS = 20;
const TICKS_EXTRA_POR_REEL = 9;
const RETRASO_FINAL_TRAGAPERRAS_MS = 320;
const DESVENTAJAS_BASE = [
    { emoji: "\uD83D\uDC22", dificultad: "facil", descripcion: "El teclado ira mas lento." },
    { emoji: "\u26A1", dificultad: "dificil", descripcion: "El juego borrara mas rapido tu texto." },
    { emoji: "\uD83C\uDF2A\uFE0F", dificultad: "facil", descripcion: "Una bruma dificultara la lectura del texto." },
    { emoji: "\uD83D\uDE43", dificultad: "media", descripcion: "El texto se invertira en espejo." },
    { emoji: "\uD83D\uDD8A\uFE0F", dificultad: "media", descripcion: "No podras borrar durante unos segundos." }
];
const MAPA_DESVENTAJAS = new Map(DESVENTAJAS_BASE.map((item) => [item.emoji, item]));

function limpiar_bloqueo_putada() {
    bloquear_borrado_putada = false;
    if (timeout_bloqueo_putada) {
        clearTimeout(timeout_bloqueo_putada);
        timeout_bloqueo_putada = null;
    }
    if (putada_actual === "🖊️") {
        putada_actual = "";
    }
}

function limpiar_teclado_lento() {
    revision_teclado_lento_1p += 1;
    teclado_lento_putada = false;
    if (timeout_teclado_lento) {
        clearTimeout(timeout_teclado_lento);
        timeout_teclado_lento = null;
    }
    if (putada_actual === "🐢") {
        putada_actual = "";
    }
}


function reduceLog(base, k = 1) {
    if (base <= 0) return 0;
    const lnBase = Math.log(base);
    const denom = 1 + k * lnBase;
    return Math.round(base / denom);
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function smoothstep01(value) {
    const t = clampNumber(value, 0, 1);
    return t * t * (3 - 2 * t);
}

function obtenerFactoresDesventajaPorVida(segundosVida) {
    const ratio = smoothstep01(clampNumber((Number(segundosVida) || 0) / VIDA_MAX_SEGUNDOS, 0, 1));
    return {
        facil: 1.95 - (1.95 - 0.52) * ratio,
        media: 1.1,
        dificil: 0.45 + (1.95 - 0.45) * ratio
    };
}

function obtenerPesoDesventaja(emoji, segundosVida) {
    const info = MAPA_DESVENTAJAS.get(emoji);
    const dificultad = info ? info.dificultad : "media";
    const factores = obtenerFactoresDesventajaPorVida(segundosVida);
    return Math.max(0.001, factores[dificultad] || factores.media);
}

function seleccionarPonderado(opciones, pesos) {
    if (!Array.isArray(opciones) || opciones.length === 0) return null;
    const total = pesos.reduce((acc, peso) => acc + Math.max(0, Number(peso) || 0), 0);
    if (total <= 0) {
        return opciones[Math.floor(Math.random() * opciones.length)];
    }
    let tirada = Math.random() * total;
    for (let i = 0; i < opciones.length; i++) {
        tirada -= Math.max(0, Number(pesos[i]) || 0);
        if (tirada <= 0) {
            return opciones[i];
        }
    }
    return opciones[opciones.length - 1];
}

function elegirDesventajaPonderada(opciones, segundosVida = secondsRemaining) {
    const lista = Array.isArray(opciones) ? opciones.slice() : [];
    if (!lista.length) return null;
    const pesos = lista.map((emoji) => obtenerPesoDesventaja(emoji, segundosVida));
    return seleccionarPonderado(lista, pesos);
}

function generarResultadoTragaperras() {
    const emojis = DESVENTAJAS_BASE.map((item) => item.emoji);
    const resultado = [
        elegirDesventajaPonderada(emojis),
        elegirDesventajaPonderada(emojis),
        elegirDesventajaPonderada(emojis)
    ];
    const conteo = new Map();
    resultado.forEach((emoji) => conteo.set(emoji, (conteo.get(emoji) || 0) + 1));
    for (const [emoji, cantidad] of conteo.entries()) {
        if (cantidad === 2) {
            return [emoji, emoji, emoji];
        }
    }
    return resultado;
}

function limpiarTimersDecisionDesventaja() {
    if (desventajaDecisionTimeout) {
        clearTimeout(desventajaDecisionTimeout);
        desventajaDecisionTimeout = null;
    }
    if (desventajaDecisionInterval) {
        clearInterval(desventajaDecisionInterval);
        desventajaDecisionInterval = null;
    }
}

function obtenerNodoEmojiReel(reel) {
    if (!reel) return null;
    let nodo = reel.querySelector(".desventaja-reel-emoji");
    if (!nodo) {
        const inicial = (reel.textContent || "").trim() || "?";
        reel.textContent = "";
        nodo = document.createElement("span");
        nodo.className = "desventaja-reel-emoji";
        nodo.textContent = inicial;
        reel.appendChild(nodo);
    }
    return nodo;
}

function setEmojiReel(reel, emoji) {
    if (!reel) return;
    const nodo = obtenerNodoEmojiReel(reel);
    const valor = String(emoji || "?");
    if (nodo) nodo.textContent = valor;
    reel.dataset.emoji = valor;
}

function getEmojiReel(reel) {
    if (!reel) return "";
    if (reel.dataset && reel.dataset.emoji) {
        return reel.dataset.emoji;
    }
    const nodo = reel.querySelector(".desventaja-reel-emoji");
    if (nodo) {
        return (nodo.textContent || "").trim();
    }
    return (reel.textContent || "").trim();
}

function limpiarReelsDesventaja() {
    const reels = [desventajaReel1, desventajaReel2, desventajaReel3];
    reels.forEach((reel) => {
        if (!reel) return;
        setEmojiReel(reel, "?");
        reel.classList.remove("frenada", "girando", "elegible", "seleccionado", "auto");
        reel.removeAttribute("data-emoji");
        reel.onclick = null;
    });
}

function ocultarOverlayDesventaja() {
    limpiarTimersDecisionDesventaja();
    limpiarReelsDesventaja();
    if (desventajaOverlay) desventajaOverlay.classList.remove("activa");
    if (desventajaSlot) desventajaSlot.classList.remove("fusionando");
    if (desventajaChoiceTimer) desventajaChoiceTimer.classList.remove("activa");
    if (desventajaChoices) desventajaChoices.innerHTML = "";
    if (desventajaLegend) desventajaLegend.innerHTML = "";
}

function cancelarSecuenciaDesventaja() {
    desventajaSecuenciaId += 1;
    desventajaEnCurso = false;
    ocultarOverlayDesventaja();
}

function mostrarOverlayDesventaja() {
    if (!desventajaOverlay) return;
    desventajaOverlay.classList.add("activa");
}

function setEstadoDesventaja(textoEstado) {
    if (!desventajaStatus) return;
    desventajaStatus.textContent = textoEstado || "";
}

function renderLeyendaDesventajas(opciones, activaEmoji = "") {
    if (!desventajaLegend) return;
    const lista = (opciones || []).map((emoji) => {
        const info = MAPA_DESVENTAJAS.get(emoji);
        const desc = info ? info.descripcion : "Desventaja";
        const activaClass = activaEmoji === emoji ? " activa" : "";
        return `<button type="button" class="desventaja-legend-item${activaClass}" data-desventaja-emoji="${escapeHtmlBasico(emoji)}" aria-label="${escapeHtmlBasico(`${emoji} ${desc}`)}"><span class="desventaja-legend-emoji">${emoji}</span><span class="desventaja-legend-text">${escapeHtmlBasico(desc)}</span></button>`;
    });
    desventajaLegend.innerHTML = lista.join("");
}

function renderBotonesDesventajas(opciones, activaEmoji = "", autoEmoji = "") {
    if (!desventajaChoices) return;
    const lista = (opciones || []).map((emoji) => {
        const info = MAPA_DESVENTAJAS.get(emoji);
        const desc = (info ? info.descripcion : "Desventaja").replace(/\.\s*$/, "");
        const activaClass = activaEmoji === emoji ? " seleccionado" : "";
        const autoClass = autoEmoji === emoji ? " auto" : "";
        return `<button type="button" class="desventaja-choice-btn${activaClass}${autoClass}" data-desventaja-emoji="${escapeHtmlBasico(emoji)}" aria-label="${escapeHtmlBasico(`${emoji} ${desc}`)}"><span class="desventaja-choice-emoji">${emoji}</span><span class="desventaja-choice-text">${escapeHtmlBasico(desc)}</span></button>`;
    });
    desventajaChoices.innerHTML = lista.join("");
}

function vincularControlesEleccionDesventaja(onSelect) {
    const contenedores = [desventajaChoices, desventajaLegend];
    contenedores.forEach((contenedor) => {
        if (!contenedor) return;
        contenedor.querySelectorAll("[data-desventaja-emoji]").forEach((nodo) => {
            nodo.onclick = () => {
                const emoji = nodo.dataset.desventajaEmoji || "";
                if (!emoji) return;
                onSelect(emoji, false);
            };
        });
    });
}

function animarTragaperras(resultado, tokenSecuencia) {
    const reels = [desventajaReel1, desventajaReel2, desventajaReel3];
    const emojis = DESVENTAJAS_BASE.map((item) => item.emoji);
    reels.forEach((reel) => {
        if (!reel) return;
        obtenerNodoEmojiReel(reel);
        reel.classList.remove("frenada", "girando", "elegible", "seleccionado", "auto");
        reel.onclick = null;
    });

    return new Promise((resolve) => {
        let pendientes = reels.length;
        reels.forEach((reel, index) => {
            if (!reel) {
                pendientes -= 1;
                if (pendientes <= 0) resolve();
                return;
            }
            let ticks = 0;
            const maxTicks = TICKS_BASE_TRAGAPERRAS + (index * TICKS_EXTRA_POR_REEL);
            reel.classList.add("girando");
            const interval = setInterval(() => {
                if (tokenSecuencia !== desventajaSecuenciaId) {
                    clearInterval(interval);
                    reel.classList.remove("girando");
                    pendientes -= 1;
                    if (pendientes <= 0) resolve();
                    return;
                }
                setEmojiReel(reel, emojis[Math.floor(Math.random() * emojis.length)]);
                ticks += 1;
                if (ticks >= maxTicks) {
                    clearInterval(interval);
                    reel.classList.remove("girando");
                    setEmojiReel(reel, resultado[index]);
                    reel.classList.add("frenada");
                    pendientes -= 1;
                    if (pendientes <= 0) {
                        setTimeout(resolve, RETRASO_FINAL_TRAGAPERRAS_MS);
                    }
                }
            }, INTERVALO_TRAGAPERRAS_MS);
        });
    });
}

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function iniciarCuentaEleccionDesventaja(opciones, tokenSecuencia, onSelect) {
    if (!desventajaChoiceTimer || !desventajaChoiceTimerFill) return;
    const inicio = Date.now();
    const total = DURACION_ELECCION_DESVENTAJA_MS;
    desventajaChoiceTimer.classList.add("activa");
    desventajaChoiceTimerFill.classList.remove("urgente");
    desventajaChoiceTimerFill.style.transform = "scaleX(1)";

    limpiarTimersDecisionDesventaja();
    desventajaDecisionInterval = setInterval(() => {
        if (tokenSecuencia !== desventajaSecuenciaId) {
            limpiarTimersDecisionDesventaja();
            return;
        }
        const transcurrido = Date.now() - inicio;
        const restante = Math.max(0, total - transcurrido);
        const ratio = restante / total;
        desventajaChoiceTimerFill.style.transform = `scaleX(${ratio})`;
        if (ratio <= 0.35) {
            desventajaChoiceTimerFill.classList.add("urgente");
        }
    }, 50);

    desventajaDecisionTimeout = setTimeout(() => {
        if (tokenSecuencia !== desventajaSecuenciaId) return;
        const autoEmoji = elegirDesventajaPonderada(opciones);
        onSelect(autoEmoji, true);
    }, total);
}

function mostrarEleccionDesventaja(opciones, tokenSecuencia) {
    return new Promise((resolve) => {
        const reels = [desventajaReel1, desventajaReel2, desventajaReel3];
        if (!reels.every((reel) => reel)) {
            resolve({ emoji: elegirDesventajaPonderada(opciones), auto: true });
            return;
        }
        let resuelto = false;
        const desactivarReels = () => {
            reels.forEach((reel) => {
                if (!reel) return;
                reel.classList.remove("elegible");
                reel.onclick = null;
            });
        };
        const resolver = (emoji, auto) => {
            if (resuelto || tokenSecuencia !== desventajaSecuenciaId) return;
            resuelto = true;
            limpiarTimersDecisionDesventaja();
            desactivarReels();
            let destacado = false;
            reels.forEach((reel) => {
                if (!reel) return;
                const coincide = !destacado && reel.dataset.emoji === emoji;
                if (coincide) destacado = true;
                reel.classList.toggle("seleccionado", coincide);
                reel.classList.toggle("auto", coincide && auto);
            });
            renderBotonesDesventajas(opciones, emoji, auto ? emoji : "");
            renderLeyendaDesventajas(opciones, emoji);
            resolve({ emoji, auto });
        };

        reels.forEach((reel, index) => {
            if (!reel) return;
            const emoji = opciones[index] || getEmojiReel(reel) || "";
            setEmojiReel(reel, emoji);
            reel.dataset.emoji = emoji;
            reel.classList.remove("seleccionado", "auto");
            reel.classList.add("elegible");
            reel.onclick = () => resolver(emoji, false);
        });
        renderBotonesDesventajas(opciones);
        renderLeyendaDesventajas(opciones);
        vincularControlesEleccionDesventaja(resolver);

        iniciarCuentaEleccionDesventaja(opciones, tokenSecuencia, resolver);
    });
}

function aplicarDesventajaSeleccionada(emoji) {
    if (!emoji) return;
    const activar = PUTADAS[emoji];
    if (typeof activar !== "function") return;
    putada_actual = emoji;
    activar();
}

function avanzarModoTrasDesventaja(emoji) {
    secondsPassed = 0;
    detenerMusicaModo();
    LIMPIEZAS[modo_actual]("");
    modo_anterior = modo_actual;
    modo_actual = modos_restantes[0];
    modos_restantes.splice(0, 1);
    if (!modo_actual) {
        final();
        return;
    }
    MODOS[modo_actual]("");
    duracion_modo_actual_segundos = obtenerDuracionModoActualSegundos();
    if (!terminado) {
        texto.contentEditable = "true";
        texto.focus();
    }
    aplicarDesventajaSeleccionada(emoji);
}

function pausarBorradoDuranteEleccionDesventaja() {
    limpiarTimeoutCompartidoGameplay1P("borrado");
}

function rearmarBorradoTrasEleccionDesventaja() {
    if (typeof borrar !== "function") return;
    if (terminado || desactivar_borrar || desventajaEnCurso || menu_resurreccion_activo) return;

    const espera = Number(leerRapidezInicioBorradoGameplay1P());
    if (!Number.isFinite(espera) || espera < 0) return;

    limpiarTimeoutCompartidoGameplay1P("borrado");
    escribirEstadoCompartidoGameplay1P("borrado", setTimeout(() => {
        if (desventajaEnCurso || menu_resurreccion_activo || terminado) return;
        borrar();
    }, espera));
}

function completarFaseDesventaja(emoji) {
    ocultarOverlayDesventaja();
    avanzarModoTrasDesventaja(emoji);
    desventajaEnCurso = false;
    if (!terminado && !menu_resurreccion_activo && texto && texto.isContentEditable) {
        setPartidaActivaCursorPluma(true);
        requestAnimationFrame(() => {
            programarActualizacionCaretNeonEscritora();
        });
    }
    rearmarBorradoTrasEleccionDesventaja();
}

async function iniciarDesventajaEntreNiveles() {
    if (desventajaEnCurso || terminado) return;
    desventajaEnCurso = true;
    pausarBorradoDuranteEleccionDesventaja();
    desventajaSecuenciaId += 1;
    const tokenSecuencia = desventajaSecuenciaId;

    ocultarCaretNeonEscritora();
    texto.contentEditable = "false";
    mostrarOverlayDesventaja();
    setEstadoDesventaja(tJuego1P("disadvantage.selecting", {}, "SE VA A ELEGIR UNA DESVENTAJA"));
    if (desventajaChoiceTimer) desventajaChoiceTimer.classList.remove("activa");
    if (desventajaChoices) desventajaChoices.innerHTML = "";
    renderLeyendaDesventajas([]);
    if (desventajaSlot) desventajaSlot.classList.remove("fusionando");
    limpiarReelsDesventaja();

    await esperar(420);
    if (tokenSecuencia !== desventajaSecuenciaId) return;

    const resultado = generarResultadoTragaperras();
    await animarTragaperras(resultado, tokenSecuencia);
    if (tokenSecuencia !== desventajaSecuenciaId) return;

    const triple = resultado[0] === resultado[1] && resultado[1] === resultado[2];
    let seleccion = { emoji: resultado[0], auto: false };

    if (triple) {
        setEstadoDesventaja("");
        renderLeyendaDesventajas([resultado[0]], resultado[0]);
        if (desventajaSlot) desventajaSlot.classList.add("fusionando");
        await esperar(980);
    } else {
        setEstadoDesventaja("");
        seleccion = await mostrarEleccionDesventaja(resultado, tokenSecuencia);
        if (tokenSecuencia !== desventajaSecuenciaId) return;
    }

    setEstadoDesventaja(tJuego1P("disadvantage.applying", {}, "APLICANDO DESVENTAJA..."));
    await esperar(DURACION_LECTURA_RESULTADO_TRAGAPERRAS_MS);

    if (tokenSecuencia !== desventajaSecuenciaId) return;
    completarFaseDesventaja(seleccion.emoji);
}

const PUTADAS = {
    "🐢": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORRADO);
        if (timeout_teclado_lento) {
            clearTimeout(timeout_teclado_lento);
            timeout_teclado_lento = null;
        }
        teclado_lento_putada = true;
        putada_actual = "🐢";
        revision_teclado_lento_1p += 1;
        const revisionActual = revision_teclado_lento_1p;
        timeout_teclado_lento = setTimeout(function () {
            if (revisionActual !== revision_teclado_lento_1p) {
                return;
            }
            teclado_lento_putada = false;
            if (putada_actual === "🐢") {
                putada_actual = "";
            }
            timeout_teclado_lento = null;
        }, duracionDesventaja);
    },
    "⌛": function () {
    },
    "⚡": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORRADO);
        borrado_cambiado = true;
    antiguo_rapidez_borrado = leerRapidezBorradoGameplay1P();
    antiguo_inicio_borrado = leerRapidezInicioBorradoGameplay1P();
    escribirRapidecesGameplay1P(
        reduceLog(antiguo_rapidez_borrado, RAYO_REDUCCION_K),
        reduceLog(antiguo_inicio_borrado, RAYO_REDUCCION_K)
    );
        putada_actual = "⚡";
        detenerSonidoRayoDesventaja();
        reproducirSonidoRayoDesventaja();
        intervalo_sonido_rayo_desventaja = setInterval(() => {
            reproducirSonidoRayoDesventaja();
        }, 4000);
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.transform = "translateX(-50%)";
        lightning.style.top = "27%";
        lightning.style.left = "50%";
        setTimeout(function () {
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            detenerSonidoRayoDesventaja();
            borrado_cambiado = false;
    escribirRapidecesGameplay1P(antiguo_rapidez_borrado, antiguo_inicio_borrado);
            if (putada_actual === "⚡") {
                putada_actual = "";
            }
        }, duracionDesventaja);
    },

    "🙃": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_INVERSO);
        tiempo_inicial = new Date();
        desactivar_borrar = true;
        detenerAudioInversoDesventaja();
        audio_desventaja_inverso = crearAudio(AUDIO_DESVENTAJA_INVERSO, true, 0.8);
        //caret = guardarPosicionCaret();
        //caretNode = caret.caretNode;
        //caretPos = caret.caretPos;
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            texto.removeEventListener('animationend', arguments.callee);
        });

        procesarTexto();
        // Obtener el último nodo de texto en text
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el último nodo de texto, colocamos el cursor allí
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        
        temp_text_inverso_activado = true;
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            desactivar_borrar = false;

            texto.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.contentEditable= "true";
                texto.focus()
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            let lastLine = texto.lastChild;
            let lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                let caretNode = lastTextNode;
                let caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            detenerAudioInversoDesventaja();
            putada_actual = "";

        }, duracionDesventaja);
    },

    "🖊️": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORRADO);
        if (timeout_bloqueo_putada) {
            clearTimeout(timeout_bloqueo_putada);
            timeout_bloqueo_putada = null;
        }
        bloquear_borrado_putada = true;
        putada_actual = "🖊️";
        timeout_bloqueo_putada = setTimeout(function () {
            limpiar_bloqueo_putada();
        }, duracionDesventaja);
    },

    "🌪️": function () {
        const duracionDesventaja = calcularDuracionDesventajaMs(TIEMPO_BORROSO);
        modo_texto_borroso = 1;
        tiempo_inicial = new Date();
        putada_actual = "🌪️";
        detenerAudioBorrosoDesventaja();
        audio_desventaja_borroso = crearAudio(AUDIO_DESVENTAJA_BORROSO, true, 0.8);
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            detenerAudioBorrosoDesventaja();
            if (putada_actual === "🌪️") {
                putada_actual = "";
            }
        }, duracionDesventaja);
    },
};

