let borrado; // Variable que almacena el identificador de la función temporizada de borrado.
let rapidez_borrado = 3000; // Variable que almacena la velocidad del borrado del texto.
let rapidez_inicio_borrado = 3000; // Variable que almacena el tiempo de espera sin escribir hasta que empieza a borrar el texto.
let asignada = false; // Variable boolena que dice si hay una palabra bonus asignada.
let palabra_actual = ""; // Variable que almacena la palabra bonus actual.
let puntos_palabra = 0; // Variable que almacena los puntos obtenidos por meter palabras bonus.
let terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
let countInterval; // Variable que almacena el identificador de la función que será ejecutada cada x segundos para uso para actualizar el contador.
let cambio_palabra; // Variable que almacena el identificador de la función temporizada de cambio de palabra.
let blurreado = false; // Variable booleana que si alguno de los dos textos ha sido blurreado.
let puntuacion = 0; // Variable entera que almacena la puntuación de la palabra bonus.
let puntos = 0; // Puntos del jugador 1.
let delay_animacion;
let envio_puntos;
puntos_letra_prohibida = 0;
puntos_letra_bendita = 0;
//let saltos_línea_alineacion_1 = 0; // Variable entera que almacena los saltos de línea del jugador 1 para alínear los textos.
//let saltos_línea_alineacion_2 = 0; // Variable entera que almacena los saltos de línea del jugador 2 para alínear los textos.
const color_negativo = "red";
const color_positivo = "green";
let isFullscreen = false;
let menu_modificador = false;
let focusedButtonIndex = 0;
let modificadorButtons = [];

document.addEventListener('keydown', function(event) {
  if(event.key === "Backspace"){
    var delete_type = new Audio('../audio/delete.WAV');
    delete_type.play();
  }
  else{
    var audio_type = new Audio('../audio/type.WAV');
    audio_type.play();
  }
  if(event.key == 'Enter' && menu_modificador) {
      event.preventDefault();
      modificadorButtons[focusedButtonIndex].click();
      feedback1.innerHTML = modificadorButtons[focusedButtonIndex].innerHTML;
      clearTimeout(delay_animacion);
      animateCSS(".feedback1", "flash").then((message) => {
          delay_animacion = setTimeout(function () {
              feedback1.innerHTML = "";
          }, 2000);
      });
      modificadorButtons[focusedButtonIndex].style.display = "none";
      id_mod = modificadorButtons[focusedButtonIndex].id
      socket.emit('enviar_feedback_modificador', {id_mod, player});
      modificadorButtons.splice(focusedButtonIndex, 1);
      focusedButtonIndex = 0;
      console.log(modificadorButtons)
      menu_modificador = false;
      texto1.focus();
  }
  if (event.key == 'Tab') {
    console.log(modificadorButtons)
    event.preventDefault();
    focusedButtonIndex = 0;
    if(modificadorButtons.length == 0) {
      texto1.focus()
    }
    else{
    menu_modificador = true;
    console.log(modificadorButtons)
    modificadorButtons[focusedButtonIndex].blur();
    modificadorButtons[focusedButtonIndex].focus();
    }
  } else if (menu_modificador && ['ArrowRight', 'ArrowLeft'].includes(event.key)) {
    if (event.key == 'ArrowRight' && menu_modificador) {
      focusedButtonIndex = (focusedButtonIndex + 1) % modificadorButtons.length;
    } else if(event.key == 'ArrowLeft' && menu_modificador){
      focusedButtonIndex = (focusedButtonIndex + modificadorButtons.length - 1) % modificadorButtons.length;
    }
    
    modificadorButtons[focusedButtonIndex].focus();
  }
});
document.addEventListener('click', function(event) {
  texto1.focus();
  console.log(menu_modificador);
  if(menu_modificador == false || modificadorButtons.length == 0) {
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
      texto1.focus();
    }
  }
}
});

// Función que aumenta de tamaño el texto del jugador 1 cuando el jugador 1 escribe cualquier carácter en el texto.
function auto_grow(element) {
    element.style.height = "5px";
    element.style.height = element.scrollHeight + "px";
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
      while (texto2.scrollHeight > texto1.scrollHeight) {
        saltos_línea_alineacion_1 += 1;
        texto1.value = "\n" + texto1.value;
      }
      texto1.style.height = texto2.scrollHeight + "px";
      texto2.style.height = texto2.scrollHeight + "px";
    } else {
      while (texto2.scrollHeight < texto1.scrollHeight) {
        saltos_línea_alineacion_2 += 1;
        texto2.value = "\n" + texto2.value;
      }
      texto1.style.height = texto1.scrollHeight + "px";
      texto2.style.height = texto1.scrollHeight + "px";
    }*/
    texto1.style.height = texto1.scrollHeight + "px";
    texto2.style.height = texto2.scrollHeight + "px";
    //window.scrollTo(0, document.body.scrollHeight);
    focalizador1.scrollIntoView({ block: "end" });
}

// Función que comienza a borrar el texto con una velocidad y un inicio variable a lo largo de cada ronda.
function borrar(texto) {
    if (!desactivar_borrar) {
        texto1.value = texto.value.substring(0, texto1.value.length - 1);
        puntos = texto1.value.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
        cambiar_color_puntuación()
        puntos1.innerHTML = puntos + " puntos";
        sendText();
        cambio_nivel(puntos);
        borrado = setTimeout(() => {
            borrar(texto);
        }, rapidez_borrado);
    }
}

//Función que modifica el comportamiento del juego.
function countChars(texto) {
    puntos = texto.value.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
    cambiar_color_puntuación();
    puntos1.innerHTML = puntos + " puntos";
    cambio_nivel(puntos);
    clearTimeout(borrado);
    var $div = $('#texto');
    borrado = setTimeout(function () {
        borrar(texto);
    }, rapidez_inicio_borrado);
}

//Función auxiliar que, dado un string, lo devuelve en su forma normal, es decir, sin acentos, diéresis y similares.
function toNormalForm(str) {
    return str
        .normalize("NFD")
        .replace(
            /([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,
            "$1"
        );
}

//Función auxiliar que cambia la rapidez y el inicio de borrado en función de la cantidad de caracteres escritos.
function cambio_nivel(caracteres) {
    if (0 <= caracteres && caracteres < 250) {
        nivel1.innerHTML = "nivel 0";
        if(!borrado_cambiado){
          rapidez_inicio_borrado = 3000;
          rapidez_borrado = 3000;
        }
    }
    if (250 <= caracteres && caracteres < 500) {
        nivel1.innerHTML = "nivel 1";
        if(!borrado_cambiado){
          rapidez_inicio_borrado = 2500;
          rapidez_borrado = 2500;
        }
    }
    if (500 <= caracteres && caracteres < 750) {
        nivel1.innerHTML = "nivel 2";
        if(!borrado_cambiado){
          rapidez_borrado = 1800;
          rapidez_inicio_borrado = 1800;
        }
    }
    if (750 <= caracteres && caracteres < 1000) {
        nivel1.innerHTML = "nivel 3";
        if(!borrado_cambiado){
          rapidez_borrado = 1200;
          rapidez_inicio_borrado = 1200;
        }
    }
    if (caracteres >= 1000) {
        nivel1.innerHTML = "nivel 4";
        if(!borrado_cambiado){
          rapidez_borrado = 500;
          rapidez_inicio_borrado = 500;
        }
    }
}

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