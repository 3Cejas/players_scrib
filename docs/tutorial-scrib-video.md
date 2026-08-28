# Videotutorial de acceso de musas

El activo publicado es `game/media/tutorial-scrib.mp4`. Es un vídeo 16:9 de 60 segundos, sin paneos, zoom, ruido animado, cronómetro ni barra de progreso. Cada plano permanece completamente estable y la animación se concentra en fundidos breves entre escenas. Incluye una voz neuronal mexicana con prosodia ajustada por frase, música de show de fondo, subtítulos quemados y una pista WebVTT adicional en `game/media/tutorial-scrib.vtt`. No necesita red ni servicios externos durante la reproducción. La URL real de acceso se muestra en una banda reservada durante la segunda escena, por lo que no se hornea una dirección dependiente del servidor ni se tapa ningún texto del vídeo.

Las pantallas del móvil reproducen únicamente estados que existen en la aplicación: bienvenida, botón `Omitir tutorial`, nombre, asignación equilibrada, revelación de equipo y escritxr, entrada al juego, calibración de color y confirmación.

## Línea temporal

| Tiempo | Contenido |
| --- | --- |
| 00–06 s | Bienvenida cálida a SCRIB. |
| 06–11 s | Abrir en el móvil la URL de la sala. |
| 11–15 s | Pulsar `Omitir tutorial` en la bienvenida real. |
| 15–20 s | Escribir el nombre y tocar la flecha azul. |
| 20–25 s | Tocar `DESCUBRIR MI EQUIPO`. |
| 25–30 s | Ver equipo y escritxr asignados; tocar `ENTRAR AL JUEGO`. |
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

Dependencias de generación: Bash, Node.js, Puppeteer ya instalado en el proyecto, Chromium, Python 3, `curl`, FFmpeg, ffprobe y acceso a internet para sintetizar la voz. En la primera ejecución el script instala `edge-tts` 7.2.8 en la caché de compilación. Después genera cada frase con `es-MX-DaliaNeural`, ajustando ritmo y tono según la intención de la escena. La voz no se genera durante la reproducción: queda integrada en el MP4.

Variables opcionales:

- `CHROMIUM_PATH`: ejecutable de Chromium; por defecto `/usr/bin/chromium`.
- `SCRIB_TTS_CACHE_DIR`: caché de la herramienta de síntesis; por defecto `/tmp/scrib-tutorial-tts-cache`.
- `SCRIB_TUTORIAL_BUILD_DIR`: conserva los intermedios en la ruta indicada.
- `SCRIB_KEEP_TUTORIAL_BUILD=1`: conserva un build temporal creado por el script.

El generador comprueba automáticamente duración de 60 s, H.264 a 1920×1080 y 30 fps, píxel `yuv420p`, AAC estéreo a 48 kHz y un tamaño máximo de 8 MiB.

## Procedencia y licencias

- Motion graphics, guion, subtítulos, tonos y código de generación: creados específicamente para SCRIB; los tonos son ondas seno sintetizadas por FFmpeg. No se reutiliza vídeo, música ni imagen de la pieza tomada como referencia de ritmo.
- Música de fondo: `game/audio/2. ACOMPAÑAR VOZ CON MELODIA.mp3`, activo propio ya incluido en SCRIB; se reproduce en bucle, con entrada/salida suave y reducción automática de volumen bajo la narración.
- Logotipo: `img/logo.png`, activo ya existente del proyecto SCRIB.
- Tipografía visual VT323: SIL Open Font License 1.1. El vídeo la incrusta en los gráficos rasterizados.
- `edge-tts` 7.2.8: herramienta de síntesis usada solo durante la compilación y no distribuida con la aplicación.
- Voz `es-MX-DaliaNeural`: voz neuronal femenina de español de México. El guion hablado evita comillas y mayúsculas técnicas; los rótulos visuales conservan los nombres exactos de los botones.

Fuentes: [edge-tts](https://github.com/rany2/edge-tts), [compatibilidad de voces de Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/language-support) y [VT323](https://github.com/google/fonts/tree/main/ofl/vt323).
