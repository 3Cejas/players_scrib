// Landing de musas: elección manual o asignación automática autoritativa.
const serverUrl = isProduction ? SERVER_URL_PROD : SERVER_URL_DEV;
const socket = io(serverUrl);
const musaAssignment = window.ScribMusaAssignment;
const nombreMusaInput = document.getElementById("nombre_musa");
const mensajeMusa = document.getElementById("mensaje_musa");
const musaNombreTitulos = document.querySelectorAll(".intro-musa-nombre");
const introScroll = document.querySelector(".intro-scroll");
const escritorasDisponibles = { 1: "ESCRITXR 1", 2: "ESCRITXR 2" };
const MAX_NOMBRE_MUSA = 10;
const REGEX_NOMBRE_MUSA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$/;
const REGEX_LETRA_MUSA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const REVEAL_MIN_AUTOMATIC_MS = 2200;
const REVEAL_MIN_MANUAL_MS = 1350;
const REVEAL_MIN_REDUCED_MS = 120;
const ASSIGNMENT_REVEAL_AUTOMATIC_MS = 2800;
const ASSIGNMENT_REVEAL_MANUAL_MS = 2200;
const ASSIGNMENT_REVEAL_RESTORED_MS = 520;
const ASSIGNMENT_REVEAL_REDUCED_MS = 240;
const GAME_LOAD_MS = 4300;
const GAME_LOAD_RESTORED_MS = 1400;
const GAME_LOAD_REDUCED_MS = 900;
let asignacionBloqueada = false;
let asignacionActual = null;
let nombrePendiente = "";
let estadoAsignacion = "ready";
let inicioSolicitudAsignacion = 0;
let revealTimeout = null;
let loadingStartTimeout = null;
let redirectTimeout = null;
let fingerprintCompleteTimeout = null;
let loadingFrame = null;
let seleccionPendiente = { assignmentMode: "automatica", player: null };
let claveAvisoMusa = "";
let restaurandoAsignacionPersistida = false;
let sesionPartidaMusa = "";
let onboardingTextTimer = null;

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

function obtenerEsperaMinimaAsignacion() {
  if (usaMovimientoReducido()) return REVEAL_MIN_REDUCED_MS;
  return seleccionPendiente.assignmentMode === "manual"
    ? REVEAL_MIN_MANUAL_MS
    : REVEAL_MIN_AUTOMATIC_MS;
}

function obtenerDuracionRevelacion(esRestaurada = false) {
  if (usaMovimientoReducido()) return ASSIGNMENT_REVEAL_REDUCED_MS;
  if (esRestaurada) return ASSIGNMENT_REVEAL_RESTORED_MS;
  return seleccionPendiente.assignmentMode === "manual"
    ? ASSIGNMENT_REVEAL_MANUAL_MS
    : ASSIGNMENT_REVEAL_AUTOMATIC_MS;
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

function normalizarNombreEscritxr(valor, player) {
  const limpio = String(valor || "").replace(/\s+/g, " ").trim().slice(0, 80);
  return limpio || `ESCRITXR ${player}`;
}

function actualizarEscritxrDisponible(player, nombre) {
  const equipo = musaAssignment.normalizeTeam(player);
  if (!equipo) return;
  escritorasDisponibles[equipo] = normalizarNombreEscritxr(nombre, equipo);
  const destino = document.getElementById(equipo === 1 ? "musa_writer_blue" : "musa_writer_red");
  if (destino) destino.textContent = escritorasDisponibles[equipo];
  const boton = document.getElementById(equipo === 1 ? "musa_assignment_blue" : "musa_assignment_red");
  if (boton) {
    boton.setAttribute(
      "aria-label",
      `Elegir a ${escritorasDisponibles[equipo]}, equipo ${equipo === 1 ? "azul" : "rojo"}`
    );
  }
}

function aplicarOpcionesEquipoMusa(payload = {}) {
  const sesionRecibida = musaAssignment.normalizeSessionId(payload.session_id || payload.sessionId);
  if (sesionRecibida) sesionPartidaMusa = sesionRecibida;
  const equipos = Array.isArray(payload.equipos) ? payload.equipos : [];
  equipos.forEach((equipo) => {
    actualizarEscritxrDisponible(
      equipo && (equipo.player ?? equipo.equipo),
      equipo && (equipo.nombre_escritxr || equipo.escritxr)
    );
  });
}

function pedirOpcionesEquipoMusa() {
  if (!socket.connected) return false;
  socket.emit("pedir_opciones_equipo_musa", (payload = {}) => aplicarOpcionesEquipoMusa(payload));
  return true;
}

function detenerTextoAnimadoOnboarding() {
  if (onboardingTextTimer) clearTimeout(onboardingTextTimer);
  onboardingTextTimer = null;
}

function caracteresVisiblesOnboarding(texto, cantidad) {
  return Array.from(String(texto || "")).slice(0, Math.max(0, cantidad)).join("");
}

function cantidadProgresivaOnboarding(progreso, inicio, fin, total, inversa = false) {
  if (progreso <= inicio) return inversa ? total : 0;
  if (progreso >= fin) return inversa ? 0 : total;
  const avance = (progreso - inicio) / (fin - inicio);
  return inversa
    ? total - Math.ceil(avance * total)
    : Math.floor(avance * total);
}

function animarTextoOnboarding(seccion) {
  detenerTextoAnimadoOnboarding();
  if (!seccion) return;

  const textoRitmo = seccion.querySelector(".onboarding-writer-copy__typed");
  const textoDesventaja = seccion.querySelector(".onboarding-disadvantage-text span");
  const palabraDesventaja = seccion.querySelector(".onboarding-disadvantage-text strong");
  const elementos = [textoRitmo, textoDesventaja, palabraDesventaja].filter(Boolean);
  if (!elementos.length) return;

  const textoCompleto = (elemento) => String(elemento?.dataset.fullText || elemento?.textContent || "");
  const escribirCompleto = () => elementos.forEach((elemento) => {
    elemento.textContent = textoCompleto(elemento);
  });
  if (usaMovimientoReducido()) {
    escribirCompleto();
    return;
  }

  const duracion = seccion.id === "intro-ritmo" ? 18000 : 20000;
  const inicio = performance.now();
  const actualizar = () => {
    if (!seccion.classList.contains("is-onboarding-active")) return;
    const progreso = ((performance.now() - inicio) % duracion) / duracion;

    if (textoRitmo) {
      const completo = textoCompleto(textoRitmo);
      const total = Array.from(completo).length;
      let visibles = 0;
      if (progreso < 0.47) visibles = cantidadProgresivaOnboarding(progreso, 0.09, 0.47, total);
      else if (progreso <= 0.53) visibles = total;
      else if (progreso < 0.94) visibles = cantidadProgresivaOnboarding(progreso, 0.53, 0.94, total, true);
      textoRitmo.textContent = caracteresVisiblesOnboarding(completo, visibles);
    }

    if (textoDesventaja) {
      const completo = textoCompleto(textoDesventaja);
      const total = Array.from(completo).length;
      const visibles = progreso < 0.48
        ? cantidadProgresivaOnboarding(progreso, 0.1, 0.48, total)
        : total;
      textoDesventaja.textContent = caracteresVisiblesOnboarding(completo, visibles);
    }

    if (palabraDesventaja) {
      const completo = textoCompleto(palabraDesventaja);
      const total = Array.from(completo).length;
      let visibles = 0;
      if (progreso >= 0.6 && progreso < 0.71) {
        visibles = cantidadProgresivaOnboarding(progreso, 0.6, 0.71, total);
      } else if (progreso >= 0.71 && progreso <= 0.96) {
        visibles = total;
      }
      palabraDesventaja.textContent = caracteresVisiblesOnboarding(completo, visibles);
    }

    onboardingTextTimer = setTimeout(actualizar, 60);
  };
  actualizar();
}

function marcarSeccionOnboardingActiva(objetivo) {
  detenerTextoAnimadoOnboarding();
  const secciones = Array.from(document.querySelectorAll(".intro-section"));
  secciones.forEach((seccion) => {
    seccion.classList.remove("is-onboarding-active", "is-onboarding-restarting");
  });
  if (!objetivo) return;
  objetivo.classList.add("is-onboarding-restarting");
  void objetivo.offsetWidth;
  objetivo.classList.remove("is-onboarding-restarting");
  void objetivo.offsetWidth;
  objetivo.classList.add("is-onboarding-active");
  animarTextoOnboarding(objetivo);
}

function scrollToSeccion(objetivo) {
  if (!objetivo) return;
  if (!introScroll) {
    objetivo.scrollIntoView({ behavior: usaMovimientoReducido() ? "auto" : "smooth", block: "start" });
    marcarSeccionOnboardingActiva(objetivo);
    return;
  }
  marcarSeccionOnboardingActiva(null);
  const inicio = introScroll.scrollTop;
  const destino = objetivo.offsetTop;
  const distancia = destino - inicio;
  const duracion = usaMovimientoReducido() ? 0 : 1200;
  if (!duracion) {
    introScroll.scrollTop = destino;
    marcarSeccionOnboardingActiva(objetivo);
    return;
  }
  let inicioTiempo = null;
  const animar = (marca) => {
    if (!inicioTiempo) inicioTiempo = marca;
    const progreso = Math.min((marca - inicioTiempo) / duracion, 1);
    introScroll.scrollTop = inicio + (distancia * (1 - Math.pow(1 - progreso, 3)));
    if (progreso < 1) requestAnimationFrame(animar);
    else marcarSeccionOnboardingActiva(objetivo);
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
  if (loadingStartTimeout) clearTimeout(loadingStartTimeout);
  if (redirectTimeout) clearTimeout(redirectTimeout);
  if (fingerprintCompleteTimeout) clearTimeout(fingerprintCompleteTimeout);
  if (loadingFrame) cancelAnimationFrame(loadingFrame);
  revealTimeout = null;
  loadingStartTimeout = null;
  redirectTimeout = null;
  fingerprintCompleteTimeout = null;
  loadingFrame = null;
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
    return seleccionPendiente.assignmentMode === "manual"
      ? `Conectando con ${escritorasDisponibles[seleccionPendiente.player] || "tu escritxr"}…`
      : "Buscando tu equipo…";
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
  return "";
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
  if (asignacionActual) {
    const cargando = document.getElementById("musa_boot_overlay")?.classList.contains("is-loading");
    if (cargando) renderizarCabeceraCarga(asignacionActual);
    else renderizarResultadoAsignacion(asignacionActual);
  }
  if (claveAvisoMusa) mostrarAvisoMusa(tMusa(claveAvisoMusa), claveAvisoMusa);
}

function mostrarOverlayAsignacion({ scanning = false } = {}) {
  const overlay = document.getElementById("musa_boot_overlay");
  if (!overlay) return;
  overlay.classList.remove(
    "musa-boot-overlay--azul", "musa-boot-overlay--rojo", "is-revealed",
    "has-error", "is-assigning", "is-scanning", "is-revealing", "is-loading",
    "is-restored-assignment", "musa-boot-flow--manual", "musa-boot-flow--automatic",
    "musa-boot-selection--blue", "musa-boot-selection--red"
  );
  const esManual = seleccionPendiente.assignmentMode === "manual";
  overlay.classList.add(
    "is-active",
    scanning ? "is-scanning" : "is-assigning",
    esManual ? "musa-boot-flow--manual" : "musa-boot-flow--automatic"
  );
  if (esManual) {
    overlay.classList.add(seleccionPendiente.player === 2 ? "musa-boot-selection--red" : "musa-boot-selection--blue");
  }
  overlay.setAttribute("aria-hidden", "false");
  overlay.style.setProperty("--boot-bar-progress", scanning ? "0%" : "38%");
  document.body.classList.add("musa-boot-activa");
  const flujoIntro = document.querySelector(".intro-flow");
  if (flujoIntro) flujoIntro.inert = true;
  document.getElementById("musa_game_loading")?.setAttribute("hidden", "");
  document.getElementById("musa_assignment_reveal")?.setAttribute("hidden", "");
  document.getElementById("musa_assignment_retry")?.setAttribute("hidden", "");
  const cancelar = document.getElementById("musa_assignment_cancel_scan");
  const fingerprintStageNode = document.getElementById("musa_fingerprint_stage");
  if (scanning) fingerprintStageNode?.removeAttribute("hidden");
  else fingerprintStageNode?.setAttribute("hidden", "");
  if (scanning) cancelar?.removeAttribute("hidden");
  else cancelar?.setAttribute("hidden", "");
  const kicker = document.getElementById("musa_boot_kicker");
  const title = document.getElementById("musa_boot_title");
  const copy = document.getElementById("musa_boot_copy");
  if (scanning) {
    if (kicker) kicker.textContent = "DETECCIÓN AUTOMÁTICA";
    if (title) title.textContent = "PON TU DEDO";
    if (copy) copy.textContent = "";
  } else if (seleccionPendiente.assignmentMode === "manual") {
    if (kicker) kicker.textContent = "ELECCIÓN DE MUSA";
    if (title) title.textContent = "ABRIENDO TU ELECCIÓN";
    if (copy) copy.textContent = "";
  } else {
    if (kicker) kicker.textContent = "DETECCIÓN AUTOMÁTICA";
    if (title) title.textContent = "¿QUIÉN SERÁ TU ESCRITXR?";
    if (copy) copy.textContent = "La señal está eligiendo…";
  }
  const foco = scanning ? document.getElementById("musa_fingerprint") : overlay;
  setTimeout(() => foco?.focus({ preventScroll: true }), usaMovimientoReducido() ? 0 : 180);
}

function invalidarRevelacionPorDesconexion() {
  limpiarTemporizadoresAsignacion();
  asignacionActual = null;
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
  const kicker = document.getElementById("musa_boot_kicker");
  const title = document.getElementById("musa_boot_title");
  const copy = document.getElementById("musa_boot_copy");
  const feather = document.getElementById("musa_assignment_reveal_feather");
  if (kicker) kicker.textContent = "TU ESCRITXR ES";
  if (title) title.textContent = asignacion.writer;
  if (copy) copy.textContent = "";
  if (feather) feather.src = asignacion.player === 2 ? "./img/pluma_roja.png" : "./img/pluma_azul.png";
}

function renderizarCabeceraCarga(asignacion) {
  const kicker = document.getElementById("musa_boot_kicker");
  const title = document.getElementById("musa_boot_title");
  const copy = document.getElementById("musa_boot_copy");
  if (kicker) kicker.textContent = "CARGANDO <SCRI> B";
  if (title) title.textContent = asignacion.writer;
  if (copy) copy.textContent = "";
}

function actualizarCargaJuego(asignacion, progreso) {
  const overlay = document.getElementById("musa_boot_overlay");
  const status = document.getElementById("musa_boot_status");
  const percent = document.getElementById("musa_boot_percent");
  const pct = Math.min(100, Math.max(0, Math.round(progreso * 100)));
  overlay?.style.setProperty("--boot-world-progress", `${pct}%`);
  overlay?.style.setProperty("--boot-bar-progress", `${pct}%`);
  if (percent) percent.textContent = `${pct}%`;

  const step = progreso < 0.42 ? 0 : (progreso < 0.78 ? 1 : 2);
  if (status) {
    status.textContent = step === 0
      ? `Preparando el canal creativo de ${asignacion.writer}…`
      : (step === 1 ? "Sincronizando la partida…" : "Abriendo <SCRI> B…");
  }

  document.querySelectorAll("[data-load-step]").forEach((item) => {
    const itemStep = Number(item.getAttribute("data-load-step"));
    item.classList.toggle("is-done", itemStep < step || progreso >= 1);
    item.classList.toggle("is-active", itemStep === step && progreso < 1);
  });
  document.querySelectorAll(".musa-boot-world-pixels span").forEach((pixel, index, pixels) => {
    pixel.classList.toggle("is-on", ((index + 1) / pixels.length) <= progreso);
  });
}

function iniciarCargaJuego(asignacion, duracion) {
  const inicio = performance.now();
  actualizarCargaJuego(asignacion, 0);
  const avanzar = (ahora) => {
    const progreso = Math.min(1, (ahora - inicio) / Math.max(1, duracion));
    actualizarCargaJuego(asignacion, progreso);
    if (progreso < 1) loadingFrame = requestAnimationFrame(avanzar);
    else loadingFrame = null;
  };
  loadingFrame = requestAnimationFrame(avanzar);
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
  if (destino) window.location.replace(destino);
}

function iniciarFaseCargaJuego(asignacion, duracionCarga) {
  const overlay = document.getElementById("musa_boot_overlay");
  overlay?.classList.remove("is-revealing");
  overlay?.classList.add("is-loading");
  document.getElementById("musa_assignment_reveal")?.setAttribute("hidden", "");
  document.getElementById("musa_game_loading")?.removeAttribute("hidden");
  renderizarCabeceraCarga(asignacion);
  iniciarCargaJuego(asignacion, duracionCarga);
  redirectTimeout = setTimeout(entrarEnJuegoAsignado, duracionCarga + 120);
}

function revelarAsignacion(asignacion) {
  const esRestaurada = restaurandoAsignacionPersistida;
  restaurandoAsignacionPersistida = false;
  asignacionActual = asignacion;
  estadoAsignacion = "assigned";
  guardarAsignacionSesion(asignacion);
  const overlay = document.getElementById("musa_boot_overlay");
  const duracionCarga = usaMovimientoReducido()
    ? GAME_LOAD_REDUCED_MS
    : (esRestaurada ? GAME_LOAD_RESTORED_MS : GAME_LOAD_MS);
  const duracionRevelacion = obtenerDuracionRevelacion(esRestaurada);
  if (overlay) {
    overlay.classList.remove(
      "is-assigning", "is-scanning", "has-error",
      "musa-boot-overlay--azul", "musa-boot-overlay--rojo"
    );
    overlay.classList.toggle("is-restored-assignment", esRestaurada);
    overlay.classList.add(asignacion.player === 2 ? "musa-boot-overlay--rojo" : "musa-boot-overlay--azul", "is-revealing");
    overlay.style.setProperty("--boot-world-progress", "0%");
    overlay.style.setProperty("--boot-bar-progress", "0%");
  }
  renderizarResultadoAsignacion(asignacion);
  document.getElementById("musa_assignment_reveal")?.removeAttribute("hidden");
  document.getElementById("musa_game_loading")?.setAttribute("hidden", "");
  document.getElementById("musa_assignment_cancel_scan")?.setAttribute("hidden", "");
  document.getElementById("musa_fingerprint_stage")?.setAttribute("hidden", "");
  loadingStartTimeout = setTimeout(() => {
    loadingStartTimeout = null;
    iniciarFaseCargaJuego(asignacion, duracionCarga);
  }, duracionRevelacion);
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
    overlay?.classList.remove("is-revealed", "is-revealing", "is-loading", "musa-boot-overlay--azul", "musa-boot-overlay--rojo");
    overlay?.classList.add("is-assigning");
    document.getElementById("musa_game_loading")?.setAttribute("hidden", "");
    document.getElementById("musa_assignment_reveal")?.setAttribute("hidden", "");
    inicioSolicitudAsignacion = performance.now();
    actualizarEstadoAsignacion();
  }
  const transcurrido = performance.now() - inicioSolicitudAsignacion;
  const minimo = obtenerEsperaMinimaAsignacion();
  revealTimeout = setTimeout(() => {
    revealTimeout = null;
    revelarAsignacion(asignacion);
  }, Math.max(0, minimo - transcurrido));
}

function manejarErrorAsignacion(error = {}) {
  if (error.code === "MUSE_SESSION_EXPIRED") {
    musaAssignment.clearAssignmentSession(window.sessionStorage);
    sesionPartidaMusa = musaAssignment.normalizeSessionId(error.sessionId) || sesionPartidaMusa;
    asignacionBloqueada = false;
    restaurandoAsignacionPersistida = false;
    restablecerVistaAsignacion();
    mostrarAvisoMusa("");
    return;
  }
  const tieneAsignacionGuardada = Boolean(musaAssignment.readAssignmentSession(
    window.sessionStorage,
    window.musa_client_id
  ));
  estadoAsignacion = "error";
  asignacionBloqueada = tieneAsignacionGuardada;
  const overlay = document.getElementById("musa_boot_overlay");
  overlay?.classList.remove("is-assigning");
  overlay?.classList.add("has-error");
  document.getElementById("musa_assignment_retry")?.removeAttribute("hidden");
  if (tieneAsignacionGuardada) {
    const title = document.getElementById("musa_boot_title");
    const copy = document.getElementById("musa_boot_copy");
    if (title) title.textContent = "NO PODEMOS CONFIRMAR TU EQUIPO";
    if (copy) copy.textContent = "Tu asignación sigue protegida. Reintenta cuando vuelva la conexión.";
  }
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
  try { socket.disconnect(); } catch (_error) {}
  window.location.replace("./index.html?notice=musa_reemplazada");
}

socket.on("musa_reemplazada", manejarMusaReemplazada);
socket.on("musa_sesion_actualizada", (payload = {}) => {
  const siguiente = musaAssignment.normalizeSessionId(payload.session_id || payload.sessionId);
  if (!siguiente || siguiente === sesionPartidaMusa) return;
  sesionPartidaMusa = siguiente;
  musaAssignment.clearAssignmentSession(window.sessionStorage);
  asignacionBloqueada = false;
  restaurandoAsignacionPersistida = false;
  restablecerVistaAsignacion();
  mostrarAvisoMusa("");
});
socket.on("nombre1", (nombre) => actualizarEscritxrDisponible(1, nombre));
socket.on("nombre2", (nombre) => actualizarEscritxrDisponible(2, nombre));
socket.on("musa_opciones_equipo", aplicarOpcionesEquipoMusa);
socket.on("actualizar_contador_musas", pedirOpcionesEquipoMusa);
socket.on("connect", pedirOpcionesEquipoMusa);

const fingerprintButton = document.getElementById("musa_fingerprint");
const fingerprintStage = document.getElementById("musa_fingerprint_stage");
const fingerprintPercent = document.getElementById("musa_fingerprint_percent");
const fingerprintHint = document.getElementById("musa_fingerprint_hint");
const fingerprintController = musaAssignment.createHoldController({
  durationMs: 1900,
  now: () => performance.now(),
  onProgress: (progress, meta = {}) => {
    const pct = Math.round(progress * 100);
    fingerprintStage?.style.setProperty("--finger-progress", `${Math.round(progress * 360)}deg`);
    if (fingerprintPercent) fingerprintPercent.textContent = `${pct}%`;
    if (fingerprintHint && meta.cancelled) {
      fingerprintHint.textContent = "MANTÉN EL DEDO HASTA COMPLETAR";
    }
  },
  onComplete: () => {
    fingerprintButton?.classList.remove("is-holding");
    fingerprintButton?.classList.add("is-complete");
  if (fingerprintHint) fingerprintHint.textContent = "¡SEÑAL CAPTURADA!";
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([45, 30, 90]);
    }
    fingerprintCompleteTimeout = setTimeout(() => {
      fingerprintCompleteTimeout = null;
      solicitarAsignacionMusa({ assignmentMode: "automatica", player: null });
    }, usaMovimientoReducido() ? 120 : 620);
  }
});

function validarNombreAsignacion() {
  const nombre = normalizarNombreMusa(nombreMusaInput?.value || "");
  if (nombre) return nombre;
  mostrarAvisoMusa(mensajeNombreInvalido(), "muse.assignment.name_error");
  nombreMusaInput?.focus();
  return "";
}

function mostrarEscanerAutomatico() {
  if (asignacionBloqueada) return;
  const nombre = validarNombreAsignacion();
  if (!nombre) return;
  mostrarAvisoMusa("");
  nombrePendiente = nombre;
  asignacionActual = null;
  seleccionPendiente = { assignmentMode: "automatica", player: null };
  limpiarTemporizadoresAsignacion();
  fingerprintController.reset();
  fingerprintButton?.classList.remove("is-holding", "is-complete");
  if (fingerprintHint) fingerprintHint.textContent = "MANTÉN EL DEDO SOBRE LA HUELLA";
  mostrarOverlayAsignacion({ scanning: true });
}

function solicitarAsignacionMusa({ assignmentMode = "automatica", player = null } = {}) {
  if (asignacionBloqueada) return;
  const nombre = validarNombreAsignacion();
  if (!nombre) return;
  const modo = musaAssignment.normalizeAssignmentMode(assignmentMode);
  const equipo = modo === "manual" ? musaAssignment.normalizeTeam(player) : null;
  if (modo === "manual" && !equipo) return;
  if (!sesionPartidaMusa) {
    mostrarAvisoMusa("");
    pedirOpcionesEquipoMusa();
    return;
  }
  mostrarAvisoMusa("");
  nombrePendiente = nombre;
  seleccionPendiente = { assignmentMode: modo, player: equipo };
  asignacionActual = null;
  asignacionBloqueada = true;
  inicioSolicitudAsignacion = performance.now();
  limpiarTemporizadoresAsignacion();
  mostrarOverlayAsignacion();
  coordinadorAsignacion.request({
    clientId: window.musa_client_id,
    name: nombre,
    assignmentMode: modo,
    sessionId: sesionPartidaMusa,
    player: equipo
  });
}

function cancelarEscanerAutomatico() {
  fingerprintController.reset();
  fingerprintButton?.classList.remove("is-holding", "is-complete");
  restablecerVistaAsignacion();
}

function iniciarPulsacionHuella(evento) {
  if (evento) evento.preventDefault();
  if (evento && typeof evento.pointerId === "number") {
    try { fingerprintButton?.setPointerCapture(evento.pointerId); } catch (_error) {}
  }
  if (!fingerprintController.start()) return;
  fingerprintButton?.classList.add("is-holding");
  if (fingerprintHint) fingerprintHint.textContent = "LEYENDO TU ENERGÍA CREATIVA…";
}

function cancelarPulsacionHuella(evento) {
  if (evento) evento.preventDefault();
  if (!fingerprintController.cancel()) return;
  fingerprintButton?.classList.remove("is-holding");
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
      "is-active", "is-assigning", "is-scanning", "is-revealed", "has-error",
      "is-revealing", "is-loading", "is-restored-assignment",
      "musa-boot-overlay--azul", "musa-boot-overlay--rojo",
      "musa-boot-flow--manual", "musa-boot-flow--automatic",
      "musa-boot-selection--blue", "musa-boot-selection--red"
    );
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--boot-bar-progress", "0%");
  }
  document.body.classList.remove("musa-boot-activa");
  const flujoIntro = document.querySelector(".intro-flow");
  if (flujoIntro) flujoIntro.inert = false;
  document.getElementById("musa_assignment_cancel_scan")?.setAttribute("hidden", "");
  document.getElementById("musa_fingerprint_stage")?.setAttribute("hidden", "");
  document.getElementById("musa_game_loading")?.setAttribute("hidden", "");
  document.getElementById("musa_assignment_reveal")?.setAttribute("hidden", "");
  actualizarEstadoAsignacion();
}

function restaurarAsignacionGuardadaMusa() {
  const guardada = musaAssignment.readAssignmentSession(
    window.sessionStorage,
    window.musa_client_id
  );
  if (!guardada) return false;
  const asignacion = guardada.assignment;
  sesionPartidaMusa = musaAssignment.normalizeSessionId(asignacion.sessionId);
  nombrePendiente = normalizarNombreMusa(guardada.name) || guardada.name;
  if (nombreMusaInput) nombreMusaInput.value = nombrePendiente;
  seleccionPendiente = {
    assignmentMode: asignacion.assignmentMode,
    player: asignacion.player
  };
  asignacionActual = null;
  asignacionBloqueada = true;
  restaurandoAsignacionPersistida = true;
  estadoAsignacion = socket.connected ? "revalidating" : "connecting";
  inicioSolicitudAsignacion = performance.now() - obtenerEsperaMinimaAsignacion();
  actualizarNombreIntro();
  mostrarOverlayAsignacion();
  const kicker = document.getElementById("musa_boot_kicker");
  const title = document.getElementById("musa_boot_title");
  const copy = document.getElementById("musa_boot_copy");
  if (kicker) kicker.textContent = "ASIGNACIÓN BLOQUEADA";
  if (title) title.textContent = "YA TIENES EQUIPO";
  if (copy) copy.textContent = "Confirmando tu escritxr para devolverte al juego…";
  coordinadorAsignacion.request({
    clientId: window.musa_client_id,
    name: nombrePendiente,
    assignmentMode: asignacion.assignmentMode,
    sessionId: sesionPartidaMusa,
    player: asignacion.player
  });
  return true;
}

function bloquearMusaReemplazada() {
  asignacionBloqueada = true;
  estadoAsignacion = "assigned";
  mostrarOverlayAsignacion();
  const kicker = document.getElementById("musa_boot_kicker");
  const title = document.getElementById("musa_boot_title");
  const copy = document.getElementById("musa_boot_copy");
  const status = document.getElementById("musa_boot_status");
  if (kicker) kicker.textContent = "SESIÓN PROTEGIDA";
  if (title) title.textContent = "TU EQUIPO SIGUE ASIGNADO";
  if (copy) copy.textContent = "Esta musa ya está abierta en otra pestaña. No puedes elegir otro equipo desde aquí.";
  if (status) status.textContent = "Continúa desde la pestaña activa";
  document.getElementById("musa_game_loading")?.setAttribute("hidden", "");
  document.getElementById("musa_assignment_reveal")?.setAttribute("hidden", "");
  document.getElementById("musa_assignment_retry")?.setAttribute("hidden", "");
}

window.solicitarAsignacionMusa = solicitarAsignacionMusa;
window.entrarEnJuegoAsignado = entrarEnJuegoAsignado;

fingerprintButton?.addEventListener("pointerdown", iniciarPulsacionHuella);
fingerprintButton?.addEventListener("pointerup", cancelarPulsacionHuella);
fingerprintButton?.addEventListener("pointercancel", cancelarPulsacionHuella);
fingerprintButton?.addEventListener("lostpointercapture", cancelarPulsacionHuella);
fingerprintButton?.addEventListener("contextmenu", (evento) => evento.preventDefault());
fingerprintButton?.addEventListener("keydown", (evento) => {
  if ((evento.key !== " " && evento.key !== "Enter") || evento.repeat) return;
  iniciarPulsacionHuella(evento);
});
fingerprintButton?.addEventListener("keyup", (evento) => {
  if (evento.key !== " " && evento.key !== "Enter") return;
  cancelarPulsacionHuella(evento);
});

document.addEventListener("DOMContentLoaded", () => {
  marcarSeccionOnboardingActiva(document.querySelector(".intro-section"));
  window.musa_client_id = musaAssignment.getOrCreateClientId(window.sessionStorage, { windowRef: window });
  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "nombre_musa") {
    mostrarAvisoMusa(mensajeNombreInvalido(), "muse.assignment.name_error");
    const seccionNombre = document.getElementById("intro-nombre");
    if (seccionNombre) scrollToSeccion(seccionNombre);
    setTimeout(() => nombreMusaInput?.focus(), usaMovimientoReducido() ? 0 : 350);
  }
  if (params.get("notice") === "musa_reemplazada") {
    bloquearMusaReemplazada();
  } else {
    restaurarAsignacionGuardadaMusa();
    if (params.get("notice") === "nueva_partida") {
      mostrarAvisoMusa("");
    }
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

  document.getElementById("musa_assignment_blue")?.addEventListener("click", () => {
    solicitarAsignacionMusa({ assignmentMode: "manual", player: 1 });
  });
  document.getElementById("musa_assignment_red")?.addEventListener("click", () => {
    solicitarAsignacionMusa({ assignmentMode: "manual", player: 2 });
  });
  document.getElementById("musa_assignment_start")?.addEventListener("click", mostrarEscanerAutomatico);
  document.getElementById("musa_assignment_cancel_scan")?.addEventListener("click", cancelarEscanerAutomatico);
  document.getElementById("musa_assignment_retry")?.addEventListener("click", reintentarAsignacionMusa);

  const contenedorScroll = document.querySelector(".intro-scroll");
  if (contenedorScroll) configurarNavegacionIntro(contenedorScroll);
  actualizarEscritxrDisponible(1, escritorasDisponibles[1]);
  actualizarEscritxrDisponible(2, escritorasDisponibles[2]);
  pedirOpcionesEquipoMusa();
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
  if (!evento.persisted) return;
  if (new URLSearchParams(window.location.search).get("notice") === "musa_reemplazada") {
    bloquearMusaReemplazada();
    return;
  }
  if (!restaurarAsignacionGuardadaMusa()) restablecerVistaAsignacion();
});
