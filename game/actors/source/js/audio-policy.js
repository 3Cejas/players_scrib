(function aplicarPoliticaSilencioInterpretes() {
    window.SCRIB_AUDIO_DISABLED = true;

    const silenciarMedio = (medio) => {
        if (!medio || !(medio instanceof HTMLMediaElement)) return;
        medio.muted = true;
        medio.defaultMuted = true;
        medio.volume = 0;
        try { medio.pause(); } catch (_error) {}
    };

    const playOriginal = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function playSilenciadoInterprete() {
        silenciarMedio(this);
        return Promise.resolve();
    };

    const silenciarTodo = (raiz = document) => {
        if (raiz instanceof HTMLMediaElement) silenciarMedio(raiz);
        raiz.querySelectorAll?.("audio, video").forEach(silenciarMedio);
    };

    document.addEventListener("play", (evento) => silenciarMedio(evento.target), true);
    document.addEventListener("DOMContentLoaded", () => silenciarTodo(), { once: true });
    new MutationObserver((cambios) => {
        cambios.forEach((cambio) => cambio.addedNodes.forEach((nodo) => {
            if (nodo && nodo.nodeType === Node.ELEMENT_NODE) silenciarTodo(nodo);
        }));
    }).observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener("pagehide", () => {
        silenciarTodo();
        HTMLMediaElement.prototype.play = playOriginal;
    }, { once: true });
}());
