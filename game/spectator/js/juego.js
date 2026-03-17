let delay_animacion;
let delay_animacion_cabecera;
let isFullscreen = false;
const permitirScrollManualEspectador = false;

document.addEventListener('keydown', function (event) {
  if (!permitirScrollManualEspectador) return;
  const key = event.key;

  if (key === 'ArrowUp') {
      event.preventDefault();
      smoothScrollBy(-50); // Ajusta este valor según la cantidad de desplazamiento deseado
  } else if (key === 'ArrowDown') {
      event.preventDefault();
      smoothScrollBy(50); // Ajusta este valor según la cantidad de desplazamiento deseado
  }
});

function smoothScrollBy(value) {
  if (!permitirScrollManualEspectador) return;
  window.scrollBy({
      top: value,
      behavior: 'smooth'
  });
}

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

//Función auxiliar para crear las animaciones del feedback.
const animateCSS = (element, animation, prefix = "animate__") =>
    new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        const node = typeof element === "string" ? document.querySelector(element) : element;

        if (!node || !node.classList) {
            resolve("Animation skipped");
            return;
        }

        node.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve("Animation ended");
        }

        node.addEventListener("animationend", handleAnimationEnd, { once: true });
    });
