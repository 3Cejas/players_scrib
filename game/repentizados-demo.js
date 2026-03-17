(() => {
    const SAMPLE_TEXTS = {
        teatral: `LUCIA: Me voy antes de que vuelva.\nMADRE: No vas a abrir esa puerta.\n(Se oye al vecino en el pasillo.)\nJULIAN entra con la camisa mojada.\nJULIAN: Si sales, lo cuento todo.\nLUCIA baja la mirada y oculta la carta.`,
        narrativa: `Lucia no quiere quedarse. La madre finge que ordena la cocina, pero en realidad espera que Julian no escuche. Lucia mira la puerta. Julian dice que nadie se va esta noche. La vecina llama dos veces y despues se arrepiente.`,
        mixta: `El padre busca las llaves. Marta se llama asi solo cuando el se enfada; para su hermano sigue siendo Martita. La hija quiere volver a la estacion. El guardia no responde. Martita teme que la madre descubra el billete escondido.`
    };

    const STOPWORDS_CAPITALIZED = new Set([
        "El", "La", "Los", "Las", "Un", "Una", "Yo", "Tu", "Pero", "Porque", "Cuando",
        "Si", "No", "Me", "Te", "Lo", "Le", "Es", "Fue", "Era", "Al", "Del", "En", "Se"
    ]);

    const NAME_STOPWORDS = new Set([
        "que", "todo", "nada", "pero", "porque", "cuando", "si", "no", "una", "uno", "unas", "unos",
        "las", "los", "ella", "ellos", "vosotras", "vosotros", "mirad", "anda", "bueno", "hoy", "nadie", "se",
        "suena", "habla", "vale", "antes", "elige"
    ]);

    const OPEN_ROLE_PHRASE_REGEX = /\b(?:la|el|los|las|un|una|mi|tu|su)\s+[a-záéíóúüñ][a-záéíóúüñ'-]*(?:(?:\s+(?:de|del|al))\s+[a-záéíóúüñ][a-záéíóúüñ'-]*)?(?:\s+[a-záéíóúüñ][a-záéíóúüñ'-]*)?/gi;
    const PLACEHOLDER_ENTITY_REGEX = /(^|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ])([A-Z])(?=$|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g;

    const ROLE_FAMILY_ALIASES = {
        madre: "madre",
        madres: "madre",
        padre: "padre",
        padres: "padre",
        hija: "hija",
        hijas: "hija",
        hijo: "hijo",
        hijos: "hijo",
        hermana: "hermana",
        hermanas: "hermana",
        hermano: "hermano",
        hermanos: "hermano",
        vecina: "vecina",
        vecinas: "vecina",
        vecino: "vecino",
        vecinos: "vecino",
        guardia: "guardia",
        guardias: "guardia",
        monitora: "monitor",
        monitoras: "monitor",
        monitor: "monitor",
        monitores: "monitor",
        nina: "ninez",
        ninas: "ninez",
        nino: "ninez",
        ninos: "ninez",
        anciana: "mayores",
        ancianas: "mayores",
        anciano: "mayores",
        ancianos: "mayores",
        vieja: "mayores",
        viejas: "mayores",
        viejo: "mayores",
        viejos: "mayores",
        abuela: "abuelas",
        abuelas: "abuelas",
        abuelo: "abuelos",
        abuelos: "abuelos",
        senora: "senora",
        senoras: "senora",
        senor: "senor",
        senores: "senor",
        jefa: "jefatura",
        jefas: "jefatura",
        jefe: "jefatura",
        jefes: "jefatura",
        doctora: "medicina",
        doctoras: "medicina",
        doctor: "medicina",
        doctores: "medicina",
        profesora: "docencia",
        profesoras: "docencia",
        profesor: "docencia",
        profesores: "docencia"
    };

    const VERB_GROUPS = {
        desire_intimacy: ["follamos", "follar", "quiere follar", "besar", "besa", "besan", "se acerca", "se acercan", "se miran"],
        desire_exit: ["me voy", "quiere irse", "irse", "marcharse", "huir", "escapar", "se va", "nos escapamos", "escapamos"],
        desire_return: ["volver", "quiere volver", "regresar", "vuelva", "regrese"],
        secrecy: ["oculta", "ocultar", "esconde", "esconder", "calla", "callar", "miente", "mentir", "no dice", "insulina", "medicina", "veneno", "envenen"],
        revelation: ["confiesa", "revela", "lo cuento todo", "admite", "descubre"],
        conflict_block: ["impide", "obliga", "prohibe", "amenaza", "no vas a", "nadie se va", "no puede", "preocupados", "calla ya", "teneis que volver"],
        fear: ["teme", "miedo", "asusta", "terror", "tiembla"],
        entrance: ["entra", "sale", "aparece", "llama", "vuelve", "se oye"]
    };

    const HUMAN_ACTION_HINTS = [
        "aparec", "entr", "sal", "volv", "vuelv", "dic", "dij", "pregunt", "respond",
        "grit", "mir", "corr", "cant", "busc", "esper", "tem", "ocult", "escond",
        "call", "ment", "amenaz", "oblig", "impid", "vomit", "llor", "agarr",
        "cog", "pon", "quit", "llev", "dej", "parec", "sospech", "descubr",
        "confes", "revel", "ahog", "mord", "cantad", "abraz", "tiembl", "quer"
    ];

    const SIGNAL_PRIORITY = [
        "desire_intimacy",
        "desire_exit",
        "secrecy",
        "conflict_block",
        "fear",
        "revelation",
        "desire_return",
        "entrance"
    ];

    const SPEAKER_LINE_REGEX = /^([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]{0,32})\s*[-:]\s*(.*)$/;
    const LOCAL_MODEL_RUNTIME = createLocalModelRuntime();

    const refs = {
        input: document.getElementById("input_text"),
        analyze: document.getElementById("analyze_button"),
        analyzeModel: document.getElementById("analyze_model_button"),
        clear: document.getElementById("clear_button"),
        finalRepentizado: document.getElementById("final_repentizado"),
        finalReason: document.getElementById("final_reason"),
        finalScoreFill: document.getElementById("final_score_fill"),
        finalScoreLabel: document.getElementById("final_score_label"),
        finalInsertable: document.getElementById("final_insertable"),
        finalValidation: document.getElementById("final_validation"),
        slotCards: document.getElementById("slot_cards"),
        sceneSummary: document.getElementById("scene_summary"),
        modelRuntimeCards: document.getElementById("model_runtime_cards"),
        candidateList: document.getElementById("candidate_list"),
        normalizedText: document.getElementById("normalized_text"),
        structureSummary: document.getElementById("structure_summary"),
        structureLines: document.getElementById("structure_lines"),
        localBody: document.getElementById("local_candidates_body"),
        entitiesBody: document.getElementById("entities_body"),
        signalsBody: document.getElementById("signals_body"),
        memoryOutput: document.getElementById("memory_output"),
        modelInput: document.getElementById("model_input"),
        modelOutput: document.getElementById("model_output"),
        debugJson: document.getElementById("debug_json")
    };

    document.querySelectorAll("[data-sample]").forEach((button) => {
        button.addEventListener("click", () => {
            refs.input.value = SAMPLE_TEXTS[button.dataset.sample] || "";
        });
    });

    refs.clear.addEventListener("click", () => {
        refs.input.value = "";
        renderEmpty("Esperando datos.");
        renderModelRuntimeCard();
    });

    refs.analyze.addEventListener("click", () => {
        runHeuristicAnalysis();
    });

    refs.analyzeModel.addEventListener("click", () => {
        runLocalModelAnalysis();
    });

    window.runRepentizadosDemoPipeline = runPipeline;
    window.runRepentizadosLocalModels = runLocalModelAnalysis;

    refs.input.value = SAMPLE_TEXTS.teatral;
    render(runPipeline(refs.input.value));
    renderModelRuntimeCard();

    async function runHeuristicAnalysis() {
        setBusyState("heuristics", true);
        try {
            const result = runPipeline(refs.input.value);
            render(result);
        } finally {
            setBusyState("heuristics", false);
        }
    }

    async function runLocalModelAnalysis() {
        const source = refs.input.value;
        setBusyState("models", true);

        try {
            const base = runPipeline(source);
            if (base.empty) {
                render(base);
                return;
            }

            const payload = buildLocalModelPayload(base);
            const localModelAnalysis = await requestLocalModelAnalysis(payload);
            const result = runPipeline(source, { localModelAnalysis });
            render(result);
        } catch (error) {
            LOCAL_MODEL_RUNTIME.lastError = String(error && error.message ? error.message : error);
            LOCAL_MODEL_RUNTIME.status = "error";
            LOCAL_MODEL_RUNTIME.detail = "Fallo al ejecutar los modelos locales.";
            render(runPipeline(source));
            renderModelRuntimeCard();
            refs.modelInput.textContent = pretty({ mode: "local_models", status: "error", error: LOCAL_MODEL_RUNTIME.lastError });
            refs.modelOutput.textContent = pretty({ note: "La demo ha vuelto al pipeline heuristico por error en la capa local." });
        } finally {
            setBusyState("models", false);
        }
    }

    function runPipeline(source, options = {}) {
        const original = normalizeWhitespace(source);
        if (!original) return { empty: true, message: "No hay texto para analizar." };

        const structure = detectStructure(original);
        const localCandidates = detectLocalCandidates(original, structure);
        const entities = resolveEntities(localCandidates, original, options.localModelAnalysis);
        const signals = detectSignals(original, structure, entities, options.localModelAnalysis);
        const memory = buildMemory(original, structure, entities, signals);
        const model = reconcileWithModel(original, localCandidates, entities, signals, memory, options.localModelAnalysis);
        const repentizados = buildRepentizados(model);

        return {
            original,
            structure,
            localCandidates,
            entities,
            signals,
            memory,
            mode: options.localModelAnalysis ? "local_models" : "heuristics",
            localModelAnalysis: options.localModelAnalysis || null,
            model,
            repentizados,
            final: repentizados[0] || null
        };
    }

    function detectStructure(original) {
        const rawLines = original.split(/\n+/);
        const lines = [];
        const speakers = new Map();
        let cursor = 0;

        rawLines.forEach((raw, idx) => {
            const line = raw.trim();
            if (!line) {
                cursor += raw.length + 1;
                return;
            }
            const speakerMatch = line.match(SPEAKER_LINE_REGEX);
            const isStage = /^\(.*\)$/.test(line) || /^\[.*\]$/.test(line) || /^(entra|sale|se oye|se escucha)\b/i.test(line);
            let kind = "narrative";
            let speaker = "";
            let content = line;

            if (speakerMatch) {
                kind = "speaker";
                speaker = speakerMatch[1].replace(/\s+/g, " ").trim();
                content = (speakerMatch[2] || "").trim();
                speakers.set(speaker, (speakers.get(speaker) || 0) + 1);
            } else if (isStage) {
                kind = "stage";
            }

            lines.push({ index: idx + 1, raw: line, kind, speaker, content, charStart: cursor });
            cursor += raw.length + 1;
        });

        return {
            lines,
            speakers: Array.from(speakers.entries()).map(([name, count]) => ({ name, count })),
            counts: {
                lines: lines.length,
                speaker: lines.filter((l) => l.kind === "speaker").length,
                stage: lines.filter((l) => l.kind === "stage").length,
                narrative: lines.filter((l) => l.kind === "narrative").length
            }
        };
    }

    function detectLocalCandidates(original, structure) {
        const map = new Map();

        structure.speakers.forEach((speaker) => {
            registerCandidate(map, speaker.name, "speaker", 8 + speaker.count, "Nombre de parlamento / cabecera dramatica", findIndexSafe(original, speaker.name));
        });

        collectMatches(original, /\b(?:se llama|llamado|llamada)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2})\b/g, (match) => {
            registerCandidate(map, match[1], "name", 7, "Patron de identidad explicita", match.index);
        });

        collectMatches(original, OPEN_ROLE_PHRASE_REGEX, (match) => {
            const phrase = normalizeWhitespace(match[0]);
            const analysis = analyzeOpenRolePhrase(original, match.index, phrase);
            if (!analysis) return;
            registerCandidate(map, phrase, "role", analysis.score, analysis.reason, match.index);
        });

        collectMatches(original, /\b(?:Don|Dona|Senor|Senora)?\s*[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}(?:\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}){0,2}\b/g, (match) => {
            const surface = normalizeWhitespace(match[0]);
            const normalizedSurface = normalizeForCompare(surface);
            if (!surface || STOPWORDS_CAPITALIZED.has(surface) || NAME_STOPWORDS.has(normalizedSurface)) return;
            if (/^[A-ZÁÉÍÓÚÜÑ\s0-9]+$/.test(surface) && !/\s/.test(surface)) return;
            if (hasLowercaseCounterpart(original, surface) || looksLikeActionWord(normalizedSurface)) return;
            registerCandidate(map, surface, "name", 2, "Nombre propio candidato", match.index);
        });

        collectMatches(original, /\b((?:[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{1,}|[A-ZÁÉÍÓÚÜÑ]{2,})(?:\s+(?:[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{1,}|[A-ZÁÉÍÓÚÜÑ]{2,})){0,2})\s+([a-záéíóúüñ][a-záéíóúüñ'-]*)\b/g, (match) => {
            const surface = normalizeWhitespace(match[1]);
            const verb = match[2];
            const normalizedSurface = normalizeForCompare(surface);
            if (!surface || normalizedSurface.length < 2 || STOPWORDS_CAPITALIZED.has(surface) || NAME_STOPWORDS.has(normalizedSurface)) return;
            if (!surface || !isHumanActionVerbToken(verb)) return;
            registerCandidate(map, surface, "name", 3.4, "Nombre ligado a verbo de accion", match.index);
        });

        detectPlaceholderCandidates(original, map);

        return Array.from(map.values())
            .map((candidate) => ({
                ...candidate,
                primarySurface: chooseLongest(Array.from(candidate.surfaces)),
                mentions: candidate.evidences.length,
                score: round2(candidate.score)
            }))
            .filter((candidate) => candidate.score >= 2.8 || candidate.kind === "speaker")
            .sort((a, b) => b.score - a.score || b.mentions - a.mentions);
    }

    function resolveEntities(localCandidates, original, localModelAnalysis = null) {
        const map = new Map();
        const textLength = Math.max(1, original.length);

        localCandidates.forEach((candidate) => {
            const key = entityKey(candidate.primarySurface, candidate.kind);
            const current = map.get(key) || {
                id: `entity_${map.size + 1}`,
                aliases: new Set(),
                aliasWeights: new Map(),
                kindVotes: {},
                score: 0,
                mentions: 0,
                lastIndex: 0,
                primarySurface: ""
            };

            current.aliases.add(candidate.primarySurface);
            current.aliasWeights.set(candidate.primarySurface, (current.aliasWeights.get(candidate.primarySurface) || 0) + candidate.score);
            current.score += candidate.score;
            current.mentions += candidate.mentions;
            current.lastIndex = Math.max(current.lastIndex, candidate.lastIndex || 0);
            current.kindVotes[candidate.kind] = (current.kindVotes[candidate.kind] || 0) + candidate.score;
            current.primarySurface = choosePrimaryAlias(current.primarySurface, candidate.primarySurface);
            map.set(key, current);
        });

        let entities = Array.from(map.values()).map((entity) => {
            const kind = Object.entries(entity.kindVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
            const recency = entity.lastIndex / textLength;
            const aliases = Array.from(entity.aliases).sort((a, b) => b.length - a.length);
            const roleInfo = summarizeRoleInfo(aliases, kind);
            const confidence = Math.min(0.99, 0.18 + (kind === "speaker" ? 0.18 : kind === "role" ? 0.1 : 0.06) + Math.min(0.38, entity.score / 20) + Math.min(0.14, entity.mentions / 12) + Math.min(0.14, recency * 0.3));
            const activity = entity.score + (entity.mentions * 0.7) + (recency * 4.2);
            return {
                id: entity.id,
                surface: chooseDisplaySurface(entity.aliasWeights, roleInfo, entity.primarySurface) || "ALGUIEN",
                kind,
                aliases,
                roleFamily: roleInfo ? roleInfo.family : "",
                roleNumber: roleInfo ? roleInfo.numericSuffix : null,
                isCollectiveLabel: Boolean(roleInfo && roleInfo.hasCollectiveAlias),
                clusterKey: buildEntityClusterKey({
                    surface: entity.primarySurface,
                    kind,
                    roleFamily: roleInfo ? roleInfo.family : "",
                    roleNumber: roleInfo ? roleInfo.numericSuffix : null
                }),
                confidence: round2(confidence),
                activity: round2(activity)
            };
        }).filter((entity) => entity.confidence >= 0.3);

        entities = enrichEntitiesWithLocalModels(entities, localCandidates, localModelAnalysis, original);

        const clusterMap = new Map();
        entities.forEach((entity) => {
            if (!clusterMap.has(entity.clusterKey)) clusterMap.set(entity.clusterKey, []);
            clusterMap.get(entity.clusterKey).push(entity);
        });

        clusterMap.forEach((clusterEntities) => {
            const hasCollective = clusterEntities.some((entity) => entity.isCollectiveLabel);
            if (!hasCollective) return;
            clusterEntities.forEach((entity) => {
                if (!entity.isCollectiveLabel && entity.roleFamily && !entity.roleNumber) {
                    entity.shadowedByCollective = true;
                    entity.activity = round2(entity.activity * 0.72);
                    entity.confidence = round2(entity.confidence * 0.9);
                }
            });
        });

        return entities.sort((a, b) => b.activity - a.activity || b.confidence - a.confidence);
    }

    function detectSignals(original, structure, entities, localModelAnalysis = null) {
        const units = buildUnits(structure);
        const signals = [];
        const textLength = Math.max(1, original.length);

        units.forEach((unit) => {
            const norm = normalizeForCompare(unit.text);
            if (!norm) return;
            const mentioned = dedupeEntitiesByCluster(
                entities.filter((entity) => entity.aliases.some((alias) => containsAlias(norm, normalizeForCompare(alias))))
            );
            if (!mentioned.length) return;

            Object.entries(VERB_GROUPS).forEach(([kind, verbs]) => {
                if (!verbs.some((verb) => norm.includes(normalizeForCompare(verb)))) return;
                const chars = (kind === "conflict_block" || kind === "fear" || kind === "secrecy" || kind === "revelation" || kind === "desire_intimacy")
                    ? mentioned.slice(0, 2)
                    : mentioned.slice(0, 1);
                const unitCenter = unit.charStart + (unit.text.length / 2);
                const recency = round2(Math.max(0, Math.min(1, unitCenter / textLength)));
                const tailWeight = round2(recencyWeight(recency));
                signals.push({
                    kind,
                    label: signalLabel(kind),
                    characters: chars.map((c) => c.surface),
                    characterIds: chars.map((c) => c.id),
                    intensity: round2((5.2 + (unit.kind === "speaker" ? 0.9 : 0) + (chars.length > 1 ? 0.6 : 0) + (kind === "desire_exit" || kind === "secrecy" || kind === "conflict_block" ? 1.2 : 0)) * tailWeight),
                    fragment: unit.text,
                    recency,
                    tailWeight,
                    lineIndex: unit.lineIndex
                });
            });
        });

        const collapsed = collapseSignals(signals);
        const rescored = rescoreSignalsWithLocalModels(collapsed, localModelAnalysis);
        return rescored.sort((a, b) => b.intensity - a.intensity);
    }

    function buildMemory(original, structure, entities, signals) {
        const activity = new Map(entities.map((e) => [e.id, e.activity]));
        const tailSignals = pickTailSignals(signals);
        signals.forEach((signal) => {
            const pressure = signal.intensity * (signal.tailWeight >= 1.28 ? 1.12 : 0.8);
            signal.characterIds.forEach((id) => activity.set(id, (activity.get(id) || 0) + pressure));
        });

        const activeEntities = entities.map((entity) => ({ ...entity, activityFinal: round2(activity.get(entity.id) || entity.activity) }))
            .sort((a, b) => rankSlotEntity(b) - rankSlotEntity(a));
        const tailActiveEntityIds = new Set(tailSignals.flatMap((signal) => signal.characterIds || []));
        const tailActiveEntities = activeEntities.filter((entity) => tailActiveEntityIds.has(entity.id));

        const dominantSignal = chooseDominantSignal(tailSignals.length ? tailSignals : signals);
        const openLoops = Array.from(signals.reduce((acc, signal) => {
            const current = acc.get(signal.kind) || { count: 0, recent: 0, intensity: 0 };
            current.count += 1;
            current.intensity += signal.intensity;
            current.recent += signal.tailWeight >= 1.18 ? 1 : 0;
            acc.set(signal.kind, current);
            return acc;
        }, new Map()).entries()).map(([kind, stats]) => ({ kind, label: signalLabel(kind), count: stats.count, recent: stats.recent, intensity: round2(stats.intensity) }))
            .sort((a, b) => b.recent - a.recent || b.intensity - a.intensity || b.count - a.count);

        const tailExcerpt = excerptTail(original, 280);

        return {
            excerpt: excerptTail(original, 420),
            tailExcerpt,
            activeEntities: activeEntities.slice(0, 5),
            tailActiveEntities: tailActiveEntities.slice(0, 5),
            dominantSignal,
            tailSignals: tailSignals.slice(0, 5),
            openLoops,
            speakerVoices: structure.speakers.map((speaker) => speaker.name),
            risk: dominantSignal && ["conflict_block", "secrecy"].includes(dominantSignal.kind) ? "alto" : dominantSignal ? "medio" : "bajo"
        };
    }

    function enrichEntitiesWithLocalModels(entities, localCandidates, localModelAnalysis, original) {
        if (!localModelAnalysis || !localModelAnalysis.output || !localModelAnalysis.output.summary) {
            return entities.map((entity) => defaultSemanticEntity(entity));
        }

        const typeEntries = Array.isArray(localModelAnalysis.output.summary.entity_types)
            ? localModelAnalysis.output.summary.entity_types
            : [];
        const nerEntries = Array.isArray(localModelAnalysis.output.summary.ner_entities)
            ? localModelAnalysis.output.summary.ner_entities
            : [];
        const typeMap = buildSemanticTypeMap(typeEntries);
        const enriched = entities.map((entity) => {
            const match = findSemanticMatch(entity, typeMap);
            const next = { ...entity };

            if (match) {
                next.semanticType = match.predicted;
                next.semanticConfidence = round2(match.confidence);
                next.semanticScores = match.scores;
                next.modelSource = "local_models";

                if (match.predicted === "character") {
                    next.confidence = round2(Math.min(0.99, next.confidence + (match.confidence * 0.16)));
                    next.activity = round2(next.activity + (match.confidence * 2.6));
                } else if (!["speaker", "role", "placeholder"].includes(next.kind)) {
                    const penalty = match.predicted === "object" || match.predicted === "space" ? 0.22 : 0.14;
                    next.confidence = round2(Math.max(0.18, next.confidence - (match.confidence * penalty)));
                    next.activity = round2(Math.max(0.8, next.activity - (match.confidence * 2.1)));
                }
            } else {
                Object.assign(next, defaultSemanticEntity(next));
            }

            return next;
        });

        const existingAliases = new Set(enriched.flatMap((entity) => entity.aliases.map((alias) => normalizeForCompare(alias))));
        nerEntries.forEach((entry, index) => {
            const normalizedSurface = normalizeForCompare(entry.surface);
            if (!normalizedSurface || existingAliases.has(normalizedSurface)) return;
            if (normalizedSurface.length < 2 || NAME_STOPWORDS.has(normalizedSurface)) return;
            if ((entry.label || "").toUpperCase() !== "PER") return;

            enriched.push({
                id: `entity_model_${index + 1}`,
                surface: entry.surface,
                kind: "model_name",
                aliases: [entry.surface],
                roleFamily: "",
                roleNumber: null,
                isCollectiveLabel: false,
                clusterKey: buildEntityClusterKey({ surface: entry.surface, kind: "name" }),
                confidence: round2(Math.min(0.94, 0.38 + (entry.confidence || 0))),
                activity: round2(4.2 + ((entry.mentions || 1) * 1.15) + ((entry.recency || 0) * 2.4)),
                semanticType: "character",
                semanticConfidence: round2(Math.min(0.99, entry.confidence || 0.65)),
                semanticScores: { character: round2(entry.confidence || 0.65) },
                modelSource: "local_models"
            });
        });

        return enriched
            .filter((entity) => entity.confidence >= 0.26)
            .sort((a, b) => {
                const aCharacter = a.semanticType === "character" ? 1 : 0;
                const bCharacter = b.semanticType === "character" ? 1 : 0;
                if (aCharacter !== bCharacter) return bCharacter - aCharacter;
                return b.activity - a.activity || b.confidence - a.confidence;
            });
    }

    function rescoreSignalsWithLocalModels(signals, localModelAnalysis) {
        if (!localModelAnalysis || !localModelAnalysis.output || !localModelAnalysis.output.summary) return signals;

        const dynamics = Array.isArray(localModelAnalysis.output.summary.dynamics)
            ? localModelAnalysis.output.summary.dynamics
            : [];
        const topDynamic = dynamics[0] || null;
        const typeMap = buildSemanticTypeMap(localModelAnalysis.output.summary.entity_types || []);

        return signals.map((signal) => {
            let intensity = signal.intensity;
            const modelNotes = [];

            if (topDynamic && topDynamic.kind === signal.kind) {
                intensity += Math.min(1.8, (topDynamic.score || 0) * 2.2);
                modelNotes.push(`dinamica=${topDynamic.kind}`);
            }

            const characterHits = (signal.characters || []).filter((surface) => {
                const match = typeMap.get(normalizeForCompare(surface));
                return match && match.predicted === "character" && match.confidence >= 0.52;
            }).length;
            const nonCharacterHits = (signal.characters || []).filter((surface) => {
                const match = typeMap.get(normalizeForCompare(surface));
                return match && match.predicted !== "character" && match.confidence >= 0.58;
            }).length;

            if (characterHits) {
                intensity += characterHits * 0.42;
                modelNotes.push(`personajes=${characterHits}`);
            }
            if (nonCharacterHits && nonCharacterHits === (signal.characters || []).length) {
                intensity -= Math.min(1.4, nonCharacterHits * 0.44);
                modelNotes.push(`no_personajes=${nonCharacterHits}`);
            }

            return {
                ...signal,
                intensity: round2(Math.max(1.2, intensity)),
                modelNotes
            };
        });
    }

    function reconcileWithModel(original, localCandidates, entities, signals, memory, localModelAnalysis = null) {
        const slotPool = memory.tailActiveEntities && memory.tailActiveEntities.length ? memory.tailActiveEntities : memory.activeEntities;
        const slots = selectDistinctSlots(slotPool);
        const dominantCharacters = memory.dominantSignal ? memory.dominantSignal.characters || [] : [];
        const slotP1 = resolveSignalDrivenSlot(slotPool, dominantCharacters[0]) || slots.P1;
        const fallbackP2 = (slotPool || []).find((entity) =>
            slotP1 &&
            entity.id !== slotP1.id &&
            entity.confidence >= 0.35 &&
            isLikelyCharacterEntity(entity) &&
            areEntitiesCompatible(slotP1, entity)
        ) || slots.P2;
        const slotP2 = dominantCharacters.length > 1
            ? (resolveSignalDrivenSlot(slotPool, dominantCharacters[1], slotP1) || fallbackP2)
            : null;

        return {
            input: {
                excerpt: excerptTail(original, 900),
                tail_excerpt: memory.tailExcerpt,
                local_candidates: localCandidates.slice(0, 8).map((c) => ({
                    surface: c.primarySurface,
                    kind: c.kind,
                    score: c.score,
                    evidences: c.evidences.slice(0, 4)
                })),
                resolved_entities: entities.slice(0, 6),
                scene_signals: signals.slice(0, 8),
                tail_signals: memory.tailSignals ? memory.tailSignals.slice(0, 5) : [],
                local_models: localModelAnalysis ? localModelAnalysis.output.summary : null
            },
            response: {
                slots: {
                    P1: slotP1 ? buildSlot(slotP1) : fallbackSlot("ALGUIEN"),
                    P2: slotP2 ? buildSlot(slotP2) : fallbackSlot("OTRA PERSONA")
                },
                dominant_signal: memory.dominantSignal ? memory.dominantSignal.kind : "fallback",
                dominant_signal_characters: dominantCharacters,
                dramatic_pressure: memory.dominantSignal ? memory.dominantSignal.label : "Sin foco claro: mejor plantilla neutra de accion",
                tail_fragment: memory.dominantSignal ? memory.dominantSignal.fragment : memory.tailExcerpt,
                confidence: round2(Math.min(0.97, (slotP1 ? slotP1.confidence : 0.18) + (memory.dominantSignal ? memory.dominantSignal.intensity / 20 : 0.08))),
                notes: [
                    slotP1 ? `P1 se fija en ${slotP1.surface} por actividad reciente.` : "No hay P1 estable.",
                    slotP2 ? `P2 se fija en ${slotP2.surface} para sostener relacion en la cola del texto.` : "No hay P2 fiable.",
                    memory.openLoops.length ? `Bucles abiertos: ${memory.openLoops.slice(0, 3).map((loop) => loop.label).join(", ")}.` : "No hay bucles fuertes.",
                    memory.dominantSignal ? `Ultimo empuje leido: "${memory.dominantSignal.fragment}".` : "Sin ultimo empuje claro.",
                    localModelAnalysis ? `Modelos locales: ${localModelAnalysis.output.summary.entity_types.length} clasificaciones y ${localModelAnalysis.output.summary.ner_entities.length} entidades NER.` : "Sin capa local."
                ]
            }
        };
    }

    function buildRepentizados(model) {
        const p1 = model.response.slots.P1.surface;
        const p2 = model.response.slots.P2.surface;
        const hasP2 = p2 && p2 !== "OTRA PERSONA";
        const relationalP2 = hasP2 && Array.isArray(model.response.dominant_signal_characters) && model.response.dominant_signal_characters.length > 1;
        const signal = model.response.dominant_signal;
        const out = [];

        const tailFragment = normalizeWhitespace(model.response.tail_fragment || "");
        const recentHint = tailFragment ? ` Ultima evidencia: "${tailFragment}".` : "";
        const push = (text, score, reason, rules) => {
            const clean = normalizeWhitespace(text);
            if (!clean || out.some((item) => normalizeForCompare(item.text) === normalizeForCompare(clean))) return;
            out.push({ text: clean, insertable: `${clean}.`, score: round2(score), reason: `${reason}${recentHint}`, validator: rules });
        };

        if (signal === "desire_intimacy") {
            push(relationalP2 ? `${p1} ${verbFor(p1, "quiere", "quieren")} follar con ${p2}` : `${p1} ${verbFor(p1, "quiere", "quieren")} acercarse`, 0.97, "La escena gira alrededor del deseo corporal o del acercamiento.", validator(relationalP2 ? [p1, p2] : [p1], ["follar", "besar", "acercarse", "mirar"]));
            push(relationalP2 ? `${p1} ${verbFor(p1, "besa", "besan")} a ${p2}` : `${p1} ${verbFor(p1, "besa", "besan")}`, 0.88, "Version mas fisica y directa del mismo impulso.", validator(relationalP2 ? [p1, p2] : [p1], ["besar", "acercarse"]));
            push(relationalP2 ? `${p2} no ${verbFor(p2, "quiere", "quieren")}` : `${p1} duda`, 0.8, "Sirve para introducir resistencia o desajuste de deseo.", validator(relationalP2 ? [p2] : [p1], ["no", "querer", "alejarse"]));
        } else if (signal === "desire_exit") {
            push(`${p1} ${verbFor(p1, "quiere", "quieren")} irse`, 0.96, "La escena empuja a salida o huida.", validator([p1], ["irse", "marchar", "salir", "huir"]));
            push(relationalP2 ? `${p2} ${verbFor(p2, "impide", "impiden")} que ${p1} se ${verbFor(p1, "vaya", "vayan")}` : `${p1} ${verbFor(p1, "intenta", "intentan")} irse sin decirlo`, 0.9, "Conviene convertir el deseo en obstaculo.", validator(relationalP2 ? [p1, p2] : [p1], ["impedir", "irse", "salir"]));
            push(`${p1} ${verbFor(p1, "cambia", "cambian")} de idea en la puerta`, 0.77, "Buen giro de duda sin abrir otra trama.", validator([p1], ["cambiar", "dudar", "quedarse"]));
        } else if (signal === "secrecy") {
            push(relationalP2 ? `${p1} ${verbFor(p1, "oculta", "ocultan")} algo a ${p2}` : `${p1} ${verbFor(p1, "oculta", "ocultan")} algo`, 0.95, "La escena ya contiene informacion retenida.", validator(relationalP2 ? [p1, p2] : [p1], ["ocultar", "callar", "mentir", "esconder"]));
            push(`${p1} ${verbFor(p1, "calla", "callan")} lo importante`, 0.83, "Version compacta que mueve el texto rapido.", validator([p1], ["callar", "no decir", "mentir"]));
            push(relationalP2 ? `${p2} ${verbFor(p2, "sospecha", "sospechan")} de ${p1}` : `${p1} ${verbFor(p1, "teme", "temen")} que lo descubran`, 0.76, "Empuja desde la sospecha.", validator(relationalP2 ? [p1, p2] : [p1], ["sospechar", "descubrir", "notar"]));
        } else if (signal === "conflict_block") {
            push(relationalP2 ? `${p2} ${verbFor(p2, "obliga", "obligan")} a ${p1} a quedarse` : `${p1} no ${verbFor(p1, "puede", "pueden")} irse`, 0.94, "Hay freno directo: mejor formularlo como bloqueo.", validator(relationalP2 ? [p1, p2] : [p1], ["obligar", "quedarse", "impedir"]));
            push(relationalP2 ? `${p2} ${verbFor(p2, "amenaza", "amenazan")} con contarlo todo` : `${p1} ${verbFor(p1, "recibe", "reciben")} una amenaza`, 0.88, "Mantiene la presion sin abrir demasiado.", validator(relationalP2 ? [p2] : [p1], ["amenazar", "contar", "revelar"]));
            push(`${p1} ${verbFor(p1, "cede", "ceden")} por ahora`, 0.72, "Cierre provisional util si quieres acumulacion.", validator([p1], ["ceder", "aceptar", "bajar"]));
        } else if (signal === "fear") {
            push(relationalP2 ? `${p1} ${verbFor(p1, "teme", "temen")} a ${p2}` : `${p1} ${verbFor(p1, "actua", "actuan")} desde el miedo`, 0.9, "La presion emocional ya esta explicitada.", validator(relationalP2 ? [p1, p2] : [p1], ["temer", "miedo", "asustar"]));
            push(`${p1} ${verbFor(p1, "oculta", "ocultan")} el miedo`, 0.79, "Combina vulnerabilidad y mascara.", validator([p1], ["ocultar", "disimular", "miedo"]));
            push(relationalP2 ? `${p2} ${verbFor(p2, "detecta", "detectan")} la fragilidad de ${p1}` : `${p1} se ${verbFor(p1, "quiebra", "quiebran")} un instante`, 0.73, "Sirve para abrir grieta.", validator(relationalP2 ? [p1, p2] : [p1], ["ver", "notar", "quebrar"]));
        } else if (signal === "revelation") {
            push(`${p1} ${verbFor(p1, "confiesa", "confiesan")} por fin`, 0.87, "Hay energia de revelacion lista para caer.", validator([p1], ["confesar", "admitir", "revelar"]));
            push(relationalP2 ? `${p1} ${verbFor(p1, "le revela", "revelan")} la verdad a ${p2}` : `${p1} ${verbFor(p1, "suelta", "sueltan")} lo que callaba`, 0.82, "Pasa de tension retenida a descarga.", validator(relationalP2 ? [p1, p2] : [p1], ["revelar", "decir", "confesar"]));
            push(`${p1} ${verbFor(p1, "rompe", "rompen")} el pacto de silencio`, 0.74, "Buen giro de ruptura.", validator([p1], ["romper", "silencio", "contar"]));
        } else if (signal === "desire_return") {
            push(`${p1} ${verbFor(p1, "quiere", "quieren")} volver`, 0.89, "La escena apunta a retorno mas que a huida.", validator([p1], ["volver", "regresar", "retornar"]));
            push(relationalP2 ? `${p2} ${verbFor(p2, "duda", "dudan")} si dejar volver a ${p1}` : `${p1} ${verbFor(p1, "vuelve", "vuelven")} por algo pendiente`, 0.8, "Transforma deseo en accion concreta.", validator(relationalP2 ? [p1, p2] : [p1], ["volver", "dejar", "pendiente"]));
            push(`${p1} ${verbFor(p1, "necesita", "necesitan")} regresar antes de que sea tarde`, 0.74, "Introduce urgencia temporal clara.", validator([p1], ["regresar", "volver", "antes"]));
        } else {
            push(`${p1} ${verbFor(p1, "quiere", "quieren")} irse`, 0.7, "Fallback robusto: deseo claro y ejecutable.", validator([p1], ["querer", "irse", "marchar"]));
            push(relationalP2 ? `${p1} ${verbFor(p1, "necesita", "necesitan")} algo de ${p2}` : `${p1} ${verbFor(p1, "cambia", "cambian")} de idea`, 0.66, "Fallback relacional si el foco aun esta difuso.", validator(relationalP2 ? [p1, p2] : [p1], ["necesitar", "pedir", "cambiar"]));
            push(`${p1} ya no ${verbFor(p1, "puede", "pueden")} disimular`, 0.62, "Fallback de mascara dramaturgica.", validator([p1], ["disimular", "ocultar", "negar"]));
        }

        return out.sort((a, b) => b.score - a.score);
    }

    function render(result) {
        if (!result || result.empty) {
            renderEmpty(result ? result.message : "Sin datos.");
            return;
        }

        renderFinal(result.final);
        renderSlots(result.model.response.slots);
        renderSceneSummary(result.memory);
        renderModelRuntimeCard(result.localModelAnalysis);
        refs.normalizedText.textContent = result.original;
        refs.structureSummary.innerHTML = [
            chip(`${result.structure.counts.lines} lineas`, "chip--soft"),
            chip(`${result.structure.counts.speaker} parlamentos`, result.structure.counts.speaker ? "chip--good" : "chip--soft"),
            chip(`${result.structure.counts.stage} acotaciones`, result.structure.counts.stage ? "chip--warn" : "chip--soft"),
            chip(result.mode === "local_models" ? "modo modelos locales" : "modo heuristico", result.mode === "local_models" ? "chip--good" : "chip--soft"),
            chip(`${result.structure.speakers.length} voces`, result.structure.speakers.length ? "chip--good" : "chip--soft")
        ].join("");
        refs.structureLines.innerHTML = result.structure.lines.map((line) => `
            <div class="line-item">
                <div class="line-item__meta">
                    ${chip(`L${line.index}`, "chip--soft")}
                    ${chip(line.kind, line.kind === "speaker" ? "chip--good" : line.kind === "stage" ? "chip--warn" : "chip--soft")}
                    ${line.speaker ? chip(line.speaker, "chip--good") : ""}
                </div>
                <p class="line-item__text">${escapeHtml(line.raw)}</p>
            </div>
        `).join("");
        refs.localBody.innerHTML = result.localCandidates.length ? result.localCandidates.map((c) => `
            <tr>
                <td><strong>${escapeHtml(c.primarySurface)}</strong></td>
                <td>${escapeHtml(c.kind)}</td>
                <td>${c.score}</td>
                <td>${c.mentions}</td>
                <td><small>${escapeHtml(c.evidences.slice(0, 5).map((e) => `${e.reason} (+${e.weight})`).join(" | "))}</small></td>
            </tr>
        `).join("") : `<tr><td colspan="5" class="empty">Sin candidatos locales.</td></tr>`;
        refs.entitiesBody.innerHTML = result.entities.length ? result.entities.map((e) => `
            <tr>
                <td><strong>${escapeHtml(e.surface.toUpperCase())}</strong></td>
                <td>${escapeHtml(e.kind)}</td>
                <td><small>${escapeHtml(formatSemanticLabel(e))}</small></td>
                <td><small>${escapeHtml(e.aliases.join(", "))}</small></td>
                <td>${Math.round(e.confidence * 100)}%</td>
                <td>${e.activity}</td>
            </tr>
        `).join("") : `<tr><td colspan="6" class="empty">Sin entidades resueltas.</td></tr>`;
        refs.signalsBody.innerHTML = result.signals.length ? result.signals.map((s) => `
            <tr>
                <td>${escapeHtml(s.label)}</td>
                <td><small>${escapeHtml(s.characters.join(", "))}</small></td>
                <td>${s.intensity}</td>
                <td><small>${escapeHtml(s.fragment)}</small></td>
            </tr>
        `).join("") : `<tr><td colspan="4" class="empty">Sin senales dramaticas.</td></tr>`;
        refs.memoryOutput.textContent = pretty(result.memory);
        refs.modelInput.textContent = pretty(result.localModelAnalysis ? result.localModelAnalysis.input : {
            mode: "heuristics",
            note: "Este modo no consulta modelos locales. Pulsa 'Analizar con modelos locales' para lanzar NER y embeddings en el navegador."
        });
        refs.modelOutput.textContent = pretty(result.localModelAnalysis ? result.localModelAnalysis.output : {
            mode: "heuristics",
            slots: result.model.response.slots,
            dominant_signal: result.model.response.dominant_signal
        });
        refs.debugJson.textContent = pretty(result);
        refs.candidateList.innerHTML = result.repentizados.length ? result.repentizados.map((item, idx) => `
            <article class="candidate ${idx === 0 ? "candidate--top" : ""}">
                <div class="candidate__meta">
                    ${chip(`ajuste ${Math.round(item.score * 100)}%`, idx === 0 ? "chip--good" : "chip--soft")}
                    ${chip(idx === 0 ? "principal" : "alternativa", idx === 0 ? "chip--good" : "chip--soft")}
                </div>
                <h3 class="candidate__text">${escapeHtml(item.text)}</h3>
                <p class="candidate__reason">${escapeHtml(item.reason)}</p>
                <p class="candidate__validator">${escapeHtml(formatValidator(item.validator))}</p>
            </article>
        `).join("") : `<p class="empty">Sin candidatos.</p>`;
    }

    function renderFinal(candidate) {
        if (!candidate) {
            refs.finalRepentizado.textContent = "Sin propuesta";
            refs.finalReason.textContent = "No se pudo construir un repentizado consistente.";
            refs.finalScoreFill.style.width = "0%";
            refs.finalScoreLabel.textContent = "Confianza estimada: 0%";
            refs.finalInsertable.textContent = "-";
            refs.finalValidation.textContent = "-";
            return;
        }
        refs.finalRepentizado.textContent = candidate.text;
        refs.finalReason.textContent = candidate.reason;
        refs.finalScoreFill.style.width = `${Math.round(candidate.score * 100)}%`;
        refs.finalScoreLabel.textContent = `Confianza estimada: ${Math.round(candidate.score * 100)}%`;
        refs.finalInsertable.textContent = candidate.insertable;
        refs.finalValidation.textContent = formatValidator(candidate.validator);
    }

    function renderSlots(slots) {
        refs.slotCards.innerHTML = ["P1", "P2"].map((name) => {
            const slot = slots[name];
            return `
                <div class="mini-card">
                    <h4>${name}</h4>
                    <p>${escapeHtml(slot.surface)}</p>
                    <div class="chips">
                        ${chip(slot.kind, slot.kind === "fallback" ? "chip--warn" : "chip--good")}
                        ${chip(`${Math.round((slot.confidence || 0) * 100)}%`, "chip--soft")}
                    </div>
                    <p>${escapeHtml(slot.reason || "Sin razon")}</p>
                </div>
            `;
        }).join("");
    }

    function renderSceneSummary(memory) {
        refs.sceneSummary.innerHTML = `
            <div class="mini-card"><h4>Foco dominante</h4><p>${escapeHtml(memory.dominantSignal ? memory.dominantSignal.label : "Sin senal dominante clara")}</p></div>
            <div class="mini-card"><h4>Personajes activos</h4><p>${escapeHtml((memory.tailActiveEntities && memory.tailActiveEntities.length ? memory.tailActiveEntities : memory.activeEntities).slice(0, 3).map((e) => e.surface).join(", ") || "Sin foco")}</p></div>
            <div class="mini-card"><h4>Riesgo dramatica</h4><p>${escapeHtml(memory.risk.toUpperCase())}</p></div>
            <div class="mini-card"><h4>Cola del texto</h4><p>${escapeHtml(memory.tailExcerpt || "Sin tramo final legible")}</p></div>
        `;
    }

    function renderModelRuntimeCard(localModelAnalysis = null) {
        const cards = [];
        const status = LOCAL_MODEL_RUNTIME.status || "idle";
        const statusChip = status === "ready"
            ? chip("listo", "chip--good")
            : status === "error"
                ? chip("error", "chip--bad")
                : status === "running" || status === "loading"
                    ? chip(status === "running" ? "analizando" : "cargando", "chip--warn")
                    : chip("reposo", "chip--soft");

        cards.push(`
            <div class="mini-card mini-card--accent">
                <h4>Estado</h4>
                <div class="chips">${statusChip}${LOCAL_MODEL_RUNTIME.lastStage ? chip(LOCAL_MODEL_RUNTIME.lastStage, "chip--soft") : ""}</div>
                <p>${escapeHtml(LOCAL_MODEL_RUNTIME.detail || "Todavia no se ha pedido inferencia local.")}</p>
            </div>
        `);

        cards.push(`
            <div class="mini-card">
                <h4>Backend</h4>
                <p>${escapeHtml(LOCAL_MODEL_RUNTIME.backend || "browser/wasm")}</p>
                <p>${escapeHtml(LOCAL_MODEL_RUNTIME.modelsLoaded ? `Modelos: ${LOCAL_MODEL_RUNTIME.modelsLoaded.join(" + ")}` : "Sin modelos cargados aun.")}</p>
            </div>
        `);

        cards.push(`
            <div class="mini-card">
                <h4>Ultima corrida</h4>
                <p>${escapeHtml(localModelAnalysis ? `${localModelAnalysis.output.meta.duration_ms} ms` : "Sin inferencia local.")}</p>
                <p>${escapeHtml(localModelAnalysis ? `${localModelAnalysis.output.summary.entity_types.length} entidades reclasificadas` : "Pulsa el boton de modelos para lanzar NER y embeddings.")}</p>
            </div>
        `);

        if (LOCAL_MODEL_RUNTIME.lastError) {
            cards.push(`
                <div class="mini-card">
                    <h4>Error</h4>
                    <p>${escapeHtml(LOCAL_MODEL_RUNTIME.lastError)}</p>
                </div>
            `);
        }

        refs.modelRuntimeCards.innerHTML = cards.join("");
    }

    function renderEmpty(message) {
        refs.finalRepentizado.textContent = "Esperando analisis...";
        refs.finalReason.textContent = message;
        refs.finalScoreFill.style.width = "0%";
        refs.finalScoreLabel.textContent = "Confianza estimada: 0%";
        refs.finalInsertable.textContent = "-";
        refs.finalValidation.textContent = "-";
        refs.slotCards.innerHTML = `<div class="mini-card"><h4>P1</h4><p class="empty">Sin asignar.</p></div><div class="mini-card"><h4>P2</h4><p class="empty">Sin asignar.</p></div>`;
        refs.sceneSummary.innerHTML = `<div class="mini-card"><h4>Estado</h4><p class="empty">${escapeHtml(message)}</p></div>`;
        renderModelRuntimeCard();
        refs.candidateList.innerHTML = `<p class="empty">${escapeHtml(message)}</p>`;
        refs.normalizedText.textContent = "-";
        refs.structureSummary.innerHTML = "";
        refs.structureLines.innerHTML = `<p class="empty">${escapeHtml(message)}</p>`;
        refs.localBody.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(message)}</td></tr>`;
        refs.entitiesBody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(message)}</td></tr>`;
        refs.signalsBody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(message)}</td></tr>`;
        refs.memoryOutput.textContent = "-";
        refs.modelInput.textContent = "-";
        refs.modelOutput.textContent = "-";
        refs.debugJson.textContent = "-";
    }

    function formatSemanticLabel(entity) {
        if (!entity || !entity.semanticType) return "sin capa semantica";
        return `${entity.semanticType} (${Math.round((entity.semanticConfidence || 0) * 100)}%)`;
    }

    function setBusyState(mode, isBusy) {
        const heuristicBusy = isBusy && mode === "heuristics";
        const modelBusy = isBusy && mode === "models";
        refs.analyze.disabled = heuristicBusy || modelBusy;
        refs.analyzeModel.disabled = heuristicBusy || modelBusy;

        if (modelBusy) {
            LOCAL_MODEL_RUNTIME.lastError = "";
            LOCAL_MODEL_RUNTIME.status = LOCAL_MODEL_RUNTIME.modelsLoaded ? "running" : "loading";
            LOCAL_MODEL_RUNTIME.detail = LOCAL_MODEL_RUNTIME.modelsLoaded
                ? "Ejecutando NER y embeddings locales sobre el texto."
                : "Preparando worker y descargando modelos si hace falta.";
            renderModelRuntimeCard();
        }
    }

    function buildLocalModelPayload(base) {
        return {
            source: base.original,
            excerpt: excerptTail(base.original, 1400),
            lines: base.structure.lines.slice(0, 48).map((line) => ({
                index: line.index,
                kind: line.kind,
                speaker: line.speaker,
                content: line.content || line.raw
            })),
            local_candidates: base.localCandidates.slice(0, 14).map((candidate) => ({
                surface: candidate.primarySurface,
                kind: candidate.kind,
                score: candidate.score,
                mentions: candidate.mentions,
                evidences: candidate.evidences.slice(0, 4).map((entry) => entry.reason)
            })),
            resolved_entities: base.entities.slice(0, 12).map((entity) => ({
                surface: entity.surface,
                kind: entity.kind,
                aliases: entity.aliases,
                confidence: entity.confidence,
                activity: entity.activity
            })),
            signals: base.signals.slice(0, 10).map((signal) => ({
                kind: signal.kind,
                label: signal.label,
                characters: signal.characters,
                intensity: signal.intensity,
                fragment: signal.fragment
            }))
        };
    }

    function requestLocalModelAnalysis(payload) {
        return new Promise((resolve, reject) => {
            if (!LOCAL_MODEL_RUNTIME.supported) {
                reject(new Error("Este navegador no soporta Module Workers."));
                return;
            }

            const worker = ensureLocalModelWorker();
            const requestId = `req_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
            LOCAL_MODEL_RUNTIME.pending.set(requestId, { resolve, reject });
            worker.postMessage({
                type: "analyze",
                requestId,
                payload,
                config: {
                    pageUrl: window.location.href,
                    localModelPath: canUseServedLocalModels() ? new URL("./models/", window.location.href).href : "",
                    preferLocalModels: canUseServedLocalModels()
                }
            });
        });
    }

    function ensureLocalModelWorker() {
        if (LOCAL_MODEL_RUNTIME.worker) return LOCAL_MODEL_RUNTIME.worker;

        const source = `(${createLocalModelWorkerMain.toString()})();`;
        const blob = new Blob([source], { type: "text/javascript" });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl, { type: "module" });
        LOCAL_MODEL_RUNTIME.worker = worker;
        LOCAL_MODEL_RUNTIME.workerUrl = workerUrl;

        worker.addEventListener("message", (event) => {
            const data = event.data || {};

            if (data.type === "status") {
                LOCAL_MODEL_RUNTIME.status = data.status || LOCAL_MODEL_RUNTIME.status;
                LOCAL_MODEL_RUNTIME.detail = data.detail || LOCAL_MODEL_RUNTIME.detail;
                LOCAL_MODEL_RUNTIME.lastStage = data.stage || "";
                if (Array.isArray(data.modelsLoaded)) {
                    LOCAL_MODEL_RUNTIME.modelsLoaded = data.modelsLoaded.slice();
                }
                if (data.backend) LOCAL_MODEL_RUNTIME.backend = data.backend;
                renderModelRuntimeCard();
                return;
            }

            if (data.type === "result") {
                const pending = LOCAL_MODEL_RUNTIME.pending.get(data.requestId);
                if (!pending) return;
                LOCAL_MODEL_RUNTIME.pending.delete(data.requestId);
                LOCAL_MODEL_RUNTIME.status = "ready";
                LOCAL_MODEL_RUNTIME.detail = "Inferencia local completada.";
                LOCAL_MODEL_RUNTIME.lastStage = "fusion";
                LOCAL_MODEL_RUNTIME.lastError = "";
                renderModelRuntimeCard({ input: data.input, output: data.output });
                pending.resolve({ input: data.input, output: data.output });
                return;
            }

            if (data.type === "error") {
                const pending = LOCAL_MODEL_RUNTIME.pending.get(data.requestId);
                if (pending) {
                    LOCAL_MODEL_RUNTIME.pending.delete(data.requestId);
                    pending.reject(new Error(data.error || "Error desconocido en worker."));
                }
                LOCAL_MODEL_RUNTIME.status = "error";
                LOCAL_MODEL_RUNTIME.detail = "La inferencia local ha fallado.";
                LOCAL_MODEL_RUNTIME.lastError = data.error || "Error desconocido.";
                renderModelRuntimeCard();
            }
        });

        worker.addEventListener("error", (event) => {
            LOCAL_MODEL_RUNTIME.status = "error";
            LOCAL_MODEL_RUNTIME.detail = "Error en el worker de modelos.";
            LOCAL_MODEL_RUNTIME.lastError = String(event.message || event.error || "Error desconocido.");
            renderModelRuntimeCard();
        });

        return worker;
    }

    function createLocalModelRuntime() {
        return {
            supported: typeof Worker !== "undefined",
            worker: null,
            pending: new Map(),
            status: "idle",
            detail: "",
            lastStage: "",
            backend: "browser/wasm",
            modelsLoaded: [],
            lastError: "",
            workerUrl: ""
        };
    }

    function canUseServedLocalModels() {
        return /^https?:$/i.test(String(window.location.protocol || ""));
    }

    function buildUnits(structure) {
        return structure.lines.flatMap((line) => {
            const raw = line.kind === "speaker" && line.content ? line.content : line.raw;
            const units = [];
            const regex = /[^.!?\n]+/g;
            let match;
            while ((match = regex.exec(raw)) !== null) {
                const text = (match[0] || "").trim();
                if (!text) continue;
                units.push({
                    text,
                    kind: line.kind,
                    charStart: line.charStart + match.index,
                    charEnd: line.charStart + match.index + text.length,
                    lineIndex: line.index
                });
            }
            return units;
        });
    }

    function collapseSignals(signals) {
        const map = new Map();
        signals.forEach((signal) => {
            const key = `${signal.kind}:${signal.characters.join("|")}:${normalizeForCompare(signal.fragment)}`;
            if (!map.has(key)) {
                map.set(key, { ...signal });
                return;
            }
            const current = map.get(key);
            current.intensity = round2(current.intensity + signal.intensity * 0.35);
            current.recency = Math.max(current.recency || 0, signal.recency || 0);
            current.tailWeight = Math.max(current.tailWeight || 1, signal.tailWeight || 1);
            current.lineIndex = Math.max(current.lineIndex || 0, signal.lineIndex || 0);
            if ((signal.recency || 0) >= (current.recency || 0)) {
                current.fragment = signal.fragment;
            }
        });
        return Array.from(map.values());
    }

    function chooseDominantSignal(signals) {
        if (!signals.length) return null;
        return signals.slice().sort((a, b) => {
            const aRecentScore = ((a.tailWeight || 1) * (a.intensity || 0)) + ((a.recency || 0) * 2.4);
            const bRecentScore = ((b.tailWeight || 1) * (b.intensity || 0)) + ((b.recency || 0) * 2.4);
            if (aRecentScore !== bRecentScore) return bRecentScore - aRecentScore;
            const pa = SIGNAL_PRIORITY.indexOf(a.kind);
            const pb = SIGNAL_PRIORITY.indexOf(b.kind);
            if (pa !== pb) return pa - pb;
            return (b.tailWeight || 1) - (a.tailWeight || 1) || (b.recency || 0) - (a.recency || 0) || b.intensity - a.intensity;
        })[0];
    }

    function pickTailSignals(signals) {
        const ordered = Array.isArray(signals) ? signals.slice().sort((a, b) => (b.recency || 0) - (a.recency || 0) || b.intensity - a.intensity) : [];
        const tail = ordered.filter((signal) => (signal.recency || 0) >= 0.68 || (signal.tailWeight || 1) >= 1.18);
        return (tail.length ? tail : ordered.slice(0, 4)).sort((a, b) => b.intensity - a.intensity);
    }

    function recencyWeight(recency) {
        const value = Math.max(0, Math.min(1, Number(recency) || 0));
        if (value >= 0.92) return 1.72;
        if (value >= 0.82) return 1.48;
        if (value >= 0.68) return 1.28;
        if (value >= 0.52) return 1.08;
        return 0.92;
    }

    function analyzeOpenRolePhrase(original, index, phrase) {
        const normalizedPhrase = normalizeForCompare(phrase);
        const head = extractNominalHead(normalizedPhrase);
        if (!head || head.length < 3 || NAME_STOPWORDS.has(head)) return null;

        const before = normalizeForCompare(original.slice(Math.max(0, index - 24), index));
        const after = normalizeForCompare(original.slice(index + phrase.length, Math.min(original.length, index + phrase.length + 28)));
        const lineContext = normalizeForCompare(getLineAtIndex(original, index));

        let score = 0.9;
        const reasons = ["Sintagma nominal abierto"];

        if (matchesImmediateHumanAction(before, after)) {
            score += 2.2;
            reasons.push("Contexto verbal humano cercano");
        }

        if (/^(mi|tu|su)\b/.test(normalizedPhrase)) {
            score += 0.6;
            reasons.push("Sintagma posesivo");
        }

        if (ROLE_FAMILY_ALIASES[head]) {
            score += 0.4;
            reasons.push("Cabeza util para fusion");
        }

        if (containsHumanActionHint(lineContext)) {
            score += 0.4;
            reasons.push("Linea con accion dramatica");
        }

        return score >= 2.2
            ? { score: round2(score), reason: reasons.join(" / ") }
            : null;
    }

    function detectPlaceholderCandidates(original, map) {
        const collected = new Map();

        collectMatches(original, PLACEHOLDER_ENTITY_REGEX, (match) => {
            const token = match[2];
            if (!token || token === "Y" || token === "O") return;

            const tokenIndex = match.index + (match[1] ? match[1].length : 0);
            const before = normalizeForCompare(original.slice(Math.max(0, tokenIndex - 28), tokenIndex));
            const after = normalizeForCompare(original.slice(tokenIndex + token.length, Math.min(original.length, tokenIndex + token.length + 28)));
            const line = normalizeForCompare(getLineAtIndex(original, tokenIndex));

            const data = collected.get(token) || { count: 0, actionHits: 0, pairHits: 0, indexes: [] };
            data.count += 1;
            if (containsHumanActionHint(before) || containsHumanActionHint(after) || containsHumanActionHint(line)) {
                data.actionHits += 1;
            }
            if (/\b[xyz]\s+y\s+[xyz]\b/i.test(line) || /\b[xyz]\s+y\s+[xyz]\b/i.test(`${before} ${token.toLowerCase()} ${after}`)) {
                data.pairHits += 1;
            }
            data.indexes.push(tokenIndex);
            collected.set(token, data);
        });

        collected.forEach((data, token) => {
            if (data.count < 2) return;
            if (data.pairHits === 0 && data.actionHits < 2) return;
            const score = round2((data.count * 1.2) + (data.actionHits * 0.9) + (data.pairHits * 0.8));
            if (score < 3.2) return;
            registerCandidate(map, token, "placeholder", score, "Placeholder repetido en contexto dramatizado", data.indexes[0]);
        });
    }

    function extractNominalHead(surface) {
        const base = String(surface || "")
            .replace(/^(la|el|los|las|un|una|mi|tu|su)\s+/, "")
            .trim();
        if (!base) return "";

        const tokens = base.split(/\s+/);
        const connectors = new Set(["de", "del", "al", "con", "sin", "y", "e", "que", "para", "por"]);
        for (const token of tokens) {
            if (!token || connectors.has(token)) break;
            return token;
        }
        return tokens[0] || "";
    }

    function singularizeNominalToken(token) {
        const value = String(token || "").trim();
        if (!value) return "";
        if (value.endsWith("ces") && value.length > 3) return `${value.slice(0, -3)}z`;
        if (value.endsWith("es") && value.length > 4) return value.slice(0, -2);
        if (value.endsWith("s") && value.length > 3) return value.slice(0, -1);
        return value;
    }

    function matchesImmediateHumanAction(before, after) {
        return matchesActionTail(before) || matchesActionHead(after);
    }

    function matchesActionTail(text) {
        const compact = String(text || "").trim();
        if (!compact) return false;
        return HUMAN_ACTION_HINTS.some((hint) => new RegExp(`${hint}[a-záéíóúüñ]*\\s*$`, "i").test(compact));
    }

    function matchesActionHead(text) {
        const compact = String(text || "");
        if (!compact) return false;
        return HUMAN_ACTION_HINTS.some((hint) => new RegExp(`^\\s*${hint}[a-záéíóúüñ]*\\b`, "i").test(compact));
    }

    function containsHumanActionHint(text) {
        const compact = String(text || "");
        if (!compact) return false;
        return HUMAN_ACTION_HINTS.some((hint) => new RegExp(`\\b${hint}[a-záéíóúüñ]*\\b`, "i").test(compact));
    }

    function looksLikeActionWord(surface) {
        const token = normalizeForCompare(surface).split(/\s+/)[0] || "";
        if (!token) return false;
        if (containsHumanActionHint(token)) return true;
        return Object.values(VERB_GROUPS).some((verbs) =>
            verbs.some((verb) => normalizeForCompare(verb) === token)
        );
    }

    function isHumanActionVerbToken(token) {
        const normalized = normalizeForCompare(token).split(/\s+/)[0] || "";
        if (!normalized) return false;
        if (containsHumanActionHint(normalized)) return true;
        return Object.values(VERB_GROUPS).some((verbs) =>
            verbs.some((verb) => normalizeForCompare(verb).split(/\s+/)[0] === normalized)
        );
    }

    function hasLowercaseCounterpart(original, surface) {
        const raw = String(surface || "").trim();
        if (!raw) return false;
        const lower = raw.toLowerCase();
        if (lower === raw) return false;
        return String(original || "").includes(lower);
    }

    function getLineAtIndex(text, index) {
        const safeIndex = Math.max(0, Math.min(String(text || "").length, Number(index) || 0));
        const start = String(text || "").lastIndexOf("\n", safeIndex - 1);
        const end = String(text || "").indexOf("\n", safeIndex);
        return String(text || "").slice(start >= 0 ? start + 1 : 0, end >= 0 ? end : undefined);
    }

    function dedupeEntitiesByCluster(entities) {
        const seen = new Set();
        return entities.filter((entity) => {
            const key = entity.clusterKey || buildEntityClusterKey(entity);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function selectDistinctSlots(activeEntities) {
        const ordered = Array.isArray(activeEntities) ? activeEntities.slice().sort((a, b) => rankSlotEntity(b) - rankSlotEntity(a)) : [];
        const preferred = ordered.find((entity) => !entity.shadowedByCollective && isLikelyCharacterEntity(entity)) || ordered[0] || null;
        const secondary = ordered.find((entity) =>
            preferred &&
            entity.id !== preferred.id &&
            entity.confidence >= 0.35 &&
            isLikelyCharacterEntity(entity) &&
            areEntitiesCompatible(preferred, entity)
        ) || null;

        return {
            P1: preferred,
            P2: secondary
        };
    }

    function resolveSignalDrivenSlot(activeEntities, label, excludeEntity = null) {
        if (!label) return null;
        const target = normalizeForCompare(label);
        return (activeEntities || []).find((entity) => {
            if (!entity) return false;
            if (excludeEntity && entity.id === excludeEntity.id) return false;
            if (excludeEntity && !areEntitiesCompatible(excludeEntity, entity)) return false;
            if (!isLikelyCharacterEntity(entity)) return false;
            if (normalizeForCompare(entity.surface) === target) return true;
            return Array.isArray(entity.aliases) && entity.aliases.some((alias) => normalizeForCompare(alias) === target);
        }) || null;
    }

    function areEntitiesCompatible(a, b) {
        if (!a || !b) return false;
        return buildEntityClusterKey(a) !== buildEntityClusterKey(b);
    }

    function rankSlotEntity(entity) {
        if (!entity) return -1;
        const semanticBoost = entity.semanticType === "character"
            ? 4.8
            : entity.semanticType === "motif"
                ? -0.8
                : entity.semanticType === "object" || entity.semanticType === "space"
                    ? -2.4
                    : isLikelyCharacterEntity(entity)
                        ? 1.2
                        : -0.6;
        return (entity.activityFinal || entity.activity || 0) + ((entity.semanticConfidence || 0) * 4.2) + semanticBoost;
    }

    function buildEntityClusterKey(entity) {
        if (!entity) return "entity:desconocida";
        if (entity.roleFamily && entity.roleNumber) return `role-family:${entity.roleFamily}:${entity.roleNumber}`;
        if (entity.roleFamily) return `role-family:${entity.roleFamily}`;

        const parsed = summarizeRoleInfo(entity.aliases && entity.aliases.length ? entity.aliases : [entity.surface || ""], entity.kind || "");
        if (parsed && parsed.family && parsed.numericSuffix) return `role-family:${parsed.family}:${parsed.numericSuffix}`;
        if (parsed && parsed.family) return `role-family:${parsed.family}`;

        return `entity:${normalizeForCompare(entity.surface || "").replace(/\s+\d+$/, "")}`;
    }

    function summarizeRoleInfo(aliases, kind = "") {
        if (kind !== "role" && kind !== "speaker") return null;
        const parsed = (aliases || [])
            .filter((alias) => kind === "role" || isRoleLikeSpeakerSurface(alias))
            .map((alias) => parseRoleLikeSurface(alias))
            .filter(Boolean);
        if (!parsed.length) return null;

        const family = parsed[0].family;
        const numbered = parsed.find((entry) => entry.numericSuffix);
        return {
            family,
            numericSuffix: numbered ? numbered.numericSuffix : null,
            hasCollectiveAlias: parsed.some((entry) => entry.isCollective)
        };
    }

    function parseRoleLikeSurface(surface) {
        const normalized = normalizeForCompare(surface)
            .replace(/[.,;:!?()[\]{}"'`]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        if (!normalized) return null;

        const match = normalized.match(/^(.*?)(?:\s+(\d+))?$/);
        const withoutNumber = match ? match[1].trim() : normalized;
        const numericSuffix = match && match[2] ? Number(match[2]) : null;
        const base = withoutNumber.replace(/^(la|el|los|las|un|una|mi|tu|su)\s+/, "").trim();
        if (!base) return null;

        const token = extractNominalHead(base);
        const family = ROLE_FAMILY_ALIASES[token] || singularizeNominalToken(token);
        if (!family) return null;

        const isCollective = Boolean(!numericSuffix && (token.endsWith("s") || /^(los|las)\b/.test(normalized)));
        return {
            family,
            numericSuffix,
            isCollective
        };
    }

    function isRoleLikeSpeakerSurface(surface) {
        const normalized = normalizeForCompare(surface);
        if (!normalized) return false;
        if (/\d+$/.test(normalized)) return true;
        const head = extractNominalHead(normalized);
        if (!head) return false;
        return Boolean(ROLE_FAMILY_ALIASES[head] || head.endsWith("s"));
    }

    function chooseDisplaySurface(aliasWeights, roleInfo, fallbackSurface) {
        const ranked = Array.from(aliasWeights.entries()).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
        if (!ranked.length) return fallbackSurface || "";

        if (roleInfo && roleInfo.hasCollectiveAlias && !roleInfo.numericSuffix) {
            const collective = ranked.find(([alias]) => {
                const parsed = parseRoleLikeSurface(alias);
                return parsed && parsed.family === roleInfo.family && parsed.isCollective;
            });
            if (collective) return collective[0];
        }

        return ranked[0][0] || fallbackSurface || "";
    }

    function buildSemanticTypeMap(typeEntries) {
        const map = new Map();
        (typeEntries || []).forEach((entry) => {
            const keys = [entry.surface].concat(entry.aliases || []).map((value) => normalizeForCompare(value)).filter(Boolean);
            keys.forEach((key) => {
                if (!map.has(key) || (map.get(key).confidence || 0) < (entry.confidence || 0)) {
                    map.set(key, entry);
                }
            });
        });
        return map;
    }

    function findSemanticMatch(entity, typeMap) {
        const keys = [entity.surface].concat(entity.aliases || []).map((value) => normalizeForCompare(value)).filter(Boolean);
        for (const key of keys) {
            if (typeMap.has(key)) return typeMap.get(key);
        }
        return null;
    }

    function defaultSemanticEntity(entity) {
        if (!entity) return entity;
        if (entity.semanticType) return entity;
        if (entity.kind === "speaker" || entity.kind === "placeholder" || (entity.kind === "role" && hasKnownHumanRole(entity))) {
            return {
                ...entity,
                semanticType: "character",
                semanticConfidence: 0.58,
                semanticScores: { character: 0.58 }
            };
        }
        return {
            ...entity,
            semanticType: "unknown",
            semanticConfidence: 0.2,
            semanticScores: {}
        };
    }

    function isLikelyCharacterEntity(entity) {
        if (!entity) return false;
        if (entity.semanticType === "character") return true;
        if (entity.semanticType === "object" || entity.semanticType === "space") return false;
        return entity.kind === "speaker" || entity.kind === "placeholder" || hasKnownHumanRole(entity);
    }

    function hasKnownHumanRole(entity) {
        const surfaces = [entity.surface].concat(entity.aliases || []);
        return surfaces.some((surface) => {
            const head = extractNominalHead(normalizeForCompare(surface));
            return Boolean(ROLE_FAMILY_ALIASES[head]);
        });
    }

    function registerCandidate(map, surface, kind, weight, reason, index) {
        const key = `${kind}:${candidateKey(surface, kind)}`;
        const current = map.get(key) || { kind, score: 0, evidences: [], surfaces: new Set(), lastIndex: 0 };
        current.score += weight;
        current.surfaces.add(normalizeWhitespace(surface));
        current.lastIndex = Math.max(current.lastIndex, Number(index) || 0);
        current.evidences.push({ reason, weight: round2(weight), index: Number(index) || 0 });
        map.set(key, current);
    }

    function candidateKey(surface, kind) {
        const parsed = parseRoleLikeSurface(surface);
        if (parsed && kind === "role") {
            return `role-family:${parsed.family}${parsed.numericSuffix ? `:${parsed.numericSuffix}` : ""}`;
        }
        const base = normalizeForCompare(surface).replace(/^(don|dona|senor|senora)\s+/, "");
        return kind === "role" ? base.replace(/^(la|el|los|las|un|una|mi|tu|su)\s+/, "") : base;
    }

    function entityKey(surface, kind) {
        const parsed = parseRoleLikeSurface(surface);
        if (parsed && kind === "role") {
            return `role:${parsed.family}${parsed.numericSuffix ? `:${parsed.numericSuffix}` : ""}`;
        }
        if (parsed && kind === "speaker" && isRoleLikeSpeakerSurface(surface)) {
            return `speaker-role:${parsed.family}${parsed.numericSuffix ? `:${parsed.numericSuffix}` : ""}`;
        }
        return `${kind === "role" ? "role" : "person"}:${candidateKey(surface, kind)}`;
    }

    function buildSlot(entity) {
        return {
            surface: entity.surface.toUpperCase(),
            kind: entity.kind,
            confidence: entity.confidence,
            reason: `${entity.kind} con actividad ${entity.activityFinal || entity.activity}${entity.semanticType ? ` / ${entity.semanticType}` : ""}`
        };
    }

    function fallbackSlot(surface) {
        return { surface, kind: "fallback", confidence: 0.18, reason: "Fallback por baja confianza" };
    }

    function validator(aliases, verbs) {
        return {
            aliases: aliases.filter(Boolean),
            verbs: verbs.filter(Boolean),
            note: "Se cumple si aparece la entidad y uno de los verbos eje en una ventana corta."
        };
    }

    function formatValidator(info) {
        if (!info) return "Sin regla.";
        const aliases = info.aliases.length ? `aliases: ${info.aliases.join(", ")}` : "aliases: ninguno";
        const verbs = info.verbs.length ? `verbos: ${info.verbs.join(", ")}` : "verbos: ninguno";
        return `${aliases} | ${verbs} | ${info.note}`;
    }

    function verbFor(subject, singular, plural) {
        return isPluralSurface(subject) ? plural : singular;
    }

    function isPluralSurface(surface) {
        const parsed = parseRoleLikeSurface(surface);
        if (parsed && parsed.isCollective && !parsed.numericSuffix) return true;
        const normalized = normalizeForCompare(surface);
        return /\b(y|e)\b/.test(normalized) || /\b(las|los)\b/.test(normalized) || /\b\w+s\b/.test(normalized);
    }

    function signalLabel(kind) {
        return {
            desire_intimacy: "Deseo / intimidad",
            desire_exit: "Deseo de salida",
            desire_return: "Deseo de retorno",
            secrecy: "Secreto / ocultacion",
            revelation: "Revelacion",
            conflict_block: "Bloqueo / coercion",
            fear: "Miedo",
            entrance: "Entrada / irrupcion"
        }[kind] || kind;
    }

    function collectMatches(text, regex, onMatch) {
        const r = new RegExp(regex.source, regex.flags);
        let match;
        while ((match = r.exec(text)) !== null) {
            onMatch(match);
            if (r.lastIndex === match.index) r.lastIndex += 1;
        }
    }

    function containsAlias(text, alias) {
        if (!alias) return false;
        return new RegExp(`(^|[^a-z0-9])${escapeRegex(alias)}($|[^a-z0-9])`, "i").test(text);
    }

    function chooseLongest(values) {
        return values.slice().sort((a, b) => b.length - a.length || a.localeCompare(b))[0] || "";
    }

    function choosePrimaryAlias(current, next) {
        if (!current) return next;
        if (!next) return current;
        if (/^[A-Z\s]+$/.test(next) && !/^[A-Z\s]+$/.test(current)) return next;
        return next.length > current.length ? next : current;
    }

    function excerptTail(text, max) {
        return text.length <= max ? text : text.slice(text.length - max);
    }

    function normalizeWhitespace(text) {
        return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    }

    function normalizeForCompare(text) {
        return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    }

    function findIndexSafe(text, search) {
        const index = String(text || "").indexOf(String(search || ""));
        return index >= 0 ? index : 0;
    }

    function chip(text, className) {
        return `<span class="chip ${className || ""}">${escapeHtml(text)}</span>`;
    }

    function createLocalModelWorkerMain() {
        const TRANSFORMERS_VERSION = "3.8.1";
        const TRANSFORMERS_CDN = `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${TRANSFORMERS_VERSION}`;
        const MODEL_IDS = {
            ner: "Xenova/distilbert-base-multilingual-cased-ner-hrl",
            embedding: "Xenova/paraphrase-multilingual-MiniLM-L12-v2"
        };

        const ENTITY_LABELS = [
            {
                kind: "character",
                prompt: "En un texto dramatico o narrativo, esto nombra a una persona o personaje que habla, actua, desea, decide o se relaciona con otra persona."
            },
            {
                kind: "object",
                prompt: "En un texto dramatico o narrativo, esto nombra un objeto, utileria, comida, telefono, carta, arma o elemento material."
            },
            {
                kind: "space",
                prompt: "En un texto dramatico o narrativo, esto nombra un lugar, estancia, tienda, comedor, piscina, casa o espacio escenico."
            },
            {
                kind: "motif",
                prompt: "En un texto dramatico o narrativo, esto nombra una imagen, olor, sonido, color, idea recurrente o motivo simbolico."
            }
        ];

        const DYNAMIC_LABELS = [
            {
                kind: "desire_intimacy",
                prompt: "La escena gira alrededor del deseo, la intimidad, la atraccion, el acercamiento o el sexo entre personajes."
            },
            {
                kind: "desire_exit",
                prompt: "La escena gira alrededor de irse, huir, escapar, salir o abandonar el lugar."
            },
            {
                kind: "secrecy",
                prompt: "La escena gira alrededor de ocultar, callar, mentir, esconder o tapar informacion relevante."
            },
            {
                kind: "conflict_block",
                prompt: "La escena gira alrededor de bloquear, impedir, obligar, amenazar o ejercer coercion."
            },
            {
                kind: "fear",
                prompt: "La escena gira alrededor del miedo, la fragilidad, el peligro o la vulnerabilidad."
            },
            {
                kind: "revelation",
                prompt: "La escena gira alrededor de confesar, revelar, admitir o descubrir una verdad."
            },
            {
                kind: "desire_return",
                prompt: "La escena gira alrededor de volver, regresar, retornar o retomar algo pendiente."
            },
            {
                kind: "entrance",
                prompt: "La escena gira alrededor de una entrada, una llamada, una irrupcion o una llegada que cambia el foco."
            }
        ];

        const state = {
            bootPromise: null,
            ner: null,
            extractor: null,
            embeddingCache: new Map(),
            config: {
                pageUrl: "",
                localModelPath: "",
                preferLocalModels: false
            }
        };

        self.addEventListener("message", async (event) => {
            const data = event.data || {};
            if (data.type !== "analyze") return;
            if (data.config) {
                state.config = {
                    ...state.config,
                    ...data.config
                };
            }

            try {
                const runtime = await ensureRuntime();
                postStatus("running", "Procesando texto con modelos locales.", "inference", runtime.modelsLoaded);
                const output = await analyzePayload(data.payload || {}, runtime);
                self.postMessage({
                    type: "result",
                    requestId: data.requestId,
                    input: data.payload,
                    output
                });
            } catch (error) {
                self.postMessage({
                    type: "error",
                    requestId: data.requestId,
                    error: String(error && error.message ? error.message : error)
                });
            }
        });

        async function ensureRuntime() {
            if (state.bootPromise) return state.bootPromise;

            state.bootPromise = (async () => {
                postStatus("loading", `Importando Transformers.js ${TRANSFORMERS_VERSION}.`, "boot");
                const { env, pipeline } = await import(TRANSFORMERS_CDN);
                env.allowLocalModels = Boolean(state.config.localModelPath);
                env.allowRemoteModels = !state.config.preferLocalModels || !state.config.localModelPath;
                if (state.config.localModelPath) {
                    env.localModelPath = state.config.localModelPath;
                }
                env.useBrowserCache = true;

                postStatus("loading", "Cargando modelo NER multilingue.", "ner");
                state.ner = await pipeline("token-classification", MODEL_IDS.ner, {
                    dtype: "q8",
                    progress_callback: (progress) => relayProgress("ner", progress)
                });

                postStatus("loading", "Cargando modelo de embeddings semanticos.", "embedding");
                state.extractor = await pipeline("feature-extraction", MODEL_IDS.embedding, {
                    dtype: "q8",
                    progress_callback: (progress) => relayProgress("embedding", progress)
                });

                const runtime = {
                    modelsLoaded: [MODEL_IDS.ner, MODEL_IDS.embedding],
                    backend: `transformers.js@${TRANSFORMERS_VERSION} / browser-wasm`
                };
                postStatus("ready", "Modelos locales listos y cacheados.", "ready", runtime.modelsLoaded, runtime.backend);
                return runtime;
            })();

            return state.bootPromise;
        }

        async function analyzePayload(payload, runtime) {
            const startedAt = performance.now();
            const excerpt = String(payload.excerpt || payload.source || "");
            const segments = splitIntoSegments(excerpt);
            const nerMentions = await runNer(segments);
            const nerEntities = aggregateNerMentions(nerMentions, excerpt);
            const candidates = buildCandidateSet(payload, nerEntities, excerpt);
            const entityTypes = await classifyEntityTypes(candidates, nerEntities);
            const dynamics = await classifyDynamics(payload, excerpt);
            const durationMs = Math.round(performance.now() - startedAt);

            return {
                meta: {
                    backend: runtime.backend,
                    duration_ms: durationMs,
                    models: MODEL_IDS,
                    segments: segments.length
                },
                summary: {
                    ner_entities: nerEntities,
                    entity_types: entityTypes,
                    dynamics,
                    notes: buildSummaryNotes(nerEntities, entityTypes, dynamics)
                },
                raw: {
                    segments,
                    ner_mentions: nerMentions.slice(0, 80)
                }
            };
        }

        async function runNer(segments) {
            const mentions = [];

            for (let index = 0; index < segments.length; index += 1) {
                const segment = segments[index];
                postStatus("running", `NER sobre segmento ${index + 1}/${segments.length}.`, "ner");

                const rows = await state.ner(segment.text, {
                    aggregation_strategy: "simple",
                    ignore_labels: ["O"]
                });
                const entries = Array.isArray(rows) ? rows : [];

                entries.forEach((entry) => {
                    const surface = cleanSurface(entry.word || entry.text || "");
                    if (!surface || surface.length < 2) return;
                    mentions.push({
                        surface,
                        label: normalizeNerLabel(entry.entity_group || entry.entity || ""),
                        confidence: round4(entry.score || 0),
                        start: segment.offset + Number(entry.start || 0),
                        end: segment.offset + Number(entry.end || 0),
                        segment: index + 1
                    });
                });
            }

            return mentions;
        }

        function aggregateNerMentions(mentions, source) {
            const map = new Map();
            const textLength = Math.max(1, String(source || "").length);

            mentions.forEach((mention) => {
                const key = `${normalizeForCompare(mention.surface)}:${mention.label}`;
                const current = map.get(key) || {
                    surface: mention.surface,
                    label: mention.label,
                    confidenceSum: 0,
                    mentions: 0,
                    recency: 0
                };
                current.surface = chooseSurface(current.surface, mention.surface);
                current.confidenceSum += mention.confidence;
                current.mentions += 1;
                current.recency = Math.max(current.recency, mention.end / textLength);
                map.set(key, current);
            });

            return Array.from(map.values())
                .map((entry) => ({
                    surface: entry.surface,
                    label: entry.label,
                    confidence: round4(entry.confidenceSum / Math.max(1, entry.mentions)),
                    mentions: entry.mentions,
                    recency: round4(entry.recency)
                }))
                .sort((a, b) => b.mentions - a.mentions || b.confidence - a.confidence);
        }

        function buildCandidateSet(payload, nerEntities, excerpt) {
            const map = new Map();
            const add = (surface, kind, aliases = []) => {
                const clean = String(surface || "").trim();
                if (!clean) return;
                const key = normalizeForCompare(clean);
                if (!key || key.length < 1) return;
                const current = map.get(key) || {
                    surface: clean,
                    kind: kind || "unknown",
                    aliases: new Set(),
                    context: ""
                };
                current.kind = current.kind === "unknown" ? kind : current.kind;
                current.aliases.add(clean);
                aliases.forEach((alias) => alias && current.aliases.add(alias));
                map.set(key, current);
            };

            (payload.local_candidates || []).forEach((candidate) => add(candidate.surface, candidate.kind));
            (payload.resolved_entities || []).forEach((entity) => add(entity.surface, entity.kind, entity.aliases || []));
            nerEntities.filter((entry) => entry.label === "PER").forEach((entry) => add(entry.surface, "ner_person"));

            return Array.from(map.values())
                .slice(0, 16)
                .map((entry) => ({
                    surface: entry.surface,
                    kind: entry.kind,
                    aliases: Array.from(entry.aliases),
                    context: collectContext(excerpt, entry.surface)
                }));
        }

        async function classifyEntityTypes(candidates, nerEntities) {
            if (!candidates.length) return [];

            const labelVectors = await getCachedEmbeddings("entity_labels", ENTITY_LABELS.map((entry) => entry.prompt));
            const candidateVectors = await embedTexts(candidates.map((candidate) => {
                return `Entidad: ${candidate.surface}. Tipo heuristico: ${candidate.kind}. Contexto: ${candidate.context || "Sin contexto claro."}`;
            }));

            return candidates.map((candidate, index) => {
                const vector = candidateVectors[index];
                const scores = {};

                ENTITY_LABELS.forEach((label, labelIndex) => {
                    scores[label.kind] = similarityToProbability(dot(vector, labelVectors[labelIndex]));
                });

                if (["speaker", "role", "placeholder", "ner_person", "model_name"].includes(candidate.kind)) {
                    scores.character = clamp01((scores.character || 0) + 0.12);
                }

                const nerSupport = nerEntities.some((entry) => normalizeForCompare(entry.surface) === normalizeForCompare(candidate.surface) && entry.label === "PER");
                if (nerSupport) {
                    scores.character = clamp01((scores.character || 0) + 0.18);
                }

                const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
                const best = sorted[0] || ["unknown", 0];
                const second = sorted[1] || ["unknown", 0];
                return {
                    surface: candidate.surface,
                    aliases: candidate.aliases,
                    kind: candidate.kind,
                    context: candidate.context,
                    predicted: best[0],
                    confidence: round4(clamp01(best[1] + Math.max(0, best[1] - second[1]) * 0.6)),
                    scores: Object.fromEntries(sorted.map(([kind, score]) => [kind, round4(score)]))
                };
            }).sort((a, b) => {
                const aCharacter = a.predicted === "character" ? 1 : 0;
                const bCharacter = b.predicted === "character" ? 1 : 0;
                if (aCharacter !== bCharacter) return bCharacter - aCharacter;
                return b.confidence - a.confidence;
            });
        }

        async function classifyDynamics(payload, excerpt) {
            const labelVectors = await getCachedEmbeddings("dynamic_labels", DYNAMIC_LABELS.map((entry) => entry.prompt));
            const heuristicHints = (payload.signals || [])
                .slice(0, 6)
                .map((signal) => `${signal.kind}: ${signal.fragment}`)
                .join(" ");
            const [sceneVector] = await embedTexts([
                `Texto: ${excerpt}\nSenales heuristicas: ${heuristicHints || "ninguna"}.`
            ]);

            const heuristicCounts = new Map();
            (payload.signals || []).forEach((signal) => {
                heuristicCounts.set(signal.kind, (heuristicCounts.get(signal.kind) || 0) + 1);
            });

            return DYNAMIC_LABELS.map((label, index) => {
                const baseScore = similarityToProbability(dot(sceneVector, labelVectors[index]));
                const heuristicBoost = Math.min(0.18, (heuristicCounts.get(label.kind) || 0) * 0.04);
                return {
                    kind: label.kind,
                    score: round4(clamp01(baseScore + heuristicBoost))
                };
            }).sort((a, b) => b.score - a.score);
        }

        async function getCachedEmbeddings(cacheKey, texts) {
            if (state.embeddingCache.has(cacheKey)) return state.embeddingCache.get(cacheKey);
            const vectors = await embedTexts(texts);
            state.embeddingCache.set(cacheKey, vectors);
            return vectors;
        }

        async function embedTexts(texts) {
            const output = await state.extractor(texts, {
                pooling: "mean",
                normalize: true
            });
            return toMatrix(output);
        }

        function toMatrix(value) {
            if (value && typeof value.tolist === "function") return value.tolist();
            if (Array.isArray(value)) return value;
            if (value && Array.isArray(value.data) && Array.isArray(value.dims)) {
                const [rows, cols] = value.dims;
                if (!rows || !cols) return [value.data.slice()];
                const out = [];
                for (let row = 0; row < rows; row += 1) {
                    out.push(value.data.slice(row * cols, (row + 1) * cols));
                }
                return out;
            }
            return [];
        }

        function splitIntoSegments(text) {
            const clean = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
            if (!clean) return [];

            const lines = clean
                .split(/\n+/)
                .map((line) => line.trim())
                .filter(Boolean);
            const segments = [];
            let buffer = "";
            let offset = 0;
            let cursor = 0;

            lines.forEach((line) => {
                const addition = buffer ? `${buffer} ${line}` : line;
                if (addition.length > 240 && buffer) {
                    segments.push({ text: buffer, offset });
                    cursor = offset + buffer.length;
                    buffer = line;
                    offset = findOffset(clean, line, cursor);
                    return;
                }
                if (!buffer) {
                    offset = findOffset(clean, line, cursor);
                }
                buffer = addition;
            });

            if (buffer) {
                segments.push({ text: buffer, offset });
            }

            return segments.length ? segments : [{ text: clean, offset: 0 }];
        }

        function collectContext(text, surface) {
            const cleanText = String(text || "");
            const cleanSurface = String(surface || "").trim();
            if (!cleanText || !cleanSurface) return excerptTail(cleanText, 220);

            const normalizedSurface = normalizeForCompare(cleanSurface);
            const sentences = cleanText
                .split(/(?<=[.!?])\s+|\n+/)
                .map((sentence) => sentence.trim())
                .filter(Boolean);
            const matched = sentences.filter((sentence) => normalizeForCompare(sentence).includes(normalizedSurface));
            if (matched.length) {
                return matched.slice(0, 2).join(" ");
            }

            const index = normalizeForCompare(cleanText).indexOf(normalizedSurface);
            if (index < 0) return excerptTail(cleanText, 220);
            const start = Math.max(0, index - 90);
            const end = Math.min(cleanText.length, index + cleanSurface.length + 90);
            return cleanText.slice(start, end).trim();
        }

        function buildSummaryNotes(nerEntities, entityTypes, dynamics) {
            const notes = [];
            if (nerEntities.length) {
                notes.push(`NER recupera ${nerEntities.length} entidades agregadas.`);
            } else {
                notes.push("NER no ha recuperado nombres claros en este fragmento.");
            }

            const topCharacters = entityTypes.filter((entry) => entry.predicted === "character").slice(0, 3);
            if (topCharacters.length) {
                notes.push(`Personajes con mas apoyo semantico: ${topCharacters.map((entry) => entry.surface).join(", ")}.`);
            }

            if (dynamics[0]) {
                notes.push(`Dinamica dominante por embeddings: ${dynamics[0].kind}.`);
            }

            return notes;
        }

        function relayProgress(stage, progress) {
            const detail = progress && typeof progress.progress === "number"
                ? `${stage} ${(progress.progress * 100).toFixed(0)}%`
                : `Cargando ${stage}...`;
            postStatus("loading", detail, stage);
        }

        function postStatus(status, detail, stage = "", modelsLoaded = null, backend = "") {
            self.postMessage({
                type: "status",
                status,
                detail,
                stage,
                modelsLoaded,
                backend
            });
        }

        function normalizeNerLabel(label) {
            const value = String(label || "").replace(/^B-/, "").replace(/^I-/, "").toUpperCase();
            if (value === "PERSON") return "PER";
            return value || "MISC";
        }

        function cleanSurface(value) {
            return String(value || "")
                .replace(/^##/, "")
                .replace(/\s+/g, " ")
                .replace(/\s+([,.;:!?])/g, "$1")
                .trim();
        }

        function chooseSurface(current, next) {
            if (!current) return next;
            if (!next) return current;
            return next.length > current.length ? next : current;
        }

        function findOffset(source, fragment, cursor) {
            const safeCursor = Math.max(0, Number(cursor) || 0);
            const index = source.indexOf(fragment, safeCursor);
            return index >= 0 ? index : safeCursor;
        }

        function excerptTail(text, max) {
            return text.length <= max ? text : text.slice(text.length - max);
        }

        function normalizeForCompare(text) {
            return String(text || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();
        }

        function similarityToProbability(value) {
            return clamp01((Number(value) + 1) / 2);
        }

        function dot(a, b) {
            let sum = 0;
            const limit = Math.min(Array.isArray(a) ? a.length : 0, Array.isArray(b) ? b.length : 0);
            for (let index = 0; index < limit; index += 1) {
                sum += Number(a[index] || 0) * Number(b[index] || 0);
            }
            return sum;
        }

        function clamp01(value) {
            return Math.max(0, Math.min(1, Number(value) || 0));
        }

        function round4(value) {
            return Math.round((Number(value) || 0) * 10000) / 10000;
        }
    }

    function pretty(value) {
        return JSON.stringify(value, null, 2);
    }

    function round2(value) {
        return Math.round((Number(value) || 0) * 100) / 100;
    }

    function escapeRegex(value) {
        return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
})();
