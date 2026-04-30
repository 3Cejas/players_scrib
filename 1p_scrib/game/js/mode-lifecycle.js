const MODOS = {

    // Recibe y activa la palabra y el modo bonus.
    "palabras bonus": function (data) {
        reproducirAudioModo("palabras bonus");
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("bonus");
        aplicarEstiloNivelesEscritora("bonus");
        explicación.style.color = "yellow";
        explicación.innerHTML = tJuego1P("mode.desc.bonus", {}, "SUMA TIEMPO CON PALABRAS BONUS");
        palabra.innerHTML = traducirTituloModo1P("palabras bonus");
        definicion.innerHTML = "";
        recibir_palabra();
        iniciarProgresoNivelBarraEscritora();
    },

    //Recibe y activa el modo letra prohibida.
    "letra prohibida": function (data) {
        reproducirAudioModo("letra prohibida");
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("prohibida");
        aplicarEstiloNivelesEscritora("prohibida");
        indice_letra_prohibida = Math.floor(Math.random() * letras_prohibidas_restantes.length);
        letra_prohibida = letras_prohibidas_restantes[indice_letra_prohibida]
        letras_prohibidas_restantes.splice(indice_letra_prohibida, 1);
        if(letras_prohibidas_restantes.length == 0){
            letras_prohibidas_restantes = [...letras_prohibidas];
        }

        listener_cambio_letra_palabra = setTimeout(nueva_letra_prohibida, TIEMPO_CAMBIO_LETRA);

        explicación.style.color = "red";
        explicación.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        palabra.innerHTML = traducirTituloModo1P("letra prohibida");
        definicion.innerHTML = "";
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        iniciarProgresoNivelBarraEscritora();
    },

    "letra bendita": function (data) {
        reproducirAudioModo("letra bendita");
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("bendita");
        aplicarEstiloNivelesEscritora("bendita");
        indice_letra_bendita = Math.floor(Math.random() * letras_benditas_restantes.length);
        letra_bendita = letras_benditas_restantes[indice_letra_bendita]
        letras_benditas_restantes.splice(indice_letra_bendita, 1);
        if(letras_benditas_restantes.length == 0){
            letras_benditas_restantes = [...letras_benditas];
        }
        listener_cambio_letra_palabra = setTimeout(nueva_letra_bendita, TIEMPO_CAMBIO_LETRA);

        explicación.style.color = "lime";
        explicación.innerHTML = construirExplicacionNivelLetraEscritora("bendita", letra_bendita);
        palabra.innerHTML = traducirTituloModo1P("letra bendita");
        definicion.innerHTML = "";
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        iniciarProgresoNivelBarraEscritora();
    },

    "texto borroso": function (data) {
        tiempo_inicial = new Date();
        duracion = data.duracion;
        if(es_pausa == false){
            modo_borroso(data);
        }
        else{
            modo_borroso_pausa(data);
        }
    },

    "psicodélico": function (data) {
        //explicación.innerHTML = "NIVEL PSICODÉLICO";
        //palabra1.innerHTML = "";
        //definicion1.innerHTML = "";
        listener_modo_psico = function () { modo_psicodélico() };
        texto.addEventListener("keyup", listener_modo_psico);
        activado_psico = true;
        /*socket.on("psico_a_j1", (data) => {
            stylize();
        });*/
    },

    'tertulia': function (socket) {
        reproducirAudioModo("tertulia");
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("tertulia");
        aplicarEstiloNivelesEscritora("tertulia");
        es_pausa = true;
        tiempo_restante = TIEMPO_BORRADO - (new Date().getTime() - tiempo_inicial.getTime());
        pausa();
        explicación.style.color = "#86d0ff";
        explicación.innerHTML = tJuego1P("mode.desc.tertulia", {}, "DIALOGA CON TUS MUSAS");
        palabra.innerHTML = traducirTituloModo1P("tertulia");
        definicion.innerHTML = "";
        iniciarProgresoNivelBarraEscritora();
    },

    'palabras prohibidas': function (data) {
        reproducirAudioModo("palabras prohibidas");
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("prohibidas");
        aplicarEstiloNivelesEscritora("prohibidas");
        explicación.style.color = "pink";
        explicación.innerHTML = tJuego1P("mode.desc.prohibidas", {}, "EVITA LAS PALABRAS PROHIBIDAS");
        palabra.innerHTML = traducirTituloModo1P("palabras prohibidas");
        definicion.innerHTML = "";
        palabras_top_usadas.clear();
        nueva_palabra_prohibida();
        iniciarProgresoNivelBarraEscritora();
    },

    'frase final': function (socket) {
        reproducirAudioModo("frase final");
        limpiarEstiloNivelesEscritora();
        setBarraNivelClaseEscritora("frase-final");
        aplicarEstiloNivelesEscritora("frase-final");
        explicación.style.color = "orange";
        explicación.innerHTML = tJuego1P("mode.desc.frase_final", {}, "ULTIMA RONDA");
        palabra.innerHTML = traducirTituloModo1P("frase final");
        definicion.innerHTML = "";
        reiniciarProgresoFraseFinalEscritora();
        setProgresoNivelBarraEscritora(0);
        frase_final();
    },

    "": function (data) { },
};

const LIMPIEZAS = {

    "palabras bonus": function (data) {
        //////socket.off(enviar_palabra);
        asignada = false;
        texto.removeEventListener("keyup", listener_modo);
        definicion.style.fontSize = "1.5vw";
        clearTimeout(listener_cambio_letra_palabra);

    },

    "letra prohibida": function (data) {
        texto.removeEventListener("input", listener_modo);
        texto.removeEventListener("beforeinput", listener_modo, true);
        clearTimeout(listener_cambio_letra_palabra);
        letra_prohibida = "";
    },

    "letra bendita": function (data) {
        texto.removeEventListener("beforeinput", listener_modo, true);
        letra_bendita = "";
        clearTimeout(listener_cambio_letra_palabra);

    },

    "borroso": function (data) {
        texto.classList.remove("textarea_blur");
    },

    "psicodélico": function (data) {
        //socket.off('psico_a_j1');
        texto.removeEventListener("keyup", listener_modo_psico);
        activado_psico = false;
        restablecer_estilo();
        //setTimeout(restablecer_estilo, 2000); //por si acaso no se ha limpiado el modo psicodélico, se vuelve a limpiar.
    },

    "tiempo_borrado_más": function (data){ },
    
    "tertulia": function (data) {
        es_pausa = false;
        reanudar();
    },

    "palabras prohibidas": function (data) {
        //////socket.off(enviar_palabra);
        asignada = false;
        texto.removeEventListener("keyup", listener_modo);
        clearTimeout(listener_cambio_letra_palabra);
        palabras_top_usadas.clear();

    },

    "frase final": function (data) {
        texto.removeEventListener("input", listener_modo);
        texto.removeEventListener("keyup", listener_modo);
    },

    "": function (data) { },
};

// Cuando el texto del jugador 1 cambia, envía los datos de jugador 1 al resto.
texto.addEventListener("input", (evt) => {
    countChars(texto);
});

// Recibe los datos del jugador 1 y los coloca.
/*socket.on(texto_x, (data) => {
    texto.innerText = data.text;
    actualizarPuntosMarcador(data.points);
    nivel.innerHTML = data.level;
    texto.scrollTop = texto.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
});
*/

/* 
Recibe el tiempo restante de la ronda y lo coloca. Si ha terminado,
limpia el borrado del texto del jugador 1 y el blur de los jugadores y
pausa el cambio de palabra.
*/

function activar_modo (data){
    animacion_modo();
    palabra.innerHTML = "";
    explicación.innerHTML = "";
    LIMPIEZAS[modo_actual](data);
    escribirRapidecesGameplay1P(
        leerRapidezBorradoGameplay1P() - 200,
        leerRapidezInicioBorradoGameplay1P() - 200
    );
    modo_actual = data.modo_actual;
    if(terminado == false){
    MODOS[modo_actual](data, socket);
    }
};

function pausar_js (data){
    es_pausa = true;
    LIMPIEZAS[modo_actual](data);
    tiempo_restante = TIEMPO_BORRADO - (new Date().getTime() - tiempo_inicial.getTime());
    pausa();
};


function nueva_letra (letra) {
    palabra_actual = []
    definicion.innerHTML = "";
    if(modo_actual == "letra prohibida"){
        letra_prohibida = letra;

        texto.removeEventListener("beforeinput", listener_modo, true);
        listener_modo = function (e) { modo_letra_prohibida(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        animacion_palabra();
        setBarraNivelClaseEscritora("prohibida");
        aplicarEstiloNivelesEscritora("prohibida");
        palabra.innerHTML = traducirTituloModo1P("letra prohibida");
        explicación.innerHTML = construirExplicacionNivelLetraEscritora("prohibida", letra_prohibida);
        }
    else if(modo_actual == "letra bendita"){
        letra_bendita = letra;
        texto.removeEventListener("beforeinput", listener_modo, true);
        listener_modo = function (e) { modo_letra_bendita(e) };
        texto.addEventListener("beforeinput", listener_modo, true);
        animacion_palabra();
        setBarraNivelClaseEscritora("bendita");
        aplicarEstiloNivelesEscritora("bendita");
        palabra.innerHTML = traducirTituloModo1P("letra bendita");
        explicación.innerHTML = construirExplicacionNivelLetraEscritora("bendita", letra_bendita);
    }
};

async function recibir_palabra() {
    const data = await getRandomSpanishWord();
    console.log(data)
    if (data) {
      console.log(`
        <h2>Palabra: ${data.title}</h2>
        <p>Definición: ${data.definicion}</p>
      `);
    } else {
      return;
    }
    animacion_modo();
    palabra_actual = [data.title];
    tiempo_palabras_bonus = puntuación_palabra(data.title);
    setBarraNivelClaseEscritora("bonus");
    aplicarEstiloNivelesEscritora("bonus");
    palabra.innerHTML = traducirTituloModo1P("palabras bonus");
    renderObjetivoNivelEscritora(data.title, {
        tipo: "bonus",
        tiempoSegundos: tiempo_palabras_bonus,
        descripcion: data.definicion
    });

    texto.removeEventListener("keyup", listener_modo1);
    texto.removeEventListener("keyup", listener_modo);
    asignada = true;
    listener_modo = function (e) { modo_palabras_bonus(e) };
    texto.addEventListener("keyup", listener_modo);
    clearTimeout(listener_cambio_letra_palabra)
    listener_cambio_letra_palabra = setTimeout(recibir_palabra, TIEMPO_CAMBIO_PALABRA);
}

function nueva_palabra_prohibida() {
    const top = obtener_top_palabras_malditas(texto.innerText, TOP_K_PALABRAS_MALDITAS);
    let palabra_elegida = top.find(palabra => !palabras_top_usadas.has(palabra));

    if (palabra_elegida) {
        palabras_top_usadas.add(palabra_elegida);
        palabra_bonus = [[palabra_elegida], [""]];
    } else {
        indice_palabra = Math.floor(Math.random() * palabras_prohibidas_restantes.length);
        palabra_bonus = [[palabras_prohibidas_restantes[indice_palabra]], [""]];
        palabras_prohibidas_restantes.splice(indice_palabra, 1);
        if(palabras_prohibidas_restantes.length == 0){
            palabras_prohibidas_restantes = [...palabras_prohibidas];
        }
    }

    palabras_var = palabra_bonus[0];
    tiempo_palabras_bonus = puntuación_palabra(palabra_bonus[0][0]);
        
    console.log(palabra_bonus, palabras_var, tiempo_palabras_bonus)
    animacion_modo();
    palabra_actual = palabra_bonus[0];
    setBarraNivelClaseEscritora("prohibidas");
    aplicarEstiloNivelesEscritora("prohibidas");
    palabra.innerHTML = traducirTituloModo1P("palabras prohibidas");
    renderObjetivoNivelEscritora(palabras_var, {
        tipo: "prohibidas",
        tiempoSegundos: tiempo_palabras_bonus,
        descripcion: palabra_bonus[1]
    });
    tiempo_palabras_bonus = tiempo_palabras_bonus;
    texto.removeEventListener("keyup", listener_modo);
    asignada = true;
    listener_modo = function (e) { modo_palabras_prohibidas(e) };
    texto.addEventListener("keyup", listener_modo);
    clearTimeout(listener_cambio_letra_palabra)
    listener_cambio_letra_palabra = setTimeout(nueva_palabra_prohibida, TIEMPO_CAMBIO_PALABRA);
}

function frase_final() {

    str_frase_final = frases_finales[Math.floor(Math.random() * frases_finales.length)];
    console.log("\""+str_frase_final+"\"")
    animacion_modo();
    palabra.innerHTML = "\""+str_frase_final+"\"";
    definicion.innerHTML = tJuego1P("mode.goal.final_phrase", {}, "⬆️ ¡Introduce la frase final para ganar! ⬆️");
    limpiarMarcadoFraseFinal();

    texto.removeEventListener("input", listener_modo);
    texto.removeEventListener("keyup", listener_modo);
    listener_modo = function (e) { modo_frase_final(e) };
    texto.addEventListener("input", listener_modo);

    texto.contentEditable = "true";
    requestAnimationFrame(() => {
        if (!texto || terminado) return;
        texto.focus();
        colocarCursorAlFinalEditor();
        actualizarProgresoFraseFinal();
    });
}

