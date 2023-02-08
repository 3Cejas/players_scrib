let borrado; // Variable que almacena el identificador de la función temporizada de borrado.
let rapidez_borrado = 3000; // Variable que almacena la velocidad del borrado del texto.
let rapidez_inicio_borrado = 3000; // Variable que almacena el tiempo de espera sin escribir hasta que empieza a borrar el texto.
let asignada = false; // Variable boolena que dice si hay una palabra bonus asignada.
let palabra_actual = ""; // Variable que almacena la palabra bonus actual.
let puntos_palabra = 0; // Variable que almacena los puntos obtenidos por meter palabras bonus.
let terminado = false; // Variable booleana que dice si la ronda ha terminado o no.
let countInterval; // Variable que almacena el identificador de la función que será ejecutada cada x segundos para uso para actualizar el contador.
let cambio_palabra; // Variable que almacena el identificador de la función temporizada de cambio de palabra.
let blurreado = false; // Variable booleana que si alguno de los dos textos ha sido blurreado.
let puntuacion = 0; // Variable entera que almacena la puntuación de la palabra bonus.
let puntos = 0; // Puntos del jugador 1.
let delay_animacion;
let envio_puntos;
//let saltos_línea_alineacion_1 = 0; // Variable entera que almacena los saltos de línea del jugador 1 para alínear los textos.
//let saltos_línea_alineacion_2 = 0; // Variable entera que almacena los saltos de línea del jugador 2 para alínear los textos.
const color_negativo = "red";
const color_positivo = "green";

// Función que aumenta de tamaño el texto del jugador 1 cuando el jugador 1 escribe cualquier carácter en el texto.
function auto_grow(element) {
    element.style.height = "5px";
    element.style.height = element.scrollHeight + "px";
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
      while (texto2.scrollHeight > texto1.scrollHeight) {
        saltos_línea_alineacion_1 += 1;
        texto1.innerText = "\n" + texto1.innerText;
      }
      texto1.style.height = texto2.scrollHeight + "px";
      texto2.style.height = texto2.scrollHeight + "px";
    } else {
      while (texto2.scrollHeight < texto1.scrollHeight) {
        saltos_línea_alineacion_2 += 1;
        texto2.innerText = "\n" + texto2.innerText;
      }
      texto1.style.height = texto1.scrollHeight + "px";
      texto2.style.height = texto1.scrollHeight + "px";
    }*/
    texto1.style.height = texto1.scrollHeight + "px";
    texto2.style.height = texto2.scrollHeight + "px";
    //window.scrollTo(0, document.body.scrollHeight);
    focalizador1.scrollIntoView({ block: "end" });
}

// Función que comienza a borrar el texto con una velocidad y un inicio variable a lo largo de cada ronda.
function borrar(texto) {
    if (!desactivar_borrar) {
        texto1.innerText = texto.innerText.substring(0, texto1.innerText.length - 1);
        subrayar_palabras_bonus();
        texto1.focus();
        setEndOfContenteditable(document.getElementById('texto'));
        puntos = texto1.innerText.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
        cambiar_color_puntuación();
        puntos1.innerHTML = puntos + " puntos";
        sendText();
        cambio_nivel(puntos);
        borrado = setTimeout(() => {
            borrar(texto);
        }, rapidez_borrado);
    }
}

//Función que modifica el comportamiento del juego.
function countChars(texto) {
    puntos = texto.innerText.length + puntos_palabra - puntos_letra_prohibida + puntos_letra_bendita;
    cambiar_color_puntuación();
    puntos1.innerHTML = puntos + " puntos";
    cambio_nivel(puntos);
    clearTimeout(borrado);
    var $div = $('#texto');
    $div.highlight(palabra_actual);
    borrado = setTimeout(function () {
        borrar(texto);
    }, rapidez_inicio_borrado);
}

//Función auxiliar que, dado un string, lo devuelve en su forma normal, es decir, sin acentos, diéresis y similares.
function toNormalForm(str) {
    return str
        .normalize("NFD")
        .replace(
            /([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,
            "$1"
        );
}

//Función auxiliar que cambia la rapidez y el inicio de borrado en función de la cantidad de caracteres escritos.
function cambio_nivel(caracteres) {
    if (0 <= caracteres && caracteres < 250) {
        nivel1.innerHTML = "nivel 0";
        rapidez_inicio_borrado = 3000;
        rapidez_borrado = 3000;
    }
    if (250 <= caracteres && caracteres < 500) {
        nivel1.innerHTML = "nivel 1";
        rapidez_inicio_borrado = 2500;
        rapidez_borrado = 2500;
    }
    if (500 <= caracteres && caracteres < 750) {
        nivel1.innerHTML = "nivel 2";
        rapidez_borrado = 1800;
        rapidez_inicio_borrado = 1800;
    }
    if (750 <= caracteres && caracteres < 1000) {
        nivel1.innerHTML = "nivel 3";
        rapidez_borrado = 1200;
        rapidez_inicio_borrado = 1200;
    }
    if (caracteres >= 1000) {
        nivel1.innerHTML = "nivel 4";
        rapidez_borrado = 500;
        rapidez_inicio_borrado = 500;
    }
}

//Función auxiliar para crear las animaciones del feedback.
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

    //Función auxiliar que focaliza el área de texto al final de ella.
function setEndOfContenteditable(contentEditableElement)
{
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    { 
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}

jQuery.fn.highlight = function(pat) {
    function innerHighlight(node, pat) {
     var skip = 0;
     if (node.nodeType == 3) {
      var pos = node.data.toUpperCase().indexOf(pat);
      pos -= (node.data.substr(0, pos).toUpperCase().length - node.data.substr(0, pos).length);
      if (pos >= 0) {
       var spannode = document.createElement('span');
       spannode.className = 'highlight';
       var middlebit = node.splitText(pos);
       var endbit = middlebit.splitText(pat.length);
       var middleclone = middlebit.cloneNode(true);
       spannode.appendChild(middleclone);
       middlebit.parentNode.replaceChild(spannode, middlebit);
       skip = 1;
      }
     }
     else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
      for (var i = 0; i < node.childNodes.length; ++i) {
       i += innerHighlight(node.childNodes[i], pat);
      }
     }
     return skip;
    }
    return this.length && pat && pat.length ? this.each(function() {
     innerHighlight(this, pat.toUpperCase());
    }) : this;
   };
   
   jQuery.fn.removeHighlight = function() {
    return this.find("span.highlight").each(function() {
     this.parentNode.firstChild.nodeName;
     with (this.parentNode) {
      replaceChild(this.firstChild, this);
      normalize();
     }
    }).end();
   };

function subrayar_palabras_bonus(){
    palabras_bonus.forEach(function(palabra){
        var $div = $('#texto');
        $div.highlight(palabra);
    });
}