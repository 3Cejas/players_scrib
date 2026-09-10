(function initFraseFinalUtils(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.ScribFraseFinalUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFraseFinalUtils() {
  function normalizarFraseFinal(valor) {
    let texto = String(valor || "").trim();
    if (texto.startsWith("«") && texto.endsWith("»") && texto.length > 1) {
      texto = texto.slice(1, -1).trim();
    }
    texto = texto.replace(/^["“]+/, "").replace(/["”]+$/, "").trim();
    return texto;
  }

  function normalizarTextoCierreFraseFinal(valor) {
    return normalizarFraseFinal(valor).toLowerCase();
  }

  function detectarFraseFinalCompletada(textoPlano, fraseObjetivo) {
    const objetivo = normalizarTextoCierreFraseFinal(fraseObjetivo);
    if (!objetivo) {
      return false;
    }
    const texto = normalizarTextoCierreFraseFinal(textoPlano);
    return texto.endsWith(objetivo);
  }

  function longitudProgresoFraseFinal(textoPlano, fraseObjetivo) {
    const objetivo = normalizarTextoCierreFraseFinal(fraseObjetivo);
    if (!objetivo) return 0;
    const texto = String(textoPlano || "").toLowerCase();
    const max = Math.min(texto.length, objetivo.length);
    for (let longitud = max; longitud > 0; longitud -= 1) {
      if (texto.endsWith(objetivo.slice(0, longitud))) return longitud;
    }
    return 0;
  }

  return {
    normalizarFraseFinal,
    normalizarTextoCierreFraseFinal,
    detectarFraseFinalCompletada,
    longitudProgresoFraseFinal
  };
});
