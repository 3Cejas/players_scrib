(function initScribRuntime(global) {
    const runtime = global.ScribRuntime || {};

    function resolveElement(element) {
        if (typeof element === "string") {
            return document.querySelector(element);
        }
        return element || null;
    }

    function animateCSS(element, animation, prefix = "animate__") {
        return new Promise((resolve) => {
            const node = resolveElement(element);
            if (!node || !node.classList) {
                resolve("Animation skipped");
                return;
            }

            const animationName = `${prefix}${animation}`;
            node.classList.add(`${prefix}animated`, animationName);

            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    }

    function smoothScrollBy(value, behavior = "smooth") {
        window.scrollBy({
            top: value,
            behavior
        });
    }

    function onSocket(socket, eventName, handler) {
        if (!socket || typeof socket.off !== "function" || typeof socket.on !== "function") {
            return;
        }
        socket.off(eventName, handler);
        socket.on(eventName, handler);
    }

    global.ScribRuntime = {
        ...runtime,
        animateCSS,
        smoothScrollBy,
        onSocket
    };
})(window);
