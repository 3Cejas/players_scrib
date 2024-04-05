var player = getParameterByName("player");
let feedback_a_j_x;
let feedback_de_j_x;
let texto_x;
let texto_y;
let enviar_postgame_x;
let recibir_postgame_x;
let enviar_putada_de_jx;
let tiempo_inicial = new Date();
let es_pausa = false;
let borrado_cambiado = false;
let duracion;
let texto_guardado = "";
let interval_ortografia_perfecta;


const getEl = (id) => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre;
let texto = getEl("texto");
let puntos = getEl("puntos");
let nivel = getEl("nivel");
let feedback = getEl("feedback1");
let alineador = getEl("alineador1");
let musas = getEl("musas");
  
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let explicación = getEl("explicación");
let metadatos = getEl("metadatos");
  
let tiempo = getEl("tiempo");
let temas = getEl("temas");
let lightning = getEl("lightning");
let feedback_tiempo = getEl("feedback_tiempo");
let neon = getEl("neon");
  

let tempo_text_borroso;
let tempo_text_inverso;

let listener_cuenta_atras = null;
let timer = null;

// Variables de los modos.
let modo_actual = "";
let putada_actual = "";
let modo_texto_borroso = 0;
let desactivar_borrar = false;

var letra_prohibida = "";
var letra_bendita = "";
let listener_modo;
let listener_modo1;
let listener_modo_psico;
let activado_psico = false;
let temp_text_inverso_activado = false;

let TIEMPO_INVERSO;
let TIEMPO_BORROSO;
let TIEMPO_BORRADO;

function getParameterByName(name, url) {
if (!url) url = window.location.href;
name = name.replace(/[\[\]]/g, "\\$&");
var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
if (!results) return null;
if (!results[2]) return '';
return decodeURIComponent(results[2].replace(/\+/g, " "));
}

if (player == 1) {
    enviar_putada_de_jx = 'enviar_putada_de_j2';
    feedback_a_j_x = 'feedback_a_j1';
    feedback_de_j_x = 'feedback_de_j1';
    texto_x = 'texto1'
    enviar_postgame_x = 'enviar_postgame1';
    recibir_postgame_x = 'recibir_postgame1';
    nombre = getEl("nombre");
    nombre.value = "ESCRITXR 1"
    inspirar = 'inspirar_j1';
    enviar_palabra = 'enviar_palabra_j1'
    enviar_ventaja = 'enviar_ventaja_j1';
    elegir_ventaja = "elegir_ventaja_j1";
    nombre.style="color:aqua;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"
    metadatos.style = "color:aqua; text-shadow: 0.0625em 0.0625em red;";

} else if (player == 2) {
    enviar_putada_de_jx = 'enviar_putada_de_j1';
    feedback_a_j_x = 'feedback_a_j2';
    feedback_de_j_x = 'feedback_de_j2';
    texto_x = 'texto2'
    enviar_postgame_x = 'enviar_postgame2';
    recibir_postgame_x = 'recibir_postgame2';
    nombre = getEl("nombre");
    nombre.value = "ESCRITXR 2"
    inspirar = 'inspirar_j2';
    enviar_palabra = 'enviar_palabra_j2'
    enviar_ventaja = 'enviar_ventaja_j2';
    elegir_ventaja = "elegir_ventaja_j2";
    nombre.style="color:red;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;"
    metadatos.style = "color:red; text-shadow: 0.0625em 0.0625em aqua;";

}

// Se establece la conexión con el servidor.
serverUrl = window.location.href.startsWith('file:')
    ? 'http://localhost:3000'
    : 'https://sutura.ddns.net:3000';

const socket = io(serverUrl);
  
const PUTADAS = {
    "🐢": function () {
    },
    "⌛": function () {
    },
    "⚡": function () {
        borrado_cambiado = true;
        antiguo_rapidez_borrado = rapidez_borrado;
        antiguo_inicio_borrado = rapidez_inicio_borrado;
        rapidez_borrado = 1200;
        rapidez_inicio_borrado = 1200;
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.right = "45%";
        lightning.style.left = "0%";
        setTimeout(function () {
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            borrado_cambiado = false;
            rapidez_borrado = antiguo_rapidez_borrado;
            rapidez_inicio_borrado = antiguo_inicio_borrado;
        }, TIEMPO_BORRADO);
    },

    "🙃": function () {
        tiempo_inicial = new Date();
        desactivar_borrar = true;
        //caret = guardarPosicionCaret();
        //caretNode = caret.caretNode;
        //caretPos = caret.caretPos;
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            texto.removeEventListener('animationend', arguments.callee);
        });

        procesarTexto();
        // Obtener el último nodo de texto en text
        let lastLine = texto.lastChild;
        let lastTextNode = lastLine;
        while (lastTextNode && lastTextNode.nodeType !== 3) {
            lastTextNode = lastTextNode.lastChild;
        }
        
        // Si encontramos el último nodo de texto, colocamos el cursor allí
        if (lastTextNode) {
            let caretNode = lastTextNode;
            let caretPos = lastTextNode.length;
            restaurarPosicionCaret(caretNode, caretPos);
        }
        sendText();
        temp_text_inverso_activado = true;
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            desactivar_borrar = false;

            texto.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.contentEditable= "true";
                texto.focus()
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            let lastLine = texto.lastChild;
            let lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                let caretNode = lastTextNode;
                let caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            putada_actual = "";
        sendText()  
        }, TIEMPO_INVERSO);
    },

    "🌪️": function () {
        modo_texto_borroso = 1;
        tiempo_inicial = new Date();
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            putada_actual = "";
        }, TIEMPO_BORROSO);
    },
};

const MODOS = {

    "calentamiento": function (data) {
        explicación.style.color = "purple";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        explicación.innerHTML = "CALENTAMIENTO";
    },

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        palabra.style.backgroundColor = "yellow";
        explicación.style.color = "yellow";
        definicion.style.fontSize = "1vw";
        explicación.innerHTML = "MODO PALABRAS BENDITAS";
        socket.emit("nueva_palabra", player);
        socket.on(enviar_palabra, data => {
            recibir_palabra(data);
        });
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        definicion.style.fontSize = "1.5vw";
        palabra.style.backgroundColor = "red";
        explicación.style.color = "red";
        letra_prohibida = data.letra_prohibida;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("keydown", listener_modo);
        explicación.innerHTML = "MODO LETRA MALDITA";
        palabra.innerHTML = "LETRA MALDITA: " + letra_prohibida;
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
    },

    "letra bendita": function (data) {
        definicion.style.fontSize = "1.5vw";
        palabra.style.backgroundColor= "lime";
        explicación.style.color = "lime";
        letra_bendita = data.letra_bendita;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("keydown", listener_modo, true);
        explicación.innerHTML = "MODO LETRA BENDITA";
        palabra.innerHTML = "LETRA BENDITA: " + letra_bendita;
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
    },

    "texto borroso": function (data) {
        tiempo_inicial = new Date();
        duracion = data.duracion;
        if(es_pausa == false){
            modo_borroso(data);
        }
        else{
            modo_borroso_pausa(data);
        }
    },

    "psicodélico": function (data) {
        //explicación.innerHTML = "MODO PSICODÉLICO";
        //palabra1.innerHTML = "";
        //definicion1.innerHTML = "";
        listener_modo_psico = function () { modo_psicodélico() };
        texto.addEventListener("keyup", listener_modo_psico);
        activado_psico = true;
        /*socket.on("psico_a_j1", (data) => {
            stylize();
        });*/
    },

    'tertulia': function (socket) {
        explicación.style.color = "blue";
        explicación.innerHTML = "MODO TERTULIA";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
    },

    'palabras prohibidas': function (data) {
        palabra.style.backgroundColor = "pink";
        explicación.style.color = "pink";
        explicación.innerHTML = "MODO PALABRAS MALDITAS";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        socket.emit("nueva_palabra_prohibida", player);
        socket.on(enviar_palabra, data => {
            recibir_palabra_prohibida(data);
        });
    },

    'ortografía perfecta': function (data) {
        palabra.style.backgroundColor = "orange";
        explicación.style.color = "orange";
        explicación.innerHTML = "MODO ORTOGRAFÍA PERFECTA";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        modo_ortografía_perfecta();

    },

    "": function (data) { },
};

const LIMPIEZAS = {

    "calentamiento": function (data) {
        console.log("LIMPIOOOOOOOO")
    },

    "palabras bonus": function (data) {
        socket.off(enviar_palabra);
        asignada = false;
        texto.removeEventListener("keyup", listener_modo);
        definicion.style.fontSize = "1.5vw";
    },

    "letra prohibida": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        letra_bendita = "";
    },

    "borroso": function (data) {
        texto.classList.remove("textarea_blur");
    },

    "psicodélico": function (data) {
        //socket.off('psico_a_j1');
        texto.removeEventListener("keyup", listener_modo_psico);
        activado_psico = false;
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
    },

    "inverso": function (data) {
        desactivar_borrar = false;
        texto.innerText =
            texto.innerText
                .split("")
                .reverse()
                .join("")
                .split(" ")
                .reverse()
                .join(" ");
    },

    "tiempo_borrado_más": function (data){ },
    
    "tertulia": function (data) { },

    "palabras prohibidas": function (data) {
        socket.off(enviar_palabra);
        asignada = false;
        texto.removeEventListener("keyup", listener_modo);
    },

    "ortografía perfecta": function (data) {
        clearTimeout(interval_ortografia_perfecta);
    },

    "": function (data) { },
};

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto.addEventListener("keyup", (evt) => {
    console.log(evt.key)
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
        countChars(texto);
        sendText();
    }
});
// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto.addEventListener("keydown", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
        countChars(texto);
        sendText();
    }
});

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto.addEventListener("press", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
        countChars(texto);
        sendText();
    }
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    socket.emit('enviar_musa', 0);
});

//activar los sockets extratextuales.
activar_sockets_extratextuales();
socket.on('actualizar_contador_musas', contador_musas => {
    console.log("actualizar_contador_musas")
    if(player == 1){
    musas.innerHTML = contador_musas.escritxr1 + " musas";
    }
    else{
        musas.innerHTML = contador_musas.escritxr2 + " musas";
    }
});

// Recibe los datos del jugador 1 y los coloca.
socket.on(texto_x, (data) => {
    texto.innerText = data.text;
    puntos.innerHTML = data.points;
    nivel.innerHTML = data.level;
    texto.scrollTop = texto.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
});

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", (data) => {
    if(data.player == player){
    if (convertirASegundos(data.count) >= 20) {
        tiempo.style.color = "white";
    }
    if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
        console.log(convertirASegundos(data.count))
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "yellow";
    }
    if (10 > convertirASegundos(data.count) && activado_psico == false) {
        MODOS["psicodélico"](data, socket);
        tiempo.style.color = "red";
    }

    tiempo.innerHTML = data.count;
    if (data.count == "¡Tiempo!") {
        if (putada_actual == "🙃"){
            texto.innerText =
                texto.innerText
                    .split("")
                    .reverse()
                    .join("")
                    .split(" ")
                    .reverse()
                    .join(" ")
                    .split("")
                        .reverse()
                        .join("")
                        .split(" ")
                        .reverse()
                        .join(" ");
        }
        sendText();
        texto_guardado = texto.innerText;
        tiempo.style.color = "white";
        if(terminado == false){
            final();
            confetti_aux();
            setTimeout(function () {

                texto.style.height = "";
                texto.rows =  "1";
                texto.style.display = "none";
                texto.textContent = texto_guardado;
                sendText();
                tiempo.style.color = "white";
                }, 2000);
        }
    }
    }
});
  
// Inicia el juego.
socket.on("inicio", (data) => {
    TIEMPO_INVERSO = data.parametros.TIEMPO_INVERSO;
    TIEMPO_BORROSO = data.parametros.TIEMPO_BORROSO;
    TIEMPO_BORRADO = data.parametros.TIEMPO_BORRADO;
    limpieza();
    desactivar_borrar = false;
    texto.style.height = "";

    logo.style.display = "none"; 
    neon.style.display = "none"; 
    tiempo.innerHTML = "";
    tiempo.style.display = "";

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
  
      if (counter == -1) {
        clearInterval(timer);
        setTimeout(() => {
          $('#countdown').remove();
        }, 1000);
  
        // Ejecuta tu función personalizada después de x segundos (por ejemplo, 2 segundos)
        listener_cuenta_atras = setTimeout(function(){
            if (data.borrar_texto == false) {
                texto.innerText = texto_guardado.trim();

                sendText()

                // Obtener el último nodo de texto en texto
                let lastLine = texto.lastChild;
                let lastTextNode = lastLine;
                while (lastTextNode && lastTextNode.nodeType !== 3) {
                    lastTextNode = lastTextNode.lastChild;
                }
                
                // Si encontramos el último nodo de texto, colocamos el cursor allí
                if (lastTextNode) {
                    let caretNode = lastTextNode;
                    let caretPos = lastTextNode.length;
                    restaurarPosicionCaret(caretNode, caretPos);
                }
                texto.scrollTo(0, texto.scrollHeight);
                }
            
            //socket.off("recibe_temas");
            texto.contentEditable= "true";
            texto.focus();
            animacion_modo();
            MODOS['calentamiento']('', '');
        }, 2000);
      }
    }, 1000);
}, 1000);
});

// Resetea el tablero de juego.
socket.on("limpiar", (borrar) => {
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on("nombre" + player, (data) => {
        nombre.value = data;
    });
    if(borrar == false){

       // Verifica y asigna el valor a texto_guardado basado en el contenido de text
        if(texto.innerText != "") {
            texto_guardado = texto.innerText;
        } else {
            texto_guardado = ""; // Asigna una cadena vacía si text.innerText es vacío
        }
    }

    limpieza();

    stopConfetti()
    
    texto.rows =  "1";

    modo_actual = "";
    putada_actual = "";

    temas.innerHTML = "";
    
    texto.contentEditable= "false";

    tiempo.style.display = "none";
    logo.style.display = "";
    neon.style.display = ""; 
    texto.removeEventListener("keyup", listener_modo_psico);
    texto.removeEventListener("keyup", listener_modo1);

    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    borrado_cambiado = false;
    rapidez_borrado = antiguo_rapidez_borrado;
    rapidez_inicio_borrado = antiguo_inicio_borrado;

    restablecer_estilo();
});

socket.on("activar_modo", (data) => {
    animacion_modo();
    palabra.innerHTML = "";
    explicación.innerHTML = "";
    LIMPIEZAS[modo_actual](data);   
    modo_actual = data.modo_actual;
    MODOS[modo_actual](data, socket);
});

socket.on(enviar_palabra, data => {
    if(modo_actual == "palabras bonus"){
        recibir_palabra(data);
    }
});

socket.on('pausar_js', data => {
    es_pausa = true;
    LIMPIEZAS[modo_actual](data);
    tiempo_restante = TIEMPO_BORRADO - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
});

socket.on('fin', data => {
    if(player == 1 && data != 2 || player == 2 && data != 1){
        confetti_aux();
        final();
    }
});

socket.on('reanudar_js', data => {
    es_pausa = false;
    reanudar();
});

socket.on(inspirar, palabra => {
    if(palabra != ""){
    palabra_actual = [palabra];
    definicion.innerHTML = ("MUSA: <span style='color: orange;'>Podrías escribir la palabra \"" +
    "</span><span style='color: lime; text-decoration: underline;'>" + palabra +
    "</span><span style='color: orange;'>\"</span>");
    animateCSS(".definicion", "flash");
    asignada = true;
    indice_buscar_palabra = texto.innerText.length - 5;
    texto.removeEventListener("keyup", listener_modo1);
    listener_modo1 = function (e) { palabras_musas(e) };
    texto.addEventListener("keyup", listener_modo1);
    }
});

socket.on(enviar_ventaja, ventaja => {
    feedback.innerHTML = ventaja + " <span style='color: lime;'>¡VENTAJA!</span>";
    animateCSS(".feedback1", "flash").then((message) => {
        setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    }); 
});

socket.on("enviar_repentizado", repentizado => {
    //temas.innerHTML = "⚠️ "+ repentizado + " ⚠️";
    efectoMaquinaDeEscribir(texto, repentizado, 150);
    //animateCSS(".temas", "flash")
    });

socket.on("nueva letra", letra => {
    if(modo_actual == "letra prohibida"){
        letra_prohibida = letra;
        texto.removeEventListener("keydown", listener_modo);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("keydown", listener_modo);
        animacion_palabra();
        palabra.innerHTML = "LETRA PROHIBIDA: " + letra_prohibida;
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = letra;
        texto.removeEventListener("keydown", listener_modo);
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("keydown", listener_modo);
        animacion_palabra();
        palabra.innerHTML = "LETRA BENDITA: " + letra_bendita;
    }
});

socket.on("locura", () => {
    locura = true;
  });

socket.on(elegir_ventaja, () => {
    confetti_musas();
});

function recibir_palabra(data) {
    animacion_modo();
    palabra_actual = data.palabra_bonus[0];
    palabra.innerHTML = data.palabras_var + " (⏱️+" + data.tiempo_palabras_bonus + " segs.)" ;
    if(data.palabra_bonus[1] != ""){
    definicion.innerHTML = data.palabra_bonus[1];
    }
    else{
        definicion.innerHTML = "<span style='color:lime;'>MUSA</span>: <span style='color: orange;'>Podrías escribir esta palabra ⬆️</span>";
    }
    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    asignada = true;
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto.addEventListener("keyup", listener_modo);
}

function recibir_palabra_prohibida(data) {
    animacion_modo();
    palabra_actual = data.palabra_bonus[0];
    palabra.innerHTML = data.palabras_var + " (⏱️-" + data.tiempo_palabras_bonus + " segs.)";
    if(data.palabra_bonus[1] != ""){
        definicion.innerHTML = data.palabra_bonus[1];
    }
    else{
        definicion.innerHTML = "<span style='color: red;'>MUSA ENEMIGA</span>: <span style='color: orange;'>Podrías escribir esta palabra ⬆️</span>";
    }
    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    asignada = true;
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
    texto.addEventListener("keyup", listener_modo);
}

// FUNCIONES AUXILIARES.

// Función para enviar texto al otro jugador y a control
function sendText() {
    let text = texto.innerHTML;
    let points = puntos.textContent;
    let level = nivel.textContent;
    socket.emit(texto_x, { text, points, level });
}

function activar_sockets_extratextuales() {
    // Recibe el nombre del jugador x y lo coloca en su sitio.
    socket.on("nombre" + player, (data) => {
        nombre.value = data;
    });

    //Recibe los temas (que elige Espectador) y los coloca en su sitio.
    socket.on("recibe_temas", (data) => {
        temas.innerHTML = data;
    });
    
    socket.on("recibir_comentario", (data) => {
        console.log(data)
        temas.innerHTML = data;
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
    var fontFamilies = [
        "Impact",
        "Georgia",
        "Tahoma",
        "Verdana",
        "Impact",
        "Marlet",
    ]; // Add more
    return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
}

function getTextAlign() {
    var aligns = ["center", "left", "right", "justify"]; // Add more
    return aligns[Math.floor(Math.random() * aligns.length)];
}

function stylize() {
    texto.style.color = getRandColor();
    document.body.style.backgroundColor = getRandColor();
    document.body.style.backgroundColor = getRandColor();
}

function animacion_modo() {
    const animateCSS = (element, animation, prefix = "animate__") =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

function animacion_palabra() {
    const animateCSS = (element, animation, prefix = "animate__") =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve("Animation ended");
            }

            node.addEventListener("animationend", handleAnimationEnd, { once: true });
        });
    animateCSS(".palabra", "bounceInLeft");
}

// Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
function restablecer_estilo() {
    texto.style.color = "white";
    document.body.style.backgroundColor = "black";
}

//Función auxiliar que comprueba que se inserta la palabra bonus.
function modo_palabras_bonus(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(e.target);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            let endingIndex = preCaretRange.toString().length;
            let startingIndex = 0; // Inicialización
            let textContent = e.target.innerText;

            // Calcula startingIndex: Retrocede hasta encontrar un delimitador o el inicio del texto
            for (let i = endingIndex - 1; i >= 0; i--) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === 0) {
                    startingIndex = (i === 0 && (textContent[i] !== ' ' && textContent[i] !== '\n')) ? i : i + 1;
                    break;
                }
            }

            // Ajusta endingIndex: Avanza hasta encontrar un delimitador o el final del texto
            for (let i = endingIndex; i <= textContent.length; i++) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === textContent.length) {
                    endingIndex = i;
                    break;
                }
            }

            console.log("Texto seleccionado:", textContent.substring(startingIndex, endingIndex)); // Debugging
            console.log("palabra_actual:", palabra_actual); // Debugging
            console.log("Índices:", startingIndex, endingIndex); // Debugging


        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            texto.focus();
            asignada = false;
            socket.emit("nueva_palabra", player);
            socket.emit('aumentar_tiempo', {secs: tiempo_palabras_bonus, player});
            if(definicion.innerHTML == "") {
                feedback.innerHTML = "⏱️+" + tiempo_palabras_bonus + " segs.";
            }
            else{
                feedback.innerHTML = "⏱️+" + tiempo_palabras_bonus + " segs.";
            }
            clearTimeout(delay_animacion);
            color = color_positivo;
            feedback.style.color = color;
            tiempo_feed = "⏱️+" + tiempo_palabras_bonus + " segs.";
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            socket.emit(feedback_de_j_x, { color, tiempo_feed});
        }
    }
}

function modo_palabras_prohibidas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(e.target);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            let endingIndex = preCaretRange.toString().length;
            let startingIndex = 0; // Inicialización
            let textContent = e.target.innerText;

            // Calcula startingIndex: Retrocede hasta encontrar un delimitador o el inicio del texto
            for (let i = endingIndex - 1; i >= 0; i--) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === 0) {
                    startingIndex = (i === 0 && (textContent[i] !== ' ' && textContent[i] !== '\n')) ? i : i + 1;
                    break;
                }
            }

            // Ajusta endingIndex: Avanza hasta encontrar un delimitador o el final del texto
            for (let i = endingIndex; i <= textContent.length; i++) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === textContent.length) {
                    endingIndex = i;
                    break;
                }
            }

            console.log("Texto seleccionado:", textContent.substring(startingIndex, endingIndex)); // Debugging
            console.log("palabra_actual:", palabra_actual); // Debugging
            console.log("Índices:", startingIndex, endingIndex); // Debugging

        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            texto.focus();
            asignada = false;
            socket.emit("nueva_palabra_prohibida", player);
            tiempo_palabras_bonus = -tiempo_palabras_bonus;
            socket.emit('aumentar_tiempo', {secs: tiempo_palabras_bonus, player});
            color = color_negativo;
            feedback.style.color = color;
            feedback.innerHTML = "⏱️" + tiempo_palabras_bonus + " segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            color = color_negativo;
            tiempo_feed = "⏱️" + tiempo_palabras_bonus + " segs.";
            socket.emit(feedback_de_j_x, { color, tiempo_feed});
        }
    }
}

function palabras_musas(e) {
    if (asignada == true) {
        e.preventDefault();

        let selection = document.getSelection();
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(e.target);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            let endingIndex = preCaretRange.toString().length;
            let startingIndex = 0; // Inicialización
            let textContent = e.target.innerText;

            // Calcula startingIndex: Retrocede hasta encontrar un delimitador o el inicio del texto
            for (let i = endingIndex - 1; i >= 0; i--) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === 0) {
                    startingIndex = (i === 0 && (textContent[i] !== ' ' && textContent[i] !== '\n')) ? i : i + 1;
                    break;
                }
            }

            // Ajusta endingIndex: Avanza hasta encontrar un delimitador o el final del texto
            for (let i = endingIndex; i <= textContent.length; i++) {
                if (textContent[i] === ' ' || textContent[i] === '\n' || i === textContent.length) {
                    endingIndex = i;
                    break;
                }
            }

            console.log("Texto seleccionado:", textContent.substring(startingIndex, endingIndex)); // Debugging
            console.log("palabra_actual:", palabra_actual); // Debugging
            console.log("Índices:", startingIndex, endingIndex); // Debugging

        if (
            palabra_actual.some(palabra => textContent
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {

            definicion.innerHTML = "";
            texto.focus();
            asignada = false;
            feedback.style.color = "white";
            feedback.innerHTML = "+🎨 insp.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            color = "white"
            tiempo_feed = feedback.innerHTML;
            socket.emit("nueva_palabra_musa", player);
            socket.emit(feedback_de_j_x, { color, tiempo_feed});
        }
    }
}

function modo_letra_prohibida(e) {
    let letra = e.key;  // Captura la letra tecleada
  
    if (
      toNormalForm(letra) === letra_prohibida || 
      toNormalForm(letra) === letra_prohibida.toUpperCase()
    ) {
      e.preventDefault();  // Evita el comportamiento predeterminado del evento de tecla
    /*
      let sel = window.getSelection();
      let range = sel.getRangeAt(0);
  
      // Crea un nodo de texto para la letra
      let textNode = document.createTextNode(letra);
  
      // Crea un span con la clase para el color y coloca el nodo de texto dentro
      let span = document.createElement("span");
      span.className = "letra-roja";
      span.appendChild(textNode);
  
      // Crea nodos de texto vacíos para actuar como delimitadores
      let emptyTextNodeBefore = document.createTextNode("");
      let emptyTextNodeAfter = document.createTextNode("");
  
      // Inserta los nodos en el DOM
      range.insertNode(emptyTextNodeBefore);
      range.insertNode(span);
      range.insertNode(emptyTextNodeAfter);
  
      // Mueve el cursor a la derecha del nodo span
      range.setStartAfter(span);
      range.setEndAfter(span);
      sel.removeAllRanges();
      sel.addRange(range);
  
      // Borra el span después de medio segundo
      setTimeout(() => {
        span.parentNode.removeChild(span);
      }, 100);
      */

      // Actualiza otros aspectos de la UI y envía eventos a través de Socket.io
      // Aquí iría la lógica para manejar la UI y eventos de Socket.io (la he mantenido igual)
      secs = -2;
      console.log(secs);
      socket.emit('aumentar_tiempo', {secs, player});
      puntos.innerHTML = puntos_ + " palabras";
      sendText();
      feedback.style.color = color_negativo;
      feedback.innerHTML = "⏱️-2 segs.";
      clearTimeout(delay_animacion);
      animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
          feedback.innerHTML = "";
        }, 2000);
      });
      color = color_negativo;
      tiempo_feed = feedback.innerHTML;
      socket.emit(feedback_de_j_x, { color, tiempo_feed });
    }
  }
  
  // Esta función se llama cuando se presiona una tecla
  function modo_letra_bendita(e) {
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }

    let letra = e.key; // Captura la letra tecleada
    let sel = window.getSelection();
    let range = sel.getRangeAt(0);
    let node = sel.anchorNode;

    // Añadido: Procesar tecla Backspace
    if (e.key === 'Backspace') {
        console.log('Node:', node);
        console.log('Parent Node:', node.parentNode);
        console.log('Parent Node class:', node.parentNode ? node.parentNode.className : 'No parent node');
        console.log('Focus Offset:', sel.focusOffset);

        if (node && node.parentNode.className === 'letra-verde' && sel.focusOffset === 0) {
            e.preventDefault(); // Prevenir el comportamiento por defecto de la tecla Backspace
            secs = -2
            socket.emit('aumentar_tiempo', {secs, player}); // Emitir el evento de socket
            // Feedback visual
            feedback.style.color = color_negativo;
            feedback.innerHTML = "⏱️-1 segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            // Envío de feedback a través de Socket.io
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed: feedback.innerHTML });
        }
        return; // Salir de la función si la tecla es Backspace
    }

    if (letra.length === 1) {
        if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
            (letra_bendita === "ñ" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
            e.preventDefault();
            console.log('Se procesa letra bendita');

            let textNode = document.createTextNode(letra);
            let span = document.createElement("span");
            span.className = "letra-verde";
            span.appendChild(textNode);

            let emptyTextNodeBefore = document.createTextNode("");
            let emptyTextNodeAfter = document.createTextNode("");

            range.insertNode(emptyTextNodeBefore);
            range.insertNode(span);
            range.insertNode(emptyTextNodeAfter);

            range.setStartBefore(emptyTextNodeBefore);
            range.setEndBefore(emptyTextNodeBefore);
            sel.removeAllRanges();
            sel.addRange(range);
            secs = 2;
            socket.emit('aumentar_tiempo', {secs, player});
            puntos.innerHTML = puntos + " palabras";
            sendText();

            // Feedback visual
            feedback.style.color = color_positivo;
            feedback.innerHTML = "⏱️+2 segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });

            // Envío de feedback a través de Socket.io
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed: feedback.innerHTML });
        } else {
            if (node && node.parentNode.className === 'letra-verde') {
                e.preventDefault();

                let newTextNode = document.createTextNode(letra);
                if (sel.focusOffset === 0) {
                    node.parentNode.parentNode.insertBefore(newTextNode, node.parentNode);
                } else {
                    if (node.parentNode.nextSibling) {
                        node.parentNode.parentNode.insertBefore(newTextNode, node.parentNode.nextSibling);
                    } else {
                        node.parentNode.parentNode.appendChild(newTextNode);
                    }
                }
                range.setStartAfter(newTextNode);
                range.setEndAfter(newTextNode);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
    // Aquí podrías añadir más comportamientos para otras teclas no imprimibles si lo consideras necesario
}


  

function modo_psicodélico() {
    stylize();
}

function limpieza(){
    stopConfetti();
    clearTimeout(listener_cuenta_atras);
    clearTimeout(timer);
    if(temp_text_inverso_activado == true){
        clearTimeout(tempo_text_inverso);
        procesarTexto();
    }

    texto.innerText = "";
    texto.style.display = "";
    texto.style.height = "";
    feedback_tiempo.style.color = color_positivo;
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    texto.contentEditable= "false";
    puntos.innerHTML = 0 + " palabras";
    nivel.innerHTML = "nivel 0";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    texto.focus();

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");

    puntos_palabra = 0;
    puntos_ = 0;
    puntos_letra_prohibida = 0;
    puntos_letra_bendita = 0;

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    locura = false;
    console.log(puntos)
    
    feedback.innerHTML = "";
    
    definicion.innerHTML = "";
    explicación.innerHTML = "";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = 4000;
    rapidez_inicio_borrado = 4000;

    caracteres_seguidos = 0;
    
    for (let key in LIMPIEZAS) { 
        console.log(key)
        LIMPIEZAS[key]();
    }

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    clearTimeout(tempo_text_borroso);
}

function limpieza_final(){
    texto.contentEditable= "false";
    texto.style.display = "none";
    temas.display = "none";
    temas.innerHTML = "";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";

    definicion.style.fontSize = "1.5vw";

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.

    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    locura = false;

    tiempo.style.color = "white";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = 4000;
    rapidez_inicio_borrado = 4000;

    LIMPIEZAS["psicodélico"]("");

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    //clearTimeout(tempo_text_borroso);
}

function pausa(){

    menu_modificador = false;
    texto.contentEditable= "false";

    clearTimeout(borrado);
    desactivar_borrar = true;
}

function reanudar(){

    menu_modificador = true;
    texto.contentEditable = "true";

    clearTimeout(borrado);
    desactivar_borrar = false;
    
    texto.focus();
}

function modo_borroso_pausa(data){
    console.log(tiempo_restante)
    if(tiempo_restante > 0){
        modo_borroso(data);
    }
}

function modo_inverso_pausa(){
    if(tiempo_restante > 0){
        desactivar_borrar = true;
        caretNode, caretPos = guardarPosicionCaret();
        texto.contentEditable= "false";
        texto.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto.addEventListener('animationend', function() {
            texto.classList.remove("rotate-vertical-center");
            texto.contentEditable= "true";
            texto.focus()
            // Obtener el último nodo de texto en text
            lastLine = texto.lastChild;
            lastTextNode = lastLine;
            while (lastTextNode && lastTextNode.nodeType !== 3) {
                lastTextNode = lastTextNode.lastChild;
            }
            
            // Si encontramos el último nodo de texto, colocamos el cursor allí
            if (lastTextNode) {
                caretNode = lastTextNode;
                caretPos = lastTextNode.length;
                restaurarPosicionCaret(caretNode, caretPos);
            }
            texto.removeEventListener('animationend', arguments.callee);
        });
        
        procesarTexto();
        
        sendText();
        temp_text_inverso_activado = true;
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            desactivar_borrar = false;
            texto.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.contentEditable= "true";
                texto.focus()
                // Obtener el último nodo de texto en text
                lastLine = texto.lastChild;
                lastTextNode = lastLine;
                while (lastTextNode && lastTextNode.nodeType !== 3) {
                    lastTextNode = lastTextNode.lastChild;
                }
                
                // Si encontramos el último nodo de texto, colocamos el cursor allí
                if (lastTextNode) {
                    caretNode = lastTextNode;
                    caretPos = lastTextNode.length;
                    restaurarPosicionCaret(caretNode, caretPos);
                }
                texto.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            putada_actual = "";
        sendText()  
        }, TIEMPO_INVERSO);
    }
}

function tiempo_borrado_menos(){
    borrado_cambiado = true;
    antiguo_rapidez_borrado = rapidez_borrado;
    antiguo_inicio_borrado = rapidez_inicio_borrado;
    rapidez_borrado = 7000;
    rapidez_inicio_borrado = 7000;
    setTimeout(function () {
        borrado_cambiado = false;
        rapidez_borrado = antiguo_rapidez_borrado;
        rapidez_inicio_borrado = antiguo_inicio_borrado;
    }, TIEMPO_BORRADO);
}

function enviar_putada(putada){

    socket.emit("enviar_putada_a_jx", {player, putada});
}

function tiempo_muerto(){
    socket.emit("tiempo_muerto_a_control", '');
}

function borroso(){
    putada = "borroso";
    socket.emit("enviar_putada_a_jx", player, putada);
}

function inverso(){
    putada = "inverso";
    socket.emit("enviar_putada_a_jx", player, putada);
}

function modo_borroso(data){
    if (modo_texto_borroso == 1) {
        texto.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto.classList.remove("textarea_blur");
            modo_texto_borroso = 0
            putada_actual = ""
        }, data);   
    }
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

function final(){
    
    menu_modificador = false;
    limpieza_final();
    
    modo_actual = "";
    putada_actual = "";
    activar_sockets_extratextuales();

    // Impide que se pueda escribir en los dos textos.
    texto.contentEditable= "false";

    // Variable booleana que dice si la ronda ha terminado o no.
    terminado = true;

    texto.style.height = "auto";
    texto.style.height = texto.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
    texto.style.display = "none";
    
    logo.style.display = "";
    neon.style.display = "";
    LIMPIEZAS["psicodélico"]("");/* TODO: VER POR QUÉ NO FUNCIONA ESTO  */
    texto.removeEventListener("keyup", listener_modo_psico);
    restablecer_estilo();
    tiempo.style.color = "white";
}

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }
  
// El URL de tu servidor LanguageTool
const apiUrl = 'https://language-tool.zeabur.app/v2/check?language=es-ES&disabledRules=UPPERCASE_SENTENCE_START&text=';
let ultimoOffsetVerificado = 0;  // Guarda la última posición verificada

const penalizaciones = {
    "Cambios en las normas lingüísticas": -1,
    "Concordancia en grupos nominales": -2,
    "Concordancia sujeto/predicado": -2,
    "Confusiones": -1,
    "Confusiones (2)": -1,
    "Diacríticos (tilde)": -1,
    "Errores según el contexto": -1,
    "Estilo": -1,
    "Expresiones incorrectas": -1,
    "Gramática": -2,
    "Mayúsculas y minúsculas": -1,
    "Miscellaneous": -1,
    "Ortografía": -1,
    "Posible error ortográfico": -1,
    "Preposiciones": -1,
    "Puntuación": -1,
    "Redundancias": -1,
    "Reglas específicas para Wikipedia": -1,
    "Repeticiones (estilo)": -1,
    "Semàntica": -1,
    "Tipografía": -1,
    "Variedades de lengua": -1,
    "Varios": -1,
    "diacríticos (experimental)": -1,
    "expresiones preferibles": -1,
    "nombres propios": -1,
    "repeticiones": -1,
    "tipografía avanzada": -1
};

// Función que determina la penalización basada en la categoría de error
function determinarPenalizacion(categoria) {
    return penalizaciones[categoria] || -1;  // Devuelve -1 si la categoría no está en el objeto
}

// Función que hace la petición al servidor
function hacerPeticion(textoDesdeUltimoOffset) {
    return fetch(apiUrl + encodeURIComponent(textoDesdeUltimoOffset))
    .then(response => response.json())
    .then(data => {
        let totalPenalizacion = 0;
        console.log(`Número de errores detectados: ${data.matches.length}`);
        // Imprimir detalles de cada error y calcular penalización
        data.matches.forEach((error, index) => {
            const palabraError = textoDesdeUltimoOffset.substr(error.context.offset, error.context.length);
            const penalizacion = determinarPenalizacion(error.rule.category.name);
            totalPenalizacion += penalizacion;

            console.log(`Error ${index + 1}:`);
            console.log(`- Mensaje: ${error.message}`);
            console.log(`- Palabra con error: ${palabraError}`);
            console.log(`- Texto completo del error: ${error.context.text}`);
            console.log(`- Penalización: ${penalizacion}`);
            console.log('-------------------------');
        });
        
        console.log(`Penalización total: ${totalPenalizacion}`);
        // Actualizar el último offset verificado
        ultimoOffsetVerificado = textoDesdeUltimoOffset.length;
        return totalPenalizacion;
    })
    .catch(error => {
        console.error('Error al hacer la petición:', error);
    });
}

let punteroInicio = 0;  // Global que representa el inicio del texto a verificar en la siguiente iteración

function ajustarPunteros(texto) {
    let punteroFinal = texto.length;

    // Si el punteroFinal está en medio de una palabra, retrocede hasta el espacio anterior
    while (punteroFinal > punteroInicio && texto[punteroFinal - 1] !== ' ') {
        punteroFinal--;
    }

    // Ahora, si el punteroInicio está en medio de una palabra, avanza hasta el espacio siguiente
    while (punteroInicio < punteroFinal && texto[punteroInicio] !== ' ') {
        punteroInicio++;
    }

    return texto.substring(punteroInicio, punteroFinal).trim();  // trim() para eliminar espacios adicionales
}

function modo_ortografía_perfecta() {
    setInterval(() => {
        // Tomar solo el nuevo texto desde el puntero de inicio hasta el final ajustado
        const nuevoTexto = ajustarPunteros(texto.innerText);
        // Actualizar el puntero de inicio global para la próxima iteración
        punteroInicio += nuevoTexto.length;

        hacerPeticion(nuevoTexto).then(descuento => {
            if(descuento != 0) {
                feedback.style.color = color_negativo;
                feedback.innerHTML = "⏱️" + descuento +" segs.";
                clearTimeout(delay_animacion);
                animateCSS(".feedback1", "flash").then((message) => {
                    delay_animacion = setTimeout(function () {
                        feedback.innerHTML = "";
                    }, 2000);
                });
            }
        });
    }, 10000);
}

function invertirPalabras(texto) {
    return texto.split(' ').map(palabra => palabra.split('').reverse().join('')).join(' ');
}

function procesarTexto() {
    let fragmento = document.createDocumentFragment();

    texto.childNodes.forEach(nodo => {
        if (nodo.nodeType === Node.TEXT_NODE) {
            // Texto dentro del div, fuera de cualquier otro elemento
            let textoInvertido = invertirPalabras(nodo.textContent);
            fragmento.appendChild(document.createTextNode(textoInvertido));
        } else if (nodo.nodeType === Node.ELEMENT_NODE) {
            // Copia el nodo (p.ej., <br>, <div>) y procesa su contenido si es necesario
            let copiaNodo = nodo.cloneNode(false);
            if (nodo.childNodes.length > 0) {
                let textoInvertido = invertirPalabras(nodo.textContent);
                copiaNodo.textContent = textoInvertido;
            }
            fragmento.appendChild(copiaNodo);
        }
    });

    texto.innerHTML = '';
    texto.appendChild(fragmento);
}

function efectoMaquinaDeEscribir(elemento, textoHtml, velocidad = 100) {
    let cursor = 0; // Índice para recorrer el textoHtml
    elemento.contentEditable = "false"; // Asegúrate de que esto se refiere al elemento correcto
    desactivar_borrar = true;
    // Agrega un salto de línea al principio del contenido a escribir, si el elemento ya tiene contenido
    let contenidoInicial = elemento.innerHTML;
    if (contenidoInicial) {
        contenidoInicial += "<br>"; // Añade un salto de línea antes del nuevo contenido
    }

    function escribir() {
        elemento.scrollTo(0, elemento.scrollHeight);
        if (cursor < textoHtml.length) {
            if (textoHtml.substring(cursor).startsWith('<span')) {
                let finSpan = textoHtml.indexOf('</span>', cursor) + '</span>'.length;
                elemento.innerHTML = contenidoInicial + textoHtml.substring(0, finSpan) + (cursor + 1 < textoHtml.length ? "<br>" : ""); // Agrega salto de línea al final si no es el fin
                cursor = finSpan;
                sendText();
            } else {
                elemento.innerHTML = contenidoInicial + textoHtml.substring(0, cursor + 1) + (cursor + 1 < textoHtml.length ? "<br>" : ""); // Agrega salto de línea al final si no es el fin
                cursor++;
                sendText();
            }

            setTimeout(escribir, textoHtml.substring(cursor).startsWith('<span') ? 0 : velocidad);
        } else {
            elemento.innerHTML += "<br><br><br>";
            sendText()

                // Asumiendo que 'texto' es el elemento contenedor
                let lastLine = texto.lastChild;
                let lastTextNode = lastLine;
                while (lastTextNode && lastTextNode.nodeType !== 3) {
                    // Esto maneja el caso cuando lastTextNode no tiene más hijos (nodos de texto)
                    if (!lastTextNode.lastChild) break;
                    lastTextNode = lastTextNode.lastChild;
                }

            // Si encontramos el último nodo de texto o un elemento, colocamos el cursor allí
            if (lastTextNode) {
                let range = document.createRange(); // Crea un nuevo rango
                let sel = window.getSelection();

                if (lastTextNode.nodeType === 3) { // Es un nodo de texto
                    range.setStart(lastTextNode, lastTextNode.length);
                    range.setEnd(lastTextNode, lastTextNode.length);
                } else { // No es un nodo de texto, intenta establecer el rango al final del elemento
                    range.setStart(lastTextNode, lastTextNode.childNodes.length);
                    range.setEnd(lastTextNode, lastTextNode.childNodes.length);
                }

                sel.removeAllRanges();
                sel.addRange(range);
            }

            texto.focus(); 
            texto.scrollTo(0, texto.scrollHeight);
            elemento.contentEditable = "true"; // Habilita la edición al finalizar
            elemento.focus(); // Coloca el foco en el elemento
            desactivar_borrar = false;
        }
    }

    escribir();
}

function confetti_musas(){
var scalar = 2;
var unicorn = confetti.shapeFromText({ text: '🎨', scalar });
isConfettiRunning = true;

var end = Date.now() + (2 * 1000);

// go Buckeyes!
(function frame() {
  confetti({
    startVelocity: 10,
    particleCount: 1,
    angle: 270,
    spread: 1000,
    origin: { y: 0 },
    shapes: [unicorn],
    scalar: 3
  });

  if ((Date.now() < end) && isConfettiRunning) {
    requestAnimationFrame(frame);
  }
}());
}