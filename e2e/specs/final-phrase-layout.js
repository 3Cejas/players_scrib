const path = require("node:path");

const LONG_PHRASE = "Y entonces comprendieron que todas las puertas del teatro, incluso las que parecían cerradas para siempre, conducían al mismo mar de palabras, donde todavía les esperaba una historia que nadie se había atrevido a contar.";

async function runFinalPhraseLayoutChecks(ctx) {
  for (const role of ["writer1", "writer2"]) {
    await ctx.evaluate(role, (phrase) => {
      window.eval(`frase_final = ${JSON.stringify(phrase)}; terminado = false; partida_global_finalizada = false; modo_actual = "frase final"; asegurarVistaPartidaActivaEscritora();`);
      renderizarObjetivoFraseFinalEscritora();
      window.ScribCompetitionUI.actualizarReloj({
        activo: true, pausado: true, tiempo_restante_segundos: 180
      });
      const editor = document.getElementById("texto");
      editor.contentEditable = "true";
      editor.textContent = Array.from({ length: 35 }, (_, i) => `Línea ${i + 1} de la historia, que sigue visible mientras llega el cierre.`).join("\n");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      window.dispatchEvent(new Event("resize"));
    }, LONG_PHRASE);
  }
  await ctx.evaluate("spectator", (phrase) => {
    window.eval(`frase_final_j1 = ${JSON.stringify(phrase)}; frase_final_j2 = ${JSON.stringify(phrase)}; modo_actual = "frase final"; partida_activa_espectador = true; vista_calentamiento = false; vista_espectador_override = "partida"; vista_espectador_modo_solicitada = "partida"; controlador_transicion_vista_espectador?.cancel(); aplicarModoVistaEspectadorUi("partida"); MODOS["frase final"]({}); actualizarBrandingPartidaEspectador();`);
    window.ScribCompetitionUI.actualizarReloj({
      activo: true, pausado: true, tiempo_restante_segundos: 180
    });
    window.dispatchEvent(new Event("resize"));
  }, LONG_PHRASE);

  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 1280, height: 600 }]) {
    await ctx.getPageEntry("spectator").page.bringToFront();
    await ctx.getPageEntry("spectator").page.setViewport(viewport);
    await ctx.sleep(400);
    const layout = await ctx.evaluate("spectator", () => [1, 2].map((id) => {
      const banner = document.getElementById(`info${id}`);
      const phrase = document.getElementById(`palabra${id}`);
      const column = banner.parentElement;
      const meta = column.querySelector(".spectator-meta-wrap");
      const story = column.querySelector(".spectator-text-shell");
      const r = banner.getBoundingClientRect();
      const p = phrase.getBoundingClientRect();
      const c = column.getBoundingClientRect();
      return {
        id, text: phrase.textContent, height: r.height, bottom: r.bottom,
        phraseBottom: p.bottom, phraseTop: p.top, top: r.top,
        metaBottom: meta.getBoundingClientRect().bottom, columnBottom: c.bottom,
        scroll: banner.scrollHeight - banner.clientHeight,
        phraseScroll: phrase.scrollHeight - phrase.clientHeight,
        viewportHeight: innerHeight, viewportWidth: innerWidth,
        right: r.right, left: r.left, bodyClasses: document.body.className,
        storyHeight: story.getBoundingClientRect().height
      };
    }));
    for (const row of layout) {
      ctx.assert(row.text.includes(LONG_PHRASE), `spectator final phrase must be complete: ${JSON.stringify(row)}`);
      ctx.assert(row.scroll <= 2 && row.phraseScroll <= 2 && row.phraseBottom <= row.bottom + 2,
        `spectator phrase must not be clipped at ${viewport.width}x${viewport.height}: ${JSON.stringify(row)}`);
      ctx.assert(row.bottom <= row.viewportHeight && row.bottom <= row.columnBottom + 2
        && row.top >= row.metaBottom - 2 && row.left >= 0 && row.right <= row.viewportWidth,
      `spectator phrase must fit its column without overlapping metadata: ${JSON.stringify(row)}`);
      ctx.assert(row.storyHeight >= 84, `long phrases must leave several story lines visible: ${JSON.stringify(row)}`);
    }
    await ctx.getPageEntry("spectator").page.screenshot({
      path: path.join(ctx.runArtifactsDir, `final-phrase-spectator-${viewport.width}x${viewport.height}.png`)
    });
  }
  for (const role of ["writer1", "writer2"]) {
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 600 }]) {
      await ctx.getPageEntry(role).page.bringToFront();
      await ctx.getPageEntry(role).page.setViewport(viewport);
      await ctx.evaluate(role, () => window.dispatchEvent(new Event("resize")));
      await ctx.sleep(400);
      const layout = await ctx.evaluate(role, () => {
        const chip = document.querySelector(".objetivo-chip--frase-final");
        const rect = chip.getBoundingClientRect();
        const level = document.querySelector(".info-total")?.getBoundingClientRect();
        return {
          text: chip.textContent, scroll: chip.scrollHeight - chip.clientHeight,
          bottom: rect.bottom, right: rect.right, left: rect.left,
          levelBottom: level?.bottom, viewportHeight: innerHeight, viewportWidth: innerWidth,
          rootStyle: document.getElementById("players_fit_root").getAttribute("style"),
          bodyClasses: document.body.className
        };
      });
      ctx.assert(layout.text.includes(LONG_PHRASE) && layout.scroll <= 2
        && layout.bottom <= layout.viewportHeight && layout.levelBottom <= layout.viewportHeight
        && layout.left >= 0 && layout.right <= layout.viewportWidth,
      `${role} final phrase and level must fit without clipping: ${JSON.stringify(layout)}`);
      await ctx.getPageEntry(role).page.screenshot({
        path: path.join(ctx.runArtifactsDir, `final-phrase-${role}-${viewport.width}x${viewport.height}.png`)
      });
    }
  }
  for (const role of ["musa1", "musa2"]) {
    const mode = await ctx.evaluate(role, () => window.__scribModoActualMusaPreview);
    ctx.assert(mode === "frase final", `${role} must enter the final phrase level`);
  }
}

module.exports = { runFinalPhraseLayoutChecks };
