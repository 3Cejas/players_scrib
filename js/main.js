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

        welcome: "**Bienvenidx a la página oficial de SCRIB.**\n\nPara navegar, **introduce o pulsa** alguno de los siguientes comandos:\n\n\u2022 videojuego\n\u2022 espectáculo\n\u2022 fechas\n\u2022 prensa\n\u2022 artículos\n\u2022 compañía\n\u2022 newsletter\n\u2022 contacto\n\u2022 reinicio\n\nSi te pierdes en algún momento, utiliza el comando «ayuda».",

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

        imagenes_help:"Prensa de SCRIB: álbum por eventos, vídeos y dossier.",

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

        IMAGENES: { value: "prensa", help: configs.getInstance().imagenes_help},

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
            description: "PDF con informaci\u00f3n del espect\u00e1culo, universo del proyecto y materiales de presentaci\u00f3n.",
            href: "./archives/Dossier SCRIB.pdf"
        },
        {
            title: "<SCRI> B en Movimientos de escucha al futuro de la escena",
            description: "Rese\u00f1a del espect\u00e1culo en el marco de las ayudas a la creaci\u00f3n 2025 de INJUVE.",
            href: "./archives/Movimientos-de-escucha-al-futuro-de-la-escena.pdf"
        },
        {
            title: "Desaf\u00edos en el proceso de gamificaci\u00f3n y escenificaci\u00f3n de la escritura, un acercamiento al espect\u00e1culo-videojuego SCRIB",
            description: "Paper desarrollado en el Congreso Internacional La escena intermedial: Inmersividad, interactividad y tecnolog\u00eda en la escena del siglo XXI.",
            href: "./archives/Desaf\u00edos en el proceso de gamificaci\u00f3n y escenificaci\u00f3n de la escritura, un acercamiento al espect\u00e1culo-videojuego SCRIB, por Sutura.pdf"
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

        this.galleryLightboxPrev = null;

        this.galleryLightboxNext = null;

        this.galleryLightboxItems = [];

        this.galleryLightboxIndex = -1;

        this.penCursor = null;

        this.penCursorHideTimeoutId = null;

        this.penCursorInitialized = false;

        this.penCursorPressTimeoutId = null;

        this.asciiHeader = document.getElementById("containerascii");

    };

    var padNumber = function (value, width) {

        var stringValue = String(value);

        while (stringValue.length < width) {

            stringValue = "0" + stringValue;

        }

        return stringValue;

    };

    var buildRange = function (start, end, mapper) {

        var values = [];

        for (var index = start; index <= end; index++) {

            values.push(mapper(index));

        }

        return values;

    };

    var PEN_CURSOR_INACTIVITY_MS = 1600;

    var createGalleryMediaFromFiles = function (fileNames) {

        return fileNames.map(function (fileName) {

            return {
                type: /\.(mp4|mov)$/i.test(fileName) ? "video" : "image",
                fileName: fileName
            };

        });

    };

    var buildGalleryAssetPath = function (folderName, fileName) {

        return "./img/gallery/" + encodeURIComponent(folderName) + "/" + encodeURIComponent(fileName);

    };

    var buildGalleryPreviewPath = function (folderName, fileName) {

        var previewFileName = /\.[^.]+$/.test(fileName) ? fileName.replace(/\.[^.]+$/, ".webp") : fileName + ".webp";

        return "./img/gallery_previews/" + encodeURIComponent(folderName) + "/" + encodeURIComponent(previewFileName);

    };

    var buildOptimizedImageMarkup = function (previewPath, fallbackPath, className, altText) {

        return "<img class=\"" + className + "\" src=\"" + previewPath + "\" data-fallback-src=\"" + fallbackPath + "\" alt=\"" + escapeHTML(altText) + "\" loading=\"lazy\" decoding=\"async\" fetchpriority=\"low\">";

    };

    var galleryEvents = [
        {
            title: "DÍA DE LA NIÑA Y LA MUJER EN LA CIENCIA",
            media: createGalleryMediaFromFiles(
                []
                    .concat(buildRange(1, 10, function (index) { return "ScriB_" + padNumber(index, 3) + ".jpg"; }))
                    .concat(["ScriB_0101.jpg"])
                    .concat(buildRange(11, 33, function (index) { return "ScriB_" + padNumber(index, 3) + ".jpg"; }))
                    .concat(["ScriB_0333.jpg"])
                    .concat(buildRange(34, 51, function (index) { return "ScriB_" + padNumber(index, 3) + ".jpg"; }))
                    .concat(["ScriB_061.jpg", "ScriB_073.jpg", "ScriB_074.jpg"])
            )
        },
        {
            title: "FESTIVAL MUTIS 2025",
            media: createGalleryMediaFromFiles(
                ["entrevista.mp4"].concat(
                    buildRange(1, 35, function (index) {

                        return "Scrib (" + index + " de 35).jpg";

                    })
                )
            )
        },
        {
            title: "JORNADAS ESCÉNICAS MATADERO 2025",
            media: createGalleryMediaFromFiles(
                buildRange(1, 92, function (index) {

                    return "INJV D1_O1-" + padNumber(index, 2) + ".jpg";

                })
            )
        },
        {
            title: "RESIDENCIA KRACC 2025",
            media: createGalleryMediaFromFiles([
                "20250125_005028856_iOS.jpg",
                "20250125_005034348_iOS.jpg",
                "20250125_005036045_iOS.jpg",
                "20250125_005059000_iOS.MOV",
                "20250125_012526562_iOS.jpg",
                "20250125_012551182_iOS.jpg",
                "20250125_012552787_iOS.jpg",
                "20250125_014318215_iOS.jpg",
                "20250125_014844526_iOS.jpg",
                "20250125_014901891_iOS.jpg",
                "20250125_014903633_iOS.jpg",
                "20250125_014929476_iOS.jpg",
                "20250125_014933199_iOS.jpg",
                "20250125_020105841_iOS.jpg",
                "20250125_020109542_iOS.jpg",
                "20250125_020111968_iOS.jpg",
                "20250125_020902061_iOS.jpg",
                "20250125_020904145_iOS.jpg",
                "20250125_020908727_iOS.jpg",
                "20250125_020916062_iOS.jpg",
                "20250125_020919593_iOS.jpg",
                "20250125_020920677_iOS.jpg",
                "20250125_020935932_iOS.jpg",
                "20250125_020945117_iOS.jpg",
                "20250125_021249559_iOS.jpg",
                "20250125_021254934_iOS.jpg",
                "20250125_021258135_iOS.jpg",
                "20250125_021324765_iOS.jpg",
                "20250125_021329306_iOS.jpg",
                "20250125_021403237_iOS.jpg",
                "20250125_021407226_iOS.jpg",
                "20250125_021420498_iOS.jpg",
                "20250125_021424412_iOS.jpg",
                "20250125_021440653_iOS.jpg",
                "20250125_021453572_iOS.jpg",
                "20250125_021454219_iOS.jpg",
                "20250125_021540151_iOS.jpg",
                "20250125_021542759_iOS.jpg",
                "20250125_021546024_iOS.jpg",
                "20250125_021929637_iOS.jpg",
                "20250125_021931535_iOS.jpg",
                "20250125_022135145_iOS.jpg"
            ])
        }
    ];

    galleryEvents = [
        {
            folder: "JORNADAS ESC\u00c9NICAS MATADERO 2025",
            title: "JORNADAS ESC\u00c9NICAS MATADERO 2025",
            media: createGalleryMediaFromFiles([
                "INJV D1_O1-01.jpg",
                "INJV D1_O1-04.jpg",
                "INJV D1_O1-10.jpg",
                "INJV D1_O1-13.jpg",
                "INJV D1_O1-16.jpg",
                "INJV D1_O1-17.jpg",
                "INJV D1_O1-23.jpg",
                "INJV D1_O1-32.jpg",
                "INJV D1_O1-35.jpg",
                "INJV D1_O1-36.jpg",
                "INJV D1_O1-41.jpg",
                "INJV D1_O1-42.jpg",
                "INJV D1_O1-44.jpg",
                "INJV D1_O1-46.jpg",
                "INJV D1_O1-47.jpg",
                "INJV D1_O1-48.jpg",
                "INJV D1_O1-54.jpg",
                "INJV D1_O1-57.jpg",
                "INJV D1_O1-60.jpg",
                "INJV D1_O1-63.jpg",
                "INJV D1_O1-64.jpg",
                "INJV D1_O1-69.jpg",
                "INJV D1_O1-73.jpg",
                "INJV D1_O1-75.jpg",
                "INJV D1_O1-76.jpg",
                "INJV D1_O1-79.jpg",
                "INJV D1_O1-86.jpg",
                "INJV D1_O1-88.jpg"
            ])
        },
        {
            folder: "FESTIVAL MUTIS 2025",
            title: "FESTIVAL MUTIS 2025",
            media: createGalleryMediaFromFiles([
                "Scrib (10 de 35).jpg",
                "Scrib (11 de 35).jpg",
                "Scrib (12 de 35).jpg",
                "Scrib (13 de 35).jpg",
                "Scrib (14 de 35).jpg",
                "Scrib (15 de 35).jpg",
                "Scrib (17 de 35).jpg",
                "Scrib (18 de 35).jpg",
                "Scrib (19 de 35).jpg",
                "Scrib (2 de 35).jpg",
                "Scrib (22 de 35).jpg",
                "Scrib (25 de 35).jpg",
                "Scrib (27 de 35).jpg",
                "Scrib (28 de 35).jpg",
                "Scrib (35 de 35).jpg",
                "Scrib (5 de 35).jpg",
                "Scrib (7 de 35).jpg"
            ])
        },
        {
            folder: "RESIDENCIA KRACC 2025",
            title: "RESIDENCIA KRACC 2025",
            media: createGalleryMediaFromFiles([
                "20250125_005028856_iOS.jpg",
                "20250125_005034348_iOS.jpg",
                "20250125_005036045_iOS.jpg",
                "20250125_012526562_iOS.jpg",
                "20250125_012552787_iOS.jpg",
                "20250125_014318215_iOS.jpg",
                "20250125_014844526_iOS.jpg",
                "20250125_020902061_iOS.jpg",
                "20250125_020945117_iOS.jpg",
                "20250125_021329306_iOS.jpg",
                "20250125_021403237_iOS.jpg",
                "20250125_021424412_iOS.jpg",
                "20250125_022135145_iOS.jpg"
            ])
        },
        {
            folder: "D\u00cdA DE LA NI\u00d1A Y LA MUJER EN LA CIENCIA",
            title: "D\u00cdA DE LA NI\u00d1A Y LA MUJER EN LA CIENCIA 2025",
            media: createGalleryMediaFromFiles([
                "ScriB_002.jpg",
                "ScriB_003.jpg",
                "ScriB_005.jpg",
                "ScriB_007.jpg",
                "ScriB_008.jpg",
                "ScriB_010.jpg",
                "ScriB_011.jpg",
                "ScriB_013.jpg",
                "ScriB_014.jpg",
                "ScriB_015.jpg",
                "ScriB_016.jpg",
                "ScriB_019.jpg",
                "ScriB_022.jpg",
                "ScriB_023.jpg",
                "ScriB_024.jpg",
                "ScriB_025.jpg",
                "ScriB_033.jpg",
                "ScriB_034.jpg",
                "ScriB_035.jpg",
                "ScriB_036.jpg",
                "ScriB_038.jpg",
                "ScriB_041.jpg",
                "ScriB_042.jpg",
                "ScriB_043.jpg",
                "ScriB_044.jpg",
                "ScriB_045.jpg",
                "ScriB_048.jpg",
                "ScriB_051.jpg"
            ])
        },
        {
            folder: "FESTIVAL INTERNACIONAL WENOW 2023",
            title: "FESTIVAL INTERNACIONAL WE:NOW",
            media: createGalleryMediaFromFiles(
                buildRange(1, 36, function (index) {

                    return "ScriB_" + padNumber(index, 3) + ".jpg";

                })
            )
        }
    ];

    var tournamentTicketsUrl = "https://www.dinaticket.com/es/provider/18142/event/4940616";

    var scheduleSections = [
        {
            tone: "tournament",
            year: 2026,
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
                    writers: "Diego vs Maca",
                    performers: "Ari · Pablo · Judith · Ángela",
                    time: "20:30 hrs.",
                    venue: "Espacio Hollywood",
                    address: "C. del Infante, 3, Madrid",
                    ticketUrl: tournamentTicketsUrl,
                    past: false
                },
                {
                    date: "23 de abril",
                    writers: "Teresa vs Irene",
                    performers: "Ari · Pablo · Judith · Diego",
                    time: "20:30 hrs.",
                    venue: "Espacio Hollywood",
                    address: "C. del Infante, 3, Madrid",
                    ticketUrl: tournamentTicketsUrl,
                    past: false
                },
                {
                    date: "7 de mayo",
                    writers: "Majo vs Paula",
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

    Terminal.prototype.shouldAutoFocusCommandLine = function (event) {

        var selection = typeof window.getSelection === "function" ? window.getSelection() : null;
        var target = event && event.target;

        if (selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {

            return false;

        }

        if (!target || target === this.cmdLine) {

            return false;

        }

        if (target.closest && target.closest("a, button, input, textarea, select, option, video, iframe, label")) {

            return false;

        }

        if (target.closest && target.closest("#containerascii")) {

            return false;

        }

        if (target.closest && target.closest(".output-lightbox__dialog, .output-reading-card, .article-card, .output-video-card")) {

            return false;

        }

        return true;

    };

    Terminal.prototype.bindAsciiHeader = function () {

        var handleActivate;

        if (!this.asciiHeader) {

            return;

        }

        handleActivate = function (event) {

            if (event) {

                ignoreEvent(event);

            }

            this.showInitialPage();

        }.bind(this);

        this.asciiHeader.addEventListener("click", handleActivate);
        this.asciiHeader.addEventListener("keydown", function (event) {

            if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {

                handleActivate(event);

            }

        });

    };

    Terminal.prototype.scrollViewportToTop = function () {

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

    };

    Terminal.prototype.showInitialPage = function (options) {

        var shouldRecordHistory = !options || options.recordHistory !== false;

        if (this.typeSimulator && this.typeSimulator.cancel) {

            this.typeSimulator.cancel();

        }

        if (this.galleryLightbox && !this.galleryLightbox.classList.contains("output-lightbox--hidden")) {

            this.closeGalleryLightbox();

        }

        this.cmdLine.value = "";

        if (shouldRecordHistory) {

            this.updateBrowserHistoryState(null);

        } else {

            this.currentHistoryCommand = "__home__";

        }

        this.scrollViewportToTop();
        this.reset();

        window.requestAnimationFrame(function () {

            this.scrollViewportToTop();

        }.bind(this));

    };

    Terminal.prototype.clearPenCursorHideTimer = function () {

        if (this.penCursorHideTimeoutId !== null) {

            clearTimeout(this.penCursorHideTimeoutId);
            this.penCursorHideTimeoutId = null;

        }

    };

    Terminal.prototype.hidePenCursor = function () {

        if (!this.penCursor) {

            return;

        }

        this.penCursor.classList.remove("activa");
        this.penCursor.classList.remove("is-pressing");

    };

    Terminal.prototype.scheduleHidePenCursor = function () {

        this.clearPenCursorHideTimer();

        if (!this.penCursor) {

            return;

        }

        this.penCursorHideTimeoutId = window.setTimeout(function () {

            this.penCursorHideTimeoutId = null;
            this.hidePenCursor();

        }.bind(this), PEN_CURSOR_INACTIVITY_MS);

    };

    Terminal.prototype.movePenCursor = function (clientX, clientY, isPressing) {

        if (!this.penCursor) {

            return;

        }

        this.penCursor.style.left = clientX + "px";
        this.penCursor.style.top = clientY + "px";

        this.penCursor.classList.add("activa");

        if (isPressing) {

            this.penCursor.classList.add("is-pressing");

            if (this.penCursorPressTimeoutId !== null) {

                clearTimeout(this.penCursorPressTimeoutId);

            }

            this.penCursorPressTimeoutId = window.setTimeout(function () {

                this.penCursorPressTimeoutId = null;

                if (this.penCursor) {

                    this.penCursor.classList.remove("is-pressing");

                }

            }.bind(this), 140);

        }

        this.scheduleHidePenCursor();

    };

    Terminal.prototype.initPenCursor = function () {

        var supportsFinePointer;

        if (this.penCursorInitialized || !document.body) {

            return;

        }

        this.penCursorInitialized = true;

        if (typeof window.matchMedia !== "function") {

            supportsFinePointer = true;

        } else {

            supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

        }

        if (!supportsFinePointer) {

            return;

        }

        this.penCursor = document.createElement("div");
        this.penCursor.className = "page-cursor-pluma";
        document.body.appendChild(this.penCursor);
        document.body.classList.add("page-cursor-pluma-activo");

        document.addEventListener("mousemove", function (event) {

            if (!event || typeof event.clientX !== "number" || typeof event.clientY !== "number") {

                return;

            }

            this.movePenCursor(event.clientX, event.clientY, false);

        }.bind(this), { passive: true });

        document.addEventListener("mousedown", function (event) {

            if (!event || typeof event.clientX !== "number" || typeof event.clientY !== "number") {

                return;

            }

            this.movePenCursor(event.clientX, event.clientY, true);

        }.bind(this), { passive: true });

        document.addEventListener("mouseup", function (event) {

            if (!event || typeof event.clientX !== "number" || typeof event.clientY !== "number") {

                return;

            }

            this.movePenCursor(event.clientX, event.clientY, false);

        }.bind(this), { passive: true });

        document.addEventListener("mouseout", function (event) {

            if (!event.relatedTarget) {

                this.hidePenCursor();

            }

        }.bind(this));

        window.addEventListener("blur", this.hidePenCursor.bind(this));

        document.addEventListener("visibilitychange", function () {

            if (document.hidden) {

                this.hidePenCursor();

            }

        }.bind(this));

    };

    Terminal.prototype.bindOutputOptimizedMedia = function () {

        if (this.output.dataset.optimizedMediaBound === "true") {

            return;

        }

        this.output.dataset.optimizedMediaBound = "true";

        this.output.addEventListener("error", function (event) {

            var element = event.target;
            var fallbackSrc;

            if (!element || element.tagName !== "IMG") {

                return;

            }

            fallbackSrc = element.getAttribute("data-fallback-src");

            if (!fallbackSrc || element.getAttribute("src") === fallbackSrc) {

                this.updateOutputMediaLoadedState(element, true);

                return;

            }

            this.updateOutputMediaLoadedState(element, false);
            element.setAttribute("src", fallbackSrc);
            element.removeAttribute("data-fallback-src");

        }.bind(this), true);

        this.output.addEventListener("load", function (event) {

            var element = event.target;

            if (!element || element.tagName !== "IMG") {

                return;

            }

            this.updateOutputMediaLoadedState(element, true);

            if (element.classList && element.classList.contains("output-gallery-image")) {

                this.updateOutputGalleryImageOrientation(element);

            }

        }.bind(this), true);

    };

    Terminal.prototype.updateOutputMediaLoadedState = function (image, isLoaded) {

        var wrapper;

        if (!image || image.tagName !== "IMG" || !image.classList) {

            return;

        }

        image.classList.toggle("is-loaded", !!isLoaded);

        if (!image.closest) {

            return;

        }

        wrapper = image.closest(".output-gallery-item, .article-card__media, .output-video-preview");

        if (wrapper) {

            wrapper.classList.toggle("is-loaded", !!isLoaded);

        }

    };

    Terminal.prototype.updateOutputGalleryImageOrientation = function (image) {

        var isPortrait;

        if (!image || !image.classList || !image.classList.contains("output-gallery-image")) {

            return;

        }

        if (!image.naturalWidth || !image.naturalHeight) {

            return;

        }

        isPortrait = image.naturalHeight > image.naturalWidth;

        image.classList.toggle("output-gallery-image--portrait", isPortrait);
        image.classList.toggle("output-gallery-image--landscape", !isPortrait);

    };

    Terminal.prototype.refreshOutputGalleryImageOrientation = function () {

        this.output.querySelectorAll("img").forEach(function (image) {

            this.updateOutputMediaLoadedState(image, !!(image.complete && image.naturalWidth));

            if (!image.classList || !image.classList.contains("output-gallery-image")) {

                return;

            }

            this.updateOutputGalleryImageOrientation(image);

        }.bind(this));

    };



    Terminal.prototype.init = function () {

        this.sidenav.addEventListener("click", ignoreEvent);

        this.cmdLine.disabled = true;

        this.sidenavElements.forEach(function (elem) {

            elem.disabled = true;

        });

        this.prepareSideNav();
        this.initPenCursor();
        this.bindAsciiHeader();
        this.bindOutputOptimizedMedia();

        this.lock(); // NECESARIO PARA BLOQUEAR DESDE QUE LOS ELEMENTOS DEL SIDENAV HAN SIDO AÑADIDOS AHORA

        document.body.addEventListener("click", function (event) {

            if (this.sidenavOpen) {

                this.handleSidenav(event);

            }

            //Hace que se focalice en la linea de comandos cuando termina de ejecutar el último comando o al empezar

			if (this.shouldAutoFocusCommandLine(event)) {

				this.focus();

			}

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

    Terminal.prototype.buildOutputCommandMarkupWithLabel = function (command, label, isActive) {

        var className = "output-command-link" + (isActive ? " is-active" : "");
        var currentAttribute = isActive ? " aria-current=\"true\"" : "";

        return "<span class=\"output-command-entry\"><span class=\"output-command-bullet\">â€¢</span> <button type=\"button\" class=\"" + className + "\" data-command=\"" + escapeHTML(command) + "\"" + currentAttribute + ">" + escapeHTML(label || command) + "</button></span>";

    };

    Terminal.prototype.buildInlineCommandMarkup = function (command) {

        return "<span class=\"output-command-inline\">«<button type=\"button\" class=\"output-command-link output-command-link--inline\" data-command=\"" + command + "\">" + command + "</button>»</span>";

    };

    Terminal.prototype.buildOutputCommandMarkup = function (command) {

        return "<span class=\"output-command-entry\"><span class=\"output-command-bullet\">&#8226;</span> <button type=\"button\" class=\"output-command-link\" data-command=\"" + command + "\">" + command + "</button></span>";

    };

    Terminal.prototype.buildOutputCommandMarkupWithLabel = function (command, label, isActive) {

        var className = "output-command-link" + (isActive ? " is-active" : "");
        var currentAttribute = isActive ? " aria-current=\"true\"" : "";

        return "<span class=\"output-command-entry\"><span class=\"output-command-bullet\">&#8226;</span> <button type=\"button\" class=\"" + className + "\" data-command=\"" + escapeHTML(command) + "\"" + currentAttribute + ">" + escapeHTML(label || command) + "</button></span>";

    };

    Terminal.prototype.buildGalleryEventMeta = function (eventData) {

        var imageCount = 0;
        var videoCount = 0;
        var metaParts = [];

        eventData.media.forEach(function (mediaItem) {

            if (mediaItem.type === "video") {

                videoCount++;

            } else {

                imageCount++;

            }

        });

        imageCount && metaParts.push(imageCount + " imagen" + (imageCount === 1 ? "" : "es"));
        videoCount && metaParts.push(videoCount + " vÃ­deo" + (videoCount === 1 ? "" : "s"));

        return metaParts.join(" Â· ");

    };

    Terminal.prototype.buildGalleryMediaMarkup = function (eventData, mediaItem, mediaIndex) {

        var assetPath = "./img/gallery/" + encodeURIComponent(eventData.title) + "/" + encodeURIComponent(mediaItem.fileName);
        var caption = normalizeScribBrand(eventData.title + " Â· " + (mediaIndex + 1));

        if (mediaItem.type === "video") {

            var mimeType = /\.mov$/i.test(mediaItem.fileName) ? "video/quicktime" : "video/mp4";

            return "<article class=\"output-gallery-video-card\">" +
                "<video class=\"output-gallery-video\" controls preload=\"metadata\" playsinline>" +
                    "<source src=\"" + assetPath + "\" type=\"" + mimeType + "\">" +
                "</video>" +
                "<span class=\"output-gallery-video-badge\">VÃ­deo</span>" +
            "</article>";

        }

        return "<a class=\"output-gallery-item\" href=\"" + assetPath + "\" data-caption=\"" + escapeHTML(caption) + "\"><img class=\"output-gallery-image\" src=\"" + assetPath + "\" alt=\"" + escapeHTML(caption) + "\" loading=\"lazy\"></a>";

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
                    "<span class=\"output-video-preview\"><img class=\"output-video-thumb\" src=\"https://i.ytimg.com/vi/" + video.videoId + "/hqdefault.jpg\" alt=\"" + escapeHTML(video.title) + "\" loading=\"lazy\" decoding=\"async\" fetchpriority=\"low\" style=\"aspect-ratio: " + aspectRatio + ";\"></span>" +
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

    Terminal.prototype.buildGalleryEventMeta = function (eventData) {

        var imageCount = 0;
        var videoCount = 0;
        var metaParts = [];

        eventData.media.forEach(function (mediaItem) {

            if (mediaItem.type === "video") {

                videoCount++;

            } else {

                imageCount++;

            }

        });

        imageCount && metaParts.push(imageCount + " imagen" + (imageCount === 1 ? "" : "es"));
        videoCount && metaParts.push(videoCount + " video" + (videoCount === 1 ? "" : "s"));

        return metaParts.join(" | ");

    };

    Terminal.prototype.buildGalleryMediaMarkup = function (eventData, mediaItem, mediaIndex) {

        var folderName = eventData.folder || eventData.title;
        var assetPath = buildGalleryAssetPath(folderName, mediaItem.fileName);
        var previewPath = mediaItem.type === "image" ? buildGalleryPreviewPath(folderName, mediaItem.fileName) : assetPath;
        var caption = normalizeScribBrand(eventData.title + " - " + (mediaIndex + 1));

        if (mediaItem.type === "video") {

            var mimeType = /\.mov$/i.test(mediaItem.fileName) ? "video/quicktime" : "video/mp4";

            return "<article class=\"output-gallery-video-card\">" +
                "<video class=\"output-gallery-video\" controls preload=\"none\" playsinline>" +
                    "<source src=\"" + assetPath + "\" type=\"" + mimeType + "\">" +
                "</video>" +
                "<span class=\"output-gallery-video-badge\">VIDEO</span>" +
            "</article>";

        }

        return "<a class=\"output-gallery-item\" href=\"" + assetPath + "\" data-caption=\"" + escapeHTML(caption) + "\">" +
            buildOptimizedImageMarkup(previewPath, assetPath, "output-gallery-image", caption) +
        "</a>";

    };

    Terminal.prototype.buildGalleryMarkup = function () {

        return "<div class=\"output-album\">" + galleryEvents.map(function (eventData) {

            return "<section class=\"output-album-event\">" +
                "<div class=\"output-album-event__header\">" +
                    "<div class=\"output-album-event__title\">" + escapeHTML(eventData.title) + "</div>" +
                    "<div class=\"output-album-event__meta\">" + escapeHTML(this.buildGalleryEventMeta(eventData)) + "</div>" +
                "</div>" +
                "<div class=\"output-album-carousel\">" +
                    "<button type=\"button\" class=\"output-album-nav output-album-nav--prev\" data-carousel-control=\"prev\" aria-label=\"Ver im\u00e1genes anteriores\">&#8249;</button>" +
                    "<div class=\"output-album-track-shell\">" +
                        "<div class=\"output-gallery output-gallery--album\" data-carousel-track>" + eventData.media.map(function (mediaItem, mediaIndex) {

                            return this.buildGalleryMediaMarkup(eventData, mediaItem, mediaIndex);

                        }.bind(this)).join("") + "</div>" +
                    "</div>" +
                    "<button type=\"button\" class=\"output-album-nav output-album-nav--next\" data-carousel-control=\"next\" aria-label=\"Ver im\u00e1genes siguientes\">&#8250;</button>" +
                "</div>" +
            "</section>";

        }.bind(this)).join("") + "</div>";

    };

    Terminal.prototype.updateAlbumCarouselState = function (eventElement) {

        var track = eventElement && eventElement.querySelector("[data-carousel-track]");
        var prevButton = eventElement && eventElement.querySelector(".output-album-nav--prev");
        var nextButton = eventElement && eventElement.querySelector(".output-album-nav--next");
        var maxScrollLeft;
        var atStart;
        var atEnd;
        var isScrollable;

        if (!track || !prevButton || !nextButton) {

            return;

        }

        maxScrollLeft = Math.max(track.scrollWidth - track.clientWidth, 0);
        atStart = track.scrollLeft <= 4;
        atEnd = maxScrollLeft <= 4 || track.scrollLeft >= maxScrollLeft - 4;
        isScrollable = maxScrollLeft > 4;

        eventElement.classList.toggle("is-at-start", atStart);
        eventElement.classList.toggle("is-at-end", atEnd);
        eventElement.classList.toggle("is-not-scrollable", !isScrollable);

        prevButton.disabled = !isScrollable || atStart;
        nextButton.disabled = !isScrollable || atEnd;

    };

    Terminal.prototype.initAlbumCarousels = function () {

        var eventElements = this.output.querySelectorAll(".output-album-event");

        eventElements.forEach(function (eventElement) {

            var track = eventElement.querySelector("[data-carousel-track]");

            if (!track) {

                return;

            }

            if (track.dataset.carouselBound !== "true") {

                track.dataset.carouselBound = "true";

                track.addEventListener("scroll", function () {

                    this.updateAlbumCarouselState(eventElement);

                }.bind(this), { passive: true });

            }

            this.updateAlbumCarouselState(eventElement);

        }.bind(this));

        if (this.albumCarouselResizeBound) {

            return;

        }

        this.albumCarouselResizeBound = true;

        window.addEventListener("resize", function () {

            this.output.querySelectorAll(".output-album-event").forEach(function (eventElement) {

                this.updateAlbumCarouselState(eventElement);

            }.bind(this));

        }.bind(this));

    };

    Terminal.prototype.smoothScrollAlbumCarousel = function (track, targetLeft) {

        var startLeft = track.scrollLeft;
        var distance = targetLeft - startLeft;
        var isCoarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
        var prefersReducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var duration = prefersReducedMotion ? 0 : (isCoarsePointer ? 320 : 560);
        var startTime = null;
        var animateScroll;

        if (!distance) {

            return;

        }

        if (!duration) {

            track.scrollLeft = targetLeft;
            return;

        }

        if (track.albumSmoothScrollFrameId) {

            cancelAnimationFrame(track.albumSmoothScrollFrameId);

        }

        animateScroll = function (timestamp) {

            var progress;
            var easedProgress;

            if (startTime === null) {

                startTime = timestamp;

            }

            progress = Math.min((timestamp - startTime) / duration, 1);
            easedProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            track.scrollLeft = startLeft + distance * easedProgress;

            if (progress < 1) {

                track.albumSmoothScrollFrameId = window.requestAnimationFrame(animateScroll);
                return;

            }

            track.albumSmoothScrollFrameId = null;

        };

        track.albumSmoothScrollFrameId = window.requestAnimationFrame(animateScroll);

    };

    Terminal.prototype.scrollAlbumCarousel = function (button) {

        var eventElement = button;
        var track;
        var direction;
        var step;

        while (eventElement && (!eventElement.classList || !eventElement.classList.contains("output-album-event"))) {

            eventElement = eventElement.parentNode;

        }

        if (!eventElement) {

            return;

        }

        track = eventElement.querySelector("[data-carousel-track]");

        if (!track) {

            return;

        }

        direction = button.getAttribute("data-carousel-control") === "prev" ? -1 : 1;
        step = Math.max(Math.round(track.clientWidth * 0.88), 240);

        this.smoothScrollAlbumCarousel(
            track,
            Math.max(0, Math.min(track.scrollLeft + direction * step, track.scrollWidth - track.clientWidth))
        );

    };

    Terminal.prototype.buildPressNavigationMarkup = function (activeView) {

        var commands = [
            { label: "\ud83d\udcf8 im\u00e1genes", command: "imagenes", view: "imagenes" },
            { label: "\ud83c\udfac v\u00eddeos", command: "videos", view: "videos" },
            { label: "\ud83d\udcda lecturas", command: "lecturas", view: "lecturas" }
        ];

        return "<div class=\"output-press-menu\">" +
            "<div class=\"output-press-command-list output-press-command-list--menu\">" + commands.map(function (item) {

                return "<div class=\"output-press-command-row\">" + this.buildOutputCommandMarkupWithLabel(item.command, item.label, activeView === item.view) + "</div>";

            }.bind(this)).join("") + "</div>" +
        "</div>";

    };

    Terminal.prototype.buildPressContentMarkup = function (activeView) {

        switch (activeView) {

            case "imagenes":
                return "<section class=\"output-materials-section\">" +
                    "<div class=\"output-materials-heading\">\ud83d\udcf8 IM\u00c1GENES</div>" +
                    this.buildGalleryMarkup() +
                "</section>";

            case "videos":
                return "<section class=\"output-materials-section\">" +
                    "<div class=\"output-materials-heading\">\ud83c\udfac V\u00cdDEOS</div>" +
                    this.buildMaterialVideosMarkup() +
                "</section>";

            case "lecturas":
                return "<section class=\"output-materials-section\">" +
                    "<div class=\"output-materials-heading\">\ud83d\udcda LECTURAS</div>" +
                    this.buildMaterialReadingsMarkup() +
                "</section>";

            default:
                return "";

        }

    };

    Terminal.prototype.buildPressMarkup = function (activeView) {

        return "<div class=\"output-materials-layout\">" +
            this.buildPressNavigationMarkup(activeView) +
            this.buildPressContentMarkup(activeView) +
        "</div>";

    };

    Terminal.prototype.buildMaterialsMarkup = function () {

        return this.buildPressMarkup("imagenes");

    };

    Terminal.prototype.buildSpectacleImageMarkup = function (folderName, fileName, caption, className) {

        var assetPath = buildGalleryAssetPath(folderName, fileName);
        var previewPath = buildGalleryPreviewPath(folderName, fileName);
        var normalizedCaption = normalizeScribBrand(caption);
        var figureClassName = className ? "showcase-figure " + className : "showcase-figure";

        return "<figure class=\"" + figureClassName + "\">" +
            "<a class=\"output-gallery-item showcase-figure__link\" href=\"" + assetPath + "\" data-caption=\"" + escapeHTML(normalizedCaption) + "\">" +
                buildOptimizedImageMarkup(previewPath, assetPath, "output-gallery-image showcase-figure__image", normalizedCaption) +
            "</a>" +
            "<figcaption class=\"showcase-figure__caption\">" + escapeHTML(normalizedCaption) + "</figcaption>" +
        "</figure>";

    };

    Terminal.prototype.buildSpectacleMarkup = function () {

        return "<div class=\"showcase-page\">" +
            "<div class=\"showcase-copy\">" +
                "<p>En cada velada <span class=\"showcase-underline\">dos equipos</span>, el <span class=\"showcase-underline\">equipo rojo</span> y el <span class=\"showcase-underline\">equipo azul</span>, se enfrentan para escribir <span class=\"showcase-underline\">el mejor texto dramático de la noche</span>.</p>" +
            "</div>" +
            this.buildSpectacleImageMarkup(
                "FESTIVAL MUTIS 2025",
                "Scrib (22 de 35).jpg",
                "Competición en vivo entre dramaturgia, escena y juego.",
                "showcase-figure--wide"
            ) +
            "<div class=\"showcase-copy\">" +
                "<p>Cada bando reúne a <span class=\"showcase-underline\">dos dramaturgos/as</span> que escriben en directo mientras sortean <span class=\"showcase-underline\">los desafíos del videojuego</span>. La escritura no sucede aparte: <span class=\"showcase-underline\">sucede dentro de la partida</span>.</p>" +
                "<p>El espectáculo convierte el proceso creativo en algo visible, físico y urgente: <span class=\"showcase-underline\">pensar, fallar, corregir y decidir</span> forman parte del propio acontecimiento escénico.</p>" +
            "</div>" +
            "<div class=\"showcase-media-grid\">" +
                this.buildSpectacleImageMarkup(
                    "RESIDENCIA KRACC 2025",
                    "20250125_021329306_iOS.jpg",
                    "La escritura se cocina mientras el equipo prepara la escena."
                ) +
                this.buildSpectacleImageMarkup(
                    "DÍA DE LA NIÑA Y LA MUJER EN LA CIENCIA",
                    "ScriB_036.jpg",
                    "El público entra en la partida y empuja la escritura."
                ) +
            "</div>" +
            "<div class=\"showcase-copy\">" +
                "<p>Mientras tanto, el <span class=\"showcase-underline\">público</span>, en su papel de <span class=\"showcase-underline\">musa</span>, participa desde el teléfono móvil para ofrecer soluciones, desbloquear situaciones y acompañar al escritor o escritora que decide inspirar.</p>" +
                "<p>Y no acaba ahí: cada equipo cuenta además con <span class=\"showcase-underline\">un elenco actoral</span> que prepara de manera simultánea el montaje del texto con <span class=\"showcase-underline\">iluminación, sonido, atrezzo y puesta en escena</span>.</p>" +
            "</div>" +
            this.buildSpectacleImageMarkup(
                "JORNADAS ESCÉNICAS MATADERO 2025",
                "INJV D1_O1-64.jpg",
                "La escritura termina convertida en escena delante del público.",
                "showcase-figure--wide"
            ) +
            "<div class=\"showcase-copy showcase-copy--closing\">" +
                "<p>Finalmente, <span class=\"showcase-underline\">el jurado</span> decide qué equipo ha demostrado <span class=\"showcase-underline\">mayor cooperación, inventiva y capacidad escénica</span>. &lt;SCRI&gt; B no trata solo de escribir bien: trata de <span class=\"showcase-underline\">escribir en vivo, en colectivo y bajo presión</span>.</p>" +
            "</div>" +
        "</div>"
            .replace(/<span class=\"showcase-underline\">/g, "<strong class=\"showcase-emphasis\">")
            .replace(/<\/span>/g, "</strong>");

    };

    Terminal.prototype.buildArticlesMarkup = function () {

        return "<div class=\"article-mosaic\">" + articlePosts.slice().reverse().map(function (article) {

            return "<a class=\"article-card\" href=\"" + article.url + "\" target=\"_blank\" rel=\"noreferrer noopener\">" +
                "<span class=\"article-card__media\"><img class=\"article-card__image\" src=\"" + article.image + "\" alt=\"" + escapeHTML(article.title) + "\" loading=\"lazy\" decoding=\"async\" fetchpriority=\"low\"></span>" +
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
        this.galleryLightbox.innerHTML = "<div class=\"output-lightbox__dialog\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Imagen ampliada\"><button type=\"button\" class=\"output-lightbox__close\" aria-label=\"Cerrar imagen\">×</button><div class=\"output-lightbox__viewer\"><button type=\"button\" class=\"output-lightbox__nav output-lightbox__nav--prev\" aria-label=\"Imagen anterior\">&#8249;</button><img class=\"output-lightbox__image\" alt=\"\"><button type=\"button\" class=\"output-lightbox__nav output-lightbox__nav--next\" aria-label=\"Imagen siguiente\">&#8250;</button></div><div class=\"output-lightbox__caption\"></div></div>";

        document.body.appendChild(this.galleryLightbox);

        this.galleryLightboxImage = this.galleryLightbox.querySelector(".output-lightbox__image");
        this.galleryLightboxCaption = this.galleryLightbox.querySelector(".output-lightbox__caption");
        this.galleryLightboxPrev = this.galleryLightbox.querySelector(".output-lightbox__nav--prev");
        this.galleryLightboxNext = this.galleryLightbox.querySelector(".output-lightbox__nav--next");

        this.galleryLightbox.addEventListener("click", function (event) {

            event.stopPropagation();

            if (event.target === this.galleryLightbox || event.target.classList.contains("output-lightbox__close")) {

                ignoreEvent(event);

                this.closeGalleryLightbox();

            }

        }.bind(this));

        this.galleryLightboxPrev.addEventListener("click", function (event) {

            ignoreEvent(event);

            this.navigateGalleryLightbox(-1);

        }.bind(this));

        this.galleryLightboxNext.addEventListener("click", function (event) {

            ignoreEvent(event);

            this.navigateGalleryLightbox(1);

        }.bind(this));

        document.addEventListener("keydown", function (event) {

            if (!this.galleryLightbox || this.galleryLightbox.classList.contains("output-lightbox--hidden")) {

                return;

            }

            if (event.key === "Escape") {

                this.closeGalleryLightbox();

                return;

            }

            if (event.key === "ArrowLeft") {

                ignoreEvent(event);

                this.navigateGalleryLightbox(-1);

                return;

            }

            if (event.key === "ArrowRight") {

                ignoreEvent(event);

                this.navigateGalleryLightbox(1);

            }

        }.bind(this));

    };

    Terminal.prototype.getGalleryLightboxItems = function (triggerElement) {

        var scope = null;

        if (!triggerElement) {

            return [];

        }

        if (triggerElement.closest) {

            scope = triggerElement.closest(".output-album-event") ||
                triggerElement.closest(".showcase-page") ||
                triggerElement.closest(".output-gallery");

        }

        scope = scope || this.output;

        return Array.prototype.slice.call(scope.querySelectorAll(".output-gallery-item"));

    };

    Terminal.prototype.buildGalleryLightboxItemData = function (itemElement) {

        return {
            src: itemElement.getAttribute("href"),
            caption: itemElement.getAttribute("data-caption") || ""
        };

    };

    Terminal.prototype.renderGalleryLightboxItem = function (index) {

        var item;
        var isAtStart;
        var isAtEnd;

        if (!this.galleryLightboxItems.length || index < 0 || index >= this.galleryLightboxItems.length) {

            return;

        }

        item = this.galleryLightboxItems[index];
        isAtStart = index === 0;
        isAtEnd = index === this.galleryLightboxItems.length - 1;

        this.galleryLightboxIndex = index;
        this.galleryLightboxImage.removeAttribute("src");
        this.galleryLightboxImage.setAttribute("src", item.src);
        this.galleryLightboxImage.setAttribute("alt", item.caption || "Imagen ampliada");
        this.galleryLightboxCaption.textContent = item.caption;
        this.galleryLightboxPrev.disabled = isAtStart;
        this.galleryLightboxNext.disabled = isAtEnd;
        this.galleryLightbox.classList.toggle("output-lightbox--single", this.galleryLightboxItems.length <= 1);

    };

    Terminal.prototype.navigateGalleryLightbox = function (direction) {

        var nextIndex = this.galleryLightboxIndex + direction;

        if (!this.galleryLightboxItems.length || nextIndex < 0 || nextIndex >= this.galleryLightboxItems.length) {

            return;

        }

        this.renderGalleryLightboxItem(nextIndex);

    };

    Terminal.prototype.openGalleryLightbox = function (triggerElement) {

        var itemElements;
        var itemIndex;

        this.initGalleryLightbox();

        itemElements = this.getGalleryLightboxItems(triggerElement);
        itemIndex = itemElements.indexOf(triggerElement);

        this.galleryLightboxItems = itemElements.length ? itemElements.map(function (itemElement) {

            return this.buildGalleryLightboxItemData(itemElement);

        }.bind(this)) : [this.buildGalleryLightboxItemData(triggerElement)];

        if (itemIndex < 0) {

            itemIndex = 0;

        }

        this.renderGalleryLightboxItem(itemIndex);
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
        this.galleryLightboxItems = [];
        this.galleryLightboxIndex = -1;
        this.galleryLightboxPrev.disabled = true;
        this.galleryLightboxNext.disabled = true;
        this.galleryLightbox.classList.remove("output-lightbox--single");
        document.body.classList.remove("output-lightbox-open");

    };

    Terminal.prototype.openGalleryLightboxWithAnimation = function (triggerElement) {

        if (!triggerElement) {

            return;

        }

        triggerElement.classList.add("is-opening");

        window.setTimeout(function () {

            triggerElement.classList.remove("is-opening");
            this.openGalleryLightbox(triggerElement);

        }.bind(this), 90);

    };

    Terminal.prototype.parseScheduleEventDate = function (event, section) {

        var monthMap = {
            enero: 0,
            febrero: 1,
            marzo: 2,
            abril: 3,
            mayo: 4,
            junio: 5,
            julio: 6,
            agosto: 7,
            septiembre: 8,
            setiembre: 8,
            octubre: 9,
            noviembre: 10,
            diciembre: 11
        };
        var dateText = event && event.date ? String(event.date).toLowerCase().trim() : "";
        var dateMatch = dateText.match(/^(\d{1,2})\s+de\s+([a-zñ]+)(?:\s+de\s+(\d{4}))?$/);
        var day;
        var monthIndex;
        var year;

        if (!dateMatch) {

            return null;

        }

        day = parseInt(dateMatch[1], 10);
        monthIndex = monthMap[dateMatch[2]];
        year = dateMatch[3] ? parseInt(dateMatch[3], 10) : (section && section.year ? section.year : null);

        if (typeof monthIndex !== "number" || !year) {

            return null;

        }

        return new Date(year, monthIndex, day);

    };

    Terminal.prototype.isScheduleEventPast = function (event, section) {

        var eventDate = this.parseScheduleEventDate(event, section);
        var today = new Date();

        today.setHours(0, 0, 0, 0);

        if (!eventDate || isNaN(eventDate.getTime())) {

            return !!event.past;

        }

        eventDate.setHours(0, 0, 0, 0);

        return eventDate.getTime() < today.getTime();

    };

    Terminal.prototype.buildScheduleCardMarkup = function (event, section) {

        var isPast = this.isScheduleEventPast(event, section);
        var cardClassName = "schedule-card schedule-card--" + section.tone + (isPast ? " schedule-card--past" : "");
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

                    return this.buildScheduleCardMarkup(event, section);

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

                    this.openGalleryLightboxWithAnimation(element);

                    return;

                }

                if (element.classList && element.classList.contains("output-album-nav")) {

                    ignoreEvent(event);

                    this.scrollAlbumCarousel(element);

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

        this.refreshOutputGalleryImageOrientation();
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

        if (normalizedCommand === "materiales") {

            normalizedCommand = cmds.IMAGENES.value;

        }

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

            this.showInitialPage({ recordHistory: false });
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

        if (normalizedCommand === cmds.IMAGENES.value) {

            remember(cmds.IMAGENES.value);
            this.prensa();
            return;

        }

        if (normalizedCommand === "imÃ¡genes" || normalizedCommand === "imagenes") {

            remember("imagenes");
            this.prensa_imagenes();
            return;

        }

        if (normalizedCommand === "vÃ­deos" || normalizedCommand === "videos") {

            remember("videos");
            this.prensa_videos();
            return;

        }

        if (normalizedCommand === "lecturas") {

            remember("lecturas");
            this.prensa_lecturas();
            return;

        }

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

        if (cmdComponents === "materiales") {

            cmdComponents = cmds.IMAGENES.value;

        }

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

    Terminal.prototype.el_espectáculo = function () {

        this.clear();

        var output = this.output;

        this.type("# ¿QUÉ ES SCRIB?", function () {

            output.innerHTML += "<br/>" + this.buildSpectacleMarkup() + "<br/><br/>";
            this.type("Para volver al menú, utiliza el comando «reinicio».", this.unlock.bind(this));

        }.bind(this));

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

    Terminal.prototype.renderPressView = function (activeView) {

        this.clear();

        var result = "# PRENSA";
        var output = this.output;

        this.type(result, function () {

            output.innerHTML += "<br/>" + this.buildPressMarkup(activeView) + "<br/><br/>";

            if (activeView === "imagenes") {

                this.initAlbumCarousels();

            }

            this.type("Para volver al menÃº, utiliza el comando Â«reinicioÂ».", this.unlock.bind(this));

        }.bind(this));

    }

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

    //PRENSA

    Terminal.prototype.prensa = function () {

        this.clear();

        var result = "# PRENSA";
        var output = this.output;

        this.type(result, function () {

            output.innerHTML += "<br/>" + this.buildPressMarkup() + "<br/><br/>";
            this.initAlbumCarousels();
            this.type("Para volver al menú, utiliza el comando «reinicio».", this.unlock.bind(this));

        }.bind(this));

    }

    Terminal.prototype.materiales = Terminal.prototype.prensa;
    Terminal.prototype.imagenes = Terminal.prototype.prensa;

    Terminal.prototype.renderPressView = function (activeView) {

        this.clear();

        var result = "# PRENSA";
        var output = this.output;

        this.type(result, function () {

            output.innerHTML += "<br/>" + this.buildPressMarkup(activeView) + "<br/><br/>";

            if (activeView === "imagenes") {

                this.initAlbumCarousels();

            }

            this.type("Para volver al men\u00fa, utiliza el comando \u00abreinicio\u00bb.", this.unlock.bind(this));

        }.bind(this));

    };

    Terminal.prototype.materiales = function () {

        this.renderPressView(null);

    };

    Terminal.prototype.prensa = function () {

        this.renderPressView(null);

    };

    Terminal.prototype.prensa_imagenes = function () {

        this.renderPressView("imagenes");

    };

    Terminal.prototype.prensa_videos = function () {

        this.renderPressView("videos");

    };

    Terminal.prototype.prensa_lecturas = function () {

        this.renderPressView("lecturas");

    };

    Terminal.prototype.imagenes = Terminal.prototype.prensa_imagenes;
    Terminal.prototype.videos = Terminal.prototype.prensa_videos;
    Terminal.prototype.lecturas = Terminal.prototype.prensa_lecturas;

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

