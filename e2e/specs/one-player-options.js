const path = require("node:path");

async function runOnePlayerOptionsChecks(ctx) {
    const page = ctx.getPageEntry("onep").page;
    for (const viewport of [{ width: 1400, height: 1000 }, { width: 430, height: 932, isMobile: true }, { width: 320, height: 568, isMobile: true }]) {
        await page.setViewport(viewport);
        // Chromium reloads when switching between desktop and mobile emulation.
        await ctx.waitFor("one-player startup overlay has finished", () => ctx.evaluate("onep", () =>
            !document.body.classList.contains("escritxr-boot-activa")), 30000);
        await ctx.click("onep", "#btn_opciones");
        await ctx.waitFor("one-player options open", () => ctx.evaluate("onep", () =>
            document.body.classList.contains("modo-opciones") && getComputedStyle(document.querySelector("#btn_volver")).display !== "none"
            && getComputedStyle(document.querySelector("#opciones")).display !== "none"), 6000);
        await ctx.sleep(1400);
        const layout = await ctx.evaluate("onep", () => {
            const button = document.getElementById("btn_volver");
            const bounds = button.getBoundingClientRect();
            const icon = button.querySelector(".btn-volver-icon").getBoundingClientRect();
            const label = button.querySelector(".btn-volver-label").getBoundingClientRect();
            return { display: getComputedStyle(button).display, text: button.textContent.trim(), tag: button.tagName,
                centered: Math.abs((label.left + label.right) / 2 - (bounds.left + bounds.right) / 2) < 2,
                aligned: Math.abs((icon.top + icon.bottom) / 2 - (label.top + label.bottom) / 2) < 2,
                inside: icon.left >= bounds.left && icon.bottom <= bounds.bottom && label.right <= bounds.right && label.bottom <= bounds.bottom,
                viewport: bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight,
                horizontalOverflow: button.scrollWidth > button.clientWidth + 1 };
        });
        await page.screenshot({ path: path.join(ctx.runArtifactsDir, `one-player-options-${viewport.width}.png`) });
        ctx.assert(layout.display === "grid" && layout.centered && layout.aligned && layout.inside && layout.viewport
            && !layout.horizontalOverflow && layout.tag === "BUTTON" && !/[âð]/.test(layout.text),
            `back button is legible, centered and fits at ${viewport.width}px: ${JSON.stringify(layout)}`);
        if (viewport.width === 1400) {
            await page.focus("#btn_volver");
            await page.keyboard.press("Enter");
        } else await ctx.click("onep", "#btn_volver");
        await ctx.waitFor("back returns to the dashboard", () => ctx.evaluate("onep", () =>
            !document.body.classList.contains("modo-opciones") && getComputedStyle(document.querySelector("#btn_volver")).display === "none"
            && getComputedStyle(document.querySelector("#btn_opciones")).display !== "none"), 6000);
        await ctx.sleep(1200);
    }
}

module.exports = { runOnePlayerOptionsChecks };
