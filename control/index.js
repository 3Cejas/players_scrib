let borrado
let rapidez_borrado = 3000
let rapidez_inicio_borrado = 3000
let palabras_objetivo = 99999999
let asignada = false
let palabra_actual = ""
let puntos_palabra = 0
let terminado = false
let countInterval

function process(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode
        window.scrollTo(0, document.body.scrollHeight); 
        (window).on('scroll', onScroll); 
    }
}
function auto_grow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight)+"px";
    window.scrollTo(0, document.body.scrollHeight);
    (window).on('scroll', onScroll); 

}

function borrar(obj){
    if(terminado == true){
        clearTimeout(borrado)
    }
    else{
        document.getElementById("texto").value = (document.getElementById("texto").value).substring(0, document.getElementById("texto").value.length -1);
        document.getElementById("puntos").innerHTML = obj.value.length + puntos_palabra+' puntos';
        var socket = io('http://localhost:3000');
        let  editor = getEl("texto");
        let puntos = getEl("puntos");
        let nivel = getEl("nivel");
        let palabra = getEl("palabra");
        let definicion2 = getEl("definicion");
        let text = editor.value;
        let points = puntos.textContent;
        let level = nivel.textContent;
        let word = palabra.textContent;
        let definicion = definicion2.textContent;
        socket.emit('texto1',{text, points, level, word, definicion2});
        if(palabras_objetivo-obj.value.length <= 0){
            document.getElementById("texto").disabled="true";
            document.getElementById("objetivo").innerHTML = "¡Terminado!";
            clearTimeout(borrado)
            terminado = true
            
        }
        else{
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
}

function countChars(obj){
    if (terminado == true) {
        clearTimeout(borrado)
    }
    else{
    document.getElementById("puntos").innerHTML = obj.value.length+ puntos_palabra+ ' puntos';
    if(palabras_objetivo-obj.value.length <= 0){
        document.getElementById("texto").disabled="true";
        document.getElementById("objetivo").innerHTML = "¡Terminado!";
        clearTimeout(borrado)
        terminado = true
        
    }
    if(obj.value.length < 250){
        document.getElementById("nivel").innerHTML ='nivel 0';
        rapidez_borrado = 3000;
        rapidez_inicio_borrado = 3000
    }
    if(obj.value.length == 250){
        document.getElementById("nivel").innerHTML ='nivel 1';
        rapidez_borrado = 1800;
        rapidez_inicio_borrado = 1800;
    }
    
    if( obj.value.length == 499){
        document.getElementById("palabra").innerHTML ='';
        document.getElementById("nivel").innerHTML ='nivel 1';
        asignada = false
          
    }
    if(obj.value.length ==  500){
        if(asignada == false && lista_palabras.length != 0){
            palabra_actual = lista_palabras[Math.floor(Math.random() * lista_palabras.length)]
            document.getElementById("palabra").innerHTML ='(+50 pts) palabra: ' + palabra_actual;
            indice_buscar_palabra = document.getElementById("texto").value.length -1
            document.getElementById("nivel").innerHTML ='nivel 2';
            asignada = true
        }
        if(lista_palabras.length == 0){
            document.getElementById("palabra").innerHTML ="¡WOW, terminaste las palabras!";
            asignada = false
        }
    
    }
    if(obj.value.length > 500){
        if(document.getElementById("texto").value.substring(indice_buscar_palabra, document.getElementById("texto").value.length -1 ).includes(palabra_actual)){
            if(asignada == true){
            puntos_palabra = puntos_palabra +50
            document.getElementById("puntos").innerHTML =obj.value.length+ puntos_palabra+' puntos';
            const index = lista_palabras.indexOf(palabra_actual);
            lista_palabras.splice(index, 1);
            }
            if(lista_palabras.length == 0){
                document.getElementById("palabra").innerHTML ="¡WOW, terminaste las palabras!";
                asignada = false
            }
            else{
            palabra_actual = lista_palabras[Math.floor(Math.random() * lista_palabras.length)]
            document.getElementById("palabra").innerHTML ='(+50 pts) palabra: ' + palabra_actual;
            indice_buscar_palabra = document.getElementById("texto").value.length -1
            }
        }
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
                
                
            
        
    }, rapidez_inicio_borrado);
}
}

let borrado1
let rapidez_borrado1 = 3000
let rapidez_inicio_borrado1 = 3000
let palabras_objetivo1 = 200
let lista_palabras1 = ["casa", "reloj", "montaña"]
let asignada1 = false
let palabra_actual1 = ""
let puntos_palabra1 = 0
let terminado1 = false


function process1(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode
        window.scrollTo(0, document.body.scrollHeight); 
        (window).on('scroll', onScroll); 
    }
}
function auto_grow1(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight)+"px";
    window.scrollTo(0, document.body.scrollHeight);
    (window).on('scroll', onScroll); 

}

function borrar1(obj){
    if(terminado1 == true){
        clearTimeout(borrado1)
    }
    else{
        document.getElementById("texto1").value = (document.getElementById("texto1").value).substring(0, document.getElementById("texto1").value.length -1);
        document.getElementById("puntos1").innerHTML = obj.value.length + puntos_palabra1+' puntos';
        var socket = io('http://localhost:3000');
        let  editor1 = getEl("texto1");
        let puntos1 = getEl("puntos1");
        let nivel1 = getEl("nivel1");
        let palabra1 = getEl("palabra1");
        let text1 = editor1.value;
        let points1 = puntos1.textContent;
        let level1 = nivel1.textContent;
        let word1 = palabra1.textContent;
        socket.emit('texto2',{text1, points1, level1, word1})
        if(palabras_objetivo-obj.value.length <= 0){
            document.getElementById("texto1").disabled="true";
            document.getElementById("objetivo1").innerHTML = "¡Terminado!";
            clearTimeout(borrado1)
            terminado1 = true
            
        }
        else{
        if( 99 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 0';
            rapidez_inicio_borrado1 = 3000
            rapidez_borrado1 = 3000;
        }
        if( 100 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 1';
            document.getElementById("palabra1").innerHTML ='';
            rapidez_inicio_borrado1 = 1800
            rapidez_borrado1 = 1800;
        }
        if( 200 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 2';
            asignada1 = false
        }
        if( 300 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 3';
            rapidez_borrado1 = 1200;
            rapidez_inicio_borrado1 = 1200;
        }
        if( 400 == obj.value.length){
            document.getElementById("nivel1").innerHTML ='nivel 4';
            rapidez_borrado1 = 500;
            rapidez_inicio_borrado1 = 500;
        }
        borrado1 = setTimeout(() => {  borrar1(obj)}, rapidez_borrado1);
        }

        
}
}

function countChars1(obj){
    if (terminado1 == true) {
        clearTimeout(borrado1)
    }
    else{
    document.getElementById("puntos1").innerHTML = obj.value.length+ puntos_palabra1+ ' puntos';
    if(palabras_objetivo-obj.value.length <= 0){
        document.getElementById("texto1").disabled="true";
        document.getElementById("objetivo1").innerHTML = "¡Terminado!";
        clearTimeout(borrado1)
        terminado1 = true
        
    }
    if(obj.value.length < 100){
        document.getElementById("nivel1").innerHTML ='nivel 0';
        rapidez_borrado1 = 3000;
        rapidez_inicio_borrado1 = 3000
    }
    if(obj.value.length == 100){
        document.getElementById("nivel1").innerHTML ='nivel 1';
        rapidez_borrado1 = 1800;
        rapidez_inicio_borrado1 = 1800;
    }
    if( obj.value.length == 199){
        document.getElementById("palabra1").innerHTML ='';
        document.getElementById("nivel1").innerHTML ='nivel 2';
        asignada1 = false
          
    }
    if(obj.value.length ==  200){
        if(asignada1 == false && lista_palabras1.length != 0){
            palabra_actual1 = lista_palabras1[Math.floor(Math.random() * lista_palabras1.length)]
            document.getElementById("palabra1").innerHTML ='(+50 pts) palabra1: ' + palabra_actual1;
            indice_buscar_palabra = document.getElementById("texto1").value.length -1
            document.getElementById("nivel1").innerHTML ='nivel 2';
            asignada1 = true
        }
        if(lista_palabras1.length == 0){
            document.getElementById("palabra1").innerHTML ="¡WOW, terminaste las palabras!";
            asignada1 = false
        }
    
    }
    if(obj.value.length > 200){
        if(document.getElementById("texto1").value.substring(indice_buscar_palabra, document.getElementById("texto1").value.length -1 ).includes(palabra_actual1)){
            if(asignada1 == true){
            puntos_palabra1 = puntos_palabra1 +50
            document.getElementById("puntos1").innerHTML =obj.value.length+ puntos_palabra1+' puntos';
            const index = lista_palabras1.indexOf(palabra_actual1);
            lista_palabras1.splice(index, 1);
            }
            if(lista_palabras1.length == 0){
                document.getElementById("palabra1").innerHTML ="¡WOW, terminaste las palabras!";
                asignada1 = false
            }
            else{
            palabra_actual1 = lista_palabras1[Math.floor(Math.random() * lista_palabras1.length)]
            document.getElementById("palabra1").innerHTML ='(+50 pts) palabra1: ' + palabra_actual1;
            indice_buscar_palabra = document.getElementById("texto1").value.length -1
            }
        }
    }
    if(obj.value.length == 300){
        document.getElementById("nivel1").innerHTML ='nivel 3';
        rapidez_borrado1 = 1200;
        rapidez_inicio_borrado1 = 1200;
    }
    if( obj.value.length == 299){
        document.getElementById("nivel1").innerHTML ='nivel 2';
        rapidez_borrado1 = 1800;
        rapidez_inicio_borrado1 = 1800;
    }
    if(obj.value.length == 400){
        document.getElementById("nivel1").innerHTML ='nivel 4';
        rapidez_borrado1 = 500;
        rapidez_inicio_borrado1 = 500;
    }
    if( obj.value.length == 399){
        document.getElementById("nivel1").innerHTML ='nivel 3';
        rapidez_borrado1 = 1200;
        rapidez_inicio_borrado1 = 1200;
    }
    clearTimeout(borrado1)
    borrado1 = setTimeout(
        function() {
                borrar1(obj)
                
                
            
        
    }, rapidez_inicio_borrado1);
}
}

function paddedFormat(num) {
    return num < 10 ? "0" + num : num; 
}

function startCountDown(duration, element) {

    let secondsRemaining = duration;
    let min = 5;
    let sec = 0;

    countInterval = setInterval(function () {

        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        element.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        socket.emit('count',count);
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining < 0) {
            clearInterval(countInterval); 
            document.getElementById("tiempo").innerHTML = "¡Terminado!";
            socket.emit('count',"¡Terminado!");
            
            var a = document.createElement("a");
            a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").value +"\n"+document.getElementById("texto").value +"\n"+ document.getElementById("nombre1").value +"\n"+document.getElementById("texto1").value ], {type: "text/plain"}));
            blob = new Blob([document.getElementById("nombre").value +"\n"+document.getElementById("texto").value +"\n"+ document.getElementById("nombre1").value +"\n"+document.getElementById("texto1").value ], {type: "text/plain"});
            a.download = 'sesión.txt';
            a.click();
        };

    }, 1000);
}

function temp () {
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("definicion").innerHTML = "";
    clearInterval(countInterval);
    
    let time_minutes = 0; // Value in minutes
    let time_seconds = 7; // Value in seconds

    var socket = io('http://localhost:3000');
    socket.emit('inicio',time_minutes);
    let duration = time_minutes * 60 + time_seconds;

    element = document.querySelector('#tiempo');
    element.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    count = element.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    socket.emit('count',count);

    startCountDown(--duration, element);
};

function vote () {
    socket.emit('vote', "nada");
};

function exit () {
    socket.emit('exit', "nada");
};
function temas () {
    palabras = document.getElementById("temas").value.split(",")
    socket.emit('temas', palabras);
};
function limpiar () {
    document.getElementById("nombre").value="ESCRITXR 1";
    document.getElementById("nombre1").value="ESCRITXR 2";
    document.getElementById("texto").value = "";
    document.getElementById("texto1").value = "";
    document.getElementById("puntos").innerHTML = "0 puntos";
    document.getElementById("puntos1").innerHTML = "0 puntos";
    document.getElementById("nivel").innerHTML = "nivel 0";
    document.getElementById("nivel1").innerHTML = "nivel 0";
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("texto").style.height = "40";
    document.getElementById("texto").style.height = (document.getElementById("texto").scrollHeight)+"px";
    document.getElementById("texto1").style.height = "40";
    document.getElementById("texto1").style.height = (document.getElementById("texto1").scrollHeight)+"px";
    document.getElementById("definicion").innerHTML = "";
    var socket = io('http://localhost:3000');
    socket.emit('limpiar',"nada");
    clearInterval(countInterval); 
    document.getElementById("tiempo").innerHTML = "";
    socket.emit('count',"");
};

function subir () {
    socket.emit('subir', 'nada');
};

function bajar () {
    socket.emit('bajar', 'nada');
};