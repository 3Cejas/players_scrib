let tempo_text_borroso;
let tempo_text_inverso;

let listener_cuenta_atras = null;
let listener_cambio_letra_palabra = null;
let timer = null;
let sub_timer = null;
let preparados_timer = null;
let fallback_cuenta_atras_timer = null;
let final_cuenta_atras_timer = null;
let revision_cuenta_atras_1p = 0;
let inicio_en_progreso_1p = false;
let secondsRemaining = 0;
let secondsPassed = 0;
let duracion_modo_actual_segundos = 0;
let menu_resurreccion_activo = false;
let desventajaEnCurso = false;
let timeout_bloqueo_putada = null;
let timeout_teclado_lento = null;
let teclado_lento_putada = false;
let bloquear_borrado_putada = false;
let desventajaSecuenciaId = 0;
let desventajaDecisionTimeout = null;
let desventajaDecisionInterval = null;
let revision_teclado_lento_1p = 0;

// Variables de los modos.
let modo_actual = "";
let modo_anterior = "";

let putada_actual = "";
let modo_texto_borroso = 0;
let desactivar_borrar = false;
const RETRASO_TECLADO_LENTO_MS = 500;
const RAYO_REDUCCION_K = 0.08;
const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "inline-flex";
const DURACION_ANIMACION_ENTRADA_VIDA_MS = 880;
const animacionesEntradaBarraVida = new WeakMap();
let animacionEntradaVidaPendiente = false;

var nombre = getEl("nombre");

let player = getParameterByName("name");
nombre.value = (player && player.trim() !== "") ? player.toUpperCase() : "ESCRITXR";

metadatos.style = "color:aqua; text-shadow: 0.0625em 0.0625em red;";

