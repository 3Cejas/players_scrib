async function runDramaturgiaLiveCursorChecks(ctx, startGame) {
  await ctx.waitForPageFunction("dramaturgia", () => (
    window.scribDramaturgia?.socket?.connected
    && document.querySelector(".show-score__grid")
  ), 15000);
  const waitMoment = async (...ids) => {
    await ctx.waitForPageFunction("dramaturgia", expected => {
      const active = [...document.querySelectorAll(".show-score__milestone.is-current")]
        .map(node => node.dataset.milestoneId);
      return active.length === expected.length && expected.every(id => active.includes(id));
    }, 10000, ids);
    const state = await ctx.evaluate("dramaturgia", () => ({
      cells: document.querySelectorAll(".show-score__cell.is-current").length,
      markers: document.querySelectorAll('.show-score__milestone[aria-current="step"]').length
    }));
    ctx.assert(state.cells === ids.length * 5, "the active column must illuminate every role row");
    ctx.assert(state.markers === ids.length, "live milestones must expose the current step accessibly");
  };
  await ctx.invoke("control", "mostrar_vista_detonadores");
  for (const [request, id] of [
    ["lugares", "warmup-lugares-open"],
    ["acciones", "warmup-acciones-open"],
    ["frase_final", "warmup-frase-final-open"]
  ]) {
    await ctx.invoke("control", "pedir_solicitud_calentamiento", request);
    await waitMoment(id);
  }
  await startGame();
  await ctx.setWriterText("writer1", "Historia para la representación.\nAquí termina la escena.");
  await ctx.waitForText("control", "#texto", text => text.includes("Historia para la representación"), "writer story reaches control");
  for (const [mode, id] of [
    ["palabras bonus", "level-palabras-bonus"],
    ["letra bendita", "level-letra-bendita"],
    ["tertulia", "level-tertulia"],
    ["letra prohibida", "level-letra-prohibida"],
    ["palabras prohibidas", "level-palabras-prohibidas"],
    ["frase final", "level-frase-final"]
  ]) {
    await ctx.emitHook("scrib_test:force_mode", { mode, letra: "A" });
    await waitMoment(id);
  }
  await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
  await ctx.emitHook("scrib_test:force_vote", { team: 1, opciones: ["⚡"], duracion_ms: 30000 });
  await waitMoment("competition-palabras-bonus");
  await ctx.emitHook("scrib_test:force_vote", { active: false, emitir_resultado: false });
  await waitMoment("level-palabras-bonus");
  await ctx.emitHook("scrib_test:force_vote", { team: 1, opciones: ["⚡"], duracion_ms: 30000 });
  await ctx.emitHook("scrib_test:force_vote", { active: false, seleccion: "⚡" });
  await waitMoment("level-palabras-bonus-feedback");
  await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
  await waitMoment("level-palabras-bonus");

  await ctx.evaluate("dramaturgia", () => {
    window.scribDramaturgia.setPhaseFilter("calentamiento");
  });
  await ctx.waitForText("dramaturgia", "#dramaturgia_map_live_label", text => text.includes("Fuera del filtro"), "a hidden live column is explained");
  await ctx.click("dramaturgia", "#dramaturgia_map_current");
  await waitMoment("level-palabras-bonus");
  await ctx.waitForPageFunction("dramaturgia", () => {
    const shell = document.querySelector(".show-score").getBoundingClientRect();
    const column = document.querySelector(".show-score__milestone.is-current").getBoundingClientRect();
    return column.left > shell.left && column.right < shell.right;
  }, 6000);
  await ctx.getPageEntry("dramaturgia").page.screenshot({ path: `${ctx.runArtifactsDir}/dramaturgia-live-level.png`, fullPage: true });
  await ctx.evaluate("dramaturgia", () => {
    window.scribDramaturgia.socket.io.opts.reconnection = false;
    window.scribDramaturgia.socket.disconnect();
  });
  await ctx.waitForText("dramaturgia", "#dramaturgia_map_live_signal", text => text === "ÚLTIMO ESTADO", "disconnected diagram is visibly frozen");
  await ctx.evaluate("dramaturgia", () => window.scribDramaturgia.socket.connect());
  await ctx.waitForText("dramaturgia", "#dramaturgia_map_live_signal", text => text === "EN DIRECTO", "reconnected diagram returns live");
  await waitMoment("level-palabras-bonus");
  await ctx.invoke("control", "fin_partida_global");
  await waitMoment("representation-preparation");
  await ctx.invoke("control", "toggleTeleprompter");
  await ctx.invoke("control", "teleprompterCargarTexto", 1);
  await waitMoment("representation-projection");
  await ctx.invoke("control", "mostrarCreditosEspectador");
  await waitMoment("representation-final");
  await ctx.emitHook("scrib_test:reset", {});
  await waitMoment();
}

module.exports = { runDramaturgiaLiveCursorChecks };
