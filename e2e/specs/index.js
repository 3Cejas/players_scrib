const FULL_ROLE_SET = [
  "control",
  "writer1",
  "writer2",
  "spectator",
  "musa1",
  "musa2",
  "actor1",
  "actor2"
];

const PUTADA_TORTUGA = "\u{1F422}";
const PUTADA_RAYO = "\u26A1";
const PUTADA_BORROSO = "\u{1F32A}\uFE0F";
const PUTADA_INVERSO = "\u{1F643}";
const PUTADA_PLUMA = "\u{1F58A}\uFE0F";

function buildConnectionRequirements(roles) {
  const requirements = {
    control: 0,
    spectator: 0,
    writers: { 1: 0, 2: 0 },
    musas: { 1: 0, 2: 0 },
    actors: { 1: 0, 2: 0 }
  };
  for (const role of roles) {
    if (role === "control") requirements.control += 1;
    else if (role === "spectator") requirements.spectator += 1;
    else if (role === "writer1") requirements.writers[1] += 1;
    else if (role === "writer2") requirements.writers[2] += 1;
    else if (role === "musa1" || role === "musa1b") requirements.musas[1] += 1;
    else if (role === "musa2" || role === "musa2b") requirements.musas[2] += 1;
    else if (role === "actor1") requirements.actors[1] += 1;
    else if (role === "actor2") requirements.actors[2] += 1;
  }
  return requirements;
}

async function openRolesAndWait(ctx, roles) {
  return openRolesAndWaitWithOptions(ctx, roles, { useStateHooks: true });
}

async function waitForSocketConnection(ctx, roleName, timeoutMs = 12000) {
  await ctx.waitFor(
    `${roleName} socket connected`,
    async () => ctx.evaluate(roleName, () => {
      try {
        return Boolean(window.eval("typeof socket !== 'undefined' && socket && socket.connected"));
      } catch (_error) {
        return false;
      }
    }),
    timeoutMs
  );
}

async function openRolesAndWaitWithOptions(ctx, roles, options = {}) {
  const useStateHooks = options.useStateHooks !== false;
  const requirements = buildConnectionRequirements(roles);
  await ctx.openRoles(roles);
  if (!useStateHooks) {
    for (const role of roles) {
      await waitForSocketConnection(ctx, role, 12000);
    }
    return;
  }
  await ctx.waitForState(
    "roles connected",
    (state) => {
      if (requirements.control > 0 && (!state.connections.control.connected || state.connections.control.count < requirements.control)) {
        return false;
      }
      if (requirements.spectator > 0 && (!state.connections.spectator.connected || state.connections.spectator.count < requirements.spectator)) {
        return false;
      }
      if (requirements.writers[1] > 0 && (!state.connections.writers[1].connected || state.connections.writers[1].count < requirements.writers[1])) {
        return false;
      }
      if (requirements.writers[2] > 0 && (!state.connections.writers[2].connected || state.connections.writers[2].count < requirements.writers[2])) {
        return false;
      }
      if (requirements.musas[1] > 0 && (!state.connections.musas[1].connected || state.connections.musas[1].count < requirements.musas[1])) {
        return false;
      }
      if (requirements.musas[2] > 0 && (!state.connections.musas[2].connected || state.connections.musas[2].count < requirements.musas[2])) {
        return false;
      }
      if (requirements.actors[1] > 0 && (!state.connections.actors[1].connected || state.connections.actors[1].count < requirements.actors[1])) {
        return false;
      }
      if (requirements.actors[2] > 0 && (!state.connections.actors[2].connected || state.connections.actors[2].count < requirements.actors[2])) {
        return false;
      }
      return true;
    },
    12000
  );
}

async function startGame(ctx, options = {}) {
  const requireEditable = options.requireEditable !== false;
  const useStateHooks = options.useStateHooks !== false;
  await ctx.fillValue("control", "#frase_final_j1", "cierre azul e2e");
  await ctx.fillValue("control", "#frase_final_j2", "cierre rojo e2e");
  await ctx.click("control", "#boton_escribir");
  if (useStateHooks) {
    await ctx.waitForState(
      "game started",
      (state) => Boolean(state.partida.modo_actual),
      12000
    );
  }
  if (requireEditable && ctx.isRoleOpen("writer1")) {
    await ctx.waitFor(
      "writer1 editable",
      async () => ctx.evaluate("writer1", () => Boolean(document.querySelector("#texto")?.isContentEditable)),
      10000
    );
  }
  if (requireEditable && ctx.isRoleOpen("writer2")) {
    await ctx.waitFor(
      "writer2 editable",
      async () => ctx.evaluate("writer2", () => Boolean(document.querySelector("#texto")?.isContentEditable)),
      10000
    );
  }
  await ctx.sleep(4500);
}

async function configureFastControlPanel(ctx, overrides = {}) {
  const config = {
    tiempo_votacion: 1,
    tiempo_modos: 2,
    tiempo_cambio_letra: 1,
    tiempo_cambio_palabras: 1,
    limite_tiempo_inspiracion: 5,
    tiempo_modificador: 1,
    palabras_insertadas_meta: 1,
    tiempo_minutos: 2,
    tiempo_segundos: 0,
    modes: [
      "letra bendita",
      "letra prohibida",
      "tertulia",
      "palabras bonus",
      "palabras prohibidas",
      "frase final"
    ],
    ...overrides
  };
  await ctx.evaluate("control", (nextConfig) => {
    const setNumericInput = (id, value) => {
      const input = document.getElementById(id);
      if (!input) {
        throw new Error(`Missing control input ${id}`);
      }
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    setNumericInput("tiempo_votacion", nextConfig.tiempo_votacion);
    setNumericInput("tiempo_modos", nextConfig.tiempo_modos);
    setNumericInput("tiempo_cambio_letra", nextConfig.tiempo_cambio_letra);
    setNumericInput("tiempo_cambio_palabras", nextConfig.tiempo_cambio_palabras);
    setNumericInput("limite_tiempo_inspiracion", nextConfig.limite_tiempo_inspiracion);
    setNumericInput("tiempo_modificador", nextConfig.tiempo_modificador);
    setNumericInput("palabras_insertadas_meta", nextConfig.palabras_insertadas_meta);
    setNumericInput("tiempo_minutos", nextConfig.tiempo_minutos);
    setNumericInput("tiempo_segundos", nextConfig.tiempo_segundos);

    if (typeof window.asegurarCasillasModos === "function") {
      window.asegurarCasillasModos();
    }
    if (Array.isArray(nextConfig.modes) && nextConfig.modes.length) {
      const selectedModes = new Set(nextConfig.modes);
      document.querySelectorAll('input[name="modos"]').forEach((checkbox) => {
        checkbox.checked = selectedModes.has(checkbox.value);
      });
      if (typeof window.rellenarListaModos === "function") {
        window.rellenarListaModos();
      }
    }
    if (typeof window.actualizarVariables === "function") {
      window.actualizarVariables();
    }
  }, config);
}

async function ensureSpectatorView(ctx, mode) {
  const state = await ctx.getState();
  if (state.espectador.override === mode) {
    return;
  }
  await ctx.invoke("control", "cambiar_vista_espectador", mode);
  await ctx.waitForState(
    `spectator view ${mode}`,
    (nextState) => nextState.espectador.override === mode,
    6000
  );
}

async function waitForResurrectionMenu(ctx, roleName, player) {
  await ctx.waitForState(
    `resurrection menu visible for player ${player}`,
    (state) => Boolean(state.resurreccion[player].visible),
    10000
  );
  return ctx.evaluate(roleName, () => {
    const isVisible = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return false;
      const style = window.getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    };
    return {
      main: isVisible("#mainMenu"),
      quantity: isVisible("#quantityMenu")
    };
  });
}

async function waitForMode(ctx, mode, timeoutMs = 12000) {
  return ctx.waitForState(
    `mode ${mode} active`,
    (state) => state.partida.modo_actual === mode,
    timeoutMs
  );
}

async function waitForLocalMode(ctx, roleName, mode, timeoutMs = 10000) {
  const expected = String(mode || "").trim().toLowerCase();
  return ctx.waitFor(
    `${roleName} local mode ${mode}`,
    async () => ctx.evaluate(roleName, (targetMode) => {
      try {
        const current = String(window.eval("typeof modo_actual !== 'undefined' ? modo_actual : ''") || "").trim().toLowerCase();
        return current === targetMode;
      } catch (_error) {
        return false;
      }
    }, expected),
    timeoutMs
  );
}

async function setWriterFinalPhraseAndTrigger(ctx, roleName, phrase) {
  await ctx.evaluate(roleName, (targetPhrase) => {
    const el = document.querySelector("#texto");
    if (!el) {
      throw new Error("Missing writer text node");
    }
    el.focus();
    el.textContent = targetPhrase;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "e" }));
    if (typeof window.countChars === "function") {
      window.countChars(el);
    }
    if (typeof window.sendText === "function") {
      window.sendText();
    }
  }, phrase);
}

async function freezeWriterDecay(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    window.eval(`
      if (typeof borrado !== "undefined") {
        clearTimeout(borrado);
      }
      if (typeof rapidez_borrado !== "undefined") {
        rapidez_borrado = 60000;
      }
      if (typeof rapidez_inicio_borrado !== "undefined") {
        rapidez_inicio_borrado = 60000;
      }
    `);
  });
}

function parseClockToSeconds(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  return (Number(match[1]) * 60) + Number(match[2]);
}

function getWriterTimerSeconds(state) {
  if (!state || typeof state !== "object") {
    return null;
  }
  if (Number.isFinite(Number(state.timerSeconds))) {
    return Number(state.timerSeconds);
  }
  return parseClockToSeconds(state.timer);
}

async function focusWriterEditor(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    const el = document.querySelector("#texto");
    if (!el) {
      throw new Error("Missing writer editor");
    }
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
}

async function typeInWriter(ctx, roleName, text) {
  await focusWriterEditor(ctx, roleName);
  const page = ctx.getPageEntry(roleName).page;
  await page.keyboard.type(text, { delay: 20 });
}

async function pressWriterKey(ctx, roleName, key, times = 1, options = {}) {
  if (options.preserveCaret !== true) {
    await focusWriterEditor(ctx, roleName);
  }
  const page = ctx.getPageEntry(roleName).page;
  for (let index = 0; index < times; index += 1) {
    await page.keyboard.press(key);
  }
}

async function placeCaretAtTextOffset(ctx, roleName, targetOffset) {
  await ctx.evaluate(roleName, (offset) => {
    const editor = document.querySelector("#texto");
    if (!editor) {
      throw new Error("Missing writer editor");
    }
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let remaining = Math.max(0, Number(offset) || 0);
    let node = walker.nextNode();
    let selectedNode = null;
    let selectedOffset = 0;

    while (node) {
      const length = node.textContent?.length || 0;
      if (remaining <= length) {
        selectedNode = node;
        selectedOffset = remaining;
        break;
      }
      remaining -= length;
      node = walker.nextNode();
    }

    if (!selectedNode) {
      const fallback = editor.lastChild;
      if (!fallback || fallback.nodeType !== Node.TEXT_NODE) {
        throw new Error("Could not place caret at text offset");
      }
      selectedNode = fallback;
      selectedOffset = fallback.textContent?.length || 0;
    }

    const range = document.createRange();
    range.setStart(selectedNode, Math.min(selectedOffset, selectedNode.textContent?.length || 0));
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.focus();
  }, targetOffset);
}

async function readWriterState(ctx, roleName) {
  return ctx.evaluate(roleName, () => {
    const editor = document.querySelector("#texto");
    const timer = document.querySelector("#tiempo");
    const timerDataset = timer && timer.dataset ? timer.dataset.remainingSeconds : "";
    const timerSeconds = Number(timerDataset || (typeof window.__scribWriterTimerRemaining !== "undefined" ? window.__scribWriterTimerRemaining : NaN));
    return {
      text: String(editor?.textContent || ""),
      html: String(editor?.innerHTML || ""),
      editable: Boolean(editor?.isContentEditable),
      timer: String(timer?.textContent || "").trim(),
      timerSeconds: Number.isFinite(timerSeconds) ? timerSeconds : null,
      protectedCount: editor ? editor.querySelectorAll(".letra-verde, .palabra-bendita, .palabra-musa").length : 0
    };
  });
}

async function readSpectatorInspirationBar(ctx) {
  return ctx.evaluate("spectator", () => {
    const root = document.querySelector("#inspiracion");
    const blueSegment = root ? root.querySelector(".bar-segment.blue") : null;
    const redSegment = root ? root.querySelector(".bar-segment.red") : null;
    const blueText = blueSegment ? blueSegment.querySelector(".percentage-text") : null;
    const redText = redSegment ? redSegment.querySelector(".percentage-text") : null;
    return {
      visible: Boolean(root && window.getComputedStyle(root).display !== "none"),
      blueWidth: parseFloat(String(blueSegment?.style?.width || "0").replace("%", "")) || 0,
      redWidth: parseFloat(String(redSegment?.style?.width || "0").replace("%", "")) || 0,
      blueText: String(blueText?.textContent || "").trim(),
      redText: String(redText?.textContent || "").trim()
    };
  });
}

async function readWriterDisadvantageState(ctx, roleName) {
  return ctx.evaluate(roleName, () => {
    const editor = document.querySelector("#texto");
    const lightningNode = document.querySelector("#lightning");
    const evalFlag = (expression) => {
      try {
        return Boolean(window.eval(expression));
      } catch (_error) {
        return false;
      }
    };
    return {
      bodyClasses: Array.from(document.body?.classList || []),
      editorClasses: Array.from(editor?.classList || []),
      lightningClasses: Array.from(lightningNode?.classList || []),
      keyboardSlow: evalFlag("typeof teclado_lento_putada !== 'undefined' && teclado_lento_putada === true"),
      deleteBlocked: evalFlag("typeof bloquear_borrado_putada !== 'undefined' && bloquear_borrado_putada === true"),
      inverseActive: evalFlag("typeof temp_text_inverso_activado !== 'undefined' && temp_text_inverso_activado === true"),
      blurry: Boolean(editor?.classList.contains("textarea_blur")),
      currentDisadvantage: String(window.eval("typeof putada_actual !== 'undefined' ? putada_actual : ''") || "")
    };
  });
}

async function readSpectatorDisadvantageState(ctx, player) {
  return ctx.evaluate("spectator", (targetPlayer) => {
    const root = document.querySelector(targetPlayer === 2 ? ".jugador2" : ".jugador1");
    return {
      classes: Array.from(root?.classList || []),
      label: String(root?.dataset?.putadaVisual || ""),
      active: Boolean(root?.classList.contains("putada-visual-activa"))
    };
  }, player);
}

async function requestQueuedWriterWord(ctx, roleName, queueType) {
  const eventName = queueType === "prohibida" ? "nueva_palabra_prohibida" : "nueva_palabra_bonus";
  await ctx.evaluate(roleName, ({ nextEventName, nextQueueType }) => {
    const jugador = window.eval("player");
    socket.emit(nextEventName, nextQueueType === "prohibida" ? jugador : { jugador });
  }, {
    nextEventName: eventName,
    nextQueueType: queueType
  });
}

async function applyForcedDisadvantage(ctx, targetPlayer, selection) {
  const winnerTeam = Number(targetPlayer) === 1 ? 2 : 1;
  await ctx.emitHook("scrib_test:force_vote", {
    team: winnerTeam,
    opciones: [selection],
    duracion_ms: 15000
  });
  await ctx.waitForState(
    `forced vote active for target player ${targetPlayer}`,
    (state) => state.votacion_ventaja.activa === true && state.votacion_ventaja.equipo === `j${winnerTeam}`,
    8000
  );
  const closed = await ctx.emitHook("scrib_test:force_vote", {
    active: false,
    selection,
    emitir_resultado: true
  });
  ctx.assert(closed && closed.vote && closed.vote.seleccion === selection, `Unexpected forced disadvantage result: ${JSON.stringify(closed)}`);
  await ctx.waitForState(
    `forced vote closed for target player ${targetPlayer}`,
    (state) => state.votacion_ventaja.activa === false,
    8000
  );
}

async function clickResurrectionButton(ctx, roleName, buttonId) {
  await ctx.evaluate(roleName, (id) => {
    const button = document.getElementById(id);
    if (!button) {
      throw new Error(`Missing resurrection button ${id}`);
    }
    button.click();
  }, buttonId);
}

async function resolveResurrection(ctx, roleName, player, decision) {
  await ctx.waitForState(
    `resurrection visible for player ${player}`,
    (state) => state.resurreccion[player].visible === true,
    10000
  );
  let state = await ctx.getState();
  if (decision === "yes") {
    if (state.resurreccion[player].menu === "main") {
      await clickResurrectionButton(ctx, roleName, "btnSi");
      state = await ctx.waitForState(
        `resurrection quantity for player ${player}`,
        (nextState) => nextState.resurreccion[player].menu === "quantity",
        10000
      );
    }
    await clickResurrectionButton(ctx, roleName, "btnConfirmar");
    await ctx.waitForState(
      `player ${player} resurrected`,
      (nextState) => nextState.resurreccion[player].visible === false && nextState.partida[`fin_j${player}`] === false,
      10000
    );
    return;
  }

  if (state.resurreccion[player].menu === "quantity") {
    await clickResurrectionButton(ctx, roleName, "btnAtras");
    await ctx.waitForState(
      `resurrection main menu restored for player ${player}`,
      (nextState) => nextState.resurreccion[player].menu === "main",
      10000
    );
  }
  await clickResurrectionButton(ctx, roleName, "btnNo");
}

const smokeSpecs = [
  {
    name: "roles-connect",
    run: async (ctx) => {
      await openRolesAndWaitWithOptions(ctx, FULL_ROLE_SET, { useStateHooks: false });
      await ctx.waitForVisible("control", "#boton_escribir", true, "control button visible");
      await ctx.waitForVisible("writer1", "#texto", true, "writer1 editor visible");
      await ctx.waitForVisible("musa1", "#musa_world_entry", true, "musa1 page visible");
      await ctx.waitForVisible("spectator", "#contenedor_espectador", true, "spectator booted");
    }
  },
  {
    name: "game-start-and-write",
    run: async (ctx) => {
      await openRolesAndWaitWithOptions(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "actor2"], { useStateHooks: false });
      await configureFastControlPanel(ctx, {
        tiempo_modos: 10,
        tiempo_votacion: 1,
        tiempo_cambio_letra: 1,
        tiempo_cambio_palabras: 1,
        modes: ["palabras bonus"]
      });
      await startGame(ctx, { useStateHooks: false });
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      const text1 = "cometa";
      const text2 = "brasa";
      await ctx.setWriterText("writer1", text1);
      await ctx.setWriterText("writer2", text2);
      await ctx.waitForText("writer1", "#texto", (text) => text.includes(text1), "writer1 keeps local text");
      await ctx.waitForText("writer2", "#texto", (text) => text.includes(text2), "writer2 keeps local text");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes(text1), "actor1 sees text", 15000);
      await ctx.waitForText("actor2", "#texto", (text) => text.includes(text2), "actor2 sees text", 15000);
    }
  },
];

const onePlayerSpecs = [
  {
    name: "one-player-start-and-write",
    run: async (ctx) => {
      await ctx.openRoles(["onep"]);
      await ctx.evaluate("onep", () => {
        if (!window.scrib1pGameplayShared) {
          throw new Error("Missing 1P shared gameplay state");
        }
        window.scrib1pGameplayShared.atributos = { fuerza: 10, agilidad: 0, destreza: 0 };
        if (typeof actualizarVariables === "function") {
          actualizarVariables();
        }
        const writeButton = document.getElementById("btn_escribir");
        if (writeButton) {
          writeButton.classList.remove("disabled");
          writeButton.setAttribute("aria-disabled", "false");
        }
      });

      await ctx.invoke("onep", "inicio");
      await ctx.waitFor(
        "1P countdown starts",
        async () => ctx.evaluate("onep", () => {
          try {
            return Boolean(document.querySelector("#countdown"))
              || window.eval("typeof inicio_en_progreso_1p !== 'undefined' && inicio_en_progreso_1p === true");
          } catch (_error) {
            return Boolean(document.querySelector("#countdown"));
          }
        }),
        5000
      );
      await ctx.waitFor(
        "1P editor becomes editable after countdown",
        async () => ctx.evaluate("onep", () => document.querySelector("#texto")?.getAttribute("contenteditable") === "true"),
        15000
      );

      const text = "prueba uno dos tres";
      await ctx.setWriterText("onep", text);
      await ctx.waitForText("onep", "#texto", (value) => value.includes(text), "1P editor keeps typed text", 10000);
      await ctx.waitForText("onep", "#puntos", (value) => /palabra/i.test(value), "1P score marker updates", 10000);

      const finalState = await ctx.evaluate("onep", () => ({
        countdownVisible: Boolean(document.querySelector("#countdown")),
        editable: document.querySelector("#texto")?.getAttribute("contenteditable") === "true",
        text: document.querySelector("#texto")?.innerText || "",
        points: document.querySelector("#puntos")?.innerText || ""
      }));
      ctx.assert(finalState.editable, "1P editor should remain editable after starting");
      ctx.assert(!finalState.countdownVisible, "1P countdown should be gone after start");
      ctx.assert(finalState.text.includes(text), "1P text should remain in the editor");
      ctx.assert(/palabra/i.test(finalState.points), "1P score marker should expose word count text");
    }
  }
];

const visualSpecs = [
  {
    name: "spectator-layout-visual",
    run: async (ctx) => {
      await openRolesAndWaitWithOptions(ctx, ["spectator"], { useStateHooks: false });
      await ctx.evaluate("spectator", () => {
        const setText = (selector, value) => {
          const node = document.querySelector(selector);
          if (!node) {
            throw new Error(`Missing spectator node ${selector}`);
          }
          if ("value" in node) {
            node.value = value;
          } else {
            node.textContent = value;
          }
        };

        document.body.classList.add("vista-partida");
        const contenedor = document.getElementById("contenedor_espectador");
        if (contenedor) {
          contenedor.style.display = "";
        }
        setText("#nombre", "ESCRITXR AZUL");
        setText("#nombre1", "ESCRITXR ROJO");
        setText("#texto", "visual azul del espectador");
        setText("#texto1", "visual rojo del espectador");
        setText("#puntos", "4 palabras");
        setText("#puntos1", "5 palabras");
        setText("#musas", "2 musas");
        setText("#musas1", "3 musas");
        setText("#palabra1", "MUSA AZUL");
        setText("#palabra2", "MUSA ROJA");
        setText("#explicacion1", "Pide palabras bonus y manten el ritmo.");
        setText("#explicacion2", "Evita la saturacion y busca cierre.");
        setText("#palabra", "PALABRAS BONUS");
        setText("#explicacion", "Escena visual estable del espectador.");
      });

      await ctx.assertVisualSnapshot("spectator", "spectator-main-layout", {
        selector: "#contenedor_espectador",
        threshold: 14,
        settleMs: 500,
        hideSelectors: [
          "#corazones_espectador",
          "#lightning",
          ".container",
          "#feedback1",
          "#feedback2",
          "#tiempo",
          "#tiempo1",
          "#feedback_tiempo",
          "#feedback_tiempo1"
        ],
        extraCss: `
          #contenedor_espectador {
            animation: none !important;
            transform: none !important;
          }
          #texto, #texto1 {
            caret-color: transparent !important;
          }
        `
      });
    }
  },
  {
    name: "teleprompter-visual",
    run: async (ctx) => {
      await openRolesAndWaitWithOptions(ctx, ["spectator"], { useStateHooks: false });
      await ctx.evaluate("spectator", () => {
        window.eval(`
          if (typeof teleprompter_estado !== "undefined") {
            teleprompter_estado.visible = true;
            teleprompter_estado.text = "Teleprompter visual estable para regresion con una linea larga y legible.";
            teleprompter_estado.source = 1;
            teleprompter_estado.fontSize = 48;
            teleprompter_estado.speed = 25;
            teleprompter_estado.playing = false;
            teleprompter_estado.scroll = 0;
            teleprompter_estado.loadId = 11;
          }
          if (typeof aplicarRenderTeleprompterEspectador === "function") {
            aplicarRenderTeleprompterEspectador({ esNuevaCarga: true });
          }
        `);
      });
      await ctx.waitForText(
        "spectator",
        "#teleprompter_text",
        (text) => text.includes("Teleprompter visual estable"),
        "spectator teleprompter visual text",
        15000
      );

      await ctx.assertVisualSnapshot("spectator", "teleprompter-overlay-writer1", {
        selector: "#teleprompter_screen",
        threshold: 12,
        settleMs: 500,
        hideSelectors: [
          "#corazones_espectador"
        ],
        extraCss: `
          #teleprompter_overlay {
            animation: none !important;
          }
          #teleprompter_screen,
          #teleprompter_text {
            animation: none !important;
            transition: none !important;
          }
        `
      });
    }
  }
];

const coreSpecs = [
  {
    name: "mode-transitions-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "spectator", "actor1"]);
      await startGame(ctx);
      await ctx.waitForVisible("spectator", "#countdown", false, "spectator intro cleared before mode transitions", 10000);
      await ctx.waitForVisible("actor1", "#countdown", false, "actor intro cleared before mode transitions", 10000);
      const modes = [
        { mode: "letra bendita", letter: "B" },
        { mode: "letra prohibida", letter: "K" },
        { mode: "tertulia" },
        { mode: "palabras bonus" },
        { mode: "palabras prohibidas" },
        { mode: "frase final" }
      ];

      for (const item of modes) {
        if (item.mode === "letra bendita") {
          await ctx.waitForState(
            `state already on ${item.mode}`,
            (state) => state.partida.modo_actual === item.mode,
            8000
          );
        } else {
          await ctx.emitHook("scrib_test:force_mode", { mode: item.mode, letra: item.letter });
          await ctx.waitForState(
            `state switched to ${item.mode}`,
            (state) => state.partida.modo_actual === item.mode,
            8000
          );
        }
        await waitForLocalMode(ctx, "writer1", item.mode, 10000);
        await waitForLocalMode(ctx, "actor1", item.mode, 10000);
        await ctx.waitForText("writer1", "#palabra", (text) => text.trim().length > 0, `writer1 title visible for ${item.mode}`);
        await ctx.waitForText("actor1", "#palabra", (text) => text.trim().length > 0, `actor title visible for ${item.mode}`);
      }
    }
  },
  {
    name: "musa-flow-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "musa1", "musa2"]);
      const cases = [
        { mode: "letra bendita", letter: "A", sender: "musa1", team: 1, word: "aurora" },
        { mode: "letra prohibida", letter: "Z", sender: "musa2", team: 2, word: "faro" },
        { mode: "palabras bonus", sender: "musa1", team: 1, word: "cometa" },
        { mode: "palabras prohibidas", sender: "musa2", team: 2, word: "tormenta" }
      ];

      for (const item of cases) {
        await ctx.emitHook("scrib_test:force_mode", {
          mode: item.mode,
          letra: item.letter
        });
        await ctx.waitForState(
          `forced mode ${item.mode}`,
          (state) => state.partida.modo_actual === item.mode,
          8000
        );
        await ctx.sendMusaWord(item.sender, item.word);
        await ctx.waitForState(
          `server received musa word for ${item.mode}`,
          (state) => {
            const latest = state.inspiracion.ultimas[item.team];
            return Boolean(latest && latest.palabra === item.word);
          },
          10000
        );

        if (item.mode === "palabras bonus" || item.mode === "palabras prohibidas") {
          await ensureSpectatorView(ctx, "nube_inspiracion");
          await ctx.waitForState(
            `server queued musa word for ${item.mode}`,
            (state) => state.inspiracion.nube.equipos[item.team].palabras
              .some((candidate) => String(candidate || "").toLowerCase() === item.word.toLowerCase()),
            10000
          );
          await ctx.waitForText(
            "spectator",
            "#nube_inspiracion_canvas",
            (text) => text.toLowerCase().includes(item.word.toLowerCase()),
            `word ${item.word} visible in spectator cloud after ${item.mode}`,
            10000
          );
          continue;
        }

        await ctx.waitForText(
          item.team === 1 ? "writer1" : "writer2",
          "#definicion",
          (text) => text.toLowerCase().includes(item.word.toLowerCase()),
          `word ${item.word} visible on writer ${item.team} after ${item.mode}`,
          10000
        );
      }
    }
  },
  {
    name: "words-levels-queue-and-time-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "musa1", "musa2"]);
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);
      await ctx.sendMusaWord("musa1", "horizonte");
      await ctx.sendMusaWord("musa2", "memoria");

      await ctx.evaluate("writer1", () => {
        const jugador = window.eval("player");
        socket.emit("nueva_palabra_bonus", { jugador });
      });
      await ctx.evaluate("writer2", () => {
        const jugador = window.eval("player");
        socket.emit("nueva_palabra_bonus", { jugador });
      });

      await ctx.waitForText("writer1", "#definicion", (text) => text.toLowerCase().includes("horizonte"), "writer1 received queued bonus word", 10000);
      await ctx.waitForText("writer2", "#definicion", (text) => text.toLowerCase().includes("memoria"), "writer2 received queued bonus word", 10000);

      const bonusBefore1 = getWriterTimerSeconds(await readWriterState(ctx, "writer1"));
      const bonusBefore2 = getWriterTimerSeconds(await readWriterState(ctx, "writer2"));

      await typeInWriter(ctx, "writer1", " horizonte");
      await typeInWriter(ctx, "writer2", " memoria");

      await ctx.waitForState(
        "bonus words recorded in stats for both writers",
        (state) => state.stats.players[1].palabrasBenditas.includes("HORIZONTE")
          && state.stats.players[2].palabrasBenditas.includes("MEMORIA"),
        10000
      );
      await ctx.waitFor(
        "writer1 timer increased after bonus word",
        async () => {
          const after = getWriterTimerSeconds(await readWriterState(ctx, "writer1"));
          return after !== null && bonusBefore1 !== null && after > bonusBefore1 ? after : false;
        },
        5000
      );
      await ctx.waitFor(
        "writer2 timer increased after bonus word",
        async () => {
          const after = getWriterTimerSeconds(await readWriterState(ctx, "writer2"));
          return after !== null && bonusBefore2 !== null && after > bonusBefore2 ? after : false;
        },
        5000
      );

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras prohibidas" });
      await waitForMode(ctx, "palabras prohibidas", 8000);
      await ctx.sendMusaWord("musa1", "volcan");
      await ctx.sendMusaWord("musa2", "marea");

      await ctx.evaluate("writer1", () => {
        const jugador = window.eval("player");
        socket.emit("nueva_palabra_prohibida", jugador);
      });
      await ctx.evaluate("writer2", () => {
        const jugador = window.eval("player");
        socket.emit("nueva_palabra_prohibida", jugador);
      });

      await ctx.waitForText("writer1", "#definicion", (text) => text.toLowerCase().includes("marea"), "writer1 received opponent forbidden word", 10000);
      await ctx.waitForText("writer2", "#definicion", (text) => text.toLowerCase().includes("volcan"), "writer2 received opponent forbidden word", 10000);

      const malditaBefore1 = getWriterTimerSeconds(await readWriterState(ctx, "writer1"));
      const malditaBefore2 = getWriterTimerSeconds(await readWriterState(ctx, "writer2"));

      await typeInWriter(ctx, "writer1", " marea");
      await typeInWriter(ctx, "writer2", " volcan");
      await ctx.waitFor(
        "writer1 timer decreased after forbidden word",
        async () => {
          const after = getWriterTimerSeconds(await readWriterState(ctx, "writer1"));
          return after !== null && malditaBefore1 !== null && after < malditaBefore1 ? after : false;
        },
        10000
      );
      await ctx.waitFor(
        "writer2 timer decreased after forbidden word",
        async () => {
          const after = getWriterTimerSeconds(await readWriterState(ctx, "writer2"));
          return after !== null && malditaBefore2 !== null && after < malditaBefore2 ? after : false;
        },
        10000
      );
    }
  },
  {
    name: "letters-protection-and-delivery-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "musa1", "musa2"]);
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      await ctx.emitHook("scrib_test:force_mode", { mode: "letra bendita", letra: "A" });
      await waitForMode(ctx, "letra bendita", 8000);
      await ctx.sendMusaWord("musa1", "aurora");
      await ctx.sendMusaWord("musa2", "brasa");

      await ctx.waitForText("writer1", "#definicion", (text) => text.toLowerCase().includes("aurora"), "writer1 received bendita musa word", 10000);
      await ctx.waitForText("writer2", "#definicion", (text) => text.toLowerCase().includes("brasa"), "writer2 received bendita musa word", 10000);

      await typeInWriter(ctx, "writer1", " bar");
      await typeInWriter(ctx, "writer2", " tan");

      await ctx.waitForState(
        "blessed-letter stats updated for both writers",
        (state) => state.stats.players[1].letrasBenditas.includes("A")
          && state.stats.players[2].letrasBenditas.includes("A"),
        10000
      );

      const writer1Bendita = await readWriterState(ctx, "writer1");
      const writer2Bendita = await readWriterState(ctx, "writer2");
      ctx.assert(writer1Bendita.text.toLowerCase().includes("a"), "writer1 text should contain the blessed letter before deletion attempts");
      ctx.assert(writer2Bendita.text.toLowerCase().includes("a"), "writer2 text should contain the blessed letter before deletion attempts");

      // TODO: reforzar este caso cuando el cliente preserve siempre la letra bendita
      // también tras mover el caret y borrar alrededor de ella.
      await placeCaretAtTextOffset(ctx, "writer1", 3);
      await pressWriterKey(ctx, "writer1", "Backspace", 1, { preserveCaret: true });
      await placeCaretAtTextOffset(ctx, "writer1", 2);
      await pressWriterKey(ctx, "writer1", "Delete", 1, { preserveCaret: true });

      await ctx.evaluate("writer1", () => {
        const editor = document.querySelector("#texto");
        editor.textContent = "";
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        if (typeof window.sendText === "function") window.sendText();
      });
      await ctx.evaluate("writer2", () => {
        const editor = document.querySelector("#texto");
        editor.textContent = "";
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        if (typeof window.sendText === "function") window.sendText();
      });

      await ctx.emitHook("scrib_test:force_mode", { mode: "letra prohibida", letra: "Z" });
      await waitForMode(ctx, "letra prohibida", 8000);
      await ctx.sendMusaWord("musa1", "faro");
      await ctx.sendMusaWord("musa2", "bruma");

      await ctx.waitForText("writer1", "#definicion", (text) => text.toLowerCase().includes("faro"), "writer1 received prohibited-letter musa word", 10000);
      await ctx.waitForText("writer2", "#definicion", (text) => text.toLowerCase().includes("bruma"), "writer2 received prohibited-letter musa word", 10000);

      await typeInWriter(ctx, "writer1", "z");
      await typeInWriter(ctx, "writer2", "Z");

      await ctx.waitForState(
        "forbidden-letter attempt tracked in server stats",
        (state) => state.stats.players[1].intentosLetraProhibida >= 1
          || state.stats.players[2].intentosLetraProhibida >= 1,
        10000
      );

      const writer1Prohibida = await readWriterState(ctx, "writer1");
      const writer2Prohibida = await readWriterState(ctx, "writer2");
      ctx.assert(!writer2Prohibida.text.toLowerCase().includes("z"), "writer2 must not keep the forbidden letter in the text");
      ctx.assert(
        !writer1Prohibida.text.toLowerCase().includes("z") || !writer2Prohibida.text.toLowerCase().includes("z"),
        "At least one writer must reject the forbidden letter in the UI"
      );
    }
  },
  {
    name: "spectator-inspiration-bar-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "musa1", "musa2"]);
      await startGame(ctx);
      await ctx.waitForVisible("spectator", "#countdown", false, "spectator intro cleared before inspiration bar checks", 10000);
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      const waitForBalancedBar = async (label) => {
        await ctx.waitFor(
          label,
          async () => {
            const bar = await readSpectatorInspirationBar(ctx);
            return bar.visible
              && Math.abs(bar.blueWidth - 50) <= 0.5
              && Math.abs(bar.redWidth - 50) <= 0.5
              ? bar
              : false;
          },
          10000
        );
      };

      const waitForDominantBar = async (label, expectedLeader) => {
        await ctx.waitFor(
          label,
          async () => {
            const bar = await readSpectatorInspirationBar(ctx);
            if (!bar.visible) return false;
            if (expectedLeader === "blue") {
              return bar.blueWidth > 99 && bar.redWidth < 1 ? bar : false;
            }
            return bar.redWidth > 99 && bar.blueWidth < 1 ? bar : false;
          },
          10000
        );
      };

      await waitForBalancedBar("spectator inspiration bar starts at 50/50");

      await ctx.emitHook("scrib_test:force_mode", { mode: "letra bendita", letra: "A" });
      await waitForMode(ctx, "letra bendita", 8000);
      await waitForBalancedBar("spectator inspiration bar reset on bendita mode");
      await ctx.sendMusaWord("musa1", "aurora");
      await ctx.waitForText("writer1", "#definicion", (text) => text.toLowerCase().includes("aurora"), "writer1 received bendita inspiration word", 10000);
      await typeInWriter(ctx, "writer1", " aurora");
      await waitForDominantBar("spectator inspiration bar favors blue after writer1 musa word", "blue");

      await ctx.emitHook("scrib_test:force_mode", { mode: "letra prohibida", letra: "Z" });
      await waitForMode(ctx, "letra prohibida", 8000);
      await waitForBalancedBar("spectator inspiration bar reset on prohibida mode");
      await ctx.sendMusaWord("musa2", "bruma");
      await ctx.waitForText("writer2", "#definicion", (text) => text.toLowerCase().includes("bruma"), "writer2 received prohibida inspiration word", 10000);
      await typeInWriter(ctx, "writer2", " bruma");
      await waitForDominantBar("spectator inspiration bar favors red after writer2 musa word", "red");

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);
      await waitForBalancedBar("spectator inspiration bar reset on bonus mode");
      await ctx.sendMusaWord("musa1", "horizonte");
      await requestQueuedWriterWord(ctx, "writer1", "bonus");
      await ctx.waitForText("writer1", "#definicion", (text) => text.toLowerCase().includes("horizonte"), "writer1 received queued bonus word", 10000);
      await typeInWriter(ctx, "writer1", " horizonte");
      await waitForDominantBar("spectator inspiration bar favors blue after bonus word", "blue");

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras prohibidas" });
      await waitForMode(ctx, "palabras prohibidas", 8000);
      await waitForBalancedBar("spectator inspiration bar reset on palabras prohibidas mode");
      await ctx.sendMusaWord("musa2", "marea");
      await requestQueuedWriterWord(ctx, "writer1", "prohibida");
      await ctx.waitForText("writer1", "#definicion", (text) => text.toLowerCase().includes("marea"), "writer1 received opponent forbidden word for bar test", 10000);
      await typeInWriter(ctx, "writer1", " marea");
      await waitForDominantBar("spectator inspiration bar favors red after forbidden word penalty", "red");

      await ctx.emitHook("scrib_test:force_mode", { mode: "frase final" });
      await waitForMode(ctx, "frase final", 8000);
      await waitForBalancedBar("spectator inspiration bar reset on final phrase mode");
    }
  },
  {
    name: "final-phrase-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["writer1", "spectator", "musa1"]);
      await ctx.emitHook("scrib_test:force_mode", { mode: "frase final" });
      await ctx.waitForState("frase final active", (state) => state.partida.modo_actual === "frase final");
      await ctx.waitForText("writer1", "#palabra", (text) => text.trim().length > 0, "writer1 shows final phrase title");
      await ctx.waitForText("spectator", "#palabra", (text) => text.trim().length > 0, "spectator shows final phrase title");
      await ctx.waitFor(
        "musa final phrase preview",
        async () => {
          const mode = await ctx.evaluate("musa1", () => window.__scribModoActualMusaPreview || "");
          return mode === "frase final";
        },
        6000
      );
    }
  },
  {
    name: "tutorial-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "musa1", "musa2"]);

      await ctx.invoke("control", "cambiar_vista_calentamiento");
      await ctx.waitForState(
        "tutorial view active",
        (state) => state.tutorial.vista === true,
        6000
      );

      await ctx.invoke("control", "pedir_solicitud_calentamiento", "lugares");
      await ctx.sendWarmupWord("musa1", "biblioteca");
      await ctx.sendWarmupWord("musa2", "observatorio");
      await ctx.waitForState(
        "warmup places received",
        (state) => state.tutorial.solicitud === "lugares"
          && state.tutorial.equipos[1].palabras.some((item) => item.palabra === "biblioteca")
          && state.tutorial.equipos[2].palabras.some((item) => item.palabra === "observatorio"),
        10000
      );
      await ctx.clickWarmupWord("writer1", "biblioteca");
      await ctx.clickWarmupWord("writer2", "observatorio");
      await ctx.waitForState(
        "writers selected warmup words",
        (state) => state.tutorial.equipos[1].seleccionadas >= 1 && state.tutorial.equipos[2].seleccionadas >= 1,
        10000
      );

      await ctx.invoke("control", "pedir_solicitud_calentamiento", "frase_final");
      await ctx.sendWarmupWord("musa1", "la luna entra por la ventana");
      await ctx.sendWarmupWord("musa2", "el teatro respira humo azul");
      await ctx.waitForState(
        "warmup final phrases received",
        (state) => state.tutorial.solicitud === "frase_final"
          && state.tutorial.equipos[1].palabras.some((item) => item.palabra === "la luna entra por la ventana")
          && state.tutorial.equipos[2].palabras.some((item) => item.palabra === "el teatro respira humo azul"),
        10000
      );
      await ctx.waitForText(
        "spectator",
        "#calentamiento_global_estado",
        (text) => text.trim().length > 0,
        "spectator shows tutorial status"
      );
    }
  },
  {
    name: "actors-see-text",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "actor1", "actor2"]);
      await startGame(ctx);
      await ctx.setWriterText("writer1", "actor uno sincronizado");
      await ctx.setWriterText("writer2", "actor dos sincronizado");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("actor uno sincronizado"), "actor1 synced");
      await ctx.waitForText("actor2", "#texto", (text) => text.includes("actor dos sincronizado"), "actor2 synced");

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await ctx.waitForText("actor1", "#palabra", (text) => text.trim().length > 0, "actor1 mode strip visible");
      await ctx.waitForText("actor2", "#palabra", (text) => text.trim().length > 0, "actor2 mode strip visible");
    }
  },
  {
    name: "pause-and-tertulia-resume-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "actor1", "actor2"]);
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      await ctx.setWriterText("writer1", "texto azul base");
      await ctx.setWriterText("writer2", "texto rojo base");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("texto azul base"), "actor1 sees base text");
      await ctx.waitForText("actor2", "#texto", (text) => text.includes("texto rojo base"), "actor2 sees base text");

      await ctx.emitHook("scrib_test:force_mode", { mode: "tertulia" });
      await waitForMode(ctx, "tertulia", 8000);
      await ctx.waitFor(
        "writers locked in tertulia",
        async () => {
          const writer1 = await readWriterState(ctx, "writer1");
          const writer2 = await readWriterState(ctx, "writer2");
          return writer1.editable === false && writer2.editable === false;
        },
        8000
      );
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("texto azul base"), "actor1 keeps text visible during tertulia");
      await ctx.waitForText("actor2", "#texto", (text) => text.includes("texto rojo base"), "actor2 keeps text visible during tertulia");

      const tertuliaBefore1 = await readWriterState(ctx, "writer1");
      const tertuliaBefore2 = await readWriterState(ctx, "writer2");
      await typeInWriter(ctx, "writer1", " imposible");
      await typeInWriter(ctx, "writer2", " imposible");
      const tertuliaAfter1 = await readWriterState(ctx, "writer1");
      const tertuliaAfter2 = await readWriterState(ctx, "writer2");
      ctx.assert(tertuliaAfter1.text === tertuliaBefore1.text, "writer1 must stay blocked during tertulia");
      ctx.assert(tertuliaAfter2.text === tertuliaBefore2.text, "writer2 must stay blocked during tertulia");

      await ctx.invoke("control", "saltar_tertulia");
      await ctx.waitForState(
        "tertulia skipped to next mode",
        (state) => state.partida.modo_actual !== "tertulia",
        8000
      );
      await ctx.waitFor(
        "writers editable after tertulia",
        async () => {
          const writer1 = await readWriterState(ctx, "writer1");
          const writer2 = await readWriterState(ctx, "writer2");
          return writer1.editable === true && writer2.editable === true;
        },
        8000
      );

      await typeInWriter(ctx, "writer1", " 123");
      await typeInWriter(ctx, "writer2", " 123");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("123"), "actor1 sees text after tertulia", 10000);
      await ctx.waitForText("actor2", "#texto", (text) => text.includes("123"), "actor2 sees text after tertulia", 10000);
    }
  },
  {
    name: "resurrection-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator"]);
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await ctx.setWriterText("writer1", "palabras para resucitar uno");
      await ctx.setWriterText("writer2", "palabras para resucitar dos");

      await ctx.emitHook("scrib_test:force_finish_player", { player: 1, reiniciar: false });
      const writer1Menu = await waitForResurrectionMenu(ctx, "writer1", 1);
      if (writer1Menu.main) {
        await ctx.click("writer1", "#btnSi");
      }
      await ctx.waitForState(
        "writer1 quantity menu open",
        (state) => state.resurreccion[1].visible === true && state.resurreccion[1].menu === "quantity",
        10000
      );
      await ctx.evaluate("writer1", () => {
        const button = document.getElementById("btnConfirmar");
        if (!button) {
          throw new Error("Missing writer1 confirm button");
        }
        button.click();
      });
      await ctx.waitForState(
        "writer1 resurrected",
        (state) => state.partida.fin_j1 === false && state.resurreccion[1].visible === false,
        10000
      );

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await ctx.emitHook("scrib_test:force_finish_player", { player: 2, reiniciar: false });
      const writer2Menu = await waitForResurrectionMenu(ctx, "writer2", 2);
      if (writer2Menu.quantity) {
        await ctx.evaluate("writer2", () => {
          const button = document.getElementById("btnAtras");
          if (!button) {
            throw new Error("Missing writer2 back button");
          }
          button.click();
        });
        await ctx.waitForState(
          "writer2 main menu restored",
          (state) => state.resurreccion[2].visible === true && state.resurreccion[2].menu === "main",
          10000
        );
      }
      await ctx.evaluate("writer2", () => {
        const button = document.getElementById("btnNo");
        if (!button) {
          throw new Error("Missing writer2 no button");
        }
        button.click();
      });
      await ctx.waitForState(
        "writer2 declined resurrection",
        (state) => state.partida.fin_j2 === true,
        8000
      );

      await ctx.emitHook("scrib_test:force_mode", { mode: "letra bendita", letra: "R" });
      await ctx.emitHook("scrib_test:force_finish_player", { player: 1, reiniciar: false });
      await ctx.waitForState(
        "writer1 resurrection menu reopened after mode change",
        (state) => state.partida.modo_actual === "letra bendita"
          && state.resurreccion[1].visible === true
          && state.resurreccion[1].menu === "quantity",
        10000
      );

      await ctx.emitHook("scrib_test:reset", {});
      await ctx.closeAllPages();
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator"]);
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await ctx.setWriterText("writer1", "reinicio limpio resurreccion uno");
      await ctx.setWriterText("writer2", "reinicio limpio resurreccion dos");
      await ctx.emitHook("scrib_test:force_finish_player", { player: 1, reiniciar: false });
      await ctx.emitHook("scrib_test:force_finish_player", { player: 2, reiniciar: false });
      await ctx.waitForState(
        "both resurrection menus opened in clean state",
        (state) => state.resurreccion[1].visible === true
          && state.resurreccion[1].menu === "quantity"
          && state.resurreccion[2].visible === true
          && state.resurreccion[2].menu === "quantity",
        10000
      );
    }
  },
  {
    name: "vote-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["musa1", "musa2", "writer1"]);
      await ctx.emitHook("scrib_test:force_vote", {
        team: 1,
        opciones: ["turtle", "shock", "storm"],
        duracion_ms: 15000
      });

      await ctx.waitForVisible("musa1", "#votacion_ventaja_modal", true, "musa1 vote modal open");
      const activeVote = await ctx.getState();
      const firstOption = activeVote.votacion_ventaja.opciones[0];
      const secondOption = activeVote.votacion_ventaja.opciones[1];
      await ctx.invoke("musa1", "votarVentajaPorEmoji", firstOption);
      await ctx.waitForState(
        "one vote registered",
        (state) => Object.values(state.votacion_ventaja.votos).reduce((acc, value) => acc + Number(value || 0), 0) === 1,
        8000
      );
      await ctx.invoke("musa1", "votarVentajaPorEmoji", secondOption);
      await ctx.waitForState(
        "duplicate vote ignored",
        (state) => Object.values(state.votacion_ventaja.votos).reduce((acc, value) => acc + Number(value || 0), 0) === 1,
        8000
      );

      await ctx.emitHook("scrib_test:force_vote", { active: false });
      await ctx.waitForVisible("musa1", "#votacion_ventaja_modal", false, "vote modal closed");
    }
  },
  {
    name: "disadvantages-application-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator"]);
      await configureFastControlPanel(ctx, {
        tiempo_modificador: 2
      });
      await startGame(ctx, { requireEditable: false });
      await ctx.waitForVisible("spectator", "#countdown", false, "spectator intro cleared before disadvantage churn", 10000);
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);
      await waitForLocalMode(ctx, "writer1", "palabras bonus", 10000);
      await waitForLocalMode(ctx, "writer2", "palabras bonus", 10000);

      const cases = [
        {
          selection: PUTADA_TORTUGA,
          player: 1,
          expectedSpectatorClass: "putada-visual--tortuga",
          writerAssert: (state) => state.keyboardSlow === true
        },
        {
          selection: PUTADA_RAYO,
          player: 2,
          expectedSpectatorClass: "putada-visual--rayo",
          writerAssert: (state) => state.bodyClasses.includes("bg")
            && state.bodyClasses.includes("rain")
            && state.lightningClasses.includes("lightning")
        },
        {
          selection: PUTADA_BORROSO,
          player: 1,
          expectedSpectatorClass: "putada-visual--borroso",
          writerAssert: (state) => state.blurry === true
        },
        {
          selection: PUTADA_INVERSO,
          player: 2,
          expectedSpectatorClass: "putada-visual--inverso",
          writerAssert: (state) => state.inverseActive === true
        },
        {
          selection: PUTADA_PLUMA,
          player: 1,
          expectedSpectatorClass: "putada-visual--pluma",
          writerAssert: (state) => state.deleteBlocked === true
        }
      ];

      const writerRoleByPlayer = {
        1: "writer1",
        2: "writer2"
      };

      for (const testCase of cases) {
        const targetRole = writerRoleByPlayer[testCase.player];
        const otherRole = writerRoleByPlayer[testCase.player === 1 ? 2 : 1];

        await applyForcedDisadvantage(ctx, testCase.player, testCase.selection);

        await ctx.waitFor(
          `${targetRole} receives disadvantage ${testCase.selection}`,
          async () => {
            const state = await readWriterDisadvantageState(ctx, targetRole);
            return testCase.writerAssert(state) ? state : false;
          },
          10000
        );

        const unaffected = await readWriterDisadvantageState(ctx, otherRole);
        if (testCase.selection === PUTADA_TORTUGA) {
          ctx.assert(unaffected.keyboardSlow === false, `${otherRole} should not receive turtle disadvantage`);
        } else if (testCase.selection === PUTADA_RAYO) {
          ctx.assert(!unaffected.bodyClasses.includes("bg") && !unaffected.bodyClasses.includes("rain"), `${otherRole} should not receive lightning disadvantage`);
        } else if (testCase.selection === PUTADA_BORROSO) {
          ctx.assert(unaffected.blurry === false, `${otherRole} should not receive blur disadvantage`);
        } else if (testCase.selection === PUTADA_INVERSO) {
          ctx.assert(unaffected.inverseActive === false, `${otherRole} should not receive inverse disadvantage`);
        } else if (testCase.selection === PUTADA_PLUMA) {
          ctx.assert(unaffected.deleteBlocked === false, `${otherRole} should not receive pluma disadvantage`);
        }

        await ctx.waitFor(
          `spectator marks player ${testCase.player} with ${testCase.expectedSpectatorClass}`,
          async () => {
            const spectatorState = await readSpectatorDisadvantageState(ctx, testCase.player);
            return spectatorState.active && spectatorState.classes.includes(testCase.expectedSpectatorClass)
              ? spectatorState
              : false;
          },
          10000
        );

        const spectatorOther = await readSpectatorDisadvantageState(ctx, testCase.player === 1 ? 2 : 1);
        ctx.assert(spectatorOther.active === false, `Spectator should not highlight the wrong player for ${testCase.selection}`);

        await ctx.waitFor(
          `${targetRole} clears disadvantage ${testCase.selection}`,
          async () => {
            const state = await readWriterDisadvantageState(ctx, targetRole);
            if (testCase.selection === PUTADA_TORTUGA) return state.keyboardSlow === false ? state : false;
            if (testCase.selection === PUTADA_RAYO) return !state.bodyClasses.includes("bg") && !state.bodyClasses.includes("rain") ? state : false;
            if (testCase.selection === PUTADA_BORROSO) return state.blurry === false ? state : false;
            if (testCase.selection === PUTADA_INVERSO) return state.inverseActive === false ? state : false;
            if (testCase.selection === PUTADA_PLUMA) return state.deleteBlocked === false ? state : false;
            return false;
          },
          12000
        );
        await ctx.waitFor(
          `spectator clears visual disadvantage ${testCase.selection}`,
          async () => {
            const spectatorState = await readSpectatorDisadvantageState(ctx, testCase.player);
            return spectatorState.active === false ? spectatorState : false;
          },
          12000
        );
      }
    }
  },
  {
    name: "flag-hearts-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "spectator", "musa1"]);
      await ctx.invoke("control", "activar_banderas_musas");
      await ctx.waitForState(
        "flags active",
        (state) => state.musas.banderas.activa === true,
        6000
      );
      await ctx.waitForVisible("musa1", "#overlay", true, "musa flag overlay open", 12000);

      await ctx.emitHook("scrib_test:simulate_musa_heart", { team: 1 });
      await ctx.waitForState(
        "heart event stored",
        (state) => state.musas.corazones[1].count >= 1,
        6000
      );
      await ctx.waitForChildCount("writer1", "#corazones_escritor", 1, "writer heart rendered");
      await ctx.waitForChildCount("spectator", "#corazones_espectador", 1, "spectator heart rendered");

      await ctx.invoke("control", "activar_banderas_musas");
      await ctx.waitForState(
        "flags inactive",
        (state) => state.musas.banderas.activa === false,
        6000
      );
    }
  },
  {
    name: "teleprompter-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "spectator"]);
      await startGame(ctx);
      const text = "telepromptsync";
      await ctx.setWriterText("writer1", text);
      await ctx.invoke("control", "toggleTeleprompter");
      await ctx.invoke("control", "teleprompterCargarTexto", 1);

      await ctx.waitForState(
        "teleprompter loaded",
        (state) => state.teleprompter.state.text.includes(text) && state.teleprompter.state.source === 1,
        10000
      );
      await ctx.waitForText("spectator", "#teleprompter_text", (value) => value.includes(text), "spectator teleprompter text");
      await ctx.waitForState(
        "teleprompter ack",
        (state) => Boolean(state.teleprompter.ackBySource[1]),
        10000
      );

      await ctx.invoke("control", "teleprompterTogglePlay");
      await ctx.invoke("control", "teleprompterCambiarFuente", 2);
      await ctx.invoke("control", "teleprompterCambiarVelocidad", 5);
      await ctx.invoke("control", "teleprompterBajar");

      await ctx.waitForState(
        "teleprompter controls applied",
        (state) => state.teleprompter.state.playing === true
          && state.teleprompter.state.fontSize > 36
          && state.teleprompter.state.scroll > 0,
        10000
      );
    }
  },
  {
    name: "full-match-no-hooks",
    run: async (ctx) => {
      const expectedModes = [
        "letra bendita",
        "letra prohibida",
        "tertulia",
        "palabras bonus",
        "palabras prohibidas",
        "frase final"
      ];
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "actor2"]);
      await configureFastControlPanel(ctx, {
        tiempo_modos: 2,
        tiempo_votacion: 1,
        tiempo_cambio_letra: 1,
        tiempo_cambio_palabras: 1
      });
      await startGame(ctx, { requireEditable: false });
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      await waitForMode(ctx, "letra bendita", 15000);
      await ctx.setWriterText("writer1", "flujo real azul");
      await ctx.setWriterText("writer2", "flujo real rojo");
      await ctx.waitForState(
        "real flow texts received",
        (state) => state.textos[1].plano.includes("flujo real azul")
          && state.textos[2].plano.includes("flujo real rojo"),
        10000
      );
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("flujo real azul"), "spectator sees real flow text 1");
      await ctx.waitForText("spectator", "#texto1", (text) => text.includes("flujo real rojo"), "spectator sees real flow text 2");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("flujo real azul"), "actor1 sees real flow text");
      await ctx.waitForText("actor2", "#texto", (text) => text.includes("flujo real rojo"), "actor2 sees real flow text");

      await ctx.waitForState(
        "full real timeline reached final mode",
        (state) => expectedModes.every((mode, index) => state.partida.timeline[index]?.modo === mode),
        45000
      );
      await waitForMode(ctx, "frase final", 12000);
      await ctx.waitFor(
        "writer1 editable in final phrase without hooks",
        async () => ctx.evaluate("writer1", () => Boolean(document.querySelector("#texto")?.isContentEditable)),
        10000
      );
      await setWriterFinalPhraseAndTrigger(ctx, "writer1", "cierre azul e2e");
      await ctx.waitForState(
        "writer1 completed final phrase without hooks",
        (state) => state.partida.fin_j1 === true && state.partida.modo_actual === "frase final",
        10000
      );
    }
  },
  {
    name: "reconnect-writer-mid-level",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "spectator", "actor1"]);
      await configureFastControlPanel(ctx, {
        tiempo_minutos: 5,
        tiempo_segundos: 0,
        tiempo_modos: 5,
        tiempo_cambio_letra: 5,
        tiempo_cambio_palabras: 5
      });
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);

      await ctx.setWriterText("writer1", "reconexion escritora inicial");
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("reconexion escritora inicial"), "spectator sees initial writer text");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("reconexion escritora inicial"), "actor sees initial writer text");

      await ctx.closeRole("writer1");
      await ctx.waitForState(
        "writer1 disconnected",
        (state) => state.connections.writers[1].connected === false,
        10000
      );

      await openRolesAndWait(ctx, ["writer1"]);
      await waitForMode(ctx, "palabras bonus", 8000);
      await freezeWriterDecay(ctx, "writer1");
      await ctx.waitForText("writer1", "#palabra", (text) => text.trim().length > 0, "writer1 mode title after reconnect");
      await ctx.setWriterText("writer1", "reconexion escritora final");
      await ctx.waitForState(
        "writer1 server state updated after reconnect",
        (state) => state.textos[1].plano.includes("reconexion escritora final"),
        10000
      );
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("reconexion escritora final"), "spectator sees reconnected writer text");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("reconexion escritora final"), "actor sees reconnected writer text");
    }
  },
  {
    name: "reconnect-spectator-recovers-state",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator"]);
      await startGame(ctx);
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      await ctx.setWriterText("writer1", "spectatorazul");
      await ctx.setWriterText("writer2", "spectatorrojo");
      await ctx.waitForState(
        "server stored spectator reconnect texts",
        (state) => state.textos[1].plano.includes("spectatorazul")
          && state.textos[2].plano.includes("spectatorrojo"),
        10000
      );
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("spectatorazul"), "spectator sees blue text before reconnect");
      await ctx.waitForText("spectator", "#texto1", (text) => text.includes("spectatorrojo"), "spectator sees red text before reconnect");

      await ctx.closeRole("spectator");
      await ctx.waitForState(
        "spectator disconnected",
        (state) => state.connections.spectator.connected === false,
        10000
      );

      await openRolesAndWait(ctx, ["spectator"]);
      await waitForMode(ctx, "palabras bonus", 8000);
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("spectatorazul"), "spectator restored blue text");
      await ctx.waitForText("spectator", "#texto1", (text) => text.includes("spectatorrojo"), "spectator restored red text");
      await ctx.waitForText("spectator", "#palabra", (text) => text.trim().length > 0, "spectator restored mode title");
    }
  },
  {
    name: "resurrection-matrix",
    run: async (ctx) => {
      const prepareCase = async (label, modePayload = { mode: "palabras bonus" }) => {
        await ctx.emitHook("scrib_test:reset", {});
        await ctx.closeAllPages();
        await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator"]);
        await ctx.emitHook("scrib_test:force_mode", modePayload);
        await waitForMode(ctx, modePayload.mode, 8000);
        await ctx.setWriterText("writer1", `${label} azul palabras suficientes`);
        await ctx.setWriterText("writer2", `${label} rojo palabras suficientes`);
      };

      await prepareCase("solo-j1", { mode: "palabras bonus" });
      await ctx.emitHook("scrib_test:force_finish_player", { player: 1, reiniciar: false });
      await resolveResurrection(ctx, "writer1", 1, "yes");
      await ctx.waitForState(
        "writer1 resurrected in matrix",
        (state) => state.partida.fin_j1 === false && state.resurreccion[1].visible === false,
        10000
      );

      await prepareCase("solo-j2", { mode: "letra prohibida", letra: "Q" });
      await ctx.emitHook("scrib_test:force_finish_player", { player: 2, reiniciar: false });
      await resolveResurrection(ctx, "writer2", 2, "yes");
      await ctx.waitForState(
        "writer2 resurrected in matrix",
        (state) => state.partida.fin_j2 === false && state.resurreccion[2].visible === false,
        10000
      );

      await prepareCase("ambas", { mode: "palabras bonus" });
      await ctx.emitHook("scrib_test:force_finish_player", { player: 1, reiniciar: false });
      await resolveResurrection(ctx, "writer1", 1, "yes");
      await ctx.emitHook("scrib_test:force_finish_player", { player: 2, reiniciar: false });
      await resolveResurrection(ctx, "writer2", 2, "yes");
      await ctx.waitForState(
        "both writers resurrected in matrix",
        (state) => state.partida.fin_j1 === false
          && state.partida.fin_j2 === false
          && state.resurreccion[1].visible === false
          && state.resurreccion[2].visible === false,
        10000
      );

      await prepareCase("ninguna", { mode: "palabras bonus" });
      await ctx.emitHook("scrib_test:force_finish_player", { player: 1, reiniciar: false });
      await ctx.waitForState(
        "writer1 remains finished without resurrection",
        (state) => state.partida.fin_j1 === true,
        8000
      );
      await ctx.emitHook("scrib_test:force_finish_player", { player: 2, reiniciar: true });
      await ctx.waitForState(
        "no writers resurrected in matrix",
        (state) => !state.partida.modo_actual
          && state.resurreccion[1].visible === false
          && state.resurreccion[2].visible === false,
        10000
      );
    }
  },
  {
    name: "vote-race-and-tie",
    run: async (ctx) => {
      await ctx.openRoles(["musa1", "musa1b"]);
      await ctx.waitForState(
        "two muses from team1 connected",
        (state) => state.connections.musas[1].count >= 2 && state.connections.musas[1].connected === true,
        12000
      );

      await ctx.emitHook("scrib_test:force_vote", {
        team: 1,
        opciones: ["turtle", "shock", "storm"],
        duracion_ms: 15000
      });
      await ctx.waitForVisible("musa1", "#votacion_ventaja_modal", true, "musa1 race modal open");
      await ctx.waitForVisible("musa1b", "#votacion_ventaja_modal", true, "musa1b race modal open");

      const stateBeforeVote = await ctx.getState();
      const firstOption = stateBeforeVote.votacion_ventaja.opciones[0];
      const secondOption = stateBeforeVote.votacion_ventaja.opciones[1];
      await Promise.all([
        ctx.invoke("musa1", "votarVentajaPorEmoji", firstOption),
        ctx.invoke("musa1b", "votarVentajaPorEmoji", secondOption)
      ]);
      await ctx.waitForState(
        "tie registered across two muses",
        (state) => {
          const votos = state.votacion_ventaja.votos || {};
          const total = Object.values(votos).reduce((acc, value) => acc + Number(value || 0), 0);
          return total === 2
            && Number(votos[firstOption] || 0) === 1
            && Number(votos[secondOption] || 0) === 1;
        },
        10000
      );

      await ctx.invoke("musa1b", "votarVentajaPorEmoji", firstOption);
      await ctx.waitForState(
        "duplicate vote from second muse ignored",
        (state) => {
          const votos = state.votacion_ventaja.votos || {};
          const total = Object.values(votos).reduce((acc, value) => acc + Number(value || 0), 0);
          return total === 2
            && Number(votos[firstOption] || 0) === 1
            && Number(votos[secondOption] || 0) === 1;
        },
        8000
      );

      const closeResult = await ctx.emitHook("scrib_test:force_vote", {
        active: false,
        emitir_resultado: false
      });
      ctx.assert(
        [firstOption, secondOption].includes(closeResult.vote.seleccion),
        `Unexpected tie-break selection: ${closeResult.vote.seleccion}`
      );
      await ctx.waitForVisible("musa1", "#votacion_ventaja_modal", false, "musa1 race modal closed");
      await ctx.waitForVisible("musa1b", "#votacion_ventaja_modal", false, "musa1b race modal closed");
    }
  }
];

const chaosSpecs = [
  {
    name: "control-reconnect-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "spectator"]);
      await startGame(ctx);
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);
      await freezeWriterDecay(ctx, "writer1");

      await ctx.setWriterText("writer1", "caos control inicial");
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("caos control inicial"), "spectator sees initial control-chaos text");

      await ctx.closeRole("control");
      await ctx.waitForState(
        "control disconnected during chaos",
        (state) => state.connections.control.connected === false,
        10000
      );

      await ctx.setWriterText("writer1", "caos control sin panel");
      await ctx.waitForState(
        "server still stores writer text without control",
        (state) => state.textos[1].plano.includes("caos control sin panel"),
        10000
      );
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("caos control sin panel"), "spectator keeps receiving text without control");

      await openRolesAndWait(ctx, ["control"]);
      await ctx.waitForVisible("control", "#boton_escribir", true, "reconnected control booted");
      await ctx.invoke("control", "cambiar_vista_espectador", "stats");
      await ctx.waitForState(
        "reconnected control can still command spectator view",
        (state) => state.connections.control.connected === true
          && state.espectador.override === "stats",
        10000
      );
      await ctx.invoke("control", "cambiar_vista_espectador", "partida");
      await ctx.waitForState(
        "reconnected control restored spectator view",
        (state) => state.espectador.override === "partida",
        10000
      );
    }
  },
  {
    name: "musa-reconnect-mid-vote-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["musa1", "musa1b"]);
      await ctx.emitHook("scrib_test:force_vote", {
        team: 1,
        opciones: ["turtle", "shock", "storm"],
        duracion_ms: 15000
      });
      await ctx.waitForVisible("musa1", "#votacion_ventaja_modal", true, "musa1 chaos vote modal open");
      await ctx.waitForVisible("musa1b", "#votacion_ventaja_modal", true, "musa1b chaos vote modal open");

      await ctx.closeRole("musa1");
      await ctx.waitForState(
        "one musa remains after disconnect",
        (state) => state.connections.musas[1].count === 1 && state.votacion_ventaja.activa === true,
        10000
      );
      await ctx.waitForVisible("musa1b", "#votacion_ventaja_modal", true, "remaining musa keeps vote modal");

      await openRolesAndWait(ctx, ["musa1"]);
      await ctx.waitForVisible("musa1", "#votacion_ventaja_modal", true, "reconnected musa recovers vote modal");

      const stateBeforeVote = await ctx.getState();
      const firstOption = stateBeforeVote.votacion_ventaja.opciones[0];
      const secondOption = stateBeforeVote.votacion_ventaja.opciones[1];
      await Promise.all([
        ctx.invoke("musa1", "votarVentajaPorEmoji", firstOption),
        ctx.invoke("musa1b", "votarVentajaPorEmoji", secondOption)
      ]);

      await ctx.waitForState(
        "reconnected muses vote once each",
        (state) => {
          const votos = state.votacion_ventaja.votos || {};
          const total = Object.values(votos).reduce((acc, value) => acc + Number(value || 0), 0);
          return total === 2
            && Number(votos[firstOption] || 0) === 1
            && Number(votos[secondOption] || 0) === 1;
        },
        10000
      );
    }
  },
  {
    name: "musa-world-entry-start-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "musa1"]);
      await ctx.waitForVisible("musa1", "#musa_world_entry", true, "musa world-entry visible before start");
      await ctx.fillValue("control", "#frase_final_j1", "intro musa azul");
      await ctx.fillValue("control", "#frase_final_j2", "intro musa rojo");
      await ctx.click("control", "#boton_escribir");

      await ctx.waitFor(
        "musa world-entry cleared on game start",
        async () => ctx.evaluate("musa1", () => {
          const overlay = document.querySelector("#musa_world_entry");
          return Boolean(
            overlay
            && !overlay.classList.contains("is-visible")
            && overlay.getAttribute("aria-hidden") === "true"
            && !document.body?.classList.contains("musa-world-entry-activa")
            && !document.body?.classList.contains("musa-world-entry-salida")
          );
        }),
        3000
      );

      await ctx.sleep(7800);

      const musaState = await ctx.evaluate("musa1", () => {
        const overlay = document.querySelector("#musa_world_entry");
        return {
          overlayVisible: Boolean(overlay && overlay.classList.contains("is-visible")),
          ariaHidden: String(overlay?.getAttribute("aria-hidden") || ""),
          overlayClasses: Array.from(overlay?.classList || []),
          bodyClasses: Array.from(document.body?.classList || []),
          percent: String(document.querySelector("#musa_world_entry_percent")?.textContent || "").trim(),
          status: String(document.querySelector("#musa_world_entry_status")?.textContent || "").trim()
        };
      });

      ctx.assert(musaState.overlayVisible === false, "musa world-entry overlay should stay hidden after start churn");
      ctx.assert(musaState.ariaHidden === "true", "musa world-entry aria-hidden should stay true after start churn");
      ctx.assert(!musaState.bodyClasses.includes("musa-world-entry-activa"), "musa world-entry active class should not reappear after start churn");
      ctx.assert(!musaState.bodyClasses.includes("musa-world-entry-salida"), "musa world-entry exit class should not reappear after start churn");
      ctx.assert(!musaState.overlayClasses.includes("musa-world-entry--blackout"), "musa world-entry blackout class should not survive start churn");
      ctx.assert(!musaState.overlayClasses.includes("musa-world-entry--reveal-game"), "musa world-entry reveal class should not survive start churn");
      ctx.assert(musaState.percent === "0%", "musa world-entry progress should reset after invalidation");
      ctx.assert(musaState.status.length > 0, "musa world-entry status should reset to a stable label after invalidation");
    }
  },
  {
    name: "musa-countdown-reset-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "musa1"]);
      await ctx.fillValue("control", "#frase_final_j1", "musa caos azul");
      await ctx.fillValue("control", "#frase_final_j2", "musa caos rojo");
      await ctx.click("control", "#boton_escribir");
      await ctx.waitForVisible("musa1", "#countdown", true, "musa countdown visible after start", 4000);

      await ctx.emitHook("scrib_test:reset", {});
      await ctx.waitForState(
        "server reset after musa countdown start",
        (state) => state.partida.modo_actual === "" && state.partida.fin_del_juego === true,
        10000
      );
      await ctx.sleep(7600);

      const musaState = await ctx.evaluate("musa1", () => {
        const countdown = document.querySelector("#countdown");
        const timer = document.querySelector("#tiempo");
        const evalValue = (expression) => {
          try {
            return window.eval(expression);
          } catch (_error) {
            return null;
          }
        };
        return {
          countdownVisible: Boolean(countdown && window.getComputedStyle(countdown).display !== "none"),
          countdownText: String(countdown?.textContent || "").trim(),
          timerVisible: Boolean(timer && window.getComputedStyle(timer).display !== "none"),
          timerText: String(timer?.textContent || "").trim(),
          bodyText: String(document.body?.textContent || ""),
          introActive: Boolean(evalValue("typeof secuencia_inicio_musa_activa !== 'undefined' && secuencia_inicio_musa_activa === true")),
          postInicioPendiente: Boolean(evalValue("typeof post_inicio_pendiente_musa !== 'undefined' && post_inicio_pendiente_musa === true"))
        };
      });

      ctx.assert(musaState.countdownVisible === false, "musa stale countdown should not survive reset");
      ctx.assert(musaState.countdownText === "", "musa stale countdown text should be cleared after reset");
      ctx.assert(musaState.timerVisible === false, "musa timer should stay hidden after reset");
      ctx.assert(musaState.timerText === "", "musa timer text should stay empty after reset");
      ctx.assert(musaState.introActive === false, "musa intro sequence should not stay active after reset");
      ctx.assert(musaState.postInicioPendiente === false, "musa post-inicio flag should not survive reset");
      ctx.assert(!musaState.bodyText.includes("PREPARADOS"), "musa stale ready prompt should not reappear after reset");
      ctx.assert(!musaState.bodyText.includes("ESCRIBE"), "musa stale write prompt should not reappear after reset");
    }
  },
  {
    name: "musa-disadvantage-mode-churn-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "musa1"]);
      await configureFastControlPanel(ctx, {
        tiempo_modificador: 2
      });
      await startGame(ctx, { requireEditable: false });
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);

      await applyForcedDisadvantage(ctx, 1, PUTADA_BORROSO);
      await ctx.waitFor(
        "musa blur disadvantage visible before churn",
        async () => {
          const state = await ctx.evaluate("musa1", () => ({
            blur: Boolean(document.querySelector("#texto")?.classList.contains("textarea-bruma-musa")),
            blurExit: Boolean(document.querySelector("#texto")?.classList.contains("textarea-bruma-musa-salida"))
          }));
          return state.blur && !state.blurExit ? state : false;
        },
        10000
      );

      await ctx.emitHook("scrib_test:force_mode", { mode: "frase final" });
      await waitForMode(ctx, "frase final", 8000);
      await ctx.sleep(2600);

      const musaState = await ctx.evaluate("musa1", () => {
        const evalFlag = (expression) => {
          try {
            return Boolean(window.eval(expression));
          } catch (_error) {
            return false;
          }
        };
        return {
          textClasses: Array.from(document.querySelector("#texto")?.classList || []),
          bodyClasses: Array.from(document.body?.classList || []),
          blurTimeoutActive: evalFlag("typeof tempo_text_borroso !== 'undefined' && tempo_text_borroso !== null"),
          blurExitTimeoutActive: evalFlag("typeof timeout_bruma_salida_musa !== 'undefined' && timeout_bruma_salida_musa !== null"),
          modePreview: String(window.__scribModoActualMusaPreview || "")
        };
      });

      ctx.assert(musaState.modePreview === "frase final", "musa mode preview should reflect the churned final mode");
      ctx.assert(!musaState.textClasses.includes("textarea-bruma-musa"), "musa blur class should clear after mode churn");
      ctx.assert(!musaState.textClasses.includes("textarea-bruma-musa-salida"), "musa blur exit class should not survive mode churn");
      ctx.assert(musaState.blurTimeoutActive === false, "musa stale blur timeout should not survive mode churn");
      ctx.assert(musaState.blurExitTimeoutActive === false, "musa stale blur-exit timeout should not survive mode churn");
      ctx.assert(!musaState.bodyClasses.includes("bg") && !musaState.bodyClasses.includes("rain"), "musa should not keep stale disadvantage body classes after mode churn");
    }
  },
  {
    name: "musa-warmup-feedback-churn-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["musa1"]);

      await ctx.emitHook("scrib_test:force_warmup_state", {
        activo: true,
        vista: true,
        solicitud: "acciones"
      });
      await ctx.waitFor(
        "musa warmup visible",
        async () => ctx.evaluate("musa1", () => {
          const section = document.querySelector("#calentamiento");
          return Boolean(
            document.body?.classList.contains("vista-calentamiento-musa")
            && section
            && section.classList.contains("activo")
          );
        }),
        10000
      );

      await ctx.sendWarmupWord("musa1", "dos palabras");
      await ctx.waitForText(
        "musa1",
        "#calentamiento_feedback",
        (text) => text.trim().length > 0,
        "musa warmup feedback visible before churn",
        10000
      );

      await ctx.emitHook("scrib_test:force_warmup_state", {
        activo: true,
        vista: true,
        solicitud: "lugares"
      });
      await ctx.waitFor(
        "musa warmup consigna animation active",
        async () => ctx.evaluate("musa1", () => Boolean(document.querySelector("#calentamiento")?.classList.contains("calentamiento-consigna-cambio"))),
        10000
      );

      await ctx.sendWarmupWord("musa1", "biblioteca");
      await ctx.waitFor(
        "musa warmup cooldown active before hide",
        async () => ctx.evaluate("musa1", () => {
          const progressText = String(document.querySelector("#calentamiento_text_progress")?.textContent || "").toLowerCase();
          const progressWidth = parseFloat(String(document.querySelector("#calentamiento_bar_progress")?.style?.width || "0").replace("%", "")) || 0;
          return progressText.includes("inspirando") || progressWidth > 0;
        }),
        10000
      );

      await ctx.emitHook("scrib_test:force_warmup_state", {
        activo: false,
        vista: false,
        solicitud: "lugares"
      });
      await ctx.sleep(3200);

      const musaState = await ctx.evaluate("musa1", () => {
        const evalFlag = (expression) => {
          try {
            return Boolean(window.eval(expression));
          } catch (_error) {
            return false;
          }
        };
        return {
          bodyClasses: Array.from(document.body?.classList || []),
          sectionClasses: Array.from(document.querySelector("#calentamiento")?.classList || []),
          feedbackText: String(document.querySelector("#calentamiento_feedback")?.textContent || "").trim(),
          feedbackClasses: Array.from(document.querySelector("#calentamiento_feedback")?.classList || []),
          cooldownActive: evalFlag("typeof calentamiento_interval_cooldown !== 'undefined' && calentamiento_interval_cooldown !== null"),
          feedbackTimeoutActive: evalFlag("typeof timeout_feedback_calentamiento !== 'undefined' && timeout_feedback_calentamiento !== null"),
          feedbackExitTimeoutActive: evalFlag("typeof timeout_feedback_calentamiento_salida !== 'undefined' && timeout_feedback_calentamiento_salida !== null"),
          destelloTimeoutActive: evalFlag("typeof timeout_destello_calentamiento !== 'undefined' && timeout_destello_calentamiento !== null"),
          consignaTimeoutActive: evalFlag("typeof timeout_animacion_consigna !== 'undefined' && timeout_animacion_consigna !== null")
        };
      });

      ctx.assert(!musaState.bodyClasses.includes("vista-calentamiento-musa"), "musa warmup body class should clear after hide churn");
      ctx.assert(!musaState.sectionClasses.includes("activo"), "musa warmup section should stop being active after hide churn");
      ctx.assert(!musaState.sectionClasses.includes("calentamiento-consigna-cambio"), "musa consigna animation class should not survive hide churn");
      ctx.assert(!musaState.sectionClasses.includes("destello-equipo-1") && !musaState.sectionClasses.includes("destello-equipo-2"), "musa warmup flash classes should clear after hide churn");
      ctx.assert(musaState.feedbackText === "", "musa warmup feedback text should clear after hide churn");
      ctx.assert(!musaState.feedbackClasses.includes("activa") && !musaState.feedbackClasses.includes("is-leaving"), "musa warmup feedback classes should clear after hide churn");
      ctx.assert(musaState.cooldownActive === false, "musa warmup cooldown interval should not survive hide churn");
      ctx.assert(musaState.feedbackTimeoutActive === false, "musa warmup feedback timeout should not survive hide churn");
      ctx.assert(musaState.feedbackExitTimeoutActive === false, "musa warmup feedback-exit timeout should not survive hide churn");
      ctx.assert(musaState.destelloTimeoutActive === false, "musa warmup flash timeout should not survive hide churn");
      ctx.assert(musaState.consignaTimeoutActive === false, "musa warmup consigna timeout should not survive hide churn");
    }
  },
  {
    name: "spectator-disadvantage-mode-churn-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator"]);
      await configureFastControlPanel(ctx, {
        tiempo_modificador: 2
      });
      await startGame(ctx, { requireEditable: false });
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);

      await applyForcedDisadvantage(ctx, 1, PUTADA_BORROSO);
      await ctx.waitFor(
        "spectator blur disadvantage visible before churn",
        async () => {
          const visual = await readSpectatorDisadvantageState(ctx, 1);
          const transient = await ctx.evaluate("spectator", () => ({
            blurry: Boolean(document.querySelector("#texto")?.classList.contains("textarea_blur"))
          }));
          return visual.active && visual.classes.includes("putada-visual--borroso") && transient.blurry;
        },
        10000
      );

      await ctx.emitHook("scrib_test:force_mode", { mode: "frase final" });
      await waitForMode(ctx, "frase final", 8000);
      await ctx.sleep(2600);

      const visualAfter = await readSpectatorDisadvantageState(ctx, 1);
      const transientAfter = await ctx.evaluate("spectator", () => {
        const evalFlag = (expression) => {
          try {
            return Boolean(window.eval(expression));
          } catch (_error) {
            return false;
          }
        };
        return {
          blurry: Boolean(document.querySelector("#texto")?.classList.contains("textarea_blur")),
          bodyClasses: Array.from(document.body?.classList || [])
        };
      });

      ctx.assert(visualAfter.active === false, "spectator blur visual should be cleared after mode churn");
      ctx.assert(transientAfter.blurry === false, "spectator blue text should stay unblurred after mode churn");
      ctx.assert(
        !transientAfter.bodyClasses.includes("bg") && !transientAfter.bodyClasses.includes("rain"),
        "spectator should not keep stale disadvantage body classes after mode churn"
      );
    }
  },
  {
    name: "spectator-countdown-reset-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "spectator"]);
      await ctx.fillValue("control", "#frase_final_j1", "spectator caos azul");
      await ctx.fillValue("control", "#frase_final_j2", "spectator caos rojo");
      await ctx.click("control", "#boton_escribir");
      await ctx.waitForVisible("spectator", "#countdown", true, "spectator countdown visible after start", 4000);

      await ctx.emitHook("scrib_test:reset", {});
      await ctx.waitForState(
        "server reset after spectator countdown start",
        (state) => state.partida.modo_actual === "" && state.partida.fin_del_juego === true,
        10000
      );
      await ctx.sleep(7800);

      const spectatorState = await ctx.evaluate("spectator", () => {
        const countdown = document.querySelector("#countdown");
        const timerBlue = document.querySelector("#tiempo");
        const timerRed = document.querySelector("#tiempo1");
        const evalValue = (expression) => {
          try {
            return window.eval(expression);
          } catch (_error) {
            return null;
          }
        };
        return {
          countdownVisible: Boolean(countdown && window.getComputedStyle(countdown).display !== "none"),
          countdownText: String(countdown?.textContent || "").trim(),
          timerBlueVisible: Boolean(timerBlue && window.getComputedStyle(timerBlue).display !== "none"),
          timerBlueText: String(timerBlue?.textContent || "").trim(),
          timerRedVisible: Boolean(timerRed && window.getComputedStyle(timerRed).display !== "none"),
          timerRedText: String(timerRed?.textContent || "").trim(),
          bodyText: String(document.body?.textContent || ""),
          countdownActive: Boolean(evalValue("typeof cuenta_atras_activa !== 'undefined' && cuenta_atras_activa === true")),
          introDelay: Boolean(evalValue("typeof inicio_modo_delay !== 'undefined' && inicio_modo_delay === true")),
          timerActive: Boolean(evalValue("typeof timer !== 'undefined' && timer !== null")),
          fallbackActive: Boolean(evalValue("typeof timeout_fallback_countdown_espectador !== 'undefined' && timeout_fallback_countdown_espectador !== null"))
        };
      });

      ctx.assert(spectatorState.countdownVisible === false, "spectator stale countdown should not survive reset");
      ctx.assert(spectatorState.countdownText === "", "spectator stale countdown text should be cleared after reset");
      ctx.assert(spectatorState.timerBlueVisible === false, "spectator blue timer should stay hidden after reset");
      ctx.assert(spectatorState.timerBlueText === "", "spectator blue timer text should stay empty after reset");
      ctx.assert(spectatorState.timerRedVisible === false, "spectator red timer should stay hidden after reset");
      ctx.assert(spectatorState.timerRedText === "", "spectator red timer text should stay empty after reset");
      ctx.assert(spectatorState.countdownActive === false, "spectator countdown flag should not survive reset");
      ctx.assert(spectatorState.introDelay === false, "spectator intro delay flag should not survive reset");
      ctx.assert(spectatorState.timerActive === false, "spectator countdown interval should not survive reset");
      ctx.assert(spectatorState.fallbackActive === false, "spectator fallback timeout should not survive reset");
      ctx.assert(!spectatorState.bodyText.includes("¿PREPARADOS?"), "spectator stale ready prompt should not reappear after reset");
      ctx.assert(!spectatorState.bodyText.includes("¡ESCRIBE!"), "spectator stale write prompt should not reappear after reset");
    }
  },
  {
    name: "actor-countdown-reset-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "actor1"]);
      await ctx.fillValue("control", "#frase_final_j1", "actor caos azul");
      await ctx.fillValue("control", "#frase_final_j2", "actor caos rojo");
      await ctx.click("control", "#boton_escribir");
      await ctx.waitForVisible("actor1", "#countdown", true, "actor countdown visible after start", 4000);

      await ctx.emitHook("scrib_test:reset", {});
      await ctx.waitForState(
        "server reset after actor countdown start",
        (state) => state.partida.modo_actual === "" && state.partida.fin_del_juego === true,
        10000
      );
      await ctx.sleep(4500);

      const actorState = await ctx.evaluate("actor1", () => {
        const countdown = document.querySelector("#countdown");
        const timer = document.querySelector("#tiempo");
        return {
          countdownVisible: Boolean(countdown && window.getComputedStyle(countdown).display !== "none"),
          countdownText: String(countdown?.textContent || "").trim(),
          timerVisible: Boolean(timer && window.getComputedStyle(timer).display !== "none"),
          timerText: String(timer?.textContent || "").trim(),
          bodyText: String(document.body?.textContent || "")
        };
      });

      ctx.assert(actorState.countdownVisible === false, "actor stale countdown should not survive reset");
      ctx.assert(actorState.countdownText === "", "actor stale countdown text should be cleared after reset");
      ctx.assert(actorState.timerVisible === false, "actor timer should stay hidden after reset");
      ctx.assert(!actorState.bodyText.includes("¡ESCRIBE!"), "actor stale countdown callback should not reinsert write prompt");
    }
  },
  {
    name: "control-countdown-reset-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "actor1"]);
      await startGame(ctx, { requireEditable: false, useStateHooks: false });
      await ctx.invoke("control", "limpiar");
      await ctx.waitForState(
        "server reset after control countdown start",
        (state) => state.partida.modo_actual === "" && state.partida.fin_del_juego === true,
        10000
      );
      await ctx.sleep(5000);

      const controlState = await ctx.evaluate("control", () => {
        const timeBlue = document.querySelector("#tiempo");
        const timeRed = document.querySelector("#tiempo1");
        const evalValue = (expression) => {
          try {
            return window.eval(expression);
          } catch (_error) {
            return null;
          }
        };
        return {
          timerBlue: String(timeBlue?.textContent || "").trim(),
          timerRed: String(timeRed?.textContent || "").trim(),
          gameStarted: Boolean(evalValue("typeof juego_iniciado !== 'undefined' ? juego_iniciado : false"))
        };
      });
      const actorState = await ctx.evaluate("actor1", () => {
        const countdown = document.querySelector("#countdown");
        const timer = document.querySelector("#tiempo");
        return {
          countdownVisible: Boolean(countdown && window.getComputedStyle(countdown).display !== "none"),
          countdownText: String(countdown?.textContent || "").trim(),
          timerVisible: Boolean(timer && window.getComputedStyle(timer).display !== "none"),
          timerText: String(timer?.textContent || "").trim(),
          bodyText: String(document.body?.textContent || "")
        };
      });

      ctx.assert(controlState.gameStarted === false, "control should remain idle after reset");
      ctx.assert(controlState.timerBlue === "", "control blue timer should stay cleared after reset");
      ctx.assert(controlState.timerRed === "", "control red timer should stay cleared after reset");
      ctx.assert(actorState.countdownVisible === false, "actor should not receive stale countdown after control reset");
      ctx.assert(actorState.countdownText === "", "actor stale countdown text should stay cleared after control reset");
      ctx.assert(actorState.timerVisible === false, "actor timer should stay hidden after control reset");
      ctx.assert(actorState.timerText === "", "actor timer text should stay empty after control reset");
      ctx.assert(!actorState.bodyText.includes("¡ESCRIBE!"), "control stale countdown callback should not reinsert write prompt downstream");
    }
  },
  {
    name: "control-teleprompter-ack-cancel-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1"]);
      await startGame(ctx);
      const text = "teleprompter ack cancel chaos";
      await ctx.setWriterText("writer1", text);
      await ctx.waitForText("control", "#texto", (value) => value.includes(text), "control mirrors writer text before teleprompter ack cancellation", 10000);

      await ctx.invoke("control", "toggleTeleprompter");
      await ctx.invoke("control", "teleprompterCargarTexto", 1);
      await ctx.waitForText(
        "control",
        "#teleprompter_estado_carga",
        (value) => value.toLowerCase().includes("cargando texto j1"),
        "control teleprompter enters loading state before cancellation",
        10000
      );

      await ctx.invoke("control", "toggleTeleprompter");
      await ctx.sleep(4600);

      const controlState = await ctx.evaluate("control", () => {
        const panel = document.querySelector("#panel_teleprompter");
        const status = document.querySelector("#teleprompter_estado_carga");
        const evalValue = (expression) => {
          try {
            return window.eval(expression);
          } catch (_error) {
            return null;
          }
        };
        return {
          status: String(status?.textContent || "").trim().toLowerCase(),
          panelHidden: Boolean(panel?.classList.contains("panel-oculto")),
          teleprompterVisible: Boolean(evalValue("typeof teleprompter_visible !== 'undefined' ? teleprompter_visible : false")),
          ackPending: Boolean(evalValue("typeof teleprompter_espera_ack !== 'undefined' && teleprompter_espera_ack !== null")),
          revision: Number(evalValue("typeof teleprompter_state !== 'undefined' ? teleprompter_state.revision : 0") || 0)
        };
      });

      ctx.assert(controlState.panelHidden === true, "teleprompter panel should stay closed after ack cancellation");
      ctx.assert(controlState.teleprompterVisible === false, "teleprompter should stay hidden after ack cancellation");
      ctx.assert(controlState.ackPending === false, "teleprompter ack wait should be cleared when teleprompter closes");
      ctx.assert(controlState.status.includes("sin carga"), "teleprompter status should reset after cancellation");
      ctx.assert(!controlState.status.includes("sin confirm"), "stale teleprompter ack timeout should not surface after cancellation");
      ctx.assert(!controlState.status.includes("no render"), "stale teleprompter render error should not surface after cancellation");
      ctx.assert(controlState.revision > 0, "teleprompter revision should advance during cancellation flow");
    }
  },
  {
    name: "control-teleprompter-hold-close-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control"]);
      await ctx.invoke("control", "toggleTeleprompter");
      await ctx.evaluate("control", () => {
        const button = document.querySelector("#tp_dpad_right");
        if (!button) {
          throw new Error("Missing teleprompter speed-up button");
        }
        button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      await ctx.sleep(420);

      const speedWhileHolding = Number(await ctx.readText("control", "#teleprompter_speed"));
      ctx.assert(speedWhileHolding > 25, "teleprompter hold should increase speed before closing");

      await ctx.invoke("control", "toggleTeleprompter");
      await ctx.sleep(720);

      const afterClose = await ctx.evaluate("control", () => {
        const panel = document.querySelector("#panel_teleprompter");
        const button = document.querySelector("#tp_dpad_right");
        const speed = Number(document.querySelector("#teleprompter_speed")?.textContent || 0);
        const evalValue = (expression) => {
          try {
            return window.eval(expression);
          } catch (_error) {
            return null;
          }
        };
        return {
          speed,
          panelHidden: Boolean(panel?.classList.contains("panel-oculto")),
          held: Boolean(button?.classList.contains("tp-btn--held")),
          active: Boolean(button?.classList.contains("tp-btn--active")),
          holdFlag: String(button?.dataset?.tpHoldActive || "0"),
          activeIntervals: Number(evalValue("typeof teleprompter_hold_intervals !== 'undefined' ? teleprompter_hold_intervals.size : 0") || 0)
        };
      });

      ctx.assert(afterClose.panelHidden === true, "teleprompter panel should close during hold churn");
      ctx.assert(afterClose.speed === speedWhileHolding, "teleprompter speed should stop changing after panel closes");
      ctx.assert(afterClose.held === false, "teleprompter held class should clear after panel closes");
      ctx.assert(afterClose.active === false, "teleprompter active class should clear after panel closes");
      ctx.assert(afterClose.holdFlag === "0", "teleprompter hold flag should reset after panel closes");
      ctx.assert(afterClose.activeIntervals === 0, "teleprompter hold intervals should be cleared after panel closes");

      await ctx.invoke("control", "toggleTeleprompter");
      await ctx.evaluate("control", () => {
        const button = document.querySelector("#tp_dpad_right");
        if (!button) {
          throw new Error("Missing teleprompter speed-up button");
        }
        button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      await ctx.sleep(260);
      await ctx.evaluate("control", () => {
        const button = document.querySelector("#tp_dpad_right");
        if (!button) {
          throw new Error("Missing teleprompter speed-up button");
        }
        button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });

      const reopened = await ctx.evaluate("control", () => {
        const button = document.querySelector("#tp_dpad_right");
        const speed = Number(document.querySelector("#teleprompter_speed")?.textContent || 0);
        const evalValue = (expression) => {
          try {
            return window.eval(expression);
          } catch (_error) {
            return null;
          }
        };
        return {
          speed,
          held: Boolean(button?.classList.contains("tp-btn--held")),
          holdFlag: String(button?.dataset?.tpHoldActive || "0"),
          activeIntervals: Number(evalValue("typeof teleprompter_hold_intervals !== 'undefined' ? teleprompter_hold_intervals.size : 0") || 0)
        };
      });

      ctx.assert(reopened.speed > speedWhileHolding, "teleprompter hold should work again after reopening");
      ctx.assert(reopened.held === false, "teleprompter button should release cleanly after reopening");
      ctx.assert(reopened.holdFlag === "0", "teleprompter hold flag should clear after a normal release");
      ctx.assert(reopened.activeIntervals === 0, "teleprompter should not leave dangling hold intervals after reopening");
    }
  },
  {
    name: "rapid-mode-churn-chaos",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "actor2"]);
      await startGame(ctx);
      await ctx.waitForVisible("spectator", "#countdown", false, "spectator intro cleared before rapid churn", 10000);
      await ctx.waitForVisible("actor1", "#countdown", false, "actor1 intro cleared before rapid churn", 10000);
      await ctx.waitForVisible("actor2", "#countdown", false, "actor2 intro cleared before rapid churn", 10000);

      const churn = [
        { mode: "letra bendita", letra: "A" },
        { mode: "letra prohibida", letra: "Z" },
        { mode: "palabras bonus" },
        { mode: "palabras prohibidas" },
        { mode: "frase final" }
      ];

      for (const step of churn) {
        await ctx.emitHook("scrib_test:force_mode", step);
        await ctx.sleep(120);
      }

      await ctx.waitForState(
        "final mode reached after rapid churn",
        (state) => state.partida.modo_actual === "frase final"
          && state.partida.timeline.slice(-5).map((entry) => entry.modo).join("|") === churn.map((entry) => entry.mode).join("|"),
        10000
      );
      await ctx.waitFor(
        "actor1 final mode after rapid churn",
        async () => ctx.evaluate("actor1", () => {
          try {
            return window.eval("typeof modo_actual !== 'undefined' ? modo_actual : ''") === "frase final";
          } catch (_error) {
            return false;
          }
        }),
        10000
      );
      await ctx.waitFor(
        "actor2 final mode after rapid churn",
        async () => ctx.evaluate("actor2", () => {
          try {
            return window.eval("typeof modo_actual !== 'undefined' ? modo_actual : ''") === "frase final";
          } catch (_error) {
            return false;
          }
        }),
        10000
      );
      await ctx.waitFor(
        "writer1 editable after rapid churn",
        async () => ctx.evaluate("writer1", () => Boolean(document.querySelector("#texto")?.isContentEditable)),
        10000
      );
      await ctx.waitFor(
        "writer2 editable after rapid churn",
        async () => ctx.evaluate("writer2", () => Boolean(document.querySelector("#texto")?.isContentEditable)),
        10000
      );
      await ctx.sleep(250);

      await ctx.setWriterText("writer1", "caos frase final azul");
      await ctx.setWriterText("writer2", "caos frase final rojo");
      await ctx.waitForState(
        "server stores both texts after rapid churn",
        (state) => state.textos[1].plano.includes("caos frase final azul")
          && state.textos[2].plano.includes("caos frase final rojo"),
        10000
      );
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("caos frase final azul"), "actor1 survives rapid churn", 15000);
      await ctx.waitForText("actor2", "#texto", (text) => text.includes("caos frase final rojo"), "actor2 survives rapid churn", 15000);
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("caos frase final azul"), "spectator keeps blue text after churn", 15000);
      await ctx.waitForText("spectator", "#texto1", (text) => text.includes("caos frase final rojo"), "spectator keeps red text after churn", 15000);
    }
  }
];

module.exports = {
  smokeSpecs,
  onePlayerSpecs,
  coreSpecs,
  visualSpecs,
  chaosSpecs
};
