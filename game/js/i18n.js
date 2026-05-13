(function () {
    const I18N_DEFAULT_LANG_2P = "es";
    const CUSTOM_EVENT_NAME = "scrib:language-changed";
    const languageListeners = new Set();

    const I18N_TEXTS_2P = {
        es: {
            "lang.es": "Espa\u00f1ol",
            "lang.en": "English",
            "lang.fr": "Fran\u00e7ais",
            "options.language_label": "IDIOMA",
            "options.language_aria": "Idioma",
            "score.words_label": "Palabras",
            "score.words_count": "{count} palabras",
            "score.muses_label": "Musas",
            "score.muses_count": "{count} musas",
            "mode.name.letra_bendita": "LETRA BENDITA",
            "mode.name.letra_prohibida": "LETRA PROHIBIDA",
            "mode.name.palabras_bonus": "PALABRAS BONUS",
            "mode.name.palabras_prohibidas": "PALABRAS PROHIBIDAS",
            "mode.name.tertulia": "TERTULIA",
            "mode.name.frase_final": "FRASE FINAL",
            "mode.title.letra_bendita": "NIVEL LETRA BENDITA",
            "mode.title.letra_prohibida": "NIVEL LETRA PROHIBIDA",
            "mode.title.palabras_bonus": "NIVEL PALABRAS BONUS",
            "mode.title.palabras_prohibidas": "NIVEL PALABRAS PROHIBIDAS",
            "mode.title.tertulia": "NIVEL TERTULIA",
            "mode.title.frase_final": "NIVEL FRASE FINAL",
            "mode.strip.letra_bendita": "LETRA|BENDITA",
            "mode.strip.letra_prohibida": "LETRA|MALDITA",
            "mode.strip.palabras_bonus": "PALABRA|BENDITA",
            "mode.strip.palabras_prohibidas": "PALABRA|MALDITA",
            "mode.strip.tertulia": "TERTULIA",
            "mode.strip.frase_final": "FRASE|FINAL",
            "mode.desc.bonus": "SUMA TIEMPO CON PALABRAS BONUS",
            "mode.desc.prohibidas": "EVITA LAS PALABRAS PROHIBIDAS",
            "mode.desc.tertulia": "DIALOGA CON TUS MUSAS",
            "mode.desc.frase_final": "ULTIMA RONDA",
            "mode.rule.bendita": "CADA PALABRA DEBE INCLUIR LA LETRA {letter}.",
            "mode.rule.prohibida": "NINGUNA PALABRA PUEDE USAR LA LETRA {letter}.",
            "mode.goal.final_phrase": "\u2b06\ufe0f Introduce la frase final para ganar. \u2b06\ufe0f",
            "mode.goal.last_one": "\u00a1Esta es la ultima!",
            "countdown.ready": "\u00bfPREPARADOS?",
            "countdown.write": "\u00a1ESCRIBE!",
            "timer.time_up": "\u00a1Tiempo!",
            "res.game_over": "GAME OVER",
            "res.title_prefix": "\u00bfQUIERES",
            "res.title_highlight": "RESUCITAR",
            "res.title_suffix": "A CAMBIO DE PALABRAS?",
            "res.btn_yes": "Si",
            "res.btn_no": "No",
            "res.keys_hint": "Usa flechas y Enter",
            "res.quantity_title": "Selecciona la cantidad de palabras",
            "res.btn_confirm": "Confirmar",
            "res.btn_back": "Atras",
            "res.quantity.words_label": "Palabras",
            "res.quantity.seconds_label": "Segundos",
            "res.quantity.max": "MAX {max}",
            "ui.writer_1": "ESCRITXR 1",
            "ui.writer_2": "ESCRITXR 2",
            "ui.writer_blue": "ESCRITORA AZUL",
            "ui.writer_red": "ESCRITORA ROJA",
            "ui.writer_generic": "ESCRITXR",
            "ui.muse_label": "Musa",
            "ui.text_complete": "\ud83d\udc40 TEXTO COMPLETO",
            "ui.hide_text": "OCULTAR TEXTO",
            "ui.back": "\u2b05\ufe0f VOLVER",
            "ui.flag": "\ud83c\udff3\ufe0f\u200d\ud83c\udf08 BANDERA",
            "ui.wave_flag": "\u00a1MUSA, AGITA TU BANDERA!",
            "ui.inspiration_title": "INSPIRACION",
            "ui.cloud_title": "NUBE DE INSPIRACION",
            "ui.stats_live_title": "STATS DE LA PARTIDA",
            "ui.voting_live": "VOTACION EN CURSO",
            "ui.votes": "VOTOS",
            "ui.choose_disadvantage": "ELIGE UNA DESVENTAJA",
            "ui.choose_disadvantage_for": "ELIGE UNA DESVENTAJA PARA {name}",
            "ui.thanks_for_voting": "GRACIAS POR VOTAR",
            "ui.gift_offer": "{name} quiere regalarte algo.",
            "ui.gift_subtext": "Pulsa para descargarlo.",
            "ui.download_gift_aria": "Descargar regalo",
            "writer.total_label": "PUNTOS USADOS:",
            "writer.total_divider": "de",
            "writer.total_cta": "\u00a1A ESCRIBIR!",
            "writer.btn_start": "\u00a1A ESCRIBIR!",
            "writer.attr.fuerza.name": "Fuerza",
            "writer.attr.fuerza.aria": "\u00bfQue es la fuerza?",
            "writer.attr.fuerza.alt": "Ayuda fuerza",
            "writer.attr.fuerza.tooltip": "La fuerza determina la cantidad de tiempo que obtienes por cada palabra a\u00f1adida.<br><br>A mayor fuerza, se obtiene mayor cantidad de tiempo por palabra.",
            "writer.attr.agilidad.name": "Agilidad",
            "writer.attr.agilidad.aria": "\u00bfQue es la agilidad?",
            "writer.attr.agilidad.alt": "Ayuda agilidad",
            "writer.attr.agilidad.tooltip": "La agilidad mide la rapidez y destreza de movimientos.<br><br>Influye en la rapidez con la que se borra el texto.",
            "writer.attr.destreza.name": "Destreza",
            "writer.attr.destreza.aria": "\u00bfQue es la destreza?",
            "writer.attr.destreza.alt": "Ayuda destreza",
            "writer.attr.destreza.tooltip": "La destreza indica la precision y rapidez al actuar.<br><br>Las desventajas duraran menos tiempo.",
            "warmup.title": "TUTORIAL",
            "warmup.request.none": "SIN DETONADOR ACTIVO",
            "warmup.request.none_short": "NINGUNO",
            "warmup.request.lugares": "LUGARES",
            "warmup.request.acciones": "ACCIONES",
            "warmup.request.frase_final": "FRASE FINAL",
            "warmup.request.writer": "DETONADOR: {label}",
            "warmup.request.spectator": "DETONADOR ACTUAL: {label}",
            "warmup.state.inactive": "Tutorial inactivo.",
            "warmup.state.hidden": "Tutorial oculto.",
            "warmup.state.waiting_view": "Esperando vista de tutorial.",
            "warmup.state.select_words": "Selecciona palabras de tu equipo y pulsa CERRAR DETONADOR.",
            "warmup.state.closed_choose_final": "Consigna cerrada. Elige una palabra final de las seleccionadas.",
            "warmup.state.final_fixed": "Palabra final fijada: {word}.",
            "warmup.state.both_final": "Ambas escritoras eligieron su palabra final. Esperando nueva consigna.",
            "warmup.state.one_final_missing": "Falta una palabra final para completar esta consigna.",
            "warmup.state.table_closed_choose_final": "Consigna cerrada en una mesa. Falta elegir palabra final.",
            "warmup.state.receiving_words": "Recibiendo palabras de las musas.",
            "warmup.button.select_words": "SELECCIONA PALABRAS",
            "warmup.button.closed": "DETONADOR CERRADO",
            "warmup.button.close_count": "CERRAR DETONADOR ({count})",
            "warmup.final_word": "PALABRA FINAL: {word}",
            "warmup.word_chosen": "PALABRA ELEGIDA",
            "warmup.final.pending": "PENDIENTE",
            "warmup.final.choosing": "ELIGIENDO...",
            "warmup.feedback.generic_error": "No se pudo completar la accion.",
            "warmup.feedback.no_trigger": "No hay detonador activo.",
            "warmup.feedback.closed_by_writer": "La consigna esta cerrada por tu escritxr.",
            "warmup.feedback.write_word": "Escribe una palabra.",
            "warmup.feedback.write_phrase": "Escribe una frase.",
            "warmup.feedback.one_word_only": "Solo se permite una palabra, sin espacios.",
            "warmup.feedback.max_chars": "Maximo {max} caracteres.",
            "warmup.feedback.word_sent": "Palabra enviada.",
            "warmup.feedback.phrase_sent": "Frase enviada.",
            "warmup.feedback.no_spaces": "No se permiten espacios en la inspiracion.",
            "warmup.feedback.useful_word": "Recuerda que la palabra debe serle util.",
            "warmup.feedback.word_highlighted": "{name} ha destacado tu palabra!",
            "warmup.feedback.destiny": "Se hara tu destino, Musa.",
            "warmup.preview.if_sent": "Si la envias:",
            "warmup.preview.if_sent_add": "Sumara si la envias:",
            "warmup.preview.if_sent_subtract": "Restara si la envias:",
            "warmup.preview.seconds_short": "s",
            "warmup.inspire": "INSPIRAR <span class=\"btn-emoji\" aria-hidden=\"true\">\ud83d\ude80</span>",
            "warmup.inspiring": "Inspirando...",
            "warmup.muse.state.none": "Sin detonador activo. Usa la bandera hasta que control active una consigna.",
            "warmup.muse.state.lugares_html": "Inspira <span class=\"calentamiento-consigna-lugares\">lugares o sitios</span> donde la historia nacera.",
            "warmup.muse.state.acciones_html": "Inspira <span class=\"calentamiento-consigna-acciones\">acciones (verbos)</span> con las que la historia avance.",
            "warmup.muse.state.frase_final_html": "Inspira la <span class=\"calentamiento-consigna-frase-final\">frase final</span>.",
            "warmup.muse.placeholder.word": "Escribe una palabra",
            "warmup.muse.placeholder.place": "Ejemplo: playa",
            "warmup.muse.placeholder.action": "Ejemplo: correr",
            "warmup.muse.placeholder.final": "Ejemplo: hacia el destino final",
            "stats.current_level": "Nivel actual",
            "stats.timestamp.none": "Sin datos",
            "stats.state.waiting": "Esperando estadisticas de las escritoras...",
            "stats.time.waiting": "Esperando datos de tiempo en vivo...",
            "stats.axis.y_time_left": "Vida",
            "stats.axis.x_elapsed": "Tiempo transcurrido",
            "credits.thanks_title": "AGRADECIMIENTOS:",
            "credits.thanks_pending": "Agradecimientos pendientes.",
            "credits.muses_title": "MUSAS",
            "credits.muses_blue": "MUSAS AZULES",
            "credits.muses_red": "MUSAS ROJAS",
            "credits.muses_empty": "Sin musas registradas",
            "credits.closure": "Una produccion de SUTURA TEATRO.",
            "vote.chart_help": "Toca un quesito del grafico para votar.",
            "vote.remaining_aria": "Tiempo restante de votacion",
            "vote.thanks_detail": "Gracias por votar {vote}.",
            "world.eyebrow": "INICIANDO SISTEMA MUSA",
            "world.title": "ENTRANDO EN UN NUEVO MUNDO",
            "world.copy_fallback": "Preparando enlace creativo.",
            "world.copy": "{muse} ha elegido apoyar a {writer}. Preparando la entrada al mundo de juego.",
            "world.status.linking": "\ud83d\udd17 ENLAZANDO CANAL DE INSPIRACION",
            "world.status.sync": "\u2699\ufe0f SINCRONIA DE SISTEMA ESTABLE",
            "world.status.compiling": "\ud83e\udde9 COMPILANDO EL NUEVO MUNDO",
            "world.status.color": "\ud83c\udfa8 VOLCANDO COLOR Y ATMOSFERA",
            "world.status.authorized": "\u2705 ACCESO AUTORIZADO",
            "world.status.loaded": "\ud83c\udfc1 MUNDO CARGADO",
            "world.log.link_muse": "\ud83d\udd17 ENLAZANDO A {muse}",
            "world.log.sync_pen": "\ud83d\udd8b\ufe0f SINCRONIZANDO PLUMA {team}",
            "world.log.load_imagery": "\ud83d\udcd6 CARGANDO IMAGINARIO DE {writer}",
            "world.log.paint_world": "\ud83c\udfa8 PINTANDO EL COLOR DEL MUNDO",
            "world.log.portal": "\ud83c\udf00 ABRIENDO PORTAL DE INSPIRACION",
            "world.team.blue": "AZUL",
            "world.team.red": "ROJO",
            "control.button.pause": "\u23f8\ufe0f PAUSAR",
            "control.button.resume": "\u25b6\ufe0f REANUDAR",
            "control.button.tutorial_view": "\ud83d\udcd6 VISTA TUTORIAL",
            "control.button.game_view": "\ud83c\udfae VISTA PARTIDA",
            "control.button.parameters": "\u2699\ufe0f PAR\u00c1METROS",
            "control.button.controls": "\ud83c\udfae CONTROLES",
            "control.button.credits": "\ud83c\udfac CR\u00c9DITOS",
            "control.button.delete_saved": "BORRAR TEXTO",
            "control.button.delete_saved.off": "BORRAR TEXTO",
            "control.button.delete_saved.on": "BORRAR TEXTO",
            "control.button.skip_tertulia": "\u23ed\ufe0f SKIP TERTULIA",
            "control.button.clear": "\ud83e\uddf9 LIMPIAR",
            "control.button.reset_score": "\u21bb REINICIAR MARCADOR",
            "control.button.write": "\u270e ESCRIBIR",
            "control.button.stats": "\ud83d\udcca STATS",
            "control.button.cloud": "\u2601\ufe0f NUBE DE INSPIRACI\u00d3N",
            "control.button.download_texts": "\u2b07\ufe0f DESCARGAR TEXTOS",
            "control.button.ask_feedback": "\ud83d\udde8\ufe0f PEDIR FEEDBACK",
            "control.button.giant_timer": "\u23f1\ufe0f TEMPORIZADOR GIGANTE",
            "control.button.show_credits": "\u2b50 MOSTRAR CR\u00c9DITOS",
            "control.button.teleprompter": "\ud83c\udf99\ufe0f TELEPROMPTER",
            "control.button.load": "\ud83d\udcbe CARGAR",
            "control.button.flags.on": "\ud83d\udea9 BANDERAS ACTIVADAS",
            "control.button.flags.off": "\ud83d\udea9 BANDERAS DESACTIVADAS",
            "control.button.request_places": "\ud83d\udccd PEDIR LUGARES",
            "control.button.request_actions": "\ud83c\udfc3 PEDIR ACCIONES",
            "control.button.request_final_phrase": "\ud83d\udcac PEDIR FRASE FINAL",
            "control.button.end.blue": "\ud83d\udd35 FIN",
            "control.button.end.red": "\ud83d\udd34 FIN",
            "control.title.tutorial": "\ud83d\udcd6 TUTORIAL",
            "control.title.game": "\ud83c\udfae JUEGO",
            "control.title.representation": "\ud83c\udfad REPRESENTACI\u00d3N",
            "control.title.representation_short": "\ud83c\udfad REPR.",
            "control.subtitle.muses": "DETONADORES PARA MUSAS",
            "control.label.final_phrase": "FRASE FINAL:",
            "control.placeholder.final_phrase": "Escribe la frase final...",
            "control.stats.slides": "\ud83d\udcca SLIDES STATS",
            "control.stats.prev_aria": "Slide anterior",
            "control.stats.next_aria": "Slide siguiente",
            "control.spectator_scale.label": "\ud83d\udc41\ufe0f TAMA\u00d1O ESPECTADOR",
            "control.spectator_scale.value": "{percent}%",
            "control.spectator_scale.decrease_aria": "Empeque\u00f1ecer espectador",
            "control.spectator_scale.increase_aria": "Agrandar espectador",
            "control.spectator_scale.reset_aria": "Restablecer tama\u00f1o del espectador ({percent}%)",
            "control.warmup.current_trigger": "DETONADOR ACTUAL: {label}",
            "control.warmup.flow.open": "ABIERTO",
            "control.warmup.flow.blocked": "BLOQUEADO",
            "control.warmup.flow.final": "FINAL {word}",
            "control.warmup.flow.summary": "J1: {j1} | J2: {j2}",
            "control.mode.none": "Ninguno",
            "control.time.seconds_count": "{count} segundos",
            "control.teleprompter.controls": "\ud83c\udf99\ufe0f CONTROLES",
            "control.teleprompter.play": "\u25b6\ufe0f PLAY",
            "control.teleprompter.pause": "\u23f8\ufe0f PAUSA",
            "control.teleprompter.status.empty": "Sin carga en teleprompter",
            "control.credits.title": "CR\u00c9DITOS DEL SHOW",
            "control.credits.help": "Editar estos campos actualiza el pase de cr\u00e9ditos del espectador.",
            "control.credits.field.escritxr_rojo": "ESCRITXR ROJO",
            "control.credits.field.escritxr_azul": "ESCRITXR AZUL",
            "control.credits.field.interprete_azul_1": "INT\u00c9RPRETE AZUL 1",
            "control.credits.field.interprete_azul_2": "INT\u00c9RPRETE AZUL 2",
            "control.credits.field.interprete_rojo_1": "INT\u00c9RPRETE ROJO 1",
            "control.credits.field.interprete_rojo_2": "INT\u00c9RPRETE ROJO 2",
            "control.credits.field.programacion": "PROGRAMACI\u00d3N",
            "control.credits.field.dramaturgia": "DRAMATURGIA",
            "control.credits.field.iluminacion": "ILUMINACI\u00d3N",
            "control.credits.field.musica": "M\u00daSICA",
            "control.credits.field.voz_off": "VOZ EN OFF",
            "control.credits.field.agradecimientos": "AGRADECIMIENTOS",
            "control.credits.placeholder.escritxr_rojo": "Nombre escritxr rojo",
            "control.credits.placeholder.escritxr_azul": "Nombre escritxr azul",
            "control.credits.placeholder.interprete_azul_1": "Nombre int\u00e9rprete azul 1",
            "control.credits.placeholder.interprete_azul_2": "Nombre int\u00e9rprete azul 2",
            "control.credits.placeholder.interprete_rojo_1": "Nombre int\u00e9rprete rojo 1",
            "control.credits.placeholder.interprete_rojo_2": "Nombre int\u00e9rprete rojo 2",
            "control.credits.placeholder.programacion": "Programaci\u00f3n",
            "control.credits.placeholder.dramaturgia": "Dramaturgia",
            "control.credits.placeholder.iluminacion": "Iluminaci\u00f3n",
            "control.credits.placeholder.musica": "M\u00fasica",
            "control.credits.placeholder.voz_off": "Voz en off",
            "control.credits.placeholder.agradecimientos": "Agradecimientos del show",
            "control.credits.production": "UNA PRODUCCI\u00d3N DE SUTURA TEATRO",
            "control.connection.title": "CONEXI\u00d3N",
            "control.connection.server": "SERVIDOR",
            "control.connection.players": "PLAYERS",
            "control.param.advantage": "VENTAJA",
            "control.param.advantage_vote": "VOTACI\u00d3N VENTAJA",
            "control.param.level": "NIVEL",
            "control.param.start": "INICIO",
            "control.param.letter_change": "CAMBIO LETRA",
            "control.param.word_change": "CAMBIO PALABRA",
            "control.param.muse_limit": "L\u00cdMITE PALABRAS MUSAS",
            "control.param.spectator_scale": "TAMA\u00d1O ESPECTADOR",
            "control.unit.seconds": "segundos",
            "control.unit.minutes_short": "mins.",
            "control.unit.seconds_short": "segs.",
            "control.unit.words": "palabras",
            "control.connection.connected": "CONECTADO",
            "control.connection.disconnected": "DESCONECTADO",
            "control.heatmap_title": "Mapa de calor {name}",
            "pdf.match_report_title": "INFORME DE PARTIDA",
            "pdf.life.no_data": "Sin datos de vida registrados.",
            "pdf.key_named": "Tecla {key}",
            "pdf.key_unknown": "Tecla desconocida",
            "pdf.unit.keystrokes_per_minute": "{count} puls/min",
            "pdf.section.quick_summary": "Resumen rapido",
            "pdf.section.heatmap": "Mapa de calor",
            "pdf.section.highlighted_letters": "Letras destacadas",
            "pdf.section.highlighted_words": "Palabras destacadas",
            "pdf.section.life_evolution": "Evolucion de vida",
            "pdf.summary.total_duration": "Duracion total",
            "pdf.summary.total_keystrokes": "Pulsaciones totales",
            "pdf.summary.distinct_keys": "Teclas distintas",
            "pdf.summary.estimated_pace": "Ritmo estimado",
            "pdf.summary.life_min": "Vida minima",
            "pdf.summary.life_max": "Vida maxima",
            "pdf.summary.life_avg": "Vida media",
            "pdf.summary.top_keys": "Top teclas",
            "pdf.kind.blessed": "BENDITA",
            "pdf.kind.cursed": "MALDITA",
            "pdf.letters": "Letras",
            "pdf.words": "Palabras",
            "pdf.insertions_count": "{count} inserciones",
            "pdf.muse_gift_title": "REGALO DE MUSA",
            "pdf.muse_fallback": "MUSA",
            "pdf.writer_fallback": "ESCRITOR",
            "pdf.muse_team_writer_line": "Equipo {team} - {writer}",
            "pdf.muse_stat.sent": "Enviadas",
            "pdf.muse_stat.entered": "Introducidas",
            "pdf.muse_stat.effectiveness": "Efectividad",
            "pdf.muse_stat.superbonus": "Superbonus",
            "pdf.muse_stat.impact": "Impacto",
            "pdf.muse_words_sent_title": "PALABRAS ENVIADAS",
            "pdf.muse_words_empty": "No hay palabras registradas para esta musa.",
            "pdf.muse_mode_bonus": "BONUS",
            "pdf.muse_mode_cursed_word": "MALDITA",
            "pdf.muse_mode_blessed_letter": "LETRA BENDITA",
            "pdf.muse_mode_cursed_letter": "LETRA MALDITA",
            "pdf.muse_mode_generic": "MUSA",
            "pdf.muse_status_entered_by_rival": "[INTRODUCIDA POR RIVAL]",
            "pdf.muse_status_entered": "[INTRODUCIDA]",
            "pdf.muse_status_pending": "[EN COLA/NO USADA]",
            "pdf.superbonus": "SUPERBONUS",
            "pdf.metadata.muse_title": "SCRIB regalo musa {name}",
            "pdf.metadata.muse_subject": "Palabras musa: {words}",
            "pdf.metadata.muse_keywords": "scrib,musa,{clientId},personalizado",
            "actor.time_limit": "\u00a1INTERPRETE, ES HORA DE ACTUAR!",
            "game.finished": "\u00a1TEXTO TERMINADO!",
            "game.no_words_lost": "\u00a1PERDISTE, NO ESCRIBISTE NADA!"
        },
        en: {
            "lang.es": "Spanish",
            "lang.en": "English",
            "lang.fr": "French",
            "options.language_label": "LANGUAGE",
            "options.language_aria": "Language",
            "score.words_label": "Words",
            "score.words_count": "{count} words",
            "score.muses_label": "Muses",
            "score.muses_count": "{count} muses",
            "mode.name.letra_bendita": "BLESSED LETTER",
            "mode.name.letra_prohibida": "FORBIDDEN LETTER",
            "mode.name.palabras_bonus": "BONUS WORDS",
            "mode.name.palabras_prohibidas": "FORBIDDEN WORDS",
            "mode.name.tertulia": "MUSE CHAT",
            "mode.name.frase_final": "FINAL SENTENCE",
            "mode.title.letra_bendita": "BLESSED LETTER LEVEL",
            "mode.title.letra_prohibida": "FORBIDDEN LETTER LEVEL",
            "mode.title.palabras_bonus": "BONUS WORDS LEVEL",
            "mode.title.palabras_prohibidas": "FORBIDDEN WORDS LEVEL",
            "mode.title.tertulia": "MUSE CHAT LEVEL",
            "mode.title.frase_final": "FINAL SENTENCE LEVEL",
            "mode.strip.letra_bendita": "BLESSED|LETTER",
            "mode.strip.letra_prohibida": "CURSED|LETTER",
            "mode.strip.palabras_bonus": "BONUS|WORD",
            "mode.strip.palabras_prohibidas": "CURSED|WORD",
            "mode.strip.tertulia": "MUSE CHAT",
            "mode.strip.frase_final": "FINAL|LINE",
            "mode.desc.bonus": "ADD TIME WITH BONUS WORDS",
            "mode.desc.prohibidas": "AVOID FORBIDDEN WORDS",
            "mode.desc.tertulia": "CHAT WITH YOUR MUSES",
            "mode.desc.frase_final": "FINAL ROUND",
            "mode.rule.bendita": "EVERY WORD MUST INCLUDE LETTER {letter}.",
            "mode.rule.prohibida": "NO WORD CAN USE LETTER {letter}.",
            "mode.goal.final_phrase": "\u2b06\ufe0f Type the final sentence to win. \u2b06\ufe0f",
            "mode.goal.last_one": "This is the last one!",
            "countdown.ready": "READY?",
            "countdown.write": "WRITE!",
            "timer.time_up": "Time's up!",
            "res.game_over": "GAME OVER",
            "res.title_prefix": "DO YOU WANT TO",
            "res.title_highlight": "REVIVE",
            "res.title_suffix": "IN EXCHANGE FOR WORDS?",
            "res.btn_yes": "Yes",
            "res.btn_no": "No",
            "res.keys_hint": "Use arrows and Enter",
            "res.quantity_title": "Choose how many words",
            "res.btn_confirm": "Confirm",
            "res.btn_back": "Back",
            "res.quantity.words_label": "Words",
            "res.quantity.seconds_label": "Seconds",
            "res.quantity.max": "MAX {max}",
            "ui.writer_1": "WRITER 1",
            "ui.writer_2": "WRITER 2",
            "ui.writer_blue": "BLUE WRITER",
            "ui.writer_red": "RED WRITER",
            "ui.writer_generic": "WRITER",
            "ui.muse_label": "Muse",
            "ui.text_complete": "\ud83d\udc40 FULL TEXT",
            "ui.hide_text": "HIDE TEXT",
            "ui.back": "\u2b05\ufe0f BACK",
            "ui.flag": "\ud83c\udff3\ufe0f\u200d\ud83c\udf08 FLAG",
            "ui.wave_flag": "MUSE, WAVE YOUR FLAG!",
            "ui.inspiration_title": "INSPIRATION",
            "ui.cloud_title": "INSPIRATION CLOUD",
            "ui.stats_live_title": "MATCH STATS",
            "ui.voting_live": "VOTING IN PROGRESS",
            "ui.votes": "VOTES",
            "ui.choose_disadvantage": "CHOOSE A DISADVANTAGE",
            "ui.choose_disadvantage_for": "CHOOSE A DISADVANTAGE FOR {name}",
            "ui.thanks_for_voting": "THANKS FOR VOTING",
            "ui.gift_offer": "{name} wants to give you something.",
            "ui.gift_subtext": "Tap to download it.",
            "ui.download_gift_aria": "Download gift",
            "writer.total_label": "USED POINTS:",
            "writer.total_divider": "of",
            "writer.total_cta": "LET'S WRITE!",
            "writer.btn_start": "LET'S WRITE!",
            "warmup.title": "TUTORIAL",
            "warmup.request.none": "NO ACTIVE TRIGGER",
            "warmup.request.none_short": "NONE",
            "warmup.request.lugares": "PLACES",
            "warmup.request.acciones": "ACTIONS",
            "warmup.request.frase_final": "FINAL LINE",
            "warmup.request.writer": "TRIGGER: {label}",
            "warmup.request.spectator": "CURRENT TRIGGER: {label}",
            "warmup.state.inactive": "Tutorial inactive.",
            "warmup.state.hidden": "Tutorial hidden.",
            "warmup.state.waiting_view": "Waiting for tutorial view.",
            "warmup.state.select_words": "Select words from your team and press CLOSE TRIGGER.",
            "warmup.state.closed_choose_final": "Trigger closed. Choose one final word from the selected ones.",
            "warmup.state.final_fixed": "Final word locked: {word}.",
            "warmup.state.both_final": "Both writers chose their final word. Waiting for a new prompt.",
            "warmup.state.one_final_missing": "One final word is still missing to complete this prompt.",
            "warmup.state.table_closed_choose_final": "Trigger closed at one table. A final word still needs to be chosen.",
            "warmup.state.receiving_words": "Receiving words from the muses.",
            "warmup.button.select_words": "SELECT WORDS",
            "warmup.button.closed": "TRIGGER CLOSED",
            "warmup.button.close_count": "CLOSE TRIGGER ({count})",
            "warmup.final_word": "FINAL WORD: {word}",
            "warmup.word_chosen": "CHOSEN WORD",
            "warmup.final.pending": "PENDING",
            "warmup.final.choosing": "CHOOSING...",
            "warmup.feedback.generic_error": "The action could not be completed.",
            "warmup.feedback.no_trigger": "There is no active trigger.",
            "warmup.feedback.closed_by_writer": "The prompt is closed by your writer.",
            "warmup.feedback.write_word": "Type a word.",
            "warmup.feedback.write_phrase": "Type a sentence.",
            "warmup.feedback.one_word_only": "Only one word is allowed, no spaces.",
            "warmup.feedback.max_chars": "Maximum {max} characters.",
            "warmup.feedback.word_sent": "Word sent.",
            "warmup.feedback.phrase_sent": "Sentence sent.",
            "warmup.feedback.no_spaces": "Spaces are not allowed in the inspiration.",
            "warmup.feedback.useful_word": "Remember: the word must be useful.",
            "warmup.feedback.word_highlighted": "{name} highlighted your word!",
            "warmup.feedback.destiny": "Your fate shall be done, Muse.",
            "warmup.preview.if_sent": "If you send it:",
            "warmup.preview.if_sent_add": "It will add if sent:",
            "warmup.preview.if_sent_subtract": "It will subtract if sent:",
            "warmup.preview.seconds_short": "s",
            "warmup.inspire": "INSPIRE <span class=\"btn-emoji\" aria-hidden=\"true\">\ud83d\ude80</span>",
            "warmup.inspiring": "Inspiring...",
            "warmup.muse.state.none": "No active trigger. Use the flag until control opens a prompt.",
            "warmup.muse.state.lugares_html": "Inspire <span class=\"calentamiento-consigna-lugares\">places or locations</span> where the story can begin.",
            "warmup.muse.state.acciones_html": "Inspire <span class=\"calentamiento-consigna-acciones\">actions (verbs)</span> that move the story forward.",
            "warmup.muse.state.frase_final_html": "Inspire the <span class=\"calentamiento-consigna-frase-final\">final sentence</span>.",
            "warmup.muse.placeholder.word": "Type a word",
            "warmup.muse.placeholder.place": "Example: beach",
            "warmup.muse.placeholder.action": "Example: run",
            "warmup.muse.placeholder.final": "Example: toward the final destination",
            "stats.current_level": "Current level",
            "stats.timestamp.none": "No data",
            "stats.state.waiting": "Waiting for live writer stats...",
            "stats.time.waiting": "Waiting for live time data...",
            "stats.axis.y_time_left": "Life",
            "stats.axis.x_elapsed": "Elapsed time",
            "credits.thanks_title": "THANKS:",
            "credits.thanks_pending": "Thanks section pending.",
            "credits.muses_title": "MUSES",
            "credits.muses_blue": "BLUE MUSES",
            "credits.muses_red": "RED MUSES",
            "credits.muses_empty": "No registered muses",
            "credits.closure": "A production by SUTURA TEATRO.",
            "vote.chart_help": "Tap a chart slice to vote.",
            "vote.remaining_aria": "Remaining voting time",
            "vote.thanks_detail": "Thanks for voting {vote}.",
            "world.eyebrow": "BOOTING MUSE SYSTEM",
            "world.title": "ENTERING A NEW WORLD",
            "world.copy_fallback": "Preparing creative link.",
            "world.copy": "{muse} chose to support {writer}. Preparing the entry into the game world.",
            "world.status.linking": "\ud83d\udd17 LINKING INSPIRATION CHANNEL",
            "world.status.sync": "\u2699\ufe0f SYSTEM SYNC STABLE",
            "world.status.compiling": "\ud83e\udde9 COMPILING THE NEW WORLD",
            "world.status.color": "\ud83c\udfa8 POURING COLOR AND ATMOSPHERE",
            "world.status.authorized": "\u2705 ACCESS AUTHORIZED",
            "world.status.loaded": "\ud83c\udfc1 WORLD LOADED",
            "world.log.link_muse": "\ud83d\udd17 LINKING TO {muse}",
            "world.log.sync_pen": "\ud83d\udd8b\ufe0f SYNCING {team} PEN",
            "world.log.load_imagery": "\ud83d\udcd6 LOADING IMAGERY FOR {writer}",
            "world.log.paint_world": "\ud83c\udfa8 PAINTING THE WORLD COLOR",
            "world.log.portal": "\ud83c\udf00 OPENING INSPIRATION PORTAL",
            "world.team.blue": "BLUE",
            "world.team.red": "RED",
            "control.button.pause": "\u23f8\ufe0f PAUSE",
            "control.button.resume": "\u25b6\ufe0f RESUME",
            "control.button.tutorial_view": "\ud83d\udcd6 TUTORIAL VIEW",
            "control.button.game_view": "\ud83c\udfae GAME VIEW",
            "control.button.parameters": "\u2699\ufe0f PARAMETERS",
            "control.button.controls": "\ud83c\udfae CONTROLS",
            "control.button.credits": "\ud83c\udfac CREDITS",
            "control.button.delete_saved": "CLEAR TEXT",
            "control.button.delete_saved.off": "CLEAR TEXT",
            "control.button.delete_saved.on": "CLEAR TEXT",
            "control.button.skip_tertulia": "\u23ed\ufe0f SKIP MUSE CHAT",
            "control.button.clear": "\ud83e\uddf9 CLEAR",
            "control.button.reset_score": "\u21bb RESET SCORE",
            "control.button.write": "\u270e WRITE",
            "control.button.stats": "\ud83d\udcca STATS",
            "control.button.cloud": "\u2601\ufe0f INSPIRATION CLOUD",
            "control.button.download_texts": "\u2b07\ufe0f DOWNLOAD TEXTS",
            "control.button.ask_feedback": "\ud83d\udde8\ufe0f ASK FEEDBACK",
            "control.button.giant_timer": "\u23f1\ufe0f GIANT TIMER",
            "control.button.show_credits": "\u2b50 SHOW CREDITS",
            "control.button.teleprompter": "\ud83c\udf99\ufe0f TELEPROMPTER",
            "control.button.load": "\ud83d\udcbe LOAD",
            "control.button.flags.on": "\ud83d\udea9 FLAGS ON",
            "control.button.flags.off": "\ud83d\udea9 FLAGS OFF",
            "control.button.request_places": "\ud83d\udccd ASK PLACES",
            "control.button.request_actions": "\ud83c\udfc3 ASK ACTIONS",
            "control.button.request_final_phrase": "\ud83d\udcac ASK FINAL LINE",
            "control.button.end.blue": "\ud83d\udd35 END",
            "control.button.end.red": "\ud83d\udd34 END",
            "control.title.tutorial": "\ud83d\udcd6 TUTORIAL",
            "control.title.game": "\ud83c\udfae GAME",
            "control.title.representation": "\ud83c\udfad STAGE",
            "control.title.representation_short": "\ud83c\udfad STAGE",
            "control.subtitle.muses": "TRIGGERS FOR MUSES",
            "control.label.final_phrase": "FINAL LINE:",
            "control.placeholder.final_phrase": "Type the final line...",
            "control.stats.slides": "\ud83d\udcca STATS SLIDES",
            "control.stats.prev_aria": "Previous slide",
            "control.stats.next_aria": "Next slide",
            "control.spectator_scale.label": "\ud83d\udc41\ufe0f SPECTATOR SIZE",
            "control.spectator_scale.value": "{percent}%",
            "control.spectator_scale.decrease_aria": "Make spectator smaller",
            "control.spectator_scale.increase_aria": "Make spectator larger",
            "control.spectator_scale.reset_aria": "Reset spectator size ({percent}%)",
            "control.warmup.current_trigger": "CURRENT TRIGGER: {label}",
            "control.warmup.flow.open": "OPEN",
            "control.warmup.flow.blocked": "LOCKED",
            "control.warmup.flow.final": "FINAL {word}",
            "control.warmup.flow.summary": "J1: {j1} | J2: {j2}",
            "control.mode.none": "None",
            "control.time.seconds_count": "{count} seconds",
            "control.teleprompter.controls": "\ud83c\udf99\ufe0f CONTROLS",
            "control.teleprompter.play": "\u25b6\ufe0f PLAY",
            "control.teleprompter.pause": "\u23f8\ufe0f PAUSE",
            "control.teleprompter.status.empty": "No teleprompter text loaded",
            "control.credits.title": "SHOW CREDITS",
            "control.credits.help": "Editing these fields updates the spectator credits roll.",
            "control.credits.field.escritxr_rojo": "RED WRITER",
            "control.credits.field.escritxr_azul": "BLUE WRITER",
            "control.credits.field.interprete_azul_1": "BLUE PERFORMER 1",
            "control.credits.field.interprete_azul_2": "BLUE PERFORMER 2",
            "control.credits.field.interprete_rojo_1": "RED PERFORMER 1",
            "control.credits.field.interprete_rojo_2": "RED PERFORMER 2",
            "control.credits.field.programacion": "PROGRAMMING",
            "control.credits.field.dramaturgia": "DRAMATURGY",
            "control.credits.field.iluminacion": "LIGHTING",
            "control.credits.field.musica": "MUSIC",
            "control.credits.field.voz_off": "VOICE OVER",
            "control.credits.field.agradecimientos": "THANKS",
            "control.credits.placeholder.escritxr_rojo": "Red writer name",
            "control.credits.placeholder.escritxr_azul": "Blue writer name",
            "control.credits.placeholder.interprete_azul_1": "Blue performer 1 name",
            "control.credits.placeholder.interprete_azul_2": "Blue performer 2 name",
            "control.credits.placeholder.interprete_rojo_1": "Red performer 1 name",
            "control.credits.placeholder.interprete_rojo_2": "Red performer 2 name",
            "control.credits.placeholder.programacion": "Programming",
            "control.credits.placeholder.dramaturgia": "Dramaturgy",
            "control.credits.placeholder.iluminacion": "Lighting",
            "control.credits.placeholder.musica": "Music",
            "control.credits.placeholder.voz_off": "Voice over",
            "control.credits.placeholder.agradecimientos": "Show thanks",
            "control.credits.production": "A PRODUCTION BY SUTURA TEATRO",
            "control.connection.title": "CONNECTION",
            "control.connection.server": "SERVER",
            "control.connection.players": "PLAYERS",
            "control.param.advantage": "ADVANTAGE",
            "control.param.advantage_vote": "ADVANTAGE VOTE",
            "control.param.level": "LEVEL",
            "control.param.start": "START",
            "control.param.letter_change": "LETTER CHANGE",
            "control.param.word_change": "WORD CHANGE",
            "control.param.muse_limit": "MUSE WORD LIMIT",
            "control.param.spectator_scale": "SPECTATOR SIZE",
            "control.unit.seconds": "seconds",
            "control.unit.minutes_short": "mins.",
            "control.unit.seconds_short": "secs.",
            "control.unit.words": "words",
            "control.connection.connected": "CONNECTED",
            "control.connection.disconnected": "DISCONNECTED",
            "control.heatmap_title": "Heat map {name}",
            "pdf.match_report_title": "MATCH REPORT",
            "pdf.life.no_data": "No life data recorded.",
            "pdf.key_named": "Key {key}",
            "pdf.key_unknown": "Unknown key",
            "pdf.unit.keystrokes_per_minute": "{count} keys/min",
            "pdf.section.quick_summary": "Quick summary",
            "pdf.section.heatmap": "Heat map",
            "pdf.section.highlighted_letters": "Highlighted letters",
            "pdf.section.highlighted_words": "Highlighted words",
            "pdf.section.life_evolution": "Life evolution",
            "pdf.summary.total_duration": "Total duration",
            "pdf.summary.total_keystrokes": "Total keystrokes",
            "pdf.summary.distinct_keys": "Distinct keys",
            "pdf.summary.estimated_pace": "Estimated pace",
            "pdf.summary.life_min": "Minimum life",
            "pdf.summary.life_max": "Maximum life",
            "pdf.summary.life_avg": "Average life",
            "pdf.summary.top_keys": "Top keys",
            "pdf.kind.blessed": "BLESSED",
            "pdf.kind.cursed": "CURSED",
            "pdf.letters": "Letters",
            "pdf.words": "Words",
            "pdf.insertions_count": "{count} insertions",
            "pdf.muse_gift_title": "MUSE GIFT",
            "pdf.muse_fallback": "MUSE",
            "pdf.writer_fallback": "WRITER",
            "pdf.muse_team_writer_line": "Team {team} - {writer}",
            "pdf.muse_stat.sent": "Sent",
            "pdf.muse_stat.entered": "Entered",
            "pdf.muse_stat.effectiveness": "Effectiveness",
            "pdf.muse_stat.superbonus": "Superbonus",
            "pdf.muse_stat.impact": "Impact",
            "pdf.muse_words_sent_title": "SENT WORDS",
            "pdf.muse_words_empty": "No words recorded for this muse.",
            "pdf.muse_mode_bonus": "BONUS",
            "pdf.muse_mode_cursed_word": "CURSED",
            "pdf.muse_mode_blessed_letter": "BLESSED LETTER",
            "pdf.muse_mode_cursed_letter": "CURSED LETTER",
            "pdf.muse_mode_generic": "MUSE",
            "pdf.muse_status_entered_by_rival": "[ENTERED BY RIVAL]",
            "pdf.muse_status_entered": "[ENTERED]",
            "pdf.muse_status_pending": "[QUEUED/UNUSED]",
            "pdf.superbonus": "SUPERBONUS",
            "pdf.metadata.muse_title": "SCRIB muse gift {name}",
            "pdf.metadata.muse_subject": "Muse words: {words}",
            "pdf.metadata.muse_keywords": "scrib,muse,{clientId},personalized",
            "actor.time_limit": "PERFORMER, IT'S TIME TO ACT!",
            "game.finished": "TEXT FINISHED!",
            "game.no_words_lost": "YOU LOST, YOU WROTE NOTHING!"
        },
        fr: {
            "lang.es": "Espagnol",
            "lang.en": "Anglais",
            "lang.fr": "Fran\u00e7ais",
            "options.language_label": "LANGUE",
            "options.language_aria": "Langue",
            "score.words_label": "Mots",
            "score.words_count": "{count} mots",
            "score.muses_label": "Muses",
            "score.muses_count": "{count} muses",
            "mode.name.letra_bendita": "LETTRE BENIE",
            "mode.name.letra_prohibida": "LETTRE INTERDITE",
            "mode.name.palabras_bonus": "MOTS BONUS",
            "mode.name.palabras_prohibidas": "MOTS INTERDITS",
            "mode.name.tertulia": "DIALOGUE MUSES",
            "mode.name.frase_final": "PHRASE FINALE",
            "mode.title.letra_bendita": "NIVEAU LETTRE BENIE",
            "mode.title.letra_prohibida": "NIVEAU LETTRE INTERDITE",
            "mode.title.palabras_bonus": "NIVEAU MOTS BONUS",
            "mode.title.palabras_prohibidas": "NIVEAU MOTS INTERDITS",
            "mode.title.tertulia": "NIVEAU DIALOGUE MUSES",
            "mode.title.frase_final": "NIVEAU PHRASE FINALE",
            "mode.strip.letra_bendita": "LETTRE|BENIE",
            "mode.strip.letra_prohibida": "LETTRE|MAUDITE",
            "mode.strip.palabras_bonus": "MOT|BENI",
            "mode.strip.palabras_prohibidas": "MOT|MAUDIT",
            "mode.strip.tertulia": "TERTULIA",
            "mode.strip.frase_final": "PHRASE|FINALE",
            "mode.desc.bonus": "GAGNE DU TEMPS AVEC DES MOTS BONUS",
            "mode.desc.prohibidas": "EVITE LES MOTS INTERDITS",
            "mode.desc.tertulia": "DIALOGUE AVEC TES MUSES",
            "mode.desc.frase_final": "DERNIER TOUR",
            "mode.rule.bendita": "CHAQUE MOT DOIT CONTENIR LA LETTRE {letter}.",
            "mode.rule.prohibida": "AUCUN MOT NE PEUT UTILISER LA LETTRE {letter}.",
            "mode.goal.final_phrase": "\u2b06\ufe0f Ecris la phrase finale pour gagner. \u2b06\ufe0f",
            "mode.goal.last_one": "C'est la derniere !",
            "countdown.ready": "PRETS ?",
            "countdown.write": "ECRIS !",
            "timer.time_up": "Temps ecoule !",
            "res.game_over": "GAME OVER",
            "res.title_prefix": "VEUX-TU",
            "res.title_highlight": "RESSUSCITER",
            "res.title_suffix": "EN ECHANGE DE MOTS ?",
            "res.btn_yes": "Oui",
            "res.btn_no": "Non",
            "res.keys_hint": "Utilise les fleches et Entree",
            "res.quantity_title": "Choisis le nombre de mots",
            "res.btn_confirm": "Confirmer",
            "res.btn_back": "Retour",
            "res.quantity.words_label": "Mots",
            "res.quantity.seconds_label": "Secondes",
            "res.quantity.max": "MAX {max}",
            "ui.writer_1": "ECRITURE 1",
            "ui.writer_2": "ECRITURE 2",
            "ui.writer_blue": "ECRIVAINE BLEUE",
            "ui.writer_red": "ECRIVAINE ROUGE",
            "ui.writer_generic": "ECRIVAIN",
            "ui.muse_label": "Muse",
            "ui.text_complete": "\ud83d\udc40 TEXTE COMPLET",
            "ui.hide_text": "MASQUER LE TEXTE",
            "ui.back": "\u2b05\ufe0f RETOUR",
            "ui.flag": "\ud83c\udff3\ufe0f\u200d\ud83c\udf08 DRAPEAU",
            "ui.wave_flag": "MUSE, AGITE TON DRAPEAU !",
            "ui.inspiration_title": "INSPIRATION",
            "ui.cloud_title": "NUAGE D'INSPIRATION",
            "ui.stats_live_title": "STATS DE LA PARTIE",
            "ui.voting_live": "VOTE EN COURS",
            "ui.votes": "VOTES",
            "ui.choose_disadvantage": "CHOISIS UN DESAVANTAGE",
            "ui.choose_disadvantage_for": "CHOISIS UN DESAVANTAGE POUR {name}",
            "ui.thanks_for_voting": "MERCI POUR TON VOTE",
            "ui.gift_offer": "{name} veut t'offrir quelque chose.",
            "ui.gift_subtext": "Appuie pour le telecharger.",
            "ui.download_gift_aria": "Telecharger le cadeau",
            "writer.total_label": "POINTS UTILISES :",
            "writer.total_divider": "sur",
            "writer.total_cta": "A ECRIRE !",
            "writer.btn_start": "A ECRIRE !",
            "warmup.title": "TUTORIEL",
            "warmup.request.none": "AUCUN DECLENCHEUR ACTIF",
            "warmup.request.none_short": "AUCUN",
            "warmup.request.lugares": "LIEUX",
            "warmup.request.acciones": "ACTIONS",
            "warmup.request.frase_final": "PHRASE FINALE",
            "warmup.request.writer": "DECLENCHEUR : {label}",
            "warmup.request.spectator": "DECLENCHEUR ACTUEL : {label}",
            "warmup.state.inactive": "Tutoriel inactif.",
            "warmup.state.hidden": "Tutoriel cache.",
            "warmup.state.waiting_view": "En attente de la vue tutoriel.",
            "warmup.state.select_words": "Selectionne des mots de ton equipe puis appuie sur FERMER LE DECLENCHEUR.",
            "warmup.state.closed_choose_final": "Declencheur ferme. Choisis un mot final parmi les mots selectionnes.",
            "warmup.state.final_fixed": "Mot final fixe : {word}.",
            "warmup.state.both_final": "Les deux ecrivaines ont choisi leur mot final. En attente d'une nouvelle consigne.",
            "warmup.state.one_final_missing": "Il manque encore un mot final pour completer cette consigne.",
            "warmup.state.table_closed_choose_final": "Declencheur ferme sur une table. Il reste un mot final a choisir.",
            "warmup.state.receiving_words": "Reception des mots des muses.",
            "warmup.button.select_words": "SELECTIONNE DES MOTS",
            "warmup.button.closed": "DECLENCHEUR FERME",
            "warmup.button.close_count": "FERMER LE DECLENCHEUR ({count})",
            "warmup.final_word": "MOT FINAL : {word}",
            "warmup.word_chosen": "MOT CHOISI",
            "warmup.final.pending": "EN ATTENTE",
            "warmup.final.choosing": "CHOIX...",
            "warmup.feedback.generic_error": "Impossible de terminer l'action.",
            "warmup.feedback.no_trigger": "Aucun declencheur actif.",
            "warmup.feedback.closed_by_writer": "La consigne est fermee par ton ecrivain.",
            "warmup.feedback.write_word": "Ecris un mot.",
            "warmup.feedback.write_phrase": "Ecris une phrase.",
            "warmup.feedback.one_word_only": "Un seul mot est autorise, sans espaces.",
            "warmup.feedback.max_chars": "Maximum {max} caracteres.",
            "warmup.feedback.word_sent": "Mot envoye.",
            "warmup.feedback.phrase_sent": "Phrase envoyee.",
            "warmup.feedback.no_spaces": "Les espaces ne sont pas autorises dans l'inspiration.",
            "warmup.feedback.useful_word": "N'oublie pas : le mot doit lui etre utile.",
            "warmup.feedback.word_highlighted": "{name} a mis ton mot en valeur !",
            "warmup.feedback.destiny": "Ton destin sera accompli, Muse.",
            "warmup.preview.if_sent": "Si tu l'envoies :",
            "warmup.preview.if_sent_add": "Ajoute si tu l'envoies :",
            "warmup.preview.if_sent_subtract": "Retire si tu l'envoies :",
            "warmup.preview.seconds_short": "s",
            "warmup.inspire": "INSPIRER <span class=\"btn-emoji\" aria-hidden=\"true\">\ud83d\ude80</span>",
            "warmup.inspiring": "Inspiration...",
            "warmup.muse.state.none": "Aucun declencheur actif. Utilise le drapeau jusqu'a ce que le controle ouvre une consigne.",
            "warmup.muse.state.lugares_html": "Inspire des <span class=\"calentamiento-consigna-lugares\">lieux</span> ou des endroits ou l'histoire peut naitre.",
            "warmup.muse.state.acciones_html": "Inspire des <span class=\"calentamiento-consigna-acciones\">actions (verbes)</span> qui font avancer l'histoire.",
            "warmup.muse.state.frase_final_html": "Inspire la <span class=\"calentamiento-consigna-frase-final\">phrase finale</span>.",
            "warmup.muse.placeholder.word": "Ecris un mot",
            "warmup.muse.placeholder.place": "Exemple : plage",
            "warmup.muse.placeholder.action": "Exemple : courir",
            "warmup.muse.placeholder.final": "Exemple : vers la destination finale",
            "stats.current_level": "Niveau actuel",
            "stats.timestamp.none": "Sans donnees",
            "stats.state.waiting": "En attente des statistiques des ecrivaines...",
            "stats.time.waiting": "En attente des donnees de temps en direct...",
            "stats.axis.y_time_left": "Vie",
            "stats.axis.x_elapsed": "Temps ecoule",
            "credits.thanks_title": "REMERCIEMENTS :",
            "credits.thanks_pending": "Remerciements en attente.",
            "credits.muses_title": "MUSES",
            "credits.muses_blue": "MUSES BLEUES",
            "credits.muses_red": "MUSES ROUGES",
            "credits.muses_empty": "Aucune muse enregistree",
            "credits.closure": "Une production de SUTURA TEATRO.",
            "vote.chart_help": "Touche une part du graphique pour voter.",
            "vote.remaining_aria": "Temps restant pour le vote",
            "vote.thanks_detail": "Merci pour ton vote {vote}.",
            "world.eyebrow": "DEMARRAGE DU SYSTEME MUSE",
            "world.title": "ENTREE DANS UN NOUVEAU MONDE",
            "world.copy_fallback": "Preparation du lien creatif.",
            "world.copy": "{muse} a choisi d'aider {writer}. Preparation de l'entree dans le monde du jeu.",
            "world.status.linking": "\ud83d\udd17 LIAISON DU CANAL D'INSPIRATION",
            "world.status.sync": "\u2699\ufe0f SYNCHRO SYSTEME STABLE",
            "world.status.compiling": "\ud83e\udde9 COMPILATION DU NOUVEAU MONDE",
            "world.status.color": "\ud83c\udfa8 CHARGEMENT DE LA COULEUR ET DE L'ATMOSPHERE",
            "world.status.authorized": "\u2705 ACCES AUTORISE",
            "world.status.loaded": "\ud83c\udfc1 MONDE CHARGE",
            "world.log.link_muse": "\ud83d\udd17 LIAISON AVEC {muse}",
            "world.log.sync_pen": "\ud83d\udd8b\ufe0f SYNCHRO PLUME {team}",
            "world.log.load_imagery": "\ud83d\udcd6 CHARGEMENT DE L'IMAGINAIRE DE {writer}",
            "world.log.paint_world": "\ud83c\udfa8 PEINDRE LA COULEUR DU MONDE",
            "world.log.portal": "\ud83c\udf00 OUVERTURE DU PORTAIL D'INSPIRATION",
            "world.team.blue": "BLEU",
            "world.team.red": "ROUGE",
            "control.button.pause": "\u23f8\ufe0f PAUSE",
            "control.button.resume": "\u25b6\ufe0f REPRENDRE",
            "control.button.tutorial_view": "\ud83d\udcd6 VUE TUTORIEL",
            "control.button.game_view": "\ud83c\udfae VUE PARTIE",
            "control.button.parameters": "\u2699\ufe0f PARAM\u00c8TRES",
            "control.button.controls": "\ud83c\udfae COMMANDES",
            "control.button.credits": "\ud83c\udfac CR\u00c9DITS",
            "control.button.delete_saved": "EFFACER TEXTE",
            "control.button.delete_saved.off": "EFFACER TEXTE",
            "control.button.delete_saved.on": "EFFACER TEXTE",
            "control.button.skip_tertulia": "\u23ed\ufe0f PASSER TERTULIA",
            "control.button.clear": "\ud83e\uddf9 EFFACER",
            "control.button.reset_score": "\u21bb R\u00c9INITIALISER LE SCORE",
            "control.button.write": "\u270e \u00c9CRIRE",
            "control.button.stats": "\ud83d\udcca STATS",
            "control.button.cloud": "\u2601\ufe0f NUAGE D'INSPIRATION",
            "control.button.download_texts": "\u2b07\ufe0f T\u00c9L\u00c9CHARGER LES TEXTES",
            "control.button.ask_feedback": "\ud83d\udde8\ufe0f DEMANDER UN FEEDBACK",
            "control.button.giant_timer": "\u23f1\ufe0f GRAND CHRONO",
            "control.button.show_credits": "\u2b50 AFFICHER LES CR\u00c9DITS",
            "control.button.teleprompter": "\ud83c\udf99\ufe0f T\u00c9L\u00c9PROMPTEUR",
            "control.button.load": "\ud83d\udcbe CHARGER",
            "control.button.flags.on": "\ud83d\udea9 DRAPEAUX ACTIV\u00c9S",
            "control.button.flags.off": "\ud83d\udea9 DRAPEAUX D\u00c9SACTIV\u00c9S",
            "control.button.request_places": "\ud83d\udccd DEMANDER DES LIEUX",
            "control.button.request_actions": "\ud83c\udfc3 DEMANDER DES ACTIONS",
            "control.button.request_final_phrase": "\ud83d\udcac DEMANDER LA PHRASE FINALE",
            "control.button.end.blue": "\ud83d\udd35 FIN",
            "control.button.end.red": "\ud83d\udd34 FIN",
            "control.title.tutorial": "\ud83d\udcd6 TUTORIEL",
            "control.title.game": "\ud83c\udfae JEU",
            "control.title.representation": "\ud83c\udfad REPR\u00c9SENTATION",
            "control.title.representation_short": "\ud83c\udfad REPR.",
            "control.subtitle.muses": "D\u00c9CLENCHEURS POUR LES MUSES",
            "control.label.final_phrase": "PHRASE FINALE :",
            "control.placeholder.final_phrase": "\u00c9cris la phrase finale...",
            "control.stats.slides": "\ud83d\udcca DIAPOS STATS",
            "control.stats.prev_aria": "Diapositive pr\u00e9c\u00e9dente",
            "control.stats.next_aria": "Diapositive suivante",
            "control.spectator_scale.label": "\ud83d\udc41\ufe0f TAILLE SPECTATEUR",
            "control.spectator_scale.value": "{percent}%",
            "control.spectator_scale.decrease_aria": "R\u00e9duire la taille du spectateur",
            "control.spectator_scale.increase_aria": "Agrandir le spectateur",
            "control.spectator_scale.reset_aria": "R\u00e9initialiser la taille du spectateur ({percent}%)",
            "control.warmup.current_trigger": "D\u00c9CLENCHEUR ACTUEL : {label}",
            "control.warmup.flow.open": "OUVERT",
            "control.warmup.flow.blocked": "BLOQU\u00c9",
            "control.warmup.flow.final": "FINAL {word}",
            "control.warmup.flow.summary": "J1 : {j1} | J2 : {j2}",
            "control.mode.none": "Aucun",
            "control.time.seconds_count": "{count} secondes",
            "control.teleprompter.controls": "\ud83c\udf99\ufe0f COMMANDES",
            "control.teleprompter.play": "\u25b6\ufe0f PLAY",
            "control.teleprompter.pause": "\u23f8\ufe0f PAUSE",
            "control.teleprompter.status.empty": "Aucun texte charg\u00e9 dans le t\u00e9l\u00e9prompteur",
            "control.credits.title": "CR\u00c9DITS DU SPECTACLE",
            "control.credits.help": "Modifier ces champs met \u00e0 jour le d\u00e9filement des cr\u00e9dits du spectateur.",
            "control.credits.field.escritxr_rojo": "AUTEUR ROUGE",
            "control.credits.field.escritxr_azul": "AUTEUR BLEU",
            "control.credits.field.interprete_azul_1": "INTERPR\u00c8TE BLEU 1",
            "control.credits.field.interprete_azul_2": "INTERPR\u00c8TE BLEU 2",
            "control.credits.field.interprete_rojo_1": "INTERPR\u00c8TE ROUGE 1",
            "control.credits.field.interprete_rojo_2": "INTERPR\u00c8TE ROUGE 2",
            "control.credits.field.programacion": "PROGRAMMATION",
            "control.credits.field.dramaturgia": "DRAMATURGIE",
            "control.credits.field.iluminacion": "\u00c9CLAIRAGE",
            "control.credits.field.musica": "MUSIQUE",
            "control.credits.field.voz_off": "VOIX OFF",
            "control.credits.field.agradecimientos": "REMERCIEMENTS",
            "control.credits.placeholder.escritxr_rojo": "Nom auteur rouge",
            "control.credits.placeholder.escritxr_azul": "Nom auteur bleu",
            "control.credits.placeholder.interprete_azul_1": "Nom interpr\u00e8te bleu 1",
            "control.credits.placeholder.interprete_azul_2": "Nom interpr\u00e8te bleu 2",
            "control.credits.placeholder.interprete_rojo_1": "Nom interpr\u00e8te rouge 1",
            "control.credits.placeholder.interprete_rojo_2": "Nom interpr\u00e8te rouge 2",
            "control.credits.placeholder.programacion": "Programmation",
            "control.credits.placeholder.dramaturgia": "Dramaturgie",
            "control.credits.placeholder.iluminacion": "\u00c9clairage",
            "control.credits.placeholder.musica": "Musique",
            "control.credits.placeholder.voz_off": "Voix off",
            "control.credits.placeholder.agradecimientos": "Remerciements du spectacle",
            "control.credits.production": "UNE PRODUCTION DE SUTURA TEATRO",
            "control.connection.title": "CONNEXION",
            "control.connection.server": "SERVEUR",
            "control.connection.players": "JOUEURS",
            "control.param.advantage": "AVANTAGE",
            "control.param.advantage_vote": "VOTE AVANTAGE",
            "control.param.level": "NIVEAU",
            "control.param.start": "D\u00c9PART",
            "control.param.letter_change": "CHANGEMENT LETTRE",
            "control.param.word_change": "CHANGEMENT MOT",
            "control.param.muse_limit": "LIMITE MOTS MUSES",
            "control.param.spectator_scale": "TAILLE SPECTATEUR",
            "control.unit.seconds": "secondes",
            "control.unit.minutes_short": "min.",
            "control.unit.seconds_short": "sec.",
            "control.unit.words": "mots",
            "control.connection.connected": "CONNECTE",
            "control.connection.disconnected": "DECONNECTE",
            "control.heatmap_title": "Carte thermique {name}",
            "pdf.match_report_title": "RAPPORT DE PARTIE",
            "pdf.life.no_data": "Aucune donnee de vie enregistree.",
            "pdf.key_named": "Touche {key}",
            "pdf.key_unknown": "Touche inconnue",
            "pdf.unit.keystrokes_per_minute": "{count} frappes/min",
            "pdf.section.quick_summary": "Resume rapide",
            "pdf.section.heatmap": "Carte thermique",
            "pdf.section.highlighted_letters": "Lettres marquees",
            "pdf.section.highlighted_words": "Mots marques",
            "pdf.section.life_evolution": "Evolution de vie",
            "pdf.summary.total_duration": "Duree totale",
            "pdf.summary.total_keystrokes": "Frappes totales",
            "pdf.summary.distinct_keys": "Touches distinctes",
            "pdf.summary.estimated_pace": "Rythme estime",
            "pdf.summary.life_min": "Vie minimale",
            "pdf.summary.life_max": "Vie maximale",
            "pdf.summary.life_avg": "Vie moyenne",
            "pdf.summary.top_keys": "Top touches",
            "pdf.kind.blessed": "BENIE",
            "pdf.kind.cursed": "MAUDITE",
            "pdf.letters": "Lettres",
            "pdf.words": "Mots",
            "pdf.insertions_count": "{count} insertions",
            "pdf.muse_gift_title": "CADEAU DE MUSE",
            "pdf.muse_fallback": "MUSE",
            "pdf.writer_fallback": "ECRIVAIN",
            "pdf.muse_team_writer_line": "Equipe {team} - {writer}",
            "pdf.muse_stat.sent": "Envoyes",
            "pdf.muse_stat.entered": "Saisies",
            "pdf.muse_stat.effectiveness": "Efficacite",
            "pdf.muse_stat.superbonus": "Superbonus",
            "pdf.muse_stat.impact": "Impact",
            "pdf.muse_words_sent_title": "MOTS ENVOYES",
            "pdf.muse_words_empty": "Aucun mot enregistre pour cette muse.",
            "pdf.muse_mode_bonus": "BONUS",
            "pdf.muse_mode_cursed_word": "MAUDITE",
            "pdf.muse_mode_blessed_letter": "LETTRE BENIE",
            "pdf.muse_mode_cursed_letter": "LETTRE MAUDITE",
            "pdf.muse_mode_generic": "MUSE",
            "pdf.muse_status_entered_by_rival": "[SAISIE PAR RIVAL]",
            "pdf.muse_status_entered": "[SAISIE]",
            "pdf.muse_status_pending": "[EN FILE/NON UTILISEE]",
            "pdf.superbonus": "SUPERBONUS",
            "pdf.metadata.muse_title": "SCRIB cadeau de muse {name}",
            "pdf.metadata.muse_subject": "Mots muse: {words}",
            "pdf.metadata.muse_keywords": "scrib,muse,{clientId},personnalise",
            "actor.time_limit": "INTERPRETE, C'EST LE MOMENT D'AGIR !",
            "game.finished": "TEXTE TERMINE !",
            "game.no_words_lost": "TU AS PERDU, TU N'AS RIEN ECRIT !"
        }
    };

    const MODE_KEY_SUFFIX = {
        "letra bendita": "letra_bendita",
        "letra prohibida": "letra_prohibida",
        "palabras bonus": "palabras_bonus",
        "palabras prohibidas": "palabras_prohibidas",
        "tertulia": "tertulia",
        "frase final": "frase_final"
    };

    let idiomaActual = I18N_DEFAULT_LANG_2P;

    const resolverIdioma = (idioma) => (
        Object.prototype.hasOwnProperty.call(I18N_TEXTS_2P, idioma) ? idioma : I18N_DEFAULT_LANG_2P
    );

    const interpolar = (texto, variables = {}) => String(texto).replace(/\{(\w+)\}/g, (_, clave) => (
        Object.prototype.hasOwnProperty.call(variables, clave) ? variables[clave] : ""
    ));

    const CP1252_BYTE_BY_CHAR = {
        "\u20ac": 0x80,
        "\u201a": 0x82,
        "\u0192": 0x83,
        "\u201e": 0x84,
        "\u2026": 0x85,
        "\u2020": 0x86,
        "\u2021": 0x87,
        "\u02c6": 0x88,
        "\u2030": 0x89,
        "\u0160": 0x8a,
        "\u2039": 0x8b,
        "\u0152": 0x8c,
        "\u017d": 0x8e,
        "\u2018": 0x91,
        "\u2019": 0x92,
        "\u201c": 0x93,
        "\u201d": 0x94,
        "\u2022": 0x95,
        "\u2013": 0x96,
        "\u2014": 0x97,
        "\u02dc": 0x98,
        "\u2122": 0x99,
        "\u0161": 0x9a,
        "\u203a": 0x9b,
        "\u0153": 0x9c,
        "\u017e": 0x9e,
        "\u0178": 0x9f
    };

    const decodificarMojibakeUtf8 = (valor) => {
        const bytes = [];
        for (const char of String(valor || "")) {
            const code = char.charCodeAt(0);
            if (code <= 0xff) {
                bytes.push(code);
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(CP1252_BYTE_BY_CHAR, char)) {
                bytes.push(CP1252_BYTE_BY_CHAR[char]);
                continue;
            }
            return "";
        }
        if (!bytes.length) return "";
        try {
            return decodeURIComponent(bytes.map((byte) => `%${byte.toString(16).padStart(2, "0")}`).join(""));
        } catch (_error) {
            return "";
        }
    };

    const generarCandidatosLetraModo = (valor) => {
        const candidatos = [String(valor || "")];
        let actual = candidatos[0];
        for (let i = 0; i < 3; i += 1) {
            const reparado = decodificarMojibakeUtf8(actual);
            if (!reparado || reparado === actual || candidatos.includes(reparado)) break;
            candidatos.push(reparado);
            actual = reparado;
        }
        return candidatos;
    };

    const normalizarLetraModo = (valor) => {
        const texto = String(valor ?? "").trim();
        if (!texto) return "";
        const compacto = texto.replace(/\s+/g, "");
        const candidatos = generarCandidatosLetraModo(compacto);
        for (const candidato of candidatos) {
            if (/^[\u00f1\u00d1]$/u.test(candidato)) {
                return "\u00f1";
            }
        }
        if (/[\u00b1\u2018\u2019\u0091]/u.test(compacto) && /[\u00c3\u00e3\u00c2\u0192]/u.test(compacto)) {
            return "\u00f1";
        }
        for (const candidato of candidatos) {
            const letraCandidata = Array.from(candidato).find((char) => /[A-Za-z\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1]/u.test(char));
            if (letraCandidata) {
                return letraCandidata.toLowerCase() === "\u00f1" ? "\u00f1" : letraCandidata;
            }
        }
        const lower = compacto.toLowerCase();
        const mojibakeEnye = new Set([
            "ã±",
            "ãƒâ±",
            "ãƒÂ±".toLowerCase(),
            "ãƒâ€˜".toLowerCase(),
            "ã‘",
            "�ƒâ±",
            "ï¿½ƒâ±"
        ]);
        if (mojibakeEnye.has(lower) || (/[�ÃÂƒâ]/.test(compacto) && compacto.includes("±"))) {
            return "\u00f1";
        }
        const letras = Array.from(compacto);
        const letra = letras.find((char) => /[A-Za-z\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1]/u.test(char));
        return letra || letras[0] || "";
    };

    const tJuego2P = (clave, variables = {}, fallback = "") => {
        const idioma = I18N_TEXTS_2P[idiomaActual] || I18N_TEXTS_2P[I18N_DEFAULT_LANG_2P];
        const base = I18N_TEXTS_2P[I18N_DEFAULT_LANG_2P];
        const texto = Object.prototype.hasOwnProperty.call(idioma, clave)
            ? idioma[clave]
            : (Object.prototype.hasOwnProperty.call(base, clave) ? base[clave] : fallback);
        return interpolar(texto, variables);
    };

    const obtenerSufijoModo = (modo) => MODE_KEY_SUFFIX[String(modo || "").trim().toLowerCase()] || "";

    const traducirNombreModo = (modo) => {
        const sufijo = obtenerSufijoModo(modo);
        return sufijo ? tJuego2P(`mode.name.${sufijo}`, {}, String(modo || "").toUpperCase()) : String(modo || "").toUpperCase();
    };

    const traducirTituloModo = (modo) => {
        const sufijo = obtenerSufijoModo(modo);
        return sufijo ? tJuego2P(`mode.title.${sufijo}`, {}, String(modo || "").toUpperCase()) : String(modo || "").toUpperCase();
    };

    const traducirStripModo = (modo) => {
        const sufijo = obtenerSufijoModo(modo);
        const bruto = sufijo ? tJuego2P(`mode.strip.${sufijo}`, {}, traducirNombreModo(modo)) : traducirNombreModo(modo);
        return String(bruto).split("|").filter(Boolean);
    };

    const traducirDescripcionModo = (modo) => {
        const sufijo = obtenerSufijoModo(modo);
        if (!sufijo) return "";
        if (sufijo === "palabras_bonus") return tJuego2P("mode.desc.bonus");
        if (sufijo === "palabras_prohibidas") return tJuego2P("mode.desc.prohibidas");
        if (sufijo === "tertulia") return tJuego2P("mode.desc.tertulia");
        if (sufijo === "frase_final") return tJuego2P("mode.desc.frase_final");
        return "";
    };

    const construirReglaModo = (tipo, letra) => {
        const visible = `<span class="explicacion-letra-destacada">${normalizarLetraModo(letra).toUpperCase() || "-"}</span>`;
        if (tipo === "bendita") return tJuego2P("mode.rule.bendita", { letter: visible });
        if (tipo === "prohibida") return tJuego2P("mode.rule.prohibida", { letter: visible });
        return "";
    };

    const formatearPalabras = (valor) => {
        const texto = String(valor ?? "").trim();
        if (!texto) return tJuego2P("score.words_count", { count: 0 }, "0 palabras");
        if (/^-?\d+(?:\.\d+)?$/.test(texto)) return tJuego2P("score.words_count", { count: texto }, `${texto} palabras`);
        return texto;
    };

    const formatearMusas = (valor) => {
        const texto = String(valor ?? "").trim();
        if (!texto) return tJuego2P("score.muses_count", { count: 0 }, "0 musas");
        if (/^-?\d+(?:\.\d+)?$/.test(texto)) return tJuego2P("score.muses_count", { count: texto }, `${texto} musas`);
        return texto;
    };

    const traducirSolicitudCalentamiento = (tipo, opciones = {}) => {
        const clave = String(tipo || "").trim().toLowerCase();
        if (opciones && opciones.corta && clave === "ninguna") return tJuego2P("warmup.request.none_short");
        if (clave === "lugares") return tJuego2P("warmup.request.lugares");
        if (clave === "acciones") return tJuego2P("warmup.request.acciones");
        if (clave === "frase_final") return tJuego2P("warmup.request.frase_final");
        return tJuego2P("warmup.request.none");
    };

    const traducirNombreEscritora = (id, fallback = "") => {
        if (Number(id) === 1) return tJuego2P("ui.writer_1", {}, fallback || "ESCRITXR 1");
        if (Number(id) === 2) return tJuego2P("ui.writer_2", {}, fallback || "ESCRITXR 2");
        return tJuego2P("ui.writer_generic", {}, fallback || "ESCRITXR");
    };

    const refrescarCountdown = (countdownEl) => {
        if (!countdownEl) return;
        const actual = String(countdownEl.textContent || "").trim();
        const readyTexts = new Set(Object.values(I18N_TEXTS_2P).map((tabla) => tabla["countdown.ready"]));
        const writeTexts = new Set(Object.values(I18N_TEXTS_2P).map((tabla) => tabla["countdown.write"]));
        if (readyTexts.has(actual)) {
            countdownEl.textContent = tJuego2P("countdown.ready", {}, actual);
        } else if (writeTexts.has(actual)) {
            countdownEl.textContent = tJuego2P("countdown.write", {}, actual);
        }
    };

    const construirTituloResucitar = () => (
        `${tJuego2P("res.title_prefix")} <span class="resucitar-highlight">${tJuego2P("res.title_highlight")}</span> ${tJuego2P("res.title_suffix")}`
    );

    const construirDisplayCantidadResucitar = ({ palabras = 0, segundos = 0, max = 0 } = {}) => `
      <div class="resucitar-stepper" aria-hidden="true">
        <div class="resucitar-stepper-arrow">&uarr;</div>
        <div class="resucitar-stepper-arrow">&darr;</div>
      </div>
      <div class="resucitar-metric">
        <span class="resucitar-label">${tJuego2P("res.quantity.words_label")}</span>
        <span class="resucitar-value resucitar-pop palabras">${palabras}</span>
        <span class="resucitar-max">${tJuego2P("res.quantity.max", { max })}</span>
      </div>
      <div class="resucitar-arrow">&rarr;</div>
      <div class="resucitar-metric">
        <span class="resucitar-label">${tJuego2P("res.quantity.seconds_label")}</span>
        <span class="resucitar-value resucitar-pop segundos">${segundos}</span>
      </div>
    `;

    const aplicarIdiomaDOM = () => {
        if (document.documentElement) {
            document.documentElement.setAttribute("lang", idiomaActual);
        }
        document.querySelectorAll("[data-i18n]").forEach((nodo) => {
            const clave = nodo.getAttribute("data-i18n");
            if (clave) nodo.textContent = tJuego2P(clave);
        });
        document.querySelectorAll("[data-i18n-html]").forEach((nodo) => {
            const clave = nodo.getAttribute("data-i18n-html");
            if (clave) nodo.innerHTML = tJuego2P(clave);
        });
        document.querySelectorAll("[data-i18n-attr]").forEach((nodo) => {
            const descriptor = nodo.getAttribute("data-i18n-attr");
            if (!descriptor) return;
            descriptor.split(";").map((item) => item.trim()).filter(Boolean).forEach((entrada) => {
                const [attr, clave] = entrada.split(":").map((part) => part.trim());
                if (attr && clave) nodo.setAttribute(attr, tJuego2P(clave));
            });
        });

        document.querySelectorAll("select[id^='selector_idioma']").forEach((selector) => {
            selector.setAttribute("aria-label", tJuego2P("options.language_aria"));
            Array.from(selector.options || []).forEach((option) => {
                option.textContent = tJuego2P(`lang.${option.value}`, {}, option.textContent || option.value);
            });
            selector.value = idiomaActual;
        });
    };

    const emitirCambioIdioma = () => {
        aplicarIdiomaDOM();
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: { idioma: idiomaActual } }));
        languageListeners.forEach((listener) => {
            try {
                listener(idiomaActual);
            } catch (error) {
                console.warn("[i18n] Error al refrescar idioma.", error);
            }
        });
    };

    const setIdiomaJuego2P = (nuevoIdioma) => {
        idiomaActual = resolverIdioma(nuevoIdioma);
        emitirCambioIdioma();
        return idiomaActual;
    };

    window.scribT2P = tJuego2P;
    window.scribSetLanguage2P = setIdiomaJuego2P;
    window.scribGetLanguage2P = () => idiomaActual;
    window.scribTranslateModeName2P = traducirNombreModo;
    window.scribTranslateModeTitle2P = traducirTituloModo;
    window.scribTranslateModeStrip2P = traducirStripModo;
    window.scribTranslateModeDescription2P = traducirDescripcionModo;
    window.scribBuildModeRule2P = construirReglaModo;
    window.scribNormalizeModeLetter2P = normalizarLetraModo;
    window.scribFormatWordsCount2P = formatearPalabras;
    window.scribFormatMusesCount2P = formatearMusas;
    window.scribTranslateWarmupRequest2P = traducirSolicitudCalentamiento;
    window.scribTranslateWriterName2P = traducirNombreEscritora;
    window.scribRefreshCountdownText2P = refrescarCountdown;
    window.scribBuildResurrectionQuestionHtml2P = construirTituloResucitar;
    window.scribBuildResurrectionQuantityHtml2P = construirDisplayCantidadResucitar;
    window.scribOnLanguageChange2P = (listener) => {
        if (typeof listener !== "function") return () => {};
        languageListeners.add(listener);
        return () => languageListeners.delete(listener);
    };
    window.scribApplyLanguageDom2P = aplicarIdiomaDOM;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            setIdiomaJuego2P(idiomaActual);
        }, { once: true });
    } else {
        setIdiomaJuego2P(idiomaActual);
    }
})();
