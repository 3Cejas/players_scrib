let countInterval;
let time_minutes; // Value in minutes
let time_seconds; // Value in seconds
let secondsRemaining
let impro_estado = false;


function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function startCountDown(duration, element) {

    secondsRemaining = duration;
    let min;
    let sec;

    countInterval = setInterval(function () {

        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        element.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        socket.emit('count', count);
        if (secondsRemaining == 20) {
            tiempo.style.color = "yellow"
        }
        if (secondsRemaining == 10) {
            tiempo.style.color = "red"
        }
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining < 0) {
            clearInterval(countInterval);
            tiempo.style.color = "white"
            document.getElementById("tiempo").innerHTML = "¡Tiempo!";
            socket.emit('count', "¡Tiempo!");
            setTimeout(descargar_textos, 5000);
        };

    }, 1000);
}

function temp() {
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("definicion").innerHTML = "";
    tiempo.style.color = "white"
    clearInterval(countInterval);

    var date = new Date(myDatepicker);
    time_minutes = date.getHours();
    time_seconds = date.getMinutes();
    let duration = time_minutes * 60 + time_seconds;


    element = document.querySelector('#tiempo');
    element.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    count = element.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    
    var checkeados = [];
    for (var i = 0; i < modificadores.length; i++) {
        if (modificadores[i].checked) {
        console.log("Checkbox " + modificadores[i].id + " está marcado");
        // hacer algo si el checkbox está marcado
        checkeados.push(modificadores[i].id);
        } else {
        console.log("Checkbox " + modificadores[i].id  + " no está marcado");
        // hacer algo si el checkbox no está marcado
        }
    }
    socket.emit('inicio', {count, checkeados});
    socket.emit('count', count);

    startCountDown(--duration, element);
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
    document.getElementById("texto").value = "";
    document.getElementById("texto1").value = "";
    document.getElementById("puntos").innerHTML = "0 puntos";
    document.getElementById("puntos1").innerHTML = "0 puntos";
    document.getElementById("nivel").innerHTML = "nivel 0";
    document.getElementById("nivel1").innerHTML = "nivel 0";
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("texto").style.height = "40";
    document.getElementById("texto").style.height = (document.getElementById("texto").scrollHeight) + "px";
    document.getElementById("texto1").style.height = "40";
    document.getElementById("texto1").style.height = (document.getElementById("texto1").scrollHeight) + "px";
    document.getElementById("definicion").innerHTML = "";
    document.getElementById("explicación").innerHTML = "";
    socket.emit('limpiar', "nada");
    clearInterval(countInterval);
    clearTimeout(tempo_text_borroso);
    document.getElementById("tiempo").innerHTML = "";
    document.getElementById("texto").classList.remove('textarea_blur');
    document.getElementById("texto1").classList.remove('textarea_blur');
    puntuacion_final1.innerHTML = "";
    puntuacion_final2.innerHTML = "";
    socket.emit('count', "");
    if (feedback1 !== null) {
        feedback1.innerHTML = "";
    }
    if (feedback2 !== null) {
        feedback2.innerHTML = "";
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

function impro() {
    socket.emit('impro', impro_estado);
    impro_estado = !impro_estado;
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
    socket.emit('pausar', '');
}

function reanudar(){
    element = document.querySelector('#tiempo');
    socket.emit('count', count);
    startCountDown(secondsRemaining, element);
    socket.emit('reanudar', '');
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
    table = document.getElementById("clasificacion");
    var rows = table.rows;
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