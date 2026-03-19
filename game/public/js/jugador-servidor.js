// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);
const escapeHtmlMusa = (valor) => String(valor)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

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
const MUSA_BOOT_SESSION_KEY = "scrib_musa_boot_transition";
const MUSA_BOOT_DURACION_MS = 6200;
const MUSA_BOOT_REDIRECT_DELAY_MS = 700;
let musaBootFrameId = null;
let musaBootRedirectTimeout = null;

function restablecerBotonesInspirar() {
  musaSeleccionBloqueada = false;
  document.body.classList.remove("musa-eleccion-hecha");
  document.body.classList.remove("musa-boot-activa");
  const botones = document.querySelectorAll(".intro-choice-btn");
  botones.forEach((boton) => boton.classList.remove("intro-choice-btn--disabled"));
  const overlay = document.getElementById("musa_boot_overlay");
  if (overlay) {
    overlay.classList.remove("is-active", "musa-boot-overlay--azul", "musa-boot-overlay--rojo");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--boot-bar-progress", "0%");
    overlay.style.setProperty("--boot-world-progress", "0%");
  }
  if (musaBootFrameId) {
    cancelAnimationFrame(musaBootFrameId);
    musaBootFrameId = null;
  }
  if (musaBootRedirectTimeout) {
    clearTimeout(musaBootRedirectTimeout);
    musaBootRedirectTimeout = null;
  }
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

function puedeAvanzarDesdeSeccionNombre() {
  const secciones = Array.from(document.querySelectorAll(".intro-section"));
  const actual = secciones[obtenerIndiceSeccionActual()];
  if (!actual || actual.id !== "intro-nombre") {
    return true;
  }
  const nombre = normalizarNombreMusa(nombre_musa_input?.value || "");
  if (nombre) {
    return true;
  }
  mostrarAvisoMusa("Tu nombre necesita al menos 1 letra y maximo 10 caracteres.");
  if (nombre_musa_input) {
    nombre_musa_input.focus();
  }
  return false;
}

function cerrarTeclado() {
  const activo = document.activeElement;
  if (!activo) return;
  if (activo.tagName === "INPUT" || activo.tagName === "TEXTAREA" || activo.isContentEditable) {
    activo.blur();
  }
}

function renderizarLogsCargaMusa(logs, indiceActivo) {
  const lista = document.getElementById("musa_boot_logs");
  if (!lista) return;
  const items = Array.from(lista.querySelectorAll("li"));
  items.forEach((item, indice) => {
    item.innerHTML = logs[indice] || "";
    item.classList.toggle("is-active", indice === indiceActivo);
    item.classList.toggle("is-done", indice < indiceActivo);
  });
}

function iniciarCargaMusa(playerId, nombre, destinoNombre) {
  const overlay = document.getElementById("musa_boot_overlay");
  if (!overlay) {
    return false;
  }

  const equipoRojo = Number(playerId) === 2;
  const teamClass = equipoRojo ? "musa-boot-overlay--rojo" : "musa-boot-overlay--azul";
  const teamNameClass = equipoRojo ? "musa-boot-name--rojo" : "musa-boot-name--azul";
  const teamLabel = equipoRojo ? "ROJO" : "AZUL";
  const escrituraDestino = (destinoNombre || `ESCRITXR ${playerId}`).trim().toUpperCase();
  const musaHtml = `<span class="musa-boot-name musa-boot-name--musa">${escapeHtmlMusa(nombre)}</span>`;
  const escritoraHtml = `<span class="musa-boot-name ${teamNameClass}">${escapeHtmlMusa(escrituraDestino)}</span>`;
  const estado = document.getElementById("musa_boot_status");
  const porcentaje = document.getElementById("musa_boot_percent");
  const copy = document.getElementById("musa_boot_copy");
  const pixelNodes = Array.from(document.querySelectorAll("#musa_boot_pixels span"));
  const logs = [
    `ENLAZANDO A ${musaHtml}`,
    `SINCRONIZANDO PLUMA ${teamLabel}`,
    `CARGANDO IMAGINARIO DE ${escritoraHtml}`,
    "PINTANDO EL COLOR DEL MUNDO",
    "ABRIENDO PORTAL DE INSPIRACION"
  ];
  const estados = [
    "ENLAZANDO CANAL DE INSPIRACION",
    "SINCRONIA DE SISTEMA ESTABLE",
    "COMPILANDO EL NUEVO MUNDO",
    "VOLCANDO COLOR Y ATMOSFERA",
    "ACCESO AUTORIZADO"
  ];
  const umbrales = [0.12, 0.34, 0.56, 0.79, 0.96];
  const duracionMs = MUSA_BOOT_DURACION_MS;
  const destino = `./players/index.html?player=${playerId}&name=${encodeURIComponent(nombre)}`;
  const bootReducidoMovil = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const intervaloPintadoMs = bootReducidoMovil ? 96 : 0;
  let ultimoPintadoBoot = -Infinity;

  if (copy) {
    copy.innerHTML = `${musaHtml} ha elegido apoyar a ${escritoraHtml}. Preparando la entrada al mundo de juego.`;
  }

  overlay.classList.remove("musa-boot-overlay--azul", "musa-boot-overlay--rojo");
  overlay.classList.add(teamClass, "is-active");
  overlay.setAttribute("aria-hidden", "false");
  overlay.style.setProperty("--boot-bar-progress", "0%");
  overlay.style.setProperty("--boot-world-progress", "0%");
  pixelNodes.forEach((pixel) => pixel.classList.remove("is-on"));
  renderizarLogsCargaMusa(logs, 0);
  document.body.classList.add("musa-boot-activa");

  try {
    sessionStorage.setItem(MUSA_BOOT_SESSION_KEY, JSON.stringify({
      playerId: Number(playerId),
      nombre,
      destinoNombre: escrituraDestino,
      ts: Date.now()
    }));
  } catch (_error) {}

  const inicio = performance.now();
  const paso = (ahora) => {
    const progreso = Math.min((ahora - inicio) / duracionMs, 1);
    if (intervaloPintadoMs && progreso < 1 && (ahora - ultimoPintadoBoot) < intervaloPintadoMs) {
      musaBootFrameId = requestAnimationFrame(paso);
      return;
    }
    const easing = 1 - Math.pow(1 - progreso, 3);
    const pct = Math.round(easing * 100);
    let idxActivo = umbrales.findIndex((umbral) => progreso <= umbral);
    if (idxActivo === -1) idxActivo = logs.length - 1;
    ultimoPintadoBoot = ahora;

    overlay.style.setProperty("--boot-bar-progress", `${pct}%`);
    overlay.style.setProperty("--boot-world-progress", `${Math.max(12, Math.round(easing * 100))}%`);
    if (porcentaje) porcentaje.textContent = `${pct}%`;
    if (estado) estado.textContent = estados[idxActivo] || estados[estados.length - 1];
    renderizarLogsCargaMusa(logs, idxActivo);

    const pixelsActivos = Math.round((pixelNodes.length || 0) * easing);
    pixelNodes.forEach((pixel, indice) => {
      pixel.classList.toggle("is-on", indice < pixelsActivos);
    });

    if (progreso < 1) {
      musaBootFrameId = requestAnimationFrame(paso);
      return;
    }

    musaBootFrameId = null;
    renderizarLogsCargaMusa(logs, logs.length);
    if (estado) estado.textContent = "MUNDO CARGADO";
    if (porcentaje) porcentaje.textContent = "100%";
    musaBootRedirectTimeout = setTimeout(() => {
      window.location.href = destino;
    }, MUSA_BOOT_REDIRECT_DELAY_MS);
  };

  musaBootFrameId = requestAnimationFrame(paso);
  return true;
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
  const destinoNombre = playerId === 2
    ? (escritxr2?.textContent || "ESCRITXR 2")
    : (escritxr1?.textContent || "ESCRITXR 1");
  const destino = `./players/index.html?player=${playerId}&name=${encodeURIComponent(nombre)}&escritxr=${encodeURIComponent(destinoNombre)}`;
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
    const SWIPE_MIN_DISTANCIA_Y = 48;
    const SWIPE_MAX_DESVIO_X = 140;
    const SWIPE_MAX_DURACION_MS = 900;
    let touchInicioY = null;
    let touchInicioX = null;
    let touchInicioTs = 0;
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
    contenedorScroll.addEventListener("touchstart", (evento) => {
      const destino = evento.target;
      if (destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA" || destino.isContentEditable)) {
        touchInicioY = null;
        touchInicioX = null;
        touchInicioTs = 0;
        return;
      }
      const touch = evento.changedTouches && evento.changedTouches[0];
      if (!touch) return;
      touchInicioY = touch.clientY;
      touchInicioX = touch.clientX;
      touchInicioTs = Date.now();
    }, { passive: true });
    contenedorScroll.addEventListener("touchend", (evento) => {
      if (!Number.isFinite(touchInicioY) || !Number.isFinite(touchInicioX) || !touchInicioTs) {
        return;
      }
      const touch = evento.changedTouches && evento.changedTouches[0];
      const inicioY = touchInicioY;
      const inicioX = touchInicioX;
      const inicioTs = touchInicioTs;
      touchInicioY = null;
      touchInicioX = null;
      touchInicioTs = 0;
      if (!touch) return;
      const deltaY = touch.clientY - inicioY;
      const deltaX = touch.clientX - inicioX;
      const duracion = Date.now() - inicioTs;
      const esSwipeVertical = Math.abs(deltaY) >= SWIPE_MIN_DISTANCIA_Y
        && Math.abs(deltaY) > Math.abs(deltaX)
        && Math.abs(deltaX) <= SWIPE_MAX_DESVIO_X
        && duracion <= SWIPE_MAX_DURACION_MS;
      if (!esSwipeVertical) return;
      if (deltaY < 0) {
        if (!puedeAvanzarDesdeSeccionNombre()) {
          return;
        }
        irASeccionPorDelta(1);
        return;
      }
      irASeccionPorDelta(-1);
    }, { passive: true });
    contenedorScroll.addEventListener("touchcancel", () => {
      touchInicioY = null;
      touchInicioX = null;
      touchInicioTs = 0;
    }, { passive: true });
    document.addEventListener("keydown", (evento) => {
      const teclas = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      const esEnter = evento.key === "Enter";
      if (!teclas.includes(evento.key) && !esEnter) return;
      const destino = evento.target;
      if (destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA" || destino.isContentEditable)) {
        return;
      }
      if ((evento.key === "ArrowDown" || esEnter) && !puedeAvanzarDesdeSeccionNombre()) {
        return;
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
