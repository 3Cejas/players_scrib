// Estas funciones se ejecutan dentro de la página mediante Puppeteer.
// No crean feedback: conservan evidencias de nodos visibles que ya se mostraron.
function startInspirationFeedbackProbe(selector) {
  window.__scribE2EInspirationFeedback?.observer.disconnect();
  const root = document.querySelector("#feedback_tiempo_flotante_root");
  if (!root) throw new Error("Missing inspiration feedback root");
  const records = [];
  const seen = new WeakSet();
  const recordVisibleFeedback = () => {
    for (const node of document.querySelectorAll(selector)) {
      if (seen.has(node) || !node.isConnected || node.getBoundingClientRect().width <= 0) continue;
      const text = String(node.textContent || "").trim();
      if (!text) continue;
      seen.add(node);
      records.push({ inspiration: text, inspirationClass: node.className });
      if (records.length > 32) records.shift();
    }
  };
  const observer = new MutationObserver(recordVisibleFeedback);
  window.__scribE2EInspirationFeedback = { records, observer };
  observer.observe(root, { childList: true, subtree: true, characterData: true });
}

function readInspirationFeedbackProbe() {
  const records = window.__scribE2EInspirationFeedback?.records || [];
  if (records.some(({ inspiration }) => /undefined/i.test(inspiration))) {
    throw new Error(`Invalid inspiration feedback: ${JSON.stringify(records)}`);
  }
  return records.find(({ inspiration }) => /\+\d+(?:[.,]\d+)?\s*🎨/u.test(inspiration)) || false;
}

function stopInspirationFeedbackProbe() {
  window.__scribE2EInspirationFeedback?.observer.disconnect();
  delete window.__scribE2EInspirationFeedback;
}

module.exports = { startInspirationFeedbackProbe, readInspirationFeedbackProbe, stopInspirationFeedbackProbe };
