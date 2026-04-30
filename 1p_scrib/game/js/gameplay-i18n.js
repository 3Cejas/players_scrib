function traducirTextoJuego1P(clave, variables = {}, fallback = "") {
  if (typeof window.scrib1pT === "function") {
    return window.scrib1pT(clave, variables, fallback);
  }
  return fallback || clave;
}

function formatearConteoPalabrasJuego1P(valor) {
  if (typeof window.scrib1pFormatWordsCount === "function") {
    return window.scrib1pFormatWordsCount(valor);
  }
  const texto = String(valor ?? "").trim();
  if (!texto) return "0 palabras";
  if (/^-?\d+(?:[.,]\d+)?$/.test(texto)) return `${texto} palabras`;
  return texto;
}

function formatearSegundosJuego1P(valor, opciones = {}) {
  if (typeof window.scrib1pFormatSecs === "function") {
    return window.scrib1pFormatSecs(valor, opciones);
  }
  const numero = String(valor ?? "").trim();
  if (!numero) return "0 segs.";
  const signo = typeof opciones.signo === "string" ? opciones.signo : "";
  return `${signo}${numero} segs.`;
}

function traducirModoJuego1P(modoCanonical) {
  if (typeof window.scrib1pTranslateModeName === "function") {
    return window.scrib1pTranslateModeName(modoCanonical);
  }
  return String(modoCanonical || "").toUpperCase();
}

