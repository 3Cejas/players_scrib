const path = require("node:path");

async function runMuseOptionsChecks(ctx) {
    const role = "musa1";
    const page = ctx.getPageEntry(role).page;
    await ctx.getPageEntry("musa2").page.setViewport({ width: 1366, height: 768 });
    const read = name => ctx.evaluate(name, () => ({
        name: window.nombre_musa, client: window.musa_client_id, team: window.eval("player"),
        session: window.sesion_partida_musa, language: window.scribGetLanguage2P(),
        draft: document.querySelector("#palabra").value,
        font: parseFloat(getComputedStyle(document.querySelector("#texto")).fontSize),
        preferences: window.scribMusePreferences.get(),
        label: document.querySelector("#nombre_musa_label").textContent,
        status: document.querySelector("#musa_options_status").textContent
    }));
    const setSelect = (id, value) => ctx.evaluate(role, ({ id, value }) => {
        const input = document.getElementById(id);
        input.value = value;
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }, { id, value });
    const before = await read(role);
    await ctx.fillValue(role, "#palabra", "luna");
    await ctx.click(role, "#musa_options_button");
    await ctx.waitForVisible(role, "#musa_options_dialog", true, "muse options open");
    await ctx.fillValue(role, "#musa_options_name", "NEBULOSA");
    await ctx.click(role, "#musa_options_save");
    await ctx.waitFor("name confirmed", async () => (await read(role)).name === "NEBULOSA", 8000);
    const renamed = await read(role);
    ctx.assert(renamed.client === before.client && renamed.session === before.session && renamed.team === before.team
        && renamed.draft === "luna" && renamed.label === "NEBULOSA", "rename must preserve team, session, identity and draft");
    ctx.assert(new URL(page.url()).searchParams.get("name") === "NEBULOSA", "canonical URL keeps the new name");
    await setSelect("musa_options_language", "en");
    ctx.assert((await read(role)).language === "en", "personal English language applies immediately");
    ctx.assert((await read("musa2")).language === "es", "other muse is not translated");
    ctx.assert(await ctx.evaluate("spectator", () => window.scribGetLanguage2P() === "es"), "projector language is unchanged");
    await ctx.evaluate(role, () => window.scribMusePreferences.serverLanguage("fr"));
    ctx.assert((await read(role)).language === "en", "a server update cannot overwrite a personal language choice");
    await setSelect("musa_options_language", "");
    ctx.assert((await read(role)).language === "fr", "show-language option follows the server default");
    await setSelect("musa_options_language", "es");
    await setSelect("musa_options_text_size", "1.4");
    const larger = await read(role);
    ctx.assert(Math.abs(larger.font - before.font * 1.4) < 1, "large text increases the original font rather than replacing or compounding it");
    await ctx.click(role, "#musa_options_font");
    await ctx.click(role, "#musa_options_contrast");
    await ctx.click(role, "#musa_options_motion");
    const settings = await ctx.evaluate(role, () => ({
        font: getComputedStyle(document.querySelector("#texto")).fontFamily,
        contrast: document.body.classList.contains("musa-high-contrast"),
        motion: document.body.classList.contains("musa-reduced-motion"),
        duration: getComputedStyle(document.querySelector(".aquarium-current")).animationDuration,
        width: document.documentElement.scrollWidth, viewport: innerWidth,
        dialog: document.querySelector("#musa_options_dialog").getBoundingClientRect().toJSON()
    }));
    ctx.assert(settings.font.includes("Arial") && settings.contrast && settings.motion, "accessibility controls change the muse interface");
    ctx.assert(settings.width <= settings.viewport + 1 && settings.dialog.right <= settings.viewport,
        `mobile options do not overflow: ${JSON.stringify(settings)}`);
    await page.screenshot({ path: path.join(ctx.runArtifactsDir, "muse-options-mobile.png") });
    await page.keyboard.press("Escape");
    await ctx.waitFor("Escape closes the dialog and restores keyboard focus", () => ctx.evaluate(role, () =>
        !document.querySelector("#musa_options_dialog").open && document.activeElement.id === "musa_options_button"), 3000);
    await ctx.evaluate(role, () => window.eval("socket.disconnect()"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await ctx.waitFor("muse reconnects with the new name", async () => ctx.evaluate(role, () =>
        window.eval("musa_registro_confirmado") && window.nombre_musa === "NEBULOSA"), 12000);
    const restored = await read(role);
    ctx.assert(restored.client === before.client && restored.team === before.team && restored.preferences.textSize === 1.4
        && restored.preferences.highContrast && restored.preferences.readableFont && restored.preferences.reducedMotion
        && restored.language === "es", "reload restores preferences without losing the muse identity");
    await page.setViewport({ width: 320, height: 460, isMobile: true });
    await ctx.click(role, "#musa_options_button");
    await ctx.fillValue(role, "#musa_options_name", "BRÉTEMA");
    await ctx.click(role, "#musa_options_save");
    await ctx.waitFor("accented muse name confirmed", async () => (await read(role)).name === "BRÉTEMA", 8000);
    ctx.assert(await ctx.evaluate(role, () => {
        const dialog = document.querySelector("#musa_options_dialog");
        const rect = dialog.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight && rect.right <= innerWidth && dialog.scrollHeight > dialog.clientHeight;
    }), "a short narrow viewport scrolls inside options without overflowing the screen");
    await page.screenshot({ path: path.join(ctx.runArtifactsDir, "muse-options-small-screen.png") });
    await ctx.click(role, "#musa_options_close");
    await ctx.click("musa2", "#musa_options_button");
    await ctx.getPageEntry("musa2").page.screenshot({ path: path.join(ctx.runArtifactsDir, "muse-options-desktop.png") });
    await ctx.click("musa2", "#musa_options_close");
    await ctx.invoke("control", "fin_partida_global");
    await ctx.waitForState("game ended", state => state.partida.fin_del_juego, 8000);
    await ctx.click(role, "#musa_options_button");
    ctx.assert(await ctx.evaluate(role, () => document.querySelector("#musa_options_dialog").open),
        "options remain accessible after the game");
    await ctx.click(role, "#musa_options_close");
}

module.exports = { runMuseOptionsChecks };
