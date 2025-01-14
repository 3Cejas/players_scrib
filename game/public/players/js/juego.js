let delay_animacion;
let delay_animacion_recordatorio;
let isFullscreen = false;
let letra = "";
let editando = false;
let interval_cooldown;
let cooldown = false;

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
function enviarPalabra(button) {
  if(cooldown || palabra.value == '' || palabra.value == null ){
    text_progress.classList.add('disabled-click-feedback');
    
    // Opcional: remover la clase después de que la animación se complete
    setTimeout(function() {
      text_progress.classList.remove('disabled-click-feedback');
    }, 500); // Coincide con la duración de la animación
  }
  else{
  if(palabra.value != '' && palabra.value != null){
    if((modo_actual == "letra prohibida" && !toNormalForm(palabra.value.toLowerCase()).includes(letra)) || (modo_actual == "letra bendita" && toNormalForm(palabra.value.toLowerCase()).includes(letra)) || modo_actual == "palabras bonus" || modo_actual == "palabras prohibidas" ||  letra == 'ñ' && palabra.value.toLowerCase().includes('ñ') || letra == 'n' && modo_actual == "letra prohibida" && palabra.value.toLowerCase().includes('ñ') && !palabra.value.toLowerCase().includes(letra)){
      startProgress(button);
      inspiracion = palabra.value.trim();
      socket.emit('enviar_inspiracion', inspiracion);
      palabra.value = "";
      recordatorio.innerHTML = "<span style='color: green;'>Has mandado una inspiración.</span>";
      animateCSS(".recordatorio", "flash").then(() => {
        delay_animacion_recordatorio = setTimeout(function () {
        recordatorio.innerHTML = "";
        }, 1200);
    });
    }
    else{
      recordatorio.innerHTML = "<span style='color: red;'>Recuerda que la palabra debe serle útil.</span>";
      animateCSS(".recordatorio", "flash").then(() => {
        delay_animacion_recordatorio = setTimeout(function () {
        recordatorio.innerHTML = "";
        }, 1200);
    });
    }
  }
}
}

//Función auxiliar que muestra el texto completo del jugador en cuestión.
function mostrarTextoCompleto(boton) {
  if (boton.value == 0) {
    texto1.style.maxHeight = "none";
    texto1.style.height = texto1.scrollHeight + "px"; // Reajustamos el tamaño del área de texto.
    texto1.scrollTop = texto1.scrollHeight;
    
    // Cambiar el color del botón a verde en lugar de cambiar su texto
    boton.style.backgroundColor = "green";
    
    boton.value = 1;
    mostrar_texto.scrollIntoView({ behavior: "smooth", block: "start" });
  } 
  else if (!editando == true) {
    console.log("ACTIVADO");
    texto1.style.height = "4.5em"; /* Alto para tres líneas de texto */
    texto1.scrollTop = texto1.scrollHeight;
    
    // Cambiar el color del botón a rojo en lugar de cambiar su texto
    boton.style.backgroundColor = "red";
    
    boton.value = 0;
  }
}

// Variables para la detección de shake
let lastX = null, lastY = null, lastZ = null;
let lastTime = new Date();
const shakeThreshold = 15;  // Ajusta este valor según la sensibilidad deseada

function handleShake(event) {
  // Opcional: detectar si es móvil según ancho de pantalla
  if (window.innerWidth >= 768) return;

  let acceleration = event.accelerationIncludingGravity;
  let currentTime = new Date();
  let timeDifference = currentTime.getTime() - lastTime.getTime();

  // Procesar cada 100ms para no saturar los cálculos
  if (timeDifference > 100) {
      if (lastX !== null && lastY !== null && lastZ !== null) {
          let deltaX = Math.abs(acceleration.x - lastX);
          let deltaY = Math.abs(acceleration.y - lastY);
          let deltaZ = Math.abs(acceleration.z - lastZ);

          let totalChange = deltaX + deltaY + deltaZ;

          if (totalChange > shakeThreshold) {
              navigator.vibrate(200); // Vibra durante 200ms
          }
      }
      lastX = acceleration.x;
      lastY = acceleration.y;
      lastZ = acceleration.z;
      lastTime = currentTime;
  }
}


// Función para activar/desactivar la pantalla
function bandera(boton) {
  const overlay = document.getElementById('overlay');
  if (boton.value == 0) {
      // Activar la pantalla y cambiar el color en función del player
      overlay.style.display = 'flex';
      if (player == 1) {
          overlay.style.backgroundColor = 'blue';
      } else if (player == 2) {
          overlay.style.backgroundColor = 'red';
      }
      boton.value = 1; // Cambiar el estado del botón

      // Verificar compatibilidad y agregar listener para detección de agitación
      if ('DeviceMotionEvent' in window && 'vibrate' in navigator) {
          window.addEventListener('devicemotion', handleShake);
      } else {
          console.log("El dispositivo no soporta la detección de movimiento o la vibración.");
      }
  }
}


function desactivarPantalla() {
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'none';
  // Remover el listener de movimiento si ya no se necesita
  window.removeEventListener('devicemotion', handleShake);
  // Aquí puedes restablecer el estado del botón u otras acciones...
}


//Función auxiliar que muestra el texto completo del jugador en cuestión.
function editar(boton) {
  if(boton.value == 0){
    editando = true;
    mostrar_texto.value = 0;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable= "true";
    boton.innerHTML = "✉️";
    boton.value = 1;
  }
  else{
    texto1.style.height = "";
    editando = false;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable = "false";
    socket.emit('aumentar_tiempo', {secs:-1, player});
    socket.emit(texto_x, { text: texto1.innerText, points: puntos1.textContent, level: nivel1.textContent});
    boton.innerHTML = "✏️";
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

function onMouseEnter() {
  text_progress.style.color = 'black';
}

function onMouseLeave() {
  text_progress.style.color = 'white';
}


function startProgress(button) {
  cooldown = true;
  text_progress.innerHTML = "Inspirando..."
  console.log("INSPIRANDO", text_progress.innerHTML, text_progress)
  text_progress.style.color = "white";
  text_progress.addEventListener('mouseenter', onMouseEnter);
  text_progress.addEventListener('mouseleave', onMouseLeave);
  let progress = 0;
  //button.disabled = true; // Deshabilitar el botón durante la carga
  button.querySelector('.progress')
  console.log("limite", LIMITE_TIEMPO_INSPIRACION)
  // Calcular el intervalo y el incremento basado en LIMITE_TIEMPO
  const incrementoPorIntervalo = 100; // Queremos llegar a 100%
  const intervalo = (LIMITE_TIEMPO_INSPIRACION * 1000) / incrementoPorIntervalo; // Calcula el intervalo en milisegundos
  console.log(button.disabled)
  interval_cooldown = setInterval(() => {
      progress += 1; // Incrementa el progreso por 1%
      bar_progress.style.width = `${progress}%`; // Actualiza el ancho del elemento de progreso
      console.log(bar_progress.style.width)
    if (progress >= 100) {
      clearInterval(interval_cooldown); // Detiene el intervalo
      setTimeout(() => {
          limpiar_colddown();
          cooldown = false;
      }, 1000); // Restablece el progreso después de un tiempo
    }
  }, intervalo); // Usa el intervalo calculado para el temporizador
}

