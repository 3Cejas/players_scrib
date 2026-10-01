async function runWriterNameLifecycleChecks(ctx, {
  startGame,
  configure,
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
  await configure();
  await ctx.invoke("control", "activarSeccionControl", "juego");
  await startGame();
  await checkStatsNames("after countdown");
  await checkLabels("after countdown", true);

  // A new connection broadcasts the authoritative names to every existing role.
  await openRoles(["jury"]);
  await ctx.evaluate("control", () => window.eval("socket.emit('pedir_estado_control')"));
  await checkLabels("after an unrelated role connects", true);
  for (const role of ["spectator", "writer1", "control"]) {
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

  ctx.getPageEntry("control").page.once("dialog", (dialog) => dialog.accept());
  await ctx.invoke("control", "nueva_partida");
  await ctx.waitForPageFunction("control", () => (
    document.querySelector("#boton_nueva_partida")?.dataset.pending === "0"
  ), 10000);
  await ctx.evaluate("control", () => window.eval("socket.emit('pedir_estado_control')"));
  await checkStatsNames("after Nueva partida");
  await checkLabels("after Nueva partida");
  await configure();
  await ctx.invoke("control", "activarSeccionControl", "juego");
  await startGame();
  await openRoles(["dramaturgia"]);
  await checkStatsNames("second match");
  await checkLabels("second match with a new connection");
}

module.exports = { runWriterNameLifecycleChecks };
