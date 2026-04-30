// Función auxiliar que dada una palabra devuelve una puntación de respecto de la frecuencia.
function puntuación_palabra(palabra) {
    palabra = palabra.toLowerCase();
    let puntuación = 0;
    if (palabra != null) {
        palabra = palabra.replace(/\s+/g, '')
        let longitud = palabra.length;
        string_unico(toNormalForm(palabra)).split("").forEach(letra => puntuación += frecuencia_letras[letra]);
        puntuación = Math.ceil((((10 - puntuación*0.5) + longitud * 0.1 * 30)) / 5) * 5
        if(isNaN(puntuación)){
            puntuación = 10;
        }
        return puntuación;
    }
    else return 10;
}

function string_unico(names) {
    string = "";
    ss = "";
    namestring = names.split("");

    for (j = 0; j < namestring.length; j++) {
        for (i = j; i < namestring.length; i++) {
            if (string.includes(namestring[i])) // if contains not work then  
                break;                          // use includes like in snippet
            else
                string += namestring[i];
        }
        if (ss.length < string.length)
            ss = string;
        string = "";
    }
    return ss;
}

function toNormalForm(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const PALABRAS_FALLBACK_BONUS_1P = Object.freeze([
    { title: "pluma", definicion: "Herramienta simbolica para seguir escribiendo." },
    { title: "ritmo", definicion: "Cadencia base para mantener el pulso del texto." },
    { title: "escena", definicion: "Espacio imaginado donde se despliega la historia." },
    { title: "trazo", definicion: "Marca breve que empuja el texto hacia delante." },
    { title: "voz", definicion: "Tono interno que sostiene la escritura." }
]);

function obtenerPalabraFallbackBonus1P() {
    const indice = Math.floor(Math.random() * PALABRAS_FALLBACK_BONUS_1P.length);
    const fallback = PALABRAS_FALLBACK_BONUS_1P[indice] || PALABRAS_FALLBACK_BONUS_1P[0];
    return {
        title: fallback.title,
        definicion: fallback.definicion
    };
}

async function fetchJsonConTimeoutJuego1P(url, timeoutMs = 3500) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    let timeoutId = null;

    try {
        if (controller) {
            timeoutId = setTimeout(() => {
                controller.abort();
            }, timeoutMs);
        }
        const respuesta = await fetch(url, controller ? { signal: controller.signal } : undefined);
        if (!respuesta || !respuesta.ok) {
            throw new Error(`Respuesta invalida: ${respuesta ? respuesta.status : "sin respuesta"}`);
        }
        return await respuesta.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

async function getRandomSpanishWord() {
    try {
      // 1) Obtener página aleatoria con origin=*
      const randomUrl = 'https://es.wiktionary.org/w/api.php?action=query&list=random&rnlimit=1&rnnamespace=0&format=json&origin=*';
      const randomData = await fetchJsonConTimeoutJuego1P(randomUrl);
      
      if (!randomData.query.random[0]) {
        throw new Error('No se obtuvo página aleatoria');
      }

      const title = randomData.query.random[0].title;
      console.log('Título aleatorio:', title);

      // 2) Consultar el HTML parseado de esa página
      const parseUrl = `https://es.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
      const parseData = await fetchJsonConTimeoutJuego1P(parseUrl);
      
      if (!parseData.parse) {
        throw new Error('No se pudo parsear la página');
      }

      // 3) Obtenemos la cadena HTML embebida
      const html = parseData.parse.text['*'];

      // 4) Parsear el HTML con DOMParser (nativo del navegador)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Buscamos el primer <dd> dentro de <dl>
      let definicionDD = doc.querySelector('dl > dd');
      // En caso de no existir <dd>, buscamos el primer <li> en .mw-parser-output
      if (!definicionDD) {
        definicionDD = doc.querySelector('div.mw-parser-output li');
      }

      let definicion = definicionDD ? definicionDD.textContent.trim() : 'Sin definición encontrada';

      // Eliminar cualquier estilo incrustado si lo hubiera
      // (en DOMParser, por fortuna, el <style> no suele mezclarse con textContent, 
      //  pero si quieres asegurarte de quitar estilos, puedes hacer algo como:
      doc.querySelectorAll('style').forEach(st => st.remove());
      definicion = definicion.replace(/\.mw-parser-output\s*\.[\s\S]+?\}/g, '').trim();

      // Mostrar en consola
      console.log('Definición encontrada:\n', definicion);

      // Retornar un objeto con la info
      return { title, definicion };

    } catch (err) {
      console.warn('Error en getRandomSpanishWord, usando fallback local:', err);
      return obtenerPalabraFallbackBonus1P();
    }
  }

  

function ajustarFuerza(secs_base, fuerza) {
  const limiteTotal = leerLimiteTotalGameplay1P();
  const maxInc = leerMaxIncrementoGameplay1P();
  if (typeof secs_base !== 'number' || typeof fuerza !== 'number') {
    throw new TypeError('ajustarFuerza: ambos parametros deben ser numeros');
  }
  if (fuerza == 0) {
    return Math.round(secs_base);
  }
  if (fuerza > limiteTotal) {
    fuerza = limiteTotal;
  }
  const factorLog = Math.log(fuerza + 1) / Math.log(limiteTotal + 1);
  const pctIncremento = maxInc * factorLog;
  const resultado = Math.round(secs_base * (1 + pctIncremento));
  console.log(
    `[ajustarFuerza] secs_base=${secs_base}, fuerza=${fuerza}, ` +
    `factorLog=${factorLog.toFixed(3)}, pctInc=${(pctIncremento*100).toFixed(1)}% -> resultado=${resultado}`
  );
  return resultado;
}

function ajustarDestreza(secs_base, destreza) {
  const limiteTotal = leerLimiteTotalGameplay1P();
  const maxIncDestreza = leerMaxIncrementoDestrezaGameplay1P();
  if (typeof secs_base !== 'number' || typeof destreza !== 'number') {
    throw new TypeError('ajustarDestreza: ambos parametros deben ser numeros');
  }
  if (destreza == 0) {
    return Math.round(secs_base);
  }
  if (destreza > limiteTotal) {
    destreza = limiteTotal;
  }
  const numerador = Math.log(destreza + 1);
  const denominador = Math.log(limiteTotal + 1);
  const factorLog = numerador / denominador;
  const pctReduccion = maxIncDestreza * factorLog;
  const resultado = Math.round(secs_base * (1 - pctReduccion));
  console.log(
    `[ajustarDestreza] secs_base=${secs_base}, destreza=${destreza}, ` +
    `factorLog=${factorLog.toFixed(3)}, pctRed=${(pctReduccion*100).toFixed(1)}% -> resultado=${resultado}`
  );
  return resultado;
}

function ajustarRapidez(baseRapidezBorrado, baseInicioBorrado, agilidad) {
  const limiteTotal = leerLimiteTotalGameplay1P();
  const maxInc = leerMaxIncrementoGameplay1P();
  if (typeof baseRapidezBorrado !== 'number' ||
      typeof baseInicioBorrado !== 'number' ||
      typeof agilidad !== 'number') {
    throw new TypeError('ajustarRapidez: todos los parametros deben ser numeros');
  }
  if (agilidad == 0) {
    escribirRapidecesGameplay1P(baseRapidezBorrado, baseInicioBorrado);
    console.log(
      `[ajustarRapidez] agilidad=0 -> rapidez_borrado=${leerRapidezBorradoGameplay1P()}, ` +
      `rapidez_inicio_borrado=${leerRapidezInicioBorradoGameplay1P()}`
    );
    return;
  }
  if (agilidad > limiteTotal) {
    agilidad = limiteTotal;
  }
  const factorLog = Math.log(agilidad + 1) / Math.log(limiteTotal + 1);
  const pctIncremento = maxInc * factorLog;
  escribirRapidecesGameplay1P(
    Math.round(baseRapidezBorrado * (1 + pctIncremento)),
    Math.round(baseInicioBorrado * (1 + pctIncremento))
  );
  console.log(
    `[ajustarRapidez] baseRapidezBorrado=${baseRapidezBorrado}, baseInicioBorrado=${baseInicioBorrado}, ` +
    `agilidad=${agilidad}, factorLog=${factorLog.toFixed(3)}, ` +
    `pctInc=${(pctIncremento*100).toFixed(1)}% -> rapidez_borrado=${leerRapidezBorradoGameplay1P()}, ` +
    `rapidez_inicio_borrado=${leerRapidezInicioBorradoGameplay1P()}`
  );
}

function aplicarAtributos() {
  const attrs = leerAtributosGameplay1P();
  const fuerza = Number(attrs.fuerza) || 0;
  const agilidad = Number(attrs.agilidad) || 0;
  const destreza = Number(attrs.destreza) || 0;
  const secsBase = leerSecsBaseGameplay1P();

  if (typeof secsBase === 'number' && Number.isFinite(secsBase)) {
    secs_palabras = ajustarFuerza(secsBase, fuerza);
  }

  ajustarRapidez(RAPIDEZ_BORRADO_BASE, RAPIDEZ_INICIO_BORRADO_BASE, agilidad);
  TIEMPO_INVERSO = ajustarDestreza(TIEMPO_INVERSO_BASE, destreza);
  TIEMPO_BORROSO = ajustarDestreza(TIEMPO_BORROSO_BASE, destreza);
  TIEMPO_BORRADO = ajustarDestreza(TIEMPO_BORRADO_BASE, destreza);
}
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

