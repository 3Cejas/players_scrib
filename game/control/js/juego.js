let countInterval;
let countInterval1;
let listener_cuenta_atras;
let time_minutes; // Value in minutes
let time_seconds; // Value in seconds
let secondsRemaining;
let secondsRemaining1;
let secondsPassed;
let impro_estado = false;
let fin_j1 = false;
let fin_j2 = false;
let terminado = false;
let terminado1 = false;
let juego_iniciado = false;
let pausado = false;
let intervalId;  // Guarda el ID del setInterval para poder limpiarlo luego
let TimeoutTiempoMuerto;  // Guarda el ID del setInterval para poder limpiarlo luego
let vista_calentamiento = false;
let temporizador_gigante_activo = false;

const VIDA_MAX_SEGUNDOS = 5 * 60;
const DISPLAY_BARRA_VIDA = "flex";

function extraerSegundosTiempo(texto) {
    if (!texto || typeof texto !== "string" || texto.indexOf(":") === -1) {
        return null;
    }
    const partes = texto.split(":");
    if (partes.length < 2) {
        return null;
    }
    const minutos = parseInt(partes[0], 10);
    const segundos = parseInt(partes[1], 10);
    if (Number.isNaN(minutos) || Number.isNaN(segundos)) {
        return null;
    }
    return (minutos * 60) + segundos;
}

function actualizarBarraVida(elemento, texto) {
    if (!elemento) {
        return;
    }
    const total = extraerSegundosTiempo(texto);
    if (total === null) {
        elemento.style.setProperty("--vida-pct", "0%");
        elemento.style.setProperty("--vida-color", "#d94b4b");
        elemento.style.display = "none";
        return;
    }
    const limitado = Math.min(Math.max(total, 0), VIDA_MAX_SEGUNDOS);
    const porcentaje = (limitado / VIDA_MAX_SEGUNDOS) * 100;
    const tono = Math.max(0, Math.min(120, porcentaje * 1.2));
    elemento.style.display = DISPLAY_BARRA_VIDA;
    elemento.style.setProperty("--vida-pct", `${porcentaje.toFixed(1)}%`);
    elemento.style.setProperty("--vida-color", `hsl(${tono}, 85%, 55%)`);
}


function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function startCountDown_p1(duration) {

    secondsRemaining = duration;

    let min;
    let sec;
    clearInterval(countInterval);
    countInterval = setInterval(function () {
        display_modo.style.color = COLORES_MODOS[modo_actual]; // Asignar color al texto del label
        display_modo.textContent = modo_actual.toUpperCase();
        console.log("modo_actual", modo_actual)
        console.log("DURACION_TIEMPO_MODOS", DURACION_TIEMPO_MODOS)
        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        tiempo.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        actualizarBarraVida(tiempo, tiempo.textContent);
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        console.log('count', {count, player:1})
        socket.emit('count', {count, player:1});
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

        min1 = parseInt(secondsRemaining1 / 60);
        sec1 = parseInt(secondsRemaining1 % 60);

        tiempo1.textContent = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
        actualizarBarraVida(tiempo1, tiempo1.textContent);
        count1 = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
        socket.emit('count', {count : count1, player: 2});
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
    actualizarBarraVida(tiempo, tiempo.textContent);
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
    actualizarBarraVida(tiempo1, tiempo1.textContent);
    count1 = `${paddedFormat(min1)}:${paddedFormat(sec1)}`;
    console.log(min1)
    console.log("JOOOOOOOOO", count1)
}

function temp() {
    console.log(frase_final_j1.value)
    var checkboxFraseFinal = document.querySelector('input[type="checkbox"][value="frase final"]');
    console.log(checkboxFraseFinal)
    if((!frase_final_j1.value || !frase_final_j2.value || frase_final_j1.value == "«»" || frase_final_j2.value == "«»") && checkboxFraseFinal && checkboxFraseFinal.checked){
        if(!frase_final_j1.value){
        alert("Falta introducir una frase inicial para " + nombre1.value + ".")
        }
        else{
            alert("Falta introducir una frase inicial para " + nombre2.value + ".")
        }
    }
    else{
    terminado = false;
    terminado1 = false;
    fin_j1 = false;
    fin_j2 = false;
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("definicion").innerHTML = "";
    tiempo.style.color = "white"
    tiempo1.style.color = "white"

    clearInterval(countInterval);
    clearInterval(countInterval1);

    let duration;

    // --------------------------------------------------
// 3A. DESESTRUCTURACIÓN DE OBJETO
// --------------------------------------------------
// Nota: al asignar a variables ya declaradas, debemos envolver
// la destructuración entre paréntesis para evitar que JS lo interprete
// como un bloque de código.
({
    minutos: time_minutes,
    segundos: time_seconds,
    totalSegundos: duration
  } = obtenerTotalSegundos());
  
  console.log('Objeto →', time_minutes, time_seconds, duration);

    tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    tiempo1.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    actualizarBarraVida(tiempo, tiempo.textContent);
    actualizarBarraVida(tiempo1, tiempo1.textContent);

    count = tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;    
    count1 = tiempo.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;   

    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        boton_pausar_reanudar.innerHTML = "⏸️ PAUSAR";
    }
    rellenarListaModos();
    actualizarVariables();
    socket.emit('inicio', {count, borrar_texto : false, parametros: {DURACION_TIEMPO_MODOS, LISTA_MODOS, LISTA_MODOS_LOCURA, TIEMPO_CAMBIO_LETRA, TIEMPO_CAMBIO_PALABRAS, TIEMPO_VOTACION, PALABRAS_INSERTADAS_META, TIEMPO_MODIFICADOR, LIMITE_TIEMPO_INSPIRACION, FRASE_FINAL_J1: frase_final_j1.value.slice(1, -1), FRASE_FINAL_J2: frase_final_j2.value.slice(1, -1)} });
    juego_iniciado = true;
    modo_actual = "";
  
    DURACION_TIEMPO_MODOS = TIEMPO_MODOS;
    
    listener_cuenta_atras = setTimeout(function(){
        console.log({count1, player:2})
        socket.emit('count', {count, player:1});
        socket.emit('count', {count : count1, player:2});
        console.log(duration, tiempo)
        duration = duration - 1;
        startCountDown_p1(duration);
        startCountDown_p2(duration);

    }, 8000);
}
};

function obtenerTotalSegundos() {
    // Lectura y saneado de los inputs (suponemos que existen en el DOM)
    const mRaw = parseInt(document.getElementById('tiempo_minutos').value, 10);
    const sRaw = parseInt(document.getElementById('tiempo_segundos').value, 10);
  
    // Validación de rangos y normalización
    const m = Math.min(Math.max(mRaw || 0, 0), 60);
    const s = Math.min(Math.max(sRaw || 0, 0), 59);
  
    // Retornamos un objeto con los tres valores
    return {
      minutos: m,
      segundos: s,
      totalSegundos: m * 60 + s
    };
  }

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
    display_modo.style.color = "white";
    display_modo.textContent = "Ninguno";
    tiempo_modos_secs.textContent = "0 segundos";
    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        boton_pausar_reanudar.innerHTML = "⏸️ PAUSAR";
    }
    texto_guardado1 = texto1.innerText;
    texto_guardado2 = texto2.innerText;
    //texto1.innerText = "";
    //texto2.innerText = "";
    juego_iniciado = false;
    document.getElementById("puntos").innerHTML = "0 palabras";
    document.getElementById("puntos1").innerHTML = "0 palabras";
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("texto").style.height = "40";
    document.getElementById("texto").style.height = (document.getElementById("texto").scrollHeight) + "px";
    document.getElementById("texto1").style.height = "40";
    document.getElementById("texto1").style.height = (document.getElementById("texto1").scrollHeight) + "px";
    document.getElementById("definicion").innerHTML = "";
    document.getElementById("explicación").innerHTML = "";
    socket.emit('limpiar', false);

    DURACION_TIEMPO_MODOS = DURACION_TIEMPO_MODOS;
    clearInterval(listener_cuenta_atras);
    clearInterval(countInterval);
    clearInterval(countInterval1);
    clearTimeout(tempo_text_borroso);
    clearTimeout(TimeoutTiempoMuerto);
    temporizador_gigante_activo = false;

    tiempo.innerHTML = "";
    tiempo1.innerHTML = "";
    actualizarBarraVida(tiempo, tiempo.innerHTML);
    actualizarBarraVida(tiempo1, tiempo1.innerHTML);
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
    if (typeof resetearHeatmap === "function") {
        resetearHeatmap();
    }
};

function borrar_texto_guardado() {
    texto_guardado1 = "";
    texto_guardado2 = "";
    socket.emit('borrar_texto_guardado');
}

function activar_temporizador_gigante() {
    if (temporizador_gigante_activo) {
        temporizador_gigante_activo = false;
        socket.emit('temporizador_gigante_detener', {});
        return;
    }
    temporizador_gigante_activo = true;
    socket.emit('activar_temporizador_gigante', { duracion: 10 * 60 });
}

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
        juego_iniciado = false;

    }
    socket.emit('fin_de_control', player);
};

function cambiar_vista() {
    socket.emit('cambiar_vista', 'nada');
};

function cambiar_vista_calentamiento(boton) {
    vista_calentamiento = !vista_calentamiento;
    actualizarBotonVistaCalentamiento(boton);
    socket.emit('cambiar_vista_calentamiento', { activo: vista_calentamiento });
}

function actualizarBotonVistaCalentamiento(boton) {
    const destino = boton || document.getElementById("boton_vista_calentamiento");
    if (!destino) return;
    destino.textContent = vista_calentamiento ? "🎮 VISTA PARTIDA" : "🔥 VISTA CALENTAMIENTO";
    destino.dataset.activo = vista_calentamiento ? "1" : "0";
}
function reiniciar_calentamiento() {
    socket.emit('reiniciar_calentamiento');
}

function reiniciar_marcador_calentamiento() {
    socket.emit('reiniciar_marcador_calentamiento');
}

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
    pausado = true;
    clearInterval(countInterval);
    clearInterval(countInterval1);
    // Variables para llevar el conteo y controlar el intervalo
    socket.emit('pausar', '');
}


function pausar_reanudar(boton) {
    // Imprimimos en consola para verificar
    console.log(fin_j1, fin_j2);

    console.log("¿Terminado?:", !(fin_j1 || fin_j2));
    console.log("Valor de data-value:", boton.dataset.value);

    if (juego_iniciado) {
      // Usamos comparación == para no preocuparnos de que sea string
      if (boton.dataset.value == 0) {
        pausar();
        boton.innerHTML = "▶️ REANUDAR";
        boton.dataset.value = 1;
      }
      else if (boton.dataset.value == 1) {
        reanudar();
        boton.innerHTML = "⏸️ PAUSAR";
        boton.dataset.value = 0;
      }
    }
  }


function reanudar(){
    if(modo_actual != "tertulia"){
    socket.emit('count', {count, player:1});
    socket.emit('count', {count : count1, player:2});
    console.log("estooo",secondsRemaining)
    console.log("estooo", TIEMPO_MODOS - secondsRemaining)
    startCountDown_p1(secondsRemaining);
    startCountDown_p2(secondsRemaining);
    pausado = false;
    socket.emit('reanudar', '');
    }
    else if(modo_actual == "tertulia"){
        clearTimeout(TimeoutTiempoMuerto)
        reanudar_modo();
    }
}

function reanudar_modo(){
    console.log(count, secondsRemaining, tiempo)
    console.log(time_minutes, time_seconds)
    if(boton_pausar_reanudar.dataset.value == 1){
        boton_pausar_reanudar.dataset.value = 0;
        boton_pausar_reanudar.innerHTML = "⏸️ PAUSAR";
    }
    socket.emit('count', {count, player:1});
    socket.emit('count', {count : count1, player:2});


    startCountDown_p1(secondsRemaining);
    startCountDown_p2(secondsRemaining1);
    pausado = false;
    //socket.emit('reanudar_modo', '');
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
        actualizarBarraVida(tiempo, tiempo.innerHTML);
        count = "¡Tiempo!";
        texto_guardado1 = texto1.innerHTML;
        terminado = true;
        console.log("texto1", texto_guardado1)
        socket.emit('count', {count, player});
    }
    else{
        clearInterval(countInterval1);
        tiempo1.style.color = "white"
        tiempo1.innerHTML = "¡Tiempo!";
        actualizarBarraVida(tiempo1, tiempo1.innerHTML);
        count1 = "¡Tiempo!";
        terminado1 = true;
        console.log("texto2", texto_guardado2)
        texto_guardado2 = texto2.innerHTML;
        socket.emit('count', {count : count1, player:2});
    }

    if(terminado && terminado1){
        tiempo_modos_secs.textContent = 0 + " segundos";
        display_modo.style.color = "white";
        display_modo.textContent = "Ninguno"; 
        console.log("PRUEBA FINAL", texto_guardado1)
        //setTimeout(descargar_textos, 5000);
    }
}

function frase_final(player){
    if(player== 1){
        frase_final_j1.value = "«" + tema.value + "»";
    }
    else{
        frase_final_j2.value = "«" + tema.value + "»";
    }
}
