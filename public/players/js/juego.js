let delay_animacion;
let isFullscreen = false;
let letra = "";
const LIMITE_PALABRAS = 3;

window.addEventListener('beforeunload', (event) => {
  socket.emit('disconnect');
});


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

//Función auxiliar que envía una palabra al servidor.
function enviarPalabra() {
  if(palabra.value != '' && palabra.value != null){
    if((modo_actual == "letra prohibida" && !toNormalForm(palabra.value.toLowerCase()).includes(letra)) || (modo_actual == "letra bendita" && toNormalForm(palabra.value.toLowerCase()).includes(letra)) || modo_actual == "palabras bonus" || modo_actual == "palabras prohibidas" ||  letra == 'ñ' && palabra.value.toLowerCase().includes('ñ') || letra == 'n' && modo_actual == "letra prohibida" && palabra.value.toLowerCase().includes('ñ') && !palabra.value.toLowerCase().includes(letra)){
    if(conteo_palabras < LIMITE_PALABRAS){
      inspiracion = palabra.value.trim();
      socket.emit('enviar_inspiracion', inspiracion);
      palabra.value = "";
      conteo_palabras++;
      conteo.innerHTML = conteo_palabras + "/"+ LIMITE_PALABRAS + " palabras"
      recordatorio.innerHTML = "<span style='color: green;'>Has mandado una inspiración.</span>";
      animateCSS(".recordatorio", "flash")
    }
    else if(conteo_palabras >= LIMITE_PALABRAS){
      recordatorio.innerHTML = "<span style='color: red;'>No puedes enviar más palabras.</span>";
      animateCSS(".recordatorio", "flash")
    }

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
  mostrar_texto.scrollIntoView({behavior: "smooth", block: "start"});
  }
  else{
  texto1.style.height = "";
  texto1.rows =  "3";
  texto1.scrollTop = texto1.scrollHeight;
  boton.innerHTML = "Mostrar texto completo";
  boton.value = 0;
  }
}

function elegir_ventaja_publico(boton) {
  console.log("Elegida ventaja " + boton.value);
  voto = boton.value;
  socket.emit('enviar_voto_ventaja', voto);
  recordatorio.innerHTML = "<span style='color: green;'>Has votado por la ventaja " + voto + ".</span>";
  votando = false;
  sincro = 0;
  socket.emit('pedir_nombre');
}

function elegir_repentizado_publico(boton) {
  console.log("Elegido repentizado: " + boton.value);
  voto = boton.value;
  socket.emit('enviar_voto_repentizado', voto);
  recordatorio.innerHTML = "<span style='color: green;'>Se hará tu destino, <span style='color: orange;'>Musa</span>.</span>";
  votando = false;
  sincro = 0;
  socket.emit('pedir_nombre');
}

function toNormalForm(str) {
  return str
      .normalize("NFD")
      .replace(
          /([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,
          "$1"
      );
}
