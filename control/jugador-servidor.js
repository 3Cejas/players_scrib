//var socket = io('https://scri-b.up.railway.app/');
var socket = io('http://localhost:3000/');
const log = console.log;

const getEl = id => document.getElementById(id);

let nombre = getEl("nombre");
let editor = getEl("texto");
let puntos = getEl("puntos");
let nivel = getEl("nivel");
let objetivo = getEl("objetivo");
let palabra = getEl("palabra");
let tiempo = getEl("tiempo");
let feedback1 = getEl("feedback1");

let definicion = getEl("definicion");

let nombre1 = getEl("nombre1");
let editor1 = getEl("texto1");
let puntos1 = getEl("puntos1");
let nivel1 = getEl("nivel1");
let objetivo1 = getEl("objetivo1");
let feedback2 = getEl("feedback2");

let tempo_text_borroso;


socket.on('texto2', data => {
    editor1.value = data.text1;
    document.getElementById("puntos1").innerHTML = data.points1;
    document.getElementById("nivel1").innerHTML = data.level1;
    editor1.style.height = "5px";
    editor1.style.height = (editor1.scrollHeight) + "px";
});

socket.on('texto1', data => {
    editor.value = data.text;
    document.getElementById("puntos").innerHTML = data.points;
    document.getElementById("nivel").innerHTML = data.level;
    editor.style.height = "5px";
    editor.style.height = (editor.scrollHeight) + "px";
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
    socket.emit('nombre2', name1);
});

nombre.addEventListener("input", evt => {
    let name = nombre.value;
    socket.emit('nombre1', name);
});

socket.on('nombre2', data => {
    nombre1.value = data;
});

function animacion_modo() {
    const animateCSS = (element, animation, prefix = 'animate__') =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}