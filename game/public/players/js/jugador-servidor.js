// Se establece la conexión con el servidor según si estamos abriendo el archivo localmente o no
const serverUrl = isProduction
    ? SERVER_URL_PROD
    : SERVER_URL_DEV;

const socket = io(serverUrl);
const getEl = id => document.getElementById(id); // Obtiene los elementos con id.

animateCSS(".contenedor", "pulse");

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");
let tema = getEl("temas");
let metadatos = getEl("metadatos");
let text_progress = getEl("text-progress");
let bar_progress = getEl("bar-progress");

let terminado = false;
let clasificacion = getEl("clasificacion");
let notificacion = getEl("notificacion");
let fin_pag = getEl("fin_pag");
let campo_palabra = getEl("palabra");
let tarea = getEl("tarea");
let mostrar_texto = getEl("mostrar_texto");
let recordatorio = getEl("recordatorio");
let enviarPalabra_boton = getEl("progressButton");
let sincro = 0;
let votando = false;
const skill = getEl("skill")
const skill_cancel = getEl("skill_cancel")
const feedback_texto_editado = getEl("feedback_texto_editado")
var intervalID = -1;
let timer = null;
let preparados_timer = null;
let sub_timer = null;
let listener_cuenta_atras = null;
let LIMITE_TIEMPO_INSPIRACION = 30;
const VENTAJAS_PUTADAS = [
    { emoji: "🐢", descripcion: "🐢 El teclado del contrincante irá más lento." },
    { emoji: "⚡", descripcion: "⚡ El videojuego borrará más rápido el texto del contrincante." },
    { emoji: "🙃", descripcion: "🙃 El texto se volverá un espejo para el contrincante." },
    { emoji: "🌪️", descripcion: "🌪️ Una pesada bruma caerá sobre el texto del contrincante." },
    { emoji: "🖊️", descripcion: "🖊️ El contrincante no podrá borrar su texto." }
];

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
let nombre_musa_label = getEl("nombre_musa_label");

function formatearPuntos(valor) {
    if (valor == null) return "0 palabras";
    if (typeof valor === "number") return `${valor} palabras`;
    const texto = String(valor).trim();
    if (/^\d+$/.test(texto)) return `${texto} palabras`;
    if (/^\d+palabras$/i.test(texto)) {
        return texto.replace(/^(\d+)(palabras)$/i, "$1 $2");
    }
    return texto;
}

const MAX_NOMBRE_MUSA = 10;
const REGEX_NOMBRE_MUSA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$/;
const REGEX_LETRA_MUSA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

function normalizarNombreMusa(valor) {
    if (typeof valor !== "string") return "";
    const limpio = valor.trim().slice(0, MAX_NOMBRE_MUSA);
    if (!limpio) return "";
    if (!REGEX_NOMBRE_MUSA.test(limpio)) return "";
    if (!REGEX_LETRA_MUSA.test(limpio)) return "";
    return limpio.toUpperCase();
}

const nombre_musa = normalizarNombreMusa(
    getParameterByName("name") ||
    getParameterByName("nombre") ||
    getParameterByName("musa")
);

if (!nombre_musa) {
    window.location.href = "../index.html?error=nombre_musa";
}

window.nombre_musa = nombre_musa;
if (nombre_musa_label && nombre_musa) {
    nombre_musa_label.textContent = nombre_musa;
}

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
        nombre1.style="color:aqua;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
        metadatos.style = "color:red; text-shadow: 0.0625em 0.0625em aqua;";

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
        nombre1.style="color:red;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;";
        metadatos.style = "color:aqua; text-shadow: 0.0625em 0.0625em red;";
    }

// Recibe el nombre del jugador 1 y lo coloca en su sitio.

socket.on('modo_actual', (data) => {
    const siguiente_modo = data.modo_actual;
    console.log("MODO_ACTUAL", siguiente_modo)
    texto1.style.color = "white";
    setNivelesDesactivados(false);
    if (siguiente_modo === "palabras prohibidas") {
        cambiar_jugadores(true);

    } else {
        cambiar_jugadores(false);
    }
    modo_actual = siguiente_modo;
    niveles_bloqueados = false;
    actualizarNiveles(modo_actual);
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

    if (
        modo_actual === "palabras bonus" ||
        modo_actual === "tertulia" ||
        modo_actual === "palabras prohibidas" ||
        modo_actual === "frase final"
    ) {
        pedir_inspiracion({ modo_actual });
    }

    sincro = 0;
    }
});

socket.on('dar_nombre', (nombre) => {
    if(nombre == "") nombre = "ESCRITXR";
    console.log("NOMBRE", nombre)
    nombre1.value = nombre;
});

socket.on('connect', () => {
    console.log("Conectado al servidor por primera vez.");
    if (!nombre_musa) return;
    socket.emit('registrar_musa', { musa: player, nombre: nombre_musa });
    socket.emit('pedir_nombre');
});

// Variables de los modos.
let modo_actual = "";
let niveles_bloqueados = true;
let tempo_text_borroso;
let listener_modo;
let jugador_psico;
const NIVELES_ORDEN = [
    "letra bendita",
    "letra prohibida",
    "tertulia",
    "palabras bonus",
    "palabras prohibidas",
    "frase final"
];
const nivelesLinea = document.querySelector(".niveles-linea");
const nivelesItems = Array.from(document.querySelectorAll(".nivel-item"));
const nivelesScroll = document.querySelector(".niveles-scroll");
const nivelesPrev = document.querySelector(".niveles-prev");
const nivelesNext = document.querySelector(".niveles-next");
const nivelesContenedor = document.querySelector(".niveles");

function setNivelesDesactivados(estado) {
    if (!nivelesContenedor) return;
    nivelesContenedor.classList.toggle("niveles-desactivados", Boolean(estado));
}

function obtenerIndiceNivelActivo() {
    return nivelesItems.findIndex((item) => item.classList.contains("nivel-activo"));
}

function obtenerCentroItem(item) {
    if (!item || !nivelesLinea) return 0;
    const icono = item.querySelector(".nivel-icono");
    const rectLinea = nivelesLinea.getBoundingClientRect();
    if (icono) {
        const rectIcono = icono.getBoundingClientRect();
        return rectIcono.left - rectLinea.left + rectIcono.width / 2;
    }
    const rectItem = item.getBoundingClientRect();
    return rectItem.left - rectLinea.left + rectItem.width / 2;
}

function obtenerMaxScrollPermitido() {
    if (!nivelesScroll) return 0;
    return Math.max(0, nivelesScroll.scrollWidth - nivelesScroll.clientWidth);
}

function limitarScrollNiveles() {
    if (!nivelesScroll) return;
    const maxScroll = obtenerMaxScrollPermitido();
    if (nivelesScroll.scrollLeft > maxScroll) {
        nivelesScroll.scrollLeft = maxScroll;
    } else if (nivelesScroll.scrollLeft < 0) {
        nivelesScroll.scrollLeft = 0;
    }
}

function asegurarNivelActualVisible() {
    if (!nivelesScroll || !nivelesItems.length) return;
    const indice = obtenerIndiceNivelActivo();
    if (indice < 0) return;
    const item = nivelesItems[indice];
    const rectScroll = nivelesScroll.getBoundingClientRect();
    const rectItem = item.getBoundingClientRect();
    const margen = 8;
    let nuevoScroll = nivelesScroll.scrollLeft;
    if (rectItem.right > rectScroll.right - margen) {
        nuevoScroll += rectItem.right - rectScroll.right + margen;
    } else if (rectItem.left < rectScroll.left + margen) {
        nuevoScroll -= rectScroll.left - rectItem.left + margen;
    }
    const maxScroll = obtenerMaxScrollPermitido();
    nuevoScroll = Math.min(Math.max(0, nuevoScroll), maxScroll);
    if (Math.abs(nuevoScroll - nivelesScroll.scrollLeft) > 1) {
        nivelesScroll.scrollLeft = nuevoScroll;
    }
}

function resetearScrollNiveles() {
    if (!nivelesScroll) return;
    nivelesScroll.scrollTo({ left: 0, behavior: "auto" });
    if (nivelesPrev) {
        nivelesPrev.classList.remove("niveles-flecha--visible");
    }
    if (nivelesNext) {
        nivelesNext.classList.remove("niveles-flecha--visible");
    }
    limitarScrollNiveles();
    requestAnimationFrame(actualizarFlechasNiveles);
    setTimeout(() => {
        nivelesScroll.scrollLeft = 0;
        actualizarFlechasNiveles();
    }, 50);
    setTimeout(() => {
        nivelesScroll.scrollLeft = 0;
        actualizarFlechasNiveles();
    }, 200);
}

function recalcularLineaNiveles() {
    if (!nivelesLinea || !nivelesItems.length) return;
    const primero = nivelesItems[0];
    const ultimo = nivelesItems[nivelesItems.length - 1];
    const inicio = obtenerCentroItem(primero);
    const fin = obtenerCentroItem(ultimo);
    const longitud = Math.max(0, fin - inicio);
    nivelesLinea.style.setProperty("--linea-inicio", `${inicio}px`);
    nivelesLinea.style.setProperty("--linea-longitud", `${longitud}px`);

    const icono = primero.querySelector(".nivel-icono");
    if (icono) {
        const rectLinea = nivelesLinea.getBoundingClientRect();
        const rectIcono = icono.getBoundingClientRect();
        const lineaTop = rectIcono.top - rectLinea.top + rectIcono.height / 2;
        nivelesLinea.style.setProperty("--linea-top", `${lineaTop}px`);
        if (nivelesContenedor) {
            const rectCont = nivelesContenedor.getBoundingClientRect();
            const topGlobal = (rectLinea.top - rectCont.top) + lineaTop;
            nivelesContenedor.style.setProperty("--linea-top-global", `${topGlobal}px`);
        }
    }
}

function actualizarColorEquipo() {
    if (!nivelesContenedor) return;
    const colorEquipo = (nombre1 && nombre1.style && nombre1.style.color)
        ? nombre1.style.color
        : (nombre1 ? getComputedStyle(nombre1).color : "");
    nivelesContenedor.style.setProperty("--equipo-color", colorEquipo || "#00f5ff");
}

function actualizarFlechasNiveles() {
    if (!nivelesScroll || !nivelesPrev || !nivelesNext) return;
    limitarScrollNiveles();
    const maxScrollTotal = nivelesScroll.scrollWidth - nivelesScroll.clientWidth;
    const maxScroll = Math.min(maxScrollTotal, obtenerMaxScrollPermitido());
    const hayOverflow = maxScrollTotal > 4;
    const scrollActual = Math.max(0, Math.round(nivelesScroll.scrollLeft));
    const margen = 8;
    const limiteDerecho = Math.max(0, Math.round(maxScroll) - margen);
    const puedeIzquierda = hayOverflow && scrollActual > margen;
    const puedeDerecha = hayOverflow && scrollActual < limiteDerecho;
    nivelesPrev.classList.toggle("niveles-flecha--visible", puedeIzquierda);
    nivelesNext.classList.toggle("niveles-flecha--visible", puedeDerecha);
    if (!hayOverflow) {
        nivelesPrev.classList.remove("niveles-flecha--visible");
        nivelesNext.classList.remove("niveles-flecha--visible");
    }
    nivelesPrev.classList.remove("niveles-flecha--disabled");
    nivelesNext.classList.remove("niveles-flecha--disabled");
}

function desplazarNiveles(direccion) {
    if (!nivelesScroll) return;
    const delta = nivelesScroll.clientWidth * 0.6;
    const maxScroll = obtenerMaxScrollPermitido();
    const nuevoScroll = Math.min(Math.max(0, nivelesScroll.scrollLeft + direccion * delta), maxScroll);
    nivelesScroll.scrollTo({ left: nuevoScroll, behavior: "smooth" });
    requestAnimationFrame(actualizarFlechasNiveles);
    setTimeout(actualizarFlechasNiveles, 220);
}

if (nivelesPrev && nivelesNext) {
    nivelesPrev.addEventListener("click", () => desplazarNiveles(-1));
    nivelesNext.addEventListener("click", () => desplazarNiveles(1));
}

if (nivelesScroll) {
    nivelesScroll.addEventListener("scroll", () => {
        limitarScrollNiveles();
        actualizarFlechasNiveles();
    });
}

window.addEventListener("resize", () => {
    actualizarFlechasNiveles();
    recalcularLineaNiveles();
});
window.addEventListener("load", () => {
    resetearScrollNiveles();
    setTimeout(actualizarFlechasNiveles, 120);
    setTimeout(actualizarFlechasNiveles, 320);
});
window.addEventListener("pageshow", () => {
    resetearScrollNiveles();
    setTimeout(actualizarFlechasNiveles, 120);
});
requestAnimationFrame(() => {
    setNivelesDesactivados(terminado || !modo_actual || niveles_bloqueados);
    resetearScrollNiveles();
    actualizarColorEquipo();
    recalcularLineaNiveles();
});

function actualizarNiveles(modo) {
    if (!nivelesItems.length) return;
    const indice = NIVELES_ORDEN.indexOf(modo);
    if (niveles_bloqueados && indice < 0) {
        nivelesItems.forEach((item) => {
            item.classList.remove("nivel-activo", "nivel-pasado");
            item.classList.add("nivel-futuro");
            item.setAttribute("aria-current", "false");
        });
        actualizarFlechasNiveles();
        actualizarColorEquipo();
        recalcularLineaNiveles();
        return;
    }
    if (indice >= 0) {
        niveles_bloqueados = false;
    }
    nivelesItems.forEach((item, idx) => {
        item.classList.toggle("nivel-pasado", indice >= 0 && idx < indice);
        item.classList.toggle("nivel-activo", idx === indice);
        item.classList.toggle("nivel-futuro", indice < 0 || idx > indice);
        item.setAttribute("aria-current", idx === indice ? "step" : "false");
    });
    if (nivelesLinea) {
        const progreso = indice < 0 || nivelesItems.length <= 1
            ? 0
            : (indice / (nivelesItems.length - 1)) * 100;
        nivelesLinea.style.setProperty("--progreso", `${progreso}%`);
        const inicio = obtenerCentroItem(nivelesItems[0]);
        const centroActivo = indice >= 0 ? obtenerCentroItem(nivelesItems[indice]) : inicio;
        const progresoPx = indice < 0 ? 0 : Math.max(0, centroActivo - inicio);
        nivelesLinea.style.setProperty("--progreso-px", `${progresoPx}px`);
    }
    asegurarNivelActualVisible();
    limitarScrollNiveles();
    actualizarFlechasNiveles();
    actualizarColorEquipo();
    recalcularLineaNiveles();
    requestAnimationFrame(actualizarFlechasNiveles);
    setTimeout(actualizarFlechasNiveles, 60);
}

// Recibe los datos del jugador 1 y los coloca.
function handler_recibir_texto_x(data) {
if(data.text != null) texto1.innerHTML = data.text;
    if(data.points != null) puntos1.innerHTML = formatearPuntos(data.points);
    if(mostrar_texto.value == 1){
        //texto1.style.height = ""; // resetear la altura
        texto1.style.height = "auto";
    }
    if (jugador_psico == 1) {
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
            texto2.value = "\n" + texto2.value;
        }
    }*/
    //texto1.style.height = (texto1.scrollHeight) + "px";
    texto1.scrollTop = texto1.scrollHeight;
    //window.scrollTo(0, document.body.scrollHeight);
    //focalizador1.scrollIntoView(false);
}

socket.on(texto_x, handler_recibir_texto_x);

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
socket.on("count", data => {
    if(data.player == player){
        console.log(data.count)
    if(convertirASegundos(data.count) >= 20){
        tiempo.style.color = "white"
    }
    if (20 > convertirASegundos(data.count) && convertirASegundos(data.count) >= 10) {
        tiempo.style.color = "yellow"
    }
    if (10 > convertirASegundos(data.count)) {
        console.log("MENOR QUE 10", convertirASegundos(data.count) )
        tiempo.style.color = "red"
    }
    tiempo.innerHTML = data.count;
    if (data.count == "¡Tiempo!") {
        confetti_aux();

        limpiezas_final();

        //texto1.innerText = (texto1.innerText).substring(saltos_línea_alineacion_1, texto1.innerText.length);
        //texto2.value = (texto2.value).substring(saltos_línea_alineacion_2, texto2.value.length);

        // Desactiva el blur de ambos textos.
        //texto2.classList.remove('textarea_blur');
        //texto1.classList.remove('textarea_blur');
        // Variable booleana que dice si la ronda ha terminado o no.
        //texto1.innerText = eliminar_saltos_de_linea(texto1.innerText); //Eliminamos los saltos de línea del jugador 1 para alinear los textos.
        //texto2.value = eliminar_saltos_de_linea(texto2.value); //Eliminamos los saltos de línea del jugador 2 para alinear los textos.

        texto1.style.height = "auto";
        texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
        mostrar_texto.backgroundColor = "green";

        mostrar_texto.value = 1;
        notificacion.style.display = "none";
    }
}
});

// Inicia el juego.
socket.on('inicio', data => {
    LIMITE_TIEMPO_INSPIRACION = data.parametros.LIMITE_TIEMPO_INSPIRACION;
    terminado = false;
    niveles_bloqueados = true;
    setNivelesDesactivados(false);
    actualizarNiveles("");
    tiempo.innerHTML = "";
    tiempo.style.display = "";
    tiempo.style.color = "white"

    animateCSS(".contenedor", "pulse");

    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADOS?</span>'); 
    preparados.appendTo($('.container'));
    preparados_timer = setTimeout(() => {
        $('#countdown').css({ 'font-size': '10vw', 'opacity': 50 });
    }, 20);

    setTimeout(() => {

    var counter = 3;
  
    timer = setInterval(function() {
      
      $('#countdown').remove();
      
      var countdown = $('<span id="countdown">'+(counter==0?'¡ESCRIBE!':counter)+'</span>'); 
      countdown.appendTo($('.container'));
  
      sub_timer = setTimeout(() => {
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
  

    }
  }, 1000);
}, 1000);
});

socket.on("post-inicio", () => {
                socket.off('vote');
                socket.off('exit');
                socket.off('scroll');
                socket.off('temas_jugadores');
                //socket.off('recibir_comentario');
                socket.off('recibir_postgame1');
                socket.off('recibir_postgame2');
    
                limpiezas();
                /*
                skill.style = 'animation: brillo 2s ease-in-out;'
                skill.style.display = "flex";
                */
    
                texto1.style.height = "4.5em";
                texto1.rows =  "3";
});

// Resetea el tablero de juego.
socket.on('limpiar', () => {
    skill.style = 'animation: brillo 2s ease-in-out;'
    // Recibe el nombre del jugador y lo coloca en su sitio.
    socket.on(nombre, data => {
        nombre1.value = data;
    });

    limpiezas();

    modo_actual = "";
    terminado = true;
    niveles_bloqueados = true;
    setNivelesDesactivados(true);
    actualizarNiveles("");
    tiempo.style.display = "none";
    tiempo.style.color = "white"
    //nombre1.value = "ESCRITXR 1";
    //nombre2.value = "ESCRITXR 2";
    
    /*texto1.style.height = "40";
    texto1.style.height = (texto1.scrollHeight) + "px";
    texto2.style.height = "40";
    texto2.style.height = (texto2.scrollHeight) + "px";
    */
    notificacion.style.display = "none";
    resetearScrollNiveles();

});

// Recibe el nombre del jugador y lo coloca en su sitio.
socket.on(nombre, data => {
    nombre1.value = data;
});

socket.on(elegir_ventaja, () => {
    console.log("MODO ACTUAL", modo_actual);
    console.log("REVERTIR", false);
    cambiar_jugadores(false);
    texto1.style.color = "white";
    votando_ = true;
    confetti_musas();
    const opciones = [...VENTAJAS_PUTADAS].sort(() => Math.random() - 0.5).slice(0, 3);
    const botones = opciones
        .map(op => `<button class='btn' value='${op.emoji}' onclick='elegir_ventaja_publico(this)'>${op.emoji}</button>`)
        .join("");
    const explicaciones = opciones
        .map(op => op.descripcion)
        .join("<br><br>");
    tarea.innerHTML =
        "<p>¡" +
        "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" +
        nombre1.value +
        "</span>" +
        " está realmente inspirado!<br>Elige una ventaja:</p>" +
        botones +
        "<br><br><p style='font-size: 3.5vw;'>" + explicaciones + "</p>";
    enviarPalabra_boton.style.display = "none";
    campo_palabra.style.display = "none";
    recordatorio.innerHTML = "";
    animateCSS(".notificacion", "flash");
});

socket.on("elegir_repentizado", ({seleccionados, TIEMPO_VOTACION}) => {
    votando = true;
    tarea.innerHTML = "<p>¿Por donde quieres que continúe la historia?</p><button class='btn repentizado' value = '1' onclick='elegir_repentizado_publico(this)'>"+ seleccionados[0] + "</button><br><br><button class='btn' value = '2' onclick='elegir_repentizado_publico(this)'>"+ seleccionados[1] + "</button><br><br><button class='btn' value = '3' onclick='elegir_repentizado_publico(this)'>"+ seleccionados[2] + "</button>"
    enviarPalabra_boton.style.display = "none";
    campo_palabra.style.display = "none";
    recordatorio.innerHTML = "";
    setTimeout(() => {
        socket.emit('pedir_nombre');
        votando = false;
    }, TIEMPO_VOTACION);
    animateCSS(".notificacion", "flash");
});

socket.on("pedir_inspiracion_musa", juego => {
    const es_prohibidas = juego.modo_actual === "palabras prohibidas";
    cambiar_jugadores(es_prohibidas);
    texto1.style.color = es_prohibidas ? "red" : "white";
    actualizarNiveles(juego.modo_actual);
    if(sincro == 1 || votando == true){
        return;
    }
    pedir_inspiracion(juego);
});

function convertirASegundos(tiempo) {
    let partes = tiempo.split(':'); // separamos los minutos de los segundos
    let minutos = parseInt(partes[0], 10); // convertimos los minutos a un número entero
    let segundos = parseInt(partes[1], 10); // convertimos los segundos a un número entero
    return minutos * 60 + segundos; // devolvemos la cantidad total de segundos
  }

function pedir_inspiracion(juego){
    campo_palabra.value = "";
    enviarPalabra_boton.style.display = "";
    campo_palabra.style.display = "";
    modo_actual = juego.modo_actual;
    recordatorio.innerHTML = "";
    const etiquetaMusa = "<span style='color: orange;'>" + nombre_musa + "</span>";
    if(terminado == false && votando == false){
    if(juego.modo_actual == "palabras bonus"){
        tarea.innerHTML = "Cántame a mí, " + etiquetaMusa + ", una palabra que me inspire:"
    }
    if(juego.modo_actual == "letra bendita") {
        letra = juego.letra_bendita;
        tarea.innerHTML = "Cántame a mí, " + etiquetaMusa + ", una palabra que lleve la letra " + "<span style='color: green;'>" + letra.toUpperCase(); + "</span> :";
    }
    if(juego.modo_actual == "letra prohibida") {
        letra = juego.letra_prohibida;
        tarea.innerHTML = "Cántame a mí, " + etiquetaMusa + ", una palabra que <span style='color: red;'>NO</span> lleve la letra " + "<span style='color: red;'>" + letra.toUpperCase(); + "</span> :";
    }

    if(juego.modo_actual == "palabras prohibidas"){
        console.log("REVERTIR", true);
        cambiar_jugadores(true);
        texto1.style.color = "red";
        tarea.innerHTML = "<span style='color: pink;'>Incordia</span> a mi oponente, " + etiquetaMusa + ", con una palabra que no pueda usar:";
    } 

    if(juego.modo_actual == "tertulia") {
        campo_palabra.value = "none";
        enviarPalabra_boton.style.display = "none";
        campo_palabra.style.display = "none";
        tarea.innerHTML = "<br><br><br>" + etiquetaMusa + ", mira a " + "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" + nombre1.value + "</span>" + " y " + "<span style='color: blue;'>CUENTA</span>" + " todo aquello que le has querido decir hasta ahora.";
    
    }

    if(juego.modo_actual == "frase final") {
        campo_palabra.value = "none";
        enviarPalabra_boton.style.display = "none";
        campo_palabra.style.display = "none";
        tarea.innerHTML = "<br><br><br>" + etiquetaMusa + ", " + "<span style='" + "color: " + nombre1.style.color + "; text-shadow: " + nombre1.style.textShadow + ";'>" +  nombre1.value + "</span>" + " va a TERMINAR su obra gracias a ti. 🤍";
    }

    socket.emit("pedir_texto", { musa: player });
    notificacion.style.display = "block";
    animateCSS(".notificacion", "flash");
    fin_pag.scrollIntoView({behavior: "smooth", block: "end"});
    }
}

function recibir_palabra(data) {
    animacion_modo();
    palabra1.innerHTML = "(+" + data.puntuacion + " pts) " + data.palabras_var;
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
    stopConfetti()
    clearInterval(intervalID)
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);
    clearTimeout(sub_timer);
    clearTimeout(preparados_timer);
    limpiar_colddown()
    cambiar_jugadores(false);
    skill.style.display = "none";
    skill.style.border = "0.5vw solid greenyellow";
    skill_cancel.style.display = "none";
    texto1.innerText = "";

    puntos1.innerHTML = 0 + " palabras";
   
    
    puntos1.style.color = "white";  
    votando = false;
    texto1.style.height = "4.5em"; /* Alto para tres líneas de texto */
    texto1.scrollTop = texto1.scrollHeight;
    mostrar_texto.backgroundColor = "red";

    mostrar_texto.value = 0;
    setNivelesDesactivados(false);
    niveles_bloqueados = true;
    actualizarNiveles("");
}

function limpiezas_final(){
    clearInterval(interval_cooldown);
    limpiar_colddown()
    cambiar_jugadores(false);
    skill.style.display = "none";
    skill_cancel.style.display = "none";
    tiempo.style.color = "white";
    votando = false;
    terminado = true;
    setNivelesDesactivados(true);
    niveles_bloqueados = true;
    actualizarNiveles("");
    resetearScrollNiveles();
}
// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto1.addEventListener("keyup", (evt) => {
    console.log(evt.key)
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
  
    }
  });
  // Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
  texto1.addEventListener("keydown", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
  
    }
  });
  
  // Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
  texto1.addEventListener("press", (evt) => {
    if (evt.key.length === 1 || evt.key == "Enter" || evt.key=="Backspace") {
      texto1.style.height = (texto1.scrollHeight) + "px"; //Reajustamos el tamaño del área de texto del j1.
  
    }
  });

function limpiar_colddown(){
    clearInterval(interval_cooldown);
    text_progress.removeEventListener('mouseenter', onMouseEnter);
    text_progress.removeEventListener('mouseleave', onMouseLeave);
    bar_progress.style.width = '0%'
    //button.disabled = false; // Habilita el botón
    text_progress.style.color = "orange";
    text_progress.innerHTML = "Inspirar"
    cooldown = false;
}

  const SECOND_IN_MS = 1000;
  const UPDATE_INTERVAL = SECOND_IN_MS / 60; // Update 60 times per second (60 FPS)
  const SKILL_CLASS = 'skill';
  const DISABLED_CLASS = 'disabled';
  
// Cooldown in milliseconds
cooldowntime = 5000;

// Activate clicked skill
const activateSkill = (event) => {
  const {target} = event;
  // Exit if we click on anything that isn't a skill
  if(target.textContent == '✏️'){
        editando = true;
        mostrar_texto.value = 0;
        mostrarTextoCompleto(mostrar_texto);
        texto1.contentEditable= "true";
        target.textContent = '✉️';
        skill_cancel.style.display = "flex";
    return
  }
  if(!target.classList.contains(SKILL_CLASS)) return;

  if(target.textContent == '✉️'){
    
    feedback_texto_editado.innerHTML = "¡Texto editado!"
    animateCSS(".feedback_texto_editado", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
        feedback_texto_editado.innerHTML = "";
        }, 800);
    });
    texto1.style.height = "";
    editando = false;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable = "false";
    socket.emit('aumentar_tiempo', {secs:-1, player});
    socket.emit(texto_x, { text: texto1.innerText, points: puntos1.textContent});
    skill_cancel.style.display = "none";
    target.textContent = '✏️'
  }
  target.classList.add(DISABLED_CLASS);
  target.style = '--time-left: 100%';
  
  // Get cooldown time
  let time = cooldowntime - UPDATE_INTERVAL;
  
  // Update remaining cooldown
  intervalID = setInterval(() => {
    // Pass remaining time in percentage to CSS
    const passedTime = time / cooldowntime * 100;
    target.style = `--time-left: ${passedTime}%;`;

    // Display time left
    //target.textContent = (time / SECOND_IN_MS).toFixed(2);
    time -= UPDATE_INTERVAL;
    
    // Stop timer when there is no time left
    if(time < 0) {
        
        skill_cancel.style.display = "none";
        skill.style.display = "flex";
        target.textContent = '✏️';
        target.style = '';
        target.style = 'animation: brillo 2s ease-in-out;'
        target.classList.remove(DISABLED_CLASS);
      
      clearInterval(intervalID);
    }
  }, UPDATE_INTERVAL);
}

function cancelar(boton){
    socket.emit('pedir_texto')
    texto1.style.height = "";
    editando = false;
    mostrarTextoCompleto(mostrar_texto);
    texto1.contentEditable = "false";
    boton.style.display = "none";
    skill.textContent = '✏️';
}
// Add click handler to the table
skill.addEventListener('click', activateSkill, false);

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

  function confetti_musas(){
    var scalar = 2;
    var unicorn = confetti.shapeFromText({ text: '⭐', scalar });
    isConfettiRunning = true; // Habilita la ejecución de confetti
    
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

function cambiar_jugadores(revertir) {

    const p = Number(player); // jugador local: 1 o 2

    // Función de mapeo clara y reversible
    const mapJugador = (j) => revertir ? (3 - j) : j;

    const jugadorTexto = mapJugador(p);
    const jugadorEstilo = mapJugador(p);
    console.log("Revertir:", revertir);
    console.log("OFF", texto_x);

    // 1) Quitar listener anterior
    socket.off(texto_x, handler_recibir_texto_x);

    // 2) Nuevo canal de texto
    texto_x = `texto${jugadorTexto}`;

    console.log("ON", texto_x);

    // 3) Volver a suscribir
    socket.on(texto_x, handler_recibir_texto_x);

    // 4) Aplicar estilos según el jugador resultante
    if (jugadorEstilo === 1) {
        nombre1.style =
            "color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
        metadatos.style =
            "color:red; text-shadow: 0.0625em 0.0625em aqua;";

    } else {

        nombre1.style =
            "color:aqua; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;";
        metadatos.style =
            "color:red; text-shadow: 0.0625em 0.0625em aqua;";

                    nombre1.style =
            "color:red; text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em aqua;";
        metadatos.style =
            "color:aqua; text-shadow: 0.0625em 0.0625em red;";
    }

    socket.emit('pedir_nombre', {musa : jugadorTexto});

    actualizarColorEquipo();

    console.log(
        "texto_x final =", texto_x,
        "| jugadorTexto =", jugadorTexto,
        "| jugadorEstilo =", jugadorEstilo
    );
}
