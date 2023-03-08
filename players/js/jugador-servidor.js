var player = getParameterByName("player");
const remoteServerUrl = 'https://scri-b.up.railway.app';
const localServerUrl = 'http://localhost:3000';
let feedback_a_j_x;
let feedback_de_j_x;
let texto_x;
let texto_y;
let enviar_postgame_x;
let recibir_postgame_x;

const getEl = (id) => document.getElementById(id); // Obtiene los elementos con id.

  // COMPONENTES DEL JUGADOR 1
  let nombre1;
  let texto1 = getEl("texto");
  let puntos1 = getEl("puntos");
  let nivel1 = getEl("nivel");
  let feedback1 = getEl("feedback1");
  let alineador1 = getEl("alineador1");
  
  let palabra1 = getEl("palabra");
  let definicion1 = getEl("definicion");
  let explicación = getEl("explicación");
  
  // Tiempo restante de la ronda.
  let tiempo = getEl("tiempo");
  let temas = getEl("temas");
  
  // COMPONENTES DEL JUGADOR 2
  let nombre2;
  let texto2 = getEl("texto1");
  let puntos2 = getEl("puntos1");
  let nivel2 = getEl("nivel1");
  let feedback2 = getEl("feedback2");
  let alineador2 = getEl("alineador2");
  
  let focalizador1 = getEl("focalizador1");
  let focalizador2 = getEl("focalizador2");
  
  let puntuacion_final1 = getEl("puntuacion_final1");
  let puntuacion_final2 = getEl("puntuacion_final2");
  

let tempo_text_borroso;

// Variables de los modos.
let modo_actual = "";
let modo_texto_borroso = false;
let desactivar_borrar = false;

var letra_prohibida = "";
var letra_bendita = "";
let listener_modo;

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
    feedback_a_j_x = 'feedback_a_j1';
    feedback_de_j_x = 'feedback_de_j1';
    texto_x = 'texto1'
    texto_y= 'texto2';
    enviar_postgame_x = 'enviar_postgame1';
    recibir_postgame_x = 'recibir_postgame1';
    nombre1 = getEl("nombre");
    nombre1.value = "ESCRITXR 1"
    nombre2 = getEl("nombre1");
    nombre2.value = "ESCRITXR 2";

} else if (player == 2) {
    feedback_a_j_x = 'feedback_a_j2';
    feedback_de_j_x = 'feedback_de_j2';
    texto_x = 'texto2'
    texto_y= 'texto1';
    enviar_postgame_x = 'enviar_postgame2';
    recibir_postgame_x = 'recibir_postgame2';
    nombre1 = getEl("nombre1");
    nombre1.value="ESCRITXR 1";
    nombre2 = getEl("nombre");
    nombre2.value="ESCRITXR 2";
}

console.log(texto_x)
// Se establece la conexión con el servidor.
let socket = io(localServerUrl);

socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
    socket.io.uri = remoteServerUrl;
    socket.connect();
  });

const MODOS = {
    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        activar_socket_feedback();
        explicación.innerHTML = "MODO PALABRAS BONUS";
        socket.on('enviar_palabra', data => {
            recibir_palabra(data);
        });
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        activar_socket_feedback();
        letra_prohibida = data.letra_prohibida;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto1.addEventListener("keyup", listener_modo);
        explicación.innerHTML = "MODO LETRA PROHIBIDA";
        palabra1.innerHTML = "LETRA PROHIBIDA: " + letra_prohibida;
        definicion1.innerHTML = "";
    },

    "letra bendita": function (data) {
        activar_socket_feedback();
        letra_bendita = data.letra_bendita;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto1.addEventListener("keyup", listener_modo);
        explicación.innerHTML = "MODO LETRA BENDITA";
        palabra1.innerHTML = "LETRA BENDITA: " + letra_bendita;
        definicion1.innerHTML = "";
    },

    "texto borroso": function (data) {
        modo_texto_borroso = true;
        explicación.innerHTML = "MODO TEXTO NUBLADO";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        if (data.jugador == 1) {
            if(player == 1){
            texto1.classList.add("textarea_blur");
            tempo_text_borroso = setTimeout(function () {
                texto1.classList.remove("textarea_blur");
                texto2.classList.add("textarea_blur");
            }, data.duracion);
            }
            else{
                texto2.classList.add("textarea_blur");
                tempo_text_borroso = setTimeout(function () {
                    texto2.classList.remove("textarea_blur");
                    texto1.classList.add("textarea_blur");
                }, data.duracion);
            }
        }
        if (data.jugador == 2) {
            console.log("ENTRO")
            if(player == 2){
                texto1.classList.add("textarea_blur");
                tempo_text_borroso = setTimeout(function () {
                    texto1.classList.remove("textarea_blur");
                    texto2.classList.add("textarea_blur");
                }, data.duracion);
                }
            else{
                texto2.classList.add("textarea_blur");
                tempo_text_borroso = setTimeout(function () {
                    texto2.classList.remove("textarea_blur");
                    texto1.classList.add("textarea_blur");
                    }, data.duracion);
                }
        }
    },

    "psicodélico": function (data) {
        explicación.innerHTML = "MODO PSICODÉLICO";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        listener_modo = function () { modo_psicodélico() };
        texto1.addEventListener("keyup", listener_modo);
        /*socket.on("psico_a_j1", (data) => {
            stylize();
        });*/
    },

    "texto inverso": function (data) {
        desactivar_borrar = true;
        explicación.innerHTML = "MODO TEXTO INVERSO";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        texto1.value =
            //crear_n_saltos_de_linea(saltos_línea_alineacion_1) +
            //eliminar_saltos_de_linea(texto1.value)
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

const LIMPIEZAS = {
    "palabras bonus": function (data) {
        socket.off(feedback_a_j_x);
        //socket.off("enviar_palabra");
        asignada = false;
        texto1.removeEventListener("keyup", listener_modo);
    },

    "letra prohibida": function (data) {
        socket.off(feedback_a_j_x);
        texto1.removeEventListener("keyup", listener_modo);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        socket.off(feedback_a_j_x);
        texto1.removeEventListener("keyup", listener_modo);
        letra_bendita = "";
    },

    "texto borroso": function (data) {
        modo_texto_borroso = false;
        texto1.classList.remove("textarea_blur");
        texto2.classList.remove("textarea_blur");
    },

    "psicodélico": function (data) {
        //socket.off('psico_a_j1');
        texto1.removeEventListener("keyup", listener_modo);
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
    },

    "texto inverso": function (data) {
        desactivar_borrar = false;
        texto1.value =
            //crear_n_saltos_de_linea(saltos_línea_alineacion_1) +
            //eliminar_saltos_de_linea(texto1.value)
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

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto1.addEventListener("keyup", (evt) => {
    countChars(texto1);
    sendText();
    //auto_grow(texto1);
});
// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto1.addEventListener("keydown", (evt) => {
    countChars(texto1);
    sendText();
    //auto_grow(texto1);
    focalizador1.scrollIntoView({ block: "end" });
});

//activar los sockets extratextuales.
activar_sockets_extratextuales();

// Recibe los datos del jugador 2 y los coloca.
socket.on(texto_y, (data) => {
    texto2.value = data.text;
    puntos2.innerHTML = data.points;
    nivel2.innerHTML = data.level;
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
      while (texto2.scrollHeight > texto1.scrollHeight) {
        saltos_línea_alineacion_1 += 1;
        texto1.value = "\n" + texto1.value;
      }
    } else {
      while (texto2.scrollHeight < texto1.scrollHeight) {
        saltos_línea_alineacion_2 += 1;
        texto2.value = "\n" + texto2.value;
      }
    }*/
    //texto2.style.height = texto2.scrollHeight + "px";
    texto2.scrollTop = texto2.scrollHeight;
    //window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView({ block: "end" });
});

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", (data) => {
    texto1.focus();
    if (data == "00:20") {
        tiempo.style.color = "yellow"
    }
    if (data == "00:10") {
        tiempo.style.color = "red"
    }
    tiempo.innerHTML = data;
    if (data == "¡Tiempo!") {
        LIMPIEZAS[modo_actual](data);
        limpieza_final();
        
        modo_actual = "";
        activar_sockets_extratextuales();
        /*texto1.value = texto1.value.substring(
            saltos_línea_alineacion_1,
            texto1.value.length
        );
        texto2.value = texto2.value.substring(
            saltos_línea_alineacion_2,
            texto2.value.length
        );*/

        // Impide que se pueda escribir en los dos textos.
        texto1.disabled= true;

        // Variable booleana que dice si la ronda ha terminado o no.
        terminado = true;

        socket.on(recibir_postgame_x, (data) => {
            focalizador2.innerHTML = "<br>🖋️ Caracteres escritos = " + data.longitud + "<br>📚 Palabras bonus = " + data.puntos_palabra + "<br>❌ Letra prohibida = " + data.puntos_letra_prohibida + "<br>😇 Letra bendita = " + data.puntos_letra_bendita;
        });
        setTimeout(postgame, 1000);
        //texto1.value = eliminar_saltos_de_linea(texto1.value); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
        //texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto2.style.height = "auto";
        texto1.style.height = texto1.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
        texto2.style.height = texto2.scrollHeight + "px"; // Reajustamos el tamaño del área de texto del j2.

        /*let a = document.createElement("a");
            a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").value +"\n"+texto1.value +"\n"+ document.getElementById("nombre1").value +"\n"+texto2.value ], {type: "text/plain"}));
            blob = new Blob([document.getElementById("nombre").value +"\n"+texto1.value +"\n"+ document.getElementById("nombre1").value +"\n"+texto2.value ], {type: "text/plain"});
            a.download = 'sesión_player1.txt';
            a.click();*/
        
        logo.innerHTML = "<p class='sub'>powered by</p><img src='../img/logo.png' alt='' width='5%'/>";
    }
});

// Inicia el juego.
socket.on("inicio", (data) => {
    limpieza();

    socket.off("nombre1");
    socket.off("nombre2");
    socket.off("recibir_puntuacion_final");
    
    //socket.off("recibe_temas");
    texto1.disabled= false;

    texto1.style.height = "";
    texto2.style.height = "";
    texto1.rows = 2;
    texto2.rows = 2;

    /*saltos_línea_alineacion_1 = 0;
    saltos_línea_alineacion_2 = 0;*/

    logo.innerHTML = "";

});

// Resetea el tablero de juego.
socket.on("limpiar", (data) => {
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on("nombre2", (data) => {
        nombre2.value = data;
    });

    // Recibe el nombre del jugador 1 y lo coloca en su sitio.
    socket.on("nombre1", (data) => {
        nombre1.value = data;
    });

    LIMPIEZAS[modo_actual](data);
    limpieza();
    
    modo_actual = "";

    nombre1.value = "ESCRITXR 1";
    nombre2.value = "ESCRITXR 2";
    
    texto1.disabled= true;

    /*saltos_línea_alineacion_1 = 0;
    saltos_línea_alineacion_2 = 0;
    
    texto1.style.height = "40";
    texto2.style.height = "40";*/

    logo.innerHTML = "<p class='sub'>powered by</p><img src='../img/logo.png' alt='' width='5%'/>";    

    activar_sockets_extratextuales();
});

socket.on("activar_modo", (data) => {
    animacion_modo();
    console.log("ANTERIOR: " + modo_actual);
    LIMPIEZAS[modo_actual](data);
    modo_actual = data.modo_actual;
    console.log("NUEVO MODO: " + modo_actual);
    MODOS[modo_actual](data, socket);
});

socket.on('enviar_palabra', data => {
    recibir_palabra(data);
});

function recibir_palabra(data) {
    animacion_modo();
    console.log("palabra: ", data.palabra_bonus)
    asignada = true;
    palabra_actual = data.palabra_bonus[0];
    
    palabra1.innerHTML = "(+" + data.puntuacion + " pts) palabra: " + data.palabra_bonus[0];
    definicion1.innerHTML = data.palabra_bonus[1];
    puntuacion = data.puntuacion;
    indice_buscar_palabra = texto1.value.length - 5;
    texto1.removeEventListener("keyup", listener_modo);
    listener_modo = function () { modo_palabras_bonus() };
    texto1.addEventListener("keyup", listener_modo);
}

// FUNCIONES AUXILIARES.

// Función para enviar texto al otro jugador y a control
function sendText() {
    let text = texto1.value;
    let points = puntos1.textContent;
    let level = nivel1.textContent;
    socket.emit(texto_x, { text, points, level });
}

function activar_sockets_extratextuales() {
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on("nombre2", (data) => {
        nombre2.value = data;
    });

    // Recibe el nombre del jugador 1 y lo coloca en su sitio.
    socket.on("nombre1", (data) => {
        nombre1.value = data;
    });

    //Recibe los temas (que elige Espectador) y los coloca en su sitio.
    socket.on("recibe_temas", (data) => {
        temas.innerHTML = data;
    });

    socket.on('recibir_puntuacion_final', data => {
        puntuacion_final1.innerHTML =  data.pfinal1;
        puntuacion_final2.innerHTML =  data.pfinal2;
    });
}

function activar_socket_feedback() {
    socket.on(feedback_a_j_x, (data) => {
        feedback2.style.color = data.color;
        feedback2.innerHTML = data.envio_puntos.toString() + " pts";
        animateCSS(".feedback2", "bounceInLeft").then((message) => {
            delay_animacion = setTimeout(function () {
                feedback2.innerHTML = "";
            }, 2000);
        });
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
    texto1.style.fontFamily = getRandFontFamily();
    texto1.style.color = getRandColor();
    //var tamaño_letra = getRandNumber(7, 35)
    //text.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    texto1.style.textAlign = getTextAlign();
    texto2.style.textAlign = getTextAlign();
    texto2.style.fontFamily = getRandFontFamily();
    texto2.style.color = getRandColor();
    //text1.style.fontSize = tamaño_letra + "px"; // Font sizes between 15px and 35px
    document.body.style.backgroundColor = getRandColor();
    //texto1.style.height = texto1.scrollHeight + "px";
    //texto2.style.height = texto2.scrollHeight + "px";
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

// Función auxiliar que reestablece el estilo inicial de la página modificado por el modo psicodélico.
function restablecer_estilo() {
    texto1.style.fontFamily = "monospace";
    texto1.style.color = "white";
    texto1.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    texto1.style.textAlign = "justify";
    texto2.style.fontFamily = "monospace";
    texto2.style.color = "white";
    texto2.style.fontSize = 16 + "pt"; // Font sizes between 15px and 35px
    texto2.style.textAlign = "justify";
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
    return texto.substring(i, texto.length);
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

//Función auxiliar que comprueba que se inserta la palabra bonus.
function modo_palabras_bonus() {
    if (asignada == true) {
        if (
            texto1.value
                .substring(indice_buscar_palabra, texto1.value.length)
                .toLowerCase()
                .includes(palabra_actual)
        ) {
            //var $div = $('#texto');
            //$div.highlight(palabra_actual);
            texto1.focus();
            asignada = false;
            socket.emit("nueva_palabra", asignada);
            puntos_palabra += puntuacion;
            puntos = texto1.value.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
            cambiar_color_puntuación();
            puntos1.innerHTML = puntos + " puntos";
            feedback1.style.color = color_positivo;
            feedback1.innerHTML = "+" + puntuacion + " pts";
            color = color_positivo;
            envio_puntos = "+" + puntuacion;
            socket.emit(feedback_de_j_x, { color, envio_puntos });
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "bounceInLeft").then(() => {
                delay_animacion = setTimeout(function () {
                    feedback1.innerHTML = "";
                }, 2000);
            });
        }
    }
}

function modo_letra_prohibida(e) {
    letra = e.key
    if (
        toNormalForm(letra) ==
        letra_prohibida ||
        toNormalForm(letra) ==
        letra_prohibida.toUpperCase()
    ) {
        position = e.target.selectionStart;
        texto1.value = texto1.value.substring(0, position - 1) + texto1.value.substring(position + 1);
        puntos_letra_prohibida += 50;
        puntos = texto1.value.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
        cambiar_color_puntuación();
        puntos1.innerHTML = puntos + " puntos";
        sendText();
        feedback1.style.color = color_negativo;
        feedback1.innerHTML = "-50 pts";
        color = color_negativo;
        envio_puntos = "-50";
        socket.emit(feedback_de_j_x, { color, envio_puntos });
        clearTimeout(delay_animacion);
        animateCSS(".feedback1", "bounceInRight").then(() => {
            delay_animacion = setTimeout(function () {
                feedback1.innerHTML = "";
            }, 2000);
        });
    }
}

function modo_letra_bendita(e) {
    letra = e.key;
    if (
        (toNormalForm(letra) ==
        letra_bendita ||
        toNormalForm(letra) ==
        letra_bendita.toUpperCase()) || letra_bendita == "ñ" &&
        (letra ==
        letra_bendita ||
        letra ==
        letra_bendita.toUpperCase())
    ) {
        position = e.target.selectionStart;
        puntos_letra_bendita += 50;
        puntos = texto1.value.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
        cambiar_color_puntuación();
        puntos1.innerHTML = puntos + " puntos";
        sendText();
        feedback1.style.color = color_positivo;
        feedback1.innerHTML = "+50 pts";
        color = color_positivo;
        envio_puntos = "+50";
        socket.emit(feedback_de_j_x, { color, envio_puntos });
        clearTimeout(delay_animacion);
        animateCSS(".feedback1", "bounceInRight").then(() => {
            delay_animacion = setTimeout(function () {
                feedback1.innerHTML = "";
            }, 2000);
        });
    }
}

function modo_psicodélico() {
    //socket.emit("psico", 1);
    stylize();
}

function postgame() {
    actualizar_puntuación();
    longitud = texto1.value.length;
    if (puntos_letra_prohibida != 0) {
        puntos_letra_prohibida = -puntos_letra_prohibida;
    }
    socket.emit(enviar_postgame_x, { longitud, puntos_palabra, puntos_letra_prohibida, puntos_letra_bendita });
    focalizador1.innerHTML = "<br>🖋️ Caracteres escritos = " + texto1.value.length + " pts" +
                            "<br>📚 Palabras bonus = " + puntos_palabra + " pts" +
                            "<br>❌ Letra prohibida = " + puntos_letra_prohibida + " pts" +
                            "<br>😇 Letra bendita = " + puntos_letra_bendita + " pts";
    puntos_palabra = 0;
    puntos = 0;
    puntos_letra_prohibida = 0;
    puntos_letra_bendita = 0;
}

function actualizar_puntuación() {
    puntos = texto1.value.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
    puntos1.innerHTML = puntos + " puntos";
    cambio_nivel(puntos);
    sendText();
    //auto_grow(texto1);
    cambiar_color_puntuación();
}

function cambiar_color_puntuación() {
    if (puntos > parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        puntos1.style.color = "green";
        puntos2.style.color = "red";
        if (puntos == parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
            puntos2.style.color = "green";
        }
    }
    else {
        puntos1.style.color = "red";
        puntos2.style.color = "green";
    }
}

function limpieza(){
    nombre1.disabled = true;
    nombre2.disabled = true;

    texto1.value = "";
    texto2.value = "";

    texto2.disabled= true;

    puntos1.innerHTML = "0 puntos";
    puntos2.innerHTML = "0 puntos";
    
    nivel1.innerHTML = "nivel 0";
    nivel2.innerHTML = "nivel 0";
    
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicación.innerHTML = "";

    focalizador1.innerHTML = "";
    focalizador2.innerHTML = "";

    texto1.focus();

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto1.classList.remove("textarea_blur");
    texto2.classList.remove("textarea_blur");

    puntos_palabra = 0;
    puntos = 0;
    puntos_letra_prohibida = 0;
    puntos_letra_bendita = 0;

    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    palabra_actual = ""; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = false;
    desactivar_borrar = false;

    puntos1.style.color = "white";
    puntos2.style.color = "white";
    tiempo.style.color = "white"

    puntuacion_final1.innerHTML = "";
    puntuacion_final2.innerHTML = "";
    
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    
    definicion1.innerHTML = "";
    explicación.innerHTML = "";

    // Restablece la rápidez del borrado.
    rapidez_borrado = 3000;
    rapidez_inicio_borrado = 3000;

    //restablecer_estilo();

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    clearTimeout(tempo_text_borroso);
}

function limpieza_final(){
    nombre1.disabled = true;
    nombre2.disabled = true;

    texto2.disabled= true;
    
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    explicación.innerHTML = "";

    focalizador1.innerHTML = "";
    focalizador2.innerHTML = "";

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto1.classList.remove("textarea_blur");
    texto2.classList.remove("textarea_blur");


    letra_prohibida = "";
    letra_bendita = "";
    asignada = false;
    palabra_actual = ""; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = false;
    desactivar_borrar = false;

    tiempo.style.color = "white"

    // Restablece la rápidez del borrado.
    rapidez_borrado = 3000;
    rapidez_inicio_borrado = 3000;

    //restablecer_estilo();

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    clearTimeout(tempo_text_borroso);
}