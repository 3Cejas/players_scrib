# Videotutorial de acceso de musas

El activo publicado es `game/media/tutorial-scrib.mp4`. Es un vídeo 16:9 de 120 segundos, sin paneos, zoom, ruido animado, cronómetro ni barra de progreso. Las acciones permanecen el tiempo suficiente para escuchar la indicación y leer la pantalla con calma. Cada plano es estable y la animación se concentra en fundidos breves entre escenas. Incluye una voz neuronal mexicana con prosodia ajustada por frase, música de show de fondo, subtítulos quemados y una pista WebVTT adicional en `game/media/tutorial-scrib.vtt`. No necesita red ni servicios externos durante la reproducción.

El acceso muestra `scribshow.es/musa` junto a un código QR real que apunta a `https://scribshow.es/musa`. El enlace y el QR permanecen visibles durante 28 segundos y la locución deja dos pausas expresas para que las musas puedan escanearlo o escribirlo sin prisa.

Las pantallas del móvil reproducen únicamente estados que existen en la aplicación: bienvenida, botón `Omitir tutorial`, nombre, descubrimiento del equipo, revelación de equipo y escritxr, entrada al juego, calibración de color y resultado de la comprobación. La verificación se registra automáticamente después del cuarto color; no se pide pulsar ningún botón.

## Línea temporal

| Tiempo | Contenido |
| --- | --- |
| 00–08 s | Bienvenida cálida a SCRIB. |
| 08–18 s | Entrar en `scribshow.es/musa` o escanear el QR. |
| 18–27 s | Primera pausa: «¿Ya lo has escaneado? Tómate tu tiempo». |
| 27–36 s | Segunda pausa: «¿Ya estás dentro? ¡Genial!». |
| 36–45 s | Pulsar `Omitir tutorial` en la bienvenida real. |
| 45–54 s | Escribir el nombre y tocar la flecha azul. |
| 54–63 s | Tocar `DESCUBRIR MI EQUIPO`. |
| 63–72 s | Leer equipo y escritxr asignados; tocar `ENTRAR AL JUEGO`. |
| 72–79 s | Introducción a la prueba visual. |
| 79–85 s | ROJO: «¿Ves la pantalla roja?». |
| 85–91 s | AZUL: «¿Ha cambiado?». |
| 91–97 s | VERDE: «¿Ya ves el verde?». |
| 97–103 s | BLANCO: «¿Ha funcionado?». |
| 103–111 s | Resultado automático de la prueba. |
| 111–120 s | Despedida y entrada a la experiencia. |

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

El generador comprueba automáticamente duración de 120 s, H.264 a 1920×1080 y 30 fps, píxel `yuv420p`, AAC estéreo a 48 kHz y un tamaño máximo de 12 MiB.

## Procedencia y licencias

- Motion graphics, guion, subtítulos, tonos y código de generación: creados específicamente para SCRIB; los tonos son ondas seno sintetizadas por FFmpeg. No se reutiliza vídeo, música ni imagen de la pieza tomada como referencia de ritmo.
- Música de fondo: `game/audio/2. ACOMPAÑAR VOZ CON MELODIA.mp3`, activo propio ya incluido en SCRIB; se reproduce en bucle, con entrada/salida suave y reducción automática de volumen bajo la narración.
- Código QR: generado desde `https://scribshow.es/musa` y validado por decodificación después de renderizarlo en el vídeo.
- Logotipo: `img/logo.png`, activo ya existente del proyecto SCRIB.
- Tipografía visual VT323: SIL Open Font License 1.1. El vídeo la incrusta en los gráficos rasterizados.
- `edge-tts` 7.2.8: herramienta de síntesis usada solo durante la compilación y no distribuida con la aplicación.
- Voz `es-MX-DaliaNeural`: voz neuronal femenina de español de México. El guion hablado evita comillas y mayúsculas técnicas; los rótulos visuales conservan los nombres exactos de los botones.

Fuentes: [edge-tts](https://github.com/rany2/edge-tts), [compatibilidad de voces de Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/language-support) y [VT323](https://github.com/google/fonts/tree/main/ofl/vt323).
