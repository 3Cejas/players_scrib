# Videotutorial de acceso de musas

El activo publicado es `game/media/tutorial-scrib.mp4`. Es un vídeo 16:9 de 60 segundos, sin paneos laterales, cronómetro ni barra de progreso, con transiciones animadas, un acercamiento central muy suave, voz mexicana en español, música de show de fondo, subtítulos quemados y una pista WebVTT adicional en `game/media/tutorial-scrib.vtt`. No necesita red ni servicios externos durante la reproducción. La URL real de acceso se muestra en una banda reservada durante la primera escena, por lo que no se hornea una dirección dependiente del servidor ni se tapa ningún texto del vídeo.

Las pantallas del móvil reproducen únicamente estados que existen en la aplicación: bienvenida, botón `Omitir tutorial`, nombre, asignación equilibrada, revelación de equipo y escritxr, entrada al juego, calibración de color y confirmación.

## Línea temporal

| Tiempo | Contenido |
| --- | --- |
| 00–06 s | Abrir en el móvil la URL de la sala. |
| 06–11 s | Tocar `Omitir tutorial` en la bienvenida real. |
| 11–17 s | Escribir el nombre y tocar la flecha azul. |
| 17–23 s | Tocar `DESCUBRIR MI EQUIPO`. |
| 23–30 s | Ver equipo y escritxr asignados; tocar `ENTRAR AL JUEGO`. |
| 30–34 s | Aviso de la prueba visual. |
| 34–38 s | ROJO. |
| 38–42 s | AZUL. |
| 42–46 s | VERDE. |
| 46–50 s | BLANCO. |
| 50–56 s | Tocar `SÍ, FUNCIONA`. |
| 56–60 s | Ver la confirmación real del dispositivo. |

## Regeneración

Desde la raíz del repositorio:

```bash
scripts/generate-tutorial-scrib-video.sh
```

Dependencias de generación: Bash, Node.js, Puppeteer ya instalado en el proyecto, Chromium, Python 3, `curl`, `sha256sum`, FFmpeg y ffprobe. En la primera ejecución el script descarga Piper 1.7.0 y la voz `es_MX-claude-high`; verifica el modelo y su configuración por SHA-256 antes de usarlos. Las ejecuciones siguientes reutilizan la caché.

Variables opcionales:

- `CHROMIUM_PATH`: ejecutable de Chromium; por defecto `/usr/bin/chromium`.
- `SCRIB_TTS_CACHE_DIR`: caché de Piper y del modelo; por defecto `/tmp/scrib-tutorial-tts-cache`.
- `SCRIB_TUTORIAL_BUILD_DIR`: conserva los intermedios en la ruta indicada.
- `SCRIB_KEEP_TUTORIAL_BUILD=1`: conserva un build temporal creado por el script.

El generador comprueba automáticamente duración de 60 s, H.264 a 1920×1080 y 30 fps, píxel `yuv420p`, AAC estéreo a 48 kHz y un tamaño máximo de 8 MiB.

## Procedencia y licencias

- Motion graphics, guion, subtítulos, tonos y código de generación: creados específicamente para SCRIB; los tonos son ondas seno sintetizadas por FFmpeg. No se reutiliza vídeo, música ni imagen de la pieza tomada como referencia de ritmo.
- Música de fondo: `game/audio/2. ACOMPAÑAR VOZ CON MELODIA.mp3`, activo propio ya incluido en SCRIB; se reproduce en bucle, con entrada/salida suave y reducción automática de volumen bajo la narración.
- Logotipo: `img/logo.png`, activo ya existente del proyecto SCRIB.
- Tipografía visual VT323: SIL Open Font License 1.1. El vídeo la incrusta en los gráficos rasterizados.
- Motor Piper 1.7.0: GPL-3.0-or-later, usado únicamente como herramienta de compilación y no distribuido dentro del MP4 ni del repositorio por este generador.
- Voz `es_MX-claude-high`: voz mexicana publicada en `rhasspy/piper-voices`; el repositorio de voces declara MIT y la ficha del modelo identifica el conjunto de origen `claude` con licencia Apache-2.0. El modelo se descarga a la caché y no se versiona.

Fuentes: [Piper](https://github.com/OHF-Voice/piper1-gpl), [piper-voices](https://huggingface.co/rhasspy/piper-voices) y [VT323](https://github.com/google/fonts/tree/main/ofl/vt323).
