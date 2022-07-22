let borrado1
let rapidez_borrado1 = 3000
let rapidez_inicio_borrado1 = 3000
let palabras_objetivo1 = 5000
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
        if(palabras_objetivo1-obj.value.length <= 0){
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
    if(palabras_objetivo1-obj.value.length <= 0){
        document.getElementById("texto1").disabled="true";
        document.getElementById("objetivo").innerHTML = "¡Terminado!";
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