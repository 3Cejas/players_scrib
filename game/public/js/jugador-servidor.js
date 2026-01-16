// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);

escritxr1 = document.getElementById("escritxr1");
escritxr2 = document.getElementById("escritxr2");
const nombre_musa_input = document.getElementById("nombre_musa");
const mensaje_musa = document.getElementById("mensaje_musa");
const MAX_NOMBRE_MUSA = 10;
const REGEX_NOMBRE_MUSA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$/;
const REGEX_LETRA_MUSA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

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

function entrarComoMusa(playerId) {
  if (!nombre_musa_input) return;
  const nombre = normalizarNombreMusa(nombre_musa_input.value);
  if (!nombre) {
    mostrarAvisoMusa("Tu nombre necesita al menos 1 letra y maximo 10 caracteres.");
    nombre_musa_input.focus();
    return;
  }
  limpiarAvisoMusa();
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
  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "nombre_musa") {
    mostrarAvisoMusa("Tu nombre necesita al menos 1 letra y maximo 10 caracteres.");
  }
  if (nombre_musa_input) {
    nombre_musa_input.addEventListener("input", () => {
      if (normalizarNombreMusa(nombre_musa_input.value)) {
        limpiarAvisoMusa();
      }
    });
  }
  if (nombre_musa_input) {
    nombre_musa_input.focus();
  }
  // Pedimos los atributos al servidor
  socket.emit('pedir_atributos');

  socket.on('recibir_atributos', (data) => {
    console.log('Recibidos atributos:', data);
    // 'data' es un objeto: { "1": {fuerza, agilidad, destreza}, "2": {…} }
    const attrs = data;

    // Orden de los atributos según el HTML (3 filas × 2 columnas)
    const nombres = ['fuerza', 'agilidad', 'destreza'];

    // 1) Calculamos el total de puntos repartidos por cada jugador
    const sumas = {};
    Object.keys(attrs).forEach(jugadorId => {
      const a = attrs[jugadorId];
      // Si alguno no está definido, lo tratamos como cero
      const f = Number(a.fuerza)       || 0;
      const ag = Number(a.agilidad)    || 0;
      const dest = Number(a.destreza) || 0;
      sumas[jugadorId] = f + ag + dest;
    });

    // 2) Seleccionamos las 6 barras en el orden: 
    //    fuerza1, fuerza2, agilidad1, agilidad2, destreza1, destreza2
    const barras = document.querySelectorAll('.skill .progress-line');

    barras.forEach((barra, idx) => {
      // 2.1) Atributo y jugador correspondientes
      const atributoIndex = Math.floor(idx / 2); // 0→fuerza, 1→agilidad, 2→destreza
      const jugadorIndex  = idx % 2;              // 0→jugador "1", 1→jugador "2"
      const atributo      = nombres[atributoIndex];
      const jugadorId     = String(jugadorIndex + 1);

      // 2.2) Valor absoluto de puntos para este atributo y jugador
      let valor = 0;
      if (attrs[jugadorId] && typeof attrs[jugadorId][atributo] !== 'undefined') {
        valor = Number(attrs[jugadorId][atributo]) || 0;
      }

      // 2.3) Total de puntos repartidos por este jugador
      const totalPuntos = sumas[jugadorId] || 0;

      // 2.4) Calculamos el porcentaje relativo:
      //      si totalPuntos es 0, dejamos 0% para evitar división por cero
      const porcentaje = totalPuntos > 0
        ? Math.round((valor / totalPuntos) * 100)
        : 0;

      // 3) Aplicamos el porcentaje en CSS custom properties
      barra.style.setProperty('--wd', porcentaje + '%');
      barra.style.setProperty('--tx', `'${porcentaje}%'`);

      // 4) Reiniciamos la animación del <span> para que el cambio se anime
      const span = barra.querySelector('span');
      span.style.animation = 'none';
      // Forzar reflow para resetear animación
      void span.offsetWidth;
      span.style.animation = '';
    });
  });
});
