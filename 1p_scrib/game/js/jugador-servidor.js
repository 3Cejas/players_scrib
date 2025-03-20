let tiempo_inicial = new Date();
let es_pausa = false;
let borrado_cambiado = false;
let duracion;
let texto_guardado = "";
let pararEscritura = false;
let LISTA_MODOS = ["palabras bonus", "letra bendita","letra prohibida", "palabras bonus", "palabras prohibidas", "frase final"];
let modos_restantes;

const getEl = (id) => document.getElementById(id); // Obtiene los elementos con id.

// COMPONENTES DEL JUGADOR 1
let texto = getEl("texto");
let puntos = getEl("puntos");
let feedback = getEl("feedback1");
let musas = getEl("musas");
  
let palabra = getEl("palabra");
let definicion = getEl("definicion");
let explicación = getEl("explicación");
let metadatos = getEl("metadatos");
  
let tiempo = getEl("tiempo");
let temas = getEl("temas");
let lightning = getEl("lightning");
let neon = getEl("neon");

let btnFinal = getEl("btn_final");
let btnPantallaCompleta = getEl("btn_pantalla_completa");
let btnLimpiar = getEl("btn_limpiar");
let btnEscribir = getEl("btn_escribir");
let btnDescargarTexto = getEl("btn_descargar_texto");
let btnOpciones = getEl("btn_opciones");
let btnVolver = getEl("btn_volver");
let div_opciones = getEl("opciones");

let tiempo_cambio_palabras_input = document.getElementById('tiempo_cambio_palabras');
let tiempo_cambio_letra_input = document.getElementById('tiempo_cambio_letra');
let tiempo_modos_input = document.getElementById('tiempo_modos');
let tiempo_inicial_input = document.getElementById('tiempo_inicial');

let soporte = document.getElementById('soporte');

  

let tempo_text_borroso;
let tempo_text_inverso;

let listener_cuenta_atras = null;
let listener_cambio_letra_palabra = null;
let timer = null;
let sub_timer = null;

// Variables de los modos.
let modo_actual = "";
let modo_anterior = "";

let putada_actual = "";
let modo_texto_borroso = 0;
let desactivar_borrar = false;

const LISTA_MODOS_INICIAL = ["letra bendita", "letra prohibida", "palabras bonus", "palabras prohibidas", "frase final"];


// Objeto que asocia cada modo con un color
const COLORES_MODOS = {
    "letra bendita": "green",
    "letra prohibida": "red",
    "tertulia": "blue",
    "palabras bonus": "yellow",
    "palabras prohibidas": "pink",
    "frase final": "orange"
};

const letras_prohibidas = ['e','a','o','s','r','n','i','d','l','c'];
const letras_benditas= ['z','j','ñ','x','k','w', 'y', 'q', 'h', 'f'];
const frecuencia_letras = {
    'a': 12.53,
    'b': 1.42,
    'c': 4.68,
    'd': 5.86,
    'e': 13.68,
    'f': 0.69,
    'g': 1.01,
    'h': 0.7,
    'i': 6.25,
    'j': 0.44,
    'k': 0.02,
    'l': 4.97,
    'm': 3.15,
    'n': 6.71,
    'ñ': 0.31,
    'o': 8.68,
    'p': 2.51,
    'q': 0.88,
    'r': 6.87,
    's': 7.98,
    't': 4.63,
    'u': 3.93,
    'v': 0.90,
    'w': 0.01,
    'x': 0.22,
    'y': 0.90,
    'z': 0.52
}

let letras_benditas_restantes = [...letras_benditas];
let letras_prohibidas_restantes = [...letras_prohibidas];

const palabras_prohibidas = [
    "de", "la", "que", "el", "en", "y", "a", "los", "se", "del",
    "las", "un", "por", "con", "no", "una", "su", "para", "es", "al",
    "lo", "como", "más", "o", "pero", "sus", "le", "ha", "me", "si",
    "sin", "sobre", "este", "ya", "entre", "cuando", "todo", "esta", "ser", "son",
    "dos", "también", "fue", "había", "era", "muy", "años", "hasta", "desde", "está"
];

const frases_finales = [
    "No hay nada que hacer: criaremos a los nuestros",
    "Cuando todo parecía perennemente feliz",
    "Nada es intercurrente",
    "Pudo ser el calor del verano",
    "Mataste a tus verdaderos padres",
    "Chillé y salí corriendo",
    "Y me desperté",
    "Habla, es lunes",
    "Nada mejor para aleonar el espíritu del Oeste",
    "Te perdono, mamá",
    "Me duele, pero prefiero que nos separemos",
    "Te estoy diciendo que te tienes que unir",
    "Alócate, coño",
    "No podía respirar",
    "Te van a dar varias hostias hagas lo que hagas",
    "Yo soy el autor de todo",
    "Lo flipo",
    "No consigo separar mis pensamientos",
    "Y la palabra de Marx será olvidada como la de todos",
    "Igual se han caído en el baño",
    "¿Sabes quién soy?",
    "No me importa que lo esté pasando mal",
    "Me gusta mucho esto de luchar",
    "¡Que viva este equipo!",
    "Se dedica a algo de la sanidad así que es parecido",
    "No puedo más",
    "Yo voté al partido",
    "Eres como la heroína, me matas",
    "Eras el amor de mi vida. En fin",
    "Te han robado twitter",
    "Ahora comienza el viaje",
    "Un lugar donde todo sale mal",
    "No es por ti, es por mí",
    "¡Dime qué quieres!",
    "Debe haber algo permanente en este cambiante cosmos",
    "Esperemos a que salga el sol",
    "Mierda",
    "¡Basta ya de tanta guerra!",
    "Siempre hay tiempo para volver a empezar",
    "Y pasarán muchos años más",
    "Me confundió un poco",
    "¡Que se callen!",
    "¡Tú nunca venías!",
    "Porque esta ciudad lo es todo, TODO",
    "Quizá algún día me vuelva a necesitar. Llámeme entonces"
  ];

let palabras_prohibidas_restantes = [...palabras_prohibidas];

var letra_prohibida = "";
var letra_bendita = "";
let listener_modo;
let listener_modo1;
let timeoutID_menu;
let listener_modo_psico;
let activado_psico = false;
let temp_text_inverso_activado = false;

let TIEMPO_INVERSO = 20000;
let TIEMPO_BORROSO = 20000;
let TIEMPO_BORRADO = 20000;
let TIEMPO_CAMBIO_MODOS = 5000;
let TIEMPO_CAMBIO_LETRA = 5000;
let TIEMPO_CAMBIO_PALABRA = 5000;
let TIEMPO_INICIAL = 20000;
const mainTitle = document.querySelector('.main-title');
const buttonContainer = document.querySelector('.button-container');

let nombre = getEl("nombre");

let player = getParameterByName("name");
nombre.value = (player && player.trim() !== "") ? player.toUpperCase() : "ESCRITXR";

nombre.style="color:aqua;text-shadow: -0.0625em -0.0625em black, 0.0625em 0.0625em red;"
metadatos.style = "color:aqua; text-shadow: 0.0625em 0.0625em red;";

texto.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;
  
        // Si el cursor está justo antes de un `contenteditable="false"`, bloqueamos el retroceso
        if (
          startContainer.nodeType === 1 &&
          startOffset === 0 &&
          startContainer.previousSibling &&
          startContainer.previousSibling.getAttribute &&
          startContainer.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault(); // Bloquea la acción de retroceso
        }
  
        // Si el cursor está dentro de un nodo de texto, verificamos el anterior
        if (
          startContainer.nodeType === 3 &&
          startOffset === 0 &&
          startContainer.parentNode.previousSibling &&
          startContainer.parentNode.previousSibling.getAttribute &&
          startContainer.parentNode.previousSibling.getAttribute("contenteditable") === "false"
        ) {
          e.preventDefault(); // Bloquea la acción de retroceso
        }
      }
    }
  });
  
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
        lightning.style.transform = "translateX(-50%)";
        lightning.style.top = "27%";
        lightning.style.left = "50%";
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

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        palabra.style.backgroundColor = "yellow";
        explicación.style.color = "yellow";
        if (window.innerWidth <= 800) {
            definicion.style.fontSize = "2vw";
            palabra.style.fontSize = "5vw";
            explicación.style.fontSize = "5vw"
        }
        else{
            definicion.style.fontSize = "1vw";
            palabra.style.fontSize = "2vw";
            explicación.style.fontSize = "2vw"
        }
        explicación.innerHTML = "NIVEL PALABRAS BENDITAS";

        recibir_palabra();
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        indice_letra_prohibida = Math.floor(Math.random() * letras_prohibidas_restantes.length);
        letra_prohibida = letras_prohibidas_restantes[indice_letra_prohibida]
        letras_prohibidas_restantes.splice(indice_letra_prohibida, 1);
        if(letras_prohibidas_restantes.length == 0){
            letras_prohibidas_restantes = [...letras_prohibidas];
        }

        listener_cambio_letra_palabra = setTimeout(nueva_letra_prohibida, TIEMPO_CAMBIO_LETRA);

        definicion.style.fontSize = "1.5vw";
        palabra.style.backgroundColor = "red";
        explicación.style.color = "red";
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("input", listener_modo);
        explicación.innerHTML = "NIVEL LETRA MALDITA";
        palabra.innerHTML = "LETRA MALDITA: " + letra_prohibida;
        definicion.innerHTML = "";
        //////socket.emit("nueva_palabra_musa", player);
    },

    "letra bendita": function (data) {
        indice_letra_bendita = Math.floor(Math.random() * letras_benditas_restantes.length);
        letra_bendita = letras_benditas_restantes[indice_letra_bendita]
        letras_benditas_restantes.splice(indice_letra_bendita, 1);
        if(letras_benditas_restantes.length == 0){
            letras_benditas_restantes = [...letras_benditas];
        }
        listener_cambio_letra_palabra = setTimeout(nueva_letra_bendita, TIEMPO_CAMBIO_LETRA);

        definicion.style.fontSize = "1.5vw";
        palabra.style.backgroundColor= "lime";
        explicación.style.color = "lime";
        //TO DO: MODIFICAR FUNCIÓN PARA QUE NO ESTÉ DENTRO DE OTRA.
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        explicación.innerHTML = "NIVEL LETRA BENDITA";
        palabra.innerHTML = "LETRA BENDITA: " + letra_bendita;
        definicion.innerHTML = "";
        //////socket.emit("nueva_palabra_musa", player);
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
        //explicación.innerHTML = "NIVEL PSICODÉLICO";
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
        es_pausa = true;
        tiempo_restante = TIEMPO_BORRADO - (new Date().getTime() - tiempo_inicial.getTime());
        pausa();
        explicación.style.color = "blue";
        explicación.innerHTML = "NIVEL TERTULIA";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
    },

    'palabras prohibidas': function (data) {
        palabra.style.backgroundColor = "pink";
        explicación.style.color = "pink";
        explicación.innerHTML = "NIVEL PALABRAS MALDITAS";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        nueva_palabra_prohibida()

    },

    'frase final': function (socket) {
        explicación.style.color = "orange";
        palabra.style.backgroundColor = "orange";
        explicación.innerHTML = "NIVEL FRASE FINAL";
        palabra.innerHTML = "";
        definicion.innerHTML = "";
        frase_final();
    },

    "": function (data) { },
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        //////socket.off(enviar_palabra);
        asignada = false;
        texto.removeEventListener("keyup", listener_modo);
        definicion.style.fontSize = "1.5vw";
        clearTimeout(listener_cambio_letra_palabra);

    },

    "letra prohibida": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        clearTimeout(listener_cambio_letra_palabra);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        texto.removeEventListener("keyup", listener_modo);
        letra_bendita = "";
        clearTimeout(listener_cambio_letra_palabra);

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

    "tiempo_borrado_más": function (data){ },
    
    "tertulia": function (data) {
        es_pausa = false;
        reanudar();
    },

    "palabras prohibidas": function (data) {
        //////socket.off(enviar_palabra);
        asignada = false;
        texto.removeEventListener("keyup", listener_modo);
        clearTimeout(listener_cambio_letra_palabra);

    },

    "frase final": function (data) {
        texto.removeEventListener("keyup", listener_modo);
    },

    "": function (data) { },
};

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto.addEventListener("input", (evt) => {
    countChars(texto);
});

// Recibe los datos del jugador 1 y los coloca.
/*socket.on(texto_x, (data) => {
    texto.innerText = data.text;
    puntos.innerHTML = data.points;
    nivel.innerHTML = data.level;
    texto.scrollTop = texto.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
});
*/

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/
function count(data){
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
        console.log(putada_actual, "esto no doebería ocurrir")
        if (putada_actual == "🙃"){
            console.log("NO PUEDOOOOO ESTO NO DEBERÍA OCURRRIR")
            texto.classList.add("rotate-vertical-center");
            texto.addEventListener('animationend', function() {
                texto.classList.remove("rotate-vertical-center");
                texto.removeEventListener('animationend', arguments.callee);
            });
            clearTimeout(tempo_text_inverso);
            temp_text_inverso_activado = false;
            procesarTexto();
        }
        
        if(modo_actual != "" || modo_actual != "frase final"){
        LIMPIEZAS["psicodélico"]("");
        tiempo.style.color = "white";
            pararEscritura = true;
            stopConfetti();
            clearTimeout(listener_cuenta_atras);
            clearInterval(timer);  
            clearTimeout(sub_timer);
            document.body.classList.remove("bg");
            document.body.classList.remove("rain");
            lightning.classList.remove("lightning");
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            if(temp_text_inverso_activado == true){
                temp_text_inverso_activado = false;
                clearTimeout(tempo_text_inverso);
                procesarTexto();
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            texto_guardado = texto.innerText;
        
            //texto.innerText = "";
            texto.style.display = "none";
            texto.style.height = "";
            texto.rows =  "6";
            definicion.style.fontSize = "1.5vw";
            temas.innerHTML = "";
            temas.display = "";
            texto.contentEditable= "false";
            palabra.innerHTML = "";
            definicion.innerHTML = "";
            explicación.innerHTML = "";
            menu_modificador = false;
            focusedButtonIndex = 0;
            modificadorButtons = [];

            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
        
            // Desactiva el blur de ambos textos.
            blurreado = false;
            texto.classList.remove("textarea_blur");
        
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)

            puntos_palabra = 0;
            puntos_ = 0;
            puntos_letra_prohibida = 0;
            puntos_letra_bendita = 0;
        
            letra_prohibida = "";
            letra_bendita = "";
            asignada = false;
            palabra_actual = []; // Variable que almacena la palabra bonus actual.            
            // Desactiva, por seguridad, todos los modos.
            modo_texto_borroso = 0;
            desactivar_borrar = true;
            console.log(puntos)
            
            feedback.innerHTML = "";
            
            definicion.innerHTML = "";
            explicación.innerHTML = "";
        
            caracteres_seguidos = 0;
            
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
            for (let key in LIMPIEZAS) { 
                console.log(key)
                LIMPIEZAS[key]();
                console.log(texto.innerHTML)
                console.log(temp_text_inverso_activado)
            }
            console.log(texto.innerHTML)
            console.log(temp_text_inverso_activado)
        
            clearTimeout(borrado);
            clearTimeout(cambio_palabra);
            clearTimeout(tempo_text_borroso);
        }
        console.log(data)
        console.log("MIERDA PUTA")
        console.log(texto.innerHTML)
        console.log(temp_text_inverso_activado)
        iniciarMenu();    
        }
    }
};
  
function resucitar(){
    terminado = false;
    desactivar_borrar = false;
    logo.style.display = "none"; 
    neon.style.display = "none"; 
    tiempo.innerHTML = "";
    tiempo.style.display = "";

    pararEscritura = true;
    stopConfetti();
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);  
    clearTimeout(sub_timer);
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    if(temp_text_inverso_activado == true){
        clearTimeout(tempo_text_inverso);
        temp_text_inverso_activado = false;
        procesarTexto();
    }

    texto.innerText = texto_guardado;
    texto.style.display = "";
    texto.style.height = "";
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    console.log(modo_actual)
    if(modo_actual != "tertulia"){
    texto.contentEditable= "false";
    }
    //puntos.innerHTML = 0 + " palabras";
    //nivel.innerHTML = "nivel 0";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';

    // Desactiva el blur de ambos textos.
    blurreado = false;
    texto.classList.remove("textarea_blur");
    
    // Desactiva, por seguridad, todos los modos.
    console.log(puntos)

    caracteres_seguidos = 0;
        texto.innerText = texto_guardado.trim();

        

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
// Inicia el juego.
function inicio() {
    actualizarVariables()
    rellenarListaModos()
    animateCSS(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "none";
        btnEscribir.style.display = "none";
        btnLimpiar.style.display = "";
        btnDescargarTexto.style.display = "none" 
        btnPantallaCompleta.style.display = ""
        btnFinal.style = "" 
        btnVolver.style.display = "none";
        animateCSS(".botones", "backInLeft")
    });

    animateCSS(".contenedor", "backOutLeft").then((message) => {
        animateCSS(".contenedor", "pulse");

    limpieza();
    modos_restantes = [...LISTA_MODOS];
    palabras_prohibidas_restantes = [...palabras_prohibidas];

    desactivar_borrar = false;
    texto.style.height = "";

    logo.style.display = "none"; 
    neon.style.display = "none"; 
    texto.contentEditable= "false";
    tiempo.innerHTML = "";
    tiempo.style.display = "";

    // Se muestra "¿PREPARADOS?" antes de comenzar la cuenta atrás
    $('#countdown').remove();
    var preparados = $('<span id="countdown">¿PREPARADX?</span>'); 
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
      sub_timer = setTimeout(() => {
        if (counter > -1) {
          $('#countdown').css({ 'font-size': '40vw', 'opacity': 0 });
        } else {
            post_inicio(false);
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
};

//////socket.on("post-inicio", (data) => {
//////    console.log(data.borrar_texto, "borrar texto")
//////    post_inicio(data.borrar_texto);
//////});    

function post_inicio(borrar_texto){
    clearTimeout(timer);
        if (borrar_texto == false) {
            texto.innerText = texto_guardado.trim();

            

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
        animateCSS(".explicación", "bounceInLeft");
        animateCSS(".palabra", "bounceInLeft");
        animateCSS(".definicion", "bounceInLeft");
        startCountDown(TIEMPO_INICIAL/1000)
        temp_modos()
}

function startCountDown(duration) {

    secondsRemaining = duration;

    let min;
    let sec;
    clearInterval(countInterval);
    countInterval = setInterval(function () {
        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        if (secondsRemaining == 20) {
            tiempo.style.color = "yellow"
        }
        if (secondsRemaining == 10) {
            tiempo.style.color = "red"
        }
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining <= 0) {
            final();
        };

    }, 1000);
}

function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function addSeconds(secs) {
    secondsRemaining += secs;
    if(secondsRemaining < 0){
        secondsRemaining = 0;
    }  
    min = parseInt(secondsRemaining / 60);
    sec = parseInt(secondsRemaining % 60);

    tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
    count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
}

// Resetea el tablero de juego.
function limpiar(borrar){
    animateCSS(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "";
        btnEscribir.style.display = "";
        //btnDescargarTexto.style.display = "" 
        btnPantallaCompleta.style.display = "" 
        btnFinal.style.display = "none" 
        animateCSS(".botones", "backInLeft")
    });


    if(borrar == false){
        texto_guardado = texto.innerText;
    }

    limpieza();

    stopConfetti()
    
    texto.rows =  "1";

    modo_actual = "";
    putada_actual = "";

    temas.innerHTML = "";
    
    texto.contentEditable= "false";

    tiempo.style.display = "none";
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    });
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
};

function activar_modo (data){
    animacion_modo();
    palabra.innerHTML = "";
    explicación.innerHTML = "";
    LIMPIEZAS[modo_actual](data);
    rapidez_borrado -= 200;
    rapidez_inicio_borrado -= 200;
    modo_actual = data.modo_actual;
    if(terminado == false){
    MODOS[modo_actual](data, socket);
    }
};

function pausar_js (data){
    es_pausa = true;
    LIMPIEZAS[modo_actual](data);
    tiempo_restante = TIEMPO_BORRADO - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
};


function nueva_letra (letra) {
    palabra_actual = []
    definicion.innerHTML = "";
    if(modo_actual == "letra prohibida"){
        letra_prohibida = letra;

        texto.removeEventListener("beforeinput", listener_modo);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("beforeinput", listener_modo);
        animacion_palabra();
        palabra.innerHTML = "LETRA PROHIBIDA: " + letra_prohibida;
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = letra;
        texto.removeEventListener("beforeinput", listener_modo);
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo);
        animacion_palabra();
        palabra.innerHTML = "LETRA BENDITA: " + letra_bendita;
    }
};

async function recibir_palabra() {
    data = await getRandomSpanishWord();
    console.log(data)
    if (data) {
      console.log(`
        <h2>Palabra: ${data.title}</h2>
        <p>Definición: ${data.definicion}</p>
      `);
      
    } else {
      document.getElementById('resultado').textContent = 'Hubo un error';
    }
    animacion_modo();
    palabra_actual = [data.title];
    tiempo_palabras_bonus = puntuación_palabra(data.title);
    palabra.innerHTML = data.title + " (⏱️+" + tiempo_palabras_bonus + " segs.)" ;
    definicion.innerHTML = data.definicion;

    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    asignada = true;
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto.addEventListener("keyup", listener_modo);
    clearTimeout(listener_cambio_letra_palabra)
    listener_cambio_letra_palabra = setTimeout(recibir_palabra, TIEMPO_CAMBIO_PALABRA);
}

function nueva_palabra_prohibida() {

    indice_palabra = Math.floor(Math.random() * palabras_prohibidas_restantes.length);
    palabra_bonus = [[palabras_prohibidas_restantes[indice_palabra]], [""]];
    palabras_prohibidas_restantes.splice(indice_palabra, 1);
        if(palabras_prohibidas_restantes.length == 0){
            palabras_prohibidas_restantes = [...palabras_prohibidas];
        }
    palabras_var = palabra_bonus[0];
    tiempo_palabras_bonus = puntuación_palabra(palabra_bonus[0][0]);
        
    console.log(palabra_bonus, palabras_var, tiempo_palabras_bonus)
    animacion_modo();
    palabra_actual = palabra_bonus[0];
    palabra.innerHTML = palabras_var + " (⏱️-" + tiempo_palabras_bonus + " segs.)";

    definicion.innerHTML = palabra_bonus[1];
    tiempo_palabras_bonus = tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo);
    asignada = true;
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
    texto.addEventListener("keyup", listener_modo);
    clearTimeout(listener_cambio_letra_palabra)
    listener_cambio_letra_palabra = setTimeout(nueva_palabra_prohibida, TIEMPO_CAMBIO_PALABRA);
}

function frase_final() {

    str_frase_final = frases_finales[Math.floor(Math.random() * frases_finales.length)];
    console.log("\""+str_frase_final+"\"")
    animacion_modo();
    palabra.innerHTML = "\""+str_frase_final+"\"";
    definicion.innerHTML = "⬆️ ¡Introduce la frase final para ganar! ⬆️"

    texto.removeEventListener("keyup", listener_modo);
    listener_modo = function (e) { modo_frase_final(e) };
    texto.addEventListener("keyup", listener_modo);
}

// FUNCIONES AUXILIARES.

   /*************************************************************
      VARIABLES GLOBALES Y REFERENCIAS A ELEMENTOS DEL DOM
    **************************************************************/
      const mainMenu = document.getElementById('mainMenu');
      const quantityMenu = document.getElementById('quantityMenu');
  
      const btnSi = document.getElementById('btnSi');
      const btnNo = document.getElementById('btnNo');
      const mainMenuButtons = [btnSi, btnNo];
      let mainMenuIndex = 0;
  
      const quantityDisplay = document.getElementById('quantityDisplay');
      const btnConfirmar = document.getElementById('btnConfirmar');
      const btnAtras = document.getElementById('btnAtras');
      let quantityMenuElements = [quantityDisplay, btnConfirmar, btnAtras];
      let quantityMenuIndex = 0;
  
      let palabras = 1;
      const PALABRAS_A_SEGUNDOS = 3;
      let currentMenu = 'main';
  
      /*************************************************************
        ACTUALIZACIONES DE ESTADO VISUAL
      **************************************************************/
      function actualizarSeleccionMainMenu() {
        mainMenuButtons.forEach(btn => btn.classList.remove('selected'));
        mainMenuButtons[mainMenuIndex].classList.add('selected');
        mainMenuButtons[mainMenuIndex].focus();
      }
  
      function actualizarSeleccionQuantityMenu() {
        quantityMenuElements.forEach(el => el.classList.remove('selected'));
        quantityMenuElements[quantityMenuIndex].classList.add('selected');
        if (quantityMenuIndex === 1) btnConfirmar.focus();
        if (quantityMenuIndex === 2) btnAtras.focus();
      }
  
      function actualizarTextoCantidad() {
        const segundos = palabras * PALABRAS_A_SEGUNDOS;
        quantityDisplay.innerHTML = `<span style="color: yellow;">${palabras} palabra(s)</span> => <span style="color: green;">${segundos} segundo(s)</span>`;

      }
      
      
      function recortarUltimasPalabras(text, cantidadPalabras) {
        if (cantidadPalabras <= 0) {
          return text;
        }
        
        let endPos = text.length; // posición hasta la que mantenemos el texto
        let palabrasEliminadas = 0;
  
        while (palabrasEliminadas < cantidadPalabras) {
          // 1. Ignorar espacios y saltos de línea desde el final (si los hay)
          while (endPos > 0 && /\s/.test(text[endPos - 1])) {
            endPos--;
          }
          if (endPos <= 0) {
            // Si se quedó sin texto, todo se elimina
            return '';
          }
  
          // 2. Retroceder hasta el inicio de la palabra previa
          let inicioPalabra = endPos - 1;
          while (inicioPalabra >= 0 && !/\s/.test(text[inicioPalabra])) {
            inicioPalabra--;
          }
  
          // Ajustamos endPos al inicio de esta palabra (para recortarla)
          endPos = inicioPalabra >= 0 ? inicioPalabra + 1 : 0;
          palabrasEliminadas++;
  
          if (endPos <= 0) {
            return '';
          }
        }
  
        // 3. Retornar sólo la parte que no recortamos, con la estructura intacta
        return text.substring(0, endPos);
      }

      function mostrarMenuQuantity() {
        mainMenu.style.display = 'none';
        quantityMenu.style.display = 'block';
        currentMenu = 'quantity';
        quantityMenuIndex = 0;
        actualizarTextoCantidad();
        actualizarSeleccionQuantityMenu();
      }
  
      function mostrarMenuPrincipal() {
        quantityMenu.style.display = 'none';
        mainMenu.style.display = 'block';
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
      }

      function iniciarMenu() {
        console.log("Iniciando menú");


        document.addEventListener('keydown', manejadorTeclas);
        animateCSS(".mainMenu", "flash");
        mainTitle.innerHTML = '<span style="color: red;">GAME OVER</span><br><br> ¿QUIERES <span style="color: lime">RESUCITAR</span> A CAMBIO DE <span style="color: yellow;">PALABRAS</span>?';
        mainMenu.style.display = 'block';
        mainTitle.style.display = 'block';
        buttonContainer.style.display = 'flex';
        currentMenu = 'main';
        mainMenuIndex = 0;
        actualizarSeleccionMainMenu();
        timeoutID_menu = setTimeout(() => {
            // Si seguimos en el menú (por ejemplo, no hubo otra acción), ejecuta el clic:
            console.log("Tiempo cumplido. Se hace clic automático en botón NO.");
            btnNo.click(); 
          }, 30000);
      }
  
      /*************************************************************
        EVENTOS DE CLICK PARA LOS BOTONES CON stopPropagation()
      **************************************************************/
      btnSi.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se active el listener global
        mostrarMenuQuantity();
      });
  
      btnNo.addEventListener('click', (evento) => {
        evento.stopPropagation();
        texto.innerText = texto_guardado;
        tiempo.style.color = "white";
        if (terminado == false) {
          final();
          setTimeout(function () {
            texto.style.height = "";
            texto.rows = "1";
            texto.style.display = "none";
            //texto.innerText = texto_guardado;
            
            tiempo.style.color = "white";
          }, 2000);
        }
        animateCSS(".tiempo", "bounceInLeft");
        tiempo.innerHTML = "¡GRACIAS POR JUGAR!";
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }

        document.removeEventListener('keydown', manejadorTeclas);
                
        // Lógica para finalizar el juego.
      });
      
  
      btnConfirmar.addEventListener('click', (evento) => {
        evento.stopPropagation();
        clearTimeout(timeoutID_menu);
        socket.emit("resucitar", {player: player, secs: palabras * PALABRAS_A_SEGUNDOS});

        // Recortar las últimas "palabras" de "texto_guardado"
        console.log("texto_guardado", palabras);
        console.log("texto_guardado", texto_guardado);

        texto_guardado = recortarUltimasPalabras(texto_guardado, palabras);

        console.log("texto_guardado", texto_guardado);

        // Ocultar los menús para que no se vean más
        resucitar()
        mainMenu.style.display = 'none';
        quantityMenu.style.display = 'none';
        mainTitle.style.display = 'none';
        buttonContainer.style.display = 'none';
        
        document.removeEventListener('keydown', manejadorTeclas);

        post_inicio(false)
      });
  
      btnAtras.addEventListener('click', (evento) => {
        evento.stopPropagation();
        mostrarMenuPrincipal();
      });
  
      /*************************************************************
        EVENTO DE TECLAS: FLECHAS Y ENTER
      **************************************************************/
      // Definimos la función manejadora de eventos de teclado.
function manejadorTeclas(evento) {
    evento.stopPropagation();
    if (currentMenu === 'main') {
      switch (evento.key) {
        case 'ArrowLeft':
          mainMenuIndex = 0;
          actualizarSeleccionMainMenu();
          break;
        case 'ArrowRight':
          mainMenuIndex = 1;
          actualizarSeleccionMainMenu();
          break;
        default:
          break;
      }
    } else if (currentMenu === 'quantity') {
      switch (evento.key) {
        case 'ArrowLeft':
          quantityMenuIndex--;
          if (quantityMenuIndex < 0) {
            quantityMenuIndex = quantityMenuElements.length - 1; 
          }
          actualizarSeleccionQuantityMenu();
          break;
        case 'ArrowRight':
          quantityMenuIndex++;
          if (quantityMenuIndex >= quantityMenuElements.length) {
            quantityMenuIndex = 0;
          }
          actualizarSeleccionQuantityMenu();
          break;
        case 'ArrowUp':
          if (quantityMenuIndex === 0) {
            palabras++;
            actualizarTextoCantidad();
          }
          break;
        case 'ArrowDown':
          if (quantityMenuIndex === 0 && palabras > 1) {
            palabras--;
            actualizarTextoCantidad();
          }
          break;
        case 'Enter':
          if (quantityMenuIndex === 1) {
            btnConfirmar.click();
          } else if (quantityMenuIndex === 2) {
            btnAtras.click();
          }
          break;
        default:
          break;
      }
    }
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
            recibir_palabra()
            addSeconds(tiempo_palabras_bonus)
            feedback.innerHTML = "⏱️+" + tiempo_palabras_bonus + " segs.";
            clearTimeout(delay_animacion);
            color = color_positivo;
            feedback.style.color = color;
            tiempo_feed = "⏱️+" + tiempo_palabras_bonus + " segs.";
            insp = false;
            if (definicion.innerHTML.startsWith("<span style=\"color:lime;\">MUSA</span>:")) {
                insp = true;
            }            
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
        }
    }
}

/**
 * Función que se ejecuta al producirse un cambio en el contenido (evento "input")
 * en el que se inserta texto. Si se detecta que se ha insertado la letra prohibida,
 * se elimina ese carácter inmediatamente.
 *
 * Se asume que:
 * - toNormalForm(letra) normaliza la letra para comparar sin acentos u otras diferencias.
 * - letra_prohibida es la letra prohibida (en minúscula).
 * - addSeconds(valor), puntos, puntos_, feedback, color_negativo, delay_animacion y animateCSS()
 *   son parte de la lógica para actualizar la UI y dar feedback.
 */
function modo_letra_prohibida(e) {
  console.log("edata", e)
  // Solo procesamos inserciones de texto
  if (e.inputType === "insertText" && e.data) {
      // Obtenemos la letra insertada usando e.data
      let letra = e.data;
      
      // Comprobamos si la letra (normalizada) coincide con la letra prohibida
      if (
          toNormalForm(letra) === letra_prohibida || 
          toNormalForm(letra) === letra_prohibida.toUpperCase()
      ) {
          // La letra está prohibida, así que la eliminamos manualmente.
          // Suponemos que el contenido se ha modificado y el cursor se posiciona justo
          // después del carácter insertado. Entonces, borramos el carácter anterior al cursor.
          let sel = window.getSelection();
          if (sel.rangeCount > 0) {
              let range = sel.getRangeAt(0);
              // Comprobamos que el nodo de la selección sea un nodo de texto
              // y que haya al menos un carácter antes del cursor.
              if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
                  // Creamos un rango auxiliar que abarque únicamente el carácter insertado
                  let node = range.startContainer;
                  let offset = range.startOffset;
                  let newRange = document.createRange();
                  newRange.setStart(node, offset - 1);
                  newRange.setEnd(node, offset);
                  // Borramos ese carácter
                  newRange.deleteContents();
                  // Colapsamos la selección al nuevo punto (donde se borró la letra)
                  range.collapse(true);
                  sel.removeAllRanges();
                  sel.addRange(range);
              }
          }
          
          // Actualizamos la UI y damos feedback negativo (por ejemplo, descontamos tiempo)
          addSeconds(-2);
          puntos.innerHTML = puntos_ + " palabras";
          feedback.style.color = color_negativo;
          feedback.innerHTML = "⏱️-2 segs.";
          clearTimeout(delay_animacion);
          animateCSS(".feedback1", "flash").then((message) => {
              delay_animacion = setTimeout(function () {
                  feedback.innerHTML = "";
              }, 2000);
          });
      }
  }
}

/**
 * Función principal: Detectar si el usuario ha escrito la frase final
 */
function modo_frase_final(e) {
    // Obtenemos el texto completo del elemento
    let textContent = e.target.innerText;
    // Convertimos a minúsculas y recortamos espacios (opcional pero recomendable):
    let textLower = textContent.trim().toLowerCase();
  
    // Definimos la frase final, también en minúscula y sin espacios sobrantes
    let fraseFinal = str_frase_final.trim().toLowerCase();
  
    // Revisamos si el texto termina exactamente con esa frase final:
    if (textLower.endsWith(fraseFinal)) {
      // Aquí va tu lógica de finalización
      e.target.innerText = textContent.trim() + ".";
      final();
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
      addSeconds(-2)
      puntos.innerHTML = puntos_ + " palabras";
      
      feedback.style.color = color_negativo;
      feedback.innerHTML = "⏱️-2 segs.";
      clearTimeout(delay_animacion);
      animateCSS(".feedback1", "flash").then((message) => {
        delay_animacion = setTimeout(function () {
          feedback.innerHTML = "";
        }, 2000);
      });
    }
  }
  
// Esta función se llama cuando se produce un input (antes de que se modifique el contenido)
// y se utiliza para procesar tanto inserciones como borrados.
function modo_letra_bendita(e) {
    // Si el evento ya ha sido procesado, salimos
    if (e.defaultPrevented) {
        console.log('Evento ya procesado');
        return;
    }

    // Obtenemos la selección y el rango actual en el documento
    let sel = window.getSelection();
    if (!sel.rangeCount) return;
    let range = sel.getRangeAt(0);
    let node = sel.anchorNode;

    // Comprobamos el tipo de acción que se va a realizar según la propiedad inputType
    // Para borrado (retroceso)
    if (e.inputType === "deleteContentBackward") {
        console.log('Backspace detectado');
        console.log('Node:', node);
        console.log('Parent Node:', node ? node.parentNode : null);
        console.log('Parent Node class:', node && node.parentNode ? node.parentNode.className : 'No parent node');
        console.log('Focus Offset:', sel.focusOffset);

        // Si se cumple la condición de que el nodo pertenece a un span con la clase "letra-verde"
        // y el cursor está al inicio, prevenimos la acción por defecto y ejecutamos nuestra lógica
        if (node && node.parentNode && node.parentNode.className === 'letra-verde' && sel.focusOffset === 0) {
            e.preventDefault(); // Prevenir el borrado automático
            addSeconds(-2);
            // Feedback visual negativo
            feedback.style.color = color_negativo;
            feedback.innerHTML = "⏱️-1 segs.";
            addSeconds(-1);
            clearTimeout(delay_animacion);
            animateCSS(".feedback1", "flash").then((message) => {
                delay_animacion = setTimeout(function () {
                    feedback.innerHTML = "";
                }, 2000);
            });
            // Aquí se podría enviar feedback vía Socket.io, por ejemplo.
        }
        return; // Salir si se ha procesado el borrado
    }

    // Para inserción de texto
    if (e.inputType === "insertText") {
        // e.data contiene el carácter que se va a insertar
        let letra = e.data;
        // Si se inserta un único carácter, lo procesamos
        if (letra && letra.length === 1) {
            // Comprobamos si la letra corresponde a la "letra bendita"
            if ((toNormalForm(letra) === letra_bendita || toNormalForm(letra) === letra_bendita.toUpperCase()) ||
                (letra_bendita === "ñ" && (letra === letra_bendita || letra === letra_bendita.toUpperCase()))) {
                // Prevenimos la acción por defecto para controlar la inserción manualmente
                e.preventDefault();
                console.log('Se procesa letra bendita');

                // Creamos un nodo de texto con la letra
                let textNode = document.createTextNode(letra);
                // Creamos un elemento span para darle estilo (clase "letra-verde")
                let span = document.createElement("span");
                span.className = "letra-verde";
                span.appendChild(textNode);

                // Creamos nodos de texto vacíos para facilitar el posicionamiento
                let emptyTextNodeBefore = document.createTextNode("");
                let emptyTextNodeAfter = document.createTextNode("");

                // Insertamos los nodos en la posición actual del cursor
                range.insertNode(emptyTextNodeBefore);
                range.insertNode(span);
                range.insertNode(emptyTextNodeAfter);

                // Ajustamos el rango para posicionar el cursor adecuadamente
                range.setStartBefore(emptyTextNodeBefore);
                range.setEndBefore(emptyTextNodeBefore);
                sel.removeAllRanges();
                sel.addRange(range);

                // Actualizamos el tiempo y la visualización de puntos según la lógica del juego
                addSeconds(-2);
                puntos.innerHTML = puntos_ + " palabras";
                console.log(puntos);

                // Feedback visual positivo
                feedback.style.color = color_positivo;
                feedback.innerHTML = "⏱️+2 segs.";
                addSeconds(+2);
                clearTimeout(delay_animacion);
                animateCSS(".feedback1", "flash").then((message) => {
                    delay_animacion = setTimeout(function () {
                        feedback.innerHTML = "";
                    }, 2000);
                });

                // Aquí se podría enviar feedback vía Socket.io
            } else {
                // Si la letra no es la "letra bendita" y el nodo actual es parte de un span "letra-verde"
                if (node && node.parentNode && node.parentNode.className === 'letra-verde') {
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
    }
    // Se pueden añadir otros casos según se necesiten para otros tipos de input (por ejemplo, pegado de texto).
}
function nueva_letra_bendita(){
    indice_letra_bendita = Math.floor(Math.random() * letras_benditas_restantes.length);
    letra_bendita = letras_benditas_restantes[indice_letra_bendita]
    letras_benditas_restantes.splice(indice_letra_bendita, 1);
    if(letras_benditas_restantes.length == 0){
        letras_benditas_restantes = [...letras_benditas];
    }
    console.log("LETRA BENDITA", letra_bendita)
    nueva_letra(letra_bendita)
    listener_cambio_letra_palabra = setTimeout(nueva_letra_bendita, TIEMPO_CAMBIO_LETRA);
}

function nueva_letra_prohibida(){
    indice_letra_prohibida = Math.floor(Math.random() * letras_prohibidas_restantes.length);
    letra_prohibida = letras_prohibidas_restantes[indice_letra_prohibida]
    letras_prohibidas_restantes.splice(indice_letra_prohibida, 1);
    if(letras_prohibidas_restantes.length == 0){
        letras_prohibidas_restantes = [...letras_prohibidas];
    }
    nueva_letra(letra_prohibida)
    listener_cambio_letra_palabra = setTimeout(nueva_letra_prohibida, TIEMPO_CAMBIO_LETRA);
}

function modo_psicodélico() {
    stylize();
}


// Función que inicia el temporizador para una duración determinada
function temp_modos() {

    modo_anterior = modo_actual;
    modo_actual = modos_restantes[0];
    modos_restantes.splice(0, 1);
    console.log(modo_actual)
    MODOS[modo_actual]("");

    // Reiniciar la variable de contador
    secondsPassed = 0;
    
    // Crear un intervalo que se ejecute cada segundo (1000 ms)
    intervaloID_temp_modos = setInterval(() => {
    secondsPassed++;  // Incrementar el contador cada segundo
    console.log(`Segundos pasados: ${secondsPassed}`);
    console.log(modo_actual)
    console.log(modo_anterior)
    console.log(modos_restantes)
    console.log(secondsPassed >= TIEMPO_CAMBIO_MODOS)
    console.log(secondsPassed)
    console.log(TIEMPO_CAMBIO_MODOS)

      // Verificar si se alcanzó la duración deseada y reiniciar
      if (secondsPassed >= TIEMPO_CAMBIO_MODOS/1000) {
        if(modo_actual == "frase final"){
            final()
            fin_del_juego = true;
            clearInterval(intervaloID_temp_modos);
            LIMPIEZAS[modo_actual]("");
            modos_restantes = [...LISTA_MODOS];
            modo_anterior = "";
            modo_actual = "";
        }
        else{
        secondsPassed = 0;  // Reiniciar el contador a 0
        
        LIMPIEZAS[modo_actual]("");

        modo_anterior = modo_actual;
        modo_actual = modos_restantes[0];
        modos_restantes.splice(0, 1);
        
        
        MODOS[modo_actual]("");

        console.log(modo_actual)
        console.log(modo_anterior)
        console.log(modos_restantes)
        console.log(modos_restantes.length)
        console.log('Se alcanzó el tiempo límite. Reiniciando temporizador.');
        }
        
        // Si se requiere alguna acción adicional al reiniciar, colócala aquí
      }
    }, 1000);
  }

function limpieza(){
    clearInterval(countInterval);
    clearInterval(intervaloID_temp_modos)
    pararEscritura = true;
    clearTimeout(timeoutID_menu)
    stopConfetti();
    clearTimeout(listener_cuenta_atras);
    clearInterval(timer);  
    clearTimeout(sub_timer);
    document.body.classList.remove("bg");
    document.body.classList.remove("rain");
    lightning.classList.remove("lightning");
    console.log(texto.innerHTML)
    if(temp_text_inverso_activado == true){
        temp_text_inverso_activado = false;
        clearTimeout(tempo_text_inverso);
        procesarTexto();
    }

    texto.innerText = "";
    texto.style.display = "";
    texto.style.height = "";
    if (window.innerWidth <= 800) {
        texto.style.maxHeight = "2em";
    }
    else{
        texto.style.maxHeight = "calc(1.5em * 2)";

    }
    texto.rows =  "6";
    definicion.style.fontSize = "1.5vw";
    temas.innerHTML = "";
    temas.display = "";
    texto.contentEditable= "false";
    puntos.innerHTML = 0 + " palabras";
    palabra.innerHTML = "";
    definicion.innerHTML = "";
    explicación.innerHTML = "";
    menu_modificador = false;
    focusedButtonIndex = 0;
    modificadorButtons = [];
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
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
    animateCSS(".botones", "backOutLeft").then((message) => {
        btnOpciones.style.display = "";
        btnEscribir.style.display = "";
        btnDescargarTexto.style.display = "" 
        btnFinal.style.display = "none"
        btnPantallaCompleta.style.display = "" 
        animateCSS(".botones", "backInLeft")
    });

    clearTimeout(timeoutID_menu);
    clearInterval(countInterval);
    clearInterval(intervaloID_temp_modos);
    clearInterval(listener_cambio_letra_palabra)
    confetti_aux();
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
    texto.contentEditable= "false";
    //texto.style.display = "none";
    tiempo.style.display="none"
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
    // Impide que se pueda escribir en los dos textos.
    texto.contentEditable= "false";

    // Variable booleana que dice si la ronda ha terminado o no.
    terminado = true;
    
    console.log("ES EL FINAL")
    texto.style.maxHeight = "none";
    texto.style.height = "auto";
    texto.style.height = texto.scrollHeight + "px"; //Reajustamos el tamaño del área de texto del j1.
    //texto.style.display = "none";
    
    animateCSS(".cabecera", "backInLeft").then((message) => {
        animateCSS(".contenedor", "pulse");
    });
    logo.style.display = "";
    neon.style.display = "";
    mainMenu.style.display = 'none';
    quantityMenu.style.display = 'none';
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

 // Función que invierte las letras de cada palabra pero NO el orden de las palabras.
 function invertirPalabras(texto) {
    return texto
      .split(' ')                         // Separa por espacios
      .map(palabra => palabra.split('').reverse().join('')) 
      .join(' ');
  }

  /**
   * Función recursiva que:
   * - Invierne el contenido de los nodos de texto
   * - Clona y procesa los nodos de tipo elemento para preservar estructura e hijos
   */
  function procesarNodo(nodo) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      // Si es un nodo de texto, lo invertimos
      const textoInvertido = invertirPalabras(nodo.textContent);
      return document.createTextNode(textoInvertido);

    } else if (nodo.nodeType === Node.ELEMENT_NODE) {
      // Clonamos el nodo (pero sin hijos) para preservar etiquetas y atributos (estilos, clases, etc.)
      const nuevoNodo = nodo.cloneNode(false);

      // Recorremos los hijos originales y los procesamos recursivamente
      nodo.childNodes.forEach(child => {
        // Insertamos en el clon el resultado de procesar cada hijo
        nuevoNodo.appendChild(procesarNodo(child));
      });

      return nuevoNodo;
    }

    // Si quisieras manejar comentarios u otro tipo de nodos,
    // podrías añadir más condiciones. Si no, simplemente retorna el nodo tal cual.
    return nodo.cloneNode(true);
  }

  function procesarTexto() {
    console.log("ESTO NO PARAAAAAAAAAAA")
    // El contenedor original
    // Creamos un fragmento para ir colocando los nodos procesados
    const fragmento = document.createDocumentFragment();

    // Recorremos los childNodes del div con id="texto"
    texto.childNodes.forEach(nodo => {
      // Procesamos cada nodo (ya sea texto o elemento) y lo añadimos al fragmento
      fragmento.appendChild(procesarNodo(nodo));
    });

    // Limpiamos el contenido original y lo reemplazamos con el fragmento procesado
    texto.innerHTML = "";
    texto.appendChild(fragmento);
  }

function efectoMaquinaDeEscribir(elemento, textoHtml, velocidad = 50) {
  // Reiniciar la bandera al inicio para permitir nuevas ejecuciones
  pararEscritura = false;

  // Asegurar salto de línea inicial si el contenido actual no termina con <br>
  let contenidoInicial = elemento.innerHTML.trim(); // Limpiamos espacios innecesarios
  if (!contenidoInicial.endsWith("<br>")) {
    contenidoInicial += "<br>"; // Añadimos un salto de línea si no está presente
  }

  let contenidoEscrito = contenidoInicial; // Inicializamos con el contenido previo
  let cursor = 0;                          // Índice para recorrer el texto

  // Añadir los saltos de línea adicionales al texto
  textoHtml = "<br>" + textoHtml + "<br><br>";

  // Desactiva la edición temporal
  elemento.contentEditable = "false";

  // ---- Función para colocar el cursor justo al final ----
  function colocarCursorAlFinal(elem) {
    const range = document.createRange();
    const sel = window.getSelection();

    let ultimoNodo = elem.lastChild;
    while (ultimoNodo && ultimoNodo.nodeType !== 3 && ultimoNodo.lastChild) {
      ultimoNodo = ultimoNodo.lastChild;
    }

    if (ultimoNodo && ultimoNodo.nodeType === 3) {
      range.setStart(ultimoNodo, ultimoNodo.textContent.length);
      range.setEnd(ultimoNodo, ultimoNodo.textContent.length);
    } else if (elem.lastChild) {
      range.setStartAfter(elem.lastChild);
      range.setEndAfter(elem.lastChild);
    } else {
      range.setStart(elem, 0);
      range.setEnd(elem, 0);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ---- Función recursiva para escribir el texto ----
  function escribir() {
    // Verificar si se ha solicitado detener la escritura
    if (pararEscritura) {
      return; // Salimos de la función para detener la recursión
    }

    if (cursor < textoHtml.length) {
      // Detectamos etiquetas HTML para escribirlas completas de golpe
      if (textoHtml.substring(cursor).startsWith("<")) {
        const finEtiqueta = textoHtml.indexOf(">", cursor) + 1;
        contenidoEscrito += textoHtml.substring(cursor, finEtiqueta);
        cursor = finEtiqueta;
      } else {
        // Caso normal: añadimos un carácter
        contenidoEscrito += textoHtml.charAt(cursor);
        cursor++;
      }

      // Actualizamos el contenido en el elemento
      elemento.innerHTML = contenidoEscrito;
      elemento.scrollTop = elemento.scrollHeight;  // Scroll al final

      // Continuamos con un pequeño retraso
      setTimeout(escribir, velocidad);
    } else {
      // Cuando terminamos
      elemento.contentEditable = "true";          // Reactivamos edición
      colocarCursorAlFinal(elemento);            // Cursor al final
      elemento.focus();                          // Enfocamos el elemento
    }
    
  }

  // Inicia el proceso de escritura
  escribir();
}

// Función para detener el efecto de la máquina de escribir
function detenerEfectoMaquina() {
  pararEscritura = true;
}


function confetti_musas(){
var scalar = 2;
var unicorn = confetti.shapeFromText({ text: '⭐', scalar });
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

const textarea = texto;

/*document.addEventListener('DOMContentLoaded', function () {
    const gradientTop = document.getElementById('gradientTop');
    const gradientBottom = document.getElementById('gradientBottom');

    function updateGradients() {
        const scrollTop = textarea.scrollTop;
        const scrollHeight = textarea.scrollHeight;
        const clientHeight = textarea.clientHeight;

        if (scrollTop > 0) {
            gradientTop.style.opacity = '1';
        } else {
            gradientTop.style.opacity = '0';
        }

        if (scrollTop + clientHeight < scrollHeight) {
            gradientBottom.style.opacity = '1';
        } else {
            gradientBottom.style.opacity = '0';
        }
    }

    textarea.addEventListener('input', updateGradients);
    textarea.addEventListener('scroll', updateGradients);
    window.addEventListener('resize', updateGradients); // Añadido para manejar cambios de tamaño de la ventana

    // Inicialización de los gradientes al cargar la página
    updateGradients();
});*/

// Función auxiliar que dada una palabra devuelve una puntación de respecto de la frecuencia.
function puntuación_palabra(palabra) {
    palabra = palabra.toLowerCase();
    let puntuación = 0;
    if (palabra != null) {
        palabra = palabra.replace(/\s+/g, '')
        let longitud = palabra.length;
        string_unico(toNormalForm(palabra)).split("").forEach(letra => puntuación += frecuencia_letras[letra]);
        puntuación = Math.ceil((((10 - puntuación*0.5) + longitud * 0.1 * 30)) / 5) * 5
        if(isNaN(puntuación)){
            puntuación = 10;
        }
        return puntuación;
    }
    else return 10;
}

function string_unico(names) {
    string = "";
    ss = "";
    namestring = names.split("");

    for (j = 0; j < namestring.length; j++) {
        for (i = j; i < namestring.length; i++) {
            if (string.includes(namestring[i])) // if contains not work then  
                break;                          // use includes like in snippet
            else
                string += namestring[i];
        }
        if (ss.length < string.length)
            ss = string;
        string = "";
    }
    return ss;
}

function toNormalForm(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function getRandomSpanishWord() {
    try {
      // 1) Obtener página aleatoria con origin=*
      const randomUrl = 'https://es.wiktionary.org/w/api.php?action=query&list=random&rnlimit=1&rnnamespace=0&format=json&origin=*';
      const randomRes = await fetch(randomUrl);
      const randomData = await randomRes.json();
      
      if (!randomData.query.random[0]) {
        throw new Error('No se obtuvo página aleatoria');
      }

      const title = randomData.query.random[0].title;
      console.log('Título aleatorio:', title);

      // 2) Consultar el HTML parseado de esa página
      const parseUrl = `https://es.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
      const parseRes = await fetch(parseUrl);
      const parseData = await parseRes.json();
      
      if (!parseData.parse) {
        throw new Error('No se pudo parsear la página');
      }

      // 3) Obtenemos la cadena HTML embebida
      const html = parseData.parse.text['*'];

      // 4) Parsear el HTML con DOMParser (nativo del navegador)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Buscamos el primer <dd> dentro de <dl>
      let definicionDD = doc.querySelector('dl > dd');
      // En caso de no existir <dd>, buscamos el primer <li> en .mw-parser-output
      if (!definicionDD) {
        definicionDD = doc.querySelector('div.mw-parser-output li');
      }

      let definicion = definicionDD ? definicionDD.textContent.trim() : 'Sin definición encontrada';

      // Eliminar cualquier estilo incrustado si lo hubiera
      // (en DOMParser, por fortuna, el <style> no suele mezclarse con textContent, 
      //  pero si quieres asegurarte de quitar estilos, puedes hacer algo como:
      doc.querySelectorAll('style').forEach(st => st.remove());
      definicion = definicion.replace(/\.mw-parser-output\s*\.[\s\S]+?\}/g, '').trim();

      // Mostrar en consola
      console.log('Definición encontrada:\n', definicion);

      // Retornar un objeto con la info
      return { title, definicion };

    } catch (err) {
      console.error('Error en getRandomSpanishWord:', err);
      return null;
    }
  }

  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

