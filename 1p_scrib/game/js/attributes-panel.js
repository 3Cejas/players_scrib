function leerAtributosDesdeURL() {
  const searchParams = new URLSearchParams(window.location.search);
  const keys = ['fuerza', 'agilidad', 'destreza'];
  const tieneTodos = keys.every((key) => searchParams.has(key));
  if (!tieneTodos) {
    return null;
  }

  const attrs = {};
  for (const key of keys) {
    const raw = Number(searchParams.get(key));
    if (!Number.isFinite(raw)) {
      return null;
    }
    const valor = Math.max(0, Math.min(LIMITE_TOTAL, Math.floor(raw)));
    attrs[key] = valor;
  }

  const total = Object.values(attrs).reduce((a, b) => a + b, 0);
  if (total !== LIMITE_TOTAL) {
    return null;
  }

  return attrs;
}

document.addEventListener('DOMContentLoaded', function () {

  generarCasillas()
  // Inicializa las variables con los valores por defecto
  actualizarVariables();

  // Estado inicial de los atributos
  atributos = leerAtributosDesdeURL() || { fuerza: 0, agilidad: 0, destreza: 0 };

  // Referencias a elementos del DOM
  const container = document.getElementById('atributos-container');
  const totalUsadosEl = document.getElementById('total-usados');
  const btnEscribir = document.getElementById('btn_escribir');

  if (!container || !totalUsadosEl) {
    return;
  }

  // FunciÃ³n para calcular la suma total
  function calcularTotal() {
    return Object.values(atributos).reduce((a, b) => a + b, 0);
  }

  // FunciÃ³n para actualizar toda la interfaz tras un cambio
  function actualizarInterfaz() {
    const total = calcularTotal();

    document.querySelectorAll('.atributo').forEach(div => {
      const key = div.dataset.atributo;
      const valor = atributos[key];
      const btnMenos = div.querySelector('button[data-action="decrement"]');
      const btnMas = div.querySelector('button[data-action="increment"]');
      const puntos = div.querySelectorAll('.punto');

      div.querySelector('.contador').textContent = valor;

      if (btnMenos) {
        btnMenos.disabled = (valor === 0);
      }
      if (btnMas) {
        btnMas.disabled = (total >= LIMITE_TOTAL);
      }

      puntos.forEach((el, idx) => {
        el.classList.toggle('filled', idx < valor);
      });
    });

    totalUsadosEl.textContent = total;

    const ratio = total / LIMITE_TOTAL;
    totalUsadosEl.classList.remove('estado-ok', 'estado-warn', 'estado-danger', 'estado-over');

    if (ratio > 1) {
      totalUsadosEl.classList.add('estado-over');
    } else if (ratio > 0.8) {
      totalUsadosEl.classList.add('estado-danger');
    } else if (ratio > 0.5) {
      totalUsadosEl.classList.add('estado-warn');
    } else {
      totalUsadosEl.classList.add('estado-ok');
    }

    if (btnEscribir) {
      const habilitado = total === LIMITE_TOTAL;
      btnEscribir.classList.toggle('disabled', !habilitado);
      btnEscribir.setAttribute('aria-disabled', habilitado ? 'false' : 'true');
    }
  }

  container.addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON') return;
    e.preventDefault();
    const action = e.target.dataset.action;
    const atributoDiv = e.target.closest('.atributo');
    if (!atributoDiv) return;
    const key = atributoDiv.dataset.atributo;

    if (action === 'increment' && calcularTotal() < LIMITE_TOTAL) {
      atributos[key]++;
    } else if (action === 'decrement' && atributos[key] > 0) {
      atributos[key]--;
    }
    actualizarInterfaz();
  });

  actualizarInterfaz();
});

/**
     * FunciÃ³n para cambiar el valor de un input numÃ©rico (type=number)
     * @param {string} campoId - El id del input (por ejemplo, 'tiempo_inicial')
     * @param {number} incremento - Cantidad a sumar o restar (p.ej. +5 o -5)
     */
