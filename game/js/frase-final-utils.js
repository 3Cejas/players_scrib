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

  return {
    normalizarFraseFinal,
    normalizarTextoCierreFraseFinal,
    detectarFraseFinalCompletada
  };
});
