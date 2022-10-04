//var socket = io('https://scri-b.up.railway.app/'); // Se establece la conexión con el servidor.
var socket = io('http://localhost:3000/');
const getEl = id => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let nivel1 = getEl("nivel");
let objetivo1 = getEl("objetivo");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");

let palabra1 = getEl("palabra");
let definicion1 = getEl("definicion");
let explicación = getEl("explicación");
// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");

// COMPONENTES DEL JUGADOR 2
let nombre2 = getEl("nombre1");
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let nivel2 = getEl("nivel1");
let objetivo2 = getEl("objetivo1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");

let tempo_text_borroso;
// Temas aleatorios de la ronda.

let temas;

// Variables de los modos.

let modo_letra_prohibida = false;
let modo_texto_borroso = false;
let modo_psicodélico = false;
let modo_emplatar = false;
let desactivar_borrar = false;

var letra_prohibida = "";

// Cuando jugador 1 pulsa una tecla en su texto, envía los datos de jugador 1 al resto.

texto1.addEventListener("keydown", evt => {
    let text = texto1.value;
    let points = puntos1.textContent;
    let level = nivel1.textContent;
    let word = palabra1.textContent;
    let definicion = definicion1.textContent;
    if(modo_psicodélico == true){
        socket.emit('psico_de_j1');
    }
    socket.emit('texto1',{text, points, level, word, definicion});
});

// Cuando jugador 1 deja de pulsar una tecla en su texto, envía los datos de jugador 1 al resto.

texto1.addEventListener("keyup", evt => {
    let text = texto1.value;
    let points = puntos1.textContent;
    let level = nivel1.textContent;
    let word = palabra1.textContent;
    let definicion = definicion1.textContent;
    socket.emit('texto1',{text, points, level, word, definicion});
});

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.

texto1.addEventListener("input", evt => {
    let text = texto1.value;
    let points = puntos1.textContent;
    let level = nivel1.textContent;
    let word = palabra1.textContent;
    let definicion = definicion1.textContent;
    socket.emit('texto1',{text, points, level, word, definicion});
});

// Cuando jugador 1 mantiene presionada una tecla en su texto, envía los datos de jugador 1 al resto.

texto1.addEventListener("keypress", evt => {
    let text = texto1.value;
    let points = puntos1.textContent;
    let level = nivel1.textContent;
    let word = palabra1.textContent;
    let definicion = definicion1.textContent;
    socket.emit('texto1',{text, points, level, word, definicion});
});

// Recibe el nombre del jugador 2 y lo coloca en su sitio.

socket.on('nombre2', data => {
    nombre2.value = data;
});

// Recibe el nombre del jugador 1 y lo coloca en su sitio.

socket.on('nombre1', data => {
    nombre1.value = data;
});

// Recibe los datos del jugador 2 y los coloca.

socket.on('texto2', data => {
    texto2.value = data.text1;
    puntos2.innerHTML =   data.points1;
    nivel2.innerHTML =  data.level1;
    if(texto2.scrollHeight >= texto1.scrollHeight){
        while(texto2.scrollHeight > texto1.scrollHeight){
            saltos_línea_alineacion_1 += 1;
            texto1.value = "\n" + texto1.value

        }
    }
    else{
        while(texto2.scrollHeight < texto1.scrollHeight){
            saltos_línea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value
        }
    }
    texto1.style.height = (texto1.scrollHeight)+"px";
    texto2.style.height = (texto1.scrollHeight)+"px";
    if(modo_emplatar != true){
    window.scrollTo(0, document.body.scrollHeight);
    (window).on('scroll', onScroll);
    }
});


/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on('count', data => {
    texto1.focus();
    tiempo.innerHTML =  data
    if(data == "¡Tiempo!"){
        texto1.value = (texto1.value).substring(saltos_línea_alineacion_1, texto1.value.length);
        texto2.value = (texto2.value).substring(saltos_línea_alineacion_2, texto2.value.length);
        modo_letra_prohibida = false;
        modo_texto_borroso = false;
        modo_psicodélico = false;
        modo_emplatar = false;
        desactivar_borrar = false;
        letra_prohibida = "";
        texto2.classList.remove('textarea_blur');
        texto1.classList.remove('textarea_blur');
        texto2.disabled=true;
        texto1.disabled=true;
        clearTimeout(borrado);
        clearTimeout(cambio_palabra);
        terminado = true; // Variable booleana que dice si la ronda ha terminado o no.
        rapidez_borrado = 3000;
        rapidez_inicio_borrado = 3000;
        blurreado = false;
        clearTimeout(borrado);
        clearTimeout(cambio_palabra);
        palabra_actual = ""; // Variable que almacena la palabra bonus actual.
        texto1.value = eliminar_saltos_de_linea(texto1.value); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
        texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.
        
        texto1.style.height = "auto";
        texto2.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight)+"px"; //Reajustamos el tamaño del área de texto del j1.
        texto2.style.height = (texto2.scrollHeight)+"px";// Reajustamos el tamaño del área de texto del j2.
        
        /*let a = document.createElement("a");
        a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").value +"\n"+texto1.value +"\n"+ document.getElementById("nombre1").value +"\n"+texto2.value ], {type: "text/plain"}));
        blob = new Blob([document.getElementById("nombre").value +"\n"+texto1.value +"\n"+ document.getElementById("nombre1").value +"\n"+texto2.value ], {type: "text/plain"});
        a.download = 'sesión_player1.txt';
        a.click();*/
    }
});

// Abre la votación de los textos.

socket.on('vote', data => {
    ventana = window.open("https://www.mentimeter.com/s/0f9582fcdbab7e15216ee66df67113d6/f14a05785a97", '_blank')
    
});

// Ciera la votación de los textos.

socket.on('exit', data => {
    ventana.close();
});

/*
Recibe los temas y llama a la función erm() para
elegir uno aleatoriamente.
*/

socket.on('temasj1', data => {
    temas = data;
    erm();
});

// Inicia el juego.

socket.on('inicio', data => {
    nombre1.disabled=true;
    nombre2.disabled=true;
    texto1.value = "";
    texto2.value = "";
    texto1.disabled=false;
    texto2.disabled=true;
    puntos1.innerHTML = "0 puntos";
    puntos2.innerHTML = "0 puntos";
    nivel1.innerHTML = "nivel 0";
    nivel2.innerHTML = "nivel 0";
    palabra1.innerHTML = "";
    texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight)+"px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight)+"px";
    texto1.focus();
    blurreado = false;
    texto2.classList.remove('textarea_blur');
    texto1.classList.remove('textarea_blur');
    definicion1.innerHTML = "";
    explicación.innerHTML = "";
    terminado = false;
    puntos_palabra = 0;
    puntos_neg_por_emplatar = 0;
    saltos_línea_alineacion_1 = 0;
    saltos_línea_alineacion_2 = 0;
});

// Resetea el tablero de juego.

socket.on('limpiar', data => {
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    definicion1.innerHTML = "";
    explicación.innerHTML = "";
    nombre1.value="ESCRITXR 1";
    nombre2.value="ESCRITXR 2";
    nombre1.disabled=true;
    nombre2.disabled=true;
    texto1.value = "";
    texto2.value = "";
    texto1.disabled=true;
    texto2.disabled=true;
    puntos_palabra = 0;
    puntos_neg_por_emplatar = 0;
    asignada = false;
    palabra_actual = ""; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    puntos1.innerHTML = "0 puntos";
    puntos2.innerHTML = "0 puntos";
    nivel1.innerHTML = "nivel 0";
    nivel2.innerHTML = "nivel 0";
    palabra1.innerHTML = "";
    texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight)+"px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight)+"px";
    texto1.focus();
    blurreado = false;
    texto2.classList.remove('textarea_blur');
    texto1.classList.remove('textarea_blur');
    rapidez_borrado = 3000;
    rapidez_inicio_borrado = 3000;
    clearTimeout(borrado)
    clearTimeout(cambio_palabra);
    modo_letra_prohibida = false;
    modo_texto_borroso = false;
    modo_psicodélico = false;
    modo_emplatar = false;
    desactivar_borrar = false;
    letra_prohibida = "";
    restablecer_estilo();
    clearTimeout(tempo_text_borroso);
    saltos_línea_alineacion_1 = 0;
    saltos_línea_alineacion_2 = 0;
});

// Realiza scroll hacia arriba.

socket.on('subir', data => {
    window.scrollBy(0,-20);
});

// Realiza scroll hacia abajo.

socket.on('bajar', data => {
    window.scrollBy(0,20);
});

// Recibe y activa la palabra y el modo bonus.

socket.on('compartir_palabra', data => {
    animacion_modo();
    if(data.modo_actual = "palabras bonus"){
    asignada = true;
    activar_palabras = true;
    palabra_actual = data.palabra_bonus[0];
    explicación.innerHTML = "MODO PALABRAS BONUS";
    palabra1.innerHTML ='(+'+ data.puntuacion+ ' pts) palabra: ' + data.palabra_bonus[0];
    definicion1.innerHTML = data.palabra_bonus[1];
    puntuacion = data.puntuacion;
    indice_buscar_palabra = texto1.value.length -1;
    }
});

socket.on('limpiar_palabras_bonus', data => {
    asignada = false;
});

//Recibe y activa el modo letra prohibida.
socket.on('letra_prohibida', data => {
    animacion_modo();
    modo_letra_prohibida = true
    letra_prohibida = data;
    explicación.innerHTML = "MODO LETRA PROHIBIDA";
    palabra1.innerHTML = "LETRA PROHIBIDA: "+letra_prohibida;
    definicion1.innerHTML = "";
    //socket.emit('')
});

socket.on('limpiar_letra_prohibida', data => {
    modo_letra_prohibida = false;
    letra_prohibida = "";
});

socket.on('texto_borroso', data => {
    animacion_modo();
    modo_texto_borroso = true;
    explicación.innerHTML = "MODO TEXTO BORROSO";
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    if( data == 1){
    texto1.classList.add('textarea_blur');
    tempo_text_borroso = setTimeout(function() { 
        texto1.classList.remove('textarea_blur'); 
        texto2.classList.add('textarea_blur');; }, 30000);
    }
    if(data == 2){
    texto2.classList.add('textarea_blur');
    tempo_text_borroso = setTimeout(function() { 
        texto2.classList.remove('textarea_blur'); 
        texto1.classList.add('textarea_blur');; }, 30000);
    }
    //socket.emit('')
});

socket.on('limpiar_texto_borroso', data => {
    modo_texto_borroso = false;
    texto1.classList.remove('textarea_blur'); 
    texto2.classList.remove('textarea_blur');
});

socket.on('psicodélico', data => {
    modo_psicodélico = true;
    explicación.innerHTML = "MODO PSICODÉLICO";
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    animacion_modo();

});

socket.on('limpiar_psicodélico', data => {
    modo_psicodélico = false;
    restablecer_estilo();
});

socket.on('psico_a_j1', data => {
    if(modo_psicodélico == true){
    stylize();
    }
});

socket.on('texto_inverso', data => {
    animacion_modo();
    desactivar_borrar = true;
    explicación.innerHTML = "MODO TEXTO INVERSO";
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    texto1.value = crear_n_saltos_de_linea(saltos_línea_alineacion_1) + eliminar_saltos_de_linea(texto1.value);
    texto2.value = crear_n_saltos_de_linea(saltos_línea_alineacion_2) + eliminar_saltos_de_linea(texto2.value);
});

socket.on('limpiar_texto_inverso', data => {
    desactivar_borrar = false;
    texto1.value = crear_n_saltos_de_linea(saltos_línea_alineacion_1) + eliminar_saltos_de_linea(texto1.value).split("").reverse().join("").split(" ").reverse().join(" ");
    texto2.value = crear_n_saltos_de_linea(saltos_línea_alineacion_2) + eliminar_saltos_de_linea(texto2.value).split("").reverse().join("").split(" ").reverse().join(" ");

});

socket.on('modo_emplatar', data => {
    desactivar_borrar = true;
    modo_emplatar = true;
    explicación.innerHTML = "MODO EMPLATAR";
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
});

socket.on('feedback_a_j1', data => {
    var feedback = document.querySelector(".feedback2")
    feedback.style.color = data.color;
    feedback.innerHTML = data.envio_puntos.toString() + " pts";
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
  
      node.addEventListener('animationend', handleAnimationEnd, {once: true});
    });
    animateCSS(".feedback2", "bounceInLeft");
    animateCSS('.feedback2', 'bounceInLeft').then((message) => {
      delay_animacion = setTimeout(function(){
          feedback.innerHTML = "";
      }, 2000);
    });
});

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
    texto1.style.fontFamily += getRandFontFamily();
    texto1.style.color = getRandColor();
    //var tamaño_letra = getRandNumber(7, 35) 
    //text.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    texto1.style.textAlign = getTextAlign();
    texto2.style.textAlign = getTextAlign();
    texto2.style.fontFamily += getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    document.body.style.backgroundColor = getRandColor();
    texto1.style.height = texto1.scrollHeight + "px";
    texto2.style.height = texto2.scrollHeight + "px";
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
            onRotate: function () {},//you add these 2 methods to allow the effetct
            stopRotate: function () {}

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

                    socket.emit('envia_temas',array[listItem]);
                    cont.html("<span id='temas' class='temas'><span>" + array[listItem] + "</span></span>");
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

                    

                    settings.onRotate();//this callback will allow to change the speed

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
    var cont = $("#myWords");

    $(function () {
        $("#myWords").wordsrotator({
            animationIn: "fadeOutIn", //css class for entrace animation
            animationOut: "fadeOutDown", //css class for exit animation
            randomize: true,
            stopOnHover: false, //stop animation on hover
            words: temas ,
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
    eventFire(document.getElementById('myWords'), 'click');

}
function animacion_modo(){
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
  
      node.addEventListener('animationend', handleAnimationEnd, {once: true});
    });
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

//Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
function restablecer_estilo(){
    texto1.style.fontFamily = "monospace";
    texto1.style.color = "rgb(155, 155, 155)";
    texto1.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    texto1.style.textAlign = "justify";
    texto2.style.fontFamily = "monospace";
    texto2.style.color = "rgb(155, 155, 155)";
    texto2.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    texto2.style.textAlign = "justify";
    document.body.style.backgroundColor = "black";
    texto1.style.height = texto1.scrollHeight + "px";
    texto2.style.height = texto2.scrollHeight + "px";
}

// Función auxiliar que elimina los saltos de línea al principio de un string.
function eliminar_saltos_de_linea(texto){
    var i = 0;
    while(texto[i] == "\n"){
        i++;
    }
    return (texto.substring(i, texto.length));
}

// Función auxiliar que genera un string con n saltos de línea.
function crear_n_saltos_de_linea(n){
    var saltos = "";
    var cont = 0;
    while(cont <= n){
        saltos += "\n";
        cont++;
    }
    return saltos;
}