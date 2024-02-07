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
let texto_guardado1 = "";
let texto_guardado2 = "";
let interval_ortografia_perfecta;

const getEl = (id) => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre1;
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let nivel1 = getEl("nivel");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");
let musas1 = getEl("musas");
  
let palabra1 = getEl("palabra");
let definicion1 = getEl("definicion");
let explicación = getEl("explicación");
  
// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let temas = getEl("temas");
let lightning = getEl("lightning");
  
// COMPONENTES DEL JUGADOR 2
let nombre2;
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let nivel2 = getEl("nivel1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");
let musas2 = getEl("musas1");
  
let focalizador1 = getEl("focalizador1");
let focalizador2 = getEl("focalizador2");
  
let puntuacion_final1 = getEl("puntuacion_final1");
let puntuacion_final2 = getEl("puntuacion_final2");

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
    texto_y= 'texto2';
    enviar_postgame_x = 'enviar_postgame1';
    recibir_postgame_x = 'recibir_postgame1';
    nombre1 = getEl("nombre");
    nombre1.value = "ESCRITXR 1"
    nombre2 = getEl("nombre1");
    nombre2.value = "ESCRITXR 2";
    inspirar = 'inspirar_j1';
    enviar_palabra = 'enviar_palabra_j1'
    enviar_ventaja = 'enviar_ventaja_j1';
    nombre1.style="color:aqua;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"
    nombre2.style="color:red;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;"

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
    inspirar = 'inspirar_j2';
    enviar_palabra = 'enviar_palabra_j2'
    enviar_ventaja = 'enviar_ventaja_j2';
    nombre2.style="color:red;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;"
    nombre1.style="color:aqua;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"
}

// Se establece la conexión con el servidor.
serverUrl = window.location.href.startsWith('file:')
    ? 'http://localhost:3000'
    : 'https://scrib.zeabur.app';

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
        texto1.contentEditable= "false";
        texto1.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto1.addEventListener('animationend', function() {
            texto1.classList.remove("rotate-vertical-center");
            texto1.contentEditable= "true";
            texto1.focus()
            texto1.removeEventListener('animationend', arguments.callee);
        });

        procesarTexto();
        /*texto1.innerText =
            texto1.innerText
                .split("")
                .reverse()
                .join("")
                .split(" ")
                .reverse()
                .join(" ");*/
        //restaurarPosicionCaret(caretNode, caretPos);
        // Obtener el último nodo de texto en texto1
        let lastLine = texto1.lastChild;
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
            /*texto1.innerText =
                texto1.innerText
                    .split("")
                    .reverse()
                    .join("")
                    .split(" ")
                    .reverse()
                    .join(" ");
            */
            texto1.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto1.classList.add("rotate-vertical-center");
            texto1.addEventListener('animationend', function() {
                texto1.classList.remove("rotate-vertical-center");
                texto1.contentEditable= "true";
                texto1.focus()
                texto1.removeEventListener('animationend', arguments.callee);
            });
            procesarTexto();
            let lastLine = texto1.lastChild;
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
        //activar_socket_feedback();
        modo_texto_borroso = 1;
        tiempo_inicial = new Date();
        texto1.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto1.classList.remove("textarea_blur");
            putada_actual = "";
        }, TIEMPO_BORROSO);
    },
};

const VENTAJAS = {
    "🐢": function () {
        tiempo_borrado_menos()
        animacion_modo();
        enviar_putada('🐢');
    },
    "⚡": function () {
        document.body.classList.add("bg");
        document.body.classList.add("rain");
        lightning.classList.add("lightning");
        lightning.style.right = "0%";
        lightning.style.left = "45%";
        setTimeout(function () {
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
        }, TIEMPO_BORRADO);
        enviar_putada('⚡');
    },

    "⌛": function () {
        tiempo_muerto();
        enviar_putada('⌛');
    },
    "🙃": function () {
        texto2.classList.add("rotate-vertical-center");
        enviar_putada('🙃');
    },

    "🌪️": function () {
        modo_texto_borroso = 2;
        tiempo_inicial = new Date();
        console.log(tiempo_inicial)
        console.log(es_pausa)
        texto2.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto2.classList.remove("textarea_blur");
        }, TIEMPO_BORROSO);
        enviar_putada('🌪️');
    },
};

const MODOS = {

    "calentamiento": function (data) {
        explicación.style.color = "purple";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        explicación.innerHTML = "CALENTAMIENTO";
    },

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        //activar_socket_feedback();
        palabra1.style.backgroundColor = "yellow";
        explicación.style.color = "yellow";
        definicion1.style.fontSize = "1vw";
        explicación.innerHTML = "MODO PALABRAS BENDITAS";
        socket.emit("nueva_palabra", player);
        socket.on(enviar_palabra, data => {
            recibir_palabra(data);
        });
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        //activar_socket_feedback();
        palabra1.style.backgroundColor = "red";
        explicación.style.color = "red";
        console.log(data)
        letra_prohibida = data.letra_prohibida;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto1.addEventListener("keydown", listener_modo);
        explicación.innerHTML = "MODO LETRA MALDITA";
        palabra1.innerHTML = "LETRA MALDITA: " + letra_prohibida;
        definicion1.innerHTML = "";
        socket.emit("nueva_palabra_musa", player);
    },

    "letra bendita": function (data) {
        //activar_socket_feedback();
        palabra1.style.backgroundColor= "lime";
        explicación.style.color = "lime";
        letra_bendita = data.letra_bendita;
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto1.addEventListener("keydown", listener_modo, true);
        explicación.innerHTML = "MODO LETRA BENDITA";
        palabra1.innerHTML = "LETRA BENDITA: " + letra_bendita;
        definicion1.innerHTML = "";
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
        texto1.addEventListener("keyup", listener_modo_psico);
        activado_psico = true;
        /*socket.on("psico_a_j1", (data) => {
            stylize();
        });*/
    },

    'tertulia': function (socket) {
        //activar_socket_feedback();
        explicación.style.color = "blue";
        explicación.innerHTML = "MODO TERTULIA";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
    },

    'palabras prohibidas': function (data) {
        //activar_socket_feedback();
        palabra1.style.backgroundColor = "pink";
        explicación.style.color = "pink";
        explicación.innerHTML = "MODO PALABRAS MALDITAS";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        socket.emit("nueva_palabra_prohibida", player);
        socket.on(enviar_palabra, data => {
            recibir_palabra_prohibida(data);
        });
    },

    'ortografía perfecta': function (data) {
        //activar_socket_feedback();
        palabra1.style.backgroundColor = "orange";
        explicación.style.color = "orange";
        explicación.innerHTML = "MODO ORTOGRAFÍA PERFECTA";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
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
        texto1.removeEventListener("keyup", listener_modo);
    },

    "letra prohibida": function (data) {
        texto1.removeEventListener("keyup", listener_modo);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        texto1.removeEventListener("keyup", listener_modo);
        letra_bendita = "";
    },

    "borroso": function (data) {
        texto1.classList.remove("textarea_blur");
        //texto2.classList.remove("textarea_blur");
    },

    "psicodélico": function (data) {
        //socket.off('psico_a_j1');
        texto1.removeEventListener("keyup", listener_modo_psico);
        activado_psico = false;
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
    },

    "inverso": function (data) {
        desactivar_borrar = false;
        texto1.innerText =
            //crear_n_saltos_de_linea(saltos_línea_alineacion_1) +
            //eliminar_saltos_de_linea(texto1.innerText)
            texto1.innerText
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
        texto1.removeEventListener("keyup", listener_modo);
    },

    "ortografía perfecta": function (data) {
        clearTimeout(interval_ortografia_perfecta);
    },

    "": function (data) { },
};

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto1.addEventListener("keyup", (evt) => {
    console.log(evt.key)
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
        countChars(texto1);
        sendText();
        //auto_grow(texto1);
    }
});
// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto1.addEventListener("keydown", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
        console.log("hola")
        countChars(texto1);
        sendText();
        //auto_grow(texto1);
    }
});

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto1.addEventListener("press", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
        console.log("hola")
        countChars(texto1);
        sendText();
        //auto_grow(texto1);
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
    musas1.innerHTML = contador_musas.escritxr1 + " musas 🎨";
    musas2.innerHTML = contador_musas.escritxr2 + " musas 🎨";
    }
    else{
        musas1.innerHTML = contador_musas.escritxr2 + " musas 🎨";
        musas2.innerHTML = contador_musas.escritxr1 + " musas 🎨";
    }
});

// Recibe los datos del jugador 1 y los coloca.
socket.on(texto_x, (data) => {
    texto1.innerText = data.text;
    puntos1.innerHTML = data.points;
    nivel1.innerHTML = data.level;
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
      while (texto2.scrollHeight > texto1.scrollHeight) {
        saltos_línea_alineacion_1 += 1;
        texto1.innerText = "\n" + texto1.innerText;
      }
    } else {
      while (texto2.scrollHeight < texto1.scrollHeight) {
        saltos_línea_alineacion_2 += 1;
        texto2.innerText = "\n" + texto2.innerText;
      }
    }*/
    //texto2.style.height = texto2.scrollHeight + "px";
    texto1.scrollTop = texto1.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView({ block: "end" });
});


// Recibe los datos del jugador 2 y los coloca.
socket.on(texto_y, (data) => {
    texto2.innerText = data.text;
    puntos2.innerHTML = data.points;
    nivel2.innerHTML = data.level;
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
      while (texto2.scrollHeight > texto1.scrollHeight) {
        saltos_línea_alineacion_1 += 1;
        texto1.innerText = "\n" + texto1.innerText;
      }
    } else {
      while (texto2.scrollHeight < texto1.scrollHeight) {
        saltos_línea_alineacion_2 += 1;
        texto2.innerText = "\n" + texto2.innerText;
      }
    }*/
    //texto2.style.height = texto2.scrollHeight + "px";
    texto2.scrollTop = texto2.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView({ block: "end" });
});

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", (data) => {
    //texto1.focus();
    console.log("TIEMPO", data.count)
    console.log(modo_actual)
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
    console.log(tiempo.innerHTML)
    console.log(data.count)
    tiempo.innerHTML = data.count;
    if (data.count == "¡Tiempo!") {
        if (putada_actual == "🙃"){
            texto1.innerText =
                texto1.innerText
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
        texto_guardado1 = texto1.innerText;
        texto_guardado2 = texto2.innerText;
        tiempo.style.color = "white";
        if(terminado == false){
            /*if(terminado2 == false){
                texto2.style.height = "";
                texto2.rows = "1";
                texto2.innerText = "";
            }*/
            final();
            confetti_aux();
            console.log("ANTESPRIMERO", texto1.innerText)
            setTimeout(function () {

                texto1.style.height = "";
                texto1.rows =  "1";
                texto1.style.display = "none";
                console.log("TEXTO1", texto1.innerText)
                console.log("TEXTO_GUARDADO", texto_guardado1)
                texto1.textContent = texto_guardado1;
                console.log("TEXTO1_CAMBIADO",texto1.innerText)
                sendText();
                tiempo.style.color = "white";
                }, 2000);
        }
    }
    }
    else{
            if (convertirASegundos(data.count) >= 20) {
                tiempo1.style.color = "white";
            }
            if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
                console.log(convertirASegundos(data.count))
                tiempo1.style.color = "yellow";
            }
            if (10 > convertirASegundos(data.count)) {
                tiempo1.style.color = "red";
            }
            tiempo1.innerHTML = data.count;
            if (data.count == "¡Tiempo!") {
                tiempo1.style.color = "white";
            }
    }
});
  
// Inicia el juego.
socket.on("inicio", (data) => {
    TIEMPO_INVERSO = data.parametros.TIEMPO_INVERSO;
    TIEMPO_BORROSO = data.parametros.TIEMPO_BORROSO;
    TIEMPO_BORRADO = data.parametros.TIEMPO_BORRADO;
    activar_socket_feedback();
    limpieza();
    desactivar_borrar = false;
    texto1.style.height = "";
    texto2.style.height = "";

    /*saltos_línea_alineacion_1 = 0;
    saltos_línea_alineacion_2 = 0;*/

    logo.style.display = "none"; 
    neon.style.display = "none"; 
    tiempo.innerHTML = "";
    tiempo1.innerHTML = "";
    tiempo.style.display = "";
    tiempo1.style.display = "";

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
            console.log("GOLAA", data.borrar_texto)
            if (data.borrar_texto == false) {
                texto1.innerText = texto_guardado1.trim();
                texto2.innerText = texto_guardado2.trim();
                
                sendText()

                // Obtener el último nodo de texto en texto1
                let lastLine = texto1.lastChild;
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
                }
            
            //socket.off("recibe_temas");
            texto1.contentEditable= "true";
            texto1.focus();
            animacion_modo();
            MODOS['calentamiento']('', '');
        }, 2000);
      }
    }, 1000);
});

// Resetea el tablero de juego.
socket.on("limpiar", (borrar) => {
    // Recibe el nombre del jugador 2 y lo coloca en su sitio.
    socket.on("nombre2", (data) => {
        nombre2.value = data;
    });

    // Recibe el nombre del jugador 1 y lo coloca en su sitio.
    socket.on("nombre1", (data) => {
        nombre1.value = data;
    });
    console.log(borrar, texto2.innerText, "PUTA")
    console.l
    if(borrar == false){

       // Verifica y asigna el valor a texto_guardado1 basado en el contenido de texto1
        if(texto1.innerText != "") {
            texto_guardado1 = texto1.innerText;
        } else {
            texto_guardado1 = ""; // Asigna una cadena vacía si texto1.innerText es vacío
        }

        // Verifica y asigna el valor a texto_guardado2 basado en el contenido de texto2
        if(texto2.innerText != "") {
            texto_guardado2 = texto2.innerText;
        } else {
            texto_guardado2 = ""; // Asigna una cadena vacía si texto2.innerText es vacío
        }

    }
    
    console.log("sí", texto1.innerText)
    console.log("no",texto_guardado1)
    limpieza();
    
    
    texto1.rows =  "1";
    texto2.rows = "1";

    modo_actual = "";
    putada_actual = "";

    temas.innerHTML = "";

    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    texto1.contentEditable= "false";

    /*saltos_línea_alineacion_1 = 0;
    saltos_línea_alineacion_2 = 0;
    
    texto1.style.height = "40";
    texto2.style.height = "40";*/

    tiempo.style.display = "none";
    tiempo1.style.display = "none";
    logo.style.display = "";
    neon.style.display = ""; 
    texto1.removeEventListener("keyup", listener_modo_psico);
    texto1.removeEventListener("keyup", listener_modo1);

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
    palabra1.innerHTML = "";
    //definicion1.innerHTML = "";
    explicación.innerHTML = "";
    LIMPIEZAS[modo_actual](data);   
    modo_actual = data.modo_actual;
    console.log("MIRO Y VEO,", modo_actual)
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
    //clearTimeout(tempo_text_borroso);
    //clearTimeout(tempo_text_inverso);
    tiempo_restante = TIEMPO_BORRADO - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
});

socket.on('fin', data => {
    if(player == 1 && data != 2 || player == 2 && data != 1){
        confetti_aux();
        final();
    }
    else if(player == 1 && data == 2 || player == 2 && data == 1){
        terminado2 = true;
        texto2.style.display = "none";
    }
});

socket.on('reanudar_js', data => {
    es_pausa = false;
    reanudar();
});

socket.on(enviar_putada_de_jx, data => {
    console.log(data)
    putada_actual = data;
    PUTADAS[data]()
    feedback2.innerHTML = data + " <span style='color: red;'>¡PUTADA!</span>";
    clearTimeout(delay_animacion);
    animateCSS(".feedback2", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback2.innerHTML = "";
        }, 2000);
    });
    //setTimeout(LIMPIEZAS[data](), 30000);
});

socket.on('recibir_feedback_modificador', data => {
    
    feedback2.innerHTML = getEl(data.id_mod).innerHTML;
    clearTimeout(delay_animacion);
    animateCSS(".feedback2", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
            feedback2.innerHTML = "";
        }, 2000);
    });
    getEl(data.id_mod).style.display = "none";
});

socket.on(inspirar, palabra => {
    console.log("hola", palabra)
    if(palabra != ""){
    palabra_actual = [palabra];
    definicion1.innerHTML = ("MUSA: <span style='color: orange;'>Podrías escribir la palabra \"" +
    "</span><span style='color: lime; text-decoration: underline;'>" + palabra +
    "</span><span style='color: orange;'>\"</span>");
    animateCSS(".definicion", "flash");
    asignada = true;
    indice_buscar_palabra = texto1.innerText.length - 5;
    texto1.removeEventListener("keyup", listener_modo1);
    listener_modo1 = function () { palabras_musas() };
    texto1.addEventListener("keyup", listener_modo1);
    }
});

socket.on(enviar_ventaja, ventaja => {
    console.log("ventaja", ventaja)
    VENTAJAS[ventaja]();
    feedback1.innerHTML = ventaja + " <span style='color: lime;'>¡VENTAJA!</span>";
    animateCSS(".feedback1", "flash").then((message) => {
        setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    }); 
});

socket.on("enviar_repentizado", ventaja => {
    console.log("ventaja", ventaja)
    temas.innerHTML = ventaja;
});

socket.on("nueva letra", letra => {
    console.log("NUEVA LETRA")
    if(modo_actual == "letra prohibida"){
        letra_prohibida = letra;
        texto1.removeEventListener("keydown", listener_modo);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto1.addEventListener("keydown", listener_modo);
        animacion_palabra();
        palabra1.innerHTML = "LETRA PROHIBIDA: " + letra_prohibida;
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = letra;
        texto1.removeEventListener("keydown", listener_modo);
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto1.addEventListener("keydown", listener_modo);
        animacion_palabra();
        palabra1.innerHTML = "LETRA BENDITA: " + letra_bendita;
    }
});

socket.on("locura", () => {
    locura = true;
  });

function recibir_palabra(data) {
    console.log("PEN",data)
    animacion_modo();
    asignada = true;
    palabra_actual = data.palabra_bonus[0];
    palabra1.innerHTML = "(⏱️+" + data.tiempo_palabras_bonus + " segs.) palabra: " + data.palabras_var;
    definicion1.innerHTML = data.palabra_bonus[1];
    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto1.removeEventListener("keyup", listener_modo1);
    texto1.removeEventListener("keyup", listener_modo);
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto1.addEventListener("keyup", listener_modo);
}

function recibir_palabra_prohibida(data) {
    console.log("PEN",data)
    animacion_modo();
    asignada = true;
    palabra_actual = data.palabra_bonus[0];
    palabra1.innerHTML = "(⏱️-" + data.tiempo_palabras_bonus + " segs.) palabra: " + data.palabras_var;
    definicion1.innerHTML = data.palabra_bonus[1];
    tiempo_palabras_bonus = data.tiempo_palabras_bonus;
    texto1.removeEventListener("keyup", listener_modo1);
    texto1.removeEventListener("keyup", listener_modo);
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
    texto1.addEventListener("keyup", listener_modo);
}

// FUNCIONES AUXILIARES.

// Función para enviar texto al otro jugador y a control
function sendText() {
    let text = texto1.innerText;
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
    
    socket.on("recibir_comentario", (data) => {
        console.log(data)
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
        console.log(data);
        feedback2.innerHTML = data.tiempo_feed;
        animateCSS(".feedback2", "flash").then((message) => {
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
function modo_palabras_bonus(e) {
    console.log(e)
    console.log(palabra_actual)
    if (asignada == true) {
            e.preventDefault();
            let endingIndex = e.target.selectionStart;
            let startingIndex = endingIndex && endingIndex - 1;
            let value = e.target.innerText;
            // putt all delemeters in it by which word can be splitted
            let regex = /[ ]/;
        
            while(startingIndex > -1){
              if(regex.test(value[startingIndex])){
                ++startingIndex;
                break;
              }
              --startingIndex;
            }
        
            // note you will have you apply check to avoid negative index
            if(startingIndex < 0) {
                startingIndex = 0;
            }
            console.log(value.substring(startingIndex, endingIndex));
        if (
            palabra_actual.some(palabra => texto1.innerText
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            //var $div = $('#texto');
            //$div.highlight(palabra_actual);
            texto1.focus();
            asignada = false;
            console.log("AHORAAAAAAAAAAAA", palabra_actual);
            socket.emit("nueva_palabra", player);
            console.log(tiempo_palabras_bonus, player)
            socket.emit('aumentar_tiempo', {secs: tiempo_palabras_bonus, player});
            if(definicion1.innerHTML == "") {
                feedback1.innerHTML = "⏱️+" + tiempo_palabras_bonus + " segs.";
                
            }
            else{
                feedback1.innerHTML = "⏱️+" + tiempo_palabras_bonus + " segs.";
            }
            clearTimeout(delay_animacion);
            color = color_positivo;
            feedback1.style.color = color;
            tiempo_feed = "⏱️+" + tiempo_palabras_bonus + " segs.";
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback1.innerHTML = "";
                }, 2000);
            });
            socket.emit(feedback_de_j_x, { color, tiempo_feed});
            //puntos_palabra += puntuacion;
            //puntos = texto1.innerText.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
            cambiar_color_puntuación();
            /*puntos1.innerHTML = puntos + " puntos";
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
            });*/
        }
    }
}

function modo_palabras_prohibidas(e) {
    console.log(e)
    console.log(palabra_actual)
    if (asignada == true) {
            e.preventDefault();
            let endingIndex = e.target.selectionStart;
            let startingIndex = endingIndex && endingIndex - 1;
            let value = e.target.innerText;
            // putt all delemeters in it by which word can be splitted
            let regex = /[ ]/;
        
            while(startingIndex > -1){
              if(regex.test(value[startingIndex])){
                ++startingIndex;
                break;
              }
              --startingIndex;
            }
        
            // note you will have you apply check to avoid negative index
            if(startingIndex < 0) {
                startingIndex = 0;
            }
            console.log(value.substring(startingIndex, endingIndex));
        if (
            palabra_actual.some(palabra => texto1.innerText
                .substring(startingIndex, endingIndex)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            //var $div = $('#texto');
            //$div.highlight(palabra_actual);
            texto1.focus();
            asignada = false;
            console.log("AHORAAAAAAAAAAAA", palabra_actual);
            socket.emit("nueva_palabra_prohibida", player);
            tiempo_palabras_bonus = -tiempo_palabras_bonus;
            socket.emit('aumentar_tiempo', {secs: tiempo_palabras_bonus, player});
            color = color_negativo;
            feedback1.style.color = color;
            feedback1.innerHTML = "⏱️" + tiempo_palabras_bonus + " segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback1.innerHTML = "";
                }, 2000);
            });
            color = color_negativo;
            tiempo_feed = "⏱️" + tiempo_palabras_bonus + " segs.";
            socket.emit(feedback_de_j_x, { color, tiempo_feed});
            //puntos_palabra += puntuacion;
            //puntos = texto1.innerText.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
            cambiar_color_puntuación();
            /*puntos1.innerHTML = puntos + " puntos";
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
            });*/
        }
    }
}

function palabras_musas() {
    console.log(palabra_actual)
    if (asignada == true) {
        if (
            palabra_actual.some(palabra => texto1.innerText
                .substring(indice_buscar_palabra, texto1.innerText.length)
                .toLowerCase().includes(palabra.toLowerCase()))
            ) {
            //var $div = $('#texto');
            //$div.highlight(palabra_actual);
            definicion1.innerHTML = "";
            texto1.focus();
            asignada = false;
            feedback1.style.color = "white";
            feedback1.innerHTML = "+🎨 insp.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback1.innerHTML = "";
                }, 2000);
            });
            color = "white"
            tiempo_feed = feedback1.innerHTML;
            socket.emit("nueva_palabra_musa", player);
            socket.emit(feedback_de_j_x, { color, tiempo_feed});
            //puntos_palabra += puntuacion;
            //puntos = texto1.innerText.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
            cambiar_color_puntuación();
            /*puntos1.innerHTML = puntos + " puntos";
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
            });*/
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
  
      // Actualiza otros aspectos de la UI y envía eventos a través de Socket.io
      // Aquí iría la lógica para manejar la UI y eventos de Socket.io (la he mantenido igual)
      puntos1.innerHTML = puntos + " palabras 🖋️";
      sendText();
      feedback1.style.color = color_negativo;
      feedback1.innerHTML = "⏱️-2 segs.";
      clearTimeout(delay_animacion);
      animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
          feedback1.innerHTML = "";
        }, 2000);
      });
      secs = -2
      socket.emit('aumentar_tiempo', {secs, player});
      color = color_negativo;
      tiempo_feed = feedback1.innerHTML;
      socket.emit(feedback_de_j_x, { color, tiempo_feed });
    }
  }
  

  

// Esta función se llama cuando se presiona una tecla
function modo_letra_bendita(e) {
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }
    console.log(`Evento para tecla: ${e.key}`);

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
            console.log("-1 seg.")
            feedback1.style.color = color_negativo;
            feedback1.innerHTML = "⏱️-1 segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback1.innerHTML = "";
                }, 2000);
            });
            // Envío de feedback a través de Socket.io
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed: feedback1.innerHTML });
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
            cambiar_color_puntuación();
            puntos1.innerHTML = puntos + " palabras 🖋️";
            sendText();

            // Feedback visual
            feedback1.style.color = color_positivo;
            feedback1.innerHTML = "⏱️+2 segs.";
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback1.innerHTML = "";
                }, 2000);
            });

            // Envío de feedback a través de Socket.io
            socket.emit(feedback_de_j_x, { color: color_positivo, tiempo_feed: feedback1.innerHTML });
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
    //socket.emit("psico", 1);
    stylize();
}

function postgame() {
    actualizar_puntuación();
    longitud = texto1.innerText.length;
    if (puntos_letra_prohibida != 0) {
        puntos_letra_prohibida = -puntos_letra_prohibida;
    }
    socket.emit(enviar_postgame_x, { longitud, puntos_palabra, puntos_letra_prohibida, puntos_letra_bendita });
    /*focalizador1.innerHTML = "<br>🖋️ Caracteres escritos = " + texto1.innerText.length + " pts" +
                            "<br>📚 Palabras bonus = " + puntos_palabra + " pts" +
                            "<br>❌ Letra prohibida = " + puntos_letra_prohibida + " pts" +
                            "<br>😇 Letra bendita = " + puntos_letra_bendita + " pts";*/
    puntos_palabra = 0;
    puntos = 0;
    puntos_letra_prohibida = 0;
    puntos_letra_bendita = 0;
}

function actualizar_puntuación() {
    puntos = texto1.innerText.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
    puntos1.innerHTML = puntos + " palabras 🖋️";
    cambio_nivel(puntos);
    sendText();
    //auto_grow(texto1);
    cambiar_color_puntuación();
}

function cambiar_color_puntuación() {
    if (puntos > parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
        puntos1.style.color = "greenyellow";
        puntos2.style.color = "red";
        if (puntos == parseInt(puntos2.innerHTML.match(/[-+]?\d+(\.\d+)?/))) {
            puntos2.style.color = "greenyellow";
        }
    }
    else {
        puntos1.style.color = "red";
        puntos2.style.color = "greenyellow";
    }
}

function limpieza(){
    
    clearTimeout(listener_cuenta_atras);
    clearTimeout(timer);
    if(temp_text_inverso_activado == true){
        clearTimeout(tempo_text_inverso);
        procesarTexto();
    }

    texto1.innerText = "";
    texto2.innerText = "";

    texto1.style.display = "";
    texto2.style.display = "";


    texto1.style.height = "";
    texto2.style.height = "";

    feedback_tiempo.style.color = color_positivo;
    feedback_tiempo1.style.color = color_positivo;

    texto1.rows =  "6";
    texto2.rows = "6";

    temas.innerHTML = "";

    texto1.contentEditable= "false";

    puntos1.innerHTML = 0 + " palabras 🖋️";
    puntos2.innerHTML = 0 + " palabras 🖋️";
    
    nivel1.innerHTML = "🌡️ nivel 0";
    nivel2.innerHTML = "🌡️ nivel 0";
    
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
    terminado2 = false;

    
    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    locura = false;

    puntos1.style.color = "white";
    puntos2.style.color = "white";
    tiempo.style.color = "white";
    tiempo1.style.color = "white";

    puntuacion_final1.innerHTML = "";
    puntuacion_final2.innerHTML = "";
    
    feedback1.innerHTML = "";
    feedback2.innerHTML = "";
    
    definicion1.innerHTML = "";
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
    texto1.contentEditable= "false";
    texto1.style.display = "none";
    texto2.style.display = "none";
    
    temas.innerHTML = "";
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
    terminado2 = false;


    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = 0;
    desactivar_borrar = true;
    locura = false;

    tiempo.style.color = "white";
    tiempo1.style.color = "white";

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

    //socket.emit('pausar', '');
    
    menu_modificador = false;
    texto1.contentEditable= "false";

    clearTimeout(borrado);
    desactivar_borrar = true;
    /*if(putada_actual == "🌪️"){
        if (modo_texto_borroso == 1) {
            texto1.classList.remove("textarea_blur");
        }
        else if (modo_texto_borroso == 2) {
            texto2.classList.remove("textarea_blur");

        }
    }
    
    else if(putada_actual == "🙃"){
        console.log("PUTAAAAAAAAAA", putada_actual)
        desactivar_borrar = false;
        desactivar_borrar = true;
        texto1.innerText =
            texto1.innerText
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
                    
        modo_inverso_pausa()
    }*/

    //restablecer_estilo();
}

function reanudar(){

    menu_modificador = true;
    texto1.contentEditable = "true";

    clearTimeout(borrado);
    desactivar_borrar = false;
    /*if(putada_actual == "🌪️"){
        modo_borroso_pausa(TIEMPO_BORROSO);
    }
    
    else if(putada_actual == "🙃"){
        modo_inverso_pausa()
    }*/
    //restablecer_estilo();
    texto1.focus();
}

function modo_borroso_pausa(data){
    console.log(tiempo_restante)
    if(tiempo_restante > 0){
        modo_borroso(data);
    }
}

function modo_inverso_pausa(){
    console.log(tiempo_restante)
    if(tiempo_restante > 0){
        desactivar_borrar = true;
        caretNode, caretPos = guardarPosicionCaret();
        texto1.contentEditable= "false";
        texto1.classList.add("rotate-vertical-center");
        // Añade un escuchador para el evento 'animationend'
        texto1.addEventListener('animationend', function() {
            texto1.classList.remove("rotate-vertical-center");
            texto1.contentEditable= "true";
            texto1.focus()
            // Obtener el último nodo de texto en texto1
            lastLine = texto1.lastChild;
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
            texto1.removeEventListener('animationend', arguments.callee);
        });
        
        procesarTexto();
        /*texto1.innerText =
            texto1.innerText
                .split("")
                .reverse()
                .join("")
                .split(" ")
                .reverse()
                .join(" ");*/
        
        sendText();
        temp_text_inverso_activado = true;
        tempo_text_inverso = setTimeout(function () {
            temp_text_inverso_activado = false;
            desactivar_borrar = false;
            texto1.contentEditable= "false";
            caretNode, caretPos = guardarPosicionCaret();
            texto1.classList.add("rotate-vertical-center");
            texto1.addEventListener('animationend', function() {
                texto1.classList.remove("rotate-vertical-center");
                texto1.contentEditable= "true";
                texto1.focus()
                // Obtener el último nodo de texto en texto1
                lastLine = texto1.lastChild;
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
                texto1.removeEventListener('animationend', arguments.callee);
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
        texto1.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto1.classList.remove("textarea_blur");
            modo_texto_borroso = 0
            putada_actual = ""
        }, data);   
    }
    if(modo_texto_borroso == 2){
        texto2.classList.add("textarea_blur");
        tempo_text_borroso = setTimeout(function () {
            temp_text_borroso_activado = true;
            texto2.classList.remove("textarea_blur");
            modo_texto_borroso = 0
            putada_actual = "";
        }, data);
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

function final(){
    
    menu_modificador = false;
    limpieza_final();
    
    modo_actual = "";
    putada_actual = "";
    activar_sockets_extratextuales();
    /*texto1.innerText = texto1.innerText.substring(
        saltos_línea_alineacion_1,
        texto1.innerText.length
    );
    texto2.innerText = texto2.innerText.substring(
        saltos_línea_alineacion_2,
        texto2.innerText.length
    );*/

    // Impide que se pueda escribir en los dos textos.
    texto1.contentEditable= "false";

    // Variable booleana que dice si la ronda ha terminado o no.
    terminado = true;

    //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
    //texto2.innerText = eliminar_saltos_de_linea(texto2.innerText); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

    texto1.style.height = "auto";
    texto2.style.height = "auto";
    texto1.style.height = texto1.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
    texto2.style.height = texto2.scrollHeight + "px"; // Reajustamos el tamaño del área de texto del j2.
    texto1.style.display = "none";
    texto2.style.display = "none";
    /*let a = document.createElement("a");
        a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").innerText +"\n"+texto1.innerText +"\n"+ document.getElementById("nombre1").innerText +"\n"+texto2.innerText ], {type: "text/plain"}));
        blob = new Blob([document.getElementById("nombre").innerText +"\n"+texto1.innerText +"\n"+ document.getElementById("nombre1").innerText +"\n"+texto2.innerText ], {type: "text/plain"});
        a.download = 'sesión_player1.txt';
        a.click();*/
    
    logo.style.display = "";
    neon.style.display = "";
    LIMPIEZAS["psicodélico"]("");/* TODO: VER POR QUÉ NO FUNCIONA ESTO  */
    texto1.removeEventListener("keyup", listener_modo_psico);
    restablecer_estilo();
    tiempo.style.color = "white";
    tiempo1.style.color = "white";
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
        const nuevoTexto = ajustarPunteros(texto1.innerText);
        // Actualizar el puntero de inicio global para la próxima iteración
        punteroInicio += nuevoTexto.length;

        hacerPeticion(nuevoTexto).then(descuento => {
            if(descuento != 0) {
                feedback1.style.color = color_negativo;
                feedback1.innerHTML = "⏱️" + descuento +" segs.";
                clearTimeout(delay_animacion);
                animateCSS(".feedback1", "flash").then((message) => {
                    delay_animacion = setTimeout(function () {
                        feedback1.innerHTML = "";
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

    texto1.childNodes.forEach(nodo => {
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

    texto1.innerHTML = '';
    texto1.appendChild(fragmento);
}