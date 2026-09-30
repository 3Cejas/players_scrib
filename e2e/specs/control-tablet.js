const path = require("node:path");

const TABLET_SIZES = [
  [768, 1024], [1024, 768], [820, 1180], [1180, 820],
  [800, 1280], [1280, 800], [600, 960], [1366, 1024]
];

async function runControlTabletChecks(ctx) {
  const page = ctx.getPageEntry("control").page;
  const pageErrors = [];
  const onPageError = error => pageErrors.push(error.message);
  page.on("pageerror", onPageError);

  const tap = async selector => {
    const element = await page.waitForSelector(selector, { visible: true });
    await element.evaluate(node => node.scrollIntoView({ block: "center", inline: "center" }));
    await ctx.sleep(300);
    await element.tap();
    await ctx.sleep(300);
  };
  const measure = async () => page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect();
    const header = rect(".remote-status-bar");
    const writers = rect("#contenedor");
    const controls = rect("#panel_controles");
    const params = rect("#panel_parametros");
    const visible = node => node.getClientRects().length && getComputedStyle(node).visibility !== "hidden";
    const describe = node => {
      const r = node.getBoundingClientRect();
      return { id: node.id || node.className, width: r.width, height: r.height,
        clipped: node.scrollWidth > node.clientWidth + 2 };
    };
    return {
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      headerContainsCards: [...document.querySelectorAll(".remote-status-bar > div")]
        .every(node => node.getBoundingClientRect().bottom <= header.bottom + 1),
      headerOverlapsWriters: header.bottom > writers.top + 1,
      paramsBelowControls: params.top >= controls.bottom - 1,
      mainControls: [...document.querySelectorAll(".control-group:not(.is-collapsed) .control-group-buttons > .btn")]
        .filter(visible).map(describe),
      touchControls: [...document.querySelectorAll(".spinner-button,.writer-restart-btn,.remote-restart-btn,.control-language-option,.frase_final,.tp-btn,.writer-card .nombre,.credito-input,.credito-textarea,#boton_borrar_texto_guardado,#videotutorial_intervalo,.videotutorial-control__button--play")]
        .filter(visible).map(describe),
      tabs: [...document.querySelectorAll("[data-control-tab]")].map(describe),
      activeTab: document.querySelector('[data-control-tab][aria-selected="true"]')?.dataset.controlTab
    };
  });
  const assertLayout = async label => {
    const info = await measure();
    ctx.assert(!info.horizontalOverflow, `${label}: no page-wide horizontal overflow`);
    ctx.assert(info.headerContainsCards, `${label}: every connection stays inside the header`);
    ctx.assert(!info.headerOverlapsWriters, `${label}: header must not overlap writers`);
    ctx.assert(info.paramsBelowControls, `${label}: parameters must not squeeze the actions`);
    for (const button of [...info.mainControls, ...info.touchControls]) {
      ctx.assert(button.height >= 44 && button.width >= 44,
        `${label}: ${button.id} needs a 44px touch target, got ${button.width}x${button.height}`);
    }
    for (const tab of info.tabs) {
      ctx.assert(tab.height >= 44 && tab.width < 300 && !tab.clipped,
        `${label}: ${tab.id} must remain readable and compact`);
    }
    return info;
  };

  try {
    for (const [width, height] of TABLET_SIZES) {
      const label = `${width}x${height}`;
      // Rotate the same connected page, not a new page for each resolution.
      await page.setViewport({ width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
      await ctx.sleep(450);
      await page.waitForFunction(() => document.body.dataset.controlAccess === "authorized");
      await ctx.invoke("control", "setPanelParametrosColapsadoControl", false);
      await tap('[data-control-tab="juego"]');
      await assertLayout(label);

      const value = await page.$eval("#duracion_minutos", node => Number(node.value));
      await tap('button[onclick="cambiarValor(\'duracion_minutos\', 1)"]');
      ctx.assert(await page.$eval("#duracion_minutos", node => Number(node.value)) === value + 1,
        `${label}: parameter responds to a real touch`);
      await tap('button[onclick="cambiarValor(\'duracion_minutos\', -1)"]');
      await tap("#boton_colapsar_parametros");
      ctx.assert(await page.$eval("#boton_colapsar_parametros", node => node.getAttribute("aria-expanded")) === "false",
        `${label}: parameters collapse by touch`);
      await assertLayout(`${label} collapsed`);
      if (width === 768 || width === 1024) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(ctx.runArtifactsDir, `control-tablet-${label}.png`), fullPage: true });
      }

      for (const section of ["tutorial", "detonadores", "representacion", "deliberacion", "final", "asistencia", "juego"]) {
        await tap(`[data-control-tab="${section}"]`);
        const info = await assertLayout(`${label} ${section}`);
        ctx.assert(info.activeTab === section, `${label}: touch selects ${section}`);
      }

      await tap('[data-control-tab="representacion"]');
      await tap("#boton_teleprompter");
      await assertLayout(`${label} teleprompter`);
      await tap("#teleprompter_cargar_j1");
      await ctx.waitFor("tablet teleprompter loaded", async () => ctx.evaluate("control", () =>
        window.eval("teleprompter_state.visible && teleprompter_state.source === 1 && teleprompter_state.text.includes('Historia de prueba para tablet')")));
      const target = await page.$("#tp_r2");
      await target.evaluate(node => node.scrollIntoView({ block: "center" }));
      await ctx.sleep(300);
      const box = await target.boundingBox();
      const before = await page.$eval("#teleprompter_font_size", node => Number(node.textContent));
      await page.touchscreen.touchStart(box.x + box.width / 2, box.y + box.height / 2);
      try { await ctx.sleep(550); } finally { await page.touchscreen.touchEnd(); }
      await ctx.sleep(200);
      const after = await page.$eval("#teleprompter_font_size", node => Number(node.textContent));
      ctx.assert(after > before, `${label}: holding R2 increases the font`);
      await ctx.sleep(350);
      ctx.assert(await page.$eval("#teleprompter_font_size", node => Number(node.textContent)) === after,
        `${label}: releasing R2 stops the hold`);
      await tap("#boton_volver_representacion_teleprompter");

      await tap('[data-control-tab="final"]');
      await tap("#boton_editar_creditos");
      await assertLayout(`${label} credits`);
      await tap("#credito_dramaturgia");
      await page.$eval("#credito_dramaturgia", node => { node.value = ""; });
      await page.type("#credito_dramaturgia", "PRUEBA TABLET CON ESPACIOS");
      await ctx.sleep(650);
      ctx.assert(await page.$eval("#credito_dramaturgia", node => node.value) === "PRUEBA TABLET CON ESPACIOS",
        `${label}: credits preserve typed spaces`);
      await tap("#boton_volver_final_creditos");
    }

    await page.setViewport({ width: 1920, height: 1080, isMobile: false, hasTouch: false });
    await ctx.sleep(450);
    await page.waitForFunction(() => document.body.dataset.controlAccess === "authorized");
    await ctx.invoke("control", "setPanelParametrosColapsadoControl", false);
    const desktop = await page.evaluate(() => {
      const actions = document.querySelector("#panel_controles").getBoundingClientRect();
      const params = document.querySelector("#panel_parametros").getBoundingClientRect();
      return { sideBySide: params.left >= actions.right - 1,
        spinnerHeight: document.querySelector(".spinner-button").getBoundingClientRect().height };
    });
    ctx.assert(desktop.sideBySide && desktop.spinnerHeight < 44,
      "desktop must keep its compact, side-by-side layout");
    ctx.assert(pageErrors.length === 0, `tablet must not produce JS errors: ${pageErrors.join("; ")}`);
  } finally {
    page.off("pageerror", onPageError);
  }
}

module.exports = { runControlTabletChecks };
