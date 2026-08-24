socket.on("idioma_actual", (payload = {}) => {
    if (window && typeof window.scribSetLanguage2P === "function") {
        window.scribSetLanguage2P(payload && payload.idioma ? payload.idioma : "es");
    }
});

socket.on("recargar_rol_remoto", () => {
    window.location.reload();
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    reiniciarSeguimientoTransicionNivelEspectador();
    limpiarAsincroniaVisualEspectador({ resetViewport: true });
    invalidarContextoTransitorioEspectador();
    modo_seq_actual_espectador = 0;
    ultimo_count_seq_espectador[1] = 0;
    ultimo_count_seq_espectador[2] = 0;
    tiempo_seq_actual_espectador[1] = 0;
    tiempo_seq_actual_espectador[2] = 0;
    teleprompter_revision_local = 0;
    teleprompter_estado.revision = 0;
    actualizarEtiquetasCursorCalentamiento();
    socket.emit('registrar_espectador');
    socket.emit('pedir_idioma_actual');
    socket.emit('pedir_calentamiento_estado');
    socket.emit('pedir_estado_regalo_bandera_musas');
    socket.emit('pedir_vista_espectador_modo');
    socket.emit('pedir_stats_live');
    socket.emit('pedir_puntuacion_final');
    socket.emit('pedir_nube_inspiracion');
    socket.emit('pedir_creditos_estado');
    iniciarSlidesStats();
    if (!intervalo_estado_calentamiento) {
        intervalo_estado_calentamiento = setInterval(() => {
            if (!socket.connected) return;
            if (Date.now() - ultimo_estado_calentamiento < 1500) return;
            socket.emit('pedir_calentamiento_estado');
        }, 2000);
    }
});

socket.on('connect_error', () => {
    ocultarTransicionNivelEspectador();
    limpiarAsincroniaVisualEspectador({ resetViewport: true });
    invalidarContextoTransitorioEspectador();
});

socket.on('teleprompter_state', (payload = {}) => {
    actualizarTeleprompterEstado(payload.state || {});
});

socket.on('musa_corazon', (data) => {
    const equipo = data && Number(data.equipo);
    if (equipo !== 1 && equipo !== 2) return;
    lanzarCorazonEspectador(equipo);
});

socket.on('musa_regalo_bandera_estado', (payload = {}) => {
    actualizarEstadoRegaloBanderaEspectador(payload);
});

socket.on('aumentar_tiempo_control', (payload = {}) => {
    if (payload.origen !== 'musa_bandera') return;
    const equipo = Number(payload.player);
    if (equipo !== 1 && equipo !== 2) return;
    const secs = Math.max(1, Math.abs(Number(payload.secs) || 0));
    mostrarFeedbackFlotanteEspectador(equipo, `+${secs} SEG${secs === 1 ? '' : 'S'} MUSAS`, {
        tipo: 'positivo'
    });
    activarFulgorLadoEspectador(equipo, 'positivo');
    animarChipRegaloMusaEspectador(equipo);
});

socket.on('temporizador_gigante_inicio', (data) => {
    iniciarTemporizadorGigante(data && data.duracion);
});

socket.on('temporizador_gigante_detener', () => {
    detenerTemporizadorGigante();
});

socket.on('calentamiento_vista', (data) => {
    actualizarVistaCalentamiento(data && data.activo);
});

socket.on('calentamiento_estado_espectador', (data) => {
    ultimo_estado_calentamiento = Date.now();
    actualizarCalentamientoEspectador(data);
});

socket.on('calentamiento_cursor', (payload = {}) => {
    actualizarCursorCalentamientoRemoto(payload);
});

socket.on('vista_espectador_modo', (payload = {}) => {
    actualizarModoVistaEspectadorRemota(payload);
});

socket.on('stats_live_estado', (payload = {}) => {
    estado_stats_live_espectador = normalizarStatsLiveEspectador(payload);
    registrarModoTimelineStatsEspectador(
        estado_stats_live_espectador.modo_actual,
        Math.max(
            Number(estado_stats_live_espectador.players[1] && estado_stats_live_espectador.players[1].tiempoTotalMs) || 0,
            Number(estado_stats_live_espectador.players[2] && estado_stats_live_espectador.players[2].tiempoTotalMs) || 0
        )
    );
    actualizarHistorialVidaDesdeStatsEspectador(estado_stats_live_espectador);
    if (vista_espectador_modo_resuelta === "stats") {
        renderizarStatsEspectador();
    }
});

socket.on('puntuacion_final_estado', (payload = {}) => {
    actualizarPuntuacionFinalEspectador(payload);
});

socket.on('creditos_estado', (payload = {}) => {
    actualizarCreditosEspectador(payload);
});

socket.on('disconnect', () => {
    ocultarTransicionNivelEspectador();
    limpiarAsincroniaVisualEspectador({ resetViewport: true });
    detenerSlidesStats();
    detenerAnimacionNubeInspiracion();
    detenerAnimacionCreditosEspectador();
});

socket.on('nube_inspiracion_estado', (payload = {}) => {
    estado_nube_inspiracion_espectador = normalizarNubeInspiracionEspectador(payload);
    sincronizarNubeDesdeSnapshot(estado_nube_inspiracion_espectador);
    if (vista_espectador_modo_resuelta === "nube_inspiracion") {
        renderizarNubeInspiracion();
    }
});

socket.on('inspiracion_aprovechada', (payload = {}) => {
    actualizarBarraInspiracionAutoritativaEspectador(payload);
});


socket.on('actualizar_contador_musas', contador_musas => {
    console.log("actualizar_contador_musas")
    actualizarMusasMarcadorEquipo(musas1, contador_musas.escritxr1);
    actualizarMusasMarcadorEquipo(musas2, contador_musas.escritxr2);

});

const marcador_espectador_j1 = getEl("metadatos_j1");
const marcador_espectador_j2 = getEl("metadatos_j2");
const puntuacion_final_j1 = getEl("puntuacion_final1");
const puntuacion_final_j2 = getEl("puntuacion_final2");
let TEXTO_GANADOR_ESPECTADOR = tJuego2P("game.finished", {}, "Â¡TEXTO TERMINADO!");
let TEXTO_PERDISTE_SIN_PALABRAS_ESPECTADOR = tJuego2P("game.no_words_lost", {}, "Â¡PERDISTE, NO ESCRIBISTE NADA!");

function obtenerMarcadorEquipoEspectador(jugadorId) {
    const id = Number(jugadorId);
    if (id === 1) return marcador_espectador_j1;
    if (id === 2) return marcador_espectador_j2;
    return null;
}

function setIndicadorGanadorMarcadorEspectador(jugadorId, visible, textoGanador = TEXTO_GANADOR_ESPECTADOR) {
    const marcador = obtenerMarcadorEquipoEspectador(jugadorId);
    if (!marcador) return;
    if (!visible) {
        marcador.removeAttribute("data-ganador");
        return;
    }
    marcador.setAttribute("data-ganador", textoGanador || TEXTO_GANADOR_ESPECTADOR);
}

function obtenerTextoIndicadorGanadorEspectador(jugadorId) {
    const marcador = obtenerMarcadorEquipoEspectador(jugadorId);
    if (!marcador) return "";
    return String(marcador.getAttribute("data-ganador") || "").trim();
}

function obtenerPalabrasMarcadorEspectador(jugadorId) {
    const id = Number(jugadorId);
    const nodo = id === 1 ? puntos1 : (id === 2 ? puntos2 : null);
    if (!nodo) return 0;
    const texto = String(nodo.textContent || "").trim();
    const match = texto.match(/-?\d+/);
    if (!match) return 0;
    const valor = Number(match[0]);
    return Number.isFinite(valor) ? valor : 0;
}

function setVisibilidadUiJugadorEspectador(jugadorId, visible) {
    const id = Number(jugadorId);
    const display = visible ? "" : "none";
    if (id === 1) {
        if (texto1) texto1.style.display = display;
        if (alineador1) alineador1.style.display = display;
        if (feedback1) feedback1.style.display = display;
        if (focalizador1) focalizador1.style.display = display;
        if (puntuacion_final_j1) puntuacion_final_j1.style.display = display;
        if (info1) info1.style.display = display;
        if (explicacion1) explicacion1.style.display = display;
        if (!visible) {
            actualizarPalabraConVisibilidad(palabra2, "");
            actualizarDefinicionConVisibilidad(definicion2, "", false);
            if (explicacion1) explicacion1.innerHTML = "";
        }
        return;
    }
    if (id === 2) {
        if (texto2) texto2.style.display = display;
        if (alineador2) alineador2.style.display = display;
        if (feedback2) feedback2.style.display = display;
        if (focalizador2) focalizador2.style.display = display;
        if (puntuacion_final_j2) puntuacion_final_j2.style.display = display;
        if (info2) info2.style.display = display;
        if (explicacion2) explicacion2.style.display = display;
        if (!visible) {
            actualizarPalabraConVisibilidad(palabra3, "");
            actualizarDefinicionConVisibilidad(definicion3, "", false);
            if (explicacion2) explicacion2.innerHTML = "";
        }
    }
}

function reiniciarEstadoCierrePartidaEspectador() {
    frase_final_completada_j1 = false;
    frase_final_completada_j2 = false;
    confetti_cierre_partida_disparado = false;
    fin_ultimo_nivel_por_tiempo = false;
    suprimir_confetti_cierre_por_fin_control = false;
    cierre_definitivo_j1 = false;
    cierre_definitivo_j2 = false;
    setIndicadorGanadorMarcadorEspectador(1, false);
    setIndicadorGanadorMarcadorEspectador(2, false);
    setVisibilidadUiJugadorEspectador(1, true);
    setVisibilidadUiJugadorEspectador(2, true);
    reiniciarProgresoFraseFinalEspectador();
    resetearOscuridadGameOverEspectador();
}

function normalizarTextoCierreFraseFinalEspectador(valor) {
    if (window.ScribFraseFinalUtils && typeof window.ScribFraseFinalUtils.normalizarTextoCierreFraseFinal === "function") {
        return window.ScribFraseFinalUtils.normalizarTextoCierreFraseFinal(valor);
    }
    return String(valor || "").trim().toLowerCase();
}

function detectarFraseFinalCompletadaEspectador(textoPlano, fraseObjetivo) {
    if (window.ScribFraseFinalUtils && typeof window.ScribFraseFinalUtils.detectarFraseFinalCompletada === "function") {
        return window.ScribFraseFinalUtils.detectarFraseFinalCompletada(textoPlano, fraseObjetivo);
    }
    const objetivo = normalizarTextoCierreFraseFinalEspectador(fraseObjetivo);
    if (!objetivo) return false;
    const texto = normalizarTextoCierreFraseFinalEspectador(textoPlano);
    return texto.endsWith(objetivo);
}

function actualizarEstadoFraseFinalEspectadorDesdeTexto(jugadorId, textoPlano) {
    if (modo_actual !== "frase final") {
        if (jugadorId === 1) frase_final_completada_j1 = false;
        if (jugadorId === 2) frase_final_completada_j2 = false;
        return;
    }
    if (jugadorId === 1) {
        frase_final_completada_j1 = detectarFraseFinalCompletadaEspectador(textoPlano, frase_final_j1);
    } else if (jugadorId === 2) {
        frase_final_completada_j2 = detectarFraseFinalCompletadaEspectador(textoPlano, frase_final_j2);
    }
}

function animarFinJugadorEspectador(jugadorId, opciones = {}) {
    const id = Number(jugadorId);
    if (id !== 1 && id !== 2) return;
    const mostrarEtiqueta = Boolean(opciones && opciones.mostrarEtiquetaFinal);
    const textoEtiqueta = (opciones && typeof opciones.textoEtiqueta === "string" && opciones.textoEtiqueta.trim())
        ? opciones.textoEtiqueta
        : TEXTO_GANADOR_ESPECTADOR;
    if (mostrarEtiqueta) {
        setIndicadorGanadorMarcadorEspectador(id, true, textoEtiqueta);
    }
}

function marcarJugadorTerminadoEspectador(jugadorId, opciones = {}) {
    const id = Number(jugadorId);
    const mostrarEtiquetaFinal = Boolean(opciones && opciones.mostrarEtiquetaFinal);
    const textoEtiqueta = (opciones && typeof opciones.textoEtiqueta === "string" && opciones.textoEtiqueta.trim())
        ? opciones.textoEtiqueta
        : TEXTO_GANADOR_ESPECTADOR;
    const yaTerminado = (id === 1 && terminado) || (id === 2 && terminado1);
    if (yaTerminado) {
        if (mostrarEtiquetaFinal) {
            animarFinJugadorEspectador(id, { mostrarEtiquetaFinal: true, textoEtiqueta });
        }
        return;
    }
    if (id === 1) {
        terminado = true;
        registrarTiempoFraseFinalJugadorEspectador(1, 0);
        feedback1.innerHTML = "";
        setVisibilidadUiJugadorEspectador(1, false);
        tiempo.style.color = "white";
        tiempo.innerHTML = textoTiempoAgotadoEspectador();
        actualizarBarraVida(tiempo, tiempo.innerHTML);
        animarFinJugadorEspectador(1, { mostrarEtiquetaFinal, textoEtiqueta });
        return;
    }
    if (id === 2) {
        terminado1 = true;
        registrarTiempoFraseFinalJugadorEspectador(2, 0);
        feedback2.innerHTML = "";
        setVisibilidadUiJugadorEspectador(2, false);
        tiempo1.style.color = "white";
        tiempo1.innerHTML = textoTiempoAgotadoEspectador();
        actualizarBarraVida(tiempo1, tiempo1.innerHTML);
        animarFinJugadorEspectador(2, { mostrarEtiquetaFinal, textoEtiqueta });
    }
}

function ejecutarCierrePartidaEspectador(data = {}) {
    ocultarTransicionNivelEspectador();
    if (confetti_cierre_partida_disparado) return;
    confetti_cierre_partida_disparado = true;
    if (!suprimir_confetti_cierre_por_fin_control) {
        confetti_aux();
    } else {
        stopConfetti();
        sonido_confetti = reproducirSonido("../../game/audio/CELEBRACION con explosiones.mp3");
    }
    ejecutarLimpiezaModo(modo_actual, data);
    limpiezas_final();
    activar_sockets_extratextuales();
    texto1.style.height = "auto";
    texto2.style.height = "auto";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = (texto2.scrollHeight) + "px";
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS("#contenedor_espectador", "pulse");
    });
    logo.style.display = "";
    neon.style.display = "";
    limpiarModoPsicodelicoEspectador("");
    tiempo.style.color = "white";
    tiempo1.style.color = "white";
}

function evaluarCierrePartidaEspectador(data = {}, opciones = {}) {
    if (confetti_cierre_partida_disparado) return;
    if (opciones && opciones.finTiempoUltimoNivel) {
        fin_ultimo_nivel_por_tiempo = true;
    }
    const ambasFinalizadasDefinitivas = Boolean(cierre_definitivo_j1 && cierre_definitivo_j2);
    if (ambasFinalizadasDefinitivas) {
        if (!obtenerTextoIndicadorGanadorEspectador(1)) {
            setIndicadorGanadorMarcadorEspectador(1, true);
        }
        if (!obtenerTextoIndicadorGanadorEspectador(2)) {
            setIndicadorGanadorMarcadorEspectador(2, true);
        }
        suprimir_confetti_cierre_por_fin_control = false;
        ejecutarCierrePartidaEspectador(data);
        return;
    }
    const esFraseFinal = modo_actual === "frase final";
    if (!esFraseFinal) return;
    const j1Finalizado = frase_final_completada_j1 || terminado;
    const j2Finalizado = frase_final_completada_j2 || terminado1;
    const ambasFinalizadas = j1Finalizado && j2Finalizado;
    const cierrePorFinNivel = fin_ultimo_nivel_por_tiempo && (terminado || terminado1);
    if (!ambasFinalizadas && !cierrePorFinNivel) return;
    ejecutarCierrePartidaEspectador(data);
}

// Recibe los datos del jugador 1 y los coloca.
socket.on('texto1', data => {
    ultimo_paquete_texto1 = data;
    if (pendiente_texto1) return;
    pendiente_texto1 = true;
    requestAnimationFrame(() => {
        pendiente_texto1 = false;
        const paquete = ultimo_paquete_texto1;
        if (!paquete) return;
        if (typeof paquete.text === "string" && paquete.text !== ultimo_texto1) {
            texto1.innerHTML = paquete.text;
            ultimo_texto1 = paquete.text;
        }
        actualizarEstadoFraseFinalEspectadorDesdeTexto(1, texto1 ? texto1.innerText : "");
        evaluarCierrePartidaEspectador(paquete);
        actualizarPuntosMarcadorEquipo(puntos1, paquete.points);
        console.log("CAMBIADDOO")
        cambiar_color_puntuacion()
        const caretLine = Number.isInteger(paquete.caretLine) ? paquete.caretLine : null;
        const caretRatio = typeof paquete.caretRatio === "number" ? paquete.caretRatio : null;
        const caretPos = typeof paquete.caretPos === "number"
            ? paquete.caretPos
            : (paquete.caretPos && typeof paquete.caretPos.caretPos === "number" ? paquete.caretPos.caretPos : null);
        const caretPath = Array.isArray(paquete.caretPath) ? paquete.caretPath : null;
        const caretOffset = Number.isInteger(paquete.caretOffset) ? paquete.caretOffset : null;
        if (caretPos !== null) {
            if (posicionarScrollPorCaretPosPreciso(texto1, caretPos)) {
                programarActualizacionDegradadoTextareaEspectador(texto1);
                return;
            }
        }
        if (caretPath && caretOffset !== null) {
            if (posicionarScrollPorCaretPath(texto1, caretPath, caretOffset)) {
                programarActualizacionDegradadoTextareaEspectador(texto1);
                return;
            }
        }
        if (caretPos !== null) {
            const maxPos = obtenerTextoPlanoConSaltos(texto1).length;
            if (maxPos > 0 && caretPos >= maxPos - 1) {
                texto1.scrollTop = texto1.scrollHeight;
                programarActualizacionDegradadoTextareaEspectador(texto1);
                return;
            }
            posicionarScrollPorCaretPos(texto1, Math.max(0, Math.min(caretPos, maxPos)));
        } else if (caretLine !== null) {
            posicionarScrollPorLinea(texto1, caretLine);
        } else if (caretRatio !== null) {
            posicionarScrollPorRatio(texto1, caretRatio);
        }
        if (activado_psico1) {
            stylize();
        }
        /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_lï¿½fÂ­nea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_lï¿½fÂ­nea_alineacion_2 += 1;
            texto2.innerText = "\n" + texto2.innerText;
        }
    }*/
        texto1.style.height = "";
        if (caretPos === null) {
            texto1.scrollTop = texto1.scrollHeight;
        }
        programarActualizacionDegradadoTextareaEspectador(texto1);
        //window.scrollTo(0, document.body.scrollHeight);
        //focalizador1.scrollIntoView(false);
    });
});

socket.on('texto2', data => {
    ultimo_paquete_texto2 = data;
    if (pendiente_texto2) return;
    pendiente_texto2 = true;
    requestAnimationFrame(() => {
        pendiente_texto2 = false;
        const paquete = ultimo_paquete_texto2;
        if (!paquete) return;
        if (typeof paquete.text === "string" && paquete.text !== ultimo_texto2) {
            texto2.innerHTML = paquete.text;
            ultimo_texto2 = paquete.text;
        }
        actualizarEstadoFraseFinalEspectadorDesdeTexto(2, texto2 ? texto2.innerText : "");
        evaluarCierrePartidaEspectador(paquete);
        actualizarPuntosMarcadorEquipo(puntos2, paquete.points);
        cambiar_color_puntuacion()
        const caretLine = Number.isInteger(paquete.caretLine) ? paquete.caretLine : null;
        const caretRatio = typeof paquete.caretRatio === "number" ? paquete.caretRatio : null;
        const caretPos = typeof paquete.caretPos === "number"
            ? paquete.caretPos
            : (paquete.caretPos && typeof paquete.caretPos.caretPos === "number" ? paquete.caretPos.caretPos : null);
        const caretPath = Array.isArray(paquete.caretPath) ? paquete.caretPath : null;
        const caretOffset = Number.isInteger(paquete.caretOffset) ? paquete.caretOffset : null;
        if (caretPos !== null) {
            if (posicionarScrollPorCaretPosPreciso(texto2, caretPos)) {
                programarActualizacionDegradadoTextareaEspectador(texto2);
                return;
            }
        }
        if (caretPath && caretOffset !== null) {
            if (posicionarScrollPorCaretPath(texto2, caretPath, caretOffset)) {
                programarActualizacionDegradadoTextareaEspectador(texto2);
                return;
            }
        }
        if (caretPos !== null) {
            const maxPos = obtenerTextoPlanoConSaltos(texto2).length;
            if (maxPos > 0 && caretPos >= maxPos - 1) {
                texto2.scrollTop = texto2.scrollHeight;
                programarActualizacionDegradadoTextareaEspectador(texto2);
                return;
            }
            posicionarScrollPorCaretPos(texto2, Math.max(0, Math.min(caretPos, maxPos)));
        } else if (caretLine !== null) {
            posicionarScrollPorLinea(texto2, caretLine);
        } else if (caretRatio !== null) {
            posicionarScrollPorRatio(texto2, caretRatio);
        }
        if (activado_psico2) {
            stylize();
        }
        /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_lï¿½fÂ­nea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText

        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_lï¿½fÂ­nea_alineacion_2 += 1;
            texto2.innerText = "\n" + texto2.innerText
        }
    }*/
        texto2.style.height = "";
        if (caretPos === null) {
            texto2.scrollTop = texto2.scrollHeight;
        }
        programarActualizacionDegradadoTextareaEspectador(texto2);
        //window.scrollTo(0, document.body.scrollHeight);
        //focalizador2.scrollIntoView(false);
    });
});

activar_sockets_extratextuales()

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", data => {
    if (!aceptarCountEspectador(data)) {
        return;
    }
    if(data.player == 1){
    const segundosCount = convertirASegundos(data.count);
    if (Number.isFinite(segundosCount)) {
        terminado = false;
        registrarTiempoFraseFinalJugadorEspectador(1, segundosCount);
    }
    if (Number.isFinite(segundosCount) && segundosCount >= 10 && activado_psico1) {
        limpiarModoPsicodelicoEspectador(data, data.player);
    }
    if (Number.isFinite(segundosCount)) {
        if (segundosCount >= 20) {
            tiempo.style.color = "white";
        } else if (segundosCount >= 10) {
            tiempo.style.color = "yellow";
        } else if (activado_psico1 == false) {
            ejecutarModoPsicodelicoEspectador(data, socket, data.player);
            tiempo.style.color = "red";
        } else {
            tiempo.style.color = "red";
        }
    }
    const textoCountJ1 = String(data.count || "").toLowerCase().includes("tiempo")
        ? textoTiempoAgotadoEspectador()
        : data.count;
    tiempo.innerHTML = textoCountJ1;
    const animarEntradaVidaJ1 = Boolean(animacionEntradaVidaPendiente[1] && Number.isFinite(segundosCount));
    actualizarBarraVida(tiempo, textoCountJ1, { animarEntrada: animarEntradaVidaJ1 });
    if (animarEntradaVidaJ1) {
        animacionEntradaVidaPendiente[1] = false;
    }
    if (String(data.count || "").toLowerCase().includes("tiempo")) {
        limpiarModoPsicodelicoEspectador(data, data.player);
        marcarJugadorTerminadoEspectador(1);
    }
    }

    if(data.player == 2){
        const segundosCount = convertirASegundos(data.count);
        if (Number.isFinite(segundosCount)) {
            terminado1 = false;
            registrarTiempoFraseFinalJugadorEspectador(2, segundosCount);
        }
        if (Number.isFinite(segundosCount) && segundosCount >= 10 && activado_psico2) {
            limpiarModoPsicodelicoEspectador(data, data.player);
        }
        if (Number.isFinite(segundosCount)) {
            if (segundosCount >= 20) {
                tiempo1.style.color = "white";
            } else if (segundosCount >= 10) {
                tiempo1.style.color = "yellow";
            } else if (activado_psico2 == false) {
                ejecutarModoPsicodelicoEspectador(data, socket, data.player);
                tiempo1.style.color = "red";
            } else {
                tiempo1.style.color = "red";
            }
        }
        const textoCountJ2 = String(data.count || "").toLowerCase().includes("tiempo")
            ? textoTiempoAgotadoEspectador()
            : data.count;
        tiempo1.innerHTML = textoCountJ2;
        const animarEntradaVidaJ2 = Boolean(animacionEntradaVidaPendiente[2] && Number.isFinite(segundosCount));
        actualizarBarraVida(tiempo1, textoCountJ2, { animarEntrada: animarEntradaVidaJ2 });
        if (animarEntradaVidaJ2) {
            animacionEntradaVidaPendiente[2] = false;
        }
        if (String(data.count || "").toLowerCase().includes("tiempo")) {
            limpiarModoPsicodelicoEspectador(data, data.player);
            marcarJugadorTerminadoEspectador(2);
        }
    }
    actualizarProgresoFraseFinalEspectador();
    evaluarCierrePartidaEspectador(data);
});

socket.on('resucitar_control', data => {
    const jugadorTiempo = Number(data && data.player) === 2 ? 2 : 1;
    const tiempoSeq = extraerTiempoSeqPayloadEspectador(data);
    if (tiempoSeq !== null) {
        tiempo_seq_actual_espectador[jugadorTiempo] = Math.max(tiempo_seq_actual_espectador[jugadorTiempo] || 0, tiempoSeq);
    }
    if(data.player == 1){
        reproducirEfectoVidaEspectador(AUDIO_RESUCITAR_ESPECTADOR);
        terminado = false;
        cierre_definitivo_j1 = false;
        setIndicadorGanadorMarcadorEspectador(1, false);
        setVisibilidadUiJugadorEspectador(1, true);
        ocultarResucitarMini(1);
    }
    else if(data.player == 2){
        reproducirEfectoVidaEspectador(AUDIO_RESUCITAR_ESPECTADOR);
        terminado1 = false;
        cierre_definitivo_j2 = false;
        setIndicadorGanadorMarcadorEspectador(2, false);
        setVisibilidadUiJugadorEspectador(2, true);
        ocultarResucitarMini(2);
    }
});

socket.on('resucitar_menu', data => {
    const jugador = Number(data && data.player);
    if (!partida_activa_espectador || !modo_actual) {
        if (jugador === 1 || jugador === 2) {
            ultimo_estado_resucitar_espectador[jugador] = {
                ...(data && typeof data === "object" ? data : {}),
                player: jugador,
                menu: "hidden",
                visible: false
            };
        }
        ocultarTodosResucitarMini();
        return;
    }
    const mantenerMenuPorSincronia = Boolean(data && data.visible);
    if (modo_actual === "frase final" && !mantenerMenuPorSincronia) {
        ocultarTodosResucitarMini();
        return;
    }
    actualizarResucitarMini(data);
});

// Array con los audios en el orden que quieres reproducir
var audios = [
  "../../game/audio/5. PREPARADOS 2.mp3",
  "../../game/audio/5. PREPARADOS 3.mp3",
  "../../game/audio/5. PREPARADOS 4.mp3",
  "../../game/audio/5. PREPARADOS 5.mp3"
];

function calcularFontSizeCountdownEspectador(texto, objetivoVw) {
    const viewportW = Math.max(window.innerWidth || 0, 1);
    const viewportH = Math.max(window.innerHeight || 0, 1);
    const objetivoPx = Math.max(32, viewportW * ((Number(objetivoVw) || 10) / 100));
    const maxWidthPx = viewportW * 0.72;
    const maxHeightPx = viewportH * 0.48;
    const medida = medirTextoCountdownEspectador(texto, 100);

    if (!medida) {
        const caracteres = Math.max(1, Array.from(String(texto || "").trim()).length);
        const limitePorAncho = maxWidthPx / Math.max(1, caracteres * 0.7);
        return Math.max(32, Math.min(objetivoPx, limitePorAncho, maxHeightPx)).toFixed(0) + "px";
    }

    const limitePorAncho = (maxWidthPx * 100) / medida.width;
    const limitePorAlto = (maxHeightPx * 100) / medida.height;
    return Math.max(32, Math.min(objetivoPx, limitePorAncho, limitePorAlto)).toFixed(0) + "px";
}

function medirTextoCountdownEspectador(texto, fontSizePx) {
    if (typeof document === "undefined" || !document.body) return null;
    const mirror = document.createElement("span");
    mirror.textContent = String(texto || "");
    mirror.style.position = "fixed";
    mirror.style.left = "-10000px";
    mirror.style.top = "0";
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";
    mirror.style.whiteSpace = "nowrap";
    mirror.style.lineHeight = "0.92";
    mirror.style.fontFamily = '"Retro-gaming", monospace';
    mirror.style.fontSize = `${Number(fontSizePx) || 100}px`;
    mirror.style.fontWeight = "400";
    mirror.style.letterSpacing = "0";
    document.body.appendChild(mirror);
    const rect = mirror.getBoundingClientRect();
    const width = Math.max(1, rect.width || mirror.scrollWidth || 0);
    const height = Math.max(1, rect.height || mirror.scrollHeight || 0);
    mirror.remove();
    return { width, height };
}

function crearCountdownEspectador(texto) {
    $('#countdown').remove();
    return $('<span id="countdown"></span>')
        .text(texto)
        .appendTo($('body'));
}

function aplicarEstiloCountdownEspectador(expandido = false) {
    const countdown = $('#countdown');
    const texto = countdown.text() || "";
    const esNumero = /^\d+$/.test(String(texto).trim());
    const objetivoVw = expandido
        ? (esNumero ? 40 : 14)
        : (esNumero ? 10 : 10);
    countdown.css({
        'font-size': calcularFontSizeCountdownEspectador(texto, objetivoVw),
        'opacity': expandido ? 0 : 1,
        'width': 'max-content',
        'max-width': 'none',
        'white-space': 'nowrap',
        'line-height': 0.92,
        'text-align': 'center',
        'overflow': 'visible'
    });
}

function programarAplicacionModoTrasCountdownEspectador(revisionCountdown) {
    cuenta_atras_activa = false;
    actualizarBrandingPartidaEspectador();
    inicio_modo_delay = true;
    if (timeout_inicio_modo) {
        clearTimeout(timeout_inicio_modo);
    }
    timeout_inicio_modo = setTimeout(() => {
        if (!esRevisionCountdownInicioEspectadorActiva(revisionCountdown)) {
            return;
        }
        inicio_modo_delay = false;
        timeout_inicio_modo = null;
        if (modo_pendiente) {
            aplicarModo(modo_pendiente);
            modo_pendiente = null;
        }
        vaciarColaPutadasPendientesEspectador();
    }, 1000);
}

function programarPasoCountdownEspectador(paso, revisionCountdown, indiceAudio) {
    if (!esRevisionCountdownInicioEspectadorActiva(revisionCountdown)) {
        return;
    }
    const pasoActual = Number(paso);
    let siguienteIndiceAudio = Number(indiceAudio) || 0;
    crearCountdownEspectador(pasoActual === 0 ? tJuego2P("countdown.write", {}, "\u00a1ESCRIBE!") : pasoActual);
    actualizarIntroCuentaAtrasSegunContador(pasoActual);

    clearTimeout(timeout_animacion_countdown_espectador);
    timeout_animacion_countdown_espectador = setTimeout(() => {
        timeout_animacion_countdown_espectador = null;
        if (!esRevisionCountdownInicioEspectadorActiva(revisionCountdown)) {
            return;
        }
        aplicarEstiloCountdownEspectador(true);
    }, 20);

    if (pasoActual === 0) {
        if (siguienteIndiceAudio < audios.length) {
            reproducirSonido(audios[siguienteIndiceAudio]);
            siguienteIndiceAudio += 1;
        }
        programarAplicacionModoTrasCountdownEspectador(revisionCountdown);
    } else if (siguienteIndiceAudio < audios.length) {
        reproducirSonido(audios[siguienteIndiceAudio]);
        siguienteIndiceAudio += 1;
    }

    if (pasoActual <= 0) {
        timer = null;
        clearTimeout(timeout_fallback_countdown_espectador);
        timeout_fallback_countdown_espectador = null;
        finalizarIntroCuentaAtrasEspectador();
        timeout_remover_countdown_espectador = setTimeout(() => {
            if (!esRevisionCountdownInicioEspectadorActiva(revisionCountdown)) {
                return;
            }
            timeout_remover_countdown_espectador = null;
            $('#countdown').remove();
        }, 1000);
        return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        programarPasoCountdownEspectador(pasoActual - 1, revisionCountdown, siguienteIndiceAudio);
    }, 1000);
}


// Inicia el juego.
socket.on('inicio', data => {
    limpiarAsincroniaVisualEspectador();
    invalidarContextoTransitorioEspectador();
    const revisionCountdown = invalidarCountdownInicioEspectador({ resetFlags: false });
    if(sonido){
    sonido.pause();
    }
    reiniciarEstadoCierrePartidaEspectador();
    reiniciarHistorialVidaStatsEspectador();
    reiniciarTimelineModosStatsEspectador();
    limpiarColaPalabrasPendientesEspectador();
    limpiarColaPutadasPendientesEspectador();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);
    partida_activa_espectador = true;
    actualizarBrandingPartidaEspectador({ permitirIntro: true });
    modo_nivel_activo_espectador = "";
    setBarraNivelClase("");
    actualizarVisibilidadPanelNivelEspectador();
    cuenta_atras_activa = true;
    modo_pendiente = null;
    inicio_modo_delay = false;
    reproducirSonido("../../game/audio/5. PREPARADOS 1.mp3")
    animateCSS(".cabecera", "backOutLeft").then((message) => {
        if (!esRevisionCountdownInicioEspectadorActiva(revisionCountdown)) {
            return;
        }
        inspiracion.style.display = "block";
        iniciarIntroCuentaAtrasEspectador();
        animateCSS("#contenedor_espectador", "pulse");
        animateCSS(".inspiracion", "pulse");
        TIEMPO_MODIFICADOR = data.parametros.TIEMPO_MODIFICADOR;
        actualizarDuracionNivelDesdeParametros(data && data.parametros ? data.parametros : {});
        setProgresoNivelBarra(0);
        socket.off('vote');
        socket.off('exit');
        socket.off('scroll');
        socket.off('temas_jugadores');
        //socket.off('recibir_comentario');
        socket.off('recibir_postgame1');
        socket.off('recibir_postgame2');
            logo.style.display = "none";
            neon.style.display = "none";

    // Comprobamos que data.parametros existe y que cada campo es string
if (data.parametros && typeof data.parametros.FRASE_FINAL_J1 === 'string') {
    // Sï¿½fÂ³lo si existe y es string hacemos .trim()
    frase_final_j1 = data.parametros.FRASE_FINAL_J1.trim();
  }
  
  if (data.parametros && typeof data.parametros.FRASE_FINAL_J2 === 'string') {
    frase_final_j2 = data.parametros.FRASE_FINAL_J2.trim();
  }


    tiempo.innerHTML = "";
    tiempo1.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    actualizarBarraVida(tiempo1, tiempo1.innerHTML);
    tiempo.style.display = "";
    tiempo1.style.display = "";

    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "6";
    texto2.rows = "6";
    // Se muestra "&iquest;PREPARADOS?" antes de comenzar la cuenta atras
    crearCountdownEspectador(tJuego2P("countdown.ready", {}, "\u00bfPREPARADOS?"));
    timeout_countdown = setTimeout(() => {
        if (!esRevisionCountdownInicioEspectadorActiva(revisionCountdown)) {
            return;
        }
        timeout_countdown = null;
        aplicarEstiloCountdownEspectador(false);
    }, 20);
    timeout_timer = setTimeout(() => {
        if (!esRevisionCountdownInicioEspectadorActiva(revisionCountdown)) {
            return;
        }
        timeout_timer = null;
        programarPasoCountdownEspectador(3, revisionCountdown, 0);
    }, 1000);
    timeout_fallback_countdown_espectador = setTimeout(() => {
        if (!esRevisionCountdownInicioEspectadorActiva(revisionCountdown)) {
            return;
        }
        timeout_fallback_countdown_espectador = null;
        const modoPendienteInicio = modo_pendiente;
        invalidarCountdownInicioEspectador();
        finalizarIntroCuentaAtrasEspectador();
        if (modoPendienteInicio) {
            aplicarModo(modoPendienteInicio);
        }
        vaciarColaPutadasPendientesEspectador();
    }, 12000);
});
});

socket.on('post-inicio', data => {
    if (sonido) {
        sonido.pause();
        sonido.currentTime = 0;
    }
    partida_activa_espectador = true;
    actualizarBrandingPartidaEspectador();
    const modoPendienteInicio = modo_pendiente;
    invalidarCountdownInicioEspectador();
    finalizarIntroCuentaAtrasEspectador();
    detenerTemporizadorGigante();
    
    limpiezas();
    setPendienteAnimacionEntradaBarraVida(true);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);
    if (tiempo) {
        tiempo.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo, 0);
    }
    if (tiempo1) {
        tiempo1.style.display = DISPLAY_BARRA_VIDA;
        aplicarEstadoBarraVida(tiempo1, 0);
    }

    texto1.style.display = "";
    texto2.style.display = "";
    palabra1.style.display = "";
    definicion1.style.display = "";
    explicacion.style.display = "";
    actualizarPalabraConVisibilidad(palabra2, palabra2.innerHTML);
    actualizarPalabraConVisibilidad(palabra3, palabra3.innerHTML);
    definicion2.style.display = "";
    explicacion.style.display = "";
    setIndicadorGanadorMarcadorEspectador(1, false);
    setIndicadorGanadorMarcadorEspectador(2, false);
    setVisibilidadUiJugadorEspectador(1, true);
    setVisibilidadUiJugadorEspectador(2, true);
    actualizarVisibilidadPanelNivelEspectador();
    if (modoPendienteInicio) {
        aplicarModo(modoPendienteInicio);
    }
    vaciarColaPutadasPendientesEspectador();
});

// Resetea el tablero de juego.
socket.on('limpiar', data => {
    reiniciarSeguimientoTransicionNivelEspectador({ primeEmpty: true });
    limpiarAsincroniaVisualEspectador();
    detenerTemporizadorGigante();
    limpiarColaPalabrasPendientesEspectador();
    limpiarColaPutadasPendientesEspectador();
    reiniciarEstadoCierrePartidaEspectador();
    reiniciarHistorialVidaStatsEspectador();
    reiniciarTimelineModosStatsEspectador();
    setPendienteAnimacionEntradaBarraVida(false);
    partida_activa_espectador = false;
    actualizarBrandingPartidaEspectador();
    ocultarTodosResucitarMini();
    modo_nivel_activo_espectador = "";
    modo_actual = "";
    setBarraNivelClase("");
    actualizarVisibilidadPanelNivelEspectador();
    invalidarCountdownInicioEspectador();
    finalizarIntroCuentaAtrasEspectador();

    // Vaciar cualquier contenido HTML del elemento con id 'countdown'
    $('#countdown').empty()

    limpiezas();
    stopConfetti();
    if (tema) {
        tema.style.display = "none";
        tema.innerHTML = "";
    }
    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */

    tiempo.style.display = "none";
    tiempo1.style.display = "none";
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS("#contenedor_espectador", "pulse");
    });
    logo.style.display = "";
    neon.style.display = "";
    inspiracion.style.display = "none";
    if(sonido) sonido.pause();
    //reproducirSonido("../../game/audio/1. MENU DE INICIO.mp3", true)
    activar_sockets_extratextuales();
});

socket.on('activar_modo', data => {
    limpiarAsincroniaVisualEspectador();
    if (!aceptarEventoModoEspectador(data)) {
        return;
    }
    if (cuenta_atras_activa || inicio_modo_delay) {
        modo_pendiente = data;
        return;
    }
    aplicarModo(data);
});

socket.on('modo_actual', (data = {}) => {
    if (!aceptarEventoModoEspectador(data)) {
        return;
    }
    const payload = (data && typeof data === "object") ? data : {};
    const observacionTransicion = observarModoCanonicoTransicionEspectador(payload);
    const siguienteModo = Object.prototype.hasOwnProperty.call(payload, "modo_actual")
        ? String(payload.modo_actual || "")
        : modo_actual;
    if (cuenta_atras_activa || inicio_modo_delay) {
        aplazarTransicionNivelEspectador(observacionTransicion, payload);
        modo_pendiente = {
            ...(modo_pendiente || {}),
            ...payload,
            modo_actual: siguienteModo
        };
        return;
    }
    if (!siguienteModo) {
        return;
    }
    if (siguienteModo !== modo_actual || !modo_nivel_activo_espectador) {
        aplicarModo({ ...(ultimo_payload_modo_espectador || {}), ...payload, modo_actual: siguienteModo });
    }
    mostrarTransicionNivelEspectador(observacionTransicion, payload);
});

socket.on("temp_modos", (data = {}) => {
    if (!aceptarEventoModoEspectador(data)) {
        return;
    }
    sincronizarProgresoNivelBarraDesdeSegundos(data);
});

function aplicarModo(data) {
    invalidarContextoTransitorioEspectador();
    animacion_modo();
    const modoAnterior = modo_actual;
    ejecutarLimpiezaModo(modo_actual, data);
    refrescarEstadoVotacionVentaja();
    modo_actual = data && typeof data.modo_actual === "string" ? data.modo_actual : "";
    const cambioRealDeModo = modo_actual !== modoAnterior;
    registrarModoTimelineStatsEspectador(modo_actual);
    ultimo_payload_modo_espectador = data || {};
    if (data && typeof data.letra_bendita === "string" && data.letra_bendita.trim()) {
        ultima_letra_bendita_espectador = data.letra_bendita.trim();
    }
    if (data && typeof data.letra_prohibida === "string" && data.letra_prohibida.trim()) {
        ultima_letra_prohibida_espectador = data.letra_prohibida.trim();
    }
    if (cambioRealDeModo) {
        frase_final_completada_j1 = false;
        frase_final_completada_j2 = false;
        fin_ultimo_nivel_por_tiempo = false;
        reiniciarProgresoFraseFinalEspectador();
    }
    modo_nivel_activo_espectador = modo_actual;
    actualizarDuracionNivelDesdeParametros(data || {});
    setBarraNivelClase("");
    ejecutarModo(modo_actual, data);
    actualizarVisibilidadPanelNivelEspectador();
    if (modo_actual) {
        iniciarProgresoNivelBarra();
    } else {
        detenerProgresoNivelBarra(true);
    }
    if (cambioRealDeModo) {
        blueCount = 0;
        redCount = 0;
        updateBar();
    }
    actualizarVisibilidadPanelNivelEspectador();
    if (cambioRealDeModo) {
        vaciarColaPalabrasPendientesEspectador();
    }
    mostrarTransicionNivelPendienteEspectador(modo_actual);
}

function refrescarCabeceraModoActualEspectador() {
    if (!modo_actual) return;
    if (modo_actual === "letra prohibida") {
        if (explicacion) explicacion.innerHTML = construirExplicacionNivelLetra("prohibida", ultima_letra_prohibida_espectador);
        if (palabra1) palabra1.innerHTML = traducirTituloModoEspectador("letra prohibida", "NIVEL LETRA PROHIBIDA");
        return;
    }
    if (modo_actual === "letra bendita") {
        if (explicacion) explicacion.innerHTML = construirExplicacionNivelLetra("bendita", ultima_letra_bendita_espectador);
        if (palabra1) palabra1.innerHTML = traducirTituloModoEspectador("letra bendita", "NIVEL LETRA BENDITA");
        return;
    }
    if (modo_actual === "palabras bonus") {
        if (explicacion) explicacion.innerHTML = traducirDescripcionModoEspectador("palabras bonus", "SUMA TIEMPO CON PALABRAS BONUS");
        if (palabra1) palabra1.innerHTML = traducirTituloModoEspectador("palabras bonus", "NIVEL PALABRAS BONUS");
        return;
    }
    if (modo_actual === "palabras prohibidas") {
        if (explicacion) explicacion.innerHTML = traducirDescripcionModoEspectador("palabras prohibidas", "EVITA LAS PALABRAS PROHIBIDAS");
        if (palabra1) palabra1.innerHTML = traducirTituloModoEspectador("palabras prohibidas", "NIVEL PALABRAS PROHIBIDAS");
        return;
    }
    if (modo_actual === "tertulia") {
        if (explicacion) explicacion.innerHTML = traducirDescripcionModoEspectador("tertulia", "DIALOGA CON TUS MUSAS");
        if (palabra1) palabra1.innerHTML = traducirTituloModoEspectador("tertulia", "NIVEL TERTULIA");
        return;
    }
    if (modo_actual === "frase final") {
        if (explicacion) explicacion.innerHTML = traducirDescripcionModoEspectador("frase final", "ULTIMA RONDA");
        if (palabra1) palabra1.innerHTML = traducirTituloModoEspectador("frase final", "NIVEL FRASE FINAL");
        if (typeof frase_final_j1 === "string") {
            actualizarPalabraConVisibilidad(palabra2, "&laquo;" + frase_final_j1 + "&raquo;");
        }
        if (typeof frase_final_j2 === "string") {
            actualizarPalabraConVisibilidad(palabra3, "&laquo;" + frase_final_j2 + "&raquo;");
        }
        actualizarDefinicionConVisibilidad(definicion2, tJuego2P("mode.goal.last_one", {}, "Â¡Esta es la ultima!"), false);
        actualizarDefinicionConVisibilidad(definicion3, tJuego2P("mode.goal.last_one", {}, "Â¡Esta es la ultima!"), false);
    }
}

function refrescarUiIdiomaEspectador() {
    const textoGanadorPrevio = TEXTO_GANADOR_ESPECTADOR;
    const textoPerdidaPrevio = TEXTO_PERDISTE_SIN_PALABRAS_ESPECTADOR;
    TEXTO_GANADOR_ESPECTADOR = tJuego2P("game.finished", {}, "Â¡TEXTO TERMINADO!");
    TEXTO_PERDISTE_SIN_PALABRAS_ESPECTADOR = tJuego2P("game.no_words_lost", {}, "Â¡PERDISTE, NO ESCRIBISTE NADA!");

    [1, 2].forEach((jugadorId) => {
        const textoActual = obtenerTextoIndicadorGanadorEspectador(jugadorId);
        if (!textoActual) return;
        const esPerdida = textoActual === textoPerdidaPrevio;
        const esGanador = textoActual === textoGanadorPrevio || !esPerdida;
        setIndicadorGanadorMarcadorEspectador(
            jugadorId,
            true,
            esPerdida ? TEXTO_PERDISTE_SIN_PALABRAS_ESPECTADOR : (esGanador ? TEXTO_GANADOR_ESPECTADOR : textoActual)
        );
    });

    actualizarPuntosMarcadorEquipo(puntos1, obtenerPalabrasMarcadorEspectador(1), false);
    actualizarPuntosMarcadorEquipo(puntos2, obtenerPalabrasMarcadorEspectador(2), false);
    actualizarMusasMarcadorEquipo(musas1, (String(musas1 && musas1.textContent || "").match(/-?\d+/) || [0])[0], false);
    actualizarMusasMarcadorEquipo(musas2, (String(musas2 && musas2.textContent || "").match(/-?\d+/) || [0])[0], false);

    actualizarEtiquetasCursorCalentamiento();
    if (ultimo_payload_calentamiento_espectador) {
        actualizarCalentamientoEspectador(ultimo_payload_calentamiento_espectador);
    } else {
        renderizarHistorialDetonadores();
        actualizarConsignaCalentamientoEspectador(solicitud_calentamiento_espectador);
    }

    if (estado_stats_live_espectador) {
        renderizarStatsEspectador();
    } else {
        renderizarEstadoStatsEspectador("");
    }

    if (estado_puntuacion_final_espectador) {
        renderizarPuntuacionFinalEspectador({ animar: false });
    }

    renderizarCreditosEspectador();
    refrescarCabeceraModoActualEspectador();
    refrescarCountdownEspectador();

    document.querySelectorAll(".resucitar-title-question").forEach((nodo) => {
        if (window && typeof window.scribBuildResurrectionQuestionHtml2P === "function") {
            nodo.innerHTML = window.scribBuildResurrectionQuestionHtml2P();
        }
    });
    document.querySelectorAll(".quantity-title").forEach((nodo) => {
        nodo.textContent = tJuego2P("res.quantity_title", {}, "Selecciona la cantidad de palabras");
    });

    [1, 2].forEach((jugadorId) => {
        const estadoResucitar = ultimo_estado_resucitar_espectador[jugadorId];
        if (estadoResucitar && estadoResucitar.visible) {
            actualizarResucitarMini(estadoResucitar);
        }
    });

    [tiempo, tiempo1].forEach((nodoTiempo) => {
        if (!nodoTiempo) return;
        const texto = String(nodoTiempo.textContent || "").trim();
        if (texto && texto.indexOf(":") === -1) {
            nodoTiempo.textContent = textoTiempoAgotadoEspectador();
        }
    });
}

if (window && typeof window.scribOnLanguageChange2P === "function") {
    window.scribOnLanguageChange2P(() => {
        refrescarUiIdiomaEspectador();
    });
}

refrescarUiIdiomaEspectador();

socket.on('recibir_feedback_modificador', data => {
    const playerId = Number(data && data.player) === 2 ? 2 : 1;
    const idMod = data && typeof data.id_mod === "string" ? data.id_mod : "";
    const nodoMod = idMod ? getEl(idMod) : null;
    const textoFeedback = nodoMod
        ? (nodoMod.textContent || nodoMod.innerText || "")
        : "";

    if (textoFeedback.trim()) {
        mostrarFeedbackFlotanteEspectador(playerId, textoFeedback, {
            tipo: obtenerTipoFeedbackFlotanteDesdeTexto(textoFeedback)
        });
    }

    if (playerId === 2) {
        if (nodoMod) {
            nodoMod.style.display = "none";
        }
    } else if (idMod) {
        const idModLado1 = `${idMod.substring(0, Math.max(0, idMod.length - 1))}1`;
        const nodoModLado1 = getEl(idModLado1);
        if (nodoModLado1) {
            nodoModLado1.style.display = "none";
        }
    }
});

socket.on('enviar_palabra_j1', data => {
    if (debeAplazarRenderPalabraEspectador()) {
        encolarPalabraPendienteEspectador(data, 1);
        return;
    }
    recibir_palabra(data, 1);
});

socket.on('enviar_palabra_j2', data => {
    if (debeAplazarRenderPalabraEspectador()) {
        encolarPalabraPendienteEspectador(data, 2);
        return;
    }
    recibir_palabra(data, 2);
});

function esPayloadLimpiezaInspiracionEspectador(data) {
    return Boolean(data && typeof data === "object" && (
        data.limpiar_inspiracion ||
        data.inspiracion_caducada ||
        data.limpiar
    ));
}

function limpiarInspiracionLetrasEspectador(definicionElemento) {
    actualizarDefinicionConVisibilidad(definicionElemento, "", false);
    aplicarSuperbonusDefinicionEspectador(definicionElemento, {});
}

function renderInspiracionLetrasEspectador(escritxr, data, definicionElemento, selectorAnimacion) {
    const palabra = typeof data === "string" ? data : data?.palabra;
    const musa_nombre = (data && typeof data === "object") ? (data.musa_nombre || data.musa) : "";
    if (esPayloadLimpiezaInspiracionEspectador(data) || !palabra) {
        limpiarInspiracionLetrasEspectador(definicionElemento);
        return;
    }
    marcarPalabraInspirandoNube(escritxr, palabra, data);
    /*
      Usamos un template literal en una sola lï¿½fÂ­nea para evitar
      los espacios y saltos de lï¿½fÂ­nea inducidos por la indentaciï¿½fÂ³n.
      De este modo, no quedan espacios antes o despuï¿½fÂ©s de las comillas ï¿½,Â« ï¿½,Â».
    */
    const musaLabel = musa_nombre ? escapeHtml(musa_nombre) : "MUSA";
    actualizarDefinicionConVisibilidad(
        definicionElemento,
        `<span style="color: orange;">${musaLabel}</span><span style="color: white;">: </span><span style="color: white;">Podr&iacute;as escribir la palabra &laquo;</span><span style="color: lime; text-decoration: underline;">${escapeHtml(palabra)}</span><span style="color: white;">&raquo;</span>`,
        true
    );
    animateCSS(selectorAnimacion, "flash");
}

// Suscripciï¿½fÂ³n al evento 'inspirar_j1'
socket.on('inspirar_j1', data => {
    renderInspiracionLetrasEspectador(1, data, definicion2, ".definicion1");
});

// Suscripciï¿½fÂ³n al evento 'inspirar_j2'
socket.on('inspirar_j2', data => {
    renderInspiracionLetrasEspectador(2, data, definicion3, ".definicion2");
});

function recibir_palabra(data, escritxr) {
    if (!aceptarEventoModoEspectador(data, { actualizar: false })) {
        return;
    }
    if ((Number(escritxr) === 1 && terminado) || (Number(escritxr) === 2 && terminado1)) {
        return;
    }
    const animateCSS = (element, animation, prefix = 'animate__') =>
        new Promise((resolve) => {
            const animationName = `${prefix}${animation}`;
            const node = typeof element === "string" ? document.querySelector(element) : element;

            if (!node || !node.classList) {
                resolve('Animation skipped');
                return;
            }

            node.classList.add(`${prefix}animated`, animationName);

            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });

        const definicionFallback = extraerDefinicionPalabraEvento(data);
        const textoPalabra = construirTextoPalabraEvento(data);
        const palabraInspiracion = extraerPalabraPrincipalEvento(data);
        const superbonus = normalizarSuperbonusInspiracionEspectador(data);
        if (escritxr == 1) {
        const hayPalabra = actualizarPalabraConVisibilidad(palabra2, textoPalabra);
        if (!hayPalabra) {
            actualizarDefinicionConVisibilidad(definicion2, "", false);
            return;
        }
        let definicionHTML = "";
        if (data?.origen_musa === "musa") {
            const musaLabel = data?.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA";
            const superbonusLabel = superbonus.activo ? `<span class="superbonus-label">SUPERBONUS x${superbonus.repeticiones}</span><span style="color: white;"> - </span>` : "";
            definicionHTML = `${superbonusLabel}<span style="color:lime;">${musaLabel}</span><span style="color: white;">: </span><span style='color: white;'>Podr&iacute;as escribir esta palabra</span>`;
            aplicarSuperbonusDefinicionEspectador(definicion2, data);
            marcarPalabraInspirandoNube(1, palabraInspiracion, data);
        } else if (data?.origen_musa === "musa_enemiga") {
            const musaLabel = data?.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA ENEMIGA";
            definicionHTML = `<span style="color:red;">${musaLabel}</span>: <span style='color: orange;'>Me pega esta palabra</span>`;
            aplicarSuperbonusDefinicionEspectador(definicion2, {});
            marcarPalabraInspirandoNube(2, palabraInspiracion, data);
        } else {
            definicionHTML = definicionFallback;
            aplicarSuperbonusDefinicionEspectador(definicion2, {});
        }
            actualizarDefinicionConVisibilidad(definicion2, definicionHTML, true);
        
            if (!animarCambioPalabraLetrasEspectador(palabra2, definicion2)) {
                animateCSS(".explicacion1", "bounceInLeft");
                animateCSS(".palabra1", "bounceInLeft");
                animateCSS(".definicion1", "bounceInLeft");
            }
        }
        
    else{
        const hayPalabra = actualizarPalabraConVisibilidad(palabra3, textoPalabra);
        if (!hayPalabra) {
            actualizarDefinicionConVisibilidad(definicion3, "", false);
            return;
        }
        let definicionHTML = "";
        if (data?.origen_musa === "musa") {
            const musaLabel = data?.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA";
            const superbonusLabel = superbonus.activo ? `<span class="superbonus-label">SUPERBONUS x${superbonus.repeticiones}</span><span style="color: white;"> - </span>` : "";
            definicionHTML = `${superbonusLabel}<span style="color:lime;">${musaLabel}</span><span style="color: white;">: </span><span style='color: white;'>Podr&iacute;as escribir esta palabra</span>`;
            aplicarSuperbonusDefinicionEspectador(definicion3, data);
            marcarPalabraInspirandoNube(2, palabraInspiracion, data);
        } else if (data?.origen_musa === "musa_enemiga") {
            const musaLabel = data?.musa_nombre ? escapeHtml(data.musa_nombre) : "MUSA ENEMIGA";
            definicionHTML = `<span style="color:red;">${musaLabel}</span>: <span style='color: orange;'>Me pega esta palabra</span>`;
            aplicarSuperbonusDefinicionEspectador(definicion3, {});
            marcarPalabraInspirandoNube(1, palabraInspiracion, data);
        } else {
            definicionHTML = definicionFallback;
            aplicarSuperbonusDefinicionEspectador(definicion3, {});
        }
        actualizarDefinicionConVisibilidad(definicion3, definicionHTML, true);
           
        if (!animarCambioPalabraLetrasEspectador(palabra3, definicion3)) {
            animateCSS(".explicacion2", "bounceInLeft");
            animateCSS(".palabra2", "bounceInLeft");
            animateCSS(".definicion2", "bounceInLeft");
        }
    }
}

socket.on('feedback_a_j2', data => {
    var feedback = document.querySelector(".feedback1");
    if (feedback) {
        feedback.innerHTML = "";
    }
    mostrarFeedbackTiempoFlotanteEspectador(1, data);
    aplicarFulgorTiempoDesdeFeedbackEspectador(1, data);

    console.log(data.tiempo_feed)
    console.log(data.tipo)
    console.log(modo_actual)

    if (data.tipo == "borrar") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }

    if(data.tipo == "inspiracion"){
        procesarPalabraUsadaInspiracion(1, data);
        limpiarSugerenciaMusaModoLetrasEspectador(1, data);
        if (esInspiracionDesdeMusa(data)) {
            activarFulgorLadoEspectador(1, "musa");
        }
        reproducirSonido(
            esInspiracionMusaEnemiga(data)
                ? "../../game/audio/PERDER PALABRA.mp3"
                : "../../game/audio/GANAR PALABRA.mp3"
        );
    }

    if (data.tipo == "lista_prohibidas" || data.tipo == "letra_prohibida") {
        reproducirSonido("../../game/audio/PERDER PALABRA.mp3");

    }

    if (data.tipo == "rae" || data.tipo == "letra_bendita") {
            reproducirSonido("../../game/audio/GANAR PALABRA.mp3")
    }

    if (data.tipo == "perder_tiempo") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }
    // Si empieza por "Ã¢ÂÂ±Ã¯Â¸Â+" (ej.: "Ã¢ÂÂ±Ã¯Â¸Â+2 segs." o "Ã¢ÂÂ±Ã¯Â¸Â+6 segs.")
    if (data.tipo == "ganar_tiempo") {
        reproducirSonido("../../game/audio/GANAR 2 SEG.mp3");

    }
});

socket.on('feedback_a_j1', data => {
    var feedback1 = document.querySelector(".feedback2");
    if (feedback1) {
        feedback1.innerHTML = "";
    }
    mostrarFeedbackTiempoFlotanteEspectador(2, data);
    aplicarFulgorTiempoDesdeFeedbackEspectador(2, data);

    console.log(data.tiempo_feed)
    console.log(data.tipo)
    console.log(modo_actual)

    if (data.tipo == "borrar") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }

    if(data.tipo == "inspiracion"){
        procesarPalabraUsadaInspiracion(2, data);
        limpiarSugerenciaMusaModoLetrasEspectador(2, data);
        if (esInspiracionDesdeMusa(data)) {
            activarFulgorLadoEspectador(2, "musa");
        }
        reproducirSonido(
            esInspiracionMusaEnemiga(data)
                ? "../../game/audio/PERDER PALABRA.mp3"
                : "../../game/audio/GANAR PALABRA.mp3"
        );
    }

    if (data.tipo == "lista_prohibidas" || data.tipo == "letra_prohibida") {
        reproducirSonido("../../game/audio/PERDER PALABRA.mp3");

    }

    if (data.tipo == "rae" || data.tipo == "letra_bendita") {
            reproducirSonido("../../game/audio/GANAR PALABRA.mp3")
    }

    if (data.tipo == "perder_tiempo") {
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");

    }
    // Si empieza por "Ã¢ÂÂ±Ã¯Â¸Â+" (ej.: "Ã¢ÂÂ±Ã¯Â¸Â+2 segs." o "Ã¢ÂÂ±Ã¯Â¸Â+6 segs.")
    if (data.tipo == "ganar_tiempo") {
        reproducirSonido("../../game/audio/GANAR 2 SEG.mp3");

    }
});

socket.on('recibir_comentario', data => {
    tema.innerHTML = data;
});

socket.on('fin', data => {
        const payload = (data && typeof data === "object") ? data : { player: data };
        const jugadorFinalizado = Number(payload && payload.player);
        const cierreSinPalabras = Boolean(
            payload &&
            payload.motivo === "sin_palabras"
        ) || (
            (jugadorFinalizado === 1 || jugadorFinalizado === 2) &&
            obtenerPalabrasMarcadorEspectador(jugadorFinalizado) <= 0
        );
        const textoEtiqueta = cierreSinPalabras
            ? TEXTO_PERDISTE_SIN_PALABRAS_ESPECTADOR
            : undefined;
        if (
            payload &&
            payload.origen === "control" &&
            payload.suprimir_confetti_espectador !== false
        ) {
            suprimir_confetti_cierre_por_fin_control = true;
            stopConfetti();
        }
        if (jugadorFinalizado === 1 || jugadorFinalizado === 2) {
            if (jugadorFinalizado === 1) {
                cierre_definitivo_j1 = true;
            } else if (jugadorFinalizado === 2) {
                cierre_definitivo_j2 = true;
            }
            marcarJugadorTerminadoEspectador(jugadorFinalizado, {
                mostrarEtiquetaFinal: true,
                textoEtiqueta
            });
            ocultarResucitarMini(jugadorFinalizado);
            actualizarProgresoFraseFinalEspectador();
            evaluarCierrePartidaEspectador(payload);
        }
        detenerSonidosDesventaja();
        //confetti_aux();
});

socket.on("enviar_repentizado", repentizado => {
    //temas.innerHTML = "Ã¯Â¿Â½sÃ¯Â¿Â½Ã¯Â¸Â "+ repentizado + " Ã¯Â¿Â½sÃ¯Â¿Â½Ã¯Â¸Â";
    //animateCSS(".temas", "flash")
});

function anunciarPutadaEspectador(player, putada, opciones = {}) {
    const id = Number(player) === 2 ? 2 : 1;
    const rival = id === 1 ? 2 : 1;
    const putadaNormalizada = normalizarPutada(putada);
    const feedbackLargo = Boolean(opciones.feedbackLargo);
    const duracionFeedback = feedbackLargo ? obtenerDuracionFeedbackPutadaEspectador() : null;
    const opcionesNegativas = feedbackLargo
        ? {
            tipo: "negativo",
            claseExtra: "feedback-tiempo-float--putada",
            duracionMs: duracionFeedback
        }
        : { tipo: "negativo" };
    const opcionesPositivas = feedbackLargo
        ? {
            tipo: "positivo",
            claseExtra: "feedback-tiempo-float--putada",
            duracionMs: duracionFeedback
        }
        : { tipo: "positivo" };
    aplicarPutadaEnEspectador(putadaNormalizada, id, opciones);
    if (opciones.mostrarFeedback !== false) {
        mostrarFeedbackFlotanteEspectador(id, `${putadaNormalizada} DESVENTAJA!`, opcionesNegativas);
        if (opciones.mostrarVentajaRival !== false) {
            mostrarFeedbackFlotanteEspectador(rival, `${putadaNormalizada} VENTAJA!`, opcionesPositivas);
        }
    }
}

function recibirPutadaEspectador(player, putada, opciones = {}) {
    if (debeAplazarPutadaEspectador()) {
        encolarPutadaPendienteEspectador(player, putada, opciones);
        return;
    }
    anunciarPutadaEspectador(player, putada, opciones);
}

function normalizarPayloadPutadaEspectador(playerFallback, payload) {
    const data = (payload && typeof payload === "object") ? payload : { putada: payload };
    const playerPayload = Number(data.player || data.target || data.jugador || playerFallback);
    const putada = data.putada || data.seleccion || data.ventaja || data.tipo || "";
    const duracion = Number(
        data.tiempo_restante_ms
        ?? data.restante_ms
        ?? data.duracion_ms
        ?? data.duracionMs
    );
    return {
        player: Number(playerPayload) === 2 ? 2 : 1,
        putada,
        pausada: Boolean(data.pausada),
        opciones: Number.isFinite(duracion) && duracion > 0 ? { duracionMs: Math.trunc(duracion) } : {}
    };
}

function recibirPayloadPutadaEspectador(playerFallback, payload, opciones = {}) {
    const data = normalizarPayloadPutadaEspectador(playerFallback, payload);
    recibirPutadaEspectador(data.player, data.putada, {
        ...data.opciones,
        ...opciones
    });
    if (data.pausada && typeof pausarDesventajasVisualesEspectador === "function") {
        pausarDesventajasVisualesEspectador();
    }
}

socket.on("enviar_ventaja_j1", putada => {
    limpiarEstadoVotacionVentaja();
    recibirPayloadPutadaEspectador(1, putada, { feedbackLargo: true });
});

socket.on("enviar_ventaja_j2", putada => {
    limpiarEstadoVotacionVentaja();
    recibirPayloadPutadaEspectador(2, putada, { feedbackLargo: true });
});

socket.on("enviar_putada_de_j1", putada => {
    recibirPayloadPutadaEspectador(1, putada, { feedbackLargo: true });
});

socket.on("enviar_putada_de_j2", putada => {
    recibirPayloadPutadaEspectador(2, putada, { feedbackLargo: true });
});

socket.on("desventaja_activa_estado", payload => {
    recibirPayloadPutadaEspectador(1, payload, {
        mostrarFeedback: false,
        mostrarVentajaRival: false
    });
});

socket.on("pausar_js", () => {
    if (typeof pausarDesventajasVisualesEspectador === "function") {
        pausarDesventajasVisualesEspectador();
    }
});

socket.on("reanudar_js", () => {
    if (typeof reanudarDesventajasVisualesEspectador === "function") {
        reanudarDesventajasVisualesEspectador();
    }
});

socket.on("nueva letra", letra => {
    const eventoLetra = extraerPayloadNuevaLetraEspectador(letra);
    if (!aceptarEventoModoEspectador(eventoLetra.payload)) {
        return;
    }
    letra = eventoLetra.letra;
    if(modo_actual == "letra prohibida"){
        ultima_letra_prohibida_espectador = String(letra || "").trim();
        animacion_modo();
        explicacion.innerHTML = construirExplicacionNivelLetra("prohibida", letra);
        activarEfectoCambioLetraEspectador("prohibida");
        }
    else if(modo_actual == "letra bendita"){
        ultima_letra_bendita_espectador = String(letra || "").trim();
        animacion_modo();
        explicacion.innerHTML = construirExplicacionNivelLetra("bendita", letra);
        activarEfectoCambioLetraEspectador("bendita");
    }
});

socket.on('elegir_ventaja_j1', () => {
    confetti_musas(0.25);
    activarEstadoVotacionVentaja("azul");
    
});

socket.on('elegir_ventaja_j2', () => {
    confetti_musas(0.75);
    activarEstadoVotacionVentaja("rojo");
});

//FUNCIONES AUXILIARES.

function reproducirSonido(rutaArchivo, loop = false) {
    // Creamos una nueva instancia de Audio con la ruta proporcionada
    sonido = new Audio(rutaArchivo);

    // Configuramos el bucle segï¿½fÂºn el parï¿½fÂ¡metro 'loop'
    sonido.loop = loop;

    // Intentamos reproducir el sonido
    // Si el navegador requiere interacciï¿½fÂ³n del usuario,
    // esta promesa puede fallar (por ejemplo, en navegadores mï¿½fÂ³viles).
    sonido.play().catch(error => {
      console.error('No se pudo reproducir el audio:', error);
    });
    return sonido;
  }

// Referencias a los elementos
// Variables para guardar los IDs de intervalo si es necesario detenerlos despuï¿½fÂ©s

// Ejemplo: iniciar animaciones segï¿½fÂºn un estado o condiciï¿½fÂ³n
function actualizarClaseVotacionVentajaEspectador() {
  if (!document.body) return;
  document.body.classList.toggle("votacion-desventaja-activa", Boolean(estado_votacion_ventaja_espectador));
}

function obtenerMensajeVotacionVentaja(condicion) {
  if (condicion === "azul") {
    return 'MUSAS <span style="color:aqua;">AZULES</span> ELIGIENDO <span style="color:lime;">DESVENTAJA</span>';
  }
  if (condicion === "rojo") {
    return 'MUSAS <span style="color:red;">ROJAS</span> ELIGIENDO <span style="color:lime;">DESVENTAJA</span>';
  }
  return "";
}

function refrescarEstadoVotacionVentaja() {
  if (Temasinterval) {
    clearInterval(Temasinterval);
    Temasinterval = null;
  }
  actualizarClaseVotacionVentajaEspectador();
  if (!tema) return;
  tema.innerHTML = "";
  tema.style.display = "";
  if (estado_votacion_ventaja_espectador) {
    iniciarAnimacionesSegunCondicion(estado_votacion_ventaja_espectador);
  }
}

function activarEstadoVotacionVentaja(condicion) {
  estado_votacion_ventaja_espectador = condicion === "rojo" ? "rojo" : "azul";
  refrescarEstadoVotacionVentaja();
}

function iniciarAnimacionesSegunCondicion(condicion) {
  if (!tema) return;
  if (condicion === "azul") {
    // Inicia animaciï¿½fÂ³n para musas azules
    Temasinterval = startDotAnimation(tema, obtenerMensajeVotacionVentaja("azul"));
  } else if (condicion === "rojo") {
    // Inicia animaciï¿½fÂ³n para musas rojas
    Temasinterval = startDotAnimation(tema, obtenerMensajeVotacionVentaja("rojo"));
  }
}

function startDotAnimation(element, baseText, maxDots = 3, intervalTime = 500) {
    let dotCount = 0;
  
    // Configura y guarda el intervalo
    animateCSS(".temas", "flash");
    element.style.color = 'orange';
    element.style.fontSize = '1.5em';
    element.innerHTML = baseText;
    const intervalId = setInterval(() => {
      dotCount = (dotCount + 1) % (maxDots + 1);
      element.innerHTML = baseText + ".".repeat(dotCount);
    }, intervalTime);
  
    return intervalId;
  }

  function limpiarEstadoVotacionVentaja() {
    estado_votacion_ventaja_espectador = "";
    actualizarClaseVotacionVentajaEspectador();
    if (tema) {
        tema.innerHTML = "";
        tema.style.display = "";
    }
    if (Temasinterval) {
        clearInterval(Temasinterval);
        Temasinterval = null;
    }
  }

function manejarVoteEspectador() {
    ventana = window.open("https://www.mentimeter.com/s/0f9582fcdbab7e15216ee66df67113d6/f14a05785a97", '_blank');
}

function manejarExitEspectador() {
    if (ventana && !ventana.closed) {
        ventana.close();
    }
    ventana = null;
}

function manejarScrollEspectador(data) {
    if (!PERMITIR_SCROLL_ESPECTADOR) return;
    if (data == "arriba") {
        window.scrollBy(0, -50);
    }
    else {
        window.scrollBy(0, 50);
    }
}

function manejarScrollSincroEspectador() {
    if (!PERMITIR_SCROLL_ESPECTADOR) return;
    window.scrollTo({ top: 0 });
}

function manejarNombre2Espectador(data) {
    nombre2.value = data;
    actualizarEtiquetasCursorCalentamiento();
}

function manejarNombre1Espectador(data) {
    nombre1.value = data;
    actualizarEtiquetasCursorCalentamiento();
}

function manejarTemasEspectador() {
    if (!tema) return;
    tema.innerHTML = "";
    tema.style.display = "none";
}

function registrarSocketExtratextualEspectador(evento, handler) {
    window.ScribRuntime.onSocket(socket, evento, handler);
}

function activar_sockets_extratextuales() {

    // Abre la votaciï¿½fÂ³n de los textos.
    registrarSocketExtratextualEspectador('vote', manejarVoteEspectador);

    // Cierra la votaciï¿½fÂ³n de los textos.
    registrarSocketExtratextualEspectador('exit', manejarExitEspectador);

    // Realiza el scroll.
    registrarSocketExtratextualEspectador('scroll', manejarScrollEspectador);

    registrarSocketExtratextualEspectador('scroll_sincro', manejarScrollSincroEspectador);

/*
    socket.on('impro', data => {
        if(data){
            document.getElementById("contenedor_espectador").style.display = "none";
            tiempo.style.display = "none";
            tiempo1.style.display = "none";
        }
        else{
            document.getElementById("contenedor_espectador").style.display = "";
            tiempo.style.display = "";
            tiempo1.style.display = "none";

        }
    });
*/
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    registrarSocketExtratextualEspectador('nombre2', manejarNombre2Espectador);

    // Recibe el nombre del jugador 1 y lo coloca en su sitio.
    registrarSocketExtratextualEspectador('nombre1', manejarNombre1Espectador);

    /*
    Recibe los temas y llama a la funciï¿½fÂ³n erm() para
    elegir uno aleatoriamente.
    */
    registrarSocketExtratextualEspectador('temas_espectador', manejarTemasEspectador);



    /*socket.on("recibir_postgame1", (data) => {
        focalizador2.innerHTML = "<br>Ã¯Â¿Â½Y-<Ã¯Â¸Â Caracteres escritos = " + data.longitud + "<br>Ã¯Â¿Â½Y"s Palabras bonus = " + data.puntos_palabra + "<br>Ã¯Â¿Â½O Letra prohibida = " + data.puntos_letra_prohibida + "<br>Ã¯Â¿Â½Y~? Letra bendita = " + data.puntos_letra_bendita;
    });

    socket.on("recibir_postgame2", (data) => {
        focalizador1.innerHTML = "<br>Ã¯Â¿Â½Y-<Ã¯Â¸Â Caracteres escritos = " + data.longitud + "<br>Ã¯Â¿Â½Y"s Palabras bonus = " + data.puntos_palabra + "<br>Ã¯Â¿Â½O Letra prohibida = " + data.puntos_letra_prohibida + "<br>Ã¯Â¿Â½Y~? Letra bendita = " + data.puntos_letra_bendita;
    });*/
}

function getRandColor() {
    var hex = "01234567890ABCDEF",
        res = "#";
    for (var i = 0; i < 6; i += 1) {
        res += hex[Math.floor(Math.random() * hex.length)];
    }
    return res;
}

function getRandNumber(s, e) {
    return Math.floor(Math.random() * (e - s + 1)) + s;
}

function getRandFontFamily() {
    var fontFamilies = ["Impact", "Georgia", "Tahoma", "Verdana", "Impact", "Marlet"]; // Add more
    return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
}

function getTextAlign() {
    var aligns = ["center", "left", "right", "justify"]; // Add more
    return aligns[Math.floor(Math.random() * aligns.length)];
}

function stylize() {
    //texto1.style.fontFamily = getRandFontFamily();
    texto1.style.color = getRandColor();
    //var tamaï¿½fÂ±o_letra = getRandNumber(7, 35)
    //text.style.fontSize = tamaï¿½fÂ±o_letra + "px"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = getTextAlign();
    //texto2.style.textAlign = getTextAlign();
    //texto2.style.fontFamily = getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tamaï¿½fÂ±o_letra + "px"; // Font sizes between 15px and 35px
    document.body.style.backgroundColor = getRandColor();
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
    document.body.style.backgroundColor = getRandColor();
}


function animacion_modo() {
    const animateCSS = (element, animation, prefix = 'animate__') =>
        new Promise((resolve) => {
            const animationName = `${prefix}${animation}`;
            const node = typeof element === "string" ? document.querySelector(element) : element;

            if (!node || !node.classList) {
                resolve('Animation skipped');
                return;
            }

            node.classList.add(`${prefix}animated`, animationName);

            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".explicaciï¿½fÂ³n", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

// Funciï¿½fÂ³n auxiliar que reestablece el estilo inicial de la pï¿½fÂ¡gina modificado por el modo psicodï¿½fÂ©lico.
function restablecer_estilo() {
    //texto1.style.fontFamily = "monospace";
    texto1.style.color = "white";
    //texto1.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = "justify";
    //texto2.style.fontFamily = "monospace";
    texto2.style.color = "white";
    //texto2.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto2.style.textAlign = "justify";
    document.body.style.backgroundColor = "black";
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
}

// Funciï¿½fÂ³n auxiliar que elimina los saltos de lï¿½fÂ­nea al principio de un string.
function eliminar_saltos_de_linea(texto) {
    var i = 0;
    while (texto[i] == "\n") {
        i++;
    }
    return (texto.substring(i, texto.length));
}

// Funciï¿½fÂ³n auxiliar que genera un string con n saltos de lï¿½fÂ­nea.
function crear_n_saltos_de_linea(n) {
    var saltos = "";
    var cont = 0;
    while (cont <= n) {
        saltos += "\n";
        cont++;
    }
    return saltos;
}

// FUNCIONES AUXILIARES PARA LA ELECCIÃ¯Â¿Â½"N ALEATORIA DEL TEMA.
function cambiar_color_puntuacion() {
    // El color del marcador ahora es fijo por equipo (CSS). 
    // Limpiamos cualquier inline style residual de lï¿½fÂ³gicas anteriores.
    if (puntos1) puntos1.style.removeProperty("color");
    if (puntos2) puntos2.style.removeProperty("color");
}

function limpiezas(){
    limpiarAsincroniaVisualEspectador();
    invalidarContextoTransitorioEspectador();

    invalidarCountdownInicioEspectador();
    finalizarIntroCuentaAtrasEspectador();
    limpiarColaPalabrasPendientesEspectador();
    reiniciarEstadoCierrePartidaEspectador();
    detenerSonidosDesventaja();
    limpiarVisualPutadasEspectador();
    ocultarTodosResucitarMini();
    detenerProgresoNivelBarra(true);
    limpiarEstiloPalabrasModoLetrasEspectador();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);

    clearTimeout(tempo_text_inverso1);
    clearTimeout(tempo_text_inverso2);
    clearTimeout(tempo_text_borroso1);
    clearTimeout(tempo_text_borroso2);
    if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
        sonido_modo.pause();
    }

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");

    limpiarEstadoVotacionVentaja();
    terminado = false;
    terminado1 = false;

    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    limpiarFeedbackFlotanteEspectador();

    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicacion.innerHTML = "";
    palabra2.innerHTML = "";
    definicion2.innerHTML = "";
    explicacion1.innerHTML = "";
    palabra3.innerHTML = "";
    definicion3.innerHTML = "";
    explicacion2.innerHTML = "";

    
    texto1.innerText = "";
    texto2.innerText = "";
    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";
    texto1.style.display = "none";
    texto2.style.display = "none";
    programarActualizacionDegradadoTextosEspectador();

    actualizarPuntosMarcadorEquipo(puntos1, 0, false);
    actualizarPuntosMarcadorEquipo(puntos2, 0, false);
    
    texto1.classList.remove('textarea_blur');
    texto2.classList.remove('textarea_blur');
    

    focalizador1.innerHTML = "";
    focalizador2.innerHTML = "";

    for (let key in LIMPIEZAS) { 
        LIMPIEZAS[key]();
    }

    feedback_tiempo.style.color = color_positivo;
    feedback_tiempo1.style.color = color_positivo;

    blueCount = 0;
    redCount = 0;
    updateBar();
}

function limpiezas_final(){
    limpiarAsincroniaVisualEspectador();
    invalidarContextoTransitorioEspectador();

    invalidarCountdownInicioEspectador();
    limpiarColaPalabrasPendientesEspectador();
    limpiarColaPutadasPendientesEspectador();
    limpiarEstiloPalabrasModoLetrasEspectador();
    setPendienteAnimacionEntradaBarraVida(false);
    cancelarAnimacionEntradaBarraVida(tiempo);
    cancelarAnimacionEntradaBarraVida(tiempo1);
    partida_activa_espectador = false;
    modo_nivel_activo_espectador = "";
    modo_actual = "";
    limpiarVisualPutadasEspectador();
    setBarraNivelClase("");
    actualizarVisibilidadPanelNivelEspectador();
    finalizarIntroCuentaAtrasEspectador();
    detenerProgresoNivelBarra(true);

    if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
        sonido_modo.pause();
    }

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");

    if (tema) {
        tema.style.display = "none";
        tema.innerHTML = "";
    }
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    limpiarFeedbackFlotanteEspectador();
    
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicacion.innerHTML = "";
    palabra2.innerHTML = "";
    definicion2.innerHTML = "";
    explicacion1.innerHTML = "";
    palabra3.innerHTML = "";
    definicion3.innerHTML = "";
    explicacion2.innerHTML = "";
    inspiracion.style.display = "none";

    tiempo.style.color = "white";
    tiempo1.style.color = "white";

    texto1.innerText = "";
    texto2.innerText = "";
    texto1.style.display = "none";
    texto2.style.display = "none";


    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";

    texto1.classList.remove('textarea_blur');
    texto2.classList.remove('textarea_blur');

    limpiarModoPsicodelicoEspectador("");

    feedback_tiempo.style.color = color_positivo;  
    feedback_tiempo1.style.color = color_positivo;

    clearTimeout(listener_cuenta_atras);
    clearTimeout(tempo_text_inverso1);
    clearTimeout(tempo_text_inverso2);
    clearTimeout(tempo_text_borroso1);
    clearTimeout(tempo_text_borroso2);

    detenerSonidosDesventaja();

    blueCount = 0;
    redCount = 0;
    updateBar();
    limpiarEstadoVotacionVentaja();
}

var CONFETTI_TOP_Z_INDEX = 2147483647;
var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: CONFETTI_TOP_Z_INDEX };
var isConfettiRunning = true; // Indicador para controlar la ejecuciï¿½fÂ³n

let confettiIntervalEspectador = null;
let confettiFrameEspectador = null;

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function confetti_aux() {
    if (vista_espectador_modo_resuelta === "stats") {
        stopConfetti();
        return;
    }
    stopConfetti();

    sonido_confetti = reproducirSonido("../../game/audio/CELEBRACION con explosiones.mp3")
    
  var animationEnd = Date.now() + duration; // Actualiza aquï¿½fÂ­ dentro de la funciï¿½fÂ³n
  isConfettiRunning = true; // Habilita la ejecuciï¿½fÂ³n de confetti
  console.log(isConfettiRunning);
  
  confettiIntervalEspectador = setInterval(function() {
    if (!isConfettiRunning) {
      clearInterval(confettiIntervalEspectador);
      confettiIntervalEspectador = null;
      return;
    }

    var timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(confettiIntervalEspectador);
      confettiIntervalEspectador = null;
      return;
    }

    var particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function stopConfetti() {
    if (sonido_confetti_musa) sonido_confetti_musa.pause();
    if (sonido_confetti) sonido_confetti.pause();
    isConfettiRunning = false;
    if (confettiIntervalEspectador) {
        clearInterval(confettiIntervalEspectador);
        confettiIntervalEspectador = null;
    }
    if (confettiFrameEspectador) {
        cancelAnimationFrame(confettiFrameEspectador);
        confettiFrameEspectador = null;
    }
    if (typeof confetti !== "undefined" && typeof confetti.reset === "function") {
        confetti.reset();
    }
}
function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un nï¿½fÂºmero entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un nï¿½fÂºmero entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

  function confetti_musas(pos){
    if (vista_espectador_modo_resuelta === "stats") {
      stopConfetti();
      return;
    }

    if (typeof confetti !== "function") {
      return;
    }

    stopConfetti();
    sonido_confetti_musa = reproducirSonido("../../game/audio/FX/9. ESTRELLAS.mp3")
    
    var scalar = 2;
    var starShape = null;
    if (typeof confetti.shapeFromText === "function") {
      starShape = confetti.shapeFromText({
        text: "\u2B50",
        scalar,
        color: "#ffd43b",
        fontFamily: "\"Apple Color Emoji\", \"Segoe UI Emoji\", \"Noto Color Emoji\", sans-serif"
      });
    }
    isConfettiRunning = true; // Habilita la ejecuciï¿½fÂ³n de confetti
    var end = Date.now() + (2 * 1000);
    
    (function frame() {
      const opciones = {
        startVelocity: 12,
        particleCount: 2,
        angle: 270,
        spread: 1000,
        origin: { y: 0, x: pos },
        scalar: 3,
        colors: ["#fff6ad", "#ffe066", "#ffd43b", "#ffffff"],
        zIndex: CONFETTI_TOP_Z_INDEX
      };
      if (starShape) {
        opciones.shapes = [starShape];
      }
      confetti(opciones);
    
      if ((Date.now() < end) && isConfettiRunning) {
        confettiFrameEspectador = requestAnimationFrame(frame);
        return;
      }
      confettiFrameEspectador = null;
    }());
    }

// Funciï¿½fÂ³n para actualizar la barra
function updateBar() {
    const total = blueCount + redCount;
    let bluePercentage, redPercentage;

    if (total === 0) {
        bluePercentage = 50;
        redPercentage = 50;
    } else {
        bluePercentage = (blueCount / total) * 100;
        redPercentage = (redCount / total) * 100;
    }

    if (!inspiracion) return;
    const blueSegment = inspiracion.querySelector('.bar-segment.blue');
    const redSegment = inspiracion.querySelector('.bar-segment.red');
    if (!blueSegment || !redSegment) return;
    const blueText = blueSegment.querySelector('.percentage-text');
    const redText = redSegment.querySelector('.percentage-text');
    if (!blueText || !redText) return;

    blueSegment.style.width = `${bluePercentage}%`;
    redSegment.style.width = `${redPercentage}%`;

    // Ajuste dinï¿½fÂ¡mico del tamaï¿½fÂ±o de la fuente en vw
    const baseFontSize = 0.5; // Tamaï¿½fÂ±o de fuente base en vw
    const maxFontSize = 2; // Tamaï¿½fÂ±o de fuente mï¿½fÂ¡ximo en vw
    const blueFontSize = Math.min(baseFontSize + (bluePercentage / 100) * (maxFontSize - baseFontSize), maxFontSize);
    const redFontSize = Math.min(baseFontSize + (redPercentage / 100) * (maxFontSize - baseFontSize), maxFontSize);

    // Eliminar ".00" si el valor es un nï¿½fÂºmero entero
    if (Number.isInteger(bluePercentage)) {
        blueText.innerHTML = `${bluePercentage} %`;
    } else {
        blueText.innerHTML = `${bluePercentage.toFixed(0)} %`;
    }
    blueText.style.fontSize = `${blueFontSize}vw`;

    if (Number.isInteger(redPercentage)) {
        redText.innerHTML = `${redPercentage} %`;
    } else {
        redText.innerHTML = `${redPercentage.toFixed(0)} %`;
    }
    redText.style.fontSize = `${redFontSize}vw`;
}


function increment(color, valor = 1) {
    const cantidad = Number(valor);
    const incremento = Number.isFinite(cantidad) ? Math.max(0, Math.min(1, cantidad)) : 1;
    if (inspiracion && inspiracion.style.display !== "block") {
        inspiracion.style.display = "block";
    }
    if (color === 'blue') {
        blueCount += incremento;
    } else if (color === 'red') {
        redCount += incremento;
    }
    updateBar();
}

// Inicializaciï¿½fÂ³n con valores iniciales
blueCount = 0;
redCount = 0;
updateBar();

// Funciï¿½fÂ³n para establecer la posiciï¿½fÂ³n del caret
function establecerPosicionCaret(node, pos) {
    const range = document.createRange();
    const selection = window.getSelection();
    let offset = pos;

    function setRange(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.length >= offset) {
                range.setStart(node, offset);
                return true;
            } else {
                offset -= node.length;
            }
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (setRange(node.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    setRange(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

// Funciï¿½fÂ³n para centrar el scroll en la posiciï¿½fÂ³n del caret
function centrarScroll(node, pos) {
    const range = document.createRange();
    const selection = window.getSelection();
    let offset = pos;

    function setRange(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.length >= offset) {
                range.setStart(node, offset);
                return true;
            } else {
                offset -= node.length;
            }
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (setRange(node.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    setRange(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Centramos el scroll en la posiciï¿½fÂ³n del caret
    const caretPosition = range.getBoundingClientRect();
    const containerPosition = node.getBoundingClientRect();
    offset = caretPosition.top - containerPosition.top;
    node.scrollTop = offset - node.clientHeight / 2;
}

const mirrors = new WeakMap();

const TAGS_SALTO_LINEA = new Set(["BR", "DIV", "P", "LI"]);

function obtenerTextoPlanoConSaltos(contenedor) {
    let texto = "";
    function recorrer(nodo, esRaiz) {
        if (nodo.nodeType === Node.TEXT_NODE) {
            texto += nodo.textContent;
            return;
        }
        if (nodo.nodeType !== Node.ELEMENT_NODE) return;
        const tag = nodo.tagName;
        if (tag === "BR") {
            texto += "\n";
            return;
        }
        const hijos = nodo.childNodes;
        if (!hijos || hijos.length === 0) {
            if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
                texto += "\n";
            }
            return;
        }
        for (let i = 0; i < hijos.length; i++) {
            recorrer(hijos[i], false);
        }
        if (!esRaiz && TAGS_SALTO_LINEA.has(tag)) {
            if (texto.length === 0 || texto[texto.length - 1] !== "\n") {
                texto += "\n";
            }
        }
    }
    recorrer(contenedor, true);
    return texto;
}

function prepararMirror(contenedor) {
    let mirror = mirrors.get(contenedor);
    if (!mirror) {
        mirror = document.createElement("div");
        mirror.setAttribute("data-mirror", "caret");
        mirror.style.position = "absolute";
        mirror.style.top = "0";
        mirror.style.left = "-99999px";
        mirror.style.visibility = "hidden";
        mirror.style.pointerEvents = "none";
        mirror.style.margin = "0";
        document.body.appendChild(mirror);
        mirrors.set(contenedor, mirror);
    }
    const estilos = getComputedStyle(contenedor);
    mirror.style.fontFamily = estilos.fontFamily;
    mirror.style.fontSize = estilos.fontSize;
    mirror.style.fontWeight = estilos.fontWeight;
    mirror.style.letterSpacing = estilos.letterSpacing;
    mirror.style.wordSpacing = estilos.wordSpacing;
    mirror.style.lineHeight = estilos.lineHeight;
    mirror.style.whiteSpace = estilos.whiteSpace;
    mirror.style.wordBreak = estilos.wordBreak;
    mirror.style.overflowWrap = estilos.overflowWrap;
    mirror.style.padding = estilos.padding;
    mirror.style.border = estilos.border;
    mirror.style.boxSizing = estilos.boxSizing;
    mirror.style.width = `${contenedor.clientWidth}px`;
    return mirror;
}

function posicionarScrollPorCaretPosPreciso(contenedor, caretPos) {
    if (!Number.isInteger(caretPos)) return false;
    if (contenedor.clientHeight === 0) return false;

    const mirror = prepararMirror(contenedor);
    const textoPlano = obtenerTextoPlanoConSaltos(contenedor);
    mirror.textContent = textoPlano;

    const total = textoPlano.length;
    const pos = Math.max(0, Math.min(caretPos, total));
    const lineHeight = Math.max(
        parseFloat(getComputedStyle(contenedor).lineHeight) || 0,
        16
    );

    if (!mirror.firstChild) {
        contenedor.scrollTop = 0;
        return true;
    }

    const textNode = mirror.firstChild;
    const range = document.createRange();
    range.setStart(textNode, pos);
    range.collapse(true);

    const marker = document.createElement("span");
    marker.setAttribute("data-caret-marker", "1");
    marker.style.display = "inline-block";
    marker.style.width = "0px";
    marker.style.height = `${lineHeight}px`;
    marker.style.padding = "0";
    marker.style.margin = "0";
    marker.style.pointerEvents = "none";
    marker.style.verticalAlign = "text-bottom";
    range.insertNode(marker);

    const rect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    marker.remove();

    if (!rect || (!rect.height && !rect.width)) {
        return false;
    }

    const padding = lineHeight * 0.2;
    const offsetTop = rect.top - mirrorRect.top;
    const target = offsetTop - (contenedor.clientHeight - lineHeight - padding);
    const maxScroll = Math.max(0, contenedor.scrollHeight - contenedor.clientHeight);
    contenedor.scrollTop = Math.max(0, Math.min(target, maxScroll));
    return true;
}

function obtenerNodoPorRuta(raiz, ruta) {
    let actual = raiz;
    for (let i = 0; i < ruta.length; i++) {
        if (!actual || !actual.childNodes || !actual.childNodes[ruta[i]]) {
            return null;
        }
        actual = actual.childNodes[ruta[i]];
    }
    return actual;
}

function obtenerPrimerTexto(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.TEXT_NODE) return nodo;
    for (let i = 0; i < nodo.childNodes.length; i++) {
        const encontrado = obtenerPrimerTexto(nodo.childNodes[i]);
        if (encontrado) return encontrado;
    }
    return null;
}

function obtenerUltimoTexto(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.TEXT_NODE) return nodo;
    for (let i = nodo.childNodes.length - 1; i >= 0; i--) {
        const encontrado = obtenerUltimoTexto(nodo.childNodes[i]);
        if (encontrado) return encontrado;
    }
    return null;
}

function obtenerNodoTextoCercano(nodo, offset) {
    if (nodo.nodeType === Node.TEXT_NODE) {
        return { nodo, offset: Math.min(offset, nodo.length) };
    }
    if (nodo.nodeType !== Node.ELEMENT_NODE) return null;
    const hijos = nodo.childNodes;
    if (!hijos || hijos.length === 0) return null;
    const anterior = offset > 0 ? hijos[offset - 1] : null;
    const siguiente = offset < hijos.length ? hijos[offset] : null;
    const textoAnterior = obtenerUltimoTexto(anterior);
    if (textoAnterior) {
        return { nodo: textoAnterior, offset: textoAnterior.length };
    }
    const textoSiguiente = obtenerPrimerTexto(siguiente);
    if (textoSiguiente) {
        return { nodo: textoSiguiente, offset: 0 };
    }
    return null;
}

function obtenerPrimerBr(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.ELEMENT_NODE && nodo.tagName === "BR") return nodo;
    if (!nodo.childNodes) return null;
    for (let i = 0; i < nodo.childNodes.length; i++) {
        const encontrado = obtenerPrimerBr(nodo.childNodes[i]);
        if (encontrado) return encontrado;
    }
    return null;
}

function obtenerUltimoBr(nodo) {
    if (!nodo) return null;
    if (nodo.nodeType === Node.ELEMENT_NODE && nodo.tagName === "BR") return nodo;
    if (!nodo.childNodes) return null;
    for (let i = nodo.childNodes.length - 1; i >= 0; i--) {
        const encontrado = obtenerUltimoBr(nodo.childNodes[i]);
        if (encontrado) return encontrado;
    }
    return null;
}

function obtenerRectanguloPorBr(nodo, offset) {
    if (!nodo || nodo.nodeType !== Node.ELEMENT_NODE) return null;
    const hijos = nodo.childNodes;
    if (!hijos || hijos.length === 0) return null;
    const anterior = offset > 0 ? hijos[offset - 1] : null;
    const siguiente = offset < hijos.length ? hijos[offset] : null;
    const brAnterior = obtenerUltimoBr(anterior);
    if (brAnterior) {
        const rect = brAnterior.getBoundingClientRect();
        if (rect && (rect.height || rect.width)) return rect;
    }
    const brSiguiente = obtenerPrimerBr(siguiente);
    if (brSiguiente) {
        const rect = brSiguiente.getBoundingClientRect();
        if (rect && (rect.height || rect.width)) return rect;
    }
    const brInterno = obtenerUltimoBr(nodo);
    if (brInterno) {
        const rect = brInterno.getBoundingClientRect();
        if (rect && (rect.height || rect.width)) return rect;
    }
    return null;
}

function obtenerRectanguloRange(range) {
    const rects = range.getClientRects();
    if (rects.length > 0) return rects[0];
    const rect = range.getBoundingClientRect();
    if (rect && (rect.height || rect.width)) return rect;
    const nodo = range.startContainer;
    if (nodo && nodo.nodeType === Node.TEXT_NODE && nodo.length > 0) {
        const clone = range.cloneRange();
        if (range.startOffset > 0) {
            clone.setStart(nodo, range.startOffset - 1);
            clone.setEnd(nodo, range.startOffset);
        } else {
            clone.setStart(nodo, 0);
            clone.setEnd(nodo, Math.min(1, nodo.length));
        }
        const rectsClone = clone.getClientRects();
        if (rectsClone.length > 0) return rectsClone[0];
        const rectClone = clone.getBoundingClientRect();
        if (rectClone && (rectClone.height || rectClone.width)) return rectClone;
    }
    return null;
}

function ajustarScrollPorRect(contenedor, rect) {
    const contRect = contenedor.getBoundingClientRect();
    const lineHeight = Math.max(
        rect.height || 0,
        parseFloat(getComputedStyle(contenedor).lineHeight) || 0,
        16
    );
    const padding = lineHeight * 0.2;
    const target = (rect.top - contRect.top) - (contenedor.clientHeight - lineHeight - padding);
    const maxScroll = Math.max(0, contenedor.scrollHeight - contenedor.clientHeight);
    contenedor.scrollTop = Math.max(0, Math.min(target, maxScroll));
}

function posicionarScrollPorCaretPath(contenedor, ruta, offset) {
    const nodo = obtenerNodoPorRuta(contenedor, ruta);
    if (!nodo) return false;
    const range = document.createRange();
    if (nodo.nodeType === Node.TEXT_NODE) {
        const off = Math.max(0, Math.min(offset, nodo.length));
        range.setStart(nodo, off);
    } else if (nodo.nodeType === Node.ELEMENT_NODE) {
        const off = Math.max(0, Math.min(offset, nodo.childNodes.length));
        const cercano = obtenerNodoTextoCercano(nodo, off);
        if (cercano) {
            range.setStart(cercano.nodo, cercano.offset);
        } else {
            range.setStart(nodo, off);
        }
    } else {
        return false;
    }
    range.collapse(true);
    let rect = obtenerRectanguloRange(range);
    if (!rect && nodo.nodeType === Node.ELEMENT_NODE) {
        const off = Math.max(0, Math.min(offset, nodo.childNodes.length));
        rect = obtenerRectanguloPorBr(nodo, off);
    }
    if (!rect) {
        contenedor.scrollTop = contenedor.scrollHeight;
        return true;
    }
    ajustarScrollPorRect(contenedor, rect);
    return true;
}

function posicionarScrollPorRatio(node, ratio) {
    const lineHeight = Math.max(
        parseFloat(getComputedStyle(node).lineHeight) || 0,
        16
    );
    const padding = lineHeight * 0.2;
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
    const caretOffset = ratio * node.scrollHeight;
    const target = caretOffset - (node.clientHeight - lineHeight - padding);
    node.scrollTop = Math.max(0, Math.min(target, maxScroll));
}

function posicionarScrollPorLinea(node, linea) {
    const lineHeight = Math.max(
        parseFloat(getComputedStyle(node).lineHeight) || 0,
        16
    );
    const padding = lineHeight * 0.2;
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
    const offset = linea * lineHeight;
    const target = offset - (node.clientHeight - lineHeight - padding);
    node.scrollTop = Math.max(0, Math.min(target, maxScroll));
}

function posicionarScrollPorCaretPos(contenedor, pos) {
    const range = document.createRange();
    let restante = pos;
    let encontrado = false;

    function recorrer(nodo) {
        if (encontrado) return;
        if (nodo.nodeType === Node.TEXT_NODE) {
            const len = nodo.textContent.length;
            if (restante <= len) {
                range.setStart(nodo, restante);
                encontrado = true;
                return;
            }
            restante -= len;
            return;
        }
        if (nodo.nodeType === Node.ELEMENT_NODE) {
            if (nodo.tagName === "BR") {
                if (restante === 0) {
                    range.setStartBefore(nodo);
                    encontrado = true;
                    return;
                }
                restante -= 1;
                return;
            }
            for (let i = 0; i < nodo.childNodes.length; i++) {
                recorrer(nodo.childNodes[i]);
                if (encontrado) return;
            }
        }
    }

    recorrer(contenedor);
    if (!encontrado) {
        range.selectNodeContents(contenedor);
        range.collapse(false);
    } else {
        range.collapse(true);
    }

    const rect = obtenerRectanguloRange(range);
    if (!rect) {
        contenedor.scrollTop = contenedor.scrollHeight;
        return false;
    }
    ajustarScrollPorRect(contenedor, rect);
    return true;
}

function posicionarScrollEnUltimaLinea(node, pos) {
    const range = document.createRange();
    let offset = pos;

    function setRange(nodeActual) {
        if (nodeActual.nodeType === Node.TEXT_NODE) {
            if (nodeActual.length >= offset) {
                range.setStart(nodeActual, offset);
                return true;
            }
            offset -= nodeActual.length;
        } else {
            for (let i = 0; i < nodeActual.childNodes.length; i++) {
                if (setRange(nodeActual.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    if (!setRange(node)) return;
    range.collapse(true);

    const caretPosition = range.getBoundingClientRect();
    const containerPosition = node.getBoundingClientRect();
    const lineHeight = Math.max(
        caretPosition.height || 0,
        parseFloat(getComputedStyle(node).lineHeight) || 0,
        16
    );
    const padding = lineHeight * 0.2;
    const target = (caretPosition.top - containerPosition.top) - (node.clientHeight - lineHeight - padding);
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
    node.scrollTop = Math.max(0, Math.min(target, maxScroll));
}


if (socket && typeof socket.connect === "function" && !socket.connected) {
    socket.connect();
}
