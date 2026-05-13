const LISTA_MODOS_INICIAL = ["letra bendita", "letra prohibida", "palabras bonus", "palabras prohibidas", "frase final"];


// Objeto que asocia cada modo con un color
const COLORES_MODOS = {
    "letra bendita": "green",
    "letra prohibida": "red",
    "tertulia": "blue",
    "palabras bonus": "yellow",
    "palabras prohibidas": "pink",
    "frase final": "orange"
};

const letras_prohibidas = (typeof window !== "undefined" && window.ScribLetterFrequency)
    ? [...window.ScribLetterFrequency.ALFABETO_ES]
    : ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','\u00f1','o','p','q','r','s','t','u','v','w','x','y','z'];
const letras_benditas_ponderadas = [...letras_prohibidas];
const frecuencia_letras = (typeof window !== "undefined" && window.ScribLetterFrequency)
    ? window.ScribLetterFrequency.FRECUENCIA_LETRAS_ES
    : {
    'a': 12.53,
    'b': 1.42,
    'c': 4.68,
    'd': 5.86,
    'e': 13.68,
    'f': 0.69,
    'g': 1.01,
    'h': 0.7,
    'i': 6.25,
    'j': 0.44,
    'k': 0.02,
    'l': 4.97,
    'm': 3.15,
    'n': 6.71,
    '\u00f1': 0.31,
    'o': 8.68,
    'p': 2.51,
    'q': 0.88,
    'r': 6.87,
    's': 7.98,
    't': 4.63,
    'u': 3.93,
    'v': 0.90,
    'w': 0.01,
    'x': 0.22,
    'y': 0.90,
    'z': 0.52
};

let letras_benditas_restantes = [...letras_benditas_ponderadas];
let letras_prohibidas_restantes = [...letras_prohibidas];

function elegir_letra_nivel_ponderada(restantes, base, tipo) {
    if (
        typeof window !== "undefined"
        && window.ScribLetterFrequency
        && typeof window.ScribLetterFrequency.elegirLetraPendientePonderada === "function"
    ) {
        return window.ScribLetterFrequency.elegirLetraPendientePonderada({
            pendientes: restantes,
            base,
            tipo
        });
    }
    const lista = Array.isArray(restantes) && restantes.length > 0 ? [...restantes] : [...base];
    const indice = Math.floor(Math.random() * lista.length);
    const letra = lista[indice];
    lista.splice(indice, 1);
    return {
        letra,
        pendientes: lista.length === 0 ? [...base] : lista
    };
};

const palabras_prohibidas = [
    "de", "la", "que", "el", "en", "y", "a", "los", "se", "del",
    "las", "un", "por", "con", "no", "una", "su", "para", "es", "al",
    "lo", "como", "más", "o", "pero", "sus", "le", "ha", "me", "si",
    "sin", "sobre", "este", "ya", "entre", "cuando", "todo", "esta", "ser", "son",
    "dos", "también", "fue", "había", "era", "muy", "años", "hasta", "desde", "está"
];

const frases_finales = [
    "No hay nada que hacer: criaremos a los nuestros",
    "Cuando todo parecía perennemente feliz",
    "Nada es intercurrente",
    "Pudo ser el calor del verano",
    "Mataste a tus verdaderos padres",
    "Chillé y salí corriendo",
    "Y me desperté",
    "Habla, es lunes",
    "Nada mejor para aleonar el espíritu del Oeste",
    "Te perdono, mamá",
    "Me duele, pero prefiero que nos separemos",
    "Te estoy diciendo que te tienes que unir",
    "Alócate, coño",
    "No podía respirar",
    "Te van a dar varias hostias hagas lo que hagas",
    "Yo soy el autor de todo",
    "Lo flipo",
    "No consigo separar mis pensamientos",
    "Y la palabra de Marx será olvidada como la de todos",
    "Igual se han caído en el baño",
    "¿Sabes quién soy?",
    "No me importa que lo esté pasando mal",
    "Me gusta mucho esto de luchar",
    "¡Que viva este equipo!",
    "Se dedica a algo de la sanidad así que es parecido",
    "No puedo más",
    "Yo voté al partido",
    "Eres como la heroína, me matas",
    "Eras el amor de mi vida. En fin",
    "Te han robado twitter",
    "Ahora comienza el viaje",
    "Un lugar donde todo sale mal",
    "No es por ti, es por mí",
    "¡Dime qué quieres!",
    "Debe haber algo permanente en este cambiante cosmos",
    "Esperemos a que salga el sol",
    "Mierda",
    "¡Basta ya de tanta guerra!",
    "Siempre hay tiempo para volver a empezar",
    "Y pasarán muchos años más",
    "Me confundió un poco",
    "¡Que se callen!",
    "¡Tú nunca venías!",
    "Porque esta ciudad lo es todo, TODO",
    "Quizá algún día me vuelva a necesitar. Llámeme entonces"
];

let palabras_prohibidas_restantes = [...palabras_prohibidas];
const TOP_K_PALABRAS_MALDITAS = 5;
let palabras_top_usadas = new Set();

function normalizar_texto_maldito(texto) {
    return (texto || "")
        .toLowerCase()
        .replace(/[^a-záéíóúüñ\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function obtener_top_palabras_malditas(texto, k) {
    const limpio = normalizar_texto_maldito(texto);
    if (!limpio) return [];

    const conteo = new Map();
    limpio.split(" ").forEach(palabra => {
        if (palabra.length < 1) return;
        conteo.set(palabra, (conteo.get(palabra) || 0) + 1);
    });

    return Array.from(conteo.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([palabra]) => palabra)
        .slice(0, k);
}

var letra_prohibida = "";
var letra_bendita = "";
let listener_modo;
let listener_modo1;
let timeoutID_menu;
let listener_modo_psico;
let activado_psico = false;
let temp_text_inverso_activado = false;

var TIEMPO_INVERSO = 20000;
var TIEMPO_BORROSO = 20000;
var TIEMPO_BORRADO = 20000;
var TIEMPO_CAMBIO_MODOS = 5000;
var TIEMPO_CAMBIO_LETRA = 5000;
var TIEMPO_CAMBIO_PALABRA = 5000;
var TIEMPO_INICIAL = 20000;

const TIEMPO_INVERSO_BASE = TIEMPO_INVERSO;
const TIEMPO_BORROSO_BASE = TIEMPO_BORROSO;
const TIEMPO_BORRADO_BASE = TIEMPO_BORRADO;
const DURACION_NIVEL_REFERENCIA_MS = 60000;
const RAPIDEZ_BORRADO_BASE = leerRapidezBorradoGameplay1P();
const RAPIDEZ_INICIO_BORRADO_BASE = leerRapidezInicioBorradoGameplay1P();
const mainTitle = document.querySelector('.main-title');
const buttonContainer = document.querySelector('.button-container');

function obtenerDuracionNivelActualMs() {
  const nivelMs = Number(TIEMPO_CAMBIO_MODOS);
  if (!Number.isFinite(nivelMs) || nivelMs <= 0) {
    return DURACION_NIVEL_REFERENCIA_MS;
  }
  return nivelMs;
}

function calcularDuracionDesventajaMs(baseMs) {
  const base = Number(baseMs);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const nivelActual = obtenerDuracionNivelActualMs();
  const escalada = Math.round((base / DURACION_NIVEL_REFERENCIA_MS) * nivelActual);
  // Nunca superar la duracion del nivel.
  return Math.min(nivelActual, Math.max(1, escalada));
}

