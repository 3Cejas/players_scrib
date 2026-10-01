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

  function estiloProgresoFraseFinal(ratio) {
    const t = Math.pow(Math.max(0, Math.min(1, Number(ratio) || 0)), 1.6);
    return {
      color: `hsl(32, ${Math.round(t * 100)}%, ${Math.round(96 - t * 40)}%)`,
      textShadow: `0 0 ${(0.08 + t * 0.6).toFixed(2)}em rgba(255, 140, 0, ${(0.03 + t * 0.6).toFixed(2)})`
    };
  }

  function obtenerRangoSufijoTexto(elemento, cantidad, omitirFinal = 0) {
    if (!elemento || cantidad <= 0) return null;
    const doc = elemento.ownerDocument;
    const walker = doc.createTreeWalker(elemento, 4);
    const nodos = [];
    let longitud = 0;
    while (walker.nextNode()) {
      nodos.push(walker.currentNode);
      longitud += walker.currentNode.textContent.length;
    }
    const fin = longitud - omitirFinal;
    const inicio = fin - cantidad;
    if (inicio < 0 || fin <= inicio || !nodos.length) return null;
    const rango = doc.createRange();
    let offset = 0;
    let iniciado = false;
    for (const nodo of nodos) {
      const siguiente = offset + nodo.textContent.length;
      if (!iniciado && inicio <= siguiente) {
        rango.setStart(nodo, inicio - offset);
        iniciado = true;
      }
      if (fin <= siguiente) {
        rango.setEnd(nodo, fin - offset);
        return rango;
      }
      offset = siguiente;
    }
    return null;
  }

  function htmlFraseFinalCompletada(elemento, fraseObjetivo) {
    // Only decorate a detached snapshot: typing and the caret remain untouched.
    const copia = elemento.cloneNode(true);
    const objetivo = normalizarTextoCierreFraseFinal(fraseObjetivo);
    const texto = copia.textContent || "";
    const finalIgnorado = (texto.match(/[\s"”»]*$/) || [""])[0].length;
    const cierre = texto.slice(0, texto.length - finalIgnorado).toLowerCase();
    if (!objetivo || !cierre.endsWith(objetivo)) return copia.innerHTML;
    const rango = obtenerRangoSufijoTexto(copia, objetivo.length, finalIgnorado);
    if (!rango) return copia.innerHTML;
    const marcado = copia.ownerDocument.createElement("span");
    marcado.className = "frase-final-progreso";
    marcado.appendChild(rango.extractContents());
    rango.insertNode(marcado);
    return copia.innerHTML;
  }

  return {
    normalizarFraseFinal,
    normalizarTextoCierreFraseFinal,
    detectarFraseFinalCompletada,
    longitudProgresoFraseFinal,
    estiloProgresoFraseFinal,
    obtenerRangoSufijoTexto,
    htmlFraseFinalCompletada
  };
});
