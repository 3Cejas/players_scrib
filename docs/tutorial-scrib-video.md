# Videotutorial de acceso de musas

El activo publicado es `game/media/tutorial-scrib.mp4`. Es un vídeo 16:9 de 100 segundos, sin paneos, zoom, ruido animado, cronómetro ni barra de progreso. Cada acción principal permanece nueve segundos en pantalla para dejar varios segundos de lectura después de la locución. Cada plano permanece completamente estable y la animación se concentra en fundidos breves entre escenas. Incluye una voz neuronal mexicana con prosodia ajustada por frase, música de show de fondo, subtítulos quemados y una pista WebVTT adicional en `game/media/tutorial-scrib.vtt`. No necesita red ni servicios externos durante la reproducción. La URL real de acceso se muestra en una banda reservada durante la segunda escena, por lo que no se hornea una dirección dependiente del servidor ni se tapa ningún texto del vídeo.

Las pantallas del móvil reproducen únicamente estados que existen en la aplicación: bienvenida, botón `Omitir tutorial`, nombre, descubrimiento del equipo, revelación de equipo y escritxr, entrada al juego, calibración de color y confirmación.

## Línea temporal

| Tiempo | Contenido |
| --- | --- |
| 00–08 s | Bienvenida cálida a SCRIB. |
| 08–17 s | Abrir en el móvil la URL de la sala. |
| 17–26 s | Pulsar `Omitir tutorial` en la bienvenida real. |
| 26–35 s | Escribir el nombre y tocar la flecha azul. |
| 35–44 s | Tocar `DESCUBRIR MI EQUIPO`. |
| 44–53 s | Leer equipo y escritxr asignados; tocar `ENTRAR AL JUEGO`. |
| 53–60 s | Aviso de la prueba visual. |
| 60–65 s | ROJO. |
| 65–70 s | AZUL. |
| 70–75 s | VERDE. |
| 75–80 s | BLANCO. |
| 80–89 s | Tocar `SÍ, FUNCIONA`. |
| 89–94 s | Ver la confirmación real del dispositivo. |
| 94–100 s | Despedida y entrada a la experiencia. |

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

El generador comprueba automáticamente duración de 100 s, H.264 a 1920×1080 y 30 fps, píxel `yuv420p`, AAC estéreo a 48 kHz y un tamaño máximo de 12 MiB.

## Procedencia y licencias

- Motion graphics, guion, subtítulos, tonos y código de generación: creados específicamente para SCRIB; los tonos son ondas seno sintetizadas por FFmpeg. No se reutiliza vídeo, música ni imagen de la pieza tomada como referencia de ritmo.
- Música de fondo: `game/audio/2. ACOMPAÑAR VOZ CON MELODIA.mp3`, activo propio ya incluido en SCRIB; se reproduce en bucle, con entrada/salida suave y reducción automática de volumen bajo la narración.
- Logotipo: `img/logo.png`, activo ya existente del proyecto SCRIB.
- Tipografía visual VT323: SIL Open Font License 1.1. El vídeo la incrusta en los gráficos rasterizados.
- `edge-tts` 7.2.8: herramienta de síntesis usada solo durante la compilación y no distribuida con la aplicación.
- Voz `es-MX-DaliaNeural`: voz neuronal femenina de español de México. El guion hablado evita comillas y mayúsculas técnicas; los rótulos visuales conservan los nombres exactos de los botones.

Fuentes: [edge-tts](https://github.com/rany2/edge-tts), [compatibilidad de voces de Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/language-support) y [VT323](https://github.com/google/fonts/tree/main/ofl/vt323).
