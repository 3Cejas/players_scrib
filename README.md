# players_scrib

Cliente multirol de SCRIB.

Aqui viven las vistas y la logica de:

- `control`
- `writers`
- `musas`
- `spectator`
- `actors`

## Cargar un bolo de Mundo SCRIB

En **Control → Juego → Cargar configuración de un bolo**, selecciona la función,
revisa sus equipos y confirma. Se cargan los nombres, los créditos del elenco y
los parámetros, niveles, idioma y frases finales opcionales guardados en la ficha.
No inicia ni limpia una partida; no se permite con una partida en marcha o pausada.
Primero activa y guarda la configuración desde **Editar bolo** en Mundo SCRIB.
El reparto necesita una persona de Escritura por equipo. La consulta pasa por el
servidor del videojuego: el navegador no recibe secretos ni datos de contacto.

Al finalizar por reloj o botón, el informe se guarda en la ficha de ese bolo en
Mundo SCRIB, como documento web (PDF opcional). Control indica «pendiente» o
«guardado». Si el mundo no responde, el servidor mantiene una cola privada en
disco y reintenta sin duplicar el informe ni perderlo al iniciar otra partida.

## Presentaciones del equipo

La guía del espectáculo y la charla de Sutura/SCRIB están ahora en
[Mundo SCRIB → Materiales](https://sutura-gateway.ddns.net/scrib/#materials),
con acceso Sutura/Authentik. Sus fuentes, imágenes y vídeos se sirven desde
`server_scrib/tools/scrib-world/materials/`, no desde esta web pública.
Los enlaces antiguos `/tutorial/` y `/charla/` redirigen al visor protegido.
El videotutorial del videojuego en `game/media/` sigue disponible sin cambios.

## Testing

La documentacion completa de tests y CI esta en [TESTING.md](./TESTING.md).

Resumen rapido:

- `npm run test:unit`
  Unit tests de logica frontend compartida.
- `npm run test:e2e:smoke`
  Bateria rapida de humo.
- `npm run test:e2e`
  Suite E2E completa por defecto.
- `npm run test:e2e:visual`
  Regresion visual.
- `npm run test:e2e:chaos`
  Reconexiones y carreras contra `server_scrib` local.

## Relacion con `server_scrib`

Los E2E de este repo prueban siempre `players_scrib` local contra `server_scrib`.

- por defecto usan una copia fresca de `server_scrib/master`
- para probar contra tu checkout local usa `npm run test:e2e:server-local`

La documentacion del lado servidor esta en `../server_scrib/TESTING.md`.
