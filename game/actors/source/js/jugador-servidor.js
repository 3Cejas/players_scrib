const getEl = id => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let nivel1 = getEl("nivel");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let explicación = getEl("explicación");



let listener_cuenta_atras = null;
let timer = null;
let modo_actual = "";
texto1.style.height = "auto";
texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
texto1.scrollTop = texto1.scrollHeight;

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");

let sincro = 0;
let votando = false;

const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    'palabras bonus': function (data) {
        explicación.style.color = "yellow";
        explicación.innerHTML = "MODO PALABRAS BENDITAS";
        palabra.innerHTML = "";
        palabra.style.backgroundColor = "yellow";
        definicion.innerHTML = "";
        socket.on(enviar_palabra, data => {
            recibir_palabra(data);
        });
    },

    //Recibe y activa el modo letra prohibida.
    'letra prohibida': function (data) {
        palabra.style.backgroundColor= "red";
        explicación.style.color = "red";
        explicación.innerHTML = "MODO LETRA MALDITA";
        palabra.innerHTML = "LETRA MALDITA: " + data.letra_prohibida;
    },

    //Recibe y activa el modo letra bendita.
    'letra bendita': function (data) {
        palabra.style.backgroundColor= "lime";
        explicación.style.color = "lime";
        explicación.innerHTML = "MODO LETRA BENDITA";
        palabra.innerHTML = "LETRA BENDITA: " + data.letra_bendita;
    },

    'palabras prohibidas': function (data) {
        palabra.style.backgroundColor = "pink";
        explicación.style.color = "pink";
        explicación.innerHTML = "MODO PALABRAS MALDITAS";
        definicion.innerHTML = "";
        socket.on(enviar_palabra, data => {
            recibir_palabra_prohibida(data);
        });
    },

    'tertulia': function (socket) {
        //activar_socket_feedback();
        explicación.style.color = "blue";
        explicación.innerHTML = "MODO TERTULIA";
        palabra.innerHTML = "";

    },

    'frase final': function (socket) {
        //activar_socket_feedback();
        explicación.style.color = "orange";
        explicación.innerHTML = "MODO FRASE FINAL";
        palabra.innerHTML = "";

    },

    '': function (data) {
    }
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        socket.off(enviar_palabra);
    },

    "letra prohibida": function (data) { },

    "letra bendita": function (data) { },

    "palabras prohibidas": function (data) {
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        socket.off(enviar_palabra);
    },

    "tertulia": function (data) { },

    "": function (data) { },
};

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
        enviar_palabra = 'enviar_palabra_j1'
        nombre1.style="color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"

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
        enviar_palabra = 'enviar_palabra_j2'
        nombre1.style="color:red; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;" 
    }

// Se establece la conexión con el servidor.
serverUrl = window.location.href.startsWith('file:')
    ? 'http://localhost:3000'
    : 'https://sutura.ddns.net:3000';

const socket = io(serverUrl);

socket.emit('pedir_nombre');
// Recibe el nombre del jugador 1 y lo coloca en su sitio.


socket.on('dar_nombre', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR";
    nombre1.innerHTML = nombre;
});

// Recibe los datos del jugador 1 y los coloca.
socket.on(texto_x, data => {
    console.log(data)
    texto1.innerHTML = data.text;
    puntos1.innerHTML = data.points;
    //cambiar_color_puntuación()
    nivel1.innerHTML = data.level;
        //texto1.style.height = ""; // resetear la altura
    texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.innerText = "\n" + texto1.innerText;
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
    if(data.player == player){
        if (convertirASegundos(data.count) >= 20) {
            tiempo.style.color = "white";
        }
        if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
            tiempo.style.color = "yellow";
        }
        if (10 > convertirASegundos(data.count)) {
            tiempo.style.color = "red";
        }
    tiempo.innerHTML = data.count;
    if (data.count == "¡Tiempo!") {
        confetti_aux();

        limpiezas();

        //texto1.innerText = (texto1.innerText).substring(saltos_línea_alineacion_1, texto1.innerText.length);
        //texto2.value = (texto2.value).substring(saltos_línea_alineacion_2, texto2.value.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');
        // Variable booleana que dice si la ronda ha terminado o no.
        terminado = true;
        //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
        //texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
    }
}
});

// Inicia el juego.
socket.on('inicio', data => {
    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADOS?</span>'); 
    preparados.appendTo($('.container'));
    setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);
    setTimeout(() => {
    var counter = 3;
  
    timer = setInterval(function() {
      
      $('#countdown').remove();
      
      var countdown = $('<span id="countdown">'+(counter==0?'¡ESCRIBE!':counter)+'</span>'); 
      countdown.appendTo($('.container'));
  
      setTimeout(() => {
        if (counter > -1) {
          $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
        } else {
          $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
        }
      }, 20);
  
      counter--;
  
      if (counter <= -1) {
        clearInterval(timer);
        setTimeout(() => {
          $('#countdown').remove();
        }, 1000);
  
        // Ejecuta tu función personalizada después de x segundos (por ejemplo, 2 segundos)
        listener_cuenta_atras = setTimeout(function(){
            texto1.innerText = "";
            puntos1.innerHTML = 0 + " palabras";
            nivel1.innerHTML = "nivel 0";
            tiempo.innerHTML = "";
            
            limpiezas();
            texto1.style.height = "";
            texto1.rows =  "3";
            animacion_modo();
        }, 2000);
    }
  }, 1000);
}, 1000);
});

// Resetea el tablero de juego.
socket.on('limpiar', () => {

    // Recibe el nombre del jugador y lo coloca en su sitio.
    socket.on(nombre, data => {
        nombre1.value = data;
    });

    texto1.innerText = "";
    puntos1.innerHTML = 0 + " palabras";
    nivel1.innerHTML = "nivel 0";
    tiempo.innerHTML = "";

    limpiezas();
    stopConfetti();

    texto1.style.height = "";
    texto1.rows =  "3";
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */
});

// Recibe el nombre del jugador y lo coloca en su sitio.
socket.on(nombre, data => {
    nombre1.value = data;
});

socket.on('activar_modo', data => {
    animacion_modo();
    LIMPIEZAS[modo_actual](data);
    modo_actual = data.modo_actual;
    MODOS[modo_actual](data);
});

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

socket.on("nueva letra", letra => {
    console.log("NUEVA LETRA")
    if(modo_actual == "letra prohibida"){
        animacion_modo();
        palabra.innerHTML = "LETRA PROHIBIDA: " + letra;
        }
    else if(modo_actual == "letra bendita"){
        animacion_modo();
        palabra.innerHTML = "LETRA BENDITA: " + letra;
    }
});

function recibir_palabra(data) {
    animacion_modo();
    palabra_actual = data.palabra_bonus[0];
    palabra.innerHTML = data.palabras_var + " (⏱️+" + data.tiempo_palabras_bonus + " segs.)" ;
    definicion.innerHTML = data.palabra_bonus[1];
}

function recibir_palabra_prohibida(data) {
    animacion_modo();
    palabra.innerHTML =  data.palabras_var + " (⏱️-" + data.tiempo_palabras_bonus + " segs.)";
    definicion.innerHTML = data.palabra_bonus[1];
}
function limpiezas(){
    clearTimeout(listener_cuenta_atras);
    clearTimeout(timer);

    palabra.innerHTML = "";
    explicación.innerHTML = "";
    definicion.innerHTML = "";
    tiempo.style.color = "white"
    puntos1.style.color = "white";  
    votando = false;
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

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

  var duration = 15 * 1000;
var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
var isConfettiRunning = true; // Indicador para controlar la ejecución

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

function confetti_aux() {
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
      console.log("HOLAAAA");
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }

function stopConfetti() {
    isConfettiRunning = false; // Deshabilita la ejecución de confetti
    confetti.reset(); // Detiene la animación de confetti
  }