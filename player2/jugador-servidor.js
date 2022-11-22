//var socket = io('https://scri-b.up.railway.app/'); // Se establece la conexión con el servidor.
let socket = io("http://localhost:3000/");
const getEl = (id) => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
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
let nombre2 = getEl("nombre1");
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let nivel2 = getEl("nivel1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");

let focalizador = getEl("focalizador");

let tempo_text_borroso;

// Variables de los modos.
let modo_actual = "";
let modo_texto_borroso = false;
let desactivar_borrar = false;

var letra_prohibida = "";
let listener_modo;

const MODOS = {
  // Recibe y activa la palabra y el modo bonus.
  "palabras bonus": function (data) {
    activar_socket_feedback()
    asignada = true;
    palabra_actual = data.palabra_bonus[0];
    explicación.innerHTML = "MODO PALABRAS BONUS";
    palabra1.innerHTML =
      "(+" + data.puntuacion + " pts) palabra: " + data.palabra_bonus[0];
    definicion1.innerHTML = data.palabra_bonus[1];
    puntuacion = data.puntuacion;
    indice_buscar_palabra = texto1.value.length - 5;
    texto2.removeEventListener("keyup", listener_modo);
    listener_modo = function(){modo_palabras_bonus()};
    texto2.addEventListener("keyup", listener_modo);
  },

  //Recibe y activa el modo letra prohibida.
  "letra prohibida": function (data) {
    activar_socket_feedback();
    letra_prohibida = data.letra_prohibida;
    //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
    listener_modo = function(e){modo_letra_prohibida(e)};
    texto2.addEventListener("keyup", listener_modo);
    explicación.innerHTML = "MODO LETRA PROHIBIDA";
    palabra1.innerHTML = "LETRA PROHIBIDA: " + letra_prohibida;
    definicion1.innerHTML = "";
  },

  "texto borroso": function (data) {
    modo_texto_borroso = true;
    explicación.innerHTML = "MODO TEXTO BORROSO";
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    if (data.jugador == 1) {
      texto1.classList.add("textarea_blur");
      tempo_text_borroso = setTimeout(function () {
        texto1.classList.remove("textarea_blur");
        texto2.classList.add("textarea_blur");
      }, 30000);
    }
    if (data.jugador == 2) {
      texto2.classList.add("textarea_blur");
      tempo_text_borroso = setTimeout(function () {
        texto2.classList.remove("textarea_blur");
        texto1.classList.add("textarea_blur");
      }, 30000);
    }
  },

  psicodélico: function (data) {
    explicación.innerHTML = "MODO PSICODÉLICO";
    palabra1.innerHTML = "";
    definicion1.innerHTML = "";
    listener_modo = function(){modo_psicodélico()};
    texto2.addEventListener("keyup", listener_modo);
    /*socket.on("psico_a_j2", (data) => {
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

  "": function (data) {},
};

const LIMPIEZAS = {
  "palabras bonus": function (data) {
    socket.off('feedback_a_j2');
    asignada = false;
    texto2.removeEventListener("keyup", listener_modo);
  },

  "letra prohibida": function (data) {
    socket.off('feedback_a_j2');
    texto2.removeEventListener("keyup", listener_modo);
    letra_prohibida = "";
  },

  "texto borroso": function (data) {
    modo_texto_borroso = false;
    texto1.classList.remove("textarea_blur");
    texto2.classList.remove("textarea_blur");
  },

  psicodélico: function (data) {
    //socket.off('psico_a_j1');
    texto2.removeEventListener("keyup", listener_modo);
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

  "": function (data) {},
};

// Cuando el texto del jugador 2 cambia, envía los datos de jugador 2 al resto.
texto2.addEventListener("keyup", (evt) => {
  countChars(texto2);
  sendText();
  auto_grow(texto2);
});

// Cuando el texto del jugador 2 cambia, envía los datos de jugador 2 al resto.
texto2.addEventListener("keydown", (evt) => {
  countChars(texto2);
  sendText();
  auto_grow(texto2);
});

//activar los sockets extratextuales.
activar_sockets_extratextuales();

// Recibe los datos del jugador 1 y los coloca.
socket.on("texto1", (data) => {
  texto1.value = data.text;
  puntos1.innerHTML = data.points;
  nivel1.innerHTML = data.level;
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
  texto1.style.height = texto1.scrollHeight + "px";
  //window.scrollTo(0, document.body.scrollHeight);
  focalizador.scrollIntoView({block: "end"});
});

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", (data) => {
  texto2.focus();
  tiempo.innerHTML = data;
  if (data == "¡Tiempo!") {
    LIMPIEZAS[modo_actual](data);
    modo_actual = "";
    activar_sockets_extratextuales();
    texto1.value = texto1.value.substring(
      saltos_línea_alineacion_1,
      texto1.value.length
    );
    texto2.value = texto2.value.substring(
      saltos_línea_alineacion_2,
      texto2.value.length
    );

    // Desactiva, por seguridad, todos los modos.
    modo_texto_borroso = false;
    desactivar_borrar = false;
    letra_prohibida = "";

    // Desactiva el blur de ambos textos.
    texto2.classList.remove("textarea_blur");
    texto1.classList.remove("textarea_blur");

    // Impide que se pueda escribir en los dos textos.
    texto2.disabled = true;
    texto1.disabled = true;

    // Variable booleana que dice si la ronda ha terminado o no.
    terminado = true;

    // Restablece la rápidez del borrado.
    rapidez_borrado = 3000;
    rapidez_inicio_borrado = 3000;

    blurreado = false;
    clearTimeout(borrado);
    clearTimeout(cambio_palabra);
    palabra_actual = ""; // Variable que almacena la palabra bonus actual.

    //texto1.value = eliminar_saltos_de_linea(texto1.value); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
    //texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

    texto1.style.height = "auto";
    texto2.style.height = "auto";
    texto1.style.height = texto1.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
    texto2.style.height = texto2.scrollHeight + "px"; // Reajustamos el tamaño del área de texto del j2.

    puntos_palabra = 0;
    puntos = 0;
    puntos_letra_prohibida = 0;
    /*let a = document.createElement("a");
        a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").value +"\n"+texto1.value +"\n"+ document.getElementById("nombre1").value +"\n"+texto2.value ], {type: "text/plain"}));
        blob = new Blob([document.getElementById("nombre").value +"\n"+texto1.value +"\n"+ document.getElementById("nombre1").value +"\n"+texto2.value ], {type: "text/plain"});
        a.download = 'sesión_player2.txt';
        a.click();*/
  }
});

// Inicia el juego.
socket.on("inicio", (data) => {
  socket.off("nombre1");
  socket.off("nombre2");
  socket.off("recibe_temas");

  nombre1.disabled = true;
  nombre2.disabled = true;
  texto1.value = "";
  texto2.value = "";
  texto1.disabled = true;
  texto2.disabled = false;
  puntos1.innerHTML = "0 puntos";
  puntos2.innerHTML = "0 puntos";
  nivel1.innerHTML = "nivel 0";
  nivel2.innerHTML = "nivel 0";
  palabra1.innerHTML = "";
  texto1.style.height = "40";
  texto1.style.height = texto1.scrollHeight + "px";
  texto2.style.height = "40";
  texto2.style.height = texto2.scrollHeight + "px";
  texto2.focus();
  blurreado = false;
  texto2.classList.remove("textarea_blur");
  texto1.classList.remove("textarea_blur");
  definicion1.innerHTML = "";
  explicación.innerHTML = "";
  terminado = false;
  puntos_palabra = 0;
  puntos = 0;
  puntos_letra_prohibida = 0;
  saltos_línea_alineacion_1 = 0;
  saltos_línea_alineacion_2 = 0;
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
  modo_actual = "";
  feedback1.innerHTML = "";
  feedback2.innerHTML = "";
  definicion1.innerHTML = "";
  explicación.innerHTML = "";
  puntos_palabra = 0;
  puntos = 0;
  puntos_letra_prohibida = 0;
  asignada = false;
  palabra_actual = ""; // Variable que almacena la palabra bonus actual.
  terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
  nombre1.value = "ESCRITXR 1";
  nombre2.value = "ESCRITXR 2";
  nombre1.disabled = true;
  nombre2.disabled = true;
  texto1.value = "";
  texto2.value = "";
  texto1.disabled = true;
  texto2.disabled = true;
  puntos1.innerHTML = "0 puntos";
  puntos2.innerHTML = "0 puntos";
  nivel1.innerHTML = "nivel 0";
  nivel2.innerHTML = "nivel 0";
  palabra1.innerHTML = "";
  texto1.style.height = "40";
  texto1.style.height = texto1.scrollHeight + "px";
  texto2.style.height = "40";
  texto2.style.height = texto2.scrollHeight + "px";
  texto2.focus();
  blurreado = false;
  texto2.classList.remove("textarea_blur");
  texto1.classList.remove("textarea_blur");
  rapidez_borrado = 3000;
  rapidez_inicio_borrado = 3000;
  clearTimeout(borrado);
  clearTimeout(cambio_palabra);
  modo_texto_borroso = false;
  desactivar_borrar = false;
  letra_prohibida = "";
  restablecer_estilo();
  clearTimeout(tempo_text_borroso);
  saltos_línea_alineacion_1 = 0;
  saltos_línea_alineacion_2 = 0;
});

socket.on("activar_modo", (data) => {
  animacion_modo();
  console.log("ANTERIOR: " + modo_actual);
  LIMPIEZAS[modo_actual](data);
  modo_actual = data.modo_actual;
  console.log("NUEVO MODO: " + modo_actual);
  MODOS[modo_actual](data);
});

//Recibe los temas (que elige Espectador) y los coloca en su sitio.
socket.on("recibe_temas", (data) => {
  temas.innerHTML = data;
});

//FUNCIONES AUXILIARES.

// Función para enviar texto al otro jugador y a control
function sendText() {
  let text = texto2.value;
  let points = puntos2.textContent;
  let level = nivel2.textContent;
  socket.emit("texto2", { text, points, level });
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
}

function activar_socket_feedback(){
  socket.on("feedback_a_j2", (data) => {
    feedback1.style.color = data.color;
    feedback1.innerHTML = data.envio_puntos.toString() + " pts";
    animateCSS(".feedback1", "bounceInLeft").then((message) => {
      delay_animacion = setTimeout(function () {
        feedback1.innerHTML = "";
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
  texto1.style.height = texto1.scrollHeight + "px";
  texto2.style.height = texto2.scrollHeight + "px";
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
function modo_palabras_bonus(){
  if (asignada == true) {
    if (
      texto2.value
        .substring(indice_buscar_palabra, texto2.value.length)
        .toLowerCase()
        .includes(palabra_actual)
    ) {
      asignada = false;
      socket.emit("nueva_palabra", asignada);
      puntos_palabra += puntuacion;
      puntos = texto2.value.length + puntos_palabra - puntos_letra_prohibida;
      puntos2.innerHTML = puntos + " puntos";
      feedback2.style.color = color_positivo;
      feedback2.innerHTML = "+" + puntuacion + " pts";
      color = color_positivo;
      envio_puntos = "+" + puntuacion;
      socket.emit("feedback_de_j2", { color, envio_puntos });
      clearTimeout(delay_animacion);
      animateCSS(".feedback2", "bounceInLeft").then(() => {
        delay_animacion = setTimeout(function () {
          feedback2.innerHTML = "";
        }, 2000);
      });
    }
  }
}

function modo_letra_prohibida(e){
letra = e.key
if (
  toNormalForm(letra) ==
    letra_prohibida ||
  toNormalForm(letra) ==
    letra_prohibida.toUpperCase()
) {
  position = e.target.selectionStart;
  texto2.value = texto2.value.substring(0, position-1) + texto2.value.substring(position+1);
  puntos_letra_prohibida += 50;
  puntos = texto2.value.length + puntos_palabra - puntos_letra_prohibida;
  puntos2.innerHTML = puntos + " puntos";
  sendText();
  feedback2.style.color = color_negativo;
  feedback2.innerHTML = "-50 pts";
  color = color_negativo;
  envio_puntos = -50;
  socket.emit("feedback_de_j2", { color, envio_puntos });
  clearTimeout(delay_animacion);
  animateCSS(".feedback2", "bounceInRight").then(() => {
    delay_animacion = setTimeout(function () {
      feedback2.innerHTML = "";
    }, 2000);
  });
}
}

function modo_psicodélico(){
  //socket.emit("psico", 2);
  stylize();
}