var socket = io('http://localhost:3000');
const log = console.log;

const getEl = id => document.getElementById(id);

let nombre = getEl("nombre");
let editor = getEl("texto");
let puntos = getEl("puntos");
let nivel = getEl("nivel");
let objetivo = getEl("objetivo");
let palabra = getEl("palabra");
let tiempo = getEl("tiempo");

let definicion = getEl("definicion");

let nombre1 = getEl("nombre1");
let editor1 = getEl("texto1");
let puntos1 = getEl("puntos1");
let nivel1 = getEl("nivel1");
let objetivo1 = getEl("objetivo1");

socket.on('nombre2', data => {
    nombre1.value = data;
});

socket.on('texto2', data => {
    editor1.value = data.text1;
    document.getElementById("puntos1").innerHTML =   data.points1;
    document.getElementById("nivel1").innerHTML =  data.level1;
    editor1.style.height = "5px";
    editor1.style.height = (editor1.scrollHeight)+"px";
});

socket.on('nombre1', data => {
    nombre.value = data;
});

socket.on('texto1', data => {
    editor.value = data.text;
    document.getElementById("puntos").innerHTML =  data.points;
    document.getElementById("nivel").innerHTML =  data.level;
    editor.style.height = "5px";
    editor.style.height = (editor.scrollHeight)+"px";
});

socket.on('count', data => {
    document.getElementById("tiempo").innerHTML =  data
    if(data == "¡Terminado!"){
        document.getElementById("texto1").disabled=true;
        document.getElementById("texto").disabled=true;
        clearTimeout(borrado);
        clearTimeout(borrado1);
    }
});


nombre1.addEventListener("keydown", evt => {
    let name1 = nombre1.value;
    socket.emit('nombre2', name1);
});

nombre1.addEventListener("keyup", evt => {
    let name1 = nombre1.value;
    socket.emit('nombre2', name1);
});

nombre1.addEventListener("input", evt => {
    let name1 = nombre1.value;
    socket.emit('nombre2', name1);
});

nombre1.addEventListener("keypress", evt => {
    let name1 = nombre1.value;
    socket.emit('nombre2', name1);
});

nombre.addEventListener("keydown", evt => {
    let name = nombre.value;
    socket.emit('nombre1', name);
});

nombre.addEventListener("keyup", evt => {
    let name = nombre.value;
    socket.emit('nombre1', name);
});

nombre.addEventListener("input", evt => {
    let name = nombre.value;
    socket.emit('nombre1', name);
});

nombre.addEventListener("keypress", evt => {
    let name = nombre.value;
    socket.emit('nombre1', name);
});

socket.on('nombre2', data => {
    nombre1.value = data;
});

socket.on('compartir_palabra', data => {
    document.getElementById("palabra").innerHTML ='(+50 pts) palabra: ' + data.value[0];
    definicion.innerHTML = data.value[1];
});