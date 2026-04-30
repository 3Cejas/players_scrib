const LISTA_MODOS_INICIAL_JUEGO_1P = Object.freeze([
  "letra bendita",
  "letra prohibida",
  "palabras bonus",
  "palabras prohibidas",
  "frase final"
]);

const COLORES_MODOS_JUEGO_1P = Object.freeze({
  "letra bendita": "green",
  "letra prohibida": "red",
  "tertulia": "blue",
  "palabras bonus": "yellow",
  "palabras prohibidas": "pink",
  "frase final": "orange"
});

function obtenerListaModosInicialJuego1P() {
  if (Array.isArray(window.scrib1pInitialModes) && window.scrib1pInitialModes.length) {
    return window.scrib1pInitialModes;
  }
  return LISTA_MODOS_INICIAL_JUEGO_1P;
}

function obtenerColoresModosJuego1P() {
  if (window.scrib1pModeColors && typeof window.scrib1pModeColors === "object") {
    return window.scrib1pModeColors;
  }
  return COLORES_MODOS_JUEGO_1P;
}

