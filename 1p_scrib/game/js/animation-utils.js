const animateCSS = (element, animation, prefix = "animate__") =>
    new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        if (!node) {
            resolve("Animation skipped");
            return;
        }

        const limpiarTiempoAnimacion = (valor) => {
            const texto = String(valor || "").trim().toLowerCase();
            if (!texto) return 0;
            if (texto.endsWith("ms")) return Number.parseFloat(texto) || 0;
            if (texto.endsWith("s")) return (Number.parseFloat(texto) || 0) * 1000;
            return Number.parseFloat(texto) || 0;
        };

        const obtenerDuracionAnimacionMs = () => {
            const estilosNodo = window.getComputedStyle(node);
            if (estilosNodo.display === "none" || estilosNodo.visibility === "hidden") {
                return 0;
            }
            const duraciones = String(estilosNodo.animationDuration || "0s").split(",").map(limpiarTiempoAnimacion);
            const retrasos = String(estilosNodo.animationDelay || "0s").split(",").map(limpiarTiempoAnimacion);
            const totalSegmentos = Math.max(duraciones.length, retrasos.length, 1);
            let maximo = 0;
            for (let i = 0; i < totalSegmentos; i += 1) {
                const duracion = duraciones[i] ?? duraciones[duraciones.length - 1] ?? 0;
                const retraso = retrasos[i] ?? retrasos[retrasos.length - 1] ?? 0;
                maximo = Math.max(maximo, duracion + retraso);
            }
            return maximo;
        };

        let resuelto = false;
        let fallbackTimer = null;

        const finalizar = (mensaje) => {
            if (resuelto) return;
            resuelto = true;
            if (fallbackTimer) {
                clearTimeout(fallbackTimer);
                fallbackTimer = null;
            }
            node.classList.remove(`${prefix}animated`, animationName);
            node.removeEventListener("animationend", handleAnimationEnd);
            resolve(mensaje);
        };

        function handleAnimationEnd(event) {
            event.stopPropagation();
            finalizar("Animation ended");
        }

        node.classList.add(`${prefix}animated`, animationName);
        node.addEventListener("animationend", handleAnimationEnd);

        requestAnimationFrame(() => {
            const duracionAnimacionMs = obtenerDuracionAnimacionMs();
            if (duracionAnimacionMs <= 0) {
                finalizar("Animation skipped");
                return;
            }
            fallbackTimer = setTimeout(() => {
                finalizar("Animation timeout");
            }, duracionAnimacionMs + 120);
        });
    });
