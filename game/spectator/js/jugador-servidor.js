// Se establece la conexión con el servidor.
serverUrl = window.location.href.startsWith('file:')
    ? 'http://localhost:3000'
    : 'https://sutura.ddns.net:3000';

const socket = io(serverUrl);

const getEl = id => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");
let musas1 = getEl("musas");


let logo = getEl("logo");
let palabra1 = getEl("palabra");
let definicion1 = getEl("definicion");
let explicación = getEl("explicación");

let palabra2 = getEl("palabra1");
let definicion2 = getEl("definicion1");
let explicación1 = getEl("explicación1");

let palabra3 = getEl("palabra2");
let definicion3 = getEl("definicion2");
let explicación2 = getEl("explicación2");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tiempo1 = getEl("tiempo1");
let tema = getEl("temas");
let info = getEl("info");
let info1 = getEl("info1");
let info2= getEl("info2");
let inspiracion = getEl("inspiracion");

// COMPONENTES DEL JUGADOR 2
let nombre2 = getEl("nombre1");
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");
let musas2 = getEl("musas1");

let focalizador1 = getEl("focalizador1");
let focalizador2 = getEl("focalizador2");
let focalizador_id = 1;
let feedback_tiempo = getEl("feedback_tiempo");

// Variables de los modos.
let terminado = false;
let terminado1 = false;
let modo_actual = "";
let tempo_text_inverso1;
let tempo_text_inverso2;
let tempo_text_borroso1;
let tempo_text_borroso2;
let listener_modo;
let activado_psico1 = false;
let activado_psico2 = false;
let listener_cuenta_atras = null;
let timeout_countdown;
let timeout_timer;
let Temasinterval;
let sonido_confetti_musa;
let sonido_confetti;
let audio_inverso;
let audio_borroso;
let sonido_modo;
let intervaloSonidoRayo;
let timer = null;
const color_negativo = "red";
const color_positivo = "greenyellow";
let TIEMPO_BORRADO;
let TIEMPO_INVERSO;
let TIEMPO_BORROSO;

let sonido;

animateCSS(".cabecera", "backInLeft").then((message) => {
    animateCSS(".contenedor", "pulse");
});
//reproducirSonido("../../game/audio/1. MENU DE INICIO.mp3", true)

const PUTADAS = {
    "🐢": function () {
        
    },
    "⚡": function (player) {
        if(player == 1){
            document.body.classList.add("bg");
            document.body.classList.add("rain");
            lightning.classList.add("lightning")
            lightning.style.right = "45%";
            lightning.style.left = "0%";
            reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
            intervaloSonidoRayo = setInterval(() => {
                reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
            }, 4000);
            setTimeout(function () {
                clearInterval(intervaloSonidoRayo);
                document.body.classList.remove("bg");
                document.body.classList.remove("rain");
                lightning.classList.remove("lightning");
            }, TIEMPO_BORRADO);
        }
        else if(player == 2){
            document.body.classList.add("bg");
            document.body.classList.add("rain");
            lightning.classList.add("lightning")
            lightning.style.right = "0%";
            lightning.style.left = "45%";
            reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
            intervaloSonidoRayo = setInterval(() => {
                reproducirSonido("../../game/audio/FX/6. TRUENO 1.mp3");
            }, 4000)
            setTimeout(function () {
                clearInterval(intervaloSonidoRayo);
                document.body.classList.remove("bg");
                document.body.classList.remove("rain");
                lightning.classList.remove("lightning");
            }, TIEMPO_BORRADO);
        }
    },

    "⌛": function () {

    },
    "🙃": function (player) {
        audio_inverso = reproducirSonido("../../game/audio/FX/8. INVERSO LOOP.mp3", true)
        if(player == 1){
            texto1.classList.add("rotate-vertical-center");
            // Añade un escuchador para el evento 'animationend'
            texto1.addEventListener('animationend', function() {
                texto1.classList.remove("rotate-vertical-center");
                texto1.removeEventListener('animationend', arguments.callee);
            });
            tempo_text_inverso1 = setTimeout(function () {
                audio_inverso.pause();
                texto1.classList.add("rotate-vertical-center");
                texto1.addEventListener('animationend', function() {
                    texto1.classList.remove("rotate-vertical-center");
                    texto1.removeEventListener('animationend', arguments.callee);
                });
            }, TIEMPO_INVERSO);
        }
        else if(player == 2){
            texto2.classList.add("rotate-vertical-center");
            // Añade un escuchador para el evento 'animationend'
            texto2.addEventListener('animationend', function() {
                texto2.classList.remove("rotate-vertical-center");
                texto2.removeEventListener('animationend', arguments.callee);
            });
            tempo_text_inverso2 = setTimeout(function () {
                audio_inverso.pause();
                texto2.classList.add("rotate-vertical-center");
                texto2.addEventListener('animationend', function() {
                    texto2.classList.remove("rotate-vertical-center");
                    texto2.removeEventListener('animationend', arguments.callee);
                });
            }, TIEMPO_INVERSO);
        }
    },

    "🌪️": function (player) {
        audio_borroso = reproducirSonido("../../game/audio/FX/7. REMOLINO PARA LOOP.mp3", true)
        modo_texto_borroso1 = true;
        tiempo_inicial = new Date();
        if(player == 1){
            texto1.classList.add("textarea_blur");
            tempo_text_borroso1 = setTimeout(function () {
            audio_borroso.pause();
            temp_text_borroso_activado1 = true;
            texto1.classList.remove("textarea_blur");
        }, TIEMPO_BORROSO);
        }
        else if(player == 2){
            modo_texto_borroso2 = true;
            console.log("BORROSO")
            texto2.classList.add("textarea_blur");
            tempo_text_borroso2 = setTimeout(function () {
            audio_borroso.pause();
            temp_text_borroso_activado2 = true;
            texto2.classList.remove("textarea_blur");
        }, TIEMPO_BORROSO);
        }
    },
};

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    'palabras bonus': function (data) {
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true)
    reproducirSonido("../../game/audio/FX/12. PALABRAS BONUS.mp3")
        console.log("ALGO")
        explicación.style.color = "yellow";
        explicación.innerHTML = "MODO PALABRAS BONUS";
        palabra1.innerHTML = "";
        definicion2.innerHTML = "";
        palabra2.style.backgroundColor = "yellow";
        palabra3.style.backgroundColor = "yellow";
        definicion2.style.maxWidth = "100%";
        definicion3.innerHTML = "";
        definicion3.style.maxWidth = "100%";
    },

    //Recibe y activa el modo letra prohibida.
    'letra prohibida': function (data) {
        sonido_modo = reproducirSonido("../../game/audio/6. KEYGEN PRUEBA 2.mp3", true)
        reproducirSonido("../../game/audio/FX/11. LETRA PROHIBIDA.mp3")
        palabra2.innerHTML = "";
        definicion2.innerHTML = "";
        explicación1.innerHTML = "";
        palabra3.innerHTML = "";
        definicion3.innerHTML = "";
        explicación2.innerHTML = "";
        palabra1.style.backgroundColor= "red";
        explicación.style.color = "red";
        explicación.innerHTML = "MODO LETRA PROHIBIDA";
        palabra1.innerHTML = "LETRA MALDITA: " + data.letra_prohibida;
        definicion2.innerHTML = "";
        definicion2.style.maxWidth = "100%";
        definicion3.innerHTML = "";
        definicion3.style.maxWidth = "100%";
        
    },

    //Recibe y activa el modo letra bendita.
    'letra bendita': function (data) {
        reproducirSonido("../../game/audio/FX/10. LETRA BENDITA.mp3")
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true);

        palabra2.innerHTML = "";
        definicion2.innerHTML = "";
        explicación1.innerHTML = "";
        palabra3.innerHTML = "";
        definicion3.innerHTML = "";
        explicación2.innerHTML = "";

        palabra1.style.backgroundColor= "lime";
        explicación.style.color = "lime";
        explicación.innerHTML = "MODO LETRA BENDITA";
        palabra1.innerHTML = "LETRA BENDITA: " + data.letra_bendita;
        definicion2.innerHTML = "";
        definicion2.style.maxWidth = "100%";
        definicion3.innerHTML = "";
        definicion3.style.maxWidth = "100%";
    },

    'psicodélico': function (data, socket, player) {
        //explicación.innerHTML = "MODO PSICODÉLICO";
        //palabra1.innerHTML = "";
        //definicion1.innerHTML = "";
        if (player == 1) {
            activado_psico1 = true;
        }
        else if (player == 2) {
            activado_psico2 = true;
        }

    },

    'palabras prohibidas': function (data) {
        sonido_modo = reproducirSonido("../../game/audio/6. KEYGEN PRUEBA 2.mp3", true)
        reproducirSonido("../../game/audio/FX/13. PALABRAS PROHIBIDAS.mp3")
        palabra2.style.backgroundColor = "pink";
        palabra3.style.backgroundColor = "pink";
        explicación.style.color = "pink";
        explicación.innerHTML = "MODO PALABRAS PROHIBIDAS";
        palabra1.innerHTML = "";
        definicion2.innerHTML = "";
        definicion2.style.maxWidth = "100%";
        definicion3.innerHTML = "";
        definicion3.style.maxWidth = "100%";
    },

    'tertulia': function (socket) {
        sonido_modo = reproducirSonido("../../game/audio/7. KEYGEN PRUEBA 3.mp3", true)
        reproducirSonido("../../game/audio/FX/14. TERTULIA.mp3")
        //activar_socket_feedback();
        explicación.style.color = "blue";
        explicación.innerHTML = "MODO TERTULIA";
        palabra1.innerHTML = "";

    },

    'frase final': function (socket) {
        sonido_modo = reproducirSonido("../../game/audio/5. KEYGEN PRUEBA 1.mp3", true)
        reproducirSonido("../../game/audio/FX/15. FRASE FINAL.mp3")
        //activar_socket_feedback();
        explicación.style.color = "orange";
        explicación.innerHTML = "MODO FRASE FINAL";
        palabra1.innerHTML = "";

    },

    '': function (data) {
    }
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        console.log(sonido_modo)
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        palabra2.innerHTML = "";
        palabra3.innerHTML = "";
        definicion2.innerHTML = "";
        definicion3.innerHTML = "";
    },

    "letra prohibida": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
    },

    "letra bendita": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }
    },

    "psicodélico": function (data, player) {
        if(player == 1){
            activado_psico1 = false;
        }
        else if(player == 2){
            activado_psico2 = false;
        }

        if(activado_psico1 == false && activado_psico2 == false){
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
        }
    },

    "palabras prohibidas": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        palabra2.innerHTML = "";
        palabra3.innerHTML = "";
        definicion2.innerHTML = "";
        definicion3.innerHTML = "";
    },

    "tertulia": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        } 
        
    },

    "frase final": function (data) {
        if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
            sonido_modo.pause();
        }    },

    "": function (data) { },
};

activar_sockets_extratextuales();

socket.on('actualizar_contador_musas', contador_musas => {
    console.log("actualizar_contador_musas")
    musas1.innerHTML = contador_musas.escritxr1 + " musas";
    musas2.innerHTML = contador_musas.escritxr2 + " musas";

});

// Recibe los datos del jugador 1 y los coloca.
socket.on('texto1', data => {
    texto1.innerHTML = data.text;
    puntos1.innerHTML = data.points;
    console.log("CAMBIADDOO")
    cambiar_color_puntuación()
    //establecerPosicionCaret(data.caretPos);
    if (activado_psico1) {
        stylize();
    }
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.innerText = "\n" + texto2.innerText;
        }
    }*/
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto1.scrollTop = texto1.scrollHeight;
    //window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView(false);
});

socket.on('texto2', data => {
    texto2.innerHTML = data.text;
    puntos2.innerHTML = data.points;
    cambiar_color_puntuación()
    if (activado_psico2) {
        stylize();
    }
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText

        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.innerText = "\n" + texto2.innerText
        }
    }*/
    texto2.style.height = (texto2.scrollHeight) + "px";
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
    if(data.player == 1){
    if (convertirASegundos(data.count) >= 20) {
        tiempo.style.color = "white";
    }
    if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
        console.log(convertirASegundos(data.count))
        LIMPIEZAS["psicodélico"](data, data.player);
        tiempo.style.color = "yellow";
    }
    if (10 > convertirASegundos(data.count) && activado_psico1 == false) {
        MODOS["psicodélico"](data, socket, data.player);
        tiempo.style.color = "red";
    }
    tiempo.innerHTML = data.count;
    if(data.count == '¡Tiempo!'){
        LIMPIEZAS["psicodélico"](data, data.player);
        //confetti_aux()
        terminado = true;
        feedback1.innerHTML = "";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        explicación.innerHTML = "";
        palabra1.style.display = "none";
        definicion1.style.display = "none";
        explicación.style.display = "none";
        texto1.style.display = "none";
        tiempo.style.color = "white";
    }
    }

    if(data.player == 2){
        if (convertirASegundos(data.count) >= 20) {
            tiempo1.style.color = "white";
        }
        if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
            console.log(convertirASegundos(data.count))
            LIMPIEZAS["psicodélico"](data, data.player);
            tiempo1.style.color = "yellow";
        }
        if (10 > convertirASegundos(data.count) && activado_psico2 == false) {
            MODOS["psicodélico"](data, socket, data.player);
            tiempo1.style.color = "red";
        }
        tiempo1.innerHTML = data.count;
        if(data.count == '¡Tiempo!'){
            LIMPIEZAS["psicodélico"](data, data.player);
            terminado1 = true;
            feedback2.innerHTML = "";
            palabra2.innerHTML = "";
            definicion2.innerHTML = "";
            explicación1.innerHTML = "";
            palabra2.style.display = "none";
            definicion2.style.display = "none";
            explicación1.style.display = "none";

            texto2.style.display = "none";
            tiempo1.style.color = "white";
        }
    }
    if (terminado && terminado1) {

        confetti_aux();
        LIMPIEZAS[modo_actual](data);
        
        limpiezas_final();

        activar_sockets_extratextuales();
        //texto1.innerText = (texto1.innerText).substring(saltos_línea_alineacion_1, texto1.innerText.length);
        //texto2.innerText = (texto2.innerText).substring(saltos_línea_alineacion_2, texto2.innerText.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');


        //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
        //texto2.innerText = eliminar_saltos_de_linea(texto2.innerText); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto2.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
        texto2.style.height = (texto2.scrollHeight) + "px";// Reajustamos el tamaño del área de texto del j2.

        animateCSS(".cabecera", "backInLeft").then((message) => {
            animateCSS(".contenedor", "pulse");
        });
        logo.style.display = "";
        neon.style.display = "";
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "white";
        tiempo1.style.color = "white";
    }
});

socket.on('resucitar_control', data => {
    if(data.player == 1){
        terminado = false;
        palabra1.style.display = "";
        definicion1.style.display = "";
        explicación.style.display = "";
        texto1.style.display = "";
    }
    else if(data.player == 2){
        terminado1 = false;
        palabra2.style.display = "";
        definicion2.style.display = "";
        explicación1.style.display = "";
        texto2.style.display = "";
    }
});


// Array con los audios en el orden que quieres reproducir
var audios = [
  "../../game/audio/5. PREPARADOS 2.mp3",
  "../../game/audio/5. PREPARADOS 3.mp3",
  "../../game/audio/5. PREPARADOS 4.mp3",
  "../../game/audio/5. PREPARADOS 5.mp3"
];


// Inicia el juego.
socket.on('inicio', data => {
    if(sonido){
    sonido.pause();
    }
    reproducirSonido("../../game/audio/5. PREPARADOS 1.mp3")
    animateCSS(".cabecera", "backOutLeft").then((message) => {
        inspiracion.style.display = "block";
        animateCSS(".contenedor", "pulse");
        animateCSS(".inspiracion", "pulse");
        TIEMPO_BORRADO = data.parametros.TIEMPO_BORRADO;
        TIEMPO_INVERSO = data.parametros.TIEMPO_INVERSO;
        TIEMPO_BORROSO = data.parametros.TIEMPO_BORROSO;
        socket.off('vote');
        socket.off('exit');
        socket.off('scroll');
        socket.off('temas_jugadores');
        //socket.off('recibir_comentario');
        socket.off('recibir_postgame1');
        socket.off('recibir_postgame2');
            logo.style.display = "none";
            neon.style.display = "none";

    tiempo.innerHTML = "";
    tiempo1.innerHTML = "";
    tiempo.style.display = "";
    tiempo1.style.display = "";

    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "6";
    texto2.rows = "6";
    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADOS?</span>'); 
    preparados.appendTo($('.container'));
    timeout_countdown = setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);
    timeout_timer = setTimeout(() => {
        var counter = 3;
        var index   = 0; // Índice para recorrer el array de audios
        
        var timer = setInterval(function() {
          // Eliminamos el anterior #countdown para volverlo a crear
          $('#countdown').remove();
          
          // Creamos el nuevo elemento con el número o el texto final
          var countdown = $('<span id="countdown">'+ (counter === 0 ? '¡ESCRIBE!' : counter) +'</span>');
          countdown.appendTo($('.container'));
        
          // Pequeña pausa para aplicar el CSS que hace el efecto
          setTimeout(() => {
            if (counter > -1) {
              $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
            } else {
              $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
            }
          }, 20);
        
          // Reproducimos el siguiente sonido mientras haya disponibles en el array
          if (index < audios.length) {
            reproducirSonido(audios[index]);
            index++;
          }
          
          counter--;
        
          // Cuando counter llega a -1, paramos el intervalo y quitamos el #countdown
          if (counter <= -1) {
            clearInterval(timer);
            setTimeout(() => {
              $('#countdown').remove();
            }, 1000);
          }
        
        }, 1000);
}, 1000);
});
});

socket.on('post-inicio', data => {
    
    limpiezas();

    texto1.style.display = "";
    texto2.style.display = "";
    palabra1.style.display = "";
    definicion1.style.display = "";
    explicación.style.display = "";
    palabra2.style.display = "";
    definicion2.style.display = "";
    explicación.style.display = "";
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
    // Vaciar cualquier contenido HTML del elemento con id 'countdown'
    $('#countdown').empty()
    clearTimeout(timeout_countdown);
    clearTimeout(timeout_timer);

    limpiezas();
    stopConfetti();
    temas.style.display = "none";
    temas.innerHTML = "";
    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */

    tiempo.style.display = "none";
    tiempo1.style.display = "none";
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    });
    logo.style.display = "";
    neon.style.display = "";
    inspiracion.style.display = "none";
    if(sonido) sonido.pause();
    //reproducirSonido("../../game/audio/1. MENU DE INICIO.mp3", true)
    activar_sockets_extratextuales();
});

socket.on('activar_modo', data => {
    animacion_modo();
    LIMPIEZAS[modo_actual](data);
    modo_actual = data.modo_actual;
    MODOS[modo_actual](data);
    blueCount = 0;
    redCount = 0;
    updateBar();
});

socket.on('recibir_feedback_modificador', data => {
    if(data.player == 2){
        feedback2.innerHTML = getEl(data.id_mod).innerHTML;
        clearTimeout(delay_animacion);
        animateCSS(".feedback2", "flash").then((message) => {
            delay_animacion = setTimeout(function () {
                feedback2.innerHTML = "";
            }, 2000);
        });
        getEl(data.id_mod).style.display = "none";
    }
    else{
        feedback1.innerHTML = getEl(data.id_mod).innerHTML;
        clearTimeout(delay_animacion);
        animateCSS(".feedback1", "flash").then((message) => {
            delay_animacion = setTimeout(function () {
                feedback1.innerHTML = "";
            }, 2000);
        });
        getEl(data.id_mod.substring(0, data.id_mod.length - 1) + "1").style.display = "none";
    }
});

socket.on('enviar_palabra_j1', data => {
    recibir_palabra(data, 1);
});

socket.on('enviar_palabra_j2', data => {
    recibir_palabra(data, 2);
});

socket.on('inspirar_j1', palabra => {
    definicion2.innerHTML = ("MUSA: <span style='color: orange;'>Podrías escribir la palabra \"" +
    "</span><span style='color: lime; text-decoration: underline;'>" + palabra +
    "</span><span style='color: orange;'>\"</span>");
});

socket.on('inspirar_j2', palabra => {
    definicion3.innerHTML = ("MUSA: <span style='color: orange;'>Podrías escribir la palabra \"" +
    "</span><span style='color: lime; text-decoration: underline;'>" + palabra +
    "</span><span style='color: orange;'>\"</span>");});

function recibir_palabra(data, escritxr) {
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

        if (escritxr == 1) {
            signo = (modo_actual == "palabras prohibidas") ? "-" : "+";
        
            palabra2.innerHTML = data.palabras_var + " (" + signo + data.tiempo_palabras_bonus + " segs.)";
            definicion2.innerHTML = data.palabra_bonus[1];
        
            animateCSS(".explicación1", "bounceInLeft");
            animateCSS(".palabra1", "bounceInLeft");
            animateCSS(".definicion1", "bounceInLeft");
        }
        
    else{
        signo = (modo_actual == "palabras prohibidas") ? "-" : "+";
        palabra3.innerHTML = data.palabras_var + " (" + signo + data.tiempo_palabras_bonus + " segs.)"
        definicion3.innerHTML = data.palabra_bonus[1];
           
        animateCSS(".explicación2", "bounceInLeft");
        animateCSS(".palabra2", "bounceInLeft");
        animateCSS(".definicion2", "bounceInLeft");
    }
}

socket.on('feedback_a_j2', data => {
    var feedback = document.querySelector(".feedback1");
    feedback.style.color = data.color;
    feedback.innerHTML = data.tiempo_feed.toString();

    console.log(data.tiempo_feed)

    if (data.tiempo_feed.startsWith("⏱️-")) {
        // Verificar si comienza con "⏱️-2"
        console.log(data.tiempo_feed.toString()== ("⏱️-1 segs."))
        if (data.tiempo_feed.toString() == ("⏱️-1 segs.")) {
        console.log("ENTROOO")
            reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");
        } else {
        reproducirSonido("../../game/audio/PERDER PALABRA.mp3");
        }
    }
    // Si empieza por "⏱️+" (ej.: "⏱️+2 segs." o "⏱️+6 segs.")
    else if (data.tiempo_feed.toString() == "⏱️+6 segs.") {
        reproducirSonido("../../game/audio/GANAR 2 SEG.mp3");

    }
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
    animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    });
    console.log("PARAAAAAAAAAAAAAAAAAAAAAAAAA", data.insp)
    if(data.tiempo_feed.toString() == "+🎨 insp." || data.insp == true){
        reproducirSonido("../../game/audio/GANAR PALABRA.mp3")
        if(modo_actual != "palabras prohibidas"){
        increment('blue');
        }
        else{
            reproducirSonido("../../game/audio/PERDER PALABRA.mp3")
            increment('red');
        }
    }
});

socket.on('feedback_a_j1', data => {
    var feedback1 = document.querySelector(".feedback2");
    feedback1.style.color = data.color;
    feedback1.innerHTML = data.tiempo_feed.toString();

    if(data.tiempo_feed.toString() == "⏱️+6 segs."){
        reproducirSonido("../../game/audio/GANAR 2 SEG.mp3")
    }

    // Verificar si comienza con "⏱️-" pero no con "⏱️-2"
    else if (data.tiempo_feed.startsWith("⏱️-")) {
            // Verificar si comienza con "⏱️-2"
            if (data.tiempo_feed.toString() == "⏱️-1 segs.") {
                reproducirSonido("../../game/audio/PERDER 2 SEG.mp3");
            } else {
            reproducirSonido("../../game/audio/PERDER PALABRA.mp3");
            }
    }


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
    animateCSS(".feedback2", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    });
    if(data.tiempo_feed.toString() == "+🎨 insp." || data.insp == true){
        if(modo_actual != "palabras prohibidas"){
        reproducirSonido("../../game/audio/GANAR PALABRA.mp3")
        increment('red');
        }
        else{
            reproducirSonido("../../game/audio/PERDER PALABRA.mp3")
            increment('blue');
        }
    }
});

socket.on('recibir_comentario', data => {
    tema.innerHTML = data;
});

socket.on('fin', data => {
        //confetti_aux();
});

socket.on("enviar_repentizado", repentizado => {
    //temas.innerHTML = "⚠️ "+ repentizado + " ⚠️";
    //animateCSS(".temas", "flash")
});

socket.on("enviar_ventaja_j1", putada => {
    stopDotAnimation(Temasinterval);
    PUTADAS[putada](1);
    feedback1.innerHTML = putada + " <span style='color: red;'>¡DESVENTAJA!</span>";
    animateCSS(".feedback1", "flash").then((message) => {
        setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    });
    feedback2.innerHTML = putada + " <span style='color: lime;'>¡VENTAJA!</span>";
    animateCSS(".feedback2", "flash").then((message) => {
        setTimeout(function () {
            feedback2.innerHTML = "";
        }, 2000);
    });  
});

socket.on("enviar_ventaja_j2", putada => {
    stopDotAnimation(Temasinterval);
    PUTADAS[putada](2);
    feedback2.innerHTML = putada + " <span style='color: red;'>¡DESVENTAJA!</span>";;
    animateCSS(".feedback2", "flash").then((message) => {
        setTimeout(function () {
            feedback2.innerHTML = "";
        }, 2000);
    }); 
    feedback1.innerHTML = putada + " <span style='color: lime;'>¡VENTAJA!</span>";
    animateCSS(".feedback1", "flash").then((message) => {
        setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    }); 
});

socket.on("nueva letra", letra => {
    if(modo_actual == "letra prohibida"){
        animacion_modo();
        palabra1.innerHTML = "LETRA PROHIBIDA: " + letra;
        }
    else if(modo_actual == "letra bendita"){
        animacion_modo();
        palabra1.innerHTML = "LETRA BENDITA: " + letra;
    }
});

socket.on('elegir_ventaja_j1', () => {
    confetti_musas(0.25);
    temas.innerHTML = "";
    temas.style.display = "";
    iniciarAnimacionesSegunCondicion("azul");
    
});

socket.on('elegir_ventaja_j2', () => {
    confetti_musas(0.75);
    temas.innerHTML = "";
    temas.style.display = "";
    iniciarAnimacionesSegunCondicion("rojo");
});

//FUNCIONES AUXILIARES.

function reproducirSonido(rutaArchivo, loop = false) {
    // Creamos una nueva instancia de Audio con la ruta proporcionada
    sonido = new Audio(rutaArchivo);

    // Configuramos el bucle según el parámetro 'loop'
    sonido.loop = loop;

    // Intentamos reproducir el sonido
    // Si el navegador requiere interacción del usuario,
    // esta promesa puede fallar (por ejemplo, en navegadores móviles).
    sonido.play().catch(error => {
      console.error('No se pudo reproducir el audio:', error);
    });
    return sonido;
  }

// Referencias a los elementos
// Variables para guardar los IDs de intervalo si es necesario detenerlos después

// Ejemplo: iniciar animaciones según un estado o condición
function iniciarAnimacionesSegunCondicion(condicion) {
  if (condicion === "azul") {
    // Inicia animación para musas azules
    Temasinterval = startDotAnimation(temas,'MUSAS <span style="color:aqua;">AZULES</span> ELIGIENDO <span style="color:lime;">VENTAJA</span>');
  } else if (condicion === "rojo") {
    // Inicia animación para musas rojas
    Temasinterval = startDotAnimation(temas,   'MUSAS <span style="color:red;">ROJAS</span> ELIGIENDO <span style="color:lime;">VENTAJA</span>');
  }
}

function startDotAnimation(element, baseText, maxDots = 3, intervalTime = 500) {
    let dotCount = 0;
  
    // Configura y guarda el intervalo
    animateCSS(".temas", "flash");
    element.style.color = 'orange';
    element.style.fontSize = '1.5em';
    const intervalId = setInterval(() => {
      dotCount = (dotCount + 1) % (maxDots + 1);
      element.innerHTML = baseText + ".".repeat(dotCount);
    }, intervalTime);
  
    return intervalId;
  }
  
  function stopDotAnimation(intervalId) {
    temas.innerHTML = "";
    temas.style.display = "";
    clearInterval(intervalId);
  }

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
            window.scrollBy(0, -50);
        }
        else {
            window.scrollBy(0, 50);
        }
    });

    socket.on('scroll_sincro', data => {
        window.scrollTo({ top: 0});
    });

/*
    socket.on('impro', data => {
        if(data){
            document.getElementById("contenedor").style.display = "none";
            tiempo.style.display = "none";
            tiempo1.style.display = "none";
        }
        else{
            document.getElementById("contenedor").style.display = "";
            tiempo.style.display = "";
            tiempo1.style.display = "none";

        }
    });
*/
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



    /*socket.on("recibir_postgame1", (data) => {
        focalizador2.innerHTML = "<br>🖋️ Caracteres escritos = " + data.longitud + "<br>📚 Palabras bonus = " + data.puntos_palabra + "<br>❌ Letra prohibida = " + data.puntos_letra_prohibida + "<br>😇 Letra bendita = " + data.puntos_letra_bendita;
    });

    socket.on("recibir_postgame2", (data) => {
        focalizador1.innerHTML = "<br>🖋️ Caracteres escritos = " + data.longitud + "<br>📚 Palabras bonus = " + data.puntos_palabra + "<br>❌ Letra prohibida = " + data.puntos_letra_prohibida + "<br>😇 Letra bendita = " + data.puntos_letra_bendita;
    });*/
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
    if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) > parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        puntos1.style.color = "greenyellow";
        puntos2.style.color = "red";
        if (parseInt(puntos1.innerHTML.match(/[-+]?\d+(\.\d+)?/)) == parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
            puntos2.style.color = "greenyellow";
        }
    }
    else {
        puntos1.style.color = "red";
        puntos2.style.color = "greenyellow";
    }
}

function limpiezas(){

    if(intervaloSonidoRayo) clearInterval(intervaloSonidoRayo);
    if(audio_inverso) audio_inverso.pause();
    if(audio_borroso) audio_borroso.pause();

    clearTimeout(listener_cuenta_atras);
    clearTimeout(tempo_text_inverso1);
    clearTimeout(tempo_text_inverso2);
    clearTimeout(tempo_text_borroso1);
    clearTimeout(tempo_text_borroso2);
    if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
        sonido_modo.pause();
    }

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");

    clearInterval(timer)
    stopDotAnimation(Temasinterval);
    terminado = false;
    terminado1 = false;

    feedback1.innerHTML = "";
    feedback2.innerHTML = "";

    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicación.innerHTML = "";
    palabra2.innerHTML = "";
    definicion2.innerHTML = "";
    explicación1.innerHTML = "";
    palabra3.innerHTML = "";
    definicion3.innerHTML = "";
    explicación2.innerHTML = "";

    
    texto1.innerText = "";
    texto2.innerText = "";
    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";
    texto1.style.display = "none";
    texto2.style.display = "none";

    puntos1.innerHTML = 0 + " palabras";
    puntos2.innerHTML = 0 + " palabras";
    
    texto1.classList.remove('textarea_blur');
    texto2.classList.remove('textarea_blur');
    

    focalizador1.innerHTML = "";
    focalizador2.innerHTML = "";

    for (let key in LIMPIEZAS) { 
        LIMPIEZAS[key]();
    }

    feedback_tiempo.style.color = color_positivo;
    feedback_tiempo1.style.color = color_positivo;

    blueCount = 0;
    redCount = 0;
    updateBar();
}

function limpiezas_final(){

    if (typeof sonido_modo !== 'undefined' && sonido_modo !== null) {
        sonido_modo.pause();
    }

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");

    temas.style.display = "none";
    temas.innerHTML = "";
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicación.innerHTML = "";
    palabra2.innerHTML = "";
    definicion2.innerHTML = "";
    explicación1.innerHTML = "";
    palabra3.innerHTML = "";
    definicion3.innerHTML = "";
    explicación2.innerHTML = "";
    inspiracion.style.display = "none";

    tiempo.style.color = "white";
    tiempo1.style.color = "white";

    texto1.innerText = "";
    texto2.innerText = "";
    texto1.style.display = "none";
    texto2.style.display = "none";


    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows =  "1";
    texto2.rows = "1";

    texto1.classList.remove('textarea_blur');
    texto2.classList.remove('textarea_blur');

    LIMPIEZAS["psicodélico"]("");

    feedback_tiempo.style.color = color_positivo;  
    feedback_tiempo1.style.color = color_positivo;

    clearTimeout(listener_cuenta_atras);
    clearTimeout(tempo_text_inverso1);
    clearTimeout(tempo_text_inverso2);
    clearTimeout(tempo_text_borroso1);
    clearTimeout(tempo_text_borroso2);

    if(intervaloSonidoRayo) clearInterval(intervaloSonidoRayo);
    if(audio_inverso) audio_inverso.pause();
    if(audio_borroso) audio_borroso.pause();

    blueCount = 0;
    redCount = 0;
    updateBar();
    stopDotAnimation(Temasinterval);
}

var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecución

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function confetti_aux() {

    sonido_confetti = reproducirSonido("../../game/audio/CELEBRACION con explosiones.mp3")
    
  var animationEnd = Date.now() + duration; // Actualiza aquí dentro de la función
  isConfettiRunning = true; // Habilita la ejecución de confetti
  console.log(isConfettiRunning);
  
  var interval = setInterval(function() {
    if (!isConfettiRunning) {
      clearInterval(interval);
      return;
    }

    var timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    var particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function stopConfetti() {
    if(sonido_confetti_musa) sonido_confetti_musa.pause();
    if(sonido_confetti) sonido_confetti.pause();

  isConfettiRunning = false; // Deshabilita la ejecución de confetti
  confetti.reset(); // Detiene la animación de confetti
}

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

  function confetti_musas(pos){

    sonido_confetti_musa = reproducirSonido("../../game/audio/FX/9. ESTRELLAS.mp3")
    
    var scalar = 2;
    var unicorn = confetti.shapeFromText({ text: '⭐', scalar });
    isConfettiRunning = true; // Habilita la ejecución de confetti
    var end = Date.now() + (2 * 1000);
    
    (function frame() {
      confetti({
        startVelocity: 10,
        particleCount: 1,
        angle: 270,
        spread: 1000,
        origin: { y: 0, x: pos },
        shapes: [unicorn],
        scalar: 3
      });
    
      if ((Date.now() < end) && isConfettiRunning) {
        requestAnimationFrame(frame);
      }
    }());
    }

// Función para actualizar la barra
function updateBar() {
    const total = blueCount + redCount;
    let bluePercentage, redPercentage;

    if (total === 0) {
        bluePercentage = 50;
        redPercentage = 50;
    } else {
        bluePercentage = (blueCount / total) * 100;
        redPercentage = (redCount / total) * 100;
    }

    const blueSegment = document.querySelector('.bar-segment.blue');
    const redSegment = document.querySelector('.bar-segment.red');
    const blueText = blueSegment.querySelector('.percentage-text');
    const redText = redSegment.querySelector('.percentage-text');

    blueSegment.style.width = `${bluePercentage}%`;
    redSegment.style.width = `${redPercentage}%`;

    // Ajuste dinámico del tamaño de la fuente en vw
    const baseFontSize = 0.5; // Tamaño de fuente base en vw
    const maxFontSize = 2; // Tamaño de fuente máximo en vw
    const blueFontSize = Math.min(baseFontSize + (bluePercentage / 100) * (maxFontSize - baseFontSize), maxFontSize);
    const redFontSize = Math.min(baseFontSize + (redPercentage / 100) * (maxFontSize - baseFontSize), maxFontSize);

    // Eliminar ".00" si el valor es un número entero
    if (Number.isInteger(bluePercentage)) {
        blueText.innerHTML = `${bluePercentage} %`;
    } else {
        blueText.innerHTML = `${bluePercentage.toFixed(0)} %`;
    }
    blueText.style.fontSize = `${blueFontSize}vw`;

    if (Number.isInteger(redPercentage)) {
        redText.innerHTML = `${redPercentage} %`;
    } else {
        redText.innerHTML = `${redPercentage.toFixed(0)} %`;
    }
    redText.style.fontSize = `${redFontSize}vw`;
}


function increment(color) {
    if (color === 'blue') {
        blueCount++;
    } else if (color === 'red') {
        redCount++;
    }
    updateBar();
}

// Inicialización con valores iniciales
blueCount = 0;
redCount = 0;
updateBar();

// Función para establecer la posición del caret
function establecerPosicionCaret(node, pos) {
    const range = document.createRange();
    const selection = window.getSelection();
    let offset = pos;

    function setRange(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.length >= offset) {
                range.setStart(node, offset);
                return true;
            } else {
                offset -= node.length;
            }
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (setRange(node.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    setRange(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

// Función para centrar el scroll en la posición del caret
function centrarScroll(node, pos) {
    const range = document.createRange();
    const selection = window.getSelection();
    let offset = pos;

    function setRange(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.length >= offset) {
                range.setStart(node, offset);
                return true;
            } else {
                offset -= node.length;
            }
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (setRange(node.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    setRange(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Centramos el scroll en la posición del caret
    const caretPosition = range.getBoundingClientRect();
    const containerPosition = node.getBoundingClientRect();
    offset = caretPosition.top - containerPosition.top;
    node.scrollTop = offset - node.clientHeight / 2;
}