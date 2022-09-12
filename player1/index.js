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
let activar_palabras = false; // Variable booleana que activa las palabras bonus.
let puntuacion = 0; //Variable entera que almacena la puntuación de la palabra bonus.
let delay_animacion;
let envio_puntos;
var socket = io('https://scriptbe.herokuapp.com/');

// Función que aumenta de tamaño el texto del jugador 1 cuando el jugador 1 escribe  enter en el texto.

function process(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode
        window.scrollTo(0, document.body.scrollHeight); 
        (window).on('scroll', onScroll); 
    }
}

// Función que aumenta de tamaño el texto del jugador 1 cuando el jugador 1 escribe cualquier carácter en el texto.

function auto_grow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight)+"px";
    window.scrollTo(0, document.body.scrollHeight);
    (window).on('scroll', onScroll); 

}

// Función que comienza a borrar el texto con una velocidad y un inicio variable a lo largo de cada ronda.

function borrar(obj){
    if(terminado == true){
        clearTimeout(borrado)
        clearTimeout(cambio_palabra);
        document.getElementById("texto").classList.remove('textarea_blur');
        document.getElementById("texto1").classList.remove('textarea_blur');
        blurreado = false
    }
    else if(!modo_texto_inverso){
        /*if(Math.abs(puntos_mios- puntos_enem)==300){
            document.getElementById("texto1").classList.remove('textarea_blur');
            document.getElementById("texto").classList.remove('textarea_blur');
        }*/
        document.getElementById("texto").value = (document.getElementById("texto").value).substring(0, document.getElementById("texto").value.length -1);
        document.getElementById("puntos").innerHTML = obj.value.length + puntos_palabra+' puntos';
        let  editor = getEl("texto");
        let puntos = getEl("puntos");
        let nivel = getEl("nivel");
        let text = editor.value;
        let points = puntos.textContent;
        let level = nivel.textContent;
        var socket = io('https://scriptbe.herokuapp.com/');
        socket.emit('texto1',{text, points, level});

        if( 249 == obj.value.length){
            document.getElementById("nivel").innerHTML ='nivel 0';
            rapidez_inicio_borrado = 3000
            rapidez_borrado = 3000;
        }
        if( 250 == obj.value.length){
            document.getElementById("nivel").innerHTML ='nivel 1';
            document.getElementById("palabra").innerHTML ='';
            rapidez_inicio_borrado = 1800
            rapidez_borrado = 1800;
        }
        if( 500 == obj.value.length){
            document.getElementById("nivel").innerHTML ='nivel 2';
            asignada = false
        }
        if( 750 == obj.value.length){
            document.getElementById("nivel").innerHTML ='nivel 3';
            rapidez_borrado = 1200;
            rapidez_inicio_borrado = 1200;
        }
        if( 1000 == obj.value.length){
            document.getElementById("nivel").innerHTML ='nivel 4';
            rapidez_borrado = 500;
            rapidez_inicio_borrado = 500;
        }
        borrado = setTimeout(() => {  borrar(obj)}, rapidez_borrado);
        }      
}

//Función que modifica el comportamiento del juego cuando 
function countChars(obj){
    if (terminado == true) {
        clearTimeout(borrado);
        clearTimeout(cambio_palabra);
        document.getElementById("texto1").classList.remove('textarea_blur');
        document.getElementById("texto").classList.remove('textarea_blur');
        blurreado = false
    }
    else{
        /*if(Math.abs(puntos_mios- puntos_enem)==300){
            document.getElementById("texto1").classList.remove('textarea_blur');
            document.getElementById("texto").classList.remove('textarea_blur');
        }*/
    document.getElementById("puntos").innerHTML = obj.value.length+ puntos_palabra+ ' puntos';
    if(obj.value.length < 250){
        document.getElementById("nivel").innerHTML ='nivel 0';
        rapidez_borrado = 3000;
        rapidez_inicio_borrado = 3000
    }
    

    if(modo_letra_prohibida == true){
        clearTimeout(delay_animacion)
        if((toNormalForm(document.getElementById("texto").value).charAt((document.getElementById("texto").value).length - 1)) == letra_prohibida || (toNormalForm(document.getElementById("texto").value).charAt((document.getElementById("texto").value).length - 1)) == letra_prohibida.toUpperCase()){
            document.getElementById("texto").value = (document.getElementById("texto").value).substring(0, document.getElementById("texto").value.length -1);
            puntos_palabra = puntos_palabra - 50;
            document.getElementById("puntos").innerHTML = obj.value.length+ puntos_palabra+ ' puntos';
            var feedback = document.querySelector(".feedback1")
            feedback.style.color = "red";
            feedback.innerHTML = "-50 pts";
            /*feedback.classList.add('animate__animated', 'animate__bounceInLeft');
            feedback.addEventListener('animationend', () => {
                feedback.classList.remove('animate__animated', 'animate__bounceInLeft');
                feedback.classList.add('animate__animated', 'animate__bounceOutRight');
                feedback.addEventListener('animationend', () => {
                    feedback.classList.remove('animate__animated', 'animate__bounceOutRight');
                  });
              });*/
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

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
  });
  var socket = io('https://scriptbe.herokuapp.com/');
  let envio_puntos = -50;
  let color = "red";
  socket.emit('feedback_de_j1', {color, envio_puntos});
              animateCSS(".feedback1", "bounceInLeft");
              animateCSS('.feedback1', 'bounceInLeft').then((message) => {
                delay_animacion = setTimeout(function(){
                    feedback.innerHTML = "";
                }, 2000);
              });
              


        }
    }
    if(asignada == true){
        if(document.getElementById("texto").value.substring(indice_buscar_palabra, document.getElementById("texto").value.length -1 ).toLowerCase().includes(palabra_actual)){
            asignada = false;
            var socket = io('https://scriptbe.herokuapp.com/');
            socket.emit('nueva_palabra', true);
            puntos_palabra = puntos_palabra + puntuacion;
            document.getElementById("puntos").innerHTML =obj.value.length+ puntos_palabra+' puntos';
            var feedback = document.querySelector(".feedback1")
            feedback.style.color = "green";
            feedback.innerHTML = "+"+puntuacion +" pts";
            /*feedback.classList.add('animate__animated', 'animate__bounceInLeft');
            feedback.addEventListener('animationend', () => {
                feedback.classList.remove('animate__animated', 'animate__bounceInLeft');
                feedback.classList.add('animate__animated', 'animate__bounceOutRight');
                feedback.addEventListener('animationend', () => {
                    feedback.classList.remove('animate__animated', 'animate__bounceOutRight');
                  });
              });*/
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

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
  });
  var socket = io('https://scriptbe.herokuapp.com/');
  let color = "green";
  envio_puntos = "+"+puntuacion;
  socket.emit('feedback_de_j1', {color,envio_puntos});
            clearTimeout(delay_animacion);
              animateCSS(".feedback1", "bounceInLeft");
              animateCSS('.feedback1', 'bounceInLeft').then((message) => {
                delay_animacion = setTimeout(function(){
                    feedback.innerHTML = "";
                }, 2000);
              });
              

        }
    }
    if(obj.value.length == 250){
        document.getElementById("nivel").innerHTML ='nivel 1';
        rapidez_borrado = 1800;
        rapidez_inicio_borrado = 1800;
    }
    
    if( obj.value.length == 499){
        document.getElementById("nivel").innerHTML ='nivel 1';
        asignada = false
          
    }
    if(obj.value.length ==  500){
        
        document.getElementById("nivel").innerHTML ='nivel 2';    
    }

    if(obj.value.length == 750){
        document.getElementById("nivel").innerHTML ='nivel 3';
        rapidez_borrado = 1200;
        rapidez_inicio_borrado = 1200;
    }
    if( obj.value.length == 749){
        document.getElementById("nivel").innerHTML ='nivel 2';
        rapidez_borrado = 1800;
        rapidez_inicio_borrado = 1800;
    }
    if(obj.value.length == 1000){
        document.getElementById("nivel").innerHTML ='nivel 4';
        rapidez_borrado = 500;
        rapidez_inicio_borrado = 500;
    }
    if( obj.value.length == 999){
        document.getElementById("nivel").innerHTML ='nivel 3';
        rapidez_borrado = 1200;
        rapidez_inicio_borrado = 1200;
    }
    clearTimeout(borrado)
    borrado = setTimeout(
        function() {
                borrar(obj)
        },
    rapidez_inicio_borrado);
}
}

function toNormalForm(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
