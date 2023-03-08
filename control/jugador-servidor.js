const remoteServerUrl = 'https://scri-b.up.railway.app';
const localServerUrl = 'http://localhost:3000';

// Se establece la conexión con el servidor.
let socket = io(localServerUrl);

socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
    socket.io.uri = remoteServerUrl;
    socket.connect();
  });

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
        clearTimeout(borrado);
        clearTimeout(borrado1);
    }
});

nombre1.addEventListener("input", evt => {
    let name1 = nombre1.value;
    socket.emit('envío_nombre1', name1);
});

nombre2.addEventListener("input", evt => {
    let name = nombre2.value;
    socket.emit('envío_nombre2', name);
});

socket.on("recibir_postgame1", (data) => {
    postgame2 = "\n🖋️ Caracteres escritos = " + data.longitud + "\n📚 Palabras bonus = " + data.puntos_palabra + "\n❌ Letra prohibida = " + data.puntos_letra_prohibida + "\n\n";
});

socket.on("recibir_postgame2", (data) => {
    postgame1 = "\n🖋️ Caracteres escritos = " + data.longitud + "\n📚 Palabras bonus = " + data.puntos_palabra + "\n❌ Letra prohibida = " + data.puntos_letra_prohibida + "\n";
});

function descargar_textos() {
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").value + "\r\n\n" + document.getElementById("puntos").innerHTML + "\r\n\n" + document.getElementById("texto").value + "\r\n" + postgame1 + "\n\n" + document.getElementById("nombre1").value + "\r\n\n" + document.getElementById("puntos1").innerHTML + "\r\n\n" + document.getElementById("texto1").value + "\n" + postgame2], { type: "text/plain" }));
    a.download = document.getElementById("nombre").value + ' VS ' + document.getElementById("nombre1").value + '.txt';
    a.click();
}