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

        general_help: "A continuación tienes una lista de comandos que puedes usar.\n\n Para cargar el texto instantáneamente presiona ENTER o haz doble click.",

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

        welcome: "Bienvenides a la página oficial de \<SCRI\> B.\n\nPara navegar, introduce alguno de los siguientes comandos:\n\n\u2022 el proyecto\n\u2022 fechas\n\u2022 financiación\n\u2022 la compañía\n\u2022 contacto\n\u2022 reinicio\n\n Si te pierdes en algun momento, utiliza el comando  \"ayuda\".",

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
		
		el_juego_help:"El juego",
		
		musa_help:"Las musas",

		el_proyecto_help:"¿Qué es  SCRIB?",

		liga_help: "Bases de la liga  SCRIB.",

		clasificacion_help: "Clasificación actual de la liga  SCRIB.",

		textos_del_mes_help:"Textos escritos en SCRIB de este mes.",

		fecha_help:"Próximas fechas de  SCRIB.",
		
		financiación_help:"Cómo financiamos el proyecto.",

		la_compañía_help: "Sinopsis de la compañía.",

		contacto_help: "Para encontrar a la compa��a.",

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
		
		EL_JUEGO: { value: "el juego", help: configs.getInstance().el_juego_help},
		
		MUSA: { value: "musa", help: configs.getInstance().musa_help},

		EL_PROYECTO: { value: "el proyecto", help: configs.getInstance().el_proyecto_help},

		//ATRAS: { value: "atras", help: configs.getInstance().el_proyecto_help},

		LIGA: { value: "liga", help: configs.getInstance().liga_help},
		
		FECHAS: { value: "fechas", help: configs.getInstance().fecha_help},

		CLASIFICACIÓN: { value: "clasificación", help: configs.getInstance().clasificacion_help},

		TEXTOS_DEL_MES: { value: "textos del mes", help: configs.getInstance().textos_del_mes_help},
		
		FINANCIACIÓN: { value: "financiación", help: configs.getInstance().financiación_help},

		LA_COMPAÑÍA: { value: "la compañía", help: configs.getInstance().la_compañía_help},

		CONTACTO: { value: "contacto", help: configs.getInstance().contacto_help},

		REBOOT: { value: "reinicio", help: configs.getInstance().reboot_help },

		HELP: { value: "ayuda", help: configs.getInstance().help_help },

    };

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

    };



    Terminal.prototype.type = function (text, callback) {

				this.no_writing = false;

        this.typeSimulator.type(text, callback);

		

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

        this.reset();

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

        this.lock();

					

		

        switch (cmdComponents) {

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
				
			case cmds.MUSA.value:

                this.musa();

                break;

			case cmds.EL_PROYECTO.value:

                this.el_proyecto();

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

			case cmds.LA_COMPAÑÍA.value:

                this.la_compañía();

                break;

			case cmds.CONTACTO.value:

                this.contacto();

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
			
			 var result = "Se te ha redirigido al videojuego SCRIB.";

			var output = this.output;

			this.type(result, this.unlock.bind(this));
			
			location.href='./game/index.html';
    }
		
	//MUSA

	    Terminal.prototype.musa = function () {
			
			this.clear();
			
			 var result = "Te has convertido en musa.";

			var output = this.output;

			this.type(result, this.unlock.bind(this));
			
			location.href='./game/public/index.html';
    }
	//EL PROYECTO

	    Terminal.prototype.el_proyecto = function () {
			
			this.clear();
			var result ="¿QUÉ ES SCRIB?\n\n\n¿Videojuego, escritura improvisada? ¿Se puede hablar de un espectáculo multidisciplinar? ¿Qué es?  Al principio nadie sabe qué es SCRIB. Y es que SCRIB es algo totalmente nuevo en España, incluso en el mundo. No es una pieza performativa, ni un videojuego. Tampoco podemos hablar de escritura en vivo. Si no que es la fusión de dos lenguajes íntimamente relacionados: el lenguaje de la escritura y el lenguaje de la programación informática, lo antiguo y lo moderno engarzados en una sola pieza, hasta convertirse en un espectáculo-videojuego de escritura en vivo.\n\nUNA ODA AL LENGUAJE, A LA ESCRITURA Y A LA LITERATURA\n\nSCRIB explora un nuevo concepto de espectáculo pretendiendo desbloquear la creatividad a través del obstáculo.  Porque sabemos que la escritura es uno de los grandes inventos de la humanidad, sin embargo, cada vez debido a los medios digitales se dedica menos tiempo a la lectura.  Nuestro equipo está formado por escritores (y lectores) que valoran y conocen este arte, y sobre todo su dificultad.\n\nUN ESPECTÁCULO ADAPTABLE\n\nSCRIB tiene una virtud que lo hace único: su adaptabilidad.\n\nLos detonadores para la escritura son amplísimos: puede ser una frase, un testimonio, una idea previa, una historia, o una temática. Es así que cada show es único y diferente.\n\nA su vez, los elementos que lo componen son modificables. Nosotras tenemos en recámara una cartera de escritores y escritoras, a la par que distintos elencos para trabajar. Sin embargo, nos adaptamos a las necesidades del lugar.  Ejemplo de ello es que SCRIB se ha realizado en un sin fín de espacios distintos, desde bares hasta salas teatrales, aulas, ferias literarias, etc.\n\nLA PREMISA\n\nPartiendo de un detonador o varios, dos dramaturgos/as se enfrentarán por ver quién escribe el mejor texto dramático, intentando a su vez, vencer todos los desafíos que les propone SCRIB, nuestro videojuego. Sin embargo, no estarán solas, ya que el público en su papel como \"musa\" cooperará e interactuará  mediante su teléfono móvil de diversas maneras  para ofrecer soluciones creativas y evitar el bloqueo.\n\nLa idea es ganar al contrincante escribiendo lo máximo posible con la mejor calidad literaria atravesando los retos y dificultades del juego y de vuestro propio bloqueo. Es decir, aunque es un enfrentamiento con el otro, también es un enfrentamiento contigo mismo. Es por ello, por lo que no lo llamamos juego competitivo.\n\nUna demostración clara de que si se puede escribir aquí, se puede escribir en cualquier sitio.\n\nEL TIEMPO\n\nEl tiempo en el espectáculo resulta vital. En SCRIB partimos de una cuenta atrás regresiva de 30 segundos. A partir de aquí, con la escritura se darán 5 segundos.\n\nEL JUEGO Y SUS MODOS\n\nEl ingrediente más importante de SCRIB es, sin duda, el videojuego. Este ha sido programado artesanalmente a base de prueba y error.\n\nExisten distintos modos de juego (una serie de pruebas): letra prohibida, letra bendita, palabras bonus, tertulia, etc.\n\nCada cinco minutos el videojuego cambia, pasando a un modo diferente de juego/escritura.\n\n\nPara volver al menú, utiliza el comando \"reinicio\".";

		        var output = this.output;
			output.innerHTML += ("<center><img style='max-width:100%;width:70%;height:auto;' src='./img/scrib.jpg'></center>"+ "<br><br/>");
			this.type(result, this.unlock.bind(this));
    }

	//LIGA

	    Terminal.prototype.liga = function () {

			this.clear();



						 var output = this.output;

         var result = "LIGA\n\n\n\u2022 Sistema de clasificación\n\nOcho participantes, cuatro rondas. Las personas con mejor puntuación se enfrentan en la final. La persona ganadora de la noche recibe 3 puntos, la finalista 2 puntos, y el resto de participantes 1 punto.\n\nDurante la temporada, las participantes irán acumulando puntuaciones y al final de la temporada en junio se considerará Campeona a la persona mejor clasificada.\n\nLa ganadora puede recibir un obsequio simbólico.\n\n\u2022 Cómo participar\n\nEscribiendo un correo a scribaleatorio@gmail.com con el asunto “Liga SCRIB [mes]“.\n\nSolo se tendrán en cuenta los correos para participar en el mes siguiente a partir de las 0:00 del evento de liga del mes actual.\n\n\u2022 Consideraciones\n\nCualquier comportamiento fraudulento en el juego por parte de las participantes será motivo de descalificación.\n\n\nPara volver al menú, utiliza el comando  \"reinicio\".";

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

			output.innerHTML += ("CLASIFICACIÓN\n\n\n<ul class=leaders><li><span>LAURA</span><span>4 pts 🏅🏆</span><li><span>COGE-CAJAS</span><span>4 pts 🏆🏅</span><li><span>QUIQUE</span><span>3 pts 🏆</span><li><span>PIOLÍN LÉSBICO</span><span>3 pts 🏆</span><li><span>MARÍA</span><span>1 pto ✒️</span><li><span>FONT</span><span>1 pto ✒️</span><li><span>TABACHKOVA</span><span>1 pto ✒️</span><li><span>PEDRO</span><span>1 pto ✒️</span><li><span>GOTHAMA</span><span>1 pto ✒️</span></ul> Leyenda:<br>\u2022🏆 Ganadore (+3)<br>\u2022🏅 Finalista (+2)<br>\u2022✒️ Participante (+1)");
			
		var result = "\n\nPara volver al menú, utiliza el comando  \"reinicio\".";

			this.type(result, this.unlock.bind(this));

    }

	//TEXTOS DEL MES

					

	    Terminal.prototype.textos_del_mes = function () {

			

						this.clear();

         var result = "Aquí irían los textos del mes.\n\n\nPara volver al menú, utiliza el comando  \"reinicio\".";

			this.type(result, this.unlock.bind(this));

    }
		
	//FECHAS

					

	    Terminal.prototype.fechas = function () {

			

						this.clear();

         var result = "FECHAS\n\n\n\u2022 12 DE FEBRERO por el Día Internacional de la Niña y la Mujer en la Ciencia en Auditorio de la Universidad Carlos III de Madrid a las 19:00 hrs.\n\n\nPara volver al menú, utiliza el comando \"reinicio\".";

			this.type(result, this.unlock.bind(this));

    }

		//FINANCIACIÓN
		
		Terminal.prototype.financiación = function () {

			this.clear();
			
			 var result = "FINANCIACIÓN Y PATROCINADORES\n\n\n¡Buscamos financiación!\n\nDebido a que somos una compañía joven, los costos de producción del espectáculo nos superan. Son muchas las horas que se han dedicado para que SCRIB haya sido posible, pero todavía nos queda mucho por hacer.\n\nHasta la fecha, nuestros patrocinadores han sido la editorial Así Lo Dijo Casimiro Parker, Enrique Brossa y Aleatorio Bar.\n\n¿Te animas a contribuir?\n\n\nPara volver al menú, utiliza el comando  \"reinicio\".";

			this.type(result, this.unlock.bind(this));
			
    }
	//LA COMPAÑIA
		
		Terminal.prototype.la_compañía = function () {

			this.clear();
			
			 var result = "¿QUIÉNES SOMOS?\n\n\nSUTURA, Compañía de espectáculos.\n\nSutura nace a finales de 2019 en Madrid con la necesidad de contar historias relacionadas con los conflictos de nuestra generación, a la par que destapando tabús (suicidio, racismo, amor romántico, bloqueo creativo, etc). A través de los espectáculos, buscamos suturarte, mostrando que la creación artística puede servir de sanación, aunque esto a veces pueda ser doloroso. Los fundadores de esta compañía somos: Ángela Bueno, David Viñas y Ana Sempere, aunque actualmente regimos la compañía los dos primeros. En 2020 estrenamos en el metro de Madrid su primera pieza, El Viajante, y somos finalistas en el XXIX “Certamen Jóvenes Creadores” con ella. En 2021, nuestra primera obra larga de teatro, Capilla Ardiente, cuya temática principal es el suicidio, estuvo meses en el Off Latina. En 2022 estrenamos el microteatro AEGIS siendo otra vez finalistas del “Certamen Jóvenes Creadores”. Actualmente estamos desarrollando SCRIB, a la par que estamos en creación de nuevos proyectos escénicos.\n\nINTEGRANTES\n\n\nÁNGELA BUENO (BUENA ENJUNDIA).\n\nPresentadora, dramaturga y escenificadora de SCRIB. Madrid, España, 1998. Comienza sus estudios de interpretación a temprana edad primero en Cuarta Pared y posteriormente, en la EMAD (Escuela Municipal de Arte Dramático) durante los años 2002 hasta 2019 desembocando en la dramaturgia. Cursa actualmente su último año en la RESAD en el itinerario de Dramaturgia y Dirección. Ha publicado en el epistolario poético Quiero ser una caja de música, violencias machistas en la juventud adolescente: carta a Antonio Gamoneda (Eolas ediciones, 2016). Ha dirigido piezas como Metronimia (en cocreación con Paula C.M), La charca inútil o Capilla Ardiente. Escribe mayoritariamente piezas teatrales como Sangre en Hawwikuh, Sin ser, Nadine, o Hasta la vista, Benidorm.\n\nDAVID VIÑAS (TRES CEJAS).\n\nPresentador y programador oficial de SCRIB. Madrid, España, 1997. Licenciado en Matemáticas e Informática por la Universidad Politécnica de Madrid. Se interesa por el arte dramático al entrar a formar parte del grupo de teatro universitario Histrión. A su vez, comienza a formarse en escritura en el taller de escritura Fuentetaja e interpretación actoral e improvisación en la academia Wit Impro. Ha publicado en varias ocasiones siendo La jajajada su primer libro (2020, editorial Ediciones en el mar) y sucediéndose Pizza Margarita (2021, editorial Niña Loba). Escribe también piezas teatrales como El viajante (finalista del certamen jóvenes creadores y nominación al mejor texto en el Festival de Microteatro de Tarambana), AEGIS o Capilla Ardiente (finalista del certamen jóvenes creadores).\n\n\nPara volver al menú, utiliza el comando  \"reinicio\".";
 			
			var output = this.output;

			output.innerHTML += ("<center><img style='max-width:100%;width:25%;height:auto;' src='./img/logo_sutura.png'></center>"+ "<br><br/>");
			output.innerHTML += ("<center><img style='max-width:100%;width:auto;height:auto;' src='./img/compania.jpg'></center>"+ "<br><br/>");
			this.type(result, this.unlock.bind(this));
			
			
    }

	//CONTACTO

	    Terminal.prototype.contacto = function () {

						this.clear();

         var result = "CONTACTO Y REDES SOCIALES\n\n\nInstagram: @scrib_show / @su.tu.ra\n\nTwitter: @SU_TU_RA\n\nTeléfono: (+34) 606 917 894 / (+34) 659 693 387\n\n\nPara volver al menú, utiliza el comando  \"reinicio\".";

			    

			this.type(result, this.unlock.bind(this));

			     

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

        for (var cmd in cmds) {

			if(cmds[cmd].value== "el proyecto" ||
			   
			   cmds[cmd].value=="fechas"  ||
			   
			   cmds[cmd].value=="financiación" ||
			   
			   cmds[cmd].value=="la compañía"    ||

			   cmds[cmd].value=="contacto"  ||

			   cmds[cmd].value=="reinicio" 

			  ){

				result += cmds[cmd].value + " - " + cmds[cmd].help + "\n";

			}else{

            }

        }

		      

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

    };


//Hay un pequeño eror aquí. Al iniciarse, no parpadea el cursor.
    TypeSimulator.prototype.type = function (text, callback) {

		

        if (isURL(text)) {

            window.open(text);

        }

        var i = 0;

        var output = this.output;

        var timer = this.timer;

        var skipped = false;

		

        var skip = function () {

            skipped = true;

			

        }.bind(this);

							this.no_writing = true;

        document.addEventListener("dblclick", skip);

		document.addEventListener('keypress', skip);
					      this.no_writing = true;

        (function typer() {

			

			document.getElementById("cmdline").readOnly = true;

									

            if (i < text.length) {

                var char = text.charAt(i);

                var isNewLine = char === "\n";

                output.innerHTML += isNewLine ? "<br/>" : char;

                i++;

                if (!skipped) {

                    setTimeout(typer, isNewLine ? timer * 2 : timer);

                } else {

										this.no_writing = false;

                    output.innerHTML += (text.substring(i).replace(new RegExp("\n", 'g'), "<br/>")) + "<br/>";

                    document.removeEventListener("dblclick", skip);

					document.removeEventListener("keypress", skip);

					document.getElementById("cmdline").readOnly = false;

					this.no_writing = true;

                    callback();

										this.no_writing = true;

                }

            } else if (callback) {

									this.no_writing = false;

                output.innerHTML += "<br/>";

                document.removeEventListener("dblclick", skip);

				document.removeEventListener("keypress", skip);

				this.no_writing = false;

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

