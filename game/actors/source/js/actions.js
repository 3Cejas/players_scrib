let delay_animacion;
let isFullscreen = false;
let letra = "";

document.addEventListener('keydown', function (event) {
  const key = event.key;

  if (key === 'ArrowUp') {
      event.preventDefault();
      smoothScrollBy(-50); // Ajusta este valor según la cantidad de desplazamiento deseado
  } else if (key === 'ArrowDown') {
      event.preventDefault();
      smoothScrollBy(50); // Ajusta este valor según la cantidad de desplazamiento deseado
  }
});

function obtenerElementoPantallaCompletaActor() {
  return document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || document.msFullscreenElement
    || null;
}

function solicitarPantallaCompletaActor() {
  const root = document.documentElement;
  const request = root.requestFullscreen
    || root.webkitRequestFullscreen
    || root.mozRequestFullScreen
    || root.msRequestFullscreen;
  if (typeof request === "function") {
    return request.call(root);
  }
  return null;
}

function salirPantallaCompletaActor() {
  const exit = document.exitFullscreen
    || document.webkitExitFullscreen
    || document.mozCancelFullScreen
    || document.msExitFullscreen;
  if (typeof exit === "function") {
    return exit.call(document);
  }
  return null;
}

function actualizarBotonPantallaCompletaActor() {
  const boton = document.getElementById("actor_fullscreen_toggle");
  const activo = Boolean(obtenerElementoPantallaCompletaActor());
  isFullscreen = activo;
  if (!boton) return;
  boton.textContent = activo ? "\u274C Salir pantalla completa" : "\u{1F5A5}\uFE0F Pantalla completa";
  boton.setAttribute("aria-label", activo ? "Salir de pantalla completa" : "Activar pantalla completa");
  boton.title = activo ? "Salir de pantalla completa" : "Pantalla completa";
  boton.classList.toggle("actor-fullscreen-toggle--active", activo);
}

function alternarPantallaCompletaActor(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const resultado = obtenerElementoPantallaCompletaActor()
    ? salirPantallaCompletaActor()
    : solicitarPantallaCompletaActor();
  if (resultado && typeof resultado.catch === "function") {
    resultado.catch(() => {}).finally(actualizarBotonPantallaCompletaActor);
  } else {
    setTimeout(actualizarBotonPantallaCompletaActor, 0);
  }
  if (typeof texto1 !== "undefined" && texto1 && typeof texto1.focus === "function") {
    texto1.focus();
  }
}

function inicializarBotonPantallaCompletaActor() {
  const boton = document.getElementById("actor_fullscreen_toggle");
  if (!boton) return;
  boton.addEventListener("click", alternarPantallaCompletaActor);
  actualizarBotonPantallaCompletaActor();
}

document.addEventListener("fullscreenchange", actualizarBotonPantallaCompletaActor);
document.addEventListener("webkitfullscreenchange", actualizarBotonPantallaCompletaActor);
document.addEventListener("mozfullscreenchange", actualizarBotonPantallaCompletaActor);
document.addEventListener("MSFullscreenChange", actualizarBotonPantallaCompletaActor);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarBotonPantallaCompletaActor, { once: true });
} else {
  inicializarBotonPantallaCompletaActor();
}

const smoothScrollBy = window.ScribRuntime.smoothScrollBy;

//Función auxiliar para crear las animaciones del feedback.
const animateCSS = window.ScribRuntime.animateCSS;

//Función auxiliar que envía una palabra al servidor.
function enviarPalabra() {
  if(palabra.value != '' && palabra.value != null){
    const palabraNormalizada = normalizarTextoParaCompararLetra(palabra.value);
    const letraObjetivo = normalizarTextoParaCompararLetra(letra);
    const contieneLetraObjetivo = Boolean(letraObjetivo) && palabraNormalizada.includes(letraObjetivo);
    if(
      (modo_actual == "letra prohibida" && !contieneLetraObjetivo) ||
      (modo_actual == "letra bendita" && contieneLetraObjetivo) ||
      modo_actual == "palabras bonus"
    ){
    inspiracion = palabra.value.trim();
    socket.emit('enviar_inspiracion', inspiracion);
    palabra.value = "";
    recordatorio.innerHTML = "<span style='color: green;'>Has mandado una inspiración.</span>";
    animateCSS(".recordatorio", "flash")
    }
    else{
      recordatorio.innerHTML = "<span style='color: red;'>Recuerda que la palabra debe serle útil.</span>";
      animateCSS(".recordatorio", "flash")
    }
  }
}

//Función auxiliar que muestra el texto completo del jugador en cuestión.
function mostrarTextoCompleto(boton) {
  if(boton.value == 0){
  texto1.style.height = "auto";
  texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
  texto1.scrollTop = texto1.scrollHeight;
  boton.innerHTML = "Ocultar texto";
  boton.value = 1;
  nombre1.scrollIntoView({behavior: "smooth", block: "begin"});
  }
  else{
  texto1.style.height = "";
  texto1.rows =  "3";
  texto1.scrollTop = texto1.scrollHeight;
  boton.innerHTML = "Mostrar texto completo";
  boton.value = 0;
  }
}

function toNormalForm(str) {
  return str
      .normalize("NFD")
      .replace(
          /([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,
          "$1"
      )
      .normalize("NFC");
}

function normalizarTextoParaCompararLetra(str) {
  return toNormalForm(String(str || "").toLowerCase());
}
