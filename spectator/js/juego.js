let delay_animacion;
let isFullscreen = false;

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

function smoothScrollBy(value) {
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
    // We create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        node.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve("Animation ended");
        }
        node.addEventListener("animationend", handleAnimationEnd, { once: true });
    });
