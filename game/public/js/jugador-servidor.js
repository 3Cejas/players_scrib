// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);

escritxr1 = document.getElementById("escritxr1");
escritxr2 = document.getElementById("escritxr2");

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
  // Pedimos los atributos al servidor
  socket.emit('pedir_atributos');

  socket.on('recibir_atributos', (data) => {
    console.log('Recibidos atributos:', data);
    // 'data' es un objeto: { "1": {fuerza, agilidad, inteligencia}, "2": {…} }
    const attrs = data;

    // Orden de los atributos según el HTML (3 filas × 2 columnas)
    const nombres = ['fuerza', 'agilidad', 'inteligencia'];

    // 1) Calculamos el total de puntos repartidos por cada jugador
    const sumas = {};
    Object.keys(attrs).forEach(jugadorId => {
      const a = attrs[jugadorId];
      // Si alguno no está definido, lo tratamos como cero
      const f = Number(a.fuerza)       || 0;
      const ag = Number(a.agilidad)    || 0;
      const intel = Number(a.inteligencia) || 0;
      sumas[jugadorId] = f + ag + intel;
    });

    // 2) Seleccionamos las 6 barras en el orden: 
    //    fuerza1, fuerza2, agilidad1, agilidad2, inteligencia1, inteligencia2
    const barras = document.querySelectorAll('.skill .progress-line');

    barras.forEach((barra, idx) => {
      // 2.1) Atributo y jugador correspondientes
      const atributoIndex = Math.floor(idx / 2); // 0→fuerza, 1→agilidad, 2→inteligencia
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