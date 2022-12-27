//let socket = io('https://scri-b.up.railway.app/');
let socket = io('http://localhost:3000/');
const getEl = id => document.getElementById(id);

// COMPONENTES DEL JUGADOR 1
let nombre1 = getEl("nombre");
let texto1 = getEl("texto");
let puntos1 = getEl("puntos");
let nivel1 = getEl("nivel");
let objetivo1 = getEl("objetivo");
let feedback1 = getEl("feedback1");
let alineador1 = getEl("alineador1");

let palabra1 = getEl("palabra");
let definicion1 = getEl("definicion");
let explicación = getEl("explicación");

// Tiempo restante de la ronda.
let tiempo = getEl("tiempo");

let tema = getEl("temas");

let temporizador = getEl("temporizador");

// COMPONENTES DEL JUGADOR 2
let nombre2 = getEl("nombre1");
let texto2 = getEl("texto1");
let puntos2 = getEl("puntos1");
let nivel2 = getEl("nivel1");
let objetivo2 = getEl("objetivo1");
let feedback2 = getEl("feedback2");
let alineador2 = getEl("alineador2");

let tempo_text_borroso;

let postgame1;
let postgame2;

/*new Picker(document.querySelector('.js-inline-picker'), {
    controls: true,
    inline: true,
  });*/
const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    'palabras bonus': function (data) {
        explicación.innerHTML = "MODO PALABRAS BONUS";
        palabra1.innerHTML = '(+' + data.puntuacion + ' pts) palabra: ' + data.palabra_bonus[0];
        definicion1.innerHTML = data.palabra_bonus[1];
    },

    //Recibe y activa el modo letra prohibida.
    'letra prohibida': function (data) {
        explicación.innerHTML = "MODO LETRA PROHIBIDA";
        palabra1.innerHTML = "LETRA PROHIBIDA: " + data.letra_prohibida;
        definicion1.innerHTML = "";
    },

    'texto borroso': function (data) {
        explicación.innerHTML = "MODO TEXTO BORROSO";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        if (data.jugador == 1) {
            texto1.classList.add('textarea_blur');
            tempo_text_borroso = setTimeout(function () {
                texto1.classList.remove('textarea_blur');
                texto2.classList.add('textarea_blur');;
            }, 30000);
        }
        if (data.jugador == 2) {
            texto2.classList.add('textarea_blur');
            tempo_text_borroso = setTimeout(function () {
                texto2.classList.remove('textarea_blur');
                texto1.classList.add('textarea_blur');;
            }, 30000);
        }
    },

    'psicodélico': function (data) {
        explicación.innerHTML = "MODO PSICODÉLICO";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
        socket.on('psico_a_j2', data => {
            stylize();
        });
        socket.on('psico_a_j1', data => {
            stylize();
        });
    },

    'texto inverso': function (data) {
        explicación.innerHTML = "MODO TEXTO INVERSO";
        palabra1.innerHTML = "";
        definicion1.innerHTML = "";
    },

    '': function (data) {
    }
};

// Recibe los datos del jugador 1 y los coloca.
socket.on('texto1', data => {
    texto1.value = data.text;
    puntos1.innerHTML = data.points;
    nivel1.innerHTML = data.level;
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.value = "\n" + texto1.value;
        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value;
        }
    }*/
    texto1.style.height = (texto1.scrollHeight) + "px";
});

socket.on('texto2', data => {
    texto2.value = data.text;
    puntos2.innerHTML = data.points;
    nivel2.innerHTML = data.level;
    /*if (texto2.scrollHeight >= texto1.scrollHeight) {
        while (texto2.scrollHeight > texto1.scrollHeight) {
            saltos_línea_alineacion_1 += 1;
            texto1.value = "\n" + texto1.value

        }
    }
    else {
        while (texto2.scrollHeight < texto1.scrollHeight) {
            saltos_línea_alineacion_2 += 1;
            texto2.value = "\n" + texto2.value
        }
    }*/
    texto2.style.height = (texto1.scrollHeight) + "px";

});

socket.on('count', data => {
    document.getElementById("tiempo").innerHTML = data
    if (data == "¡Tiempo!") {
        document.getElementById("texto1").disabled = true;
        document.getElementById("texto").disabled = true;
        clearTimeout(borrado);
        clearTimeout(borrado1);
    }
});

nombre1.addEventListener("input", evt => {
    let name1 = nombre1.value;
    socket.emit('envío_nombre1', name1);
});

nombre2.addEventListener("input", evt => {
    let name = nombre2.value;
    socket.emit('envío_nombre2', name);
});

socket.on('activar_modo', data => {
    animacion_modo();
    modo_actual = data.modo_actual;
    MODOS[modo_actual](data);
});

socket.on("recibir_postgame1", (data) => {
    postgame2 = "\n🖋️ Caracteres escritos = " + data.longitud + "\n📚 Palabras bonus = " + data.puntos_palabra + "\n❌ Letra prohibida = " + data.puntos_letra_prohibida + "\n\n";
})

socket.on("recibir_postgame2", (data) => {
    postgame1 = "\n🖋️ Caracteres escritos = " + data.longitud + "\n📚 Palabras bonus = " + data.puntos_palabra + "\n❌ Letra prohibida = " + data.puntos_letra_prohibida + "\n";
})
socket.on('feedback_a_j2', data => {
    var feedback = document.querySelector(".feedback1");
    feedback.style.color = data.color;
    feedback.innerHTML = data.envio_puntos.toString() + " pts";
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

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".feedback1", "bounceInLeft");
    animateCSS('.feedback1', 'bounceInLeft').then((message) => {
        delay_animacion = setTimeout(function () {
            feedback.innerHTML = "";
        }, 2000);
    });
});

socket.on('feedback_a_j1', data => {
    var feedback1 = document.querySelector(".feedback2");
    feedback1.style.color = data.color;
    feedback1.innerHTML = data.envio_puntos.toString() + " pts";
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

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".feedback2", "bounceInLeft");
    animateCSS('.feedback2', 'bounceInLeft').then((message) => {
        delay_animacion = setTimeout(function () {
            feedback1.innerHTML = "";
        }, 2000);
    });
});
function animacion_modo() {
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

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    animateCSS(".explicación", "bounceInLeft");
    animateCSS(".palabra", "bounceInLeft");
    animateCSS(".definicion", "bounceInLeft");
}

function descargar_textos() {
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([document.getElementById("nombre").value + "\r\n\n" + document.getElementById("puntos").innerHTML + "\r\n\n" + document.getElementById("texto").value + "\r\n" + postgame1 + "\n\n" + document.getElementById("nombre1").value + "\r\n\n" + document.getElementById("puntos1").innerHTML + "\r\n\n" + document.getElementById("texto1").value + "\n" + postgame2], { type: "text/plain" }));
    a.download = document.getElementById("nombre").value + ' VS ' + document.getElementById("nombre1").value + '.txt';
    a.click();
}