// Importamos las variables de configuración
import { SERVER_URL_PROD, SERVER_URL_DEV } from '../../config.js';

// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = window.location.href.startsWith('file:')
    ? SERVER_URL_DEV
    : SERVER_URL_PROD;

const socket = io(serverUrl);

escritxr1 = document.getElementById("escritxr1");
escritxr2 = document.getElementById("escritxr2");

socket.on('nombre1', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR 1";
    escritxr1.innerHTML = "✍️ " + nombre;
});

// Recibe el nombre del jugador 2 y lo coloca en su sitio.
socket.on('nombre2', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR 2";
    escritxr2.innerHTML = "✍️ " + nombre;
});