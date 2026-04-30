function generarCasillas() {
  const contenedor = document.getElementById('listaModos');
  if (!contenedor) return;
  const listaModosInicial = obtenerListaModosInicialJuego1P();
  const coloresModos = obtenerColoresModosJuego1P();

  const seleccionadosPrevios = new Set(
    Array.from(contenedor.querySelectorAll('input[name="modos"]:checked')).map((checkbox) => checkbox.value)
  );
  const mantenerTodoMarcado = seleccionadosPrevios.size === 0;

  contenedor.innerHTML = "";

  if (contenedor.parentElement && contenedor.parentElement.tagName.toLowerCase() === "table") {
    contenedor.parentElement.style.margin = "0 auto";
  }

  if (window.innerWidth <= 800) {
    listaModosInicial.forEach(function(modo, index) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.className = "casilla";

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `modo-${index}`;
      checkbox.name = 'modos';
      checkbox.value = modo;
      checkbox.checked = mantenerTodoMarcado || seleccionadosPrevios.has(modo);

      checkbox.style.width = "1.5em";
      checkbox.style.height = "1.5em";

      const label = document.createElement('label');
      label.htmlFor = `modo-${index}`;
      label.setAttribute("data-mode-key", modo);
      label.textContent = traducirModoJuego1P(modo);
      label.style.display = 'block';
      label.style.color = coloresModos[modo];
      label.style.paddingLeft = "0.2vw";
      label.style.paddingRight = "0.2vw";
      label.style.paddingBottom = "4vw";
      label.style.fontSize = "8vw";

      td.appendChild(checkbox);
      td.appendChild(label);
      tr.appendChild(td);

      contenedor.appendChild(tr);
    });

  } else {
    const tr = document.createElement('tr');

    listaModosInicial.forEach(function(modo, index) {
      const td = document.createElement('td');
      td.className = "casilla";

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `modo-${index}`;
      checkbox.name = 'modos';
      checkbox.value = modo;
      checkbox.checked = mantenerTodoMarcado || seleccionadosPrevios.has(modo);

      checkbox.style.width = "1.5em";
      checkbox.style.height = "1.5em";

      const label = document.createElement('label');
      label.htmlFor = `modo-${index}`;
      label.setAttribute("data-mode-key", modo);
      label.textContent = traducirModoJuego1P(modo);
      label.style.display = 'block';
      label.style.color = coloresModos[modo];
      label.style.paddingTop = "0.3em";
      label.style.paddingLeft = "0.5vw";
      label.style.paddingRight = "0.5vw";
      label.style.fontSize = "1.5em";

      td.appendChild(checkbox);
      td.appendChild(label);

      tr.appendChild(td);
    });

    contenedor.appendChild(tr);
  }
}

function actualizarEtiquetasCasillasModo() {
  const mapaColores = obtenerColoresModosJuego1P();

  document.querySelectorAll('#listaModos label[data-mode-key]').forEach((label) => {
    const modo = label.getAttribute("data-mode-key");
    if (!modo) return;
    label.textContent = traducirModoJuego1P(modo);
    if (mapaColores && Object.prototype.hasOwnProperty.call(mapaColores, modo)) {
      label.style.color = mapaColores[modo];
    }
  });
}

window.scrib1pRefreshModeLabels = actualizarEtiquetasCasillasModo;

// FunciÃ³n para obtener los modos seleccionados
function rellenarListaModos() {
  const seleccionados = document.querySelectorAll('input[name="modos"]:checked');

  LISTA_MODOS = Array.from(seleccionados).map(checkbox => checkbox.value);

  // Opcional: Mostrar los resultados en consola para verificar
  console.log('LISTA_MODOS:', LISTA_MODOS);
}

function actualizarVariables() {
  const inputCambioPalabras = document.getElementById('tiempo_cambio_palabras');
  const inputTiempoInicial = document.getElementById('tiempo_inicial');
  const inputCambioLetra = document.getElementById('tiempo_cambio_letra');
  const inputTiempoModos = document.getElementById('tiempo_modos');

  const valorCambioPalabras = inputCambioPalabras ? inputCambioPalabras.valueAsNumber : NaN;
  const valorTiempoInicial = inputTiempoInicial ? inputTiempoInicial.valueAsNumber : NaN;
  const valorCambioLetra = inputCambioLetra ? inputCambioLetra.valueAsNumber : NaN;
  const valorTiempoModos = inputTiempoModos ? inputTiempoModos.valueAsNumber : NaN;

  //TIEMPO_INVERSO = tiempo_inverso_input.valueAsNumber * 1000;
  //TIEMPO_BORRADO = tiempo_borrado_input.valueAsNumber * 1000;
  if (Number.isFinite(valorCambioPalabras)) {
    TIEMPO_CAMBIO_PALABRA = valorCambioPalabras * 1000;
  }
  //TIEMPO_BORROSO = tiempo_borroso_input.valueAsNumber * 1000;
  if (Number.isFinite(valorTiempoInicial)) {
    TIEMPO_INICIAL = valorTiempoInicial * 1000;
  }
  //PALABRAS_INSERTADAS_META = palabras_insertadas_meta_input.valueAsNumber;
  if (Number.isFinite(valorCambioLetra)) {
    TIEMPO_CAMBIO_LETRA = valorCambioLetra * 1000;
  }
  if (Number.isFinite(valorTiempoModos)) {
    TIEMPO_CAMBIO_MODOS = (valorTiempoModos * 1000) - 1;
  }

 //console.log('TIEMPO_INVERSO:', TIEMPO_INVERSO);
 //console.log('TIEMPO_BORRADO:', TIEMPO_BORRADO);
 console.log('TIEMPO_CAMBIO_PALABRAS:', TIEMPO_CAMBIO_PALABRA);
 //console.log('TIEMPO_BORROSO:', TIEMPO_BORROSO);
 //console.log('PALABRAS_INSERTADAS_META:', PALABRAS_INSERTADAS_META);
 console.log('TIEMPO_CAMBIO_LETRA:', TIEMPO_CAMBIO_LETRA);
 console.log('TIEMPO_MODOS:', TIEMPO_CAMBIO_MODOS);
}

