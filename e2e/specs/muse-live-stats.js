const path = require("node:path");

async function runMuseLiveStatsChecks(ctx) {
    const read = role => ctx.evaluate(role, () => {
        const panel = document.getElementById("musa_stats_live");
        return { visible: !panel.hidden, slide: Number(panel.dataset.slide), team: Number(panel.dataset.team),
            content: panel.querySelector('[data-musa-stats="content"]').textContent,
            draft: document.getElementById("palabra").value,
            name: panel.querySelector('[data-musa-stats="name"]').textContent,
            overflow: panel.scrollWidth > panel.clientWidth + 1,
            bounds: panel.getBoundingClientRect().toJSON(), width: innerWidth, height: innerHeight };
    });
    const waitSlide = async index => {
        for (const role of ["musa1", "musa2"]) {
            await ctx.waitFor(`${role} receives slide ${index}`, async () => {
                const data = await read(role);
                return data.visible && data.slide === index && data.team === index % 2 + 1;
            }, 8000);
        }
        await ctx.waitFor("projector and muses share the same slide", () => ctx.evaluate("spectator", step =>
            window.eval("stats_slide_index") === step, index), 8000);
    };
    await ctx.getPageEntry("musa2").page.setViewport({ width: 1366, height: 768 });
    await ctx.evaluate("musa1", () => window.eval("socket.on('stats_live_estado', payload => { window.__museStatsSnapshot = payload; })"));
    await ctx.setWriterText("writer1", "Luna azul brilla sobre el mar. Luna azul.");
    await ctx.setWriterText("writer2", "Rosa roja ilumina el bosque.");
    const writerPage = ctx.getPageEntry("writer1").page;
    await writerPage.focus("#texto");
    await writerPage.keyboard.type(" sol", { delay: 70 });
    await ctx.fillValue("musa1", "#palabra", "luna");
    await ctx.fillValue("musa2", "#palabra", "rosa");
    const drafts = { musa1: (await read("musa1")).draft, musa2: (await read("musa2")).draft };
    ctx.assert(drafts.musa1 === "luna" && drafts.musa2 === "rosa", "both muses have an unsent draft before stats open");
    await ctx.invoke("control", "activarSeccionControl", "juego");
    await ctx.click("control", "#boton_vista_stats");
    await waitSlide(0);
    await ctx.waitFor("server typing telemetry reaches the muse heatmap", () => ctx.evaluate("musa1", () =>
        Number(document.querySelector('.musa-stats-key[data-key="KeyS"] small')?.textContent) >= 1), 8000);
    for (const role of ["musa1", "musa2"]) {
        const data = await read(role);
        ctx.assert(!data.overflow && data.bounds.right <= data.width + 1 && data.bounds.bottom <= data.height + 1,
            `${role} stats fit its viewport: ${JSON.stringify(data)}`);
    }
    await ctx.getPageEntry("musa1").page.screenshot({ path: path.join(ctx.runArtifactsDir, "muse-stats-heatmap-mobile.png") });
    for (const index of [1, 2, 3]) {
        await ctx.invoke("control", "navegarSlidesStatsControl", "next");
        await waitSlide(index);
    }
    await ctx.invoke("control", "navegarSlidesStatsControl", "prev");
    await waitSlide(2);
    await ctx.waitFor("live word count matches the server snapshot", () => ctx.evaluate("musa1", () => {
        const words = window.__museStatsSnapshot?.players[1].palabrasTotal;
        return words > 0 && Number(document.querySelector(".musa-stats-metrics--criteria .musa-stats-metric strong")?.textContent) === words;
    }), 8000);
    const initialWords = await ctx.evaluate("musa1", () => window.__museStatsSnapshot.players[1].palabrasTotal);
    await ctx.setWriterText("writer1", "Una dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciseis diecisiete dieciocho.");
    await ctx.waitFor("stats keep refreshing during the game", () => ctx.evaluate("musa1", before => {
        const words = window.__museStatsSnapshot?.players[1].palabrasTotal;
        return words > before && Number(document.querySelector(".musa-stats-metrics--criteria .musa-stats-metric strong")?.textContent) === words;
    }, initialWords), 8000);
    const updatedWords = await ctx.evaluate("musa1", () => window.__museStatsSnapshot.players[1].palabrasTotal);
    await ctx.getPageEntry("musa1").page.screenshot({ path: path.join(ctx.runArtifactsDir, "muse-stats-overview-mobile.png") });
    await ctx.getPageEntry("musa2").page.screenshot({ path: path.join(ctx.runArtifactsDir, "muse-stats-overview-desktop.png") });
    for (const role of ["musa1", "musa2"]) ctx.assert((await read(role)).draft === drafts[role],
        `stats preserve ${role} draft: before ${drafts[role]}, after ${(await read(role)).draft}`);
    await ctx.click("control", "#boton_vista_stats");
    await ctx.waitFor("stats hide when Control disables them", async () => !(await read("musa1")).visible && !(await read("musa2")).visible, 8000);
    ctx.assert((await read("musa1")).draft === drafts.musa1, "returning to the game preserves the inspiration being composed");
    await ctx.click("control", "#boton_vista_stats");
    await waitSlide(0);
    await ctx.invoke("control", "navegarSlidesStatsControl", "next");
    await waitSlide(1);
    await ctx.invoke("control", "navegarSlidesStatsControl", "next");
    await waitSlide(2);
    await ctx.evaluate("musa2", () => window.eval("socket.disconnect()"));
    await ctx.getPageEntry("musa2").page.reload({ waitUntil: "domcontentloaded" });
    await ctx.waitFor("reconnecting muse restores the selected slide with current data", async () => {
        const data = await read("musa2");
        return data.visible && data.slide === 2 && data.content.includes(String(updatedWords));
    }, 15000);
    await ctx.invoke("control", "fin_partida_global");
    await ctx.waitForState("game ended", state => state.partida.fin_del_juego, 8000);
    await ctx.waitFor("stats no longer cover the muse postgame screen", async () => !(await read("musa1")).visible && !(await read("musa2")).visible, 8000);
}

module.exports = { runMuseLiveStatsChecks };
