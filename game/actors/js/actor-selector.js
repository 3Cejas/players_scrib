// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);

const botonEscritxr1 = document.getElementById("escritxr1");
const botonEscritxr2 = document.getElementById("escritxr2");
const nombreEscritxr1 = botonEscritxr1 ? botonEscritxr1.querySelector(".actor-select-name") : null;
const nombreEscritxr2 = botonEscritxr2 ? botonEscritxr2.querySelector(".actor-select-name") : null;

function actualizarNombreEscritxrActor(target, fallback, nombreRecibido) {
    const nombre = (typeof nombreRecibido === "string" ? nombreRecibido.trim() : "") || fallback;
    if (target) {
        target.textContent = nombre;
    }
}

socket.on('nombre1', (nombre) => {
    actualizarNombreEscritxrActor(nombreEscritxr1, "ESCRITXR 1", nombre);
});

// Recibe el nombre del jugador 2 y lo coloca en su sitio.
socket.on('nombre2', (nombre) => {
    actualizarNombreEscritxrActor(nombreEscritxr2, "ESCRITXR 2", nombre);
});
