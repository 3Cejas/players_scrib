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
// Función que aumenta de tamaño el texto del jugador 2 cuando el jugador 2 escribe  enter en el texto.

function process(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode
        window.scrollTo(0, document.body.scrollHeight); 
        (window).on('scroll', onScroll); 
    }
}

// Función que aumenta de tamaño el texto del jugador 2 cuando el jugador 2 escribe cualquier carácter en el texto.

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
        blurreado = false;
    }
    else if(!modo_texto_inverso){
        /*if(Math.abs(puntos_mios- puntos_enem)==300 && !blurreado){
            document.getElementById("texto1").classList.remove('textarea_blur');
            document.getElementById("texto").classList.remove('textarea_blur');
        }*/
        document.getElementById("texto1").value = (document.getElementById("texto1").value).substring(0, document.getElementById("texto1").value.length -1);
        document.getElementById("puntos1").innerHTML = obj.value.length + puntos_palabra+' puntos';
        var socket = io('http://localhost:3000');
        let  editor1 = getEl("texto1");
        let puntos1 = getEl("puntos1");
        let nivel1 = getEl("nivel1");
        let text1 = editor1.value;
        let points1 = puntos1.textContent;
        let level1 = nivel1.textContent;
        let height = editor1.style.height;
        socket.emit('texto2',{text1, points1, level1,height})
        if( 249 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 0';
            rapidez_inicio_borrado = 3000
            rapidez_borrado = 3000;
        }
        if( 250 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 1';
            document.getElementById("palabra1").innerHTML ='';
            rapidez_inicio_borrado = 1800
            rapidez_borrado = 1800;
        }
        if( 500 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 2';
            asignada = false
        }
        if( 750 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 3';
            rapidez_borrado = 1200;
            rapidez_inicio_borrado = 1200;
        }
        if( 1000 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 4';
            rapidez_borrado = 500;
            rapidez_inicio_borrado = 500;
        }
        borrado = setTimeout(() => {  borrar(obj)}, rapidez_borrado);
        }       
}

//Función que modifica el comportamiento del juego.

function countChars(obj){
    if (terminado == true) {
        clearTimeout(borrado)
        clearTimeout(cambio_palabra);
        document.getElementById("texto").classList.remove('textarea_blur');
        document.getElementById("texto").classList.remove('textarea_blur');
        blurreado = false;
    }
    else{
        /*if(Math.abs(puntos_mios- puntos_enem)==300 && !blurreado){
            document.getElementById("texto1").classList.remove('textarea_blur');
            document.getElementById("texto").classList.remove('textarea_blur');
        }*/

    document.getElementById("puntos1").innerHTML = obj.value.length+ puntos_palabra+ ' puntos';
    if(obj.value.length < 250){
        document.getElementById("nivel1").innerHTML ='nivel 0';
        rapidez_borrado = 3000;
        rapidez_inicio_borrado = 3000
    }

    if(modo_letra_prohibida == true){
        if((toNormalForm(document.getElementById("texto1").value).charAt((document.getElementById("texto1").value).length - 1)) == letra_prohibida || (toNormalForm(document.getElementById("texto1").value).charAt((document.getElementById("texto1").value).length - 1)) == letra_prohibida.toUpperCase()){
            document.getElementById("texto1").value = (document.getElementById("texto1").value).substring(0, document.getElementById("texto1").value.length -1);
            puntos_palabra = puntos_palabra - 50;
            var feedback = document.querySelector(".feedback2")
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
  var socket = io('http://localhost:3000');
  socket.emit('feedback_de_j2', -50);
            clearTimeout(delay_animacion)
              animateCSS(".feedback2", "bounceInRight");
              animateCSS('.feedback2', 'bounceInRight').then((message) => {
                delay_animacion = setTimeout(function(){
                    feedback.innerHTML = "";
                }, 2000);
              });
              


        
        }
    }
    if(asignada == true){
        if(document.getElementById("texto1").value.substring(indice_buscar_palabra, document.getElementById("texto1").value.length -1 ).toLowerCase().includes(palabra_actual)){
            asignada = false;
            var socket = io('http://localhost:3000');
            socket.emit('nueva_palabra', asignada);
            puntos_palabra = puntos_palabra + puntuacion;
            document.getElementById("puntos1").innerHTML =obj.value.length+ puntos_palabra+' puntos';
            var feedback = document.querySelector(".feedback2")
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
  var socket = io('http://localhost:3000');
  socket.emit('feedback_de_j2', puntuacion);
              animateCSS(".feedback2", "bounceInRight");
              animateCSS('.feedback2', 'bounceInRight').then((message) => {
                delay_animacion = setTimeout(function(){
                    feedback.innerHTML = "";
                }, 2000);
              });
              

        }

        
    }

    if(obj.value.length == 250){
        document.getElementById("nivel1").innerHTML ='nivel 1';
        rapidez_borrado = 1800;
        rapidez_inicio_borrado = 1800;
    }
    if( obj.value.length == 499){
        document.getElementById("nivel1").innerHTML ='nivel 1';
          
    }
    if(obj.value.length ==  500){
            document.getElementById("nivel1").innerHTML ='nivel 2';  
    }
    if(obj.value.length == 750){
        document.getElementById("nivel1").innerHTML ='nivel 3';
        rapidez_borrado = 1200;
        rapidez_inicio_borrado = 1200;
    }
    if( obj.value.length == 749){
        document.getElementById("nivel1").innerHTML ='nivel 2';
        rapidez_borrado = 1800;
        rapidez_inicio_borrado = 1800;
    }
    if(obj.value.length == 1000){
        document.getElementById("nivel1").innerHTML ='nivel 4';
        rapidez_borrado = 500;
        rapidez_inicio_borrado = 500;
    }
    if( obj.value.length == 999){
        document.getElementById("nivel1").innerHTML ='nivel 3';
        rapidez_borrado = 1200;
        rapidez_inicio_borrado = 1200;
    }
    clearTimeout(borrado)
    borrado = setTimeout(
        function() {
                borrar(obj)
                
                
            
        
    }, rapidez_inicio_borrado);
}
}

// Función recursiva temporal que es llamada para cambiar de palabra bonus cada 30 segundos.

function cambiar_palabra(){
    if(document.getElementById("tiempo").innerHTML == "¡Tiempo!" || document.getElementById("tiempo").innerHTML == "" ){
        clearTimeout(cambio_palabra);
    }
    else{
    cambio_palabra = setTimeout(
    function(){
        palabra_actual = lista_palabras[Math.floor(Math.random() * lista_palabras.length)]
        //var socket = io('http://localhost:3000');
        //socket.emit('envia_palabra2', palabra_actual);
        document.getElementById("palabra1").innerHTML ='(+50 pts) palabra: ' + palabra_actual;
        indice_buscar_palabra = document.getElementById("texto1").value.length -1
        asignada = true
        cambiar_palabra();
    }, 60000);
}
}

function toNormalForm(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}