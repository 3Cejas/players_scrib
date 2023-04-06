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
let modificador11 = document.getElementById("tiempo_borrado_menos1");
let modificador12 = document.getElementById("tiempo_borrado_más1");
let modificador13 = document.getElementById("tiempo_muerto1");
let modificador14 = document.getElementById("borroso1");
let modificador15 = document.getElementById("inverso1");


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
let modificador21 = document.getElementById("tiempo_borrado_menos2");
let modificador22 = document.getElementById("tiempo_borrado_más2");
let modificador23 = document.getElementById("tiempo_muerto2");
let modificador24 = document.getElementById("borroso2");
let modificador25 = document.getElementById("inverso2");

let puntuacion_final1 = getEl("puntuacion_final1");
let puntuacion_final2 = getEl("puntuacion_final2");

let clasificacion = getEl("clasificacion");
let modificadores = [modificador11, modificador12, modificador13, modificador14, modificador15, modificador21, modificador22, modificador23, modificador24, modificador25];

let tempo_text_borroso;

let postgame1;
let postgame2;

//const buttons = document.querySelectorAll('button');
let index = 0;

const table = document.querySelector('.default');
const buttons = document.querySelectorAll('button');
const rows = table.rows.length;
const cols = table.rows[0].cells.length;
let focusedRow = 0;
let focusedCol = 0;

buttons[0].focus();

// Función para cambiar el enfoque al botón especificado
function focusButton(row, col) {
    // Desenfocar el botón anterior
    const prevButton = table.rows[focusedRow].cells[focusedCol].querySelector('button');
    if (prevButton) {
      prevButton.blur();
    }
  
    // Enfocar el nuevo botón si existe
    const newButton = table.rows[row].cells[col].querySelector('button');
    if (newButton) {
      newButton.focus();
    }
  
    // Actualizar las variables de fila y columna enfocadas
    focusedRow = row;
    focusedCol = col;
  }
// Manejar las teclas de flecha presionadas
document.addEventListener('keydown', (event) => {
  const key = event.key;
  
  // Flecha arriba
  if (key === 'ArrowUp' && focusedRow > 0) {
    event.preventDefault();
    focusButton(focusedRow - 1, focusedCol);
    if(table.rows[(focusedRow - 1)]){
        table.rows[focusedRow - 1].scrollIntoView({block: "nearest"});
    }
  }
  // Flecha abajo
  else if (key === 'ArrowDown' && focusedRow < rows - 1) {
    event.preventDefault();
    focusButton(focusedRow + 1, focusedCol);
    if(table.rows[(focusedRow + 1)]){
    table.rows[focusedRow + 1].scrollIntoView({block: "nearest"});
    }
  }
  // Flecha izquierda
  else if (key === 'ArrowLeft' && focusedCol > 0) {
    event.preventDefault();
    focusButton(focusedRow, focusedCol - 1);
  }
  // Flecha derecha
  else if (key === 'ArrowRight' && focusedCol < cols - 1) {
    event.preventDefault();
    focusButton(focusedRow, focusedCol + 1);
  }
});

// Añadir el evento de foco a los botones de la tabla


buttons.forEach((button, index) => {
  const row = Math.floor(index / cols);
  const col = index % cols;
  button.addEventListener('focus', () => {
    focusedRow = row;
    focusedCol = col;
  });
  button.dataset.position = `${row}-${col}`;
});

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
  setTimeout(reanudar, 10000);
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