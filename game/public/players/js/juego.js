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
let agitado_aviso_timeout = null;
let bandera_bloqueada_por_control = false;

const AGITADO_THRESHOLD_X = 7;
const AGITADO_CAMBIO_MS = 600;
const AGITADO_COOLDOWN_MS = 1200;
const AGITADO_VIBRACION = 320;
const AGITADO_VIBRACION_FALLBACK = 460;
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
  if (!vibrateFn || !agitado_vibracion_habilitada) {
    if (!vibrateFn) {
      mostrarAvisoMotion("Este navegador no permite vibracion.");
    }
    return;
  }
  aplicarVibracion(vibrateFn, AGITADO_VIBRACION);
};

const mostrarAvisoMotion = (texto) => {
  const elemento = document.getElementById("motion_permiso");
  if (!elemento) return;
  elemento.textContent = texto || "";
  elemento.style.display = texto ? "block" : "none";
};

const limpiarAvisoMotion = () => {
  mostrarAvisoMotion("");
};

const programarAvisoMotion = () => {
  if (agitado_aviso_timeout) {
    clearTimeout(agitado_aviso_timeout);
  }
  agitado_aviso_timeout = setTimeout(() => {
    if (!agitado_activo) return;
    if (!agitado_ultimo_motion || (Date.now() - agitado_ultimo_motion) > 1500) {
      mostrarAvisoMotion("Si no vibra, habilita sensores y vibracion en permisos del navegador.");
    }
  }, 2000);
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
  limpiarAvisoMotion();
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
  limpiarAvisoMotion();
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
    if (!ok || agitado_activo) {
      if (!ok) {
        mostrarAvisoMotion("Permite sensores de movimiento para activar la vibracion.");
      }
      return;
    }
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
    agitado_ultimo_motion = 0;
    window.addEventListener("devicemotion", manejarAgitado, { passive: true });
    window.addEventListener("deviceorientation", manejarOrientacion, { passive: true });
    agitado_activo = true;
    programarAvisoMotion();
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
  agitado_ultimo_motion = 0;
  if (agitado_aviso_timeout) {
    clearTimeout(agitado_aviso_timeout);
    agitado_aviso_timeout = null;
  }
  limpiarAvisoMotion();
};

window.addEventListener('beforeunload', (event) => {
  socket.emit('disconnect');
});


document.addEventListener('keydown', function (event) {
  const key = event.key;

  if (key === 'ArrowUp') {
      event.preventDefault();
      smoothScrollBy(-50); // Ajusta este valor segÃºn la cantidad de desplazamiento deseado
  } else if (key === 'ArrowDown') {
      event.preventDefault();
      smoothScrollBy(50); // Ajusta este valor segÃºn la cantidad de desplazamiento deseado
  }
});

function smoothScrollBy(value) {
  window.scrollBy({
      top: value,
      behavior: 'smooth'
  });
}

//FunciÃ³n auxiliar para crear las animaciones del feedback.
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

//FunciÃ³n auxiliar que envÃ­a una palabra al servidor.
function enviarPalabra(button) {
  if (cooldown || palabra.value == '' || palabra.value == null) {
    text_progress.classList.add('disabled-click-feedback');
    setTimeout(function () {
      text_progress.classList.remove('disabled-click-feedback');
    }, 500);
    return;
  }

  if (palabra.value != '' && palabra.value != null) {
    const inspiracionTexto = String(palabra.value || "").trim();
    const inspiracionMinus = inspiracionTexto.toLowerCase();
    if (/\s/.test(inspiracionTexto)) {
      recordatorio.innerHTML = "<span style='color: red;'>No se permiten espacios en la inspiracion.</span>";
      animateCSS(".recordatorio", "flash").then(() => {
        delay_animacion_recordatorio = setTimeout(function () {
          recordatorio.innerHTML = "";
        }, 1200);
      });
      return;
    }
    if ((modo_actual == "letra prohibida" && !toNormalForm(inspiracionMinus).includes(letra)) || (modo_actual == "letra bendita" && toNormalForm(inspiracionMinus).includes(letra)) || modo_actual == "palabras bonus" || modo_actual == "palabras prohibidas" || letra == 'Ã±' && inspiracionMinus.includes('Ã±') || letra == 'n' && modo_actual == "letra prohibida" && inspiracionMinus.includes('Ã±') && !inspiracionMinus.includes(letra)) {
      startProgress(button);
      socket.emit('enviar_inspiracion', {
        palabra: inspiracionTexto,
        nombre: window.nombre_musa || ""
      });
      palabra.value = "";
      recordatorio.innerHTML = "<span style='color: green;'>Has mandado una inspiracion.</span>";
      animateCSS(".recordatorio", "flash").then(() => {
        delay_animacion_recordatorio = setTimeout(function () {
          recordatorio.innerHTML = "";
        }, 1200);
      });
    } else {
      recordatorio.innerHTML = "<span style='color: red;'>Recuerda que la palabra debe serle util.</span>";
      animateCSS(".recordatorio", "flash").then(() => {
        delay_animacion_recordatorio = setTimeout(function () {
          recordatorio.innerHTML = "";
        }, 1200);
      });
    }
  }
}

// Actualiza el estado visual del toggle de texto completo.
function actualizarEstadoTextoCompleto(boton, activo) {
  boton.classList.toggle("is-on", activo);
  boton.setAttribute("aria-pressed", activo ? "true" : "false");
  boton.dataset.estado = activo ? "ON" : "OFF";
  if (typeof texto1 !== "undefined" && texto1 && texto1.classList) {
    texto1.classList.toggle("textarea--completa", Boolean(activo));
  }
}

//FunciÃ³n auxiliar que muestra el texto completo del jugador en cuestiÃ³n.
function mostrarTextoCompleto(boton) {
  if (boton.value == 0) {
    texto1.style.maxHeight = "none";
    texto1.style.height = texto1.scrollHeight + "px"; // Reajustamos el tamaÃ±o del Ã¡rea de texto.
    texto1.scrollTop = texto1.scrollHeight;

    actualizarEstadoTextoCompleto(boton, true);
    boton.value = 1;
    mostrar_texto.scrollIntoView({ behavior: "smooth", block: "start" });
  } 
  else if (!editando == true) {
    console.log("ACTIVADO");
    texto1.style.height = "4.5em"; /* Alto para tres lÃ­neas de texto */
    texto1.scrollTop = texto1.scrollHeight;

    actualizarEstadoTextoCompleto(boton, false);
    boton.value = 0;
  }
}

// FunciÃ³n para activar/desactivar la pantalla
  
  function actualizarBloqueoBanderaControl(bloqueada) {
    bandera_bloqueada_por_control = Boolean(bloqueada);
    const botonVolver = document.getElementById('btn_volver');
    if (botonVolver) {
      botonVolver.style.display = bandera_bloqueada_por_control ? 'none' : '';
    }
  }

  function aplicarEstadoBanderasControl(payload = {}) {
    const activa = Boolean(payload && payload.activa);
    const bloqueada = activa && Boolean(payload && payload.bloqueado_por_control);
    actualizarBloqueoBanderaControl(bloqueada);
    const boton = document.getElementById('btn_bandera');
    if (!boton) return;
    if (activa) {
      // Forzamos activaciÃ³n para evitar estados desincronizados del botÃ³n local.
      boton.value = 0;
      bandera(boton, { forzadoControl: true, forzar: true });
      return;
    }
    desactivarPantalla({ forzadoControl: true });
  }

    window.aplicarEstadoBanderasControl = aplicarEstadoBanderasControl;

  // Durante el calentamiento puede ocultarse el contenedor de acciones (o crear un stacking context),
  // y el #overlay queda invisible aunque se active. Para evitarlo, â€œportalizamosâ€ el overlay al <body>
  // cuando se usa la bandera, de modo que no dependa del contenedor original.
  function asegurarOverlayBanderaVisible() {
    const overlay = document.getElementById('overlay');
    if (!overlay) return null;

    // Movemos el overlay al body una Ãºnica vez para que no quede dentro de un contenedor oculto.
    if (document.body && overlay.parentElement !== document.body) {
      if (!overlay.dataset.portalizadoBandera) {
        overlay.dataset.portalizadoBandera = '1';
      }
      document.body.appendChild(overlay);
    }

    // Refuerzo visual para que siempre quede por encima, independientemente del CSS del calentamiento.
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100dvh';
    overlay.style.zIndex = '2147483647';

    return overlay;
  }

  function bandera(boton, _opciones = {}) {
    const forzar = Boolean(_opciones && _opciones.forzar);
    const overlay = asegurarOverlayBanderaVisible();
    if (!overlay) return;
    if (boton.value == 0 || forzar) {
        overlay.style.display = 'flex';
        const equipo = Number(player);
        overlay.classList.remove('bright-pulse-background');
        overlay.classList.remove('blue-pulse-background');
        if (equipo === 2) {
            // Aplicar animaciÃ³n roja para player 2
            overlay.style.backgroundColor = '#991010';
            overlay.classList.add('bright-pulse-background');
        } else {
            // Aplicar animaciÃ³n azul para player 1 y fallback para valores desconocidos
            overlay.style.backgroundColor = '#1b4fb8';
            overlay.classList.add('blue-pulse-background');
        }
        
        boton.value = 1;
        agitado_vibracion_habilitada = Boolean(obtenerVibracion());
        if (!agitado_vibracion_habilitada) {
          mostrarAvisoMotion("Activa vibracion del sistema para notar el gesto.");
        }
        if (agitado_vibracion_habilitada) {
          vibrarAgitado();
        }
        mostrarAvisoMotion("Agita el movil para enviar corazones.");
        activarAgitado();
    }
  }

  function desactivarPantalla(opciones = {}) {
    const forzadoControl = Boolean(opciones && opciones.forzadoControl);
    if (bandera_bloqueada_por_control && !forzadoControl) {
      return;
    }
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    overlay.style.backgroundColor = '';
    overlay.classList.remove('bright-pulse-background');
    overlay.classList.remove('blue-pulse-background');

    const boton = document.getElementById('btn_bandera');
    if (boton) {
        boton.value = 0;
    }
    if (forzadoControl) {
      actualizarBloqueoBanderaControl(false);
    }
    desactivarAgitado();
    limpiarAvisoMotion();
  }

//FunciÃ³n auxiliar que muestra el texto completo del jugador en cuestiÃ³n.
function editar(boton) {
  if(boton.value == 0){
    editando = true;
    mostrar_texto.value = 0;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable= "true";
    boton.innerHTML = "âœ‰ï¸";
    boton.value = 1;
  }
  else{
    texto1.style.height = "";
    editando = false;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable = "false";
    socket.emit('aumentar_tiempo', {secs:-1, player});
    socket.emit(texto_x, { text: texto1.innerText, points: puntos1.textContent});
    boton.innerHTML = "âœï¸";
    boton.value = 0;
  }
}

function elegir_ventaja_publico(boton) {
  console.log("Elegida ventaja " + boton.value);
  voto = boton.value;
  socket.emit('enviar_voto_ventaja', voto);
  window.dispatchEvent(new CustomEvent('musa_voto_ventaja_emitido', { detail: { voto } }));
  votando = false;
  sincro = 0;
  socket.emit('pedir_nombre');
}

function elegir_repentizado_publico(boton) {
  console.log("Elegido repentizado: " + boton.value);
  voto = boton.value;
  socket.emit('enviar_voto_repentizado', voto);
  recordatorio.innerHTML = "<span style='color: green;'>Se harÃ¡ tu destino, <span style='color: orange;'>Musa</span>.</span>";
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
  text_progress.style.color = '';
}


function startProgress(button) {
  cooldown = true;
  text_progress.innerHTML = "&#x1F680; Inspirando..."
  console.log("INSPIRANDO", text_progress.innerHTML, text_progress)
  text_progress.style.color = "white";
  text_progress.addEventListener('mouseenter', onMouseEnter);
  text_progress.addEventListener('mouseleave', onMouseLeave);
  let progress = 0;
  //button.disabled = true; // Deshabilitar el botÃ³n durante la carga
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
      }, 1000); // Restablece el progreso despuÃ©s de un tiempo
    }
  }, intervalo); // Usa el intervalo calculado para el temporizador
}

