function cambiarValor(campoId, incremento) {
  // Obtenemos el input por su id
  const input = document.getElementById(campoId);

  // Obtenemos el valor actual y lo convertimos a nÃºmero
  let valorActual = parseInt(input.value, 10);
  if (isNaN(valorActual)) {
    valorActual = 0; // Si no es numÃ©rico, asumimos 0
  }

  // Calculamos el nuevo valor
  let nuevoValor = valorActual + incremento;

  // Leemos los lÃ­mites min y max del propio input
  const minRaw = parseInt(input.min, 10);
  const maxRaw = parseInt(input.max, 10);
  const min = Number.isNaN(minRaw) ? Number.MIN_SAFE_INTEGER : minRaw;
  const max = Number.isNaN(maxRaw) ? Number.MAX_SAFE_INTEGER : maxRaw;

  // Forzamos el nuevo valor a permanecer dentro de [min, max]
  if (nuevoValor < min) {
    nuevoValor = min;
  } else if (nuevoValor > max) {
    nuevoValor = max;
  }

  // Asignamos el valor calculado al input
  input.value = nuevoValor;
}
