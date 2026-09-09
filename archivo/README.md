# Archivo vivo de <SCRI> B

La colección pública se alimenta desde `data/textos.json`. Cada entrada conserva el texto extraído de la función, su autoría, fecha, datos opcionales y la ruta del PDF descargable.

Para volver a generar todos los PDF con la plantilla de `<SCRI> B`:

```sh
npm run build:archive
```

La generación no corrige ni reescribe los textos: mantiene la escritura improvisada original. Los identificadores de Drive de cada fuente quedan registrados en `sourceId` para poder rastrear el documento de procedencia.
