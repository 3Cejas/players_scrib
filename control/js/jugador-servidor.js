// Se establece la conexión con el servidor.
serverUrl = window.location.href.startsWith('file:')
    ? 'http://localhost:3000'
    : 'https://scri-b.up.railway.app';

const socket = io(serverUrl);
  
const getEl = id => document.getElementById(id);

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let nivel1 = getEl("nivel");
let objetivo1 = getEl("objetivo");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");
let votos1 = getEl("votos");



let palabra1 = getEl("palabra");
let definicion1 = getEl("definicion");
let explicación = getEl("explicación");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tema = getEl("temas");
let span_pausar_reanudar = getEl("pausar_reanudar");
let boton_pausar_reanudar = getEl("boton_pausar_reanudar");
let boton_borrar = getEl("boton_borrar");

boton_borrar.style.backgroundColor = "red";


let temporizador = getEl("temporizador");

// COMPONENTES DEL JUGADOR 2
let nombre2 = getEl("nombre1");
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let nivel2 = getEl("nivel1");
let objetivo2 = getEl("objetivo1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");
let votos2 = getEl("votos1");

let puntuacion_final1 = getEl("puntuacion_final1");
let puntuacion_final2 = getEl("puntuacion_final2");

let clasificacion = getEl("clasificacion");

let tempo_text_borroso;

let postgame1;
let postgame2;

let texto_guardado1 = "";
let texto_guardado2 = "";

let DURACION_TIEMPO_MODOS = 300;
const DURACION_TIEMPO_MUERTO = DURACION_TIEMPO_MODOS * 1000;
let TIEMPO_CAMBIO_MODOS = DURACION_TIEMPO_MODOS - 1


let val_nombre1 = nombre1.value.toUpperCase();
socket.emit('envío_nombre1', val_nombre1);

let val_nombre2 = nombre2.value.toUpperCase();
  socket.emit('envío_nombre2', val_nombre2);

// Recibe los datos del jugador 1 y los coloca.
socket.on('texto1', data => {
    texto1.value = data.text;
    puntos1.innerHTML = data.points;
    nivel1.innerHTML = data.level;
    texto1.style.height = (texto1.scrollHeight) + "px";
});

socket.on('texto2', data => {
    texto2.value = data.text;
    puntos2.innerHTML = data.points;
    nivel2.innerHTML = data.level;
    texto2.style.height = (texto1.scrollHeight) + "px";

});

socket.on('count', data => {
    document.getElementById("tiempo").innerHTML = data
    if (data == "¡Tiempo!") {
        document.getElementById("texto1").disabled = true;
        document.getElementById("texto").disabled = true;
        clearInterval(countInterval);
    }
});

socket.on('tiempo_muerto_control', data => {
  pausar();
  setTimeout(function(){
    secondsPassed = TIEMPO_CAMBIO_MODOS;
    reanudar_modo();
  }, TIEMPO_CAMBIO_MODOS * 1000);
});

nombre1.addEventListener("input", evt => {
    val_nombre1 = nombre1.value.toUpperCase();
    socket.emit('envío_nombre1', val_nombre1);
});

nombre2.addEventListener("input", evt => {
    val_nombre2 = nombre2.value.toUpperCase();
    socket.emit('envío_nombre2', val_nombre2);
});

socket.on("recibir_postgame1", (data) => {
    postgame2 = "\n🖋️ Caracteres escritos = " + data.longitud + "\n📚 Palabras bonus = " + data.puntos_palabra + "\n❌ Letra prohibida = " + data.puntos_letra_prohibida + "\n\n";
});

socket.on("recibir_postgame2", (data) => {
    postgame1 = "\n🖋️ Caracteres escritos = " + data.longitud + "\n📚 Palabras bonus = " + data.puntos_palabra + "\n❌ Letra prohibida = " + data.puntos_letra_prohibida + "\n";
});

socket.on("aumentar_tiempo_control", (secs) => {
  addSeconds(secs);
});

socket.on("locura", () => {
    socket.emit('enviar_comentario', "🔥 DIFICULTAD MÁXIMA 🔥");
    DURACION_TIEMPO_MODOS = 30;
    secondsPassed = 0;
    TIEMPO_CAMBIO_MODOS = DURACION_TIEMPO_MODOS - 1
  });

function descargar_textos() {
    var a = document.createElement("a");
    texto1.value = texto_guardado1;
    texto2.value = texto_guardado2;
    a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").value + "\r\n\n" + document.getElementById("puntos").innerHTML + "\r\n\n" + document.getElementById("texto").value + "\r\n" + postgame1 + "\n\n" + document.getElementById("nombre1").value + "\r\n\n" + document.getElementById("puntos1").innerHTML + "\r\n\n" + document.getElementById("texto1").value + "\n" + postgame2], { type: "text/plain" }));
    a.download = val_nombre1 + ' VS ' + val_nombre2 + '.txt';
    a.click();
}