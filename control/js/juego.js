let countInterval;
let countInterval1;
let listener_cuenta_atras;
let time_minutes; // Value in minutes
let time_seconds; // Value in seconds
let secondsRemaining;
let secondsRemaining1;
let secondsPassed;
let secondsPassed1;
let impro_estado = false;
let fin_j1 = false;
let fin_j2 = false;
let borrar_texto = false;
let terminado = false;
let terminado1 = false;

function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function startCountDown_p1(duration) {

    secondsRemaining = duration;
    secondsPassed = 0;
    let min;
    let sec;
    clearInterval(countInterval);
    countInterval = setInterval(function () {
        secondsPassed++;
        console.log("secondsPased", secondsPassed)
        console.log("modo_actual", modo_actual)
        console.log("DURACION_TIEMPO_MODOS", DURACION_TIEMPO_MODOS)
        if(secondsPassed >= DURACION_TIEMPO_MODOS){
            console.log(modo_actual)
            // Se hace solo aquí LIMPIEZAS porque afecta a los dos jugadores.
            console.log("ENTROOOOOOOO")
            if(DURACION_TIEMPO_MODOS == TIEMPO_CALENTAMIENTO){
                LIMPIEZAS["calentamiento"]();
                }

            secondsPassed = 0;
            secondsPassed1 = 0;
        }
        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        console.log('count', {count, secondsPassed, player:1})
        socket.emit('count', {count, secondsPassed, player:1});
        if (secondsRemaining == 20) {
            tiempo.style.color = "yellow"
        }
        if (secondsRemaining == 10) {
            tiempo.style.color = "red"
        }
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining <= 0) {
            final(1);
        };

    }, 1000);
}

function startCountDown_p2(duration) {
    secondsRemaining1 = duration;
    let min1;
    let sec1;
    clearInterval(countInterval1);
    countInterval1 = setInterval(function () {
        secondsPassed1++;
        if(secondsPassed1 >= DURACION_TIEMPO_MODOS){
            secondsPassed1 = 0;
        }
        min1 = parseInt(secondsRemaining1 / 60);
        sec1 = parseInt(secondsRemaining1 % 60);

        tiempo1.textContent = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
        count1 = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
        socket.emit('count', {count : count1, secondsPassed : secondsPassed1, player: 2});
        if (secondsRemaining1 == 20) {
            tiempo1.style.color = "yellow"
        }
        if (secondsRemaining1 == 10) {
            tiempo1.style.color = "red"
        }
        secondsRemaining1 = secondsRemaining1 - 1;
        if (secondsRemaining1 <= 0) {
            final(2);
        };

    }, 1000);
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

function addSeconds1(secs) {
    secondsRemaining1 += secs;
    if(secondsRemaining1 < 0){
        secondsRemaining1 = 0;
    }  
    min1 = parseInt(secondsRemaining1 / 60);
    sec1 = parseInt(secondsRemaining1 % 60);

    tiempo1.textContent = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
    count1 = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
    console.log(min1)
    console.log("JOOOOOOOOO", count1)
}

function temp() {
    terminado = false;
    terminado1 = false;
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("definicion").innerHTML = "";
    tiempo.style.color = "white"
    tiempo1.style.color = "white"

    clearInterval(countInterval);
    clearInterval(countInterval1);


    var date = new Date(myDatepicker);
    time_minutes = date.getHours();
    time_seconds = date.getMinutes();
    let duration = time_minutes * 60 + time_seconds;


    tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    tiempo1.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;

    count = tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;    
    count1 = tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;   

    if(boton_pausar_reanudar.value == 1){
        boton_pausar_reanudar.value = 0;
        span_pausar_reanudar.innerHTML = "⏸️ PAUSAR";
    }

    socket.emit('inicio', {count, borrar_texto});
    modo_actual = "calentamiento";
    secondsPassed = 0;
    secondsPassed1 = 0;
  
    DURACION_TIEMPO_MODOS = CONST_DURACION_TIEMPO_MODOS;
    
    listener_cuenta_atras = setTimeout(function(){
        console.log({count1, secondsPassed1, player:2})
        socket.emit('count', {count, secondsPassed, player:1});
        socket.emit('count', {count : count1, secondsPassed : secondsPassed1, player:2});
        console.log(duration, tiempo)
        duration = duration - 1;
        startCountDown_p1(duration);
        startCountDown_p2(duration);

    }, 5000);
    MODOS['calentamiento']('', '');

};

function vote() {
    socket.emit('vote', "nada");
};

function exit() {
    socket.emit('exit', "nada");
};

function temas() {
    palabras = tema.value.split(",")
    socket.emit('temas', palabras);
};

function limpiar() {
    //document.getElementById("nombre").value = "ESCRITXR 1";
    //document.getElementById("nombre1").value = "ESCRITXR 2";
    console.log(boton_pausar_reanudar)
    if(boton_pausar_reanudar.value == 1){
        boton_pausar_reanudar.value = 0;
        span_pausar_reanudar.innerHTML = "⏸️ PAUSAR";
    }
    if(borrar_texto == false){
        texto_guardado1 = texto1.value;
        texto_guardado2 = texto2.value;
    }
    texto1.value = "";
    texto2.value = "";
    document.getElementById("puntos").innerHTML = "0 palabras 🖊️";
    document.getElementById("puntos1").innerHTML = "0 palabras 🖊️";
    document.getElementById("nivel").innerHTML = "nivel 0";
    document.getElementById("nivel1").innerHTML = "nivel 0";
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("texto").style.height = "40";
    document.getElementById("texto").style.height = (document.getElementById("texto").scrollHeight) + "px";
    document.getElementById("texto1").style.height = "40";
    document.getElementById("texto1").style.height = (document.getElementById("texto1").scrollHeight) + "px";
    document.getElementById("definicion").innerHTML = "";
    document.getElementById("explicación").innerHTML = "";

    console.log(borrar_texto, "aaaah")
    socket.emit('limpiar', borrar_texto);
    secondsPassed = 0;
    secondsPassed1 = 0;
    DURACION_TIEMPO_MODOS = CONST_DURACION_TIEMPO_MODOS;
    clearInterval(listener_cuenta_atras);
    clearInterval(countInterval);
    clearInterval(countInterval1);
    clearTimeout(tempo_text_borroso);
    tiempo.innerHTML = "";
    tiempo1.innerHTML = "";
    document.getElementById("texto").classList.remove('textarea_blur');
    document.getElementById("texto1").classList.remove('textarea_blur');
    puntuacion_final1.innerHTML = "";
    puntuacion_final2.innerHTML = "";
    //socket.emit('count', "");
    if (feedback1 !== null) {
        feedback1.innerHTML = "";
    }
    if (feedback2 !== null) {
        feedback2.innerHTML = "";
    }
};

function borrar(boton) {
    if(borrar_texto == false){
        borrar_texto = true;
        boton.style.backgroundColor = "green";
    }
    else{
        borrar_texto = false;
        boton.style.backgroundColor = "red";
    }
};

function subir() {
    socket.emit('scroll', 'arriba');
};

function bajar() {
    socket.emit('scroll', 'abajo');
};

function scroll_sincro() {
    socket.emit('scroll_sincro');
};

function fin(player) {
    if(player == 1){
        fin_j1 = true
        final(1);
    }
    else if(player == 2){
        fin_j2 = true
        final(2);
    }
    if(fin_j1 && fin_j2){
        fin_j1 = false;
        fin_j2 = false;
    }
    socket.emit('fin_de_control', player);
};

function cambiar_vista() {
    socket.emit('cambiar_vista', 'nada');
};

function enviar_comentario() {
    palabras = tema.value;
    socket.emit('enviar_comentario', palabras);
};

function puntuacion_final() {
    p1 = puntos1.innerHTML.match(/\d+/)[0];
    p2 = puntos2.innerHTML.match(/\d+/)[0];
    maxima = Math.max(p1, p2);

    v1 = parseInt(votos1.value);
    v2 = parseInt(votos2.value);
    suma = parseInt(v1 + v2);
    pfinal1 = parseInt(+p1 + Math.round((v1 / suma) * maxima));
    pfinal2 = parseInt(+p2 + Math.round((v2 / suma) * maxima));

    if(findValueInRowAndChange(nombre1.value, pfinal1) == false){
        fila = clasificacion.insertRow(clasificacion.rows.length);
        nombre = fila.insertCell(0);
        nombre.contentEditable = false;
        puntuacion = fila.insertCell(1);
        puntuacion.contentEditable = false;
        borrar = fila.insertCell(2);
        borrar.innerHTML = '<input type="button" value="❌" onclick="deleteRow(this)">';
        editar = fila.insertCell(3);
        editar.innerHTML = '<input type="button" value="✏️" onclick="editableRow(this)"></input>';
        nombre.innerHTML = nombre1.value;
        puntuacion.innerHTML = pfinal1;
    }

    if(findValueInRowAndChange(nombre2.value, pfinal2) == false){
        fila = clasificacion.insertRow(clasificacion.rows.length);
        nombre = fila.insertCell(0);
        nombre.contentEditable = false;
        puntuacion = fila.insertCell(1);
        puntuacion.contentEditable = false;
        borrar = fila.insertCell(2);
        borrar.innerHTML = '<input type="button" value="❌" onclick="deleteRow(this)">'
        editar = fila.insertCell(3);
        editar.innerHTML = '<input type="button" value="✏️" onclick="editableRow(this)"></input>';
        nombre.innerHTML = nombre2.value;
        puntuacion.innerHTML = pfinal2;
    }

    sortTable();

    puntuacion_final1.innerHTML = "🗳️ Puntuación del público = " + Math.round((v1 / suma) * maxima) + "<br>🏁 Puntuación final = " + pfinal1;
    puntuacion_final2.innerHTML = "🗳️ Puntuación del público = " + Math.round((v2 / suma) * maxima) + "<br>🏁 Puntuación final = " + pfinal2;
   
    pfinal1 = puntuacion_final1.innerHTML;
    pfinal2 = puntuacion_final2.innerHTML;

    socket.emit('enviar_puntuacion_final', {pfinal1, pfinal2});
};

function enviar_clasificacion(){
    data = extractData('clasificacion', (x) => ({
        jugador: x[0],
        puntuacion: x[1],
      }));
      socket.emit('enviar_clasificacion', data);
  }

function pausar(){
    clearInterval(countInterval);
    clearInterval(countInterval1);
    socket.emit('pausar', '');
}

function pausar_reanudar(boton){
    console.log(boton)
    if(boton.value == 0){
        boton.value = 1;
        pausar();
        span_pausar_reanudar.innerHTML = "▶️ REANUDAR";
        }
    else{
        boton.value = 0;
        reanudar();
        span_pausar_reanudar.innerHTML = "⏸️ PAUSAR";
    }
}


function reanudar(){

    socket.emit('count', {count, secondsPassed, player:1});
    socket.emit('count', {count : count1, secondsPassed : secondsPassed1, player:2});
    startCountDown_p1(secondsRemaining);
    startCountDown_p2(secondsRemaining);
    socket.emit('reanudar', '');
}

function reanudar_modo(){
    console.log(count, secondsPassed, secondsRemaining, tiempo)
    console.log(time_minutes, time_seconds)
    if(boton_pausar_reanudar.value == 1){
        boton_pausar_reanudar.value = 0;
        span_pausar_reanudar.innerHTML = "⏸️ PAUSAR";
    }
    secondsPassed = 0;
    secondsPassed1 = 0;
    socket.emit('count', {count, secondsPassed, player:1});
    socket.emit('count', {count : count1, secondsPassed : secondsPassed1, player:2});


    startCountDown_p1(secondsRemaining);
    startCountDown_p2(secondsRemaining1);
    socket.emit('reanudar_modo', '');
}
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("clasificacion");
    switching = true;
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
      //start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /*Loop through all table rows (except the
      first, which contains table headers):*/
      for (i = 1; i < (rows.length - 1); i++) {
        //start by saying there should be no switching:
        shouldSwitch = false;
        /*Get the two elements you want to compare,
        one from current row and one from the next:*/
        x = rows[i].getElementsByTagName("TD")[1];
        y = rows[i + 1].getElementsByTagName("TD")[1];
        //check if the two rows should switch place:
        if (Number(x.innerHTML.match(/\d+/)[0]) < Number(y.innerHTML.match(/\d+/)[0])) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        /*If a switch has been marked, make the switch
        and mark that a switch has been done:*/
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }

  function findValueInRowAndChange(nombre, puntos) {
    clasificacion = document.getElementById("clasificacion");
    var rows = clasificacion.rows;
    for (var i = 1; i < rows.length; i++) {
      var cols = rows[i].cells;
      for (var c = 0; c < cols.length; c++) {
        if (cols[c].innerText == nombre) {
          cols[1].innerHTML = puntos;
          return true;
        }
      }
    }
    return false;
  }

  function deleteRow(r) {
    var i = r.parentNode.parentNode.rowIndex;
    document.getElementById("clasificacion").deleteRow(i);
}

function editableRow(r) {
    table_ = document.getElementById("clasificacion");
    var i = r.parentNode.parentNode.rowIndex;
    rows_ = table_.rows;
    editando = rows_[i].getElementsByTagName("TD")[0].contentEditable;
    if(editando == 'true'){
        r.value = "✏️";
        rows_[i].getElementsByTagName("TD")[0].contentEditable = 'false';
        rows_[i].getElementsByTagName("TD")[1].contentEditable = 'false';
        sortTable();
    }
    else {
        r.value = "✅";
        rows_[i].getElementsByTagName("TD")[0].contentEditable = 'true';
        rows_[i].getElementsByTagName("TD")[1].contentEditable = 'true';

    }
}

const extractData = (tableId, mapper) => {
    const myTab = document.getElementById(tableId);
    if (myTab) {
      const data = [...myTab.rows].map((r) => [...r.cells].map((c) => c.innerText));
      return data.map(mapper);
    }
  };

function final(player){
    if(player == 1){
        clearInterval(countInterval);
        tiempo.style.color = "white"
        tiempo.innerHTML = "¡Tiempo!";
        count = "¡Tiempo!";
        texto_guardado1 = texto1.value;
        terminado = true;
        socket.emit('count', {count, secondsPassed, player});
    }
    else{
        clearInterval(countInterval1);
        tiempo1.style.color = "white"
        tiempo1.innerHTML = "¡Tiempo!";
        count1 = "¡Tiempo!";
        terminado1 = true;
        console.log("texto2", texto_guardado2)
        texto_guardado2 = texto2.value;

        socket.emit('count', {count : count1, secondsPassed : secondsPassed1, player:2});
    }
    if(terminado && terminado1){
        console.log("PRUEBA FINAL", texto_guardado1)
        setTimeout(descargar_textos, 5000);
    }
}