let delay_animacion;
let delay_animacion_cabecera;
let isFullscreen = false;
const permitirScrollManualEspectador = false;

document.addEventListener('keydown', function (event) {
  if (!permitirScrollManualEspectador) return;
  const key = event.key;

  if (key === 'ArrowUp') {
      event.preventDefault();
      smoothScrollBy(-50); // Ajusta este valor segÃºn la cantidad de desplazamiento deseado
  } else if (key === 'ArrowDown') {
      event.preventDefault();
      smoothScrollBy(50); // Ajusta este valor segÃºn la cantidad de desplazamiento deseado
  }
});

const smoothScrollBy = window.ScribRuntime.smoothScrollBy;

document.addEventListener('click', function(event) {
  if (event.button === 0) {
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
      isFullscreen = false;
    } else {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      }
      isFullscreen = true;
    }
  }
});

//FunciÃ³n auxiliar para crear las animaciones del feedback.
const animateCSS = window.ScribRuntime.animateCSS;

