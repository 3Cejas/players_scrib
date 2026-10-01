# players_scrib

Cliente multirol de SCRIB.

Aqui viven las vistas y la logica de:

- `control`
- `writers`
- `musas`
- `spectator`
- `actors`

## Charla

El comando `charla` de la web abre la presentación de Sutura y SCRIB.
También se puede entrar directamente en `/charla/`.

La presentación conserva el tutorial y añade el origen del videojuego,
los vídeos de El juego, los esquemas escénicos «Antes» y «Ahora» y una prueba
con dos escritoras y el QR de las Musas. El esquema actual empieza sin una
etapa seleccionada. Cada avance destaca la siguiente etapa y el retroceso
vuelve a la anterior. Los vídeos se reproducen al entrar en su diapositiva.

Los archivos de `charla/assets/` contienen los medios, imágenes y fuentes
de la presentación. Se sirven localmente desde el sitio.

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
