var socket = io('https://scriptbe.herokuapp.com/');
const log = console.log;

const getEl = id => document.getElementById(id);

let  editor = getEl("texto");
let puntos = getEl("puntos");
let nivel = getEl("nivel");
let objetivo = getEl("objetivo");
let palabra = getEl("palabra");
let tiempo = getEl("tiempo");

let editor1 = getEl("texto1");
let puntos1 = getEl("puntos1");
let nivel1 = getEl("nivel1");
let objetivo1 = getEl("objetivo1");
let palabra1 = getEl("palabra1");


editor.addEventListener("keydown", evt => {
    let text = editor.value;
    let points = puntos.textContent;
    let level = nivel.textContent
    let word = palabra.textContent
    socket.emit('texto1',{text, points, level, word});
});

editor.addEventListener("keyup", evt => {
    let text = editor.value;
    let points = puntos.textContent;
    let level = nivel.textContent
    let word = palabra.textContent
    socket.emit('texto1',{text, points, level, word});
});


editor1.addEventListener("keydown", evt => {
    let text1 = editor1.value;
    let points1 = puntos1.textContent;
    let level1 = nivel1.textContent;
    let word1 = palabra1.textContent;
    socket.emit('texto2',{text1, points1, level1, word1});
});

editor1.addEventListener("keyup", evt => {
    let text1 = editor1.value;
    let points1 = puntos1.textContent;
    let level1 = nivel1.textContent;
    let word1 = palabra1.textContent;
    socket.emit('texto2',{text1, points1, level1, word1});
});


editor.addEventListener("keypress", evt => {
    let text1 = editor1.value;
    let points1 = puntos1.textContent;
    let level1 = nivel1.textContent;
    let word1 = palabra1.textContent;
    socket.emit('texto2',{text1, points1, level1, word1});
});

editor.addEventListener("input", evt => {
    let text1 = editor1.value;
    let points1 = puntos1.textContent;
    let level1 = nivel1.textContent;
    let word1 = palabra1.textContent;
    socket.emit('texto2',{text1, points1, level1, word1});
});

editor1.addEventListener("input", evt => {
    let text = editor.value;
    let points = puntos.textContent;
    let level = nivel.textContent
    let word = palabra.textContent
    socket.emit('texto1',{text, points, level, word});
});

editor1.addEventListener("keypress", evt => {
    let text = editor.value;
    let points = puntos.textContent;
    let level = nivel.textContent
    let word = palabra.textContent
    socket.emit('texto1',{text, points, level, word});
});


socket.on('texto1', data => {
    editor.value = data.text;
    document.getElementById("puntos").innerHTML =  data.points;
    document.getElementById("nivel").innerHTML =  data.level;
    document.getElementById("palabra").innerHTML =  data.word;
    editor.style.height = "5px";
    editor.style.height = (editor.scrollHeight)+"px";
    window.scrollTo(0, document.body.scrollHeight);
    (window).on('scroll', onScroll); 
});

socket.on('texto2', data => {
    editor1.value = data.text1;
    document.getElementById("puntos1").innerHTML =   data.points1;
    document.getElementById("nivel1").innerHTML =  data.level1;
    document.getElementById("palabra1").innerHTML =  data.word1;
    editor1.style.height = "5px";
    editor1.style.height = (editor1.scrollHeight)+"px";
    window.scrollTo(0, document.body.scrollHeight);
    (window).on('scroll', onScroll); 
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

socket.on('inicio', data => {
    document.getElementById("texto").value = "";
    document.getElementById("texto1").value = "";
    document.getElementById("texto").disabled=false;
    document.getElementById("texto1").disabled=false;
    document.getElementById("puntos").innerHTML = "0 puntos";
    document.getElementById("puntos1").innerHTML = "0 puntos";
    document.getElementById("nivel").innerHTML = "nivel 0";
    document.getElementById("nivel1").innerHTML = "nivel 0";
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("palabra1").innerHTML = "";
    document.getElementById("texto").style.height = "40";
    document.getElementById("texto").style.height = (document.getElementById("texto").scrollHeight)+"px";

    document.getElementById("texto1").style.height = "40";
    document.getElementById("texto1").style.height = (document.getElementById("texto1").scrollHeight)+"px";
});
