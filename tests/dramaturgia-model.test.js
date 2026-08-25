const test = require("node:test");
const assert = require("node:assert/strict");

const model = require("../game/dramaturgia/js/model.js");

function event(seq, overrides = {}) {
  return {
    id: `session:${seq}`,
    checkpoint_id: `checkpoint:${seq}`,
    seq,
    ts: 1_000 + seq * 100,
    tipo: "estado",
    titulo: `Estado ${seq}`,
    detalle: "Dato real",
    espacio: "sistema",
    fase: "juego",
    modo: "tertulia",
    causa_ids: [],
    hechos: { seq },
    ...overrides
  };
}

test("dramaturgy store merges late-entry history and ignores duplicate deltas", () => {
  const store = model.createStore({ maxEvents: 20 });
  const inserted = model.applySnapshot(store, {
    schema_version: 1,
    ts: 4_000,
    session: {
      id: "session-a",
      started_at: 1_000,
      last_seq: 3
    },
    eventos: [event(1), event(2), event(3)]
  });

  assert.equal(inserted.length, 3);
  assert.equal(store.sessionId, "session-a");
  assert.equal(store.sessionStartedAt, 1_000);
  assert.equal(store.lastSeq, 3);
  assert.equal(model.insertEvent(store, event(2)), null);
  assert.deepEqual(store.events.map((item) => item.id), [
    "session:1",
    "session:2",
    "session:3"
  ]);
});

test("dramaturgy store resets bounded history when the server session changes", () => {
  const store = model.createStore({ maxEvents: 20 });
  model.applySnapshot(store, {
    session: { id: "session-a", started_at: 1_000 },
    eventos: [event(1)]
  });
  model.applySnapshot(store, {
    session: { id: "session-b", started_at: 8_000 },
    eventos: [event(7, { id: "session-b:7" })]
  });

  assert.equal(store.sessionId, "session-b");
  assert.deepEqual(store.events.map((item) => item.id), ["session-b:7"]);
  assert.equal(store.selectedId, "session-b:7");
});

test("dramaturgy store accepts the server's nested Spanish snapshot aliases", () => {
  const store = model.createStore({ maxEvents: 20 });
  model.applySnapshot(store, {
    schema_version: 1,
    ts: 9_000,
    sesion: {
      id: "session-es",
      inicio_ts: 2_000,
      last_seq: 1
    },
    actual: {
      partida: { modo_actual: "tertulia" },
      nombres: { 1: "Ada" },
      textos: { 1: { plano: "Texto vivo" } },
      estadisticas: {
        players: {
          1: { palabrasTotal: 2, ritmoPpm: 21, pulsacionesTotal: 17 }
        }
      },
      vista_espectador: { modo: "duelo" }
    },
    eventos: [event(1)]
  });

  const summary = model.currentSummary(store.current);
  assert.equal(store.sessionId, "session-es");
  assert.equal(store.sessionStartedAt, 2_000);
  assert.equal(summary.mode, "tertulia");
  assert.equal(summary.spectatorMode, "duelo");
  assert.equal(summary.writer1.nombre, "Ada");
  assert.equal(summary.writer1.texto, "Texto vivo");
  assert.equal(summary.writer1.palabras, 2);
});

test("dramaturgy event normalization keeps semantic fields and removes duplicate causes", () => {
  const normalized = model.normalizeEvent({
    id: "x",
    seq: "9",
    ts: "1200",
    kind: "INSPIRACION",
    title: "Palabra recibida",
    detail: "La musa propone bosque",
    source: { space: "musas", team: 1 },
    phase: "juego",
    mode: "palabras bonus",
    cause_ids: ["a", "a", "", "b"],
    facts: { palabra: "bosque" }
  });

  assert.equal(normalized.seq, 9);
  assert.equal(normalized.checkpoint_id, "");
  assert.equal(normalized.tipo, "inspiracion");
  assert.equal(normalized.espacio, "musas");
  assert.equal(normalized.fase, "juego");
  assert.equal(normalized.modo, "palabras bonus");
  assert.deepEqual(normalized.causa_ids, ["a", "b"]);
  assert.deepEqual(normalized.hechos, { palabra: "bosque" });
});

test("dramaturgy model derives phase from live server state", () => {
  assert.equal(model.phaseFromSnapshot({
    tutorial: { activo: true }
  }), "calentamiento");
  assert.equal(model.phaseFromSnapshot({
    partida: { modo_actual: "letra bendita" }
  }), "juego");
  assert.equal(model.phaseFromSnapshot({
    partida: { fin_del_juego: true }
  }), "representacion");
  assert.equal(model.phaseFromSnapshot({}), "espera");
});

test("dramaturgy graph layout is deterministic and contains only valid causal edges", () => {
  const events = [
    event(1, { id: "mode", tipo: "modo", titulo: "Tertulia" }),
    event(2, { id: "system-state", tipo: "presencias", titulo: "Presencias" }),
    event(3, {
      id: "muse",
      tipo: "inspiracion",
      espacio: "musas",
      titulo: "Una musa inspira",
      causa_ids: ["mode", "missing"]
    }),
    event(4, {
      id: "writer",
      tipo: "texto",
      espacio: "escritxr1",
      titulo: "El texto incorpora la idea",
      causa_ids: ["muse"]
    })
  ].map((item) => model.normalizeEvent(item));

  const first = model.buildGraphLayout(events);
  const second = model.buildGraphLayout(events);
  assert.deepEqual(first, second);
  assert.deepEqual(first.edges.map((edge) => [edge.from, edge.to]), [
    ["mode", "muse"],
    ["muse", "writer"]
  ]);
  assert.ok(first.nodes[1].x > first.nodes[0].x);
  assert.ok(first.nodes[3].x > first.nodes[2].x);
  assert.equal(first.nodes[0].y, first.nodes[1].y);
  assert.ok(first.width >= 980);
  assert.ok(first.height > 700);
});

test("dramaturgy live deltas update real text and stats without creating fake events", () => {
  const store = model.createStore();
  model.applyDelta(store, "texto1", {
    text: "<p>Hola <strong>escena</strong></p>",
    points: "2 palabras"
  });
  model.applyDelta(store, "stats_live_estado", {
    ts: 9_000,
    players: {
      1: {
        nombre: "Ada",
        palabrasTotal: 2,
        ritmoPpm: 42,
        pulsacionesTotal: 18
      }
    }
  });
  model.applyDelta(store, "actualizar_contador_musas", {
    escritxr1: 4,
    escritxr2: 2
  });

  const writer = model.currentWriter(store.current, 1);
  assert.equal(writer.nombre, "Ada");
  assert.equal(writer.texto, "Hola escena");
  assert.equal(writer.palabras, 2);
  assert.equal(writer.ritmo, 42);
  assert.equal(writer.pulsaciones, 18);
  assert.equal(writer.musas, 4);
  assert.equal(store.events.length, 0);
});

test("dramaturgy mode countdown survives journal resyncs and advances locally", () => {
  const originalNow = Date.now;
  let now = 10_000;
  Date.now = () => now;
  try {
    const store = model.createStore();
    model.applyDelta(store, "temp_modos", {
      modo_actual: "tertulia",
      modo_seq: 4,
      tiempo_restante_modo_segundos: 30
    });
    now = 15_000;
    assert.equal(model.currentSummary(store.current).remainingSeconds, 25);

    model.applySnapshot(store, {
      ts: now,
      session: { id: "session-a", started_at: 1_000 },
      partida: { modo_actual: "tertulia", modo_seq: 4 },
      eventos: []
    });
    assert.equal(model.currentSummary(store.current).remainingSeconds, 25);
  } finally {
    Date.now = originalNow;
  }
});

test("dramaturgy HTML stripping never returns executable markup", () => {
  const plain = model.stripHtml("<img src=x onerror=alert(1)><script>alert(2)</script><p>Texto &amp; escena</p>");
  assert.equal(plain, "Texto & escena");
  assert.doesNotMatch(plain, /<|>|script|onerror/i);
});

function historicalCheckpoint(id, seq, eventData, overrides = {}) {
  return {
    id,
    seq,
    seqEnd: seq,
    ts: 10_000 + seq * 100,
    complete: true,
    roles: {
      control: `${id}:control`,
      writer1: `${id}:writer`,
      musa1: `${id}:musa`,
      spectator: `${id}:spectator`,
      actor1: `${id}:actor`
    },
    previousCheckpointIds: [],
    events: [{
      id: `${id}:event`,
      seq,
      ts: 10_000 + seq * 100,
      tipo: "estado",
      fase: "juego",
      modo: "",
      hechos: {},
      ...eventData
    }],
    ...overrides
  };
}

test("historical score exposes exactly five canonical single-screen rows", () => {
  assert.deepEqual(
    model.HISTORY_ROLE_ROWS.map(({ label, screenId }) => [label, screenId]),
    [
      ["Control", "control"],
      ["Escritxr", "writer1"],
      ["Musa", "musa1"],
      ["Espectador", "spectator"],
      ["Intérprete", "actor1"]
    ]
  );
  assert.equal(model.HISTORY_ROLE_ROWS.length, 5);
  assert.ok(model.HISTORY_ROLE_ROWS.every((row) => !/Jurado|\b[12]\b/.test(row.label)));
  assert.ok(Object.isFrozen(model.HISTORY_ROLE_ROWS));
  assert.ok(model.HISTORY_ROLE_ROWS.every(Object.isFrozen));
});

test("show journey declares open and closed warmups, disadvantage feedback, stable levels and representation in order", () => {
  assert.deepEqual(
    model.SHOW_JOURNEY.map(({ id, label }) => [id, label]),
    [
      ["warmup-lugares-open", "Lugares · abierto"],
      ["warmup-lugares", "Lugares · cerrado"],
      ["warmup-acciones-open", "Acciones · abierto"],
      ["warmup-acciones", "Acciones · cerrado"],
      ["warmup-frase-final-open", "Frase final · abierto"],
      ["warmup-frase-final", "Frase final · cerrado"],
      ["level-letra-bendita-feedback", "Desventaja inicial"],
      ["level-letra-bendita", "Letra bendita"],
      ["competition-letra-bendita", "Marcador · Letra bendita"],
      ["level-letra-prohibida-feedback", "Desventaja inicial"],
      ["level-letra-prohibida", "Letra maldita"],
      ["competition-letra-prohibida", "Marcador · Letra maldita"],
      ["level-tertulia", "Tertulia"],
      ["level-palabras-bonus-feedback", "Desventaja inicial"],
      ["level-palabras-bonus", "Palabras benditas"],
      ["competition-palabras-bonus", "Marcador · Palabras benditas"],
      ["level-palabras-prohibidas-feedback", "Desventaja inicial"],
      ["level-palabras-prohibidas", "Palabras malditas"],
      ["competition-palabras-prohibidas", "Marcador · Palabras malditas"],
      ["level-frase-final", "Frase final"],
      ["representation-preparation", "Preparación"],
      ["representation-projection", "Proyección"],
      ["representation-final", "Final"]
    ]
  );
  assert.deepEqual(
    model.SHOW_JOURNEY
      .filter(({ kind, moment }) => kind === "level" && moment === "stable")
      .map(({ mode }) => mode),
    [
      "letra bendita",
      "letra prohibida",
      "tertulia",
      "palabras bonus",
      "palabras prohibidas",
      "frase final"
    ]
  );
  assert.deepEqual(
    model.SHOW_JOURNEY
      .filter(({ kind, moment }) => kind === "level" && moment === "feedback")
      .map(({ mode }) => mode),
    ["letra bendita", "letra prohibida", "palabras bonus", "palabras prohibidas"]
  );
  assert.deepEqual(
    model.SHOW_JOURNEY.filter(({ kind }) => kind === "competition").map(({ mode }) => mode),
    ["letra bendita", "letra prohibida", "palabras bonus", "palabras prohibidas"]
  );
  assert.equal(model.SHOW_JOURNEY.some(({ kind }) => kind === "voting"), false);
});

test("show score keeps every expected column pending instead of inventing snapshots", () => {
  const score = model.buildShowScore([]);

  assert.equal(score.rows, model.HISTORY_ROLE_ROWS);
  assert.equal(score.journey, model.SHOW_JOURNEY);
  assert.equal(score.columns.length, 23);
  assert.ok(score.columns.every((column) => (
    column.expected && column.status === "pending" && column.checkpoint === null
  )));
  assert.deepEqual(score.coverage, {
    expected: 23,
    captured: 0,
    ready: 0,
    partial: 0,
    pending: 23,
    complete: false
  });
});

test("show score matches real event shapes and retains transition checkpoints", () => {
  const openWarmupTeams = {
    1: { estado: "jugando", intentos: 1, aciertos: 1, bloqueado: false, final: null },
    2: { estado: "jugando", intentos: 1, aciertos: 1, bloqueado: false, final: null }
  };
  const closedWarmupTeams = {
    1: {
      estado: "completado",
      intentos: 3,
      aciertos: 3,
      bloqueado: true,
      final: { valor: "respuesta azul" }
    },
    2: {
      estado: "completado",
      intentos: 3,
      aciertos: 3,
      bloqueado: true,
      final: { valor: "respuesta roja" }
    }
  };
  const activeDisadvantage = (player, putada) => ({
    activas: [{ player, putada, pausada: false, duracion_ms: 5_000 }]
  });
  const checkpoints = [
    historicalCheckpoint("warm-lugares-open", 1, {
      tipo: "calentamiento",
      fase: "calentamiento",
      hechos: { activo: true, vista: true, solicitud: "lugares", equipos: openWarmupTeams }
    }),
    historicalCheckpoint("warm-lugares", 2, {
      tipo: "calentamiento",
      fase: "calentamiento",
      hechos: { activo: true, vista: true, solicitud: "lugares", equipos: closedWarmupTeams }
    }),
    historicalCheckpoint("warm-acciones-open", 3, {
      tipo: "calentamiento",
      fase: "calentamiento",
      hechos: { activo: true, vista: true, solicitud: "acciones", equipos: openWarmupTeams }
    }),
    historicalCheckpoint("warm-acciones", 4, {
      tipo: "calentamiento",
      fase: "calentamiento",
      hechos: { activo: true, vista: true, solicitud: "acciones", equipos: closedWarmupTeams }
    }),
    historicalCheckpoint("warm-frase-open", 5, {
      tipo: "calentamiento",
      fase: "calentamiento",
      hechos: { activo: true, vista: true, solicitud: "frase_final", equipos: openWarmupTeams }
    }),
    historicalCheckpoint("warm-frase", 6, {
      tipo: "calentamiento",
      fase: "calentamiento",
      hechos: { activo: true, vista: true, solicitud: "frase_final", equipos: closedWarmupTeams }
    }),
    historicalCheckpoint("feedback-bendita", 7, {
      tipo: "desventaja",
      titulo: "Desventaja activa",
      modo: "letra bendita",
      hechos: activeDisadvantage(1, "⚡")
    }),
    historicalCheckpoint("level-bendita", 8, {
      tipo: "modo",
      modo: "letra bendita",
      hechos: { modo: "letra bendita" }
    }),
    historicalCheckpoint("competition-bendita", 9, {
      tipo: "competicion_ronda",
      titulo: "Competición · letra bendita",
      modo: "letra bendita",
      hechos: { activa: true, modo: "letra bendita", marcador: { 1: 12, 2: 9 }, lider: 1 }
    }),
    historicalCheckpoint("feedback-prohibida", 10, {
      tipo: "desventaja",
      titulo: "Desventaja activa",
      modo: "letra prohibida",
      hechos: activeDisadvantage(2, "🌪️")
    }),
    historicalCheckpoint("level-prohibida", 11, {
      tipo: "modo",
      modo: "letra prohibida",
      hechos: { modo: "letra prohibida" }
    }),
    historicalCheckpoint("competition-prohibida", 12, {
      tipo: "competicion_ronda",
      titulo: "Competición · letra prohibida",
      modo: "letra prohibida",
      hechos: { activa: true, modo: "letra prohibida", marcador: { 1: -2, 2: -1 }, lider: 2 }
    }),
    historicalCheckpoint("level-tertulia", 13, {
      tipo: "modo",
      modo: "tertulia",
      hechos: { modo: "tertulia" }
    }),
    historicalCheckpoint("level-close", 14, {
      tipo: "modo",
      modo: "",
      hechos: { modo_anterior: "tertulia" }
    }),
    historicalCheckpoint("feedback-bonus", 15, {
      tipo: "desventaja",
      titulo: "Desventaja activa",
      modo: "palabras bonus",
      hechos: activeDisadvantage(1, "⚡")
    }),
    historicalCheckpoint("level-bonus", 16, {
      tipo: "modo",
      modo: "palabras bonus",
      hechos: { modo: "palabras bonus" }
    }),
    historicalCheckpoint("competition-bonus", 17, {
      tipo: "competicion_ronda",
      titulo: "Competición · palabras bonus",
      modo: "palabras bonus",
      hechos: { activa: true, modo: "palabras bonus", marcador: { 1: 8, 2: 6 }, lider: 1 }
    }),
    historicalCheckpoint("feedback-malditas", 18, {
      tipo: "desventaja",
      titulo: "Desventaja activa",
      modo: "palabras prohibidas",
      hechos: activeDisadvantage(2, "🙃")
    }),
    historicalCheckpoint("level-malditas", 19, {
      tipo: "modo",
      modo: "palabras prohibidas",
      hechos: { modo: "palabras prohibidas" }
    }),
    historicalCheckpoint("competition-malditas", 20, {
      tipo: "competicion_ronda",
      titulo: "Competición · palabras prohibidas",
      modo: "palabras prohibidas",
      hechos: { activa: true, modo: "palabras prohibidas", marcador: { 1: -3, 2: -1 }, lider: 2 }
    }),
    historicalCheckpoint("level-frase", 21, {
      tipo: "modo",
      modo: "frase final",
      hechos: { modo: "frase final" }
    }),
    historicalCheckpoint("representation-ready", 22, {
      tipo: "fase",
      fase: "representacion",
      hechos: { fase: "representacion" }
    }),
    historicalCheckpoint("representation-play", 23, {
      tipo: "teleprompter",
      fase: "representacion",
      hechos: { visible: true, reproduciendo: true }
    }),
    historicalCheckpoint("representation-final", 24, {
      tipo: "vista_espectador",
      fase: "representacion",
      hechos: { modo: "creditos" }
    })
  ];

  const score = model.buildShowScore([...checkpoints].reverse());
  assert.deepEqual(
    score.expectedColumns.map((column) => column.checkpoint && column.checkpoint.id),
    [
      "warm-lugares-open",
      "warm-lugares",
      "warm-acciones-open",
      "warm-acciones",
      "warm-frase-open",
      "warm-frase",
      "feedback-bendita",
      "level-bendita",
      "competition-bendita",
      "feedback-prohibida",
      "level-prohibida",
      "competition-prohibida",
      "level-tertulia",
      "feedback-bonus",
      "level-bonus",
      "competition-bonus",
      "feedback-malditas",
      "level-malditas",
      "competition-malditas",
      "level-frase",
      "representation-ready",
      "representation-play",
      "representation-final"
    ]
  );
  assert.equal(score.coverage.complete, true);
  assert.deepEqual(score.coverage, {
    expected: 23,
    captured: 23,
    ready: 23,
    partial: 0,
    pending: 0,
    complete: true
  });

  const visible = score.columns.map((column) => [column.kind, column.label, column.checkpoint?.id]);
  const competitionIndex = visible.findIndex(([, , id]) => id === "competition-bendita");
  const blessedFeedbackIndex = visible.findIndex(([, , id]) => id === "feedback-bendita");
  const blessedIndex = visible.findIndex(([, , id]) => id === "level-bendita");
  const prohibitedFeedbackIndex = visible.findIndex(([, , id]) => id === "feedback-prohibida");
  const prohibitedIndex = visible.findIndex(([, , id]) => id === "level-prohibida");
  assert.deepEqual(visible[competitionIndex].slice(0, 2), ["competition", "Marcador · Letra bendita"]);
  assert.equal(score.columns.filter((column) => column.kind === "voting").length, 0);
  assert.ok(
    blessedFeedbackIndex < blessedIndex
    && blessedIndex < competitionIndex
    && competitionIndex < prohibitedFeedbackIndex
    && prohibitedFeedbackIndex < prohibitedIndex
  );
  assert.deepEqual(
    score.expectedColumns
      .filter(({ moment }) => moment === "feedback")
      .map(({ checkpoint }) => checkpoint && checkpoint.id),
    ["feedback-bendita", "feedback-prohibida", "feedback-bonus", "feedback-malditas"]
  );
  assert.deepEqual(
    score.expectedColumns
      .filter(({ kind, moment }) => kind === "level" && moment === "stable")
      .map(({ checkpoint }) => checkpoint && checkpoint.id),
    [
      "level-bendita",
      "level-prohibida",
      "level-tertulia",
      "level-bonus",
      "level-malditas",
      "level-frase"
    ]
  );

  const closeIndex = visible.findIndex(([, , id]) => id === "level-close");
  const tertuliaIndex = visible.findIndex(([, , id]) => id === "level-tertulia");
  const bonusIndex = visible.findIndex(([, , id]) => id === "level-bonus");
  assert.deepEqual(visible[closeIndex].slice(0, 2), ["transition", "Cierre de nivel"]);
  assert.ok(tertuliaIndex < closeIndex && closeIndex < bonusIndex);
});

test("show score no longer reserves voting columns and expects four competition markers", () => {
  const child = historicalCheckpoint("vote-child", 1, {
    tipo: "votacion",
    titulo: "Votación finalizada",
    hechos: { activa: false }
  }, {
    previousCheckpointIds: ["vote-parent"]
  });
  const parent = historicalCheckpoint("vote-parent", 2, {
    tipo: "votacion",
    titulo: "Votación iniciada",
    hechos: { activa: true }
  });
  delete parent.roles.actor1;

  const score = model.buildShowScore([child, parent]);
  const voting = score.expectedColumns.filter((column) => column.kind === "voting");
  const competition = score.expectedColumns.filter((column) => column.kind === "competition");
  assert.equal(voting.length, 0);
  assert.equal(competition.length, 4);
  assert.ok(competition.every((column) => column.status === "pending"));
  assert.equal(score.columns.filter((column) => !column.expected && column.kind === "voting").length, 0);
  assert.deepEqual(score.unplacedCheckpoints.map(({ id }) => id), ["vote-parent", "vote-child"]);
});
