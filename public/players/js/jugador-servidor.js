const getEl = id => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let nivel1 = getEl("nivel");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tema = getEl("temas");

let clasificacion = getEl("clasificacion");
let notificacion = getEl("notificacion");
let fin_pag = getEl("fin_pag");
let campo_palabra = getEl("palabra");
let tarea = getEl("tarea");
let mostrar_texto = getEl("mostrar_texto");
let recordatorio = getEl("recordatorio");
let enviarPalabra_boton = getEl("enviar_palabra");
let conteo = getEl("conteo");
let sincro = 0;
let votando = false;
let conteo_palabras = 0;

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

let jugador1 = document.querySelector('.jugador1');
let jugador2 = document.querySelector('.jugador2');


var player = getParameterByName("player");

    if (player == 1) {
        enviar_putada_de_jx = 'enviar_putada_de_j2';
        feedback_a_j_x = 'feedback_a_j1';
        feedback_de_j_x = 'feedback_de_j1';
        texto_x = 'texto1'
        enviar_postgame_x = 'enviar_postgame1';
        recibir_postgame_x = 'recibir_postgame1';
        nombre = 'nombre1';
        //nombre1.value = "ESCRITXR 1" 
        elegir_ventaja = "elegir_ventaja_j1";
        nombre1.style="color:aqua"

    } else if (player == 2) {
        console.log(nombre1.value)
        enviar_putada_de_jx = 'enviar_putada_de_j1';
        feedback_a_j_x = 'feedback_a_j2';
        feedback_de_j_x = 'feedback_de_j2';
        texto_x = 'texto2'
        enviar_postgame_x = 'enviar_postgame2';
        recibir_postgame_x = 'recibir_postgame2';
        nombre = 'nombre2';
        //nombre1.value="ESCRITXR 2";
        elegir_ventaja = "elegir_ventaja_j2"; 
        nombre1.style="color:red" 
    }

// Se establece la conexión con el servidor.
serverUrl = window.location.href.startsWith('file:')
    ? 'http://localhost:3000'
    : 'https://scrib.zeabur.app';

const socket = io(serverUrl);

// Recibe el nombre del jugador 1 y lo coloca en su sitio.

socket.on('modo_actual', (data) => {
    modo_actual = data.modo_actual;
    console.log("Conteo palabras:", 0)
    if(sincro == 1 || votando == true){

    }
    else{
        enviarPalabra_boton.style.display = "";
        campo_palabra.style.display = "";
    if(modo_actual == "letra bendita"){
        letra_bendita = data.letra_bendita;
        pedir_inspiracion({modo_actual, letra_bendita})
    }
    if(modo_actual == "letra prohibida"){
        letra_prohibida = data.letra_prohibida;
        pedir_inspiracion({modo_actual, letra_prohibida})
    }
    if(modo_actual == "palabras bonus"){
        pedir_inspiracion({modo_actual})
    }

    if(modo_actual == "palabras prohibidas"){
        pedir_inspiracion({modo_actual})
    }

    sincro = 0;
    }
});

socket.on('dar_nombre', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR";
    nombre1.innerHTML = nombre;
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    socket.emit('enviar_musa', player);
    socket.emit('pedir_nombre');
});

// Variables de los modos.
let modo_actual = "";
let tempo_text_borroso;
let listener_modo;
let jugador_psico;

// Recibe los datos del jugador 1 y los coloca.
socket.on(texto_x, data => {
    texto1.value = data.text;
    puntos1.innerHTML = data.points;
    //cambiar_color_puntuación()
    nivel1.innerHTML = data.level;
    if(mostrar_texto.value == 1){
        //texto1.style.height = ""; // resetear la altura
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
    }
    if (jugador_psico == 1) {
        stylize();
    }
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.value = "\n" + texto1.value;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value;
        }
    }*/
    //texto1.style.height = (texto1.scrollHeight) + "px";
    texto1.scrollTop = texto1.scrollHeight;
    //window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView(false);
});

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", data => {
    if (data.count == "00:20") {
        tiempo.style.color = "yellow"
    }
    if (data.count == "00:10") {
        tiempo.style.color = "red"
    }
    tiempo.innerHTML = data.count;
    if (data.count == "¡Tiempo!") {
        confetti_aux();

        limpiezas_final();

        //texto1.value = (texto1.value).substring(saltos_línea_alineacion_1, texto1.value.length);
        //texto2.value = (texto2.value).substring(saltos_línea_alineacion_2, texto2.value.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');
        // Variable booleana que dice si la ronda ha terminado o no.
        terminado = true;
        //texto1.value = eliminar_saltos_de_linea(texto1.value); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
        //texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
        mostrar_texto.innerHTML = "Ocultar texto";
        mostrar_texto.value = 1;
        notificacion.style.display = "none";
    }
});

// Inicia el juego.
socket.on('inicio', data => {

    socket.off('vote');
    socket.off('exit');
    socket.off('scroll');
    socket.off('temas_jugadores');
    //socket.off('recibir_comentario');
    socket.off('recibir_postgame1');
    socket.off('recibir_postgame2');

    limpiezas();
    texto1.style.height = "";
    texto1.rows =  "3";
    
});

// Resetea el tablero de juego.
socket.on('limpiar', () => {

    // Recibe el nombre del jugador y lo coloca en su sitio.
    socket.on(nombre, data => {
        nombre1.value = data;
    });

    limpiezas();

    texto1.style.height = "";
    texto1.rows =  "3";
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */
    notificacion.style.display = "none";
});

socket.on("pedir_inspiracion_musa", juego => {
    conteo_palabras = 0;
   pedir_inspiracion(juego);
});

// Recibe el nombre del jugador y lo coloca en su sitio.
socket.on(nombre, data => {
    nombre1.value = data;
});

socket.on(elegir_ventaja, () => {
    votando = true;
    tarea.innerHTML = "<p>¡Tu escritor está realmente inspirado!<br>Elige una ventaja:</p><button class='btn' value = '⚡' onclick='elegir_ventaja_publico(this)'>⚡</button><button class='btn' value = '🌫️' onclick='elegir_ventaja_publico(this)'>🌫️</button><button class='btn' value = '🙃' onclick='elegir_ventaja_publico(this)'>🙃</button><br><br><p style='font-size: 3.5vw;'>⚡ El videojuego borrará más rápido el texto del contrincante.<br><br>🙃 El texto se volverá un espejo para el contrincante.<br><br>🌫️ Una pesada bruma caerá sobre el texto del contrincante.</p>"
    enviarPalabra_boton.style.display = "none";
    campo_palabra.style.display = "none";
    recordatorio.innerHTML = "";
    animateCSS(".notificacion", "flash");
});

function pedir_inspiracion(juego){
    campo_palabra.value = "";
    enviarPalabra_boton.style.display = "";
    campo_palabra.style.display = "";
    modo_actual = juego.modo_actual;
    recordatorio.innerHTML = "";
    conteo.style.display = "";
    conteo.innerHTML =  conteo_palabras + "/" + LIMITE_PALABRAS + " palabras"
    if(juego.modo_actual == "palabras bonus"){
        tarea.innerHTML = "Cantame a mí, <span style='color: orange;'>Musa</span>, una palabra que me inspire:"
    }
    if(juego.modo_actual == "letra bendita") {
        letra = juego.letra_bendita;
        tarea.innerHTML = "Cantame a mí, <span style='color: orange;'>Musa</span>, una palabra que lleve la letra " + "<span style='color: green;'>" + letra.toUpperCase(); + "</span> :";
    }
    if(juego.modo_actual == "letra prohibida") {
        letra = juego.letra_prohibida;
        tarea.innerHTML = "Cantame a mí, <span style='color: orange;'>Musa</span>, una palabra que no lleve la letra " + "<span style='color: red;'>" + letra.toUpperCase(); + "</span> :";
    }

    if(juego.modo_actual == "palabras prohibidas"){
        tarea.innerHTML = "<span style='color: pink;'>Incordia</span> a mi oponente, <span style='color: orange;'>Musa</span>, con una palabra que no pueda usar:";
    } 

    if(juego.modo_actual == "tertulia") {
        conteo.style.display = "none";
        campo_palabra.value = "none";
        enviarPalabra_boton.style.display = "none";
        campo_palabra.style.display = "none";
        tarea.innerHTML = "<br><br><br><span style='color: orange;'>Musa</span>, mira a " + "<span style='color:" + nombre1.style.color + ";'>" +  nombre1.value + "</span>" + " y " + "<span style='color: blue;'>CUENTA</span>" + " todo aquello que le has querido decir hasta ahora.";
    }
     
    notificacion.style.display = "block";
    animateCSS(".notificacion", "flash");
    fin_pag.scrollIntoView({behavior: "smooth", block: "end"});
}

function recibir_palabra(data) {
    animacion_modo();
    palabra1.innerHTML = "(+" + data.puntuacion + " pts) palabra: " + data.palabras_var;
    definicion1.innerHTML = data.palabra_bonus[1];
}

//FUNCIONES AUXILIARES.

function getRandColor() {
    var hex = "01234567890ABCDEF",
        res = "#";
    for (var i = 0; i < 6; i += 1) {
        res += hex[Math.floor(Math.random() * hex.length)];
    }
    return res;
}

function getRandNumber(s, e) {
    return Math.floor(Math.random() * (e - s + 1)) + s;
}

function getRandFontFamily() {
    var fontFamilies = ["Impact", "Georgia", "Tahoma", "Verdana", "Impact", "Marlet"]; // Add more
    return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
}

function getTextAlign() {
    var aligns = ["center", "left", "right", "justify"]; // Add more
    return aligns[Math.floor(Math.random() * aligns.length)];
}

function stylize() {
    //texto1.style.fontFamily = getRandFontFamily();
    texto1.style.color = getRandColor();
    //var tamaño_letra = getRandNumber(7, 35)
    //text.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = getTextAlign();
    //texto2.style.textAlign = getTextAlign();
    //texto2.style.fontFamily = getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    document.body.style.backgroundColor = getRandColor();
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
    document.body.style.backgroundColor = getRandColor();
}


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

// Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
function restablecer_estilo() {
    //texto1.style.fontFamily = "monospace";
    texto1.style.color = "orange";
    //texto1.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = "justify";
    //texto2.style.fontFamily = "monospace";
    //texto2.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto2.style.textAlign = "justify";
    document.body.style.backgroundColor = "black";
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
}

// Función auxiliar que elimina los saltos de línea al principio de un string.
function eliminar_saltos_de_linea(texto) {
    var i = 0;
    while (texto[i] == "\n") {
        i++;
    }
    return (texto.substring(i, texto.length));
}

// Función auxiliar que genera un string con n saltos de línea.
function crear_n_saltos_de_linea(n) {
    var saltos = "";
    var cont = 0;
    while (cont <= n) {
        saltos += "\n";
        cont++;
    }
    return saltos;
}

// FUNCIONES AUXILIARES PARA LA ELECCIÓN ALEATORIA DEL TEMA.
(function ($) {

    $.fn.wordsrotator = function (options) {
        var defaults = {
            autoLoop: true,
            randomize: false,
            stopOnHover: false,
            changeOnClick: false,
            words: null,
            animationIn: "flipInY",
            animationOut: "flipOutY",
            speed: 40,
            onRotate: function () { },//you add these 2 methods to allow the effetct
            stopRotate: function () { }

        };
        var settings = $.extend({}, defaults, options);
        var listItem
        var array_bak = [];
        var stopped = false;

        settings.stopRotate = function () {//you call this one to stop rotate 
            stopped = true;
        }

        return this.each(function () {
            var el = $(this)
            var cont = $("#" + el.attr("id"));
            var array = [];

            //if array is not empty
            if ((settings.words) || (settings.words instanceof Array)) {
                array = $.extend(true, [], settings.words);

                //In random order, need a copy of array
                if (settings.randomize) array_bak = $.extend(true, [], array);

                listItem = 0
                //if randomize pick a random value for the list item
                if (settings.randomize) listItem = Math.floor(Math.random() * array.length)

                //init value into container
                cont.html(array[listItem]);

                // animation option
                var rotate = function () {
                    data = array[listItem]
                    socket.emit('envia_temas', array[listItem]);
                    cont.html("<span id='temas'><span>" + array[listItem] + "</span></span>");
                    texto1.focus();

                    if (settings.randomize) {
                        //remove printed element from array
                        array.splice(listItem, 1);
                        //refill the array from his copy, if empty
                        if (array.length == 0) array = $.extend(true, [], array_bak);
                        //generate new random number
                        listItem = Math.floor(Math.random() * array.length);
                    } else {
                        //if reached the last element of the array, reset the index 
                        if (array.length == listItem + 1) listItem = -1;
                        //move to the next element
                        listItem++;
                    }

                    settings.onRotate(); //this callback will allow to change the speed

                    if (settings.autoLoop && !stopped) {
                        //using timeout instead of interval will allow to change the speed
                        t = setTimeout(function () {
                            rotate()
                        }, settings.speed, function () {
                            rotate()
                        });
                        if (settings.stopOnHover) {
                            cont.hover(function () {
                                window.clearTimeout(t)
                            }, function () {
                                t = setTimeout(rotate, settings.speed, rotate);

                            });
                        };
                    }
                };

                t = setTimeout(function () {
                    rotate()
                }, settings.speed, function () {
                    rotate()
                })
                cont.on("click", function () {
                    if (settings.changeOnClick) {
                        rotate();
                        return false;
                    };
                });
            };

        });
    }

}(jQuery));

function eventFire(el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}

function erm() {
    $(function () {
        $("#temas").wordsrotator({
            animationIn: "fadeOutIn", //css class for entrace animation
            animationOut: "fadeOutDown", //css class for exit animation
            randomize: true,
            stopOnHover: false, //stop animation on hover
            words: temas,
            onRotate: function () {
                //on each rotate you make the timeout longer, until it's slow enough
                if (this.speed < 600) {
                    this.speed += 20;
                } else {
                    this.stopRotate();
                }
            }
        });
    });
    eventFire(document.getElementById('temas'), 'click');
}

function cambiar_color_puntuación() {
    if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) > parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        puntos1.style.color = "green";
        if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) == parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        }
    }
    else {
        puntos1.style.color = "red";
    }
}

function limpiezas(){
    
    texto1.value = "";

    puntos1.innerHTML = 0 + " palabras 🖋️";
   
    nivel1.innerHTML = "🌡️ nivel 0";
    
    tiempo.innerHTML = "";
    tiempo.style.color = "white"
    puntos1.style.color = "white";  
    votando = false;
}

function limpiezas_final(){

    tiempo.style.color = "white";
    votando = false;

}

function confetti_aux(){
    var duration = 15 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
        return clearInterval(interval);
    }

    var particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}