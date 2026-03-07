Original prompt: Quiero poner en opciones un boton para cambiar de idioma al inglés y al fránces para que traduzca automáticamente todo el juego

## 2026-03-03
- Revisado flujo actual de `1p_scrib` para localizar textos estáticos (`index.html`) y dinámicos (`juego.js`, `jugador-servidor.js`).
- Próximo paso: implementar capa i18n con persistencia, selector de idioma en opciones y actualización en vivo de UI.
- Implementado selector de idioma en `Opciones` (`es`, `en`, `fr`) con persistencia en `localStorage` (`scrib_1p_language`).
- Añadida capa i18n en `jugador-servidor.js`:
  - Diccionarios ES/EN/FR.
  - Helpers globales `scrib1pT`, `scrib1pSetLanguage`, `scrib1pFormatWordsCount`, `scrib1pFormatSecs`, etc.
  - Traducción de textos estáticos vía `data-i18n`, `data-i18n-html`, `data-i18n-attr`.
  - Traducción dinámica de marcador, menú de resurrección, countdown, feedback de tiempo y títulos/descripciones de modo.
- Adaptado `juego.js` para usar formato traducible en feedback de tiempo y contador de palabras.
- Adaptada generación de casillas de modos:
  - Etiquetas traducidas.
  - Mantiene selección previa al regenerar.
  - Expuesta actualización dinámica `window.scrib1pRefreshModeLabels`.
- Ajuste adicional: cambio de idioma en modo `frase final` ya no sobrescribe la frase objetivo (solo refresca textos auxiliares).
- Estilos añadidos para bloque de idioma en opciones (`dashboard-players.css`).
- Verificación:
  - `node --check` OK en `juego.js` y `jugador-servidor.js`.
  - Prueba Playwright del skill bloqueada por entorno (falta paquete `playwright` / navegador Chrome disponible para el runner).
