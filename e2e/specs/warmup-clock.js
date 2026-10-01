async function runWarmupClockChecks(ctx, { readAssignments, waitForAttributedInspiration }) {
  const assignments = await readAssignments(ctx, ["musa1", "musa2"]);
  const blue = assignments.find(({ team }) => team === 1);
  const red = assignments.find(({ team }) => team === 2);
  ctx.assert(blue && red, "clock regression requires a real Muse in each team");
  const roles = ["writer1", "writer2", "spectator"];
  const day = 86400000;
  const installSkew = (offset) => {
    window.__scribClockSkew = offset;
    const realNow = Date.now.bind(Date);
    Date.now = () => realNow() + window.__scribClockSkew;
  };
  for (const [index, role] of roles.entries()) {
    const offset = [day * 3, -day * 3, day * 365][index];
    await ctx.getPageEntry(role).page.evaluateOnNewDocument(installSkew, offset);
    await ctx.evaluate(role, installSkew, offset);
  }
  await ctx.invoke("control", "mostrar_vista_detonadores");
  await ctx.invoke("control", "pedir_solicitud_calentamiento", "lugares");
  for (const [muse, word] of [[blue, "biblioteca"], [red, "teatro"]]) {
    await ctx.waitForPageFunction(muse.roleName, () => {
      const input = document.querySelector("#calentamiento_input");
      const button = document.querySelector("#calentamiento_enviar");
      return input && button && !input.disabled && !button.disabled && button.getBoundingClientRect().height > 1;
    }, 6000);
    await ctx.sendWarmupWord(muse.roleName, word);
    await ctx.waitForState(`${word} is accepted by the server`, state => (
      state.tutorial.equipos[muse.team].palabras.some(entry => entry.palabra === word)
    ));
  }
  const selector = role => role === "spectator"
    ? "#calentamiento_nube .calentamiento-palabra"
    : "#calentamiento_nube_escritor .calentamiento-palabra";
  const cardState = async (role, word) => ctx.evaluate(role, ({ css, word }) => {
    const card = [...document.querySelectorAll(css)].find(node => node.querySelector(".calentamiento-palabra__texto")?.textContent === word);
    if (!card) return null;
    const style = getComputedStyle(card);
    return {
      delay: parseFloat(card.style.getPropertyValue("--calentamiento-decay-delay")),
      opacity: Number(style.opacity),
      highlighted: card.classList.contains("is-highlighted"),
      rect: { width: card.getBoundingClientRect().width, height: card.getBoundingClientRect().height }
    };
  }, { css: selector(role), word });
  for (const role of roles) {
    for (const [muse, word] of [[blue, "biblioteca"], [red, "teatro"]]) {
      await waitForAttributedInspiration(ctx, role, selector(role), word, [muse.name], `${role} receives ${word} with a skewed clock`);
      // The first detonator also enters with a view transition; do not measure
      // its click box in the frame where the parent is still scale(0).
      const card = await ctx.waitFor(`${role} renders a visible ${word} click box`, async () => {
        const state = await cardState(role, word);
        return state && state.rect.width > 1 && state.rect.height > 1 ? state : false;
      }, 2500);
      ctx.assert(card.opacity > 0.2 && card.delay > -9000 && card.delay <= 0,
        `${role} detonator must remain visible, not instantly faded by its device date`);
    }
  }
  // A clock correction while connected must not send the CSS animation to
  // its end. Force a repaint, as a resize or another Muse delivery would do.
  for (const [index, role] of roles.entries()) {
    const before = await cardState(role, "biblioteca");
    await ctx.evaluate(role, ({ offset, spectator }) => {
      window.__scribClockSkew = offset;
      window.eval(spectator ? "renderizarPalabrasCalentamiento()" : "renderizarPalabrasCalentamientoEscritor()");
    }, { offset: index === 1 ? day * 365 : -day * 365, spectator: role === "spectator" });
    const after = await cardState(role, "biblioteca");
    ctx.assert(Math.abs(after.delay - before.delay) < 1000, `${role} decay must not jump with the wall clock`);
  }
  await ctx.clickWarmupWord("writer1", "biblioteca");
  await ctx.clickWarmupWord("writer2", "teatro");
  await ctx.waitForState("both skewed-clock writers select their Muse detonators", state => (
    state.tutorial.equipos[1].seleccionadas === 1 && state.tutorial.equipos[2].seleccionadas === 1
  ));
  await ctx.evaluate("writer1", () => window.eval("socket.disconnect()"));
  await ctx.getPageEntry("writer1").page.reload({ waitUntil: "domcontentloaded" });
  await ctx.waitForPageFunction("writer1", () => window.eval("typeof socket !== 'undefined' && socket.connected"), 10000);
  await waitForAttributedInspiration(ctx, "writer1", selector("writer1"), "biblioteca", [blue.name], "blue detonator survives reload with an incorrect clock from page startup");
  await ctx.waitFor("reconnected detonator remains selected and visible", async () => {
    const card = await cardState("writer1", "biblioteca");
    return card && card.highlighted && card.opacity > 0.9;
  });
  await ctx.clickWarmupWord("writer1", "biblioteca");
  await ctx.waitForState("blue word restarts normal decay after deselection", state => state.tutorial.equipos[1].seleccionadas === 0);
  await ctx.waitFor("blue deselection is visible on both writers and spectator", async () => {
    const cards = await Promise.all(roles.map(role => cardState(role, "biblioteca")));
    return cards.every(card => card && !card.highlighted && card.opacity > 0.2);
  });
  await ctx.waitForState("server expires unselected detonators despite skewed clocks", state => (
    state.tutorial.equipos[1].palabras.length === 0
    && state.tutorial.equipos[2].palabras.some(word => word.palabra === "teatro" && word.destacada)
  ), 13000);
  for (const role of roles) {
    await ctx.waitFor(`${role} removes the expired blue word but keeps the selected red word`, async () => (
      !(await cardState(role, "biblioteca")) && (await cardState(role, "teatro"))?.highlighted
    ));
  }
}

module.exports = { runWarmupClockChecks };
