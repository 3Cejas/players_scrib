let delay_animacion;
let delay_animacion_recordatorio;
let isFullscreen = false;
let letra = "";
let editando = false;
let interval_cooldown;
let cooldown = false;
let agitado_activo = false;
let agitado_permiso = false;
let agitado_solicitado = false;
let agitado_ultimo = 0;
let agitado_ultimo_cambio = 0;
let agitado_ultima_direccion = 0;
let agitado_vibracion_habilitada = false;
let agitado_ultimo_lateral = null;
let agitado_ultimo_gamma = null;
let agitado_picos = 0;
let agitado_inicio_ventana = 0;
let agitado_ultimo_pico = 0;
let agitado_ultimo_motion = 0;
let agitado_prev_ax = null;
let agitado_prev_ay = null;
let agitado_prev_az = null;

const AGITADO_THRESHOLD_X = 7;
const AGITADO_CAMBIO_MS = 600;
const AGITADO_COOLDOWN_MS = 1200;
const AGITADO_VIBRACION = [60, 40, 60];
const AGITADO_VIBRACION_FALLBACK = 120;
const AGITADO_DELTA_THRESHOLD = 3.4;
const AGITADO_GAMMA_THRESHOLD = 12;
const AGITADO_ROT_THRESHOLD = 22;
const AGITADO_PICOS_MIN = 2;
const AGITADO_PICO_GAP_MS = 80;
const AGITADO_VENTANA_MS = 900;

const obtenerVibracion = () => {
  const vibrateFn = navigator && (navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate);
  return typeof vibrateFn === "function" ? vibrateFn.bind(navigator) : null;
};

const aplicarVibracion = (vibrateFn, patron) => {
  try {
    const resultado = vibrateFn(patron);
    if (resultado === false && patron !== AGITADO_VIBRACION_FALLBACK) {
      vibrateFn(AGITADO_VIBRACION_FALLBACK);
    }
  } catch (error) {
    try {
      vibrateFn(AGITADO_VIBRACION_FALLBACK);
    } catch (errorFallback) {}
  }
};

const pedirPermisoMovimiento = () => {
  if (agitado_solicitado) return Promise.resolve(agitado_permiso);
  agitado_solicitado = true;
  const permisos = [];
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
    permisos.push(DeviceMotionEvent.requestPermission());
  }
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    permisos.push(DeviceOrientationEvent.requestPermission());
  }
  if (permisos.length) {
    return Promise.all(permisos)
      .then((resultados) => {
        agitado_permiso = resultados.every((estado) => estado === "granted");
        return agitado_permiso;
      })
      .catch(() => false);
  }
  agitado_permiso = true;
  return Promise.resolve(true);
};

const vibrarAgitado = () => {
  const vibrateFn = obtenerVibracion();
  if (!vibrateFn || !agitado_vibracion_habilitada) return;
  aplicarVibracion(vibrateFn, AGITADO_VIBRACION);
};

const emitirCorazon = () => {
  const ahora = Date.now();
  if (agitado_ultimo && (ahora - agitado_ultimo) < AGITADO_COOLDOWN_MS) return;
  agitado_ultimo = ahora;
  vibrarAgitado();
  if (typeof socket !== "undefined" && socket && typeof socket.emit === "function") {
    socket.emit("musa_corazon");
  }
};

const registrarAgitado = (delta, threshold) => {
  const ahora = Date.now();
  const umbral = threshold ?? AGITADO_DELTA_THRESHOLD;
  if (delta < umbral) return;
  if (agitado_ultimo_pico && (ahora - agitado_ultimo_pico) < AGITADO_PICO_GAP_MS) return;
  if (!agitado_inicio_ventana || (ahora - agitado_inicio_ventana) > AGITADO_VENTANA_MS) {
    agitado_inicio_ventana = ahora;
    agitado_picos = 0;
  }
  agitado_ultimo_pico = ahora;
  agitado_picos += 1;
  if (agitado_picos >= AGITADO_PICOS_MIN) {
    agitado_picos = 0;
    agitado_inicio_ventana = 0;
    emitirCorazon();
  }
};

const manejarAgitado = (evento) => {
  const aceleracion = evento.accelerationIncludingGravity || evento.acceleration;
  const rotacion = evento.rotationRate || null;
  if (!aceleracion && !rotacion) return;
  const ax = aceleracion ? (Number(aceleracion.x) || 0) : 0;
  const ay = aceleracion ? (Number(aceleracion.y) || 0) : 0;
  const az = aceleracion ? (Number(aceleracion.z) || 0) : 0;
  const lateral = Math.abs(ax) >= Math.abs(ay) ? ax : ay;
  const ahora = Date.now();
  agitado_ultimo_motion = ahora;
  let direccion = 0;
  if (lateral > AGITADO_THRESHOLD_X) direccion = 1;
  else if (lateral < -AGITADO_THRESHOLD_X) direccion = -1;
  if (!direccion) return;
  if (!agitado_ultima_direccion) {
    agitado_ultima_direccion = direccion;
    agitado_ultimo_cambio = ahora;
    agitado_ultimo_lateral = lateral;
    return;
  }
  if (direccion !== agitado_ultima_direccion) {
    if (agitado_ultimo_cambio && (ahora - agitado_ultimo_cambio) < AGITADO_CAMBIO_MS) {
      const deltaLateral = agitado_ultimo_lateral == null ? Math.abs(lateral) : Math.abs(lateral - agitado_ultimo_lateral);
      registrarAgitado(deltaLateral);
    }
    agitado_ultimo_cambio = ahora;
    agitado_ultima_direccion = direccion;
    agitado_ultimo_lateral = lateral;
  }
  if (agitado_prev_ax != null) {
    const deltaAcc = Math.abs(ax - agitado_prev_ax) + Math.abs(ay - agitado_prev_ay) + Math.abs(az - agitado_prev_az);
    registrarAgitado(deltaAcc, AGITADO_DELTA_THRESHOLD);
  }
  agitado_prev_ax = ax;
  agitado_prev_ay = ay;
  agitado_prev_az = az;

  if (rotacion) {
    const rotAlpha = Math.abs(Number(rotacion.alpha) || 0);
    const rotBeta = Math.abs(Number(rotacion.beta) || 0);
    const rotGamma = Math.abs(Number(rotacion.gamma) || 0);
    const deltaRot = rotAlpha + rotBeta + rotGamma;
    registrarAgitado(deltaRot, AGITADO_ROT_THRESHOLD);
  }
};

const manejarOrientacion = (evento) => {
  if (typeof evento.gamma !== "number") return;
  const ahora = Date.now();
  agitado_ultimo_motion = ahora;
  const gamma = evento.gamma;
  if (agitado_ultimo_gamma != null) {
    const delta = Math.abs(gamma - agitado_ultimo_gamma);
    registrarAgitado(delta, AGITADO_GAMMA_THRESHOLD);
  }
  agitado_ultimo_gamma = gamma;
};

const activarAgitado = () => {
  if (agitado_activo) return;
  pedirPermisoMovimiento().then((ok) => {
    if (!ok || agitado_activo) return;
    agitado_ultima_direccion = 0;
    agitado_ultimo_cambio = 0;
    agitado_ultimo_lateral = null;
    agitado_ultimo_gamma = null;
    agitado_picos = 0;
    agitado_inicio_ventana = 0;
    agitado_ultimo_pico = 0;
    agitado_prev_ax = null;
    agitado_prev_ay = null;
    agitado_prev_az = null;
    window.addEventListener("devicemotion", manejarAgitado, { passive: true });
    window.addEventListener("deviceorientation", manejarOrientacion, { passive: true });
    agitado_activo = true;
  });
};

const desactivarAgitado = () => {
  if (!agitado_activo) return;
  window.removeEventListener("devicemotion", manejarAgitado);
  window.removeEventListener("deviceorientation", manejarOrientacion);
  agitado_activo = false;
  agitado_ultima_direccion = 0;
  agitado_ultimo_cambio = 0;
  agitado_ultimo_lateral = null;
  agitado_ultimo_gamma = null;
  agitado_picos = 0;
  agitado_inicio_ventana = 0;
  agitado_ultimo_pico = 0;
  agitado_prev_ax = null;
  agitado_prev_ay = null;
  agitado_prev_az = null;
  agitado_vibracion_habilitada = false;
};

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
      inspiracion = palabra.value.trim().split(/\s+/)[0];
      socket.emit('enviar_inspiracion', {
        palabra: inspiracion,
        nombre: window.nombre_musa || ""
      });
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

// Función para activar/desactivar la pantalla
  
  function bandera(boton) {
    const overlay = document.getElementById('overlay');
    if (boton.value == 0) {
        overlay.style.display = 'flex';
        
        if (player == 1) {
            // Aplicar animación azul para player 1
            overlay.style.backgroundColor = '';
            overlay.classList.remove('bright-pulse-background'); // Remueve si estaba activo
            overlay.classList.add('blue-pulse-background');
        } else if (player == 2) {
            // Aplicar animación roja para player 2
            overlay.style.backgroundColor = '';
            overlay.classList.remove('blue-pulse-background'); // Remueve si estaba activo
            overlay.classList.add('bright-pulse-background');
        }
        
        boton.value = 1;
        agitado_vibracion_habilitada = Boolean(obtenerVibracion());
        if (agitado_vibracion_habilitada) {
          vibrarAgitado();
        }
        activarAgitado();
    }
  }

  function desactivarPantalla() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    overlay.style.backgroundColor = '';
    overlay.classList.remove('bright-pulse-background');
    overlay.classList.remove('blue-pulse-background');

    const boton = document.getElementById('btn_bandera');
    if (boton) {
        boton.value = 0;
    }
    desactivarAgitado();
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
    socket.emit(texto_x, { text: texto1.innerText, points: puntos1.textContent});
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
