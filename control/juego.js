let countInterval;

function paddedFormat(num) {
    return num < 10 ? "0" + num : num;
}

function startCountDown(duration, element) {

    let secondsRemaining = duration;
    let min;
    let sec;

    countInterval = setInterval(function () {

        min = parseInt(secondsRemaining / 60);
        sec = parseInt(secondsRemaining % 60);

        element.textContent = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        count = `${paddedFormat(min)}:${paddedFormat(sec)}`;
        socket.emit('count', count);
        secondsRemaining = secondsRemaining - 1;
        if (secondsRemaining < 0) {
            clearInterval(countInterval);
            document.getElementById("tiempo").innerHTML = "¡Tiempo!";
            socket.emit('count', "¡Tiempo!");

            var a = document.createElement("a");
            a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").value + "\r\n" + document.getElementById("puntos").innerHTML + "\r\n" + document.getElementById("texto").value + "\r\n" + document.getElementById("nombre1").value + "\r\n" + document.getElementById("puntos1").innerHTML + "\r\n" + document.getElementById("texto1").value], { type: "text/plain" }));
            blob = new Blob([document.getElementById("nombre").value + "\n" + document.getElementById("texto").value + "\n" + document.getElementById("nombre1").value + "\n" + document.getElementById("texto1").value], { type: "text/plain" });
            a.download = document.getElementById("nombre").value + ' VS ' + document.getElementById("nombre1").value + '.txt';
            a.click();
        };

    }, 1000);
}

function temp() {
    document.getElementById("palabra").innerHTML = "";
    document.getElementById("definicion").innerHTML = "";
    clearInterval(countInterval);

    let time_minutes = 6; // Value in minutes
    let time_seconds = 0; // Value in seconds


    socket.emit('inicio', time_minutes);
    let duration = time_minutes * 60 + time_seconds;

    element = document.querySelector('#tiempo');
    element.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
    count = element.textContent = `${paddedFormat(time_minutes)}:${paddedFormat(time_seconds)}`;
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
    palabras = document.getElementById("temas").value.split(",")
    socket.emit('temas', palabras);
};

function limpiar() {
    document.getElementById("nombre").value = "ESCRITXR 1";
    document.getElementById("nombre1").value = "ESCRITXR 2";
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

function cambiar_vista() {
    socket.emit('cambiar_vista', 'nada');
};

function limpiar_inverso() {
    socket.emit('limpiar_inverso', 'nada');
};