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
let tempo_text_inverso;

// Variables de los modos.
let modo_actual = "";
let modo_texto_borroso = false;
let desactivar_borrar = false;

var letra_prohibida = "";
var letra_bendita = "";
let listener_modo;
let listener_modo_psico;

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
    texto_y= 'texto2';
    enviar_postgame_x = 'enviar_postgame1';
    recibir_postgame_x = 'recibir_postgame1';
    nombre1 = getEl("nombre");
    nombre1.value = "ESCRITXR 1"
    nombre2 = getEl("nombre1");
    nombre2.value = "ESCRITXR 2";

} else if (player == 2) {
    enviar_putada_de_jx = 'enviar_putada_de_j1';
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

// Se establece la conexión con el servidor.
serverUrl = window.location.href.startsWith('file:')
    ? 'http://localhost:3000'
    : 'https://scri-b.up.railway.app';

const socket = io(serverUrl);
  
const PUTADAS = {
    "tiempo_borrado_más": function () {
        borrado_cambiado = true;
        rapidez_borrado = 500;
        rapidez_inicio_borrado = 500;
    },

    "inverso": function () {
        desactivar_borrar = true;
        console.log("dfsf")
        texto1.value =
            texto1.value
                .split("")
                .reverse()
                .join("")
                .split(" ")
                .reverse()
                .join(" ");
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = true;
            desactivar_borrar = false;
            texto1.value =
                texto1.value
                    .split("")
                    .reverse()
                    .join("")
                    .split(" ")
                    .reverse()
                    .join(" ");
        }, 30000);
    },

    "borroso": function () {
        modo_texto_borroso = true;
        tiempo_inicial = new Date();
        duracion = 30000
        if(es_pausa == false){
            texto1.classList.add("textarea_blur");
            tempo_text_borroso = setTimeout(function () {
                temp_text_borroso_activado = true;
                texto1.classList.remove("textarea_blur");
            }, duracion);
        }
        else{
            modo_borroso_pausa(30000);
        }
    },
};

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
        texto1.addEventListener("keyup", listener_modo_psico);
        /*socket.on("psico_a_j1", (data) => {
            stylize();
        });*/
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

    "borroso": function (data) {
        modo_texto_borroso = false;
        texto1.classList.remove("textarea_blur");
        //texto2.classList.remove("textarea_blur");
    },

    "psicodélico": function (data) {
        //socket.off('psico_a_j1');
        texto1.removeEventListener("keyup", listener_modo_psico);
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
    },

    "inverso": function (data) {
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
    },

    "tiempo_borrado_más": function (data){ },

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
    //texto1.focus();
    if (data == "00:20") {
        tiempo.style.color = "yellow"
    }
    if (data == "00:10") {
        MODOS["psicodélico"](data, socket);
        tiempo.style.color = "red"
    }
    tiempo.innerHTML = data;
    if (data == "¡Tiempo!") {

        confetti_aux();

        menu_modificador = false;
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
        
        logo.innerHTML = "<p class='sub'>powered by</p><img src='../img/logo.png' alt='' width='5%' />";    
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
    texto1.rows = 3;
    texto2.rows = 3;
    for (i = 0; i < document.querySelectorAll('.modificador').length; i++) {
        document.querySelectorAll('.modificador')[i].style.display = "none";
    }
    var checkeados = [];
    if(player == 2){
        for (let i = 0; i < data.checkeados.length; i++) {
            checkeados.push(data.checkeados[i].replace('1', 'x').replace('2', '1').replace('x', '2'));
          }
    }
    else{
        checkeados = data.checkeados;
    }
    for (var i = 0; i < checkeados.length; i++) {

        if(checkeados[i].endsWith('1')){
            modificadorButtons.push(getEl(checkeados[i]));
        }

        getEl(checkeados[i]).style.display = "block";
    }
    /*saltos_línea_alineacion_1 = 0;
    saltos_línea_alineacion_2 = 0;*/

    logo.innerHTML = "";
    texto1.focus();
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

    limpieza();
    
    modo_actual = "";

    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    texto1.disabled= true;

    /*saltos_línea_alineacion_1 = 0;
    saltos_línea_alineacion_2 = 0;
    
    texto1.style.height = "40";
    texto2.style.height = "40";*/

    logo.innerHTML = "<p class='sub'>powered by</p><img src='../img/logo.png' alt='' width='5%' />";    

    activar_sockets_extratextuales();
});

socket.on("activar_modo", (data) => {
    animacion_modo();
    LIMPIEZAS[modo_actual](data);
    modo_actual = data.modo_actual;
    MODOS[modo_actual](data, socket);
});

socket.on('enviar_palabra', data => {
    recibir_palabra(data);
});

socket.on('pausar_js', data => {
    es_pausa = true;
    LIMPIEZAS[modo_actual](data);
    clearTimeout(tempo_text_borroso);
    clearTimeout(tempo_text_inverso);
    tiempo_restante = duracion - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
});


socket.on('reanudar_js', data => {
    es_pausa = false;
    reanudar();
});

socket.on(enviar_putada_de_jx, data => {
    PUTADAS[data]()
    //setTimeout(LIMPIEZAS[data](), 30000);
});

socket.on('recibir_feedback_modificador', data => {
    getEl(data.id_mod).style.display = "none";
});

function recibir_palabra(data) {
    animacion_modo();
    asignada = true;
    palabra_actual = data.palabra_bonus[0];
    palabra1.innerHTML = "(+" + data.puntuacion + " pts) palabra: " + data.palabras_var;
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
            palabra_actual.some(palabra => texto1.value
                .substring(indice_buscar_palabra, texto1.value.length)
                .toLowerCase().includes(palabra.toLowerCase()))
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

    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];

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
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = false;
    desactivar_borrar = false;

    puntos1.style.color = "white";
    puntos2.style.color = "white";
    tiempo.style.color = "white";

    puntuacion_final1.innerHTML = "";
    puntuacion_final2.innerHTML = "";
    
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    
    definicion1.innerHTML = "";
    explicación.innerHTML = "";

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = 3000;
    rapidez_inicio_borrado = 3000;
    
    LIMPIEZAS["psicodélico"]("");

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    clearTimeout(tempo_text_borroso);
    clearTimeout(tempo_text_inverso);
}

function limpieza_final(){
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
    palabra_actual = []; // Variable que almacena la palabra bonus actual.
    terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = false;
    desactivar_borrar = false;

    tiempo.style.color = "white"

    // Restablece la rápidez del borrado.
    borrado_cambiado = false;
    rapidez_borrado = 3000;
    rapidez_inicio_borrado = 3000;

    LIMPIEZAS["psicodélico"]("");

    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    clearTimeout(tempo_text_borroso);
}

function pausa(){

    //socket.emit('pausar', '');
    
    menu_modificador = false;
    texto1.disabled= true;

    clearTimeout(borrado);
    

    //restablecer_estilo();
}

function reanudar(){

    menu_modificador = true;
    texto1.disabled = false;

    clearTimeout(borrado);
    
    //restablecer_estilo();
    texto1.focus();
}

function modo_borroso_pausa(data){
    if(tiempo_restante > 0){
        modo_borroso(data);
    }
}

function tiempo_borrado_menos(){
    borrado_cambiado = true;
    rapidez_borrado = 7000;
    rapidez_inicio_borrado = 7000;
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
    if (data.jugador == 1) {
        if(player == 1){
        texto1.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto1.classList.remove("textarea_blur");
            texto2.classList.add("textarea_blur");
        }, data.duracion);
        }
        else{
            texto2.classList.add("textarea_blur");
            tempo_text_borroso = setTimeout(function () {
                temp_text_borroso_activado = true;
                texto2.classList.remove("textarea_blur");
                texto1.classList.add("textarea_blur");
            }, data.duracion);
        }
    }
    if (data.jugador == 2) {
        if(player == 2){
            texto1.classList.add("textarea_blur");
            tempo_text_borroso = setTimeout(function () {
                temp_text_borroso_activado = true;
                texto1.classList.remove("textarea_blur");
                texto2.classList.add("textarea_blur");
            }, data.duracion);
            }
        else{
            texto2.classList.add("textarea_blur");
            tempo_text_borroso = setTimeout(function () {
                temp_text_borroso_activado = true;
                texto2.classList.remove("textarea_blur");
                texto1.classList.add("textarea_blur");
                }, data.duracion);
            }
    }
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