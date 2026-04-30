# players_scrib

Cliente multirol de SCRIB.

Aqui viven las vistas y la logica de:

- `control`
- `writers`
- `musas`
- `spectator`
- `actors`

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
