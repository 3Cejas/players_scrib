// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);

escritxr1 = document.getElementById("escritxr1");
escritxr2 = document.getElementById("escritxr2");
const nombre_musa_input = document.getElementById("nombre_musa");
const mensaje_musa = document.getElementById("mensaje_musa");
const musa_nombre_titulos = document.querySelectorAll(".intro-musa-nombre");
const intro_scroll = document.querySelector(".intro-scroll");
const MAX_NOMBRE_MUSA = 10;
const REGEX_NOMBRE_MUSA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$/;
const REGEX_LETRA_MUSA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
let musaSeleccionBloqueada = false;

function restablecerBotonesInspirar() {
  musaSeleccionBloqueada = false;
  document.body.classList.remove("musa-eleccion-hecha");
  const botones = document.querySelectorAll(".intro-choice-btn");
  botones.forEach((boton) => boton.classList.remove("intro-choice-btn--disabled"));
}

function normalizarNombreMusa(valor) {
  if (typeof valor !== "string") return "";
  const limpio = valor.trim().slice(0, MAX_NOMBRE_MUSA);
  if (!limpio) return "";
  if (!REGEX_NOMBRE_MUSA.test(limpio)) return "";
  if (!REGEX_LETRA_MUSA.test(limpio)) return "";
  return limpio.toUpperCase();
}

function mostrarAvisoMusa(texto) {
  if (!mensaje_musa) return;
  mensaje_musa.textContent = texto;
  mensaje_musa.classList.add("activa");
}

function limpiarAvisoMusa() {
  if (!mensaje_musa) return;
  mensaje_musa.textContent = "";
  mensaje_musa.classList.remove("activa");
}

function actualizarNombreIntro() {
  if (!musa_nombre_titulos || !musa_nombre_titulos.length) return;
  const nombre = normalizarNombreMusa(nombre_musa_input?.value || "");
  musa_nombre_titulos.forEach((titulo) => {
    titulo.textContent = nombre || "MUSA";
  });
}

function scrollToSeccion(objetivo) {
  if (!objetivo) return;
  if (!intro_scroll) {
    objetivo.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const inicio = intro_scroll.scrollTop;
  const destino = objetivo.offsetTop;
  const distancia = destino - inicio;
  const duracion = 1200;
  let inicioTiempo = null;
  const animar = (marca) => {
    if (!inicioTiempo) inicioTiempo = marca;
    const progreso = Math.min((marca - inicioTiempo) / duracion, 1);
    const eased = 1 - Math.pow(1 - progreso, 3);
    intro_scroll.scrollTop = inicio + (distancia * eased);
    if (progreso < 1) {
      requestAnimationFrame(animar);
    }
  };
  requestAnimationFrame(animar);
}

function enfocarNombreSiCorresponde(objetivo) {
  if (!objetivo || !nombre_musa_input) return;
  if (objetivo.id !== "intro-nombre") return;
  setTimeout(() => {
    nombre_musa_input.focus({ preventScroll: true });
  }, 350);
}

function gestionarFocusNombre(actual, objetivo) {
  if (!nombre_musa_input) return;
  if (actual && actual.id === "intro-nombre" && (!objetivo || objetivo.id !== "intro-nombre")) {
    cerrarTeclado();
  }
  if (objetivo && objetivo.id === "intro-nombre") {
    enfocarNombreSiCorresponde(objetivo);
  }
}

function obtenerIndiceSeccionActual() {
  if (!intro_scroll) return 0;
  const secciones = Array.from(document.querySelectorAll(".intro-section"));
  if (!secciones.length) return 0;
  const referencia = intro_scroll.scrollTop + (intro_scroll.clientHeight * 0.35);
  let indice = 0;
  secciones.forEach((seccion, idx) => {
    if (seccion.offsetTop <= referencia) {
      indice = idx;
    }
  });
  return indice;
}

function irASeccionPorDelta(delta) {
  const secciones = Array.from(document.querySelectorAll(".intro-section"));
  if (!secciones.length) return;
  const actual = obtenerIndiceSeccionActual();
  const siguiente = Math.min(Math.max(actual + delta, 0), secciones.length - 1);
  if (siguiente === actual) return;
  const actualSeccion = secciones[actual];
  const destino = secciones[siguiente];
  gestionarFocusNombre(actualSeccion, destino);
  scrollToSeccion(destino);
}

function cerrarTeclado() {
  const activo = document.activeElement;
  if (!activo) return;
  if (activo.tagName === "INPUT" || activo.tagName === "TEXTAREA" || activo.isContentEditable) {
    activo.blur();
  }
}

function entrarComoMusa(playerId) {
  if (musaSeleccionBloqueada) return;
  if (!nombre_musa_input) return;
  const nombre = normalizarNombreMusa(nombre_musa_input.value);
  if (!nombre) {
    mostrarAvisoMusa("Tu nombre necesita al menos 1 letra y maximo 10 caracteres.");
    nombre_musa_input.focus();
    return;
  }
  limpiarAvisoMusa();
  musaSeleccionBloqueada = true;
  document.body.classList.add("musa-eleccion-hecha");
  const botones = document.querySelectorAll(".intro-choice-btn");
  botones.forEach((boton) => boton.classList.add("intro-choice-btn--disabled"));
  const destino = `./players/index.html?player=${playerId}&name=${encodeURIComponent(nombre)}`;
  window.location.href = destino;
}

window.entrarComoMusa = entrarComoMusa;

socket.on('nombre1', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR 1";
    escritxr1.innerHTML = nombre;
});

// Recibe el nombre del jugador 2 y lo coloca en su sitio.
socket.on('nombre2', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR 2";
    escritxr2.innerHTML = nombre;
});

document.addEventListener('DOMContentLoaded', () => {
  restablecerBotonesInspirar();
  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "nombre_musa") {
    mostrarAvisoMusa("Tu nombre necesita al menos 1 letra y maximo 10 caracteres.");
    const seccionNombre = document.getElementById("intro-nombre");
    if (seccionNombre) {
      scrollToSeccion(seccionNombre);
    }
    if (nombre_musa_input) {
      setTimeout(() => nombre_musa_input.focus(), 350);
    }
  }
  if (nombre_musa_input) {
    nombre_musa_input.addEventListener("input", () => {
      if (normalizarNombreMusa(nombre_musa_input.value)) {
        limpiarAvisoMusa();
      }
      actualizarNombreIntro();
    });
    nombre_musa_input.addEventListener("keydown", (evento) => {
      if (evento.key !== "Enter") return;
      evento.preventDefault();
      const nombre = normalizarNombreMusa(nombre_musa_input.value);
      if (!nombre) {
        mostrarAvisoMusa("Tu nombre necesita al menos 1 letra y maximo 10 caracteres.");
        nombre_musa_input.focus();
        return;
      }
      limpiarAvisoMusa();
      actualizarNombreIntro();
      cerrarTeclado();
      const objetivo = document.querySelector("#intro-equipo-azul");
      scrollToSeccion(objetivo);
    });
  }
  actualizarNombreIntro();
  const botonesScroll = document.querySelectorAll("[data-scroll-target]");
  botonesScroll.forEach((boton) => {
    boton.addEventListener("click", () => {
      const selector = boton.getAttribute("data-scroll-target");
      if (!selector) return;
      if (boton.dataset.validate === "nombre_musa") {
        const nombre = normalizarNombreMusa(nombre_musa_input?.value || "");
        if (!nombre) {
          mostrarAvisoMusa("Tu nombre necesita al menos 1 letra y maximo 10 caracteres.");
          if (nombre_musa_input) {
            nombre_musa_input.focus();
          }
          return;
        }
        limpiarAvisoMusa();
        actualizarNombreIntro();
      }
      const objetivo = document.querySelector(selector);
      const secciones = Array.from(document.querySelectorAll(".intro-section"));
      const actual = secciones[obtenerIndiceSeccionActual()];
      gestionarFocusNombre(actual, objetivo);
      scrollToSeccion(objetivo);
      const focusId = boton.getAttribute("data-focus");
      if (focusId) {
        const foco = document.getElementById(focusId);
        if (foco) {
          setTimeout(() => foco.focus(), 350);
        }
      }
    });
  });
  const contenedorScroll = document.querySelector(".intro-scroll");
  if (contenedorScroll) {
    const bloquearScroll = (evento) => {
      const destino = evento.target;
      if (destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA" || destino.isContentEditable)) {
        return;
      }
      evento.preventDefault();
    };
    contenedorScroll.addEventListener("wheel", bloquearScroll, { passive: false });
    contenedorScroll.addEventListener("touchmove", bloquearScroll, { passive: false });
    const esTactil = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (esTactil) {
      document.addEventListener("touchmove", bloquearScroll, { passive: false, capture: true });
    }
    document.addEventListener("keydown", (evento) => {
      const teclas = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      const esEnter = evento.key === "Enter";
      if (!teclas.includes(evento.key) && !esEnter) return;
      const destino = evento.target;
      if (destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA" || destino.isContentEditable)) {
        return;
      }
      if ((evento.key === "ArrowDown" || esEnter)) {
        const secciones = Array.from(document.querySelectorAll(".intro-section"));
        const actual = secciones[obtenerIndiceSeccionActual()];
        if (actual && actual.id === "intro-nombre") {
          const nombre = normalizarNombreMusa(nombre_musa_input?.value || "");
          if (!nombre) {
            mostrarAvisoMusa("Tu nombre necesita al menos 1 letra y maximo 10 caracteres.");
            if (nombre_musa_input) {
              nombre_musa_input.focus();
            }
            return;
          }
        }
      }
      evento.preventDefault();
      if (evento.key === "ArrowDown" || esEnter) {
        irASeccionPorDelta(1);
        return;
      }
      if (evento.key === "ArrowUp") {
        irASeccionPorDelta(-1);
      }
    });
  }
  // Pedimos los atributos al servidor
  socket.emit('pedir_atributos');

  socket.on('recibir_atributos', (data) => {
    console.log('Recibidos atributos:', data);
    // data tiene forma: { "1": {fuerza, agilidad, destreza}, "2": { ... } }
    const attrs = data || {};
    const LIMITE_PUNTOS = 10;

    // Seleccionamos los grupos de puntos por jugador y atributo
    const grupos = document.querySelectorAll('.intro-skill-points[data-player][data-attr]');

    grupos.forEach((grupo) => {
      const jugadorId = grupo.dataset.player;
      const atributo = grupo.dataset.attr;
      if (!jugadorId || !atributo) return;

      let valor = 0;
      if (attrs[jugadorId] && typeof attrs[jugadorId][atributo] !== 'undefined') {
        valor = Number(attrs[jugadorId][atributo]) || 0;
      }
      const puntos = grupo.querySelectorAll('.intro-skill-point');
      const limite = puntos.length || LIMITE_PUNTOS;
      valor = Math.max(0, Math.min(limite, valor));
      puntos.forEach((punto, indice) => {
        punto.classList.toggle('filled', indice < valor);
      });

      grupo.setAttribute('aria-label', `${atributo}: ${valor} de ${limite}`);
    });
  });
});

window.addEventListener("pageshow", () => {
  restablecerBotonesInspirar();
});
