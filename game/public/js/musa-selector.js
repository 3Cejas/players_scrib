// Landing de musas: el servidor asigna el equipo de forma autoritativa.
const serverUrl = isProduction ? SERVER_URL_PROD : SERVER_URL_DEV;
const socket = io(serverUrl);
const musaAssignment = window.ScribMusaAssignment;
const nombreMusaInput = document.getElementById("nombre_musa");
const mensajeMusa = document.getElementById("mensaje_musa");
const musaNombreTitulos = document.querySelectorAll(".intro-musa-nombre");
const introScroll = document.querySelector(".intro-scroll");
const MAX_NOMBRE_MUSA = 10;
const REGEX_NOMBRE_MUSA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$/;
const REGEX_LETRA_MUSA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const REVEAL_MIN_MS = 1450;
const REVEAL_REDIRECT_MS = 4300;
const REVEAL_MIN_REDUCED_MS = 120;
const REVEAL_REDIRECT_REDUCED_MS = 1700;
let asignacionBloqueada = false;
let asignacionActual = null;
let nombrePendiente = "";
let estadoAsignacion = "ready";
let inicioSolicitudAsignacion = 0;
let revealTimeout = null;
let redirectTimeout = null;
let claveAvisoMusa = "";

const tMusa = (key, variables = {}, fallback = "") => (
  typeof window.scribT2P === "function"
    ? window.scribT2P(key, variables, fallback)
    : (fallback || key)
);

function normalizarNombreMusa(valor) {
  if (typeof valor !== "string") return "";
  const limpio = valor.trim().slice(0, MAX_NOMBRE_MUSA);
  if (!limpio || !REGEX_NOMBRE_MUSA.test(limpio) || !REGEX_LETRA_MUSA.test(limpio)) return "";
  return limpio.toUpperCase();
}

function usaMovimientoReducido() {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mostrarAvisoMusa(texto, claveI18n = "") {
  if (!mensajeMusa) return;
  claveAvisoMusa = texto ? claveI18n : "";
  mensajeMusa.textContent = texto;
  mensajeMusa.classList.toggle("activa", Boolean(texto));
}

function mensajeNombreInvalido() {
  return tMusa(
    "muse.assignment.name_error",
    {},
    "Tu nombre necesita al menos 1 letra y máximo 10 caracteres."
  );
}

function actualizarNombreIntro() {
  const nombre = normalizarNombreMusa(nombreMusaInput?.value || "");
  musaNombreTitulos.forEach((titulo) => {
    titulo.textContent = nombre || tMusa("ui.muse_label", {}, "MUSA").toUpperCase();
  });
}

function scrollToSeccion(objetivo) {
  if (!objetivo) return;
  if (!introScroll) {
    objetivo.scrollIntoView({ behavior: usaMovimientoReducido() ? "auto" : "smooth", block: "start" });
    return;
  }
  const inicio = introScroll.scrollTop;
  const destino = objetivo.offsetTop;
  const distancia = destino - inicio;
  const duracion = usaMovimientoReducido() ? 0 : 1200;
  if (!duracion) {
    introScroll.scrollTop = destino;
    return;
  }
  let inicioTiempo = null;
  const animar = (marca) => {
    if (!inicioTiempo) inicioTiempo = marca;
    const progreso = Math.min((marca - inicioTiempo) / duracion, 1);
    introScroll.scrollTop = inicio + (distancia * (1 - Math.pow(1 - progreso, 3)));
    if (progreso < 1) requestAnimationFrame(animar);
  };
  requestAnimationFrame(animar);
}

function enfocarNombreSiCorresponde(objetivo) {
  if (!objetivo || !nombreMusaInput || objetivo.id !== "intro-nombre") return;
  setTimeout(() => nombreMusaInput.focus({ preventScroll: true }), usaMovimientoReducido() ? 0 : 350);
}

function cerrarTeclado() {
  const activo = document.activeElement;
  if (activo && (activo.tagName === "INPUT" || activo.tagName === "TEXTAREA" || activo.isContentEditable)) {
    activo.blur();
  }
}

function gestionarFocusNombre(actual, objetivo) {
  if (!nombreMusaInput) return;
  if (actual && actual.id === "intro-nombre" && (!objetivo || objetivo.id !== "intro-nombre")) cerrarTeclado();
  enfocarNombreSiCorresponde(objetivo);
}

function obtenerIndiceSeccionActual() {
  if (!introScroll) return 0;
  const secciones = Array.from(document.querySelectorAll(".intro-section"));
  const referencia = introScroll.scrollTop + (introScroll.clientHeight * 0.35);
  let indice = 0;
  secciones.forEach((seccion, idx) => {
    if (seccion.offsetTop <= referencia) indice = idx;
  });
  return indice;
}

function irASeccionPorDelta(delta) {
  const secciones = Array.from(document.querySelectorAll(".intro-section"));
  if (!secciones.length) return;
  const actual = obtenerIndiceSeccionActual();
  const siguiente = Math.min(Math.max(actual + delta, 0), secciones.length - 1);
  if (siguiente === actual) return;
  gestionarFocusNombre(secciones[actual], secciones[siguiente]);
  scrollToSeccion(secciones[siguiente]);
}

function puedeAvanzarDesdeSeccionNombre() {
  const secciones = Array.from(document.querySelectorAll(".intro-section"));
  const actual = secciones[obtenerIndiceSeccionActual()];
  if (!actual || actual.id !== "intro-nombre") return true;
  if (normalizarNombreMusa(nombreMusaInput?.value || "")) return true;
  mostrarAvisoMusa(mensajeNombreInvalido(), "muse.assignment.name_error");
  nombreMusaInput?.focus();
  return false;
}

function limpiarTemporizadoresAsignacion() {
  if (revealTimeout) clearTimeout(revealTimeout);
  if (redirectTimeout) clearTimeout(redirectTimeout);
  revealTimeout = null;
  redirectTimeout = null;
}

function obtenerNombreEquipoVisible(asignacion) {
  if (!asignacion) return "";
  const key = asignacion.player === 2 ? "muse.assignment.team.red" : "muse.assignment.team.blue";
  return tMusa(key, {}, asignacion.teamName);
}

function obtenerTextoEstadoAsignacion() {
  if (estadoAsignacion === "connecting") {
    return tMusa("muse.assignment.status.connecting", {}, "Conectando con el juego…");
  }
  if (estadoAsignacion === "revalidating") {
    return tMusa("muse.assignment.status.revalidating", {}, "Reconectando y confirmando tu equipo…");
  }
  if (estadoAsignacion === "assigning") {
    return tMusa("muse.assignment.status.balancing", {}, "Equilibrando los equipos…");
  }
  if (estadoAsignacion === "error") {
    return tMusa("muse.assignment.status.error", {}, "No pudimos asignarte equipo. Inténtalo de nuevo.");
  }
  if (estadoAsignacion === "assigned" && asignacionActual) {
    const team = obtenerNombreEquipoVisible(asignacionActual);
    return tMusa(
      "muse.assignment.status.assigned",
      { team },
      `Asignación completada: ${team}.`
    );
  }
  return tMusa("muse.assignment.status.ready", {}, "Los equipos se mantendrán equilibrados automáticamente.");
}

function actualizarEstadoAsignacion() {
  const estado = document.getElementById("musa_assignment_status");
  const overlayEstado = document.getElementById("musa_boot_status");
  const texto = obtenerTextoEstadoAsignacion();
  if (estado) estado.textContent = texto;
  if (overlayEstado && estadoAsignacion !== "assigned") overlayEstado.textContent = texto;
}

function refrescarTextosAsignacion() {
  if (typeof window.scribApplyLanguageDom2P === "function") window.scribApplyLanguageDom2P();
  actualizarNombreIntro();
  actualizarEstadoAsignacion();
  if (asignacionActual) renderizarResultadoAsignacion(asignacionActual);
  if (claveAvisoMusa) mostrarAvisoMusa(tMusa(claveAvisoMusa), claveAvisoMusa);
}

function mostrarOverlayAsignacion() {
  const overlay = document.getElementById("musa_boot_overlay");
  if (!overlay) return;
  overlay.classList.remove("musa-boot-overlay--azul", "musa-boot-overlay--rojo", "is-revealed", "has-error");
  overlay.classList.add("is-active", "is-assigning");
  overlay.setAttribute("aria-hidden", "false");
  overlay.style.setProperty("--boot-bar-progress", "38%");
  document.body.classList.add("musa-boot-activa");
  const flujoIntro = document.querySelector(".intro-flow");
  if (flujoIntro) flujoIntro.inert = true;
  document.getElementById("musa_assignment_result")?.setAttribute("hidden", "");
  document.getElementById("musa_assignment_enter")?.setAttribute("hidden", "");
  document.getElementById("musa_assignment_retry")?.setAttribute("hidden", "");
  setTimeout(() => overlay.focus({ preventScroll: true }), usaMovimientoReducido() ? 0 : 180);
}

function invalidarRevelacionPorDesconexion() {
  limpiarTemporizadoresAsignacion();
  asignacionActual = null;
  musaAssignment.clearAssignmentSession(window.sessionStorage);
  mostrarOverlayAsignacion();
  const title = document.getElementById("musa_boot_title");
  const copy = document.getElementById("musa_boot_copy");
  if (title) title.textContent = tMusa("muse.assignment.revalidate_title", {}, "CONFIRMANDO TU EQUIPO");
  if (copy) copy.textContent = tMusa(
    "muse.assignment.revalidate_copy",
    {},
    "La conexión se interrumpió. Confirmaremos de nuevo tu asignación antes de entrar."
  );
}

function renderizarResultadoAsignacion(asignacion) {
  const team = document.getElementById("musa_assignment_team");
  const writer = document.getElementById("musa_assignment_writer");
  const copy = document.getElementById("musa_boot_copy");
  const teamName = obtenerNombreEquipoVisible(asignacion);
  if (team) team.textContent = teamName;
  if (writer) writer.textContent = asignacion.writer;
  if (copy) {
    copy.textContent = tMusa(
      "muse.assignment.reveal_copy",
      { team: teamName, writer: asignacion.writer },
      `Tu equipo: ${teamName}. Tu escritxr: ${asignacion.writer}.`
    );
  }
  const title = document.getElementById("musa_boot_title");
  if (title) title.textContent = tMusa("muse.assignment.reveal_title", {}, "¡EQUIPO ASIGNADO!");
}

function guardarAsignacionSesion(asignacion) {
  try {
    sessionStorage.setItem(musaAssignment.ASSIGNMENT_SESSION_KEY, JSON.stringify({
      ...asignacion,
      clientId: window.musa_client_id,
      name: nombrePendiente,
      revealedAt: Date.now()
    }));
  } catch (_error) {}
}

function construirDestinoJuego() {
  return musaAssignment.buildGameUrl(
    "./players/index.html",
    asignacionActual,
    nombrePendiente
  );
}

function entrarEnJuegoAsignado() {
  if (!asignacionActual) return;
  limpiarTemporizadoresAsignacion();
  const destino = construirDestinoJuego();
  if (destino) window.location.assign(destino);
}

function revelarAsignacion(asignacion) {
  asignacionActual = asignacion;
  estadoAsignacion = "assigned";
  guardarAsignacionSesion(asignacion);
  const overlay = document.getElementById("musa_boot_overlay");
  const result = document.getElementById("musa_assignment_result");
  const enter = document.getElementById("musa_assignment_enter");
  if (overlay) {
    overlay.classList.remove(
      "is-assigning", "has-error",
      "musa-boot-overlay--azul", "musa-boot-overlay--rojo"
    );
    overlay.classList.add(asignacion.player === 2 ? "musa-boot-overlay--rojo" : "musa-boot-overlay--azul", "is-revealed");
    overlay.style.setProperty("--boot-bar-progress", "100%");
  }
  renderizarResultadoAsignacion(asignacion);
  actualizarEstadoAsignacion();
  result?.removeAttribute("hidden");
  enter?.removeAttribute("hidden");
  const overlayStatus = document.getElementById("musa_boot_status");
  if (overlayStatus) {
    overlayStatus.textContent = tMusa("muse.assignment.status.authorized", {}, "Equipo asignado · acceso autorizado");
  }
  const percent = document.getElementById("musa_boot_percent");
  if (percent) percent.textContent = "100%";
  setTimeout(() => enter?.focus({ preventScroll: true }), usaMovimientoReducido() ? 0 : 450);
  redirectTimeout = setTimeout(
    entrarEnJuegoAsignado,
    usaMovimientoReducido() ? REVEAL_REDIRECT_REDUCED_MS : REVEAL_REDIRECT_MS
  );
}

function manejarAsignacionRecibida(asignacion, meta = {}) {
  if (meta.updated && estadoAsignacion === "assigned" && asignacionActual) {
    limpiarTemporizadoresAsignacion();
    revelarAsignacion(asignacion);
    return;
  }
  if (meta.updated) {
    limpiarTemporizadoresAsignacion();
    estadoAsignacion = "assigning";
    const overlay = document.getElementById("musa_boot_overlay");
    overlay?.classList.remove("is-revealed", "musa-boot-overlay--azul", "musa-boot-overlay--rojo");
    overlay?.classList.add("is-assigning");
    document.getElementById("musa_assignment_result")?.setAttribute("hidden", "");
    document.getElementById("musa_assignment_enter")?.setAttribute("hidden", "");
    inicioSolicitudAsignacion = performance.now();
    actualizarEstadoAsignacion();
  }
  const transcurrido = performance.now() - inicioSolicitudAsignacion;
  const minimo = usaMovimientoReducido() ? REVEAL_MIN_REDUCED_MS : REVEAL_MIN_MS;
  revealTimeout = setTimeout(() => {
    revealTimeout = null;
    revelarAsignacion(asignacion);
  }, Math.max(0, minimo - transcurrido));
}

function manejarErrorAsignacion() {
  estadoAsignacion = "error";
  asignacionBloqueada = false;
  const overlay = document.getElementById("musa_boot_overlay");
  overlay?.classList.remove("is-assigning");
  overlay?.classList.add("has-error");
  document.getElementById("musa_assignment_retry")?.removeAttribute("hidden");
  actualizarEstadoAsignacion();
}

const coordinadorAsignacion = musaAssignment.createCoordinator({
  socket,
  onWaiting: (estado, meta = {}) => {
    if (meta.invalidated) invalidarRevelacionPorDesconexion();
    estadoAsignacion = estado;
    actualizarEstadoAsignacion();
  },
  onAssigned: manejarAsignacionRecibida,
  onError: manejarErrorAsignacion
});

function manejarMusaReemplazada() {
  if (window.__scribMusaReplacementInProgress) return;
  window.__scribMusaReplacementInProgress = true;
  limpiarTemporizadoresAsignacion();
  coordinadorAsignacion.destroy();
  musaAssignment.clearAssignmentSession(window.sessionStorage);
  window.musa_client_id = musaAssignment.rotateClientId(window.sessionStorage, { windowRef: window });
  try { socket.disconnect(); } catch (_error) {}
  window.location.replace("./index.html?notice=musa_reemplazada");
}

socket.on("musa_reemplazada", manejarMusaReemplazada);

function solicitarAsignacionMusa() {
  if (asignacionBloqueada) return;
  const nombre = normalizarNombreMusa(nombreMusaInput?.value || "");
  if (!nombre) {
    mostrarAvisoMusa(mensajeNombreInvalido(), "muse.assignment.name_error");
    nombreMusaInput?.focus();
    return;
  }
  mostrarAvisoMusa("");
  nombrePendiente = nombre;
  asignacionActual = null;
  asignacionBloqueada = true;
  inicioSolicitudAsignacion = performance.now();
  limpiarTemporizadoresAsignacion();
  mostrarOverlayAsignacion();
  coordinadorAsignacion.request({ clientId: window.musa_client_id, name: nombre });
}

function reintentarAsignacionMusa() {
  asignacionBloqueada = true;
  inicioSolicitudAsignacion = performance.now();
  mostrarOverlayAsignacion();
  coordinadorAsignacion.retry();
}

function restablecerVistaAsignacion() {
  limpiarTemporizadoresAsignacion();
  asignacionBloqueada = false;
  asignacionActual = null;
  estadoAsignacion = socket.connected ? "ready" : "connecting";
  const overlay = document.getElementById("musa_boot_overlay");
  if (overlay) {
    overlay.classList.remove(
      "is-active", "is-assigning", "is-revealed", "has-error",
      "musa-boot-overlay--azul", "musa-boot-overlay--rojo"
    );
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--boot-bar-progress", "0%");
  }
  document.body.classList.remove("musa-boot-activa");
  const flujoIntro = document.querySelector(".intro-flow");
  if (flujoIntro) flujoIntro.inert = false;
  actualizarEstadoAsignacion();
}

window.solicitarAsignacionMusa = solicitarAsignacionMusa;
window.entrarEnJuegoAsignado = entrarEnJuegoAsignado;

document.addEventListener("DOMContentLoaded", () => {
  window.musa_client_id = musaAssignment.getOrCreateClientId(window.sessionStorage, { windowRef: window });
  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "nombre_musa") {
    mostrarAvisoMusa(mensajeNombreInvalido(), "muse.assignment.name_error");
    const seccionNombre = document.getElementById("intro-nombre");
    if (seccionNombre) scrollToSeccion(seccionNombre);
    setTimeout(() => nombreMusaInput?.focus(), usaMovimientoReducido() ? 0 : 350);
  }
  if (params.get("notice") === "musa_reemplazada") {
    mostrarAvisoMusa(tMusa(
      "muse.assignment.replaced_notice",
      {},
      "Esta pestaña fue sustituida por otra conexión. Vuelve a entrar para recibir una identidad nueva."
    ), "muse.assignment.replaced_notice");
    const seccionNombre = document.getElementById("intro-nombre");
    if (seccionNombre) scrollToSeccion(seccionNombre);
    setTimeout(() => nombreMusaInput?.focus(), usaMovimientoReducido() ? 0 : 350);
  }

  nombreMusaInput?.addEventListener("input", () => {
    if (normalizarNombreMusa(nombreMusaInput.value)) mostrarAvisoMusa("");
    actualizarNombreIntro();
  });
  nombreMusaInput?.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    if (!puedeAvanzarDesdeSeccionNombre()) return;
    actualizarNombreIntro();
    cerrarTeclado();
    scrollToSeccion(document.querySelector("#intro-asignacion"));
  });

  document.querySelectorAll("[data-scroll-target]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const selector = boton.getAttribute("data-scroll-target");
      if (!selector) return;
      if (boton.dataset.validate === "nombre_musa" && !puedeAvanzarDesdeSeccionNombre()) return;
      if (boton.dataset.validate === "nombre_musa") actualizarNombreIntro();
      const objetivo = document.querySelector(selector);
      const secciones = Array.from(document.querySelectorAll(".intro-section"));
      gestionarFocusNombre(secciones[obtenerIndiceSeccionActual()], objetivo);
      scrollToSeccion(objetivo);
      const focusId = boton.getAttribute("data-focus");
      if (focusId) setTimeout(() => document.getElementById(focusId)?.focus(), usaMovimientoReducido() ? 0 : 350);
    });
  });

  document.getElementById("musa_assignment_start")?.addEventListener("click", solicitarAsignacionMusa);
  document.getElementById("musa_assignment_retry")?.addEventListener("click", reintentarAsignacionMusa);
  document.getElementById("musa_assignment_enter")?.addEventListener("click", entrarEnJuegoAsignado);

  const contenedorScroll = document.querySelector(".intro-scroll");
  if (contenedorScroll) configurarNavegacionIntro(contenedorScroll);
  refrescarTextosAsignacion();
});

function configurarNavegacionIntro(contenedorScroll) {
  const SWIPE_MIN_DISTANCIA_Y = 48;
  const SWIPE_MAX_DESVIO_X = 140;
  const SWIPE_MAX_DURACION_MS = 900;
  let touchInicioY = null;
  let touchInicioX = null;
  let touchInicioTs = 0;
  const bloquearScroll = (evento) => {
    const destino = evento.target;
    if (destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA" || destino.isContentEditable)) return;
    evento.preventDefault();
  };
  contenedorScroll.addEventListener("wheel", bloquearScroll, { passive: false });
  contenedorScroll.addEventListener("touchmove", bloquearScroll, { passive: false });
  if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
    document.addEventListener("touchmove", bloquearScroll, { passive: false, capture: true });
  }
  contenedorScroll.addEventListener("touchstart", (evento) => {
    const destino = evento.target;
    if (destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA" || destino.isContentEditable)) {
      touchInicioY = touchInicioX = null;
      touchInicioTs = 0;
      return;
    }
    const touch = evento.changedTouches?.[0];
    if (!touch) return;
    touchInicioY = touch.clientY;
    touchInicioX = touch.clientX;
    touchInicioTs = Date.now();
  }, { passive: true });
  contenedorScroll.addEventListener("touchend", (evento) => {
    if (!Number.isFinite(touchInicioY) || !Number.isFinite(touchInicioX) || !touchInicioTs) return;
    const touch = evento.changedTouches?.[0];
    const inicioY = touchInicioY;
    const inicioX = touchInicioX;
    const inicioTs = touchInicioTs;
    touchInicioY = touchInicioX = null;
    touchInicioTs = 0;
    if (!touch) return;
    const deltaY = touch.clientY - inicioY;
    const deltaX = touch.clientX - inicioX;
    const esSwipeVertical = Math.abs(deltaY) >= SWIPE_MIN_DISTANCIA_Y
      && Math.abs(deltaY) > Math.abs(deltaX)
      && Math.abs(deltaX) <= SWIPE_MAX_DESVIO_X
      && (Date.now() - inicioTs) <= SWIPE_MAX_DURACION_MS;
    if (!esSwipeVertical) return;
    if (deltaY < 0) {
      if (puedeAvanzarDesdeSeccionNombre()) irASeccionPorDelta(1);
    } else {
      irASeccionPorDelta(-1);
    }
  }, { passive: true });
  contenedorScroll.addEventListener("touchcancel", () => {
    touchInicioY = touchInicioX = null;
    touchInicioTs = 0;
  }, { passive: true });
  document.addEventListener("keydown", (evento) => {
    if (document.body.classList.contains("musa-boot-activa")) return;
    const teclas = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
    const esEnter = evento.key === "Enter";
    if (!teclas.includes(evento.key) && !esEnter) return;
    const destino = evento.target;
    if (destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA" || destino.isContentEditable)) return;
    if ((evento.key === "ArrowDown" || esEnter) && !puedeAvanzarDesdeSeccionNombre()) return;
    evento.preventDefault();
    if (evento.key === "ArrowDown" || esEnter) irASeccionPorDelta(1);
    if (evento.key === "ArrowUp") irASeccionPorDelta(-1);
  });
}

socket.on("idioma_actual", (payload = {}) => {
  if (typeof window.scribSetLanguage2P === "function") {
    window.scribSetLanguage2P(payload.idioma || "es");
  }
  refrescarTextosAsignacion();
});

socket.on("connect", () => {
  socket.emit("pedir_idioma_actual");
  if (!asignacionBloqueada && !asignacionActual) {
    estadoAsignacion = "ready";
    actualizarEstadoAsignacion();
  }
});

socket.on("disconnect", () => {
  if (!asignacionBloqueada && !asignacionActual && !window.__scribMusaReplacementInProgress) {
    estadoAsignacion = "connecting";
    actualizarEstadoAsignacion();
  }
});

if (typeof window.scribOnLanguageChange2P === "function") {
  window.scribOnLanguageChange2P(refrescarTextosAsignacion);
}

window.addEventListener("pageshow", (evento) => {
  if (evento.persisted) restablecerVistaAsignacion();
});
