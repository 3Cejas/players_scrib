"use strict";



/**

 * Configs

 */



var configs = (function () {

    var instance;

    var Singleton = function (options) {

        var options = options || Singleton.defaultOptions;

        for (var key in Singleton.defaultOptions) {

            this[key] = options[key] || Singleton.defaultOptions[key];

        }

    };

    Singleton.defaultOptions = {

        general_help: "**A continuación tienes una lista de comandos que puedes usar.**\n\nPuedes escribirlos o pulsar los comandos disponibles.\n\nPara cargar el texto instantáneamente presiona **ENTER** o haz doble click.",

		ls_help: "List information about the files and folders (the current directory by default).",

        cat_help: "Read FILE(s) content and print it to the standard output (screen).",

        //whoami_help: "Print the user name associated with the current effective user ID and more info.",

        date_help: "Print the system date and time.",

        help_help: "Imprime este menú.",

        clear_help: "Clear the terminal screen.",

        reboot_help: "Reinicia el sistema.",

        cd_help: "Change the current working directory.",

        mv_help: "Move (rename) files.",

        rm_help: "Remove files or directories.",

        rmdir_help: "Remove directory, this command will only work if the folders are empty.",

        touch_help: "Change file timestamps. If the file doesn't exist, it's created an empty one.",

        sudo_help: "Execute a command as the superuser.",

        welcome: "**Bienvenides a la página oficial de SCRIB.**\n\nPara navegar, **introduce o pulsa** alguno de los siguientes comandos:\n\n\u2022 videojuego\n\u2022 espectáculo\n\u2022 fechas\n\u2022 materiales\n\u2022 artículos\n\u2022 compañía\n\u2022 newsletter\n\u2022 contacto\n\u2022 reinicio\n\nSi te pierdes en algún momento, utiliza el comando «ayuda».",

        internet_explorer_warning: "AVISO: Estás usando Internet Explorer. Es posible que la página no se muestre correctamente.",

        welcome_file_name: "welcome_message.txt",

        invalid_command_message: "<value>: comando no válido.",

        reboot_message: "Preparando reinicio...\n\n3...\n\n2...\n\n1...\n\Reiniciando...\n\n",

        permission_denied_message: "Unable to '<value>', permission denied.",

        sudo_message: "Unable to sudo using a web client.",

        usage: "Usage",

        file: "file",

        file_not_found: "File '<value>' not found.",

        username: "Username",

        hostname: "Host",

        platform: "Platform",

        accesible_cores: "Accessible cores",

        language: "Language",

        value_token: "<value>",

        host: "scrib",

        user: "invitado",

        no_writing: true,

        type_delay: 0,
		
		el_juego_help:"El juego.",
		
		musa_help:"Las musas.",

        juego_help: "Versión para un jugador de SCRIB.",

		el_espectáculo_help:"¿Qué es  SCRIB?",

		liga_help: "Bases de la liga  SCRIB.",

		clasificacion_help: "Clasificación actual de la liga  SCRIB.",

		textos_del_mes_help:"Textos escritos en SCRIB de este mes.",

		fecha_help:"Próximas fechas de  SCRIB.",
		
		financiación_help:"Cómo financiamos el proyecto.",

        newsletter_help:"Suscríbete a la newsletter de la compañía.",

        imagenes_help:"Imágenes y vídeos de SCRIB.",

        articulos_help:"Artículos de Substack sobre <SCRI> B.",

		la_compañía_help: "¿Quién es Sutura Teatro?",
        
        dossier_help: "Dossier del espectáculo SCRIB.",

		contacto_help: "Para encontrar a la compañía.",
    };

    return {

        getInstance: function (options) {

            instance === void 0 && (instance = new Singleton(options));

            return instance;

        }

    };

})();



/**

 * LOS ARCHIVOS AQUÍ

 */

var files = (function () {

    var instance;

    var Singleton = function (options) {

        var options = options || Singleton.defaultOptions;

        for (var key in Singleton.defaultOptions) {

            this[key] = options[key] || Singleton.defaultOptions[key];

        }

    };

    

    return {

        getInstance: function (options) {

            instance === void 0 && (instance = new Singleton(options));

            return instance;

        }

    };

})();



var main = (function () {



    /**

     * FUNCIONES AUXILIARES

     */

    var isUsingIE = window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);

    var ignoreEvent = function (event) {

        event.preventDefault();

        event.stopPropagation();

    };

    

    var scrollToBottom = function () {

        window.scrollTo(0, document.body.scrollHeight);

    };





 



    var isURL = function (str) {

        return (str.startsWith("http") || str.startsWith("www")) && str.indexOf(" ") === -1 && str.indexOf("\n") === -1;

    };

    var escapeRegExp = function (str) {

        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    };

    var SCRIB_BRAND_TEXT = "<SCRI> B";

    var normalizeScribBrand = function (str) {

        if (typeof str !== "string") {

            return str;

        }

        return str.replace(/<\s*SCRI\s*>\s*B|\bSCRI(?:\s*-\s*|\s+)B\b|\bSCRIB\b/gi, SCRIB_BRAND_TEXT);

    };

    var escapeHTML = function (str) {

        return normalizeScribBrand(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    };

    

    /**

     * MODELO

     */

    var InvalidArgumentException = function (message) {

        this.message = message;

        // Use V8's native method if available, otherwise fallback

        if ("captureStackTrace" in Error) {

            Error.captureStackTrace(this, InvalidArgumentException);

        } else {

            this.stack = (new Error()).stack;

        }

    };

    // ERRORES

    InvalidArgumentException.prototype = Object.create(Error.prototype);

    InvalidArgumentException.prototype.name = "InvalidArgumentException";

    InvalidArgumentException.prototype.constructor = InvalidArgumentException;

		

    var cmds = {

        //LS: { value: "ls", help: configs.getInstance().ls_help },

       	CAT: { value: "cat", help: configs.getInstance().cat_help },

        //WHOAMI: { value: "whoami", help: configs.getInstance().whoami_help },

        //DATE: { value: "date", help: configs.getInstance().date_help },

        CLEAR: { value: "clear", help: configs.getInstance().clear_help },

        /*CD: { value: "cd", help: configs.getInstance().cd_help },

        MV: { value: "mv", help: configs.getInstance().mv_help },

        RM: { value: "rm", help: configs.getInstance().rm_help },

        RMDIR: { value: "rmdir", help: configs.getInstance().rmdir_help },

        TOUCH: { value: "touch", help: configs.getInstance().touch_help },

        SUDO: { value: "sudo", help: configs.getInstance().sudo_help },*/
		
		EL_JUEGO: { value: "show", help: configs.getInstance().el_juego_help},
		
		MUSA: { value: "musa", help: configs.getInstance().musa_help},

        EL_ESPECTÁCULO: { value: "espectáculo", help: configs.getInstance().el_espectáculo_help},

        JUEGO: { value: "videojuego", help: configs.getInstance().juego_help},

        FECHAS: { value: "fechas", help: configs.getInstance().fecha_help},

        LA_COMPAÑÍA: { value: "compañía", help: configs.getInstance().la_compañía_help},

        NEWSLETTER: { value: "newsletter", help: configs.getInstance().newsletter_help},

        IMAGENES: { value: "materiales", help: configs.getInstance().imagenes_help},

        ARTICULOS: { value: "artículos", help: configs.getInstance().articulos_help},

		//ATRAS: { value: "atras", help: configs.getInstance().el_proyecto_help},

		LIGA: { value: "liga", help: configs.getInstance().liga_help},
		
		CLASIFICACIÓN: { value: "clasificación", help: configs.getInstance().clasificacion_help},

		TEXTOS_DEL_MES: { value: "textos del mes", help: configs.getInstance().textos_del_mes_help},
		
		FINANCIACIÓN: { value: "financiación", help: configs.getInstance().financiación_help},
        
        ANGELA_BUENO: { value: "ángela bueno", help: configs.getInstance().la_compañía_help},

        DAVID_VIÑAS: { value: "david viñas", help: configs.getInstance().la_compañía_help},

		CONTACTO: { value: "contacto", help: configs.getInstance().contacto_help},

        ENTRADAS: { value: "navelart", help: configs.getInstance().la_compañía_help},

		REBOOT: { value: "reinicio", help: configs.getInstance().reboot_help },

		HELP: { value: "ayuda", help: configs.getInstance().help_help },

    };

    var primaryCommands = [
        cmds.JUEGO.value,
        cmds.EL_ESPECTÁCULO.value,
        cmds.FECHAS.value,
        cmds.IMAGENES.value,
        cmds.ARTICULOS.value,
        cmds.LA_COMPAÑÍA.value,
        cmds.NEWSLETTER.value,
        cmds.CONTACTO.value,
        cmds.REBOOT.value
    ];

    var articlePosts = [
        {
            title: "Ángela Bueno, directora de 'Sutura Teatro', explica el videojuego espectáculo que realizarán en el campus UC3M de Leganés.",
            dateLabel: "12 de febrero de 2024",
            excerpt: "Con motivo del Día Internacional de la Niña y la Mujer en la Ciencia, la UC3M acogió esta iniciativa interactiva que permitía al público participar jugando.",
            image: "https://cadenaser.com/resizer/v2/https%3A%2F%2Fsdmedia.playser.cadenaser.com%2Fplayser%2Fimage%2F20242%2F12%2F1707743102872_1707743242_asset_still.png?auth=f29873162c4cc7430b98911faecfda47a2558e05bfee2441bfcaba9b1c506524&quality=70&width=1200&height=675&smart=true",
            url: "https://cadenaser.com/audio/1707743102872/"
        },
        {
            title: "Entrevista: <SCRI> B, el videojuego de escritura que viene de Madrid",
            dateLabel: "25 de febrero de 2025",
            excerpt: "Escritura en Vivo conversa con Ángela Bueno y David Viñas sobre el origen, la tecnología y el futuro de <SCRI> B.",
            image: "https://i0.wp.com/escrituraenvivo.org/wp-content/uploads/2025/02/scrib_013.jpg?fit=1200%2C800&ssl=1",
            url: "https://escrituraenvivo.org/2025/02/25/entrevista-scrib-el-videojuego-de-escritura-que-viene-de-madrid/"
        },
        {
            title: "¡SCRIB viaja a Perú!",
            dateLabel: "10 de marzo de 2025",
            excerpt: "Viajamos por primera vez.",
            image: "https://substack-post-media.s3.amazonaws.com/public/images/c3d566bb-54b2-4a18-90b5-5fc75f385d49_1555x1466.png",
            url: "https://suturateatro.substack.com/p/scrib-viaja-a-peru-25-03-10"
        },
        {
            title: "¡Ahora cualquier persona puede jugar a <SCRI> B!",
            dateLabel: "23 de marzo de 2025",
            excerpt: "Tenemos que daros una increíble noticia en la que llevamos trabajando varios meses. Como algunos ya sabréis, <SCRI> B es tanto un videojuego como un espectáculo teatral interactivo.",
            image: "https://substackcdn.com/image/fetch/$s_!95GL!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1af693ac-9889-4b9c-b2c8-4afcb1a3d613_1920x1080.png",
            url: "https://suturateatro.substack.com/p/ahora-cualquier-persona-puede-jugar"
        },
        {
            title: "Y a mí, ¿qué me importa el teatro?",
            dateLabel: "8 de abril de 2025",
            excerpt: "Cuando te metes de lleno en ciertos mundos une puede llegar a engañarse a sí mismo de que la realidad es esa.",
            image: "https://substackcdn.com/image/fetch/$s_!gWXN!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff879ae79-4c1b-463d-b2b7-7132edee10bb_1126x749.jpeg",
            url: "https://suturateatro.substack.com/p/y-a-mi-que-me-importa-el-teatro"
        },
        {
            title: "El problema de la valoración objetiva de un texto",
            dateLabel: "5 de mayo de 2025",
            excerpt: "Los informáticos intentamos cuantificar todo si podemos. Dos ejemplos de ello ocurrieron en nuestro espectáculo-videojuego de escritura en vivo, <SCRI>B.",
            image: "https://substackcdn.com/image/fetch/$s_!Ax1_!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F48a8c602-0dd8-4463-8957-208d702ccc6a_6000x4000.jpeg",
            url: "https://suturateatro.substack.com/p/el-problema-de-la-valoracion-objetiva"
        },
        {
            title: "Los momentos personales",
            dateLabel: "3 de noviembre de 2025",
            excerpt: "Uno comprende esto cuando sale de casa de sus padres seguido de una patada o un beso.",
            image: "https://substackcdn.com/image/fetch/$s_!0ETc!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F10bac07f-43f0-4ca3-a129-93eff17053c4_1536x2048.jpeg",
            url: "https://suturateatro.substack.com/p/los-momentos-personales"
        },
        {
            title: "Si te gusta tener envidia, ven a ver <SCRI> B",
            dateLabel: "7 de enero de 2026",
            excerpt: "Creemos una metodología, un proceso creativo y no una obra.",
            image: "https://substackcdn.com/image/fetch/$s_!orKz!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa4c04e02-d35f-4c6e-92f8-d009469deab8_4096x2731.jpeg",
            url: "https://suturateatro.substack.com/p/si-te-gusta-tener-envidia-ven-a-ver"
        },
        {
            title: "<SCRI> B no es una obra maestra",
            dateLabel: "18 de marzo de 2026",
            excerpt: "Nuestro videojuego era un bebé en aquel entonces, ahora podríamos decir que está en una adolescencia insoportable en la que solo sabe pedir dinero y hacer lo que le sale del código fuente.",
            image: "https://substackcdn.com/image/fetch/$s_!NPHs!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8a92c91e-dbeb-476f-b7b0-dfb4dbf257e8_1600x792.png",
            url: "https://suturateatro.substack.com/p/scri-b-no-es-una-obra-maestra"
        }
    ];

    var materialVideos = [
        {
            title: "Desafíos en el proceso de gamificación y escenificación de la escritura: un acercamiento a SCRI B",
            videoId: "2qjU2iXXukM",
            watchUrl: "https://www.youtube.com/watch?v=2qjU2iXXukM&t=338s&pp=0gcJCcUKAYcqIYzv",
            embedUrl: "https://www.youtube.com/embed/2qjU2iXXukM",
            width: 1408,
            height: 480,
            orientation: "landscape"
        },
        {
            title: "Teaser de SCRIB",
            videoId: "TEC9ptrT0ZE",
            embedUrl: "https://www.youtube.com/embed/TEC9ptrT0ZE",
            watchUrl: "https://www.youtube.com/shorts/TEC9ptrT0ZE?feature=share",
            width: 315,
            height: 576,
            orientation: "portrait"
        },
        {
            title: "Festival MUTIS 2025: <SCRI> B",
            videoId: "aHiMZkNL_gQ",
            embedUrl: "https://www.youtube.com/embed/aHiMZkNL_gQ",
            watchUrl: "https://www.youtube.com/watch?v=aHiMZkNL_gQ",
            width: 853,
            height: 480,
            orientation: "landscape"
        }
    ];

    var materialReadings = [
        {
            title: "Dossier de <SCRI> B",
            description: "PDF con información del espectáculo, universo del proyecto y materiales de presentación.",
            href: "./archives/Dossier SCRIB.pdf"
        }
    ];

function log( text ) {

    $log = $('#log');

    //AÑADIR TEXTO PARA LOGEARSE

    $log.append(($log.val()?"":'')+ text );

    //Autoscroll

    $log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;

}

    var Terminal = function (prompt, cmdLine, output, sidenav, profilePic, user, host, root, outputTimer) {

        if (!(prompt instanceof Node) || prompt.nodeName.toUpperCase() !== "DIV") {

            throw new InvalidArgumentException("Invalid value " + prompt + " for argument 'prompt'.");

        }

        if (!(cmdLine instanceof Node) || cmdLine.nodeName.toUpperCase() !== "INPUT") {

            throw new InvalidArgumentException("Invalid value " + cmdLine + " for argument 'cmdLine'.");

        }

        if (!(output instanceof Node) || output.nodeName.toUpperCase() !== "DIV") {

            throw new InvalidArgumentException("Invalid value " + output + " for argument 'output'.");

        }

        if (!(sidenav instanceof Node) || sidenav.nodeName.toUpperCase() !== "DIV") {

            throw new InvalidArgumentException("Invalid value " + sidenav + " for argument 'sidenav'.");

        }

        if (!(profilePic instanceof Node) || profilePic.nodeName.toUpperCase() !== "IMG") {

            throw new InvalidArgumentException("Invalid value " + profilePic + " for argument 'profilePic'.");

        }

        (typeof user === "string" && typeof host === "string") && (this.completePrompt = user + "@" + host + ":~" + (root ? "#" : "$"));

        this.profilePic = profilePic;

        this.prompt = prompt;

        this.cmdLine = cmdLine;

        this.output = output;

        this.sidenav = sidenav;

        this.sidenavOpen = false;

        this.sidenavElements = [];

        this.typeSimulator = new TypeSimulator(outputTimer, output);

		this.pila = new Pila();

		this.pagina_actual = "reset";

        this.currentHistoryCommand = null;

        this.browserHistoryBound = false;

        this.browserHistoryEnabled = true;

        this.galleryLightbox = null;

        this.galleryLightboxImage = null;

        this.galleryLightboxCaption = null;

    };

    var galleryImages = [
        "ScriB_ 1.jpg",
        "ScriB_008.jpg",
        "ScriB_10.png",
        "ScriB_11.png",
        "ScriB_2.jpg",
        "ScriB_3.jpg",
        "ScriB_4.jpg",
        "ScriB_5.jpg",
        "ScriB_6.jpg",
        "ScriB_7.jpg",
        "ScriB_9.jpg"
    ];

    var tournamentTicketsUrl = "https://www.dinaticket.com/es/provider/18142/event/4940616";

    var scheduleSections = [
        {
            tone: "tournament",
            title: "🏆 TORNEO <SCRI> B 2026",
            subtitle: "📅 Calendario de Octavos",
            events: [
                {
                    date: "19 de marzo",
                    writers: "Majo vs Pablo",
                    performers: "Diego · Ana · Laura · Víctor",
                    time: "20:30 hrs.",
                    venue: "Espacio Hollywood",
                    address: "C. del Infante, 3, Madrid",
                    ticketUrl: tournamentTicketsUrl,
                    past: false
                },
                {
                    date: "9 de abril",
                    writers: "Miriam vs Irene",
                    performers: "Ari · Pablo · Judith · Diego",
                    time: "20:30 hrs.",
                    venue: "Espacio Hollywood",
                    address: "C. del Infante, 3, Madrid",
                    ticketUrl: tournamentTicketsUrl,
                    past: false
                },
                {
                    date: "23 de abril",
                    writers: "Teresa vs Maca",
                    performers: "Ari · Pablo · Judith · Diego",
                    time: "20:30 hrs.",
                    venue: "Espacio Hollywood",
                    address: "C. del Infante, 3, Madrid",
                    ticketUrl: tournamentTicketsUrl,
                    past: false
                },
                {
                    date: "7 de mayo",
                    writers: "Ángela vs Paula",
                    performers: "Ari · Pablo · Judith · Diego",
                    time: "20:30 hrs.",
                    venue: "Espacio Hollywood",
                    address: "C. del Infante, 3, Madrid",
                    ticketUrl: tournamentTicketsUrl,
                    past: false
                }
            ]
        },
        {
            tone: "showcase",
            title: "✨ EXHIBICIÓN",
            subtitle: "Funciones y muestras especiales",
            events: [
                {
                    date: "27 de febrero de 2026",
                    time: "20:00 hrs.",
                    venue: "Sala Exlímite",
                    address: "C. Primitiva Gañán, 5, Usera, 28026 Madrid",
                    past: true
                },
                {
                    date: "27 de marzo de 2026",
                    time: "20:00 hrs.",
                    venue: "Sala Exlímite",
                    address: "C. Primitiva Gañán, 5, Usera, 28026 Madrid",
                    ticketUrl: "https://exlimite.com/eventos/scri/",
                    past: false
                },
                {
                    date: "15 de noviembre de 2025",
                    time: "19:00 hrs.",
                    venue: "Sala Exlímite",
                    address: "C. Primitiva Gañán, 5, Usera, 28026 Madrid",
                    past: true
                },
                {
                    date: "28 de marzo de 2025",
                    time: "19:00 hrs.",
                    venue: "Sala NavelArt",
                    past: true
                }
            ]
        }
    ];



    Terminal.prototype.type = function (text, callback) {

				this.no_writing = false;

        this.typeSimulator.type(normalizeScribBrand(text), function () {

            this.decorateOutputCommandList();

            if (callback) {

                callback();

            }

        }.bind(this));

		

    };



    Terminal.prototype.exec = function () {

        var command = this.cmdLine.value;

        this.cmdLine.value = "";

        this.prompt.textContent = "";

		

        this.output.innerHTML += "<span class=\"prompt-color\">" + this.completePrompt + "</span> " + command + "<br/>";

    };



    Terminal.prototype.init = function () {

        this.sidenav.addEventListener("click", ignoreEvent);

        this.cmdLine.disabled = true;

        this.sidenavElements.forEach(function (elem) {

            elem.disabled = true;

        });

        this.prepareSideNav();

        this.lock(); // NECESARIO PARA BLOQUEAR DESDE QUE LOS ELEMENTOS DEL SIDENAV HAN SIDO AÑADIDOS AHORA

        document.body.addEventListener("click", function (event) {

            if (this.sidenavOpen) {

                this.handleSidenav(event);

            }

            //Hace que se focalice en la linea de comandos cuando termina de ejecutar el último comando o al empezar

			this.focus();

        }.bind(this));

        this.cmdLine.addEventListener("keydown", function (event) {

            if (event.which === 13 || event.keyCode === 13) {

				//Si estoy escribiendo

				if(this.no_writing== true){

					this.handleCmd();

					

                ignoreEvent(event);

						

				

				}

                else if(this.no_writing== false){

								



					

             			

				}

            } else if (event.which === 9 || event.keyCode === 9) {

				if(!this.no_writing){

					this.handleFill();

                ignoreEvent(event);

						

				

				}

                else if(this.no_writing){

								output.innerHTML += ("");

					this.no_writing = false;

				}

            }

        }.bind(this));

        this.bindBrowserHistory();

        if (this.browserHistoryEnabled && window.history && window.history.state && typeof window.history.state.terminalCommand === "string") {

            this.renderBrowserHistoryState(window.history.state.terminalCommand);

        } else {

            this.updateBrowserHistoryState(null, { replace: true });
            this.reset();

        }

    };



    Terminal.makeElementDisappear = function (element) {

        element.style.opacity = 0;

        element.style.transform = "translateX(-300px)";

    };



    Terminal.makeElementAppear = function (element) {

        element.style.opacity = 1;

        element.style.transform = "translateX(0)";

    };



    Terminal.prototype.prepareSideNav = function () {

        var capFirst = (function () {

            return function (string) {

                return string.charAt(0).toUpperCase() + string.slice(1);

            }

        })();

        for (var file in files.getInstance()) {

            var element = document.createElement("button");

            Terminal.makeElementDisappear(element);

            element.onclick = function (file, event) {

                this.handleSidenav(event);

                this.cmdLine.value = "cat " + file + " ";

                this.handleCmd();

            }.bind(this, file);

            element.appendChild(document.createTextNode(capFirst(file.replace(/\.[^/.]+$/, "").replace(/_/g, " "))));

            this.sidenav.appendChild(element);

            this.sidenavElements.push(element);

        }

        document.getElementById("sidenavBtn").addEventListener("click", this.handleSidenav.bind(this));

    };

    Terminal.prototype.buildOutputCommandMarkup = function (command) {

        return "<span class=\"output-command-entry\"><span class=\"output-command-bullet\">•</span> <button type=\"button\" class=\"output-command-link\" data-command=\"" + command + "\">" + command + "</button></span>";

    };

    Terminal.prototype.buildInlineCommandMarkup = function (command) {

        return "<span class=\"output-command-inline\">«<button type=\"button\" class=\"output-command-link output-command-link--inline\" data-command=\"" + command + "\">" + command + "</button>»</span>";

    };

    Terminal.prototype.buildGalleryMarkup = function () {

        return "<div class=\"output-gallery\">" + galleryImages.map(function (fileName, index) {

            var assetPath = "./img/gallery/" + encodeURIComponent(fileName);
            var altText = normalizeScribBrand("Galería SCRIB " + (index + 1));

            return "<a class=\"output-gallery-item\" href=\"" + assetPath + "\" data-caption=\"" + escapeHTML(altText) + "\"><img class=\"output-gallery-image\" src=\"" + assetPath + "\" alt=\"" + escapeHTML(altText) + "\" loading=\"lazy\"></a>";

        }).join("") + "</div>";

    };

    Terminal.prototype.buildMaterialVideosMarkup = function () {

        var useYoutubeFallback = window.location.protocol === "file:";

        return "<div class=\"output-video-grid\">" + materialVideos.map(function (video) {

            var orientationClassName = "output-video-card--" + video.orientation;
            var aspectRatio = video.width + " / " + video.height;

            if (useYoutubeFallback) {

                return "<a class=\"output-video-card output-video-card--fallback " + orientationClassName + "\" href=\"" + video.watchUrl + "\" target=\"_blank\" rel=\"noreferrer noopener\">" +
                    "<span class=\"output-video-preview\"><img class=\"output-video-thumb\" src=\"https://i.ytimg.com/vi/" + video.videoId + "/hqdefault.jpg\" alt=\"" + escapeHTML(video.title) + "\" loading=\"lazy\" style=\"aspect-ratio: " + aspectRatio + ";\"></span>" +
                    "<span class=\"output-video-title\">" + escapeHTML(video.title) + "</span>" +
                "</a>";

            }

            return "<article class=\"output-video-card " + orientationClassName + "\">" +
                "<iframe class=\"output-video-frame\" width=\"" + video.width + "\" height=\"" + video.height + "\" src=\"" + video.embedUrl + "\" title=\"" + escapeHTML(video.title) + "\" frameborder=\"0\" loading=\"lazy\" referrerpolicy=\"strict-origin-when-cross-origin\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen style=\"aspect-ratio: " + aspectRatio + ";\"></iframe>" +
                "<div class=\"output-video-title\">" + escapeHTML(video.title) + "</div>" +
            "</article>";

        }.bind(this)).join("") + "</div>";

    };

    Terminal.prototype.buildMaterialsMarkup = function () {

        return "<div class=\"output-materials-layout\">" +
            "<section class=\"output-materials-section\">" +
                "<div class=\"output-materials-heading\">📸 Imágenes</div>" +
                this.buildGalleryMarkup() +
            "</section>" +
            "<section class=\"output-materials-section\">" +
                "<div class=\"output-materials-heading\">🎬 Vídeos</div>" +
                this.buildMaterialVideosMarkup() +
            "</section>" +
            "<section class=\"output-materials-section\">" +
                "<div class=\"output-materials-heading\">📚 Lecturas</div>" +
                this.buildMaterialReadingsMarkup() +
            "</section>" +
        "</div>";

    };

    Terminal.prototype.buildMaterialReadingsMarkup = function () {

        return "<div class=\"output-reading-grid\">" + materialReadings.map(function (reading) {

            return "<a class=\"output-reading-card\" href=\"" + reading.href + "\" target=\"_blank\" rel=\"noreferrer noopener\">" +
                "<span class=\"output-reading-title\">" + escapeHTML(reading.title) + "</span>" +
                "<span class=\"output-reading-description\">" + escapeHTML(reading.description) + "</span>" +
            "</a>";

        }).join("") + "</div>";

    };

    Terminal.prototype.buildArticlesMarkup = function () {

        return "<div class=\"article-mosaic\">" + articlePosts.slice().reverse().map(function (article) {

            return "<a class=\"article-card\" href=\"" + article.url + "\" target=\"_blank\" rel=\"noreferrer noopener\">" +
                "<span class=\"article-card__media\"><img class=\"article-card__image\" src=\"" + article.image + "\" alt=\"" + escapeHTML(article.title) + "\" loading=\"lazy\"></span>" +
                "<span class=\"article-card__body\">" +
                    "<span class=\"article-card__date\">" + escapeHTML(article.dateLabel) + "</span>" +
                    "<span class=\"article-card__title\">" + escapeHTML(article.title) + "</span>" +
                    "<span class=\"article-card__excerpt\">" + escapeHTML(article.excerpt) + "</span>" +
                "</span>" +
            "</a>";

        }).join("") + "</div>";

    };

    Terminal.prototype.initGalleryLightbox = function () {

        if (this.galleryLightbox) {

            return;

        }

        this.galleryLightbox = document.createElement("div");
        this.galleryLightbox.className = "output-lightbox output-lightbox--hidden";
        this.galleryLightbox.innerHTML = "<div class=\"output-lightbox__dialog\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Imagen ampliada\"><button type=\"button\" class=\"output-lightbox__close\" aria-label=\"Cerrar imagen\">×</button><img class=\"output-lightbox__image\" alt=\"\"><div class=\"output-lightbox__caption\"></div></div>";

        document.body.appendChild(this.galleryLightbox);

        this.galleryLightboxImage = this.galleryLightbox.querySelector(".output-lightbox__image");
        this.galleryLightboxCaption = this.galleryLightbox.querySelector(".output-lightbox__caption");

        this.galleryLightbox.addEventListener("click", function (event) {

            event.stopPropagation();

            if (event.target === this.galleryLightbox || event.target.classList.contains("output-lightbox__close")) {

                ignoreEvent(event);

                this.closeGalleryLightbox();

            }

        }.bind(this));

        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape" && this.galleryLightbox && !this.galleryLightbox.classList.contains("output-lightbox--hidden")) {

                this.closeGalleryLightbox();

            }

        }.bind(this));

    };

    Terminal.prototype.openGalleryLightbox = function (src, caption) {

        this.initGalleryLightbox();

        this.galleryLightboxImage.setAttribute("src", src);
        this.galleryLightboxImage.setAttribute("alt", caption || "Imagen ampliada");
        this.galleryLightboxCaption.textContent = caption || "";
        this.galleryLightbox.classList.remove("output-lightbox--hidden");
        document.body.classList.add("output-lightbox-open");

    };

    Terminal.prototype.closeGalleryLightbox = function () {

        if (!this.galleryLightbox) {

            return;

        }

        this.galleryLightbox.classList.add("output-lightbox--hidden");
        this.galleryLightboxImage.removeAttribute("src");
        this.galleryLightboxImage.setAttribute("alt", "");
        this.galleryLightboxCaption.textContent = "";
        document.body.classList.remove("output-lightbox-open");

    };

    Terminal.prototype.buildScheduleCardMarkup = function (event, tone) {

        var cardClassName = "schedule-card schedule-card--" + tone + (event.past ? " schedule-card--past" : "");
        var ticketMarkup = "";

        if (event.ticketUrl) {

            ticketMarkup = "<a class=\"output-text-link schedule-card__ticket\" href=\"" + event.ticketUrl + "\" target=\"_blank\" rel=\"noreferrer noopener\"><span class=\"schedule-card__ticket-icon\">🎟️</span> <span class=\"schedule-card__ticket-label\">Entradas</span></a>";

        } else if (event.ticketLabel) {

            ticketMarkup = "<div class=\"schedule-card__ticket schedule-card__ticket--pending\">" + escapeHTML(event.ticketLabel) + "</div>";

        }

        return "<article class=\"" + cardClassName + "\">" +
            "<div class=\"schedule-card__body\">" +
                "<div class=\"schedule-card__date\">📅 " + escapeHTML(event.date) + "</div>" +
                (event.writers ? "<div class=\"schedule-card__meta\"><strong>✍️ Escritores/as:</strong> " + escapeHTML(event.writers) + "</div>" : "") +
                (event.performers ? "<div class=\"schedule-card__meta\"><strong>🎭 Intérpretes:</strong> " + escapeHTML(event.performers) + "</div>" : "") +
                "<div class=\"schedule-card__meta\"><strong>🕒 Hora:</strong> " + escapeHTML(event.time) + "</div>" +
                "<div class=\"schedule-card__meta\"><strong>📍 Espacio:</strong> " + escapeHTML(event.venue) + "</div>" +
                (event.address ? "<div class=\"schedule-card__address\">" + escapeHTML(event.address) + "</div>" : "") +
            "</div>" +
            ticketMarkup +
        "</article>";

    };

    Terminal.prototype.buildScheduleMarkup = function () {

        return "<div class=\"schedule-layout\">" + scheduleSections.map(function (section) {

            return "<section class=\"schedule-section schedule-section--" + section.tone + "\">" +
                "<div class=\"schedule-section__header\">" +
                    "<div class=\"schedule-section__title\">" + escapeHTML(section.title) + "</div>" +
                    "<div class=\"schedule-section__subtitle\">" + escapeHTML(section.subtitle) + "</div>" +
                "</div>" +
                "<div class=\"schedule-grid\">" + section.events.map(function (event) {

                    return this.buildScheduleCardMarkup(event, section.tone);

                }.bind(this)).join("") + "</div>" +
            "</section>";

        }.bind(this)).join("") + "</div>";

    };

    Terminal.prototype.bindOutputCommandLinks = function () {

        if (this.output.dataset.commandDelegationBound === "true") {

            return;

        }

        this.output.dataset.commandDelegationBound = "true";

        this.output.addEventListener("click", function (event) {

            var element = event.target;

            while (element && element !== this.output) {

                if (element.classList && element.classList.contains("output-command-link")) {

                    ignoreEvent(event);

                    this.runQuickCommand(element.getAttribute("data-command"));

                    return;

                }

                if (element.classList && element.classList.contains("output-gallery-item")) {

                    ignoreEvent(event);

                    this.openGalleryLightbox(element.getAttribute("href"), element.getAttribute("data-caption"));

                    return;

                }

                element = element.parentNode;

            }

        }.bind(this));

    };

    Terminal.prototype.decorateOutputCommandList = function () {

        var html = this.output.innerHTML;

        html = html.replace(
            /(^|<br\s*\/?>)\#\s([^<]+?)(?=<br\s*\/?>|$)/g,
            function (match, prefix, title) {

                return prefix + "<div class=\"output-title\">" + title.trim() + "</div>";

            }
        );

        primaryCommands.forEach(function (command) {

            html = html.replace(new RegExp("•\\s*" + escapeRegExp(command), "g"), this.buildOutputCommandMarkup(command));

        }.bind(this));

        html = html.replace(
            /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
            function (match, label, href) {

                return "<a class=\"output-text-link\" href=\"" + href + "\" target=\"_blank\" rel=\"noreferrer noopener\">" + label + "</a>";

            }
        );

        html = html.replace(
            /~~(.*?)~~/g,
            "<span class=\"output-strikethrough\">$1</span>"
        );

        [cmds.REBOOT.value, cmds.DAVID_VIÑAS.value, cmds.ANGELA_BUENO.value, cmds.HELP.value].forEach(function (command) {

            html = html.replace(
                new RegExp("(el comando\\s+)(?:\"|«)\\s*(?:<strong>)?" + escapeRegExp(command) + "(?:<\\/strong>)?\\s*(?:\"|»)", "gi"),
                function (match, prefix) {

                    return prefix + this.buildInlineCommandMarkup(command);

                }.bind(this)
            );

        }.bind(this));

        this.output.innerHTML = html;

        this.bindOutputCommandLinks();

    };

    Terminal.prototype.runQuickCommand = function (command) {

        if (this.cmdLine.disabled || this.cmdLine.readOnly) {

            return;

        }

        if (this.handleDirectNavigation(command)) {

            return;

        }

        this.no_writing = true;

        this.cmdLine.value = command;

        this.focus();

        var executeCommand = function () {

            this.handleCmd();

        }.bind(this);

        if (window.requestAnimationFrame) {

            window.requestAnimationFrame(executeCommand);

        } else {

            setTimeout(executeCommand, 0);

        }

    };

    Terminal.prototype.handleDirectNavigation = function (command) {

        var normalizedCommand = command.toLowerCase().trim();

        switch (normalizedCommand) {

            case cmds.JUEGO.value:
            case "juego":
                location.href = "./1p_scrib/index.html";
                return true;

            case cmds.NEWSLETTER.value:
                window.open("https://suturateatro.substack.com/subscribe", "_blank", "noopener,noreferrer");
                return true;

            default:
                return false;

        }

    };

    Terminal.prototype.updateBrowserHistoryState = function (command, options) {

        if (!this.browserHistoryEnabled || !window.history || !window.history.pushState) {

            return;

        }

        var historyCommand = command || "__home__";
        var state = { terminalCommand: historyCommand };

        try {

            if (options && options.replace) {

                window.history.replaceState(state, "", window.location.href);

            } else if (this.currentHistoryCommand !== historyCommand) {

                window.history.pushState(state, "", window.location.href);

            }

            this.currentHistoryCommand = historyCommand;

        } catch (error) {

            this.browserHistoryEnabled = false;

        }

    };

    Terminal.prototype.renderBrowserHistoryState = function (command) {

        var historyCommand = command || "__home__";

        if (this.typeSimulator && this.typeSimulator.cancel) {

            this.typeSimulator.cancel();

        }

        this.currentHistoryCommand = historyCommand;

        if (historyCommand === "__home__") {

            this.reset();
            return;

        }

        this.executeTerminalCommand(historyCommand, { recordHistory: false });

    };

    Terminal.prototype.bindBrowserHistory = function () {

        if (!this.browserHistoryEnabled || !window.history || !window.history.pushState || this.browserHistoryBound) {

            return;

        }

        this.browserHistoryBound = true;

        window.addEventListener("popstate", function (event) {

            var state = event.state && typeof event.state.terminalCommand === "string" ? event.state.terminalCommand : "__home__";

            this.renderBrowserHistoryState(state);

        }.bind(this));

    };

    Terminal.prototype.executeTerminalCommand = function (command, options) {

        var normalizedCommand = command.toLowerCase().trim();
        var shouldRecordHistory = !options || options.recordHistory !== false;
        var remember = function (historyCommand) {

            if (shouldRecordHistory) {

                this.updateBrowserHistoryState(historyCommand);

            }

        }.bind(this);

        switch (normalizedCommand) {

            case cmds.CAT.value:
                this.cat(normalizedCommand);
                break;

            case cmds.HELP.value:
                remember(cmds.HELP.value);
                this.help();
                break;

            case cmds.CLEAR.value:
                this.clear();
                break;

            case cmds.REBOOT.value:
                remember(null);
                this.reboot();
                break;

            case cmds.EL_JUEGO.value:
                this.el_juego();
                break;

            case cmds.MUSA.value:
                this.musa();
                break;

            case cmds.EL_ESPECTÁCULO.value:
                remember(cmds.EL_ESPECTÁCULO.value);
                this.el_espectáculo();
                break;

            case cmds.LIGA.value:
                remember(cmds.LIGA.value);
                this.liga();
                break;

            case cmds.CLASIFICACIÓN.value:
                remember(cmds.CLASIFICACIÓN.value);
                this.clasificación();
                break;

            case cmds.TEXTOS_DEL_MES.value:
                remember(cmds.TEXTOS_DEL_MES.value);
                this.textos_del_mes();
                break;

            case cmds.FECHAS.value:
                remember(cmds.FECHAS.value);
                this.fechas();
                break;

            case cmds.FINANCIACIÓN.value:
                remember(cmds.FINANCIACIÓN.value);
                this.financiación();
                break;

            case cmds.IMAGENES.value:
            case "imágenes":
            case "imagenes":
                remember(cmds.IMAGENES.value);
                this.materiales();
                break;

            case cmds.ARTICULOS.value:
            case "articulos":
                remember(cmds.ARTICULOS.value);
                this.articulos();
                break;

            case cmds.LA_COMPAÑÍA.value:
                remember(cmds.LA_COMPAÑÍA.value);
                this.la_compañía();
                break;

            case cmds.ANGELA_BUENO.value:
                remember(cmds.ANGELA_BUENO.value);
                this.angela_bueno();
                break;

            case cmds.DAVID_VIÑAS.value:
                remember(cmds.DAVID_VIÑAS.value);
                this.david_viñas();
                break;

            case cmds.CONTACTO.value:
                remember(cmds.CONTACTO.value);
                this.contacto();
                break;

            case cmds.ENTRADAS.value:
                this.entradas();
                break;

            default:
                this.invalidCommand(normalizedCommand);
                break;

        }

    };



    Terminal.prototype.handleSidenav = function (event) {

        if (this.sidenavOpen) {

            this.profilePic.style.opacity = 0;

            this.sidenavElements.forEach(Terminal.makeElementDisappear);

            this.sidenav.style.width = "50px";

            document.getElementById("sidenavBtn").innerHTML = "☰";

            this.sidenavOpen = false;

        } else {

            this.sidenav.style.width = "300px";

            this.sidenavElements.forEach(Terminal.makeElementAppear);

            document.getElementById("sidenavBtn").innerHTML = "×";

            this.profilePic.style.opacity = 1;

            this.sidenavOpen = true;

        }

        document.getElementById("sidenavBtn").blur();

        ignoreEvent(event);

    };



    Terminal.prototype.lock = function () {

        this.exec();

        this.cmdLine.blur();

        this.cmdLine.disabled = true;

        this.sidenavElements.forEach(function (elem) {

            elem.disabled = true;

        });

    };



    Terminal.prototype.unlock = function () {

        this.cmdLine.disabled = false;

        this.no_writing = true;

        this.prompt.textContent = this.completePrompt;

        this.sidenavElements.forEach(function (elem) {

            elem.disabled = false;

        });

        //scrollToBottom();

        this.focus();

    };



    Terminal.prototype.handleFill = function () {

		 this.no_writing = false;

        var cmdComponents = this.cmdLine.value.trim().split("Ç");

        if ((cmdComponents.length <= 1) || (cmdComponents.length === 2 && cmdComponents[0] === cmds.CAT.value)) {

            this.lock();

            var possibilities = [];

            if (cmdComponents[0].toLowerCase() === cmds.CAT.value) {

                if (cmdComponents.length === 1) {

                    cmdComponents[1] = "";

                }

                if (configs.getInstance().welcome_file_name.startsWith(cmdComponents[1].toLowerCase())) {

                    possibilities.push(cmds.CAT.value + " " + configs.getInstance().welcome_file_name);

                }

                for (var file in files.getInstance()) {

                    if (file.startsWith(cmdComponents[1].toLowerCase())) {

	

                        possibilities.push(cmds.CAT.value + " " + file);

                    }

                }

            } else {

                for (var command in cmds) {

                    if (cmds[command].value.startsWith(cmdComponents[0].toLowerCase())) {

						if(cmds[command].value=="clear" ||cmds[command].value=="cat") {

							

						}

						else{

                        possibilities.push(cmds[command].value);

						}

                    }

                }

            }

            if (possibilities.length === 1) {

                this.cmdLine.value = possibilities[0] + " ";

                this.unlock();

            } else if (possibilities.length > 1) {

                this.type(possibilities.join("\n"), function () {

                    this.cmdLine.value = cmdComponents.join(" ");

                    this.unlock();

                }.bind(this));

            } else {

                this.cmdLine.value = cmdComponents.join(" ");

                this.unlock();

            }

        }

    };



    Terminal.prototype.handleCmd = function () {

        var cmdComponents = this.cmdLine.value.toLowerCase().trim();

        if (this.handleDirectNavigation(cmdComponents)) {

            this.cmdLine.value = "";

            return;

        }

        this.lock();

        if (cmdComponents === "bolzano") {

            this.bolzano();
            return;

        }

        if (cmdComponents === "bolzano control") {

            this.bolzano_control();
            return;

        }

        if (cmdComponents === "bolzano musa") {

            this.bolzano_musa();
            return;

        }

        this.executeTerminalCommand(cmdComponents, { recordHistory: true });
        return;

					

		

        switch (cmdComponents) {

            case "bolzano":

                this.bolzano();

                break;

            case "bolzano control":

                this.bolzano_control();

                break;

            case "bolzano musa":

                this.bolzano_musa();

                break;

            case cmds.CAT.value:

                this.cat(cmdComponents);

                break;/*

            case cmds.LS.value:

                this.ls();

                break;

            case cmds.WHOAMI.value:

                this.whoami();

                break;

            case cmds.DATE.value:

                this.date();

                break;*/

            case cmds.HELP.value:

                this.help();

                break;

            case cmds.CLEAR.value:

                this.clear();

                break;

				

            case cmds.REBOOT.value:

                this.reboot();

                break;

				/*

            case cmds.CD.value:

            case cmds.MV.value:

            case cmds.RMDIR.value:

            case cmds.RM.value:

            case cmds.TOUCH.value:

                this.permissionDenied(cmdComponents);

                break;

            case cmds.SUDO.value:

                this.sudo();

                break;

				*/

			/*case cmds.ATRAS.value:

                this.atras();

                break;*/
			case cmds.EL_JUEGO.value:

                this.el_juego();

                break;
				
            case cmds.JUEGO.value:
            case "juego":

                this.juego();

                break;

                case cmds.MUSA.value:

                this.musa();

                break;

			case cmds.EL_ESPECTÁCULO.value:

                this.el_espectáculo();

                break;

			case cmds.LIGA.value:

                this.liga();

                break;

			case cmds.CLASIFICACIÓN.value:

                this.clasificación();

                break;

			case cmds.TEXTOS_DEL_MES.value:

                this.textos_del_mes();

                break;

			case cmds.FECHAS.value:

                this.fechas();

                break;
				
			case cmds.FINANCIACIÓN.value:

                this.financiación();

                break;

            case cmds.NEWSLETTER.value:

                this.newsletter();

                break;

            case cmds.IMAGENES.value:
            case "imágenes":
            case "imagenes":

                this.materiales();

                break;

            case cmds.ARTICULOS.value:
            case "articulos":

                this.articulos();

                break;

			case cmds.LA_COMPAÑÍA.value:

                this.la_compañía();

                break;

            case cmds.ANGELA_BUENO.value:

                this.angela_bueno();

                break;

            case cmds.DAVID_VIÑAS.value:

                this.david_viñas();

                break;

			case cmds.CONTACTO.value:

                this.contacto();

                break;

            case cmds.ENTRADAS.value:

            this.entradas();

            break;

            default:

                this.invalidCommand(cmdComponents);

                break;

        };

	

    };



    Terminal.prototype.cat = function (cmdComponents) {

        var result;

        if (cmdComponents.length <= 1) {

            result = configs.getInstance().usage + ": " + cmds.CAT.value + " <" + configs.getInstance().file + ">";

        } else if (!cmdComponents[1] || (!cmdComponents[1] === configs.getInstance().welcome_file_name || !files.getInstance().hasOwnProperty(cmdComponents[1]))) {

            result = configs.getInstance().file_not_found.replace(configs.getInstance().value_token, cmdComponents[1]);

        } else {

            result = cmdComponents[1] === configs.getInstance().welcome_file_name ? configs.getInstance().welcome : files.getInstance()[cmdComponents[1]];

        }

              

			this.type(result, this.unlock.bind(this));

			       

    };

/*

    Terminal.prototype.ls = function () {

        var result = ".\n..\n" + configs.getInstance().welcome_file_name + "\n";

        for (var file in files.getInstance()) {

            result += file + "\n";

        }

        this.type(result.trim(), this.unlock.bind(this));

    };



    Terminal.prototype.sudo = function () {

        this.type(configs.getInstance().sudo_message, this.unlock.bind(this));

    }

	*/

	//ATRAS

	   /* Terminal.prototype.atras = function () {

			this.clear();

		this.atras = true;

			if(this.pila._size <= 0){

					eval("this."+"reset"+"()");

				this.pila._size = 0;

			}

			

			else{

			

			this.output.innerHTML += ("aaaaaah"+this.pila._size);

				eval("this."+this.pila.pop()+"()");



			}

			

    }*/

	//EL JUEGO

	    Terminal.prototype.el_juego = function () {
			
			this.clear();
			
			 var result = "**Se te ha redirigido al videojuego SCRIB.**\n\n\nPara volver al menú, utiliza el comando «reinicio».";

			var output = this.output;

			this.type(result, this.unlock.bind(this));
			
			location.href='./game/index.html';
    }
		
	//MUSA

	    Terminal.prototype.musa = function () {
			
			this.clear();
			
			 var result = "**Te has convertido en musa.**\n\n\nPara volver al menú, utiliza el comando «reinicio».";

			var output = this.output;

			this.type(result, this.unlock.bind(this));
			
			location.href='./game/public/index.html';

    }

    //BOLZANO (COMANDO OCULTO)

        Terminal.prototype.bolzano = function () {

            this.clear();

            var result = "**Abriendo menú oculto BOLZANO.**\n\nElige **CONTROL** o **MUSA**.";

            this.type(result, this.unlock.bind(this));

            location.href='./game/bolzano/index.html';

    }

        Terminal.prototype.bolzano_control = function () {

            this.clear();

            var result = "**Abriendo BOLZANO en modo CONTROL.**";

            this.type(result, this.unlock.bind(this));

            location.href='./game/bolzano/index.html?modo=control';

    }

        Terminal.prototype.bolzano_musa = function () {

            this.clear();

            var result = "**Abriendo BOLZANO en modo MUSA.**";

            this.type(result, this.unlock.bind(this));

            location.href='./game/bolzano/index.html?modo=musa';

    }


	//EL ESPECTÁCULO

	    Terminal.prototype.el_espectáculo = function () {
			
			this.clear();
			var result ="# ¿QUÉ ES SCRIB?\n\nEn cada velada **dos equipos** (el **equipo rojo** y el **equipo azul**) se enfrentan por escribir **el mejor texto dramático de la noche**.\n\nCada bando se compone, por un lado, de **dos dramaturgos/as** seleccionados/as previamente que, a la vez que libran la encarnizada batalla de escritura, intentan vencer todos los desafíos que les propone **nuestro videojuego**.\n\nEstos no están solos, ya que el **público**, en su papel de **musa**, interactúa mediante su teléfono móvil de diversas maneras para ofrecer soluciones creativas y evitar el bloqueo del escritor/a que haya elegido inspirar.\n\nComo guinda, la última parte del equipo. Tanto el team rojo como el azul cuentan con **un elenco actoral** que, aislado del escenario, ha estado preparando de manera simultánea el montaje de los textos. Un montaje con diseño de iluminación, sonido en escena, atrezzo... Todo lo necesario para que brille lo escrito.\n\nFinalmente, **el jurado** decide qué equipo ha demostrado mayor cooperación.\n\n\nPara volver al menú, utiliza el comando «reinicio».";

		        var output = this.output;
			output.innerHTML += ("<center><img style='max-width:100%;width:70%;height:auto;' src='./img/scrib.png'></center>"+ "<br><br/>");
			this.type(result, this.unlock.bind(this));
    }

    //JUEGO

    Terminal.prototype.juego = function () {
        
        location.href='./1p_scrib/index.html';
        
}

    //FECHAS

					

    Terminal.prototype.fechas = function () {

			

        this.clear();

        var output = this.output;

        this.type("# FECHAS", function () {

            output.innerHTML += "<br/>" + this.buildScheduleMarkup() + "<br/><br/>";
            this.type("Para volver al menú, utiliza el comando «reinicio».", this.unlock.bind(this));

        }.bind(this));

}

    //DOSSIER

    Terminal.prototype.dossier = function () {

        this.clear();
        
         var result = "**Se te ha descargado el dossier del espectáculo SCRIB.**\n\n\nPara volver al menú, utiliza el comando «reinicio»";

        var output = this.output;

        this.type(result, this.unlock.bind(this));
        
        location.href='./archives/Dossier SCRIB.pdf';
        
    }

	//LIGA

	    Terminal.prototype.liga = function () {

			this.clear();



						 var output = this.output;

         var result = "# LIGA\n\n\u2022 **Sistema de clasificación**\n\nOcho participantes, cuatro rondas. Las personas con mejor puntuación se enfrentan en la final. La persona ganadora de la noche recibe **3 puntos**, la finalista **2 puntos**, y el resto de participantes **1 punto**.\n\nDurante la temporada, las participantes irán acumulando puntuaciones y al final de la temporada en junio se considerará **Campeona** a la persona mejor clasificada.\n\nLa ganadora puede recibir **un obsequio simbólico**.\n\n\u2022 **Cómo participar**\n\nEscribiendo un correo a **scribaleatorio@gmail.com** con el asunto **Liga SCRIB [mes]**.\n\nSolo se tendrán en cuenta los correos para participar en el mes siguiente a partir de las 0:00 del evento de liga del mes actual.\n\n\u2022 **Consideraciones**\n\nCualquier comportamiento fraudulento en el juego por parte de las participantes será motivo de **descalificación**.\n\n\nPara volver al menú, utiliza el comando «reinicio».";

			this.type(result, this.unlock.bind(this));

			if(this.atras == false){

			this.pila.push(this.pagina_actual);

			this.pagina_actual = "liga";

			}

    }

	//CLASIFICACIÓN

					

	    Terminal.prototype.clasificación = function () {

			

						this.clear();

			if(this.atras = false){

			this.pila.push(this.pagina_actual);

			this.pagina_actual = "clasificación";

			}
		var output = this.output;

			output.innerHTML += ("<div class=\"output-title\">CLASIFICACIÓN</div><ul class=leaders><li><span>LAURA</span><span>4 pts 🏅🏆</span><li><span>COGE-CAJAS</span><span>4 pts 🏆🏅</span><li><span>QUIQUE</span><span>3 pts 🏆</span><li><span>PIOLÍN LÉSBICO</span><span>3 pts 🏆</span><li><span>MARÍA</span><span>1 pto ✒️</span><li><span>FONT</span><span>1 pto ✒️</span><li><span>TABACHKOVA</span><span>1 pto ✒️</span><li><span>PEDRO</span><span>1 pto ✒️</span><li><span>GOTHAMA</span><span>1 pto ✒️</span></ul><strong>Leyenda:</strong><br>\u2022🏆 Ganadore (+3)<br>\u2022🏅 Finalista (+2)<br>\u2022✒️ Participante (+1)");
			
		var result = "\n\nPara volver al menú, utiliza el comando «reinicio».";

			this.type(result, this.unlock.bind(this));

    }

	//TEXTOS DEL MES

					

	    Terminal.prototype.textos_del_mes = function () {

			

						this.clear();

         var result = "# TEXTOS DEL MES\n\nAquí irían los textos del mes.\n\n\nPara volver al menú, utiliza el comando «reinicio».";

			this.type(result, this.unlock.bind(this));

    }

		//FINANCIACIÓN
		
		Terminal.prototype.financiación = function () {

			this.clear();
			
			 var result = "# FINANCIACIÓN Y PATROCINADORES\n\n**¡Buscamos financiación!**\n\nDebido a que somos una compañía joven, los costos de producción del espectáculo nos superan. Son muchas las horas que se han dedicado para que SCRIB haya sido posible, pero todavía nos queda mucho por hacer.\n\nHasta la fecha, nuestros patrocinadores han sido **la editorial Así Lo Dijo Casimiro Parker**, **Enrique Brossa** y **Aleatorio Bar**.\n\n**¿Te animas a contribuir?**\n\n\nPara volver al menú, utiliza el comando «reinicio».";

			this.type(result, this.unlock.bind(this));
			
    }

//NEWSLETTER
		
    Terminal.prototype.newsletter = function () {
       
       window.open("https://suturateatro.substack.com/subscribe", "_blank", "noopener,noreferrer");
        
        
}

	//LA COMPAÑIA
		
		Terminal.prototype.la_compañía = function () {

			this.clear();
			
			 var result = "# ¿QUIÉNES SOMOS?\n\n**Sutura Teatro** es una compañía emergente nacida en **2019**. Se define en la clave de la hibridación entre arte, tecnología y ciencia.\n\nHa sido finalista en los años **2021** y **2022** y ganadora en el año **2023** en los **Premios Madroño Jóvenes Creadores** de la Comunidad de Madrid. A su vez, creó la pieza **Cómo ligar (muy fácil)**, para la edición X de Microteatro de Bolsillo del Ayuntamiento de Madrid.\n\nHa formado parte de los congresos **La escena intermedial: Inmersividad, interactividad y tecnología en la escena del siglo XXI**, impartido en la Universidad Complutense de Madrid, y del **VII Congreso Mutis 2024**, impartido en el Institut del Teatre.\n\nSu último proyecto **<SCRI> B** ha sido ganador del **Festival Internacional WE: NOW**. Además, debido a su formato, se representó en **2024**, en la **Universidad Carlos III de Madrid** por el día de la Mujer en la Ciencia, y en **2025**, en **Perú**, por el día de la Educación. Este último evento fue subvencionado por el programa de ayudas de **Creación Injuve**, además de contar con el apoyo de **AC/E (Acción Cultural Española)**.\n\nSutura Teatro la componen **David Viñas** y **Ángela Bueno**.\n\nSi quieres saber quién es David Viñas, introduce el comando «david viñas».\n\nSi quieres quién es Ángela Bueno, introduce el comando «ángela bueno».\n\n\nPara volver al menú, utiliza el comando «reinicio».";
 			
			var output = this.output;

			output.innerHTML += ("<center><img style='max-width:100%;width:25%;height:auto;' src='./img/logo_sutura.png'></center>"+ "<br><br/>");
			this.type(result, this.unlock.bind(this));
			
			
    }

    //ÁNGELA BUENO
		
		Terminal.prototype.angela_bueno = function () {

			this.clear();
			
			 var result = "# ÁNGELA BUENO (BUENA ENJUNDIA)\n\nEgresada en la **RESAD** por dramaturgia y dirección. Forma parte del colectivo **Madrid Negro**, siendo guía de las exposiciones **Tabita Rezaire: Nebulosa de la Calabaza** y **La memoria colonial** en las exposiciones del Thyssen en colaboración con Espacio Afro y Museo Thyssen. Además, ha formado parte de la mesa redonda **Participación cultural y museos** en el marco de Encuentros Detonantes organizada por el Departamento de Educación del Museo del Prado.\n\nComo miembro de la **Tertulia Antirracista Exiles** ha participado en diversos recitales en Madrid y en París; entre sus publicaciones encontramos **Quiero ser una caja de música** y **¡Hasta la vista, Benidorm!**.\n\nActualmente se encuentra desarrollando **Comosomos**, instalación artística itinerante, interactiva e inmersiva para público adolescente, cuyo eje vertebrador es la deconstrucción del concepto de «raza» y el alegato a favor de la diversidad a través de la memoria de las víctimas.\n\n\nPara volver al menú, utiliza el comando «reinicio».";
 			
			var output = this.output;

			output.innerHTML += ("<center><img style='max-width:100%;width:auto;height:auto;' src='./img/angela_bueno.png'></center>"+ "<br><br/>");
			this.type(result, this.unlock.bind(this));
			
			
    }

        //DAVID VIÑAS
		
		Terminal.prototype.david_viñas = function () {

			this.clear();
			
			 var result = "# DAVID VIÑAS (TRES CEJAS)\n\nEgresado en Matemáticas e Informática por la **Universidad Politécnica de Madrid**. Es docente del programa **SOY** (dinámicas de habilidades sociales para adolescentes a partir de la improvisación teatral). A la par, imparte clases en la escuela **WIT Impro**.\n\nComo actor trabaja con **Angélica Liddell** en su obra **Vudú (3318) Blixen**, y pertenece al elenco estable de la compañía **Impropios**; en **2023** fue galardonado con el **Premio Madroño a mejor actor** por su actuación en **Manos** de Gustavo Montes.\n\nEntre sus publicaciones encontramos **La jajajada** y **Pizza margarita**. A su vez, es escritor de los microteatros **El viajante** y **AEGIS**.\n\nActualmente se encuentra investigando el uso de la **inteligencia artificial generativa** en escena con el objetivo de integrarla de manera sofisticada.\n\n\nPara volver al menú, utiliza el comando «reinicio».";
 			
			var output = this.output;

			output.innerHTML += ("<center><img style='max-width:100%;width:auto;height:auto;' src='./img/david_viñas.png'></center>"+ "<br><br/>");
			this.type(result, this.unlock.bind(this));
			
			
    }

    //MATERIALES

    Terminal.prototype.materiales = function () {

        this.clear();

        var result = "# MATERIALES";
        var output = this.output;

        this.type(result, function () {

            output.innerHTML += "<br/>" + this.buildMaterialsMarkup() + "<br/><br/>";
            this.type("Para volver al menú, utiliza el comando «reinicio».", this.unlock.bind(this));

        }.bind(this));

    }

    Terminal.prototype.imagenes = Terminal.prototype.materiales;

    //ARTÍCULOS

    Terminal.prototype.articulos = function () {

        this.clear();

        var result = "# ARTÍCULOS";
        var output = this.output;

        this.type(result, function () {

            output.innerHTML += "<br/>" + this.buildArticlesMarkup() + "<br/><br/>";
            this.type("Para volver al menú, utiliza el comando «reinicio».", this.unlock.bind(this));

        }.bind(this));

    }

	//CONTACTO

	    Terminal.prototype.contacto = function () {

						this.clear();

         var result = "# CONTACTO Y REDES SOCIALES\n\n**Instagram:** [@scrib_show](https://www.instagram.com/scrib_show/) / [@su.tu.ra](https://www.instagram.com/su.tu.ra/)\n\n**WhatsApp:** [+34 606 917 894](https://wa.me/34606917894) / [+34 659 693 387](https://wa.me/34659693387)\n\n\nPara volver al menú, utiliza el comando «reinicio».";

			    

			this.type(result, this.unlock.bind(this));

			     

    }

    //ENTRADAS

    Terminal.prototype.entradas = function () {

        this.clear();

        var result = "**Se te ha redirigido a la compra de entradas** para nuestro espectáculo SCRIB.\n\n\nPara volver al menú, utiliza el comando «reinicio»";

        var output = this.output;
 
        this.type(result, this.unlock.bind(this));
        
        location.href='https://www.navelart.es/event-details/scri-b-1';
    }

	/*

    Terminal.prototype.whoami = function (cmdComponents) {

        var result = configs.getInstance().username + ": " + configs.getInstance().user + "\n" + configs.getInstance().hostname + ": " + configs.getInstance().host + "\n" + configs.getInstance().platform + ": " + navigator.platform + "\n" + configs.getInstance().accesible_cores + ": " + navigator.hardwareConcurrency + "\n" + configs.getInstance().language + ": " + navigator.language;

             

			this.type(result, this.unlock.bind(this));

			        

    };



    Terminal.prototype.date = function (cmdComponents) {

        this.type(new Date().toString(), this.unlock.bind(this));

    };

	*/

    Terminal.prototype.help = function () {

		

					this.clear();

        var result = configs.getInstance().general_help + "\n\n";

        primaryCommands.forEach(function (commandValue) {

            for (var cmd in cmds) {

                if (cmds[cmd].value === commandValue) {

                    result += "• " + cmds[cmd].value + " - " + cmds[cmd].help + "\n";

                    break;

                }

            }

        });

		      

        this.type(result.trim(), this.unlock.bind(this));

    };

	

    Terminal.prototype.clear = function () {

        this.output.textContent = "";

        this.prompt.textContent = "";

        this.prompt.textContent = this.completePrompt;

        this.unlock();

    };



    Terminal.prototype.reboot = function () {

        this.type(configs.getInstance().reboot_message, this.reset.bind(this));

    };



    Terminal.prototype.reset = function () {



        this.output.textContent = "";

        this.prompt.textContent = "";

        if (this.typeSimulator) {

            this.type(configs.getInstance().welcome + (isUsingIE ? "\n" + configs.getInstance().internet_explorer_warning : ""), function () {

				 this.no_writing = true;

                this.unlock();

            }.bind(this));

        }

    };



    Terminal.prototype.permissionDenied = function (cmdComponents) {

        this.type(configs.getInstance().permission_denied_message.replace(configs.getInstance().value_token, cmdComponents[0]), this.unlock.bind(this));

    };



    Terminal.prototype.invalidCommand = function (cmdComponents) {

        this.type(configs.getInstance().invalid_command_message.replace(configs.getInstance().value_token, cmdComponents), this.unlock.bind(this));

    };



    Terminal.prototype.focus = function () {

		this.no_writing = true;

        this.cmdLine.focus();

    };

	var Pila = function (){

    		this._size = 0;

    		this._storage = {};

	}

	Pila.prototype.push = function(data) {

			var size = ++this._size;

    		this._storage[size] = data;

	}

	Pila.prototype.pop = function() {

    var size = this._size,

        deletedData;

 

    if (size) 

        deletedData = this._storage[size];

 

        delete this._storage[size];

        this._size--;

 

        return deletedData;

	

	}

    var TypeSimulator = function (timer, output) {

		

        var timer = parseInt(timer);

        if (timer === Number.NaN || timer < 0) {

            throw new InvalidArgumentException("Invalid value " + timer + " for argument 'timer'.");

        }

        if (!(output instanceof Node)) {

            throw new InvalidArgumentException("Invalid value " + output + " for argument 'output'.");

        }

        this.timer = timer;

        this.output = output;

        this.pendingTimeoutId = null;

        this.activeRunId = 0;

        this.activeSkipHandler = null;

    };

TypeSimulator.prototype.cancel = function () {

    this.activeRunId += 1;

    if (this.pendingTimeoutId !== null) {

        clearTimeout(this.pendingTimeoutId);
        this.pendingTimeoutId = null;

    }

    if (this.activeSkipHandler) {

        document.removeEventListener("dblclick", this.activeSkipHandler);
        document.removeEventListener("keypress", this.activeSkipHandler);
        this.activeSkipHandler = null;

    }

    var cmdLine = document.getElementById("cmdline");

    if (cmdLine) {

        cmdLine.readOnly = false;

    }

};


//Hay un pequeño eror aquí. Al iniciarse, no parpadea el cursor.
TypeSimulator.prototype.type = function (text, callback) {

		

    if (isURL(text)) {

        window.open(text);

    }

    var i = 0;

    var output = this.output;

    var timer = this.timer;

    var simulator = this;

    this.cancel();

    var runId = this.activeRunId;

    var skipped = false;

    var boldOpen = false;

    var renderMarkupChunk = function (chunk) {

        var html = "";

        var chunkIndex = 0;

        while (chunkIndex < chunk.length) {

            if (chunk.substring(chunkIndex, chunkIndex + 2) === "**") {

                html += boldOpen ? "</strong>" : "<strong>";

                boldOpen = !boldOpen;

                chunkIndex += 2;

                continue;

            }

            var chunkChar = chunk.charAt(chunkIndex);

            html += chunkChar === "\n" ? "<br/>" : escapeHTML(chunkChar);

            chunkIndex++;

        }

        return html;

    };

    

    var skip = function () {

        skipped = true;

        

    }.bind(this);

    this.activeSkipHandler = skip;

                        this.no_writing = true;

    document.addEventListener("dblclick", skip);

    document.addEventListener('keypress', skip);
                      this.no_writing = true;

    (function typer() {

        if (runId !== simulator.activeRunId) {

            return;

        }

        

        document.getElementById("cmdline").readOnly = true;

                                

        if (i < text.length) {

            if (text.substring(i, i + 2) === "**") {

                output.innerHTML += boldOpen ? "</strong>" : "<strong>";

                boldOpen = !boldOpen;

                i += 2;

                typer();

                return;

            }

            var char = text.charAt(i);

            var isNewLine = char === "\n";

            output.innerHTML += isNewLine ? "<br/>" : escapeHTML(char);

            i++;

            if (!skipped) {

                simulator.pendingTimeoutId = setTimeout(typer, isNewLine ? timer * 2 : timer);

            } else {

                                    simulator.no_writing = false;

                output.innerHTML += renderMarkupChunk(text.substring(i));

                if (boldOpen) {

                    output.innerHTML += "</strong>";

                    boldOpen = false;

                }

                output.innerHTML += "<br/>";

                document.removeEventListener("dblclick", skip);

                document.removeEventListener("keypress", skip);

                simulator.activeSkipHandler = null;

                simulator.pendingTimeoutId = null;

                document.getElementById("cmdline").readOnly = false;

                simulator.no_writing = true;

                callback();

                                    simulator.no_writing = true;

            }

        } else if (callback) {

                                simulator.no_writing = false;

            if (boldOpen) {

                output.innerHTML += "</strong>";

                boldOpen = false;

            }

            output.innerHTML += "<br/>";

            document.removeEventListener("dblclick", skip);

            document.removeEventListener("keypress", skip);

            simulator.activeSkipHandler = null;

            simulator.pendingTimeoutId = null;

            simulator.no_writing = false;

            callback();

            document.getElementById("cmdline").readOnly = false;

        }

        //Baja automáticamente

        //scrollToBottom();

                   

    })();

                    

};

    return {

		

        listener: function () {

            new Terminal(

                document.getElementById("prompt"),

                document.getElementById("cmdline"),

                document.getElementById("output"),

                document.getElementById("sidenav"),

                document.getElementById("profilePic"),

                configs.getInstance().user,

                configs.getInstance().host,

                configs.getInstance(). no_writing,

                configs.getInstance().type_delay

            ).init();

        }

    };

})();



window.onload = main.listener;
