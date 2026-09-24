(function initInstagramExportControl(global) {
    "use strict";

    let exportacionEnCurso = false;

    function obtenerContenidoJugador(playerId) {
        const esJ2 = Number(playerId) === 2;
        const textoEl = esJ2 ? texto2 : texto1;
        const guardado = esJ2 ? texto_guardado2 : texto_guardado1;
        const html = textoEl && typeof textoEl.innerHTML === "string" ? textoEl.innerHTML : "";
        const textoDesdeHtml = typeof extraerTextoPlanoDesdeHtmlControl === "function"
            ? extraerTextoPlanoDesdeHtmlControl(html)
            : "";
        const textoVisible = textoDesdeHtml || (textoEl && typeof textoEl.innerText === "string"
            ? String(textoEl.innerText || "").trim()
            : "");
        const textoGuardado = typeof guardado === "string" ? guardado.trim() : "";
        return {
            html,
            texto: textoVisible || textoGuardado
        };
    }

    function contarPulsaciones(playerId) {
        const conteos = heatmapConteos && heatmapConteos[playerId];
        if (!conteos || typeof conteos.forEach !== "function") return 0;
        let total = 0;
        conteos.forEach((valor) => {
            total += Math.max(0, Number(valor) || 0);
        });
        return Math.round(total);
    }

    function valoresMapa(mapa) {
        if (!mapa || typeof mapa.keys !== "function") return [];
        return Array.from(mapa.keys()).map(String).filter(Boolean);
    }

    function resumirMusas(resumen, playerId) {
        const equipos = resumen && resumen.equipos && typeof resumen.equipos === "object"
            ? resumen.equipos
            : {};
        const equipo = equipos[playerId] || equipos[String(playerId)] || {};
        const musas = Array.isArray(equipo.musas) ? equipo.musas.filter(Boolean) : [];
        const acumulado = musas.reduce((salida, musa) => {
            const stats = musa && typeof musa.stats === "object" ? musa.stats : {};
            salida.enviadas += Math.max(0, Number(stats.enviadas) || 0);
            salida.introducidas += Math.max(0, Number(stats.introducidas) || 0);
            salida.superbonus += Math.max(0, Number(stats.superbonus) || 0);
            return salida;
        }, { enviadas: 0, introducidas: 0, superbonus: 0 });
        const nombres = musas
            .map((musa) => String(musa && musa.nombre ? musa.nombre : "").trim())
            .filter(Boolean);
        const efectividad = acumulado.enviadas > 0
            ? Math.round((acumulado.introducidas / acumulado.enviadas) * 100)
            : 0;
        return {
            cantidad: Math.max(nombres.length, Number(equipo.total_musas) || 0),
            nombres,
            enviadas: acumulado.enviadas,
            introducidas: acumulado.introducidas,
            efectividad,
            superbonus: acumulado.superbonus
        };
    }

    function puntuacionJugador(playerId) {
        const jugadores = estado_puntuacion_final_control
            && estado_puntuacion_final_control.jugadores
            && typeof estado_puntuacion_final_control.jugadores === "object"
            ? estado_puntuacion_final_control.jugadores
            : {};
        const jugador = jugadores[playerId] || jugadores[String(playerId)] || {};
        return Math.max(0, Math.min(100, Number(jugador.total) || 0));
    }

    function formatDuracion(ms) {
        const segundosTotales = Math.max(0, Math.round((Number(ms) || 0) / 1000));
        const minutos = Math.floor(segundosTotales / 60);
        const segundos = String(segundosTotales % 60).padStart(2, "0");
        return `${minutos}:${segundos}`;
    }

    function formatoFecha(fecha = new Date()) {
        return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }).format(fecha).toLocaleUpperCase("es-ES");
    }

    function construirDatosInstagram(resumenMusas) {
        const contenido = {
            1: obtenerContenidoJugador(1),
            2: obtenerContenidoJugador(2)
        };
        const tiempoEscrituraMs = Math.max(0, Number(obtenerTiempoEscrituraMs()) || 0);
        const minutosEscritura = tiempoEscrituraMs / 60000;
        const letrasBenditas = Array.from(resumenPartida.letrasBenditas || []).sort();
        const letrasMalditas = Array.from(resumenPartida.letrasMalditas || []).sort();
        const jugadores = {};
        [1, 2].forEach((playerId) => {
            const pulsaciones = contarPulsaciones(playerId);
            jugadores[playerId] = {
                nombre: playerId === 1 ? val_nombre1 : val_nombre2,
                texto: contenido[playerId].texto,
                palabras: obtenerConteoPalabrasControl(playerId),
                unicas: obtenerPalabrasUnicasControl(playerId),
                pulsaciones,
                ppm: minutosEscritura > 0 ? Math.round(pulsaciones / minutosEscritura) : 0,
                inspiraciones: resumirMusas(resumenMusas, playerId).introducidas,
                puntuacion: puntuacionJugador(playerId),
                letrasBenditas,
                letrasMalditas,
                palabrasBenditas: extraerPalabrasConClase(
                    contenido[playerId].html,
                    CLASES_PALABRAS_DESTACADAS_PDF
                ),
                palabrasMalditas: valoresMapa(resumenPartida.palabrasProhibidasUsadas[playerId])
            };
        });
        const duracionMs = resumenPartida.inicio
            ? Math.max(0, Date.now() - resumenPartida.inicio)
            : tiempoEscrituraMs;
        return {
            fecha: formatoFecha(),
            duracion: formatDuracion(duracionMs),
            jugadores,
            musas: {
                1: resumirMusas(resumenMusas, 1),
                2: resumirMusas(resumenMusas, 2)
            },
            puntuacion: estado_puntuacion_final_control || null
        };
    }

    function descargarZip(bytes, nombre) {
        const blob = new Blob([bytes], { type: "application/zip" });
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = nombre;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 1200);
    }

    function actualizarEstado(mensaje, tipo = "") {
        const estado = document.getElementById("instagram_export_status");
        if (!estado) return;
        estado.textContent = mensaje;
        estado.dataset.state = tipo;
    }

    async function exportarCarruselInstagramControl() {
        if (exportacionEnCurso) return;
        const report = global.ScribInstagramReport;
        if (!report || typeof report.generarPngs !== "function" || typeof report.crearZip !== "function") {
            actualizarEstado("NO SE PUDO CARGAR EL EXPORTADOR.", "error");
            return;
        }
        exportacionEnCurso = true;
        const boton = document.getElementById("boton_exportar_instagram");
        if (boton) {
            boton.disabled = true;
            boton.setAttribute("aria-busy", "true");
        }
        actualizarEstado("REUNIENDO LOS DATOS DE LA PARTIDA…", "loading");
        try {
            if (socket && typeof socket.emit === "function") {
                socket.emit("pedir_puntuacion_final");
            }
            const resumenMusas = await pedirResumenMusasPdfControl(2500);
            const datos = construirDatosInstagram(resumenMusas);
            const resultado = await report.generarPngs(datos, {
                onProgress(actual, total) {
                    actualizarEstado(`CREANDO PNG ${actual}/${total}…`, "loading");
                }
            });
            actualizarEstado("EMPAQUETANDO EL CARRUSEL…", "loading");
            const zip = report.crearZip(resultado.archivos);
            const fecha = typeof formatearFechaDescargaArchivo === "function"
                ? formatearFechaDescargaArchivo()
                : new Date().toISOString().slice(0, 10);
            descargarZip(zip, `SCRIB_CARRUSEL_INSTAGRAM_${fecha}.zip`);
            actualizarEstado(
                `ZIP LISTO · ${resultado.archivos.length} PNG · ${report.WIDTH}×${report.HEIGHT}`,
                "success"
            );
        } catch (error) {
            console.error("No se pudo exportar el carrusel de Instagram:", error);
            actualizarEstado("NO SE PUDO GENERAR EL ZIP. VUELVE A INTENTARLO.", "error");
        } finally {
            exportacionEnCurso = false;
            if (boton) {
                boton.disabled = false;
                boton.removeAttribute("aria-busy");
            }
        }
    }

    global.construirDatosInstagramControl = construirDatosInstagram;
    global.exportarCarruselInstagramControl = exportarCarruselInstagramControl;
})(window);
