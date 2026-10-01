const path = require("node:path");

async function runMuseLetterInputChecks(ctx) {
    const roles = ["musa1", "musa2"];
    await ctx.getPageEntry("musa2").page.setViewport({ width: 1366, height: 768 });
    const forceLetter = async (mode, letra) => {
        await ctx.emitHook("scrib_test:force_mode", { mode, letra });
        for (const role of roles) {
            await ctx.waitForPageFunction(role, ({ mode, letra }) => (
                window.__scribModoActualMusaPreview === mode
                && window.eval("letra") === (letra || "")
            ), 8000, { mode, letra });
        }
    };
    const read = role => ctx.evaluate(role, () => {
        const input = document.getElementById("palabra");
        const root = document.getElementById("musa_inspiration_editor");
        const mirror = document.getElementById("musa_letter_mirror");
        return {
            value: input.value, cursor: input.selectionStart,
            letter: window.eval("letra"),
            active: root.classList.contains("musa-letter-highlight"), hidden: mirror.hidden,
            highlighted: [...mirror.querySelectorAll(".musa-letter-mirror__blessed")].map(node => node.textContent).join(""),
            color: mirror.querySelector(".musa-letter-mirror__blessed")
                ? getComputedStyle(mirror.querySelector(".musa-letter-mirror__blessed")).color : "",
            scroll: input.scrollLeft,
            mirrorScroll: mirror.querySelector(".musa-letter-mirror__viewport").scrollLeft
        };
    });
    const write = async (role, text) => {
        await ctx.evaluate(role, () => {
            const input = document.getElementById("palabra");
            input.value = "";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.focus();
        });
        await ctx.getPageEntry(role).page.keyboard.type(text);
    };
    await forceLetter("letra bendita", "q");
    await ctx.sleep(7500);
    for (const role of roles) {
        await ctx.waitForVisible(role, "#palabra", true, `${role} inspiration field visible`);
        await write(role, "quiqui");
        const state = await read(role);
        ctx.assert(state.value === "quiqui" && state.highlighted === "qq" && state.active
            && state.color === "rgb(101, 255, 131)", `${role} blessed letter must be green: ${JSON.stringify(state)}`);
        await ctx.evaluate(role, () => document.getElementById("palabra").setSelectionRange(3, 3));
    }
    await forceLetter("letra bendita", "i");
    for (const role of roles) {
        const state = await read(role);
        ctx.assert(state.value === "quiqui" && state.cursor === 3 && state.highlighted === "ii",
            `${role} letter change must recolor, not clear the draft or move its caret: ${JSON.stringify(state)}`);
        const panel = await ctx.getPageEntry(role).page.$("#notificacion");
        await panel.screenshot({ path: path.join(ctx.runArtifactsDir, `muse-blessed-${role}.png`) });
    }
    await forceLetter("letra bendita", "a");
    for (const role of roles) {
        await write(role, "ÁrbolA");
        const state = await read(role);
        ctx.assert(state.value === "ÁrbolA" && state.highlighted === "ÁA", `${role} accents and uppercase must be highlighted`);
        await write(role, "abcdefghijklmnopqrst");
        const scroll = await read(role);
        ctx.assert(Math.abs(scroll.scroll - scroll.mirrorScroll) < 2, `${role} color mirror must follow the native caret scroll`);
    }
    await forceLetter("letra prohibida", "a");
    await ctx.sleep(7500);
    for (const role of roles) {
        await write(role, "cAsaÁSOL");
        const state = await read(role);
        ctx.assert(state.value === "csSOL" && !state.active && state.hidden,
            `${role} cursed letter must not be typed: ${JSON.stringify(state)}`);
        await ctx.evaluate(role, () => {
            const input = document.getElementById("palabra");
            input.select();
            // Firefox deliberately empties clipboardData when constructing a
            // synthetic ClipboardEvent. Supply the test clipboard explicitly.
            const event = new Event("paste", { bubbles: true, cancelable: true });
            Object.defineProperty(event, "clipboardData", { value: { getData: () => "maRÁvILLA" } });
            input.dispatchEvent(event);
        });
        ctx.assert((await read(role)).value === "mRvILL", `${role} paste must remove cursed characters: ${JSON.stringify(await read(role))}`);
        await ctx.evaluate(role, () => {
            const input = document.getElementById("palabra");
            input.value = "casa";
            input.setSelectionRange(3, 3);
            input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText" }));
        });
        ctx.assert((await read(role)).value === "cs", `${role} mobile autocorrection must not insert the cursed letter`);
        await ctx.evaluate(role, () => {
            const input = document.getElementById("palabra");
            input.value = "";
            window.eval('insertarTextoEnInput(campo_palabra, "casa")');
        });
        ctx.assert((await read(role)).value === "cs", `${role} delayed-keyboard insertion must honor the current letter too`);
        await ctx.evaluate(role, () => {
            const input = document.getElementById("palabra");
            input.value = "";
            window.eval("activarTecladoLentoMusa()");
            const event = new Event("paste", { bubbles: true, cancelable: true });
            Object.defineProperty(event, "clipboardData", { value: { getData: () => "casa" } });
            input.dispatchEvent(event);
        });
        ctx.assert((await read(role)).value === "", `${role} filtering must not bypass the slow-keyboard delay`);
        await ctx.waitFor(`${role} filtered paste waits for the slow keyboard`, async () => (await read(role)).value === "cs", 3000);
        await ctx.evaluate(role, () => window.eval("limpiarTecladoLentoMusa()"));
    }
    await forceLetter("letra prohibida", "s");
    for (const role of roles) {
        ctx.assert((await read(role)).value === "c", `${role} changing the cursed letter must remove newly invalid characters only`);
        await write(role, "aSs");
        ctx.assert((await read(role)).value === "a", `${role} old cursed letter must become allowed`);
    }
    await forceLetter("palabras bonus");
    for (const role of roles) {
        await write(role, "aSs");
        const state = await read(role);
        ctx.assert(state.value === "aSs" && !state.active, `${role} leaving the level must remove the letter restriction`);
    }
    await forceLetter("letra prohibida", "ñ");
    for (const role of roles) {
        await ctx.evaluate(role, () => {
            const input = document.getElementById("palabra");
            input.value = "n\u0303ieve";
            input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
            input.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
            input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
        });
        ctx.assert((await read(role)).value === "ieve", `${role} IME must block composed cursed letters`);
    }
    await ctx.invoke("control", "limpiar");
    for (const role of roles) {
        // Firefox can stop requestAnimationFrame polling in a background tab
        // after the finished view takes over; read the state independently.
        await ctx.waitFor(`${role} resets its active letter`, async () => (await read(role)).letter === "", 6000);
        // Reset hides the editor; test its rule directly rather than typing
        // into a field which is correctly no longer focusable.
        await ctx.evaluate(role, () => {
            const input = document.getElementById("palabra");
            input.value = "ñÑaSs";
            input.dispatchEvent(new Event("input", { bubbles: true }));
        });
        ctx.assert((await read(role)).value === "ñÑaSs", `${role} reset must remove all cursed-letter restrictions`);
    }
}

module.exports = { runMuseLetterInputChecks };
