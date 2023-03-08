let delay_animacion;
let isFullscreen = false;

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

//let saltos_línea_alineacion_1 = 0; // Variable entera que almacena los saltos de línea del jugador 1 para alínear los textos.
//let saltos_línea_alineacion_2 = 0; // Variable entera que almacena los saltos de línea del jugador 2 para alínear los textos.

// Función que aumenta de tamaño el texto del jugador 2 cuando el jugador 2 escribe cualquier carácter en el texto.
/*function auto_grow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight) + "px";
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.value = "\n" + texto1.value;
        }
        texto1.style.height = (texto2.scrollHeight) + "px";
        texto2.style.height = (texto2.scrollHeight) + "px";
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value
        }
        texto1.style.height = (texto1.scrollHeight) + "px";
        texto2.style.height = (texto1.scrollHeight) + "px";
    }
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = (texto2.scrollHeight) + "px";
    focalizador.scrollIntoView(false);

}*/
