let borrado; // Variable que almacena el identificador de la funciÃ³n temporizada de borrado.
let atributos;
const LIMITE_TOTAL = 10;
const SECS_BASE = 2;
const maxIncremento = 3; // queremos +300% de habilidades en el mejor caso
const maxIncrementoDestreza = 0.5; // reducciÃ³n mÃ¡xima de desventajas
let secs_palabras = SECS_BASE;
let antiguo_inicio_borrado = 3000;
let rapidez_borrado = 3000; // Variable que almacena la velocidad del borrado del texto.
let antiguo_rapidez_borrado = 3000;
let rapidez_inicio_borrado = 3000; // Variable que almacena el tiempo de espera sin escribir hasta que empieza a borrar el texto.
let asignada = false; // Variable boolena que dice si hay una palabra bonus asignada.
let palabra_actual = ""; // Variable que almacena la palabra bonus actual.
let puntos_palabra = 0; // Variable que almacena los puntos obtenidos por meter palabras bonus.
let terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
let countInterval; // Variable que almacena el identificador de la funciÃ³n que serÃ¡ ejecutada cada x segundos para uso para actualizar el contador.
let intervaloID_temp_modos;
let cambio_palabra; // Variable que almacena el identificador de la funciÃ³n temporizada de cambio de palabra.
let blurreado = false; // Variable booleana que si alguno de los dos textos ha sido blurreado.
let puntuacion = 0; // Variable entera que almacena la puntuaciÃ³n de la palabra bonus.
let puntos_ = 0; // Puntos del jugador 1.
let puntos_escritura = 0;
let puntuacion_acumulada_j2 = 0;
let delay_animacion;
let delay_animacion_tiempo;
let envio_puntos;
let caracteres_seguidos = 0;
puntos_letra_prohibida = 0;
puntos_letra_bendita = 0;
//let saltos_lÃ­nea_alineacion_1 = 0; // Variable entera que almacena los saltos de lÃ­nea del jugador 1 para alÃ­near los textos.
//let saltos_lÃ­nea_alineacion_2 = 0; // Variable entera que almacena los saltos de lÃ­nea del jugador 2 para alÃ­near los textos.
const color_negativo = "red";
const color_positivo = "greenyellow";
let isFullscreen = false;
let menu_modificador = false;
let focusedButtonIndex = 0;
let modificadorButtons = [];
let locura = false;

let lastLine;
let lastTextNode;

let caretPos;
let caretNode;

if (typeof window !== "undefined") {
  const compartidoJuego1P = window.scrib1pGameplayShared || {};
  Object.defineProperties(compartidoJuego1P, {
    LIMITE_TOTAL: {
      configurable: true,
      enumerable: true,
      get: () => LIMITE_TOTAL
    },
    SECS_BASE: {
      configurable: true,
      enumerable: true,
      get: () => SECS_BASE
    },
    maxIncremento: {
      configurable: true,
      enumerable: true,
      get: () => maxIncremento
    },
    maxIncrementoDestreza: {
      configurable: true,
      enumerable: true,
      get: () => maxIncrementoDestreza
    },
    rapidez_borrado: {
      configurable: true,
      enumerable: true,
      get: () => rapidez_borrado,
      set: (valor) => {
        rapidez_borrado = valor;
      }
    },
    rapidez_inicio_borrado: {
      configurable: true,
      enumerable: true,
      get: () => rapidez_inicio_borrado,
      set: (valor) => {
        rapidez_inicio_borrado = valor;
      }
    },
    borrado: {
      configurable: true,
      enumerable: true,
      get: () => borrado,
      set: (valor) => {
        borrado = valor;
      }
    },
    countInterval: {
      configurable: true,
      enumerable: true,
      get: () => countInterval,
      set: (valor) => {
        countInterval = valor;
      }
    },
    intervaloID_temp_modos: {
      configurable: true,
      enumerable: true,
      get: () => intervaloID_temp_modos,
      set: (valor) => {
        intervaloID_temp_modos = valor;
      }
    },
    cambio_palabra: {
      configurable: true,
      enumerable: true,
      get: () => cambio_palabra,
      set: (valor) => {
        cambio_palabra = valor;
      }
    },
    terminado: {
      configurable: true,
      enumerable: true,
      get: () => terminado,
      set: (valor) => {
        terminado = valor;
      }
    },
    atributos: {
      configurable: true,
      enumerable: true,
      get: () => atributos,
      set: (valor) => {
        atributos = valor;
      }
    }
  });
  window.scrib1pGameplayShared = compartidoJuego1P;
}

