function refrescarLayoutDashboardJuego1P() {
  if (typeof window === "undefined") return;
  [0, 320].forEach((delay) => {
    setTimeout(() => {
      if (typeof actualizarEstadoMenuAccionesPartida1P === "function") {
        actualizarEstadoMenuAccionesPartida1P();
      }
      window.dispatchEvent(new Event("resize"));
    }, delay);
  });
}

function opciones(){
  if (typeof setAccionesPartidaDesplegadas1P === "function") {
    setAccionesPartidaDesplegadas1P(false);
  }
  if (document.body) document.body.classList.add("modo-opciones");
  const btnOpcionesEl = document.getElementById("btn_opciones");
  const btnEscribirEl = document.getElementById("btn_escribir");
  const btnLimpiarEl = document.getElementById("btn_limpiar");
  const btnDescargarEl = document.getElementById("btn_descargar_texto");
  const btnPantallaEl = document.getElementById("btn_pantalla_completa");
  const btnVolverEl = document.getElementById("btn_volver");
  const soporteEl = document.getElementById("soporte");
  const contenedorEl = document.getElementById("contenedor");
  const opcionesEl = document.getElementById("opciones");
  
  animateCSS(".botones", "backOutLeft").then((message) => {
    if (btnOpcionesEl) btnOpcionesEl.style.display = "none";
    if (btnEscribirEl) btnEscribirEl.style.display = "none";
    if (btnLimpiarEl) btnLimpiarEl.style.display = "none";
    if (btnDescargarEl) btnDescargarEl.style.display = "none";
    if (btnPantallaEl) btnPantallaEl.style.display = "none";
    if (typeof sincronizarVisibilidadBtnVolver1P === "function") {
      sincronizarVisibilidadBtnVolver1P();
    } else if (btnVolverEl) {
      btnVolverEl.style.setProperty("display", "inline-block", "important");
    }
    if (soporteEl) soporteEl.style.display = "block";
    animateCSS(".botones", "backInLeft")
    animateCSS(".soporte", "backInLeft")

  });

  animateCSS(".contenedor", "backOutLeft").then((message) => {
    if (contenedorEl) contenedorEl.style.display = "none";
    if (opcionesEl) opcionesEl.style.display = "inline-block";
    animateCSS(".opciones", "backInLeft")
    animateCSS(".soporte", "backInLeft")

  })
  refrescarLayoutDashboardJuego1P();
}

function volver(){
  if (typeof setAccionesPartidaDesplegadas1P === "function") {
    setAccionesPartidaDesplegadas1P(false);
  }
  if (document.body) document.body.classList.remove("modo-opciones");
  const btnOpcionesEl = document.getElementById("btn_opciones");
  const btnEscribirEl = document.getElementById("btn_escribir");
  const btnLimpiarEl = document.getElementById("btn_limpiar");
  const btnPantallaEl = document.getElementById("btn_pantalla_completa");
  const btnVolverEl = document.getElementById("btn_volver");
  const soporteEl = document.getElementById("soporte");
  const contenedorEl = document.getElementById("contenedor");
  const opcionesEl = document.getElementById("opciones");

  animateCSS(".botones", "backOutLeft").then((message) => {
    if (btnOpcionesEl) btnOpcionesEl.style.display = "";
    if (btnEscribirEl) btnEscribirEl.style.display = "";
    if (btnLimpiarEl) btnLimpiarEl.style.display = "";
    if (btnPantallaEl) btnPantallaEl.style.display = "";
    if (typeof sincronizarVisibilidadBtnVolver1P === "function") {
      sincronizarVisibilidadBtnVolver1P();
    } else if (btnVolverEl) {
      btnVolverEl.style.setProperty("display", "none", "important");
    }
    if (soporteEl) soporteEl.style.display = "none";
    animateCSS(".botones", "backInLeft")
  });
  animateCSS(".opciones", "backOutLeft").then((message) => {
    if (contenedorEl) contenedorEl.style.display = "";
    if (opcionesEl) opcionesEl.style.display = "";
    if (contenedorEl) contenedorEl.style.display = "";
    animateCSS(".contenedor", "backInLeft")
  })
  refrescarLayoutDashboardJuego1P();
}

// FunciÃ³n para generar las casillas de verificaciÃ³n dentro de <td>
