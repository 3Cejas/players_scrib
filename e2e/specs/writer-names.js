async function runWriterNameLifecycleChecks(ctx, {
  startGame,
  openRoles,
  readMuseAssignments
}) {
  const names = { 1: "ÁNGELA BUENO", 2: "PABLO PINEÑO" };
  const labels = [
    { role: "control", selector: "#nombre", team: 1 },
    { role: "control", selector: "#nombre1", team: 2 },
    { role: "spectator", selector: "#nombre", team: 1 },
    { role: "spectator", selector: "#nombre1", team: 2 },
    { role: "writer1", selector: "#nombre", team: 1 },
    { role: "writer2", selector: "#nombre", team: 2 },
    { role: "actor1", selector: "#nombre", team: 1 },
    { role: "actor2", selector: "#nombre", team: 2 }
  ];
  const museLabels = (await readMuseAssignments()).map(({ roleName, team }) => ({
    role: roleName, selector: "#nombre", team
  }));

  const checkLabels = async (phase, includeMuses = false) => {
    for (const { role, selector, team } of [...labels, ...(includeMuses ? museLabels : [])]) {
      await ctx.waitFor(
        `${phase}: ${role} keeps writer ${team}'s configured name`,
        () => ctx.evaluate(role, ({ css, expected }) => (
          document.querySelector(css)?.value === expected
        ), { css: selector, expected: names[team] }),
        8000
      );
    }
  };
  const checkStatsNames = (phase) => ctx.waitForState(
    `${phase}: authoritative stats retain both writer names`,
    (state) => state.stats.players[1].nombre === names[1]
      && state.stats.players[2].nombre === names[2],
    8000
  );
  const startNamedMatch = async () => {
    // Restore both phrases together and wait for their authoritative echo.
    // Sequential fixture input events can otherwise receive a stale state
    // between the two fields and open the missing-phrase alert on restart.
    await ctx.evaluate("control", () => new Promise((resolve, reject) => {
      const pageSocket = window.eval("socket");
      const phrases = { 1: "cierre azul e2e", 2: "cierre rojo e2e" };
      const finish = (error) => {
        clearTimeout(timer);
        pageSocket.off("control_estado", onState);
        if (error) reject(error);
        else resolve();
      };
      const onState = (state) => {
        if (state.frases_finales?.[1] === phrases[1]
          && state.frases_finales?.[2] === phrases[2]) finish();
      };
      const timer = setTimeout(() => finish(new Error("Final phrase fixture was not confirmed")), 8000);
      pageSocket.on("control_estado", onState);
      document.querySelector("#frase_final_j1").value = phrases[1];
      document.querySelector("#frase_final_j2").value = phrases[2];
      window.emitirEstadoControlPersistente({ inmediato: true });
    }));
    await startGame();
  };
  const reloadConnectedRole = async (role) => {
    await ctx.evaluate(role, () => window.eval("socket.disconnect()"));
    await ctx.getPageEntry(role).page.reload({ waitUntil: "domcontentloaded" });
    await ctx.waitForPageFunction(role, () => (
      window.eval("typeof socket !== 'undefined' && socket.connected")
    ), 12000);
  };

  await ctx.fillValue("control", "#nombre", names[1]);
  await ctx.fillValue("control", "#nombre1", names[2]);
  await checkLabels("before start", true);
  await ctx.invoke("control", "activarSeccionControl", "juego");
  await startNamedMatch();
  await checkStatsNames("after countdown");
  await checkLabels("after countdown", true);

  // A new connection broadcasts the authoritative names to every existing role.
  await openRoles(["jury"]);
  await ctx.evaluate("control", () => window.eval("socket.emit('pedir_estado_control')"));
  await checkLabels("after an unrelated role connects", true);
  for (const role of ["spectator", "writer1"]) {
    await reloadConnectedRole(role);
    await checkLabels(`after reloading ${role}`, true);
  }

  await ctx.invoke("control", "fin_partida_global");
  await ctx.waitForState("match ended", (state) => state.partida.fin_del_juego, 8000);
  await checkStatsNames("after end");
  await checkLabels("after end", true);

  await ctx.invoke("control", "limpiar");
  await ctx.waitForState("match cleared", (state) => (
    !state.partida.modo_actual && !state.textos[1].plano && !state.textos[2].plano
  ), 8000);
  await checkStatsNames("after Limpiar");
  await checkLabels("after Limpiar", true);

  // Exercise the real new-match channel without a native confirmation modal,
  // which can suspend the page and its Socket.IO heartbeat in headless runs.
  await ctx.evaluate("control", () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("New match was not confirmed")), 8000);
    window.eval("socket").emit("nueva_partida", {}, (response) => {
      clearTimeout(timer);
      if (response?.ok !== true) reject(new Error("New match was rejected"));
      else resolve();
    });
  }));
  await ctx.evaluate("control", () => window.eval("socket.emit('pedir_estado_control')"));
  await checkStatsNames("after Nueva partida");
  await checkLabels("after Nueva partida");
  await ctx.closeRole("control");
  await openRoles(["control"]);
  await checkLabels("after reconnecting Control for the new match");
  await ctx.invoke("control", "activarSeccionControl", "juego");
  await startNamedMatch();
  await ctx.closeRole("jury");
  await openRoles(["jury"]);
  await ctx.waitForPageFunction("jury", () => (
    window.eval("typeof socket !== 'undefined' && socket.connected")
  ), 12000);
  await checkStatsNames("second match");
  await checkLabels("second match with a new connection");
}

module.exports = { runWriterNameLifecycleChecks };
