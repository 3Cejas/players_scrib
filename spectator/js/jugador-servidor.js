// Se establece la conexión con el servidor.
serverUrl = window.location.href.startsWith('file:')
    ? 'http://localhost:3000'
    : 'https://scri-b.up.railway.app';

const socket = io(serverUrl);

const getEl = id => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let nivel1 = getEl("nivel");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");

let logo = getEl("logo");
let palabra1 = getEl("palabra");
let definicion1 = getEl("definicion");
let explicación = getEl("explicación");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tema = getEl("temas");

// COMPONENTES DEL JUGADOR 2
let nombre2 = getEl("nombre1");
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let nivel2 = getEl("nivel1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");

let focalizador1 = getEl("focalizador1");
let focalizador2 = getEl("focalizador2");
let focalizador_id = 1;

let clasificacion = getEl("clasificacion");

// Variables de los modos.
let modo_actual = "";
let tempo_text_borroso;
let listener_modo;
let jugador_psico;

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    'palabras bonus': function (data) {
        explicación.innerHTML = "MODO PALABRAS BONUS";
    },

    //Recibe y activa el modo letra prohibida.
    'letra prohibida': function (data) {
        explicación.innerHTML = "MODO LETRA PROHIBIDA";
        palabra1.innerHTML = "LETRA PROHIBIDA: " + data.letra_prohibida;
        definicion1.innerHTML = "";
    },

    //Recibe y activa el modo letra bendita.
    'letra bendita': function (data) {
        explicación.innerHTML = "MODO LETRA BENDITA";
        palabra1.innerHTML = "LETRA BENDITA: " + data.letra_bendita;
        definicion1.innerHTML = "";
    },

    //Recibe y activa el modo borroso.
    'texto borroso': function (data) {
        explicación.innerHTML = "MODO TEXTO NUBLADO";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        console.log(data.duracion)
        if (data.jugador == 1) {
            texto1.classList.add('textarea_blur');
            tempo_text_borroso = setTimeout(function () {
                texto1.classList.remove('textarea_blur');
                texto2.classList.add('textarea_blur');;
            }, data.duracion);
        }
        if (data.jugador == 2) {
            texto2.classList.add('textarea_blur');
            tempo_text_borroso = setTimeout(function () {
                texto2.classList.remove('textarea_blur');
                texto1.classList.add('textarea_blur');;
            }, data.duracion);
        }
    },

    'psicodélico': function (data) {
        //explicación.innerHTML = "MODO PSICODÉLICO";
        //palabra1.innerHTML = "";
        //definicion1.innerHTML = "";
        jugador_psico = Math.floor(Math.random() * 2 + 1);
    },

    'texto inverso': function (data) {
        explicación.innerHTML = "MODO TEXTO INVERSO";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
    },

    '': function (data) {
    }
};

const LIMPIEZAS = {
    "palabras bonus": function (data) { },

    "letra prohibida": function (data) { },

    "letra bendita": function (data) { },

    "texto borroso": function (data) {
        texto1.classList.remove("textarea_blur");
        texto2.classList.remove("textarea_blur");
    },

    psicodélico: function (data) {
        jugador_psico = 0;
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
    },

    "texto inverso": function (data) {
        texto1.value =
            //crear_n_saltos_de_linea(saltos_línea_alineacion_2) +
            //eliminar_saltos_de_linea(texto2.value)
            texto1.value
                .split("")
                .reverse()
                .join("")
                .split(" ")
                .reverse()
                .join(" ");

        texto2.value =
            //crear_n_saltos_de_linea(saltos_línea_alineacion_2) +
            //eliminar_saltos_de_linea(texto2.value)
            texto2.value
                .split("")
                .reverse()
                .join("")
                .split(" ")
                .reverse()
                .join(" ");
    },

    "": function (data) { },
};

// Recibe los datos del jugador 1 y los coloca.
socket.on('texto1', data => {
    texto1.value = data.text;
    puntos1.innerHTML = data.points;
    cambiar_color_puntuación()
    nivel1.innerHTML = data.level;
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

socket.on('texto2', data => {
    texto2.value = data.text;
    puntos2.innerHTML = data.points;
    cambiar_color_puntuación()
    nivel2.innerHTML = data.level;
    if (jugador_psico == 2) {
        stylize();
    }
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.value = "\n" + texto1.value

        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value
        }
    }*/
    //texto2.style.height = (texto2.scrollHeight) + "px";
    texto2.scrollTop = texto2.scrollHeight;
    //window.scrollTo(0, document.body.scrollHeight);
    //focalizador2.scrollIntoView(false);
});

activar_sockets_extratextuales()

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", data => {
    if (data == "00:20") {
        tiempo.style.color = "yellow"
    }
    if (data == "00:10") {
        MODOS["psicodélico"](data, socket);
        tiempo.style.color = "red"
    }
    tiempo.innerHTML = data;
    if (data == "¡Tiempo!") {
        LIMPIEZAS[modo_actual](data);
        
        limpiezas_final();

        activar_sockets_extratextuales();
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
        texto2.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
        texto2.style.height = (texto2.scrollHeight) + "px";// Reajustamos el tamaño del área de texto del j2.

        logo.innerHTML = "<p class='sub'>powered by</p><img src='../img/logo.png' alt='' width='5%' />";    
    }
});

// Inicia el juego.
socket.on('inicio', data => {

    socket.off('nombre1');
    socket.off('nombre2');
    socket.off('vote');
    socket.off('exit');
    socket.off('scroll');
    socket.off('temas_jugadores');
    socket.off('recibir_comentario');
    socket.off('recibir_postgame1');
    socket.off('recibir_postgame2');

    limpiezas();
    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "3";
    texto2.rows = "3";

    logo.innerHTML = "";

    for (i = 0; i < document.querySelectorAll('.modificador').length; i++) {
        document.querySelectorAll('.modificador')[i].style.display = "none";
    }
    var checkeados = data.checkeados;
    for (var i = 0; i < checkeados.length; i++) {
        getEl(checkeados[i]).style.display = "block";
    }
    
});

// Resetea el tablero de juego.
socket.on('limpiar', data => {

    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on('nombre2', data => {
        nombre2.value = data;
    });

    // Recibe el nombre del jugador 1 y lo coloca en su sitio.
    socket.on('nombre1', data => {
        nombre1.value = data;
    });

    limpiezas();

    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */

    logo.innerHTML = "<p class='sub'>powered by</p><img src='../img/logo.png' alt='' width='5%' />";    
    
    activar_sockets_extratextuales();
});

socket.on('activar_modo', data => {
    animacion_modo();
    LIMPIEZAS[modo_actual](data);
    modo_actual = data.modo_actual;
    MODOS[modo_actual](data);
});

socket.on('recibir_feedback_modificador', data => {
    console.log(data)
    if(data.player == 2){
        getEl(data.id_mod).style.display = "none";
    }
    else{
        getEl(data.id_mod.substring(0, data.id_mod.length - 1) + "1").style.display = "none";
    }
});

socket.on('enviar_palabra', data => {
    recibir_palabra(data);
});

function recibir_palabra(data) {
    animacion_modo();
    palabra1.innerHTML = '(+' + data.puntuacion + ' pts) palabra: ' + data.palabra_bonus[0];
    console.log(data.palabra_bonus[1])
    definicion1.innerHTML = data.palabra_bonus[1];
}

socket.on('feedback_a_j2', data => {
    console.log("HE RECIBIDO EL FEEEDBACK")
    var feedback = document.querySelector(".feedback1");
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

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".feedback1", "bounceInLeft");
    animateCSS('.feedback1', 'bounceInLeft').then((message) => {
        delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    });
});

socket.on('feedback_a_j1', data => {
    var feedback1 = document.querySelector(".feedback2");
    feedback1.style.color = data.color;
    feedback1.innerHTML = data.envio_puntos.toString() + " pts";
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
    animateCSS(".feedback2", "bounceInLeft");
    animateCSS('.feedback2', 'bounceInLeft').then((message) => {
        delay_animacion = setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    });
});

//FUNCIONES AUXILIARES.

function activar_sockets_extratextuales() {

    // Abre la votación de los textos.
    socket.on('vote', data => {
        ventana = window.open("https://www.mentimeter.com/s/0f9582fcdbab7e15216ee66df67113d6/f14a05785a97", '_blank')
    });

    // Cierra la votación de los textos.
    socket.on('exit', data => {
        ventana.close();
    });

    // Realiza el scroll.
    socket.on('scroll', data => {
        if (data == "arriba") {
            window.scrollBy(0, -20);
        }
        else {
            window.scrollBy(0, 20);
        }
    });
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on('nombre2', data => {
        nombre2.value = data;
    });

    // Recibe el nombre del jugador 1 y lo coloca en su sitio.
    socket.on('nombre1', data => {
        nombre1.value = data;
    });

    /*
    Recibe los temas y llama a la función erm() para
    elegir uno aleatoriamente.
    */
    socket.on('temas_espectador', data => {
        temas = data;
        erm();
    });

    socket.on('recibir_comentario', data => {
        tema.innerHTML = data;
    });

    socket.on("recibir_postgame1", (data) => {
        focalizador2.innerHTML = "<br>🖋️ Caracteres escritos = " + data.longitud + "<br>📚 Palabras bonus = " + data.puntos_palabra + "<br>❌ Letra prohibida = " + data.puntos_letra_prohibida + "<br>😇 Letra bendita = " + data.puntos_letra_bendita;
    });

    socket.on("recibir_postgame2", (data) => {
        focalizador1.innerHTML = "<br>🖋️ Caracteres escritos = " + data.longitud + "<br>📚 Palabras bonus = " + data.puntos_palabra + "<br>❌ Letra prohibida = " + data.puntos_letra_prohibida + "<br>😇 Letra bendita = " + data.puntos_letra_bendita;
    });

    socket.on("recibir_clasificacion", (data) => {
        clasificacion.style.display = "block";
        clasificacion.innerHTML = "<center><u><b>CLASIFICACIÓN</b></u><br><br></center>" + "<div class='entry'><div class='chapter'>" + data[1].jugador + " 🏆</div><div class='page'>" + data[1].puntuacion + " pts</div></div>"
        ;       
        for (var i = 2; i < data.length; i++) {
            clasificacion.innerHTML += "<div class='entry'><div class='chapter'>" + data[i].jugador + "</div><div class='page'>" + data[i].puntuacion + " pts</div></div>"
            if(i == 0){
                //nombre.style.fontWeight = puntos.style.fontWeight = "bold";
            }
        }
        clasificacion.innerHTML += "<br><br>"
    });
}

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
    texto1.style.color = "white";
    //texto1.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    //texto1.style.textAlign = "justify";
    //texto2.style.fontFamily = "monospace";
    texto2.style.color = "white";
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
    console.log(puntos1.innerHTML + " " + puntos2.innerHTML)
    console.log(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/) + " " + puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/));
    console.log(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/) > puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))
    if (puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/) > puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/)) {
        console.log("entro")
        puntos1.style.color = "green";
        puntos2.style.color = "red";
        if (puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/) == puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/)) {
            puntos2.style.color = "green";
        }
    }
    else {
        puntos1.style.color = "red";
        puntos2.style.color = "green";
    }
}

function limpiezas(){
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    
    definicion1.innerHTML = "";
    explicación.innerHTML = "";
    
    texto1.value = "";
    texto2.value = "";

    puntos1.innerHTML = "0 puntos";
    puntos2.innerHTML = "0 puntos";
    
    nivel1.innerHTML = "nivel 0";
    nivel2.innerHTML = "nivel 0";
    
    palabra1.innerHTML = "";

    tiempo.style.color = "white"
    puntos1.style.color = "white";
    puntos2.style.color = "white";
    clasificacion.innerHTML = "";
    
    texto1.classList.remove('textarea_blur');
    texto2.classList.remove('textarea_blur');

    focalizador1.innerHTML = "";
    focalizador2.innerHTML = "";

    LIMPIEZAS["psicodélico"]("");

    clearTimeout(tempo_text_borroso);
}

function limpiezas_final(){
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicación.innerHTML = "";

    tiempo.style.color = "white"

    texto1.classList.remove('textarea_blur');
    texto2.classList.remove('textarea_blur');

    LIMPIEZAS["psicodélico"]("");

    clearTimeout(tempo_text_borroso);
}