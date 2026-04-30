const AUDIO_BASE_PATH = "../../game/audio";
const AUDIO_MENU_INICIO = `${AUDIO_BASE_PATH}/1. MENU DE INICIO.mp3`;
const AUDIO_CUENTA_ATRAS_INICIO = `${AUDIO_BASE_PATH}/5. PREPARADOS 1.mp3`;
const AUDIOS_CUENTA_ATRAS = [
    `${AUDIO_BASE_PATH}/5. PREPARADOS 2.mp3`,
    `${AUDIO_BASE_PATH}/5. PREPARADOS 3.mp3`,
    `${AUDIO_BASE_PATH}/5. PREPARADOS 4.mp3`,
    `${AUDIO_BASE_PATH}/5. PREPARADOS 5.mp3`
];
const AUDIO_FINAL_PARTIDA = `${AUDIO_BASE_PATH}/CELEBRACION con explosiones.mp3`;
const AUDIO_GANAR_TIEMPO = `${AUDIO_BASE_PATH}/GANAR 2 SEG.mp3`;
const AUDIO_PERDER_TIEMPO = `${AUDIO_BASE_PATH}/PERDER 2 SEG.mp3`;
const AUDIO_DESVENTAJA_TRUENO = `${AUDIO_BASE_PATH}/FX/6. TRUENO 1.mp3`;
const AUDIO_DESVENTAJA_INVERSO = `${AUDIO_BASE_PATH}/FX/8. INVERSO LOOP.mp3`;
const AUDIO_DESVENTAJA_BORROSO = `${AUDIO_BASE_PATH}/FX/7. REMOLINO PARA LOOP.mp3`;
const AUDIO_MODOS = {
    "palabras bonus": {
        musica: `${AUDIO_BASE_PATH}/5. KEYGEN PRUEBA 1.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/12. PALABRAS BONUS.mp3`
    },
    "letra prohibida": {
        musica: `${AUDIO_BASE_PATH}/6. KEYGEN PRUEBA 2.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/11. LETRA PROHIBIDA.mp3`
    },
    "letra bendita": {
        musica: `${AUDIO_BASE_PATH}/5. KEYGEN PRUEBA 1.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/10. LETRA BENDITA.mp3`
    },
    "palabras prohibidas": {
        musica: `${AUDIO_BASE_PATH}/6. KEYGEN PRUEBA 2.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/13. PALABRAS PROHIBIDAS.mp3`
    },
    "tertulia": {
        musica: `${AUDIO_BASE_PATH}/7. KEYGEN PRUEBA 3.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/14. TERTULIA.mp3`
    },
    "frase final": {
        musica: `${AUDIO_BASE_PATH}/5. KEYGEN PRUEBA 1.mp3`,
        sfx: `${AUDIO_BASE_PATH}/FX/15. FRASE FINAL.mp3`
    }
};

const AUDIO_MUTE_STORAGE_KEY_1P = "scrib_1p_audio_muted";
const AUDIO_MENU_VOLUME_1P = 0.42;
const AUDIO_MODO_VOLUME_1P = 0.58;
const AUDIO_FINAL_VOLUME_1P = 0.95;
const AUDIO_CROSSFADE_FINAL_MENU_MS_1P = 4200;

let audio_musica_menu = null;
let audio_musica_modo = null;
let audio_final_partida = null;
let audio_desventaja_inverso = null;
let audio_desventaja_borroso = null;
let intervalo_sonido_rayo_desventaja = null;
const audios_sfx_activos = new Set();
const audios_activos_juego_1p = new Set();
let musica_menu_deseada_1p = false;
var audio_juego_silenciado_1p = false;

function persistirSilencioAudioJuego1P() {
    try {
        localStorage.setItem(AUDIO_MUTE_STORAGE_KEY_1P, audio_juego_silenciado_1p ? "1" : "0");
    } catch (_error) {}
}

function clampAudioVolume(valor, fallback = 1) {
    const numero = Number(valor);
    const seguro = Number.isFinite(numero) ? numero : fallback;
    return Math.max(0, Math.min(1, seguro));
}

function registrarAudioActivo(audio) {
    if (!audio) return null;
    audios_activos_juego_1p.add(audio);
    audio.muted = audio_juego_silenciado_1p;
    return audio;
}

function desregistrarAudioActivo(audio) {
    if (!audio) return;
    audios_activos_juego_1p.delete(audio);
}

function cancelarFundidoAudio(audio) {
    if (!audio || !audio.__scribFadeFrame) return;
    cancelAnimationFrame(audio.__scribFadeFrame);
    audio.__scribFadeFrame = null;
}

function cancelarMonitoresAudioFinal(audio) {
    if (!audio) return;
    if (audio.__scribFinalTimeupdate) {
        audio.removeEventListener("timeupdate", audio.__scribFinalTimeupdate);
        audio.__scribFinalTimeupdate = null;
    }
    if (audio.__scribFinalLoadedMetadata) {
        audio.removeEventListener("loadedmetadata", audio.__scribFinalLoadedMetadata);
        audio.__scribFinalLoadedMetadata = null;
    }
    if (audio.__scribFinalEnded) {
        audio.removeEventListener("ended", audio.__scribFinalEnded);
        audio.__scribFinalEnded = null;
    }
    if (audio.__scribFinalError) {
        audio.removeEventListener("error", audio.__scribFinalError);
        audio.__scribFinalError = null;
    }
}

function fundirVolumenAudio(audio, volumenObjetivo, duracionMs, opciones = {}) {
    if (!audio) return null;
    cancelarFundidoAudio(audio);
    const destino = clampAudioVolume(volumenObjetivo, 0);
    const duracion = Math.max(0, Number(duracionMs) || 0);
    const volumenInicial = clampAudioVolume(audio.volume, audio.__scribBaseVolume ?? 1);
    const pausaFinal = opciones.pauseOnEnd === true;
    const reiniciar = opciones.reiniciar !== false;
    const onComplete = typeof opciones.onComplete === "function" ? opciones.onComplete : null;

    if (duracion === 0 || Math.abs(destino - volumenInicial) < 0.001) {
        audio.volume = destino;
        audio.__scribBaseVolume = destino;
        if (pausaFinal && destino <= 0.001) {
            audio.pause();
            if (reiniciar) {
                try {
                    audio.currentTime = 0;
                } catch (_error) {}
            }
            desregistrarAudioActivo(audio);
        }
        if (onComplete) onComplete();
        return audio;
    }

    const inicio = performance.now();
    const paso = (ahora) => {
        const progreso = Math.min((ahora - inicio) / duracion, 1);
        const volumenActual = volumenInicial + ((destino - volumenInicial) * progreso);
        audio.volume = clampAudioVolume(volumenActual, destino);
        audio.__scribBaseVolume = audio.volume;
        if (progreso < 1) {
            audio.__scribFadeFrame = requestAnimationFrame(paso);
            return;
        }
        audio.__scribFadeFrame = null;
        if (pausaFinal && destino <= 0.001) {
            audio.pause();
            if (reiniciar) {
                try {
                    audio.currentTime = 0;
                } catch (_error) {}
            }
            desregistrarAudioActivo(audio);
        }
        if (onComplete) onComplete();
    };

    audio.__scribFadeFrame = requestAnimationFrame(paso);
    return audio;
}

function crearAudio(rutaArchivo, loop = false, volume = 1) {
    if (!rutaArchivo) return null;
    const audio = new Audio(rutaArchivo);
    audio.loop = loop;
    audio.preload = "auto";
    audio.volume = clampAudioVolume(volume, 1);
    audio.__scribBaseVolume = audio.volume;
    registrarAudioActivo(audio);
    audio.play().catch(() => {});
    return audio;
}

function detenerAudioActivo(audio, reiniciar = true) {
    if (!audio) return null;
    cancelarFundidoAudio(audio);
    cancelarMonitoresAudioFinal(audio);
    audio.pause();
    if (reiniciar) {
        try {
            audio.currentTime = 0;
        } catch (_error) {}
    }
    desregistrarAudioActivo(audio);
    return null;
}

function actualizarBotonesSilencioJuego() {
    const etiqueta = audio_juego_silenciado_1p
        ? tJuego1P("ui.btn_unmute", {}, "🔊 ACTIVAR SONIDO")
        : tJuego1P("ui.btn_mute", {}, "🔇 DESACTIVAR SONIDO");
    document.querySelectorAll("[data-audio-toggle]").forEach((boton) => {
        boton.textContent = etiqueta;
        boton.setAttribute("aria-pressed", audio_juego_silenciado_1p ? "true" : "false");
        boton.dataset.silenciado = audio_juego_silenciado_1p ? "1" : "0";
    });
}

function aplicarSilencioAudioJuego1P() {
    audios_activos_juego_1p.forEach((audio) => {
        audio.muted = audio_juego_silenciado_1p;
    });
    actualizarBotonesSilencioJuego();
}

function setSilencioJuego1P(silenciado) {
    audio_juego_silenciado_1p = Boolean(silenciado);
    persistirSilencioAudioJuego1P();
    aplicarSilencioAudioJuego1P();
    if (!audio_juego_silenciado_1p && musica_menu_deseada_1p) {
        asegurarMusicaMenu1P();
    }
}

function toggleSilencioJuego() {
    setSilencioJuego1P(!audio_juego_silenciado_1p);
}

window.toggleSilencioJuego = toggleSilencioJuego;

function iniciarMusicaMenu1P(opciones = {}) {
    musica_menu_deseada_1p = true;
    const reiniciar = opciones.reiniciar === true;
    const fadeInMs = Math.max(0, Number(opciones.fadeInMs) || 0);
    const volumenInicial = clampAudioVolume(
        opciones.volumeInicial,
        fadeInMs > 0 ? 0 : AUDIO_MENU_VOLUME_1P
    );

    if (!audio_musica_menu) {
        audio_musica_menu = crearAudio(AUDIO_MENU_INICIO, true, volumenInicial);
    } else {
        cancelarFundidoAudio(audio_musica_menu);
        if (reiniciar) {
            try {
                audio_musica_menu.currentTime = 0;
            } catch (_error) {}
        }
        audio_musica_menu.loop = true;
        audio_musica_menu.volume = volumenInicial;
        audio_musica_menu.__scribBaseVolume = volumenInicial;
        registrarAudioActivo(audio_musica_menu);
        audio_musica_menu.play().catch(() => {});
    }

    if (audio_musica_menu && fadeInMs > 0) {
        fundirVolumenAudio(audio_musica_menu, AUDIO_MENU_VOLUME_1P, fadeInMs);
    }
    aplicarSilencioAudioJuego1P();
    return audio_musica_menu;
}

function asegurarMusicaMenu1P() {
    if (!musica_menu_deseada_1p) return null;
    if (audio_musica_menu && !audio_musica_menu.paused) return audio_musica_menu;
    return iniciarMusicaMenu1P();
}

function detenerMusicaMenu1P(reiniciar = true) {
    musica_menu_deseada_1p = false;
    audio_musica_menu = detenerAudioActivo(audio_musica_menu, reiniciar);
}

function detenerMusicaModo() {
    audio_musica_modo = detenerAudioActivo(audio_musica_modo);
}

function reproducirSfx(rutaArchivo, volume = 1) {
    const audio = crearAudio(rutaArchivo, false, volume);
    if (!audio) return null;
    audios_sfx_activos.add(audio);
    const limpiar = () => {
        audios_sfx_activos.delete(audio);
        desregistrarAudioActivo(audio);
    };
    audio.addEventListener("ended", limpiar, { once: true });
    audio.addEventListener("error", limpiar, { once: true });
    return audio;
}

function detenerSfxActivos() {
    audios_sfx_activos.forEach((audio) => {
        detenerAudioActivo(audio);
    });
    audios_sfx_activos.clear();
}

function reproducirAudioModo(modo) {
    const config = AUDIO_MODOS[modo];
    detenerMusicaMenu1P();
    detenerMusicaModo();
    detenerAudioFinal();
    if (!config) return;
    if (config.musica) {
        audio_musica_modo = crearAudio(config.musica, true, AUDIO_MODO_VOLUME_1P);
    }
    if (config.sfx) {
        reproducirSfx(config.sfx, 1);
    }
}

function detenerAudioFinal() {
    audio_final_partida = detenerAudioActivo(audio_final_partida);
}

function programarCrossfadeFinalAMenu(audio) {
    if (!audio) return;
    cancelarMonitoresAudioFinal(audio);
    let crossfadeIniciado = false;

    const iniciarCrossfade = () => {
        if (crossfadeIniciado || audio !== audio_final_partida) return;
        crossfadeIniciado = true;
        iniciarMusicaMenu1P({
            reiniciar: true,
            volumeInicial: 0,
            fadeInMs: AUDIO_CROSSFADE_FINAL_MENU_MS_1P
        });
        fundirVolumenAudio(audio, 0, AUDIO_CROSSFADE_FINAL_MENU_MS_1P, {
            pauseOnEnd: true,
            reiniciar: true,
            onComplete: () => {
                if (audio === audio_final_partida) {
                    audio_final_partida = null;
                }
            }
        });
    };

    const revisarCrossfade = () => {
        if (audio !== audio_final_partida) return;
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
        const restante = audio.duration - audio.currentTime;
        if (restante <= (AUDIO_CROSSFADE_FINAL_MENU_MS_1P / 1000) + 0.12) {
            iniciarCrossfade();
        }
    };

    const finalizar = () => {
        cancelarMonitoresAudioFinal(audio);
        if (audio === audio_final_partida) {
            audio_final_partida = null;
        }
        if (!crossfadeIniciado) {
            iniciarMusicaMenu1P({
                reiniciar: true,
                volumeInicial: 0,
                fadeInMs: 900
            });
        }
    };

    audio.__scribFinalTimeupdate = revisarCrossfade;
    audio.__scribFinalLoadedMetadata = revisarCrossfade;
    audio.__scribFinalEnded = finalizar;
    audio.__scribFinalError = finalizar;

    audio.addEventListener("timeupdate", audio.__scribFinalTimeupdate);
    audio.addEventListener("loadedmetadata", audio.__scribFinalLoadedMetadata);
    audio.addEventListener("ended", audio.__scribFinalEnded);
    audio.addEventListener("error", audio.__scribFinalError);
}

function detenerSonidoRayoDesventaja() {
    if (!intervalo_sonido_rayo_desventaja) return;
    clearInterval(intervalo_sonido_rayo_desventaja);
    intervalo_sonido_rayo_desventaja = null;
}

function reproducirSonidoRayoDesventaja() {
    reproducirSfx(AUDIO_DESVENTAJA_TRUENO, 0.95);
}

function detenerAudioInversoDesventaja() {
    audio_desventaja_inverso = detenerAudioActivo(audio_desventaja_inverso);
}

function detenerAudioBorrosoDesventaja() {
    audio_desventaja_borroso = detenerAudioActivo(audio_desventaja_borroso);
}

function detenerAudiosDesventaja() {
    detenerSonidoRayoDesventaja();
    detenerAudioInversoDesventaja();
    detenerAudioBorrosoDesventaja();
}

function reproducirAudioFinal() {
    detenerMusicaMenu1P();
    detenerMusicaModo();
    detenerAudioFinal();
    audio_final_partida = crearAudio(AUDIO_FINAL_PARTIDA, false, AUDIO_FINAL_VOLUME_1P);
    programarCrossfadeFinalAMenu(audio_final_partida);
}

function detenerTodoAudioJuego() {
    detenerAudiosDesventaja();
    detenerMusicaMenu1P();
    detenerMusicaModo();
    detenerSfxActivos();
    detenerAudioFinal();
}

["pointerdown", "keydown", "touchstart"].forEach((evento) => {
    document.addEventListener(evento, () => {
        if (musica_menu_deseada_1p && !audio_juego_silenciado_1p) {
            asegurarMusicaMenu1P();
        }
    });
});

